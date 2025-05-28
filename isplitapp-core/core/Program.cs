using System.Reflection;
using System.Text.Json.Serialization;
using FluentValidation;
using IB.ISplitApp.Core;
using IB.ISplitApp.Core.Devices.Endpoints;
using IB.ISplitApp.Core.Expenses.Endpoints;
using IB.ISplitApp.Core.Infrastructure;
using IB.Utils.Ids;
using Microsoft.Extensions.Primitives;
using Migrations;


var version = Assembly
    .GetEntryAssembly()
    ?.GetCustomAttribute<AssemblyInformationalVersionAttribute>()
    ?.InformationalVersion;

var builder = WebApplication.CreateSlimBuilder(args);

// Setup Id generator
//
builder.Services.AddSingleton<AuidFactory>();
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.TypeInfoResolverChain.Insert(0, AppJsonSerializerContext.Default);
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

// Setup Logging
//
builder.Services.AddLogging(version,  builder.Environment);

// Setup telemetry
//
builder.Services.AddTelemetry(builder.Configuration);

// All exceptions should be in ProblemDetails format
// ValidationException should return 400 and detailed message
//
builder.Services.AddProblemDetails(o => o.CustomizeProblemDetails = ctx => 
{
    ctx.ProblemDetails.Extensions.Add("trace-id", ctx.HttpContext.TraceIdentifier);
    ctx.ProblemDetails.Extensions.Add("instance", $"{ctx.HttpContext.Request.Method} {ctx.HttpContext.Request.Path}");
    
});

// add nswag service for api documentation
//
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApiDocument(c =>
{
    c.Title = "iSplitApp API";
    c.DocumentName = "iSplitApp API documentation";
    c.Version = "v1";
});

// Add Database context
//
var connectionString = builder.Configuration.GetConnectionString("isplitapp")!;
builder.Services.AddLinq2Db(connectionString);

// Add notification config
//
builder.Services.AddFirebase(builder.Configuration);

// Add validation objects
//
builder.Services.AddTransient<IValidator<PartyPayload>, PartyRequestValidator>();
builder.Services.AddTransient<IValidator<ExpensePayload>, ExpensePayloadValidator>();
builder.Services.AddTransient<IValidator<SubscriptionPayload>, SubscriptionPayloadValidator>();
builder.Services.AddTransient<RequestValidator>();

builder.Services.AddEndpoints();

// Add Cors
// Supports environment variable override: CORS_ALLOWED_ORIGINS (comma-separated list)
// Example: CORS_ALLOWED_ORIGINS="https://localhost:3000,https://example.com"
//
builder.Services.AddCors(options =>
{
    // First try to get from environment variable, then fall back to configuration
    var allowedOriginsEnv = Environment.GetEnvironmentVariable("CORS_ALLOWED_ORIGINS");
    var allowedOrigins = !string.IsNullOrEmpty(allowedOriginsEnv) 
        ? allowedOriginsEnv.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
        : builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
        
    options.AddDefaultPolicy(policy => policy
        .WithOrigins(allowedOrigins)
        .AllowCredentials()
        .AllowAnyMethod()
        .AllowAnyHeader()        
        .SetPreflightMaxAge(TimeSpan.FromDays(20)));
});

// App builder /////////////////////
//
var app = builder.Build();

app.UseDefaultFiles();
app.UseStaticFiles(
    new StaticFileOptions
    {
        ServeUnknownFileTypes = true,
        DefaultContentType = "application/json"
    });

// map legacy header to a new one
//
app.Use((context, next) =>
{
    var legacyHeaders = context.Request.Headers[HeaderName.User];
    if (legacyHeaders != StringValues.Empty)
    {
        var legacyHeader = legacyHeaders.FirstOrDefault();
        if (!string.IsNullOrEmpty(legacyHeader) && 
            legacyHeader.Length == 16 &&
            (legacyHeader.StartsWith("CN") || legacyHeader.StartsWith("CM") || legacyHeader.StartsWith("CP") || legacyHeader.StartsWith("CK")))
        {
            context.Request.Headers[HeaderName.Device] = $"0{legacyHeader[..10]}";
        }
    }
    return next(context);
});

app.UseRouting();
app.MapFallbackToFile("index.html");

app.MapEndpoints();

app.UseCors();

// Add custom header
//
app.Use(async (ctx, next) =>
{
    ctx.Response.Headers.TryAdd("X-App-Version", version);
    await next();
});

// Use NSwag instead of Swashbuckle 
//
app.UseOpenApi();
app.UseSwaggerUi();

// Handle and log errors
//
app.UseExceptionHandler(RequestValidator.ValidationExceptionHandler);
app.UseStatusCodePages();
app.UseHttpLogging();

// Run db migrations
//
var migrationRunner = new MigrationRunner(connectionString);
await migrationRunner.EnsureDatabase();
migrationRunner.RunMigrationsUp();

app.Run();



namespace IB.ISplitApp.Core
{
    [JsonSourceGenerationOptions(
        WriteIndented = true,
        PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
    [JsonSerializable(typeof(DeviceInfo))]
    [JsonSerializable(typeof(ExpensePayload[]))]
    [JsonSerializable(typeof(ExpenseInfo[]))]
    [JsonSerializable(typeof(PartyPayload[]))]
    [JsonSerializable(typeof(PartyInfo[]))]
    [JsonSerializable(typeof(BalanceInfo[]))]
    internal partial class AppJsonSerializerContext : JsonSerializerContext;
}
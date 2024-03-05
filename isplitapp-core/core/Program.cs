using System.Reflection;
using System.Text.Json.Serialization;
using FluentValidation;
using IB.ISplitApp.Core.Expenses;
using IB.ISplitApp.Core.Expenses.Data;
using IB.ISplitApp.Core.Expenses.Contract;
using IB.ISplitApp.Core.Users;
using IB.ISplitApp.Core.Utils;

using LinqToDB;
using LinqToDB.AspNet;
using LinqToDB.AspNet.Logging;
using LinqToDB.DataProvider.PostgreSQL;
using Microsoft.AspNetCore.HttpLogging;
using Migrations;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;

var version = Assembly
    .GetEntryAssembly()
    ?.GetCustomAttribute<AssemblyInformationalVersionAttribute>()
    ?.InformationalVersion; 

var builder = WebApplication.CreateSlimBuilder(args);

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.TypeInfoResolverChain.Insert(0, AppJsonSerializerContext.Default);
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

builder.Services.AddHttpLogging(o =>
{
    o.CombineLogs = true;
    o.LoggingFields = HttpLoggingFields.RequestMethod | 
                      HttpLoggingFields.RequestPath |
                      HttpLoggingFields.RequestQuery |
                      HttpLoggingFields.Response |
                      HttpLoggingFields.Duration;
});

// Setup telemetry
//
builder.Services.AddOpenTelemetry()
    .ConfigureResource(resource => resource.AddService("iSplitAppCore"))
    .WithMetrics(metrics => metrics
        .AddAspNetCoreInstrumentation()
        .AddOtlpExporter());

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
var connectionString = builder.Configuration.GetConnectionString("isplitapp");
builder.Services.AddLinqToDBContext<ExpenseDb>((provider, options)
    => options
        .UsePostgreSQL(connectionString!, PostgreSQLVersion.v15)
        .UseDefaultLogging(provider));

// Add validation objects
//
builder.Services.AddTransient<IValidator<PartyPayload>, PartyRequestValidator>();
builder.Services.AddTransient<IValidator<ExpensePayload>, ExpensePayloadValidator>();
builder.Services.AddTransient<GenericValidator>();

// Add Cors
//
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy => policy
        .SetIsOriginAllowed(origin => CorsUtil.IsValidOrigin().IsMatch(origin))
        .AllowCredentials()
        .AllowAnyMethod()
        .AllowAnyHeader()        
        .WithExposedHeaders("X-Created-Id")
        .SetPreflightMaxAge(TimeSpan.FromDays(20)));
});

var app = builder.Build();

app.UseDefaultFiles();
app.UseStaticFiles(new StaticFileOptions
    {
        ServeUnknownFileTypes = true,
        DefaultContentType = "application/json"
    });
app.UseRouting();
app.MapFallbackToFile("index.html");

app.MapGet("/login", UserCommand.Login).WithName("Login");

var partyApi = app.MapGroup("/parties");
partyApi.MapPost("/", ExpenseCommand.PartyCreate).WithName("CreateParty");
partyApi.MapPut("/{partyId}", ExpenseCommand.PartyUpdate).WithName("UpdateParty");
partyApi.MapGet("/{partyId}", ExpenseCommand.PartyGet).WithName("GetParty");
partyApi.MapGet("/", ExpenseCommand.PartyListGet).WithName("ListParty");
partyApi.MapGet("/{partyId}/balance", ExpenseCommand.PartyBalanceGet).WithName("GetPartyBalance");
partyApi.MapDelete("/{partyId}", ExpenseCommand.PartyUnfollow).WithName("UnfollowParty");

partyApi.MapPost("/{partyId}/expenses", ExpenseCommand.ExpenseCreate).WithName("CreateExpense");
partyApi.MapGet("/{partyId}/expenses", ExpenseCommand.PartyExpenseListGet).WithName("GetPartyExpenseList");

var expenseApi = app.MapGroup("/expenses");
expenseApi.MapPut("/{expenseId}", ExpenseCommand.ExpenseUpdate).WithName("UpdateExpense");
expenseApi.MapGet("/{expenseId}", ExpenseCommand.ExpenseGet).WithName("GetExpense");
expenseApi.MapDelete("/{expenseId}", ExpenseCommand.ExpenseDelete).WithName("DeleteExpense");


app.UseCors();

// Add custom header
//
app.Use(async (ctx, next) =>
{
    ctx.Response.Headers.TryAdd("X-App-Version", version);
    await next();
});

// Use NSwag instead of Swashbuckle as NSwag is supporting AOT
//
app.UseOpenApi();
app.UseSwaggerUi();

// Handle and log errors
//
app.UseExceptionHandler();
app.UseStatusCodePages();
app.UseHttpLogging();

// Run db migrations
//
var migrationRunner = new MigrationRunner(connectionString!);
migrationRunner.EnsureDatabase();
migrationRunner.RunMigrationsUp();

app.Run();



[JsonSourceGenerationOptions(
    WriteIndented = true,
    PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
[JsonSerializable(typeof(User))]
[JsonSerializable(typeof(ExpensePayload[]))]
[JsonSerializable(typeof(ExpenseInfo[]))]
[JsonSerializable(typeof(PartyPayload[]))]
[JsonSerializable(typeof(PartyInfo[]))]
[JsonSerializable(typeof(BalanceInfo[]))]
internal partial class AppJsonSerializerContext : JsonSerializerContext;
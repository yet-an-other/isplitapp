using System.Diagnostics;
using System.Reflection;
using FirebaseAdmin;
using Google.Apis.Auth.OAuth2;
using IB.ISplitApp.Core.Devices.Data;
using IB.ISplitApp.Core.Devices.Notifications;
using IB.ISplitApp.Core.Expenses.Data;
using IB.Utils.Ids.Converters;
using LinqToDB;
using LinqToDB.AspNet;
using LinqToDB.AspNet.Logging;
using LinqToDB.DataProvider.PostgreSQL;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Npgsql;
using OpenTelemetry;
using OpenTelemetry.Extensions.Propagators;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using WebPush;

namespace IB.ISplitApp.Core.Infrastructure;

/// <summary>
/// Extensions to register Endpoints
/// </summary>
public static class ServiceExtension
{
    /// <summary>
    /// Scan assembly and add IEndpoint to the ServiceCollection
    /// Use current assembly to search for <see cref="IEndpoint"/> 
    /// </summary>
    /// <param name="services"><see cref="ServiceCollection"/> to add endpoints</param>
    /// <returns><see cref="ServiceCollection"/> for fluent interface</returns>
    public static IServiceCollection AddEndpoints(
        this IServiceCollection services)
    {
        return AddEndpoints(services, typeof(ServiceExtension).Assembly);
    }    
    
    /// <summary>
    /// Scan assembly and add IEndpoint to the ServiceCollection 
    /// </summary>
    /// <param name="services"><see cref="ServiceCollection"/> to add endpoints</param>
    /// <param name="assembly">The assembly where to search</param>
    /// <returns><see cref="ServiceCollection"/> for fluent interface</returns>
    public static IServiceCollection AddEndpoints(
        this IServiceCollection services,
        Assembly assembly)
    {
        var serviceDescriptors = assembly
            .DefinedTypes
            .Where(type => type is { IsAbstract: false, IsInterface: false } &&
                           type.IsAssignableTo(typeof(IEndpoint)))
            .Select(type => ServiceDescriptor.Transient(typeof(IEndpoint), type))
            .ToArray();

        services.TryAddEnumerable(serviceDescriptors);

        return services;
    }
    
    /// <summary>
    /// Register endpoints in the app
    /// </summary>
    /// <param name="app"></param>
    public static IApplicationBuilder MapEndpoints (
        this WebApplication app)
    {
        var endpoints = app
            .Services
            .GetRequiredService<IEnumerable<IEndpoint>>();

        var logFactory = app.Services.GetService<ILoggerFactory>();
        var logger = logFactory?.CreateLogger(typeof(ServiceExtension));

        foreach (var endpoint in endpoints)
        {
            endpoint.Build(
                app.MapMethods(
                    endpoint.PathPattern,
                    [endpoint.Method],
                    endpoint.Endpoint));
            logger?.LogInformation("Register endpoint: {method} {pattern}", endpoint.Method, endpoint.PathPattern);
        }
        
        return app;
    }


    /// <summary>
    /// Setup & add Open Telemetry services
    /// </summary>
    /// <param name="services"><see cref="IServiceCollection"/></param>
    /// <param name="configuration">entity of  builder configuration</param>
    /// <exception cref="ArgumentException">If configuration</exception>
    public static void AddTelemetry(this IServiceCollection services, IConfiguration configuration)
    {
        var activitySource = new ActivitySource("iSplitAppCore");
        var otelCollectorEndpoint = configuration["OtelCollectorEndpoint"];
        if (otelCollectorEndpoint == null)
            throw new ArgumentException("Can't find 'OtelCollectorEndpoint' in config");
        
        services
            .AddOpenTelemetry()
            .ConfigureResource(resource => resource.AddService("iSplitAppCore"))
            .WithMetrics(metrics => metrics
                .AddAspNetCoreInstrumentation()
                .AddRuntimeInstrumentation()
                .AddProcessInstrumentation()
                .AddMeter("Microsoft.AspNetCore.Hosting")
                .AddMeter("Microsoft.AspNetCore.Server.Kestrel")
                .AddMeter("Microsoft.AspNetCore.Http.Connections")
                .AddMeter("Microsoft.AspNetCore.Routing")
                .AddMeter("Microsoft.AspNetCore.Diagnostics")
                .AddMeter("Microsoft.AspNetCore.RateLimiting")
                .AddOtlpExporter(oltpOptions => oltpOptions.Endpoint = new Uri(otelCollectorEndpoint)))
            .WithTracing(tracing =>
            {
                tracing.AddAspNetCoreInstrumentation();
                tracing.AddNpgsql();
                tracing.AddSource(activitySource.Name);
                Sdk.SetDefaultTextMapPropagator(new B3Propagator());
                tracing.AddOtlpExporter(oltpOptions => oltpOptions.Endpoint = new Uri(otelCollectorEndpoint));
            });
    }

    /// <summary>
    /// Add linq2db 
    /// </summary>
    /// <param name="services"><see cref="IServiceCollection"/></param>
    /// <param name="connectionString"> Connection string</param>
    public static IServiceCollection AddLinq2Db(this IServiceCollection services, string connectionString)
    {
        return services
            .AddLinqToDBContext<ExpenseDb>((provider, options)
                => options
                    .UseMappingSchema(Linq2DbConverter.AuidInt64MappingSchema())
                    .UsePostgreSQL(
                        connectionString!,
                        PostgreSQLVersion.v15,
                        _ => new PostgreSQLOptions(NormalizeTimestampData: false))
                    .UseDefaultLogging(provider))
            .AddLinqToDBContext<DeviceDb>((provider, options)
                => options
                    .UseMappingSchema(Linq2DbConverter.AuidInt64MappingSchema())
                    .UsePostgreSQL(
                        connectionString!,
                        PostgreSQLVersion.v15,
                        _ => new PostgreSQLOptions(NormalizeTimestampData: false))
                    .UseDefaultLogging(provider));
    }

    /// <summary>
    /// Add Notification services
    /// </summary>
    /// <param name="services"></param>
    /// <param name="configuration"></param>
    public static void AddFirebase(this IServiceCollection services, IConfiguration configuration)
    {
        var section = configuration.GetSection("Vapid");
        var vapidDetails = (VapidDetails)section.Get(typeof(VapidDetails))!;
        services.AddSingleton(vapidDetails);

        var fbkeyPath = Path.Combine(
            AppDomain.CurrentDomain.BaseDirectory,
            configuration["FirebaseKeyFilePath"]!);
        FirebaseApp.Create(
            new AppOptions
            {
                Credential = GoogleCredential.FromFile(fbkeyPath)
            });
        services.AddTransient<NotificationService>();
    }
}
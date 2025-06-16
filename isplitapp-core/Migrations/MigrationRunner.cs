using System.Reflection;
using FluentMigrator;
using FluentMigrator.Runner;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Console;
using Npgsql;

namespace Migrations;

/// <summary>
/// Migration runner that uses the same logging configuration as the main application.
/// Supports configuration-based logging levels, SQL visibility, and environment-specific formatting.
/// </summary>
public class MigrationRunner
{
    private readonly IMigrationRunner _migrationRunner;
    private readonly IServiceProvider _serviceProvider;
    private readonly string _connectionString;

    /// <summary>
    /// Initializes a new instance of MigrationRunner with basic configuration.
    /// Uses default logging configuration (console with Information level).
    /// </summary>
    /// <param name="connectionString">Database connection string</param>
    public MigrationRunner(string connectionString) : this(new ServiceCollection(), connectionString)
    {
    }
    
    /// <summary>
    /// Initializes a new instance of MigrationRunner with custom service collection.
    /// Uses default logging configuration (console with Information level).
    /// </summary>
    /// <param name="serviceCollection">Service collection to configure</param>
    /// <param name="connectionString">Database connection string</param>
    public MigrationRunner(ServiceCollection serviceCollection, string connectionString) 
        : this(serviceCollection, connectionString, null, null)
    {
    }

    /// <summary>
    /// Initializes a new instance of MigrationRunner with full configuration support.
    /// Uses the same logging configuration as the main application when configuration and environment are provided.
    /// </summary>
    /// <param name="serviceCollection">Service collection to configure</param>
    /// <param name="connectionString">Database connection string</param>
    /// <param name="configuration">Application configuration (null for default logging)</param>
    /// <param name="environment">Host environment (null for default logging)</param>
    public MigrationRunner(ServiceCollection serviceCollection, string connectionString, IConfiguration? configuration, IHostEnvironment? environment)
    {
        _connectionString = connectionString;
        
        // Configure FluentMigrator services
        serviceCollection
            .AddFluentMigratorCore()
            .ConfigureRunner(rb => rb
                .WithGlobalStripComments(true)
                .AddPostgres()
                .WithGlobalConnectionString(connectionString)
                .ScanIn(GetType().Assembly).For.Migrations()
                .ScanIn(Assembly.Load("Migrations")).For.EmbeddedResources())
            .Configure<FluentMigratorLoggerOptions>(options =>
            {
                options.ShowSql = GetShowSqlFromConfiguration(configuration);
            });

        // Configure logging using the same pattern as the main application
        ConfigureLogging(serviceCollection, configuration, environment);
        
        _serviceProvider = serviceCollection.BuildServiceProvider(false);
        _migrationRunner = _serviceProvider.GetRequiredService<IMigrationRunner>();
    }
    
    private static void ConfigureLogging(IServiceCollection services, IConfiguration? configuration, IHostEnvironment? environment)
    {
        if (configuration != null && environment != null)
        {
            // Use the same logging configuration as the main application
            services.AddLogging(builder =>
            {
                builder.AddConfiguration(configuration.GetSection("Logging"));
                
                if (configuration["Logging:Console:FormatterName"] == "json")
                {
                    builder.AddJsonConsole();
                }
                else
                {
                    builder.AddSimpleConsole();
                }

            });
        }
        else
        {
            // Fallback to basic console logging if configuration is not available
            services.AddLogging(builder =>
            {
                builder.AddConsole();
                builder.SetMinimumLevel(LogLevel.Debug);
            });
        }
    }
    
    private static bool GetShowSqlFromConfiguration(IConfiguration? configuration)
    {
        // Check if ShowSql should be enabled based on configuration
        // Enable SQL logging in development or when explicitly configured
        if (configuration != null)
        {
            // Check for explicit FluentMigrator configuration
            var showSql = configuration.GetValue<bool?>("FluentMigrator:ShowSql");
            if (showSql.HasValue)
                return showSql.Value;
                
            // Check logging level for LinqToDB.Data as a proxy for SQL logging preference
            var linqToDbLogLevel = configuration.GetValue<string>("Logging:LogLevel:LinqToDB.Data");
            if (!string.IsNullOrEmpty(linqToDbLogLevel) && 
                Enum.TryParse<LogLevel>(linqToDbLogLevel, out var logLevel))
            {
                return logLevel <= LogLevel.Debug;
            }
        }
        
        // Default to showing SQL in development-like scenarios
        return true;
    }    
    
    public async Task EnsureDatabase()
    {
        var log = _serviceProvider.GetService<ILogger<MigrationRunner>>();
        

        NpgsqlConnectionStringBuilder connBuilder = new()
        {
            ConnectionString = _connectionString
        };

        string dbName = connBuilder.Database!;

        var masterConnection = _connectionString.Replace($"Database={dbName}", "Database=postgres");
        log?.LogDebug($"Using master connection string '{masterConnection}' to check database existence");    
        log?.LogInformation($"Check if database exists '{dbName}'");
        
        await using NpgsqlConnection connection = new(masterConnection);
        connection.Open();
        await using var checkIfExistsCommand = new NpgsqlCommand(
            $"SELECT 1 FROM pg_catalog.pg_database WHERE datname = '{dbName}'", connection);
        var result = checkIfExistsCommand.ExecuteScalar();

        if (result != null) return;
        
        log?.LogInformation($"Trying to create database '{dbName}'");
        await using var command = new NpgsqlCommand($"CREATE DATABASE \"{dbName}\"", connection);
        command.ExecuteNonQuery();
    }

    /// <summary>
    /// Run all available migrations forward
    /// </summary>
    public void RunMigrationsUp()
    {
        _migrationRunner.MigrateUp();
    }

    /// <summary>
    /// Up migration to the specific version
    /// </summary>
    /// <param name="migration"></param>
    public void RunMigrationUp(IMigration migration)
    {
        _migrationRunner.Up(migration);
    }
    
    /// <summary>
    /// Down migration to the specific version
    /// </summary>
    /// <param name="migration">Specific migration to run down</param>
    public void RunMigrationDown(IMigration migration)
    {
        _migrationRunner.Down(migration);
    }
}
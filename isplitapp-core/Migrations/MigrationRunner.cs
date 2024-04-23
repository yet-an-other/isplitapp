using System.Reflection;
using FluentMigrator;
using FluentMigrator.Runner;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Npgsql;

namespace Migrations;

public class MigrationRunner
{
    private readonly IMigrationRunner _migrationRunner;
    private readonly IServiceProvider _serviceProvider;
    private readonly string _connectionString;

    public MigrationRunner(string connectionString) : this(new ServiceCollection(), connectionString)
    {
    }
    
    public MigrationRunner(ServiceCollection serviceCollection, string connectionString)
    {
        _connectionString = connectionString;
        _serviceProvider = serviceCollection
            .AddFluentMigratorCore()
            .ConfigureRunner(rb => rb
                .WithGlobalStripComments(true)
                .AddPostgres()
                .WithGlobalConnectionString(connectionString)
                .ScanIn(GetType().Assembly).For.Migrations()
                .ScanIn(Assembly.Load("Migrations")).For.EmbeddedResources())
            .AddLogging(builder => builder.AddDebug().AddConsole())
            .Configure<FluentMigratorLoggerOptions>(options =>
            {
                options.ShowSql = true;
            })
            .BuildServiceProvider(false);
        
        _migrationRunner = _serviceProvider
            .GetRequiredService<IMigrationRunner>();
    }    
    
    public async Task EnsureDatabase()
    {
        var log = _serviceProvider.GetService<ILogger<MigrationRunner>>();

        NpgsqlConnectionStringBuilder connBuilder = new()
        {
            ConnectionString = _connectionString
        };

        string dbName = connBuilder.Database!;

        var masterConnection = _connectionString.Replace(dbName, "postgres");

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
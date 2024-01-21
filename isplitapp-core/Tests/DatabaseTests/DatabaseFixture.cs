using System.Reflection;

using Microsoft.Extensions.Configuration;
using Migrations;


namespace Tests.DatabaseTests;

public class DatabaseFixture : IDisposable
{
    private readonly MigrationRunner _migrationRunner;
    private readonly string _connectionString;
    
    public DatabaseFixture()
    {
        var config = new ConfigurationBuilder()
            .SetBasePath(AppContext.BaseDirectory)
            .AddJsonFile("appsettings.test.json", true, true)
            .AddUserSecrets(Assembly.GetExecutingAssembly())
            .Build();
        _connectionString = config.GetConnectionString("isplitapp-test")!;

        _migrationRunner = new MigrationRunner(_connectionString);
        _migrationRunner.RunMigrationsUp();
    }

    public string ConnectionString => _connectionString;

    public void Dispose()
    {
        _migrationRunner.RunMigrationDown(new InitDatabaseMigration());
    }
}
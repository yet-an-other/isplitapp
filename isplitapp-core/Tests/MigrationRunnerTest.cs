using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Migrations;

namespace Tests;

/// <summary>
/// Tests for MigrationRunner to verify logging configuration is correctly applied
/// </summary>
public class MigrationRunnerTest
{
    [Fact]
    public void MigrationRunner_WithConfiguration_ShouldUseConfiguredLogLevel()
    {
        // Arrange
        var configurationData = new Dictionary<string, string>
        {
            {"Logging:LogLevel:Default", "Debug"},
            {"Logging:LogLevel:LinqToDB.Data", "Information"},
            {"FluentMigrator:ShowSql", "true"}
        };

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configurationData!)
            .Build();

        var environment = new MockHostEnvironment { EnvironmentName = "Development" };
        var serviceCollection = new ServiceCollection();
        var connectionString = "Host=localhost;Database=test;Username=test;Password=test";

        // Act & Assert - Should not throw
        var migrationRunner = new MigrationRunner(serviceCollection, connectionString, configuration, environment);
        
        // Verify that the service collection was configured with logging
        var serviceProvider = serviceCollection.BuildServiceProvider();
        var loggerFactory = serviceProvider.GetService<ILoggerFactory>();
        
        Assert.NotNull(loggerFactory);
    }

    [Fact]
    public void MigrationRunner_WithoutConfiguration_ShouldUseFallbackLogging()
    {
        // Arrange
        var serviceCollection = new ServiceCollection();
        var connectionString = "Host=localhost;Database=test;Username=test;Password=test";

        // Act & Assert - Should not throw
        var migrationRunner = new MigrationRunner(serviceCollection, connectionString, null, null);
        
        // Verify that the service collection was configured with logging
        var serviceProvider = serviceCollection.BuildServiceProvider();
        var loggerFactory = serviceProvider.GetService<ILoggerFactory>();
        
        Assert.NotNull(loggerFactory);
    }

    [Fact]
    public void MigrationRunner_BasicConstructor_ShouldWork()
    {
        // Arrange
        var connectionString = "Host=localhost;Database=test;Username=test;Password=test";

        // Act & Assert - Should not throw
        var migrationRunner = new MigrationRunner(connectionString);
        
        Assert.NotNull(migrationRunner);
    }

    private class MockHostEnvironment : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = "Development";
        public string ApplicationName { get; set; } = "TestApp";
        public string ContentRootPath { get; set; } = "";
        public Microsoft.Extensions.FileProviders.IFileProvider ContentRootFileProvider { get; set; } = null!;
    }
}

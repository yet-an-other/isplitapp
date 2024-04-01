using FluentValidation;
using IB.ISplitApp.Core.Expenses.Contract;
using IB.ISplitApp.Core.Users;
using IB.ISplitApp.Core.Users.Contract;
using IB.ISplitApp.Core.Users.Data;
using IB.ISplitApp.Core.Utils;
using LinqToDB;
using LinqToDB.DataProvider.PostgreSQL;
using Microsoft.Extensions.DependencyInjection;

namespace Tests.DatabaseTests;

[Collection("database")]
public class UserCommandTest : IClassFixture<DatabaseFixture>, IDisposable, IAsyncDisposable
{
    private readonly UserDb _db;
    private readonly IServiceProvider _serviceProvider;
    private readonly GenericValidator _validator;
    
    public UserCommandTest(DatabaseFixture databaseFixture)
    {
        _db = new UserDb(
            new DataOptions<UserDb>(
                new DataOptions()
                    .UsePostgreSQL(databaseFixture.ConnectionString, PostgreSQLVersion.v15)));

        var collection = new ServiceCollection();
        collection.AddTransient<IValidator<PartyPayload>, PartyRequestValidator>();
        collection.AddTransient<IValidator<ExpensePayload>, ExpensePayloadValidator>();
        collection.AddTransient<IValidator<SubscriptionPayload>, SubscriptionPayloadValidator>();
        _serviceProvider = collection.BuildServiceProvider();
        _validator = new GenericValidator(_serviceProvider);
    }
    
    public void Dispose()
    {
        _db.Dispose();
    }

    public async ValueTask DisposeAsync()
    {
        await _db.DisposeAsync();
    }


    [Fact]
    public async Task SecondInsertShouldNotThrowError()
    {
        // Arrange
        //
        var userId = IdUtil.NewId();
        
        var payload1 = new SubscriptionPayload
        {
            Endpoint = "https://url1",
            Keys = new FcmKeys
            {
                Auth = "some auth",
                P256Dh = "fake key"
            }
        };
        
        var payload2 = new SubscriptionPayload
        {
            Endpoint = "https://url1",
            Keys = new FcmKeys
            {
                Auth = "some auth 2",
                P256Dh = "fake key 2"
            }
        };        
        
        // Act
        //
        await UserCommand.RegisterSubscription(userId, payload1, _validator, _db);
        await UserCommand.RegisterSubscription(userId, payload2, _validator, _db);
        
        // Assert
        //
        var subscribers = _db.Subscriptions.Select(s => s).ToArray();

        Assert.Single(subscribers);
    }
}
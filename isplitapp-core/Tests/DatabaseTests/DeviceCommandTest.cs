using FluentValidation;
using IB.ISplitApp.Core.Devices;
using IB.ISplitApp.Core.Devices.Data;
using IB.ISplitApp.Core.Devices.Endpoints;
using IB.ISplitApp.Core.Expenses.Endpoints;
using IB.ISplitApp.Core.Infrastructure;
using IB.Utils.Ids;
using IB.Utils.Ids.Converters;
using LinqToDB;
using LinqToDB.DataProvider.PostgreSQL;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Tests.DatabaseTests;

[Collection("database")]
public class DeviceCommandTest : IClassFixture<DatabaseFixture>, IDisposable, IAsyncDisposable
{
    private readonly DeviceDb _db;
    private readonly RequestValidator _validator;
    private readonly AuidFactory _auidFactory = new();

    public DeviceCommandTest(DatabaseFixture databaseFixture)
    {
        _db = new DeviceDb(
            new DataOptions<DeviceDb>(
                new DataOptions()
                    .UseMappingSchema(Linq2DbConverter.AuidInt64MappingSchema())
                    .UsePostgreSQL(databaseFixture.ConnectionString, PostgreSQLVersion.v15)));

        var collection = new ServiceCollection();
        collection.AddTransient<IValidator<PartyPayload>, PartyRequestValidator>();
        collection.AddTransient<IValidator<ExpensePayload>, ExpensePayloadValidator>();
        collection.AddTransient<IValidator<SubscriptionPayload>, SubscriptionPayloadValidator>();
        collection.AddSingleton(_auidFactory);
        collection.AddSingleton(_db);
        collection.AddTransient<RequestValidator>(sp => new RequestValidator(sp));
        IServiceProvider serviceProvider = collection.BuildServiceProvider();
        _validator = serviceProvider.GetRequiredService<RequestValidator>();
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
        var deviceId = _auidFactory.NewId();
        
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
        var loggerMoq = new Logger<RegisterSubscription>(new LoggerFactory());
        
        var endpoint = new RegisterSubscription(loggerMoq);
        await (endpoint.Endpoint.DynamicInvoke(deviceId.ToString(), payload1, _validator, _db) as Task)!;
        await (endpoint.Endpoint.DynamicInvoke(deviceId.ToString(), payload2, _validator, _db) as Task)!;
        
        // Assert
        //
        var subscribers = _db.Subscriptions.Select(s => s).ToArray();

        Assert.Single(subscribers);
    }
    
    [Fact]
    public void LoginShouldGenerateNewIdIfNullIdProvided()
    {


        // Act
        //
        var endpoint = new RegisterDevice();

        var emptyIdResult = endpoint.Endpoint.DynamicInvoke(null, _auidFactory) as Ok<DeviceInfo>;
       // var wrongIdResult = endpoint.Endpoint.DynamicInvoke(wrongId, _auidFactory) as Ok<DeviceInfo>;
        
        // Assert
        //
        Assert.True(Auid.TryParse(emptyIdResult!.Value!.Id.ToString(), out _));
        //Assert.True(Auid.TryParse(wrongIdResult!.Value!.Id.ToString(), out _));
        //Assert.NotEqual(emptyIdResult.Value?.Id, wrongIdResult.Value?.Id);
    }

    [Fact]
    public void LoginWithCorrectIdShouldReturnBackTheSame()
    {
        // Setup
        //
        var id = _auidFactory.NewId();

        
        // Act
        //
        var endpoint = new RegisterDevice();
        var idResult = endpoint.Endpoint.DynamicInvoke(id, _auidFactory) as Ok<DeviceInfo>;
        
        // Assert
        //
        Assert.Equal(id, idResult!.Value?.Id);
    }

    [Fact]
    public void LoginShouldThrowExceptionWhenWrongIdPassed()
    {
        // Setup
        //
        var wrongId = "invalid-id-format";
        
        // Act & Assert
        //
        var endpoint = new RegisterDevice();
        
        Assert.Throws<ArgumentException>(() =>
        {
            endpoint.Endpoint.DynamicInvoke(wrongId, _auidFactory);
        });
    }
}
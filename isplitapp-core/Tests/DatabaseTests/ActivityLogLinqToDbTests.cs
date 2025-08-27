using IB.ISplitApp.Core.Expenses.Data;
using IB.Utils.Ids;
using IB.Utils.Ids.Converters;
using LinqToDB;
using LinqToDB.AspNet.Logging;
using LinqToDB.Data;
using LinqToDB.DataProvider.PostgreSQL;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Xunit.Abstractions;

namespace Tests.DatabaseTests;

[Collection("database")]
public class ActivityLogLinqToDbTests : IClassFixture<DatabaseFixture>, IDisposable, IAsyncDisposable
{
    private readonly ExpenseDb _db;
    private readonly AuidFactory _auidFactory = new();

    public ActivityLogLinqToDbTests(DatabaseFixture databaseFixture, ITestOutputHelper output)
    {
        var collection = new ServiceCollection();
        collection.AddSingleton(_auidFactory);
        collection.AddSingleton(LoggerFactory.Create(c => c.AddConsole()));

        collection.AddSingleton<ExpenseDb>(
            sp => new ExpenseDb(
                new DataOptions<ExpenseDb>(
                    new DataOptions()
                        .UseMappingSchema(mappingSchema: Linq2DbConverter.AuidInt64MappingSchema())
                        .UsePostgreSQL(
                            connectionString: databaseFixture.ConnectionString,
                            dialect: PostgreSQLVersion.v15,
                            optionSetter: _ => new PostgreSQLOptions(NormalizeTimestampData: false))
                        .UseDefaultLogging(sp))));;

        IServiceProvider serviceProvider = collection.BuildServiceProvider();
        _db = serviceProvider.GetRequiredService<ExpenseDb>();
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
    public async Task LinqToDb_DirectInsert_ShouldHandleAuidCorrectly()
    {
        // Arrange
        var partyId = _auidFactory.NewId();
        var deviceId = _auidFactory.NewId();
        var activityId = _auidFactory.NewId();
        var entityId = _auidFactory.NewId();
        var timestamp = _auidFactory.Timestamp();

        // Create a party first for foreign key constraint
        await _db.InsertAsync(new Party
        {
            Id = partyId,
            Name = "Test Party",
            Currency = "USD",
            Timestamp = _auidFactory.Timestamp()
        });

        // Act - Direct LinqToDB insert with ActivityLog record
        var activityLog = new ActivityLog
        {
            Id = activityId,
            PartyId = partyId,
            DeviceId = deviceId,
            ActivityType = "TestActivity",
            EntityId = entityId,
            Description = "Direct LinqToDB insert test",
            Created = DateTime.UtcNow,
            Timestamp = timestamp
        };

        await _db.InsertAsync(activityLog);

        // Assert - Verify insertion worked
        var insertedActivity = await _db.ActivityLogs
            .Where(a => a.Id == activityId)
            .SingleAsync();

        Assert.Equal(partyId, insertedActivity.PartyId);
        Assert.Equal(deviceId, insertedActivity.DeviceId);
        Assert.Equal("TestActivity", insertedActivity.ActivityType);
        Assert.Equal(entityId, insertedActivity.EntityId);
        Assert.Equal("Direct LinqToDB insert test", insertedActivity.Description);
        Assert.Equal(timestamp, insertedActivity.Timestamp);
    }

    [Fact]
    public async Task LinqToDb_ValueInsert_ShouldHandleAuidCorrectly()
    {
        // Arrange
        var partyId = _auidFactory.NewId();
        var deviceId = _auidFactory.NewId();
        var activityId = _auidFactory.NewId();
        var entityId = _auidFactory.NewId();
        var timestamp = _auidFactory.Timestamp();

        // Create a party first for foreign key constraint
        await _db.InsertAsync(new Party
        {
            Id = partyId,
            Name = "Test Party",
            Currency = "USD",
            Timestamp = _auidFactory.Timestamp()
        });

        // Act - LinqToDB Value-based insert
        await _db.ActivityLogs
            .Value(a => a.Id, activityId)
            .Value(a => a.PartyId, partyId)
            .Value(a => a.DeviceId, deviceId)
            .Value(a => a.ActivityType, "ValueInsertTest")
            .Value(a => a.EntityId, entityId)
            .Value(a => a.Description, "Value-based insert test")
            .Value(a => a.Created, DateTime.UtcNow)
            .Value(a => a.Timestamp, timestamp)
            .InsertAsync();

        // Assert - Verify insertion worked
        var insertedActivity = await _db.ActivityLogs
            .Where(a => a.Id == activityId)
            .SingleAsync();

        Assert.Equal(partyId, insertedActivity.PartyId);
        Assert.Equal(deviceId, insertedActivity.DeviceId);
        Assert.Equal("ValueInsertTest", insertedActivity.ActivityType);
        Assert.Equal(entityId, insertedActivity.EntityId);
        Assert.Equal("Value-based insert test", insertedActivity.Description);
        Assert.Equal(timestamp, insertedActivity.Timestamp);
    }

    [Fact]
    public async Task LinqToDb_BulkInsert_ShouldHandleAuidCorrectly()
    {
        // Arrange
        var partyId = _auidFactory.NewId();
        var deviceId = _auidFactory.NewId();
        var timestamp = _auidFactory.Timestamp();

        // Create a party first for foreign key constraint
        await _db.InsertAsync(new Party
        {
            Id = partyId,
            Name = "Test Party",
            Currency = "USD",
            Timestamp = _auidFactory.Timestamp()
        });

        var activities = new[]
        {
            new ActivityLog
            {
                Id = _auidFactory.NewId(),
                PartyId = partyId,
                DeviceId = deviceId,
                ActivityType = "BulkTest1",
                EntityId = _auidFactory.NewId(),
                Description = "Bulk insert test 1",
                Created = DateTime.UtcNow,
                Timestamp = timestamp
            },
            new ActivityLog
            {
                Id = _auidFactory.NewId(),
                PartyId = partyId,
                DeviceId = deviceId,
                ActivityType = "BulkTest2",
                EntityId = _auidFactory.NewId(),
                Description = "Bulk insert test 2",
                Created = DateTime.UtcNow,
                Timestamp = timestamp
            }
        };

        // Act - LinqToDB bulk insert
        await _db.BulkCopyAsync(activities);

        // Assert - Verify insertions worked
        var insertedActivities = await _db.ActivityLogs
            .Where(a => a.PartyId == partyId)
            .ToArrayAsync();

        Assert.Equal(2, insertedActivities.Length);
        Assert.All(insertedActivities, a => Assert.Equal(partyId, a.PartyId));
        Assert.All(insertedActivities, a => Assert.Equal(deviceId, a.DeviceId));
        Assert.Contains(insertedActivities, a => a.ActivityType == "BulkTest1");
        Assert.Contains(insertedActivities, a => a.ActivityType == "BulkTest2");
    }

    [Fact]
    public async Task LinqToDb_NullEntityId_ShouldHandleCorrectly()
    {
        // Arrange
        var partyId = _auidFactory.NewId();
        var deviceId = _auidFactory.NewId();
        var activityId = _auidFactory.NewId();
        var timestamp = _auidFactory.Timestamp();

        // Create a party first for foreign key constraint
        await _db.InsertAsync(new Party
        {
            Id = partyId,
            Name = "Test Party",
            Currency = "USD",
            Timestamp = _auidFactory.Timestamp()
        });

        // Act - Insert activity with null EntityId
        var activityLog = new ActivityLog
        {
            Id = activityId,
            PartyId = partyId,
            DeviceId = deviceId,
            ActivityType = "NullEntityTest",
            EntityId = null, // Explicitly null
            Description = "Null entity ID test",
            Created = DateTime.UtcNow,
            Timestamp = timestamp
        };

        await _db.InsertAsync(activityLog);

        // Assert - Verify insertion worked with null EntityId
        var insertedActivity = await _db.ActivityLogs
            .Where(a => a.Id == activityId)
            .SingleAsync();

        Assert.Equal(partyId, insertedActivity.PartyId);
        Assert.Equal(deviceId, insertedActivity.DeviceId);
        Assert.Equal("NullEntityTest", insertedActivity.ActivityType);
        Assert.Null(insertedActivity.EntityId);
        Assert.Equal("Null entity ID test", insertedActivity.Description);
        Assert.Equal(timestamp, insertedActivity.Timestamp);
    }

    [Fact]
    public async Task LinqToDb_TransactionContext_ShouldHandleAuidCorrectly()
    {
        // Arrange
        var partyId = _auidFactory.NewId();
        var deviceId = _auidFactory.NewId();
        var activityId = _auidFactory.NewId();
        var entityId = _auidFactory.NewId();
        var timestamp = _auidFactory.Timestamp();

        // Create a party first for foreign key constraint
        await _db.InsertAsync(new Party
        {
            Id = partyId,
            Name = "Test Party",
            Currency = "USD",
            Timestamp = _auidFactory.Timestamp()
        });

        // Act - Insert within transaction (like real endpoints do)
        await _db.BeginTransactionAsync();
        try
        {
            var activityLog = new ActivityLog
            {
                Id = activityId,
                PartyId = partyId,
                DeviceId = deviceId,
                ActivityType = "TransactionTest",
                EntityId = entityId,
                Description = "Transaction context test",
                Created = DateTime.UtcNow,
                Timestamp = timestamp
            };

            await _db.InsertAsync(activityLog);
            await _db.CommitTransactionAsync();
        }
        catch
        {
            await _db.RollbackTransactionAsync();
            throw;
        }

        // Assert - Verify insertion worked within transaction
        var insertedActivity = await _db.ActivityLogs
            .Where(a => a.Id == activityId)
            .SingleAsync();

        Assert.Equal(partyId, insertedActivity.PartyId);
        Assert.Equal(deviceId, insertedActivity.DeviceId);
        Assert.Equal("TransactionTest", insertedActivity.ActivityType);
        Assert.Equal(entityId, insertedActivity.EntityId);
        Assert.Equal("Transaction context test", insertedActivity.Description);
        Assert.Equal(timestamp, insertedActivity.Timestamp);
    }
}
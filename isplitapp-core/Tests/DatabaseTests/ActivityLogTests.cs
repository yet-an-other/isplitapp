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
public class ActivityLogTests : IClassFixture<DatabaseFixture>, IDisposable, IAsyncDisposable
{
    private readonly ExpenseDb _db;
    private readonly AuidFactory _auidFactory = new();

    public ActivityLogTests(DatabaseFixture databaseFixture, ITestOutputHelper output)
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
                        .UseDefaultLogging(sp))));

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
    public async Task ActivityLog_CanBeInsertedToDatabase()
    {
        // Setup
        var partyId = _auidFactory.NewId();
        var deviceId = _auidFactory.NewId();
        var entityId = _auidFactory.NewId();
        var activityId = _auidFactory.NewId();
        var timestamp = _auidFactory.Timestamp();

        // Create a party first for foreign key constraint
        var party = new Party
        {
            Id = partyId,
            Name = "Test Party",
            Currency = "USD",
            Created = DateTime.UtcNow,
            Updated = DateTime.UtcNow
        };
        await _db.InsertAsync(party);

        var activity = new ActivityLog
        {
            Id = activityId,
            PartyId = partyId,
            DeviceId = deviceId,
            ActivityType = "ExpenseAdded",
            EntityId = entityId,
            Description = "Added expense: Test expense",
            Created = DateTime.UtcNow,
            Timestamp = timestamp
        };

        // Act
        await _db.InsertAsync(activity);

        // Assert
        var insertedActivity = await _db.ActivityLogs
            .Where(a => a.Id == activityId)
            .SingleAsync();

        Assert.Equal(activity.PartyId, insertedActivity.PartyId);
        Assert.Equal(activity.DeviceId, insertedActivity.DeviceId);
        Assert.Equal(activity.ActivityType, insertedActivity.ActivityType);
        Assert.Equal(activity.EntityId, insertedActivity.EntityId);
        Assert.Equal(activity.Description, insertedActivity.Description);
        Assert.Equal(activity.Timestamp, insertedActivity.Timestamp);
    }

    [Fact]
    public async Task ActivityLog_CanBeQueriedByPartyId()
    {
        // Setup
        var targetPartyId = _auidFactory.NewId();
        var controlPartyId = _auidFactory.NewId();
        var deviceId = _auidFactory.NewId();

        // Create parties first for foreign key constraints
        await _db.InsertAsync(new Party { Id = targetPartyId, Name = "Target Party", Currency = "USD", Timestamp = _auidFactory.Timestamp() });
        await _db.InsertAsync(new Party { Id = controlPartyId, Name = "Control Party", Currency = "USD", Timestamp = _auidFactory.Timestamp() });

        var targetActivity = new ActivityLog
        {
            Id = _auidFactory.NewId(),
            PartyId = targetPartyId,
            DeviceId = deviceId,
            ActivityType = "ExpenseAdded",
            Description = "Target activity",
            Created = DateTime.UtcNow,
            Timestamp = _auidFactory.Timestamp()
        };

        var controlActivity = new ActivityLog
        {
            Id = _auidFactory.NewId(),
            PartyId = controlPartyId,
            DeviceId = deviceId,
            ActivityType = "ExpenseAdded",
            Description = "Control activity",
            Created = DateTime.UtcNow,
            Timestamp = _auidFactory.Timestamp()
        };

        await _db.InsertAsync(targetActivity);
        await _db.InsertAsync(controlActivity);

        // Act
        var activities = await _db.ActivityLogs
            .Where(a => a.PartyId == targetPartyId)
            .ToArrayAsync();

        // Assert
        Assert.Single(activities);
        Assert.Equal(targetActivity.Id, activities[0].Id);
        Assert.Equal("Target activity", activities[0].Description);
    }

    [Fact]
    public async Task ActivityLog_RespectsTimestampOrdering()
    {
        // Setup
        var partyId = _auidFactory.NewId();
        var deviceId = _auidFactory.NewId();

        // Create a party first for foreign key constraint
        await _db.InsertAsync(new Party { Id = partyId, Name = "Test Party", Currency = "USD", Timestamp = _auidFactory.Timestamp() });

        // Create activities with different timestamps
        var olderTimestamp = _auidFactory.Timestamp();
        Thread.Sleep(1000); // Ensure different timestamps
        
        var olderActivity = new ActivityLog
        {
            Id = _auidFactory.NewId(),
            PartyId = partyId,
            DeviceId = deviceId,
            ActivityType = "ExpenseAdded",
            Description = "Older activity",
            Created = DateTime.UtcNow.AddMinutes(-10),
            Timestamp = olderTimestamp
        };

        var newerActivity = new ActivityLog
        {
            Id = _auidFactory.NewId(),
            PartyId = partyId,
            DeviceId = deviceId,
            ActivityType = "ExpenseUpdated",
            Description = "Newer activity",
            Created = DateTime.UtcNow,
            Timestamp = _auidFactory.Timestamp() // Current timestamp
        };

        await _db.InsertAsync(olderActivity);
        await _db.InsertAsync(newerActivity);

        // Act
        var activities = await _db.ActivityLogs
            .Where(a => a.PartyId == partyId)
            .OrderByDescending(a => a.Timestamp)
            .ToArrayAsync();

        // Assert
        Assert.Equal(2, activities.Length);
        Assert.Equal("Newer activity", activities[0].Description);
        Assert.Equal("Older activity", activities[1].Description);
    }

    [Fact]
    public async Task ActivityLog_RequiredFieldsValidation()
    {
        // Setup - Test inserting activity with non-existent party_id
        var nonExistentPartyId = _auidFactory.NewId();
        var activityWithBadPartyId = new ActivityLog
        {
            Id = _auidFactory.NewId(),
            PartyId = nonExistentPartyId, // Non-existent party - should fail FK constraint
            DeviceId = _auidFactory.NewId(),
            ActivityType = "ExpenseAdded",
            Description = "Test activity",
            Created = DateTime.UtcNow,
            Timestamp = _auidFactory.Timestamp()
        };

        // Act & Assert - Should fail due to foreign key constraint
        await Assert.ThrowsAsync<Npgsql.PostgresException>(async () =>
        {
            await _db.InsertAsync(activityWithBadPartyId);
        });
    }

    [Fact]
    public async Task ActivityLog_OptionalEntityIdCanBeNull()
    {
        // Setup
        var partyId = _auidFactory.NewId();
        
        // Create a party first for foreign key constraint
        await _db.InsertAsync(new Party { Id = partyId, Name = "Test Party", Currency = "USD", Timestamp = _auidFactory.Timestamp() });
        
        var activity = new ActivityLog
        {
            Id = _auidFactory.NewId(),
            PartyId = partyId,
            DeviceId = _auidFactory.NewId(),
            ActivityType = "GroupUpdated",
            EntityId = null, // Optional field
            Description = "Group name changed",
            Created = DateTime.UtcNow,
            Timestamp = _auidFactory.Timestamp()
        };

        // Act
        await _db.InsertAsync(activity);

        // Assert
        var insertedActivity = await _db.ActivityLogs
            .Where(a => a.Id == activity.Id)
            .SingleAsync();

        Assert.Null(insertedActivity.EntityId);
        Assert.Equal("GroupUpdated", insertedActivity.ActivityType);
    }
}
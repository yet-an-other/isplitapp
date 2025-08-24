using IB.ISplitApp.Core.Expenses.Data;
using IB.ISplitApp.Core.Expenses.Endpoints;
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
public class CommonQueryActivityLogTests : IClassFixture<DatabaseFixture>, IDisposable, IAsyncDisposable
{
    private readonly ExpenseDb _db;
    private readonly AuidFactory _auidFactory = new();

    public CommonQueryActivityLogTests(DatabaseFixture databaseFixture, ITestOutputHelper output)
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
    public async Task LogActivityAsync_ShouldInsertActivityWithCorrectData()
    {
        // Setup
        var partyId = _auidFactory.NewId();
        var deviceId = _auidFactory.NewId();
        var entityId = _auidFactory.NewId();

        // Create a party first for foreign key constraint
        await _db.InsertAsync(new Party { Id = partyId, Name = "Test Party", Currency = "USD", Timestamp = _auidFactory.Timestamp() });

        // Act
        await CommonQuery.LogActivityAsync(
            partyId, 
            deviceId, 
            "ExpenseAdded", 
            "Added expense: Test Expense", 
            _db, 
            _auidFactory,
            entityId);

        // Assert
        var activity = await _db.ActivityLogs
            .Where(a => a.PartyId == partyId)
            .SingleAsync();

        Assert.Equal(partyId, activity.PartyId);
        Assert.Equal(deviceId, activity.DeviceId);
        Assert.Equal("ExpenseAdded", activity.ActivityType);
        Assert.Equal("Added expense: Test Expense", activity.Description);
        Assert.Equal(entityId, activity.EntityId);
        Assert.True(activity.Created > DateTime.UtcNow.AddMinutes(-1));
        Assert.NotEqual(AuidFactory.MinTimestamp, activity.Timestamp);
    }

    [Fact]
    public async Task LogActivityAsync_ShouldGenerateProperAuidAndTimestamp()
    {
        // Setup
        var partyId = _auidFactory.NewId();
        var deviceId = _auidFactory.NewId();

        // Create a party first for foreign key constraint
        await _db.InsertAsync(new Party { Id = partyId, Name = "Test Party", Currency = "USD", Timestamp = _auidFactory.Timestamp() });

        // Act
        await CommonQuery.LogActivityAsync(partyId, deviceId, "GroupUpdated", "Group name changed", _db, _auidFactory);

        // Assert
        var activity = await _db.ActivityLogs
            .Where(a => a.PartyId == partyId)
            .SingleAsync();

        Assert.NotEqual(Auid.Empty, activity.Id);
        Assert.True(activity.Id != Auid.Empty);
        Assert.NotEmpty(activity.Timestamp);
        Assert.True(activity.Timestamp != AuidFactory.MinTimestamp);
    }

    [Fact]
    public async Task LogActivityAsync_ShouldHandleOptionalEntityIdParameter()
    {
        // Setup
        var partyId = _auidFactory.NewId();
        var deviceId = _auidFactory.NewId();

        // Create a party first for foreign key constraint
        await _db.InsertAsync(new Party { Id = partyId, Name = "Test Party", Currency = "USD", Timestamp = _auidFactory.Timestamp() });

        // Act - Call without entityId (should be null)
        await CommonQuery.LogActivityAsync(partyId, deviceId, "GroupUpdated", "Group name changed", _db, _auidFactory);

        // Assert
        var activity = await _db.ActivityLogs
            .Where(a => a.PartyId == partyId)
            .SingleAsync();

        Assert.Null(activity.EntityId);
        Assert.Equal("GroupUpdated", activity.ActivityType);
        Assert.Equal("Group name changed", activity.Description);
    }

    [Fact]
    public async Task LogActivityAsync_ShouldWorkWithinTransactionContext()
    {
        // Setup
        var partyId = _auidFactory.NewId();
        var deviceId = _auidFactory.NewId();

        // Create a party first for foreign key constraint
        await _db.InsertAsync(new Party { Id = partyId, Name = "Test Party", Currency = "USD", Timestamp = _auidFactory.Timestamp() });

        // Act - Use transaction like real endpoints do
        await _db.BeginTransactionAsync();
        try
        {
            await CommonQuery.LogActivityAsync(partyId, deviceId, "ExpenseAdded", "Test activity in transaction", _db, _auidFactory);
            await _db.CommitTransactionAsync();
        }
        catch
        {
            await _db.RollbackTransactionAsync();
            throw;
        }

        // Assert
        var activity = await _db.ActivityLogs
            .Where(a => a.PartyId == partyId)
            .SingleAsync();

        Assert.Equal("Test activity in transaction", activity.Description);
    }

    [Fact]
    public async Task LogActivityAsync_ShouldSupportMultipleActivitiesWithTimestampOrdering()
    {
        // Setup
        var partyId = _auidFactory.NewId();
        var deviceId = _auidFactory.NewId();

        // Create a party first for foreign key constraint
        await _db.InsertAsync(new Party { Id = partyId, Name = "Test Party", Currency = "USD", Timestamp = _auidFactory.Timestamp() });

        // Act - Add multiple activities
        await CommonQuery.LogActivityAsync(partyId, deviceId, "ExpenseAdded", "First activity", _db, _auidFactory);
        Thread.Sleep(1); // Ensure different timestamps
        await CommonQuery.LogActivityAsync(partyId, deviceId, "ExpenseUpdated", "Second activity", _db, _auidFactory);

        // Assert
        var activities = await _db.ActivityLogs
            .Where(a => a.PartyId == partyId)
            .OrderByDescending(a => a.Timestamp)
            .ToArrayAsync();

        Assert.Equal(2, activities.Length);
        Assert.Equal("Second activity", activities[0].Description);
        Assert.Equal("First activity", activities[1].Description);
    }
}
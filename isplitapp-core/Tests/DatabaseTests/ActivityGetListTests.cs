using IB.ISplitApp.Core.Expenses.Data;
using IB.ISplitApp.Core.Expenses.Endpoints;
using IB.ISplitApp.Core.Infrastructure;
using IB.Utils.Ids;
using IB.Utils.Ids.Converters;
using LinqToDB;
using LinqToDB.AspNet.Logging;
using LinqToDB.Data;
using LinqToDB.DataProvider.PostgreSQL;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Xunit.Abstractions;

namespace Tests.DatabaseTests;

[Collection("database")]
public class ActivityGetListTests : IClassFixture<DatabaseFixture>, IDisposable, IAsyncDisposable
{
    private readonly ExpenseDb _db;
    private readonly AuidFactory _auidFactory = new();
    private readonly RequestValidator _validator;

    public ActivityGetListTests(DatabaseFixture databaseFixture, ITestOutputHelper output)
    {
        var collection = new ServiceCollection();
        collection.AddSingleton(_auidFactory);
        collection.AddSingleton(LoggerFactory.Create(c => c.AddConsole()));
        collection.AddTransient<RequestValidator>(sp => new RequestValidator(sp));

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
    public async Task GetActivities_WithValidPartyId_ShouldReturnActivitiesList()
    {
        // Arrange
        var partyId = _auidFactory.NewId();
        var deviceId = _auidFactory.NewId();

        // Create party and activities with test data
        await SetupPartyWithActivitiesAsync(partyId, deviceId);

        // Act
        var ep = new ActivityGetList();
        var result = await (ep.Endpoint.DynamicInvoke(
            partyId.ToString(), _validator, _db) as Task<Ok<ActivityInfo[]>>)!;

        // Assert
        Assert.IsType<Ok<ActivityInfo[]>>(result);
        var activities = result.Value;
        Assert.NotNull(activities);
        Assert.Equal(3, activities.Length);
        
        // Activities should be ordered by Timestamp descending (newest first)
        Assert.Equal("ParticipantRemoved", activities[0].ActivityType);
        Assert.Equal("ExpenseUpdated", activities[1].ActivityType);
        Assert.Equal("ExpenseAdded", activities[2].ActivityType);
    }

    [Fact]
    public async Task GetActivities_WithInvalidPartyId_ShouldReturnBadRequest()
    {
        // Act
        var ep = new ActivityGetList();
        
        // This should trigger a validation error for invalid party ID
        var exception = await Assert.ThrowsAsync<FluentValidation.ValidationException>(async () =>
        {
            await (ep.Endpoint.DynamicInvoke(
                "invalid-party-id", _validator, _db) as Task<Ok<ActivityInfo[]>>)!;
        });
        
        // Validation error should be thrown
        Assert.NotNull(exception);
    }

    [Fact]
    public async Task GetActivities_WithNonExistentParty_ShouldReturnEmptyList()
    {
        // Arrange
        var nonExistentPartyId = _auidFactory.NewId();

        // Act
        var ep = new ActivityGetList();
        var result = await (ep.Endpoint.DynamicInvoke(
            nonExistentPartyId.ToString(), _validator, _db) as Task<Ok<ActivityInfo[]>>)!;

        // Assert
        Assert.IsType<Ok<ActivityInfo[]>>(result);
        var activities = result.Value;
        Assert.NotNull(activities);
        Assert.Empty(activities);
    }

    [Fact]
    public async Task GetActivities_WithMultiplePartiesAndActivities_ShouldReturnOnlyRequestedPartyActivities()
    {
        // Arrange
        var targetPartyId = _auidFactory.NewId();
        var controlPartyId = _auidFactory.NewId();
        var deviceId = _auidFactory.NewId();

        // Setup two parties with activities
        await SetupPartyWithActivitiesAsync(targetPartyId, deviceId);
        await SetupPartyWithActivitiesAsync(controlPartyId, deviceId);

        // Act - Request activities for target party only
        var ep = new ActivityGetList();
        var result = await (ep.Endpoint.DynamicInvoke(
            targetPartyId.ToString(), _validator, _db) as Task<Ok<ActivityInfo[]>>)!;

        // Assert
        Assert.IsType<Ok<ActivityInfo[]>>(result);
        var activities = result.Value;
        Assert.NotNull(activities);
        Assert.Equal(3, activities.Length);
        Assert.All(activities, a => 
        {
            // All activities should be for the target party
            Assert.Contains(targetPartyId.ToString(), a.Description);
        });
    }

    [Fact]
    public async Task GetActivities_ShouldReturnCorrectActivityInfo()
    {
        // Arrange
        var partyId = _auidFactory.NewId();
        var deviceId = _auidFactory.NewId();
        var entityId = _auidFactory.NewId();

        // Create party first
        await CreatePartyAsync(partyId);
        
        // Insert specific activity with known data
        var activityId = _auidFactory.NewId();
        var timestamp = _auidFactory.Timestamp();
        var created = new DateTime(2024, 1, 15, 10, 30, 0, DateTimeKind.Utc);
        
        await _db.InsertAsync(new ActivityLog
        {
            Id = activityId,
            PartyId = partyId,
            DeviceId = deviceId,
            ActivityType = "ExpenseAdded",
            EntityId = entityId,
            Description = $"Added expense: Test Expense for party {partyId}",
            Created = created,
            Timestamp = timestamp
        });

        // Act
        var ep = new ActivityGetList();
        var result = await (ep.Endpoint.DynamicInvoke(
            partyId.ToString(), _validator, _db) as Task<Ok<ActivityInfo[]>>)!;

        // Assert
        Assert.IsType<Ok<ActivityInfo[]>>(result);
        var activities = result.Value;
        Assert.NotNull(activities);
        Assert.Single(activities);

        var activity = activities[0];
        Assert.Equal(activityId, activity.Id);
        Assert.Equal("ExpenseAdded", activity.ActivityType);
        Assert.Equal($"Added expense: Test Expense for party {partyId}", activity.Description);
        Assert.Equal(created, activity.Created);
        Assert.Equal(entityId, activity.EntityId);
        Assert.Equal(deviceId, activity.DeviceId);
        Assert.Equal(timestamp, activity.Timestamp);
    }

    [Fact]
    public async Task GetActivities_WithNullEntityId_ShouldHandleCorrectly()
    {
        // Arrange
        var partyId = _auidFactory.NewId();
        var deviceId = _auidFactory.NewId();

        // Create party first
        await CreatePartyAsync(partyId);
        
        // Insert activity with null EntityId (group-level activity)
        await _db.InsertAsync(new ActivityLog
        {
            Id = _auidFactory.NewId(),
            PartyId = partyId,
            DeviceId = deviceId,
            ActivityType = "GroupUpdated",
            EntityId = null, // Group-level activity
            Description = "Group name changed",
            Created = DateTime.UtcNow,
            Timestamp = _auidFactory.Timestamp()
        });

        // Act
        var ep = new ActivityGetList();
        var result = await (ep.Endpoint.DynamicInvoke(
            partyId.ToString(), _validator, _db) as Task<Ok<ActivityInfo[]>>)!;

        // Assert
        Assert.IsType<Ok<ActivityInfo[]>>(result);
        var activities = result.Value;
        Assert.NotNull(activities);
        Assert.Single(activities);
        
        var activity = activities[0];
        Assert.Equal("GroupUpdated", activity.ActivityType);
        Assert.Null(activity.EntityId);
    }

    private async Task SetupPartyWithActivitiesAsync(Auid partyId, Auid deviceId)
    {
        await CreatePartyAsync(partyId);
        
        // Insert activities with explicit ordering by using string timestamps that sort correctly
        var baseTime = DateTime.UtcNow.AddHours(-3);
        
        await _db.InsertAsync(new ActivityLog
        {
            Id = _auidFactory.NewId(),
            PartyId = partyId,
            DeviceId = deviceId,
            ActivityType = "ExpenseAdded",
            EntityId = _auidFactory.NewId(),
            Description = $"Added expense: Groceries for party {partyId}",
            Created = baseTime,
            Timestamp = "0000001" // Oldest timestamp
        });

        await _db.InsertAsync(new ActivityLog
        {
            Id = _auidFactory.NewId(),
            PartyId = partyId,
            DeviceId = deviceId,
            ActivityType = "ExpenseUpdated",
            EntityId = _auidFactory.NewId(),
            Description = $"Updated expense: Changed amount for party {partyId}",
            Created = baseTime.AddHours(1),
            Timestamp = "0000002" // Middle timestamp
        });

        await _db.InsertAsync(new ActivityLog
        {
            Id = _auidFactory.NewId(),
            PartyId = partyId,
            DeviceId = deviceId,
            ActivityType = "ParticipantRemoved",
            EntityId = _auidFactory.NewId(),
            Description = $"Removed participant from party {partyId}",
            Created = baseTime.AddHours(2),
            Timestamp = "0000003" // Most recent timestamp
        });
    }

    private async Task CreatePartyAsync(Auid partyId)
    {
        await _db.InsertAsync(new Party
        {
            Id = partyId,
            Name = "Test Party",
            Currency = "USD",
            Created = DateTime.UtcNow,
            Updated = DateTime.UtcNow,
            Timestamp = _auidFactory.Timestamp()
        });
    }
}
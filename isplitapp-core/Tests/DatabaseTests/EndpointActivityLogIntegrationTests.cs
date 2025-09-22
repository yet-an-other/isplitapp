using IB.ISplitApp.Core.Devices.Notifications;
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
using Moq;
using Xunit.Abstractions;
using FluentValidation;

namespace Tests.DatabaseTests;

[Collection("database")]
public class EndpointActivityLogIntegrationTests : IClassFixture<DatabaseFixture>, IDisposable, IAsyncDisposable
{
    private readonly ExpenseDb _db;
    private readonly AuidFactory _auidFactory = new();
    private readonly RequestValidator _validator;
    private readonly NotificationService _ns;

    public EndpointActivityLogIntegrationTests(DatabaseFixture databaseFixture, ITestOutputHelper output)
    {
        var loggerMoq = new Logger<NotificationService>(new LoggerFactory());
        var notificationMoq = new Mock<NotificationService>(loggerMoq, null!, null!, null!);

        var collection = new ServiceCollection();
        collection.AddTransient<IValidator<PartyPayload>, PartyRequestValidator>();
        collection.AddTransient<IValidator<ExpensePayload>, ExpensePayloadValidator>();
        collection.AddSingleton(notificationMoq.Object);
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
                        .UseDefaultLogging(sp)
                )));

        IServiceProvider serviceProvider = collection.BuildServiceProvider();

        _db = serviceProvider.GetRequiredService<ExpenseDb>();
        _validator = serviceProvider.GetRequiredService<RequestValidator>();
        _ns = serviceProvider.GetRequiredService<NotificationService>();
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
    public async Task PartyCreate_ShouldLogPartyCreatedActivity()
    {
        // Arrange
        var deviceId = _auidFactory.NewId();
        var partyPayload = new PartyPayload
        {
            Name = "Test Party",
            Currency = "USD",
            Description = "Test party for activity logging",
            Participants = [
                new ParticipantPayload { Name = "Alice" },
                new ParticipantPayload { Name = "Bob" }
            ]
        };

        var endpoint = new PartyCreate();

        // Act
        var result = await (endpoint.Endpoint.DynamicInvoke(
            deviceId.ToString(), 
            partyPayload, 
            _validator, 
            _auidFactory, 
            _db) as Task<CreatedAtRoute<CreatedPartyInfo>>)!;

        // Assert - Party should be created
        Assert.IsType<CreatedAtRoute<CreatedPartyInfo>>(result);
        var createdPartyId = result.Value!.PartyId;

        // Assert - Activity should be logged
        var activities = await _db.ActivityLogs
            .Where(a => a.PartyId == createdPartyId)
            .ToArrayAsync();

        Assert.Single(activities);
        var activity = activities[0];

        Assert.Equal(createdPartyId, activity.PartyId);
        Assert.Equal(deviceId, activity.DeviceId);
        Assert.Equal("PartyCreated", activity.ActivityType);
        Assert.Contains("Test Party", activity.Description);
        Assert.Equal(createdPartyId, activity.EntityId);
        Assert.True(activity.Created > DateTime.UtcNow.AddSeconds(-30));
    }

    [Fact]
    public async Task ExpenseCreate_ShouldLogExpenseAddedActivity()
    {
        // Arrange
        var deviceId = _auidFactory.NewId();
        var partyId = _auidFactory.NewId();
        var participantId = _auidFactory.NewId();

        // Create test party and participant
        await _db.InsertAsync(new Party 
        { 
            Id = partyId, 
            Name = "Test Party", 
            Currency = "USD", 
            Timestamp = _auidFactory.Timestamp() 
        });
        await _db.InsertAsync(new Participant 
        { 
            Id = participantId, 
            PartyId = partyId, 
            Name = "Test User" 
        });

        var expensePayload = new ExpensePayload
        {
            Title = "Test Expense",
            FuAmount = 10.00m,
            Date = DateTime.UtcNow.Date,
            LenderId = participantId,
            SplitMode = SplitMode.Evenly,
            IsReimbursement = false,
            Borrowers = [
                new BorrowerPayload { ParticipantId = participantId, Share = 1, Percent = 100 }
            ]
        };

        var endpoint = new ExpenseCreate();

        // Act
        var result = await (endpoint.Endpoint.DynamicInvoke(
            deviceId.ToString(),
            partyId.ToString(),
            expensePayload,
            _validator,
            _auidFactory,
            _ns,
            _db) as Task<Created<ExpenseCreateInfo>>)!;

        // Assert - Expense should be created
        Assert.IsType<Created<ExpenseCreateInfo>>(result);

        // Extract expense ID from the response value
        var expenseId = result.Value!.ExpenseId;

        // Assert - Activity should be logged
        var activities = await _db.ActivityLogs
            .Where(a => a.PartyId == partyId)
            .ToArrayAsync();

        Assert.Single(activities);
        var activity = activities[0];

        Assert.Equal(partyId, activity.PartyId);
        Assert.Equal(deviceId, activity.DeviceId);
        Assert.Equal("ExpenseAdded", activity.ActivityType);
        Assert.Contains("Test Expense", activity.Description);
        Assert.Equal(expenseId, activity.EntityId);
        Assert.True(activity.Created > DateTime.UtcNow.AddSeconds(-30));
    }

    [Fact]
    public async Task ExpenseUpdate_ShouldLogExpenseUpdatedActivity()
    {
        // Arrange
        var deviceId = _auidFactory.NewId();
        var partyId = _auidFactory.NewId();
        var participantId = _auidFactory.NewId();
        var expenseId = _auidFactory.NewId();

        // Create test data
        await _db.InsertAsync(new Party 
        { 
            Id = partyId, 
            Name = "Test Party", 
            Currency = "USD", 
            Timestamp = _auidFactory.Timestamp() 
        });
        await _db.InsertAsync(new Participant 
        { 
            Id = participantId, 
            PartyId = partyId, 
            Name = "Test User" 
        });
        await _db.InsertAsync(new Expense
        {
            Id = expenseId,
            PartyId = partyId,
            Title = "Original Expense",
            MuAmount = 1000,
            Date = DateTime.UtcNow.Date,
            LenderId = participantId,
            SplitMode = SplitMode.Evenly,
            Timestamp = _auidFactory.Timestamp()
        });

        var updatedExpensePayload = new ExpensePayload
        {
            Title = "Updated Expense Title",
            FuAmount = 15.00m,
            Date = DateTime.UtcNow.Date,
            LenderId = participantId,
            SplitMode = SplitMode.Evenly,
            IsReimbursement = false,
            Borrowers = [
                new BorrowerPayload { ParticipantId = participantId, Share = 1, Percent = 100 }
            ]
        };

        var endpoint = new ExpenseUpdate();

        // Act
        var result = await (endpoint.Endpoint.DynamicInvoke(
            deviceId.ToString(),
            expenseId.ToString(), 
            updatedExpensePayload, 
            _validator, 
            _auidFactory,
            _ns,
            _db) as Task<Results<NoContent, NotFound>>)!;

        // Assert - Expense should be updated
        Assert.IsType<Results<NoContent, NotFound>>(result);

        // Assert - Activity should be logged
        var activities = await _db.ActivityLogs
            .Where(a => a.PartyId == partyId)
            .ToArrayAsync();

        Assert.Single(activities);
        var activity = activities[0];

        Assert.Equal(partyId, activity.PartyId);
        Assert.Equal(deviceId, activity.DeviceId);
        Assert.Equal("ExpenseUpdated", activity.ActivityType);
        Assert.Contains("Updated Expense Title", activity.Description);
        Assert.Equal(expenseId, activity.EntityId);
        Assert.True(activity.Created > DateTime.UtcNow.AddSeconds(-30));
    }

    [Fact]
    public async Task ExpenseDelete_ShouldLogExpenseDeletedActivity()
    {
        // Arrange
        var deviceId = _auidFactory.NewId();
        var partyId = _auidFactory.NewId();
        var participantId = _auidFactory.NewId();
        var expenseId = _auidFactory.NewId();

        // Create test data
        await _db.InsertAsync(new Party 
        { 
            Id = partyId, 
            Name = "Test Party", 
            Currency = "USD", 
            Timestamp = _auidFactory.Timestamp() 
        });
        await _db.InsertAsync(new Participant 
        { 
            Id = participantId, 
            PartyId = partyId, 
            Name = "Test User" 
        });
        await _db.InsertAsync(new Expense
        {
            Id = expenseId,
            PartyId = partyId,
            Title = "Expense to Delete",
            MuAmount = 1000,
            Date = DateTime.UtcNow.Date,
            LenderId = participantId,
            SplitMode = SplitMode.Evenly,
            Timestamp = _auidFactory.Timestamp()
        });

        var endpoint = new ExpenseDelete();

        // Act
        var result = await (endpoint.Endpoint.DynamicInvoke(
            deviceId.ToString(),
            expenseId.ToString(), 
            _validator, 
            _auidFactory,
            _db) as Task<NoContent>)!;

        // Assert - Expense should be deleted
        Assert.IsType<NoContent>(result);

        // Assert - Activity should be logged
        var activities = await _db.ActivityLogs
            .Where(a => a.PartyId == partyId)
            .ToArrayAsync();

        Assert.Single(activities);
        var activity = activities[0];

        Assert.Equal(partyId, activity.PartyId);
        Assert.Equal(deviceId, activity.DeviceId);
        Assert.Equal("ExpenseDeleted", activity.ActivityType);
        Assert.Contains("Expense to Delete", activity.Description);
        Assert.Equal(expenseId, activity.EntityId);
        Assert.True(activity.Created > DateTime.UtcNow.AddSeconds(-30));
    }

    [Fact]
    public async Task PartyUpdate_ShouldLogPartyUpdatedActivity()
    {
        // Arrange
        var deviceId = _auidFactory.NewId();
        var partyId = _auidFactory.NewId();
        var participantId = _auidFactory.NewId();

        // Create test data
        await _db.InsertAsync(new Party 
        { 
            Id = partyId, 
            Name = "Original Party Name", 
            Currency = "USD", 
            Timestamp = _auidFactory.Timestamp() 
        });
        await _db.InsertAsync(new Participant 
        { 
            Id = participantId, 
            PartyId = partyId, 
            Name = "Original Participant" 
        });

        var updatedPartyPayload = new PartyPayload
        {
            Name = "Updated Party Name",
            Currency = "EUR",
            Description = "Updated description",
            Participants = [
                new ParticipantPayload { Id = participantId, Name = "Updated Participant" },
                new ParticipantPayload { Name = "New Participant" }
            ]
        };

        var endpoint = new PartyUpdate();

        // Act
        var result = await (endpoint.Endpoint.DynamicInvoke(
            deviceId.ToString(),
            partyId.ToString(), 
            updatedPartyPayload, 
            _validator, 
            _auidFactory,
            _db) as Task<Results<NotFound, NoContent>>)!;

        // Assert - Party should be updated
        Assert.IsType<Results<NotFound, NoContent>>(result);

        // Assert - Activity should be logged
        var activities = await _db.ActivityLogs
            .Where(a => a.PartyId == partyId)
            .ToArrayAsync();

        Assert.Single(activities);
        var activity = activities[0];

        Assert.Equal(partyId, activity.PartyId);
        Assert.Equal(deviceId, activity.DeviceId);
        Assert.Equal("PartyUpdated", activity.ActivityType);
        Assert.Contains("Updated Party Name", activity.Description);
        Assert.Equal(partyId, activity.EntityId);
        Assert.True(activity.Created > DateTime.UtcNow.AddSeconds(-30));
    }

    [Fact]
    public async Task MultipleOperations_ShouldLogActivitiesInCorrectOrder()
    {
        // Arrange
        var deviceId = _auidFactory.NewId();
        var partyId = _auidFactory.NewId();
        var participantId = _auidFactory.NewId();

        // Create test party and participant first
        await _db.InsertAsync(new Party 
        { 
            Id = partyId, 
            Name = "Test Party", 
            Currency = "USD", 
            Timestamp = _auidFactory.Timestamp() 
        });
        await _db.InsertAsync(new Participant 
        { 
            Id = participantId, 
            PartyId = partyId, 
            Name = "Test User" 
        });

        // Prepare expense payload
        var expensePayload = new ExpensePayload
        {
            Title = "First Expense",
            FuAmount = 10.00m,
            Date = DateTime.UtcNow.Date,
            LenderId = participantId,
            SplitMode = SplitMode.Evenly,
            IsReimbursement = false,
            Borrowers = [
                new BorrowerPayload { ParticipantId = participantId, Share = 1, Percent = 100 }
            ]
        };

        var expenseCreateEndpoint = new ExpenseCreate();

        // Act - Create first expense
        await (expenseCreateEndpoint.Endpoint.DynamicInvoke(
            deviceId.ToString(),
            partyId.ToString(),
            expensePayload,
            _validator,
            _auidFactory,
            _ns,
            _db) as Task<Created<ExpenseCreateInfo>>)!;

        Thread.Sleep(1); // Ensure different timestamps

        // Act - Create second expense
        var secondExpensePayload = new ExpensePayload
        {
            Title = "Second Expense",
            FuAmount = 10.00m,
            Date = DateTime.UtcNow.Date,
            LenderId = participantId,
            SplitMode = SplitMode.Evenly,
            IsReimbursement = false,
            Borrowers = [
                new BorrowerPayload { ParticipantId = participantId, Share = 1, Percent = 100 }
            ]
        };
        await (expenseCreateEndpoint.Endpoint.DynamicInvoke(
            deviceId.ToString(),
            partyId.ToString(),
            secondExpensePayload,
            _validator,
            _auidFactory,
            _ns,
            _db) as Task<Created<ExpenseCreateInfo>>)!;

        // Assert - Activities should be logged in chronological order
        var activities = await _db.ActivityLogs
            .Where(a => a.PartyId == partyId)
            .OrderByDescending(a => a.Timestamp)
            .ToArrayAsync();

        Assert.Equal(2, activities.Length);
        Assert.Contains("Second Expense", activities[0].Description);
        Assert.Contains("First Expense", activities[1].Description);
        Assert.All(activities, a => Assert.Equal("ExpenseAdded", a.ActivityType));
        Assert.All(activities, a => Assert.Equal(deviceId, a.DeviceId));
    }
}
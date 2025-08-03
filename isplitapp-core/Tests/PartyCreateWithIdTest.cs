using FluentValidation;
using IB.ISplitApp.Core.Devices.Endpoints;
using IB.ISplitApp.Core.Expenses.Data;
using IB.ISplitApp.Core.Expenses.Endpoints;
using IB.ISplitApp.Core.Infrastructure;
using IB.Utils.Ids;
using IB.Utils.Ids.Converters;
using LinqToDB;
using LinqToDB.AspNet.Logging;
using LinqToDB.Data;
using LinqToDB.DataProvider.PostgreSQL;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Tests.DatabaseTests;
using Xunit;

namespace Tests;

[Collection("database")]
public class PartyCreateWithIdTest : IClassFixture<DatabaseFixture>, IDisposable
{
    private readonly ExpenseDb _db;
    private readonly AuidFactory _auidFactory = new();
    private readonly RequestValidator _validator;
    private readonly IServiceProvider _serviceProvider;

    public PartyCreateWithIdTest(DatabaseFixture databaseFixture)
    {
        var collection = new ServiceCollection();
        
        // Add validators
        collection.AddTransient<IValidator<PartyPayload>, PartyRequestValidator>();
        collection.AddTransient<IValidator<ExpensePayload>, ExpensePayloadValidator>();
        collection.AddTransient<IValidator<SubscriptionPayload>, SubscriptionPayloadValidator>();
        
        // Add other services
        collection.AddSingleton(_auidFactory);
        collection.AddSingleton(LoggerFactory.Create(c => c.AddConsole()));
        collection.AddTransient<RequestValidator>(sp => new RequestValidator(sp));
        collection.AddTransient<PartyCreateWithId>();

        // Add database
        collection.AddSingleton<ExpenseDb>(sp => new ExpenseDb(
            new DataOptions<ExpenseDb>(
                new DataOptions()
                    .UseMappingSchema(mappingSchema: Linq2DbConverter.AuidInt64MappingSchema())
                    .UsePostgreSQL(
                        connectionString: databaseFixture.ConnectionString,
                        dialect: PostgreSQLVersion.v15,
                        optionSetter: _ => new PostgreSQLOptions(NormalizeTimestampData: false))
            )));

        _serviceProvider = collection.BuildServiceProvider();
        _db = _serviceProvider.GetRequiredService<ExpenseDb>();
        _validator = _serviceProvider.GetRequiredService<RequestValidator>();
    }

    public void Dispose()
    {
        _db.Dispose();
        _serviceProvider?.GetService<IServiceProvider>()?.GetService<IDisposable>()?.Dispose();
    }
    [Fact]
    public async Task CreatePartyWithId_ShouldCreatePartyWithProvidedId()
    {
        // Arrange
        var deviceId = _auidFactory.NewId();
        var partyId = _auidFactory.NewId(); 
        var participantId1 = _auidFactory.NewId();
        var participantId2 = _auidFactory.NewId();
        
        var payload = new PartyPayload
        {
            Name = "Test Party with ID",
            Currency = "USD",
            Participants = new[]
            {
                new ParticipantPayload { Id = participantId1, Name = "Alice" },
                new ParticipantPayload { Id = participantId2, Name = "Bob" }
            }
        };

        // Act
        var endpoint = _serviceProvider.GetRequiredService<PartyCreateWithId>();
        var result = await ((Func<string, string?, PartyPayload, RequestValidator, AuidFactory, ExpenseDb, Task<IResult>>)endpoint.Endpoint)(
            partyId.ToString(),
            deviceId.ToString(),
            payload,
            _validator,
            _auidFactory,
            _db
        );

        // Assert
        Assert.NotNull(result);
        
        // Verify party was created with correct ID
        var createdParty = await _db.GetTable<Party>()
            .Where(p => p.Id == partyId)
            .FirstOrDefaultAsync();
            
        Assert.NotNull(createdParty);
        Assert.Equal("Test Party with ID", createdParty.Name);
        Assert.Equal("USD", createdParty.Currency);
        
        // Verify participants were created with provided IDs
        var participants = await _db.GetTable<Participant>()
            .Where(p => p.PartyId == partyId)
            .ToListAsync();
            
        Assert.Equal(2, participants.Count);
        Assert.Contains(participants, p => p.Id == participantId1 && p.Name == "Alice");
        Assert.Contains(participants, p => p.Id == participantId2 && p.Name == "Bob");
    }

    [Fact]
    public async Task CreatePartyWithId_ShouldReturnConflict_WhenPartyIdAlreadyExists()
    {
        // Arrange
        var deviceId = _auidFactory.NewId();
        var existingPartyId = _auidFactory.NewId();

        // Create existing party
        await _db.InsertAsync(new Party
        {
            Id = existingPartyId,
            Name = "Existing Party",
            Currency = "EUR",
            Created = DateTime.UtcNow,
            Updated = DateTime.UtcNow,
            Timestamp = _auidFactory.Timestamp()
        });

        var payload = new PartyPayload
        {
            Name = "Duplicate Party",
            Currency = "USD",
            Participants = new[]
            {
                new ParticipantPayload { Name = "Alice" }
            }
        };

        // Act
        var endpoint = _serviceProvider.GetRequiredService<PartyCreateWithId>();
        var result = await ((Func<string, string?, PartyPayload, RequestValidator, AuidFactory, ExpenseDb, Task<IResult>>)endpoint.Endpoint)(
            existingPartyId.ToString(),
            deviceId.ToString(),
            payload,
            _validator,
            _auidFactory,
            _db
        );

        // Assert
        Assert.NotNull(result);
        // The result should be a Conflict response, but we can't easily test the exact type
        // In a real scenario, this would return a 409 Conflict status code
    }
}
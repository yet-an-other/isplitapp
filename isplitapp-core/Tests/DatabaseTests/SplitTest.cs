using FluentValidation;
using IB.ISplitApp.Core.Devices.Endpoints;
using IB.ISplitApp.Core.Devices.Notifications;
using IB.ISplitApp.Core.Expenses;
using IB.ISplitApp.Core.Expenses.Data;
using IB.ISplitApp.Core.Expenses.Endpoints;
using IB.ISplitApp.Core.Infrastructure;

using IB.Utils.Ids;
using IB.Utils.Ids.Converters;
using LinqToDB;
using LinqToDB.Data;
using LinqToDB.DataProvider.PostgreSQL;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;

namespace Tests.DatabaseTests;

[Collection("database")]
public class SplitTest: IClassFixture<DatabaseFixture>, IDisposable, IAsyncDisposable
{
    
    private readonly ExpenseDb _db;
    private readonly IServiceProvider _serviceProvider;
    private readonly AuidFactory _auidFactory = new ();
    private readonly RequestValidator _validator;
    private readonly NotificationService _ns;
    
    public SplitTest(DatabaseFixture databaseFixture)
    {
        _db = new ExpenseDb(
            new DataOptions<ExpenseDb>(
                new DataOptions()
                    .UseMappingSchema(Linq2DbConverter.AuidInt64MappingSchema())
                    .UsePostgreSQL(databaseFixture.ConnectionString, PostgreSQLVersion.v15)));
        
        var loggerMoq = new Logger<NotificationService>(new LoggerFactory());
        var notificationMoq = new Mock<NotificationService>(loggerMoq, null!, null!, null!);

        var collection = new ServiceCollection();
        collection.AddTransient<IValidator<PartyPayload>, PartyRequestValidator>();
        collection.AddTransient<IValidator<ExpensePayload>, ExpensePayloadValidator>();
        collection.AddTransient<IValidator<SubscriptionPayload>, SubscriptionPayloadValidator>();
        collection.AddSingleton(notificationMoq.Object);
        
        collection.AddSingleton(_auidFactory);
        collection.AddSingleton(_db);
        collection.AddTransient<RequestValidator>(sp => new RequestValidator(sp));
        _serviceProvider = collection.BuildServiceProvider();
        _validator = _serviceProvider.GetRequiredService<RequestValidator>();
        _ns = _serviceProvider.GetRequiredService<NotificationService>();
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
    public async Task SplitByShareShouldReturnCorrectAmount()
    {
        // Arrange
        //
        var actualPartyId = _auidFactory.NewId();
        var lenderId = _auidFactory.NewId();
        var borrowerId = _auidFactory.NewId();
        var actualParty = new Party
        {
            Id = actualPartyId,
            Currency = "EUR",
            Name = "Actual",
        };
        List<Participant> aParticipants =  
        [
            new Participant
            {
                Id = lenderId,
                PartyId = actualPartyId,
                Name = "actual-changed"
            },
            new Participant
            {
                Id = borrowerId,
                PartyId = actualPartyId,
                Name = "actual-deleted"
            }
        ]; 
        
        await _db.InsertAsync(actualParty);
        await _db.BulkCopyAsync(aParticipants);
        
        var expense = new ExpensePayload()
        {
            FuAmount = 1000,
            Date = DateTime.Now,
            Title = "test expense",
            LenderId = lenderId,
            SplitMode = SplitMode.ByShare,
            Borrowers = new List<BorrowerPayload>
            {
                new()
                {
                    ParticipantId = lenderId,
                    Share = 2,
                    Percent = 0
                },
                new()
                {
                    ParticipantId = borrowerId,
                    Share = 3,
                    Percent = 0
                }
            }.ToArray()
        };
        
        // Act
        //

        var endpointPut = new ExpenseCreate();
        var endpointGet = new ExpenseGet();

        var updateResult = await (endpointPut.Endpoint.DynamicInvoke(_auidFactory.NewId().ToString(), actualPartyId.ToString(), expense,
            _validator, _auidFactory, _ns, _db) as Task<Created<ExpenseCreateInfo>>)!;


        Assert.IsType<Created<ExpenseCreateInfo>>(updateResult);
        var id = updateResult.Value!.ExpenseId;


        var result = await (endpointGet.Endpoint.DynamicInvoke(id.ToString(), _validator, _db) as Task<Results<Ok<ExpenseInfo>, NotFound>>)!;
        
        // Assert
        //
        var re = (result.Result as Ok<ExpenseInfo>)!.Value;
        Assert.Equal(SplitMode.ByShare, re!.SplitMode);
        Assert.Equal(1000, re.FuAmount);
        Assert.Equal(400, re.Borrowers[0].FuAmount);
        Assert.Equal(2, re.Borrowers[0].Share);
        Assert.Equal(600, re.Borrowers[1].FuAmount);
        Assert.Equal(3, re.Borrowers[1].Share);
    }

}
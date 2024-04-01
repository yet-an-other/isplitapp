using FluentValidation;
using IB.ISplitApp.Core.Expenses;
using IB.ISplitApp.Core.Expenses.Contract;
using IB.ISplitApp.Core.Expenses.Data;
using IB.ISplitApp.Core.Users.Notifications;
using IB.ISplitApp.Core.Utils;
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
    
    public SplitTest(DatabaseFixture databaseFixture)
    {
        _db = new ExpenseDb(
            new DataOptions<ExpenseDb>(
                new DataOptions()
                    .UsePostgreSQL(databaseFixture.ConnectionString, PostgreSQLVersion.v15)));

        var collection = new ServiceCollection();
        collection.AddTransient<IValidator<PartyPayload>, PartyRequestValidator>();
        collection.AddTransient<IValidator<ExpensePayload>, ExpensePayloadValidator>();
        _serviceProvider = collection.BuildServiceProvider();
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
        
        var userId = IdUtil.NewId();
        var actualPartyId = IdUtil.NewId();
        var lenderId = IdUtil.NewId();
        var borrowerId = IdUtil.NewId();
        var actualParty = new Party
        {
            Id = actualPartyId,
            Currency = "EUR",
            Name = "Actual",
        };
        var aParticipants = new List<Participant>( 
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
        ]); 
        
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
                new BorrowerPayload()
                {
                    ParticipantId = lenderId,
                    Share = 2,
                    Percent = 0
                },
                new BorrowerPayload()
                {
                    ParticipantId = borrowerId,
                    Share = 3,
                    Percent = 0
                }
            }.ToArray()
        };
        var validator = new GenericValidator(_serviceProvider);

        
        var loggerMoq = new Logger<NotificationService>(new LoggerFactory());
        var notificationMoq = new Mock<NotificationService>(loggerMoq, null, null, null);
        
        // Act
        //
        var updateResult = await ExpenseCommand.ExpenseCreate(
            IdUtil.DefaultId, actualPartyId, expense, validator, _db, notificationMoq.Object);
        Assert.IsType<CreatedAtRoute>(updateResult.Result);
        var route = (CreatedAtRoute) updateResult.Result;
        route.RouteValues.TryGetValue("expenseId", out var id);
        var result = await ExpenseCommand.ExpenseGet(id as string,validator, _db);
        
        // Assert
        //
        var re = (result.Result as Ok<ExpenseInfo>)!.Value;
        Assert.Equal(SplitMode.ByShare, re.SplitMode);
        Assert.Equal(1000, re.FuAmount);
        Assert.Equal(400, re.Borrowers[0].FuAmount);
        Assert.Equal(2, re.Borrowers[0].Share);
        Assert.Equal(600, re.Borrowers[1].FuAmount);
        Assert.Equal(3, re.Borrowers[1].Share);
    }

}
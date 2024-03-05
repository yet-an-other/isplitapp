using System.Text.Json;
using FluentValidation;
using IB.ISplitApp.Core.Expenses;
using IB.ISplitApp.Core.Expenses.Data;
using IB.ISplitApp.Core.Expenses.Contract;
using IB.ISplitApp.Core.Utils;
using LinqToDB;
using LinqToDB.Data;
using LinqToDB.DataProvider.PostgreSQL;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;


namespace Tests.DatabaseTests;

public class ExpenseCommandTest: IClassFixture<DatabaseFixture>, IDisposable, IAsyncDisposable
{
    private readonly ExpenseDb _db;
    private readonly IServiceProvider _serviceProvider;
    
    public ExpenseCommandTest(DatabaseFixture databaseFixture)
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
    public async void PartyCreateShouldCreateOnePartyWithParticipants()
    {
        // Setup
        //
        var party = new PartyPayload
        {
            Currency = "EUR",
            Name = "Test",
            Participants =[ new ParticipantPayload{Name="test-p1"}, new ParticipantPayload(){Name="test-p2"}]
        };
        
        // Act
        //
        var userId = IdUtil.NewId();
        var result = await ExpenseCommand.PartyCreate(
            userId, party, new GenericValidator(_serviceProvider), null, _db);
        
        
        // Assert
        //
        Assert.IsType<CreatedAtRoute>(result.Result);

        var partyId = (string)(result.Result as CreatedAtRoute)?.RouteValues["partyId"]!;
        var newParty = LoadParties(partyId);
        
        Assert.Equal(party.Name, newParty.Name);
        Assert.Equal(party.Currency, newParty.Currency);
        Assert.Collection(newParty.Participants, 
            p=> Assert.False(string.IsNullOrEmpty(p.Name)),
            p => Assert.False(string.IsNullOrEmpty(p.Name))
            ) ;
    }

    [Fact]
    public async void PartyUpdateShouldCorrectUpdateOnlyOnePartyAndItsParticipants()
    {
        // Setup
        //
        var userId = IdUtil.NewId();
        var actualPartyId = IdUtil.NewId();
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
                Id = IdUtil.NewId(),
                PartyId = actualPartyId,
                Name = "actual-changed"
            },
            new Participant
            {
                Id = IdUtil.NewId(),
                PartyId = actualPartyId,
                Name = "actual-deleted"
            }
        ]);        
        
        var controlPartyId = IdUtil.NewId();
        var controlParty = new Party
        {
            Id = controlPartyId,
            Currency = "USD",
            Name = "Control",
            Updated = DateTime.UtcNow,
            Created = DateTime.UtcNow,
        };

        var cParticipants = new List<Participant>([
            new Participant
            {
                Id = IdUtil.NewId(),
                PartyId = controlPartyId,
                Name = "control-p1"
            },
            new Participant
            {
                Id = IdUtil.NewId(),
                PartyId = controlPartyId,
                Name = "control-p2"
            }
        ]);
        
        await _db.InsertAsync(actualParty);
        await _db.BulkCopyAsync(aParticipants);

        await _db.InsertAsync(controlParty);
        await _db.BulkCopyAsync(cParticipants);

        var validator = new GenericValidator(_serviceProvider);

        var changedParty = new PartyPayload
        {
            Currency = "GBP",
            Name = "Changed",
            Participants =
            [
                new ParticipantPayload { Id = aParticipants[0].Id, Name = "changed-p1" },
                new ParticipantPayload() { Name = "added" }
            ]
        };
        
        // Act
        //
        var updateResult = await ExpenseCommand
            .PartyUpdate(userId, actualPartyId, changedParty, validator, NullLoggerFactory.Instance, _db);
        
        
        // Assert
        //
        Assert.IsType<NoContent>(updateResult.Result);

        //Check the other parties does not affected
        //
        var controlPartyCheck = LoadParties(controlPartyId);
        Assert.Equal(controlParty.Currency, controlPartyCheck.Currency);
        Assert.Equal(controlParty.Name, controlPartyCheck.Name);
        Assert.Equal(2, controlPartyCheck.Participants.Length);


        // check the party data are changed
        //
        var changedPartyCheck = LoadParties(actualPartyId);
        Assert.Equal(changedParty.Currency, changedPartyCheck.Currency);
        Assert.Equal(changedParty.Name, changedPartyCheck.Name);
        Assert.Equal(2, changedPartyCheck.Participants.Length);

        // Check the participant has changed
        //
        var updatedParticipant = changedPartyCheck.Participants
            .Where(p => p.Id == aParticipants[0].Id)
            .ToArray();
        Assert.Single(updatedParticipant);
        Assert.Equal("changed-p1", updatedParticipant.Single().Name);

        // check deleted participant has removed
        //
        var deletedParticipant = changedPartyCheck.Participants
            .Where(p => p.Id == aParticipants[1].Id)
            .ToArray();
        Assert.Empty(deletedParticipant);

        // added participant is actually added
        //
        var addedParticipant = changedPartyCheck.Participants
            .Where(p => p.Id != aParticipants[0].Id)
            .ToArray();
        Assert.Single(addedParticipant);
        Assert.Equal("added", addedParticipant.Single().Name);
        
    }

    [Fact]
    public async Task UpdatePartyWithWrongIdShouldReturn404()
    {
        // Setup
        //
        var userId = IdUtil.NewId();
        var actualPartyId = IdUtil.NewId();
        var actualParty = new PartyPayload
        {
            Currency = "EUR",
            Name = "Actual",
            Participants =
            [
                new ParticipantPayload
                {
                    Id = IdUtil.NewId(),
                    Name = "actual-changed"
                }
            ]
        };
        var validator = new GenericValidator(_serviceProvider);
        
        // Act
        //
        var updateResult = await ExpenseCommand
            .PartyUpdate(userId, actualPartyId, actualParty, validator, new NullLoggerFactory(), _db);
        
        // Assert
        //
        Assert.IsType<NotFound>(updateResult.Result);
    }


    [Fact]
    public async Task GetPartyShouldRegisterNewUserAndReturnExistingParty()
    {
        // Setup
        //
        var userId = IdUtil.NewId();
        var controlPartyId = IdUtil.NewId();
        var controlParty = new Party
        {
            Id = controlPartyId,
            Currency = "USD",
            Name = "Control",
            Updated = DateTime.UtcNow,
            Created = DateTime.UtcNow,

        };

        var cParticipants = new List<Participant>([
            new Participant
            {
                Id = IdUtil.NewId(),
                PartyId = controlPartyId,
                Name = "control-p1"
            },
            new Participant
            {
                Id = IdUtil.NewId(),
                PartyId = controlPartyId,
                Name = "control-p2"
            }
        ]);
        
        await _db.InsertAsync(controlParty);
        await _db.BulkCopyAsync(cParticipants);        
        
        // Act
        //
        var getResult = await ExpenseCommand
            .PartyGet(userId, controlPartyId, new GenericValidator(_serviceProvider), _db);
        
        // Assert
        //
        Assert.IsType<Ok<PartyInfo>>(getResult.Result);
        var response = (getResult.Result as Ok<PartyInfo>)!.Value;
        Assert.Equal(controlParty.Name, response.Name);
        Assert.Equal(controlParty.Currency, response.Currency);
        Assert.Equal(controlParty.Created, response.Created);
        Assert.Equal(controlParty.Updated, response.Updated);
        Assert.Equal(2, response.Participants.Length);
        //Assert.Equivalent(controlParty, (getResult.Result as Ok<PartyResponse>)!.Value);
        
        // Check userId
        //
        var getUserResult = _db.UserParty.Where(up => up.PartyId == controlPartyId).ToArray();
        Assert.Single(getUserResult);
        Assert.Equal(userId, getUserResult[0].UserId);
    }

    [Fact]
    public async Task GetPartyNotExistsShouldReturn404()
    {
        // Act
        //
        var getResult = await ExpenseCommand
            .PartyGet(IdUtil.NewId(), IdUtil.NewId(), new GenericValidator(_serviceProvider), _db);
        
        // Check userId
        //
        Assert.IsType<NotFound>(getResult.Result);
    }


    [Fact]
    public async Task GetPartyListShouldReturnOnlyPartiesBelongToUser()
    {
        // Setup
        //
        var actualUserId = IdUtil.NewId();
        var controlUserId = IdUtil.NewId();
        var actualParty1Id = IdUtil.NewId();
        var actualParty2Id = IdUtil.NewId();
        var controlPartyId = IdUtil.NewId();
        var actualParty1 = new Party
        {
            Id = actualParty1Id,
            Currency = "USD",
            Name = "Actual1"
        };
        
        var actualParty2 = new Party
        {
            Id = actualParty2Id,
            Currency = "USD",
            Name = "Actual2"
        };        
        
        var controlParty = new Party
        {
            Id = controlPartyId,
            Currency = "USD",
            Name = "Control"
        };        
        await _db.InsertAsync(actualParty1);
        await _db.InsertAsync(new UserParty { UserId = actualUserId, PartyId = actualParty1Id });
        
        await _db.InsertAsync(actualParty2);
        await _db.InsertAsync(new UserParty { UserId = actualUserId, PartyId = actualParty2Id });
        
        await _db.InsertAsync(controlParty);
        await _db.InsertAsync(new UserParty { UserId = controlUserId, PartyId = controlPartyId });
        
        // Act
        //
        var getResult = await ExpenseCommand
            .PartyListGet(actualUserId, new GenericValidator(_serviceProvider), _db);
        
        // Check userId
        //
        Assert.IsType<Ok<PartyInfo[]>>(getResult.Result);
        var partyList = (getResult.Result as Ok<PartyInfo[]>)!.Value;
        
        Assert.Equal(2, partyList.Length);
        Assert.Contains(partyList, pl => pl.Id == actualParty1Id);
        Assert.Contains(partyList, pl => pl.Id == actualParty2Id);
    }


    [Fact]
    public async Task NewExpenseShouldReturn201AndExpenseLink()
    {
        // Setup
        //
        var userId = IdUtil.NewId();
        var actualPartyId = IdUtil.NewId();
        var participantId = IdUtil.NewId();
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
                Id = participantId,
                PartyId = actualPartyId,
                Name = "actual"
            }
        ]);
        await _db.InsertAsync(actualParty);
        await _db.BulkCopyAsync(aParticipants);

        var expense = new ExpensePayload()
        {
            LenderId = participantId,
            Title = "payment",
            FuAmount = 100,
            Date = DateTime.UtcNow,
            IsReimbursement = false,
            Borrowers = [new BorrowerPayload() { ParticipantId = participantId }]
        };
        
        // Act
        //
        var postExpense = await ExpenseCommand.ExpenseCreate(actualPartyId, expense, new GenericValidator(_serviceProvider), _db);
        
        // Assert
        //
        Assert.IsType<CreatedAtRoute>(postExpense.Result);
        var postExpenseId = (postExpense.Result as CreatedAtRoute)?.RouteValues["expenseId"];

        var newExpense = _db.Expenses.Single(e => e.Id == (string)postExpenseId!);
        Assert.Equal("payment", newExpense.Title);

    }
    
    
    [Fact]
    public async Task NewExpenseShouldEvenlyDivideAmountAmongBorrowers()
    {
        // Setup
        //
        var userId = IdUtil.NewId();
        var actualPartyId = IdUtil.NewId();
        var participantId1 = IdUtil.NewId();
        var participantId2 = IdUtil.NewId();
        var participantId3 = IdUtil.NewId();
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
                Id = participantId1,
                PartyId = actualPartyId,
                Name = "participant-1"
            },
            new Participant
            {
                Id = participantId2,
                PartyId = actualPartyId,
                Name = "participant-2"
            },
            new Participant
            {
                Id = participantId3,
                PartyId = actualPartyId,
                Name = "participant-3"
            }

        ]);        
        
        await _db.InsertAsync(actualParty);
        await _db.BulkCopyAsync(aParticipants);

        var expense = new ExpensePayload()
        {
            LenderId = participantId2,
            Title = "payment",
            FuAmount =  100,
            Date = DateTime.UtcNow,
            IsReimbursement = false,
            Borrowers = [
                new BorrowerPayload() { ParticipantId = participantId1 },
                new BorrowerPayload() { ParticipantId = participantId2 },
                new BorrowerPayload() { ParticipantId = participantId3 }
            ]
        };
        
        // Act
        //
        var postExpense = await ExpenseCommand.ExpenseCreate(actualPartyId, expense, new GenericValidator(_serviceProvider), _db);
        
        // Assert
        //
        Assert.IsType<CreatedAtRoute>(postExpense.Result);
        var postExpenseId = (postExpense.Result as CreatedAtRoute)?.RouteValues["expenseId"];

        var newExpense = _db.Expenses.Single(e => e.Id == (string)postExpenseId!);
        Assert.Equal("payment", newExpense.Title);

        var newBorrowers = _db.Borrowers.Where(b => b.ExpenseId == (string)postExpenseId!).ToArray();
        Assert.Collection(newBorrowers, 
            b => Assert.Equal(3334, b.MuAmount),
            b => Assert.Equal(3333, b.MuAmount),
            b => Assert.Equal(3333, b.MuAmount));

    }
    
    
    
    
    [Fact]
    public async Task UpdateExpenseShouldReturn204OnSuccessAndNotAffectOtherExpenses()
    {
        // Setup
        //
        var expenseId = IdUtil.NewId();
        var actualPartyId = IdUtil.NewId();
        var participantId1 = IdUtil.NewId();
        var participantId2 = IdUtil.NewId();
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
                Id = participantId1,
                PartyId = actualPartyId,
                Name = "actual-1"
            },
            new Participant
            {
                Id = participantId2,
                PartyId = actualPartyId,
                Name = "actual-2"
            }
        ]);        
        await _db.InsertAsync(actualParty);
        await _db.BulkCopyAsync(aParticipants);

        var expense = new Expense
        {
            Id = expenseId,
            PartyId = actualPartyId,
            LenderId = participantId1,
            Title = "actual-payment",
            MuAmount = 100,
            Date = DateTime.UtcNow,
            IsReimbursement = false,
        };
        var aBorrowers = new List<Borrower>([new Borrower { ParticipantId = participantId2, ExpenseId = expenseId }]);

        await _db.InsertAsync(expense);
        await _db.BulkCopyAsync(aBorrowers);

        var controlExpenseId = IdUtil.NewId();
        var controlExpense = new Expense
        {
            Id = controlExpenseId,
            PartyId = actualPartyId,
            LenderId = participantId1,
            Title = "control-payment",
            MuAmount = 101,
            Date = DateTime.UtcNow,
            IsReimbursement = false,
        };

        var cBorrowers = new List<Borrower>([new Borrower { ParticipantId = participantId2, ExpenseId = controlExpenseId }]);

        await _db.InsertAsync(controlExpense);
        await _db.BulkCopyAsync(cBorrowers);        
        
        
        var changedExpense = new ExpensePayload
        {
            LenderId = participantId2,
            Title = "changed-payment",
            FuAmount = 200,
            Date = DateTime.UtcNow,
            IsReimbursement = false,
            Borrowers = [new BorrowerPayload { ParticipantId = participantId1 }]
        };
        
        // Act
        //
        var postExpense = await ExpenseCommand
            .ExpenseUpdate(expenseId, changedExpense, new GenericValidator(_serviceProvider), _db);
        
        // Assert
        //
        Assert.IsType<NoContent>(postExpense.Result);

        var checkExpenses = _db.Expenses.Single(e => e.Id == expenseId);
        var checkBorrowers = _db.Borrowers.Where(b => b.ExpenseId == checkExpenses.Id).ToArray();
        Assert.Equal(changedExpense.Title, checkExpenses.Title);
        Assert.Equal(changedExpense.FuAmount, checkExpenses.MuAmount.ToFuAmount());
        Assert.Single(checkBorrowers);
        Assert.Equal(20000, checkBorrowers[0].MuAmount);

        
        var checkControlExpenses = _db.Expenses.Single(e => e.Id == controlExpenseId);
        var checkControlBorrowers = _db.Borrowers.Where(b => b.ExpenseId == checkControlExpenses.Id).ToArray();
        Assert.Equivalent(controlExpense, checkControlExpenses);
        Assert.Equivalent(cBorrowers, checkControlBorrowers);
        

    }

     [Fact]
    public async Task GetExpenseShouldReturn200WithObjectOnSuccess()
    {
        // Setup
        //
        var expenseId = IdUtil.NewId();
        var actualPartyId = IdUtil.NewId();
        var participantId1 = IdUtil.NewId();
        var participantId2 = IdUtil.NewId();
        var actualParty = new Party
        {
            Id = actualPartyId,
            Currency = "EUR",
            Name = "Actual",
        };

        var participants1 = new List<Participant>(
        [
            new Participant
            {
                Id = participantId1,
                PartyId = actualPartyId,
                Name = "actual-1"
            },
            new Participant
            {
                Id = participantId2,
                PartyId = actualPartyId,
                Name = "actual-2"
            }
        ]);
        await _db.InsertAsync(actualParty);
        await _db.BulkCopyAsync(participants1);

        var expenseDate = DateTime.UtcNow;
        var expense = new Expense
        {
            Id = expenseId,
            PartyId = actualPartyId,
            LenderId = participantId1,
            Title = "actual-payment",
            MuAmount = 10000,
            Date = expenseDate,
            IsReimbursement = false
        };
        var borrowers = new List<Borrower>([new Borrower { ParticipantId = participantId2, ExpenseId = expenseId }]);

        await _db.InsertAsync(expense);
        await _db.BulkCopyAsync(borrowers);

        var control = new ExpenseInfo
        {
            Id = expenseId,
            LenderId = participantId1,
            LenderName = "actual-1",
            Title = "actual-payment",
            FuAmount = 100,
            Date = expenseDate,
            IsReimbursement = false,
            Borrowers = [new BorrowerInfo { ParticipantId = participantId2, ParticipantName = "actual-2"}]
        };
        
        // Act
        //
        var getExpenseResult = await ExpenseCommand
            .ExpenseGet(expenseId, new GenericValidator(_serviceProvider), _db);
        
        // Assert
        //
        Assert.IsType<Ok<ExpenseInfo>>(getExpenseResult.Result);
        
        var getExpense = (getExpenseResult.Result as Ok<ExpenseInfo>)!.Value;
        Assert.Equivalent(control, getExpense);

    }


    [Fact]
    public async void PartyExpenseListGetShouldReturnAllExpenses()
    {
        // Setup
        //
        var expenseId1 = IdUtil.NewId();
        var expenseId2 = IdUtil.NewId();        
        var actualPartyId = IdUtil.NewId();
        var participantId1 = IdUtil.NewId();
        var participantId2 = IdUtil.NewId();
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
                Id = participantId1,
                PartyId = actualPartyId,
                Name = "actual-1"
            },
            new Participant
            {
                Id = participantId2,
                PartyId = actualPartyId,
                Name = "actual-2"
            }
        ]);
        
        await _db.InsertAsync(actualParty);
        await _db.BulkCopyAsync(aParticipants);

        var expense1 = new Expense
        {
            Id = expenseId1,
            PartyId = actualPartyId,
            LenderId = participantId1,
            Title = "actual1-payment",
            MuAmount = 10000,
            Date = DateTime.UtcNow,
            IsReimbursement = false,
        };
        var borrowers1 = new List<Borrower>([new Borrower { ParticipantId = participantId2, ExpenseId = expenseId1 }]);
        

        await _db.InsertAsync(expense1);
        await _db.BulkCopyAsync(borrowers1);
        
        var expense2 = new Expense
        {
            Id = expenseId2,
            PartyId = actualPartyId,
            LenderId = participantId2,
            Title = "actual2-payment",
            MuAmount = 20000,
            Date = DateTime.UtcNow,
            IsReimbursement = false,
        };
        var borrowers2 = new List<Borrower>([new Borrower { ParticipantId = participantId1, ExpenseId = expenseId2 }]);

        await _db.InsertAsync(expense2);
        await _db.BulkCopyAsync(borrowers2);        
        
        // Act
        //
        var listResult = await ExpenseCommand.PartyExpenseListGet(actualPartyId,  new GenericValidator(_serviceProvider), _db);
        

        // Assert
        //
        Assert.IsType<Ok<ExpenseInfo[]>>(listResult.Result);
        var expenseList = (listResult.Result as Ok<ExpenseInfo[]>)!.Value;
        
        Assert.Equal(2, expenseList!.Length);
    }

    [Fact]
    public async void PartyBalanceGetShouldReturnCorrectBalance()
    {
                // Setup
        //
        var expenseId1 = IdUtil.NewId();
        var expenseId2 = IdUtil.NewId();        
        var actualPartyId = IdUtil.NewId();
        var participantId1 = IdUtil.NewId();
        var participantId2 = IdUtil.NewId();
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
                Id = participantId1,
                PartyId = actualPartyId,
                Name = "actual-1"
            },
            new Participant
            {
                Id = participantId2,
                PartyId = actualPartyId,
                Name = "actual-2"
            }
        ]);
        await _db.InsertAsync(actualParty);
        await _db.BulkCopyAsync(aParticipants);

        var expense1 = new Expense
        {
            Id = expenseId1,
            PartyId = actualPartyId,
            LenderId = participantId1,
            Title = "actual1-payment",
            MuAmount = 10000,
            Date = DateTime.UtcNow,
            IsReimbursement = false,
        };
        var borrowers1 =
            new List<Borrower>([new Borrower { ParticipantId = participantId2, MuAmount = 10000, ExpenseId = expenseId1 }]);

        await _db.InsertAsync(expense1);
        await _db.BulkCopyAsync(borrowers1);
        
        var expense2 = new Expense
        {
            Id = expenseId2,
            PartyId = actualPartyId,
            LenderId = participantId2,
            Title = "actual2-payment",
            MuAmount = 20000,
            Date = DateTime.UtcNow,
            IsReimbursement = false,
        };

        var borrowers2 =
            new List<Borrower>([new Borrower { ParticipantId = participantId1, MuAmount = 20000, ExpenseId = expenseId2 }]);

        await _db.InsertAsync(expense2);
        await _db.BulkCopyAsync(borrowers2); 
        
        //Act
        //
        var balanceResult = await ExpenseCommand.PartyBalanceGet(actualPartyId,  new GenericValidator(_serviceProvider), _db);
        

        // Assert
        //
        Assert.IsType<Ok<BalanceInfo>>(balanceResult.Result);
        var balance = (balanceResult.Result as Ok<BalanceInfo>)!.Value;
        
        Assert.Equal(2, balance!.Balances.Length);
        Assert.Equal(0, balance.Balances.Sum(b=>b.FuAmount));
    }
    


    private PartyInfo LoadParties(string partyId)
    {
        return _db.Parties.Where(p => p.Id == partyId)
            .Select(p => new PartyInfo
            {
                Id = p.Id,
                Currency = p.Currency,
                Name = p.Name,
                Created = p.Created,
                Updated = p.Updated,
                Participants = _db.Participants
                    .Where(pp => pp.PartyId == p.Id)
                    .Select(pp => new ParticipantInfo
                    {
                        Id = pp.Id,
                        Name = pp.Name
                    })
                    .ToArray()
            }).Single();
    }
}
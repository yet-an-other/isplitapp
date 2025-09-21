using System.Text;
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
using LinqToDB.AspNet.Logging;
using LinqToDB.Data;
using LinqToDB.DataProvider.PostgreSQL;

using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit.Abstractions;


namespace Tests.DatabaseTests;

[Collection("database")]
public class ExpenseCommandTest: IClassFixture<DatabaseFixture>, IDisposable, IAsyncDisposable
{
    private readonly ExpenseDb _db;
    private readonly AuidFactory _auidFactory = new();

    private readonly RequestValidator _validator;

    private readonly NotificationService _ns;
    
    //ITestOutputHelper _output;
    
    public ExpenseCommandTest(DatabaseFixture databaseFixture, ITestOutputHelper output)
    {
        //_output = output;
        var converter = new Converter(output);
        Console.SetOut(converter);
        
        var loggerMoq = new Logger<NotificationService>(new LoggerFactory());
        var notificationMoq = new Mock<NotificationService>(loggerMoq, null!, null!, null!);

        var collection = new ServiceCollection();
        collection.AddTransient<IValidator<PartyPayload>, PartyRequestValidator>();
        collection.AddTransient<IValidator<ExpensePayload>, ExpensePayloadValidator>();
        collection.AddTransient<IValidator<SubscriptionPayload>, SubscriptionPayloadValidator>();
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
    public async void PartyCreateShouldCreateOnePartyWithParticipants()
    {
        // Setup
        //
        var party = new PartyPayload
        {
            Currency = "EUR",
            Name = "Test",
            Participants =[ new ParticipantPayload{Name="test-p1"}, new ParticipantPayload{Name="test-p2"}]
        };
        
        // Act
        //
        var deviceId = _auidFactory.NewId();
        var ep = new PartyCreate();
        var result = await (ep.Endpoint.DynamicInvoke(
            deviceId.ToString(), party, _validator, _auidFactory, _db) as Task<CreatedAtRoute<CreatedPartyInfo>>)!;

        
        
        // Assert
        //
        Assert.IsType<CreatedAtRoute<CreatedPartyInfo>>(result);

        var partyId = result.Value!.PartyId;
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
        var deviceId = _auidFactory.NewId();
        var actualPartyId = _auidFactory.NewId();
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
                Id = _auidFactory.NewId(),
                PartyId = actualPartyId,
                Name = "actual-changed"
            },
            new Participant
            {
                Id = _auidFactory.NewId(),
                PartyId = actualPartyId,
                Name = "actual-deleted"
            }
        ];        
        
        var controlPartyId = _auidFactory.NewId();
        var controlParty = new Party
        {
            Id = controlPartyId,
            Currency = "USD",
            Name = "Control",
            Updated = DateTime.UtcNow,
            Created = DateTime.UtcNow,
        };

        List<Participant> cParticipants = [
            new Participant
            {
                Id = _auidFactory.NewId(),
                PartyId = controlPartyId,
                Name = "control-p1"
            },
            new Participant
            {
                Id = _auidFactory.NewId(),
                PartyId = controlPartyId,
                Name = "control-p2"
            }
        ];
        
        await _db.InsertAsync(actualParty);
        await _db.BulkCopyAsync(aParticipants);

        await _db.InsertAsync(controlParty);
        await _db.BulkCopyAsync(cParticipants);
        

        var changedParty = new PartyPayload
        {
            Currency = "GBP",
            Name = "Changed",
            Participants = [
                new ParticipantPayload { Id = aParticipants[0].Id, Name = "changed-p1" },
                new ParticipantPayload { Name = "added" }
            ]
        };

        
        // Act
        //
        
        var ep = new PartyUpdate();
        var updateResult = await (ep.Endpoint.DynamicInvoke(
            deviceId.ToString(), actualPartyId.ToString(), changedParty, _validator, _auidFactory, _db) as Task<Results<NotFound, NoContent>>)!;
        
        
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
        var deviceId = _auidFactory.NewId();
        var actualPartyId = _auidFactory.NewId();
        var actualParty = new PartyPayload
        {
            Currency = "EUR",
            Name = "Actual",
            Participants =
            [
                new ParticipantPayload
                {
                    Id = _auidFactory.NewId(),
                    Name = "actual-changed"
                }
            ]
        };
        
        // Act
        //
        var ep = new PartyUpdate();
        var updateResult = await (ep.Endpoint.DynamicInvoke(
            deviceId.ToString(), actualPartyId.ToString(), actualParty, _validator, _auidFactory, _db) as Task<Results<NotFound, NoContent>>)!;        

        
        // Assert
        //
        Assert.IsType<NotFound>(updateResult.Result);
    }


    [Fact]
    public async Task GetPartyShouldRegisterNewUserAndReturnExistingParty()
    {
        // Setup
        //
        var deviceId = _auidFactory.NewId();
        var controlPartyId = _auidFactory.NewId();
        var controlParty = new Party
        {
            Id = controlPartyId,
            Currency = "USD",
            Name = "Control",
            Updated = DateTime.UtcNow,
            Created = DateTime.UtcNow,

        };

        List<Participant> cParticipants = [
            new Participant
            {
                Id = _auidFactory.NewId(),
                PartyId = controlPartyId,
                Name = "control-p1"
            },
            new Participant
            {
                Id = _auidFactory.NewId(),
                PartyId = controlPartyId,
                Name = "control-p2"
            }
        ];
        
        await _db.InsertAsync(controlParty);
        await _db.BulkCopyAsync(cParticipants);  
        

        
        // Act
        //
        var ep = new PartyGet();
        var getResult = await (ep.Endpoint.DynamicInvoke(
            deviceId.ToString(), controlPartyId.ToString(), null, _validator, _db) as Task<Results<Ok<PartyInfo>, NotFound>>)!;
        
        // Assert
        //
        Assert.IsType<Ok<PartyInfo>>(getResult.Result);
        var response = (getResult.Result as Ok<PartyInfo>)!.Value;
        Assert.Equal(controlParty.Name, response!.Name);
        Assert.Equal(controlParty.Currency, response.Currency);
        Assert.Equal(controlParty.Created, response.Created);
        Assert.Equal(controlParty.Updated, response.Updated);
        Assert.Equal(2, response.Participants.Length);
        //Assert.Equivalent(controlParty, (getResult.Result as Ok<PartyResponse>)!.Value);
        
        // Check userId
        //
        var getUserResult = _db.DeviceParty.Where(dp => dp.PartyId == controlPartyId).ToArray();
        Assert.Single(getUserResult);
        Assert.Equal(deviceId, getUserResult[0].DeviceId);
    }

    [Fact]
    public async Task GetPartyNotExistsShouldReturn404()
    {
        
        // Act
        //
        var ep = new PartyGet();
        var getResult = await (ep.Endpoint.DynamicInvoke(
            _auidFactory.NewId().ToString(), _auidFactory.NewId().ToString(), null, _validator, _db) as Task<Results<Ok<PartyInfo>, NotFound>>)!;        

        
        // Check userId
        //
        Assert.IsType<NotFound>(getResult.Result);
    }


    [Fact]
    public async Task GetPartyListShouldReturnOnlyPartiesBelongToDevice()
    {
        // Setup
        //
        var actualDeviceId = _auidFactory.NewId();
        var controlDeviceId = _auidFactory.NewId();
        var actualParty1Id = _auidFactory.NewId();
        var actualParty2Id = _auidFactory.NewId();
        var controlPartyId = _auidFactory.NewId();
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
        await _db.InsertAsync(new DeviceParty { DeviceId = actualDeviceId, PartyId = actualParty1Id });
        
        await _db.InsertAsync(actualParty2);
        await _db.InsertAsync(new DeviceParty { DeviceId = actualDeviceId, PartyId = actualParty2Id });
        
        await _db.InsertAsync(controlParty);
        await _db.InsertAsync(new DeviceParty { DeviceId = controlDeviceId, PartyId = controlPartyId });
        
        
        // Act
        //
        var ep = new PartyGetList();
        var getResult = await (ep.Endpoint.DynamicInvoke(
            actualDeviceId.ToString(), null, null, _validator, _db) as Task<Ok<PartyInfo[]>>)!;    

        
        // Check userId
        //
        Assert.IsType<Ok<PartyInfo[]>>(getResult);
        var partyList = getResult.Value;
        
        Assert.Equal(2, partyList!.Length);
        Assert.Contains(partyList, pl => pl.Id == actualParty1Id);
        Assert.Contains(partyList, pl => pl.Id == actualParty2Id);
    }


    [Fact]
    public async Task NewExpenseShouldReturn201AndExpenseLink()
    {
        // Setup
        //
        var actualPartyId = _auidFactory.NewId();
        var participantId = _auidFactory.NewId();
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
                Id = participantId,
                PartyId = actualPartyId,
                Name = "actual"
            }
        ];
        await _db.InsertAsync(actualParty);
        await _db.BulkCopyAsync(aParticipants);

        var expense = new ExpensePayload
        {
            LenderId = participantId,
            Title = "payment",
            FuAmount = 100,
            Date = DateTime.UtcNow,
            IsReimbursement = false,
            Borrowers = [new BorrowerPayload { ParticipantId = participantId }]
        };
        

        // Act
        //
        var ep = new ExpenseCreate();
        var postExpense = await (ep.Endpoint.DynamicInvoke(
            _auidFactory.NewId().ToString(), actualPartyId.ToString(), expense, _validator, _auidFactory, _ns, _db) as Task<Created<ExpenseCreateInfo>>)!;

        // Assert
        //
        Assert.IsType<Created<ExpenseCreateInfo>>(postExpense);
        var postExpenseId = postExpense.Value!.ExpenseId;

        var newExpense = _db.Expenses.Single(e => e.Id == Auid.FromString(postExpenseId!.ToString()!));
        Assert.Equal("payment", newExpense.Title);
    }
    
    
    [Fact]
    public async Task NewExpenseShouldEvenlyDivideAmountAmongBorrowers()
    {
        // Setup
        //
        var actualPartyId = _auidFactory.NewId();
        var participantId1 = _auidFactory.NewId();
        var participantId2 = _auidFactory.NewId();
        var participantId3 = _auidFactory.NewId();
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
        ];

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
                new BorrowerPayload { ParticipantId = participantId1 },
                new BorrowerPayload { ParticipantId = participantId2 },
                new BorrowerPayload { ParticipantId = participantId3 }
            ]
        };
        
        // Act
        //
        var ep = new ExpenseCreate();
        var postExpense = await (ep.Endpoint.DynamicInvoke(
            _auidFactory.NewId().ToString(), actualPartyId.ToString(), expense, _validator, _auidFactory, _ns, _db) as Task<Created<ExpenseCreateInfo>>)!;

        // Assert
        //
        Assert.IsType<Created<ExpenseCreateInfo>>(postExpense);
        var postExpenseId = postExpense.Value!.ExpenseId;

        var newExpense = _db.Expenses.Single(e => e.Id == postExpenseId);
        Assert.Equal("payment", newExpense.Title);

        var newBorrowers = _db.Borrowers
            .Where(b => b.ExpenseId == postExpenseId)
            .ToArray();
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
        var expenseId = _auidFactory.NewId();
        var actualPartyId = _auidFactory.NewId();
        var participantId1 = _auidFactory.NewId();
        var participantId2 = _auidFactory.NewId();
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
        ];        
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
        List<Borrower> aBorrowers = [new Borrower { ParticipantId = participantId2, ExpenseId = expenseId }];

        await _db.InsertAsync(expense);
        await _db.BulkCopyAsync(aBorrowers);

        var controlExpenseId = _auidFactory.NewId();
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
        var ep = new ExpenseUpdate();
        var postExpense = await (ep.Endpoint.DynamicInvoke(
            _auidFactory.NewId().ToString(), expenseId.ToString(), changedExpense, _validator, _auidFactory, _ns, _db) as Task<Results<NoContent, NotFound>>)!; 
        
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
        var expenseId = _auidFactory.NewId();
        var actualPartyId = _auidFactory.NewId();
        var participantId1 = _auidFactory.NewId();
        var participantId2 = _auidFactory.NewId();
        var timestamp = _auidFactory.Timestamp();
        
        var actualParty = new Party
        {
            Id = actualPartyId,
            Currency = "EUR",
            Name = "Actual",
        };

        List<Participant> participants1 =
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
        ];
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
            IsReimbursement = false,
            Timestamp = timestamp
        };
        List<Borrower> borrowers = [new Borrower { ParticipantId = participantId2, ExpenseId = expenseId }];

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
            Borrowers = [new BorrowerInfo { ParticipantId = participantId2, ParticipantName = "actual-2"}],
            UpdateTimestamp = timestamp
        };

        // Act
        //
        var ep = new ExpenseGet();
        var getExpenseResult = await (ep.Endpoint.DynamicInvoke(
            expenseId.ToString(), _validator, _db) as Task<Results<Ok<ExpenseInfo>, NotFound>>)!; 
        
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
        var expenseId1 = _auidFactory.NewId();
        var expenseId2 = _auidFactory.NewId();        
        var actualPartyId = _auidFactory.NewId();
        var participantId1 = _auidFactory.NewId();
        var participantId2 = _auidFactory.NewId();
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
        ];
        
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
        List<Borrower> borrowers1 = [new Borrower { ParticipantId = participantId2, ExpenseId = expenseId1 }];
        

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
        List<Borrower> borrowers2 = [new Borrower { ParticipantId = participantId1, ExpenseId = expenseId2 }];

        await _db.InsertAsync(expense2);
        await _db.BulkCopyAsync(borrowers2);  

        
        // Act
        //
        var ep = new ExpenseGetList();
        var listResult = await (ep.Endpoint.DynamicInvoke(
            actualPartyId.ToString(), _validator, _db) as Task<Ok<ExpenseInfo[]>>)!;         
        

        // Assert
        //
        Assert.IsType<Ok<ExpenseInfo[]>>(listResult);
        var expenseList = listResult.Value;
        
        Assert.Equal(2, expenseList!.Length);
    }

    [Fact]
    public async void PartyBalanceGetShouldReturnCorrectBalance()
    {
        // Setup
        //
        var expenseId1 = _auidFactory.NewId();
        var expenseId2 = _auidFactory.NewId();        
        var actualPartyId = _auidFactory.NewId();
        var participantId1 = _auidFactory.NewId();
        var participantId2 = _auidFactory.NewId();
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
        ];
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
        List<Borrower> borrowers1 =
            [new Borrower { ParticipantId = participantId2, MuAmount = 10000, ExpenseId = expenseId1 }];

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

        List<Borrower> borrowers2 =
            [new Borrower { ParticipantId = participantId1, MuAmount = 20000, ExpenseId = expenseId2 }];

        await _db.InsertAsync(expense2);
        await _db.BulkCopyAsync(borrowers2); 
        
        //Act
        //
        var ep = new PartyGetBalance();
        var balanceResult = await (ep.Endpoint.DynamicInvoke(
            actualPartyId.ToString(), _validator, _db) as Task<Ok<BalanceInfo>>)!;         
        

        // Assert
        //
        Assert.IsType<Ok<BalanceInfo>>(balanceResult);
        var balance = balanceResult.Value;
        
        Assert.Equal(2, balance!.Balances.Length);
        Assert.Equal(0, balance.Balances.Sum(b=>b.FuAmount));
    }

    [Fact]
    public async Task GetPartyWithPrimaryParticipantShouldReturnParticipantBalanceAndExpenses()
    {
        // Setup
        //
        var deviceId = _auidFactory.NewId();
        var partyId = _auidFactory.NewId();
        var participant1Id = _auidFactory.NewId();
        var participant2Id = _auidFactory.NewId();
        var expense1Id = _auidFactory.NewId();
        var expense2Id = _auidFactory.NewId();
        
        var party = new Party
        {
            Id = partyId,
            Currency = "USD",
            Name = "Test Party",
            Created = DateTime.UtcNow,
            Updated = DateTime.UtcNow
        };

        var participants = new List<Participant>
        {
            new() { Id = participant1Id, PartyId = partyId, Name = "Participant 1" },
            new() { Id = participant2Id, PartyId = partyId, Name = "Participant 2" }
        };

        // Participant 1 paid 100, participant 2 owes 100
        var expense1 = new Expense
        {
            Id = expense1Id,
            PartyId = partyId,
            LenderId = participant1Id,
            Title = "Expense 1",
            MuAmount = 10000, // 100.00
            Date = DateTime.UtcNow,
            IsReimbursement = false
        };

        // Participant 2 paid 50, participant 1 owes 50  
        var expense2 = new Expense
        {
            Id = expense2Id,
            PartyId = partyId,
            LenderId = participant2Id,
            Title = "Expense 2", 
            MuAmount = 5000, // 50.00
            Date = DateTime.UtcNow,
            IsReimbursement = false
        };

        var borrowers = new List<Borrower>
        {
            new() { ExpenseId = expense1Id, ParticipantId = participant2Id, MuAmount = 10000 },
            new() { ExpenseId = expense2Id, ParticipantId = participant1Id, MuAmount = 5000 }
        };

        await _db.InsertAsync(party);
        await _db.BulkCopyAsync(participants);
        await _db.InsertAsync(expense1);
        await _db.InsertAsync(expense2);
        await _db.BulkCopyAsync(borrowers);

        // Act - Get party with participant1 as primary participant
        //
        var ep = new PartyGet();
        var getResult = await (ep.Endpoint.DynamicInvoke(
            deviceId.ToString(), 
            partyId.ToString(), 
            participant1Id.ToString(), 
            _validator, 
            _db) as Task<Results<Ok<PartyInfo>, NotFound>>)!;

        // Assert
        //
        Assert.IsType<Ok<PartyInfo>>(getResult.Result);
        var response = (getResult.Result as Ok<PartyInfo>)!.Value!;
        
        // Participant 1 balance: lent 100, owes 50 = +50 balance
        Assert.Equal(50.00m, response.FuPrimaryParticipantBalance);
        
        // Participant 1 total expenses: paid 100
        Assert.Equal(100.00m, response.FuPrimaryParticipantExpenses);
        
        // Verify other party data is still correct
        Assert.Equal(party.Name, response.Name);
        Assert.Equal(party.Currency, response.Currency);
        Assert.Equal(2, response.Participants.Length);
    }

    [Fact]
    public async Task GetPartyWithoutPrimaryParticipantShouldReturnNullForParticipantData()
    {
        // Setup
        //
        var deviceId = _auidFactory.NewId();
        var partyId = _auidFactory.NewId();
        var party = new Party
        {
            Id = partyId,
            Currency = "USD",
            Name = "Test Party",
            Created = DateTime.UtcNow,
            Updated = DateTime.UtcNow
        };

        await _db.InsertAsync(party);

        // Act - Get party without primary participant
        //
        var ep = new PartyGet();
        var getResult = await (ep.Endpoint.DynamicInvoke(
            deviceId.ToString(), 
            partyId.ToString(), 
            null, 
            _validator, 
            _db) as Task<Results<Ok<PartyInfo>, NotFound>>)!;

        // Assert
        //
        Assert.IsType<Ok<PartyInfo>>(getResult.Result);
        var response = (getResult.Result as Ok<PartyInfo>)!.Value!;
        
        Assert.Null(response.FuPrimaryParticipantBalance);
        Assert.Null(response.FuPrimaryParticipantExpenses);
    }

    private PartyInfo LoadParties(Auid partyId)
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
    
    private class Converter(ITestOutputHelper output) : TextWriter
    {
        private string _textOut = string.Empty;
        public override Encoding Encoding => Encoding.Default;

        public override void WriteLine(string? message)
        {
            output.WriteLine(message);
        }
        public override void WriteLine(string format, params object?[] args)
        {
            output.WriteLine(format, args);
        }

        public override void Write(char value)
        {
            if (value == '\n')
            {
                output.WriteLine(_textOut);
                _textOut = ""; 
            }
            else
                _textOut += value;
        }
    }
}
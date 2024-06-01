using IB.ISplitApp.Core.Expenses.Data;
using IB.ISplitApp.Core.Expenses.Endpoints;
using IB.Utils.Ids;


namespace Tests;

public class ExpensePayloadTest
{
    private readonly AuidFactory _auidFactory = new();
    
    [Fact]
    public void ShouldReturnTrueIfAllValid()
    {
        // Setup
        //
        var expensePayload = new ExpensePayload
        {
            Title = "validTitle",
            FuAmount = 100,
            Date = DateTime.Now,
            SplitMode = SplitMode.Evenly,
            LenderId = _auidFactory.NewId(),
            Borrowers = new List<BorrowerPayload>
            {
                new()
                {
                    ParticipantId = _auidFactory.NewId(),
                    FuAmount = 100,
                    Share = 1,
                    Percent = 1
                }
            }.ToArray()
        };
        
        
        // Act
        //
        var validator = new ExpensePayloadValidator();
        var validationStatus = validator.Validate(expensePayload);
        
        // Assert
        //
        Assert.True(validationStatus.IsValid);
        Assert.Empty(validationStatus.Errors);
    }
    
    [Fact]
    public void ShouldReturnFalseIfOneObjectIsWrong()
    {
        // Setup
        //
        var expensePayload = new ExpensePayload
        {
            Title = "validTitle",
            FuAmount = 100,
            Date = DateTime.Now,
            SplitMode = SplitMode.ByShare,
            LenderId = _auidFactory.NewId(),
            Borrowers = new List<BorrowerPayload>
            {
                new()
                {
                    ParticipantId = _auidFactory.NewId(),
                    FuAmount = 100,
                    Share = 1,
                    Percent = 1
                },
                new()
                {
                    ParticipantId = _auidFactory.NewId(),
                    FuAmount = 100,
                    Share = 0,
                    Percent = 1
                }
            }.ToArray()
        };
        
        // Act
        //
        var validator = new ExpensePayloadValidator();
        var validationStatus = validator.Validate(expensePayload);
        
        // Assert
        //
        Assert.False(validationStatus.IsValid);
        
        // Must be just one error, that Share is wrong
        //
        Assert.Single(validationStatus.Errors);
    }

    [Fact]
    public void ShouldReturnFalseIfAllObjectAreWrong()
    {
        // Setup
        //
        var expensePayload = new ExpensePayload
        {
            Title = "validTitle",
            FuAmount = 100,
            Date = DateTime.Now,
            SplitMode = SplitMode.ByAmount,
            LenderId = _auidFactory.NewId(),
            Borrowers = new List<BorrowerPayload>
            {
                new()
                {
                    ParticipantId = _auidFactory.NewId(),
                    FuAmount = 110,
                    Share = 1,
                    Percent = 1
                },
                new()
                {
                    ParticipantId = _auidFactory.NewId(),
                    FuAmount = 0,
                    Share = 0,
                    Percent = 1
                }
            }.ToArray()
        };

        // Act
        //
        var validator = new ExpensePayloadValidator();
        var validationStatus = validator.Validate(expensePayload);

        // Assert
        //
        Assert.False(validationStatus.IsValid);

        // Must be two errors that total amount is exceeded and FuAmount is zero
        //
        Assert.Equal(2, validationStatus.Errors.Count);
    }
}
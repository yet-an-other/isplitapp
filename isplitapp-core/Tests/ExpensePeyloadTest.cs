using IB.ISplitApp.Core.Expenses.Contract;
using IB.ISplitApp.Core.Expenses.Data;
using IB.ISplitApp.Core.Utils;

namespace Tests;

public class ExpensePayloadTest
{
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
            LenderId = IdUtil.DefaultId,
            Borrowers = new List<BorrowerPayload>
            {
                new BorrowerPayload
                {
                    ParticipantId = IdUtil.DefaultId,
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
            LenderId = IdUtil.DefaultId,
            Borrowers = new List<BorrowerPayload>
            {
                new BorrowerPayload
                {
                    ParticipantId = IdUtil.NewId(),
                    FuAmount = 100,
                    Share = 1,
                    Percent = 1
                },
                new BorrowerPayload
                {
                    ParticipantId = IdUtil.NewId(),
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
            LenderId = IdUtil.DefaultId,
            Borrowers = new List<BorrowerPayload>
            {
                new BorrowerPayload
                {
                    ParticipantId = IdUtil.NewId(),
                    FuAmount = 110,
                    Share = 1,
                    Percent = 1
                },
                new BorrowerPayload
                {
                    ParticipantId = IdUtil.NewId(),
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
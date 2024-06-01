using System.Text.Json.Serialization;
using FluentValidation;
using IB.ISplitApp.Core.Expenses.Data;
using IB.Utils.Ids;

namespace IB.ISplitApp.Core.Expenses.Endpoints;

/// <summary>
/// Expense payload to create or update expense
/// </summary>
public record ExpensePayload 
{
    /// <summary>
    /// What was expense for
    /// </summary>
    public string Title { get; init; } = string.Empty;
    
    /// <summary>
    /// How much money has been spent in Fiat
    /// </summary>
    [JsonPropertyName("amount")]
    public decimal FuAmount { get; init; }

    /// <summary>
    /// Expense date 
    /// </summary>
    public DateTime Date { get; init; } = DateTime.UtcNow;

    /// <summary>
    /// Unique id who has paid
    /// </summary>
    public Auid LenderId { get; init; } = Auid.Empty;
    
    /// <summary>
    /// Is this a compensation?
    /// </summary>
    public bool IsReimbursement { get; init; }
    
    /// <summary>
    /// List of those who participated in expense
    /// </summary>
    public BorrowerPayload[] Borrowers { get; set; } = [];
    
    public SplitMode SplitMode { get; init; } = SplitMode.Evenly;
}

public class ExpensePayloadValidator : AbstractValidator<ExpensePayload>
{
    private const int TitleLength = 200;

    public ExpensePayloadValidator()
    {
        RuleFor(e => e.Title).NotEmpty().Length(1, TitleLength)
            .WithMessage($"Expense title must not be empty or greater than {TitleLength} characters");
        RuleFor(e => e.Borrowers).NotEmpty()
            .WithMessage("In expense must be at least one participant");
        RuleFor(e => e.FuAmount).GreaterThan(0);
        RuleFor(e => e.Date).NotEmpty();
        RuleFor(e => e.LenderId).NotEmpty();
        RuleFor(e => e.Borrowers).NotEmpty()
            .WithMessage("Must be at least one participant who was paid for");
        RuleForEach(e => e.Borrowers).SetValidator(e=> new BorrowerRequestValidator(e.SplitMode));
        
        RuleFor(e => e.Borrowers).Must((e, borrowers, context) =>
        {
            if (e.SplitMode != SplitMode.ByAmount)
                return true;
            
            return borrowers.Sum(b => b.FuAmount.ToMuAmount()) == e.FuAmount.ToMuAmount();
        }).WithMessage("Sum of all participants must be equal to expense amount");
        
        RuleFor(e => e.Borrowers).Must((e, borrowers, context) =>
        {
            if (e.SplitMode != SplitMode.ByPercentage)
                return true;
            
            return 100 == borrowers.Sum(b => b.Percent);
        }).WithMessage("Sum of all percents must be equal to 100");        
    }
}
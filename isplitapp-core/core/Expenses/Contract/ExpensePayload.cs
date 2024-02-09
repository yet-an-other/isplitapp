using System.Text.Json.Serialization;
using FluentValidation;
using IB.ISplitApp.Core.Utils;

namespace IB.ISplitApp.Core.Expenses.Contract;

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
    public string LenderId { get; init; } = string.Empty;
    
    /// <summary>
    /// Is this a compensation?
    /// </summary>
    public bool IsReimbursement { get; init; }
    
    /// <summary>
    /// List of those who participated in expense
    /// </summary>
    public BorrowerPayload[] Borrowers { get; set; } = [];
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
        RuleFor(e => e.LenderId).NotEmpty().Must(IdUtil.IsValidId)
            .WithMessage("LenderId must be correct");
        RuleFor(e => e.Borrowers).NotEmpty()
            .WithMessage("Must be at least one participant who was paid for");
        RuleForEach(e => e.Borrowers).SetValidator(new BorrowerRequestValidator());
    }
}
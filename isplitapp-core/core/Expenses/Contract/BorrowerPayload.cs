using System.Text.Json.Serialization;
using FluentValidation;
using IB.ISplitApp.Core.Expenses.Data;
using IB.Utils.Ids;

namespace IB.ISplitApp.Core.Expenses.Contract;


/// <summary>
/// Borrower data in request payload  
/// </summary>
public record BorrowerPayload 
{
    public Auid ParticipantId { get; init; } = Auid.Empty;
    
    [JsonPropertyName("amount")]
    public decimal FuAmount { get; init; } = 0;
    
    public int Share { get; init; } = 0;
    
    public int Percent { get; init; } = 0;    
}

public class BorrowerRequestValidator : AbstractValidator<BorrowerPayload>
{
    public BorrowerRequestValidator(SplitMode splitMode)
    {
        RuleFor(b => b.ParticipantId).NotEmpty();

        switch (splitMode)
        {
            case SplitMode.ByShare:
                RuleFor(b => b.Share).GreaterThan(0);
                break;
            case SplitMode.ByPercentage:
                RuleFor(b => b.Percent).GreaterThan(0);
                break;
            case SplitMode.ByAmount:
                RuleFor(b => b.FuAmount).GreaterThan(0)
                    .WithMessage("amount must be greater than 0");
                break;
            case SplitMode.Evenly:
                break;
            default:
                throw new ArgumentOutOfRangeException(nameof(splitMode), splitMode, null);
        }
    }
}
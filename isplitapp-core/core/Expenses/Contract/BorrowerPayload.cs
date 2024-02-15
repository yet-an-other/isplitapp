
using System.Text.Json.Serialization;
using FluentValidation;
using IB.ISplitApp.Core.Expenses.Data;
using IB.ISplitApp.Core.Utils;

namespace IB.ISplitApp.Core.Expenses.Contract;


/// <summary>
/// Borrower data in request payload  
/// </summary>
public record BorrowerPayload 
{
    public string ParticipantId { get; init; } = string.Empty;
    
    [JsonPropertyName("amount")]
    public decimal FuAmount { get; init; } = 0;
    
    public int Share { get; init; } = 0;
    
    public int Percent { get; init; } = 0;    
}

public class BorrowerRequestValidator : AbstractValidator<BorrowerPayload>
{
    public BorrowerRequestValidator(SplitMode splitMode)
    {
        RuleFor(b => b.ParticipantId).NotEmpty().Must(IdUtil.IsValidId)
            .WithMessage("Must be correct participantId");

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
        }
    }
}
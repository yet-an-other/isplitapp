
using FluentValidation;
using IB.ISplitApp.Core.Utils;

namespace IB.ISplitApp.Core.Expenses.Payloads;


/// <summary>
/// Borrower data in request payload  
/// </summary>
public record BorrowerRequest 
{
    public string ParticipantId { get; init; } = string.Empty;
}

public class BorrowerRequestValidator : AbstractValidator<BorrowerRequest>
{
    public BorrowerRequestValidator()
    {
        RuleFor(b => b.ParticipantId).NotEmpty().Must(IdUtil.IsValidId)
            .WithMessage("Must be correct participantId");
    }
}
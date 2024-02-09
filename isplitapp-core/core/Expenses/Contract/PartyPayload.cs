using FluentValidation;

namespace IB.ISplitApp.Core.Expenses.Contract;

/// <summary>
/// Payload to update or create a new party 
/// </summary>
public record PartyPayload
{
    /// <summary>
    /// Name of the party
    /// </summary>
    public string Name { get; init; } = string.Empty;
    
    /// <summary>
    /// Name of the currency for all expenses in the party
    /// </summary>
    public string Currency { get; init; } = "USD";
    
    /// <summary>
    /// List of all participants in the party
    /// </summary>
    public ParticipantPayload[] Participants { get; init; } = [];
}

/// <summary>
/// Validation logic of party
/// </summary>
public class PartyRequestValidator : AbstractValidator<PartyPayload>
{
    private const int NameLength = 100;
    
    public PartyRequestValidator()
    {
        RuleFor(g => g.Name).NotEmpty().Length(1, NameLength)
            .WithMessage($"Group Name must not be empty or greater than {NameLength} characters");
        RuleFor(g => g.Currency).NotEmpty().WithMessage("Group Currency must not be empty");
        RuleFor(g => g.Participants).NotEmpty().WithMessage("In group must be at least one participant");
        RuleForEach(g => g.Participants)
            .Must(p => !string.IsNullOrWhiteSpace(p.Name) || p.Name.Length > NameLength)
            .WithMessage($"Participant Name must not be empty or greater than {NameLength} characters");
    }
}
namespace IB.ISplitApp.Core.Expenses.Contract;

/// <summary>
/// Participant's payload to create or update one
/// </summary>
public record ParticipantPayload
{
    /// <summary>
    /// Unique ID, can be empty if Participant not exists
    /// </summary>
    public string Id { get; init; } = string.Empty;
    
    
    /// <summary>
    /// Name of the participant
    /// </summary>
    public string Name { get; init; } = string.Empty;
}
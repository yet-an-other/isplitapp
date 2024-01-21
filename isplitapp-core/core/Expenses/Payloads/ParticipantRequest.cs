namespace IB.ISplitApp.Core.Expenses.Payloads;

/// <summary>
/// Participant's payload to create or update one
/// </summary>
public record ParticipantRequest
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
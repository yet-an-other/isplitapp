using IB.Utils.Ids;

namespace IB.ISplitApp.Core.Expenses.Endpoints;

/// <summary>
/// Participant's payload to create or update one
/// </summary>
public record ParticipantPayload
{
    /// <summary>
    /// Unique ID, can be empty if Participant not exists
    /// </summary>
    public Auid Id { get; init; } = Auid.Empty;
    
    /// <summary>
    /// Name of the participant
    /// </summary>
    public string Name { get; init; } = string.Empty;
}
using IB.Utils.Ids;

namespace IB.ISplitApp.Core.Expenses.Endpoints;

/// <summary>
/// Activity data in response
/// </summary>
public record ActivityInfo 
{
    /// <summary>
    /// Unique activity id
    /// </summary>
    public Auid Id { get; init; } = Auid.Empty;
    
    /// <summary>
    /// Type of activity (e.g., "ExpenseAdded", "GroupUpdated", "ParticipantAdded")
    /// </summary>
    public string ActivityType { get; init; } = string.Empty;
    
    /// <summary>
    /// Human-readable description of what happened
    /// </summary>
    public string Description { get; init; } = string.Empty;
    
    /// <summary>
    /// When the activity occurred
    /// </summary>
    public DateTime Created { get; init; } = DateTime.UtcNow;
    
    /// <summary>
    /// AUID timestamp for ordering and synchronization
    /// </summary>
    public string Timestamp { get; init; } = AuidFactory.MinTimestamp;
    
    /// <summary>
    /// Optional ID of the entity affected by this activity (expense, participant, etc.)
    /// Null for group-level activities
    /// </summary>
    public Auid? EntityId { get; init; }
    
    /// <summary>
    /// ID of the device that performed this activity
    /// </summary>
    public Auid DeviceId { get; init; } = Auid.Empty;
}
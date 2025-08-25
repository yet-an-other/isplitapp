using System.Text.Json.Serialization;
using IB.Utils.Ids;
using LinqToDB.Mapping;

namespace IB.ISplitApp.Core.Expenses.Data;

/// <summary>
/// Activity log entry tracking changes in a party
/// </summary>
[Table("activity_log")]
public record ActivityLog
{
    /// <summary>
    /// Unique activity log entry id
    /// </summary>
    [PrimaryKey]
    [Column("id")]
    public Auid Id { get; init; } = Auid.Empty;

    /// <summary>
    /// Reference to party where activity occurred
    /// </summary>
    [JsonIgnore]
    [Column("party_id")]
    public Auid PartyId { get; init; } = Auid.Empty;

    /// <summary>
    /// Device that performed the activity
    /// </summary>
    [Column("device_id")]
    public Auid DeviceId { get; init; } = Auid.Empty;

    /// <summary>
    /// Type of activity performed
    /// </summary>
    [Column("activity_type")]
    public string ActivityType { get; init; } = string.Empty;

    /// <summary>
    /// Optional reference to the entity affected (expense id, participant id, etc.)
    /// </summary>
    [Column("entity_id")]
    public Auid? EntityId { get; init; }

    /// <summary>
    /// Human-readable description of the activity
    /// </summary>
    [Column("description")]
    public string Description { get; init; } = string.Empty;

    /// <summary>
    /// When the activity was created
    /// </summary>
    [Column("created", DbType = "timestamptz")]
    public DateTime Created { get; init; } = DateTime.UtcNow;

    /// <summary>
    /// Timestamp for ordering activities chronologically
    /// </summary>
    [Column("timestamp")]
    public string Timestamp { get; init; } = AuidFactory.MinTimestamp;
}
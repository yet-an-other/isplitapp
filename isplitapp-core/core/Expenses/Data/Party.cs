using IB.Utils.Ids;
using LinqToDB.Mapping;

namespace IB.ISplitApp.Core.Expenses.Data;

/// <summary>
/// A group of people who are sharing expenses 
/// </summary>
[Table("party")]
public record Party
{
    /// <summary>
    /// Unique party ID 
    /// </summary>
    [PrimaryKey]
    [Column("id")]
    public Auid Id { get; init; } = Auid.Empty;
    
    /// <summary>
    /// Name of the party
    /// </summary>
    [Column("name")]
    public string Name { get; init; } = string.Empty;
    
    /// <summary>
    /// Name of the currency for all expenses in the group
    /// </summary>
    [Column("currency")]
    public string Currency { get; init; } = "USD";
    
    /// <summary>
    /// When the party was created in UTC time
    /// </summary>
    [Column("created", DbType = "timestamptz")]
    public DateTime Created { get; init; } = DateTime.UtcNow;
    
    /// <summary>
    /// Last time the party was updated in UTC
    /// </summary>
    [Column("updated", DbType = "timestamptz")]
    public DateTime Updated { get; init; } = DateTime.UtcNow;
    
    /// <summary>
    /// timestamp of last update
    /// </summary>
    [Column("timestamp")]
    public string Timestamp { get; init; } = AuidFactory.MinTimestamp;
}
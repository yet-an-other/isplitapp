using IB.ISplitApp.Core.Utils;
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
    public string Id { get; init; } = IdUtil.NewId();
    
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
    [Column("created")]
    public DateTime Created { get; init; } = DateTime.UtcNow;
    
    /// <summary>
    /// Last time the party was updated in UTC
    /// </summary>
    [Column("updated")]
    public DateTime Updated { get; init; } = DateTime.UtcNow;
    
    /// <summary>
    /// timestamp of last update
    /// </summary>
    [Column("update_timestamp")]
    public string UpdateTimestamp { get; init; } = ToyId.TimestampMax;
}
using IB.Utils.Ids;
using LinqToDB.Mapping;

namespace IB.ISplitApp.Core.Expenses.Data;

/// <summary>
/// Participant's Data Model 
/// </summary>
[Table("participant")]
public record Participant
{
    /// <summary>
    /// Unique ID
    /// </summary>
    [PrimaryKey] 
    [Column("id")] 
    public Auid Id { get; init; } = Auid.Empty;
    
    /// <summary>
    /// Link to a party
    /// </summary>
    [Column("party_id")]
    public Auid PartyId { get; init; } = Auid.Empty;
    
    /// <summary>
    /// Name of the participant
    /// </summary>
    [Column("name")]
    public string Name { get; init; } = string.Empty;
}
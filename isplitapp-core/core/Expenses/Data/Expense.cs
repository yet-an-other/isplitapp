using System.Text.Json.Serialization;
using IB.ISplitApp.Core.Utils;
using LinqToDB.Mapping;

namespace IB.ISplitApp.Core.Expenses.Data;

/// <summary>
/// Specific expense in the party
/// </summary>
[Table("expense")]
public record Expense 
{
    /// <summary>
    /// Unique expense id
    /// </summary>
    [PrimaryKey]
    [Column("id")]
    public string Id { get; init; } = IdUtil.NewId();
    
    /// <summary>
    /// Reference to party
    /// </summary>
    [JsonIgnore]
    [Column("party_id")]
    public string PartyId { get; init; } = string.Empty;
    
    /// <summary>
    /// What was expense for
    /// </summary>
    [Column("title")]
    public string Title { get; init; } = string.Empty;
    
    /// <summary>
    /// How much money has been spent in MicroUnits
    /// </summary>
    [Column("amount")]
    public long MuAmount { get; init; }

    /// <summary>
    /// Expense date 
    /// </summary>
    [Column("date")] 
    public DateTime Date { get; init; } = DateTime.UtcNow;

    /// <summary>
    /// Unique id who has paid
    /// </summary>
    [Column("lender_id")]
    public string LenderId { get; init; } = string.Empty;
    
    
    /// <summary>
    /// Is this a compensation?
    /// </summary>
    [Column("is_reimbursement")]
    public bool IsReimbursement { get; init; }
    
    [Column("split_mode")] 
    public SplitMode SplitMode { get; init; } = SplitMode.Evenly;
}

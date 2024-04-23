using System.Text.Json.Serialization;
using IB.Utils.Ids;
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
    public Auid Id { get; init; } = Auid.Empty;
    
    /// <summary>
    /// Reference to party
    /// </summary>
    [JsonIgnore]
    [Column("party_id")]
    public Auid PartyId { get; init; } = Auid.Empty;
    
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
    [Column("date", DbType = "timestamptz")] 
    public DateTime Date { get; init; } = DateTime.UtcNow;

    /// <summary>
    /// Unique id who has paid
    /// </summary>
    [Column("lender_id")]
    public Auid LenderId { get; init; } = Auid.Empty;
    
    /// <summary>
    /// timestamp of last update
    /// </summary>
    [Column("timestamp")]
    public string Timestamp { get; init; } = AuidFactory.MinTimestamp;
    
    /// <summary>
    /// Is this a compensation?
    /// </summary>
    [Column("is_reimbursement")]
    public bool IsReimbursement { get; init; }
    
    [Column("split_mode")] 
    public SplitMode SplitMode { get; init; } = SplitMode.Evenly;
}

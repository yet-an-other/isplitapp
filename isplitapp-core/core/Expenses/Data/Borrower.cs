using IB.Utils.Ids;
using LinqToDB.Mapping;

namespace IB.ISplitApp.Core.Expenses.Data;

/// <summary>
/// Represent the one who borrow a part of the expense 
/// </summary>
[Table("borrower")]
public record Borrower 
{
    /// <summary>
    /// Reference to expense
    /// </summary>
    [Column("expense_id")] 
    public Auid ExpenseId { get; init; } = Auid.Empty;
    
    /// <summary>
    /// Reference to participant
    /// </summary>
    [Column("participant_id")]
    public Auid ParticipantId { get; init; } = Auid.Empty;

    /// <summary>
    /// Participant's part of money form the expense in "MicroUnits"
    /// </summary>
    [Column("amount")]
    public long MuAmount { get; init; } = 0;
    
    /// <summary>
    ///  Participant's part of money form the expense in shares
    /// </summary>
    [Column("share")]
    public int Share { get; init; } = 0;
    
    /// <summary>
    /// Participant's part of money form the expense in percentage
    /// </summary>
    [Column("percent")]
    public int Percent { get; init; } = 0;
}

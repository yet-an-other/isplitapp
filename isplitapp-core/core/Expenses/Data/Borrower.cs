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
    public string ExpenseId { get; init; } = string.Empty;
    
    /// <summary>
    /// Reference to participant
    /// </summary>
    [Column("participant_id")]
    public string ParticipantId { get; init; } = string.Empty;

    /// <summary>
    /// Participant's part of money form the expense in "MicroUnits"
    /// </summary>
    [Column("amount")]
    public long MuAmount { get; init; } = 0;
}

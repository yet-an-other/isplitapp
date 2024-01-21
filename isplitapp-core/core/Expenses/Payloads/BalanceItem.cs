namespace IB.ISplitApp.Core.Expenses.Payloads;

/// <summary>
/// Balance line entry
/// </summary>
public record BalanceItem
{
    /// <summary>
    /// Unique participant id
    /// </summary>
    public string ParticipantId { get; init; } = string.Empty;
    
    /// <summary>
    /// Participant Name
    /// </summary>
    public string ParticipantName { get; init; } = string.Empty;
    
    /// <summary>
    /// Amount of money party participant has lent or borrow in total
    /// </summary>
    public decimal Amount { get; init; }
};
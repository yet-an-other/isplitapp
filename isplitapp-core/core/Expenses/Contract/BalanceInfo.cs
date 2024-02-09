namespace IB.ISplitApp.Core.Expenses.Contract;

/// <summary>
/// Who pays who borrow and suggested reimbursements
/// </summary>
public record BalanceInfo
{
    /// <summary>
    /// total sums of lenders and borrowers
    /// </summary>
    public BalanceEntry[] Balances { get; init; } = [];
    
    /// <summary>
    /// Suggested reimbursements to get zero balance
    /// </summary>
    public ReimburseEntry[] Reimbursements { get; init; } = [];
}
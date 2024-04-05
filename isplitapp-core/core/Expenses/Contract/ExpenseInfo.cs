using System.Text.Json.Serialization;
using IB.ISplitApp.Core.Expenses.Data;
using IB.ISplitApp.Core.Utils;

namespace IB.ISplitApp.Core.Expenses.Contract;

/// <summary>
/// Expense data in response
/// </summary>
public record ExpenseInfo 
{
    /// <summary>
    /// Unique expense id
    /// </summary>
    public string Id { get; init; } = IdUtil.NewId();
    
    /// <summary>
    /// What was expense for
    /// </summary>
    public string Title { get; init; } = string.Empty;
    
    /// <summary>
    /// How much money has been spent in Fiat
    /// </summary>
    [JsonPropertyName("amount")]
    public decimal FuAmount { get; init; }

    /// <summary>
    /// Expense date 
    /// </summary>
    public DateTime Date { get; init; } = DateTime.UtcNow;

    /// <summary>
    /// Unique id who has paid
    /// </summary>
    public string LenderId { get; init; } = string.Empty;
    
    public string LenderName { get; init; } = string.Empty;    
    
    public bool IsReimbursement { get; init; }
    
    public string UpdateTimestamp { get; init; } = ToyId.TimestampMin;
    
    public BorrowerInfo[] Borrowers { get; set; } = [];
    
    public SplitMode SplitMode { get; init; } = SplitMode.Evenly;
}
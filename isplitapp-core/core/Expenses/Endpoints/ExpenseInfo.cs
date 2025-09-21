using System.Text.Json.Serialization;
using IB.ISplitApp.Core.Expenses.Data;
using IB.Utils.Ids;

namespace IB.ISplitApp.Core.Expenses.Endpoints;

/// <summary>
/// Expense data in response
/// </summary>
public record ExpenseInfo 
{
    /// <summary>
    /// Unique expense id
    /// </summary>
    public Auid Id { get; init; } = Auid.Empty;
    
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
    public Auid LenderId { get; init; } = Auid.Empty;
    
    public string LenderName { get; init; } = string.Empty;    
    
    public bool IsReimbursement { get; init; }
    
    public string UpdateTimestamp { get; init; } = AuidFactory.MinTimestamp;
    
    public BorrowerInfo[] Borrowers { get; set; } = [];
    
    public SplitMode SplitMode { get; init; } = SplitMode.Evenly;

    /// <summary>
    /// Number of attachments linked to the expense
    /// </summary>
    public int AttachmentCount { get; init; }
}
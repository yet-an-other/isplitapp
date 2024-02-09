using System.Text.Json.Serialization;

namespace IB.ISplitApp.Core.Expenses.Contract;

/// <summary>
/// Suggested transfer from borrower to lender
/// </summary>
public record ReimburseEntry
{
    /// <summary>
    /// Borrower id
    /// </summary>
    public string FromId { get; init; } = default!;

    /// <summary>
    /// Borrower Name
    /// </summary>
    public string FromName { get; init; } = default!;

    /// <summary>
    /// Lender ID
    /// </summary>
    public string ToId { get; init; } = default!;

    /// <summary>
    /// Lender name
    /// </summary>
    public string ToName { get; init; } = default!;

    /// <summary>
    /// How much money in Fiat 
    /// </summary>
    [JsonPropertyName("amount")]
    public decimal FuAmount { get; set; } = 0;
}
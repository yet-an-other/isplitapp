using System.Text.Json.Serialization;
using IB.Utils.Ids;

namespace IB.ISplitApp.Core.Expenses.Endpoints;

/// <summary>
/// Suggested transfer from borrower to lender
/// </summary>
public record ReimburseEntry
{
    /// <summary>
    /// Borrower id
    /// </summary>
    public Auid FromId { get; init; } = Auid.Empty;

    /// <summary>
    /// Borrower Name
    /// </summary>
    public string FromName { get; init; } = default!;

    /// <summary>
    /// Lender ID
    /// </summary>
    public Auid ToId { get; init; } = Auid.Empty;

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
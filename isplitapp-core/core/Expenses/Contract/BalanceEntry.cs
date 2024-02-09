using System.Text.Json.Serialization;

namespace IB.ISplitApp.Core.Expenses.Contract;

/// <summary>
/// Balance line entry
/// </summary>
public record BalanceEntry
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
    [JsonPropertyName("amount")]
    public decimal FuAmount { get; init; }
};
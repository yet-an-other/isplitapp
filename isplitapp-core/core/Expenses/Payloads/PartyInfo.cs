using System.Text.Json.Serialization;
using IB.ISplitApp.Core.Utils;

namespace IB.ISplitApp.Core.Expenses.Payloads;

/// <summary>
/// Response with party data and additional summary 
/// </summary>
public record PartyInfo
{
    /// <summary>
    /// Unique party ID 
    /// </summary>
    public string Id { get; init; } = IdUtil.DefaultId;
    
    /// <summary>
    /// Name of the party
    /// </summary>
    public string Name { get; init; } = string.Empty;
    
    /// <summary>
    /// Name of the currency for all expenses in the group
    /// </summary>
    public string Currency { get; init; } = "USD";
    
    /// <summary>
    /// When the party was created in UTC time
    /// </summary>
    public DateTime Created { get; init; } = DateTime.UtcNow;
    
    /// <summary>
    /// Last time the party was updated in UTC
    /// </summary>
    public DateTime Updated { get; init; } = DateTime.UtcNow;
    
    /// <summary>
    /// How much money the party has spent in total
    /// </summary>
    [JsonPropertyName("totalExpenses")]
    public decimal FuTotalExpenses { get; init; } = 0;
    
    /// <summary>
    /// Total amount of the party members
    /// </summary>
    public int TotalParticipants { get; init; } = 0;

    /// <summary>
    /// Number of expenses
    /// </summary>
    public int TotalExpenseNumber { get; init; } = 0;

    /// <summary>
    /// Total unpaid balance
    /// </summary>
    [JsonPropertyName("totalBorrow")]
    public decimal FuTotalBorrow { get; init; } = 0;
    
    /// <summary>
    /// List of all participants in the party
    /// </summary>
    public ParticipantResponse[] Participants { get; init; } = [];
}

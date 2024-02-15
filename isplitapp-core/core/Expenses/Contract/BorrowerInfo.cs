
using System.Text.Json.Serialization;

namespace IB.ISplitApp.Core.Expenses.Contract;


public record BorrowerInfo 
{
    public string ParticipantId { get; init; } = string.Empty;
    
    public string ParticipantName { get; init; } = string.Empty;

    [JsonPropertyName("amount")]
    public decimal FuAmount { get; init; } = 0;
    
    public int Share { get; init; } = 0;
    
    public int Percent { get; init; } = 0;
}
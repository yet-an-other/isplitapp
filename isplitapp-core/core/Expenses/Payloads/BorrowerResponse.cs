
using System.Text.Json.Serialization;

namespace IB.ISplitApp.Core.Expenses.Payloads;


public record BorrowerResponse 
{
    public string ParticipantId { get; init; } = string.Empty;
    
    public string ParticipantName { get; init; } = string.Empty;

    [JsonPropertyName("amount")]
    public decimal FuAmount { get; init; } = 0;
}
using System.Text.Json.Serialization;
using IB.Utils.Ids;

namespace IB.ISplitApp.Core.Expenses.Endpoints;


public record BorrowerInfo 
{
    public Auid ParticipantId { get; init; } = Auid.Empty;
    
    public string ParticipantName { get; init; } = string.Empty;

    [JsonPropertyName("amount")]
    public decimal FuAmount { get; init; } = 0;
    
    public int Share { get; init; } = 0;
    
    public int Percent { get; init; } = 0;
}
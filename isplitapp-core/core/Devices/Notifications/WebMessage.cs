using System.Text.Json.Serialization;
using IB.Utils.Ids;

namespace IB.ISplitApp.Core.Devices.Notifications;

public record WebMessage
{
    [JsonPropertyName("title")] 
    public string Title { get; init; } = string.Empty;
        
    [JsonPropertyName("body")]
    public string Body { get; init; } = string.Empty;

    [JsonPropertyName("data")]
    public CustomData Data { get; init; } = new CustomData();
}

public record CustomData
{
    [JsonPropertyName("partyId")]
    public Auid PartyId { get; init; } = Auid.Empty;
}
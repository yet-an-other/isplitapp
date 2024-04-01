using System.Text.Json.Serialization;

namespace IB.ISplitApp.Core.Users.Notifications;

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
    public string PartyId { get; init; } = string.Empty;
}
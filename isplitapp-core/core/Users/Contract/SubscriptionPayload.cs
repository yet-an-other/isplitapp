using System.Text.Json.Serialization;
using FluentValidation;

using IB.ISplitApp.Core.Utils;

namespace IB.ISplitApp.Core.Users.Contract;

public class SubscriptionPayload
{
    [JsonPropertyName("endpoint")] 
    public string Endpoint { get; init; } = string.Empty;

    [JsonPropertyName("keys")] 
    public FcmKeys Keys { get; init; } = new FcmKeys();
}

public class FcmKeys
{
    [JsonPropertyName("p256dh")]
    public string P256Dh { get; init; } = string.Empty;
    
    [JsonPropertyName("auth")]
    public string Auth { get; init; } = string.Empty;
}


public class SubscriptionPayloadValidator : AbstractValidator<SubscriptionPayload>
{
    public SubscriptionPayloadValidator()
    {
        RuleFor(s => s.Endpoint)
            .NotEmpty()
            .Must(s =>s.StartsWith("https://"))
            .WithMessage($"Endpoint must not be empty and starts with https://");
        RuleFor(s => s.Keys.P256Dh)
            .NotEmpty()
            .WithMessage("p256dh must not be empty");
        RuleFor(s => s.Keys.Auth)
            .NotEmpty()
            .WithMessage("Auth must not be empty");
    }
}
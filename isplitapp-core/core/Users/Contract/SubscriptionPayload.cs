using System.Text.Json.Serialization;
using FluentValidation;


namespace IB.ISplitApp.Core.Users.Contract;

public class SubscriptionPayload
{
    [JsonPropertyName("isIos")]
    public bool IsIos { get; init; } = false;

    [JsonPropertyName("deviceFcmToken")]
    public string DeviceFcmToken { get; init; } = string.Empty;
    
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
        RuleFor(s => s.DeviceFcmToken)
            .NotEmpty()
            .When(s => s.IsIos)
            .WithMessage("iOS device token must not be empty");
        
        RuleFor(s => s.Endpoint)
            .NotEmpty()
            .Must(s =>s.StartsWith("https://"))
            .When(s => !s.IsIos)
            .WithMessage($"Endpoint must not be empty and starts with https://");
        RuleFor(s => s.Keys.P256Dh)
            .NotEmpty()
            .When(s => !s.IsIos)
            .WithMessage("p256dh must not be empty");
        RuleFor(s => s.Keys.Auth)
            .NotEmpty()
            .When(s => !s.IsIos)
            .WithMessage("Auth must not be empty");
    }
}
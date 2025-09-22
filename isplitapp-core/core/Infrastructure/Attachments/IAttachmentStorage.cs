using System.Net;

namespace IB.ISplitApp.Core.Infrastructure.Attachments;

public record PresignedUpload(string Url, Dictionary<string, string> Fields, DateTimeOffset ExpiresAt, string Key);
public record PresignedGet(string Url, DateTimeOffset ExpiresAt);

public interface IAttachmentStorage
{
    PresignedUpload CreatePresignedPost(string key, string contentType, int maxContentLengthBytes, TimeSpan expiry);
    PresignedGet CreatePresignedGet(string key, TimeSpan expiry);
    Task<(bool Exists, long? Size, string? ContentType)> HeadAsync(string key, CancellationToken ct);
    Task DeleteAsync(string key, CancellationToken ct);
    Task CopyAsync(string sourceKey, string destinationKey, CancellationToken ct);
}

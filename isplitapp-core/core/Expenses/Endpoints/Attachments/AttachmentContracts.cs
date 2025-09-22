using System.ComponentModel.DataAnnotations;
using IB.Utils.Ids;

namespace IB.ISplitApp.Core.Expenses.Endpoints.Attachments;

public record PresignAttachmentRequest(
    [property: Required] string FileName,
    [property: Required] string ContentType,
    [property: Range(1, 512000)] int ExpectedSizeBytes
);

public record PresignAttachmentResponse(
    Auid AttachmentId,
    string UploadUrl,
    Dictionary<string, string> Headers,
    int MaxBytes,
    DateTimeOffset ExpiresAt
);

public record AttachmentInfo(
    Auid AttachmentId,
    string? FileName,
    string ContentType,
    int SizeBytes,
    string Url,
    DateTimeOffset ExpiresAt
);

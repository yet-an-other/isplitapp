namespace IB.ISplitApp.Core.Infrastructure.Attachments;

public class S3Options
{
    public string Endpoint { get; set; } = string.Empty; // optional for AWS
    public string Region { get; set; } = "eu-central-1";
    public string Bucket { get; set; } = string.Empty;
    public string? AccessKey { get; set; }
    public string? SecretKey { get; set; }
    public bool ForcePathStyle { get; set; } = false; // true for MinIO
    public int PresignExpiryMinutes { get; set; } = 10;
}

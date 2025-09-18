using Amazon;
using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Model;
using Amazon.S3.Util;

namespace IB.ISplitApp.Core.Infrastructure.Attachments;

public class S3AttachmentStorage : IAttachmentStorage
{
    private readonly IAmazonS3 _s3;
    private readonly S3Options _options;

    public S3AttachmentStorage(IAmazonS3 s3, S3Options options)
    {
        _s3 = s3;
        _options = options;
    }

    public PresignedUpload CreatePresignedPost(string key, string contentType, int maxContentLengthBytes, TimeSpan expiry)
    {
        // Using a pre-signed PUT instead of POST due to SDK limitations here.
        // The client must set the exact Content-Type. Server enforces size on finalize (HEAD + delete if > limit).
        var request = new GetPreSignedUrlRequest
        {
            BucketName = _options.Bucket,
            Key = key,
            Expires = DateTime.UtcNow.Add(expiry),
            Verb = HttpVerb.PUT,
            ContentType = contentType
        };
        // Some S3-compatible providers require ACL to be specified; it is safe for AWS to omit or leave default.
        // request.Headers["x-amz-acl"] = S3CannedACL.Private.Value; // Uncomment if your provider requires explicit ACL
        var url = _s3.GetPreSignedURL(request);
        var fields = new Dictionary<string, string>
        {
            { "Content-Type", contentType }
        };
        return new PresignedUpload(url, fields, DateTimeOffset.UtcNow.Add(expiry), key);
    }

    public PresignedGet CreatePresignedGet(string key, TimeSpan expiry)
    {
        var request = new GetPreSignedUrlRequest
        {
            BucketName = _options.Bucket,
            Key = key,
            Expires = DateTime.UtcNow.Add(expiry),
            Verb = HttpVerb.GET
        };
        var url = _s3.GetPreSignedURL(request);
        return new PresignedGet(url, DateTimeOffset.UtcNow.Add(expiry));
    }

    public async Task<(bool Exists, long? Size, string? ContentType)> HeadAsync(string key, CancellationToken ct)
    {
        try
        {
            var response = await _s3.GetObjectMetadataAsync(new GetObjectMetadataRequest
            {
                BucketName = _options.Bucket,
                Key = key
            }, ct);
            return (true, response.ContentLength, response.Headers.ContentType);
        }
        catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return (false, null, null);
        }
    }

    public async Task DeleteAsync(string key, CancellationToken ct)
    {
        await _s3.DeleteObjectAsync(new DeleteObjectRequest
        {
            BucketName = _options.Bucket,
            Key = key
        }, ct);
    }

    public async Task CopyAsync(string sourceKey, string destinationKey, CancellationToken ct)
    {
        await _s3.CopyObjectAsync(new CopyObjectRequest
        {
            SourceBucket = _options.Bucket,
            SourceKey = sourceKey,
            DestinationBucket = _options.Bucket,
            DestinationKey = destinationKey
        }, ct);
    }
}

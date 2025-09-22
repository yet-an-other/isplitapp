using IB.Utils.Ids;
using LinqToDB.Mapping;

namespace IB.ISplitApp.Core.Expenses.Data;

/// <summary>
/// Attachment metadata for an expense
/// </summary>
[Table("expense_attachment")]
public record ExpenseAttachment
{
    [PrimaryKey]
    [Column("id")]
    public Auid Id { get; init; } = Auid.Empty;

    [Column("expense_id")]
    public Auid ExpenseId { get; init; } = Auid.Empty;

    [Column("file_name")] 
    public string? FileName { get; init; }

    [Column("content_type")]
    public string ContentType { get; init; } = string.Empty;

    [Column("size_bytes")]
    public int SizeBytes { get; init; }

    [Column("s3_key")]
    public string S3Key { get; init; } = string.Empty;

    [Column("created_at", DbType = "timestamptz")]
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
}

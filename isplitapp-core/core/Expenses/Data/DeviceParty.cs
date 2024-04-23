using IB.Utils.Ids;
using LinqToDB.Mapping;

namespace IB.ISplitApp.Core.Expenses.Data;

/// <summary>
/// Who has access to which party
/// </summary>
[Table("device_party")]
public record DeviceParty
{
    /// <summary>
    /// Reference to a User
    /// </summary>
    [Column("device_id")]
    [PrimaryKey]
    public Auid DeviceId { get; init; } = Auid.Empty;

    /// <summary>
    /// Reference to a Party
    /// </summary>
    [Column("party_id")]
    [PrimaryKey]
    public Auid PartyId { get; init; } = Auid.Empty;

    /// <summary>
    /// Is this group in archive
    /// </summary>
    [Column("is_archived")]
    public bool IsArchived { get; init; } = false;
}

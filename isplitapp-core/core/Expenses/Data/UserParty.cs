using LinqToDB.Mapping;

namespace IB.ISplitApp.Core.Expenses.Data;

/// <summary>
/// Who has access to which party
/// </summary>
[Table("user_party")]
public record UserParty
{
    /// <summary>
    /// Reference to a User
    /// </summary>
    [property: Column("user_id")]
    [property: PrimaryKey]
    public string UserId { get; init; } = string.Empty;

    /// <summary>
    /// Reference to a Party
    /// </summary>
    [property: Column("party_id")]
    [property: PrimaryKey]
    public string PartyId { get; init; } = string.Empty;
}
using System.Text.RegularExpressions;
using Zanaptak.IdGenerator;

namespace IB.ISplitApp.Core.Utils;

/// <summary>
/// A static class that provides methods to work with ID
/// </summary>
public static partial class IdUtil
{
    private static readonly IdGenerator IdGenerator = new(IdSize.Small);
    
    [GeneratedRegex("^[a-zA-Z]{16}$")]
    private static partial Regex IdRegex();
    
    /// <summary>
    /// Generate new unique ID
    /// </summary>
    public static string NewId()
    {
        return IdGenerator.Next();
    }
    
    /// <summary>
    /// The name of header property to transfer unique User ID
    /// </summary>
    public const string UserHeaderName = "X-USER-ID";
    
    /// <summary>
    /// Empty ID
    /// </summary>
    public const string DefaultId = "XXXXXXXXXXXXXXXX";

    /// <summary>
    /// Check if ID is in correct format
    /// </summary>
    /// <param name="id">The ID to check</param>
    /// <returns>true if ID valid, false otherwise</returns>
    public static bool IsValidId(string? id)
    {
        return IdRegex().IsMatch(id ?? "");
    }
}
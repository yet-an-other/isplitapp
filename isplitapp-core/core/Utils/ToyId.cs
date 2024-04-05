using System.Security.Cryptography;
using System.Text.RegularExpressions;

namespace IB.ISplitApp.Core.Utils;

/// <summary>
/// A helper class to generate different sort of Ids and timestamps
/// Made for fun mostly, it is not recommended to use it in a serious production
/// </summary>
public static partial class ToyId
{
    // Alphabet used to convert digits
    //
    private static readonly char[] Alphabet = 
        "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
        .ToCharArray();
    
    // Alphabet values to convert back
    //
    private static readonly Dictionary<char, int> AlphabetValues = Alphabet
        .Select((c,i)=>new {Char=c, Index=i})
        .ToDictionary(c=> c.Char, c=> c.Index);

    // Base of numeric system
    //
    private static readonly int Base = Alphabet.Length;

    // alphanumeric timestamp length
    //
    private const byte TsSize = 9;
    
    // length of the random part ofId
    //
    private const byte RndSize = 9;
    
    // regex to validate timestamp
    //
    [GeneratedRegex("^[0-9a-zA-Z]{9}$")]
    private static partial Regex TimestampRegex();     
    
    // timestamp starts from 2020-01-01 to save space
    //
    private static readonly long ZeroTime = new DateTime(2020, 1, 1).Ticks;

    // maximum possible timestamp
    //
    public const string TimestampMax = "zzzzzzzzz";
    
    // maximum possible timestamp
    //
    public const string TimestampMin = "000000000";
    
    /// <summary>
    /// Generates a Timestamp based on current moment
    /// </summary>
    /// <returns>alphanumeric timestamp</returns>
    public static string Timestamp()
    {
        return Timestamp(DateTime.UtcNow);
    }

    /// <summary>
    /// Generates a timestamp based on given time
    /// </summary>
    /// <param name="dateTime">datetime to convert</param>
    /// <returns>alphanumeric timestamp</returns>
    public static string Timestamp(this DateTime dateTime)
    {
        if (dateTime.Ticks < ZeroTime)
            throw new ArgumentException("dateTime must be greater than 2020-01-01");
        
        var elapsed = (dateTime.Ticks - ZeroTime) / 10;
        var timestamp = new char[TsSize];
        
        for (var i = TsSize - 1; i >= 0; i--)
        {
            timestamp[i] = Alphabet[elapsed % Base];
            elapsed /= Base;
        }
        return new string(timestamp);
    }

    /// <summary>
    /// Reconstruct the Date back from generated timestamp
    /// </summary>
    /// <param name="timestamp"></param>
    /// <returns></returns>
    public static DateTime ParseTimestamp(string timestamp)
    {
        if (!IsValidTimestamp(timestamp))
            throw new ArgumentException("The timestamp is not correct");
        
        var tsArray = timestamp.ToCharArray();
        long ticks = 0;
        for (var i = TsSize - 1; i >= 0; i--)
        {
            var number = AlphabetValues[tsArray[i]]; 
            ticks += number * (long)Math.Pow(Base, TsSize - 1 - i);
        }
        return new DateTime(ticks * 10 + ZeroTime);
    }

    // public static string NewId()
    // {
    //     var elapsed = (DateTime.UtcNow.Ticks - ZeroTime) / 10;
    //     var buffer = new char[TsSize + RndSize];
    //     
    //     var salt = new byte[RndSize];
    //     using (var generator = RandomNumberGenerator.Create())
    //     {
    //         generator.GetBytes(salt);
    //     }
    //
    //
    //     for (var i = TsSize - 1; i >= 0; i--)
    //     {
    //         buffer[i] = Alphabet[elapsed % Base];
    //         elapsed /= Base;
    //     }
    //     return new string(buffer);
    // }
    
    /// <summary>
    /// Check if ID is in correct format
    /// </summary>
    /// <param name="id">The ID to check</param>
    /// <returns>true if ID valid, false otherwise</returns>
    public static bool IsValidTimestamp(string? id)
    {
        return TimestampRegex().IsMatch(id ?? "");
    }
}
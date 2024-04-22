using System.Runtime.CompilerServices;

[assembly: InternalsVisibleTo("Tests")]
namespace IB.Utils.Ids.Converters;

/// <summary>
/// Encoder/Decoder form long to base62 and back
/// </summary>

internal static class Base62
{
    internal static readonly char[] Alphabet = 
        "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
            .ToCharArray();

    private static readonly Dictionary<char, int> AlphabetValues = Alphabet
        .Select((c, i) => new { Char = c, Index = i })
        .ToDictionary(c => c.Char, c => c.Index);
    
    private static readonly int Base = Alphabet.Length;
    
    /// <summary>
    /// Encode int64 value to base62 string
    /// </summary>
    /// <param name="value">number to encode</param>
    /// <param name="length">length of result string</param>
    /// <returns>Encoded string. If the length is bigger than needed, the rest will be padded by 0</returns>
    public static string ToBase62(this long value, byte length)
    {
        var buffer = new char[length];
        
        for (var i = length - 1; i >= 0; i--)
        {
            buffer[i] = Alphabet[value % Base];
            value /= Base;
        }
        return new string(buffer);
    }

    /// <summary>
    /// Decode base62 string to int64
    /// </summary>
    /// <param name="base62">encoded string</param>
    /// <returns>decoded value</returns>
    /// <exception cref="ArgumentException">If argument is not a valid Base62 string</exception>
    /// <remarks>
    /// No checks for overflow. If string is too long, the result will be rounded 
    /// </remarks>
    public static long ToInt64(this string base62)
    {
        if (!TryToInt64(base62, out var value))
            throw new ArgumentException("The base62 string has incorrect characters", nameof(base62));

        return value;
    }
    
    /// <summary>
    /// Trying to convert base62 string to int64
    /// </summary>
    /// <param name="base62">encoded string</param>
    /// <param name="value">int64 result in case of success, otherwise 0</param>
    /// <returns>True if case of success conversion</returns>
    /// <remarks>
    /// No checks for overflow. If string is too long, the result will be rounded 
    /// </remarks>
    public static bool TryToInt64(this string base62, out long value)
    {
        value = 0;
        var buffer = base62.ToCharArray();
        var length = buffer.Length;
        
        for (var i = length - 1; i >= 0; i--)
        {
            if (!AlphabetValues.TryGetValue(buffer[i], out var number))
                return false;
            
            value += number * (long)Math.Pow(Base, length - 1 - i);
        }

        return true;
    }
}
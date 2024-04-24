using System.Runtime.CompilerServices;
using System.Text.Json.Serialization;
using IB.Utils.Ids.Converters;

namespace IB.Utils.Ids;

/// <summary>
/// Represents Alphanumeric Unique Identifier
/// </summary>
[Serializable]
[JsonConverter(typeof(AuidJsonConverter))]
public readonly struct Auid:
    IComparable,
    IComparable<Auid>,
    IEquatable<Auid>
{
    private readonly long _lid;
    private readonly string _sid;
    private const byte IdLength = 11;
    
    /// <summary>
    /// Returns uninitialized instance of Auid
    /// </summary>
    public static readonly Auid Empty = new();

    /// <summary>
    /// Creates a new <see cref="Auid"/> from string id
    /// </summary>
    /// <param name="sid">string id</param>
    /// <returns>A new <see cref="Auid"/></returns>
    /// <exception cref="ArgumentException">if string is not correct id</exception>
    public static Auid FromString(string sid)
    {
        if (!TryParse(sid, out var auid))
            throw new ArgumentException("id string is not valid", nameof(sid));
        
        return auid;
    }
    
    /// <summary>
    /// Trying to create a new <see cref="Auid"/> from it's string representation
    /// </summary>
    /// <param name="sid">string representation of id</param>
    /// <param name="auid">new <see cref="Auid"/> if parsing was success and Auid.Empty otherwise</param>
    /// <returns>True in case of success</returns>
    public static bool TryParse(string sid, out Auid auid)
    {
        auid = Empty;
        if (string.IsNullOrEmpty(sid) || sid.Length != IdLength)
            return false;

        if (!sid.TryToInt64(out var lid))
            return false;
        
        auid = new Auid(lid, sid);
        return true;
    }
    
    /// <summary>
    /// Creates Auid instance from int64
    /// </summary>
    /// <param name="lid">int64 id</param>
    internal Auid(long lid)
    {
        _lid = lid;
        _sid = _lid.ToBase62(IdLength);
    }

    /// <summary>
    /// Creates Auid instance from base62 and long
    /// </summary>
    /// <param name="sid">Base62 string representation of the id</param>
    /// <param name="lid">Int64 representation of the id</param>
    private Auid(long lid, string sid)
    {
        _lid = lid;
        _sid = sid;
    }

    /// <summary>
    /// Returns the Int64 representation of id
    /// </summary>
    internal long Int64 => _lid;
    
    /// <summary>
    /// String representation of Id
    /// </summary>
    public override string ToString()
    {
        return _sid;
    }

    public int CompareTo(object? obj)
    {
        return obj switch
        {
            null => 1,
            Auid auid => _lid.CompareTo(auid._lid),
            _ => throw new ArgumentException("Object must be Auid type", nameof(obj))
        };
    }

    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    public int CompareTo(Auid other)
    {
        return _lid.CompareTo(other._lid);
    }

    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    public bool Equals(Auid other)
    {
        return _lid.Equals(other._lid);
    }
    
    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    public override int GetHashCode()
    {
        return _lid.GetHashCode();
    }    

    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    public override bool Equals(object? obj)
    {
        if (obj == null)
            return false;
        
        return obj is Auid auid && _lid.Equals(auid._lid);
    }
    
    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    public static bool operator ==(Auid left, Auid right)
    {
        return left.Equals(right);
    }

    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    public static bool operator !=(Auid left, Auid right)
    {
        return !(left == right);
    }
}

using System.Runtime.CompilerServices;
using IB.Utils.Ids.Converters;
using IB.Utils.Ids.FidProviders;
using IB.Utils.Ids.TimeSources;

namespace IB.Utils.Ids;

/// <summary>
/// The factory to create and manage <see cref="Auid"/> objects
/// </summary>
public class AuidFactory
{
    private const byte TimestampLength = 7;
    private const byte TimestampExLength = 9;
    
    private readonly uint _factoryId = 0;
    private long _lastTimestamp = -1;
    private uint _sequence = 0;
    
    private readonly int _shiftTimestamp;
    private readonly int _shiftFactoryId;
    
    private readonly object _lockObj = new();
    
    private Auid _maxAuid;


    /// <summary>
    /// Maximum timestamp
    /// </summary>
    public static string MaxTimestamp { get; } = new(
        Enumerable
            .Repeat(Base62.Alphabet.Last(), TimestampLength)
            .ToArray());

    /// <summary>
    /// Minimum timestamp
    /// </summary>
    public static string MinTimestamp { get; } = new(
        Enumerable
            .Repeat(Base62.Alphabet.First(), TimestampLength)
            .ToArray());
    
    /// <summary>
    /// Auid bit structure description
    /// </summary>
    public AuidStructure AuidStructure { get; }
    
    /// <summary>
    /// Timestamp generator
    /// </summary>
    public ITimeSource TimeSource { get; }
    
    /// <summary>
    /// Creates a new <see cref="AuidFactory"/> with all default settings
    /// FactoryId is automatically generated based on ip address
    /// IdStructure is comprise out of 41 bit for timestamp, 12 bit for factory id, and 10 bit for sequence
    /// The Time source is based on Stopwatch with 0.001s (1 millisecond) accuracy 
    /// </summary>
    public AuidFactory()
        : this(new Ipv4FidProvider(), new AuidStructure(), new SwTimeSource())
    {}
    
    /// <summary>
    /// Creates a new <see cref="AuidFactory"/> with specific const factoryId
    /// </summary>
    /// <param name="factoryId">Unique factoryId in range from <see cref="AuidStructure"/></param>
    public AuidFactory(uint factoryId)
        : this(new ConstFidProvider(factoryId), new AuidStructure(), new SwTimeSource())
    {}
    
    /// <summary>
    /// Creates a new <see cref="AuidFactory"/>
    /// </summary>
    /// <param name="factoryIdProvider"><see cref="IFidProvider"/> that can generate unique factory id</param>
    /// <param name="auidStructure">Structure of ID</param>
    /// <param name="timeSource">Timestamp generator</param>
    /// <exception cref="ArgumentOutOfRangeException">If factoryId is out of range in <see cref="AuidStructure"/></exception>
    public AuidFactory(IFidProvider factoryIdProvider, AuidStructure auidStructure, ITimeSource timeSource)
    {
        AuidStructure = auidStructure;
        TimeSource = timeSource;
        _factoryId = factoryIdProvider.GetFactoryId(auidStructure.MaxFactoryId);

        if (_factoryId >= AuidStructure.MaxFactoryId)
            throw new ArgumentOutOfRangeException(
                nameof(factoryIdProvider),
                $"FactoryId must be between 0 and {AuidStructure.MaxFactoryId}.");
        
        _shiftTimestamp = AuidStructure.FactoryIdBits + AuidStructure.SequenceBits;
        _shiftFactoryId = AuidStructure.SequenceBits;
    }

    /// <summary>
    /// Creates a new instance of <see cref="Auid"/>
    /// </summary>
    public Auid NewId()
    {
        return new Auid(CreateInt64Id(out _, out _));
    }

    /// <summary>
    /// Trying to parse <see cref="Auid"/> and extract info from different parts of id
    /// </summary>
    /// <param name="auid">unique alphanumeric id <see cref="Auid"/></param>
    /// <param name="auidInfo">parsing results <see cref="AuidInfo"/></param>
    /// <returns>True if parsing success, and false otherwise</returns>
    public bool TryExtractInfo(Auid auid, out AuidInfo auidInfo)
    {
        return TryParseInfo(auid, out auidInfo, out _);
    }
    
    /// <summary>
    /// Extracting info from <see cref="Auid"/> and throws if something wrong
    /// </summary>
    /// <param name="auid"><see cref="Auid"/> instanse to extract</param>
    /// <returns><see cref="AuidInfo"/> With auid creation metadata</returns>
    /// <exception cref="Exception">if extraction is not possible</exception>
    public AuidInfo ExtractInfo(Auid auid)
    {
        if (!TryParseInfo(auid, out var auidInfo, out var exception))
            throw exception;
        return auidInfo;
    }    
    

    /// <summary>
    /// Return alphanumeric representation of current timestamp since factory epoch
    /// </summary>
    /// <remarks>
    /// This id is not meant to be unique! This could be useful as a timestamp mark for sorting but not to provide uniqueness
    /// </remarks>
    public string Timestamp()
    {
        CreateInt64Id(out var timestamp, out _);
        return timestamp.ToBase62(TimestampLength);
    }

    /// <summary>
    /// Returns datetime of the timestamp
    /// </summary>
    /// <param name="timestamp">timestamp encoded as Base62 string</param>
    public DateTime ParseTimestamp(string timestamp) => 
        timestamp.Length switch
        {
            TimestampLength => TimeSource.DecodeTimestamp(timestamp.ToInt64()),
            TimestampExLength => TimeSource.DecodeTimestamp(timestamp.ToInt64() >> _shiftFactoryId),
            _ => throw new ArgumentException("Timestamp has wrong length", nameof(timestamp))
        };
    

    /// <summary>
    /// Return alphanumeric representation of current timestamp, plus sequenceNum since factory epoch
    /// </summary>
    /// <remarks>
    /// This id is not meant to be unique! This could be useful as a timestamp mark for sorting but not to provide uniqueness
    /// </remarks>
    public string TimestampEx()
    {
        CreateInt64Id(out var timestamp, out var sequence);
        return ((timestamp << _shiftFactoryId) | sequence).ToBase62(TimestampExLength);        
    }

    /// <summary>
    /// Max possible date with given Id structure & timeslot
    /// </summary>
    public DateTime MaxDateTime =>
        TimeSource.DecodeTimestamp(AuidStructure.MaxTimestamp);

    /// <summary>
    /// Maximum Auid
    /// </summary>
    public Auid MaxAuid
    {
        get
        {
            if (_maxAuid != Auid.Empty) return _maxAuid;
            
            var longId = (AuidStructure.MaxTimestamp << _shiftTimestamp)
                         | ((long)AuidStructure.MaxFactoryId << _shiftFactoryId)
                         | AuidStructure.MaxSequenceNum;
            _maxAuid = new Auid(longId);
            return _maxAuid;
        }
    }

    /// <summary>
    /// Minimum Auid
    /// </summary>
    public Auid MinAuid => new(0);

    private long CreateInt64Id(out long timestamp, out uint sequence)
    {
        lock (_lockObj)
        {
            var epochTimestamp = GetTimestamp();
            timestamp = epochTimestamp & AuidStructure.MaxTimestamp;

            if (timestamp < _lastTimestamp || epochTimestamp < 0)
                throw new ArithmeticException(
                    $"Clock moved backwards or wrapped around. " +
                    $"Refusing to generate id for {_lastTimestamp - timestamp} ticks");

            if (timestamp == _lastTimestamp)
            {
                if (_sequence >= AuidStructure.MaxSequenceNum)
                {
                    SpinWait.SpinUntil(() => _lastTimestamp != (GetTimestamp() & AuidStructure.MaxTimestamp));
                    return CreateInt64Id(out timestamp, out sequence); // Try again
                }
                _sequence++;
            }
            else
            {
                _sequence = 0;
                _lastTimestamp = timestamp;
            }

            sequence = _sequence;
            return (timestamp << _shiftTimestamp)
                   | ((long)_factoryId << _shiftFactoryId)
                   | sequence;
        }
    }
    
    /// <summary>
    /// Gets timestamp of specified precision since the <see cref="ITimeSource"/>'s epoch.
    /// </summary>
    /// <returns>Returns the timestamp since the <see cref="ITimeSource"/>'s epoch.</returns>
    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    private long GetTimestamp() => TimeSource.GetTimestamp();


    /// <summary>
    /// Parse Auid and extract info from the id
    /// </summary>
    private bool TryParseInfo(Auid auid, out AuidInfo auidInfo, out Exception exception)
    {
        auidInfo = new AuidInfo();
        exception = new ArgumentException();
        if (auid.CompareTo(MaxAuid) > 0)
        {
            exception = new ArgumentException("id could not be parsed by this factory", nameof(auid));
            return false;
        }
        
        try
        {
            var longId = auid.Int64;
            var timestamp = (longId >> _shiftTimestamp) & AuidStructure.MaxTimestamp;
            auidInfo = new AuidInfo(
                auid.ToString(),
                auid.Int64,
                (uint)((longId >> _shiftFactoryId) & AuidStructure.MaxFactoryId),
                (uint)(longId & AuidStructure.MaxSequenceNum),
                TimeSource.DecodeTimestamp(timestamp));
        }
        catch (Exception e)
        {
            exception = e;
            return false;
        }

        return true;
    }
}
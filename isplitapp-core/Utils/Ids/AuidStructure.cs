namespace IB.Utils.Ids;

/// <summary>
/// Specifies the number of bits to use for the different parts of an Id 
/// </summary>
public record AuidStructure
{
    /// <summary>
    /// Total bits in Id
    /// </summary>
    private const byte TotalBits = 63;
    
    /// <summary>
    /// Creates default <see cref="AuidStructure"/> with 41 bits for the timestamp part, 12 bits for the factory id 
    /// part and 10 bits for the sequence part of the id.
    /// </summary>
    public AuidStructure() : this(41, 12, 10){}
    
    /// <summary>
    /// Creates custom <see cref="AuidStructure"/>
    /// </summary>
    /// <param name="timestampBits">Number of bits to use for the timestamp of Id's.</param>
    /// <param name="factoryIdBits">Number of bits to use for the factory-id of Id's.</param>
    /// <param name="sequenceBits">Number of bits to use for the sequence of Id's.</param>
    /// <exception cref="InvalidOperationException">if sum of bits != 63</exception>
    public AuidStructure(byte timestampBits, byte factoryIdBits, byte sequenceBits)
    {
        if (timestampBits + factoryIdBits + sequenceBits != TotalBits)
        {
            throw new InvalidOperationException($"Number of bits used to generate Id's is not equal to {TotalBits}");
        }
        
        TimestampBits = timestampBits;
        FactoryIdBits = factoryIdBits;
        SequenceBits = sequenceBits;
    }
    
    /// <summary>
    /// Number of bits to use for the timestamp part of the Id's to generate.
    /// </summary>
    public byte TimestampBits { get; }

    /// <summary>
    /// Number of bits to use for the generator id part of the Id's to generate.
    /// </summary>    
    public byte FactoryIdBits { get; }
    
    /// <summary>
    /// Number of bits to use for the sequence part of the Id's to generate.
    /// </summary>
    public byte SequenceBits { get; }
    
    /// <summary>
    /// Returns the maximum number of intervals for this <see cref="AuidStructure"/> configuration.
    /// </summary>
    public long MaxTimestamp => (1L << TimestampBits) - 1;

    /// <summary>
    /// Returns the maximum number of generators available for this <see cref="AuidStructure"/> configuration.
    /// </summary>
    public uint MaxFactoryId => (1U << FactoryIdBits) - 1;

    /// <summary>
    /// Returns the maximum number of sequential Id's for a time-interval (e.g. max. number of Nums generated 
    /// within a single Timestamp).
    /// </summary>
    public uint MaxSequenceNum => (1U << SequenceBits) - 1;   
}
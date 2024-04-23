namespace IB.Utils.Ids;

public readonly struct AuidInfo(string aid, long lid, uint factoryId, uint counterValue, DateTime timestamp)
{
    /// <summary>
    /// Alphanumeric id
    /// </summary>
    public string Aid { get; } = aid;

    /// <summary>
    /// int64 id
    /// </summary>
    public long Lid { get; } = lid;

    /// <summary>
    /// Unique Factory Id
    /// </summary>
    public uint FactoryId { get; } = factoryId;

    /// <summary>
    /// Value of counter within timestamp
    /// </summary>
    public uint CounterValue { get; } = counterValue;

    /// <summary>
    /// Moment of the id creation
    /// </summary>
    public DateTime Timestamp { get; } = timestamp;
}
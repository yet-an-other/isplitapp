using System.Diagnostics;

namespace IB.Utils.Ids.TimeSources;

/// <summary>
/// Provides the time data based on Stopwatch ticks
/// </summary>
public class SwTimeSource: ITimeSource
{
    private readonly TimeSpan _offset;
    private readonly long _startTimestamp;

    /// <summary>
    /// Default constructor
    /// Epoch: 2020-01-01
    /// TimeSlot: 0.001s
    /// </summary>
    public SwTimeSource()
        : this(
            new DateTime(2020, 1, 1, 0,0,0, DateTimeKind.Utc), 
            TimeSpan.FromMilliseconds(1))
    {}
    
    /// <summary>
    /// Initialises the TimerSource with provided Epoch and TimeSlot
    /// </summary>
    /// <param name="epoch">Timestamp zero</param>
    /// <param name="tickSize">
    /// How long is the 'Tick'. Could be microseconds, milliseconds, minutes, or even hours
    /// </param>
    public SwTimeSource(DateTimeOffset epoch, TimeSpan tickSize)
    {
        if (epoch > DateTimeOffset.UtcNow)
            throw new ArgumentException("Epoch could not be in the future");
        
        Epoch = epoch;
        TickSize = tickSize;
        _offset = DateTimeOffset.UtcNow - Epoch;
        _startTimestamp = Stopwatch.GetTimestamp();
    }
    
    /// <summary>
    /// Timestamp zero
    /// </summary>
    /// <remarks>
    /// Default is 2020-01-01
    /// </remarks>
    public DateTimeOffset Epoch { get; }
    
    /// <summary>
    /// Amount of ticks in the minimum time interval.
    /// </summary>
    /// <remarks>
    /// Default is equal to 1 millisecond (0.001s)
    /// </remarks>
    public TimeSpan TickSize { get; }

    /// <summary>
    /// Returns Timestamp in sw Ticks since Epoch
    /// </summary>
    public long GetTimestamp() => (_offset.Ticks + Elapsed) / TickSize.Ticks;
    

    /// <summary>
    /// Calculates elapsed time since local offset
    /// </summary>
    private long Elapsed => (Stopwatch.GetTimestamp() - _startTimestamp)
                            / (long)(Stopwatch.Frequency * TickSize.TotalSeconds);
}
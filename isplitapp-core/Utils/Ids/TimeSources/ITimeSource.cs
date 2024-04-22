namespace IB.Utils.Ids.TimeSources;

/// <summary>
/// Interface for the time-sources tp provide the time information.
/// </summary>
public interface ITimeSource
{
    /// <summary>
    /// Timestamp zero.
    /// </summary>
    DateTimeOffset Epoch { get; }

    /// <summary>
    /// Minimum time interval for the time source. In other words, how long is one 'tick' in this time-source
    /// </summary>
    /// <remarks>
    /// It's up to the <see cref="ITimeSource"/> to define the tick size; it may be nanoseconds, milliseconds,
    /// seconds or even days or years.
    /// </remarks>
    TimeSpan TickSize { get; }

    /// <summary>
    /// Returns the current number of ticks for the <see cref="ITimeSource"/> since Epoch.
    /// </summary>
    /// <returns>The current number of ticks to be used when creating an id.</returns>
    long GetTimestamp();

    /// <summary>
    /// Returns DateTime decoded from timestamp
    /// </summary>
    /// <param name="timestamp">int64 timestamp</param>
    /// <returns>decoded DateTime</returns>
    DateTime DecodeTimestamp(long timestamp)
    {
        return Epoch
            .Add(TimeSpan.FromTicks(timestamp * TickSize.Ticks))
            .DateTime;
    }
}
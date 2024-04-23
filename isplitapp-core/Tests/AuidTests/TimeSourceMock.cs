using IB.Utils.Ids.TimeSources;

namespace Tests.AuidTests;

public class TimeSourceMock: ITimeSource
{
    private long _timestamp = 0;

    public DateTimeOffset Epoch => new DateTime(2020, 1, 1, 0, 0, 0, DateTimeKind.Utc);
    public TimeSpan TickSize => TimeSpan.FromMilliseconds(1);
    public long GetTimestamp() => _timestamp;

    public void NextTick() => Interlocked.Increment(ref _timestamp);

    public void PreviousTick() => Interlocked.Decrement(ref _timestamp);
}
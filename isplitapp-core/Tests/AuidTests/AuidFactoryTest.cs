using System.Text;
using IB.Utils.Ids;
using IB.Utils.Ids.FidProviders;
using Xunit.Abstractions;


namespace Tests.AuidTests;

public class AuidFactoryTest
{
    public AuidFactoryTest(ITestOutputHelper output)
    {
        var converter = new Converter(output);
        Console.SetOut(converter);
    }


    [Fact]
    public void SequenceShouldIncreaseEveryInvocation()
    {
        var factory = new AuidFactory(
            new ConstFidProvider(0),
            new AuidStructure(),
            new TimeSourceMock());

        Assert.Equal("00000000000", factory.NewId().ToString());
        Assert.Equal("00000000001", factory.NewId().ToString());
        Assert.Equal("00000000002", factory.NewId().ToString());
    }

    [Fact]
    public void InfoShouldBeExtracted()
    {
        // Arrange
        //
        var ts = new TimeSourceMock();
        var factory = new AuidFactory(new ConstFidProvider(22), new AuidStructure(), ts);

        // Act
        //
        var id = factory.NewId();
        var idInfo = factory.ExtractInfo(id);

        // Assert
        //
        Assert.Equal(22528, idInfo.Lid);
        Assert.Equal(22U, idInfo.FactoryId);
        Assert.Equal(0U, idInfo.CounterValue);

    }

    [Fact]
    public void SequenceShouldResetEveryNewTick()
    {
        var ts = new TimeSourceMock();
        var factory = new AuidFactory(new ConstFidProvider(0), new AuidStructure(), ts);

        Assert.Equal("00000000000", factory.NewId().ToString());
        ts.NextTick();
        var id1 = factory.NewId();
        Assert.Equal(0U, factory.ExtractInfo(id1).CounterValue);
        ts.NextTick();
        var id2 = factory.NewId();
        Assert.Equal(0U, factory.ExtractInfo(id2).CounterValue);
    }

    [Fact]
    //[ExpectedException(typeof(InvalidSystemClockException))]

    public void NewIdShouldThrowsOnClockBackwards()
    {
        var ts = new TimeSourceMock();
        var factory = new AuidFactory(new ConstFidProvider(0), new AuidStructure(), ts);

        ts.NextTick();
        ts.NextTick();
        ts.NextTick();

        factory.NewId();
        ts.PreviousTick(); // Set clock back 1 'tick', this results in the time going from "100" to "99"
        Assert.Throws<ArithmeticException>(() => factory.NewId());
    }

    [Fact]
    public void TimestampsShouldBeProperlyOrdered()
    {
        var ts = new TimeSourceMock();
        var factory = new AuidFactory(new ConstFidProvider(0), new AuidStructure(), ts);

        var id1 = factory.NewId();
        ts.NextTick();
        var id2 = factory.NewId();
        ts.NextTick();
        var id3 = factory.NewId();
        ts.NextTick();
        var id4 = factory.NewId();

        var array = new[] { id4, id3, id2, id1 };
        var sorted = array.OrderBy(i => i).ToArray();
        Assert.Equal(sorted[0], id1);
        Assert.Equal(sorted[1], id2);
        Assert.Equal(sorted[2], id3);
        Assert.Equal(sorted[3], id4);

        sorted = array.OrderByDescending(i => i).ToArray();
        Assert.Equal(sorted[0], id4);
        Assert.Equal(sorted[1], id3);
        Assert.Equal(sorted[2], id2);
        Assert.Equal(sorted[3], id1);
    }


    [Fact]
    public void RawTimestampShouldBeOrdered()
    {

        var factory = new AuidFactory();

        var id1 = factory.Timestamp();
        Thread.Sleep(1);
        var id2 = factory.Timestamp();
        Thread.Sleep(1);
        var id3 = factory.Timestamp();
        Thread.Sleep(1);
        var id4 = factory.Timestamp();

        Assert.True(id1 != id2);

        var array = new[] { id4, id3, id2, id1 };
        var sorted = array.OrderBy(i => i).ToArray();
        Console.WriteLine($"Unsorted: {string.Join(", ", array.Select(i => i.ToString()))}");
        Console.WriteLine($"Sorted: {string.Join(", ", sorted.Select(i => i.ToString()))}");
        Assert.Equal(sorted[0], id1);
        Assert.Equal(sorted[1], id2);
        Assert.Equal(sorted[2], id3);
        Assert.Equal(sorted[3], id4);

        sorted = array.OrderByDescending(i => i).ToArray();
        Assert.Equal(sorted[0], id4);
        Assert.Equal(sorted[1], id3);
        Assert.Equal(sorted[2], id2);
        Assert.Equal(sorted[3], id1);
    }


    [Fact]
    public void GeneratedIdCheck()
    {
        var factory = new AuidFactory();

        factory.TryExtractInfo(Auid.FromString("0sYHV8URvea"), out var info);

        Assert.Equal(0U, info.CounterValue);
        Assert.Equal(2694U, info.FactoryId);
        Assert.Equal(new DateTime(2025, 7, 30, 20, 7, 9, 393), info.Timestamp);
    }

        private class Converter(ITestOutputHelper output) : TextWriter
    {
        private string _textOut = string.Empty;
        public override Encoding Encoding => Encoding.Default;

        public override void WriteLine(string? message)
        {
            output.WriteLine(message);
        }
        public override void WriteLine(string format, params object?[] args)
        {
            output.WriteLine(format, args);
        }

        public override void Write(char value)
        {
            if (value == '\n')
            {
                output.WriteLine(_textOut);
                _textOut = ""; 
            }
            else
                _textOut += value;
        }
    }
    
}



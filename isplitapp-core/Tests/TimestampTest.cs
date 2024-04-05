using System.Text;
using IB.ISplitApp.Core.Utils;
using Xunit.Abstractions;

namespace Tests;

public class TimestampTest
{
    private ITestOutputHelper _output;
    public TimestampTest(ITestOutputHelper output)
    {
        _output = output;
        var converter = new Converter(output);
        Console.SetOut(converter);
    }

    private class Converter : TextWriter
    {
        ITestOutputHelper _output;
        public Converter(ITestOutputHelper output)
        {
            _output = output;
        }
        public override Encoding Encoding
        {
            get { return Encoding.Default; }
        }
        public override void WriteLine(string? message)
        {
            _output.WriteLine(message);
        }
        public override void WriteLine(string format, params object?[] args)
        {
            _output.WriteLine(format, args);
        }

        public override void Write(char value)
        {
            throw new NotSupportedException("This text writer only supports WriteLine(string) and WriteLine(string, params object[]).");
        }
    }
    
    [Fact]
    public void GeneratedValueShouldRevertedBack()
    {
        var tsDate = DateTime.UtcNow;

        ToyId.Timestamp(new DateTime(2020, 02, 01));
        ToyId.Timestamp(new DateTime(2024, 02, 01));
        ToyId.Timestamp(new DateTime(2028, 02, 01));
        var ts = tsDate.Timestamp();

        _output.WriteLine(tsDate.ToString("O"));
        _output.WriteLine(ts);
        var rts = ToyId.ParseTimestamp(ts);
        
        Assert.Equal(tsDate, rts);
        
        // 26784000000000      : 007bXvyRU0
        // 343008000000000     : 01ZOqaS3yC
        // 1289088000000000    : 05u37GH4ls
        // 2551392000000000    : 0BgUgaZi3k
        // 1344999517806620    : 069vTBbqqC

        var tsc = "69y02S6LU";
        _output.WriteLine(ToyId.ParseTimestamp(tsc).ToString("O"));
        var tsMax = "zzzzzzzzz";
        _output.WriteLine(ToyId.ParseTimestamp(tsMax).ToString("O"));
        var tsMin = "000000000";
        _output.WriteLine(ToyId.ParseTimestamp(tsMin).ToString("O"));
        var tsMin1 = "100000000";
        _output.WriteLine(ToyId.ParseTimestamp(tsMin1).ToString("O"));
    }
}
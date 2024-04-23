using System.Text;
using System.Text.Json;
using IB.Utils.Ids;
using IB.Utils.Ids.Converters;
using Xunit.Abstractions;

namespace Tests.AuidTests;

public class AuidStructTest
{
    public AuidStructTest( ITestOutputHelper output)
    {
        var converter = new Converter(output);
        Console.SetOut(converter);
    }
    [Fact]
    public void AuidEmptyShouldBeEqualAuidEmpty()
    {
        // Act
        var auid = new Auid();
        
        // Assert
        Assert.Equal(auid, Auid.Empty);
    }
    
    [Fact]
    public void AuidNotEmptyShouldNotBeEqualAuidEmpty()
    {
        // Arrange
        AuidFactory factory = new();
        
        // Act
        var auid = factory.NewId();
        
        // Assert
        Assert.NotEqual(auid, Auid.Empty);
    }    
    
    [Fact]
    public void IdShouldNotBeEqualRandomObject()
    {
        // Arrange
        //
        var factory = new AuidFactory(0);
        
        // Act
        //
        var id = factory.NewId();
        
        // Assert
        //
        Assert.NotEqual(id, new object());
        Assert.NotEqual(id, Auid.FromString("00000000001"));
    }
    
    [Fact]
    public void IdShouldBeEqualRestoredObject()
    {
        // Arrange
        //
        var factory = new AuidFactory(0);
        
        // Act
        //
        var id = factory.NewId();
        
        // Assert
        //
        Assert.Equal(id, Auid.FromString(id.ToString()));
        Assert.Equal(id.GetHashCode(), Auid.FromString(id.ToString()).GetHashCode());
    }

    [Fact]
    public void WrongIdShouldThrowException()
    {
        //Assert
        //
        Assert.Throws<ArgumentException>(() => Auid.FromString("00000"));
        Assert.Throws<ArgumentException>(() => Auid.FromString("123456789-0"));
        Assert.Equal(Auid.FromString("01234567890"), Auid.FromString("01234567890"));
    }
    
    [Fact]
    public void ToyIdShouldJsonSerializeAndDeserialize()
    {
        var factory = new AuidFactory(0);
        // var serializeOptions = new JsonSerializerOptions();
        // serializeOptions.Converters.Add(new ToyIdJsonConverter(factory));        
        
        
        var entity = new EntityWithId
        {
            Id = factory.NewId()
        };
        var json = JsonSerializer.Serialize(entity);
        
        Assert.Equal($"{{\"Id\":\"{entity.Id}\",\"SomeData\":\"Default\"}}", json);

        var ne = JsonSerializer.Deserialize<EntityWithId>(json);
        
        Assert.Equal(entity.Id, ne!.Id);
    }

    [Fact]
    public void TooBigStringShouldNotThrow()
    {
        "ZZZCKjtmmzqBN".ToInt64();

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

public class EntityWithId
{
    public Auid Id { get; init; } = Auid.Empty;
    public string SomeData { get; init; } = "Default";
}

    

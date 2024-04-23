using System.Text.Json;
using System.Text.Json.Serialization;

namespace IB.Utils.Ids.Converters;

/// <summary>
/// Serializer and Deserializer Auid/Json
/// </summary>
public class AuidJsonConverter: JsonConverter<Auid>
{
    /// <summary>
    /// Reads string form json and creates new Auid based on that
    /// </summary>
    public override Auid Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var rawId = reader.GetString();
        return string.IsNullOrEmpty(rawId) ? Auid.Empty : Auid.FromString(rawId);
    }

    /// <summary>
    /// Write Auid to Json as string
    /// </summary>
    /// <param name="writer">Json Writer</param>
    /// <param name="value"><see cref="Auid"/> value</param>
    /// <param name="options"><see cref="JsonSerializerOptions"/> not used </param>
    public override void Write(Utf8JsonWriter writer, Auid value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value.ToString());
}
using LinqToDB;
using LinqToDB.Common;
using LinqToDB.Data;
using LinqToDB.Mapping;

namespace IB.Utils.Ids.Converters;

/// <summary>
/// Provides methods to convert id to/from db type
/// </summary>
public static class Linq2DbConverter
{
    /// <summary>
    /// Returns <see cref="MappingSchema"/> to convert Auid instance to db bigint type and back 
    /// </summary>
    /// <returns>Created mapping schema</returns>
    /// <remarks>
    /// To add schema, use .UseMappingSchema() method in DataOptions
    /// </remarks>
    public static MappingSchema AuidInt64MappingSchema()
    {
        var ms = new MappingSchema();
        ms.SetConverter<Auid, DataParameter>(auid => auid == Auid.Empty
                ? new DataParameter { DataType = DataType.Int64, Value = DBNull.Value }
                : new DataParameter { Value = auid.Int64 },
            ConversionType.ToDatabase);
        ms.SetConverter<DataParameter, Auid>(
            auid => auid.Value == null
                ? Auid.Empty
                : new Auid((long)auid.Value), 
            ConversionType.FromDatabase);
        
        ms.SetConverter<Auid?, DataParameter>(auid => (auid == Auid.Empty || !auid.HasValue)
                ? new DataParameter { DataType = DataType.Int64, Value = DBNull.Value }
                : new DataParameter { Value = auid.Value.Int64 },
            ConversionType.ToDatabase);
        ms.SetConverter<DataParameter, Auid?>(
            auid => auid.Value == null
                ? null
                : new Auid((long)auid.Value), 
            ConversionType.FromDatabase);

        ms.SetConverter<long, Auid>(lid => new Auid(lid));
        ms.SetConverter<Auid, long>(auid => auid.Int64);

        ms.SetValueToSqlConverter(typeof(Auid), (sb, _, v) =>
        {
            if ((Auid)v != Auid.Empty)
                sb.Append(((Auid)v).Int64);
        });
        
        ms.SetValueToSqlConverter(typeof(Auid?), (sb, _, v) =>
        {
            if (((Auid?)v).HasValue && ((Auid?)v).Value != Auid.Empty)
                sb.Append(((Auid)v).Int64);
        });

        return ms;
    }
    
    /// <summary>
    /// Returns <see cref="MappingSchema"/> to convert Auid instance to db text type and back 
    /// </summary>
    /// <returns>Created mapping schema</returns>
    /// <remarks>
    /// To add schema, use .UseMappingSchema() method in DataOptions
    /// </remarks>
    public static MappingSchema AuidTextMappingSchema()
    {
        var ms = new MappingSchema();
        ms.SetConverter<Auid, DataParameter>(auid => auid == Auid.Empty
                ? new DataParameter { DataType = DataType.NVarChar, Value = DBNull.Value }
                : new DataParameter { Value = auid.ToString() },
            ConversionType.ToDatabase);
        ms.SetConverter<DataParameter, Auid>(
            auid => auid.Value == null
                ? Auid.Empty
                : Auid.FromString(auid.Value.ToString()!), 
            ConversionType.FromDatabase);
        
        ms.SetConverter<string, Auid>(Auid.FromString);
        ms.SetConverter<Auid, string>(auid => auid.ToString());

        ms.SetValueToSqlConverter(typeof(Auid), (sb, _, v) =>
        {
            if ((Auid)v != Auid.Empty)
                sb.Append($"'{((Auid)v).ToString()}'");
        });
        
        return ms;
    }
}
using System.Reflection;
using FluentValidation;
using IB.ISplitApp.Core.Expenses.Endpoints;
using LinqToDB;
using LinqToDB.Data;
using LinqToDB.DataProvider.PostgreSQL;
using LinqToDB.Mapping;
using LinqToDB.Tools;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using IB.Utils.Ids;
using IB.Utils.Ids.Converters;

namespace Tests.AuidTests;

[Collection("toyId")]
public class ToyIdLinq2dbTest: IDisposable
{
    private readonly TestDb _db;
    private readonly IServiceProvider _serviceProvider;
    private readonly AuidFactory _auidFactory = new();
    private readonly string _connectionString;
    
    public ToyIdLinq2dbTest()
    {
        var config = new ConfigurationBuilder()
            .SetBasePath(AppContext.BaseDirectory)
            .AddJsonFile("appsettings.test.json", true, true)
            .AddUserSecrets(Assembly.GetExecutingAssembly())
            .Build();
        _connectionString = config.GetConnectionString("isplitapp-test")!;
        
        var collection = new ServiceCollection();
        collection.AddTransient<IValidator<PartyPayload>, PartyRequestValidator>();
        collection.AddTransient<IValidator<ExpensePayload>, ExpensePayloadValidator>();
        collection.AddSingleton(_auidFactory);
        _serviceProvider = collection.BuildServiceProvider();
        
        _db = new TestDb(
            new DataOptions<TestDb>(
                new DataOptions()
                    .UseMappingSchema(Linq2DbConverter.AuidInt64MappingSchema())
                    .UsePostgreSQL(_connectionString, PostgreSQLVersion.v15)
                    //.UseDefaultLogging(_serviceProvider)
                ));
        
        SqlCommand("CREATE TABLE id_entity (auid bigint, some_data text)");
    }
    
    public void Dispose()
    {
        _db.Dispose();
        SqlCommand("DROP TABLE id_entity");
    }
    


    [Fact]
    public void AuidIdShouldBeWrittenAndReadFromDbCorrectly()
    {
        // Arrange
        //
        var idEntity = new IdEntity
        {
            Id = _auidFactory.NewId(),
            SomeData = "non default"
        };

        // Act
        //
        _db.Insert(idEntity);
        var id = _db.Execute<long>("SELECT auid FROM id_entity");
        var re = _db.IdEntity.Single(e => e.Id == idEntity.Id);
        var count = _db.IdEntity.Count(i => i.In(_db.IdEntity));

        // Assert
        //
        Assert.NotEqual(0, id);
        Assert.Equal(idEntity.Id, re.Id);
        Assert.Equal(1, count);
    }
    
    private void SqlCommand(string sqlCommand)
    {
        using var dataSource = NpgsqlDataSource.Create(_connectionString);
        using var command = dataSource.CreateCommand(sqlCommand);
        command.ExecuteNonQuery();
    }

}

public class TestDb(DataOptions<TestDb> options) : DataConnection(options.Options)
{
    public ITable<IdEntity> IdEntity => this.GetTable<IdEntity>();
}


[Table("id_entity")]
public class IdEntity
{
    [Column("auid")]
    public Auid Id { get; init; } = Auid.Empty;
    
    [Column("some_data")]
    public string SomeData { get; init; } = "default";
}
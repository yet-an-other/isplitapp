using FluentMigrator;

namespace Migrations;

[Migration(0, "Init Database")]
public class InitDatabaseMigration: Migration
{
    public override void Up()
    {
        //Execute.Script($"{Environment.CurrentDirectory}/../../../../core/SqlMigrations/InitDatabase-UP.sql");
        Execute.EmbeddedScript("core.SqlMigrations.InitDatabase-UP.sql");
    }

    public override void Down()
    {
        Execute.EmbeddedScript("core.SqlMigrations.InitDatabase-Down.sql");
        //Execute.Script($"{Environment.CurrentDirectory}/../../../../core/SqlMigrations/InitDatabase-Down.sql");
    }
}
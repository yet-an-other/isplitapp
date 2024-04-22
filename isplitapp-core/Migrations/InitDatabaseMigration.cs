using FluentMigrator;

namespace Migrations;

[Migration(0, "Init Database")]
public class InitDatabaseMigration: Migration
{
    public override void Up()
    {
        Execute.EmbeddedScript("Migrations.SqlMigrations.InitDatabase-UP.sql");
    }

    public override void Down()
    {
        Execute.EmbeddedScript("Migrations.SqlMigrations.InitDatabase-Down.sql");
    }
}
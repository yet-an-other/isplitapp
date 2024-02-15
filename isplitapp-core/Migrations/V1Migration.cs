using FluentMigrator;

namespace Migrations;

[Migration(1, "v1 - add split modes")]
public class V1Migration: Migration
{
    public override void Up()
    {
        Execute.EmbeddedScript("core.SqlMigrations.v1-Up.sql");
    }

    public override void Down()
    {
        Execute.EmbeddedScript("core.SqlMigrations.v1-Down.sql");
    }
}
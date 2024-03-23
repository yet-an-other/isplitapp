using FluentMigrator;

namespace Migrations;

[Migration(2, "v2 - add archive marker")]
public class V2Migration: Migration
{
    public override void Up()
    {
        Execute.EmbeddedScript("core.SqlMigrations.v2-Up.sql");
    }

    public override void Down()
    {
        Execute.EmbeddedScript("core.SqlMigrations.v2-Down.sql");
    }
}
using FluentMigrator;

namespace Migrations;

[Migration(4, "v4 - add timestamps")]
public class V4Migration: Migration
{
    public override void Up()
    {
        Execute.EmbeddedScript("Migrations.SqlMigrations.v4-Up.sql");
    }

    public override void Down()
    {
        Execute.EmbeddedScript("Migrations.SqlMigrations.v4-Down.sql");
    }
}
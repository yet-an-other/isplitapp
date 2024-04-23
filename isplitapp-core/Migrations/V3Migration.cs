using FluentMigrator;

namespace Migrations;

[Migration(3, "v3 - add subscription storage")]
public class V3Migration: Migration
{
    public override void Up()
    {
        Execute.EmbeddedScript("Migrations.SqlMigrations.v3-Up.sql");
    }

    public override void Down()
    {
        Execute.EmbeddedScript("Migrations.SqlMigrations.v3-Down.sql");
    }
}
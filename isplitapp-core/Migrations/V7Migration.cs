namespace Migrations;

using FluentMigrator;

[Migration(7, "v7 - add activity_log table")]
public class V7Migration: Migration
{
    public override void Up()
    {
        Execute.EmbeddedScript("Migrations.SqlMigrations.v7-Up.sql");
    }

    public override void Down()
    {
        Execute.EmbeddedScript("Migrations.SqlMigrations.v7-Down.sql");
    }
}
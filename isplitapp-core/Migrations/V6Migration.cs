namespace Migrations;

using FluentMigrator;

[Migration(6, "v6 - add description column to party table")]
public class V6Migration: Migration
{
    public override void Up()
    {
        Execute.EmbeddedScript("Migrations.SqlMigrations.v6-Up.sql");
    }

    public override void Down()
    {
        Execute.EmbeddedScript("Migrations.SqlMigrations.v6-Down.sql");
    }
}
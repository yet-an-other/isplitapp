ALTER TABLE expense ADD COLUMN split_mode text DEFAULT 'Evenly';

ALTER TABLE borrower DROP COLUMN shared_part;
ALTER TABLE borrower ADD COLUMN share int DEFAULT 1;


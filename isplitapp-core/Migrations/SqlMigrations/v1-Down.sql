
ALTER TABLE expense DROP COLUMN split_mode;

ALTER TABLE borrower DROP COLUMN share;
ALTER TABLE borrower ADD COLUMN shared_part int default 1;
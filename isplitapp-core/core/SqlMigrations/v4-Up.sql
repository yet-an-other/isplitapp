ALTER TABLE expense ADD COLUMN update_timestamp text NOT NULL DEFAULT ('000000000');

ALTER TABLE party ADD COLUMN update_timestamp text NOT NULL DEFAULT('000000000');

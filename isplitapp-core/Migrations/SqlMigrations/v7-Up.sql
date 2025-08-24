-- Create activity_log table to track changes in parties
--
CREATE TABLE activity_log(
    id bigint NOT NULL,
    party_id bigint NOT NULL,
    device_id bigint NOT NULL,
    activity_type text NOT NULL,
    entity_id bigint NULL,
    description text NOT NULL,
    created timestamptz default (now() at time zone 'utc') NOT NULL,
    timestamp text NOT NULL,

    PRIMARY KEY(id),
    CONSTRAINT fk_activity_log_party FOREIGN KEY(party_id) REFERENCES party(id) ON DELETE CASCADE
);

-- Create indexes for efficient querying
--
CREATE INDEX IX_activity_log_party_id ON activity_log USING btree (party_id);
CREATE INDEX IX_activity_log_timestamp ON activity_log USING btree (timestamp);
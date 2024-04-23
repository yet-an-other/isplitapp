CREATE TABLE subscription(
                           id SERIAL NOT NULL,
                           user_id text NOT NULL,
                           is_ios bool NOT NULL DEFAULT (false),
                           device_fcm_token text NOT NULL,
                           push_endpoint text NOT NULL,
                           p256dh text NOT NULL,
                           auth text NOT NULL,

                           PRIMARY KEY(id)
                           -- CONSTRAINT fk_user_party_user FOREIGN KEY(user_id) REFERENCES user_party(user_id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_subscription_user_id ON subscription (user_id);

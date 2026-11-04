-- ===================================================================
-- Flyway Migration: V1__init_schema.sql
-- Description: Complete initial schema for CampusConnect
-- ===================================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    handle VARCHAR(100) NOT NULL,
    instagram_username VARCHAR(100),
    instagram_scoped_user_id VARCHAR(100),
    display_name VARCHAR(150) NOT NULL,
    department VARCHAR(100),
    graduation_year VARCHAR(50),
    bio TEXT,
    avatar_url VARCHAR(255),
    verification_status VARCHAR(50) NOT NULL DEFAULT 'VERIFIED',
    account_status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    grace_period_expires_at TIMESTAMP,
    last_verified_at TIMESTAMP,
    instagram_verified_at TIMESTAMP,
    created_at TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_handle ON users(handle);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_ig_username ON users(instagram_username);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_ig_scoped_id ON users(instagram_scoped_user_id);

-- 2. Connect Requests Table
CREATE TABLE IF NOT EXISTS connect_requests (
    id BIGSERIAL PRIMARY KEY,
    sender_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    note VARCHAR(250),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP,
    responded_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_req_receiver_status ON connect_requests(receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_req_sender ON connect_requests(sender_id);

-- 3. Connections Table
CREATE TABLE IF NOT EXISTS connections (
    id BIGSERIAL PRIMARY KEY,
    user1_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user2_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_id BIGINT REFERENCES connect_requests(id) ON DELETE SET NULL,
    connected_at TIMESTAMP NOT NULL,
    last_interaction_at TIMESTAMP,
    CONSTRAINT uq_connection_users UNIQUE (user1_id, user2_id)
);

CREATE INDEX IF NOT EXISTS idx_conn_user1 ON connections(user1_id);
CREATE INDEX IF NOT EXISTS idx_conn_user2 ON connections(user2_id);

-- 4. Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGSERIAL PRIMARY KEY,
    connection_id BIGINT NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
    sender_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    sent_at TIMESTAMP NOT NULL,
    read_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_conn_sent ON chat_messages(connection_id, sent_at);

-- 5. Feed Posts Table
CREATE TABLE IF NOT EXISTS feed_posts (
    id BIGSERIAL PRIMARY KEY,
    author_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    image_url VARCHAR(1000) NOT NULL,
    caption TEXT NOT NULL,
    likes_count INT NOT NULL DEFAULT 0,
    comments_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_posts_author ON feed_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created ON feed_posts(created_at DESC);

-- 6. Follower Sync Logs Table
CREATE TABLE IF NOT EXISTS follower_sync_logs (
    id BIGSERIAL PRIMARY KEY,
    total_imported INT NOT NULL,
    verified_count INT NOT NULL,
    restricted_count INT NOT NULL,
    filename VARCHAR(255),
    synced_at TIMESTAMP NOT NULL
);

-- 7. Instagram Verification Challenges Table
CREATE TABLE IF NOT EXISTS instagram_verifications (
    id BIGSERIAL PRIMARY KEY,
    challenge_id VARCHAR(64) NOT NULL UNIQUE,
    claimed_username VARCHAR(100) NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    instagram_scoped_user_id VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    expires_at TIMESTAMP NOT NULL,
    attempts INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL,
    verified_at TIMESTAMP,
    last_resent_at TIMESTAMP,
    failure_reason VARCHAR(500),
    jwt_token TEXT,
    linked_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ig_challenge_id ON instagram_verifications(challenge_id);
CREATE INDEX IF NOT EXISTS idx_ig_claimed_username ON instagram_verifications(claimed_username);
CREATE INDEX IF NOT EXISTS idx_ig_scoped_user_id ON instagram_verifications(instagram_scoped_user_id);

-- 8. Webhook Idempotency Table
CREATE TABLE IF NOT EXISTS processed_webhook_messages (
    id BIGSERIAL PRIMARY KEY,
    message_id VARCHAR(150) NOT NULL UNIQUE,
    processed_at TIMESTAMP NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_webhook_mid ON processed_webhook_messages(message_id);

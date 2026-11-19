-- ===================================================================
-- Flyway Migration: V2__connect_pass_block_report.sql
-- Description: Support for swipe passes, candidate exclusions, blocking, and reporting
-- ===================================================================

-- 1. User Passes Table (Discovery Pass feature)
CREATE TABLE IF NOT EXISTS user_passes (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    passed_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT uq_user_pass UNIQUE (user_id, passed_user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_passes_user ON user_passes(user_id);

-- 2. User Blocks Table (User Blocking feature)
CREATE TABLE IF NOT EXISTS user_blocks (
    id BIGSERIAL PRIMARY KEY,
    blocker_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason VARCHAR(255),
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT uq_user_block UNIQUE (blocker_id, blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON user_blocks(blocked_id);

-- 3. User Reports Table (User Violation Reporting feature)
CREATE TABLE IF NOT EXISTS user_reports (
    id BIGSERIAL PRIMARY KEY,
    reporter_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason VARCHAR(100) NOT NULL,
    details TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_reports_reported ON user_reports(reported_id);

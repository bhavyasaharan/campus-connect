-- ===================================================================
-- Flyway Migration: V3__schema_hardening.sql
-- Description: Hardening relational integrity, canonical connection indexing,
--              preventing self-targeting, and unread chat performance
-- ===================================================================

-- 1. Prevent duplicate reverse connections by indexing canonical pairs
CREATE UNIQUE INDEX IF NOT EXISTS uq_canonical_connection 
ON connections (LEAST(user1_id, user2_id), GREATEST(user1_id, user2_id));

-- 2. Prevent duplicate pending requests between the same pair
CREATE UNIQUE INDEX IF NOT EXISTS uq_single_pending_request 
ON connect_requests (LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id)) 
WHERE status = 'PENDING';

-- 3. Prevent self-targeting across all social tables
ALTER TABLE connect_requests DROP CONSTRAINT IF EXISTS chk_request_no_self;
ALTER TABLE connect_requests ADD CONSTRAINT chk_request_no_self CHECK (sender_id <> receiver_id);

ALTER TABLE connections DROP CONSTRAINT IF EXISTS chk_connection_no_self;
ALTER TABLE connections ADD CONSTRAINT chk_connection_no_self CHECK (user1_id <> user2_id);

ALTER TABLE user_passes DROP CONSTRAINT IF EXISTS chk_pass_no_self;
ALTER TABLE user_passes ADD CONSTRAINT chk_pass_no_self CHECK (user_id <> passed_user_id);

ALTER TABLE user_blocks DROP CONSTRAINT IF EXISTS chk_block_no_self;
ALTER TABLE user_blocks ADD CONSTRAINT chk_block_no_self CHECK (blocker_id <> blocked_id);

ALTER TABLE user_reports DROP CONSTRAINT IF EXISTS chk_report_no_self;
ALTER TABLE user_reports ADD CONSTRAINT chk_report_no_self CHECK (reporter_id <> reported_id);

-- 4. Fast unread message indexing
CREATE INDEX IF NOT EXISTS idx_chat_unread 
ON chat_messages (connection_id, read_at) 
WHERE read_at IS NULL;

-- 5. Moderation resolution columns on user_reports
ALTER TABLE user_reports 
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS action_taken VARCHAR(100),
  ADD COLUMN IF NOT EXISTS reviewer_notes TEXT;

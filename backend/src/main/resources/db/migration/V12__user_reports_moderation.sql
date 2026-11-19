-- ===================================================================
-- Flyway Migration: V12__user_reports_moderation.sql
-- Description: Adds moderation resolution fields and status index to user_reports
-- ===================================================================

ALTER TABLE user_reports
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS action_taken VARCHAR(100),
ADD COLUMN IF NOT EXISTS reviewer_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_user_reports_status ON user_reports(status);
CREATE INDEX IF NOT EXISTS idx_user_reports_created ON user_reports(created_at DESC);

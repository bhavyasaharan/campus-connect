-- ===================================================================
-- Flyway Migration: V15__post_multi_media_and_editing.sql
-- Description: Add multi-media JSON support and updated_at to user_posts
-- ===================================================================

ALTER TABLE user_posts ADD COLUMN IF NOT EXISTS media_urls TEXT;
ALTER TABLE user_posts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;

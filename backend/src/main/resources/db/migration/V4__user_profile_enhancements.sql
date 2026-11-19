-- ===================================================================
-- Flyway Migration: V4__user_profile_enhancements.sql
-- Description: Expand avatar_url length to support all modern image URLs and data URIs
-- ===================================================================

ALTER TABLE users ALTER COLUMN avatar_url TYPE TEXT;

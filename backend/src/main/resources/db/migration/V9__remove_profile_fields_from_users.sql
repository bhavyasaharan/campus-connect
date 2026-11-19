-- ===================================================================
-- Flyway Migration: V9__remove_profile_fields_from_users.sql
-- Description: Drop deprecated profile fields from users table now moved to student_profiles
-- ===================================================================

ALTER TABLE users DROP COLUMN IF EXISTS department;
ALTER TABLE users DROP COLUMN IF EXISTS graduation_year;
ALTER TABLE users DROP COLUMN IF EXISTS bio;
ALTER TABLE users DROP COLUMN IF EXISTS avatar_url;

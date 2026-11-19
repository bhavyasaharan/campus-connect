-- ===================================================================
-- Flyway Migration: V8__student_profiles.sql
-- Description: Create dedicated student_profiles table separating master profile data from auth and discovery cards
-- ===================================================================

CREATE TABLE IF NOT EXISTS student_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    college VARCHAR(150) DEFAULT 'Campus University',
    course VARCHAR(150),
    graduation_year VARCHAR(50),
    bio TEXT,
    interests VARCHAR(500),
    avatar_url TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_student_profiles_user ON student_profiles(user_id);

-- Backfill profile data from existing users table
INSERT INTO student_profiles (user_id, college, course, graduation_year, bio, avatar_url, interests)
SELECT 
    id, 
    'Campus University', 
    COALESCE(department, 'General Studies'), 
    graduation_year, 
    bio, 
    avatar_url, 
    'Student, Campus Life, Tech, Music'
FROM users
ON CONFLICT (user_id) DO NOTHING;

-- ===================================================================
-- Flyway Migration: V16__universal_profile_and_dating_discovery.sql
-- Description: Fresh start database wipe, universal profile attributes
--              (dating, campus mode, passouts/alumni, professional, location, age, intent)
-- ===================================================================

-- 1. Cleanly wipe all data to start completely fresh
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'connections') THEN
        TRUNCATE TABLE connections CASCADE;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_passes') THEN
        TRUNCATE TABLE user_passes CASCADE;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_blocks') THEN
        TRUNCATE TABLE user_blocks CASCADE;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_reports') THEN
        TRUNCATE TABLE user_reports CASCADE;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'post_likes') THEN
        TRUNCATE TABLE post_likes CASCADE;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'meme_likes') THEN
        TRUNCATE TABLE meme_likes CASCADE;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'post_media') THEN
        TRUNCATE TABLE post_media CASCADE;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_posts') THEN
        TRUNCATE TABLE user_posts CASCADE;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'discovery_cards') THEN
        TRUNCATE TABLE discovery_cards CASCADE;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'student_profiles') THEN
        TRUNCATE TABLE student_profiles CASCADE;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
        TRUNCATE TABLE users CASCADE;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'memes') THEN
        TRUNCATE TABLE memes CASCADE;
    END IF;
END $$;

-- 2. Extend student_profiles with universal dating, professional, and campus attributes
ALTER TABLE student_profiles
    ADD COLUMN IF NOT EXISTS persona_type VARCHAR(50) DEFAULT 'STUDENT',
    ADD COLUMN IF NOT EXISTS headline VARCHAR(200),
    ADD COLUMN IF NOT EXISTS organization VARCHAR(150),
    ADD COLUMN IF NOT EXISTS role_title VARCHAR(150),
    ADD COLUMN IF NOT EXISTS field_of_study VARCHAR(150),
    ADD COLUMN IF NOT EXISTS is_passout BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS age INTEGER,
    ADD COLUMN IF NOT EXISTS birthdate DATE,
    ADD COLUMN IF NOT EXISTS gender VARCHAR(30) DEFAULT 'PREFER_NOT_TO_SAY',
    ADD COLUMN IF NOT EXISTS gender_preference VARCHAR(50) DEFAULT 'EVERYONE',
    ADD COLUMN IF NOT EXISTS intent VARCHAR(50) DEFAULT 'OPEN_TO_ANY',
    ADD COLUMN IF NOT EXISTS location VARCHAR(150),
    ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- 3. Extend discovery_cards with new card visibility toggles
ALTER TABLE discovery_cards
    ADD COLUMN IF NOT EXISTS show_age BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS show_location BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS show_organization BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS show_role BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS show_field_of_study BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS show_intent BOOLEAN NOT NULL DEFAULT TRUE;

-- 4. Performance Indexes for multi-criteria discovery & filtering
CREATE INDEX IF NOT EXISTS idx_profiles_persona ON student_profiles(persona_type);
CREATE INDEX IF NOT EXISTS idx_profiles_college ON student_profiles(college);
CREATE INDEX IF NOT EXISTS idx_profiles_is_passout ON student_profiles(is_passout);
CREATE INDEX IF NOT EXISTS idx_profiles_field_of_study ON student_profiles(field_of_study);
CREATE INDEX IF NOT EXISTS idx_profiles_organization ON student_profiles(organization);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON student_profiles(location);
CREATE INDEX IF NOT EXISTS idx_profiles_age ON student_profiles(age);
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON student_profiles(gender);
CREATE INDEX IF NOT EXISTS idx_profiles_intent ON student_profiles(intent);

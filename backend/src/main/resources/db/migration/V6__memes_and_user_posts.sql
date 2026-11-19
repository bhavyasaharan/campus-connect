-- ===================================================================
-- Flyway Migration: V6__memes_and_user_posts.sql
-- Description: Create dedicated user_posts and campus_memes tables
-- Strictly separating user profile posts from campus memes.
-- ===================================================================

-- 1. Dedicated table for User Profile Posts (belong to user profile, not memes)
CREATE TABLE IF NOT EXISTS user_posts (
    id BIGSERIAL PRIMARY KEY,
    author_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    image_url VARCHAR(1000) NOT NULL,
    caption TEXT NOT NULL,
    likes_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_posts_author ON user_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_user_posts_created ON user_posts(created_at DESC);

-- 2. Dedicated table for Campus Memes (belong to memes section, not user profile posts)
CREATE TABLE IF NOT EXISTS campus_memes (
    id BIGSERIAL PRIMARY KEY,
    author_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    image_url VARCHAR(1000) NOT NULL,
    caption TEXT NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'All Memes',
    likes_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_campus_memes_author ON campus_memes(author_id);
CREATE INDEX IF NOT EXISTS idx_campus_memes_created ON campus_memes(created_at DESC);

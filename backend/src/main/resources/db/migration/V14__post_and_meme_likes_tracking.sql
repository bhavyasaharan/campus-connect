-- ===================================================================
-- Flyway Migration: V14__post_and_meme_likes_tracking.sql
-- Description: Track user likes for User Profile Posts and Campus Memes
-- Enforces: 1 user can only like a post or meme 1 time (with toggle like/unlike).
-- ===================================================================

CREATE TABLE IF NOT EXISTS post_likes (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT NOT NULL REFERENCES user_posts(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_post_user_like UNIQUE (post_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_post_likes_user ON post_likes(user_id);

CREATE TABLE IF NOT EXISTS meme_likes (
    id BIGSERIAL PRIMARY KEY,
    meme_id BIGINT NOT NULL REFERENCES campus_memes(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_meme_user_like UNIQUE (meme_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_meme_likes_user ON meme_likes(user_id);

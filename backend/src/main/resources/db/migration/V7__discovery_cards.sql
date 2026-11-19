-- ===================================================================
-- Flyway Migration: V7__discovery_cards.sql
-- Description: Create discovery_cards table for customized Discover presentation
-- ===================================================================

CREATE TABLE IF NOT EXISTS discovery_cards (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    main_photo_url VARCHAR(1000),
    discovery_bio VARCHAR(150),
    show_college BOOLEAN NOT NULL DEFAULT TRUE,
    show_course BOOLEAN NOT NULL DEFAULT TRUE,
    show_interests BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_discovery_cards_user ON discovery_cards(user_id);

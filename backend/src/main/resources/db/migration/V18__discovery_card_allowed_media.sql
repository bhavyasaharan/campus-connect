-- ===================================================================
-- Flyway Migration: V18__discovery_card_allowed_media.sql
-- Description: Add allowed_media_urls column to discovery_cards table
--              to control which post media items appear on Discover.
-- ===================================================================

ALTER TABLE discovery_cards
    ADD COLUMN IF NOT EXISTS allowed_media_urls TEXT;

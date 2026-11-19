-- ===================================================================
-- Flyway Migration: V5__auth_credentials_and_otp.sql
-- Description: Add password, email, and phone to users, and create auth_otps table
-- ===================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(150);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_user_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_phone ON users(phone);

CREATE TABLE IF NOT EXISTS auth_otps (
    id BIGSERIAL PRIMARY KEY,
    identifier VARCHAR(150) NOT NULL,
    otp_code VARCHAR(20) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    attempts INT NOT NULL DEFAULT 0,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_auth_otps_identifier ON auth_otps(identifier);
CREATE INDEX IF NOT EXISTS idx_auth_otps_created_at ON auth_otps(created_at);

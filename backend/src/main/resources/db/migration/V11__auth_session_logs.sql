-- ===================================================================
-- Flyway Migration: V11__auth_session_logs.sql
-- Description: Create auth_session_logs table for user and admin login/logout audit
-- ===================================================================

CREATE TABLE IF NOT EXISTS auth_session_logs (
    id BIGSERIAL PRIMARY KEY,
    user_type VARCHAR(20) NOT NULL, -- 'STUDENT' or 'ADMIN'
    user_id BIGINT NOT NULL,
    identifier VARCHAR(100) NOT NULL,
    activity_type VARCHAR(20) NOT NULL, -- 'LOGIN' or 'LOGOUT'
    login_method VARCHAR(30), -- 'PASSWORD', 'OTP', 'INSTAGRAM', 'ADMIN_PASSWORD'
    ip_address VARCHAR(100),
    user_agent VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',
    details VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auth_logs_user ON auth_session_logs(user_type, user_id);
CREATE INDEX IF NOT EXISTS idx_auth_logs_created ON auth_session_logs(created_at DESC);

-- ===================================================================
-- Flyway Migration: V10__admin_users.sql
-- Description: Create dedicated admin_users table for administrator accounts
-- ===================================================================

CREATE TABLE IF NOT EXISTS admin_users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150),
    role VARCHAR(50) NOT NULL DEFAULT 'ADMIN',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

-- Insert initial default admin user with BCrypt hashed password 'Admin@123'
INSERT INTO admin_users (username, email, password_hash, full_name, role, is_active)
VALUES (
    'campus_admin',
    'admin@campusconnect.edu',
    '$2a$10$wEkm3ZkX6aZt3Z9LpB1tjeR1G7g8N3X6h7j5k4l3m2n1o0p9q8r7s',
    'Campus Connect Administrator',
    'ADMIN',
    TRUE
)
ON CONFLICT (username) DO NOTHING;

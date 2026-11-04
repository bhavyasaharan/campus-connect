-- ===================================================================
-- CampusConnect: Empty All Database Tables (Preserve Schema & History)
-- ===================================================================
-- This script truncates all data rows across all application tables,
-- resets all primary key sequence IDs back to 1 (RESTART IDENTITY),
-- cascades across foreign keys, and leaves the Flyway migration history intact.

TRUNCATE TABLE 
    chat_messages,
    connections,
    connect_requests,
    feed_posts,
    instagram_verifications,
    follower_sync_logs,
    processed_webhook_messages,
    users
RESTART IDENTITY CASCADE;

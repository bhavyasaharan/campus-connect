-- Widen message_id column to accommodate Meta Instagram Direct message IDs (base64 string > 170 chars)
ALTER TABLE processed_webhook_messages ALTER COLUMN message_id TYPE VARCHAR(512);

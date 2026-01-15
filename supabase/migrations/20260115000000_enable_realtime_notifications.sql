-- Enable Realtime for notifications table
-- This allows the frontend to receive real-time updates when notifications are inserted

-- Set replica identity to FULL so all columns are included in realtime events
ALTER TABLE notifications REPLICA IDENTITY FULL;

-- The table is already in the publication, so we just need to ensure replica identity is set
-- Add comment explaining the configuration
COMMENT ON TABLE notifications IS 'Notifications table with realtime enabled for instant push notifications';


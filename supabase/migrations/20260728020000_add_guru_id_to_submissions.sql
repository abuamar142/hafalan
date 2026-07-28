-- Migration: Add guru_id to submissions table
-- Tracks which teacher recorded each submission/setoran

ALTER TABLE submissions ADD COLUMN IF NOT EXISTS guru_id UUID REFERENCES auth.users(id);

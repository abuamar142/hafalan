-- Migration: Add updated tracking columns to submissions and update RLS policies
-- Allows all authenticated teachers to edit any student's submissions

-- 1. Add tracking columns to submissions
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS updated_by_name VARCHAR;

-- 2. Drop existing update/delete/insert policies on submissions
DROP POLICY IF EXISTS "Users can insert own submissions" ON submissions;
DROP POLICY IF EXISTS "Users can update own submissions" ON submissions;
DROP POLICY IF EXISTS "Users can delete own submissions" ON submissions;

-- 3. Create new RLS policies for authenticated users
CREATE POLICY "Authenticated users can insert any submissions" ON submissions
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update any submissions" ON submissions
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete any submissions" ON submissions
  FOR DELETE TO authenticated USING (true);

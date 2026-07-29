-- Phase 1: Add guru_name to submissions, teacher_name to group_teachers
-- Backfill from settings, then drop settings table
-- Create RPC helper to list all teachers from auth metadata

-- Add guru_name to submissions
ALTER TABLE submissions ADD COLUMN guru_name VARCHAR;

-- Backfill guru_name from settings
UPDATE submissions s
SET guru_name = st.value
FROM settings st
WHERE st.key = 'guru' AND st.user_id = s.guru_id;

-- Add teacher_name to group_teachers
ALTER TABLE group_teachers ADD COLUMN teacher_name VARCHAR;

-- Backfill teacher_name from settings
UPDATE group_teachers gt
SET teacher_name = st.value
FROM settings st
WHERE st.key = 'guru' AND st.user_id = gt.teacher_id;

-- Drop settings table
DROP TABLE IF EXISTS settings;

-- Create RPC to list all teachers (names from auth.users metadata)
CREATE OR REPLACE FUNCTION public.get_all_teachers()
RETURNS TABLE (user_id UUID, name TEXT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT id, raw_user_meta_data->>'name' AS name
  FROM auth.users
  WHERE raw_user_meta_data->>'name' IS NOT NULL
$$;

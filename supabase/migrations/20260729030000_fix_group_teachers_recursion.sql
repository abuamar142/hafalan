-- ============================================================
-- Hafalan — Migration: Fix group_teachers RLS recursion
-- ============================================================

-- Drop the recursive select policy
DROP POLICY IF EXISTS "Teachers can view group teachers" ON group_teachers;

-- Create a non-recursive select policy
-- Since group_teachers only maps teachers to groups (directory info),
-- it is safe for all authenticated users to read.
CREATE POLICY "Teachers can view group teachers" ON group_teachers
  FOR SELECT USING (auth.uid() IS NOT NULL);

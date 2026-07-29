-- ============================================================
-- Quran Tracker — Migration: Fix group_teachers FOR ALL recursion
-- ============================================================

-- Drop the old FOR ALL policy that caused select recursion
DROP POLICY IF EXISTS "Group owners can manage teachers" ON group_teachers;

-- Create separate policies for INSERT and DELETE
-- This ensures that SELECT queries on group_teachers do not trigger
-- any subqueries to groups, breaking the recursion cycle.
CREATE POLICY "Group owners can add teachers" ON group_teachers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_teachers.group_id
      AND groups.user_id = auth.uid()
    )
  );

CREATE POLICY "Group owners can remove teachers" ON group_teachers
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_teachers.group_id
      AND groups.user_id = auth.uid()
    )
  );

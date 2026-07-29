-- ============================================================
-- Hafalan — Migration: Student Groups (Kelompok) Management
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Create groups table
CREATE TABLE IF NOT EXISTS groups (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- 2. Create group_teachers table (join table for multi-teacher assignment)
CREATE TABLE IF NOT EXISTS group_teachers (
  id BIGSERIAL PRIMARY KEY,
  group_id BIGINT REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(group_id, teacher_id)
);

-- 3. Add group_id to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS group_id BIGINT REFERENCES groups(id) ON DELETE RESTRICT;

-- 4. Backfill existing data
DO $$
DECLARE
  r RECORD;
  new_group_id BIGINT;
  guru_name TEXT;
BEGIN
  FOR r IN SELECT DISTINCT user_id FROM students LOOP
    -- Find guru name in settings, fallback to a truncated user_id
    SELECT value INTO guru_name FROM settings WHERE key = 'guru' AND user_id = r.user_id;
    IF guru_name IS NULL OR guru_name = '' THEN
      guru_name := 'Guru ' || SUBSTRING(r.user_id::text, 1, 8);
    END IF;

    -- Create group
    INSERT INTO groups (name, user_id)
    VALUES ('Kelompok ' || guru_name, r.user_id)
    RETURNING id INTO new_group_id;

    -- Add teacher to group
    INSERT INTO group_teachers (group_id, teacher_id)
    VALUES (new_group_id, r.user_id);

    -- Assign students of this user to the group
    UPDATE students
    SET group_id = new_group_id
    WHERE user_id = r.user_id;
  END LOOP;
END $$;

-- 5. Alter group_id in students to be NOT NULL (all students must have a group)
ALTER TABLE students ALTER COLUMN group_id SET NOT NULL;

-- 6. Drop user_id and usia from students
ALTER TABLE students DROP COLUMN IF EXISTS user_id;
ALTER TABLE students DROP COLUMN IF EXISTS usia;

-- 7. Drop obsolete index and create new one
DROP INDEX IF EXISTS idx_students_user_id;
CREATE INDEX IF NOT EXISTS idx_students_group_id ON students(group_id);

-- ============================================================
-- Row Level Security (RLS) & Policies
-- ============================================================
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_teachers ENABLE ROW LEVEL SECURITY;

-- Groups policies
DROP POLICY IF EXISTS "Teachers can view assigned groups" ON groups;
CREATE POLICY "Teachers can view assigned groups" ON groups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_teachers
      WHERE group_teachers.group_id = groups.id
      AND group_teachers.teacher_id = auth.uid()
    ) OR groups.user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Teachers can insert groups" ON groups;
CREATE POLICY "Teachers can insert groups" ON groups
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Group owners can update groups" ON groups;
CREATE POLICY "Group owners can update groups" ON groups
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Group owners can delete groups" ON groups;
CREATE POLICY "Group owners can delete groups" ON groups
  FOR DELETE USING (auth.uid() = user_id);

-- Group Teachers policies
DROP POLICY IF EXISTS "Teachers can view group teachers" ON group_teachers;
CREATE POLICY "Teachers can view group teachers" ON group_teachers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_teachers gt
      WHERE gt.group_id = group_teachers.group_id
      AND gt.teacher_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_teachers.group_id
      AND groups.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Group owners can manage teachers" ON group_teachers;
CREATE POLICY "Group owners can manage teachers" ON group_teachers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_teachers.group_id
      AND groups.user_id = auth.uid()
    )
  );

-- Students policies (recreated to use group_teachers mapping)
DROP POLICY IF EXISTS "Users can view own students" ON students;
DROP POLICY IF EXISTS "Users can insert own students" ON students;
DROP POLICY IF EXISTS "Users can update own students" ON students;
DROP POLICY IF EXISTS "Users can delete own students" ON students;

CREATE POLICY "Teachers can view students in their groups" ON students
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_teachers
      WHERE group_teachers.group_id = students.group_id
      AND group_teachers.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can insert students in their groups" ON students
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_teachers
      WHERE group_teachers.group_id = students.group_id
      AND group_teachers.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update students in their groups" ON students
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM group_teachers
      WHERE group_teachers.group_id = students.group_id
      AND group_teachers.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can delete students in their groups" ON students
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM group_teachers
      WHERE group_teachers.group_id = students.group_id
      AND group_teachers.teacher_id = auth.uid()
    )
  );

-- Memorization policies (recreated to use group_teachers mapping)
DROP POLICY IF EXISTS "Users can view own memorization" ON memorization;
DROP POLICY IF EXISTS "Users can insert own memorization" ON memorization;
DROP POLICY IF EXISTS "Users can update own memorization" ON memorization;
DROP POLICY IF EXISTS "Users can delete own memorization" ON memorization;

CREATE POLICY "Teachers can view group memorization" ON memorization
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM students
      JOIN group_teachers ON students.group_id = group_teachers.group_id
      WHERE students.id = memorization.student_id
      AND group_teachers.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can insert group memorization" ON memorization
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM students
      JOIN group_teachers ON students.group_id = group_teachers.group_id
      WHERE students.id = memorization.student_id
      AND group_teachers.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update group memorization" ON memorization
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM students
      JOIN group_teachers ON students.group_id = group_teachers.group_id
      WHERE students.id = memorization.student_id
      AND group_teachers.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can delete group memorization" ON memorization
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM students
      JOIN group_teachers ON students.group_id = group_teachers.group_id
      WHERE students.id = memorization.student_id
      AND group_teachers.teacher_id = auth.uid()
    )
  );

-- Submissions policies (recreated to use group_teachers mapping)
DROP POLICY IF EXISTS "Users can view own submissions" ON submissions;
DROP POLICY IF EXISTS "Users can insert own submissions" ON submissions;
DROP POLICY IF EXISTS "Users can update own submissions" ON submissions;
DROP POLICY IF EXISTS "Users can delete own submissions" ON submissions;

CREATE POLICY "Teachers can view group submissions" ON submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM students
      JOIN group_teachers ON students.group_id = group_teachers.group_id
      WHERE students.id = submissions.student_id
      AND group_teachers.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can insert group submissions" ON submissions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM students
      JOIN group_teachers ON students.group_id = group_teachers.group_id
      WHERE students.id = submissions.student_id
      AND group_teachers.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update group submissions" ON submissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM students
      JOIN group_teachers ON students.group_id = group_teachers.group_id
      WHERE students.id = submissions.student_id
      AND group_teachers.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can delete group submissions" ON submissions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM students
      JOIN group_teachers ON students.group_id = group_teachers.group_id
      WHERE students.id = submissions.student_id
      AND group_teachers.teacher_id = auth.uid()
    )
  );

-- 1. Create classes table
CREATE TABLE IF NOT EXISTS classes (
  id serial PRIMARY KEY,
  name text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on classes
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all authenticated users to manage classes" ON classes;
CREATE POLICY "Allow all authenticated users to manage classes" ON classes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. Add class_id to groups
ALTER TABLE groups ADD COLUMN IF NOT EXISTS class_id integer REFERENCES classes(id) ON DELETE SET NULL;

-- 3. Data Migration: (Skipped/Commented out because students.kelas was already dropped in previous run)
-- INSERT INTO classes (name) SELECT DISTINCT kelas FROM students;

-- 4. Drop ALL old RLS policies BEFORE dropping columns to avoid dependency errors
-- Table: groups
DROP POLICY IF EXISTS "Allow all authenticated users to read groups" ON groups;
DROP POLICY IF EXISTS "Groups can be created by authenticated users" ON groups;
DROP POLICY IF EXISTS "Groups can be modified by owners" ON groups;
DROP POLICY IF EXISTS "Groups can be deleted by owners" ON groups;
DROP POLICY IF EXISTS "Teachers can insert groups" ON groups;
DROP POLICY IF EXISTS "Group owners can update groups" ON groups;
DROP POLICY IF EXISTS "Group owners can delete groups" ON groups;
DROP POLICY IF EXISTS "Allow all authenticated users to manage groups" ON groups;

-- Table: group_teachers
DROP POLICY IF EXISTS "Group teachers read for all teachers" ON group_teachers;
DROP POLICY IF EXISTS "Group owners can manage teachers insert" ON group_teachers;
DROP POLICY IF EXISTS "Group owners can manage teachers delete" ON group_teachers;
DROP POLICY IF EXISTS "Group owners can add teachers" ON group_teachers;
DROP POLICY IF EXISTS "Group owners can remove teachers" ON group_teachers;
DROP POLICY IF EXISTS "Allow all authenticated users to manage group_teachers" ON group_teachers;

-- Table: students
DROP POLICY IF EXISTS "Allow all authenticated users to read students" ON students;
DROP POLICY IF EXISTS "Students can be managed by group teachers or owner" ON students;
DROP POLICY IF EXISTS "Authorized teachers can insert students" ON students;
DROP POLICY IF EXISTS "Authorized teachers can update students" ON students;
DROP POLICY IF EXISTS "Authorized teachers can delete students" ON students;
DROP POLICY IF EXISTS "Allow all authenticated users to manage students" ON students;

-- Table: memorization
DROP POLICY IF EXISTS "Allow all authenticated users to read memorization" ON memorization;
DROP POLICY IF EXISTS "Memorization can be managed by group teachers or owner" ON memorization;
DROP POLICY IF EXISTS "Authorized teachers can insert memorization" ON memorization;
DROP POLICY IF EXISTS "Authorized teachers can update memorization" ON memorization;
DROP POLICY IF EXISTS "Authorized teachers can delete memorization" ON memorization;
DROP POLICY IF EXISTS "Allow all authenticated users to manage memorization" ON memorization;

-- Table: submissions
DROP POLICY IF EXISTS "Allow all authenticated users to read submissions" ON submissions;
DROP POLICY IF EXISTS "Submissions can be managed by group teachers or owner" ON submissions;
DROP POLICY IF EXISTS "Authorized teachers can insert submissions" ON submissions;
DROP POLICY IF EXISTS "Authorized teachers can update submissions" ON submissions;
DROP POLICY IF EXISTS "Authorized teachers can delete submissions" ON submissions;
DROP POLICY IF EXISTS "Allow all authenticated users to manage submissions" ON submissions;

-- 5. Now drop columns that are no longer needed
ALTER TABLE students DROP COLUMN IF EXISTS user_id;
ALTER TABLE students DROP COLUMN IF EXISTS kelas;
ALTER TABLE groups DROP COLUMN IF EXISTS user_id;

-- 6. Create clean global RLS policies for reading and writing (all authenticated)
DROP POLICY IF EXISTS "Allow all authenticated users to manage groups" ON groups;
CREATE POLICY "Allow all authenticated users to manage groups" ON groups
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all authenticated users to manage group_teachers" ON group_teachers;
CREATE POLICY "Allow all authenticated users to manage group_teachers" ON group_teachers
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all authenticated users to manage students" ON students;
CREATE POLICY "Allow all authenticated users to manage students" ON students
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all authenticated users to manage memorization" ON memorization;
CREATE POLICY "Allow all authenticated users to manage memorization" ON memorization
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all authenticated users to manage submissions" ON submissions;
CREATE POLICY "Allow all authenticated users to manage submissions" ON submissions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

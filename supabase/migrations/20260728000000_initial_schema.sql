-- =============================================
-- Quran Tracker — Supabase Migration
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Students (was: santri)
CREATE TABLE IF NOT EXISTS students (
  id BIGINT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nama TEXT NOT NULL,
  kelas TEXT DEFAULT '',
  usia TEXT DEFAULT '',
  color TEXT DEFAULT ''
);

-- 2. Memorization (was: hafalan)
CREATE TABLE IF NOT EXISTS memorization (
  id BIGSERIAL PRIMARY KEY,
  student_id BIGINT REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  surah_no INTEGER NOT NULL,
  status INTEGER DEFAULT 0,
  UNIQUE(student_id, surah_no)
);

-- 3. Submissions (was: setoran)
CREATE TABLE IF NOT EXISTS submissions (
  id BIGINT PRIMARY KEY,
  student_id BIGINT REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  surah_no INTEGER NOT NULL,
  nilai TEXT DEFAULT '',
  catatan TEXT DEFAULT '',
  tanggal TEXT DEFAULT '',
  jam TEXT DEFAULT ''
);

-- 4. Settings
CREATE TABLE IF NOT EXISTS settings (
  key TEXT NOT NULL,
  value TEXT DEFAULT '',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY(key, user_id)
);

-- =============================================
-- Row Level Security (RLS)
-- =============================================
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE memorization ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Students policies
CREATE POLICY "Users can view own students" ON students
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own students" ON students
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own students" ON students
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own students" ON students
  FOR DELETE USING (auth.uid() = user_id);

-- Memorization policies (via student ownership)
CREATE POLICY "Users can view own memorization" ON memorization
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM students WHERE students.id = memorization.student_id AND students.user_id = auth.uid())
  );
CREATE POLICY "Users can insert own memorization" ON memorization
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM students WHERE students.id = memorization.student_id AND students.user_id = auth.uid())
  );
CREATE POLICY "Users can update own memorization" ON memorization
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM students WHERE students.id = memorization.student_id AND students.user_id = auth.uid())
  );
CREATE POLICY "Users can delete own memorization" ON memorization
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM students WHERE students.id = memorization.student_id AND students.user_id = auth.uid())
  );

-- Submissions policies (via student ownership)
CREATE POLICY "Users can view own submissions" ON submissions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM students WHERE students.id = submissions.student_id AND students.user_id = auth.uid())
  );
CREATE POLICY "Users can insert own submissions" ON submissions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM students WHERE students.id = submissions.student_id AND students.user_id = auth.uid())
  );
CREATE POLICY "Users can update own submissions" ON submissions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM students WHERE students.id = submissions.student_id AND students.user_id = auth.uid())
  );
CREATE POLICY "Users can delete own submissions" ON submissions
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM students WHERE students.id = submissions.student_id AND students.user_id = auth.uid())
  );

-- Settings policies
CREATE POLICY "Users can view own settings" ON settings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON settings
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own settings" ON settings
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- Indexes for performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_memorization_student_id ON memorization(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_settings_user_id ON settings(user_id);

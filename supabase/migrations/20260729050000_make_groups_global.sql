-- ============================================================
-- Hafalan — Migration: Make Groups Global & Re-align RLS
-- ============================================================

-- 1. Drop existing SELECT policies that restrict viewing to assigned teachers/owners
DROP POLICY IF EXISTS "Teachers can view assigned groups" ON groups;
DROP POLICY IF EXISTS "Teachers can view group teachers" ON group_teachers;
DROP POLICY IF EXISTS "Teachers can view students in their groups" ON students;
DROP POLICY IF EXISTS "Teachers can view group memorization" ON memorization;
DROP POLICY IF EXISTS "Teachers can view group submissions" ON submissions;

-- 2. Create global SELECT policies (any authenticated teacher can view all data)
CREATE POLICY "Teachers can view all groups" ON groups
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Teachers can view all group teachers" ON group_teachers
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Teachers can view all students" ON students
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Teachers can view all memorization" ON memorization
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Teachers can view all submissions" ON submissions
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- 3. Drop existing write/delete policies for students, memorization, and submissions
DROP POLICY IF EXISTS "Teachers can insert students in their groups" ON students;
DROP POLICY IF EXISTS "Teachers can update students in their groups" ON students;
DROP POLICY IF EXISTS "Teachers can delete students in their groups" ON students;

DROP POLICY IF EXISTS "Teachers can insert group memorization" ON memorization;
DROP POLICY IF EXISTS "Teachers can update group memorization" ON memorization;
DROP POLICY IF EXISTS "Teachers can delete group memorization" ON memorization;

DROP POLICY IF EXISTS "Teachers can insert group submissions" ON submissions;
DROP POLICY IF EXISTS "Teachers can update group submissions" ON submissions;
DROP POLICY IF EXISTS "Teachers can delete group submissions" ON submissions;

-- 4. Re-create write/delete policies to allow BOTH assigned teachers AND group owners

-- Students WRITE / DELETE
CREATE POLICY "Authorized teachers can insert students" ON students
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_teachers
      WHERE group_teachers.group_id = students.group_id
      AND group_teachers.teacher_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = students.group_id
      AND groups.user_id = auth.uid()
    )
  );

CREATE POLICY "Authorized teachers can update students" ON students
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM group_teachers
      WHERE group_teachers.group_id = students.group_id
      AND group_teachers.teacher_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = students.group_id
      AND groups.user_id = auth.uid()
    )
  );

CREATE POLICY "Authorized teachers can delete students" ON students
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM group_teachers
      WHERE group_teachers.group_id = students.group_id
      AND group_teachers.teacher_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = students.group_id
      AND groups.user_id = auth.uid()
    )
  );

-- Memorization WRITE / DELETE
CREATE POLICY "Authorized teachers can insert memorization" ON memorization
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM students
      JOIN group_teachers ON students.group_id = group_teachers.group_id
      WHERE students.id = memorization.student_id
      AND group_teachers.teacher_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM students
      JOIN groups ON students.group_id = groups.id
      WHERE students.id = memorization.student_id
      AND groups.user_id = auth.uid()
    )
  );

CREATE POLICY "Authorized teachers can update memorization" ON memorization
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM students
      JOIN group_teachers ON students.group_id = group_teachers.group_id
      WHERE students.id = memorization.student_id
      AND group_teachers.teacher_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM students
      JOIN groups ON students.group_id = groups.id
      WHERE students.id = memorization.student_id
      AND groups.user_id = auth.uid()
    )
  );

CREATE POLICY "Authorized teachers can delete memorization" ON memorization
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM students
      JOIN group_teachers ON students.group_id = group_teachers.group_id
      WHERE students.id = memorization.student_id
      AND group_teachers.teacher_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM students
      JOIN groups ON students.group_id = groups.id
      WHERE students.id = memorization.student_id
      AND groups.user_id = auth.uid()
    )
  );

-- Submissions WRITE / DELETE
CREATE POLICY "Authorized teachers can insert submissions" ON submissions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM students
      JOIN group_teachers ON students.group_id = group_teachers.group_id
      WHERE students.id = submissions.student_id
      AND group_teachers.teacher_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM students
      JOIN groups ON students.group_id = groups.id
      WHERE students.id = submissions.student_id
      AND groups.user_id = auth.uid()
    )
  );

CREATE POLICY "Authorized teachers can update submissions" ON submissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM students
      JOIN group_teachers ON students.group_id = group_teachers.group_id
      WHERE students.id = submissions.student_id
      AND group_teachers.teacher_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM students
      JOIN groups ON students.group_id = groups.id
      WHERE students.id = submissions.student_id
      AND groups.user_id = auth.uid()
    )
  );

CREATE POLICY "Authorized teachers can delete submissions" ON submissions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM students
      JOIN group_teachers ON students.group_id = group_teachers.group_id
      WHERE students.id = submissions.student_id
      AND group_teachers.teacher_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM students
      JOIN groups ON students.group_id = groups.id
      WHERE students.id = submissions.student_id
      AND groups.user_id = auth.uid()
    )
  );

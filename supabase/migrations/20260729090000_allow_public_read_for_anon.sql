-- Allow public select access (anon role) for parents
CREATE POLICY "Allow public read classes" ON classes FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public read groups" ON groups FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public read students" ON students FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public read submissions" ON submissions FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public read memorization" ON memorization FOR SELECT TO anon USING (true);

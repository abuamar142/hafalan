-- Allow all authenticated users to read and write settings
DROP POLICY IF EXISTS "Users can view own settings" ON settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON settings;
DROP POLICY IF EXISTS "Users can update own settings" ON settings;
DROP POLICY IF EXISTS "Users can delete own settings" ON settings;

DROP POLICY IF EXISTS "Allow all authenticated users to manage settings" ON settings;
CREATE POLICY "Allow all authenticated users to manage settings" ON settings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

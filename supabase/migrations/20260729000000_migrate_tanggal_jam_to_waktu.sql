-- =============================================
-- Migrate tanggal + jam → single waktu (timestamptz UTC)
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Add waktu column (nullable initially for backfill)
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS waktu timestamptz;

-- 2. Backfill existing data
-- Converts '14 April 2026' + '08.15' (WIB, UTC+7) → UTC timestamptz
UPDATE submissions
SET waktu = (
  to_date(
    split_part(tanggal, ' ', 1) || ' ' ||
    CASE split_part(tanggal, ' ', 2)
      WHEN 'Januari'   THEN 'January'
      WHEN 'Februari'  THEN 'February'
      WHEN 'Maret'     THEN 'March'
      WHEN 'April'     THEN 'April'
      WHEN 'Mei'       THEN 'May'
      WHEN 'Juni'      THEN 'June'
      WHEN 'Juli'      THEN 'July'
      WHEN 'Agustus'   THEN 'August'
      WHEN 'September' THEN 'September'
      WHEN 'Oktober'   THEN 'October'
      WHEN 'November'  THEN 'November'
      WHEN 'Desember'  THEN 'December'
    END || ' ' ||
    split_part(tanggal, ' ', 3),
    'DD Month YYYY'
  )
  + make_interval(
      hours => split_part(replace(jam, '.', ':'), ':')::int,
      mins  => split_part(replace(jam, '.', ':'), ':')::int[2]
    )
) at time zone 'Asia/Jakarta'
WHERE tanggal != '' AND jam != '';

-- 3. Set default for new rows
ALTER TABLE submissions ALTER COLUMN waktu SET DEFAULT now();

-- 4. Make NOT NULL after backfill
ALTER TABLE submissions ALTER COLUMN waktu SET NOT NULL;

-- 5. Drop old columns
ALTER TABLE submissions DROP COLUMN IF EXISTS tanggal;
ALTER TABLE submissions DROP COLUMN IF EXISTS jam;

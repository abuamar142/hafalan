-- Migration: Remove lembaga from settings table
-- Lembaga is now hardcoded as 'SMA Islam Bunga Bangsa' in the frontend

-- Delete existing lembaga setting rows
DELETE FROM settings WHERE key = 'lembaga';

-- Migration: Add color and kilometraje to vehiculos table
ALTER TABLE vehiculos ADD COLUMN IF NOT EXISTS color TEXT DEFAULT 'Blanco';
ALTER TABLE vehiculos ADD COLUMN IF NOT EXISTS kilometraje INTEGER DEFAULT 0;

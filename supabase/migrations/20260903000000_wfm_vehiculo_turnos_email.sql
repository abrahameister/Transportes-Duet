ALTER TABLE conductores ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE turnos_conductores ADD COLUMN IF NOT EXISTS vehiculo_id UUID REFERENCES vehiculos(id);
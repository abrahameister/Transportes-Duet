-- ==============================================================================
-- SCRIPT 01: DDL ECOSISTEMA TRANSPORTES DUET & WFM (POSTGRESQL / SUPABASE)
-- ==============================================================================
-- Este script crea las 11 tablas relacionales productivas para la gestión de flota,
-- tarifarios B2B en pesos chilenos (CLP$), nóminas de funcionarios y telemetría de
-- conductores WFM en el Gran Concepción y Chile, habilitando Row Level Security (RLS).
-- ==============================================================================

-- Habilitar extensión UUID para generación automática de identificadores en PostgreSQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. TABLA: FLOTA DE VEHÍCULOS (VANS, BUSES, FURGONES)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS vehiculos_flota (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    marca TEXT NOT NULL,
    modelo TEXT NOT NULL,
    anio INTEGER NOT NULL,
    placa TEXT UNIQUE NOT NULL, -- Patente del vehículo
    color TEXT NOT NULL,
    capacidad_pasajeros INTEGER NOT NULL DEFAULT 19,
    kilometraje INTEGER NOT NULL DEFAULT 0,
    estado_operativo TEXT NOT NULL DEFAULT 'operativo' CHECK (estado_operativo IN ('operativo', 'mantenimiento', 'inactivo')),
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- (removed index on empresa_id)

-- ==============================================================================
-- 3. TABLA: CONDUCTORES PROFESIONALES WFM (TELEMETRÍA Y TURNOS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS conductores_wfm (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    nombre_completo TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    telefono TEXT NOT NULL,
    avatar_url TEXT DEFAULT '',
    rut TEXT UNIQUE,
    tipo_licencia TEXT DEFAULT 'A3' CHECK (tipo_licencia IN ('A1', 'A2', 'A3')),
    puntualidad TEXT DEFAULT '5.0 / 5.0',
    servicios_mes INTEGER DEFAULT 0,
    vehiculo_asignado_id TEXT REFERENCES vehiculos_flota(id) ON DELETE SET NULL,
    estado_wfm TEXT NOT NULL DEFAULT 'disponible' CHECK (estado_wfm IN ('disponible', 'en_ruta', 'offline')),
    ultima_latitud DOUBLE PRECISION,
    ultima_longitud DOUBLE PRECISION,
    ultima_actualizacion_gps TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    numero_licencia TEXT,
    vencimiento_licencia DATE,
    horas_conducidas_hoy NUMERIC(5,2) DEFAULT 0.00,
    en_descanso BOOLEAN DEFAULT false,
    motivo_bloqueo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_conductores_estado ON conductores_wfm(estado_wfm);

-- ==============================================================================
-- 4. TABLA: CLIENTES CORPORATIVOS B2B (CONTRATANTES / CLÍNICAS / PLANTAS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS clientes_corporativos_b2b (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    nombre_corporativo TEXT NOT NULL,
    rut_identificador TEXT UNIQUE NOT NULL,
    direccion_fiscal TEXT NOT NULL,
    contacto_nombre TEXT NOT NULL,
    contacto_email TEXT NOT NULL,
    contacto_telefono TEXT,
    tarifa_por_km NUMERIC(10,2) NOT NULL DEFAULT 1200.00, -- en CLP$
    tarifa_minima NUMERIC(10,2) NOT NULL DEFAULT 6500.00,
    tiempo_espera_por_hora NUMERIC(10,2) NOT NULL DEFAULT 8000.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- (removed index on empresa_id)

-- ==============================================================================
-- 5. TABLA: RUTAS FIJAS DE TARIFARIO B2B
-- ==============================================================================
CREATE TABLE IF NOT EXISTS rutas_fijas_tarifario (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    cliente_corporativo_id TEXT NOT NULL REFERENCES clientes_corporativos_b2b(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    origen TEXT NOT NULL,
    destino TEXT NOT NULL,
    precio_clp NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 6. TABLA: FUNCIONARIOS B2B (COLABORADORES Y PASAJEROS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS funcionarios_b2b (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    cliente_corporativo_id TEXT NOT NULL REFERENCES clientes_corporativos_b2b(id) ON DELETE CASCADE,
    nombre_completo TEXT NOT NULL,
    rut TEXT NOT NULL,
    telefono TEXT NOT NULL,
    email TEXT NOT NULL,
    area TEXT NOT NULL DEFAULT 'Operaciones',
    direccion_recogida TEXT NOT NULL,
    comuna TEXT NOT NULL DEFAULT 'Concepción',
    centro_costo TEXT DEFAULT 'CC-01',
    preferencia_turno TEXT DEFAULT 'Mañana (06:00 - 14:00)',
    estado_geo TEXT NOT NULL DEFAULT 'activo' CHECK (estado_geo IN ('activo', 'inactivo', 'revision')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uniq_rut_cliente UNIQUE (cliente_corporativo_id, rut)
);
CREATE INDEX IF NOT EXISTS idx_funcionarios_cliente ON funcionarios_b2b(cliente_corporativo_id);

-- ==============================================================================
-- 7. TABLA: VIAJES & DESPACHOS OPERATIVOS (TORRE DE CONTROL WFM)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS viajes_operativa (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    cliente_corporativo_id TEXT NOT NULL REFERENCES clientes_corporativos_b2b(id) ON DELETE CASCADE,
    conductor_id TEXT REFERENCES conductores_wfm(id) ON DELETE SET NULL,
    vehiculo_id TEXT REFERENCES vehiculos_flota(id) ON DELETE SET NULL,
    pasajero_nombre TEXT NOT NULL,
    pasajero_telefono TEXT NOT NULL,
    origen_direccion TEXT NOT NULL,
    origen_lat DOUBLE PRECISION,
    origen_lng DOUBLE PRECISION,
    destino_direccion TEXT NOT NULL,
    destino_lat DOUBLE PRECISION,
    destino_lng DOUBLE PRECISION,
    fecha_programada TIMESTAMP WITH TIME ZONE NOT NULL,
    estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'asignado', 'en_camino', 'en_transito', 'completado', 'cancelado', 'excepcion')),
    secure_tracking_token TEXT UNIQUE NOT NULL,
    monto_estimado NUMERIC(10,2) DEFAULT 0.00,
    timestamp_despacho TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_viajes_estado ON viajes_operativa(estado);
CREATE INDEX IF NOT EXISTS idx_viajes_conductor ON viajes_operativa(conductor_id);
CREATE INDEX IF NOT EXISTS idx_viajes_token ON viajes_operativa(secure_tracking_token);

-- ==============================================================================
-- 8. TABLA: INCIDENCIAS OPERATIVAS & ALERTAS EN RUTA
-- ==============================================================================
CREATE TABLE IF NOT EXISTS incidencias_operativas (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    viaje_id TEXT NOT NULL REFERENCES viajes_operativa(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL CHECK (tipo IN ('retraso', 'falla_mecanica', 'trafico_severo', 'emergencia_sos')),
    gravedad TEXT NOT NULL CHECK (gravedad IN ('media', 'alta', 'critica')),
    descripcion TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    resuelta BOOLEAN DEFAULT false
);

-- ==============================================================================
-- 9. TABLA: RUTAS RECURRENTES & TURNOS PROGRAMADOS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS rutas_recurrentes_b2b (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    cliente_corporativo_id TEXT NOT NULL REFERENCES clientes_corporativos_b2b(id) ON DELETE CASCADE,
    nombre_ruta TEXT NOT NULL,
    dias_semana TEXT NOT NULL DEFAULT 'Lunes a Viernes',
    hora_programada TEXT NOT NULL,
    origen TEXT NOT NULL,
    destino TEXT NOT NULL,
    pasajero_referencia TEXT NOT NULL,
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 10. TABLA: AVISOS OPERATIVOS & BUZÓN DE COMUNICACIÓN EN VIVO
-- ==============================================================================
CREATE TABLE IF NOT EXISTS avisos_operativos (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    viaje_id TEXT REFERENCES viajes_operativa(id) ON DELETE SET NULL,
    pasajero_nombre TEXT NOT NULL,
    mensaje TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    leido BOOLEAN DEFAULT false,
    tipo TEXT NOT NULL DEFAULT 'aviso_rapido' CHECK (tipo IN ('aviso_rapido', 'sos_pasajero', 'alerta_central'))
);

-- ==============================================================================
-- 11. TABLA: MANIFIESTOS DE ABORDAJE (CHECKLIST DE ASISTENCIA EN PARADERO)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS manifiestos_abordaje_check (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    viaje_id TEXT NOT NULL REFERENCES viajes_operativa(id) ON DELETE CASCADE,
    funcionario_id TEXT REFERENCES funcionarios_b2b(id) ON DELETE SET NULL,
    nombre TEXT NOT NULL,
    rut TEXT NOT NULL,
    direccion TEXT NOT NULL,
    telefono TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'abordo', 'ausente', 'aviso_recibido')),
    nota_aviso TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_manifiesto_viaje_estado ON manifiestos_abordaje_check(viaje_id, estado);

-- ==============================================================================
-- CONFIGURACIÓN DE POLÍTICAS DE SEGURIDAD POR FILA (ROW LEVEL SECURITY - RLS)
-- ==============================================================================

-- (removed empresa RLS)
ALTER TABLE vehiculos_flota ENABLE ROW LEVEL SECURITY;
ALTER TABLE conductores_wfm ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes_corporativos_b2b ENABLE ROW LEVEL SECURITY;
ALTER TABLE rutas_fijas_tarifario ENABLE ROW LEVEL SECURITY;
ALTER TABLE funcionarios_b2b ENABLE ROW LEVEL SECURITY;
ALTER TABLE viajes_operativa ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidencias_operativas ENABLE ROW LEVEL SECURITY;
ALTER TABLE rutas_recurrentes_b2b ENABLE ROW LEVEL SECURITY;
ALTER TABLE avisos_operativos ENABLE ROW LEVEL SECURITY;
ALTER TABLE manifiestos_abordaje_check ENABLE ROW LEVEL SECURITY;

-- Creación de Políticas de Acceso Transaccional para la WebApp y Móvil
-- Nota: En producción las políticas filtran por token de sesión auth.uid() u claims del Tenant.
-- En este MVP habilitamos lectura y escritura autenticada y anónima para permitir las simulaciones y seeding.

-- (removed tenant RLS)
DROP POLICY IF EXISTS "Acceso total a flota" ON vehiculos_flota;
CREATE POLICY "Acceso total a flota" ON vehiculos_flota FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Acceso total a conductores" ON conductores_wfm;
CREATE POLICY "Acceso total a conductores" ON conductores_wfm FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Acceso total a clientes b2b" ON clientes_corporativos_b2b;
CREATE POLICY "Acceso total a clientes b2b" ON clientes_corporativos_b2b FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Acceso total a rutas fijas" ON rutas_fijas_tarifario;
CREATE POLICY "Acceso total a rutas fijas" ON rutas_fijas_tarifario FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Acceso total a funcionarios" ON funcionarios_b2b;
CREATE POLICY "Acceso total a funcionarios" ON funcionarios_b2b FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Acceso total a viajes" ON viajes_operativa;
CREATE POLICY "Acceso total a viajes" ON viajes_operativa FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Acceso total a incidencias" ON incidencias_operativas;
CREATE POLICY "Acceso total a incidencias" ON incidencias_operativas FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Acceso total a rutas recurrentes" ON rutas_recurrentes_b2b;
CREATE POLICY "Acceso total a rutas recurrentes" ON rutas_recurrentes_b2b FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Acceso total a avisos" ON avisos_operativos;
CREATE POLICY "Acceso total a avisos" ON avisos_operativos FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Acceso total a manifiestos" ON manifiestos_abordaje_check;
CREATE POLICY "Acceso total a manifiestos" ON manifiestos_abordaje_check FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- PRIVILEGIOS Y CONCESIÓN DE PERMISOS (POSTGREST EXCH / SUPABASE ROLES)
-- ==============================================================================
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role, postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role, postgres, anon, authenticated;

-- FIN DEL SCRIPT DE ESTRUCTURA DDL (01_schema_wfm_pro.sql)

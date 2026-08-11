-- ============================================================================
-- ARQUITECTURA DE SOFTWARE WFM - PLATAFORMA SAAS B2B TRANSPORTE MULTI-TENANT
-- Migración Inicial: Cimientos Multi-Tenant, WFM Core, RLS & Marca Blanca
-- ============================================================================

-- Habilitar extensiones requeridas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. ENUMS Y DATOS DEFINIDOS POR EL SISTEMA
-- ============================================================================

CREATE TYPE rol_usuario AS ENUM (
    'admin',              -- Administrador del Sistema
    'cliente_corporativo',-- Administrador de Cuenta B2B Contratante
    'conductor'           -- Chofer con acceso a App Universal Expo
);

CREATE TYPE estado_wfm_conductor AS ENUM (
    'offline',            -- Fuera de turno / Desconectado
    'disponible',         -- En turno / Activo y esperando viaje (Listo para Despacho)
    'en_ruta'             -- Despachado / Con viaje en curso
);

CREATE TYPE estado_viaje AS ENUM (
    'pendiente',          -- Solicitado por Cliente Corporativo (En Cola del Worker)
    'despachado',         -- Asignado por el Worker a un Conductor Disponible
    'en_camino',          -- Conductor dirigiéndose al punto de Origen
    'en_sitio',           -- Conductor en el punto de recogida esperando al pasajero
    'abordado',           -- Pasajero a bordo / Viaje en curso hacia el Destino
    'finalizado',         -- Servicio concluido con éxito
    'cancelado'           -- Servicio cancelado
);

-- (removed estado_pago_tenant)

-- ============================================================================
-- 2. TABLAS MAESTRAS: TENANTS (EMPRESAS) & PERFILES DE USUARIO
-- ============================================================================

-- (removed empresas table)

-- Perfiles de usuario vinculados a Supabase Auth
CREATE TABLE public.perfiles (
    id UUID PRIMARY KEY, -- Referenciará a auth.users(id) en producción
    rol rol_usuario NOT NULL,
    nombre_completo VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefono VARCHAR(50),
    avatar_url TEXT,
    activo BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- 3. TABLAS OPERACIONALES WFM & FLOTA
-- ============================================================================

-- Flota de Vehículos
CREATE TABLE public.vehiculos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    marca VARCHAR(100) NOT NULL,
    modelo VARCHAR(100) NOT NULL,
    anio INTEGER NOT NULL,
    placa VARCHAR(20) UNIQUE NOT NULL,
    color VARCHAR(50) NOT NULL,
    capacidad_pasajeros INTEGER DEFAULT 4 NOT NULL,
    activo BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Conductores y Control de Fuerza Laboral (Workforce Management - WFM)
CREATE TABLE public.conductores_wfm (
    id UUID PRIMARY KEY REFERENCES public.perfiles(id) ON DELETE CASCADE,
    vehiculo_asignado_id UUID REFERENCES public.vehiculos(id) ON DELETE SET NULL,
    -- Estados Operativos WFM en Tiempo Real
    estado_wfm estado_wfm_conductor DEFAULT 'offline' NOT NULL,
    ultima_latitud NUMERIC(10, 7),
    ultima_longitud NUMERIC(10, 7),
    ultima_actualizacion_gps TIMESTAMP WITH TIME ZONE,
    -- Metadatos del Chofer
    numero_licencia VARCHAR(100) NOT NULL,
    vencimiento_licencia DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Registro de Auditoría WFM (Trazabilidad de Turnos y Estados)
CREATE TABLE public.auditoria_wfm_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conductor_id UUID REFERENCES public.conductores_wfm(id) ON DELETE CASCADE NOT NULL,
    evento VARCHAR(100) NOT NULL,
    estado_anterior estado_wfm_conductor,
    estado_nuevo estado_wfm_conductor,
    observaciones TEXT,
    timestamp_evento TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- 4. CLIENTES CORPORATIVOS & VIAJES (TRANSACCIONAL)
-- ============================================================================

-- Clientes B2B Contratantes
CREATE TABLE public.clientes_corporativos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_corporativo VARCHAR(255) NOT NULL,
    rut_identificador VARCHAR(100) NOT NULL,
    direccion_fiscal TEXT,
    contacto_nombre VARCHAR(255),
    contacto_email VARCHAR(255),
    contacto_telefono VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(rut_identificador)
);

ALTER TABLE public.perfiles
    ADD COLUMN cliente_corporativo_id UUID REFERENCES public.clientes_corporativos(id) ON DELETE SET NULL;

-- Tabla Maestro transaccional de Viajes
CREATE TABLE public.viajes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_corporativo_id UUID REFERENCES public.clientes_corporativos(id) ON DELETE RESTRICT NOT NULL,
    conductor_id UUID REFERENCES public.conductores_wfm(id) ON DELETE SET NULL,
    vehiculo_id UUID REFERENCES public.vehiculos(id) ON DELETE SET NULL,
    
    -- Información del Pasajero Corporativo
    pasajero_nombre VARCHAR(255) NOT NULL,
    pasajero_telefono VARCHAR(50) NOT NULL,
    pasajero_email VARCHAR(255),
    
    -- Coordenadas de Ruta para Despacho WFM y Deep Linking Externo
    origen_direccion TEXT NOT NULL,
    origen_lat NUMERIC(10, 7) NOT NULL,
    origen_lng NUMERIC(10, 7) NOT NULL,
    destino_direccion TEXT NOT NULL,
    destino_lat NUMERIC(10, 7) NOT NULL,
    destino_lng NUMERIC(10, 7) NOT NULL,
    
    -- Estado Operacional y Token de PWA Pasajero
    fecha_programada TIMESTAMP WITH TIME ZONE NOT NULL,
    estado estado_viaje DEFAULT 'pendiente' NOT NULL,
    secure_tracking_token VARCHAR(64) UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    monto_estimado NUMERIC(10, 2) DEFAULT 0 NOT NULL,
    
    -- Tiempos de Hitos Operativos
    timestamp_despacho TIMESTAMP WITH TIME ZONE,
    timestamp_en_sitio TIMESTAMP WITH TIME ZONE,
    timestamp_abordado TIMESTAMP WITH TIME ZONE,
    timestamp_finalizado TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- 5. ÍNDICES DE ALTO RENDIMIENTO PARA DESPACHO Y REALTIME
-- ============================================================================

CREATE INDEX idx_viajes_estado ON public.viajes(estado);
CREATE INDEX idx_viajes_token_pwa ON public.viajes(secure_tracking_token);
CREATE INDEX idx_conductores_wfm_disponibles ON public.conductores_wfm(estado_wfm) WHERE estado_wfm = 'disponible';
CREATE INDEX idx_perfiles_rol ON public.perfiles(rol);

-- ============================================================================
-- 6. POLÍTICAS ROW LEVEL SECURITY (RLS) - AISLAMIENTO MULTI-TENANT
-- ============================================================================

ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conductores_wfm ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria_wfm_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes_corporativos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viajes ENABLE ROW LEVEL SECURITY;

-- Funciones Auxiliares para Políticas RLS
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS rol_usuario AS $$
    SELECT rol FROM public.perfiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;


-- --- Políticas para Tabla: PERFILES ---
CREATE POLICY "Admin Todo Perfiles" ON public.perfiles
    FOR ALL USING (public.current_user_role() = 'admin');

CREATE POLICY "Usuarios ven su propio perfil" ON public.perfiles
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Usuario modifica su propio perfil" ON public.perfiles
    FOR UPDATE USING (id = auth.uid());

-- --- Políticas para Tablas de WFM & Operaciones (Vehiculos, Conductores, Clientes, Viajes) ---
-- Patrón Global para Admins
CREATE POLICY "Admin Gestiona Vehiculos" ON public.vehiculos
    FOR ALL USING (public.current_user_role() = 'admin');

CREATE POLICY "Admin Gestiona Conductores WFM" ON public.conductores_wfm
    FOR ALL USING (public.current_user_role() = 'admin');

CREATE POLICY "Conductor actualiza su propio estado WFM y GPS" ON public.conductores_wfm
    FOR UPDATE USING (id = auth.uid() AND public.current_user_role() = 'conductor');

CREATE POLICY "Conductor ve su propio registro WFM" ON public.conductores_wfm
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Admin Gestiona Clientes Corporativos" ON public.clientes_corporativos
    FOR ALL USING (public.current_user_role() = 'admin');

CREATE POLICY "Cliente Corporativo Gestiona su propio Cliente" ON public.clientes_corporativos
    FOR ALL USING (id = (SELECT p.cliente_corporativo_id FROM perfiles p WHERE p.id = auth.uid()));

-- --- Políticas para VIAJES ---
CREATE POLICY "Admin Todo Viajes" ON public.viajes
    FOR ALL USING (public.current_user_role() = 'admin');

CREATE POLICY "Conductor ve viajes asignados a él" ON public.viajes
    FOR SELECT USING (conductor_id = auth.uid() OR estado = 'pendiente');

CREATE POLICY "Conductor actualiza estado de su viaje asignado" ON public.viajes
    FOR UPDATE USING (conductor_id = auth.uid() AND public.current_user_role() = 'conductor');

CREATE POLICY "Cliente Corporativo crea y ve sus viajes" ON public.viajes
    FOR ALL USING (cliente_corporativo_id = (SELECT p.cliente_corporativo_id FROM perfiles p WHERE p.id = auth.uid()));

-- ============================================================================
-- 7. FUNCIÓN RPC SEGURA PARA PWA DEL PASAJERO (SIN DESCARGAS)
-- ============================================================================
-- Permite que un pasajero no autenticado pero con el Token Hash acceda en tiempo real 
-- a la información del viaje, el estado del chofer, GPS y el Branding de la Empresa.

CREATE OR REPLACE FUNCTION public.get_viaje_pwa_por_token(p_token VARCHAR(64))
RETURNS TABLE (
    viaje_id UUID,
    estado estado_viaje,
    pasajero_nombre VARCHAR,
    origen_direccion TEXT,
    destino_direccion TEXT,
    fecha_programada TIMESTAMP WITH TIME ZONE,
    conductor_nombre VARCHAR,
    conductor_telefono VARCHAR,
    conductor_lat NUMERIC,
    conductor_lng NUMERIC,
    vehiculo_marca VARCHAR,
    vehiculo_modelo VARCHAR,
    vehiculo_placa VARCHAR,
    vehiculo_color VARCHAR,
    empresa_nombre VARCHAR,
    empresa_logo TEXT,
    empresa_color_primary VARCHAR,
    empresa_color_secondary VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.id as viaje_id,
        v.estado,
        v.pasajero_nombre,
        v.origen_direccion,
        v.destino_direccion,
        v.fecha_programada,
        p_cond.nombre_completo as conductor_nombre,
        p_cond.telefono as conductor_telefono,
        c_wfm.ultima_latitud as conductor_lat,
        c_wfm.ultima_longitud as conductor_lng,
        veh.marca as vehiculo_marca,
        veh.modelo as vehiculo_modelo,
        veh.placa as vehiculo_placa,
        veh.color as vehiculo_color,
        'Transportes Biobío'::VARCHAR as empresa_nombre,
        'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=150&q=80'::TEXT as empresa_logo,
        '#1E293B'::VARCHAR as empresa_color_primary,
        '#0F172A'::VARCHAR as empresa_color_secondary
    FROM public.viajes v
    LEFT JOIN public.conductores_wfm c_wfm ON v.conductor_id = c_wfm.id
    LEFT JOIN public.perfiles p_cond ON c_wfm.id = p_cond.id
    LEFT JOIN public.vehiculos veh ON v.vehiculo_id = veh.id
    WHERE v.secure_tracking_token = p_token
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

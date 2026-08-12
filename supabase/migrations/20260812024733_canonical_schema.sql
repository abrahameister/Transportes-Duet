-- Habilitar extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Perfiles (Usuarios Internos de la Transportista)
CREATE TABLE perfiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE, -- Opcional, pero recomendado si se enlaza a auth.users
    email TEXT UNIQUE NOT NULL,
    nombre_completo TEXT NOT NULL,
    rol TEXT NOT NULL CHECK (rol IN ('ADMIN', 'OPERACIONES', 'DISPATCHER', 'CONDUCTOR', 'CLIENTE_B2B')),
    estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 2. Clientes Corporativos B2B
CREATE TABLE clientes_corporativos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_fantasia TEXT NOT NULL,
    razon_social TEXT NOT NULL,
    rut TEXT UNIQUE NOT NULL,
    estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 3. Sedes del Cliente
CREATE TABLE sedes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_corporativo_id UUID NOT NULL REFERENCES clientes_corporativos(id) ON DELETE RESTRICT,
    nombre TEXT NOT NULL,
    direccion TEXT NOT NULL,
    latitud DOUBLE PRECISION,
    longitud DOUBLE PRECISION,
    estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 4. Centros de Costo del Cliente
CREATE TABLE centros_costo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_corporativo_id UUID NOT NULL REFERENCES clientes_corporativos(id) ON DELETE RESTRICT,
    codigo TEXT NOT NULL,
    descripcion TEXT,
    estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(cliente_corporativo_id, codigo)
);

-- 5. Usuarios Cliente B2B (Quienes ingresan al portal B2B)
CREATE TABLE usuarios_cliente_b2b (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    perfil_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE RESTRICT,
    cliente_corporativo_id UUID NOT NULL REFERENCES clientes_corporativos(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(perfil_id, cliente_corporativo_id)
);

-- 6. Pasajeros (Funcionarios del cliente que viajan)
CREATE TABLE pasajeros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_corporativo_id UUID NOT NULL REFERENCES clientes_corporativos(id) ON DELETE RESTRICT,
    sede_id UUID REFERENCES sedes(id) ON DELETE SET NULL,
    centro_costo_id UUID REFERENCES centros_costo(id) ON DELETE SET NULL,
    nombre_completo TEXT NOT NULL,
    rut TEXT NOT NULL,
    email TEXT,
    telefono TEXT,
    direccion_defecto TEXT,
    latitud_defecto DOUBLE PRECISION,
    longitud_defecto DOUBLE PRECISION,
    estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(cliente_corporativo_id, rut)
);

-- 7. Conductores
CREATE TABLE conductores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    perfil_id UUID REFERENCES perfiles(id) ON DELETE RESTRICT,
    rut TEXT UNIQUE NOT NULL,
    nombre_completo TEXT NOT NULL,
    telefono TEXT NOT NULL,
    tipo_licencia TEXT,
    vencimiento_licencia DATE,
    estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'suspendido')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 8. Vehiculos
CREATE TABLE vehiculos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patente TEXT UNIQUE NOT NULL,
    marca TEXT NOT NULL,
    modelo TEXT NOT NULL,
    anio INTEGER NOT NULL,
    capacidad INTEGER NOT NULL,
    estado TEXT NOT NULL DEFAULT 'operativo' CHECK (estado IN ('operativo', 'taller', 'dado_de_baja')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 9. Viajes
CREATE TABLE viajes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_corporativo_id UUID NOT NULL REFERENCES clientes_corporativos(id) ON DELETE RESTRICT,
    sede_id UUID REFERENCES sedes(id) ON DELETE SET NULL,
    fecha_programada TIMESTAMP WITH TIME ZONE NOT NULL,
    tipo_viaje TEXT NOT NULL CHECK (tipo_viaje IN ('ida', 'regreso', 'especial')),
    estado TEXT NOT NULL DEFAULT 'solicitado' CHECK (estado IN (
        'solicitado', 'validado', 'asignado', 'despachado', 'en_camino', 'en_punto', 'abordando', 'en_ruta', 'finalizado', 'cancelado', 'incidencia', 'rescate_solicitado'
    )),
    origen_direccion TEXT NOT NULL,
    origen_lat DOUBLE PRECISION,
    origen_lng DOUBLE PRECISION,
    destino_direccion TEXT NOT NULL,
    destino_lat DOUBLE PRECISION,
    destino_lng DOUBLE PRECISION,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 10. Viaje Pasajeros (Manifiesto Operacional)
CREATE TABLE viaje_pasajeros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    viaje_id UUID NOT NULL REFERENCES viajes(id) ON DELETE RESTRICT,
    pasajero_id UUID NOT NULL REFERENCES pasajeros(id) ON DELETE RESTRICT,
    estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'abordado', 'no_show', 'cancelado')),
    orden_parada INTEGER,
    hora_abordaje TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(viaje_id, pasajero_id)
);

-- 11. Asignaciones
CREATE TABLE asignaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    viaje_id UUID NOT NULL REFERENCES viajes(id) ON DELETE RESTRICT,
    conductor_id UUID NOT NULL REFERENCES conductores(id) ON DELETE RESTRICT,
    vehiculo_id UUID NOT NULL REFERENCES vehiculos(id) ON DELETE RESTRICT,
    estado TEXT NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'reemplazada', 'cancelada')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 12. Eventos Viaje (Log Inmutable)
CREATE TABLE eventos_viaje (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    viaje_id UUID NOT NULL REFERENCES viajes(id) ON DELETE RESTRICT,
    estado_anterior TEXT,
    estado_nuevo TEXT NOT NULL,
    generado_por_perfil_id UUID REFERENCES perfiles(id) ON DELETE SET NULL,
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 13. Incidencias
CREATE TABLE incidencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    viaje_id UUID NOT NULL REFERENCES viajes(id) ON DELETE RESTRICT,
    reportado_por_perfil_id UUID REFERENCES perfiles(id) ON DELETE SET NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('retraso', 'falla_mecanica', 'trafico', 'accidente', 'emergencia', 'otro')),
    severidad TEXT NOT NULL CHECK (severidad IN ('baja', 'media', 'alta', 'critica')),
    descripcion TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'abierta' CHECK (estado IN ('abierta', 'en_resolucion', 'resuelta')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 14. Avisos
CREATE TABLE avisos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    viaje_id UUID REFERENCES viajes(id) ON DELETE SET NULL,
    remitente_perfil_id UUID REFERENCES perfiles(id) ON DELETE SET NULL,
    destinatario_perfil_id UUID REFERENCES perfiles(id) ON DELETE SET NULL,
    mensaje TEXT NOT NULL,
    leido BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 15. Inspecciones
CREATE TABLE inspecciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conductor_id UUID NOT NULL REFERENCES conductores(id) ON DELETE RESTRICT,
    vehiculo_id UUID NOT NULL REFERENCES vehiculos(id) ON DELETE RESTRICT,
    viaje_id UUID REFERENCES viajes(id) ON DELETE SET NULL,
    kilometraje INTEGER NOT NULL,
    estado_general TEXT NOT NULL CHECK (estado_general IN ('ok', 'observaciones', 'no_apto')),
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 16. Tracking Positions
CREATE TABLE tracking_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    viaje_id UUID NOT NULL REFERENCES viajes(id) ON DELETE RESTRICT,
    conductor_id UUID NOT NULL REFERENCES conductores(id) ON DELETE RESTRICT,
    latitud DOUBLE PRECISION NOT NULL,
    longitud DOUBLE PRECISION NOT NULL,
    velocidad DOUBLE PRECISION,
    precision DOUBLE PRECISION,
    registrado_en TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 17. Tracking Tokens (Para Pasajeros)
CREATE TABLE tracking_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_hash TEXT NOT NULL UNIQUE,
    viaje_id UUID NOT NULL REFERENCES viajes(id) ON DELETE RESTRICT,
    pasajero_id UUID REFERENCES pasajeros(id) ON DELETE SET NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 18. Auditoria
CREATE TABLE auditoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tabla_afectada TEXT NOT NULL,
    registro_id UUID NOT NULL,
    accion TEXT NOT NULL CHECK (accion IN ('INSERT', 'UPDATE', 'DELETE')),
    realizado_por_perfil_id UUID REFERENCES perfiles(id) ON DELETE SET NULL,
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ==========================================
-- ÍNDICES
-- ==========================================
CREATE INDEX idx_viajes_cliente ON viajes(cliente_corporativo_id);
CREATE INDEX idx_viajes_estado ON viajes(estado);
CREATE INDEX idx_viaje_pasajeros_viaje ON viaje_pasajeros(viaje_id);
CREATE INDEX idx_asignaciones_viaje ON asignaciones(viaje_id);
CREATE INDEX idx_tracking_viaje ON tracking_positions(viaje_id);
CREATE INDEX idx_tokens_hash ON tracking_tokens(token_hash);
CREATE INDEX idx_pasajeros_cliente ON pasajeros(cliente_corporativo_id);

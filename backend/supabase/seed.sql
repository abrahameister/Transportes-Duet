-- ============================================================================
-- ARQUITECTURA WFM - DATA DE SIEMBRA (SEEDER) DE DEMOSTRACIÓN
-- SaaS B2B Transporte Multi-Tenant & White Label
-- ============================================================================

-- 1. CREACIÓN DE TENANTS DE DEMOSTRACIÓN (EMPRESAS CON MARCA BLANCA)
-- 1. CREACIÓN DE TENANTS DE DEMOSTRACIÓN (EMPRESAS CON MARCA BLANCA)
-- (removed)

-- 2. CREACIÓN DE PERFILES DE USUARIO (ROLES SISTEMA)
-- Nota: En entorno local con Supabase Auth deshabilitado para testing de UI, usamos UUIDs estables.
-- Insertar clientes corporativos antes de perfiles para evitar violaciones de clave foránea
INSERT INTO public.clientes_corporativos (id, nombre_corporativo, rut_identificador, direccion_fiscal, contacto_nombre, contacto_email)
VALUES
(
    'cccc0000-0000-0000-0000-000000000001',
    'Tech Global México S.A. de C.V.',
    'TGM-981020-H43',
    'Av. Paseo de la Reforma 250, Piso 15, Cuauhtémoc, CDMX',
    'Laura Martínez',
    'laura.m@techglobal.mx'
);

INSERT INTO public.perfiles (id, rol, nombre_completo, email, telefono, activo, cliente_corporativo_id)
VALUES
-- Super-Admin (SaaS Master - Sin empresa asignada)
('11111111-1111-1111-1111-111111111111', 'admin', 'Arquitecto WFM SaaS Master', 'master@wfm-transport-saas.com', '+525500001111', true, NULL),

-- Admin 
('22222222-2222-2222-2222-222222222222', 'admin', 'Roberto Gómez (Gerente Biobío)', 'roberto@biobio.cl', '+525511223344', true, NULL),

-- Conductor 1: Vip Express (Disponible WFM)
('44444444-4444-4444-4444-444444444444', 'conductor', 'Carlos ' || 'El Rápido' || ' Mendoza', 'carlos.chofer@vipexpress.com', '+525544332211', true, NULL),

-- Cliente Corporativo B2B Administrador
('66666666-6666-6666-6666-666666666666', 'cliente_corporativo', 'Laura Martínez (RRHH Tech Global)', 'laura.m@techglobal.mx', '+525588001122', true, 'cccc0000-0000-0000-0000-000000000001');

-- 3. FLOTA DE VEHÍCULOS
INSERT INTO public.vehiculos (id, marca, modelo, anio, placa, color, capacidad_pasajeros)
VALUES
('aaaa0000-0000-0000-0000-000000000001', 'Toyota', 'Camry Hybrid', 2024, 'VIP-900-A', 'Negro Obsidiana', 4),
('aaaa0000-0000-0000-0000-000000000002', 'Mercedes-Benz', 'Sprinter Ejecutiva', 2023, 'VAN-450-X', 'Plata Diamante', 12);

-- 4. INICIALIZACIÓN DE CONDUCTORES WFM (TELEMETRÍA Y ESTADOS OPERATIVOS)
INSERT INTO public.conductores_wfm (id, vehiculo_asignado_id, estado_wfm, ultima_latitud, ultima_longitud, ultima_actualizacion_gps, numero_licencia, vencimiento_licencia)
VALUES
(
    '44444444-4444-4444-4444-444444444444', -- Carlos (Vip Express)
    'aaaa0000-0000-0000-0000-000000000001', -- Toyota Camry
    'disponible',
    19.432608, -99.133209, -- Zócalo CDMX
    NOW(),
    'LIC-MX-990011',
    '2028-12-31'
);

-- 5. CLIENTES CORPORATIVOS B2B (Ya insertados arriba para evitar error FK)

-- 6. VIAJES OPERACIONALES (PARA DESPACHO WORKER Y PWA PASAJERO)
INSERT INTO public.viajes (
    id, 
    cliente_corporativo_id, 
    conductor_id, 
    vehiculo_id, 
    pasajero_nombre, 
    pasajero_telefono, 
    origen_direccion, 
    origen_lat, 
    origen_lng, 
    destino_direccion, 
    destino_lat, 
    destino_lng, 
    fecha_programada, 
    estado, 
    secure_tracking_token, 
    monto_estimado
)
VALUES
-- Viaje 1: PENDIENTE DE DESPACHO POR WORKER RAILWAY (Para demostrar Sprint 4 y 5)
(
    '77770000-0000-0000-0000-000000000001',
    'cccc0000-0000-0000-0000-000000000001',
    NULL, -- Aún sin conductor (El worker se lo asignará a Carlos por estar 'disponible')
    NULL,
    'Ing. David Solís (VP Ingeniería)',
    '+525501020304',
    'Aeropuerto Internacional de la Ciudad de México (Terminal 2)',
    19.435882, -99.082527,
    'Hotel Hyatt Regency, Polanco, CDMX',
    19.429074, -99.191696,
    NOW() + INTERVAL '1 hour',
    'pendiente',
    'token-viaje-pendiente-david-2026',
    450.00
);

-- 7. AUDITORÍA INICIAL WFM LOGS
INSERT INTO public.auditoria_wfm_logs (conductor_id, evento, estado_anterior, estado_nuevo, observaciones)
VALUES
('44444444-4444-4444-4444-444444444444', 'INICIO_TURNO_WFM', 'offline', 'disponible', 'Conductor firmó asistencia en App Universal Expo. Telemetría GPS activa.');

-- ============================================================================
-- ARQUITECTURA WFM - DATA DE SIEMBRA (SEEDER) DE DEMOSTRACIÓN
-- SaaS B2B Transporte Multi-Tenant & White Label
-- ============================================================================

-- 1. CREACIÓN DE TENANTS DE DEMOSTRACIÓN (EMPRESAS CON MARCA BLANCA)
INSERT INTO public.empresas (id, nombre, slug, logo_url, primary_color, secondary_color, accent_color, estado_pago)
VALUES 
(
    '10000000-0000-0000-0000-000000000001',
    'Vip Express Transportes Corporativos',
    'vipexpress',
    'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=300&q=80', -- Foto de auto elegante como placeholder
    '#1A237E', -- Indigo Oscuro (Primary)
    '#3949AB', -- Indigo Medio (Secondary)
    '#E8832A', -- Naranja Vibrante (Mandatorio para Mobile Buttons)
    'al_dia'
),
(
    '10000000-0000-0000-0000-000000000002',
    'EcoTransit Servicios Empresariales',
    'ecotransit',
    'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=300&q=80', -- Foto moderna
    '#064E3B', -- Verde Esmeralda Profundo (Primary)
    '#10B981', -- Verde Menta Vibrante (Secondary)
    '#E8832A', -- Naranja Vibrante (Mandatorio para Mobile Buttons)
    'al_dia'
);

-- 2. CREACIÓN DE PERFILES DE USUARIO (ROLES SISTEMA)
-- Nota: En entorno local con Supabase Auth deshabilitado para testing de UI, usamos UUIDs estables.
INSERT INTO public.perfiles (id, empresa_id, rol, nombre_completo, email, telefono, activo)
VALUES
-- Super-Admin (SaaS Master - Sin empresa asignada)
('11111111-1111-1111-1111-111111111111', NULL, 'superadmin', 'Arquitecto WFM SaaS Master', 'master@wfm-transport-saas.com', '+525500001111', true),

-- Admin Tenant 1: Vip Express
('22222222-2222-2222-2222-222222222222', '10000000-0000-0000-0000-000000000001', 'tenant_admin', 'Roberto Gómez (Gerente Vip Express)', 'roberto@vipexpress.com', '+525511223344', true),

-- Admin Tenant 2: EcoTransit
('33333333-3333-3333-3333-333333333333', '10000000-0000-0000-0000-000000000002', 'tenant_admin', 'Elena Rostova (Directora Operativa)', 'elena@ecotransit.com', '+525599887766', true),

-- Conductor 1: Vip Express (Disponible WFM)
('44444444-4444-4444-4444-444444444444', '10000000-0000-0000-0000-000000000001', 'conductor', 'Carlos ' || 'El Rápido' || ' Mendoza', 'carlos.chofer@vipexpress.com', '+525544332211', true),

-- Conductor 2: EcoTransit (En Ruta WFM)
('55555555-5555-5555-5555-555555555555', '10000000-0000-0000-0000-000000000002', 'conductor', 'Marcelo Silva Ecológico', 'marcelo.chofer@ecotransit.com', '+525577665544', true),

-- Cliente Corporativo B2B Administrador
('66666666-6666-6666-6666-666666666666', '10000000-0000-0000-0000-000000000001', 'cliente_corporativo', 'Laura Martínez (RRHH Tech Global)', 'laura.m@techglobal.mx', '+525588001122', true);

-- 3. FLOTA DE VEHÍCULOS
INSERT INTO public.vehiculos (id, empresa_id, marca, modelo, anio, placa, color, capacidad_pasajeros)
VALUES
('aaaa0000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Toyota', 'Camry Hybrid', 2024, 'VIP-900-A', 'Negro Obsidiana', 4),
('aaaa0000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Mercedes-Benz', 'Sprinter Ejecutiva', 2023, 'VAN-450-X', 'Plata Diamante', 12),
('bbbb0000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'BYD', 'D1 Eléctrico', 2025, 'ECO-101-E', 'Blanco Perla / Verde', 4);

-- 4. INICIALIZACIÓN DE CONDUCTORES WFM (TELEMETRÍA Y ESTADOS OPERATIVOS)
INSERT INTO public.conductores_wfm (id, empresa_id, vehiculo_asignado_id, estado_wfm, ultima_latitud, ultima_longitud, ultima_actualizacion_gps, numero_licencia, vencimiento_licencia)
VALUES
(
    '44444444-4444-4444-4444-444444444444', -- Carlos (Vip Express)
    '10000000-0000-0000-0000-000000000001',
    'aaaa0000-0000-0000-0000-000000000001', -- Toyota Camry
    'disponible',
    19.432608, -99.133209, -- Zócalo CDMX
    NOW(),
    'LIC-MX-990011',
    '2028-12-31'
),
(
    '55555555-5555-5555-5555-555555555555', -- Marcelo (EcoTransit)
    '10000000-0000-0000-0000-000000000002',
    'bbbb0000-0000-0000-0000-000000000001', -- BYD Eléctrico
    'en_ruta',
    19.427000, -99.167665, -- Ángel de la Independencia CDMX
    NOW(),
    'LIC-MX-770033',
    '2027-10-15'
);

-- 5. CLIENTES CORPORATIVOS B2B
INSERT INTO public.clientes_corporativos (id, empresa_id, nombre_corporativo, rut_identificador, direccion_fiscal, contacto_nombre, contacto_email)
VALUES
(
    'cccc0000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001', -- Cliente de Vip Express
    'Tech Global México S.A. de C.V.',
    'TGM-981020-H43',
    'Av. Paseo de la Reforma 250, Piso 15, Cuauhtémoc, CDMX',
    'Laura Martínez',
    'laura.m@techglobal.mx'
),
(
    'dddd0000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002', -- Cliente de EcoTransit
    'Fintech Verde S.A.',
    'FVE-050412-K98',
    'Insurgentes Sur 1602, Crédito Constructor, CDMX',
    'Andrés Gómez',
    'a.gomez@fintechverde.mx'
);

-- 6. VIAJES OPERACIONALES (PARA DESPACHO WORKER Y PWA PASAJERO)
INSERT INTO public.viajes (
    id, 
    empresa_id, 
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
    '10000000-0000-0000-0000-000000000001',
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
),

-- Viaje 2: EN CURSO (Para demostrable inmediato del PWA Pasajero por URL con token)
(
    '77770000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000002', -- EcoTransit
    'dddd0000-0000-0000-0000-000000000001', -- Fintech Verde
    '55555555-5555-5555-5555-555555555555', -- Marcelo Silva
    'bbbb0000-0000-0000-0000-000000000001', -- BYD D1 Eléctrico
    'Lic. Sofía Vergara (CFO Fintech Verde)',
    '+525590909090',
    'Insurgentes Sur 1602, Crédito Constructor, CDMX',
    19.368819, -99.181290,
    'Bolsa Mexicana de Valores, Río del Maza, Cuauhtémoc',
    19.432655, -99.162788,
    NOW() - INTERVAL '15 minutes',
    'en_camino',
    'demo-tracking-pwa-token-2026', -- TOKEN DE PRUEBA RÁPIDA PWA
    320.00
);

-- 7. AUDITORÍA INICIAL WFM LOGS
INSERT INTO public.auditoria_wfm_logs (empresa_id, conductor_id, evento, estado_anterior, estado_nuevo, observaciones)
VALUES
('10000000-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444', 'INICIO_TURNO_WFM', 'offline', 'disponible', 'Conductor firmó asistencia en App Universal Expo. Telemetría GPS activa.'),
('10000000-0000-0000-0000-000000000002', '55555555-5555-5555-5555-555555555555', 'DESPACHO_ASIGNADO', 'disponible', 'en_ruta', 'Asignado a servicio de Lic. Sofía Vergara. Botones Deep Linking listos en #E8832A.');

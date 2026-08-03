-- ==============================================================================
-- SCRIPT 02: SEEDING OPERATIVO REGULAR (GRAN CONCEPCIÓN & CHILE)
-- ==============================================================================
-- Este script puebla las tablas de Supabase con empresas transportistas del Biobío,
-- flotas, choferes profesionales A1/A2/A3, clientes contratantes y nóminas reales.
-- ==============================================================================

-- 1. INSERTAR EMPRESAS TRANSPORTISTAS (TENANTS)
INSERT INTO empresas_tenants (id, nombre, slug, logo_url, primary_color, secondary_color, accent_color, estado_pago, plan_suscripto, razon_social, rut)
VALUES 
('t_andina', 'Transportes Andina', 'andina', 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=150&q=80', '#1E293B', '#0F172A', '#E8832A', 'al_dia', 'Pro Tier-1', 'Transportes Andina del Biobío SpA', '76.842.190-2'),
('t_nexo', 'Nexo Mobility Platform', 'nexo', 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=150&q=80', '#064E3B', '#022C22', '#E8832A', 'al_dia', 'Enterprise Master', 'Nexo Chile Logística Corporativos S.A.', '96.540.210-9')
ON CONFLICT (id) DO NOTHING;

-- 2. INSERTAR FLOTA DE VEHÍCULOS
INSERT INTO vehiculos_flota (id, empresa_id, marca, modelo, anio, placa, color, capacidad_pasajeros, kilometraje, estado_operativo)
VALUES 
('v_1', 't_andina', 'Mercedes-Benz', 'Sprinter 516 CDI', 2024, 'VIP-100', 'Gris Plata', 19, 14200, 'operativo'),
('v_2', 't_andina', 'Hyundai', 'Solati H350', 2023, 'ECO-200', 'Blanco', 17, 32150, 'operativo'),
('v_3', 't_nexo', 'Mercedes-Benz', 'Sprinter Turismo Pro', 2025, 'EXE-300', 'Azul Noche', 22, 5400, 'operativo')
ON CONFLICT (id) DO NOTHING;

-- 3. INSERTAR CONDUCTORES PROFESIONALES WFM
INSERT INTO conductores_wfm (id, empresa_id, nombre_completo, email, telefono, rut, tipo_licencia, puntualidad, servicios_mes, vehiculo_asignado_id, estado_wfm, ultima_latitud, ultima_longitud, horas_conducidas_hoy)
VALUES 
('c_1', 't_andina', 'Carlos Muñoz Valenzuela', 'carlos.munoz@andina.cl', '+56 9 8234 5110', '12.489.102-K', 'A3', '4.9 / 5.0', 42, 'v_1', 'en_ruta', -36.8201, -73.0445, 3.50),
('c_2', 't_andina', 'Roberto Gómez Alarcón', 'roberto.gomez@andina.cl', '+56 9 7543 2198', '14.201.883-4', 'A2', '4.8 / 5.0', 38, 'v_2', 'disponible', -36.8285, -73.0512, 1.20),
('c_3', 't_nexo', 'Marcelo Peña Soto', 'marcelo.pena@nexomobility.cl', '+56 9 6112 3344', '10.984.321-7', 'A3', '5.0 / 5.0', 51, 'v_3', 'en_ruta', -36.8150, -73.0400, 4.00)
ON CONFLICT (id) DO NOTHING;

-- 4. INSERTAR CLIENTES CORPORATIVOS B2B
INSERT INTO clientes_corporativos_b2b (id, empresa_id, nombre_corporativo, rut_identificador, direccion_fiscal, contacto_nombre, contacto_email, contacto_telefono, tarifa_por_km, tarifa_minima, tiempo_espera_por_hora)
VALUES 
('b2b_sanatorio', 't_andina', 'Clínica Sanatorio Alemán / Urgencias', '70.210.400-5', 'Av. Pedro de Valdivia 800, Concepción', 'Dr. Ignacio Barros', 'ibarros@sanatorioaleman.cl', '+56 41 270 0000', 1350.00, 7000.00, 8500.00),
('b2b_arauco', 't_andina', 'Planta Industrial ARAUCO - Biobío', '90.100.200-1', 'Camino Forestal Km 18, Horcones / Arauco', 'Ing. Constanza Undurraga', 'c.undurraga@arauco.cl', '+56 41 280 5500', 1500.00, 12000.00, 9500.00),
('b2b_huachipato', 't_nexo', 'Siderúrgica Huachipato - Planta CAP', '88.300.100-3', 'Av. Gran Bretaña 2910, Talcahuano', 'Esteban Paredes Rojas', 'eparedes@cap.cl', '+56 41 250 3000', 1400.00, 8500.00, 8000.00)
ON CONFLICT (id) DO NOTHING;

-- 5. INSERTAR RUTAS FIJAS TARIFARIAS
INSERT INTO rutas_fijas_tarifario (id, cliente_corporativo_id, nombre, origen, destino, precio_clp)
VALUES 
('rf_1', 'b2b_sanatorio', 'Turno Noche Sanatorio ➔ San Pedro de la Paz', 'Clínica Sanatorio Alemán', 'San Pedro de la Paz (Andalue / Huertos)', 14500.00),
('rf_2', 'b2b_sanatorio', 'Urgencias ➔ Centro Concepción', 'Clínica Sanatorio Alemán', 'Plaza Independencia / Centro', 7500.00),
('rf_3', 'b2b_arauco', 'Concepción Centro ➔ Planta Horcones', 'Concepción (Plaza España)', 'Planta ARAUCO Km 18 Horcones', 48000.00)
ON CONFLICT (id) DO NOTHING;

-- 6. INSERTAR FUNCIONARIOS B2B (COLABORADORES)
INSERT INTO funcionarios_b2b (id, cliente_corporativo_id, nombre_completo, rut, telefono, email, area, direccion_recogida, comuna, centro_costo, preferencia_turno, estado_geo)
VALUES 
('f_1', 'b2b_sanatorio', 'Dra. María Paz Solar', '15.678.901-2', '+56 9 9123 4567', 'msolar@sanatorioaleman.cl', 'Medicina General', 'Av. Chacabuco 1400', 'Concepción', 'CC-URG-01', 'Noche (20:00 - 08:00)', 'activo'),
('f_2', 'b2b_sanatorio', 'Ing. Rodrigo Sepúlveda', '16.789.012-3', '+56 9 8234 5678', 'rsepulveda@sanatorioaleman.cl', 'Sistemas y Redes', 'Av. Pedro de Valdivia 850', 'Concepción', 'CC-TIC-03', 'Mañana (08:00 - 17:00)', 'activo'),
('f_3', 'b2b_sanatorio', 'Téc. Valentina Rojas', '17.890.123-4', '+56 9 7345 6789', 'vrojas@sanatorioaleman.cl', 'Laboratorio', 'Los Peumo 450, Huertos Familiares', 'San Pedro de la Paz', 'CC-LAB-02', 'Noche (20:00 - 08:00)', 'activo'),
('f_4', 'b2b_sanatorio', 'Téc. Gonzalo Morales', '18.901.234-5', '+56 9 6456 7890', 'gmorales@sanatorioaleman.cl', 'Radiología', 'O’Higgins 310', 'Concepción', 'CC-RAD-04', 'Mañana (08:00 - 17:00)', 'activo'),
('f_5', 'b2b_arauco', 'Matías Fernández Catalán', '13.450.981-1', '+56 9 5566 7788', 'm.fernandez@arauco.cl', 'Operaciones Planta', 'Calle Cóndor 1200', 'Talcahuano', 'CC-IND-88', 'Turno A (06:00 - 14:00)', 'activo')
ON CONFLICT (id) DO NOTHING;

-- 7. INSERTAR VIAJE OPERATIVO ACTIVO (DEMO EN CURSO)
INSERT INTO viajes_operativa (id, empresa_id, cliente_corporativo_id, conductor_id, vehiculo_id, pasajero_nombre, pasajero_telefono, origen_direccion, origen_lat, origen_lng, destino_direccion, destino_lat, destino_lng, fecha_programada, estado, secure_tracking_token, monto_estimado, timestamp_despacho)
VALUES 
('viaje_demo_1', 't_andina', 'b2b_sanatorio', 'c_1', 'v_1', 'Nómina Sanatorio (4 funcionarios)', '+56 9 9123 4567', 'Centro de Concepción / San Pedro', -36.8200, -73.0440, 'Clínica Sanatorio Alemán', -36.8290, -73.0480, timezone('utc'::text, now()), 'en_transito', 'token_seguro_andina_2026', 18500.00, timezone('utc'::text, now()))
ON CONFLICT (id) DO NOTHING;

-- 8. INSERTAR CHECKLIST DE MANIFIESTO DE ABORDAJE (PARA APP CONDUCTOR)
INSERT INTO manifiestos_abordaje_check (id, viaje_id, funcionario_id, nombre, rut, direccion, telefono, estado, nota_aviso)
VALUES 
('chk_1', 'viaje_demo_1', 'f_1', 'Dra. María Paz Solar', '15.678.901-2', 'Av. Chacabuco 1400, Concepción', '+56 9 9123 4567', 'abordo', 'Confirmada en portería'),
('chk_2', 'viaje_demo_1', 'f_2', 'Ing. Rodrigo Sepúlveda', '16.789.012-3', 'Av. Pedro de Valdivia 850, Concepción', '+56 9 8234 5678', 'pendiente', 'Aviso recibido: Bajo en 2 minutos'),
('chk_3', 'viaje_demo_1', 'f_3', 'Téc. Valentina Rojas', '17.890.123-4', 'Los Peumos 450, Huertos Familiares', '+56 9 7345 6789', 'pendiente', NULL),
('chk_4', 'viaje_demo_1', 'f_4', 'Téc. Gonzalo Morales', '18.901.234-5', 'O’Higgins 310, Concepción', '+56 9 6456 7890', 'pendiente', NULL)
ON CONFLICT (id) DO NOTHING;

-- 9. INSERTAR BUZÓN DE COMUNICACIÓN EN VIVO (AVISOS)
INSERT INTO avisos_operativos (id, viaje_id, pasajero_nombre, mensaje, timestamp, leido, tipo)
VALUES 
('av_1', 'viaje_demo_1', 'Ing. Rodrigo Sepúlveda', 'Bajo en 2 minutos, esperen un segundo por favor', timezone('utc'::text, now()), false, 'aviso_rapido'),
('av_2', 'viaje_demo_1', 'Central Operativa WFM', 'Alerta de congestión en Rotonda General Bonilla. Desviar por Avenida Paicaví.', timezone('utc'::text, now()), false, 'alerta_central')
ON CONFLICT (id) DO NOTHING;

-- FIN DEL SCRIPT DE SEEDING OPERATIVO (02_seeding_biobio.sql)

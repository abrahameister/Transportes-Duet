BEGIN;
SELECT plan(6);

SET search_path TO public, public;

-- Setup test data
-- 1. Cliente
INSERT INTO clientes_corporativos (id, rut, nombre_razon_social, fantasia) VALUES 
('c3333333-3333-3333-3333-333333333333', '3-9', 'Empresa C', 'EC') ON CONFLICT DO NOTHING;

-- 2. Sede
INSERT INTO sedes (id, cliente_corporativo_id, nombre, direccion) VALUES
('s3333333-3333-3333-3333-333333333333', 'c3333333-3333-3333-3333-333333333333', 'Sede C', 'Dir C') ON CONFLICT DO NOTHING;

-- 3. Vehiculo y Conductor
INSERT INTO vehiculos (id, patente, marca, modelo, anio, capacidad, estado) VALUES
('v1000000-0000-0000-0000-000000000000', 'AA11BB', 'Toyota', 'Yaris', 2020, 4, 'operativo'),
('v2000000-0000-0000-0000-000000000000', 'BB22CC', 'Mercedes', 'Sprinter', 2022, 2, 'operativo') ON CONFLICT DO NOTHING;

INSERT INTO conductores (id, rut, nombre_completo, telefono, estado) VALUES
('d1000000-0000-0000-0000-000000000000', '1010-1', 'Cond A', '123', 'activo'),
('d2000000-0000-0000-0000-000000000000', '2020-2', 'Cond B', '123', 'inactivo') ON CONFLICT DO NOTHING;

-- 4. Pasajeros
INSERT INTO pasajeros (id, cliente_corporativo_id, nombre_completo, rut, estado) VALUES
('px100000-0000-0000-0000-000000000000', 'c3333333-3333-3333-3333-333333333333', 'Pax 1', 'px1', 'activo'),
('px200000-0000-0000-0000-000000000000', 'c3333333-3333-3333-3333-333333333333', 'Pax 2', 'px2', 'activo'),
('px300000-0000-0000-0000-000000000000', 'c3333333-3333-3333-3333-333333333333', 'Pax 3', 'px3', 'activo') ON CONFLICT DO NOTHING;

-- 5. Turnos
INSERT INTO turnos_pasajeros (id, cliente_corporativo_id, pasajero_id, sede_id, fecha, hora_entrada, hora_salida, direccion_recogida, estado) VALUES
('t1000000-0000-0000-0000-000000000000', 'c3333333-3333-3333-3333-333333333333', 'px100000-0000-0000-0000-000000000000', 's3333333-3333-3333-3333-333333333333', '2026-10-10', '08:00', '18:00', 'Dir 1', 'programado'),
('t2000000-0000-0000-0000-000000000000', 'c3333333-3333-3333-3333-333333333333', 'px200000-0000-0000-0000-000000000000', 's3333333-3333-3333-3333-333333333333', '2026-10-10', '08:00', '18:00', 'Dir 2', 'programado'),
('t3000000-0000-0000-0000-000000000000', 'c3333333-3333-3333-3333-333333333333', 'px300000-0000-0000-0000-000000000000', 's3333333-3333-3333-3333-333333333333', '2026-10-10', '08:00', '18:00', 'Dir 3', 'programado') ON CONFLICT DO NOTHING;

-- 6. User ADMIN
INSERT INTO auth.users (id, email) VALUES 
('u9000000-0000-0000-0000-000000000000', 'admin@test.cl') ON CONFLICT DO NOTHING;
INSERT INTO perfiles (id, auth_user_id, rut, nombre_completo, rol, email, estado) VALUES 
('p9000000-0000-0000-0000-000000000000', 'u9000000-0000-0000-0000-000000000000', '999', 'Admin Test', 'ADMIN', 'admin@test.cl', 'activo') ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION test_set_role(p_uid UUID) RETURNS void AS $$
BEGIN
  PERFORM set_config('request.jwt.claims', format('{"sub": "%s"}', p_uid), true);
  SET LOCAL ROLE authenticated;
END;
$$ LANGUAGE plpgsql;

-- Set as ADMIN
SELECT test_set_role('u9000000-0000-0000-0000-000000000000');

-- TEST 1: Fail because vehicle capacity is exceeded (Vehicle 2 capacity is 2, sending 3 pax)
SELECT throws_ok(
    $$ SELECT create_planned_trips('[{"sede_id": "s3333333-3333-3333-3333-333333333333", "fecha_programada": "2026-10-10T08:00:00Z", "tipo_viaje": "ida", "origen_direccion": "Multi", "destino_direccion": "Sede", "vehiculo_id": "v2000000-0000-0000-0000-000000000000", "conductor_id": "d1000000-0000-0000-0000-000000000000", "pasajeros": [{"turno_id": "t1000000-0000-0000-0000-000000000000", "pasajero_id": "px100000-0000-0000-0000-000000000000", "orden": 1, "direccion": "D1", "lat": -36, "lng": -73}, {"turno_id": "t2000000-0000-0000-0000-000000000000", "pasajero_id": "px200000-0000-0000-0000-000000000000", "orden": 2, "direccion": "D2", "lat": -36, "lng": -73}, {"turno_id": "t3000000-0000-0000-0000-000000000000", "pasajero_id": "px300000-0000-0000-0000-000000000000", "orden": 3, "direccion": "D3", "lat": -36, "lng": -73}]}]'::JSONB) $$,
    'Capacidad excedida para el vehículo BB22CC (Capacidad: 2, Pasajeros: 3)',
    'Should fail if capacity is exceeded'
);

-- TEST 2: Fail because driver is inactive
SELECT throws_ok(
    $$ SELECT create_planned_trips('[{"sede_id": "s3333333-3333-3333-3333-333333333333", "fecha_programada": "2026-10-10T08:00:00Z", "tipo_viaje": "ida", "origen_direccion": "Multi", "destino_direccion": "Sede", "vehiculo_id": "v1000000-0000-0000-0000-000000000000", "conductor_id": "d2000000-0000-0000-0000-000000000000", "pasajeros": [{"turno_id": "t1000000-0000-0000-0000-000000000000", "pasajero_id": "px100000-0000-0000-0000-000000000000", "orden": 1, "direccion": "D1", "lat": -36, "lng": -73}]}]'::JSONB) $$,
    'El conductor d2000000-0000-0000-0000-000000000000 no está activo o no existe.',
    'Should fail if driver is inactive'
);

-- TEST 3: Success with valid vehicle 1 (Capacity 4) and active driver
SELECT lives_ok(
    $$ SELECT create_planned_trips('[{"sede_id": "s3333333-3333-3333-3333-333333333333", "fecha_programada": "2026-10-10T08:00:00Z", "tipo_viaje": "ida", "origen_direccion": "Multi", "destino_direccion": "Sede", "vehiculo_id": "v1000000-0000-0000-0000-000000000000", "conductor_id": "d1000000-0000-0000-0000-000000000000", "pasajeros": [{"turno_id": "t1000000-0000-0000-0000-000000000000", "pasajero_id": "px100000-0000-0000-0000-000000000000", "orden": 1, "direccion": "D1", "lat": -36, "lng": -73}, {"turno_id": "t2000000-0000-0000-0000-000000000000", "pasajero_id": "px200000-0000-0000-0000-000000000000", "orden": 2, "direccion": "D2", "lat": -36.1, "lng": -73.1}]}]'::JSONB) $$,
    'Should succeed with valid data'
);

-- TEST 4: Fail double planning
SELECT throws_ok(
    $$ SELECT create_planned_trips('[{"sede_id": "s3333333-3333-3333-3333-333333333333", "fecha_programada": "2026-10-10T08:00:00Z", "tipo_viaje": "ida", "origen_direccion": "Multi", "destino_direccion": "Sede", "vehiculo_id": "v1000000-0000-0000-0000-000000000000", "conductor_id": "d1000000-0000-0000-0000-000000000000", "pasajeros": [{"turno_id": "t1000000-0000-0000-0000-000000000000", "pasajero_id": "px100000-0000-0000-0000-000000000000", "orden": 1, "direccion": "D1", "lat": -36, "lng": -73}]}]'::JSONB) $$,
    'El turno t1000000-0000-0000-0000-000000000000 ya no está disponible (Estado: asignado).',
    'Should fail if shift is already assigned'
);

-- TEST 5: Verify Turno status updated
SELECT is(
    (SELECT estado FROM turnos_pasajeros WHERE id = 't1000000-0000-0000-0000-000000000000'),
    'asignado',
    'Shift state should be asignado'
);

-- TEST 6: Verify viaje_pasajeros saved snapshot
SELECT is(
    (SELECT direccion_parada FROM viaje_pasajeros WHERE pasajero_id = 'px200000-0000-0000-0000-000000000000' LIMIT 1),
    'D2',
    'Manifest should save the stop address snapshot'
);

ROLLBACK;

BEGIN;
SELECT plan(8);

-- Set search path for pgTAP
SET search_path TO public, public;

-- Setup test data
-- 1. Create Cliente
INSERT INTO clientes_corporativos (id, rut, nombre_razon_social, fantasia) VALUES 
('c0000000-0000-0000-0000-000000000000', '12345678-9', 'Test Cliente', 'TC') ON CONFLICT DO NOTHING;

-- 2. Create Users/Profiles
INSERT INTO auth.users (id, email) VALUES 
('u1000000-0000-0000-0000-000000000000', 'admin@test.cl'),
('u2000000-0000-0000-0000-000000000000', 'cond1@test.cl'),
('u3000000-0000-0000-0000-000000000000', 'cond2@test.cl') ON CONFLICT DO NOTHING;

INSERT INTO perfiles (id, auth_user_id, rut, nombre_completo, rol, email, estado) VALUES 
('p1000000-0000-0000-0000-000000000000', 'u1000000-0000-0000-0000-000000000000', '11111111-1', 'Admin', 'ADMIN', 'admin@test.cl', 'activo'),
('p2000000-0000-0000-0000-000000000000', 'u2000000-0000-0000-0000-000000000000', '22222222-2', 'Conductor 1', 'CONDUCTOR', 'cond1@test.cl', 'activo'),
('p3000000-0000-0000-0000-000000000000', 'u3000000-0000-0000-0000-000000000000', '33333333-3', 'Conductor 2', 'CONDUCTOR', 'cond2@test.cl', 'activo') ON CONFLICT DO NOTHING;

-- 3. Create Conductores and Vehiculos
INSERT INTO conductores (id, perfil_id, rut, nombre_completo, telefono, estado) VALUES 
('d1000000-0000-0000-0000-000000000000', 'p2000000-0000-0000-0000-000000000000', '22222222-2', 'Conductor 1', '+56900000000', 'activo'),
('d2000000-0000-0000-0000-000000000000', 'p3000000-0000-0000-0000-000000000000', '33333333-3', 'Conductor 2', '+56900000000', 'activo') ON CONFLICT DO NOTHING;

INSERT INTO vehiculos (id, patente, marca, modelo, anio, capacidad, estado) VALUES 
('v1000000-0000-0000-0000-000000000000', 'AAAA11', 'Toyota', 'Hiace', 2022, 12, 'operativo') ON CONFLICT DO NOTHING;

-- 4. Create Trip
INSERT INTO viajes (id, cliente_corporativo_id, fecha_programada, tipo_viaje, origen_direccion, destino_direccion, estado) VALUES 
('t1000000-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000000', now(), 'ida', 'Origen', 'Destino', 'asignado') ON CONFLICT DO NOTHING;

-- 5. Create Asignacion
INSERT INTO asignaciones (id, viaje_id, conductor_id, vehiculo_id, estado) VALUES
('a1000000-0000-0000-0000-000000000000', 't1000000-0000-0000-0000-000000000000', 'd1000000-0000-0000-0000-000000000000', 'v1000000-0000-0000-0000-000000000000', 'activa') ON CONFLICT DO NOTHING;

-- 6. Create Pasajeros and Viaje_Pasajeros
INSERT INTO pasajeros (id, cliente_corporativo_id, nombre_completo, rut, estado) VALUES
('ps100000-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000000', 'Pasajero 1', '1111', 'activo'),
('ps200000-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000000', 'Pasajero 2', '2222', 'activo') ON CONFLICT DO NOTHING;

INSERT INTO viaje_pasajeros (id, viaje_id, pasajero_id, estado) VALUES
('vp100000-0000-0000-0000-000000000000', 't1000000-0000-0000-0000-000000000000', 'ps100000-0000-0000-0000-000000000000', 'pendiente'),
('vp200000-0000-0000-0000-000000000000', 't1000000-0000-0000-0000-000000000000', 'ps200000-0000-0000-0000-000000000000', 'pendiente') ON CONFLICT DO NOTHING;

-- Helper to switch roles
CREATE OR REPLACE FUNCTION test_set_role(p_uid UUID) RETURNS void AS $$
BEGIN
  PERFORM set_config('request.jwt.claims', format('{"sub": "%s"}', p_uid), true);
  SET LOCAL ROLE authenticated;
END;
$$ LANGUAGE plpgsql;

-- TEST 1: Wrong driver cannot board passenger
SELECT test_set_role('u3000000-0000-0000-0000-000000000000'); -- Conductor 2
SELECT throws_ok(
    'SELECT board_passenger(''t1000000-0000-0000-0000-000000000000'', ''ps100000-0000-0000-0000-000000000000'', ''abordado'')',
    'No estás asignado a este viaje.',
    'Driver 2 cannot board driver 1s passenger'
);

-- TEST 2: Admin cannot board passenger
SELECT test_set_role('u1000000-0000-0000-0000-000000000000'); -- Admin
SELECT throws_ok(
    'SELECT board_passenger(''t1000000-0000-0000-0000-000000000000'', ''ps100000-0000-0000-0000-000000000000'', ''abordado'')',
    'Solo un conductor puede realizar esta acción.',
    'Admin cannot use board_passenger directly.'
);

-- TEST 3: Driver boards passenger
SELECT test_set_role('u2000000-0000-0000-0000-000000000000'); -- Conductor 1
SELECT lives_ok(
    'SELECT board_passenger(''t1000000-0000-0000-0000-000000000000'', ''ps100000-0000-0000-0000-000000000000'', ''abordado'')',
    'Driver 1 successfully boards passenger 1'
);
SELECT results_eq(
    'SELECT estado FROM viaje_pasajeros WHERE pasajero_id = ''ps100000-0000-0000-0000-000000000000''',
    ARRAY['abordado'],
    'Passenger state updated to abordado'
);

-- TEST 4: Repetitive boarding (Idempotency) does not throw error and does not insert new event
SELECT lives_ok(
    'SELECT board_passenger(''t1000000-0000-0000-0000-000000000000'', ''ps100000-0000-0000-0000-000000000000'', ''abordado'')',
    'Driver 1 repeatedly boards passenger 1 without error (idempotent)'
);
-- We expect only 1 event in eventos_viaje for this specific action (where notas contains the passenger id)
SELECT is(
    (SELECT COUNT(*) FROM eventos_viaje WHERE viaje_id = 't1000000-0000-0000-0000-000000000000'::UUID AND notas LIKE '%ps100000-0000-0000-0000-000000000000%')::integer,
    1,
    'Only 1 event is recorded for the idempotent action'
);

-- TEST 5: Passenger not in manifest
SELECT throws_ok(
    'SELECT board_passenger(''t1000000-0000-0000-0000-000000000000'', ''c0000000-0000-0000-0000-000000000000'', ''abordado'')',
    'Pasajero no pertenece a este viaje.',
    'Cannot board a passenger that is not in the trip manifest'
);

-- TEST 6: Mark No-show
SELECT lives_ok(
    'SELECT board_passenger(''t1000000-0000-0000-0000-000000000000'', ''ps200000-0000-0000-0000-000000000000'', ''no_show'')',
    'Driver marks passenger 2 as no_show'
);

ROLLBACK;

BEGIN;
SELECT plan(6);

SET search_path TO public, public;

-- Setup test data
-- 1. Clientes
INSERT INTO clientes_corporativos (id, rut, nombre_razon_social, fantasia) VALUES 
('c9999999-9999-9999-9999-999999999999', '9-9', 'Empresa 9', 'E9'),
('c8888888-8888-8888-8888-888888888888', '8-9', 'Empresa 8', 'E8') ON CONFLICT DO NOTHING;

-- 2. Sedes
INSERT INTO sedes (id, cliente_corporativo_id, nombre, direccion) VALUES
('s9999999-9999-9999-9999-999999999999', 'c9999999-9999-9999-9999-999999999999', 'Sede 9', 'Dir 9') ON CONFLICT DO NOTHING;

-- 3. Users/Profiles B2B
INSERT INTO auth.users (id, email) VALUES 
('u9999999-9999-9999-9999-999999999999', 'b2b9@test.cl'),
('u8888888-8888-8888-8888-888888888888', 'b2b8@test.cl') ON CONFLICT DO NOTHING;

INSERT INTO perfiles (id, auth_user_id, rut, nombre_completo, rol, email, estado) VALUES 
('p9999999-9999-9999-9999-999999999999', 'u9999999-9999-9999-9999-999999999999', '9999-9', 'User 9', 'CLIENTE_B2B', 'b2b9@test.cl', 'activo'),
('p8888888-8888-8888-8888-888888888888', 'u8888888-8888-8888-8888-888888888888', '8888-8', 'User 8', 'CLIENTE_B2B', 'b2b8@test.cl', 'activo') ON CONFLICT DO NOTHING;

INSERT INTO usuarios_cliente_b2b (perfil_id, cliente_corporativo_id) VALUES
('p9999999-9999-9999-9999-999999999999', 'c9999999-9999-9999-9999-999999999999'),
('p8888888-8888-8888-8888-888888888888', 'c8888888-8888-8888-8888-888888888888') ON CONFLICT DO NOTHING;

-- 4. User ADMIN
INSERT INTO auth.users (id, email) VALUES 
('u7777777-7777-7777-7777-777777777777', 'admin7@test.cl') ON CONFLICT DO NOTHING;

INSERT INTO perfiles (id, auth_user_id, rut, nombre_completo, rol, email, estado) VALUES 
('p7777777-7777-7777-7777-777777777777', 'u7777777-7777-7777-7777-777777777777', '777-7', 'Admin Test', 'ADMIN', 'admin7@test.cl', 'activo') ON CONFLICT DO NOTHING;

-- 5. Data setup for KPIs
-- Create a few trips for Client 9
INSERT INTO viajes (id, cliente_corporativo_id, sede_id, fecha_programada, tipo_viaje, estado, origen_direccion, destino_direccion) VALUES
('v9000000-0000-0000-0000-000000000001', 'c9999999-9999-9999-9999-999999999999', 's9999999-9999-9999-9999-999999999999', now(), 'ida', 'finalizado', 'O1', 'D1'),
('v9000000-0000-0000-0000-000000000002', 'c9999999-9999-9999-9999-999999999999', 's9999999-9999-9999-9999-999999999999', now(), 'ida', 'en_camino', 'O2', 'D2') ON CONFLICT DO NOTHING;

-- Pasajeros (Mock) for Client 9
INSERT INTO pasajeros (id, cliente_corporativo_id, nombre_completo, rut, estado) VALUES
('px900000-0000-0000-0000-000000000001', 'c9999999-9999-9999-9999-999999999999', 'Pax 1', 'px91', 'activo'),
('px900000-0000-0000-0000-000000000002', 'c9999999-9999-9999-9999-999999999999', 'Pax 2', 'px92', 'activo') ON CONFLICT DO NOTHING;

INSERT INTO viaje_pasajeros (id, viaje_id, pasajero_id, estado, orden_parada) VALUES
('vp900000-0000-0000-0000-000000000001', 'v9000000-0000-0000-0000-000000000001', 'px900000-0000-0000-0000-000000000001', 'abordado', 1),
('vp900000-0000-0000-0000-000000000002', 'v9000000-0000-0000-0000-000000000001', 'px900000-0000-0000-0000-000000000002', 'no_show', 2) ON CONFLICT DO NOTHING;


CREATE OR REPLACE FUNCTION test_set_role(p_uid UUID) RETURNS void AS $$
BEGIN
  PERFORM set_config('request.jwt.claims', format('{"sub": "%s"}', p_uid), true);
  SET LOCAL ROLE authenticated;
END;
$$ LANGUAGE plpgsql;

-- TEST 1 & 2: B2B User 9 can read their own KPIs
SELECT test_set_role('u9999999-9999-9999-9999-999999999999');

SELECT is(
    (SELECT (get_b2b_kpis()->>'total_viajes_mes')::int),
    2,
    'Client 9 has 2 total trips this month'
);

SELECT is(
    (SELECT (get_b2b_kpis()->>'pasajeros_movilizados')::int),
    1,
    'Client 9 has 1 boarded passenger this month'
);

SELECT is(
    (SELECT (get_b2b_kpis()->>'no_shows')::int),
    1,
    'Client 9 has 1 no_show this month'
);

-- TEST 3: B2B User 8 isolation (Should see 0 trips, as they have none)
SELECT test_set_role('u8888888-8888-8888-8888-888888888888');
SELECT is(
    (SELECT (get_b2b_kpis()->>'total_viajes_mes')::int),
    0,
    'Client 8 should have 0 trips'
);

-- TEST 4 & 5: Admin User can read overall KPIs
SELECT test_set_role('u7777777-7777-7777-7777-777777777777');
-- Note: There might be more data from previous tests or seeds, but we can check if it executes ok.
SELECT lives_ok(
    $$ SELECT get_admin_kpis() $$,
    'Admin can run get_admin_kpis'
);

SELECT is(
    (SELECT (get_admin_kpis()->>'viajes_en_curso')::int > 0),
    true,
    'Admin sees at least 1 trip in course (from the insert)'
);

ROLLBACK;

BEGIN;
SELECT plan(6);

SET search_path TO public, public;

-- Setup test data
-- 1. Create Cliente A and Cliente B
INSERT INTO clientes_corporativos (id, rut, nombre_razon_social, fantasia) VALUES 
('c0000000-0000-0000-0000-000000000000', '1-9', 'Empresa A', 'EA'),
('c1111111-1111-1111-1111-111111111111', '2-9', 'Empresa B', 'EB') ON CONFLICT DO NOTHING;

-- 2. Create Sedes
INSERT INTO sedes (id, cliente_corporativo_id, nombre, direccion) VALUES
('s0000000-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000000', 'Sede A', 'Dir A'),
('s1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'Sede B', 'Dir B') ON CONFLICT DO NOTHING;

-- 3. Create Users/Profiles
INSERT INTO auth.users (id, email) VALUES 
('u1000000-0000-0000-0000-000000000000', 'b2ba@test.cl'),
('u2000000-0000-0000-0000-000000000000', 'b2bb@test.cl') ON CONFLICT DO NOTHING;

INSERT INTO perfiles (id, auth_user_id, rut, nombre_completo, rol, email, estado) VALUES 
('p1000000-0000-0000-0000-000000000000', 'u1000000-0000-0000-0000-000000000000', '111', 'User A', 'CLIENTE_B2B', 'b2ba@test.cl', 'activo'),
('p2000000-0000-0000-0000-000000000000', 'u2000000-0000-0000-0000-000000000000', '222', 'User B', 'CLIENTE_B2B', 'b2bb@test.cl', 'activo') ON CONFLICT DO NOTHING;

INSERT INTO usuarios_cliente_b2b (perfil_id, cliente_corporativo_id) VALUES
('p1000000-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000000'),
('p2000000-0000-0000-0000-000000000000', 'c1111111-1111-1111-1111-111111111111') ON CONFLICT DO NOTHING;


CREATE OR REPLACE FUNCTION test_set_role(p_uid UUID) RETURNS void AS $$
BEGIN
  PERFORM set_config('request.jwt.claims', format('{"sub": "%s"}', p_uid), true);
  SET LOCAL ROLE authenticated;
END;
$$ LANGUAGE plpgsql;

-- TEST 1: User A imports shifts to Sede A successfully
SELECT test_set_role('u1000000-0000-0000-0000-000000000000');
SELECT lives_ok(
    $$ SELECT import_b2b_shifts('[{"rut": "123-4", "nombre": "Pax A", "direccion": "Dir X", "fecha": "2026-10-10", "hora_entrada": "08:00", "hora_salida": "18:00", "sede_id": "s0000000-0000-0000-0000-000000000000"}]'::JSONB) $$,
    'User A can import shifts successfully'
);

-- TEST 2: Validate passenger was created and linked to Empresa A
SELECT is(
    (SELECT count(*) FROM pasajeros WHERE rut = '123-4' AND cliente_corporativo_id = 'c0000000-0000-0000-0000-000000000000')::integer,
    1,
    'Passenger A created correctly for Empresa A'
);

-- TEST 3: User A tries to import shift with Sede B (from Empresa B)
SELECT throws_ok(
    $$ SELECT import_b2b_shifts('[{"rut": "123-4", "nombre": "Pax A", "direccion": "Dir X", "fecha": "2026-10-10", "hora_entrada": "08:00", "hora_salida": "18:00", "sede_id": "s1111111-1111-1111-1111-111111111111"}]'::JSONB) $$,
    'La sede provista no pertenece a su corporación.',
    'Cannot use sede from another corporate client'
);

-- TEST 4: User B imports shifts to Sede B successfully
SELECT test_set_role('u2000000-0000-0000-0000-000000000000');
SELECT lives_ok(
    $$ SELECT import_b2b_shifts('[{"rut": "567-8", "nombre": "Pax B", "direccion": "Dir Y", "fecha": "2026-10-10", "hora_entrada": "09:00", "hora_salida": "19:00", "sede_id": "s1111111-1111-1111-1111-111111111111"}]'::JSONB) $$,
    'User B can import shifts successfully'
);

-- TEST 5: RLS validation - User B cannot see Passenger A
SELECT is(
    (SELECT count(*) FROM pasajeros)::integer,
    1,
    'User B can only see their own passenger (RLS isolates clients)'
);

-- TEST 6: RLS validation - User B cannot see Turno from User A
SELECT is(
    (SELECT count(*) FROM turnos_pasajeros)::integer,
    1,
    'User B can only see their own shifts (RLS isolates shifts)'
);

ROLLBACK;

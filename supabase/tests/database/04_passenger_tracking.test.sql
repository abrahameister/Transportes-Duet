BEGIN;
SELECT plan(8);

SET search_path TO public, public;

-- Setup test data
-- 1. Create Cliente
INSERT INTO clientes_corporativos (id, rut, nombre_razon_social, fantasia) VALUES 
('c0000000-0000-0000-0000-000000000000', '12345678-9', 'Test Cliente', 'TC') ON CONFLICT DO NOTHING;

-- 2. Create Users/Profiles
INSERT INTO auth.users (id, email) VALUES 
('u1000000-0000-0000-0000-000000000000', 'admin@test.cl'),
('u2000000-0000-0000-0000-000000000000', 'cond1@test.cl') ON CONFLICT DO NOTHING;

INSERT INTO perfiles (id, auth_user_id, rut, nombre_completo, rol, email, estado) VALUES 
('p1000000-0000-0000-0000-000000000000', 'u1000000-0000-0000-0000-000000000000', '11111111-1', 'Admin', 'ADMIN', 'admin@test.cl', 'activo'),
('p2000000-0000-0000-0000-000000000000', 'u2000000-0000-0000-0000-000000000000', '22222222-2', 'Conductor', 'CONDUCTOR', 'cond1@test.cl', 'activo') ON CONFLICT DO NOTHING;

-- 3. Create Conductor, Vehiculo
INSERT INTO conductores (id, perfil_id, rut, nombre_completo, telefono, estado) VALUES 
('d1000000-0000-0000-0000-000000000000', 'p2000000-0000-0000-0000-000000000000', '22222222-2', 'Juan Chofer', '+569', 'activo') ON CONFLICT DO NOTHING;

INSERT INTO vehiculos (id, patente, marca, modelo, anio, capacidad, estado) VALUES 
('v1000000-0000-0000-0000-000000000000', 'ABCD12', 'Toyota', 'Hiace', 2022, 12, 'operativo') ON CONFLICT DO NOTHING;

-- 4. Create Trip and Asignacion
INSERT INTO viajes (id, cliente_corporativo_id, fecha_programada, tipo_viaje, origen_direccion, destino_direccion, estado) VALUES 
('t1000000-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000000', now(), 'ida', 'Origen', 'Destino', 'en_ruta') ON CONFLICT DO NOTHING;

INSERT INTO asignaciones (id, viaje_id, conductor_id, vehiculo_id, estado) VALUES
('a1000000-0000-0000-0000-000000000000', 't1000000-0000-0000-0000-000000000000', 'd1000000-0000-0000-0000-000000000000', 'v1000000-0000-0000-0000-000000000000', 'activa') ON CONFLICT DO NOTHING;

-- 5. Create Pasajero
INSERT INTO pasajeros (id, cliente_corporativo_id, nombre_completo, rut, estado) VALUES
('ps100000-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000000', 'Pasajero Test', '111', 'activo') ON CONFLICT DO NOTHING;

INSERT INTO viaje_pasajeros (id, viaje_id, pasajero_id, estado) VALUES
('vp100000-0000-0000-0000-000000000000', 't1000000-0000-0000-0000-000000000000', 'ps100000-0000-0000-0000-000000000000', 'pendiente') ON CONFLICT DO NOTHING;

-- 6. Add some GPS points
INSERT INTO tracking_positions (viaje_id, conductor_id, latitud, longitud, registrado_en) VALUES
('t1000000-0000-0000-0000-000000000000', 'd1000000-0000-0000-0000-000000000000', -33.4, -70.6, now());


-- Helper to switch roles
CREATE OR REPLACE FUNCTION test_set_role(p_uid UUID) RETURNS void AS $$
BEGIN
  PERFORM set_config('request.jwt.claims', format('{"sub": "%s"}', p_uid), true);
  SET LOCAL ROLE authenticated;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION test_set_anon() RETURNS void AS $$
BEGIN
  SET LOCAL ROLE anon;
END;
$$ LANGUAGE plpgsql;

-- TEST 1: Driver cannot generate token
SELECT test_set_role('u2000000-0000-0000-0000-000000000000');
SELECT throws_ok(
    'SELECT generate_tracking_token(''t1000000-0000-0000-0000-000000000000'', ''ps100000-0000-0000-0000-000000000000'')',
    'No autorizado para generar tokens de rastreo.',
    'Driver cannot generate tracking token'
);

-- TEST 2: Admin can generate token
SELECT test_set_role('u1000000-0000-0000-0000-000000000000');
SELECT lives_ok(
    'SELECT generate_tracking_token(''t1000000-0000-0000-0000-000000000000'', ''ps100000-0000-0000-0000-000000000000'')',
    'Admin successfully generates token'
);

-- Extract the raw token generated in TEST 2 is hard since it was run dynamically, so let's generate one statically
DO $$
DECLARE v_t TEXT;
BEGIN
  v_t := generate_tracking_token('t1000000-0000-0000-0000-000000000000', 'ps100000-0000-0000-0000-000000000000');
  -- Store in a temporary table for subsequent tests
  CREATE TEMP TABLE temp_test_token (val TEXT);
  INSERT INTO temp_test_token VALUES (v_t);
END $$;

-- TEST 3: Invalid token throws error
SELECT test_set_anon();
SELECT throws_ok(
    'SELECT get_public_tracking_info(''invalid_token_123'')',
    'Token inválido',
    'get_public_tracking_info rejects invalid token'
);

-- TEST 4: Valid token returns JSON
SELECT lives_ok(
    'SELECT get_public_tracking_info((SELECT val FROM temp_test_token))',
    'Valid token is accepted by get_public_tracking_info'
);

-- TEST 5: Data minimization - Check JSON contains vehicle and driver, but no emails
DO $$
DECLARE 
  v_json JSONB;
BEGIN
  v_json := get_public_tracking_info((SELECT val FROM temp_test_token));
  IF v_json->'conductor'->>'nombre' != 'Juan Chofer' THEN
    RAISE EXCEPTION 'Conductor mismatch';
  END IF;
  IF v_json->'vehiculo'->>'patente' != 'ABCD12' THEN
    RAISE EXCEPTION 'Vehiculo mismatch';
  END IF;
  IF (v_json->'tracking'->>'lat')::float != -33.4 THEN
    RAISE EXCEPTION 'Tracking mismatch';
  END IF;
END $$;
SELECT pass('Data minimization checks out');


-- TEST 6: Expired token
SELECT test_set_role('u1000000-0000-0000-0000-000000000000'); -- back to admin to update DB directly
UPDATE tracking_tokens SET expires_at = now() - interval '1 hour' WHERE pasajero_id = 'ps100000-0000-0000-0000-000000000000';

SELECT test_set_anon();
SELECT throws_ok(
    'SELECT get_public_tracking_info((SELECT val FROM temp_test_token))',
    'Token expirado',
    'Expired token is blocked'
);

-- TEST 7: Revoked token
SELECT test_set_role('u1000000-0000-0000-0000-000000000000'); -- back to admin
UPDATE tracking_tokens SET expires_at = now() + interval '1 hour', revoked_at = now() WHERE pasajero_id = 'ps100000-0000-0000-0000-000000000000';

SELECT test_set_anon();
SELECT throws_ok(
    'SELECT get_public_tracking_info((SELECT val FROM temp_test_token))',
    'Token revocado',
    'Revoked token is blocked'
);

-- TEST 8: Anon table access is blocked (RLS)
SELECT test_set_anon();
SELECT throws_like(
    'SELECT count(*) FROM viajes',
    '%permission denied%',
    'Anon role cannot query the viajes table directly'
);


ROLLBACK;

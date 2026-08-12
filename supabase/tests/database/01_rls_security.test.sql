BEGIN;
SELECT plan(13);

-- Setup fake auth users
INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@test.com'),
  ('00000000-0000-0000-0000-000000000002', 'b2b1@test.com'),
  ('00000000-0000-0000-0000-000000000003', 'b2b2@test.com'),
  ('00000000-0000-0000-0000-000000000004', 'driver1@test.com'),
  ('00000000-0000-0000-0000-000000000005', 'driver2@test.com');

-- The trigger created perfiles as 'inactivo' and 'CONDUCTOR'.
-- Let's update them to be exactly what we need (only an ADMIN could do this, or we do it as superuser in the test setup).
UPDATE perfiles SET rol = 'ADMIN', estado = 'activo' WHERE email = 'admin@test.com';
UPDATE perfiles SET rol = 'CLIENTE_B2B', estado = 'activo' WHERE email = 'b2b1@test.com';
UPDATE perfiles SET rol = 'CLIENTE_B2B', estado = 'activo' WHERE email = 'b2b2@test.com';
UPDATE perfiles SET rol = 'CONDUCTOR', estado = 'activo' WHERE email = 'driver1@test.com';
UPDATE perfiles SET rol = 'CONDUCTOR', estado = 'activo' WHERE email = 'driver2@test.com';

-- 1. ROLE ESCALATION MUST FAIL
-- Si me logueo como driver, no puedo cambiar mi rol
SET local role authenticated;
SELECT set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-000000000004"}', true);
SELECT throws_ok(
    'UPDATE perfiles SET rol = ''ADMIN'' WHERE email = ''driver1@test.com''',
    'new row violates row-level security policy',
    'Conductor no puede escalar privilegios'
);

-- Back to postgres for setup
RESET ROLE;
-- Add clients
INSERT INTO clientes_corporativos (id, nombre_fantasia, razon_social, rut) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Client 1', 'Client 1', '11'),
  ('22222222-2222-2222-2222-222222222222', 'Client 2', 'Client 2', '22');

INSERT INTO usuarios_cliente_b2b (perfil_id, cliente_corporativo_id) VALUES
  ((SELECT id FROM perfiles WHERE email = 'b2b1@test.com'), '11111111-1111-1111-1111-111111111111'),
  ((SELECT id FROM perfiles WHERE email = 'b2b2@test.com'), '22222222-2222-2222-2222-222222222222');

INSERT INTO pasajeros (id, cliente_corporativo_id, nombre_completo, rut) VALUES
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Pasajero C1', 'P1'),
  ('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'Pasajero C2', 'P2');

-- 2. CLIENT A CANNOT SELECT CLIENT B PASSENGER
SET local role authenticated;
SELECT set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-000000000002"}', true);
SELECT is(
    (SELECT COUNT(*) FROM pasajeros),
    1::bigint,
    'B2B1 solo ve sus propios pasajeros'
);
SELECT is(
    (SELECT nombre_completo FROM pasajeros LIMIT 1),
    'Pasajero C1',
    'B2B1 solo ve a Pasajero C1'
);

-- 3. CLIENT A CANNOT INSERT PASSENGER FOR CLIENT B
SELECT throws_ok(
    'INSERT INTO pasajeros (cliente_corporativo_id, nombre_completo, rut) VALUES (''22222222-2222-2222-2222-222222222222'', ''Hacker'', ''H1'')',
    'new row violates row-level security policy for table "pasajeros"',
    'B2B1 no puede insertar en B2B2'
);

-- 4. CLIENT A CANNOT UPDATE cliente_corporativo_id TO CLIENT B
SELECT throws_ok(
    'UPDATE pasajeros SET cliente_corporativo_id = ''22222222-2222-2222-2222-222222222222'' WHERE rut = ''P1''',
    'new row violates row-level security policy for table "pasajeros"',
    'B2B1 no puede traspasar pasajeros a B2B2'
);

-- Setup Driver data
RESET ROLE;
INSERT INTO conductores (id, perfil_id, rut, nombre_completo, telefono) VALUES
  ('55555555-5555-5555-5555-555555555555', (SELECT id FROM perfiles WHERE email = 'driver1@test.com'), 'D1', 'D1', '1'),
  ('66666666-6666-6666-6666-666666666666', (SELECT id FROM perfiles WHERE email = 'driver2@test.com'), 'D2', 'D2', '2');
INSERT INTO vehiculos (id, patente, marca, modelo, anio, capacidad) VALUES
  ('77777777-7777-7777-7777-777777777777', 'V1', 'V', 'V', 2023, 10);
INSERT INTO viajes (id, cliente_corporativo_id, fecha_programada, tipo_viaje, origen_direccion, destino_direccion) VALUES
  ('88888888-8888-8888-8888-888888888888', '11111111-1111-1111-1111-111111111111', now(), 'ida', 'O1', 'D1'),
  ('99999999-9999-9999-9999-999999999999', '22222222-2222-2222-2222-222222222222', now(), 'ida', 'O2', 'D2');
-- Assign D1 to Trip 1, D2 to Trip 2
INSERT INTO asignaciones (viaje_id, conductor_id, vehiculo_id) VALUES
  ('88888888-8888-8888-8888-888888888888', '55555555-5555-5555-5555-555555555555', '77777777-7777-7777-7777-777777777777'),
  ('99999999-9999-9999-9999-999999999999', '66666666-6666-6666-6666-666666666666', '77777777-7777-7777-7777-777777777777');
INSERT INTO tracking_positions (id, viaje_id, conductor_id, latitud, longitud, registrado_en) VALUES
  (gen_random_uuid(), '88888888-8888-8888-8888-888888888888', '55555555-5555-5555-5555-555555555555', 0, 0, now());

-- 5. DRIVER A CANNOT SEE DRIVER B TRIP
SET local role authenticated;
SELECT set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-000000000004"}', true);
SELECT is(
    (SELECT COUNT(*) FROM viajes),
    1::bigint,
    'Driver 1 solo ve 1 viaje'
);
SELECT is(
    (SELECT id FROM viajes LIMIT 1),
    '88888888-8888-8888-8888-888888888888'::uuid,
    'Driver 1 ve el viaje correcto'
);

-- 6. DRIVER CANNOT ACCESS clientes_corporativos
SELECT is(
    (SELECT COUNT(*) FROM clientes_corporativos),
    0::bigint,
    'Conductor no puede leer clientes corporativos'
);

-- 7. DRIVER CANNOT MODIFY HISTORICAL GPS
SELECT throws_ok(
    'UPDATE tracking_positions SET latitud = 99',
    'new row violates row-level security policy for table "tracking_positions"',
    'Driver no puede actualizar posiciones GPS'
);
SELECT throws_ok(
    'DELETE FROM tracking_positions',
    'new row violates row-level security policy for table "tracking_positions"',
    'Driver no puede borrar posiciones GPS'
);

-- 8. UNAUTHORIZED USER CANNOT READ AUDIT
SELECT is(
    (SELECT COUNT(*) FROM auditoria),
    0::bigint,
    'Driver no puede leer auditoría'
);

-- 9. ANON ISOLATION
SET local role anon;
SELECT set_config('request.jwt.claims', '', true);
SELECT is(
    (SELECT COUNT(*) FROM viajes),
    0::bigint,
    'Anon no puede ver viajes directamente'
);
SELECT is(
    (SELECT COUNT(*) FROM pasajeros),
    0::bigint,
    'Anon no puede ver pasajeros directamente'
);
SELECT is(
    (SELECT COUNT(*) FROM tracking_tokens),
    0::bigint,
    'Anon no puede ver tokens directamente'
);

SELECT * FROM finish();
ROLLBACK;

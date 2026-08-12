-- Seeds for Transportes Duet (DEV/DEMO)

-- Limpiar dependencias
-- Este script se correrá después del schema (en un db reset).

INSERT INTO perfiles (id, email, nombre_completo, rol) VALUES
('11111111-1111-1111-1111-111111111111', 'admin@duet.cl', 'Admin Duet', 'ADMIN'),
('22222222-2222-2222-2222-222222222222', 'operaciones@duet.cl', 'Operaciones Duet', 'OPERACIONES');

INSERT INTO clientes_corporativos (id, nombre_fantasia, razon_social, rut) VALUES
('33333333-3333-3333-3333-333333333333', 'Clinica Biobío', 'Servicios Médicos Biobío SpA', '76.123.456-7');

INSERT INTO sedes (id, cliente_corporativo_id, nombre, direccion) VALUES
('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'Sede Central', 'Av. Alessandri 2000, Concepción');

INSERT INTO pasajeros (id, cliente_corporativo_id, sede_id, nombre_completo, rut, telefono) VALUES
('55555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'Juan Pérez', '19.123.456-7', '+56912345678');

INSERT INTO conductores (id, rut, nombre_completo, telefono, tipo_licencia) VALUES
('66666666-6666-6666-6666-666666666666', '12.345.678-9', 'Pedro Chofer', '+56987654321', 'A3');

INSERT INTO vehiculos (id, patente, marca, modelo, anio, capacidad) VALUES
('77777777-7777-7777-7777-777777777777', 'ABCD-12', 'Mercedes', 'Sprinter', 2023, 19);

INSERT INTO viajes (id, cliente_corporativo_id, sede_id, fecha_programada, tipo_viaje, estado, origen_direccion, destino_direccion) VALUES
('88888888-8888-8888-8888-888888888888', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', '2026-08-15 08:00:00-04', 'ida', 'solicitado', 'Av. Costanera 100', 'Av. Alessandri 2000');

INSERT INTO viaje_pasajeros (viaje_id, pasajero_id, estado) VALUES
('88888888-8888-8888-8888-888888888888', '55555555-5555-5555-5555-555555555555', 'pendiente');

INSERT INTO asignaciones (viaje_id, conductor_id, vehiculo_id) VALUES
('88888888-8888-8888-8888-888888888888', '66666666-6666-6666-6666-666666666666', '77777777-7777-7777-7777-777777777777');

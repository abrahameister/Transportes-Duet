-- SPRINT 8: ROUTE PLANNING

-- 1. Modificar viaje_pasajeros para persistir el orden y ubicación de las paradas
ALTER TABLE viaje_pasajeros 
ADD COLUMN direccion_parada TEXT,
ADD COLUMN latitud_parada DOUBLE PRECISION,
ADD COLUMN longitud_parada DOUBLE PRECISION;

-- 2. RPC create_planned_trips
-- Recibe un JSONB con las rutas planeadas y aprobadas por Operaciones.
-- Formato esperado por ruta:
-- {
--   "sede_id": "uuid",
--   "fecha_programada": "2026-08-15T08:00:00Z",
--   "tipo_viaje": "ida",
--   "origen_direccion": "Origen",
--   "destino_direccion": "Destino",
--   "vehiculo_id": "uuid",
--   "conductor_id": "uuid",
--   "pasajeros": [
--     {
--       "turno_id": "uuid",
--       "pasajero_id": "uuid",
--       "orden": 1,
--       "direccion": "Dir",
--       "lat": -36.0,
--       "lng": -73.0
--     }
--   ]
-- }

CREATE OR REPLACE FUNCTION create_planned_trips(p_rutas JSONB)
RETURNS JSONB AS $$
DECLARE
    v_rol TEXT;
    v_ruta JSONB;
    v_pasajero JSONB;
    v_viaje_id UUID;
    v_cliente_id UUID;
    v_vehiculo RECORD;
    v_conductor RECORD;
    v_turno_estado TEXT;
    v_count INT := 0;
BEGIN
    -- 1. Validar autorización
    v_rol := get_auth_rol();
    IF v_rol NOT IN ('ADMIN', 'OPERACIONES') THEN
        RAISE EXCEPTION 'Acceso denegado. Solo ADMIN u OPERACIONES pueden confirmar planificación.';
    END IF;

    -- 2. Iterar sobre las rutas propuestas
    FOR v_ruta IN SELECT * FROM jsonb_array_elements(p_rutas)
    LOOP
        -- Validar capacidad del vehículo
        SELECT * INTO v_vehiculo FROM vehiculos WHERE id = (v_ruta->>'vehiculo_id')::UUID;
        IF NOT FOUND OR v_vehiculo.estado != 'operativo' THEN
            RAISE EXCEPTION 'El vehículo % no está operativo o no existe.', (v_ruta->>'vehiculo_id');
        END IF;

        IF jsonb_array_length(v_ruta->'pasajeros') > v_vehiculo.capacidad THEN
            RAISE EXCEPTION 'Capacidad excedida para el vehículo % (Capacidad: %, Pasajeros: %)', v_vehiculo.patente, v_vehiculo.capacidad, jsonb_array_length(v_ruta->'pasajeros');
        END IF;

        -- Validar conductor
        SELECT * INTO v_conductor FROM conductores WHERE id = (v_ruta->>'conductor_id')::UUID;
        IF NOT FOUND OR v_conductor.estado != 'activo' THEN
            RAISE EXCEPTION 'El conductor % no está activo o no existe.', (v_ruta->>'conductor_id');
        END IF;

        -- Obtener el cliente_id desde el primer turno
        SELECT cliente_corporativo_id INTO v_cliente_id 
        FROM turnos_pasajeros 
        WHERE id = (v_ruta->'pasajeros'->0->>'turno_id')::UUID;

        -- 3. Crear el Viaje
        INSERT INTO viajes (
            cliente_corporativo_id,
            sede_id,
            fecha_programada,
            tipo_viaje,
            estado,
            origen_direccion,
            destino_direccion
        ) VALUES (
            v_cliente_id,
            (v_ruta->>'sede_id')::UUID,
            (v_ruta->>'fecha_programada')::TIMESTAMP WITH TIME ZONE,
            v_ruta->>'tipo_viaje',
            'asignado',
            v_ruta->>'origen_direccion',
            v_ruta->>'destino_direccion'
        ) RETURNING id INTO v_viaje_id;

        -- 4. Crear Asignación
        INSERT INTO asignaciones (
            viaje_id,
            conductor_id,
            vehiculo_id,
            estado
        ) VALUES (
            v_viaje_id,
            v_conductor.id,
            v_vehiculo.id,
            'activa'
        );

        -- 5. Iterar sobre los pasajeros
        FOR v_pasajero IN SELECT * FROM jsonb_array_elements(v_ruta->'pasajeros')
        LOOP
            -- Validar que el turno sigue disponible y no ha sido planificado antes
            SELECT estado INTO v_turno_estado FROM turnos_pasajeros WHERE id = (v_pasajero->>'turno_id')::UUID FOR UPDATE;
            IF v_turno_estado != 'programado' THEN
                RAISE EXCEPTION 'El turno % ya no está disponible (Estado: %).', (v_pasajero->>'turno_id'), v_turno_estado;
            END IF;

            -- Actualizar el turno
            UPDATE turnos_pasajeros SET estado = 'asignado' WHERE id = (v_pasajero->>'turno_id')::UUID;

            -- Crear registro en el manifiesto (viaje_pasajeros) con el orden de paradas
            INSERT INTO viaje_pasajeros (
                viaje_id,
                pasajero_id,
                estado,
                orden_parada,
                direccion_parada,
                latitud_parada,
                longitud_parada
            ) VALUES (
                v_viaje_id,
                (v_pasajero->>'pasajero_id')::UUID,
                'pendiente',
                (v_pasajero->>'orden')::INTEGER,
                v_pasajero->>'direccion',
                (v_pasajero->>'lat')::DOUBLE PRECISION,
                (v_pasajero->>'lng')::DOUBLE PRECISION
            );
        END LOOP;

        v_count := v_count + 1;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'rutas_creadas', v_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Revocar acceso público a la RPC
REVOKE ALL ON FUNCTION create_planned_trips(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_planned_trips(JSONB) TO authenticated;

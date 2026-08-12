-- SPRINT 5: DRIVER OPERATIONS & OFFLINE QUEUE

-- 1. Abordar Pasajero (board_passenger)
-- Rol: CONDUCTOR ASIGNADO
-- Tolerante a repeticiones: si el pasajero ya tiene el estado solicitado, retorna sin error (Idempotencia Implícita).
CREATE OR REPLACE FUNCTION board_passenger(
    p_viaje_id UUID,
    p_pasajero_id UUID,
    p_estado TEXT
) RETURNS VOID AS $$
DECLARE
    v_estado_actual TEXT;
BEGIN
    IF get_auth_rol() != 'CONDUCTOR' THEN
        RAISE EXCEPTION 'Solo un conductor puede realizar esta acción.';
    END IF;

    -- Validar que el conductor esté asignado al viaje
    IF NOT EXISTS (
        SELECT 1 FROM asignaciones 
        WHERE viaje_id = p_viaje_id 
          AND conductor_id = get_auth_conductor_id() 
          AND estado = 'activa'
    ) THEN
        RAISE EXCEPTION 'No estás asignado a este viaje.';
    END IF;

    -- Validar estado requerido
    IF p_estado NOT IN ('abordado', 'no_show') THEN
        RAISE EXCEPTION 'Estado inválido para el pasajero.';
    END IF;

    -- Bloquear fila y leer estado actual
    SELECT estado INTO v_estado_actual 
    FROM viaje_pasajeros 
    WHERE viaje_id = p_viaje_id AND pasajero_id = p_pasajero_id 
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pasajero no pertenece a este viaje.';
    END IF;

    -- Idempotencia: Si ya está en ese estado, salir sin fallar ni duplicar eventos
    IF v_estado_actual = p_estado THEN
        RETURN;
    END IF;

    -- Actualizar estado del pasajero
    UPDATE viaje_pasajeros 
    SET estado = p_estado, 
        hora_abordaje = CASE WHEN p_estado = 'abordado' THEN now() ELSE hora_abordaje END,
        updated_at = now()
    WHERE viaje_id = p_viaje_id AND pasajero_id = p_pasajero_id;

    -- Registrar evento en la bitácora del viaje
    PERFORM log_trip_event(
        p_viaje_id, 
        v_estado_actual, 
        p_estado, 
        'Pasajero ' || p_pasajero_id || ' marcado como ' || p_estado
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- 2. Sincronizar GPS Batch (sync_gps_positions)
-- Rol: CONDUCTOR ASIGNADO
-- Recibe un array JSONB con puntos GPS y los inserta de forma atómica.
-- Formato esperado: [{"lat": -36.8, "lng": -73.0, "spd": 45, "acc": 10, "ts": "2026-08-12T..."}]
CREATE OR REPLACE FUNCTION sync_gps_positions(
    p_viaje_id UUID,
    p_posiciones JSONB
) RETURNS VOID AS $$
DECLARE
    v_conductor_id UUID;
    v_estado_viaje TEXT;
    v_pos JSONB;
BEGIN
    IF get_auth_rol() != 'CONDUCTOR' THEN
        RAISE EXCEPTION 'Solo un conductor puede realizar esta acción.';
    END IF;

    v_conductor_id := get_auth_conductor_id();

    -- Validar que el conductor esté asignado al viaje
    IF NOT EXISTS (
        SELECT 1 FROM asignaciones 
        WHERE viaje_id = p_viaje_id 
          AND conductor_id = v_conductor_id 
          AND estado = 'activa'
    ) THEN
        RAISE EXCEPTION 'No estás asignado a este viaje.';
    END IF;

    -- Validar estado del viaje (opcional: solo permitir si no está finalizado/cancelado)
    SELECT estado INTO v_estado_viaje FROM viajes WHERE id = p_viaje_id;
    IF v_estado_viaje IN ('finalizado', 'cancelado') THEN
        -- Retornar silente para que la cola offline asuma que se procesó (no podemos registrar más GPS)
        -- o borrar la cola en el cliente. Usaremos retorno silente.
        RETURN;
    END IF;

    -- Validar tamaño razonable para evitar abusos (max 1000 puntos por batch)
    IF jsonb_array_length(p_posiciones) > 1000 THEN
        RAISE EXCEPTION 'El lote de puntos GPS excede el límite permitido (1000).';
    END IF;

    -- Insertar posiciones
    FOR v_pos IN SELECT * FROM jsonb_array_elements(p_posiciones)
    LOOP
        -- Se extraen los valores validando los tipos implicitamente al castear
        IF (v_pos->>'lat') IS NOT NULL AND (v_pos->>'lng') IS NOT NULL AND (v_pos->>'ts') IS NOT NULL THEN
            INSERT INTO tracking_positions (
                viaje_id,
                conductor_id,
                latitud,
                longitud,
                velocidad,
                precision,
                registrado_en
            ) VALUES (
                p_viaje_id,
                v_conductor_id,
                (v_pos->>'lat')::DOUBLE PRECISION,
                (v_pos->>'lng')::DOUBLE PRECISION,
                (v_pos->>'spd')::DOUBLE PRECISION,
                (v_pos->>'acc')::DOUBLE PRECISION,
                (v_pos->>'ts')::TIMESTAMP WITH TIME ZONE
            );
        END IF;
    END LOOP;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Revoke permissions to avoid PUBLIC access
REVOKE EXECUTE ON FUNCTION board_passenger(UUID, UUID, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION sync_gps_positions(UUID, JSONB) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION board_passenger(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_gps_positions(UUID, JSONB) TO authenticated;

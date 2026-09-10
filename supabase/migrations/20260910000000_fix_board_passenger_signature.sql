-- FIX: Alinear firma de board_passenger con el frontend
-- El frontend pasa p_viaje_pasajero_id (UUID de viaje_pasajeros.id)
-- La funcion anterior esperaba p_viaje_id + p_pasajero_id (dos UUIDs separados)
-- Esta migracion reemplaza la funcion por una que acepta el ID de la fila directamente.

-- Eliminar funcion antigua (firma distinta, no se sobreescribe con CREATE OR REPLACE)
DROP FUNCTION IF EXISTS board_passenger(UUID, UUID, TEXT);

-- Nueva funcion con firma alineada al frontend
CREATE OR REPLACE FUNCTION board_passenger(
    p_viaje_pasajero_id UUID,
    p_estado TEXT
) RETURNS VOID AS $$
DECLARE
    v_viaje_id      UUID;
    v_pasajero_id   UUID;
    v_estado_actual TEXT;
BEGIN
    -- Solo conductores autenticados
    IF get_auth_rol() != 'CONDUCTOR' THEN
        RAISE EXCEPTION 'Solo un conductor puede realizar esta accion.';
    END IF;

    -- Validar estado permitido
    IF p_estado NOT IN ('abordado', 'no_show') THEN
        RAISE EXCEPTION 'Estado invalido para el pasajero: %', p_estado;
    END IF;

    -- Obtener viaje_id y pasajero_id desde la fila de viaje_pasajeros (con lock)
    SELECT viaje_id, pasajero_id, estado
    INTO v_viaje_id, v_pasajero_id, v_estado_actual
    FROM viaje_pasajeros
    WHERE id = p_viaje_pasajero_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Registro de pasajero en viaje no encontrado.';
    END IF;

    -- Validar que el conductor autenticado este asignado a ese viaje
    IF NOT EXISTS (
        SELECT 1 FROM asignaciones
        WHERE viaje_id = v_viaje_id
          AND conductor_id = get_auth_conductor_id()
          AND estado = 'activa'
    ) THEN
        RAISE EXCEPTION 'No estas asignado a este viaje.';
    END IF;

    -- Idempotencia: si ya tiene el estado solicitado, retorna sin error
    IF v_estado_actual = p_estado THEN
        RETURN;
    END IF;

    -- Actualizar estado del pasajero en el viaje
    UPDATE viaje_pasajeros
    SET estado        = p_estado,
        hora_abordaje = CASE WHEN p_estado = 'abordado' THEN now() ELSE hora_abordaje END,
        updated_at    = now()
    WHERE id = p_viaje_pasajero_id;

    -- Registrar evento en bitacora del viaje
    PERFORM log_trip_event(
        v_viaje_id,
        v_estado_actual,
        p_estado,
        'Pasajero ' || v_pasajero_id || ' marcado como ' || p_estado
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Permisos
REVOKE EXECUTE ON FUNCTION board_passenger(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION board_passenger(UUID, TEXT) TO authenticated;
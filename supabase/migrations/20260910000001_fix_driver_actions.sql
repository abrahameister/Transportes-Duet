-- FIX: Permitir estado 'pendiente' en board_passenger para revertir abordaje
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

    -- Validar estado permitido (incluyendo pendiente para revertir)
    IF p_estado NOT IN ('abordado', 'no_show', 'pendiente') THEN
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
        hora_abordaje = CASE WHEN p_estado = 'abordado' THEN now() WHEN p_estado = 'pendiente' THEN NULL ELSE hora_abordaje END,
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

REVOKE EXECUTE ON FUNCTION board_passenger(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION board_passenger(UUID, TEXT) TO authenticated;

-- FIX: Permitir finalizar viaje directamente desde despachado, en_camino, en_punto, abordando o en_ruta
CREATE OR REPLACE FUNCTION trip_finish(p_viaje_id UUID) RETURNS VOID AS $$
DECLARE
    v_estado_actual TEXT;
BEGIN
    IF get_auth_rol() != 'CONDUCTOR' THEN RAISE EXCEPTION 'Solo un conductor puede realizar esta acción.'; END IF;
    IF NOT EXISTS (SELECT 1 FROM asignaciones WHERE viaje_id = p_viaje_id AND conductor_id = get_auth_conductor_id() AND estado = 'activa') THEN
        RAISE EXCEPTION 'No estás asignado a este viaje.';
    END IF;

    SELECT estado INTO v_estado_actual FROM viajes WHERE id = p_viaje_id FOR UPDATE;
    IF v_estado_actual IN ('finalizado', 'cancelado') THEN
        IF v_estado_actual = 'finalizado' THEN RETURN; END IF;
        RAISE EXCEPTION 'Transición inválida desde %.', v_estado_actual;
    END IF;

    UPDATE viajes SET estado = 'finalizado', updated_at = now() WHERE id = p_viaje_id;
    PERFORM log_trip_event(p_viaje_id, v_estado_actual, 'finalizado');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION trip_finish(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION trip_finish(UUID) TO authenticated;

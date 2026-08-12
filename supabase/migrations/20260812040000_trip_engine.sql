-- SPRINT 4: TRIP ENGINE BASE (MÁQUINA DE ESTADOS)

-- Función interna auxiliar para insertar el evento atómicamente
CREATE OR REPLACE FUNCTION log_trip_event(
    p_viaje_id UUID,
    p_estado_anterior TEXT,
    p_estado_nuevo TEXT,
    p_notas TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO eventos_viaje (viaje_id, estado_anterior, estado_nuevo, generado_por_perfil_id, notas)
    VALUES (p_viaje_id, p_estado_anterior, p_estado_nuevo, get_auth_perfil_id(), p_notas);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 1. Asignar Viaje (trip_assign)
-- Rol: ADMIN / OPERACIONES / DISPATCHER
CREATE OR REPLACE FUNCTION trip_assign(
    p_viaje_id UUID,
    p_conductor_id UUID,
    p_vehiculo_id UUID
) RETURNS VOID AS $$
DECLARE
    v_estado_actual TEXT;
BEGIN
    IF get_auth_rol() NOT IN ('ADMIN', 'OPERACIONES', 'DISPATCHER') THEN
        RAISE EXCEPTION 'No autorizado para asignar viajes.';
    END IF;

    SELECT estado INTO v_estado_actual FROM viajes WHERE id = p_viaje_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Viaje no encontrado.'; END IF;
    
    IF v_estado_actual NOT IN ('solicitado', 'validado') THEN
        RAISE EXCEPTION 'Transición inválida. El viaje está en estado %.', v_estado_actual;
    END IF;

    -- Validar existencia conductor y vehiculo
    IF NOT EXISTS (SELECT 1 FROM conductores WHERE id = p_conductor_id AND estado = 'activo') THEN
        RAISE EXCEPTION 'Conductor inválido o inactivo.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM vehiculos WHERE id = p_vehiculo_id AND estado = 'operativo') THEN
        RAISE EXCEPTION 'Vehículo inválido o no operativo.';
    END IF;

    -- Upsert asignacion
    INSERT INTO asignaciones (viaje_id, conductor_id, vehiculo_id, estado)
    VALUES (p_viaje_id, p_conductor_id, p_vehiculo_id, 'activa')
    ON CONFLICT (id) DO UPDATE SET conductor_id = p_conductor_id, vehiculo_id = p_vehiculo_id, updated_at = now();

    UPDATE viajes SET estado = 'asignado', updated_at = now() WHERE id = p_viaje_id;
    
    PERFORM log_trip_event(p_viaje_id, v_estado_actual, 'asignado');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Despachar Viaje (trip_dispatch)
-- Rol: ADMIN / OPERACIONES / DISPATCHER
CREATE OR REPLACE FUNCTION trip_dispatch(p_viaje_id UUID) RETURNS VOID AS $$
DECLARE
    v_estado_actual TEXT;
BEGIN
    IF get_auth_rol() NOT IN ('ADMIN', 'OPERACIONES', 'DISPATCHER') THEN
        RAISE EXCEPTION 'No autorizado para despachar viajes.';
    END IF;

    SELECT estado INTO v_estado_actual FROM viajes WHERE id = p_viaje_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Viaje no encontrado.'; END IF;
    
    IF v_estado_actual != 'asignado' THEN
        IF v_estado_actual = 'despachado' THEN RETURN; END IF; -- Idempotencia simple
        RAISE EXCEPTION 'Transición inválida. El viaje está en estado %.', v_estado_actual;
    END IF;

    UPDATE viajes SET estado = 'despachado', updated_at = now() WHERE id = p_viaje_id;
    PERFORM log_trip_event(p_viaje_id, v_estado_actual, 'despachado');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Iniciar Ruta a Punto (trip_start_to_pickup)
-- Rol: CONDUCTOR ASIGNADO
CREATE OR REPLACE FUNCTION trip_start_to_pickup(p_viaje_id UUID) RETURNS VOID AS $$
DECLARE
    v_estado_actual TEXT;
    v_conductor_id UUID;
BEGIN
    IF get_auth_rol() != 'CONDUCTOR' THEN RAISE EXCEPTION 'Solo un conductor puede realizar esta acción.'; END IF;
    v_conductor_id := get_auth_conductor_id();

    IF NOT EXISTS (SELECT 1 FROM asignaciones WHERE viaje_id = p_viaje_id AND conductor_id = v_conductor_id AND estado = 'activa') THEN
        RAISE EXCEPTION 'No estás asignado a este viaje.';
    END IF;

    SELECT estado INTO v_estado_actual FROM viajes WHERE id = p_viaje_id FOR UPDATE;
    
    IF v_estado_actual != 'despachado' THEN
        IF v_estado_actual = 'en_camino' THEN RETURN; END IF;
        RAISE EXCEPTION 'Transición inválida desde %.', v_estado_actual;
    END IF;

    UPDATE viajes SET estado = 'en_camino', updated_at = now() WHERE id = p_viaje_id;
    PERFORM log_trip_event(p_viaje_id, v_estado_actual, 'en_camino');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Llegada a Punto (trip_arrive_pickup)
CREATE OR REPLACE FUNCTION trip_arrive_pickup(p_viaje_id UUID) RETURNS VOID AS $$
DECLARE
    v_estado_actual TEXT;
BEGIN
    IF get_auth_rol() != 'CONDUCTOR' THEN RAISE EXCEPTION 'Solo un conductor puede realizar esta acción.'; END IF;
    IF NOT EXISTS (SELECT 1 FROM asignaciones WHERE viaje_id = p_viaje_id AND conductor_id = get_auth_conductor_id() AND estado = 'activa') THEN
        RAISE EXCEPTION 'No estás asignado a este viaje.';
    END IF;

    SELECT estado INTO v_estado_actual FROM viajes WHERE id = p_viaje_id FOR UPDATE;
    IF v_estado_actual != 'en_camino' THEN
        IF v_estado_actual = 'en_punto' THEN RETURN; END IF;
        RAISE EXCEPTION 'Transición inválida desde %.', v_estado_actual;
    END IF;

    UPDATE viajes SET estado = 'en_punto', updated_at = now() WHERE id = p_viaje_id;
    PERFORM log_trip_event(p_viaje_id, v_estado_actual, 'en_punto');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Iniciar Abordaje (trip_start_boarding)
CREATE OR REPLACE FUNCTION trip_start_boarding(p_viaje_id UUID) RETURNS VOID AS $$
DECLARE
    v_estado_actual TEXT;
BEGIN
    IF get_auth_rol() != 'CONDUCTOR' THEN RAISE EXCEPTION 'Solo un conductor puede realizar esta acción.'; END IF;
    IF NOT EXISTS (SELECT 1 FROM asignaciones WHERE viaje_id = p_viaje_id AND conductor_id = get_auth_conductor_id() AND estado = 'activa') THEN
        RAISE EXCEPTION 'No estás asignado a este viaje.';
    END IF;

    SELECT estado INTO v_estado_actual FROM viajes WHERE id = p_viaje_id FOR UPDATE;
    IF v_estado_actual NOT IN ('en_punto', 'en_camino') THEN -- Permitimos saltar directo a abordando por flexibilidad real
        IF v_estado_actual = 'abordando' THEN RETURN; END IF;
        RAISE EXCEPTION 'Transición inválida desde %.', v_estado_actual;
    END IF;

    UPDATE viajes SET estado = 'abordando', updated_at = now() WHERE id = p_viaje_id;
    PERFORM log_trip_event(p_viaje_id, v_estado_actual, 'abordando');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. Iniciar Ruta (trip_start_route)
CREATE OR REPLACE FUNCTION trip_start_route(p_viaje_id UUID) RETURNS VOID AS $$
DECLARE
    v_estado_actual TEXT;
BEGIN
    IF get_auth_rol() != 'CONDUCTOR' THEN RAISE EXCEPTION 'Solo un conductor puede realizar esta acción.'; END IF;
    IF NOT EXISTS (SELECT 1 FROM asignaciones WHERE viaje_id = p_viaje_id AND conductor_id = get_auth_conductor_id() AND estado = 'activa') THEN
        RAISE EXCEPTION 'No estás asignado a este viaje.';
    END IF;

    SELECT estado INTO v_estado_actual FROM viajes WHERE id = p_viaje_id FOR UPDATE;
    IF v_estado_actual NOT IN ('abordando', 'en_punto') THEN
        IF v_estado_actual = 'en_ruta' THEN RETURN; END IF;
        RAISE EXCEPTION 'Transición inválida desde %.', v_estado_actual;
    END IF;

    UPDATE viajes SET estado = 'en_ruta', updated_at = now() WHERE id = p_viaje_id;
    PERFORM log_trip_event(p_viaje_id, v_estado_actual, 'en_ruta');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7. Finalizar Viaje (trip_finish)
CREATE OR REPLACE FUNCTION trip_finish(p_viaje_id UUID) RETURNS VOID AS $$
DECLARE
    v_estado_actual TEXT;
BEGIN
    IF get_auth_rol() != 'CONDUCTOR' THEN RAISE EXCEPTION 'Solo un conductor puede realizar esta acción.'; END IF;
    IF NOT EXISTS (SELECT 1 FROM asignaciones WHERE viaje_id = p_viaje_id AND conductor_id = get_auth_conductor_id() AND estado = 'activa') THEN
        RAISE EXCEPTION 'No estás asignado a este viaje.';
    END IF;

    SELECT estado INTO v_estado_actual FROM viajes WHERE id = p_viaje_id FOR UPDATE;
    IF v_estado_actual != 'en_ruta' THEN
        IF v_estado_actual = 'finalizado' THEN RETURN; END IF;
        RAISE EXCEPTION 'Transición inválida desde %.', v_estado_actual;
    END IF;

    UPDATE viajes SET estado = 'finalizado', updated_at = now() WHERE id = p_viaje_id;
    PERFORM log_trip_event(p_viaje_id, v_estado_actual, 'finalizado');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 8. Cancelar Viaje (trip_cancel)
-- Rol: ADMIN / OPERACIONES / DISPATCHER
CREATE OR REPLACE FUNCTION trip_cancel(p_viaje_id UUID, p_motivo TEXT) RETURNS VOID AS $$
DECLARE
    v_estado_actual TEXT;
BEGIN
    IF get_auth_rol() NOT IN ('ADMIN', 'OPERACIONES', 'DISPATCHER') THEN
        RAISE EXCEPTION 'No autorizado para cancelar viajes.';
    END IF;

    SELECT estado INTO v_estado_actual FROM viajes WHERE id = p_viaje_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Viaje no encontrado.'; END IF;
    
    IF v_estado_actual IN ('finalizado', 'cancelado') THEN
        RAISE EXCEPTION 'El viaje ya está en un estado terminal (%).', v_estado_actual;
    END IF;

    UPDATE viajes SET estado = 'cancelado', updated_at = now() WHERE id = p_viaje_id;
    UPDATE asignaciones SET estado = 'cancelada', updated_at = now() WHERE viaje_id = p_viaje_id;
    PERFORM log_trip_event(p_viaje_id, v_estado_actual, 'cancelado', p_motivo);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Revoke permissions to avoid PUBLIC access
REVOKE EXECUTE ON FUNCTION log_trip_event(UUID, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION trip_assign(UUID, UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION trip_dispatch(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION trip_start_to_pickup(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION trip_arrive_pickup(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION trip_start_boarding(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION trip_start_route(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION trip_finish(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION trip_cancel(UUID, TEXT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION trip_assign(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION trip_dispatch(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION trip_start_to_pickup(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION trip_arrive_pickup(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION trip_start_boarding(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION trip_start_route(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION trip_finish(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION trip_cancel(UUID, TEXT) TO authenticated;

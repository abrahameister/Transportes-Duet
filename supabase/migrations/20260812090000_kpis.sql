-- SPRINT 9: KPIs + SLA

-- 1. RPC para Admin KPIs
CREATE OR REPLACE FUNCTION get_admin_kpis()
RETURNS JSONB AS $$
DECLARE
    v_viajes_hoy INT;
    v_viajes_en_curso INT;
    v_viajes_completados INT;
    v_conductores_activos INT;
    v_alertas_activas INT;
BEGIN
    -- Validar que es ADMIN u OPERACIONES
    IF get_auth_rol() NOT IN ('ADMIN', 'OPERACIONES') THEN
        RAISE EXCEPTION 'Acceso denegado. Se requiere rol ADMIN u OPERACIONES.';
    END IF;

    -- Viajes programados para hoy (cualquier estado excepto cancelado)
    SELECT count(*) INTO v_viajes_hoy
    FROM viajes
    WHERE date_trunc('day', fecha_programada AT TIME ZONE 'UTC') = date_trunc('day', now() AT TIME ZONE 'UTC')
      AND estado != 'cancelado';

    -- Viajes en curso
    SELECT count(*) INTO v_viajes_en_curso
    FROM viajes
    WHERE estado IN ('despachado', 'en_camino', 'en_punto', 'abordando', 'en_ruta');

    -- Viajes completados hoy
    SELECT count(*) INTO v_viajes_completados
    FROM viajes
    WHERE estado = 'finalizado'
      AND date_trunc('day', fecha_programada AT TIME ZONE 'UTC') = date_trunc('day', now() AT TIME ZONE 'UTC');

    -- Conductores activos
    SELECT count(*) INTO v_conductores_activos
    FROM conductores
    WHERE estado = 'activo';

    -- Alertas activas
    SELECT count(*) INTO v_alertas_activas
    FROM incidencias
    WHERE estado = 'abierta';

    RETURN jsonb_build_object(
        'viajes_hoy', v_viajes_hoy,
        'viajes_en_curso', v_viajes_en_curso,
        'viajes_completados', v_viajes_completados,
        'conductores_activos', v_conductores_activos,
        'alertas_activas', v_alertas_activas
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION get_admin_kpis() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_admin_kpis() TO authenticated;


-- 2. RPC para B2B KPIs
CREATE OR REPLACE FUNCTION get_b2b_kpis()
RETURNS JSONB AS $$
DECLARE
    v_cliente_id UUID;
    v_total_viajes_mes INT;
    v_viajes_completados_mes INT;
    v_pasajeros_movilizados INT;
    v_no_shows INT;
BEGIN
    v_cliente_id := get_b2b_cliente_id();
    IF v_cliente_id IS NULL THEN
        RAISE EXCEPTION 'Acceso denegado. Usuario no tiene un cliente corporativo asociado.';
    END IF;

    -- Total viajes del mes
    SELECT count(*) INTO v_total_viajes_mes
    FROM viajes
    WHERE cliente_corporativo_id = v_cliente_id
      AND date_trunc('month', fecha_programada AT TIME ZONE 'UTC') = date_trunc('month', now() AT TIME ZONE 'UTC')
      AND estado != 'cancelado';

    -- Viajes completados del mes
    SELECT count(*) INTO v_viajes_completados_mes
    FROM viajes
    WHERE cliente_corporativo_id = v_cliente_id
      AND estado = 'finalizado'
      AND date_trunc('month', fecha_programada AT TIME ZONE 'UTC') = date_trunc('month', now() AT TIME ZONE 'UTC');

    -- Pasajeros movilizados (abordados) en el mes
    SELECT count(vp.id) INTO v_pasajeros_movilizados
    FROM viaje_pasajeros vp
    JOIN viajes v ON v.id = vp.viaje_id
    WHERE v.cliente_corporativo_id = v_cliente_id
      AND date_trunc('month', v.fecha_programada AT TIME ZONE 'UTC') = date_trunc('month', now() AT TIME ZONE 'UTC')
      AND vp.estado = 'abordado';

    -- No shows en el mes
    SELECT count(vp.id) INTO v_no_shows
    FROM viaje_pasajeros vp
    JOIN viajes v ON v.id = vp.viaje_id
    WHERE v.cliente_corporativo_id = v_cliente_id
      AND date_trunc('month', v.fecha_programada AT TIME ZONE 'UTC') = date_trunc('month', now() AT TIME ZONE 'UTC')
      AND vp.estado = 'no_show';

    RETURN jsonb_build_object(
        'total_viajes_mes', v_total_viajes_mes,
        'viajes_completados_mes', v_viajes_completados_mes,
        'pasajeros_movilizados', v_pasajeros_movilizados,
        'no_shows', v_no_shows
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION get_b2b_kpis() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_b2b_kpis() TO authenticated;

-- 3. RPC para que ADMIN consulte KPIs B2B
CREATE OR REPLACE FUNCTION get_admin_b2b_kpis(p_cliente_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_total_viajes_mes INT;
    v_viajes_completados_mes INT;
    v_pasajeros_movilizados INT;
    v_no_shows INT;
BEGIN
    IF get_auth_rol() NOT IN ('ADMIN', 'OPERACIONES') THEN
        RAISE EXCEPTION 'Acceso denegado.';
    END IF;

    SELECT count(*) INTO v_total_viajes_mes FROM viajes WHERE cliente_corporativo_id = p_cliente_id AND date_trunc('month', fecha_programada AT TIME ZONE 'UTC') = date_trunc('month', now() AT TIME ZONE 'UTC') AND estado != 'cancelado';
    SELECT count(*) INTO v_viajes_completados_mes FROM viajes WHERE cliente_corporativo_id = p_cliente_id AND estado = 'finalizado' AND date_trunc('month', fecha_programada AT TIME ZONE 'UTC') = date_trunc('month', now() AT TIME ZONE 'UTC');
    
    SELECT count(vp.id) INTO v_pasajeros_movilizados FROM viaje_pasajeros vp JOIN viajes v ON v.id = vp.viaje_id WHERE v.cliente_corporativo_id = p_cliente_id AND date_trunc('month', v.fecha_programada AT TIME ZONE 'UTC') = date_trunc('month', now() AT TIME ZONE 'UTC') AND vp.estado = 'abordado';
    SELECT count(vp.id) INTO v_no_shows FROM viaje_pasajeros vp JOIN viajes v ON v.id = vp.viaje_id WHERE v.cliente_corporativo_id = p_cliente_id AND date_trunc('month', v.fecha_programada AT TIME ZONE 'UTC') = date_trunc('month', now() AT TIME ZONE 'UTC') AND vp.estado = 'no_show';

    RETURN jsonb_build_object(
        'total_viajes_mes', v_total_viajes_mes,
        'viajes_completados_mes', v_viajes_completados_mes,
        'pasajeros_movilizados', v_pasajeros_movilizados,
        'no_shows', v_no_shows
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION get_admin_b2b_kpis(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_admin_b2b_kpis(UUID) TO authenticated;

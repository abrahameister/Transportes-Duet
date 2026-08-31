ALTER TABLE public.vehiculos DROP CONSTRAINT IF EXISTS vehiculos_estado_check;
ALTER TABLE public.vehiculos ADD CONSTRAINT vehiculos_estado_check CHECK (estado IN ('operativo', 'mantenimiento', 'taller', 'dado_de_baja', 'fuera_de_servicio', 'activo'));

ALTER TABLE public.asignaciones DROP CONSTRAINT IF EXISTS asignaciones_estado_check;
ALTER TABLE public.asignaciones ADD CONSTRAINT asignaciones_estado_check CHECK (estado IN ('activa', 'reemplazada', 'cancelada', 'reasignada'));

CREATE OR REPLACE FUNCTION public.trip_assign(p_viaje_id uuid, p_conductor_id uuid, p_vehiculo_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $$
DECLARE
    v_estado_actual TEXT;
BEGIN
    IF get_auth_rol() NOT IN ('ADMIN', 'OPERACIONES', 'DISPATCHER') THEN
        RAISE EXCEPTION 'No autorizado para asignar viajes.';
    END IF;

    SELECT estado INTO v_estado_actual FROM viajes WHERE id = p_viaje_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Viaje no encontrado.'; END IF;
    
    IF v_estado_actual NOT IN ('solicitado', 'validado', 'asignado', 'despachado') THEN
        RAISE EXCEPTION 'Transición inválida. El viaje está en estado %.', v_estado_actual;
    END IF;

    -- Validar existencia conductor y vehiculo
    IF NOT EXISTS (SELECT 1 FROM conductores WHERE id = p_conductor_id) THEN
        RAISE EXCEPTION 'Conductor no encontrado.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM vehiculos WHERE id = p_vehiculo_id) THEN
        RAISE EXCEPTION 'Vehículo no encontrado.';
    END IF;

    -- Marcar asignaciones previas como reemplazadas
    UPDATE asignaciones 
    SET estado = 'reemplazada', updated_at = now() 
    WHERE viaje_id = p_viaje_id AND estado = 'activa';

    -- Insertar nueva asignación activa
    INSERT INTO asignaciones (viaje_id, conductor_id, vehiculo_id, estado)
    VALUES (p_viaje_id, p_conductor_id, p_vehiculo_id, 'activa');

    -- Si estaba solicitado o validado, pasa a asignado. Si ya estaba despachado, se mantiene despachado.
    IF v_estado_actual IN ('solicitado', 'validado') THEN
        UPDATE viajes SET estado = 'asignado', updated_at = now() WHERE id = p_viaje_id;
        PERFORM log_trip_event(p_viaje_id, v_estado_actual, 'asignado');
    ELSE
        UPDATE viajes SET updated_at = now() WHERE id = p_viaje_id;
        PERFORM log_trip_event(p_viaje_id, v_estado_actual, 'reasignado');
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.trip_dispatch(p_viaje_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $$
DECLARE
    v_estado_actual TEXT;
BEGIN
    IF get_auth_rol() NOT IN ('ADMIN', 'OPERACIONES', 'DISPATCHER') THEN
        RAISE EXCEPTION 'No autorizado para despachar viajes.';
    END IF;

    SELECT estado INTO v_estado_actual FROM viajes WHERE id = p_viaje_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Viaje no encontrado.'; END IF;
    
    IF v_estado_actual = 'despachado' THEN 
        RETURN; 
    END IF;

    IF v_estado_actual NOT IN ('solicitado', 'validado', 'asignado') THEN
        RAISE EXCEPTION 'Transición inválida. El viaje está en estado %.', v_estado_actual;
    END IF;

    UPDATE viajes SET estado = 'despachado', updated_at = now() WHERE id = p_viaje_id;
    PERFORM log_trip_event(p_viaje_id, v_estado_actual, 'despachado');
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_tracking_token(p_viaje_id uuid, p_pasajero_id uuid DEFAULT NULL)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $$
DECLARE
    v_raw_token TEXT;
    v_hash TEXT;
    v_expires_at TIMESTAMP WITH TIME ZONE;
    v_rol TEXT;
    v_effective_pasajero_id UUID := p_pasajero_id;
BEGIN
    v_rol := get_auth_rol();
    IF v_rol NOT IN ('ADMIN', 'OPERACIONES', 'DISPATCHER') THEN
        RAISE EXCEPTION 'No autorizado para generar tokens de rastreo.';
    END IF;

    -- Si no se proveyó pasajero, buscar el primero de viaje_pasajeros
    IF v_effective_pasajero_id IS NULL THEN
        SELECT pasajero_id INTO v_effective_pasajero_id
        FROM viaje_pasajeros
        WHERE viaje_id = p_viaje_id
        LIMIT 1;
    END IF;

    -- Si aún no existe en viaje_pasajeros, buscar o crear uno genérico para este cliente
    IF v_effective_pasajero_id IS NULL THEN
        SELECT p.id INTO v_effective_pasajero_id
        FROM pasajeros p
        JOIN viajes v ON v.cliente_corporativo_id = p.cliente_corporativo_id
        WHERE v.id = p_viaje_id
        LIMIT 1;

        IF v_effective_pasajero_id IS NOT NULL THEN
            INSERT INTO viaje_pasajeros (viaje_id, pasajero_id, estado, orden_parada)
            VALUES (p_viaje_id, v_effective_pasajero_id, 'pendiente', 1)
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;

    IF v_effective_pasajero_id IS NULL THEN
        -- Crear un pasajero por defecto si no existe ninguno
        INSERT INTO pasajeros (cliente_corporativo_id, nombre_completo, rut, telefono, estado)
        SELECT v.cliente_corporativo_id, 'Pasajero Corporativo', '10000000-K', '+56900000000', 'activo'
        FROM viajes v WHERE v.id = p_viaje_id
        RETURNING id INTO v_effective_pasajero_id;

        IF v_effective_pasajero_id IS NOT NULL THEN
            INSERT INTO viaje_pasajeros (viaje_id, pasajero_id, estado, orden_parada)
            VALUES (p_viaje_id, v_effective_pasajero_id, 'pendiente', 1)
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;

    IF v_effective_pasajero_id IS NULL THEN
        RAISE EXCEPTION 'No se pudo vincular un pasajero al viaje.';
    END IF;

    -- Generar token crudo URL-safe
    v_raw_token := replace(gen_random_uuid()::TEXT, '-', '');
    v_hash := encode(extensions.digest(v_raw_token::bytea, 'sha256'), 'hex');
    v_expires_at := now() + interval '24 hours';

    UPDATE tracking_tokens 
    SET revoked_at = now() 
    WHERE viaje_id = p_viaje_id AND pasajero_id = v_effective_pasajero_id AND revoked_at IS NULL;

    INSERT INTO tracking_tokens (token_hash, viaje_id, pasajero_id, expires_at)
    VALUES (v_hash, p_viaje_id, v_effective_pasajero_id, v_expires_at);

    RETURN v_raw_token;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_public_tracking_info(p_raw_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $$
DECLARE
    v_hash TEXT;
    v_token_record tracking_tokens%ROWTYPE;
    v_result JSONB;
BEGIN
    v_hash := encode(extensions.digest(p_raw_token::bytea, 'sha256'), 'hex');

    SELECT * INTO v_token_record 
    FROM tracking_tokens 
    WHERE token_hash = v_hash;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Token inválido';
    END IF;

    IF v_token_record.revoked_at IS NOT NULL THEN
        RAISE EXCEPTION 'Token revocado';
    END IF;

    IF v_token_record.expires_at < now() THEN
        RAISE EXCEPTION 'Token expirado';
    END IF;

    SELECT jsonb_build_object(
        'viaje', (
            SELECT jsonb_build_object(
                'estado', v.estado,
                'fecha_programada', v.fecha_programada,
                'origen_direccion', v.origen_direccion,
                'destino_direccion', v.destino_direccion
            ) FROM viajes v WHERE v.id = v_token_record.viaje_id
        ),
        'conductor', (
            SELECT jsonb_build_object('nombre', c.nombre_completo, 'telefono', c.telefono)
            FROM asignaciones a
            JOIN conductores c ON a.conductor_id = c.id
            WHERE a.viaje_id = v_token_record.viaje_id AND a.estado = 'activa'
            LIMIT 1
        ),
        'vehiculo', (
            SELECT jsonb_build_object('patente', vh.patente, 'marca', vh.marca, 'modelo', vh.modelo, 'color', vh.color)
            FROM asignaciones a
            JOIN vehiculos vh ON a.vehiculo_id = vh.id
            WHERE a.viaje_id = v_token_record.viaje_id AND a.estado = 'activa'
            LIMIT 1
        ),
        'tracking', (
            SELECT jsonb_build_object(
                'lat', tp.latitud,
                'lng', tp.longitud,
                'ts', tp.registrado_en
            )
            FROM tracking_positions tp
            WHERE tp.viaje_id = v_token_record.viaje_id
            ORDER BY tp.registrado_en DESC
            LIMIT 1
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$;

NOTIFY pgrst, 'reload schema';

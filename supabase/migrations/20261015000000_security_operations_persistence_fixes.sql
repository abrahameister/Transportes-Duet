-- ==============================================================================
-- MIGRACION: CORRECCIONES CRITICAS DE SEGURIDAD, OPERACION Y PERSISTENCIA
-- FECHA: 2026-10-15
-- ==============================================================================

-- 1. TABLA clientes_corporativos: PERSISTENCIA DE MATRIZ TARIFARIA
ALTER TABLE public.clientes_corporativos
    ADD COLUMN IF NOT EXISTS tarifa_por_km NUMERIC(10,2) DEFAULT 1500,
    ADD COLUMN IF NOT EXISTS tarifa_minima NUMERIC(10,2) DEFAULT 8000,
    ADD COLUMN IF NOT EXISTS tiempo_espera_por_hora NUMERIC(10,2) DEFAULT 10000,
    ADD COLUMN IF NOT EXISTS rutas_fijas JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.clientes_corporativos.tarifa_por_km IS 'Tarifa base en CLP cobrada por kilometro recorrido.';
COMMENT ON COLUMN public.clientes_corporativos.tarifa_minima IS 'Tarifa minima en CLP por servicio.';
COMMENT ON COLUMN public.clientes_corporativos.tiempo_espera_por_hora IS 'Costo en CLP por hora de espera.';
COMMENT ON COLUMN public.clientes_corporativos.rutas_fijas IS 'Lista de rutas fijas con precio predefinido en CLP.';

-- 2. TABLA turnos_pasajeros: SOPORTE IDA Y REGRESO INDEPENDIENTE
ALTER TABLE public.turnos_pasajeros
    ADD COLUMN IF NOT EXISTS estado_ida TEXT NOT NULL DEFAULT 'programado' CHECK (estado_ida IN ('programado', 'asignado', 'completado', 'cancelado')),
    ADD COLUMN IF NOT EXISTS estado_regreso TEXT NOT NULL DEFAULT 'programado' CHECK (estado_regreso IN ('programado', 'asignado', 'completado', 'cancelado')),
    ADD COLUMN IF NOT EXISTS viaje_ida_id UUID REFERENCES public.viajes(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS viaje_regreso_id UUID REFERENCES public.viajes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_turnos_pasajeros_viaje_ida ON public.turnos_pasajeros(viaje_ida_id);
CREATE INDEX IF NOT EXISTS idx_turnos_pasajeros_viaje_regreso ON public.turnos_pasajeros(viaje_regreso_id);

-- 3. TABLA viaje_pasajeros: VINCULO CON TURNO DE DEMANDA
ALTER TABLE public.viaje_pasajeros
    ADD COLUMN IF NOT EXISTS turno_id UUID REFERENCES public.turnos_pasajeros(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_viaje_pasajeros_turno ON public.viaje_pasajeros(turno_id);

-- 4. HELPERS DE SEGURIDAD CON VALIDACION DE ESTADO ACTIVO
CREATE OR REPLACE FUNCTION public.get_auth_perfil_id()
RETURNS UUID LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT id FROM public.perfiles WHERE auth_user_id = auth.uid() AND estado = 'activo' LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_auth_rol()
RETURNS TEXT LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT rol FROM public.perfiles WHERE auth_user_id = auth.uid() AND estado = 'activo' LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_auth_conductor_id()
RETURNS UUID LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT c.id FROM public.conductores c
  JOIN public.perfiles p ON p.id = c.perfil_id
  WHERE p.auth_user_id = auth.uid() AND p.estado = 'activo' AND c.estado = 'activo'
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_b2b_cliente_id()
RETURNS UUID LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT ucb.cliente_corporativo_id
  FROM public.usuarios_cliente_b2b ucb
  JOIN public.perfiles p ON p.id = ucb.perfil_id
  WHERE p.auth_user_id = auth.uid() AND p.estado = 'activo'
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_auth_perfil_id FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_auth_rol FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_auth_conductor_id FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_b2b_cliente_id FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_auth_perfil_id TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_auth_rol TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_auth_conductor_id TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_b2b_cliente_id TO authenticated;

-- 5. TRIGGER handle_new_user: PROHIBIR ASIGNACION ARBITRARIA DE ROLES PRIVILEGIADOS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_app_rol TEXT;
  v_user_rol TEXT;
  v_final_rol TEXT;
  v_nombre TEXT;
  v_estado TEXT := 'activo';
  v_cliente_id UUID;
  v_perfil_id UUID;
  v_existing_rol TEXT;
BEGIN
  -- 1. Rol definido administrativamente via app_metadata (Service Role / Admin API)
  v_app_rol := NULLIF(trim(new.raw_app_meta_data->>'rol'), '');
  
  -- 2. Rol solicitado por usuario en raw_user_meta_data (NO confiable para roles de administracion)
  v_user_rol := NULLIF(trim(new.raw_user_meta_data->>'rol'), '');

  -- 3. Verificar si el email coincide con el contacto oficial de un cliente B2B
  SELECT id INTO v_cliente_id
  FROM public.clientes_corporativos
  WHERE LOWER(contacto_email) = LOWER(new.email)
  LIMIT 1;

  IF v_app_rol IS NOT NULL AND v_app_rol IN ('ADMIN', 'OPERACIONES', 'DISPATCHER', 'CONDUCTOR', 'CLIENTE_B2B') THEN
    v_final_rol := v_app_rol;
  ELSIF v_cliente_id IS NOT NULL THEN
    v_final_rol := 'CLIENTE_B2B';
  ELSIF v_user_rol = 'CONDUCTOR' THEN
    v_final_rol := 'CONDUCTOR';
  ELSE
    -- Por defecto para cualquier registro directo sin autorizacion previa
    v_final_rol := 'CONDUCTOR';
    v_estado := 'inactivo';
  END IF;

  v_nombre := COALESCE(
    NULLIF(trim(new.raw_user_meta_data->>'nombre_completo'), ''),
    NULLIF(trim(new.raw_user_meta_data->>'nombre'), ''),
    split_part(new.email, '@', 1)
  );

  -- Si ya existe perfil para este email, evitar degradacion de privilegios
  SELECT rol INTO v_existing_rol FROM public.perfiles WHERE LOWER(email) = LOWER(new.email);

  IF v_existing_rol IS NOT NULL THEN
    -- Si el perfil ya existia y tenia rol privilegiado, mantenerlo a menos que venga expresamente en app_metadata
    IF v_existing_rol IN ('ADMIN', 'OPERACIONES', 'DISPATCHER') AND v_app_rol IS NULL THEN
      v_final_rol := v_existing_rol;
    END IF;

    UPDATE public.perfiles
    SET
      auth_user_id    = new.id,
      nombre_completo = CASE
        WHEN v_nombre != split_part(new.email, '@', 1) THEN v_nombre
        ELSE perfiles.nombre_completo
      END,
      rol             = v_final_rol,
      estado          = CASE WHEN v_existing_rol IS NOT NULL THEN perfiles.estado ELSE v_estado END,
      updated_at      = now()
    WHERE LOWER(email) = LOWER(new.email)
    RETURNING id INTO v_perfil_id;
  ELSE
    INSERT INTO public.perfiles (auth_user_id, email, nombre_completo, rol, estado)
    VALUES (new.id, new.email, v_nombre, v_final_rol, v_estado)
    RETURNING id INTO v_perfil_id;
  END IF;

  -- Si es B2B y tenemos la empresa, asegurar relacion en usuarios_cliente_b2b
  IF v_cliente_id IS NOT NULL AND v_perfil_id IS NOT NULL THEN
    INSERT INTO public.usuarios_cliente_b2b (perfil_id, cliente_corporativo_id)
    VALUES (v_perfil_id, v_cliente_id)
    ON CONFLICT (perfil_id, cliente_corporativo_id) DO NOTHING;
  END IF;

  RETURN new;
END;
$func$;

-- 6. POLÍTICAS RLS ADICIONALES: AISLAMIENTO MULTI-ENTIDAD Y ACCESO B2B
-- Permitir a usuarios B2B ver las asignaciones de sus propios viajes
DROP POLICY IF EXISTS "asignaciones_b2b_select" ON public.asignaciones;
CREATE POLICY "asignaciones_b2b_select" ON public.asignaciones FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.viajes v
    WHERE v.id = asignaciones.viaje_id
      AND v.cliente_corporativo_id = get_b2b_cliente_id()
  )
);

-- Permitir a usuarios B2B consultar conductores asignados a sus viajes
DROP POLICY IF EXISTS "conductores_b2b_select" ON public.conductores;
CREATE POLICY "conductores_b2b_select" ON public.conductores FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.asignaciones a
    JOIN public.viajes v ON v.id = a.viaje_id
    WHERE a.conductor_id = conductores.id
      AND v.cliente_corporativo_id = get_b2b_cliente_id()
  )
);

-- Permitir a usuarios B2B consultar vehiculos asignados a sus viajes
DROP POLICY IF EXISTS "vehiculos_b2b_select" ON public.vehiculos;
CREATE POLICY "vehiculos_b2b_select" ON public.vehiculos FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.asignaciones a
    JOIN public.viajes v ON v.id = a.viaje_id
    WHERE a.vehiculo_id = vehiculos.id
      AND v.cliente_corporativo_id = get_b2b_cliente_id()
  )
);

-- Ajustar política de inserción en viaje_pasajeros para verificar que el pasajero pertenezca al cliente B2B
DROP POLICY IF EXISTS "viajepasajeros_b2b_insert" ON public.viaje_pasajeros;
CREATE POLICY "viajepasajeros_b2b_insert" ON public.viaje_pasajeros FOR INSERT TO authenticated WITH CHECK (
  (estado = 'pendiente')
  AND EXISTS (
    SELECT 1 FROM public.viajes v
    WHERE v.id = viaje_pasajeros.viaje_id
      AND v.cliente_corporativo_id = get_b2b_cliente_id()
  )
  AND EXISTS (
    SELECT 1 FROM public.pasajeros p
    WHERE p.id = viaje_pasajeros.pasajero_id
      AND p.cliente_corporativo_id = get_b2b_cliente_id()
  )
);

-- 7. RPC create_planned_trips: CORRECCIÓN DEFINITIVA DE IDA Y REGRESO
CREATE OR REPLACE FUNCTION public.create_planned_trips(p_rutas JSONB)
RETURNS JSONB AS $$
DECLARE
    v_rol TEXT;
    v_ruta JSONB;
    v_pasajero JSONB;
    v_viaje_id UUID;
    v_cliente_id UUID;
    v_vehiculo RECORD;
    v_conductor RECORD;
    v_turno_rec RECORD;
    v_count INT := 0;
    v_tipo_viaje TEXT;
    v_turno_id UUID;
    v_pasajero_id UUID;
BEGIN
    v_rol := get_auth_rol();
    IF v_rol NOT IN ('ADMIN', 'OPERACIONES') THEN
        RAISE EXCEPTION 'Acceso denegado. Solo ADMIN u OPERACIONES pueden confirmar planificación.';
    END IF;

    FOR v_ruta IN SELECT * FROM jsonb_array_elements(p_rutas)
    LOOP
        v_tipo_viaje := v_ruta->>'tipo_viaje';
        IF v_tipo_viaje NOT IN ('ida', 'regreso', 'especial') THEN
            v_tipo_viaje := 'ida';
        END IF;

        -- Validar capacidad y estado del vehículo
        SELECT * INTO v_vehiculo FROM public.vehiculos WHERE id = (v_ruta->>'vehiculo_id')::UUID;
        IF NOT FOUND OR v_vehiculo.estado != 'operativo' THEN
            RAISE EXCEPTION 'El vehículo % no está operativo o no existe.', (v_ruta->>'vehiculo_id');
        END IF;

        IF jsonb_array_length(v_ruta->'pasajeros') > v_vehiculo.capacidad THEN
            RAISE EXCEPTION 'Capacidad excedida para el vehículo % (Capacidad: %, Pasajeros: %)',
                v_vehiculo.patente, v_vehiculo.capacidad, jsonb_array_length(v_ruta->'pasajeros');
        END IF;

        -- Validar conductor activo
        SELECT * INTO v_conductor FROM public.conductores WHERE id = (v_ruta->>'conductor_id')::UUID;
        IF NOT FOUND OR v_conductor.estado != 'activo' THEN
            RAISE EXCEPTION 'El conductor % no está activo o no existe.', (v_ruta->>'conductor_id');
        END IF;

        -- Obtener el cliente_id desde el primer turno
        SELECT cliente_corporativo_id INTO v_cliente_id
        FROM public.turnos_pasajeros
        WHERE id = (v_ruta->'pasajeros'->0->>'turno_id')::UUID;

        IF v_cliente_id IS NULL THEN
            SELECT cliente_corporativo_id INTO v_cliente_id
            FROM public.pasajeros
            WHERE id = (v_ruta->'pasajeros'->0->>'pasajero_id')::UUID;
        END IF;

        -- 1. Crear el Viaje
        INSERT INTO public.viajes (
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
            v_tipo_viaje,
            'asignado',
            v_ruta->>'origen_direccion',
            v_ruta->>'destino_direccion'
        ) RETURNING id INTO v_viaje_id;

        -- 2. Crear Asignación
        INSERT INTO public.asignaciones (
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

        -- 3. Iterar sobre los pasajeros
        FOR v_pasajero IN SELECT * FROM jsonb_array_elements(v_ruta->'pasajeros')
        LOOP
            v_turno_id := (v_pasajero->>'turno_id')::UUID;
            v_pasajero_id := (v_pasajero->>'pasajero_id')::UUID;

            -- Validar turno si viene provisto
            IF v_turno_id IS NOT NULL THEN
                SELECT * INTO v_turno_rec
                FROM public.turnos_pasajeros
                WHERE id = v_turno_id
                FOR UPDATE;

                IF NOT FOUND THEN
                    RAISE EXCEPTION 'El turno % no fue encontrado.', v_turno_id;
                END IF;

                -- Control granular según pierna de viaje (ida vs regreso)
                IF v_tipo_viaje = 'ida' THEN
                    IF v_turno_rec.estado_ida != 'programado' THEN
                        RAISE EXCEPTION 'La pierna de ida del turno % ya fue asignada (Estado: %).', v_turno_id, v_turno_rec.estado_ida;
                    END IF;

                    UPDATE public.turnos_pasajeros
                    SET estado_ida = 'asignado',
                        viaje_ida_id = v_viaje_id,
                        estado = 'asignado',
                        updated_at = now()
                    WHERE id = v_turno_id;
                ELSIF v_tipo_viaje = 'regreso' THEN
                    IF v_turno_rec.estado_regreso != 'programado' THEN
                        RAISE EXCEPTION 'La pierna de regreso del turno % ya fue asignada (Estado: %).', v_turno_id, v_turno_rec.estado_regreso;
                    END IF;

                    UPDATE public.turnos_pasajeros
                    SET estado_regreso = 'asignado',
                        viaje_regreso_id = v_viaje_id,
                        estado = 'asignado',
                        updated_at = now()
                    WHERE id = v_turno_id;
                ELSE
                    UPDATE public.turnos_pasajeros
                    SET estado = 'asignado', updated_at = now()
                    WHERE id = v_turno_id;
                END IF;
            END IF;

            -- Crear registro en el manifiesto (viaje_pasajeros) con turno_id
            INSERT INTO public.viaje_pasajeros (
                viaje_id,
                pasajero_id,
                turno_id,
                estado,
                orden_parada,
                direccion_parada,
                latitud_parada,
                longitud_parada
            ) VALUES (
                v_viaje_id,
                v_pasajero_id,
                v_turno_id,
                'pendiente',
                COALESCE((v_pasajero->>'orden')::INTEGER, 1),
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

REVOKE ALL ON FUNCTION public.create_planned_trips(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_planned_trips(JSONB) TO authenticated;

-- 8. RPC board_passenger: VALIDAR QUE EL VIAJE SIGA ABIERTO Y CONDUCTOR ASIGNADO
CREATE OR REPLACE FUNCTION public.board_passenger(
    p_viaje_pasajero_id UUID,
    p_estado TEXT
) RETURNS VOID AS $$
DECLARE
    v_viaje_id      UUID;
    v_pasajero_id   UUID;
    v_estado_actual TEXT;
    v_viaje_estado  TEXT;
BEGIN
    IF get_auth_rol() != 'CONDUCTOR' THEN
        RAISE EXCEPTION 'Solo un conductor activo puede registrar abordajes.';
    END IF;

    IF p_estado NOT IN ('abordado', 'no_show', 'pendiente') THEN
        RAISE EXCEPTION 'Estado invalido para el pasajero: %', p_estado;
    END IF;

    SELECT vp.viaje_id, vp.pasajero_id, vp.estado, v.estado
    INTO v_viaje_id, v_pasajero_id, v_estado_actual, v_viaje_estado
    FROM public.viaje_pasajeros vp
    JOIN public.viajes v ON v.id = vp.viaje_id
    WHERE vp.id = p_viaje_pasajero_id
    FOR UPDATE OF vp;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Registro de pasajero en viaje no encontrado.';
    END IF;

    -- Validar que el viaje esté en curso (no finalizado ni cancelado)
    IF v_viaje_estado IN ('finalizado', 'cancelado') THEN
        RAISE EXCEPTION 'No se pueden alterar abordajes en un viaje con estado %.', v_viaje_estado;
    END IF;

    -- Validar que el conductor autenticado tenga la asignación activa
    IF NOT EXISTS (
        SELECT 1 FROM public.asignaciones
        WHERE viaje_id = v_viaje_id
          AND conductor_id = get_auth_conductor_id()
          AND estado = 'activa'
    ) THEN
        RAISE EXCEPTION 'No estas asignado a este viaje.';
    END IF;

    -- Idempotencia
    IF v_estado_actual = p_estado THEN
        RETURN;
    END IF;

    UPDATE public.viaje_pasajeros
    SET estado        = p_estado,
        hora_abordaje = CASE WHEN p_estado = 'abordado' THEN now() WHEN p_estado = 'pendiente' THEN NULL ELSE hora_abordaje END,
        updated_at    = now()
    WHERE id = p_viaje_pasajero_id;

    PERFORM public.log_trip_event(
        v_viaje_id,
        v_estado_actual,
        p_estado,
        'Pasajero ' || v_pasajero_id || ' marcado como ' || p_estado
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.board_passenger(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.board_passenger(UUID, TEXT) TO authenticated;

-- 9. RPC trip_finish: VALIDAR COHERENCIA DEL MANIFIESTO Y REVOCAR TOKENS
CREATE OR REPLACE FUNCTION public.trip_finish(p_viaje_id UUID) RETURNS VOID AS $$
DECLARE
    v_estado_actual TEXT;
    v_pendientes INT;
BEGIN
    IF get_auth_rol() != 'CONDUCTOR' THEN
        RAISE EXCEPTION 'Solo un conductor activo puede finalizar el servicio.';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.asignaciones
        WHERE viaje_id = p_viaje_id AND conductor_id = get_auth_conductor_id() AND estado = 'activa'
    ) THEN
        RAISE EXCEPTION 'No estás asignado a este viaje.';
    END IF;

    SELECT estado INTO v_estado_actual FROM public.viajes WHERE id = p_viaje_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Viaje no encontrado.';
    END IF;

    IF v_estado_actual = 'finalizado' THEN
        RETURN; -- Idempotencia
    END IF;

    IF v_estado_actual = 'cancelado' THEN
        RAISE EXCEPTION 'No se puede finalizar un viaje cancelado.';
    END IF;

    -- Validar que no queden pasajeros pendientes de confirmacion
    SELECT count(*) INTO v_pendientes
    FROM public.viaje_pasajeros
    WHERE viaje_id = p_viaje_id AND estado = 'pendiente';

    IF v_pendientes > 0 THEN
        RAISE EXCEPTION 'No es posible finalizar el viaje: quedan % pasajero(s) pendientes de registrar como abordado o ausente.', v_pendientes;
    END IF;

    UPDATE public.viajes
    SET estado = 'finalizado', updated_at = now()
    WHERE id = p_viaje_id;

    -- Revocar inmediatamente tokens publicos de tracking de este viaje
    UPDATE public.tracking_tokens
    SET revoked_at = now()
    WHERE viaje_id = p_viaje_id AND revoked_at IS NULL;

    PERFORM public.log_trip_event(p_viaje_id, v_estado_actual, 'finalizado', 'Viaje completado exitosamente por conductor.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.trip_finish(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.trip_finish(UUID) TO authenticated;

-- 10. TRIGGER sync_turnos_on_trip_finish: CIERRE PRECISO POR PIERNA (IDA / REGRESO)
CREATE OR REPLACE FUNCTION public.sync_turnos_on_trip_finish()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.estado = 'finalizado' AND (OLD.estado IS NULL OR OLD.estado != 'finalizado') THEN
        -- 1. Actualizar turnos vinculados explicitamente por turno_id
        IF NEW.tipo_viaje = 'ida' THEN
            UPDATE public.turnos_pasajeros tp
            SET estado_ida = 'completado',
                estado = CASE WHEN tp.estado_regreso = 'completado' OR tp.viaje_regreso_id IS NULL THEN 'completado' ELSE tp.estado END,
                updated_at = now()
            FROM public.viaje_pasajeros vp
            WHERE vp.viaje_id = NEW.id
              AND vp.turno_id = tp.id;
        ELSIF NEW.tipo_viaje = 'regreso' THEN
            UPDATE public.turnos_pasajeros tp
            SET estado_regreso = 'completado',
                estado = CASE WHEN tp.estado_ida = 'completado' OR tp.viaje_ida_id IS NULL THEN 'completado' ELSE tp.estado END,
                updated_at = now()
            FROM public.viaje_pasajeros vp
            WHERE vp.viaje_id = NEW.id
              AND vp.turno_id = tp.id;
        END IF;

        -- 2. Fallback para turnos sin turno_id en manifiesto (mismo pasajero en la fecha del viaje)
        UPDATE public.turnos_pasajeros tp
        SET estado = 'completado',
            updated_at = now()
        FROM public.viaje_pasajeros vp
        WHERE vp.viaje_id = NEW.id
          AND vp.turno_id IS NULL
          AND tp.pasajero_id = vp.pasajero_id
          AND tp.fecha = NEW.fecha_programada::DATE
          AND tp.estado = 'asignado';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 11. RPC ATOMICA: create_special_trip (ALTA DE VIAJE SIN MULTIPLES PASOS DESDE FRONTEND)
CREATE OR REPLACE FUNCTION public.create_special_trip(p_data JSONB)
RETURNS JSONB AS $$
DECLARE
    v_rol TEXT;
    v_cliente_id UUID;
    v_viaje_id UUID;
    v_pasajero_id UUID;
    v_pasajero_nombre TEXT;
    v_pasajero_telefono TEXT;
    v_origen TEXT;
    v_destino TEXT;
    v_fecha TIMESTAMPTZ;
    v_obs TEXT;
BEGIN
    v_rol := get_auth_rol();
    IF v_rol NOT IN ('ADMIN', 'OPERACIONES', 'DISPATCHER', 'CLIENTE_B2B') THEN
        RAISE EXCEPTION 'No autorizado para crear servicios de transporte.';
    END IF;

    -- Validar o asignar cliente corporativo
    IF v_rol = 'CLIENTE_B2B' THEN
        v_cliente_id := get_b2b_cliente_id();
        IF v_cliente_id IS NULL THEN
            RAISE EXCEPTION 'Usuario B2B no tiene empresa corporativa asociada.';
        END IF;
    ELSE
        v_cliente_id := (p_data->>'cliente_corporativo_id')::UUID;
        IF v_cliente_id IS NULL THEN
            SELECT id INTO v_cliente_id FROM public.clientes_corporativos LIMIT 1;
        END IF;
    END IF;

    v_pasajero_nombre := COALESCE(NULLIF(trim(p_data->>'pasajero_nombre'), ''), 'Colaborador');
    v_pasajero_telefono := COALESCE(NULLIF(trim(p_data->>'pasajero_telefono'), ''), '+56900000000');
    v_origen := COALESCE(NULLIF(trim(p_data->>'origen_direccion'), ''), 'Dirección no informada');
    v_destino := COALESCE(NULLIF(trim(p_data->>'destino_direccion'), ''), 'Dirección no informada');
    v_fecha := COALESCE((p_data->>'fecha_programada')::TIMESTAMPTZ, now());
    v_obs := p_data->>'observaciones';

    -- 1. Insertar viaje
    INSERT INTO public.viajes (
        cliente_corporativo_id,
        fecha_programada,
        tipo_viaje,
        estado,
        origen_direccion,
        origen_lat,
        origen_lng,
        destino_direccion,
        destino_lat,
        destino_lng,
        observaciones
    ) VALUES (
        v_cliente_id,
        v_fecha,
        'especial',
        'solicitado',
        v_origen,
        (p_data->>'origen_lat')::DOUBLE PRECISION,
        (p_data->>'origen_lng')::DOUBLE PRECISION,
        v_destino,
        (p_data->>'destino_lat')::DOUBLE PRECISION,
        (p_data->>'destino_lng')::DOUBLE PRECISION,
        v_obs
    ) RETURNING id INTO v_viaje_id;

    -- 2. Resolver o crear pasajero dentro del mismo cliente corporativo
    SELECT id INTO v_pasajero_id
    FROM public.pasajeros
    WHERE cliente_corporativo_id = v_cliente_id
      AND LOWER(nombre_completo) = LOWER(v_pasajero_nombre)
    LIMIT 1;

    IF v_pasajero_id IS NULL THEN
        INSERT INTO public.pasajeros (
            cliente_corporativo_id,
            nombre_completo,
            rut,
            telefono,
            direccion_defecto,
            estado
        ) VALUES (
            v_cliente_id,
            v_pasajero_nombre,
            'RUT-P-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8),
            v_pasajero_telefono,
            v_origen,
            'activo'
        ) RETURNING id INTO v_pasajero_id;
    END IF;

    -- 3. Crear manifiesto
    INSERT INTO public.viaje_pasajeros (
        viaje_id,
        pasajero_id,
        estado,
        orden_parada,
        direccion_parada
    ) VALUES (
        v_viaje_id,
        v_pasajero_id,
        'pendiente',
        1,
        v_origen
    );

    -- 4. Registrar evento
    PERFORM public.log_trip_event(v_viaje_id, NULL, 'solicitado', 'Servicio especial creado');

    RETURN jsonb_build_object(
        'success', true,
        'viaje_id', v_viaje_id,
        'pasajero_id', v_pasajero_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.create_special_trip(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_special_trip(JSONB) TO authenticated;

-- 12. RPC execute_trip_rescue: RESCATE OPERATIVO CON REASIGNACION, TOKEN Y BITACORA
CREATE OR REPLACE FUNCTION public.execute_trip_rescue(
    p_incidencia_id UUID,
    p_nuevo_conductor_id UUID,
    p_nuevo_vehiculo_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_rol TEXT;
    v_incidencia RECORD;
    v_viaje_id UUID;
    v_vehiculo_id UUID := p_nuevo_vehiculo_id;
    v_new_token TEXT;
BEGIN
    v_rol := get_auth_rol();
    IF v_rol NOT IN ('ADMIN', 'OPERACIONES', 'DISPATCHER') THEN
        RAISE EXCEPTION 'No autorizado para ejecutar operaciones de rescate.';
    END IF;

    SELECT * INTO v_incidencia FROM public.incidencias WHERE id = p_incidencia_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Incidencia % no encontrada.', p_incidencia_id;
    END IF;

    v_viaje_id := v_incidencia.viaje_id;

    -- Si no se suministró vehículo para el rescate, obtener el vehículo habitual del conductor nuevo
    IF v_vehiculo_id IS NULL THEN
        SELECT vehiculo_habitual_id INTO v_vehiculo_id
        FROM public.conductores WHERE id = p_nuevo_conductor_id;
    END IF;

    IF v_vehiculo_id IS NULL THEN
        SELECT id INTO v_vehiculo_id
        FROM public.vehiculos WHERE estado = 'operativo' LIMIT 1;
    END IF;

    IF v_vehiculo_id IS NULL THEN
        RAISE EXCEPTION 'No hay un vehículo operativo disponible para el rescate.';
    END IF;

    -- 1. Marcar asignación anterior como reemplazada
    UPDATE public.asignaciones
    SET estado = 'reemplazada', updated_at = now()
    WHERE viaje_id = v_viaje_id AND estado = 'activa';

    -- 2. Crear nueva asignación activa
    INSERT INTO public.asignaciones (viaje_id, conductor_id, vehiculo_id, estado)
    VALUES (v_viaje_id, p_nuevo_conductor_id, v_vehiculo_id, 'activa');

    -- 3. Si la incidencia involucraba falla mecánica, pasar vehículo anterior a taller
    IF v_incidencia.tipo IN ('falla_mecanica', 'accidente') THEN
        UPDATE public.vehiculos
        SET estado = 'taller', updated_at = now()
        WHERE id IN (
            SELECT vehiculo_id FROM public.asignaciones
            WHERE viaje_id = v_viaje_id AND estado = 'reemplazada'
            ORDER BY created_at DESC LIMIT 1
        );
    END IF;

    -- 4. Actualizar estado de la incidencia a resuelta/en_resolucion
    UPDATE public.incidencias
    SET estado = 'en_resolucion', updated_at = now()
    WHERE id = p_incidencia_id;

    -- 5. Actualizar viaje a despachado/en_camino y registrar evento
    UPDATE public.viajes
    SET estado = 'despachado', updated_at = now()
    WHERE id = v_viaje_id;

    PERFORM public.log_trip_event(
        v_viaje_id,
        'incidencia',
        'despachado',
        'Rescate ejecutado: Reasignado a conductor ' || p_nuevo_conductor_id || ' y movil ' || v_vehiculo_id
    );

    -- 6. Generar nuevo token de tracking
    v_new_token := public.generate_tracking_token(v_viaje_id);

    RETURN jsonb_build_object(
        'success', true,
        'viaje_id', v_viaje_id,
        'nuevo_conductor_id', p_nuevo_conductor_id,
        'nuevo_vehiculo_id', v_vehiculo_id,
        'tracking_token', v_new_token
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.execute_trip_rescue(UUID, UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.execute_trip_rescue(UUID, UUID, UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';

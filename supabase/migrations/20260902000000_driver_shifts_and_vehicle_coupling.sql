-- ==============================================================================
-- MIGRACION: ASOCIACION CONDUCTOR-VEHICULO, JORNADAS WFM Y RESOLUCION B2B
-- ==============================================================================

-- 1. ASOCIACION MOVIL HABITUAL A CONDUCTORES
ALTER TABLE public.conductores 
ADD COLUMN IF NOT EXISTS vehiculo_habitual_id UUID REFERENCES public.vehiculos(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_conductores_vehiculo_habitual 
ON public.conductores(vehiculo_habitual_id);

-- 2. TABLA TURNOS_CONDUCTORES (GESTION DE JORNADAS Y TURNOS LABORALES WFM)
CREATE TABLE IF NOT EXISTS public.turnos_conductores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conductor_id UUID NOT NULL REFERENCES public.conductores(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    tipo_jornada TEXT NOT NULL DEFAULT 'manana' CHECK (tipo_jornada IN ('manana', 'tarde', 'noche', 'partida', 'descanso')),
    estado TEXT NOT NULL DEFAULT 'planificado' CHECK (estado IN ('planificado', 'en_turno', 'completado', 'ausente', 'licencia')),
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_turnos_conductores_conductor_fecha 
ON public.turnos_conductores(conductor_id, fecha);

CREATE INDEX IF NOT EXISTS idx_turnos_conductores_fecha 
ON public.turnos_conductores(fecha);

-- Habilitar RLS en turnos_conductores
ALTER TABLE public.turnos_conductores ENABLE ROW LEVEL SECURITY;

-- Politicas RLS para turnos_conductores
DROP POLICY IF EXISTS "turnos_conductores_admin_ops_disp_all" ON public.turnos_conductores;
CREATE POLICY "turnos_conductores_admin_ops_disp_all" 
ON public.turnos_conductores 
FOR ALL TO authenticated 
USING (get_auth_rol() IN ('ADMIN', 'OPERACIONES', 'DISPATCHER'));

DROP POLICY IF EXISTS "turnos_conductores_conductor_select" ON public.turnos_conductores;
CREATE POLICY "turnos_conductores_conductor_select" 
ON public.turnos_conductores 
FOR SELECT TO authenticated 
USING (conductor_id = get_auth_conductor_id());

-- 3. PERMISOS EXPLICITOS
GRANT SELECT, INSERT, UPDATE, DELETE ON public.turnos_conductores TO authenticated;

-- 4. RPC MEJORADA import_b2b_shifts
-- Soporta fechas en formato chileno DD-MM-YYYY y resolucion de sedes por nombre o UUID.
CREATE OR REPLACE FUNCTION public.import_b2b_shifts(p_shifts JSONB)
RETURNS JSONB AS $$
DECLARE
    v_b2b_cliente_id UUID;
    v_rol TEXT;
    v_turno JSONB;
    v_pasajero_id UUID;
    v_inserted_count INT := 0;
    v_rut_clean TEXT;
    v_sede_id UUID;
    v_sede_input TEXT;
    v_fecha_input TEXT;
    v_fecha_parsed DATE;
BEGIN
    v_rol := get_auth_rol();
    IF v_rol != 'CLIENTE_B2B' AND v_rol NOT IN ('ADMIN', 'OPERACIONES') THEN
        RAISE EXCEPTION 'Acceso denegado. Rol % no autorizado para importar turnos.', v_rol;
    END IF;

    IF v_rol = 'CLIENTE_B2B' THEN
        v_b2b_cliente_id := get_b2b_cliente_id();
        IF v_b2b_cliente_id IS NULL THEN
            RAISE EXCEPTION 'Usuario B2B no esta asociado a ningun cliente corporativo.';
        END IF;
    END IF;

    FOR v_turno IN SELECT * FROM jsonb_array_elements(p_shifts)
    LOOP
        v_rut_clean := trim(COALESCE(v_turno->>'rut', v_turno->>'RUT', '')::TEXT);
        IF v_rut_clean IS NULL OR v_rut_clean = '' THEN 
            CONTINUE; 
        END IF;

        -- En caso de Admin importando, si el turno especifica cliente_corporativo_id se respeta
        IF v_rol IN ('ADMIN', 'OPERACIONES') THEN
            IF (v_turno->>'cliente_corporativo_id') IS NOT NULL THEN
                v_b2b_cliente_id := (v_turno->>'cliente_corporativo_id')::UUID;
            ELSIF v_b2b_cliente_id IS NULL THEN
                SELECT id INTO v_b2b_cliente_id FROM public.clientes_corporativos LIMIT 1;
            END IF;
        END IF;

        -- Resolucion de Sede (por UUID o por Nombre)
        v_sede_input := trim(COALESCE(
            v_turno->>'sede_id', 
            v_turno->>'sede', 
            v_turno->>'nombre_sede', 
            v_turno->>'sede_destino',
            v_turno->>'Sede Destino',
            ''
        ));

        v_sede_id := NULL;

        -- Intento 1: Es un UUID valido
        IF v_sede_input ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
            SELECT id INTO v_sede_id 
            FROM public.sedes 
            WHERE id = v_sede_input::UUID AND cliente_corporativo_id = v_b2b_cliente_id;
        END IF;

        -- Intento 2: Buscar por nombre de sede
        IF v_sede_id IS NULL AND v_sede_input != '' THEN
            SELECT id INTO v_sede_id 
            FROM public.sedes 
            WHERE cliente_corporativo_id = v_b2b_cliente_id 
              AND (LOWER(nombre) = LOWER(v_sede_input) OR LOWER(direccion) LIKE '%' || LOWER(v_sede_input) || '%')
            LIMIT 1;
        END IF;

        -- Intento 3: Fallback a la primera sede activa del cliente
        IF v_sede_id IS NULL THEN
            SELECT id INTO v_sede_id 
            FROM public.sedes 
            WHERE cliente_corporativo_id = v_b2b_cliente_id AND estado = 'activo'
            LIMIT 1;
        END IF;

        IF v_sede_id IS NULL THEN
            -- Crear sede por defecto si el cliente corporativo no tiene sedes
            INSERT INTO public.sedes (cliente_corporativo_id, nombre, direccion)
            VALUES (v_b2b_cliente_id, COALESCE(NULLIF(v_sede_input, ''), 'Sede Principal'), 'Direccion Corporativa')
            RETURNING id INTO v_sede_id;
        END IF;

        -- Normalizacion de Fecha (Soporta DD-MM-YYYY, DD/MM/YYYY o YYYY-MM-DD)
        v_fecha_input := trim(COALESCE(
            v_turno->>'fecha', 
            v_turno->>'Fecha', 
            v_turno->>'Fecha (DD-MM-AAAA)', 
            to_char(CURRENT_DATE, 'YYYY-MM-DD')
        ));

        IF v_fecha_input ~ '^\d{2}[-/]\d{2}[-/]\d{4}$' THEN
            v_fecha_parsed := to_date(replace(v_fecha_input, '/', '-'), 'DD-MM-YYYY');
        ELSIF v_fecha_input ~ '^\d{4}[-/]\d{2}[-/]\d{2}$' THEN
            v_fecha_parsed := to_date(replace(v_fecha_input, '/', '-'), 'YYYY-MM-DD');
        ELSE
            BEGIN
                v_fecha_parsed := v_fecha_input::DATE;
            EXCEPTION WHEN OTHERS THEN
                v_fecha_parsed := CURRENT_DATE;
            END;
        END IF;

        -- 1. Upsert del Pasajero
        SELECT id INTO v_pasajero_id 
        FROM public.pasajeros 
        WHERE cliente_corporativo_id = v_b2b_cliente_id AND rut = v_rut_clean;

        IF FOUND THEN
            UPDATE public.pasajeros 
            SET 
                nombre_completo = COALESCE(v_turno->>'nombre', v_turno->>'Nombre Completo', nombre_completo),
                telefono = COALESCE(v_turno->>'telefono', v_turno->>'Telefono', telefono),
                direccion_defecto = COALESCE(v_turno->>'direccion', v_turno->>'Direccion Recogida', direccion_defecto),
                updated_at = now()
            WHERE id = v_pasajero_id;
        ELSE
            INSERT INTO public.pasajeros (
                cliente_corporativo_id, 
                nombre_completo, 
                rut, 
                telefono, 
                direccion_defecto
            )
            VALUES (
                v_b2b_cliente_id, 
                COALESCE(v_turno->>'nombre', v_turno->>'Nombre Completo', 'Colaborador'), 
                v_rut_clean, 
                COALESCE(v_turno->>'telefono', v_turno->>'Telefono', '+56 9 0000 0000'), 
                COALESCE(v_turno->>'direccion', v_turno->>'Direccion Recogida', 'Direccion no informada')
            )
            RETURNING id INTO v_pasajero_id;
        END IF;

        -- 2. Insertar Turno del Pasajero
        INSERT INTO public.turnos_pasajeros (
            cliente_corporativo_id, 
            pasajero_id, 
            sede_id, 
            fecha, 
            hora_entrada, 
            hora_salida, 
            direccion_recogida
        ) VALUES (
            v_b2b_cliente_id,
            v_pasajero_id,
            v_sede_id,
            v_fecha_parsed,
            (COALESCE(v_turno->>'hora_entrada', v_turno->>'Hora Entrada', '08:00'))::TIME,
            (COALESCE(v_turno->>'hora_salida', v_turno->>'Hora Salida', '18:00'))::TIME,
            COALESCE(v_turno->>'direccion', v_turno->>'Direccion Recogida', 'Direccion no informada')
        );

        v_inserted_count := v_inserted_count + 1;
    END LOOP;

    RETURN jsonb_build_object('inserted', v_inserted_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

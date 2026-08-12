-- SPRINT 7: B2B + TURNOS

-- 1. Crear tabla turnos_pasajeros
CREATE TABLE turnos_pasajeros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_corporativo_id UUID NOT NULL REFERENCES clientes_corporativos(id) ON DELETE RESTRICT,
    pasajero_id UUID NOT NULL REFERENCES pasajeros(id) ON DELETE RESTRICT,
    sede_id UUID NOT NULL REFERENCES sedes(id) ON DELETE RESTRICT,
    fecha DATE NOT NULL,
    hora_entrada TIME NOT NULL,
    hora_salida TIME NOT NULL,
    direccion_recogida TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'programado' CHECK (estado IN ('programado', 'asignado', 'completado', 'cancelado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Indices
CREATE INDEX idx_turnos_pasajeros_cliente ON turnos_pasajeros(cliente_corporativo_id);
CREATE INDEX idx_turnos_pasajeros_fecha ON turnos_pasajeros(fecha);

-- Habilitar RLS
ALTER TABLE turnos_pasajeros ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "turnos_admin_ops_all" ON turnos_pasajeros FOR ALL TO authenticated USING (get_auth_rol() IN ('ADMIN', 'OPERACIONES'));
CREATE POLICY "turnos_dispatcher_select" ON turnos_pasajeros FOR SELECT TO authenticated USING (get_auth_rol() = 'DISPATCHER');
CREATE POLICY "turnos_b2b_select" ON turnos_pasajeros FOR SELECT TO authenticated USING (cliente_corporativo_id = get_b2b_cliente_id());

-- 2. RPC import_b2b_shifts
-- Recibe un JSONB con los turnos a importar. El array contiene objetos:
-- { "rut": "111-1", "nombre": "Juan", "direccion": "Calle 1", "fecha": "2026-08-15", "hora_entrada": "08:00", "hora_salida": "18:00", "sede_id": "uuid" }
CREATE OR REPLACE FUNCTION import_b2b_shifts(p_shifts JSONB)
RETURNS JSONB AS $$
DECLARE
    v_b2b_cliente_id UUID;
    v_rol TEXT;
    v_turno JSONB;
    v_pasajero_id UUID;
    v_inserted_count INT := 0;
    v_rut_clean TEXT;
BEGIN
    v_rol := get_auth_rol();
    IF v_rol != 'CLIENTE_B2B' THEN
        RAISE EXCEPTION 'Acceso denegado. Solo CLIENTE_B2B puede importar turnos.';
    END IF;

    v_b2b_cliente_id := get_b2b_cliente_id();
    IF v_b2b_cliente_id IS NULL THEN
        RAISE EXCEPTION 'Usuario B2B no está asociado a ningún cliente corporativo.';
    END IF;

    -- Iterar sobre el array de turnos
    FOR v_turno IN SELECT * FROM jsonb_array_elements(p_shifts)
    LOOP
        v_rut_clean := trim((v_turno->>'rut')::TEXT);
        
        -- Validaciones básicas
        IF v_rut_clean IS NULL OR v_rut_clean = '' THEN CONTINUE; END IF;
        IF (v_turno->>'sede_id') IS NULL THEN RAISE EXCEPTION 'sede_id es requerido'; END IF;
        
        -- Validar si la sede pertenece al mismo cliente
        IF NOT EXISTS (SELECT 1 FROM sedes WHERE id = (v_turno->>'sede_id')::UUID AND cliente_corporativo_id = v_b2b_cliente_id) THEN
            RAISE EXCEPTION 'La sede provista no pertenece a su corporación.';
        END IF;

        -- 1. Upsert del Pasajero (busca por RUT y cliente_corporativo_id)
        SELECT id INTO v_pasajero_id 
        FROM pasajeros 
        WHERE cliente_corporativo_id = v_b2b_cliente_id AND rut = v_rut_clean;

        IF FOUND THEN
            -- Update si es necesario
            UPDATE pasajeros 
            SET 
                nombre_completo = v_turno->>'nombre',
                direccion_defecto = COALESCE(v_turno->>'direccion', direccion_defecto),
                updated_at = now()
            WHERE id = v_pasajero_id;
        ELSE
            -- Insert
            INSERT INTO pasajeros (cliente_corporativo_id, nombre_completo, rut, direccion_defecto)
            VALUES (v_b2b_cliente_id, v_turno->>'nombre', v_rut_clean, v_turno->>'direccion')
            RETURNING id INTO v_pasajero_id;
        END IF;

        -- 2. Insertar el Turno (necesidad)
        INSERT INTO turnos_pasajeros (
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
            (v_turno->>'sede_id')::UUID,
            (v_turno->>'fecha')::DATE,
            (v_turno->>'hora_entrada')::TIME,
            (v_turno->>'hora_salida')::TIME,
            v_turno->>'direccion'
        );

        v_inserted_count := v_inserted_count + 1;
    END LOOP;

    RETURN jsonb_build_object('inserted', v_inserted_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Permisos
REVOKE EXECUTE ON FUNCTION import_b2b_shifts(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION import_b2b_shifts(JSONB) TO authenticated;

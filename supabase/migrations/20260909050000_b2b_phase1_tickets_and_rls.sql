-- ==============================================================================
-- MIGRACION: FASE 1 - PORTAL B2B
-- 1. Creación de tabla tickets_soporte
-- 2. Habilitación de inserción de reservas manuales (viajes) para CLIENTE_B2B
-- ==============================================================================

-- 1. Tabla TICKETS_SOPORTE
CREATE TABLE IF NOT EXISTS public.tickets_soporte (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_corporativo_id UUID NOT NULL REFERENCES public.clientes_corporativos(id) ON DELETE CASCADE,
    asunto TEXT NOT NULL,
    detalle TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'Ingresado / En Revisión',
    prioridad TEXT NOT NULL DEFAULT 'media',
    ejecutivo_asignado TEXT DEFAULT 'Mesa Central',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS en tickets_soporte
ALTER TABLE public.tickets_soporte ENABLE ROW LEVEL SECURITY;

-- Policy: Admin y Operaciones (ALL)
CREATE POLICY "tickets_admin_ops_all"
    ON public.tickets_soporte
    FOR ALL
    TO authenticated
    USING (get_auth_rol() IN ('ADMIN', 'OPERACIONES'));

-- Policy: CLIENTE_B2B (SELECT)
CREATE POLICY "tickets_b2b_select"
    ON public.tickets_soporte
    FOR SELECT
    TO authenticated
    USING (cliente_corporativo_id = get_b2b_cliente_id());

-- Policy: CLIENTE_B2B (INSERT)
CREATE POLICY "tickets_b2b_insert"
    ON public.tickets_soporte
    FOR INSERT
    TO authenticated
    WITH CHECK (cliente_corporativo_id = get_b2b_cliente_id());

-- Función genérica para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para updated_at en tickets_soporte
CREATE TRIGGER update_tickets_soporte_modtime
    BEFORE UPDATE ON public.tickets_soporte
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();


-- 2. Políticas INSERT para reservas excepcionales de B2B (viajes y viaje_pasajeros)
-- CLIENTE_B2B puede insertar un viaje SOLO si el estado es 'solicitado' y le pertenece
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'viajes'
      AND policyname = 'viajes_b2b_insert'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "viajes_b2b_insert"
        ON public.viajes
        FOR INSERT
        TO authenticated
        WITH CHECK (
          cliente_corporativo_id = get_b2b_cliente_id() 
          AND estado = 'solicitado'
        )
    $policy$;
  END IF;
END;
$$;

-- CLIENTE_B2B puede insertar los pasajeros de esa reserva SOLO si el estado es 'pendiente'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'viaje_pasajeros'
      AND policyname = 'viajepasajeros_b2b_insert'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "viajepasajeros_b2b_insert"
        ON public.viaje_pasajeros
        FOR INSERT
        TO authenticated
        WITH CHECK (
          estado = 'pendiente'
          AND EXISTS (
            SELECT 1 FROM public.viajes v
            WHERE v.id = viaje_pasajeros.viaje_id
              AND v.cliente_corporativo_id = get_b2b_cliente_id()
          )
        )
    $policy$;
  END IF;
END;
$$;

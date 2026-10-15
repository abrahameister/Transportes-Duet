-- ==============================================================================
-- MIGRACION: ELIMINAR RECURSION INFINITA EN POLITICAS RLS (CODIGO 42P17)
-- FECHA: 2026-10-15
-- ==============================================================================

-- 1. FUNCIONES HELPER SECURITY DEFINER PARA DESACOPLAR SUBQUERIES RLS
-- Al ser SECURITY DEFINER y consultar tablas del esquema public,
-- evitan que PostgreSQL re-evalúe recursivamente las políticas entre
-- asignaciones, viajes, vehiculos y conductores.

CREATE OR REPLACE FUNCTION public.is_conductor_assigned_to_viaje(p_viaje_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.asignaciones
    WHERE viaje_id = p_viaje_id AND conductor_id = get_auth_conductor_id()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_viaje_of_b2b_client(p_viaje_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.viajes
    WHERE id = p_viaje_id AND cliente_corporativo_id = get_b2b_cliente_id()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_conductor_assigned_to_vehiculo(p_vehiculo_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.asignaciones
    WHERE vehiculo_id = p_vehiculo_id AND conductor_id = get_auth_conductor_id()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_vehiculo_visible_to_b2b(p_vehiculo_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.asignaciones a
    JOIN public.viajes v ON v.id = a.viaje_id
    WHERE a.vehiculo_id = p_vehiculo_id AND v.cliente_corporativo_id = get_b2b_cliente_id()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_conductor_visible_to_b2b(p_conductor_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.asignaciones a
    JOIN public.viajes v ON v.id = a.viaje_id
    WHERE a.conductor_id = p_conductor_id AND v.cliente_corporativo_id = get_b2b_cliente_id()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_pasajero_assigned_to_conductor(p_pasajero_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.viaje_pasajeros vp
    JOIN public.asignaciones a ON a.viaje_id = vp.viaje_id
    WHERE vp.pasajero_id = p_pasajero_id AND a.conductor_id = get_auth_conductor_id()
  );
$$;

REVOKE ALL ON FUNCTION public.is_conductor_assigned_to_viaje FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_viaje_of_b2b_client FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_conductor_assigned_to_vehiculo FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_vehiculo_visible_to_b2b FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_conductor_visible_to_b2b FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_pasajero_assigned_to_conductor FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.is_conductor_assigned_to_viaje TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_viaje_of_b2b_client TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_conductor_assigned_to_vehiculo TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_vehiculo_visible_to_b2b TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_conductor_visible_to_b2b TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_pasajero_assigned_to_conductor TO authenticated;

-- 2. REEMPLAZO DE POLITICAS RLS AFECTADAS POR RECURSION

-- TABLA: viajes
DROP POLICY IF EXISTS "viajes_conductor_select" ON public.viajes;
CREATE POLICY "viajes_conductor_select" ON public.viajes
FOR SELECT TO authenticated
USING (
  get_auth_rol() = 'CONDUCTOR' AND is_conductor_assigned_to_viaje(id)
);

-- TABLA: asignaciones
DROP POLICY IF EXISTS "asignaciones_b2b_select" ON public.asignaciones;
CREATE POLICY "asignaciones_b2b_select" ON public.asignaciones
FOR SELECT TO authenticated
USING (
  get_auth_rol() = 'CLIENTE_B2B' AND is_viaje_of_b2b_client(viaje_id)
);

-- TABLA: vehiculos
DROP POLICY IF EXISTS "vehiculos_conductor_select" ON public.vehiculos;
CREATE POLICY "vehiculos_conductor_select" ON public.vehiculos
FOR SELECT TO authenticated
USING (
  get_auth_rol() = 'CONDUCTOR' AND is_conductor_assigned_to_vehiculo(id)
);

DROP POLICY IF EXISTS "vehiculos_b2b_select" ON public.vehiculos;
CREATE POLICY "vehiculos_b2b_select" ON public.vehiculos
FOR SELECT TO authenticated
USING (
  get_auth_rol() = 'CLIENTE_B2B' AND is_vehiculo_visible_to_b2b(id)
);

-- TABLA: conductores
DROP POLICY IF EXISTS "conductores_b2b_select" ON public.conductores;
CREATE POLICY "conductores_b2b_select" ON public.conductores
FOR SELECT TO authenticated
USING (
  get_auth_rol() = 'CLIENTE_B2B' AND is_conductor_visible_to_b2b(id)
);

-- TABLA: viaje_pasajeros
DROP POLICY IF EXISTS "viajepasajeros_conductor_select" ON public.viaje_pasajeros;
CREATE POLICY "viajepasajeros_conductor_select" ON public.viaje_pasajeros
FOR SELECT TO authenticated
USING (
  get_auth_rol() = 'CONDUCTOR' AND is_conductor_assigned_to_viaje(viaje_id)
);

DROP POLICY IF EXISTS "viajepasajeros_conductor_update" ON public.viaje_pasajeros;
CREATE POLICY "viajepasajeros_conductor_update" ON public.viaje_pasajeros
FOR UPDATE TO authenticated
USING (
  get_auth_rol() = 'CONDUCTOR' AND is_conductor_assigned_to_viaje(viaje_id)
);

-- TABLA: pasajeros
DROP POLICY IF EXISTS "pasajeros_conductor_select" ON public.pasajeros;
CREATE POLICY "pasajeros_conductor_select" ON public.pasajeros
FOR SELECT TO authenticated
USING (
  get_auth_rol() = 'CONDUCTOR' AND is_pasajero_assigned_to_conductor(id)
);

-- TABLA: eventos_viaje
DROP POLICY IF EXISTS "eventos_conductor_select" ON public.eventos_viaje;
CREATE POLICY "eventos_conductor_select" ON public.eventos_viaje
FOR SELECT TO authenticated
USING (
  get_auth_rol() = 'CONDUCTOR' AND is_conductor_assigned_to_viaje(viaje_id)
);

-- TABLA: incidencias
DROP POLICY IF EXISTS "incidencias_conductor_insert" ON public.incidencias;
CREATE POLICY "incidencias_conductor_insert" ON public.incidencias
FOR INSERT TO authenticated
WITH CHECK (
  get_auth_rol() = 'CONDUCTOR' AND is_conductor_assigned_to_viaje(viaje_id)
);

-- TABLA: tracking_positions
DROP POLICY IF EXISTS "tracking_conductor_insert" ON public.tracking_positions;
CREATE POLICY "tracking_conductor_insert" ON public.tracking_positions
FOR INSERT TO authenticated
WITH CHECK (
  get_auth_rol() = 'CONDUCTOR' AND conductor_id = get_auth_conductor_id() AND is_conductor_assigned_to_viaje(viaje_id)
);

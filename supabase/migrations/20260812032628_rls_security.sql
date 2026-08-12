-- Habilitar RLS en todas las tablas
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes_corporativos ENABLE ROW LEVEL SECURITY;
ALTER TABLE sedes ENABLE ROW LEVEL SECURITY;
ALTER TABLE centros_costo ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios_cliente_b2b ENABLE ROW LEVEL SECURITY;
ALTER TABLE pasajeros ENABLE ROW LEVEL SECURITY;
ALTER TABLE conductores ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE viajes ENABLE ROW LEVEL SECURITY;
ALTER TABLE viaje_pasajeros ENABLE ROW LEVEL SECURITY;
ALTER TABLE asignaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos_viaje ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE avisos ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspecciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditoria ENABLE ROW LEVEL SECURITY;

-- ==============================================================================================
-- 1. FUNCIONES HELPERS SECURE (SECURITY DEFINER)
-- ==============================================================================================
CREATE OR REPLACE FUNCTION get_auth_perfil_id()
RETURNS UUID LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT id FROM perfiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$;
REVOKE ALL ON FUNCTION get_auth_perfil_id FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_auth_perfil_id TO authenticated;

CREATE OR REPLACE FUNCTION get_auth_rol()
RETURNS TEXT LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT rol FROM perfiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$;
REVOKE ALL ON FUNCTION get_auth_rol FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_auth_rol TO authenticated;

CREATE OR REPLACE FUNCTION get_auth_conductor_id()
RETURNS UUID LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT id FROM conductores WHERE perfil_id = get_auth_perfil_id() LIMIT 1;
$$;
REVOKE ALL ON FUNCTION get_auth_conductor_id FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_auth_conductor_id TO authenticated;

CREATE OR REPLACE FUNCTION get_b2b_cliente_id()
RETURNS UUID LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT cliente_corporativo_id FROM usuarios_cliente_b2b WHERE perfil_id = get_auth_perfil_id() LIMIT 1;
$$;
REVOKE ALL ON FUNCTION get_b2b_cliente_id FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_b2b_cliente_id TO authenticated;

-- ==============================================================================================
-- 2. POLÍTICAS RLS
-- ==============================================================================================

-- PERFILES
CREATE POLICY "perfiles_admin_all" ON perfiles FOR ALL TO authenticated USING (get_auth_rol() = 'ADMIN');
CREATE POLICY "perfiles_ops_select" ON perfiles FOR SELECT TO authenticated USING (get_auth_rol() = 'OPERACIONES');
CREATE POLICY "perfiles_self_select" ON perfiles FOR SELECT TO authenticated USING (id = get_auth_perfil_id());

-- CLIENTES CORPORATIVOS
CREATE POLICY "clientes_admin_ops_all" ON clientes_corporativos FOR ALL TO authenticated USING (get_auth_rol() IN ('ADMIN', 'OPERACIONES'));
CREATE POLICY "clientes_dispatcher_select" ON clientes_corporativos FOR SELECT TO authenticated USING (get_auth_rol() = 'DISPATCHER');
CREATE POLICY "clientes_b2b_select" ON clientes_corporativos FOR SELECT TO authenticated USING (id = get_b2b_cliente_id());

-- SEDES
CREATE POLICY "sedes_admin_ops_all" ON sedes FOR ALL TO authenticated USING (get_auth_rol() IN ('ADMIN', 'OPERACIONES'));
CREATE POLICY "sedes_dispatcher_select" ON sedes FOR SELECT TO authenticated USING (get_auth_rol() = 'DISPATCHER');
CREATE POLICY "sedes_b2b_select" ON sedes FOR SELECT TO authenticated USING (cliente_corporativo_id = get_b2b_cliente_id());
CREATE POLICY "sedes_b2b_insert" ON sedes FOR INSERT TO authenticated WITH CHECK (cliente_corporativo_id = get_b2b_cliente_id() AND get_auth_rol() = 'CLIENTE_B2B');
CREATE POLICY "sedes_b2b_update" ON sedes FOR UPDATE TO authenticated USING (cliente_corporativo_id = get_b2b_cliente_id() AND get_auth_rol() = 'CLIENTE_B2B') WITH CHECK (cliente_corporativo_id = get_b2b_cliente_id());

-- CENTROS_COSTO
CREATE POLICY "centros_admin_ops_all" ON centros_costo FOR ALL TO authenticated USING (get_auth_rol() IN ('ADMIN', 'OPERACIONES'));
CREATE POLICY "centros_dispatcher_select" ON centros_costo FOR SELECT TO authenticated USING (get_auth_rol() = 'DISPATCHER');
CREATE POLICY "centros_b2b_select" ON centros_costo FOR SELECT TO authenticated USING (cliente_corporativo_id = get_b2b_cliente_id());
CREATE POLICY "centros_b2b_insert" ON centros_costo FOR INSERT TO authenticated WITH CHECK (cliente_corporativo_id = get_b2b_cliente_id() AND get_auth_rol() = 'CLIENTE_B2B');
CREATE POLICY "centros_b2b_update" ON centros_costo FOR UPDATE TO authenticated USING (cliente_corporativo_id = get_b2b_cliente_id() AND get_auth_rol() = 'CLIENTE_B2B') WITH CHECK (cliente_corporativo_id = get_b2b_cliente_id());

-- USUARIOS CLIENTE B2B
CREATE POLICY "usub2b_admin_all" ON usuarios_cliente_b2b FOR ALL TO authenticated USING (get_auth_rol() = 'ADMIN');
CREATE POLICY "usub2b_ops_select" ON usuarios_cliente_b2b FOR SELECT TO authenticated USING (get_auth_rol() = 'OPERACIONES');
CREATE POLICY "usub2b_self_select" ON usuarios_cliente_b2b FOR SELECT TO authenticated USING (cliente_corporativo_id = get_b2b_cliente_id());

-- PASAJEROS
CREATE POLICY "pasajeros_admin_ops_all" ON pasajeros FOR ALL TO authenticated USING (get_auth_rol() IN ('ADMIN', 'OPERACIONES'));
CREATE POLICY "pasajeros_dispatcher_select" ON pasajeros FOR SELECT TO authenticated USING (get_auth_rol() = 'DISPATCHER');
CREATE POLICY "pasajeros_conductor_select" ON pasajeros FOR SELECT TO authenticated USING (
  get_auth_rol() = 'CONDUCTOR' AND EXISTS (SELECT 1 FROM viaje_pasajeros vp JOIN asignaciones a ON a.viaje_id = vp.viaje_id WHERE vp.pasajero_id = pasajeros.id AND a.conductor_id = get_auth_conductor_id())
);
CREATE POLICY "pasajeros_b2b_select" ON pasajeros FOR SELECT TO authenticated USING (cliente_corporativo_id = get_b2b_cliente_id());
CREATE POLICY "pasajeros_b2b_insert" ON pasajeros FOR INSERT TO authenticated WITH CHECK (cliente_corporativo_id = get_b2b_cliente_id() AND get_auth_rol() = 'CLIENTE_B2B');
CREATE POLICY "pasajeros_b2b_update" ON pasajeros FOR UPDATE TO authenticated USING (cliente_corporativo_id = get_b2b_cliente_id() AND get_auth_rol() = 'CLIENTE_B2B') WITH CHECK (cliente_corporativo_id = get_b2b_cliente_id());

-- CONDUCTORES
CREATE POLICY "conductores_admin_ops_disp_all" ON conductores FOR ALL TO authenticated USING (get_auth_rol() IN ('ADMIN', 'OPERACIONES', 'DISPATCHER'));
CREATE POLICY "conductores_self_select" ON conductores FOR SELECT TO authenticated USING (perfil_id = get_auth_perfil_id());

-- VEHICULOS
CREATE POLICY "vehiculos_admin_ops_disp_all" ON vehiculos FOR ALL TO authenticated USING (get_auth_rol() IN ('ADMIN', 'OPERACIONES', 'DISPATCHER'));
CREATE POLICY "vehiculos_conductor_select" ON vehiculos FOR SELECT TO authenticated USING (
  get_auth_rol() = 'CONDUCTOR' AND EXISTS (SELECT 1 FROM asignaciones a WHERE a.vehiculo_id = vehiculos.id AND a.conductor_id = get_auth_conductor_id())
);

-- VIAJES
CREATE POLICY "viajes_admin_ops_disp_all" ON viajes FOR ALL TO authenticated USING (get_auth_rol() IN ('ADMIN', 'OPERACIONES', 'DISPATCHER'));
CREATE POLICY "viajes_conductor_select" ON viajes FOR SELECT TO authenticated USING (
  get_auth_rol() = 'CONDUCTOR' AND EXISTS (SELECT 1 FROM asignaciones a WHERE a.viaje_id = viajes.id AND a.conductor_id = get_auth_conductor_id())
);
CREATE POLICY "viajes_b2b_select" ON viajes FOR SELECT TO authenticated USING (cliente_corporativo_id = get_b2b_cliente_id());

-- ASIGNACIONES
CREATE POLICY "asignaciones_admin_ops_disp_all" ON asignaciones FOR ALL TO authenticated USING (get_auth_rol() IN ('ADMIN', 'OPERACIONES', 'DISPATCHER'));
CREATE POLICY "asignaciones_conductor_select" ON asignaciones FOR SELECT TO authenticated USING (conductor_id = get_auth_conductor_id());

-- VIAJE PASAJEROS
CREATE POLICY "viajepasajeros_admin_ops_disp_all" ON viaje_pasajeros FOR ALL TO authenticated USING (get_auth_rol() IN ('ADMIN', 'OPERACIONES', 'DISPATCHER'));
CREATE POLICY "viajepasajeros_conductor_select" ON viaje_pasajeros FOR SELECT TO authenticated USING (
  get_auth_rol() = 'CONDUCTOR' AND EXISTS (SELECT 1 FROM asignaciones a WHERE a.viaje_id = viaje_pasajeros.viaje_id AND a.conductor_id = get_auth_conductor_id())
);
CREATE POLICY "viajepasajeros_conductor_update" ON viaje_pasajeros FOR UPDATE TO authenticated USING (
  get_auth_rol() = 'CONDUCTOR' AND EXISTS (SELECT 1 FROM asignaciones a WHERE a.viaje_id = viaje_pasajeros.viaje_id AND a.conductor_id = get_auth_conductor_id())
);
CREATE POLICY "viajepasajeros_b2b_select" ON viaje_pasajeros FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM pasajeros p WHERE p.id = viaje_pasajeros.pasajero_id AND p.cliente_corporativo_id = get_b2b_cliente_id())
);

-- EVENTOS VIAJE
CREATE POLICY "eventos_admin_ops_disp_all" ON eventos_viaje FOR ALL TO authenticated USING (get_auth_rol() IN ('ADMIN', 'OPERACIONES', 'DISPATCHER'));
CREATE POLICY "eventos_conductor_select" ON eventos_viaje FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM asignaciones a WHERE a.viaje_id = eventos_viaje.viaje_id AND a.conductor_id = get_auth_conductor_id())
);
CREATE POLICY "eventos_b2b_select" ON eventos_viaje FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM viajes v WHERE v.id = eventos_viaje.viaje_id AND v.cliente_corporativo_id = get_b2b_cliente_id())
);

-- INCIDENCIAS
CREATE POLICY "incidencias_admin_ops_disp_all" ON incidencias FOR ALL TO authenticated USING (get_auth_rol() IN ('ADMIN', 'OPERACIONES', 'DISPATCHER'));
CREATE POLICY "incidencias_conductor_insert" ON incidencias FOR INSERT TO authenticated WITH CHECK (
  get_auth_rol() = 'CONDUCTOR' AND EXISTS (SELECT 1 FROM asignaciones a WHERE a.viaje_id = incidencias.viaje_id AND a.conductor_id = get_auth_conductor_id())
);
CREATE POLICY "incidencias_b2b_select" ON incidencias FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM viajes v WHERE v.id = incidencias.viaje_id AND v.cliente_corporativo_id = get_b2b_cliente_id())
);

-- AVISOS
CREATE POLICY "avisos_admin_ops_disp_all" ON avisos FOR ALL TO authenticated USING (get_auth_rol() IN ('ADMIN', 'OPERACIONES', 'DISPATCHER'));
CREATE POLICY "avisos_conductor_all" ON avisos FOR ALL TO authenticated USING (
  get_auth_rol() = 'CONDUCTOR' AND (remitente_perfil_id = get_auth_perfil_id() OR destinatario_perfil_id = get_auth_perfil_id())
);
CREATE POLICY "avisos_b2b_select" ON avisos FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM viajes v WHERE v.id = avisos.viaje_id AND v.cliente_corporativo_id = get_b2b_cliente_id())
);

-- INSPECCIONES
CREATE POLICY "inspecciones_admin_ops_all" ON inspecciones FOR ALL TO authenticated USING (get_auth_rol() IN ('ADMIN', 'OPERACIONES'));
CREATE POLICY "inspecciones_disp_select" ON inspecciones FOR SELECT TO authenticated USING (get_auth_rol() = 'DISPATCHER');
CREATE POLICY "inspecciones_conductor_insert" ON inspecciones FOR INSERT TO authenticated WITH CHECK (conductor_id = get_auth_conductor_id());
CREATE POLICY "inspecciones_conductor_select" ON inspecciones FOR SELECT TO authenticated USING (conductor_id = get_auth_conductor_id());

-- TRACKING POSITIONS
CREATE POLICY "tracking_admin_ops_all" ON tracking_positions FOR ALL TO authenticated USING (get_auth_rol() IN ('ADMIN', 'OPERACIONES'));
CREATE POLICY "tracking_disp_select" ON tracking_positions FOR SELECT TO authenticated USING (get_auth_rol() = 'DISPATCHER');
CREATE POLICY "tracking_conductor_insert" ON tracking_positions FOR INSERT TO authenticated WITH CHECK (
  get_auth_rol() = 'CONDUCTOR' AND conductor_id = get_auth_conductor_id() AND EXISTS (SELECT 1 FROM asignaciones a WHERE a.viaje_id = tracking_positions.viaje_id AND a.conductor_id = get_auth_conductor_id())
);
CREATE POLICY "tracking_b2b_select" ON tracking_positions FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM viajes v WHERE v.id = tracking_positions.viaje_id AND v.cliente_corporativo_id = get_b2b_cliente_id())
);

-- TRACKING TOKENS
CREATE POLICY "tokens_admin_all" ON tracking_tokens FOR ALL TO authenticated USING (get_auth_rol() = 'ADMIN');
CREATE POLICY "tokens_ops_disp_select" ON tracking_tokens FOR SELECT TO authenticated USING (get_auth_rol() IN ('OPERACIONES', 'DISPATCHER'));

-- AUDITORIA
CREATE POLICY "auditoria_admin_select" ON auditoria FOR SELECT TO authenticated USING (get_auth_rol() = 'ADMIN');

-- ==============================================================================================
-- 3. FUNCIONES DE PERFIL Y SEGURIDAD (RPC)
-- ==============================================================================================
CREATE OR REPLACE FUNCTION update_my_profile(p_nombre_completo TEXT, p_telefono TEXT DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE perfiles SET nombre_completo = p_nombre_completo, updated_at = now() WHERE id = get_auth_perfil_id();
  UPDATE conductores SET nombre_completo = p_nombre_completo, telefono = COALESCE(p_telefono, telefono), updated_at = now() WHERE perfil_id = get_auth_perfil_id();
END;
$$;
REVOKE ALL ON FUNCTION update_my_profile FROM PUBLIC;
GRANT EXECUTE ON FUNCTION update_my_profile TO authenticated;

-- ==============================================================================================
-- 4. PUBLIC RPC PARA TRACKING (PASAJERO ANON/PUBLIC)
-- ==============================================================================================
CREATE OR REPLACE FUNCTION get_tracking_by_token(p_token_hash TEXT)
RETURNS TABLE (latitud DOUBLE PRECISION, longitud DOUBLE PRECISION, velocidad DOUBLE PRECISION, registrado_en TIMESTAMP WITH TIME ZONE, viaje_estado TEXT, vehiculo_patente TEXT)
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT tp.latitud, tp.longitud, tp.velocidad, tp.registrado_en, v.estado as viaje_estado, veh.patente as vehiculo_patente
  FROM tracking_tokens tt
  JOIN viajes v ON v.id = tt.viaje_id
  JOIN asignaciones a ON a.viaje_id = v.id
  JOIN vehiculos veh ON veh.id = a.vehiculo_id
  LEFT JOIN LATERAL (SELECT latitud, longitud, velocidad, registrado_en FROM tracking_positions WHERE viaje_id = v.id ORDER BY registrado_en DESC LIMIT 1) tp ON true
  WHERE tt.token_hash = p_token_hash AND tt.expires_at > now() AND tt.revoked_at IS NULL;
$$;
GRANT EXECUTE ON FUNCTION get_tracking_by_token TO anon, authenticated;

-- ==============================================================================================
-- 5. TRIGGER: CREAR PERFIL DESDE AUTH.USERS
-- ==============================================================================================
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.perfiles (auth_user_id, email, nombre_completo, rol, estado)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)), 'CONDUCTOR', 'inactivo');
  RETURN new;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

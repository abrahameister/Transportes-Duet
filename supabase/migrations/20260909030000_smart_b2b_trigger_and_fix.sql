-- ==============================================================================
-- MIGRACION: DETECCION INTELIGENTE B2B EN TRIGGER Y CORRECCION DE PERFILES
-- ==============================================================================

-- 1. Actualizar inmediatamente perfiles que pertenezcan a clientes corporativos
UPDATE public.perfiles p
SET 
    rol = 'CLIENTE_B2B',
    estado = 'activo',
    updated_at = now()
FROM public.clientes_corporativos c
WHERE LOWER(p.email) = LOWER(c.contacto_email)
   OR p.id IN (SELECT perfil_id FROM public.usuarios_cliente_b2b);

-- Asegurar vinculacion en usuarios_cliente_b2b para esos perfiles
INSERT INTO public.usuarios_cliente_b2b (perfil_id, cliente_corporativo_id)
SELECT p.id, c.id
FROM public.perfiles p
JOIN public.clientes_corporativos c ON LOWER(p.email) = LOWER(c.contacto_email)
ON CONFLICT (perfil_id, cliente_corporativo_id) DO NOTHING;

-- 2. Trigger mejorado: si el email coincide con un cliente corporativo o trae metadata B2B
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_rol TEXT;
  v_nombre TEXT;
  v_estado TEXT;
  v_cliente_id UUID;
  v_perfil_id UUID;
BEGIN
  -- 1. Intentar obtener rol de user_metadata o app_metadata
  v_rol := COALESCE(
    NULLIF(trim(new.raw_user_meta_data->>'rol'), ''),
    NULLIF(trim(new.raw_app_meta_data->>'rol'), '')
  );

  -- 2. Si no viene rol en metadata, verificar si el email corresponde a un cliente corporativo B2B
  SELECT id INTO v_cliente_id
  FROM public.clientes_corporativos
  WHERE LOWER(contacto_email) = LOWER(new.email)
  LIMIT 1;

  IF v_cliente_id IS NOT NULL THEN
    v_rol := 'CLIENTE_B2B';
    v_estado := 'activo';
  ELSIF v_rol IS NOT NULL AND v_rol != '' THEN
    v_estado := 'activo';
  ELSE
    v_rol := 'CONDUCTOR';
    v_estado := 'activo'; -- Los nuevos usuarios quedan activos para evitar bucles de login
  END IF;

  -- Validar que el rol sea valido
  IF v_rol NOT IN ('ADMIN', 'OPERACIONES', 'DISPATCHER', 'CONDUCTOR', 'CLIENTE_B2B') THEN
    v_rol := 'CONDUCTOR';
  END IF;

  v_nombre := COALESCE(
    NULLIF(trim(new.raw_user_meta_data->>'nombre_completo'), ''),
    NULLIF(trim(new.raw_user_meta_data->>'nombre'), ''),
    split_part(new.email, '@', 1)
  );

  -- Insertar o actualizar perfil
  INSERT INTO public.perfiles (auth_user_id, email, nombre_completo, rol, estado)
  VALUES (new.id, new.email, v_nombre, v_rol, v_estado)
  ON CONFLICT (email) DO UPDATE
    SET
      auth_user_id    = EXCLUDED.auth_user_id,
      nombre_completo = CASE
        WHEN EXCLUDED.nombre_completo != split_part(EXCLUDED.email, '@', 1)
        THEN EXCLUDED.nombre_completo
        ELSE perfiles.nombre_completo
      END,
      rol             = EXCLUDED.rol,
      estado          = EXCLUDED.estado,
      updated_at      = now()
  RETURNING id INTO v_perfil_id;

  -- Si es cliente B2B y tenemos su empresa, asegurar vinculacion
  IF v_cliente_id IS NOT NULL AND v_perfil_id IS NOT NULL THEN
    INSERT INTO public.usuarios_cliente_b2b (perfil_id, cliente_corporativo_id)
    VALUES (v_perfil_id, v_cliente_id)
    ON CONFLICT (perfil_id, cliente_corporativo_id) DO NOTHING;
  END IF;

  RETURN new;
END;
$func$;

-- Recrear el trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();
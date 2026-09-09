-- ==============================================================================
-- MIGRACION: FIX AUTENTICACION CLIENTE_B2B
-- Problema: handle_new_user crea perfiles con rol='CONDUCTOR' y estado='inactivo'
--           pisando el rol correcto que asigna la Edge Function invite-b2b.
-- Solucion: El trigger ahora respeta raw_user_meta_data.rol si viene informado.
--           Garantiza que inviteUserByEmail produce perfil activo con rol correcto.
-- ==============================================================================

-- 1. REEMPLAZAR trigger handle_new_user con version que respeta metadata
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rol TEXT;
  v_nombre TEXT;
  v_estado TEXT;
BEGIN
  -- Leer rol y nombre desde raw_user_meta_data (lo que envia invite-b2b)
  v_rol    := COALESCE(NULLIF(trim(new.raw_user_meta_data->>'rol'), ''), 'CONDUCTOR');
  v_nombre := COALESCE(
    NULLIF(trim(new.raw_user_meta_data->>'nombre_completo'), ''),
    NULLIF(trim(new.raw_user_meta_data->>'nombre'), ''),
    split_part(new.email, '@', 1)
  );

  -- Roles validos; fallback a CONDUCTOR si viene uno invalido
  IF v_rol NOT IN ('ADMIN', 'OPERACIONES', 'DISPATCHER', 'CONDUCTOR', 'CLIENTE_B2B') THEN
    v_rol := 'CONDUCTOR';
  END IF;

  -- Si el usuario fue invitado (tiene metadata de rol), se marca activo.
  -- Si llego sin metadata de rol, queda inactivo hasta activacion manual.
  IF new.raw_user_meta_data->>'rol' IS NOT NULL AND trim(new.raw_user_meta_data->>'rol') != '' THEN
    v_estado := 'activo';
  ELSE
    v_estado := 'inactivo';
  END IF;

  -- Insertar perfil. Si ya existe por email (creado por invite-b2b antes del trigger),
  -- solo actualiza auth_user_id, rol y estado si el registro no tenia auth_user_id.
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
    WHERE perfiles.auth_user_id IS NULL OR perfiles.auth_user_id = EXCLUDED.auth_user_id;

  RETURN new;
END;
$$;

-- Recrear el trigger (DROP IF EXISTS para idempotencia)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();

-- 2. POLITICA RLS: perfiles_b2b_self_select
-- CLIENTE_B2B necesita poder leer su propio perfil por auth_user_id (para enrichAndResolveUser).
-- La policy existente "perfiles_self_select" filtra por id = get_auth_perfil_id(),
-- pero get_auth_perfil_id() requiere que ya exista el perfil, causando bootstrap problem.
-- Esta nueva policy usa auth.uid() directamente, sin depender de la funcion helper.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'perfiles'
      AND policyname = 'perfiles_b2b_self_select'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "perfiles_b2b_self_select"
        ON perfiles
        FOR SELECT
        TO authenticated
        USING (auth_user_id = auth.uid())
    $policy$;
  END IF;
END;
$$;

-- 3. Asegurar que CLIENTE_B2B puede leer su vinculacion en usuarios_cliente_b2b
--    (necesario para que get_b2b_cliente_id() funcione correctamente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'usuarios_cliente_b2b'
      AND policyname = 'usub2b_b2b_self_select'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "usub2b_b2b_self_select"
        ON usuarios_cliente_b2b
        FOR SELECT
        TO authenticated
        USING (perfil_id = get_auth_perfil_id())
    $policy$;
  END IF;
END;
$$;
-- ==============================================================================
-- MIGRACION: FIX PERFILES B2B EXISTENTES CON ROL/ESTADO INCORRECTO
-- Ejecutar en produccion ocacitnhmeqvduwqszpj via SQL Editor del Dashboard
-- ==============================================================================

-- 1. Corregir perfiles que quedaron con rol o estado incorrecto
--    para usuarios que ya tienen vinculacion en usuarios_cliente_b2b
UPDATE public.perfiles p
SET
  rol        = 'CLIENTE_B2B',
  estado     = 'activo',
  updated_at = now()
FROM public.usuarios_cliente_b2b u
WHERE u.perfil_id = p.id
  AND (p.rol != 'CLIENTE_B2B' OR p.estado != 'activo');

-- 2. Corregir perfiles sin auth_user_id asignado
--    (el trigger viejo a veces no lo vinculaba correctamente)
UPDATE public.perfiles p
SET
  auth_user_id = au.id,
  updated_at   = now()
FROM auth.users au
WHERE au.email = p.email
  AND p.auth_user_id IS NULL;

-- 3. Verificacion: listar usuarios B2B con su estado actual
SELECT
  p.email,
  p.rol,
  p.estado,
  p.auth_user_id IS NOT NULL AS tiene_auth_user,
  u.cliente_corporativo_id
FROM public.perfiles p
LEFT JOIN public.usuarios_cliente_b2b u ON u.perfil_id = p.id
WHERE p.rol = 'CLIENTE_B2B'
ORDER BY p.email;
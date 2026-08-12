-- Migración correctiva para revocar permisos excesivos otorgados previamente
-- Se revoca el acceso a tablas a 'anon' para que solo pueda interactuar mediante RPC
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;

-- Aseguramos que 'anon' solo pueda ejecutar la función de tracking
GRANT EXECUTE ON FUNCTION public.get_public_tracking_info TO anon;

-- authenticated mantiene los permisos básicos, y la seguridad se delega a RLS
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

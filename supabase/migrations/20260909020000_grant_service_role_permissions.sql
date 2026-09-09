-- ==============================================================================
-- MIGRACION: PRIVILEGIOS SERVICE_ROLE PARA EDGE FUNCTIONS
-- Error resuelto: permission denied for table perfiles (code: 42501)
-- Las Edge Functions autenticadas con SUPABASE_SERVICE_ROLE_KEY necesitan
-- permisos DML explicitos sobre las tablas del esquema public.
-- ==============================================================================

GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA public TO service_role;

-- Asegurar que futuras tablas creadas tambien tengan permisos para service_role
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO service_role;
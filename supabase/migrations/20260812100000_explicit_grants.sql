-- Migración para otorgar permisos explícitos a los roles Data API
-- Esto es necesario porque los proyectos nuevos en Supabase (Agosto 2026) 
-- no exponen automáticamente las tablas nuevas a los roles anon y authenticated.

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

# Security Hardening - Neira Transportes

## 1. Separación de Entornos (DEV / PROD)
La plataforma no debe mezclar datos de prueba con operaciones reales.
- **Entorno DEV**: 
  - Hosteado en Supabase (Free Tier actual).
  - Usado para desarrollo, pruebas unitarias y E2E locales, y despliegues en *Netlify Deploy Previews*.
- **Entorno PROD**:
  - Debe crearse un proyecto Supabase **nuevo y separado**.
  - Migrado desde cero aplicando los scripts SQL en `supabase/migrations/` ordenados por fecha.
  - Conectado **únicamente** al entorno de Producción de Netlify (`main` branch deploy).

## 2. Secrets y Variables de Entorno
- **Frontend (Vite)**: Solo recibe `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. Estas claves son públicas y seguras de exponer siempre que el RLS esté bien configurado.
- **Backend (Edge Functions / Testing)**: Variables como `SUPABASE_SERVICE_ROLE_KEY` o `DATABASE_URL` no deben exponerse bajo ningún motivo en repositorios ni en la configuración de Netlify.
  
*Nota:* En la revisión (Sprint 11) se eliminaron URLs y Anon Keys hardcodeadas en el código fuente. Aunque la Anon Key es pública, como buena práctica se requiere rotar la Anon Key antes del Go-Live si el proyecto actual pasará a producción, o mejor aún, crear el proyecto nuevo (PROD).

## 3. Netlify Hardening
El archivo `netlify.toml` incluye directivas para proteger la aplicación:
- `Strict-Transport-Security (HSTS)`: Fuerza conexión HTTPS.
- `Content-Security-Policy: frame-ancestors 'none'`: Mitiga ataques Clickjacking/UI Redressing impidiendo embeber el portal en iframes no autorizados.
- `X-XSS-Protection` & `X-Content-Type-Options`: Previene sniffing de MIME types y ataques XSS básicos.

## 4. Row Level Security (RLS)
- El acceso directo (`anon` y `authenticated`) a la DB está fuertemente regulado.
- Todas las lógicas de negocio complejas (Planificación, KPIs) utilizan RPCs marcados como `SECURITY DEFINER SET search_path = public`, lo cual impide la inyección o manipulación de schema, validando internamente la autorización antes de ejecutar.

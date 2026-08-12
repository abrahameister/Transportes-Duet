# Disaster Recovery - Neira Transportes

La estrategia de recuperación de desastres se basa en la criticidad operacional.

## 1. Evaluación del Plan Supabase
Actualmente, el desarrollo corre en **Supabase Free**.
- **Limitación CRÍTICA**: El plan Free se pausa tras 1 semana de inactividad. Los respaldos se gestionan mediante volcados básicos y no hay recuperación Point-In-Time (PITR).
- **Decisión para Go-Live**: Es indispensable actualizar el entorno de producción a **Supabase Pro** ($25/mes). 

## 2. Backups (Supabase Pro)
Al activar Pro, Neira Transportes contará con:
- Respaldos diarios automáticos con **7 días de retención** por defecto.
- Posibilidad de habilitar PITR, permitiendo restaurar la base de datos al segundo exacto antes de un error catastrófico (por ejemplo, un UPDATE erróneo).

## 3. Procedimiento de Restauración
En caso de pérdida de datos en Producción:
1. Acceder al dashboard de Supabase (Pro).
2. Navegar a `Database` -> `Backups`.
3. Seleccionar el Snapshot deseado (o la hora en PITR).
4. Ejecutar la restauración (el servicio puede tardar de 5 a 15 minutos en volver a estar online).
5. Informar a los Conductores que sincronicen (refresquen) su aplicación tras la restauración para reenviar eventos en memoria.

## 4. Netlify Fallback
Si el Frontend cae por una falla catastrófica en Netlify, el código está totalmente integrado en GitHub Actions. Bastará con apuntar el repositorio a un proveedor alternativo (Vercel, Cloudflare Pages o AWS Amplify), proveer las variables de entorno (`VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`) y compilar.

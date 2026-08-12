# PRODUCTION READINESS AUDIT

## 1. ARQUITECTURA ACTUAL

La plataforma actual está dividida en un frontend (React, Vite, TypeScript, Tailwind) y un backend basado en Supabase/PostgreSQL.

- **Frontend (`web-portal/`)**:
  - React 19, Vite, TypeScript.
  - Dependencias incluyen `@supabase/supabase-js`, `lucide-react`, `tailwindcss`.
  - Scripts configurados: `dev`, `build`, `lint`, `preview`. *No hay configuración de tests unitarios o e2e.*
- **Backend (`database/` y Supabase)**:
  - Base de datos en PostgreSQL a través de Supabase.
  - 11 tablas relacionales identificadas.
  - No se detecta uso de Edge Functions ni RPCs en el repositorio (solo DDL).

## 2. MAPA FUNCIONAL Y ESTADO

### Clasificación de funcionalidades:

| Funcionalidad | Estado | Comentarios |
| --- | --- | --- |
| **Modelos de Datos DB** | **REAL / INSECURE** | Las tablas existen (`vehiculos_flota`, `conductores_wfm`, `viajes_operativa`, etc.) pero el RLS es inexistente (USING true). |
| **Integración Frontend-Backend** | **PARTIAL / MOCK** | El frontend tiene un cliente `supabase.ts`, pero el contexto global (`AppContext.tsx`), portales y reportes cargan desde `lib/mockData.ts`. |
| **Portal B2B** | **LOCAL-ONLY** | `ClientPortalB2B.tsx` usa `FUNCIONARIOS_MOCK_INITIAL` y `TURNOS_MOCK` guardados en memoria con `useState`. |
| **Portal Admin / KPIs** | **MOCK** | `AdminPortal.tsx` carga métricas desde `getWFMStats` de mockData. |
| **Operación Viajes y Asignación** | **MOCK** | Basado en el estado inicial hardcoded de `mockViajesIniciales`. |
| **Seguridad RLS y Permisos** | **INSECURE** | `GRANT ALL ON ALL TABLES... TO anon` y políticas `USING (true)`. Modificar y leer datos de cualquier empresa o usuario está abierto. |
| **Ciclo de Auth (Login/Signup)** | **PARTIAL / INSECURE** | Existe un `LoginView.tsx` pero no hay un flujo completo ni validación estricta que limite el acceso a roles específicos en DB. |
| **GPS / ETA / Tracking** | **MISSING / MOCK** | No hay registro de posición real, solo campos en DB sin integración de dispositivo, y el tracking público no tiene validación criptográfica visible. |

## 3. VULNERABILIDADES CRÍTICAS (SECURITY)

1. **RLS Inseguro (P0)**: Todas las políticas en `01_schema_wfm_pro.sql` son `USING(true) WITH CHECK(true)`, lo cual permite que un usuario anónimo o cualquier cliente lea/edite datos operacionales completos.
2. **Privilegios Excesivos (P0)**: `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;` abre el acceso al API pública por completo.
3. **Persistencia Basada en UI (P1)**: Cambios en el frontend (como asignar viajes o crear B2B) sobreviven únicamente en la memoria local (React state) perdiéndose en cada refresh.
4. **Validaciones en Cliente (P1)**: Las transiciones de estado de los viajes y autorizaciones parecen no estar validadas por base de datos, dejando el sistema vulnerable a manipulación mediante manipulación de API.

## 4. DEUDA TÉCNICA E INCONSISTENCIAS DB

- **Mocks Abundantes**: El frontend está construido fuertemente en torno a `lib/mockData.ts`, lo que tomará tiempo desacoplar para inyectar un servicio de Supabase real.
- **Ausencia de Tests**: No hay infraestructura para correr `npm run test` ni `test:e2e`. Cualquier cambio requiere verificación manual, lo cual ralentizará la transición a producción.
- **Datos Hardcoded en Contexto Global**: El `AppContext.tsx` actúa como una base de datos local temporal, un antipatrón en una plataforma operacional.
- **Campos en Frontend y DB Incompatibles**: Al haber crecido el UI con mocks, es probable que la estructura JSON consumida por los componentes no coincida exactamente con las columnas SQL creadas.

## 5. PRIORIZACIÓN (P0 / P1 / P2 / P3)

### P0 (Blockers de Operación y Seguridad)
- Remover políticas `USING(true)` y establecer RLS por rol y `cliente_corporativo_id`.
- Reemplazar el `anon GRANT` por un esquema de Auth estricto.
- Crear el modelo canónico de DB alineando frontend y backend, eliminando dependencias de `mockData.ts`.

### P1 (Core Business Logic)
- Persistencia real del ciclo de vida del Viaje (estado: solicitado -> finalizado) sin `setState` local.
- Login y roles seguros en Supabase Auth.

### P2 (Operaciones y Tracking)
- Portal B2B conectado a BD.
- Tracking token público y lectura desde BD.
- Operación Offline del conductor (IndexedDB / LocalStorage).

### P3 (Optimización)
- Dashboard de KPIs consultado en views SQL o RPC (no renderizado local).

## 6. DEPENDENCIAS ENTRE PROBLEMAS

1. **No se puede arreglar el Frontend sin estabilizar la DB**: Hay que definir la BD canónica (Sprint 1) antes de eliminar los mocks del UI.
2. **No se puede tener un viaje real sin Auth (Sprint 2/3)**: Para asignar RLS y autorizar, el Driver, Dispatcher y Admin deben tener un `auth.uid()` válido y roles bien definidos.
3. **No se pueden crear KPIs reales sin Viajes Transaccionales**: Los datos del dashboard dependen enteramente del motor de viajes persistido (Sprint 4).

## 7. ROADMAP RECOMENDADO

El roadmap proporcionado por el usuario es arquitectónicamente correcto, ya que aborda las dependencias clave en el orden correcto:

1. **Sprint 1 (DB)**: Consolidación de tablas.
2. **Sprint 2 y 3 (Auth/RLS)**: Bloqueo de las puertas y autenticación.
3. **Sprint 4 (Viajes)**: Motor persistente, eliminando `mockData.ts` para viajes.
4. **Sprint 5 y 6 (Tracking/Driver)**: Flujo de GPS, Offline y Pasajeros.
5. **Sprint 7, 8, 9 (Negocio Expandido)**: B2B, KPIs reales y Notificaciones.
6. **Sprint 10 y 11 (Endurance)**: Testing, CI/CD, Seguridad.
7. **Sprint 12 (Certificación)**: Validaciones finales de Producción.

## CONCLUSIÓN (DONE)

El sistema actual es, a efectos prácticos, una maqueta interactiva avanzada con un esquema de base de datos preliminar que no está totalmente interconectado ni asegurado. Cumple con los requerimientos visuales pero **carece de integridad operacional, seguridad y persistencia real**.

La plataforma no está lista para producción, pero el plan de acción (Sprint 1 en adelante) resolverá estas brechas.

## CURRENT STATUS AFTER SPRINT 7

### Problemas Resueltos del Baseline Histórico
- **Sprint 1 (DB):** Se creó un modelo canónico limpio, single-tenant, y se eliminaron las tablas duplicadas e inconsistentes.
- **Sprint 2 (RLS):** Se implementó RLS estricto basado en roles y `cliente_corporativo_id`. Se eliminaron los permisos inseguros y el `GRANT ALL`.
- **Sprint 3 (Auth):** Se consolidó el flujo de autenticación, integrando Supabase Auth y validación de usuarios reales sin mocks.
- **Sprint 4 (Trip Engine):** Se migró el ciclo de vida de los viajes a RPCs transaccionales (`createTrip`, `startTrip`, etc.), eliminando la dependencia de estados en memoria.
- **Sprint 5 (Driver Operations):** Se dotó de GPS real y tolerancia offline (IndexedDB) a la app del conductor, permitiendo registrar abordajes y no-shows.
- **Sprint 6 (Passenger Tracking):** Se construyó el seguimiento de pasajeros **solo lectura** mediante token encriptado (`hash`) y polling (sin realtime complejo ni ETAs falsos).
- **Sprint 7 (B2B + Turnos):** Se implementó el portal corporativo B2B permitiendo la carga masiva de Rol de Turnos vía Excel, persistiendo en la nueva tabla `turnos_pasajeros` y respetando el aislamiento por cliente.

### Componentes Pendientes (Próximo Bloque Funcional)
El principal bloque funcional pendiente es:
**PLANIFICACIÓN DE RUTAS Y ASIGNACIÓN ASISTIDA (Sprint 8)**
La demanda cargada en `turnos_pasajeros` (S7) debe transformarse en `viajes` agrupados, asignando vehículos y conductores antes del despacho operativo.
Posteriormente quedará pendiente la generación de KPIs y métricas operacionales (Sprint 9).

## CURRENT STATUS AFTER SPRINT 10

### Sprint 10 (Testing + CI/CD):
- **Pruebas Unitarias (Vitest)**: Cobertura del motor lógico de `RoutePlanner`.
- **Smoke Tests E2E (Playwright)**: Validaciones base para Auth, Portal B2B, Torre de Control y Tracking Público (Ruta `/live-track/:token`).
- **DB Tests Remotos**: Creado `pg-run-tests.js` para ejecutar `pgTAP` de forma segura contra Supabase DEV sin Docker.
- **CI/CD Pipeline**: Configurado GitHub Actions (`.github/workflows/ci.yml`) con un job robusto que corre linting, typechecking y tests unitarios.

## CURRENT STATUS AFTER SPRINT 11

### Sprint 11 (Production Hardening):
- **Secured Environments**: `.env.example` purgado de variables legacy/worker. Los secretos duros (URLs del backend viejo) han sido limpiados de `supabase.ts`. Las credenciales de `SUPABASE_SERVICE_ROLE_KEY` del backend anterior requerirán rotación si se re-activa el backend viejo, aunque actualmente no se emplean en el Frontend.
- **Netlify Headers**: `netlify.toml` endurecido con `Strict-Transport-Security` y `Content-Security-Policy: frame-ancestors 'none'`.
- **Estrategia DEV/PROD**: Oficializada la separación. Producción deberá operar bajo un entorno Supabase PROD totalmente nuevo, excluyendo datos de prueba.
- **Backups & Continuidad**: Documentado el riesgo de operar en Free Tier y establecida la migración a Supabase Pro (Backups diarios, PITR) como paso fundamental de Go-Live.
- **Políticas Operacionales**: Creados `SECURITY_HARDENING.md`, `OPERATIONS.md` y `DISASTER_RECOVERY.md` para asentar PII, retención de GPS (30 días) y recuperación ante desastres sin añadir sobrecarga de backend.
- **Validación Local**: Build y tests (Vitest) 100% limpios. E2E listo para despliegues.

## CURRENT STATUS AFTER SPRINT 12

### Sprint 12 (Go-Live Certification):
- **Supabase PROD**: Proyecto `ocacitnhmeqvduwqszpj` (Neira Transportes PROD) creado, 8 migraciones aplicadas, 19 tablas vacías, RLS confirmado, sin datos demo.
- **Usuario ADMIN**: `abraham.ramirez@duetsolutions.cl` creado vía invitación Supabase Auth, perfil vinculado con `rol=ADMIN, estado=activo`.
- **Auth PROD configurada**: Site URL y Redirect URLs apuntando a `https://duetgo.netlify.app`.
- **CLI seguridad**: Supabase CLI re-vinculado a DEV tras aplicar migraciones en PROD.
- **Separación DEV/PROD**: Confirmada y documentada. Netlify Production → PROD; Deploy Previews → DEV.
- **Certificación**: `docs/PRODUCTION_CERTIFICATION.md` creado → **READY** (para capacitaciones y piloto controlado).
- **Pendiente antes de deploy final**: Configurar variables de entorno Production en Netlify dashboard y hacer push/merge a `main`.
- **Pendiente antes de operación real**: Activar Supabase Pro (backups automáticos).


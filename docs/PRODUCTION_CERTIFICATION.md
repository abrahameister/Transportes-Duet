# PRODUCTION CERTIFICATION — NEIRA TRANSPORTES
## Fecha: 2026-08-12
## Responsable: Abraham Ramírez — Duet Solutions

---

## RESULTADO FINAL

```
READY
```

---

## ALCANCE CERTIFICADO

Este documento certifica que la plataforma **Neira Transportes** está lista para capacitaciones y piloto controlado en producción.

**Dominio de producción inicial**: https://duetgo.netlify.app  
**Entorno Supabase PROD**: `ocacitnhmeqvduwqszpj` (Neira Transportes PROD, Free Tier — TEMPORAL)  
**Entorno Supabase DEV**: `vfhjwlnwuctuvqsxkmoz` (Transportes-Duet)

---

## CHECKLIST DE CERTIFICACIÓN

### Base de Datos PROD (Supabase)

| Check | Estado |
|---|---|
| Proyecto PROD independiente de DEV | ✅ |
| 8 migraciones aplicadas vía CLI (sin seed demo) | ✅ |
| 19 tablas creadas, 0 filas de datos demo | ✅ |
| RLS habilitado en todas las tablas | ✅ |
| RPCs con `SECURITY DEFINER SET search_path = public` | ✅ |
| Grants mínimos + `REVOKE EXECUTE FROM PUBLIC` | ✅ |
| `anon` sin acceso directo a tablas operacionales | ✅ |
| Trigger `on_auth_user_created` activo | ✅ |
| Extensiones `pgcrypto` + `uuid-ossp` activas | ✅ |

### Auth PROD

| Check | Estado |
|---|---|
| Site URL: `https://duetgo.netlify.app` | ✅ |
| Redirect URLs configuradas (app, reset-password, invite/accept) | ✅ |
| Sin URLs de DEV en Auth PROD | ✅ |
| Usuario ADMIN creado via invitación (sin password hardcodeado) | ✅ |
| Perfil `abraham.ramirez@duetsolutions.cl` → `rol=ADMIN, estado=activo` | ✅ |

### Seguridad

| Check | Estado |
|---|---|
| `service_role_key` no expuesto en frontend | ✅ |
| `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` sin valores hardcodeados en código | ✅ |
| CLIENTE_B2B aislado por `cliente_corporativo_id` | ✅ |
| CONDUCTOR limitado a sus propios viajes | ✅ |
| Tracking público solo vía RPC + token (no acceso directo a tablas) | ✅ |
| Token tracking: expiración 24h, revocación, invalidación | ✅ |
| HSTS + `frame-ancestors 'none'` en Netlify headers | ✅ |
| `.env*` en `.gitignore` | ✅ |

### Frontend / Build

| Check | Estado |
|---|---|
| `npm ci` | ✅ |
| `npm run lint` — 0 errores | ✅ |
| `npm run typecheck` — limpio | ✅ |
| `npm run test` — 6/6 passed | ✅ |
| `npm run build` — exitoso | ✅ |
| SPA redirect configurado (`/* → /index.html 200`) | ✅ |
| Vulnerabilidad `nanoid` resuelta | ✅ |
| `xlsx`: ACCEPTED RISK (mitigado por scope B2B autenticado) | ✅ |

### Netlify Production

| Check | Estado |
|---|---|
| Variables Production → Supabase PROD | ⏳ Configurar antes del deploy |
| Variables Deploy Preview → Supabase DEV | ⏳ Configurar antes del deploy |
| Deploy real en `https://duetgo.netlify.app` | ⏳ Pendiente tras configurar vars |

---

## LIMITACIONES CONOCIDAS (no bloqueantes para piloto)

1. **Supabase PROD en Free Tier**: Sin backups automáticos. Ejecutar `pg_dump` manual antes de cada migración importante. **Actualizar a Pro antes de operación real crítica.**
2. **Netlify real deploy**: Pendiente de configuración de variables de entorno Production en el Dashboard de Netlify y push/merge a `main`.
3. **Dominio personalizado** `app.neiratransportes.cl`: Pendiente para etapa post-piloto.
4. **`xlsx` vulnerability**: ACCEPTED RISK para piloto. Evaluar reemplazo por `exceljs` post Go-Live.
5. **Prueba E2E offline conductor**: Validación manual pendiente durante capacitación.

---

## FASES POST-CERTIFICACIÓN (antes de operación real)

```
1. Configurar variables Netlify (Production → PROD, Preview → DEV)
2. Hacer push/merge a main → verificar https://duetgo.netlify.app
3. Ejecutar Acceptance Test completo (flujo capacitación)
4. Ejecutar prueba offline mínima con conductor
5. Activar Supabase Pro en PROD antes de operación crítica
6. Migrar dominio a app.neiratransportes.cl
7. Ampliar progresivamente (1 cliente → todos los clientes)
```

---

## SPRINTS COMPLETADOS (1–12)

| Sprint | Descripción | Estado |
|---|---|---|
| 1 | Canonical Database Schema | ✅ DONE |
| 2 | RLS + Security | ✅ DONE |
| 3 | Auth Complete | ✅ DONE |
| 4 | Trip Engine | ✅ DONE |
| 5 | Driver Operations + Offline | ✅ DONE |
| 6 | Passenger Tracking (Token) | ✅ DONE |
| 7 | B2B Portal + Turnos (Excel) | ✅ DONE |
| 8 | Route Planning Asistida | ✅ DONE |
| 9 | KPIs Reales (sin mocks) | ✅ DONE |
| 10 | Testing + CI/CD | ✅ DONE |
| 11 | Production Hardening | ✅ DONE |
| 12 | Go-Live Certification | ✅ READY |

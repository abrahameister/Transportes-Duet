# GO-LIVE CHECKLIST — NEIRA TRANSPORTES
## Dominio Piloto: https://duetgo.netlify.app
## Fecha: _________________   Responsable: _________________

---

## FASE 1 — PRE-DEPLOYMENT

### GitHub / CI
- [ ] Repositorio conectado a Netlify
- [ ] Branch `main` configurada como Production
- [ ] GitHub Actions CI (`ci.yml`) pasa en la rama antes del merge
- [ ] Deploy Previews habilitadas en Netlify

### Supabase PROD
- [ ] Proyecto PROD creado (Free Tier — TEMPORAL)
- [ ] Project Ref PROD confirmado: `___________________`
- [ ] **NOTA**: PROD Free no tiene backups automáticos. Activar Pro antes de operación real.

### Auth PROD Configurada
- [ ] Site URL: `https://duetgo.netlify.app`
- [ ] Redirect URL: `https://duetgo.netlify.app/app`
- [ ] Redirect URL: `https://duetgo.netlify.app/reset-password`
- [ ] Redirect URL: `https://duetgo.netlify.app/invite/accept`
- [ ] URLs de DEV no incluidas en Auth PROD

### Migraciones PROD (Supabase CLI)
- [ ] `supabase link --project-ref <PROD_REF>` ejecutado
- [ ] Project ref vinculado verificado (`supabase projects list`)
- [ ] `supabase db push --dry-run` — output revisado y aprobado
- [ ] `supabase db push` ejecutado exitosamente
- [ ] 8 migraciones aplicadas en orden correcto
- [ ] Tablas verificadas en Dashboard PROD
- [ ] RLS activo en todas las tablas (19 tablas)
- [ ] RPCs verificados en Database → Functions
- [ ] Trigger `on_auth_user_created` existe
- [ ] Extensiones `pgcrypto` y `uuid-ossp` activas

### Usuario ADMIN Inicial
- [ ] Verificado si `abraham.ramirez@duetsolutions.cl` existe en `auth.users` PROD
- [ ] Si existe: perfil relacionado correctamente via `auth_user_id`
- [ ] Si no existe: usuario invitado vía Supabase Auth Dashboard
- [ ] Perfil actualizado: `rol = 'ADMIN'`, `estado = 'activo'`
- [ ] Login ADMIN verificado en PROD

### Netlify Variables de Entorno
- [ ] `VITE_SUPABASE_URL` — scope **Production** → valor PROD
- [ ] `VITE_SUPABASE_ANON_KEY` — scope **Production** → valor PROD
- [ ] `VITE_SUPABASE_URL` — scope **Deploy Previews** → valor DEV
- [ ] `VITE_SUPABASE_ANON_KEY` — scope **Deploy Previews** → valor DEV
- [ ] No existe `SUPABASE_SERVICE_ROLE_KEY` ni `DATABASE_URL` en Netlify

### Build Local Final
- [ ] `npm ci` — OK
- [ ] `npm run lint` — 0 errores
- [ ] `npm run typecheck` — OK
- [ ] `npm run test` — 6/6 PASS
- [ ] `npm run build` — OK

---

## FASE 2 — DEPLOYMENT

### Deploy Preview (si disponible)
- [ ] PR o branch de prueba desplegada como Preview
- [ ] URL Preview apunta a Supabase DEV (verificar con login)
- [ ] SPA redirect funciona en Preview (refresh en /app no da 404)
- [ ] Sin errores graves en consola del navegador

### Production Deploy
- [ ] Merge/push a `main` ejecutado
- [ ] Netlify Production build exitoso
- [ ] URL: `https://duetgo.netlify.app` accesible

### Verificación Post-Deploy
- [ ] `https://duetgo.netlify.app/` — carga sin error
- [ ] `https://duetgo.netlify.app/login` — página de login visible
- [ ] `https://duetgo.netlify.app/app` — redirige a login si no hay sesión
- [ ] Refresh directo en `/app/alguna-ruta` — no da 404 (SPA redirect activo)
- [ ] `https://duetgo.netlify.app/live-track/token-invalido` — error controlado (no 500 crudo)
- [ ] Consola del navegador sin errores críticos (CORS, 401 inesperados, JS crashes)
- [ ] Login con usuario ADMIN → portal carga correctamente
- [ ] Supabase PROD conectado (no DEV)

---

## FASE 3 — ACCEPTANCE TEST (Capacitación)

### A. ADMIN
- [ ] Login exitoso
- [ ] Portal Admin visible
- [ ] KPIs cargan (vacíos o con datos iniciales de capacitación)

### B. CLIENTE_B2B (usuario de capacitación)
- [ ] Login exitoso
- [ ] Portal B2B visible — solo datos de su empresa
- [ ] Carga Excel con turnos de capacitación (3–5 filas)
- [ ] Turnos persistidos en `turnos_pasajeros` tras refresh de página
- [ ] No puede ver datos de otro cliente

### C. OPERACIONES
- [ ] Login → portal Operaciones / Planificación
- [ ] Ve demanda del cliente de capacitación
- [ ] Genera planificación (IDA + REGRESO separados)
- [ ] Propuesta muestra pasajeros, rutas, sedes
- [ ] Selecciona conductor y vehículo
- [ ] Confirma → viajes creados en DB
- [ ] Genera link de tracking para pasajero

### D. CONDUCTOR
- [ ] Login → portal Conductor
- [ ] Ve el viaje asignado del día
- [ ] Ve lista de pasajeros
- [ ] Inicia servicio (EN_CAMINO)
- [ ] Llega al punto (EN_PUNTO)
- [ ] Registra abordaje de pasajero
- [ ] Inicia ruta (EN_RUTA) — GPS activo si hay dispositivo
- [ ] Finaliza viaje (FINALIZADO)

### E. PASAJERO (tracking público)
- [ ] Abre link de tracking en incógnito (sin login)
- [ ] Ve estado del viaje, nombre conductor, patente vehículo
- [ ] Ve posición GPS (si conductor envió coordenadas)
- [ ] NO ve RUT, teléfono, dirección completa, ni lista de pasajeros
- [ ] Token inválido → muestra error controlado (no información operacional)
- [ ] Token expirado → muestra error controlado

### F. CLIENTE_B2B (historial)
- [ ] Ve el viaje de capacitación como FINALIZADO
- [ ] KPIs B2B reflejan la operación

### G. ADMIN (KPIs finales)
- [ ] Dashboard muestra viajes completados del día
- [ ] pasajeros_movilizados actualizado
- [ ] Sin métricas mock o cero artificiales

---

## FASE 4 — PRUEBA OFFLINE CONDUCTOR
- [ ] Conductor conectado → carga servicio
- [ ] Corta red (WiFi off, datos off)
- [ ] Registra acción (abordaje u otro)
- [ ] App muestra estado "Pendiente sincronización"
- [ ] Reconecta red
- [ ] Acción sincronizada sin duplicarse
- [ ] Estado reflejado en DB

---

## FASE 5 — SEGURIDAD FINAL
- [ ] CLIENTE_B2B de empresa A no puede ver datos de empresa B (probar login cruzado)
- [ ] Conductor no puede ver viajes de otro conductor
- [ ] Token de tracking de un pasajero no expone info de otro viaje
- [ ] Acceso directo a tabla vía Supabase API con anon_key → bloqueado por RLS
- [ ] `service_role_key` no aparece en ningún bundle JS del frontend (inspeccionar Sources)

---

## FASE 6 — CERTIFICACIÓN FINAL
- [ ] Todos los checks de Fases 1–5 completados
- [ ] Docs de backup manual confirmados
- [ ] Datos de capacitación identificados y registrados (para limpieza futura)
- [ ] `docs/PRODUCTION_CERTIFICATION.md` creado

### Resultado:
```
READY / NOT READY: _______________
Fecha: ___________________________
Responsable: _____________________
Observaciones: ___________________
```

---

## FASE 7 — POST GO-LIVE (Antes de Operación Real)
- [ ] Evaluar upgrade Supabase Pro (backups automáticos, PITR)
- [ ] Confirmar dominio `app.neiratransportes.cl` y migrar Netlify + Auth URLs
- [ ] Eliminar o reemplazar datos de capacitación si corresponde
- [ ] Evaluar reemplazo de `xlsx` por `exceljs`
- [ ] Ampliar a todos los clientes corporativos de forma progresiva

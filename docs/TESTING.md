# Guía de Testing y CI/CD - Neira Transportes

Esta plataforma adopta una estrategia de pruebas pragmática, priorizando los flujos de negocio críticos sobre la cobertura porcentual artificial.

**IMPORTANTE: DOCKER NO ES REQUISITO**. Todos los tests de base de datos se ejecutan directamente contra el proyecto Supabase DEV remoto, y todas las validaciones de frontend no asumen contenedores locales.

## 1. Pruebas Unitarias (Frontend)
Utilizamos **Vitest** para probar la lógica de negocio pura que no requiere base de datos.
- **Ubicación:** `web-portal/src/**/*.test.ts`
- **Componentes críticos testeados:** 
  - `RoutePlanner` (`routePlanner.test.ts`): Agrupación por sede, capacidad, ida/regreso.
- **Ejecución local:**
  ```bash
  cd web-portal
  npm run test
  ```

## 2. Pruebas E2E (Smoke Tests)
Utilizamos **Playwright** para verificar que las rutas principales renderizan y responden de forma segura.
- **Ubicación:** `web-portal/e2e/*.spec.ts`
- **Flujos:** Auth, Operaciones (Planificación), B2B (Turnos) y Tracking público.
- **Ejecución local:**
  ```bash
  cd web-portal
  # Instalar navegadores si es la primera vez: npx playwright install chromium
  TEST_USER=admin@neira.cl TEST_PASSWORD=secreto npm run test:e2e
  ```
- *Nota:* Playwright no se ejecuta bloqueando la CI para no requerir secretos hardcodeados ni fallar por latencia de UI en entornos gratuitos.

## 3. Pruebas de Base de Datos y RLS (Supabase Remoto)
El framework utilizado es **pgTAP**. Los archivos están en `supabase/tests/database/`.
- Dado que no usamos Docker, existe un script de Node ligero para ejecutarlas contra DEV remoto.
- **Ejecución Remota:**
  ```bash
  cd supabase/tests/database
  DATABASE_URL="postgresql://postgres.[PROYECTO]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres" node pg-run-tests.js
  ```
- *Aislamiento garantizado:* Se verifica RLS (Conductor no ve a otro conductor, B2B aislado).

## 4. CI/CD (GitHub Actions)
Archivo: `.github/workflows/ci.yml`
Pipeline único de calidad que se ejecuta en `pull_request` y `push` a `main`:
1. `npm ci`
2. `npm run lint`
3. `npm run typecheck`
4. `npm run test` (Unit)
5. `npm run build`

Si cualquiera de estos pasos falla, el build se rompe impidiendo un pase a Netlify erróneo.

## 5. Limitaciones y Riesgos Restantes
- **E2E Offline:** No está automatizado en Playwright el flujo offline/IndexedDB debido a la complejidad de mockear Service Workers y el estado de la red sin introducir fragilidad excesiva. Esta prueba sigue siendo **MANUAL**.
- **Supabase DEV compartido:** Las pruebas `pgTAP` remotas pueden fallar si alguien elimina las filas fixture usadas. No se corren automáticamente en cada `push` para evitar conflictos en concurrencia.

# AGENTS.md — TRANSPORTES DUET

## PRODUCT CONTEXT

Transportes Duet es una plataforma operacional SINGLE-TENANT.

Existe UNA sola empresa transportista.

La empresa transportista administra:

* clientes corporativos
* usuarios internos
* conductores
* vehículos
* viajes
* pasajeros
* operaciones
* incidencias
* GPS
* reportes

Jerarquía:

TRANSPORTISTA
├── Usuarios internos
│   ├── ADMIN
│   ├── OPERACIONES
│   └── DISPATCHER
├── Conductores
├── Vehículos
└── Clientes corporativos
├── Usuarios B2B
└── Pasajeros / colaboradores

Los clientes corporativos son empresas que contratan los servicios de transporte.

Los pasajeros son colaboradores/personas pertenecientes a esos clientes corporativos.

NO modelar Transportes Duet como SaaS multi-tenant.

NO crear:

* tenant_id
* múltiples empresas transportistas
* memberships de tenants
* aislamiento entre transportistas
* SUPER_ADMIN SaaS

La separación de información relevante es por:

cliente_corporativo_id

Ejemplo:

Transportista
→ Cliente corporativo
→ Pasajeros
→ Viajes
→ Conductor + Vehículo

## STACK

Frontend:

* React
* Vite
* TypeScript

Backend:

* Supabase
* PostgreSQL
* Supabase Auth
* Edge Functions
* Realtime

Hosting:

* Netlify

## DOMAIN MODEL

El modelo conceptual esperado incluye como mínimo:

perfiles
clientes_corporativos
usuarios_cliente_b2b
pasajeros
conductores
vehiculos
viajes
viaje_pasajeros
asignaciones
eventos_viaje
incidencias
avisos
inspecciones
tracking_positions
tracking_tokens
auditoria

Agregar otras entidades solo cuando sean necesarias por el dominio.

## AUTHENTICATION MODEL

Usuarios autenticados:

ADMIN
OPERACIONES
DISPATCHER
CONDUCTOR
CLIENTE_B2B

Los pasajeros NO necesitan necesariamente una cuenta Supabase.

El pasajero debe poder acceder a información limitada de su viaje mediante un tracking token temporal y seguro.

## AUTHORIZATION

ADMIN:
acceso completo a la operación.

OPERACIONES:
gestión operacional según permisos definidos.

DISPATCHER:
gestión de viajes, asignaciones y despacho.

CONDUCTOR:
solo servicios y datos necesarios para sus viajes asignados.

CLIENTE_B2B:
solo puede acceder a información perteneciente a su cliente_corporativo_id.

PASAJERO:
solo puede acceder mediante token a la información mínima correspondiente a su viaje.

Nunca confiar en el frontend como autoridad.

RLS y backend son responsables de la autorización.

## CORE ENGINEERING RULES

Antes de modificar código:

1. Inspeccionar implementación existente.
2. Revisar archivos directamente relacionados.
3. Identificar dependencias.
4. Corregir arquitectura incorrecta antes de agregar nuevas capas.

Nunca:

* inventar tablas sin revisar las existentes
* duplicar modelos
* usar mocks como implementación final
* usar datos hardcoded operacionales
* usar setState como persistencia
* usar role=admin como fallback
* ocultar errores reales con fallbacks falsos
* marcar una feature como productiva si no persiste
* confiar únicamente en controles de UI para seguridad
* crear múltiples modelos SQL contradictorios

Cambios DB:
→ migración versionada.

Operaciones críticas:
→ backend transaccional.

Operaciones susceptibles a retry:
→ idempotencia.

Cambios funcionales:
→ tests.

## SOURCE OF TRUTH

Prioridad:

1. PostgreSQL / Supabase
2. lógica backend
3. estado sincronizado frontend

El frontend no debe convertirse en fuente de verdad para datos operacionales.

## TRIP DOMAIN

La plataforma debe soportar como mínimo:

crear viaje
validar viaje
asignar conductor
asignar vehículo
despachar
iniciar viaje
llegar al punto
registrar abordajes
registrar no-show
reportar incidencia
solicitar rescate
reasignar
finalizar
cancelar

Las transiciones válidas deben controlarse desde backend.

## PERSISTENCE

Después de refresh deben mantenerse:

* viajes
* asignaciones
* pasajeros
* abordajes
* checklists
* inspecciones
* incidencias
* estados
* GPS relevante
* avisos
* eventos

## OFFLINE

Cuando el conductor pierda conexión:

* no perder operaciones
* persistir acciones pendientes localmente
* sincronizar al recuperar conectividad
* utilizar idempotency keys
* manejar conflictos explícitamente

## SECURITY RULES

Nunca permitir:

* usuario cambiando su propio rol
* CLIENTE_B2B accediendo a otro cliente
* conductor consultando viajes ajenos
* pasajero enumerando viajes
* token público sin expiración
* acceso anónimo a información operacional interna
* GRANT ALL innecesario
* policies USING(true) en producción

Aplicar mínimo privilegio.

## PERSONAL DATA

Considerar PII:

* nombre
* RUT/documento
* teléfono
* dirección
* ubicación GPS

Aplicar:

* minimización
* acceso por necesidad
* retención razonable
* auditoría

## DEVELOPMENT PROCESS

Para cada Sprint:

1. INSPECT
2. IDENTIFY
3. IMPLEMENT
4. TEST
5. BUILD
6. VERIFY
7. DOCUMENT

No analizar todo el repositorio nuevamente salvo que sea necesario.

Primero leer:

1. AGENTS.md
2. documentación relacionada
3. archivos directamente afectados

## DEFINITION OF DONE

Una funcionalidad está DONE solamente si:

* funciona
* persiste
* sobrevive refresh
* está autorizada
* maneja errores
* tiene tests adecuados
* no usa mocks
* no usa hardcoding operacional
* no rompe otros roles
* build pasa
* documentación necesaria actualizada

## MANDATORY VALIDATION

Antes de terminar cada Sprint ejecutar cuando existan:

npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build

Además ejecutar tests DB/RLS cuando el Sprint afecte Supabase.

## SCOPE CONTROL

Trabaja únicamente dentro del Sprint solicitado.

No hagas refactors masivos fuera del alcance salvo que sean necesarios para corregir una dependencia bloqueante.

No agregues funcionalidades del Sprint siguiente.

## FINAL RESPONSE FORMAT

Al terminar cada Sprint responde de forma concisa:

DONE
CHANGES
DB
SECURITY
TESTS
BUILD
RISKS
NEXT

No vuelvas a explicar todo el sistema.

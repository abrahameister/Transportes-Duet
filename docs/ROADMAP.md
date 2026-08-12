# NEIRA TRANSPORTES — ROADMAP DEMO → PRODUCCIÓN

---

# SPRINT 1 — CANONICAL DATABASE

## OBJECTIVE
Crear UNA sola arquitectura PostgreSQL/Supabase coherente (SINGLE-TENANT).
Eliminar modelos SQL contradictorios y dependencias de arquitecturas multi-tenant (tenant_id).

## DOMAIN MODEL
Entidades: `perfiles`, `clientes_corporativos`, `usuarios_cliente_b2b`, `pasajeros`, `conductores`, `vehiculos`, `viajes`, `viaje_pasajeros`, `asignaciones`, `eventos_viaje`, `incidencias`, `avisos`, `tracking_positions`, `tracking_tokens`, `auditoria`, `sedes`, `centros_costo`, `turnos_pasajeros`.

## DONE
* un único modelo canónico sin tenant_id.
* db reset funciona con dependencias correctas.
* frontend apunta al nuevo modelo.

---

# SPRINT 2 — SECURITY + RLS

## OBJECTIVE
Implementar autorización real en Supabase (RLS). Aislar operaciones estrictamente.

## ROLES
ADMIN, OPERACIONES, DISPATCHER, CONDUCTOR, CLIENTE_B2B (aislado a su cliente_corporativo_id), PASAJERO (Solo lectura vía Token, sin credenciales).

## DONE
La seguridad se mantiene incluso manipulando directamente requests a Supabase. CLIENTE A no ve CLIENTE B.

---

# SPRINT 3 — AUTH COMPLETE

## OBJECTIVE
Hacer completo el ciclo de cuentas para los roles definidos (ADMIN, OPERACIONES, DISPATCHER, CONDUCTOR, CLIENTE_B2B).

## DONE
El ciclo completo (login, reset, session refresh, auth.users enlazado) funciona sin modificar manualmente la DB. Roles duros y mocks fueron eliminados.

---

# SPRINT 4 — TRIP ENGINE

## OBJECTIVE
Convertir viajes en un motor operacional persistente y transaccional mediante RPCs.

## STATE MACHINE
SOLICITADO, VALIDADO, ASIGNADO, DESPACHADO, EN_CAMINO, EN_PUNTO, ABORDANDO, EN_RUTA, FINALIZADO, CANCELADO, INCIDENCIA, RESCATE_SOLICITADO.

## DONE
Refresh o cierre del navegador no cambia el estado real del viaje. Todas las transiciones están autorizadas y validadas por el backend.

---

# SPRINT 5 — DRIVER OPERATIONS

## OBJECTIVE
Convertir la interfaz conductor en herramienta operacional real con GPS y soporte offline (idb).

## IMPLEMENT
* servicios del día, detalle viaje.
* offline driver cache, pending_actions, gps_queue.
* iniciar servicio, llegada a punto, abordaje, no-show, incidencia.
* sync al reconectar.

## DONE
La pérdida de conexión no elimina acciones operacionales. GPS real envía coordenadas operativas.

---

# SPRINT 6 — PASSENGER TRACKING

## OBJECTIVE
Crear tracking público real para pasajeros de sólo lectura.

## TOKEN
Token seguro generado por admin, almacenado como hash, entregado al pasajero como `/live-track/:token`.

## FEATURES
* READ ONLY. Polling cada 15 segundos para ubicación y estado del vehículo.
* SIN acciones del pasajero. SIN ETA falso. SIN mapas simulados ni módulos de emergencia complejos.

## DONE
Un pasajero puede seguir su servicio desde móvil de forma segura y minimizada.

---

# SPRINT 7 — CORPORATE B2B + TURNOS

## OBJECTIVE
Convertir portal cliente B2B en producto funcional enfocado en la carga de demanda (Rol de Turnos).

## CLIENTE B2B
Solo gestiona sus pasajeros, sedes y programación de turnos de su corporación.

## IMPORT XLSX
Carga del archivo de turnos, parse, validación y persistencia.

## TURNOS PASAJEROS
Tabla `turnos_pasajeros`.
Campos críticos: `fecha`, `hora_entrada` (hora objetivo en el lugar de trabajo, NO hora de recogida), `hora_salida` (hora para comenzar el regreso), `direccion`, `sede`.

## DONE
El portal B2B permite parsear el Excel de turnos, validar y guardar la demanda de pasajeros de forma segura en `turnos_pasajeros` aislada por su corporación, sin generar aún los viajes individuales.

---

# SPRINT 8 — ROUTE PLANNING

## OBJECTIVE
Transformar la demanda alojada en `turnos_pasajeros` en propuestas de rutas operacionales.

## INPUT
`turnos_pasajeros`, direcciones, sedes, hora_entrada, hora_salida, vehículos y conductores disponibles.

## FUNCIONES ESPERADAS
- separar demanda IDA y REGRESO.
- agrupar pasajeros por horario compatible y cercanía geográfica.
- respetar capacidad del vehículo.
- proponer orden de recogida.
- proponer vehículo y conductor.
- permitir revisión manual de Operaciones.
- confirmar propuesta.
- crear viajes reales en `viajes` únicamente después de la confirmación manual.

## IMPORTANTE
La primera versión debe ser planificación ASISTIDA. No construir optimizador automático enterprise. Operaciones siempre revisa y modifica antes de confirmar y gatillar la creación de los viajes transaccionales.

---

# SPRINT 9 — KPIs + SLA

## OBJECTIVE
Eliminar métricas mock y usar datos reales post-operacionales.

## KPIs
- viajes programados, activos, finalizados, cancelados.
- no-shows, incidencias.
- cumplimiento SLA / puntualidad.
- costos básicos.

## DONE
Dashboard B2B y Admin reflejan el estado histórico y real basado en consultas a la base de datos (eliminados los mocks).

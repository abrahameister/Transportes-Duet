# DATABASE ARCHITECTURE

## CONCEPTUAL MODEL (SINGLE-TENANT)
NEIRA TRANSPORTES opera bajo un modelo SINGLE-TENANT. No existe `tenant_id` en las tablas.
La separación de información para los diferentes clientes se realiza exclusivamente a través de la llave foránea `cliente_corporativo_id`.

## ENTIDADES PRINCIPALES

### 1. Perfiles (`perfiles`)
Almacena los usuarios internos de la empresa de transportes.
Roles permitidos: `ADMIN`, `OPERACIONES`, `DISPATCHER`, `CONDUCTOR`, `CLIENTE_B2B`.
Esta tabla se puede enlazar con `auth.users` de Supabase.

### 2. Clientes Corporativos (`clientes_corporativos`)
Empresas del aeropuerto Concepción o Región del Biobío que contratan los servicios.
A partir de esta entidad cuelga toda la información separada (B2B).

### 3. Sedes y Centros de Costo (`sedes`, `centros_costo`)
Permiten a los clientes corporativos clasificar y agrupar sus viajes y pasajeros.

### 4. Usuarios Cliente B2B (`usuarios_cliente_b2b`)
Usuarios autenticados que administran el portal de un cliente corporativo. Tienen un `perfil_id` (con rol `CLIENTE_B2B`) y están asociados a un `cliente_corporativo_id`.
**Nota:** Estos usuarios son los administradores del portal del cliente, distintos de los pasajeros.

### 5. Pasajeros (`pasajeros`)
Colaboradores del cliente corporativo que abordarán los vehículos.
Pueden tener sede y centro de costo asociado.

### 6. Turnos de Pasajeros (`turnos_pasajeros`)
Entidad central que captura la demanda operativa (Rol de turnos) cargada por el B2B.
- `id`
- `cliente_corporativo_id`
- `pasajero_id`
- `sede_id`
- `fecha`
- `hora_entrada`: Hora objetivo en que el pasajero debe estar en su lugar de trabajo (NO es la hora de recogida).
- `hora_salida`: Hora desde la cual el pasajero puede comenzar su transporte de regreso.
- `direccion_recogida`
- `estado`
- `created_at`
- `updated_at`

**Flujo Operacional:**
Cliente corporativo → Pasajeros → Turnos Pasajeros → Planificación → Rutas → Viajes → Asignación Conductor/Vehículo.

### 7. Flota (`conductores`, `vehiculos`)
Administración de choferes y vehículos operativos de NEIRA TRANSPORTES.

### 8. Viajes (`viajes`)
El motor central de la plataforma, originado tras la planificación de turnos. Cada viaje pertenece a un cliente corporativo y tiene un estado de ciclo de vida (`solicitado`, `asignado`, `en_ruta`, `finalizado`, etc.).

### 9. Manifiesto Operacional (`viaje_pasajeros`)
Tabla intermedia (N:M) entre viajes y pasajeros. Almacena el estado de abordaje de cada pasajero (`pendiente`, `abordado`, `no_show`).

### 10. Asignaciones (`asignaciones`)
Historial o registro activo de qué conductor y vehículo fueron asignados a un viaje. Permite manejar cambios de vehículo sin alterar el registro del viaje original.

### 11. Bitácoras y Telemetría (`eventos_viaje`, `incidencias`, `avisos`)
Log inmutable de cambios de estado, reporte de incidencias por viaje y mensajería operativa (avisos).
*(La tabla `inspecciones` si existe históricamente, no se utiliza operativamente y es candidata a limpieza).*

### 12. GPS y Tracking (`tracking_positions`, `tracking_tokens`)
Posiciones geográficas reportadas por los conductores, y tokens encriptados (`hash`) con expiración para el **Tracking Público de Pasajeros (READ-ONLY)**. El pasajero solo visualiza el estado y no tiene ETA ficticio ni interacción para modificar el viaje.

### 13. Auditoría (`auditoria`)
Historial de cambios críticos (INSERT, UPDATE, DELETE) independiente de `eventos_viaje`.

## CONSTRAINTS Y POLÍTICAS DE BORRADO
Se ha evitado el uso de `ON DELETE CASCADE` de forma indiscriminada.
Las relaciones estructurales (ej. Cliente -> Viajes) utilizan `ON DELETE RESTRICT` para evitar pérdida accidental de datos operacionales.
Las relaciones opcionales (ej. Viaje -> Sede) utilizan `ON DELETE SET NULL`.

## VERIFICATION STRATEGY (NO DOCKER)
El sistema utiliza un entorno Supabase DEV remoto para validar la arquitectura:
1. `npx supabase db reset --linked --yes` (aplica migraciones y seed)
2. `npm run build` para typecheck del portal web.

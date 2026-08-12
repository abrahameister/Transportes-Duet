# SECURITY MODEL & RLS MATRIX

Este documento define la matriz completa de permisos por Rol a nivel de base de datos para la plataforma NEIRA TRANSPORTES. Toda la seguridad está garantizada a nivel de PostgreSQL utilizando Row Level Security (RLS) basado en `auth.uid()`.

## Roles

* **ADMIN**: Acceso administrativo total de la transportista.
* **OPERACIONES**: Acceso a la operación general, pero limitado en administración de seguridad/roles.
* **DISPATCHER**: Focalizado en lectura necesaria y uso posterior para planificación, asignaciones y estados de viaje.
* **CONDUCTOR**: Extremadamente aislado a sus propios servicios asignados. No necesita gestionar turnos directamente.
* **CLIENTE_B2B**: Aislado obligatoriamente a los datos que referencien su `cliente_corporativo_id`.
* **PASAJERO (ANON)**: No autenticado, acceso vía Token en RPC (solo lectura, no tiene acceso directo a tablas vía REST). NO existen RPC públicas para modificar estado del pasajero.

---

## Matriz RLS por Tabla

| Tabla | ADMIN | OPERACIONES | DISPATCHER | CONDUCTOR | CLIENTE_B2B | ANON / TOKEN |
|-------|-------|-------------|------------|-----------|-------------|--------------|
| **perfiles** | ALL | ALL (No modificar roles/auth_user_id) | SELECT (Solo operativos) | SELECT (Mismo) | SELECT (Mismo) | NINGUNO |
| **clientes_corporativos** | ALL | ALL | SELECT | NINGUNO | SELECT (Su cliente) | NINGUNO |
| **sedes** | ALL | ALL | SELECT | NINGUNO | S, I, U (Soft-del) | NINGUNO |
| **centros_costo** | ALL | ALL | SELECT | NINGUNO | S, I, U (Soft-del) | NINGUNO |
| **usuarios_cliente_b2b**| ALL | SELECT | NINGUNO | NINGUNO | SELECT (Su cliente) | NINGUNO |
| **pasajeros** | ALL | ALL | SELECT | SELECT (Su viaje) | S, I, U (Soft-del) | NINGUNO |
| **turnos_pasajeros** | ALL | ALL | SELECT | NINGUNO | S, I, U (Su cliente) | NINGUNO |
| **conductores** | ALL | ALL | ALL | SELECT (Mismo) | NINGUNO | NINGUNO |
| **vehiculos** | ALL | ALL | ALL | SELECT (Su asig.) | NINGUNO | NINGUNO |
| **viajes** | ALL | ALL | ALL | SELECT (Su asig.) | SELECT (Su cliente) | Vía RPC seguro |
| **viaje_pasajeros** | ALL | ALL | ALL | SELECT, UPDATE | SELECT (Su cliente) | NINGUNO |
| **asignaciones** | ALL | ALL | ALL | SELECT (Su asig.) | NINGUNO | NINGUNO |
| **eventos_viaje** | ALL | ALL | ALL | INSERT (Su viaje) | SELECT (Su cliente) | NINGUNO |
| **incidencias** | ALL | ALL | ALL | INSERT (Su viaje) | SELECT (Su cliente) | NINGUNO |
| **avisos** | ALL | ALL | ALL | SELECT, INSERT | SELECT (Su cliente) | NINGUNO |
| **tracking_positions** | ALL | ALL | SELECT | INSERT (Su asig.) | SELECT (Su cliente) | Vía RPC seguro |
| **tracking_tokens** | ALL | SELECT | SELECT | NINGUNO | NINGUNO | NINGUNO |
| **auditoria** | SELECT | NINGUNO | NINGUNO | NINGUNO | NINGUNO | NINGUNO |

*Notas:*
* `S` = SELECT, `I` = INSERT, `U` = UPDATE, `D` = DELETE, `ALL` = S+I+U+D.
* **(Soft-del)**: Cliente B2B no puede hacer DELETE, solo UPDATE `estado = 'inactivo'`.
* El aislamiento es estricto: CLIENTE A no puede leer/modificar turnos CLIENTE B.

## Funciones Helpers (Security Definer)

Para proteger la recursión de políticas, se han implementado:
- `get_auth_rol()`: `perfiles.rol`
- `get_auth_perfil_id()`: `perfiles.id`
- `get_auth_conductor_id()`: `conductores.id` vinculado al perfil.
- `get_b2b_cliente_id()`: `cliente_corporativo_id` asociado al perfil.

*Hardening*: `SET search_path = public`, con `REVOKE ALL ON FUNCTION ... FROM PUBLIC`.

## Sincronización Auth
El trigger `on_auth_user_created` en `auth.users` inserta el perfil base del usuario como 'inactivo' para evitar escalación automática por metadata.

# GO LIVE CHECKLIST - NEIRA TRANSPORTES

## 1. MIGRACIONES Y BASE DE DATOS
- [x] Historial de migraciones coherente y limpio en PROD.
- [x] Esquema DEV y PROD 100% sincronizados.
- [x] Tipos generados correctamente en el frontend.
- [x] Edge Function `invite-b2b` desplegada y funcional.

## 2. SEGURIDAD Y PERMISOS
- [x] Permisos de `anon` revocados.
- [x] `anon` solo tiene acceso a `get_public_tracking_info`.
- [x] RLS validado teóricamente (aislamiento por `cliente_corporativo_id`).

## 3. PRUEBAS FUNCIONALES (ACCEPTANCE TEST) - A REALIZAR EN CAPACITACIÓN
- [ ] Login ADMIN exitoso.
- [ ] Creación de Cliente Corporativo B2B exitoso.
- [ ] Creación de Usuario B2B exitoso y validación de RLS (solo ve su cliente).
- [ ] Carga masiva de Pasajeros y Turnos B2B (máx. 3-5 pasajeros para la prueba).
- [ ] Planificación Asistida de Rutas funcionando.
- [ ] Asignación de Vehículo y Conductor exitosa.
- [ ] Conductor App: UI móvil, visibilidad de manifiesto, transiciones de estado de viaje.
- [ ] Funcionalidad GPS: Envío y persistencia de posiciones.
- [ ] Link de Tracking de Pasajero: Visualización correcta sin login, solo información pública, actualización en vivo.
- [ ] Modo Offline: Acciones encoladas y sincronizadas post-reconexión.
- [ ] Finalización de Viaje: Historial y KPIs actualizados.
- [ ] Routing de Netlify: Sin errores 404 al refrescar rutas `/app` o `/live-track`.

## 4. DATOS DE CAPACITACIÓN
- **Cliente**: TBD
- **Usuarios**: TBD
- **Pasajeros**: TBD
- **Turnos**: TBD
- **Vehículo**: TBD
- **Conductor**: TBD
- **Viajes**: TBD

*Nota: Estos datos deberán ser registrados durante la capacitación para su posterior limpieza antes del Go-Live masivo.*

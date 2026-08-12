# Operaciones - Neira Transportes

## 1. Gestión de Datos Sensibles (PII y GPS)

**Datos Recolectados:**
- Pasajeros: Nombre, Rut, Dirección, Sede.
- Conductores: Nombre, Teléfono, Ubicación GPS (durante viaje).

**Política de Retención (Recomendada):**
- **GPS Histórico**: Mantener el tracking en `tracking_positions` por **30 días** para resolución de disputas/auditorías. Pasado ese tiempo, los datos deben truncarse. No hay un script automático (`pg_cron`) activo para mantener el sistema simple en la fase actual; se recomienda que el Administrador de BD lo purgue bimensualmente o al madurar la operación.
- **Tokens B2B (Tracking)**: Expulsados o invalidados al finalizar cada viaje. Solo exponen la geolocalización asíncrona del vehículo en estado EN_RUTA, no exponen datos de otros pasajeros.

## 2. Dependencias de Terceros
- La lectura de archivos Excel (Turnos B2B) utiliza `xlsx`. Existe un advisory técnico para el mismo, pero su explotación (Prototype Pollution/ReDoS) se mitiga dado que la carga está restringida únicamente a usuarios autenticados `CLIENTE_B2B` bajo un formato estandarizado.

## 3. Flujo Operacional (Resumen)
1. **B2B**: Sube nómina (Excel).
2. **Sistema**: Planifica (agrupa por capacidad, separa IDA/REGRESO, asiste la creación).
3. **Operaciones**: Revisa la planificación propuesta y **confirma**. Esto genera los `viajes` reales.
4. **Conductores**: Ejecutan el viaje transaccionalmente (offline/online) reportando GPS y Checklists.
5. **Tracking Públio**: Pasajeros reciben acceso tokenizado (read-only).

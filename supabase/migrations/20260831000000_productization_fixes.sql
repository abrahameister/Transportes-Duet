-- Migration 20260831000000_productization_fixes.sql

-- 2a. Trigger: Sync turnos_pasajeros when trip finishes
CREATE OR REPLACE FUNCTION sync_turnos_on_trip_finish()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.estado = 'finalizado' AND (OLD.estado IS NULL OR OLD.estado != 'finalizado') THEN
        UPDATE turnos_pasajeros tp
        SET estado = 'completado', updated_at = now()
        FROM viaje_pasajeros vp
        WHERE vp.viaje_id = NEW.id
          AND tp.pasajero_id = vp.pasajero_id
          AND tp.estado = 'asignado';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_sync_turnos_on_trip_finish ON viajes;
CREATE TRIGGER trg_sync_turnos_on_trip_finish
    AFTER UPDATE ON viajes
    FOR EACH ROW
    WHEN (NEW.estado = 'finalizado')
    EXECUTE FUNCTION sync_turnos_on_trip_finish();

-- 2b. Partial unique index: Prevent duplicate active assignments for the same viaje
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_viaje_assignment
    ON asignaciones(viaje_id)
    WHERE estado = 'activa';

-- 2c. Basic audit trigger for critical tables
CREATE OR REPLACE FUNCTION log_to_auditoria()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO auditoria(tabla_afectada, registro_id, accion, datos_nuevos, realizado_por_perfil_id)
        VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW), get_auth_perfil_id());
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO auditoria(tabla_afectada, registro_id, accion, datos_anteriores, datos_nuevos, realizado_por_perfil_id)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), get_auth_perfil_id());
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO auditoria(tabla_afectada, registro_id, accion, datos_anteriores, realizado_por_perfil_id)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD), get_auth_perfil_id());
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_audit_perfiles ON perfiles;
CREATE TRIGGER trg_audit_perfiles
    AFTER INSERT OR UPDATE OR DELETE ON perfiles
    FOR EACH ROW EXECUTE FUNCTION log_to_auditoria();

DROP TRIGGER IF EXISTS trg_audit_viajes ON viajes;
CREATE TRIGGER trg_audit_viajes
    AFTER INSERT OR UPDATE OR DELETE ON viajes
    FOR EACH ROW EXECUTE FUNCTION log_to_auditoria();

-- SPRINT 6: PASSENGER TRACKING
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. generate_tracking_token(p_viaje_id, p_pasajero_id)
-- Retorna un token en texto claro que el backend generador debe compartir. Guarda el hash.
-- Solo ejecutable por ADMIN, OPERACIONES, DISPATCHER
CREATE OR REPLACE FUNCTION generate_tracking_token(
    p_viaje_id UUID,
    p_pasajero_id UUID
) RETURNS TEXT AS $$
DECLARE
    v_raw_token TEXT;
    v_hash TEXT;
    v_expires_at TIMESTAMP WITH TIME ZONE;
    v_rol TEXT;
BEGIN
    v_rol := get_auth_rol();
    IF v_rol NOT IN ('ADMIN', 'OPERACIONES', 'DISPATCHER') THEN
        RAISE EXCEPTION 'No autorizado para generar tokens de rastreo.';
    END IF;

    -- Validar que el pasajero pertenece al viaje
    IF NOT EXISTS (SELECT 1 FROM viaje_pasajeros WHERE viaje_id = p_viaje_id AND pasajero_id = p_pasajero_id) THEN
        RAISE EXCEPTION 'El pasajero no pertenece a este viaje.';
    END IF;

    -- Generar token crudo usando gen_random_uuid pero eliminando guiones para que sea más amigable en URL
    v_raw_token := replace(gen_random_uuid()::TEXT, '-', '');
    
    -- Calcular hash SHA256 (retorna bytea, pasamos a hex para texto plano)
    v_hash := encode(digest(v_raw_token, 'sha256'), 'hex');
    
    -- Expiración: 24 horas máximo desde la creación
    v_expires_at := now() + interval '24 hours';

    -- Invalidar tokens previos de este pasajero para este viaje (para mantener solo 1 activo)
    UPDATE tracking_tokens 
    SET revoked_at = now() 
    WHERE viaje_id = p_viaje_id AND pasajero_id = p_pasajero_id AND revoked_at IS NULL;

    -- Insertar nuevo token
    INSERT INTO tracking_tokens (token_hash, viaje_id, pasajero_id, expires_at)
    VALUES (v_hash, p_viaje_id, p_pasajero_id, v_expires_at);

    RETURN v_raw_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. get_public_tracking_info(p_raw_token)
-- Accesible por rol anon. Minimiza datos.
CREATE OR REPLACE FUNCTION get_public_tracking_info(
    p_raw_token TEXT
) RETURNS JSONB AS $$
DECLARE
    v_hash TEXT;
    v_token_record tracking_tokens%ROWTYPE;
    v_result JSONB;
BEGIN
    v_hash := encode(digest(p_raw_token, 'sha256'), 'hex');

    SELECT * INTO v_token_record 
    FROM tracking_tokens 
    WHERE token_hash = v_hash;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Token inválido';
    END IF;

    IF v_token_record.revoked_at IS NOT NULL THEN
        RAISE EXCEPTION 'Token revocado';
    END IF;

    IF v_token_record.expires_at < now() THEN
        RAISE EXCEPTION 'Token expirado';
    END IF;

    -- Extraer información minimizada.
    -- Subqueries simples son eficientes por los índices UUID PK.
    SELECT jsonb_build_object(
        'viaje', (
            SELECT jsonb_build_object(
                'estado', v.estado,
                'fecha_programada', v.fecha_programada
            ) FROM viajes v WHERE v.id = v_token_record.viaje_id
        ),
        'conductor', (
            SELECT jsonb_build_object('nombre', c.nombre_completo)
            FROM asignaciones a
            JOIN conductores c ON a.conductor_id = c.id
            WHERE a.viaje_id = v_token_record.viaje_id AND a.estado = 'activa'
            LIMIT 1
        ),
        'vehiculo', (
            SELECT jsonb_build_object('patente', vh.patente, 'modelo', vh.modelo)
            FROM asignaciones a
            JOIN vehiculos vh ON a.vehiculo_id = vh.id
            WHERE a.viaje_id = v_token_record.viaje_id AND a.estado = 'activa'
            LIMIT 1
        ),
        'tracking', (
            SELECT jsonb_build_object(
                'lat', tp.latitud,
                'lng', tp.longitud,
                'ts', tp.registrado_en
            )
            FROM tracking_positions tp
            WHERE tp.viaje_id = v_token_record.viaje_id
            ORDER BY tp.registrado_en DESC
            LIMIT 1
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Configurar permisos
REVOKE EXECUTE ON FUNCTION generate_tracking_token(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION get_public_tracking_info(TEXT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION generate_tracking_token(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_public_tracking_info(TEXT) TO anon, authenticated;

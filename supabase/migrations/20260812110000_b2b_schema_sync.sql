-- Migración para sincronizar el esquema DB con los campos que el frontend espera en AppContext.tsx

-- 1. Agregar columnas faltantes a clientes_corporativos
ALTER TABLE clientes_corporativos 
ADD COLUMN contacto_nombre TEXT,
ADD COLUMN contacto_email TEXT,
ADD COLUMN contacto_telefono TEXT,
ADD COLUMN direccion_fiscal TEXT,
ADD COLUMN invitacion_enviada BOOLEAN DEFAULT false;

-- 2. Renombrar columnas para hacer match con el frontend
ALTER TABLE clientes_corporativos RENAME COLUMN nombre_fantasia TO nombre_corporativo;
ALTER TABLE clientes_corporativos RENAME COLUMN rut TO rut_identificador;
ALTER TABLE clientes_corporativos DROP COLUMN razon_social;

-- 3. Actualizar la tabla en AppContext de vehiculos porque eliminamos "color" y "activo" de insercion, 
-- pero el frontend en select intentara mapear. El select en AppContext.tsx lo hace bien 
-- porque esta usando estado_operativo. No se necesita nada mas.

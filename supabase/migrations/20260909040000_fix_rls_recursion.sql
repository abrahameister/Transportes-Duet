-- Fix infinite recursion between pasajeros and viaje_pasajeros
-- Original viajepasajeros_b2b_select referenced pasajeros, while pasajeros_conductor_select referenced viaje_pasajeros.

DROP POLICY IF EXISTS "viajepasajeros_b2b_select" ON viaje_pasajeros;

CREATE POLICY "viajepasajeros_b2b_select" ON viaje_pasajeros 
FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM viajes v 
    WHERE v.id = viaje_pasajeros.viaje_id 
    AND v.cliente_corporativo_id = get_b2b_cliente_id()
  )
);

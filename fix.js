const fs = require('fs');
const path = require('path');

const appPath = path.resolve('web-portal/src/components/conductor/ConductorApp.tsx');
let appContent = fs.readFileSync(appPath, 'utf8');

// Step 9: Remove @ts-nocheck
appContent = appContent.replace('// @ts-nocheck\n', '');

// Add imports
if (!appContent.includes("import { supabase }")) {
  appContent = appContent.replace(
    "import React, { useState } from 'react';",
    "import React, { useState, useEffect } from 'react';\nimport { supabase } from '../../lib/supabase';"
  );
}

// Ensure useEffect is imported if we just replaced something else
if (!appContent.includes("useEffect")) {
  appContent = appContent.replace("import React, { useState }", "import React, { useState, useEffect }");
}

// Step 2 & 3 & 4 & 5 & 8 & 10: Rewrite the initial state and hooks part
const hooksStart = appContent.indexOf("export const ConductorApp: React.FC = () => {");
const endOfMockData = appContent.indexOf("const [checkFluidos, setCheckFluidos] = useState(true);");

const newHooksContent = `export const ConductorApp: React.FC = () => {
  const { conductores, avisosOperativos, marcarAvisoLeido, actualizarConductor, enviarAvisoOperativo, authUser } = useApp();
  
  const conductor = conductores.find(c => c.id === authUser?.user_metadata?.perfil_id) || conductores[0];
  const isOnline = conductor?.estadoWFM === 'en_ruta' || conductor?.estadoWFM === 'disponible';
  
  const [syncStatus, setSyncStatus] = useState<'SINCRONIZADO' | 'PENDIENTE' | 'ERROR'>('SINCRONIZADO');
  const [myTrips, setMyTrips] = useState<any[]>([]);
  const [activeTrip, setActiveTrip] = useState<any>(null);
  
  // Realtime and data fetching
  const fetchTrips = async () => {
    if (!conductor?.id) return;
    try {
      const { data, error } = await supabase
        .from('viajes')
        .select(\`
          *,
          viaje_pasajeros(*, pasajero:pasajeros(id, nombre_completo, telefono, rut)),
          asignaciones!inner(id, conductor_id, vehiculo_id, estado,
            vehiculo:vehiculos(id, patente, marca, modelo, color)
          )
        \`)
        .in('estado', ['despachado','en_camino','en_punto','abordando','en_ruta'])
        .eq('asignaciones.estado', 'activa')
        .eq('asignaciones.conductor_id', conductor.id)
        .order('fecha_programada', { ascending: true });
        
      if (!error && data) {
        setMyTrips(data);
        setActiveTrip(data.length > 0 ? data[0] : null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTrips();
    const handleOnline = () => syncQueue();
    window.addEventListener('online', handleOnline);
    syncQueue();
    
    // Realtime
    const channel = supabase.channel('viajes_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'viajes' }, () => {
        fetchTrips();
      })
      .subscribe();
      
    return () => {
      window.removeEventListener('online', handleOnline);
      supabase.removeChannel(channel);
    };
  }, [conductor?.id]);

  const activeTripId = activeTrip?.id || null;
  const { lastPosition, gpsError } = useDriverGPS(activeTripId, isOnline && !!activeTripId);

  const [activeTab, setActiveTab] = useState<'ruta_inm' | 'bitacora' | 'inspeccion' | 'emergencia'>('ruta_inm');
  const [isMobileFrame, setIsMobileFrame] = useState<boolean>(true);
  const [notificacion, setNotificacion] = useState<string | null>(null);
  const [vozActiva, setVozActiva] = useState<string | null>(null);
  const [rutaCompletada, setRutaCompletada] = useState<boolean>(false);

  // Map backend pasajeros to UI state
  const pasajerosRuta = activeTrip?.viaje_pasajeros?.map(vp => ({
    id: vp.id,
    nombre: vp.pasajero?.nombre_completo,
    rut: vp.pasajero?.rut,
    direccion: vp.direccion_origen || vp.direccion_destino,
    telefono: vp.pasajero?.telefono,
    estado: vp.estado === 'abordado' ? 'abordo' : vp.estado === 'no_show' ? 'ausente' : 'pendiente',
    notaAviso: vp.notas || undefined
  })) || [];

  const handleCambiarEstadoPasajero = async (id: string, nuevoEstado: 'abordo' | 'ausente') => {
    setSyncStatus('PENDIENTE');
    try {
      const backendEstado = nuevoEstado === 'abordo' ? 'abordado' : 'no_show';
      const { error } = await supabase.rpc('board_passenger', { p_viaje_pasajero_id: id, p_estado: backendEstado });
      if (error) throw error;
      
      mostrarNotificacion(\`✓ Pasajero registrado como: \${nuevoEstado === 'abordo' ? 'A BORDO' : 'AUSENTE'}\`);
      await fetchTrips();
      setSyncStatus('SINCRONIZADO');
    } catch (e) {
      console.error(e);
      setSyncStatus('ERROR');
      mostrarNotificacion('Error al registrar pasajero');
    }
  };

  const handleFinalizarRuta = async () => {
    if (totalPendientes > 0) return;
    setSyncStatus('PENDIENTE');
    try {
      const { error } = await supabase.rpc('trip_finish', { p_viaje_id: activeTripId });
      if (error) throw error;
      setRutaCompletada(true);
      mostrarNotificacion('🏁 ¡Recorrido finalizado!');
      await fetchTrips();
      setSyncStatus('SINCRONIZADO');
    } catch (e) {
      console.error(e);
      setSyncStatus('ERROR');
      mostrarNotificacion('Error al finalizar ruta');
    }
  };
  
`;

appContent = appContent.slice(0, hooksStart) + newHooksContent + appContent.slice(endOfMockData);

// Remove APK modal state and function, since they were removed from the top block already
// Also remove APK button from JSX
appContent = appContent.replace(
  /<button[^>]*onClick=\{\(\) => setShowApkModal\(true\)\}[^>]*>[\s\S]*?<\/button>/,
  ''
);

// Replace fake `setShowApkModal` modal JSX at the bottom
appContent = appContent.replace(/\{\/\* MODAL DE DISTRIBUCIÓN APK EXPO NATIVE[\s\S]*?\{\showApkModal && \([\s\S]*?\}\)\}\s*<\/div>/, '</div>');

// Replace trip_finish logic
appContent = appContent.replace(
  /onClick=\{async \(\) => \{[\s\S]*?queueAction\(\{ type: 'trip_finish'[\s\S]*?\}\}/,
  "onClick={handleFinalizarRuta}"
);

// Show empty state if no trips
const returnStatementRegex = /return\s*\(\s*<div/;
const emptyStateJSX = `
  if (!activeTrip && myTrips.length === 0) {
    return (
      <div className="py-10 px-4 text-center">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">No tienes viajes asignados en este momento.</h2>
      </div>
    );
  }

  return (
    <div`;
appContent = appContent.replace(returnStatementRegex, emptyStateJSX);

fs.writeFileSync(appPath, appContent);

// Fix useDriverGPS.ts
const gpsPath = path.resolve('web-portal/src/hooks/useDriverGPS.ts');
let gpsContent = fs.readFileSync(gpsPath, 'utf8');
gpsContent = gpsContent.replace("import { enqueueGPS, syncGPSQueue } from '../lib/offlineQueue';", "import { enqueueGPS, syncGPSQueue } from '../lib/offlineQueue';\nimport { supabase } from '../lib/supabase';");
fs.writeFileSync(gpsPath, gpsContent);

console.log("Done.");

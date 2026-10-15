import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import { AlertTriangle, ShieldAlert, Wrench, CheckCircle2, RefreshCw } from 'lucide-react';

export const IncidenciasAlertasView: React.FC = () => {
  const { conductores, refrescarDatos } = useApp();
  const [incidencias, setIncidencias] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedIncidenciaForRescate, setSelectedIncidenciaForRescate] = useState<any | null>(null);
  const [rescateSuccess, setRescateSuccess] = useState<string | null>(null);

  const choferesRescate = conductores.filter(c => c.estadoWFM === 'disponible' && !c.enDescanso);

  const fetchIncidencias = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('incidencias')
        .select(`
          id,
          viaje_id,
          tipo,
          severidad,
          descripcion,
          estado,
          created_at,
          viaje:viajes(
            id,
            estado,
            origen_direccion,
            destino_direccion,
            cliente:clientes_corporativos(nombre_corporativo),
            viaje_pasajeros(
              pasajero:pasajeros(nombre_completo, telefono)
            ),
            asignaciones(
              estado,
              conductor:conductores(id, nombre_completo),
              vehiculo:vehiculos(id, patente, marca, modelo)
            )
          )
        `)
        .in('estado', ['abierta', 'en_resolucion'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error cargando incidencias:', error);
      } else if (data) {
        setIncidencias(data);
      }
    } catch (e) {
      console.error('Excepción cargando incidencias:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIncidencias();

    const channel = supabase.channel('incidencias_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incidencias' }, () => {
        fetchIncidencias();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchIncidencias]);

  const handleExecuteRescate = async (nuevoConductorId: string) => {
    if (!selectedIncidenciaForRescate) return;
    try {
      const { data, error } = await supabase.rpc('execute_trip_rescue', {
        p_incidencia_id: selectedIncidenciaForRescate.id,
        p_nuevo_conductor_id: nuevoConductorId
      });

      if (error) throw error;

      const cond = conductores.find(c => c.id === nuevoConductorId);
      const msg = `⚡ Rescate ejecutado con éxito: Viaje reasignado a ${cond?.nombreCompleto || 'nuevo conductor'}. Token de rastreo regenerado.`;
      setRescateSuccess(msg);
      setSelectedIncidenciaForRescate(null);
      await fetchIncidencias();
      if (refrescarDatos) await refrescarDatos();
      setTimeout(() => setRescateSuccess(null), 8000);
    } catch (err: any) {
      console.error('Error ejecutando rescate:', err);
      alert('Error ejecutando rescate: ' + (err?.message || err));
    }
  };

  return (
    <div className="space-y-6">
      {rescateSuccess && (
        <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-500 text-emerald-900 dark:text-emerald-100 text-xs font-bold flex items-center justify-between shadow-sm animate-in fade-in">
          <span className="flex items-center"><CheckCircle2 className="w-5 h-5 text-emerald-500 mr-2 shrink-0" /> {rescateSuccess}</span>
        </div>
      )}

      {/* Banner de Estado Operativo de Alertas */}
      <div className="enterprise-card p-5 border-l-4 border-red-500 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-red-50/20 dark:bg-[#161D27]">
        <div>
          <span className="text-[11px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wide flex items-center">
            <ShieldAlert className="w-4 h-4 mr-1.5 text-red-500 animate-bounce" />
            Incidencias y Emergencias en Ruta
          </span>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            Incidencias Operativas Activas: {incidencias.length}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Monitoreo en tiempo real de retrasos, fallas mecánicas y alertas de conductores desde terminales móviles.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => fetchIncidencias()}
            disabled={loading}
            className="p-2 rounded-md bg-white dark:bg-[#1C2533] border border-slate-200 dark:border-[#2E3C51] text-slate-700 dark:text-slate-200 hover:bg-slate-100 text-xs font-bold flex items-center"
            title="Refrescar incidencias"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <span className="px-3 py-1.5 rounded-md bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-mono font-bold text-xs shadow-xs">
            Móviles Disponibles: {choferesRescate.length}
          </span>
        </div>
      </div>

      {/* Lista de Alertas e Incidencias Reales */}
      <div className="space-y-4">
        {incidencias.map((inc) => {
          const v = inc.viaje;
          const primerPax = v?.viaje_pasajeros?.[0]?.pasajero;
          const asignacionActiva = v?.asignaciones?.find((a: any) => a.estado === 'activa') || v?.asignaciones?.[0];
          const conductorNombre = asignacionActiva?.conductor?.nombre_completo || 'Conductor asignado';
          const vehiculoPlaca = asignacionActiva?.vehiculo?.patente || 'S/P';

          return (
            <div key={inc.id} className="enterprise-card p-5 border border-red-300 dark:border-red-900/60 shadow-sm transition-all">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#212A38]">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="bg-red-600 text-white px-2 py-0.5 rounded font-bold text-[11px] uppercase tracking-wide flex items-center">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      {inc.tipo?.replace('_', ' ')?.toUpperCase() || 'EXCEPCIÓN EN RUTA'} (Gravedad {inc.severidad?.toUpperCase()})
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 text-xs font-mono">
                      Reportado: {new Date(inc.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-500 border border-amber-500/30">
                      {inc.estado}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Pasajero: {primerPax?.nombre_completo || 'Colaborador'} ({v?.cliente?.nombre_corporativo || 'Cliente Corporativo'})
                  </h3>
                  <p className="text-xs text-slate-700 dark:text-slate-300 bg-red-50 dark:bg-red-950/30 p-2.5 rounded border border-red-200 dark:border-red-900/40 font-mono">
                    🚨 {inc.descripcion}
                  </p>
                </div>

                <div className="shrink-0 flex flex-col items-end space-y-2">
                  <div className="text-right text-xs">
                    <span className="text-slate-400 block font-mono">Conductor afectado: {conductorNombre}</span>
                    <span className="text-slate-400 font-mono">Unidad: {vehiculoPlaca}</span>
                  </div>
                  <button
                    onClick={() => setSelectedIncidenciaForRescate(inc)}
                    className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-colors flex items-center space-x-2"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Asignar Conductor de Reemplazo</span>
                  </button>
                </div>
              </div>

              <div className="pt-3 flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono gap-2">
                <div>Origen: <span className="text-slate-800 dark:text-gray-200">{v?.origen_direccion || 'No especificado'}</span></div>
                <div>Destino: <span className="text-slate-800 dark:text-gray-200">{v?.destino_direccion || 'No especificado'}</span></div>
                <div>Teléfono Pasajero: <span className="text-blue-500 font-bold">{primerPax?.telefono || 'No registrado'}</span></div>
              </div>
            </div>
          );
        })}

        {incidencias.length === 0 && !loading && (
          <div className="enterprise-card p-12 text-center text-slate-500 dark:text-slate-400 space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto opacity-80" />
            <h3 className="text-base font-bold text-slate-800 dark:text-white">Cero Alertas e Incidencias en Ruta</h3>
            <p className="text-xs max-w-md mx-auto">Toda la flota se encuentra en parámetros normales de operación y telemetría GPS sincronizada.</p>
          </div>
        )}
      </div>

      {/* DRAWER MODAL DE RESCATE INMEDIATO */}
      {selectedIncidenciaForRescate && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="enterprise-card p-6 max-w-lg w-full space-y-5 animate-in zoom-in-95">
            <div className="border-b border-slate-200 dark:border-[#212A38] pb-3 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider block">REASIGNACIÓN DE EMERGENCIA</span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Asignar Conductor de Reemplazo</h3>
              </div>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Selecciona un conductor disponible para continuar el viaje. Al confirmar:
              <ul className="list-disc pl-4 mt-2 space-y-1 text-slate-500 dark:text-slate-400">
                <li>Se reasignará el viaje en la base de datos y se generará un nuevo enlace de rastreo.</li>
                <li>Si la incidencia es falla mecánica o accidente, el vehículo anterior pasará a estado <strong>taller</strong>.</li>
                <li>La incidencia quedará marcada como <strong>en resolución</strong>.</li>
              </ul>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              <label className="text-xs font-bold text-slate-700 dark:text-gray-300 block uppercase">Conductores Disponibles:</label>
              {choferesRescate.map(c => (
                <div key={c.id} className="p-3 rounded border border-slate-200 dark:border-[#212A38] bg-slate-50 dark:bg-[#0D1117] flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white">{c.nombreCompleto}</div>
                    <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      RUT: {c.rut} • Licencia: {c.tipoLicencia}
                    </div>
                  </div>
                  <button
                    onClick={() => handleExecuteRescate(c.id)}
                    className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs"
                  >
                    Asignar Conductor
                  </button>
                </div>
              ))}
              {choferesRescate.length === 0 && (
                <div className="text-center text-xs text-red-500 p-4 font-semibold">
                  No hay conductores disponibles libres en este momento.
                </div>
              )}
            </div>

            <div className="flex justify-end border-t border-slate-200 dark:border-[#212A38] pt-4">
              <button
                type="button"
                onClick={() => setSelectedIncidenciaForRescate(null)}
                className="px-4 py-2 rounded text-xs font-medium border border-slate-300 dark:border-[#303B4E] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#212A38]"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

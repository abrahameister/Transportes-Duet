import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AlertTriangle, ShieldAlert, Wrench, CheckCircle2 } from 'lucide-react';
import type { ViajeOperativa } from '../../types';

export const IncidenciasAlertasView: React.FC = () => {
  const { viajes, conductores, reasignarViajeRescate } = useApp();
  const [selectedIncidenciaForRescate, setSelectedIncidenciaForRescate] = useState<ViajeOperativa | null>(null);
  const [rescateSuccess, setRescateSuccess] = useState<string | null>(null);

  const viajesConExcepcion = viajes.filter(v => v.estado === 'excepcion' || (v.incidencia && !v.incidencia.resuelta));
  const choferesRescate = conductores.filter(c => c.estadoWFM === 'disponible' && !c.enDescanso && c.vehiculo?.estadoOperativo === 'operativo');

  const handleExecuteRescate = (nuevoConductorId: string) => {
    if (!selectedIncidenciaForRescate) return;
    reasignarViajeRescate(selectedIncidenciaForRescate.id, nuevoConductorId);
    setRescateSuccess(`¡UNIDAD DE RESCATE DESPACHADA! El pasajero ${selectedIncidenciaForRescate.pasajeroNombre} ha sido transferido. Unidad averiada reportada a taller automáticamente.`);
    setSelectedIncidenciaForRescate(null);
    setTimeout(() => setRescateSuccess(null), 6000);
  };

  return (
    <div className="space-y-6">
      {rescateSuccess && (
        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-500 text-blue-900 dark:text-blue-100 text-xs font-bold flex items-center justify-between shadow-sm animate-in fade-in">
          <span className="flex items-center"><CheckCircle2 className="w-5 h-5 text-blue-500 mr-2 shrink-0" /> {rescateSuccess}</span>
        </div>
      )}

      {/* Banner de Estado Operativo de Alertas */}
      <div className="enterprise-card p-5 border-l-4 border-red-500 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-red-50/20 dark:bg-[#161D27]">
        <div>
          <span className="text-[11px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wide flex items-center">
            <ShieldAlert className="w-4 h-4 mr-1.5 text-red-500 animate-bounce" />
            Torre de Excepciones en Ruta & Control de Emergencias
          </span>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            Incidencias Operativas Activas: {viajesConExcepcion.length}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Monitoreo en tiempo real de fallas mecánicas OBD-II, retrasos en tráfico severo o botonera SOS de conductores.
          </p>
        </div>

        <div className="text-right">
          <span className="px-3 py-1.5 rounded-md bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-mono font-bold text-xs shadow-xs">
            Unidades de Rescate Libres: {choferesRescate.length}
          </span>
        </div>
      </div>

      {/* Lista de Alertas e Incidencias */}
      <div className="space-y-4">
        {viajesConExcepcion.map((viaje) => (
          <div key={viaje.id} className="enterprise-card p-5 border border-red-300 dark:border-red-900/60 shadow-sm transition-all">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#212A38]">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="bg-red-600 text-white px-2 py-0.5 rounded font-bold text-[11px] uppercase tracking-wide flex items-center">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {viaje.incidencia?.tipo || 'EXCEPCIÓN EN RUTA'} (Gravedad {viaje.incidencia?.gravedad?.toUpperCase()})
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 text-xs font-mono">Reportado: {viaje.incidencia?.timestamp || 'Hace 5m'}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Pasajero en Riesgo de Retraso: {viaje.pasajeroNombre} ({viaje.clienteNombre})
                </h3>
                <p className="text-xs text-slate-700 dark:text-slate-300 bg-red-50 dark:bg-red-950/30 p-2.5 rounded border border-red-200 dark:border-red-900/40 font-mono">
                  🚨 {viaje.incidencia?.descripcion || 'Retraso de telemetría superior a 15 minutos.'}
                </p>
              </div>

              <div className="shrink-0 flex flex-col items-end space-y-2">
                <div className="text-right text-xs">
                  <span className="text-slate-400 block font-mono">Chofer afectado: {viaje.conductorNombre}</span>
                  <span className="text-slate-400 font-mono">Unidad: {viaje.vehiculoPlaca}</span>
                </div>
                <button
                  onClick={() => setSelectedIncidenciaForRescate(viaje)}
                  className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-colors flex items-center space-x-2"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Reasignar Unidad de Rescate ⚡</span>
                </button>
              </div>
            </div>

            <div className="pt-3 flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono gap-2">
              <div>Origen: <span className="text-slate-800 dark:text-gray-200">{viaje.origenDireccion}</span></div>
              <div>Destino: <span className="text-slate-800 dark:text-gray-200">{viaje.destinoDireccion}</span></div>
              <div>Teléfono Pasajero: <span className="text-blue-500 font-bold">{viaje.pasajeroTelefono}</span></div>
            </div>
          </div>
        ))}

        {viajesConExcepcion.length === 0 && (
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
                <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider block">PROTOCOLO DE RESCATE OPERATIVO</span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Despachar Chofer Sustituto</h3>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Selecciona un conductor disponible de rescate para el servicio de <strong>{selectedIncidenciaForRescate.pasajeroNombre}</strong>. Al confirmar:
              <ul className="list-disc pl-4 mt-2 space-y-1 text-slate-500 dark:text-slate-400">
                <li>El pasajero recibirá el nuevo Token de rastreo al instante.</li>
                <li>La unidad averiada (<strong>{selectedIncidenciaForRescate.vehiculoPlaca}</strong>) pasará automáticamente a estado <strong>En Taller / Mantenimiento</strong>.</li>
              </ul>
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              <label className="text-xs font-bold text-slate-700 dark:text-gray-300 block uppercase">Conductores Libres de Rescate:</label>
              {choferesRescate.map(c => (
                <div key={c.id} className="p-3 rounded border border-slate-200 dark:border-[#212A38] bg-slate-50 dark:bg-[#0D1117] flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white">{c.nombreCompleto}</div>
                    <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Unidad: {c.vehiculo?.placa} ({c.vehiculo?.marca}) - Horas: {c.horasConducidasHoy}h/8h</div>
                  </div>
                  <button
                    onClick={() => handleExecuteRescate(c.id)}
                    className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs"
                  >
                    Asignar Rescate ➔
                  </button>
                </div>
              ))}
              {choferesRescate.length === 0 && (
                <div className="text-center text-xs text-red-500 p-4 font-semibold">
                  No hay conductores disponibles libres ahora mismo. Saque un conductor de descanso o reasigne una ruta.
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

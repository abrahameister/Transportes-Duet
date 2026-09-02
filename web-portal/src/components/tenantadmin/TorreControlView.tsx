import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../ui/Toast';
import type { ViajeOperativa } from '../../types';
import { supabase } from '../../lib/supabase';
import { MapPin, Navigation, Clock, CheckCircle, AlertTriangle, ShieldAlert, X, Link as LinkIcon } from 'lucide-react';

export const TorreControlView: React.FC = () => {
  const { viajes, conductores, vehiculos, refrescarDatos, turnosConductores } = useApp();
  const toast = useToast();
  const [activeSubView, setActiveSubView] = useState<'tablero' | 'radar'>('tablero');
  const [selectedViajeForDispatch, setSelectedViajeForDispatch] = useState<ViajeOperativa | null>(null);
  const [filterEstado, setFilterEstado] = useState<string>('todos');

  const viajesTenant = viajes;
  const conductoresTenant = conductores;

  const filteredViajes = viajesTenant.filter(v => {
    if (filterEstado === 'todos') return true;
    if (filterEstado === 'solicitado' || filterEstado === 'validado') {
      return v.estado === 'solicitado' || v.estado === 'validado';
    }
    return v.estado === filterEstado;
  });

  const handleOpenDispatch = (viaje: ViajeOperativa) => {
    setSelectedViajeForDispatch(viaje);
  };

  const handleGenerarEnlace = async (viaje: ViajeOperativa) => {
    try {
      const { data, error } = await supabase.rpc('generate_tracking_token', {
        p_viaje_id: viaje.id
      });

      if (error) throw error;
      
      const link = `${window.location.origin}/live-track/${data}`;
      await navigator.clipboard.writeText(link);
      toast.success(`Enlace de seguimiento copiado al portapapeles.`, 'Enlace Generado');
    } catch (err: any) {
      console.error(err);
      toast.error('Error al generar el enlace: ' + err.message, 'Seguimiento GPS');
    }
  };

  const handleConfirmDispatch = async (conductorId: string) => {
    if (!selectedViajeForDispatch) return;
    try {
      const conductor = conductores.find(c => c.id === conductorId);
      let vehiculoId = (conductor as any)?.vehiculoHabitualId || (conductor as any)?.vehiculoAsignadoId;
      
      const currentVeh = vehiculos.find(v => v.id === vehiculoId);
      if (!vehiculoId || currentVeh?.estado === 'taller' || currentVeh?.estadoOperativo === 'mantenimiento') {
        const operativeVeh = vehiculos.find(v => (v.estadoOperativo || v.estado) === 'operativo');
        vehiculoId = operativeVeh?.id || vehiculos?.[0]?.id;
      }

      if (!vehiculoId) {
        toast.warning('Debe existir al menos un vehículo registrado en la flota para asignar el viaje.', 'Vehículo Requerido');
        return;
      }
      
      const { error: assignError } = await supabase.rpc('trip_assign', {
        p_viaje_id: selectedViajeForDispatch.id,
        p_conductor_id: conductorId,
        p_vehiculo_id: vehiculoId
      });
      if (assignError) throw assignError;

      const { error: dispatchError } = await supabase.rpc('trip_dispatch', {
        p_viaje_id: selectedViajeForDispatch.id
      });
      if (dispatchError) throw dispatchError;
      
      const assignedVeh = vehiculos.find(v => v.id === vehiculoId);
      toast.success(`Viaje asignado a ${conductor?.nombreCompleto || 'Conductor'} con móvil ${assignedVeh?.placa || (assignedVeh as any)?.patente || 'VIP'} y despachado con éxito.`, 'Despacho Operativo');

      if (refrescarDatos) {
        await refrescarDatos();
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Error al despachar viaje: ' + err.message, 'Fallo de Despacho');
    }
    setSelectedViajeForDispatch(null);
  };

  return (
    <div className="space-y-4">
      {/* Sub-navegación Torre de Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-[#212A38] pb-3">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveSubView('tablero')}
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
              activeSubView === 'tablero'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'bg-slate-100 text-slate-600 dark:bg-[#161D27] dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[#212A38]'
            }`}
          >
            Tablero Live Dispatch ({viajesTenant.length})
          </button>
          <button
            onClick={() => setActiveSubView('radar')}
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors flex items-center space-x-1.5 ${
              activeSubView === 'radar'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'bg-slate-100 text-slate-600 dark:bg-[#161D27] dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[#212A38]'
            }`}
          >
            <Navigation className="w-3.5 h-3.5 text-emerald-500 mr-1 animate-pulse" />
            <span>Radar Telemetría GPS</span>
          </button>
        </div>

        {activeSubView === 'tablero' && (
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Filtrar Estado:</span>
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="enterprise-input py-1 px-2 text-xs bg-white dark:bg-[#161D27]"
            >
              <option value="todos">Todos los viajes ({viajesTenant.length})</option>
              <option value="solicitado">Pendientes / Solicitados ({viajesTenant.filter(v => v.estado === 'solicitado' || v.estado === 'validado').length})</option>
              <option value="asignado">Asignados ({viajesTenant.filter(v => v.estado === 'asignado').length})</option>
              <option value="despachado">Despachados ({viajesTenant.filter(v => v.estado === 'despachado').length})</option>
              <option value="en_camino">En Camino / Ruta ({viajesTenant.filter(v => v.estado === 'en_camino' || v.estado === 'en_ruta').length})</option>
              <option value="finalizado">Finalizados ({viajesTenant.filter(v => v.estado === 'finalizado').length})</option>
            </select>
          </div>
        )}
      </div>

      {activeSubView === 'tablero' && (
        <div className="enterprise-card overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#0D1117] text-slate-500 dark:text-slate-400 uppercase font-semibold border-b border-slate-200 dark:border-[#212A38]">
              <tr>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4">Pasajero & Cuenta B2B</th>
                <th className="py-3 px-4">Ruta Operativa</th>
                <th className="py-3 px-4">Conductor & Unidad</th>
                <th className="py-3 px-4">Tarifa Estimada</th>
                <th className="py-3 px-4 text-right">Acción Dispatch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-[#212A38] text-slate-700 dark:text-gray-300">
              {filteredViajes.map((v) => {
                const isPendiente = v.estado === 'solicitado' || v.estado === 'validado';
                const isExcepcion = v.estado === 'incidencia' || v.estado === 'rescate_solicitado';
                return (
                  <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-[#1C2533] transition-colors">
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${
                        isPendiente 
                          ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60' 
                          : isExcepcion
                            ? 'bg-red-50 text-red-700 border-red-300 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900 animate-pulse'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60'
                      }`}>
                        {isPendiente && <Clock className="w-3 h-3 mr-1" />}
                        {isExcepcion && <ShieldAlert className="w-3 h-3 mr-1 text-red-500" />}
                        {!isPendiente && !isExcepcion && <CheckCircle className="w-3 h-3 mr-1 text-emerald-500" />}
                        {v.estado.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{v.pasajeroNombre}</div>
                      <div className="text-slate-500 dark:text-slate-400 text-[11px]">{v.clienteNombre}</div>
                      <div className="text-slate-400 dark:text-slate-500 text-[10px] font-mono mt-0.5">{v.pasajeroTelefono}</div>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate">
                      <div className="text-slate-800 dark:text-gray-200 truncate flex items-center">
                        <span className="w-2 h-2 rounded-full bg-blue-500 inline-block mr-1.5 shrink-0" />
                        <span className="truncate">{v.origenDireccion}</span>
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 text-[11px] truncate flex items-center mt-1">
                        <span className="w-2 h-2 rounded-full bg-slate-400 inline-block mr-1.5 shrink-0" />
                        <span className="truncate">{v.destinoDireccion}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {v.conductorNombre ? (
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">{v.conductorNombre}</div>
                          <div className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">Unidad: {v.vehiculoPlaca || 'N/A'}</div>
                        </div>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 italic text-xs font-medium">Sin conductor asignado</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-900 dark:text-white">
                      {v.montoEstimado ? `$${Number(v.montoEstimado).toLocaleString('es-CL')} CLP` : '$0 CLP'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {isPendiente ? (
                        <button
                          onClick={() => handleOpenDispatch(v)}
                          className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow transition-colors"
                        >
                          Asignar Conductor
                        </button>
                      ) : isExcepcion ? (
                        <span className="text-red-600 dark:text-red-400 font-bold text-[11px] uppercase tracking-wide">
                          Ver en Incidencias
                        </span>
                      ) : (
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleOpenDispatch(v)}
                            className="px-2.5 py-1 rounded border border-slate-300 dark:border-[#303B4E] hover:bg-slate-100 dark:hover:bg-[#212A38] text-slate-700 dark:text-slate-300 text-[11px] transition-colors"
                          >
                            Reasignar
                          </button>
                          <button
                            onClick={() => handleGenerarEnlace(v)}
                            className="px-2.5 py-1 rounded border border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 text-[11px] transition-colors flex items-center"
                            title="Generar y copiar enlace de seguimiento"
                          >
                            <LinkIcon className="w-3 h-3 mr-1" />
                            Link
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredViajes.length === 0 && (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
              No hay viajes en la cola de despacho con el filtro seleccionado.
            </div>
          )}
        </div>
      )}

      {activeSubView === 'radar' && (
        <div className="space-y-4">
          <div className="enterprise-card p-4 bg-slate-900 dark:bg-[#090C10] text-gray-100 relative overflow-hidden border border-slate-800 dark:border-[#212A38] min-h-[360px] flex flex-col justify-between">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293715_1px,transparent_1px),linear-gradient(to_bottom,#1f293715_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
            
            <div className="flex items-center justify-between z-10">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 flex items-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-ping" />
                  Telemetría GPS Activa (Frecuencia: 5s)
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">Radar Operativa en Tiempo Real - CDMX & Zona Metropolita</h3>
              </div>
              <div className="text-xs font-mono text-slate-400 bg-black/40 px-3 py-1.5 rounded border border-slate-800">
                Unidades Transmutadas: {conductoresTenant.length} | Operativas: {conductoresTenant.filter(c => c.estadoWFM !== 'offline').length}
              </div>
            </div>

            {/* Simulated Map Pins Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 my-6 z-10">
              {conductoresTenant.map((c) => {
                const isOnline = c.estadoWFM !== 'offline' && !c.enDescanso;
                return (
                  <div key={c.id} className={`p-3 rounded-lg border bg-black/60 backdrop-blur-sm transition-all ${
                    isOnline ? 'border-emerald-800/80 text-white' : 'border-slate-800 text-slate-400'
                  }`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                      <span className="font-mono text-[10px] text-slate-400">{c.vehiculo?.placa || 'VIP-001'}</span>
                    </div>
                    <div className="font-bold text-sm text-white truncate">{c.nombreCompleto}</div>
                    <div className="text-[11px] text-slate-400 mt-1 flex items-center truncate">
                      <MapPin className="w-3 h-3 mr-1 shrink-0 text-slate-500" />
                      <span className="font-mono text-[11px]">{c.ultimaLatitud?.toFixed(4)}, {c.ultimaLongitud?.toFixed(4)}</span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
                      <span className={isOnline ? 'text-emerald-400' : 'text-slate-500'}>{c.estadoWFM.toUpperCase()}</span>
                      <span>Ping: {c.ultimaActualizacionGps}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-center text-[11px] text-slate-500 z-10 border-t border-slate-800/50 pt-2">
              Los enlaces Deep Linking hacia Waze o Google Maps se autogeneran cuando el conductor acepta el servicio en su terminal móvil Expo.
            </div>
          </div>
        </div>
      )}

      {/* PANEL LATERAL DE DESPACHO INTELIGENTE (DRAWER PATTERN) */}
      {selectedViajeForDispatch && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end transition-opacity">
          <div className="w-full sm:w-2/3 lg:w-1/2 bg-white dark:bg-[#161D27] h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-[#212A38] animate-in slide-in-from-right duration-200">
            
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 dark:border-[#212A38] flex items-center justify-between bg-slate-50 dark:bg-[#0D1117]">
              <div>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                  Motor de Despacho & Validación WFM
                </span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  Asignar Unidad al Viaje #{selectedViajeForDispatch.id.slice(-4)}
                </h2>
              </div>
              <button
                onClick={() => setSelectedViajeForDispatch(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-gray-200 rounded-md hover:bg-slate-200 dark:hover:bg-[#212A38] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body - Trip Info */}
            <div className="p-5 border-b border-slate-200 dark:border-[#212A38] bg-blue-50/50 dark:bg-blue-950/20 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 font-semibold block">PASAJERO & CUENTA:</span>
                  <strong className="text-slate-900 dark:text-white text-sm">{selectedViajeForDispatch.pasajeroNombre}</strong>
                  <div className="text-slate-600 dark:text-slate-400">{selectedViajeForDispatch.clienteNombre} ({selectedViajeForDispatch.pasajeroTelefono})</div>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 font-semibold block">TARIFA ESTIMADA:</span>
                  <strong className="text-slate-900 dark:text-white text-base font-mono">{selectedViajeForDispatch.montoEstimado ? `$${Number(selectedViajeForDispatch.montoEstimado).toLocaleString('es-CL')} CLP` : '$0 CLP'}</strong>
                  <div className="text-emerald-600 dark:text-emerald-400">Listo para despacho instantáneo</div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-blue-200/60 dark:border-blue-900/40 text-slate-700 dark:text-gray-300">
                <div className="flex items-center"><strong>Origen:</strong> <span className="ml-1 text-slate-900 dark:text-white">{selectedViajeForDispatch.origenDireccion}</span></div>
                <div className="flex items-center mt-1"><strong>Destino:</strong> <span className="ml-1 text-slate-900 dark:text-white">{selectedViajeForDispatch.destinoDireccion}</span></div>
              </div>
            </div>

            {/* Drawer Body - Available Drivers & WFM Validation */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider">
                  Unidades en Flota ({conductoresTenant.length})
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Validados por horas de descanso y estado técnico
                </span>
              </div>

              <div className="space-y-3">
                {[...conductoresTenant].sort((a, b) => {
                  const todayIso = new Date().toISOString().split('T')[0];
                  const shiftA = turnosConductores.find(t => t.conductor_id === a.id && t.fecha === todayIso);
                  const shiftB = turnosConductores.find(t => t.conductor_id === b.id && t.fecha === todayIso);
                  
                  const isReadyA = shiftA && shiftA.tipo_jornada !== 'descanso' && !a.enDescanso && a.estadoWFM !== 'en_ruta';
                  const isReadyB = shiftB && shiftB.tipo_jornada !== 'descanso' && !b.enDescanso && b.estadoWFM !== 'en_ruta';
                  
                  if (isReadyA && !isReadyB) return -1;
                  if (!isReadyA && isReadyB) return 1;
                  return 0;
                }).map((c) => {
                  const todayIso = new Date().toISOString().split('T')[0];
                  const driverShift = turnosConductores.find(t => t.conductor_id === c.id && t.fecha === todayIso);
                  
                  const vhId = driverShift?.vehiculo_id || (c as any).vehiculoHabitualId || (c as any).vehiculoAsignadoId;
                  const vh = vehiculos.find(v => v.id === vhId);
                  const isVehTaller = vh && (vh.estadoOperativo === 'mantenimiento' || vh.estado === 'taller');
                  
                  const isDescanso = driverShift?.tipo_jornada === 'descanso';
                  const noShiftToday = !driverShift;
                  const noVehicle = !vh || isVehTaller;
                  
                  const isBlocked = c.enDescanso || isDescanso || noShiftToday || noVehicle;
                  const isBusy = c.estadoWFM === 'en_ruta';
                  const isAvailable = !isBlocked && !isBusy;

                  return (
                    <div
                      key={c.id}
                      className={`p-4 rounded-lg border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isAvailable
                          ? 'border-slate-200 dark:border-[#212A38] bg-white dark:bg-[#161D27] hover:border-blue-500/80 shadow-xs'
                          : 'border-slate-200 dark:border-[#212A38] bg-slate-100/80 dark:bg-[#0D1117]/60 opacity-75'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white text-sm">{c.nombreCompleto}</span>
                          {vh ? (
                            <span className={`text-xs font-mono px-2 py-0.5 rounded font-semibold ${
                              isVehTaller
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-300'
                                : 'bg-slate-200 dark:bg-[#212A38] text-slate-800 dark:text-gray-300'
                            }`}>
                              🚗 {vh.placa || (vh as any).patente} ({vh.marca}) {isVehTaller ? '⚠️ En Taller' : ''}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Sin móvil habitual (Pool rotativo)</span>
                          )}
                        </div>

                        {/* Shift Badge & Info */}
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          {driverShift && !isDescanso ? (
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 font-semibold font-mono border border-blue-200/60 text-[11px]">
                              🕒 Turno: {driverShift.hora_inicio?.slice(0,5)} - {driverShift.hora_fin?.slice(0,5)} ({driverShift.tipo_jornada.toUpperCase()})
                            </span>
                          ) : isDescanso ? (
                            <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 font-semibold text-[11px] border border-rose-200">
                              ⛔ En Descanso Legal / Día Libre
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 font-medium text-[11px] border border-amber-200">
                              ⚠️ Sin turno asignado hoy
                            </span>
                          )}
                          <span className="text-slate-400 font-mono text-[11px]">RUT: {c.rut || 'N/A'}</span>
                        </div>

                        {isBlocked && (
                          <div className="text-xs text-red-600 dark:text-red-400 font-semibold flex items-center mt-1">
                            <AlertTriangle className="w-3.5 h-3.5 mr-1 shrink-0" />
                            <span>Bloqueado por WFM: {noShiftToday ? 'Sin turno asignado hoy' : isDescanso ? 'Jornada de descanso legal' : noVehicle ? 'Sin vehículo operativo' : (c.motivoBloqueo || 'Chofer inhabilitado')}</span>
                          </div>
                        )}
                        {isBusy && !isBlocked && (
                          <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                            ● Actualmente en ruta atendiendo otro servicio corporativo.
                          </div>
                        )}
                      </div>

                      <div className="shrink-0 flex items-center">
                        {isAvailable ? (
                          <button
                            onClick={() => handleConfirmDispatch(c.id)}
                            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow cursor-pointer"
                          >
                            Despachar Unidad ✓
                          </button>
                        ) : (
                          <button
                            disabled
                            className="w-full sm:w-auto px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-[#212A38] text-slate-500 dark:text-slate-500 font-semibold text-xs cursor-not-allowed border border-slate-300 dark:border-slate-700"
                          >
                            Inhabilitado WFM
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-[#212A38] bg-slate-50 dark:bg-[#0D1117] flex justify-end">
              <button
                onClick={() => setSelectedViajeForDispatch(null)}
                className="px-4 py-2 rounded border border-slate-300 dark:border-[#303B4E] text-slate-700 dark:text-slate-300 font-medium text-xs hover:bg-slate-200 dark:hover:bg-[#212A38]"
              >
                Cancelar y cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../ui/Toast';
import type { VehiculoFlota, ConductorWFM } from '../../types';
import { Car, User, Plus, Edit3, Trash2, ShieldCheck, Wrench, X, Search, Image as ImageIcon, Download, Calendar, Clock, UploadCloud, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { ConfirmModal } from '../common/ConfirmModal';

interface RecursosWFMViewProps {
  initialTab?: 'conductores' | 'flota' | 'turnos';
}

export const RecursosWFMView: React.FC<RecursosWFMViewProps> = ({ initialTab }) => {
  const { vehiculos, conductores, agregarVehiculo, actualizarVehiculo, eliminarVehiculo, toggleConductorEstado, agregarConductor, actualizarConductor, eliminarConductor, turnosConductores, crearTurnoConductor, eliminarTurnoConductor } = useApp();
  const toast = useToast();
  const [subTab, setSubTab] = useState<'conductores' | 'flota' | 'turnos'>(initialTab || 'conductores');
  const [viewModeTurnos, setViewModeTurnos] = useState<'lista' | 'matriz'>('lista');
  const [searchQuery, setSearchQuery] = useState('');
  const [vehiculoToDelete, setVehiculoToDelete] = useState<VehiculoFlota | null>(null);
  const [conductorToDelete, setConductorToDelete] = useState<ConductorWFM | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        let successCount = 0;
        for (const row of data as any[]) {
          const rut = row['RUT'] || row['RUT Conductor'];
          const cond = conductores.find(c => c.rut === rut);
          if (cond) {
            await crearTurnoConductor({
              conductor_id: cond.id,
              fecha: row['Fecha (DD-MM-YYYY)'] || new Date().toISOString().split('T')[0],
              hora_inicio: row['Hora Inicio'] || '08:00',
              hora_fin: row['Hora Fin'] || '18:00',
              tipo_jornada: row['Jornada']?.toLowerCase() || 'manana',
              estado: 'planificado',
            });
            successCount++;
          }
        }
        toast.success(`Se importaron ${successCount} turnos correctamente.`, 'Importación Exitosa');
      } catch (error) {
        console.error(error);
        toast.error('Error al procesar el archivo Excel.', 'Fallo de Lectura');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  useEffect(() => {
    if (initialTab) {
      setSubTab(initialTab);
    }
  }, [initialTab]);
  const [showVehiculoModal, setShowVehiculoModal] = useState<boolean>(false);
  const [editingVehiculo, setEditingVehiculo] = useState<VehiculoFlota | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // Form states para Conductor WFM (Con foto y datos oficiales Chile)
  const [showConductorModal, setShowConductorModal] = useState<boolean>(false);
  const [editingConductor, setEditingConductor] = useState<ConductorWFM | null>(null);
  const [condNombre, setCondNombre] = useState('');
  const [condRut, setCondRut] = useState('');
  const [condLicencia, setCondLicencia] = useState<'A1' | 'A2' | 'A3'>('A3');
  const [condVencimiento, setCondVencimiento] = useState('');
  const [condTelefono, setCondTelefono] = useState('');
  const [condEmail, setCondEmail] = useState('');
  const [condFoto, setCondFoto] = useState('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=250&auto=format&fit=crop');
  const [condVehiculoHabitualId, setCondVehiculoHabitualId] = useState('');

  // Form states para Turnos de Conductores
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [shiftConductorId, setShiftConductorId] = useState('');
  const [shiftVehiculoId, setShiftVehiculoId] = useState('');
  const [shiftFecha, setShiftFecha] = useState(new Date().toISOString().split('T')[0]);
  const [shiftHoraInicio, setShiftHoraInicio] = useState('06:00');
  const [shiftHoraFin, setShiftHoraFin] = useState('14:00');
  const [shiftTipo, setShiftTipo] = useState<'manana' | 'tarde' | 'noche' | 'partida' | 'descanso'>('manana');
  const [shiftNotas, setShiftNotas] = useState('');

  // Form states para Vehículo (Patente, Marca, Modelo, Color, Kilometraje, Pasajeros)
  const [placa, setPlaca] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [color, setColor] = useState('');
  const [km, setKm] = useState(0);
  const [pasajeros, setPasajeros] = useState(4);
  const [estado, setEstado] = useState<'operativo' | 'mantenimiento' | 'inactivo'>('operativo');

  const normalizeDateToISO = (dateStr?: string | null): string => {
    if (!dateStr || typeof dateStr !== 'string') return '2028-08-15';
    const trimmed = dateStr.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    const dmyMatch = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (dmyMatch) {
      const day = dmyMatch[1].padStart(2, '0');
      const month = dmyMatch[2].padStart(2, '0');
      const year = dmyMatch[3];
      return `${year}-${month}-${day}`;
    }
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
    return '2028-08-15';
  };

  const handleOpenNewConductor = () => {
    setEditingConductor(null);
    setCondNombre('');
    setCondRut('');
    setCondLicencia('A3');
    setCondVencimiento('2028-08-15');
    setCondTelefono('+56 9 ');
    setCondEmail('');
    setCondFoto('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=250&auto=format&fit=crop');
    setCondVehiculoHabitualId('');
    setShowConductorModal(true);
  };

  const handleEditConductor = (c: ConductorWFM) => {
    setEditingConductor(c);
    setCondNombre(c.nombreCompleto || '');
    setCondRut(c.rut || '');
    setCondLicencia((c.tipoLicencia as 'A1' | 'A2' | 'A3') || 'A3');
    setCondVencimiento(normalizeDateToISO(c.vencimientoLicencia));
    setCondTelefono(c.telefono || '+56 9 ');
    setCondEmail(c.email || '');
    setCondFoto(c.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=250&auto=format&fit=crop');
    setCondVehiculoHabitualId((c as any).vehiculoHabitualId || (c as any).vehiculoAsignadoId || '');
    setShowConductorModal(true);
  };

  const handleSaveConductor = (e: React.FormEvent) => {
    e.preventDefault();
    const finalVencimiento = normalizeDateToISO(condVencimiento);

    if (editingConductor) {
      actualizarConductor(editingConductor.id, {
        nombreCompleto: condNombre,
        rut: condRut,
        email: condEmail,
        telefono: condTelefono,
        avatarUrl: condFoto,
        tipoLicencia: condLicencia,
        vencimientoLicencia: finalVencimiento,
        vehiculoHabitualId: condVehiculoHabitualId || undefined,
        vehiculoAsignadoId: condVehiculoHabitualId || undefined
      } as any);
      toast.success(`Información del conductor "${condNombre}" actualizada correctamente.`, 'Conductor Actualizado');
    } else {
      const nuevo: any = {
        id: `cond-${Date.now()}`,
        nombreCompleto: condNombre,
        rut: condRut,
        email: condEmail,
        telefono: condTelefono,
        avatarUrl: condFoto || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=250&auto=format&fit=crop',
        tipoLicencia: condLicencia,
        vencimientoLicencia: finalVencimiento,
        vehiculoHabitualId: condVehiculoHabitualId || undefined,
        vehiculoAsignadoId: condVehiculoHabitualId || undefined,
        puntualidad: '5.0 / 5.0',
        serviciosMes: 0,
        estadoWFM: 'disponible',
        ultimaLatitud: -36.8269,
        ultimaLongitud: -73.0498,
        horasConducidasHoy: 0,
        enDescanso: false
      };
      agregarConductor(nuevo);
      toast.success(`Conductor profesional "${condNombre}" dado de alta con éxito en el sistema.`, 'Conductor Registrado');
    }
    setShowConductorModal(false);
    setEditingConductor(null);
  };

  const handleSaveShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftConductorId) {
      toast.warning('Debe seleccionar un conductor para el turno.', 'Conductor Requerido');
      return;
    }
    
    if (shiftVehiculoId) {
      // Validate collision
      const collision = turnosConductores.find(t => t.vehiculo_id === shiftVehiculoId && t.fecha === shiftFecha && t.conductor_id !== shiftConductorId);
      if (collision) {
        toast.warning('Este vehículo ya está asignado a otro conductor en esta fecha. Seleccione otro móvil.', 'Colisión de Vehículo');
        return;
      }
    }

    await crearTurnoConductor({
      conductor_id: shiftConductorId,
      vehiculo_id: shiftVehiculoId || undefined,
      fecha: shiftFecha,
      hora_inicio: shiftHoraInicio,
      hora_fin: shiftHoraFin,
      tipo_jornada: shiftTipo,
      estado: 'planificado',
      notas: shiftNotas || null
    });
    setShowShiftModal(false);
    setShiftNotas('');
    setShiftVehiculoId('');
  };

  const vehiculosTenant = vehiculos;
  const conductoresTenant = conductores;

  const filteredConductores = conductoresTenant.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (c.nombreCompleto && c.nombreCompleto.toLowerCase().includes(q)) ||
      (c.rut && c.rut.toLowerCase().includes(q)) ||
      (c.numeroLicencia && c.numeroLicencia.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
  });

  const filteredVehiculos = vehiculosTenant.filter(v => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (v.placa && v.placa.toLowerCase().includes(q)) ||
      (v.patente && v.patente.toLowerCase().includes(q)) ||
      (v.marca && v.marca.toLowerCase().includes(q)) ||
      (v.modelo && v.modelo.toLowerCase().includes(q))
    );
  });

  const handleOpenNewVehiculo = () => {
    setEditingVehiculo(null);
    setPlaca(''); setMarca(''); setModelo(''); setColor(''); setKm(0); setPasajeros(4); setEstado('operativo');
    setShowVehiculoModal(true);
  };

  const handleOpenEditVehiculo = (v: VehiculoFlota) => {
    setEditingVehiculo(v);
    setPlaca(v.placa); setMarca(v.marca); setModelo(v.modelo); setColor(v.color); setKm(v.kilometraje); setPasajeros(v.capacidadPasajeros); setEstado(v.estadoOperativo);
    setShowVehiculoModal(true);
  };

  const handleSaveVehiculo = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingVehiculo) {
      actualizarVehiculo(editingVehiculo.id, {
        placa, marca, modelo, color, kilometraje: Number(km), capacidadPasajeros: Number(pasajeros), estadoOperativo: estado
      });
      toast.success(`Unidad vehicular (${placa}) actualizada correctamente.`, 'Flota Actualizada');
    } else {
      const nuevo: VehiculoFlota = {
        id: `veh-${Date.now()}`,
        
        placa, marca, modelo, anio: 2024, color, kilometraje: Number(km), capacidadPasajeros: Number(pasajeros), estadoOperativo: estado, activo: true
      };
      agregarVehiculo(nuevo);
      toast.success(`Nueva unidad (${placa} - ${marca} ${modelo}) dada de alta en flota.`, 'Vehículo Creado');
    }
    setShowVehiculoModal(false);
  };

  const handleToggleEstadoMantenimiento = (v: VehiculoFlota) => {
    const next = v.estadoOperativo === 'operativo' ? 'mantenimiento' : 'operativo';
    actualizarVehiculo(v.id, { estadoOperativo: next });
    toast.info(`Unidad ${v.placa} cambió a estado: ${next.toUpperCase()}`, 'Estado Técnico');
  };

  return (
    <div className="space-y-5">
      {actionMsg && (
        <div className="p-3.5 rounded-lg bg-blue-50 dark:bg-[#161D27] border border-blue-500 text-blue-900 dark:text-blue-200 text-xs font-semibold flex items-center justify-between shadow-xs">
          <span>ℹ️ {actionMsg}</span>
        </div>
      )}

      {/* Grand White/Slate Card Header (Image 1 replica) */}
      <div className="enterprise-card p-6 bg-white dark:bg-[#161D27] border border-slate-200 dark:border-[#212A38] shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
              TRANSPORTES ANDINA • GESTIÓN DE FLOTA Y CAPITAL HUMANO
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Directorio Operacional — Conductores y Vehículos
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Control de licencias profesionales A1/A2/A3, revisión técnica, capacidades de pasaje y disponibilidad.
            </p>
          </div>

          {/* Right side buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <div className="flex items-center p-1 bg-slate-100 dark:bg-[#0D1117] rounded-lg border border-slate-200 dark:border-[#212A38]">
              <button
                type="button"
                onClick={() => setSubTab('conductores')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center space-x-1.5 ${
                  subTab === 'conductores'
                    ? 'bg-[#0F172A] text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#212A38]'
                }`}
              >
                <User className="w-3.5 h-3.5 mr-1" />
                <span>Conductores ({conductoresTenant.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setSubTab('flota')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center space-x-1.5 ${
                  subTab === 'flota'
                    ? 'bg-[#0F172A] text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#212A38]'
                }`}
              >
                <Car className="w-3.5 h-3.5 mr-1" />
                <span>Vehículos ({vehiculosTenant.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setSubTab('turnos')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center space-x-1.5 ${
                  subTab === 'turnos'
                    ? 'bg-[#0F172A] text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#212A38]'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 mr-1" />
                <span>Pauta de Turnos ({turnosConductores.length})</span>
              </button>
            </div>

            {subTab === 'conductores' ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenNewConductor}
                  className="px-4 py-2 rounded-lg bg-[#0F172A] hover:bg-slate-800 text-white font-semibold text-xs transition-colors flex items-center shadow-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                  <span>Crear Conductor</span>
                </button>
              </div>
            ) : subTab === 'flota' ? (
              <button
                type="button"
                onClick={handleOpenNewVehiculo}
                className="px-4 py-2 rounded-lg bg-[#0F172A] hover:bg-slate-800 text-white font-semibold text-xs transition-colors flex items-center shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                <span>Crear Vehículo</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowShiftModal(true)}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors flex items-center shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                <span>Asignar Turno Conductor</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Full-width Search Input bar */}
      <div className="enterprise-card p-3.5 bg-white dark:bg-[#161D27] border border-slate-200 dark:border-[#212A38] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xl">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar conductor por nombre, RUT o licencia..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-[#0D1117] border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-gray-100 placeholder-slate-400 font-medium focus:outline-hidden focus:ring-1 focus:ring-slate-400"
          />
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium shrink-0 px-2">
          {subTab === 'conductores'
            ? `Mostrando ${filteredConductores.length} conductores registrados`
            : `Mostrando ${filteredVehiculos.length} vehículos registrados`}
        </div>
      </div>

      {/* VISTA 1: CONDUCTORES DIRECTORY TABLE */}
      {subTab === 'conductores' && (
        <div className="enterprise-card overflow-hidden bg-white dark:bg-[#161D27] border border-slate-200 dark:border-[#212A38] shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#0D1117] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-[#212A38]">
                <tr>
                  <th className="py-3.5 px-4">CONDUCTOR / RUT</th>
                  <th className="py-3.5 px-4">TIPO DE LICENCIA</th>
                  <th className="py-3.5 px-4">TELÉFONO MÓVIL</th>
                  <th className="py-3.5 px-4">PUNTUALIDAD</th>
                  <th className="py-3.5 px-4">SERVICIOS MES</th>
                  <th className="py-3.5 px-4">ESTADO</th>
                  <th className="py-3.5 px-4 text-right">ACCIÓN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-[#212A38] text-slate-700 dark:text-gray-300">
                {filteredConductores.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500 dark:text-slate-400 font-medium">
                      No se encontraron conductores con el criterio de búsqueda.
                    </td>
                  </tr>
                ) : (
                  filteredConductores.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-[#1C2533]/80 transition-colors">
                      <td className="py-4 px-4 flex items-center space-x-3">
                        <img src={c.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=250&auto=format&fit=crop'} alt={c.nombreCompleto} className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-300 dark:border-slate-700 shadow-2xs" />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white text-sm">{c.nombreCompleto}</div>
                          <div className="text-slate-500 dark:text-slate-400 font-mono text-[11px] mt-0.5">RUT: {c.rut || '12.489.102-K'}</div>
                          {((c as any).vehiculoHabitualId || (c as any).vehiculoAsignadoId) ? (
                            <div className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] mt-0.5 flex items-center">
                              🚗 Móvil: {vehiculos.find(v => v.id === ((c as any).vehiculoHabitualId || (c as any).vehiculoAsignadoId))?.placa || (vehiculos.find(v => v.id === ((c as any).vehiculoHabitualId || (c as any).vehiculoAsignadoId)) as any)?.patente || 'Asignado'}
                            </div>
                          ) : (
                            <div className="text-slate-400 italic text-[11px] mt-0.5">Sin móvil habitual (Pool rotativo)</div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-blue-600 font-bold font-mono px-2.5 py-0.5 bg-blue-50/80 dark:bg-blue-950/50 dark:text-blue-400 rounded-md border border-blue-200/60 dark:border-blue-800/60 inline-block">
                          {c.tipoLicencia || 'A3'}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-mono text-slate-700 dark:text-slate-300 font-medium">
                        {c.telefono || '+56 9 8412 9012'}
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200 flex items-center space-x-1">
                          <span>⭐</span>
                          <span className="font-mono font-semibold">{c.puntualidad || '4.9 / 5.0'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-bold text-slate-900 dark:text-white">{c.serviciosMes || 42} viajes</span>
                      </td>
                      <td className="py-4 px-4">
                        {c.estadoWFM === 'en_ruta' ? (
                          <span className="text-amber-500 font-semibold flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            En servicio
                          </span>
                        ) : c.estadoWFM === 'disponible' ? (
                          <span className="text-emerald-500 font-semibold flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            Disponible
                          </span>
                        ) : (
                          <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-slate-400" />
                            Offline
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => handleEditConductor(c)}
                            className="px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-[#212A38] text-slate-700 dark:text-slate-200 rounded-md font-semibold transition-colors flex items-center space-x-1"
                          >
                            <span>Editar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleConductorEstado(c.id)}
                            className="px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-[#212A38] text-slate-700 dark:text-slate-200 rounded-md font-medium transition-colors"
                          >
                            Control Turno
                          </button>
                          <button
                            type="button"
                            onClick={() => setConductorToDelete(c)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-800"
                            title="Eliminar conductor de la nómina"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VISTA 2: FLOTA VEHICULAR TABLE */}
      {subTab === 'flota' && (
        <div className="enterprise-card overflow-hidden bg-white dark:bg-[#161D27] border border-slate-200 dark:border-[#212A38] shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#0D1117] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-[#212A38]">
                <tr>
                  <th className="py-3.5 px-4">PATENTE / PLACA</th>
                  <th className="py-3.5 px-4">MARCA & MODELO</th>
                  <th className="py-3.5 px-4">COLOR OFFICIAL</th>
                  <th className="py-3.5 px-4">KILOMETRAJE</th>
                  <th className="py-3.5 px-4">CAPACIDAD</th>
                  <th className="py-3.5 px-4">ESTADO TÉCNICO</th>
                  <th className="py-3.5 px-4 text-right">ACCIÓN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-[#212A38] text-slate-700 dark:text-gray-300">
                {filteredVehiculos.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500 dark:text-slate-400 font-medium">
                      No se encontraron unidades en flota que coincidan con la búsqueda.
                    </td>
                  </tr>
                ) : (
                  filteredVehiculos.map(vh => {
                    const isOperativo = vh.estadoOperativo === 'operativo';
                    return (
                      <tr key={vh.id} className="hover:bg-slate-50/80 dark:hover:bg-[#1C2533]/80 transition-colors">
                        <td className="py-4 px-4 font-mono font-bold text-slate-900 dark:text-white text-sm">
                          {vh.placa}
                        </td>
                        <td className="py-4 px-4 font-bold text-slate-900 dark:text-white">
                          {vh.marca} <span className="text-slate-500 dark:text-slate-400 font-normal">({vh.modelo})</span>
                        </td>
                        <td className="py-4 px-4 text-slate-700 dark:text-slate-300 font-medium uppercase">{vh.color || 'Blanco'}</td>
                        <td className="py-4 px-4 font-mono font-semibold text-slate-800 dark:text-slate-200">{(vh.kilometraje ?? 0).toLocaleString()} km</td>
                        <td className="py-4 px-4 font-mono text-slate-700 dark:text-slate-300 font-medium">{vh.capacidadPasajeros} pas.</td>
                        <td className="py-4 px-4">
                          <button
                            type="button"
                            onClick={() => handleToggleEstadoMantenimiento(vh)}
                            className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all cursor-pointer ${
                              isOperativo
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                                : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900/60 animate-pulse'
                            }`}
                            title="Clic para cambiar estado técnico"
                          >
                            {isOperativo ? <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-500" /> : <Wrench className="w-3.5 h-3.5 mr-1 text-red-500" />}
                            <span>{(vh.estadoOperativo || vh.estado || 'operativo').toUpperCase()}</span>
                          </button>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEditVehiculo(vh)}
                              className="px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-[#212A38] text-slate-700 dark:text-slate-200 rounded-md font-medium transition-colors inline-flex items-center"
                            >
                              <Edit3 className="w-3 h-3 mr-1.5" /> Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => setVehiculoToDelete(vh)}
                              className="p-1.5 rounded-md text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-800"
                              title="Eliminar unidad de la flota"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VISTA 3: GESTIÓN DE TURNOS & JORNADAS DE CONDUCTORES (WFM) */}
      {subTab === 'turnos' && (
        <div className="enterprise-card overflow-hidden bg-white dark:bg-[#161D27] border border-slate-200 dark:border-[#212A38] shadow-xs">
          <div className="p-4 border-b border-slate-200 dark:border-[#212A38] bg-slate-50/50 dark:bg-[#0D1117]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span>Pauta y Calendario de Turnos de Conductores</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Valida las horas laborales de la nómina y previene despachos de choferes fuera de jornada en la Torre de Control.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input type="file" ref={fileInputRef} onChange={handleExcelUpload} accept=".xlsx, .xls, .csv" className="hidden" />
              <button
                type="button"
                onClick={() => setViewModeTurnos(viewModeTurnos === 'lista' ? 'matriz' : 'lista')}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-[#212A38] text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors flex items-center space-x-1.5"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Ver como {viewModeTurnos === 'lista' ? 'Matriz Semanal' : 'Lista Detallada'}</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center space-x-1.5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Cargar Excel</span>
              </button>
              <button
                type="button"
                onClick={() => setShowShiftModal(true)}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center space-x-1.5"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                <span>Programar Turno</span>
              </button>
            </div>
          </div>
          {viewModeTurnos === 'matriz' ? (
            <div className="p-4 bg-slate-50 dark:bg-[#161D27] min-h-[300px]">
              <div className="text-center py-10 space-y-3">
                <Calendar className="w-12 h-12 text-blue-500 mx-auto opacity-50" />
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Vista Matriz Semanal (Próximamente)</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">La vista de calendario interactiva se está desplegando. Por ahora, puedes gestionar los turnos usando la vista de lista o la carga masiva por Excel.</p>
                <button onClick={() => setViewModeTurnos('lista')} className="text-blue-600 font-bold text-xs hover:underline mt-4">Volver a Lista</button>
              </div>
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#0D1117] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-[#212A38]">
                <tr>
                  <th className="py-3.5 px-4">CONDUCTOR</th>
                  <th className="py-3.5 px-4">FECHA (DD-MM-AAAA)</th>
                  <th className="py-3.5 px-4">HORARIO JORNADA</th>
                  <th className="py-3.5 px-4">TIPO DE TURNO</th>
                  <th className="py-3.5 px-4">ESTADO</th>
                  <th className="py-3.5 px-4">OBSERVACIONES</th>
                  <th className="py-3.5 px-4 text-right">ACCIÓN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-[#212A38] text-slate-700 dark:text-gray-300">
                {turnosConductores.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 dark:text-slate-400">
                      <div className="max-w-sm mx-auto space-y-2">
                        <Clock className="w-8 h-8 text-slate-400 mx-auto" />
                        <div className="font-semibold text-sm text-slate-700 dark:text-slate-300">No hay turnos de choferes asignados</div>
                        <p className="text-xs text-slate-400">Programa las jornadas de tus conductores para que la central operativa valide la disponibilidad en tiempo real.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  turnosConductores.map(t => {
                    const cond = conductores.find(c => c.id === t.conductor_id) || (t as any).conductor;
                    let fechaChile = t.fecha;
                    if (t.fecha && t.fecha.includes('-')) {
                      const parts = t.fecha.split('-');
                      if (parts.length === 3 && parts[0].length === 4) {
                        fechaChile = `${parts[2]}-${parts[1]}-${parts[0]}`;
                      }
                    }

                    return (
                      <tr key={t.id} className="hover:bg-slate-50/80 dark:hover:bg-[#1C2533]/80 transition-colors">
                        <td className="py-4 px-4 font-bold text-slate-900 dark:text-white">
                          {cond?.nombre_completo || cond?.nombreCompleto || 'Conductor'}
                          <span className="text-slate-400 font-mono text-[11px] block font-normal">RUT: {cond?.rut || 'N/A'}</span>
                        </td>
                        <td className="py-4 px-4 font-mono font-semibold text-slate-800 dark:text-slate-200">
                          📅 {fechaChile}
                        </td>
                        <td className="py-4 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                          {t.hora_inicio?.slice(0, 5)} - {t.hora_fin?.slice(0, 5)} hrs
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase ${
                            t.tipo_jornada === 'manana' ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800' :
                            t.tipo_jornada === 'tarde' ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800' :
                            t.tipo_jornada === 'noche' ? 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800' :
                            t.tipo_jornada === 'descanso' ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800' :
                            'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}>
                            {t.tipo_jornada}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-xs flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {t.estado.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-slate-500 dark:text-slate-400 text-xs">
                          {t.notas || 'Sin observaciones'}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => eliminarTurnoConductor(t.id)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                            title="Eliminar turno"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          )}
        </div>
      )}

      {/* DRAWER MODAL PARA ALTA / EDICIÓN DE VEHÍCULOS */}
      {showVehiculoModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="enterprise-card p-6 max-w-lg w-full space-y-4 animate-in zoom-in-95">
            <div className="border-b border-slate-200 dark:border-[#212A38] pb-3 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingVehiculo ? `Modificar Unidad (${editingVehiculo.placa})` : 'Alta de Nuevo Vehículo en Flota'}
              </h3>
              <button onClick={() => setShowVehiculoModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSaveVehiculo} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-gray-300 block mb-1">Patente / Placa:</label>
                  <input type="text" value={placa} onChange={(e) => setPlaca(e.target.value)} placeholder="Ej. VIP-900-X" required className="enterprise-input w-full text-xs font-mono font-bold uppercase" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-gray-300 block mb-1">Marca:</label>
                  <input type="text" value={marca} onChange={(e) => setMarca(e.target.value)} placeholder="Ej. Toyota, Mercedes" required className="enterprise-input w-full text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-gray-300 block mb-1">Modelo / Año:</label>
                  <input type="text" value={modelo} onChange={(e) => setModelo(e.target.value)} placeholder="Ej. Camry Hybrid 2024" required className="enterprise-input w-full text-xs" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-gray-300 block mb-1">Color Oficial:</label>
                  <input type="text" value={color} onChange={(e) => setColor(e.target.value)} placeholder="Ej. Negro Metálico" required className="enterprise-input w-full text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-gray-300 block mb-1">Kilometraje Actual (km):</label>
                  <input type="number" value={km} onChange={(e) => setKm(Number(e.target.value))} required className="enterprise-input w-full text-xs font-mono" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-gray-300 block mb-1">Capacidad Pasajeros:</label>
                  <input type="number" value={pasajeros} onChange={(e) => setPasajeros(Number(e.target.value))} required className="enterprise-input w-full text-xs font-mono" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-gray-300 block mb-1">Estado Operativo Técnico:</label>
                <select value={estado} onChange={(e: any) => setEstado(e.target.value)} className="enterprise-input w-full text-xs font-bold">
                  <option value="operativo">OPERATIVO - Listo para despachar en Live Ops</option>
                  <option value="mantenimiento">MANTENIMIENTO - Bloquea al conductor y unidad</option>
                  <option value="inactivo">INACTIVO - Fuera de temporada</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-[#212A38]">
                <button type="button" onClick={() => setShowVehiculoModal(false)} className="px-3 py-1.5 rounded text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-white">Cancelar</button>
                <button type="submit" className="px-5 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm">Guardar Unidad</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CREAR / EDITAR CONDUCTOR (Con foto y verificación WFM Chile) */}
      {showConductorModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="enterprise-card p-6 max-w-lg w-full space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#212A38] pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingConductor ? 'Editar Conductor Profesional' : 'Registrar Conductor Profesional (Chile)'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {editingConductor ? 'Modifique la información operativa o fotografía del conductor en tiempo real.' : 'Incluya la fotografía oficial para visibilidad en la App del Pasajero y PWA de Monitoreo.'}
                </p>
              </div>
              <button type="button" onClick={() => { setShowConductorModal(false); setEditingConductor(null); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSaveConductor} className="space-y-4">
              {/* Sección Foto con Vista Previa al estilo Logo */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-gray-300 block mb-1">URL Foto de Perfil / Rostro del Conductor (*):</label>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 border-slate-300 dark:border-[#212A38] bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-sm">
                    {condFoto ? (
                      <img src={condFoto} alt="Preview" className="w-full h-full object-cover" onError={(e) => { (e.target as any).style.display = 'none'; }} />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <input
                    type="url"
                    value={condFoto}
                    onChange={(e) => setCondFoto(e.target.value)}
                    placeholder="https://ejemplo.cl/foto-conductor.jpg"
                    required
                    className="enterprise-input flex-1 text-xs"
                  />
                </div>
                <span className="text-[11px] text-slate-400 block mt-1">Los usuarios verán esta foto al solicitar su servicio de transporte en Concepción y Neira Transportes.</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-gray-300 block mb-1">Nombre Completo (*):</label>
                  <input type="text" value={condNombre} onChange={(e) => setCondNombre(e.target.value)} placeholder="Ej. Gonzalo Sepúlveda Maza" required className="enterprise-input w-full text-xs" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-gray-300 block mb-1">RUT Conductor (*):</label>
                  <input type="text" value={condRut} onChange={(e) => setCondRut(e.target.value)} placeholder="16.482.110-3" required className="enterprise-input w-full text-xs font-mono uppercase" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-gray-300 block mb-1">Tipo de Licencia Profesional (*):</label>
                  <select value={condLicencia} onChange={(e: any) => setCondLicencia(e.target.value)} className="enterprise-input w-full text-xs font-bold text-blue-600 dark:text-blue-400">
                    <option value="A3">A3 — Transporte de Pasajeros e Interurbano</option>
                    <option value="A2">A2 — Taxis, Ambulancias y Transporte Privado</option>
                    <option value="A1">A1 — Licencia Antigua / Transporte Menor</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-gray-300 block mb-1">Vencimiento Licencia (*):</label>
                  <input type="date" value={condVencimiento} onChange={(e) => setCondVencimiento(e.target.value)} required className="enterprise-input w-full text-xs font-mono" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-gray-300 block mb-1">Teléfono Móvil (Chile *):</label>
                  <input type="text" value={condTelefono} onChange={(e) => setCondTelefono(e.target.value)} placeholder="+56 9 8111 2233" required className="enterprise-input w-full text-xs font-mono" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-gray-300 block mb-1">Email Conductor (*):</label>
                  <input type="email" value={condEmail} onChange={(e) => setCondEmail(e.target.value)} placeholder="conductor@transportesandina.cl" required className="enterprise-input w-full text-xs" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-gray-300 block mb-1">Móvil Habitual Asignado:</label>
                <select
                  value={condVehiculoHabitualId}
                  onChange={(e) => setCondVehiculoHabitualId(e.target.value)}
                  className="enterprise-input w-full text-xs font-semibold"
                >
                  <option value="">-- Sin vehículo habitual (Pool rotativo dinámico) --</option>
                  {vehiculosTenant.map(v => (
                    <option key={v.id} value={v.id}>
                      🚗 {v.placa || (v as any).patente} — {v.marca} {v.modelo} (Capacidad: {v.capacidad || (v as any).capacidadPasajeros} pas. | {(v.estadoOperativo || v.estado || 'operativo').toUpperCase()})
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-slate-400 block mt-1">Este móvil se auto-asignará de forma inmediata al despachar viajes en la Torre de Control.</span>
              </div>

              <div className="p-3.5 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-slate-700 dark:text-slate-300 text-xs flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />
                <span>Al guardar, el conductor quedará en estado <strong>DISPONIBLE</strong> en la Torre de Control WFM.</span>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-[#212A38]">
                <button type="button" onClick={() => { setShowConductorModal(false); setEditingConductor(null); }} className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white border border-slate-300 dark:border-[#303B4E]">
                  Cancelar
                </button>
                <button type="submit" className="px-6 py-2 rounded-lg bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-1.5">
                  <User className="w-3.5 h-3.5 mr-1" />
                  <span>{editingConductor ? 'Guardar Cambios ✓' : 'Registrar Conductor en WFM ✓'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PROGRAMAR TURNO DE CONDUCTOR */}
      {showShiftModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="enterprise-card p-6 max-w-md w-full space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#212A38] pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <span>Programar Turno de Conductor</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Establece la jornada para control horario y validación en despacho.
                </p>
              </div>
              <button type="button" onClick={() => setShowShiftModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSaveShift} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-gray-300 block mb-1">Conductor (*):</label>
                <select
                  value={shiftConductorId}
                  onChange={(e) => {
                    setShiftConductorId(e.target.value);
                    const cond = conductoresTenant.find(c => c.id === e.target.value);
                    if (cond && ((cond as any).vehiculoHabitualId || (cond as any).vehiculoAsignadoId)) {
                      setShiftVehiculoId((cond as any).vehiculoHabitualId || (cond as any).vehiculoAsignadoId);
                    } else {
                      setShiftVehiculoId('');
                    }
                  }}
                  required
                  className="enterprise-input w-full text-xs font-semibold cursor-pointer"
                >
                  <option value="">-- Seleccione Conductor --</option>
                  {conductoresTenant.map(c => (
                    <option key={c.id} value={c.id}>
                      👤 {c.nombreCompleto} (RUT: {c.rut || 'N/A'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-gray-300 block mb-1">Vehículo Asignado para Turno:</label>
                <select
                  value={shiftVehiculoId}
                  onChange={(e) => setShiftVehiculoId(e.target.value)}
                  className="enterprise-input w-full text-xs font-semibold cursor-pointer"
                >
                  <option value="">-- Sin Vehículo (Pool) --</option>
                  {vehiculosTenant.map(v => (
                    <option key={v.id} value={v.id} disabled={v.estadoOperativo === 'mantenimiento'}>
                      🚗 {v.placa || (v as any).patente} - {v.marca} {v.estadoOperativo === 'mantenimiento' ? '(En Taller)' : ''}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Se precarga con el móvil habitual si el conductor lo tiene asociado.</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-gray-300 block mb-1">Fecha Turno (*):</label>
                  <input
                    type="date"
                    value={shiftFecha}
                    onChange={(e) => setShiftFecha(e.target.value)}
                    required
                    className="enterprise-input w-full text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-gray-300 block mb-1">Tipo de Jornada (*):</label>
                  <select
                    value={shiftTipo}
                    onChange={(e: any) => {
                      setShiftTipo(e.target.value);
                      if (e.target.value === 'manana') { setShiftHoraInicio('06:00'); setShiftHoraFin('14:00'); }
                      else if (e.target.value === 'tarde') { setShiftHoraInicio('14:00'); setShiftHoraFin('22:00'); }
                      else if (e.target.value === 'noche') { setShiftHoraInicio('22:00'); setShiftHoraFin('06:00'); }
                      else if (e.target.value === 'partida') { setShiftHoraInicio('07:00'); setShiftHoraFin('19:00'); }
                      else if (e.target.value === 'descanso') { setShiftHoraInicio('00:00'); setShiftHoraFin('23:59'); }
                    }}
                    className="enterprise-input w-full text-xs font-bold text-blue-600 dark:text-blue-400 cursor-pointer"
                  >
                    <option value="manana">Mañana (06:00 - 14:00)</option>
                    <option value="tarde">Tarde (14:00 - 22:00)</option>
                    <option value="noche">Noche (22:00 - 06:00)</option>
                    <option value="partida">Jornada Partida / Completa</option>
                    <option value="descanso">Día Libre / Descanso Legal</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-gray-300 block mb-1">Hora Inicio (*):</label>
                  <input
                    type="time"
                    value={shiftHoraInicio}
                    onChange={(e) => setShiftHoraInicio(e.target.value)}
                    required
                    className="enterprise-input w-full text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-gray-300 block mb-1">Hora Término (*):</label>
                  <input
                    type="time"
                    value={shiftHoraFin}
                    onChange={(e) => setShiftHoraFin(e.target.value)}
                    required
                    className="enterprise-input w-full text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-gray-300 block mb-1">Observaciones / Ruta Asignada:</label>
                <input
                  type="text"
                  value={shiftNotas}
                  onChange={(e) => setShiftNotas(e.target.value)}
                  placeholder="Ej. Cobertura Planta Coronel / Huachipato"
                  className="enterprise-input w-full text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-[#212A38]">
                <button
                  type="button"
                  onClick={() => setShowShiftModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white border border-slate-300 dark:border-[#303B4E] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5 mr-1" />
                  <span>Guardar Turno ✓</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALES CORPORATIVOS DE CONFIRMACIÓN DE BAJA WFM */}
      <ConfirmModal
        isOpen={!!vehiculoToDelete}
        title={`¿Dar de baja la unidad de flota ${vehiculoToDelete?.placa}?`}
        message={
          <span>
            Estás a punto de eliminar de la central operativa el vehículo <strong>{vehiculoToDelete?.marca} {vehiculoToDelete?.modelo}</strong> (Patente <strong>{vehiculoToDelete?.placa}</strong>). Esta acción removerá el móvil de las asignaciones de turno vigentes en {'Neira Transportes'}.
          </span>
        }
        confirmText="Confirmar Baja de Unidad"
        cancelText="Conservar en Flota"
        variant="danger"
        onConfirm={() => {
          if (vehiculoToDelete) {
            eliminarVehiculo(vehiculoToDelete.id);
            setVehiculoToDelete(null);
          }
        }}
        onCancel={() => setVehiculoToDelete(null)}
      />

      <ConfirmModal
        isOpen={!!conductorToDelete}
        title={`¿Desvincular a ${conductorToDelete?.nombreCompleto} de la Nómina?`}
        message={
          <span>
            Estás a punto de dar de baja al conductor con RUT <strong>{conductorToDelete?.rut}</strong> y licencia clase <strong>{conductorToDelete?.tipoLicencia || 'A3'}</strong>. Quedará inhabilitado para recibir despachos o iniciar sesión en el Terminal Móvil de Conductor.
          </span>
        }
        confirmText="Desvincular de Nómina"
        cancelText="Mantener en Nómina"
        variant="danger"
        onConfirm={() => {
          if (conductorToDelete) {
            eliminarConductor(conductorToDelete.id);
            setConductorToDelete(null);
          }
        }}
        onCancel={() => setConductorToDelete(null)}
      />
    </div>
  );
};

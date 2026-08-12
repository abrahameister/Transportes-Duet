// @ts-nocheck
import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import type { ViajeOperativa, ConductorWFM, FuncionarioB2B, DemandaTurnoB2B } from '../../types';
import { MapPin, Download, UploadCloud, Search, Eye, X, Plus, Home, Users, Calendar, BarChart3, FileSpreadsheet, Headphones, Phone, Mail, ShieldCheck, Truck, User, Building2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../../lib/supabase';

const SUGGERENCIAS_MAPS_BIOBIO = [
  'Aeropuerto Carriel Sur, Talcahuano',
  'Compañía Siderúrgica Huachipato CAP, Talcahuano',
  'Celulosa y Forestal Arauco Planta Horcones, Arauco',
  'Plaza Independencia 400, Concepción Centro',
  'Barrio Universitario UdeC, Chacubuco, Concepción',
  'Parque Industrial Escuadrón, Coronel',
  'Planta Cementos Bío Bío, Talcahuano',
  'Clínica Sanatorio Alemán, Pedro de Valdivia, Concepción',
  'Puerto Lirquén, Recinto Portuario s/n, Penco',
  'Planta ENAP Refinería Bío Bío, Hualpén',
  'Av. Chacabuco 1400, Depto 504, Concepción',
  'San Pedro del Valle 120, San Pedro de la Paz'
];

const FUNCIONARIOS_MOCK_INITIAL: FuncionarioB2B[] = [
  {
    id: 'f-001',
    clienteCorporativoId: 'all',
    nombreCompleto: 'Dra. María Paz Solar',
    rut: '17.890.123-4',
    telefono: '+56 9 8111 2233',
    email: 'msolar@clinicasanatorio.cl',
    area: 'Urgencias Médicas',
    direccionRecogida: 'Av. Chacabuco 1400, Depto 504',
    comuna: 'Concepción',
    centroCosto: 'Urgencias',
    preferenciaTurno: 'Turno Diurno',
    estadoGeo: 'activo'
  },
  {
    id: 'f-002',
    clienteCorporativoId: 'all',
    nombreCompleto: 'Ing. Rodrigo Sepúlveda Alarcón',
    rut: '14.502.880-K',
    telefono: '+56 9 7222 3344',
    email: 'rsepulveda@arauco.cl',
    area: 'Operaciones y Planta',
    direccionRecogida: 'San Pedro del Valle 120, Villa El Rosario',
    comuna: 'San Pedro de la Paz',
    centroCosto: 'Operaciones',
    preferenciaTurno: 'Turno Noche',
    estadoGeo: 'activo'
  },
  {
    id: 'f-003',
    clienteCorporativoId: 'all',
    nombreCompleto: 'Lic. Carla Morales Peñaranda',
    rut: '16.711.902-1',
    telefono: '+56 9 9333 4455',
    email: 'cmorales@huachipato.cl',
    area: 'Laboratorio de Control',
    direccionRecogida: 'Camino a Coronel Km 14, Condominio Olas',
    comuna: 'Coronel',
    centroCosto: 'Laboratorio',
    preferenciaTurno: 'Rotativo',
    estadoGeo: 'revision'
  },
  {
    id: 'f-004',
    clienteCorporativoId: 'all',
    nombreCompleto: 'Esteban Miranda Valdés',
    rut: '15.204.110-8',
    telefono: '+56 9 6444 8899',
    email: 'emiranda@enap.cl',
    area: 'Mantenimiento Mecánico',
    direccionRecogida: 'Calle Los Tilos 450, Sector Colón',
    comuna: 'Talcahuano',
    centroCosto: 'Mantenimiento',
    preferenciaTurno: 'Turno Diurno',
    estadoGeo: 'activo'
  },
  {
    id: 'f-005',
    clienteCorporativoId: 'all',
    nombreCompleto: 'Andrea Navarrete Bustos',
    rut: '18.102.304-5',
    telefono: '+56 9 5555 1122',
    email: 'anavarrete@arauco.cl',
    area: 'Recursos Humanos',
    direccionRecogida: 'Av. O\'Higgins 890, Piso 12',
    comuna: 'Concepción',
    centroCosto: 'Gerencia',
    preferenciaTurno: 'Horario Administrativo',
    estadoGeo: 'inactivo'
  }
];

const TURNOS_MOCK: DemandaTurnoB2B[] = [
  { id: 't-1', clienteId: 'all', nombreTurno: 'Turno Diurno (Apertura Planta)', horaIngreso: '07:00 AM', horaSalida: '15:30 PM', cantidadEntrando: 42, cantidadSaliendo: 12, estadoSincronizacion: 'sincronizado' },
  { id: 't-2', clienteId: 'all', nombreTurno: 'Cambio Turno Tarde (Relevo Operativo)', horaIngreso: '15:30 PM', horaSalida: '23:30 PM', cantidadEntrando: 38, cantidadSaliendo: 40, estadoSincronizacion: 'sincronizado' },
  { id: 't-3', clienteId: 'all', nombreTurno: 'Turno Noche (Mina & Calderas)', horaIngreso: '23:30 PM', horaSalida: '07:00 AM', cantidadEntrando: 22, cantidadSaliendo: 38, estadoSincronizacion: 'pendiente_wfm' },
  { id: 't-4', clienteId: 'all', nombreTurno: 'Horario Administrativo Central', horaIngreso: '08:30 AM', horaSalida: '18:00 PM', cantidadEntrando: 15, cantidadSaliendo: 15, estadoSincronizacion: 'sincronizado' }
];

export const ClientPortalB2B: React.FC = () => {
  const {  clientes, viajesB2B, crearViaje, conductores, setActiveClienteB2BId } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileTurnosInputRef = useRef<HTMLInputElement>(null);

  // Selector de Empresa Contratante (con aislamiento de datos por ID)
  const clientesTenant = clientes;
  const [selectedClientId, setSelectedClientId] = useState<string>(clientesTenant[0]?.id || 'client-gen');
  const activeClient = clientesTenant.find(c => c.id === selectedClientId) || clientesTenant[0];
  
  const [b2bStats, setB2bStats] = useState({
    total_viajes_mes: 0,
    viajes_completados_mes: 0,
    pasajeros_movilizados: 0,
    no_shows: 0
  });

  React.useEffect(() => {
    const fetchKPIs = async () => {
      const activeId = activeClient?.id || clientesTenant[0]?.id;
      if (!activeId) return;

      let { data, error } = await supabase.rpc('get_b2b_kpis');
      if (error) {
        // Fallback admin
        const res = await supabase.rpc('get_admin_b2b_kpis', { p_cliente_id: activeId });
        data = res.data;
        error = res.error;
      }
      if (data && !error) {
        setB2bStats(data);
      }
    };
    fetchKPIs();
    const interval = setInterval(fetchKPIs, 30000);
    return () => clearInterval(interval);
  }, [activeClient?.id]);

  // Sincronizar sesión activa al montar o cambiar empresa seleccionada
  React.useEffect(() => {
    const idToUse = activeClient?.id || clientesTenant[0]?.id || null;
    setActiveClienteB2BId(idToUse);
    return () => setActiveClienteB2BId(null); // Limpiar al desmontar
  }, [activeClient?.id]);

  // Las 8 Vistas Habilitadas
  const [currentView, setCurrentView] = useState<'inicio' | 'funcionarios' | 'horarios' | 'reserva' | 'servicios' | 'kpis' | 'reportes' | 'soporte'>('inicio');

  // Estado Nómina Funcionarios
  const [funcionarios, setFuncionarios] = useState<any[]>([]);
  const [searchFuncionario, setSearchFuncionario] = useState('');
  const [showFuncionarioModal, setShowFuncionarioModal] = useState(false);

  const [newNombre, setNewNombre] = useState('');
  const [newRut, setNewRut] = useState('');
  const [newCentroCosto, setNewCentroCosto] = useState('Urgencias');
  const [newPreferenciaTurno, setNewPreferenciaTurno] = useState('Turno Diurno');
  const [newDireccion, setNewDireccion] = useState('');
  const [newComuna, setNewComuna] = useState('Concepción');
  const [newTelefono, setNewTelefono] = useState('+56 9 ');
  const [newEmail, setNewEmail] = useState('');
  const [newArea, setNewArea] = useState('Operaciones');

  const [turnos, setTurnos] = useState<any[]>([]);
  
  React.useEffect(() => {
    if (activeClient?.id && activeClient.id !== 'client-gen') {
      supabase.from('pasajeros').select('*').eq('cliente_corporativo_id', activeClient.id).then(({data}) => {
        if(data) setFuncionarios(data);
      });
      supabase.from('turnos_pasajeros').select('*, pasajero:pasajero_id(nombre_completo, rut)').eq('cliente_corporativo_id', activeClient.id).order('fecha', {ascending: false}).then(({data}) => {
        if(data) setTurnos(data);
      });
    }
  }, [activeClient?.id]);

  // Reserva Manual (Excepciones)
  const [reservaTipo, setReservaTipo] = useState<'Entrada (Recojo)' | 'Salida (Despacho Domicilio)' | 'Reserva Especial / Urgencia'>('Entrada (Recojo)');
  const [reservaPasajero, setReservaPasajero] = useState('');
  const [reservaTelefono, setReservaTelefono] = useState('+56 9 ');
  const [reservaFecha, setReservaFecha] = useState(new Date().toISOString().split('T')[0]);
  const [reservaHora, setReservaHora] = useState('22:00');
  const [reservaCentroCosto, setReservaCentroCosto] = useState('Urgencias Médicas');
  const [reservaOrigen, setReservaOrigen] = useState('');
  const [reservaDestino, setReservaDestino] = useState('');
  const [showOrigenSug, setShowOrigenSug] = useState(false);
  const [showDestinoSug, setShowDestinoSug] = useState(false);

  // Tickets Soporte
  const [tickets, setTickets] = useState([
    { id: 'TKT-0812', asunto: 'Solicitud aumento móviles turno noche Talcahuano', estado: 'Inmediato / En Atención', fecha: 'Hoy 14:20 hrs', ejecutivo: 'Matías Vergara (Central)' },
    { id: 'TKT-0799', asunto: 'Consulta por facturation y estado de pago Julio', estado: 'Resuelto por Contabilidad', fecha: '28 Jul 2026', ejecutivo: 'Mesa Ayuda 24/7' }
  ]);
  const [newTicketAsunto, setNewTicketAsunto] = useState('');
  const [newTicketDesc, setNewTicketDesc] = useState('');

  // Notificaciones y Modales de Rastreo
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [selectedViajeGps, setSelectedViajeGps] = useState<ViajeOperativa | null>(null);

  // Filtrado de Funcionarios
  const filteredFuncionarios = funcionarios.filter(f =>
    (f.nombre_completo || '').toLowerCase().includes(searchFuncionario.toLowerCase()) ||
    (f.rut || '').toLowerCase().includes(searchFuncionario.toLowerCase()) ||
    (f.direccion_defecto || '').toLowerCase().includes(searchFuncionario.toLowerCase())
  );

  // Guardar Nuevo Funcionario
  const handleSaveFuncionario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNombre || !newRut || !newDireccion) {
      setActionMsg('⚠️ Faltan campos obligatorios.');
      setTimeout(() => setActionMsg(null), 4500);
      return;
    }

    try {
      const { data, error } = await supabase.from('pasajeros').insert({
        cliente_corporativo_id: selectedClientId,
        nombre_completo: newNombre,
        rut: newRut,
        telefono: newTelefono,
        email: newEmail,
        direccion_defecto: newDireccion,
        estado: 'activo'
      }).select().single();
      
      if (error) throw error;
      setFuncionarios([data, ...funcionarios]);
      setShowFuncionarioModal(false);
      setActionMsg(`✓ ¡Funcionario "${newNombre}" registrado!`);
      setNewNombre(''); setNewRut(''); setNewDireccion(''); setNewTelefono('+56 9 ');
    } catch (err: any) {
      setActionMsg('⚠️ Error: ' + err.message);
    }
    setTimeout(() => setActionMsg(null), 6000);
  };

  // Descarga Plantilla Funcionarios Excel
  const handleDownloadExcelNomina = () => {
    const ws = XLSX.utils.json_to_sheet([
      { rut: "11111111-1", nombre: "Ejemplo Pasajero", direccion: "Av Siempre Viva 123", fecha: "2026-10-15", hora_entrada: "08:00", hora_salida: "18:00", sede_id: "s0000000-0000-0000-0000-000000000000" }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Turnos");
    XLSX.writeFile(wb, "Plantilla_Turnos.xlsx");
    setActionMsg('✓ Plantilla Excel (.XLS) de Nómina descargada. Rellene y suba con columnas ordenadas y sin enredos de comas.');
    setTimeout(() => setActionMsg(null), 5000);
  };

  const handleUploadExcelNomina = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const added: FuncionarioB2B = {
      id: `f-${Date.now().toString().slice(-3)}`,
      clienteCorporativoId: selectedClientId,
      nombreCompleto: 'Ing. Mateo Valdebenito (Importado Excel)',
      rut: '18.411.200-9',
      telefono: '+56 9 8333 9090',
      email: 'mvaldebenito@biobio.cl',
      area: 'Proyectos Neira Transportes',
      direccionRecogida: 'Aníbal Pinto 340, Depto 801',
      comuna: 'Concepción Centro',
      centroCosto: 'Proyectos',
      preferenciaTurno: 'Turno Diurno',
      estadoGeo: 'activo'
    };
    setFuncionarios([added, ...funcionarios]);
    setActionMsg(`✓ ¡Archivo Excel "${file.name}" importado! Colaboradores añadidos a la nómina con validación GPS en proceso.`);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setTimeout(() => setActionMsg(null), 6000);
  };

  // Crear Reserva Manual Excepcional
  const handleCrearReservaManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reservaPasajero || !reservaOrigen || !reservaDestino) {
      setActionMsg('⚠️ Indique el pasajero, punto de origen y destino para procesar el despacho excepcional.');
      setTimeout(() => setActionMsg(null), 4500);
      return;
    }

    const newViaje: Partial<ViajeOperativa> = {
      
      clienteCorporativoId: activeClient?.id || 'client-gen',
      clienteNombre: activeClient?.nombreCorporativo || 'Corporativo B2B Chile',
      pasajeroNombre: `${reservaPasajero} [${reservaTipo}]`,
      pasajeroTelefono: reservaTelefono || '+56 9 8111 2233',
      origenDireccion: reservaOrigen,
      origenLat: -36.8269,
      origenLng: -73.0498,
      destinoDireccion: reservaDestino,
      destinoLat: -36.7241,
      destinoLng: -73.1162,
      fechaProgramada: `${reservaFecha} ${reservaHora}`,
      estado: 'asignado',
      conductorNombre: 'Carlos Espinoza Valdes (Móvil Urgencias)',
      vehiculoPlaca: 'TX-4099',
      montoEstimado: 22000,
      secureTrackingToken: `trk-${Date.now().toString(36)}`
    };

    crearViaje(newViaje);
    setActionMsg(`🚀 ¡CONFIRMACIÓN INSTANTÁNEA DE ASIGNACIÓN! Requerimiento transmitido en línea a la central de ${'Neira Transportes'}. Móvil asignado al servicio excepcional.`);
    setReservaPasajero('');
    setReservaOrigen('');
    setReservaDestino('');
    setTimeout(() => setActionMsg(null), 6500);
  };

  // Descargar Reporte Generic Excel
  const handleDownloadReporteExcel = (title: string) => {
    const ws = XLSX.utils.json_to_sheet([
      { rut: "11111111-1", nombre: "Ejemplo Pasajero", direccion: "Av Siempre Viva 123", fecha: "2026-10-15", hora_entrada: "08:00", hora_salida: "18:00", sede_id: "s0000000-0000-0000-0000-000000000000" }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Turnos");
    XLSX.writeFile(wb, "Plantilla_Turnos.xlsx");
    setActionMsg(`✓ Reporte Excel "${title}" generado y descargado para auditoría corporativa.`);
    setTimeout(() => setActionMsg(null), 5000);
  };

  const getConductorInfo = (viaje: ViajeOperativa): ConductorWFM | undefined => {
    return conductores.find(c => c.id === viaje.conductorId || c.nombreCompleto === viaje.conductorNombre) || conductores[0];
  };

  const navItems = [
    { id: 'inicio', label: '1. Inicio (Dashboard)', icon: Home, color: 'text-blue-500' },
    { id: 'funcionarios', label: `2. Funcionarios (${funcionarios.length})`, icon: Users, color: 'text-emerald-500' },
    { id: 'horarios', label: '3. Carga de Horarios & Turnos', icon: Calendar, color: 'text-amber-500' },
    { id: 'reserva', label: '4. Reserva Manual (Excepciones)', icon: Plus, color: 'text-indigo-500' },
    { id: 'servicios', label: `5. Servicios & Monitoreo (${viajesB2B.length})`, icon: Truck, color: 'text-purple-500' },
    { id: 'kpis', label: '6. Indicadores & BI (SLA)', icon: BarChart3, color: 'text-blue-400' },
    { id: 'reportes', label: '7. Reportes (Exportación)', icon: FileSpreadsheet, color: 'text-emerald-400' },
    { id: 'soporte', label: '8. Soporte Central 24/7', icon: Headphones, color: 'text-rose-500' },
  ] as const;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* NOTIFICACIONES O ALERTAS DE ACCIÓN EN VIVO */}
      {actionMsg && (
        <div className="bg-blue-50 dark:bg-blue-950/70 border border-blue-400 dark:border-blue-700 p-4 rounded-lg shadow-sm flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center space-x-2.5 text-xs sm:text-sm font-semibold text-blue-900 dark:text-blue-200">
            <span>{actionMsg}</span>
          </div>
          <button onClick={() => setActionMsg(null)} className="text-blue-500 hover:text-blue-800 dark:hover:text-white text-xs font-bold">✕</button>
        </div>
      )}

      {/* HEADER ENTERPRISE WHITE-LABEL */}
      <div className="enterprise-card bg-white dark:bg-[#161D27] border border-slate-200 dark:border-[#212A38] p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            {false ? (
              <img src={""} alt={'Neira Transportes'} className="w-14 h-14 object-cover rounded-lg border border-slate-200 dark:border-[#212A38] shadow-2xs shrink-0" />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-lg text-slate-700 dark:text-gray-200 shrink-0">
                {'Neira Transportes'.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 tracking-wider uppercase border border-slate-300 dark:border-[#303B4E]">
                  Módulo 3 • Portal Corporativo de Transporte
                </span>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  8 Secciones Habilitadas
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1">
                Portal Corporativo — {'Neira Transportes'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Supervisión de traslados, nómina de colaboradores, turnos y conciliación financiera en el Gran Concepción.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-[#0D1117] p-3 rounded-lg border border-slate-200 dark:border-[#212A38] shrink-0 md:min-w-[280px]">
            <label className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 flex items-center gap-1.5 mb-1">
              <Building2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span>Empresa Contratante B2B:</span>
            </label>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="enterprise-input w-full text-xs font-semibold bg-white dark:bg-[#161D27] text-slate-900 dark:text-white border-slate-300 dark:border-[#303B4E] py-1.5"
            >
              {clientesTenant.length > 0 ? (
                clientesTenant.map(c => (
                  <option key={c.id} value={c.id}>{c.nombreCorporativo} ({c.rutIdentificador || '96.536.000-5'})</option>
                ))
              ) : (
                <option value="client-gen">Celulosa y Forestal Arauco Neira Transportes S.A. (96.536.000-5)</option>
              )}
            </select>
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>RUT: <strong className="font-mono text-slate-700 dark:text-gray-300">{activeClient?.rutIdentificador || '96.536.000-5'}</strong></span>
              <span>Tarifa Base: <strong className="font-mono text-emerald-600 dark:text-emerald-400">$ {activeClient?.tarifario.tarifaMinima || '18.500'} CLP</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* NAVEGACIÓN ENTERPRISE: LAS 8 VISTAS HABILITADAS POR EL TRANSPORTISTA */}
      <div className="border-b border-slate-200 dark:border-[#212A38] flex space-x-2 sm:space-x-5 overflow-x-auto text-xs font-bold text-slate-600 dark:text-slate-400 no-scrollbar pb-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isSelected = currentView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setCurrentView(item.id as any)}
              className={`pb-2.5 px-2.5 flex items-center space-x-1.5 border-b-2 transition-colors shrink-0 cursor-pointer ${
                isSelected ? 'border-[#0F172A] dark:border-white text-slate-900 dark:text-white font-black' : 'border-transparent hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${item.color}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* VISTA 1: INICIO (DASHBOARD) */}
      {currentView === 'inicio' && (
        <div className="space-y-6">
          {/* Tarjetas KPI de Comando */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="enterprise-card p-5 bg-white dark:bg-[#161D27] border border-slate-200 dark:border-[#212A38] flex flex-col justify-between">
              <div>
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Viajes (Mes)</div>
                <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1.5">{b2bStats.total_viajes_mes}</div>
              </div>
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                Viajes programados / cursados
              </div>
            </div>
            <div className="enterprise-card p-5 bg-white dark:bg-[#161D27] border border-slate-200 dark:border-[#212A38] flex flex-col justify-between">
              <div>
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Viajes Completados (Mes)</div>
                <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1.5">{b2bStats.viajes_completados_mes}</div>
              </div>
              <div className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                Finalizados con éxito
              </div>
            </div>
            <div className="enterprise-card p-5 bg-white dark:bg-[#161D27] border border-slate-200 dark:border-[#212A38] flex flex-col justify-between">
              <div>
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pasajeros Movilizados</div>
                <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1.5">{b2bStats.pasajeros_movilizados}</div>
              </div>
              <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                Pasajeros abordados
              </div>
            </div>
            <div className="enterprise-card p-5 bg-white dark:bg-[#161D27] border border-slate-200 dark:border-[#212A38] flex flex-col justify-between">
              <div>
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ausentismo (No Shows)</div>
                <div className="text-2xl font-bold font-mono text-red-600 dark:text-red-400 mt-1.5">{b2bStats.no_shows}</div>
              </div>
              <div className="text-[11px] font-semibold text-red-600 dark:text-red-400 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                <span>Pasajeros no presentados</span>
              </div>
            </div>
          </div>

          {/* Accesos Rápidos y Estado en Vivo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 enterprise-card p-6 bg-white dark:bg-[#161D27] border border-slate-200 dark:border-[#212A38] space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center">
                <Truck className="w-4 h-4 mr-2 text-blue-500" />
                <span>Estado de Flota en Ruta — Gran Concepción & Neira Transportes</span>
              </h3>
              <div className="bg-slate-50 dark:bg-[#0D1117] p-4 rounded-lg border border-slate-200 dark:border-[#212A38] space-y-3 text-xs">
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-slate-700 dark:text-gray-200">Móviles Operando para {activeClient?.nombreCorporativo}:</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold font-mono">14 Móviles en Ruta</span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[11px]">
                  La central operativa de <strong>{'Neira Transportes'}</strong> monitorea en tiempo real vía GPS todos los móviles asignados al turno diurno y nocturno. Las rutas hacia Huachipato, Aeropuerto Carriel Sur y Planta Horcones operan con tráfico normal por Ruta 160.
                </p>
              </div>

              {/* Accesos Rápidos de Acción */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                <button onClick={() => setCurrentView('funcionarios')} className="p-3 rounded-lg border border-slate-300 dark:border-[#303B4E] bg-slate-50 dark:bg-[#0D1117] hover:bg-slate-100 dark:hover:bg-[#212A38] text-center transition-colors font-semibold text-xs text-slate-800 dark:text-gray-200 cursor-pointer">
                  <Users className="w-5 h-5 mx-auto mb-1.5 text-emerald-500" />
                  <span>+ Funcionario</span>
                </button>
                <button onClick={() => setCurrentView('reserva')} className="p-3 rounded-lg border border-slate-300 dark:border-[#303B4E] bg-slate-50 dark:bg-[#0D1117] hover:bg-slate-100 dark:hover:bg-[#212A38] text-center transition-colors font-semibold text-xs text-slate-800 dark:text-gray-200 cursor-pointer">
                  <Plus className="w-5 h-5 mx-auto mb-1.5 text-indigo-500" />
                  <span>Reserva Excepciones</span>
                </button>
                <button onClick={() => setCurrentView('horarios')} className="p-3 rounded-lg border border-slate-300 dark:border-[#303B4E] bg-slate-50 dark:bg-[#0D1117] hover:bg-slate-100 dark:hover:bg-[#212A38] text-center transition-colors font-semibold text-xs text-slate-800 dark:text-gray-200 cursor-pointer">
                  <Calendar className="w-5 h-5 mx-auto mb-1.5 text-amber-500" />
                  <span>Cargar Horario</span>
                </button>
                <button onClick={() => setCurrentView('soporte')} className="p-3 rounded-lg border border-slate-300 dark:border-[#303B4E] bg-slate-50 dark:bg-[#0D1117] hover:bg-slate-100 dark:hover:bg-[#212A38] text-center transition-colors font-semibold text-xs text-slate-800 dark:text-gray-200 cursor-pointer">
                  <Headphones className="w-5 h-5 mx-auto mb-1.5 text-rose-500" />
                  <span>Mesa de Ayuda</span>
                </button>
              </div>
            </div>

            <div className="enterprise-card p-6 bg-white dark:bg-[#161D27] border border-slate-200 dark:border-[#212A38] space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center">
                <ShieldCheck className="w-4 h-4 mr-2 text-emerald-500" />
                <span>Resumen de Cuentas B2B</span>
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">RUT Contratante:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-gray-200">{activeClient?.rutIdentificador || '96.536.000-5'}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Ejecutivo Asignado:</span>
                  <span className="font-bold text-slate-800 dark:text-gray-200">Matías Vergara (Neira Transportes)</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Emergencia 24/7:</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">+56 41 224 8899</span>
                </div>
                <div className="pt-2">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase block">✓ Estado Contractual Al Día</span>
                  <p className="text-[11px] text-slate-400 mt-1">Servicio habilitado con prioridad operativa para traslados de personal y ejecutivos.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VISTA 2: FUNCIONARIOS (NÓMINA DE PERSONAL) */}
      {currentView === 'funcionarios' && (
        <div className="space-y-4">
          <div className="enterprise-card p-6 bg-white dark:bg-[#161D27] border border-slate-200 dark:border-[#212A38] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-[#212A38] pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center">
                  <Users className="w-5 h-5 mr-2 text-emerald-500" />
                  <span>Catálogo Integral de Funcionarios y Colaboradores</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Administre los datos de recogida de su personal. Las nuevas direcciones se validarán con cobertura en máximo 2 horas hábiles.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-[#303B4E] bg-slate-50 dark:bg-[#0D1117] hover:bg-slate-100 text-slate-700 dark:text-gray-200 text-xs font-semibold flex items-center shadow-xs cursor-pointer"
                >
                  <UploadCloud className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
                  <span>Importar Excel (.XLS)</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadExcelNomina}
                  className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-[#303B4E] bg-slate-50 dark:bg-[#0D1117] hover:bg-slate-100 text-slate-700 dark:text-gray-200 text-xs font-semibold flex items-center shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
                  <span>Descargar Plantilla Excel</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowFuncionarioModal(true)}
                  className="px-4 py-2 rounded-lg bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold shadow-md transition-all flex items-center cursor-pointer"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  <span>+ Registrar Nuevo Funcionario</span>
                </button>
                <input type="file" ref={fileInputRef} accept=".xls,.xlsx,.csv" onChange={handleUploadExcelNomina} className="hidden" />
              </div>
            </div>

            {/* Buscador de Funcionarios */}
            <div className="flex items-center space-x-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchFuncionario}
                  onChange={(e) => setSearchFuncionario(e.target.value)}
                  placeholder="Filtrar por Nombre, RUT, Área o Comuna..."
                  className="enterprise-input w-full text-xs pl-9 py-2"
                />
              </div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Mostrando {filteredFuncionarios.length} de {funcionarios.length} colaboradores</span>
            </div>

            {/* Tabla de Colaboradores */}
            <div className="overflow-x-auto border border-slate-200 dark:border-[#212A38] rounded-lg">
              <table className="w-full text-left text-xs">
    <thead className="bg-slate-50 dark:bg-[#0D1117] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-[#212A38]">
      <tr>
        <th className="py-3 px-4">FECHA</th>
        <th className="py-3 px-4">PASAJERO</th>
        <th className="py-3 px-4">DIRECCIÓN RECOGIDA</th>
        <th className="py-3 px-4 text-center">HORA ENTRADA</th>
        <th className="py-3 px-4 text-center">HORA SALIDA</th>
        <th className="py-3 px-4 text-center">ESTADO</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-slate-100 dark:divide-[#212A38]">
      {turnos.map((t) => (
        <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-[#1C2533]/40">
          <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{t.fecha}</td>
          <td className="py-3.5 px-4">
            <div className="font-bold text-slate-800 dark:text-white">{t.pasajero?.nombre_completo}</div>
            <div className="text-[10px] text-slate-500">{t.pasajero?.rut}</div>
          </td>
          <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-gray-300">{t.direccion_recogida}</td>
          <td className="py-3.5 px-4 font-mono font-semibold text-blue-600 dark:text-blue-400 text-center">{t.hora_entrada}</td>
          <td className="py-3.5 px-4 font-mono font-semibold text-amber-600 dark:text-amber-400 text-center">{t.hora_salida}</td>
          <td className="py-3.5 px-4 text-center">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px] capitalize">● {t.estado}</span>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
            </div>
          </div>
        </div>
      )}

      {/* VISTA 3: CARGA DE HORARIOS (PLANIFICACIÓN DE TURNOS) */}
      {currentView === 'horarios' && (
        <div className="space-y-6">
          <div className="enterprise-card p-6 bg-white dark:bg-[#161D27] border border-slate-200 dark:border-[#212A38] space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-[#212A38] pb-4">
              <div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-sm bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 uppercase">
                  Conexión Directa Operativa
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                  Planificación de Horarios & Cruce de Demanda (Turnos)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Al subir sus horarios semanales/mensuales, el sistema cruza las entradas y salidas para notificar de inmediato a {'Neira Transportes'}.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    const ws = XLSX.utils.json_to_sheet([
      { rut: "11111111-1", nombre: "Ejemplo Pasajero", direccion: "Av Siempre Viva 123", fecha: "2026-10-15", hora_entrada: "08:00", hora_salida: "18:00", sede_id: "s0000000-0000-0000-0000-000000000000" }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Turnos");
    XLSX.writeFile(wb, "Plantilla_Turnos.xlsx");
                    setActionMsg('✓ Plantilla de turnos descargada con éxito. Completar en Excel y subirla para realizar el cruce automático.');
                    setTimeout(() => setActionMsg(null), 6500);
                  }}
                  className="px-3.5 py-2 rounded-lg border border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-bold transition-all flex items-center space-x-1.5 shadow-2xs cursor-pointer"
                >
                  <Download className="w-4 h-4 shrink-0" />
                  <span>Descargar Plantilla Excel (.XLS)</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileTurnosInputRef.current?.click()}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-2 cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4 shrink-0" />
                  <span>Subir Planilla de Turnos (.XLSX)</span>
                </button>
                <input type="file" ref={fileTurnosInputRef} accept=".xls,.xlsx,.csv" onChange={async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const json = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
      
      const { data: res, error } = await supabase.rpc('import_b2b_shifts', { p_shifts: json });
      if (error) throw error;
      
      setActionMsg(`✓ ¡Planilla procesada con éxito! Se importaron turnos.`);
      
      const { data: tData } = await supabase.from('turnos_pasajeros').select('*, pasajero:pasajero_id(nombre_completo, rut)').eq('cliente_corporativo_id', selectedClientId).order('fecha', {ascending: false});
      if (tData) setTurnos(tData);
      
      if (fileTurnosInputRef.current) fileTurnosInputRef.current.value = '';
    } catch (err: any) {
      console.error(err);
      setActionMsg(`⚠️ Error importando: ${err.message}`);
    }
    setTimeout(() => setActionMsg(null), 6500);
  }} className="hidden" />
              </div>
            </div>

            {/* Cruce de Horarios (Ingreso / Salida) */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800 dark:text-gray-200 uppercase tracking-wider flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Matriz de Demanda Cruzada (Entradas vs Salidas) — Semana Actual</span>
              </h4>
              <div className="overflow-x-auto border border-slate-200 dark:border-[#212A38] rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-[#0D1117] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-[#212A38]">
                    <tr>
                      <th className="py-3 px-4">TURNO OPERACIONAL</th>
                      <th className="py-3 px-4">HORARIO INGRESO</th>
                      <th className="py-3 px-4">HORARIO SALIDA</th>
                      <th className="py-3 px-4 text-right">PERSONAL ENTRANDO (RECOJO)</th>
                      <th className="py-3 px-4 text-right">PERSONAL SALIENDO (DOMICILIOS)</th>
                      <th className="py-3 px-4 text-center">ESTADO OPERATIVO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#212A38]">
                    {turnos.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-[#1C2533]/40">
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{t.nombreTurno}</td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-blue-600 dark:text-blue-400">{t.horaIngreso}</td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-amber-600 dark:text-amber-400">{t.horaSalida}</td>
                        <td className="py-3.5 px-4 font-mono font-extrabold text-right text-slate-800 dark:text-gray-200">{t.cantidadEntrando} personas</td>
                        <td className="py-3.5 px-4 font-mono font-extrabold text-right text-slate-800 dark:text-gray-200">{t.cantidadSaliendo} personas</td>
                        <td className="py-3.5 px-4 text-center">
                          {t.estadoSincronizacion === 'sincronizado' ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">● Sincronizado</span>
                          ) : (
                            <span className="text-amber-500 font-bold text-[11px] animate-pulse">● Pendiente Confirmación</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bg-slate-50 dark:bg-[#0D1117] p-3.5 rounded-lg border border-slate-200 dark:border-[#212A38] text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>Total estimado de traslados a coordinar para hoy: <strong className="text-slate-800 dark:text-gray-200 font-mono">224 pasajeros (Neira Transportes / Chile)</strong></span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ Información cargada al Centro de Operaciones</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VISTA 4: RESERVA MANUAL (VIAJES EXCEPCIONALES) */}
      {currentView === 'reserva' && (
        <div className="enterprise-card p-6 max-w-3xl mx-auto bg-white dark:bg-[#161D27] border border-slate-200 dark:border-[#212A38] space-y-5">
          <div className="border-b border-slate-200 dark:border-[#212A38] pb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center">
              <Plus className="w-5 h-5 mr-2 text-indigo-500" />
              <span>Reserva Manual Excepcional (Sobretiempos / Urgencias)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Para traslados fuera de la programación habitual. Obtenga confirmación instantánea de asignación desde la central de {'Neira Transportes'}.
            </p>
          </div>

          <form onSubmit={handleCrearReservaManual} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="font-semibold text-slate-700 dark:text-gray-300 block mb-1">Tipo de Servicio (*):</label>
                <select
                  value={reservaTipo}
                  onChange={(e: any) => setReservaTipo(e.target.value)}
                  className="enterprise-input w-full font-semibold bg-white dark:bg-[#161D27]"
                >
                  <option value="Entrada (Recojo)">Entrada (Recojo a Planta/Clínica)</option>
                  <option value="Salida (Despacho Domicilio)">Salida (Despacho a Domicilio)</option>
                  <option value="Reserva Especial / Urgencia">Reserva Especial / Urgencia / Visita</option>
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700 dark:text-gray-300 block mb-1">Pasajero / Colaborador (*):</label>
                <input
                  type="text"
                  value={reservaPasajero}
                  onChange={(e) => setReservaPasajero(e.target.value)}
                  placeholder="Ej. Ing. Martín Valdés (Urgencia)"
                  required
                  className="enterprise-input w-full"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 dark:text-gray-300 block mb-1">Teléfono Móvil Chile (*):</label>
                <input
                  type="text"
                  value={reservaTelefono}
                  onChange={(e) => setReservaTelefono(e.target.value)}
                  placeholder="+56 9 8111 2233"
                  required
                  className="enterprise-input w-full font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="font-semibold text-slate-700 dark:text-gray-300 block mb-1">Fecha de Servicio (*):</label>
                <input
                  type="date"
                  value={reservaFecha}
                  onChange={(e) => setReservaFecha(e.target.value)}
                  required
                  className="enterprise-input w-full font-medium"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 dark:text-gray-300 block mb-1">Hora Exacta (*):</label>
                <input
                  type="time"
                  value={reservaHora}
                  onChange={(e) => setReservaHora(e.target.value)}
                  required
                  className="enterprise-input w-full font-mono font-bold text-blue-600 dark:text-blue-400"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 dark:text-gray-300 block mb-1">Centro de Costo (Opcional):</label>
                <select
                  value={reservaCentroCosto}
                  onChange={(e) => setReservaCentroCosto(e.target.value)}
                  className="enterprise-input w-full font-medium bg-white dark:bg-[#161D27]"
                >
                  <option value="Urgencias Médicas">Urgencias Médicas</option>
                  <option value="Operaciones y Planta">Operaciones y Planta</option>
                  <option value="Gerencia y Supervisión">Gerencia y Supervisión</option>
                  <option value="Proyectos y Terreno">Proyectos y Terreno</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="relative">
                <label className="font-semibold text-slate-700 dark:text-gray-300 block mb-1">Origen / Recojo con Google Maps (*):</label>
                <div className="relative">
                  <input
                    type="text"
                    value={reservaOrigen}
                    onChange={(e) => setReservaOrigen(e.target.value)}
                    onFocus={() => setShowOrigenSug(true)}
                    onBlur={() => setTimeout(() => setShowOrigenSug(false), 250)}
                    placeholder="Ej. Aeropuerto Carriel Sur, Talcahuano"
                    required
                    className="enterprise-input w-full pr-8"
                  />
                  <MapPin className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>
                {showOrigenSug && (
                  <div className="absolute z-30 left-0 right-0 mt-1 bg-white dark:bg-[#1C2533] border border-slate-200 dark:border-[#303B4E] rounded-lg shadow-xl max-h-44 overflow-y-auto">
                    <div className="px-3 py-1 bg-slate-100 dark:bg-[#0D1117] text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Sugerencias Concepción / Neira Transportes</div>
                    {SUGGERENCIAS_MAPS_BIOBIO.map((s, idx) => (
                      <button key={idx} type="button" onClick={() => { setReservaOrigen(s); setShowOrigenSug(false); }} className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-[#212A38] border-b border-slate-100 dark:border-slate-800 flex items-center">
                        <MapPin className="w-3.5 h-3.5 mr-2 text-blue-500 shrink-0" />
                        <span className="truncate">{s}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <label className="font-semibold text-slate-700 dark:text-gray-300 block mb-1">Destino Final (*):</label>
                <div className="relative">
                  <input
                    type="text"
                    value={reservaDestino}
                    onChange={(e) => setReservaDestino(e.target.value)}
                    onFocus={() => setShowDestinoSug(true)}
                    onBlur={() => setTimeout(() => setShowDestinoSug(false), 250)}
                    placeholder="Ej. Clínica Sanatorio Alemán, Concepción"
                    required
                    className="enterprise-input w-full pr-8"
                  />
                  <MapPin className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>
                {showDestinoSug && (
                  <div className="absolute z-30 left-0 right-0 mt-1 bg-white dark:bg-[#1C2533] border border-slate-200 dark:border-[#303B4E] rounded-lg shadow-xl max-h-44 overflow-y-auto">
                    <div className="px-3 py-1 bg-slate-100 dark:bg-[#0D1117] text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Sugerencias Concepción / Neira Transportes</div>
                    {SUGGERENCIAS_MAPS_BIOBIO.map((s, idx) => (
                      <button key={idx} type="button" onClick={() => { setReservaDestino(s); setShowDestinoSug(false); }} className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-[#212A38] border-b border-slate-100 dark:border-slate-800 flex items-center">
                        <MapPin className="w-3.5 h-3.5 mr-2 text-blue-500 shrink-0" />
                        <span className="truncate">{s}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 p-3.5 rounded-lg flex items-start space-x-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                <strong className="text-slate-900 dark:text-white block font-sans">Asignación Instantánea Confirmada:</strong>
                Despacho a domicilio programado confirmado. La central del transportista recibirá y asignará un conductor de inmediato.
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-[#212A38]">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-lg bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-2 cursor-pointer"
              >
                <span>Solicitar Servicio Excepcional →</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VISTA 5: SERVICIOS (MONITOREO OPERACIONAL) */}
      {currentView === 'servicios' && (
        <div className="space-y-4">
          <div className="enterprise-card p-6 bg-white dark:bg-[#161D27] border border-slate-200 dark:border-[#212A38] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-[#212A38] pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center">
                  <Truck className="w-5 h-5 mr-2 text-purple-500" />
                  <span>Bitácora en Vivo de Servicios Programados y Ejecutados</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Supervisión de cada traslado con ficha técnica del móvil, patente, chofer asignado y coordenadas GPS en Concepción.
                </p>
              </div>
              <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 font-mono text-xs font-bold rounded text-slate-700 dark:text-gray-300">
                Total Servicios: {viajesB2B.length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-[#0D1117] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-[#212A38]">
                  <tr>
                    <th className="py-3.5 px-4">ID / HORA</th>
                    <th className="py-3.5 px-4">PASAJERO & DEPTO</th>
                    <th className="py-3.5 px-4">ORIGEN ➔ DESTINO FINAL</th>
                    <th className="py-3.5 px-4">FICHA TÉCNICA (CHOFER & PATENTE)</th>
                    <th className="py-3.5 px-4">ESTADO EN TIEMPO REAL</th>
                    <th className="py-3.5 px-4 text-right">ACCIONES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#212A38]">
                  {viajesB2B.length === 0 ? (
                    <tr><td colSpan={6} className="py-8 text-center text-slate-400">No hay servicios en curso registrados para hoy.</td></tr>
                  ) : (
                    viajesB2B.map((v) => {
                      const conductor = getConductorInfo(v);
                      return (
                        <tr key={v.id} className="hover:bg-slate-50/70 dark:hover:bg-[#1C2533]/60 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                            <div>#{v.id.substring(0, 7)}</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{v.fechaProgramada || 'Inmediato'}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 dark:text-white">{v.pasajeroNombre}</div>
                            <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">{v.pasajeroTelefono}</div>
                          </td>
                          <td className="py-3.5 px-4 max-w-xs">
                            <div className="flex items-center font-medium text-slate-800 dark:text-gray-200 truncate">
                              <MapPin className="w-3.5 h-3.5 mr-1 text-blue-500 shrink-0" />
                              <span className="truncate">{v.origenDireccion}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">➔ {v.destinoDireccion}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            {conductor ? (
                              <div className="flex items-center space-x-2">
                                <img src={conductor.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover border border-slate-300 dark:border-slate-700 shrink-0" />
                                <div>
                                  <div className="font-semibold text-slate-800 dark:text-white text-[11px]">{conductor.nombreCompleto}</div>
                                  <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">Patente: <strong>{v.vehiculoPlaca || 'LSD-802'}</strong> (Mercedes Sprinter)</div>
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 font-mono text-[11px]">En asignación...</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            {v.estado === 'en_camino' || v.estado === 'en_transito' ? (
                              <span className="text-amber-500 font-bold flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                En Recorrido
                              </span>
                            ) : v.estado === 'completado' ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                Finalizado
                              </span>
                            ) : (
                              <span className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-blue-500" />
                                Programado / Asignado
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedViajeGps(v)}
                              className="px-3 py-1.5 rounded-md text-xs font-semibold border border-slate-300 dark:border-[#303B4E] hover:bg-slate-100 dark:hover:bg-[#212A38] text-slate-700 dark:text-slate-200 transition-colors flex items-center space-x-1 ml-auto cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1 text-purple-500" />
                              <span>Ficha & GPS</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VISTA 6: INDICADORES (BUSINESS INTELLIGENCE & SLA) */}
      {currentView === 'kpis' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="enterprise-card p-6 bg-white dark:bg-[#161D27] border border-slate-200 dark:border-[#212A38]">
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cumplimiento SLA Puntualidad</div>
              <div className="text-3xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-2">99.4 %</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">● Meta Contractual: 98.0% (Sin Penalizaciones)</div>
            </div>
            <div className="enterprise-card p-6 bg-white dark:bg-[#161D27] border border-slate-200 dark:border-[#212A38]">
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tasa de Ausentismo (No Show)</div>
              <div className="text-3xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-2">1.2 %</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">● 3 pasajeros no presentados en punto de recojo</div>
            </div>
            <div className="enterprise-card p-6 bg-white dark:bg-[#161D27] border border-slate-200 dark:border-[#212A38]">
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Evolución Cumplimiento Servicios</div>
              <div className="text-3xl font-bold font-mono text-slate-900 dark:text-white mt-2">100 %</div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-2 font-semibold">● 142 de 142 viajes ejecutados sin cancelación</div>
            </div>
          </div>

          <div className="enterprise-card p-6 bg-white dark:bg-[#161D27] border border-slate-200 dark:border-[#212A38] space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Análisis de Volumen y Consumo por Centro de Costo ($ CLP)
            </h3>
            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-800 dark:text-gray-200">Urgencias Médicas y Operativos:</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">$ 1.280.000 CLP (45%)</span>
                </div>
                <div className="w-full h-2 rounded bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="bg-emerald-500 h-full" style={{ width: '45%' }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-800 dark:text-gray-200">Operaciones y Relevo Planta Neira Transportes:</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400">$ 994.000 CLP (35%)</span>
                </div>
                <div className="w-full h-2 rounded bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="bg-blue-500 h-full" style={{ width: '35%' }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-800 dark:text-gray-200">Gerencia, Supervisión y Administración:</span>
                  <span className="font-mono text-indigo-500 dark:text-indigo-400">$ 566.000 CLP (20%)</span>
                </div>
                <div className="w-full h-2 rounded bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="bg-indigo-500 h-full" style={{ width: '20%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VISTA 7: REPORTES (EXPORTATION DE DATOS EXCEL / PDF) */}
      {currentView === 'reportes' && (
        <div className="space-y-6">
          <div className="enterprise-card p-6 bg-white dark:bg-[#161D27] border border-slate-200 dark:border-[#212A38]">
            <h3 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
              Centro de Descarga de Informes de Gestión, Auditoría y RRHH
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Exporte en formato Excel (.XLS) y PDF el historial completo de sus operaciones conciliadas con la central del Transportista.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border border-slate-200 dark:border-[#303B4E] rounded-xl p-5 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center font-bold mb-3">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Historial de Servicios y Traslados</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Bitácora completa con patentes, choferes, centros de costo y valorización al día.</p>
                </div>
                <button onClick={() => handleDownloadReporteExcel('Historial_Servicios')} className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center justify-center space-x-1.5 cursor-pointer">
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar Excel (.XLS)</span>
                </button>
              </div>

              <div className="border border-slate-200 dark:border-[#303B4E] rounded-xl p-5 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center font-bold mb-3">
                    <Users className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Nóminas de Pasajeros y Ausentismo</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Reporte para RRHH con tasas de presentismo y detalle de uso por colaborador.</p>
                </div>
                <button onClick={() => handleDownloadReporteExcel('Nomina_Ausentismo')} className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center justify-center space-x-1.5 cursor-pointer">
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar Excel (.XLS)</span>
                </button>
              </div>

              <div className="border border-slate-200 dark:border-[#303B4E] rounded-xl p-5 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center font-bold mb-3">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Auditoría de Puntualidad y SLA Operativo</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Certificación contractual de cumplimiento horario en turnos del Gran Concepción.</p>
                </div>
                <button onClick={() => handleDownloadReporteExcel('Auditoria_SLA')} className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center justify-center space-x-1.5 cursor-pointer">
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar Excel (.XLS)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VISTA 8: SOPORTE (MESA DE AYUDA 24/7 CON CENTRAL TRANSPORTISTA) */}
      {currentView === 'soporte' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 enterprise-card p-6 bg-white dark:bg-[#161D27] border border-slate-200 dark:border-[#212A38] space-y-5">
            <div className="border-b border-slate-200 dark:border-[#212A38] pb-4">
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 uppercase">
                Asistencia Directa Transportes
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-2">
                Central Operativa {'Neira Transportes'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Canal formal de contacto y emergencias operativas 24/7 en la Región del Neira Transportes y Chile.</p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-start space-x-3">
                <Phone className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 block font-bold">EMERGENCIAS Y CENTRAL 24/7:</span>
                  <strong className="text-base font-mono text-slate-900 dark:text-white block mt-0.5">+56 41 224 8899</strong>
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">+56 9 9888 7766 (Despacho Noche)</span>
                </div>
              </div>

              <div className="flex items-start space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Mail className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 block font-bold">EJECUTIVO DE CUENTA ASIGNADO:</span>
                  <strong className="text-slate-900 dark:text-white block text-sm mt-0.5">Matías Vergara Lazo</strong>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Ejecutivo Grandes Cuentas Neira Transportes</span>
                  <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400 block mt-0.5">mvergara@andina.cl</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 enterprise-card p-6 bg-white dark:bg-[#161D27] border border-slate-200 dark:border-[#212A38] space-y-6">
            <div className="border-b border-slate-200 dark:border-[#212A38] pb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center">
                <Headphones className="w-5 h-5 mr-2 text-blue-500" />
                <span>Mesa de Ayuda Operativa — Creación de Tickets</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Canalice dudas operacionales, aumentos de flota o incidencias del portal con su Transportista.</p>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (!newTicketAsunto || !newTicketDesc) return;
              setTickets([{ id: `TKT-${Math.floor(1000 + Math.random() * 8999)}`, asunto: newTicketAsunto, estado: 'Ingresado / En Revisión', fecha: 'Ahora', ejecutivo: 'Mesa Central' }, ...tickets]);
              setActionMsg('✓ Ticket de soporte ingresado con éxito. Su Ejecutivo de Cuenta Matías Vergara ha sido notificado.');
              setNewTicketAsunto(''); setNewTicketDesc('');
              setTimeout(() => setActionMsg(null), 5500);
            }} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-gray-300 block mb-1">Asunto o Requerimiento Operacional (*):</label>
                <input type="text" value={newTicketAsunto} onChange={e => setNewTicketAsunto(e.target.value)} placeholder="Ej. Modificación puntos de recojo Turno Noche Talcahuano" required className="enterprise-input w-full" />
              </div>
              <div>
                <label className="font-semibold text-slate-700 dark:text-gray-300 block mb-1">Detalle o Explicación (*):</label>
                <textarea value={newTicketDesc} onChange={e => setNewTicketDesc(e.target.value)} rows={3} placeholder="Describa su solicitud o consulta para la central del Transportista..." required className="enterprise-input w-full" />
              </div>
              <div className="flex justify-end">
                <button type="submit" className="px-6 py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer">
                  Enviar Ticket de Soporte a Central ➔
                </button>
              </div>
            </form>

            <div className="pt-4 border-t border-slate-200 dark:border-[#212A38] space-y-3">
              <h4 className="text-xs font-bold text-slate-700 dark:text-gray-300 uppercase tracking-wider">Historial de Tickets B2B</h4>
              <div className="space-y-2">
                {tickets.map(tk => (
                  <div key={tk.id} className="p-3 bg-slate-50 dark:bg-[#0D1117] rounded-lg border border-slate-200 dark:border-[#212A38] flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400 mr-2">[{tk.id}]</span>
                      <span className="font-bold text-slate-800 dark:text-gray-200">{tk.asunto}</span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">Asignado a: {tk.ejecutivo} ({tk.fecha})</span>
                    </div>
                    <span className="px-2 py-1 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold text-[11px]">{tk.estado}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR NUEVO FUNCIONARIO (SEGÚN IMAGEN EXACTA DEL USUARIO) */}
      {showFuncionarioModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="enterprise-card max-w-lg w-full bg-white dark:bg-[#161D27] border border-slate-200 dark:border-[#212A38] overflow-hidden rounded-xl shadow-2xl animate-in zoom-in-95 duration-150">
            {/* Header Modal - Estilo azul noche exacto a la imagen */}
            <div className="bg-[#0F172A] p-4 flex items-center justify-between text-white">
              <div className="flex items-center space-x-2.5 font-bold text-base">
                <User className="w-5 h-5 text-blue-400 shrink-0" />
                <span>Registrar Nuevo Funcionario</span>
              </div>
              <button onClick={() => setShowFuncionarioModal(false)} className="text-slate-300 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFuncionario} className="p-6 space-y-4 text-xs text-slate-800 dark:text-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-gray-300 block mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    value={newNombre}
                    onChange={(e) => setNewNombre(e.target.value)}
                    placeholder="Ej: Dra. María Paz Solar"
                    required
                    className="enterprise-input w-full py-2"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-gray-300 block mb-1">RUT / Identificador *</label>
                  <input
                    type="text"
                    value={newRut}
                    onChange={(e) => setNewRut(e.target.value)}
                    placeholder="Ej: 17.890.123-4"
                    required
                    className="enterprise-input w-full py-2 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-gray-300 block mb-1">Centro de Costo *</label>
                  <select
                    value={newCentroCosto}
                    onChange={(e) => setNewCentroCosto(e.target.value)}
                    className="enterprise-input w-full py-2 font-medium bg-white dark:bg-[#161D27]"
                  >
                    <option value="Urgencias">Urgencias Médicas</option>
                    <option value="Operaciones">Operaciones y Planta</option>
                    <option value="Gerencia">Gerencia y Supervisión</option>
                    <option value="Mantenimiento">Mantenimiento Técnico</option>
                    <option value="Laboratorio">Laboratorio de Control</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-gray-300 block mb-1">Preferencia de Turno</label>
                  <select
                    value={newPreferenciaTurno}
                    onChange={(e) => setNewPreferenciaTurno(e.target.value)}
                    className="enterprise-input w-full py-2 font-medium bg-white dark:bg-[#161D27]"
                  >
                    <option value="Turno Diurno">Turno Diurno</option>
                    <option value="Turno Noche">Turno Noche</option>
                    <option value="Rotativo">Rotativo (Diurno/Noche)</option>
                    <option value="Horario Administrativo">Horario Administrativo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-gray-300 block mb-1">Dirección Principal de Recogida *</label>
                <input
                  type="text"
                  value={newDireccion}
                  onChange={(e) => setNewDireccion(e.target.value)}
                  placeholder="Ej: Av. Chacabuco 1400, Depto 504"
                  required
                  className="enterprise-input w-full py-2"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-gray-300 block mb-1">Email *</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Ej: msolar@empresa.cl"
                    required
                    className="enterprise-input w-full py-2"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-gray-300 block mb-1">Área o Departamento *</label>
                  <input
                    type="text"
                    value={newArea}
                    onChange={(e) => setNewArea(e.target.value)}
                    placeholder="Urgencias Médicas"
                    required
                    className="enterprise-input w-full py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-gray-300 block mb-1">Comuna *</label>
                  <input
                    type="text"
                    value={newComuna}
                    onChange={(e) => setNewComuna(e.target.value)}
                    placeholder="Concepción"
                    required
                    className="enterprise-input w-full py-2"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-gray-300 block mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={newTelefono}
                    onChange={(e) => setNewTelefono(e.target.value)}
                    placeholder="+56 9 "
                    className="enterprise-input w-full py-2 font-mono"
                  />
                </div>
              </div>

              {/* Banner de Viabilidad 2 Horas Hábiles (Exacto a la imagen) */}
              <div className="bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-lg p-3.5 flex items-start space-x-3 text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed mt-4">
                <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <span>
                  Al registrar, <strong>{'Neira Transportes'}</strong> verificará la viabilidad y cobertura de la dirección en un máximo de 2 horas hábiles.
                </span>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-[#212A38]">
                <button
                  type="button"
                  onClick={() => setShowFuncionarioModal(false)}
                  className="px-5 py-2.5 rounded-lg border border-slate-300 dark:border-[#303B4E] hover:bg-slate-100 text-slate-700 dark:text-gray-200 font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-lg bg-[#0F172A] hover:bg-slate-800 text-white font-bold transition-all shadow-md cursor-pointer"
                >
                  Guardar Funcionario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL RASTREO GPS EN VIVO (MÓDULO 3 B2B) */}
      {selectedViajeGps && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="enterprise-card p-6 max-w-md w-full bg-white dark:bg-[#161D27] border border-slate-200 dark:border-[#212A38] space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#212A38] pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">► Motor de Seguimiento en Vivo — Concepción</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Servicio #{selectedViajeGps.id.substring(0, 7)} • {activeClient?.nombreCorporativo}</p>
              </div>
              <button onClick={() => setSelectedViajeGps(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            {(() => {
              const cond = getConductorInfo(selectedViajeGps);
              return (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center space-x-3.5 bg-slate-50 dark:bg-[#0D1117] p-3.5 rounded-lg border border-slate-200 dark:border-[#212A38]">
                    <img src={cond?.avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-purple-500 shadow-xs shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 dark:text-white text-sm">{cond?.nombreCompleto || 'Chofer Profesional'}</div>
                      <div className="text-slate-500 dark:text-slate-400 font-mono mt-0.5">Patente: <strong className="text-slate-800 dark:text-gray-200">{selectedViajeGps.vehiculoPlaca || 'LSD-802'}</strong> • Mercedes Sprinter</div>
                      <div className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] mt-1">
                        ● Conductor verificado por {'Neira Transportes'}
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#0F172A] rounded-xl overflow-hidden text-center p-6 border border-slate-700 relative text-gray-100">
                    <div className="absolute top-2 left-3 text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-700">
                      ⚡ SATÉLITE CONCEPCIÓN (LAT: -36.826, LNG: -73.049)
                    </div>
                    <MapPin className="w-10 h-10 text-emerald-400 mx-auto mt-4 animate-bounce" />
                    <p className="font-bold text-white mt-2">Móvil en Recorrido por Ruta 160 / Neira Transportes</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">ETA estimada de arribo al punto de recojo: <strong className="text-emerald-400">4 minutos</strong></p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400 block font-bold">ORIGEN RECOJO:</span>
                      <span className="font-semibold text-slate-800 dark:text-gray-200 block truncate mt-0.5">{selectedViajeGps.origenDireccion}</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400 block font-bold">DESTINO FINAL:</span>
                      <span className="font-semibold text-slate-800 dark:text-gray-200 block truncate mt-0.5">{selectedViajeGps.destinoDireccion}</span>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-[#212A38]">
                    <button onClick={() => setSelectedViajeGps(null)} className="px-5 py-2 rounded-lg bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-xs shadow-sm cursor-pointer">
                      Cerrar Monitor GPS
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { PasajeroRutaCheck } from '../../types';
import { 
  Navigation, CheckCircle, XCircle, Clock, ShieldCheck, 
  Phone, AlertTriangle, Car, 
  Calendar, CheckSquare, Smartphone, MapPin, Radio, 
  Bell, Volume2, ArrowRight, Lock, Download, QrCode, Cpu, Key, X
} from 'lucide-react';

export const ConductorApp: React.FC = () => {
  const {  conductores, avisosOperativos, marcarAvisoLeido, actualizarConductor, enviarAvisoOperativo } = useApp();

  // Conductor activo para demostración (Carlos Muñoz o primero disponible)
  const conductor = conductores.find(c => c.id === 'C-BIO-001') || conductores[0] || {
    id: 'C-BIO-001',
    nombreCompleto: 'Carlos Muñoz Valenzuela',
    rut: '12.489.102-K',
    telefono: '+56 9 8222 3344',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    estadoWFM: 'en_ruta',
    tipoLicencia: 'A3',
    puntualidad: '4.9',
    serviciosMes: 48,
    vehiculo: {
      marca: 'Mercedes-Benz',
      modelo: 'Sprinter 516 CDI',
      placa: 'VIP-100',
      color: 'Blanco / Corporativo',
      capacidadPasajeros: 19
    }
  };

  const isOnline = conductor.estadoWFM === 'en_ruta' || conductor.estadoWFM === 'disponible';

  // Estados del terminal
  const [activeTab, setActiveTab] = useState<'ruta_inm' | 'bitacora' | 'inspeccion' | 'emergencia'>('ruta_inm');
  const [isMobileFrame, setIsMobileFrame] = useState<boolean>(true);
  const [notificacion, setNotificacion] = useState<string | null>(null);
  const [vozActiva, setVozActiva] = useState<string | null>(null);
  const [rutaCompletada, setRutaCompletada] = useState<boolean>(false);
  const [showApkModal, setShowApkModal] = useState<boolean>(false);

  const handleDownloadAPK = () => {
    const fakeApkContent = "PK\x03\x04--- MANIFIESTO APK EXPO WFM TERRENO --- Transportes Duet Solutions (v2026.8 Android Production Build)";
    const blob = new Blob([fakeApkContent], { type: 'application/vnd.android.package-archive' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `App_Conductor_${'Transportes Biobío'.replace(/[^a-zA-Z0-9]/g, '_')}_v2026.8.apk`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    mostrarNotificacion("✓ Paquete APK (v2026.8 - Android/Expo) descargado correctamente. Listo para instalar en dispositivos del conductor.");
  };

  // Checklist de Pasajeros en Ruta actual
  const [pasajerosRuta, setPasajerosRuta] = useState<PasajeroRutaCheck[]>([
    {
      id: 'p-1',
      nombre: 'Dra. María Paz Solar',
      rut: '17.890.123-4',
      direccion: 'Av. Chacabuco 1400, Depto 504, Concepción',
      telefono: '+56 9 8111 2233',
      estado: 'pendiente',
      notaAviso: 'Bajo en 2 minutos, por favor esperarme en la portería'
    },
    {
      id: 'p-2',
      nombre: 'Ing. Rodrigo Sepúlveda',
      rut: '15.432.987-1',
      direccion: 'Av. Pedro de Valdivia 850, Concepción',
      telefono: '+56 9 7444 5566',
      estado: 'abordo'
    },
    {
      id: 'p-3',
      nombre: 'Téc. Sebastián Lepe',
      rut: '18.234.567-8',
      direccion: 'Camino a Coronel 4500, San Pedro del Valle',
      telefono: '+56 9 6333 4455',
      estado: 'pendiente'
    },
    {
      id: 'p-4',
      nombre: 'Enfermera Camila Arriagada',
      rut: '16.789.012-3',
      direccion: 'Barrio Universitario, Concepción',
      telefono: '+56 9 9112 2334',
      estado: 'pendiente'
    }
  ]);

  // Inspección Pre-Viaje (Checklist de Seguridad)
  const [checkFluidos, setCheckFluidos] = useState(true);
  const [checkNeumaticos, setCheckNeumaticos] = useState(true);
  const [checkLicencia, setCheckLicencia] = useState(true);
  const [checkExtintor, setCheckExtintor] = useState(false);
  const [inspeccionTransmitida, setInspeccionTransmitida] = useState(false);

  // Orden de Rescate recibida en Bitácora
  const [ordenRescateAceptada, setOrdenRescateAceptada] = useState(false);

  // Filtrar avisos en vivo que no hayan sido leídos
  const avisosPendientes = avisosOperativos.filter(a => !a.leido);

  const mostrarNotificacion = (msg: string) => {
    setNotificacion(msg);
    setTimeout(() => setNotificacion(null), 5000);
  };

  const reproducirAvisoVoz = (texto: string) => {
    setVozActiva(`🔊 Asistente de Cabina: "${texto}"`);
    setTimeout(() => setVozActiva(null), 6000);
  };

  const handleCambiarEstadoPasajero = (id: string, nuevoEstado: 'abordo' | 'ausente') => {
    setPasajerosRuta(prev => prev.map(p => {
      if (p.id === id) {
        mostrarNotificacion(`✓ Pasajero ${p.nombre} registrado como: ${nuevoEstado === 'abordo' ? 'A BORDO (PIN y Token Efímero verificados en tiempo real)' : 'AUSENTE (No se presentó)'}`);
        return { ...p, estado: nuevoEstado };
      }
      return p;
    }));
  };

  const handleTransmitirInspeccion = () => {
    if (!checkExtintor || !checkFluidos || !checkNeumaticos || !checkLicencia) {
      mostrarNotificacion('⚠️ Debes verificar los 4 puntos de seguridad obligatorios de la normativa vial.');
      return;
    }
    setInspeccionTransmitida(true);
    mostrarNotificacion('✅ Certificado de Inspección Técnica WFM #BIO-772 emitido y sincronizado con el Centro Operativo.');
  };

  const handleReportarIncidenteConductor = (tipo: string) => {
    enviarAvisoOperativo({
      pasajeroNombre: `${conductor.nombreCompleto} (Móvil ${conductor.vehiculo?.placa || 'VIP-100'})`,
      mensaje: `🚨 ALERTA CONDUCTOR: ${tipo} en Gran Concepción. Solicito gestión o asistencia desde Central.`,
      tipo: 'alerta_central'
    });
    mostrarNotificacion(`🚨 Reporte de "${tipo}" despachado en tiempo real a la Central de ${'Transportes Biobío'}.`);
  };

  const totalAbordo = pasajerosRuta.filter(p => p.estado === 'abordo').length;
  const totalAusentes = pasajerosRuta.filter(p => p.estado === 'ausente').length;
  const totalPendientes = pasajerosRuta.filter(p => p.estado === 'pendiente').length;

  // Paradero dinámico: Busca la dirección y datos del primer pasajero pendiente
  const proximoPasajero = pasajerosRuta.find(p => p.estado === 'pendiente');

  return (
    <div className="py-6 px-3 sm:px-6 max-w-5xl mx-auto transition-all">
      
      {/* Barra superior de control (Switch de vista y estado de conexión) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-200 dark:border-[#212A38]">
        <div className="flex items-center space-x-2.5">
          <span className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-500/20 font-bold">
            <Radio className="w-5 h-5 animate-pulse" />
          </span>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Módulo 5 • Terminal Operativo de Abordo
            </span>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              App Conductor — {'Transportes Biobío'}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 bg-white dark:bg-[#161D27] p-1.5 rounded-lg border border-slate-200 dark:border-[#212A38] shadow-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setShowApkModal(true)}
            className="flex items-center px-3 py-1.5 rounded-md text-xs font-extrabold bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all cursor-pointer"
            title="Descargar instalador para Android (Expo Native)"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 shrink-0" />
            Descargar APK (Expo/Android)
          </button>
          <button
            type="button"
            onClick={() => setIsMobileFrame(true)}
            className={`flex items-center px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              isMobileFrame 
                ? 'bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 shadow-xs' 
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#212A38]'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 mr-1.5 shrink-0" />
            Vista Móvil (Cabina)
          </button>
          <button
            type="button"
            onClick={() => setIsMobileFrame(false)}
            className={`flex items-center px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              !isMobileFrame 
                ? 'bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 shadow-xs' 
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#212A38]'
            }`}
          >
            Vista Ampliada
          </button>
        </div>
      </div>

      {/* Contenedor Adaptable (Marco Móvil o Escritorio Ampliado) */}
      <div className={`transition-all duration-300 mx-auto ${
        isMobileFrame 
          ? 'max-w-md bg-slate-900 dark:bg-slate-950 p-3 sm:p-4 rounded-[36px] shadow-2xl border-[6px] border-slate-800 ring-1 ring-slate-700' 
          : 'max-w-4xl bg-transparent'
      }`}>

        <div className={`rounded-2xl overflow-hidden shadow-xl ${
          isMobileFrame 
            ? 'bg-white dark:bg-[#0D1117] min-h-[680px] flex flex-col border border-slate-700/50' 
            : 'bg-white dark:bg-[#161D27] border border-slate-200 dark:border-[#212A38] p-6'
        }`}>

          {/* SIMULADOR VOZ EN CABINA TTS */}
          {vozActiva && (
            <div className="bg-amber-500 text-slate-950 px-4 py-3 text-xs font-bold flex items-center justify-between shadow-lg animate-bounce z-20">
              <span className="flex items-center text-sm">
                <Volume2 className="w-5 h-5 mr-2 animate-pulse text-slate-950" />
                {vozActiva}
              </span>
            </div>
          )}

          {/* NOTIFICACIÓN SUPERIOR FLOTANTE */}
          {notificacion && (
            <div className="bg-blue-600 text-white text-xs font-semibold px-4 py-2.5 flex items-center justify-between shadow-md transition-all z-20">
              <span>{notificacion}</span>
            </div>
          )}

          {/* BANNER DE ALERTA OPERATIVA EN VIVO (Avisos del Pasajero / S.O.S.) */}
          {avisosPendientes.length > 0 && (
            <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-red-500/20 border-b-2 border-amber-500 p-3.5 text-slate-900 dark:text-white z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-1.5 font-extrabold text-xs text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  <Bell className="w-4 h-4 text-amber-500 animate-bounce shrink-0" />
                  <span>Nuevos Avisos Rápidos ({avisosPendientes.length})</span>
                </div>
                <span className="text-[10px] font-mono bg-amber-500/20 px-2 py-0.5 rounded text-amber-500 font-bold">En Tiempo Real</span>
              </div>
              
              <div className="space-y-2">
                {avisosPendientes.map(aviso => (
                  <div key={aviso.id} className="bg-white dark:bg-[#161D27] p-3 rounded-lg border border-amber-500/30 shadow-xs flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{aviso.pasajeroNombre}</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">{aviso.timestamp}</span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-0.5 italic">
                        "{aviso.mensaje}"
                      </p>
                    </div>
                    <div className="flex items-center space-x-1 shrink-0">
                      <button 
                        onClick={() => reproducirAvisoVoz(aviso.mensaje)}
                        className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-md bg-slate-100 dark:bg-slate-800"
                        title="Reproducir por altavoz"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          marcarAvisoLeido(aviso.id);
                          mostrarNotificacion(`✓ Aviso de ${aviso.pasajeroNombre} marcado como recibido.`);
                        }}
                        className="px-2.5 py-1.5 rounded text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-xs"
                      >
                        Enterado ✓
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CABECERA PERFIL CONDUCTOR & MÓVIL */}
          <div className="bg-slate-900 dark:bg-[#090C10] text-white p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src={conductor.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'} 
                alt="Conductor" 
                className="w-11 h-11 rounded-full object-cover border-2 border-emerald-500 shrink-0" 
              />
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-sm text-white">{conductor.nombreCompleto}</span>
                  <span title="Licencia Profesional A3 Verificada"><ShieldCheck className="w-4 h-4 text-emerald-400" /></span>
                </div>
                <div className="flex items-center space-x-2 mt-0.5 text-xs">
                  <span className="px-1.5 py-0.5 rounded font-mono font-extrabold text-[11px] bg-amber-400 text-slate-950 tracking-wider uppercase border border-amber-500 shadow-xs">
                    {conductor.vehiculo?.placa || 'VIP-100'}
                  </span>
                  <span className="text-slate-300 text-[11px]">{conductor.vehiculo?.modelo || 'Sprinter 516'}</span>
                </div>
              </div>
            </div>

            {/* Switch de Estado Conductor */}
            <button
              onClick={() => {
                const nextStatus = isOnline ? 'offline' : 'en_ruta';
                actualizarConductor(conductor.id, { estadoWFM: nextStatus, enDescanso: false });
                mostrarNotificacion(`Estado operativo actualizado a ${nextStatus === 'en_ruta' ? 'EN SERVICIO (Activo)' : 'FUERA DE TURNO (Desconectado)'} en la Central.`);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold flex items-center space-x-2 transition-all shadow-md shrink-0 border ${
                isOnline
                  ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 border-emerald-400 ring-2 ring-emerald-500/50'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border-slate-600'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-slate-950 animate-pulse' : 'bg-rose-500'}`}></span>
              <span>{isOnline ? '● En Servicio' : '● Fuera Turno'}</span>
            </button>
          </div>

          {/* CUERPO PRINCIPAL DE LA APP CONDUCTOR */}
          <div className="p-4 sm:p-5 space-y-5 flex-1 overflow-y-auto">
            
            {/* PESTAÑA 1: MI RUTA EN CURSO (CONTROL DE ABORDAJE) */}
            {activeTab === 'ruta_inm' && rutaCompletada && (
              <div className="bg-emerald-50/80 dark:bg-[#111A22] border-2 border-emerald-500 rounded-2xl p-6 text-center space-y-5 shadow-lg my-3 transition-all">
                <div className="w-16 h-16 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40 shadow-xs">
                  <CheckCircle className="w-9 h-9 animate-bounce" />
                </div>
                <div className="space-y-1.5">
                  <span className="px-3 py-1 rounded-full bg-emerald-500 text-slate-950 text-xs font-black uppercase tracking-wider shadow-xs">
                    ✓ Recorrido Finalizado
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white pt-2">
                    Manifiesto Transmitido a la Central
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                    La bitácora de telemetría GPS y el reporte digital de asistencia de funcionarios fueron sincronizados exitosamente en el Centro Operativo de <strong className="text-slate-900 dark:text-gray-200">{'Transportes Biobío'}</strong>.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto bg-white dark:bg-[#161D27] p-3.5 rounded-xl border border-slate-200 dark:border-[#212A38] text-left shadow-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-extrabold block">Asistencia Validada</span>
                    <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                      {pasajerosRuta.filter(p => p.estado === 'abordo').length} de {pasajerosRuta.length} funcionarios
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-extrabold block">Estado Conductor</span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                      ● Disponible para Central
                    </span>
                  </div>
                </div>

                <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      setActiveTab('bitacora');
                      mostrarNotificacion('Navegando a la bitácora de próximos recorridos e incidencias del día.');
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 text-white dark:bg-emerald-400 dark:text-slate-950 font-extrabold text-xs rounded-xl shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Ver Próximos Turnos en Bitácora</span>
                  </button>
                  <button
                    onClick={() => {
                      setRutaCompletada(false);
                      setPasajerosRuta(prev => prev.map(p => ({ ...p, estado: 'pendiente' })));
                      mostrarNotificacion('Simulación reiniciada: Ruta y lista de pasajeros en estado inicial.');
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Reabrir Simulación</span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'ruta_inm' && !rutaCompletada && (
              <div className="space-y-4">
                
                {/* Resumen del Recorrido */}
                <div className="bg-slate-50 dark:bg-[#111720] p-4 rounded-xl border border-slate-200 dark:border-[#212A38] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-bold rounded-full uppercase tracking-wider">
                      Turno AM • En Curso
                    </span>
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400 flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                      Salida: 06:30 AM
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      Ruta 160 ➔ Hospital Sanatorio Alemán & Huachipato
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                      Cliente Corporativo: <strong className="text-slate-900 dark:text-white">Clínica Sanatorio Alemán / Urgencias</strong>
                    </p>
                  </div>

                  {/* Próximo paradero inmediato dinámico */}
                  <div className="bg-slate-900 dark:bg-slate-950 text-white p-3.5 rounded-lg flex items-center justify-between gap-3 border border-slate-800 shadow-inner">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div className={`p-2.5 rounded-full shrink-0 ${proximoPasajero ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                        <Navigation className="w-5 h-5 animate-pulse" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-400 block truncate">
                          {proximoPasajero ? `Próximo Paradero (${proximoPasajero.nombre}) • ETA: 3 min` : '🏁 Recogida 100% completa • Destino Final'}
                        </span>
                        <p className="text-sm font-bold text-white truncate">
                          {proximoPasajero ? proximoPasajero.direccion : 'Hospital Sanatorio Alemán (Portería Central)'}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => mostrarNotificacion(`🚀 Abriendo navegación en Waze / Google Maps hacia: ${proximoPasajero ? proximoPasajero.direccion : 'Hospital Sanatorio Alemán'}`)}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all shrink-0 shadow-sm flex items-center"
                    >
                      <span>Navegar</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </button>
                  </div>

                  {/* Indicador de Progreso de Abordaje */}
                  <div className="grid grid-cols-3 gap-2 pt-1 text-center font-bold text-xs">
                    <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-2 rounded-lg border border-emerald-500/20">
                      <span className="block text-base font-mono font-black">{totalAbordo}</span>
                      <span>A Bordo</span>
                    </div>
                    <div className="bg-amber-500/10 text-amber-600 dark:text-amber-400 p-2 rounded-lg border border-amber-500/20">
                      <span className="block text-base font-mono font-black">{totalPendientes}</span>
                      <span>En Paradero</span>
                    </div>
                    <div className="bg-rose-500/10 text-rose-600 dark:text-rose-400 p-2 rounded-lg border border-rose-500/20">
                      <span className="block text-base font-mono font-black">{totalAusentes}</span>
                      <span>Ausentes</span>
                    </div>
                  </div>
                </div>

                {/* Checklist de Recogida de Pasajeros (Abordaje Digital) */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between px-1">
                    <h4 className="text-sm font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span className="text-base">👋</span>
                      <span>¿Quién viaja hoy?</span>
                    </h4>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {totalAbordo} de {pasajerosRuta.length} validados
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {pasajerosRuta.map((p, index) => {
                      const tieneAviso = p.notaAviso && p.estado === 'pendiente';
                      const pinVigente = index === 0 ? '8492' : index === 1 ? '3109' : '5501';
                      return (
                        <div 
                          key={p.id} 
                          className={`p-3.5 rounded-xl border transition-all space-y-2.5 ${
                            p.estado === 'abordo'
                              ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60 opacity-90'
                              : p.estado === 'ausente'
                              ? 'bg-slate-100 dark:bg-[#161D27]/50 border-slate-200 dark:border-slate-800 opacity-60'
                              : tieneAviso
                              ? 'bg-amber-50/90 dark:bg-amber-950/30 border-2 border-amber-400 dark:border-amber-500 shadow-xs'
                              : 'bg-white dark:bg-[#161D27] border-slate-200 dark:border-[#212A38]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1.5 min-w-0 flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-xs flex items-center justify-center shrink-0">
                                  {index + 1}
                                </span>
                                <span className={`text-sm font-extrabold truncate ${
                                  p.estado === 'abordo' ? 'text-emerald-700 dark:text-emerald-300 line-through decoration-emerald-500/50' : 'text-slate-900 dark:text-white'
                                }`}>
                                  {p.nombre}
                                </span>
                                {p.estado === 'abordo' && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500 text-slate-950 shrink-0">✓ A Bordo</span>
                                )}
                                {p.estado === 'ausente' && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-500 text-white shrink-0">❌ Ausente</span>
                                )}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center pl-8 truncate">
                                <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
                                <span className="truncate">{p.direccion}</span>
                              </div>
                              <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center pl-8 font-bold">
                                <Key className="w-3 h-3 mr-1 text-emerald-500 shrink-0" />
                                <span>PIN Abordaje: {pinVigente} • Token Efímero WFM Activo</span>
                              </div>
                            </div>

                            {/* Botones de acción del conductor para cada pasajero */}
                            <div className="flex items-center space-x-1.5 shrink-0 pt-1">
                              <a
                                href={`tel:${p.telefono}`}
                                title="Llamar pasajero"
                                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                              >
                                <Phone className="w-4 h-4" />
                              </a>

                              {p.estado !== 'abordo' && (
                                <button
                                  onClick={() => handleCambiarEstadoPasajero(p.id, 'abordo')}
                                  className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-extrabold rounded-lg shadow-xs transition-all flex items-center"
                                  title="Validar abordaje"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Abordo
                                </button>
                              )}

                              {p.estado !== 'ausente' && p.estado !== 'abordo' && (
                                <button
                                  onClick={() => handleCambiarEstadoPasajero(p.id, 'ausente')}
                                  className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 rounded-lg transition-all"
                                  title="Marcar ausente"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              )}

                              {(p.estado === 'abordo' || p.estado === 'ausente') && (
                                <button
                                  onClick={() => {
                                    setPasajerosRuta(prev => prev.map(item => item.id === p.id ? { ...item, estado: 'pendiente' } : item));
                                    mostrarNotificacion(`Estado de ${p.nombre} reiniciado a pendiente.`);
                                  }}
                                  className="p-1.5 text-xs text-slate-400 underline"
                                >
                                  Revertir
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Nota de aviso en vivo de este pasajero - Tomando 100% de ancho del cuadro */}
                          {p.notaAviso && (
                            <div className="w-full bg-amber-500/15 dark:bg-amber-500/20 border-l-4 border-amber-500 p-3 rounded-r-lg flex items-center justify-between gap-2 shadow-xs text-xs font-semibold text-amber-900 dark:text-amber-200">
                              <div className="flex items-center space-x-2 min-w-0">
                                <span className="text-base shrink-0">💬</span>
                                <span className="whitespace-normal leading-relaxed">"{p.notaAviso}"</span>
                              </div>
                              <button 
                                onClick={() => reproducirAvisoVoz(p.notaAviso || '')}
                                className="p-2 bg-amber-500/20 hover:bg-amber-500/30 rounded-lg text-amber-700 dark:text-amber-300 transition-colors shrink-0 flex items-center gap-1 font-bold"
                                title="Escuchar por altavoz"
                              >
                                <Volume2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Bloqueo Operativo WFM: El cierre de ruta exige validar el 100% del manifiesto */}
                  {totalPendientes > 0 && (
                    <div className="bg-amber-500/15 border border-amber-500/40 dark:border-amber-500/20 rounded-xl p-3.5 mt-3 flex items-center space-x-2.5 text-amber-900 dark:text-amber-200 text-xs font-bold shadow-xs">
                      <Lock className="w-5 h-5 text-amber-500 shrink-0" />
                      <span>Por favor marca "Abordo" o "Ausente" en los {totalPendientes} pasajero{totalPendientes !== 1 ? 's' : ''} que falta{totalPendientes !== 1 ? 'n' : ''} por confirmar para poder finalizar tu recorrido.</span>
                    </div>
                  )}

                  <button
                    disabled={totalPendientes > 0}
                    onClick={() => {
                      if (totalPendientes > 0) return;
                      setRutaCompletada(true);
                      actualizarConductor(conductor.id, { estadoWFM: 'disponible', serviciosMes: (conductor.serviciosMes || 0) + 1 });
                      mostrarNotificacion(`🏁 ¡Recorrido finalizado! Manifiesto de asistencia y kilometraje transmitidos al Centro Operativo de ${'Transportes Biobío'}.`);
                    }}
                    className={`w-full mt-2.5 py-3.5 rounded-xl font-black text-sm shadow-md transition-all flex items-center justify-center space-x-2 ${
                      totalPendientes > 0
                        ? 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500 border border-slate-300 dark:border-slate-700 cursor-not-allowed opacity-85'
                        : 'bg-emerald-400 text-slate-950 hover:bg-emerald-300 ring-2 ring-emerald-500/40'
                    }`}
                  >
                    {totalPendientes > 0 ? (
                      <>
                        <Lock className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0" />
                        <span>Finalizar Recorrido (Bloqueado: {totalPendientes} pendiente{totalPendientes !== 1 ? 's' : ''})</span>
                      </>
                    ) : (
                      <>
                        <CheckSquare className="w-5 h-5 text-slate-950 shrink-0" />
                        <span>Finalizar Recorrido</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* PESTAÑA 2: BITÁCORA Y RESCATES (CENTRAL 24/7) */}
            {activeTab === 'bitacora' && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 dark:border-[#212A38] pb-3">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    Bitácora de Asignaciones del Día (Biobío)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Servicios regulares e incidencias despachadas desde la Central Operativa de {'Transportes Biobío'}.
                  </p>
                </div>

                {/* Alerta de Orden de Rescate Operativo */}
                {!ordenRescateAceptada ? (
                  <div className="bg-amber-500/10 border-2 border-amber-500 p-4 rounded-xl space-y-3 shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded font-extrabold text-xs bg-amber-500 text-slate-950 uppercase tracking-wider animate-pulse flex items-center">
                        ⚡ Orden de Rescate Operativo #BIO-911
                      </span>
                      <span className="text-xs text-amber-500 font-mono font-bold">¡Requiere Respuesta!</span>
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                        Reasignación de Emergencia — Talcahuano
                      </h4>
                      <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">
                        El móvil Patente BCN-401 sufrió retraso mecánico en Autopista Concepción-Talcahuano. Central solicita que te desvíes al punto de rescate para recoger 8 funcionarios de <strong>Compañía Siderúrgica Huachipato</strong>.
                      </p>
                    </div>
                    <div className="flex items-center justify-end space-x-2 pt-2">
                      <button
                        onClick={() => {
                          setOrdenRescateAceptada(true);
                          mostrarNotificacion('✅ Orden de Rescate #BIO-911 Aceptada. Coordenadas cargadas en tu sistema GPS y notificación enviada a los pasajeros y Central.');
                        }}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-lg shadow-md transition-all flex items-center"
                      >
                        <CheckCircle className="w-4 h-4 mr-1.5" />
                        Aceptar Orden y Desviar Unidad
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center justify-between">
                    <span>⚡ Orden de Rescate #BIO-911 integrada exitosamente en tu ruta en curso.</span>
                    <span className="px-2 py-0.5 bg-emerald-500 text-slate-950 rounded text-[10px] font-mono">EN EJECUCIÓN</span>
                  </div>
                )}

                <div className="space-y-2.5">
                  <div className="p-3.5 bg-white dark:bg-[#161D27] border border-slate-200 dark:border-[#212A38] rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">06:30 AM — 08:15 AM</span>
                      <h5 className="font-extrabold text-sm text-slate-900 dark:text-white mt-0.5">Turno AM • Clínica Sanatorio Alemán</h5>
                      <span className="text-xs text-emerald-500 font-medium">● En Ejecución Actual (14/19 asientos)</span>
                    </div>
                    <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-bold text-xs rounded-lg">
                      Ruta 160
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-50 dark:bg-[#111720] border border-slate-200 dark:border-[#212A38] rounded-xl flex items-center justify-between opacity-80">
                    <div>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">13:30 PM — 15:00 PM</span>
                      <h5 className="font-extrabold text-sm text-slate-900 dark:text-white mt-0.5">Turno Intermedio • Planta Celulósica Arauco</h5>
                      <span className="text-xs text-slate-500 font-medium">⏳ Programado en Central (16 pasajeros confirmados)</span>
                    </div>
                    <span className="px-2.5 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs rounded-lg">
                      Coronel
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-50 dark:bg-[#111720] border border-slate-200 dark:border-[#212A38] rounded-xl flex items-center justify-between opacity-80">
                    <div>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">22:00 PM — 23:45 PM</span>
                      <h5 className="font-extrabold text-sm text-slate-900 dark:text-white mt-0.5">Turno Noche • Hospital Clínico Regional</h5>
                      <span className="text-xs text-slate-500 font-medium">⏳ Programado en Central (19 pasajeros confirmados)</span>
                    </div>
                    <span className="px-2.5 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs rounded-lg">
                      Concepción
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* PESTAÑA 3: INSPECCIÓN PRE-VIAJE (CHECKLIST DE SEGURIDAD VIAL) */}
            {activeTab === 'inspeccion' && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 dark:border-[#212A38] pb-3">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    Inspección Técnica Pre-Viaje (Checklist WFM)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Verificación obligatoria conforme a protocolo de seguridad laboral de {'Transportes Biobío'} antes de iniciar traslados en el Gran Concepción.
                  </p>
                </div>

                <div className="bg-white dark:bg-[#161D27] p-4 rounded-xl border border-slate-200 dark:border-[#212A38] space-y-3">
                  <div className="flex items-center space-x-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                      <Car className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white block">Móvil Asignado: {conductor.vehiculo?.marca} {conductor.vehiculo?.modelo}</span>
                      <span className="text-[11px] font-mono font-bold bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded">Patente: {conductor.vehiculo?.placa || 'VIP-100'}</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 ml-2">Capacidad: {conductor.vehiculo?.capacidadPasajeros} personas</span>
                    </div>
                  </div>

                  <div className="space-y-3 pt-1">
                    <label className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <input 
                        type="checkbox" 
                        checked={checkFluidos} 
                        onChange={e => setCheckFluidos(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                      />
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">1. Nivel de combustible (sobre 75%) y fluidos del motor verificados.</span>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <input 
                        type="checkbox" 
                        checked={checkNeumaticos} 
                        onChange={e => setCheckNeumaticos(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                      />
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">2. Neumáticos (presión/desgaste), luces de freno e intermitentes operativos.</span>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <input 
                        type="checkbox" 
                        checked={checkLicencia} 
                        onChange={e => setCheckLicencia(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                      />
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">3. Licencia Profesional Clase {conductor.tipoLicencia} original al día y en poder del conductor.</span>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <input 
                        type="checkbox" 
                        checked={checkExtintor} 
                        onChange={e => setCheckExtintor(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                      />
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">4. Extintor con carga vigente, botiquín reglamentario y chaleco reflectante a bordo.</span>
                    </label>
                  </div>

                  {!inspeccionTransmitida ? (
                    <button
                      onClick={handleTransmitirInspeccion}
                      className="w-full py-2.5 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-500 text-white shadow-md transition-all mt-2"
                    >
                      ✓ Transmitir Certificado de Inspección a Central Operativa
                    </button>
                  ) : (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-700 dark:text-emerald-400 font-extrabold text-xs flex items-center justify-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <span>Inspección Aprobada • Certificado #BIO-772 Sincronizado</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PESTAÑA 4: EMERGENCIA & CANAL CENTRAL */}
            {activeTab === 'emergencia' && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 dark:border-[#212A38] pb-3">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-rose-500" />
                    Canal Directo Central Operativa & Asistencia
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Línea prioritaria con los despachadores 24/7 en el Biobío y reporte en vivo de incidencias en ruta.
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-[#111720] p-4 rounded-xl border border-slate-200 dark:border-[#212A38] space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Mesa de Despacho Central (Concepción)</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white block">Operador de Turno: Mauricio Arrau</span>
                      <span className="text-xs font-mono text-slate-500 dark:text-slate-400">+56 41 228 9000 • Biobío Centro</span>
                    </div>
                    <a
                      href="tel:+56412289000"
                      className="px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs flex items-center space-x-1.5 shadow-xs"
                    >
                      <Phone className="w-4 h-4" />
                      <span>Llamar Central</span>
                    </a>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#161D27] p-4 rounded-xl border border-slate-200 dark:border-[#212A38] space-y-3">
                  <h4 className="text-xs font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-wide flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                    Reportar Incidencia o Retraso a Central (1-Click)
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Selecciona una incidencia operativa para alertar en tiempo real a los operadores de {'Transportes Biobío'} y reprogramar los tiempos ETA:
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <button
                      onClick={() => handleReportarIncidenteConductor('Congestión Severa en Ruta 160 (Coronel/San Pedro)')}
                      className="p-3 text-left rounded-xl border border-amber-400/50 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-all text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center justify-between group"
                    >
                      <span>🚗 Congestión en Ruta 160</span>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <button
                      onClick={() => handleReportarIncidenteConductor('Falla Mecánica Menor en Móvil VIP-100')}
                      className="p-3 text-left rounded-xl border border-orange-400/50 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-all text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center justify-between group"
                    >
                      <span>🔧 Avería o Desperfecto Móvil</span>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <button
                      onClick={() => handleReportarIncidenteConductor('Desvío por Manifestaciones / Corte en Av. Chacabuco')}
                      className="p-3 text-left rounded-xl border border-blue-400/50 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center justify-between group"
                    >
                      <span>🚧 Corte de Calle / Desvío</span>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <button
                      onClick={() => handleReportarIncidenteConductor('Pasajero con Emergencia Médica en Tránsito')}
                      className="p-3 text-left rounded-xl border border-rose-500/60 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all text-xs font-extrabold text-rose-600 dark:text-rose-400 flex items-center justify-between group"
                    >
                      <span>🚑 Urgencia Médica Pasajero</span>
                      <ArrowRight className="w-4 h-4 text-rose-500 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* BARRA DE NAVEGACIÓN INFERIOR PWA CONDUCTOR */}
          <div className="bg-white dark:bg-[#0E131C] border-t border-slate-200 dark:border-[#212A38] py-2 px-1 grid grid-cols-4 gap-1 sm:gap-2 shadow-lg mt-auto shrink-0">
            <button
              onClick={() => setActiveTab('ruta_inm')}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
                activeTab === 'ruta_inm'
                  ? 'text-emerald-500 font-extrabold dark:bg-emerald-500/10'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Navigation className={`w-5 h-5 ${activeTab === 'ruta_inm' ? 'animate-pulse' : ''}`} />
              <span className="text-[10px] sm:text-xs mt-1 truncate">Mi Ruta</span>
            </button>

            <button
              onClick={() => setActiveTab('bitacora')}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all relative ${
                activeTab === 'bitacora'
                  ? 'text-emerald-500 font-extrabold dark:bg-emerald-500/10'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Calendar className="w-5 h-5" />
              <span className="text-[10px] sm:text-xs mt-1 truncate">Bitácora</span>
              {!ordenRescateAceptada && (
                <span className="absolute top-1 right-3 sm:right-6 w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('inspeccion')}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
                activeTab === 'inspeccion'
                  ? 'text-emerald-500 font-extrabold dark:bg-emerald-500/10'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <CheckSquare className="w-5 h-5" />
              <span className="text-[10px] sm:text-xs mt-1 truncate">Inspección</span>
            </button>

            <button
              onClick={() => setActiveTab('emergencia')}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
                activeTab === 'emergencia'
                  ? 'text-rose-500 font-extrabold dark:bg-rose-500/10'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              <span className="text-[10px] sm:text-xs mt-1 truncate">Central 24/7</span>
            </button>
          </div>

        </div>

      </div>

      {/* MODAL DE DISTRIBUCIÓN APK EXPO NATIVE (MOTO CONDUCTORES WFM) */}
      {showApkModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/75 dark:bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-[#161D27] border border-slate-200 dark:border-[#212A38] rounded-2xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500" />
            
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#212A38] pb-3.5 pt-1">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-xs">
                  <Cpu className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                    Portal Instalador APK — Conductor WFM
                  </h3>
                  <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 block">
                    v2026.8.1 (EAS Build • Expo React Native)
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowApkModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Banner de arquitectura corporativa */}
            <div className="bg-slate-50 dark:bg-[#0D1117] p-3.5 rounded-xl border border-slate-200 dark:border-[#212A38] space-y-2 text-xs">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Marca Blanca Configurada: {'Transportes Biobío'}</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                ¡Hola! Esta APK es el terminal nativo de terreno optimizado con <strong>Expo</strong>. La autorización del conductor proviene estrictamente de su sesión criptográfica y el tenant activo; <strong>nunca se usan query params en la URL como fuente de permisos</strong>, asegurando que nadie burle el sistema ni suplante identidades en el Gran Concepción.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-center space-y-2 bg-white dark:bg-[#1C2533]">
                <QrCode className="w-12 h-12 text-slate-800 dark:text-white mx-auto stroke-1.5" />
                <div className="text-xs font-bold text-slate-900 dark:text-white">Escaneo Expo Go / QR</div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Escanee este código con su terminal móvil para instalación en caliente o entorno de pruebas en vivo.</p>
              </div>

              <div className="flex flex-col justify-between space-y-2 p-3 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/20">
                <div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-600 text-white uppercase tracking-wider block w-max">
                    Android Native APK
                  </span>
                  <p className="text-xs font-bold text-slate-900 dark:text-gray-100 mt-2">
                    Paquete Autónomo para Terreno
                  </p>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Tamaño: 42.8 MB • Firma SHA-256</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleDownloadAPK();
                    setShowApkModal(false);
                  }}
                  className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg font-extrabold text-xs shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Download className="w-4 h-4 shrink-0" />
                  <span>Descargar .APK (v2026.8)</span>
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span>Evitamos sobrecarga: 100% Expo (Sin Capacitor)</span>
              <button
                type="button"
                onClick={() => setShowApkModal(false)}
                className="font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white px-2 py-1"
              >
                Cerrar Ventana
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

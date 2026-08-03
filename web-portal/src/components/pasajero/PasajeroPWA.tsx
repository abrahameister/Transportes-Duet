import React, { useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import { 
  MapPin, Phone, MessageSquare, ShieldCheck, Clock, Calendar, 
  AlertTriangle, User, CheckCircle, Navigation, Car, Smartphone, 
  HelpCircle, X
} from 'lucide-react';

const SUGERENCIAS_DIRECCIONES_CONCEPCION = [
  'Av. Chacabuco 1400, Depto 504, Concepción',
  'San Pedro del Valle 120, Villa El Rosario, San Pedro de la Paz',
  'Av. Pedro de Valdivia 801, Concepción',
  'Camino a Coronel Km 14, Condominio Olas, Coronel',
  'Calle Los Tilos 450, Sector Colón, Talcahuano',
  'Plaza Independencia 400, Concepción Centro',
  'Aeropuerto Carriel Sur, Talcahuano'
];

export const PasajeroPWA: React.FC = () => {
  const { currentTenant, conductores, viajesB2B, enviarAvisoOperativo } = useTenant();

  // Estado de navegación PWA
  const [activeTab, setActiveTab] = useState<'viaje_actual' | 'programacion' | 'asistencia' | 'perfil'>('viaje_actual');
  const [isMobileFrame, setIsMobileFrame] = useState<boolean>(true);
  const [notificacion, setNotificacion] = useState<string | null>(null);

  // Datos simulados del colaborador conectado
  const [colaboradorNombre] = useState('Dra. María Paz Solar');
  const [colaboradorRut] = useState('17.890.123-4');
  const [colaboradorEmpresa] = useState('Clínica Sanatorio Alemán / Urgencias');
  const [direccionRegistrada, setDireccionRegistrada] = useState('Av. Chacabuco 1400, Depto 504, Concepción');
  const [telefonoRegistrado, setTelefonoRegistrado] = useState('+56 9 8111 2233');
  const [estadoDireccion] = useState<'verificada' | 'en_revision'>('verificada');
  const [showDirSug, setShowDirSug] = useState(false);

  // Estado de cupo del día
  const [ausenciaAvisada, setAusenciaAvisada] = useState(false);
  const [sosActivado, setSosActivado] = useState(false);
  const [mensajeEnviado, setMensajeEnviado] = useState<string | null>(null);

  // Seleccionar conductor asignado o fallback
  const conductorActivo = conductores.find(c => c.estadoWFM === 'en_ruta' || c.estadoWFM === 'disponible') || conductores[0];
  const viajeActivo = viajesB2B.find(v => v.estado === 'en_camino' || v.estado === 'asignado' || v.estado === 'pendiente') || {
    id: 'V-BIOBIO-882',
    origenDireccion: 'Av. Chacabuco 1400, Depto 504, Concepción',
    destinoDireccion: 'Clínica Sanatorio Alemán, Pedro de Valdivia, Concepción',
    montoEstimado: 18500,
    timestampDespacho: '06:45 AM'
  };

  const mostrarNotificacion = (msg: string) => {
    setNotificacion(msg);
    setTimeout(() => setNotificacion(null), 5000);
  };

  const handleEnviarMensajeRapido = (texto: string) => {
    setMensajeEnviado(texto);
    enviarAvisoOperativo({
      pasajeroNombre: colaboradorNombre,
      mensaje: texto,
      tipo: 'aviso_rapido',
      viajeId: viajeActivo.id
    });
    mostrarNotificacion(`✓ Mensaje enviado a ${conductorActivo?.nombreCompleto || 'Chofer'}: "${texto}"`);
  };

  const handleActivarSOS = () => {
    setSosActivado(true);
    enviarAvisoOperativo({
      pasajeroNombre: colaboradorNombre,
      mensaje: `🚨 ALERTA S.O.S. ACTIVADA en móvil patente ${conductorActivo?.vehiculo?.placa || 'VIP-100'} — Coordenadas en vivo recibidas por Central.`,
      tipo: 'sos_pasajero',
      viajeId: viajeActivo.id
    });
    mostrarNotificacion(`🚨 ALERTA S.O.S ENVIADA: Coordenadas GPS y datos de móvil remitidos en tiempo real a la Central 24/7 de ${currentTenant.nombre}. Un operador de emergencias se contactará en breves segundos.`);
  };

  return (
    <div className="py-6 px-3 sm:px-6 max-w-5xl mx-auto transition-all">
      
      {/* Barra superior de control (Switch de vista y estado de conexión) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-200 dark:border-[#212A38]">
        <div>
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Módulo 4 • Seguimiento Web para Pasajeros (Sin Descargas)
          </span>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mt-0.5">
            <span>App de Traslado Profesional — {currentTenant.nombre}</span>
          </h1>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsMobileFrame(prev => !prev)}
            className="px-3 py-1.5 rounded-md text-xs font-semibold bg-white dark:bg-[#161D27] text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-[#303B4E] hover:bg-slate-50 dark:hover:bg-[#212A38] transition-colors inline-flex items-center shadow-2xs cursor-pointer"
            title="Alternar entre formato móvil o pantalla completa"
          >
            <Smartphone className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
            <span>{isMobileFrame ? 'Vista Ampliada (Escritorio)' : 'Vista Móvil (Simulador)'}</span>
          </button>

          <span className="inline-flex items-center px-2.5 py-1.5 rounded-md text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle className="w-3 h-3 mr-1 text-emerald-500" />
            <span>GPS Conectado</span>
          </span>
        </div>
      </div>

      {/* Notificación flotante de sistema */}
      {notificacion && (
        <div className="mb-4 p-3.5 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-medium text-xs flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
          <span className="flex items-center gap-2">
            {sosActivado ? <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 animate-bounce" /> : <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
            <span>{notificacion}</span>
          </span>
          <button onClick={() => setNotificacion(null)} className="text-slate-400 hover:text-white dark:hover:text-slate-900 font-bold"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* CONTENEDOR MAESTRO PWA (Marco Móvil o Ancho Completo) */}
      <div className={`mx-auto transition-all duration-300 ${isMobileFrame ? 'max-w-md bg-slate-100 dark:bg-[#090C10] border-4 border-slate-300 dark:border-slate-800 rounded-3xl p-3 sm:p-5 shadow-2xl overflow-hidden min-h-[680px] flex flex-col justify-between' : 'w-full bg-white dark:bg-[#161D27] border border-slate-200 dark:border-[#212A38] rounded-2xl p-6 shadow-sm'}`}>
        
        {/* Cabecera interna de la App PWA */}
        <div>
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#212A38] pb-3.5 mb-4">
            <div className="flex items-center space-x-3">
              <img src={currentTenant.logoUrl} alt="Logo" className="w-9 h-9 rounded-lg object-cover border border-slate-200 dark:border-slate-700 bg-white" />
              <div>
                <div className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">{currentTenant.nombre}</div>
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{colaboradorEmpresa}</div>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                TURNO DIURNO
              </span>
            </div>
          </div>

          {/* VISTAS DE LA APP WEB RESPOSIVE */}
          {activeTab === 'viaje_actual' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              {/* Tarjeta Estado en Vivo */}
              <div className="bg-white dark:bg-[#161D27] border border-slate-200 dark:border-[#212A38] rounded-xl p-4 shadow-xs space-y-3.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-gray-200 uppercase tracking-wide flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Móvil en Camino a su Domicilio
                  </span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded">
                    ETA: 3 min
                  </span>
                </div>

                {/* Mapa Satelital Simulado de Concepción */}
                <div className="bg-slate-900 text-white rounded-lg p-5 text-center relative overflow-hidden border border-slate-800 shadow-inner">
                  <div className="absolute top-2 left-2 text-[10px] font-mono text-emerald-400 bg-slate-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
                    ⚡ GPS BIOBÍO EN VIVO
                  </div>
                  <Navigation className="w-10 h-10 text-emerald-400 mx-auto mt-3 animate-bounce" />
                  <p className="font-bold text-sm text-gray-100 mt-2">En recorrido por Av. Chacabuco / Sector Centro</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Tráfico expedito en Concepción. Prepare su pase de abordaje.</p>
                </div>

                {/* Ficha del Conductor y Móvil */}
                <div className="bg-slate-50 dark:bg-[#0D1117] p-3.5 rounded-lg border border-slate-200 dark:border-[#212A38] flex items-center space-x-3.5">
                  <img 
                    src={conductorActivo?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'} 
                    alt="Foto conductor" 
                    className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500 shrink-0 shadow-xs" 
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-1">
                      <span className="font-bold text-slate-900 dark:text-white text-sm truncate">{conductorActivo?.nombreCompleto || 'Carlos Muñoz Valenzuela'}</span>
                      <span title="Conductor verificado profesionalmente"><ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" /></span>
                    </div>
                    <div className="text-slate-600 dark:text-slate-300 font-mono text-xs font-bold mt-0.5">
                      Patente: <span className="bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-900 dark:text-white">{conductorActivo?.vehiculo?.placa || 'VIP-100'}</span>
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5 flex items-center gap-2">
                      <span>Mercedes-Benz Sprinter</span>
                      <span>•</span>
                      <span className="text-amber-500 font-semibold">★ {conductorActivo?.puntualidad || '4.9'} / 5.0</span>
                    </div>
                  </div>
                </div>

                {/* Botones de Contacto Directo */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <a 
                    href={`tel:${conductorActivo?.telefono || '+56980001122'}`}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#212A38] dark:hover:bg-[#303B4E] text-slate-800 dark:text-gray-100 font-bold text-xs rounded-lg transition-colors flex items-center justify-center space-x-1.5 border border-slate-200 dark:border-[#303B4E]"
                  >
                    <Phone className="w-3.5 h-3.5 text-blue-500" />
                    <span>Llamar Conductor</span>
                  </a>
                  <button 
                    type="button"
                    onClick={() => handleEnviarMensajeRapido('Estoy listo esperando en la portería')}
                    className="w-full py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Avisar: Estoy listo</span>
                  </button>
                </div>

                {/* Mensaje Rápido Preestablecido */}
                <div className="flex items-center justify-center gap-1.5 pt-1 text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Avisos rápidos:</span>
                  <button onClick={() => handleEnviarMensajeRapido('Bajo en 2 minutos, por favor esperarme')} className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 underline text-[11px] cursor-pointer">
                    "Bajo en 2 min"
                  </button>
                  <button onClick={() => handleEnviarMensajeRapido('Ya me encuentro en el punto de parada')} className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 underline text-[11px] cursor-pointer">
                    "En paradero"
                  </button>
                </div>

                {mensajeEnviado && (
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 p-2.5 rounded border border-emerald-200 dark:border-emerald-800/60 text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold text-center">
                    💬 Mensaje entregado en consola del conductor: "{mensajeEnviado}"
                  </div>
                )}
              </div>

              {/* Pase de Abordaje Digital */}
              <div className="bg-white dark:bg-[#161D27] border border-slate-200 dark:border-[#212A38] rounded-xl p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PASE DIGITAL DE ABORDAJE</div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white font-mono mt-0.5">VOUCHER #{viajeActivo ? 'BIO-992' : 'BIO-001'}</div>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg font-mono text-[10px] font-extrabold text-slate-700 dark:text-gray-300 border border-slate-200 dark:border-slate-700">
                    QR-CONFIRMED
                  </div>
                </div>
                
                <div className="space-y-2 text-xs">
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-slate-400 text-[11px]">Punto de Recogida Registrado:</div>
                      <div className="font-bold text-slate-800 dark:text-gray-200">{direccionRegistrada}</div>
                      <div className="text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold mt-0.5">✓ Dirección verificada por Central Operativa</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                    <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-slate-400 text-[11px]">Horario de Presentación en Parada:</div>
                      <div className="font-bold text-slate-800 dark:text-gray-200">06:50 AM (Puntualidad obligatoria)</div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'programacion' && (
            <div className="space-y-4 animate-in fade-in duration-150 text-xs">
              <div className="bg-white dark:bg-[#161D27] border border-slate-200 dark:border-[#212A38] rounded-xl p-4 shadow-xs space-y-3">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center justify-between">
                  <span>Mis Turnos & Rutas de Esta Semana</span>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">● 5 de 5 confirmados</span>
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Si no hará uso de un traslado programado (teletrabajo, vacaciones o licencia), avise su ausencia para que la Central libere el cupo en el vehículo.
                </p>

                {/* Gestión de cupo de hoy */}
                <div className="p-3.5 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-amber-900 dark:text-amber-300 block">¿No utilizará el transporte hoy?</span>
                    <span className="text-[11px] text-slate-600 dark:text-slate-400">Libere su asiento en tiempo real.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAusenciaAvisada(!ausenciaAvisada);
                      mostrarNotificacion(!ausenciaAvisada ? '✓ Ausencia informada a la Central. Su cupo en el móvil ha sido liberado para hoy.' : '✓ Cupo reactivado exitosamente.');
                    }}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      ausenciaAvisada 
                        ? 'bg-emerald-600 text-white shadow-sm' 
                        : 'bg-white dark:bg-[#161D27] text-amber-700 dark:text-amber-300 border border-amber-300 hover:bg-amber-100'
                    }`}
                  >
                    {ausenciaAvisada ? '✓ Ausencia Notificada (Cancelar)' : 'Avisar Ausencia Hoy'}
                  </button>
                </div>

                <div className="space-y-2 pt-1">
                  {[
                    { dia: 'Lunes 03 Ago', turno: 'Ingreso Turno Diurno', hora: '07:00 AM', ruta: 'Ruta Sur ➔ Clínica Sanatorio Alemán', estado: 'Completado' },
                    { dia: 'Martes 04 Ago', turno: 'Ingreso Turno Diurno', hora: '07:00 AM', ruta: 'Ruta Sur ➔ Clínica Sanatorio Alemán', estado: 'Confirmado' },
                    { dia: 'Miércoles 05 Ago', turno: 'Retorno Domicilio', hora: '16:30 PM', ruta: 'Clínica ➔ Av. Chacabuco 1400', estado: 'Confirmado' },
                    { dia: 'Jueves 06 Ago', turno: 'Ingreso Turno Diurno', hora: '07:00 AM', ruta: 'Ruta Sur ➔ Clínica Sanatorio Alemán', estado: 'Confirmado' }
                  ].map((t, idx) => (
                    <div key={idx} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0D1117] flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{t.dia} • <span className="text-blue-600 dark:text-blue-400 font-mono">{t.hora}</span></div>
                        <div className="text-slate-500 dark:text-slate-400 text-[11px]">{t.turno} — {t.ruta}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.estado === 'Completado' 
                          ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300' 
                          : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                      }`}>
                        {t.estado}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'asistencia' && (
            <div className="space-y-4 animate-in fade-in duration-150 text-xs">
              <div className="bg-white dark:bg-[#161D27] border border-slate-200 dark:border-[#212A38] rounded-xl p-4 shadow-xs space-y-4">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">Central de Asistencia & Emergencias en Ruta</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                    Canal directo y confidencial con el área de operaciones de <strong>{currentTenant.nombre}</strong> ante cualquier contratiempo en la Región del Biobío.
                  </p>
                </div>

                {/* Botón de Pánico / S.O.S en ruta */}
                <div className="bg-red-50 dark:bg-red-950/40 border-2 border-red-200 dark:border-red-800/80 rounded-xl p-5 text-center space-y-3">
                  <AlertTriangle className="w-9 h-9 text-red-600 dark:text-red-400 mx-auto animate-pulse" />
                  <div>
                    <div className="font-extrabold text-red-900 dark:text-red-300 text-sm uppercase tracking-wide">BOTÓN S.O.S. DE EMERGENCIA EN RUTA</div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 max-w-sm mx-auto">
                      Utilícelo únicamente ante retrasos graves, averías del vehículo, accidentes o incidentes de seguridad durante su traslado corporativo.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleActivarSOS}
                    className="w-full py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs tracking-wider uppercase shadow-md transition-all cursor-pointer"
                  >
                    🚨 Activar Alerta S.O.S de Inmediato
                  </button>
                  {sosActivado && (
                    <p className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                      ✓ Alerta transmitida exitosamente a la Central Operativa.
                    </p>
                  )}
                </div>

                {/* Opciones de Mesa de Ayuda */}
                <div className="space-y-2.5 pt-2">
                  <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Otros Canales Operativos</div>
                  <a
                    href="tel:+56412000000"
                    className="p-3 rounded-lg bg-slate-50 dark:bg-[#0D1117] border border-slate-200 dark:border-slate-800 flex items-center justify-between hover:bg-slate-100 transition-colors font-medium text-slate-800 dark:text-gray-200"
                  >
                    <span className="flex items-center"><Phone className="w-4 h-4 text-blue-500 mr-2.5" /> Mesa Central Operativa 24/7 (Concepción)</span>
                    <span className="text-blue-600 dark:text-blue-400 font-mono font-bold">+56 41 222 0000</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => mostrarNotificacion('✓ Reporte de objeto olvidado registrado con la placa del vehículo. La Central verificará con el conductor.')}
                    className="w-full p-3 rounded-lg bg-slate-50 dark:bg-[#0D1117] border border-slate-200 dark:border-slate-800 flex items-center justify-between hover:bg-slate-100 transition-colors font-medium text-slate-800 dark:text-gray-200 text-left cursor-pointer"
                  >
                    <span className="flex items-center"><HelpCircle className="w-4 h-4 text-amber-500 mr-2.5" /> Reportar objeto extraviado u olvidado en el móvil</span>
                    <span className="text-slate-400 text-xs">Enviar aviso ➔</span>
                  </button>
                </div>

              </div>
            </div>
          )}

          {activeTab === 'perfil' && (
            <div className="space-y-4 animate-in fade-in duration-150 text-xs">
              <div className="bg-white dark:bg-[#161D27] border border-slate-200 dark:border-[#212A38] rounded-xl p-4 shadow-xs space-y-4">
                <div className="flex items-center space-x-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="w-12 h-12 rounded-full bg-[#0F172A] text-white flex items-center justify-center text-base font-extrabold">
                    MS
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">{colaboradorNombre}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px]">RUT: <span className="font-mono">{colaboradorRut}</span> • {colaboradorEmpresa}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-gray-300 block mb-1">Teléfono Móvil (Recojo & Alerta SMS):</label>
                    <input 
                      type="text" 
                      value={telefonoRegistrado} 
                      onChange={(e) => setTelefonoRegistrado(e.target.value)} 
                      className="enterprise-input w-full py-2 font-mono" 
                    />
                  </div>

                  <div className="relative">
                    <label className="font-bold text-slate-700 dark:text-gray-300 block mb-1">Dirección de Recogida Registrada:</label>
                    <input 
                      type="text" 
                      value={direccionRegistrada} 
                      onChange={(e) => {
                        setDireccionRegistrada(e.target.value);
                        setShowDirSug(true);
                      }} 
                      onFocus={() => setShowDirSug(true)}
                      className="enterprise-input w-full py-2" 
                    />
                    {showDirSug && (
                      <ul className="absolute z-30 left-0 right-0 mt-1 bg-white dark:bg-[#161D27] border border-slate-200 dark:border-[#212A38] rounded-lg shadow-lg overflow-hidden max-h-40 overflow-y-auto text-[11px]">
                        {SUGERENCIAS_DIRECCIONES_CONCEPCION.map((s, i) => (
                          <li 
                            key={i} 
                            onClick={() => {
                              setDireccionRegistrada(s);
                              setShowDirSug(false);
                              mostrarNotificacion('✓ Nueva dirección remitida a Central Operativa para validación geográfica (máx 2 horas hábiles).');
                            }}
                            className="px-3 py-2 hover:bg-slate-100 dark:hover:bg-[#212A38] text-slate-800 dark:text-gray-200 cursor-pointer border-b border-slate-100 dark:border-slate-800 last:border-0"
                          >
                            📍 {s}
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-2 flex items-center space-x-2 bg-slate-50 dark:bg-[#0D1117] p-2.5 rounded border border-slate-200 dark:border-slate-800 text-[11px]">
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="text-slate-600 dark:text-slate-300">
                        <strong>Estado Geográfico:</strong> {estadoDireccion === 'verificada' ? 'Dirección verificada y aprobada para cobertura por Central.' : 'En revisión por operaciones.'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => mostrarNotificacion('✓ Datos personales y preferencias actualizadas correctamente.')}
                    className="px-5 py-2.5 rounded-lg bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                  >
                    Guardar Cambios de Perfil
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* BARRA DE NAVEGACIÓN INFERIOR DE LA APP (Estilo PWA Nativa) */}
        <div className="pt-4 mt-4 border-t border-slate-200 dark:border-[#212A38] flex items-center justify-around text-center">
          <button
            type="button"
            onClick={() => setActiveTab('viaje_actual')}
            className={`flex-1 flex flex-col items-center py-2 transition-all cursor-pointer ${
              activeTab === 'viaje_actual' 
                ? 'text-blue-600 dark:text-blue-400 font-bold border-b-2 border-blue-500' 
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium'
            }`}
          >
            <Car className="w-5 h-5 mb-1" />
            <span className="text-[11px]">Mi Viaje</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('programacion')}
            className={`flex-1 flex flex-col items-center py-2 transition-all cursor-pointer ${
              activeTab === 'programacion' 
                ? 'text-blue-600 dark:text-blue-400 font-bold border-b-2 border-blue-500' 
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium'
            }`}
          >
            <Calendar className="w-5 h-5 mb-1" />
            <span className="text-[11px]">Turnos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('asistencia')}
            className={`flex-1 flex flex-col items-center py-2 transition-all cursor-pointer ${
              activeTab === 'asistencia' 
                ? 'text-red-600 dark:text-red-400 font-bold border-b-2 border-red-500' 
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium'
            }`}
          >
            <AlertTriangle className={`w-5 h-5 mb-1 ${sosActivado ? 'text-red-500 animate-bounce' : ''}`} />
            <span className="text-[11px]">S.O.S & Ayuda</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('perfil')}
            className={`flex-1 flex flex-col items-center py-2 transition-all cursor-pointer ${
              activeTab === 'perfil' 
                ? 'text-blue-600 dark:text-blue-400 font-bold border-b-2 border-blue-500' 
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium'
            }`}
          >
            <User className="w-5 h-5 mb-1" />
            <span className="text-[11px]">Mi Perfil</span>
          </button>
        </div>

      </div>

      {/* Pie aclarativo de PWA */}
      <div className="text-center text-[11px] text-slate-400 dark:text-slate-500 mt-6 max-w-lg mx-auto">
        🔒 Acceso protegido con token encriptado para personal de <strong>{colaboradorEmpresa}</strong>. Optimizado para pantallas web y smartphones (iOS / Android).
      </div>
    </div>
  );
};

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { ConductorWFM, ViajeOperativa, VehiculoFlota, ClienteCorporativo, RutaRecurrente, AvisoOperativo } from '../types';
import { mockConductoresWFM, mockViajesIniciales, mockVehiculosIniciales, mockClientesIniciales, mockRutasRecurentes } from '../lib/mockData';
import { supabase, testSupabaseConnection } from '../lib/supabase';

interface AppContextType {
  conductores: ConductorWFM[];
  vehiculos: VehiculoFlota[];
  clientes: ClienteCorporativo[];
  viajes: ViajeOperativa[];
  rutasRecurentes: RutaRecurrente[];
  currentRoleView: 'admin' | 'cliente_b2b' | 'pwa_pasajero' | 'app_conductor';
  setCurrentRoleView: (role: 'admin' | 'cliente_b2b' | 'pwa_pasajero' | 'app_conductor') => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;

  avisosOperativos: AvisoOperativo[];
  enviarAvisoOperativo: (aviso: Partial<AvisoOperativo>) => void;
  marcarAvisoLeido: (id: string) => void;

  activeClienteB2BId: string | null;
  setActiveClienteB2BId: (id: string | null) => void;
  viajesB2B: ViajeOperativa[]; 
  
  toggleConductorEstado: (conductorId: string) => void;
  despacharViajeSimulado: (viajeId: string, conductorId?: string) => void;
  reasignarViajeRescate: (viajeId: string, nuevoConductorId: string) => void;
  crearViaje: (nuevo: Partial<ViajeOperativa>) => void;
  importarViajesCSV: (cantidad: number) => void;
  importarViajesDesdeCSV: (viajes: ViajeOperativa[]) => void;
  
  agregarVehiculo: (vehiculo: VehiculoFlota) => void;
  actualizarVehiculo: (id: string, updates: Partial<VehiculoFlota>) => void;
  eliminarVehiculo: (id: string) => void;
  
  agregarConductor: (conductor: ConductorWFM) => void;
  actualizarConductor: (id: string, updates: Partial<ConductorWFM>) => void;
  eliminarConductor: (id: string) => void;
  
  agregarCliente: (cliente: ClienteCorporativo) => void;
  actualizarCliente: (id: string, updates: Partial<ClienteCorporativo>) => void;

  userRole: string;
  authUser: any | null;
  authLoading: boolean;
  logoutAuth: () => Promise<void>;
  loginDemoBypass: (correo?: string, rol?: 'admin' | 'cliente_b2b') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [conductores, setConductores] = useState<ConductorWFM[]>(mockConductoresWFM);
  const [vehiculos, setVehiculos] = useState<VehiculoFlota[]>(mockVehiculosIniciales);
  const [clientes, setClientes] = useState<ClienteCorporativo[]>(mockClientesIniciales);
  const [viajes, setViajes] = useState<ViajeOperativa[]>(mockViajesIniciales);
  const [rutasRecurentes] = useState<RutaRecurrente[]>(mockRutasRecurentes);
  const [currentRoleView, setCurrentRoleViewInternal] = useState<'admin' | 'cliente_b2b' | 'pwa_pasajero' | 'app_conductor'>('admin');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  const [authUser, setAuthUser] = useState<any | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  const userRole = useMemo(() => userProfile?.rol || authUser?.user_metadata?.rol || 'admin', [userProfile, authUser]);

  const [activeClienteB2BId, setActiveClienteB2BId] = useState<string | null>('cl-b2b-04');


  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      handleAuthChange(session);
      setAuthLoading(false);
    };

    const handleAuthChange = async (session: any) => {
      if (session?.user) {
        setAuthUser(session.user);
        // Fetch profile
        const { data: profile } = await supabase.from('perfiles').select('*').eq('id', session.user.id).single();
        if (profile) {
          setUserProfile(profile);
          if (profile.rol === 'admin') setCurrentRoleViewInternal('admin');
          if (profile.rol === 'cliente_corporativo') setCurrentRoleViewInternal('cliente_b2b');
          if (profile.rol === 'conductor') setCurrentRoleViewInternal('app_conductor');
          if (profile.cliente_corporativo_id) setActiveClienteB2BId(profile.cliente_corporativo_id);
        }
      } else {
        setAuthUser(null);
        setUserProfile(null);
      }
    };

    initAuth();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      handleAuthChange(session);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);


  const [avisosOperativos, setAvisosOperativos] = useState<AvisoOperativo[]>([
    {
      id: 'aviso-init-1',
      pasajeroNombre: 'Dra. María Paz Solar',
      mensaje: 'Bajo en 2 minutos, por favor esperarme en la portería',
      timestamp: '06:42 AM',
      leido: false,
      tipo: 'aviso_rapido'
    },
    {
      id: 'aviso-init-2',
      pasajeroNombre: 'Ing. Rodrigo Sepúlveda',
      mensaje: 'Ya me encuentro en el punto de parada (San Pedro del Valle)',
      timestamp: '06:40 AM',
      leido: true,
      tipo: 'aviso_rapido'
    }
  ]);

  const enviarAvisoOperativo = (data: Partial<AvisoOperativo>) => {
    const id = `aviso-${Date.now()}`;
    const nuevo: AvisoOperativo = {
      id,
      pasajeroNombre: data.pasajeroNombre || 'Colaborador Corporativo',
      mensaje: data.mensaje || 'Aviso en ruta al conductor',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      leido: false,
      tipo: data.tipo || 'aviso_rapido',
      viajeId: data.viajeId
    };
    setAvisosOperativos(prev => [nuevo, ...prev]);

    supabase.from('avisos_operativos').insert([{
      id: nuevo.id,
      viaje_id: nuevo.viajeId || null,
      pasajero_nombre: nuevo.pasajeroNombre,
      mensaje: nuevo.mensaje,
      leido: nuevo.leido,
      tipo: nuevo.tipo
    }]).then(({ error }) => {
      if (error) console.warn('📡 [WFM Fallback] Aviso registrado en caché local. (Pendiente sync nube)', error.message);
      else console.log('⚡ [Realtime Sync] Aviso transmitido al servidor de Supabase.');
    });
  };

  const marcarAvisoLeido = (id: string) => {
    setAvisosOperativos(prev => prev.map(a => a.id === id ? { ...a, leido: true } : a));
  };

  const setCurrentRoleView = (role: 'admin' | 'cliente_b2b' | 'pwa_pasajero' | 'app_conductor') => {
    if (role !== 'cliente_b2b') {
      setActiveClienteB2BId(null);
    }
    setCurrentRoleViewInternal(role);
  };

  const viajesB2B = useMemo(() => {
    if (!activeClienteB2BId) return [];
    return viajes.filter(v => v.clienteCorporativoId === activeClienteB2BId);
  }, [viajes, activeClienteB2BId]);

  useEffect(() => {
    document.documentElement.style.setProperty('--tenant-primary', '#1E3A8A');
    document.documentElement.style.setProperty('--tenant-secondary', '#3B82F6');
    document.documentElement.style.setProperty('--tenant-accent', '#E8832A');
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    let isSubscribed = true;

    async function syncFromSupabase() {
      const isOnline = await testSupabaseConnection();
      if (!isOnline || !isSubscribed) {
        console.log('🛡️ [WFM Offline Fallback] Operando con caché local garantizada.');
        return;
      }

      try {
        const { data: dbVehiculos } = await supabase.from('vehiculos_flota').select('*');
        const { data: dbConductores } = await supabase.from('conductores_wfm').select('*');
        const { data: dbClientes } = await supabase.from('clientes_corporativos_b2b').select('*');
        const { data: dbViajes } = await supabase.from('viajes_operativa').select('*');
        const { data: dbAvisos } = await supabase.from('avisos_operativos').select('*');

        if (isSubscribed) {
          if (dbVehiculos && dbVehiculos.length > 0) {
            setVehiculos(dbVehiculos.map(v => ({
              id: v.id,
              marca: v.marca,
              modelo: v.modelo,
              anio: v.anio,
              placa: v.placa,
              color: v.color,
              capacidadPasajeros: v.capacidad_pasajeros,
              kilometraje: v.kilometraje,
              estadoOperativo: (v.estado_operativo as any) || 'operativo',
              activo: v.activo
            })));
          }
          if (dbConductores && dbConductores.length > 0) {
            setConductores(dbConductores.map(c => ({
              id: c.id,
              nombreCompleto: c.nombre_completo,
              email: c.email,
              telefono: c.telefono,
              avatarUrl: c.avatar_url || '',
              rut: c.rut,
              tipoLicencia: c.tipo_licencia as any,
              puntualidad: c.puntualidad,
              serviciosMes: c.servicios_mes,
              vehiculoAsignadoId: c.vehiculo_asignado_id,
              estadoWFM: (c.estado_wfm as any) || 'disponible',
              ultimaLatitud: c.ultima_latitud,
              ultimaLongitud: c.ultima_longitud,
              horasConducidasHoy: Number(c.horas_conducidas_hoy || 0),
              enDescanso: c.en_descanso || false,
              motivoBloqueo: c.motivo_bloqueo
            })));
          }
          if (dbClientes && dbClientes.length > 0) {
            setClientes(dbClientes.map(cl => ({
              id: cl.id,
              nombreCorporativo: cl.nombre_corporativo,
              rutIdentificador: cl.rut_identificador,
              direccionFiscal: cl.direccion_fiscal,
              contactoNombre: cl.contacto_nombre,
              contactoEmail: cl.contacto_email,
              contactoTelefono: cl.contacto_telefono,
              tarifario: {
                tarifaPorKm: Number(cl.tarifa_por_km || 1300),
                tarifaMinima: Number(cl.tarifa_minima || 7000),
                tiempoEsperaPorHora: Number(cl.tiempo_espera_por_hora || 8500),
                rutasFijas: []
              }
            })));
          }
          if (dbViajes && dbViajes.length > 0) {
            setViajes(dbViajes.map(v => ({
              id: v.id,
              clienteCorporativoId: v.cliente_corporativo_id,
              conductorId: v.conductor_id,
              vehiculoId: v.vehiculo_id,
              pasajeroNombre: v.pasajero_nombre,
              pasajeroTelefono: v.pasajero_telefono,
              origenDireccion: v.origen_direccion,
              origenLat: v.origen_lat || -36.8200,
              origenLng: v.origen_lng || -73.0440,
              destinoDireccion: v.destino_direccion,
              destinoLat: v.destino_lat || -36.8290,
              destinoLng: v.destino_lng || -73.0480,
              fechaProgramada: v.fecha_programada,
              estado: (v.estado as any) || 'en_transito',
              secureTrackingToken: v.secure_tracking_token,
              montoEstimado: Number(v.monto_estimado || 18000),
              timestampDespacho: v.timestamp_despacho ? new Date(v.timestamp_despacho).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined
            })));
          }
          if (dbAvisos && dbAvisos.length > 0) {
            setAvisosOperativos(dbAvisos.map(a => ({
              id: a.id,
              viajeId: a.viaje_id,
              pasajeroNombre: a.pasajero_nombre,
              mensaje: a.mensaje,
              timestamp: a.timestamp ? new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Ahora',
              leido: a.leido || false,
              tipo: (a.tipo as any) || 'aviso_rapido'
            })));
          }
        }
      } catch (err) {
        console.warn('⚡ [Supabase Live Sync] Conmuta a Offline Fallback debido a error:', err);
      }
    }

    syncFromSupabase();

    const realtimeChannel = supabase.channel('wfm-realtime-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'avisos_operativos' }, payload => {
        const nuevo: AvisoOperativo = {
          id: payload.new.id,
          viajeId: payload.new.viaje_id,
          pasajeroNombre: payload.new.pasajero_nombre || 'Pasajero PWA',
          mensaje: payload.new.mensaje,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          leido: payload.new.leido || false,
          tipo: payload.new.tipo || 'aviso_rapido'
        };
        setAvisosOperativos(prev => [nuevo, ...prev.filter(a => a.id !== nuevo.id)]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conductores_wfm' }, payload => {
        setConductores(prev => prev.map(c => c.id === payload.new.id ? { ...c, estadoWFM: payload.new.estado_wfm || c.estadoWFM } : c));
      })
      .subscribe();

    return () => {
      isSubscribed = false;
      supabase.removeChannel(realtimeChannel);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const enrichAndResolveUser = (rawUser: any) => {
      if (!rawUser) {
        setAuthUser(null);
        return;
      }
      const email = (rawUser.email || '').toLowerCase();
      let authoritativeRole = rawUser.user_metadata?.rol;

      if (rawUser.user_metadata?.rol === 'cliente_b2b' || email.includes('@sanatorioaleman.cl') || email.includes('@arauco.cl') || email.includes('@cap.cl')) {
        authoritativeRole = 'cliente_b2b';
        setCurrentRoleViewInternal('cliente_b2b');
      } else if (rawUser.user_metadata?.rol === 'pwa_pasajero' || rawUser.user_metadata?.rol === 'app_conductor') {
        authoritativeRole = rawUser.user_metadata.rol;
        setCurrentRoleViewInternal(rawUser.user_metadata.rol);
      } else {
        authoritativeRole = 'admin';
        setCurrentRoleViewInternal('admin');
      }

      const enrichedUser = {
        ...rawUser,
        user_metadata: {
          ...(rawUser.user_metadata || {}),
          rol: authoritativeRole
        }
      };
      setAuthUser(enrichedUser);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        if (session?.user) {
          enrichAndResolveUser(session.user);
        } else {
          setAuthUser(null);
        }
        setAuthLoading(false);
      }
    });

    const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        if (session?.user) {
          enrichAndResolveUser(session.user);
        } else {
          setAuthUser(null);
        }
        setAuthLoading(false);
      }
    });

    return () => {
      mounted = false;
      authListener.unsubscribe();
    };
  }, []);

  const logoutAuth = async () => {
    setAuthLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (err) {}
    setAuthUser(null);
    setAuthLoading(false);
  };

  const loginDemoBypass = (correo: string = 'admin@empresa.cl', rol: 'admin' | 'cliente_b2b' = 'admin') => {
    setAuthUser({ id: 'user-demo-wfm', email: correo, user_metadata: { name: 'Usuario WFM Demo', rol: rol } });
    setCurrentRoleView(rol);
  };

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);

  const toggleConductorEstado = (conductorId: string) => {
    setConductores(prev => prev.map(cond => {
      if (cond.id !== conductorId) return cond;
      if (cond.enDescanso) {
        return { ...cond, enDescanso: false, estadoWFM: 'disponible', motivoBloqueo: undefined, horasConducidasHoy: 0 };
      }
      const nextState = cond.estadoWFM === 'disponible' ? 'offline' : cond.estadoWFM === 'offline' ? 'disponible' : 'disponible';
      return { ...cond, estadoWFM: nextState, ultimaActualizacionGps: 'Ahora mismo' };
    }));
  };

  const despacharViajeSimulado = (viajeId: string, customConductorId?: string) => {
    const condId = customConductorId || conductores.find(c => c.estadoWFM === 'disponible' && !c.enDescanso)?.id || conductores[0]?.id;
    const conductorAsignado = conductores.find(c => c.id === condId);

    setViajes(prev => prev.map(v => {
      if (v.id !== viajeId) return v;
      return {
        ...v,
        estado: 'asignado',
        conductorId: conductorAsignado?.id,
        conductorNombre: conductorAsignado?.nombreCompleto || 'Chofer Asignado',
        vehiculoId: conductorAsignado?.vehiculoAsignadoId || '',
        vehiculoPlaca: conductorAsignado?.vehiculo?.placa || 'VIP-100',
        timestampDespacho: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    }));

    if (conductorAsignado) {
      setConductores(prev => prev.map(c => c.id === conductorAsignado.id ? { ...c, estadoWFM: 'en_ruta', viajeActualId: viajeId } : c));
    }
  };

  const reasignarViajeRescate = (viajeId: string, nuevoConductorId: string) => {
    const nuevoCond = conductores.find(c => c.id === nuevoConductorId);
    const viajeActual = viajes.find(v => v.id === viajeId);

    if (viajeActual && viajeActual.conductorId) {
      const prevCondId = viajeActual.conductorId;
      setConductores(prev => prev.map(c => c.id === prevCondId ? { ...c, estadoWFM: 'offline', motivoBloqueo: 'Unidad en revisión técnica por incidencia en ruta.' } : c));
      if (viajeActual.vehiculoId) {
        setVehiculos(prev => prev.map(vh => vh.id === viajeActual.vehiculoId ? { ...vh, estadoOperativo: 'mantenimiento' } : vh));
      }
    }

    setViajes(prev => prev.map(v => {
      if (v.id !== viajeId) return v;
      return {
        ...v,
        estado: 'en_camino',
        conductorId: nuevoCond?.id,
        conductorNombre: nuevoCond?.nombreCompleto || 'Unidad de Rescate',
        vehiculoId: nuevoCond?.vehiculoAsignadoId,
        vehiculoPlaca: nuevoCond?.vehiculo?.placa || 'RES-911',
        timestampDespacho: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        incidencia: v.incidencia ? { ...v.incidencia, resuelta: true } : undefined
      };
    }));

    if (nuevoCond) {
      setConductores(prev => prev.map(c => c.id === nuevoCond.id ? { ...c, estadoWFM: 'en_ruta', viajeActualId: viajeId } : c));
    }
  };

  const crearViaje = (data: Partial<ViajeOperativa>) => {
    const nuevoViaje: ViajeOperativa = {
      id: `viaje-${Date.now()}`,
      clienteCorporativoId: data.clienteCorporativoId || clientes[0]?.id || 'cl-biobio-001',
      clienteNombre: data.clienteNombre || clientes[0]?.nombreCorporativo || 'Cuenta B2B Chile',
      pasajeroNombre: data.pasajeroNombre || 'Pasajero Nuevo',
      pasajeroTelefono: data.pasajeroTelefono || '+56 9 8123 4567',
      origenDireccion: data.origenDireccion || 'Aeropuerto Carriel Sur, Talcahuano, Región del Biobío',
      origenLat: -36.7824,
      origenLng: -73.0631,
      destinoDireccion: data.destinoDireccion || 'Plaza Independencia 400, Concepción Centro',
      destinoLat: -36.8269,
      destinoLng: -73.0498,
      fechaProgramada: data.fechaProgramada || 'Inmediato (Hoy)',
      estado: 'pendiente',
      secureTrackingToken: `token-${Date.now()}`,
      montoEstimado: data.montoEstimado || 18500
    };
    setViajes(prev => [nuevoViaje, ...prev]);
  };

  const importarViajesCSV = (cantidad: number) => {
    const generados: ViajeOperativa[] = Array.from({ length: cantidad }).map((_, i) => ({
      id: `viaje-csv-${Date.now()}-${i}`,
      clienteCorporativoId: clientes[0]?.id || 'cl-biobio-001',
      clienteNombre: clientes[0]?.nombreCorporativo || 'Forestal Arauco Biobío S.A.',
      pasajeroNombre: `Colaborador Turno Lote #${i + 1}`,
      pasajeroTelefono: `+56 9 ${Math.floor(6000 + Math.random() * 3999)} ${Math.floor(1000 + Math.random() * 8999)}`,
      origenDireccion: 'Planta Industrial Huachipato / Coronel',
      origenLat: -36.7554,
      origenLng: -73.1118,
      destinoDireccion: `Sector Residencial Concepción / San Pedro de la Paz (Ruta ${String.fromCharCode(65 + (i % 5))})`,
      destinoLat: -36.8432,
      destinoLng: -73.1021,
      fechaProgramada: 'Hoy, 22:00 (Cambio Turno Noche)',
      estado: 'pendiente',
      secureTrackingToken: `token-csv-${i}-${Date.now()}`,
      montoEstimado: 22500
    }));
    setViajes(prev => [...generados, ...prev]);
  };

  const importarViajesDesdeCSV = (nuevos: ViajeOperativa[]) => {
    setViajes(prev => [...nuevos, ...prev]);
  };

  const agregarVehiculo = (vehiculo: VehiculoFlota) => setVehiculos(prev => [vehiculo, ...prev]);
  const actualizarVehiculo = (id: string, updates: Partial<VehiculoFlota>) => setVehiculos(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));
  const eliminarVehiculo = (id: string) => setVehiculos(prev => prev.filter(v => v.id !== id));

  const agregarConductor = (cond: ConductorWFM) => setConductores(prev => [cond, ...prev]);
  const actualizarConductor = (id: string, updates: Partial<ConductorWFM>) => setConductores(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  const eliminarConductor = (id: string) => setConductores(prev => prev.filter(c => c.id !== id));

  const agregarCliente = (cl: ClienteCorporativo) => setClientes(prev => [cl, ...prev]);
  const actualizarCliente = (id: string, updates: Partial<ClienteCorporativo>) => setClientes(prev => prev.map(cl => cl.id === id ? { ...cl, ...updates } : cl));

  return (
    <AppContext.Provider
      value={{
        conductores,
        vehiculos,
        clientes,
        viajes,
        rutasRecurentes,
        currentRoleView,
        setCurrentRoleView,
        isDarkMode,
        toggleDarkMode,
        activeClienteB2BId,
        setActiveClienteB2BId,
        viajesB2B,
        avisosOperativos,
        enviarAvisoOperativo,
        marcarAvisoLeido,
        toggleConductorEstado,
        despacharViajeSimulado,
        reasignarViajeRescate,
        crearViaje,
        importarViajesCSV,
        importarViajesDesdeCSV,
        agregarVehiculo,
        actualizarVehiculo,
        eliminarVehiculo,
        agregarConductor,
        actualizarConductor,
        eliminarConductor,
        agregarCliente,
        actualizarCliente,
        userRole,
        authUser,
        authLoading,
        logoutAuth,
        loginDemoBypass
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp debe ser utilizado dentro de un AppProvider');
  return context;
};

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { ConductorWFM, ViajeOperativa, VehiculoFlota, ClienteCorporativo, AvisoOperativo } from '../types';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/ui/Toast';

interface AppContextType {
  conductores: ConductorWFM[];
  vehiculos: VehiculoFlota[];
  clientes: ClienteCorporativo[];
  viajes: ViajeOperativa[];
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
  crearViaje: (nuevo: Partial<ViajeOperativa>) => void;
  
  agregarVehiculo: (vehiculo: VehiculoFlota) => void;
  actualizarVehiculo: (id: string, updates: Partial<VehiculoFlota>) => void;
  eliminarVehiculo: (id: string) => void;
  
  agregarConductor: (conductor: ConductorWFM) => void;
  actualizarConductor: (id: string, updates: Partial<ConductorWFM>) => void;
  eliminarConductor: (id: string) => void;
  
  agregarCliente: (cliente: ClienteCorporativo) => void;
  actualizarCliente: (id: string, updates: Partial<ClienteCorporativo>) => void;
  refrescarDatos: () => Promise<void>;

  userRole: string;
  authUser: any | null;
  authLoading: boolean;
  logoutAuth: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const toast = useToast();
  const [conductores, setConductores] = useState<ConductorWFM[]>([]);
  const [vehiculos, setVehiculos] = useState<VehiculoFlota[]>([]);
  const [clientes, setClientes] = useState<ClienteCorporativo[]>([]);
  const [viajes, setViajes] = useState<ViajeOperativa[]>([]);
  const [currentRoleView, setCurrentRoleViewInternal] = useState<'admin' | 'cliente_b2b' | 'pwa_pasajero' | 'app_conductor'>('admin');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  const [authUser, setAuthUser] = useState<any | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  const userRole = useMemo(() => userProfile?.rol || authUser?.user_metadata?.rol || 'admin', [userProfile, authUser]);

  const [activeClienteB2BId, setActiveClienteB2BId] = useState<string | null>(null);




  const [avisosOperativos, setAvisosOperativos] = useState<AvisoOperativo[]>([]);

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

    supabase.from('avisos').insert([{
      viaje_id: nuevo.viajeId || null,
      mensaje: nuevo.mensaje,
      leido: nuevo.leido
    }]).then(({ error }) => {
      if (error) console.warn('📡 [WFM Fallback] Aviso registrado en caché local. (Pendiente sync nube)', error.message);
      else console.log('⚡ [Realtime Sync] Aviso transmitido al servidor de Supabase.');
    });
  };

  const marcarAvisoLeido = async (id: string) => {
    setAvisosOperativos(prev => prev.map(a => a.id === id ? { ...a, leido: true } : a));
    await supabase.from('avisos').update({ leido: true }).eq('id', id);
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

  const syncFromSupabase = useCallback(async () => {
    try {
      const { data: dbVehiculos } = await supabase.from('vehiculos').select('*');
      const { data: dbConductores } = await supabase.from('conductores').select('*');
      const { data: dbClientes } = await supabase.from('clientes_corporativos').select('*');
      const { data: dbAsignaciones } = await supabase.from('asignaciones').select('*').order('created_at', { ascending: false });
      
      let { data: dbViajes, error: errViajes } = await supabase
        .from('viajes')
        .select(`
          *,
          viaje_pasajeros(
            estado,
            pasajero:pasajeros(nombre_completo, telefono)
          ),
          asignaciones(
            estado,
            conductor_id,
            vehiculo_id,
            conductor:conductores(id, nombre_completo),
            vehiculo:vehiculos(id, patente)
          )
        `)
        .order('created_at', { ascending: false });

      if (errViajes) {
        const simpleRes = await supabase.from('viajes').select('*').order('created_at', { ascending: false });
        dbViajes = simpleRes.data;
      }
      
      const { data: dbAvisos } = await supabase.from('avisos').select('*');

      if (dbVehiculos) {
        setVehiculos(dbVehiculos.map(v => ({
          ...v,
          id: v.id,
          marca: v.marca,
          modelo: v.modelo,
          anio: v.anio,
          placa: v.patente,
          patente: v.patente,
          capacidadPasajeros: v.capacidad,
          capacidad: v.capacidad,
          color: v.color || 'Blanco',
          kilometraje: v.kilometraje ?? 0,
          estadoOperativo: v.estado || 'operativo',
          estado: v.estado || 'operativo',
          activo: v.estado === 'operativo' || v.estado === 'activo'
        })));
      }
      if (dbConductores) {
        setConductores(dbConductores.map(c => ({
          id: c.id,
          nombreCompleto: c.nombre_completo || 'Conductor',
          email: '',
          telefono: c.telefono || '',
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=250&auto=format&fit=crop',
          rut: c.rut || '',
          tipoLicencia: (c.tipo_licencia || 'A2') as any,
          vencimientoLicencia: c.vencimiento_licencia || undefined,
          numeroLicencia: c.tipo_licencia || '',
          puntualidad: '5.0 / 5.0',
          serviciosMes: 0,
          vehiculoAsignadoId: undefined,
          estadoWFM: (c.estado === 'activo' ? 'disponible' : 'inactivo') as any,
          ultimaLatitud: -36.8269,
          ultimaLongitud: -73.0498,
          horasConducidasHoy: 0,
          enDescanso: false,
          motivoBloqueo: undefined
        })));
      }
      if (dbClientes) {
        setClientes(dbClientes.map(cl => ({
          id: cl.id,
          nombreCorporativo: cl.nombre_corporativo,
          rutIdentificador: cl.rut_identificador,
          direccionFiscal: cl.direccion_fiscal,
          contactoNombre: cl.contacto_nombre,
          contactoEmail: cl.contacto_email,
          contactoTelefono: cl.contacto_telefono,
          invitacionEnviada: cl.invitacion_enviada,
          tarifario: {
            tarifaPorKm: Number(cl.tarifa_por_km || 1300),
            tarifaMinima: Number(cl.tarifa_minima || 7000),
            tiempoEsperaPorHora: Number(cl.tiempo_espera_por_hora || 8500),
            rutasFijas: []
          }
        })));
      }
      if (dbViajes) {
        setViajes(dbViajes.map(v => {
          let parsedObs: any = {};
          try {
            if (v.observaciones && v.observaciones.startsWith('{')) {
              parsedObs = JSON.parse(v.observaciones);
            }
          } catch (_) {}

          const activeAsignacion = v.asignaciones?.find((a: any) => a.estado === 'activa') || 
                                   dbAsignaciones?.find(a => a.viaje_id === v.id && a.estado === 'activa') ||
                                   v.asignaciones?.[0] ||
                                   dbAsignaciones?.find(a => a.viaje_id === v.id);

          const condId = activeAsignacion?.conductor_id || activeAsignacion?.conductor?.id;
          const condObj = dbConductores?.find(c => c.id === condId);
          const condNombre = activeAsignacion?.conductor?.nombre_completo || condObj?.nombre_completo;

          const vehId = activeAsignacion?.vehiculo_id || activeAsignacion?.vehiculo?.id;
          const vehObj = dbVehiculos?.find(vh => vh.id === vehId);
          const vehPlaca = activeAsignacion?.vehiculo?.patente || vehObj?.patente;

          const primerPasajero = v.viaje_pasajeros?.[0]?.pasajero;
          const clNombre = dbClientes?.find(c => c.id === v.cliente_corporativo_id)?.nombre_corporativo;

          return {
            id: v.id,
            clienteCorporativoId: v.cliente_corporativo_id,
            clienteNombre: clNombre || parsedObs.clienteNombre || 'Cuenta B2B',
            conductorId: condId,
            conductorNombre: condNombre,
            vehiculoId: vehId,
            vehiculoPlaca: vehPlaca,
            pasajeroNombre: primerPasajero?.nombre_completo || parsedObs.pasajeroNombre || 'Pasajero',
            pasajeroTelefono: primerPasajero?.telefono || parsedObs.pasajeroTelefono || '',
            origenDireccion: v.origen_direccion || '',
            origenLat: v.origen_lat || -36.8200,
            origenLng: v.origen_lng || -73.0440,
            destinoDireccion: v.destino_direccion || '',
            destinoLat: v.destino_lat || -36.8290,
            destinoLng: v.destino_lng || -73.0480,
            fechaProgramada: v.fecha_programada ? new Date(v.fecha_programada).toLocaleString('es-CL') : 'Inmediato',
            estado: v.estado || 'solicitado',
            timestampDespacho: v.created_at ? new Date(v.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
            montoEstimado: parsedObs.montoEstimado || 0
          };
        }));
      }
      if (dbAvisos && dbAvisos.length > 0) {
        setAvisosOperativos(dbAvisos.map(a => ({
          id: a.id,
          viajeId: a.viaje_id,
          pasajeroNombre: 'Colaborador',
          mensaje: a.mensaje,
          timestamp: a.created_at ? new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Ahora',
          leido: a.leido || false,
          tipo: 'aviso_rapido'
        })));
      }
    } catch (err) {
      console.warn('⚡ [Supabase Live Sync] Error:', err);
    }
  }, []);

  useEffect(() => {
    if (!authUser) return;
    syncFromSupabase();

    const realtimeChannel = supabase.channel('wfm-realtime-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'avisos' }, () => syncFromSupabase())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conductores' }, () => syncFromSupabase())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vehiculos' }, () => syncFromSupabase())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'viajes' }, () => syncFromSupabase())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'asignaciones' }, () => syncFromSupabase())
      .subscribe();

    return () => {
      supabase.removeChannel(realtimeChannel);
    };
  }, [authUser, syncFromSupabase]);

  useEffect(() => {
    let mounted = true;

    const enrichAndResolveUser = async (rawUser: any) => {
      if (!rawUser) {
        if (mounted) setAuthUser(null);
        return;
      }
      
      try {
        // Fetch real profile from DB
        const { data: perfil, error } = await supabase
          .from('perfiles')
          .select('*')
          .eq('auth_user_id', rawUser.id)
          .single();

        if (error || !perfil) {
          console.error("Perfil no encontrado", error);
          if (mounted) setAuthUser(null);
          await supabase.auth.signOut();
          return;
        }

        if (perfil.estado !== 'activo') {
          console.warn("Usuario inactivo bloqueado.");
          if (mounted) setAuthUser(null);
          await supabase.auth.signOut();
          // We could set an error state here if we had one
          return;
        }

        const authoritativeRole = perfil.rol;
        setCurrentRoleViewInternal(authoritativeRole.toLowerCase());

        const enrichedUser = {
          ...rawUser,
          user_metadata: {
            ...rawUser.user_metadata,
            rol: authoritativeRole,
            nombre: perfil.nombre_completo,
            perfil_id: perfil.id
          }
        };
        
        if (mounted) setAuthUser(enrichedUser);
      } catch (err) {
        console.error("Error validando perfil", err);
        if (mounted) setAuthUser(null);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        if (session?.user) {
          enrichAndResolveUser(session.user).finally(() => {
            if (mounted) setAuthLoading(false);
          });
        } else {
          setAuthUser(null);
          setAuthLoading(false);
        }
      }
    });

    const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange((event, session) => {
      if (mounted) {
        if (event === 'PASSWORD_RECOVERY') {
          // This allows components to know they should show the reset password view
          // But with react-router, we usually rely on the URL /reset-password#access_token=...
          // We don't necessarily need to handle it here unless we have a strict auth guard.
        }
        
        if (session?.user) {
          enrichAndResolveUser(session.user);
        } else {
          setAuthUser(null);
          setCurrentRoleViewInternal('admin');
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

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);

  const toggleConductorEstado = async (conductorId: string) => {
    let nextState = 'disponible';
    setConductores(prev => prev.map(cond => {
      if (cond.id !== conductorId) return cond;
      if (cond.enDescanso) {
        nextState = 'disponible';
        return { ...cond, enDescanso: false, estadoWFM: 'disponible', motivoBloqueo: undefined, horasConducidasHoy: 0 };
      }
      nextState = cond.estadoWFM === 'disponible' ? 'offline' : cond.estadoWFM === 'offline' ? 'disponible' : 'disponible';
      return { ...cond, estadoWFM: nextState as any, ultimaActualizacionGps: 'Ahora mismo' };
    }));
    const newDbEstado = nextState === 'disponible' ? 'activo' : 'inactivo';
    await supabase.from('conductores').update({ estado: newDbEstado }).eq('id', conductorId);
  };

  // The trip engine RPCs should be called directly by components instead of AppContext


  const crearViaje = async (data: Partial<ViajeOperativa>) => {
    try {
      // 1. Obtener cliente_corporativo_id válido
      let clienteCorpId = data.clienteCorporativoId;
      if (!clienteCorpId || !clienteCorpId.includes('-')) {
        clienteCorpId = clientes[0]?.id;
      }
      
      if (!clienteCorpId) {
        const { data: dbCl } = await supabase.from('clientes_corporativos').select('id, nombre_corporativo').limit(1).single();
        clienteCorpId = dbCl?.id;
      }

      if (!clienteCorpId) {
        toast.warning('Debe existir al menos un Cliente Corporativo registrado en el sistema para programar viajes.', 'Cliente Requerido');
        return;
      }

      // 2. Normalizar fecha programada a ISO TIMESTAMPTZ
      let fechaIso = new Date().toISOString();
      if (data.fechaProgramada && !data.fechaProgramada.includes('Inmediato') && !data.fechaProgramada.includes('Hoy')) {
        const parsed = new Date(data.fechaProgramada);
        if (!isNaN(parsed.getTime())) {
          fechaIso = parsed.toISOString();
        }
      }

      const observacionesObj = {
        pasajeroNombre: data.pasajeroNombre || 'Pasajero Nuevo',
        pasajeroTelefono: data.pasajeroTelefono || '',
        montoEstimado: data.montoEstimado || 18500,
        clienteNombre: data.clienteNombre || 'Cuenta B2B'
      };

      const dbViaje = {
        cliente_corporativo_id: clienteCorpId,
        fecha_programada: fechaIso,
        tipo_viaje: 'especial',
        estado: 'solicitado',
        origen_direccion: data.origenDireccion || 'Aeropuerto Carriel Sur, Talcahuano',
        origen_lat: data.origenLat || -36.7824,
        origen_lng: data.origenLng || -73.0631,
        destino_direccion: data.destinoDireccion || 'Plaza Independencia 400, Concepción',
        destino_lat: data.destinoLat || -36.8269,
        destino_lng: data.destinoLng || -73.0498,
        observaciones: JSON.stringify(observacionesObj)
      };

      const { data: insertedViaje, error: insertError } = await supabase
        .from('viajes')
        .insert([dbViaje])
        .select()
        .single();

      if (insertError) {
        console.error('Error insertando viaje:', insertError);
        toast.error('Error al guardar viaje en base de datos: ' + insertError.message, 'Fallo de Registro');
        return;
      }

      // 3. Crear pasajero y viaje_pasajero si tenemos datos
      if (data.pasajeroNombre && insertedViaje?.id) {
        try {
          const fakeRut = 'RUT-P-' + Date.now().toString().slice(-6);
          const { data: insPasajero } = await supabase
            .from('pasajeros')
            .insert([{
              cliente_corporativo_id: clienteCorpId,
              nombre_completo: data.pasajeroNombre,
              rut: fakeRut,
              telefono: data.pasajeroTelefono || '+56900000000',
              estado: 'activo'
            }])
            .select()
            .single();

          if (insPasajero?.id) {
            await supabase.from('viaje_pasajeros').insert([{
              viaje_id: insertedViaje.id,
              pasajero_id: insPasajero.id,
              estado: 'pendiente',
              orden_parada: 1
            }]);
          }
        } catch (e) {
          console.warn('Registro complementario de pasajero:', e);
        }
      }

      const nuevoViajeState: ViajeOperativa = {
        id: insertedViaje.id,
        clienteCorporativoId: clienteCorpId,
        clienteNombre: data.clienteNombre || clientes.find(c => c.id === clienteCorpId)?.nombreCorporativo || 'Cuenta B2B',
        pasajeroNombre: data.pasajeroNombre || 'Pasajero Nuevo',
        pasajeroTelefono: data.pasajeroTelefono || '',
        origenDireccion: dbViaje.origen_direccion,
        origenLat: dbViaje.origen_lat,
        origenLng: dbViaje.origen_lng,
        destinoDireccion: dbViaje.destino_direccion,
        destinoLat: dbViaje.destino_lat,
        destinoLng: dbViaje.destino_lng,
        fechaProgramada: new Date(fechaIso).toLocaleString('es-CL'),
        estado: 'solicitado',
        timestampDespacho: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setViajes(prev => [nuevoViajeState, ...prev]);
    } catch (err: any) {
      console.error('Error en crearViaje:', err);
      toast.error('Error al registrar viaje: ' + (err?.message || err), 'Error');
    }
  };



  const agregarVehiculo = async (vehiculo: VehiculoFlota) => {
    try {
      const dbObj = { 
        marca: vehiculo.marca, 
        modelo: vehiculo.modelo, 
        patente: (vehiculo.patente || vehiculo.placa || 'N/A').toUpperCase().trim(),
        anio: vehiculo.anio || new Date().getFullYear(),
        capacidad: Number(vehiculo.capacidad || vehiculo.capacidadPasajeros || 4),
        color: vehiculo.color || 'Blanco',
        kilometraje: Number(vehiculo.kilometraje || 0),
        estado: vehiculo.estado || vehiculo.estadoOperativo || 'operativo'
      };
      const { data, error } = await supabase.from('vehiculos').insert([dbObj]).select().single();
      if (error) {
        console.error('Error insertando vehiculo:', error);
        toast.error('Error guardando vehículo: ' + error.message, 'Fallo de Guardado');
        return;
      }
      setVehiculos(prev => [{
        ...vehiculo,
        id: data.id,
        placa: data.patente,
        patente: data.patente,
        capacidadPasajeros: data.capacidad,
        color: data.color || 'Blanco',
        kilometraje: data.kilometraje ?? 0,
        estadoOperativo: data.estado || 'operativo'
      }, ...prev]);
    } catch (err: any) {
      console.error('Error en agregarVehiculo:', err);
      toast.error('Error al guardar vehículo: ' + (err?.message || err), 'Error');
    }
  };

  const actualizarVehiculo = async (id: string, updates: Partial<VehiculoFlota>) => {
    try {
      const dbUpdates: any = { updated_at: new Date().toISOString() };
      if (updates.marca !== undefined) dbUpdates.marca = updates.marca;
      if (updates.modelo !== undefined) dbUpdates.modelo = updates.modelo;
      if (updates.placa !== undefined || updates.patente !== undefined) {
        dbUpdates.patente = (updates.patente || updates.placa)?.toUpperCase().trim();
      }
      if (updates.anio !== undefined) dbUpdates.anio = Number(updates.anio);
      if (updates.capacidad !== undefined || updates.capacidadPasajeros !== undefined) {
        dbUpdates.capacidad = Number(updates.capacidad || updates.capacidadPasajeros);
      }
      if (updates.color !== undefined) dbUpdates.color = updates.color;
      if (updates.kilometraje !== undefined) dbUpdates.kilometraje = Number(updates.kilometraje);
      if (updates.estado !== undefined || updates.estadoOperativo !== undefined) {
        dbUpdates.estado = updates.estado || updates.estadoOperativo;
      }

      const { data, error } = await supabase
        .from('vehiculos')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error actualizando vehiculo:', error);
        toast.error('Error al actualizar vehículo: ' + error.message, 'Fallo de Actualización');
        return;
      }

      setVehiculos(prev => prev.map(v => v.id === id ? { 
        ...v, 
        ...updates,
        placa: data.patente || v.placa,
        patente: data.patente || v.patente,
        color: data.color || v.color,
        kilometraje: data.kilometraje ?? v.kilometraje,
        capacidadPasajeros: data.capacidad || v.capacidadPasajeros,
        estadoOperativo: data.estado || v.estadoOperativo
      } : v));
    } catch (err: any) {
      console.error('Error en actualizarVehiculo:', err);
      toast.error('Error al actualizar vehículo: ' + (err?.message || err), 'Error');
    }
  };

  const eliminarVehiculo = async (id: string) => {
    try {
      const { error } = await supabase.from('vehiculos').delete().eq('id', id);
      if (error) {
        console.error('Error eliminando vehiculo:', error);
        toast.error('Error al eliminar vehículo: ' + error.message, 'Fallo de Eliminación');
      } else {
        setVehiculos(prev => prev.filter(v => v.id !== id));
      }
    } catch (err: any) {
      console.error('Error en eliminarVehiculo:', err);
      toast.error('Error al eliminar vehículo: ' + (err?.message || err), 'Error');
    }
  };

  const agregarConductor = async (cond: ConductorWFM) => {
    try {
      let perfilId: string | null = null;
      let finalId = cond.id;

      // Helper para normalizar fechas al formato estándar ISO YYYY-MM-DD
      const sanitizeDateToISO = (dateStr?: string | null): string => {
        if (!dateStr || typeof dateStr !== 'string') {
          return new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0];
        }
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
        return new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0];
      };

      const finalVencimiento = sanitizeDateToISO(cond.vencimientoLicencia);

      // 1. Invitar al conductor usando la Edge Function para crear auth.user y perfiles (si tiene email)
      if (cond.email) {
        try {
          const { data: inviteRes, error: edgeError } = await supabase.functions.invoke('invite-b2b', {
            body: { 
              email: cond.email, 
              fullName: cond.nombreCompleto, 
              role: 'CONDUCTOR',
              rut: cond.rut,
              telefono: cond.telefono,
              tipoLicencia: cond.tipoLicencia,
              vencimientoLicencia: finalVencimiento,
              redirectTo: window.location.origin + '/reset-password'
            }
          });

          if (edgeError) {
            console.warn("Aviso Auth conductor:", edgeError.message || edgeError);
          } else if (inviteRes?.perfilId) {
            perfilId = inviteRes.perfilId;
          }
        } catch (e) {
          console.warn("Edge function no disponible para Auth de conductor:", e);
        }
      }

      // 2. Insertar directamente en la tabla canónica 'conductores'
      const dbObj: any = { 
        rut: cond.rut || ('RUT-' + Date.now().toString().slice(-6)),
        nombre_completo: cond.nombreCompleto,
        telefono: cond.telefono || '+56900000000',
        tipo_licencia: cond.tipoLicencia || 'A2',
        vencimiento_licencia: finalVencimiento,
        estado: 'activo'
      };
      if (perfilId) {
        dbObj.perfil_id = perfilId;
      }
      
      const { data: insertedData, error: insertError } = await supabase
        .from('conductores')
        .insert([dbObj])
        .select()
        .single();

      if (insertError) {
        if (insertError.code === '23505') {
          toast.warning('Ya existe un conductor registrado con ese RUT.', 'RUT Duplicado');
          return;
        }
        console.error('Error insertando conductor:', insertError);
        toast.error('Error al guardar conductor: ' + insertError.message, 'Fallo de Registro');
        return;
      }

      if (insertedData?.id) {
        finalId = insertedData.id;
      }

      setConductores(prev => [{ ...cond, id: finalId, vencimientoLicencia: finalVencimiento }, ...prev]);
    } catch (err: any) {
      console.error('Error general agregando conductor:', err);
      toast.error('Error al agregar conductor: ' + (err?.message || err), 'Error');
    }
  };

  const actualizarConductor = async (id: string, updates: Partial<ConductorWFM>) => {
    const dbUpdates: any = {};
    if (updates.nombreCompleto) dbUpdates.nombre_completo = updates.nombreCompleto;
    if (updates.rut) dbUpdates.rut = updates.rut;
    if (updates.telefono) dbUpdates.telefono = updates.telefono;
    if (updates.tipoLicencia) dbUpdates.tipo_licencia = updates.tipoLicencia;
    if (updates.vencimientoLicencia) {
      const trimmed = updates.vencimientoLicencia.trim();
      const dmyMatch = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
      dbUpdates.vencimiento_licencia = dmyMatch 
        ? `${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`
        : trimmed;
    }
    if (updates.estadoWFM) dbUpdates.estado = updates.estadoWFM === 'inactivo' ? 'inactivo' : 'activo';

    const { error } = await supabase.from('conductores').update(dbUpdates).eq('id', id);
    if (error) console.error('Error actualizando conductor:', error);
    setConductores(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const eliminarConductor = async (id: string) => {
    const { error } = await supabase.from('conductores').delete().eq('id', id);
    if (error) {
      console.error('Error eliminando conductor:', error);
      toast.error('Error eliminando conductor: ' + error.message, 'Fallo de Eliminación');
      return;
    }
    setConductores(prev => prev.filter(c => c.id !== id));
  };

  const agregarCliente = async (cl: ClienteCorporativo) => {
    // La DB inserción ahora ocurre en ClientesTarifacionView y usa Edge Function para Auth.
    setClientes(prev => [cl, ...prev]);
  };
  const actualizarCliente = async (id: string, updates: Partial<ClienteCorporativo>) => {
    const dbUpdates: any = { updated_at: new Date().toISOString() };
    if (updates.nombre_corporativo !== undefined) dbUpdates.nombre_corporativo = updates.nombre_corporativo;
    if (updates.nombreCorporativo !== undefined) dbUpdates.nombre_corporativo = updates.nombreCorporativo;
    if (updates.rut_identificador !== undefined) dbUpdates.rut_identificador = updates.rut_identificador;
    if (updates.rutIdentificador !== undefined) dbUpdates.rut_identificador = updates.rutIdentificador;
    if (updates.direccion_fiscal !== undefined) dbUpdates.direccion_fiscal = updates.direccion_fiscal;
    if (updates.direccionFiscal !== undefined) dbUpdates.direccion_fiscal = updates.direccionFiscal;
    if (updates.contacto_nombre !== undefined) dbUpdates.contacto_nombre = updates.contacto_nombre;
    if (updates.contactoNombre !== undefined) dbUpdates.contacto_nombre = updates.contactoNombre;
    if (updates.contacto_email !== undefined) dbUpdates.contacto_email = updates.contacto_email;
    if (updates.contactoEmail !== undefined) dbUpdates.contacto_email = updates.contactoEmail;
    if (updates.contacto_telefono !== undefined) dbUpdates.contacto_telefono = updates.contacto_telefono;
    if (updates.contactoTelefono !== undefined) dbUpdates.contacto_telefono = updates.contactoTelefono;
    
    const { error } = await supabase.from('clientes_corporativos').update(dbUpdates).eq('id', id);
    if (error) { console.error('Error updating client:', error); return; }
    setClientes(prev => prev.map(cl => cl.id === id ? { ...cl, ...updates } : cl));
  };

  return (
    <AppContext.Provider
      value={{
        conductores,
        vehiculos,
        clientes,
        viajes,
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

        crearViaje,
        agregarVehiculo,
        actualizarVehiculo,
        eliminarVehiculo,
        agregarConductor,
        actualizarConductor,
        eliminarConductor,
        agregarCliente,
        actualizarCliente,
        refrescarDatos: syncFromSupabase,
        userRole,
        authUser,
        authLoading,
        logoutAuth
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

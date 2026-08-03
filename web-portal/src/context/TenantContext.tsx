import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { EmpresaTenant, ConductorWFM, ViajeOperativa, VehiculoFlota, ClienteCorporativo, RutaRecurrente, AvisoOperativo } from '../types';
import { initialTenants, mockConductoresWFM, mockViajesIniciales, mockVehiculosIniciales, mockClientesIniciales, mockRutasRecurentes } from '../lib/mockData';

interface TenantContextType {
  tenants: EmpresaTenant[];
  currentTenant: EmpresaTenant;
  conductores: ConductorWFM[];
  vehiculos: VehiculoFlota[];
  clientes: ClienteCorporativo[];
  viajes: ViajeOperativa[];
  rutasRecurentes: RutaRecurrente[];
  currentRoleView: 'superadmin' | 'tenant_admin' | 'cliente_b2b' | 'pwa_pasajero' | 'app_conductor';
  setCurrentRoleView: (role: 'superadmin' | 'tenant_admin' | 'cliente_b2b' | 'pwa_pasajero' | 'app_conductor') => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  selectTenant: (tenantId: string) => void;
  updateTenantBranding: (tenantId: string, updates: Partial<EmpresaTenant>) => void;
  addNewTenant: (tenant: EmpresaTenant) => void;

  // Cola en tiempo real de Avisos Rápidos y Alertas S.O.S (Pasajero -> Conductor / Central)
  avisosOperativos: AvisoOperativo[];
  enviarAvisoOperativo: (aviso: Partial<AvisoOperativo>) => void;
  marcarAvisoLeido: (id: string) => void;

  // Sesión activa del cliente B2B (aislamiento de datos)
  activeClienteB2BId: string | null;
  setActiveClienteB2BId: (id: string | null) => void;
  viajesB2B: ViajeOperativa[]; // Sólo los viajes del cliente B2B activo
  
  // Acciones Operativas de Despacho
  toggleConductorEstado: (conductorId: string) => void;
  despacharViajeSimulado: (viajeId: string, conductorId?: string) => void;
  reasignarViajeRescate: (viajeId: string, nuevoConductorId: string) => void;
  crearViaje: (nuevo: Partial<ViajeOperativa>) => void;
  importarViajesCSV: (cantidad: number) => void;
  importarViajesDesdeCSV: (viajes: ViajeOperativa[]) => void;
  
  // CRUD de Recursos
  agregarVehiculo: (vehiculo: VehiculoFlota) => void;
  actualizarVehiculo: (id: string, updates: Partial<VehiculoFlota>) => void;
  eliminarVehiculo: (id: string) => void;
  
  agregarConductor: (conductor: ConductorWFM) => void;
  actualizarConductor: (id: string, updates: Partial<ConductorWFM>) => void;
  eliminarConductor: (id: string) => void;
  
  agregarCliente: (cliente: ClienteCorporativo) => void;
  actualizarCliente: (id: string, updates: Partial<ClienteCorporativo>) => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tenants, setTenants] = useState<EmpresaTenant[]>(initialTenants);
  const [currentTenantId, setCurrentTenantId] = useState<string>(initialTenants[0].id);
  const [conductores, setConductores] = useState<ConductorWFM[]>(mockConductoresWFM);
  const [vehiculos, setVehiculos] = useState<VehiculoFlota[]>(mockVehiculosIniciales);
  const [clientes, setClientes] = useState<ClienteCorporativo[]>(mockClientesIniciales);
  const [viajes, setViajes] = useState<ViajeOperativa[]>(mockViajesIniciales);
  const [rutasRecurentes] = useState<RutaRecurrente[]>(mockRutasRecurentes);
  const [currentRoleView, setCurrentRoleViewInternal] = useState<'superadmin' | 'tenant_admin' | 'cliente_b2b' | 'pwa_pasajero' | 'app_conductor'>('tenant_admin');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  // Sesión activa del cliente B2B — aislamiento estricto de datos
  const [activeClienteB2BId, setActiveClienteB2BId] = useState<string | null>(null);

  // Cola de Avisos Operativos (Comunicación en vivo)
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
    const nuevo: AvisoOperativo = {
      id: `aviso-${Date.now()}`,
      pasajeroNombre: data.pasajeroNombre || 'Colaborador Corporativo',
      mensaje: data.mensaje || 'Aviso en ruta al conductor',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      leido: false,
      tipo: data.tipo || 'aviso_rapido',
      viajeId: data.viajeId
    };
    setAvisosOperativos(prev => [nuevo, ...prev]);
  };

  const marcarAvisoLeido = (id: string) => {
    setAvisosOperativos(prev => prev.map(a => a.id === id ? { ...a, leido: true } : a));
  };

  // Al cambiar de rol, limpiar la sesión B2B si el destino no es cliente_b2b
  const setCurrentRoleView = (role: 'superadmin' | 'tenant_admin' | 'cliente_b2b' | 'pwa_pasajero' | 'app_conductor') => {
    if (role !== 'cliente_b2b') {
      // Limpiar sesión B2B al salir del portal corporativo
      setActiveClienteB2BId(null);
    }
    setCurrentRoleViewInternal(role);
  };

  const currentTenant = useMemo(() => {
    return tenants.find(t => t.id === currentTenantId) || tenants[0];
  }, [tenants, currentTenantId]);

  // Viajes filtrados por cliente B2B activo (aislamiento de datos)
  const viajesB2B = useMemo(() => {
    if (!activeClienteB2BId) return [];
    return viajes.filter(v => v.clienteCorporativoId === activeClienteB2BId);
  }, [viajes, activeClienteB2BId]);

  useEffect(() => {
    if (currentTenant) {
      document.documentElement.style.setProperty('--tenant-primary', currentTenant.primaryColor);
      document.documentElement.style.setProperty('--tenant-secondary', currentTenant.secondaryColor);
      document.documentElement.style.setProperty('--tenant-accent', currentTenant.accentColor || '#E8832A');
    }
  }, [currentTenant]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);
  const selectTenant = (id: string) => setCurrentTenantId(id);
  const updateTenantBranding = (id: string, updates: Partial<EmpresaTenant>) => setTenants(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  const addNewTenant = (newTenant: EmpresaTenant) => { setTenants(prev => [...prev, newTenant]); setCurrentTenantId(newTenant.id); };

  // --- MÉTODOS DE CONTROL WFM & DISPATCHING ---
  const toggleConductorEstado = (conductorId: string) => {
    setConductores(prev => prev.map(cond => {
      if (cond.id !== conductorId) return cond;
      if (cond.enDescanso) {
        // Sacar de descanso y reactivar
        return { ...cond, enDescanso: false, estadoWFM: 'disponible', motivoBloqueo: undefined, horasConducidasHoy: 0 };
      }
      const nextState = cond.estadoWFM === 'disponible' ? 'offline' : cond.estadoWFM === 'offline' ? 'disponible' : 'disponible';
      return { ...cond, estadoWFM: nextState, ultimaActualizacionGps: 'Ahora mismo' };
    }));
  };

  const despacharViajeSimulado = (viajeId: string, customConductorId?: string) => {
    const condId = customConductorId || conductores.find(c => c.empresaId === currentTenantId && c.estadoWFM === 'disponible' && !c.enDescanso)?.id || conductores[0].id;
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
      // Mandar el auto averiado anterior al taller y liberar / bloquear al chofer
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
      empresaId: currentTenantId,
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
      empresaId: currentTenantId,
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

  // --- CRUD FLOTA ---
  const agregarVehiculo = (vehiculo: VehiculoFlota) => setVehiculos(prev => [vehiculo, ...prev]);
  const actualizarVehiculo = (id: string, updates: Partial<VehiculoFlota>) => setVehiculos(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));
  const eliminarVehiculo = (id: string) => setVehiculos(prev => prev.filter(v => v.id !== id));

  // --- CRUD CONDUCTORES ---
  const agregarConductor = (cond: ConductorWFM) => setConductores(prev => [cond, ...prev]);
  const actualizarConductor = (id: string, updates: Partial<ConductorWFM>) => setConductores(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  const eliminarConductor = (id: string) => setConductores(prev => prev.filter(c => c.id !== id));

  // --- CRUD CLIENTES B2B & TARIFAS ---
  const agregarCliente = (cl: ClienteCorporativo) => setClientes(prev => [cl, ...prev]);
  const actualizarCliente = (id: string, updates: Partial<ClienteCorporativo>) => setClientes(prev => prev.map(cl => cl.id === id ? { ...cl, ...updates } : cl));

  return (
    <TenantContext.Provider
      value={{
        tenants,
        currentTenant,
        conductores,
        vehiculos,
        clientes,
        viajes,
        rutasRecurentes,
        currentRoleView,
        setCurrentRoleView,
        isDarkMode,
        toggleDarkMode,
        selectTenant,
        updateTenantBranding,
        addNewTenant,
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
        actualizarCliente
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = (): TenantContextType => {
  const context = useContext(TenantContext);
  if (!context) throw new Error('useTenant debe ser utilizado dentro de un TenantProvider');
  return context;
};

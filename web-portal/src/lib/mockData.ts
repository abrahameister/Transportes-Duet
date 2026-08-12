// @ts-nocheck
import type { EmpresaTenant, ConductorWFM, VehiculoFlota, ClienteCorporativo, ViajeOperativa, WFMEstatisticas, RutaRecurrente } from '../types';

export const initialTenants: any[] = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    nombre: 'Transportes Andina',
    slug: 'andina',
    logoUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=150&auto=format&fit=crop&q=80',
    primaryColor: '#0F172A',
    secondaryColor: '#1E293B',
    accentColor: '#E8832A',
    estadoPago: 'al_dia',
    planSuscripto: 'Plan Pro Exclusivo (8 Conductores)',
    totalConductores: 8,
    totalVehiculos: 8
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    nombre: 'Movilidad Cordillera',
    slug: 'cordillera',
    logoUrl: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=150&auto=format&fit=crop&q=80',
    primaryColor: '#1E3A8A',
    secondaryColor: '#3B82F6',
    accentColor: '#E8832A',
    estadoPago: 'al_dia',
    planSuscripto: 'En Onboarding • cordillera.nexomobility.com',
    totalConductores: 12,
    totalVehiculos: 10
  },
  {
    id: '10000000-0000-0000-0000-000000000003',
    nombre: 'Transfer Austral',
    slug: 'austral',
    logoUrl: 'https://images.unsplash.com/photo-1555546444-a868f7a2a5?w=150&auto=format&fit=crop&q=80',
    primaryColor: '#065F46',
    secondaryColor: '#10B981',
    accentColor: '#E8832A',
    estadoPago: 'al_dia',
    planSuscripto: 'Cerca de Límite (92% de cuota alcanzado)',
    totalConductores: 46,
    totalVehiculos: 42
  },
  {
    id: '10000000-0000-0000-0000-000000000004',
    nombre: 'Ruta Ejecutiva',
    slug: 'rutaejecutiva',
    logoUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=150&auto=format&fit=crop&q=80',
    primaryColor: '#991B1B',
    secondaryColor: '#EF4444',
    accentColor: '#E8832A',
    estadoPago: 'suspendido',
    planSuscripto: 'Prueba Finalizada sin conversión',
    totalConductores: 5,
    totalVehiculos: 5
  }
];

export const initialVehicles: any[] = [
  { id: 'veh-101',  marca: 'Mercedes-Benz', modelo: 'Sprinter Executive', anio: 2024, placa: 'HBCV-12', color: 'Plata Metálico', capacidadPasajeros: 15, kilometraje: 14200, estadoOperativo: 'operativo', activo: true },
  { id: 'veh-102',  marca: 'Toyota', modelo: 'Hiace Commuter', anio: 2025, placa: 'KLPW-44', color: 'Blanco Perla', capacidadPasajeros: 12, kilometraje: 8900, estadoOperativo: 'operativo', activo: true },
  { id: 'veh-103',  marca: 'Kia', modelo: 'Carnival VIP Limousin', anio: 2024, placa: 'JYZM-90', color: 'Negro Profundo', capacidadPasajeros: 7, kilometraje: 21500, estadoOperativo: 'operativo', activo: true },
  { id: 'veh-104',  marca: 'Peugeot', modelo: 'Traveller Business', anio: 2023, placa: 'LXTG-23', color: 'Gris Ónice', capacidadPasajeros: 9, kilometraje: 45000, estadoOperativo: 'operativo', activo: true },
  { id: 'veh-105',  marca: 'Hyundai', modelo: 'Staria Calligraphy', anio: 2024, placa: 'GHWW-77', color: 'Negro Místico', capacidadPasajeros: 7, kilometraje: 11200, estadoOperativo: 'operativo', activo: true },
  { id: 'veh-106',  marca: 'Ford', modelo: 'Transit Custom Pasajeros', anio: 2023, placa: 'KDDM-51', color: 'Blanco Oxford', capacidadPasajeros: 14, kilometraje: 32000, estadoOperativo: 'operativo', activo: true },
  { id: 'veh-107',  marca: 'Maxus', modelo: 'G10 Executive', anio: 2024, placa: 'HHYY-88', color: 'Plata Eclipse', capacidadPasajeros: 9, kilometraje: 19400, estadoOperativo: 'operativo', activo: true },
  { id: 'veh-108',  marca: 'Toyota', modelo: 'Granvia Luxury', anio: 2025, placa: 'KKWX-33', color: 'Negro Metálico', capacidadPasajeros: 8, kilometraje: 5100, estadoOperativo: 'operativo', activo: true }
];

export const initialConductores: any[] = [
  {
    id: 'c1',
    rut: '15.678.901-2',
    nombreCompleto: 'Juan Pérez',
    telefono: '+56 9 1234 5678',
    email: 'juan.perez@transportesduet.cl',
    tipoLicencia: 'A3',
    numeroLicencia: '156789012',
    vencimientoLicencia: '2025-05-10',
    estado: 'activo',
    estadoWFM: 'disponible',
    enDescanso: false,
    created_at: '2023-01-15T10:00:00Z',
    updated_at: '2023-01-15T10:00:00Z'
  },
  {
    id: 'c2',
    rut: '16.789.012-3',
    nombreCompleto: 'Carlos Soto',
    telefono: '+56 9 2345 6789',
    email: 'carlos.soto@transportesduet.cl',
    tipoLicencia: 'A2',
    numeroLicencia: '167890123',
    vencimientoLicencia: '2024-11-20',
    estado: 'activo',
    estadoWFM: 'en_ruta',
    enDescanso: false,
    created_at: '2023-02-20T11:00:00Z',
    updated_at: '2023-02-20T11:00:00Z'
  },
  {
    id: 'c3',
    rut: '17.890.123-4',
    nombreCompleto: 'Luis Martínez',
    telefono: '+56 9 3456 7890',
    email: 'luis.martinez@transportesduet.cl',
    tipoLicencia: 'A3',
    numeroLicencia: '178901234',
    vencimientoLicencia: '2026-03-15',
    estado: 'inactivo',
    estadoWFM: 'offline',
    enDescanso: true,
    created_at: '2023-03-05T09:30:00Z',
    updated_at: '2023-03-05T09:30:00Z'
  },
  {
    id: 'c4',
    rut: '14.567.890-1',
    nombreCompleto: 'Miguel Rojas',
    telefono: '+56 9 4567 8901',
    email: 'miguel.rojas@transportesduet.cl',
    tipoLicencia: 'A3',
    numeroLicencia: '145678901',
    vencimientoLicencia: '2025-08-30',
    estado: 'activo',
    estadoWFM: 'disponible',
    enDescanso: false,
    created_at: '2023-04-12T14:15:00Z',
    updated_at: '2023-04-12T14:15:00Z'
  },
  {
    id: 'c5',
    rut: '18.901.234-5',
    nombreCompleto: 'Roberto Gómez',
    telefono: '+56 9 5678 9012',
    email: 'roberto.gomez@transportesduet.cl',
    tipoLicencia: 'A2',
    numeroLicencia: '189012345',
    vencimientoLicencia: '2024-12-05',
    estado: 'activo',
    estadoWFM: 'en_ruta',
    enDescanso: false,
    created_at: '2023-05-22T16:45:00Z',
    updated_at: '2023-05-22T16:45:00Z'
  },
  {
    id: 'c6',
    rut: '13.456.789-0',
    nombreCompleto: 'Andrés Silva',
    telefono: '+56 9 6789 0123',
    email: 'andres.silva@transportesduet.cl',
    tipoLicencia: 'A3',
    numeroLicencia: '134567890',
    vencimientoLicencia: '2025-01-20',
    estado: 'suspendido',
    estadoWFM: 'offline',
    enDescanso: false,
    created_at: '2023-06-10T08:00:00Z',
    updated_at: '2023-06-10T08:00:00Z'
  },
  {
    id: 'c7',
    rut: '19.012.345-6',
    nombreCompleto: 'Jorge Muñoz',
    telefono: '+56 9 7890 1234',
    email: 'jorge.munoz@transportesduet.cl',
    tipoLicencia: 'A3',
    numeroLicencia: '190123456',
    vencimientoLicencia: '2026-07-11',
    estado: 'activo',
    estadoWFM: 'disponible',
    enDescanso: false,
    created_at: '2023-07-01T13:20:00Z',
    updated_at: '2023-07-01T13:20:00Z'
  },
  {
    id: 'c8',
    rut: '15.987.654-3',
    nombreCompleto: 'Ricardo Castro',
    telefono: '+56 9 8901 2345',
    email: 'ricardo.castro@transportesduet.cl',
    tipoLicencia: 'A2',
    numeroLicencia: '159876543',
    vencimientoLicencia: '2024-09-18',
    estado: 'activo',
    estadoWFM: 'en_ruta',
    enDescanso: false,
    created_at: '2023-08-14T09:10:00Z',
    updated_at: '2023-08-14T09:10:00Z'
  }
] as unknown as Conductor[];

export const initialClientes: any[] = [
  {
    id: 'acciona-01',
      nombreCorporativo: 'Forestal Arauco Neira Transportes S.A.',
    rutIdentificador: '76.012.345-0',
    direccionFiscal: 'Parque Industrial Escuadrón Oeste, Coronel, Neira Transportes',
    contactoNombre: 'Ing. Rodrigo Fernández (Jefe de Logística y Personal)',
    contactoEmail: 'rodrigo.fernandez@arauco.cl',
    contactoTelefono: '+56 41 234 5000',
    tarifario: {
      tarifaPorKm: 1800,
      tarifaMinima: 12000,
      tiempoEsperaPorHora: 15000,
      rutasFijas: [
        { id: 'rf-01', nombre: 'Aeropuerto Carriel Sur ➔ Planta Escuadrón', origen: 'Aeropuerto Carriel Sur, Talcahuano', destino: 'Planta Escuadrón Oeste, Coronel', precioClp: 28500 },
        { id: 'rf-02', nombre: 'Centro Concepción ➔ Oficinas Arauco', origen: 'Plaza Independencia, Concepción', destino: 'Planta Escuadrón Oeste, Coronel', precioClp: 21000 }
      ]
    }
  },
  {
    id: 'swissport-01',
      nombreCorporativo: 'Compañía Siderúrgica Huachipato S.A.',
    rutIdentificador: '76.332.110-8',
    direccionFiscal: 'Av. Gran Bretaña 2910, Talcahuano, Región del Neira Transportes',
    contactoNombre: 'Lic. Marcela Alarcón (Subgerente de RRHH)',
    contactoEmail: 'malarcon@huachipato.cl',
    contactoTelefono: '+56 41 254 2000',
    tarifario: {
      tarifaPorKm: 1650,
      tarifaMinima: 10000,
      tiempoEsperaPorHora: 12000,
      rutasFijas: [
        { id: 'rf-03', nombre: 'Hotel Sonesta Casino Marina ➔ Planta Huachipato', origen: 'Casino Marina del Sol, Talcahuano', destino: 'Planta Industrial Huachipato', precioClp: 15000 }
      ]
    }
  },
  {
    id: 'jetsmart-01',
      nombreCorporativo: 'Jetsmart de Concepción (Dirección de Finanzas)',
    rutIdentificador: '70.003.500-4',
    direccionFiscal: 'Víctor Lamas 1290, Barrio Universitario, Concepción',
    contactoNombre: 'Dr. Hernán Solar Valdés',
    contactoEmail: 'hsolar@udec.cl',
    contactoTelefono: '+56 41 220 3000',
    tarifario: {
      tarifaPorKm: 1500,
      tarifaMinima: 8500,
      tiempoEsperaPorHora: 10000,
      rutasFijas: [
        { id: 'rf-04', nombre: 'Aeropuerto Carriel Sur ➔ Campus UdeC Concepción', origen: 'Aeropuerto Carriel Sur, Talcahuano', destino: 'Arco UdeC, Concepción', precioClp: 16000 }
      ]
    }
  },
  {
    id: 'generico-01',
      nombreCorporativo: 'Acciona / Urgencias',
    rutIdentificador: '70.211.900-3',
    direccionFiscal: 'Pedro de Valdivia 801, Concepción',
    contactoNombre: 'Dra. María Paz Solar (Jefe de Turnos Urgencia)',
    contactoEmail: 'msolar@sanatorio.cl',
    contactoTelefono: '+56 41 279 6000',
    tarifario: {
      tarifaPorKm: 1900,
      tarifaMinima: 14000,
      tiempoEsperaPorHora: 16000,
      rutasFijas: [
        { id: 'rf-05', nombre: 'Chacabuco 1400 ➔ Acciona', origen: 'Chacabuco 1400, Concepción', destino: 'Pedro de Valdivia 801, Concepción', precioClp: 18500 }
      ]
    }
  }
] as unknown as ClienteCorporativo[];

export const initialViajes: any[] = [
  {
    id: 'viaje-001',
      clienteCorporativoId: 'acciona-01',
    clienteNombre: 'Forestal Arauco Neira Transportes S.A.',
    conductorId: 'c-101',
    conductorNombre: 'Marco Antonio Solar',
    vehiculoId: 'veh-101',
    vehiculoPlaca: 'HBCV-12',
    pasajeroNombre: 'Ing. Gonzalo Sepúlveda',
    pasajeroTelefono: '+56 9 9123 4567',
    origenDireccion: 'Aeropuerto Carriel Sur, Talcahuano',
    origenLat: -36.7731,
    origenLng: -73.0610,
    destinoDireccion: 'Parque Industrial Escuadrón, Coronel',
    destinoLat: -36.9350,
    destinoLng: -73.1492,
    fechaProgramada: 'Hoy, 08:30 AM (En Curso)',
    estado: 'en_camino',
    secureTrackingToken: 'token-concepcion-001',
    montoEstimado: 28500
  },
  {
    id: 'viaje-002',
      clienteCorporativoId: 'swissport-01',
    clienteNombre: 'Siderúrgica Huachipato S.A.',
    conductorId: 'c-102',
    conductorNombre: 'Cristian Becerra Tapia',
    vehiculoId: 'veh-102',
    vehiculoPlaca: 'KLPW-44',
    pasajeroNombre: 'Delegación Ejecutiva Alemana (4 Pax)',
    pasajeroTelefono: '+56 9 8234 5678',
    origenDireccion: 'Hotel Sonesta, Casino Marina del Sol, Talcahuano',
    origenLat: -36.7915,
    origenLng: -73.0720,
    destinoDireccion: 'Planta Huachipato, Av. Gran Bretaña 2910',
    destinoLat: -36.7580,
    destinoLng: -73.1120,
    fechaProgramada: 'Hoy, 09:15 AM (Inmediato)',
    estado: 'en_camino',
    secureTrackingToken: 'token-concepcion-002',
    montoEstimado: 15000
  },
  {
    id: 'viaje-003',
      clienteCorporativoId: 'jetsmart-01',
    clienteNombre: 'Jetsmart de Concepción (Finanzas)',
    conductorId: 'c-103',
    conductorNombre: 'Héctor Saavedra Cruz',
    vehiculoId: 'veh-103',
    vehiculoPlaca: 'JYZM-90',
    pasajeroNombre: 'Dr. Klaus von Mises (Conferencista Invitado)',
    pasajeroTelefono: '+56 9 7345 6789',
    origenDireccion: 'Aeropuerto Carriel Sur, Talcahuano',
    origenLat: -36.7731,
    origenLng: -73.0610,
    destinoDireccion: 'Arco Medicina UdeC, Barrio Universitario, Concepción',
    destinoLat: -36.8320,
    destinoLng: -73.0360,
    fechaProgramada: 'Hoy, 10:00 AM',
    estado: 'asignado',
    secureTrackingToken: 'token-concepcion-003',
    montoEstimado: 16000
  },
  {
    id: 'viaje-004',
      clienteCorporativoId: 'acciona-01',
    clienteNombre: 'Forestal Arauco Neira Transportes S.A.',
    conductorId: 'c-104',
    conductorNombre: 'Víctor Hugo Paredes',
    vehiculoId: 'veh-104',
    vehiculoPlaca: 'LXTG-23',
    pasajeroNombre: 'Equipo de Auditoría Externa (6 Pax)',
    pasajeroTelefono: '+56 9 6456 7890',
    origenDireccion: 'Autopista Concepción-Talcahuano (Ruta Interportuaria)',
    origenLat: -36.7850,
    origenLng: -73.0550,
    destinoDireccion: 'Planta Industrial Lirquén / Penco',
    destinoLat: -36.7080,
    destinoLng: -72.9750,
    fechaProgramada: 'Hoy, 08:00 AM',
    estado: 'excepcion',
    secureTrackingToken: 'token-concepcion-004',
    montoEstimado: 24000,
    incidencia: {
      id: 'inc-bio-01',
      viajeId: 'viaje-004',
      tipo: 'falla_mecanica',
      gravedad: 'alta',
      descripcion: 'Alerta OBD-II: Pérdida de presión neumático trasero derecho cerca de Nudo Gatica. Requiere envío de Unidad de Rescate para evitar retraso a planta Lirquén.',
      timestamp: '08:42 AM',
      resuelta: false
    }
  },
  {
    id: 'viaje-005',
      clienteCorporativoId: 'swissport-01',
    clienteNombre: 'Siderúrgica Huachipato S.A.',
    pasajeroNombre: 'Ing. Claudio Arriagada',
    pasajeroTelefono: '+56 9 5567 8901',
    origenDireccion: 'Barrio Industrial Chiguayante (O\'Higgins 450)',
    origenLat: -36.9150,
    origenLng: -73.0200,
    destinoDireccion: 'Andalué, San Pedro de la Paz (Camino al Venado)',
    destinoLat: -36.8550,
    destinoLng: -73.1150,
    fechaProgramada: 'Hoy, 11:30 AM (Pendiente Despacho)',
    estado: 'pendiente',
    secureTrackingToken: 'token-concepcion-005',
    montoEstimado: 14500
  }
] as unknown as ViajeOperativo[];

export const mockRutasRecurentes: any[] = [
  {
    id: 'rr-concep-01',
      clienteCorporativoId: 'acciona-01',
    clienteNombre: 'Forestal Arauco Neira Transportes S.A.',
    nombreRuta: 'Turno Matinal Jefaturas (Concepción ➔ Coronel)',
    diasSemana: 'Lunes a Viernes',
    horaProgramada: '07:15 AM',
    origen: 'Plaza España / Estación Biotren Concepción',
    destino: 'Parque Industrial Escuadrón Oeste, Coronel',
    pasajeroReferencia: 'Ing. Gonzalo Sepúlveda + 8 Funcionarios',
    activa: true
  },
  {
    id: 'rr-concep-02',
      clienteCorporativoId: 'swissport-01',
    clienteNombre: 'Siderúrgica Huachipato S.A.',
    nombreRuta: 'Conexión Aeropuerto ➔ Gerencia Huachipato',
    diasSemana: 'Lunes, Miércoles y Viernes',
    horaProgramada: '08:45 AM',
    origen: 'Terminal de Llegadas, Aeropuerto Carriel Sur, Talcahuano',
    destino: 'Edificio Central Gerencia Huachipato, Av. Gran Bretaña',
    pasajeroReferencia: 'Ejecutivos de Operaciones Siderúrgicas',
    activa: true
  }
];

export const getWFMStats = (): any => {
  return {
    conductoresOffline: 1,
    viajesCompletadosHoy: 12,
    viajesEnCurso: 3,
    tiempoPromedioAsignacionMin: 3.4,
    alertasActivas: 1
  };
}

// Re-export aliases for compatibility with AppContext
export {
  initialConductores as mockConductoresWFM,
  initialVehicles as mockVehiculosIniciales,
  initialClientes as mockClientesIniciales,
  initialViajes as mockViajesIniciales
};

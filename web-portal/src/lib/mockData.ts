import type { EmpresaTenant, ConductorWFM, VehiculoFlota, ClienteCorporativo, ViajeOperativa, WFMEstatisticas, RutaRecurrente } from '../types';

export const initialTenants: EmpresaTenant[] = [
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

export const initialVehicles: VehiculoFlota[] = [
  { id: 'veh-101',  marca: 'Mercedes-Benz', modelo: 'Sprinter Executive', anio: 2024, placa: 'HBCV-12', color: 'Plata Metálico', capacidadPasajeros: 15, kilometraje: 14200, estadoOperativo: 'operativo', activo: true },
  { id: 'veh-102',  marca: 'Toyota', modelo: 'Hiace Commuter', anio: 2025, placa: 'KLPW-44', color: 'Blanco Perla', capacidadPasajeros: 12, kilometraje: 8900, estadoOperativo: 'operativo', activo: true },
  { id: 'veh-103',  marca: 'Kia', modelo: 'Carnival VIP Limousin', anio: 2024, placa: 'JYZM-90', color: 'Negro Profundo', capacidadPasajeros: 7, kilometraje: 21500, estadoOperativo: 'operativo', activo: true },
  { id: 'veh-104',  marca: 'Peugeot', modelo: 'Traveller Business', anio: 2023, placa: 'LXTG-23', color: 'Gris Ónice', capacidadPasajeros: 9, kilometraje: 45000, estadoOperativo: 'operativo', activo: true },
  { id: 'veh-105',  marca: 'Hyundai', modelo: 'Staria Calligraphy', anio: 2024, placa: 'GHWW-77', color: 'Negro Místico', capacidadPasajeros: 7, kilometraje: 11200, estadoOperativo: 'operativo', activo: true },
  { id: 'veh-106',  marca: 'Ford', modelo: 'Transit Custom Pasajeros', anio: 2023, placa: 'KDDM-51', color: 'Blanco Oxford', capacidadPasajeros: 14, kilometraje: 32000, estadoOperativo: 'operativo', activo: true },
  { id: 'veh-107',  marca: 'Maxus', modelo: 'G10 Executive', anio: 2024, placa: 'HHYY-88', color: 'Plata Eclipse', capacidadPasajeros: 9, kilometraje: 19400, estadoOperativo: 'operativo', activo: true },
  { id: 'veh-108',  marca: 'Toyota', modelo: 'Granvia Luxury', anio: 2025, placa: 'KKWX-33', color: 'Negro Metálico', capacidadPasajeros: 8, kilometraje: 5100, estadoOperativo: 'operativo', activo: true }
];

export const initialConductores: ConductorWFM[] = [
  {
    id: 'c-101',
      nombreCompleto: 'Marco Antonio Solar',
    rut: '12.489.102-K',
    tipoLicencia: 'A3',
    puntualidad: '4.9 / 5.0',
    serviciosMes: 48,
    email: 'm.solar@transportesandina.cl',
    telefono: '+56 9 8492 1039',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    vehiculoAsignadoId: 'veh-101',
    vehiculo: initialVehicles[0],
    estadoWFM: 'en_ruta',
    ultimaLatitud: -36.7731, // Talcahuano / Aeropuerto Carriel Sur
    ultimaLongitud: -73.0610,
    ultimaActualizacionGps: 'Hace 5 seg',
    numeroLicencia: 'LIC-CL-12489102K',
    vencimientoLicencia: '2028-11-15',
    horasConducidasHoy: 4.5,
    enDescanso: false
  },
  {
    id: 'c-102',
      nombreCompleto: 'Cristian Becerra Tapia',
    rut: '14.810.293-1',
    tipoLicencia: 'A3',
    puntualidad: '4.8 / 5.0',
    serviciosMes: 52,
    email: 'c.becerra@transportesandina.cl',
    telefono: '+56 9 7310 9482',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    vehiculoAsignadoId: 'veh-102',
    vehiculo: initialVehicles[1],
    estadoWFM: 'en_ruta',
    ultimaLatitud: -36.8268, // Concepción Centro / Plaza Independencia
    ultimaLongitud: -73.0498,
    ultimaActualizacionGps: 'Hace 12 seg',
    numeroLicencia: 'LIC-CL-148102931',
    vencimientoLicencia: '2027-08-22',
    horasConducidasHoy: 6.0,
    enDescanso: false
  },
  {
    id: 'c-103',
      nombreCompleto: 'Héctor Saavedra Cruz',
    rut: '13.910.482-4',
    tipoLicencia: 'A3',
    puntualidad: '4.95 / 5.0',
    serviciosMes: 45,
    email: 'h.saavedra@transportesandina.cl',
    telefono: '+56 9 6182 3019',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    vehiculoAsignadoId: 'veh-103',
    vehiculo: initialVehicles[2],
    estadoWFM: 'en_ruta',
    ultimaLatitud: -36.8400, // San Pedro de la Paz / Laguna Grande
    ultimaLongitud: -73.1025,
    ultimaActualizacionGps: 'Hace 3 seg',
    numeroLicencia: 'LIC-CL-139104824',
    vencimientoLicencia: '2029-05-10',
    horasConducidasHoy: 3.5,
    enDescanso: false
  },
  {
    id: 'c-104',
      nombreCompleto: 'Víctor Hugo Paredes',
    rut: '15.293.810-7',
    tipoLicencia: 'A2',
    puntualidad: '4.75 / 5.0',
    serviciosMes: 39,
    email: 'v.paredes@transportesandina.cl',
    telefono: '+56 9 9481 0291',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    vehiculoAsignadoId: 'veh-104',
    vehiculo: initialVehicles[3],
    estadoWFM: 'en_ruta',
    ultimaLatitud: -36.9350, // Coronel / Parque Industrial Escuadrón
    ultimaLongitud: -73.1492,
    ultimaActualizacionGps: 'Hace 8 seg',
    numeroLicencia: 'LIC-CL-152938107',
    vencimientoLicencia: '2027-10-30',
    horasConducidasHoy: 5.5,
    enDescanso: false
  },
  {
    id: 'c-105',
      nombreCompleto: 'Armando Loyola Castro',
    rut: '11.890.342-9',
    tipoLicencia: 'A3',
    puntualidad: '5.0 / 5.0',
    serviciosMes: 61,
    email: 'a.loyola@transportesandina.cl',
    telefono: '+56 9 8391 0492',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    vehiculoAsignadoId: 'veh-105',
    vehiculo: initialVehicles[4],
    estadoWFM: 'disponible',
    ultimaLatitud: -36.7780, // Terminal Carriel Sur de guardia
    ultimaLongitud: -73.0645,
    ultimaActualizacionGps: 'En base WFM',
    numeroLicencia: 'LIC-CL-118903429',
    vencimientoLicencia: '2029-01-20',
    horasConducidasHoy: 2.0,
    enDescanso: false
  },
  {
    id: 'c-106',
      nombreCompleto: 'Gabriel Montero Soto',
    rut: '16.819.302-K',
    tipoLicencia: 'A3',
    puntualidad: '4.9 / 5.0',
    serviciosMes: 44,
    email: 'g.montero@transportesandina.cl',
    telefono: '+56 9 7182 9301',
    avatarUrl: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=150&auto=format&fit=crop&q=80',
    vehiculoAsignadoId: 'veh-106',
    vehiculo: initialVehicles[5],
    estadoWFM: 'disponible',
    ultimaLatitud: -36.8150, // Hualpén / Avenida Colon
    ultimaLongitud: -73.0850,
    ultimaActualizacionGps: 'Hace 1 min',
    numeroLicencia: 'LIC-CL-16819302K',
    vencimientoLicencia: '2028-06-14',
    horasConducidasHoy: 3.0,
    enDescanso: false
  },
  {
    id: 'c-107',
      nombreCompleto: 'Esteban Miranda Quezada',
    rut: '14.019.283-5',
    tipoLicencia: 'A3',
    puntualidad: '4.85 / 5.0',
    serviciosMes: 37,
    email: 'e.miranda@transportesandina.cl',
    telefono: '+56 9 8490 1928',
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    vehiculoAsignadoId: 'veh-107',
    vehiculo: initialVehicles[6],
    estadoWFM: 'disponible',
    ultimaLatitud: -36.9050, // Chiguayante Sur
    ultimaLongitud: -73.0240,
    ultimaActualizacionGps: 'Hace 45 seg',
    numeroLicencia: 'LIC-CL-140192835',
    vencimientoLicencia: '2027-12-05',
    horasConducidasHoy: 1.5,
    enDescanso: false
  },
  {
    id: 'c-108',
      nombreCompleto: 'Rodolfo Alarcón Peña',
    rut: '13.402.910-2',
    tipoLicencia: 'A2',
    puntualidad: '4.9 / 5.0',
    serviciosMes: 40,
    email: 'r.alarcon@transportesandina.cl',
    telefono: '+56 9 9123 4812',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    vehiculoAsignadoId: 'veh-108',
    vehiculo: initialVehicles[7],
    estadoWFM: 'disponible',
    ultimaLatitud: -36.8280, // Concepción Centro Oriente
    ultimaLongitud: -73.0420,
    ultimaActualizacionGps: 'Hace 2 min',
    numeroLicencia: 'LIC-CL-134029102',
    vencimientoLicencia: '2028-09-18',
    horasConducidasHoy: 2.5,
    enDescanso: false
  }
];

export const initialClientes: ClienteCorporativo[] = [
  {
    id: 'cl-b2b-01',
      nombreCorporativo: 'Forestal Arauco Biobío S.A.',
    rutIdentificador: '76.012.345-0',
    direccionFiscal: 'Parque Industrial Escuadrón Oeste, Coronel, Biobío',
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
    id: 'cl-b2b-02',
      nombreCorporativo: 'Compañía Siderúrgica Huachipato S.A.',
    rutIdentificador: '76.332.110-8',
    direccionFiscal: 'Av. Gran Bretaña 2910, Talcahuano, Región del Biobío',
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
    id: 'cl-b2b-03',
      nombreCorporativo: 'Universidad de Concepción (Dirección de Finanzas)',
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
    id: 'cl-b2b-04',
      nombreCorporativo: 'Clínica Sanatorio Alemán / Urgencias',
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
        { id: 'rf-05', nombre: 'Chacabuco 1400 ➔ Clínica Sanatorio Alemán', origen: 'Chacabuco 1400, Concepción', destino: 'Pedro de Valdivia 801, Concepción', precioClp: 18500 }
      ]
    }
  }
];

export const initialViajes: ViajeOperativa[] = [
  {
    id: 'viaje-001',
      clienteCorporativoId: 'cl-b2b-01',
    clienteNombre: 'Forestal Arauco Biobío S.A.',
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
      clienteCorporativoId: 'cl-b2b-02',
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
      clienteCorporativoId: 'cl-b2b-03',
    clienteNombre: 'Universidad de Concepción (Finanzas)',
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
      clienteCorporativoId: 'cl-b2b-01',
    clienteNombre: 'Forestal Arauco Biobío S.A.',
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
      clienteCorporativoId: 'cl-b2b-02',
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
];

export const initialRutasRecurrentes: RutaRecurrente[] = [
  {
    id: 'rr-concep-01',
      clienteCorporativoId: 'cl-b2b-01',
    clienteNombre: 'Forestal Arauco Biobío S.A.',
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
      clienteCorporativoId: 'cl-b2b-02',
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

export function getWFMStats( conductores: ConductorWFM[], viajes: ViajeOperativa[]): WFMEstatisticas {
  const conds = conductores;
  const vj = viajes;

  const disponibles = conds.filter(c => c.estadoWFM === 'disponible' && !c.enDescanso).length;
  const enRuta = conds.filter(c => c.estadoWFM === 'en_ruta').length;
  const offline = conds.filter(c => c.estadoWFM === 'offline' || c.enDescanso).length;

  const enCurso = vj.filter(v => ['asignado', 'en_camino', 'en_transito'].includes(v.estado)).length;
  const completados = vj.filter(v => v.estado === 'completado').length;
  const alertas = vj.filter(v => v.estado === 'excepcion' || (v.incidencia && !v.incidencia.resuelta)).length;

  return {
    totalConductores: conds.length,
    conductoresDisponibles: disponibles,
    conductoresEnRuta: enRuta,
    conductoresOffline: offline,
    viajesCompletadosHoy: completados,
    viajesEnCurso: enCurso,
    tiempoPromedioAsignacionMin: 3.4,
    alertasActivas: alertas
  };
}

// Re-export aliases for compatibility with AppContext
export {
  initialConductores as mockConductoresWFM,
  initialVehicles as mockVehiculosIniciales,
  initialClientes as mockClientesIniciales,
  initialViajes as mockViajesIniciales,
  initialRutasRecurrentes as mockRutasRecurentes
};

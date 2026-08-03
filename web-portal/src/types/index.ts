export interface EmpresaTenant {
  id: string;
  nombre: string;
  slug: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string; // Fijo #E8832A
  estadoPago: 'al_dia' | 'pendiente' | 'suspendido';
  planSuscripto: string;
  totalConductores?: number;
  totalVehiculos?: number;
  razonSocial?: string;
  rut?: string;
  paisOperacion?: string;
  zonaHoraria?: string;
  moneda?: string;
  contactoPrincipal?: string;
  contactoEmail?: string;
  contactoTelefono?: string;
}

export interface VehiculoFlota {
  id: string;
  empresaId: string;
  marca: string;
  modelo: string;
  anio: number;
  placa: string; // Alias Patente / Placa
  color: string;
  capacidadPasajeros: number;
  kilometraje: number;
  estadoOperativo: 'operativo' | 'mantenimiento' | 'inactivo';
  activo: boolean;
}

export interface ConductorWFM {
  id: string;
  empresaId: string;
  nombreCompleto: string;
  email: string;
  telefono: string;
  avatarUrl: string;
  rut?: string;
  tipoLicencia?: 'A1' | 'A2' | 'A3';
  puntualidad?: string;
  serviciosMes?: number;
  vehiculoAsignadoId?: string;
  vehiculo?: VehiculoFlota;
  estadoWFM: 'disponible' | 'en_ruta' | 'offline';
  ultimaLatitud?: number;
  ultimaLongitud?: number;
  ultimaActualizacionGps?: string;
  numeroLicencia?: string;
  vencimientoLicencia?: string;
  viajeActualId?: string;
  horasConducidasHoy: number;
  enDescanso: boolean;
  motivoBloqueo?: string;
}

export interface RutaFijaTarifa {
  id: string;
  nombre: string;
  origen: string;
  destino: string;
  precioClp: number;
}

export interface TarifarioB2B {
  tarifaPorKm: number;
  tarifaMinima: number;
  tiempoEsperaPorHora: number;
  rutasFijas: RutaFijaTarifa[];
}

export interface ClienteCorporativo {
  id: string;
  empresaId: string;
  nombreCorporativo: string;
  rutIdentificador: string;
  direccionFiscal: string;
  contactoNombre: string;
  contactoEmail: string;
  contactoTelefono?: string;
  tarifario: TarifarioB2B;
}

export interface IncidenciaOperativa {
  id: string;
  viajeId: string;
  tipo: 'retraso' | 'falla_mecanica' | 'trafico_severo';
  gravedad: 'media' | 'alta' | 'critica';
  descripcion: string;
  timestamp: string;
  resuelta: boolean;
}

export interface ViajeOperativa {
  id: string;
  empresaId: string;
  clienteCorporativoId: string;
  clienteNombre?: string;
  conductorId?: string;
  conductorNombre?: string;
  vehiculoId?: string;
  vehiculoPlaca?: string;
  pasajeroNombre: string;
  pasajeroTelefono: string;
  origenDireccion: string;
  origenLat: number;
  origenLng: number;
  destinoDireccion: string;
  destinoLat: number;
  destinoLng: number;
  fechaProgramada: string;
  estado: 'pendiente' | 'asignado' | 'en_camino' | 'en_transito' | 'completado' | 'cancelado' | 'excepcion';
  secureTrackingToken: string;
  montoEstimado: number;
  timestampDespacho?: string;
  incidencia?: IncidenciaOperativa;
}

export interface RutaRecurrente {
  id: string;
  empresaId: string;
  clienteCorporativoId: string;
  clienteNombre: string;
  nombreRuta: string;
  diasSemana: string; // ej: "Lunes a Viernes"
  horaProgramada: string; // ej: "07:00 AM"
  origen: string;
  destino: string;
  pasajeroReferencia: string;
  activa: boolean;
}

export interface WFMEstatisticas {
  totalConductores: number;
  conductoresDisponibles: number;
  conductoresEnRuta: number;
  conductoresOffline: number;
  viajesCompletadosHoy: number;
  viajesEnCurso: number;
  tiempoPromedioAsignacionMin: number;
  alertasActivas: number;
}

export interface FuncionarioB2B {
  id: string;
  clienteCorporativoId: string;
  nombreCompleto: string;
  rut: string;
  telefono: string;
  email: string;
  area: string;
  direccionRecogida: string;
  comuna: string;
  centroCosto?: string;
  preferenciaTurno?: string;
  estadoGeo: 'activo' | 'inactivo' | 'revision';
}

export interface DemandaTurnoB2B {
  id: string;
  clienteId: string;
  nombreTurno: string;
  horaIngreso: string;
  horaSalida: string;
  cantidadEntrando: number;
  cantidadSaliendo: number;
  estadoSincronizacion: 'sincronizado' | 'pendiente_wfm';
}

export interface AvisoOperativo {
  id: string;
  viajeId?: string;
  pasajeroNombre: string;
  mensaje: string;
  timestamp: string;
  leido: boolean;
  tipo: 'aviso_rapido' | 'sos_pasajero' | 'alerta_central';
}

export interface PasajeroRutaCheck {
  id: string;
  nombre: string;
  rut: string;
  direccion: string;
  telefono: string;
  estado: 'pendiente' | 'abordo' | 'ausente' | 'aviso_recibido';
  notaAviso?: string;
}


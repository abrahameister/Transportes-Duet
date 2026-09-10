import type { Database } from './database.types';

export type UUID = string;

// Tipos crudos DB
type DbPerfil = Database['public']['Tables']['perfiles']['Row'];
type DbClienteCorporativo = Database['public']['Tables']['clientes_corporativos']['Row'];
type DbSede = Database['public']['Tables']['sedes']['Row'];
type DbCentroCosto = Database['public']['Tables']['centros_costo']['Row'];
type DbUsuarioClienteB2B = Database['public']['Tables']['usuarios_cliente_b2b']['Row'];
type DbPasajero = Database['public']['Tables']['pasajeros']['Row'];
type DbConductor = Database['public']['Tables']['conductores']['Row'];
type DbVehiculo = Database['public']['Tables']['vehiculos']['Row'];
type DbViaje = Database['public']['Tables']['viajes']['Row'];
type DbViajePasajero = Database['public']['Tables']['viaje_pasajeros']['Row'];
type DbAsignacion = Database['public']['Tables']['asignaciones']['Row'];
type DbEventoViaje = Database['public']['Tables']['eventos_viaje']['Row'];
type DbIncidencia = Database['public']['Tables']['incidencias']['Row'];
type DbAviso = Database['public']['Tables']['avisos']['Row'];
type DbInspeccion = Database['public']['Tables']['inspecciones']['Row'];
type DbTrackingPosition = Database['public']['Tables']['tracking_positions']['Row'];
type DbTrackingToken = Database['public']['Tables']['tracking_tokens']['Row'];
type DbAuditoria = Database['public']['Tables']['auditoria']['Row'];

// Mapeos 1:1 desde Supabase + UI Extensions (Bypassing strict DB fields for UI logic)
export type Perfil = Partial<DbPerfil> & { id: string; [key: string]: any };
export type ClienteCorporativo = Partial<DbClienteCorporativo> & { id: string; [key: string]: any };
export type Sede = Partial<DbSede> & { id: string; [key: string]: any };
export type CentroCosto = Partial<DbCentroCosto> & { id: string; [key: string]: any };
export type UsuarioClienteB2B = Partial<DbUsuarioClienteB2B> & { id: string; [key: string]: any };
export type Pasajero = Partial<DbPasajero> & { id: string; [key: string]: any };
export type Conductor = Partial<DbConductor> & { id: string; [key: string]: any };
export type Vehiculo = Partial<DbVehiculo> & { id: string; [key: string]: any };
export type Viaje = Partial<DbViaje> & { id: string; [key: string]: any };
export type ViajePasajero = Partial<DbViajePasajero> & { id: string; [key: string]: any };
export type Asignacion = Partial<DbAsignacion> & { id: string; [key: string]: any };
export type EventoViaje = Partial<DbEventoViaje> & { id: string; [key: string]: any };
export type Incidencia = Partial<DbIncidencia> & { id: string; [key: string]: any };
export type Aviso = Partial<DbAviso> & { id: string; [key: string]: any };
export type Inspeccion = Partial<DbInspeccion> & { id: string; [key: string]: any };
export type TrackingPosition = Partial<DbTrackingPosition> & { id: string; [key: string]: any };
export type TrackingToken = Partial<DbTrackingToken> & { id: string; [key: string]: any };
export type Auditoria = Partial<DbAuditoria> & { id: string; [key: string]: any };

// Tipos Compuestos (Útiles para UI con Joins)
export interface ViajeOperativo extends Viaje {
  cliente?: ClienteCorporativo;
  conductor?: Conductor;
  vehiculo?: Vehiculo;
  pasajeros?: (Pasajero & { estado_abordaje?: ViajePasajero['estado'] })[];
  [key: string]: any;
}

export interface WFMEstatisticas {
  [key: string]: any;
}

export interface RutaRecurrente {
  id: string;
  cliente_corporativo_id?: string;
  nombre_ruta?: string;
  dias_semana?: string;
  hora_programada?: string;
  origen?: string;
  destino?: string;
  pasajero_referencia?: string;
  activa?: boolean;
  created_at?: string;
  [key: string]: any;
}

// Legacy UI types (Bypassed)
export type AvisoOperativo = Partial<Aviso> & { [key: string]: any };
export type ConductorWFM = Partial<Conductor> & { [key: string]: any };
export type VehiculoFlota = Partial<Vehiculo> & { [key: string]: any };
export type ViajeOperativa = Partial<ViajeOperativo> & { [key: string]: any };
export type EmpresaTenant = Partial<ClienteCorporativo> & { [key: string]: any };
export type PasajeroRutaCheck = any;

export interface TurnoConductor {
  id: string;
  conductor_id: string;
  vehiculo_id?: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  tipo_jornada: 'manana' | 'tarde' | 'noche' | 'partida' | 'descanso';
  estado: 'planificado' | 'en_turno' | 'completado' | 'ausente' | 'licencia';
  notas?: string | null;
  conductor?: Conductor;
  vehiculo?: Vehiculo;
  created_at?: string;
  updated_at?: string;
}

export type FuncionarioB2B = any;
export type DemandaTurnoB2B = any;

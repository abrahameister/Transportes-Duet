import type { Database } from './database.types';

export type UUID = string;

// Mapeos 1:1 desde Supabase
export type Perfil = Database['public']['Tables']['perfiles']['Row'];
export type ClienteCorporativo = Database['public']['Tables']['clientes_corporativos']['Row'];
export type Sede = Database['public']['Tables']['sedes']['Row'];
export type CentroCosto = Database['public']['Tables']['centros_costo']['Row'];
export type UsuarioClienteB2B = Database['public']['Tables']['usuarios_cliente_b2b']['Row'];
export type Pasajero = Database['public']['Tables']['pasajeros']['Row'];
export type Conductor = Database['public']['Tables']['conductores']['Row'];
export type Vehiculo = Database['public']['Tables']['vehiculos']['Row'];
export type Viaje = Database['public']['Tables']['viajes']['Row'];
export type ViajePasajero = Database['public']['Tables']['viaje_pasajeros']['Row'];
export type Asignacion = Database['public']['Tables']['asignaciones']['Row'];
export type EventoViaje = Database['public']['Tables']['eventos_viaje']['Row'];
export type Incidencia = Database['public']['Tables']['incidencias']['Row'];
export type Aviso = Database['public']['Tables']['avisos']['Row'];
export type Inspeccion = Database['public']['Tables']['inspecciones']['Row'];
export type TrackingPosition = Database['public']['Tables']['tracking_positions']['Row'];
export type TrackingToken = Database['public']['Tables']['tracking_tokens']['Row'];
export type Auditoria = Database['public']['Tables']['auditoria']['Row'];

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
export type AvisoOperativo = Aviso;
export type ConductorWFM = Conductor;
export type VehiculoFlota = Vehiculo;
export type ViajeOperativa = ViajeOperativo;
export type EmpresaTenant = ClienteCorporativo;
export type PasajeroRutaCheck = any;

export interface TurnoConductor {
  id: string;
  conductor_id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  tipo_jornada: 'manana' | 'tarde' | 'noche' | 'partida' | 'descanso';
  estado: 'planificado' | 'en_turno' | 'completado' | 'ausente' | 'licencia';
  notas?: string | null;
  conductor?: Conductor;
  created_at?: string;
  updated_at?: string;
}


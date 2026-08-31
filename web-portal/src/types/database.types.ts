export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      asignaciones: {
        Row: {
          conductor_id: string
          created_at: string
          estado: string
          id: string
          updated_at: string
          vehiculo_id: string
          viaje_id: string
        }
        Insert: {
          conductor_id: string
          created_at?: string
          estado?: string
          id?: string
          updated_at?: string
          vehiculo_id: string
          viaje_id: string
        }
        Update: {
          conductor_id?: string
          created_at?: string
          estado?: string
          id?: string
          updated_at?: string
          vehiculo_id?: string
          viaje_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asignaciones_conductor_id_fkey"
            columns: ["conductor_id"]
            isOneToOne: false
            referencedRelation: "conductores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asignaciones_vehiculo_id_fkey"
            columns: ["vehiculo_id"]
            isOneToOne: false
            referencedRelation: "vehiculos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asignaciones_viaje_id_fkey"
            columns: ["viaje_id"]
            isOneToOne: false
            referencedRelation: "viajes"
            referencedColumns: ["id"]
          },
        ]
      }
      auditoria: {
        Row: {
          accion: string
          created_at: string
          datos_anteriores: Json | null
          datos_nuevos: Json | null
          id: string
          realizado_por_perfil_id: string | null
          registro_id: string
          tabla_afectada: string
        }
        Insert: {
          accion: string
          created_at?: string
          datos_anteriores?: Json | null
          datos_nuevos?: Json | null
          id?: string
          realizado_por_perfil_id?: string | null
          registro_id: string
          tabla_afectada: string
        }
        Update: {
          accion?: string
          created_at?: string
          datos_anteriores?: Json | null
          datos_nuevos?: Json | null
          id?: string
          realizado_por_perfil_id?: string | null
          registro_id?: string
          tabla_afectada?: string
        }
        Relationships: [
          {
            foreignKeyName: "auditoria_realizado_por_perfil_id_fkey"
            columns: ["realizado_por_perfil_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      avisos: {
        Row: {
          created_at: string
          destinatario_perfil_id: string | null
          id: string
          leido: boolean
          mensaje: string
          remitente_perfil_id: string | null
          viaje_id: string | null
        }
        Insert: {
          created_at?: string
          destinatario_perfil_id?: string | null
          id?: string
          leido?: boolean
          mensaje: string
          remitente_perfil_id?: string | null
          viaje_id?: string | null
        }
        Update: {
          created_at?: string
          destinatario_perfil_id?: string | null
          id?: string
          leido?: boolean
          mensaje?: string
          remitente_perfil_id?: string | null
          viaje_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "avisos_destinatario_perfil_id_fkey"
            columns: ["destinatario_perfil_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avisos_remitente_perfil_id_fkey"
            columns: ["remitente_perfil_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avisos_viaje_id_fkey"
            columns: ["viaje_id"]
            isOneToOne: false
            referencedRelation: "viajes"
            referencedColumns: ["id"]
          },
        ]
      }
      centros_costo: {
        Row: {
          cliente_corporativo_id: string
          codigo: string
          created_at: string
          descripcion: string | null
          estado: string
          id: string
          updated_at: string
        }
        Insert: {
          cliente_corporativo_id: string
          codigo: string
          created_at?: string
          descripcion?: string | null
          estado?: string
          id?: string
          updated_at?: string
        }
        Update: {
          cliente_corporativo_id?: string
          codigo?: string
          created_at?: string
          descripcion?: string | null
          estado?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "centros_costo_cliente_corporativo_id_fkey"
            columns: ["cliente_corporativo_id"]
            isOneToOne: false
            referencedRelation: "clientes_corporativos"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes_corporativos: {
        Row: {
          contacto_email: string | null
          contacto_nombre: string | null
          contacto_telefono: string | null
          created_at: string
          direccion_fiscal: string | null
          estado: string
          id: string
          invitacion_enviada: boolean | null
          nombre_corporativo: string
          rut_identificador: string
          updated_at: string
        }
        Insert: {
          contacto_email?: string | null
          contacto_nombre?: string | null
          contacto_telefono?: string | null
          created_at?: string
          direccion_fiscal?: string | null
          estado?: string
          id?: string
          invitacion_enviada?: boolean | null
          nombre_corporativo: string
          rut_identificador: string
          updated_at?: string
        }
        Update: {
          contacto_email?: string | null
          contacto_nombre?: string | null
          contacto_telefono?: string | null
          created_at?: string
          direccion_fiscal?: string | null
          estado?: string
          id?: string
          invitacion_enviada?: boolean | null
          nombre_corporativo?: string
          rut_identificador?: string
          updated_at?: string
        }
        Relationships: []
      }
      conductores: {
        Row: {
          created_at: string
          estado: string
          id: string
          nombre_completo: string
          perfil_id: string | null
          rut: string
          telefono: string
          tipo_licencia: string | null
          updated_at: string
          vencimiento_licencia: string | null
        }
        Insert: {
          created_at?: string
          estado?: string
          id?: string
          nombre_completo: string
          perfil_id?: string | null
          rut: string
          telefono: string
          tipo_licencia?: string | null
          updated_at?: string
          vencimiento_licencia?: string | null
        }
        Update: {
          created_at?: string
          estado?: string
          id?: string
          nombre_completo?: string
          perfil_id?: string | null
          rut?: string
          telefono?: string
          tipo_licencia?: string | null
          updated_at?: string
          vencimiento_licencia?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conductores_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos_viaje: {
        Row: {
          created_at: string
          estado_anterior: string | null
          estado_nuevo: string
          generado_por_perfil_id: string | null
          id: string
          notas: string | null
          viaje_id: string
        }
        Insert: {
          created_at?: string
          estado_anterior?: string | null
          estado_nuevo: string
          generado_por_perfil_id?: string | null
          id?: string
          notas?: string | null
          viaje_id: string
        }
        Update: {
          created_at?: string
          estado_anterior?: string | null
          estado_nuevo?: string
          generado_por_perfil_id?: string | null
          id?: string
          notas?: string | null
          viaje_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "eventos_viaje_generado_por_perfil_id_fkey"
            columns: ["generado_por_perfil_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_viaje_viaje_id_fkey"
            columns: ["viaje_id"]
            isOneToOne: false
            referencedRelation: "viajes"
            referencedColumns: ["id"]
          },
        ]
      }
      incidencias: {
        Row: {
          created_at: string
          descripcion: string
          estado: string
          id: string
          reportado_por_perfil_id: string | null
          severidad: string
          tipo: string
          updated_at: string
          viaje_id: string
        }
        Insert: {
          created_at?: string
          descripcion: string
          estado?: string
          id?: string
          reportado_por_perfil_id?: string | null
          severidad: string
          tipo: string
          updated_at?: string
          viaje_id: string
        }
        Update: {
          created_at?: string
          descripcion?: string
          estado?: string
          id?: string
          reportado_por_perfil_id?: string | null
          severidad?: string
          tipo?: string
          updated_at?: string
          viaje_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidencias_reportado_por_perfil_id_fkey"
            columns: ["reportado_por_perfil_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidencias_viaje_id_fkey"
            columns: ["viaje_id"]
            isOneToOne: false
            referencedRelation: "viajes"
            referencedColumns: ["id"]
          },
        ]
      }
      inspecciones: {
        Row: {
          conductor_id: string
          created_at: string
          estado_general: string
          id: string
          kilometraje: number
          observaciones: string | null
          vehiculo_id: string
          viaje_id: string | null
        }
        Insert: {
          conductor_id: string
          created_at?: string
          estado_general: string
          id?: string
          kilometraje: number
          observaciones?: string | null
          vehiculo_id: string
          viaje_id?: string | null
        }
        Update: {
          conductor_id?: string
          created_at?: string
          estado_general?: string
          id?: string
          kilometraje?: number
          observaciones?: string | null
          vehiculo_id?: string
          viaje_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspecciones_conductor_id_fkey"
            columns: ["conductor_id"]
            isOneToOne: false
            referencedRelation: "conductores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspecciones_vehiculo_id_fkey"
            columns: ["vehiculo_id"]
            isOneToOne: false
            referencedRelation: "vehiculos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspecciones_viaje_id_fkey"
            columns: ["viaje_id"]
            isOneToOne: false
            referencedRelation: "viajes"
            referencedColumns: ["id"]
          },
        ]
      }
      pasajeros: {
        Row: {
          centro_costo_id: string | null
          cliente_corporativo_id: string
          created_at: string
          direccion_defecto: string | null
          email: string | null
          estado: string
          id: string
          latitud_defecto: number | null
          longitud_defecto: number | null
          nombre_completo: string
          rut: string
          sede_id: string | null
          telefono: string | null
          updated_at: string
        }
        Insert: {
          centro_costo_id?: string | null
          cliente_corporativo_id: string
          created_at?: string
          direccion_defecto?: string | null
          email?: string | null
          estado?: string
          id?: string
          latitud_defecto?: number | null
          longitud_defecto?: number | null
          nombre_completo: string
          rut: string
          sede_id?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          centro_costo_id?: string | null
          cliente_corporativo_id?: string
          created_at?: string
          direccion_defecto?: string | null
          email?: string | null
          estado?: string
          id?: string
          latitud_defecto?: number | null
          longitud_defecto?: number | null
          nombre_completo?: string
          rut?: string
          sede_id?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pasajeros_centro_costo_id_fkey"
            columns: ["centro_costo_id"]
            isOneToOne: false
            referencedRelation: "centros_costo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pasajeros_cliente_corporativo_id_fkey"
            columns: ["cliente_corporativo_id"]
            isOneToOne: false
            referencedRelation: "clientes_corporativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pasajeros_sede_id_fkey"
            columns: ["sede_id"]
            isOneToOne: false
            referencedRelation: "sedes"
            referencedColumns: ["id"]
          },
        ]
      }
      perfiles: {
        Row: {
          auth_user_id: string | null
          created_at: string
          email: string
          estado: string
          id: string
          nombre_completo: string
          rol: string
          updated_at: string
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string
          email: string
          estado?: string
          id?: string
          nombre_completo: string
          rol: string
          updated_at?: string
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string
          email?: string
          estado?: string
          id?: string
          nombre_completo?: string
          rol?: string
          updated_at?: string
        }
        Relationships: []
      }
      sedes: {
        Row: {
          cliente_corporativo_id: string
          created_at: string
          direccion: string
          estado: string
          id: string
          latitud: number | null
          longitud: number | null
          nombre: string
          updated_at: string
        }
        Insert: {
          cliente_corporativo_id: string
          created_at?: string
          direccion: string
          estado?: string
          id?: string
          latitud?: number | null
          longitud?: number | null
          nombre: string
          updated_at?: string
        }
        Update: {
          cliente_corporativo_id?: string
          created_at?: string
          direccion?: string
          estado?: string
          id?: string
          latitud?: number | null
          longitud?: number | null
          nombre?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sedes_cliente_corporativo_id_fkey"
            columns: ["cliente_corporativo_id"]
            isOneToOne: false
            referencedRelation: "clientes_corporativos"
            referencedColumns: ["id"]
          },
        ]
      }
      tracking_positions: {
        Row: {
          conductor_id: string
          created_at: string
          id: string
          latitud: number
          longitud: number
          precision: number | null
          registrado_en: string
          velocidad: number | null
          viaje_id: string
        }
        Insert: {
          conductor_id: string
          created_at?: string
          id?: string
          latitud: number
          longitud: number
          precision?: number | null
          registrado_en: string
          velocidad?: number | null
          viaje_id: string
        }
        Update: {
          conductor_id?: string
          created_at?: string
          id?: string
          latitud?: number
          longitud?: number
          precision?: number | null
          registrado_en?: string
          velocidad?: number | null
          viaje_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracking_positions_conductor_id_fkey"
            columns: ["conductor_id"]
            isOneToOne: false
            referencedRelation: "conductores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracking_positions_viaje_id_fkey"
            columns: ["viaje_id"]
            isOneToOne: false
            referencedRelation: "viajes"
            referencedColumns: ["id"]
          },
        ]
      }
      tracking_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          pasajero_id: string | null
          revoked_at: string | null
          token_hash: string
          viaje_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          pasajero_id?: string | null
          revoked_at?: string | null
          token_hash: string
          viaje_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          pasajero_id?: string | null
          revoked_at?: string | null
          token_hash?: string
          viaje_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracking_tokens_pasajero_id_fkey"
            columns: ["pasajero_id"]
            isOneToOne: false
            referencedRelation: "pasajeros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracking_tokens_viaje_id_fkey"
            columns: ["viaje_id"]
            isOneToOne: false
            referencedRelation: "viajes"
            referencedColumns: ["id"]
          },
        ]
      }
      turnos_pasajeros: {
        Row: {
          cliente_corporativo_id: string
          created_at: string
          direccion_recogida: string
          estado: string
          fecha: string
          hora_entrada: string
          hora_salida: string
          id: string
          pasajero_id: string
          sede_id: string
          updated_at: string
        }
        Insert: {
          cliente_corporativo_id: string
          created_at?: string
          direccion_recogida: string
          estado?: string
          fecha: string
          hora_entrada: string
          hora_salida: string
          id?: string
          pasajero_id: string
          sede_id: string
          updated_at?: string
        }
        Update: {
          cliente_corporativo_id?: string
          created_at?: string
          direccion_recogida?: string
          estado?: string
          fecha?: string
          hora_entrada?: string
          hora_salida?: string
          id?: string
          pasajero_id?: string
          sede_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "turnos_pasajeros_cliente_corporativo_id_fkey"
            columns: ["cliente_corporativo_id"]
            isOneToOne: false
            referencedRelation: "clientes_corporativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turnos_pasajeros_pasajero_id_fkey"
            columns: ["pasajero_id"]
            isOneToOne: false
            referencedRelation: "pasajeros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turnos_pasajeros_sede_id_fkey"
            columns: ["sede_id"]
            isOneToOne: false
            referencedRelation: "sedes"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios_cliente_b2b: {
        Row: {
          cliente_corporativo_id: string
          created_at: string
          id: string
          perfil_id: string
        }
        Insert: {
          cliente_corporativo_id: string
          created_at?: string
          id?: string
          perfil_id: string
        }
        Update: {
          cliente_corporativo_id?: string
          created_at?: string
          id?: string
          perfil_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_cliente_b2b_cliente_corporativo_id_fkey"
            columns: ["cliente_corporativo_id"]
            isOneToOne: false
            referencedRelation: "clientes_corporativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usuarios_cliente_b2b_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehiculos: {
        Row: {
          anio: number
          capacidad: number
          color: string | null
          created_at: string
          estado: string
          id: string
          kilometraje: number | null
          marca: string
          modelo: string
          patente: string
          updated_at: string
        }
        Insert: {
          anio: number
          capacidad: number
          color?: string | null
          created_at?: string
          estado?: string
          id?: string
          kilometraje?: number | null
          marca: string
          modelo: string
          patente: string
          updated_at?: string
        }
        Update: {
          anio?: number
          capacidad?: number
          color?: string | null
          created_at?: string
          estado?: string
          id?: string
          kilometraje?: number | null
          marca?: string
          modelo?: string
          patente?: string
          updated_at?: string
        }
        Relationships: []
      }
      viaje_pasajeros: {
        Row: {
          created_at: string
          direccion_parada: string | null
          estado: string
          hora_abordaje: string | null
          id: string
          latitud_parada: number | null
          longitud_parada: number | null
          orden_parada: number | null
          pasajero_id: string
          updated_at: string
          viaje_id: string
        }
        Insert: {
          created_at?: string
          direccion_parada?: string | null
          estado?: string
          hora_abordaje?: string | null
          id?: string
          latitud_parada?: number | null
          longitud_parada?: number | null
          orden_parada?: number | null
          pasajero_id: string
          updated_at?: string
          viaje_id: string
        }
        Update: {
          created_at?: string
          direccion_parada?: string | null
          estado?: string
          hora_abordaje?: string | null
          id?: string
          latitud_parada?: number | null
          longitud_parada?: number | null
          orden_parada?: number | null
          pasajero_id?: string
          updated_at?: string
          viaje_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "viaje_pasajeros_pasajero_id_fkey"
            columns: ["pasajero_id"]
            isOneToOne: false
            referencedRelation: "pasajeros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "viaje_pasajeros_viaje_id_fkey"
            columns: ["viaje_id"]
            isOneToOne: false
            referencedRelation: "viajes"
            referencedColumns: ["id"]
          },
        ]
      }
      viajes: {
        Row: {
          cliente_corporativo_id: string
          created_at: string
          destino_direccion: string
          destino_lat: number | null
          destino_lng: number | null
          estado: string
          fecha_programada: string
          id: string
          observaciones: string | null
          origen_direccion: string
          origen_lat: number | null
          origen_lng: number | null
          sede_id: string | null
          tipo_viaje: string
          updated_at: string
        }
        Insert: {
          cliente_corporativo_id: string
          created_at?: string
          destino_direccion: string
          destino_lat?: number | null
          destino_lng?: number | null
          estado?: string
          fecha_programada: string
          id?: string
          observaciones?: string | null
          origen_direccion: string
          origen_lat?: number | null
          origen_lng?: number | null
          sede_id?: string | null
          tipo_viaje: string
          updated_at?: string
        }
        Update: {
          cliente_corporativo_id?: string
          created_at?: string
          destino_direccion?: string
          destino_lat?: number | null
          destino_lng?: number | null
          estado?: string
          fecha_programada?: string
          id?: string
          observaciones?: string | null
          origen_direccion?: string
          origen_lat?: number | null
          origen_lng?: number | null
          sede_id?: string | null
          tipo_viaje?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "viajes_cliente_corporativo_id_fkey"
            columns: ["cliente_corporativo_id"]
            isOneToOne: false
            referencedRelation: "clientes_corporativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "viajes_sede_id_fkey"
            columns: ["sede_id"]
            isOneToOne: false
            referencedRelation: "sedes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      board_passenger: {
        Args: { p_estado: string; p_pasajero_id: string; p_viaje_id: string }
        Returns: undefined
      }
      create_planned_trips: { Args: { p_rutas: Json }; Returns: Json }
      generate_tracking_token: {
        Args: { p_pasajero_id: string; p_viaje_id: string }
        Returns: string
      }
      get_admin_b2b_kpis: { Args: { p_cliente_id: string }; Returns: Json }
      get_admin_kpis: { Args: never; Returns: Json }
      get_auth_conductor_id: { Args: never; Returns: string }
      get_auth_perfil_id: { Args: never; Returns: string }
      get_auth_rol: { Args: never; Returns: string }
      get_b2b_cliente_id: { Args: never; Returns: string }
      get_b2b_kpis: { Args: never; Returns: Json }
      get_public_tracking_info: { Args: { p_raw_token: string }; Returns: Json }
      get_tracking_by_token: {
        Args: { p_token_hash: string }
        Returns: {
          latitud: number
          longitud: number
          registrado_en: string
          vehiculo_patente: string
          velocidad: number
          viaje_estado: string
        }[]
      }
      import_b2b_shifts: { Args: { p_shifts: Json }; Returns: Json }
      log_trip_event: {
        Args: {
          p_estado_anterior: string
          p_estado_nuevo: string
          p_notas?: string
          p_viaje_id: string
        }
        Returns: undefined
      }
      sync_gps_positions: {
        Args: { p_posiciones: Json; p_viaje_id: string }
        Returns: undefined
      }
      trip_arrive_pickup: { Args: { p_viaje_id: string }; Returns: undefined }
      trip_assign: {
        Args: {
          p_conductor_id: string
          p_vehiculo_id: string
          p_viaje_id: string
        }
        Returns: undefined
      }
      trip_cancel: {
        Args: { p_motivo: string; p_viaje_id: string }
        Returns: undefined
      }
      trip_dispatch: { Args: { p_viaje_id: string }; Returns: undefined }
      trip_finish: { Args: { p_viaje_id: string }; Returns: undefined }
      trip_start_boarding: { Args: { p_viaje_id: string }; Returns: undefined }
      trip_start_route: { Args: { p_viaje_id: string }; Returns: undefined }
      trip_start_to_pickup: { Args: { p_viaje_id: string }; Returns: undefined }
      update_my_profile: {
        Args: { p_nombre_completo: string; p_telefono?: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

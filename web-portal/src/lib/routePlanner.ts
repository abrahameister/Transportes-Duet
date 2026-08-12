export interface TurnoDemanda {
  id: string;
  cliente_corporativo_id: string;
  sede_id: string;
  pasajero_id: string;
  fecha: string;
  hora_entrada: string;
  hora_salida: string;
  direccion_recogida: string;
  pasajero: {
    nombre_completo: string;
    latitud_defecto?: number;
    longitud_defecto?: number;
    direccion_defecto?: string;
  };
}

export interface Vehiculo {
  id: string;
  capacidad: number;
  estado: string;
}

export interface Conductor {
  id: string;
  estado: string;
  nombre_completo: string;
}

export interface RutaPropuesta {
  id: string; // id temporal
  tipo_viaje: 'ida' | 'regreso';
  sede_id: string;
  fecha_programada: string;
  origen_direccion: string;
  destino_direccion: string;
  vehiculo_id: string;
  conductor_id: string;
  pasajeros: {
    turno_id: string;
    pasajero_id: string;
    orden: number;
    direccion: string;
    lat: number;
    lng: number;
    nombre: string;
  }[];
}

// Interfaz desacoplada para Geocoding
export interface Geocoder {
  geocode(address: string): Promise<{ lat: number; lng: number } | null>;
}

export class NominatimGeocoder implements Geocoder {
  async geocode(address: string): Promise<{ lat: number; lng: number } | null> {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
      const data = await response.json();
      if (data && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
      return null;
    } catch (e) {
      console.error('Geocoding error:', e);
      return null;
    }
  }
}

export class RoutePlanner {
  constructor(_geocoder: Geocoder) {}

  async plan(turnos: TurnoDemanda[], vehiculos: Vehiculo[], conductores: Conductor[]): Promise<RutaPropuesta[]> {
    const propuestas: RutaPropuesta[] = [];
    const vehiculosDisponibles = vehiculos.filter(v => v.estado === 'operativo').sort((a, b) => a.capacidad - b.capacidad);
    const conductoresDisponibles = conductores.filter(c => c.estado === 'activo');

    if (vehiculosDisponibles.length === 0 || conductoresDisponibles.length === 0) {
      throw new Error('No hay vehículos o conductores disponibles para planificar.');
    }

    // Agrupar por sede y fecha
    const groups: Record<string, TurnoDemanda[]> = {};
    for (const turno of turnos) {
      const key = `${turno.sede_id}_${turno.fecha}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(turno);
    }

    let pId = 1;

    for (const key in groups) {
      const groupTurnos = groups[key];
      const sede_id = groupTurnos[0].sede_id;
      const fecha = groupTurnos[0].fecha;

      // Generar IDAs (Agrupados por hora_entrada)
      const idas: Record<string, TurnoDemanda[]> = {};
      for (const t of groupTurnos) {
        if (!idas[t.hora_entrada]) idas[t.hora_entrada] = [];
        idas[t.hora_entrada].push(t);
      }

      for (const hora in idas) {
        const turnosIda = idas[hora];
        const chunks = this.chunkByCapacity(turnosIda, vehiculosDisponibles);
        for (const chunk of chunks) {
          propuestas.push(this.createRouteProposal(pId++, 'ida', sede_id, fecha, hora, chunk, vehiculosDisponibles, conductoresDisponibles));
        }
      }

      // Generar REGRESOs (Agrupados por hora_salida)
      const regresos: Record<string, TurnoDemanda[]> = {};
      for (const t of groupTurnos) {
        if (!regresos[t.hora_salida]) regresos[t.hora_salida] = [];
        regresos[t.hora_salida].push(t);
      }

      for (const hora in regresos) {
        const turnosRegreso = regresos[hora];
        const chunks = this.chunkByCapacity(turnosRegreso, vehiculosDisponibles);
        for (const chunk of chunks) {
          propuestas.push(this.createRouteProposal(pId++, 'regreso', sede_id, fecha, hora, chunk, vehiculosDisponibles, conductoresDisponibles));
        }
      }
    }

    return propuestas;
  }

  private chunkByCapacity(turnos: TurnoDemanda[], vehiculos: Vehiculo[]): TurnoDemanda[][] {
    const maxCapacity = vehiculos[vehiculos.length - 1].capacidad; // Largest vehicle
    const chunks: TurnoDemanda[][] = [];
    let currentChunk: TurnoDemanda[] = [];

    for (const turno of turnos) {
      if (currentChunk.length >= maxCapacity) {
        chunks.push(currentChunk);
        currentChunk = [];
      }
      currentChunk.push(turno);
    }
    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
    }
    return chunks;
  }

  private createRouteProposal(
    id: number,
    tipo: 'ida' | 'regreso',
    sede_id: string,
    fecha: string,
    hora: string,
    turnos: TurnoDemanda[],
    vehiculos: Vehiculo[],
    conductores: Conductor[]
  ): RutaPropuesta {
    // Buscar el vehículo más pequeño que soporte el grupo
    const reqPax = turnos.length;
    let selectedVehiculo = vehiculos[vehiculos.length - 1]; // Fallback to largest
    for (const v of vehiculos) {
      if (v.capacidad >= reqPax) {
        selectedVehiculo = v;
        break;
      }
    }
    // Seleccionar conductor simple
    const selectedConductor = conductores[id % conductores.length]; 

    // Aquí iría el geocoding básico y orden de ruta simple
    // Para simplificar, asignaremos lat/lng = 0 si no tienen y se marcará manual en UI si no hay.
    
    let orden = 1;
    const pasajerosList = turnos.map(t => {
      return {
        turno_id: t.id,
        pasajero_id: t.pasajero_id,
        orden: orden++,
        direccion: t.direccion_recogida || t.pasajero.direccion_defecto || 'Sin Dirección',
        lat: t.pasajero.latitud_defecto || 0,
        lng: t.pasajero.longitud_defecto || 0,
        nombre: t.pasajero.nombre_completo
      };
    });

    return {
      id: `propuesta-${id}`,
      tipo_viaje: tipo,
      sede_id,
      fecha_programada: `${fecha}T${hora}:00`,
      origen_direccion: tipo === 'ida' ? 'Múltiples Orígenes' : 'Sede Corporativa',
      destino_direccion: tipo === 'ida' ? 'Sede Corporativa' : 'Múltiples Destinos',
      vehiculo_id: selectedVehiculo.id,
      conductor_id: selectedConductor.id,
      pasajeros: tipo === 'regreso' ? pasajerosList.reverse() : pasajerosList // Regreso: deja pasajeros en orden inverso
    };
  }
}

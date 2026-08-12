import { describe, it, expect } from 'vitest';
import { RoutePlanner, type TurnoDemanda, type Vehiculo, type Conductor, type Geocoder } from './routePlanner';

class MockGeocoder implements Geocoder {
  async geocode(address: string) {
    if (address === 'Sin Dirección') return null;
    return { lat: 0, lng: 0 };
  }
}

describe('RoutePlanner', () => {
  const geocoder = new MockGeocoder();
  const planner = new RoutePlanner(geocoder);

  const vehiculos: Vehiculo[] = [
    { id: 'v1', capacidad: 4, estado: 'operativo' },
    { id: 'v2', capacidad: 19, estado: 'operativo' }
  ];

  const conductores: Conductor[] = [
    { id: 'c1', estado: 'activo', nombre_completo: 'Conductor A' }
  ];

  const baseTurno = (id: string, horaEntrada: string, horaSalida: string, sede: string): TurnoDemanda => ({
    id,
    cliente_corporativo_id: 'cliente1',
    sede_id: sede,
    pasajero_id: `pax_${id}`,
    fecha: '2026-08-12',
    hora_entrada: horaEntrada,
    hora_salida: horaSalida,
    direccion_recogida: `Direccion ${id}`,
    pasajero: {
      nombre_completo: `Pax ${id}`
    }
  });

  it('debe separar IDA y REGRESO en rutas distintas', async () => {
    const turnos = [
      baseTurno('1', '08:00', '17:00', 'sede1')
    ];
    
    const rutas = await planner.plan(turnos, vehiculos, conductores);
    
    expect(rutas).toHaveLength(2); // 1 Ida, 1 Regreso
    const ida = rutas.find(r => r.tipo_viaje === 'ida');
    const regreso = rutas.find(r => r.tipo_viaje === 'regreso');
    
    expect(ida).toBeDefined();
    expect(ida?.fecha_programada).toContain('08:00');
    expect(regreso).toBeDefined();
    expect(regreso?.fecha_programada).toContain('17:00');
  });

  it('debe agrupar por sede y fecha', async () => {
    const turnos = [
      baseTurno('1', '08:00', '17:00', 'sede1'),
      baseTurno('2', '08:00', '17:00', 'sede2')
    ];
    
    const rutas = await planner.plan(turnos, vehiculos, conductores);
    
    // 2 IDAs, 2 REGRESOs porque son sedes distintas
    expect(rutas).toHaveLength(4);
  });

  it('debe agrupar pasajeros con el mismo horario de entrada en una ruta de IDA (si caben)', async () => {
    const turnos = [
      baseTurno('1', '08:00', '17:00', 'sede1'),
      baseTurno('2', '08:00', '18:00', 'sede1') // Distinta salida, misma entrada
    ];
    
    const rutas = await planner.plan(turnos, vehiculos, conductores);
    
    const idas = rutas.filter(r => r.tipo_viaje === 'ida');
    expect(idas).toHaveLength(1);
    expect(idas[0].pasajeros).toHaveLength(2);

    const regresos = rutas.filter(r => r.tipo_viaje === 'regreso');
    expect(regresos).toHaveLength(2); // Horarios distintos
  });

  it('debe dividir grupos cuando exceden capacidad (4 pax max vehiculo chico, pero hay v2 de 19)', async () => {
    // Si tenemos un vehiculo de 4 y uno de 19, y pedimos 5, debe usar el de 19 en un solo chunk
    const turnos = Array.from({ length: 5 }).map((_, i) => baseTurno(`${i}`, '08:00', '17:00', 'sede1'));
    
    const rutas = await planner.plan(turnos, vehiculos, conductores);
    
    const idas = rutas.filter(r => r.tipo_viaje === 'ida');
    expect(idas).toHaveLength(1);
    expect(idas[0].pasajeros).toHaveLength(5);
    expect(idas[0].vehiculo_id).toBe('v2');
  });

  it('debe dividir grupos si exceden la capacidad máxima total de la flota', async () => {
    // Solo dejamos vehiculo 1 de capacidad 4
    const v1Solo = [vehiculos[0]];
    const turnos = Array.from({ length: 5 }).map((_, i) => baseTurno(`${i}`, '08:00', '17:00', 'sede1'));
    
    const rutas = await planner.plan(turnos, v1Solo, conductores);
    
    const idas = rutas.filter(r => r.tipo_viaje === 'ida');
    expect(idas).toHaveLength(2); // 4 pax en uno, 1 pax en el otro
    expect(idas[0].pasajeros).toHaveLength(4);
    expect(idas[1].pasajeros).toHaveLength(1);
  });
  
  it('falla si no hay vehiculos o conductores activos', async () => {
    const turnos = [baseTurno('1', '08:00', '17:00', 'sede1')];
    await expect(planner.plan(turnos, [], conductores)).rejects.toThrow();
    await expect(planner.plan(turnos, vehiculos, [])).rejects.toThrow();
  });
});

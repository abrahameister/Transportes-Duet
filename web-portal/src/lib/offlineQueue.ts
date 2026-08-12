import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { supabase } from './supabase';

export interface PendingAction {
  id?: number;
  type: 'trip_start_to_pickup' | 'trip_arrive_pickup' | 'trip_start_boarding' | 'trip_start_route' | 'trip_finish' | 'board_passenger';
  payload: any;
  status: 'pending' | 'error';
  error_msg?: string;
  created_at: number;
}

export interface GPSPoint {
  id?: number;
  viaje_id: string;
  lat: number;
  lng: number;
  spd: number | null;
  acc: number | null;
  ts: string;
}

interface DuetDB extends DBSchema {
  trips_cache: {
    key: string; // 'driver_trips'
    value: any;
  };
  pending_actions: {
    key: number;
    value: PendingAction;
    indexes: { 'by-status': string };
  };
  gps_queue: {
    key: number;
    value: GPSPoint;
  };
}

let dbPromise: Promise<IDBPDatabase<DuetDB>> | null = null;

export const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<DuetDB>('duet-offline-db', 1, {
      upgrade(db) {
        db.createObjectStore('trips_cache');
        const actionStore = db.createObjectStore('pending_actions', { keyPath: 'id', autoIncrement: true });
        actionStore.createIndex('by-status', 'status');
        db.createObjectStore('gps_queue', { keyPath: 'id', autoIncrement: true });
      }
    });
  }
  return dbPromise;
};

// ACTIONS QUEUE
export const queueAction = async (action: Omit<PendingAction, 'id' | 'status' | 'created_at'>) => {
  const db = await getDB();
  await db.add('pending_actions', {
    ...action,
    status: 'pending',
    created_at: Date.now()
  });
  // Intentar sincronizar de inmediato
  syncQueue().catch(console.error);
};

export const getPendingActions = async () => {
  const db = await getDB();
  return db.getAll('pending_actions');
};

export const syncQueue = async () => {
  if (!navigator.onLine) return;

  const db = await getDB();
  const tx = db.transaction('pending_actions', 'readwrite');
  const index = tx.store.index('by-status');
  const pending = await index.getAll('pending');

  // Procesar FIFO
  pending.sort((a, b) => a.created_at - b.created_at);

  for (const action of pending) {
    if (!action.id) continue;
    try {
      const { error } = await supabase.rpc(action.type, action.payload);
      
      if (error) {
        // Business error / RPC conflict -> Marcar error para no reintentar al infinito
        await db.put('pending_actions', { ...action, status: 'error', error_msg: error.message });
      } else {
        // Success -> Delete
        await db.delete('pending_actions', action.id);
      }
    } catch (err: any) {
      // Network failure during fetch -> keep pending, break queue
      console.warn('Network error during sync', err);
      break; 
    }
  }
  await tx.done;
};

// TRIPS CACHE
export const saveTripsCache = async (trips: any) => {
  const db = await getDB();
  await db.put('trips_cache', trips, 'driver_trips');
};

export const getTripsCache = async () => {
  const db = await getDB();
  return db.get('trips_cache', 'driver_trips');
};

// GPS QUEUE
export const enqueueGPS = async (point: Omit<GPSPoint, 'id'>) => {
  const db = await getDB();
  await db.add('gps_queue', point);
};

export const syncGPSQueue = async (viaje_id: string) => {
  if (!navigator.onLine) return;
  const db = await getDB();
  
  const tx = db.transaction('gps_queue', 'readwrite');
  const allPoints = await tx.store.getAll();
  const tripPoints = allPoints.filter(p => p.viaje_id === viaje_id);
  
  if (tripPoints.length === 0) return;

  // Lotes de 100 max
  const batch = tripPoints.slice(0, 100);
  
  try {
    const { error } = await supabase.rpc('sync_gps_positions', {
      p_viaje_id: viaje_id,
      p_posiciones: batch.map(p => ({
        lat: p.lat,
        lng: p.lng,
        spd: p.spd,
        acc: p.acc,
        ts: p.ts
      }))
    });

    if (error) {
      console.error('Error syncing GPS', error);
      // Si es un error de negocio (viaje cerrado), descartamos
      if (error.message.includes('No estás asignado') || error.message.includes('excede el límite')) {
         for (const p of batch) { if (p.id) await db.delete('gps_queue', p.id); }
      }
    } else {
      for (const p of batch) {
        if (p.id) await tx.store.delete(p.id);
      }
    }
  } catch (err) {
    console.warn('Network error syncing GPS', err);
  }
  await tx.done;
};

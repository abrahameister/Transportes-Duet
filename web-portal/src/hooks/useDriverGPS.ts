import { useEffect, useRef, useState } from 'react';
import { enqueueGPS, syncGPSQueue } from '../lib/offlineQueue';
import { supabase } from '../lib/supabase';

export function useDriverGPS(viajeId: string | null, isTripActive: boolean) {
  const [lastPosition, setLastPosition] = useState<{lat: number, lng: number} | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const watchId = useRef<number | null>(null);
  const wakeLock = useRef<any>(null);

  useEffect(() => {
    // Progressive enhancement: WakeLock
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock.current = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err: any) {
        console.warn('WakeLock no disponible:', err.message);
      }
    };
    
    const releaseWakeLock = () => {
      if (wakeLock.current) {
        wakeLock.current.release().catch(console.error);
        wakeLock.current = null;
      }
    };

    if (isTripActive) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }

    return () => releaseWakeLock();
  }, [isTripActive]);

  useEffect(() => {
    if (!isTripActive || !viajeId) {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
      return;
    }

    if (!('geolocation' in navigator)) {
      setGpsError('GPS no soportado en este dispositivo.');
      return;
    }

    let lastSyncTime = 0;

    watchId.current = navigator.geolocation.watchPosition(
      async (pos) => {
        setGpsError(null);
        setLastPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        
        const now = Date.now();
        // Solo registramos punto cada 15 segundos aprox para no saturar
        if (now - lastSyncTime > 15000) {
          lastSyncTime = now;
          await enqueueGPS({
            viaje_id: viajeId,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            spd: pos.coords.speed,
            acc: pos.coords.accuracy,
            ts: new Date().toISOString()
          });
          
          if (navigator.onLine) {
            syncGPSQueue(viajeId).catch(console.error);
          }
        }
      },
      (err) => {
        console.error('Error GPS', err);
        setGpsError(err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      }
    );

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
    };
  }, [isTripActive, viajeId]);

  return { lastPosition, gpsError };
}

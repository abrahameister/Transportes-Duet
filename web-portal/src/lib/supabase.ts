// ==============================================================================
// CLIENTE SUPABASE & MOTOR DE RESILIENCIA WFM (ONLINE / OFFLINE FALLBACK)
// ==============================================================================
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY no están definidas en el entorno.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 15,
    },
  },
});

/**
 * Verifica de forma ultrarazona si la conexión a Supabase está activa y configurada.
 * Utilizado por el motor WFM para conmutar al Caché Local frente a pérdidas temporales
 * de señal 4G/LTE en rutas rurales o subterráneos del Neira Transportes (Patrón Offline Fallback).
 */
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.rpc('get_auth_rol');
    if (error) {
      console.warn('⚠️ [Supabase] No fue posible verificar la conexión:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('📡 [Supabase] Sin conexión de red.', err);
    return false;
  }
}

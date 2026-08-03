// ==============================================================================
// CLIENTE SUPABASE & MOTOR DE RESILIENCIA WFM (ONLINE / OFFLINE FALLBACK)
// ==============================================================================
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vfhjwlnwuctuvqsxkmoz.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaGp3bG53dWN0dXZxc3hrbW96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3Njg2ODksImV4cCI6MjEwMTM0NDY4OX0.edMsBpLs4cpw2rN9IfeZ2gdYjp3CQ9xLG9DrdUoq-vE';

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
 * de señal 4G/LTE en rutas rurales o subterráneos del Biobío (Patrón Offline Fallback).
 */
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('empresas_tenants').select('id').limit(1);
    if (error) {
      console.warn('⚠️ [WFM Resilience] Aviso del motor Supabase:', error.message);
      return false;
    }
    console.log('✅ [WFM Resilience] Conexión productiva con Supabase verificada en vivo.');
    return true;
  } catch (err) {
    console.warn('📡 [WFM Resilience] Sin conexión de red (Offline Fallback activado).', err);
    return false;
  }
}

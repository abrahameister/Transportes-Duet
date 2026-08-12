import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Shield, MapPin, Clock, AlertTriangle, User, Car, Activity } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export const LiveTrackView: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchTracking = async () => {
      if (!token) {
        if (isMounted) {
          setError('Token no proporcionado.');
          setLoading(false);
        }
        return;
      }
      
      try {
        const { data: res, error: err } = await supabase.rpc('get_public_tracking_info', { p_raw_token: token });
        
        if (isMounted) {
          if (err) {
            console.error(err);
            setError('Enlace inválido, revocado o expirado.');
          } else if (!res) {
            setError('No hay información disponible.');
          } else {
            setData(res);
            setError(null);
          }
          setLoading(false);
        }
      } catch (e) {
        if (isMounted) {
          setError('Error de conexión.');
          setLoading(false);
        }
      }
    };

    fetchTracking();
    
    // Polling cada 15 segundos
    const interval = setInterval(fetchTracking, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center font-sans">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin shadow-lg" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 font-sans text-slate-800">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full text-center border border-slate-200">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold mb-2">Seguimiento no disponible</h2>
          <p className="text-slate-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const { viaje, conductor, vehiculo, tracking } = data;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans max-w-md mx-auto shadow-2xl overflow-hidden relative border-x border-slate-200">
      <header className="bg-slate-900 text-white p-5 flex items-center justify-between z-10 shadow-md rounded-b-3xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700">
             <Shield className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="font-bold text-white text-lg leading-tight tracking-tight">Neira Transportes</h1>
            <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-black">Seguimiento Seguro</p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-5 w-full flex flex-col gap-4 mt-2">
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-5">
           
           <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
               <Activity className="w-6 h-6 text-blue-600" />
             </div>
             <div>
               <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Estado del Viaje</p>
               <p className="font-black text-slate-800 text-lg capitalize">{viaje?.estado?.replace('_', ' ') || 'Desconocido'}</p>
               {viaje?.fecha_programada && (
                 <p className="text-xs text-slate-500 mt-0.5">Programado: {new Date(viaje.fecha_programada).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
               )}
             </div>
           </div>

           <hr className="border-slate-100" />

           <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
               <User className="w-6 h-6 text-indigo-600" />
             </div>
             <div>
               <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Conductor</p>
               <p className="font-bold text-slate-700 text-base">{conductor?.nombre || 'Pendiente'}</p>
             </div>
           </div>
           
           <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
               <Car className="w-6 h-6 text-emerald-600" />
             </div>
             <div>
               <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Vehículo</p>
               <p className="font-bold text-slate-700 text-base">
                 {vehiculo ? `${vehiculo.modelo} • ${vehiculo.patente}` : 'Pendiente'}
               </p>
             </div>
           </div>
           
           <hr className="border-slate-100" />

           <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
               <MapPin className="w-6 h-6 text-amber-600 animate-bounce" />
             </div>
             <div>
               <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Última Actualización GPS</p>
               <p className="font-bold text-slate-700 text-base">
                 {tracking?.ts ? new Date(tracking.ts).toLocaleTimeString() : 'Esperando señal...'}
               </p>
               <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                 <Clock className="w-3 h-3" /> Actualización automática en vivo
               </p>
             </div>
           </div>

        </div>
      </main>
      
      <footer className="text-center p-6 text-xs text-slate-400 font-medium">
        Enlace seguro. Caduca automáticamente.
      </footer>
    </div>
  );
};

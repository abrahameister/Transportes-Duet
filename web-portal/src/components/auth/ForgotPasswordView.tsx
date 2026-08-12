import React, { useState } from 'react';
import { Shield, Mail, ArrowRight, CheckCircle, RefreshCcw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';

export const ForgotPasswordView: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const brandName = 'Neira Transportes';

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password',
    });

    if (resetError) {
      setError('Hubo un problema al intentar enviar el correo. Revisa que esté bien escrito.');
    } else {
      setSuccessMsg('¡Te hemos enviado un correo seguro! Sigue las instrucciones allí para recuperar tu acceso.');
      setEmail('');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans text-slate-100">
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600 rounded-full mix-blend-screen filter blur-[100px] animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-emerald-500 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000"></div>
      </div>

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl mx-auto mb-6 flex items-center justify-center relative overflow-hidden">
            <Shield className="w-10 h-10 text-blue-500" />
            <div className="absolute inset-0 border border-white/10 rounded-2xl pointer-events-none"></div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            {brandName}
            <span className="text-[10px] bg-[#E8832A] text-slate-950 font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">WFM PRO</span>
          </h1>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500"></div>
          
          <h2 className="text-xl font-semibold mb-6 text-white text-center">
            Recuperar Contraseña
          </h2>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm flex gap-3 items-center">
              <CheckCircle className="w-5 h-5 shrink-0" />
              <p>{successMsg}</p>
            </div>
          )}

          <form onSubmit={handleForgot} className="space-y-5">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400 ml-1">Correo Electrónico</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  placeholder="usuario@ejemplo.com"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed mt-4"
            >
              {loading ? (
                <RefreshCcw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Enviar Correo de Recuperación
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
             <Link 
               to="/login"
               className="text-sm text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-2 mx-auto"
             >
               <ArrowRight className="w-4 h-4 rotate-180" />
               Volver al inicio de sesión
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Shield, Mail, Lock, ArrowRight, CheckCircle, RefreshCcw } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export const LoginView: React.FC = () => {
  const [mode, setMode] = useState<'signin' | 'forgot'>('signin');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [captchaVerified, setCaptchaVerified] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const logoUrl = null;
  const brandName = 'Neira Transportes';
  const headerText = 'Centro Operativo de Transporte • Neira Transportes';

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!captchaVerified) {
      setError('Por favor completa la validación de seguridad (Captcha).');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError('Credenciales inválidas. Verifica tu correo y contraseña.');
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!captchaVerified) {
      setError('Por favor completa la validación de seguridad (Captcha).');
      return;
    }

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
      
      {/* Fondo estético */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600 rounded-full mix-blend-screen filter blur-[100px] animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-emerald-500 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-1/2 w-96 h-96 bg-purple-600 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-4000"></div>
      </div>

      <div className="w-full max-w-md z-10">
        
        {/* Cabecera corporativa */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl mx-auto mb-6 flex items-center justify-center relative overflow-hidden">
            {logoUrl ? (
              <img src={logoUrl} alt={brandName} className="w-full h-full object-cover" />
            ) : (
              <Shield className="w-10 h-10 text-blue-500" />
            )}
            <div className="absolute inset-0 border border-white/10 rounded-2xl pointer-events-none"></div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            {brandName}
            <span className="text-[10px] bg-[#E8832A] text-slate-950 font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">WFM PRO</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {headerText}
          </p>
        </div>

        {/* Tarjeta de Autenticación */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500"></div>
          
          <h2 className="text-xl font-semibold mb-6 text-white text-center">
            {mode === 'signin' ? 'Acceso Seguro' : 'Recuperar Contraseña'}
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

          <form onSubmit={mode === 'signin' ? handleSignIn : handleForgot} className="space-y-5">
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

            {mode === 'signin' && (
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-medium text-slate-400 ml-1">Contraseña</label>
                  <button 
                    type="button"
                    onClick={() => { setMode('forgot'); setError(null); setSuccessMsg(null); }}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    ¿La olvidaste?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            )}

            {/* Simulación/Placeholder de Captcha (Turnstile o reCAPTCHA) */}
            <div className="mt-6 p-4 bg-slate-950/50 border border-slate-800 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className={`w-6 h-6 rounded-md border-2 flex items-center justify-center cursor-pointer transition-colors ${captchaVerified ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600 hover:border-slate-500'}`}
                  onClick={() => setCaptchaVerified(!captchaVerified)}
                >
                  {captchaVerified && <CheckCircle className="w-4 h-4 text-white" />}
                </div>
                <span className="text-sm text-slate-300">Soy humano</span>
              </div>
              <div className="flex flex-col items-end">
                <Shield className="w-5 h-5 text-slate-600 mb-0.5" />
                <span className="text-[9px] text-slate-500 uppercase tracking-wider">Seguridad WFM</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <RefreshCcw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {mode === 'signin' ? 'Iniciar Sesión' : 'Enviar Correo de Recuperación'}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {mode === 'forgot' && (
             <div className="mt-6 text-center">
               <button 
                 onClick={() => { setMode('signin'); setError(null); setSuccessMsg(null); }}
                 className="text-sm text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-2 mx-auto"
               >
                 <ArrowRight className="w-4 h-4 rotate-180" />
                 Volver al inicio de sesión
               </button>
             </div>
          )}
        </div>

        {/* Footer Seguro */}
        <div className="mt-8 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
          <p>© {new Date().getFullYear()} Neira Transportes. Todos los derechos reservados.</p>
          <div className="flex items-center gap-1 opacity-60">
            <Shield className="w-3 h-3" />
            <span>Sistema protegido por cifrado de grado militar</span>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Shield, Lock, ArrowRight, CheckCircle, RefreshCcw, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';

export const ResetPasswordView: React.FC = () => {
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [sessionReady, setSessionReady] = useState<boolean>(false);
  const [verifyingSession, setVerifyingSession] = useState<boolean>(true);
  
  const navigate = useNavigate();
  const brandName = 'Transportes Duet';

  useEffect(() => {
    let mounted = true;

    const establishRecoverySession = async () => {
      try {
        // 1. Revisar si hay error explícito en hash (#error=...) o search (?error=...)
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        const searchParams = new URLSearchParams(window.location.search);

        const errorDesc = hashParams.get('error_description') || searchParams.get('error_description');
        if (errorDesc) {
          if (mounted) {
            setError(`El enlace es inválido o ha expirado: ${decodeURIComponent(errorDesc).replace(/\+/g, ' ')}`);
            setVerifyingSession(false);
          }
          return;
        }

        // 2. Si viene PKCE code (?code=...), intercambiarlo por sesión
        const code = searchParams.get('code');
        if (code) {
          const { data: exchangeData, error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeErr) {
            console.warn('Error intercambiando código de recuperación:', exchangeErr.message);
          } else if (exchangeData?.session) {
            if (mounted) {
              setSessionReady(true);
              setVerifyingSession(false);
            }
            return;
          }
        }

        // 3. Si viene token en hash (#access_token=...&refresh_token=...)
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        if (accessToken && refreshToken) {
          const { data: setSessionData, error: setSessionErr } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          if (!setSessionErr && setSessionData?.session) {
            if (mounted) {
              setSessionReady(true);
              setVerifyingSession(false);
            }
            return;
          }
        }

        // 4. Verificar si ya existe sesión activa en memoria/localStorage
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          if (mounted) {
            setSessionReady(true);
            setVerifyingSession(false);
          }
          return;
        }

        // 5. Dar un margen de 2 segundos para que el listener detectSessionInUrl termine
        const timeout = setTimeout(async () => {
          if (!mounted) return;
          const { data: { session: delayedSession } } = await supabase.auth.getSession();
          if (delayedSession) {
            setSessionReady(true);
          } else {
            setError('No se detectó una sesión activa de recuperación. Es posible que el enlace haya expirado o ya haya sido utilizado.');
          }
          setVerifyingSession(false);
        }, 2000);

        return () => clearTimeout(timeout);
      } catch (err: any) {
        console.error('Error inicializando recuperación:', err);
        if (mounted) {
          setError('Ocurrió un problema verificando el enlace de recuperación.');
          setVerifyingSession(false);
        }
      }
    };

    // Escuchar eventos de autenticación de Supabase (PASSWORD_RECOVERY o SIGNED_IN)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (session && (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
        setSessionReady(true);
        setVerifyingSession(false);
        setError(null);
      }
    });

    establishRecoverySession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    
    setLoading(true);
    setError(null);

    // Asegurar que la sesión esté lista antes de llamar a updateUser
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setError('La sesión de recuperación ha expirado. Por favor solicita un nuevo correo de restablecimiento.');
      setLoading(false);
      setSessionReady(false);
      return;
    }

    const { error: resetError } = await supabase.auth.updateUser({
      password: password
    });

    if (resetError) {
      setError(resetError.message || 'Hubo un problema al actualizar la contraseña. Intenta nuevamente.');
    } else {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('perfiles').update({ estado: 'activo' }).eq('auth_user_id', user.id);
        }
      } catch (_) {}
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
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
          </h1>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500"></div>
          
          <h2 className="text-xl font-semibold mb-6 text-white text-center">
            Establecer Nueva Contraseña
          </h2>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          {success ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">¡Contraseña Actualizada!</h3>
              <p className="text-slate-400 text-sm">Redirigiendo al inicio de sesión...</p>
            </div>
          ) : verifyingSession ? (
            <div className="text-center py-8 space-y-3">
              <RefreshCcw className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
              <p className="text-sm text-slate-300 font-medium">Validando enlace de seguridad...</p>
              <p className="text-xs text-slate-500">Un momento mientras verificamos tus credenciales.</p>
            </div>
          ) : !sessionReady ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto text-amber-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-400">
                El enlace de recuperación ya no es válido o ha expirado.
              </p>
              <Link
                to="/forgot-password"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 px-4 rounded-xl text-xs shadow-lg transition-all inline-flex items-center justify-center gap-2"
              >
                Solicitar nuevo correo de recuperación
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-5">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400 ml-1">Nueva Contraseña</label>
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
                    minLength={6}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400 ml-1">Confirmar Contraseña</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                    placeholder="••••••••"
                    required
                    minLength={6}
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
                    Guardar y Continuar
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

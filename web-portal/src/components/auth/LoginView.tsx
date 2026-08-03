// ==============================================================================
// COMPONENTE CORPORATIVO DE AUTENTICACIÓN WFM — TRANSPORTES DUET
// ==============================================================================
// Gestiona Inicio de Sesión, Registro, Recuperación de Contraseña y Bypass de Demo
// con manejo visual y granular de errores UX en español chilenizado.
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../context/TenantContext';
import { Mail, Lock, AlertCircle, CheckCircle2, ArrowRight, ShieldCheck, KeyRound, Eye, EyeOff, Building2 } from 'lucide-react';

type AuthMode = 'signin' | 'forgot';

interface ErrorBannerState {
  type: 'no_account' | 'invalid_email' | 'wrong_password' | 'general' | 'success';
  title: string;
  message: string;
}

export const LoginView: React.FC = () => {
  const { loginDemoBypass, tenants, currentTenant } = useTenant();
  
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<ErrorBannerState | null>(null);

  // Validación de sintaxis de correo electrónico corporativo
  const isValidEmail = (correo: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(correo.trim());
  };

  const handleClearFeedback = () => setFeedback(null);

  // --- SUBMIT: MANEJO DE ERRORES INTELIGENTE Y GRANULAR ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    handleClearFeedback();

    // 1. VALIDACIÓN: Correo incorrecto o formato inválido
    if (!email || !isValidEmail(email)) {
      setFeedback({
        type: 'invalid_email',
        title: 'Correo Electrónico Inválido',
        message: 'El formato del correo corporativo es inválido o no está registrado en Transportes Duet. Verifica la ortografía y vuelve a intentar.'
      });
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signin') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });

        if (error) {
          const errMsg = error.message.toLowerCase();
          
          // 2. DETECCIÓN DE USUARIO SIN CUENTA VS CONTRASEÑA INCORRECTA
          // Si es un correo típico de prueba no registrado o rechazo por usuario inexistente
          if (errMsg.includes('user not found') || errMsg.includes('email not confirmed') || (errMsg.includes('invalid login credentials') && !email.includes('@andina.cl') && !email.includes('@sanatorioaleman.cl') && !email.includes('@duet'))) {
            setFeedback({
              type: 'no_account',
              title: 'Cuenta No Registrada o Sin Acceso WFM',
              message: 'No existe una cuenta activa asociada a este correo corporativo. Te invitamos a registrarte o utilizar el Acceso de Prueba Rápido al pie de la página.'
            });
          } else {
            // 3. DETECCIÓN DE CONTRASEÑA INCORRECTA
            setFeedback({
              type: 'wrong_password',
              title: 'Contraseña Incorrecta',
              message: 'La contraseña ingresada es incorrecta para esta cuenta WFM. Si no la recuerdas, presiona "¿Olvidaste tu contraseña?" más abajo para restablecerla al instante.'
            });
          }
        } else if (data.session) {
          // Sesión iniciada y sincronizada de forma automática con TenantContext
          console.log('✅ [WFM Auth] Autenticado exitosamente como:', data.session.user.email);
        }
      } else if (mode === 'forgot') {
        // 4. FLUJO PARA RECUPERACIÓN DE CONTRASEÑA
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/`,
        });

        if (error) {
          setFeedback({
            type: 'invalid_email',
            title: 'Error de Envío',
            message: 'No logramos despachar el correo de recuperación. Verifica que la dirección electrónica sea la correcta.'
          });
        } else {
          setFeedback({
            type: 'success',
            title: '¡Correo de Rescate Enviado!',
            message: 'Revisa tu bandeja de entrada o carpeta Spam. Encontrarás un enlace mágico y seguro para restablecer y elegir tu nueva contraseña WFM de Transportes Duet.'
          });
        }
      }
    } catch (err: any) {
      setFeedback({
        type: 'general',
        title: 'Error de Comunicación',
        message: err?.message || 'Ocurrió una interrupción al intentar comunicar con los servidores de Supabase.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Efecto de marca blanca
  const [visualTenant, setVisualTenant] = useState<any>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tenantParam = params.get('tenant');
    if (tenantParam) {
      const found = tenants.find(t => t.slug === tenantParam || t.id === tenantParam);
      if (found) {
        setVisualTenant(found);
      }
    }
  }, [tenants]);

  const activeVisual = visualTenant || currentTenant || null;
  const logoUrl = activeVisual?.logoUrl || null;
  const brandName = visualTenant ? activeVisual?.nombre : 'Transportes Duet';
  const headerText = visualTenant ? `Centro Operativo de Transporte • ${brandName}` : 'Plataforma de Movilidad Corporativa & Torre de Control Tráfico • Biobío';
  const primaryColor = activeVisual?.primaryColor || '#E8832A';

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans text-slate-100">
      {/* Fondo Arquitectura WFM (Gradients y Patrones) */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-[#0C121E] to-[#081828] z-0 pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-[#111827]/90 border border-[#212A38] rounded-2xl shadow-2xl p-6 sm:p-8 z-10 backdrop-blur-sm">
        {/* Cabecera Institucional */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-tr from-[#0F172A] via-[#1E293B] to-[#334155] rounded-2xl mx-auto flex items-center justify-center border border-[#334155] shadow-lg mb-3 overflow-hidden">
            {logoUrl ? (
              <img src={logoUrl} alt={brandName} className="w-full h-full object-cover" />
            ) : (
              <Building2 className="w-8 h-8 text-[#E8832A]" />
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            {brandName}
            {!visualTenant && <span className="text-[10px] bg-[#E8832A] text-slate-950 font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">WFM PRO</span>}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {headerText}
          </p>
        </div>

        {/* Banner de Errores o Confirmaciones */}
        {feedback && (
          <div className={`mb-5 p-3.5 rounded-xl border flex items-start space-x-3 text-xs shadow-inner animate-in fade-in duration-200 ${
            feedback.type === 'success' 
              ? 'bg-emerald-950/60 border-emerald-700/80 text-emerald-200' 
              : feedback.type === 'wrong_password'
              ? 'bg-red-950/60 border-red-700/80 text-red-200'
              : 'bg-amber-950/60 border-amber-700/80 text-amber-200'
          }`}>
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h4 className="font-bold text-white text-sm mb-0.5">{feedback.title}</h4>
              <p className="leading-relaxed opacity-95">{feedback.message}</p>
              
              {feedback.type === 'wrong_password' && mode === 'signin' && (
                <button
                  type="button"
                  onClick={() => { setMode('forgot'); setFeedback(null); }}
                  className="mt-2 text-[#E8832A] hover:underline font-bold flex items-center gap-1 text-xs"
                >
                  <KeyRound className="w-3.5 h-3.5" /> Ir a recuperar contraseña ahora ➔
                </button>
              )}
              {feedback.type === 'no_account' && mode === 'signin' && (
                <div className="mt-2 text-slate-300 text-xs italic">
                  ¿Es tu primera vez por aquí o necesitas acceso? Recuerda que las cuentas son exclusivas y administradas de forma centralizada por el área operativa. Habla directamente con el Oficial de Tráfico o Administrador WFM de tu empresa para solicitar tus credenciales.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pestañas de Navegación de Formulario */}
        <div className="grid grid-cols-2 gap-1 bg-[#090D14] p-1 rounded-xl mb-6 border border-[#1E293B]">
          <button
            type="button"
            onClick={() => { setMode('signin'); handleClearFeedback(); }}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              mode === 'signin' ? 'bg-[#1E293B] text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Ingresar
          </button>
          <button
            type="button"
            onClick={() => { setMode('forgot'); handleClearFeedback(); }}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              mode === 'forgot' ? 'bg-[#1E293B] text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Recuperar Clave
          </button>
        </div>

        {/* Formulario Principal */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Correo Electrónico Corporativo
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3.5 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ej: c.munoz@andina.cl o dr.barros@sanatorio.cl"
                required
                className="w-full bg-[#0B0F17] border border-[#2B374A] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#E8832A] focus:ring-1 focus:ring-[#E8832A] transition-colors"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Contraseña Institucional
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); handleClearFeedback(); }}
                    className="text-xs text-slate-400 hover:text-[#E8832A] transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3.5 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[#0B0F17] border border-[#2B374A] rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#E8832A] focus:ring-1 focus:ring-[#E8832A] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ backgroundImage: `linear-gradient(to right, ${primaryColor}, #b45309)` }}
            className="w-full py-3 text-slate-950 hover:brightness-110 font-bold text-sm rounded-xl shadow-lg hover:shadow-amber-900/20 transition-all flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <span>Procesando...</span>
            ) : mode === 'signin' ? (
              <><span>Ingresar a Torre WFM</span> <ArrowRight className="w-4 h-4" /></>
            ) : (
              <><span>Enviar Enlace de Rescate</span> <KeyRound className="w-4 h-4" /></>
            )}
          </button>
        </form>

        {/* Separador */}
        <div className="my-6 flex items-center">
          <div className="flex-1 border-t border-slate-800" />
          <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            o utiliza el bypass local
          </span>
          <div className="flex-1 border-t border-slate-800" />
        </div>

        <div className="bg-[#0f141e] border border-slate-700/50 p-4 rounded-xl mt-4">
          <div className="text-center mb-3 text-xs text-slate-400 font-medium">
            🛠️ Panel de Demostración & Eval (Entorno Local)
          </div>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => loginDemoBypass('admin@duet.cl', 'superadmin')}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-2"
            >
              👑 Simular Sesión: Admin Duet Solutions
            </button>
            <button
              type="button"
              onClick={() => loginDemoBypass('operaciones@transportesandina.cl', 'tenant_admin', tenants.find(t => t.slug === 'andina')?.id)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-2"
            >
              🏢 Simular Sesión: Tráfico Andina (Transportista)
            </button>
            <button
              type="button"
              onClick={() => loginDemoBypass('contratos@sanatorio.cl', 'cliente_b2b', tenants.find(t => t.slug === 'nexo')?.id)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-2"
            >
              🤝 Simular Sesión: Clínica Sanatorio Alemán (Cliente B2B)
            </button>
          </div>
        </div>
      </div>

      {/* Pie Institucional */}
      <footer className="mt-8 text-center text-xs text-slate-500 z-10 flex flex-col items-center gap-1">
        <span className="flex items-center gap-1">
          Creado con <span className="text-rose-500">♥</span> por <strong className="text-slate-300">Duet Solutions</strong>
        </span>
        <span className="text-[11px] text-slate-600 flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-500" /> Arquitectura Enterprise Tier-1 de Fuerza Laboral y Movilidad B2B
        </span>
      </footer>
    </div>
  );
};

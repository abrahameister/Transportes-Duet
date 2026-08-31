import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { AdminPortal } from './components/tenantadmin/AdminPortal';
import { ClientPortalB2B } from './components/b2b/ClientPortalB2B';
import { ConductorApp } from './components/conductor/ConductorApp';
import { LoginView } from './components/auth/LoginView';
import { ForgotPasswordView } from './components/auth/ForgotPasswordView';
import { ResetPasswordView } from './components/auth/ResetPasswordView';
import { LiveTrackView } from './components/pasajero/LiveTrackView';

// Error Boundary to prevent full application crash
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="w-16 h-16 bg-red-500/20 border border-red-500/50 rounded-2xl flex items-center justify-center mb-4 text-red-400 text-2xl font-bold">
            !
          </div>
          <h1 className="text-xl font-bold text-slate-100 mb-2">Error de Ejecución en la Plataforma</h1>
          <p className="text-xs text-slate-400 max-w-md mb-4">
            {this.state.error?.message || 'Ocurrió un error inesperado al renderizar este módulo.'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = '/login';
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-xs font-bold rounded-lg transition-all cursor-pointer"
            >
              Reiniciar Sesión
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg transition-all cursor-pointer text-slate-300"
            >
              Recargar Página
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Auth Guard: Only authenticated users can access children
const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { authUser, authLoading } = useApp();
  const location = useLocation();

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-4 font-sans">
        <div className="w-10 h-10 border-4 border-[#E8832A] border-t-transparent rounded-full animate-spin mb-4 shadow-lg" />
        <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Verificando Credenciales WFM...</p>
      </div>
    );
  }

  if (!authUser) {
    // Redirigir a login, guardando la ruta intentada
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// Role Guard: Routes based on role
const AppRouter = () => {
  const { currentRoleView, userRole } = useApp();
  let renderedView = null;

  if (currentRoleView === 'admin' && userRole === 'admin') {
    renderedView = <AdminPortal />;
  } else if (currentRoleView === 'cliente_b2b' && userRole === 'cliente_b2b') {
    renderedView = <ClientPortalB2B />;
  } else if (currentRoleView === 'app_conductor' && (userRole === 'admin' || userRole === 'app_conductor')) {
    renderedView = <ConductorApp />;
  } else {
    // Fallback de seguridad en caso de que intenten forzar una vista prohibida
    if (userRole === 'cliente_b2b') renderedView = <ClientPortalB2B />;
    else if (userRole === 'app_conductor') renderedView = <ConductorApp />;
    else renderedView = <AdminPortal />;
  }

  return renderedView;
};

// Application Layout with Navbar and Footer
const AppLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900 dark:bg-[#0D1117] dark:text-gray-200 font-sans">
      <Navbar />
      <main className="flex-1 pb-12">
        <AppRouter />
      </main>
      <footer className="border-t border-slate-200 dark:border-[#212A38] bg-white dark:bg-[#090C10] py-4 text-center text-xs text-slate-500 dark:text-gray-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300">Neira Transportes</span>
          <span>Plataforma de Transporte de Personal Chile ● v2.0.0</span>
        </div>
      </footer>
    </div>
  );
};

import { ToastProvider } from './components/ui/Toast';

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ToastProvider>
          <AppProvider>
            <Routes>
              {/* Rutas Públicas */}
              <Route path="/login" element={<LoginView />} />
              <Route path="/forgot-password" element={<ForgotPasswordView />} />
              <Route path="/reset-password" element={<ResetPasswordView />} />
              <Route path="/invite/accept" element={<ResetPasswordView />} />
              <Route path="/live-track/:token" element={<LiveTrackView />} />

              {/* Rutas Protegidas */}
              <Route path="/app/*" element={
                <AuthGuard>
                  <ErrorBoundary>
                    <AppLayout />
                  </ErrorBoundary>
                </AuthGuard>
              } />

              {/* Redirect Default */}
              <Route path="/" element={<Navigate to="/app" replace />} />
              <Route path="*" element={<Navigate to="/app" replace />} />
            </Routes>
          </AppProvider>
        </ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

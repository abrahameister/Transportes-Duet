import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { AdminPortal } from './components/tenantadmin/AdminPortal';
import { ClientPortalB2B } from './components/b2b/ClientPortalB2B';
import { PasajeroPWA } from './components/pasajero/PasajeroPWA';
import { ConductorApp } from './components/conductor/ConductorApp';
import { LoginView } from './components/auth/LoginView';

const MainRouter: React.FC = () => {
  const { currentRoleView, userRole, authUser, authLoading } = useApp();

  // Pantalla de carga al verificar sesión activa
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-4 font-sans">
        <div className="w-10 h-10 border-4 border-[#E8832A] border-t-transparent rounded-full animate-spin mb-4 shadow-lg" />
        <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Verificando Credenciales WFM...</p>
      </div>
    );
  }

  // COMPUERTA DE SEGURIDAD WFM (Auth Guard): Sin sesión activa se exhibe únicamente el Login
  if (!authUser) {
    return <LoginView />;
  }

  let renderedView = null;
  if (currentRoleView === 'admin' && userRole === 'admin') {
    renderedView = <AdminPortal />;
  } else if (currentRoleView === 'cliente_b2b' && userRole === 'cliente_b2b') {
    renderedView = <ClientPortalB2B />;
  } else if (currentRoleView === 'app_conductor' && (userRole === 'admin' || userRole === 'app_conductor')) {
    renderedView = <ConductorApp />;
  } else if (currentRoleView === 'pwa_pasajero') {
    renderedView = <PasajeroPWA />;
  } else {
    // Fallback de seguridad en caso de que intenten forzar una vista prohibida
    if (userRole === 'cliente_b2b') renderedView = <ClientPortalB2B />;
    else if (userRole === 'app_conductor') renderedView = <ConductorApp />;
    else renderedView = <AdminPortal />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900 dark:bg-[#0D1117] dark:text-gray-200">
      <Navbar />
      
      <main className="flex-1 pb-12">
        {renderedView}
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

export default function App() {
  return (
    <AppProvider>
      <MainRouter />
    </AppProvider>
  );
}

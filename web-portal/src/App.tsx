import { TenantProvider, useTenant } from './context/TenantContext';
import { Navbar } from './components/Navbar';
import { SuperAdminPortal } from './components/superadmin/SuperAdminPortal';
import { TenantAdminPortal } from './components/tenantadmin/TenantAdminPortal';
import { ClientPortalB2B } from './components/b2b/ClientPortalB2B';
import { PasajeroPWA } from './components/pasajero/PasajeroPWA';
import { ConductorApp } from './components/conductor/ConductorApp';
import { LoginView } from './components/auth/LoginView';

const MainRouter: React.FC = () => {
  const { currentRoleView, authUser, authLoading } = useTenant();

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

  const userRole = authUser.user_metadata?.rol || 'tenant_admin';

  let renderedView = null;
  if (currentRoleView === 'superadmin' && userRole === 'superadmin') {
    renderedView = <SuperAdminPortal />;
  } else if (currentRoleView === 'tenant_admin' && (userRole === 'superadmin' || userRole === 'tenant_admin')) {
    renderedView = <TenantAdminPortal />;
  } else if (currentRoleView === 'cliente_b2b' && userRole === 'cliente_b2b') {
    renderedView = <ClientPortalB2B />;
  } else if (currentRoleView === 'app_conductor' && (userRole === 'superadmin' || userRole === 'tenant_admin' || userRole === 'app_conductor')) {
    renderedView = <ConductorApp />;
  } else if (currentRoleView === 'pwa_pasajero') {
    renderedView = <PasajeroPWA />;
  } else {
    // Fallback de seguridad en caso de que intenten forzar una vista prohibida
    if (userRole === 'superadmin') renderedView = <SuperAdminPortal />;
    else if (userRole === 'cliente_b2b') renderedView = <ClientPortalB2B />;
    else if (userRole === 'app_conductor') renderedView = <ConductorApp />;
    else renderedView = <TenantAdminPortal />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900 dark:bg-[#0D1117] dark:text-gray-200">
      <Navbar />
      
      <main className="flex-1 pb-12">
        {renderedView}
      </main>

      <footer className="border-t border-slate-200 dark:border-[#212A38] bg-white dark:bg-[#090C10] py-4 text-center text-xs text-slate-500 dark:text-gray-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="flex items-center gap-1">Creado con <span className="text-rose-500">♥</span> por <a href="https://www.duetsolutions.cl/" target="_blank" rel="noopener noreferrer" className="font-bold text-slate-700 dark:text-slate-300 hover:text-[#E8832A] dark:hover:text-[#E8832A] hover:underline transition-colors">Duet Solutions</a></span>
          <span>Plataforma de Transporte de Personal Chile ● v1.0.0</span>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <TenantProvider>
      <MainRouter />
    </TenantProvider>
  );
}

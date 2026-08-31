import React from 'react';
import { useApp } from '../context/AppContext';
import { Shield, Building2, Briefcase, RefreshCw, Sun, Moon, Navigation, LogOut } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { userRole, currentRoleView, setCurrentRoleView, isDarkMode, toggleDarkMode, authUser, logoutAuth, clientes, activeClienteB2BId, setActiveClienteB2BId } = useApp();

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-[#0D1117]/95 backdrop-blur-sm border-b border-slate-200 dark:border-[#212A38]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          
          {/* 1. Lo Esencial: Logo y Tenant Activo */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded bg-slate-100 dark:bg-[#161D27] border border-slate-200 dark:border-[#212A38] flex items-center justify-center overflow-hidden shrink-0">
              <Building2 className="w-4 h-4 text-[#1E3A8A] dark:text-[#3B82F6]" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-slate-900 dark:text-gray-100 tracking-tight">
              {currentRoleView === 'cliente_b2b' ? 'Portal Empresas Contratantes' : currentRoleView === 'app_conductor' ? 'Terminal Conductor' : 'Neira Transportes'}
              </span>
            </div>
          </div>

          {/* 2. Módulo Activo (Navegación de producto seria y estructurada) */}
          <nav className="hidden md:flex items-center space-x-1">
            {userRole === 'superadmin' && (
              <button
                onClick={() => setCurrentRoleView('admin')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  currentRoleView === 'admin'
                    ? 'bg-slate-100 dark:bg-[#161D27] text-slate-900 dark:text-white font-semibold border border-slate-200 dark:border-[#212A38]'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-gray-200 hover:bg-slate-100 dark:hover:bg-[#161D27]/50'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                <span>1. Administración General</span>
              </button>
            )}

            {(userRole === 'admin') && (
              <button
                onClick={() => setCurrentRoleView('admin')}
                style={currentRoleView === 'admin' ? { backgroundColor: 'var(--tenant-primary)', color: '#FFFFFF' } : {}}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  currentRoleView === 'admin'
                    ? 'text-white font-semibold shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-gray-200 hover:bg-slate-100 dark:hover:bg-[#161D27]/50'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Centro Operativo</span>
              </button>
            )}

            {userRole === 'cliente_b2b' && (
              <button
                onClick={() => setCurrentRoleView('cliente_b2b')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  currentRoleView === 'cliente_b2b'
                    ? 'bg-slate-100 dark:bg-[#161D27] text-slate-900 dark:text-white font-semibold border border-slate-200 dark:border-[#212A38]'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-gray-200 hover:bg-slate-100 dark:hover:bg-[#161D27]/50'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Portal Empresas</span>
              </button>
            )}

            {(userRole === 'admin' || userRole === 'app_conductor') && (
              <button
                onClick={() => setCurrentRoleView('app_conductor')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  currentRoleView === 'app_conductor'
                    ? 'bg-slate-100 dark:bg-[#161D27] text-slate-900 dark:text-white font-semibold border border-slate-200 dark:border-[#212A38]'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-gray-200 hover:bg-slate-100 dark:hover:bg-[#161D27]/50'
                }`}
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>App Conductor</span>
              </button>
            )}
          </nav>

          {/* 3. Acción Principal & Selector de Entidades según Rol */}
          <div className="flex items-center space-x-2.5">
            
            {/* El selector de Empresas Transportistas ha sido eliminado por migración a Single-Tenant */}

            {/* Selector de Clientes Corporativos B2B sólo para Empresa Transportista (Tenant Admin) */}
            {userRole === 'admin' && (
              <select
                value={activeClienteB2BId || ''}
                onChange={(e) => setActiveClienteB2BId(e.target.value)}
                title="Seleccionar Contrato y Nómina de Cliente B2B"
                className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-md px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 focus:outline-none focus:border-emerald-500 cursor-pointer shadow-2xs"
              >
                <option value="" disabled>Seleccione Cliente</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id} className="bg-white dark:bg-[#0D1117] text-slate-900 dark:text-gray-200">
                    🤝 {c.nombreCorporativo.split(' ')[0]} {c.nombreCorporativo.split(' ')[1] || ''}
                  </option>
                ))}
              </select>
            )}
            {/* Si es cliente_b2b o app_conductor, el selector no se muestra */}

            <button
              onClick={toggleDarkMode}
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-gray-200 bg-slate-100 dark:bg-[#161D27] hover:bg-slate-200 dark:hover:bg-[#212A38] border border-slate-200 dark:border-[#212A38] rounded-md transition-colors"
              title={isDarkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            >
              {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => window.location.reload()}
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-gray-200 bg-slate-100 dark:bg-[#161D27] hover:bg-slate-200 dark:hover:bg-[#212A38] border border-slate-200 dark:border-[#212A38] rounded-md transition-colors"
              title="Recargar Datos"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            {authUser && (
              <button
                onClick={logoutAuth}
                className="flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800/60 rounded-md transition-colors ml-1"
                title={`Conectado como: ${authUser.email || 'Operador WFM'}. Presiona para cerrar sesión WFM.`}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};

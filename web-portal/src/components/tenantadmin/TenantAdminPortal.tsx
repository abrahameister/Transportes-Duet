import React, { useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import { getWFMStats } from '../../lib/mockData';
import { TorreControlView } from './TorreControlView';
import { ProgramacionServiciosView } from './ProgramacionServiciosView';
import { IncidenciasAlertasView } from './IncidenciasAlertasView';
import { ClientesTarifacionView } from './ClientesTarifacionView';
import { RecursosWFMView } from './RecursosWFMView';
import { Radio, Calendar, AlertTriangle, Building2, Users, Car, CheckCircle, Upload, Plus } from 'lucide-react';

export const TenantAdminPortal: React.FC = () => {
  const { currentTenant, conductores, vehiculos, viajes } = useTenant();
  const [activeEje, setActiveEje] = useState<'torre' | 'conductores' | 'vehiculos' | 'programacion' | 'incidencias' | 'clientes' | 'recursos'>('torre');
  
  const stats = getWFMStats(currentTenant.id, conductores, viajes);
  const vehiculosCount = vehiculos.filter(v => v.empresaId === currentTenant.id || currentTenant.id === '10000000-0000-0000-0000-000000000001').length;
  const conductoresCount = stats.totalConductores;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top info badges and quick buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-[#212A38]">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-[#161D27] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
            Operación Hoy: Vie 31 Jul 2026
          </span>
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shadow-2xs">
            <CheckCircle className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
            Planificación Próx. Turno: Lun 03 Ago 2026
          </span>
        </div>
        <div className="flex items-center space-x-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setActiveEje('programacion')}
            className="px-3.5 py-1.5 rounded-md text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#161D27] border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-[#212A38] transition-colors inline-flex items-center shadow-2xs cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
            Cargar Horarios & Turnos B2B
          </button>
          <button
            type="button"
            onClick={() => setActiveEje('programacion')}
            className="px-3.5 py-1.5 rounded-md text-xs font-semibold bg-[#0F172A] hover:bg-slate-800 text-white transition-colors inline-flex items-center shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Servicio Manual
          </button>
        </div>
      </div>

      {/* Encabezado del Módulo y Tarjeta de Marca del Tenant */}
      <div className="enterprise-card p-6 border-l-4 shadow-sm bg-white dark:bg-[#161D27]" style={{ borderLeftColor: currentTenant.primaryColor }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              <span>Módulo 2: Centro Operativo & Despacho</span>
              <span>●</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center">
                <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                Sistema Conectado en Vivo
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">
              {currentTenant.nombre}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Control centralizado de flota, telemetría en tiempo real, programación de rutas e incidencias en ruta.
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs shrink-0">
            <span className="bg-slate-100 dark:bg-[#0D1117] border border-slate-200 dark:border-[#212A38] px-3.5 py-2 rounded-md text-slate-700 dark:text-gray-300 font-medium shadow-2xs">
              Plan: <strong className="text-slate-900 dark:text-white">Pro Operativo</strong>
            </span>
          </div>
        </div>

        {/* MENÚ DE DE EJES OPERATIVOS Y NAVEGACIÓN ENTERPRISE */}
        <div className="flex flex-wrap items-center gap-1.5 mt-6 border-b border-slate-200 dark:border-[#212A38] pt-2">
          <button
            onClick={() => setActiveEje('torre')}
            style={activeEje === 'torre' ? { backgroundColor: 'var(--tenant-primary)', color: '#ffffff' } : {}}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-all flex items-center space-x-1.5 border-t border-x ${
              activeEje === 'torre'
                ? 'bg-[#0F172A] text-white border-slate-300 dark:border-[#212A38] shadow-sm'
                : 'text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-[#0D1117] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5 mr-1" />
            <span>Torre de Control</span>
          </button>
          <button
            onClick={() => setActiveEje('conductores')}
            style={activeEje === 'conductores' ? { backgroundColor: 'var(--tenant-primary)', color: '#ffffff' } : {}}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-all flex items-center space-x-1.5 border-t border-x ${
              activeEje === 'conductores'
                ? 'bg-[#0F172A] text-white border-slate-300 dark:border-[#212A38] shadow-sm'
                : 'text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-[#0D1117] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5 mr-1" />
            <span>Conductores ({conductoresCount})</span>
          </button>
          <button
            onClick={() => setActiveEje('vehiculos')}
            style={activeEje === 'vehiculos' ? { backgroundColor: 'var(--tenant-primary)', color: '#ffffff' } : {}}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-all flex items-center space-x-1.5 border-t border-x ${
              activeEje === 'vehiculos'
                ? 'bg-[#0F172A] text-white border-slate-300 dark:border-[#212A38] shadow-sm'
                : 'text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-[#0D1117] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Car className="w-3.5 h-3.5 mr-1" />
            <span>Vehículos ({vehiculosCount})</span>
          </button>
          <button
            onClick={() => setActiveEje('incidencias')}
            style={activeEje === 'incidencias' ? { backgroundColor: 'var(--tenant-primary)', color: '#ffffff' } : {}}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-all flex items-center space-x-1.5 border-t border-x ${
              activeEje === 'incidencias'
                ? 'bg-[#0F172A] text-white border-slate-300 dark:border-[#212A38] shadow-sm'
                : 'text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-[#0D1117] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <AlertTriangle className={`w-3.5 h-3.5 mr-1 ${stats.alertasActivas > 0 ? 'text-red-400 animate-bounce' : ''}`} />
            <span>Incidencias ({stats.alertasActivas})</span>
          </button>
          <button
            onClick={() => setActiveEje('clientes')}
            style={activeEje === 'clientes' ? { backgroundColor: 'var(--tenant-primary)', color: '#ffffff' } : {}}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-all flex items-center space-x-1.5 border-t border-x ${
              activeEje === 'clientes'
                ? 'bg-[#0F172A] text-white border-slate-300 dark:border-[#212A38] shadow-sm'
                : 'text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-[#0D1117] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 mr-1" />
            <span>Tarifario B2B</span>
          </button>
          <button
            onClick={() => setActiveEje('programacion')}
            style={activeEje === 'programacion' ? { backgroundColor: 'var(--tenant-primary)', color: '#ffffff' } : {}}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-all flex items-center space-x-1.5 border-t border-x ${
              activeEje === 'programacion'
                ? 'bg-[#0F172A] text-white border-slate-300 dark:border-[#212A38] shadow-sm'
                : 'text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-[#0D1117] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 mr-1 text-amber-500" />
            <span>Turnos &amp; Programación</span>
          </button>
        </div>
      </div>

      {/* Tarjetas KPI Analíticas Superiores (Estandarización de 4 Capas) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="enterprise-card p-3.5 border-l-2 border-emerald-500">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase">UNIDADES EN TURNO</div>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-bold text-slate-900 dark:text-white font-mono">{stats.conductoresDisponibles}</span>
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">● Disponibles para despacho</span>
          </div>
        </div>

        <div className="enterprise-card p-3.5 border-l-2 border-blue-500">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase">EN TRANSITO / RUTA</div>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-bold text-slate-900 dark:text-white font-mono">{stats.conductoresEnRuta}</span>
            <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">Servicios en curso</span>
          </div>
        </div>

        <div className="enterprise-card p-3.5 border-l-2 border-slate-400">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase">DESCANSO / OFFLINE</div>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-bold text-slate-700 dark:text-gray-300 font-mono">{stats.conductoresOffline}</span>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Fuera de turno WFM</span>
          </div>
        </div>

        <div className="enterprise-card p-3.5 border-l-2 border-red-500">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase">EXCEPCIONES ACTIVAS</div>
          <div className="flex items-baseline space-x-2">
            <span className={`text-xl font-bold font-mono ${stats.alertasActivas > 0 ? 'text-red-600 dark:text-red-400 animate-pulse' : 'text-slate-900 dark:text-white'}`}>
              {stats.alertasActivas}
            </span>
            <span className="text-[11px] font-semibold text-red-600 dark:text-red-400">
              {stats.alertasActivas > 0 ? '¡Requieren Atención!' : 'Flota nominal'}
            </span>
          </div>
        </div>
      </div>

      {/* CONTENEDOR MAESTRO DINÁMICO POR EJE OPERATIVO */}
      <div className="pt-2 transition-all">
        {activeEje === 'torre' && <TorreControlView />}
        {activeEje === 'conductores' && <RecursosWFMView initialTab="conductores" />}
        {activeEje === 'vehiculos' && <RecursosWFMView initialTab="flota" />}
        {activeEje === 'programacion' && <ProgramacionServiciosView />}
        {activeEje === 'recursos' && <RecursosWFMView />}
        {activeEje === 'clientes' && <ClientesTarifacionView />}
        {activeEje === 'incidencias' && <IncidenciasAlertasView />}
      </div>
    </div>
  );
};

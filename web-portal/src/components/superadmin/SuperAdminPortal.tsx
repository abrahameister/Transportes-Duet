import React, { useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import type { EmpresaTenant } from '../../types';
import { Check, Plus, Sliders, ExternalLink, ArrowRight, Activity, Building2, AlertCircle, ShieldCheck, ArrowLeft } from 'lucide-react';

const PRESET_PALETTES = [
  { name: 'Azul Marino Corporativo', primary: '#1A365D', secondary: '#2B4C7E' },
  { name: 'Verde Bosque Sobrio', primary: '#0A3A2A', secondary: '#165B42' },
  { name: 'Gris Pizarra Ejecutivo', primary: '#27272A', secondary: '#3F3F46' },
  { name: 'Azul Acero Técnico', primary: '#1E40AF', secondary: '#3B82F6' },
];

export const SuperAdminPortal: React.FC = () => {
  const { tenants, currentTenant, updateTenantBranding, addNewTenant, selectTenant, setCurrentRoleView } = useTenant();
  const [editingTenant, setEditingTenant] = useState<EmpresaTenant>(currentTenant);
  const [showNewModal, setShowNewModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState(false);

  // Formulario Asistente (Wizard de 2 pasos directo a revisión - Nexo Mobility Platform)
  const [wizardStep, setWizardStep] = useState<1 | 2>(1);
  const [formError, setFormError] = useState<string | null>(null);

  const [newNombre, setNewNombre] = useState('Transportes Cordillera Austral');
  const [newRazonSocial, setNewRazonSocial] = useState('Transportes y Logística Cordillera Austral SpA');
  const [newRut, setNewRut] = useState('77.491.330-1');
  const [newPais, setNewPais] = useState('Chile');
  const [newZonaHoraria, setNewZonaHoraria] = useState('America/Santiago (UTC-4)');
  const [newMoneda, setNewMoneda] = useState('CLP ($ Peso Chileno)');
  const [newContacto, setNewContacto] = useState('Marcos Vergara');
  const [newEmail, setNewEmail] = useState('mvergara@cordilleraaustral.cl');
  const [newTelefono, setNewTelefono] = useState('+56 9 8111 2233');

  const handleEditSelect = (t: EmpresaTenant) => {
    setEditingTenant(t);
    selectTenant(t.id);
  };

  const handleApplyPalette = (prim: string, sec: string) => {
    const updated = { ...editingTenant, primaryColor: prim, secondaryColor: sec };
    setEditingTenant(updated);
    updateTenantBranding(updated.id, { primaryColor: prim, secondaryColor: sec });
  };

  const handleSaveBranding = (e: React.FormEvent) => {
    e.preventDefault();
    updateTenantBranding(editingTenant.id, editingTenant);
    setSaveStatus(true);
    setTimeout(() => setSaveStatus(false), 2500);
  };

  const handleOpenWizard = () => {
    setWizardStep(1);
    setFormError(null);
    setShowNewModal(true);
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNombre || !newRut || !newPais || !newZonaHoraria || !newMoneda || !newContacto || !newEmail || !newTelefono) {
      setFormError('Todos los campos marcados como obligatorios (*) deben estar completos.');
      return;
    }
    // Validación estricta de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      setFormError('El formato del Email del Contacto no es válido (ej: nombre@empresa.cl).');
      return;
    }
    // Validación estricta de teléfono chileno / internacional
    const digits = newTelefono.replace(/[^0-9]/g, '');
    if (digits.length < 8) {
      setFormError('El Teléfono debe contener al menos 8 dígitos válidos en Chile (ej. +56 9 8111 2233).');
      return;
    }
    setFormError(null);
    setWizardStep(2);
  };

  const handleCreateTenant = () => {
    const slug = newNombre.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || `tenant-${Date.now()}`;
    const created: EmpresaTenant = {
      id: `tenant-${Date.now()}`,
      nombre: newNombre,
      slug: slug,
      logoUrl: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=150&q=80',
      primaryColor: '#0F172A',
      secondaryColor: '#1E293B',
      accentColor: '#E8832A', // Naranja requerido
      estadoPago: 'al_dia',
      planSuscripto: 'Plan Pro Exclusivo',
      totalConductores: 0,
      totalVehiculos: 0,
      razonSocial: newRazonSocial,
      rut: newRut,
      paisOperacion: newPais,
      zonaHoraria: newZonaHoraria,
      moneda: newMoneda,
      contactoPrincipal: newContacto,
      contactoEmail: newEmail,
      contactoTelefono: newTelefono,
    };
    addNewTenant(created);
    setEditingTenant(created);
    setShowNewModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header Block: NEXO MOBILITY PLATFORM (Image 2 replica) */}
      <div className="enterprise-card p-6 bg-white dark:bg-[#161D27] border border-slate-200 dark:border-[#212A38] shadow-xs">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
              NEXO MOBILITY PLATFORM • CENTRO DE CONTROL WHITE-LABEL
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Dashboard Global de Tenants y Servicios
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-3xl">
              Superficie propietaria para provisión, gobierno y asistencia de las empresas transportistas del Biobío y Chile.
            </p>
          </div>
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={handleOpenWizard}
              className="px-5 py-2.5 rounded-lg bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold shadow-md transition-all flex items-center"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              <span>+ Crear Empresa Transportista</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top Metric Cards Grid (10-card layout) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 my-6">
        {/* Card 1 */}
        <div className="enterprise-card p-4 bg-white dark:bg-[#161D27] border border-slate-200 dark:border-[#212A38] shadow-2xs flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Empresas Activas</div>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1.5">2</div>
          </div>
          <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center">
            ● 100% de SLA cumplido
          </div>
        </div>

        {/* Card 2 */}
        <div className="enterprise-card p-4 bg-white dark:bg-[#161D27] border border-slate-200 dark:border-[#212A38] shadow-2xs flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">En Onboarding</div>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1.5">1</div>
          </div>
          <div className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center">
            ● 65% progreso medio
          </div>
        </div>

        {/* Card 3 */}
        <div className="enterprise-card p-4 bg-white dark:bg-[#161D27] border border-slate-200 dark:border-[#212A38] shadow-2xs flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Demos Activas</div>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1.5">2</div>
          </div>
          <div className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center">
            ● 1 próxima a expirar
          </div>
        </div>

        {/* Card 4 */}
        <div className="enterprise-card p-4 bg-white dark:bg-[#161D27] border border-slate-200 dark:border-[#212A38] shadow-2xs flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Suspendidas</div>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1.5">1</div>
          </div>
          <div className="text-[11px] font-semibold text-red-600 dark:text-red-400 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center">
            ● Pruebas finalizadas
          </div>
        </div>

        {/* Card 5 */}
        <div className="enterprise-card p-4 bg-white dark:bg-[#161D27] border border-slate-200 dark:border-[#212A38] shadow-2xs flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Servicios Mes</div>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1.5">4,965</div>
          </div>
          <div className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center">
            ↗ +14% vs. mes anterior
          </div>
        </div>

        {/* Card 6 */}
        <div className="enterprise-card p-4 bg-white dark:bg-[#161D27] border border-slate-200 dark:border-[#212A38] shadow-2xs flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Usuarios Activos</div>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1.5">1,840</div>
          </div>
          <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center">
            ● 26 corporativos
          </div>
        </div>

        {/* Card 7 */}
        <div className="enterprise-card p-4 bg-white dark:bg-[#161D27] border border-slate-200 dark:border-[#212A38] shadow-2xs flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Incidencias Abiertas</div>
            <div className="text-2xl font-bold font-mono text-red-600 dark:text-red-400 mt-1.5">2</div>
          </div>
          <div className="text-[11px] font-semibold text-red-600 dark:text-red-400 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center">
            ● 1 menor en Geocoder
          </div>
        </div>

        {/* Card 8 */}
        <div className="enterprise-card p-4 bg-white dark:bg-[#161D27] border border-slate-200 dark:border-[#212A38] shadow-2xs flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Soporte Pendiente</div>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1.5">2</div>
          </div>
          <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center">
            ● 2 alta prioridad
          </div>
        </div>

        {/* Card 9 */}
        <div className="enterprise-card p-4 bg-white dark:bg-[#161D27] border border-slate-200 dark:border-[#212A38] shadow-2xs flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Dominios con Alerta</div>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1.5">1</div>
          </div>
          <div className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center">
            🌐 DNS CNAME enmascarado
          </div>
        </div>

        {/* Card 10 */}
        <div className="enterprise-card p-4 bg-white dark:bg-[#161D27] border border-slate-200 dark:border-[#212A38] shadow-2xs flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Salud Plataforma</div>
            <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1.5">98.4%</div>
          </div>
          <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center">
            ● Uptime 99.98% mensual
          </div>
        </div>
      </div>

      {/* Split View: Atención de Empresas & Estado de Servicios */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Left Column (lg:col-span-2) */}
        <div className="lg:col-span-2 enterprise-card p-5 bg-white dark:bg-[#161D27] border border-slate-200 dark:border-[#212A38] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#212A38]">
            <div className="flex items-center space-x-2">
              <span className="text-base">⚠️</span>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                1. Empresas que requieren atención
              </h2>
            </div>
            <a href="#directorio-empresas" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center">
              <span>Ver todas las empresas</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </a>
          </div>

          <div className="space-y-3">
            {/* Tenant Notification 1 */}
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-[#0D1117] border border-slate-200 dark:border-[#212A38] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center space-x-2.5">
                  <span className="font-bold text-slate-900 dark:text-white text-sm">Movilidad Cordillera</span>
                  <span className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800/60 px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wide uppercase">
                    DOMINIO PENDIENTE
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  Falta configurar verificación DNS del subdominio y registrar conductores en onboarding.
                </p>
                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  Estado: En onboarding • Subdominio: cordillera.nexomobility.com
                </div>
              </div>
              <div className="shrink-0">
                <button type="button" className="px-3.5 py-1.5 rounded-md bg-[#0F172A] hover:bg-slate-800 text-white font-semibold text-xs transition-colors shadow-2xs">
                  Abrir Detalle
                </button>
              </div>
            </div>

            {/* Tenant Notification 2 */}
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-[#0D1117] border border-slate-200 dark:border-[#212A38] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center space-x-2.5">
                  <span className="font-bold text-slate-900 dark:text-white text-sm">Transfer Austral</span>
                  <span className="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-800/60 px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wide uppercase">
                    CERCA DE LÍMITE
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  92% de cuota de conductores activos alcanzado (46/50 conductores de plan Standard).
                </p>
                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  Estado: Activo • Subdominio: austral.nexomobility.com
                </div>
              </div>
              <div className="shrink-0">
                <button type="button" className="px-3.5 py-1.5 rounded-md bg-[#0F172A] hover:bg-slate-800 text-white font-semibold text-xs transition-colors shadow-2xs">
                  Abrir Detalle
                </button>
              </div>
            </div>

            {/* Tenant Notification 3 */}
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-[#0D1117] border border-slate-200 dark:border-[#212A38] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center space-x-2.5">
                  <span className="font-bold text-slate-900 dark:text-white text-sm">Ruta Ejecutiva</span>
                  <span className="bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-800/60 px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wide uppercase">
                    PRUEBA FINALIZADA
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  Prueba finalizada sin conversión. Suspender o renovar suscripción.
                </p>
                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  Estado: Suspendido • Subdominio: rutaejecutiva.nexomobility.com
                </div>
              </div>
              <div className="shrink-0">
                <button type="button" className="px-3.5 py-1.5 rounded-md bg-[#0F172A] hover:bg-slate-800 text-white font-semibold text-xs transition-colors shadow-2xs">
                  Abrir Detalle
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (lg:col-span-1) */}
        <div className="lg:col-span-1 enterprise-card p-5 bg-white dark:bg-[#161D27] border border-slate-200 dark:border-[#212A38] shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#212A38]">
              <div className="flex items-center space-x-2">
                <span className="text-base">💚</span>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  3. Estado de Servicios
                </h2>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 text-[11px] font-bold font-mono">
                99.98% SLA
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              <div className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">API Gateway & Ingress</div>
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5">Latency: 18 ms</div>
                </div>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center">
                  <Activity className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                  Operativo
                </span>
              </div>

              <div className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">Billing & SLA Engine v2</div>
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5">Latency: 42 ms</div>
                </div>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center">
                  <Activity className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                  Operative
                </span>
              </div>

              <div className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">Geocoder API & Matching</div>
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5">Latency: 210 ms</div>
                </div>
                <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center">
                  <span className="w-2 h-2 rounded-full bg-amber-500 mr-1.5 animate-pulse" />
                  Investigando (INC-109)
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-[#212A38] text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center justify-between">
            <span>Servicios auditados 24/7</span>
            <span>Región: Santiago (scl-1)</span>
          </div>
        </div>
      </div>

      {/* Sección Central: Editor y Directorio */}
      <div id="directorio-empresas" className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
        
        {/* Lista de Empresas Tenants (Directorio Limpio) */}
        <div className="lg:col-span-5 space-y-3">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-gray-300 flex items-center uppercase tracking-wider">
            <Sliders className="w-4 h-4 mr-2 text-slate-400" />
            Directorio de Empresas
          </h2>
          
          <div className="space-y-2">
            {tenants.map((t) => {
              const isSelected = editingTenant.id === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => handleEditSelect(t)}
                  className={`p-3.5 rounded-md transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/90 dark:bg-blue-950/40 border border-blue-500 text-blue-950 dark:text-blue-100 shadow-sm'
                      : 'bg-white dark:bg-[#161D27] border border-slate-200 dark:border-[#212A38] hover:border-slate-300 dark:hover:border-[#303B4E]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={`font-semibold text-sm ${isSelected ? 'text-blue-950 dark:text-blue-100' : 'text-slate-900 dark:text-gray-100'}`}>{t.nombre}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">slug: /{t.slug}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-4 h-4 rounded-sm border border-black/30"
                        style={{ backgroundColor: t.primaryColor }}
                        title="Primary Color"
                      />
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded">
                        Al día
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel Editor Sobrio de Marca Blanca */}
        <div className="lg:col-span-7">
          <div className="enterprise-card p-6 space-y-6">
            
            <div className="border-b border-slate-200 dark:border-[#212A38] pb-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider block font-medium">Configuración de Marca Blanca</span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  {editingTenant.nombre}
                </h2>
              </div>
              <button
                onClick={() => {
                  selectTenant(editingTenant.id);
                  setCurrentRoleView('tenant_admin');
                }}
                className="px-3 py-1.5 rounded-md text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-[#212A38] dark:hover:bg-[#303B4E] dark:text-gray-200 flex items-center transition-colors"
              >
                <span>Ver Portal WFM</span>
                <ExternalLink className="w-3.5 h-3.5 ml-1.5 text-slate-500 dark:text-slate-400" />
              </button>
            </div>

            {/* Selector Sobrio de Paleta */}
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-gray-300 block mb-2.5">
                Paletas estándar (Aplicación en tiempo de ejecución):
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PRESET_PALETTES.map((pal, idx) => {
                  const isPalActive = editingTenant.primaryColor === pal.primary && editingTenant.secondaryColor === pal.secondary;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPalette(pal.primary, pal.secondary)}
                      className={`flex items-center p-2 rounded transition-all text-left text-xs font-medium border ${
                        isPalActive
                          ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-900 dark:text-blue-100 font-semibold'
                          : 'bg-slate-50 dark:bg-[#0D1117] border-slate-200 dark:border-[#212A38] hover:border-slate-300 dark:hover:border-gray-600 text-slate-700 dark:text-gray-300'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-sm mr-2 shrink-0 border border-black/10" style={{ backgroundColor: pal.primary }} />
                      <span className="truncate">{pal.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Formulario Estructurado */}
            <form onSubmit={handleSaveBranding} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-gray-300 block mb-1">Nombre Comercial:</label>
                  <input
                    type="text"
                    value={editingTenant.nombre}
                    onChange={(e) => setEditingTenant({ ...editingTenant, nombre: e.target.value })}
                    className="enterprise-input w-full"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-gray-300 block mb-1">Identificador Slug:</label>
                  <input
                    type="text"
                    value={editingTenant.slug}
                    onChange={(e) => setEditingTenant({ ...editingTenant, slug: e.target.value })}
                    className="enterprise-input w-full font-mono text-xs text-slate-700 dark:text-gray-300"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-gray-300 block mb-1">URL Logotipo Institucional:</label>
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    value={editingTenant.logoUrl}
                    onChange={(e) => setEditingTenant({ ...editingTenant, logoUrl: e.target.value })}
                    className="enterprise-input w-full text-xs text-slate-900 dark:text-gray-300"
                  />
                  <div className="w-10 h-10 rounded overflow-hidden shrink-0 border border-slate-300 dark:border-[#212A38] bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    {editingTenant.logoUrl ? (
                      <img src={editingTenant.logoUrl} alt="Logo preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] text-slate-400 font-mono">N/A</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div className="p-3 rounded-md bg-slate-50 dark:bg-[#0D1117] border border-slate-200 dark:border-[#212A38]">
                  <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1 font-semibold uppercase">Color Primario</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={editingTenant.primaryColor}
                      onChange={(e) => setEditingTenant({ ...editingTenant, primaryColor: e.target.value })}
                      className="w-7 h-7 rounded border-0 bg-transparent cursor-pointer"
                    />
                    <span className="text-xs font-mono text-slate-800 dark:text-gray-200">{editingTenant.primaryColor}</span>
                  </div>
                </div>

                <div className="p-3 rounded-md bg-slate-50 dark:bg-[#0D1117] border border-slate-200 dark:border-[#212A38]">
                  <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1 font-semibold uppercase">Color Secundario</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={editingTenant.secondaryColor}
                      onChange={(e) => setEditingTenant({ ...editingTenant, secondaryColor: e.target.value })}
                      className="w-7 h-7 rounded border-0 bg-transparent cursor-pointer"
                    />
                    <span className="text-xs font-mono text-slate-800 dark:text-gray-200">{editingTenant.secondaryColor}</span>
                  </div>
                </div>

                <div className="p-3 rounded-md bg-slate-50 dark:bg-[#0D1117] border border-slate-200 dark:border-[#212A38]">
                  <label className="text-[11px] text-amber-600 dark:text-amber-400/90 block mb-1 font-semibold uppercase">Acento Móvil (Fijo)</label>
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-sm bg-[#E8832A] shrink-0" />
                    <span className="text-xs font-mono font-medium text-slate-800 dark:text-gray-200">#E8832A</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-slate-200 dark:border-[#212A38]">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {saveStatus ? '✓ Parámetros guardados y aplicados.' : 'Los cambios se aplican automáticamente en las vistas locales.'}
                </span>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                >
                  Guardar Configuración
                </button>
              </div>
            </form>

          </div>
        </div>

      </div>

      {/* Asistente White-Label de 2 Pasos (Directo a Revisión y Confirmación) */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#161D27] rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden border border-slate-200 dark:border-[#212A38] animate-in zoom-in-95">
            
            {/* Header del Asistente */}
            <div className="bg-[#0F172A] text-white p-5 sm:px-8 sm:py-6 flex items-center justify-between border-b border-slate-700/80">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-md">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold tracking-tight">Crear Nueva Empresa Transportista (White-Label)</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Asistente de configuración de tenant White-Label (Nexo Mobility Platform)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="px-3.5 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-600"
              >
                Cerrar asistente
              </button>
            </div>

            {/* Barra de Progreso de 2 Pasos (Eliminados pasos intermedios) */}
            <div className="bg-slate-50 dark:bg-[#0D1117] px-6 sm:px-8 py-3.5 border-b border-slate-200 dark:border-[#212A38] flex items-center justify-center sm:justify-start gap-10">
              <div className="flex items-center space-x-2.5">
                <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                  wizardStep === 1 ? 'bg-[#0F172A] text-white dark:bg-white dark:text-slate-900 shadow-xs' : 'bg-emerald-600 text-white'
                }`}>
                  {wizardStep === 2 ? '✓' : '1'}
                </span>
                <span className={`text-xs font-bold ${wizardStep === 1 ? 'text-slate-900 dark:text-white underline decoration-blue-500 decoration-2 underline-offset-4' : 'text-slate-500 dark:text-slate-400'}`}>
                  1. Inf. básica
                </span>
              </div>

              <div className="w-8 h-0.5 bg-slate-200 dark:bg-slate-800" />

              <div className="flex items-center space-x-2.5">
                <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                  wizardStep === 2 ? 'bg-[#0F172A] text-white dark:bg-white dark:text-slate-900 shadow-xs' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}>
                  2
                </span>
                <span className={`text-xs font-bold ${wizardStep === 2 ? 'text-slate-900 dark:text-white underline decoration-emerald-500 decoration-2 underline-offset-4' : 'text-slate-400 dark:text-slate-500'}`}>
                  2. Revisión y Confirmación
                </span>
              </div>
            </div>

            {/* Contenido del Paso 1: Información Básica y Fiscal */}
            {wizardStep === 1 && (
              <form onSubmit={handleNextStep} className="p-6 sm:p-8 space-y-6 max-h-[72vh] overflow-y-auto">
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">Paso 1 de 2: Información general y fiscal de la empresa</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Todos los campos son obligatorios (*) excepto Razón Social. Se verificarán automáticamente formatos de contacto.</p>
                </div>

                {formError && (
                  <div className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-300 text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="text-xs font-bold text-slate-800 dark:text-gray-200 block mb-1.5">
                        Nombre Comercial (requerido) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={newNombre}
                        onChange={(e) => setNewNombre(e.target.value)}
                        placeholder="Ej. Transportes Cordillera Austral"
                        className="enterprise-input w-full text-xs py-2.5 font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-gray-300 block mb-1.5">
                        Razón Social (opcional)
                      </label>
                      <input
                        type="text"
                        value={newRazonSocial}
                        onChange={(e) => setNewRazonSocial(e.target.value)}
                        placeholder="Ej. Transportes y Logística Cordillera Austral SpA"
                        className="enterprise-input w-full text-xs py-2.5"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="text-xs font-bold text-slate-800 dark:text-gray-200 block mb-1.5">
                        Identificador Tributario / RUT <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={newRut}
                        onChange={(e) => setNewRut(e.target.value)}
                        placeholder="77.491.330-1"
                        className="enterprise-input w-full text-xs py-2.5 font-mono uppercase font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-800 dark:text-gray-200 block mb-1.5">
                        País de Operación <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={newPais}
                        onChange={(e) => setNewPais(e.target.value)}
                        className="enterprise-input w-full text-xs py-2.5 bg-white dark:bg-[#0D1117] font-semibold"
                      >
                        <option value="Chile">Chile (Mercado Exclusivo MVP)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="text-xs font-bold text-slate-800 dark:text-gray-200 block mb-1.5">
                        Zona Horaria <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={newZonaHoraria}
                        onChange={(e) => setNewZonaHoraria(e.target.value)}
                        className="enterprise-input w-full text-xs py-2.5 bg-white dark:bg-[#0D1117]"
                      >
                        <option value="America/Santiago (UTC-4)">America/Santiago (UTC-4 - Chile Continental & Biobío)</option>
                        <option value="America/Punta_Arenas (UTC-3)">America/Punta_Arenas (UTC-3 - Magallanes y Antártica Chilena)</option>
                        <option value="Pacific/Easter (UTC-6)">Pacific/Easter (UTC-6 - Isla de Pascua / Rapa Nui)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-800 dark:text-gray-200 block mb-1.5">
                        Moneda / Divisa <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={newMoneda}
                        onChange={(e) => setNewMoneda(e.target.value)}
                        className="enterprise-input w-full text-xs py-2.5 bg-white dark:bg-[#0D1117] font-semibold text-emerald-600 dark:text-emerald-400"
                      >
                        <option value="CLP ($ Peso Chileno)">CLP ($ Peso Chileno)</option>
                      </select>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 dark:border-slate-800/80 pt-5">
                    <div className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-3 tracking-wide">
                      Datos del Contacto Principal (Requeridos para Alertas y Despacho)
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="text-xs font-bold text-slate-800 dark:text-gray-200 block mb-1.5">
                          Contacto Principal <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={newContacto}
                          onChange={(e) => setNewContacto(e.target.value)}
                          placeholder="Ej. Marcos Vergara"
                          className="enterprise-input w-full text-xs py-2.5"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-800 dark:text-gray-200 block mb-1.5">
                          Email del Contacto <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          placeholder="mvergara@cordilleraaustral.cl"
                          className="enterprise-input w-full text-xs py-2.5 font-mono"
                        />
                      </div>
                    </div>

                    <div className="mt-5 max-w-sm">
                      <label className="text-xs font-bold text-slate-800 dark:text-gray-200 block mb-1.5">
                        Teléfono Móvil / Whatsapp (Chile) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={newTelefono}
                        onChange={(e) => setNewTelefono(e.target.value)}
                        placeholder="+56 9 8111 2233"
                        className="enterprise-input w-full text-xs py-2.5 font-mono font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Paso 1 */}
                <div className="pt-6 border-t border-slate-200 dark:border-[#212A38] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowNewModal(false)}
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition-colors inline-flex items-center border border-slate-300 dark:border-slate-700"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1.5" />
                    <span>Cancelar</span>
                  </button>

                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#0F172A] hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 transition-colors shadow-md inline-flex items-center space-x-2 cursor-pointer"
                  >
                    <span>Siguiente Paso</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </form>
            )}

            {/* Contenido del Paso 2: Revisión y Confirmación Directa */}
            {wizardStep === 2 && (
              <div className="p-6 sm:p-8 space-y-6 max-h-[72vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center">
                      <ShieldCheck className="w-5 h-5 text-emerald-500 mr-2" />
                      Paso 2 de 2: Revisión y Confirmación de Datos
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Los datos fueron validados con éxito. Verifique los antecedentes antes de proceder a la creación del Tenant.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                    ● Datos Validados ✓
                  </span>
                </div>

                {/* Tarjeta resumen de confirmación */}
                <div className="p-6 rounded-xl bg-slate-50/80 dark:bg-[#0D1117] border border-slate-200 dark:border-slate-800/80 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-xs">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block font-medium">Nombre Comercial:</span>
                      <span className="font-bold text-slate-900 dark:text-white text-sm">{newNombre}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block font-medium">Razón Social:</span>
                      <span className="font-semibold text-slate-800 dark:text-gray-300">{newRazonSocial || 'No especificada (Opcional)'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block font-medium">Identificador Tributario (RUT):</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">{newRut}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block font-medium">País y Divisa Operativa:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{newPais} • {newMoneda}</span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-slate-500 dark:text-slate-400 block font-medium">Zona Horaria Configurada:</span>
                      <span className="font-mono text-slate-800 dark:text-gray-200 font-semibold">{newZonaHoraria}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block font-medium">Contacto Principal:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{newContacto}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block font-medium">Email Validado:</span>
                      <span className="font-mono text-slate-800 dark:text-blue-300 font-semibold">{newEmail}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block font-medium">Teléfono Validado:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{newTelefono}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 text-slate-700 dark:text-slate-300 text-xs flex items-center justify-between">
                  <span>ℹ️ La empresa se aprovisionará con el esquema visual corporativo estándar de Nexo Mobility, editable en cualquier momento.</span>
                </div>

                {/* Footer Paso 2 */}
                <div className="pt-4 border-t border-slate-200 dark:border-[#212A38] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setWizardStep(1)}
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition-colors inline-flex items-center border border-slate-300 dark:border-slate-700 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1.5" />
                    <span>Volver y Modificar</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCreateTenant}
                    className="px-7 py-3 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-lg inline-flex items-center space-x-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    <span>Confirmar y Crear Empresa Tenant ✓</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

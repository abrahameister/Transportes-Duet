import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../context/AppContext';
import { useToast } from '../ui/Toast';
import type { ClienteCorporativo } from '../../types';
import { Building2, DollarSign, Plus, X, CheckCircle2, Mail, Loader2 } from 'lucide-react';

export const ClientesTarifacionView: React.FC = () => {
  const { clientes, agregarCliente, actualizarCliente } = useApp();
  const toast = useToast();
  const [selectedClienteForTariffs, setSelectedClienteForTariffs] = useState<ClienteCorporativo | null>(null);
  const [showClienteModal, setShowClienteModal] = useState<boolean>(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [invitingId, setInvitingId] = useState<string | null>(null);

  // States para edición rápida de tarifas de cliente seleccionado ($ CLP)
  const [tarifaKm, setTarifaKm] = useState<number>(0);
  const [tarifaMinima, setTarifaMinima] = useState<number>(0);
  const [rutasFijas, setRutasFijas] = useState<{ nombre: string; precio: number }[]>([]);

  // Form states para Nuevo Cliente B2B en Concepción
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [nombreCorporativo, setNombreCorporativo] = useState('');
  const [rut, setRut] = useState('');
  const [direccion, setDireccion] = useState('');
  const [contactoNombre, setContactoNombre] = useState('');
  const [contactoEmail, setContactoEmail] = useState('');

  const clientesTenant = clientes;

  const tenants: any[] = [];

  const handleSelectTemplate = (val: string) => {
    setSelectedTemplate(val);
    if (!val) return;
    const tenantMatch = (tenants as any[]).find(t => t.id === val);
    if (tenantMatch) {
      setNombreCorporativo(tenantMatch.nombre);
      setRut((tenantMatch as any).rut || '77.491.330-1');
      setDireccion('Casa Matriz / Base Operativa Neira Transportes');
      setContactoNombre((tenantMatch as any).contacto || 'Jefatura WFM');
      setContactoEmail((tenantMatch as any).email || 'operaciones@empresa.cl');
    } else if (val === 'codelco') {
      setNombreCorporativo('Codelco División El Teniente / Rancagua');
      setRut('61.704.000-0');
      setDireccion('Av. Millán 1040, Rancagua');
      setContactoNombre('Roberto Valdés - Despacho');
      setContactoEmail('rvaldes001@codelco.cl');
    } else if (val === 'arauco') {
      setNombreCorporativo('Celulosa y Forestal Arauco Neira Transportes S.A.');
      setRut('96.536.000-5');
      setDireccion('Planta Horcones s/n, Arauco');
      setContactoNombre('Paulina Gacitúa - Logística');
      setContactoEmail('paulina.gacitua@arauco.cl');
    } else if (val === 'huachipato') {
      setNombreCorporativo('Compañía Siderúrgica Huachipato CAP');
      setRut('90.222.000-1');
      setDireccion('Gran Bretaña 2910, Talcahuano');
      setContactoNombre('Mario Soto - Jefe Turnos');
      setContactoEmail('msoto@cap.cl');
    }
  };

  const handleAddNuevaRuta = () => {
    if (!selectedClienteForTariffs) return;
    const newRoute = {
      id: `rf-${Date.now()}`,
      nombre: 'Nueva Ruta Corporativa (Concepción ➔ Neira Transportes)',
      origen: 'Centro Concepción / Plaza Independencia',
      destino: 'Planta Industrial Neira Transportes',
      precioClp: 22000
    };
    const updated = {
      ...selectedClienteForTariffs,
      tarifario: {
        ...selectedClienteForTariffs.tarifario,
        rutasFijas: [...selectedClienteForTariffs.tarifario.rutasFijas, newRoute]
      }
    };
    setSelectedClienteForTariffs(updated);
    setRutasFijas([...rutasFijas, { nombre: newRoute.nombre, precio: newRoute.precioClp }]);
  };

  const handleOpenTariffDrawer = (cl: ClienteCorporativo) => {
    setSelectedClienteForTariffs(cl);
    setTarifaKm(cl.tarifario.tarifaPorKm);
    setTarifaMinima(cl.tarifario.tarifaMinima);
    setRutasFijas(cl.tarifario.rutasFijas.map(rf => ({ nombre: rf.nombre, precio: rf.precioClp })));
  };

  const handleSaveTarifas = () => {
    if (!selectedClienteForTariffs) return;
    const updatedTarifario = {
      ...selectedClienteForTariffs.tarifario,
      tarifaPorKm: Number(tarifaKm),
      tarifaMinima: Number(tarifaMinima),
      rutasFijas: selectedClienteForTariffs.tarifario.rutasFijas.map((rf, idx) => ({
        ...rf,
        nombre: rutasFijas[idx]?.nombre || rf.nombre,
        precioClp: Number(rutasFijas[idx]?.precio ?? rf.precioClp)
      }))
    };

    actualizarCliente(selectedClienteForTariffs.id, { tarifario: updatedTarifario });
    setActionMsg(`Matriz tarifaria CLP de "${selectedClienteForTariffs.nombreCorporativo}" actualizada con éxito.`);
    setSelectedClienteForTariffs(null);
    setTimeout(() => setActionMsg(null), 4000);
  };

  const handleSaveNuevoCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactoEmail) {
      toast.warning('Debes proporcionar un email de contacto para enviar la invitación B2B.', 'Email Requerido');
      return;
    }
    
    // 1. Insert in clientes_corporativos
    const { data: clienteData, error: clienteError } = await supabase.from('clientes_corporativos').insert([{
      nombre_corporativo: nombreCorporativo,
      rut_identificador: rut,
      direccion_fiscal: direccion,
      contacto_nombre: contactoNombre,
      contacto_email: contactoEmail,
      contacto_telefono: ''
    }]).select().single();

    if (clienteError) {
      console.error(clienteError);
      toast.error('Error creando empresa en base de datos: ' + clienteError.message, 'Fallo de Registro');
      return;
    }

    toast.success(`Empresa ${nombreCorporativo} creada exitosamente.`, 'Cliente Registrado');

    // Actualizamos la UI local
    agregarCliente({
      id: clienteData.id,
      nombreCorporativo: clienteData.nombre_corporativo,
      rutIdentificador: clienteData.rut_identificador,
      direccionFiscal: clienteData.direccion_fiscal,
      contactoNombre: clienteData.contacto_nombre,
      contactoEmail: clienteData.contacto_email,
      contactoTelefono: clienteData.contacto_telefono,
      tarifario: {
        tarifaPorKm: 1800, tarifaMinima: 12000, tiempoEsperaPorHora: 15000, rutasFijas: []
      }
    });
    
    setShowClienteModal(false);
  };

  const handleInviteClient = async (cl: ClienteCorporativo) => {
    if (!cl.contactoEmail) {
      toast.warning('Esta empresa no tiene un correo electrónico configurado.', 'Email No Configurado');
      return;
    }
    
    setInvitingId(cl.id);
    
    const { error: edgeError } = await supabase.functions.invoke('invite-b2b', {
      body: { 
        email: cl.contactoEmail, 
        fullName: cl.contactoNombre, 
        cliente_corporativo_id: cl.id,
        redirectTo: window.location.origin + '/reset-password'
      }
    });

    setInvitingId(null);

    if (edgeError) {
      console.error(edgeError);
      let realErrorMessage = edgeError.message;
      try {
        if (edgeError.context) {
          const errorContext = await edgeError.context.json();
          if (errorContext && errorContext.error) {
            realErrorMessage = errorContext.error;
          }
        }
      } catch (e) {}
      toast.error('Error al enviar invitación: ' + realErrorMessage, 'Fallo de Invitación');
    } else {
      actualizarCliente(cl.id, { invitacionEnviada: true });
      toast.success(`¡Invitación enviada con éxito a ${cl.contactoEmail}!`, 'Invitación Enviada');
    }
  };

  return (
    <div className="space-y-4">
      {actionMsg && (
        <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between">
          <span className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2" /> {actionMsg}</span>
        </div>
      )}

      {/* Header y Control B2B */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-[#212A38] pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center">
            <Building2 className="w-4 h-4 mr-1.5 text-blue-500" />
            Directorio y Matriz Tarifaria de Cuentas B2B (Chile)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Cada cuenta opera con esquemas independientes de precio por kilómetro ($ CLP/Km) y rutas fijas consolidas.</p>
        </div>
        <button
          onClick={() => setShowClienteModal(true)}
          className="px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors flex items-center space-x-1.5 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          <span>Registrar Cuenta B2B</span>
        </button>
      </div>

      {/* Tabla de Clientes B2B */}
      <div className="enterprise-card overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-[#0D1117] text-slate-500 dark:text-slate-400 uppercase font-semibold border-b border-slate-200 dark:border-[#212A38]">
            <tr>
              <th className="py-3 px-4">Razón Social B2B</th>
              <th className="py-3 px-4">RUT Corporativo</th>
              <th className="py-3 px-4">Ejecutivo de Contacto</th>
              <th className="py-3 px-4 font-mono">Tarifa Base / Km</th>
              <th className="py-3 px-4 font-mono">Rutas Fijas Custom</th>
              <th className="py-3 px-4 text-right">Configurar Tarifario</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-[#212A38] text-slate-700 dark:text-gray-300">
            {clientesTenant.map((cl) => (
              <tr key={cl.id} className="hover:bg-slate-50 dark:hover:bg-[#1C2533] transition-colors">
                <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                  <div>{cl.nombreCorporativo}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">{cl.direccionFiscal}</div>
                </td>
                <td className="py-3.5 px-4 font-mono font-medium text-slate-800 dark:text-gray-300">{cl.rutIdentificador}</td>
                <td className="py-3.5 px-4">
                  <div className="font-medium text-slate-800 dark:text-gray-200">{cl.contactoNombre}</div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px]">{cl.contactoEmail}</div>
                </td>
                <td className="py-3.5 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {cl.tarifario?.tarifaPorKm ? `$${cl.tarifario.tarifaPorKm.toLocaleString('es-CL')} CLP / km` : 'Tarifa base'}
                </td>
                <td className="py-3.5 px-4 font-mono">
                  <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-[#212A38] text-slate-800 dark:text-gray-300 text-[11px] font-semibold">
                    {cl.tarifario?.rutasFijas?.length || 0} rutas configuradas
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right flex items-center justify-end space-x-2">
                  <button
                    onClick={() => {
                      if (cl.invitacionEnviada) {
                        const confirm = window.confirm('Este cliente ya fue notificado. ¿Deseas reenviar la invitación? (Se enviará un correo de recuperación de contraseña como recordatorio).');
                        if (!confirm) return;
                      }
                      handleInviteClient(cl);
                    }}
                    disabled={invitingId === cl.id}
                    title={cl.invitacionEnviada ? "Invitación enviada. Reenviar correo" : "Enviar invitación de acceso B2B al cliente"}
                    className={`px-2.5 py-1.5 rounded text-xs font-semibold transition-colors inline-flex items-center space-x-1 border ${
                      cl.invitacionEnviada 
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' 
                        : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
                    }`}
                  >
                    {invitingId === cl.id ? (
                      <Loader2 className="w-3.5 h-3.5 mr-0.5 animate-spin" />
                    ) : cl.invitacionEnviada ? (
                      <CheckCircle2 className="w-3.5 h-3.5 mr-0.5" />
                    ) : (
                      <Mail className="w-3.5 h-3.5 mr-0.5" />
                    )}
                    <span>{cl.invitacionEnviada ? 'Notificado' : 'Notificar'}</span>
                  </button>

                  <button
                    onClick={() => handleOpenTariffDrawer(cl)}
                    className="px-3 py-1.5 rounded bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-xs font-semibold shadow-sm transition-colors inline-flex items-center space-x-1"
                  >
                    <DollarSign className="w-3.5 h-3.5 mr-0.5" />
                    <span>Configurar Tarifario</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* DRAWER MODAL DE TARIFARIO B2B CUSTOM */}
      {selectedClienteForTariffs && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex justify-end">
          <div className="w-full sm:w-2/3 lg:w-1/2 bg-white dark:bg-[#161D27] h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-[#212A38] animate-in slide-in-from-right duration-200">
            
            <div className="p-5 border-b border-slate-200 dark:border-[#212A38] bg-slate-50 dark:bg-[#0D1117] flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">MOTOR DE TARIFAS INDEPENDIENTE (CHILE)</span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{selectedClienteForTariffs.nombreCorporativo}</h3>
              </div>
              <button onClick={() => setSelectedClienteForTariffs(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-200 dark:border-[#212A38] pb-2">
                  1. Parámetros Monetarios Base ($ CLP)
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-gray-300 block mb-1">Tarifa por Kilómetro ($ CLP/Km):</label>
                    <input
                      type="number"
                      step="50"
                      value={tarifaKm}
                      onChange={(e) => setTarifaKm(Number(e.target.value))}
                      className="enterprise-input w-full font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm"
                    />
                    <span className="text-[11px] text-slate-400 block mt-1">Se aplica en viajes dinámicos sin ruta predefinida.</span>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-gray-300 block mb-1">Tarifa Mínima de Salida ($ CLP):</label>
                    <input
                      type="number"
                      step="500"
                      value={tarifaMinima}
                      onChange={(e) => setTarifaMinima(Number(e.target.value))}
                      className="enterprise-input w-full font-mono font-bold text-slate-800 dark:text-white text-sm"
                    />
                    <span className="text-[11px] text-slate-400 block mt-1">Piso mínimo facturable por servicio emitido.</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#212A38] pb-2">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    2. Tarifario de Rutas Fijas Preestablecidas
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddNuevaRuta}
                    className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[11px] flex items-center space-x-1 shadow-xs transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Añadir Ruta</span>
                  </button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Precios inmutables negociados en contrato B2B. Puede editar el nombre y monto o añadir nuevas rutas personalizadas.
                </p>

                <div className="space-y-2.5">
                  {selectedClienteForTariffs.tarifario.rutasFijas.map((rf, index) => (
                    <div key={rf.id} className="p-3.5 rounded-lg border border-slate-200 dark:border-[#212A38] bg-slate-50/70 dark:bg-[#0D1117]/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1 space-y-1">
                        <input
                          type="text"
                          value={rutasFijas[index]?.nombre ?? rf.nombre}
                          onChange={(e) => {
                            const newVals = [...rutasFijas];
                            newVals[index] = { nombre: e.target.value, precio: newVals[index]?.precio ?? rf.precioClp };
                            setRutasFijas(newVals);
                          }}
                          className="enterprise-input w-full font-bold text-xs bg-white dark:bg-[#161D27]"
                          placeholder="Nombre de la ruta corporativa..."
                        />
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate px-1">{rf.origen} ➔ {rf.destino}</div>
                      </div>
                      <div className="flex items-center space-x-1.5 shrink-0 sm:self-center">
                        <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400">$</span>
                        <input
                          type="number"
                          step="500"
                          value={rutasFijas[index]?.precio ?? rf.precioClp}
                          onChange={(e) => {
                            const newVals = [...rutasFijas];
                            newVals[index] = { nombre: newVals[index]?.nombre ?? rf.nombre, precio: Number(e.target.value) };
                            setRutasFijas(newVals);
                          }}
                          className="enterprise-input w-28 text-right font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400 bg-white dark:bg-[#161D27]"
                        />
                        <span className="text-[11px] font-mono text-slate-400">CLP</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-[#212A38] bg-slate-50 dark:bg-[#0D1117] flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">Los cambios se aplican automáticamente en el cobro en pesos chilenos.</span>
              <div className="space-x-2">
                <button type="button" onClick={() => setSelectedClienteForTariffs(null)} className="px-4 py-2 rounded text-xs border border-slate-300 dark:border-[#303B4E] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#212A38]">Cancelar</button>
                <button type="button" onClick={handleSaveTarifas} className="px-5 py-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm">Guardar Matriz Tarifaria ✓</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NUEVO CLIENTE CHILE */}
      {showClienteModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="enterprise-card p-6 max-w-md w-full space-y-4 animate-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Alta de Cuenta Corporativa B2B (Chile)</h3>
            <form onSubmit={handleSaveNuevoCliente} className="space-y-3.5">
              <div className="pt-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-gray-300 block mb-1">Razón Social Contratante (*):</label>
                <input type="text" value={nombreCorporativo} onChange={(e) => setNombreCorporativo(e.target.value)} placeholder="Ej. Forestal Arauco Neira Transportes S.A." required className="enterprise-input w-full text-xs" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-gray-300 block mb-1">RUT Contratante (*):</label>
                <input type="text" value={rut} onChange={(e) => setRut(e.target.value)} placeholder="76.012.345-0" required className="enterprise-input w-full text-xs font-mono uppercase" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-gray-300 block mb-1">Dirección Fiscal / Sede (*):</label>
                <input type="text" value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder="Parque Industrial Escuadrón, Coronel" required className="enterprise-input w-full text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-gray-300 block mb-1">Nombre Contacto (*):</label>
                  <input type="text" value={contactoNombre} onChange={(e) => setContactoNombre(e.target.value)} placeholder="Ing. Gonzalo Sepúlveda" required className="enterprise-input w-full text-xs" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-gray-300 block mb-1">Email Corporativo (*):</label>
                  <input type="email" value={contactoEmail} onChange={(e) => setContactoEmail(e.target.value)} placeholder="gsepulveda@empresa.cl" required className="enterprise-input w-full text-xs" />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-[#212A38]">
                <button type="button" onClick={() => setShowClienteModal(false)} className="px-3 py-1.5 rounded text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white">Cancelar</button>
                <button type="submit" className="px-5 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm">Crear Cuenta B2B</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

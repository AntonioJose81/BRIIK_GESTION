
import React, { useState } from 'react';
import { AppSettings, Model, Color, Status, LineType, Rules } from '../types';
import { DEFAULT_SETTINGS } from '../constants';

interface SettingsViewProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
  onClose: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ settings, onSave, onClose }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(JSON.parse(JSON.stringify(settings)));

  const handleUpdateRules = (field: keyof Rules, value: any) => {
    setLocalSettings({ ...localSettings, rules: { ...localSettings.rules, [field]: value } });
  };

  const handleAddModel = () => {
    setLocalSettings({
      ...localSettings,
      models: [...localSettings.models, { code: '', name: '' }]
    });
  };

  const handleAddColor = () => {
    setLocalSettings({
      ...localSettings,
      colors: [...localSettings.colors, { code: '', name: '' }]
    });
  };

  const handleAddStatus = () => {
    setLocalSettings({
      ...localSettings,
      statuses: [...localSettings.statuses, { name: '', order: localSettings.statuses.length + 1, badgeColor: '#9ca3af' }]
    });
  };

  const handleAddLineType = () => {
    setLocalSettings({
      ...localSettings,
      lineTypes: [...localSettings.lineTypes, {
        codeType: 'NEW',
        label: 'Nuevo Tipo',
        skuPrefix: '',
        skuFixed: '',
        requiresModel: false,
        requiresColor: false,
        requiresName: false,
        defaultPVDUnit: 0,
        defaultPVPUnit: 0,
        equivalenceUnits: 1
      }]
    });
  };

  return (
    <div className="max-w-6xl mx-auto animate-slide-up pb-20">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">Configuración</h1>
          <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-widest">Reglas de negocio y catálogo de productos</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setLocalSettings(DEFAULT_SETTINGS)}
            className="px-6 py-3 bg-white border border-purple-100 text-gray-400 font-bold rounded-2xl text-xs hover:text-red-500 hover:border-red-100 transition-all uppercase tracking-widest"
          >
            Restaurar Valores
          </button>
          <button
            onClick={() => onSave(localSettings)}
            className="px-10 py-3 bg-primary text-white font-black rounded-2xl text-sm shadow-xl shadow-purple-200 hover:bg-primary-light hover:scale-105 transition-all"
          >
            Guardar Cambios
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Billing Info Card (New) */}
        <div className="bento-card relative overflow-hidden group border-t-8 border-primary">
          <div className="relative">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-purple-100 text-primary rounded-2xl flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" /><path d="M18 14h-8" /><path d="M15 18h-5" /><path d="M10 6h8v4h-8V6Z" /></svg>
              </div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight">Datos Facturación</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-purple-300 uppercase tracking-widest mb-1">Razón Social</label>
                <input
                  type="text"
                  value={localSettings.billing.companyName}
                  onChange={(e) => setLocalSettings({ ...localSettings, billing: { ...localSettings.billing, companyName: e.target.value } })}
                  className="w-full bg-purple-50/30 border border-purple-100 p-3 rounded-xl font-bold text-gray-700 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-purple-300 uppercase tracking-widest mb-1">NIF/CIF</label>
                  <input
                    type="text"
                    value={localSettings.billing.nif}
                    onChange={(e) => setLocalSettings({ ...localSettings, billing: { ...localSettings.billing, nif: e.target.value } })}
                    className="w-full bg-purple-50/30 border border-purple-100 p-3 rounded-xl font-bold text-gray-700 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-purple-300 uppercase tracking-widest mb-1">Ciudad</label>
                  <input
                    type="text"
                    value={localSettings.billing.city}
                    onChange={(e) => setLocalSettings({ ...localSettings, billing: { ...localSettings.billing, city: e.target.value } })}
                    className="w-full bg-purple-50/30 border border-purple-100 p-3 rounded-xl font-bold text-gray-700 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-purple-300 uppercase tracking-widest mb-1">Direcci\u00f3n Completa</label>
                <input
                  type="text"
                  value={localSettings.billing.address}
                  onChange={(e) => setLocalSettings({ ...localSettings, billing: { ...localSettings.billing, address: e.target.value } })}
                  className="w-full bg-purple-50/30 border border-purple-100 p-3 rounded-xl font-bold text-gray-700 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-purple-300 uppercase tracking-widest mb-1">% IVA</label>
                  <input
                    type="number"
                    value={localSettings.billing.vatRate}
                    onChange={(e) => setLocalSettings({ ...localSettings, billing: { ...localSettings.billing, vatRate: parseFloat(e.target.value) } })}
                    className="w-full bg-purple-50/30 border border-purple-100 p-3 rounded-xl font-black text-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-purple-300 uppercase tracking-widest mb-1">% RE</label>
                  <input
                    type="number"
                    value={localSettings.billing.reRate}
                    onChange={(e) => setLocalSettings({ ...localSettings, billing: { ...localSettings.billing, reRate: parseFloat(e.target.value) } })}
                    className="w-full bg-purple-50/30 border border-purple-100 p-3 rounded-xl font-black text-orange-500 outline-none"
                  />
                </div>
              </div>
              <div className="pt-4 border-t border-purple-50">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Serie y Contador Facturas</label>
                <div className="flex gap-2">
                  <input
                    placeholder="Serie (ej: INV-2026-)"
                    value={localSettings.billing.invoicePrefix}
                    onChange={(e) => setLocalSettings({ ...localSettings, billing: { ...localSettings.billing, invoicePrefix: e.target.value } })}
                    className="flex-1 bg-gray-50 border border-purple-50 p-3 rounded-xl font-black text-gray-600 outline-none text-xs"
                  />
                  <input
                    type="number"
                    value={localSettings.billing.nextInvoiceNumber}
                    onChange={(e) => setLocalSettings({ ...localSettings, billing: { ...localSettings.billing, nextInvoiceNumber: parseInt(e.target.value) } })}
                    className="w-20 bg-gray-50 border border-purple-50 p-3 rounded-xl font-black text-gray-900 outline-none text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Business Rules Card */}
        <div className="bento-card relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
          <div className="relative">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
              </div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight">Reglas de Negocio</h3>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-purple-300 uppercase tracking-widest mb-2">Pedido Mínimo (Uds)</label>
                <input
                  type="number"
                  value={localSettings.rules.moq}
                  onChange={(e) => handleUpdateRules('moq', parseInt(e.target.value))}
                  className="w-full bg-purple-50/30 border border-purple-100 p-4 rounded-xl font-black text-gray-900 outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-purple-300 uppercase tracking-widest mb-2">Envío Gratis (€)</label>
                  <input
                    type="number"
                    value={localSettings.rules.freeFromPVD}
                    onChange={(e) => handleUpdateRules('freeFromPVD', parseFloat(e.target.value))}
                    className="w-full bg-purple-50/30 border border-purple-100 p-4 rounded-xl font-black text-gray-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-purple-300 uppercase tracking-widest mb-2">Coste Envío (€)</label>
                  <input
                    type="number"
                    value={localSettings.rules.shippingCost}
                    onChange={(e) => handleUpdateRules('shippingCost', parseFloat(e.target.value))}
                    className="w-full bg-purple-50/30 border border-purple-100 p-4 rounded-xl font-black text-gray-900 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lead Times Card */}
        <div className="bento-card relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
          <div className="relative">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-purple-100 text-primary rounded-2xl flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              </div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight">Plazos de Entrega</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-purple-300 uppercase tracking-widest mb-2">Productos Genéricos</label>
                <input
                  type="text"
                  value={localSettings.rules.leadTimeGeneric}
                  onChange={(e) => handleUpdateRules('leadTimeGeneric', e.target.value)}
                  className="w-full bg-purple-50/30 border border-purple-100 p-4 rounded-xl font-bold text-gray-700"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-purple-300 uppercase tracking-widest mb-2">Productos Personalizados</label>
                <input
                  type="text"
                  value={localSettings.rules.leadTimePersonalized}
                  onChange={(e) => handleUpdateRules('leadTimePersonalized', e.target.value)}
                  className="w-full bg-purple-50/30 border border-purple-100 p-4 rounded-xl font-bold text-gray-700"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-purple-300 uppercase tracking-widest mb-2">Suplemento Transporte</label>
                <input
                  type="text"
                  value={localSettings.rules.leadTimeTransport}
                  onChange={(e) => handleUpdateRules('leadTimeTransport', e.target.value)}
                  className="w-full bg-purple-50/30 border border-purple-100 p-4 rounded-xl font-bold text-gray-700"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Validation Card */}
        <div className="bento-card relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
          <div className="relative">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
              </div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight">Validación</h3>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-purple-300 uppercase tracking-widest mb-2">Sugerencia Máx. Caracteres</label>
                <input
                  type="number"
                  value={localSettings.rules.nameMaxSuggested}
                  onChange={(e) => handleUpdateRules('nameMaxSuggested', parseInt(e.target.value))}
                  className="w-full bg-purple-50/30 border border-purple-100 p-4 rounded-xl font-black text-gray-900"
                />
              </div>
              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-4 cursor-pointer group/check">
                  <div className={`w-10 h-6 rounded-full p-1 transition-colors ${localSettings.rules.nameNormalize ? 'bg-primary' : 'bg-gray-200'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${localSettings.rules.nameNormalize ? 'translate-x-4' : 'translate-x-0'}`}></div>
                  </div>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={localSettings.rules.nameNormalize}
                    onChange={(e) => handleUpdateRules('nameNormalize', e.target.checked)}
                  />
                  <span className="text-xs font-black text-gray-600 uppercase tracking-widest">Normalizar Nombres</span>
                </label>
                <label className="flex items-center gap-4 cursor-pointer group/check">
                  <div className={`w-10 h-6 rounded-full p-1 transition-colors ${localSettings.rules.allowEmojis ? 'bg-primary' : 'bg-gray-200'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${localSettings.rules.allowEmojis ? 'translate-x-4' : 'translate-x-0'}`}></div>
                  </div>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={localSettings.rules.allowEmojis}
                    onChange={(e) => handleUpdateRules('allowEmojis', e.target.checked)}
                  />
                  <span className="text-xs font-black text-gray-600 uppercase tracking-widest">Permitir Emojis</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Catalog: Models Card */}
        <div className="bento-card md:col-span-2">
          <div className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-2xl flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15" /><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg>
              </div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">Modelos de Productos</h3>
            </div>
            <button
              onClick={handleAddModel}
              className="px-6 py-3 bg-primary text-white font-black rounded-2xl text-xs hover:bg-primary-light transition-all flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14m-7-7h14" /></svg>
              AÑADIR MODELO
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto custom-scrollbar p-1">
            {localSettings.models.map((m, idx) => (
              <div key={idx} className="group relative bg-white border border-purple-100 p-5 rounded-2xl hover:shadow-xl hover:shadow-purple-100/50 transition-all">
                <input
                  placeholder="Código"
                  value={m.code}
                  onChange={(e) => {
                    const next = [...localSettings.models];
                    next[idx].code = e.target.value;
                    setLocalSettings({ ...localSettings, models: next });
                  }}
                  className="w-full bg-transparent font-black text-primary text-[10px] uppercase tracking-[0.2em] mb-1 outline-none"
                />
                <input
                  placeholder="Nombre..."
                  value={m.name}
                  onChange={(e) => {
                    const next = [...localSettings.models];
                    next[idx].name = e.target.value;
                    setLocalSettings({ ...localSettings, models: next });
                  }}
                  className="w-full bg-transparent font-black text-gray-900 text-sm outline-none"
                />
                <button
                  onClick={() => setLocalSettings({ ...localSettings, models: localSettings.models.filter((_, i) => i !== idx) })}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Catalog: Colors Card */}
        <div className="bento-card">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-pink-100 text-pink-600 rounded-2xl flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" /></svg>
              </div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight">Colores</h3>
            </div>
            <button onClick={handleAddColor} className="text-primary font-black text-xs hover:text-primary-light">+ AÑADIR</button>
          </div>
          <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar p-1">
            {localSettings.colors.map((c, idx) => (
              <div key={idx} className="flex p-3 gap-3 bg-white border border-purple-50 rounded-xl items-center group">
                <div className="w-8 h-8 rounded-full border shadow-inner" style={{ backgroundColor: c.name.toLowerCase() }}></div>
                <div className="flex-1 min-w-0">
                  <input
                    value={c.name}
                    onChange={(e) => {
                      const next = [...localSettings.colors];
                      next[idx].name = e.target.value;
                      setLocalSettings({ ...localSettings, colors: next });
                    }}
                    className="w-full text-xs font-black text-gray-900 bg-transparent outline-none"
                  />
                  <input
                    value={c.code}
                    onChange={(e) => {
                      const next = [...localSettings.colors];
                      next[idx].code = e.target.value;
                      setLocalSettings({ ...localSettings, colors: next });
                    }}
                    className="w-full text-[9px] font-bold text-purple-300 bg-transparent outline-none uppercase tracking-widest"
                  />
                </div>
                <button
                  onClick={() => setLocalSettings({ ...localSettings, colors: localSettings.colors.filter((_, i) => i !== idx) })}
                  className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Product Types / Pricing Card */}
        <div className="md:col-span-2 lg:col-span-3">
          <div className="flex justify-between items-center mb-10 mt-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.91 8.84 8.56 21.19a2.5 2.5 0 0 1-3.54 0L2.81 18.99a2.5 2.5 0 0 1 0-3.54L15.16 3.1a2.5 2.5 0 0 1 3.54 0l2.21 2.21a2.5 2.5 0 0 1 0 3.53Z" /><path d="m15 13 3 2" /><path d="m12 10 3 3" /><path d="m9 7 3 3" /><path d="m14.5 9.5 2.5 2.5" /><path d="m8 6 2 2" /></svg>
              </div>
              <h3 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Catálogo y Precios</h3>
            </div>
            <button
              onClick={handleAddLineType}
              className="px-8 py-4 bg-white border-2 border-dashed border-purple-200 text-primary font-black rounded-[2rem] text-sm hover:border-primary hover:bg-purple-50 transition-all"
            >
              + AÑADIR NUEVO TIPO
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {localSettings.lineTypes.map((lt, idx) => (
              <div key={idx} className="bento-card border-t-8 border-t-primary/20 hover:border-t-primary transition-all">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <input
                      value={lt.label}
                      onChange={(e) => {
                        const next = [...localSettings.lineTypes]; next[idx].label = e.target.value; setLocalSettings({ ...localSettings, lineTypes: next });
                      }}
                      className="text-2xl font-black text-gray-900 bg-transparent outline-none w-full"
                    />
                    <input
                      value={lt.codeType}
                      onChange={(e) => {
                        const next = [...localSettings.lineTypes]; next[idx].codeType = e.target.value; setLocalSettings({ ...localSettings, lineTypes: next });
                      }}
                      className="text-[10px] font-black text-purple-300 uppercase tracking-widest bg-transparent outline-none"
                    />
                  </div>
                  <button
                    onClick={() => setLocalSettings({ ...localSettings, lineTypes: localSettings.lineTypes.filter((_, i) => i !== idx) })}
                    className="text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Configuration Switches */}
                  <div className="grid grid-cols-3 gap-2 py-4 border-y border-purple-50">
                    <div className={`flex flex-col items-center gap-2 p-2 rounded-xl transition-all ${lt.requiresModel ? 'bg-primary/10 text-primary' : 'bg-gray-50 text-gray-300'}`}>
                      <input type="checkbox" className="hidden" checked={lt.requiresModel} onChange={(e) => {
                        const next = [...localSettings.lineTypes]; next[idx].requiresModel = e.target.checked; setLocalSettings({ ...localSettings, lineTypes: next });
                      }} />
                      <div onClick={() => {
                        const next = [...localSettings.lineTypes]; next[idx].requiresModel = !lt.requiresModel; setLocalSettings({ ...localSettings, lineTypes: next });
                      }} className="cursor-pointer font-black text-[9px] uppercase">Modelo</div>
                    </div>
                    <div className={`flex flex-col items-center gap-2 p-2 rounded-xl transition-all ${lt.requiresColor ? 'bg-primary/10 text-primary' : 'bg-gray-50 text-gray-300'}`}>
                      <input type="checkbox" className="hidden" checked={lt.requiresColor} onChange={(e) => {
                        const next = [...localSettings.lineTypes]; next[idx].requiresColor = e.target.checked; setLocalSettings({ ...localSettings, lineTypes: next });
                      }} />
                      <div onClick={() => {
                        const next = [...localSettings.lineTypes]; next[idx].requiresColor = !lt.requiresColor; setLocalSettings({ ...localSettings, lineTypes: next });
                      }} className="cursor-pointer font-black text-[9px] uppercase">Color</div>
                    </div>
                    <div className={`flex flex-col items-center gap-2 p-2 rounded-xl transition-all ${lt.requiresName ? 'bg-primary/10 text-primary' : 'bg-gray-50 text-gray-300'}`}>
                      <input type="checkbox" className="hidden" checked={lt.requiresName} onChange={(e) => {
                        const next = [...localSettings.lineTypes]; next[idx].requiresName = e.target.checked; setLocalSettings({ ...localSettings, lineTypes: next });
                      }} />
                      <div onClick={() => {
                        const next = [...localSettings.lineTypes]; next[idx].requiresName = !lt.requiresName; setLocalSettings({ ...localSettings, lineTypes: next });
                      }} className="cursor-pointer font-black text-[9px] uppercase">Nombre</div>
                    </div>
                  </div>

                  {/* Prices */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100">
                      <label className="block text-[9px] font-black text-purple-300 uppercase tracking-widest mb-1">PVD Catálogo</label>
                      <input
                        type="number" step="0.01"
                        value={lt.defaultPVDUnit}
                        onChange={(e) => {
                          const next = [...localSettings.lineTypes]; next[idx].defaultPVDUnit = parseFloat(e.target.value); setLocalSettings({ ...localSettings, lineTypes: next });
                        }}
                        className="w-full bg-transparent font-black text-gray-900 text-lg outline-none"
                      />
                    </div>
                    <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100">
                      <label className="block text-[9px] font-black text-purple-300 uppercase tracking-widest mb-1">PVP Sugerido</label>
                      <input
                        type="number" step="0.01"
                        value={lt.defaultPVPUnit}
                        onChange={(e) => {
                          const next = [...localSettings.lineTypes]; next[idx].defaultPVPUnit = parseFloat(e.target.value); setLocalSettings({ ...localSettings, lineTypes: next });
                        }}
                        className="w-full bg-transparent font-black text-gray-900 text-lg outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-[10px] font-black text-purple-300 uppercase tracking-widest">Configuración de SKU</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        placeholder="Prefijo..."
                        value={lt.skuPrefix}
                        onChange={(e) => {
                          const next = [...localSettings.lineTypes]; next[idx].skuPrefix = e.target.value; setLocalSettings({ ...localSettings, lineTypes: next });
                        }}
                        className="w-full min-w-0 bg-white border border-purple-100 p-3 rounded-xl text-[10px] font-bold outline-none focus:border-primary transition-all"
                      />
                      <input
                        placeholder="SKU Fijo"
                        value={lt.skuFixed}
                        onChange={(e) => {
                          const next = [...localSettings.lineTypes]; next[idx].skuFixed = e.target.value; setLocalSettings({ ...localSettings, lineTypes: next });
                        }}
                        className="w-full min-w-0 bg-white border border-purple-100 p-3 rounded-xl text-[10px] font-bold outline-none focus:border-primary transition-all"
                      />
                    </div>
                  </div>

                  {/* Equivalence */}
                  <div className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Unidad Equivalencia</span>
                    <input
                      type="number"
                      value={lt.equivalenceUnits}
                      onChange={(e) => {
                        const next = [...localSettings.lineTypes]; next[idx].equivalenceUnits = parseInt(e.target.value); setLocalSettings({ ...localSettings, lineTypes: next });
                      }}
                      className="w-16 bg-transparent text-right font-black text-primary outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;

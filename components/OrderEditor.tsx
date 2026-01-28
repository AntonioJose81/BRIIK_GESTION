import React, { useState } from 'react';
import { Store, Order, OrderLine, AppSettings } from '../types';
import { generateId } from '../utils';
import { pdfService } from '../services/pdfService';

interface OrderEditorProps {
  order: Order;
  store: Store;
  settings: AppSettings;
  onSave: (order: Order) => void;
  onCancel: () => void;
  onUpdateSettings?: (settings: AppSettings) => void; // Optional to update next invoice number
}

const OrderEditor: React.FC<OrderEditorProps> = ({ order, store, settings, onSave, onCancel, onUpdateSettings }) => {
  const [localOrder, setLocalOrder] = useState<Order>(JSON.parse(JSON.stringify(order)));

  const handleGenerateInvoice = () => {
    if (localOrder.invoiceNumber) return;
    const invNum = `${settings.billing.invoicePrefix}${settings.billing.nextInvoiceNumber.toString().padStart(4, '0')}`;
    const updatedOrder = { ...localOrder, invoiceNumber: invNum };
    setLocalOrder(updatedOrder);

    // Increment next invoice number in settings if callback exists
    if (onUpdateSettings) {
      const nextSettings = { ...settings, billing: { ...settings.billing, nextInvoiceNumber: settings.billing.nextInvoiceNumber + 1 } };
      onUpdateSettings(nextSettings);
    }
  };

  // Totals calculations
  const subtotalPVD = localOrder.lines.reduce((acc, l) => acc + (l.qty * l.pvdUnit), 0);
  const equivUnits = localOrder.lines.reduce((acc, l) => {
    const lt = settings.lineTypes.find(t => t.codeType === l.type);
    return acc + (l.qty * (lt?.equivalenceUnits || 1));
  }, 0);
  const realUnits = localOrder.lines.reduce((acc, l) => acc + l.qty, 0);
  const isFreeShipping = localOrder.shippingOverride || (subtotalPVD >= localOrder.freeFromPVD);
  const finalShipping = isFreeShipping ? 0 : localOrder.shippingCost;
  const totalPVD = subtotalPVD + finalShipping;

  const hasPersonalized = localOrder.lines.some(l => {
    const lt = settings.lineTypes.find(t => t.codeType === l.type);
    return lt?.requiresName;
  });

  const generateSKU = (line: OrderLine) => {
    const lt = settings.lineTypes.find(t => t.codeType === line.type);
    if (!lt) return "UNKNOWN";
    if (lt.skuFixed) return lt.skuFixed;

    let sku = lt.skuPrefix;
    if (lt.requiresModel) sku += `-${line.model || 'MODEL'}`;
    if (lt.requiresColor) sku += `-${line.color || 'COLOR'}`;
    if (lt.requiresName) {
      let cleanName = line.name || 'NAME';
      if (settings.rules.nameNormalize) {
        cleanName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1).toLowerCase();
      }
      sku += `-${cleanName.replace(/\s+/g, '')}`;
    }
    return sku.toUpperCase();
  };

  const handleAddLine = () => {
    const defaultType = settings.lineTypes[0];
    const newLine: OrderLine = {
      id: generateId(),
      type: defaultType.codeType,
      model: settings.models[0]?.code || '',
      color: settings.colors[0]?.code || '',
      name: '',
      qty: 1,
      sku: '',
      pvdUnit: defaultType.defaultPVDUnit,
      pvpUnit: defaultType.defaultPVPUnit
    };
    newLine.sku = generateSKU(newLine);
    setLocalOrder({ ...localOrder, lines: [...localOrder.lines, newLine] });
  };

  const updateLine = (id: string, updates: Partial<OrderLine>) => {
    const nextLines = localOrder.lines.map(l => {
      if (l.id !== id) return l;
      const updated = { ...l, ...updates };

      if (updates.type || updates.model || updates.color || updates.name) {
        updated.sku = generateSKU(updated);
      }

      if (updates.type) {
        const lt = settings.lineTypes.find(t => t.codeType === updates.type);
        if (lt) {
          updated.pvdUnit = lt.defaultPVDUnit;
          updated.pvpUnit = lt.defaultPVPUnit;
        }
      }
      return updated;
    });
    setLocalOrder({ ...localOrder, lines: nextLines });
  };

  const removeLine = (id: string) => {
    setLocalOrder({ ...localOrder, lines: localOrder.lines.filter(l => l.id !== id) });
  };

  const updateOrder = (field: keyof Order, value: any) => {
    setLocalOrder(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-6xl mx-auto animate-slide-up pb-20">
      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-purple-100/50 border border-purple-50 overflow-hidden">
        {/* Editor Header */}
        <div className="px-10 py-8 border-b border-purple-50 flex flex-col md:flex-row justify-between items-center gap-6 bg-purple-50/20">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={localOrder.number}
                  onChange={(e) => updateOrder('number', e.target.value)}
                  className="text-2xl font-black text-gray-900 bg-transparent border-b-2 border-primary/20 focus:border-primary outline-none transition-all w-48 tracking-tighter"
                />
                <span className="text-purple-300 font-bold px-3 py-1 bg-white rounded-lg border border-purple-100 text-xs uppercase tracking-widest">{localOrder.date}</span>
                {localOrder.invoiceNumber && (
                  <span className="text-emerald-500 font-extrabold px-3 py-1 bg-emerald-50 rounded-lg border border-emerald-100 text-xs uppercase tracking-widest">Factura: {localOrder.invoiceNumber}</span>
                )}
              </div>
              <p className="text-sm font-bold text-gray-500 mt-1 uppercase tracking-wider">Editando pedido para <span className="text-primary">{store.name}</span></p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <select
              value={localOrder.status}
              onChange={(e) => updateOrder('status', e.target.value)}
              className="bg-white border border-purple-100 rounded-xl px-5 py-3 text-sm font-black focus:ring-4 focus:ring-primary/10 transition-all outline-none"
            >
              {settings.statuses.map(s => (
                <option key={s.name} value={s.name}>{s.name.toUpperCase()}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={onCancel}
                className="px-6 py-3 text-gray-400 font-black text-sm hover:text-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => onSave(localOrder)}
                className="px-8 py-3 bg-primary text-white font-black rounded-xl text-sm shadow-xl shadow-purple-200 hover:bg-primary-light hover:scale-105 transition-all"
              >
                Finalizar Cambios
              </button>
            </div>
          </div>
        </div>

        {/* MOQ & Rules Info */}
        <div className="px-10 py-5 bg-white border-b border-purple-50 flex flex-wrap gap-8 items-center justify-center md:justify-start">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center font-bold text-xs border border-orange-100 italic">MOQ</span>
            <span className="text-sm font-bold text-gray-600">Portes gratis desde <span className="text-primary">{localOrder.freeFromPVD}€</span></span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center font-bold text-xs border border-orange-100 italic">MIN</span>
            <span className="text-sm font-bold text-gray-600">Pedido mínimo: <span className="text-primary">{settings.rules.moq} unidades</span></span>
          </div>
        </div>

        {/* Lines Editor */}
        <div className="p-0">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-purple-50/30 text-[10px] font-black text-purple-300 uppercase tracking-[0.2em] border-b border-purple-50">
                <th className="px-10 py-6">Producto / Tipo</th>
                <th className="px-6 py-6">Configuración</th>
                <th className="px-6 py-6 text-center">Cant.</th>
                <th className="px-6 py-6 text-right">PVD Unit.</th>
                <th className="px-6 py-6 text-right">Subtotal</th>
                <th className="px-10 py-6 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-50">
              {localOrder.lines.map(line => {
                const lineType = settings.lineTypes.find(t => t.codeType === line.type);
                const hasWarning = lineType?.minOrderQty && line.qty < lineType.minOrderQty;

                return (
                  <tr key={line.id} className={`group transition-colors ${hasWarning ? 'bg-orange-50/30' : 'hover:bg-purple-50/20'}`}>
                    <td className="px-10 py-6">
                      <select
                        value={line.type}
                        onChange={(e) => updateLine(line.id, { type: e.target.value })}
                        className="font-black text-gray-900 bg-transparent border-none focus:ring-0 text-lg tracking-tighter"
                      >
                        {settings.lineTypes.map(lt => (
                          <option key={lt.codeType} value={lt.codeType}>{lt.name}</option>
                        ))}
                      </select>
                      <p className="text-[10px] text-purple-300 font-black mt-1 uppercase tracking-widest">{line.sku}</p>
                    </td>
                    <td className="px-6 py-6 space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {lineType?.requiresModel && (
                          <select
                            value={line.model}
                            onChange={(e) => updateLine(line.id, { model: e.target.value })}
                            className="bg-white border border-purple-100 rounded-lg px-3 py-1.5 text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                          >
                            <option value="">Seleccionar Modelo</option>
                            {settings.models.map(m => <option key={m.code} value={m.code}>{m.name}</option>)}
                          </select>
                        )}
                        {lineType?.requiresColor && (
                          <select
                            value={line.color}
                            onChange={(e) => updateLine(line.id, { color: e.target.value })}
                            className="bg-white border border-purple-100 rounded-lg px-3 py-1.5 text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                          >
                            <option value="">Seleccionar Color</option>
                            {settings.colors.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                          </select>
                        )}
                        {lineType?.requiresName && (
                          <input
                            type="text"
                            placeholder="Introduce nombre..."
                            value={line.name}
                            onChange={(e) => updateLine(line.id, { name: e.target.value })}
                            className="bg-white border border-purple-100 rounded-lg px-3 py-1.5 text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none flex-1 min-w-[150px]"
                          />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <div className="inline-flex items-center gap-2 bg-purple-50 rounded-xl p-1.5 border border-purple-100/50">
                        <button onClick={() => updateLine(line.id, { qty: Math.max(1, line.qty - 1) })} className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-primary font-black hover:bg-primary-light hover:text-white transition-all shadow-sm">－</button>
                        <input
                          type="number"
                          value={line.qty}
                          onChange={(e) => updateLine(line.id, { qty: parseInt(e.target.value) || 0 })}
                          className="w-12 text-center bg-transparent font-black text-gray-900 border-none focus:ring-0 p-0"
                        />
                        <button onClick={() => updateLine(line.id, { qty: line.qty + 1 })} className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-primary font-black hover:bg-primary-light hover:text-white transition-all shadow-sm">＋</button>
                      </div>
                      {hasWarning && <p className="text-[9px] text-orange-500 font-black mt-2 uppercase tracking-wide text-center">Min. {lineType.minOrderQty}u.</p>}
                    </td>
                    <td className="px-6 py-6 text-right font-black text-gray-600">
                      {line.pvdUnit.toFixed(2)}€
                    </td>
                    <td className="px-6 py-6 text-right">
                      <span className="font-black text-gray-900 text-lg">{(line.qty * line.pvdUnit).toFixed(2)}€</span>
                    </td>
                    <td className="px-10 py-6 text-center">
                      <button onClick={() => removeLine(line.id)} className="text-purple-200 hover:text-red-500 transition-all p-2 rounded-xl hover:bg-red-50">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="p-10 border-t border-purple-50 bg-purple-50/10 flex justify-center">
            <button
              onClick={handleAddLine}
              className="px-10 py-4 bg-white border-2 border-dashed border-purple-200 rounded-[2rem] text-primary font-black text-sm hover:border-primary hover:bg-purple-50 transition-all active:scale-95 flex items-center gap-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
              AÑADIR LÍNEA DE PRODUCTO
            </button>
          </div>
        </div>

        {/* Alerts section */}
        <div className="px-10 py-6 bg-orange-50/20 border-t border-purple-50 space-y-2">
          <h4 className="font-black text-orange-700 text-[10px] uppercase tracking-widest mb-3 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m12 14 4-4" /><path d="M3.34 19a2 2 0 0 1 0-2l9-15a2 2 0 0 1 3.32 0l9 15a2 2 0 0 1-1.66 3H5a2 2 0 0 1-1.66-1Z" /><path d="M12 9h.01" /><path d="M12 18h.01" /></svg>
            Avisos del Pedido
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {realUnits < settings.rules.moq && (
              <div className="flex items-center gap-3 text-orange-700 font-bold text-xs bg-white p-3 rounded-xl border border-orange-100">
                <span className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center text-[10px]">!</span>
                El pedido no alcanza el MOQ ({settings.rules.moq} uds).
              </div>
            )}
            {hasPersonalized && (
              <div className="flex items-center gap-3 text-purple-700 font-bold text-xs bg-white p-3 rounded-xl border border-purple-100">
                <span className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center text-[10px]">i</span>
                Contiene productos personalizados. Revisar nombres.
              </div>
            )}
          </div>
        </div>

        {/* Footer Totals */}
        <div className="px-10 py-10 bg-white border-t border-purple-100 flex flex-col md:flex-row justify-between items-end md:items-center gap-10">
          <div className="flex-1 max-w-lg">
            <label className="block text-[10px] font-black text-purple-300 uppercase tracking-[0.2em] mb-3">Notas Internas</label>
            <textarea
              value={localOrder.notes}
              onChange={(e) => updateOrder('notes', e.target.value)}
              className="w-full bg-purple-50/30 border border-purple-100 p-6 rounded-3xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-none resize-none h-28"
              placeholder="Instrucciones especiales..."
            />
          </div>

          <div className="w-full md:w-80 border-l-0 md:border-l border-purple-50 pl-0 md:pl-10">
            <div className="space-y-4 text-right md:text-left">
              <div className="flex justify-between text-gray-500 font-bold text-sm items-center">
                <span className="uppercase text-[10px] tracking-widest text-purple-300">Subtotal PVD</span>
                <span className="font-black text-gray-800 text-lg">{subtotalPVD.toFixed(2)}€</span>
              </div>
              <div className="flex justify-between text-gray-500 font-bold text-sm items-center">
                <span className="uppercase text-[10px] tracking-widest text-purple-300">Envío ({isFreeShipping ? 'Gratis' : 'Estándar'})</span>
                <div className="flex items-center gap-4">
                  {subtotalPVD < localOrder.freeFromPVD && (
                    <button
                      onClick={() => updateOrder('shippingOverride', !localOrder.shippingOverride)}
                      className={`text-[9px] font-black px-3 py-1.5 rounded-xl transition-all border ${localOrder.shippingOverride ? 'bg-green-500 text-white border-green-600 shadow-md' : 'bg-purple-50 text-primary border-purple-100 hover:bg-white hover:shadow-sm'}`}
                    >
                      {localOrder.shippingOverride ? 'BONIFICADO ✓' : 'QUITAR GASTOS'}
                    </button>
                  )}
                  <span className={`${isFreeShipping ? 'text-green-500 font-black' : 'font-black text-primary'} text-lg`}>
                    {isFreeShipping ? '0.00€' : `${finalShipping.toFixed(2)}€`}
                  </span>
                </div>
              </div>
              <div className="pt-4 mt-2 border-t border-purple-100 flex justify-between items-center">
                <span className="text-gray-900 font-black text-xl tracking-tighter uppercase">Total PVD</span>
                <span className="text-4xl font-black text-primary tracking-tighter">{totalPVD.toFixed(2)}<span className="text-lg ml-1 font-black">€</span></span>
              </div>
              <div className="pt-2 text-center md:text-right space-y-4">
                <p className="text-[9px] text-purple-300 font-black uppercase tracking-widest">Capacidad ocupada: <span className="text-gray-800 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-100">{equivUnits} eq.</span></p>

                <div className="flex flex-col items-end gap-3 mb-4">
                  <p className="text-[10px] font-black text-purple-300 uppercase tracking-widest text-right">
                    Emisor: <span className="text-gray-900">{settings.billing.companyName || 'Sin configurar'}</span><br />
                    <span className="text-[8px] italic font-bold text-gray-400 normal-case">Gestiona tus datos fiscales en Ajustes ⚙️</span>
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 justify-end">
                  <button
                    onClick={() => pdfService.generatePDF(localOrder, store, settings, 'delivery_note')}
                    className="px-4 py-2 bg-white border border-purple-100 text-primary font-black rounded-xl text-[10px] uppercase hover:bg-purple-50 transition-all flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                    PDF Albarán
                  </button>

                  {localOrder.invoiceNumber ? (
                    <button
                      onClick={() => pdfService.generatePDF(localOrder, store, settings, 'invoice')}
                      className="px-4 py-2 bg-emerald-500 text-white font-black rounded-xl text-[10px] uppercase hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100 flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                      PDF Factura
                    </button>
                  ) : (
                    <button
                      onClick={handleGenerateInvoice}
                      className="px-4 py-2 bg-primary text-white font-black rounded-xl text-[10px] uppercase hover:opacity-90 transition-all shadow-lg shadow-purple-100"
                    >
                      Generar Factura
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderEditor;

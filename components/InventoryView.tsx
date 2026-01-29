
import React, { useState, useMemo } from 'react';
import { Store, AppSettings, Deposit, SupplierInvoice, RawStock, ProductStock, Model, Color } from '../types';
import { generateId } from '../utils';

interface InventoryViewProps {
    stores: Store[];
    settings: AppSettings;
    deposits: Deposit[];
    supplierInvoices: SupplierInvoice[];
    rawStock: RawStock[];
    productStock: ProductStock[];
    onSaveDeposit: (deposit: Deposit) => void;
    onDeleteDeposit: (id: string) => void;
    onSaveInvoice: (invoice: SupplierInvoice) => void;
    onDeleteInvoice: (id: string) => void;
    onSaveRawStock: (stock: RawStock) => void;
    onDeleteRawStock: (id: string) => void;
    onSaveProductStock: (stock: ProductStock) => void;
    onClose: () => void;
}

const InventoryView: React.FC<InventoryViewProps> = ({
    stores, settings, deposits, supplierInvoices, rawStock, productStock,
    onSaveDeposit, onDeleteDeposit, onSaveInvoice, onDeleteInvoice,
    onSaveRawStock, onDeleteRawStock, onSaveProductStock, onClose
}) => {
    const [activeTab, setActiveTab] = useState<'deposits' | 'invoices' | 'raw' | 'manufactured'>('deposits');

    // Modals
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [isRawModalOpen, setIsRawModalOpen] = useState(false);

    const [editingItem, setEditingItem] = useState<any>(null);

    return (
        <div className="max-w-7xl mx-auto space-y-10 animate-fade-in pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h2 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">Almacén y Logística</h2>
                    <p className="text-purple-300 font-bold uppercase tracking-widest text-xs mt-1">Control de stock, depósitos y costes de proveedores</p>
                </div>
                <div className="flex bg-white p-1.5 rounded-[1.5rem] border border-purple-100 shadow-sm overflow-hidden">
                    <button
                        onClick={() => setActiveTab('deposits')}
                        className={`px-6 py-2.5 rounded-2xl text-xs font-black transition-all ${activeTab === 'deposits' ? 'bg-primary text-white shadow-lg shadow-purple-200' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        DEPÓSITOS
                    </button>
                    <button
                        onClick={() => setActiveTab('invoices')}
                        className={`px-6 py-2.5 rounded-2xl text-xs font-black transition-all ${activeTab === 'invoices' ? 'bg-primary text-white shadow-lg shadow-purple-200' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        FACTURAS
                    </button>
                    <button
                        onClick={() => setActiveTab('raw')}
                        className={`px-6 py-2.5 rounded-2xl text-xs font-black transition-all ${activeTab === 'raw' ? 'bg-primary text-white shadow-lg shadow-purple-200' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        MATERIA PRIMA
                    </button>
                    <button
                        onClick={() => setActiveTab('manufactured')}
                        className={`px-6 py-2.5 rounded-2xl text-xs font-black transition-all ${activeTab === 'manufactured' ? 'bg-primary text-white shadow-lg shadow-purple-200' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        FABRICADOS
                    </button>
                </div>
                <button
                    onClick={onClose}
                    className="bg-white border border-purple-100 px-6 py-3 rounded-2xl text-primary font-black text-xs hover:shadow-xl hover:-translate-y-1 transition-all active:scale-95 uppercase tracking-widest"
                >
                    Volver
                </button>
            </div>

            {/* Content Area */}
            {activeTab === 'deposits' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-2xl font-black text-gray-800 tracking-tight">Productos en Depósito</h3>
                        <button
                            onClick={() => { setEditingItem(null); setIsDepositModalOpen(true); }}
                            className="bg-primary text-white px-8 py-3.5 rounded-2xl text-sm font-black shadow-lg shadow-purple-200 hover:bg-primary-light hover:scale-105 transition-all"
                        >
                            + REGISTRAR DEPÓSITO
                        </button>
                    </div>

                    <div className="bg-white rounded-[2.5rem] shadow-xl shadow-purple-100/30 border border-purple-50 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-purple-50/30 text-[10px] font-black text-purple-300 uppercase tracking-widest border-b border-purple-50">
                                    <th className="px-10 py-6">Tienda</th>
                                    <th className="px-6 py-6">Producto</th>
                                    <th className="px-6 py-6">Cantidad</th>
                                    <th className="px-6 py-6">Fecha</th>
                                    <th className="px-10 py-6 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-purple-50">
                                {deposits.length === 0 ? (
                                    <tr><td colSpan={5} className="p-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">No hay depósitos registrados</td></tr>
                                ) : (
                                    deposits.map(d => (
                                        <tr key={d.id} className="group hover:bg-purple-50/20 transition-all">
                                            <td className="px-10 py-6 font-black text-gray-900">{stores.find(s => s.id === d.storeId)?.name || 'Tienda Desconocida'}</td>
                                            <td className="px-6 py-6 font-bold text-gray-700">{d.productName}</td>
                                            <td className="px-6 py-6 font-black text-primary text-lg">{d.qty} <span className="text-[10px] text-purple-300">uds</span></td>
                                            <td className="px-6 py-6 text-sm text-gray-500 font-bold">{d.date}</td>
                                            <td className="px-10 py-6">
                                                <div className="flex gap-4 justify-center">
                                                    <button onClick={() => { setEditingItem(d); setIsDepositModalOpen(true); }} className="text-primary hover:scale-110 transition-all p-1">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                                                    </button>
                                                    <button onClick={() => { if (confirm('¿Eliminar registro?')) onDeleteDeposit(d.id); }} className="text-red-300 hover:text-red-500 hover:scale-110 transition-all p-1">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'invoices' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-2xl font-black text-gray-800 tracking-tight">Gastos y Facturas de Proveedores</h3>
                        <button
                            onClick={() => { setEditingItem(null); setIsInvoiceModalOpen(true); }}
                            className="bg-primary text-white px-8 py-3.5 rounded-2xl text-sm font-black shadow-lg shadow-purple-200 hover:bg-primary-light hover:scale-105 transition-all"
                        >
                            + AÑADIR FACTURA
                        </button>
                    </div>

                    <div className="bg-white rounded-[2.5rem] shadow-xl shadow-purple-100/30 border border-purple-50 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-purple-50/30 text-[10px] font-black text-purple-300 uppercase tracking-widest border-b border-purple-50">
                                    <th className="px-10 py-6">Proveedor</th>
                                    <th className="px-6 py-6">Nº Factura</th>
                                    <th className="px-6 py-6">Fecha</th>
                                    <th className="px-6 py-6 text-right">Importe</th>
                                    <th className="px-10 py-6 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-purple-50">
                                {supplierInvoices.length === 0 ? (
                                    <tr><td colSpan={5} className="p-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">No hay facturas registradas</td></tr>
                                ) : (
                                    supplierInvoices.map(i => (
                                        <tr key={i.id} className="group hover:bg-purple-50/20 transition-all">
                                            <td className="px-10 py-6 font-black text-gray-900">{i.supplierName}</td>
                                            <td className="px-6 py-6 font-bold text-gray-500">{i.invoiceNumber || 'S/N'}</td>
                                            <td className="px-6 py-6 text-sm text-gray-500 font-bold">{i.date}</td>
                                            <td className="px-6 py-6 text-right font-black text-lg text-emerald-600">{i.amount.toFixed(2)}<span className="text-xs ml-0.5">€</span></td>
                                            <td className="px-10 py-6">
                                                <div className="flex gap-4 justify-center">
                                                    <button onClick={() => { setEditingItem(i); setIsInvoiceModalOpen(true); }} className="text-primary hover:scale-110 transition-all p-1">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                                                    </button>
                                                    <button onClick={() => { if (confirm('¿Eliminar factura?')) onDeleteInvoice(i.id); }} className="text-red-300 hover:text-red-500 hover:scale-110 transition-all p-1">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'raw' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-2xl font-black text-gray-800 tracking-tight">Stock de Materia Prima</h3>
                        <button
                            onClick={() => { setEditingItem(null); setIsRawModalOpen(true); }}
                            className="bg-primary text-white px-8 py-3.5 rounded-2xl text-sm font-black shadow-lg shadow-purple-200 hover:bg-primary-light hover:scale-105 transition-all"
                        >
                            + AÑADIR ITEM
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {rawStock.map(s => (
                            <div key={s.id} className="bento-card group hover:scale-[1.02] transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-[10px] font-black text-purple-300 uppercase tracking-widest leading-none bg-purple-50 px-2 py-1 rounded-full">{s.unit}</span>
                                    <div className="flex gap-2">
                                        <button onClick={() => { setEditingItem(s); setIsRawModalOpen(true); }} className="text-gray-300 hover:text-primary transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg></button>
                                        <button onClick={() => { if (confirm('¿Eliminar?')) onDeleteRawStock(s.id); }} className="text-gray-300 hover:text-red-500 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg></button>
                                    </div>
                                </div>
                                <h4 className="text-xl font-black text-gray-900 mb-1">{s.itemName}</h4>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">PROV: {s.supplierName || 'NO ASIGNADO'}</p>
                                <div className="flex items-end justify-between">
                                    <span className="text-4xl font-black text-primary leading-none">{s.qty}<span className="text-sm ml-1 opacity-40 uppercase tracking-tight">{s.unit}</span></span>
                                    <div className={`w-3 h-3 rounded-full ${s.qty < 5 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'manufactured' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-2xl font-black text-gray-800 tracking-tight">Stock de Productos Fabricados</h3>
                        <p className="text-sm font-bold text-purple-300 uppercase tracking-widest">Actualización manual por lote</p>
                    </div>

                    <div className="bg-white rounded-[2.5rem] shadow-xl shadow-purple-100/30 border border-purple-50 p-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                            {settings.models.map(model => (
                                <div key={model.code} className="space-y-4">
                                    <h4 className="font-black text-gray-900 border-b border-purple-50 pb-2 flex items-center gap-3">
                                        <span className="bg-primary text-white w-8 h-8 rounded-xl flex items-center justify-center text-[10px] italic">B</span>
                                        {model.name}
                                    </h4>
                                    <div className="space-y-2">
                                        {settings.colors.map(color => {
                                            const stockItem = productStock.find(ps => ps.modelCode === model.code && ps.colorCode === color.code);
                                            const currentQty = stockItem?.qty || 0;

                                            return (
                                                <div key={color.code} className="flex items-center justify-between p-3 bg-purple-50/50 rounded-2xl group hover:bg-white border border-transparent hover:border-purple-100 transition-all">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-4 h-4 rounded-full border border-purple-100 shadow-inner" style={{ backgroundColor: color.name.toLowerCase() }}></div>
                                                        <span className="text-sm font-bold text-gray-600 truncate max-w-[120px]">{color.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => onSaveProductStock({ id: stockItem?.id || '', modelCode: model.code, colorCode: color.code, qty: Math.max(0, currentQty - 1) })}
                                                            className="w-8 h-8 bg-white border border-purple-100 rounded-xl flex items-center justify-center font-black text-gray-400 hover:text-primary hover:border-primary/30 transition-all"
                                                        > - </button>
                                                        <span className={`w-12 text-center font-black text-lg ${currentQty === 0 ? 'text-red-400' : 'text-gray-900'}`}>{currentQty}</span>
                                                        <button
                                                            onClick={() => onSaveProductStock({ id: stockItem?.id || '', modelCode: model.code, colorCode: color.code, qty: currentQty + 1 })}
                                                            className="w-8 h-8 bg-white border border-purple-100 rounded-xl flex items-center justify-center font-black text-gray-400 hover:text-primary hover:border-primary/30 transition-all"
                                                        > + </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Modals */}
            {isDepositModalOpen && (
                <Modal title={editingItem ? "Editar Depósito" : "Nuevo Depósito"} onClose={() => setIsDepositModalOpen(false)}>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        const fd = new FormData(e.currentTarget);
                        onSaveDeposit({
                            id: editingItem?.id || generateId(),
                            storeId: fd.get('storeId') as string,
                            productName: fd.get('productName') as string,
                            qty: parseInt(fd.get('qty') as string),
                            date: fd.get('date') as string,
                            notes: fd.get('notes') as string
                        });
                        setIsDepositModalOpen(false);
                    }} className="space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-purple-300 uppercase tracking-widest mb-1">Tienda Destino</label>
                                <select name="storeId" defaultValue={editingItem?.storeId} required className="w-full bg-purple-50 border border-purple-100 p-4 rounded-2xl font-bold outline-none">
                                    <option value="">Seleccione tienda...</option>
                                    {stores.map(s => <option key={s.id} value={s.id}>{s.name} ({s.city})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-purple-300 uppercase tracking-widest mb-1">Producto</label>
                                <input name="productName" defaultValue={editingItem?.productName} required className="w-full bg-purple-50 border border-purple-100 p-4 rounded-2xl font-bold outline-none" placeholder="Nombre del producto..." />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-purple-300 uppercase tracking-widest mb-1">Cantidad</label>
                                    <input name="qty" type="number" defaultValue={editingItem?.qty || 1} required className="w-full bg-purple-50 border border-purple-100 p-4 rounded-2xl font-black outline-none" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-purple-300 uppercase tracking-widest mb-1">Fecha</label>
                                    <input name="date" type="date" defaultValue={editingItem?.date || new Date().toISOString().split('T')[0]} required className="w-full bg-purple-50 border border-purple-100 p-4 rounded-2xl font-bold outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-purple-300 uppercase tracking-widest mb-1">Notas</label>
                                <textarea name="notes" defaultValue={editingItem?.notes} className="w-full bg-purple-50 border border-purple-100 p-4 rounded-2xl font-bold outline-none min-h-[100px]" placeholder="Observaciones..." />
                            </div>
                        </div>
                        <button type="submit" className="w-full bg-primary text-white py-4 rounded-3xl font-black shadow-xl hover:bg-primary-light transition-all">GUARDAR REGISTRO</button>
                    </form>
                </Modal>
            )}

            {isInvoiceModalOpen && (
                <Modal title={editingItem ? "Editar Factura" : "Añadir Factura"} onClose={() => setIsInvoiceModalOpen(false)}>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        const fd = new FormData(e.currentTarget);
                        onSaveInvoice({
                            id: editingItem?.id || generateId(),
                            supplierName: fd.get('supplierName') as string,
                            invoiceNumber: fd.get('invoiceNumber') as string,
                            date: fd.get('date') as string,
                            amount: parseFloat(fd.get('amount') as string),
                            notes: fd.get('notes') as string
                        });
                        setIsInvoiceModalOpen(false);
                    }} className="space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-purple-300 uppercase tracking-widest mb-1">Nombre Proveedor</label>
                                <input name="supplierName" defaultValue={editingItem?.supplierName} required className="w-full bg-purple-50 border border-purple-100 p-4 rounded-2xl font-bold outline-none" placeholder="Nombre..." />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-purple-300 uppercase tracking-widest mb-1">Nº Factura</label>
                                    <input name="invoiceNumber" defaultValue={editingItem?.invoiceNumber} className="w-full bg-purple-50 border border-purple-100 p-4 rounded-2xl font-bold outline-none" placeholder="EXP-123..." />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-purple-300 uppercase tracking-widest mb-1">Fecha</label>
                                    <input name="date" type="date" defaultValue={editingItem?.date || new Date().toISOString().split('T')[0]} required className="w-full bg-purple-50 border border-purple-100 p-4 rounded-2xl font-bold outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-purple-300 uppercase tracking-widest mb-1">Importe Total (IVA inc.)</label>
                                <input name="amount" type="number" step="0.01" defaultValue={editingItem?.amount || 0} required className="w-full bg-purple-50 border border-purple-100 p-4 rounded-2xl font-black text-primary text-xl outline-none" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-purple-300 uppercase tracking-widest mb-1">Notas / Itemizados</label>
                                <textarea name="notes" defaultValue={editingItem?.notes} className="w-full bg-purple-50 border border-purple-100 p-4 rounded-2xl font-bold outline-none min-h-[100px]" placeholder="¿Qué se ha comprado?..." />
                            </div>
                        </div>
                        <button type="submit" className="w-full bg-primary text-white py-4 rounded-3xl font-black shadow-xl hover:bg-primary-light transition-all">GUARDAR FACTURA</button>
                    </form>
                </Modal>
            )}

            {isRawModalOpen && (
                <Modal title={editingItem ? "Editar Item" : "Añadir Item"} onClose={() => setIsRawModalOpen(false)}>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        const fd = new FormData(e.currentTarget);
                        onSaveRawStock({
                            id: editingItem?.id || generateId(),
                            itemName: fd.get('itemName') as string,
                            qty: parseFloat(fd.get('qty') as string),
                            unit: fd.get('unit') as string,
                            supplierName: fd.get('supplierName') as string
                        });
                        setIsRawModalOpen(false);
                    }} className="space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-purple-300 uppercase tracking-widest mb-1">Concepto / Item</label>
                                <input name="itemName" defaultValue={editingItem?.itemName} required className="w-full bg-purple-50 border border-purple-100 p-4 rounded-2xl font-bold outline-none" placeholder="Ej: Filamento PLA Blanco" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-purple-300 uppercase tracking-widest mb-1">Cantidad Actual</label>
                                    <input name="qty" type="number" step="0.1" defaultValue={editingItem?.qty || 0} required className="w-full bg-purple-50 border border-purple-100 p-4 rounded-2xl font-black outline-none" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-purple-300 uppercase tracking-widest mb-1">Unidad</label>
                                    <input name="unit" defaultValue={editingItem?.unit || 'uds'} required className="w-full bg-purple-50 border border-purple-100 p-4 rounded-2xl font-bold outline-none" placeholder="Kg, uds, rollos..." />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-purple-300 uppercase tracking-widest mb-1">Proveedor Habitual</label>
                                <input name="supplierName" defaultValue={editingItem?.supplierName} className="w-full bg-purple-50 border border-purple-100 p-4 rounded-2xl font-bold outline-none" placeholder="Nombre..." />
                            </div>
                        </div>
                        <button type="submit" className="w-full bg-primary text-white py-4 rounded-3xl font-black shadow-xl hover:bg-primary-light transition-all">GUARDAR EN STOCK</button>
                    </form>
                </Modal>
            )}
        </div>
    );
};

const Modal: React.FC<{ title: string; children: React.ReactNode; onClose: () => void }> = ({ title, children, onClose }) => (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-primary/20 backdrop-blur-md animate-fade-in">
        <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md flex flex-col max-h-[90vh] overflow-hidden animate-slide-up border border-purple-100">
            <div className="p-8 border-b border-purple-50 bg-purple-50/50 flex justify-between items-center">
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">{title}</h3>
                <button onClick={onClose} className="bg-white w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-primary shadow-sm hover:shadow transition-all font-bold">✕</button>
            </div>
            <div className="p-8 overflow-y-auto custom-scrollbar">
                {children}
            </div>
        </div>
    </div>
);

export default InventoryView;

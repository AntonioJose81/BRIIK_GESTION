import React, { useState, useEffect, useMemo } from 'react';
import { Store, Order, AppSettings, AppData } from './types';
import { storageService } from './services/storageService';
import { xmlService } from './services/xmlService';
import { DEFAULT_SETTINGS } from './constants';
import { generateId } from './utils';
import SettingsView from './components/SettingsView';
import OrderEditor from './components/OrderEditor';
import DashboardView from './components/DashboardView';
import { supabase } from './services/supabaseClient';
import { supabaseService } from './services/supabaseService';
import { User } from '@supabase/supabase-js';

const App: React.FC = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Store Modal State
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [storeToEdit, setStoreToEdit] = useState<Store | null>(null);

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authEmail, setAuthEmail] = useState("");
  const [authSent, setAuthSent] = useState(false);

  // Auth Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Initial Load from Supabase
  useEffect(() => {
    if (user) {
      setLoading(true);
      supabaseService.loadAllData().then(data => {
        if (data) {
          setStores(data.stores || []);
          setOrders(data.orders || []);
          if (data.settings) setSettings(data.settings);
        }
        setLoading(false);
      });
    } else {
      // Fallback to local storage if not logged in (optional, but keep for now)
      const data = storageService.loadData();
      setStores(data.stores || []);
      setOrders(data.orders || []);
      setSettings(data.settings || DEFAULT_SETTINGS);
      setLoading(false);
    }
  }, [user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await supabaseService.signInWithEmail(authEmail);
      setAuthSent(true);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleLogout = async () => {
    await supabaseService.signOut();
    setUser(null);
  };

  const filteredStores = useMemo(() => {
    return (stores || []).filter(s =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.city.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [stores, searchTerm]);

  const selectedStore = useMemo(() =>
    stores.find(s => s.id === selectedStoreId) || null,
    [stores, selectedStoreId]);

  const storeOrders = useMemo(() =>
    orders.filter(o => o.storeId === selectedStoreId)
      .sort((a, b) => b.number.localeCompare(a.number)),
    [orders, selectedStoreId]);

  const handleExportAll = () => {
    const xmlContent = xmlService.exportToXML({ stores, orders, settings });
    const blob = new Blob([xmlContent], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `briik_pedidos_${new Date().toISOString().split('T')[0]}.xml`;
    a.click();
  };

  const handleImportXML = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (confirm("¿Estás seguro? La importación reemplazará TODOS los datos actuales (Tiendas, Pedidos y Configuración).")) {
      const data = await xmlService.importFromXML(file);
      if (data) {
        setStores(data.stores);
        setOrders(data.orders);
        if (data.settings) setSettings(data.settings);
        alert("Importación completada con éxito.");
      } else {
        alert("Error al importar el archivo. Formato no válido.");
      }
    }
    e.target.value = "";
  };

  const handleOpenStoreModal = (store: Store | null = null) => {
    setStoreToEdit(store);
    setIsStoreModalOpen(true);
    setIsSettingsOpen(false);
    setEditingOrder(null);
  };

  const handleSaveStore = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const city = formData.get('city') as string;

    if (!name) return;

    let storeObj: Store;
    if (storeToEdit) {
      storeObj = {
        ...storeToEdit,
        name,
        city,
        nif: formData.get('nif') as string,
        address: formData.get('address') as string,
        postalCode: formData.get('postalCode') as string,
        province: formData.get('province') as string,
        contact: formData.get('contact') as string,
        phone: formData.get('phone') as string,
        instagram: formData.get('instagram') as string,
        requiresRE: formData.get('requiresRE') === 'on',
      };
      setStores(stores.map(s => s.id === storeToEdit.id ? storeObj : s));
    } else {
      storeObj = {
        id: generateId(), // Temp ID
        name,
        city: city || "Desconocida",
        nif: formData.get('nif') as string,
        address: formData.get('address') as string,
        postalCode: formData.get('postalCode') as string,
        province: formData.get('province') as string,
        contact: formData.get('contact') as string,
        phone: formData.get('phone') as string,
        instagram: formData.get('instagram') as string,
        requiresRE: formData.get('requiresRE') === 'on',
      };
      setStores(prev => [...prev, storeObj]);
    }

    if (user) {
      const realId = await supabaseService.saveStore(storeObj);
      if (realId) {
        setStores(prev => prev.map(s => s.id === storeObj.id ? { ...s, id: realId } : s));
        if (selectedStoreId === storeObj.id) setSelectedStoreId(realId);
      }
    }

    setIsStoreModalOpen(false);
    setStoreToEdit(null);
  };

  const handleDeleteStore = async (id: string) => {
    if (confirm("¿Eliminar tienda y todos sus pedidos?")) {
      if (user) await supabaseService.deleteStore(id);
      setStores(stores.filter(s => s.id !== id));
      setOrders(orders.filter(o => o.storeId !== id));
      if (selectedStoreId === id) setSelectedStoreId(null);
    }
  };

  const handleNewOrder = () => {
    if (!selectedStoreId) {
      alert("Primero selecciona una tienda en el panel lateral.");
      return;
    }

    const count = orders.length + 1;
    const number = `PED-${String(count).padStart(4, '0')}`;

    const newOrder: Order = {
      id: generateId(),
      storeId: selectedStoreId,
      number,
      date: new Date().toISOString().split('T')[0],
      status: settings.statuses[0]?.name || "Borrador",
      lines: [],
      shippingPolicy: "Península",
      shippingCost: settings.rules.shippingCost,
      freeFromPVD: settings.rules.freeFromPVD
    };
    setEditingOrder(newOrder);
    setIsSettingsOpen(false);
    setIsStoreModalOpen(false);
  };

  const handleSaveOrder = async (savedOrder: Order) => {
    if (user) {
      const realId = await supabaseService.saveOrder(savedOrder);
      if (realId) savedOrder.id = realId;
    }

    const exists = orders.find(o => o.id === savedOrder.id);
    if (exists) {
      setOrders(orders.map(o => o.id === savedOrder.id ? savedOrder : o));
    } else {
      setOrders([...orders, savedOrder]);
    }
    setEditingOrder(null);
  };

  const handleUpdateSettings = async (newSettings: AppSettings) => {
    setSettings(newSettings);
    if (user) await supabaseService.saveSettings(newSettings);
  };

  const handleCloneOrder = (order: Order) => {
    const count = orders.length + 1;
    const newOrder: Order = {
      ...JSON.parse(JSON.stringify(order)),
      id: generateId(),
      number: `PED-${String(count).padStart(4, '0')}`,
      date: new Date().toISOString().split('T')[0],
      status: settings.statuses[0]?.name || "Borrador"
    };
    newOrder.lines = newOrder.lines.map(l => ({ ...l, id: generateId() }));
    setOrders([...orders, newOrder]);
  };

  const handleDeleteOrder = async (id: string) => {
    if (confirm("¿Eliminar este pedido permanentemente?")) {
      if (user) await supabaseService.deleteOrder(id);
      setOrders(orders.filter(o => o.id !== id));
    }
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center font-black text-primary animate-pulse">CARGANDO BRIIK...</div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 bg-purple-50/30">
        <div className="w-full max-w-md bg-white rounded-[2.5rem] p-12 shadow-2xl shadow-purple-200 border border-purple-100 text-center animate-slide-up">
          <div className="w-20 h-20 bg-primary text-white rounded-3xl flex items-center justify-center font-black text-4xl italic shadow-xl shadow-purple-200 mx-auto mb-8">B</div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter mb-2">BRIIK <span className="text-primary/60 font-light">· Gestión</span></h1>
          <p className="text-purple-300 font-bold uppercase tracking-widest text-xs mb-10">Acceso exclusivo distribuidores</p>

          {!authSent ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <input
                type="email"
                placeholder="tu@email.com"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                required
                className="w-full bg-purple-50 border border-purple-100 p-4 rounded-2xl text-center font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-purple-200"
              />
              <button type="submit" className="w-full bg-primary text-white py-4 rounded-2xl font-black shadow-lg hover:bg-primary-light transition-all active:scale-95">CONTINUAR</button>
            </form>
          ) : (
            <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100 animate-fade-in">
              <p className="text-primary font-black text-sm">✓ EMAIL ENVIADO</p>
              <p className="text-gray-500 text-xs font-bold mt-2 leading-relaxed">Revisa tu bandeja de entrada para iniciar sesión automáticamente.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col selection:bg-purple-100 selection:text-purple-900">
      {/* Header */}
      <header className="bg-white/70 backdrop-blur-xl border-b border-purple-100 sticky top-0 z-30 px-6 py-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="flex items-center gap-3 group">
          <div className="w-11 h-11 bg-primary text-white rounded-2xl flex items-center justify-center font-black text-2xl italic shadow-lg shadow-purple-200 group-hover:rotate-6 transition-transform duration-300">B</div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-gray-900">BRIIK <span className="text-primary/60 font-light">· Gestión</span></h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Control Center</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => { setIsSettingsOpen(!isSettingsOpen); setEditingOrder(null); setIsStoreModalOpen(false); }}
            className={`p-2.5 rounded-xl transition-all flex items-center gap-2 text-sm font-bold ${isSettingsOpen ? 'bg-primary text-white shadow-lg' : 'hover:bg-purple-50 text-gray-600'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
            <span className="hidden sm:inline">Ajustes</span>
          </button>

          <button
            onClick={() => { setIsDashboardOpen(!isDashboardOpen); setIsSettingsOpen(false); setEditingOrder(null); setIsStoreModalOpen(false); }}
            className={`p-2.5 rounded-xl transition-all flex items-center gap-2 text-sm font-bold ${isDashboardOpen ? 'bg-primary text-white shadow-lg' : 'hover:bg-purple-50 text-gray-600'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>
            <span className="hidden sm:inline">Analítica</span>
          </button>

          <div className="w-px h-6 bg-purple-100 mx-1"></div>

          <button onClick={() => handleOpenStoreModal()} className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-all shadow-md hover:shadow-lg active:scale-95">
            + Tienda
          </button>

          <button onClick={handleNewOrder} className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-opacity-90 transition-all shadow-md shadow-purple-200 hover:shadow-lg active:scale-95">
            + Nuevo Pedido
          </button>

          <div className="w-px h-6 bg-purple-100 mx-1"></div>

          <label className="cursor-pointer px-5 py-2.5 bg-white border border-purple-100 hover:border-primary/30 hover:bg-purple-50 text-gray-600 rounded-xl text-sm font-bold transition-all shadow-sm">
            Importar
            <input type="file" accept=".xml" onChange={handleImportXML} className="hidden" />
          </label>

          <button onClick={handleExportAll} className="px-5 py-2.5 bg-white border border-purple-100 hover:border-primary/30 hover:bg-purple-50 text-gray-600 rounded-xl text-sm font-bold transition-all shadow-sm">
            Exportar
          </button>

          <button onClick={handleLogout} className="p-2.5 text-gray-400 hover:text-primary hover:bg-purple-50 rounded-xl transition-all" title="Cerrar sesión">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden bg-background">
        {/* Sidebar: Stores */}
        <aside className="w-full md:w-80 bg-white border-r border-purple-100 flex flex-col h-full shadow-inner z-10 transition-all duration-500">
          <div className="p-5 border-b border-purple-50">
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-300 group-focus-within:text-primary transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
              </span>
              <input
                type="text"
                placeholder="Buscar tienda o ciudad..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-purple-50/50 border border-purple-100 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary/30 focus:outline-none transition-all placeholder:text-purple-300"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-white/50">
            {filteredStores.length === 0 ? (
              <div className="p-10 text-center">
                <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center text-primary/30 mx-auto mb-4 shadow-inner border border-purple-100">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M8 10h.01" /><path d="M16 10h.01" /><path d="M8 14h.01" /><path d="M16 14h.01" /></svg>
                </div>
                <p className="text-sm text-purple-300 font-bold uppercase tracking-widest mb-3">Sin resultados</p>
                <button onClick={() => handleOpenStoreModal()} className="text-primary text-xs font-black hover:underline tracking-tight">+ AÑADIR TIENDA</button>
              </div>
            ) : (
              <div className="p-3 space-y-1">
                {filteredStores.map(store => (
                  <button
                    key={store.id}
                    onClick={() => { setSelectedStoreId(store.id); setEditingOrder(null); setIsSettingsOpen(false); setIsStoreModalOpen(false); }}
                    className={`w-full text-left p-4 rounded-2xl transition-all group relative overflow-hidden ${selectedStoreId === store.id ? 'bg-primary text-white shadow-lg shadow-purple-200' : 'hover:bg-purple-50 text-gray-700'}`}
                  >
                    <div className="flex justify-between items-start relative z-10">
                      <div>
                        <h3 className={`font-black text-base truncate transition-colors ${selectedStoreId === store.id ? 'text-white' : 'text-gray-900 group-hover:text-primary'}`}>{store.name}</h3>
                        <p className={`text-xs flex items-center gap-1 font-bold mt-0.5 ${selectedStoreId === store.id ? 'text-white/70' : 'text-purple-300'}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                          {store.city || 'Desconocida'}
                        </p>
                      </div>
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border transition-all ${selectedStoreId === store.id ? 'bg-white/20 border-white/30 text-white' : 'bg-white border-purple-100 text-purple-400 group-hover:border-primary/20 group-hover:text-primary'}`}>
                        {orders.filter(o => o.storeId === store.id).length}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar relative bg-purple-50/30">
          {/* Store Modal */}
          {isStoreModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/20 backdrop-blur-md animate-fade-in">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh] overflow-hidden animate-slide-up border border-purple-100">
                <div className="p-6 border-b border-purple-50 bg-purple-50/50 flex justify-between items-center">
                  <h3 className="text-xl font-black text-gray-900 tracking-tight">{storeToEdit ? 'Editar Tienda' : 'Nueva Tienda'}</h3>
                  <button onClick={() => setIsStoreModalOpen(false)} className="bg-white w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-primary shadow-sm hover:shadow transition-all font-bold">✕</button>
                </div>
                <form onSubmit={handleSaveStore} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
                  <div className="grid grid-cols-2 gap-5">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-black text-purple-300 uppercase tracking-widest mb-2">Nombre Comercial*</label>
                      <input name="name" defaultValue={storeToEdit?.name} required className="w-full bg-purple-50/30 border border-purple-100 p-3.5 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary/30 outline-none transition-all" placeholder="P.ej. BRIIK Concept Store" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-purple-300 uppercase tracking-widest mb-2">Ciudad</label>
                      <input name="city" defaultValue={storeToEdit?.city} className="w-full bg-purple-50/30 border border-purple-100 p-3.5 rounded-2xl text-sm font-bold outline-none focus:border-primary/30 transition-all" placeholder="P.ej. Madrid" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-purple-300 uppercase tracking-widest mb-2">NIF/CIF</label>
                      <input name="nif" defaultValue={storeToEdit?.nif} className="w-full bg-purple-50/30 border border-purple-100 p-3.5 rounded-2xl text-sm font-bold outline-none focus:border-primary/30 transition-all" placeholder="B12345678" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-black text-purple-300 uppercase tracking-widest mb-2">Dirección Completa</label>
                      <input name="address" defaultValue={storeToEdit?.address} className="w-full bg-purple-50/30 border border-purple-100 p-3.5 rounded-2xl text-sm font-bold outline-none focus:border-primary/30 transition-all" placeholder="Calle, Nº, Piso..." />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-purple-300 uppercase tracking-widest mb-2">C.P.</label>
                      <input name="postalCode" defaultValue={storeToEdit?.postalCode} className="w-full bg-purple-50/30 border border-purple-100 p-3.5 rounded-2xl text-sm font-bold outline-none focus:border-primary/30 transition-all" placeholder="28001" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-purple-300 uppercase tracking-widest mb-2">Provincia</label>
                      <input name="province" defaultValue={storeToEdit?.province} className="w-full bg-purple-50/30 border border-purple-100 p-3.5 rounded-2xl text-sm font-bold outline-none focus:border-primary/30 transition-all" placeholder="Madrid" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-purple-300 uppercase tracking-widest mb-2">Teléfono</label>
                      <input name="phone" defaultValue={storeToEdit?.phone} className="w-full bg-purple-50/30 border border-purple-100 p-3.5 rounded-2xl text-sm font-bold outline-none focus:border-primary/30 transition-all" placeholder="600 000 000" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-black text-purple-300 uppercase tracking-widest mb-2">Contacto / Email</label>
                      <input name="contact" defaultValue={storeToEdit?.contact} className="w-full bg-purple-50/30 border border-purple-100 p-3.5 rounded-2xl text-sm font-bold outline-none focus:border-primary/30 transition-all" placeholder="Persona o email de gestión" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-black text-purple-300 uppercase tracking-widest mb-2">Instagram</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-200 font-bold">@</span>
                        <input name="instagram" defaultValue={storeToEdit?.instagram?.replace('@', '')} className="w-full bg-purple-50/30 border border-purple-100 pl-8 pr-4 py-3.5 rounded-2xl text-sm font-bold outline-none focus:border-primary/30 transition-all" placeholder="usuario" />
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label className="flex items-center gap-3 cursor-pointer bg-purple-50/50 p-4 rounded-2xl border border-purple-100 hover:border-primary/30 transition-all">
                        <input type="checkbox" name="requiresRE" defaultChecked={storeToEdit?.requiresRE} className="w-5 h-5 accent-primary cursor-pointer" />
                        <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Tienda con Recargo de Equivalencia (RE)</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={() => setIsStoreModalOpen(false)} className="px-6 py-3 text-gray-400 text-sm font-bold hover:text-gray-600 transition-colors">Cancelar</button>
                    <button type="submit" className="px-8 py-3 bg-primary text-white rounded-2xl text-sm font-black shadow-xl shadow-purple-200 hover:bg-primary-light hover:scale-105 transition-all">Guardar Tienda</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {isSettingsOpen ? (
            <SettingsView
              settings={settings}
              onSave={(newSettings) => { setSettings(newSettings); setIsSettingsOpen(false); }}
              onClose={() => setIsSettingsOpen(false)}
            />
          ) : isDashboardOpen ? (
            <DashboardView
              orders={orders}
              stores={stores}
              settings={settings}
              onClose={() => setIsDashboardOpen(false)}
            />
          ) : editingOrder ? (
            <OrderEditor
              order={editingOrder}
              store={selectedStore!}
              settings={settings}
              onSave={handleSaveOrder}
              onCancel={() => setEditingOrder(null)}
              onUpdateSettings={handleUpdateSettings}
            />
          ) : selectedStore ? (
            <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-20">
              {/* Store Header Info - Bento Style */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-10 shadow-xl shadow-purple-100/50 border border-purple-50 flex flex-col justify-between relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
                    <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" /><path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9" /><path d="M12 3v6" /></svg>
                  </div>

                  <div className="relative z-10">
                    <div className="flex items-center gap-5 mb-4">
                      <h2 className="text-4xl font-black text-gray-900 leading-tight tracking-tighter">{selectedStore.name}</h2>
                      <div className="flex gap-2">
                        <button onClick={() => handleOpenStoreModal(selectedStore)} className="bg-purple-50 w-10 h-10 rounded-xl flex items-center justify-center text-primary hover:bg-primary hover:text-white shadow-sm transition-all" title="Editar Tienda">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                        </button>
                        <button onClick={() => handleDeleteStore(selectedStore.id)} className="bg-red-50 w-10 h-10 rounded-xl flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white shadow-sm transition-all" title="Eliminar Tienda">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                        </button>
                      </div>
                    </div>
                    <p className="text-primary/60 flex items-center gap-2 font-black text-sm uppercase tracking-widest">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                      {selectedStore.city || 'Ubicación no especificada'}
                    </p>
                  </div>

                  <div className="mt-10 flex flex-wrap gap-4">
                    <div className="bg-purple-50/50 px-6 py-4 rounded-3xl border border-purple-100 inline-flex flex-col">
                      <span className="text-purple-300 font-black uppercase text-[10px] tracking-widest mb-1">Volumen Acumulado (PVD)</span>
                      <span className="font-black text-2xl text-primary">
                        {storeOrders.reduce((acc, o) => acc + o.lines.reduce((lacc, l) => lacc + (l.qty * l.pvdUnit), 0), 0).toFixed(2)}<span className="text-sm ml-0.5">€</span>
                      </span>
                    </div>
                    <div className="bg-purple-50/50 px-6 py-4 rounded-3xl border border-purple-100 inline-flex flex-col">
                      <span className="text-purple-300 font-black uppercase text-[10px] tracking-widest mb-1">Pedidos Totales</span>
                      <span className="font-black text-2xl text-gray-800">{storeOrders.length}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-primary rounded-[2.5rem] p-10 shadow-xl shadow-purple-200 border border-white/10 text-white flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>

                  <div>
                    <span className="text-white/40 font-black uppercase text-[10px] tracking-widest block mb-4">Información de Contacto</span>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                        </div>
                        <span className="font-bold text-lg">{selectedStore.contact || 'Sin contacto'}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                        </div>
                        <span className="font-bold opacity-80 text-sm truncate">{selectedStore.email || 'No email'}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
                        </div>
                        <span className="font-bold opacity-80 text-sm">@{selectedStore.instagram?.replace('@', '') || 'briik_3d'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8">
                    <button className="w-full bg-white text-primary py-4 rounded-[1.5rem] font-black text-sm hover:bg-purple-50 transition-all shadow-lg active:scale-95">Ver Detalles Completos</button>
                  </div>
                </div>
              </div>

              {/* Orders Table - Professional White Label */}
              <div className="bg-white rounded-[2.5rem] shadow-xl shadow-purple-100/50 border border-purple-50 overflow-hidden">
                <div className="px-10 py-8 border-b border-purple-50 flex justify-between items-center bg-white">
                  <div>
                    <h3 className="font-black text-gray-900 text-xl tracking-tight">Historial de Pedidos</h3>
                    <p className="text-xs text-purple-300 font-bold uppercase tracking-widest mt-1">Gestión administrativa</p>
                  </div>
                  <button onClick={handleNewOrder} className="bg-primary text-white px-8 py-3.5 rounded-2xl text-sm font-black shadow-lg shadow-purple-200 hover:bg-primary-light hover:scale-105 transition-all">
                    + Nuevo Pedido
                  </button>
                </div>

                {storeOrders.length === 0 ? (
                  <div className="py-24 text-center flex flex-col items-center gap-6">
                    <div className="w-24 h-24 bg-purple-50 rounded-[2rem] flex items-center justify-center text-4xl shadow-inner border border-purple-100/50">
                      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15" /><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg>
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-900 font-black text-lg">No hay pedidos registrados</p>
                      <p className="text-purple-300 font-bold text-xs uppercase tracking-widest">Empieza creando el primero para {selectedStore.name}</p>
                    </div>
                    <button onClick={handleNewOrder} className="text-primary text-sm font-black hover:underline tracking-tight">LANZAR NUEVO PEDIDO</button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-purple-50/30 text-[10px] font-black text-purple-300 uppercase tracking-[0.2em] border-b border-purple-50">
                          <th className="px-10 py-6">Referencia</th>
                          <th className="px-6 py-6">Fecha Emisión</th>
                          <th className="px-6 py-6">Estado Pedido</th>
                          <th className="px-6 py-6 text-center">Unid. (Equiv)</th>
                          <th className="px-6 py-6 text-right">Total PVD</th>
                          <th className="px-10 py-6 text-center">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-purple-50">
                        {storeOrders.map(order => {
                          const subtotal = order.lines.reduce((acc, l) => acc + (l.qty * l.pvdUnit), 0);
                          const shipping = subtotal >= order.freeFromPVD ? 0 : order.shippingCost;
                          const total = subtotal + shipping;
                          const units = order.lines.reduce((acc, l) => acc + l.qty, 0);
                          const equiv = order.lines.reduce((acc, l) => {
                            const lt = settings.lineTypes.find(t => t.codeType === l.type);
                            return acc + (l.qty * (lt?.equivalenceUnits || 1));
                          }, 0);
                          const statusInfo = settings.statuses.find(s => s.name === order.status);

                          return (
                            <tr key={order.id} className="group hover:bg-purple-50/20 transition-all duration-300">
                              <td className="px-10 py-8">
                                <span className="font-black text-gray-900 tracking-tighter text-lg bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100 group-hover:bg-white transition-colors">{order.number}</span>
                              </td>
                              <td className="px-6 py-8 text-sm text-gray-500 font-bold">{order.date}</td>
                              <td className="px-6 py-8">
                                <span
                                  className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm inline-flex items-center gap-2"
                                  style={{ backgroundColor: (statusInfo?.badgeColor || '#ccc') + '15', color: statusInfo?.badgeColor, border: `1px solid ${statusInfo?.badgeColor}25` }}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: statusInfo?.badgeColor }}></span>
                                  {order.status}
                                </span>
                              </td>
                              <td className="px-6 py-8 text-center font-black">
                                <span className="text-gray-900 text-lg">{units}</span>
                                <span className="text-primary/40 text-xs ml-1.5 bg-primary/5 px-2 py-1 rounded-lg">({equiv} eq)</span>
                              </td>
                              <td className="px-6 py-8 text-right">
                                <span className="font-black text-gray-900 text-xl tracking-tight">{total.toFixed(2)}<span className="text-sm font-bold ml-0.5">€</span></span>
                              </td>
                              <td className="px-10 py-8">
                                <div className="flex gap-4 items-center justify-center">
                                  <button onClick={() => setEditingOrder(order)} className="bg-white border border-purple-100 px-5 py-2 rounded-xl text-primary font-black text-xs hover:border-primary/30 hover:shadow-lg transition-all active:scale-95">EDITAR</button>
                                  <button onClick={() => handleCloneOrder(order)} className="text-purple-200 hover:text-primary transition-all p-1" title="Duplicar">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                                  </button>
                                  <button onClick={() => handleDeleteOrder(order.id)} className="text-purple-100 hover:text-red-400 transition-all p-1" title="Borrar">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 p-12 text-center animate-fade-in">
              <div className="w-32 h-32 bg-white shadow-2xl rounded-[2.5rem] flex items-center justify-center text-5xl mb-10 shadow-purple-200/50 relative group">
                <div className="absolute inset-0 bg-primary/5 rounded-[2.5rem] scale-110 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M12 11h4" /><path d="M12 16h4" /><path d="M8 11h.01" /><path d="M8 16h.01" /></svg>
              </div>
              <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tighter">Bienvenido a su Gestión</h2>
              <p className="max-w-md mb-12 text-purple-300 font-bold text-lg leading-relaxed">Selecciona un distribuidor del panel lateral o registra una nueva tienda para empezar a operar.</p>
              <button onClick={() => handleOpenStoreModal()} className="bg-primary text-white px-12 py-5 rounded-[1.5rem] font-black shadow-2xl shadow-purple-300/50 hover:bg-primary-light hover:scale-105 active:scale-95 transition-all text-lg flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M12 8v8" /><path d="M8 12h8" /></svg>
                Registrar Primera Tienda
              </button>
            </div>
          )
          }
        </div >
      </main >

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
        .animate-slide-up {
          animation: slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div >
  );
};

export default App;

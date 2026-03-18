import React, { useState } from 'react';
import { LayoutDashboard, Package, ShoppingBag, Users, TrendingUp, AlertCircle, Plus, Edit2, Trash2, Settings, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import { PRODUCTS, CATEGORIES, StoreSettings, PURCHASE_HISTORY, CANCELLED_PURCHASES, PURCHASE_REPORTS } from '../data';
import { Button, SectionTitle, Badge, PaperCard, cn } from './ui';

export const AdminDashboard = ({ 
  settings, 
  onUpdateSettings 
}: { 
  settings: StoreSettings, 
  onUpdateSettings: (s: StoreSettings) => void 
}) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'products' | 'purchases' | 'storefront'>('stats');
  const [localSettings, setLocalSettings] = useState(settings);

  const stats = [
    { label: 'Ventas Totales', value: '$12,450', icon: TrendingUp, color: 'text-green-600' },
    { label: 'Órdenes Hoy', value: '24', icon: ShoppingBag, color: 'text-blue-600' },
    { label: 'Productos', value: PRODUCTS.length, icon: Package, color: 'text-purple-600' },
    { label: 'Stock Bajo', value: '3', icon: AlertCircle, color: 'text-red-600' },
  ];

  const handleSaveSettings = () => {
    onUpdateSettings(localSettings);
    alert("¡Ajustes guardados con éxito!");
  };

  return (
    <div className="min-h-screen bg-[#fcf9f5] pt-24 pb-20">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
          <div>
            <h1 className="text-4xl font-western uppercase tracking-tight">Comandancia</h1>
            <p className="text-neutral-500 font-header uppercase tracking-widest text-xs font-bold mt-1">Panel de Control Dark Ranch</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setActiveTab('stats')}
              className={cn("px-4 py-2 font-header uppercase text-xs font-bold border-2 border-black transition-colors", activeTab === 'stats' ? "bg-black text-white" : "bg-white text-black hover:bg-neutral-100")}
            >
              Métricas
            </button>
            <button 
              onClick={() => setActiveTab('products')}
              className={cn("px-4 py-2 font-header uppercase text-xs font-bold border-2 border-black transition-colors", activeTab === 'products' ? "bg-black text-white" : "bg-white text-black hover:bg-neutral-100")}
            >
              Inventario
            </button>
            <button 
              onClick={() => setActiveTab('purchases')}
              className={cn("px-4 py-2 font-header uppercase text-xs font-bold border-2 border-black transition-colors", activeTab === 'purchases' ? "bg-black text-white" : "bg-white text-black hover:bg-neutral-100")}
            >
              Compras
            </button>
            <button 
              onClick={() => setActiveTab('storefront')}
              className={cn("px-4 py-2 font-header uppercase text-xs font-bold border-2 border-black transition-colors", activeTab === 'storefront' ? "bg-black text-white" : "bg-white text-black hover:bg-neutral-100")}
            >
              Fachada
            </button>
          </div>
        </div>

        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in duration-500">
            {stats.map((stat, i) => (
              <div key={i} className="bg-white p-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center justify-between mb-4">
                  <stat.icon className={stat.color} size={24} />
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Live</span>
                </div>
                <p className="text-neutral-500 text-sm font-header uppercase tracking-wider">{stat.label}</p>
                <p className="text-3xl font-header font-black">{stat.value}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'products' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-header font-bold uppercase tracking-tight text-xl">Gestión de Stock</h3>
              <Button size="sm" className="flex items-center gap-2"><Plus size={16} /> Añadir Mercancía</Button>
            </div>
            <div className="bg-white border-2 border-black overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-neutral-100 border-b-2 border-black font-header uppercase text-[10px] tracking-[0.2em]">
                      <th className="px-6 py-4">Producto</th>
                      <th className="px-6 py-4">Categoría</th>
                      <th className="px-6 py-4">Precio</th>
                      <th className="px-6 py-4">Stock</th>
                      <th className="px-6 py-4">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {PRODUCTS.map((p) => (
                      <tr key={p.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img src={p.images[0]} alt="" className="w-10 h-10 object-cover border border-black" />
                            <div>
                              <p className="font-header font-bold uppercase text-sm">{p.name}</p>
                              <p className="text-[10px] text-neutral-400">{p.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-header text-xs uppercase font-bold text-neutral-500">{p.category}</td>
                        <td className="px-6 py-4 font-header font-bold">${p.price}</td>
                        <td className="px-6 py-4">
                          <span className={cn("font-bold font-header", p.stock < 5 ? "text-red-600" : "text-black")}>{p.stock}</span>
                        </td>
                        <td className="px-6 py-4 flex gap-2">
                          <button className="p-2 hover:bg-neutral-200 border border-transparent hover:border-black transition-all"><Edit2 size={14} /></button>
                          <button className="p-2 hover:bg-red-50 text-red-600 border border-transparent hover:border-red-600 transition-all"><Trash2 size={14} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

{activeTab === 'purchases' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div>
              <h3 className="font-header font-bold uppercase tracking-tight text-xl mb-4">Historial de Compras</h3>
              <div className="bg-white border-2 border-black overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-neutral-100 border-b-2 border-black font-header uppercase text-[10px] tracking-[0.2em]">
                        <th className="px-6 py-4">Orden</th>
                        <th className="px-6 py-4">Cliente</th>
                        <th className="px-6 py-4">Estado</th>
                        <th className="px-6 py-4">Pago</th>
                        <th className="px-6 py-4">Total</th>
                        <th className="px-6 py-4">Fecha</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {PURCHASE_HISTORY.map((purchase) => (
                        <tr key={purchase.id} className="hover:bg-neutral-50 transition-colors">
                          <td className="px-6 py-4 font-header font-bold">{purchase.orderId}</td>
                          <td className="px-6 py-4">{purchase.customer}</td>
                          <td className="px-6 py-4 uppercase text-xs font-bold">{purchase.status}</td>
                          <td className="px-6 py-4 uppercase text-xs">{purchase.paymentStatus}</td>
                          <td className="px-6 py-4 font-header font-bold">${purchase.total.toFixed(2)}</td>
                          <td className="px-6 py-4 text-sm">{new Date(purchase.purchasedAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-header font-bold uppercase tracking-tight text-xl mb-4">Compras Canceladas</h3>
              <div className="bg-white border-2 border-black overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-neutral-100 border-b-2 border-black font-header uppercase text-[10px] tracking-[0.2em]">
                        <th className="px-6 py-4">Orden</th>
                        <th className="px-6 py-4">Cliente</th>
                        <th className="px-6 py-4">Motivo</th>
                        <th className="px-6 py-4">Reembolso</th>
                        <th className="px-6 py-4">Fecha Cancelación</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {CANCELLED_PURCHASES.map((purchase) => (
                        <tr key={purchase.id} className="hover:bg-neutral-50 transition-colors">
                          <td className="px-6 py-4 font-header font-bold">{purchase.orderId}</td>
                          <td className="px-6 py-4">{purchase.customer}</td>
                          <td className="px-6 py-4">{purchase.reason}</td>
                          <td className="px-6 py-4 font-header font-bold text-red-600">${purchase.refundAmount.toFixed(2)}</td>
                          <td className="px-6 py-4 text-sm">{new Date(purchase.cancelledAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-header font-bold uppercase tracking-tight text-xl mb-4">Reportes de Compras</h3>
              <div className="bg-white border-2 border-black overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-neutral-100 border-b-2 border-black font-header uppercase text-[10px] tracking-[0.2em]">
                        <th className="px-6 py-4">Periodo</th>
                        <th className="px-6 py-4">Compras</th>
                        <th className="px-6 py-4">Canceladas</th>
                        <th className="px-6 py-4">Venta Bruta</th>
                        <th className="px-6 py-4">Venta Neta</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {PURCHASE_REPORTS.map((report) => (
                        <tr key={report.id} className="hover:bg-neutral-50 transition-colors">
                          <td className="px-6 py-4 font-header font-bold">{report.periodLabel}</td>
                          <td className="px-6 py-4">{report.totalPurchases}</td>
                          <td className="px-6 py-4">{report.cancelledPurchases}</td>
                          <td className="px-6 py-4">${report.grossSales.toFixed(2)}</td>
                          <td className="px-6 py-4 font-header font-bold">${report.netSales.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}


        {activeTab === 'storefront' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <PaperCard>
              <h3 className="text-2xl font-western uppercase mb-8 border-b-2 border-[#d4c5b3] pb-4">Ajustes de Fachada (Hero & Banners)</h3>
              
              <div className="space-y-12">
                {/* Hero Settings */}
                <div className="space-y-6">
                  <h4 className="font-header uppercase font-black text-sm tracking-widest text-[#C4A484] flex items-center gap-2">
                    <ImageIcon size={16} /> Cabecera Principal (Hero)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-header uppercase font-bold">Título Principal</label>
                      <input 
                        className="w-full border-2 border-black p-3 font-header outline-none focus:bg-white"
                        value={localSettings.hero.title}
                        onChange={(e) => setLocalSettings({...localSettings, hero: {...localSettings.hero, title: e.target.value}})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-header uppercase font-bold">Imagen (URL)</label>
                      <input 
                        className="w-full border-2 border-black p-3 font-header outline-none focus:bg-white"
                        value={localSettings.hero.imageUrl}
                        onChange={(e) => setLocalSettings({...localSettings, hero: {...localSettings.hero, imageUrl: e.target.value}})}
                      />
                    </div>
                  </div>
                </div>

                {/* Seasonal Banner */}
                <div className="space-y-6">
                  <h4 className="font-header uppercase font-black text-sm tracking-widest text-[#C4A484] flex items-center gap-2">
                    <LinkIcon size={16} /> Banner de Temporada
                  </h4>
                  {localSettings.banners.map((banner, idx) => (
                    <div key={banner.id} className="p-6 bg-white border-2 border-dashed border-[#d4c5b3] space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-header uppercase font-bold">Título del Banner</label>
                          <input 
                            className="w-full border-2 border-black p-3 font-header outline-none"
                            value={banner.title}
                            onChange={(e) => {
                              const newBanners = [...localSettings.banners];
                              newBanners[idx].title = e.target.value;
                              setLocalSettings({...localSettings, banners: newBanners});
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-header uppercase font-bold">Categoría Destacada</label>
                          <select 
                            className="w-full border-2 border-black p-3 font-header outline-none appearance-none"
                            value={banner.categoryLink}
                            onChange={(e) => {
                              const newBanners = [...localSettings.banners];
                              newBanners[idx].categoryLink = e.target.value;
                              setLocalSettings({...localSettings, banners: newBanners});
                            }}
                          >
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-header uppercase font-bold">Descripción Corta</label>
                        <textarea 
                          className="w-full border-2 border-black p-3 font-header outline-none min-h-[100px]"
                          value={banner.subtitle}
                          onChange={(e) => {
                            const newBanners = [...localSettings.banners];
                            newBanners[idx].subtitle = e.target.value;
                            setLocalSettings({...localSettings, banners: newBanners});
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-12 pt-8 border-t-2 border-[#d4c5b3] flex justify-end">
                <Button size="lg" onClick={handleSaveSettings} className="px-12">
                  Publicar Cambios
                </Button>
              </div>
            </PaperCard>
          </div>
        )}
      </div>
    </div>
  );
};

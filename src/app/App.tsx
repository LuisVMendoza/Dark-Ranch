import React, { useState, useMemo, useEffect } from 'react';
import { Toaster } from 'sonner';
import { CartProvider } from './cart-context';
import { Navbar, Footer } from './components/layout';
import { ProductCard, CategoryCard } from './components/product';
import { CartDrawer } from './components/cart-drawer';
import { AdminDashboard } from './components/admin';
import { CheckoutPage } from './components/checkout';
import { LoginPage } from './components/auth';
import { AboutPage, ContactPage } from './components/pages';
import { Button, SectionTitle, Divider, LOGO_CIRCULAR, OrnateBorder, cn } from './components/ui';
import { PRODUCTS, CATEGORIES, INITIAL_SETTINGS, StoreSettings, Product } from './data';
import { ImageWithFallback } from './components/figma/ImageWithFallback';
import { ArrowRight, Star, Shield, Truck, RefreshCw, Filter, X, Search, ShieldCheck } from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'motion/react';

type View = 'home' | 'shop' | 'about' | 'contact' | 'checkout' | 'login' | 'admin';

const App = () => {
  const [currentView, setCurrentView] = useState<View>('home');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Storefront Dynamic Settings (Editable via Admin)
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dark-ranch-settings');
      return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
    }
    return INITIAL_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem('dark-ranch-settings', JSON.stringify(storeSettings));
  }, [storeSettings]);

  // Filtering Logic
  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter(p => {
      const matchesCategory = selectedCategory ? p.category === selectedCategory : true;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const featuredProducts = PRODUCTS.filter(p => p.isFeatured);

  const handleLogin = (isAdminUser: boolean) => {
    setIsAdmin(isAdminUser);
    setCurrentView(isAdminUser ? 'admin' : 'home');
  };

  const navigateToCategory = (cat: string) => {
    setSelectedCategory(cat);
    setCurrentView('shop');
    window.scrollTo(0, 0);
  };

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return (
          <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Hero Section */}
            <header id="home" className="relative h-screen w-full flex items-center overflow-hidden bg-[#1a110a]">
              <ImageWithFallback 
                src={storeSettings.hero.imageUrl} 
                alt="Western Hero"
                className="absolute inset-0 w-full h-full object-cover opacity-50 sepia-[0.3]"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#1a110a] via-[#1a110a]/60 to-transparent"></div>
              
              <div className="container mx-auto px-6 relative z-10">
                <Motion.div 
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 1, delay: 0.2 }}
                  className="max-w-4xl"
                >
                  <p className="text-[#C4A484] font-header text-xl md:text-2xl uppercase tracking-[0.4em] font-black mb-6 flex items-center gap-4">
                    <span className="h-px w-12 bg-[#C4A484]"></span> {storeSettings.hero.subtitle}
                  </p>
                  <h1 className="text-6xl md:text-8xl lg:text-[10rem] font-western text-white uppercase leading-[0.8] tracking-tighter mb-10 drop-shadow-2xl">
                    {storeSettings.hero.title.split('.').map((part, i) => (
                      <span key={i} className="block">{part}{i === 0 ? '.' : ''}</span>
                    ))}
                  </h1>
                  <div className="flex flex-col sm:row items-center gap-6">
                    <Button size="lg" variant="secondary" className="w-full sm:w-auto text-xl px-12" onClick={() => setCurrentView('shop')}>
                      Ir al Taller
                    </Button>
                    <Button variant="outline" size="lg" className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-black font-western">
                      Nuestra Herencia
                    </Button>
                  </div>
                </Motion.div>
              </div>

              {/* Decorative Circle Logo */}
              <div className="absolute bottom-10 right-10 w-64 h-64 opacity-10 rotate-12 pointer-events-none hidden lg:block">
                <ImageWithFallback src={LOGO_CIRCULAR} alt="Seal" />
              </div>
            </header>

            {/* Featured Categories */}
            <section id="categories" className="py-32 bg-[#fdfcf5] relative overflow-hidden">
               {/* Paper texture overlay */}
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cardboard-flat.png')] opacity-20 pointer-events-none"></div>
              
              <div className="container mx-auto px-6 relative z-10">
                <SectionTitle subtitle="Escoge tu Herramienta">Categorías de Leyenda</SectionTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                  <div onClick={() => navigateToCategory('Botas')} className="cursor-pointer">
                    <CategoryCard name="Botas" image="https://images.unsplash.com/photo-1638247025967-b4e38f687b76?q=80&w=800&auto=format&fit=crop" />
                  </div>
                  <div onClick={() => navigateToCategory('Sombreros')} className="cursor-pointer">
                    <CategoryCard name="Sombreros" image="https://images.unsplash.com/photo-1572307480813-ceb0e59d8325?q=80&w=800&auto=format&fit=crop" />
                  </div>
                  <div onClick={() => navigateToCategory('Jeans')} className="cursor-pointer">
                    <CategoryCard name="Industrial" image="https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=800&auto=format&fit=crop" />
                  </div>
                </div>
              </div>
            </section>

            {/* Dynamic Banner from Settings */}
            {storeSettings.banners.map((banner) => (
              <section key={banner.id} className="relative h-[70vh] flex items-center overflow-hidden bg-[#2d1e14]">
                <ImageWithFallback 
                  src={banner.imageUrl} 
                  alt={banner.title} 
                  className="absolute inset-0 w-full h-full object-cover opacity-40 grayscale sepia"
                />
                <div className="absolute inset-0 bg-black/40"></div>
                <div className="container mx-auto px-6 relative z-10 text-center">
                  <Motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="max-w-4xl mx-auto space-y-8"
                  >
                    <ImageWithFallback src={LOGO_CIRCULAR} alt="Sello" className="w-40 h-40 mx-auto invert opacity-70 animate-[spin_20s_linear_infinite]" />
                    <h2 className="text-6xl md:text-8xl font-western text-white uppercase tracking-tighter drop-shadow-lg">
                      {banner.title}
                    </h2>
                    <p className="text-[#d4c5b3] font-header uppercase tracking-widest text-xl font-bold max-w-2xl mx-auto">
                      {banner.subtitle}
                    </p>
                    <Button 
                      size="lg" 
                      variant="secondary" 
                      className="px-16 py-6 text-2xl font-western"
                      onClick={() => navigateToCategory(banner.categoryLink)}
                    >
                      {banner.buttonText}
                    </Button>
                  </Motion.div>
                </div>
                {/* Ornate corners */}
                <div className="absolute top-10 left-10 w-20 h-20 border-t-4 border-l-4 border-[#C4A484]"></div>
                <div className="absolute bottom-10 right-10 w-20 h-20 border-b-4 border-r-4 border-[#C4A484]"></div>
              </section>
            ))}

            {/* Best Sellers */}
            <section id="shop" className="py-32 bg-[#fcf9f5]">
              <div className="container mx-auto px-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
                  <SectionTitle subtitle="Lo más forjado" className="!mb-0">Artículos de Élite</SectionTitle>
                  <button onClick={() => setCurrentView('shop')} className="font-western text-[#C4A484] text-xl tracking-widest flex items-center gap-4 group cursor-pointer">
                    Explorar el Arsenal <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:row-2 lg:grid-cols-4 gap-12">
                  {featuredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            </section>

            <OrnateBorder className="bg-[#fcf9f5]" />

            {/* Benefits */}
            <section className="py-24 bg-[#fcf9f5]">
              <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-16 text-center">
                <div className="space-y-6 group">
                  <div className="w-24 h-24 bg-white border-2 border-black rotate-45 flex items-center justify-center mx-auto transition-transform group-hover:rotate-0">
                    <Truck size={40} className="-rotate-45 group-hover:rotate-0 transition-transform" />
                  </div>
                  <h4 className="font-western text-2xl uppercase mt-8">Expreso del Desierto</h4>
                  <p className="text-neutral-500 font-header uppercase text-xs font-bold tracking-widest leading-loose">Envío gratuito en cargamentos mayores a $150.</p>
                </div>
                <div className="space-y-6 group">
                  <div className="w-24 h-24 bg-white border-2 border-black rotate-45 flex items-center justify-center mx-auto transition-transform group-hover:rotate-0">
                    <RefreshCw size={40} className="-rotate-45 group-hover:rotate-0 transition-transform" />
                  </div>
                  <h4 className="font-western text-2xl uppercase mt-8">Trato Justo</h4>
                  <p className="text-neutral-500 font-header uppercase text-xs font-bold tracking-widest leading-loose">30 días para cambiar tu equipo si no te ajusta a la perfección.</p>
                </div>
                <div className="space-y-6 group">
                  <div className="w-24 h-24 bg-white border-2 border-black rotate-45 flex items-center justify-center mx-auto transition-transform group-hover:rotate-0">
                    <ShieldCheck size={40} className="-rotate-45 group-hover:rotate-0 transition-transform" />
                  </div>
                  <h4 className="font-western text-2xl uppercase mt-8">Forja Vitalicia</h4>
                  <p className="text-neutral-500 font-header uppercase text-xs font-bold tracking-widest leading-loose">Garantía absoluta en la durabilidad de nuestras costuras.</p>
                </div>
              </div>
            </section>
          </Motion.div>
        );

      case 'shop':
        return (
          <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pt-32 pb-24 bg-[#fcf9f5] min-h-screen">
            <div className="container mx-auto px-6">
              <SectionTitle subtitle="El Arsenal Completo">Catálogo Industrial</SectionTitle>
              <div className="flex flex-col md:flex-row gap-12">
                {/* Sidebar Filters */}
                <aside className="w-full md:w-72 space-y-10">
                  <div className="bg-white border-2 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <h3 className="font-western text-2xl mb-8 flex items-center gap-3">
                      <Filter size={24} /> Filtros
                    </h3>
                    <div className="space-y-8">
                      <div>
                        <p className="text-[10px] font-header uppercase font-black tracking-[0.2em] mb-4 text-[#C4A484]">Categorías</p>
                        <div className="space-y-3">
                          <button 
                            onClick={() => setSelectedCategory(null)}
                            className={cn(
                              "block w-full text-left font-header uppercase text-sm font-black p-3 transition-all cursor-pointer",
                              selectedCategory === null ? "bg-black text-white" : "hover:bg-neutral-100 border border-transparent hover:border-black"
                            )}
                          >
                            Todo el Inventario
                          </button>
                          {CATEGORIES.map(cat => (
                            <button 
                              key={cat}
                              onClick={() => setSelectedCategory(cat)}
                              className={cn(
                                "block w-full text-left font-header uppercase text-sm font-black p-3 transition-all cursor-pointer",
                                selectedCategory === cat ? "bg-black text-white" : "hover:bg-neutral-100 border border-transparent hover:border-black"
                              )}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>
                      <Divider />
                      <div>
                        <p className="text-[10px] font-header uppercase font-black tracking-[0.2em] mb-4 text-[#C4A484]">Búsqueda de Rastro</p>
                        <div className="relative">
                          <input 
                            type="text" 
                            placeholder="Buscar nombre o serie..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full border-2 border-black p-4 outline-none font-header uppercase text-xs font-bold"
                          />
                          <Search className="absolute right-4 top-4 text-neutral-400" size={18} />
                        </div>
                      </div>
                    </div>
                  </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1">
                  {filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:row-2 lg:grid-cols-3 gap-10">
                      {filteredProducts.map(p => (
                        <ProductCard key={p.id} product={p} />
                      ))}
                    </div>
                  ) : (
                    <div className="py-32 text-center bg-white border-2 border-dashed border-neutral-300">
                      <div className="text-neutral-200 flex justify-center mb-6"><Search size={80} /></div>
                      <h3 className="font-western text-3xl uppercase mb-4">Rastro Perdido</h3>
                      <p className="text-neutral-500 font-header uppercase text-xs font-bold tracking-widest">No hay artículos que coincidan con tu búsqueda actual.</p>
                      <Button className="mt-8" onClick={() => {setSelectedCategory(null); setSearchQuery('')}}>Limpiar Rastreo</Button>
                    </div>
                  )}
                </main>
              </div>
            </div>
          </Motion.div>
        );

      case 'about':
        return <AboutPage text={storeSettings.aboutText} />;
      
      case 'contact':
        return <ContactPage />;

      case 'checkout':
        return <CheckoutPage onBack={() => setCurrentView('shop')} />;
      
      case 'login':
        return <LoginPage onLogin={handleLogin} />;
      
      case 'admin':
        return <AdminDashboard settings={storeSettings} onUpdateSettings={setStoreSettings} />;
        
      default:
        return null;
    }
  };

  return (
    <div className="font-body selection:bg-[#C4A484] selection:text-black">
      <Toaster position="bottom-right" richColors />
      
      {currentView !== 'login' && currentView !== 'checkout' && currentView !== 'admin' && (
        <Navbar 
          onOpenCart={() => setIsCartOpen(true)} 
          onOpenAuth={() => setCurrentView('login')}
          onNavigate={(view: View) => setCurrentView(view)}
        />
      )}

      {currentView === 'admin' && (
        <nav className="fixed top-0 left-0 w-full bg-black text-white p-4 z-[100] flex justify-between items-center px-10">
          <h2 className="font-western text-2xl">Administración de Dark Ranch</h2>
          <Button variant="outline" size="sm" className="border-white text-white" onClick={() => setCurrentView('home')}>Salir al Sitio</Button>
        </nav>
      )}

      <AnimatePresence mode="wait">
        <div key={currentView}>
          {renderView()}
        </div>
      </AnimatePresence>

      {currentView !== 'login' && currentView !== 'checkout' && currentView !== 'admin' && (
        <Footer />
      )}

      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        onCheckout={() => {
          setIsCartOpen(false);
          setCurrentView('checkout');
        }}
      />

      {/* Persistence and Quick Actions */}
      {!isAdmin && currentView === 'home' && (
        <button 
          onClick={() => setCurrentView('login')}
          className="fixed bottom-10 left-10 z-50 bg-black text-white w-14 h-14 rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center justify-center group border-2 border-[#C4A484] cursor-pointer"
        >
          <Shield size={24} />
          <span className="absolute left-16 bg-black text-white px-4 py-2 font-western text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">Acceso Comandancia</span>
        </button>
      )}
    </div>
  );
};

export default function AppWrapper() {
  return (
    <CartProvider>
      <App />
    </CartProvider>
  );
}

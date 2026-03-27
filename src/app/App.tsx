import React, { useEffect, useMemo, useState } from 'react';
import { Toaster, toast } from 'sonner';
import { CartProvider } from './cart-context';
import { Navbar, Footer } from './components/layout';
import { ProductCard, CategoryCard } from './components/product';
import { CartDrawer } from './components/cart-drawer';
import { AdminDashboard } from './components/admin';
import { CheckoutPage } from './components/checkout';
import { LoginPage } from './components/auth';
import { AboutPage, ContactPage } from './components/pages';
import { Button, SectionTitle, Divider, LOGO_CIRCULAR, OrnateBorder, cn } from './components/ui';
import { AdminSnapshot, AdminUser, BootstrapData, StoreSettings } from './types';
import { ImageWithFallback } from './components/common/ImageWithFallback';
import { ArrowRight, RefreshCw, Filter, Search, ShieldCheck, Truck } from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'motion/react';
import { getBootstrapData } from './lib/api';

type View = 'home' | 'shop' | 'about' | 'contact' | 'checkout' | 'login' | 'admin';

const App = () => {
  const [currentView, setCurrentView] = useState<View>('home');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [bootstrap, setBootstrap] = useState<BootstrapData | null>(null);
  const [adminSnapshot, setAdminSnapshot] = useState<AdminSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getBootstrapData();
      setBootstrap(data);
      setAdminSnapshot((current) => current ? {
        ...current,
        categories: data.categories,
        products: data.products,
        settings: data.settings,
        dashboard: data.dashboard,
      } : null);
      setLoadError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo cargar la tienda';
      setLoadError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    try {
      const rawAdminUser = localStorage.getItem('dark-ranch-admin-user');
      if (!rawAdminUser) return;
      const parsedAdminUser = JSON.parse(rawAdminUser) as AdminUser;
      if (parsedAdminUser?.id) {
        setAdminUser(parsedAdminUser);
        setIsAdmin(true);
      }
    } catch {
      localStorage.removeItem('dark-ranch-admin-user');
    }
  }, []);


  const filteredProducts = useMemo(() => {
    if (!bootstrap) return [];
    return bootstrap.products.filter((product) => {
      const matchesCategory = selectedCategory ? product.category === selectedCategory : true;
      const matchesSearch = `${product.name} ${product.description}`.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [bootstrap, searchQuery, selectedCategory]);

  const featuredProducts = useMemo(
    () => bootstrap?.products.filter((product) => product.isFeatured) ?? [],
    [bootstrap],
  );

  const storeSettings: StoreSettings | null = bootstrap?.settings ?? null;

  const handleLogin = (user: AdminUser | null) => {
    setAdminUser(user);
    setIsAdmin(Boolean(user));
    setCurrentView(user ? 'admin' : 'home');
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('dark-ranch-admin-user');
    setAdminUser(null);
    setIsAdmin(false);
    setCurrentView('home');
    toast.success('Sesión cerrada');
  };

  const navigateToCategory = (categoryName: string) => {
    setSelectedCategory(categoryName);
    setCurrentView('shop');
    window.scrollTo(0, 0);
  };

  const renderLoadingState = () => (
    <div className="min-h-screen bg-[#fcf9f5] flex items-center justify-center px-6 text-center">
      <div className="space-y-4">
        <p className="font-header uppercase tracking-[0.3em] text-[#C4A484]">Cargando catálogo real</p>
        <h1 className="text-4xl font-western uppercase">Conectando con la base local…</h1>
      </div>
    </div>
  );

  const renderErrorState = () => (
    <div className="min-h-screen bg-[#fcf9f5] flex items-center justify-center px-6 text-center">
      <div className="max-w-xl space-y-6 bg-white border-2 border-black p-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <p className="font-header uppercase tracking-[0.3em] text-red-600">Sin conexión con la BD local</p>
        <h1 className="text-4xl font-western uppercase">No pudimos cargar Dark Ranch</h1>
        <p className="text-neutral-600">{loadError}</p>
        <Button onClick={loadData}>Reintentar</Button>
      </div>
    </div>
  );

  const renderView = () => {
    if (isLoading && !bootstrap) return renderLoadingState();
    if (loadError && !bootstrap) return renderErrorState();
    if (!bootstrap || !storeSettings) return renderLoadingState();

    switch (currentView) {
      case 'home':
        return (
          <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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
                    {storeSettings.hero.title.split('.').map((part, index) => (
                      <span key={`${part}-${index}`} className="block">{part}{index === 0 ? '.' : ''}</span>
                    ))}
                  </h1>
                  <div className="flex flex-col sm:row items-center gap-6">
                    <Button size="lg" variant="secondary" className="w-full sm:w-auto text-xl px-12" onClick={() => setCurrentView('shop')}>
                      Ir al Taller
                    </Button>
                    <Button variant="outline" size="lg" className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-black font-western" onClick={() => setCurrentView('about')}>
                      Nuestra Herencia
                    </Button>
                  </div>
                </Motion.div>
              </div>

              <div className="absolute bottom-10 right-10 w-64 h-64 opacity-10 rotate-12 pointer-events-none hidden lg:block">
                <ImageWithFallback src={LOGO_CIRCULAR} alt="Seal" />
              </div>
            </header>

            <section id="categories" className="py-32 bg-[#fdfcf5] relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cardboard-flat.png')] opacity-20 pointer-events-none"></div>
              <div className="container mx-auto px-6 relative z-10">
                <SectionTitle subtitle="Escoge tu Herramienta">Categorías de Leyenda</SectionTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                  {bootstrap.categories.map((category) => (
                    <div key={category.id} onClick={() => navigateToCategory(category.name)} className="cursor-pointer">
                      <CategoryCard name={category.name} image={category.imageUrl} />
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {storeSettings.banners[0] && (
              <section className="py-20 bg-black text-white">
                <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  <div className="space-y-6">
                    <p className="font-header uppercase tracking-[0.3em] text-[#C4A484] text-xs">Banner activo desde la base local</p>
                    <h2 className="text-5xl font-western uppercase">{storeSettings.banners[0].title}</h2>
                    <p className="text-neutral-300 leading-relaxed">{storeSettings.banners[0].subtitle}</p>
                    <Button variant="secondary" onClick={() => navigateToCategory(storeSettings.banners[0].categoryLink)}>
                      {storeSettings.banners[0].buttonText}
                    </Button>
                  </div>
                  <div className="border-2 border-white/30 overflow-hidden">
                    <ImageWithFallback src={storeSettings.banners[0].imageUrl} alt={storeSettings.banners[0].title} className="w-full h-[420px] object-cover" />
                  </div>
                </div>
              </section>
            )}

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
                <aside className="w-full md:w-72 space-y-10">
                  <div className="bg-white border-2 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <h3 className="font-western text-2xl mb-8 flex items-center gap-3">
                      <Filter size={24} /> Filtros
                    </h3>
                    <div className="space-y-8">
                      <div>
                        <p className="text-[10px] font-header uppercase font-black tracking-[0.2em] mb-4 text-[#C4A484]">Categorías</p>
                        <div className="space-y-3">
                          <button onClick={() => setSelectedCategory(null)} className={cn('block w-full text-left font-header uppercase text-sm font-black p-3 transition-all cursor-pointer', selectedCategory === null ? 'bg-black text-white' : 'hover:bg-neutral-100 border border-transparent hover:border-black')}>
                            Todo el Inventario
                          </button>
                          {bootstrap.categories.map((category) => (
                            <button key={category.id} onClick={() => setSelectedCategory(category.name)} className={cn('block w-full text-left font-header uppercase text-sm font-black p-3 transition-all cursor-pointer', selectedCategory === category.name ? 'bg-black text-white' : 'hover:bg-neutral-100 border border-transparent hover:border-black')}>
                              {category.name}
                            </button>
                          ))}
                        </div>
                      </div>
                      <Divider />
                      <div>
                        <p className="text-[10px] font-header uppercase font-black tracking-[0.2em] mb-4 text-[#C4A484]">Búsqueda de Rastro</p>
                        <div className="relative">
                          <input type="text" placeholder="Buscar nombre o serie..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full border-2 border-black p-4 pr-12 bg-white outline-none focus:ring-1 focus:ring-[#C4A484]" />
                          <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                </aside>

                <div className="flex-1 space-y-8">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-header uppercase text-xs tracking-[0.2em] text-neutral-500">{filteredProducts.length} resultado(s) desde SQLite local</p>
                    {selectedCategory && <button className="text-sm underline underline-offset-4" onClick={() => setSelectedCategory(null)}>Limpiar categoría</button>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {filteredProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Motion.div>
        );

      case 'about':
        return <AboutPage text={storeSettings.aboutText} />;
      case 'contact':
        return <ContactPage email={storeSettings.contactEmail} />;
      case 'checkout':
        return <CheckoutPage onBack={() => setCurrentView('home')} onOrderCreated={loadData} />;
      case 'login':
        return <LoginPage onLogin={handleLogin} />;
      case 'admin':
        return isAdmin ? (
          <AdminDashboard
            initialSnapshot={adminSnapshot ?? {
              categories: bootstrap.categories,
              products: bootstrap.products,
              orders: [],
              adminUsers: [],
              activityLogs: [],
              settings: storeSettings,
              dashboard: bootstrap.dashboard,
            }}
            currentAdminUser={adminUser}
            onSnapshotUpdated={(nextSnapshot) => {
              setAdminSnapshot(nextSnapshot);
              setBootstrap({
                categories: nextSnapshot.categories,
                products: nextSnapshot.products.filter((product) => product.isActive !== false),
                settings: nextSnapshot.settings,
                dashboard: nextSnapshot.dashboard,
              });
            }}
            onExit={() => setCurrentView('home')}
            onLogout={handleAdminLogout}
          />
        ) : <LoginPage onLogin={handleLogin} />;
      default:
        return null;
    }
  };

  return (
    <CartProvider>
      <div className="min-h-screen bg-[#fcf9f5] text-black overflow-x-hidden">
        <Toaster richColors position="top-right" />
        {currentView !== 'login' && currentView !== 'admin' && (
          <Navbar
            onOpenCart={() => setIsCartOpen(true)}
            onOpenAuth={() => setCurrentView(isAdmin ? 'admin' : 'login')}
            onNavigate={(view: View) => setCurrentView(view)}
            currentView={currentView}
          />
        )}

        <AnimatePresence mode="wait">{renderView()}</AnimatePresence>

        {currentView !== 'login' && currentView !== 'admin' && <Footer />}
        <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} onCheckout={() => { setIsCartOpen(false); setCurrentView('checkout'); }} />
      </div>
    </CartProvider>
  );
};

export default App;

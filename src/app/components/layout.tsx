import React, { useState, useEffect } from 'react';
import { ShoppingCart, User, Menu, X, Search, ChevronRight } from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'motion/react';
import { useCart } from '../cart-context';
import { Button, LOGO_HORIZONTAL, cn } from './ui';
import { ImageWithFallback } from './common/ImageWithFallback';

export const Navbar = ({ onOpenCart, onOpenAuth, onNavigate, currentView }: { onOpenCart: () => void, onOpenAuth: () => void, onNavigate: (view: string) => void, currentView: string }) => {
  const { cartCount } = useCart();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Inicio', view: 'home' },
    { name: 'Tienda', view: 'shop' },
  ];

  const isHomeView = currentView === 'home';
  const useTransparentNavbar = isHomeView && !isScrolled;

  return (
    <nav className={cn(
      "fixed top-0 left-0 w-full z-50 transition-all duration-500",
      useTransparentNavbar ? "bg-transparent py-4" : "bg-black/95 backdrop-blur-sm border-b border-white/10 py-2"
    )}>
      <div className="container mx-auto px-6 flex items-center justify-between">
        {/* Mobile Menu Toggle */}
        <button 
          className="lg:hidden text-white"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Logo */}
        <button onClick={() => onNavigate('home')} className="flex-shrink-0">
          <ImageWithFallback 
            src={LOGO_HORIZONTAL} 
            alt="Dark Ranch Logo" 
            className="h-10 md:h-12 w-auto object-contain brightness-0 invert"
          />
        </button>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center space-x-10">
          {navLinks.map((link) => (
            <button 
              key={link.name} 
              onClick={() => onNavigate(link.view)}
              className="font-header uppercase text-xs tracking-[0.2em] font-black text-white transition-all hover:text-[#C4A484] relative group"
            >
              {link.name}
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-[#C4A484] transition-all group-hover:w-full"></span>
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-4 lg:space-x-6">
          <button 
            onClick={onOpenAuth}
            className="text-white transition-colors hover:text-[#C4A484]"
          >
            <User size={20} />
          </button>
          <button 
            onClick={onOpenCart}
            className="relative text-white transition-colors hover:text-[#C4A484] group"
          >
            <div className="border border-white/20 p-2 rounded-full group-hover:border-[#C4A484] transition-colors">
              <ShoppingCart size={20} />
            </div>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#C4A484] text-black text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-black">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <Motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            className="lg:hidden fixed inset-0 top-0 h-screen bg-black text-white p-8 z-[100] flex flex-col"
          >
            <div className="flex justify-between items-center mb-16">
              <ImageWithFallback src={LOGO_HORIZONTAL} alt="Logo" className="h-10 invert" />
              <button onClick={() => setIsMobileMenuOpen(false)}><X size={32} /></button>
            </div>
            <div className="space-y-8">
              {navLinks.map((link) => (
                <button 
                  key={link.name} 
                  onClick={() => { onNavigate(link.view); setIsMobileMenuOpen(false); }}
                  className="block text-2xl sm:text-4xl font-western uppercase tracking-tight sm:tracking-tighter hover:text-[#C4A484] text-left w-full break-words"
                >
                  {link.name}
                </button>
              ))}
            </div>
            <div className="mt-auto pb-10 space-y-6">
              <p className="font-header uppercase text-[10px] tracking-widest text-neutral-500">Contacta con la Ranchería</p>
              <p className="text-xl font-header">correo.example</p>
              <div className="flex gap-4">
                <div className="w-10 h-10 border border-neutral-700 flex items-center justify-center text-xs">IG</div>
                <div className="w-10 h-10 border border-neutral-700 flex items-center justify-center text-xs">FB</div>
              </div>
            </div>
          </Motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export const Footer = () => (
  <footer className="bg-black text-white pt-20 pb-10">
    <div className="container mx-auto px-6">
      <div className="grid grid-cols-1 gap-12 mb-16">
        <div className="space-y-6">
          <ImageWithFallback src={LOGO_HORIZONTAL} alt="Dark Ranch" className="h-12 w-auto invert" />
          <p className="text-neutral-400 text-sm leading-relaxed">
            Industrial & Western — Built for work. Styled for the wild. 
            Nacidos en el desierto, forjados en el taller. Calidad premium desde 1922.
          </p>
          <div className="flex space-x-4">
            <a
              href="https://www.instagram.com/darkranchboots/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full border border-neutral-700 flex items-center justify-center hover:bg-white hover:text-black transition-colors cursor-pointer text-xs"
            >
              IG
            </a>
            <a
              href="https://www.facebook.com/profile.php/?id=100090450979615"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full border border-neutral-700 flex items-center justify-center hover:bg-white hover:text-black transition-colors cursor-pointer text-xs"
            >
              FB
            </a>
          </div>
        </div>
      </div>
      <div className="mb-16">
        <h4 className="font-header uppercase tracking-widest text-lg mb-3">Correo de contacto</h4>
        <p className="text-neutral-400 text-sm">correo de ejemplo</p>
      </div>
      
      <div className="border-t border-neutral-800 pt-8 flex flex-col md:flex-row items-center md:items-start justify-between gap-4 text-[10px] sm:text-xs text-neutral-500 uppercase tracking-[0.12em] sm:tracking-widest font-typewriter text-center md:text-left">
        <p>&copy; 2026 DARK RANCH CO. FORJADO EN EL DESIERTO. TODOS LOS DERECHOS RESERVADOS.</p>
      </div>
    </div>
  </footer>
);

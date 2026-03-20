import React from 'react';
import { X, Minus, Plus, Trash2, ArrowRight, ShoppingBag } from 'lucide-react';
import { useCart } from '../cart-context';
import { Button, cn } from './ui';
import { ImageWithFallback } from './common/ImageWithFallback';
import { motion as Motion, AnimatePresence } from 'motion/react';

export const CartDrawer = ({ isOpen, onClose, onCheckout }: { isOpen: boolean, onClose: () => void, onCheckout: () => void }) => {
  const { cart, removeFromCart, updateQuantity } = useCart();
  const cartTotal = cart.reduce((total, item) => total + ((item.salePrice ?? item.price) * item.quantity), 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <Motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
          />
          
          {/* Panel */}
          <Motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-[70] shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b flex items-center justify-between bg-black text-white">
              <h2 className="font-header text-2xl uppercase tracking-tight flex items-center gap-2">
                <ShoppingBag size={24} /> Carrito
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-neutral-800 rounded-full transition-colors cursor-pointer">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-400">
                    <ShoppingBag size={40} />
                  </div>
                  <div>
                    <h3 className="font-header text-xl uppercase">Tu carrito está vacío</h3>
                    <p className="text-neutral-500 text-sm mt-2">Parece que aún no has forjado tu estilo.</p>
                  </div>
                  <Button variant="outline" onClick={onClose}>Explorar Tienda</Button>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={`${item.id}-${item.selectedSize}`} className="flex gap-4 p-4 border border-neutral-100 bg-neutral-50/50">
                    <div className="w-20 h-24 flex-shrink-0">
                      <ImageWithFallback src={item.images[0]} alt={item.name} className="w-full h-full object-cover border border-neutral-200" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between">
                        <h4 className="font-header uppercase text-sm font-bold truncate">{item.name}</h4>
                        <button 
                          onClick={() => removeFromCart(item.id, item.selectedSize)}
                          className="text-neutral-400 hover:text-red-600 transition-colors cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <p className="text-xs text-neutral-500 uppercase mt-1">
                        Talla: {item.selectedSize || 'N/A'} | Color: {item.selectedColor || 'N/A'}
                      </p>
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center border border-neutral-300">
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1, item.selectedSize)}
                            className="p-1 px-2 hover:bg-neutral-200 transition-colors cursor-pointer"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="px-3 text-sm font-bold font-header">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1, item.selectedSize)}
                            className="p-1 px-2 hover:bg-neutral-200 transition-colors cursor-pointer"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <p className="font-header font-bold">${((item.salePrice ?? item.price) * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 border-t bg-neutral-50 space-y-4">
                <div className="flex justify-between items-center text-lg font-header uppercase font-bold">
                  <span>Subtotal</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                <p className="text-[10px] text-neutral-500 uppercase tracking-widest text-center">Impuestos y envío calculados al finalizar</p>
                <Button 
                  onClick={onCheckout}
                  className="w-full flex items-center justify-center gap-2 group" 
                  size="lg"
                >
                  Finalizar Compra <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            )}
          </Motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

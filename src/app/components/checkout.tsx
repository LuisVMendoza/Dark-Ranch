import React, { useState } from 'react';
import { useCart } from '../cart-context';
import { Button, cn } from './ui';
import { CreditCard, Truck, CheckCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { createOrder } from '../lib/api';

export const CheckoutPage = ({ onBack, onOrderCreated }: { onBack: () => void; onOrderCreated?: () => void }) => {
  const { cart, clearCart } = useCart();
  const cartTotal = cart.reduce((total, item) => total + ((item.salePrice ?? item.price) * item.quantity), 0);
  const [step, setStep] = useState(1);
  const [orderNumber, setOrderNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    zip: '',
    cardNumber: '',
    expiry: '',
    cvc: '',
  });

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step < 3) {
      setStep(step + 1);
      return;
    }

    if (!cart.length) {
      toast.error('Tu carrito está vacío');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await createOrder({
        ...formData,
        items: cart.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.salePrice ?? item.price,
          quantity: item.quantity,
          selectedSize: item.selectedSize,
          selectedColor: item.selectedColor,
        })),
      });

      setOrderNumber(response.order.orderNumber);
      toast.success('¡Pedido realizado con éxito!');
      setStep(4);
      clearCart();
      onOrderCreated?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo registrar el pedido');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 4) {
    return (
      <div className="min-h-screen bg-white flex flex-center items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-6">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={48} />
          </div>
          <h1 className="text-4xl font-header font-black uppercase">¡Gracias por tu compra!</h1>
          <p className="text-neutral-500 font-medium">Tu pedido #{orderNumber} ya quedó guardado en la base local y se está preparando para envío.</p>
          <Button onClick={onBack} size="lg" className="w-full">Volver a la Tienda</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcf9f5] pt-24 pb-20">
      <div className="container mx-auto px-6">
        <button onClick={onBack} className="flex items-center gap-2 text-neutral-500 hover:text-black transition-colors mb-8 font-header uppercase text-sm font-bold">
          <ArrowLeft size={16} /> Volver al Carrito
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-7 space-y-12">
            <div className="flex items-center gap-4 mb-8">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center font-bold font-header transition-colors',
                    step >= s ? 'bg-black text-white' : 'bg-neutral-200 text-neutral-500'
                  )}>{s}</div>
                  <span className={cn(
                    'font-header uppercase text-xs tracking-widest hidden md:block',
                    step === s ? 'text-black font-bold' : 'text-neutral-400'
                  )}>
                    {s === 1 ? 'Envío' : s === 2 ? 'Pago' : 'Resumen'}
                  </span>
                  {s < 3 && <div className="w-12 h-px bg-neutral-300 mx-2"></div>}
                </div>
              ))}
            </div>

            <form onSubmit={handleNext} className="space-y-8">
              {step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                  <h2 className="text-2xl font-header font-black uppercase tracking-tight flex items-center gap-2">
                    <Truck size={24} /> Información de Envío
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-header uppercase font-bold tracking-widest">Nombre</label>
                      <input required value={formData.firstName} onChange={(e) => handleChange('firstName', e.target.value)} className="w-full border-2 border-black p-3 bg-white outline-none focus:bg-neutral-50" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-header uppercase font-bold tracking-widest">Apellido</label>
                      <input required value={formData.lastName} onChange={(e) => handleChange('lastName', e.target.value)} className="w-full border-2 border-black p-3 bg-white outline-none focus:bg-neutral-50" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-header uppercase font-bold tracking-widest">Email</label>
                    <input required type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} className="w-full border-2 border-black p-3 bg-white outline-none focus:bg-neutral-50" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-header uppercase font-bold tracking-widest">Dirección</label>
                    <input required value={formData.address} onChange={(e) => handleChange('address', e.target.value)} className="w-full border-2 border-black p-3 bg-white outline-none focus:bg-neutral-50" />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="col-span-2 md:col-span-1 space-y-2">
                      <label className="text-xs font-header uppercase font-bold tracking-widest">Ciudad</label>
                      <input required value={formData.city} onChange={(e) => handleChange('city', e.target.value)} className="w-full border-2 border-black p-3 bg-white outline-none focus:bg-neutral-50" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-header uppercase font-bold tracking-widest">Código Postal</label>
                      <input required value={formData.zip} onChange={(e) => handleChange('zip', e.target.value)} className="w-full border-2 border-black p-3 bg-white outline-none focus:bg-neutral-50" />
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                  <h2 className="text-2xl font-header font-black uppercase tracking-tight flex items-center gap-2">
                    <CreditCard size={24} /> Detalles de Pago
                  </h2>
                  <div className="bg-neutral-100 p-4 border-l-4 border-black mb-6">
                    <p className="text-xs text-neutral-600 font-medium">El pedido sí se guarda en la BD local; el cobro sigue siendo una captura simulada.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-header uppercase font-bold tracking-widest">Número de Tarjeta</label>
                    <input required value={formData.cardNumber} onChange={(e) => handleChange('cardNumber', e.target.value)} className="w-full border-2 border-black p-3 bg-white outline-none focus:bg-neutral-50" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-header uppercase font-bold tracking-widest">Expiración</label>
                      <input required value={formData.expiry} onChange={(e) => handleChange('expiry', e.target.value)} className="w-full border-2 border-black p-3 bg-white outline-none focus:bg-neutral-50" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-header uppercase font-bold tracking-widest">CVC</label>
                      <input required value={formData.cvc} onChange={(e) => handleChange('cvc', e.target.value)} className="w-full border-2 border-black p-3 bg-white outline-none focus:bg-neutral-50" />
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                  <h2 className="text-2xl font-header font-black uppercase tracking-tight">Resumen del Pedido</h2>
                  <div className="bg-white border-2 border-black p-6 space-y-4">
                    {cart.map((item) => (
                      <div key={`${item.id}-${item.selectedSize || 'base'}`} className="flex items-center justify-between gap-4 border-b border-neutral-200 pb-4 last:border-b-0 last:pb-0">
                        <div>
                          <p className="font-header font-bold uppercase">{item.name}</p>
                          <p className="text-xs text-neutral-500">{item.quantity} pieza(s) · {item.selectedSize || 'Talla única'}</p>
                        </div>
                        <p className="font-header font-black">${((item.salePrice ?? item.price) * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button type="submit" size="lg" className="min-w-56" disabled={isSubmitting}>
                  {step < 3 ? 'Continuar' : isSubmitting ? 'Guardando pedido...' : 'Confirmar compra'}
                </Button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-5">
            <div className="bg-white border-2 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sticky top-28">
              <h3 className="font-header font-black uppercase text-xl mb-6">Tu Orden</h3>
              <div className="space-y-4 mb-6">
                {cart.map((item) => (
                  <div key={`${item.id}-${item.selectedSize || 'base'}-summary`} className="flex justify-between gap-4 text-sm">
                    <span>{item.name} × {item.quantity}</span>
                    <span>${((item.salePrice ?? item.price) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t-2 border-black pt-4 flex justify-between font-header font-black text-xl">
                <span>Total</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

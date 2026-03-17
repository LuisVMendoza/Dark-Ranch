import React, { useState } from 'react';
import { useCart } from '../cart-context';
import { Button, SectionTitle, cn } from './ui';
import { CreditCard, Truck, MapPin, CheckCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export const CheckoutPage = ({ onBack }: { onBack: () => void }) => {
  const { cart, cartTotal, clearCart } = useCart();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    zip: '',
    cardNumber: '',
    expiry: '',
    cvc: ''
  });

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) setStep(step + 1);
    else {
      toast.success("¡Pedido realizado con éxito!");
      setStep(4);
      setTimeout(() => {
        clearCart();
      }, 2000);
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
          <p className="text-neutral-500 font-medium">Tu pedido #DR-2026-X89 se está preparando para el viaje al desierto. Recibirás un correo con los detalles del envío.</p>
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
          {/* Form Side */}
          <div className="lg:col-span-7 space-y-12">
            <div className="flex items-center gap-4 mb-8">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center font-bold font-header transition-colors",
                    step >= s ? "bg-black text-white" : "bg-neutral-200 text-neutral-500"
                  )}>{s}</div>
                  <span className={cn(
                    "font-header uppercase text-xs tracking-widest hidden md:block",
                    step === s ? "text-black font-bold" : "text-neutral-400"
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
                      <input required className="w-full border-2 border-black p-3 bg-white outline-none focus:bg-neutral-50" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-header uppercase font-bold tracking-widest">Apellido</label>
                      <input required className="w-full border-2 border-black p-3 bg-white outline-none focus:bg-neutral-50" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-header uppercase font-bold tracking-widest">Dirección</label>
                    <input required className="w-full border-2 border-black p-3 bg-white outline-none focus:bg-neutral-50" />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="col-span-2 md:col-span-1 space-y-2">
                      <label className="text-xs font-header uppercase font-bold tracking-widest">Ciudad</label>
                      <input required className="w-full border-2 border-black p-3 bg-white outline-none focus:bg-neutral-50" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-header uppercase font-bold tracking-widest">Código Postal</label>
                      <input required className="w-full border-2 border-black p-3 bg-white outline-none focus:bg-neutral-50" />
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
                    <p className="text-xs text-neutral-600 font-medium">Esta es una simulación de pago segura.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-header uppercase font-bold tracking-widest">Número de Tarjeta</label>
                    <input required placeholder="0000 0000 0000 0000" className="w-full border-2 border-black p-3 bg-white outline-none focus:bg-neutral-50" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-header uppercase font-bold tracking-widest">Vencimiento</label>
                      <input required placeholder="MM/YY" className="w-full border-2 border-black p-3 bg-white outline-none focus:bg-neutral-50" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-header uppercase font-bold tracking-widest">CVC</label>
                      <input required placeholder="123" className="w-full border-2 border-black p-3 bg-white outline-none focus:bg-neutral-50" />
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                  <h2 className="text-2xl font-header font-black uppercase tracking-tight">Revisa tu Orden</h2>
                  <div className="bg-white border-2 border-black p-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs text-neutral-400 font-header uppercase font-bold">Enviar a:</p>
                        <p className="font-header uppercase">Juan Pueblo, Calle Desierto 123, Ranch City, 55432</p>
                      </div>
                      <button onClick={() => setStep(1)} className="text-[#C4A484] font-header uppercase text-xs font-black">Editar</button>
                    </div>
                    <div className="h-px bg-neutral-200"></div>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs text-neutral-400 font-header uppercase font-bold">Pago:</p>
                        <p className="font-header uppercase">Tarjeta terminada en **** 4242</p>
                      </div>
                      <button onClick={() => setStep(2)} className="text-[#C4A484] font-header uppercase text-xs font-black">Editar</button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-8">
                {step > 1 && (
                  <Button type="button" variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
                    Anterior
                  </Button>
                )}
                <Button type="submit" className="flex-1 py-4 text-lg">
                  {step === 3 ? 'Confirmar Pedido' : 'Continuar'}
                </Button>
              </div>
            </form>
          </div>

          {/* Summary Side */}
          <div className="lg:col-span-5">
            <div className="bg-white border-2 border-black p-8 sticky top-24 shadow-[12px_12px_0px_0px_rgba(196,164,132,1)]">
              <h3 className="font-header text-2xl font-black uppercase mb-6 pb-4 border-b-2 border-neutral-100">Resumen del Pedido</h3>
              <div className="space-y-4 max-h-[40vh] overflow-y-auto mb-6 pr-2">
                {cart.map((item) => (
                  <div key={`${item.id}-${item.selectedSize}`} className="flex justify-between gap-4">
                    <div className="flex gap-3">
                      <div className="w-12 h-12 bg-neutral-100 border border-black/10">
                        <img src={item.images[0]} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-header text-sm font-bold uppercase">{item.name}</p>
                        <p className="text-[10px] text-neutral-500 uppercase">Cant: {item.quantity} | Talla: {item.selectedSize || 'N/A'}</p>
                      </div>
                    </div>
                    <p className="font-header font-bold text-sm">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-3 pt-6 border-t-2 border-neutral-100">
                <div className="flex justify-between text-sm text-neutral-600 font-header uppercase">
                  <span>Subtotal</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-neutral-600 font-header uppercase">
                  <span>Envío (Standard)</span>
                  <span className="text-green-600 font-bold">GRATIS</span>
                </div>
                <div className="flex justify-between text-2xl font-header font-black uppercase pt-4 border-t-2 border-black">
                  <span>Total</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

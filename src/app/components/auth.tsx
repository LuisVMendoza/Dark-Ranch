import React, { useState } from 'react';
import { Button, LOGO_HORIZONTAL, LOGO_CIRCULAR } from './ui';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { ImageWithFallback } from './common/ImageWithFallback';
import { loginAdmin, loginCustomer } from '../lib/api';
import { AdminUser, CustomerSession } from '../types';
import { toast } from 'sonner';

export const LoginPage = ({ onLogin }: { onLogin: (user: AdminUser | null) => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    try {
      const response = await loginAdmin(email, password);
      localStorage.setItem('dark-ranch-admin-user', JSON.stringify(response.user));
      toast.success('Sesión iniciada correctamente');
      onLogin(response.user);
    } catch (error) {
      localStorage.removeItem('dark-ranch-admin-user');
      toast.error(error instanceof Error ? error.message : 'No se pudo iniciar sesión');
      onLogin(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      <div className="hidden lg:block relative bg-black overflow-hidden">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1520116468816-95b69f847357?q=80&w=1200&auto=format&fit=crop"
          alt="Dark Ranch Background"
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
        <div className="absolute inset-0 flex flex-col items-center justify-center p-20 text-center">
          <ImageWithFallback src={LOGO_CIRCULAR} alt="Logo" className="w-48 h-48 mb-12 invert" />
          <h2 className="text-6xl font-header font-black text-white uppercase tracking-tighter mb-4 leading-none">
            Únete a la<br />Ranchería
          </h2>
          <p className="text-[#C4A484] font-header uppercase tracking-[0.3em] font-bold">Auténtico Estilo Industrial</p>
        </div>
      </div>

      <div className="flex items-center justify-center p-8 bg-[#fcf9f5]">
        <div className="w-full max-w-md space-y-10">
          <div className="text-center lg:text-left">
            <ImageWithFallback src={LOGO_HORIZONTAL} alt="Logo" className="h-10 w-auto mb-8 mx-auto lg:mx-0" />
            <h1 className="text-4xl font-header font-black uppercase tracking-tight mb-2">Iniciar Sesión</h1>
            <p className="text-neutral-500 font-medium">
              Accede al panel de administración.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-header uppercase font-bold tracking-widest flex items-center gap-2">
                <Mail size={14} /> Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full border-2 border-black p-4 bg-white outline-none focus:ring-1 focus:ring-[#C4A484]"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-header uppercase font-bold tracking-widest flex items-center gap-2">
                <Lock size={14} /> Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border-2 border-black p-4 bg-white outline-none focus:ring-1 focus:ring-[#C4A484]"
                required
              />
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full py-4 text-lg flex items-center justify-center gap-2 group">
              {isSubmitting ? 'Validando...' : 'Entrar'} <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export const CustomerLoginDialog = ({
  isOpen,
  onClose,
  onLogin,
}: {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (customer: CustomerSession) => void;
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-[80] flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-[#fcf9f5] border-2 border-black p-8 space-y-6">
        <div className="space-y-2">
          <h2 className="font-header font-black uppercase text-2xl">Acceso de cliente</h2>
          <p className="text-sm text-neutral-600">Solo te pedimos nombre y email para identificar tus pedidos y comentarios.</p>
        </div>
        <div className="space-y-4">
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Tu nombre" className="w-full border-2 border-black p-3 bg-white" />
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="email@ejemplo.com" className="w-full border-2 border-black p-3 bg-white" />
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            disabled={isSubmitting}
            onClick={async () => {
              if (!name.trim() || !email.trim()) {
                toast.error('Nombre y email son obligatorios');
                return;
              }
              setIsSubmitting(true);
              try {
                const response = await loginCustomer(name.trim(), email.trim());
                onLogin(response.customer);
                toast.success('Sesión de cliente iniciada');
                onClose();
              } catch (error) {
                toast.error(error instanceof Error ? error.message : 'No se pudo iniciar sesión');
              } finally {
                setIsSubmitting(false);
              }
            }}
          >
            {isSubmitting ? 'Entrando...' : 'Continuar'}
          </Button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Button, LOGO_HORIZONTAL, LOGO_CIRCULAR } from './ui';
import { Mail, Lock, ArrowRight, User } from 'lucide-react';
import { ImageWithFallback } from './common/ImageWithFallback';
import { loginUser, registerUser } from '../lib/api';
import { toast } from 'sonner';

export interface AuthUser {
  id: number | string;
  email: string;
  name: string;
  role: string;
}

export const LoginPage = ({ onLogin }: { onLogin: (user: AuthUser) => void }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    try {
      const response = mode === 'login'
        ? await loginUser(email, password)
        : await registerUser(name, email, password);
      toast.success(mode === 'login' ? 'Sesión iniciada correctamente' : 'Cuenta creada correctamente');
      onLogin(response.user);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo completar la acción');
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
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <ImageWithFallback src={LOGO_HORIZONTAL} alt="Logo" className="h-10 w-auto mb-8 mx-auto lg:mx-0" />
            <h1 className="text-4xl font-header font-black uppercase tracking-tight mb-2">
              {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </h1>
            <p className="text-neutral-500 font-medium">Accede para comentar y revisar tus pedidos.</p>
          </div>

          <div className="grid grid-cols-2 gap-2 bg-white border border-black p-1">
            <button type="button" onClick={() => setMode('login')} className={`py-2 font-header uppercase text-xs ${mode === 'login' ? 'bg-black text-white' : 'text-black'}`}>
              Entrar
            </button>
            <button type="button" onClick={() => setMode('register')} className={`py-2 font-header uppercase text-xs ${mode === 'register' ? 'bg-black text-white' : 'text-black'}`}>
              Registrarse
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'register' && (
              <div className="space-y-2">
                <label className="text-xs font-header uppercase font-bold tracking-widest flex items-center gap-2">
                  <User size={14} /> Nombre
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border-2 border-black p-4 bg-white outline-none focus:ring-1 focus:ring-[#C4A484]"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-header uppercase font-bold tracking-widest flex items-center gap-2">
                <Mail size={14} /> Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                className="w-full border-2 border-black p-4 bg-white outline-none focus:ring-1 focus:ring-[#C4A484]"
                required
              />
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full py-4 text-lg flex items-center justify-center gap-2 group">
              {isSubmitting ? 'Procesando...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

// Compatibilidad temporal: evita romper clientes con bundles viejos que aún
// intentan renderizar CustomerLoginDialog.
export const CustomerLoginDialog = (_props: {
  isOpen?: boolean;
  onClose?: () => void;
  onLogin?: (user: AuthUser) => void;
}) => null;

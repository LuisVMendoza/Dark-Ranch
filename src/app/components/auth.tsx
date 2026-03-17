import React, { useState } from 'react';
import { Button, LOGO_HORIZONTAL, LOGO_CIRCULAR } from './ui';
import { Mail, Lock, ArrowRight, Github } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

export const LoginPage = ({ onLogin }: { onLogin: (isAdmin: boolean) => void }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple logic for demo: "admin@darkranch.com" triggers admin panel
    onLogin(email === 'admin@darkranch.com');
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left side - Visual */}
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

      {/* Right side - Form */}
      <div className="flex items-center justify-center p-8 bg-[#fcf9f5]">
        <div className="w-full max-w-md space-y-10">
          <div className="text-center lg:text-left">
            <ImageWithFallback src={LOGO_HORIZONTAL} alt="Logo" className="h-10 w-auto mb-8 mx-auto lg:mx-0" />
            <h1 className="text-4xl font-header font-black uppercase tracking-tight mb-2">
              {isRegister ? 'Crear Cuenta' : 'Iniciar Sesión'}
            </h1>
            <p className="text-neutral-500 font-medium">
              {isRegister ? 'Forma parte de la leyenda de Dark Ranch.' : 'Bienvenido de vuelta al taller.'}
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
                placeholder="vaquero@ejemplo.com"
                className="w-full border-2 border-black p-4 bg-white outline-none focus:ring-1 focus:ring-[#C4A484]"
                required
              />
              <p className="text-[10px] text-neutral-400 italic mt-1">Tip: Usa admin@darkranch.com para ver el panel de administración.</p>
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

            <Button type="submit" className="w-full py-4 text-lg flex items-center justify-center gap-2 group">
              {isRegister ? 'Registrarse' : 'Entrar'} <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-300"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase font-header font-bold">
              <span className="bg-[#fcf9f5] px-4 text-neutral-500">O continuar con</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <button className="flex items-center justify-center gap-2 border-2 border-neutral-300 p-3 font-header font-bold uppercase hover:bg-white transition-colors">
              <Github size={20} /> Github
            </button>
          </div>

          <p className="text-center text-sm text-neutral-600 font-header uppercase">
            {isRegister ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'} {' '}
            <button 
              onClick={() => setIsRegister(!isRegister)}
              className="text-black font-black hover:underline underline-offset-4"
            >
              {isRegister ? 'Inicia Sesión' : 'Regístrate'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

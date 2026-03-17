import React from 'react';
import { SectionTitle, PaperCard, Button, OrnateBorder, LOGO_CIRCULAR } from './ui';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

export const AboutPage = ({ text }: { text: string }) => (
  <div className="pt-32 pb-24 bg-[#fcf9f5]">
    <div className="container mx-auto px-6">
      <SectionTitle subtitle="Nuestra Herencia">La Leyenda de Dark Ranch</SectionTitle>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-8">
          <p className="text-2xl font-header font-light leading-relaxed text-neutral-700 first-letter:text-6xl first-letter:font-western first-letter:mr-3 first-letter:float-left">
            {text}
          </p>
          <OrnateBorder className="!justify-start" />
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h4 className="font-western text-[#C4A484] text-xl mb-2">1922</h4>
              <p className="font-header uppercase text-xs font-bold tracking-widest text-neutral-400">Año de Fundación</p>
            </div>
            <div>
              <h4 className="font-western text-[#C4A484] text-xl mb-2">SONORA</h4>
              <p className="font-header uppercase text-xs font-bold tracking-widest text-neutral-400">Sede Principal</p>
            </div>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -top-10 -right-10 w-40 h-40 opacity-20 rotate-12">
            <ImageWithFallback src={LOGO_CIRCULAR} alt="Seal" />
          </div>
          <ImageWithFallback 
            src="https://images.unsplash.com/photo-1551816230-ef5deaed4a26?q=80&w=800&auto=format&fit=crop" 
            alt="Old Workshop"
            className="w-full aspect-[4/5] object-cover border-8 border-white shadow-2xl grayscale hover:grayscale-0 transition-all duration-1000"
          />
        </div>
      </div>
    </div>
  </div>
);

export const ContactPage = () => (
  <div className="pt-32 pb-24 bg-[#fcf9f5]">
    <div className="container mx-auto px-6">
      <div className="max-w-5xl mx-auto">
        <SectionTitle subtitle="Ponte en contacto" className="text-center">El Correo del Desierto</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="md:col-span-1 space-y-8">
            <PaperCard className="h-full">
              <h3 className="font-western text-2xl mb-6">Oficina Central</h3>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <MapPin className="text-[#C4A484] shrink-0" />
                  <p className="font-header uppercase text-sm font-bold">Avenida de los Vaqueros #42, Hermosillo, Sonora.</p>
                </div>
                <div className="flex gap-4">
                  <Mail className="text-[#C4A484] shrink-0" />
                  <p className="font-header uppercase text-sm font-bold">contacto@darkranch.com</p>
                </div>
                <div className="flex gap-4">
                  <Phone className="text-[#C4A484] shrink-0" />
                  <p className="font-header uppercase text-sm font-bold">+52 (662) 555-0123</p>
                </div>
              </div>
            </PaperCard>
          </div>
          <div className="md:col-span-2">
            <PaperCard>
              <form className="grid grid-cols-1 sm:row-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-header uppercase font-bold">Nombre Completo</label>
                  <input className="w-full border-2 border-black p-4 bg-white outline-none focus:ring-1 focus:ring-[#C4A484]" placeholder="John Marston" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-header uppercase font-bold">Correo Electrónico</label>
                  <input className="w-full border-2 border-black p-4 bg-white outline-none focus:ring-1 focus:ring-[#C4A484]" placeholder="john@outlaw.com" />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <label className="text-xs font-header uppercase font-bold">Mensaje / Telegrama</label>
                  <textarea rows={5} className="w-full border-2 border-black p-4 bg-white outline-none focus:ring-1 focus:ring-[#C4A484]" placeholder="Escribe tu mensaje aquí..."></textarea>
                </div>
                <div className="sm:col-span-2">
                  <Button className="w-full sm:w-auto flex items-center gap-2">
                    Enviar Telegrama <Send size={18} />
                  </Button>
                </div>
              </form>
            </PaperCard>
          </div>
        </div>
      </div>
    </div>
  </div>
);

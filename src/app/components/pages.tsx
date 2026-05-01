import React from 'react';
import { SectionTitle, PaperCard, Button, OrnateBorder, LOGO_CIRCULAR } from './ui';
import { ImageWithFallback } from './common/ImageWithFallback';
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

export const ContactPage = ({ email }: { email: string }) => (
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
                  <p className="font-header uppercase text-sm font-bold">{email}</p>
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
              <form className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-header uppercase font-bold">Nombre Completo</label>
                  <input className="w-full border-2 border-black p-4 bg-white outline-none focus:ring-1 focus:ring-[#C4A484]" placeholder="John Marston" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-header uppercase font-bold">Correo Electrónico</label>
                  <input className="w-full border-2 border-black p-4 bg-white outline-none focus:ring-1 focus:ring-[#C4A484]" placeholder={email} />
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

export const PoliciesPage = () => (
  <div className="pt-32 pb-24 bg-[#fcf9f5]">
    <div className="container mx-auto px-6 max-w-5xl space-y-8">
      <SectionTitle subtitle="Políticas oficiales">Envíos, Cambios y Devoluciones</SectionTitle>
      <PaperCard className="space-y-6">
        <div>
          <h3 className="font-western text-2xl mb-2">Devoluciones antes de 30 días</h3>
          <p className="text-neutral-700">Aceptamos devoluciones y cambios dentro de los <strong>30 días naturales</strong> posteriores a la entrega. La prenda debe conservar etiquetas, empaque y no mostrar uso.</p>
        </div>
        <div>
          <h4 className="font-header uppercase text-sm font-black tracking-[0.2em] text-[#C4A484] mb-2">Condiciones</h4>
          <ul className="list-disc pl-6 space-y-2 text-neutral-700">
            <li>Solicita tu devolución por correo a soporte@darkranch.com con tu número de pedido.</li>
            <li>Los reembolsos se procesan de 3 a 7 días hábiles tras validar el producto.</li>
            <li>Productos personalizados o de liquidación final no aplican para devolución.</li>
          </ul>
        </div>
      </PaperCard>
    </div>
  </div>
);

export const PrivacyPage = () => (
  <div className="pt-32 pb-24 bg-[#fcf9f5]">
    <div className="container mx-auto px-6 max-w-5xl space-y-8">
      <SectionTitle subtitle="Marco legal">Aviso de Privacidad</SectionTitle>
      <PaperCard className="space-y-4 text-neutral-700">
        <p>Recopilamos nombre, correo, dirección y datos necesarios para procesar pedidos y soporte al cliente.</p>
        <p>Usamos la información para facturación, envío, seguimiento de órdenes y mejora del servicio.</p>
        <p>No vendemos tus datos personales. Solo compartimos información con paqueterías y proveedores de pago para completar tu compra.</p>
        <p>Puedes solicitar acceso, rectificación o eliminación de tus datos escribiendo a privacidad@darkranch.com.</p>
      </PaperCard>
    </div>
  </div>
);

export const TermsPage = () => (
  <div className="pt-32 pb-24 bg-[#fcf9f5]">
    <div className="container mx-auto px-6 max-w-5xl space-y-8">
      <SectionTitle subtitle="Marco legal">Términos del Servicio</SectionTitle>
      <PaperCard className="space-y-4 text-neutral-700">
        <p>Al realizar una compra aceptas nuestros precios, tiempos de envío, políticas de cambio y devolución.</p>
        <p>La disponibilidad de inventario y tallas está sujeta a existencias al momento del pago.</p>
        <p>Dark Ranch puede actualizar productos, precios o promociones sin previo aviso.</p>
        <p>El uso indebido del sitio, fraude o intento de vulneración de seguridad puede resultar en cancelación de pedidos y bloqueo de cuenta.</p>
      </PaperCard>
    </div>
  </div>
);

export const LegalAgreementPage = () => (
  <div className="pt-8 pb-4 bg-[#fcf9f5]">
    <div className="container mx-auto px-6 max-w-5xl space-y-8">
      <SectionTitle subtitle="Privacidad y Términos">Acuerdo de Uso de Dark Ranch</SectionTitle>
      <PaperCard className="space-y-6 text-neutral-700">
        <p className="text-sm uppercase tracking-[0.2em] font-header font-black text-[#C4A484]">Última actualización: mayo 2026</p>
        <p>
          Este documento unifica nuestro <strong>Aviso de Privacidad</strong> y los <strong>Términos del Servicio</strong>. Al aceptar este acuerdo
          y continuar navegando en Dark Ranch, confirmas que leíste, entendiste y aceptaste estas condiciones para comprar, navegar o crear una cuenta.
        </p>

        <div className="space-y-3">
          <h3 className="font-western text-2xl">1) Datos que recopilamos</h3>
          <p>Podemos solicitar nombre completo, correo electrónico, teléfono, dirección de envío, datos de facturación e historial de compras.</p>
          <p>También recopilamos información técnica básica como IP, tipo de navegador, sistema operativo y eventos de navegación dentro de la tienda.</p>
        </div>

        <div className="space-y-3">
          <h3 className="font-western text-2xl">2) Cómo usamos tu información</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Procesar pedidos, pagos, envíos, cambios y devoluciones.</li>
            <li>Atender soporte al cliente y dar seguimiento a incidencias.</li>
            <li>Mejorar la experiencia de compra, catálogo y rendimiento del sitio.</li>
            <li>Prevenir fraude, abuso de promociones y accesos no autorizados.</li>
            <li>Cumplir obligaciones legales, fiscales y administrativas.</li>
          </ul>
        </div>

        <div className="space-y-3">
          <h3 className="font-western text-2xl">3) Compartición de datos</h3>
          <p>
            No vendemos tus datos personales. Solo compartimos información estrictamente necesaria con pasarelas de pago, paqueterías, proveedores
            tecnológicos y autoridades cuando existe una obligación legal.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="font-western text-2xl">4) Conservación y seguridad</h3>
          <p>
            Mantenemos medidas administrativas y técnicas razonables para proteger tus datos. Conservamos la información por el tiempo necesario
            para cumplir la relación comercial y obligaciones legales aplicables.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="font-western text-2xl">5) Derechos del usuario</h3>
          <p>
            Puedes solicitar acceso, corrección, actualización o eliminación de tus datos. También puedes solicitar limitar ciertos usos, sujeto a
            requisitos legales. Escríbenos a <strong>privacidad@darkranch.com</strong>.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="font-western text-2xl">6) Condiciones de compra y uso</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Los precios y promociones pueden cambiar sin previo aviso.</li>
            <li>La disponibilidad de inventario está sujeta a existencias reales.</li>
            <li>El uso fraudulento del sitio puede provocar cancelación de pedidos y bloqueo de cuenta.</li>
            <li>Para devoluciones aplican las políticas publicadas y el estado del producto recibido.</li>
          </ul>
        </div>

        <div className="space-y-3">
          <h3 className="font-western text-2xl">7) Cambios al acuerdo</h3>
          <p>
            Podemos actualizar este acuerdo por cambios legales, operativos o comerciales. Cuando existan cambios relevantes, publicaremos la nueva
            versión en el sitio con su fecha de actualización.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="font-western text-2xl">8) Contacto legal</h3>
          <p>
            Para dudas sobre privacidad, tratamiento de datos o términos del servicio, contáctanos en <strong>privacidad@darkranch.com</strong> o
            <strong> legal@darkranch.com</strong>.
          </p>
        </div>
      </PaperCard>
    </div>
  </div>
);

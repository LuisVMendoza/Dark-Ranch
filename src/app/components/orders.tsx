import React, { useEffect, useState } from 'react';
import { CustomerOrder, CustomerSession } from '../types';
import { Button } from './ui';
import { getMyOrders } from '../lib/api';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

export const OrdersPage = ({
  customer,
  onBack,
  onRequireLogin,
  onLogout,
}: {
  customer: CustomerSession | null;
  onBack: () => void;
  onRequireLogin: () => void;
  onLogout: () => void;
}) => {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadOrders = async () => {
      if (!customer) return;
      setIsLoading(true);
      try {
        const response = await getMyOrders(customer.id, customer.email);
        setOrders(response.orders);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'No se pudieron cargar tus pedidos');
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();
  }, [customer]);

  return (
    <div className="min-h-screen bg-[#fcf9f5] pt-28 pb-20">
      <div className="container mx-auto px-6 space-y-8">
        <button onClick={onBack} className="font-header uppercase text-xs tracking-wider flex items-center gap-2 hover:text-[#C4A484] transition-colors">
          <ArrowLeft size={16} /> Volver
        </button>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-western text-5xl uppercase">Mis pedidos</h1>
            <p className="text-neutral-600 mt-2">Aquí verás tus compras sin necesidad de crear cuenta tradicional.</p>
          </div>
          {customer && (
            <Button variant="outline" onClick={onLogout}>
              Cerrar sesión
            </Button>
          )}
        </div>

        {!customer ? (
          <div className="bg-white border-2 border-black p-8 space-y-4">
            <p>Para ver tus pedidos inicia sesión con tu nombre y email de compra.</p>
            <Button onClick={onRequireLogin}>Iniciar sesión de cliente</Button>
          </div>
        ) : isLoading ? (
          <p>Cargando tus pedidos...</p>
        ) : orders.length === 0 ? (
          <div className="bg-white border-2 border-black p-8">Aún no encontramos pedidos para {customer.email}.</div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <article key={order.orderNumber} className="bg-white border-2 border-black p-6 space-y-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <h2 className="font-header font-black uppercase text-lg">Pedido {order.orderNumber}</h2>
                  <p className="text-sm text-neutral-600">{new Date(order.createdAt).toLocaleString()}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <p><span className="font-semibold">Estado:</span> {order.status}</p>
                  <p><span className="font-semibold">Pago:</span> {order.paymentStatus}</p>
                  <p><span className="font-semibold">Total:</span> ${order.total.toFixed(2)}</p>
                </div>
                <div className="border-t border-neutral-200 pt-3 space-y-2">
                  {order.items.map((item, index) => (
                    <div key={`${order.id}-item-${index}`} className="flex justify-between gap-4 text-sm">
                      <span>{item.productName} × {item.quantity}</span>
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

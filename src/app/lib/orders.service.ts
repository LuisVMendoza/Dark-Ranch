/**
 * =====================================================
 * DARK RANCH - ORDERS SERVICE
 * =====================================================
 * Servicio completo para gestión de órdenes
 */

import { supabase, getCurrentAdminId } from './supabase';

// =====================================================
// INTERFACES
// =====================================================

export interface ShippingInfo {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  city: string;
  zip: string;
  country?: string;
  phone?: string;
}

export interface PaymentInfo {
  method: 'card' | 'paypal' | 'transfer';
  transaction_id?: string;
  lastFourDigits?: string;
  status: 'pending' | 'completed' | 'failed';
}

export interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  price_at_purchase: number;
  selected_size?: string;
  selected_color?: string;
}

export interface CreateOrderInput {
  user_id?: string; // Opcional para guest checkout
  items: OrderItem[];
  shipping_info: ShippingInfo;
  payment_info: PaymentInfo;
  subtotal: number;
  shipping_cost?: number;
  tax?: number;
}

export interface Order {
  id: string;
  user_id: string | null;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  subtotal: number;
  shipping_cost: number;
  tax: number;
  total: number;
  shipping_info: ShippingInfo;
  payment_info: PaymentInfo;
  tracking_number: string | null;
  admin_notes: string | null;
  assigned_to: string | null;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  items?: OrderItem[];
}

// =====================================================
// CRUD OPERATIONS
// =====================================================

/**
 * Crear una nueva orden
 */
export async function createOrder(input: CreateOrderInput): Promise<Order> {
  // 1. Generar número de orden
  const { data: orderNumberData, error: orderNumberError } = await supabase
    .rpc('generate_order_number');

  if (orderNumberError) {
    console.error('Error generating order number:', orderNumberError);
    throw new Error('No se pudo generar el número de orden');
  }

  const orderId = orderNumberData;

  // 2. Calcular totales
  const subtotal = input.subtotal;
  const shipping_cost = input.shipping_cost || 0;
  const tax = input.tax || 0;
  const total = subtotal + shipping_cost + tax;

  // 3. Crear orden
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .insert({
      id: orderId,
      user_id: input.user_id || null,
      status: 'pending',
      subtotal,
      shipping_cost,
      tax,
      total,
      shipping_info: input.shipping_info,
      payment_info: input.payment_info,
      priority: 'medium',
    })
    .select()
    .single();

  if (orderError) {
    console.error('Error creating order:', orderError);
    throw new Error('No se pudo crear la orden');
  }

  // 4. Crear items de la orden
  const orderItems = input.items.map((item) => ({
    order_id: orderId,
    product_id: item.product_id,
    product_name: item.product_name,
    product_sku: item.product_id,
    quantity: item.quantity,
    price_at_purchase: item.price_at_purchase,
    subtotal: item.quantity * item.price_at_purchase,
    selected_size: item.selected_size,
    selected_color: item.selected_color,
  }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems);

  if (itemsError) {
    console.error('Error creating order items:', itemsError);
    // Rollback: eliminar orden si fallan los items
    await supabase.from('orders').delete().eq('id', orderId);
    throw new Error('No se pudieron crear los items de la orden');
  }

  // 5. Reducir stock de productos
  for (const item of input.items) {
    const { data: product } = await supabase
      .from('products')
      .select('stock')
      .eq('id', item.product_id)
      .single();

    if (product) {
      await supabase
        .from('products')
        .update({ stock: product.stock - item.quantity })
        .eq('id', item.product_id);
    }
  }

  // 6. Si hay usuario, limpiar su carrito
  if (input.user_id) {
    await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', input.user_id);
  }

  // 7. Calcular métricas del día
  await supabase.rpc('calculate_daily_metrics');

  return orderData;
}

/**
 * Obtener orden por ID
 */
export async function getOrderById(orderId: string): Promise<Order | null> {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      items:order_items(*)
    `)
    .eq('id', orderId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching order:', error);
    throw new Error(error.message);
  }

  return data;
}

/**
 * Obtener todas las órdenes (con filtros)
 */
export async function getOrders(filters?: {
  status?: string;
  user_id?: string;
  from_date?: string;
  to_date?: string;
  limit?: number;
}): Promise<Order[]> {
  let query = supabase
    .from('orders')
    .select(`
      *,
      items:order_items(*)
    `)
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.user_id) {
    query = query.eq('user_id', filters.user_id);
  }
  if (filters?.from_date) {
    query = query.gte('created_at', filters.from_date);
  }
  if (filters?.to_date) {
    query = query.lte('created_at', filters.to_date);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching orders:', error);
    throw new Error(error.message);
  }

  return data;
}

/**
 * Actualizar estado de orden
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: Order['status'],
  adminNotes?: string
): Promise<Order> {
  const adminId = await getCurrentAdminId();

  const updateData: any = {
    status: newStatus,
    updated_by: adminId,
  };

  if (adminNotes) {
    updateData.admin_notes = adminNotes;
  }

  if (newStatus === 'delivered' || newStatus === 'cancelled' || newStatus === 'refunded') {
    updateData.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', orderId)
    .select()
    .single();

  if (error) {
    console.error('Error updating order status:', error);
    throw new Error(error.message);
  }

  // Log activity
  if (adminId) {
    await supabase.from('activity_logs').insert({
      admin_id: adminId,
      action: 'update_status',
      entity_type: 'order',
      entity_id: orderId,
      changes: { status: newStatus, notes: adminNotes },
    });
  }

  return data;
}

/**
 * Asignar orden a admin
 */
export async function assignOrder(orderId: string, adminId: string): Promise<Order> {
  const { data, error } = await supabase
    .from('orders')
    .update({ assigned_to: adminId })
    .eq('id', orderId)
    .select()
    .single();

  if (error) {
    console.error('Error assigning order:', error);
    throw new Error(error.message);
  }

  return data;
}

/**
 * Agregar tracking number
 */
export async function addTrackingNumber(
  orderId: string,
  trackingNumber: string
): Promise<Order> {
  const { data, error } = await supabase
    .from('orders')
    .update({ tracking_number: trackingNumber })
    .eq('id', orderId)
    .select()
    .single();

  if (error) {
    console.error('Error adding tracking number:', error);
    throw new Error(error.message);
  }

  return data;
}

/**
 * Obtener órdenes del día
 */
export async function getTodayOrders(): Promise<Order[]> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .gte('created_at', today)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching today orders:', error);
    throw new Error(error.message);
  }

  return data;
}

/**
 * Obtener estadísticas de órdenes
 */
export async function getOrderStats() {
  const { data, error } = await supabase
    .from('orders')
    .select('status, total, created_at');

  if (error) {
    console.error('Error fetching order stats:', error);
    throw new Error(error.message);
  }

  const stats = {
    total: data.length,
    by_status: data.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    total_revenue: data.reduce((sum, order) => sum + Number(order.total), 0),
    today: data.filter((o) =>
      new Date(o.created_at).toDateString() === new Date().toDateString()
    ).length,
  };

  return stats;
}

/**
 * Cancelar orden
 */
export async function cancelOrder(orderId: string, reason?: string): Promise<Order> {
  // 1. Obtener items de la orden
  const { data: orderItems } = await supabase
    .from('order_items')
    .select('product_id, quantity')
    .eq('order_id', orderId);

  // 2. Restaurar stock
  if (orderItems) {
    for (const item of orderItems) {
      const { data: product } = await supabase
        .from('products')
        .select('stock')
        .eq('id', item.product_id)
        .single();

      if (product) {
        await supabase
          .from('products')
          .update({ stock: product.stock + item.quantity })
          .eq('id', item.product_id);
      }
    }
  }

  // 3. Actualizar orden
  return updateOrderStatus(orderId, 'cancelled', reason);
}

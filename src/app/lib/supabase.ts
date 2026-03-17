/**
 * =====================================================
 * DARK RANCH - SUPABASE CLIENT CONFIGURATION
 * =====================================================
 * Configuración del cliente de Supabase para la app
 */

import { createClient } from '@supabase/supabase-js';

// Tipos de la base de datos
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          password_hash: string;
          first_name: string | null;
          last_name: string | null;
          role: 'customer' | 'admin';
          last_login: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      products: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          price: number;
          sale_price: number | null;
          category_id: string;
          stock: number;
          low_stock_threshold: number;
          images: string[];
          sizes: string[];
          colors: string[];
          tags: string[];
          variants: any[];
          is_new: boolean;
          is_featured: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
        };
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['products']['Insert']>;
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          image_url: string | null;
          display_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      orders: {
        Row: {
          id: string;
          user_id: string | null;
          status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
          subtotal: number;
          shipping_cost: number;
          tax: number;
          total: number;
          shipping_info: any;
          payment_info: any;
          tracking_number: string | null;
          admin_notes: string | null;
          assigned_to: string | null;
          priority: 'low' | 'medium' | 'high';
          created_at: string;
          updated_at: string;
          completed_at: string | null;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          product_name: string;
          product_sku: string;
          quantity: number;
          price_at_purchase: number;
          subtotal: number;
          selected_size: string | null;
          selected_color: string | null;
          product_snapshot: any;
          created_at: string;
        };
      };
    };
  };
}

// Inicializar cliente de Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
});

/**
 * Helper para verificar si el usuario actual es admin
 */
export async function isUserAdmin(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  return data?.role === 'admin';
}

/**
 * Helper para obtener el admin_user_id del usuario actual
 */
export async function getCurrentAdminId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('admin_users')
    .select('id')
    .eq('user_id', user.id)
    .single();

  return data?.id || null;
}

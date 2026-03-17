/**
 * =====================================================
 * DARK RANCH - PRODUCTS CRUD SERVICE
 * =====================================================
 * Servicio completo para gestión de productos con Supabase
 */

import { supabase, getCurrentAdminId } from './supabase';
import { Product } from '../data';

// =====================================================
// INTERFACES Y TIPOS
// =====================================================

export interface ProductVariant {
  size: string;
  color: string;
  stock: number;
  sku?: string;
}

export interface CreateProductInput {
  id: string; // SKU (ej: "dr-001")
  name: string;
  slug: string;
  description: string;
  price: number;
  sale_price?: number;
  category_id: string;
  stock: number;
  low_stock_threshold?: number;
  images: string[];
  sizes: string[];
  colors: string[];
  tags: string[];
  variants?: ProductVariant[];
  is_new?: boolean;
  is_featured?: boolean;
  is_active?: boolean;
}

export interface UpdateProductInput extends Partial<CreateProductInput> {
  id: string;
}

export interface ProductFilters {
  category_id?: string;
  is_featured?: boolean;
  is_new?: boolean;
  min_price?: number;
  max_price?: number;
  search?: string;
  tags?: string[];
  in_stock_only?: boolean;
}

// =====================================================
// CRUD OPERATIONS
// =====================================================

/**
 * Obtener todos los productos (con filtros opcionales)
 */
export async function getProducts(filters?: ProductFilters): Promise<Product[]> {
  let query = supabase
    .from('products')
    .select(`
      *,
      category:categories(id, name, slug)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  // Aplicar filtros
  if (filters?.category_id) {
    query = query.eq('category_id', filters.category_id);
  }
  if (filters?.is_featured !== undefined) {
    query = query.eq('is_featured', filters.is_featured);
  }
  if (filters?.is_new !== undefined) {
    query = query.eq('is_new', filters.is_new);
  }
  if (filters?.min_price !== undefined) {
    query = query.gte('price', filters.min_price);
  }
  if (filters?.max_price !== undefined) {
    query = query.lte('price', filters.max_price);
  }
  if (filters?.in_stock_only) {
    query = query.gt('stock', 0);
  }
  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }
  if (filters?.tags && filters.tags.length > 0) {
    query = query.contains('tags', filters.tags);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching products:', error);
    throw new Error(error.message);
  }

  return data.map(transformProductFromDB);
}

/**
 * Obtener un producto por ID
 */
export async function getProductById(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(id, name, slug)
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('Error fetching product:', error);
    throw new Error(error.message);
  }

  return transformProductFromDB(data);
}

/**
 * Obtener un producto por slug
 */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(id, name, slug)
    `)
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching product by slug:', error);
    throw new Error(error.message);
  }

  return transformProductFromDB(data);
}

/**
 * Crear un nuevo producto
 */
export async function createProduct(input: CreateProductInput): Promise<Product> {
  const adminId = await getCurrentAdminId();

  const { data, error } = await supabase
    .from('products')
    .insert({
      ...input,
      variants: input.variants || [],
      low_stock_threshold: input.low_stock_threshold || 5,
      is_new: input.is_new || false,
      is_featured: input.is_featured || false,
      is_active: input.is_active !== undefined ? input.is_active : true,
      created_by: adminId,
      updated_by: adminId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating product:', error);
    throw new Error(error.message);
  }

  // Registrar actividad
  if (adminId) {
    await logActivity(adminId, 'create', 'product', data.id, { product: data });
  }

  return transformProductFromDB(data);
}

/**
 * Actualizar un producto existente
 */
export async function updateProduct(input: UpdateProductInput): Promise<Product> {
  const adminId = await getCurrentAdminId();
  const { id, ...updates } = input;

  // Obtener producto actual para el log
  const oldProduct = await getProductById(id);

  const { data, error } = await supabase
    .from('products')
    .update({
      ...updates,
      updated_by: adminId,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating product:', error);
    throw new Error(error.message);
  }

  // Registrar actividad
  if (adminId && oldProduct) {
    await logActivity(adminId, 'update', 'product', id, {
      before: oldProduct,
      after: data,
    });
  }

  return transformProductFromDB(data);
}

/**
 * Eliminar un producto (soft delete)
 */
export async function deleteProduct(id: string): Promise<void> {
  const adminId = await getCurrentAdminId();

  // Obtener producto antes de eliminarlo
  const product = await getProductById(id);

  const { error } = await supabase
    .from('products')
    .update({ is_active: false, updated_by: adminId })
    .eq('id', id);

  if (error) {
    console.error('Error deleting product:', error);
    throw new Error(error.message);
  }

  // Registrar actividad
  if (adminId && product) {
    await logActivity(adminId, 'delete', 'product', id, { product });
  }
}

/**
 * Eliminar permanentemente un producto
 */
export async function hardDeleteProduct(id: string): Promise<void> {
  const adminId = await getCurrentAdminId();
  const product = await getProductById(id);

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error hard deleting product:', error);
    throw new Error(error.message);
  }

  // Registrar actividad
  if (adminId && product) {
    await logActivity(adminId, 'hard_delete', 'product', id, { product });
  }
}

/**
 * Actualizar stock de un producto
 */
export async function updateProductStock(
  productId: string,
  newStock: number
): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .update({ stock: newStock })
    .eq('id', productId)
    .select()
    .single();

  if (error) {
    console.error('Error updating stock:', error);
    throw new Error(error.message);
  }

  return transformProductFromDB(data);
}

/**
 * Actualizar stock de variantes
 */
export async function updateVariantStock(
  productId: string,
  size: string,
  color: string,
  newStock: number
): Promise<Product> {
  // Obtener producto actual
  const product = await getProductById(productId);
  if (!product) throw new Error('Product not found');

  // Actualizar variantes
  const variants = (product as any).variants || [];
  const updatedVariants = variants.map((v: ProductVariant) =>
    v.size === size && v.color === color ? { ...v, stock: newStock } : v
  );

  // Calcular stock total
  const totalStock = updatedVariants.reduce(
    (sum: number, v: ProductVariant) => sum + v.stock,
    0
  );

  return updateProduct({
    id: productId,
    variants: updatedVariants,
    stock: totalStock,
  });
}

/**
 * Obtener productos con stock bajo
 */
export async function getLowStockProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(id, name, slug)
    `)
    .eq('is_active', true)
    .filter('stock', 'lte', 'low_stock_threshold')
    .order('stock', { ascending: true });

  if (error) {
    console.error('Error fetching low stock products:', error);
    throw new Error(error.message);
  }

  return data.map(transformProductFromDB);
}

/**
 * Obtener productos destacados
 */
export async function getFeaturedProducts(limit = 6): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(id, name, slug)
    `)
    .eq('is_active', true)
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching featured products:', error);
    throw new Error(error.message);
  }

  return data.map(transformProductFromDB);
}

/**
 * Obtener productos nuevos
 */
export async function getNewProducts(limit = 6): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(id, name, slug)
    `)
    .eq('is_active', true)
    .eq('is_new', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching new products:', error);
    throw new Error(error.message);
  }

  return data.map(transformProductFromDB);
}

/**
 * Búsqueda de productos por texto
 */
export async function searchProducts(searchTerm: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(id, name, slug)
    `)
    .eq('is_active', true)
    .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,tags.cs.{${searchTerm}}`)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error searching products:', error);
    throw new Error(error.message);
  }

  return data.map(transformProductFromDB);
}

// =====================================================
// IMAGE UPLOAD CON SUPABASE STORAGE
// =====================================================

/**
 * Subir imagen de producto a Supabase Storage
 */
export async function uploadProductImage(
  file: File,
  productId: string
): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${productId}-${Date.now()}.${fileExt}`;
  const filePath = `products/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    console.error('Error uploading image:', uploadError);
    throw new Error(uploadError.message);
  }

  // Obtener URL pública
  const { data } = supabase.storage
    .from('product-images')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

/**
 * Eliminar imagen de producto
 */
export async function deleteProductImage(imageUrl: string): Promise<void> {
  // Extraer path de la URL
  const path = imageUrl.split('/storage/v1/object/public/product-images/')[1];
  if (!path) return;

  const { error } = await supabase.storage
    .from('product-images')
    .remove([path]);

  if (error) {
    console.error('Error deleting image:', error);
  }
}

// =====================================================
// BULK OPERATIONS
// =====================================================

/**
 * Actualizar múltiples productos (operación masiva)
 */
export async function bulkUpdateProducts(
  updates: Array<{ id: string; updates: Partial<CreateProductInput> }>
): Promise<void> {
  const adminId = await getCurrentAdminId();

  for (const { id, updates: productUpdates } of updates) {
    await updateProduct({ id, ...productUpdates });
  }

  // Registrar actividad bulk
  if (adminId) {
    await logActivity(adminId, 'bulk_update', 'product', 'multiple', {
      count: updates.length,
      updates,
    });
  }
}

/**
 * Importar productos desde JSON
 */
export async function importProducts(products: CreateProductInput[]): Promise<void> {
  const adminId = await getCurrentAdminId();

  const { error } = await supabase.from('products').insert(
    products.map((p) => ({
      ...p,
      variants: p.variants || [],
      low_stock_threshold: p.low_stock_threshold || 5,
      created_by: adminId,
      updated_by: adminId,
    }))
  );

  if (error) {
    console.error('Error importing products:', error);
    throw new Error(error.message);
  }

  // Registrar actividad
  if (adminId) {
    await logActivity(adminId, 'import', 'product', 'multiple', {
      count: products.length,
    });
  }
}

/**
 * Exportar productos a JSON
 */
export async function exportProducts(filters?: ProductFilters): Promise<Product[]> {
  const products = await getProducts(filters);

  const adminId = await getCurrentAdminId();
  if (adminId) {
    await logActivity(adminId, 'export', 'product', 'multiple', {
      count: products.length,
      filters,
    });
  }

  return products;
}

// =====================================================
// HELPERS
// =====================================================

/**
 * Transformar producto de BD a formato de la app
 */
function transformProductFromDB(dbProduct: any): Product {
  return {
    id: dbProduct.id,
    name: dbProduct.name,
    slug: dbProduct.slug,
    description: dbProduct.description || '',
    price: Number(dbProduct.price),
    salePrice: dbProduct.sale_price ? Number(dbProduct.sale_price) : undefined,
    category: dbProduct.category?.name || dbProduct.category_id,
    images: dbProduct.images || [],
    sizes: dbProduct.sizes || [],
    colors: dbProduct.colors || [],
    stock: dbProduct.stock,
    tags: dbProduct.tags || [],
    isNew: dbProduct.is_new,
    isFeatured: dbProduct.is_featured,
  };
}

/**
 * Registrar actividad en activity_logs
 */
async function logActivity(
  adminId: string,
  action: string,
  entityType: string,
  entityId: string,
  changes: any
): Promise<void> {
  const { error } = await supabase.from('activity_logs').insert({
    admin_id: adminId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    changes,
    metadata: {
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent,
    },
  });

  if (error) {
    console.error('Error logging activity:', error);
  }
}

/**
 * Generar slug a partir del nombre
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^a-z0-9]+/g, '-') // Reemplazar espacios y caracteres especiales
    .replace(/^-+|-+$/g, ''); // Remover guiones al inicio/final
}

/**
 * Generar SKU único
 */
export async function generateSKU(prefix = 'dr'): Promise<string> {
  // Obtener último producto
  const { data } = await supabase
    .from('products')
    .select('id')
    .order('created_at', { ascending: false })
    .limit(1);

  if (!data || data.length === 0) {
    return `${prefix}-001`;
  }

  // Extraer número del último SKU
  const lastSKU = data[0].id;
  const match = lastSKU.match(/(\d+)$/);
  if (!match) return `${prefix}-001`;

  const nextNum = parseInt(match[1]) + 1;
  return `${prefix}-${String(nextNum).padStart(3, '0')}`;
}

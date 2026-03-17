/**
 * =====================================================
 * DARK RANCH - SCRIPT DE MIGRACIÓN DE DATOS MOCK
 * =====================================================
 * Este script migra los productos mock existentes a Supabase
 */

import { supabase } from './supabase';
import { PRODUCTS } from '../data';

export async function migrateProductsToSupabase() {
  console.log('🚀 Iniciando migración de productos mock a Supabase...');

  try {
    // 1. Verificar conexión
    const { error: connectionError } = await supabase.from('products').select('id').limit(1);
    if (connectionError) {
      console.error('❌ Error de conexión a Supabase:', connectionError);
      return;
    }

    console.log('✅ Conexión a Supabase exitosa');

    // 2. Obtener admin_user_id (primer admin disponible)
    const { data: adminData } = await supabase
      .from('admin_users')
      .select('id')
      .limit(1)
      .single();

    const adminId = adminData?.id || null;

    // 3. Mapear categorías mock a IDs de BD
    const categoryMapping: Record<string, string> = {
      'Botas': 'cat_botas',
      'Sombreros': 'cat_sombreros',
      'Camisas': 'cat_camisas',
      'Jeans': 'cat_jeans',
      'Cinturones': 'cat_cinturones',
      'Accesorios': 'cat_accesorios',
    };

    // 4. Transformar productos mock al formato de BD
    const productsForDB = PRODUCTS.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      sale_price: product.salePrice || null,
      category_id: categoryMapping[product.category] || 'cat_accesorios',
      stock: product.stock,
      low_stock_threshold: 5,
      images: product.images,
      sizes: product.sizes,
      colors: product.colors,
      tags: product.tags,
      variants: [],
      is_new: product.isNew || false,
      is_featured: product.isFeatured || false,
      is_active: true,
      created_by: adminId,
      updated_by: adminId,
    }));

    console.log(`📦 Preparando ${productsForDB.length} productos para migración...`);

    // 5. Insertar productos (upsert para evitar duplicados)
    const { data, error } = await supabase
      .from('products')
      .upsert(productsForDB, { onConflict: 'id' });

    if (error) {
      console.error('❌ Error insertando productos:', error);
      return;
    }

    console.log(`✅ ${productsForDB.length} productos migrados exitosamente!`);

    // 6. Verificar productos insertados
    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 Total de productos en BD: ${count}`);

    return { success: true, count: productsForDB.length };
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    return { success: false, error };
  }
}

/**
 * Migrar configuración de la tienda
 */
export async function migrateStoreSettings() {
  console.log('🏪 Migrando configuración de la tienda...');

  const { data: adminData } = await supabase
    .from('admin_users')
    .select('id')
    .limit(1)
    .single();

  const adminId = adminData?.id || null;

  // Obtener settings de localStorage si existen
  const localSettings = localStorage.getItem('dark-ranch-settings');
  const settings = localSettings ? JSON.parse(localSettings) : null;

  const storeConfig = {
    id: 'main',
    hero: settings?.hero || {
      title: 'BUILT FOR WORK. STYLED FOR THE WILD.',
      subtitle: 'INDUSTRIAL & WESTERN',
      imageUrl: 'https://images.unsplash.com/photo-1541661538396-53ba2d051eed?q=80&w=2000&auto=format&fit=crop',
    },
    about_text: settings?.aboutText || 'Dark Ranch nació en el corazón del desierto de Sonora, donde la necesidad de ropa resistente se encontró con la elegancia del viejo oeste.',
    contact_email: settings?.contactEmail || 'contacto@darkranch.com',
    contact_info: {
      phone: '+52 123 456 7890',
      address: 'Av. Principal 123, Monterrey, NL',
      hours: 'Lun-Vie 9:00-18:00',
    },
    social_links: {
      instagram: 'https://instagram.com/darkranch',
      facebook: 'https://facebook.com/darkranch',
    },
    updated_by: adminId,
  };

  const { error } = await supabase
    .from('store_settings')
    .upsert(storeConfig, { onConflict: 'id' });

  if (error) {
    console.error('❌ Error migrando store settings:', error);
    return { success: false, error };
  }

  console.log('✅ Store settings migrados exitosamente!');
  return { success: true };
}

/**
 * Migrar banners
 */
export async function migrateBanners() {
  console.log('🎨 Migrando banners...');

  const localSettings = localStorage.getItem('dark-ranch-settings');
  const settings = localSettings ? JSON.parse(localSettings) : null;
  const banners = settings?.banners || [];

  if (banners.length === 0) {
    console.log('ℹ️ No hay banners para migrar');
    return { success: true, count: 0 };
  }

  const categoryMapping: Record<string, string> = {
    'Botas': 'cat_botas',
    'Sombreros': 'cat_sombreros',
    'Camisas': 'cat_camisas',
    'Jeans': 'cat_jeans',
    'Cinturones': 'cat_cinturones',
    'Accesorios': 'cat_accesorios',
  };

  const bannersForDB = banners.map((banner: any, index: number) => ({
    id: banner.id || `b${index + 1}`,
    title: banner.title,
    subtitle: banner.subtitle,
    button_text: banner.buttonText,
    image_url: banner.imageUrl,
    category_id: categoryMapping[banner.categoryLink] || null,
    display_order: index,
    is_active: true,
  }));

  const { error } = await supabase
    .from('banners')
    .upsert(bannersForDB, { onConflict: 'id' });

  if (error) {
    console.error('❌ Error migrando banners:', error);
    return { success: false, error };
  }

  console.log(`✅ ${bannersForDB.length} banners migrados exitosamente!`);
  return { success: true, count: bannersForDB.length };
}

/**
 * Ejecutar migración completa
 */
export async function runFullMigration() {
  console.log('🔥 INICIANDO MIGRACIÓN COMPLETA DE DARK RANCH 🔥');
  console.log('================================================\n');

  // 1. Migrar productos
  const productsResult = await migrateProductsToSupabase();

  // 2. Migrar store settings
  const settingsResult = await migrateStoreSettings();

  // 3. Migrar banners
  const bannersResult = await migrateBanners();

  console.log('\n================================================');
  console.log('📊 RESUMEN DE MIGRACIÓN:');
  console.log('================================================');
  console.log(`Productos: ${productsResult?.success ? '✅ ' + productsResult.count : '❌'}`);
  console.log(`Store Settings: ${settingsResult?.success ? '✅' : '❌'}`);
  console.log(`Banners: ${bannersResult?.success ? '✅ ' + bannersResult.count : '❌'}`);
  console.log('================================================\n');

  return {
    products: productsResult,
    settings: settingsResult,
    banners: bannersResult,
  };
}

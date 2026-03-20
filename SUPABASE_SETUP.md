# 🤠 Dark Ranch - Supabase Setup & CRUD

Este documento explica cómo configurar Supabase y usar el CRUD de productos.

## 📁 Archivos Generados

### 1. `/supabase-schema.sql`
SQL completo con las 13 tablas, índices, triggers, RLS policies y funciones.

**Características:**
- ✅ 13 tablas completas
- ✅ Relaciones con Foreign Keys
- ✅ Triggers para `updated_at` automático
- ✅ Trigger para alertas de stock bajo
- ✅ Función para generar números de orden secuenciales
- ✅ Función para calcular métricas diarias
- ✅ Row Level Security (RLS) configurado
- ✅ Datos iniciales (categorías y store_settings)

### 2. `/src/app/lib/supabase.ts`
Cliente de Supabase con tipos TypeScript.

**Funciones útiles:**
- `isUserAdmin()` - Verifica si el usuario es admin
- `getCurrentAdminId()` - Obtiene el ID del admin actual

### 3. `/src/app/lib/products.service.ts`
CRUD completo de productos con 30+ funciones.

**Operaciones principales:**
- `getProducts(filters?)` - Listar productos con filtros
- `getProductById(id)` - Obtener un producto
- `getProductBySlug(slug)` - Obtener por URL slug
- `createProduct(input)` - Crear producto
- `updateProduct(input)` - Actualizar producto
- `deleteProduct(id)` - Soft delete (marca como inactivo)
- `hardDeleteProduct(id)` - Eliminar permanentemente
- `updateProductStock(id, stock)` - Actualizar stock
- `getLowStockProducts()` - Productos con stock bajo
- `getFeaturedProducts(limit)` - Productos destacados
- `searchProducts(term)` - Búsqueda por texto
- `uploadProductImage(file, id)` - Subir imagen a Supabase Storage
- `bulkUpdateProducts(updates)` - Actualización masiva
- `importProducts(products)` - Importar desde JSON
- `exportProducts(filters)` - Exportar a JSON

**Helpers:**
- `generateSlug(name)` - Genera slug desde nombre
- `generateSKU(prefix)` - Genera SKU único

### 4. `/src/app/lib/orders.service.ts`
CRUD completo de órdenes.

**Funciones principales:**
- `createOrder(input)` - Crear orden (reduce stock automáticamente)
- `getOrderById(id)` - Obtener orden
- `getOrders(filters)` - Listar órdenes
- `updateOrderStatus(id, status, notes)` - Cambiar estado
- `assignOrder(id, adminId)` - Asignar a admin
- `addTrackingNumber(id, tracking)` - Agregar tracking
- `getTodayOrders()` - Órdenes del día
- `getOrderStats()` - Estadísticas
- `cancelOrder(id, reason)` - Cancelar (restaura stock)

### 5. `/src/app/lib/migration.ts`
Scripts para migrar datos mock a Supabase.

**Funciones:**
- `migrateProductsToSupabase()` - Migra los 20 productos mock
- `migrateStoreSettings()` - Migra configuración de localStorage
- `migrateBanners()` - Migra banners
- `runFullMigration()` - Ejecuta todo

---

## 🚀 Instrucciones de Setup

### Paso 1: Conectar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com)
2. En la consola de tu app local, conecta tu proyecto Supabase
3. Copia tus credenciales a un archivo `.env`:

```bash
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

### Paso 2: Ejecutar el Schema SQL

1. Ve a tu proyecto Supabase
2. Abre el **SQL Editor**
3. Copia todo el contenido de `/supabase-schema.sql`
4. Pégalo y ejecuta (**Run**)
5. Espera a que termine (puede tomar 30-60 segundos)

**Verificación:**
- Deberías ver 13 tablas en "Table Editor"
- Las categorías deberían estar pre-cargadas
- `store_settings` debería tener 1 fila

### Paso 3: Crear Bucket de Storage (para imágenes)

1. Ve a **Storage** en Supabase
2. Click en **New bucket**
3. Nombre: `product-images`
4. Public: ✅ (activado)
5. Click **Create bucket**

**Configurar política de acceso:**
```sql
-- Permitir lectura pública
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

-- Permitir upload solo a admins
CREATE POLICY "Admins can upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'product-images' AND
    EXISTS (
      SELECT 1 FROM admin_users au
      JOIN users u ON u.id = au.user_id
      WHERE u.id = auth.uid()
    )
  );
```

### Paso 4: Crear Usuario Admin

Ejecuta en SQL Editor:

```sql
-- 1. Crear usuario (ajusta el email y password)
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
VALUES (
  'admin@darkranch.com',
  crypt('tu-password-aqui', gen_salt('bf')),
  NOW()
);

-- 2. Crear registro en tabla users
INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@darkranch.com'),
  'admin@darkranch.com',
  crypt('tu-password-aqui', gen_salt('bf')),
  'Admin',
  'Dark Ranch',
  'admin',
  true
);

-- 3. Crear admin_user
INSERT INTO admin_users (user_id, permissions)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@darkranch.com'),
  ARRAY['manage_products', 'manage_orders', 'manage_storefront', 'view_analytics', 'manage_admins']
);
```

### Paso 5: Migrar Datos Mock

En la consola del navegador (cuando la app esté corriendo):

```javascript
import { runFullMigration } from './src/app/lib/migration';

// Ejecutar migración completa
await runFullMigration();
```

O crea un botón temporal en el admin:

```tsx
import { runFullMigration } from '../lib/migration';

<Button onClick={async () => {
  const result = await runFullMigration();
  console.log('Migración completa:', result);
}}>
  🚀 Migrar Datos Mock
</Button>
```

---

## 📖 Ejemplos de Uso

### Ejemplo 1: Listar productos filtrados

```typescript
import { getProducts } from './lib/products.service';

// Obtener todos los productos
const allProducts = await getProducts();

// Filtrar por categoría
const botas = await getProducts({ category_id: 'cat_botas' });

// Solo productos destacados
const featured = await getProducts({ is_featured: true });

// Rango de precio
const affordable = await getProducts({ 
  min_price: 50, 
  max_price: 150 
});

// Búsqueda por texto
const searchResults = await getProducts({ 
  search: 'vaquera' 
});
```

### Ejemplo 2: Crear producto

```typescript
import { createProduct, generateSlug, generateSKU } from './lib/products.service';

const newProduct = await createProduct({
  id: await generateSKU('dr'), // Genera "dr-011"
  name: 'Bota Ranch Premium',
  slug: generateSlug('Bota Ranch Premium'), // "bota-ranch-premium"
  description: 'La mejor bota del oeste',
  price: 199.99,
  sale_price: 149.99,
  category_id: 'cat_botas',
  stock: 25,
  images: ['url1.jpg', 'url2.jpg'],
  sizes: ['7', '8', '9', '10'],
  colors: ['Negro', 'Café'],
  tags: ['Premium', 'Western'],
  is_featured: true,
  is_new: true,
});
```

### Ejemplo 3: Subir imagen

```typescript
import { uploadProductImage } from './lib/products.service';

// Desde un input file
const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;
  
  const imageUrl = await uploadProductImage(file, 'dr-001');
  console.log('Imagen subida:', imageUrl);
  
  // Actualizar producto con nueva imagen
  await updateProduct({
    id: 'dr-001',
    images: [...existingImages, imageUrl]
  });
};
```

### Ejemplo 4: Crear orden desde checkout

```typescript
import { createOrder } from './lib/orders.service';
import { useCart } from '../cart-context';

const { cart, cartTotal, clearCart } = useCart();

const handleCheckout = async (formData: any) => {
  const order = await createOrder({
    user_id: currentUser?.id, // Opcional (guest checkout)
    items: cart.map(item => ({
      product_id: item.id,
      product_name: item.name,
      quantity: item.quantity,
      price_at_purchase: item.price,
      selected_size: item.selectedSize,
      selected_color: item.selectedColor,
    })),
    shipping_info: {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      address: formData.address,
      city: formData.city,
      zip: formData.zip,
    },
    payment_info: {
      method: 'card',
      lastFourDigits: formData.cardNumber.slice(-4),
      status: 'completed',
    },
    subtotal: cartTotal,
    shipping_cost: 0,
    tax: 0,
  });
  
  console.log('Orden creada:', order.id);
  clearCart();
};
```

### Ejemplo 5: Panel admin - actualizar stock

```typescript
import { updateProductStock, getLowStockProducts } from './lib/products.service';

// Actualizar stock individual
await updateProductStock('dr-001', 50);

// Obtener productos con stock bajo
const lowStock = await getLowStockProducts();
console.log(`${lowStock.length} productos con stock bajo`);
```

---

## 🔐 Row Level Security (RLS)

Las políticas RLS ya están configuradas:

### Productos
- ✅ Cualquiera puede VER productos activos
- 🔒 Solo admins pueden CREAR/EDITAR/ELIMINAR

### Órdenes
- ✅ Usuarios ven SUS órdenes
- ✅ Admins ven TODAS las órdenes

### Carrito
- ✅ Usuarios solo acceden a SU carrito

### Activity Logs
- 🔒 Solo admins pueden ver logs

---

## 🎯 Próximos Pasos

1. **Integrar con el UI existente:**
   - Reemplazar `PRODUCTS` mock por `getProducts()`
   - Conectar formularios de admin con `createProduct()` / `updateProduct()`
   - Integrar checkout con `createOrder()`

2. **Implementar autenticación real:**
   - Reemplazar login mock con Supabase Auth
   - Proteger rutas admin con `isUserAdmin()`

3. **Dashboard real:**
   - Usar `getOrderStats()` para métricas
   - Mostrar `getLowStockProducts()` en alertas

4. **Features adicionales:**
   - Sistema de reseñas
   - Carrito persistente en BD
   - Notificaciones por email

---

## 📚 Recursos

- [Documentación Supabase](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Guide](https://supabase.com/docs/guides/storage)

---

## 🆘 Troubleshooting

### "relation does not exist"
- Asegúrate de haber ejecutado TODO el schema SQL
- Verifica que las tablas existan en Table Editor

### "permission denied"
- Revisa las políticas RLS
- Verifica que el usuario actual sea admin

### "duplicate key value"
- Los IDs ya existen, usa diferentes IDs
- O usa `upsert` en lugar de `insert`

### Imágenes no cargan
- Verifica que el bucket `product-images` sea público
- Revisa las políticas de Storage

---

¿Listo para empezar? 🚀

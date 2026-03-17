-- =====================================================
-- DARK RANCH E-COMMERCE - DATABASE SCHEMA
-- =====================================================
-- Este archivo contiene todas las 13 tablas necesarias
-- para la tienda online Dark Ranch
-- =====================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. TABLA: users (Usuarios)
-- =====================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  last_login TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- =====================================================
-- 2. TABLA: admin_users (Administradores)
-- =====================================================
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permissions TEXT[] DEFAULT ARRAY['view_analytics'],
  preferences JSONB DEFAULT '{}',
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para admin_users
CREATE INDEX idx_admin_users_user_id ON admin_users(user_id);

-- =====================================================
-- 3. TABLA: activity_logs (Logs de Actividad)
-- =====================================================
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(50) NOT NULL,
  changes JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para activity_logs
CREATE INDEX idx_activity_logs_admin_id ON activity_logs(admin_id);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_timestamp ON activity_logs(timestamp DESC);

-- =====================================================
-- 4. TABLA: categories (Categorías)
-- =====================================================
CREATE TABLE categories (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para categories
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_display_order ON categories(display_order);

-- Insertar categorías iniciales
INSERT INTO categories (id, name, slug, description, display_order) VALUES
('cat_botas', 'Botas', 'botas', 'Botas estilo western y trabajo', 1),
('cat_sombreros', 'Sombreros', 'sombreros', 'Sombreros vaqueros y felt premium', 2),
('cat_camisas', 'Camisas', 'camisas', 'Camisas western y denim', 3),
('cat_jeans', 'Jeans', 'jeans', 'Jeans de mezclilla resistente', 4),
('cat_cinturones', 'Cinturones', 'cinturones', 'Cinturones de cuero con hebillas', 5),
('cat_accesorios', 'Accesorios', 'accesorios', 'Accesorios western diversos', 6);

-- =====================================================
-- 5. TABLA: products (Productos)
-- =====================================================
CREATE TABLE products (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  sale_price DECIMAL(10,2) CHECK (sale_price >= 0),
  category_id VARCHAR(20) NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  stock INTEGER DEFAULT 0 CHECK (stock >= 0),
  low_stock_threshold INTEGER DEFAULT 5,
  images TEXT[] DEFAULT '{}',
  sizes TEXT[] DEFAULT '{}',
  colors TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  variants JSONB DEFAULT '[]',
  is_new BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(id),
  updated_by UUID REFERENCES admin_users(id)
);

-- Índices para products
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_is_featured ON products(is_featured) WHERE is_featured = true;
CREATE INDEX idx_products_is_new ON products(is_new) WHERE is_new = true;
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_stock ON products(stock);

-- =====================================================
-- 6. TABLA: low_stock_alerts (Alertas Stock Bajo)
-- =====================================================
CREATE TABLE low_stock_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id VARCHAR(20) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  current_stock INTEGER NOT NULL,
  threshold INTEGER NOT NULL,
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES admin_users(id)
);

-- Índices para low_stock_alerts
CREATE INDEX idx_low_stock_alerts_product ON low_stock_alerts(product_id);
CREATE INDEX idx_low_stock_alerts_resolved ON low_stock_alerts(is_resolved) WHERE is_resolved = false;

-- =====================================================
-- 7. TABLA: orders (Órdenes/Pedidos)
-- =====================================================
CREATE TABLE orders (
  id VARCHAR(30) PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
  shipping_cost DECIMAL(10,2) DEFAULT 0 CHECK (shipping_cost >= 0),
  tax DECIMAL(10,2) DEFAULT 0 CHECK (tax >= 0),
  total DECIMAL(10,2) NOT NULL CHECK (total >= 0),
  shipping_info JSONB NOT NULL,
  payment_info JSONB NOT NULL,
  tracking_number VARCHAR(100),
  admin_notes TEXT,
  assigned_to UUID REFERENCES admin_users(id),
  priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Índices para orders
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_assigned_to ON orders(assigned_to);

-- =====================================================
-- 8. TABLA: order_items (Detalle de Órdenes)
-- =====================================================
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id VARCHAR(30) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id VARCHAR(20) NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name VARCHAR(200) NOT NULL,
  product_sku VARCHAR(20) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price_at_purchase DECIMAL(10,2) NOT NULL CHECK (price_at_purchase >= 0),
  subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
  selected_size VARCHAR(10),
  selected_color VARCHAR(50),
  product_snapshot JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para order_items
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- =====================================================
-- 9. TABLA: cart_items (Carrito de Compras)
-- =====================================================
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id VARCHAR(20) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  selected_size VARCHAR(10),
  selected_color VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_cart_item UNIQUE(user_id, product_id, selected_size, selected_color)
);

-- Índices para cart_items
CREATE INDEX idx_cart_items_user ON cart_items(user_id);
CREATE INDEX idx_cart_items_product ON cart_items(product_id);

-- =====================================================
-- 10. TABLA: banners (Banners Promocionales)
-- =====================================================
CREATE TABLE banners (
  id VARCHAR(20) PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  subtitle VARCHAR(200),
  button_text VARCHAR(50),
  image_url TEXT NOT NULL,
  category_id VARCHAR(20) REFERENCES categories(id) ON DELETE SET NULL,
  link_url VARCHAR(255),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para banners
CREATE INDEX idx_banners_display_order ON banners(display_order);
CREATE INDEX idx_banners_active ON banners(is_active) WHERE is_active = true;
CREATE INDEX idx_banners_dates ON banners(start_date, end_date);

-- =====================================================
-- 11. TABLA: store_settings (Configuración de la Tienda)
-- =====================================================
CREATE TABLE store_settings (
  id VARCHAR(20) PRIMARY KEY DEFAULT 'main',
  hero JSONB DEFAULT '{}',
  about_text TEXT,
  contact_email VARCHAR(255),
  contact_info JSONB DEFAULT '{}',
  social_links JSONB DEFAULT '{}',
  seo JSONB DEFAULT '{}',
  shipping_settings JSONB DEFAULT '{}',
  payment_settings JSONB DEFAULT '{}',
  email_templates JSONB DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES admin_users(id)
);

-- Insertar configuración inicial
INSERT INTO store_settings (id, hero, about_text, contact_email) VALUES (
  'main',
  '{"title": "BUILT FOR WORK. STYLED FOR THE WILD.", "subtitle": "INDUSTRIAL & WESTERN", "imageUrl": "https://images.unsplash.com/photo-1541661538396-53ba2d051eed?q=80&w=2000&auto=format&fit=crop"}',
  'Dark Ranch nació en el corazón del desierto de Sonora, donde la necesidad de ropa resistente se encontró con la elegancia del viejo oeste. No solo hacemos ropa; forjamos armaduras modernas para el trabajador y el aventurero.',
  'contacto@darkranch.com'
);

-- =====================================================
-- 12. TABLA: product_reviews (Reseñas de Productos)
-- =====================================================
CREATE TABLE product_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id VARCHAR(20) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(200),
  comment TEXT,
  verified_purchase BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para product_reviews
CREATE INDEX idx_product_reviews_product ON product_reviews(product_id);
CREATE INDEX idx_product_reviews_user ON product_reviews(user_id);
CREATE INDEX idx_product_reviews_approved ON product_reviews(is_approved) WHERE is_approved = true;

-- =====================================================
-- 13. TABLA: dashboard_metrics (Métricas del Dashboard)
-- =====================================================
CREATE TABLE dashboard_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE UNIQUE NOT NULL,
  total_sales DECIMAL(10,2) DEFAULT 0,
  orders_count INTEGER DEFAULT 0,
  new_customers_count INTEGER DEFAULT 0,
  average_order_value DECIMAL(10,2) DEFAULT 0,
  sales_by_category JSONB DEFAULT '{}',
  top_products JSONB DEFAULT '[]',
  orders_by_status JSONB DEFAULT '{}',
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para dashboard_metrics
CREATE INDEX idx_dashboard_metrics_date ON dashboard_metrics(date DESC);

-- =====================================================
-- TRIGGERS PARA UPDATED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a todas las tablas con updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_banners_updated_at BEFORE UPDATE ON banners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_store_settings_updated_at BEFORE UPDATE ON store_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_reviews_updated_at BEFORE UPDATE ON product_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TRIGGER PARA ALERTAS DE STOCK BAJO
-- =====================================================
CREATE OR REPLACE FUNCTION check_low_stock()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el stock está por debajo del threshold y no hay alerta activa, crear una
  IF NEW.stock <= NEW.low_stock_threshold THEN
    INSERT INTO low_stock_alerts (product_id, current_stock, threshold)
    VALUES (NEW.id, NEW.stock, NEW.low_stock_threshold)
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Si el stock se repone, marcar alertas como resueltas
  IF NEW.stock > NEW.low_stock_threshold THEN
    UPDATE low_stock_alerts
    SET is_resolved = true, resolved_at = NOW()
    WHERE product_id = NEW.id AND is_resolved = false;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_low_stock AFTER INSERT OR UPDATE OF stock ON products
  FOR EACH ROW EXECUTE FUNCTION check_low_stock();

-- =====================================================
-- FUNCIÓN PARA GENERAR NÚMEROS DE ORDEN SECUENCIALES
-- =====================================================
CREATE SEQUENCE order_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS VARCHAR(30) AS $$
DECLARE
  next_num INTEGER;
  order_id VARCHAR(30);
BEGIN
  next_num := nextval('order_number_seq');
  order_id := 'DR-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(next_num::TEXT, 5, '0');
  RETURN order_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIÓN PARA CALCULAR MÉTRICAS DIARIAS
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_daily_metrics(target_date DATE DEFAULT CURRENT_DATE)
RETURNS void AS $$
DECLARE
  metrics_data RECORD;
BEGIN
  -- Calcular métricas del día
  SELECT
    COALESCE(SUM(total), 0) as total_sales,
    COALESCE(COUNT(*), 0) as orders_count,
    COALESCE(AVG(total), 0) as avg_order_value
  INTO metrics_data
  FROM orders
  WHERE DATE(created_at) = target_date;
  
  -- Insertar o actualizar métricas
  INSERT INTO dashboard_metrics (
    date,
    total_sales,
    orders_count,
    average_order_value,
    calculated_at
  )
  VALUES (
    target_date,
    metrics_data.total_sales,
    metrics_data.orders_count,
    metrics_data.avg_order_value,
    NOW()
  )
  ON CONFLICT (date) DO UPDATE SET
    total_sales = EXCLUDED.total_sales,
    orders_count = EXCLUDED.orders_count,
    average_order_value = EXCLUDED.average_order_value,
    calculated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

-- Políticas para users (solo pueden ver/editar su propia info)
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Políticas para products (públicos para lectura, admins para escritura)
CREATE POLICY "Anyone can view active products" ON products
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage products" ON products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      JOIN users u ON u.id = au.user_id
      WHERE u.id = auth.uid()
    )
  );

-- Políticas para cart_items (solo el dueño)
CREATE POLICY "Users can view own cart" ON cart_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own cart" ON cart_items
  FOR ALL USING (auth.uid() = user_id);

-- Políticas para orders (usuarios ven sus órdenes, admins ven todas)
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      JOIN users u ON u.id = au.user_id
      WHERE u.id = auth.uid()
    )
  );

-- Políticas para activity_logs (solo admins)
CREATE POLICY "Admins can view activity logs" ON activity_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      JOIN users u ON u.id = au.user_id
      WHERE u.id = auth.uid()
    )
  );

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================
COMMENT ON TABLE users IS 'Usuarios registrados (clientes y admins)';
COMMENT ON TABLE admin_users IS 'Extensión de users con permisos de administrador';
COMMENT ON TABLE activity_logs IS 'Registro de todas las acciones admin para auditoría';
COMMENT ON TABLE categories IS 'Categorías de productos (Botas, Sombreros, etc)';
COMMENT ON TABLE products IS 'Catálogo completo de productos';
COMMENT ON TABLE low_stock_alerts IS 'Alertas automáticas cuando stock < threshold';
COMMENT ON TABLE orders IS 'Órdenes de compra de clientes';
COMMENT ON TABLE order_items IS 'Detalle de productos en cada orden';
COMMENT ON TABLE cart_items IS 'Carrito de compras persistente en BD';
COMMENT ON TABLE banners IS 'Banners promocionales editables desde admin';
COMMENT ON TABLE store_settings IS 'Configuración global de la tienda';
COMMENT ON TABLE product_reviews IS 'Reseñas y valoraciones de productos';
COMMENT ON TABLE dashboard_metrics IS 'Métricas calculadas para el dashboard admin';

-- =====================================================
-- FIN DEL SCHEMA
-- =====================================================

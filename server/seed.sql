CREATE DATABASE IF NOT EXISTS dark_ranch CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dark_ranch;

CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(150) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  sale_price DECIMAL(10,2) NULL,
  category_id VARCHAR(50) NOT NULL,
  images_json JSON NOT NULL,
  sizes_json JSON NOT NULL,
  size_stock_json JSON NULL,
  colors_json JSON NOT NULL,
  tags_json JSON NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  is_new TINYINT(1) NOT NULL DEFAULT 0,
  is_featured TINYINT(1) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS store_settings (
  id TINYINT PRIMARY KEY,
  hero_title VARCHAR(200) NOT NULL,
  hero_subtitle VARCHAR(200) NOT NULL,
  hero_image_url TEXT NOT NULL,
  about_text TEXT NOT NULL,
  contact_email VARCHAR(150) NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS banners (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  subtitle TEXT NOT NULL,
  button_text VARCHAR(100) NOT NULL,
  image_url TEXT NOT NULL,
  category_id VARCHAR(50) NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  CONSTRAINT fk_banners_category FOREIGN KEY (category_id) REFERENCES categories(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS admin_users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(150) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS orders (
  id INT PRIMARY KEY,
  order_number VARCHAR(50) NOT NULL UNIQUE,
  customer_name VARCHAR(150) NOT NULL,
  customer_email VARCHAR(150) NOT NULL,
  address VARCHAR(255) NOT NULL,
  city VARCHAR(120) NOT NULL,
  zip VARCHAR(20) NOT NULL,
  status VARCHAR(50) NOT NULL,
  payment_status VARCHAR(50) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  cancellation_reason TEXT NULL,
  refund_amount DECIMAL(10,2) NULL,
  created_at VARCHAR(40) NOT NULL,
  cancelled_at VARCHAR(40) NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS order_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  product_id VARCHAR(50) NOT NULL,
  product_name VARCHAR(150) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  quantity INT NOT NULL,
  selected_size VARCHAR(50) NULL,
  selected_color VARCHAR(50) NULL,
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS admin_activity_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  actor_id INT NULL,
  actor_name VARCHAR(150) NOT NULL,
  actor_email VARCHAR(150) NOT NULL,
  actor_role VARCHAR(50) NOT NULL,
  action VARCHAR(60) NOT NULL,
  entity_type VARCHAR(60) NOT NULL,
  entity_id VARCHAR(80) NOT NULL,
  entity_name VARCHAR(180) NOT NULL,
  details TEXT NOT NULL,
  created_at VARCHAR(40) NOT NULL,
  INDEX idx_admin_activity_created_at (created_at),
  INDEX idx_admin_activity_actor (actor_email)
) ENGINE=InnoDB;

INSERT INTO categories (id, name, slug, image_url) VALUES
  ('cat_botas', 'Botas', 'botas', '/assets/Botas.png'),
  ('cat_sombreros', 'Sombreros', 'sombreros', '/assets/Sombreros.png'),
  ('cat_camisas', 'Camisas', 'camisas', '/assets/Camisas.png'),
  ('cat_jeans', 'Jeans', 'jeans', '/assets/Jeans.png'),
  ('cat_cinturones', 'Cinturones', 'cinturones', '/assets/Cinturones.png'),
  ('cat_accesorios', 'Accesorios', 'accesorios', '/assets/acessorios.png')
ON DUPLICATE KEY UPDATE name = VALUES(name), slug = VALUES(slug), image_url = VALUES(image_url);

INSERT INTO products (id, name, slug, description, price, sale_price, category_id, images_json, sizes_json, colors_json, tags_json, stock, is_new, is_featured, is_active) VALUES
  ('dr-001', 'Bota Vaquera Cuero Negro', 'bota-vaquera-cuero-negro', 'Construida para durar. Cuero de grano entero con acabado industrial. Suela resistente al aceite y costuras reforzadas.', 189.99, NULL, 'cat_botas', JSON_ARRAY('/assets/Botas.png'), JSON_ARRAY('7','8','9','10','11','12'), JSON_ARRAY('Negro'), JSON_ARRAY('Industrial','Western','Cuero'), 15, 1, 1, 1),
  ('dr-008', 'Cinto Pitón Industrial', 'cinto-piton-industrial', 'Cuero con grabado exótico. Herrajes de latón envejecido.', 89.00, NULL, 'cat_cinturones', JSON_ARRAY('/assets/Cinturones.png'), JSON_ARRAY('32','34','36','38'), JSON_ARRAY('Negro'), JSON_ARRAY('Accesorios'), 15, 0, 1, 1),
  ('dr-009', 'Sombrero Dust Rider', 'sombrero-dust-rider', 'Fieltro rígido, corona alta. El favorito de los outlaws.', 145.00, NULL, 'cat_sombreros', JSON_ARRAY('/assets/Sombreros.png'), JSON_ARRAY('M','L'), JSON_ARRAY('Arena'), JSON_ARRAY('Western'), 8, 0, 1, 1),
  ('dr-010', 'Camisa Denim Hard-Work', 'camisa-denim-hard-work', 'Denim de 12oz. Triple costura para durabilidad extrema.', 85.00, NULL, 'cat_camisas', JSON_ARRAY('/assets/Camisas.png'), JSON_ARRAY('M','L','XL','XXL'), JSON_ARRAY('Indigo'), JSON_ARRAY('Industrial'), 20, 0, 1, 1),
  ('dr-002', 'Sombrero Felt Premium', 'sombrero-felt-premium', 'Fieltro de alta calidad. Resistente al agua y al polvo del desierto.', 125.00, NULL, 'cat_sombreros', JSON_ARRAY('/assets/Sombreros.png'), JSON_ARRAY('S','M','L','XL'), JSON_ARRAY('Marrón','Negro'), JSON_ARRAY('Western','Premium'), 22, 0, 1, 1),
  ('dr-003', 'Cinturón Hebilla Acero', 'cinturon-hebilla-acero', 'Hebilla forjada a mano. Cuero curtido vegetal de 4mm.', 55.00, NULL, 'cat_cinturones', JSON_ARRAY('/assets/Cinturones.png'), JSON_ARRAY('30','32','34','36'), JSON_ARRAY('Café'), JSON_ARRAY('Accesorios','Industrial'), 45, 1, 0, 1),
  ('dr-004', 'Jeans Industrial Raw', 'jeans-industrial-raw', 'Denim japonés de 14oz. Corte recto, remaches de cobre y triple costura.', 95.00, NULL, 'cat_jeans', JSON_ARRAY('/assets/Jeans.png'), JSON_ARRAY('30','32','34','36'), JSON_ARRAY('Indigo'), JSON_ARRAY('Industrial','Denim'), 30, 0, 1, 1),
  ('dr-005', 'Camisa Chambray Western', 'camisa-chambray-western', 'Tela chambray ligera pero resistente. Botones de perla y canesú estilo western clásico.', 75.00, NULL, 'cat_camisas', JSON_ARRAY('/assets/Camisas.png'), JSON_ARRAY('S','M','L','XL'), JSON_ARRAY('Azul','Gris'), JSON_ARRAY('Western','Camisas'), 25, 0, 0, 1),
  ('dr-006', 'Bota Ranchera Tabaco', 'bota-ranchera-tabaco', 'Cuero color tabaco con pátina natural. Comodidad excepcional desde el primer día.', 165.00, NULL, 'cat_botas', JSON_ARRAY('/assets/Botas.png'), JSON_ARRAY('8','9','10','11'), JSON_ARRAY('Tabaco'), JSON_ARRAY('Western','Confort'), 10, 0, 0, 1),
  ('dr-007', 'Chaqueta Denim Forrada', 'chaqueta-denim-forrada', 'Forro de lana sintética para los inviernos en el rancho. Exterior de mezclilla pesada.', 145.00, 129.00, 'cat_accesorios', JSON_ARRAY('/assets/acessorios.png'), JSON_ARRAY('M','L','XL'), JSON_ARRAY('Indigo'), JSON_ARRAY('Invierno','Premium'), 12, 0, 0, 1)
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), price = VALUES(price), sale_price = VALUES(sale_price), category_id = VALUES(category_id), images_json = VALUES(images_json), sizes_json = VALUES(sizes_json), colors_json = VALUES(colors_json), tags_json = VALUES(tags_json), stock = VALUES(stock), is_new = VALUES(is_new), is_featured = VALUES(is_featured), is_active = VALUES(is_active);

INSERT INTO store_settings (id, hero_title, hero_subtitle, hero_image_url, about_text, contact_email) VALUES
  (1, 'BUILT FOR WORK. STYLED FOR THE WILD.', 'INDUSTRIAL & WESTERN', 'https://images.unsplash.com/photo-1541661538396-53ba2d051eed?q=80&w=2000&auto=format&fit=crop', 'Dark Ranch nació en el corazón del desierto de Sonora, donde la necesidad de ropa resistente se encontró con la elegancia del viejo oeste. No solo hacemos ropa; forjamos armaduras modernas para el trabajador y el aventurero.', 'contacto@darkranch.com')
ON DUPLICATE KEY UPDATE hero_title = VALUES(hero_title), hero_subtitle = VALUES(hero_subtitle), hero_image_url = VALUES(hero_image_url), about_text = VALUES(about_text), contact_email = VALUES(contact_email);

INSERT INTO banners (id, title, subtitle, button_text, image_url, category_id, display_order, is_active) VALUES
  ('b1', 'Colección de Invierno 2026', 'Prepárate para las noches frías del desierto con nuestra nueva línea forjada en denim pesado.', 'Descubrir Ahora', 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?q=80&w=2000&auto=format&fit=crop', 'cat_jeans', 0, 1)
ON DUPLICATE KEY UPDATE title = VALUES(title), subtitle = VALUES(subtitle), button_text = VALUES(button_text), image_url = VALUES(image_url), category_id = VALUES(category_id), display_order = VALUES(display_order), is_active = VALUES(is_active);

INSERT INTO admin_users (id, email, password, name, role) VALUES
  (1, 'admin@darkranch.com', 'admin123', 'Admin Dark Ranch', 'admin')
ON DUPLICATE KEY UPDATE email = VALUES(email), password = VALUES(password), name = VALUES(name), role = VALUES(role);

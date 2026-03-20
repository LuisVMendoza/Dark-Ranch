INSERT INTO categories (id, name, slug, image_url) VALUES
  ('cat_botas', 'Botas', 'botas', 'https://images.unsplash.com/photo-1638247025967-b4e38f687b76?q=80&w=1200&auto=format&fit=crop'),
  ('cat_sombreros', 'Sombreros', 'sombreros', 'https://images.unsplash.com/photo-1533733508367-285b9967b85e?q=80&w=1200&auto=format&fit=crop'),
  ('cat_camisas', 'Camisas', 'camisas', 'https://images.unsplash.com/photo-1620932900827-4a5120470d61?q=80&w=1200&auto=format&fit=crop'),
  ('cat_jeans', 'Jeans', 'jeans', 'https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=1200&auto=format&fit=crop'),
  ('cat_cinturones', 'Cinturones', 'cinturones', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=1200&auto=format&fit=crop'),
  ('cat_accesorios', 'Accesorios', 'accesorios', 'https://images.unsplash.com/photo-1551537482-f2075a1d41f2?q=80&w=1200&auto=format&fit=crop');

INSERT INTO products (id, name, slug, description, price, sale_price, category_id, images_json, sizes_json, colors_json, tags_json, stock, is_new, is_featured) VALUES
  ('dr-001', 'Bota Vaquera Cuero Negro', 'bota-vaquera-cuero-negro', 'Construida para durar. Cuero de grano entero con acabado industrial. Suela resistente al aceite y costuras reforzadas.', 189.99, NULL, 'cat_botas', '["https://images.unsplash.com/photo-1638247025967-b4e38f687b76?q=80&w=800&auto=format&fit=crop"]', '["7","8","9","10","11","12"]', '["Negro"]', '["Industrial","Western","Cuero"]', 15, 1, 1),
  ('dr-008', 'Cinto Pitón Industrial', 'cinto-piton-industrial', 'Cuero con grabado exótico. Herrajes de latón envejecido.', 89.00, NULL, 'cat_cinturones', '["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=800&auto=format&fit=crop"]', '["32","34","36","38"]', '["Negro"]', '["Accesorios"]', 15, 0, 1),
  ('dr-009', 'Sombrero Dust Rider', 'sombrero-dust-rider', 'Fieltro rígido, corona alta. El favorito de los outlaws.', 145.00, NULL, 'cat_sombreros', '["https://images.unsplash.com/photo-1533733508367-285b9967b85e?q=80&w=800&auto=format&fit=crop"]', '["M","L"]', '["Arena"]', '["Western"]', 8, 0, 1),
  ('dr-010', 'Camisa Denim Hard-Work', 'camisa-denim-hard-work', 'Denim de 12oz. Triple costura para durabilidad extrema.', 85.00, NULL, 'cat_camisas', '["https://images.unsplash.com/photo-1620932900827-4a5120470d61?q=80&w=800&auto=format&fit=crop"]', '["M","L","XL","XXL"]', '["Indigo"]', '["Industrial"]', 20, 0, 1),
  ('dr-002', 'Sombrero Felt Premium', 'sombrero-felt-premium', 'Fieltro de alta calidad. Resistente al agua y al polvo del desierto.', 125.00, NULL, 'cat_sombreros', '["https://images.unsplash.com/photo-1572307480813-ceb0e59d8325?q=80&w=800&auto=format&fit=crop"]', '["S","M","L","XL"]', '["Marrón","Negro"]', '["Western","Premium"]', 22, 0, 1),
  ('dr-003', 'Cinturón Hebilla Acero', 'cinturon-hebilla-acero', 'Hebilla forjada a mano. Cuero curtido vegetal de 4mm.', 55.00, NULL, 'cat_cinturones', '["https://images.unsplash.com/photo-1614165939092-4914f6a9e16d?q=80&w=800&auto=format&fit=crop"]', '["30","32","34","36"]', '["Café"]', '["Accesorios","Industrial"]', 45, 1, 0),
  ('dr-004', 'Jeans Industrial Raw', 'jeans-industrial-raw', 'Denim japonés de 14oz. Corte recto, remaches de cobre y triple costura.', 95.00, NULL, 'cat_jeans', '["https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=800&auto=format&fit=crop"]', '["30","32","34","36"]', '["Indigo"]', '["Industrial","Denim"]', 30, 0, 1),
  ('dr-005', 'Camisa Chambray Western', 'camisa-chambray-western', 'Tela chambray ligera pero resistente. Botones de perla y canesú estilo western clásico.', 75.00, NULL, 'cat_camisas', '["https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=800&auto=format&fit=crop"]', '["S","M","L","XL"]', '["Azul","Gris"]', '["Western","Camisas"]', 25, 0, 0),
  ('dr-006', 'Bota Ranchera Tabaco', 'bota-ranchera-tabaco', 'Cuero color tabaco con pátina natural. Comodidad excepcional desde el primer día.', 165.00, NULL, 'cat_botas', '["https://images.unsplash.com/photo-1605733513597-a8f8341084e6?q=80&w=800&auto=format&fit=crop"]', '["8","9","10","11"]', '["Tabaco"]', '["Western","Confort"]', 10, 0, 0),
  ('dr-007', 'Chaqueta Denim Forrada', 'chaqueta-denim-forrada', 'Forro de lana sintética para los inviernos en el rancho. Exterior de mezclilla pesada.', 145.00, 129.00, 'cat_accesorios', '["https://images.unsplash.com/photo-1551537482-f2075a1d41f2?q=80&w=800&auto=format&fit=crop"]', '["M","L","XL"]', '["Indigo"]', '["Invierno","Premium"]', 12, 0, 0);

INSERT INTO store_settings (id, hero_title, hero_subtitle, hero_image_url, about_text, contact_email) VALUES
  (1, 'BUILT FOR WORK. STYLED FOR THE WILD.', 'INDUSTRIAL & WESTERN', 'https://images.unsplash.com/photo-1541661538396-53ba2d051eed?q=80&w=2000&auto=format&fit=crop', 'Dark Ranch nació en el corazón del desierto de Sonora, donde la necesidad de ropa resistente se encontró con la elegancia del viejo oeste. No solo hacemos ropa; forjamos armaduras modernas para el trabajador y el aventurero.', 'contacto@darkranch.com');

INSERT INTO banners (id, title, subtitle, button_text, image_url, category_id, display_order, is_active) VALUES
  ('b1', 'Colección de Invierno 2026', 'Prepárate para las noches frías del desierto con nuestra nueva línea forjada en denim pesado.', 'Descubrir Ahora', 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?q=80&w=2000&auto=format&fit=crop', 'cat_jeans', 0, 1);

INSERT INTO admin_users (email, password, name, role) VALUES
  ('admin@darkranch.com', 'admin123', 'Admin Dark Ranch', 'admin');

INSERT INTO orders (order_number, customer_name, customer_email, address, city, zip, status, payment_status, total, created_at, cancellation_reason, refund_amount, cancelled_at) VALUES
  ('DR-2026-00021', 'María López', 'maria@example.com', 'Calle 1 #45', 'Monterrey', '64000', 'delivered', 'paid', 189.99, '2026-01-14T10:35:00Z', NULL, NULL, NULL),
  ('DR-2026-00022', 'Javier Ruiz', 'javier@example.com', 'Av. Sierra 180', 'Saltillo', '25000', 'shipped', 'paid', 230.00, '2026-01-15T13:10:00Z', NULL, NULL, NULL),
  ('DR-2026-00023', 'Ana Torres', 'ana@example.com', 'Bosques 904', 'Chihuahua', '31000', 'cancelled', 'refunded', 145.00, '2026-01-15T18:45:00Z', 'Cambio de talla', 145.00, '2026-01-15T20:10:00Z'),
  ('DR-2026-00024', 'Ricardo Pérez', 'ricardo@example.com', 'Centro 12', 'Hermosillo', '83000', 'paid', 'paid', 95.00, '2026-01-16T09:05:00Z', NULL, NULL, NULL),
  ('DR-2026-00019', 'Luis Mena', 'luis@example.com', 'Norte 88', 'Torreón', '27000', 'cancelled', 'refunded', 89.00, '2026-01-13T09:10:00Z', 'Pago duplicado', 89.00, '2026-01-13T11:30:00Z');

INSERT INTO order_items (order_id, product_id, product_name, price, quantity, selected_size, selected_color) VALUES
  (1, 'dr-001', 'Bota Vaquera Cuero Negro', 189.99, 1, '10', 'Negro'),
  (2, 'dr-008', 'Cinto Pitón Industrial', 89.00, 1, '34', 'Negro'),
  (2, 'dr-009', 'Sombrero Dust Rider', 141.00, 1, 'M', 'Arena'),
  (3, 'dr-009', 'Sombrero Dust Rider', 145.00, 1, 'L', 'Arena'),
  (4, 'dr-004', 'Jeans Industrial Raw', 95.00, 1, '32', 'Indigo'),
  (5, 'dr-008', 'Cinto Pitón Industrial', 89.00, 1, '36', 'Negro');

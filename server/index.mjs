import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = resolve(__dirname, '../local-data/dark-ranch.sqlite');
const schemaPath = resolve(__dirname, 'schema.sql');
const seedPath = resolve(__dirname, 'seed.sql');
const port = Number(process.env.API_PORT || 3001);

mkdirSync(dirname(dbPath), { recursive: true });

function runRawSql(sql) {
  return execFileSync('sqlite3', [dbPath, sql], { encoding: 'utf8' }).trim();
}

function queryJson(sql) {
  const output = execFileSync('sqlite3', ['-json', dbPath, sql], { encoding: 'utf8' }).trim();
  return output ? JSON.parse(output) : [];
}

function scalar(sql, fallback = null) {
  const rows = queryJson(sql);
  if (!rows.length) return fallback;
  return rows[0][Object.keys(rows[0])[0]] ?? fallback;
}

function escapeValue(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'NULL';
  if (typeof value === 'boolean') return value ? '1' : '0';
  return `'${String(value).replace(/'/g, "''")}'`;
}

function parseJsonField(value, fallback = []) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function initializeDatabase() {
  runRawSql(readFileSync(schemaPath, 'utf8'));
  const categoryCount = Number(scalar('SELECT COUNT(*) AS count FROM categories;', 0));
  if (categoryCount === 0) {
    runRawSql(readFileSync(seedPath, 'utf8'));
  }
}

function mapProduct(row) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    price: row.price,
    salePrice: row.sale_price ?? undefined,
    category: row.category_name,
    images: parseJsonField(row.images_json),
    sizes: parseJsonField(row.sizes_json),
    colors: parseJsonField(row.colors_json),
    stock: row.stock,
    tags: parseJsonField(row.tags_json),
    isNew: Boolean(row.is_new),
    isFeatured: Boolean(row.is_featured),
  };
}

function getCategories() {
  return queryJson(`
    SELECT id, name, slug, image_url
    FROM categories
    ORDER BY name ASC;
  `).map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    imageUrl: row.image_url,
  }));
}

function getProducts() {
  return queryJson(`
    SELECT p.*, c.name AS category_name
    FROM products p
    INNER JOIN categories c ON c.id = p.category_id
    WHERE p.is_active = 1
    ORDER BY p.is_featured DESC, p.created_at DESC;
  `).map(mapProduct);
}

function getStoreSettings() {
  const setting = queryJson(`SELECT * FROM store_settings WHERE id = 1;`)[0];
  const banners = queryJson(`
    SELECT b.id, b.title, b.subtitle, b.button_text, b.image_url, c.name AS category_name
    FROM banners b
    LEFT JOIN categories c ON c.id = b.category_id
    WHERE b.is_active = 1
    ORDER BY b.display_order ASC;
  `).map((row) => ({
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    buttonText: row.button_text,
    imageUrl: row.image_url,
    categoryLink: row.category_name ?? '',
  }));

  return {
    hero: {
      title: setting.hero_title,
      subtitle: setting.hero_subtitle,
      imageUrl: setting.hero_image_url,
    },
    banners,
    aboutText: setting.about_text,
    contactEmail: setting.contact_email,
  };
}

function getOrders() {
  return queryJson(`
    SELECT *
    FROM orders
    ORDER BY datetime(created_at) DESC;
  `);
}

function formatCurrency(value) {
  return Number(value ?? 0).toFixed(2);
}

function buildReports(orders) {
  const now = new Date();
  const periods = [
    { id: 'pr-day', periodType: 'day', periodLabel: 'Día (Hoy)', start: new Date(now.getFullYear(), now.getMonth(), now.getDate()) },
    { id: 'pr-week', periodType: 'week', periodLabel: 'Semana actual', start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()) },
    { id: 'pr-month', periodType: 'month', periodLabel: 'Mes actual', start: new Date(now.getFullYear(), now.getMonth(), 1) },
    { id: 'pr-bimester', periodType: 'bimester', periodLabel: 'Bimestre actual', start: new Date(now.getFullYear(), now.getMonth() - (now.getMonth() % 2), 1) },
    { id: 'pr-quarter', periodType: 'quarter', periodLabel: 'Trimestre actual', start: new Date(now.getFullYear(), now.getMonth() - (now.getMonth() % 3), 1) },
    { id: 'pr-semester', periodType: 'semester', periodLabel: 'Semestre actual', start: new Date(now.getFullYear(), now.getMonth() < 6 ? 0 : 6, 1) },
    { id: 'pr-year', periodType: 'year', periodLabel: 'Año actual', start: new Date(now.getFullYear(), 0, 1) },
  ];

  return periods.map((period) => {
    const periodOrders = orders.filter((order) => new Date(order.created_at) >= period.start);
    const cancelledOrders = periodOrders.filter((order) => order.status === 'cancelled');
    const grossSales = periodOrders.reduce((sum, order) => sum + Number(order.total), 0);
    const refunds = cancelledOrders.reduce((sum, order) => sum + Number(order.refund_amount || 0), 0);

    return {
      id: period.id,
      periodType: period.periodType,
      periodLabel: period.periodLabel,
      totalPurchases: periodOrders.length,
      cancelledPurchases: cancelledOrders.length,
      grossSales,
      netSales: grossSales - refunds,
    };
  });
}

function getDashboard() {
  const orders = getOrders();
  const products = getProducts();
  const purchaseHistory = orders.map((order) => ({
    id: String(order.id),
    orderId: order.order_number,
    customer: order.customer_name,
    status: order.status,
    paymentStatus: order.payment_status,
    total: Number(order.total),
    purchasedAt: order.created_at,
  }));

  const cancelledPurchases = orders
    .filter((order) => order.status === 'cancelled')
    .map((order) => ({
      id: `cancel-${order.id}`,
      orderId: order.order_number,
      customer: order.customer_name,
      reason: order.cancellation_reason || 'Sin motivo registrado',
      cancelledAt: order.cancelled_at || order.created_at,
      refundAmount: Number(order.refund_amount || 0),
    }));

  const totalSales = orders
    .filter((order) => order.status !== 'cancelled')
    .reduce((sum, order) => sum + Number(order.total), 0);

  return {
    stats: {
      totalSales: formatCurrency(totalSales),
      ordersToday: orders.filter((order) => new Date(order.created_at).toDateString() === new Date().toDateString()).length,
      products: products.length,
      lowStock: products.filter((product) => product.stock <= 5).length,
    },
    purchaseHistory,
    cancelledPurchases,
    purchaseReports: buildReports(orders),
  };
}

function getBootstrapPayload() {
  return {
    categories: getCategories(),
    products: getProducts(),
    settings: getStoreSettings(),
    dashboard: getDashboard(),
  };
}

function getCategoryIdByName(name) {
  if (!name) return null;
  const row = queryJson(`SELECT id FROM categories WHERE name = ${escapeValue(name)} LIMIT 1;`)[0];
  return row?.id ?? null;
}

function createOrder(payload) {
  const customerName = `${payload.firstName} ${payload.lastName}`.trim();
  const total = payload.items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
  const currentMaxId = Number(scalar('SELECT COALESCE(MAX(id), 0) AS max_id FROM orders;', 0));
  const nextNumber = currentMaxId + 1;
  const orderNumber = `DR-${new Date().getFullYear()}-${String(nextNumber).padStart(5, '0')}`;

  runRawSql(`
    INSERT INTO orders (order_number, customer_name, customer_email, address, city, zip, status, payment_status, total)
    VALUES (
      ${escapeValue(orderNumber)},
      ${escapeValue(customerName)},
      ${escapeValue(payload.email)},
      ${escapeValue(payload.address)},
      ${escapeValue(payload.city)},
      ${escapeValue(payload.zip)},
      'paid',
      'paid',
      ${escapeValue(total)}
    );
  `);

  const orderId = Number(scalar('SELECT id AS id FROM orders ORDER BY id DESC LIMIT 1;', 0));

  for (const item of payload.items) {
    const currentStock = Number(scalar(`SELECT stock AS stock FROM products WHERE id = ${escapeValue(item.id)};`, 0));
    const nextStock = Math.max(currentStock - Number(item.quantity), 0);

    runRawSql(`
      INSERT INTO order_items (order_id, product_id, product_name, price, quantity, selected_size, selected_color)
      VALUES (
        ${escapeValue(orderId)},
        ${escapeValue(item.id)},
        ${escapeValue(item.name)},
        ${escapeValue(item.price)},
        ${escapeValue(item.quantity)},
        ${escapeValue(item.selectedSize ?? null)},
        ${escapeValue(item.selectedColor ?? null)}
      );
    `);

    runRawSql(`UPDATE products SET stock = ${escapeValue(nextStock)}, updated_at = CURRENT_TIMESTAMP WHERE id = ${escapeValue(item.id)};`);
  }

  return { orderNumber, total };
}

function updateStoreSettings(payload) {
  runRawSql(`
    UPDATE store_settings
    SET hero_title = ${escapeValue(payload.hero.title)},
        hero_subtitle = ${escapeValue(payload.hero.subtitle)},
        hero_image_url = ${escapeValue(payload.hero.imageUrl)},
        about_text = ${escapeValue(payload.aboutText)},
        contact_email = ${escapeValue(payload.contactEmail)},
        updated_at = CURRENT_TIMESTAMP
    WHERE id = 1;
  `);

  runRawSql('DELETE FROM banners;');
  payload.banners.forEach((banner, index) => {
    const categoryId = getCategoryIdByName(banner.categoryLink);
    runRawSql(`
      INSERT INTO banners (id, title, subtitle, button_text, image_url, category_id, display_order, is_active)
      VALUES (
        ${escapeValue(banner.id || `b${index + 1}`)},
        ${escapeValue(banner.title)},
        ${escapeValue(banner.subtitle)},
        ${escapeValue(banner.buttonText)},
        ${escapeValue(banner.imageUrl)},
        ${escapeValue(categoryId)},
        ${escapeValue(index)},
        1
      );
    `);
  });

  return getStoreSettings();
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  response.end(JSON.stringify(payload));
}

initializeDatabase();

const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (request.method === 'OPTIONS') {
    response.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    response.end();
    return;
  }

  try {
    if (request.method === 'GET' && url.pathname === '/api/health') {
      sendJson(response, 200, { ok: true, dbExists: existsSync(dbPath) });
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/bootstrap') {
      sendJson(response, 200, getBootstrapPayload());
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/login') {
      const body = await readBody(request);
      const user = queryJson(`
        SELECT id, email, name, role
        FROM admin_users
        WHERE email = ${escapeValue(body.email)}
          AND password = ${escapeValue(body.password)}
        LIMIT 1;
      `)[0];

      if (!user) {
        sendJson(response, 401, { message: 'Credenciales inválidas' });
        return;
      }

      sendJson(response, 200, { user });
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/orders') {
      const body = await readBody(request);
      if (!body.items?.length) {
        sendJson(response, 400, { message: 'El carrito está vacío' });
        return;
      }
      const order = createOrder(body);
      sendJson(response, 201, { order, dashboard: getDashboard(), products: getProducts() });
      return;
    }

    if (request.method === 'PUT' && url.pathname === '/api/settings') {
      const body = await readBody(request);
      const settings = updateStoreSettings(body);
      sendJson(response, 200, { settings });
      return;
    }

    sendJson(response, 404, { message: `Ruta no encontrada: ${request.method} ${url.pathname}` });
  } catch (error) {
    console.error(error);
    sendJson(response, 500, { message: 'Error interno del servidor', detail: error.message });
  }
});

server.listen(port, () => {
  console.log(`Dark Ranch API escuchando en http://localhost:${port}`);
});

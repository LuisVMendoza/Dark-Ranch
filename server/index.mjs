import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataPath = resolve(__dirname, '../local-data/dark-ranch.json');
const port = Number(process.env.API_PORT || 3001);

mkdirSync(dirname(dataPath), { recursive: true });

const defaultStore = {
  categories: [
    { id: 'cat_botas', name: 'Botas', slug: 'botas', imageUrl: 'https://images.unsplash.com/photo-1638247025967-b4e38f687b76?q=80&w=1200&auto=format&fit=crop' },
    { id: 'cat_sombreros', name: 'Sombreros', slug: 'sombreros', imageUrl: 'https://images.unsplash.com/photo-1533733508367-285b9967b85e?q=80&w=1200&auto=format&fit=crop' },
    { id: 'cat_camisas', name: 'Camisas', slug: 'camisas', imageUrl: 'https://images.unsplash.com/photo-1620932900827-4a5120470d61?q=80&w=1200&auto=format&fit=crop' },
    { id: 'cat_jeans', name: 'Jeans', slug: 'jeans', imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=1200&auto=format&fit=crop' },
    { id: 'cat_cinturones', name: 'Cinturones', slug: 'cinturones', imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=1200&auto=format&fit=crop' },
    { id: 'cat_accesorios', name: 'Accesorios', slug: 'accesorios', imageUrl: 'https://images.unsplash.com/photo-1551537482-f2075a1d41f2?q=80&w=1200&auto=format&fit=crop' },
  ],
  products: [
    { id: 'dr-001', name: 'Bota Vaquera Cuero Negro', slug: 'bota-vaquera-cuero-negro', description: 'Construida para durar. Cuero de grano entero con acabado industrial. Suela resistente al aceite y costuras reforzadas.', price: 189.99, salePrice: null, category: 'Botas', images: ['https://images.unsplash.com/photo-1638247025967-b4e38f687b76?q=80&w=800&auto=format&fit=crop'], sizes: ['7', '8', '9', '10', '11', '12'], colors: ['Negro'], tags: ['Industrial', 'Western', 'Cuero'], stock: 15, isNew: true, isFeatured: true, isActive: true, createdAt: '2026-01-10T10:00:00Z' },
    { id: 'dr-008', name: 'Cinto Pitón Industrial', slug: 'cinto-piton-industrial', description: 'Cuero con grabado exótico. Herrajes de latón envejecido.', price: 89, salePrice: null, category: 'Cinturones', images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=800&auto=format&fit=crop'], sizes: ['32', '34', '36', '38'], colors: ['Negro'], tags: ['Accesorios'], stock: 15, isNew: false, isFeatured: true, isActive: true, createdAt: '2026-01-11T10:00:00Z' },
    { id: 'dr-009', name: 'Sombrero Dust Rider', slug: 'sombrero-dust-rider', description: 'Fieltro rígido, corona alta. El favorito de los outlaws.', price: 145, salePrice: null, category: 'Sombreros', images: ['https://images.unsplash.com/photo-1533733508367-285b9967b85e?q=80&w=800&auto=format&fit=crop'], sizes: ['M', 'L'], colors: ['Arena'], tags: ['Western'], stock: 8, isNew: false, isFeatured: true, isActive: true, createdAt: '2026-01-12T10:00:00Z' },
    { id: 'dr-010', name: 'Camisa Denim Hard-Work', slug: 'camisa-denim-hard-work', description: 'Denim de 12oz. Triple costura para durabilidad extrema.', price: 85, salePrice: null, category: 'Camisas', images: ['https://images.unsplash.com/photo-1620932900827-4a5120470d61?q=80&w=800&auto=format&fit=crop'], sizes: ['M', 'L', 'XL', 'XXL'], colors: ['Indigo'], tags: ['Industrial'], stock: 20, isNew: false, isFeatured: true, isActive: true, createdAt: '2026-01-13T10:00:00Z' },
    { id: 'dr-002', name: 'Sombrero Felt Premium', slug: 'sombrero-felt-premium', description: 'Fieltro de alta calidad. Resistente al agua y al polvo del desierto.', price: 125, salePrice: null, category: 'Sombreros', images: ['https://images.unsplash.com/photo-1572307480813-ceb0e59d8325?q=80&w=800&auto=format&fit=crop'], sizes: ['S', 'M', 'L', 'XL'], colors: ['Marrón', 'Negro'], tags: ['Western', 'Premium'], stock: 22, isNew: false, isFeatured: true, isActive: true, createdAt: '2026-01-09T10:00:00Z' },
    { id: 'dr-003', name: 'Cinturón Hebilla Acero', slug: 'cinturon-hebilla-acero', description: 'Hebilla forjada a mano. Cuero curtido vegetal de 4mm.', price: 55, salePrice: null, category: 'Cinturones', images: ['https://images.unsplash.com/photo-1614165939092-4914f6a9e16d?q=80&w=800&auto=format&fit=crop'], sizes: ['30', '32', '34', '36'], colors: ['Café'], tags: ['Accesorios', 'Industrial'], stock: 45, isNew: true, isFeatured: false, isActive: true, createdAt: '2026-01-08T10:00:00Z' },
    { id: 'dr-004', name: 'Jeans Industrial Raw', slug: 'jeans-industrial-raw', description: 'Denim japonés de 14oz. Corte recto, remaches de cobre y triple costura.', price: 95, salePrice: null, category: 'Jeans', images: ['https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=800&auto=format&fit=crop'], sizes: ['30', '32', '34', '36'], colors: ['Indigo'], tags: ['Industrial', 'Denim'], stock: 30, isNew: false, isFeatured: true, isActive: true, createdAt: '2026-01-07T10:00:00Z' },
    { id: 'dr-005', name: 'Camisa Chambray Western', slug: 'camisa-chambray-western', description: 'Tela chambray ligera pero resistente. Botones de perla y canesú estilo western clásico.', price: 75, salePrice: null, category: 'Camisas', images: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=800&auto=format&fit=crop'], sizes: ['S', 'M', 'L', 'XL'], colors: ['Azul', 'Gris'], tags: ['Western', 'Camisas'], stock: 25, isNew: false, isFeatured: false, isActive: true, createdAt: '2026-01-06T10:00:00Z' },
    { id: 'dr-006', name: 'Bota Ranchera Tabaco', slug: 'bota-ranchera-tabaco', description: 'Cuero color tabaco con pátina natural. Comodidad excepcional desde el primer día.', price: 165, salePrice: null, category: 'Botas', images: ['https://images.unsplash.com/photo-1605733513597-a8f8341084e6?q=80&w=800&auto=format&fit=crop'], sizes: ['8', '9', '10', '11'], colors: ['Tabaco'], tags: ['Western', 'Confort'], stock: 10, isNew: false, isFeatured: false, isActive: true, createdAt: '2026-01-05T10:00:00Z' },
    { id: 'dr-007', name: 'Chaqueta Denim Forrada', slug: 'chaqueta-denim-forrada', description: 'Forro de lana sintética para los inviernos en el rancho. Exterior de mezclilla pesada.', price: 145, salePrice: 129, category: 'Accesorios', images: ['https://images.unsplash.com/photo-1551537482-f2075a1d41f2?q=80&w=800&auto=format&fit=crop'], sizes: ['M', 'L', 'XL'], colors: ['Indigo'], tags: ['Invierno', 'Premium'], stock: 12, isNew: false, isFeatured: false, isActive: true, createdAt: '2026-01-04T10:00:00Z' },
  ],
  settings: {
    hero: {
      title: 'BUILT FOR WORK. STYLED FOR THE WILD.',
      subtitle: 'INDUSTRIAL & WESTERN',
      imageUrl: 'https://images.unsplash.com/photo-1541661538396-53ba2d051eed?q=80&w=2000&auto=format&fit=crop',
    },
    banners: [
      {
        id: 'b1',
        title: 'Colección de Invierno 2026',
        subtitle: 'Prepárate para las noches frías del desierto con nuestra nueva línea forjada en denim pesado.',
        buttonText: 'Descubrir Ahora',
        imageUrl: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?q=80&w=2000&auto=format&fit=crop',
        categoryLink: 'Jeans',
      },
    ],
    aboutText: 'Dark Ranch nació en el corazón del desierto de Sonora, donde la necesidad de ropa resistente se encontró con la elegancia del viejo oeste. No solo hacemos ropa; forjamos armaduras modernas para el trabajador y el aventurero.',
    contactEmail: 'contacto@darkranch.com',
  },
  adminUsers: [
    { id: 1, email: 'admin@darkranch.com', password: 'admin123', name: 'Admin Dark Ranch', role: 'admin' },
  ],
  customerUsers: [
    { id: 'cus_seed_01', email: 'cliente@darkranch.com', password: 'cliente123', name: 'Cliente Dark Ranch', role: 'customer', createdAt: '2026-01-01T00:00:00Z' },
  ],
  customerSessions: [],
  productComments: [],
  orders: [
    { id: 1, order_number: 'DR-2026-00021', customer_name: 'María López', customer_email: 'maria@example.com', customer_token: 'guest-demo-maria', address: 'Calle 1 #45', city: 'Monterrey', zip: '64000', status: 'delivered', payment_status: 'paid', total: 189.99, created_at: '2026-01-14T10:35:00Z', cancellation_reason: null, refund_amount: null, cancelled_at: null },
    { id: 2, order_number: 'DR-2026-00022', customer_name: 'Javier Ruiz', customer_email: 'javier@example.com', customer_token: 'guest-demo-javier', address: 'Av. Sierra 180', city: 'Saltillo', zip: '25000', status: 'shipped', payment_status: 'paid', total: 230, created_at: '2026-01-15T13:10:00Z', cancellation_reason: null, refund_amount: null, cancelled_at: null },
    { id: 3, order_number: 'DR-2026-00023', customer_name: 'Ana Torres', customer_email: 'ana@example.com', customer_token: 'guest-demo-ana', address: 'Bosques 904', city: 'Chihuahua', zip: '31000', status: 'cancelled', payment_status: 'refunded', total: 145, created_at: '2026-01-15T18:45:00Z', cancellation_reason: 'Cambio de talla', refund_amount: 145, cancelled_at: '2026-01-15T20:10:00Z' },
    { id: 4, order_number: 'DR-2026-00024', customer_name: 'Ricardo Pérez', customer_email: 'ricardo@example.com', customer_token: 'guest-demo-ricardo', address: 'Centro 12', city: 'Hermosillo', zip: '83000', status: 'paid', payment_status: 'paid', total: 95, created_at: '2026-01-16T09:05:00Z', cancellation_reason: null, refund_amount: null, cancelled_at: null },
    { id: 5, order_number: 'DR-2026-00019', customer_name: 'Luis Mena', customer_email: 'luis@example.com', customer_token: 'guest-demo-luis', address: 'Norte 88', city: 'Torreón', zip: '27000', status: 'cancelled', payment_status: 'refunded', total: 89, created_at: '2026-01-13T09:10:00Z', cancellation_reason: 'Pago duplicado', refund_amount: 89, cancelled_at: '2026-01-13T11:30:00Z' },
  ],
  orderItems: [
    { orderId: 1, productId: 'dr-001', productName: 'Bota Vaquera Cuero Negro', price: 189.99, quantity: 1, selectedSize: '10', selectedColor: 'Negro' },
    { orderId: 2, productId: 'dr-008', productName: 'Cinto Pitón Industrial', price: 89, quantity: 1, selectedSize: '34', selectedColor: 'Negro' },
    { orderId: 2, productId: 'dr-009', productName: 'Sombrero Dust Rider', price: 141, quantity: 1, selectedSize: 'M', selectedColor: 'Arena' },
    { orderId: 3, productId: 'dr-009', productName: 'Sombrero Dust Rider', price: 145, quantity: 1, selectedSize: 'L', selectedColor: 'Arena' },
    { orderId: 4, productId: 'dr-004', productName: 'Jeans Industrial Raw', price: 95, quantity: 1, selectedSize: '32', selectedColor: 'Indigo' },
    { orderId: 5, productId: 'dr-008', productName: 'Cinto Pitón Industrial', price: 89, quantity: 1, selectedSize: '36', selectedColor: 'Negro' },
  ],
};

function cloneDefaultStore() {
  return JSON.parse(JSON.stringify(defaultStore));
}

function initializeStore() {
  if (!existsSync(dataPath)) {
    writeStore(cloneDefaultStore());
  }
}

function readStore() {
  return JSON.parse(readFileSync(dataPath, 'utf8'));
}

function writeStore(store) {
  writeFileSync(dataPath, JSON.stringify(store, null, 2));
}

function getProducts(store) {
  return store.products
    .filter((product) => product.isActive !== false)
    .sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map(({ isActive, createdAt, ...product }) => ({
      ...product,
      salePrice: product.salePrice ?? undefined,
      isNew: Boolean(product.isNew),
      isFeatured: Boolean(product.isFeatured),
    }));
}

function getCategories(store) {
  return [...store.categories].sort((a, b) => a.name.localeCompare(b.name));
}

function getStoreSettings(store) {
  return store.settings;
}

function getOrders(store) {
  return [...store.orders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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

function getDashboard(store) {
  const orders = getOrders(store);
  const products = getProducts(store);
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

function getBootstrapPayload(store) {
  return {
    categories: getCategories(store),
    products: getProducts(store),
    settings: getStoreSettings(store),
    dashboard: getDashboard(store),
  };
}

function createOrder(store, payload) {
  const customerName = `${payload.firstName} ${payload.lastName}`.trim();
  const total = payload.items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
  const currentMaxId = store.orders.reduce((max, order) => Math.max(max, Number(order.id)), 0);
  const nextId = currentMaxId + 1;
  const orderNumber = `DR-${new Date().getFullYear()}-${String(nextId).padStart(5, '0')}`;

  store.orders.push({
    id: nextId,
    order_number: orderNumber,
    customer_name: customerName,
    customer_email: payload.email,
    customer_token: payload.customerToken || `guest-${payload.email}`,
    address: payload.address,
    city: payload.city,
    zip: payload.zip,
    status: 'paid',
    payment_status: 'paid',
    total,
    created_at: new Date().toISOString(),
    cancellation_reason: null,
    refund_amount: null,
    cancelled_at: null,
  });

  for (const item of payload.items) {
    store.orderItems.push({
      orderId: nextId,
      productId: item.id,
      productName: item.name,
      price: item.price,
      quantity: item.quantity,
      selectedSize: item.selectedSize ?? null,
      selectedColor: item.selectedColor ?? null,
    });

    const product = store.products.find((entry) => entry.id === item.id);
    if (product) {
      product.stock = Math.max(Number(product.stock) - Number(item.quantity), 0);
    }
  }

  writeStore(store);
  return { orderNumber, total };
}

function normalizeStore(store) {
  store.customerUsers = Array.isArray(store.customerUsers) ? store.customerUsers : [];
  store.customerSessions = Array.isArray(store.customerSessions) ? store.customerSessions : [];
  store.productComments = Array.isArray(store.productComments) ? store.productComments : [];
  store.orders = (store.orders || []).map((order) => ({
    ...order,
    customer_token: order.customer_token || `guest-${order.customer_email}`,
  }));
  return store;
}

function registerCustomer(store, payload) {
  const email = String(payload.email || '').trim().toLowerCase();
  const name = String(payload.name || '').trim();
  const password = String(payload.password || '').trim();

  if (!email || !name || !password) {
    throw new Error('Nombre, email y contraseña son obligatorios');
  }

  const emailInUse = store.adminUsers.some((entry) => entry.email.toLowerCase() === email)
    || store.customerUsers.some((entry) => entry.email.toLowerCase() === email);

  if (emailInUse) {
    throw new Error('Ese email ya está registrado');
  }

  const customer = {
    id: `cus_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    email,
    password,
    name,
    role: 'customer',
    createdAt: new Date().toISOString(),
  };

  store.customerUsers.push(customer);
  writeStore(store);
  return customer;
}

function loginCustomer(store, payload) {
  const email = String(payload.email || '').trim().toLowerCase();
  const name = String(payload.name || '').trim();
  if (!email || !name) {
    throw new Error('Nombre y email son obligatorios');
  }

  const existing = store.customerSessions.find((entry) => entry.email === email);
  if (existing) {
    existing.name = name;
    existing.lastLoginAt = new Date().toISOString();
    writeStore(store);
    return existing;
  }

  const customer = {
    id: `cus_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    name,
    email,
    lastLoginAt: new Date().toISOString(),
  };
  store.customerSessions.push(customer);
  writeStore(store);
  return customer;
}

function getCustomerOrders(store, token, email) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  return store.orders
    .filter((order) => {
      if (token && order.customer_token === token) return true;
      return normalizedEmail ? String(order.customer_email || '').toLowerCase() === normalizedEmail : false;
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map((order) => ({
      id: order.id,
      orderNumber: order.order_number,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      status: order.status,
      paymentStatus: order.payment_status,
      total: Number(order.total),
      createdAt: order.created_at,
      items: store.orderItems
        .filter((item) => Number(item.orderId) === Number(order.id))
        .map((item) => ({
          productId: item.productId,
          productName: item.productName,
          price: Number(item.price),
          quantity: Number(item.quantity),
          selectedSize: item.selectedSize ?? null,
          selectedColor: item.selectedColor ?? null,
        })),
    }));
}

function getProductComments(store, productId) {
  return [...store.productComments]
    .filter((entry) => entry.productId === productId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function createComment(store, productId, payload) {
  const content = String(payload.content || '').trim();
  if (!payload.customerId || !payload.customerName || !payload.customerEmail || !content) {
    throw new Error('Datos incompletos para comentar');
  }

  const comment = {
    id: `com_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    productId,
    customerId: payload.customerId,
    customerName: payload.customerName,
    customerEmail: payload.customerEmail,
    content,
    images: Array.isArray(payload.images) ? payload.images.filter(Boolean).slice(0, 4) : [],
    createdAt: new Date().toISOString(),
  };

  store.productComments.push(comment);
  writeStore(store);
  return comment;
}

function deleteComment(store, productId, commentId) {
  const originalLength = store.productComments.length;
  store.productComments = store.productComments.filter((entry) => !(entry.productId === productId && entry.id === commentId));
  if (store.productComments.length !== originalLength) {
    writeStore(store);
    return true;
  }
  return false;
}

function updateStoreSettings(store, payload) {
  store.settings = {
    hero: {
      title: payload.hero.title,
      subtitle: payload.hero.subtitle,
      imageUrl: payload.hero.imageUrl,
    },
    banners: payload.banners.map((banner, index) => ({
      id: banner.id || `b${index + 1}`,
      title: banner.title,
      subtitle: banner.subtitle,
      buttonText: banner.buttonText,
      imageUrl: banner.imageUrl,
      categoryLink: banner.categoryLink,
    })),
    aboutText: payload.aboutText,
    contactEmail: payload.contactEmail,
  };

  writeStore(store);
  return store.settings;
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
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Actor-Id, X-Admin-Actor-Name, X-Admin-Actor-Email, X-Admin-Actor-Role',
  });
  response.end(JSON.stringify(payload));
}

initializeStore();

const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (request.method === 'OPTIONS') {
    response.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Actor-Id, X-Admin-Actor-Name, X-Admin-Actor-Email, X-Admin-Actor-Role',
    });
    response.end();
    return;
  }

  try {
    const store = normalizeStore(readStore());

    if (request.method === 'GET' && url.pathname === '/api/health') {
      sendJson(response, 200, { ok: true, dataExists: existsSync(dataPath) });
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/bootstrap') {
      sendJson(response, 200, getBootstrapPayload(store));
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/customer/login') {
      const body = await readBody(request);
      const customer = loginCustomer(store, body);
      sendJson(response, 200, { customer: { id: customer.id, name: customer.name, email: customer.email } });
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/login') {
      const body = await readBody(request);
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '').trim();
      const admin = store.adminUsers.find((entry) => entry.email.toLowerCase() === email && entry.password === password);

      if (admin) {
        sendJson(response, 200, { user: { id: admin.id, email: admin.email, name: admin.name, role: admin.role } });
        return;
      }

      const customer = store.customerUsers.find((entry) => entry.email.toLowerCase() === email && entry.password === password);
      if (!customer) {
        sendJson(response, 401, { message: 'Credenciales inválidas' });
        return;
      }

      sendJson(response, 200, { user: { id: customer.id, email: customer.email, name: customer.name, role: customer.role } });
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/register') {
      const body = await readBody(request);
      const customer = registerCustomer(store, body);
      sendJson(response, 201, { user: { id: customer.id, email: customer.email, name: customer.name, role: customer.role } });
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/orders') {
      const body = await readBody(request);
      if (!body.items?.length) {
        sendJson(response, 400, { message: 'El carrito está vacío' });
        return;
      }
      const order = createOrder(store, body);
      sendJson(response, 201, { order, dashboard: getDashboard(readStore()), products: getProducts(readStore()) });
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/orders/my') {
      const token = url.searchParams.get('token') || '';
      const email = url.searchParams.get('email') || '';
      if (!token && !email) {
        sendJson(response, 400, { message: 'Debes enviar token o email' });
        return;
      }
      sendJson(response, 200, { orders: getCustomerOrders(store, token, email) });
      return;
    }

    const productCommentsMatch = url.pathname.match(/^\/api\/products\/([^/]+)\/comments$/);
    if (productCommentsMatch && request.method === 'GET') {
      const productId = decodeURIComponent(productCommentsMatch[1]);
      sendJson(response, 200, { comments: getProductComments(store, productId) });
      return;
    }

    if (productCommentsMatch && request.method === 'POST') {
      const productId = decodeURIComponent(productCommentsMatch[1]);
      const body = await readBody(request);
      const comment = createComment(store, productId, body);
      sendJson(response, 201, { comment });
      return;
    }

    const deleteCommentMatch = url.pathname.match(/^\/api\/products\/([^/]+)\/comments\/([^/]+)$/);
    if (deleteCommentMatch && request.method === 'DELETE') {
      const actorRole = String(request.headers['x-admin-actor-role'] || '').toLowerCase();
      if (actorRole !== 'admin') {
        sendJson(response, 403, { message: 'Solo admin puede borrar comentarios' });
        return;
      }
      const productId = decodeURIComponent(deleteCommentMatch[1]);
      const commentId = decodeURIComponent(deleteCommentMatch[2]);
      const ok = deleteComment(store, productId, commentId);
      sendJson(response, ok ? 200 : 404, ok ? { ok: true } : { message: 'Comentario no encontrado' });
      return;
    }

    if (request.method === 'PUT' && url.pathname === '/api/settings') {
      const body = await readBody(request);
      const settings = updateStoreSettings(store, body);
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

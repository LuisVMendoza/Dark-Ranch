import {
  AdminCategoryPayload,
  AdminOrderUpdatePayload,
  AdminProductPayload,
  AdminSnapshot,
  AdminUserPayload,
  BootstrapData,
  CheckoutPayload,
  CustomerOrder,
  CustomerSession,
  DashboardData,
  Product,
  ProductComment,
  StoreSettings,
} from '../types';

type ApiErrorPayload = {
  message?: string;
  detail?: string;
  error?: string;
  errors?: unknown;
};

function parseJsonSafe(value: string): unknown {
  if (!value.trim()) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function isGenericErrorMessage(message?: string): boolean {
  if (!message) return true;
  const normalized = message.trim().toLowerCase();
  return normalized === 'error interno del servidor' || normalized === 'error en la petición' || normalized === 'internal server error';
}

function buildRequestError(path: string, method: string, status: number, payload: ApiErrorPayload | null, rawBody: string): Error {
  const baseMessage = payload?.message || payload?.detail || payload?.error || 'Error en la petición';
  const detail = payload?.detail && payload?.detail !== payload?.message ? payload.detail : undefined;
  const fallbackDetail = !detail && rawBody && !rawBody.trim().startsWith('<') ? rawBody.trim() : undefined;
  const diagnostic = detail || fallbackDetail;

  const message = isGenericErrorMessage(baseMessage) && diagnostic
    ? `[${method} ${path}] HTTP ${status}: ${diagnostic}`
    : `[${method} ${path}] HTTP ${status}: ${baseMessage}${diagnostic ? ` | detalle: ${diagnostic}` : ''}`;

  return new Error(message);
}

function getAdminHeaders(): HeadersInit {
  if (typeof window === 'undefined') {
    return {};
  }

  const rawUser = window.localStorage.getItem('dark-ranch-admin-user');
  if (!rawUser) {
    return {};
  }

  try {
    const user = JSON.parse(rawUser) as { id?: number; name?: string; email?: string; role?: string };
    return {
      ...(user.id ? { 'X-Admin-Actor-Id': String(user.id) } : {}),
      ...(user.name ? { 'X-Admin-Actor-Name': user.name } : {}),
      ...(user.email ? { 'X-Admin-Actor-Email': user.email } : {}),
      ...(user.role ? { 'X-Admin-Actor-Role': user.role } : {}),
    };
  } catch {
    return {};
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const method = init?.method || 'GET';
  const response = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...getAdminHeaders(),
      ...(init?.headers || {}),
    },
    ...init,
  });

  const raw = await response.text();
  const parsed = parseJsonSafe(raw);
  const payload = (parsed && typeof parsed === 'object') ? (parsed as ApiErrorPayload) : null;

  if (!response.ok) {
    throw buildRequestError(path, method, response.status, payload, raw);
  }

  return parsed as T;
}

async function requestFormData<T>(path: string, formData: FormData): Promise<T> {
  const method = 'POST';
  const response = await fetch(path, {
    method,
    headers: {
      ...getAdminHeaders(),
    },
    body: formData,
  });

  const raw = await response.text();
  const parsed = parseJsonSafe(raw);
  const payload = (parsed && typeof parsed === 'object') ? (parsed as ApiErrorPayload) : null;

  if (!response.ok) {
    throw buildRequestError(path, method, response.status, payload, raw);
  }

  return parsed as T;
}

export function getBootstrapData() {
  return request<BootstrapData>('/api/bootstrap');
}

export function getAdminSnapshot() {
  return request<AdminSnapshot>('/api/admin/snapshot');
}

export function loginAdmin(email: string, password: string) {
  return request<{ user: { id: number; email: string; name: string; role: string } }>('/api/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function saveStoreSettings(settings: StoreSettings) {
  return request<{ settings: StoreSettings }>('/api/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  });
}

export function createOrder(payload: CheckoutPayload) {
  return request<{
    order: { orderNumber: string; total: number };
    dashboard: DashboardData;
    products: Product[];
  }>('/api/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function loginCustomer(name: string, email: string) {
  return request<{ customer: CustomerSession }>('/api/customer/login', {
    method: 'POST',
    body: JSON.stringify({ name, email }),
  });
}

export function getMyOrders(customerToken: string, email?: string) {
  const search = new URLSearchParams({ token: customerToken });
  if (email) search.set('email', email);
  return request<{ orders: CustomerOrder[] }>(`/api/orders/my?${search.toString()}`);
}

export function getProductComments(productId: string) {
  return request<{ comments: ProductComment[] }>(`/api/products/${encodeURIComponent(productId)}/comments`);
}

export function createProductComment(
  productId: string,
  payload: { customerId: string; customerName: string; customerEmail: string; content: string; images: string[] },
) {
  return request<{ comment: ProductComment }>(`/api/products/${encodeURIComponent(productId)}/comments`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function deleteProductComment(productId: string, commentId: string) {
  return request<{ ok: boolean }>(`/api/products/${encodeURIComponent(productId)}/comments/${encodeURIComponent(commentId)}`, {
    method: 'DELETE',
  });
}

export function createAdminProduct(payload: AdminProductPayload) {
  return request<{ product: Product }>('/api/admin/products', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateAdminProduct(id: string, payload: AdminProductPayload) {
  return request<{ product: Product }>(`/api/admin/products/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteAdminProduct(id: string) {
  return request<{ ok: boolean }>(`/api/admin/products/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export function createAdminCategory(payload: AdminCategoryPayload) {
  return request<{ category: { id: string; name: string; slug: string; imageUrl: string } }>('/api/admin/categories', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateAdminCategory(id: string, payload: AdminCategoryPayload) {
  return request<{ category: { id: string; name: string; slug: string; imageUrl: string } }>(`/api/admin/categories/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteAdminCategory(id: string) {
  return request<{ ok: boolean }>(`/api/admin/categories/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export function updateAdminOrder(id: number, payload: AdminOrderUpdatePayload) {
  return request(`/api/admin/orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteAdminOrder(id: number) {
  return request<{ ok: boolean }>(`/api/admin/orders/${id}`, {
    method: 'DELETE',
  });
}

export function createAdminUser(payload: AdminUserPayload) {
  return request('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateAdminUser(id: number, payload: AdminUserPayload) {
  return request(`/api/admin/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteAdminUser(id: number) {
  return request<{ ok: boolean }>(`/api/admin/users/${id}`, {
    method: 'DELETE',
  });
}

export function purgeAdminActivityLogs(retentionMonths: number) {
  return request<{ ok: boolean; deleted: number; retentionMonths: number; cutoffDate: string }>('/api/admin/activity/purge', {
    method: 'POST',
    body: JSON.stringify({ retentionMonths }),
  });
}

export function uploadAdminImage(file: File, folder: string) {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('folder', folder);
  return requestFormData<{ url: string }>('/api/admin/uploads', formData).then((payload) => payload.url);
}

export function deleteAdminImage(url: string) {
  return request<{ ok: boolean }>('/api/admin/uploads', {
    method: 'DELETE',
    body: JSON.stringify({ url }),
  });
}

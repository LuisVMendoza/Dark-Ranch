import {
  AdminCategoryPayload,
  AdminOrderUpdatePayload,
  AdminProductPayload,
  AdminSnapshot,
  AdminUserPayload,
  BootstrapData,
  CheckoutPayload,
  DashboardData,
  Product,
  StoreSettings,
} from '../types';

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
  const response = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...getAdminHeaders(),
      ...(init?.headers || {}),
    },
    ...init,
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message || payload.detail || 'Error en la petición');
  }

  return payload as T;
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

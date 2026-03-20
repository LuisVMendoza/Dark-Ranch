import { BootstrapData, CheckoutPayload, Product, StoreSettings, DashboardData } from '../types';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    ...init,
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message || 'Error en la petición');
  }

  return payload as T;
}

export function getBootstrapData() {
  return request<BootstrapData>('/api/bootstrap');
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

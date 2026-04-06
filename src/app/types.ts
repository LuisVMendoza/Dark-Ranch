export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  salePrice?: number | null;
  category: string;
  categoryId?: string;
  images: string[];
  sizes: string[];
  colors: string[];
  stock: number;
  tags: string[];
  isNew?: boolean;
  isFeatured?: boolean;
  isActive?: boolean;
  createdAt?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
}

export interface BannerSettings {
  id: string;
  title: string;
  subtitle: string;
  buttonText: string;
  imageUrl: string;
  categoryLink: string;
}

export interface StoreSettings {
  hero: {
    title: string;
    subtitle: string;
    imageUrl: string;
  };
  banners: BannerSettings[];
  aboutText: string;
  contactEmail: string;
}

export interface PurchaseHistoryItem {
  id: string;
  orderId: string;
  customer: string;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  total: number;
  purchasedAt: string;
}

export interface CancelledPurchaseItem {
  id: string;
  orderId: string;
  customer: string;
  reason: string;
  cancelledAt: string;
  refundAmount: number;
}

export interface PurchaseReportItem {
  id: string;
  periodType: 'day' | 'week' | 'month' | 'bimester' | 'quarter' | 'semester' | 'year';
  periodLabel: string;
  totalPurchases: number;
  cancelledPurchases: number;
  grossSales: number;
  netSales: number;
}

export interface DashboardData {
  stats: {
    totalSales: string;
    ordersToday: number;
    products: number;
    lowStock: number;
  };
  purchaseHistory: PurchaseHistoryItem[];
  cancelledPurchases: CancelledPurchaseItem[];
  purchaseReports: PurchaseReportItem[];
}

export interface BootstrapData {
  categories: Category[];
  products: Product[];
  settings: StoreSettings;
  dashboard: DashboardData;
}

export interface CheckoutPayload {
  email: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  zip: string;
  cardNumber: string;
  expiry: string;
  cvc: string;
  customerToken?: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    selectedSize?: string;
    selectedColor?: string;
  }>;
}

export interface CustomerSession {
  id: string;
  name: string;
  email: string;
}

export interface ProductComment {
  id: string;
  productId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  content: string;
  images: string[];
  createdAt: string;
}

export interface CustomerOrder {
  id: number;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  status: AdminOrder['status'];
  paymentStatus: AdminOrder['paymentStatus'];
  total: number;
  createdAt: string;
  items: AdminOrderItem[];
}

export interface AdminOrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  selectedSize?: string | null;
  selectedColor?: string | null;
}

export interface AdminOrder {
  id: number;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  address: string;
  city: string;
  zip: string;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  total: number;
  createdAt: string;
  cancellationReason?: string | null;
  refundAmount?: number | null;
  cancelledAt?: string | null;
  items: AdminOrderItem[];
}

export interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: string;
}

export interface AdminActivityLog {
  id: number | string;
  actorId?: number | null;
  actorName: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  entityName: string;
  details: string;
  createdAt: string;
}

export interface AdminSnapshot {
  categories: Category[];
  products: Product[];
  orders: AdminOrder[];
  adminUsers: AdminUser[];
  activityLogs: AdminActivityLog[];
  settings: StoreSettings;
  dashboard: DashboardData;
}

export interface AdminProductPayload {
  id?: string;
  name: string;
  slug?: string;
  description: string;
  price: number;
  salePrice?: number | null;
  categoryId: string;
  images: string[];
  sizes: string[];
  colors: string[];
  tags: string[];
  stock: number;
  isNew: boolean;
  isFeatured: boolean;
  isActive: boolean;
}

export interface AdminCategoryPayload {
  id?: string;
  name: string;
  slug?: string;
  imageUrl: string;
}

export interface AdminUserPayload {
  email: string;
  name: string;
  role: string;
  password?: string;
}

export interface AdminOrderUpdatePayload {
  status: AdminOrder['status'];
  paymentStatus: AdminOrder['paymentStatus'];
  cancellationReason?: string;
  refundAmount?: number | null;
}

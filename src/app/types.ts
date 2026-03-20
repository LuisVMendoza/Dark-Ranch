export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  salePrice?: number;
  category: string;
  images: string[];
  sizes: string[];
  colors: string[];
  stock: number;
  tags: string[];
  isNew?: boolean;
  isFeatured?: boolean;
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
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    selectedSize?: string;
    selectedColor?: string;
  }>;
}

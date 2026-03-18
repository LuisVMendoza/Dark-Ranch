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

export const INITIAL_SETTINGS: StoreSettings = {
  hero: {
    title: "BUILT FOR WORK. STYLED FOR THE WILD.",
    subtitle: "INDUSTRIAL & WESTERN",
    imageUrl: "https://images.unsplash.com/photo-1541661538396-53ba2d051eed?q=80&w=2000&auto=format&fit=crop"
  },
  banners: [
    {
      id: "b1",
      title: "Colección de Invierno 2026",
      subtitle: "Prepárate para las noches frías del desierto con nuestra nueva línea forjada en denim pesado.",
      buttonText: "Descubrir Ahora",
      imageUrl: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?q=80&w=2000&auto=format&fit=crop",
      categoryLink: "Jeans"
    }
  ],
  aboutText: "Dark Ranch nació en el corazón del desierto de Sonora, donde la necesidad de ropa resistente se encontró con la elegancia del viejo oeste. No solo hacemos ropa; forjamos armaduras modernas para el trabajador y el aventurero.",
  contactEmail: "contacto@darkranch.com"
};

export const CATEGORIES = [
  "Botas",
  "Sombreros",
  "Camisas",
  "Jeans",
  "Cinturones",
  "Accesorios"
];

export const PRODUCTS: Product[] = [
  {
    id: "dr-001",
    name: "Bota Vaquera Cuero Negro",
    slug: "bota-vaquera-cuero-negro",
    description: "Construida para durar. Cuero de grano entero con acabado industrial. Suela resistente al aceite y costuras reforzadas.",
    price: 189.99,
    category: "Botas",
    images: ["https://images.unsplash.com/photo-1638247025967-b4e38f687b76?q=80&w=800&auto=format&fit=crop"],
    sizes: ["7", "8", "9", "10", "11", "12"],
    colors: ["Negro"],
    stock: 15,
    tags: ["Industrial", "Western", "Cuero"],
    isNew: true,
    isFeatured: true
  },
  {
    id: "dr-008",
    name: "Cinto Pitón Industrial",
    slug: "cinto-piton-industrial",
    description: "Cuero con grabado exótico. Herrajes de latón envejecido.",
    price: 89.00,
    category: "Cinturones",
    images: ["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=800&auto=format&fit=crop"],
    sizes: ["32", "34", "36", "38"],
    colors: ["Negro"],
    stock: 15,
    tags: ["Accesorios"],
    isFeatured: true
  },
  {
    id: "dr-009",
    name: "Sombrero Dust Rider",
    slug: "sombrero-dust-rider",
    description: "Fieltro rígido, corona alta. El favorito de los outlaws.",
    price: 145.00,
    category: "Sombreros",
    images: ["https://images.unsplash.com/photo-1533733508367-285b9967b85e?q=80&w=800&auto=format&fit=crop"],
    sizes: ["M", "L"],
    colors: ["Arena"],
    stock: 8,
    tags: ["Western"],
    isFeatured: true
  },
  {
    id: "dr-010",
    name: "Camisa Denim Hard-Work",
    slug: "camisa-denim-hard-work",
    description: "Denim de 12oz. Triple costura para durabilidad extrema.",
    price: 85.00,
    category: "Camisas",
    images: ["https://images.unsplash.com/photo-1620932900827-4a5120470d61?q=80&w=800&auto=format&fit=crop"],
    sizes: ["M", "L", "XL", "XXL"],
    colors: ["Indigo"],
    stock: 20,
    tags: ["Industrial"],
    isFeatured: true
  },
  {
    id: "dr-002",
    name: "Sombrero Felt Premium",
    slug: "sombrero-felt-premium",
    description: "Fieltro de castor de alta calidad. Resistente al agua y al polvo del desierto. Estilo clásico con toque moderno.",
    price: 125.00,
    category: "Sombreros",
    images: ["https://images.unsplash.com/photo-1572307480813-ceb0e59d8325?q=80&w=800&auto=format&fit=crop"],
    sizes: ["S", "M", "L", "XL"],
    colors: ["Marrón", "Negro"],
    stock: 22,
    tags: ["Western", "Premium"],
    isFeatured: true
  },
  {
    id: "dr-003",
    name: "Cinturón Hebilla Acero",
    slug: "cinturon-hebilla-acero",
    description: "Hebilla forjada a mano. Cuero curtido vegetal de 4mm. El accesorio definitivo para el trabajador moderno.",
    price: 55.00,
    category: "Cinturones",
    images: ["https://images.unsplash.com/photo-1614165939092-4914f6a9e16d?q=80&w=800&auto=format&fit=crop"],
    sizes: ["30", "32", "34", "36"],
    colors: ["Café"],
    stock: 45,
    tags: ["Accesorios", "Industrial"],
    isNew: true
  },
  {
    id: "dr-004",
    name: "Jeans Industrial Raw",
    slug: "jeans-industrial-raw",
    description: "Denim japonés de 14oz. Corte recto, remaches de cobre y triple costura. Envejece con tu trabajo.",
    price: 95.00,
    category: "Jeans",
    images: ["https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=800&auto=format&fit=crop"],
    sizes: ["30", "32", "34", "36"],
    colors: ["Indigo"],
    stock: 30,
    tags: ["Industrial", "Denim"],
    isFeatured: true
  },
  {
    id: "dr-005",
    name: "Camisa Chambray Western",
    slug: "camisa-chambray-western",
    description: "Tela chambray ligera pero resistente. Botones de perla y canesú estilo western clásico.",
    price: 75.00,
    category: "Camisas",
    images: ["https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=800&auto=format&fit=crop"],
    sizes: ["S", "M", "L", "XL"],
    colors: ["Azul", "Gris"],
    stock: 25,
    tags: ["Western", "Camisas"]
  },
  {
    id: "dr-006",
    name: "Bota Ranchera Tabaco",
    slug: "bota-ranchera-tabaco",
    description: "Cuero color tabaco con pátina natural. Comodidad excepcional desde el primer día.",
    price: 165.00,
    category: "Botas",
    images: ["https://images.unsplash.com/photo-1605733513597-a8f8341084e6?q=80&w=800&auto=format&fit=crop"],
    sizes: ["8", "9", "10", "11"],
    colors: ["Tabaco"],
    stock: 10,
    tags: ["Western", "Confort"]
  },
  {
    id: "dr-007",
    name: "Chaqueta Denim Forrada",
    slug: "chaqueta-denim-forrada",
    description: "Forro de lana sintética para los inviernos en el rancho. Exterior de mezclilla pesada.",
    price: 145.00,
    category: "Accesorios",
    images: ["https://images.unsplash.com/photo-1551537482-f2075a1d41f2?q=80&w=800&auto=format&fit=crop"],
    sizes: ["M", "L", "XL"],
    colors: ["Indigo"],
    stock: 12,
    tags: ["Invierno", "Premium"]
  }
];

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

export const PURCHASE_HISTORY: PurchaseHistoryItem[] = [
  { id: 'ph-001', orderId: 'DR-2026-00021', customer: 'María López', status: 'delivered', paymentStatus: 'paid', total: 189.99, purchasedAt: '2026-01-14T10:35:00Z' },
  { id: 'ph-002', orderId: 'DR-2026-00022', customer: 'Javier Ruiz', status: 'shipped', paymentStatus: 'paid', total: 230.00, purchasedAt: '2026-01-15T13:10:00Z' },
  { id: 'ph-003', orderId: 'DR-2026-00023', customer: 'Ana Torres', status: 'cancelled', paymentStatus: 'refunded', total: 145.00, purchasedAt: '2026-01-15T18:45:00Z' },
  { id: 'ph-004', orderId: 'DR-2026-00024', customer: 'Ricardo Pérez', status: 'paid', paymentStatus: 'paid', total: 95.00, purchasedAt: '2026-01-16T09:05:00Z' }
];

export const CANCELLED_PURCHASES: CancelledPurchaseItem[] = [
  { id: 'cp-001', orderId: 'DR-2026-00023', customer: 'Ana Torres', reason: 'Cambio de talla', cancelledAt: '2026-01-15T20:10:00Z', refundAmount: 145.00 },
  { id: 'cp-002', orderId: 'DR-2026-00019', customer: 'Luis Mena', reason: 'Pago duplicado', cancelledAt: '2026-01-13T11:30:00Z', refundAmount: 89.00 }
];

export const PURCHASE_REPORTS: PurchaseReportItem[] = [
  { id: 'pr-day', periodType: 'day', periodLabel: 'Día (Hoy)', totalPurchases: 24, cancelledPurchases: 1, grossSales: 3120.50, netSales: 2975.50 },
  { id: 'pr-week', periodType: 'week', periodLabel: 'Semana actual', totalPurchases: 146, cancelledPurchases: 9, grossSales: 18640.20, netSales: 17310.20 },
  { id: 'pr-month', periodType: 'month', periodLabel: 'Mes actual', totalPurchases: 512, cancelledPurchases: 21, grossSales: 64890.00, netSales: 62120.00 },
  { id: 'pr-bimester', periodType: 'bimester', periodLabel: 'Bimestre actual', totalPurchases: 1004, cancelledPurchases: 39, grossSales: 127880.00, netSales: 122450.00 },
  { id: 'pr-quarter', periodType: 'quarter', periodLabel: 'Trimestre actual', totalPurchases: 1588, cancelledPurchases: 61, grossSales: 201300.00, netSales: 193000.00 },
  { id: 'pr-semester', periodType: 'semester', periodLabel: 'Semestre actual', totalPurchases: 3055, cancelledPurchases: 114, grossSales: 390420.00, netSales: 375760.00 },
  { id: 'pr-year', periodType: 'year', periodLabel: 'Año actual', totalPurchases: 6124, cancelledPurchases: 208, grossSales: 781220.00, netSales: 754500.00 }
];
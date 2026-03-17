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

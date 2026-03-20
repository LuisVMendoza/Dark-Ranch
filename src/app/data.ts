export * from './types';

// Archivo de compatibilidad: los datos ahora viven en SQLite local y se consumen vía /api.
// Se mantienen exportaciones vacías para no romper imports legacy que ya no forman parte del flujo principal.
export const INITIAL_SETTINGS = {
  hero: {
    title: '',
    subtitle: '',
    imageUrl: '',
  },
  banners: [],
  aboutText: '',
  contactEmail: '',
};

export const CATEGORIES: string[] = [];
export const PRODUCTS: never[] = [];
export const PURCHASE_HISTORY: never[] = [];
export const CANCELLED_PURCHASES: never[] = [];
export const PURCHASE_REPORTS: never[] = [];

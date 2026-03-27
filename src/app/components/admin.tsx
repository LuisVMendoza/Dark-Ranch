import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Boxes,
  DollarSign,
  Eye,
  Image as ImageIcon,
  Package,
  Pencil,
  Plus,
  Printer,
  ShieldAlert,
  Save,
  Settings,
  ShieldCheck,
  ShoppingBag,
  LogOut,
  Trash2,
  Upload,
  Users,
  Warehouse,
} from 'lucide-react';
import { Button, PaperCard, cn } from './ui';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import {
  AdminActivityLog,
  AdminCategoryPayload,
  AdminOrder,
  AdminOrderUpdatePayload,
  AdminProductPayload,
  AdminSnapshot,
  AdminUser,
  AdminUserPayload,
  Product,
  StoreSettings,
} from '../types';
import {
  createAdminCategory,
  createAdminProduct,
  createAdminUser,
  deleteAdminCategory,
  deleteAdminOrder,
  deleteAdminProduct,
  deleteAdminUser,
  getAdminSnapshot,
  purgeAdminActivityLogs,
  saveStoreSettings,
  uploadAdminImage,
  deleteAdminImage,
  updateAdminCategory,
  updateAdminOrder,
  updateAdminProduct,
  updateAdminUser,
} from '../lib/api';
import { toast } from 'sonner';

const currency = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'USD' });

type TabKey = 'overview' | 'products' | 'categories' | 'orders' | 'team' | 'activity' | 'storefront';
type DeleteTarget =
  | { entityType: 'product'; entityId: string; entityName: string }
  | { entityType: 'category'; entityId: string; entityName: string }
  | { entityType: 'user'; entityId: number; entityName: string }
  | { entityType: 'order'; entityId: number; entityName: string };

const EMPTY_PRODUCT: AdminProductPayload = {
  id: '',
  name: '',
  slug: '',
  description: '',
  price: 0,
  salePrice: null,
  categoryId: '',
  images: [],
  sizes: ['CH', 'M', 'G'],
  colors: ['Negro', 'Café'],
  tags: ['western', 'cuero'],
  stock: 0,
  isNew: false,
  isFeatured: false,
  isActive: true,
};

const EMPTY_CATEGORY: AdminCategoryPayload = {
  id: '',
  name: '',
  slug: '',
  imageUrl: '',
};

const EMPTY_USER: AdminUserPayload = {
  email: '',
  name: '',
  role: 'admin',
  password: '',
};

const ORDER_STATUS_OPTIONS: AdminOrder['status'][] = ['pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded'];
const PAYMENT_STATUS_OPTIONS: AdminOrder['paymentStatus'][] = ['pending', 'paid', 'failed', 'refunded'];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ['Productos y categorías', 'Órdenes y tienda', 'Usuarios y permisos', 'Bitácora completa'],
  editor: ['Productos y categorías', 'Storefront'],
};

const parseTags = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean);
const serializeList = (list: string[]) => list.join(', ');
const ATTRIBUTE_DEFAULTS = {
  sizes: ['CH', 'M', 'G', 'EG', '28', '30', '32', '34'],
  colors: ['Negro', 'Café', 'Miel', 'Azul mezclilla', 'Arena', 'Vino'],
  tags: ['western', 'cuero', 'artesanal', 'edición limitada', 'nuevo ingreso', 'bestseller'],
} as const;
type AttributeFieldKey = keyof typeof ATTRIBUTE_DEFAULTS;
const statCardClass = 'bg-white border-2 border-black p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]';
const INPUT_CLASS = 'w-full border-2 border-black bg-white px-3 py-3 outline-none focus:bg-[#fffdfa]';
const generateSlug = (value: string) => value
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim()
  .replace(/\s+/g, '_')
  .replace(/[^a-z0-9_]/g, '')
  .replace(/_+/g, '_')
  .replace(/^_+|_+$/g, '');
const generateProductSlug = generateSlug;
const generateCategorySlug = generateSlug;

const statusBadgeClassMap: Record<AdminOrder['status'], string> = {
  pending: 'border-[#b7791f] bg-[#fff7e6] text-[#8a5a12]',
  paid: 'border-[#2563eb] bg-[#eff6ff] text-[#1d4ed8]',
  shipped: 'border-[#7c3aed] bg-[#f5f3ff] text-[#6d28d9]',
  delivered: 'border-[#15803d] bg-[#f0fdf4] text-[#166534]',
  cancelled: 'border-[#b91c1c] bg-[#fef2f2] text-[#991b1b]',
  refunded: 'border-[#374151] bg-[#f3f4f6] text-[#1f2937]',
};

const paymentBadgeClassMap: Record<AdminOrder['paymentStatus'], string> = {
  pending: 'border-[#b7791f] bg-[#fff7e6] text-[#8a5a12]',
  paid: 'border-[#15803d] bg-[#f0fdf4] text-[#166534]',
  failed: 'border-[#b91c1c] bg-[#fef2f2] text-[#991b1b]',
  refunded: 'border-[#374151] bg-[#f3f4f6] text-[#1f2937]',
};

const humanizeAction = (action: string) => {
  const labels: Record<string, string> = {
    login: 'Inicio de sesión',
    create: 'Alta',
    update: 'Edición',
    delete: 'Eliminación',
    settings_update: 'Ajustes',
    order_update: 'Actualización de orden',
    order_delete: 'Eliminación de orden',
    order_create: 'Nueva orden',
  };

  return labels[action] || action;
};

const humanizeEntity = (entityType: string) => {
  const labels: Record<string, string> = {
    product: 'Producto',
    category: 'Categoría',
    user: 'Usuario admin',
    order: 'Orden',
    settings: 'Storefront',
    auth: 'Acceso',
  };

  return labels[entityType] || entityType;
};

const getPermissionsForRole = (role: string) => ROLE_PERMISSIONS[role] || ['Acceso básico'];
const formatOrderStatus = (status: AdminOrder['status']) => ({
  pending: 'Pendiente',
  paid: 'Pagada',
  shipped: 'Enviada',
  delivered: 'Entregada',
  cancelled: 'Cancelada',
  refunded: 'Reembolsada',
}[status]);
const formatPaymentStatus = (status: AdminOrder['paymentStatus']) => ({
  pending: 'Pendiente',
  paid: 'Pagado',
  failed: 'Fallido',
  refunded: 'Reembolsado',
}[status]);
const renderBadge = (label: string, className: string) => (
  <span className={cn('inline-flex items-center border px-2.5 py-1 text-[11px] font-header font-black uppercase tracking-[0.18em]', className)}>
    {label}
  </span>
);

const uploadImageToStorage = async (file: File, folder: string) => {
  return uploadAdminImage(file, folder);
};

const deleteImageFromStorage = async (imageUrl: string) => {
  await deleteAdminImage(imageUrl);
};

export const AdminDashboard = ({
  initialSnapshot,
  onSnapshotUpdated,
  currentAdminUser,
  onExit,
  onLogout,
}: {
  initialSnapshot: AdminSnapshot;
  onSnapshotUpdated: (snapshot: AdminSnapshot) => void;
  currentAdminUser: AdminUser | null;
  onExit: () => void;
  onLogout: () => void;
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [snapshot, setSnapshot] = useState<AdminSnapshot>(initialSnapshot);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');

  const [productForm, setProductForm] = useState<AdminProductPayload>(EMPTY_PRODUCT);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  const [categoryForm, setCategoryForm] = useState<AdminCategoryPayload>(EMPTY_CATEGORY);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const [userForm, setUserForm] = useState<AdminUserPayload>(EMPTY_USER);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [settingsForm, setSettingsForm] = useState<StoreSettings>(initialSnapshot.settings);
  const [orderDrafts, setOrderDrafts] = useState<Record<number, AdminOrderUpdatePayload>>({});
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(initialSnapshot.orders[0]?.id ?? null);
  const [activityDateFilter, setActivityDateFilter] = useState<'today' | '7d' | '30d' | 'all'>('today');
  const [activityActionFilter, setActivityActionFilter] = useState('all');
  const [activityEntityFilter, setActivityEntityFilter] = useState('all');
  const [activityPageSize, setActivityPageSize] = useState(25);
  const [activityPage, setActivityPage] = useState(1);
  const [isActivityCleanupModalOpen, setIsActivityCleanupModalOpen] = useState(false);
  const [isPurgingLogs, setIsPurgingLogs] = useState(false);
  const currentRole = currentAdminUser?.role || 'guest';
  const canManageTeam = currentRole === 'admin';
  const canViewActivityLog = currentRole === 'admin';

  useEffect(() => {
    setSnapshot(initialSnapshot);
    setSettingsForm(initialSnapshot.settings);
    setSelectedOrderId(initialSnapshot.orders[0]?.id ?? null);
  }, [initialSnapshot]);

  useEffect(() => {
    void refreshSnapshot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!productForm.categoryId && snapshot.categories[0]) {
      setProductForm((current) => ({ ...current, categoryId: snapshot.categories[0].id }));
    }
  }, [snapshot.categories, productForm.categoryId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const rawConfig = window.localStorage.getItem('dark-ranch-activity-config');
    if (!rawConfig) return;

    try {
      const parsed = JSON.parse(rawConfig) as {
        dateFilter?: 'today' | '7d' | '30d' | 'all';
        actionFilter?: string;
        entityFilter?: string;
        pageSize?: number;
      };

      if (parsed.dateFilter) setActivityDateFilter(parsed.dateFilter);
      if (parsed.actionFilter) setActivityActionFilter(parsed.actionFilter);
      if (parsed.entityFilter) setActivityEntityFilter(parsed.entityFilter);
      if (parsed.pageSize && Number.isFinite(parsed.pageSize)) setActivityPageSize(Math.max(10, Math.min(200, parsed.pageSize)));
    } catch {
      // ignorar config corrupta
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('dark-ranch-activity-config', JSON.stringify({
      dateFilter: activityDateFilter,
      actionFilter: activityActionFilter,
      entityFilter: activityEntityFilter,
      pageSize: activityPageSize,
    }));
  }, [activityActionFilter, activityDateFilter, activityEntityFilter, activityPageSize]);

  const refreshSnapshot = async (successMessage?: string) => {
    setIsRefreshing(true);
    try {
      const next = await getAdminSnapshot();
      setSnapshot(next);
      setSettingsForm(next.settings);
      setOrderDrafts({});
      setSelectedOrderId((current) => next.orders.some((order) => order.id === current) ? current : next.orders[0]?.id ?? null);
      onSnapshotUpdated(next);
      if (successMessage) toast.success(successMessage);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo recargar el panel');
    } finally {
      setIsRefreshing(false);
    }
  };

  const runActivityPurge = async ({ silent = false }: { silent?: boolean } = {}) => {
    if (isPurgingLogs) return;

    setIsPurgingLogs(true);
    try {
      const result = await purgeAdminActivityLogs(3);
      if (result.deleted > 0) {
        await refreshSnapshot();
        if (!silent) {
          toast.success(`${result.deleted} movimiento(s) eliminado(s) por política de retención.`);
        }
      } else if (!silent) {
        toast.message('No hubo movimientos para depurar en los últimos 3 meses.');
      }
    } catch (error) {
      if (!silent) toast.error(error instanceof Error ? error.message : 'No se pudo depurar la bitácora');
    } finally {
      setIsPurgingLogs(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'activity') return;
    void runActivityPurge({ silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const productMetrics = useMemo(() => {
    const activeProducts = snapshot.products.filter((product) => product.isActive !== false);
    const featured = snapshot.products.filter((product) => product.isFeatured);
    const totalStock = activeProducts.reduce((sum, product) => sum + product.stock, 0);
    const categories = new Set(activeProducts.map((product) => product.category)).size;
    const pendingOrders = snapshot.orders.filter((order) => ['pending', 'paid', 'shipped'].includes(order.status)).length;

    return {
      activeProducts: activeProducts.length,
      featured: featured.length,
      totalStock,
      categories,
      pendingOrders,
    };
  }, [snapshot]);

  const topProducts = useMemo(() => {
    const orderVolumes = new Map<string, number>();
    snapshot.orders.forEach((order) => {
      order.items.forEach((item) => {
        orderVolumes.set(item.productId, (orderVolumes.get(item.productId) || 0) + item.quantity);
      });
    });

    return [...snapshot.products]
      .map((product) => ({ ...product, sold: orderVolumes.get(product.id) || 0 }))
      .sort((a, b) => b.sold - a.sold || b.stock - a.stock)
      .slice(0, 5);
  }, [snapshot]);

  const lowStockProducts = useMemo(
    () => snapshot.products.filter((product) => product.isActive !== false).sort((a, b) => a.stock - b.stock).slice(0, 6),
    [snapshot],
  );
  const existingAttributeOptions = useMemo<Record<AttributeFieldKey, string[]>>(() => {
    const collectUnique = (field: AttributeFieldKey) => {
      const seen = new Set<string>();

      snapshot.products.forEach((product) => {
        product[field].forEach((item) => {
          const normalized = item.trim();
          if (normalized) seen.add(normalized);
        });
      });

      ATTRIBUTE_DEFAULTS[field].forEach((item) => seen.add(item));

      return [...seen].sort((left, right) => left.localeCompare(right, 'es', { sensitivity: 'base' }));
    };

    return {
      sizes: collectUnique('sizes'),
      colors: collectUnique('colors'),
      tags: collectUnique('tags'),
    };
  }, [snapshot.products]);

  const filteredProducts = useMemo(() => {
    const search = productSearchTerm.trim().toLowerCase();

    return snapshot.products.filter((product) => {
      const matchesCategory = productCategoryFilter === 'all'
        || product.categoryId === productCategoryFilter
        || product.category === snapshot.categories.find((category) => category.id === productCategoryFilter)?.name;

      if (!matchesCategory) return false;
      if (!search) return true;

      return [
        product.name,
        product.id,
        product.category,
        product.slug,
        ...(product.tags ?? []),
      ]
        .join(' ')
        .toLowerCase()
        .includes(search);
    });
  }, [productCategoryFilter, productSearchTerm, snapshot.categories, snapshot.products]);

  const activityActionOptions = useMemo(
    () => [...new Set(snapshot.activityLogs.map((item) => item.action))].sort((left, right) => left.localeCompare(right)),
    [snapshot.activityLogs],
  );
  const activityEntityOptions = useMemo(
    () => [...new Set(snapshot.activityLogs.map((item) => item.entityType))].sort((left, right) => left.localeCompare(right)),
    [snapshot.activityLogs],
  );
  const activityTodayCount = useMemo(() => {
    const now = new Date();
    return snapshot.activityLogs.filter((item) => {
      const date = new Date(item.createdAt);
      return date.getFullYear() === now.getFullYear()
        && date.getMonth() === now.getMonth()
        && date.getDate() === now.getDate();
    }).length;
  }, [snapshot.activityLogs]);
  const filteredActivityLogs = useMemo(() => {
    const now = new Date();
    const dateThreshold = activityDateFilter === 'all'
      ? null
      : new Date(now.getTime() - (
        activityDateFilter === 'today' ? 24 * 60 * 60 * 1000 : activityDateFilter === '7d' ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000
      ));

    return snapshot.activityLogs.filter((item) => {
      if (activityActionFilter !== 'all' && item.action !== activityActionFilter) return false;
      if (activityEntityFilter !== 'all' && item.entityType !== activityEntityFilter) return false;
      if (dateThreshold && new Date(item.createdAt).getTime() < dateThreshold.getTime()) return false;
      return true;
    });
  }, [activityActionFilter, activityDateFilter, activityEntityFilter, snapshot.activityLogs]);
  const totalActivityPages = Math.max(1, Math.ceil(filteredActivityLogs.length / activityPageSize));
  const paginatedActivityLogs = useMemo(() => {
    const start = (activityPage - 1) * activityPageSize;
    return filteredActivityLogs.slice(start, start + activityPageSize);
  }, [activityPage, activityPageSize, filteredActivityLogs]);

  const recentOrders = useMemo(() => snapshot.orders.slice(0, 6), [snapshot]);
  const selectedOrder = useMemo(
    () => snapshot.orders.find((order) => order.id === selectedOrderId) ?? snapshot.orders[0] ?? null,
    [selectedOrderId, snapshot.orders],
  );

  useEffect(() => {
    setActivityPage(1);
  }, [activityActionFilter, activityDateFilter, activityEntityFilter, activityPageSize]);

  useEffect(() => {
    if (activeTab === 'activity' && !canViewActivityLog) {
      setActiveTab('overview');
    }
  }, [activeTab, canViewActivityLog]);

  useEffect(() => {
    setActivityPage((current) => Math.min(current, totalActivityPages));
  }, [totalActivityPages]);

  const resetProductForm = () => {
    setEditingProductId(null);
    setProductForm({ ...EMPTY_PRODUCT, categoryId: snapshot.categories[0]?.id ?? '' });
  };

  const openNewProductModal = () => {
    resetProductForm();
    setIsProductModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setActiveTab('products');
    setEditingProductId(product.id);
    setProductForm({
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      salePrice: product.salePrice ?? null,
      categoryId: product.categoryId || snapshot.categories.find((category) => category.name === product.category)?.id || '',
      images: product.images.length ? product.images : [''],
      sizes: product.sizes,
      colors: product.colors,
      tags: product.tags,
      stock: product.stock,
      isNew: Boolean(product.isNew),
      isFeatured: Boolean(product.isFeatured),
      isActive: product.isActive !== false,
    });
    setIsProductModalOpen(true);
  };

  const closeProductModal = () => {
    setIsProductModalOpen(false);
    resetProductForm();
  };

  const resetCategoryForm = () => {
    setEditingCategoryId(null);
    setCategoryForm(EMPTY_CATEGORY);
  };

  const openNewCategoryModal = () => {
    resetCategoryForm();
    setIsCategoryModalOpen(true);
  };

  const openEditCategoryModal = (category: AdminSnapshot['categories'][number]) => {
    setEditingCategoryId(category.id);
    setCategoryForm(category);
    setIsCategoryModalOpen(true);
  };

  const closeCategoryModal = () => {
    setIsCategoryModalOpen(false);
    resetCategoryForm();
  };

  const resetUserForm = () => {
    setEditingUserId(null);
    setUserForm(EMPTY_USER);
  };

  const openNewUserModal = () => {
    if (!canManageTeam) {
      toast.error('Solo un admin puede editar permisos del equipo.');
      return;
    }
    resetUserForm();
    setIsUserModalOpen(true);
  };

  const openEditUserModal = (user: AdminUser) => {
    if (!canManageTeam) {
      toast.error('Solo un admin puede editar permisos del equipo.');
      return;
    }
    setEditingUserId(user.id);
    setUserForm({ email: user.email, name: user.name, role: user.role, password: '' });
    setIsUserModalOpen(true);
  };

  const closeUserModal = () => {
    setIsUserModalOpen(false);
    resetUserForm();
  };

  const handleProductSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const payload: AdminProductPayload = {
        ...productForm,
        images: productForm.images.filter(Boolean),
      };
      if (editingProductId) {
        await updateAdminProduct(editingProductId, payload);
        toast.success('Producto actualizado');
      } else {
        await createAdminProduct(payload);
        toast.success('Producto creado');
      }
      closeProductModal();
      await refreshSnapshot();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar el producto');
    }
  };

  const handleCategorySubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      if (editingCategoryId) {
        await updateAdminCategory(editingCategoryId, categoryForm);
        toast.success('Categoría actualizada');
      } else {
        await createAdminCategory(categoryForm);
        toast.success('Categoría creada');
      }
      closeCategoryModal();
      await refreshSnapshot();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar la categoría');
    }
  };

  const handleUserSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canManageTeam) {
      toast.error('Solo un admin puede editar permisos del equipo.');
      return;
    }
    try {
      if (editingUserId) {
        await updateAdminUser(editingUserId, userForm);
        toast.success('Administrador actualizado');
      } else {
        await createAdminUser(userForm);
        toast.success('Administrador creado');
      }
      closeUserModal();
      await refreshSnapshot();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar el administrador');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.entityType === 'user') {
      if (!canManageTeam) {
        toast.error('Solo un admin puede eliminar cuentas del equipo.');
        return;
      }
      if (currentAdminUser?.id === deleteTarget.entityId) {
        toast.error('No puedes eliminar tu propia cuenta activa.');
        return;
      }
    }

    setIsDeleting(true);
    try {
      if (deleteTarget.entityType === 'product') {
        await deleteAdminProduct(deleteTarget.entityId);
        if (editingProductId === deleteTarget.entityId) resetProductForm();
        toast.success('Producto eliminado');
      }

      if (deleteTarget.entityType === 'category') {
        await deleteAdminCategory(deleteTarget.entityId);
        if (editingCategoryId === deleteTarget.entityId) resetCategoryForm();
        toast.success('Categoría eliminada');
      }

      if (deleteTarget.entityType === 'user') {
        await deleteAdminUser(deleteTarget.entityId);
        if (editingUserId === deleteTarget.entityId) resetUserForm();
        toast.success('Administrador eliminado');
      }

      if (deleteTarget.entityType === 'order') {
        await deleteAdminOrder(deleteTarget.entityId);
        toast.success('Orden eliminada');
      }

      setDeleteTarget(null);
      await refreshSnapshot();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo eliminar el registro');
    } finally {
      setIsDeleting(false);
    }
  };

  const printShippingLabel = (order: AdminOrder) => {
    if (typeof window === 'undefined') return;

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      toast.error('No se pudo abrir la ventana de impresión.');
      return;
    }

    const itemLines = order.items
      .map((item) => `${item.productName} x ${item.quantity}${item.selectedSize ? ` · Talla ${item.selectedSize}` : ''}${item.selectedColor ? ` · Color ${item.selectedColor}` : ''}`)
      .join('<br />');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="UTF-8" />
          <title>Etiqueta ${order.orderNumber}</title>
          <style>
            * { box-sizing: border-box; }
            body {
              margin: 0;
              font-family: Arial, sans-serif;
              color: #111;
              background: #fff;
            }
            .sheet {
              width: 102mm;
              min-height: 152mm;
              margin: 0 auto;
              padding: 12mm 10mm;
              border: 2px solid #111;
              display: grid;
              gap: 10px;
            }
            .brand, .section-title, .meta-label {
              text-transform: uppercase;
              letter-spacing: 0.18em;
              font-size: 10px;
              font-weight: 700;
            }
            .order-number {
              font-size: 22px;
              font-weight: 700;
              margin: 4px 0 0;
            }
            .recipient {
              font-size: 24px;
              font-weight: 700;
              line-height: 1.15;
              margin: 0;
            }
            .address {
              font-size: 18px;
              line-height: 1.4;
              margin: 0;
            }
            .box {
              border: 1.5px solid #111;
              padding: 10px;
            }
            .grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 8px;
            }
            .meta-value {
              font-size: 15px;
              font-weight: 700;
              margin-top: 4px;
            }
            .items {
              font-size: 13px;
              line-height: 1.5;
            }
            @media print {
              body { padding: 0; }
              .sheet { border-width: 2px; }
            }
          </style>
        </head>
        <body>
          <main class="sheet">
            <section>
              <div class="brand">Dark Ranch · Etiqueta de envío</div>
              <p class="order-number">${order.orderNumber}</p>
            </section>

            <section class="box">
              <div class="section-title">Destinatario</div>
              <p class="recipient">${order.customerName}</p>
              <p class="address">${order.address}<br />${order.city}, ${order.zip}</p>
            </section>

            <section class="grid">
              <div class="box">
                <div class="meta-label">Estatus orden</div>
                <div class="meta-value">${formatOrderStatus(order.status)}</div>
              </div>
              <div class="box">
                <div class="meta-label">Pago</div>
                <div class="meta-value">${formatPaymentStatus(order.paymentStatus)}</div>
              </div>
              <div class="box">
                <div class="meta-label">Correo</div>
                <div class="meta-value">${order.customerEmail}</div>
              </div>
              <div class="box">
                <div class="meta-label">Total</div>
                <div class="meta-value">${currency.format(order.total)}</div>
              </div>
            </section>

            <section class="box">
              <div class="section-title">Contenido</div>
              <div class="items">${itemLines}</div>
            </section>

            <section class="box">
              <div class="meta-label">Preparado</div>
              <div style="height: 48px; border-bottom: 1px solid #111; margin-top: 12px;"></div>
            </section>
          </main>
          <script>
            window.onload = () => {
              window.print();
              window.onafterprint = () => window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const selectedOrderDraft = selectedOrder
    ? orderDrafts[selectedOrder.id] || {
      status: selectedOrder.status,
      paymentStatus: selectedOrder.paymentStatus,
      cancellationReason: selectedOrder.cancellationReason || '',
      refundAmount: selectedOrder.refundAmount ?? null,
    }
    : null;

  const saveOrder = async (orderId: number) => {
    const draft = orderDrafts[orderId];
    if (!draft) return;
    try {
      await updateAdminOrder(orderId, draft);
      toast.success('Orden actualizada');
      await refreshSnapshot();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo actualizar la orden');
    }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const response = await saveStoreSettings(settingsForm);
      setSettingsForm(response.settings);
      toast.success('Settings actualizados');
      await refreshSnapshot();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudieron guardar los ajustes');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const tabs: Array<{ key: TabKey; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = [
    { key: 'overview', label: 'Dashboard', icon: Warehouse },
    { key: 'products', label: 'Productos', icon: Package },
    { key: 'categories', label: 'Categorías', icon: Boxes },
    { key: 'orders', label: 'Órdenes', icon: ShoppingBag },
    { key: 'team', label: 'Admin', icon: Users },
    ...(canViewActivityLog ? [{ key: 'activity' as TabKey, label: 'Bitácora', icon: ShieldCheck }] : []),
    { key: 'storefront', label: 'Storefront', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#f7f2eb] pt-24 pb-20">
      <div className="container mx-auto px-6 space-y-8">
        <div className="flex flex-col xl:flex-row xl:items-start gap-6 xl:gap-8">
          <aside className="xl:w-72 space-y-4">
            <div className="bg-[#1f130b] text-white border-2 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <p className="font-header uppercase text-xs tracking-[0.3em] text-[#d4c5b3]">Dark Ranch Admin</p>
              <h1 className="font-western text-4xl uppercase mt-3">Centro de mando</h1>
              <p className="text-sm text-white/70 mt-4 leading-relaxed">CRUD completo, modales consistentes, permisos visibles y bitácora por cuenta.</p>
              {currentAdminUser && (
                <div className="mt-5 border border-white/20 bg-white/5 p-3 text-xs uppercase tracking-[0.15em]">
                  <p className="text-[#d4c5b3]">Sesión activa</p>
                  <p className="mt-2 font-header font-black text-sm text-white">{currentAdminUser.name}</p>
                  <p className="mt-1 normal-case tracking-normal text-white/70">{currentAdminUser.email}</p>
                </div>
              )}
              <Button className="mt-6 w-full justify-center" variant="secondary" onClick={() => refreshSnapshot('Panel sincronizado')} disabled={isRefreshing}>
                {isRefreshing ? 'Sincronizando…' : 'Refrescar datos'}
              </Button>
              <Button className="mt-3 w-full justify-center" variant="outline" onClick={onExit}>
                <ArrowLeft size={16} className="mr-2" /> Volver a la tienda
              </Button>
              <Button className="mt-3 w-full justify-center" variant="outline" onClick={onLogout}>
                <LogOut size={16} className="mr-2" /> Cerrar sesión
              </Button>
            </div>

            <div className="bg-white border-2 border-black p-3 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-2">
              {tabs.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 text-left uppercase font-header text-xs font-black tracking-[0.2em] border-2 transition-colors',
                    activeTab === key ? 'bg-black text-white border-black' : 'bg-[#fcf9f5] text-black border-transparent hover:border-black',
                  )}
                >
                  <Icon size={18} />
                  {label}
                </button>
              ))}
            </div>
          </aside>

          <main className="flex-1 space-y-8">
            <section className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <p className="font-header uppercase text-xs tracking-[0.25em] text-[#8c6844]">Sección de administración</p>
                <h2 className="font-western uppercase text-4xl">Control total del rancho</h2>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={onExit}>
                  <ArrowLeft size={16} className="mr-2" /> Regresar a página principal
                </Button>
                <Button variant="outline" onClick={onLogout}>
                  <LogOut size={16} className="mr-2" /> Cerrar sesión
                </Button>
                <Button onClick={() => refreshSnapshot('Panel sincronizado')} disabled={isRefreshing}>
                  {isRefreshing ? 'Sincronizando…' : 'Actualizar panel'}
                </Button>
              </div>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
              {[
                { label: 'Ventas', value: currency.format(Number(snapshot.dashboard.stats.totalSales)), icon: DollarSign },
                { label: 'Órdenes hoy', value: String(snapshot.dashboard.stats.ordersToday), icon: ShoppingBag },
                { label: 'Productos activos', value: String(productMetrics.activeProducts), icon: Package },
                { label: 'Stock bajo', value: String(snapshot.dashboard.stats.lowStock), icon: AlertCircle },
                { label: 'Admins', value: String(snapshot.adminUsers.length), icon: Users },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className={statCardClass}>
                  <div className="flex items-center justify-between mb-4">
                    <Icon size={20} />
                    <span className="font-header uppercase text-[10px] tracking-[0.3em] text-neutral-400">live</span>
                  </div>
                  <p className="font-header uppercase text-[11px] tracking-[0.2em] text-neutral-500">{label}</p>
                  <p className="text-3xl font-header font-black mt-2">{value}</p>
                </div>
              ))}
            </section>

            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 2xl:grid-cols-[1.4fr_1fr] gap-8">
                <div className="space-y-8">
                  <PaperCard>
                    <div className="flex items-center justify-between gap-4 mb-6">
                      <div>
                        <p className="font-header uppercase text-xs tracking-[0.25em] text-[#C4A484]">Resumen operativo</p>
                        <h2 className="font-western uppercase text-3xl">Qué requiere atención</h2>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="border-2 border-black bg-white p-4">
                        <p className="text-xs font-header uppercase text-neutral-500">Stock total</p>
                        <p className="text-3xl font-header font-black mt-2">{productMetrics.totalStock}</p>
                      </div>
                      <div className="border-2 border-black bg-white p-4">
                        <p className="text-xs font-header uppercase text-neutral-500">Pedidos en proceso</p>
                        <p className="text-3xl font-header font-black mt-2">{productMetrics.pendingOrders}</p>
                      </div>
                      <div className="border-2 border-black bg-white p-4">
                        <p className="text-xs font-header uppercase text-neutral-500">Productos destacados</p>
                        <p className="text-3xl font-header font-black mt-2">{productMetrics.featured}</p>
                      </div>
                    </div>
                  </PaperCard>

                  <PaperCard>
                    <div className="flex items-center justify-between gap-4 mb-6">
                      <div>
                        <p className="font-header uppercase text-xs tracking-[0.25em] text-[#C4A484]">Top productos</p>
                        <h2 className="font-western uppercase text-3xl">Más movimiento</h2>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => setActiveTab('products')}>Ver catálogo</Button>
                    </div>
                    <div className="space-y-3">
                      {topProducts.map((product) => (
                        <div key={product.id} className="grid grid-cols-[1.3fr_auto_auto] gap-3 border-2 border-black bg-white p-4 items-center">
                          <div>
                            <p className="font-header font-black uppercase text-sm">{product.name}</p>
                            <p className="text-xs text-neutral-500 uppercase tracking-[0.2em]">{product.category}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-neutral-500 uppercase">Vendidos</p>
                            <p className="font-header font-black">{product.sold}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-neutral-500 uppercase">Stock</p>
                            <p className="font-header font-black">{product.stock}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </PaperCard>
                </div>

                <div className="space-y-8">
                  <PaperCard>
                    <div className="flex items-center justify-between gap-4 mb-6">
                      <div>
                        <p className="font-header uppercase text-xs tracking-[0.25em] text-[#C4A484]">Alertas</p>
                        <h2 className="font-western uppercase text-3xl">Stock bajo</h2>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {lowStockProducts.map((product) => (
                        <button key={product.id} onClick={() => handleEditProduct(product)} className="w-full text-left border-2 border-black bg-white p-4 hover:bg-neutral-50 transition-colors">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-header font-black uppercase text-sm">{product.name}</p>
                              <p className="text-xs text-neutral-500 uppercase tracking-[0.2em]">{product.category}</p>
                            </div>
                            <span className={cn('px-3 py-1 text-xs uppercase font-black border-2', product.stock <= 3 ? 'border-red-600 text-red-600' : 'border-amber-500 text-amber-600')}>
                              {product.stock} en stock
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </PaperCard>

                  <PaperCard>
                    <div className="flex items-center justify-between gap-4 mb-6">
                      <div>
                        <p className="font-header uppercase text-xs tracking-[0.25em] text-[#C4A484]">Últimos movimientos</p>
                        <h2 className="font-western uppercase text-3xl">Bitácora reciente</h2>
                      </div>
                      {canViewActivityLog && (
                        <Button size="sm" variant="outline" onClick={() => setActiveTab('activity')}>Abrir bitácora</Button>
                      )}
                    </div>
                    <div className="space-y-3">
                      {snapshot.activityLogs.slice(0, 5).map((item) => (
                        <div key={String(item.id)} className="border-2 border-black bg-white p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-header font-black uppercase text-sm">{item.actorName}</p>
                              <p className="text-sm text-neutral-600">{humanizeAction(item.action)} · {humanizeEntity(item.entityType)}</p>
                              <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 mt-2">{item.entityName}</p>
                            </div>
                            <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">{new Date(item.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </PaperCard>
                </div>
              </div>
            )}

            {activeTab === 'products' && (
              <PaperCard>
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div>
                    <p className="font-header uppercase text-xs tracking-[0.25em] text-[#C4A484]">Catálogo</p>
                    <h2 className="font-western uppercase text-3xl">Productos</h2>
                  </div>
                  <Button size="sm" onClick={openNewProductModal}><Plus size={16} className="mr-2" /> Nuevo</Button>
                </div>
                <div className="mb-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_240px_auto]">
                  <input
                    type="search"
                    value={productSearchTerm}
                    onChange={(event) => setProductSearchTerm(event.target.value)}
                    placeholder="Buscar por nombre, ID, slug, etiqueta..."
                    className={INPUT_CLASS}
                  />
                  <select
                    value={productCategoryFilter}
                    onChange={(event) => setProductCategoryFilter(event.target.value)}
                    className={INPUT_CLASS}
                  >
                    <option value="all">Todas las categorías</option>
                    {snapshot.categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setProductSearchTerm('');
                      setProductCategoryFilter('all');
                    }}
                    disabled={!productSearchTerm && productCategoryFilter === 'all'}
                  >
                    Limpiar filtros
                  </Button>
                </div>
                <div className="overflow-x-auto border-2 border-black bg-white">
                  <table className="w-full text-left min-w-[940px]">
                    <thead className="bg-neutral-100 border-b-2 border-black font-header uppercase text-[10px] tracking-[0.2em]">
                      <tr>
                        <th className="px-4 py-3">Producto</th>
                        <th className="px-4 py-3">Categoría</th>
                        <th className="px-4 py-3">Precio</th>
                        <th className="px-4 py-3">Stock</th>
                        <th className="px-4 py-3">Flags</th>
                        <th className="px-4 py-3">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {filteredProducts.map((product) => (
                        <tr key={product.id}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <img src={product.images[0]} alt={product.name} className="h-12 w-12 object-cover border border-black bg-neutral-100" />
                              <div>
                                <p className="font-header font-black uppercase text-sm">{product.name}</p>
                                <p className="text-[11px] text-neutral-500">{product.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">{product.category}</td>
                          <td className="px-4 py-3">{currency.format(product.salePrice ?? product.price)}</td>
                          <td className="px-4 py-3">{product.stock}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              <FlagBadge label={product.isNew ? 'Nuevo' : 'No nuevo'} active={Boolean(product.isNew)} />
                              <FlagBadge label={product.isFeatured ? 'Destacado' : 'No destacado'} active={Boolean(product.isFeatured)} />
                              <FlagBadge label={product.isActive !== false ? 'Activo' : 'Oculto'} active={product.isActive !== false} />
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleEditProduct(product)}><Pencil size={14} className="mr-2" /> Editar</Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setDeleteTarget({ entityType: 'product', entityId: product.id, entityName: product.name })}
                              >
                                <Trash2 size={14} className="mr-2" /> Eliminar
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredProducts.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-10 text-center text-sm text-neutral-600">
                            No hay productos que coincidan con los filtros seleccionados.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </PaperCard>
            )}

            {activeTab === 'categories' && (
              <PaperCard>
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div>
                    <p className="font-header uppercase text-xs tracking-[0.25em] text-[#C4A484]">Navegación</p>
                    <h2 className="font-western uppercase text-3xl">CRUD de categorías</h2>
                  </div>
                  <Button size="sm" onClick={openNewCategoryModal}><Plus size={16} className="mr-2" /> Nueva</Button>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {snapshot.categories.map((category) => {
                    const productsInCategory = snapshot.products.filter((product) => product.categoryId === category.id || product.category === category.name).length;
                    return (
                      <div key={category.id} className="border-2 border-black bg-white overflow-hidden">
                        <img src={category.imageUrl} alt={category.name} className="h-40 w-full object-cover border-b-2 border-black" />
                        <div className="p-4 space-y-3">
                          <div>
                            <p className="font-header font-black uppercase text-lg">{category.name}</p>
                            <p className="text-xs text-neutral-500 uppercase tracking-[0.2em]">{category.id} · {category.slug}</p>
                          </div>
                          <p className="text-sm text-neutral-600">{productsInCategory} producto(s) asociados.</p>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => openEditCategoryModal(category)}>Editar</Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setDeleteTarget({ entityType: 'category', entityId: category.id, entityName: category.name })}
                            >
                              Eliminar
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </PaperCard>
            )}

            {activeTab === 'orders' && (
              <PaperCard>
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div>
                    <p className="font-header uppercase text-xs tracking-[0.25em] text-[#C4A484]">Postventa</p>
                    <h2 className="font-western uppercase text-3xl">Gestión de órdenes</h2>
                  </div>
                  <div className="text-right">
                    <p className="font-header uppercase text-xs tracking-[0.2em] text-neutral-500">Órdenes registradas</p>
                    <p className="font-header font-black text-2xl">{snapshot.orders.length}</p>
                  </div>
                </div>
                <div className="space-y-5">
                  {snapshot.orders.length === 0 ? (
                    <div className="border-2 border-dashed border-black bg-white p-8 text-center">
                      <p className="font-header font-black uppercase text-lg">Sin órdenes registradas</p>
                      <p className="mt-2 text-sm text-neutral-600">Cuando se generen compras aparecerán aquí para seguimiento y postventa.</p>
                    </div>
                  ) : (
                    <>
                      <div className="overflow-hidden border-2 border-black bg-white">
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead className="bg-[#1f130b] text-white">
                              <tr className="text-left">
                                <th className="px-4 py-3 font-header uppercase tracking-[0.2em]">Orden</th>
                                <th className="px-4 py-3 font-header uppercase tracking-[0.2em]">Cliente</th>
                                <th className="px-4 py-3 font-header uppercase tracking-[0.2em]">Estatus</th>
                                <th className="px-4 py-3 font-header uppercase tracking-[0.2em]">Pago</th>
                                <th className="px-4 py-3 font-header uppercase tracking-[0.2em]">Fecha</th>
                                <th className="px-4 py-3 font-header uppercase tracking-[0.2em] text-right">Total</th>
                                <th className="px-4 py-3 font-header uppercase tracking-[0.2em] text-right">Acciones</th>
                              </tr>
                            </thead>
                            <tbody>
                              {snapshot.orders.map((order) => (
                                <tr
                                  key={order.id}
                                  className={cn(
                                    'border-t-2 border-black align-top transition-colors',
                                    selectedOrder?.id === order.id ? 'bg-[#f4eadf]' : 'bg-white hover:bg-[#fcf9f5]',
                                  )}
                                >
                                  <td className="px-4 py-4">
                                    <p className="font-header font-black">{order.orderNumber}</p>
                                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-neutral-500">{order.items.length} artículo(s)</p>
                                  </td>
                                  <td className="px-4 py-4">
                                    <p className="font-medium text-neutral-900">{order.customerName}</p>
                                    <p className="mt-1 text-neutral-600">{order.customerEmail}</p>
                                    <p className="mt-1 text-xs text-neutral-500">{order.city}, {order.zip}</p>
                                  </td>
                                  <td className="px-4 py-4">{renderBadge(formatOrderStatus(order.status), statusBadgeClassMap[order.status])}</td>
                                  <td className="px-4 py-4">{renderBadge(formatPaymentStatus(order.paymentStatus), paymentBadgeClassMap[order.paymentStatus])}</td>
                                  <td className="px-4 py-4 text-neutral-700">{new Date(order.createdAt).toLocaleString()}</td>
                                  <td className="px-4 py-4 text-right font-header font-black">{currency.format(order.total)}</td>
                                  <td className="px-4 py-4">
                                    <div className="flex flex-wrap justify-end gap-2">
                                      <Button size="sm" variant="outline" onClick={() => setSelectedOrderId(order.id)}>
                                        <Eye size={14} className="mr-2" /> Ver
                                      </Button>
                                      <Button size="sm" variant="outline" onClick={() => printShippingLabel(order)}>
                                        <Printer size={14} className="mr-2" /> Imprimir
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {selectedOrder && selectedOrderDraft && (
                        <div className="border-2 border-black bg-white p-5 space-y-5">
                          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                            <div>
                              <p className="font-header uppercase text-xs tracking-[0.2em] text-[#8c6844]">Orden seleccionada</p>
                              <h3 className="font-western uppercase text-2xl">{selectedOrder.orderNumber}</h3>
                              <p className="text-sm text-neutral-600 mt-2">{selectedOrder.customerName} · {selectedOrder.customerEmail}</p>
                              <p className="text-sm text-neutral-600">{selectedOrder.address}, {selectedOrder.city}, {selectedOrder.zip}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {renderBadge(formatOrderStatus(selectedOrder.status), statusBadgeClassMap[selectedOrder.status])}
                              {renderBadge(formatPaymentStatus(selectedOrder.paymentStatus), paymentBadgeClassMap[selectedOrder.paymentStatus])}
                            </div>
                          </div>

                          <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-5">
                            <div className="border-2 border-dashed border-neutral-300 p-4 bg-[#fcf9f5]">
                              <p className="font-header uppercase text-xs tracking-[0.2em] text-neutral-500 mb-3">Contenido de la orden</p>
                              <div className="space-y-2 text-sm text-neutral-700">
                                {selectedOrder.items.map((item, index) => (
                                  <div key={`${selectedOrder.id}-${item.productId}-${index}`} className="flex items-center justify-between gap-4 border-b border-dashed border-neutral-300 pb-2 last:border-b-0 last:pb-0">
                                    <div>
                                      <p>{item.productName} × {item.quantity}</p>
                                      {(item.selectedSize || item.selectedColor) && (
                                        <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                                          {item.selectedSize ? `Talla ${item.selectedSize}` : ''}
                                          {item.selectedSize && item.selectedColor ? ' · ' : ''}
                                          {item.selectedColor ? `Color ${item.selectedColor}` : ''}
                                        </p>
                                      )}
                                    </div>
                                    <span>{currency.format(item.price * item.quantity)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="border-2 border-black p-4 bg-[#fffdfa] space-y-3">
                              <p className="font-header uppercase text-xs tracking-[0.2em] text-neutral-500">Formato para embalaje</p>
                              <div className="border-2 border-black p-4 bg-white space-y-2">
                                <p className="font-header uppercase text-[11px] tracking-[0.2em] text-neutral-500">Destinatario</p>
                                <p className="font-header font-black text-lg">{selectedOrder.customerName}</p>
                                <p className="text-sm text-neutral-700">{selectedOrder.address}</p>
                                <p className="text-sm text-neutral-700">{selectedOrder.city}, {selectedOrder.zip}</p>
                                <p className="text-sm text-neutral-700">{selectedOrder.customerEmail}</p>
                              </div>
                              <Button className="w-full" onClick={() => printShippingLabel(selectedOrder)}>
                                <Printer size={16} className="mr-2" /> Imprimir etiqueta de envío
                              </Button>
                            </div>
                          </div>

                          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
                            <Field label="Estado orden">
                              <select value={selectedOrderDraft.status} onChange={(e) => setOrderDrafts((current) => ({ ...current, [selectedOrder.id]: { ...selectedOrderDraft, status: e.target.value as AdminOrder['status'] } }))} className={INPUT_CLASS}>
                                {ORDER_STATUS_OPTIONS.map((status) => <option key={status} value={status}>{formatOrderStatus(status)}</option>)}
                              </select>
                            </Field>
                            <Field label="Estado pago">
                              <select value={selectedOrderDraft.paymentStatus} onChange={(e) => setOrderDrafts((current) => ({ ...current, [selectedOrder.id]: { ...selectedOrderDraft, paymentStatus: e.target.value as AdminOrder['paymentStatus'] } }))} className={INPUT_CLASS}>
                                {PAYMENT_STATUS_OPTIONS.map((status) => <option key={status} value={status}>{formatPaymentStatus(status)}</option>)}
                              </select>
                            </Field>
                            <Field label="Motivo cancelación">
                              <input value={selectedOrderDraft.cancellationReason || ''} onChange={(e) => setOrderDrafts((current) => ({ ...current, [selectedOrder.id]: { ...selectedOrderDraft, cancellationReason: e.target.value } }))} className={INPUT_CLASS} />
                            </Field>
                            <Field label="Reembolso">
                              <input type="number" step="0.01" min="0" value={selectedOrderDraft.refundAmount ?? ''} onChange={(e) => setOrderDrafts((current) => ({ ...current, [selectedOrder.id]: { ...selectedOrderDraft, refundAmount: e.target.value === '' ? null : Number(e.target.value) } }))} className={INPUT_CLASS} />
                            </Field>
                          </div>

                          <div className="flex flex-wrap gap-3 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setDeleteTarget({ entityType: 'order', entityId: selectedOrder.id, entityName: selectedOrder.orderNumber })}
                            >
                              <Trash2 size={14} className="mr-2" /> Eliminar
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => printShippingLabel(selectedOrder)}>
                              <Printer size={14} className="mr-2" /> Imprimir formato
                            </Button>
                            <Button size="sm" onClick={() => saveOrder(selectedOrder.id)}><Save size={14} className="mr-2" /> Guardar</Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </PaperCard>
            )}

            {activeTab === 'team' && (
              <div className="grid grid-cols-1 gap-8">
                <PaperCard>
                  <div className="flex items-center justify-between gap-4 mb-6">
                    <div>
                      <p className="font-header uppercase text-xs tracking-[0.25em] text-[#C4A484]">Permisos</p>
                      <h2 className="font-western uppercase text-3xl">Permisos equipo administrador</h2>
                    </div>
                    {canManageTeam && <Button size="sm" onClick={openNewUserModal}><Plus size={16} className="mr-2" /> Nuevo acceso</Button>}
                  </div>
                  <div className="space-y-4">
                    {snapshot.adminUsers.map((user) => (
                      <div key={user.id} className="border-2 border-black bg-white p-4 space-y-4">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="space-y-3">
                            <div>
                              <p className="font-header font-black uppercase text-lg">{user.name}</p>
                              <p className="text-sm text-neutral-600">{user.email}</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="inline-flex items-center border-2 border-black bg-[#fcf9f5] px-3 py-1 text-[11px] font-header font-black uppercase tracking-[0.2em]">
                                Rol: {user.role}
                              </span>
                              {currentAdminUser?.id === user.id && (
                                <span className="inline-flex items-center border-2 border-[#8c6844] bg-[#f4eadf] px-3 py-1 text-[11px] font-header font-black uppercase tracking-[0.2em] text-[#8c6844]">
                                  Cuenta actual
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => openEditUserModal(user)} disabled={!canManageTeam}>Editar</Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={!canManageTeam || currentAdminUser?.id === user.id}
                              onClick={() => setDeleteTarget({ entityType: 'user', entityId: user.id, entityName: user.name })}
                            >
                              Eliminar
                            </Button>
                          </div>
                        </div>
                        <div>
                          <p className="text-[11px] font-header uppercase tracking-[0.2em] font-black text-neutral-500 mb-3">Permisos actuales</p>
                          <div className="flex flex-wrap gap-2">
                            {getPermissionsForRole(user.role).map((permission) => (
                              <span key={`${user.id}-${permission}`} className="px-3 py-2 text-xs font-header uppercase border-2 border-black bg-[#fcf9f5]">
                                {permission}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </PaperCard>

              </div>
            )}

            {activeTab === 'activity' && canViewActivityLog && (
              <PaperCard>
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div>
                    <p className="font-header uppercase text-xs tracking-[0.25em] text-[#C4A484]">Auditoría</p>
                    <h2 className="font-western uppercase text-3xl">Bitácora de movimientos</h2>
                  </div>
                  <div className="text-right text-sm text-neutral-500">
                    <p>{snapshot.activityLogs.length} movimiento(s) registrados</p>
                    <p className="text-xs mt-1">{activityTodayCount} movimiento(s) registrados el día de hoy</p>
                  </div>
                </div>

                <div className="border-2 border-black bg-white p-4 mb-5 grid gap-4 lg:grid-cols-5">
                  <Field label="Rango de fechas">
                    <select value={activityDateFilter} onChange={(event) => setActivityDateFilter(event.target.value as 'today' | '7d' | '30d' | 'all')} className={INPUT_CLASS}>
                      <option value="today">Últimas 24 horas</option>
                      <option value="7d">Últimos 7 días</option>
                      <option value="30d">Últimos 30 días</option>
                      <option value="all">Todo el histórico</option>
                    </select>
                  </Field>
                  <Field label="Tipo de acción">
                    <select value={activityActionFilter} onChange={(event) => setActivityActionFilter(event.target.value)} className={INPUT_CLASS}>
                      <option value="all">Todas</option>
                      {activityActionOptions.map((action) => (
                        <option key={action} value={action}>{humanizeAction(action)}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Entidad">
                    <select value={activityEntityFilter} onChange={(event) => setActivityEntityFilter(event.target.value)} className={INPUT_CLASS}>
                      <option value="all">Todas</option>
                      {activityEntityOptions.map((entity) => (
                        <option key={entity} value={entity}>{humanizeEntity(entity)}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Filas por página">
                    <select value={activityPageSize} onChange={(event) => setActivityPageSize(Number(event.target.value))} className={INPUT_CLASS}>
                      {[10, 25, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
                    </select>
                  </Field>
                  <div className="border-2 border-black bg-[#fcf9f5] p-3 self-end">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">Resultados</p>
                    <p className="font-header font-black text-lg mt-1">{filteredActivityLogs.length}</p>
                  </div>
                </div>

                <div className="overflow-x-auto border-2 border-black bg-white">
                  <table className="w-full min-w-[980px] text-left">
                    <thead className="bg-neutral-100 border-b-2 border-black font-header uppercase text-[10px] tracking-[0.2em]">
                      <tr>
                        <th className="px-4 py-3">Fecha</th>
                        <th className="px-4 py-3">Cuenta</th>
                        <th className="px-4 py-3">Acción</th>
                        <th className="px-4 py-3">Entidad</th>
                        <th className="px-4 py-3">Registro</th>
                        <th className="px-4 py-3">Detalle</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {paginatedActivityLogs.map((item: AdminActivityLog) => (
                        <tr key={String(item.id)}>
                          <td className="px-4 py-3 text-sm">{new Date(item.createdAt).toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <p className="font-header font-black uppercase text-sm">{item.actorName}</p>
                            <p className="text-xs text-neutral-500">{item.actorEmail}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 text-[10px] uppercase border border-black font-black bg-[#fcf9f5]">{humanizeAction(item.action)}</span>
                          </td>
                          <td className="px-4 py-3">{humanizeEntity(item.entityType)}</td>
                          <td className="px-4 py-3">
                            <p className="font-header font-black uppercase text-sm">{item.entityName}</p>
                            <p className="text-xs text-neutral-500">{item.entityId}</p>
                          </td>
                          <td className="px-4 py-3 text-sm text-neutral-700">{item.details}</td>
                        </tr>
                      ))}
                      {paginatedActivityLogs.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-sm text-neutral-500">
                            No hay movimientos para los filtros seleccionados.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
                  <p className="text-xs uppercase tracking-[0.15em] text-neutral-500">
                    Página {activityPage} de {totalActivityPages}
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setActivityPage((current) => Math.max(1, current - 1))} disabled={activityPage <= 1}>Anterior</Button>
                    <Button size="sm" variant="outline" onClick={() => setActivityPage((current) => Math.min(totalActivityPages, current + 1))} disabled={activityPage >= totalActivityPages}>Siguiente</Button>
                  </div>
                </div>
              </PaperCard>
            )}

            {activeTab === 'storefront' && (
              <PaperCard>
                <div className="flex items-center justify-between gap-4 mb-8">
                  <div>
                    <p className="font-header uppercase text-xs tracking-[0.25em] text-[#C4A484]">Experiencia de tienda</p>
                    <h2 className="font-western uppercase text-3xl">Settings de storefront</h2>
                  </div>
                  <Button onClick={handleSaveSettings} disabled={isSavingSettings}>{isSavingSettings ? 'Guardando…' : 'Guardar ajustes'}</Button>
                </div>

                <div className="grid xl:grid-cols-[1fr_0.9fr] gap-8">
                  <div className="space-y-6">
                    <Field label="Hero título"><input value={settingsForm.hero.title} onChange={(e) => setSettingsForm((current) => ({ ...current, hero: { ...current.hero, title: e.target.value } }))} className={INPUT_CLASS} /></Field>
                    <Field label="Hero subtítulo"><input value={settingsForm.hero.subtitle} onChange={(e) => setSettingsForm((current) => ({ ...current, hero: { ...current.hero, subtitle: e.target.value } }))} className={INPUT_CLASS} /></Field>
                    <ImageDropzone
                      label="Hero imagen"
                      value={settingsForm.hero.imageUrl ? [settingsForm.hero.imageUrl] : []}
                      maxItems={1}
                      folder="storefront/hero"
                      onChange={(images) => setSettingsForm((current) => ({ ...current, hero: { ...current.hero, imageUrl: images[0] ?? '' } }))}
                    />
                    <Field label="About text"><textarea value={settingsForm.aboutText} onChange={(e) => setSettingsForm((current) => ({ ...current, aboutText: e.target.value }))} className={`${INPUT_CLASS} min-h-[160px]`} /></Field>
                    <Field label="Email de contacto"><input type="email" value={settingsForm.contactEmail} onChange={(e) => setSettingsForm((current) => ({ ...current, contactEmail: e.target.value }))} className={INPUT_CLASS} /></Field>
                  </div>

                  <div className="space-y-6">
                    {settingsForm.banners.map((banner, index) => (
                      <div key={banner.id} className="border-2 border-black bg-white p-4 space-y-4">
                        <p className="font-header uppercase text-xs tracking-[0.2em] text-[#C4A484]">Banner {index + 1}</p>
                        <Field label="Título"><input value={banner.title} onChange={(e) => setSettingsForm((current) => ({ ...current, banners: current.banners.map((item, itemIndex) => itemIndex === index ? { ...item, title: e.target.value } : item) }))} className={INPUT_CLASS} /></Field>
                        <Field label="Descripción"><textarea value={banner.subtitle} onChange={(e) => setSettingsForm((current) => ({ ...current, banners: current.banners.map((item, itemIndex) => itemIndex === index ? { ...item, subtitle: e.target.value } : item) }))} className={`${INPUT_CLASS} min-h-[100px]`} /></Field>
                        <Field label="CTA"><input value={banner.buttonText} onChange={(e) => setSettingsForm((current) => ({ ...current, banners: current.banners.map((item, itemIndex) => itemIndex === index ? { ...item, buttonText: e.target.value } : item) }))} className={INPUT_CLASS} /></Field>
                        <ImageDropzone
                          label="Imagen de banner"
                          value={banner.imageUrl ? [banner.imageUrl] : []}
                          maxItems={1}
                          folder={`storefront/banners/${banner.id || index + 1}`}
                          onChange={(images) => setSettingsForm((current) => ({
                            ...current,
                            banners: current.banners.map((item, itemIndex) => itemIndex === index ? { ...item, imageUrl: images[0] ?? '' } : item),
                          }))}
                        />
                        <Field label="Categoría"><select value={banner.categoryLink} onChange={(e) => setSettingsForm((current) => ({ ...current, banners: current.banners.map((item, itemIndex) => itemIndex === index ? { ...item, categoryLink: e.target.value } : item) }))} className={INPUT_CLASS}>{snapshot.categories.map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}</select></Field>
                      </div>
                    ))}
                  </div>
                </div>
              </PaperCard>
            )}
          </main>

          <Dialog open={isActivityCleanupModalOpen} onOpenChange={setIsActivityCleanupModalOpen}>
            <DialogContent className="max-w-xl border-2 border-black bg-[#fcf9f5]">
              <DialogHeader>
                <DialogTitle className="font-western uppercase text-2xl">Mantenimiento de bitácora</DialogTitle>
                <DialogDescription className="text-sm text-neutral-700">
                  Limpia la bitácora y conserva solamente los movimientos de los últimos 3 meses.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 border-2 border-black bg-white p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Acción disponible</p>
                <p className="font-header font-black uppercase mt-2">Limpiar la bitácora</p>
                <p className="text-sm text-neutral-700 mt-2">
                  Se eliminarán de forma permanente todos los registros anteriores a 3 meses. Esta acción no se puede deshacer.
                </p>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" size="sm" onClick={() => setIsActivityCleanupModalOpen(false)}>Cancelar</Button>
                <Button
                  size="sm"
                  onClick={async () => {
                    await runActivityPurge();
                    setIsActivityCleanupModalOpen(false);
                  }}
                  disabled={isPurgingLogs}
                >
                  <Trash2 size={14} className="mr-2" /> {isPurgingLogs ? 'Limpiando…' : 'Limpiar la bitácora'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

<Dialog open={isProductModalOpen} onOpenChange={(open) => { if (!open) closeProductModal(); }}>
  <DialogContent className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] flex h-[min(94vh,980px)] w-[90vw] max-w-[1400px] flex-col border-2 border-black bg-[#fcf9f5] p-0 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden sm:w-[85vw] md:w-[80vw] lg:w-[90vw] xl:max-w-[1600px]">
    <div className="border-b-2 border-black bg-white px-5 py-4 sm:px-8 sm:py-5">
      <DialogHeader className="gap-3 text-left">
        <DialogTitle className="font-western uppercase text-2xl text-black sm:text-3xl">{editingProductId ? 'Editar producto' : 'Nuevo producto'}</DialogTitle>
        <DialogDescription className="text-sm text-neutral-600">Formulario optimizado para capturar todo el producto sin que el contenido se vea apretado.</DialogDescription>
      </DialogHeader>
    </div>
    <div className="min-h-0 flex-1">
      <ProductFormFields
        form={productForm}
        categories={snapshot.categories}
        existingAttributeOptions={existingAttributeOptions}
        isEditing={Boolean(editingProductId)}
        onChange={setProductForm}
        onSubmit={handleProductSubmit}
        submitLabel={editingProductId ? 'Guardar cambios' : 'Crear producto'}
        onCancel={closeProductModal}
      />
    </div>
  </DialogContent>
</Dialog>

          <Dialog open={isCategoryModalOpen} onOpenChange={(open) => { if (!open) closeCategoryModal(); }}>
            <DialogContent className="max-w-3xl border-2 border-black bg-[#fcf9f5] p-0 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-h-[90vh] overflow-hidden">
              <div className="border-b-2 border-black bg-white px-8 py-6">
                <DialogHeader className="text-left">
                  <DialogTitle className="font-western uppercase text-3xl text-black">{editingCategoryId ? 'Editar categoría' : 'Nueva categoría'}</DialogTitle>
                  <DialogDescription className="text-sm text-neutral-600">Alta y edición ahora comparten el mismo modal para mantener el flujo consistente.</DialogDescription>
                </DialogHeader>
              </div>
              <div className="overflow-y-auto p-8">
                <CategoryFormFields
                  form={categoryForm}
                  isEditing={Boolean(editingCategoryId)}
                  onChange={setCategoryForm}
                  onSubmit={handleCategorySubmit}
                  submitLabel={editingCategoryId ? 'Guardar categoría' : 'Crear categoría'}
                />
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isUserModalOpen} onOpenChange={(open) => { if (!open) closeUserModal(); }}>
            <DialogContent className="max-w-3xl border-2 border-black bg-[#fcf9f5] p-0 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-h-[90vh] overflow-hidden">
              <div className="border-b-2 border-black bg-white px-8 py-6">
                <DialogHeader className="text-left">
                  <DialogTitle className="font-western uppercase text-3xl text-black">{editingUserId ? 'Editar acceso' : 'Nuevo acceso'}</DialogTitle>
                  <DialogDescription className="text-sm text-neutral-600">El modal muestra el rol y los permisos esperados antes de guardar.</DialogDescription>
                </DialogHeader>
              </div>
              <div className="overflow-y-auto p-8">
                <form onSubmit={handleUserSubmit} className="space-y-4">
                  <Field label="Nombre"><input required value={userForm.name} onChange={(e) => setUserForm((current) => ({ ...current, name: e.target.value }))} className={INPUT_CLASS} /></Field>
                  <Field label="Correo"><input required type="email" value={userForm.email} onChange={(e) => setUserForm((current) => ({ ...current, email: e.target.value }))} className={INPUT_CLASS} /></Field>
                  <Field label="Rol">
                    <select value={userForm.role} onChange={(e) => setUserForm((current) => ({ ...current, role: e.target.value }))} className={INPUT_CLASS}>
                      <option value="admin">admin</option>
                      <option value="editor">editor</option>
                    </select>
                  </Field>
                  <Field label={editingUserId ? 'Nueva contraseña (opcional)' : 'Contraseña'}><input type="password" value={userForm.password || ''} onChange={(e) => setUserForm((current) => ({ ...current, password: e.target.value }))} className={INPUT_CLASS} /></Field>
                  <div className="border-2 border-black bg-white p-4">
                    <p className="text-[11px] font-header uppercase tracking-[0.2em] font-black text-neutral-500 mb-3">Permisos que tendrá este rol</p>
                    <div className="flex flex-wrap gap-2">
                      {getPermissionsForRole(userForm.role).map((permission) => (
                        <span key={permission} className="px-3 py-2 text-xs font-header uppercase border-2 border-black bg-[#fcf9f5]">
                          {permission}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Button type="submit" className="w-full justify-center">{editingUserId ? 'Guardar acceso' : 'Crear acceso'}</Button>
                </form>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
            <DialogContent className="max-w-2xl border-2 border-black bg-[#fcf9f5] p-0 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
              <div className="border-b-2 border-black bg-white px-8 py-6">
                <DialogHeader className="text-left">
                  <DialogTitle className="font-western uppercase text-3xl text-black">Confirmar eliminación</DialogTitle>
                  <DialogDescription className="text-sm text-neutral-600">Se mostrará el registro afectado antes de borrar para evitar eliminaciones accidentales.</DialogDescription>
                </DialogHeader>
              </div>
              <div className="p-8 space-y-6">
                <div className="border-2 border-black bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Tipo</p>
                  <p className="font-header font-black uppercase text-lg mt-1">{deleteTarget ? humanizeEntity(deleteTarget.entityType) : ''}</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 mt-4">Registro</p>
                  <p className="text-sm text-neutral-700 mt-1">{deleteTarget?.entityName}</p>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
                  <Button variant="primary" onClick={confirmDelete} disabled={isDeleting}>
                    {isDeleting ? 'Eliminando…' : 'Sí, eliminar'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

const ImageDropzone = ({
  label,
  value,
  multiple = false,
  maxItems,
  folder,
  onChange,
}: {
  label: string;
  value: string[];
  multiple?: boolean;
  maxItems?: number;
  folder: string;
  onChange: (urls: string[]) => void;
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const fileArray = Array.from(fileList);
    const availableSlots = typeof maxItems === 'number' ? Math.max(maxItems - value.length, 0) : fileArray.length;
    const files = fileArray.slice(0, availableSlots);
    if (files.length === 0) {
      toast.error(`Solo puedes cargar ${maxItems} imagen(es) en este campo.`);
      return;
    }

    setIsUploading(true);
    try {
      const uploadedUrls = await Promise.all(files.map((file) => uploadImageToStorage(file, folder)));
      const next = multiple ? [...value, ...uploadedUrls] : [uploadedUrls[0]];
      onChange(next);
      toast.success(`${uploadedUrls.length} imagen(es) subida(s).`);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(error instanceof Error ? error.message : 'No se pudo subir la imagen.');
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = async (imageUrl: string) => {
    onChange(value.filter((item) => item !== imageUrl));
    try {
      await deleteImageFromStorage(imageUrl);
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

  return (
    <Field label={label}>
      <div className="space-y-3">
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            void handleUpload(event.dataTransfer.files);
          }}
          className={cn(
            'rounded-none border-2 border-dashed border-black bg-white p-5 text-center transition-colors',
            isDragging && 'bg-[#fff3e4]',
          )}
        >
          <Upload size={18} className="mx-auto mb-2" />
          <p className="text-xs uppercase tracking-[0.16em] font-black">Arrastra imágenes aquí</p>
          <p className="mt-1 text-sm text-neutral-600">o súbelas desde tu dispositivo</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple={multiple}
            className="hidden"
            onChange={(event) => void handleUpload(event.target.files)}
          />
          <Button
            type="button"
            size="sm"
            className="mt-3"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? 'Subiendo…' : 'Buscar en explorador'}
          </Button>
        </div>

        {value.length > 0 && (
          <div className={cn('grid gap-3', multiple ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-1')}>
            {value.map((url) => (
              <div key={url} className="relative overflow-hidden border-2 border-black bg-neutral-100">
                <img src={url} alt="Imagen cargada" className="h-36 w-full object-cover" />
                <button
                  type="button"
                  onClick={() => void removeImage(url)}
                  className="absolute right-2 top-2 border-2 border-black bg-white p-1"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Field>
  );
};

const ProductFormFields = ({
  form,
  categories,
  existingAttributeOptions,
  isEditing,
  onChange,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  form: AdminProductPayload;
  categories: AdminSnapshot['categories'];
  existingAttributeOptions: Record<AttributeFieldKey, string[]>;
  isEditing: boolean;
  onChange: React.Dispatch<React.SetStateAction<AdminProductPayload>>;
  onSubmit: (event: React.FormEvent) => void;
  onCancel: () => void;
  submitLabel: string;
}) => {
  const [isUploadingPreviewImage, setIsUploadingPreviewImage] = useState(false);
  const previewFileInputRef = useRef<HTMLInputElement | null>(null);
  const selectedCategoryName = categories.find((category) => category.id === form.categoryId)?.name || 'Sin categoría';
  const hasDiscount = typeof form.salePrice === 'number' && form.salePrice > 0 && form.salePrice < form.price;
  const uploadPreviewImage = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;

    setIsUploadingPreviewImage(true);
    try {
      const uploadedUrl = await uploadImageToStorage(file, `products/${form.id || form.slug || 'nuevo'}`);
      onChange((current) => {
        const currentImages = current.images || [];
        const nextImages = currentImages.length > 0
          ? [uploadedUrl, ...currentImages.slice(1)]
          : [uploadedUrl];
        return { ...current, images: nextImages };
      });
      toast.success('Imagen principal actualizada.');
    } catch (error) {
      console.error('Error uploading preview image:', error);
      toast.error(error instanceof Error ? error.message : 'No se pudo subir la imagen principal.');
    } finally {
      setIsUploadingPreviewImage(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="relative flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-8 sm:py-6">
        <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.45fr)_minmax(390px,0.95fr)]">
          <div className="space-y-5">
            <section className="space-y-4 border-2 border-black bg-white p-4 sm:p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-western text-xl uppercase sm:text-2xl">Datos básicos</h3>
                </div>
                <span className="inline-flex w-fit items-center border-2 border-black bg-[#fcf9f5] px-3 py-2 text-[11px] font-header font-black uppercase tracking-[0.2em]">
                  {isEditing ? 'Modo edición' : 'Alta de producto'}
                </span>
              </div>
              <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
                <Field label="ID">
                  <input
                    value={isEditing ? form.id : 'Auto-generado al crear'}
                    disabled
                    className={`${INPUT_CLASS} border-neutral-300 bg-neutral-100 text-neutral-500`}
                  />
                </Field>
                <Field label="Nombre" className="lg:col-span-2 xl:col-span-2">
                  <input
                    required
                    value={form.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      onChange((current) => ({ ...current, name, slug: generateProductSlug(name) }));
                    }}
                    className={INPUT_CLASS}
                  />
                </Field>
                <Field label="Slug">
                  <input value={form.slug || ''} readOnly className={`${INPUT_CLASS} bg-neutral-100 text-neutral-600`} />
                </Field>
              </div>
              <Field label="Descripción">
                <textarea value={form.description} onChange={(e) => onChange((current) => ({ ...current, description: e.target.value }))} className={`${INPUT_CLASS} min-h-[120px]`} />
              </Field>
            </section>

            <section className="space-y-4 border-2 border-black bg-white p-4 sm:p-5">
              <h3 className="font-western text-xl uppercase sm:text-2xl">Venta e inventario</h3>
              <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
                <Field label="Precio"><input type="number" min="0" step="0.01" value={form.price} onChange={(e) => onChange((current) => ({ ...current, price: Number(e.target.value) }))} className={INPUT_CLASS} /></Field>
                <Field label="Precio oferta"><input type="number" min="0" step="0.01" value={form.salePrice ?? ''} onChange={(e) => onChange((current) => ({ ...current, salePrice: e.target.value === '' ? null : Number(e.target.value) }))} className={INPUT_CLASS} /></Field>
                <Field label="Categoría"><select value={form.categoryId} onChange={(e) => onChange((current) => ({ ...current, categoryId: e.target.value }))} className={INPUT_CLASS}>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></Field>
                <Field label="Stock"><input type="number" min="0" value={form.stock} onChange={(e) => onChange((current) => ({ ...current, stock: Number(e.target.value) }))} className={INPUT_CLASS} /></Field>
              </div>
            </section>

          </div>

          <div className="space-y-5">
            <section className="space-y-4 border-2 border-black bg-white p-4 sm:p-5">
              <h3 className="font-western text-xl uppercase sm:text-2xl">Constructor visual de tarjeta</h3>
              <p className="text-xs text-neutral-600">
                Construye la tarjeta directamente aquí: imagen, nombre, tags, descuentos, estados y atributos sin cambiar de sección.
              </p>
              <div className="space-y-4 overflow-hidden border-2 border-black bg-[#fcf9f5] p-3">
                <div className="group relative overflow-hidden border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="absolute left-3 top-3 z-10 flex flex-col gap-2">
                    {form.isNew && <FlagBadge label="Novedad" active />}
                    {hasDiscount && <FlagBadge label="Oferta" active />}
                  </div>
                  <div className="relative aspect-[4/5] overflow-hidden border-b-2 border-black bg-neutral-100">
                    {form.images[0] ? (
                      <img src={form.images[0]} alt={form.name || 'Producto'} className="h-full w-full object-cover sepia-[0.15]" />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-neutral-500">
                        <ImageIcon size={32} />
                        <p className="text-[11px] font-header uppercase tracking-[0.2em]">Sin imagen principal</p>
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/65 px-3 py-2 text-white">
                      <p className="text-[10px] font-header font-black uppercase tracking-[0.16em]">{form.images[0] ? 'Imagen principal lista' : 'Sube la portada'}</p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 border-white bg-white/10 px-2 text-[10px] text-white hover:bg-white hover:text-black"
                        onClick={() => previewFileInputRef.current?.click()}
                        disabled={isUploadingPreviewImage}
                      >
                        <Upload size={12} className="mr-1" />
                        {isUploadingPreviewImage ? 'Subiendo...' : 'Cargar imagen'}
                      </Button>
                      <input
                        ref={previewFileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          void uploadPreviewImage(e.target.files);
                          e.target.value = '';
                        }}
                      />
                    </div>
                    <div className="absolute bottom-2 right-2 border border-black bg-white/90 px-2 py-1 text-[10px] font-header font-black uppercase tracking-[0.16em]">
                      {form.stock > 0 ? `Stock ${form.stock}` : 'Agotado'}
                    </div>
                  </div>
                  <div className="space-y-3 p-4">
                    <p className="font-header text-[10px] font-black uppercase tracking-[0.22em] text-[#C4A484]">{selectedCategoryName}</p>
                    <h4 className="min-h-[2.5rem] text-lg font-western uppercase">{form.name || 'Nombre del producto'}</h4>
                    <div className="border-t border-neutral-200 pt-3">
                      {hasDiscount ? (
                        <div className="flex items-center gap-2">
                          <span className="font-header text-2xl font-black text-red-600">${form.salePrice}</span>
                          <span className="text-sm text-neutral-400 line-through">${form.price}</span>
                        </div>
                      ) : (
                        <span className="font-header text-2xl font-black">${form.price || 0}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid gap-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Field label="Nombre en tarjeta">
                      <input
                        value={form.name}
                        onChange={(e) => {
                          const name = e.target.value;
                          onChange((current) => ({ ...current, name, slug: generateProductSlug(name) }));
                        }}
                        className={INPUT_CLASS}
                      />
                    </Field>
                    <Field label="Imagen principal URL (opcional)">
                      <input
                        value={form.images[0] || ''}
                        onChange={(e) => onChange((current) => ({ ...current, images: [e.target.value, ...current.images.slice(1)] }))}
                        placeholder="https://..."
                        className={INPUT_CLASS}
                      />
                    </Field>
                  </div>

                  <div className="grid gap-2 md:grid-cols-2">
                    <Field label="Precio base">
                      <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => onChange((current) => ({ ...current, price: Number(e.target.value) }))} className={INPUT_CLASS} />
                    </Field>
                    <Field label="Precio descuento">
                      <input type="number" min="0" step="0.01" value={form.salePrice ?? ''} onChange={(e) => onChange((current) => ({ ...current, salePrice: e.target.value === '' ? null : Number(e.target.value) }))} className={INPUT_CLASS} />
                    </Field>
                  </div>

                  <AttributeTagPicker
                    label="Tags de la tarjeta"
                    value={form.tags}
                    fieldKey="tags"
                    suggestions={ATTRIBUTE_DEFAULTS.tags}
                    existingOptions={existingAttributeOptions.tags}
                    onChange={(tags) => onChange((current) => ({ ...current, tags }))}
                  />

                  <div className="grid gap-2 sm:grid-cols-3 text-[11px] font-header uppercase font-black">
                    <Toggle label="Nuevo" description="Muestra badge en catálogo" checked={form.isNew} onChange={(checked) => onChange((current) => ({ ...current, isNew: checked }))} />
                    <Toggle label="Destacado" description="Aparece en destacados" checked={form.isFeatured} onChange={(checked) => onChange((current) => ({ ...current, isFeatured: checked }))} />
                    <Toggle label="Activo" description="Visible para clientes" checked={form.isActive} onChange={(checked) => onChange((current) => ({ ...current, isActive: checked }))} />
                  </div>

                  <div className="grid gap-2 md:grid-cols-2">
                    <AttributeTagPicker
                      label="Tallas"
                      value={form.sizes}
                      fieldKey="sizes"
                      suggestions={ATTRIBUTE_DEFAULTS.sizes}
                      existingOptions={existingAttributeOptions.sizes}
                      onChange={(sizes) => onChange((current) => ({ ...current, sizes }))}
                    />
                    <AttributeTagPicker
                      label="Colores"
                      value={form.colors}
                      fieldKey="colors"
                      suggestions={ATTRIBUTE_DEFAULTS.colors}
                      existingOptions={existingAttributeOptions.colors}
                      onChange={(colors) => onChange((current) => ({ ...current, colors }))}
                    />
                  </div>

                  <Field label="Stock en tarjeta">
                    <input
                      type="number"
                      min="0"
                      value={form.stock}
                      onChange={(e) => onChange((current) => ({ ...current, stock: Number(e.target.value) }))}
                      className={INPUT_CLASS}
                    />
                  </Field>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      <div className="border-t-2 border-black bg-[#1f130b] px-5 py-4 text-white sm:px-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-header uppercase tracking-[0.2em] font-black text-[#d4c5b3]">Acciones rápidas</p>
            <p className="mt-1 text-sm text-white/80">Guarda los cambios o cierra el formulario.</p>
          </div>
          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <Button type="button" variant="outline" className="border-white text-white hover:bg-white hover:text-black" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" className="justify-center"><Save size={16} className="mr-2" /> {submitLabel}</Button>
          </div>
        </div>
      </div>
    </form>
  );
};

const CategoryFormFields = ({
  form,
  isEditing,
  onChange,
  onSubmit,
  submitLabel,
}: {
  form: AdminCategoryPayload;
  isEditing: boolean;
  onChange: React.Dispatch<React.SetStateAction<AdminCategoryPayload>>;
  onSubmit: (event: React.FormEvent) => void;
  submitLabel: string;
}) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <Field label="ID">
      <input
        value={isEditing ? form.id : 'Auto-generado al crear'}
        disabled
        className={`${INPUT_CLASS} border-neutral-300 bg-neutral-100 text-neutral-500`}
      />
    </Field>
    <Field label="Nombre">
      <input
        required
        value={form.name}
        onChange={(e) => {
          const name = e.target.value;
          onChange((current) => ({ ...current, name, slug: generateCategorySlug(name) }));
        }}
        className={INPUT_CLASS}
      />
    </Field>
    <Field label="Slug"><input value={form.slug || ''} readOnly className={`${INPUT_CLASS} bg-neutral-100 text-neutral-600`} /></Field>
    <ImageDropzone
      label="Imagen de categoría"
      value={form.imageUrl ? [form.imageUrl] : []}
      maxItems={1}
      folder={`categories/${form.id || form.slug || 'nueva'}`}
      onChange={(images) => onChange((current) => ({ ...current, imageUrl: images[0] ?? '' }))}
    />
    <Button type="submit" className="w-full justify-center">{submitLabel}</Button>
  </form>
);

const Field = ({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) => (
  <label className={cn('block space-y-2', className)}>
    <span className="text-[11px] font-header uppercase tracking-[0.2em] font-black text-neutral-500">{label}</span>
    {children}
  </label>
);

const Toggle = ({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={cn(
      'border-2 border-black px-2.5 py-2 text-left transition-colors sm:min-h-[76px]',
      checked ? 'bg-black text-white' : 'bg-white text-black',
    )}
  >
    <span className="block text-[11px] leading-none">{label}</span>
    <span className={cn('mt-1 block text-[9px] leading-snug tracking-normal normal-case', checked ? 'text-white/80' : 'text-neutral-500')}>
      {description}
    </span>
  </button>
);

const FlagBadge = ({ label, active }: { label: string; active: boolean }) => (
  <span className={cn('px-2 py-1 text-[10px] uppercase border font-black', active ? 'border-black text-black bg-[#fcf9f5]' : 'border-neutral-300 text-neutral-500')}>
    {label}
  </span>
);

const AttributeTagPicker = ({
  label,
  fieldKey,
  value,
  suggestions,
  existingOptions,
  onChange,
}: {
  label: string;
  fieldKey: AttributeFieldKey;
  value: string[];
  suggestions: readonly string[];
  existingOptions: string[];
  onChange: (items: string[]) => void;
}) => {
  const normalizedItems = parseTags(serializeList(value));
  const suggestedItems = suggestions.filter((item) => !normalizedItems.includes(item));
  const existingItems = existingOptions.filter((item) => !normalizedItems.includes(item));

  const addSuggestion = (item: string) => {
    if (normalizedItems.includes(item)) return;
    onChange([...normalizedItems, item]);
  };

  const removeItem = (item: string) => {
    onChange(normalizedItems.filter((current) => current !== item));
  };

  return (
    <Field label={label}>
      <div className="space-y-3">
        <input
          value={serializeList(normalizedItems)}
          onChange={(e) => onChange(parseTags(e.target.value))}
          className={INPUT_CLASS}
        />
        <div className="flex flex-wrap gap-2">
          {normalizedItems.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => removeItem(item)}
              className="inline-flex items-center gap-2 border border-black bg-[#fcf9f5] px-2.5 py-1 text-[10px] font-header font-black uppercase tracking-[0.16em] transition-colors hover:bg-black hover:text-white"
            >
              <span>{item}</span>
              <span aria-hidden="true">×</span>
            </button>
          ))}
        </div>
        <details className="border border-dashed border-black/40 bg-[#f8f1ea]">
          <summary className="cursor-pointer list-none px-3 py-2 text-[10px] font-header font-black uppercase tracking-[0.18em] text-neutral-700">
            Agregar más atributos
          </summary>
          <div className="space-y-4 border-t border-black/20 px-3 py-3">
            <div className="space-y-2">
              <p className="text-[10px] font-header font-black uppercase tracking-[0.18em] text-neutral-500">
                Ya existentes en {fieldKey === 'tags' ? 'otros productos' : 'catálogo'}
              </p>
              <div className="flex flex-wrap gap-2">
                {existingItems.length > 0 ? existingItems.map((item) => (
                  <button
                    key={`${fieldKey}-existing-${item}`}
                    type="button"
                    onClick={() => addSuggestion(item)}
                    className="border border-black bg-white px-2.5 py-1 text-[10px] font-header font-black uppercase tracking-[0.16em] transition-colors hover:bg-black hover:text-white"
                  >
                    {item}
                  </button>
                )) : (
                  <span className="text-xs text-neutral-500">No hay atributos extra disponibles.</span>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-header font-black uppercase tracking-[0.18em] text-neutral-500">Sugeridos rápidos</p>
              <div className="flex flex-wrap gap-2">
                {suggestedItems.map((item) => (
                  <button
                    key={`${fieldKey}-suggested-${item}`}
                    type="button"
                    onClick={() => addSuggestion(item)}
                    className="border border-black bg-[#fffdfa] px-2.5 py-1 text-[10px] font-header font-black uppercase tracking-[0.16em] transition-colors hover:bg-black hover:text-white"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </details>
      </div>
    </Field>
  );
};

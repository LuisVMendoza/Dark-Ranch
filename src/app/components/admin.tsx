import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Boxes,
  DollarSign,
  Package,
  Pencil,
  Plus,
  Save,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Trash2,
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
  saveStoreSettings,
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
  images: [''],
  sizes: [],
  colors: [],
  tags: [],
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
  editor: ['Productos y categorías', 'Storefront', 'Lectura de bitácora'],
  operations: ['Órdenes y postventa', 'Inventario', 'Lectura de bitácora'],
};

const parseTags = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean);
const serializeList = (list: string[]) => list.join(', ');
const statCardClass = 'bg-white border-2 border-black p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]';
const INPUT_CLASS = 'w-full border-2 border-black bg-white px-3 py-3 outline-none focus:bg-[#fffdfa]';

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

export const AdminDashboard = ({
  initialSnapshot,
  onSnapshotUpdated,
  currentAdminUser,
}: {
  initialSnapshot: AdminSnapshot;
  onSnapshotUpdated: (snapshot: AdminSnapshot) => void;
  currentAdminUser: AdminUser | null;
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [snapshot, setSnapshot] = useState<AdminSnapshot>(initialSnapshot);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

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

  useEffect(() => {
    setSnapshot(initialSnapshot);
    setSettingsForm(initialSnapshot.settings);
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

  const refreshSnapshot = async (successMessage?: string) => {
    setIsRefreshing(true);
    try {
      const next = await getAdminSnapshot();
      setSnapshot(next);
      setSettingsForm(next.settings);
      setOrderDrafts({});
      onSnapshotUpdated(next);
      if (successMessage) toast.success(successMessage);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo recargar el panel');
    } finally {
      setIsRefreshing(false);
    }
  };

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

  const recentOrders = useMemo(() => snapshot.orders.slice(0, 6), [snapshot]);

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
    resetUserForm();
    setIsUserModalOpen(true);
  };

  const openEditUserModal = (user: AdminUser) => {
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
    { key: 'activity', label: 'Bitácora', icon: ShieldCheck },
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
                      <Button size="sm" variant="outline" onClick={() => setActiveTab('activity')}>Abrir bitácora</Button>
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
                    <h2 className="font-western uppercase text-3xl">CRUD de productos</h2>
                  </div>
                  <Button size="sm" onClick={openNewProductModal}><Plus size={16} className="mr-2" /> Nuevo</Button>
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
                      {snapshot.products.map((product) => (
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
                </div>
                <div className="space-y-5">
                  {snapshot.orders.map((order) => {
                    const draft = orderDrafts[order.id] || {
                      status: order.status,
                      paymentStatus: order.paymentStatus,
                      cancellationReason: order.cancellationReason || '',
                      refundAmount: order.refundAmount ?? null,
                    };
                    return (
                      <div key={order.id} className="border-2 border-black bg-white p-5 space-y-4">
                        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                          <div>
                            <p className="font-header font-black text-lg">{order.orderNumber}</p>
                            <p className="text-sm text-neutral-600">{order.customerName} · {order.customerEmail}</p>
                            <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 mt-1">{new Date(order.createdAt).toLocaleString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-header font-black text-2xl">{currency.format(order.total)}</p>
                            <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">{order.items.length} item(s)</p>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
                          <Field label="Estado orden">
                            <select value={draft.status} onChange={(e) => setOrderDrafts((current) => ({ ...current, [order.id]: { ...draft, status: e.target.value as AdminOrder['status'] } }))} className={INPUT_CLASS}>
                              {ORDER_STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
                            </select>
                          </Field>
                          <Field label="Estado pago">
                            <select value={draft.paymentStatus} onChange={(e) => setOrderDrafts((current) => ({ ...current, [order.id]: { ...draft, paymentStatus: e.target.value as AdminOrder['paymentStatus'] } }))} className={INPUT_CLASS}>
                              {PAYMENT_STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
                            </select>
                          </Field>
                          <Field label="Motivo cancelación">
                            <input value={draft.cancellationReason || ''} onChange={(e) => setOrderDrafts((current) => ({ ...current, [order.id]: { ...draft, cancellationReason: e.target.value } }))} className={INPUT_CLASS} />
                          </Field>
                          <Field label="Reembolso">
                            <input type="number" step="0.01" min="0" value={draft.refundAmount ?? ''} onChange={(e) => setOrderDrafts((current) => ({ ...current, [order.id]: { ...draft, refundAmount: e.target.value === '' ? null : Number(e.target.value) } }))} className={INPUT_CLASS} />
                          </Field>
                        </div>

                        <div className="border-2 border-dashed border-neutral-300 p-4 bg-[#fcf9f5]">
                          <p className="font-header uppercase text-xs tracking-[0.2em] text-neutral-500 mb-3">Detalle</p>
                          <div className="space-y-2 text-sm text-neutral-700">
                            {order.items.map((item, index) => (
                              <div key={`${order.id}-${item.productId}-${index}`} className="flex items-center justify-between gap-4">
                                <span>{item.productName} × {item.quantity}</span>
                                <span>{currency.format(item.price * item.quantity)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDeleteTarget({ entityType: 'order', entityId: order.id, entityName: order.orderNumber })}
                          >
                            <Trash2 size={14} className="mr-2" /> Eliminar
                          </Button>
                          <Button size="sm" onClick={() => saveOrder(order.id)}><Save size={14} className="mr-2" /> Guardar</Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </PaperCard>
            )}

            {activeTab === 'team' && (
              <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-8">
                <PaperCard>
                  <div className="flex items-center justify-between gap-4 mb-6">
                    <div>
                      <p className="font-header uppercase text-xs tracking-[0.25em] text-[#C4A484]">Permisos</p>
                      <h2 className="font-western uppercase text-3xl">Equipo administrador</h2>
                    </div>
                    <Button size="sm" onClick={openNewUserModal}><Plus size={16} className="mr-2" /> Nuevo acceso</Button>
                  </div>
                  <div className="space-y-4">
                    {snapshot.adminUsers.map((user) => (
                      <div key={user.id} className="border-2 border-black bg-white p-4 space-y-4">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div>
                            <p className="font-header font-black uppercase text-lg">{user.name}</p>
                            <p className="text-sm text-neutral-600">{user.email}</p>
                            <p className="text-xs uppercase tracking-[0.2em] text-[#8c6844] mt-1">Rol actual: {user.role}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => openEditUserModal(user)}>Editar</Button>
                            <Button size="sm" variant="outline" onClick={() => setDeleteTarget({ entityType: 'user', entityId: user.id, entityName: user.name })}>Eliminar</Button>
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

                <PaperCard>
                  <div>
                    <p className="font-header uppercase text-xs tracking-[0.25em] text-[#C4A484]">Cuenta activa</p>
                    <h2 className="font-western uppercase text-3xl">Resumen de acceso</h2>
                  </div>
                  <div className="mt-6 border-2 border-black bg-white p-5 space-y-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Nombre</p>
                      <p className="font-header font-black text-xl mt-1">{currentAdminUser?.name || 'Sin sesión'}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Correo</p>
                      <p className="text-sm text-neutral-700 mt-1">{currentAdminUser?.email || 'No disponible'}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Rol</p>
                      <p className="text-sm text-neutral-700 mt-1">{currentAdminUser?.role || 'No disponible'}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 mb-3">Permisos aplicados</p>
                      <div className="flex flex-wrap gap-2">
                        {getPermissionsForRole(currentAdminUser?.role || 'guest').map((permission) => (
                          <span key={permission} className="px-3 py-2 text-xs font-header uppercase border-2 border-black bg-[#fcf9f5]">
                            {permission}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </PaperCard>
              </div>
            )}

            {activeTab === 'activity' && (
              <PaperCard>
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div>
                    <p className="font-header uppercase text-xs tracking-[0.25em] text-[#C4A484]">Auditoría</p>
                    <h2 className="font-western uppercase text-3xl">Bitácora de movimientos</h2>
                  </div>
                  <div className="text-right text-sm text-neutral-500">
                    <p>{snapshot.activityLogs.length} movimiento(s) registrados</p>
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
                      {snapshot.activityLogs.map((item: AdminActivityLog) => (
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
                    </tbody>
                  </table>
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
                    <Field label="Hero imagen URL"><input value={settingsForm.hero.imageUrl} onChange={(e) => setSettingsForm((current) => ({ ...current, hero: { ...current.hero, imageUrl: e.target.value } }))} className={INPUT_CLASS} /></Field>
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
                        <Field label="Imagen URL"><input value={banner.imageUrl} onChange={(e) => setSettingsForm((current) => ({ ...current, banners: current.banners.map((item, itemIndex) => itemIndex === index ? { ...item, imageUrl: e.target.value } : item) }))} className={INPUT_CLASS} /></Field>
                        <Field label="Categoría"><select value={banner.categoryLink} onChange={(e) => setSettingsForm((current) => ({ ...current, banners: current.banners.map((item, itemIndex) => itemIndex === index ? { ...item, categoryLink: e.target.value } : item) }))} className={INPUT_CLASS}>{snapshot.categories.map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}</select></Field>
                      </div>
                    ))}
                  </div>
                </div>
              </PaperCard>
            )}
          </main>

          <Dialog open={isProductModalOpen} onOpenChange={(open) => { if (!open) closeProductModal(); }}>
            <DialogContent className="max-w-5xl border-2 border-black bg-[#fcf9f5] p-0 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-h-[92vh] overflow-hidden">
              <div className="border-b-2 border-black bg-white px-8 py-6">
                <DialogHeader className="text-left">
                  <DialogTitle className="font-western uppercase text-3xl text-black">{editingProductId ? 'Editar producto' : 'Nuevo producto'}</DialogTitle>
                  <DialogDescription className="text-sm text-neutral-600">Ahora el modal incluye flags de nuevo, destacado, activo y el botón de guardar siempre visible.</DialogDescription>
                </DialogHeader>
              </div>
              <div className="overflow-y-auto p-8">
                <ProductFormFields
                  form={productForm}
                  categories={snapshot.categories}
                  isEditing={Boolean(editingProductId)}
                  onChange={setProductForm}
                  onSubmit={handleProductSubmit}
                  submitLabel={editingProductId ? 'Guardar cambios' : 'Crear producto'}
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
                      <option value="operations">operations</option>
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

const ProductFormFields = ({
  form,
  categories,
  isEditing,
  onChange,
  onSubmit,
  submitLabel,
}: {
  form: AdminProductPayload;
  categories: AdminSnapshot['categories'];
  isEditing: boolean;
  onChange: React.Dispatch<React.SetStateAction<AdminProductPayload>>;
  onSubmit: (event: React.FormEvent) => void;
  submitLabel: string;
}) => (
  <form onSubmit={onSubmit} className="space-y-6">
    <div className="grid md:grid-cols-2 gap-4">
      <Field label="ID">
        <input
          value={isEditing ? form.id : 'Auto-generado al crear'}
          disabled
          className={`${INPUT_CLASS} border-neutral-300 bg-neutral-100 text-neutral-500`}
        />
      </Field>
      <Field label="Slug"><input value={form.slug || ''} onChange={(e) => onChange((current) => ({ ...current, slug: e.target.value }))} className={INPUT_CLASS} /></Field>
      <Field label="Nombre" className="md:col-span-2"><input required value={form.name} onChange={(e) => onChange((current) => ({ ...current, name: e.target.value }))} className={INPUT_CLASS} /></Field>
      <Field label="Descripción" className="md:col-span-2"><textarea value={form.description} onChange={(e) => onChange((current) => ({ ...current, description: e.target.value }))} className={`${INPUT_CLASS} min-h-[110px]`} /></Field>
      <Field label="Precio"><input type="number" min="0" step="0.01" value={form.price} onChange={(e) => onChange((current) => ({ ...current, price: Number(e.target.value) }))} className={INPUT_CLASS} /></Field>
      <Field label="Precio oferta"><input type="number" min="0" step="0.01" value={form.salePrice ?? ''} onChange={(e) => onChange((current) => ({ ...current, salePrice: e.target.value === '' ? null : Number(e.target.value) }))} className={INPUT_CLASS} /></Field>
      <Field label="Categoría"><select value={form.categoryId} onChange={(e) => onChange((current) => ({ ...current, categoryId: e.target.value }))} className={INPUT_CLASS}>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></Field>
      <Field label="Stock"><input type="number" min="0" value={form.stock} onChange={(e) => onChange((current) => ({ ...current, stock: Number(e.target.value) }))} className={INPUT_CLASS} /></Field>
      <Field label="Imágenes (URL, una por línea)" className="md:col-span-2"><textarea value={form.images.join('\n')} onChange={(e) => onChange((current) => ({ ...current, images: e.target.value.split('\n').map((item) => item.trim()).filter(Boolean) }))} className={`${INPUT_CLASS} min-h-[100px]`} /></Field>
      <Field label="Tallas"><input value={serializeList(form.sizes)} onChange={(e) => onChange((current) => ({ ...current, sizes: parseTags(e.target.value) }))} className={INPUT_CLASS} /></Field>
      <Field label="Colores"><input value={serializeList(form.colors)} onChange={(e) => onChange((current) => ({ ...current, colors: parseTags(e.target.value) }))} className={INPUT_CLASS} /></Field>
      <Field label="Tags" className="md:col-span-2"><input value={serializeList(form.tags)} onChange={(e) => onChange((current) => ({ ...current, tags: parseTags(e.target.value) }))} className={INPUT_CLASS} /></Field>
    </div>
    <div className="border-2 border-black bg-white p-4 space-y-4 sticky bottom-0">
      <div>
        <p className="text-[11px] font-header uppercase tracking-[0.2em] font-black text-neutral-500 mb-3">Visibilidad del producto</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-header uppercase font-black">
          <Toggle label="Nuevo" description="Muestra badge en catálogo" checked={form.isNew} onChange={(checked) => onChange((current) => ({ ...current, isNew: checked }))} />
          <Toggle label="Destacado" description="Aparece en destacados" checked={form.isFeatured} onChange={(checked) => onChange((current) => ({ ...current, isFeatured: checked }))} />
          <Toggle label="Activo" description="Visible para clientes" checked={form.isActive} onChange={(checked) => onChange((current) => ({ ...current, isActive: checked }))} />
        </div>
      </div>
      <Button type="submit" className="w-full justify-center"><Save size={16} className="mr-2" /> {submitLabel}</Button>
    </div>
  </form>
);

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
    <Field label="Nombre"><input required value={form.name} onChange={(e) => onChange((current) => ({ ...current, name: e.target.value }))} className={INPUT_CLASS} /></Field>
    <Field label="Slug"><input value={form.slug || ''} onChange={(e) => onChange((current) => ({ ...current, slug: e.target.value }))} className={INPUT_CLASS} /></Field>
    <Field label="Imagen URL"><input required value={form.imageUrl} onChange={(e) => onChange((current) => ({ ...current, imageUrl: e.target.value }))} className={INPUT_CLASS} /></Field>
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
    className={cn('border-2 border-black px-3 py-3 text-left transition-colors', checked ? 'bg-black text-white' : 'bg-white text-black')}
  >
    <span className="block">{label}</span>
    <span className={cn('mt-1 block text-[10px] tracking-normal normal-case', checked ? 'text-white/80' : 'text-neutral-500')}>
      {description}
    </span>
  </button>
);

const FlagBadge = ({ label, active }: { label: string; active: boolean }) => (
  <span className={cn('px-2 py-1 text-[10px] uppercase border font-black', active ? 'border-black text-black bg-[#fcf9f5]' : 'border-neutral-300 text-neutral-500')}>
    {label}
  </span>
);

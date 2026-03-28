/**
 * =====================================================
 * DARK RANCH - PRODUCT FORM COMPONENT
 * =====================================================
 * Formulario completo para crear/editar productos
 */

import React, { useState, useEffect } from 'react';
import { Button } from './ui';
import { X, Upload, Trash2, Plus } from 'lucide-react';
import { 
  createProduct, 
  updateProduct, 
  generateSlug, 
  generateSKU,
  uploadProductImage,
  deleteProductImage,
  CreateProductInput 
} from '../lib/products.service';
import { CATEGORIES } from '../data';
import { toast } from 'sonner';

interface ProductFormProps {
  productId?: string; // Si existe, es modo edición
  initialData?: Partial<CreateProductInput>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  productId,
  initialData,
  onSuccess,
  onCancel,
}) => {
  const isEditMode = !!productId;
  
  // Estado del formulario
  const [formData, setFormData] = useState<Partial<CreateProductInput>>({
    name: '',
    description: '',
    price: 0,
    sale_price: undefined,
    category_id: 'cat_botas',
    stock: 0,
    low_stock_threshold: 5,
    images: [],
    sizes: [],
    colors: [],
    tags: [],
    is_new: false,
    is_featured: false,
    is_active: true,
    ...initialData,
  });

  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);
  
  // Inputs temporales para arrays
  const [sizeInput, setSizeInput] = useState('');
  const [colorInput, setColorInput] = useState('');
  const [tagInput, setTagInput] = useState('');

  // Auto-generar slug cuando cambia el nombre
  useEffect(() => {
    if (formData.name && !isEditMode) {
      setFormData(prev => ({
        ...prev,
        slug: generateSlug(formData.name || ''),
      }));
    }
  }, [formData.name, isEditMode]);

  // Manejo de cambios en inputs
  const handleChange = (field: keyof CreateProductInput, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Subir imagen
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const sku = formData.id || await generateSKU();
      const uploadPromises = Array.from(files).map(file => 
        uploadProductImage(file, sku)
      );
      
      const uploadedUrls = await Promise.all(uploadPromises);
      
      setFormData(prev => ({
        ...prev,
        id: sku,
        images: [...(prev.images || []), ...uploadedUrls],
      }));
      
      toast.success(`${uploadedUrls.length} imagen(es) subida(s)`);
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error(error instanceof Error ? error.message : 'Error al subir imágenes');
    } finally {
      setIsUploading(false);
    }
  };

  // Eliminar imagen
  const handleRemoveImage = async (imageUrl: string) => {
    try {
      await deleteProductImage(imageUrl);
      setFormData(prev => ({
        ...prev,
        images: prev.images?.filter(url => url !== imageUrl),
      }));
      toast.success('Imagen eliminada');
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error(error instanceof Error ? error.message : 'Error al eliminar imagen');
    }
  };

  // Reordenar imágenes (la primera será la principal para la tarjeta)
  const handleImageDrop = (targetIndex: number) => {
    if (draggedImageIndex === null || draggedImageIndex === targetIndex) return;

    const currentImages = [...(formData.images || [])];
    const [draggedImage] = currentImages.splice(draggedImageIndex, 1);
    currentImages.splice(targetIndex, 0, draggedImage);

    setFormData(prev => ({
      ...prev,
      images: currentImages,
    }));
    setDraggedImageIndex(null);
  };

  // Agregar item a array
  const addToArray = (field: 'sizes' | 'colors' | 'tags', value: string, clearInput: () => void) => {
    if (!value.trim()) return;
    
    const currentArray = formData[field] || [];
    if (!currentArray.includes(value.trim())) {
      handleChange(field, [...currentArray, value.trim()]);
      clearInput();
    }
  };

  // Eliminar item de array
  const removeFromArray = (field: 'sizes' | 'colors' | 'tags', value: string) => {
    const currentArray = formData[field] || [];
    handleChange(field, currentArray.filter(item => item !== value));
  };

  // Submit del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.name || !formData.price || !formData.category_id) {
      toast.error('Por favor completa los campos obligatorios');
      return;
    }

    setIsSaving(true);
    try {
      if (isEditMode && productId) {
        await updateProduct({
          id: productId,
          ...formData,
        });
        toast.success('Producto actualizado exitosamente');
      } else {
        const sku = formData.id || await generateSKU();
        await createProduct({
          id: sku,
          slug: formData.slug || generateSlug(formData.name || ''),
          ...formData,
        } as CreateProductInput);
        toast.success('Producto creado exitosamente');
      }
      
      onSuccess?.();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error(error instanceof Error ? error.message : 'Error al guardar el producto');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6 overflow-y-auto">
      <div className="bg-[#fcf9f5] w-full max-w-4xl border-2 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-black bg-white">
          <h2 className="text-2xl font-header font-black uppercase">
            {isEditMode ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
          <button onClick={onCancel} className="hover:bg-neutral-100 p-2 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-8 max-h-[70vh] overflow-y-auto">
          {/* Información Básica */}
          <section className="space-y-4">
            <h3 className="font-header uppercase font-bold text-sm text-[#C4A484]">
              Información Básica
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-header uppercase font-bold">
                  Nombre del Producto *
                </label>
                <input
                  required
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full border-2 border-black p-3 outline-none focus:bg-white"
                  placeholder="Bota Vaquera Cuero Negro"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-header uppercase font-bold">SKU</label>
                <input
                  value={formData.id || 'Auto-generado'}
                  disabled
                  className="w-full border-2 border-neutral-300 p-3 bg-neutral-100 text-neutral-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-header uppercase font-bold">Slug (URL)</label>
                <input
                  value={formData.slug}
                  onChange={(e) => handleChange('slug', e.target.value)}
                  className="w-full border-2 border-black p-3 outline-none focus:bg-white"
                  placeholder="bota-vaquera-cuero-negro"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-header uppercase font-bold">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="w-full border-2 border-black p-3 outline-none focus:bg-white min-h-[100px]"
                  placeholder="Descripción detallada del producto..."
                />
              </div>
            </div>
          </section>

          {/* Precios e Inventario */}
          <section className="space-y-4">
            <h3 className="font-header uppercase font-bold text-sm text-[#C4A484]">
              Precios e Inventario
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-header uppercase font-bold">Precio *</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleChange('price', parseFloat(e.target.value))}
                  className="w-full border-2 border-black p-3 outline-none focus:bg-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-header uppercase font-bold">Precio Oferta</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.sale_price || ''}
                  onChange={(e) => handleChange('sale_price', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full border-2 border-black p-3 outline-none focus:bg-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-header uppercase font-bold">Stock *</label>
                <input
                  required
                  type="number"
                  value={formData.stock}
                  onChange={(e) => handleChange('stock', parseInt(e.target.value))}
                  className="w-full border-2 border-black p-3 outline-none focus:bg-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-header uppercase font-bold">Alerta Stock</label>
                <input
                  type="number"
                  value={formData.low_stock_threshold}
                  onChange={(e) => handleChange('low_stock_threshold', parseInt(e.target.value))}
                  className="w-full border-2 border-black p-3 outline-none focus:bg-white"
                />
              </div>
            </div>
          </section>

          {/* Categoría */}
          <section className="space-y-4">
            <h3 className="font-header uppercase font-bold text-sm text-[#C4A484]">
              Categoría
            </h3>
            <select
              required
              value={formData.category_id}
              onChange={(e) => handleChange('category_id', e.target.value)}
              className="w-full border-2 border-black p-3 outline-none focus:bg-white"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={`cat_${cat.toLowerCase()}`}>
                  {cat}
                </option>
              ))}
            </select>
          </section>

          {/* Imágenes */}
          <section className="space-y-4">
            <h3 className="font-header uppercase font-bold text-sm text-[#C4A484]">
              Imágenes
            </h3>
            <p className="text-xs text-neutral-600">
              Arrastra para reordenar. La primera imagen será la que se muestre en la tarjeta del producto.
            </p>
            
            <div className="flex flex-wrap gap-4">
              {formData.images?.map((url, idx) => (
                <div
                  key={url}
                  draggable
                  onDragStart={() => setDraggedImageIndex(idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleImageDrop(idx)}
                  onDragEnd={() => setDraggedImageIndex(null)}
                  className={`relative w-32 h-32 border-2 border-black group cursor-move transition-opacity ${
                    draggedImageIndex === idx ? 'opacity-50' : 'opacity-100'
                  }`}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  {idx === 0 && (
                    <span className="absolute top-1 left-1 bg-black text-white text-[10px] px-1.5 py-0.5 font-header uppercase">
                      Principal
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(url)}
                    className="absolute top-1 right-1 bg-red-600 text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              
              <label className="w-32 h-32 border-2 border-dashed border-black flex flex-col items-center justify-center cursor-pointer hover:bg-white transition-colors">
                <Upload size={24} />
                <span className="text-xs mt-2">Subir</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                />
              </label>
            </div>
            {isUploading && <p className="text-sm text-neutral-500">Subiendo imágenes...</p>}
          </section>

          {/* Tallas */}
          <section className="space-y-4">
            <h3 className="font-header uppercase font-bold text-sm text-[#C4A484]">
              Tallas Disponibles
            </h3>
            <div className="flex gap-2">
              <input
                value={sizeInput}
                onChange={(e) => setSizeInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('sizes', sizeInput, () => setSizeInput('')))}
                className="flex-1 border-2 border-black p-3 outline-none focus:bg-white"
                placeholder="Ej: 7, 8, M, L, XL"
              />
              <Button
                type="button"
                onClick={() => addToArray('sizes', sizeInput, () => setSizeInput(''))}
              >
                <Plus size={16} />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.sizes?.map((size) => (
                <span
                  key={size}
                  className="px-3 py-1 bg-white border-2 border-black font-header font-bold text-sm flex items-center gap-2"
                >
                  {size}
                  <button
                    type="button"
                    onClick={() => removeFromArray('sizes', size)}
                    className="text-red-600"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </section>

          {/* Colores */}
          <section className="space-y-4">
            <h3 className="font-header uppercase font-bold text-sm text-[#C4A484]">
              Colores Disponibles
            </h3>
            <div className="flex gap-2">
              <input
                value={colorInput}
                onChange={(e) => setColorInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('colors', colorInput, () => setColorInput('')))}
                className="flex-1 border-2 border-black p-3 outline-none focus:bg-white"
                placeholder="Ej: Negro, Café, Indigo"
              />
              <Button
                type="button"
                onClick={() => addToArray('colors', colorInput, () => setColorInput(''))}
              >
                <Plus size={16} />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.colors?.map((color) => (
                <span
                  key={color}
                  className="px-3 py-1 bg-white border-2 border-black font-header font-bold text-sm flex items-center gap-2"
                >
                  {color}
                  <button
                    type="button"
                    onClick={() => removeFromArray('colors', color)}
                    className="text-red-600"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </section>

          {/* Tags */}
          <section className="space-y-4">
            <h3 className="font-header uppercase font-bold text-sm text-[#C4A484]">
              Etiquetas
            </h3>
            <div className="flex gap-2">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('tags', tagInput, () => setTagInput('')))}
                className="flex-1 border-2 border-black p-3 outline-none focus:bg-white"
                placeholder="Ej: Industrial, Western, Premium"
              />
              <Button
                type="button"
                onClick={() => addToArray('tags', tagInput, () => setTagInput(''))}
              >
                <Plus size={16} />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags?.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-[#C4A484] text-white border-2 border-black font-header font-bold text-xs flex items-center gap-2"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeFromArray('tags', tag)}
                    className="text-white"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          </section>

          {/* Estados */}
          <section className="space-y-4">
            <h3 className="font-header uppercase font-bold text-sm text-[#C4A484]">
              Estados
            </h3>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_new}
                  onChange={(e) => handleChange('is_new', e.target.checked)}
                  className="w-5 h-5"
                />
                <span className="font-header uppercase text-sm font-bold">Producto Nuevo</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => handleChange('is_featured', e.target.checked)}
                  className="w-5 h-5"
                />
                <span className="font-header uppercase text-sm font-bold">Destacado</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => handleChange('is_active', e.target.checked)}
                  className="w-5 h-5"
                />
                <span className="font-header uppercase text-sm font-bold">Activo</span>
              </label>
            </div>
          </section>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-4 p-6 border-t-2 border-black bg-white">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSaving || isUploading}
            className="min-w-[150px]"
          >
            {isSaving ? 'Guardando...' : isEditMode ? 'Actualizar' : 'Crear Producto'}
          </Button>
        </div>
      </div>
    </div>
  );
};

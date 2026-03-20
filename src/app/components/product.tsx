import React from 'react';
import { ShoppingCart, Eye, Star } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../cart-context';
import { Button, Badge, cn, LOGO_CIRCULAR } from './ui';
import { ImageWithFallback } from './common/ImageWithFallback';
import { toast } from 'sonner';

export const ProductCard = ({ product, onQuickView }: { product: Product, onQuickView?: (p: Product) => void }) => {
  const { addToCart } = useCart();

  return (
    <div className="group relative bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(196,164,132,0.4)] transition-all duration-500 overflow-hidden">
      {/* Badge */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        {product.isNew && <Badge className="bg-[#C4A484] text-black border border-black">Novedad</Badge>}
        {product.salePrice && <Badge className="bg-red-600 border border-black">Oferta</Badge>}
      </div>

      {/* Image Container */}
      <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100 border-b-2 border-black">
        <ImageWithFallback 
          src={product.images[0]} 
          alt={product.name} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 sepia-[0.2] group-hover:sepia-0"
        />
        
        {/* Hover Actions */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
          <button 
            onClick={() => onQuickView?.(product)}
            className="w-14 h-14 bg-white border-2 border-black rotate-45 flex items-center justify-center hover:bg-[#C4A484] transition-colors group/btn"
          >
            <Eye size={24} className="-rotate-45" />
          </button>
          <button 
            onClick={() => {
              addToCart(product);
              toast.success(`Añadido: ${product.name}`);
            }}
            className="w-14 h-14 bg-white border-2 border-black rotate-45 flex items-center justify-center hover:bg-[#C4A484] transition-colors group/btn"
          >
            <ShoppingCart size={24} className="-rotate-45" />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-6 relative">
        <p className="text-[#C4A484] font-header text-[10px] uppercase tracking-[0.3em] font-black mb-2">{product.category}</p>
        <h3 className="font-western text-xl uppercase tracking-tight mb-4 min-h-[3rem] line-clamp-2">
          {product.name}
        </h3>
        <div className="flex items-center justify-between border-t border-neutral-100 pt-4">
          <div className="flex flex-col">
            {product.salePrice ? (
              <div className="flex items-center gap-3">
                <span className="text-red-600 font-bold font-header text-2xl">${product.salePrice}</span>
                <span className="text-neutral-400 line-through text-sm font-header">${product.price}</span>
              </div>
            ) : (
              <span className="text-black font-black font-header text-2xl">${product.price}</span>
            )}
          </div>
          <div className="flex items-center gap-1 bg-neutral-50 px-2 py-1 border border-neutral-100">
            <Star size={14} fill="#eab308" className="text-[#eab308]" />
            <span className="text-black font-black font-header text-xs">4.8</span>
          </div>
        </div>
      </div>
      
      {/* Background Seal Watermark */}
      <div className="absolute bottom-2 right-2 w-16 h-16 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
        <ImageWithFallback src={LOGO_CIRCULAR} alt="Seal" />
      </div>
    </div>
  );
};

export const CategoryCard = ({ name, image }: { name: string, image: string }) => (
  <div className="relative aspect-square overflow-hidden group cursor-pointer border-2 border-black">
    <ImageWithFallback 
      src={image} 
      alt={name} 
      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
    />
    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors"></div>
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-center">
        <h4 className="text-white font-header text-3xl uppercase font-black tracking-tighter mb-2 transform transition-transform group-hover:scale-110">
          {name}
        </h4>
        <div className="w-12 h-1 bg-[#C4A484] mx-auto transform scale-x-0 group-hover:scale-x-100 transition-transform"></div>
      </div>
    </div>
  </div>
);

import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, MessageSquare, Trash2 } from 'lucide-react';
import { Product, ProductComment, CustomerSession } from '../types';
import { Button } from './ui';
import { ImageWithFallback } from './common/ImageWithFallback';
import { createProductComment, deleteProductComment, getProductComments } from '../lib/api';
import { toast } from 'sonner';

const COMMENT_IMAGE_SLOTS = 3;

export const ProductDetailPage = ({
  product,
  customer,
  isAdmin,
  onBack,
  onRequireLogin,
}: {
  product: Product;
  customer: CustomerSession | null;
  isAdmin: boolean;
  onBack: () => void;
  onRequireLogin: () => void;
}) => {
  const [selectedImage, setSelectedImage] = useState(product.images[0]);
  const [comments, setComments] = useState<ProductComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [imageInputs, setImageInputs] = useState<string[]>(['', '', '']);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const effectiveGallery = useMemo(() => {
    const uniqueImages = Array.from(new Set(product.images.filter(Boolean)));
    return uniqueImages.length ? uniqueImages : [product.images[0]];
  }, [product.images]);

  const loadComments = async () => {
    setIsLoadingComments(true);
    try {
      const response = await getProductComments(product.id);
      setComments(response.comments);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudieron cargar los comentarios');
    } finally {
      setIsLoadingComments(false);
    }
  };

  useEffect(() => {
    setSelectedImage(product.images[0]);
    loadComments();
  }, [product.id]);

  const handleSubmitComment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!customer) {
      onRequireLogin();
      return;
    }

    const trimmed = commentText.trim();
    if (!trimmed) {
      toast.error('Escribe un comentario antes de publicar');
      return;
    }

    setIsSubmittingComment(true);
    try {
      await createProductComment(product.id, {
        customerId: customer.id,
        customerName: customer.name,
        customerEmail: customer.email,
        content: trimmed,
        images: imageInputs.map((entry) => entry.trim()).filter(Boolean),
      });
      toast.success('Comentario publicado');
      setCommentText('');
      setImageInputs(new Array(COMMENT_IMAGE_SLOTS).fill(''));
      await loadComments();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo publicar el comentario');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteProductComment(product.id, commentId);
      toast.success('Comentario eliminado');
      await loadComments();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo eliminar el comentario');
    }
  };

  return (
    <div className="min-h-screen bg-[#fcf9f5] pt-28 pb-20">
      <div className="container mx-auto px-6 space-y-14">
        <button onClick={onBack} className="font-header uppercase text-xs tracking-wider flex items-center gap-2 hover:text-[#C4A484] transition-colors">
          <ArrowLeft size={16} /> Volver al catálogo
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-4">
            <div className="border-2 border-black bg-white overflow-hidden">
              <ImageWithFallback src={selectedImage} alt={product.name} className="w-full h-[580px] object-cover" />
            </div>
            <div className="grid grid-cols-4 gap-3">
              {effectiveGallery.map((imageUrl) => (
                <button
                  key={imageUrl}
                  type="button"
                  className={`border-2 ${selectedImage === imageUrl ? 'border-black' : 'border-neutral-300'} bg-white overflow-hidden`}
                  onClick={() => setSelectedImage(imageUrl)}
                >
                  <ImageWithFallback src={imageUrl} alt={product.name} className="w-full h-28 object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <p className="text-[#C4A484] font-header text-xs uppercase tracking-[0.3em] font-black">{product.category}</p>
            <h1 className="font-western text-5xl uppercase">{product.name}</h1>
            <p className="text-neutral-700 leading-relaxed">{product.description}</p>
            <div className="bg-white border-2 border-black p-6 space-y-2">
              <p className="font-header uppercase text-xs tracking-[0.2em]">Precio</p>
              <p className="font-header text-4xl font-black">${(product.salePrice ?? product.price).toFixed(2)}</p>
              {product.salePrice && <p className="text-neutral-500 line-through">Precio normal: ${product.price.toFixed(2)}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-white border border-black p-4">
                <p className="font-header uppercase text-xs">Tallas</p>
                <p className="mt-2">{product.sizes.join(', ') || 'Única'}</p>
              </div>
              <div className="bg-white border border-black p-4">
                <p className="font-header uppercase text-xs">Colores</p>
                <p className="mt-2">{product.colors.join(', ') || 'Estándar'}</p>
              </div>
            </div>
          </div>
        </div>

        <section className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h2 className="font-western text-3xl uppercase flex items-center gap-2"><MessageSquare size={28} /> Comentarios</h2>
            {!customer && (
              <Button variant="outline" onClick={onRequireLogin}>Inicia sesión para comentar</Button>
            )}
          </div>

          <form onSubmit={handleSubmitComment} className="bg-white border-2 border-black p-6 space-y-4">
            <p className="font-header uppercase text-xs tracking-[0.2em] text-neutral-500">Comparte tu experiencia (puedes agregar fotos por URL)</p>
            <textarea
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              placeholder={customer ? '¿Qué te pareció esta prenda?' : 'Debes iniciar sesión para comentar'}
              className="w-full border-2 border-black p-3 min-h-28 outline-none"
              disabled={!customer || isSubmittingComment}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {imageInputs.map((value, index) => (
                <input
                  key={`comment-image-${index + 1}`}
                  type="url"
                  value={value}
                  onChange={(event) => {
                    const next = [...imageInputs];
                    next[index] = event.target.value;
                    setImageInputs(next);
                  }}
                  placeholder={`URL de foto ${index + 1}`}
                  className="border border-black p-2 text-sm"
                  disabled={!customer || isSubmittingComment}
                />
              ))}
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={!customer || isSubmittingComment}>
                {isSubmittingComment ? 'Publicando...' : 'Publicar comentario'}
              </Button>
            </div>
          </form>

          {isLoadingComments ? (
            <p className="text-neutral-500">Cargando comentarios...</p>
          ) : comments.length === 0 ? (
            <p className="text-neutral-500">Todavía no hay comentarios para esta prenda.</p>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <article key={comment.id} className="bg-white border border-black p-5 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-header font-black uppercase">{comment.customerName}</p>
                      <p className="text-xs text-neutral-500">{new Date(comment.createdAt).toLocaleString()}</p>
                    </div>
                    {isAdmin && (
                      <button type="button" onClick={() => handleDeleteComment(comment.id)} className="text-red-600 hover:text-red-800 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <p className="leading-relaxed">{comment.content}</p>
                  {comment.images.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {comment.images.map((image) => (
                        <button key={image} type="button" onClick={() => setZoomedImage(image)} className="border border-black overflow-hidden">
                          <ImageWithFallback src={image} alt="Foto del comentario" className="w-16 h-16 object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        {zoomedImage && (
          <div className="fixed inset-0 bg-black/85 z-[70] flex items-center justify-center p-6" onClick={() => setZoomedImage(null)}>
            <ImageWithFallback src={zoomedImage} alt="Foto ampliada" className="max-h-[90vh] max-w-[90vw] object-contain" />
          </div>
        )}
      </div>
    </div>
  );
};

import { useState } from 'react';
import { X, Heart, ShieldAlert, ShoppingBag, Eye, Send } from 'lucide-react';
import { Product } from '../types';
import { formatPrice } from '../utils';

interface ProductDetailModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (p: Product, size: string) => void;
  onOrderNow: (p: Product, size: string) => void;
  isWishlisted: boolean;
  onToggleWishlist: (p: Product) => void;
}

export default function ProductDetailModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onOrderNow,
  isWishlisted,
  onToggleWishlist
}: ProductDetailModalProps) {
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes[0] || 'Standard');

  if (!isOpen) return null;

  const handleWhatsAppDirect = () => {
    const wsMessage = `👑 *STYLE X EXCLUSIVE COLLECTION* 👑\n\nHello Style X Team, I am looking to acquire:\n\n*Product:* ${product.title}\n*Code:* ${product.code}\n*Price:* ৳${product.price}\n*Size Choice:* ${selectedSize}\n\nCould you guide me regarding active courier times?\nThank you!`;
    const finalUrl = `https://wa.me/8801755104443?text=${encodeURIComponent(wsMessage)}`;
    window.open(finalUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Absolute gray backing dim */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-luxury-black/90 backdrop-blur-sm"
      ></div>

      {/* Detail panel card */}
      <div className="relative w-full max-w-4xl bg-[#080808] border border-luxury-gold/20 rounded-lg p-5 md:p-8 text-left shadow-2xl z-10 overflow-y-auto max-h-[90vh] animate-fade-in gold-glow-border">
        
        {/* Close Button top-right */}
        <button 
          onClick={onClose}
          className="absolute right-5 top-5 text-white/50 hover:text-luxury-gold transition-colors p-1"
        >
          <X size={18} />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
          
          {/* Left Column: Premium Zoom Image */}
          <div className="w-full relative aspect-square bg-luxury-charcoal rounded overflow-hidden border border-white/5 flex items-center justify-center">
            <img 
              src={product.imageUrl} 
              alt={product.title} 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            {/* Visual gradient filter */}
            <div className="absolute inset-0 bg-gradient-to-t from-luxury-black/40 via-transparent to-transparent"></div>
          </div>

          {/* Right Column: Detailed Product Specs */}
          <div className="flex flex-col justify-between space-y-5">
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono tracking-widest text-luxury-gold uppercase bg-luxury-gold/10 px-2.5 py-1 rounded">
                  {product.category} COLLECTION
                </span>
                <span className="text-[11px] font-mono text-white/40">{product.code}</span>
              </div>

              <h2 className="font-serif text-2xl lg:text-3.5xl font-bold text-white tracking-wide">
                {product.title}
              </h2>

              <p className="font-serif text-xl font-bold text-luxury-gold">
                {formatPrice(product.price)}
              </p>

              {/* Stock check progress visual */}
              <div className="border border-white/5 bg-luxury-black p-3 rounded">
                <div className="flex items-center justify-between text-[10px] uppercase font-mono text-white/50 mb-1.5">
                  <span>Stock availability:</span>
                  <span className={product.stock === 0 ? "text-red-400 font-bold" : product.stock < 15 ? "text-yellow-400 font-bold" : "text-green-400 font-bold"}>
                    {product.stock === 0 ? "ARCHIVED / OUT" : `${product.stock} units left`}
                  </span>
                </div>
                {product.stock > 0 && (
                  <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-luxury-gold"
                      style={{ width: `${Math.min(100, (product.stock / 350) * 100)}%` }}
                    ></div>
                  </div>
                )}
              </div>

              <div className="text-xs text-white/70 space-y-2 leading-relaxed">
                <h4 className="font-display text-[9.5px] uppercase font-mono tracking-widest text-white/50">Collection description</h4>
                <p className="font-light italic">{product.description}</p>
                <div className="text-[11px] text-white/40 font-mono mt-1">
                  <span>DIMENSIONS SPECIFIER: {product.dimensions || 'Dynamic Custom Fit'}</span>
                </div>
              </div>
            </div>

            {/* Sizes selector box */}
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <p className="text-[10px] text-white/50 uppercase font-mono tracking-wider mb-2">CHOOSE DIMENSIONS FIT</p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`h-9 min-w-9 px-3 rounded text-xs font-display border uppercase tracking-widest flex items-center justify-center transition-all ${
                        selectedSize === size
                          ? 'bg-luxury-gold text-luxury-black font-extrabold border-luxury-gold shadow-md'
                          : 'bg-luxury-charcoal/50 text-white/75 border-white/5 hover:border-white/20'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Direct ordering actions */}
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    onAddToCart(product, selectedSize);
                    onClose();
                  }}
                  disabled={product.stock === 0}
                  className="w-full border border-white/10 hover:border-luxury-gold/50 bg-luxury-charcoal hover:bg-luxury-black text-white text-xs font-display font-medium uppercase tracking-[0.1em] py-3.5 rounded flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <ShoppingBag size={14} className="text-luxury-gold" />
                  Add to Bag
                </button>

                <button
                  onClick={() => {
                    onOrderNow(product, selectedSize);
                    onClose();
                  }}
                  disabled={product.stock === 0}
                  className="w-full bg-gradient-to-r from-luxury-gold-dark to-luxury-gold text-luxury-black font-display font-extrabold text-xs uppercase tracking-[0.15em] py-3.5 rounded hover:brightness-110 transition-all disabled:opacity-50"
                >
                  Acquire / Order
                </button>
              </div>

              <button
                onClick={handleWhatsAppDirect}
                className="w-full border border-green-500/20 hover:border-green-500/50 bg-green-500/5 hover:bg-green-500/15 text-green-400 text-xs font-display font-bold uppercase tracking-[0.15em] py-3.5 rounded flex items-center justify-center gap-2 transition-all"
              >
                <Send size={13} />
                Order via WhatsApp Direct
              </button>
            </div>

            {/* Security Badge tags */}
            <div className="border-t border-white/5 pt-3.5 flex items-center justify-center gap-2.5 text-[10px] text-white/40 uppercase tracking-widest font-mono text-center">
              <span>⚜️ CASH ON DELIVERY AVAILABLE</span>
              <span>•</span>
              <span>VIP SHAPE ENGINE GUARANTEED ⚜️</span>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

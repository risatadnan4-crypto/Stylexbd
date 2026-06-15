import { useState } from 'react';
import { Heart, ChevronDown, ChevronUp, ShoppingBag, Eye, Send } from 'lucide-react';
import { Product } from '../types';
import { formatPrice } from '../utils';

interface ProductCardProps {
  key?: any;
  product: Product;
  onAddToCart: (p: Product, size: string) => void;
  onOrderNow: (p: Product, size: string) => void;
  onProductClick: (p: Product) => void;
  isWishlisted: boolean;
  onToggleWishlist: (p: Product) => void;
}

export default function ProductCard({
  product,
  onAddToCart,
  onOrderNow,
  onProductClick,
  isWishlisted,
  onToggleWishlist
}: ProductCardProps) {
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes[0] || 'Standard');
  const [showWhyBuy, setShowWhyBuy] = useState(false);

  // Generate WhatsApp Direct link for this exact product
  const handleWhatsAppDirect = () => {
    const wsMessage = `👑 *STYLE X INQUIRY* 👑\n\nHello Style X Team, I am interested in: \n\n*Product:* ${product.title} (${product.code})\n*Price:* ৳${product.price}\n*Size Chosen:* ${selectedSize}\n\nCan you please check availability?\nThank you!`;
    const finalUrl = `https://wa.me/8801755104443?text=${encodeURIComponent(wsMessage)}`;
    window.open(finalUrl, '_blank');
  };

  return (
    <div className="group relative bg-[#0a0a0a] border border-white/5 hover:border-luxury-gold/30 rounded p-4 flex flex-col justify-between transition-all duration-300 shadow-xl gold-glow-border hover:-translate-y-1">
      
      {/* Upper blueprint markings */}
      <div className="flex items-center justify-between text-[10px] font-mono text-white/40 mb-3">
        <span>{product.code}</span>
        <button 
          onClick={() => onToggleWishlist(product)}
          className={`p-1.5 rounded-full bg-luxury-charcoal hover:bg-luxury-black border border-white/5 hover:border-luxury-gold/30 transition-all cursor-pointer ${
            isWishlisted ? 'text-luxury-gold' : 'text-white/60'
          }`}
          title="Wishlist piece"
        >
          <Heart size={13} fill={isWishlisted ? '#D4AF37' : 'none'} />
        </button>
      </div>

      {/* Image frame */}
      <div 
        onClick={() => onProductClick(product)}
        className="relative aspect-square overflow-hidden rounded bg-luxury-charcoal cursor-pointer flex items-center justify-center border border-white/5 hover:border-white/10 group mb-4"
      >
        <img 
          src={product.imageUrl} 
          alt={product.title} 
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        {/* Dark gold color overlay on photo hovers */}
        <div className="absolute inset-0 bg-gradient-to-t from-luxury-black via-transparent to-transparent opacity-60"></div>
        
        {/* Quick View absolute layer */}
        <div className="absolute inset-0 bg-luxury-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onProductClick(product);
            }}
            className="flex items-center gap-1.5 bg-luxury-gold hover:bg-luxury-gold-dark text-luxury-black font-semibold uppercase text-[10px] px-3 py-1.5 rounded tracking-widest transition-all"
          >
            <Eye size={12} />
            Inspect Piece
          </button>
        </div>

        {/* Dynamic status badges */}
        <div className="absolute bottom-3 left-3 bg-luxury-black/80 backdrop-blur-md border border-luxury-gold/20 text-[9px] text-luxury-gold rounded px-2.5 py-1 font-display uppercase tracking-widest font-semibold">
          {product.stock === 0 ? "ARCHIVED" : product.trending ? "TRENDING" : "EXCLUSIVE"}
        </div>
      </div>

      {/* Product Information */}
      <div className="mb-4">
        <div className="flex items-start justify-between gap-1 mb-1">
          <h3 
            onClick={() => onProductClick(product)}
            className="font-serif text-lg font-medium text-white hover:text-luxury-gold transition-colors duration-300 cursor-pointer line-clamp-1"
          >
            {product.title}
          </h3>
          <span className="font-serif text-base font-semibold text-luxury-gold flex-shrink-0">
            {formatPrice(product.price)}
          </span>
        </div>
        <p className="text-[9px] text-white/40 uppercase font-mono tracking-widest mb-3">CURATED PIECE</p>
        
        <p className="text-xs text-white/60 line-clamp-2 italic mb-4 font-light">
          {product.description}
        </p>

        {/* Sizes Selections */}
        {product.sizes && product.sizes.length > 0 && (
          <div className="mb-4">
            <p className="text-[9.5px] text-white/40 uppercase font-mono tracking-wider mb-2">DIMENSIONS</p>
            <div className="flex flex-wrap gap-1.5">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`w-7 h-7 rounded text-[9.5px] font-display font-medium border uppercase tracking-wider flex items-center justify-center transition-all ${
                    selectedSize === size
                      ? 'bg-luxury-gold text-luxury-black font-bold border-luxury-gold shadow-md'
                      : 'bg-luxury-charcoal/50 text-white/70 border-white/5 hover:border-white/30'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Order Actions and Collapsible Explain Panels */}
      <div className="space-y-2 mt-auto">
        <div className="grid grid-cols-2 gap-2">
          {/* Add to Cart */}
          <button
            onClick={() => onAddToCart(product, selectedSize)}
            disabled={product.stock === 0}
            className="w-full border border-white/10 hover:border-luxury-gold/50 bg-luxury-charcoal/30 hover:bg-luxury-charcoal text-white text-[10px] font-display font-medium uppercase tracking-widest py-2 px-1 rounded flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
          >
            <ShoppingBag size={11} className="text-luxury-gold" />
            Add To Cart
          </button>
          
          {/* Order Now */}
          <button
            onClick={() => onOrderNow(product, selectedSize)}
            disabled={product.stock === 0}
            className="w-full bg-gradient-to-r from-luxury-gold-dark to-luxury-gold text-luxury-black hover:brightness-110 font-display font-bold text-[10.5px] uppercase tracking-widest py-2 px-1 rounded transition-all disabled:opacity-50"
          >
            Order Now
          </button>
        </div>

        {/* WhatsApp Direct Order */}
        <button
          onClick={handleWhatsAppDirect}
          className="w-full border border-green-500/20 hover:border-green-500/50 bg-green-500/5 hover:bg-green-500/15 text-green-400 text-[10px] font-display font-semibold uppercase tracking-widest py-2.5 rounded flex items-center justify-center gap-1.5 transition-all"
        >
          <Send size={11} />
          Order Via WhatsApp
        </button>

        {/* Collapsible Glow accent "আপনি কেন কিনবেন?" */}
        <div className="border-t border-white/5 pt-1.5 mt-2">
          <button
            onClick={() => setShowWhyBuy(!showWhyBuy)}
            className="w-full flex items-center justify-between text-[10px] text-luxury-gold/80 hover:text-luxury-gold py-1 uppercase tracking-wider font-display font-semibold"
          >
            <span className="flex items-center gap-1">
              <span>✨</span> আপনি কেন কিনবেন?
            </span>
            {showWhyBuy ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          
          {showWhyBuy && (
            <div className="mt-1 bg-luxury-gold/[0.03] border border-luxury-gold/10 p-2.5 rounded text-[11px] text-white/80 leading-relaxed font-sans font-light">
              <span className="text-luxury-gold font-medium mb-1 block">বিলাসিতা ও অনন্যতার প্রতীক:</span>
              {product.whyBuy}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

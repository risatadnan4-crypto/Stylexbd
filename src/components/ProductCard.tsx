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
  whatsappNumber?: string;
}

export default function ProductCard({
  product,
  onAddToCart,
  onOrderNow,
  onProductClick,
  isWishlisted,
  onToggleWishlist,
  whatsappNumber = "8801755104443"
}: ProductCardProps) {
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes[0] || 'Standard');
  const [showWhyBuy, setShowWhyBuy] = useState(false);

  // Generate WhatsApp Direct link for this exact product
  const handleWhatsAppDirect = () => {
    const wsMessage = `👑 *STYLE X INQUIRY* 👑\n\nHello Style X Team, I am interested in: \n\n*Product:* ${product.title} (${product.code})\n*Price:* ৳${product.price}\n*Size Chosen:* ${selectedSize}\n\nCan you please check availability?\nThank you!`;
    const finalUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(wsMessage)}`;
    window.open(finalUrl, '_blank');
  };

  return (
    <div className="group relative bg-[#07010e] border-2 border-white/5 hover:border-luxury-purple-glowing/60 rounded-xl p-2.5 sm:p-3.5 flex flex-col justify-between transition-all duration-500 shadow-xl hover:shadow-[0_12px_45px_rgba(154,77,255,0.2)] hover:-translate-y-1 select-none overflow-hidden">
      {/* Premium glowing hover accent card background */}
      <div className="absolute inset-0 bg-gradient-to-tr from-luxury-purple/5 via-transparent to-luxury-gold/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
      
      {/* Upper blueprint markings */}
      <div className="flex items-center justify-between text-[8px] sm:text-[10px] font-mono text-white/40 mb-1.5 sm:mb-2 gap-1 z-10">
        <span className="tracking-wider">{product.code}</span>
        <button 
          onClick={() => onToggleWishlist(product)}
          className={`p-1 sm:p-1.5 rounded-full bg-[#15032a]/80 hover:bg-luxury-purple/20 border border-white/5 hover:border-luxury-gold/30 transition-all cursor-pointer ${
            isWishlisted ? 'text-luxury-gold shadow-[0_0_10px_rgba(212,175,55,0.4)]' : 'text-white/60'
          }`}
          title="Wishlist piece"
        >
          <Heart size={11} fill={isWishlisted ? '#D4AF37' : 'none'} className={isWishlisted ? 'animate-pulse' : ''} />
        </button>
      </div>

      {/* Image frame */}
      <div 
        onClick={() => onProductClick(product)}
        className="relative aspect-[1.4] sm:aspect-[1.12] overflow-hidden rounded-lg bg-[#110121] cursor-pointer flex items-center justify-center border border-white/5 hover:border-luxury-purple/45 group mb-1.5 sm:mb-2.5"
      >
        <img 
          src={product.imageUrl} 
          alt={product.title} 
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        {/* Dark gold color overlay on photo hovers */}
        <div className="absolute inset-0 bg-gradient-to-t from-luxury-black via-transparent to-transparent opacity-60"></div>
        <div className="absolute inset-0 bg-luxury-purple/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        {/* Quick View absolute layer */}
        <div className="absolute inset-0 bg-luxury-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onProductClick(product);
            }}
            className="flex items-center gap-1 bg-gradient-to-r from-luxury-gold to-yellow-400 hover:brightness-110 text-luxury-black font-extrabold uppercase text-[8px] sm:text-[10px] px-2 py-1.5 rounded-lg tracking-widest transition-all shadow-md"
          >
            <Eye size={10} />
            Inspect
          </button>
        </div>

        {/* Dynamic status badges */}
        <div className="absolute bottom-1 left-1 bg-luxury-black/95 backdrop-blur-md border border-luxury-purple/30 text-[7px] sm:text-[9px] text-white rounded-md px-1 py-0.5 font-display uppercase tracking-widest font-semibold flex items-center gap-1">
          <span className={`w-1 h-1 rounded-full ${product.stock === 0 ? "bg-red-500" : product.trending ? "bg-luxury-gold animate-ping" : "bg-luxury-purple-glowing"}`}></span>
          <span>{product.stock === 0 ? "ARCHIVED" : product.trending ? "TRENDING" : "EXCLUSIVE"}</span>
        </div>
      </div>

      {/* Product Information */}
      <div className="mb-1.5 z-10">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-0.5 sm:gap-1 mb-1">
          <h3 
            onClick={() => onProductClick(product)}
            className="font-serif text-[11px] sm:text-base md:text-lg font-bold text-white hover:text-luxury-purple-glowing transition-colors duration-300 cursor-pointer line-clamp-1"
          >
            {product.title}
          </h3>
          <span className="font-serif text-[11px] sm:text-base font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-luxury-gold via-white to-luxury-gold flex-shrink-0">
            {formatPrice(product.price)}
          </span>
        </div>
        <p className="text-[7.5px] sm:text-[9px] text-luxury-purple uppercase font-mono tracking-widest mb-1 sm:mb-1.5 flex items-center gap-1">
          <span>CURATED PIECE</span>
          <span>•</span>
          <span className="text-white/40">PREMIUM</span>
        </p>
        
        <p className="text-[10px] sm:text-xs text-white/60 line-clamp-1 sm:line-clamp-2 italic mb-1 sm:mb-2 font-light">
          {product.description}
        </p>

        {/* Sizes Selections */}
        {product.sizes && product.sizes.length > 0 && (
          <div className="mb-1.5">
            <p className="text-[8px] sm:text-[9.5px] text-white/40 uppercase font-mono tracking-wider mb-0.5">DIMENSIONS</p>
            <div className="flex flex-wrap gap-1">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`h-5.5 sm:h-7 min-w-[22px] sm:min-w-[28px] px-1.5 sm:px-2 rounded text-[7.5px] sm:text-[9px] font-display font-semibold border uppercase tracking-wider flex items-center justify-center transition-all ${
                    selectedSize === size
                      ? 'bg-gradient-to-br from-luxury-purple to-luxury-purple-glowing text-white border-luxury-purple shadow-[0_0_10px_rgba(154,77,255,0.4)]'
                      : 'bg-[#15032a]/50 text-white/70 border-white/5 hover:border-luxury-purple/30'
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
      <div className="space-y-2 mt-auto z-10 w-full">
        <div className="grid grid-cols-2 gap-[10px]">
          {/* Add to Cart */}
          <button
            onClick={() => onAddToCart(product, selectedSize)}
            disabled={product.stock === 0}
            className="w-full h-[40px] border border-luxury-purple-glowing/30 hover:border-luxury-purple-glowing/80 bg-[#0e051c] hover:bg-[#190a33] text-[#cdaaff] hover:text-white text-[11px] sm:text-[12px] font-display font-semibold uppercase tracking-[0.1em] rounded-[14px] flex items-center justify-center gap-1.5 transition-all duration-200 ease-out disabled:opacity-45 hover:shadow-[0_0_15px_rgba(154,77,255,0.3)] active:scale-[0.98] cursor-pointer"
          >
            <ShoppingBag size={13.5} className="opacity-90 text-luxury-purple-glowing" />
            <span>Add to Cart</span>
          </button>
          
          {/* Buy Now Premium Button */}
          <button
            onClick={() => onOrderNow(product, selectedSize)}
            disabled={product.stock === 0}
            className="w-full h-[40px] bg-gradient-to-r from-luxury-gold-dark via-[#ffe79c] to-luxury-gold hover:from-[#eec849] hover:to-[#bc901a] text-[#0a0515] font-display font-extrabold text-[11px] sm:text-[12px] uppercase tracking-[0.1em] rounded-[14px] transition-all duration-200 ease-out disabled:opacity-40 shadow-[0_4px_12px_rgba(212,175,55,0.22)] hover:shadow-[0_6px_22px_rgba(212,175,55,0.45)] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 relative overflow-hidden"
          >
            <span>Buy Now</span>
          </button>
        </div>

        {/* WhatsApp Direct Order */}
        <button
          onClick={handleWhatsAppDirect}
          className="w-full border border-emerald-500/35 hover:border-emerald-400 bg-gradient-to-r from-[#03140a] via-[#052814] to-[#03140a] text-emerald-400 hover:text-emerald-300 text-[10.5px] sm:text-[11.5px] font-display font-extrabold uppercase tracking-[0.15em] py-2.5 sm:py-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 shadow-[0_4px_15px_rgba(16,185,129,0.12)] hover:shadow-[0_4px_25px_rgba(16,185,129,0.35)] hover:scale-[1.02] active:scale-95 cursor-pointer relative overflow-hidden group/wa"
        >
          <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover/wa:opacity-100 transition-opacity duration-300" />
          <Send size={13.5} className="text-emerald-400 group-hover/wa:translate-x-0.5 group-hover/wa:-translate-y-0.5 transition-transform" />
          <span>Order Via WhatsApp</span>
        </button>

        {/* Collapsible Glow accent "আপনি কেন কিনবেন?" */}
        <div className="border-t border-white/5 pt-1 mt-1 hidden sm:block">
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

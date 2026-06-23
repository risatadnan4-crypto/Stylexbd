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
  whatsappNumber?: string;
}

export default function ProductDetailModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onOrderNow,
  isWishlisted,
  onToggleWishlist,
  whatsappNumber = "8801755104443"
}: ProductDetailModalProps) {
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes[0] || 'Standard');
  const [activeImgUrl, setActiveImgUrl] = useState<string | null>(null);
  const [prevProductId, setPrevProductId] = useState<string | null>(null);

  if (product && product.id !== prevProductId) {
    setPrevProductId(product.id);
    setActiveImgUrl(product.imageUrl);
  }

  if (!isOpen) return null;

  const displayImage = activeImgUrl || product.imageUrl;
  const allImages = [product.imageUrl, ...(product.images || [])].filter(Boolean);

  const handleWhatsAppDirect = () => {
    const wsMessage = `👑 *STYLE X EXCLUSIVE COLLECTION* 👑\n\nHello Style X Team, I am looking to acquire:\n\n*Product:* ${product.title}\n*Code:* ${product.code}\n*Price:* ৳${product.price}\n*Size Choice:* ${selectedSize}\n\nCould you guide me regarding active courier times?\nThank you!`;
    const finalUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(wsMessage)}`;
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
          className="absolute right-5 top-5 text-white/50 hover:text-luxury-gold hover:rotate-90 hover:scale-110 active:scale-95 transition-all duration-300 p-1.5 rounded-full hover:bg-white/5 border border-transparent hover:border-luxury-gold/30 hover:shadow-[0_0_15px_rgba(212,175,55,0.25)] cursor-pointer z-10"
          title="Close Details"
        >
          <X size={18} />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
          
          {/* Left Column: Premium Zoom Image with Multi-image Thumbnails */}
          <div className="space-y-4">
            <div className="w-full relative aspect-square bg-[#0c0c0c] rounded-xl overflow-hidden border border-white/5 flex items-center justify-center">
              <img 
                src={displayImage} 
                alt={product.title} 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-all duration-500 animate-fade-in"
              />
              {/* Visual gradient filter */}
              <div className="absolute inset-0 bg-gradient-to-t from-luxury-black/50 via-transparent to-transparent pointer-events-none"></div>
            </div>

            {/* Thumbnails of secondary images (Upload 2, 3 or more than image) */}
            {allImages.length > 1 && (
              <div className="flex gap-2.5 p-1 overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 select-none pb-2">
                {allImages.map((img, i) => (
                  <button
                    key={img + i}
                    type="button"
                    onClick={() => setActiveImgUrl(img)}
                    className={`w-14 h-14 rounded-lg overflow-hidden border transition-all duration-300 flex-shrink-0 relative cursor-pointer active:scale-95 ${
                      img === displayImage 
                        ? 'border-[#d4af37] shadow-[0_0_12px_rgba(212,175,55,0.4)] scale-105' 
                        : 'border-white/5 hover:border-white/20 hover:scale-105'
                    }`}
                  >
                    <img src={img} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Detailed Product Specs */}
          <div className="flex flex-col justify-between space-y-5">
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono tracking-[0.2em] text-luxury-gold uppercase bg-luxury-gold/10 border border-luxury-gold/20 px-3 py-1 rounded-full shadow-[0_0_15px_rgba(212,175,55,0.1)]">
                  {product.category} COLLECTION
                </span>
                <span className="text-[10px] font-mono text-white/35 tracking-widest">{product.code}</span>
              </div>

              <h2 className="font-serif text-2xl lg:text-3.5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-100 to-luxury-gold/90 tracking-wider leading-snug uppercase">
                {product.title}
              </h2>

              <p className="font-serif text-2xl font-black tracking-widest text-luxury-gold">
                {formatPrice(product.price)}
              </p>

              {/* Stock check progress visual */}
              <div className="border border-white/5 bg-[#090312]/60 p-4 rounded-xl shadow-inner backdrop-blur-sm">
                <div className="flex items-center justify-between text-[9px] uppercase font-mono text-white/50 tracking-widest mb-2">
                  <span>Stock availability:</span>
                  <span className={product.stock === 0 ? "text-red-400 font-bold animate-pulse" : product.stock < 15 ? "text-yellow-400 font-bold" : "text-emerald-400 font-black"}>
                    {product.stock === 0 ? "ARCHIVED / SOLD OUT" : `${product.stock} units left`}
                  </span>
                </div>
                {product.stock > 0 && (
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${product.stock < 10 ? 'bg-yellow-400' : 'bg-gradient-to-r from-luxury-purple via-luxury-gold to-emerald-400'}`}
                      style={{ width: `${Math.min(100, (product.stock / 350) * 100)}%` }}
                    ></div>
                  </div>
                )}
              </div>

              <div className="text-xs space-y-2.5 leading-relaxed border-t border-white/5 pt-4">
                <h4 className="font-display text-[9px] uppercase font-mono tracking-[0.25em] text-white/40 font-bold">Collection description</h4>
                <p className="font-serif italic font-light text-zinc-300 text-sm tracking-wide leading-relaxed">{product.description}</p>
                <div className="text-[10px] text-white/30 font-mono mt-1.5 tracking-wider uppercase flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-luxury-gold/50"></span>
                  <span>DIMENSIONS SPECIFIER: {product.dimensions || 'Dynamic Custom Fit'}</span>
                </div>
              </div>
            </div>

            {/* Sizes selector box */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="space-y-2.5 border-t border-white/5 pt-4">
                <p className="text-[9px] text-white/40 uppercase font-mono tracking-[0.25em] font-semibold">CHOOSE DIMENSIONS FIT</p>
                <div className="flex flex-wrap gap-2.5">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`h-10 min-w-10 px-5 rounded-xl text-xs font-display border uppercase tracking-[0.2em] flex items-center justify-center transition-all duration-300 cursor-pointer ${
                        selectedSize === size
                          ? 'bg-gradient-to-r from-luxury-purple-glowing via-[#7b2cbf] to-[#5a189a] text-white font-black border-[#9a4dff] shadow-[0_0_20px_rgba(154,77,255,0.6)] scale-105'
                          : 'bg-luxury-charcoal/30 text-white/60 border-white/5 hover:border-[#9a4dff]/40 hover:text-white hover:bg-[#100325]'
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
                  className="w-full border border-[#9A4DFF]/40 hover:border-luxury-purple-glowing bg-black/60 hover:bg-black/80 text-white text-[11px] font-display font-black uppercase tracking-[0.2em] py-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(154,77,255,0.25)] relative overflow-hidden luxury-reflection cursor-pointer"
                >
                  <ShoppingBag size={13} className="text-[#9A4DFF]" />
                  Add to Bag
                </button>

                <button
                  onClick={() => {
                    onOrderNow(product, selectedSize);
                    onClose();
                  }}
                  disabled={product.stock === 0}
                  className="w-full bg-gradient-to-r from-[#10b981] via-[#34d399] to-[#059669] text-black hover:brightness-110 font-display font-black text-[11px] uppercase tracking-[0.2em] py-4 rounded-xl transition-all duration-300 disabled:opacity-40 shadow-[0_0_15px_rgba(16,185,129,0.35)] hover:shadow-[0_0_30px_rgba(16,185,129,0.7)] hover:scale-[1.02] active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 relative overflow-hidden luxury-reflection"
                >
                  <span>👑</span>
                  <span>Buy Now</span>
                </button>
              </div>

              <button
                onClick={handleWhatsAppDirect}
                className="w-full border border-emerald-500/40 hover:border-emerald-400 bg-gradient-to-r from-[#03140b] via-[#062414] to-[#03140b] text-emerald-400 hover:text-emerald-300 text-[11px] font-display font-black uppercase tracking-[0.2em] py-4 rounded-xl flex items-center justify-center gap-2.5 transition-all duration-300 shadow-[0_4px_20px_rgba(16,185,129,0.15)] hover:shadow-[0_4px_30px_rgba(16,185,129,0.45)] hover:scale-[1.02] active:scale-95 cursor-pointer relative overflow-hidden group/wa"
              >
                <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover/wa:opacity-100 transition-opacity duration-300" />
                <Send size={14} className="text-emerald-400 group-hover/wa:animate-bounce" />
                <span>Order Via WhatsApp</span>
              </button>
            </div>

            {/* Automatic QR Code Share Section */}
            <div className="border-t border-white/5 pt-4 flex flex-col sm:flex-row items-center gap-4 bg-white/[0.02] p-4 rounded-xl border border-white/5">
              <div className="bg-black p-2 rounded-lg border border-luxury-gold/30 shadow-[0_0_15px_rgba(212,175,55,0.15)] flex-shrink-0">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&color=d4af37&bgcolor=000000&data=${encodeURIComponent(`${window.location.origin}/?productCode=${product.code}`)}`}
                  alt="Product QR code"
                  className="w-[110px] h-[110px] object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="space-y-1 text-center sm:text-left">
                <h5 className="text-[10px] font-mono uppercase tracking-[0.2em] text-luxury-gold font-bold flex items-center justify-center sm:justify-start gap-1">
                  🔳 Scan to instant order
                </h5>
                <p className="text-xs text-white/70 font-sans font-light leading-relaxed">
                  Scan this automatically generated QR code with any mobile scanner to instantly access or share the private deep link for this item.
                </p>
                <div className="text-[9px] font-mono text-[#9A4DFF] select-all break-all bg-black/40 px-2 py-1 rounded border border-white/5 inline-block">
                  {window.location.origin}/?productCode={product.code}
                </div>
              </div>
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

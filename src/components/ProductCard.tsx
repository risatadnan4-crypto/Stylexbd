import React, { useState } from 'react';
import { Heart, ChevronDown, ChevronUp, ShoppingBag, Eye, Send, Bell, Mail, X, Check, QrCode } from 'lucide-react';
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
  isNotifyMeDeactivated?: boolean;
}

export default function ProductCard({
  product,
  onAddToCart,
  onOrderNow,
  onProductClick,
  isWishlisted,
  onToggleWishlist,
  whatsappNumber = "8801755104443",
  isNotifyMeDeactivated = false
}: ProductCardProps) {
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes[0] || 'Standard');
  const [showQRCode, setShowQRCode] = useState(false);
  const [showWhyBuy, setShowWhyBuy] = useState(false);
  const [showNotifyForm, setShowNotifyForm] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifySuccess, setNotifySuccess] = useState(false);
  const [notifyError, setNotifyError] = useState('');
  const [submittingNotify, setSubmittingNotify] = useState(false);

  const handleNotifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyEmail || !notifyEmail.includes('@')) {
      setNotifyError("Please enter a valid email address.");
      return;
    }

    setSubmittingNotify(true);
    setNotifyError("");
    try {
      const response = await fetch("/api/notify-me", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: notifyEmail,
          productId: product.id,
          productTitle: product.title
        })
      });

      if (response.ok) {
        setNotifySuccess(true);
        setNotifyEmail('');
      } else {
        const errData = await response.json();
        setNotifyError(errData.error || "An error occurred. Please try again.");
      }
    } catch (err) {
      setNotifyError("Failed to register alert. Please try again.");
    } finally {
      setSubmittingNotify(false);
    }
  };

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

      {/* Automatic QR Code overlay */}
      {showQRCode && (
        <div className="absolute inset-0 bg-[#07010e]/95 backdrop-blur-md z-30 flex flex-col items-center justify-center p-3 transition-all duration-300">
          <button 
            onClick={() => setShowQRCode(false)}
            className="absolute top-3 right-3 text-white/50 hover:text-luxury-gold hover:rotate-90 transition-all p-1 rounded-full hover:bg-white/5"
            title="Close QR Scan Gateway"
          >
            <X size={16} />
          </button>
          <div className="bg-black p-2.5 rounded-xl border border-luxury-purple-glowing shadow-[0_0_20px_rgba(154,77,255,0.45)] mb-3">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&color=d4af37&bgcolor=000000&data=${encodeURIComponent(`${window.location.origin}/?productCode=${product.code}`)}`}
              alt={`${product.title} QR`}
              className="w-[110px] h-[110px] object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <h4 className="text-[9px] font-mono uppercase tracking-[0.2em] text-luxury-gold font-bold mb-1">IMPERIAL SCAN</h4>
          <p className="text-[10px] text-zinc-300 text-center px-1 line-clamp-2 italic leading-normal">
            Deep Link for <span className="font-semibold text-white">{product.title}</span>
          </p>
          <p className="text-[8px] text-[#9A4DFF] font-mono mt-2.5 bg-[#15032a] border border-[#9d4edd]/20 px-2 py-0.5 rounded tracking-wide max-w-full truncate select-all">
            {product.code}
          </p>
        </div>
      )}
      
      {/* Upper blueprint markings */}
      <div className="flex items-center justify-between text-[8px] sm:text-[10px] font-mono text-white/40 mb-1.5 sm:mb-2 gap-1 z-10">
        <span className="tracking-wider">{product.code}</span>
        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => setShowQRCode(true)}
            className="p-1 sm:p-1.5 rounded-full bg-[#15032a]/80 hover:bg-luxury-purple/20 border border-white/5 hover:border-luxury-purple/30 text-purple-300 hover:text-white transition-all cursor-pointer hover:scale-105"
            title="Scan Product QR Code"
          >
            <QrCode size={11} />
          </button>
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
          {/* Add to Cart replaced with Notify Me if out of stock */}
          {product.stock === 0 ? (
            isNotifyMeDeactivated ? (
              <button
                disabled
                className="relative w-full h-[40px] bg-neutral-950 border border-neutral-800/60 rounded-[14px] flex flex-col items-center justify-center cursor-not-allowed opacity-50 text-neutral-500 w-full overflow-hidden leading-none py-1"
              >
                <span className="relative z-10 text-[7px] font-mono tracking-[0.3em] uppercase font-black text-neutral-500">Out of</span>
                <span className="relative z-10 tracking-[0.12em] font-extrabold text-[11px] uppercase mt-[1px] text-neutral-400">Stock</span>
              </button>
            ) : (
              <button
                onClick={() => { setShowNotifyForm(true); setNotifySuccess(false); setNotifyError(''); }}
                className="relative w-full h-[40px] bg-gradient-to-r from-amber-950 via-[#271302] to-[#120801] border border-amber-500/50 hover:border-amber-400 rounded-[14px] flex flex-col items-center justify-center transition-all duration-300 shadow-[0_4px_12px_rgba(245,158,11,0.15)] hover:shadow-[0_0_20px_rgba(245,158,11,0.45)] hover:scale-[1.03] active:scale-[0.97] cursor-pointer w-full overflow-hidden leading-none py-1 group"
              >
                <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10 text-[7px] font-mono tracking-[0.3em] text-amber-400/80 uppercase font-black group-hover:text-amber-300 transition-colors">Notify</span>
                <span className="relative z-10 tracking-[0.12em] text-amber-100 font-extrabold text-[11px] uppercase drop-shadow-[0_0_8px_rgba(245,158,11,0.7)] mt-[1px] group-hover:text-white transition-colors">Me</span>
              </button>
            )
          ) : (
            <button
              onClick={() => onAddToCart(product, selectedSize)}
              disabled={product.stock === 0}
              className="relative w-full h-[40px] bg-gradient-to-r from-[#17083b] via-[#090317] to-[#12052c] border border-luxury-purple/70 hover:border-luxury-purple-glowing rounded-[14px] flex flex-col items-center justify-center transition-all duration-300 shadow-[0_4px_12px_rgba(154,77,255,0.2)] hover:shadow-[0_0_22px_rgba(154,77,255,0.55)] hover:scale-[1.03] active:scale-[0.97] cursor-pointer w-full overflow-hidden leading-none py-1 group/btn"
            >
              <div className="absolute inset-0 bg-luxury-purple/5 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
              <span className="relative z-10 text-[7px] font-mono tracking-[0.3em] text-purple-300/80 uppercase font-black group-hover/btn:text-purple-200 transition-colors">Add To</span>
              <span className="relative z-10 tracking-[0.12em] text-white font-extrabold text-[11px] uppercase drop-shadow-[0_0_8px_rgba(168,85,247,0.7)] mt-[1px] group-hover/btn:scale-105 transition-transform">Cart</span>
            </button>
          )}
          
          {/* Buy Now Premium Button */}
          {product.stock === 0 ? (
            <button
              disabled
              className="relative w-full h-[40px] bg-[#111] border border-neutral-800/60 rounded-[14px] flex flex-col items-center justify-center cursor-not-allowed opacity-50 text-neutral-500 w-full overflow-hidden leading-none py-1"
            >
              <span className="relative z-10 text-[7px] font-mono tracking-[0.3em] uppercase font-black text-neutral-500">Unavailable</span>
              <span className="relative z-10 tracking-[0.12em] font-extrabold text-[11px] uppercase mt-[1px] text-neutral-400">Sold Out</span>
            </button>
          ) : (
            <button
              onClick={() => onOrderNow(product, selectedSize)}
              className="relative w-full h-[40px] bg-gradient-to-br from-luxury-purple to-luxury-purple-glowing border border-luxury-purple/80 hover:border-luxury-purple-glowing rounded-[14px] flex items-center justify-center transition-all duration-300 shadow-[0_4px_16px_rgba(154,77,255,0.35)] hover:shadow-[0_0_25px_rgba(154,77,255,0.65)] hover:scale-[1.03] active:scale-[0.97] cursor-pointer w-full overflow-hidden group/buy"
            >
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover/buy:opacity-100 transition-opacity duration-300" />
              <span className="relative z-10 tracking-[0.15em] text-white font-display font-black text-[11px] uppercase">Order Now</span>
            </button>
          )}
        </div>

        {/* WhatsApp Direct Order */}
        <button
          onClick={handleWhatsAppDirect}
          className="w-full border border-emerald-500/35 hover:border-emerald-400 bg-gradient-to-r from-[#03140a] via-[#052814] to-[#03140a] text-emerald-400 hover:text-emerald-300 text-[9.5px] sm:text-[11.5px] font-display font-extrabold uppercase tracking-[0.12em] py-1.5 sm:py-3 rounded-lg sm:rounded-xl flex items-center justify-center gap-1.5 transition-all duration-300 shadow-[0_4px_15px_rgba(16,185,129,0.12)] hover:shadow-[0_4px_25px_rgba(16,185,129,0.35)] hover:scale-[1.02] active:scale-95 cursor-pointer relative overflow-hidden group/wa"
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

      {/* Restock Notification Form Slide-up Overlay */}
      {showNotifyForm && (
        <div className="absolute inset-x-0 bottom-0 bg-[#0c0516] border-t-2 border-purple-500/30 p-3.5 rounded-b-xl z-20 transition-all duration-300 flex flex-col gap-2 shadow-[0_-10px_35px_rgba(0,0,0,0.95)] animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
            <div className="flex items-center gap-1.5 text-amber-400 font-mono text-[9px] uppercase tracking-wider font-extrabold">
              <Bell size={11} className="animate-bounce text-amber-500" />
              <span>Restock Intel Alert</span>
            </div>
            <button
              onClick={() => { setShowNotifyForm(false); setNotifySuccess(false); setNotifyError(''); }}
              className="text-white/40 hover:text-white p-1 rounded-full hover:bg-white/5 transition-all cursor-pointer"
            >
              <X size={13} />
            </button>
          </div>

          {notifySuccess ? (
            <div className="flex flex-col items-center justify-center py-5 text-center space-y-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 animate-pulse">
                <Check size={16} />
              </div>
              <p className="text-[11px] text-emerald-300 font-mono font-semibold uppercase tracking-wider">ALERT LOCKED IN!</p>
              <p className="text-[9.5px] text-white/70 max-w-[190px] leading-tight">We'll alert your secure private email channel the second restock lands.</p>
              <button
                onClick={() => { setShowNotifyForm(false); setNotifySuccess(false); }}
                className="text-[9px] uppercase font-mono tracking-widest text-luxury-purple-glowing hover:text-white pt-1 bg-transparent border-0 cursor-pointer"
              >
                DISMISS
              </button>
            </div>
          ) : (
            <form onSubmit={handleNotifySubmit} className="space-y-2.5">
              <p className="text-[10px] text-purple-200/80 leading-relaxed font-sans">
                Save your email below. We'll automatically ping you when <strong className="text-white font-semibold">{product.title}</strong> is restocked.
              </p>
              
              <div className="relative">
                <Mail size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-purple-400/70" />
                <input
                  type="email"
                  required
                  placeholder="Enter your VIP email address"
                  value={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.value)}
                  className="w-full bg-[#150a24] border border-purple-500/30 rounded-lg pl-8 pr-2 py-1.5 text-[10.5px] text-white placeholder-purple-400/30 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all font-mono"
                />
              </div>

              {notifyError && (
                <p className="text-[9px] text-red-400 font-mono leading-tight">{notifyError}</p>
              )}

              <button
                type="submit"
                disabled={submittingNotify}
                className="w-full h-[32px] bg-gradient-to-r from-purple-600 to-luxury-purple-glowing hover:from-purple-500 hover:to-purple-400 text-white font-mono font-black text-[9.5px] uppercase tracking-wider rounded-lg flex items-center justify-center gap-1 shadow-[0_2px_8px_rgba(168,85,247,0.35)] hover:shadow-[0_2px_15px_rgba(168,85,247,0.6)] hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
              >
                {submittingNotify ? "Processing..." : "Notify When Back in Stock"}
              </button>
            </form>
          )}
        </div>
      )}

    </div>
  );
}

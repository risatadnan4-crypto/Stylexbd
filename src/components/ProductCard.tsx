import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, ChevronDown, ChevronUp, ShoppingBag, Eye, Send, Bell, Mail, X, Check, QrCode, MessageSquare, Sparkles, Truck, ThumbsUp } from 'lucide-react';
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
  globalDeliveryDays?: string;
  currentCustomer?: any;
  onAuthRequired?: () => void;
  viewMode?: 'GRID' | 'LIST';
  index?: number;
}

export default function ProductCard({
  product,
  onAddToCart,
  onOrderNow,
  onProductClick,
  isWishlisted,
  onToggleWishlist,
  whatsappNumber = "8801755104443",
  isNotifyMeDeactivated = false,
  globalDeliveryDays,
  currentCustomer,
  onAuthRequired,
  viewMode = 'GRID',
  index,
}: ProductCardProps) {
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes[0] || 'Standard');
  const [showQRCode, setShowQRCode] = useState(false);
  const [showWhyBuy, setShowWhyBuy] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [activeImage, setActiveImage] = useState(product.imageUrl);

  const isMobileListMode = viewMode === 'LIST';

  // Out of stock notify states
  const [showNotifyForm, setShowNotifyForm] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifySuccess, setNotifySuccess] = useState(false);
  const [notifyError, setNotifyError] = useState('');
  const [submittingNotify, setSubmittingNotify] = useState(false);

  // Sync active image with product url changes
  useEffect(() => {
    setActiveImage(product.imageUrl);
  }, [product.imageUrl]);

  // Real-time flash sale countdown timer ticking logic
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number; days: number } | null>(null);
  const [timerExpired, setTimerExpired] = useState(false);

  const hasActiveOffer = product.offerPrice !== undefined && product.offerPrice !== null;

  const [likesCount, setLikesCount] = useState(product.likes || 0);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    setLikesCount(product.likes || 0);
  }, [product.likes]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (liked) return;

    setLiked(true);
    setLikesCount(prev => prev + 1);

    try {
      const response = await fetch(`/api/products/${product.id}/like`, {
        method: "POST"
      });
      if (response.ok) {
        const resData = await response.json();
        if (resData.success) {
          setLikesCount(resData.likes);
        }
      }
    } catch (err) {
      console.error("Failed to register like:", err);
    }
  };

  useEffect(() => {
    if (!product.timerEndTime || product.timerActive === false) {
      setTimeLeft(null);
      setTimerExpired(false);
      return;
    }

    const calculateTimeLeft = () => {
      const rawStr = String(product.timerEndTime!).trim();
      const normalized = rawStr.replace(' ', 'T');
      let end = new Date(normalized).getTime();
      if (isNaN(end)) {
        end = new Date(rawStr).getTime();
      }
      if (isNaN(end)) {
        setTimeLeft(null);
        setTimerExpired(true);
        return true;
      }
      const now = new Date().getTime();
      const difference = end - now;

      if (difference <= 0) {
        setTimeLeft(null);
        setTimerExpired(true);
        return true; // indicates expired
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds });
        setTimerExpired(false);
        return false;
      }
    };

    const isExpired = calculateTimeLeft();
    if (isExpired) return;

    const interval = setInterval(() => {
      const expired = calculateTimeLeft();
      if (expired) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [product.timerEndTime, product.timerActive, product.id]);

  // Handle restock registration submit
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
        // Save to localStorage
        try {
          const localKey = "style_x_restock_notifications";
          const existing = JSON.parse(localStorage.getItem(localKey) || "[]");
          const duplicate = existing.some((n: any) => n.email === notifyEmail && n.productId === product.id);
          if (!duplicate) {
            existing.push({
              email: notifyEmail,
              productId: product.id,
              productTitle: product.title,
              productCode: product.code,
              requestedAt: new Date().toISOString()
            });
            localStorage.setItem(localKey, JSON.stringify(existing));
          }
        } catch (storageErr) {
          console.error("Failed to write restock notification to localStorage:", storageErr);
        }

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

  const allImages = [product.imageUrl, ...(product.images || [])].filter(Boolean);
  const shareUrl = `${window.location.origin}/?productCode=${product.code}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(shareUrl)}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      style={{ willChange: "transform, opacity" }}
      className="group relative bg-[#090312]/90 backdrop-blur-md border border-luxury-gold/50 hover:border-luxury-gold rounded-2xl p-2 sm:p-2.5 flex flex-col justify-between hover:shadow-[0_0_25px_rgba(212,175,55,0.25)] transition-all duration-300 select-none h-full shadow-[0_4px_30px_rgba(0,0,0,0.8)]"
    >
      
      {/* Top Header bar with Product Code & Icons */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] sm:text-xs font-mono text-zinc-500 tracking-wider uppercase font-semibold">
          {product.code}
        </span>
        <div className={`items-center gap-1.5 z-20 ${isMobileListMode ? 'hidden sm:flex' : 'flex'}`}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowQRCode(!showQRCode);
            }}
            className="p-1.5 rounded-full bg-black/80 border border-luxury-gold/30 hover:border-luxury-gold text-luxury-gold hover:text-white transition-all shadow-md cursor-pointer"
            title="Scan QR Code"
          >
            <QrCode size={13} />
          </button>
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist(product);
            }}
            className={`p-1.5 rounded-full bg-black/80 border border-luxury-gold/30 hover:border-luxury-gold transition-all cursor-pointer shadow-md ${
              isWishlisted ? 'text-luxury-gold' : 'text-white/60 hover:text-white'
            }`}
            title="Wishlist piece"
          >
            <Heart size={13} fill={isWishlisted ? '#D4AF37' : 'none'} className={isWishlisted ? 'animate-pulse' : ''} />
          </button>
          
          <button 
            type="button"
            onClick={handleLike}
            className={`p-1.5 px-2.5 rounded-full bg-black/80 border transition-all cursor-pointer shadow-md flex items-center gap-1.5 text-[9px] sm:text-[10px] font-mono font-black ${
              liked 
                ? 'text-pink-500 border-pink-500/40 bg-pink-500/10 hover:border-pink-500' 
                : 'text-zinc-400 hover:text-white border-luxury-gold/30 hover:border-luxury-gold'
            }`}
            title="Like this masterpiece"
          >
            <motion.div
              animate={liked ? { scale: [1, 1.4, 1] } : {}}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="flex items-center"
            >
              <ThumbsUp size={10} className={liked ? 'fill-pink-500 stroke-pink-500' : ''} />
            </motion.div>
            <span className={liked ? 'text-pink-400' : 'text-luxury-gold'}>{likesCount}</span>
          </button>
        </div>
      </div>

      {/* Product Image Frame with Solid Gold Border */}
      <div 
        className="relative w-full aspect-square overflow-hidden rounded-xl bg-black/90 border border-luxury-gold/50 group-hover:border-luxury-gold flex items-center justify-center group cursor-pointer mb-2 shadow-inner p-1 sm:p-1.5"
      >
        <div className="absolute inset-0 z-0" onClick={() => onProductClick(product)} />
        
        {/* Premium Floating Free Delivery Badge */}
        {product.freeDelivery && (
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product, selectedSize);
            }}
            className="absolute top-2 left-2 z-20 flex items-center gap-1 bg-emerald-500/90 hover:bg-emerald-500 backdrop-blur-md text-white text-[7px] sm:text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)] border border-emerald-400/30 cursor-pointer active:scale-95 transition-all"
            title="Add to Cart & Open Cart"
          >
            <ShoppingBag size={9} className="animate-pulse" />
            <span>FREE DELIVERY</span>
          </button>
        )}

        {/* Premium Floating Limited Stock Badge */}
        {product.stock > 0 && product.stock < 5 && (
          <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5 bg-amber-600/95 backdrop-blur-md text-white text-[7.5px] sm:text-[8.5px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.6)] border border-amber-400/40 select-none animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
            <span>ONLY {product.stock} LEFT</span>
          </div>
        )}
        
        {!imageLoaded && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-950">
            <div className="w-8 h-8 rounded-full border-2 border-luxury-gold/20 border-t-luxury-gold animate-spin" />
          </div>
        )}
        <img 
          src={activeImage} 
          alt={(product as any).seoAltText || `${product.title} - Authentic Luxury ${product.category || 'Apparel'} | STYLE X BD`} 
          loading={product.isPinned || (index !== undefined && index < 6) ? "eager" : "lazy"}
          {...((product.isPinned || (index !== undefined && index < 6)) ? { fetchPriority: "high" } : {})}
          onLoad={() => setImageLoaded(true)}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 z-10 pointer-events-none"
          referrerPolicy="no-referrer"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-85 z-10 pointer-events-none" />

        {/* Floating Quick View (Eye icon) */}
        <div className={`absolute bottom-3 right-3 z-20 gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${isMobileListMode ? 'hidden sm:flex' : 'flex'}`}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onProductClick(product);
            }}
            className="p-1.5 rounded bg-black/85 hover:bg-luxury-gold text-white hover:text-black border border-luxury-gold/40 transition-all shadow-md"
            title="Quick View"
          >
            <Eye size={12} />
          </button>
        </div>

        {/* TRENDING Badge on the bottom-left of the image */}
        <div className="absolute bottom-2 left-2 bg-black/85 border border-luxury-gold/30 rounded-full px-2 py-0.5 flex items-center gap-1 text-[8px] sm:text-[9px] font-mono tracking-widest text-white shadow-md z-20">
          <span className="w-1.5 h-1.5 rounded-full bg-luxury-gold animate-pulse shadow-[0_0_6px_#D4AF37]"></span>
          <span>TRENDING</span>
        </div>

        {/* ASK XORO Button on the bottom-right of the image */}
        <button 
          onClick={(e) => { 
            e.stopPropagation(); 
            window.dispatchEvent(new CustomEvent('ask-xoro', { detail: product })); 
          }} 
          className={`absolute bottom-2 right-2 bg-black/85 hover:bg-luxury-gold/15 border border-luxury-gold/50 text-luxury-gold hover:text-white px-2 py-0.5 rounded-full items-center gap-1 text-[8px] sm:text-[9px] font-mono font-bold tracking-wider transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer z-20 ${isMobileListMode ? 'hidden sm:flex' : 'flex'}`}
        >
          <Sparkles size={10} className="text-luxury-gold" />
          <span>ASK XORO</span>
        </button>

        {/* Thumbnail overlays on Hover (if multiple images exist) */}
        {allImages.length > 1 && (
          <div className={`absolute bottom-8 left-2 z-20 gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${isMobileListMode ? 'hidden sm:flex' : 'flex'}`}>
            {allImages.slice(0, 3).map((img, idx) => (
              <button
                key={idx}
                type="button"
                onMouseEnter={() => setActiveImage(img)}
                className={`w-5 h-5 rounded-sm overflow-hidden border bg-black/50 p-0.5 transition-all ${
                  activeImage === img ? 'border-luxury-gold scale-110' : 'border-white/10 hover:border-white/40'
                }`}
              >
                <img src={img} alt={`${product.title} view ${idx + 1}`} loading="lazy" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              </button>
            ))}
          </div>
        )}

        {/* QR Code Popover Overlay */}
        <AnimatePresence>
          {showQRCode && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 z-30 bg-black/95 flex flex-col items-center justify-center p-3 text-center rounded-lg border border-luxury-gold/40"
            >
              <button
                type="button"
                onClick={() => setShowQRCode(false)}
                className="absolute top-2 right-2 text-white/60 hover:text-white"
              >
                <X size={14} />
              </button>
              <span className="text-[9px] font-serif text-luxury-gold font-bold uppercase tracking-wider mb-1.5">SCAN TO DISCOVER / ORDER</span>
              <div className="bg-white p-1 rounded border border-luxury-gold/25 shadow-lg">
                <img src={qrCodeUrl} alt="Product QR Code" className="w-24 h-24" />
              </div>
              <span className="text-[7px] text-white/50 font-mono mt-1.5 tracking-tight break-all line-clamp-1">{product.code}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Info Block */}
      <div className="space-y-1 sm:space-y-1.5 flex-1 flex flex-col justify-between">
        <div>
          {(() => {
            const originalPrice = product.price;
            const sellingPrice = hasActiveOffer ? product.offerPrice! : product.price;
            const discountPercent = originalPrice > 0 ? Math.round(((originalPrice - sellingPrice) / originalPrice) * 100) : 0;
            if (discountPercent > 0) {
              return (
                <div className="absolute top-10 left-3.5 z-30 pointer-events-none">
                  <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#FF2D55] text-white flex flex-col items-center justify-center text-[9px] sm:text-[10px] font-extrabold shadow-[0_2px_8px_rgba(255,45,85,0.45)] leading-tight select-none font-sans tracking-tight shrink-0 border border-red-500/10 animate-balloon-pop">
                    <span>-{discountPercent}%</span>
                  </span>
                </div>
              );
            }
            return null;
          })()}
          <h3 
            onClick={() => onProductClick(product)}
            className="font-serif text-sm sm:text-base font-bold text-white hover:text-luxury-gold transition-colors duration-300 line-clamp-1 cursor-pointer mb-0.5 text-left leading-tight"
          >
            {product.title}
          </h3>

          {/* Pricing & Exclusive tag / Flash Sale Badge */}
          <div className="flex items-center justify-between gap-2 border-t border-white/5 pt-2 px-1">
            <div className="flex items-baseline gap-2 flex-wrap min-w-0">
              {/* Current Price with perfectly aligned Taka symbol */}
              <div className="flex items-center gap-0.5 select-all font-sans">
                <span className="text-luxury-gold font-serif font-black text-sm sm:text-base md:text-lg leading-none select-none drop-shadow-[0_2px_15px_rgba(212,175,85,0.75)]">
                  ৳
                </span>
                <span className="text-luxury-gold font-sans font-black text-sm sm:text-base md:text-lg leading-none tracking-wide bg-gradient-to-r from-luxury-gold to-[#facc15] bg-clip-text text-transparent drop-shadow-[0_2px_15px_rgba(212,175,85,0.75)]">
                  {hasActiveOffer ? product.offerPrice : product.price}
                </span>
              </div>

              {/* Old Price & Discount Badge (on the right of current price) */}
              {hasActiveOffer && (
                <div className="flex items-center gap-1.5 flex-nowrap whitespace-nowrap">
                  <span className="text-luxury-gold font-sans font-black text-sm sm:text-base md:text-lg leading-none tracking-wide bg-gradient-to-r from-luxury-gold to-[#facc15] bg-clip-text text-transparent drop-shadow-[0_2px_15px_rgba(212,175,85,0.75)] line-through decoration-[#FF2D55] decoration-[1.5px] select-all opacity-85 shrink-0">
                    ৳{product.price}
                  </span>
                  {(() => {
                    const originalPrice = product.price;
                    const sellingPrice = product.offerPrice!;
                    const discountPercent = originalPrice > 0 ? Math.round(((originalPrice - sellingPrice) / originalPrice) * 100) : 0;
                    if (discountPercent > 0) {
                      return (
                        <span className="inline-flex items-center justify-center bg-gradient-to-r from-[#FF2D55] to-[#ff3b30] text-white text-[8.5px] sm:text-[9.5px] md:text-[10.5px] font-black px-1.5 py-0.5 rounded shadow-[0_2px_8px_rgba(255,45,85,0.5)] leading-none select-none tracking-wider uppercase shrink-0">
                          {discountPercent}% OFF
                        </span>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}
            </div>
            
            {(!hasActiveOffer && !product.timerEndTime) ? (
              <div className="bg-zinc-900/60 border border-zinc-800 px-1.5 py-0.5 rounded-full text-[8px] sm:text-[9px] text-zinc-400 font-mono uppercase tracking-wider shrink-0 self-center">
                ⚜️ EXCLUSIVE
              </div>
            ) : (
              <div className="bg-red-950/85 border border-red-500/30 px-1.5 py-0.5 rounded-full flex items-center gap-1 text-[8px] sm:text-[9px] text-red-400 font-mono font-bold shrink-0 self-center uppercase">
                <span className="w-1 h-1 rounded-full bg-red-500 animate-ping shadow-[0_0_4px_#ef4444]" />
                <span>{product.timerMessage || "FLASH SALE"}</span>
              </div>
            )}
          </div>

          {/* Large Countdown Timer Block - Perfect mobile-friendly full-width row */}
          {product.timerEndTime && product.timerActive !== false && !timerExpired && (
            <div className="bg-red-950/30 hover:bg-red-950/50 border border-red-500/20 hover:border-red-500/45 rounded-xl px-2 py-1 flex items-center justify-between gap-1 mt-1 transition-all duration-300">
              <div className="flex items-center gap-1 text-[8px] sm:text-[9px] text-red-400 uppercase tracking-widest font-extrabold shrink-0">
                <span>{product.timerMessage || "HURRY"}:</span>
              </div>
              <div className="flex items-center gap-0.5 sm:gap-1 font-mono text-[9px] sm:text-[11px] text-red-400 font-bold shrink-0 select-none">
                {timeLeft ? (
                  <>
                    {timeLeft.days > 0 && (
                      <>
                        <span className="text-white font-extrabold">{timeLeft.days}d</span>
                        <span className="text-red-500/40 font-bold">:</span>
                      </>
                    )}
                    <span className="text-white font-extrabold">{String(timeLeft.hours).padStart(2, '0')}h</span>
                    <span className="text-red-500/40 font-bold">:</span>
                    <span className="text-white font-extrabold">{String(timeLeft.minutes).padStart(2, '0')}m</span>
                    <span className="text-red-500/40 font-bold">:</span>
                    <span className="text-red-400 font-black animate-pulse">{String(timeLeft.seconds).padStart(2, '0')}s</span>
                  </>
                ) : (
                  <span className="text-zinc-500">00:00:00</span>
                )}
              </div>
            </div>
          )}

          {/* Stock Urgency Alert Capsule */}
          {product.stock > 0 && product.stock < 5 && (
            <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl py-0.5 px-1.5 flex items-center justify-center gap-1.5 text-[8px] sm:text-[9px] font-mono font-black text-amber-400 my-0.5 tracking-wide shadow-sm animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
              <span>⚠️ LIMITED STOCK: ONLY {product.stock} UNITS LEFT (সীমিত স্টক - দ্রুত অর্ডার করুন)</span>
            </div>
          )}

          {/* Delivery Row Capsule */}
          {product.freeDelivery ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(product, selectedSize);
              }}
              className="w-full bg-emerald-950/20 hover:bg-emerald-950/40 border border-emerald-500/20 hover:border-emerald-500/50 rounded-xl py-0.5 px-1.5 flex items-center justify-center gap-1 text-[8px] sm:text-[9px] font-mono font-extrabold text-emerald-400 my-0.5 tracking-wide shadow-sm cursor-pointer active:scale-95 transition-all"
              title="Add to Cart & Open Cart"
            >
              <ShoppingBag size={10} className="text-emerald-400 animate-pulse shrink-0" />
              <span>DELIVERY: FREE - {product.deliveryDays || globalDeliveryDays || '3-5 DAYS'} (ফ্রি ডেলিভারি)</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(product, selectedSize);
              }}
              className="w-full bg-purple-950/20 hover:bg-purple-950/40 border border-purple-500/20 hover:border-purple-500/50 rounded-xl py-0.5 px-1.5 flex items-center justify-center gap-1 text-[8px] sm:text-[9px] font-mono font-extrabold text-purple-400 my-0.5 tracking-wide shadow-sm cursor-pointer active:scale-95 transition-all"
              title="Add to Cart & Open Cart"
            >
              <ShoppingBag size={10} className="text-purple-400 animate-pulse shrink-0" />
              <span>DELIVERY: ৳{product.deliveryPriceDhaka !== undefined ? product.deliveryPriceDhaka : 100} (Dhaka) / ৳{product.deliveryPriceChattogram !== undefined ? product.deliveryPriceChattogram : 150} (Outside)</span>
            </button>
          )}



          {/* Expandable Why Buy? Area */}
          {product.whyBuy && (
            <div className={`border-t border-white/5 mt-1 pt-0.5 ${isMobileListMode ? 'hidden sm:block' : 'block'}`}>
              <button
                type="button"
                onClick={() => setShowWhyBuy(!showWhyBuy)}
                className="w-full flex items-center justify-between text-[8px] sm:text-[9px] text-white/50 hover:text-luxury-gold transition-colors font-sans py-0.5"
              >
                <span className="flex items-center gap-1 font-semibold">
                  <Sparkles size={8} className="text-luxury-gold" />
                  আপনি কেন এটি কিনবেন? (Why Buy This?)
                </span>
                {showWhyBuy ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
              </button>
              
              <AnimatePresence>
                {showWhyBuy && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="text-[8px] sm:text-[9px] text-white/70 bg-white/5 p-1.5 rounded border border-white/5 mt-1 leading-relaxed font-sans text-left">
                      {product.whyBuy}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Action Buttons Area */}
        <div className={`pt-0.5 mt-auto ${isMobileListMode ? 'hidden sm:block' : 'block'}`}>
          {product.stock === 0 ? (
            <div className="space-y-1.5">
              {!showNotifyForm ? (
                <button
                  type="button"
                  onClick={() => {
                    if (isNotifyMeDeactivated) {
                      const activePrice = hasActiveOffer ? product.offerPrice : product.price;
                      const wsMessage = `👑 *STYLE X EXCLUSIVE COLLECTION* 👑\n\nHello Style X Team, I'm interested in restock updates for:\n\n*Product:* ${product.title}\n*Code:* ${product.code}\n*Price:* ৳${activePrice}\n*Size Choice:* ${selectedSize}`;
                      const finalUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(wsMessage)}`;
                      window.open(finalUrl, '_blank');
                    } else {
                      setShowNotifyForm(true);
                    }
                  }}
                  className="w-full h-[36px] sm:h-[40px] bg-red-900/20 hover:bg-red-900/40 border border-red-500/30 hover:border-red-500/50 rounded-xl text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-red-200 transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer animate-pulse"
                >
                  <Bell size={12} className="text-red-400" />
                  <span>{isNotifyMeDeactivated ? 'Inquire Stock' : 'Notify Restock'}</span>
                </button>
              ) : (
                <form onSubmit={handleNotifySubmit} className="flex gap-2">
                  {notifySuccess ? (
                    <div className="w-full flex items-center justify-center gap-1.5 text-[9px] sm:text-[10px] text-green-400 border-2 border-emerald-500/20 bg-emerald-500/10 rounded-[12px] h-[40px] sm:h-[44px] font-bold shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                      <Check size={14} className="text-emerald-400" />
                      <span>Alert Registered!</span>
                    </div>
                  ) : (
                    <>
                      <input
                        type="email"
                        required
                        placeholder="Your Email"
                        value={notifyEmail}
                        onChange={(e) => setNotifyEmail(e.target.value)}
                        disabled={submittingNotify}
                        className="flex-1 h-[40px] sm:h-[44px] bg-white/[0.08] text-white font-sans text-xs sm:text-sm border-2 border-white/15 rounded-[12px] px-3.5 transition-all duration-300 ease-out focus:bg-white/[0.12] focus:scale-[1.01] hover:scale-[1.01] focus:border-[#FFD700] focus:shadow-[0_0_15px_rgba(255,215,0,0.3)] focus:outline-none placeholder-white/60"
                      />
                      <button
                        type="submit"
                        disabled={submittingNotify}
                        className="h-[40px] sm:h-[44px] bg-gradient-to-r from-[#FFD700] to-[#FFB700] hover:scale-105 hover:-translate-y-0.5 text-black px-4 rounded-[12px] text-xs font-bold transition-all duration-300 flex items-center justify-center shrink-0"
                      >
                        {submittingNotify ? '...' : <Send size={13} className="text-black" />}
                      </button>
                    </>
                  )}
                </form>
              )}
              {notifyError && (
                <p className="text-[7px] text-red-400 text-left px-1 mt-0.5">{notifyError}</p>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 mt-auto">
              {/* Add to Cart and Order Now split row */}
              <div className="grid grid-cols-2 gap-1.5">
                {/* Add To Cart button with single-line text layout */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToCart(product, selectedSize);
                  }}
                  className="running-glow-button rounded-xl py-1 px-1.5 flex items-center justify-center gap-1 sm:gap-1.5 transition-all duration-300 h-[38px] sm:h-[42px] cursor-pointer active:scale-95 group/btn relative overflow-hidden"
                >
                  {/* Premium Luxury Aura & Shimmering Stars Background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#1e0a35] via-[#0b0318] to-[#2b0e4a] opacity-95 transition-all duration-300 group-hover/btn:opacity-100 z-0" />
                  
                  {/* Slow-moving soft gradient light overlay */}
                  <div className="absolute -inset-2 bg-gradient-to-r from-luxury-gold/5 via-violet-600/15 to-luxury-gold/5 blur-sm opacity-60 z-0 group-hover/btn:opacity-100 transition-opacity duration-500" />
                  
                  {/* Elegant Golden Shimmer Sweep */}
                  <div className="luxury-glow-shimmer" />

                  {/* Sparkling premium celestial stars */}
                  <svg className="absolute top-1 left-2 w-2 h-2 text-[#D4AF37] animate-premium-star z-10" style={{ animationDelay: '0.1s' }} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4L12 0Z" />
                  </svg>
                  <svg className="absolute bottom-1 right-2.5 w-2.5 h-2.5 text-[#D4AF37] animate-premium-star z-10" style={{ animationDelay: '1.2s' }} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4L12 0Z" />
                  </svg>
                  <svg className="absolute top-1.5 right-6 w-1.5 h-1.5 text-white animate-premium-star z-10" style={{ animationDelay: '0.5s' }} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4L12 0Z" />
                  </svg>
                  <svg className="absolute bottom-1.5 left-6 w-1.5 h-1.5 text-white animate-premium-star z-10" style={{ animationDelay: '1.8s' }} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4L12 0Z" />
                  </svg>

                  <Sparkles size={11} className="text-[#D4AF37] relative z-10 animate-pulse shrink-0 drop-shadow-[0_0_3px_rgba(212,175,55,0.7)]" />
                  <span className="relative z-10 text-[8px] min-[350px]:text-[9px] sm:text-[11.5px] font-black tracking-normal min-[360px]:tracking-wide text-white uppercase leading-none drop-shadow-[0_0_4px_rgba(255,255,255,0.4)] whitespace-nowrap">
                    ADD TO CART
                  </span>
                </button>
                {/* Order Now gradient solid button with running glow */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOrderNow(product, selectedSize);
                  }}
                  className="running-glow-gold-filled text-white font-extrabold tracking-widest text-[11px] sm:text-[13px] uppercase rounded-xl flex items-center justify-center transition-all duration-300 h-[38px] sm:h-[42px] cursor-pointer active:scale-95 shadow-[0_0_15px_rgba(154,77,255,0.45)]"
                >
                  <span className="relative z-10 drop-shadow-[0_0_4px_rgba(255,255,255,0.6)] font-black">Order Now</span>
                </button>
              </div>

              {/* Order via WhatsApp full-width block */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const activePrice = hasActiveOffer ? product.offerPrice : product.price;
                  const wsMessage = `👑 *STYLE X EXCLUSIVE COLLECTION* 👑\n\nHello Style X Team, I'm interested in ordering:\n\n*Product:* ${product.title}\n*Code:* ${product.code}\n*Price:* ৳${activePrice}\n*Size Choice:* ${selectedSize}`;
                  const finalUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(wsMessage)}`;
                  window.open(finalUrl, '_blank');
                }}
                className="w-full bg-[#051c11]/50 hover:bg-[#072d1b]/70 border border-emerald-500/40 hover:border-emerald-400 rounded-xl flex items-center justify-center gap-1.5 transition-all duration-300 text-emerald-400 text-[10px] sm:text-[11.5px] font-black uppercase tracking-wider hover:shadow-[0_0_12px_rgba(16,185,129,0.25)] cursor-pointer active:scale-95 h-[38px] sm:h-[42px]"
              >
                <Send size={13} className="text-emerald-400 -rotate-45" />
                <span>ORDER VIA WHATSAPP</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

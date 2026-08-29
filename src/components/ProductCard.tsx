import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, ChevronDown, ChevronUp, ShoppingBag, Eye, Send, Bell, Mail, X, Check, QrCode, MessageSquare, Sparkles, Truck, ThumbsUp, ChevronLeft, ChevronRight, Images, Star } from 'lucide-react';
import { Product } from '../types';
import { formatPrice } from '../utils';
import { getProductPriceDetails } from '../utils/totalHelper';
import AnimatedAddToCartButton from './AnimatedAddToCartButton';

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
  reviews?: any[];
}

function ProductCard({
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
  reviews = [],
}: ProductCardProps) {
  const isMobileListMode = viewMode === 'LIST';

  const productReviews = React.useMemo(() => {
    return (reviews || []).filter((r: any) => r.productId === product.id && r.isApproved);
  }, [reviews, product.id]);

  const avgRating = React.useMemo(() => {
    if (productReviews.length === 0) return 0;
    const sum = productReviews.reduce((acc: number, r: any) => acc + (Number(r.rating) || 5), 0);
    return sum / productReviews.length;
  }, [productReviews]);

  const availableSizes = React.useMemo(() => {
    let list: string[] = [];
    if (Array.isArray(product.sizes) && product.sizes.length > 0) {
      list = product.sizes.filter(Boolean);
    } else if (typeof product.sizes === 'string' && (product.sizes as string).trim()) {
      try {
        const parsed = JSON.parse(product.sizes);
        if (Array.isArray(parsed) && parsed.length > 0) list = parsed.filter(Boolean);
      } catch (e) {}
      if (list.length === 0) {
        list = (product.sizes as string).split(',').map((s: string) => s.trim()).filter(Boolean);
      }
    }
    // Also check product.dimensions if it contains JSON payload with sizes
    if (list.length === 0 && product.dimensions && typeof product.dimensions === 'string' && product.dimensions.startsWith('{')) {
      try {
        const dimObj = JSON.parse(product.dimensions);
        if (Array.isArray(dimObj.sizes) && dimObj.sizes.length > 0) {
          list = dimObj.sizes.filter(Boolean);
        } else if (typeof dimObj.sizes === 'string' && dimObj.sizes.trim()) {
          list = dimObj.sizes.split(',').map((s: string) => s.trim()).filter(Boolean);
        }
      } catch (e) {}
    }
    return list.map(s => String(s).trim()).filter(s => s.length > 0 && s.toLowerCase() !== 'standard');
  }, [product.sizes, product.dimensions]);

  const [selectedSize, setSelectedSize] = useState<string>(() => availableSizes[0] || '');

  useEffect(() => {
    if (availableSizes.length > 0) {
      if (!selectedSize || !availableSizes.some(s => s.toUpperCase() === selectedSize.toUpperCase())) {
        setSelectedSize(availableSizes[0]);
      }
    } else {
      setSelectedSize('');
    }
  }, [availableSizes]);

  const allImages = useMemo(() => {
    const list: string[] = [];
    if (product.imageUrl && typeof product.imageUrl === 'string' && product.imageUrl.trim()) {
      list.push(product.imageUrl.trim());
    }
    if (Array.isArray(product.images)) {
      list.push(...product.images.filter(x => typeof x === 'string' && x.trim()));
    }
    if (product.dimensions && typeof product.dimensions === 'string' && product.dimensions.startsWith('{')) {
      try {
        const dimObj = JSON.parse(product.dimensions);
        if (Array.isArray(dimObj.images)) {
          list.push(...dimObj.images.filter((x: any) => typeof x === 'string' && x.trim()));
        }
      } catch (e) {}
    }
    const filtered = Array.from(new Set(list.filter(Boolean)));
    return filtered.length > 0 ? filtered : ['/stylex_logo.jpg'];
  }, [product.imageUrl, product.images, product.dimensions]);

  const [activeImage, setActiveImage] = useState<string>(() => allImages[0] || product.imageUrl || '/stylex_logo.jpg');
  const [showQRCode, setShowQRCode] = useState(false);
  const [showWhyBuy, setShowWhyBuy] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Out of stock notify states
  const [showNotifyForm, setShowNotifyForm] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifySuccess, setNotifySuccess] = useState(false);
  const [notifyError, setNotifyError] = useState('');
  const [submittingNotify, setSubmittingNotify] = useState(false);

  // Sync active image with product changes
  useEffect(() => {
    setActiveImage(allImages[0] || product.imageUrl || '/stylex_logo.jpg');
    setImageLoaded(false);
  }, [product.imageUrl, product.images, product.id, allImages]);

  // Real-time flash sale countdown timer ticking logic
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number; days: number } | null>(null);
  const [timerExpired, setTimerExpired] = useState(false);
  const [isPendingStart, setIsPendingStart] = useState(false);

  const priceDetails = getProductPriceDetails(product);
  const isTimerExpired = timerExpired || priceDetails.timerExpired;
  const hasActiveOffer = priceDetails.hasActiveOffer;
  const currentPrice = priceDetails.currentPrice;
  const originalPrice = priceDetails.originalPrice;
  const discountPercent = hasActiveOffer ? priceDetails.discountPercent : 0;

  const pSlug = product.seoSlug || product.slug || (product.title || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
  const productPathUrl = `/products/${pSlug || encodeURIComponent(product.code || product.id)}`;

  const rawKeywords = product.seo_keywords || product.seoKeywords || product.metaKeywords || '';
  const keywordTags = rawKeywords
    ? rawKeywords.split(',').map(tag => tag.trim()).filter(Boolean)
    : [];

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
    const endTimeVal = product.timerEndTime || product.timerEndDate;
    const startTimeVal = product.timerStartTime || product.timerStartDate;
    const isTimerActive = product.timerActive !== false && String(product.timerActive) !== 'false' &&
                          product.timerEnabled !== false && String(product.timerEnabled) !== 'false';

    if (!endTimeVal || !isTimerActive) {
      setTimeLeft(null);
      setTimerExpired(false);
      setIsPendingStart(false);
      return;
    }

    const calculateTimeLeft = () => {
      const rawStr = String(endTimeVal).trim();
      if (!rawStr) {
        setTimeLeft(null);
        setTimerExpired(true);
        setIsPendingStart(false);
        return true;
      }

      let end: number;
      if (/^\d{12,}$/.test(rawStr)) {
        end = Number(rawStr);
      } else if (/^\d{4}[-/]\d{2}[-/]\d{2}$/.test(rawStr)) {
        // Date-only string like YYYY-MM-DD: set to end of day local time
        end = new Date(rawStr.replace(/\//g, '-') + 'T23:59:59').getTime();
      } else {
        const normalized = rawStr.replace(' ', 'T');
        end = new Date(normalized).getTime();
        if (isNaN(end)) {
          end = new Date(rawStr).getTime();
        }
      }

      if (isNaN(end)) {
        setTimeLeft(null);
        setTimerExpired(true);
        setIsPendingStart(false);
        return true;
      }

      const now = new Date().getTime();

      // Check if start time is specified and in future
      if (startTimeVal) {
        const startRaw = String(startTimeVal).trim();
        let startMs = NaN;
        if (/^\d{12,}$/.test(startRaw)) {
          startMs = Number(startRaw);
        } else {
          startMs = new Date(startRaw.replace(' ', 'T')).getTime();
          if (isNaN(startMs)) startMs = new Date(startRaw).getTime();
        }
        if (!isNaN(startMs) && now < startMs) {
          const diff = startMs - now;
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setTimeLeft({ days, hours, minutes, seconds });
          setTimerExpired(false);
          setIsPendingStart(true);
          return false;
        }
      }

      setIsPendingStart(false);
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

    calculateTimeLeft();

    const interval = setInterval(() => {
      const expired = calculateTimeLeft();
      if (expired) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [product.timerEndTime, product.timerEndDate, product.timerStartTime, product.timerStartDate, product.timerActive, product.timerEnabled, product.id]);

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

  const currentImageIndex = Math.max(0, allImages.indexOf(activeImage));

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (allImages.length <= 1) return;
    const prevIdx = (currentImageIndex - 1 + allImages.length) % allImages.length;
    setActiveImage(allImages[prevIdx]);
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (allImages.length <= 1) return;
    const nextIdx = (currentImageIndex + 1) % allImages.length;
    setActiveImage(allImages[nextIdx]);
  };

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
            <Heart size={13} fill={isWishlisted ? 'var(--color-luxury-gold)' : 'none'} className={isWishlisted ? 'animate-pulse' : ''} />
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
        <a 
          href={productPathUrl}
          onClick={(e) => {
            e.preventDefault();
            onProductClick(product);
          }}
          className="absolute inset-0 z-[15] cursor-pointer pointer-events-auto touch-manipulation" 
        />
        
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
          src={activeImage || product.imageUrl || '/stylex_logo.jpg'} 
          alt={(product as any).seoAltText || `${product.title} - Authentic Luxury ${product.category || 'Apparel'} | STYLE X BD`} 
          loading={product.isPinned || (index !== undefined && index < 6) ? "eager" : "lazy"}
          {...((product.isPinned || (index !== undefined && index < 6)) ? { fetchPriority: "high" } : {})}
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            setImageLoaded(true);
            const target = e.currentTarget;
            if (!target.src.endsWith('/stylex_logo.jpg')) {
              target.src = '/stylex_logo.jpg';
            }
          }}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 z-10 pointer-events-none"
          referrerPolicy="no-referrer"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-85 z-10 pointer-events-none" />

        {/* Multi-Image Counter Badge (Top-left or beside free delivery) */}
        {allImages.length > 1 && (
          <div className="absolute top-2 left-2 z-20 flex items-center gap-1 bg-black/85 backdrop-blur-md text-luxury-gold text-[7.5px] sm:text-[8.5px] font-mono font-bold px-2 py-0.5 rounded-full border border-luxury-gold/40 shadow-md">
            <Images size={10} className="text-luxury-gold" />
            <span>{currentImageIndex + 1}/{allImages.length}</span>
          </div>
        )}

        {/* Multi-Image Left/Right Arrow Navigation Buttons */}
        {allImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrevImage}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 z-20 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-black/80 hover:bg-luxury-gold text-white hover:text-black border border-luxury-gold/40 flex items-center justify-center transition-all opacity-80 sm:opacity-0 group-hover:opacity-100 shadow-lg cursor-pointer active:scale-90"
              title="Previous photo"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              onClick={handleNextImage}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 z-20 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-black/80 hover:bg-luxury-gold text-white hover:text-black border border-luxury-gold/40 flex items-center justify-center transition-all opacity-80 sm:opacity-0 group-hover:opacity-100 shadow-lg cursor-pointer active:scale-90"
              title="Next photo"
            >
              <ChevronRight size={14} />
            </button>
          </>
        )}

        {/* Thumbnail Dots Navigation for Multiple Images */}
        {allImages.length > 1 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-full border border-white/10 shadow-md">
            {allImages.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImage(img);
                }}
                className={`transition-all rounded-full cursor-pointer ${
                  activeImage === img
                    ? 'w-3 h-1.5 bg-luxury-gold shadow-[0_0_6px_#d4af37]'
                    : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/80'
                }`}
                title={`View photo ${idx + 1}`}
              />
            ))}
          </div>
        )}

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
          <span className="w-1.5 h-1.5 rounded-full bg-luxury-gold animate-pulse shadow-[0_0_6px_var(--color-luxury-gold)]"></span>
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
          {discountPercent > 0 && (
            <div className="absolute top-10 left-3.5 z-30 pointer-events-none">
              <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#FF2D55] text-white flex flex-col items-center justify-center text-[9px] sm:text-[10px] font-extrabold shadow-[0_2px_8px_rgba(255,45,85,0.45)] leading-tight select-none font-sans tracking-tight shrink-0 border border-red-500/10 animate-balloon-pop">
                <span>-{discountPercent}%</span>
              </span>
            </div>
          )}
          <h3 className="font-serif text-sm sm:text-base font-bold text-white hover:text-luxury-gold transition-colors duration-300 line-clamp-1 mb-0.5 text-left leading-tight">
            <a 
              href={productPathUrl}
              onClick={(e) => {
                e.preventDefault();
                onProductClick(product);
              }}
              className="hover:text-luxury-gold text-white"
            >
              {product.title}
            </a>
          </h3>

          {/* Dynamic Star Rating Block */}
          <div className="flex items-center gap-1 mt-1 mb-2 select-none" id={`card-rating-${product.id}`}>
            <div className="flex text-luxury-gold gap-0.5">
              {[...Array(5)].map((_, i) => {
                const isFull = i < Math.floor(avgRating);
                const isHalf = !isFull && i < Math.ceil(avgRating) && avgRating % 1 !== 0;
                return (
                  <Star 
                    key={i} 
                    size={10} 
                    fill={isFull ? "#D4AF37" : "transparent"} 
                    className={`${isFull ? "text-luxury-gold" : isHalf ? "text-luxury-gold/70" : "text-white/10"}`} 
                  />
                );
              })}
            </div>
            <span className="text-[9.5px] font-mono text-white/50 tracking-wider">
              {avgRating > 0 ? `${avgRating.toFixed(1)} (${productReviews.length})` : "No reviews"}
            </span>
          </div>

          {/* SEO Keywords tags are indexed via SEOManager; removed from card visual render for a cleaner premium UI */}

          {/* Pricing & Exclusive tag / Flash Sale Badge */}
          <div className="flex items-center justify-between gap-2 border-t border-white/5 pt-2 px-1">
            <div className="flex items-baseline gap-2 flex-wrap min-w-0">
              {/* Current Price with perfectly aligned Taka symbol */}
              <div className="flex items-center gap-0.5 select-all font-sans">
                <span className="text-luxury-gold font-serif font-black text-sm sm:text-base md:text-lg leading-none select-none drop-shadow-[0_2px_15px_rgba(212,175,85,0.75)]">
                  ৳
                </span>
                <span className="text-luxury-gold font-sans font-black text-sm sm:text-base md:text-lg leading-none tracking-wide bg-gradient-to-r from-luxury-gold to-[#facc15] bg-clip-text text-transparent drop-shadow-[0_2px_15px_rgba(212,175,85,0.75)]">
                  {currentPrice}
                </span>
              </div>

              {/* Old Price & Discount Badge (on the right of current price) */}
              {hasActiveOffer && (
                <div className="flex items-center gap-1.5 flex-nowrap whitespace-nowrap">
                  <span className="text-luxury-gold font-sans font-black text-sm sm:text-base md:text-lg leading-none tracking-wide bg-gradient-to-r from-luxury-gold to-[#facc15] bg-clip-text text-transparent drop-shadow-[0_2px_15px_rgba(212,175,85,0.75)] line-through decoration-[#FF2D55] decoration-[2px] select-all opacity-85 shrink-0">
                    ৳{originalPrice}
                  </span>
                  {discountPercent > 0 && (
                    <span className="inline-flex items-center justify-center bg-gradient-to-r from-[#FF2D55] to-[#ff3b30] text-white text-[8.5px] sm:text-[9.5px] md:text-[10.5px] font-black px-1.5 py-0.5 rounded shadow-[0_2px_8px_rgba(255,45,85,0.5)] leading-none select-none tracking-wider uppercase shrink-0">
                      {discountPercent}% OFF
                    </span>
                  )}
                </div>
              )}
            </div>
            
            {hasActiveOffer ? (
              <div className="bg-red-950/85 border border-red-500/30 px-1.5 py-0.5 rounded-full flex items-center gap-1 text-[8px] sm:text-[9px] text-red-400 font-mono font-bold shrink-0 self-center uppercase">
                <span className="w-1 h-1 rounded-full bg-red-500 animate-ping shadow-[0_0_4px_#ef4444]" />
                <span>{product.timerMessage || "FLASH SALE"}</span>
              </div>
            ) : (
              <div className="bg-zinc-900/60 border border-zinc-800 px-1.5 py-0.5 rounded-full text-[8px] sm:text-[9px] text-zinc-400 font-mono uppercase tracking-wider shrink-0 self-center">
                {product.stock <= 5 && product.stock > 0 ? "🔥 LIMITED STOCK" : "⚜️ EXCLUSIVE"}
              </div>
            )}
          </div>

          {/* Large Countdown Timer Block - Bigger, high-visibility mobile-friendly full-width row */}
          {(product.timerEndTime || product.timerEndDate) &&
           product.timerActive !== false && String(product.timerActive) !== 'false' &&
           product.timerEnabled !== false && String(product.timerEnabled) !== 'false' &&
           !isTimerExpired && (
            <div className="bg-red-950/40 hover:bg-red-950/60 border border-red-500/30 hover:border-red-500/50 rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 flex items-center justify-between gap-1.5 mt-1.5 transition-all duration-300 shadow-[0_2px_12px_rgba(220,38,38,0.15)]">
              <div className="flex items-center gap-1.5 text-[9px] sm:text-[10.5px] text-red-400 uppercase tracking-wider font-black shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping shrink-0" />
                <span>
                  {isPendingStart ? "STARTS IN:" : (product.timerMessage || "HURRY:")}
                </span>
              </div>
              <div className="flex items-center gap-0.5 sm:gap-1 font-mono text-[11px] sm:text-[13px] text-red-400 font-extrabold shrink-0 select-none">
                {timeLeft ? (
                  <>
                    {timeLeft.days > 0 && (
                      <>
                        <span className="bg-black/60 border border-red-500/30 px-1 py-0.5 rounded text-white font-black text-[11px] sm:text-[13px]">{timeLeft.days}d</span>
                        <span className="text-red-500/60 font-bold">:</span>
                      </>
                    )}
                    <span className="bg-black/60 border border-red-500/30 px-1 py-0.5 rounded text-white font-black text-[11px] sm:text-[13px]">{String(timeLeft.hours).padStart(2, '0')}h</span>
                    <span className="text-red-500/60 font-bold">:</span>
                    <span className="bg-black/60 border border-red-500/30 px-1 py-0.5 rounded text-white font-black text-[11px] sm:text-[13px]">{String(timeLeft.minutes).padStart(2, '0')}m</span>
                    <span className="text-red-500/60 font-bold">:</span>
                    <span className="bg-red-950/90 border border-red-500/50 px-1 py-0.5 rounded text-red-400 font-black text-[11px] sm:text-[13px] animate-pulse">{String(timeLeft.seconds).padStart(2, '0')}s</span>
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

          {/* Interactive Available Sizes Selection Chips */}
          {availableSizes.length > 0 && (
            <div className="border-t border-purple-500/20 mt-2 pt-2 flex items-center justify-between gap-1.5 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-purple-400 via-fuchsia-400 to-indigo-400 animate-ping shadow-[0_0_8px_#c084fc]"></span>
                <span className="text-[9px] uppercase font-mono tracking-wider text-purple-300 font-bold">
                  Size:
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {availableSizes.map((sz: string) => {
                  const isSelected = selectedSize.trim().toUpperCase() === sz.trim().toUpperCase();
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSize(sz);
                      }}
                      className={`relative px-2.5 py-1 rounded-md text-[9.5px] sm:text-[10px] font-mono uppercase tracking-wider transition-all duration-300 transform active:scale-90 cursor-pointer overflow-hidden ${
                        isSelected
                          ? 'bg-gradient-to-r from-purple-600 via-fuchsia-500 to-indigo-600 text-white font-black border border-fuchsia-300/80 shadow-[0_0_15px_rgba(192,132,252,0.85)] scale-110 ring-2 ring-purple-400/60'
                          : 'bg-purple-950/40 text-purple-200/80 border border-purple-500/25 hover:border-purple-400/80 hover:text-white hover:bg-purple-900/50 hover:shadow-[0_0_10px_rgba(168,85,247,0.4)] hover:scale-105 font-medium'
                      }`}
                      title={`Select size ${sz}`}
                    >
                      <span className="relative z-10">{sz}</span>
                    </button>
                  );
                })}
              </div>
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
                      const activePrice = currentPrice;
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
                {/* Add To Cart button with animated paper plane send animation */}
                <AnimatedAddToCartButton
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToCart(product, selectedSize);
                  }}
                  label="Add To Cart"
                  addedLabel="Added!"
                  size="sm"
                />
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
                  const activePrice = currentPrice;
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

export default React.memo(ProductCard);

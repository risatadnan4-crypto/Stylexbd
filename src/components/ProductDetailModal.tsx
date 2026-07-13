import { useState, useEffect } from 'react';
import { X, Heart, ShieldAlert, ShoppingBag, Eye, Send, Share2, Copy, Check, Facebook, MessageCircle, Instagram } from 'lucide-react';
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
  isNotifyMeDeactivated?: boolean;
  globalDeliveryDays?: string;
}

export default function ProductDetailModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onOrderNow,
  isWishlisted,
  onToggleWishlist,
  whatsappNumber = "8801755104443",
  isNotifyMeDeactivated = false,
  globalDeliveryDays
}: ProductDetailModalProps) {
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes[0] || 'Standard');
  const [activeImgUrl, setActiveImgUrl] = useState<string | null>(null);
  const [prevProductId, setPrevProductId] = useState<string | null>(null);

  // Real-time flash sale countdown timer ticking logic in details modal
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number; days: number } | null>(null);
  const [timerExpired, setTimerExpired] = useState(false);

  const hasActiveOffer = product.offerPrice !== undefined && product.offerPrice !== null && (!product.timerEndTime || !timerExpired);

  // Hover-to-zoom magnifier states
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const [isZooming, setIsZooming] = useState(false);

  // Restock notify states
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
        // Save to localStorage as requested
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
          console.error("Failed to write to localStorage:", storageErr);
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

  useEffect(() => {
    if (!product.timerEndTime) {
      setTimeLeft(null);
      setTimerExpired(false);
      return;
    }

    const calculateTimeLeft = () => {
      const end = new Date(product.timerEndTime!).getTime();
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
  }, [product.timerEndTime, product.id]);

  const [copied, setCopied] = useState(false);
  const [copiedInstagram, setCopiedInstagram] = useState(false);
  const [showInstagramHelper, setShowInstagramHelper] = useState(false);

  const shareUrl = `${window.location.origin}/?productCode=${product.code}`;
  
  const getSharePrice = () => {
    if (hasActiveOffer) {
      return product.offerPrice;
    }
    return product.price;
  };

  const shareText = `👑 STYLE X EXCLUSIVE COLLECTION 👑\n\nCheckout this exquisite piece:\n\nProduct: ${product.title}\nCode: ${product.code}\nPrice: ৳${getSharePrice()}\n\nView details and secure order here:\n${shareUrl}`;

  const curatedInstagramText = `⚜️ STYLE X PRIVATE ARCHIVE ⚜️\nAcquiring: ${product.title} (${product.code})\nAn exquisite exploration of minimalist form and avant-garde structure.\n\nDiscover or secure private orders at:\n${shareUrl}`;

  const handleShareWhatsApp = () => {
    const finalUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(finalUrl, '_blank');
  };

  const handleShareFacebook = () => {
    const finalUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(finalUrl, '_blank');
  };

  const handleShareInstagram = () => {
    setShowInstagramHelper(!showInstagramHelper);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyInstagramCaption = () => {
    navigator.clipboard.writeText(curatedInstagramText);
    setCopiedInstagram(true);
    setTimeout(() => setCopiedInstagram(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: `Check out this gorgeous ${product.title} at STYLE X.`,
          url: shareUrl,
        });
      } catch (err) {
        console.warn("Native share failed or dismissed", err);
      }
    }
  };

  if (product && product.id !== prevProductId) {
    setPrevProductId(product.id);
    setActiveImgUrl(product.imageUrl);
  }

  if (!isOpen) return null;

  const displayImage = activeImgUrl || product.imageUrl;
  const allImages = [product.imageUrl, ...(product.images || [])].filter(Boolean);

  const handleWhatsAppDirect = () => {
    const activePrice = hasActiveOffer ? product.offerPrice : product.price;
    const wsMessage = `👑 *STYLE X EXCLUSIVE COLLECTION* 👑\n\nHello Style X Team, I am looking to acquire:\n\n*Product:* ${product.title}\n*Code:* ${product.code}\n*Price:* ৳${activePrice}\n*Size Choice:* ${selectedSize}\n\nCould you guide me regarding active courier times?\nThank you!`;
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
          <div className="space-y-4 w-full">
            <div 
              onMouseEnter={() => setIsZooming(true)}
              onMouseLeave={() => setIsZooming(false)}
              onMouseMove={(e) => {
                const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - left) / width) * 100;
                const y = ((e.clientY - top) / height) * 100;
                setZoomPos({ x, y });
              }}
              className="w-full relative aspect-square bg-[#0c0c0c] rounded-xl overflow-hidden border border-white/5 flex items-center justify-center cursor-zoom-in group/zoom p-4"
            >
              <img 
                src={displayImage} 
                alt={product.title} 
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain animate-fade-in"
                style={{
                  transformOrigin: isZooming ? `${zoomPos.x}% ${zoomPos.y}%` : 'center center',
                  transform: isZooming ? 'scale(2.25)' : 'scale(1)',
                  transition: isZooming ? 'transform 0.08s ease-out' : 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)'
                }}
              />
              {/* Visual gradient filter */}
              <div className="absolute inset-0 bg-gradient-to-t from-luxury-black/40 via-transparent to-transparent pointer-events-none z-0"></div>

              {/* Indicator badge */}
              <div className={`absolute bottom-3 left-1/2 transform -translate-x-1/2 bg-black/85 backdrop-blur-md border border-luxury-purple-glowing/30 text-[9px] font-mono uppercase tracking-[0.2em] px-2.5 py-1 rounded-full flex items-center gap-1.5 transition-all duration-300 pointer-events-none z-10 ${isZooming ? 'opacity-0 scale-95' : 'opacity-100'}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-luxury-purple-glowing animate-ping"></span>
                <span className="text-white/80 font-bold">Hover to Zoom Fabric</span>
              </div>
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
                    <img src={img} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-contain p-1" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            )}

            {/* Title and Category Header positioned below the product image/thumbnails */}
            <div className="space-y-2 border-t border-white/5 pt-4 mt-2 w-full">
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-mono tracking-normal text-luxury-gold uppercase bg-luxury-gold/10 border border-luxury-gold/20 px-3 py-1 rounded-full shadow-[0_0_15px_rgba(212,175,55,0.1)]">
                  {product.category.replace(/\s+/g, ' ')} COLLECTION
                </span>
                <span className="text-[10px] font-mono text-white/35 tracking-normal">{product.code.replace(/\s+/g, ' ')}</span>
              </div>

              <h2 
                className="font-serif text-lg lg:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-100 to-luxury-gold/90 uppercase"
                style={{ 
                  wordSpacing: 'normal', 
                  letterSpacing: 'normal', 
                  textAlign: 'left',
                  whiteSpace: 'normal',
                  wordBreak: 'normal',
                  overflowWrap: 'break-word',
                  display: 'block',
                  width: '100%',
                  maxWidth: 'none',
                  padding: '0',
                  margin: '0'
                }}
              >
                {product.title.trim().replace(/\s+/g, ' ')}
              </h2>
            </div>
          </div>

          {/* Right Column: Detailed Product Specs */}
          <div className="flex flex-col justify-between space-y-5">
            
            <div className="space-y-4">
              {hasActiveOffer ? (
                <div className="space-y-2 animate-fade-in">
                  <div className="flex items-baseline gap-3">
                    <span className="luxury-animated-price text-4xl font-black text-emerald-400 tracking-widest animate-pulse">
                      {formatPrice(product.offerPrice!)}
                    </span>
                    <span className="text-sm text-rose-500 line-through font-serif font-black decoration-white/30 decoration-[1.5px]">
                      {formatPrice(product.price)}
                    </span>
                  </div>
                  
                  {/* Countdown banner inside modal */}
                  {timeLeft && !timerExpired && (
                    <div className="p-3 bg-[#110825]/90 border border-luxury-gold/30 rounded-xl flex flex-col gap-2 relative overflow-hidden shadow-[0_0_20px_rgba(212,175,55,0.15)] gold-glow-border">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-luxury-gold/10 to-transparent -translate-x-full animate-luxury-pulse pointer-events-none" />
                      
                      {product.timerMessage && (
                        <div className="text-[10px] uppercase font-mono tracking-widest text-luxury-gold font-extrabold flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping inline-block" />
                          <span>{product.timerMessage}</span>
                        </div>
                      )}
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sans">
                        <span className="text-white/60 text-[10px] sm:text-xs uppercase tracking-widest font-black flex items-center gap-1.5 shrink-0 justify-center sm:justify-start">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                          TIME LEFT:
                        </span>
                        
                        <div className="flex items-center gap-1.5 sm:gap-2.5 font-mono justify-center sm:justify-end w-full sm:w-auto">
                          {timeLeft.days > 0 && (
                            <>
                              <div className="flex flex-col items-center">
                                <span className="bg-luxury-black/95 border border-luxury-gold/35 px-2.5 py-1.5 rounded-lg text-luxury-gold font-black min-w-[38px] sm:min-w-[44px] text-center text-sm sm:text-base shadow-[0_2px_10px_rgba(0,0,0,0.5)]">{String(timeLeft.days).padStart(2, '0')}</span>
                                <span className="text-[8px] sm:text-[9px] font-sans text-white/50 mt-1 uppercase tracking-wider font-extrabold">days</span>
                              </div>
                              <span className="text-luxury-gold/50 animate-pulse font-bold pb-4 sm:pb-5 text-sm sm:text-base">:</span>
                            </>
                          )}
                          
                          <div className="flex flex-col items-center">
                            <span className="bg-luxury-black/95 border border-luxury-gold/35 px-2.5 py-1.5 rounded-lg text-luxury-gold font-black min-w-[38px] sm:min-w-[44px] text-center text-sm sm:text-base shadow-[0_2px_10px_rgba(0,0,0,0.5)]">{String(timeLeft.hours).padStart(2, '0')}</span>
                            <span className="text-[8px] sm:text-[9px] font-sans text-white/50 mt-1 uppercase tracking-wider font-extrabold">hours</span>
                          </div>
                          <span className="text-luxury-gold/50 animate-pulse font-bold pb-4 sm:pb-5 text-sm sm:text-base">:</span>
                          
                          <div className="flex flex-col items-center">
                            <span className="bg-luxury-black/95 border border-luxury-gold/35 px-2.5 py-1.5 rounded-lg text-luxury-gold font-black min-w-[38px] sm:min-w-[44px] text-center text-sm sm:text-base shadow-[0_2px_10px_rgba(0,0,0,0.5)]">{String(timeLeft.minutes).padStart(2, '0')}</span>
                            <span className="text-[8px] sm:text-[9px] font-sans text-white/50 mt-1 uppercase tracking-wider font-extrabold">mins</span>
                          </div>
                          <span className="text-luxury-gold/50 animate-pulse font-bold pb-4 sm:pb-5 text-sm sm:text-base">:</span>
                          
                          <div className="flex flex-col items-center">
                            <span className="bg-luxury-black/95 border border-red-500/50 px-2.5 py-1.5 rounded-lg text-red-400 font-black min-w-[38px] sm:min-w-[44px] text-center text-sm sm:text-base shadow-[0_0_12px_rgba(239,68,68,0.25)]">{String(timeLeft.seconds).padStart(2, '0')}</span>
                            <span className="text-[8px] sm:text-[9px] font-sans text-red-400/80 mt-1 uppercase tracking-wider font-extrabold animate-pulse">secs</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="luxury-animated-price text-luxury-gold text-3xl font-black tracking-widest">
                  {formatPrice(product.price)}
                </p>
              )}

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

              {/* Dynamic Payment Policy Box */}
              <div className="border border-white/5 bg-[#0e071a]/50 p-4 rounded-xl shadow-inner backdrop-blur-sm space-y-2">
                <div className="flex items-center justify-between text-[9px] uppercase font-mono text-white/50 tracking-widest border-b border-white/5 pb-1.5">
                  <span>Payment Security Policy:</span>
                  <span className="text-[#ffd700] font-bold">SECURED GATEWAY</span>
                </div>
                {product.paymentType === 'full_advance' ? (
                  <div className="space-y-1">
                    <p className="text-xs font-serif font-semibold text-rose-300 uppercase tracking-wider">
                      👑 Full Advance Payment Required
                    </p>
                    <p className="text-[10px] text-zinc-300 leading-relaxed font-light">
                      To secure your bespoke creation order, full payment is required in advance.
                    </p>
                    {(product.bkashNumber || product.nagadNumber) && (
                      <div className="flex flex-wrap gap-2 pt-1 font-mono text-[9px]">
                        {product.bkashNumber && <span className="bg-pink-950/40 border border-pink-500/20 text-pink-300 px-2.5 py-1 rounded">bKash: {product.bkashNumber}</span>}
                        {product.nagadNumber && <span className="bg-amber-950/40 border border-amber-500/20 text-amber-300 px-2.5 py-1 rounded">Nagad: {product.nagadNumber}</span>}
                      </div>
                    )}
                  </div>
                ) : product.paymentType === 'delivery_charge' ? (
                  <div className="space-y-1">
                    <p className="text-xs font-serif font-semibold text-amber-300 uppercase tracking-wider">
                      📦 Delivery Charge Advance Required (৳{product.deliveryCharge || 100})
                    </p>
                    <p className="text-[10px] text-zinc-300 leading-relaxed font-light">
                      Pay the courier delivery charge of ৳{product.deliveryCharge || 100} in advance to confirm booking; the balance is paid cash-on-delivery.
                    </p>
                    {(product.bkashNumber || product.nagadNumber) && (
                      <div className="flex flex-wrap gap-2 pt-1 font-mono text-[9px]">
                        {product.bkashNumber && <span className="bg-pink-950/40 border border-pink-500/20 text-pink-300 px-2.5 py-1 rounded">bKash: {product.bkashNumber}</span>}
                        {product.nagadNumber && <span className="bg-amber-950/40 border border-amber-500/20 text-amber-300 px-2.5 py-1 rounded">Nagad: {product.nagadNumber}</span>}
                      </div>
                    )}
                  </div>
                ) : product.paymentType === 'percentage' ? (
                  <div className="space-y-1">
                    <p className="text-xs font-serif font-semibold text-purple-400 uppercase tracking-wider">
                      💎 Partial Advance Payment Required ({product.paymentPercentage || 10}%)
                    </p>
                    <p className="text-[10px] text-zinc-300 leading-relaxed font-light">
                      Pay {product.paymentPercentage || 10}% of the grand total in advance to confirm booking; the rest is paid cash-on-delivery.
                    </p>
                    {(product.bkashNumber || product.nagadNumber) && (
                      <div className="flex flex-wrap gap-2 pt-1 font-mono text-[9px]">
                        {product.bkashNumber && <span className="bg-pink-950/40 border border-pink-500/20 text-pink-300 px-2.5 py-1 rounded">bKash: {product.bkashNumber}</span>}
                        {product.nagadNumber && <span className="bg-amber-950/40 border border-amber-500/20 text-amber-300 px-2.5 py-1 rounded">Nagad: {product.nagadNumber}</span>}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-xs font-serif font-semibold text-emerald-400 uppercase tracking-wider">
                      ⚜️ 100% Cash on Delivery Available
                    </p>
                    <p className="text-[10px] text-zinc-300 leading-relaxed font-light">
                      No advance payment needed. Pay in full upon physical handoff at delivery.
                    </p>
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
                      className={`h-10 min-w-10 px-5 rounded-xl text-xs font-display border uppercase tracking-[0.2em] flex items-center justify-center cursor-pointer transition-all ${
                        selectedSize === size
                          ? 'luxury-size-btn-active scale-105 shadow-[0_0_20px_rgba(154,77,255,0.75)]'
                          : 'luxury-size-btn-inactive'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Delivery Duration Indicator */}
            {product.freeDelivery ? (
              <div className="flex items-center gap-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 px-4 w-full sm:w-fit justify-center sm:justify-start animate-fade-in mt-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                <span className="text-[11px] sm:text-xs font-mono text-emerald-300 font-bold uppercase tracking-wide sm:tracking-widest leading-normal">
                  🚀 Delivery: FREE - {globalDeliveryDays || product.deliveryDays || "3-5"} Days (ফ্রি ডেলিভারি)
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 px-4 w-full sm:w-fit justify-center sm:justify-start animate-fade-in mt-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse flex-shrink-0" />
                <span className="text-[11px] sm:text-xs font-mono text-purple-300 font-bold uppercase tracking-wide sm:tracking-widest leading-normal">
                  🚀 Delivery: ৳{product.deliveryPriceDhaka !== undefined ? product.deliveryPriceDhaka : 100} (Dhaka) / ৳{product.deliveryPriceChattogram !== undefined ? product.deliveryPriceChattogram : 150} (Outside) - {globalDeliveryDays || product.deliveryDays || "3-5"} Days
                </span>
              </div>
            )}

            {/* Direct ordering actions */}
            {product.stock === 0 ? (
              <div className="space-y-2 w-full">
                {isNotifyMeDeactivated ? (
                  <button
                    disabled
                    className="w-full bg-neutral-950 border border-neutral-800/60 text-neutral-500 text-[11px] font-display font-black uppercase tracking-[0.2em] py-4 rounded-xl flex items-center justify-center gap-2 cursor-not-allowed opacity-50 animate-fade-in"
                  >
                    👑 Sold Out / Unavailable
                  </button>
                ) : showNotifyForm ? (
                  <div className="bg-white/[0.08] backdrop-blur-[20px] border border-white/15 p-5 rounded-[24px] space-y-4 shadow-[0_25px_60px_rgba(0,0,0,0.35)] animate-fade-in">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <div className="flex items-center gap-1.5 text-[#FFD700] font-mono text-[10px] uppercase tracking-wider font-extrabold">
                        <span>Restock Intel Alert</span>
                      </div>
                      <button
                        onClick={() => { setShowNotifyForm(false); setNotifySuccess(false); setNotifyError(''); }}
                        className="text-white/40 hover:text-white p-1 rounded-full hover:bg-white/10 transition-all cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    {notifySuccess ? (
                      <div className="flex flex-col items-center justify-center py-4 text-center space-y-2.5">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-400 animate-pulse">
                          <Check size={20} />
                        </div>
                        <p className="text-xs text-emerald-300 font-mono font-bold uppercase tracking-wider">ALERT LOCKED IN!</p>
                        <p className="text-[11px] text-white/70 leading-relaxed px-4">We'll alert your secure private email channel the second restock lands.</p>
                      </div>
                    ) : (
                      <form onSubmit={handleNotifySubmit} className="space-y-4">
                        <p className="text-[11px] text-white/60 leading-relaxed font-sans">
                          Save your email below. We'll automatically ping you when <strong className="text-white font-semibold">{product.title}</strong> is restocked.
                        </p>
                        
                        <div className="relative text-left">
                          <label className="block text-xs font-semibold text-white pl-0.5 mb-1.5">
                            VIP Email Address
                          </label>
                          <input
                            type="email"
                            required
                            placeholder="Enter your VIP email address"
                            value={notifyEmail}
                            onChange={(e) => setNotifyEmail(e.target.value)}
                            className="w-full h-[56px] bg-white/[0.08] text-white text-[16px] border-2 border-white/15 rounded-[16px] py-[16px] px-[18px] transition-all duration-300 ease-out focus:bg-white/[0.12] focus:scale-[1.01] hover:scale-[1.01] focus:border-[#FFD700] focus:shadow-[0_0_15px_rgba(255,215,0,0.3)] focus:outline-none placeholder-white/60 font-sans font-medium"
                          />
                        </div>

                        {notifyError && (
                          <p className="text-[10px] text-red-400 font-mono leading-tight pl-0.5">⚠️ {notifyError}</p>
                        )}

                        <button
                          type="submit"
                          disabled={submittingNotify}
                          className="w-full h-[56px] bg-gradient-to-r from-[#FFD700] to-[#FFB700] text-black font-bold text-sm uppercase tracking-widest rounded-[18px] hover:scale-[1.01] hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(255,215,0,0.4)] flex items-center justify-center gap-1.5 transition-all duration-300 cursor-pointer disabled:opacity-50"
                        >
                          {submittingNotify ? "Processing..." : "Notify When Back in Stock"}
                        </button>
                      </form>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => { setShowNotifyForm(true); setNotifySuccess(false); setNotifyError(''); }}
                    className="w-full bg-gradient-to-r from-[#241245] via-[#3a1a6f] to-[#241245] border border-purple-500/50 hover:border-purple-400 text-purple-200 hover:text-white text-[11px] font-display font-black uppercase tracking-[0.2em] py-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(154,77,255,0.35)] cursor-pointer animate-fade-in"
                  >
                    🔔 Notify Me When Available
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="grid grid-cols-1 min-[440px]:grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      onAddToCart(product, selectedSize);
                      onClose();
                    }}
                    className="w-full running-glow-button text-white text-[10px] min-[440px]:text-[11px] font-display font-black uppercase tracking-[0.12em] min-[440px]:tracking-[0.2em] py-3.5 sm:py-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                  >
                    <ShoppingBag size={13} className="text-[#9A4DFF] relative z-10" />
                    <span className="relative z-10">Add to Bag</span>
                  </button>

                  <button
                    onClick={() => {
                      onOrderNow(product, selectedSize);
                      onClose();
                    }}
                    className="w-full running-glow-gold-filled text-white font-display font-black text-[10px] min-[440px]:text-[11px] uppercase tracking-[0.12em] min-[440px]:tracking-[0.2em] py-3.5 sm:py-4 rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(154,77,255,0.45)] hover:scale-[1.02] active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span className="relative z-10">👑</span>
                    <span className="relative z-10">Buy Now</span>
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
            )}

            {/* Exquisite Social Sharing Section */}
            <div className="border-t border-white/5 pt-4 space-y-3">
              <h4 className="font-display text-[9px] uppercase font-mono tracking-[0.25em] text-white/40 font-bold">Share with your circle</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* WhatsApp button */}
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/40 text-xs font-mono tracking-wider uppercase transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                >
                  <MessageCircle size={14} />
                  <span>WhatsApp</span>
                </button>

                {/* Facebook button */}
                <button
                  type="button"
                  onClick={handleShareFacebook}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-600/20 hover:border-blue-600/40 text-xs font-mono tracking-wider uppercase transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                >
                  <Facebook size={14} />
                  <span>Facebook</span>
                </button>

                {/* Instagram button */}
                <button
                  type="button"
                  onClick={handleShareInstagram}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border text-xs font-mono tracking-wider uppercase transition-all duration-300 hover:scale-[1.02] cursor-pointer ${
                    showInstagramHelper
                      ? 'bg-pink-500/20 text-pink-300 border-pink-500/40 shadow-[0_0_15px_rgba(236,72,153,0.3)] font-bold'
                      : 'bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 border-pink-500/20 hover:border-pink-500/40'
                  }`}
                >
                  <Instagram size={14} />
                  <span>Instagram</span>
                </button>
              </div>

              {/* Standard Share / Copy Link quick bar */}
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex-1 flex items-center justify-between py-2.5 px-3.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 text-xs text-white/70 font-mono transition-all duration-300 cursor-pointer overflow-hidden"
                >
                  <span className="truncate select-all text-left text-white/50 w-full pr-4">{shareUrl}</span>
                  <div className="flex items-center gap-1 text-[10px] text-luxury-gold uppercase font-bold flex-shrink-0 ml-2">
                    {copied ? (
                      <>
                        <Check size={11} className="text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={11} />
                        <span>Copy Link</span>
                      </>
                    )}
                  </div>
                </button>

                {typeof navigator !== 'undefined' && navigator.share && (
                  <button
                    type="button"
                    onClick={handleNativeShare}
                    className="px-3.5 rounded-lg bg-luxury-gold/10 hover:bg-luxury-gold/20 text-luxury-gold border border-luxury-gold/20 hover:border-luxury-gold/40 flex items-center justify-center cursor-pointer transition-all duration-300"
                    title="More Share Options"
                  >
                    <Share2 size={14} />
                  </button>
                )}
              </div>

              {/* Instagram curated caption helper tray */}
              {showInstagramHelper && (
                <div className="p-3 bg-[#0a0512] rounded-lg border border-pink-500/20 animate-fade-in text-xs space-y-2">
                  <div className="flex items-center justify-between text-[9px] uppercase font-mono tracking-widest text-pink-400 font-bold">
                    <span>📸 Curated Instagram Caption</span>
                    <button 
                      type="button"
                      onClick={() => setShowInstagramHelper(false)}
                      className="text-white/40 hover:text-white cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-white/80 italic font-serif leading-relaxed p-2 bg-black/40 rounded border border-white/5 select-all font-light whitespace-pre-wrap">
                    {curatedInstagramText}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCopyInstagramCaption}
                      className="flex-1 py-1.5 px-3 rounded bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 text-[10px] font-mono uppercase tracking-wider transition-all duration-300 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {copiedInstagram ? (
                        <>
                          <Check size={11} />
                          <span>Caption Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={11} />
                          <span>Copy Caption</span>
                        </>
                      )}
                    </button>
                    <a
                      href="https://instagram.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-1.5 px-3 rounded bg-white/5 hover:bg-white/10 text-white text-[10px] font-mono uppercase tracking-wider transition-all duration-300 text-center flex items-center justify-center gap-1.5"
                    >
                      <span>Open App</span>
                      <span>↗</span>
                    </a>
                  </div>
                  <p className="text-[9px] text-white/40 font-sans tracking-wide leading-relaxed">
                    Instagram does not permit programmatic link injection for story/feed sharing from the web. Copy this premium caption, then paste it directly into your Instagram post, story link sticker, or private direct message invite!
                  </p>
                </div>
              )}
            </div>

            {/* Automatic QR Code Share Section */}
            <div className="border-t border-white/5 pt-4 flex flex-col sm:flex-row items-center gap-4 bg-white/[0.02] p-4 rounded-xl border border-white/5">
              <div className="bg-black p-2 rounded-lg border border-luxury-gold/30 shadow-[0_0_15px_rgba(212,175,55,0.15)] flex-shrink-0 relative flex items-center justify-center">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&color=d4af37&bgcolor=000000&data=${encodeURIComponent(`${window.location.origin}/?productCode=${product.code}`)}`}
                  alt="Product QR code"
                  className="w-[110px] h-[110px] object-contain"
                  referrerPolicy="no-referrer"
                />
                {(() => {
                  let currentLogoUrl = "/stylex_logo.jpg";
                  try {
                    const saved = localStorage.getItem("stylex_settings");
                    if (saved) {
                      const parsed = JSON.parse(saved);
                      if (parsed.logoUrl) {
                        currentLogoUrl = parsed.logoUrl;
                      }
                    }
                  } catch (e) {
                    // Ignore
                  }
                  return (
                    <div className="absolute w-[24px] h-[24px] bg-black rounded-md p-0.5 border border-luxury-gold/50 flex items-center justify-center overflow-hidden">
                      <img 
                        src={currentLogoUrl} 
                        alt="SX Logo" 
                        className="w-full h-full object-contain rounded"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/stylex_logo.jpg";
                        }}
                      />
                    </div>
                  );
                })()}
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
              <span>⚜️ {product.paymentType === 'full_advance' ? '100% SECURED PAYMENT' : product.paymentType === 'delivery_charge' ? 'DELIVERY CHARGE SECURED' : product.paymentType === 'percentage' ? `${product.paymentPercentage || 10}% PARTIAL ADVANCE` : 'CASH ON DELIVERY AVAILABLE'}</span>
              <span>•</span>
              <span>VIP SHAPE ENGINE GUARANTEED ⚜️</span>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

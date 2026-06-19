import { useState, useEffect } from 'react';
import { Search, MapPin, Truck, ShieldCheck, CheckCircle, Smartphone, Calendar, Box, Send, Sparkles, Tag, ShoppingBag, ArrowRight } from 'lucide-react';
import { Order, Product, Customer } from '../types';
import { formatPrice, generateOrderQrUrl, getDivisionForCity } from '../utils';

interface OrderTrackerProps {
  whatsappNumber?: string;
  activeTrackId?: string;
  onTrackIdChange?: (id: string) => void;
  customer?: Customer | null;
}

export default function OrderTracker({ 
  whatsappNumber = "8801755104443",
  activeTrackId,
  onTrackIdChange,
  customer
}: OrderTrackerProps) {
  const [searchId, setSearchId] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [loadingCustomerOrders, setLoadingCustomerOrders] = useState(false);

  // Fetch all product records to associate images and rich variables
  useEffect(() => {
    fetch('/api/products')
      .then(res => {
        if (res.ok) return res.json();
        return [];
      })
      .then(data => setProducts(data))
      .catch(err => console.error('Error fetching catalog data:', err));
  }, []);

  // Load customer past orders automatically
  useEffect(() => {
    if (!customer) {
      setCustomerOrders([]);
      return;
    }

    setLoadingCustomerOrders(true);
    fetch('/api/orders')
      .then(res => {
        if (res.ok) return res.json();
        return [];
      })
      .then((data: Order[]) => {
        // Filter orders matching logged in customer's email or phone number
        const matched = data.filter(ord => {
          const matchEmail = customer.email && ord.customerEmail && 
            ord.customerEmail.toLowerCase().trim() === customer.email.toLowerCase().trim();
          
          const cleanCustPhone = customer.phone ? customer.phone.replace(/[\s+]/g, '').trim() : '';
          const cleanOrdPhone = ord.customerPhone ? ord.customerPhone.replace(/[\s+]/g, '').trim() : '';
          
          const matchPhone = cleanCustPhone && cleanOrdPhone && (
            cleanOrdPhone === cleanCustPhone ||
            (cleanCustPhone.length >= 10 && cleanOrdPhone.endsWith(cleanCustPhone.slice(-10)))
          );
          
          return matchEmail || matchPhone;
        });
        setCustomerOrders(matched);
      })
      .catch(err => console.error('Error tracing customer past orders:', err))
      .finally(() => setLoadingCustomerOrders(false));
  }, [customer]);

  // Auto-fill from URL param or activeTrackId
  useEffect(() => {
    if (activeTrackId) {
      setSearchId(activeTrackId);
      handleTrackQuery(activeTrackId);
    } else {
      const params = new URLSearchParams(window.location.search);
      const trackParam = params.get('track');
      if (trackParam) {
        setSearchId(trackParam);
        handleTrackQuery(trackParam);
        if (onTrackIdChange) {
          onTrackIdChange(trackParam);
        }
      }
    }
  }, [activeTrackId]);

  const handleTrackQuery = async (idToSearch?: string) => {
    const query = idToSearch || searchId.trim();
    if (!query) return;

    setLoading(true);
    setErrorMsg('');
    setOrder(null);

    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(query)}`);
      if (res.status === 404) {
        throw new Error('NO SYSTEM ARCHIVE FOUND MATCHING THIS TRACKING ID OR PHONE');
      }
      if (!res.ok) {
        throw new Error('SYSTEM DB CONNECTIVITY FAULT');
      }
      const data = await res.json();
      setOrder(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error tracing tracking logs');
    } finally {
      setLoading(false);
    }
  };

  // Status mapping
  const statusSteps = [
    { code: 'PENDING', label: 'Placed', icon: Calendar, description: 'Bespoke order logged, awaiting concierge phone verification' },
    { code: 'CONFIRMED', label: 'Assembled', icon: Box, description: 'Handmade luxury pieces packed and cataloged with seals' },
    { code: 'SHIPPED', label: 'In Transit', icon: Truck, description: 'Dispatched with premium handpicked priority courier' },
    { code: 'DELIVERED', label: 'Completed', icon: CheckCircle, description: 'Hand-delivered & verified under secure credentials' }
  ];

  const getStepIndex = (status: string) => {
    if (status === 'CANCELLED') return -1;
    return statusSteps.findIndex(s => s.code === status);
  };

  const handleSupportWhatsApp = () => {
    if (!order) return;
    const wsMessage = `👑 *STYLE X TRACKING INQUIRY* 👑\n\nHello, I need an update regarding order:\n*Order Track ID:* ${order.id}\n*Customer Name:* ${order.customerName}\n*Phone:* ${order.customerPhone}\n*Status:* ${order.status}\n\nThank you!`;
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(wsMessage)}`, '_blank');
  };

  const activeIndex = order ? getStepIndex(order.status) : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-16">
      
      {/* Search Header box */}
      <div className="text-center mb-10">
        <h2 className="font-serif text-3xl md:text-5xl font-medium text-white mb-3">
          Track Your <span className="text-luxury-gold italic font-light">Collection</span>
        </h2>
        <p className="text-xs text-white/40 tracking-widest font-mono uppercase max-w-md mx-auto leading-relaxed">
          Verify delivery tracking, invoice archives & order state status.
        </p>

        <div className="relative mt-8 max-w-md mx-auto">
          <input 
            type="text" 
            placeholder="ENTER ORDER ID (E.G. STX-123456) OR MOBILE..."
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className="w-full bg-[#0e0e0e] text-white font-mono text-xs border border-luxury-gold/30 rounded-lg py-3.5 pl-4 pr-12 focus:outline-none focus:border-luxury-gold shadow-lg uppercase placeholder-white/25"
          />
          <button 
            onClick={() => handleTrackQuery()}
            disabled={loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-gradient-to-r from-luxury-gold to-yellow-400 hover:scale-105 text-black rounded-lg cursor-pointer transition-all disabled:opacity-50 shadow-md"
          >
            <Search size={14} />
          </button>
        </div>
      </div>

      {/* Active VIP Member Orders List */}
      {customer && !loading && (
        <div className="mb-12 bg-gradient-to-b from-[#090312] to-[#05010a] border-2 border-[#d4af37]/30 rounded-2xl p-6 md:p-8 shadow-[0_10px_35px_rgba(0,0,0,0.8)] animate-fade-in relative overflow-hidden">
          {/* Subtle background golden shimmer glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#d4af37]/5 rounded-full blur-[80px] -z-10"></div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.06] pb-5 mb-6">
            <div className="space-y-1">
              <span className="text-[9px] tracking-[0.25em] text-[#d4af37] font-black uppercase flex items-center gap-1">
                <Sparkles size={11} className="animate-pulse" />
                VIP Member Portfolio
              </span>
              <h3 className="text-xl font-bold font-serif text-white tracking-wide">
                Welcome back, <span className="text-[#ffd700] italic">{customer.name}</span>
              </h3>
              <p className="text-[11px] font-mono text-white/40">
                Email Archive Account: <span className="text-white/60">{customer.email}</span>
              </p>
            </div>
            
            <div className="bg-[#1c0828] border border-[#d4af37]/35 py-2 px-4 rounded-xl text-center">
              <span className="text-[9.5px] font-mono uppercase text-white/50 block">Status Level</span>
              <p className="text-xs font-black text-[#d4af37] uppercase tracking-widest mt-0.5">STYLE X PLATINUM</p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs uppercase font-black tracking-widest text-white/80 flex items-center gap-2">
              <ShoppingBag size={14} className="text-[#d4af37]" />
              Authorized Order Archives ({customerOrders.length})
            </h4>

            {loadingCustomerOrders ? (
              <div className="flex justify-center py-6">
                <div className="w-6 h-6 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : customerOrders.length === 0 ? (
              <div className="bg-white/[0.01] border border-white/5 rounded-xl p-6 text-center">
                <p className="text-xs text-white/40 italic">We haven't recorded any custom orders linked with your account yet.</p>
                <p className="text-[10px] text-white/30 font-mono mt-1 uppercase">Any bespoke piece you buy with this email will show here automatically</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {customerOrders.map((ord) => {
                  const itemsCount = ord.items?.reduce((s, i) => s + i.quantity, 0) || 0;
                  const isCurrent = order?.id === ord.id;
                  return (
                    <div 
                      key={ord.id}
                      onClick={() => {
                        setSearchId(ord.id);
                        handleTrackQuery(ord.id);
                        if (onTrackIdChange) onTrackIdChange(ord.id);
                      }}
                      className={`group relative p-4 rounded-xl border transition-all duration-300 cursor-pointer text-left flex items-center justify-between gap-3 ${
                        isCurrent 
                          ? 'bg-[#150a24]/90 border-2 border-[#d4af37] shadow-[0_4px_15px_rgba(212,175,55,0.15)]' 
                          : 'bg-white/[0.02] border-white/10 hover:border-[#d4af37]/45 hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="space-y-1 min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black uppercase text-[#ffd700] truncate">
                            {ord.id}
                          </span>
                          <span className={`text-[8.5px] font-bold uppercase px-1.5 py-0.5 rounded-md ${
                            ord.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            ord.status === 'CONFIRMED' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                            ord.status === 'SHIPPED' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                            ord.status === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {ord.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-white/50 font-mono truncate">
                          {new Date(ord.date).toLocaleDateString()}
                        </p>
                        
                        {/* Ordered products detail breakdown */}
                        <div className="mt-2 pt-2 border-t border-white/[0.04] space-y-1">
                          {ord.items?.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between gap-2 text-[10px] text-white/75 bg-white/[0.01] px-1.5 py-0.5 rounded">
                              <span className="font-medium truncate max-w-[140px] text-white/90">
                                {item.title}
                              </span>
                              <span className="font-mono text-[9px] text-[#ffd700] shrink-0 font-bold">
                                {item.selectedSize ? `${item.selectedSize} | ` : ''}x{item.quantity}
                              </span>
                            </div>
                          ))}
                        </div>

                        <p className="text-xs font-black text-[#ffd700] pt-1">
                          {formatPrice(ord.totalAmount)}
                        </p>
                      </div>

                      <div className="shrink-0">
                        <div className="w-8 h-8 rounded-full bg-white/[0.04] group-hover:bg-luxury-gold/10 flex items-center justify-center transition-all">
                          <ArrowRight size={13} className="text-[#d4af37] transform group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center p-12">
          <div className="w-10 h-10 border-2 border-luxury-gold border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-mono text-white/40 mt-3 tracking-widest uppercase">Querying luxury archives...</p>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-500/5 border border-red-500/20 text-red-400 p-4 rounded max-w-md mx-auto text-center font-mono text-xs uppercase leading-relaxed">
          {errorMsg}
        </div>
      )}

      {/* Tracked Results area */}
      {order && !loading && (
        <div className="space-y-8 animate-fade-in">
          
          {/* Info and QR status card */}
          <div className="bg-[#0a0a0a] border border-white/5 rounded-lg p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            
            <div className="space-y-2 text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 bg-luxury-gold/10 border border-luxury-gold/30 text-luxury-gold px-2.5 py-1 rounded text-[10px] font-mono uppercase">
                Order Tracking Live
              </div>
              <h3 className="font-serif text-xl font-bold text-white tracking-wide">
                Invoice ID: <span className="text-luxury-gold font-mono uppercase">{order.id}</span>
              </h3>
              <p className="text-[11px] font-mono text-white/40 uppercase">
                Order Date: {new Date(order.date).toLocaleDateString()} {new Date(order.date).toLocaleTimeString()}
              </p>
              {order.status === 'CANCELLED' && (
                <p className="text-xs text-red-400 font-mono font-bold uppercase mt-2">
                  ❌ THIS COLLECTION WAS DEACTIVATED OR DELETED
                </p>
              )}
            </div>

            {/* Scan QR component */}
            <div className="bg-white p-2 rounded flex flex-col items-center justify-center border border-luxury-gold/20 flex-shrink-0">
              <img 
                src={generateOrderQrUrl(order.id)} 
                alt="Order QR Code" 
                className="w-24 h-24"
              />
              <span className="text-[8px] text-zinc-800 font-mono font-bold mt-1 uppercase tracking-widest">ORDER CONCIERGE QR</span>
            </div>

          </div>

          {/* Visual Progress Steps Map */}
          {order.status !== 'CANCELLED' && (
            <div className="bg-[#0a0a0a] border border-white/5 rounded-lg p-6">
              <h4 className="font-display text-[10px] text-white/40 tracking-[0.2em] uppercase mb-8 text-center md:text-left">
                TRAJECTORY TRAKMAP
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
                
                {/* Horizontal progress bar behind icons */}
                <div className="hidden md:block absolute top-[21px] left-[5%] right-[5%] h-[1px] bg-white/10 z-0">
                  <div 
                    className="h-full bg-luxury-gold transition-all duration-1000"
                    style={{ width: `${(activeIndex / 3) * 90}%` }}
                  ></div>
                </div>

                {statusSteps.map((step, idx) => {
                  const Icon = step.icon;
                  const isPassed = idx <= activeIndex;
                  const isCurrent = idx === activeIndex;

                  return (
                    <div 
                      key={step.code} 
                      className={`relative flex flex-row md:flex-col items-center gap-4 text-left md:text-center z-10 transition-opacity ${
                        isPassed ? 'opacity-100' : 'opacity-40'
                      }`}
                    >
                      {/* Step Circle */}
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all ${
                        isCurrent 
                          ? 'bg-luxury-gold text-luxury-black border-luxury-gold ring ring-luxury-gold/25 scale-110 shadow-lg'
                          : isPassed 
                            ? 'bg-[#151515] text-luxury-gold border-luxury-gold/50'
                            : 'bg-luxury-charcoal text-white/50 border-white/5'
                      }`}>
                        <Icon size={16} />
                      </div>

                      {/* Labels and Details */}
                      <div>
                        <p className={`font-serif text-sm font-semibold uppercase ${
                          isCurrent ? 'text-luxury-gold' : 'text-white/80'
                        }`}>
                          {step.label}
                        </p>
                        <p className="text-[10.5px] text-white/50 leading-relaxed font-sans max-w-[180px] mt-1 md:mx-auto">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  );
                })}

              </div>
            </div>
          )}

          {/* Summarized Invoice Items table */}
          <div className="bg-[#090510] border border-[#d4af37]/25 rounded-2xl p-6 md:p-8 space-y-6 shadow-[0_10px_35px_rgba(0,0,0,0.6)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-luxury-gold/5 via-transparent to-transparent pointer-events-none rounded-bl-full"></div>
            
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
              <h4 className="font-serif text-sm font-extrabold text-white tracking-[0.2em] uppercase flex items-center gap-2">
                <Sparkles size={14} className="text-luxury-gold animate-pulse" />
                ACCREDITED SPECIFICATIONS ({order.items.length} {order.items.length === 1 ? 'PIECE' : 'PIECES'} ALLOTMENT)
              </h4>
              <span className="text-[9px] uppercase font-mono tracking-widest text-emerald-400 font-black bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                VERIFIED GENUINE
              </span>
            </div>

            {/* Premium Card List of Ordered Products */}
            <div className="space-y-4">
              {order.items.map((it, idx) => {
                const matchedProduct = products.find(p => p.id === it.productId);
                const imageUrl = matchedProduct?.imageUrl || "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=300&auto=format&fit=crop";
                const productCode = matchedProduct?.code || 'SX-VIP';

                return (
                  <div 
                    key={idx} 
                    className="flex items-center gap-4 bg-black/40 border border-white/[0.04] p-4 rounded-xl hover:border-[#d4af37]/40 transition-all duration-300 group/item relative overflow-hidden"
                  >
                    {/* Interactive highlight flare */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.015] to-transparent -translate-x-full group-hover/item:animate-shimmer duration-1000 pointer-events-none" />
                    
                    {/* Luxury Product Thumbnail Container */}
                    <div className="w-16 h-16 rounded-lg bg-zinc-900 border border-white/10 overflow-hidden relative flex-shrink-0 group-hover/item:border-[#d4af37]/60 transition-colors duration-300">
                      <img 
                        src={imageUrl} 
                        referrerPolicy="no-referrer"
                        alt={it.title}
                        className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500"
                      />
                    </div>

                    {/* Specifications detail metadata */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className="bg-luxury-gold/10 border border-luxury-gold/30 text-[8px] font-mono font-black text-luxury-gold px-1.5 py-0.5 rounded tracking-widest">
                          {productCode}
                        </span>
                        {matchedProduct?.category && (
                          <span className="text-[7.5px] font-mono text-white/30 uppercase">
                            • {matchedProduct.category} COLLECTION
                          </span>
                        )}
                      </div>
                      <h5 className="font-serif text-sm font-bold text-white/95 tracking-wide line-clamp-1 group-hover/item:text-[#ffd700] transition-colors duration-200">
                        {it.title}
                      </h5>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono text-white/40 uppercase">
                          VIP Size: <strong className="text-white/80 font-black">{it.selectedSize}</strong>
                        </span>
                        <span className="w-1 h-3 bg-white/5"></span>
                        <span className="text-[10px] font-mono text-white/40 uppercase">
                          Quantity: <strong className="text-white/80 font-black">x{it.quantity}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Price structure display */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-[10px] font-mono text-white/40">{formatPrice(it.price)} <span className="text-[9px]">each</span></p>
                      <p className="text-[13px] font-mono font-extrabold text-luxury-gold mt-0.5">{formatPrice(it.price * it.quantity)}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Financial Ledger Breakout details */}
            <div className="border-t border-white/[0.06] pt-5 space-y-3 font-display text-xs">
              {(() => {
                const itemsSubtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                const computedCarriage = getDivisionForCity(order.customerCity) === 'Dhaka' ? 100 : 150;
                const computedDiscount = Math.max(0, itemsSubtotal + computedCarriage - order.totalAmount);

                return (
                  <>
                    {/* Items Subtotal info */}
                    <div className="flex justify-between text-white/60">
                      <span className="flex items-center gap-1">Items Allocation Subtotal</span>
                      <span className="font-mono text-white">{formatPrice(itemsSubtotal)}</span>
                    </div>

                    {/* VIP Delivery Carriage service */}
                    <div className="flex justify-between text-white/60">
                      <span>Bespoke Priority Courier Line</span>
                      <span className="font-mono text-white">{formatPrice(computedCarriage)}</span>
                    </div>

                    {/* VIP Coupon discount applied */}
                    {computedDiscount > 0 && (
                      <div className="flex justify-between text-emerald-400 bg-emerald-500/5 border border-emerald-500/15 p-2 rounded-lg font-mono text-[11px] font-bold">
                        <span className="flex items-center gap-1">🎟️ VIP COUPE DISCOUNT REDEEMED</span>
                        <span>-{formatPrice(computedDiscount)}</span>
                      </div>
                    )}

                    {/* Total Grand Payables */}
                    <div className="flex justify-between pt-4 pb-1 border-t border-white/[0.06] items-center text-white">
                      <div>
                        <span className="uppercase tracking-[0.25em] text-[10.5px] font-black text-white/90 block">NET INVOICED BALANCE</span>
                        <span className="text-[7.5px] font-mono text-white/30 uppercase tracking-widest pl-0.5">SECURE CASH UPON HANDOFF</span>
                      </div>
                      <span className="text-xl font-mono text-luxury-gold font-black shadow-inner">
                        {formatPrice(order.totalAmount)}
                      </span>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Delivery Credentials */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="bg-[#0a0a0a] border border-white/5 rounded-lg p-5 space-y-3">
              <h5 className="font-serif text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Smartphone size={13} className="text-luxury-gold" />
                Contact Record
              </h5>
              <div className="text-xs text-white/80 space-y-1 font-mono">
                <p><span className="text-white/40">NAME:</span> {order.customerName}</p>
                <p><span className="text-white/40">PHONE:</span> {order.customerPhone}</p>
                <p><span className="text-white/40">DESTIN:</span> {order.customerCity}</p>
              </div>
            </div>

            <div className="bg-[#0a0a0a] border border-white/5 rounded-lg p-5 space-y-3">
              <h5 className="font-serif text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <MapPin size={13} className="text-luxury-gold" />
                Shipping Coordinates
              </h5>
              <div className="text-xs text-white/80 font-mono space-y-1">
                <p className="line-clamp-2 leading-relaxed"><span className="text-white/40">ADDRS:</span> {order.customerAddress}</p>
                <p><span className="text-white/40">NOTES:</span> {order.customerNotes || "None logged"}</p>
              </div>
            </div>

          </div>

          {/* Concierge Support inquiry button */}
          <div className="flex flex-col items-center text-center mt-6">
            <button
              onClick={handleSupportWhatsApp}
              className="inline-flex items-center gap-2.5 border border-emerald-500/40 hover:border-emerald-400 bg-gradient-to-r from-[#03140b] via-[#062414] to-[#03140b] text-emerald-400 hover:text-emerald-300 font-display text-[11px] uppercase font-black tracking-[0.2em] py-4 px-8 rounded-xl transition-all duration-300 relative overflow-hidden cursor-pointer shadow-[0_4px_20px_rgba(16,185,129,0.15)] hover:shadow-[0_4px_30px_rgba(16,185,129,0.45)] hover:scale-[1.02] active:scale-95 group/wa"
            >
              <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover/wa:opacity-100 transition-opacity duration-300" />
              <Send size={14} className="text-emerald-400 group-hover/wa:animate-bounce" />
              <span>Inquire Order via WhatsApp</span>
            </button>
            <p className="text-[10px] text-white/30 font-sans mt-3 italic">
              Connect directly with Style X live assistant regarding delivery timing.
            </p>
          </div>

        </div>
      )}

    </div>
  );
}

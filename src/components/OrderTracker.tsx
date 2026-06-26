import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, MapPin, Truck, ShieldCheck, CheckCircle, Smartphone, Calendar, Box, Send, Sparkles, Tag, ShoppingBag, ArrowRight, Copy, Check } from 'lucide-react';
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
  const [copied, setCopied] = useState(false);

  // SMS status and product alerts preferences state
  const [smsPhone, setSmsPhone] = useState('');
  const [smsName, setSmsName] = useState('');
  const [optInSMS, setOptInSMS] = useState(true);
  const [optInNewProducts, setOptInNewProducts] = useState(true);
  const [smsSubmitting, setSmsSubmitting] = useState(false);
  const [smsSuccessMsg, setSmsSuccessMsg] = useState('');
  const [smsErrorMsgState, setSmsErrorMsgState] = useState('');
  const [smsLogs, setSmsLogs] = useState<any[]>([]);

  // Fetch SMS logs matching current phone number
  const fetchSmsLogs = async () => {
    try {
      const res = await fetch('/api/sms-logs');
      if (res.ok) {
        const data = await res.json();
        const filtered = data.filter((log: any) => {
          if (!smsPhone) return true;
          const cleanLogPhone = log.phone.replace(/[\s+-]/g, '');
          const cleanSmsPhone = smsPhone.replace(/[\s+-]/g, '');
          return cleanLogPhone.includes(cleanSmsPhone) || cleanSmsPhone.includes(cleanLogPhone);
        });
        setSmsLogs(filtered);
      }
    } catch (err) {
      console.error('Error loading simulated SMS logs:', err);
    }
  };

  useEffect(() => {
    if (smsPhone) {
      fetchSmsLogs();
    }
  }, [smsPhone]);

  useEffect(() => {
    const timer = setInterval(() => {
      fetchSmsLogs();
    }, 4000);
    return () => clearInterval(timer);
  }, [smsPhone]);

  useEffect(() => {
    if (order) {
      setSmsPhone(order.customerPhone || '');
      setSmsName(order.customerName || '');
    }
  }, [order]);

  const handleSaveSmsPrefs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smsPhone) {
      setSmsErrorMsgState('Valid mobile phone number is required.');
      return;
    }
    setSmsSubmitting(true);
    setSmsSuccessMsg('');
    setSmsErrorMsgState('');

    try {
      const res = await fetch('/api/sms-opt-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: smsPhone,
          name: smsName,
          orderId: order?.id,
          optInSMS,
          optInNewProducts
        })
      });

      if (res.ok) {
        setSmsSuccessMsg('VIP SMS Notification preferences updated and stored successfully!');
        fetchSmsLogs();
      } else {
        const errData = await res.json();
        setSmsErrorMsgState(errData.error || 'Failed to update preferences.');
      }
    } catch (err) {
      setSmsErrorMsgState('Network error updating subscription.');
    } finally {
      setSmsSubmitting(false);
    }
  };

  const handleSimulateNewProductSms = async () => {
    try {
      const randomId = Math.floor(1000 + Math.random() * 9000);
      const demoProduct = {
        title: `Royal Golden Chrono Elite (${randomId})`,
        price: 24500,
        description: "A masterwork of horological elegance featuring a precision sweep movement and fully hand-carved celestial moonphase markers.",
        category: "WATCHES",
        stock: 5,
        imageUrl: "https://images.unsplash.com/photo-1547996160-81dfa63595aa?q=80&w=300&auto=format&fit=crop"
      };

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(demoProduct)
      });

      if (res.ok) {
        setSmsSuccessMsg('✨ Simulated new custom Product added to catalog! SMS alerts dispatched in background to all subscribers.');
        fetchSmsLogs();
      }
    } catch (err) {
      console.error('Failed to trigger mock product:', err);
    }
  };

  const handleCopyId = () => {
    if (!order) return;
    navigator.clipboard.writeText(order.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

      // Store tracked order ID and phone in localStorage for notification integration
      try {
        const prevOrderIds = JSON.parse(localStorage.getItem('stylex_placed_order_ids') || '[]');
        if (!prevOrderIds.includes(data.id)) {
          prevOrderIds.push(data.id);
          localStorage.setItem('stylex_placed_order_ids', JSON.stringify(prevOrderIds));
        }
        if (data.customerPhone) {
          localStorage.setItem('stylex_guest_phone', data.customerPhone);
        }
        if (data.customerEmail) {
          localStorage.setItem('stylex_guest_email', data.customerEmail);
        }
        // Trigger app notifications reload
        if (typeof (window as any).refreshAppNotifications === 'function') {
          (window as any).refreshAppNotifications();
        }
      } catch (err) {
        console.warn('Error saving tracked order context: ', err);
      }
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
                        <div className="mt-2 pt-2 border-t border-white/[0.04] space-y-1.5">
                          {ord.items?.map((item, idx) => {
                            const matchedProduct = products.find(p => p.id === item.productId);
                            const imgUrl = matchedProduct?.imageUrl || "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=300&auto=format&fit=crop";
                            return (
                              <div key={idx} className="flex items-center justify-between gap-3 text-[10px] text-white/75 bg-white/[0.01] hover:bg-white/[0.03] p-1 rounded-lg border border-white/[0.03] transition-colors">
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <img 
                                    src={imgUrl} 
                                    referrerPolicy="no-referrer"
                                    alt={item.title}
                                    className="w-7 h-7 rounded-md object-cover border border-white/10 flex-shrink-0"
                                  />
                                  <span className="font-medium truncate text-white/90">
                                    {item.title}
                                  </span>
                                </div>
                                <span className="font-mono text-[9px] text-[#ffd700] shrink-0 font-bold">
                                  {item.selectedSize ? `${item.selectedSize} | ` : ''}x{item.quantity}
                                </span>
                              </div>
                            );
                          })}
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
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-8"
        >
          
          {/* Info and QR status card */}
          <div className="bg-[#0a0a0a] border border-white/5 rounded-lg p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            
            <div className="space-y-2 text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 bg-luxury-gold/10 border border-luxury-gold/30 text-luxury-gold px-2.5 py-1 rounded text-[10px] font-mono uppercase">
                Order Tracking Live
              </div>
              <h3 className="font-serif text-xl font-bold text-white tracking-wide flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span>Invoice ID:</span>
                <span className="text-luxury-gold font-mono uppercase select-all">{order.id}</span>
                <button
                  onClick={handleCopyId}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/5 border border-white/10 text-[10px] font-sans font-medium text-white/70 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
                  title="Copy Tracking ID"
                  id="copy-tracking-id-btn"
                >
                  {copied ? (
                    <>
                      <Check size={11} className="text-emerald-400" />
                      <span className="text-emerald-400 font-mono text-[9px] tracking-wider uppercase">COPIED</span>
                    </>
                  ) : (
                    <>
                      <Copy size={11} className="text-luxury-gold/70" />
                      <span className="font-mono text-[9px] tracking-wider uppercase text-white/60">COPY ID</span>
                    </>
                  )}
                </button>
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
            <div className="bg-white p-2 rounded flex flex-col items-center justify-center border border-luxury-gold/20 flex-shrink-0 relative">
              <div className="relative flex items-center justify-center">
                <img 
                  src={generateOrderQrUrl(order.id)} 
                  alt="Order QR Code" 
                  className="w-24 h-24"
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
                    <div className="absolute w-[20px] h-[20px] bg-black rounded p-0.5 border border-luxury-gold/50 flex items-center justify-center overflow-hidden">
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

          {/* VIP SMS status alerts preferences and simulated mobile inbox */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-gradient-to-br from-[#0c0a0f] via-[#050307] to-[#0a080d] border border-white/5 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.5)]">
            
            {/* Form Section */}
            <div className="lg:col-span-7 space-y-5 flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 bg-luxury-gold/10 border border-luxury-gold/30 text-[10px] text-luxury-gold px-2.5 py-1 rounded font-mono uppercase tracking-wider mb-2">
                  🔒 Bespoke Integrations Active
                </div>
                <h4 className="font-serif text-lg font-bold text-white tracking-wide">
                  VIP Mobile Notification Center
                </h4>
                <p className="text-xs text-white/55 leading-relaxed mt-1 text-left">
                  Keep in lockstep with our atelier. Choose to receive real-time SMS status changes and instant notifications sent directly to your mobile whenever magnificent new creations are dropped.
                </p>
              </div>

              <form onSubmit={handleSaveSmsPrefs} className="space-y-4">
                {/* Inputs Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="text-left">
                    <label className="block text-[10px] font-mono uppercase tracking-widest text-white/40 mb-1.5">
                      Recipient Name
                    </label>
                    <input
                      type="text"
                      value={smsName}
                      onChange={(e) => setSmsName(e.target.value)}
                      placeholder="e.g. Lord Byron"
                      className="w-full bg-white/[0.02] border border-white/10 rounded-lg px-3 py-2 text-xs font-serif text-white focus:outline-none focus:border-luxury-gold/50 transition-colors"
                    />
                  </div>
                  <div className="text-left">
                    <label className="block text-[10px] font-mono uppercase tracking-widest text-white/40 mb-1.5">
                      Mobile Phone Number
                    </label>
                    <input
                      type="tel"
                      value={smsPhone}
                      onChange={(e) => setSmsPhone(e.target.value)}
                      placeholder="e.g. +8801755104443"
                      className="w-full bg-white/[0.02] border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-luxury-gold/50 transition-colors"
                      required
                    />
                  </div>
                </div>

                {/* Preference Checkboxes */}
                <div className="space-y-3 bg-white/[0.01] border border-white/[0.03] p-4 rounded-xl">
                  {/* Pref 1: Order Status SMS */}
                  <label className="flex items-start gap-3 cursor-pointer select-none group">
                    <input
                      type="checkbox"
                      checked={optInSMS}
                      onChange={(e) => setOptInSMS(e.target.checked)}
                      className="mt-0.5 rounded border-white/20 bg-transparent text-luxury-gold focus:ring-0 focus:ring-offset-0"
                    />
                    <div className="text-left">
                      <span className="block text-xs font-bold text-white group-hover:text-luxury-gold transition-colors">
                        Order Status Tracking SMS
                      </span>
                      <span className="block text-[10px] text-white/45 mt-0.5">
                        Opt-in to automated simulated dispatch, courier allocation, and physical delivery status confirmations.
                      </span>
                    </div>
                  </label>

                  {/* Pref 2: New Product Alerts SMS */}
                  <label className="flex items-start gap-3 cursor-pointer select-none group pt-3 border-t border-white/[0.04]">
                    <input
                      type="checkbox"
                      checked={optInNewProducts}
                      onChange={(e) => setOptInNewProducts(e.target.checked)}
                      className="mt-0.5 rounded border-white/20 bg-transparent text-luxury-gold focus:ring-0 focus:ring-offset-0"
                    />
                    <div className="text-left">
                      <span className="block text-xs font-bold text-white group-hover:text-luxury-gold transition-colors">
                        Catalog Release SMS Notifications
                      </span>
                      <span className="block text-[10px] text-white/45 mt-0.5">
                        Receive dynamic mobile SMS warnings the split-second new bespoke items or rare collections are added to the shop!
                      </span>
                    </div>
                  </label>
                </div>

                {/* Success / Error Banners */}
                {smsSuccessMsg && (
                  <div className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-lg flex items-center gap-2 text-left">
                    <CheckCircle size={14} className="shrink-0" />
                    <span>{smsSuccessMsg}</span>
                  </div>
                )}
                {smsErrorMsgState && (
                  <div className="text-[11px] font-mono text-red-400 bg-red-500/10 border border-red-500/20 p-2.5 rounded-lg flex items-center gap-2 text-left">
                    <span className="font-bold">⚠️</span>
                    <span>{smsErrorMsgState}</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={smsSubmitting}
                    className="flex-1 bg-luxury-gold hover:bg-[#ffd700] text-luxury-black font-semibold text-xs py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                  >
                    {smsSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        <span>Synchronizing...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={14} />
                        <span>Activate VIP Alert Credentials</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleSimulateNewProductSms}
                    className="bg-white/5 border border-white/10 hover:bg-white/10 text-white font-mono text-[10px] py-2.5 px-3.5 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
                    title="Simulates adding a brand new product in the admin panel to trigger and test instant customer SMS notifications."
                  >
                    <span>⚡ Simulate New Product Drop SMS</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Smartphone Simulated Display */}
            <div className="lg:col-span-5 flex flex-col bg-[#050505] border border-white/10 rounded-2xl overflow-hidden shadow-inner h-[340px] max-w-[340px] mx-auto w-full">
              {/* Handset Top Notch / Header */}
              <div className="bg-black py-1.5 px-4 flex justify-between items-center text-[9px] font-mono text-white/50 border-b border-white/5">
                <span className="font-bold">VIP-NET</span>
                <div className="w-16 h-3 bg-zinc-900 rounded-full flex items-center justify-center border border-white/5">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping mr-1" />
                  <span className="text-[7.5px] text-white/40">SECURE CONNECT</span>
                </div>
                <span>100% 🔋</span>
              </div>

              {/* Chat App Bar */}
              <div className="bg-[#0b0a0f] p-3 border-b border-white/5 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-luxury-gold/15 flex items-center justify-center text-[10px] text-luxury-gold font-bold border border-luxury-gold/30">
                  SX
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold text-white tracking-wide">STYLE X CONCIERGE</span>
                    <span className="text-emerald-400 text-[8px]" title="Official Secure Sender">✓</span>
                  </div>
                  <span className="text-[8px] text-emerald-400 font-mono tracking-widest block">SECURE TELEMETRY SMS</span>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-[#030303] scrollbar-thin scrollbar-thumb-white/10 flex flex-col justify-start">
                {smsLogs.length === 0 ? (
                  <div className="my-auto flex flex-col items-center justify-center text-center p-4">
                    <Smartphone size={24} className="text-white/20 mb-2 animate-bounce" />
                    <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">
                      Inbox Empty
                    </p>
                    <p className="text-[9px] text-white/40 max-w-[180px] mt-1">
                      Update your phone and select checkboxes to trigger simulated SMS welcomes and status loops!
                    </p>
                  </div>
                ) : (
                  smsLogs.map((log: any) => (
                    <div key={log.id} className="space-y-1">
                      <div className="bg-[#0d0d0f] border border-white/10 rounded-2xl rounded-tl-none p-3 max-w-[90%] text-left relative shadow-sm">
                        <p className="text-[10.5px] text-white/95 leading-relaxed font-sans whitespace-pre-line">
                          {log.message}
                        </p>
                        <span className="text-[7.5px] font-mono text-white/30 block text-right mt-1.5">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* simulated phone footer */}
              <div className="bg-[#09090b] py-1 px-3 border-t border-white/5 flex justify-between items-center text-[8px] font-mono text-white/30">
                <span>SIMULATOR CONSOLE ACTIVE</span>
                <button 
                  type="button"
                  onClick={() => {
                    fetch('/api/sms-logs', { method: 'DELETE' }).then(() => fetchSmsLogs());
                  }}
                  className="hover:text-red-400 uppercase tracking-wider text-[7.5px] cursor-pointer"
                >
                  Clear Inbox
                </button>
              </div>
            </div>

          </div>

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

        </motion.div>
      )}

    </div>
  );
}

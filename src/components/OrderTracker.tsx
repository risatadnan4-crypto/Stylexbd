import { useState, useEffect } from 'react';
import { Search, MapPin, Truck, ShieldCheck, CheckCircle, Smartphone, Calendar, Box, Send } from 'lucide-react';
import { Order } from '../types';
import { formatPrice, generateOrderQrUrl } from '../utils';

export default function OrderTracker() {
  const [searchId, setSearchId] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-fill from URL param if available
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const trackParam = params.get('track');
    if (trackParam) {
      setSearchId(trackParam);
      handleTrackQuery(trackParam);
    }
  }, []);

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
    window.open(`https://wa.me/8801755104443?text=${encodeURIComponent(wsMessage)}`, '_blank');
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
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-luxury-gold hover:bg-luxury-gold-dark text-luxury-black rounded cursor-pointer transition-colors disabled:opacity-50"
          >
            <Search size={14} />
          </button>
        </div>
      </div>

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
          <div className="bg-[#0a0a0a] border border-white/5 rounded-lg p-6">
            <h4 className="font-display text-[10px] text-white/40 tracking-[0.2em] uppercase mb-4">
              COLLECTION SPECIFICATIONS
            </h4>

            <div className="divide-y divide-white/5 font-display text-xs">
              {order.items.map((it, idx) => (
                <div key={idx} className="flex justify-between py-3 text-white">
                  <div>
                    <span className="font-semibold text-white/90">{it.title}</span>
                    <span className="text-[10px] text-white/40 font-mono ml-2">({it.selectedSize}) x{it.quantity}</span>
                  </div>
                  <span className="font-mono text-luxury-gold font-semibold">{formatPrice(it.price * it.quantity)}</span>
                </div>
              ))}

              <div className="flex justify-between pt-4 pb-2 text-white/60">
                <span>Handpicked VIP Carriage</span>
                <span className="font-mono">{formatPrice(order.customerCity === 'Dhaka' ? 100 : 150)}</span>
              </div>

              <div className="flex justify-between pt-3 font-semibold text-sm border-t border-white/5 text-white">
                <span className="uppercase tracking-widest text-[11px]">Aggregated Invoice</span>
                <span className="text-luxury-gold text-base font-mono">{formatPrice(order.totalAmount)}</span>
              </div>
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
              className="inline-flex items-center gap-2 border border-green-500/20 hover:border-green-500/50 bg-green-500/5 hover:bg-green-500/15 text-green-400 font-display text-[10.5px] uppercase font-bold tracking-[0.15em] py-3 px-8 rounded-full transition-all"
            >
              <Send size={12} />
              Inquire Order via WhatsApp
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

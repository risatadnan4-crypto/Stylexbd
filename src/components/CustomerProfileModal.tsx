import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Mail, Phone, Lock, History, X, ChevronRight, 
  ArrowRight, CheckCircle, Check, Copy, ExternalLink, 
  MessageSquare, Clock, MapPin, Truck, Sparkles, AlertTriangle,
  Heart, ShoppingBag, Trash2
} from 'lucide-react';
import { Order, Product, Customer } from '../types';
import { formatPrice, generateOrderQrUrl } from '../utils';

interface CustomerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onUpdateCustomer: (updated: Customer) => void;
  orders: Order[];
  products: Product[];
  whatsappNumber?: string;
  onOpenChat: () => void;
  wishlist?: string[];
  onToggleWishlist?: (p: Product) => void;
  onAddToCart?: (p: Product, size: string) => void;
  onViewOrdersOnSeparatePage?: () => void;
  onViewWishlistOnSeparatePage?: () => void;
}

export default function CustomerProfileModal({
  isOpen,
  onClose,
  customer,
  onUpdateCustomer,
  orders,
  products,
  whatsappNumber = "8801755104443",
  onOpenChat,
  wishlist = [],
  onToggleWishlist = () => {},
  onAddToCart = () => {},
  onViewOrdersOnSeparatePage,
  onViewWishlistOnSeparatePage
}: CustomerProfileModalProps) {
  // Tabs: 'profile' | 'orders' | 'wishlist'
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'wishlist'>('profile');
  
  // Profile Form States
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Orders State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (customer) {
      setName(customer.name || '');
      setPhone(customer.phone || '');
      setPassword(customer.password || '');
    }
  }, [customer, isOpen]);

  if (!isOpen || !customer) return null;

  // Filter orders matching logged in customer email or phone
  const customerOrders = orders.filter(order => {
    const matchEmail = customer.email && order.customerEmail && 
      order.customerEmail.toLowerCase().trim() === customer.email.toLowerCase().trim();

    const cleanCustPhone = customer.phone ? customer.phone.replace(/[\s+]/g, '').trim() : '';
    const cleanOrderPhone = order.customerPhone ? order.customerPhone.replace(/[\s+]/g, '').trim() : '';

    const matchPhone = cleanCustPhone && cleanOrderPhone && (
      cleanOrderPhone === cleanCustPhone ||
      (cleanCustPhone.length >= 10 && cleanOrderPhone.endsWith(cleanCustPhone.slice(-10)))
    );

    return matchEmail || matchPhone;
  });

  const wishlistedProducts = products.filter(p => wishlist.includes(p.id));

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError('');
    setSaveSuccess(false);

    if (!name.trim()) {
      setSaveError('Name cannot be empty.');
      return;
    }

    if (!phone.trim()) {
      setSaveError('WhatsApp Mobile Reference cannot be empty.');
      return;
    }

    const updatedCustomer: Customer = {
      ...customer,
      name: name.trim(),
      phone: phone.trim(),
      password: password
    };

    onUpdateCustomer(updatedCustomer);
    setSaveSuccess(true);
    setIsEditing(false);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleCopyId = (orderId: string) => {
    navigator.clipboard.writeText(orderId);
    setCopiedId(orderId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusSteps = (status: string) => {
    const steps = [
      { code: 'PENDING', label: 'Order Placed', description: 'Pending luxury verification' },
      { code: 'CONFIRMED', label: 'Confirmed', description: 'Authenticity checked & approved' },
      { code: 'SHIPPED', label: 'In Transit', description: 'Handed over to priority dispatch' },
      { code: 'DELIVERED', label: 'Completed', description: 'Secured at your destination' }
    ];
    
    let activeIndex = 0;
    if (status === 'CONFIRMED') activeIndex = 1;
    if (status === 'SHIPPED') activeIndex = 2;
    if (status === 'DELIVERED') activeIndex = 3;
    if (status === 'CANCELLED') activeIndex = -1;

    return { steps, activeIndex };
  };

  const handleWhatsAppInquiry = (orderId: string) => {
    const text = `Hi, I am inquiring about my Style X Order: ${orderId}. Can you please give me a tracking update?`;
    window.open(`https://wa.me/${whatsappNumber.replace(/[\s+]/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
        {/* Backdrop glass */}
        <motion.div 
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-luxury-black/90 backdrop-blur-md cursor-pointer"
        />

        {/* Modal Window Container */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          className="relative w-full max-w-4xl h-[90vh] max-h-[850px] bg-gradient-to-b from-[#0e061b] via-[#06030c] to-[#030106] border border-luxury-gold/30 rounded-2xl shadow-[0_0_60px_rgba(212,175,55,0.18)] z-10 flex flex-col overflow-hidden text-white font-sans"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] p-4 sm:p-5 flex-shrink-0 bg-black/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-luxury-purple-glowing/20 to-luxury-gold/20 border border-luxury-gold/30 rounded-xl flex items-center justify-center text-luxury-gold shadow-[0_0_15px_rgba(212,175,55,0.15)]">
                <User size={18} />
              </div>
              <div>
                <h3 className="font-serif text-sm sm:text-base md:text-lg font-black tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-white via-luxury-gold to-white">
                  VIP Club Portal
                </h3>
                <p className="text-[9px] sm:text-[10px] text-white/40 uppercase font-mono tracking-wider mt-0.5">
                  Exclusive Personal Lounge
                </p>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="text-white/40 hover:text-luxury-gold hover:rotate-90 hover:scale-110 active:scale-95 transition-all duration-300 p-1.5 rounded-full hover:bg-white/5 border border-transparent hover:border-luxury-gold/30 hover:shadow-[0_0_15px_rgba(212,175,55,0.2)] cursor-pointer"
              title="Close Portal"
            >
              <X size={16} />
            </button>
          </div>

          {/* Core Content Layout (Grid Split) */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
            
            {/* Sidebar Left: Customer Card Summary & Navigation */}
            <div className="w-full md:w-80 border-r border-white/[0.06] p-4 sm:p-5 flex flex-col gap-4 bg-black/20 flex-shrink-0">
              
              {/* Profile Card Summary */}
              <div className="relative overflow-hidden bg-gradient-to-br from-[#120824] to-[#04010a] border border-luxury-gold/15 p-4 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                <div className="absolute top-0 right-0 w-24 h-24 bg-luxury-gold/5 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-luxury-purple-glowing/5 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex items-center gap-3 relative z-10">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-luxury-purple to-luxury-gold p-0.5 shadow-[0_0_15px_rgba(212,175,55,0.25)]">
                    <div className="w-full h-full rounded-full bg-[#0d071a] flex items-center justify-center font-serif text-lg font-bold text-luxury-gold">
                      {customer.name ? customer.name.charAt(0).toUpperCase() : 'V'}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[8px] font-black tracking-widest text-[#d4af37] block uppercase leading-none mb-1">
                      👑 VIP MEMBER
                    </span>
                    <h4 className="text-xs sm:text-sm font-black text-white/90 truncate font-serif leading-tight">
                      {customer.name}
                    </h4>
                    <p className="text-[10px] text-white/40 font-mono truncate mt-0.5">
                      {customer.email}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/[0.05] flex justify-between items-center text-[10px] text-white/50 font-mono">
                  <span>ORDERS LINKED:</span>
                  <span className="text-luxury-gold font-bold bg-luxury-gold/10 px-2 py-0.5 rounded-full border border-luxury-gold/20">
                    {customerOrders.length}
                  </span>
                </div>
                <div 
                  onClick={() => {
                    if (onViewWishlistOnSeparatePage) {
                      onClose();
                      onViewWishlistOnSeparatePage();
                    } else {
                      setActiveTab('wishlist');
                      setSelectedOrder(null);
                    }
                  }}
                  className="mt-2 pt-2 border-t border-white/[0.05] flex justify-between items-center text-[10px] text-white/50 font-mono cursor-pointer hover:text-white transition-colors group/wish"
                >
                  <span className="group-hover/wish:text-luxury-gold transition-colors">WISHLIST PIECES:</span>
                  <span className="text-luxury-purple-glowing font-bold bg-luxury-purple-glowing/10 px-2 py-0.5 rounded-full border border-luxury-purple-glowing/20 group-hover/wish:border-luxury-gold/50 group-hover/wish:text-luxury-gold transition-all">
                    {wishlist.length}
                  </span>
                </div>
              </div>

              {/* Sidebar Navigation Tabs */}
              <div className="space-y-1.5 font-display">
                <button
                  onClick={() => {
                    if (onViewOrdersOnSeparatePage) {
                      onClose();
                      onViewOrdersOnSeparatePage();
                    } else {
                      setActiveTab('orders');
                      setSelectedOrder(null);
                    }
                  }}
                  className={`w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider py-3 px-3.5 rounded-xl transition-all border duration-200 cursor-pointer ${
                    activeTab === 'orders'
                      ? 'bg-gradient-to-r from-luxury-purple-glowing/20 to-luxury-gold/10 text-luxury-gold border-luxury-gold/40 shadow-md font-black'
                      : 'text-white/60 hover:text-white hover:bg-white/[0.03] border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <History size={14} className={activeTab === 'orders' ? "text-luxury-gold animate-pulse" : "text-white/40"} />
                    <span>My Bespoke Orders ↗</span>
                  </div>
                  <ChevronRight size={14} className={activeTab === 'orders' ? "text-luxury-gold" : "text-white/20"} />
                </button>

                <button
                  onClick={() => {
                    if (onViewWishlistOnSeparatePage) {
                      onClose();
                      onViewWishlistOnSeparatePage();
                    } else {
                      setActiveTab('wishlist');
                      setSelectedOrder(null);
                    }
                  }}
                  className={`w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider py-3 px-3.5 rounded-xl transition-all border duration-200 cursor-pointer ${
                    activeTab === 'wishlist'
                      ? 'bg-gradient-to-r from-luxury-purple-glowing/20 to-luxury-gold/10 text-luxury-gold border-luxury-gold/40 shadow-md font-black'
                      : 'text-white/60 hover:text-white hover:bg-white/[0.03] border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Heart size={14} className={activeTab === 'wishlist' ? "text-luxury-gold animate-pulse" : "text-white/40"} />
                    <span>My Wishlist ↗</span>
                  </div>
                  <ChevronRight size={14} className={activeTab === 'wishlist' ? "text-luxury-gold" : "text-white/20"} />
                </button>

                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider py-3 px-3.5 rounded-xl transition-all border duration-200 cursor-pointer ${
                    activeTab === 'profile'
                      ? 'bg-gradient-to-r from-luxury-purple-glowing/20 to-luxury-gold/10 text-luxury-gold border-luxury-gold/40 shadow-md font-black'
                      : 'text-white/60 hover:text-white hover:bg-white/[0.03] border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <User size={14} className={activeTab === 'profile' ? "text-luxury-gold animate-pulse" : "text-white/40"} />
                    <span>Manage Account</span>
                  </div>
                  <ChevronRight size={14} className={activeTab === 'profile' ? "text-luxury-gold" : "text-white/20"} />
                </button>
              </div>

              {/* Quick Actions Support Block */}
              <div className="mt-auto pt-4 border-t border-white/[0.06] space-y-2.5 bg-black/[0.1] p-3 rounded-xl border border-white/[0.03]">
                <div className="text-[10px] text-white/40 uppercase font-mono tracking-widest text-center leading-normal">
                  Need Help, concierge?
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={onOpenChat}
                    className="flex items-center justify-center gap-1.5 bg-white/5 border border-white/10 hover:border-luxury-gold/40 rounded-lg p-2 text-[10px] text-white/80 hover:text-white transition-all uppercase tracking-wider font-bold cursor-pointer hover:bg-white/[0.08]"
                  >
                    <MessageSquare size={11} className="text-luxury-gold" />
                    <span>Live Chat</span>
                  </button>
                  <button 
                    onClick={() => {
                      const text = "Hi, I am logged in to my Style X VIP lounge and would like support.";
                      window.open(`https://wa.me/${whatsappNumber.replace(/[\s+]/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
                    }}
                    className="flex items-center justify-center gap-1.5 bg-emerald-950/20 border border-emerald-500/20 hover:border-emerald-400 rounded-lg p-2 text-[10px] text-emerald-400 hover:text-emerald-300 transition-all uppercase tracking-wider font-bold cursor-pointer hover:bg-emerald-500/10"
                  >
                    <Phone size={11} />
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Main Interactive Screen Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col min-h-0 bg-black/10">
              
              {/* TAB 1: BESPOKE ORDERS LIST & DETAILED PREVIEW */}
              {activeTab === 'orders' && (
                <div className="flex-1 flex flex-col space-y-4 min-h-0">
                  
                  {/* Sub Header */}
                  <div className="flex items-center justify-between flex-shrink-0">
                    <h4 className="text-xs uppercase font-black tracking-widest text-white/80 font-mono flex items-center gap-2">
                      <Sparkles size={12} className="text-luxury-gold animate-pulse" />
                      {selectedOrder ? "Order Live Tracker" : `VIP Secure Purchase Log (${customerOrders.length})`}
                    </h4>
                    {selectedOrder && (
                      <button 
                        onClick={() => setSelectedOrder(null)}
                        className="text-[10px] font-mono text-[#d4af37] uppercase tracking-widest hover:underline flex items-center gap-1.5 border border-[#d4af37]/20 px-2.5 py-1 rounded-lg hover:bg-[#d4af37]/5 transition-all cursor-pointer"
                      >
                        ← Back to List
                      </button>
                    )}
                  </div>

                  {/* Split or single view */}
                  {!selectedOrder ? (
                    // Orders List Mode
                    customerOrders.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center border border-white/5 bg-white/[0.01] rounded-2xl p-8 text-center max-w-xl mx-auto my-auto space-y-4">
                        <div className="w-12 h-12 rounded-full bg-white/[0.03] flex items-center justify-center text-white/30 border border-white/10">
                          <History size={20} />
                        </div>
                        <div className="space-y-1.5">
                          <p className="text-xs sm:text-sm font-medium text-white/80">No Bespoke Purchases Catalogued</p>
                          <p className="text-[10.5px] text-white/40 leading-relaxed font-sans max-w-sm">
                            We haven't catalogued any purchases corresponding to your member email (<strong>{customer.email}</strong>) or matching your mobile references.
                          </p>
                        </div>
                        <p className="text-[9.5px] text-[#d4af37] font-mono uppercase bg-[#d4af37]/5 border border-[#d4af37]/10 py-1.5 px-3 rounded-lg max-w-xs">
                          🛍️ ANY PIECE BOUGHT WITH THIS ACCOUNT DETAILS WILL SHOW UP HERE SECURELY
                        </p>
                      </div>
                    ) : (
                      // Display clean, table-based history of all past orders
                      <div className="w-full overflow-x-auto rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.02] to-transparent shadow-lg font-sans" id="customer-orders-table-container">
                        <table className="w-full min-w-[650px] border-collapse text-left text-xs text-white/80">
                          <thead>
                            <tr className="border-b border-white/10 bg-white/[0.03] text-[10px] uppercase tracking-widest font-mono text-[#d4af37]">
                              <th className="py-4 px-4 font-black">Order ID</th>
                              <th className="py-4 px-4 font-black">Date</th>
                              <th className="py-4 px-4 font-black">Bespoke Pieces</th>
                              <th className="py-4 px-4 font-black">Status</th>
                              <th className="py-4 px-4 font-black">Total Price</th>
                              <th className="py-4 px-4 font-black text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/[0.06]">
                            {customerOrders.map((ord) => {
                              const itemsCount = ord.items?.reduce((s, i) => s + i.quantity, 0) || 0;
                              const statusLabel = 
                                ord.status === 'PENDING' ? 'Processing' :
                                ord.status === 'CONFIRMED' ? 'Packed' :
                                ord.status === 'SHIPPED' ? 'Shipped' :
                                ord.status === 'DELIVERED' ? 'Delivered' :
                                ord.status;

                              return (
                                <tr 
                                  key={ord.id}
                                  onClick={() => setSelectedOrder(ord)}
                                  className="group hover:bg-white/[0.03] transition-colors duration-200 cursor-pointer"
                                >
                                  {/* Order ID */}
                                  <td className="py-4 px-4 font-mono font-black text-[#ffd700] uppercase group-hover:text-white transition-colors">
                                    #{ord.id}
                                  </td>
                                  
                                  {/* Date */}
                                  <td className="py-4 px-4 text-white/60">
                                    {new Date(ord.date).toLocaleDateString()}
                                  </td>

                                  {/* Items */}
                                  <td className="py-4 px-4 max-w-[200px]">
                                    <div className="truncate text-white/95 font-medium" title={ord.items?.map(i => i.title).join(', ')}>
                                      {ord.items?.map(i => i.title).join(', ')}
                                    </div>
                                    <div className="text-[10px] text-white/40 font-mono mt-0.5">
                                      {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
                                    </div>
                                  </td>

                                  {/* Status */}
                                  <td className="py-4 px-4">
                                    <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                                      ord.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.15)]' :
                                      ord.status === 'CONFIRMED' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_8px_rgba(59,130,246,0.15)]' :
                                      ord.status === 'SHIPPED' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-[0_0_8px_rgba(168,85,247,0.15)]' :
                                      ord.status === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.15)]' :
                                      'bg-red-500/10 text-red-400 border border-red-500/20'
                                    }`}>
                                      <span className={`w-1.5 h-1.5 rounded-full ${
                                        ord.status === 'PENDING' ? 'bg-amber-400 animate-pulse' :
                                        ord.status === 'CONFIRMED' ? 'bg-blue-400' :
                                        ord.status === 'SHIPPED' ? 'bg-purple-400' :
                                        ord.status === 'DELIVERED' ? 'bg-emerald-400' :
                                        'bg-red-400'
                                      }`}></span>
                                      {statusLabel}
                                    </span>
                                  </td>

                                  {/* Total Price */}
                                  <td className="py-4 px-4 font-black text-white group-hover:text-[#ffd700] transition-colors">
                                    {formatPrice(ord.totalAmount)}
                                  </td>

                                  {/* Actions link to track details */}
                                  <td className="py-4 px-4 text-right">
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedOrder(ord);
                                      }}
                                      className="inline-flex items-center gap-1 text-[9px] font-mono font-black text-[#d4af37] uppercase tracking-widest border border-[#d4af37]/30 hover:border-[#ffd700] hover:bg-[#d4af37]/10 py-1.5 px-3 rounded-lg transition-all"
                                      id={`track-order-btn-${ord.id}`}
                                    >
                                      <span>TRACK DETAILS ↗</span>
                                    </button>
                                  </td>

                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )
                  ) : (
                    // Detailed Order Tracking Mode
                    <div className="space-y-5 flex-1 overflow-y-auto animate-fade-in pr-1.5 custom-scrollbar pb-10">
                      
                      {/* Top Order Quick Header */}
                      <div className="bg-[#0f0a1c] border border-luxury-gold/20 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="space-y-1 text-left">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-white/40 uppercase font-mono">Bespoke ID:</span>
                            <span className="font-mono text-sm font-black text-luxury-gold tracking-wide uppercase flex items-center gap-1">
                              #{selectedOrder.id}
                              <button 
                                onClick={() => handleCopyId(selectedOrder.id)}
                                className="text-white/40 hover:text-luxury-gold p-1 rounded hover:bg-white/5 transition-all"
                                title="Copy Tracking ID"
                              >
                                {copiedId === selectedOrder.id ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                              </button>
                            </span>
                          </div>
                          <p className="text-[10.5px] font-mono text-white/50">
                            DATE LOGGED: {new Date(selectedOrder.date).toLocaleDateString()} {new Date(selectedOrder.date).toLocaleTimeString()}
                          </p>
                        </div>

                        {/* Order QR code */}
                        <div className="flex items-center gap-3 bg-black/40 border border-white/5 p-2 rounded-xl self-stretch sm:self-auto justify-center">
                          <div className="relative w-12 h-12 bg-white rounded p-0.5 border border-luxury-gold/20 flex-shrink-0 flex items-center justify-center">
                            <img 
                              src={generateOrderQrUrl(selectedOrder.id)} 
                              alt="Order QR Code" 
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="text-left font-mono">
                            <span className="text-[8px] text-luxury-gold font-bold uppercase tracking-widest block">ORDER CONCIERGE</span>
                            <span className="text-[7px] text-white/30 uppercase block mt-0.5">SCAN TO VERIFY RECEIPT</span>
                          </div>
                        </div>
                      </div>

                      {/* Visual Timeline Tracker */}
                      {selectedOrder.status !== 'CANCELLED' ? (
                        <div className="bg-black/40 border border-white/5 rounded-xl p-4 sm:p-5 text-left">
                          <h5 className="font-display text-[9.5px] text-[#d4af37] tracking-[0.2em] uppercase mb-6 font-black flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] shadow-[0_0_8px_#d4af37] animate-pulse"></span>
                            Trajectory Trackmap
                          </h5>

                          {(() => {
                            const { steps, activeIndex } = getStatusSteps(selectedOrder.status);
                            return (
                              <div className="grid grid-cols-1 sm:grid-cols-4 gap-5 relative">
                                
                                {/* Horizontal progress bar behind icons on wide screens */}
                                <div className="hidden sm:block absolute top-[21px] left-[10%] right-[10%] h-[1.5px] bg-white/5 z-0">
                                  <div 
                                    className="h-full bg-gradient-to-r from-luxury-purple-glowing to-luxury-gold transition-all duration-1000 shadow-[0_0_8px_rgba(212,175,55,0.5)]"
                                    style={{ width: `${(activeIndex / 3) * 100}%` }}
                                  ></div>
                                </div>

                                {steps.map((step, idx) => {
                                  const isPassed = idx <= activeIndex;
                                  const isCurrent = idx === activeIndex;

                                  return (
                                    <div 
                                      key={step.code} 
                                      className={`relative flex flex-row sm:flex-col items-center gap-3.5 text-left sm:text-center z-10 transition-all duration-300 ${
                                        isPassed ? 'opacity-100' : 'opacity-35'
                                      }`}
                                    >
                                      {/* Step Circle */}
                                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-300 ${
                                        isCurrent 
                                          ? 'bg-luxury-gold text-black border-luxury-gold ring-4 ring-luxury-gold/15 scale-105 shadow-[0_0_15px_rgba(212,175,55,0.4)] font-black'
                                          : isPassed 
                                            ? 'bg-purple-950/20 text-luxury-gold border-luxury-gold/50'
                                            : 'bg-zinc-900 text-zinc-600 border-white/5'
                                      }`}>
                                        {isPassed && !isCurrent ? (
                                          <Check size={14} className="stroke-[3]" />
                                        ) : (
                                          <span className="font-mono text-xs">{idx + 1}</span>
                                        )}
                                      </div>

                                      {/* Labels and Details */}
                                      <div className="space-y-0.5">
                                        <p className={`font-serif text-xs font-bold uppercase tracking-wider ${
                                          isCurrent ? 'text-luxury-gold font-black' : 'text-white/80'
                                        }`}>
                                          {step.label}
                                        </p>
                                        <p className="text-[9.5px] text-white/40 leading-tight font-sans max-w-[150px] sm:mx-auto">
                                          {step.description}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })}

                              </div>
                            );
                          })()}
                        </div>
                      ) : (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-left text-red-400">
                          <AlertTriangle size={20} className="flex-shrink-0 animate-bounce" />
                          <div>
                            <p className="text-xs font-black uppercase font-mono tracking-widest">ORDER DEACTIVATED / CANCELLED</p>
                            <p className="text-[10.5px] text-white/50 mt-0.5 font-sans">This collection reservation has been archived or removed from active fulfillment status.</p>
                          </div>
                        </div>
                      )}

                      {/* Split Grid for Items & Details */}
                      <div className="grid gap-4 md:grid-cols-2 text-left">
                        
                        {/* Box 1: Items list */}
                        <div className="bg-black/40 border border-white/5 rounded-xl p-4 space-y-3 flex flex-col justify-between">
                          <div className="space-y-3">
                            <h5 className="font-serif text-[11px] font-black uppercase tracking-wider text-white/90 border-b border-white/[0.04] pb-2">
                              Bespoke Selections
                            </h5>
                            
                            <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                              {selectedOrder.items?.map((item, idx) => {
                                const matchedProduct = products.find(p => p.id === item.productId);
                                const imgUrl = matchedProduct?.imageUrl || "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=300&auto=format&fit=crop";
                                return (
                                  <div key={idx} className="flex items-center gap-2.5 bg-white/[0.01] hover:bg-white/[0.02] p-2 rounded-xl border border-white/[0.04] transition-colors">
                                    <img 
                                      src={imgUrl} 
                                      referrerPolicy="no-referrer"
                                      alt={item.title}
                                      className="w-10 h-10 rounded-lg object-cover border border-white/10 flex-shrink-0"
                                    />
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs font-bold text-white truncate font-serif">{item.title}</p>
                                      <p className="text-[10px] text-white/40 font-mono mt-0.5">
                                        {matchedProduct?.code || 'SX-PC'} {item.selectedSize ? `• SIZE: ${item.selectedSize}` : ''}
                                      </p>
                                    </div>
                                    <div className="text-right shrink-0 font-mono text-[10.5px]">
                                      <p className="text-white font-bold">{formatPrice(item.price)}</p>
                                      <p className="text-[#d4af37] text-[9.5px]">Qty: {item.quantity}</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          <div className="pt-3 border-t border-white/[0.05] space-y-1.5 font-mono text-[11px]">
                            <div className="flex justify-between text-white/40">
                              <span>BASE PRICE:</span>
                              <span className="text-white/80">{formatPrice(selectedOrder.items?.reduce((s, i) => s + (i.price * i.quantity), 0) || 0)}</span>
                            </div>
                            <div className="flex justify-between text-white/40">
                              <span>DELIVERY SERVICE:</span>
                              <span className="text-white/80">INCLUDED</span>
                            </div>
                            <div className="flex justify-between text-white/80 font-serif font-black text-xs pt-1 border-t border-white/[0.02]">
                              <span className="text-luxury-gold uppercase tracking-widest">TOTAL AMOUNT:</span>
                              <span className="text-luxury-gold text-sm">{formatPrice(selectedOrder.totalAmount)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Box 2: Delivery Destination Details & Estimates */}
                        <div className="bg-black/40 border border-white/5 rounded-xl p-4 space-y-4">
                          <div className="space-y-3">
                            <h5 className="font-serif text-[11px] font-black uppercase tracking-wider text-white/90 border-b border-white/[0.04] pb-2">
                              Dispatched Destination
                            </h5>
                            
                            <div className="space-y-2.5 text-xs text-white/80 leading-relaxed">
                              <div>
                                <span className="text-[9.5px] uppercase font-mono text-white/35 block">RECIPIENT LEGAL NAME</span>
                                <p className="font-serif font-bold text-white text-xs mt-0.5">{selectedOrder.customerName}</p>
                              </div>

                              <div>
                                <span className="text-[9.5px] uppercase font-mono text-white/35 block">CONTACT HANDHELD</span>
                                <p className="font-mono text-white/90 text-[11px] mt-0.5">{selectedOrder.customerPhone}</p>
                              </div>

                              <div>
                                <span className="text-[9.5px] uppercase font-mono text-white/35 block flex items-center gap-1">
                                  <MapPin size={10} className="text-luxury-gold" />
                                  SHIPPING COORDINATES
                                </span>
                                <p className="text-[11px] mt-0.5 text-white/90">{selectedOrder.customerAddress}, {selectedOrder.customerCity}</p>
                                {selectedOrder.customerNotes && (
                                  <div className="mt-1.5 p-2 bg-[#d4af37]/5 border border-[#d4af37]/10 rounded-lg text-[9.5px] italic text-amber-300">
                                    <span className="font-mono font-bold not-italic text-[8px] uppercase block tracking-wider mb-0.5">MEMBER MEMO</span>
                                    "{selectedOrder.customerNotes}"
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Delivery Duration Estimation */}
                          <div className="pt-3 border-t border-white/[0.05] space-y-2.5">
                            <div className="flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-3 text-emerald-400">
                              <Truck size={14} className="animate-pulse shrink-0" />
                              <div className="text-left font-mono">
                                <span className="text-[8.5px] font-black uppercase tracking-wider block">Estimated Dispatch</span>
                                <span className="text-[10px] text-white/80 block mt-0.5">
                                  {selectedOrder.status === 'DELIVERED' 
                                    ? 'VERIFIED & COMPLETED' 
                                    : `Fulfillment within 3-5 standard working days`}
                                </span>
                              </div>
                            </div>

                            <button 
                              onClick={() => handleWhatsAppInquiry(selectedOrder.id)}
                              className="w-full flex items-center justify-center gap-2 bg-[#d4af37]/10 border border-[#d4af37]/40 hover:border-luxury-gold text-luxury-gold hover:text-white hover:bg-luxury-gold/20 font-mono text-[10px] uppercase font-black tracking-widest py-3 rounded-xl transition-all cursor-pointer shadow-inner"
                            >
                              <Phone size={12} />
                              <span>INQUIRE VIA WHATSAPP CONCIERGE</span>
                            </button>
                          </div>
                        </div>

                      </div>

                    </div>
                  )}

                </div>
              )}

              {/* TAB 2: MANAGE PROFILE FORM */}
              {activeTab === 'profile' && (
                <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full p-6 sm:p-8 space-y-6 text-left py-6 bg-white/[0.08] backdrop-blur-[20px] border border-white/15 rounded-[24px] shadow-[0_25px_60px_rgba(0,0,0,0.35)]">
                  
                  <div className="text-center space-y-1.5">
                    <div className="w-14 h-14 bg-gradient-to-tr from-luxury-purple-glowing/10 to-luxury-gold/10 border border-luxury-gold/30 rounded-full flex items-center justify-center text-luxury-gold mx-auto shadow-lg">
                      <User size={22} className="text-luxury-gold" />
                    </div>
                    <h4 className="font-serif text-base font-black text-white uppercase tracking-widest">
                      Bespoke VIP credentials
                    </h4>
                    <p className="text-[10px] text-white/40 uppercase font-mono tracking-widest">
                      Manage exclusive credential records
                    </p>
                  </div>
 
                   <form onSubmit={handleProfileSave} className="space-y-5 font-display">
                    
                     {saveSuccess && (
                       <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-[10.5px] font-mono flex items-center gap-2 animate-fade-in shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                         <CheckCircle size={14} className="shrink-0 text-emerald-400" />
                         <span className="font-semibold">VIP Membership profile records updated successfully!</span>
                       </div>
                     )}
 
                     {saveError && (
                       <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-[10.5px] font-mono flex items-center gap-2 animate-shake shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                         <AlertTriangle size={14} className="shrink-0 text-red-400" />
                         <span className="font-semibold">⚠️ {saveError}</span>
                       </div>
                     )}
 
                     <div className="space-y-1.5">
                       <label className="block text-xs font-semibold text-white pl-0.5">
                         VIP Member Email (Immutable)
                       </label>
                       <div className="relative">
                         <Mail size={16} className="absolute left-4.5 top-1/2 -translate-y-1/2 text-white/40" />
                         <input 
                           type="email" 
                           disabled
                           value={customer.email}
                           className="w-full h-[54px] bg-white/[0.02] text-white/50 text-[15px] border border-white/5 rounded-2xl py-[14px] pl-[46px] pr-[18px] focus:outline-none cursor-not-allowed font-mono shadow-sm"
                         />
                       </div>
                     </div>
 
                     <div className="space-y-1.5">
                       <label className="block text-xs font-semibold text-white pl-0.5">
                         Full Legal Name <span className="text-luxury-gold font-bold">*</span>
                       </label>
                       <div className="relative group/input">
                         <User size={16} className="absolute left-4.5 top-1/2 -translate-y-1/2 text-white/40 group-focus-within/input:text-luxury-gold transition-colors duration-300" />
                         <input 
                           type="text" 
                           required 
                           disabled={!isEditing}
                           value={name}
                           onChange={(e) => setName(e.target.value)}
                           placeholder="Your full legal name"
                           className={`w-full h-[54px] bg-white/[0.04] text-white text-[15px] border rounded-2xl py-[14px] pl-[46px] pr-[18px] transition-all duration-300 ease-out focus:bg-white/[0.08] focus:border-luxury-gold/50 focus:shadow-[0_0_20px_rgba(212,175,55,0.15)] focus:outline-none placeholder-white/40 font-sans font-medium ${
                             isEditing ? 'border-white/15 hover:border-white/25' : 'border-white/5 cursor-not-allowed text-white/70'
                           }`}
                         />
                       </div>
                     </div>
 
                     <div className="space-y-1.5">
                       <label className="block text-xs font-semibold text-white pl-0.5">
                         WhatsApp Mobile Reference <span className="text-luxury-gold font-bold">*</span>
                       </label>
                       <div className="relative group/input">
                         <Phone size={16} className="absolute left-4.5 top-1/2 -translate-y-1/2 text-white/40 group-focus-within/input:text-luxury-gold transition-colors duration-300" />
                         <input 
                           type="tel" 
                           required
                           disabled={!isEditing}
                           value={phone}
                           onChange={(e) => setPhone(e.target.value)}
                           placeholder="e.g. 017xxxxxxxx"
                           className={`w-full h-[56px] bg-white/[0.08] text-white text-[16px] border-2 rounded-[16px] py-[16px] pl-[46px] pr-[18px] transition-all duration-300 ease-out focus:bg-white/[0.12] focus:scale-[1.01] hover:scale-[1.01] focus:border-[#FFD700] focus:shadow-[0_0_15px_rgba(255,215,0,0.3)] focus:outline-none placeholder-white/60 font-mono font-medium ${
                             isEditing ? 'border-white/15 hover:border-white/25' : 'border-white/5 cursor-not-allowed text-white/70'
                           }`}
                         />
                       </div>
                     </div>
 
                     <div className="space-y-1.5">
                       <label className="block text-xs font-semibold text-white pl-0.5">
                         Security Gate Password <span className="text-luxury-gold font-bold">*</span>
                       </label>
                       <div className="relative group/input">
                         <Lock size={16} className="absolute left-4.5 top-1/2 -translate-y-1/2 text-white/40 group-focus-within/input:text-luxury-gold transition-colors duration-300" />
                         <input 
                           type="password" 
                           required
                           disabled={!isEditing}
                           value={password}
                           onChange={(e) => setPassword(e.target.value)}
                           placeholder="••••••••"
                           className={`w-full h-[56px] bg-white/[0.08] text-white text-[16px] border-2 rounded-[16px] py-[16px] pl-[46px] pr-[18px] transition-all duration-300 ease-out focus:bg-white/[0.12] focus:scale-[1.01] hover:scale-[1.01] focus:border-[#FFD700] focus:shadow-[0_0_15px_rgba(255,215,0,0.3)] focus:outline-none placeholder-white/60 font-mono font-medium ${
                             isEditing ? 'border-white/15 hover:border-white/25' : 'border-white/5 cursor-not-allowed text-white/70'
                           }`}
                         />
                       </div>
                     </div>
 
                     {/* Action Panel */}
                     <div className="pt-3">
                       {!isEditing ? (
                         <button
                           type="button"
                           onClick={() => setIsEditing(true)}
                           className="w-full h-[56px] bg-gradient-to-r from-luxury-purple/40 to-luxury-purple-glowing/30 border border-luxury-purple-glowing/40 text-white font-display font-black text-sm uppercase tracking-widest rounded-[18px] hover:bg-luxury-purple-glowing/20 hover:border-luxury-gold/50 hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(192,132,252,0.3)] transition-all duration-300 cursor-pointer text-center"
                         >
                           Modify Personal Credentials
                         </button>
                       ) : (
                         <div className="grid grid-cols-2 gap-4">
                           <button
                             type="button"
                             onClick={() => {
                               setIsEditing(false);
                               if (customer) {
                                 setName(customer.name || '');
                                 setPhone(customer.phone || '');
                                 setPassword(customer.password || '');
                               }
                             }}
                             className="w-full h-[56px] bg-white/5 border border-white/10 text-white font-display font-bold text-sm uppercase tracking-widest rounded-[18px] hover:bg-white/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer text-center"
                           >
                             Cancel
                           </button>
                           <button
                             type="submit"
                             className="w-full h-[56px] bg-gradient-to-r from-[#FFD700] to-[#FFB700] text-black font-display font-black text-sm uppercase tracking-widest rounded-[18px] hover:scale-[1.01] hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(255,215,0,0.4)] transition-all duration-300 cursor-pointer text-center"
                           >
                             Save Changes
                           </button>
                         </div>
                       )}
                     </div>
 
                   </form>
                 </div>
               )}

              {/* TAB 3: WISHLIST PIECES */}
              {activeTab === 'wishlist' && (
                <div className="flex-1 flex flex-col space-y-4 min-h-0">
                  <div className="flex items-center justify-between flex-shrink-0">
                    <h4 className="text-xs uppercase font-black tracking-widest text-white/80 font-mono flex items-center gap-2">
                      <Heart size={12} className="text-luxury-purple-glowing animate-pulse fill-luxury-purple-glowing" />
                      My Wishlist Pieces ({wishlistedProducts.length})
                    </h4>
                  </div>

                  {wishlistedProducts.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center border border-white/5 bg-white/[0.01] rounded-2xl p-8 text-center max-w-xl mx-auto my-auto space-y-4">
                      <div className="w-12 h-12 rounded-full bg-white/[0.03] flex items-center justify-center text-white/30 border border-white/10">
                        <Heart size={20} />
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-xs sm:text-sm font-medium text-white/80">No Pieces Wishlisted Yet</p>
                        <p className="text-[10.5px] text-white/40 leading-relaxed font-sans max-w-sm text-center">
                          Explore our boutique collection and tap the heart icon on any piece to catalog it here.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pr-1.5 custom-scrollbar pb-6">
                      {wishlistedProducts.map((product) => {
                        return (
                          <WishlistItemCard 
                            key={product.id}
                            product={product}
                            onToggleWishlist={onToggleWishlist}
                            onAddToCart={onAddToCart}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

            </div>

          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function WishlistItemCard({
  product,
  onToggleWishlist,
  onAddToCart
}: {
  product: Product;
  onToggleWishlist: (p: Product) => void;
  onAddToCart: (p: Product, size: string) => void;
}) {
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes?.[0] || 'Default');
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleMoveToCart = () => {
    onAddToCart(product, selectedSize);
    onToggleWishlist(product);
  };

  return (
    <div className="group bg-gradient-to-b from-white/[0.02] to-transparent border border-white/10 hover:border-luxury-gold/45 rounded-xl p-3 flex flex-col justify-between transition-all duration-300 relative overflow-hidden select-none">
      
      {/* Remove from wishlist button */}
      <button 
        onClick={() => onToggleWishlist(product)}
        className="absolute top-2.5 right-2.5 z-20 w-7 h-7 bg-black/60 backdrop-blur-md rounded-full border border-white/5 hover:border-red-500/50 hover:text-red-400 text-white/60 flex items-center justify-center transition-all cursor-pointer"
        title="Remove from wishlist"
      >
        <Trash2 size={12} />
      </button>

      {/* Image frame */}
      <div className="product-image-container relative aspect-square w-full overflow-hidden rounded-lg bg-[#0f0f12] flex items-center justify-center border border-white/5 transition-all duration-300 mb-2.5 p-1.5">
        {/* Premium skeleton loading backdrop */}
        {!imageLoaded && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gradient-to-br from-[#0a0a0c] via-[#121217] to-[#0a0a0c]">
            {/* Soft pulsing gold and purple glowing ring loader */}
            <div className="relative w-8 h-8 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-luxury-gold/10 border-t-luxury-gold/80 animate-spin"></div>
              <div className="absolute inset-1 rounded-full border border-luxury-purple-glowing/10 border-b-luxury-purple-glowing/60 animate-spin-slow"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-luxury-gold animate-pulse"></div>
            </div>
            {/* Elegant luxury loading shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer"></div>
          </div>
        )}

        <img 
          src={product.imageUrl} 
          referrerPolicy="no-referrer"
          alt={product.title}
          onLoad={() => setImageLoaded(true)}
          className={`w-full h-full object-contain object-center transition-all duration-1000 ease-out group-hover:scale-105 z-10 ${
            imageLoaded ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-95 blur-md'
          }`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none z-0" />
      </div>

      {/* Title & Info */}
      <div className="text-left space-y-1 mb-2">
        <h4 className="font-serif text-[13px] font-bold text-white hover:text-luxury-purple-glowing transition-colors line-clamp-1">
          {product.title}
        </h4>
        <p className="text-[10px] text-white/40 font-mono">
          {product.code || 'SX-PC'}
        </p>
      </div>

      {/* Price */}
      <div className="flex items-center gap-1.5 justify-start text-left mb-2.5">
        {product.offerPrice ? (
          <>
            <span className="text-luxury-gold font-mono font-bold text-xs">
              {formatPrice(product.offerPrice)}
            </span>
            <span className="text-[9.5px] text-white/40 line-through font-mono">
              {formatPrice(product.price)}
            </span>
          </>
        ) : (
          <span className="text-luxury-gold font-mono font-bold text-xs">
            {formatPrice(product.price)}
          </span>
        )}
      </div>

      {/* Sizes selector inside card */}
      {product.sizes && product.sizes.length > 0 && (
        <div className="mb-3 text-left">
          <p className="text-[8px] text-white/40 uppercase font-mono tracking-wider mb-1">SELECT SIZE</p>
          <div className="flex flex-wrap gap-1">
            {product.sizes.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`h-5 min-w-[20px] px-1 rounded text-[7.5px] font-display font-semibold border uppercase tracking-wider flex items-center justify-center transition-all cursor-pointer ${
                  selectedSize === size
                    ? 'bg-gradient-to-br from-luxury-gold to-[#f0c742] text-luxury-black border-luxury-gold shadow-[0_0_8px_rgba(212,175,55,0.3)]'
                    : 'bg-black/40 text-white/70 border-white/5 hover:border-luxury-gold/30'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Move to Cart action button */}
      <button
        onClick={handleMoveToCart}
        disabled={product.stock === 0}
        className="w-full h-8 bg-gradient-to-r from-luxury-purple/50 to-[#9A4DFF]/40 hover:from-luxury-purple hover:to-[#9A4DFF] border border-luxury-purple-glowing/40 hover:border-luxury-purple-glowing text-white text-[10px] uppercase font-mono font-black tracking-widest rounded-lg flex items-center justify-center gap-1.5 transition-all duration-300 cursor-pointer shadow-md"
      >
        <ShoppingBag size={11} />
        <span>Move to Cart</span>
      </button>

    </div>
  );
}

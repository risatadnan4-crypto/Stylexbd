import { useState, useEffect, useMemo } from 'react';
import { 
  History, Search, Filter, RotateCcw, Sparkles, Check, Copy, 
  Clock, Truck, CheckCircle, AlertTriangle, Phone, MessageSquare, 
  ShoppingBag, ChevronRight, ArrowRight, ExternalLink, Calendar,
  DollarSign, RefreshCw
} from 'lucide-react';
import { Order, Product, Customer } from '../types';
import { formatPrice, generateOrderQrUrl } from '../utils';

interface OrderHistoryProps {
  customer: Customer;
  orders: Order[]; // Fallback / initial orders prop
  products: Product[];
  whatsappNumber?: string;
  onOpenChat: () => void;
  onAddToCart?: (p: Product, size: string) => void;
}

export default function OrderHistory({
  customer,
  orders: initialOrders,
  products,
  whatsappNumber = "8801755104443",
  onOpenChat,
  onAddToCart
}: OrderHistoryProps) {
  const [dbOrders, setDbOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'>('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'amount_high' | 'amount_low'>('newest');

  // Selected Order for detailed tracking view
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch orders from database on mount or when customer changes
  const fetchOrdersFromDb = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const fetchedData: Order[] = await res.json();
        setDbOrders(fetchedData);
      } else {
        console.warn('Failed to fetch orders from database API, using cached state.');
        setError('Could not refresh live DB orders; displaying cached records.');
      }
    } catch (err) {
      console.error('Error querying database orders:', err);
      setError('Database connection offline. Showing locally saved orders.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrdersFromDb();
  }, [customer.email, customer.phone]);

  // Combine fetched orders with initialOrders prop to ensure no order is missing
  const combinedOrders = useMemo(() => {
    const map = new Map<string, Order>();
    
    // Add initial orders first
    (initialOrders || []).forEach(o => {
      if (o && o.id) map.set(String(o.id), o);
    });

    // Add db orders (overwriting or supplementing)
    dbOrders.forEach(o => {
      if (o && o.id) map.set(String(o.id), o);
    });

    return Array.from(map.values());
  }, [initialOrders, dbOrders]);

  // Filter orders for current logged-in customer (email or phone match)
  const customerOrders = useMemo(() => {
    return combinedOrders.filter(order => {
      if (!order) return false;

      const matchEmail = Boolean(
        customer.email && 
        order.customerEmail && 
        order.customerEmail.toLowerCase().trim() === customer.email.toLowerCase().trim()
      );

      const cleanCustPhone = customer.phone ? customer.phone.replace(/[\s+]/g, '').trim() : '';
      const cleanOrderPhone = order.customerPhone ? order.customerPhone.replace(/[\s+]/g, '').trim() : '';

      const matchPhone = Boolean(
        cleanCustPhone && cleanOrderPhone && (
          cleanOrderPhone === cleanCustPhone ||
          (cleanCustPhone.length >= 10 && cleanOrderPhone.endsWith(cleanCustPhone.slice(-10)))
        )
      );

      return matchEmail || matchPhone;
    });
  }, [combinedOrders, customer.email, customer.phone]);

  // Apply search query, status filter, and sort by date or price
  const filteredAndSortedOrders = useMemo(() => {
    let list = [...customerOrders];

    // Filter by status
    if (statusFilter !== 'ALL') {
      list = list.filter(o => o.status === statusFilter);
    }

    // Filter by search query (Order ID, item title, customer address)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(o => {
        const idMatch = String(o.id).toLowerCase().includes(q);
        const itemMatch = o.items?.some(i => i.title?.toLowerCase().includes(q) || i.selectedSize?.toLowerCase().includes(q));
        const addressMatch = o.customerAddress?.toLowerCase().includes(q);
        return idMatch || itemMatch || addressMatch;
      });
    }

    // Sort by date or amount
    list.sort((a, b) => {
      const dateA = new Date(a.date).getTime() || 0;
      const dateB = new Date(b.date).getTime() || 0;

      if (sortBy === 'newest') {
        return dateB - dateA; // Descending by date
      } else if (sortBy === 'oldest') {
        return dateA - dateB; // Ascending by date
      } else if (sortBy === 'amount_high') {
        return (b.totalAmount || 0) - (a.totalAmount || 0);
      } else if (sortBy === 'amount_low') {
        return (a.totalAmount || 0) - (b.totalAmount || 0);
      }
      return 0;
    });

    return list;
  }, [customerOrders, statusFilter, searchQuery, sortBy]);

  // Calculated Stats
  const totalSpent = useMemo(() => {
    return customerOrders
      .filter(o => o.status !== 'CANCELLED')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  }, [customerOrders]);

  const deliveredCount = useMemo(() => {
    return customerOrders.filter(o => o.status === 'DELIVERED').length;
  }, [customerOrders]);

  const activeCount = useMemo(() => {
    return customerOrders.filter(o => ['PENDING', 'CONFIRMED', 'SHIPPED'].includes(o.status)).length;
  }, [customerOrders]);

  const handleCopyId = (orderId: string) => {
    navigator.clipboard.writeText(orderId);
    setCopiedId(orderId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleWhatsAppInquiry = (orderId: string) => {
    const text = `Hi, I am inquiring about my Style X Order: #${orderId}. Can you please give me a status update?`;
    window.open(`https://wa.me/${whatsappNumber.replace(/[\s+]/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
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

  return (
    <div className="flex-1 flex flex-col space-y-4 min-h-0 text-white font-sans">
      
      {/* Sub Header / Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0 bg-black/20 p-3 rounded-xl border border-white/[0.05]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-luxury-gold/10 border border-luxury-gold/20 text-luxury-gold">
            <History size={16} />
          </div>
          <div>
            <h4 className="text-xs uppercase font-black tracking-widest text-white/90 font-mono flex items-center gap-2">
              Order History Matrix
              <span className="text-[10px] text-luxury-gold bg-luxury-gold/10 px-2 py-0.5 rounded-full border border-luxury-gold/30 font-sans">
                {customerOrders.length} {customerOrders.length === 1 ? 'Record' : 'Records'}
              </span>
            </h4>
            <p className="text-[9.5px] text-white/40 font-mono">
              Database synchronized • Live client tracking
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Refresh DB button */}
          <button 
            onClick={() => fetchOrdersFromDb(true)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 text-[10px] font-mono text-luxury-gold hover:text-white uppercase tracking-wider bg-white/5 border border-luxury-gold/30 hover:bg-luxury-gold/10 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-50"
            title="Reload latest orders from database"
          >
            <RefreshCw size={12} className={isRefreshing ? "animate-spin text-luxury-gold" : ""} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync DB'}</span>
          </button>

          {selectedOrder && (
            <button 
              onClick={() => setSelectedOrder(null)}
              className="text-[10px] font-mono text-[#d4af37] uppercase tracking-widest hover:underline flex items-center gap-1.5 border border-[#d4af37]/20 px-2.5 py-1.5 rounded-lg hover:bg-[#d4af37]/5 transition-all cursor-pointer"
            >
              ← Back to List
            </button>
          )}
        </div>
      </div>

      {/* Error banner if database query fails */}
      {error && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 px-3 py-2 rounded-xl text-[10.5px] font-mono flex items-center gap-2">
          <AlertTriangle size={14} className="shrink-0 text-amber-400" />
          <span>{error}</span>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      {!selectedOrder ? (
        <div className="flex-1 flex flex-col space-y-4 min-h-0">
          
          {/* Order Metrics Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 flex-shrink-0">
            <div className="bg-gradient-to-br from-[#120824] to-[#080312] border border-white/10 p-3 rounded-xl flex items-center justify-between shadow-md">
              <div>
                <span className="text-[9px] font-mono text-white/40 uppercase block tracking-wider">TOTAL SPENT</span>
                <span className="text-xs sm:text-sm font-black text-luxury-gold font-sans mt-0.5 block">
                  {formatPrice(totalSpent)}
                </span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-luxury-gold/10 border border-luxury-gold/20 flex items-center justify-center text-luxury-gold shrink-0">
                <DollarSign size={14} />
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#120824] to-[#080312] border border-white/10 p-3 rounded-xl flex items-center justify-between shadow-md">
              <div>
                <span className="text-[9px] font-mono text-white/40 uppercase block tracking-wider">COMPLETED ORDERS</span>
                <span className="text-xs sm:text-sm font-black text-emerald-400 font-sans mt-0.5 block">
                  {deliveredCount} {deliveredCount === 1 ? 'Order' : 'Orders'}
                </span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle size={14} />
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-[#120824] to-[#080312] border border-white/10 p-3 rounded-xl flex items-center justify-between shadow-md">
              <div>
                <span className="text-[9px] font-mono text-white/40 uppercase block tracking-wider">ACTIVE IN-TRANSIT</span>
                <span className="text-xs sm:text-sm font-black text-purple-300 font-sans mt-0.5 block">
                  {activeCount} {activeCount === 1 ? 'Item' : 'Items'}
                </span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                <Truck size={14} />
              </div>
            </div>
          </div>

          {/* Search, Filter & Sort Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-black/40 p-2.5 rounded-xl border border-white/5">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Order ID or Item Title..."
                className="w-full bg-black/50 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-luxury-gold/50 transition-all font-sans"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                >
                  ×
                </button>
              )}
            </div>

            {/* Status Filter Dropdown */}
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-white/90 focus:outline-none focus:border-luxury-gold/50 cursor-pointer font-sans"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Processing (Pending)</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="SHIPPED">In Transit (Shipped)</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              {/* Sort By Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-luxury-gold font-bold focus:outline-none focus:border-luxury-gold/50 cursor-pointer font-sans"
              >
                <option value="newest">📅 Newest First</option>
                <option value="oldest">📅 Oldest First</option>
                <option value="amount_high">💰 Highest Amount</option>
                <option value="amount_low">💰 Lowest Amount</option>
              </select>
            </div>

          </div>

          {/* Orders List Container */}
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 space-y-3">
              <RefreshCw size={24} className="text-luxury-gold animate-spin" />
              <p className="text-xs font-mono text-white/50 uppercase tracking-widest">
                Fetching Order History from Database...
              </p>
            </div>
          ) : filteredAndSortedOrders.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center border border-white/5 bg-white/[0.01] rounded-2xl p-8 text-center max-w-xl mx-auto my-auto space-y-4">
              <div className="w-12 h-12 rounded-full bg-white/[0.03] flex items-center justify-center text-white/30 border border-white/10">
                <History size={20} />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs sm:text-sm font-medium text-white/80">
                  {searchQuery || statusFilter !== 'ALL' ? "No Matching Orders Found" : "No Past Orders Catalogued"}
                </p>
                <p className="text-[10.5px] text-white/40 leading-relaxed font-sans max-w-sm">
                  {searchQuery || statusFilter !== 'ALL' 
                    ? "Try adjusting your search criteria or resetting the status filters above."
                    : `We haven't catalogued any purchases corresponding to your account email (${customer.email}) or phone reference.`
                  }
                </p>
              </div>
              {(searchQuery || statusFilter !== 'ALL') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('ALL');
                    setSortBy('newest');
                  }}
                  className="text-[10px] font-mono text-luxury-gold uppercase tracking-widest border border-luxury-gold/30 hover:bg-luxury-gold/10 px-3 py-1.5 rounded-lg transition-all"
                >
                  Reset Filters
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4 overflow-y-auto flex-1 pr-1 custom-scrollbar">
              
              {/* Mobile Cards View */}
              <div className="block sm:hidden space-y-3">
                {filteredAndSortedOrders.map((ord) => {
                  const itemsCount = ord.items?.reduce((s, i) => s + i.quantity, 0) || 0;
                  const statusLabel = 
                    ord.status === 'PENDING' ? 'Processing' :
                    ord.status === 'CONFIRMED' ? 'Packed' :
                    ord.status === 'SHIPPED' ? 'Shipped' :
                    ord.status === 'DELIVERED' ? 'Delivered' :
                    ord.status;

                  return (
                    <div 
                      key={ord.id}
                      onClick={() => setSelectedOrder(ord)}
                      className="bg-[#120824]/40 border border-white/10 rounded-xl p-3.5 space-y-2.5 hover:border-luxury-gold/50 transition-all cursor-pointer text-left shadow-md active:scale-[0.99]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-black text-[#ffd700] text-sm tracking-wide">
                          #{ord.id}
                        </span>
                        <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          ord.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          ord.status === 'CONFIRMED' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          ord.status === 'SHIPPED' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                          ord.status === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
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
                      </div>

                      <div className="text-xs text-white/90 font-serif line-clamp-2">
                        {ord.items?.map(i => i.title).join(', ')}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-white/50 font-mono pt-1 border-t border-white/5">
                        <span>{new Date(ord.date).toLocaleDateString()} • {itemsCount} {itemsCount === 1 ? 'piece' : 'pieces'}</span>
                        <span className="text-[#ffd700] font-black font-sans text-xs">{formatPrice(ord.totalAmount)}</span>
                      </div>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrder(ord);
                        }}
                        className="w-full text-center text-[10px] font-mono font-black text-[#d4af37] uppercase tracking-widest border border-[#d4af37]/30 hover:border-[#ffd700] hover:bg-[#d4af37]/10 py-2 rounded-lg transition-all cursor-pointer"
                      >
                        Track Details ↗
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block w-full overflow-x-auto rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.02] to-transparent shadow-lg font-sans">
                <table className="w-full min-w-[650px] border-collapse text-left text-xs text-white/80">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.03] text-[10px] uppercase tracking-widest font-mono text-[#d4af37]">
                      <th className="py-3.5 px-4 font-black">Order ID</th>
                      <th className="py-3.5 px-4 font-black">Date & Time</th>
                      <th className="py-3.5 px-4 font-black">Bespoke Pieces</th>
                      <th className="py-3.5 px-4 font-black">Status</th>
                      <th className="py-3.5 px-4 font-black">Total Price</th>
                      <th className="py-3.5 px-4 font-black text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06]">
                    {filteredAndSortedOrders.map((ord) => {
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
                          <td className="py-3.5 px-4 font-mono font-black text-[#ffd700] uppercase group-hover:text-white transition-colors">
                            #{ord.id}
                          </td>
                          
                          <td className="py-3.5 px-4 text-white/60 font-mono text-[11px]">
                            {new Date(ord.date).toLocaleDateString()}
                          </td>

                          <td className="py-3.5 px-4 max-w-[220px]">
                            <div className="truncate text-white/95 font-medium" title={ord.items?.map(i => i.title).join(', ')}>
                              {ord.items?.map(i => i.title).join(', ')}
                            </div>
                            <div className="text-[10px] text-white/40 font-mono mt-0.5">
                              {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center gap-1.5 text-[9.5px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                              ord.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                              ord.status === 'CONFIRMED' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                              ord.status === 'SHIPPED' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                              ord.status === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
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

                          <td className="py-3.5 px-4 font-black text-white group-hover:text-[#ffd700] transition-colors">
                            {formatPrice(ord.totalAmount)}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedOrder(ord);
                              }}
                              className="inline-flex items-center gap-1 text-[9px] font-mono font-black text-[#d4af37] uppercase tracking-widest border border-[#d4af37]/30 hover:border-[#ffd700] hover:bg-[#d4af37]/10 py-1.5 px-3 rounded-lg transition-all"
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

            </div>
          )}

        </div>
      ) : (
        /* DETAILED ORDER TRACKING MODE */
        <div className="space-y-5 flex-1 overflow-y-auto animate-fade-in pr-1 custom-scrollbar pb-6 text-left">
          
          {/* Top Order Quick Header */}
          <div className="bg-[#0f0a1c] border border-luxury-gold/20 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1 text-left">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/40 uppercase font-mono">Bespoke Order ID:</span>
                <span className="font-mono text-sm font-black text-luxury-gold tracking-wide uppercase flex items-center gap-1">
                  #{selectedOrder.id}
                  <button 
                    onClick={() => handleCopyId(selectedOrder.id)}
                    className="text-white/40 hover:text-luxury-gold p-1 rounded hover:bg-white/5 transition-all"
                    title="Copy Order ID"
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
              <AlertTriangle size={18} />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider">This Order Has Been Cancelled</p>
                <p className="text-[10px] text-red-300/70">Please contact concierge support if you believe this is a mistake.</p>
              </div>
            </div>
          )}

          {/* Ordered Items Breakdown */}
          <div className="bg-black/30 border border-white/5 rounded-xl p-4 space-y-3">
            <h5 className="text-[10px] uppercase font-mono text-luxury-gold tracking-widest font-black">
              Catalogued Items ({selectedOrder.items?.length || 0})
            </h5>
            
            <div className="divide-y divide-white/5">
              {selectedOrder.items?.map((item, idx) => {
                const matchedProduct = products.find(p => p.id === item.productId || p.code === item.productId);

                return (
                  <div key={idx} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 overflow-hidden shrink-0">
                        <img 
                          src={(item as any).imageUrl || item.selectedColorImage || matchedProduct?.imageUrl || "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=300&q=80"} 
                          alt={item.title} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold text-white font-serif">{item.title}</p>
                        <p className="text-[10px] text-white/50 font-mono mt-0.5">
                          SIZE: <span className="text-luxury-gold">{item.selectedSize || 'FREE'}</span> • QTY: {item.quantity}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-white">{formatPrice(item.price * item.quantity)}</p>
                      {matchedProduct && onAddToCart && (
                        <button
                          onClick={() => onAddToCart(matchedProduct, item.selectedSize || 'M')}
                          className="text-[9px] text-luxury-gold hover:underline font-mono uppercase mt-1 block"
                        >
                          Re-Order Item
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-white/10 pt-3 flex items-center justify-between text-xs font-bold">
              <span className="font-mono text-white/60 uppercase">TOTAL AMOUNT PAID / COD:</span>
              <span className="text-sm text-luxury-gold font-sans font-black">{formatPrice(selectedOrder.totalAmount)}</span>
            </div>
          </div>

          {/* Delivery & Payment Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-black/30 border border-white/5 rounded-xl p-3.5 space-y-1">
              <span className="text-[9.5px] font-mono text-luxury-gold uppercase tracking-widest block font-bold">DELIVERY ADDRESS</span>
              <p className="text-xs text-white/80">{selectedOrder.customerName}</p>
              <p className="text-xs text-white/60">{selectedOrder.customerAddress}</p>
              <p className="text-[10.5px] text-white/40 font-mono mt-1">PHONE: {selectedOrder.customerPhone}</p>
            </div>

            <div className="bg-black/30 border border-white/5 rounded-xl p-3.5 space-y-1">
              <span className="text-[9.5px] font-mono text-luxury-gold uppercase tracking-widest block font-bold">PAYMENT METHOD</span>
              <p className="text-xs text-white/80">{selectedOrder.paymentMethod || 'CASH ON DELIVERY (COD)'}</p>
              <span className="inline-block mt-2 text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase">
                GUARANTEED LUXURY PACKAGING
              </span>
            </div>
          </div>

          {/* Direct Support Inquire */}
          <div className="pt-2">
            <button
              onClick={() => handleWhatsAppInquiry(selectedOrder.id)}
              className="w-full flex items-center justify-center gap-2 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 text-emerald-300 rounded-xl py-2.5 px-4 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              <MessageSquare size={14} />
              <span>Inquire Order Live Status on WhatsApp</span>
            </button>
          </div>

        </div>
      )}

    </div>
  );
}

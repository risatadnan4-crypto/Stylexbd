import React, { useState, useEffect, useMemo } from 'react';
import { 
  Trophy, ShieldCheck, Mail, Send, CheckCircle, Smartphone, 
  MapPin, Clock, Star, Landmark, HelpCircle, Lock, EyeOff,
  Sparkles, ClipboardList, ShoppingBag, X, Percent,
  SlidersHorizontal, RotateCcw, Bell
} from 'lucide-react';
import { Product, CartItem, Banner, Coupon, Campaign, Review, Order, Customer } from './types';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ProductCard from './components/ProductCard';
import ProductDetailModal from './components/ProductDetailModal';
import CartDrawer from './components/CartDrawer';
import OrderTracker from './components/OrderTracker';
import LiveChat from './components/LiveChat';
import LotteryModal, { LotteryPrize } from './components/LotteryModal';
import AdminPanel from './components/AdminPanel';

export default function App() {
  // Navigation states
  const [isAdminView, setIsAdminView] = useState(false);
  const [isTrackMode, setIsTrackMode] = useState(false);
  
  // Authenticated staff details
  const [isAuthAdmin, setIsAuthAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Store data list states
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  
  // Public reviews state (only approved ones are shown on front page)
  const [publicReviews, setPublicReviews] = useState<Review[]>([]);
  const [newReviewName, setNewReviewName] = useState('');
  const [newReviewComment, setNewReviewComment] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewProdId, setNewReviewProdId] = useState('');
  const [revMessage, setRevMessage] = useState('');

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [selectedSize, setSelectedSize] = useState<string>('ALL');
  const [showInStockOnly, setShowInStockOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'RELEVANCE' | 'PRICE_ASC' | 'PRICE_DESC' | 'STOCK_DESC'>('RELEVANCE');
  const [isFiltersExpanded, setIsFiltersExpanded] = useState<boolean>(false);

  // Notifications panel states
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(3);

  // Generate unique sizes list dynamically
  const uniqueSizes = useMemo(() => {
    const sizesSet = new Set<string>();
    products.forEach(p => {
      if (p.sizes && Array.isArray(p.sizes)) {
        p.sizes.forEach(sz => sizesSet.add(sz));
      }
    });
    return Array.from(sizesSet).sort();
  }, [products]);

  // Customer Shopping states
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [initialShowCheckout, setInitialShowCheckout] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isLotteryOpen, setIsLotteryOpen] = useState(false);
  const [isDiscountOpen, setIsDiscountOpen] = useState(false);
  const [discountPhone, setDiscountPhone] = useState('');
  const [isSubmittingDiscount, setIsSubmittingDiscount] = useState(false);
  const [discountStatus, setDiscountStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Successful checkout modal information
  const [confirmedOrderId, setConfirmedOrderId] = useState('');
  const [confirmedWhatsAppUrl, setConfirmedWhatsAppUrl] = useState('');
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [lastOrderToast, setLastOrderToast] = useState<Order | null>(null);
  const [viewToast, setViewToast] = useState(false);
  const [showTopBanner, setShowTopBanner] = useState(true);
  const [activeTrackId, setActiveTrackId] = useState('');

  // Customer states (Log In / Sign Up)
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(() => {
    const saved = localStorage.getItem('stylex_current_customer');
    return saved ? JSON.parse(saved) : null;
  });
  const [showCustomerAuthModal, setShowCustomerAuthModal] = useState(false);
  const [customerAuthTab, setCustomerAuthTab] = useState<'login' | 'signup'>('login');
  
  // Custom input states for Customer Auth
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerPassword, setCustomerPassword] = useState('');
  const [customerAuthError, setCustomerAuthError] = useState('');
  const [customerAuthSuccess, setCustomerAuthSuccess] = useState('');

  // Dynamic Settings (WhatsApp Support etc.)
  const [settings, setSettings] = useState<{ 
    whatsappNumber: string; 
    adminEmail?: string; 
    appsScriptUrl?: string; 
    logoUrl?: string; 
    lotteryPrizes?: LotteryPrize[]; 
    lotteryDiscountPercentage?: number;
    paymentBadgeTitle?: string;
    paymentBadgeDescription?: string;
  }>({ whatsappNumber: "8801755104443" });

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (err) {
      console.error("Failed loading settings", err);
    }
  };

  const loadOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        const sorted = data.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setAllOrders(prev => {
          if (prev.length > 0 && sorted.length > prev.length) {
            const newest = sorted[0];
            if (newest && newest.id !== prev[0]?.id) {
              setLastOrderToast(newest);
              setViewToast(true);
            }
          }
          return sorted;
        });
      }
    } catch (err) {
      console.warn("Failed loading orders", err);
    }
  };

  useEffect(() => {
    if (viewToast) {
      const timer = setTimeout(() => {
        setViewToast(false);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [viewToast]);

  // Initial Boot Data Loading
  useEffect(() => {
    loadStoreCollections();
    loadBanners();
    loadCoupons();
    loadCampaigns();
    loadReviews();
    loadSettings();
    loadOrders();

    const orderPollInterval = setInterval(loadOrders, 9000);

    // Sticky session check if already authenticated in this window
    const sessionAuth = sessionStorage.getItem('stylex_admin_auth');
    if (sessionAuth === 'true') {
      setIsAuthAdmin(true);
    }

    // Check query params or hash for admin panel auto-access/redirect
    const urlParams = new URLSearchParams(window.location.search);
    const hasAdminQuery = urlParams.get('admin') === 'true';
    const hasAdminHash = window.location.hash === '#admin';
    if (hasAdminQuery || hasAdminHash) {
      if (sessionAuth === 'true') {
        setIsAdminView(true);
      } else {
        setShowLoginModal(true);
      }
    }

    return () => clearInterval(orderPollInterval);
  }, []);

  // 100% Accurate Visitor and Presence Tracking (Heartbeat system)
  useEffect(() => {
    // Generate/retrieve consistent device visitor ID
    let visitorId = localStorage.getItem('stylex_visitor_id');
    if (!visitorId) {
      visitorId = 'visitor_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now();
      localStorage.setItem('stylex_visitor_id', visitorId);
    }

    // Generate/retrieve high-fidelity active session ID
    let sessionId = sessionStorage.getItem('stylex_session_id');
    if (!sessionId) {
      sessionId = 'sess_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now();
      sessionStorage.setItem('stylex_session_id', sessionId);
    }

    const pingSession = async () => {
      try {
        await fetch(`/api/visitor-ping?visitorId=${visitorId}&sessionId=${sessionId}`);
      } catch (err) {
        // Silent catch
      }
    };

    // Initial ping
    pingSession();
    
    // Heartbeat pulse every 12 seconds for precise live views count accuracy
    const interval = setInterval(pingSession, 12000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const loadStoreCollections = async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) setProducts(await res.json());
    } catch (err) {
      console.error("Database connection failed", err);
    }
  };

  const loadBanners = async () => {
    try {
      const res = await fetch('/api/banners');
      if (res.ok) setBanners(await res.json());
    } catch (err) {}
  };

  const loadCoupons = async () => {
    try {
      const res = await fetch('/api/coupons');
      if (res.ok) setCoupons(await res.json());
    } catch (err) {}
  };

  const loadCampaigns = async () => {
    try {
      const res = await fetch('/api/campaigns');
      if (res.ok) {
        const list = await res.json();
        const active = list.find((c: any) => c.active);
        if (active) setActiveCampaign(active);
      }
    } catch (err) {}
  };

  const loadReviews = async () => {
    try {
      const res = await fetch('/api/reviews');
      if (res.ok) {
        const list: Review[] = await res.json();
        // Return onlyApproved reviews for guest visitors
        setPublicReviews(list.filter(r => r.isApproved));
      }
    } catch (err) {}
  };

  // Cart operations
  const handleAddToCart = (product: Product, size: string) => {
    const freshCart = [...cart];
    const matchIdx = freshCart.findIndex(item => item.product.id === product.id && item.selectedSize === size);

    if (matchIdx !== -1) {
      freshCart[matchIdx].quantity += 1;
    } else {
      freshCart.push({ product, selectedSize: size, quantity: 1 });
    }

    setCart(freshCart);
    setInitialShowCheckout(false);
    setIsCartOpen(true);
  };

  const handleOrderNow = (product: Product, size: string) => {
    const freshCart = [...cart];
    const matchIdx = freshCart.findIndex(item => item.product.id === product.id && item.selectedSize === size);

    if (matchIdx !== -1) {
      freshCart[matchIdx].quantity += 1;
    } else {
      freshCart.push({ product, selectedSize: size, quantity: 1 });
    }

    setCart(freshCart);
    setInitialShowCheckout(true);
    setIsCartOpen(true);
  };

  const handleUpdateCartQty = (idx: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveCartItem(idx);
      return;
    }
    const fresh = [...cart];
    fresh[idx].quantity = newQty;
    setCart(fresh);
  };

  const handleRemoveCartItem = (idx: number) => {
    const fresh = [...cart];
    fresh.splice(idx, 1);
    setCart(fresh);
  };

  // Wishlist actions
  const handleToggleWishlist = (product: Product) => {
    if (wishlist.includes(product.id)) {
      setWishlist(wishlist.filter(id => id !== product.id));
    } else {
      setWishlist([...wishlist, product.id]);
    }
  };

  // Admin access portals login
  const handleAdminAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    // Predefined secure administrator credentials matching useremail
    const userEmail = "risatadnan4@gmail.com";
    if (loginEmail.trim() === userEmail && loginPassword === "risat123") {
      setIsAuthAdmin(true);
      sessionStorage.setItem('stylex_admin_auth', 'true');
      setShowLoginModal(false);
      setIsAdminView(true);
    } else if (loginEmail.trim() === "admin@stylex.com" && loginPassword === "admin") {
      // Direct secondary staff login
      setIsAuthAdmin(true);
      sessionStorage.setItem('stylex_admin_auth', 'true');
      setShowLoginModal(false);
      setIsAdminView(true);
    } else {
      setLoginError("INVALID ACCOUNT IDENTIFIER OR PASSWORD CREDENTIALS.");
    }
  };

  const handleLogout = () => {
    setIsAuthAdmin(false);
    setIsAdminView(false);
    sessionStorage.removeItem('stylex_admin_auth');
  };

  // Customer Login / Signup logic
  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomerAuthError('');
    setCustomerAuthSuccess('');

    const registeredRaw = localStorage.getItem('stylex_registered_customers');
    let registered: Customer[] = registeredRaw ? JSON.parse(registeredRaw) : [];

    // Pre-seed some default accounts for immediate user testing convenience
    if (registered.length === 0) {
      registered = [
        { name: "Adnan Risat", email: "risat@stylex.com", password: "user123", phone: "8801755104443" },
        { name: "Demo Guest", email: "guest@stylex.com", password: "guest", phone: "01800000000" }
      ];
      localStorage.setItem('stylex_registered_customers', JSON.stringify(registered));
    }

    if (customerAuthTab === 'login') {
      if (!customerEmail || !customerPassword) {
        setCustomerAuthError('All standard login credentials are required.');
        return;
      }
      const found = registered.find(
        c => c.email.toLowerCase().trim() === customerEmail.toLowerCase().trim() && c.password === customerPassword
      );
      if (found) {
        setCustomerAuthSuccess(`Welcome back, ${found.name}! Redirecting...`);
        setCurrentCustomer(found);
        localStorage.setItem('stylex_current_customer', JSON.stringify(found));
        setTimeout(() => {
          setShowCustomerAuthModal(false);
          setCustomerEmail('');
          setCustomerPassword('');
          setCustomerAuthSuccess('');
        }, 1000);
      } else {
        setCustomerAuthError('Invalid system identifier email or wrong password.');
      }
    } else {
      // Sign Up Tab
      if (!customerName || !customerEmail || !customerPassword) {
        setCustomerAuthError('Name, Email, and Password must be provided.');
        return;
      }
      if (customerPassword.length < 4) {
        setCustomerAuthError('Security passwords must be at least 4 characters.');
        return;
      }
      const exists = registered.some(
        c => c.email.toLowerCase().trim() === customerEmail.toLowerCase().trim()
      );
      if (exists) {
        setCustomerAuthError('An account is already linked with this email address.');
        return;
      }

      const newCust: Customer = {
        name: customerName,
        email: customerEmail,
        password: customerPassword,
        phone: customerPhone
      };

      registered.push(newCust);
      localStorage.setItem('stylex_registered_customers', JSON.stringify(registered));
      setCustomerAuthSuccess('Your Privilege Membership has been created!');
      setCurrentCustomer(newCust);
      localStorage.setItem('stylex_current_customer', JSON.stringify(newCust));

      setTimeout(() => {
        setShowCustomerAuthModal(false);
        setCustomerName('');
        setCustomerEmail('');
        setCustomerPhone('');
        setCustomerPassword('');
        setCustomerAuthSuccess('');
      }, 1000);
    }
  };

  const handleCustomerLogout = () => {
    setCurrentCustomer(null);
    localStorage.removeItem('stylex_current_customer');
  };

  // Submit Feedback Review Form
  const handleReviewFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRevMessage('');

    if (!newReviewName || !newReviewComment || !newReviewProdId) {
      setRevMessage('Please configure commenter credentials.');
      return;
    }

    const matchedProd = products.find(p => p.id === newReviewProdId);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: newReviewProdId,
          productTitle: matchedProd?.title || 'Bespoke Item',
          customerName: newReviewName,
          rating: newReviewRating,
          comment: newReviewComment
        })
      });

      if (res.ok) {
        setNewReviewName('');
        setNewReviewComment('');
        setRevMessage('🌟 YOUR LUXURY EXPERIENCE RECORDED. AWAITING MODERATION SEALS BY HIGH OFFICE STATS.');
        loadReviews();
      }
    } catch (e) {
      setRevMessage('Sync failure. Call concierge.');
    }
  };

  // Submit Discount Request Form
  const handleRequestDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discountPhone.trim()) {
      return;
    }

    setIsSubmittingDiscount(true);
    setDiscountStatus('idle');

    try {
      const res = await fetch('/api/discount-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsappNumber: discountPhone })
      });

      if (res.ok) {
        setDiscountStatus('success');
        setDiscountPhone('');
      } else {
        setDiscountStatus('error');
      }
    } catch (err) {
      console.error("Discount submission error: ", err);
      setDiscountStatus('error');
    } finally {
      setIsSubmittingDiscount(false);
    }
  };

  // Filter and sort products based on search, category, and advanced selectors
  const filteredProducts = products
    .filter(p => {
      const matchCategory = activeCategory === 'ALL' || p.category === activeCategory;
      const matchSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchPriceMin = minPrice === '' || p.price >= minPrice;
      const matchPriceMax = maxPrice === '' || p.price <= maxPrice;
      const matchSize = selectedSize === 'ALL' || (p.sizes && p.sizes.includes(selectedSize));
      const matchStock = !showInStockOnly || p.stock > 0;

      return matchCategory && matchSearch && matchPriceMin && matchPriceMax && matchSize && matchStock;
    })
    .sort((a, b) => {
      if (sortBy === 'PRICE_ASC') return a.price - b.price;
      if (sortBy === 'PRICE_DESC') return b.price - a.price;
      if (sortBy === 'STOCK_DESC') return b.stock - a.stock;
      
      // Default Relevance (Featured first, then trending, then by title)
      const aScore = (a.featured ? 3 : 0) + (a.trending ? 1 : 0);
      const bScore = (b.featured ? 3 : 0) + (b.trending ? 1 : 0);
      if (bScore !== aScore) return bScore - aScore;
      return a.title.localeCompare(b.title);
    });

  // Render Admin View
  if (isAdminView && isAuthAdmin) {
    return (
      <AdminPanel 
        onBackToStore={() => setIsAdminView(false)}
        products={products}
        onRefreshProducts={() => {
          loadStoreCollections();
          loadReviews();
        }}
        settings={settings}
        onRefreshSettings={loadSettings}
      />
    );
  }

  // Active home banner variables
  const activePromoBanner = banners.find(b => b.active) || {
    title: "STYLE X COLLECTIVE",
    subtitle: "A meticulous exploration of minimalist form and avant-garde structure. Curated exclusively by Risat Adnan for the modern visionary.",
    imageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=1200&auto=format&fit=crop"
  };

  const getRelativeTimeString = (dateStr: string) => {
    try {
      const elapsed = Date.now() - new Date(dateStr).getTime();
      const seconds = Math.floor(elapsed / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (seconds < 15) return 'Just now';
      if (seconds < 60) return `${seconds}s ago`;
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      return `${days}d ago`;
    } catch (err) {
      return 'Recently';
    }
  };

  const maskCustomerName = (name: string) => {
    if (!name) return 'Anonymous Buyer';
    const parts = name.trim().split(' ');
    if (parts.length === 1) {
      const single = parts[0];
      if (single.length <= 2) return single + '***';
      return single.substring(0, 2) + '***' + single.charAt(single.length - 1);
    }
    const first = parts[0];
    const last = parts[parts.length - 1];
    return `${first.substring(0, 2)}*** ${last.charAt(0)}.`;
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans select-none overflow-x-hidden antialiased">
      
      {/* Top Privilege / Announcement Notification Banner */}
      {showTopBanner && (
        <div className="w-full bg-gradient-to-r from-luxury-black via-[#100122] to-luxury-black border-b border-luxury-gold/20 px-4 py-2 flex items-center justify-between text-[11px] font-mono tracking-widest relative overflow-hidden group">
          {/* Shimmer background swipe */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          
          <div className="flex items-center gap-2 mx-auto text-center min-w-0">
            <span className="w-2 h-2 rounded-full bg-luxury-gold animate-pulse shrink-0"></span>
            <span className="text-luxury-gold font-bold uppercase shrink-0">Exclusive Notice:</span>
            <span className="text-white/80 uppercase truncate">
              {activeCampaign ? activeCampaign.title : "SECURE bespoke COURIER DISPATCH & Live VIP Drops active today"}
            </span>
          </div>
          
          <button 
            type="button"
            onClick={() => setShowTopBanner(false)}
            className="text-white/45 hover:text-white transition-colors cursor-pointer outline-none bg-transparent border-none p-1 flex items-center justify-center shrink-0 z-10"
            title="Dismiss Announcement"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Main sticky luxury headers */}
      <Navbar 
        logoUrl={settings?.logoUrl}
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        onCartClick={() => { setInitialShowCheckout(false); setIsCartOpen(true); }}
        onTrackOrderClick={() => {
          setIsTrackMode(true);
          window.scrollTo({ top: 350, behavior: 'smooth' });
        }}
        onHomeClick={() => {
          setIsTrackMode(false);
          setSearchQuery('');
          setActiveCategory('ALL');
        }}
        onLotteryClick={() => setIsLotteryOpen(true)}
        searchQuery={searchQuery}
        setSearchQuery={(q) => {
          setSearchQuery(q);
          setIsTrackMode(false);
        }}
        customer={currentCustomer}
        onCustomerAuthClick={() => {
          setCustomerAuthTab('login');
          setShowCustomerAuthModal(true);
        }}
        onCustomerLogout={handleCustomerLogout}
        onViewMyOrdersClick={() => {
          setIsTrackMode(true);
          window.scrollTo({ top: 350, behavior: 'smooth' });
        }}
      />

      {/* Hero Header Banners */}
      {!isTrackMode && (
        <Hero 
          bannerTitle={activePromoBanner.title}
          bannerSubtitle={activePromoBanner.subtitle}
          bannerImage={activePromoBanner.imageUrl}
        />
      )}

      {/* Base Store Page workspace container */}
      <main className="flex-1 pb-16">
        {isTrackMode ? (
          /* Track Order Layout view */
          <div className="bg-[#050505] min-h-[50vh] border-b border-white/5 py-10">
            <OrderTracker 
              whatsappNumber={settings.whatsappNumber} 
              activeTrackId={activeTrackId}
              onTrackIdChange={setActiveTrackId}
              customer={currentCustomer}
            />
          </div>
        ) : (
          /* Standard listings collections catalog view */
          <div className="max-w-7xl mx-auto px-4 py-12 md:px-8 space-y-12">
            
            {/* Category selection bar */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-white/5 pb-4 gap-4">
              <div>
                <h3 className="font-serif text-xl font-bold uppercase tracking-widest text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-luxury-gold inline-block rounded-full"></span>
                  Exclusive Series
                </h3>
                <p className="text-[10px] text-white/40 tracking-wider font-mono uppercase mt-0.5">Explore our limited drop allocations</p>
              </div>

              {/* Responsive pills sliders */}
              <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none py-1 px-0.5">
                {[
                  { id: 'ALL', label: '⚜️ All archives' },
                  { id: 'MEN', label: '🕶️ Gentlemen' },
                  { id: 'WOMEN', label: '💃 Haute Couture' },
                  { id: 'UNISEX', label: '💎 Co-Ed Line' },
                  { id: 'ACCESSORIES', label: '👑 Ensemble' }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-4.5 py-2.5 text-[9.5px] uppercase font-sans font-black tracking-widest border rounded-xl transition-all duration-300 whitespace-nowrap cursor-pointer hover:scale-[1.03] active:scale-95 relative overflow-hidden luxury-reflection ${
                      activeCategory === cat.id
                        ? 'bg-gradient-to-r from-[#d4af37] via-[#ffd700] to-[#fcf1cc] text-[#030107] border-transparent shadow-[0_4px_18px_rgba(212,175,55,0.4)]'
                        : 'bg-[#10031f]/35 text-white/70 border-white/5 hover:border-[#d4af37]/45 hover:text-white hover:bg-[#180530]/65 shadow-inner'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced Filters Toggle & Active Indicators */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#080808]/90 border border-white/5 rounded-lg px-4 py-3 text-xs font-mono">
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded border text-[10px] uppercase tracking-widest font-semibold transition-all cursor-pointer ${
                    isFiltersExpanded || minPrice !== '' || maxPrice !== '' || selectedSize !== 'ALL' || showInStockOnly || sortBy !== 'RELEVANCE'
                      ? 'border-luxury-gold text-luxury-gold bg-luxury-gold/5 font-extrabold shadow-sm'
                      : 'border-white/10 text-white/60 hover:text-white hover:border-white/20'
                  }`}
                >
                  <SlidersHorizontal size={12} />
                  <span>{isFiltersExpanded ? 'Close Filters' : 'Filter & Sort'}</span>
                  {(minPrice !== '' || maxPrice !== '' || selectedSize !== 'ALL' || showInStockOnly || sortBy !== 'RELEVANCE') && (
                    <span className="w-2.5 h-2.5 rounded-full bg-luxury-gold animate-pulse"></span>
                  )}
                </button>

                {/* Quick info display of filtered results */}
                <span className="text-[10px] text-white/40 uppercase tracking-wider">
                  Showcase Allocation: <strong className="text-white">{filteredProducts.length}</strong> of <strong className="text-white/60">{products.length}</strong> variations
                </span>
              </div>

              {/* Quick sort selector */}
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-white/30 uppercase tracking-widest hidden sm:inline">Sort Order:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-luxury-charcoal/40 border border-white/10 text-white text-[10px] font-mono uppercase tracking-widest px-2.5 py-1.5 rounded cursor-pointer focus:outline-none focus:border-luxury-gold transition-colors"
                >
                  <option value="RELEVANCE">⚜️ Relevance</option>
                  <option value="PRICE_ASC">💵 Price: Low to High</option>
                  <option value="PRICE_DESC">💵 Price: High to Low</option>
                  <option value="STOCK_DESC">📦 Ready Stock Status</option>
                </select>
              </div>
            </div>

            {/* Expanded Premium Filters Panel */}
            {isFiltersExpanded && (
              <div className="bg-[#080808]/90 border border-white/5 rounded-xl p-5 md:p-6 grid grid-cols-1 md:grid-cols-4 gap-6 animate-fade-in relative overflow-hidden shadow-2xl">
                {/* Visual ambient divider */}
                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-luxury-gold"></div>

                {/* Price Filter */}
                <div className="space-y-2">
                  <h4 className="text-[10px] text-luxury-gold font-bold uppercase tracking-widest flex items-center gap-1.5">
                    <span>💵</span> Valuation Range (BDT)
                  </h4>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-[#0d0d0d] border border-white/10 hover:border-white/20 focus:border-luxury-gold/50 rounded px-2.5 py-1.5 text-[11px] font-mono text-white placeholder-white/20 focus:outline-none transition-colors"
                    />
                    <span className="text-white/40 font-mono text-xs">—</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-[#0d0d0d] border border-white/10 hover:border-white/20 focus:border-luxury-gold/50 rounded px-2.5 py-1.5 text-[11px] font-mono text-white placeholder-white/20 focus:outline-none transition-colors"
                    />
                  </div>
                  {/* Quick valuation filter presets */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[
                      { label: '< 1500৳', min: '', max: 1500 },
                      { label: '1500৳ - 3500৳', min: 1500, max: 3500 },
                      { label: '3500৳+', min: 3500, max: '' },
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setMinPrice(preset.min as any);
                          setMaxPrice(preset.max as any);
                        }}
                        className={`text-[8.5px] px-1.5 py-0.5 rounded border transition-all cursor-pointer ${
                          minPrice === preset.min && maxPrice === preset.max
                            ? 'border-luxury-gold text-luxury-gold bg-luxury-gold/5 font-extrabold'
                            : 'border-white/5 text-white/40 hover:text-white/70 hover:border-white/10'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Size Selection */}
                <div className="space-y-2">
                  <h4 className="text-[10px] text-luxury-gold font-bold uppercase tracking-widest flex items-center gap-1.5">
                    <span>📐</span> Size Spec
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => setSelectedSize('ALL')}
                      className={`px-2 py-1.5 text-[9px] uppercase font-mono tracking-wider border rounded transition-all cursor-pointer ${
                        selectedSize === 'ALL'
                          ? 'bg-luxury-gold text-luxury-black border-luxury-gold font-extrabold'
                          : 'bg-transparent border-white/10 hover:border-white/30 text-white/70'
                      }`}
                    >
                      ALL
                    </button>
                    {uniqueSizes.map(sz => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setSelectedSize(sz)}
                        className={`px-2 py-1.5 text-[9px] uppercase font-mono tracking-wider border rounded transition-all cursor-pointer ${
                          selectedSize === sz
                            ? 'bg-luxury-gold text-luxury-black border-luxury-gold font-extrabold'
                            : 'bg-transparent border-white/10 hover:border-white/30 text-white/70'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stock Availability */}
                <div className="space-y-2">
                  <h4 className="text-[10px] text-luxury-gold font-bold uppercase tracking-widest flex items-center gap-1.5">
                    <span>📦</span> Vault Status
                  </h4>
                  <label className="flex items-center gap-2 text-[10px] text-white/70 font-mono tracking-wider uppercase cursor-pointer hover:text-white select-none pt-2">
                    <input
                      type="checkbox"
                      checked={showInStockOnly}
                      onChange={(e) => setShowInStockOnly(e.target.checked)}
                      className="accent-luxury-gold uppercase mr-1"
                    />
                    <span>Ready units only (In Stock)</span>
                  </label>
                  <p className="text-[9px] text-white/30 leading-relaxed max-w-xs pt-1">
                    Filters out archives earmarked for custom pre-order dispatch loops.
                  </p>
                </div>

                {/* Reset Filters & Quick Stats */}
                <div className="flex flex-col justify-between md:items-end gap-3 pt-2 md:pt-0">
                  <div className="text-left md:text-right space-y-1 font-mono text-[9px] uppercase tracking-wide">
                    <p className="text-white/40">Drop Status: <span className="text-green-400">Secured Gate</span></p>
                    <p className="text-white/40">Matching: <span className="text-luxury-gold font-bold">{filteredProducts.length} variations</span></p>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setMinPrice('');
                      setMaxPrice('');
                      setSelectedSize('ALL');
                      setShowInStockOnly(false);
                      setSortBy('RELEVANCE');
                    }}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 border border-red-500/25 text-red-400 hover:text-red-300 hover:bg-red-500/5 hover:border-red-500/35 text-[10px] uppercase tracking-widest font-semibold font-mono rounded transition-all cursor-pointer w-full md:w-auto"
                  >
                    <RotateCcw size={11} />
                    <span>Clear Filters</span>
                  </button>
                </div>
              </div>
            )}

            {/* LIVE ORDER BROADCAST PULSE BLOCK */}
            <div className="bg-[#080808]/90 border border-white/5 rounded-xl p-5 md:p-6 space-y-4 shadow-[0_4px_30px_rgba(0,0,0,0.8)] backdrop-blur-md relative overflow-hidden group">
              {/* Luxury ambient light effect */}
              <div className="absolute top-0 right-0 w-44 h-44 bg-luxury-gold/5 blur-[80px] rounded-full pointer-events-none transition-all group-hover:bg-luxury-gold/10 duration-700"></div>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <div className="w-8 h-8 rounded-lg bg-luxury-gold/10 border border-luxury-gold/20 flex items-center justify-center text-luxury-gold">
                      👑
                    </div>
                  </div>
                  <div>
                    <h4 className="font-serif text-sm font-bold uppercase tracking-widest text-white flex items-center gap-2">
                      Live VIP Order Pulse
                    </h4>
                    <p className="text-[9px] text-white/45 font-mono tracking-wider uppercase mt-0.5">Real-time drops activity and secure handoff receipts</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 bg-[#0e0e0e] border border-white/10 px-3 py-1.5 rounded-full text-[10px] font-mono text-white/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></span>
                  GLOBAL SECURE HANDOVER CHANNEL
                </div>
              </div>

              {allOrders.length === 0 ? (
                <div className="py-6 text-center text-white/30 font-mono text-[10px] uppercase tracking-wider space-y-2">
                  <p>⚜️ All current dropped units intact in our central vaults</p>
                  <p className="text-[9px] text-luxury-gold/60 font-serif italic">Be the first to authorize a custom bespoke courier dispatch today!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {allOrders.slice(0, 4).map((order) => {
                    const firstItem = order.items?.[0] || { title: 'Authentic Drop Allotment', quantity: 1, selectedSize: 'Standard', price: order.totalAmount, productId: '' };
                    return (
                      <div 
                        key={order.id}
                        onClick={() => {
                          setIsTrackMode(true);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                          const newUrl = `${window.location.pathname}?track=${order.id}`;
                          window.history.pushState({}, '', newUrl);
                        }}
                        className="bg-[#0b0b0b] border border-white/5 hover:border-luxury-gold/30 rounded-lg p-3 flex flex-col justify-between hover:bg-[#0c0c0c] transition-all duration-300 cursor-pointer group/card shadow-sm hover:translate-y-[-2px]"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-mono text-white/30 tracking-widest uppercase">#{order.id}</span>
                            <span className="text-[9px] font-mono font-medium text-luxury-gold uppercase tracking-wider">{getRelativeTimeString(order.date)}</span>
                          </div>

                          <div className="flex items-center gap-2.5 py-1">
                            <div className="w-9 h-9 bg-luxury-charcoal/20 border border-white/10 rounded flex-shrink-0 flex items-center justify-center text-base overflow-hidden">
                              {firstItem.productId ? (
                                <img 
                                  src={products.find(p => p.id === firstItem.productId)?.imageUrl || "https://images.unsplash.com/photo-1590247813693-5541d1c609fd?w=100"} 
                                  alt={firstItem.title} 
                                  className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-500"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                "⚜️"
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] font-serif font-semibold text-white truncate line-clamp-1">{firstItem.title}</p>
                              <p className="text-[9px] font-mono text-white/40 uppercase mt-0.5">
                                Size: <span className="text-white/60">{firstItem.selectedSize}</span> • Qty: <span className="text-white/60">{firstItem.quantity}</span>
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-white/5 mt-3 pt-2.5 flex items-center justify-between text-[10px]">
                          <div>
                            <p className="font-sans font-medium text-white/80 tracking-tight">{maskCustomerName(order.customerName)}</p>
                            <p className="text-[8.5px] font-mono text-luxury-gold/70 uppercase tracking-widest mt-0.5 font-bold">📍 {order.customerCity}</p>
                          </div>
                          <div className="text-right">
                            <span className="inline-flex items-center gap-1 bg-green-500/10 border border-green-500/20 text-green-400 px-1.5 py-0.5 rounded text-[8.5px] font-mono tracking-widest uppercase font-bold">
                              {order.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Empty results notifications */}
            {filteredProducts.length === 0 ? (
              <div className="text-center py-20 bg-luxury-charcoal/20 border border-white/5 rounded">
                <p className="font-serif text-base text-white/50 uppercase tracking-widest">No matching archives found</p>
                <p className="text-[11px] text-white/30 max-w-sm mx-auto mt-2 italic font-mono uppercase">
                  Verify query parameters or browse ALL collections
                </p>
                <button 
                  onClick={() => { setSearchQuery(''); setActiveCategory('ALL'); }}
                  className="mt-6 border border-luxury-gold text-luxury-gold hover:bg-luxury-gold hover:text-luxury-black font-display text-[10px] uppercase tracking-widest px-6 py-2 rounded transition-all"
                >
                  Reset all filters
                </button>
              </div>
            ) : (
              /* Core Grid */
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 animate-fade-in">
                {filteredProducts.map((prod) => (
                  <ProductCard 
                    key={prod.id}
                    product={prod}
                    onAddToCart={handleAddToCart}
                    onOrderNow={handleOrderNow}
                    onProductClick={(p: Product) => { setSelectedProduct(p); }}
                    isWishlisted={wishlist.includes(prod.id)}
                    onToggleWishlist={handleToggleWishlist}
                    whatsappNumber={settings.whatsappNumber}
                  />
                ))}
              </div>
            )}

            {/* LUXURY EXPERIENCES STORIES / REVIEWS CATALOG */}
            <div className="border-t border-white/5 pt-16 grid grid-cols-1 lg:grid-cols-3 gap-10">
              
              {/* Left text Column */}
              <div className="lg:col-span-1 space-y-4">
                <div className="w-9 h-9 bg-luxury-charcoal border border-luxury-gold/30 rounded flex items-center justify-center p-1 font-serif text-sm font-extrabold text-luxury-gold">
                  SX
                </div>
                <h3 className="font-serif text-2xl font-bold uppercase tracking-wide">
                  Customer <span className="text-luxury-gold italic font-light">Experiences</span>
                </h3>
                <p className="text-xs text-white/60 leading-relaxed italic font-light">
                  Our products are curated for discerning collectors. Read genuine, approved reviews left by global visionaries, or submit your bespoke feedback below.
                </p>

                {/* Secure certificate box */}
                <div className="bg-[#0b0b0b] border border-white/5 p-4 rounded text-xs space-y-2 font-mono">
                  <div className="flex items-center gap-2 text-[10px] text-green-400 font-bold uppercase">
                    <ShieldCheck size={14} /> verified concierge ledger
                  </div>
                  <p className="text-white/40 text-[9.5px]/relaxed leading-relaxed">
                    All reviews undergo strict administrative verification loops before cataloging to guard against internet spamming.
                  </p>
                </div>
              </div>

              {/* Center List Column */}
              <div className="lg:col-span-1 space-y-4 max-h-[420px] overflow-y-auto pr-1">
                <h4 className="text-[10px] text-white/40 tracking-[0.2em] uppercase font-mono mb-4">APPROVED LEDGERS</h4>
                {publicReviews.length === 0 ? (
                  <p className="text-xs text-white/30 italic">No verifications logged yet.</p>
                ) : (
                  publicReviews.map(r => (
                    <div key={r.id} className="bg-[#0b0b0b] border border-white/5 p-4 rounded-lg space-y-2">
                      <div className="flex justify-between items-center text-[10.5px]">
                        <span className="font-serif font-bold text-white uppercase">{r.customerName}</span>
                        <span className="text-[9px] text-white/35 font-mono">{new Date(r.date).toLocaleDateString()}</span>
                      </div>
                      
                      <p className="text-[10px] text-luxury-gold font-mono uppercase tracking-wide">On: {r.productTitle}</p>
                      
                      <div className="flex text-luxury-gold gap-0.5">
                        {[...Array(r.rating)].map((_, i) => (
                          <Star key={i} size={10} fill="#D4AF37" className="text-luxury-gold" />
                        ))}
                      </div>

                      <p className="text-xs text-white/70 italic leading-relaxed">&ldquo;{r.comment}&rdquo;</p>
                    </div>
                  ))
                )}
              </div>

              {/* Right write form Column */}
              <div className="lg:col-span-1">
                <form onSubmit={handleReviewFormSubmit} className="bg-[#080808] border border-white/10 rounded-lg p-5 space-y-3.5 shadow-xl">
                  <h4 className="font-serif text-sm font-bold uppercase text-white tracking-widest border-b border-white/5 pb-2">Submit Experience review</h4>
                  
                  {/* Select product */}
                  <div>
                    <label className="block text-[9px] uppercase font-mono tracking-widest text-white/50 mb-1">Curated Piece Choice</label>
                    <select
                      required
                      value={newReviewProdId}
                      onChange={(e) => setNewReviewProdId(e.target.value)}
                      className="w-full bg-luxury-charcoal text-white text-xs border border-white/10 rounded py-2 px-3 focus:outline-none focus:border-luxury-gold"
                    >
                      <option value="">SELECT PIECE...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.title} ({p.code})</option>
                      ))}
                    </select>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-[9px] uppercase font-mono tracking-widest text-white/50 mb-1">Your Name / Title</label>
                    <input 
                      type="text" required placeholder="e.g. Adnan R."
                      value={newReviewName}
                      onChange={(e) => setNewReviewName(e.target.value)}
                      className="w-full bg-luxury-charcoal text-white text-xs border border-white/10 rounded py-2 px-3 focus:outline-none focus:border-luxury-gold placeholder-white/15"
                    />
                  </div>

                  {/* Rating */}
                  <div>
                    <label className="block text-[9px] uppercase font-mono tracking-widest text-white/50 mb-1">Strate rating weight</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setNewReviewRating(val)}
                          className={`p-1 hover:text-luxury-gold transition-colors ${
                            newReviewRating >= val ? 'text-luxury-gold' : 'text-white/20'
                          }`}
                        >
                          <Star size={18} fill={newReviewRating >= val ? '#D4AF37' : 'none'} />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Comment */}
                  <div>
                    <label className="block text-[9px] uppercase font-mono tracking-widest text-white/50 mb-1">Exquisite feedback comments</label>
                    <textarea 
                      required rows={2} placeholder="Write thoughts regarding aesthetics..."
                      value={newReviewComment}
                      onChange={(e) => setNewReviewComment(e.target.value)}
                      className="w-full bg-luxury-charcoal text-white text-xs border border-white/10 rounded py-2 px-3 focus:outline-none focus:border-luxury-gold placeholder-white/15 resize-none"
                    />
                  </div>

                  {revMessage && (
                    <div className="bg-luxury-gold/[0.04] border border-luxury-gold/20 text-luxury-gold p-2 rounded text-[10px] font-mono leading-relaxed">
                      {revMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-luxury-gold-dark to-luxury-gold text-luxury-black font-display font-extrabold text-[10px] uppercase tracking-widest py-2.5 rounded transition-all cursor-pointer"
                  >
                    Catalog feedback experience
                  </button>
                </form>
              </div>

            </div>

          </div>
        )}
      </main>

      {/* Floating Luxury Circular Menu Bar - Positioned dynamically beside StyleX Assistant on both Mobile and Desktop */}
      {!isAdminView && (
        <div className="fixed bottom-6 right-[84px] sm:right-[88px] flex items-center gap-1.5 sm:gap-2.5 z-40">
          
          {/* VIP Notification Alerts Hub */}
          <button 
            onClick={() => { 
              setIsNotificationOpen(true); 
              setUnreadNotifications(0); 
            }}
            className="w-11 h-11 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-[0_0_12px_rgba(212,175,55,0.4),0_0_20px_rgba(154,77,255,0.3),0_0_26px_rgba(59,130,246,0.25),0_0_32px_rgba(34,197,94,0.2)] hover:scale-105 active:scale-95 transition-all outline-none cursor-pointer relative group"
            title="VIP Dispatch & Product Alerts Hub"
          >
            <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180%] h-[180%] bg-[conic-gradient(from_0deg,#D4AF37,#9A4DFF,#3b82f6,#22c55e,#D4AF37)] animate-luxury-glow-spin" />
              <div className="absolute inset-[1.5px] rounded-full bg-[#0a0412]" />
            </div>
            <Bell className="relative z-10 w-4 h-4 sm:w-5 sm:h-5 stroke-[1.8] text-white group-hover:text-luxury-gold transition-colors" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3 z-20">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 text-[7.5px] text-white font-extrabold items-center justify-center leading-none">
                  {unreadNotifications}
                </span>
              </span>
            )}
            <span className="absolute -top-10 scale-0 group-hover:scale-100 transition-all font-mono text-[9px] bg-black text-luxury-gold border border-luxury-gold/30 rounded px-2 py-1 whitespace-nowrap hidden sm:block z-20">
              NOTICES
            </span>
          </button>

          {/* Claim Discount Option */}
          <button 
            onClick={() => { setIsDiscountOpen(true); setDiscountStatus('idle'); }}
            className="w-11 h-11 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-[0_0_12px_rgba(212,175,55,0.4),0_0_20px_rgba(154,77,255,0.3),0_0_26px_rgba(59,130,246,0.25),0_0_32px_rgba(34,197,94,0.2)] hover:scale-105 active:scale-95 transition-all outline-none cursor-pointer relative group"
            title="Request Campaign Discount Coupon"
          >
            <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180%] h-[180%] bg-[conic-gradient(from_0deg,#D4AF37,#9A4DFF,#3b82f6,#22c55e,#D4AF37)] animate-luxury-glow-spin" />
              <div className="absolute inset-[1.5px] rounded-full bg-[#0a0412]" />
            </div>
            <Percent className="relative z-10 w-4 h-4 sm:w-5 sm:h-5 stroke-[1.8] text-luxury-gold group-hover:text-white transition-colors" />
            <span className="absolute -top-10 scale-0 group-hover:scale-100 transition-all font-mono text-[9px] bg-black text-luxury-gold border border-luxury-gold/30 rounded px-2 py-1 whitespace-nowrap hidden sm:block z-20">
              GET DISCOUNT
            </span>
          </button>
          
          {/* Imperial Fortune Game */}
          <button 
            onClick={() => setIsLotteryOpen(true)}
            className="w-11 h-11 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-[0_0_12px_rgba(212,175,55,0.4),0_0_20px_rgba(154,77,255,0.3),0_0_26px_rgba(59,130,246,0.25),0_0_32px_rgba(34,197,94,0.2)] hover:scale-105 active:scale-95 transition-all outline-none cursor-pointer relative group"
            title="Imperial Fortune Game"
          >
            <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180%] h-[180%] bg-[conic-gradient(from_0deg,#D4AF37,#9A4DFF,#3b82f6,#22c55e,#D4AF37)] animate-luxury-glow-spin" />
              <div className="absolute inset-[1.5px] rounded-full bg-[#0a0412]" />
            </div>
            <Sparkles className="relative z-10 w-4 h-4 sm:w-5 sm:h-5 stroke-[1.8] text-luxury-gold group-hover:text-white transition-colors animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 sm:h-3 sm:w-3 z-20">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-red-500"></span>
            </span>
            <span className="absolute -top-10 scale-0 group-hover:scale-100 transition-all font-mono text-[9px] bg-black text-luxury-gold border border-luxury-gold/30 rounded px-2 py-1 whitespace-nowrap hidden sm:block z-20">
              VOUCHER WHEEL
            </span>
          </button>
          
          {/* Track Existing Receipts */}
          <button 
            onClick={() => { setIsTrackMode(true); window.scrollTo({ top: 350, behavior: 'smooth' }); }}
            className="w-11 h-11 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-[0_0_12px_rgba(212,175,55,0.4),0_0_20px_rgba(154,77,255,0.3),0_0_26px_rgba(59,130,246,0.25),0_0_32px_rgba(34,197,94,0.2)] hover:scale-105 active:scale-95 transition-all outline-none cursor-pointer relative group"
            title="Track Existing Receipts"
          >
            <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180%] h-[180%] bg-[conic-gradient(from_0deg,#D4AF37,#9A4DFF,#3b82f6,#22c55e,#D4AF37)] animate-luxury-glow-spin" />
              <div className="absolute inset-[1.5px] rounded-full bg-[#0a0412]" />
            </div>
            <ClipboardList className="relative z-10 w-4 h-4 sm:w-5 sm:h-5 stroke-[1.8] text-white group-hover:text-luxury-gold transition-colors" />
            <span className="absolute -top-10 scale-0 group-hover:scale-100 transition-all font-mono text-[9px] bg-black text-luxury-gold border border-luxury-gold/30 rounded px-2 py-1 whitespace-nowrap hidden sm:block z-20">
              TRACK RECEIPT
            </span>
          </button>
          
          {/* View Current Bag */}
          <button 
            onClick={() => { setInitialShowCheckout(false); setIsCartOpen(true); }}
            className="w-11 h-11 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-[0_0_12px_rgba(212,175,55,0.4),0_0_20px_rgba(154,77,255,0.3),0_0_26px_rgba(59,130,246,0.25),0_0_32px_rgba(34,197,94,0.2)] hover:scale-105 active:scale-95 transition-all outline-none cursor-pointer relative group"
            title="View Current Luxury Bag"
          >
            <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180%] h-[180%] bg-[conic-gradient(from_0deg,#D4AF37,#9A4DFF,#3b82f6,#22c55e,#D4AF37)] animate-luxury-glow-spin" />
              <div className="absolute inset-[1.5px] rounded-full bg-[#0a0412]" />
            </div>
            <ShoppingBag className="relative z-10 w-4 h-4 sm:w-5 sm:h-5 stroke-[1.8] text-white group-hover:text-luxury-gold transition-colors" />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-luxury-gold text-luxury-black font-mono font-black text-[8px] sm:text-[10px] w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full flex items-center justify-center border-1.5 border-black shadow z-20">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
            <span className="absolute -top-10 scale-0 group-hover:scale-100 transition-all font-mono text-[9px] bg-black text-luxury-gold border border-luxury-gold/30 rounded px-2 py-1 whitespace-nowrap hidden sm:block z-20">
              LUXURY BAG
            </span>
          </button>
        </div>
      )}

      {/* LUXURY BRAND STORIES FOOTER */}
      <footer className="bg-[#030303] border-t border-white/5 py-16 text-xs text-white/50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          
          {/* Col 1 */}
          <div className="space-y-4">
            <h5 className="font-serif text-sm font-semibold text-white tracking-widest uppercase">The Collection</h5>
            <ul className="space-y-2 font-light">
              <li><button onClick={() => { setIsTrackMode(false); setActiveCategory('MEN'); }} className="hover:text-luxury-gold">Men&apos;s Garments</button></li>
              <li><button onClick={() => { setIsTrackMode(false); setActiveCategory('WOMEN'); }} className="hover:text-luxury-gold">Women&apos;s Line</button></li>
              <li><button onClick={() => { setIsTrackMode(false); setActiveCategory('ACCESSORIES'); }} className="hover:text-luxury-gold">Accessories Series</button></li>
              <li><button onClick={() => { setIsTrackMode(false); setActiveCategory('ALL'); }} className="hover:text-luxury-gold">All exclusive archives</button></li>
            </ul>
          </div>

          {/* Col 2 */}
          <div className="space-y-4">
            <h5 className="font-serif text-sm font-semibold text-white tracking-widest uppercase">Concierge Services</h5>
            <ul className="space-y-2 font-light">
              <li><button onClick={() => { setIsTrackMode(true); window.scrollTo({ top: 350, behavior: 'smooth' }); }} className="hover:text-luxury-gold">Track existing receipt</button></li>
              <li><button onClick={() => setIsLotteryOpen(true)} className="hover:text-luxury-gold">Imperial Fortune Wheel</button></li>
              <li><a href={`https://wa.me/${settings.whatsappNumber}`} target="_blank" className="hover:text-luxury-gold">Support Live Concierge</a></li>
              <li><button onClick={() => { if(isAuthAdmin) setIsAdminView(true); else setShowLoginModal(true); }} className="hover:text-luxury-gold">Staff Secure Portal</button></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-4">
            <h5 className="font-serif text-sm font-semibold text-white tracking-widest uppercase">Bespoke Guarantees</h5>
            <p className="font-light italic leading-relaxed">
              Every drop is block-knit with certified high-fashion premium cottons and calibrated custom materials. Curated under physical seals. Handpicked priority carriage.
            </p>
          </div>

          {/* Col 4 */}
          <div className="space-y-4">
            <h5 className="font-serif text-sm font-semibold text-white tracking-widest uppercase">Style X Signature</h5>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-luxury-charcoal border border-luxury-gold/30 rounded flex items-center justify-center p-1 font-serif text-xs font-bold text-luxury-gold">
                SX
              </div>
              <p className="text-[10px] font-mono tracking-widest uppercase">STYLE X SEQUENCE</p>
            </div>
            <p className="text-[10px] font-light leading-relaxed italic">
              Empowering the modern visionary since 2026. Designed exclusively by Risat Adnan. All rights reserved.
            </p>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-8 border-t border-white/5 mt-12 pt-6 grid grid-cols-1 md:grid-cols-3 items-center text-[10px] text-white/30 font-mono gap-4">
          <p className="text-center md:text-left">© 2026 STYLE X COLLECTIVE INC.</p>
          <div className="flex justify-center">
            <button 
              id="admin-portal-link"
              onClick={() => {
                if (isAuthAdmin) {
                  setIsAdminView(true);
                } else {
                  setShowLoginModal(true);
                }
              }} 
              className="text-luxury-gold hover:text-white transition-colors duration-200 uppercase font-bold tracking-wider cursor-pointer flex items-center gap-1 justify-center"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-luxury-gold inline-block animate-pulse"></span>
              Risat Adnan
            </button>
          </div>
          <p className="text-center md:text-right">STRICTLY CASH ON DELIVERY • SECURE CONCIERGE INTEGRITY</p>
        </div>
      </footer>

      {/* ----------------- MODALS ----------------- */}

      {/* 1. SEPARATE STAFF GATE ACCESS LOGIN MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setShowLoginModal(false)} className="absolute inset-0 bg-luxury-black/95 backdrop-blur-sm"></div>
          
          <form 
            onSubmit={handleAdminAuthSubmit}
            className="relative w-full max-w-sm bg-[#080808] border border-luxury-gold/30 p-6 rounded shadow-2xl z-10 space-y-4 text-center gold-glow-border animate-fade-in"
          >
            <button 
              type="button" onClick={() => setShowLoginModal(false)}
              className="absolute right-4 top-4 text-white/50 hover:text-white"
            >
              <X size={15} />
            </button>

            <div className="flex flex-col items-center">
              <div className="w-10 h-10 bg-luxury-charcoal border border-luxury-gold/20 rounded flex items-center justify-center text-luxury-gold mb-2">
                <Lock size={16} />
              </div>
              <h4 className="font-serif text-base font-bold text-white uppercase tracking-wider">Staff Members Entrance</h4>
              <p className="text-[9.5px] text-luxury-gold font-mono uppercase tracking-widest mt-1">Conciere security verification</p>
            </div>

            <div className="space-y-3 text-left">
              <div>
                <label className="block text-[9px] uppercase font-mono tracking-widest text-white/50 mb-1">Office login Email</label>
                <input 
                  type="email" required placeholder="risatadnan4@gmail.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full bg-charcoal text-white text-xs border border-white/10 rounded py-2 px-3 focus:outline-none focus:border-luxury-gold font-mono"
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase font-mono tracking-widest text-white/50 mb-1">Security Entry Key passcode</label>
                <input 
                  type="password" required placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-charcoal text-white text-xs border border-white/10 rounded py-2 px-3 focus:outline-none focus:border-luxury-gold font-mono"
                />
              </div>
              
              <p className="text-[9px] text-white/40 italic leading-relaxed">
                Test credentials: use <strong className="text-luxury-gold font-mono">risatadnan4@gmail.com</strong> with security password <strong className="text-luxury-gold font-mono">risat123</strong> to login as owner Admin!
              </p>
            </div>

            {loginError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-2 rounded text-[10.5px] font-mono leading-relaxed">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-luxury-gold-dark to-luxury-gold text-luxury-black font-display font-bold text-[11px] uppercase tracking-widest py-2.5 rounded transition-all cursor-pointer"
            >
              Verify Credentials
            </button>
          </form>
        </div>
      )}

      {/* Customer Privilege Auth Modal (Login / Sign Up) */}
      {showCustomerAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setShowCustomerAuthModal(false)} className="absolute inset-0 bg-luxury-black/90 backdrop-blur-md"></div>
          
          <form 
            onSubmit={handleCustomerSubmit}
            className="relative w-full max-w-md bg-[#0a0514] border-2 border-[#d4af37]/35 p-6 md:p-8 rounded-2xl shadow-[0_20px_50px_rgba(212,175,55,0.15)] z-10 space-y-5 text-center luxury-glow-border animate-fade-in text-white"
          >
            <button 
              type="button" 
              onClick={() => setShowCustomerAuthModal(false)}
              className="absolute right-4 top-4 text-white/50 hover:text-white transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>

            {/* Icon Header */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-luxury-purple-glowing/20 to-luxury-gold/20 border border-luxury-gold/30 rounded-xl flex items-center justify-center text-[#d4af37] mb-2.5 shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                <Sparkles size={18} className="animate-pulse" />
              </div>
              <h4 className="font-serif text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-[#ffd700] to-white uppercase tracking-widest leading-none">
                STYLE X PRIVILEGE
              </h4>
              <p className="text-[10px] text-white/40 uppercase font-mono tracking-widest mt-1.5">
                EXCLUSIVITY ACCREDITED MEMBERSHIP ACCESS
              </p>
            </div>

            {/* Custom Mode Tabs */}
            <div className="flex border border-white/5 p-1 bg-black/40 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setCustomerAuthTab('login');
                  setCustomerAuthError('');
                  setCustomerAuthSuccess('');
                }}
                className={`flex-1 py-2 text-[11px] uppercase font-bold tracking-widest rounded-lg transition-all cursor-pointer ${
                  customerAuthTab === 'login'
                    ? 'bg-gradient-to-r from-[#d4af37] to-[#ffd700] text-black shadow-md font-black'
                    : 'text-white/50 hover:text-white hover:bg-white/[0.02]'
                }`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => {
                  setCustomerAuthTab('signup');
                  setCustomerAuthError('');
                  setCustomerAuthSuccess('');
                }}
                className={`flex-1 py-2 text-[11px] uppercase font-bold tracking-widest rounded-lg transition-all cursor-pointer ${
                  customerAuthTab === 'signup'
                    ? 'bg-gradient-to-r from-[#d4af37] to-[#ffd700] text-black shadow-md font-black'
                    : 'text-white/50 hover:text-white hover:bg-white/[0.02]'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Input fields */}
            <div className="space-y-3.5 text-left font-display">
              {customerAuthTab === 'signup' && (
                <div>
                  <label className="block text-[8.5px] uppercase font-black tracking-widest text-[#d4af37] mb-1.5 pl-0.5">Full Legal Name</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Adnan Risat"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-black/40 text-white text-xs border border-white/10 rounded-xl py-2.5 px-3.5 focus:outline-none focus:border-luxury-gold transition-colors font-sans hover:border-white/20"
                  />
                </div>
              )}

              <div>
                <label className="block text-[8.5px] uppercase font-black tracking-widest text-[#d4af37] mb-1.5 pl-0.5">Membership Email Reference</label>
                <input 
                  type="email" 
                  required 
                  placeholder="name@exclusive.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full bg-black/40 text-white text-xs border border-white/10 rounded-xl py-2.5 px-3.5 focus:outline-none focus:border-luxury-gold transition-colors font-mono hover:border-white/20"
                />
              </div>

              {customerAuthTab === 'signup' && (
                <div>
                  <label className="block text-[8.5px] uppercase font-black tracking-widest text-[#d4af37] mb-1.5 pl-0.5">WhatsApp Handheld Phone (Optional)</label>
                  <input 
                    type="tel" 
                    placeholder="e.g. 017xxxxxxxx or 88017xxxxxxxx"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-black/40 text-white text-xs border border-white/10 rounded-xl py-2.5 px-3.5 focus:outline-none focus:border-luxury-gold transition-colors font-mono hover:border-white/20"
                  />
                </div>
              )}

              <div>
                <label className="block text-[8.5px] uppercase font-black tracking-widest text-[#d4af37] mb-1.5 pl-0.5">Security Gate Password</label>
                <input 
                  type="password" 
                  required 
                  placeholder="••••••••"
                  value={customerPassword}
                  onChange={(e) => setCustomerPassword(e.target.value)}
                  className="w-full bg-black/40 text-white text-xs border border-white/10 rounded-xl py-2.5 px-3.5 focus:outline-none focus:border-luxury-gold transition-colors font-mono hover:border-white/20"
                />
              </div>

              {/* Seamless test help info */}
              {customerAuthTab === 'login' && (
                <div className="bg-gradient-to-r from-luxury-purple-glowing/10 to-transparent border-l-2 border-[#d4af37] p-3 rounded-r-xl">
                  <p className="text-[10px]/relaxed text-white/60 font-sans tracking-wide leading-relaxed">
                    💡 <strong className="text-luxury-gold font-bold">VIP DEMO SEED:</strong> Sign in with email <strong className="text-luxury-gold font-mono font-bold">risat@stylex.com</strong> and password <strong className="text-luxury-gold font-mono font-bold">user123</strong> to load instant luxury dashboard with live order tracking history!
                  </p>
                </div>
              )}
            </div>

            {/* Error or Success Toast alerts */}
            {customerAuthError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-[10.5px] font-mono leading-relaxed text-left animate-shake">
                ⚠️ {customerAuthError}
              </div>
            )}

            {customerAuthSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-[10.5px] font-mono leading-relaxed text-left">
                ✨ {customerAuthSuccess}
              </div>
            )}

            {/* Submit Action Block */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-luxury-gold to-[#ffd700] hover:from-[#ffd700] hover:to-amber-300 text-black font-display font-black text-xs uppercase tracking-widest py-3.5 rounded-xl hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:scale-[1.01] active:scale-95 transition-all duration-300 relative overflow-hidden luxury-reflection cursor-pointer"
            >
              {customerAuthTab === 'login' ? 'CLAIM PRIVILEGE SESSION' : 'ESTABLISH VIP MEMBERSHIP'}
            </button>
          </form>
        </div>
      )}

      {/* 2. SUCCESSFUL CHECKOUT / REDIRECT TO WHATSAPP CONVERSION WINDOWS */}
      {confirmedOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-luxury-black/95 backdrop-blur-sm"></div>

          <div className="relative w-full max-w-md bg-[#080808] border-2 border-luxury-gold rounded-lg p-6 text-center shadow-2xl z-10 space-y-4 gold-glow-border animate-fade-in">
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 bg-luxury-gold/10 border border-luxury-gold rounded-full flex items-center justify-center text-luxury-gold mb-3 animate-pulse">
                <CheckCircle size={26} className="stroke-[2.5]" />
              </div>
              <h3 className="font-serif text-xl font-bold text-white uppercase tracking-wider">Aesthetic Collection Sealer</h3>
              <p className="text-[10px] text-luxury-gold font-mono uppercase tracking-[0.2em] mt-1">
                Your luxury order is prepared
              </p>
            </div>

            <p className="text-xs text-white/70 leading-relaxed font-light italic">
              Your customized order has been secured inside the database successfully! A track receipt code has been generated. To complete validation, click below to connect with our WhatsApp support assistant.
            </p>

            {/* Generated Details Container */}
            <div className="bg-[#101010] border border-white/5 p-4 rounded text-xs space-y-2 text-left font-mono">
              <p><span className="text-white/40">TRACK RECEIPT:</span> <strong className="text-luxury-gold">{confirmedOrderId}</strong></p>
              <p><span className="text-white/40">METHOD PAYMENT:</span> <strong className="text-white">CASH ON DELIVERY (COD)</strong></p>
              <p className="text-white/40 text-[9px]/relaxed leading-relaxed mt-2 pt-2 border-t border-white/5">
                Scan QR or track from front-end Track Order menus to view real-time dispatched logs.
              </p>
            </div>

            {/* Confirm WhatsApp redirect trigger */}
            <div className="space-y-3pt-2">
              <a
                href={confirmedWhatsAppUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() => {
                  setConfirmedOrderId('');
                  setCart([]);
                }}
                className="block text-center w-full bg-gradient-to-r from-luxury-gold-dark to-luxury-gold text-luxury-black font-display font-extrabold text-[11px] uppercase tracking-[0.2em] py-3.5 rounded shadow-xl transition-all"
              >
                Launch WhatsApp verification
              </a>
              <button
                type="button"
                onClick={() => {
                  setConfirmedOrderId('');
                  setCart([]);
                }}
                className="text-[10px] uppercase font-mono tracking-widest text-white/40 hover:text-white"
              >
                Close receipt window
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 3. DYNAMIC DRAWER AND SIDEBAR MODAL WRAPPERS */}
      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onUpdateQty={handleUpdateCartQty}
        onRemoveItem={handleRemoveCartItem}
        activeCoupons={coupons}
        settings={settings}
        onCheckoutSuccess={(id, url) => {
          setIsCartOpen(false);
          setConfirmedOrderId(id);
          setConfirmedWhatsAppUrl(url);
          loadStoreCollections(); // Refresh stock units logs on checkout success!
          loadOrders(); // Refresh public order ticker instantly!
        }}
        initialShowCheckout={initialShowCheckout}
        customer={currentCustomer}
      />

      {/* 4. LUXURY VIP NOTIFICATION ALERTS OVERLAY */}
      {isNotificationOpen && (
        <div className="fixed inset-0 bg-luxury-black/95 backdrop-blur-xl z-50 flex items-center justify-end">
          {/* Backdrop clicking dismisses drawer */}
          <div className="absolute inset-0 cursor-pointer" onClick={() => setIsNotificationOpen(false)} />
          
          {/* Notification Sidebar Slide-over Panel */}
          <div className="relative w-full max-w-md h-full bg-[#070311] border-l-2 border-luxury-gold/25 shadow-[0_0_50px_rgba(154,77,255,0.2)] p-6 sm:p-8 flex flex-col justify-between overflow-hidden animate-slide-in select-none">
            
            {/* Ambient luxury lights */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-luxury-purple/15 rounded-full blur-[70px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-luxury-gold/5 rounded-full blur-[70px] pointer-events-none"></div>

            <div className="relative z-10 space-y-6">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-luxury-gold/10 border border-luxury-gold/30 flex items-center justify-center">
                    <Bell size={16} className="text-luxury-gold animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white via-luxury-gold to-white">
                      VIP DISPATCH HUB
                    </h3>
                    <p className="text-[9px] text-white/40 tracking-wider font-mono uppercase">
                      Live Allocations & Security Notice
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => setIsNotificationOpen(false)}
                  className="text-white/40 hover:text-luxury-gold transition-all cursor-pointer w-8 h-8 flex items-center justify-center rounded-full bg-white/5 border border-white/10"
                  title="Close notices"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Notification Ticks */}
              <div className="space-y-4 pt-2 overflow-y-auto max-h-[70vh] scrollbar-none pr-1">
                
                {/* Notice 1 */}
                <div className="bg-[#0b051a] border border-luxury-gold/20 rounded-xl p-4 space-y-2 relative overflow-hidden group">
                  <div className="absolute right-3 top-3 w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                  <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-wider text-luxury-gold">
                    <span>⚜️ Live Drop Notification</span>
                    <span>•</span>
                    <span className="text-white/40">Active Now</span>
                  </div>
                  <h4 className="font-serif text-xs font-bold text-white capitalize leading-relaxed">
                    Exclusive Purple Gold premium capsule allocation is live!
                  </h4>
                  <p className="text-[10px] text-white/70 leading-relaxed font-sans font-light">
                    VIP members can process pre-order allocations securely. Apply campaign discounts for up to 15% luxury concession.
                  </p>
                </div>

                {/* Notice 2 */}
                <div className="bg-[#0b051a]/60 border border-white/5 rounded-xl p-4 space-y-2 relative overflow-hidden">
                  <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-wider text-green-400">
                    <span>📦 Courier Dispatch status</span>
                    <span>•</span>
                    <span className="text-white/40">1h ago</span>
                  </div>
                  <h4 className="font-serif text-xs font-bold text-white capitalize leading-relaxed">
                    Fast-Track Courier Dispatch loops optimized on Dhaka Lines
                  </h4>
                  <p className="text-[10px] text-white/60 leading-relaxed font-sans font-light">
                    Bespoke courier delivery loops have been allocated. Delivery schedules are operating under 24-hour fast-track timelines for Dhaka metropolitan hubs.
                  </p>
                </div>

                {/* Notice 3 */}
                <div className="bg-[#0b051a]/60 border border-white/5 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-wider text-blue-400">
                    <span>🎟️ Imperial Draw Alert</span>
                    <span>•</span>
                    <span className="text-white/40">Today</span>
                  </div>
                  <h4 className="font-serif text-xs font-bold text-white capitalize leading-relaxed">
                    complimentary fortune ticket active
                  </h4>
                  <p className="text-[10px] text-white/60 leading-relaxed font-sans font-light">
                    Every buyer is automatically entitled to a free spin daily in the Imperial Draw. Register your phone number to reveal complimentary voucher concessions.
                  </p>
                </div>

                {/* Campaign notice */}
                {activeCampaign && (
                  <div className="bg-[#100122]/90 border border-luxury-purple/50 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-wider text-luxury-purple-glowing">
                      <span>📢 Brand Campaign Notice</span>
                      <span>•</span>
                      <span className="text-white/40">Active</span>
                    </div>
                    <h4 className="font-serif text-xs font-bold text-white capitalize leading-relaxed">
                      {activeCampaign.title}
                    </h4>
                    <p className="text-[10px] text-white/60 leading-relaxed font-sans font-light">
                      Current public drop is sponsored by our primary partner network. Experience hand-picked fabrics.
                    </p>
                  </div>
                )}

              </div>
            </div>

            {/* Bottom utility */}
            <div className="relative z-10 border-t border-white/10 pt-4 space-y-3 font-mono">
              <div className="flex items-center justify-between text-[9px] uppercase text-white/40">
                <span>GATE STATUS</span>
                <span className="text-green-400 font-extrabold">SECURED DISPATCH</span>
              </div>
              <button
                onClick={() => setIsNotificationOpen(false)}
                className="w-full bg-gradient-to-r from-luxury-purple to-[#8318f8] hover:from-luxury-purple/90 text-white font-display font-extrabold text-[10px] uppercase tracking-[0.25em] py-3 rounded-lg text-center shadow-lg transition-all cursor-pointer"
              >
                Acknowledge Notices
              </button>
            </div>

          </div>
        </div>
      )}

      {selectedProduct && (
        <ProductDetailModal 
          product={selectedProduct}
          isOpen={selectedProduct !== null}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
          onOrderNow={handleOrderNow}
          isWishlisted={wishlist.includes(selectedProduct.id)}
          onToggleWishlist={handleToggleWishlist}
          whatsappNumber={settings.whatsappNumber}
        />
      )}

      <LotteryModal 
        isOpen={isLotteryOpen}
        onClose={() => setIsLotteryOpen(false)}
        prizes={settings?.lotteryPrizes}
        discountPercentage={settings?.lotteryDiscountPercentage}
      />

      {isDiscountOpen && (
        <div className="fixed inset-0 bg-[#05010ca6] backdrop-blur-xl z-50 flex items-center justify-center p-4">
          {/* Main Ultra Luxury Border Container */}
          <div className="relative w-full max-w-md rounded-2xl p-[1.5px] overflow-hidden shadow-[0_0_50px_rgba(154,77,255,0.25)] group">
            
            {/* Multi-color running glow boundary around the entire form card */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] bg-[conic-gradient(from_0deg,#D4AF37,#9A4DFF,#3b82f6,#22c55e,#D4AF37)] animate-luxury-glow-spin pointer-events-none" />
            
            {/* The Solid Form Backdrop Card */}
            <div className="relative bg-[#070211] rounded-2xl p-6 sm:p-8 overflow-hidden text-white font-sans w-full">
              
              {/* Dynamic light pools */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-luxury-purple/10 rounded-full blur-[60px] pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-emerald-500/5 rounded-full blur-[60px] pointer-events-none"></div>
              
              {/* Close Icon with spin hover effect */}
              <button 
                onClick={() => { setIsDiscountOpen(false); setDiscountStatus('idle'); }}
                className="absolute top-4 right-4 text-white/40 hover:text-luxury-gold hover:rotate-90 transition-all duration-300 outline-none cursor-pointer z-20 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 border border-white/10"
                title="Dismiss Form"
              >
                <X size={15} />
              </button>

              <div className="relative z-10 text-center">
                {/* Visual Emblem Badge */}
                <div className="flex items-center justify-center mb-5">
                  <div className="relative w-16 h-16 rounded-full flex items-center justify-center">
                    {/* Pulsing visual ring glow behind logo icon */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#D4AF37] via-[#9A4DFF] to-[#3b82f6] opacity-35 blur-md animate-pulse"></div>
                    <div className="absolute inset-x-0 inset-y-0 rounded-full overflow-hidden pointer-events-none">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180%] h-[180%] bg-[conic-gradient(from_0deg,#D4AF37,#9A4DFF,#3b82f6,#22c55e,#D4AF37)] animate-luxury-glow-spin" />
                      <div className="absolute inset-[1.5px] rounded-full bg-[#0d051c]" />
                    </div>
                    <Percent size={22} className="relative z-10 text-luxury-gold animate-bounce" />
                  </div>
                </div>

                <h2 className="font-display text-2xl tracking-widest text-[#FFF] uppercase font-black">
                  CONCESSION <span className="bg-gradient-to-r from-luxury-gold to-[#f0d88d] bg-clip-text text-transparent">CONCIERGE</span>
                </h2>
                
                <p className="font-mono text-[9px] text-white/50 uppercase tracking-widest mb-6 border-b border-white/10 pb-4">
                  Register WhatsApp Securely for Bespoke Luxury Coupon
                </p>

                {discountStatus === 'success' ? (
                  <div className="py-4 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 mb-4 animate-bounce">
                      <CheckCircle size={24} />
                    </div>
                    <h3 className="text-emerald-400 font-bold font-display uppercase tracking-widest text-sm mb-2">
                      Voucher Link Registered
                    </h3>
                    <p className="text-xs text-white/75 leading-relaxed mb-6 font-mono">
                      Your WhatsApp verification was received successfully! The administrator has been notified to send your exclusive code directly.
                    </p>
                    <button
                      onClick={() => {
                        setIsDiscountOpen(false);
                        setDiscountStatus('idle');
                      }}
                      className="w-full py-3 rounded-lg bg-gradient-to-r from-[#100325] via-[#2d0f54] to-[#100325] hover:from-[#1b073c] hover:to-[#1b073c] text-[10px] font-mono uppercase tracking-widest text-luxury-gold border border-luxury-gold/30 shadow-[0_4px_15px_rgba(0,0,0,0.5)] hover:border-luxury-gold hover:shadow-[0_0_20px_rgba(212,175,55,0.2)] transition-all duration-300 cursor-pointer"
                    >
                      Return to Showroom
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleRequestDiscount} className="space-y-5 text-left">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-[9px] uppercase font-mono tracking-widest text-white/70 font-semibold">
                          WhatsApp Number
                        </label>
                        <span className="text-[8px] font-mono text-luxury-gold tracking-wider uppercase bg-luxury-gold/10 px-2 py-0.5 rounded border border-luxury-gold/20">
                          Secure Enrolment
                        </span>
                      </div>
                      
                      <div className="relative rounded-lg p-[1px] bg-white/10 focus-within:bg-[linear-gradient(to_right,#D4AF37,#9A4DFF,#3b82f6,#22c55e)] transition-all duration-500 shadow-inner">
                        <input
                          type="tel"
                          required
                          placeholder="e.g., +880 17XX-XXXXXX"
                          value={discountPhone}
                          onChange={(e) => setDiscountPhone(e.target.value)}
                          className="w-full bg-[#0d041a] rounded-lg px-4 py-3.5 text-xs text-white placeholder-white/20 focus:outline-none transition-all font-mono"
                        />
                      </div>
                      <p className="text-[8px] text-white/40 font-mono mt-1.5 leading-relaxed uppercase">
                        * Used exclusively by live concierge validation assistants. Zero SPAM risk.
                      </p>
                    </div>

                    {discountStatus === 'error' && (
                      <div className="text-center p-2.5 bg-red-950/40 border border-red-500/30 text-red-400 font-mono text-[10px] uppercase tracking-wider rounded">
                        ⚠️ Network transmission failure. Please try again.
                      </div>
                    )}

                    {/* Interactive glowing ultra button */}
                    <div className="relative rounded-lg p-[1px] group/btn transition-transform">
                      <button
                        type="submit"
                        disabled={isSubmittingDiscount}
                        className="relative w-full py-3.5 rounded-lg bg-gradient-to-r from-luxury-black via-[#0d041c] to-luxury-black text-xs font-mono uppercase tracking-widest text-luxury-gold font-bold hover:text-white border border-luxury-gold/30 hover:border-luxury-gold overflow-hidden transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.7)] flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {/* Shimmer background bar layer on hover */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#9A4DFF]/15 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-1000"></div>
                        
                        {isSubmittingDiscount ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-luxury-gold/30 border-t-luxury-gold rounded-full animate-spin"></span>
                            Securing Credentials...
                          </>
                        ) : (
                          <>
                            <span>Apply Code Request</span>
                            <Percent size={13} className="animate-pulse" />
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex items-center justify-center gap-4 pt-1 opacity-60">
                      <div className="h-px bg-white/10 w-8"></div>
                      <p className="font-mono text-[8px] text-white/50 uppercase tracking-widest">
                        Handcrafted Protection
                      </p>
                      <div className="h-px bg-white/10 w-8"></div>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REAL-TIME VIP CONCIERGE ORDER BROADCAST NOTIFICATION TOAST */}
      {viewToast && lastOrderToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-[#080808]/95 border border-luxury-gold/30 rounded-lg p-4 shadow-[0_12px_45px_rgba(0,0,0,0.95)] animate-fade-in flex items-start gap-3.5 backdrop-blur-md">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping absolute top-4 right-4"></div>
          
          <div className="w-10 h-10 rounded-lg bg-luxury-gold/10 border border-luxury-gold/30 flex items-center justify-center text-lg shrink-0 text-luxury-gold">
            🛍️
          </div>

          <div className="space-y-1 text-left min-w-0 flex-1">
            <p className="text-[9px] font-mono uppercase tracking-widest text-luxury-gold font-bold">VIP Drops Notification</p>
            <h5 className="font-serif text-sm font-bold text-white leading-tight">
              Order Placed!
            </h5>
            <p className="text-[11px] text-white/80 leading-snug">
              <strong>{maskCustomerName(lastOrderToast.customerName)}</strong> in <span className="text-luxury-gold font-bold">{lastOrderToast.customerCity}</span> just secured {lastOrderToast.items?.[0]?.title || 'bespoke allotment'}!
            </p>
            <div className="flex items-center justify-between mt-3 border-t border-white/5 pt-2">
              <span className="text-[9px] font-mono text-white/40 uppercase tracking-wider">SECURE CODE: #{lastOrderToast.id}</span>
              <button 
                onClick={() => {
                  setIsTrackMode(true);
                  const newUrl = `${window.location.pathname}?track=${lastOrderToast.id}`;
                  window.history.pushState({}, '', newUrl);
                  setViewToast(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-luxury-gold hover:text-white transition-colors text-[9px] font-mono font-bold uppercase tracking-widest cursor-pointer underline bg-transparent border-none outline-none"
              >
                Track dispatch →
              </button>
            </div>
          </div>

          <button 
            type="button"
            onClick={() => setViewToast(false)}
            className="text-white/40 hover:text-white cursor-pointer bg-transparent border-none outline-none shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <LiveChat />

    </div>
  );
}

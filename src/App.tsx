import React, { useState, useEffect } from 'react';
import { 
  Trophy, ShieldCheck, Mail, Send, CheckCircle, Smartphone, 
  MapPin, Clock, Star, Landmark, HelpCircle, Lock, EyeOff,
  Sparkles, ClipboardList, ShoppingBag, X
} from 'lucide-react';
import { Product, CartItem, Banner, Coupon, Campaign, Review } from './types';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ProductCard from './components/ProductCard';
import ProductDetailModal from './components/ProductDetailModal';
import CartDrawer from './components/CartDrawer';
import OrderTracker from './components/OrderTracker';
import LiveChat from './components/LiveChat';
import LotteryModal from './components/LotteryModal';
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

  // Customer Shopping states
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isLotteryOpen, setIsLotteryOpen] = useState(false);

  // Successful checkout modal information
  const [confirmedOrderId, setConfirmedOrderId] = useState('');
  const [confirmedWhatsAppUrl, setConfirmedWhatsAppUrl] = useState('');

  // Initial Boot Data Loading
  useEffect(() => {
    loadStoreCollections();
    loadBanners();
    loadCoupons();
    loadCampaigns();
    loadReviews();

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

  // Filter products based on search queries and category buttons
  const filteredProducts = products.filter(p => {
    const matchCategory = activeCategory === 'ALL' || p.category === activeCategory;
    const matchSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
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
      />
    );
  }

  // Active home banner variables
  const activePromoBanner = banners.find(b => b.active) || {
    title: "STYLE X COLLECTIVE",
    subtitle: "A meticulous exploration of minimalist form and avant-garde structure. Curated exclusively by Risat Adnan for the modern visionary.",
    imageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=1200&auto=format&fit=crop"
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans select-none overflow-x-hidden antialiased">
      
      {/* Top Promotional bar campaigns */}
      {activeCampaign && (
        <div className="bg-gradient-to-r from-luxury-gold-dark via-luxury-gold to-luxury-gold-dark text-luxury-black font-display text-[9.5px] uppercase tracking-[0.25em] py-2 px-4 shadow text-center flex items-center justify-center gap-1.5 font-bold">
          <span>👑 ACTIVE EVENT: {activeCampaign.title} - {activeCampaign.description}</span>
          {activeCampaign.discountCode && (
            <span className="bg-luxury-black text-luxury-gold rounded px-2.5 py-0.5 ml-2 font-mono hover:scale-105 transition-transform">
              CODE: {activeCampaign.discountCode}
            </span>
          )}
        </div>
      )}

      {/* Main sticky luxury headers */}
      <Navbar 
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        onCartClick={() => setIsCartOpen(true)}
        onAdminClick={() => {
          if (isAuthAdmin) {
            setIsAdminView(true);
          } else {
            setShowLoginModal(true);
          }
        }}
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
        isAdmin={isAuthAdmin}
        onLogout={handleLogout}
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
            <OrderTracker />
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
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {['ALL', 'MEN', 'WOMEN', 'UNISEX', 'ACCESSORIES'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-2 text-[10px] uppercase font-display font-semibold tracking-widest border rounded transition-all whitespace-nowrap cursor-pointer ${
                      activeCategory === cat
                        ? 'bg-luxury-gold text-luxury-black border-luxury-gold font-extrabold shadow-md'
                        : 'bg-luxury-charcoal/30 border-white/5 hover:border-white/20 text-white/70'
                    }`}
                  >
                    ⚜️ {cat}
                  </button>
                ))}
              </div>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in">
                {filteredProducts.map((prod) => (
                  <ProductCard 
                    key={prod.id}
                    product={prod}
                    onAddToCart={handleAddToCart}
                    onOrderNow={handleOrderNow}
                    onProductClick={(p: Product) => { setSelectedProduct(p); }}
                    isWishlisted={wishlist.includes(prod.id)}
                    onToggleWishlist={handleToggleWishlist}
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

      {/* Floating Pill Menu bar at physical bottom of visual workspace */}
      {!isAdminView && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-luxury-charcoal/80 backdrop-blur-md border border-luxury-gold/25 rounded-full px-5 py-2.5 hidden md:flex items-center gap-6 shadow-2xl z-30">
          
          <button 
            onClick={() => { setIsTrackMode(false); window.scrollTo({ top: 350, behavior: 'smooth' }); }}
            className="text-white hover:text-luxury-gold hover:scale-105 active:scale-95 transition-all outline-none"
            title="Explore listings"
          >
            <Trophy size={16} />
          </button>
          
          <button 
            onClick={() => setIsLotteryOpen(true)}
            className="text-luxury-gold hover:text-white hover:scale-105 active:scale-95 transition-all outline-none relative"
            title="Imperial Fortune Game"
          >
            <Sparkles size={16} />
            <span className="absolute -top-1 -right-1 bg-red-500 w-1.5 h-1.5 rounded-full animate-ping"></span>
          </button>

          <button 
            onClick={() => { setIsTrackMode(true); window.scrollTo({ top: 350, behavior: 'smooth' }); }}
            className="text-white hover:text-luxury-gold hover:scale-105 active:scale-95 transition-all outline-none"
            title="Track existing receipts"
          >
            <ClipboardList size={16} />
          </button>

          <button 
            onClick={() => setIsCartOpen(true)}
            className="text-white hover:text-luxury-gold hover:scale-105 active:scale-95 transition-all outline-none relative"
            title="View current bag"
          >
            <ShoppingBag size={16} />
            {cart.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-luxury-gold text-luxury-black font-extrabold text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
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
              <li><a href="https://wa.me/8801755104443" target="_blank" className="hover:text-luxury-gold">Support Live Concierge</a></li>
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

        <div className="max-w-7xl mx-auto px-4 md:px-8 border-t border-white/5 mt-12 pt-6 flex flex-col md:flex-row items-center justify-between text-[10px] text-white/30 font-mono gap-4">
          <p>© 2026 STYLE X COLLECTIVE INC.</p>
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6 text-center sm:text-left">
            <p>STRICTLY CASH ON DELIVERY • SECURE CONCIERGE INTEGRITY</p>
            <span className="hidden sm:inline text-white/10">•</span>
            <button 
              id="admin-portal-link"
              onClick={() => {
                if (isAuthAdmin) {
                  setIsAdminView(true);
                } else {
                  setShowLoginModal(true);
                }
              }} 
              className="text-luxury-gold hover:text-white transition-colors duration-200 uppercase font-bold tracking-wider cursor-pointer flex items-center gap-1"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-luxury-gold inline-block animate-pulse"></span>
              Admin Panel Link (/?admin=true)
            </button>
          </div>
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
        onCheckoutSuccess={(id, url) => {
          setIsCartOpen(false);
          setConfirmedOrderId(id);
          setConfirmedWhatsAppUrl(url);
          loadStoreCollections(); // Refresh stock units logs on checkout success!
        }}
      />

      {selectedProduct && (
        <ProductDetailModal 
          product={selectedProduct}
          isOpen={selectedProduct !== null}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
          onOrderNow={handleOrderNow}
          isWishlisted={wishlist.includes(selectedProduct.id)}
          onToggleWishlist={handleToggleWishlist}
        />
      )}

      <LotteryModal 
        isOpen={isLotteryOpen}
        onClose={() => setIsLotteryOpen(false)}
      />

      <LiveChat />

    </div>
  );
}

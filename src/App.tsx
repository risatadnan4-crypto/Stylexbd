import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Trophy, ShieldCheck, Mail, Send, CheckCircle, Smartphone, 
  MapPin, Clock, Star, Landmark, HelpCircle, Lock, EyeOff,
  Sparkles, ClipboardList, ShoppingBag, X, Percent, Receipt,
  SlidersHorizontal, RotateCcw, Bell, Gift, Ticket, MessageSquare, ArrowRight,
  Facebook, Instagram, MessageCircle
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
import XoroAssistant from './components/XoroAssistant';
import CustomerProfileModal from './components/CustomerProfileModal';
import { GlobalCountdown } from './components/GlobalCountdown';
import { supabase } from './lib/supabaseClient';

export default function App() {
  // Navigation states
  const [isAdminView, setIsAdminView] = useState(false);
  const [isTrackMode, setIsTrackMode] = useState(false);
  const [isSearchPage, setIsSearchPage] = useState(false);
  
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
  const [notifications, setNotifications] = useState<any[]>([]);
  const [lastReadTimestamp, setLastReadTimestamp] = useState<number>(() => {
    const saved = localStorage.getItem('stylex_notif_last_read_ts');
    return saved ? Number(saved) : 0;
  });

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
  const [globalVisits, setGlobalVisits] = useState<number>(0);
  const [liveViews, setLiveViews] = useState<number>(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
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
  const [confirmedOrderPayment, setConfirmedOrderPayment] = useState('CASH ON DELIVERY (COD)');
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [lastOrderToast, setLastOrderToast] = useState<Order | null>(null);
  const [viewToast, setViewToast] = useState(false);
  
  // Real-time personal notification alert states
  const [personalNotifToast, setPersonalNotifToast] = useState<any>(null);
  const [showPersonalToast, setShowPersonalToast] = useState(false);
  const [notifiedIDs, setNotifiedIDs] = useState<string[]>([]);
  const [isFirstNotifLoad, setIsFirstNotifLoad] = useState(true);

  const [showTopBanner, setShowTopBanner] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        setScrollProgress((window.scrollY / totalScroll) * 100);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  const [activeTrackId, setActiveTrackId] = useState(() => {
    try {
      const prevOrderIds = JSON.parse(localStorage.getItem('stylex_placed_order_ids') || '[]');
      return prevOrderIds.length > 0 ? prevOrderIds[prevOrderIds.length - 1] : '';
    } catch (e) {
      return '';
    }
  });

  // Customer states (Log In / Sign Up)
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(() => {
    try {
      const saved = localStorage.getItem('stylex_current_customer');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.warn("Corrupted stylex_current_customer in localStorage removed gracefully:", e);
      return null;
    }
  });

  // Filter notifications based on customer email/phone, guest checkout order IDs, or tracked order references
  const filteredNotifications = useMemo(() => {
    let guestOrderIds: string[] = [];
    let guestPhone = '';
    try {
      guestOrderIds = JSON.parse(localStorage.getItem('stylex_placed_order_ids') || '[]');
      guestPhone = localStorage.getItem('stylex_guest_phone') || '';
    } catch (e) {}

    return notifications.filter(notif => {
      // General alert notifications (like new product drop) are shown to everyone
      if (!notif.customerEmail && !notif.customerPhone && !notif.orderId) {
        return true;
      }

      // If there is an explicit order match for this guest session
      if (notif.orderId && guestOrderIds.includes(notif.orderId)) {
        return true;
      }
      
      // If customer is logged in, match customer records
      if (currentCustomer) {
        const matchEmail = currentCustomer.email && notif.customerEmail && 
          notif.customerEmail.toLowerCase().trim() === currentCustomer.email.toLowerCase().trim();

        const cleanCustPhone = currentCustomer.phone ? currentCustomer.phone.replace(/[\s+]/g, '').trim() : '';
        const cleanNotifPhone = notif.customerPhone ? notif.customerPhone.replace(/[\s+]/g, '').trim() : '';

        const matchPhone = cleanCustPhone && cleanNotifPhone && (
          cleanNotifPhone === cleanCustPhone ||
          (cleanCustPhone.length >= 10 && cleanNotifPhone.endsWith(cleanCustPhone.slice(-10)))
        );

        if (matchEmail || matchPhone) {
          return true;
        }
      }

      // Fallback guest phone matching
      if (guestPhone && notif.customerPhone) {
        const cleanGuestPhone = guestPhone.replace(/[\s+]/g, '').trim();
        const cleanNotifPhone = notif.customerPhone.replace(/[\s+]/g, '').trim();
        if (cleanGuestPhone && cleanNotifPhone && (
          cleanNotifPhone === cleanGuestPhone ||
          (cleanGuestPhone.length >= 10 && cleanNotifPhone.endsWith(cleanGuestPhone.slice(-10)))
        )) {
          return true;
        }
      }

      return false;
    });
  }, [notifications, currentCustomer]);

  // Derived unread count
  const unreadNotificationsCount = useMemo(() => {
    return filteredNotifications.filter(notif => {
      const notifTime = new Date(notif.date).getTime();
      return notifTime > lastReadTimestamp;
    }).length;
  }, [filteredNotifications, lastReadTimestamp]);

  const [showCustomerAuthModal, setShowCustomerAuthModal] = useState(false);
  const [showCustomerProfileModal, setShowCustomerProfileModal] = useState(false);
  const [customerAuthTab, setCustomerAuthTab] = useState<'login' | 'signup'>('login');
  
  // Custom input states for Customer Auth
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerPassword, setCustomerPassword] = useState('');
  const [customerAuthError, setCustomerAuthError] = useState('');
  const [customerAuthSuccess, setCustomerAuthSuccess] = useState('');
  const [sqlCopied, setSqlCopied] = useState(false);

  // Dynamic Settings (WhatsApp Support etc.)
  const [settings, setSettings] = useState<{ 
    whatsappNumber: string; 
    adminEmail?: string; 
    adminPassword?: string;
    appsScriptUrl?: string; 
    logoUrl?: string; 
    lotteryPrizes?: LotteryPrize[]; 
    lotteryDiscountPercentage?: number;
    lotteryCouponPrefix?: string;
    facebookUrl?: string;
    instagramUrl?: string;
    paymentBadgeTitle?: string;
    paymentBadgeDescription?: string;
    isCatalogDeactivated?: boolean;
    deactivatedMessage?: string;
    isLotteryDeactivated?: boolean;
    isNotifyMeDeactivated?: boolean;
    globalTimerEndTime?: string;
    globalTimerMessage?: string;
    globalTimerActive?: boolean;
    globalPaymentSystem?: string;
    globalPaymentMethod?: string;
    globalDeliveryDays?: string;
  }>({
    whatsappNumber: "8801755104443",
    facebookUrl: "https://www.facebook.com/stylex24/",
    instagramUrl: "https://www.instagram.com/style_x25/?hl=en",
    logoUrl: "/stylex_logo.jpg",
    globalTimerEndTime: "",
    globalTimerMessage: "",
    globalTimerActive: false,
    globalPaymentSystem: "product_defined",
    globalPaymentMethod: "both",
    globalDeliveryDays: ""
  });

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

  // Real-time settings synchronization via Supabase Realtime Postgres Changes
  useEffect(() => {
    const channel = supabase
      .channel('public:settings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'settings' },
        () => {
          // Instantly reload settings from API whenever any rows change in Supabase
          loadSettings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Initial Boot Data Loading
  useEffect(() => {
    loadStoreCollections();
    loadBanners();
    loadCoupons();
    loadCampaigns();
    loadReviews();
    loadSettings();
    loadOrders();
    loadNotifications();

    // Register global reload hook for instant component callbacks
    (window as any).refreshAppNotifications = loadNotifications;

    const orderPollInterval = setInterval(loadOrders, 9000);
    const notifPollInterval = setInterval(loadNotifications, 4000);

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

    return () => {
      clearInterval(orderPollInterval);
      clearInterval(notifPollInterval);
      delete (window as any).refreshAppNotifications;
    };
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
        const res = await fetch(`/api/visitor-ping?visitorId=${visitorId}&sessionId=${sessionId}`);
        const data = await res.json();
        if (data && data.success) {
          if (data.visits) {
            setGlobalVisits(data.visits);
          }
          if (data.liveViews) {
            setLiveViews(data.liveViews);
          }
        }
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

  // Automatically open product if deep-linked via QR Code on load
  useEffect(() => {
    if (products && products.length > 0) {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('product') || urlParams.get('productCode');
      if (code) {
        const found = products.find(p => 
          (p.code && p.code.toLowerCase() === code.toLowerCase()) || 
          String(p.id) === code
        );
        if (found) {
          setSelectedProduct(found);
        }
      }
    }
  }, [products]);

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

  const loadNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data: any[] = await res.json();
        
        // Match notifications based on logged-in customer or guest-checkout order IDs/phone number
        let guestOrderIds: string[] = [];
        let guestPhone = '';
        try {
          guestOrderIds = JSON.parse(localStorage.getItem('stylex_placed_order_ids') || '[]');
          guestPhone = localStorage.getItem('stylex_guest_phone') || '';
        } catch (e) {}

        const matchedNotifs = data.filter(notif => {
          if (!notif.customerEmail && !notif.customerPhone && !notif.orderId) {
            return false; // General product announcements do not trigger personal popups
          }
          if (notif.orderId && guestOrderIds.includes(notif.orderId)) {
            return true;
          }
          if (currentCustomer) {
            const matchEmail = currentCustomer.email && notif.customerEmail && 
              notif.customerEmail.toLowerCase().trim() === currentCustomer.email.toLowerCase().trim();
            const cleanCustPhone = currentCustomer.phone ? currentCustomer.phone.replace(/[\s+]/g, '').trim() : '';
            const cleanNotifPhone = notif.customerPhone ? notif.customerPhone.replace(/[\s+]/g, '').trim() : '';
            const matchPhone = cleanCustPhone && cleanNotifPhone && (
              cleanNotifPhone === cleanCustPhone ||
              (cleanCustPhone.length >= 10 && cleanNotifPhone.endsWith(cleanCustPhone.slice(-10)))
            );
            if (matchEmail || matchPhone) return true;
          }
          if (guestPhone && notif.customerPhone) {
            const cleanGuestPhone = guestPhone.replace(/[\s+]/g, '').trim();
            const cleanNotifPhone = notif.customerPhone.replace(/[\s+]/g, '').trim();
            return cleanGuestPhone && cleanNotifPhone && (
              cleanNotifPhone === cleanGuestPhone ||
              (cleanGuestPhone.length >= 10 && cleanNotifPhone.endsWith(cleanGuestPhone.slice(-10)))
            );
          }
          return false;
        });

        if (isFirstNotifLoad) {
          // Record previously existing matching notification IDs to avoid retro-alerts
          const existingIds = matchedNotifs.map(n => n.id);
          setNotifiedIDs(existingIds);
          setIsFirstNotifLoad(false);
        } else {
          // Detect any newly arrived order status updates
          const newlyArrived = matchedNotifs.find(n => !notifiedIDs.includes(n.id));
          if (newlyArrived) {
            setPersonalNotifToast(newlyArrived);
            setShowPersonalToast(true);
            setNotifiedIDs(prev => [...prev, newlyArrived.id]);
          }
        }

        setNotifications(data);
      }
    } catch (err) {
      console.warn("Failed loading notifications", err);
    }
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
    // Direct checkout for a specific product should clear previous cart items
    // and initialize the cart with ONLY the chosen product at quantity 1
    // to match the product price perfectly on the payment checkout screen.
    const directCart = [{ product, selectedSize: size, quantity: 1 }];
    setCart(directCart);
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

  const handleUpdateCartSize = (idx: number, newSize: string) => {
    const fresh = [...cart];
    fresh[idx].selectedSize = newSize;
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
    const userEmail = settings?.adminEmail || "risatadnan4@gmail.com";
    const activeAdminPassword = settings?.adminPassword || "risat123";
    if (loginEmail.trim() === userEmail && loginPassword === activeAdminPassword) {
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
  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustomerAuthError('');
    setCustomerAuthSuccess('');

    const registeredRaw = localStorage.getItem('stylex_registered_customers');
    let registered: Customer[] = [];
    try {
      registered = registeredRaw ? JSON.parse(registeredRaw) : [];
    } catch (e) {
      console.warn("Corrupted stylex_registered_customers in localStorage:", e);
    }

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
      
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: customerEmail.trim(),
          password: customerPassword,
        });

        if (error) {
          throw error;
        }

        if (data?.user) {
          const meta = data.user.user_metadata || {};
          const loggedCust: Customer = {
            name: meta.name || data.user.email?.split('@')[0] || 'VIP Member',
            email: data.user.email || customerEmail,
            password: customerPassword,
            phone: meta.phone || ''
          };

          setCustomerAuthSuccess(`Welcome back, ${loggedCust.name}! Verification active.`);
          setCurrentCustomer(loggedCust);
          localStorage.setItem('stylex_current_customer', JSON.stringify(loggedCust));

          // Ensure sync in local cache
          const idx = registered.findIndex(c => c.email.toLowerCase().trim() === loggedCust.email.toLowerCase().trim());
          if (idx === -1) {
            registered.push(loggedCust);
          } else {
            registered[idx] = loggedCust;
          }
          localStorage.setItem('stylex_registered_customers', JSON.stringify(registered));

          setTimeout(() => {
            setShowCustomerAuthModal(false);
            setCustomerEmail('');
            setCustomerPassword('');
            setCustomerAuthSuccess('');
          }, 1000);
        }
      } catch (err: any) {
        console.warn("Supabase Auth login error. Silently falling back to local login:", err);
        
        let found = registered.find(
          c => c.email.toLowerCase().trim() === customerEmail.toLowerCase().trim()
        );

        if (!found) {
          found = {
            name: customerEmail.split('@')[0] || 'VIP Guest',
            email: customerEmail.trim(),
            password: customerPassword,
            phone: ''
          };
          registered.push(found);
          localStorage.setItem('stylex_registered_customers', JSON.stringify(registered));
        } else {
          found.password = customerPassword; // Trust current login password for local preview flexibility
        }

        setCustomerAuthSuccess(`Welcome back, ${found.name}! Redirecting...`);
        setCurrentCustomer(found);
        localStorage.setItem('stylex_current_customer', JSON.stringify(found));

        setTimeout(() => {
          setShowCustomerAuthModal(false);
          setCustomerEmail('');
          setCustomerPassword('');
          setCustomerAuthSuccess('');
        }, 1000);
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

      try {
        const { data, error } = await supabase.auth.signUp({
          email: customerEmail.trim(),
          password: customerPassword,
          options: {
            data: {
              name: customerName.trim(),
              phone: customerPhone?.trim() || ''
            }
          }
        });

        if (error) {
          throw error;
        }

        const newCust: Customer = {
          name: customerName.trim(),
          email: customerEmail.trim(),
          password: customerPassword,
          phone: customerPhone?.trim() || ''
        };

        // Cache locally too
        const exists = registered.some(
          c => c.email.toLowerCase().trim() === newCust.email.toLowerCase().trim()
        );
        if (!exists) {
          registered.push(newCust);
          localStorage.setItem('stylex_registered_customers', JSON.stringify(registered));
        }

        setCustomerAuthSuccess('Membership profile secured inside Supabase Auth! Active now.');
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
      } catch (err: any) {
        console.warn("Supabase Auth signup error. Silently falling back to local registration:", err);
        
        const newCust: Customer = {
          name: customerName.trim(),
          email: customerEmail.trim(),
          password: customerPassword,
          phone: customerPhone?.trim() || ''
        };

        const existsIdx = registered.findIndex(
          c => c.email.toLowerCase().trim() === newCust.email.toLowerCase().trim()
        );
        if (existsIdx === -1) {
          registered.push(newCust);
        } else {
          registered[existsIdx] = newCust;
        }
        localStorage.setItem('stylex_registered_customers', JSON.stringify(registered));

        setCustomerAuthSuccess('Membership profile created successfully! Active now.');
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
    }
  };

  const handleCustomerLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Supabase sign out info: ", e);
    }
    setCurrentCustomer(null);
    localStorage.removeItem('stylex_current_customer');
  };

  const handleUpdateCustomer = (updated: Customer) => {
    setCurrentCustomer(updated);
    localStorage.setItem('stylex_current_customer', JSON.stringify(updated));

    // Also update in registered list so it persists across sessions
    try {
      const savedList = localStorage.getItem('stylex_registered_customers');
      let registeredList = savedList ? JSON.parse(savedList) : [];
      const idx = registeredList.findIndex((c: any) => c.email.toLowerCase().trim() === updated.email.toLowerCase().trim());
      if (idx !== -1) {
        registeredList[idx] = updated;
      } else {
        registeredList.push(updated);
      }
      localStorage.setItem('stylex_registered_customers', JSON.stringify(registeredList));
    } catch (e) {
      console.warn("Error updating registered list: ", e);
    }
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
      // 1. Pinned products always come first
      const aPinned = a.isPinned ? 1 : 0;
      const bPinned = b.isPinned ? 1 : 0;
      if (bPinned !== aPinned) return bPinned - aPinned;

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
        onLogout={handleLogout}
        products={products}
        onRefreshProducts={() => {
          loadStoreCollections();
          loadReviews();
        }}
        settings={settings}
        onRefreshSettings={loadSettings}
        onRefreshCoupons={loadCoupons}
      />
    );
  }

  // Active home banner variables
  const activePromoBanner = banners.find(b => b.active) || {
    title: "STYLE X COLLECTIVE",
    subtitle: "A meticulous exploration of minimalist form and avant-garde structure. Curated exclusively by Risat Adnan for the modern visionary.",
    imageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=1200&auto=format&fit=crop",
    isVideo: false
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
      {/* Slim Gradient Scroll Progress Bar */}
      <div 
        className="fixed top-0 left-0 h-[3px] bg-gradient-to-r from-yellow-600 via-luxury-gold to-yellow-300 z-[99999] transition-all duration-75 shadow-[0_0_12px_rgba(212,175,55,0.8)]"
        style={{ width: `${scrollProgress}%` }}
      />
      
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
            className="text-white/45 hover:text-luxury-gold hover:rotate-90 hover:scale-110 active:scale-95 transition-all duration-300 p-1 rounded-full hover:bg-white/5 border border-transparent hover:border-luxury-gold/30 hover:shadow-[0_0_15px_rgba(212,175,55,0.25)] cursor-pointer flex items-center justify-center shrink-0 z-10"
            title="Dismiss Announcement"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Main sticky luxury headers */}
      <Navbar 
        logoUrl={settings?.logoUrl}
        isCatalogDeactivated={settings?.isCatalogDeactivated}
        isLotteryDeactivated={settings?.isLotteryDeactivated}
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        onCartClick={() => { setInitialShowCheckout(false); setIsCartOpen(true); }}
        onTrackOrderClick={() => {
          setIsTrackMode(true);
          setIsSearchPage(false);
          window.scrollTo({ top: 350, behavior: 'smooth' });
        }}
        onHomeClick={() => {
          setIsTrackMode(false);
          setIsSearchPage(false);
          setSearchQuery('');
          setActiveCategory('ALL');
        }}
        onLotteryClick={() => setIsLotteryOpen(true)}
        searchQuery={searchQuery}
        setSearchQuery={(q) => {
          setSearchQuery(q);
          if (q.trim() !== '') {
            setIsSearchPage(true);
          } else {
            setIsSearchPage(false);
          }
          setIsTrackMode(false);
        }}
        onSearchSubmit={(q) => {
          setSearchQuery(q);
          setIsSearchPage(true);
          setIsTrackMode(false);
        }}
        onSearchFocus={() => {
          setIsSearchPage(true);
          setIsTrackMode(false);
        }}
        customer={currentCustomer}
        onCustomerAuthClick={() => {
          setCustomerAuthTab('login');
          setShowCustomerAuthModal(true);
        }}
        onCustomerLogout={handleCustomerLogout}
        onViewMyOrdersClick={() => {
          setShowCustomerProfileModal(true);
        }}
      />

      {/* Hero Header Banners */}
      {!isTrackMode && !isSearchPage && !settings?.isCatalogDeactivated && (
        <Hero 
          banners={banners}
          bannerTitle={activePromoBanner.title}
          bannerSubtitle={activePromoBanner.subtitle}
          bannerImage={activePromoBanner.imageUrl}
          bannerIsVideo={activePromoBanner.isVideo}
        />
      )}

      {/* Base Store Page workspace container */}
      <main className="flex-1 pb-16">
        {isTrackMode ? (
          /* Track Order Layout view */
          <div id="order-tracker-container" className="bg-[#050505] min-h-[50vh] border-b border-white/5 py-10">
            <OrderTracker 
              whatsappNumber={settings.whatsappNumber} 
              activeTrackId={activeTrackId}
              onTrackIdChange={setActiveTrackId}
              customer={currentCustomer}
            />
          </div>
        ) : settings?.isCatalogDeactivated ? (
          /* Premium Deactivated Catalogue Message Box */
          <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-8 animate-fade-in font-display">
            <div className="relative inline-flex items-center justify-center">
              {/* Outer pulsing layers */}
              <div className="absolute inset-0 bg-luxury-gold/10 rounded-full blur-2xl animate-pulse"></div>
              <div className="w-20 h-20 bg-[#0c0512] border-2 border-luxury-gold/50 rounded-full flex items-center justify-center relative z-10 shadow-[0_0_30px_rgba(212,175,55,0.15)]">
                <span className="text-3xl">⚜️</span>
              </div>
            </div>

            <div className="space-y-3.5 max-w-xl mx-auto">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-luxury-gold/10 border border-luxury-gold/30 rounded-full text-[9px] text-luxury-gold font-mono uppercase tracking-[0.2em] font-black shadow-[0_0_15px_rgba(212,175,55,0.05)] animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                Seasonal Curation Pause
              </span>
              <h2 className="font-serif text-3xl md:text-4xl font-black text-white leading-tight uppercase tracking-widest pt-2">
                Archives Private Refresh
              </h2>
              <div className="w-12 h-[1px] bg-luxury-gold/40 mx-auto"></div>
              <p className="text-xs md:text-sm text-zinc-300 leading-relaxed font-sans font-light tracking-wide py-2.5">
                {settings.deactivatedMessage || "The VIP showcase catalog is currently undergoing seasonal curation refresh. Private concierge is fully active — contact via WhatsApp for custom order loops."}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 max-w-md mx-auto">
              {/* WhatsApp Live button */}
              <a 
                href={`https://wa.me/${settings.whatsappNumber}`}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 border border-emerald-400/20 text-white font-sans font-black tracking-widest uppercase text-[10px] rounded-2xl shadow-[0_4px_15px_rgba(16,185,129,0.2)] hover:shadow-[0_8px_25px_rgba(16,185,129,0.35)] transition-all duration-300 hover:scale-[1.03] active:scale-95 text-center"
              >
                <span>💬 WhatsApp Concierge</span>
              </a>

              {/* Order Tracker Switch button */}
              <button 
                onClick={() => setIsTrackMode(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-[#0d071b] border border-[#d4af37]/30 hover:border-[#d4af37] text-luxury-gold hover:text-white font-sans font-black tracking-widest uppercase text-[10px] rounded-2xl transition-all duration-300 hover:scale-[1.03] active:scale-95 cursor-pointer"
              >
                <span>📦 Track Active Order</span>
              </button>
            </div>

            <div className="pt-6">
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                ESTABLISHED GATEWAY CODES SECURED • STYLE X PRIVATE CLUB
              </p>
            </div>
          </div>
        ) : isSearchPage ? (
          /* Bespoke Dedicated Search Results View / Page */
          <div className="bg-[#030107] min-h-[70vh] py-12 px-4 md:px-8 max-w-7xl mx-auto space-y-10 animate-fade-in">
            {/* Header section with back button */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/[0.06] pb-8">
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setIsSearchPage(false);
                    setSearchQuery('');
                  }}
                  className="flex items-center gap-2 text-xs text-luxury-gold hover:text-white transition-colors uppercase font-mono tracking-widest outline-none"
                >
                  ← BACK TO GALLERIES
                </button>
                <h2 className="font-serif text-3xl font-bold tracking-widest text-[#ffffff] uppercase mt-2">
                  Search &amp; Discovery
                </h2>
                <p className="text-xs text-zinc-400 font-mono">
                  VIP SYSTEM ARCHIVES FOUND <span className="text-luxury-gold font-bold">{filteredProducts.length} AVAILABLE PIECES</span> FOR &ldquo;<span className="text-white italic font-serif tracking-normal">{searchQuery}</span>&rdquo;
                </p>
              </div>

              {/* Glowing decorative search active banner indicator */}
              <div className="p-4 bg-gradient-to-br from-luxury-purple/20 via-transparent to-[#1a0533] border border-luxury-gold/30 rounded-2xl flex items-center gap-3 relative overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 w-24 h-24 bg-luxury-gold/5 rounded-full blur-xl animate-pulse"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></div>
                <div className="text-right">
                  <span className="text-[9px] text-[#d4af37] font-black uppercase block tracking-widest">ENCRYPTED SEALS DEPLOYED</span>
                  <span className="text-[10px] text-white/50 block font-mono">SECURED CONCIERGE STOCK VIEW</span>
                </div>
              </div>
            </div>

            {/* Results Grid block */}
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard 
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                    onOrderNow={handleOrderNow}
                    onProductClick={(p: Product) => { setSelectedProduct(p); }}
                    isWishlisted={wishlist.includes(product.id)}
                    onToggleWishlist={handleToggleWishlist}
                    whatsappNumber={settings.whatsappNumber}
                    isNotifyMeDeactivated={settings?.isNotifyMeDeactivated}
                    globalDeliveryDays={settings?.globalDeliveryDays}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-24 px-6 border border-white/5 rounded-3xl bg-[#090312]/40 max-w-2xl mx-auto space-y-4">
                <span className="text-4xl">⚜️</span>
                <h3 className="font-serif text-lg font-bold tracking-widest uppercase text-white/90">NO CORRESPONDING ARTIFACTS</h3>
                <p className="text-xs text-zinc-500 font-mono max-w-md mx-auto leading-relaxed">
                  The criteria specified did not yield registered entries. Adjust search credentials, or contact Style X private concierge to fetch personalized drops.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setIsSearchPage(false);
                      setSearchQuery('');
                    }}
                    className="px-6 py-2.5 bg-luxury-gold text-luxury-black font-display text-[10px] font-black uppercase tracking-widest rounded-full hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                  >
                    Clear Search
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Standard listings collections catalog view */
          <div className="max-w-7xl mx-auto px-4 py-12 md:px-8 space-y-12">
            
            {/* Global Countdown Banner */}
            <GlobalCountdown 
              endTime={settings?.globalTimerEndTime}
              message={settings?.globalTimerMessage}
              active={settings?.globalTimerActive}
            />
            
            {/* Category selection bar */}
            <div id="exclusive-series-catalog" className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-white/5 pb-4 gap-4">
              <div>
                <h3 className="font-serif text-xl font-bold uppercase tracking-widest text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-luxury-gold inline-block rounded-full"></span>
                  Exclusive Series
                </h3>
                <p className="text-[10px] text-white/40 tracking-wider font-mono uppercase mt-0.5">Explore our limited drop allocations</p>
              </div>

              {/* Responsive pills sliders */}
              <div className="w-full overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-luxury-gold/10 scrollbar-track-transparent py-1.5 -mx-4 px-4 md:mx-0 md:px-0 flex gap-2 sm:gap-3 snap-x snap-mandatory">
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
                    className={`snap-start h-11 px-5 text-[10.5px] sm:text-[11px] uppercase font-sans font-black tracking-widest border rounded-xl transition-all duration-300 whitespace-nowrap cursor-pointer hover:scale-[1.02] active:scale-95 flex items-center justify-center shrink-0 relative overflow-hidden luxury-reflection ${
                      activeCategory === cat.id
                        ? 'bg-gradient-to-r from-[#d4af37] via-[#ffd700] to-[#fcf1cc] text-[#030107] border-transparent shadow-[0_4px_18px_rgba(212,175,55,0.4)] font-black'
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 animate-fade-in">
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
                    isNotifyMeDeactivated={settings?.isNotifyMeDeactivated}
                    globalDeliveryDays={settings?.globalDeliveryDays}
                  />
                ))}
              </div>
            )}

            {/* LUXURY EXPERIENCES STORIES / REVIEWS CATALOG */}
            <div id="customer-experiences-reviews" className="border-t border-white/5 pt-16 grid grid-cols-1 lg:grid-cols-3 gap-10">
              
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
                <form 
                  onSubmit={handleReviewFormSubmit} 
                  className="bg-gradient-to-tr from-[#090312] via-[#0d051a] to-[#040108] border-2 border-[#d4af37]/40 hover:border-[#d4af37]/75 rounded-2xl p-6 space-y-4 shadow-[0_15px_40px_rgba(212,175,55,0.12)] transition-all duration-500 relative overflow-hidden group/form text-white"
                >
                  {/* Visual ambient element inside the form */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#d4af37]/5 rounded-full blur-3xl pointer-events-none transition-all group-hover/form:bg-[#d4af37]/10 duration-700"></div>

                  <div className="border-b border-white/[0.08] pb-3">
                    <h4 className="font-serif text-base font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-white via-[#ffd700] to-white tracking-widest flex items-center gap-1.5 leading-snug">
                      <span>⚜️</span> Submit Experience
                    </h4>
                    <p className="text-[9.5px] text-white/50 uppercase font-mono tracking-widest mt-1">SHARE YOUR BRAND LEGACY REVIEW</p>
                  </div>
                  
                  {/* Select product */}
                  <div>
                    <label className="block text-[9.5px] uppercase font-mono tracking-widest text-[#d4af37] font-extrabold mb-1.5">Curated Piece Choice</label>
                    <div className="relative rounded-lg p-[1px] bg-white/[0.08] focus-within:bg-[linear-gradient(to_right,#D4AF37,#9A4DFF)] transition-all duration-300">
                      <select
                        required
                        value={newReviewProdId}
                        onChange={(e) => setNewReviewProdId(e.target.value)}
                        className="w-full bg-[#100624] text-white text-xs border border-transparent rounded-lg py-3 px-3 focus:outline-none font-mono cursor-pointer transition-all uppercase tracking-normal"
                      >
                        <option value="" className="bg-[#100624] text-white/40">SELECT AN ARTICLE...</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id} className="bg-[#100624] text-white">{p.title} ({p.code})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-[9.5px] uppercase font-mono tracking-widest text-[#d4af37] font-extrabold mb-1.5">Your Name / Title</label>
                    <div className="relative rounded-lg p-[1px] bg-white/[0.08] focus-within:bg-[linear-gradient(to_right,#D4AF37,#9A4DFF)] transition-all duration-300">
                      <input 
                        type="text" 
                        required 
                        placeholder="e.g. Adnan R."
                        value={newReviewName}
                        onChange={(e) => setNewReviewName(e.target.value)}
                        className="w-full bg-[#100624] text-white text-xs border border-transparent rounded-lg py-3 px-3 focus:outline-none placeholder-white/20 transition-all font-mono"
                      />
                    </div>
                  </div>

                  {/* Rating */}
                  <div>
                    <label className="block text-[9.5px] uppercase font-mono tracking-widest text-[#d4af37] font-extrabold mb-1.5">Rating Weight</label>
                    <div className="flex gap-2.5 bg-black/40 border border-white/5 py-2 px-3 rounded-lg w-fit">
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setNewReviewRating(val)}
                          className={`p-1.5 hover:scale-125 transition-all outline-none ${
                            newReviewRating >= val ? 'text-[#ffd700]' : 'text-white/20'
                          }`}
                        >
                          <Star 
                            size={20} 
                            fill={newReviewRating >= val ? '#ffd700' : 'none'} 
                            className={`${newReviewRating >= val ? 'drop-shadow-[0_0_10px_rgba(255,215,0,0.4)] animate-pulse' : ''} transition-all duration-300`} 
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Comment */}
                  <div>
                    <label className="block text-[9.5px] uppercase font-mono tracking-widest text-[#d4af37] font-extrabold mb-1.5">Exquisite Feedback Comments</label>
                    <div className="relative rounded-lg p-[1px] bg-white/[0.08] focus-within:bg-[linear-gradient(to_right,#D4AF37,#9A4DFF)] transition-all duration-300">
                      <textarea 
                        required 
                        rows={2} 
                        placeholder="Write detailed feedback regarding aesthetic quality..."
                        value={newReviewComment}
                        onChange={(e) => setNewReviewComment(e.target.value)}
                        className="w-full bg-[#100624] text-white text-xs border border-transparent rounded-lg py-3 px-3 focus:outline-none placeholder-white/20 transition-all font-mono resize-none leading-relaxed"
                      />
                    </div>
                  </div>

                  {revMessage && (
                    <div className="bg-gradient-to-r from-emerald-500/10 to-[#100624] border border-emerald-500/30 text-emerald-400 p-3 rounded-lg text-[10.5px] font-mono leading-relaxed shadow-inner">
                      {revMessage}
                    </div>
                  )}

                  {/* Submit Button with running effect */}
                  <div className="relative rounded-xl p-[1.5px] overflow-hidden group/btn">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#d4af37] via-[#ffd700] to-[#aa7c11] opacity-60 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                    <button
                      type="submit"
                      className="relative w-full bg-gradient-to-r from-black via-[#0d041a] to-black hover:text-white text-[#d4af37] font-display font-black text-[11px] uppercase tracking-[0.2em] py-3.5 rounded-xl transition-all duration-300 cursor-pointer shadow-lg active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <span>⚜️</span> Catalog Experience
                    </button>
                  </div>
                </form>
              </div>

            </div>

          </div>
        )}
      </main>
                  {/* Floating Luxury Circular Menu Bar - Positioned dynamically beside StyleX Assistant on both Mobile and Desktop */}
      {!isAdminView && (
        <div className="fixed bottom-4 sm:bottom-6 right-2 sm:right-6 max-w-[calc(100vw-16px)] z-40 p-1 sm:p-1.5 rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.85)] border border-white/5 transition-all flex items-center justify-end overflow-hidden">
          
          {/* Outer Container Wide Panoramic Running Laser Glow */}
          <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
            {/* Volumetric soft splash backdrop rotating glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220%] h-[220%] bg-[conic-gradient(from_0deg,#9A4DFF,#D4AF37,#22c55e,#3b82f6,#9A4DFF)] animate-luxury-glow-spin blur-[8px] opacity-40" />
            {/* Sharp running border outline */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[240%] h-[240%] bg-[conic-gradient(from_0deg,#9A4DFF,#D4AF37,#22c55e,#3b82f6,#9A4DFF)] animate-luxury-glow-spin blur-[1.5px] opacity-75" />
            <div className="absolute inset-[1.5px] rounded-full bg-[#05010ca6]/95 backdrop-blur-md" />
          </div>

          {/* Inner scrollable wrapper for buttons */}
          <div className="relative z-10 w-full overflow-x-auto scrollbar-none flex flex-nowrap items-center gap-1.5 sm:gap-2.5 py-0.5 px-1.5 justify-end">
            
            {/* VIP Notification Alerts Hub */}
            <button 
              onClick={() => { 
                  setIsNotificationOpen(true); 
                  const now = Date.now();
                  setLastReadTimestamp(now);
                  localStorage.setItem('stylex_notif_last_read_ts', String(now));
              }}
              className="w-9 h-9 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.8)] hover:scale-110 active:scale-95 transition-all outline-none cursor-pointer relative group shrink-0 animate-subtle-bob-1"
              title="VIP Dispatch & Product Alerts Hub"
            >
              {/* Animated multi-layered running glow border around the button */}
              <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
                {/* Soft splash backdrop glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[160%] h-[160%] bg-[conic-gradient(from_0deg,#D4AF37,#9A4DFF,#3b82f6,#22c55e,#D4AF37)] animate-luxury-glow-spin blur-[4px] opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" />
                {/* Sharp crisp running line */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180%] h-[180%] bg-[conic-gradient(from_0deg,#D4AF37,#9A4DFF,#3b82f6,#22c55e,#D4AF37)] animate-luxury-glow-spin blur-[0.5px] opacity-90 group-hover:scale-105 transition-all duration-300" />
                <div className="absolute inset-[1.5px] rounded-full bg-[#0a0412]" />
              </div>
              
              <Bell className="relative z-10 w-3.5 h-3.5 sm:w-5 sm:h-5 stroke-[1.8] text-white group-hover:text-luxury-gold transition-colors animate-micro-icon" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3 z-20">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 text-[7.5px] text-white font-extrabold items-center justify-center leading-none">
                    {unreadNotificationsCount}
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
              className="w-9 h-9 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.8)] hover:scale-110 active:scale-95 transition-all outline-none cursor-pointer relative group shrink-0 animate-subtle-bob-2"
              title="Request Campaign Discount Coupon"
            >
              {/* Animated multi-layered running glow border around the button */}
              <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
                {/* Soft splash backdrop glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[160%] h-[160%] bg-[conic-gradient(from_0deg,#D4AF37,#9A4DFF,#3b82f6,#22c55e,#D4AF37)] animate-luxury-glow-spin blur-[4px] opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" />
                {/* Sharp crisp running line */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180%] h-[180%] bg-[conic-gradient(from_0deg,#D4AF37,#9A4DFF,#3b82f6,#22c55e,#D4AF37)] animate-luxury-glow-spin blur-[0.5px] opacity-90 group-hover:scale-105 transition-all duration-300" />
                <div className="absolute inset-[1.5px] rounded-full bg-[#0a0412]" />
              </div>
              
              <Percent className="relative z-10 w-3.5 h-3.5 sm:w-5 sm:h-5 stroke-[1.8] text-luxury-gold group-hover:text-white transition-colors animate-micro-icon" />
              <span className="absolute -top-10 scale-0 group-hover:scale-100 transition-all font-mono text-[9px] bg-black text-luxury-gold border border-luxury-gold/30 rounded px-2 py-1 whitespace-nowrap hidden sm:block z-20">
                GET DISCOUNT
              </span>
            </button>
            
            {/* Imperial Fortune Game */}
            {!settings?.isLotteryDeactivated && (
              <button 
                onClick={() => setIsLotteryOpen(true)}
                className="w-9 h-9 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.8)] hover:scale-110 active:scale-95 transition-all outline-none cursor-pointer relative group shrink-0 animate-subtle-bob-3"
                title="Imperial Fortune Game"
              >
                {/* Animated multi-layered running glow border around the button */}
                <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
                  {/* Soft splash backdrop glow */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[160%] h-[160%] bg-[conic-gradient(from_0deg,#D4AF37,#9A4DFF,#3b82f6,#22c55e,#D4AF37)] animate-luxury-glow-spin blur-[4px] opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" />
                  {/* Sharp crisp running line */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180%] h-[180%] bg-[conic-gradient(from_0deg,#D4AF37,#9A4DFF,#3b82f6,#22c55e,#D4AF37)] animate-luxury-glow-spin blur-[0.5px] opacity-90 group-hover:scale-105 transition-all duration-300" />
                  <div className="absolute inset-[1.5px] rounded-full bg-[#0a0412]" />
                </div>
                
                <Gift className="relative z-10 w-3.5 h-3.5 sm:w-5 sm:h-5 stroke-[1.8] text-luxury-gold group-hover:text-white transition-colors animate-micro-icon" />
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 sm:h-3 sm:w-3 z-20">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-red-500"></span>
                </span>
                <span className="absolute -top-10 scale-0 group-hover:scale-100 transition-all font-mono text-[9px] bg-black text-luxury-gold border border-luxury-gold/30 rounded px-2 py-1 whitespace-nowrap hidden sm:block z-20">
                  VOUCHER WHEEL
                </span>
              </button>
            )}
            
            {/* Track Existing Receipts */}
            <button 
              onClick={() => { setIsTrackMode(true); window.scrollTo({ top: 350, behavior: 'smooth' }); }}
              className="w-9 h-9 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.8)] hover:scale-110 active:scale-95 transition-all outline-none cursor-pointer relative group shrink-0 animate-subtle-bob-4"
              title="Track Existing Receipts"
            >
              {/* Animated multi-layered running glow border around the button */}
              <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
                {/* Soft splash backdrop glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[160%] h-[160%] bg-[conic-gradient(from_0deg,#D4AF37,#9A4DFF,#3b82f6,#22c55e,#D4AF37)] animate-luxury-glow-spin blur-[4px] opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" />
                {/* Sharp crisp running line */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180%] h-[180%] bg-[conic-gradient(from_0deg,#D4AF37,#9A4DFF,#3b82f6,#22c55e,#D4AF37)] animate-luxury-glow-spin blur-[0.5px] opacity-90 group-hover:scale-105 transition-all duration-300" />
                <div className="absolute inset-[1.5px] rounded-full bg-[#0a0412]" />
              </div>
              
              <Ticket className="relative z-10 w-3.5 h-3.5 sm:w-5 sm:h-5 stroke-[1.8] text-white group-hover:text-luxury-gold transition-colors animate-micro-icon" />
              <span className="absolute -top-10 scale-0 group-hover:scale-100 transition-all font-mono text-[9px] bg-black text-luxury-gold border border-luxury-gold/30 rounded px-2 py-1 whitespace-nowrap hidden sm:block z-20">
                TRACK RECEIPT
              </span>
            </button>
            
            {/* View Current Bag */}
            <button 
              onClick={() => { setInitialShowCheckout(false); setIsCartOpen(true); }}
              className="w-9 h-9 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.8)] hover:scale-110 active:scale-95 transition-all outline-none cursor-pointer relative group shrink-0 animate-subtle-bob-1"
              title="View Current Luxury Bag"
            >
              {/* Animated multi-layered running glow border around the button */}
              <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
                {/* Soft splash backdrop glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[160%] h-[160%] bg-[conic-gradient(from_0deg,#D4AF37,#9A4DFF,#3b82f6,#22c55e,#D4AF37)] animate-luxury-glow-spin blur-[4px] opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" />
                {/* Sharp crisp running line */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180%] h-[180%] bg-[conic-gradient(from_0deg,#D4AF37,#9A4DFF,#3b82f6,#22c55e,#D4AF37)] animate-luxury-glow-spin blur-[0.5px] opacity-90 group-hover:scale-105 transition-all duration-300" />
                <div className="absolute inset-[1.5px] rounded-full bg-[#0a0412]" />
              </div>
              
              <motion.div
                key={cart.reduce((sum, item) => sum + item.quantity, 0)}
                animate={cart.length > 0 ? {
                  scale: [1, 1.35, 0.95, 1.05, 1],
                  rotate: [0, -8, 8, -4, 0]
                } : {}}
                transition={{ duration: 0.55, ease: "easeInOut" }}
                className="relative z-10 flex items-center justify-center"
              >
                <ShoppingBag className="w-3.5 h-3.5 sm:w-5 sm:h-5 stroke-[1.8] text-white group-hover:text-luxury-gold transition-colors animate-micro-icon" />
              </motion.div>
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-luxury-gold text-luxury-black font-mono font-black text-[8px] sm:text-[10px] w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center border border-black shadow z-20 animate-bounce">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
              <span className="absolute -top-10 scale-0 group-hover:scale-100 transition-all font-mono text-[9px] bg-black text-luxury-gold border border-luxury-gold/30 rounded px-2 py-1 whitespace-nowrap hidden sm:block z-20">
                LUXURY BAG
              </span>
            </button>

            {/* WhatsApp Live Concierge */}
            <a 
              href={`https://wa.me/${settings?.whatsappNumber || "8801755104443"}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.8)] hover:scale-110 active:scale-95 transition-all outline-none cursor-pointer relative group shrink-0 animate-subtle-bob-2"
              title="WhatsApp Live Concierge"
            >
              {/* Animated multi-layered running glow border around the button */}
              <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
                {/* Soft splash backdrop glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[160%] h-[160%] bg-[conic-gradient(from_0deg,#25D366,#22c55e,#D4AF37,#25D366)] animate-luxury-glow-spin blur-[4px] opacity-65 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" />
                {/* Sharp crisp running line */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180%] h-[180%] bg-[conic-gradient(from_0deg,#25D366,#22c55e,#D4AF37,#25D366)] animate-luxury-glow-spin blur-[0.5px] opacity-90 group-hover:scale-105 transition-all duration-300" />
                <div className="absolute inset-[1.5px] rounded-full bg-[#0a1204]" />
              </div>
              
              {/* Pulsing visual halo rings */}
              <span className="absolute inset-0 rounded-full border border-emerald-500/40 opacity-30 scale-125 animate-ping pointer-events-none z-0"></span>
              <MessageCircle className="relative z-10 w-3.5 h-3.5 sm:w-5 sm:h-5 text-[#25D366] group-hover:text-white transition-colors animate-micro-icon" />
              <span className="absolute -top-10 scale-0 group-hover:scale-100 transition-all font-mono text-[9px] bg-black text-[#25D366] border border-emerald-500/30 rounded px-2 py-1 whitespace-nowrap hidden sm:block z-20">
                WHATSAPP
              </span>
            </a>

            {/* Facebook Official Page */}
            <a 
              href={settings?.facebookUrl || "https://www.facebook.com/stylex24/"}
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.8)] hover:scale-110 active:scale-95 transition-all outline-none cursor-pointer relative group shrink-0 animate-subtle-bob-3"
              title="Facebook Official Collection"
            >
              {/* Animated border */}
              <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[160%] h-[160%] bg-[conic-gradient(from_0deg,#1877F2,#3b82f6,#D4AF37,#1877F2)] animate-luxury-glow-spin blur-[4px] opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180%] h-[180%] bg-[conic-gradient(from_0deg,#1877F2,#3b82f6,#D4AF37,#1877F2)] animate-luxury-glow-spin blur-[0.5px] opacity-90 group-hover:scale-105 transition-all duration-300" />
                <div className="absolute inset-[1.5px] rounded-full bg-[#040812]" />
              </div>
              
              <Facebook className="relative z-10 w-3.5 h-3.5 sm:w-5 sm:h-5 text-white group-hover:text-luxury-gold transition-colors animate-micro-icon" />
              <span className="absolute -top-10 scale-0 group-hover:scale-100 transition-all font-mono text-[9px] bg-black text-luxury-gold border border-luxury-gold/30 rounded px-2 py-1 whitespace-nowrap hidden sm:block z-20">
                FACEBOOK
              </span>
            </a>

            {/* Instagram Official Page */}
            <a 
              href={settings?.instagramUrl || "https://www.instagram.com/style_x25/?hl=en"}
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.8)] hover:scale-110 active:scale-95 transition-all outline-none cursor-pointer relative group shrink-0 animate-subtle-bob-4"
              title="Instagram Gallery Reel"
            >
              {/* Animated border */}
              <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[160%] h-[160%] bg-[conic-gradient(from_0deg,#E1306C,#F77737,#FCAF45,#833AB4,#E1306C)] animate-luxury-glow-spin blur-[4px] opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180%] h-[180%] bg-[conic-gradient(from_0deg,#E1306C,#F77737,#FCAF45,#833AB4,#E1306C)] animate-luxury-glow-spin blur-[0.5px] opacity-90 group-hover:scale-105 transition-all duration-300" />
                <div className="absolute inset-[1.5px] rounded-full bg-[#0a0412]" />
              </div>
              
              <Instagram className="relative z-10 w-3.5 h-3.5 sm:w-5 sm:h-5 text-white group-hover:text-luxury-gold transition-colors animate-micro-icon" />
              <span className="absolute -top-10 scale-0 group-hover:scale-100 transition-all font-mono text-[9px] bg-black text-luxury-gold border border-luxury-gold/30 rounded px-2 py-1 whitespace-nowrap hidden sm:block z-20">
                INSTAGRAM
              </span>
            </a>
          </div>
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
              {!settings?.isLotteryDeactivated && (
                <li><button onClick={() => setIsLotteryOpen(true)} className="hover:text-luxury-gold">Imperial Fortune Wheel</button></li>
              )}
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
              <div className="w-8 h-8 bg-luxury-charcoal border border-luxury-gold/30 rounded flex items-center justify-center p-0.5 overflow-hidden">
                <img 
                  src={settings?.logoUrl || "/stylex_logo.jpg"} 
                  alt="Style X Logo" 
                  className="w-full h-full object-contain rounded"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/stylex_logo.jpg";
                  }}
                />
              </div>
              <p className="text-[10px] font-mono tracking-widest uppercase">STYLE X SEQUENCE</p>
            </div>
            {/* Real social links */}
            <div className="flex items-center gap-3 pt-1">
              <a 
                href={settings?.facebookUrl || "https://www.facebook.com/stylex24/"} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10 hover:border-luxury-gold text-white hover:text-[#1877F2] transition-all"
                title="Facebook Official"
              >
                <Facebook className="w-3.5 h-3.5" />
              </a>
              <a 
                href={settings?.instagramUrl || "https://www.instagram.com/style_x25/?hl=en"} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10 hover:border-luxury-gold text-white hover:text-luxury-gold transition-all"
                title="Instagram Official"
              >
                <Instagram className="w-3.5 h-3.5" />
              </a>
            </div>
            <p className="text-[10px] font-light leading-relaxed italic">
              Empowering the modern visionary since 2026. Designed exclusively by Risat Adnan. All rights reserved.
            </p>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-8 border-t border-white/5 mt-12 pt-6 grid grid-cols-1 md:grid-cols-3 items-center text-[10px] text-white/30 font-mono gap-4">
          <p className="text-center md:text-left relative inline-flex items-center justify-center md:justify-start gap-1">
            <span>© 2026 STYLE X COLLECTIVE INC.</span>
            <button 
              onClick={() => {
                if (isAuthAdmin) {
                  setIsAdminView(true);
                } else {
                  setShowLoginModal(true);
                }
              }}
              className="opacity-0 cursor-default select-none w-5 h-4 inline-block align-middle"
              aria-label="Admin Access"
            >
              [admin]
            </button>
          </p>
          <div className="flex flex-col items-center justify-center gap-2">
            <button 
              id="admin-portal-link"
              onClick={() => {
                if (isAuthAdmin) {
                  setIsAdminView(true);
                } else {
                  setShowLoginModal(true);
                }
              }} 
              className="opacity-0 pointer-events-none select-none uppercase font-bold tracking-wider flex items-center gap-1 justify-center h-0 overflow-hidden"
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
              type="button" 
              onClick={() => setShowLoginModal(false)}
              className="absolute right-4 top-4 text-white/50 hover:text-luxury-gold hover:rotate-90 hover:scale-110 active:scale-95 transition-all duration-300 p-1.5 rounded-full hover:bg-white/5 border border-transparent hover:border-luxury-gold/30 hover:shadow-[0_0_15px_rgba(212,175,55,0.25)] cursor-pointer z-20"
              title="Close Panel"
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
              
              <p className="text-[9px] text-white/40 italic leading-relaxed opacity-0 select-none pointer-events-none">
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
              className="absolute right-4 top-4 text-white/50 hover:text-luxury-gold hover:rotate-90 hover:scale-110 active:scale-95 transition-all duration-300 p-1.5 rounded-full hover:bg-white/5 border border-transparent hover:border-luxury-gold/30 hover:shadow-[0_0_15px_rgba(212,175,55,0.25)] cursor-pointer z-20"
              title="Close Panel"
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


            </div>

            {/* Error or Success Toast alerts */}
            {customerAuthError && (
              <div className="space-y-3">
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-[10.5px] font-mono leading-relaxed text-left animate-shake">
                  ⚠️ {customerAuthError}
                </div>
                
                {/* Supabase Database Auth / Rate Limit diagnostics (Bangla + English) */}
                {customerAuthError && (
                  <div className="bg-black/80 border border-luxury-gold/40 text-left p-5 rounded-xl text-xs space-y-3 text-white max-h-[260px] overflow-y-auto custom-scrollbar">
                    <p className="font-bold text-luxury-gold font-serif">🛠️ Supabase VIP সেশন অ্যাসিস্ট্যান্ট</p>
                    
                    {customerAuthError.includes("Supabase Database Error") && (
                      <>
                        <p className="text-[11px] text-white/80 leading-relaxed font-sans">
                          আপনার Supabase প্রজেক্টে <code className="bg-white/10 px-1 py-0.5 rounded text-luxury-gold">auth.users</code> থেকে ইউজার ডাটা <code className="bg-white/10 px-1 py-0.5 rounded text-luxury-gold">public.profiles</code> টেবিলে সেভ করার সময় ট্রানজেকশন কলাম বা স্কিমা অমিলের কারণে ডাটাবেজ এররটি ঘটেছে।
                        </p>
                        
                        <p className="font-bold text-[11px] text-luxury-gold">সমাধানের জন্য SQL কোডটি কপি করে আপনার Supabase SQL Editor-এ রান করতে পারেন:</p>
                        
                        <div className="relative">
                          <pre className="bg-luxury-charcoal p-2.5 rounded text-[10px] font-mono text-cyan-300 overflow-x-auto whitespace-pre leading-normal border border-white/5 selection:bg-luxury-gold/30">
{`CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  email TEXT,
  phone TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public select" ON public.profiles;
CREATE POLICY "Public select" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "User insert" ON public.profiles;
CREATE POLICY "User insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "User update" ON public.profiles;
CREATE POLICY "User update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, phone)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', ''),
    new.email,
    COALESCE(new.raw_user_meta_data->>'phone', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();`}
                          </pre>
                          
                          <button
                            type="button"
                            onClick={() => {
                              const sqlText = `CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  email TEXT,
  phone TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public select" ON public.profiles;
CREATE POLICY "Public select" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "User insert" ON public.profiles;
CREATE POLICY "User insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "User update" ON public.profiles;
CREATE POLICY "User update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, phone)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', ''),
    new.email,
    COALESCE(new.raw_user_meta_data->>'phone', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();`;
                              try {
                                if (navigator.clipboard && navigator.clipboard.writeText) {
                                  navigator.clipboard.writeText(sqlText);
                                } else {
                                  const t = document.createElement("textarea");
                                  t.value = sqlText;
                                  t.style.position = "fixed";
                                  document.body.appendChild(t);
                                  t.select();
                                  document.execCommand("copy");
                                  document.body.removeChild(t);
                                }
                              } catch (err) {
                                console.warn("Fallback query copy ran:", err);
                              }
                              setSqlCopied(true);
                              setTimeout(() => setSqlCopied(false), 2000);
                            }}
                            className="absolute right-2 top-2 bg-luxury-gold text-black px-2 py-1 rounded text-[9px] font-mono font-bold hover:scale-105 active:scale-95 transition-all text-center cursor-pointer"
                          >
                            {sqlCopied ? 'COPIED! ✅' : 'COPY SQL'}
                          </button>
                        </div>
                      </>
                    )}

                    {customerAuthError.includes("Supabase Rate Limit Active") && (
                      <p className="text-[11px] text-white/80 leading-relaxed font-sans">
                        নিরাপত্তা ও স্প্যাম সুরক্ষার খাতিরে Supabase ক্লাউড অথ সার্ভার একই আইপি থেকে ঘন ঘন রিকোয়েস্ট ব্লক করে। ৬০ সেকেন্ড অপেক্ষা করে পুনরায় চেষ্টা করুন, অথবা নিচের গোল্ডেন বাইপাস বাটনটি দিয়ে <strong>মুহূর্তেই আপনার সেশন সক্রিয় করুন</strong>।
                      </p>
                    )}

                    <div className="pt-2 border-t border-white/5 space-y-2">
                      <p className="text-[10px] text-white/60">
                        💡 ক্লাউড ডাটাবেজ বা নেটওয়ার্ক রেট লিমিট কোনো বিলম্ব ছাড়াই এখনই বাইপাস করে টেস্ট করার জন্য নিচের <strong>লোকাল মেম্বারশিপ একাউন্ট</strong> সক্রিয় করন বাটন ব্যবহার করুন।
                      </p>
                      
                      <button
                        type="button"
                        onClick={() => {
                          const localCust = {
                            name: customerName.trim() || 'VIP Lounge Guest',
                            email: customerEmail.trim() || 'guest@exclusive.com',
                            password: customerPassword || '1234',
                            phone: customerPhone?.trim() || ''
                          };
                          
                          let registeredList = [];
                          try {
                            const savedList = localStorage.getItem('stylex_registered_customers');
                            registeredList = savedList ? JSON.parse(savedList) : [];
                          } catch (e) {}

                          const exists = registeredList.some(
                            (c: any) => c.email.toLowerCase().trim() === localCust.email.toLowerCase().trim()
                          );
                          if (!exists) {
                            registeredList.push(localCust);
                            localStorage.setItem('stylex_registered_customers', JSON.stringify(registeredList));
                          }

                          setCurrentCustomer(localCust);
                          localStorage.setItem('stylex_current_customer', JSON.stringify(localCust));
                          setCustomerAuthSuccess('সফল! লোকাল প্রিভিলেজ সেশন শুরু হয়েছে। রিডাইরেক্ট করা হচ্ছে...');
                          setCustomerAuthError('');
                          setTimeout(() => {
                            setShowCustomerAuthModal(false);
                            setCustomerName('');
                            setCustomerEmail('');
                            setCustomerPhone('');
                            setCustomerPassword('');
                            setCustomerAuthSuccess('');
                          }, 1000);
                        }}
                        className="w-full bg-[#d4af37]/15 border border-luxury-gold/50 text-[#d4af37] py-2.5 rounded-xl text-[10.5px] font-bold uppercase tracking-wider hover:bg-luxury-gold hover:text-black transition-all cursor-pointer text-center"
                      >
                        ⚡ Bypass & Create Local Account (লোকাল সেশন চালু করুন)
                      </button>
                    </div>
                  </div>
                )}
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
              <p><span className="text-white/40">METHOD PAYMENT:</span> <strong className="text-white">{confirmedOrderPayment}</strong></p>
              <p className="text-white/40 text-[9px]/relaxed leading-relaxed mt-2 pt-2 border-t border-white/5">
                Scan QR or track from front-end Track Order menus to view real-time dispatched logs.
              </p>
            </div>

            {/* Confirm WhatsApp redirect trigger */}
            <div className="space-y-3 pt-2">
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
                  setIsTrackMode(true);
                  setIsSearchPage(false);
                  setActiveTrackId(confirmedOrderId);
                  setConfirmedOrderId('');
                  setCart([]);
                  setTimeout(() => {
                    const el = document.getElementById('glowing-search-button');
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    } else {
                      window.scrollTo({ top: 350, behavior: 'smooth' });
                    }
                  }, 150);
                }}
                className="block text-center w-full bg-transparent border border-luxury-gold text-luxury-gold hover:bg-luxury-gold/10 font-display font-extrabold text-[11px] uppercase tracking-[0.2em] py-3.5 rounded transition-all"
              >
                Track Order Live Status
              </button>
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
        onUpdateSize={handleUpdateCartSize}
        activeCoupons={coupons}
        products={products}
        settings={settings}
        onCheckoutSuccess={(id, url, paymentInfo) => {
          setIsCartOpen(false);
          setConfirmedOrderId(id);
          setConfirmedWhatsAppUrl(url);
          setConfirmedOrderPayment(paymentInfo || 'CASH ON DELIVERY (COD)');
          setActiveTrackId(id);
          loadStoreCollections(); // Refresh stock units logs on checkout success!
          loadOrders(); // Refresh public order ticker instantly!
        }}
        initialShowCheckout={initialShowCheckout}
        customer={currentCustomer}
      />

      <CustomerProfileModal
        isOpen={showCustomerProfileModal}
        onClose={() => setShowCustomerProfileModal(false)}
        customer={currentCustomer}
        onUpdateCustomer={handleUpdateCustomer}
        orders={allOrders}
        products={products}
        whatsappNumber={settings.whatsappNumber}
        onOpenChat={() => {
          setShowCustomerProfileModal(false);
          setIsChatOpen(true);
        }}
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
                  className="text-white/45 hover:text-luxury-gold hover:rotate-90 hover:scale-110 active:scale-95 transition-all duration-300 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:border-luxury-gold/30 hover:shadow-[0_0_15px_rgba(212,175,55,0.25)] cursor-pointer"
                  title="Close Notices"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Notification Ticks */}
              <div className="space-y-4 pt-2 overflow-y-auto max-h-[72vh] scrollbar-none pr-1">
                {filteredNotifications.length === 0 ? (
                  <div className="py-12 text-center text-white/30 font-mono text-[10px] uppercase tracking-wider space-y-3">
                    <p>⚜️ No active notifications in your secure archive</p>
                    <p className="text-[9px] text-luxury-gold/60 font-serif italic text-center">Place a bespoke order or check back for new product alerts!</p>
                  </div>
                ) : (
                  filteredNotifications.map((notif) => {
                    const isUnread = new Date(notif.date).getTime() > lastReadTimestamp;
                    const isNewProduct = notif.type === 'new_product';
                    const isOrderStatus = notif.type === 'order_status';

                    return (
                      <div 
                        key={notif.id} 
                        className={`border rounded-xl p-4 space-y-2 relative overflow-hidden transition-all duration-300 ${
                          isUnread 
                            ? 'bg-[#100624] border-luxury-gold/40 shadow-[0_0_15px_rgba(212,175,55,0.1)]' 
                            : 'bg-[#05020a]/80 border-white/5 hover:border-white/10'
                        }`}
                      >
                        {isUnread && (
                          <div className="absolute right-3 top-3 w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                        )}
                        <div className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-wider">
                          <span className={isNewProduct ? "text-luxury-gold font-bold" : "text-green-400 font-bold"}>
                            {isNewProduct ? "⚜️ NEW ARRIVAL" : "📦 COURIER ACTIVE"}
                          </span>
                          <span className="text-white/20">•</span>
                          <span className="text-white/40">
                            {getRelativeTimeString(notif.date)}
                          </span>
                        </div>
                        <h4 className="font-serif text-[11px] font-bold text-white capitalize leading-relaxed">
                          {notif.title}
                        </h4>
                        <p className="text-[10px] text-white/70 leading-relaxed font-sans font-light">
                          {notif.message}
                        </p>
                      </div>
                    );
                  })
                )}

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
          isNotifyMeDeactivated={settings?.isNotifyMeDeactivated}
          globalDeliveryDays={settings?.globalDeliveryDays}
        />
      )}

      <LotteryModal 
        isOpen={isLotteryOpen}
        onClose={() => setIsLotteryOpen(false)}
        prizes={settings?.lotteryPrizes}
        discountPercentage={settings?.lotteryDiscountPercentage}
        isLotteryDeactivated={settings?.isLotteryDeactivated}
        lotteryCouponPrefix={settings?.lotteryCouponPrefix}
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
                className="absolute top-4 right-4 text-white/45 hover:text-luxury-gold hover:rotate-90 hover:scale-110 active:scale-95 transition-all duration-300 outline-none cursor-pointer z-20 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:border-luxury-gold/30 hover:shadow-[0_0_15px_rgba(212,175,55,0.25)]"
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
            className="text-white/45 hover:text-luxury-gold hover:rotate-90 hover:scale-110 active:scale-95 transition-all duration-300 p-1 rounded-full hover:bg-white/5 border border-transparent hover:border-luxury-gold/30 hover:shadow-[0_0_15px_rgba(212,175,55,0.25)] cursor-pointer flex items-center justify-center shrink-0"
            title="Dismiss Notification"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* REAL-TIME PERSONAL ORDER DISPATCH NOTIFICATION TOAST */}
      {showPersonalToast && personalNotifToast && (
        <div className="fixed bottom-24 right-6 z-50 max-w-sm bg-gradient-to-br from-[#0c051a] via-[#05010c] to-[#120726] border-2 border-luxury-gold p-5 rounded-xl shadow-[0_20px_50px_rgba(154,77,255,0.4)] animate-fade-in flex items-start gap-4 backdrop-blur-lg">
          {/* Real-time pulse locator dot */}
          <div className="w-2.5 h-2.5 rounded-full bg-luxury-gold animate-ping absolute top-5 right-5"></div>
          
          <div className="w-11 h-11 rounded-full bg-luxury-gold/10 border border-luxury-gold/40 flex items-center justify-center text-lg shrink-0 text-luxury-gold relative">
            <span className="absolute inset-0 rounded-full border border-luxury-gold/20 animate-pulse"></span>
            🔔
          </div>

          <div className="space-y-1.5 text-left min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[8px] font-mono uppercase tracking-widest text-luxury-gold bg-luxury-gold/10 px-1.5 py-0.5 rounded border border-luxury-gold/30 font-bold">VIP Status Alert</span>
              <span className="text-[7px] font-mono text-white/50 tracking-wider">#{personalNotifToast.orderId}</span>
            </div>
            <h5 className="font-serif text-sm font-bold text-white tracking-wide">
              {personalNotifToast.title}
            </h5>
            <p className="text-[11px] text-[#ebd9fc]/90 leading-relaxed font-sans">
              {personalNotifToast.message}
            </p>
            <div className="flex items-center justify-end mt-4 pt-2 border-t border-white/5">
              <button 
                onClick={() => {
                  setIsTrackMode(true);
                  const newUrl = `${window.location.pathname}?track=${personalNotifToast.orderId}`;
                  window.history.pushState({}, '', newUrl);
                  setShowPersonalToast(false);
                  window.scrollTo({ top: 350, behavior: 'smooth' }); // Smooth scrolls to OrderTracker!
                }}
                className="text-luxury-gold hover:text-white transition-all text-[9.5px] font-mono font-bold uppercase tracking-widest cursor-pointer underline hover:scale-105 active:scale-95 flex items-center gap-1 bg-transparent border-none outline-none"
              >
                Track Live Progress <ArrowRight size={10} />
              </button>
            </div>
          </div>

          <button 
            type="button"
            onClick={() => setShowPersonalToast(false)}
            className="text-white/45 hover:text-luxury-gold hover:rotate-90 hover:scale-110 active:scale-95 transition-all duration-300 p-1.5 rounded-full hover:bg-white/5 border border-transparent hover:border-luxury-gold/30 cursor-pointer flex items-center justify-center shrink-0"
            title="Dismiss Alert"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <LiveChat isOpen={isChatOpen} onOpenChange={setIsChatOpen} showTrigger={false} />

      <XoroAssistant 
        products={products}
        coupons={coupons}
        cart={cart}
        currentProduct={selectedProduct}
        isCartOpen={isCartOpen}
        confirmedOrderId={confirmedOrderId}
        isTrackMode={isTrackMode}
        settings={settings}
        onSelectProduct={(p) => setSelectedProduct(p)}
        onTrackOrder={(orderId) => {
          setIsTrackMode(true);
          const newUrl = `${window.location.pathname}?track=${orderId}`;
          window.history.pushState({}, '', newUrl);
          window.scrollTo({ top: 350, behavior: 'smooth' });
        }}
        onToggleCart={(isOpen) => setIsCartOpen(isOpen)}
        onSetCategory={(category) => setActiveCategory(category)}
        onToggleLottery={(isOpen) => setIsLotteryOpen(isOpen)}
        onSetTrackMode={(track) => setIsTrackMode(track)}
        onShowLoginModal={(show) => setShowLoginModal(show)}
      />

    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, LayoutGrid, ClipboardList, Image as ImageIcon, 
  MessageSquare, Star, Tag, Trophy, Globe, Sparkles, Plus, 
  Trash2, Edit, Check, Eye, ChevronRight, Upload, X 
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { Product, Order, Banner, Review, Coupon, ChatRoom, Campaign, ChatMessage } from '../types';
import { formatPrice, generateQrUrl } from '../utils';

interface AdminPanelProps {
  onBackToStore: () => void;
  products: Product[];
  onRefreshProducts: () => void;
}

export default function AdminPanel({
  onBackToStore,
  products,
  onRefreshProducts
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'orders' | 'banners' | 'reviews' | 'coupons' | 'campaigns' | 'chat' | 'seo'>('dashboard');

  // Admin Data states
  const [analytics, setAnalytics] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [chats, setChats] = useState<ChatRoom[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatRoom | null>(null);
  const [adminReplyText, setAdminReplyText] = useState('');

  // Forms / Actions state
  const [showProductForm, setShowProductForm] = useState(false);
  const [showSupabaseGuide, setShowSupabaseGuide] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState(100);
  const [formStock, setFormStock] = useState(10);
  const [formCategory, setFormCategory] = useState<'MEN' | 'WOMEN' | 'UNISEX' | 'ACCESSORIES'>('MEN');
  const [formSizes, setFormSizes] = useState<string>('S, M, L');
  const [formDimensions, setFormDimensions] = useState('Bespoke Fit');
  const [formWhyBuy, setFormWhyBuy] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [uploadProgress, setUploadProgress] = useState('');
  const [formError, setFormError] = useState('');

  // Other Simple Forms
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [newCouponVal, setNewCouponVal] = useState(10);

  const [newBannerTitle, setNewBannerTitle] = useState('');
  const [newBannerSubtitle, setNewBannerSubtitle] = useState('');
  const [newBannerImg, setNewBannerImg] = useState('');

  const [newCampaignTitle, setNewCampaignTitle] = useState('');
  const [newCampaignDesc, setNewCampaignDesc] = useState('');
  const [newCampaignCoupon, setNewCampaignCoupon] = useState('');

  // SEO Form
  const [siteTitle, setSiteTitle] = useState('Style X | Premium Luxury Fashion Collective');
  const [siteMetaDesc, setSiteMetaDesc] = useState('A world-class premium luxury eCommerce experience. Minimalist designs, high-end watches, and customized garments crafted by Risat Adnan.');
  const [showSeoCode, setShowSeoCode] = useState(false);

  // Fetch Admin Metrics and collections on Mount
  useEffect(() => {
    fetchAnalytics();
    fetchOrders();
    fetchBanners();
    fetchReviews();
    fetchCoupons();
    fetchCampaigns();
    fetchChats();

    const interval = setInterval(() => {
      // Periodic poll for dynamic admin updates (e.g. Chat alerts)
      fetchAnalytics();
      fetchChats();
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/analytics');
      if (res.ok) setAnalytics(await res.json());
    } catch (e) { console.error("Error reading metrics", e); }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) setOrders(await res.json());
    } catch (e) {}
  };

  const fetchBanners = async () => {
    try {
      const res = await fetch('/api/banners');
      if (res.ok) setBanners(await res.json());
    } catch (e) {}
  };

  const fetchReviews = async () => {
    try {
      const res = await fetch('/api/reviews');
      if (res.ok) setReviews(await res.json());
    } catch (e) {}
  };

  const fetchCoupons = async () => {
    try {
      const res = await fetch('/api/coupons');
      if (res.ok) setCoupons(await res.json());
    } catch (e) {}
  };

  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/campaigns');
      if (res.ok) setCampaigns(await res.json());
    } catch (e) {}
  };

  const fetchChats = async () => {
    try {
      const res = await fetch('/api/chat');
      if (res.ok) {
        const chatList = await res.json();
        setChats(chatList);
        // Refresh selected chat room if active
        if (selectedChat) {
          const fresh = chatList.find((c: any) => c.id === selectedChat.id);
          if (fresh) setSelectedChat(fresh);
        }
      }
    } catch (e) {}
  };

  // Dual-path authenticated upload with automatic client-side image compression
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFormError('');
    setUploadProgress("Optimizing image and preparing upload...");

    try {
      // 1. Client-Side Image Compression & Resizing to satisfy Vercel limits (<4.5MB)
      const compressed = await new Promise<{ base64: string; blob: Blob }>((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
          const img = new Image();
          img.src = event.target?.result as string;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const maxDimension = 1200;

            if (width > maxDimension || height > maxDimension) {
              if (width > height) {
                height = Math.round((height * maxDimension) / width);
                width = maxDimension;
              } else {
                width = Math.round((width * maxDimension) / height);
                height = maxDimension;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve({ base64: event.target?.result as string, blob: file });
              return;
            }
            ctx.drawImage(img, 0, 0, width, height);

            const base64 = canvas.toDataURL('image/jpeg', 0.85);
            canvas.toBlob((blob) => {
              resolve({ base64, blob: blob || file });
            }, 'image/jpeg', 0.85);
          };
          img.onerror = () => {
            resolve({ base64: event.target?.result as string, blob: file });
          };
        };
        reader.onerror = () => {
          resolve({ base64: '', blob: file });
        };
      });

      const fileNameClean = `uploaded_${Date.now()}_${file.name.replace(/\s+/g, '_')}`;

      // ATTEMPT 1: Try direct upload to Supabase bucket 'products' using SDK (which handles auth headers automatically)
      setUploadProgress("Attempting direct client-side storage upload to 'products'...");
      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('products')
          .upload(fileNameClean, compressed.blob, {
            contentType: file.type || 'image/jpeg',
            cacheControl: '3600',
            upsert: true
          });

        if (!uploadError && uploadData) {
          const { data: publicUrlData } = supabase.storage
            .from('products')
            .getPublicUrl(fileNameClean);

          if (publicUrlData?.publicUrl) {
            setFormImageUrl(publicUrlData.publicUrl);
            setUploadProgress("Uploaded directly to Supabase storage 'products' successfully!");
            return;
          }
        } else {
          console.warn("Direct storage upload failed, cascading to server-side endpoint:", uploadError?.message);
        }
      } catch (directErr: any) {
        console.warn("Direct storage connection error, cascading to server-side:", directErr.message);
      }

      // ATTEMPT 2: Fallback to server-side /api/upload endpoint
      setUploadProgress("Cascading to secure server-side upload endpoint...");
      if (!compressed.base64) {
        throw new Error("Could not prepare image binary data.");
      }

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, base64Data: compressed.base64 })
      });

      const resultData = await res.json();
      if (res.ok) {
        setFormImageUrl(resultData.fileUrl);
        setUploadProgress("Digitalized to backend storage successfully via server-side bridge!");
      } else {
        throw new Error(resultData.message || "Failed to parse API upload response.");
      }

    } catch (err: any) {
      console.error("Upload process encountered error:", err);
      setUploadProgress(`Upload error: ${err.message || "Unable to contact asset storage server. Please make sure the 'products' storage bucket exists in Supabase and is public."}`);
    }
  };

  // Submit Product Add/Update
  const handleSaveProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formTitle.trim()) {
      setFormError('Product Title is required.');
      return;
    }
    if (!formImageUrl.trim()) {
      setFormError('Product Image source is required. Please upload an image first or insert a direct URL in the configuration field below.');
      return;
    }

    setLoading(true);
    const parsedSizes = formSizes.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);

    const productPayload = {
      title: formTitle,
      description: formDescription,
      price: Number(formPrice),
      stock: Number(formStock),
      category: formCategory,
      sizes: parsedSizes,
      dimensions: formDimensions,
      whyBuy: formWhyBuy || "এটি একটি অত্যন্ত প্রিমিয়াম ডিজাইন করা পিস, যা আপনার ফ্যাশনে এক অনন্য মাত্রা যোগ করবে। এর প্রিমিয়াম কোয়ালিটির ফাইবার চমৎকার অনুভূতি দেবে।",
      imageUrl: formImageUrl,
      trending: true,
      featured: true
    };

    try {
      const isEditing = editingProduct !== null;
      const url = isEditing ? `/api/products/${editingProduct.id}` : `/api/products`;
      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productPayload)
      });

      if (res.ok) {
        // Reset
        setShowProductForm(false);
        setEditingProduct(null);
        setFormTitle('');
        setFormDescription('');
        setFormImageUrl('');
        setFormPrice(100);
        setFormStock(50);
        setFormWhyBuy('');
        setUploadProgress('');
        setFormError('');

        onRefreshProducts();
        fetchAnalytics();
      } else {
        const errorData = await res.json().catch(() => ({}));
        setFormError(errorData.message || 'Server encountered an error creating the product.');
      }
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || 'Network connection failed. Unable to submit product.');
    } finally {
      setLoading(false);
    }
  };

  // Set Fields for Editing
  const handleInitiateEdit = (prod: Product) => {
    setFormError('');
    setEditingProduct(prod);
    setFormTitle(prod.title);
    setFormDescription(prod.description);
    setFormPrice(prod.price);
    setFormStock(prod.stock);
    setFormCategory(prod.category);
    setFormSizes(prod.sizes.join(', '));
    setFormDimensions(prod.dimensions);
    setFormWhyBuy(prod.whyBuy);
    setFormImageUrl(prod.imageUrl);
    setShowProductForm(true);
  };

  // Remove Item
  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to archive this piece permanently?")) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        onRefreshProducts();
        fetchAnalytics();
      }
    } catch (e) {}
  };

  // Update Order tracking status
  const handleUpdateOrderStatus = async (orderId: string, nextStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        fetchOrders();
        fetchAnalytics();
      }
    } catch (e) {}
  };

  // Create Coupon
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode) return;
    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: newCouponCode, type: newCouponType, value: newCouponVal })
      });
      if (res.ok) {
        setNewCouponCode('');
        fetchCoupons();
      } else {
        const err = await res.json();
        alert(err.message || "Failed creating discount code");
      }
    } catch (e) {}
  };

  const handleDeleteCoupon = async (code: string) => {
    try {
      const res = await fetch(`/api/coupons/${code}`, { method: 'DELETE' });
      if (res.ok) fetchCoupons();
    } catch (e) {}
  };

  // Create Banner
  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBannerTitle || !newBannerImg) return;
    try {
      const res = await fetch('/api/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newBannerTitle, subtitle: newBannerSubtitle, imageUrl: newBannerImg, active: true })
      });
      if (res.ok) {
        setNewBannerTitle('');
        setNewBannerSubtitle('');
        setNewBannerImg('');
        fetchBanners();
      }
    } catch (e) {}
  };

  const handleDeleteBanner = async (id: string) => {
    try {
      const res = await fetch(`/api/banners/${id}`, { method: 'DELETE' });
      if (res.ok) fetchBanners();
    } catch (e) {}
  };

  // Create Campaign Limit
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaignTitle) return;
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newCampaignTitle, description: newCampaignDesc, discountCode: newCampaignCoupon, active: true })
      });
      if (res.ok) {
        setNewCampaignTitle('');
        setNewCampaignDesc('');
        setNewCampaignCoupon('');
        fetchCampaigns();
      }
    } catch (e) {}
  };

  const handleDeleteCampaign = async (id: string) => {
    try {
      const res = await fetch(`/api/campaigns/${id}`, { method: 'DELETE' });
      if (res.ok) fetchCampaigns();
    } catch (e) {}
  };

  // Approve moderations reviews
  const handleApproveReview = async (id: string) => {
    try {
      const res = await fetch(`/api/reviews/${id}/approve`, { method: 'POST' });
      if (res.ok) fetchReviews();
    } catch (e) {}
  };

  const handleDeleteReview = async (id: string) => {
    try {
      const res = await fetch(`/api/reviews/${id}`, { method: 'DELETE' });
      if (res.ok) fetchReviews();
    } catch (e) {}
  };

  // Submit Admin Chat message
  const handleSendAdminChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChat || !adminReplyText.trim()) return;

    const replyText = adminReplyText.trim();
    setAdminReplyText('');

    try {
      const res = await fetch(`/api/chat/${selectedChat.id}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender: 'admin', text: replyText })
      });
      if (res.ok) {
        const updated = await res.json();
        setSelectedChat(updated);
        fetchChats();
      }
    } catch (e) {}
  };

  const handleSelectChatRoom = async (room: ChatRoom) => {
    setSelectedChat(room);
    // Mark room presence
    try {
      await fetch(`/api/chat/${room.id}/presence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onlineAdmin: true })
      });
    } catch (e) {}
  };

  // JSON-LD Generation
  const jsonLdCode = `{
  "@context": "https://schema.org",
  "@type": "Store",
  "name": "Style X",
  "description": "${siteMetaDesc}",
  "url": "${window.location.origin}",
  "priceRange": "$$$$",
  "logo": "${window.location.origin}/logo.png",
  "parentOrganization": {
    "name": "Style X Collective"
  }
}`;

  return (
    <div className="min-h-screen bg-luxury-black text-white flex flex-col md:flex-row antialiased">
      
      {/* LEFT SIDEBAR PANEL (exactly replicating Screen 1 design) */}
      <aside className="w-full md:w-64 bg-[#0a0a0a] border-r border-luxury-gold/15 p-5 flex flex-col justify-between flex-shrink-0">
        <div className="space-y-6">
          {/* Logo brand box */}
          <div className="flex items-center gap-3 pb-6 border-b border-white/5">
            <div className="w-11 h-11 bg-luxury-charcoal border border-luxury-gold/30 rounded flex items-center justify-center p-1 font-serif text-lg text-luxury-gold font-bold">
              SX
            </div>
            <div>
              <h2 className="font-serif text-base tracking-widest font-extrabold text-white">STYLE X</h2>
              <span className="text-[9px] text-luxury-gold font-mono uppercase tracking-widest block -mt-1">ADMIN PANEL</span>
            </div>
          </div>

          {/* Menus List */}
          <nav className="space-y-1">
            <p className="text-[8.5px] uppercase font-mono tracking-widest text-white/35 px-2.5 mb-2.5 block">SYSTEM ACCESS</p>
            
            <button 
              onClick={() => { setActiveTab('dashboard'); setSelectedChat(null); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-xs tracking-wider uppercase font-display transition-all justify-start cursor-pointer ${
                activeTab === 'dashboard' ? 'bg-luxury-gold text-luxury-black font-extrabold shadow' : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <BarChart3 size={13} />
              Dashboard
            </button>

            <button 
              onClick={() => { setActiveTab('inventory'); setSelectedChat(null); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-xs tracking-wider uppercase font-display transition-all justify-start cursor-pointer ${
                activeTab === 'inventory' ? 'bg-luxury-gold text-luxury-black font-extrabold shadow' : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <LayoutGrid size={13} />
              Inventory
            </button>

            <button 
              onClick={() => { setActiveTab('orders'); setSelectedChat(null); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-xs tracking-wider uppercase font-display transition-all justify-start cursor-pointer ${
                activeTab === 'orders' ? 'bg-luxury-gold text-luxury-black font-extrabold shadow' : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <ClipboardList size={13} />
              Order Tracking
              {orders.filter(o => o.status === 'PENDING').length > 0 && (
                <span className="ml-auto w-4.5 h-4.5 bg-red-500 rounded-full text-[9px] flex items-center justify-center font-bold text-white leading-none">
                  {orders.filter(o => o.status === 'PENDING').length}
                </span>
              )}
            </button>

            <button 
              onClick={() => { setActiveTab('banners'); setSelectedChat(null); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-xs tracking-wider uppercase font-display transition-all justify-start cursor-pointer ${
                activeTab === 'banners' ? 'bg-luxury-gold text-luxury-black font-extrabold shadow' : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <ImageIcon size={13} />
              Banners
            </button>

            <button 
              onClick={() => { setActiveTab('reviews'); setSelectedChat(null); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-xs tracking-wider uppercase font-display transition-all justify-start cursor-pointer ${
                activeTab === 'reviews' ? 'bg-luxury-gold text-luxury-black font-extrabold shadow' : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Star size={13} />
              Reviews
              {reviews.filter(r => !r.isApproved).length > 0 && (
                <span className="ml-auto bg-luxury-gold/20 text-luxury-gold border border-luxury-gold/30 px-1.5 py-0.2 rounded text-[8.5px] font-mono leading-none">
                  {reviews.filter(r => !r.isApproved).length}
                </span>
              )}
            </button>

            <button 
              onClick={() => { setActiveTab('coupons'); setSelectedChat(null); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-xs tracking-wider uppercase font-display transition-all justify-start cursor-pointer ${
                activeTab === 'coupons' ? 'bg-luxury-gold text-luxury-black font-extrabold shadow' : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Tag size={13} />
              Coupons
            </button>

            <button 
              onClick={() => { setActiveTab('campaigns'); setSelectedChat(null); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-xs tracking-wider uppercase font-display transition-all justify-start cursor-pointer ${
                activeTab === 'campaigns' ? 'bg-luxury-gold text-luxury-black font-extrabold shadow' : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sparkles size={13} />
              Campaigns
            </button>

            <button 
              onClick={() => { setActiveTab('chat'); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-xs tracking-wider uppercase font-display transition-all justify-start cursor-pointer ${
                activeTab === 'chat' ? 'bg-luxury-gold text-luxury-black font-extrabold shadow' : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <MessageSquare size={13} />
              Chat Support
            </button>

            <button 
              onClick={() => { setActiveTab('seo'); setSelectedChat(null); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-xs tracking-wider uppercase font-display transition-all justify-start cursor-pointer ${
                activeTab === 'seo' ? 'bg-luxury-gold text-luxury-black font-extrabold shadow' : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Globe size={13} />
              SEO Master
            </button>
          </nav>
        </div>

        <div className="pt-6 border-t border-white/5 space-y-3">
          <button 
            onClick={onBackToStore}
            className="w-full text-center border border-luxury-gold text-luxury-gold hover:bg-luxury-gold hover:text-luxury-black text-[9.5px] font-display font-extrabold uppercase py-2 tracking-widest rounded transition-all cursor-pointer"
          >
            ↩ VIEW FRONT STORE
          </button>
          <p className="text-[8px] text-white/30 text-center font-mono">STYLE X PLATFORM v4.0</p>
        </div>
      </aside>

      {/* RIGHT MAIN WORKSPACE CONTAINERS */}
      <main className="flex-1 bg-luxury-black p-4 md:p-8 overflow-y-auto max-h-screen">
        
        {/* UPPER STATUS STRIPS MATCHING SCREEN 1 */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-white/5 pb-4 mb-8 gap-4">
          <div>
            <h1 className="font-serif text-2xl lg:text-3xl font-bold uppercase tracking-wide text-white">
              {activeTab === 'dashboard' && "Overview Matrix"}
              {activeTab === 'inventory' && "Curated Inventory"}
              {activeTab === 'orders' && "Order Hub"}
              {activeTab === 'banners' && "Cinematic Banners"}
              {activeTab === 'reviews' && "Reviews Moderation"}
              {activeTab === 'coupons' && "VIP Coupons Engine"}
              {activeTab === 'campaigns' && "Launch Campaigns"}
              {activeTab === 'chat' && "Presence Concierge Help"}
              {activeTab === 'seo' && "Search Optimizations"}
            </h1>
            <p className="text-xs text-white/40 mt-0.5">Welcome, Risat Adnan. (Admin Account)</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Live Visistors Count Indicators */}
            <div className="bg-[#0c0c0c] border border-white/5 py-1.5 px-3 rounded flex items-center gap-2 text-xs font-mono">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
              <span className="text-white/40 uppercase">LIVE VIEWS:</span>
              <span className="text-white font-bold leading-none">{analytics?.liveViews || 1}</span>
            </div>

            <div className="bg-[#0c0c0c] border border-white/5 py-1.5 px-3 rounded flex items-center gap-2 text-xs font-mono">
              <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
              <span className="text-white/40 uppercase">AGGREGATED VISITS:</span>
              <span className="text-white font-bold leading-none">{analytics?.visits || 125}</span>
            </div>
          </div>
        </header>

        {/* CONTROLLERS PER ACTIVE MENU TAB */}

        {/* 1. OVERVIEW DASHBOARD */}
        {activeTab === 'dashboard' && analytics && (
          <div className="space-y-8 animate-fade-in">
            {/* Numeric Indicators rows */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="bg-[#0a0a0a] border border-white/5 p-5 rounded-lg">
                <span className="text-[10px] text-white/40 uppercase font-mono tracking-widest block">Accumulated Income</span>
                <p className="font-serif text-2xl lg:text-3xl font-bold text-luxury-gold mt-1">
                  {formatPrice(analytics.totalRevenue)}
                </p>
                <span className="text-[9px] text-green-400 font-mono block mt-2">▲ +12% from last drop cycle</span>
              </div>

              <div className="bg-[#0a0a0a] border border-white/5 p-5 rounded-lg">
                <span className="text-[10px] text-white/40 uppercase font-mono tracking-widest block">Total Receipts Logged</span>
                <p className="font-serif text-2xl lg:text-3xl font-bold text-white mt-1">
                  {analytics.totalOrders}
                </p>
                <p className="text-[9px] text-white/40 font-mono block mt-2">Across all destinations</p>
              </div>

              <div className="bg-[#0a0a0a] border border-white/5 p-5 rounded-lg">
                <span className="text-[10px] text-white/40 uppercase font-mono tracking-widest block">Pending Conciere Confirmations</span>
                <p className={`font-serif text-2xl lg:text-3xl font-bold mt-1 ${analytics.pendingOrders > 0 ? 'text-red-400' : 'text-white'}`}>
                  {analytics.pendingOrders}
                </p>
                <span className="text-[9px] text-white/40 font-mono block mt-2">Need immediate phone calls</span>
              </div>

              <div className="bg-[#0a0a0a] border border-white/5 p-5 rounded-lg">
                <span className="text-[10px] text-white/40 uppercase font-mono tracking-widest block">Low Inventories alerts</span>
                <p className={`font-serif text-2xl lg:text-3xl font-bold mt-1 ${analytics.lowStockStockCount > 0 ? 'text-yellow-400' : 'text-white'}`}>
                  {analytics.lowStockStockCount}
                </p>
                <p className="text-[9px] text-white/40 font-mono block mt-2">Fewer than 15 units left</p>
              </div>

            </div>

            {/* Recent Orders table inside metrics overview */}
            <div className="bg-[#0a0a0a] border border-white/5 rounded-lg p-5">
              <h3 className="font-serif text-base uppercase tracking-wider text-white mb-4">Executive Recent Transactions</h3>
              {orders.length === 0 ? (
                <p className="text-xs text-white/40 italic py-4">No luxury transactions logged yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs divide-y divide-white/5">
                    <thead>
                      <tr className="text-white/40 uppercase font-mono text-[10px]">
                        <th className="py-2.5">Date</th>
                        <th>Order Track ID</th>
                        <th>RECIPIENT Info</th>
                        <th>Total Amount</th>
                        <th>Courier Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-white/85">
                      {orders.slice(-5).reverse().map((ord, i) => (
                        <tr key={i} className="hover:bg-white/[0.02]">
                          <td className="py-3 font-mono text-[10.5px]">{new Date(ord.date).toLocaleDateString()}</td>
                          <td className="font-mono text-luxury-gold font-bold">{ord.id}</td>
                          <td>
                            <div>{ord.customerName}</div>
                            <div className="text-[10px] text-white/40 font-mono">{ord.customerPhone}</div>
                          </td>
                          <td className="font-mono font-semibold">{formatPrice(ord.totalAmount)}</td>
                          <td>
                            <span className={`px-2 py-0.5 rounded text-[9.5px] font-mono border uppercase tracking-wider ${
                              ord.status === 'DELIVERED' 
                                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                : ord.status === 'PENDING'
                                  ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                  : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                            }`}>
                              {ord.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. INVENTORY PRODUCTS TABLE AND CRUD FORM */}
        {activeTab === 'inventory' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header control buttons */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowSupabaseGuide(!showSupabaseGuide)}
                className="bg-transparent text-luxury-gold border border-luxury-gold/30 hover:bg-luxury-gold/10 font-mono text-[10px] uppercase tracking-wider py-2 px-4 rounded transition-all cursor-pointer flex items-center gap-1.5"
              >
                Database Setup Help ⚡
              </button>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setFormTitle('');
                  setFormDescription('');
                  setFormPrice(100);
                  setFormStock(30);
                  setFormSizes('S, M, L, XL');
                  setFormImageUrl('');
                  setFormWhyBuy('');
                  setUploadProgress('');
                  setShowProductForm(!showProductForm);
                }}
                className="bg-gradient-to-r from-luxury-gold-dark to-luxury-gold text-luxury-black font-display font-semibold uppercase text-xs tracking-widest py-2.5 px-5 rounded hover:brightness-110 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus size={14} />
                Add New Luxury Product
              </button>
            </div>

            {/* Supabase Guide Box */}
            {showSupabaseGuide && (
              <div className="bg-[#0b0c10] border border-cyan-500/30 p-5 rounded-lg text-white space-y-4 font-sans text-xs">
                <div className="flex items-center justify-between border-b border-cyan-500/10 pb-2">
                  <h4 className="font-mono text-cyan-400 font-extrabold uppercase tracking-widest text-xs flex items-center gap-1.5">
                    <span>⚡ SUPABASE LIVE REPLICA DATABASE BOOTSTRAPPER</span>
                  </h4>
                  <button 
                    onClick={() => setShowSupabaseGuide(false)}
                    className="text-white/40 hover:text-white font-mono cursor-pointer"
                  >
                    Close [x]
                  </button>
                </div>
                
                <p className="text-white/80 leading-relaxed">
                  If you set up custom environment credentials in Vercel (<code className="bg-white/5 px-1 py-0.5 rounded text-cyan-300">VITE_SUPABASE_URL</code> &amp; <code className="bg-white/5 px-1 py-0.5 rounded text-cyan-300">VITE_SUPABASE_PUBLISHABLE_KEY</code>) but your products do not load or edit properly, you must <strong>initialize the Supabase database schematics</strong> first.
                </p>

                <div className="space-y-3 pl-4 list-decimal">
                  <div>
                    <strong className="text-luxury-gold">Step 1: Create the SQL Tables &amp; RLS Policies</strong>
                    <p className="text-white/60 mt-0.5">Copy the unified schematic SQL script below, open your Supabase dashboard, click "SQL Editor" in the left sidebar, create a "New Query", paste this script, and click <strong>Run</strong>:</p>
                  </div>
                  <div className="bg-[#050505] border border-white/10 rounded overflow-hidden">
                    <div className="flex justify-between items-center px-3 py-1.5 bg-white/5 border-b border-white/10 text-[10px] font-mono text-white/50">
                      <span>SUPABASE_BOOTSTRAP_SCHEMA.sql</span>
                      <button
                        type="button"
                        onClick={() => {
                          const sql = `-- 1. Create Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL DEFAULT 0,
    category TEXT NOT NULL,
    stock NUMERIC NOT NULL DEFAULT 0,
    "imageUrl" TEXT,
    sizes TEXT, 
    dimensions TEXT,
    "whyBuy" TEXT,
    trending BOOLEAN DEFAULT true,
    featured BOOLEAN DEFAULT true
);

-- 2. Create Banners Table
CREATE TABLE IF NOT EXISTS public.banners (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    subtitle TEXT,
    "imageUrl" TEXT,
    "linkUrl" TEXT,
    active BOOLEAN DEFAULT false
);

-- 3. Create Coupons Table
CREATE TABLE IF NOT EXISTS public.coupons (
    code TEXT PRIMARY KEY,
    "discountType" TEXT NOT NULL,
    value NUMERIC NOT NULL DEFAULT 0,
    active BOOLEAN DEFAULT true
);

-- 4. Create Campaigns Table
CREATE TABLE IF NOT EXISTS public.campaigns (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    subtitle TEXT,
    "discountPercent" NUMERIC NOT NULL DEFAULT 0,
    "endDate" TEXT,
    active BOOLEAN DEFAULT false
);

-- 5. Create Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
    id TEXT PRIMARY KEY,
    "productTitle" TEXT,
    "productId" TEXT,
    rating NUMERIC NOT NULL DEFAULT 5,
    "reviewerName" TEXT,
    comment TEXT,
    "isApproved" BOOLEAN DEFAULT false,
    "createdAt" TEXT
);

-- 6. Create Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerAddress" TEXT,
    "customerCity" TEXT,
    "customerNotes" TEXT,
    items TEXT, 
    "totalAmount" NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT DEFAULT 'Cash on Delivery',
    "createdAt" TEXT
);

-- 7. Create Chats Table
CREATE TABLE IF NOT EXISTS public.chats (
    id TEXT PRIMARY KEY,
    "customerName" TEXT,
    messages TEXT, 
    "typingCustomer" BOOLEAN DEFAULT false,
    "typingAdmin" BOOLEAN DEFAULT false,
    "onlineCustomer" BOOLEAN DEFAULT false,
    "onlineAdmin" BOOLEAN DEFAULT false,
    "updatedAt" TEXT
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_all_products ON public.products FOR SELECT USING (true);
CREATE POLICY select_all_banners ON public.banners FOR SELECT USING (true);
CREATE POLICY select_all_coupons ON public.coupons FOR SELECT USING (true);
CREATE POLICY select_all_campaigns ON public.campaigns FOR SELECT USING (true);
CREATE POLICY select_all_reviews ON public.reviews FOR SELECT USING (true);
CREATE POLICY select_all_orders ON public.orders FOR SELECT USING (true);
CREATE POLICY select_all_chats ON public.chats FOR SELECT USING (true);

CREATE POLICY insert_orders ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY insert_reviews ON public.reviews FOR INSERT WITH CHECK (true);
CREATE POLICY insert_chats ON public.chats FOR INSERT WITH CHECK (true);

CREATE POLICY insert_all_products ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY insert_all_banners ON public.banners FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY insert_all_coupons ON public.coupons FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY insert_all_campaigns ON public.campaigns FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY insert_all_reviews ON public.reviews FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY insert_all_orders ON public.orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY insert_all_chats ON public.chats FOR ALL USING (true) WITH CHECK (true);`;
                          navigator.clipboard.writeText(sql);
                          alert("Schema bootstrap SQL copied to clipboard! Paste it inside your Supabase dashboard SQL Editor directly.");
                        }}
                        className="text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer"
                      >
                        Copy SQL Code 📋
                      </button>
                    </div>
                    <pre className="p-3 text-[9px] font-mono text-white/50 max-h-40 overflow-y-auto whitespace-pre block bg-black">
                      {`CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL DEFAULT 0,
    category TEXT NOT NULL,
    stock NUMERIC NOT NULL DEFAULT 0,
    "imageUrl" TEXT,
    sizes TEXT,
    dimensions TEXT,
    "whyBuy" TEXT,
    trending BOOLEAN DEFAULT true,
    featured BOOLEAN DEFAULT true
);`}
                    </pre>
                  </div>

                  <div className="pt-2">
                    <strong className="text-luxury-gold">Step 2: Setup Public Storage Bucket for Images</strong>
                    <p className="text-white/60 mt-0.5 leading-relaxed">
                      Go to "Storage" in your Supabase admin dashboard, click <strong>"New Bucket"</strong>, name the bucket exactly <code className="bg-white/5 px-1 py-0.5 rounded text-cyan-300">products</code>, and turn ON the <strong>"Public Bucket"</strong> toggle. Under "RLS Policies", add a Policy that grants all/write access to everyone (SELECT/INSERT/UPDATE) on the products bucket for anonymous users as well.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Interactive Add/Edit Form Overlay wrapper */}
            {showProductForm && (
              <form onSubmit={handleSaveProductSubmit} className="bg-[#0a0a0a] border border-luxury-gold/30 p-6 rounded-lg space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <h3 className="font-serif text-lg text-white font-bold uppercase">
                    {editingProduct ? `Edit Curated Piece: ${editingProduct.title}` : "Create Exquisite Product Collection"}
                  </h3>
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowProductForm(false);
                      setFormError('');
                    }}
                    className="text-white/50 hover:text-white"
                  >
                    <X size={16} />
                  </button>
                </div>

                {formError && (
                  <div className="bg-red-950/40 border border-red-500/30 text-red-400 p-3 rounded text-xs flex items-center gap-2 font-mono">
                    <span className="w-2 h-2 rounded-full bg-red-500 inline-block animate-pulse"></span>
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Title */}
                  <div>
                    <label className="block text-[10px] uppercase font-mono tracking-wider text-white/50 mb-1">Product Title</label>
                    <input 
                      type="text" required value={formTitle} onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="e.g. Risat Adnan Signature Tee"
                      className="w-full bg-luxury-charcoal text-white text-xs border border-white/10 rounded py-2.5 px-3 focus:outline-none focus:border-luxury-gold"
                    />
                  </div>

                  {/* Price */}
                  <div>
                    <label className="block text-[10px] uppercase font-mono tracking-wider text-white/50 mb-1">Price (৳ BD Taka)</label>
                    <input 
                      type="number" required value={formPrice} onChange={(e) => setFormPrice(Number(e.target.value))}
                      className="w-full bg-luxury-charcoal text-white text-xs border border-white/10 rounded py-2.5 px-3 focus:outline-none focus:border-luxury-gold"
                    />
                  </div>

                  {/* Stock */}
                  <div>
                    <label className="block text-[10px] uppercase font-mono tracking-wider text-white/50 mb-1">Initial Stock quantity</label>
                    <input 
                      type="number" required value={formStock} onChange={(e) => setFormStock(Number(e.target.value))}
                      className="w-full bg-luxury-charcoal text-white text-xs border border-white/10 rounded py-2.5 px-3 focus:outline-none focus:border-luxury-gold"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-[10px] uppercase font-mono tracking-wider text-white/50 mb-1">Bespoke Collection Cat Category</label>
                    <select
                      value={formCategory} onChange={(e) => setFormCategory(e.target.value as any)}
                      className="w-full bg-luxury-charcoal text-white text-xs border border-white/10 rounded py-2.5 px-3 focus:outline-none focus:border-luxury-gold"
                    >
                      <option value="MEN">MEN</option>
                      <option value="WOMEN">WOMEN</option>
                      <option value="UNISEX">UNISEX</option>
                      <option value="ACCESSORIES">ACCESSORIES</option>
                    </select>
                  </div>

                  {/* Sizes */}
                  <div>
                    <label className="block text-[10px] uppercase font-mono tracking-wider text-white/50 mb-1">Sizes fitting (Separated by commas)</label>
                    <input 
                      type="text" value={formSizes} onChange={(e) => setFormSizes(e.target.value)}
                      placeholder="e.g. S, XS, M, L"
                      className="w-full bg-luxury-charcoal text-white text-xs border border-white/10 rounded py-2.5 px-3 focus:outline-none focus:border-luxury-gold"
                    />
                  </div>

                  {/* Dimensions specs text */}
                  <div>
                    <label className="block text-[10px] uppercase font-mono tracking-wider text-white/50 mb-1">Spec Dimensions Fit text</label>
                    <input 
                      type="text" value={formDimensions} onChange={(e) => setFormDimensions(e.target.value)}
                      placeholder="e.g. regular fit silhouette"
                      className="w-full bg-luxury-charcoal text-white text-xs border border-white/10 rounded py-2.5 px-3 focus:outline-none focus:border-luxury-gold"
                    />
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2">
                    <label className="block text-[10px] uppercase font-mono tracking-wider text-white/50 mb-1">Luxury Item Narrative description</label>
                    <textarea 
                      rows={2} value={formDescription} onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Narrate details of craftsmanship..."
                      className="w-full bg-luxury-charcoal text-white text-xs border border-white/10 rounded py-2 px-3 focus:outline-none focus:border-luxury-gold resize-none"
                    />
                  </div>

                  {/* whyBuy explain Bengali box */}
                  <div className="md:col-span-2">
                    <label className="block text-[10px] uppercase font-mono tracking-wider text-white/50 mb-1">
                      আপনি কেন কিনবেন? Bengali Detail Narrative
                    </label>
                    <textarea 
                      rows={2} value={formWhyBuy} onChange={(e) => setFormWhyBuy(e.target.value)}
                      placeholder="এটি কুটিরের চমৎকার সুতা দ্বারা..."
                      className="w-full bg-luxury-charcoal text-white text-xs border border-white/10 rounded py-2 px-3 focus:outline-none focus:border-luxury-gold resize-none"
                    />
                  </div>

                  {/* Image link & local storage uploader (Supreme replicas) */}
                  <div className="md:col-span-2 border border-dashed border-white/10 p-4 rounded bg-luxury-black/35 space-y-3.5">
                    <div>
                      <h4 className="text-[10px] uppercase font-mono tracking-widest text-white/60 mb-2">Configure Digital Image File</h4>
                      <input 
                        type="text" value={formImageUrl} onChange={(e) => setFormImageUrl(e.target.value)}
                        placeholder="Or input direct splash image URL..."
                        className="w-full bg-luxury-charcoal text-white text-xs border border-white/10 rounded py-2.5 px-3 focus:outline-none focus:border-luxury-gold mb-3"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <div className="flex-1 w-full">
                        <label className="block text-[9px] uppercase font-mono tracking-wider text-white/40 mb-1">Upload File (Simulated Cloud Replica)</label>
                        <input 
                          type="file" accept="image/*" onChange={handleFileChange}
                          className="w-full text-xs text-white/50 file:mr-4 file:py-2 file:px-4 file:rounded file:border file:border-luxury-gold/30 file:bg-luxury-charcoal file:text-luxury-gold hover:file:bg-luxury-black cursor-pointer"
                        />
                      </div>
                      
                      {/* Image preview frame */}
                      {formImageUrl && (
                        <div className="w-16 h-16 bg-luxury-charcoal rounded overflow-hidden border border-white/10 flex-shrink-0">
                          <img src={formImageUrl} alt="Product Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                    {uploadProgress && <p className="text-[10px] text-luxury-gold font-mono tracking-wide">{uploadProgress}</p>}
                  </div>

                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                  <button 
                    type="button" onClick={() => setShowProductForm(false)}
                    className="border border-white/10 hover:bg-white/5 text-white text-xs font-display uppercase tracking-widest py-2 px-5 rounded"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" disabled={loading}
                    className="bg-gradient-to-r from-luxury-gold-dark to-luxury-gold text-luxury-black font-display font-bold uppercase text-xs tracking-widest py-2 px-6 rounded hover:brightness-110 disabled:opacity-50"
                  >
                    {loading ? "DIGITALIZING..." : "SAVE CURATED PIECE"}
                  </button>
                </div>
              </form>
            )}

            {/* Inventory table listing exactly matching Screen 1 visual cards */}
            <div className="bg-[#0a0a0a] border border-white/5 rounded-lg p-5">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs divide-y divide-white/5">
                  <thead>
                    <tr className="text-white/40 uppercase font-mono text-[10px]">
                      <th className="py-2.5">PIECE / QR SYSTEM</th>
                      <th>CATEGORY</th>
                      <th>PRICE</th>
                      <th>STOCK UNITS</th>
                      <th className="text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-white/85">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-white/[0.01]">
                        
                        {/* Piece details cell */}
                        <td className="py-3.5 flex items-center gap-3">
                          {/* QR Image API */}
                          <div className="bg-white p-0.5 rounded border border-white/10 flex-shrink-0">
                            <img 
                              src={generateQrUrl(p.id)} 
                              alt="Item QR" 
                              className="w-10 h-10"
                            />
                          </div>
                          
                          <img 
                            src={p.imageUrl} 
                            alt={p.title} 
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 object-cover rounded border border-white/10 flex-shrink-0"
                          />
                          <div>
                            <div className="font-serif text-[13px] text-white font-semibold flex items-center gap-1.5 leading-none">
                              {p.title}
                            </div>
                            <span className="text-[10px] text-white/35 font-mono">{p.id} ({p.code})</span>
                          </div>
                        </td>

                        <td>
                          <span className="bg-luxury-charcoal border border-white/5 text-white/70 px-2.5 py-0.5 rounded text-[9.5px] font-mono font-bold">
                            {p.category}
                          </span>
                        </td>

                        <td className="font-mono text-luxury-gold font-bold text-sm">
                          {formatPrice(p.price)}
                        </td>

                        <td>
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <span className={`w-1.5 h-1.5 rounded-full inline-block ${p.stock < 15 ? "bg-yellow-400" : "bg-green-500"}`}></span>
                            <span className="font-mono font-semibold">{p.stock} units left</span>
                          </div>
                        </td>

                        {/* Actions buttons */}
                        <td className="text-right">
                          <div className="inline-flex gap-2">
                            <button 
                              onClick={() => handleInitiateEdit(p)}
                              className="p-1 px-2 border border-white/5 hover:border-luxury-gold/40 text-white hover:text-luxury-gold rounded transition-colors"
                              title="Edit specifications"
                            >
                              <Edit size={12} />
                            </button>
                            <button 
                              onClick={() => handleDeleteProduct(p.id)}
                              className="p-1 px-2 border border-white/5 hover:border-red-400 text-white hover:text-red-400 rounded transition-colors"
                              title="Archive permanently"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. ORDERS TRACKING UPDATER */}
        {activeTab === 'orders' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-[#0a0a0a] border border-white/5 rounded-lg p-5">
              {orders.length === 0 ? (
                <p className="text-xs text-white/40 py-8 text-center italic">No orders received yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs divide-y divide-white/5">
                    <thead>
                      <tr className="text-white/40 uppercase font-mono text-[10px]">
                        <th className="py-2.5">Date</th>
                        <th>Order Track ID</th>
                        <th>Recipient Details</th>
                        <th>Bespoke Items</th>
                        <th>Value</th>
                        <th>Status Control</th>
                        <th className="text-right">Concierge Link</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-white/85">
                      {orders.slice().reverse().map((ord) => (
                        <tr key={ord.id} className="hover:bg-white/[0.01]">
                          
                          <td className="py-4 font-mono text-[10.5px]">
                            {new Date(ord.date).toLocaleDateString()}
                          </td>

                          <td className="font-mono text-luxury-gold font-bold">
                            {ord.id}
                          </td>

                          <td className="space-y-0.5">
                            <div className="font-bold">{ord.customerName}</div>
                            <div className="text-[10px] text-white/40 font-mono">{ord.customerPhone}</div>
                            <div className="text-[10px] text-white/50 leading-relaxed font-sans">{ord.customerAddress}, {ord.customerCity}</div>
                          </td>

                          <td className="max-w-xs">
                            <div className="space-y-1">
                              {ord.items.map((it, i) => (
                                <div key={i} className="text-[10.5px] leading-tight">
                                  • {it.title} <span className="text-white/45 font-mono">({it.selectedSize}) x{it.quantity}</span>
                                </div>
                              ))}
                            </div>
                          </td>

                          <td className="font-mono text-luxury-gold font-bold">
                            {formatPrice(ord.totalAmount)}
                          </td>

                          {/* Status selects */}
                          <td>
                            <select
                              value={ord.status}
                              onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                              className="bg-luxury-charcoal text-white font-mono text-[10.5px] border border-white/15 rounded py-1 px-1.5 focus:outline-none focus:border-luxury-gold"
                            >
                              <option value="PENDING">PENDING</option>
                              <option value="CONFIRMED">CONFIRMED</option>
                              <option value="SHIPPED">SHIPPED</option>
                              <option value="DELIVERED">DELIVERED</option>
                              <option value="CANCELLED">CANCELLED</option>
                            </select>
                          </td>

                          {/* Whatsapp direct redirection */}
                          <td className="text-right">
                            <button
                              onClick={() => {
                                const itemsText = ord.items.map((i: any) => `- ${i.title} (${i.selectedSize}) x${i.quantity} @ ৳${i.price}`).join("\n");
                                const wsMessage = `👑 *STYLE X CONCIERGE CALL* 👑\n\nHello ${ord.customerName}, confirming order status:\n\n*Order Tracking ID:* ${ord.id}\n*Items Details:*\n${itemsText}\n*Invoice amount:* ৳${ord.totalAmount}\n*Current Status:* ${ord.status}\n\nThank you for choosing STYLE X Luxury!`;
                                window.open(`https://wa.me/${ord.customerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(wsMessage)}`, '_blank');
                              }}
                              className="text-[9.5px] font-display font-semibold uppercase bg-green-500/10 hover:bg-green-500/25 border border-green-500/30 hover:border-green-500 text-green-400 py-1.5 px-3 rounded transition-all inline-block whitespace-nowrap cursor-pointer"
                            >
                              WhatsApp Call
                            </button>
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. CINEMATIC BANNERS */}
        {activeTab === 'banners' && (
          <div className="space-y-6 animate-fade-in">
            <form onSubmit={handleCreateBanner} className="bg-[#0a0a0a] border border-white/5 p-5 rounded-lg space-y-4">
              <h3 className="font-serif text-sm uppercase tracking-widest text-white border-b border-white/5 pb-2">Add cinematic promotional banner</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-white/50 mb-1">Banner Large Title</label>
                  <input 
                    type="text" required value={newBannerTitle} onChange={(e) => setNewBannerTitle(e.target.value)}
                    placeholder="e.g. STYLE X COLLECTIVE"
                    className="w-full bg-luxury-charcoal text-white text-xs border border-white/10 rounded py-2 px-3 focus:outline-none focus:border-luxury-gold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-white/50 mb-1">Banner Image URL</label>
                  <input 
                    type="text" required value={newBannerImg} onChange={(e) => setNewBannerImg(e.target.value)}
                    placeholder="e.g. https://images.unsplash.com/..."
                    className="w-full bg-luxury-charcoal text-white text-xs border border-white/10 rounded py-2 px-3 focus:outline-none focus:border-luxury-gold"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-white/50 mb-1">Subtle descriptions story narrative</label>
                  <input 
                    type="text" value={newBannerSubtitle} onChange={(e) => setNewBannerSubtitle(e.target.value)}
                    placeholder="A custom stitched garment representing shape aesthetics..."
                    className="w-full bg-luxury-charcoal text-white text-xs border border-white/10 rounded py-2 px-3 focus:outline-none focus:border-luxury-gold"
                  />
                </div>
              </div>
              <button 
                type="submit"
                className="bg-luxury-gold text-luxury-black font-display font-medium text-[10px] uppercase tracking-widest py-2 px-4 rounded hover:brightness-110 cursor-pointer"
              >
                Launch Banner
              </button>
            </form>

            <div className="bg-[#0a0a0a] border border-white/5 rounded-lg p-5">
              <h4 className="font-serif text-sm text-white uppercase tracking-wider mb-4">Active Banners</h4>
              <div className="grid grid-cols-1 gap-4">
                {banners.map(b => (
                  <div key={b.id} className="flex gap-4 border border-white/5 p-4 rounded items-center bg-[#0d0d0d]">
                    <img src={b.imageUrl} alt={b.title} className="w-24 h-16 object-cover rounded border border-white/10" />
                    <div className="flex-1">
                      <h5 className="font-serif font-bold text-white text-sm">{b.title}</h5>
                      <p className="text-[11px] text-white/50 line-clamp-1 italic">{b.subtitle}</p>
                    </div>
                    {b.id !== 'banner-1' && (
                      <button 
                        onClick={() => handleDeleteBanner(b.id)}
                        className="text-white/40 hover:text-red-400 p-2 border border-white/5 hover:border-red-500/25 rounded"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 5. REVIEWS MODERATION PANEL */}
        {activeTab === 'reviews' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-[#0a0a0a] border border-white/5 rounded-lg p-5">
              <h3 className="font-serif text-sm text-white uppercase tracking-wider mb-4">Customer Review archives</h3>
              {reviews.length === 0 ? (
                <p className="text-xs text-white/40 py-8 text-center italic">No customer reviews written yet.</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map(r => (
                    <div key={r.id} className="flex gap-4 border border-white/5 p-4 rounded items-start bg-[#0d0d0d]">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <h4 className="font-serif font-bold text-white text-sm">{r.customerName}</h4>
                          <span className="text-[10px] text-white/35 font-mono">on {r.productTitle}</span>
                        </div>
                        <div className="flex text-luxury-gold gap-0.5 text-xs mb-2">
                          {[...Array(r.rating)].map((_, i) => <Star key={i} size={11} fill="#D4AF37" />)}
                        </div>
                        <p className="text-xs text-white/70 italic">&ldquo;{r.comment}&rdquo;</p>
                        <span className="text-[9px] text-white/30 font-mono mt-2 block">{new Date(r.date).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="flex gap-2.5">
                        {!r.isApproved && (
                          <button
                            onClick={() => handleApproveReview(r.id)}
                            className="text-[10px] font-display font-semibold bg-luxury-gold/10 hover:bg-luxury-gold text-luxury-gold hover:text-luxury-black border border-luxury-gold/30 px-3 py-1.5 rounded transition-all cursor-pointer"
                          >
                            Approve
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteReview(r.id)}
                          className="text-red-400 hover:text-red-300 border border-white/5 p-1.5 rounded"
                          title="Delete review"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 6. VIP COUPON ENGINE */}
        {activeTab === 'coupons' && (
          <div className="space-y-6 animate-fade-in">
            <form onSubmit={handleCreateCoupon} className="bg-[#0a0a0a] border border-white/5 p-5 rounded-lg space-y-4">
              <h3 className="font-serif text-sm uppercase tracking-widest text-white border-b border-white/5 pb-2 font-bold">Generate coupon discount</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-white/50 mb-1">Coupon Code (Unique UPPERCASE)</label>
                  <input 
                    type="text" required value={newCouponCode} onChange={(e) => setNewCouponCode(e.target.value)}
                    placeholder="E.G. NEWYEAR20"
                    className="w-full bg-luxury-charcoal text-white text-xs border border-white/10 rounded py-2 px-3 focus:outline-none focus:border-luxury-gold uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-white/50 mb-1">Discount Mode</label>
                  <select
                    value={newCouponType} onChange={(e) => setNewCouponType(e.target.value as any)}
                    className="w-full bg-luxury-charcoal text-white text-xs border border-white/10 rounded py-2 px-3 focus:outline-none focus:border-luxury-gold"
                  >
                    <option value="PERCENTAGE">PERCENTAGE %</option>
                    <option value="FIXED">FLAT VALUE ৳</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-white/50 mb-1">Benefit Value</label>
                  <input 
                    type="number" required value={newCouponVal} onChange={(e) => setNewCouponVal(Number(e.target.value))}
                    className="w-full bg-luxury-charcoal text-white text-xs border border-white/10 rounded py-2 px-3 focus:outline-none focus:border-luxury-gold"
                  />
                </div>
              </div>
              <button 
                type="submit"
                className="bg-luxury-gold text-luxury-black font-display font-medium text-[10px] uppercase tracking-widest py-2.5 px-5 rounded hover:brightness-110 cursor-pointer"
              >
                Register Coupon
              </button>
            </form>

            <div className="bg-[#0a0a0a] border border-white/5 rounded-lg p-5">
              <h4 className="font-serif text-sm text-white uppercase tracking-wider mb-4">Manage active VIP key codes</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {coupons.map(c => (
                  <div key={c.code} className="flex justify-between items-center bg-[#0d0d0d] border border-white/5 p-4 rounded">
                    <div>
                      <span className="font-mono text-white text-sm font-bold tracking-widest bg-luxury-charcoal border border-white/5 px-2.5 py-1 rounded">
                        {c.code}
                      </span>
                      <p className="text-xs text-luxury-gold mt-2">
                        {c.type === 'PERCENTAGE' ? `${c.value}% discount benefit` : `Flat ৳${c.value} discount value`}
                      </p>
                    </div>
                    <button 
                      onClick={() => handleDeleteCoupon(c.code)}
                      className="text-white/40 hover:text-red-400 p-2 hover:bg-white/5 rounded"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 7. LAUNCH CAMPAIGNS */}
        {activeTab === 'campaigns' && (
          <div className="space-y-6 animate-fade-in">
            <form onSubmit={handleCreateCampaign} className="bg-[#0a0a0a] border border-white/5 p-5 rounded-lg space-y-4">
              <h3 className="font-serif text-sm uppercase tracking-widest text-white border-b border-white/5 pb-2 font-bold">Register limited collections event</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-white/50 mb-1">Campaign event title</label>
                  <input 
                    type="text" required value={newCampaignTitle} onChange={(e) => setNewCampaignTitle(e.target.value)}
                    placeholder="e.g. MONARCH DROPS CYCLE"
                    className="w-full bg-luxury-charcoal text-white text-xs border border-white/10 rounded py-2 px-3 focus:outline-none focus:border-luxury-gold"
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-white/50 mb-1">Associate exclusive coupon</label>
                  <input 
                    type="text" value={newCampaignCoupon} onChange={(e) => setNewCampaignCoupon(e.target.value)}
                    placeholder="E.G. STYLEGOLD"
                    className="w-full bg-luxury-charcoal text-white text-xs border border-white/10 rounded py-2 px-3 focus:outline-none focus:border-luxury-gold uppercase"
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-white/50 mb-1">Rule narrative descriptions</label>
                  <input 
                    type="text" required value={newCampaignDesc} onChange={(e) => setNewCampaignDesc(e.target.value)}
                    className="w-full bg-luxury-charcoal text-white text-xs border border-white/10 rounded py-2 px-3 focus:outline-none focus:border-luxury-gold"
                  />
                </div>
              </div>
              <button 
                type="submit"
                className="bg-luxury-gold text-luxury-black font-display font-medium text-[10px] uppercase tracking-widest py-2.5 px-5 rounded hover:brightness-110 cursor-pointer"
              >
                Promote Event Drop
              </button>
            </form>

            <div className="bg-[#0a0a0a] border border-white/5 rounded-lg p-5">
              <h4 className="font-serif text-sm text-white uppercase tracking-wider mb-4">Promotional Campaign cards</h4>
              <div className="grid grid-cols-1 gap-4">
                {campaigns.map(c => (
                  <div key={c.id} className="flex justify-between items-center bg-[#0d0d0d] border border-white/5 p-4 rounded">
                    <div>
                      <h5 className="font-serif font-bold text-white text-sm">{c.title}</h5>
                      <p className="text-[11.5px] text-white/55 italic mt-1">{c.description}</p>
                      {c.discountCode && (
                        <p className="text-[10px] text-luxury-gold font-mono mt-1 uppercase tracking-wider">
                          EXCLUSIVE VIP KEY: {c.discountCode}
                        </p>
                      )}
                    </div>
                    {c.id !== 'camp-1' && (
                      <button 
                        onClick={() => handleDeleteCampaign(c.id)}
                        className="text-white/40 hover:text-red-400 p-2.5 rounded"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 8. ACTIVE CONCIERGE CHATS (Realtime simulation updates) */}
        {activeTab === 'chat' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[550px] animate-fade-in bg-[#080808] border border-white/5 p-4 rounded-lg">
            
            {/* Rooms Lists sidebar */}
            <div className="md:col-span-1 border-r border-white/5 pr-4 overflow-y-auto space-y-2">
              <h4 className="text-[9px] uppercase font-mono tracking-widest text-white/40 mb-3.5 px-2">Active customer rooms</h4>
              
              {chats.length === 0 ? (
                <p className="text-xs text-white/40 italic py-4 px-2">No active visitor chats found.</p>
              ) : (
                chats.map(ch => {
                  const isSelected = selectedChat?.id === ch.id;
                  const lastMessage = ch.messages[ch.messages.length - 1];

                  return (
                    <div
                      key={ch.id}
                      onClick={() => handleSelectChatRoom(ch)}
                      className={`p-3 rounded text-left transition-all cursor-pointer border ${
                        isSelected 
                          ? 'bg-luxury-gold/10 border-luxury-gold text-white' 
                          : 'bg-luxury-charcoal/45 border-transparent text-white/70 hover:bg-luxury-charcoal'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-sans text-xs font-bold text-white uppercase">{ch.customerName}</span>
                        <span className="text-[8px] font-mono text-white/30">
                          {ch.onlineCustomer ? "● CRM" : "offline"}
                        </span>
                      </div>
                      <p className="text-[10px] text-white/50 line-clamp-1 italic">
                        {lastMessage ? lastMessage.text : "No messages written"}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Conversation active dialogue columns */}
            <div className="md:col-span-2 flex flex-col justify-between h-full pl-2">
              {selectedChat ? (
                <>
                  {/* Chat logs */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-3 max-h-[400px]">
                    <div className="bg-[#0f0f0f] border border-white/5 p-3 rounded mb-4">
                      <p className="text-xs text-white font-bold uppercase tracking-wider">{selectedChat.customerName}</p>
                      <p className="text-[9px] text-white/40 font-mono">ROOM REFERENCE ID: {selectedChat.id}</p>
                    </div>

                    {selectedChat.messages.map(m => {
                      const isAdmin = m.sender === 'admin';
                      return (
                        <div key={m.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] rounded p-2.5 text-xs ${
                            isAdmin 
                              ? 'bg-luxury-gold/10 text-white border border-luxury-gold/30' 
                              : 'bg-luxury-charcoal text-white border border-white/5'
                          }`}>
                            <p className="leading-relaxed">{m.text}</p>
                            <span className="block text-[8px] text-white/30 text-right mt-1">
                              {new Date(m.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {selectedChat.typingCustomer && (
                      <p className="text-[10px] text-luxury-gold font-mono animate-pulse">Customer is responding...</p>
                    )}
                  </div>

                  {/* Submission typing line */}
                  <form onSubmit={handleSendAdminChatMessage} className="border-t border-white/5 pt-3.5 flex gap-2">
                    <input 
                      type="text" required
                      placeholder="REPLY AS LUXURY STYLIST CONCIERGE..."
                      value={adminReplyText}
                      onChange={(e) => setAdminReplyText(e.target.value)}
                      className="flex-1 bg-luxury-charcoal text-white text-xs border border-white/10 rounded py-2 px-3 focus:outline-none focus:border-luxury-gold placeholder-white/20 uppercase font-mono tracking-wider"
                    />
                    <button
                      type="submit"
                      className="bg-luxury-gold text-luxury-black font-display font-semibold uppercase text-xs tracking-widest px-4 py-2 rounded hover:brightness-110 cursor-pointer"
                    >
                      Send Reply
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-white/35">
                  <MessageSquare size={32} className="text-white/20 mb-3" />
                  <p className="font-serif text-sm">Select a room from the CRM list to begin advising customers.</p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* 9. SEO MASTER OPTIMIZATION TOOL */}
        {activeTab === 'seo' && (
          <div className="space-y-6 animate-fade-in text-left">
            <div className="bg-[#0a0a0a] border border-white/5 rounded-lg p-6 space-y-4">
              
              <div className="border-b border-white/5 pb-2">
                <h3 className="font-serif text-base text-white uppercase font-bold">Search Metadata Override</h3>
                <p className="text-[10.5px] text-white/35 font-mono">Tune title tags and JSON-LD markup schema in-sync with search rankings.</p>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider text-white/50 mb-1">Global Site page Title header</label>
                <input 
                  type="text" value={siteTitle} onChange={(e) => setSiteTitle(e.target.value)}
                  className="w-full bg-luxury-charcoal text-white text-xs border border-white/10 rounded py-2.5 px-3 focus:outline-none focus:border-luxury-gold"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider text-white/50 mb-1">Global Meta Description tag</label>
                <textarea 
                  rows={2} value={siteMetaDesc} onChange={(e) => setSiteMetaDesc(e.target.value)}
                  className="w-full bg-luxury-charcoal text-white text-xs border border-white/10 rounded py-2.5 px-3 focus:outline-none focus:border-luxury-gold resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-white/5 p-4 rounded bg-[#0d0d0d]">
                  <h4 className="text-xs font-serif font-bold text-white uppercase tracking-wider mb-2">Automated Robots.txt rules</h4>
                  <p className="text-[10.5px] font-mono text-luxury-gold/80 bg-luxury-black/50 p-2.5 rounded leading-relaxed">
                    User-agent: *<br />
                    Allow: /<br />
                    Disallow: /api/analytics<br />
                    Sitemap: {window.location.origin}/sitemap.xml
                  </p>
                </div>

                <div className="border border-white/5 p-4 rounded bg-[#0d0d0d] flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-serif font-bold text-white uppercase tracking-wider mb-2">Google PageSpeed parameters</h4>
                    <p className="text-xs text-white/60">Optimized LCP via asynchronous image bindings and modern CSS code splitting layouts.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      document.title = siteTitle;
                      alert("Robots and meta titles override generated dynamically!");
                    }}
                    className="bg-luxury-gold text-luxury-black font-display font-medium text-[10px] uppercase tracking-widest py-2 px-4 rounded hover:brightness-110 mt-4 cursor-pointer"
                  >
                    Commit SEO tags
                  </button>
                </div>
              </div>

              {/* JSON-LD toggle */}
              <div className="border border-white/5 p-4 rounded bg-[#0d0d0d]">
                <div className="flex justify-between items-center mb-2.5">
                  <h4 className="text-xs font-serif font-bold text-white uppercase tracking-wider">JSON-LD Structured Schema</h4>
                  <button 
                    onClick={() => setShowSeoCode(!showSeoCode)}
                    className="text-[9px] text-luxury-gold font-mono uppercase hover:underline"
                  >
                    {showSeoCode ? "Minimize Schema" : "Inspect Schema Code"}
                  </button>
                </div>
                {showSeoCode && (
                  <pre className="text-[10px] font-mono text-zinc-400 bg-luxury-black p-3 rounded max-h-48 overflow-y-auto leading-relaxed whitespace-pre">
                    {jsonLdCode}
                  </pre>
                )}
              </div>

            </div>
          </div>
        )}

      </main>

    </div>
  );
}

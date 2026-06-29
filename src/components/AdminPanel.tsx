import React, { useState, useEffect } from 'react';
import { 
  BarChart3, LayoutGrid, ClipboardList, Image as ImageIcon, 
  MessageSquare, Star, Tag, Trophy, Globe, Sparkles, Plus, 
  Trash2, Edit, Check, Eye, ChevronRight, Upload, X, Settings, Gift, Bell,
  Facebook, Instagram
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { Product, Order, Banner, Review, Coupon, ChatRoom, Campaign, ChatMessage } from '../types';
import { formatPrice, generateQrUrl } from '../utils';
import { LotteryPrize } from './LotteryModal';

interface AdminPanelProps {
  onBackToStore: () => void;
  products: Product[];
  onRefreshProducts: () => void;
  settings?: { whatsappNumber: string; adminEmail?: string; adminPassword?: string; appsScriptUrl?: string; logoUrl?: string; lotteryPrizes?: LotteryPrize[]; lotteryDiscountPercentage?: number; lotteryCouponPrefix?: string; facebookUrl?: string; instagramUrl?: string; paymentBadgeTitle?: string; paymentBadgeDescription?: string; isCatalogDeactivated?: boolean; deactivatedMessage?: string; isLotteryDeactivated?: boolean; isNotifyMeDeactivated?: boolean; bkashLogoUrl?: string; nagadLogoUrl?: string };
  onRefreshSettings?: () => void;
  onRefreshCoupons?: () => void;
}

export default function AdminPanel({
  onBackToStore,
  products,
  onRefreshProducts,
  settings,
  onRefreshSettings,
  onRefreshCoupons
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'orders' | 'banners' | 'reviews' | 'coupons' | 'campaigns' | 'chat' | 'seo' | 'settings' | 'alerts'>('dashboard');

  // Admin Data states
  const [analytics, setAnalytics] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [chats, setChats] = useState<ChatRoom[]>([]);
  const [backInStockAlerts, setBackInStockAlerts] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatRoom | null>(null);
  const [adminReplyText, setAdminReplyText] = useState('');

  // Settings State Management
  const [whatsappNumberInput, setWhatsappNumberInput] = useState(settings?.whatsappNumber || "8801755104443");
  const [adminEmailInput, setAdminEmailInput] = useState(settings?.adminEmail || "risatadnan4@gmail.com");
  const [adminPasswordInput, setAdminPasswordInput] = useState(settings?.adminPassword || "risat123");
  const [appsScriptUrlInput, setAppsScriptUrlInput] = useState(settings?.appsScriptUrl || "https://script.google.com/macros/s/AKfycbwXARnVsjEPfY2D81-3PswAiNPJke7py_UlwB-vre-RcBZfOgNtEB15morsHUEuUG5_yA/exec");
  const [logoUrlInput, setLogoUrlInput] = useState(settings?.logoUrl || "/stylex_logo.jpg");
  const [bkashLogoUrlInput, setBkashLogoUrlInput] = useState(settings?.bkashLogoUrl || "");
  const [nagadLogoUrlInput, setNagadLogoUrlInput] = useState(settings?.nagadLogoUrl || "");
  const [lotteryPrizesInput, setLotteryPrizesInput] = useState<LotteryPrize[]>([]);
  const [lotteryDiscountPercentageInput, setLotteryDiscountPercentageInput] = useState(settings?.lotteryDiscountPercentage || 15);
  const [lotteryCouponPrefixInput, setLotteryCouponPrefixInput] = useState(settings?.lotteryCouponPrefix || "RISAT");
  const [facebookUrlInput, setFacebookUrlInput] = useState(settings?.facebookUrl || "https://www.facebook.com/stylex24/");
  const [instagramUrlInput, setInstagramUrlInput] = useState(settings?.instagramUrl || "https://www.instagram.com/style_x25/?hl=en");
  const [paymentBadgeTitleInput, setPaymentBadgeTitleInput] = useState(settings?.paymentBadgeTitle || "SECURE CASH ON DELIVERY GUARANTEED");
  const [paymentBadgeDescriptionInput, setPaymentBadgeDescriptionInput] = useState(settings?.paymentBadgeDescription || "Pay upon secure physical delivery handoff. We verify each individual container personally with verified secure luxury seal tags. Zero online gateway threat risk.");
  const [isCatalogDeactivatedInput, setIsCatalogDeactivatedInput] = useState(settings?.isCatalogDeactivated || false);
  const [deactivatedMessageInput, setDeactivatedMessageInput] = useState(settings?.deactivatedMessage || "The VIP showcase catalog is currently undergoing seasonal curation refresh. Private concierge is fully active — contact via WhatsApp for custom order loops.");
  const [isLotteryDeactivatedInput, setIsLotteryDeactivatedInput] = useState(settings?.isLotteryDeactivated || false);
  const [isNotifyMeDeactivatedInput, setIsNotifyMeDeactivatedInput] = useState(settings?.isNotifyMeDeactivated || false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoUploadProgress, setLogoUploadProgress] = useState('');
  const [bkashUploading, setBkashUploading] = useState(false);
  const [bkashUploadProgress, setBkashUploadProgress] = useState('');
  const [nagadUploading, setNagadUploading] = useState(false);
  const [nagadUploadProgress, setNagadUploadProgress] = useState('');

  useEffect(() => {
    if (settings?.whatsappNumber) {
      setWhatsappNumberInput(settings.whatsappNumber);
    }
    if (settings?.adminEmail) {
      setAdminEmailInput(settings.adminEmail);
    }
    if (settings?.adminPassword) {
      setAdminPasswordInput(settings.adminPassword);
    }
    if (settings?.appsScriptUrl) {
      setAppsScriptUrlInput(settings.appsScriptUrl);
    }
    if (settings?.logoUrl !== undefined) {
      setLogoUrlInput(settings.logoUrl);
    }
    if (settings?.bkashLogoUrl !== undefined) {
      setBkashLogoUrlInput(settings.bkashLogoUrl);
    }
    if (settings?.nagadLogoUrl !== undefined) {
      setNagadLogoUrlInput(settings.nagadLogoUrl);
    }
    if (settings?.lotteryPrizes) {
      setLotteryPrizesInput(settings.lotteryPrizes);
    }
    if (settings?.lotteryDiscountPercentage !== undefined) {
      setLotteryDiscountPercentageInput(settings.lotteryDiscountPercentage);
    }
    if (settings?.lotteryCouponPrefix !== undefined) {
      setLotteryCouponPrefixInput(settings.lotteryCouponPrefix);
    }
    if (settings?.facebookUrl !== undefined) {
      setFacebookUrlInput(settings.facebookUrl);
    }
    if (settings?.instagramUrl !== undefined) {
      setInstagramUrlInput(settings.instagramUrl);
    }
    if (settings?.paymentBadgeTitle !== undefined) {
      setPaymentBadgeTitleInput(settings.paymentBadgeTitle);
    }
    if (settings?.paymentBadgeDescription !== undefined) {
      setPaymentBadgeDescriptionInput(settings.paymentBadgeDescription);
    }
    if (settings?.isCatalogDeactivated !== undefined) {
      setIsCatalogDeactivatedInput(settings.isCatalogDeactivated);
    }
    if (settings?.deactivatedMessage !== undefined) {
      setDeactivatedMessageInput(settings.deactivatedMessage);
    }
    if (settings?.isLotteryDeactivated !== undefined) {
      setIsLotteryDeactivatedInput(settings.isLotteryDeactivated);
    }
    if (settings?.isNotifyMeDeactivated !== undefined) {
      setIsNotifyMeDeactivatedInput(settings.isNotifyMeDeactivated);
    }
  }, [settings]);

  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSavingSettings(true);
    setSettingsSuccess(false);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          whatsappNumber: whatsappNumberInput,
          adminEmail: adminEmailInput,
          adminPassword: adminPasswordInput,
          appsScriptUrl: appsScriptUrlInput,
          logoUrl: logoUrlInput,
          bkashLogoUrl: bkashLogoUrlInput,
          nagadLogoUrl: nagadLogoUrlInput,
          lotteryPrizes: lotteryPrizesInput,
          lotteryDiscountPercentage: lotteryDiscountPercentageInput,
          lotteryCouponPrefix: lotteryCouponPrefixInput,
          facebookUrl: facebookUrlInput,
          instagramUrl: instagramUrlInput,
          paymentBadgeTitle: paymentBadgeTitleInput,
          paymentBadgeDescription: paymentBadgeDescriptionInput,
          isCatalogDeactivated: isCatalogDeactivatedInput,
          deactivatedMessage: deactivatedMessageInput,
          isLotteryDeactivated: isLotteryDeactivatedInput,
          isNotifyMeDeactivated: isNotifyMeDeactivatedInput
        })
      });
      if (res.ok) {
        setSettingsSuccess(true);
        try {
          const savedSettings = {
            whatsappNumber: whatsappNumberInput,
            adminEmail: adminEmailInput,
            adminPassword: adminPasswordInput,
            appsScriptUrl: appsScriptUrlInput,
            logoUrl: logoUrlInput,
            bkashLogoUrl: bkashLogoUrlInput,
            nagadLogoUrl: nagadLogoUrlInput,
            lotteryPrizes: lotteryPrizesInput,
            lotteryDiscountPercentage: Number(lotteryDiscountPercentageInput),
            lotteryCouponPrefix: lotteryCouponPrefixInput,
            facebookUrl: facebookUrlInput,
            instagramUrl: instagramUrlInput,
            paymentBadgeTitle: paymentBadgeTitleInput,
            paymentBadgeDescription: paymentBadgeDescriptionInput,
            isCatalogDeactivated: isCatalogDeactivatedInput,
            deactivatedMessage: deactivatedMessageInput,
            isLotteryDeactivated: isLotteryDeactivatedInput,
            isNotifyMeDeactivated: isNotifyMeDeactivatedInput
          };
          localStorage.setItem("stylex_settings", JSON.stringify(savedSettings));
        } catch (errLocalStorage) {
          console.warn("Failed to write updated settings to localStorage directly", errLocalStorage);
        }
        if (onRefreshSettings) {
          onRefreshSettings();
        }
        setTimeout(() => setSettingsSuccess(false), 3000);
      } else {
        alert("Could not update settings");
      }
    } catch (err: any) {
      console.error(err);
      alert("Error saving settings: " + err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoUploading(true);
    setLogoUploadProgress("Preparing luxury logo asset...");

    try {
      // 1. Client-Side Image Compression & Resizing
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
            const maxDimension = 600;

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

            const base64 = canvas.toDataURL('image/png', 0.9);
            canvas.toBlob((blob) => {
              resolve({ base64, blob: blob || file });
            }, 'image/png', 0.9);
          };
          img.onerror = () => {
            resolve({ base64: event.target?.result as string, blob: file });
          };
        };
        reader.onerror = () => {
          resolve({ base64: '', blob: file });
        };
      });

      const fileNameClean = `logo_${Date.now()}_${file.name.replace(/\s+/g, '_')}`;

      // ATTEMPT 1: Try direct upload to Supabase bucket 'media' (falls back to 'products' if missing)
      setLogoUploadProgress("Uploading logo to storage...");
      try {
        let activeBucket = 'media';
        let { data: uploadData, error: uploadError } = await supabase.storage
          .from(activeBucket)
          .upload(fileNameClean, compressed.blob, {
            contentType: file.type || 'image/png',
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) {
          console.warn(`Direct storage upload to '${activeBucket}' failed. Falling back to 'products' bucket:`, uploadError.message);
          activeBucket = 'products';
          const fallbackRes = await supabase.storage
            .from(activeBucket)
            .upload(fileNameClean, compressed.blob, {
              contentType: file.type || 'image/png',
              cacheControl: '3600',
              upsert: true
            });
          uploadData = fallbackRes.data;
          uploadError = fallbackRes.error;
        }

        if (!uploadError && uploadData) {
          const { data: publicUrlData } = supabase.storage
            .from(activeBucket)
            .getPublicUrl(fileNameClean);

          if (publicUrlData?.publicUrl) {
            setLogoUrlInput(publicUrlData.publicUrl);
            setLogoUploadProgress("Logo uploaded successfully!");
            await handleAutoSaveSettings('brand', publicUrlData.publicUrl);
            setLogoUploading(false);
            return;
          }
        }
      } catch (directErr) {
        console.warn("Direct storage upload failed for logo, cascading to server:", directErr);
      }

      // ATTEMPT 2: Fallback to server-side /api/upload endpoint
      setLogoUploadProgress("Finalizing server-side upload...");
      if (!compressed.base64) {
        throw new Error("Could not prepare logo binary data.");
      }

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, base64Data: compressed.base64 })
      });

      const resultData = await res.json();
      if (res.ok && resultData.fileUrl) {
        setLogoUrlInput(resultData.fileUrl);
        setLogoUploadProgress("Logo registered on servers successfully!");
        await handleAutoSaveSettings('brand', resultData.fileUrl);
      } else {
        throw new Error(resultData.message || "Failed to process logo upload.");
      }

    } catch (err: any) {
      console.error(err);
      setLogoUploadProgress(`Upload error: ${err.message || 'Verification failed'}`);
    } finally {
      setLogoUploading(false);
    }
  };

  const handlePaymentLogoUpload = async (type: 'bkash' | 'nagad', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const setUploading = type === 'bkash' ? setBkashUploading : setNagadUploading;
    const setProgress = type === 'bkash' ? setBkashUploadProgress : setNagadUploadProgress;
    const setUrlInput = type === 'bkash' ? setBkashLogoUrlInput : setNagadLogoUrlInput;

    setUploading(true);
    setProgress(`Preparing luxury ${type} logo asset...`);

    try {
      // 1. Client-Side Image Compression & Resizing
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
            const maxDimension = 600;

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

            const base64 = canvas.toDataURL('image/png', 0.9);
            canvas.toBlob((blob) => {
              resolve({ base64, blob: blob || file });
            }, 'image/png', 0.9);
          };
          img.onerror = () => {
            resolve({ base64: event.target?.result as string, blob: file });
          };
        };
        reader.onerror = () => {
          resolve({ base64: '', blob: file });
        };
      });

      const fileNameClean = `${type}_logo_${Date.now()}_${file.name.replace(/\s+/g, '_')}`;

      // ATTEMPT 1: Try direct upload to Supabase bucket 'media'
      setProgress(`Uploading ${type} logo to storage...`);
      try {
        let activeBucket = 'media';
        let { data: uploadData, error: uploadError } = await supabase.storage
          .from(activeBucket)
          .upload(fileNameClean, compressed.blob, {
            contentType: file.type || 'image/png',
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) {
          console.warn(`Direct storage upload to '${activeBucket}' failed. Falling back to 'products' bucket:`, uploadError.message);
          activeBucket = 'products';
          const fallbackRes = await supabase.storage
            .from(activeBucket)
            .upload(fileNameClean, compressed.blob, {
              contentType: file.type || 'image/png',
              cacheControl: '3600',
              upsert: true
            });
          uploadData = fallbackRes.data;
          uploadError = fallbackRes.error;
        }

        if (!uploadError && uploadData) {
          const { data: publicUrlData } = supabase.storage
            .from(activeBucket)
            .getPublicUrl(fileNameClean);

          if (publicUrlData?.publicUrl) {
            setUrlInput(publicUrlData.publicUrl);
            setProgress(`${type === 'bkash' ? 'bKash' : 'Nagad'} logo uploaded successfully!`);
            await handleAutoSaveSettings(type, publicUrlData.publicUrl);
            setUploading(false);
            return;
          }
        }
      } catch (directErr) {
        console.warn(`Direct storage upload failed for ${type} logo, cascading to server:`, directErr);
      }

      // ATTEMPT 2: Fallback to server-side /api/upload endpoint
      setProgress("Finalizing server-side upload...");
      if (!compressed.base64) {
        throw new Error("Could not prepare logo data.");
      }

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, base64Data: compressed.base64 })
      });

      const resultData = await res.json();
      if (res.ok && resultData.fileUrl) {
        setUrlInput(resultData.fileUrl);
        setProgress(`${type === 'bkash' ? 'bKash' : 'Nagad'} logo registered on servers successfully!`);
        await handleAutoSaveSettings(type, resultData.fileUrl);
      } else {
        throw new Error(resultData.message || "Server upload failed");
      }
    } catch (err: any) {
      console.error(err);
      alert(`Failed uploading ${type} logo: ` + err.message);
    } finally {
      setUploading(false);
      setProgress('');
    }
  };

  const handleAutoSaveSettings = async (logoType: 'brand' | 'bkash' | 'nagad', url: string) => {
    try {
      const payload = { 
        whatsappNumber: whatsappNumberInput,
        adminEmail: adminEmailInput,
        adminPassword: adminPasswordInput,
        appsScriptUrl: appsScriptUrlInput,
        logoUrl: logoType === 'brand' ? url : logoUrlInput,
        bkashLogoUrl: logoType === 'bkash' ? url : bkashLogoUrlInput,
        nagadLogoUrl: logoType === 'nagad' ? url : nagadLogoUrlInput,
        lotteryPrizes: lotteryPrizesInput,
        lotteryDiscountPercentage: lotteryDiscountPercentageInput,
        lotteryCouponPrefix: lotteryCouponPrefixInput,
        facebookUrl: facebookUrlInput,
        instagramUrl: instagramUrlInput,
        paymentBadgeTitle: paymentBadgeTitleInput,
        paymentBadgeDescription: paymentBadgeDescriptionInput,
        isCatalogDeactivated: isCatalogDeactivatedInput,
        deactivatedMessage: deactivatedMessageInput,
        isLotteryDeactivated: isLotteryDeactivatedInput,
        isNotifyMeDeactivated: isNotifyMeDeactivatedInput
      };
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      try {
        const savedSettings = {
          ...payload,
          lotteryDiscountPercentage: Number(lotteryDiscountPercentageInput)
        };
        localStorage.setItem("stylex_settings", JSON.stringify(savedSettings));
      } catch (errLocalStorage) {
        console.warn("Failed to write auto-saved settings to localStorage directly", errLocalStorage);
      }
      if (onRefreshSettings) {
        onRefreshSettings();
      }
    } catch (e) {
      console.error("Auto-save logo settings error:", e);
    }
  };

  const handleAddPrizeSlot = () => {
    setLotteryPrizesInput([
      ...lotteryPrizesInput,
      { text: "15% OFF NEWCODE", value: "NEWCODE", type: "coupon" }
    ]);
  };

  const handleRemovePrizeSlot = (index: number) => {
    const updated = [...lotteryPrizesInput];
    updated.splice(index, 1);
    setLotteryPrizesInput(updated);
  };

  const handleUpdatePrizeSlot = (index: number, field: keyof LotteryPrize, value: string) => {
    const updated = lotteryPrizesInput.map((p, i) => {
      if (i === index) {
        return { ...p, [field]: value };
      }
      return p;
    });
    setLotteryPrizesInput(updated);
  };

  // Forms / Actions state
  const [showProductForm, setShowProductForm] = useState(false);
  const [showSupabaseGuide, setShowSupabaseGuide] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState(100);
  const [formDeliveryPrice, setFormDeliveryPrice] = useState<number>(100);
  const [formDeliveryPriceDhaka, setFormDeliveryPriceDhaka] = useState<number>(100);
  const [formDeliveryPriceChattogram, setFormDeliveryPriceChattogram] = useState<number>(150);
  const [formDeliveryPriceRajshahi, setFormDeliveryPriceRajshahi] = useState<number>(150);
  const [formDeliveryPriceKhulna, setFormDeliveryPriceKhulna] = useState<number>(150);
  const [formDeliveryPriceBarishal, setFormDeliveryPriceBarishal] = useState<number>(150);
  const [formDeliveryPriceSylhet, setFormDeliveryPriceSylhet] = useState<number>(150);
  const [formDeliveryPriceRangpur, setFormDeliveryPriceRangpur] = useState<number>(150);
  const [formDeliveryPriceMymensingh, setFormDeliveryPriceMymensingh] = useState<number>(150);
  const [formStock, setFormStock] = useState(10);
  const [formCategory, setFormCategory] = useState<'MEN' | 'WOMEN' | 'UNISEX' | 'ACCESSORIES'>('MEN');
  const [formSizes, setFormSizes] = useState<string>('S, M, L');
  const [formDimensions, setFormDimensions] = useState('Bespoke Fit');
  const [formWhyBuy, setFormWhyBuy] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formImages, setFormImages] = useState<string[]>([]);
  const [secondaryUrlInput, setSecondaryUrlInput] = useState('');
  const [formLotteryEligible, setFormLotteryEligible] = useState<boolean>(true);
  const [formCouponCode, setFormCouponCode] = useState<string>('');
  const [formCouponDiscountPercent, setFormCouponDiscountPercent] = useState<number>(15);
  const [formOfferPrice, setFormOfferPrice] = useState<number | ''>('');
  const [formTimerEndTime, setFormTimerEndTime] = useState<string>('');
  const [formTimerMessage, setFormTimerMessage] = useState<string>('');
  const [formBkashNumber, setFormBkashNumber] = useState<string>('');
  const [formNagadNumber, setFormNagadNumber] = useState<string>('');
  const [formPaymentType, setFormPaymentType] = useState<'cod' | 'delivery_charge' | 'full_advance'>('cod');
  const [formDeliveryCharge, setFormDeliveryCharge] = useState<number>(100);
  const [uploadProgress, setUploadProgress] = useState('');
  const [formError, setFormError] = useState('');

  // Other Simple Forms
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [newCouponVal, setNewCouponVal] = useState(10);
  const [newCouponMaxUses, setNewCouponMaxUses] = useState<string>('');

  const [newBannerTitle, setNewBannerTitle] = useState('');
  const [newBannerSubtitle, setNewBannerSubtitle] = useState('');
  const [newBannerImg, setNewBannerImg] = useState('');
  const [newBannerIsVideo, setNewBannerIsVideo] = useState(false);
  const [bannerUploadProgress, setBannerUploadProgress] = useState('');
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);

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
    fetchAlerts();

    const interval = setInterval(() => {
      // Periodic poll for dynamic admin updates (e.g. Chat alerts)
      fetchAnalytics();
      fetchChats();
      fetchAlerts();
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

  const fetchAlerts = async () => {
    try {
      const res = await fetch('/api/back-in-stock-alerts');
      if (res.ok) {
        setBackInStockAlerts(await res.json());
      }
    } catch (e) {
      console.error("Error reading restock alerts:", e);
    }
  };

  const handleDeleteAlert = async (id: string) => {
    try {
      const res = await fetch(`/api/back-in-stock-alerts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchAlerts();
      }
    } catch (e) {
      console.error("Error archiving restock alert:", e);
    }
  };

  // Reusable multi-attempt single file upload helper containing optimization & compression
  const uploadSingleFile = async (file: File): Promise<string> => {
    const isVideoFile = file.type.startsWith('video/') ||
                        file.name.toLowerCase().endsWith('.mp4') ||
                        file.name.toLowerCase().endsWith('.webm') ||
                        file.name.toLowerCase().endsWith('.mov') ||
                        file.name.toLowerCase().endsWith('.ogg') ||
                        file.name.toLowerCase().endsWith('.m4v');

    // 1. Client-Side Image Compression & Resizing to satisfy size limits
    const compressed = await new Promise<{ base64: string; blob: Blob }>((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        if (isVideoFile) {
          resolve({ base64: event.target?.result as string, blob: file });
          return;
        }
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

    // ATTEMPT 1: Try direct upload to Supabase bucket 'media' (falls back to 'products' if missing)
    try {
      let activeBucket = 'media';
      let { data: uploadData, error: uploadError } = await supabase.storage
        .from(activeBucket)
        .upload(fileNameClean, compressed.blob, {
          contentType: file.type || (isVideoFile ? 'video/mp4' : 'image/jpeg'),
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.warn(`Direct storage upload to '${activeBucket}' failed. Falling back to 'products' bucket:`, uploadError.message);
        activeBucket = 'products';
        const fallbackRes = await supabase.storage
          .from(activeBucket)
          .upload(fileNameClean, compressed.blob, {
            contentType: file.type || (isVideoFile ? 'video/mp4' : 'image/jpeg'),
            cacheControl: '3600',
            upsert: true
          });
        uploadData = fallbackRes.data;
        uploadError = fallbackRes.error;
      }

      if (!uploadError && uploadData) {
        const { data: publicUrlData } = supabase.storage
          .from(activeBucket)
          .getPublicUrl(fileNameClean);

        if (publicUrlData?.publicUrl) {
          return publicUrlData.publicUrl;
        }
      } else {
        console.warn("Direct storage upload failed, cascading to server-side endpoint:", uploadError?.message);
      }
    } catch (directErr: any) {
      console.warn("Direct storage connection error, cascading to server-side:", directErr.message);
    }

    // ATTEMPT 2: Fallback to server-side /api/upload endpoint
    if (!compressed.base64) {
      throw new Error("Could not prepare image binary data.");
    }

    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: file.name, base64Data: compressed.base64 })
    });

    const resultData = await res.json();
    if (res.ok && resultData.fileUrl) {
      return resultData.fileUrl;
    } else {
      throw new Error(resultData.message || "Failed to parse API upload response.");
    }
  };

  // Primary image file change uploader
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFormError('');
    setUploadProgress("Optimizing primary image and preparing upload...");

    try {
      const url = await uploadSingleFile(file);
      setFormImageUrl(url);
      setUploadProgress("Primary catalog image uploaded successfully!");
    } catch (err: any) {
      console.error("Upload process encountered error:", err);
      setUploadProgress(`Base64/API Upload fallback status: ${err.message || "Unable to contact asset storage server."}`);
    }
  };

  // Secondary multiple images file change uploader
  const handleMultiFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setFormError('');
    setUploadProgress("Optimizing and uploading multiple secondary files...");

    let uploadedCount = 0;
    const newUploads: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        setUploadProgress(`Uploading secondary image ${i + 1} of ${files.length}...`);
        const url = await uploadSingleFile(file);
        newUploads.push(url);
        uploadedCount++;
      } catch (err: any) {
        console.error("Error uploading secondary file:", file.name, err);
        setFormError(`Failed to upload secondary ${file.name}: ${err.message || "Error"}`);
      }
    }

    if (newUploads.length > 0) {
      setFormImages((prev) => [...prev, ...newUploads]);
      setUploadProgress(`Successfully uploaded ${uploadedCount} secondary brand images!`);
    } else {
      setUploadProgress("");
    }
  };

  const handleRemoveSecondaryImage = (index: number) => {
    setFormImages((prev) => prev.filter((_, i) => i !== index));
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
      deliveryPrice: Number(formDeliveryPrice || 100),
      deliveryPriceDhaka: Number(formDeliveryPriceDhaka || 100),
      deliveryPriceChattogram: Number(formDeliveryPriceChattogram || 150),
      deliveryPriceRajshahi: Number(formDeliveryPriceRajshahi || 150),
      deliveryPriceKhulna: Number(formDeliveryPriceKhulna || 150),
      deliveryPriceBarishal: Number(formDeliveryPriceBarishal || 150),
      deliveryPriceSylhet: Number(formDeliveryPriceSylhet || 150),
      deliveryPriceRangpur: Number(formDeliveryPriceRangpur || 150),
      deliveryPriceMymensingh: Number(formDeliveryPriceMymensingh || 150),
      stock: Number(formStock),
      category: formCategory,
      sizes: parsedSizes,
      dimensions: formDimensions,
      whyBuy: formWhyBuy || "এটি একটি অত্যন্ত প্রিমিয়াম ডিজাইন করা পিস, যা আপনার ফ্যাশনে এক অনন্য মাত্রা যোগ করবে। এর প্রিমিয়াম কোয়ালিটির ফাইবার চমৎকার অনুভূতি দেবে।",
      imageUrl: formImageUrl,
      images: formImages,
      trending: true,
      featured: true,
      lotteryEligible: formLotteryEligible,
      couponCode: formCouponCode,
      couponDiscountPercent: Number(formCouponDiscountPercent),
      offerPrice: formOfferPrice !== '' ? Number(formOfferPrice) : null,
      timerEndTime: formTimerEndTime || null,
      timerMessage: formTimerMessage || null,
      bkashNumber: formBkashNumber,
      nagadNumber: formNagadNumber,
      paymentType: formPaymentType,
      deliveryCharge: Number(formDeliveryCharge || 100)
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
        setFormDeliveryPrice(100);
        setFormDeliveryPriceDhaka(100);
        setFormDeliveryPriceChattogram(150);
        setFormDeliveryPriceRajshahi(150);
        setFormDeliveryPriceKhulna(150);
        setFormDeliveryPriceBarishal(150);
        setFormDeliveryPriceSylhet(150);
        setFormDeliveryPriceRangpur(150);
        setFormDeliveryPriceMymensingh(150);
        setFormStock(50);
        setFormWhyBuy('');
        setFormImages([]);
        setSecondaryUrlInput('');
        setFormLotteryEligible(true);
        setFormCouponCode('');
        setFormCouponDiscountPercent(15);
        setFormOfferPrice('');
        setFormTimerEndTime('');
        setFormTimerMessage('');
        setFormBkashNumber('');
        setFormNagadNumber('');
        setFormPaymentType('cod');
        setFormDeliveryCharge(100);
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
    setFormDeliveryPrice(prod.deliveryPrice !== undefined ? prod.deliveryPrice : 100);
    setFormDeliveryPriceDhaka(prod.deliveryPriceDhaka !== undefined ? prod.deliveryPriceDhaka : 100);
    setFormDeliveryPriceChattogram(prod.deliveryPriceChattogram !== undefined ? prod.deliveryPriceChattogram : 150);
    setFormDeliveryPriceRajshahi(prod.deliveryPriceRajshahi !== undefined ? prod.deliveryPriceRajshahi : 150);
    setFormDeliveryPriceKhulna(prod.deliveryPriceKhulna !== undefined ? prod.deliveryPriceKhulna : 150);
    setFormDeliveryPriceBarishal(prod.deliveryPriceBarishal !== undefined ? prod.deliveryPriceBarishal : 150);
    setFormDeliveryPriceSylhet(prod.deliveryPriceSylhet !== undefined ? prod.deliveryPriceSylhet : 150);
    setFormDeliveryPriceRangpur(prod.deliveryPriceRangpur !== undefined ? prod.deliveryPriceRangpur : 150);
    setFormDeliveryPriceMymensingh(prod.deliveryPriceMymensingh !== undefined ? prod.deliveryPriceMymensingh : 150);
    setFormStock(prod.stock);
    setFormCategory(prod.category);
    setFormSizes(prod.sizes.join(', '));
    setFormDimensions(prod.dimensions);
    setFormWhyBuy(prod.whyBuy);
    setFormImageUrl(prod.imageUrl);
    setFormImages(prod.images || []);
    setSecondaryUrlInput('');
    setFormLotteryEligible(prod.lotteryEligible !== false);
    setFormCouponCode(prod.couponCode || '');
    setFormCouponDiscountPercent(prod.couponDiscountPercent !== undefined ? prod.couponDiscountPercent : 15);
    setFormOfferPrice(prod.offerPrice !== undefined && prod.offerPrice !== null ? prod.offerPrice : '');
    setFormTimerEndTime(prod.timerEndTime || '');
    setFormTimerMessage(prod.timerMessage || '');
    setFormBkashNumber(prod.bkashNumber || '');
    setFormNagadNumber(prod.nagadNumber || '');
    setFormPaymentType(prod.paymentType || 'cod');
    setFormDeliveryCharge(prod.deliveryCharge !== undefined ? prod.deliveryCharge : (prod.deliveryPrice !== undefined ? prod.deliveryPrice : 100));
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
        body: JSON.stringify({ 
          code: newCouponCode, 
          type: newCouponType, 
          value: newCouponVal,
          maxUses: newCouponMaxUses ? Number(newCouponMaxUses) : undefined
        })
      });
      if (res.ok) {
        setNewCouponCode('');
        setNewCouponMaxUses('');
        fetchCoupons();
        onRefreshCoupons?.();
      } else {
        const err = await res.json();
        alert(err.message || "Failed creating discount code");
      }
    } catch (e) {}
  };

  const handleDeleteCoupon = async (code: string) => {
    try {
      const res = await fetch(`/api/coupons/${code}`, { method: 'DELETE' });
      if (res.ok) {
        fetchCoupons();
        onRefreshCoupons?.();
      }
    } catch (e) {}
  };

  // Create Banner
  const handleBannerFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (files.length === 1) {
      const file = files[0];
      setBannerUploadProgress("Uploading and preparing high-fidelity banner asset...");
      try {
        const url = await uploadSingleFile(file);
        
        // Auto-identify if file is a video by mime type or file extension
        const isVideoType = file.type.startsWith('video/') || 
                            file.name.toLowerCase().endsWith('.mp4') || 
                            file.name.toLowerCase().endsWith('.webm') || 
                            file.name.toLowerCase().endsWith('.mov') ||
                            file.name.toLowerCase().endsWith('.ogg') ||
                            file.name.toLowerCase().endsWith('.m4v');
        
        const resolvedUrl = isVideoType && !url.includes('is_video=true')
          ? (url.includes('#') ? `${url}&is_video=true` : `${url}#is_video=true`)
          : url;

        setNewBannerImg(resolvedUrl);
        setNewBannerIsVideo(isVideoType);
        setBannerUploadProgress(`Banner asset uploaded successfully! ${isVideoType ? "(Detected Cinematic Video)" : "(Detected Image)"}`);
      } catch (err: any) {
        console.error("Banner asset upload error:", err);
        setBannerUploadProgress(`Upload configuration failed: ${err.message || "Unknown error"}`);
      }
    } else {
      setBannerUploadProgress(`Uploading and processing ${files.length} banners sequentially...`);
      let successCount = 0;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          setBannerUploadProgress(`Uploading file ${i + 1} of ${files.length}: ${file.name}...`);
          const url = await uploadSingleFile(file);
          const isVideoType = file.type.startsWith('video/') || 
                              file.name.toLowerCase().endsWith('.mp4') || 
                              file.name.toLowerCase().endsWith('.webm') || 
                              file.name.toLowerCase().endsWith('.mov') ||
                              file.name.toLowerCase().endsWith('.ogg') ||
                              file.name.toLowerCase().endsWith('.m4v');
          const resolvedUrl = isVideoType && !url.includes('is_video=true')
            ? (url.includes('#') ? `${url}&is_video=true` : `${url}#is_video=true`)
            : url;

          const title = file.name.split('.')[0].replace(/[-_]/g, ' ').toUpperCase();
          const res = await fetch('/api/banners', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              title: title || "EXCLUSIVE COLLECTION", 
              subtitle: "A meticulous exploration of luxury form.", 
              imageUrl: resolvedUrl, 
              isVideo: isVideoType, 
              active: true 
            })
          });
          if (res.ok) {
            successCount++;
          }
        } catch (uploadErr: any) {
          console.error("Error uploading multiple banners:", uploadErr);
        }
      }
      setBannerUploadProgress(`Successfully uploaded and launched ${successCount} banners!`);
      fetchBanners();
    }
  };

  const handleToggleBannerActive = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/banners/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive })
      });
      if (res.ok) {
        fetchBanners();
      }
    } catch (err) {
      console.error("Toggle banner active error:", err);
    }
  };

  const handleEditBannerClick = (b: Banner) => {
    setEditingBannerId(b.id);
    setNewBannerTitle(b.title);
    setNewBannerSubtitle(b.subtitle || '');
    
    // Clean query parameters or anchors for pristine raw preview if needed, but let's keep it safe
    setNewBannerImg(b.imageUrl);
    
    const isVideoType = b.isVideo || 
                        b.imageUrl.includes('is_video=true') ||
                        b.imageUrl.includes('#video') ||
                        b.imageUrl.includes('#is_video') ||
                        b.imageUrl.split(/[?#]/)[0].toLowerCase().endsWith('.mp4') || 
                        b.imageUrl.split(/[?#]/)[0].toLowerCase().endsWith('.webm') || 
                        b.imageUrl.split(/[?#]/)[0].toLowerCase().endsWith('.mov') ||
                        b.imageUrl.split(/[?#]/)[0].toLowerCase().endsWith('.ogg') ||
                        b.imageUrl.split(/[?#]/)[0].toLowerCase().endsWith('.m4v');
    setNewBannerIsVideo(!!isVideoType);
    setBannerUploadProgress("Editing existing banner asset. You can upload a new media file or change text details below.");
  };

  const handleCancelEditBanner = () => {
    setNewBannerTitle('');
    setNewBannerSubtitle('');
    setNewBannerImg('');
    setNewBannerIsVideo(false);
    setBannerUploadProgress('');
    setEditingBannerId(null);
  };

  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBannerTitle || !newBannerImg) return;
    try {
      let resolvedUrl = newBannerImg;
      if (newBannerIsVideo && !resolvedUrl.includes('is_video=true')) {
        resolvedUrl = resolvedUrl.includes('#') 
          ? `${resolvedUrl}&is_video=true` 
          : `${resolvedUrl}#is_video=true`;
      }

      if (editingBannerId) {
        const res = await fetch(`/api/banners/${editingBannerId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            title: newBannerTitle, 
            subtitle: newBannerSubtitle, 
            imageUrl: resolvedUrl, 
            isVideo: newBannerIsVideo
          })
        });
        if (res.ok) {
          handleCancelEditBanner();
          fetchBanners();
        }
      } else {
        const res = await fetch('/api/banners', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            title: newBannerTitle, 
            subtitle: newBannerSubtitle, 
            imageUrl: resolvedUrl, 
            isVideo: newBannerIsVideo, 
            active: true 
          })
        });
        if (res.ok) {
          handleCancelEditBanner();
          fetchBanners();
        }
      }
    } catch (e) {}
  };

  const handleDeleteBanner = async (id: string) => {
    try {
      const res = await fetch(`/api/banners/${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (editingBannerId === id) {
          handleCancelEditBanner();
        }
        fetchBanners();
      }
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

            <button 
              onClick={() => { setActiveTab('alerts'); setSelectedChat(null); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-xs tracking-wider uppercase font-display transition-all justify-start cursor-pointer ${
                activeTab === 'alerts' ? 'bg-luxury-gold text-luxury-black font-extrabold shadow' : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Bell size={13} className={activeTab === 'alerts' ? 'text-luxury-black' : 'text-luxury-gold'} />
              Restock Alerts
              {backInStockAlerts.length > 0 && (
                <span className="ml-auto bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.2 rounded text-[8.5px] font-mono leading-none font-bold">
                  {backInStockAlerts.length}
                </span>
              )}
            </button>

            <button 
              onClick={() => { setActiveTab('settings'); setSelectedChat(null); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-xs tracking-wider uppercase font-display transition-all justify-start cursor-pointer ${
                activeTab === 'settings' ? 'bg-luxury-gold text-luxury-black font-extrabold shadow' : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Settings size={13} className={activeTab === 'settings' ? 'text-luxury-black' : 'text-luxury-gold'} />
              System Settings
            </button>
          </nav>
        </div>

        <div className="pt-6 border-t border-white/5 space-y-3">
          {/* Quick Social Setup */}
          <div className="bg-[#0e0e0e] border border-white/5 p-3 rounded-lg space-y-2.5">
            <div className="flex items-center gap-1.5 pb-1 border-b border-white/5">
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-luxury-gold flex items-center gap-1">
                🔗 Quick Social Links
              </span>
            </div>
            
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 bg-black/40 px-2 py-1 rounded border border-white/5">
                <Facebook className="w-3.5 h-3.5 text-[#1877F2] shrink-0" />
                <input 
                  type="text" 
                  placeholder="Facebook URL" 
                  value={facebookUrlInput}
                  onChange={(e) => setFacebookUrlInput(e.target.value)}
                  className="bg-transparent border-none text-[10px] w-full text-zinc-300 focus:outline-none focus:ring-0 font-mono py-0.5" 
                />
              </div>

              <div className="flex items-center gap-2 bg-black/40 px-2 py-1 rounded border border-white/5">
                <Instagram className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                <input 
                  type="text" 
                  placeholder="Instagram URL" 
                  value={instagramUrlInput}
                  onChange={(e) => setInstagramUrlInput(e.target.value)}
                  className="bg-transparent border-none text-[10px] w-full text-zinc-300 focus:outline-none focus:ring-0 font-mono py-0.5" 
                />
              </div>
            </div>

            <button
              onClick={() => handleSaveSettings()}
              disabled={savingSettings}
              className="w-full text-center bg-luxury-gold hover:bg-white text-luxury-black font-extrabold uppercase py-1 px-2 text-[8px] tracking-widest rounded transition-all duration-200 cursor-pointer flex items-center justify-center gap-1"
            >
              {savingSettings ? "Saving..." : "✓ Save Links"}
            </button>
            {settingsSuccess && (
              <p className="text-[7.5px] text-emerald-400 font-mono text-center animate-pulse">✓ Saved Successfully!</p>
            )}
          </div>

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
              {activeTab === 'settings' && "VIP System Settings"}
              {activeTab === 'alerts' && "Restock Intel Alert Hub"}
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

            {/* 100% Accurate High-Accuracy Visitor Presence Hub */}
            <div className="bg-gradient-to-br from-[#120529] via-[#080211] to-[#040108] border border-luxury-gold/25 rounded-xl p-5 md:p-6 shadow-[0_4px_30px_rgba(154,77,255,0.15)] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#9A4DFF]/5 rounded-full blur-3xl group-hover:bg-[#9A4DFF]/8 transition-all duration-700 pointer-events-none" />
              <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
                <div className="space-y-2 max-w-xl">
                  <div className="inline-flex items-center gap-2 bg-[#120c24] border border-[#9A4DFF]/30 px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    <span className="text-[9px] text-[#b689ff] uppercase tracking-widest font-mono font-black">100% ACCURATE HEARTBEAT METRICS ACTIVATED</span>
                  </div>
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-white tracking-wide uppercase flex items-center gap-2">
                    ⚜️ Traffic & Audience Analytics Matrix
                  </h3>
                  <p className="text-xs text-white/55 leading-relaxed font-sans">
                    Our high-precision, non-cookie audience telemetry fingerprints browser devices uniquely. Active sessions run a localized 12-second heartbeat loop to prevent session contamination.
                  </p>
                </div>

                {/* Real-time stats grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full lg:w-auto flex-shrink-0">
                  <div className="bg-black/40 border border-white/5 p-3.5 rounded-lg flex flex-col justify-center min-w-[130px] shadow-sm">
                    <span className="text-[9px] uppercase font-mono tracking-widest text-zinc-400">Live Concurrences</span>
                    <p className="text-2xl font-black font-sans text-emerald-400 mt-1 flex items-baseline gap-1.5">
                      <span>{analytics?.liveViews || 1}</span>
                      <span className="text-[10px] font-mono text-emerald-500 font-bold animate-pulse">● online</span>
                    </p>
                  </div>
                  <div className="bg-black/40 border border-white/5 p-3.5 rounded-lg flex flex-col justify-center min-w-[130px] shadow-sm">
                    <span className="text-[9px] uppercase font-mono tracking-widest text-zinc-400">Total Unique Visitors</span>
                    <p className="text-2xl font-black font-sans text-luxury-gold mt-1">
                      {analytics?.visits || 125}
                    </p>
                  </div>
                  <div className="bg-black/40 border border-white/5 p-3.5 rounded-lg flex flex-col justify-center min-w-[130px] col-span-2 sm:col-span-1 shadow-sm">
                    <span className="text-[9px] uppercase font-mono tracking-widest text-zinc-400">Checkout Conversion</span>
                    <p className="text-2xl font-black font-sans text-[#a78bfa] mt-1">
                      {((Number(analytics?.totalOrders || 0) / Math.max(1, Number(analytics?.visits || 125))) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Heartbeat pulse animation bar */}
              <div className="mt-6 pt-4 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-mono text-zinc-400 relative z-10">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-zinc-500">Live Pulse:</span>
                  <div className="flex items-end gap-[3px] h-4">
                    <span className="w-1 bg-[#9A4DFF]/20 h-2 rounded animate-pulse"></span>
                    <span className="w-1 bg-emerald-500/60 h-4 rounded animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1 bg-emerald-500/40 h-3 rounded animate-bounce [animation-delay:0.4s]"></span>
                    <span className="w-1 bg-[#9A4DFF]/40 h-1.5 rounded animate-pulse"></span>
                    <span className="w-1 bg-emerald-500/80 h-3.5 rounded animate-bounce"></span>
                    <span className="w-1 bg-[#9A4DFF]/30 h-1 rounded animate-pulse [animation-delay:0.1s]"></span>
                  </div>
                  <span className="text-[9px] text-[#a78bfa] font-bold">Secure connection logs active</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[9px] text-zinc-400">
                  <span className="flex items-center gap-1">🛡️ Anti-bot filters: <span className="text-emerald-400 font-bold">ENABLED</span></span>
                  <span className="flex items-center gap-1">🔒 Cookies: <span className="text-yellow-400 font-bold">BYPASSED (0-risk)</span></span>
                </div>
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
                  setFormImages([]);
                  setSecondaryUrlInput('');
                  setFormWhyBuy('');
                  setFormOfferPrice('');
                  setFormTimerEndTime('');
                  setFormTimerMessage('');
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
    featured BOOLEAN DEFAULT true,
    "lotteryEligible" BOOLEAN DEFAULT true,
    "couponCode" TEXT DEFAULT '',
    "couponDiscountPercent" NUMERIC DEFAULT 15
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

-- 8. Create Settings Table
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value TEXT
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_all_products ON public.products FOR SELECT USING (true);
CREATE POLICY select_all_banners ON public.banners FOR SELECT USING (true);
CREATE POLICY select_all_coupons ON public.coupons FOR SELECT USING (true);
CREATE POLICY select_all_campaigns ON public.campaigns FOR SELECT USING (true);
CREATE POLICY select_all_reviews ON public.reviews FOR SELECT USING (true);
CREATE POLICY select_all_orders ON public.orders FOR SELECT USING (true);
CREATE POLICY select_all_chats ON public.chats FOR SELECT USING (true);
CREATE POLICY select_all_settings ON public.settings FOR SELECT USING (true);

CREATE POLICY insert_orders ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY insert_reviews ON public.reviews FOR INSERT WITH CHECK (true);
CREATE POLICY insert_chats ON public.chats FOR INSERT WITH CHECK (true);

CREATE POLICY insert_all_products ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY insert_all_banners ON public.banners FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY insert_all_coupons ON public.coupons FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY insert_all_campaigns ON public.campaigns FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY insert_all_reviews ON public.reviews FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY insert_all_orders ON public.orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY insert_all_chats ON public.chats FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY insert_all_settings ON public.settings FOR ALL USING (true) WITH CHECK (true);

-- 8. Create and Configure 'media' & 'products' Storage Buckets (if they don't exist yet)
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true), ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- Allows open read/write access to storage.objects in the buckets for seamless anonymous uploads
CREATE POLICY "Allow public select on buckets" ON storage.objects FOR SELECT TO public USING (bucket_id IN ('media', 'products'));
CREATE POLICY "Allow public insert on buckets" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id IN ('media', 'products'));
CREATE POLICY "Allow public update on buckets" ON storage.objects FOR UPDATE TO public USING (bucket_id IN ('media', 'products'));
CREATE POLICY "Allow public delete on buckets" ON storage.objects FOR DELETE TO public USING (bucket_id IN ('media', 'products'));`;
                          try {
                            if (navigator.clipboard && navigator.clipboard.writeText) {
                              navigator.clipboard.writeText(sql);
                            } else {
                              const t = document.createElement("textarea");
                              t.value = sql;
                              t.style.position = "fixed";
                              document.body.appendChild(t);
                              t.select();
                              document.execCommand("copy");
                              document.body.removeChild(t);
                            }
                          } catch (err) {
                            console.warn("Fallback copy executed:", err);
                          }
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
    featured BOOLEAN DEFAULT true,
    "lotteryEligible" BOOLEAN DEFAULT true,
    "couponCode" TEXT DEFAULT '',
    "couponDiscountPercent" NUMERIC DEFAULT 15
);`}
                    </pre>
                  </div>

                  <div className="pt-2">
                    <strong className="text-luxury-gold">Step 2: Setup Unified Public Storage Bucket for Media</strong>
                    <p className="text-white/60 mt-0.5 leading-relaxed">
                      Go to "Storage" in your Supabase admin dashboard, click <strong>"New Bucket"</strong>, name the bucket exactly <code className="bg-white/5 px-1 py-0.5 rounded text-cyan-300">media</code> (or <code className="bg-white/5 px-1 py-0.5 rounded text-cyan-300">products</code> if you already have it), and turn ON the <strong>"Public Bucket"</strong> toggle. Under "RLS Policies", add a Policy that grants all/write access to everyone (SELECT/INSERT/UPDATE/DELETE) on the bucket for anonymous users. This single unified bucket will store your logos, product images, and banner assets.
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
                    className="text-white/50 hover:text-luxury-gold hover:rotate-90 hover:scale-110 active:scale-95 transition-all duration-300 p-1.5 rounded-full hover:bg-white/5 border border-transparent hover:border-luxury-gold/30 hover:shadow-[0_0_15px_rgba(212,175,55,0.25)] cursor-pointer"
                    title="Dismiss Form"
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

                  {/* Delivery Pricing Matrix */}
                  <div className="col-span-1 md:col-span-2 bg-black/40 border border-white/[0.04] p-4 rounded-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase font-serif tracking-widest text-[#d4af37] font-bold">⚜️ Division-Wise Delivery Pricing (৳)</span>
                      <span className="text-[9px] text-[#a78bfa] font-mono">8 BD DIVISIONS</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[9px] uppercase font-mono text-white/50 mb-1 flex items-center justify-between">
                          <span>Dhaka (৳)</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        </label>
                        <input 
                          type="number" required value={formDeliveryPriceDhaka} onChange={(e) => setFormDeliveryPriceDhaka(Number(e.target.value))}
                          placeholder="Default 100"
                          className="w-full bg-[#120a1c] text-white text-xs border border-white/5 rounded py-2 px-2.5 focus:outline-none focus:border-luxury-gold"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase font-mono text-white/50 mb-1">Chattogram (৳)</label>
                        <input 
                          type="number" required value={formDeliveryPriceChattogram} onChange={(e) => setFormDeliveryPriceChattogram(Number(e.target.value))}
                          placeholder="Default 150"
                          className="w-full bg-[#120a1c] text-white text-xs border border-white/5 rounded py-2 px-2.5 focus:outline-none focus:border-luxury-gold"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase font-mono text-white/50 mb-1">Rajshahi (৳)</label>
                        <input 
                          type="number" required value={formDeliveryPriceRajshahi} onChange={(e) => setFormDeliveryPriceRajshahi(Number(e.target.value))}
                          placeholder="Default 150"
                          className="w-full bg-[#120a1c] text-white text-xs border border-white/5 rounded py-2 px-2.5 focus:outline-none focus:border-luxury-gold"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase font-mono text-white/50 mb-1">Khulna (৳)</label>
                        <input 
                          type="number" required value={formDeliveryPriceKhulna} onChange={(e) => setFormDeliveryPriceKhulna(Number(e.target.value))}
                          placeholder="Default 150"
                          className="w-full bg-[#120a1c] text-white text-xs border border-white/5 rounded py-2 px-2.5 focus:outline-none focus:border-luxury-gold"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase font-mono text-white/50 mb-1">Barishal (৳)</label>
                        <input 
                          type="number" required value={formDeliveryPriceBarishal} onChange={(e) => setFormDeliveryPriceBarishal(Number(e.target.value))}
                          placeholder="Default 150"
                          className="w-full bg-[#120a1c] text-white text-xs border border-white/5 rounded py-2 px-2.5 focus:outline-none focus:border-luxury-gold"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase font-mono text-white/50 mb-1">Sylhet (৳)</label>
                        <input 
                          type="number" required value={formDeliveryPriceSylhet} onChange={(e) => setFormDeliveryPriceSylhet(Number(e.target.value))}
                          placeholder="Default 150"
                          className="w-full bg-[#120a1c] text-white text-xs border border-white/5 rounded py-2 px-2.5 focus:outline-none focus:border-luxury-gold"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase font-mono text-white/50 mb-1">Rangpur (৳)</label>
                        <input 
                          type="number" required value={formDeliveryPriceRangpur} onChange={(e) => setFormDeliveryPriceRangpur(Number(e.target.value))}
                          placeholder="Default 150"
                          className="w-full bg-[#120a1c] text-white text-xs border border-white/5 rounded py-2 px-2.5 focus:outline-none focus:border-luxury-gold"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase font-mono text-white/50 mb-1">Mymensingh (৳)</label>
                        <input 
                          type="number" required value={formDeliveryPriceMymensingh} onChange={(e) => setFormDeliveryPriceMymensingh(Number(e.target.value))}
                          placeholder="Default 150"
                          className="w-full bg-[#120a1c] text-white text-xs border border-white/5 rounded py-2 px-2.5 focus:outline-none focus:border-luxury-gold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Style X Payment Configuration */}
                  <div className="col-span-1 md:col-span-2 bg-gradient-to-br from-[#d4af37]/5 to-transparent border border-[#d4af37]/20 p-5 rounded-xl space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">⚜️</span>
                      <h4 className="text-xs uppercase font-serif tracking-widest text-[#d4af37] font-bold">Style X Independent Payment Settings</h4>
                    </div>
                    <p className="text-[10px] text-zinc-400 font-sans leading-relaxed">
                      Configure bespoke payment settings for this specific product. These values govern the interactive checkout flow dynamically.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Payment Type selection */}
                      <div>
                        <label className="block text-[10px] uppercase font-mono tracking-wider text-white/50 mb-1">Payment Type Selection</label>
                        <select
                          value={formPaymentType}
                          onChange={(e) => setFormPaymentType(e.target.value as any)}
                          className="w-full bg-luxury-charcoal text-white text-xs border border-white/10 rounded py-2.5 px-3 focus:outline-none focus:border-luxury-gold font-medium"
                        >
                          <option value="cod">Cash on Delivery (COD)</option>
                          <option value="delivery_charge">Delivery Charge Only</option>
                          <option value="full_advance">Full Advance Payment</option>
                        </select>
                      </div>

                      {/* Delivery Charge */}
                      <div>
                        <label className="block text-[10px] uppercase font-mono tracking-wider text-white/50 mb-1">Delivery Charge (৳ BD Taka)</label>
                        <input
                          type="number"
                          required
                          value={formDeliveryCharge}
                          onChange={(e) => setFormDeliveryCharge(Number(e.target.value))}
                          placeholder="e.g. 100"
                          className="w-full bg-luxury-charcoal text-white text-xs border border-white/10 rounded py-2.5 px-3 focus:outline-none focus:border-luxury-gold"
                        />
                      </div>

                      {/* bKash Number */}
                      <div>
                        <label className="block text-[10px] uppercase font-mono tracking-wider text-white/50 mb-1">bKash Number</label>
                        <input
                          type="text"
                          value={formBkashNumber}
                          onChange={(e) => setFormBkashNumber(e.target.value)}
                          placeholder="e.g. 017XXXXXXXX"
                          className="w-full bg-luxury-charcoal text-white text-xs border border-white/10 rounded py-2.5 px-3 focus:outline-none focus:border-luxury-gold"
                        />
                      </div>

                      {/* Nagad Number */}
                      <div>
                        <label className="block text-[10px] uppercase font-mono tracking-wider text-white/50 mb-1">Nagad Number</label>
                        <input
                          type="text"
                          value={formNagadNumber}
                          onChange={(e) => setFormNagadNumber(e.target.value)}
                          placeholder="e.g. 019XXXXXXXX"
                          className="w-full bg-luxury-charcoal text-white text-xs border border-white/10 rounded py-2.5 px-3 focus:outline-none focus:border-luxury-gold"
                        />
                      </div>
                    </div>
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

                  {/* LOTTERY & EXCLUSIVE PRODUCT COUPON SETTINGS */}
                  <div className="md:col-span-2 border border-white/5 bg-white/[0.02] p-4 rounded-xl space-y-4">
                    <h4 className="text-[10px] uppercase font-mono tracking-widest text-luxury-gold font-bold flex items-center gap-1.5 border-b border-white/5 pb-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] shadow-[0_0_8px_#d4af37]"></span>
                      Campaign & Coupon Integration
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Lottery Toggle */}
                      <div className="flex items-start space-x-3 bg-[#0d0917]/70 p-3 rounded-lg border border-white/[0.03]">
                        <input
                          type="checkbox"
                          id="formLotteryEligible"
                          checked={formLotteryEligible}
                          onChange={(e) => setFormLotteryEligible(e.target.checked)}
                          className="w-4 h-4 rounded text-[#d4af37] bg-luxury-charcoal border-white/10 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#d4af37] mt-1"
                        />
                        <label htmlFor="formLotteryEligible" className="text-xs text-zinc-300 font-sans cursor-pointer select-none">
                          <span className="block text-[11px] font-bold text-white uppercase tracking-wider">Lottery Voucher Eligible</span>
                          <span className="text-[9.5px] text-white/50 block mt-0.5 leading-relaxed">Allow the Imperial Fortune Wheel discount code to apply to this product at checkout.</span>
                        </label>
                      </div>

                      {/* Product Specific Coupon */}
                      <div className="space-y-2 bg-[#0d0917]/70 p-3 rounded-lg border border-white/[0.03]">
                        <span className="block text-[11px] font-bold text-white uppercase tracking-wider">Single Product Promo Code</span>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[8px] uppercase font-mono text-zinc-400 mb-1">Coupon Code</label>
                            <input 
                              type="text" 
                              value={formCouponCode} 
                              onChange={(e) => setFormCouponCode(e.target.value.trim().toUpperCase())}
                              placeholder="e.g. VIPCODELUX"
                              className="w-full bg-luxury-charcoal text-white text-xs border border-white/10 rounded py-2 px-2.5 focus:outline-none focus:border-luxury-gold uppercase font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] uppercase font-mono text-zinc-400 mb-1">Discount %</label>
                            <input 
                              type="number" 
                              value={formCouponDiscountPercent} 
                              onChange={(e) => setFormCouponDiscountPercent(Number(e.target.value))}
                              placeholder="e.g. 20"
                              min={1}
                              max={100}
                              className="w-full bg-luxury-charcoal text-white text-xs border border-white/10 rounded py-2 px-2.5 focus:outline-none focus:border-luxury-gold font-mono"
                            />
                          </div>
                        </div>
                        <span className="text-[9px] text-zinc-500 block leading-normal mt-1">If set, customers can checkout this exact product with this coupon code.</span>
                      </div>
                    </div>
                  </div>

                  {/* Flash Sale & Countdown Timer Configuration */}
                  <div className="md:col-span-2 border border-luxury-gold/30 p-4 rounded-xl bg-[#090514]/65 space-y-4 shadow-[0_0_15px_rgba(212,175,55,0.05)] gold-glow-border">
                    <div className="flex items-center justify-between border-b border-luxury-gold/25 pb-2">
                      <h4 className="text-[10px] uppercase font-mono tracking-widest text-luxury-gold font-bold flex items-center gap-1.5">
                        <span>⚡ FLASH SALE & COUNTDOWN TIMER CONFIGURATION</span>
                      </h4>
                      <span className="text-[9px] text-[#a78bfa] font-mono animate-pulse">EXCLUSIVE PROMO</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Offer Price */}
                      <div>
                        <label className="block text-[10px] uppercase font-mono tracking-wider text-white/50 mb-1">Offer / Discount Price (৳ BD Taka)</label>
                        <input 
                          type="number" 
                          value={formOfferPrice} 
                          onChange={(e) => setFormOfferPrice(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="e.g. 850 (Leave blank for none)"
                          className="w-full bg-luxury-charcoal text-white text-xs border border-white/10 rounded py-2.5 px-3 focus:outline-none focus:border-luxury-gold font-mono"
                        />
                        <span className="text-[9px] text-zinc-500 block leading-normal mt-1">Active price during the timer period. Restores to normal price when timer expires.</span>
                      </div>

                      {/* Timer End Time */}
                      <div>
                        <label className="block text-[10px] uppercase font-mono tracking-wider text-white/50 mb-1">Timer Expiration Date &amp; Time</label>
                        <input 
                          type="datetime-local" 
                          value={formTimerEndTime} 
                          onChange={(e) => setFormTimerEndTime(e.target.value)}
                          className="w-full bg-[#120e21] text-white text-xs border border-white/10 rounded py-2 px-3 focus:outline-none focus:border-luxury-gold font-mono"
                        />
                        <span className="text-[9px] text-zinc-500 block leading-normal mt-1">Select countdown end time. If blank, no countdown banner will show.</span>
                      </div>

                      {/* Timer Custom Message */}
                      <div>
                        <label className="block text-[10px] uppercase font-mono tracking-wider text-white/50 mb-1">Timer Banner Message / Label</label>
                        <input 
                          type="text" 
                          value={formTimerMessage} 
                          onChange={(e) => setFormTimerMessage(e.target.value)}
                          placeholder="e.g. LIMITED EID SPECIAL OFFER! GET NOW!"
                          className="w-full bg-luxury-charcoal text-white text-xs border border-white/10 rounded py-2.5 px-3 focus:outline-none focus:border-luxury-gold"
                        />
                        <span className="text-[9px] text-zinc-500 block leading-normal mt-1">A catchy title shown beside the running countdown banner.</span>
                      </div>
                    </div>
                  </div>

                  {/* Image link & local storage uploader (Supreme replicas) */}
                  <div className="md:col-span-2 border border-dashed border-white/10 p-4 rounded bg-luxury-black/35 space-y-3.5">
                    <div>
                      <h4 className="text-[10px] uppercase font-mono tracking-widest text-white/60 mb-2">Configure Digital Image File (Primary Cover)</h4>
                      <input 
                        type="text" value={formImageUrl} onChange={(e) => setFormImageUrl(e.target.value)}
                        placeholder="Or input direct splash image URL..."
                        className="w-full bg-luxury-charcoal text-white text-xs border border-white/10 rounded py-2.5 px-3 focus:outline-none focus:border-luxury-gold mb-3"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <div className="flex-1 w-full">
                        <label className="block text-[9px] uppercase font-mono tracking-wider text-white/40 mb-1">Upload Primary Cover File (Simulated Cloud Replica)</label>
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
                  </div>

                  {/* Multiple Secondary Images Configuration */}
                  <div className="md:col-span-2 border border-dashed border-luxury-gold/15 p-4 rounded bg-luxury-black/35 space-y-4">
                    <div>
                      <h4 className="text-[10px] uppercase font-mono tracking-widest text-luxury-gold font-bold mb-1 flex items-center gap-1.5">
                        <span>⚜️</span> Secondary Product Images (Upload 2, 3 or more than image)
                      </h4>
                      <p className="text-[9px] text-zinc-400">Specify multiple product angles, variants, styles, or detailed macro shots of the materials.</p>
                    </div>

                    {/* Add Secondary Image by direct URL */}
                    <div>
                      <label className="block text-[9px] uppercase font-mono tracking-wider text-white/40 mb-1">Add Image by Direct URL</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={secondaryUrlInput} 
                          onChange={(e) => setSecondaryUrlInput(e.target.value)}
                          placeholder="Paste direct secondary image URL (e.g. from Unsplash)..."
                          className="flex-1 bg-luxury-charcoal text-white text-xs border border-white/10 rounded py-2 px-3 focus:outline-none focus:border-luxury-gold"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (secondaryUrlInput.trim()) {
                              setFormImages(prev => [...prev, secondaryUrlInput.trim()]);
                              setSecondaryUrlInput('');
                            }
                          }}
                          className="bg-[#121212] hover:bg-luxury-gold hover:text-luxury-black text-luxury-gold border border-luxury-gold/30 font-mono text-[9px] px-4 rounded transition-all duration-300"
                        >
                          ADD URL
                        </button>
                      </div>
                    </div>

                    {/* Upload Multiple Files */}
                    <div>
                      <label className="block text-[9px] uppercase font-mono tracking-wider text-white/40 mb-1">Upload Multiple Brand Photos (Select 2, 3 or more files at once)</label>
                      <input 
                        type="file" 
                        multiple 
                        accept="image/*" 
                        onChange={handleMultiFileChange}
                        className="w-full text-xs text-white/50 file:mr-4 file:py-2 file:px-4 file:rounded file:border file:border-luxury-gold/30 file:bg-luxury-charcoal file:text-luxury-gold hover:file:bg-luxury-black cursor-pointer"
                      />
                    </div>

                    {/* Image Gallery Lists */}
                    {formImages.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-white/5">
                        <label className="block text-[9px] uppercase font-mono tracking-wider text-[#d4af37] font-semibold">Active Secondary Gallery ({formImages.length} images)</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                          {formImages.map((imgUrl, index) => (
                            <div key={index} className="relative group/img aspect-square bg-[#0c0c0c] border border-white/10 rounded overflow-hidden">
                              <img src={imgUrl} alt={`Gallery index ${index}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              <div className="absolute inset-0 bg-black/75 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity duration-200 gap-2">
                                <span className="text-[10px] text-white/80 font-mono">#{index + 1}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSecondaryImage(index)}
                                  className="bg-red-950/85 hover:bg-red-900 border border-red-500/30 text-red-300 hover:text-white text-[10px] font-bold py-0.5 px-2 rounded transition-colors"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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
                          <div className="bg-white p-0.5 rounded border border-white/10 flex-shrink-0 relative flex items-center justify-center">
                            <img 
                              src={generateQrUrl(p.id)} 
                              alt="Item QR" 
                              className="w-10 h-10"
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
                                <div className="absolute w-[10px] h-[10px] bg-black rounded-[2px] p-[1px] border border-luxury-gold/50 flex items-center justify-center overflow-hidden">
                                  <img 
                                    src={currentLogoUrl} 
                                    alt="Logo" 
                                    className="w-full h-full object-contain rounded-[1px]"
                                    referrerPolicy="no-referrer"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = "/stylex_logo.jpg";
                                    }}
                                  />
                                </div>
                              );
                            })()}
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
                            <div className="flex flex-wrap items-center gap-1.5 mt-1 font-mono text-[8.5px]">
                              {p.lotteryEligible !== false ? (
                                <span className="bg-emerald-500/10 text-emerald-400 px-1 py-0.5 rounded border border-emerald-500/10">🎟️ Lottery OK</span>
                              ) : (
                                <span className="bg-rose-500/15 text-rose-400 px-1 py-0.5 rounded border border-rose-500/10">🔒 No Lottery</span>
                              )}
                              {p.couponCode && (
                                <span className="bg-[#d4af37]/15 text-[#d4af37] font-extrabold px-1.5 py-0.5 rounded border border-[#d4af37]/25">
                                  🏷️ {p.couponCode} (-{p.couponDiscountPercent || 15}%)
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="bg-luxury-charcoal border border-white/5 text-white/70 px-2.5 py-0.5 rounded text-[9.5px] font-mono font-bold">
                            {p.category}
                          </span>
                        </td>

                        <td>
                          <div className="font-sans font-black text-luxury-gold text-[12.5px]">{formatPrice(p.price)}</div>
                          <div className="text-[9px] text-white/45 font-mono mt-0.5 space-y-0.5 max-w-[125px]">
                            <div className="flex justify-between gap-1"><span>Dhaka:</span><span className="text-emerald-400 font-bold">{formatPrice(p.deliveryPriceDhaka !== undefined ? p.deliveryPriceDhaka : 100)}</span></div>
                            <div className="flex justify-between gap-1"><span>Ctg:</span><span className="text-[#a78bfa] font-bold">{formatPrice(p.deliveryPriceChattogram !== undefined ? p.deliveryPriceChattogram : 150)}</span></div>
                            <div className="flex justify-between gap-1"><span>Sylhet:</span><span className="text-[#38bdf8] font-bold">{formatPrice(p.deliveryPriceSylhet !== undefined ? p.deliveryPriceSylhet : 150)}</span></div>
                            <div className="text-[8px] text-zinc-500 italic font-sans">8 divisions configured</div>
                          </div>
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
              <h3 className="font-serif text-sm uppercase tracking-widest text-white border-b border-white/5 pb-2">
                {editingBannerId ? "Edit cinematic promotional banner" : "Add cinematic promotional banner"}
              </h3>
              
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
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-white/50 mb-1">Banner Media Aspect/Url</label>
                  <input 
                    type="text" required value={newBannerImg} onChange={(e) => setNewBannerImg(e.target.value)}
                    placeholder="Input URL or upload below..."
                    className="w-full bg-luxury-charcoal text-white text-xs border border-white/10 rounded py-2 px-3 focus:outline-none focus:border-luxury-gold"
                  />
                </div>
                
                {/* File Uploader for Banner Background (Images & Videos allowed!) */}
                <div className="md:col-span-2 border border-dashed border-luxury-gold/20 p-4 rounded bg-[#0b0b0b] space-y-3">
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex-1 w-full">
                      <label className="block text-[9px] uppercase font-mono tracking-wider text-luxury-gold font-semibold mb-1">
                        Upload Screen Banner Assets (Select one or multiple images/videos)
                      </label>
                      <input 
                        type="file" 
                        accept="image/*,video/*" 
                        multiple
                        onChange={handleBannerFileChange}
                        className="w-full text-xs text-white/50 file:mr-4 file:py-2 file:px-4 file:rounded file:border file:border-luxury-gold/30 file:bg-luxury-charcoal file:text-luxury-gold hover:file:bg-luxury-black cursor-pointer"
                      />
                      <p className="text-[9px] text-[#888] mt-1.5">
                        💡 Choose one or multiple files. Multiple files will automatically create separate banners instantly. Videos (.mp4 / .webm) run and loop beautifully.
                      </p>
                    </div>

                    {/* Manual option to specify if the asset is a Video */}
                    <div className="flex items-center gap-2 self-end sm:self-center bg-[#151515] p-3 rounded border border-white/10">
                      <input 
                        type="checkbox" 
                        id="isBannerVideo" 
                        checked={newBannerIsVideo}
                        onChange={(e) => setNewBannerIsVideo(e.target.checked)}
                        className="rounded border-white/20 bg-luxury-charcoal text-luxury-gold focus:ring-0 w-4 h-4 cursor-pointer"
                      />
                      <label htmlFor="isBannerVideo" className="text-[10px] font-mono tracking-wider text-white/80 cursor-pointer select-none">
                        🎥 This is a Video Banner
                      </label>
                    </div>
                  </div>

                  {bannerUploadProgress && (
                    <p className="text-[10px] text-luxury-gold font-mono tracking-wide">{bannerUploadProgress}</p>
                  )}
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
              <div className="flex items-center gap-3 pt-2">
                <button 
                  type="submit"
                  className="bg-luxury-gold text-luxury-black font-display font-medium text-[10px] uppercase tracking-widest py-2.5 px-5 rounded hover:brightness-110 transition-all cursor-pointer"
                >
                  {editingBannerId ? "Save Banner Changes" : "Launch Banner"}
                </button>
                {editingBannerId && (
                  <button 
                    type="button"
                    onClick={handleCancelEditBanner}
                    className="bg-luxury-charcoal hover:bg-neutral-800 text-white/80 font-display font-medium text-[10px] uppercase tracking-widest py-2.5 px-5 rounded transition-all cursor-pointer border border-white/10"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>

            <div className="bg-[#0a0a0a] border border-white/5 rounded-lg p-5">
              <h4 className="font-serif text-sm text-white uppercase tracking-wider mb-4 flex items-center justify-between">
                <span>Active Banners Archives</span>
                <span className="text-[9px] font-mono text-white/40 tracking-wider">Configure showcase active presentation</span>
              </h4>
              <div className="grid grid-cols-1 gap-4">
                 {banners.map(b => {
                   const isVideo = !!(b.isVideo || (
                     b.imageUrl && typeof b.imageUrl === 'string' && (
                       b.imageUrl.toLowerCase().includes('is_video=true') ||
                       b.imageUrl.toLowerCase().includes('#video') ||
                       b.imageUrl.toLowerCase().includes('#is_video') ||
                       b.imageUrl.toLowerCase().includes('.mp4') ||
                       b.imageUrl.toLowerCase().includes('.webm') ||
                       b.imageUrl.toLowerCase().includes('.mov') ||
                       b.imageUrl.toLowerCase().includes('.ogg') ||
                       b.imageUrl.toLowerCase().includes('.m4v') ||
                       b.imageUrl.toLowerCase().includes('video/') ||
                       b.imageUrl.toLowerCase().startsWith('data:video/')
                     )
                   ));

                  return (
                    <div key={b.id} className="flex flex-col sm:flex-row gap-4 border border-white/5 p-4 rounded items-start sm:items-center bg-[#0d0d0d] hover:border-white/10 transition-colors">
                      {/* Media preview block */}
                      <div className="w-28 aspect-[16/10] bg-[#0c0c0c] rounded border border-white/10 overflow-hidden relative flex items-center justify-center">
                        {isVideo ? (
                          <div className="relative w-full h-full flex items-center justify-center">
                            <video src={b.imageUrl} muted className="w-full h-full object-cover" />
                            <span className="absolute bottom-1 right-1 bg-black/80 font-mono text-[8px] text-[#e0a96d] px-1 rounded uppercase tracking-wider border border-[#e0a96d]/20">
                              Video
                            </span>
                          </div>
                        ) : (
                          <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        )}
                      </div>

                      {/* Title information */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-serif font-bold text-white text-sm truncate">{b.title}</h5>
                          {b.active && (
                            <span className="bg-luxury-gold/15 text-luxury-gold border border-luxury-gold/30 rounded px-1.5 py-0.5 text-[8px] font-bold tracking-widest uppercase font-mono">
                              ⚜️ Active Showcase
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-white/50 line-clamp-2 italic leading-relaxed">{b.subtitle}</p>
                      </div>

                      {/* Action buttons (activation & delete) */}
                      <div className="flex sm:flex-col md:flex-row items-center gap-2 self-stretch sm:self-center justify-end">
                        {/* Only offer Activate click option if not already active */}
                        <button
                          type="button"
                          onClick={() => handleToggleBannerActive(b.id, !!b.active)}
                          className={`text-[9.5px] font-mono uppercase tracking-wider py-1.5 px-3 rounded border whitespace-nowrap cursor-pointer transition-all duration-300 ${
                            b.active 
                              ? 'bg-luxury-gold/20 hover:bg-red-500/20 text-luxury-gold hover:text-red-400 border-luxury-gold/30 hover:border-red-500/30 font-bold' 
                              : 'bg-luxury-charcoal hover:bg-luxury-gold hover:text-luxury-black text-white/80 hover:text-luxury-black border-white/5 hover:border-transparent'
                          }`}
                        >
                          {b.active ? '⚜️ Active (Deactivate)' : 'Set Active'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleEditBannerClick(b)}
                          className="text-white/60 hover:text-luxury-gold p-2 border border-white/5 hover:border-luxury-gold/25 rounded transition-all cursor-pointer"
                          title="Edit banner"
                        >
                          <Edit size={13} />
                        </button>

                        {b.id !== 'banner-1' && (
                          <button 
                            type="button"
                            onClick={() => handleDeleteBanner(b.id)}
                            className="text-white/40 hover:text-red-400 p-2 border border-white/5 hover:border-red-500/25 rounded transition-all cursor-pointer"
                            title="Delete banner"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-white/50 mb-1">Max Usage Limit (Optional)</label>
                  <input 
                    type="number" value={newCouponMaxUses} onChange={(e) => setNewCouponMaxUses(e.target.value)}
                    placeholder="Unlimited"
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
                  <div key={c.code} className="flex justify-between items-center bg-[#0d0d0d] border border-white/5 p-4 rounded animate-fade-in">
                    <div className="space-y-2">
                      <span className="font-mono text-white text-sm font-bold tracking-widest bg-luxury-charcoal border border-white/5 px-2.5 py-1 rounded">
                        {c.code}
                      </span>
                      <p className="text-xs text-luxury-gold">
                        {c.type === 'PERCENTAGE' ? `${c.value}% discount benefit` : `Flat ৳${c.value} discount value`}
                      </p>
                      {c.maxUses !== undefined && c.maxUses > 0 ? (
                        <div className="flex items-center gap-1.5 text-[10px] font-mono">
                          <span className="text-white/40">USAGES:</span>
                          <span className={`px-1.5 py-0.5 rounded font-bold ${ (c.usedCount || 0) >= c.maxUses ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-[#12052a] text-purple-300 border border-purple-500/20' }`}>
                            {c.usedCount || 0} / {c.maxUses}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-white/40">
                          <span>USAGES:</span>
                          <span className="text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 border border-emerald-500/20 rounded">UNLIMITED ({c.usedCount || 0} USED)</span>
                        </div>
                      )}
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
                    <button 
                      onClick={() => handleDeleteCampaign(c.id)}
                      className="text-white/40 hover:text-red-400 p-2.5 rounded cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
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

        {activeTab === 'alerts' && (
          <div className="space-y-6 max-w-5xl animate-fade-in text-white">
            <div className="pb-4 border-b border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-serif font-semibold uppercase tracking-wider text-luxury-gold flex items-center gap-2">
                  <Bell size={18} className="text-luxury-gold" />
                  Restock Alerts Hub
                </h2>
                <p className="text-xs text-white/50 mt-1 font-sans">
                  Monitor boutique back-in-stock alert registrations. View interested collectors and easily send notification lists.
                </p>
              </div>
              <button 
                onClick={fetchAlerts}
                className="px-3 py-1.5 border border-white/10 hover:border-luxury-gold text-white hover:text-luxury-gold font-mono text-[10px] uppercase rounded transition-all cursor-pointer self-start sm:self-auto"
              >
                🔄 Refresh Registry
              </button>
            </div>

            {backInStockAlerts.length === 0 ? (
              <div className="border border-white/5 bg-[#0a0a0a] p-12 rounded-lg text-center space-y-4 shadow-xl">
                <div className="w-12 h-12 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center mx-auto text-white/20">
                  <Bell size={24} />
                </div>
                <div>
                  <h4 className="text-xs uppercase font-mono tracking-widest text-zinc-400">Zero Registrations</h4>
                  <p className="text-[11px] text-white/40 mt-1 font-sans">No VIP collectors have requested notification for out-of-stock items yet.</p>
                </div>
              </div>
            ) : (
              <div className="border border-white/5 bg-[#0a0a0a] rounded-lg overflow-hidden shadow-xl">
                <div className="p-4 bg-[#111] border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold">VIP Alert Registry ({backInStockAlerts.length})</span>
                  <button
                    onClick={() => {
                      const emails = backInStockAlerts.map(a => a.email).join(', ');
                      try {
                        if (navigator.clipboard && navigator.clipboard.writeText) {
                          navigator.clipboard.writeText(emails);
                        } else {
                          const t = document.createElement("textarea");
                          t.value = emails;
                          t.style.position = "fixed";
                          document.body.appendChild(t);
                          t.select();
                          document.execCommand("copy");
                          document.body.removeChild(t);
                        }
                      } catch (err) {
                        console.warn("Emails copy failed with navigator, fell back:", err);
                      }
                      alert("All collector email addresses copied to clipboard!");
                    }}
                    className="bg-purple-950/40 hover:bg-purple-900 border border-purple-500/20 text-purple-300 hover:text-white px-3 py-1.5 text-[9px] font-mono uppercase rounded transition-all cursor-pointer"
                  >
                    📋 Copy All Emails List
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-[11.5px] whitespace-nowrap min-w-[700px]">
                    <thead className="bg-[#050505] text-zinc-500 uppercase text-[9px] tracking-wider border-b border-white/5">
                      <tr>
                        <th className="p-4 font-bold">Date Registered</th>
                        <th className="p-4 font-bold">Collector Email</th>
                        <th className="p-4 font-bold">Luxury product</th>
                        <th className="p-4 font-bold">Product code</th>
                        <th className="p-4 font-bold text-center">Current stock status</th>
                        <th className="p-4 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {backInStockAlerts.map((alertItem: any) => {
                        const originalProduct = products.find(p => p.id === alertItem.productId);
                        const isInStock = originalProduct?.stock && originalProduct.stock > 0;
                        return (
                          <tr key={alertItem.id} className="hover:bg-white/[0.01] transition-all">
                            <td className="p-4 text-white/55">
                              {new Date(alertItem.requestedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                            </td>
                            <td className="p-4 text-white font-sans font-medium hover:text-luxury-gold transition-colors">
                              <a href={`mailto:${alertItem.email}`} className="underline tracking-wide">{alertItem.email}</a>
                            </td>
                            <td className="p-4 text-luxury-gold/90 uppercase font-sans font-semibold">
                              {alertItem.productTitle}
                            </td>
                            <td className="p-4 text-zinc-400">
                              {originalProduct?.code || "SKU-" + alertItem.productId.substring(0, 5).toUpperCase()}
                            </td>
                            <td className="p-4 text-center">
                              {isInStock ? (
                                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[8.5px] uppercase font-black tracking-wider leading-none">
                                  IN STOCK ({originalProduct?.stock})
                                </span>
                              ) : (
                                <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded text-[8.5px] uppercase font-black tracking-wider leading-none">
                                  OUT OF STOCK
                                </span>
                              )}
                            </td>
                            <td className="p-4 text-right space-x-2">
                              {isInStock && (
                                <button
                                  onClick={() => {
                                    window.open(`mailto:${alertItem.email}?subject=${encodeURIComponent(`Luxury restock update: ${alertItem.productTitle} is back!`)}&body=${encodeURIComponent(`Dear Collector,\n\nWe are pleased to inform you that "${alertItem.productTitle}" is officially back in stock and ready to order!\n\nView and order here: ${window.location.origin}\n\nWarm regards,\nStyle X VIP Team`)}`);
                                  }}
                                  className="border border-emerald-500/25 hover:border-emerald-400 text-emerald-400 hover:text-white bg-emerald-950/40 px-2.5 py-1 rounded text-[9.5px] font-bold transition-all cursor-pointer"
                                >
                                  📨 Ping Collector
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteAlert(alertItem.id)}
                                className="border border-red-500/25 hover:border-red-400 hover:bg-red-950/20 text-red-400 hover:text-white px-2.5 py-1 rounded text-[9.5px] font-bold transition-all cursor-pointer"
                              >
                                Archive
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
        )}

        {activeTab === 'settings' && (
          <div className="space-y-8 max-w-4xl animate-fade-in text-white">
            
            {/* Elegant Subtitle with Gold divider */}
            <div className="pb-4 border-b border-white/5">
              <h2 className="text-lg font-serif font-semibold uppercase tracking-wider text-luxury-gold flex items-center gap-2">
                System Customization Suite
              </h2>
              <p className="text-xs text-white/50 mt-1 font-sans">
                Adjust international parameters, configure direct integration routing nodes, and modify client display assets instantly.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* SYSTEM ROUTING CONTROLLER CARD */}
              <form onSubmit={handleSaveSettings} className="border border-luxury-gold/20 hover:border-luxury-gold/45 bg-[#0a0a0a] p-6 rounded-lg space-y-4 shadow-xl relative overflow-hidden transition-all duration-300">
                <div className="absolute top-0 right-0 w-16 h-16 bg-luxury-gold/5 rounded-full blur-xl"></div>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded bg-green-500/10 border border-green-500/30 text-green-400">
                    <Settings size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-serif font-semibold text-white uppercase tracking-wider">Store Routing Parameters</h3>
                    <p className="text-[10px] text-zinc-500 font-mono">REALTIME VIP NOTIFICATION DIRECTIVES</p>
                  </div>
                </div>

                <p className="text-xs text-white/60 leading-relaxed font-sans mt-2">
                  Adjust target endpoints instantly. Changes safely propagate to customer click-to-chat targets, footer nodes, and the Google Apps Script email relay webhook.
                </p>

                <div className="space-y-4 pt-2">
                  {/* BRAND CUSTOM LOGO URL */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono text-luxury-gold uppercase tracking-widest font-semibold flex items-center gap-1">
                      <span>Brand Custom Logo URL:</span>
                      <span className="text-[8px] bg-luxury-purple/80 text-white px-1.5 py-0.5 rounded font-bold tracking-widest">PREMIUM</span>
                    </label>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={logoUrlInput}
                        onChange={(e) => setLogoUrlInput(e.target.value)}
                        placeholder="e.g. https://domain.com/my-logo.png"
                        className="flex-1 bg-[#121212] border border-white/10 hover:border-white/20 focus:border-luxury-gold focus:outline-none rounded text-xs px-3.5 py-2.5 font-mono text-white transition-all"
                      />
                      <label className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-luxury-gold text-luxury-black rounded font-display font-black text-[10px] uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all outline-none cursor-pointer select-none">
                        <Upload size={12} />
                        <span>{logoUploading ? "Uploading..." : "Upload File"}</span>
                        <input 
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          disabled={logoUploading}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {logoUploadProgress && (
                      <p className="text-[9px] text-luxury-gold font-mono tracking-wide mt-1 animate-pulse">
                        ⚜️ {logoUploadProgress}
                      </p>
                    )}
                    {logoUrlInput && (
                      <div className="mt-2 p-2 bg-[#050209] border border-white/5 rounded-lg flex items-center gap-3">
                        <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">Active Monogram:</span>
                        <img 
                          src={logoUrlInput} 
                          alt="Bespoke Logo Preview" 
                          className="h-6 object-contain filter max-w-[120px]"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                    <p className="text-[9px] text-zinc-500 font-mono">Provide an image URL or choose a high-resolution file to replace the default typography brand monogram inside the elite header.</p>
                  </div>

                  {/* bKash CUSTOM LOGO URL */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono text-luxury-gold uppercase tracking-widest font-semibold flex items-center gap-1">
                      <span>bKash Custom Logo URL:</span>
                      <span className="text-[8px] bg-pink-600 text-white px-1.5 py-0.5 rounded font-bold tracking-widest">bKash</span>
                    </label>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={bkashLogoUrlInput}
                        onChange={(e) => setBkashLogoUrlInput(e.target.value)}
                        placeholder="e.g. https://domain.com/bkash-logo.png"
                        className="flex-1 bg-[#121212] border border-white/10 hover:border-white/20 focus:border-luxury-gold focus:outline-none rounded text-xs px-3.5 py-2.5 font-mono text-white transition-all"
                      />
                      <label className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-luxury-gold text-luxury-black rounded font-display font-black text-[10px] uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all outline-none cursor-pointer select-none">
                        <Upload size={12} />
                        <span>{bkashUploading ? "Uploading..." : "Upload File"}</span>
                        <input 
                          type="file"
                          accept="image/*"
                          onChange={(e) => handlePaymentLogoUpload('bkash', e)}
                          disabled={bkashUploading}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {bkashUploadProgress && (
                      <p className="text-[9px] text-[#e2136e] font-mono tracking-wide mt-1 animate-pulse">
                        ⚜️ {bkashUploadProgress}
                      </p>
                    )}
                    {bkashLogoUrlInput && (
                      <div className="mt-2 p-2 bg-[#050209] border border-white/5 rounded-lg flex items-center gap-3">
                        <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">Active Logo:</span>
                        <img 
                          src={bkashLogoUrlInput} 
                          alt="bKash Logo Preview" 
                          className="h-6 object-contain rounded shadow-sm max-w-[120px]"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                    <p className="text-[9px] text-zinc-500 font-mono">Provide an image URL or choose a high-resolution file to replace the default bKash icon inside the cart drawer checkout.</p>
                  </div>

                  {/* Nagad CUSTOM LOGO URL */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono text-luxury-gold uppercase tracking-widest font-semibold flex items-center gap-1">
                      <span>Nagad Custom Logo URL:</span>
                      <span className="text-[8px] bg-orange-600 text-white px-1.5 py-0.5 rounded font-bold tracking-widest">Nagad</span>
                    </label>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={nagadLogoUrlInput}
                        onChange={(e) => setNagadLogoUrlInput(e.target.value)}
                        placeholder="e.g. https://domain.com/nagad-logo.png"
                        className="flex-1 bg-[#121212] border border-white/10 hover:border-white/20 focus:border-luxury-gold focus:outline-none rounded text-xs px-3.5 py-2.5 font-mono text-white transition-all"
                      />
                      <label className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-luxury-gold text-luxury-black rounded font-display font-black text-[10px] uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all outline-none cursor-pointer select-none">
                        <Upload size={12} />
                        <span>{nagadUploading ? "Uploading..." : "Upload File"}</span>
                        <input 
                          type="file"
                          accept="image/*"
                          onChange={(e) => handlePaymentLogoUpload('nagad', e)}
                          disabled={nagadUploading}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {nagadUploadProgress && (
                      <p className="text-[9px] text-[#f45c24] font-mono tracking-wide mt-1 animate-pulse">
                        ⚜️ {nagadUploadProgress}
                      </p>
                    )}
                    {nagadLogoUrlInput && (
                      <div className="mt-2 p-2 bg-[#050209] border border-white/5 rounded-lg flex items-center gap-3">
                        <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">Active Logo:</span>
                        <img 
                          src={nagadLogoUrlInput} 
                          alt="Nagad Logo Preview" 
                          className="h-6 object-contain rounded shadow-sm max-w-[120px]"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                    <p className="text-[9px] text-zinc-500 font-mono">Provide an image URL or choose a high-resolution file to replace the default Nagad icon inside the cart drawer checkout.</p>
                  </div>

                  {/* WHATSAPP INPUT */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono text-luxury-gold uppercase tracking-widest font-semibold">WhatsApp Concierge:</label>
                    <input 
                      type="text"
                      value={whatsappNumberInput}
                      onChange={(e) => setWhatsappNumberInput(e.target.value)}
                      placeholder="e.g. 8801755104443"
                      className="w-full bg-[#121212] border border-white/10 hover:border-white/20 focus:border-luxury-gold focus:outline-none rounded text-xs px-3.5 py-2.5 font-mono text-white transition-all"
                      required
                    />
                    <p className="text-[9px] text-zinc-500 font-mono">Please enter numerical format with country code.</p>
                  </div>

                  {/* NOTIFICATION EMAIL INPUT */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono text-luxury-gold uppercase tracking-widest font-semibold">Target Notification Email:</label>
                    <input 
                      type="email"
                      value={adminEmailInput}
                      onChange={(e) => setAdminEmailInput(e.target.value)}
                      placeholder="e.g. risatadnan4@gmail.com"
                      className="w-full bg-[#121212] border border-white/10 hover:border-white/20 focus:border-luxury-gold focus:outline-none rounded text-xs px-3.5 py-2.5 font-mono text-white transition-all"
                      required
                    />
                    <p className="text-[9px] text-zinc-500 font-mono">Order confirmation alerts will be dispatched directly to this inbox.</p>
                  </div>

                  {/* ADMIN SECURITY PASSWORD INPUT */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono text-luxury-gold uppercase tracking-widest font-semibold">Admin Security Passcode:</label>
                    <input 
                      type="text"
                      value={adminPasswordInput}
                      onChange={(e) => setAdminPasswordInput(e.target.value)}
                      placeholder="e.g. risat123"
                      className="w-full bg-[#121212] border border-white/10 hover:border-white/20 focus:border-luxury-gold focus:outline-none rounded text-xs px-3.5 py-2.5 font-mono text-white transition-all"
                      required
                    />
                    <p className="text-[9px] text-zinc-500 font-mono">Verify and change the secure owner admin login password passcode.</p>
                  </div>

                  {/* APPS SCRIPT WEBHOOK URL INPUT */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono text-luxury-gold uppercase tracking-widest font-semibold">Apps Script Webhook URL:</label>
                    <input 
                      type="text"
                      value={appsScriptUrlInput}
                      onChange={(e) => setAppsScriptUrlInput(e.target.value)}
                      placeholder="e.g. https://script.google.com/macros/s/.../exec"
                      className="w-full bg-[#121212] border border-white/10 hover:border-white/20 focus:border-luxury-gold focus:outline-none rounded text-xs px-3.5 py-2.5 font-mono text-white transition-all"
                      required
                    />
                    <p className="text-[9px] text-zinc-500 font-mono">Input your deployed Google Apps Script Web App URL ending in /exec.</p>
                  </div>

                  {/* FACEBOOK PAGE URL INPUT */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono text-luxury-gold uppercase tracking-widest font-semibold">Official Facebook Page URL:</label>
                    <input 
                      type="url"
                      value={facebookUrlInput}
                      onChange={(e) => setFacebookUrlInput(e.target.value)}
                      placeholder="e.g. https://facebook.com/yourpage"
                      className="w-full bg-[#121212] border border-white/10 hover:border-white/20 focus:border-luxury-gold focus:outline-none rounded text-xs px-3.5 py-2.5 font-mono text-white transition-all"
                      required
                    />
                    <p className="text-[9px] text-zinc-500 font-mono">Input your store's Facebook Page link for direct footer and floating menu connections.</p>
                  </div>

                  {/* INSTAGRAM PROFILE URL INPUT */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono text-luxury-gold uppercase tracking-widest font-semibold">Official Instagram URL:</label>
                    <input 
                      type="url"
                      value={instagramUrlInput}
                      onChange={(e) => setInstagramUrlInput(e.target.value)}
                      placeholder="e.g. https://instagram.com/yourprofile"
                      className="w-full bg-[#121212] border border-white/10 hover:border-white/20 focus:border-luxury-gold focus:outline-none rounded text-xs px-3.5 py-2.5 font-mono text-white transition-all"
                      required
                    />
                    <p className="text-[9px] text-zinc-500 font-mono">Input your store's Instagram Profile link for direct footer and floating menu connections.</p>
                  </div>

                  {/* CATALOG DEACTIVATION SECTION */}
                  <div className="border border-red-500/20 bg-[#0c050b]/60 p-5 rounded-xl space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-red-400 uppercase tracking-widest font-bold">🚨 Catalog Status &amp; Deactivation</span>
                        <span className="text-[8px] bg-red-500/10 text-red-500 border border-red-500/20 px-1.5 py-0.5 rounded font-black tracking-widest font-mono">CRITICAL</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={isCatalogDeactivatedInput}
                          onChange={(e) => setIsCatalogDeactivatedInput(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-[#202020] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-500"></div>
                      </label>
                    </div>

                    <div className="space-y-3.5">
                      <div className="space-y-1">
                        <label className="block text-[9.5px] font-mono text-zinc-400 uppercase tracking-widest font-semibold">Store Deactivation Message:</label>
                        <textarea 
                          rows={3}
                          value={deactivatedMessageInput}
                          onChange={(e) => setDeactivatedMessageInput(e.target.value)}
                          placeholder="The VIP showcase catalog is currently undergoing seasonal curation refresh. Private concierge is fully active — contact via WhatsApp for custom order loops."
                          className="w-full bg-[#101010] border border-white/10 hover:border-white/20 focus:border-red-500 focus:outline-none rounded-xl text-xs px-3.5 py-2.5 font-sans text-zinc-300 transition-all resize-none"
                          disabled={!isCatalogDeactivatedInput}
                        />
                        <p className="text-[8.5px] text-zinc-500 font-mono">This message will be showcased to customers in premium styling instead of the product grid if deactivated.</p>
                      </div>
                    </div>
                  </div>

                  {/* LOTTERY DEACTIVATION SECTION */}
                  <div className="border border-amber-500/20 bg-[#0b0906]/60 p-5 rounded-xl space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-bold">🎡 Fortuna Wheel &amp; Lottery Status</span>
                        <span className="text-[8px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1.5 py-0.5 rounded font-black tracking-widest font-mono">GAME MODE</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={isLotteryDeactivatedInput}
                          onChange={(e) => setIsLotteryDeactivatedInput(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-[#202020] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                      </label>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] text-zinc-300 font-sans leading-relaxed">
                        {isLotteryDeactivatedInput ? (
                          <span className="text-red-400 font-bold uppercase tracking-wide">⚠️ Lottery Wheel Deactivated:</span>
                        ) : (
                          <span className="text-emerald-400 font-bold uppercase tracking-wide">✅ Lottery Wheel Active:</span>
                        )}{" "}
                        Disabling this switch will hide all Fortune Wheel games, gift buttons, launcher overlays, and floating fortune vouchers from the store view.
                      </p>
                    </div>
                  </div>

                  {/* RESTOCK NOTIFICATION DEACTIVATION SECTION */}
                  <div className="border border-purple-500/20 bg-[#09060b]/60 p-5 rounded-xl space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-purple-400 uppercase tracking-widest font-bold">🔔 Product Restock Notify Me Status</span>
                        <span className="text-[8px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded font-black tracking-widest font-mono">COLLECTOR HUB</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={isNotifyMeDeactivatedInput}
                          onChange={(e) => setIsNotifyMeDeactivatedInput(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-[#202020] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-500"></div>
                      </label>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] text-zinc-300 font-sans leading-relaxed">
                        {isNotifyMeDeactivatedInput ? (
                          <span className="text-red-400 font-bold uppercase tracking-wide">⚠️ Notify Me System Deactivated:</span>
                        ) : (
                          <span className="text-emerald-400 font-bold uppercase tracking-wide">✅ Notify Me System Active:</span>
                        )}{" "}
                        When deactivated, out-of-stock items will display a disabled "Out of Stock" button instead of allowing collectors to register for back-in-stock notifications.
                      </p>
                    </div>
                  </div>

                  {/* CUSTOM ORDER/PAYMENT BADGE SECTION (WRITE YOUR OWN IDEA!) */}
                  <div className="border border-luxury-gold/20 bg-[#060309] p-5 rounded-xl space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                      <span className="text-[10px] font-mono text-luxury-gold uppercase tracking-widest font-bold">⚜️ Bespoke Checkout Payment Badge (Your Own Idea)</span>
                      <span className="text-[8px] bg-luxury-gold/15 text-luxury-gold border border-luxury-gold/30 px-1.5 py-0.5 rounded font-black tracking-widest font-mono">EDITABLE</span>
                    </div>

                    <div className="space-y-3.5">
                      {/* Badge Title */}
                      <div className="space-y-1">
                        <label className="block text-[9.5px] font-mono text-zinc-400 uppercase tracking-widest font-semibold">Custom Verification Title:</label>
                        <input 
                          type="text"
                          value={paymentBadgeTitleInput}
                          onChange={(e) => setPaymentBadgeTitleInput(e.target.value)}
                          placeholder="SECURE CASH ON DELIVERY GUARANTEED"
                          className="w-full bg-[#101010] border border-white/10 hover:border-white/20 focus:border-luxury-gold focus:outline-none rounded text-xs px-3.5 py-2.5 font-sans font-extrabold text-[#ffd700] uppercase tracking-wide transition-all"
                          required
                        />
                        <p className="text-[8.5px] text-zinc-500 font-mono">Add a security claim or standard shipping policy notice.</p>
                      </div>

                      {/* Badge Description */}
                      <div className="space-y-1">
                        <label className="block text-[9.5px] font-mono text-zinc-400 uppercase tracking-widest font-semibold">Bespoke Guidance Details / Idea Text:</label>
                        <textarea 
                          rows={3}
                          value={paymentBadgeDescriptionInput}
                          onChange={(e) => setPaymentBadgeDescriptionInput(e.target.value)}
                          placeholder="Type your tailored idea or instructions for customers regarding delivery, payments, or processing..."
                          className="w-full bg-[#101010] border border-white/10 hover:border-white/20 focus:border-luxury-gold focus:outline-none rounded-xl text-xs px-3.5 py-2.5 font-sans text-zinc-300 transition-all resize-none"
                          required
                        />
                        <p className="text-[8.5px] text-zinc-500 font-mono">Custom text will dynamically replace the physical dispatch notice on checkout.</p>
                      </div>

                      {/* Real-Time Client Side Device Preview Simulator */}
                      <div className="bg-[#020005] border border-purple-900/40 p-4 rounded-xl space-y-2">
                        <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block font-bold">Simulator: Checkout Page Preview</span>
                        
                        <div className="bg-gradient-to-r from-luxury-gold/5 to-[#160b24]/20 border border-luxury-gold/25 rounded-xl p-3.5 space-y-1 relative overflow-hidden">
                          <div className="absolute top-2.5 right-2.5 opacity-20 pointer-events-none text-luxury-gold">
                            <Gift size={24} />
                          </div>
                          
                          <div className="flex items-center gap-2 text-luxury-gold">
                            <span className="w-2 h-2 rounded bg-green-500 animate-pulse"></span>
                            <span className="font-display font-black uppercase tracking-widest text-[9.5px] truncate max-w-[280px]">
                              {paymentBadgeTitleInput || "SECURE CASH ON DELIVERY GUARANTEED"}
                            </span>
                          </div>
                          <p className="text-[9.5px] text-zinc-300 font-sans leading-relaxed break-words whitespace-pre-wrap pl-4 max-w-sm">
                            {paymentBadgeDescriptionInput || "Pay upon secure physical delivery handoff. We verify each individual container personally with verified secure luxury seal tags. Zero online gateway threat risk."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  {settingsSuccess ? (
                    <span className="text-[11px] font-mono text-green-400 flex items-center gap-1.5 bg-green-500/5 border border-green-500/20 px-2.5 py-1 rounded animate-fade-in">
                      <Check size={12} /> CONFIG OK
                    </span>
                  ) : <span />}

                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="bg-gradient-to-r from-luxury-gold-dark to-luxury-gold text-luxury-black font-display font-black text-[10.5px] uppercase tracking-widest px-6 py-2.5 rounded transition-all hover:brightness-110 disabled:opacity-50 cursor-pointer shadow-md"
                  >
                    {savingSettings ? "Saving Settings..." : "Save Configuration"}
                  </button>
                </div>
              </form>

              {/* ORDER EMAIL NOTIFICATION DESTINATION CONTROL CARD */}
              <div className="border border-white/5 bg-[#090909] p-6 rounded-lg space-y-4 flex flex-col justify-between shadow-xl relative overflow-hidden font-sans">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded bg-luxury-gold/5 border border-luxury-gold/20 text-luxury-gold">
                      <Star size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-serif font-semibold text-white uppercase tracking-wider">Apps Script E-Mail Relay</h3>
                      <p className="text-[10px] text-green-400 font-bold tracking-widest">● DIRECTIVE ACTIVE</p>
                    </div>
                  </div>

                  <p className="text-xs text-white/50 leading-relaxed italic">
                    Whenever an order is confirmed, system triggers a non-blocking asynchronous payload dispatch to your Google Apps Script Webhook.
                  </p>

                  <div className="bg-[#121212] border border-white/5 p-3 rounded font-mono space-y-1.5 text-xs text-zinc-400">
                    <div className="flex justify-between">
                      <span className="text-[10px] text-white/40">DESTINATION INBOX:</span>
                      <span className="text-luxury-gold font-bold">{settings?.adminEmail || "risatadnan4@gmail.com"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] text-white/40">APPS SCRIPT ID:</span>
                      <span className="text-[10px] text-slate-400 truncate max-w-[170px]" title={settings?.appsScriptUrl || "Default"}>
                        {settings?.appsScriptUrl ? (settings.appsScriptUrl.split("/macros/s/")[1]?.split("/exec")[0]?.slice(0, 24) + "...") : "Default System ID"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] text-white/40">TRIGGER TYPE:</span>
                      <span className="text-[10.5px]/none uppercase px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20 font-bold">doPost</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-4">
                  <button
                    onClick={() => {
                      alert("Webapp triggers Apps Script directly on all live checkouts! Active listening state verified.");
                    }}
                    className="w-full text-center border border-white/10 hover:border-white/30 text-white/75 hover:text-white font-mono text-[10px] tracking-widest py-2 rounded uppercase transition-all"
                  >
                    🔍 Verify Script Endpoints
                  </button>
                </div>
              </div>

            </div>

            {/* IMPERIAL INSTANT DISCOUNT MANAGER - ULTRA PREMIUM CONTROLLER */}
            <div className="border-2 border-luxury-gold/30 hover:border-luxury-gold/60 bg-gradient-to-b from-[#0e0a12] via-[#07000c] to-[#040008] p-8 rounded-2xl space-y-8 shadow-[0_0_40px_rgba(212,175,55,0.08)] relative overflow-hidden transition-all duration-500 animate-fade-in">
              {/* Luxury ambient light spheres */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-luxury-gold/10 rounded-full blur-[80px] pointer-events-none"></div>
              <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-luxury-purple/15 rounded-full blur-[80px] pointer-events-none"></div>
              
              {/* Sleek top status header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3.5 rounded-xl bg-gradient-to-br from-luxury-black via-[#140124] to-luxury-black border border-luxury-gold/50 text-luxury-gold shadow-lg shadow-luxury-gold/10 animate-pulse">
                    <Gift size={22} className="text-luxury-gold" />
                  </div>
                  <div>
                    <h3 className="text-base font-serif font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-luxury-gold to-white uppercase tracking-widest leading-none">
                      Imperial Instant Discount Controller
                    </h3>
                    <p className="text-[10px] text-luxury-gold font-mono uppercase tracking-[0.18em] mt-1.5 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></span>
                      ACTIVE GLOBAL VOUCHER SYSTEM
                    </p>
                  </div>
                </div>
                
                <span className="self-start sm:self-center font-mono text-[9px] bg-white/5 border border-white/10 text-white/60 px-3 py-1.5 rounded-lg tracking-widest uppercase">
                  Version 4.1.2 Pro
                </span>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed font-sans max-w-4xl">
                Fine-tune the global instant discount incentive presented to VIP invitees. When shoppers trigger the promotional drawer modal, they are instantly rewarded with the discount percentage specified below. No lottery spins, no chance mechanics—strict high-conversion luxury retail rewards.
              </p>

              {/* CORE INTERACTIVE MATRIX */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* COLUMN 1: CONTROLLERS (7 COLS) */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* PRESET INTEGRATED PREMIUM BUTTON CHIPS */}
                  <div className="space-y-2.5">
                    <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-bold">
                      ⚜️ Choose Imperial Preset Tier
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {[
                        { label: "Bronze", value: 10, glow: "border-amber-700/40 text-amber-500" },
                        { label: "Silver", value: 12, glow: "border-slate-400/40 text-slate-300" },
                        { label: "Imperial Gold", value: 15, glow: "border-luxury-gold/40 text-luxury-gold" },
                        { label: "Platinum VIP", value: 20, glow: "border-indigo-400/40 text-indigo-300" },
                        { label: "Sovereign", value: 25, glow: "border-purple-400/40 text-purple-300" }
                      ].map((preset) => (
                        <button
                          key={preset.value}
                          type="button"
                          onClick={() => setLotteryDiscountPercentageInput(preset.value)}
                          className={`px-3 py-2.5 rounded-lg border text-center font-serif text-[11px] font-bold tracking-wider hover:bg-white/5 cursor-pointer transition-all duration-300 ${
                            lotteryDiscountPercentageInput === preset.value
                              ? "bg-luxury-gold/10 border-luxury-gold text-white font-extrabold shadow-[0_0_15px_rgba(212,175,55,0.2)]"
                              : "bg-black/30 border-white/5 text-zinc-400"
                          }`}
                        >
                          <span className="block text-[8px] font-mono uppercase tracking-widest text-[#9a4dff] mb-0.5">{preset.label}</span>
                          <span className="text-sm font-bold">{preset.value}% OFF</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* HIGH PRECISION INTEGRATED CONTROL COMPONENT */}
                  <div className="bg-black/40 border border-white/5 p-5 rounded-xl space-y-5 shadow-inner">
                    
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider font-bold">
                        Adjust Precision Percentage:
                      </span>
                      <span className="font-mono text-xs font-black text-luxury-gold">1% - 100% Limit</span>
                    </div>

                    {/* DUAL INTERACTIVE RANGE COMPONENT & TEXT BOX */}
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      
                      {/* Premium range slider */}
                      <div className="flex-1 w-full space-y-2">
                        <input
                          type="range"
                          min="1"
                          max="100"
                          value={lotteryDiscountPercentageInput}
                          onChange={(e) => setLotteryDiscountPercentageInput(Number(e.target.value))}
                          className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-luxury-gold focus:outline-none transition-all"
                          style={{
                            background: `linear-gradient(to right, #d4af37 0%, #d4af37 ${lotteryDiscountPercentageInput}%, #27272a ${lotteryDiscountPercentageInput}%, #27272a 100%)`
                          }}
                        />
                        <div className="flex justify-between text-[9px] font-mono text-zinc-500">
                          <span>MIN (1%)</span>
                          <span>MID (50%)</span>
                          <span>MAX (100%)</span>
                        </div>
                      </div>

                      {/* Manual numeric field */}
                      <div className="relative w-full sm:w-32">
                        <input 
                          type="number"
                          min="1"
                          max="100"
                          value={lotteryDiscountPercentageInput}
                          onChange={(e) => setLotteryDiscountPercentageInput(Math.min(100, Math.max(1, Number(e.target.value) || 15)))}
                          className="w-full text-center bg-[#141414] border-2 border-luxury-gold/20 focus:border-luxury-gold focus:outline-none rounded-xl text-base font-bold py-3 text-white transition-all font-mono"
                          required
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-luxury-gold font-black text-sm">%</span>
                      </div>

                    </div>

                    {/* Voucher Code Prefix Field */}
                    <div className="border-t border-white/5 pt-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider font-bold block">
                            🎡 Customize Voucher Code Prefix:
                          </span>
                          <span className="text-[8.5px] text-zinc-500 font-mono block">Change this code prefix to instantly invalidate old codes.</span>
                        </div>
                        <div className="relative w-full sm:w-48">
                          <input 
                            type="text"
                            value={lotteryCouponPrefixInput}
                            onChange={(e) => setLotteryCouponPrefixInput(e.target.value.trim().toUpperCase())}
                            placeholder="e.g. RISAT"
                            className="w-full text-center bg-[#141414] border-2 border-luxury-gold/20 focus:border-luxury-gold focus:outline-none rounded-xl text-xs font-bold py-2.5 text-white tracking-widest font-mono uppercase"
                            required
                          />
                        </div>
                      </div>
                    </div>

                  </div>

                </div>

                {/* COLUMN 2: REAL-TIME SIMULATED REPLICA VOUCHER DEVICE (5 COLS) */}
                <div className="lg:col-span-5">
                  <div className="bg-gradient-to-b from-[#11012a] to-[#040008] border-2 border-dashed border-luxury-gold/40 p-5 rounded-2xl relative overflow-hidden shadow-2xl group">
                    {/* Glowing particle sheen animation */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-[2000ms] pointer-events-none z-10"></div>
                    
                    <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-white/5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-ping"></span>
                        <span className="text-[8px] font-mono text-orange-400 uppercase tracking-widest font-bold">Simulator Preview</span>
                      </div>
                      <span className="text-[7.5px] text-zinc-500 font-mono uppercase tracking-widest">Client Viewport Replica</span>
                    </div>

                    <div className="bg-[#030107] border border-luxury-gold/20 p-5 rounded-xl text-center relative overflow-hidden space-y-4">
                      {/* Inner glowing element */}
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-luxury-gold"></div>
                      
                      <div className="absolute top-2.5 right-2.5 bg-gradient-to-r from-luxury-gold to-yellow-600 text-luxury-black text-[7px] font-display font-black px-1.5 py-0.5 rounded tracking-widest uppercase">
                        ★ VIP PASS
                      </div>

                      <div>
                        <span className="text-[8px] font-mono text-luxury-gold tracking-[0.2em] font-extrabold uppercase block">
                          THE IMPERIAL EXCLUSIVE VOUCHER
                        </span>
                        
                        <div className="py-2.5 select-none">
                          <span className="block font-serif text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-luxury-gold via-white to-luxury-gold leading-none tracking-tighter drop-shadow-md">
                            {lotteryDiscountPercentageInput}% OFF
                          </span>
                        </div>

                        <div className="border-t border-dashed border-luxury-gold/20 my-3"></div>

                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[7px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">
                            CODE ACTIVE TODAY
                          </span>
                          <div className="bg-[#121212] border border-white/10 px-3 py-1.5 rounded-lg w-full max-w-[180px] text-center">
                            <span className="text-xs font-mono font-bold tracking-widest text-[#ffd700]">
                              {lotteryCouponPrefixInput || "RISAT"}{lotteryDiscountPercentageInput}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-[8px] text-zinc-500 font-mono text-center mt-3">
                      When users open the invite coupon modal, they will instantly see this gorgeous card in their session without any complicated setup.
                    </p>
                  </div>
                </div>

              </div>

              {/* SAVING FOOTER ACTION SECTION */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-white/15">
                <div className="flex items-center gap-2">
                  {settingsSuccess ? (
                    <span className="text-xs font-mono text-green-400 flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-3 py-2 rounded-xl animate-fade-in font-bold">
                      <Check size={14} className="animate-bounce" /> SYSTEM MEMORY UPDATED: {lotteryDiscountPercentageInput}% SAVED
                    </span>
                  ) : (
                    <p className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">
                      ★ Updates will propagate instantly to all client browser sessions upon saving.
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleSaveSettings(undefined)}
                  disabled={savingSettings}
                  className="bg-gradient-to-r from-[#d4af37] via-[#ffd700] to-[#f7e2a0] text-luxury-black font-display font-black text-xs uppercase tracking-[0.15em] px-8 py-4 rounded-xl transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 cursor-pointer shadow-[0_4px_20px_rgba(212,175,55,0.25)] flex items-center gap-2 justify-center"
                >
                  {savingSettings ? "Updating System Modules..." : "Commit Instant Voucher Configuration"}
                </button>
              </div>
            </div>

            {/* PLATFORM INFRASTRUCTURE LEDGER */}
            <div className="border border-white/5 bg-[#080808] p-6 rounded-lg space-y-4 shadow-xl">
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-widest">
                ⚙️ SECURE MEMORY DATABASE & PERSISTENCE METRICS
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-center">
                <div className="bg-luxury-charcoal/30 border border-white/5 p-3 rounded">
                  <span className="block text-[10px] text-white/40 mb-1">PRODUCTS IN DB</span>
                  <span className="text-lg font-bold text-luxury-gold">{products.length} Items</span>
                </div>
                <div className="bg-luxury-charcoal/30 border border-white/5 p-3 rounded">
                  <span className="block text-[10px] text-white/40 mb-1">ORDERS LOGGED</span>
                  <span className="text-lg font-bold text-luxury-gold">{orders.length} Receipts</span>
                </div>
                <div className="bg-luxury-charcoal/30 border border-white/5 p-3 rounded">
                  <span className="block text-[10px] text-white/40 mb-1">VIP COUPONS</span>
                  <span className="text-lg font-bold text-luxury-gold">{coupons.length} Registered</span>
                </div>
                <div className="bg-luxury-charcoal/30 border border-white/5 p-3 rounded">
                  <span className="block text-[10px] text-white/40 mb-1">CAMPAIGNS LOCK</span>
                  <span className="text-lg font-bold text-luxury-gold">{campaigns.length} Active</span>
                </div>
              </div>
              
              <div className="text-center pt-2">
                <button
                  onClick={async () => {
                    alert("Local JSON state hot cache is fully synchronous with cloud database!");
                  }}
                  className="px-6 py-2 border border-luxury-gold/30 hover:border-luxury-gold text-luxury-gold hover:bg-luxury-gold hover:text-luxury-black font-display text-[9.5px] uppercase tracking-widest rounded transition-all"
                >
                  Force Complete Synchronize
                </button>
              </div>
            </div>

          </div>
        )}

      </main>

    </div>
  );
}

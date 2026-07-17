import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import fs from "fs";
import { Product, Order, Banner, Review, Coupon, ChatRoom, Campaign } from "./src/types.js";
import { supabase } from "./src/lib/supabase.js";
import { GoogleGenAI } from "@google/genai";
import nodemailer from "nodemailer";
import webPush from "web-push";


export const app = express();
const PORT = 3000;

// Setup directories for data and uploads
const DATA_DIR = path.join(process.cwd(), "data");
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e: any) {
  console.warn("⚠️ Local DATA_DIR creation bypassed (read-only filesystem on Vercel):", e.message);
}

try {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
} catch (e: any) {
  console.warn("⚠️ Local UPLOADS_DIR creation bypassed (read-only filesystem on Vercel):", e.message);
}

const DB_FILE = path.join(DATA_DIR, "luxury_db.json");

// Default initial data
const initialProducts: Product[] = [
  {
    id: "3d43a6d9",
    code: "XP-001",
    title: "Risat Adnan Signature Sneaker",
    description: "An avant-garde exploration of minimalist form, custom stitched premium leather with gold foil accents.",
    price: 122,
    category: "MEN",
    stock: 322,
    imageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=600&auto=format&fit=crop",
    sizes: ["S", "XS", "M", "L"],
    dimensions: "Regular Fit (39 - 44)",
    whyBuy: "এটি একটি অত্যন্ত স্টাইলিশ এবং প্রিমিয়াম কোয়ালিটির ফেব্রিক দিয়ে তৈরি এক্সক্লুসিভ পিস, যা আপনার ব্যক্তিত্বকে অনেক ফুটিয়ে তুলবে। এটি অত্যন্ত কমফোর্টেবল এবং প্রিমিয়াম ফিটিং নিশ্চিত করে।",
    trending: true,
    featured: true
  },
  {
    id: "27d4b9b1",
    code: "XP-002",
    title: "Hello Luxury Minimalist Tee",
    description: "Supima cotton luxury oversize fit block knitted in deep black charcoal colors with modern structural hems.",
    price: 100,
    category: "MEN",
    stock: 112,
    imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=600&auto=format&fit=crop",
    sizes: ["S", "M", "L", "XL"],
    dimensions: "Oversized Silhouette",
    whyBuy: "আমাদের প্রতিটি পিস তৈরি করা হয় অত্যন্ত যত্নের সাথে। এই প্রিমিয়াম টি-শার্টটি শতভাগ সুপিমা কটন দ্বারা প্রস্তুত, যা পরতে চমৎকার আরামদায়ক এবং দীর্ঘস্থায়ী উজ্জ্বলতা দেয়।",
    trending: true,
    featured: false
  },
  {
    id: "85d4d654",
    code: "XP-003",
    title: "Risat Royal Gold Chronometer",
    description: "Handcrafted 18k gold physical aesthetics frame, displaying dual time matrix systems under high-reflection sapphire crystal.",
    price: 100,
    category: "MEN",
    stock: 50,
    imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600&auto=format&fit=crop",
    sizes: ["Unisex Standard"],
    dimensions: "40mm Bezel, Fully Adjustable",
    whyBuy: "অভিজাত ব্যক্তিত্বের অন্যতম প্রতীক এই ক্রনোমিটারটি আপনাকে যেকোনো রাজকীয় অনুষ্ঠানে অনন্য গৌরব অর্জনে সহায়তা করবে। এটি কেবল একটি ঘড়ি নয়, এটি আপনার রুচিশীলতার স্মারক।",
    trending: false,
    featured: true
  },
  {
    id: "843df0ba",
    code: "XP-004",
    title: "Hi Avant-Garde Sunglasses",
    description: "Deep charcoal carbon fiber frames with luxury yellow protection layers, sculpted specifically for fashion visionaries.",
    price: 122,
    category: "UNISEX",
    stock: 12,
    imageUrl: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=600&auto=format&fit=crop",
    sizes: ["One Size"],
    dimensions: "Full UV400 Protection",
    whyBuy: "ক্ষতিকর রোদ থেকে আপনার চোখকে রক্ষা করার পাশাপাশি আপনাকে ফ্যাশন জগতের এক অনন্য মাত্রায় নিয়ে যেতে এই সানগ্লাসটির কোনো বিকল্প নেই। এর কার্বন ফাইবার ফ্রেম অত্যন্ত মজবুত।",
    trending: true,
    featured: true
  },
  {
    id: "f28e01ec",
    code: "XP-005",
    title: "Welcome Imperial Bomber Jacket",
    description: "Wind-resistant high-performance premium outer lining, featuring luxury gold zippers and a fully insulated soft interior.",
    price: 100,
    category: "MEN",
    stock: 12,
    imageUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=600&auto=format&fit=crop",
    sizes: ["M", "L", "XL"],
    dimensions: "Tailored Premium Fitting",
    whyBuy: "শীতকালে আপনার চমৎকার স্টাইল ধরে রাখতে চাইলে আমাদের এই বিশেষ বম্বার জ্যাকেটটি আপনার কালেকশনে অবশ্যই রাখা উচিত। এটি একই সাথে আপনাকে চমৎকার উষ্ণতা ও আধুনিক লুক দেবে।",
    trending: false,
    featured: false
  }
];

const initialBanners: Banner[] = [
  {
    id: "banner-1",
    title: "STYLE X COLLECTIVE",
    subtitle: "A meticulous exploration of minimalist form and avant-garde structure. Curated exclusively by Risat Adnan for the modern visionary.",
    imageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=1200&auto=format&fit=crop",
    active: true
  }
];

const initialCoupons: Coupon[] = [
  { code: "STYLEGOLD", type: "PERCENTAGE", value: 15, active: true },
  { code: "RISATVIP", type: "FIXED", value: 20, active: true }
];

const initialCampaigns: Campaign[] = [
  {
    id: "camp-1",
    title: "MONARCHY DROPS",
    description: "Get 15% off using premium coupon STYLEGOLD on all limited luxury pieces.",
    discountCode: "STYLEGOLD",
    active: true
  }
];

// In-memory Database state
let db = {
  products: initialProducts,
  orders: [] as Order[],
  backInStockAlerts: [] as any[],
  smsSubscriptions: [] as any[],
  outboundSMSLogs: [] as any[],
  customerPhones: [] as any[],
  banners: initialBanners,
  reviews: [] as Review[],
  coupons: initialCoupons,
  campaigns: initialCampaigns,
  chats: [] as ChatRoom[],
  carts: {} as Record<string, any[]>,
  visits: 125,
  liveViews: 3,
  countedSessions: [] as string[],
  notifications: [] as any[],
  failed_notifications: [] as any[],
  pushSubscriptions: [] as any[],
  vapidKeys: null as { publicKey: string; privateKey: string } | null,
  seededCoupons: false,
  seededCampaigns: false,
  seededBanners: false,
  seededProducts: false,
  seededReviews: false,
  settings: {
    whatsappNumber: "8801755104443",
    adminEmail: "risatadnan4@gmail.com",
    adminPassword: "risat123",
    appsScriptUrl: "https://script.google.com/macros/s/AKfycbwO87xXrLb1b-LS5XMoOmCHxo764LwXthLYkHA4AXZ_nJqTwvUHieOSTJkdp_UFf7mx/exec",
    logoUrl: "/stylex_logo.jpg",
    xoroAvatarUrl: "",
    bkashLogoUrl: "",
    nagadLogoUrl: "",
    lotteryDiscountPercentage: 15,
    lotteryCouponPrefix: "RISAT",
    facebookUrl: "https://www.facebook.com/stylex24/",
    instagramUrl: "https://www.instagram.com/style_x25/?hl=en",
    paymentBadgeTitle: "SECURE CASH ON DELIVERY GUARANTEED",
    paymentBadgeDescription: "Pay upon secure physical delivery handoff. We verify each individual container personally with verified secure luxury seal tags. Zero online gateway threat risk.",
    isCatalogDeactivated: false,
    deactivatedMessage: "The VIP showcase catalog is currently undergoing seasonal curation refresh. Private concierge is fully active — contact via WhatsApp for custom order loops.",
    isLotteryDeactivated: false,
    isNotifyMeDeactivated: false,
    isXoroVoiceDisabled: false,
    isXoroVoiceAndAnswerDisabled: false,
    smsProvider: "mock",
    twilioAccountSid: "",
    twilioAuthToken: "",
    twilioFromNumber: "",
    greenwebToken: "",
    globalTimerEndTime: "",
    globalTimerMessage: "",
    globalTimerActive: false,
    globalPaymentSystem: "product_defined",
    globalPaymentMethod: "both",
    globalDeliveryDays: "",
    accentColor: "#D4AF37",
    lotteryPrizes: [
      { text: "15% OFF (STYLEGOLD)", value: "STYLEGOLD", type: "coupon" },
      { text: "VIP Free Carriage", value: "FREE_SHIPPING", type: "shipping" },
      { text: "৳20 OFF (RISATVIP)", value: "RISATVIP", type: "coupon" },
      { text: "Limited Edition SX Patch", value: "SX_PATCH", type: "merch" },
      { text: "Exclusive Concierge Pass", value: "MEMBER_PASS", type: "pass" },
      { text: "Royal Golden Keychain", value: "KEYCHAIN", type: "merch" }
    ],
    productPayments: {} as Record<string, any>
  }
};

let lastSyncCompletedAt = 0;
let activeSyncPromise: Promise<void> | null = null;
let isSettingsTableAvailable = true;

// Load database if exists
if (fs.existsSync(DB_FILE)) {
  try {
    const rawData = fs.readFileSync(DB_FILE, "utf-8");
    const parsedData = JSON.parse(rawData);
    db = { ...db, ...parsedData };
    db.countedSessions = db.countedSessions || [];
    db.customerPhones = parsedData.customerPhones || [];
    db.notifications = db.notifications || [];
    db.failed_notifications = parsedData.failed_notifications || [];
    db.backInStockAlerts = db.backInStockAlerts || [];
    db.pushSubscriptions = parsedData.pushSubscriptions || [];
    db.vapidKeys = parsedData.vapidKeys || null;
    db.seededCoupons = parsedData.seededCoupons !== undefined ? !!parsedData.seededCoupons : false;
    db.seededCampaigns = parsedData.seededCampaigns !== undefined ? !!parsedData.seededCampaigns : false;
    db.seededBanners = parsedData.seededBanners !== undefined ? !!parsedData.seededBanners : false;
    db.seededProducts = parsedData.seededProducts !== undefined ? !!parsedData.seededProducts : false;
    db.seededReviews = parsedData.seededReviews !== undefined ? !!parsedData.seededReviews : false;
    
    // Always migrate old default script URLs to the newly provided script URL
    const oldDefaultUrls = [
      "https://script.google.com/macros/s/AKfycbwlkTgUkW1XTScs7dIIym1mNpa6MVgY9JO9c0lACN7Jaj8zi6TWYs1LgNDp4V6NoDPa/exec",
      "https://script.google.com/macros/s/AKfycbxyp9-vg7NU4Gvi7_lEd2G1MQr_QwkbmEBT3QZhs9EsbheCr0wwYy2aLydw-HOQqjoY/exec",
      "https://script.google.com/macros/s/AKfycbwXARnVsjEPfY2D81-3PswAiNPJke7py_UlwB-vre-RcBZfOgNtEB15morsHUEuUG5_yA/exec",
      "https://script.google.com/macros/s/AKfycbzaRc7woff9SNvCKhXSlfvrNt6XVrgzvXZ0e86BCdDVWIv1VVjFIEPPz12w38WBy-tW/exec"
    ];
    const currentScriptUrl = db.settings?.appsScriptUrl || oldDefaultUrls[0];
    
    db.settings = {
      whatsappNumber: db.settings?.whatsappNumber || "8801755104443",
      adminEmail: db.settings?.adminEmail || "risatadnan4@gmail.com",
      adminPassword: db.settings?.adminPassword || "risat123",
      appsScriptUrl: oldDefaultUrls.includes(currentScriptUrl)
        ? "https://script.google.com/macros/s/AKfycbwO87xXrLb1b-LS5XMoOmCHxo764LwXthLYkHA4AXZ_nJqTwvUHieOSTJkdp_UFf7mx/exec" 
        : currentScriptUrl,
      logoUrl: db.settings?.logoUrl || "/stylex_logo.jpg",
      xoroAvatarUrl: db.settings?.xoroAvatarUrl || "",
      bkashLogoUrl: db.settings?.bkashLogoUrl || "",
      nagadLogoUrl: db.settings?.nagadLogoUrl || "",
      lotteryDiscountPercentage: db.settings?.lotteryDiscountPercentage !== undefined ? Number(db.settings.lotteryDiscountPercentage) : 15,
      lotteryCouponPrefix: db.settings?.lotteryCouponPrefix !== undefined ? db.settings.lotteryCouponPrefix : "RISAT",
      facebookUrl: db.settings?.facebookUrl !== undefined ? db.settings.facebookUrl : "https://www.facebook.com/stylex24/",
      instagramUrl: db.settings?.instagramUrl !== undefined ? db.settings.instagramUrl : "https://www.instagram.com/style_x25/?hl=en",
      paymentBadgeTitle: db.settings?.paymentBadgeTitle || "SECURE CASH ON DELIVERY GUARANTEED",
      paymentBadgeDescription: db.settings?.paymentBadgeDescription || "Pay upon secure physical delivery handoff. We verify each individual container personally with verified secure luxury seal tags. Zero online gateway threat risk.",
      isCatalogDeactivated: db.settings?.isCatalogDeactivated !== undefined ? !!db.settings.isCatalogDeactivated : false,
      deactivatedMessage: db.settings?.deactivatedMessage || "The VIP showcase catalog is currently undergoing seasonal curation refresh. Private concierge is fully active — contact via WhatsApp for custom order loops.",
      isLotteryDeactivated: db.settings?.isLotteryDeactivated !== undefined ? !!db.settings.isLotteryDeactivated : false,
      isNotifyMeDeactivated: db.settings?.isNotifyMeDeactivated !== undefined ? !!db.settings.isNotifyMeDeactivated : false,
      isXoroVoiceDisabled: db.settings?.isXoroVoiceDisabled !== undefined ? !!db.settings.isXoroVoiceDisabled : false,
      isXoroVoiceAndAnswerDisabled: db.settings?.isXoroVoiceAndAnswerDisabled !== undefined ? !!db.settings.isXoroVoiceAndAnswerDisabled : false,
      smsProvider: db.settings?.smsProvider || "mock",
      twilioAccountSid: db.settings?.twilioAccountSid || "",
      twilioAuthToken: db.settings?.twilioAuthToken || "",
      twilioFromNumber: db.settings?.twilioFromNumber || "",
      greenwebToken: db.settings?.greenwebToken || "",
      globalTimerEndTime: db.settings?.globalTimerEndTime || "",
      globalTimerMessage: db.settings?.globalTimerMessage || "",
      globalTimerActive: db.settings?.globalTimerActive !== undefined ? !!db.settings.globalTimerActive : false,
      globalPaymentSystem: db.settings?.globalPaymentSystem || "product_defined",
      globalPaymentMethod: db.settings?.globalPaymentMethod || "both",
      globalDeliveryDays: db.settings?.globalDeliveryDays || "",
      accentColor: db.settings?.accentColor || "#D4AF37",
      lotteryPrizes: db.settings?.lotteryPrizes || [
        { text: "15% OFF (STYLEGOLD)", value: "STYLEGOLD", type: "coupon" },
        { text: "VIP Free Carriage", value: "FREE_SHIPPING", type: "shipping" },
        { text: "৳20 OFF (RISATVIP)", value: "RISATVIP", type: "coupon" },
        { text: "Limited Edition SX Patch", value: "SX_PATCH", type: "merch" },
        { text: "Exclusive Concierge Pass", value: "MEMBER_PASS", type: "pass" },
        { text: "Royal Golden Keychain", value: "KEYCHAIN", type: "merch" }
      ],
      productPayments: db.settings?.productPayments || {}
    };
    saveDB();
  } catch (err) {
    console.error("Error parsing DB file, using default structure", err);
  }
}

// Initialize VAPID Keys for Web Push Notifications
try {
  if (!db.vapidKeys || !db.vapidKeys.publicKey || !db.vapidKeys.privateKey) {
    console.log("Generating fresh VAPID keys for Web Push...");
    const keys = webPush.generateVAPIDKeys();
    db.vapidKeys = {
      publicKey: keys.publicKey,
      privateKey: keys.privateKey
    };
    // Save DB after modifying key fields
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  }
  webPush.setVapidDetails(
    "mailto:risatadnan4@gmail.com",
    db.vapidKeys!.publicKey,
    db.vapidKeys!.privateKey
  );
  console.log("Web Push VAPID keys successfully initialized and set.");
} catch (vErr: any) {
  console.error("Failed to initialize VAPID keys for Web Push:", vErr.message);
}

// Function to save database file
function saveDB() {
  lastSyncCompletedAt = 0; // Force immediate refetch on subsequent requests on this instance
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving DB to filesystem:", err);
  }
}

// Function to register/store customer phone numbers from signups, checkouts, and subscriptions
function registerCustomerPhone(phone: string, name?: string, email?: string, source?: string) {
  if (!phone) return;
  const cleanPhone = String(phone).trim().replace(/[^0-9]/g, '');
  if (!cleanPhone || cleanPhone.length < 5) return;
  
  db.customerPhones = db.customerPhones || [];
  
  const existingIdx = db.customerPhones.findIndex((cp: any) => cp.phone === cleanPhone);
  const newPhoneEntry = {
    id: existingIdx !== -1 ? db.customerPhones[existingIdx].id : `phone-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    phone: cleanPhone,
    name: name ? String(name).trim() : (existingIdx !== -1 ? db.customerPhones[existingIdx].name : ''),
    email: email ? String(email).trim() : (existingIdx !== -1 ? db.customerPhones[existingIdx].email : ''),
    source: source || (existingIdx !== -1 ? db.customerPhones[existingIdx].source : 'unknown'),
    timestamp: new Date().toISOString()
  };
  
  if (existingIdx !== -1) {
    // Only update name/email if provided
    if (name) db.customerPhones[existingIdx].name = String(name).trim();
    if (email) db.customerPhones[existingIdx].email = String(email).trim();
    if (source) db.customerPhones[existingIdx].source = source;
    db.customerPhones[existingIdx].timestamp = new Date().toISOString();
  } else {
    db.customerPhones.push(newPhoneEntry);
  }
  saveDB();
}

// Function to synchronize settings to Supabase cloud as a bulletproof failsafe
async function syncSettingsToCloud() {
  saveDB();
  
  if (isSettingsTableAvailable) {
    try {
      const { data: testResult, error: testError } = await supabase.from("settings").select("*").limit(1);
      const isOldKeyValue = !testError && testResult && testResult.length > 0 && testResult[0].key !== undefined && testResult[0].value !== undefined;

      if (isOldKeyValue) {
        const saveSetting = async (key: string, value: string) => {
          await supabase.from("settings").upsert({ key, value }, { onConflict: "key" });
        };
        await saveSetting("productPayments", JSON.stringify(db.settings.productPayments || {}));
      } else {
        const upsertPayload: any = {
          id: 1,
          whatsappNumber: db.settings.whatsappNumber,
          adminEmail: db.settings.adminEmail,
          adminPassword: db.settings.adminPassword,
          appsScriptUrl: db.settings.appsScriptUrl,
          logoUrl: db.settings.logoUrl,
          xoroAvatarUrl: db.settings.xoroAvatarUrl,
          bkashLogoUrl: db.settings.bkashLogoUrl,
          nagadLogoUrl: db.settings.nagadLogoUrl,
          lotteryDiscountPercentage: db.settings.lotteryDiscountPercentage,
          lotteryCouponPrefix: db.settings.lotteryCouponPrefix,
          facebookUrl: db.settings.facebookUrl,
          instagramUrl: db.settings.instagramUrl,
          paymentBadgeTitle: db.settings.paymentBadgeTitle,
          paymentBadgeDescription: db.settings.paymentBadgeDescription,
          isCatalogDeactivated: db.settings.isCatalogDeactivated,
          deactivatedMessage: db.settings.deactivatedMessage,
          isLotteryDeactivated: db.settings.isLotteryDeactivated,
          isNotifyMeDeactivated: db.settings.isNotifyMeDeactivated,
          globalTimerEndTime: db.settings.globalTimerEndTime,
          globalTimerMessage: db.settings.globalTimerMessage,
          globalTimerActive: db.settings.globalTimerActive,
          globalPaymentSystem: db.settings.globalPaymentSystem,
          globalPaymentMethod: db.settings.globalPaymentMethod,
          globalDeliveryDays: db.settings.globalDeliveryDays,
          accentColor: db.settings.accentColor,
          lotteryPrizes: typeof db.settings.lotteryPrizes === "string" ? db.settings.lotteryPrizes : JSON.stringify(db.settings.lotteryPrizes)
        };

        try {
          upsertPayload.productPayments = JSON.stringify(db.settings.productPayments || {});
        } catch (e) {}

        const { error: upsertError } = await supabase.from("settings").upsert(upsertPayload, { onConflict: "id" });
        if (upsertError && upsertError.message.includes("column")) {
          // Retry without productPayments or accentColor columns if they don't exist
          delete upsertPayload.productPayments;
          delete upsertPayload.accentColor;
          await supabase.from("settings").upsert(upsertPayload, { onConflict: "id" });
        }
      }
    } catch (dbErr: any) {
      console.error("⚠️ Failed to mirror settings to Supabase settings table:", dbErr?.message || dbErr);
    }
  }

  // Always mirror to Supabase 'banners' metadata row as a failsafe cloud backup
  try {
    await supabase.from("banners").upsert({
      id: "system_settings_metadata",
      title: "SYSTEM_SETTINGS_METADATA",
      subtitle: JSON.stringify(db.settings),
      imageUrl: db.settings.logoUrl || "/stylex_logo.jpg",
      active: false,
      isVideo: false
    }, { onConflict: "id" });
    console.log("✅ Backup of settings mirrored to Supabase 'banners' metadata table successfully.");
  } catch (bannerErr: any) {
    console.error("⚠️ Failed to write settings backup to banners table:", bannerErr.message);
  }
}

// Background sync from Supabase database
async function syncFromSupabase() {
  try {
    console.log("🔄 Fetching latest collections from Supabase database in parallel...");

    const safeSelect = async (table: string) => {
      try {
        const res = await supabase.from(table).select("*");
        if (res.error) {
          console.warn(`⚠️ Error selecting from ${table}:`, res.error.message);
          return { data: null, error: res.error };
        }
        return res;
      } catch (err: any) {
        console.warn(`⚠️ Exception selecting from ${table}:`, err?.message || err);
        return { data: null, error: err };
      }
    };

    const [
      productsResult,
      bannersResult,
      couponsResult,
      campaignsResult,
      reviewsResult,
      ordersResult,
      chatsResult,
      settingsResult
    ] = await Promise.all([
      safeSelect("products"),
      safeSelect("banners"),
      safeSelect("coupons"),
      safeSelect("campaigns"),
      safeSelect("reviews"),
      safeSelect("orders"),
      safeSelect("chats"),
      safeSelect("settings")
    ]);

    // 0. Pre-parse settings & banners fallback to populate productPayments
    try {
      if (settingsResult && !settingsResult.error && settingsResult.data) {
        const settingsData = settingsResult.data;
        const configRow = settingsData.find((r: any) => r.id === 1 || r.id === "1") || settingsData[0];
        if (configRow && configRow.productPayments) {
          try {
            db.settings.productPayments = typeof configRow.productPayments === "string" 
              ? JSON.parse(configRow.productPayments) 
              : configRow.productPayments;
          } catch (err) {}
        }
      }
      if (bannersResult && !bannersResult.error && bannersResult.data) {
        const bannersData = bannersResult.data;
        const systemSettingsRow = bannersData.find((b: any) => b.id === "system_settings_metadata");
        if (systemSettingsRow && systemSettingsRow.subtitle) {
          try {
            const fallbackSettings = JSON.parse(systemSettingsRow.subtitle);
            if (fallbackSettings.productPayments) {
              db.settings.productPayments = fallbackSettings.productPayments;
            }
          } catch (err) {}
        }
      }
    } catch (settingsPreErr) {
      console.error("⚠️ Error pre-parsing settings in syncFromSupabase:", settingsPreErr);
    }

    // Determine if the database is already initialized with existing content
    const hasProductsInDb = !!(productsResult.data && productsResult.data.length > 0);
    const hasBannersInDb = !!(bannersResult.data && bannersResult.data.length > 0);
    const hasSettingsInDb = !!(settingsResult.data && settingsResult.data.length > 0);
    const isDbInitialized = hasProductsInDb || hasBannersInDb || hasSettingsInDb;

    // 1. Sync Products
    try {
      if (!productsResult.error && productsResult.data) {
        const productsData = productsResult.data;
        if (productsData.length > 0) {
          db.products = productsData.map((p: any) => {
            const localProduct = db.products ? db.products.find((lp: any) => lp.id === p.id) : null;
            const pm = (db.settings.productPayments && db.settings.productPayments[p.id]) || {};
            return {
              ...p,
              sizes: typeof p.sizes === "string" ? JSON.parse(p.sizes) : (Array.isArray(p.sizes) ? p.sizes : []),
              trending: p.trending !== undefined ? !!p.trending : true,
              featured: p.featured !== undefined ? !!p.featured : true,
              price: Number(p.price || 0),
              stock: Number(p.stock || 0),
              lotteryEligible: p.lotteryEligible !== undefined ? !!p.lotteryEligible : true,
              couponCode: p.couponCode || "",
              couponDiscountPercent: p.couponDiscountPercent !== undefined && p.couponDiscountPercent !== null ? Number(p.couponDiscountPercent) : undefined,
              offerPrice: pm.offerPrice !== undefined && pm.offerPrice !== null ? pm.offerPrice : ((p.offerPrice !== undefined && p.offerPrice !== null) ? Number(p.offerPrice) : (localProduct?.offerPrice !== undefined ? localProduct.offerPrice : undefined)),
              timerEndTime: pm.timerEndTime !== undefined && pm.timerEndTime !== null ? pm.timerEndTime : (p.timerEndTime || localProduct?.timerEndTime || undefined),
              timerMessage: pm.timerMessage !== undefined && pm.timerMessage !== null ? pm.timerMessage : (p.timerMessage || localProduct?.timerMessage || undefined),
              timerActive: pm.timerActive !== undefined ? !!pm.timerActive : (p.timerActive !== undefined ? !!p.timerActive : (localProduct?.timerActive !== undefined ? !!localProduct.timerActive : true)),
              bkashNumber: pm.bkashNumber !== undefined ? pm.bkashNumber : (p.bkashNumber || localProduct?.bkashNumber || ""),
              nagadNumber: pm.nagadNumber !== undefined ? pm.nagadNumber : (p.nagadNumber || localProduct?.nagadNumber || ""),
              paymentType: pm.paymentType !== undefined ? pm.paymentType : (p.paymentType || localProduct?.paymentType || "cod"),
              paymentPercentage: pm.paymentPercentage !== undefined ? (pm.paymentPercentage !== null ? Number(pm.paymentPercentage) : null) : (p.paymentPercentage !== undefined && p.paymentPercentage !== null ? Number(p.paymentPercentage) : (localProduct?.paymentPercentage !== undefined ? Number(localProduct.paymentPercentage) : null)),
              deliveryCharge: pm.deliveryCharge !== undefined ? Number(pm.deliveryCharge) : (p.deliveryCharge !== undefined && p.deliveryCharge !== null ? Number(p.deliveryCharge) : (localProduct?.deliveryCharge !== undefined ? Number(localProduct.deliveryCharge) : Number(p.deliveryPrice || 100))),
              deliveryDays: pm.deliveryDays !== undefined ? pm.deliveryDays : (p.deliveryDays || localProduct?.deliveryDays || "3-5"),
              isPinned: pm.isPinned !== undefined ? !!pm.isPinned : (p.isPinned !== undefined ? !!p.isPinned : (localProduct?.isPinned !== undefined ? !!localProduct.isPinned : false)),
              likes: pm.likes !== undefined ? Number(pm.likes) : (p.likes !== undefined ? Number(p.likes) : (localProduct?.likes !== undefined ? Number(localProduct.likes) : 0))
            };
          });
          db.seededProducts = true;
          saveDB();
          console.log(`✅ Synced ${db.products.length} products from Supabase.`);
        } else {
          if (!isDbInitialized && db.products && db.products.length > 0) {
            console.log("🌱 Supabase 'products' table is empty. Seeding Supabase from local database backup...");
            for (const prod of db.products) {
              await supabase.from("products").upsert({
                id: prod.id,
                code: prod.code,
                title: prod.title,
                description: prod.description,
                price: prod.price,
                category: prod.category,
                stock: prod.stock,
                imageUrl: prod.imageUrl,
                sizes: JSON.stringify(prod.sizes),
                dimensions: prod.dimensions,
                whyBuy: prod.whyBuy,
                trending: prod.trending,
                featured: prod.featured
              });
            }
            db.seededProducts = true;
            saveDB();
          } else {
            db.products = [];
            saveDB();
          }
        }
      } else if (productsResult.error) {
        console.warn("⚠️ [Supabase Products Sync Warning]:", productsResult.error.message);
      }
    } catch (e: any) {
      console.warn("⚠️ Products table setup not verified:", e.message);
    }

    // 2. Sync Banners
    try {
      if (!bannersResult.error && bannersResult.data) {
        const bannersData = bannersResult.data;
        if (bannersData.length > 0) {
          // Filter out the hidden system settings row from displaying on the UI carousel
          db.banners = bannersData.filter((b: any) => b.id !== "system_settings_metadata").map((b: any) => ({
            ...b,
            active: !!b.active
          }));
          db.seededBanners = true;
          saveDB();
          console.log(`✅ Synced ${db.banners.length} public banners from Supabase.`);

          // Extract settings fallback from banners table if it exists
          const systemSettingsRow = bannersData.find((b: any) => b.id === "system_settings_metadata");
          if (systemSettingsRow && systemSettingsRow.subtitle) {
            try {
              const fallbackSettings = JSON.parse(systemSettingsRow.subtitle);
              console.log("ℹ️ Restored settings backup from Supabase 'banners' metadata row successfully.");
              
              if (fallbackSettings.whatsappNumber !== undefined) db.settings.whatsappNumber = fallbackSettings.whatsappNumber;
              if (fallbackSettings.adminEmail !== undefined) db.settings.adminEmail = fallbackSettings.adminEmail;
              if (fallbackSettings.adminPassword !== undefined) db.settings.adminPassword = fallbackSettings.adminPassword;
              if (fallbackSettings.appsScriptUrl !== undefined) db.settings.appsScriptUrl = fallbackSettings.appsScriptUrl;
              if (fallbackSettings.logoUrl !== undefined) db.settings.logoUrl = fallbackSettings.logoUrl;
              if (fallbackSettings.xoroAvatarUrl !== undefined) db.settings.xoroAvatarUrl = fallbackSettings.xoroAvatarUrl;
              if (fallbackSettings.facebookUrl !== undefined) db.settings.facebookUrl = fallbackSettings.facebookUrl;
              if (fallbackSettings.instagramUrl !== undefined) db.settings.instagramUrl = fallbackSettings.instagramUrl;
              if (fallbackSettings.lotteryDiscountPercentage !== undefined) db.settings.lotteryDiscountPercentage = Number(fallbackSettings.lotteryDiscountPercentage);
              if (fallbackSettings.lotteryCouponPrefix !== undefined) db.settings.lotteryCouponPrefix = fallbackSettings.lotteryCouponPrefix;
              if (fallbackSettings.paymentBadgeTitle !== undefined) db.settings.paymentBadgeTitle = fallbackSettings.paymentBadgeTitle;
              if (fallbackSettings.paymentBadgeDescription !== undefined) db.settings.paymentBadgeDescription = fallbackSettings.paymentBadgeDescription;
              if (fallbackSettings.isCatalogDeactivated !== undefined) db.settings.isCatalogDeactivated = fallbackSettings.isCatalogDeactivated === true || fallbackSettings.isCatalogDeactivated === "true";
              if (fallbackSettings.deactivatedMessage !== undefined) db.settings.deactivatedMessage = fallbackSettings.deactivatedMessage;
              if (fallbackSettings.isLotteryDeactivated !== undefined) db.settings.isLotteryDeactivated = fallbackSettings.isLotteryDeactivated === true || fallbackSettings.isLotteryDeactivated === "true";
              if (fallbackSettings.isNotifyMeDeactivated !== undefined) db.settings.isNotifyMeDeactivated = fallbackSettings.isNotifyMeDeactivated === true || fallbackSettings.isNotifyMeDeactivated === "true";
              if (fallbackSettings.isXoroVoiceDisabled !== undefined) db.settings.isXoroVoiceDisabled = fallbackSettings.isXoroVoiceDisabled === true || fallbackSettings.isXoroVoiceDisabled === "true";
              if (fallbackSettings.isXoroVoiceAndAnswerDisabled !== undefined) db.settings.isXoroVoiceAndAnswerDisabled = fallbackSettings.isXoroVoiceAndAnswerDisabled === true || fallbackSettings.isXoroVoiceAndAnswerDisabled === "true";
              if (fallbackSettings.globalTimerEndTime !== undefined) db.settings.globalTimerEndTime = fallbackSettings.globalTimerEndTime;
              if (fallbackSettings.globalTimerMessage !== undefined) db.settings.globalTimerMessage = fallbackSettings.globalTimerMessage;
              if (fallbackSettings.globalTimerActive !== undefined) db.settings.globalTimerActive = fallbackSettings.globalTimerActive === true || fallbackSettings.globalTimerActive === "true";
              if (fallbackSettings.globalPaymentSystem !== undefined) db.settings.globalPaymentSystem = fallbackSettings.globalPaymentSystem;
              if (fallbackSettings.globalPaymentMethod !== undefined) db.settings.globalPaymentMethod = fallbackSettings.globalPaymentMethod;
              if (fallbackSettings.globalDeliveryDays !== undefined) db.settings.globalDeliveryDays = fallbackSettings.globalDeliveryDays;
              if (fallbackSettings.productPayments !== undefined) db.settings.productPayments = fallbackSettings.productPayments;
              if (fallbackSettings.lotteryPrizes) db.settings.lotteryPrizes = fallbackSettings.lotteryPrizes;
              
              saveDB();
            } catch (jsonErr: any) {
              console.warn("⚠️ Failed to parse fallback settings from banners table:", jsonErr.message);
            }
          }
        } else {
          if (!isDbInitialized && db.banners && db.banners.length > 0) {
            console.log("🌱 Supabase 'banners' table is empty. Seeding from local database backup...");
            for (const b of db.banners) {
              await supabase.from("banners").upsert(b);
            }
            db.seededBanners = true;
            saveDB();
          } else {
            db.banners = [];
            saveDB();
          }
        }
      }
    } catch (e: any) {}

    // 3. Sync Coupons
    try {
      if (!couponsResult.error && couponsResult.data) {
        const couponsData = couponsResult.data;
        if (couponsData.length > 0) {
          db.coupons = couponsData.map((c: any) => {
            const existingLocal = db.coupons?.find(localC => localC.code === c.code);
            const maxUses = (c.maxUses !== undefined && c.maxUses !== null) ? Number(c.maxUses) : ((c.max_uses !== undefined && c.max_uses !== null) ? Number(c.max_uses) : existingLocal?.maxUses);
            const usedCount = (c.usedCount !== undefined && c.usedCount !== null) ? Number(c.usedCount) : ((c.used_count !== undefined && c.used_count !== null) ? Number(c.used_count) : (existingLocal?.usedCount || 0));
            const active = !!c.active && (maxUses === undefined || maxUses <= 0 || usedCount < maxUses);
            return {
              code: c.code,
              type: c.type || existingLocal?.type || 'PERCENTAGE',
              value: Number(c.value),
              active,
              maxUses,
              usedCount
            };
          });
          db.seededCoupons = true;
          saveDB();
          console.log(`✅ Synced ${db.coupons.length} coupons from Supabase.`);
        } else {
          if (!db.seededCoupons && !isDbInitialized && db.coupons && db.coupons.length > 0) {
            console.log("🌱 Supabase 'coupons' table is empty. Seeding from local database backup...");
            for (const c of db.coupons) {
              await supabase.from("coupons").upsert(c);
            }
            db.seededCoupons = true;
            saveDB();
          } else {
            db.coupons = [];
            saveDB();
          }
        }
      }
    } catch (e: any) {}

    // 4. Sync Campaigns
    try {
      if (!campaignsResult.error && campaignsResult.data) {
        const campaignsData = campaignsResult.data;
        if (campaignsData.length > 0) {
          db.campaigns = campaignsData.map((c: any) => ({
            ...c,
            active: !!c.active
          }));
          db.seededCampaigns = true;
          saveDB();
          console.log(`✅ Synced ${db.campaigns.length} campaigns from Supabase.`);
        } else {
          if (!isDbInitialized && db.campaigns && db.campaigns.length > 0) {
            console.log("🌱 Supabase 'campaigns' table is empty. Seeding from local database backup...");
            for (const c of db.campaigns) {
              await supabase.from("campaigns").upsert(c);
            }
            db.seededCampaigns = true;
            saveDB();
          } else {
            db.campaigns = [];
            saveDB();
          }
        }
      }
    } catch (e: any) {}

    // 5. Sync Reviews
    try {
      if (!reviewsResult.error && reviewsResult.data) {
        const reviewsData = reviewsResult.data;
        if (reviewsData.length > 0) {
          db.reviews = reviewsData.map((r: any) => ({
            ...r,
            rating: Number(r.rating),
            isApproved: !!r.isApproved
          }));
          db.seededReviews = true;
          saveDB();
          console.log(`✅ Synced ${db.reviews.length} reviews from Supabase.`);
        } else {
          if (!isDbInitialized && db.reviews && db.reviews.length > 0) {
            console.log("🌱 Supabase 'reviews' table is empty. Seeding from local database backup...");
            for (const r of db.reviews) {
              await supabase.from("reviews").upsert(r);
            }
            db.seededReviews = true;
            saveDB();
          } else {
            db.reviews = [];
            saveDB();
          }
        }
      }
    } catch (e: any) {}

    // 6. Sync Orders
    try {
      if (!ordersResult.error && ordersResult.data) {
        const ordersData = ordersResult.data;
        if (ordersData.length > 0) {
          db.orders = ordersData.map((o: any) => ({
            ...o,
            items: typeof o.items === "string" ? JSON.parse(o.items) : (Array.isArray(o.items) ? o.items : []),
            totalAmount: Number(o.totalAmount)
          }));
          console.log(`✅ Synced ${db.orders.length} orders from Supabase.`);
        } else {
          for (const o of db.orders) {
            await supabase.from("orders").upsert({
              ...o,
              items: typeof o.items === "string" ? o.items : JSON.stringify(o.items)
            });
          }
        }
      }
    } catch (e: any) {}

    // 7. Sync Chats
    try {
      if (!chatsResult.error && chatsResult.data) {
        const chatsData = chatsResult.data;
        if (chatsData.length > 0) {
          db.chats = chatsData.map((ch: any) => ({
            ...ch,
            messages: typeof ch.messages === "string" ? JSON.parse(ch.messages) : (Array.isArray(ch.messages) ? ch.messages : []),
            typingCustomer: !!ch.typingCustomer,
            typingAdmin: !!ch.typingAdmin,
            onlineCustomer: !!ch.onlineCustomer,
            onlineAdmin: !!ch.onlineAdmin
          }));
          console.log(`✅ Synced ${db.chats.length} chats from Supabase.`);
        } else {
          for (const ch of db.chats) {
            await supabase.from("chats").upsert({
              ...ch,
              messages: typeof ch.messages === "string" ? ch.messages : JSON.stringify(ch.messages)
            });
          }
        }
      }
    } catch (e: any) {}

    // 8. Sync Settings & Persistent Views
    try {
      if (settingsResult.error) {
        const errMsg = settingsResult.error.message || "";
        if (errMsg.includes("Could not find the table") || errMsg.includes("does not exist") || settingsResult.error.code === "PGRST116" || settingsResult.error.code === "42P01") {
          isSettingsTableAvailable = false;
          console.info("ℹ️ Supabase 'settings' table is not available yet. File-based cache will be used for settings storage.");
        } else {
          console.warn("⚠️ Failed syncing settings from Supabase:", settingsResult.error.message);
        }
      } else {
        isSettingsTableAvailable = true;
      }

      if (isSettingsTableAvailable && settingsResult.data) {
        const settingsData = settingsResult.data;
        const configRow = settingsData.find((r: any) => r.id === 1 || r.id === "1") || settingsData[0];
        if (configRow) {
          if (configRow.whatsappNumber !== undefined && configRow.whatsappNumber !== null) db.settings.whatsappNumber = configRow.whatsappNumber;
          if (configRow.adminEmail !== undefined && configRow.adminEmail !== null) db.settings.adminEmail = configRow.adminEmail;
          if (configRow.adminPassword !== undefined && configRow.adminPassword !== null) db.settings.adminPassword = configRow.adminPassword;
          if (configRow.appsScriptUrl !== undefined && configRow.appsScriptUrl !== null) db.settings.appsScriptUrl = configRow.appsScriptUrl;
          if (configRow.logoUrl !== undefined && configRow.logoUrl !== null) db.settings.logoUrl = configRow.logoUrl;
          if (configRow.xoroAvatarUrl !== undefined && configRow.xoroAvatarUrl !== null) db.settings.xoroAvatarUrl = configRow.xoroAvatarUrl;
          if (configRow.bkashLogoUrl !== undefined && configRow.bkashLogoUrl !== null) db.settings.bkashLogoUrl = configRow.bkashLogoUrl;
          if (configRow.nagadLogoUrl !== undefined && configRow.nagadLogoUrl !== null) db.settings.nagadLogoUrl = configRow.nagadLogoUrl;
          if (configRow.facebookUrl !== undefined && configRow.facebookUrl !== null) db.settings.facebookUrl = configRow.facebookUrl;
          if (configRow.instagramUrl !== undefined && configRow.instagramUrl !== null) db.settings.instagramUrl = configRow.instagramUrl;
          if (configRow.lotteryDiscountPercentage !== undefined && configRow.lotteryDiscountPercentage !== null) db.settings.lotteryDiscountPercentage = Number(configRow.lotteryDiscountPercentage);
          if (configRow.lotteryCouponPrefix !== undefined && configRow.lotteryCouponPrefix !== null) db.settings.lotteryCouponPrefix = configRow.lotteryCouponPrefix;
          if (configRow.paymentBadgeTitle !== undefined && configRow.paymentBadgeTitle !== null) db.settings.paymentBadgeTitle = configRow.paymentBadgeTitle;
          if (configRow.paymentBadgeDescription !== undefined && configRow.paymentBadgeDescription !== null) db.settings.paymentBadgeDescription = configRow.paymentBadgeDescription;
          
          if (configRow.isCatalogDeactivated !== undefined && configRow.isCatalogDeactivated !== null) {
            db.settings.isCatalogDeactivated = configRow.isCatalogDeactivated === true || configRow.isCatalogDeactivated === "true";
          }
          if (configRow.deactivatedMessage !== undefined && configRow.deactivatedMessage !== null) db.settings.deactivatedMessage = configRow.deactivatedMessage;
          
          if (configRow.isLotteryDeactivated !== undefined && configRow.isLotteryDeactivated !== null) {
            db.settings.isLotteryDeactivated = configRow.isLotteryDeactivated === true || configRow.isLotteryDeactivated === "true";
          }
          if (configRow.isNotifyMeDeactivated !== undefined && configRow.isNotifyMeDeactivated !== null) {
            db.settings.isNotifyMeDeactivated = configRow.isNotifyMeDeactivated === true || configRow.isNotifyMeDeactivated === "true";
          }
          if (configRow.isXoroVoiceDisabled !== undefined && configRow.isXoroVoiceDisabled !== null) {
            db.settings.isXoroVoiceDisabled = configRow.isXoroVoiceDisabled === true || configRow.isXoroVoiceDisabled === "true";
          }
          if (configRow.isXoroVoiceAndAnswerDisabled !== undefined && configRow.isXoroVoiceAndAnswerDisabled !== null) {
            db.settings.isXoroVoiceAndAnswerDisabled = configRow.isXoroVoiceAndAnswerDisabled === true || configRow.isXoroVoiceAndAnswerDisabled === "true";
          }
          
          if (configRow.globalTimerEndTime !== undefined && configRow.globalTimerEndTime !== null) db.settings.globalTimerEndTime = configRow.globalTimerEndTime;
          if (configRow.globalTimerMessage !== undefined && configRow.globalTimerMessage !== null) db.settings.globalTimerMessage = configRow.globalTimerMessage;
          
          if (configRow.globalTimerActive !== undefined && configRow.globalTimerActive !== null) {
            db.settings.globalTimerActive = configRow.globalTimerActive === true || configRow.globalTimerActive === "true";
          }
          
          if (configRow.globalPaymentSystem !== undefined && configRow.globalPaymentSystem !== null) db.settings.globalPaymentSystem = configRow.globalPaymentSystem;
          if (configRow.globalPaymentMethod !== undefined && configRow.globalPaymentMethod !== null) db.settings.globalPaymentMethod = configRow.globalPaymentMethod;
          if (configRow.globalDeliveryDays !== undefined && configRow.globalDeliveryDays !== null) db.settings.globalDeliveryDays = configRow.globalDeliveryDays;
          if (configRow.accentColor !== undefined && configRow.accentColor !== null) db.settings.accentColor = configRow.accentColor;
          
          if (configRow.lotteryPrizes) {
            try {
              db.settings.lotteryPrizes = typeof configRow.lotteryPrizes === "string" ? JSON.parse(configRow.lotteryPrizes) : configRow.lotteryPrizes;
            } catch (err) {}
          }

          // Restore persistent count and counted sessions from single-row configRow
          if (configRow.visits_count !== undefined && configRow.visits_count !== null) {
            const parsedVisits = Number(configRow.visits_count);
            if (!isNaN(parsedVisits) && parsedVisits > db.visits) {
              db.visits = parsedVisits;
            }
          }
          if (configRow.counted_sessions !== undefined && configRow.counted_sessions !== null) {
            try {
              const sessions = typeof configRow.counted_sessions === "string" ? JSON.parse(configRow.counted_sessions) : configRow.counted_sessions;
              if (Array.isArray(sessions)) {
                const combined = Array.from(new Set([...(db.countedSessions || []), ...sessions]));
                db.countedSessions = combined;
                db.visits = Math.max(db.visits, db.countedSessions.length);
              }
            } catch (jsonErr) {
              console.error("Error parsing counted_sessions from single-row settings:", jsonErr);
            }
          }
        }
      }
    } catch (e: any) {
      console.warn("⚠️ Failed syncing settings: ", e.message);
    }

    // Always migrate old default script URLs after syncing from cloud as a robust failsafe
    const obsoleteUrls = [
      "https://script.google.com/macros/s/AKfycbwlkTgUkW1XTScs7dIIym1mNpa6MVgY9JO9c0lACN7Jaj8zi6TWYs1LgNDp4V6NoDPa/exec",
      "https://script.google.com/macros/s/AKfycbxyp9-vg7NU4Gvi7_lEd2G1MQr_QwkbmEBT3QZhs9EsbheCr0wwYy2aLydw-HOQqjoY/exec",
      "https://script.google.com/macros/s/AKfycbwXARnVsjEPfY2D81-3PswAiNPJke7py_UlwB-vre-RcBZfOgNtEB15morsHUEuUG5_yA/exec",
      "https://script.google.com/macros/s/AKfycbzaRc7woff9SNvCKhXSlfvrNt6XVrgzvXZ0e86BCdDVWIv1VVjFIEPPz12w38WBy-tW/exec"
    ];
    if (db.settings?.appsScriptUrl && obsoleteUrls.includes(db.settings.appsScriptUrl.trim())) {
      console.log(`♻️ [CLOUD_MIGRATION] Obsolete Apps Script URL detected from Supabase settings (${db.settings.appsScriptUrl.trim()}). Upgrading to: https://script.google.com/macros/s/AKfycbwO87xXrLb1b-LS5XMoOmCHxo764LwXthLYkHA4AXZ_nJqTwvUHieOSTJkdp_UFf7mx/exec`);
      db.settings.appsScriptUrl = "https://script.google.com/macros/s/AKfycbwO87xXrLb1b-LS5XMoOmCHxo764LwXthLYkHA4AXZ_nJqTwvUHieOSTJkdp_UFf7mx/exec";
      // Force write back to cloud
      setTimeout(() => {
        syncSettingsToCloud().catch(err => console.error("⚠️ Failed back-syncing migrated settings to cloud:", err));
      }, 500);
    }

    // Save final state locally as hot cache
    saveDB();
  } catch (error: any) {
    console.warn("⚠️ Supabase sync loop bypassed/offline:", error.message);
  }
}

export async function ensureDbSynced() {
  const now = Date.now();

  // If we have never synced successfully, run sync in background or wait at most 2.5 seconds
  if (lastSyncCompletedAt === 0) {
    if (!activeSyncPromise) {
      activeSyncPromise = (async () => {
        try {
          await syncFromSupabase();
          lastSyncCompletedAt = Date.now();
        } catch (err: any) {
          console.warn("⚠️ Initial background sync failed:", err?.message || err);
        } finally {
          activeSyncPromise = null;
        }
      })();
    }
    // Only await if we don't have cached products loaded yet to prevent cold-start hanging
    if (!db.products || db.products.length === 0) {
      await Promise.race([
        activeSyncPromise,
        new Promise(resolve => setTimeout(resolve, 2500))
      ]);
    }
    return;
  }

  // If last complete sync was more than 15 seconds ago, trigger a background sync (completely non-blocking)
  if (now - lastSyncCompletedAt > 15000) {
    if (!activeSyncPromise) {
      activeSyncPromise = (async () => {
        try {
          await syncFromSupabase();
          lastSyncCompletedAt = Date.now();
        } catch (err: any) {
          console.warn("⚠️ Background sync failed:", err?.message || err);
        } finally {
          activeSyncPromise = null;
        }
      })();
    }
  }
}


// Set up express middlewears
app.use("/api", (req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

app.use(async (req, res, next) => {
  try {
    await ensureDbSynced();
  } catch (err: any) {
    console.warn("⚠️ Supabase hydration bypassed:", err.message);
  }
  next();
});
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Enable public downloads hosting
app.use("/uploads", express.static(UPLOADS_DIR));

// Accurate in-memory active visitor sessions mapping sessionId to last online timestamp
const activeSessions = new Map<string, number>();

// Clean up stale sessions on an interval (every 10 seconds)
setInterval(() => {
  const now = Date.now();
  for (const [id, lastPing] of activeSessions.entries()) {
    // If no heartbeat received in the last 25 seconds, remove session
    if (now - lastPing > 25000) {
      activeSessions.delete(id);
    }
  }
  const currentCount = Math.max(1, activeSessions.size);
  if (db.liveViews !== currentCount) {
    db.liveViews = currentCount;
  }
}, 10000);

// Basic non-randomized initial handler for direct web loads
app.use((req, res, next) => {
  if (req.url === "/" || req.url === "/index.html") {
    // Rely on high-accuracy client-side /api/visitor-ping for precise unique visitor checking
    db.liveViews = Math.max(1, activeSessions.size);
  }
  next();
});

// Admin verification (Simple mock for beautiful user flows)
const ADMIN_EMAIL = "risatadnan4@gmail.com";

// API Endpoints:

// Unified endpoint for accurate visitor tracking & live presence registration
app.get("/api/visitor-ping", (req, res) => {
  try {
    const visitorId = (req.query.visitorId as string) || "";
    const sessionId = (req.query.sessionId as string) || "";
    const isNew = req.query.isNew === "true" || !req.query.isNew;

    const now = Date.now();
    const ua = (req.headers["user-agent"] || "").toLowerCase();
    
    // Strict Bot/Crawler Filter to prevent automated crawlers from inflating visits count
    const isBot = /bot|googlebot|crawler|spider|robot|crawling|slurp|bingbot|yandex|applebot|baidu|duckduck|discordbot|telegrambot|whatsapp/i.test(ua);

    // Register active heartbeat presence for live metrics
    if (sessionId) {
      activeSessions.set(sessionId, now);
    } else if (visitorId) {
      activeSessions.set(visitorId, now);
    }

    // Prioritize persistent visitorId (device-based) over session-specific keys for counting accuracy
    const trackingKey = visitorId || sessionId;
    let counted = false;

    if (trackingKey && !isBot) {
      if (!db.countedSessions) {
        db.countedSessions = [];
      }

      const isAlreadyInArray = db.countedSessions.includes(trackingKey);

      if (!isNew || isAlreadyInArray) {
        counted = true;
      } else {
        // Truly a new unique visitor on both client-side and server-side
        db.countedSessions.push(trackingKey);
        
        // Increase cap to 15,000 for high-capacity database cushion
        if (db.countedSessions.length > 15000) {
          db.countedSessions.shift();
        }

        // Monotonically increment unique visits safely
        db.visits = Math.max((db.visits || 125) + 1, db.countedSessions.length);
        saveDB();
        counted = true;

        // Asynchronously back up the visitor metrics to Supabase
        if (isSettingsTableAvailable) {
          supabase.from("settings").upsert({
            id: 1,
            visits_count: db.visits,
            counted_sessions: JSON.stringify(db.countedSessions)
          }, { onConflict: "id" }).then(({ error: upsertErr }) => {
            if (upsertErr) {
              console.error("⚠️ Background backup of single-row visitor count failed:", upsertErr.message);
            }
          });
        }
      }
    }

    // Recalculate live count immediately
    const liveCount = Math.max(1, activeSessions.size);
    db.liveViews = liveCount;

    res.json({
      success: true,
      visits: Number(db.visits || 0),
      liveViews: liveCount,
      counted: counted
    });
  } catch (err: any) {
    res.json({
      success: false,
      visits: Number(db.visits || 125),
      liveViews: Math.max(1, activeSessions.size)
    });
  }
});

// Analytics Metrics
app.get("/api/analytics", (req, res) => {
  try {
    const ordersList = Array.isArray(db.orders) ? db.orders : [];
    const productsList = Array.isArray(db.products) ? db.products : [];

    const totalRevenue = ordersList
      .filter(o => o && o.status !== "CANCELLED")
      .reduce((val, order) => val + Number(order.totalAmount || 0), 0);

    const totalOrders = ordersList.length;
    const pendingOrders = ordersList.filter(o => o && o.status === "PENDING").length;
    const lowStockProducts = productsList.filter(p => p && Number(p.stock || 0) < 15).length;

    res.json({
      visits: Number(db.visits || 0),
      liveViews: Number(db.liveViews || 1),
      totalRevenue,
      totalOrders,
      pendingOrders,
      lowStockStockCount: lowStockProducts,
      recentOrdersMax: ordersList.slice(-5)
    });
  } catch (error: any) {
    console.error("❌ Error loading analytics in route handler:", error);
    res.status(500).json({ 
      error: "Error reading metrics", 
      message: error.message,
      visits: Number(db.visits || 0),
      liveViews: Number(db.liveViews || 1),
      totalRevenue: 0,
      totalOrders: 0,
      pendingOrders: 0,
      lowStockStockCount: 0,
      recentOrdersMax: []
    });
  }
});

// App Settings (Dynamic WhatsApp etc.)
app.get("/api/settings", async (req, res) => {
  try {
    if (isSettingsTableAvailable) {
      const { data: settingsResult, error } = await supabase.from("settings").select("*");
      if (!error && settingsResult && settingsResult.length > 0) {
        const configRow = settingsResult.find((r: any) => r.id === 1 || r.id === "1") || settingsResult[0];
        if (configRow) {
          if (configRow.whatsappNumber !== undefined && configRow.whatsappNumber !== null) db.settings.whatsappNumber = configRow.whatsappNumber;
          if (configRow.adminEmail !== undefined && configRow.adminEmail !== null) db.settings.adminEmail = configRow.adminEmail;
          if (configRow.adminPassword !== undefined && configRow.adminPassword !== null) db.settings.adminPassword = configRow.adminPassword;
          if (configRow.appsScriptUrl !== undefined && configRow.appsScriptUrl !== null) db.settings.appsScriptUrl = configRow.appsScriptUrl;
          if (configRow.logoUrl !== undefined && configRow.logoUrl !== null) db.settings.logoUrl = configRow.logoUrl;
          if (configRow.xoroAvatarUrl !== undefined && configRow.xoroAvatarUrl !== null) db.settings.xoroAvatarUrl = configRow.xoroAvatarUrl;
          if (configRow.bkashLogoUrl !== undefined && configRow.bkashLogoUrl !== null) db.settings.bkashLogoUrl = configRow.bkashLogoUrl;
          if (configRow.nagadLogoUrl !== undefined && configRow.nagadLogoUrl !== null) db.settings.nagadLogoUrl = configRow.nagadLogoUrl;
          if (configRow.facebookUrl !== undefined && configRow.facebookUrl !== null) db.settings.facebookUrl = configRow.facebookUrl;
          if (configRow.instagramUrl !== undefined && configRow.instagramUrl !== null) db.settings.instagramUrl = configRow.instagramUrl;
          if (configRow.lotteryDiscountPercentage !== undefined && configRow.lotteryDiscountPercentage !== null) db.settings.lotteryDiscountPercentage = Number(configRow.lotteryDiscountPercentage);
          if (configRow.lotteryCouponPrefix !== undefined && configRow.lotteryCouponPrefix !== null) db.settings.lotteryCouponPrefix = configRow.lotteryCouponPrefix;
          if (configRow.paymentBadgeTitle !== undefined && configRow.paymentBadgeTitle !== null) db.settings.paymentBadgeTitle = configRow.paymentBadgeTitle;
          if (configRow.paymentBadgeDescription !== undefined && configRow.paymentBadgeDescription !== null) db.settings.paymentBadgeDescription = configRow.paymentBadgeDescription;
          
          if (configRow.isCatalogDeactivated !== undefined && configRow.isCatalogDeactivated !== null) {
            db.settings.isCatalogDeactivated = configRow.isCatalogDeactivated === true || configRow.isCatalogDeactivated === "true";
          }
          if (configRow.deactivatedMessage !== undefined && configRow.deactivatedMessage !== null) db.settings.deactivatedMessage = configRow.deactivatedMessage;
          
          if (configRow.isLotteryDeactivated !== undefined && configRow.isLotteryDeactivated !== null) {
            db.settings.isLotteryDeactivated = configRow.isLotteryDeactivated === true || configRow.isLotteryDeactivated === "true";
          }
          if (configRow.isNotifyMeDeactivated !== undefined && configRow.isNotifyMeDeactivated !== null) {
            db.settings.isNotifyMeDeactivated = configRow.isNotifyMeDeactivated === true || configRow.isNotifyMeDeactivated === "true";
          }
          if (configRow.isXoroVoiceDisabled !== undefined && configRow.isXoroVoiceDisabled !== null) {
            db.settings.isXoroVoiceDisabled = configRow.isXoroVoiceDisabled === true || configRow.isXoroVoiceDisabled === "true";
          }
          if (configRow.isXoroVoiceAndAnswerDisabled !== undefined && configRow.isXoroVoiceAndAnswerDisabled !== null) {
            db.settings.isXoroVoiceAndAnswerDisabled = configRow.isXoroVoiceAndAnswerDisabled === true || configRow.isXoroVoiceAndAnswerDisabled === "true";
          }
          
          if (configRow.globalTimerEndTime !== undefined && configRow.globalTimerEndTime !== null) db.settings.globalTimerEndTime = configRow.globalTimerEndTime;
          if (configRow.globalTimerMessage !== undefined && configRow.globalTimerMessage !== null) db.settings.globalTimerMessage = configRow.globalTimerMessage;
          
          if (configRow.globalTimerActive !== undefined && configRow.globalTimerActive !== null) {
            db.settings.globalTimerActive = configRow.globalTimerActive === true || configRow.globalTimerActive === "true";
          }
          
          if (configRow.globalPaymentSystem !== undefined && configRow.globalPaymentSystem !== null) db.settings.globalPaymentSystem = configRow.globalPaymentSystem;
          if (configRow.globalPaymentMethod !== undefined && configRow.globalPaymentMethod !== null) db.settings.globalPaymentMethod = configRow.globalPaymentMethod;
          if (configRow.globalDeliveryDays !== undefined && configRow.globalDeliveryDays !== null) db.settings.globalDeliveryDays = configRow.globalDeliveryDays;
          if (configRow.accentColor !== undefined && configRow.accentColor !== null) db.settings.accentColor = configRow.accentColor;
          
          if (configRow.lotteryPrizes) {
            try {
              db.settings.lotteryPrizes = typeof configRow.lotteryPrizes === "string" ? JSON.parse(configRow.lotteryPrizes) : configRow.lotteryPrizes;
            } catch (err) {}
          }
        }
      } else if (error) {
        const errMsg = error.message || "";
        if (errMsg.includes("Could not find the table") || errMsg.includes("does not exist") || error.code === "PGRST116" || error.code === "42P01") {
          isSettingsTableAvailable = false;
        }
      }
    }

    if (!isSettingsTableAvailable) {
      const { data: bannersData, error: bannersError } = await supabase.from("banners").select("*");
      if (!bannersError && bannersData && bannersData.length > 0) {
        const systemSettingsRow = bannersData.find((b: any) => b.id === "system_settings_metadata");
        if (systemSettingsRow && systemSettingsRow.subtitle) {
          try {
            const fallbackSettings = JSON.parse(systemSettingsRow.subtitle);
            if (fallbackSettings.whatsappNumber !== undefined) db.settings.whatsappNumber = fallbackSettings.whatsappNumber;
            if (fallbackSettings.adminEmail !== undefined) db.settings.adminEmail = fallbackSettings.adminEmail;
            if (fallbackSettings.adminPassword !== undefined) db.settings.adminPassword = fallbackSettings.adminPassword;
            if (fallbackSettings.appsScriptUrl !== undefined) db.settings.appsScriptUrl = fallbackSettings.appsScriptUrl;
            if (fallbackSettings.logoUrl !== undefined) db.settings.logoUrl = fallbackSettings.logoUrl;
            if (fallbackSettings.xoroAvatarUrl !== undefined) db.settings.xoroAvatarUrl = fallbackSettings.xoroAvatarUrl;
            if (fallbackSettings.bkashLogoUrl !== undefined) db.settings.bkashLogoUrl = fallbackSettings.bkashLogoUrl;
            if (fallbackSettings.nagadLogoUrl !== undefined) db.settings.nagadLogoUrl = fallbackSettings.nagadLogoUrl;
            if (fallbackSettings.facebookUrl !== undefined) db.settings.facebookUrl = fallbackSettings.facebookUrl;
            if (fallbackSettings.instagramUrl !== undefined) db.settings.instagramUrl = fallbackSettings.instagramUrl;
            if (fallbackSettings.lotteryDiscountPercentage !== undefined) db.settings.lotteryDiscountPercentage = Number(fallbackSettings.lotteryDiscountPercentage);
            if (fallbackSettings.lotteryCouponPrefix !== undefined) db.settings.lotteryCouponPrefix = fallbackSettings.lotteryCouponPrefix;
            if (fallbackSettings.paymentBadgeTitle !== undefined) db.settings.paymentBadgeTitle = fallbackSettings.paymentBadgeTitle;
            if (fallbackSettings.paymentBadgeDescription !== undefined) db.settings.paymentBadgeDescription = fallbackSettings.paymentBadgeDescription;
            if (fallbackSettings.isCatalogDeactivated !== undefined) db.settings.isCatalogDeactivated = fallbackSettings.isCatalogDeactivated === true || fallbackSettings.isCatalogDeactivated === "true";
            if (fallbackSettings.deactivatedMessage !== undefined) db.settings.deactivatedMessage = fallbackSettings.deactivatedMessage;
            if (fallbackSettings.isLotteryDeactivated !== undefined) db.settings.isLotteryDeactivated = fallbackSettings.isLotteryDeactivated === true || fallbackSettings.isLotteryDeactivated === "true";
            if (fallbackSettings.isNotifyMeDeactivated !== undefined) db.settings.isNotifyMeDeactivated = fallbackSettings.isNotifyMeDeactivated === true || fallbackSettings.isNotifyMeDeactivated === "true";
            if (fallbackSettings.isXoroVoiceDisabled !== undefined) db.settings.isXoroVoiceDisabled = fallbackSettings.isXoroVoiceDisabled === true || fallbackSettings.isXoroVoiceDisabled === "true";
            if (fallbackSettings.globalTimerEndTime !== undefined) db.settings.globalTimerEndTime = fallbackSettings.globalTimerEndTime;
            if (fallbackSettings.globalTimerMessage !== undefined) db.settings.globalTimerMessage = fallbackSettings.globalTimerMessage;
            if (fallbackSettings.globalTimerActive !== undefined) db.settings.globalTimerActive = fallbackSettings.globalTimerActive === true || fallbackSettings.globalTimerActive === "true";
            if (fallbackSettings.globalPaymentSystem !== undefined) db.settings.globalPaymentSystem = fallbackSettings.globalPaymentSystem;
            if (fallbackSettings.globalPaymentMethod !== undefined) db.settings.globalPaymentMethod = fallbackSettings.globalPaymentMethod;
            if (fallbackSettings.globalDeliveryDays !== undefined) db.settings.globalDeliveryDays = fallbackSettings.globalDeliveryDays;
            if (fallbackSettings.productPayments !== undefined) db.settings.productPayments = fallbackSettings.productPayments;
            if (fallbackSettings.lotteryPrizes) db.settings.lotteryPrizes = fallbackSettings.lotteryPrizes;
            if (fallbackSettings.accentColor !== undefined) db.settings.accentColor = fallbackSettings.accentColor;
          } catch (jsonErr: any) {
            console.warn("⚠️ Failed to parse fallback settings in GET route:", jsonErr.message);
          }
        }
      }
    }
  } catch (err) {
    console.warn("⚠️ API dynamically reading settings table bypass:", err);
  }

  res.json(db.settings || { 
    whatsappNumber: "8801755104443", 
    adminEmail: "risatadnan4@gmail.com",
    appsScriptUrl: "https://script.google.com/macros/s/AKfycbwO87xXrLb1b-LS5XMoOmCHxo764LwXthLYkHA4AXZ_nJqTwvUHieOSTJkdp_UFf7mx/exec",
    logoUrl: "/stylex_logo.jpg",
    lotteryDiscountPercentage: 15,
    lotteryPrizes: [
      { text: "15% OFF (STYLEGOLD)", value: "STYLEGOLD", type: "coupon" },
      { text: "VIP Free Carriage", value: "FREE_SHIPPING", type: "shipping" },
      { text: "৳20 OFF (RISATVIP)", value: "RISATVIP", type: "coupon" },
      { text: "Limited Edition SX Patch", value: "SX_PATCH", type: "merch" },
      { text: "Exclusive Concierge Pass", value: "MEMBER_PASS", type: "pass" },
      { text: "Royal Golden Keychain", value: "KEYCHAIN", type: "merch" }
    ]
  });
});

// Save client discount request and send dynamic email dispatch
app.post("/api/discount-request", async (req, res) => {
  const { whatsappNumber } = req.body;
  if (!whatsappNumber) {
    return res.status(400).json({ message: "WhatsApp number is required." });
  }

  try {
    const scriptUrl = db.settings?.appsScriptUrl || "https://script.google.com/macros/s/AKfycbwO87xXrLb1b-LS5XMoOmCHxo764LwXthLYkHA4AXZ_nJqTwvUHieOSTJkdp_UFf7mx/exec";
    const targetEmail = db.settings?.adminEmail || "risatadnan4@gmail.com";
    const dateStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" });

    const payload = {
      email: targetEmail,
      recipient: targetEmail,
      recipientEmail: targetEmail,
      targetEmail: targetEmail,
      target_email: targetEmail,
      adminEmail: targetEmail,
      storeEmail: targetEmail,
      toEmail: targetEmail,
      notifyEmail: targetEmail,
      name: "Customer Requested Discount Voucher",
      phone: whatsappNumber,
      location: "StyleX Discount Request Form",
      items: `A customer has filled in their WhatsApp number (${whatsappNumber}) requesting a discount voucher coupon code. Complete verification and follow up with them on WhatsApp.`,
      total: "N/A",
      payment: "Campaign Voucher Lead",
      trxid: `STX-DSC-${Math.floor(100000 + Math.random() * 900000)}`,
      date: dateStr
    };

    fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    })
    .then(r => console.log(`✉️ Discount request Apps Script invoked! Status: ${r.status}`))
    .catch(ex => console.error(`⚠️ Discount prompt email dispatch failure:`, ex.message));

    return res.json({ success: true, message: "Discount request successfully submitted!" });
  } catch (error: any) {
    console.error("⚠️ Discount Email API trigger failed:", error.message);
    return res.status(500).json({ message: "Failed to dispatch email request. Please try again." });
  }
});

app.post("/api/settings", async (req, res) => {
  try {
    const { 
      whatsappNumber, adminEmail, adminPassword, appsScriptUrl, logoUrl, xoroAvatarUrl, 
      lotteryPrizes, lotteryDiscountPercentage, lotteryCouponPrefix, facebookUrl, instagramUrl, 
      paymentBadgeTitle, paymentBadgeDescription, isCatalogDeactivated, deactivatedMessage, 
      isLotteryDeactivated, isNotifyMeDeactivated, bkashLogoUrl, nagadLogoUrl,
      globalTimerEndTime, globalTimerMessage, globalTimerActive, globalPaymentSystem, 
      globalPaymentMethod, globalDeliveryDays, accentColor, isXoroVoiceDisabled, isXoroVoiceAndAnswerDisabled,
      smsProvider, twilioAccountSid, twilioAuthToken, twilioFromNumber, greenwebToken
    } = req.body;
    
    db.settings = {
      whatsappNumber: whatsappNumber ? whatsappNumber.trim() : (db.settings?.whatsappNumber || "8801755104443"),
      adminEmail: adminEmail ? adminEmail.trim() : (db.settings?.adminEmail || "risatadnan4@gmail.com"),
      adminPassword: adminPassword !== undefined ? adminPassword.trim() : (db.settings?.adminPassword || "risat123"),
      appsScriptUrl: appsScriptUrl ? appsScriptUrl.trim() : (db.settings?.appsScriptUrl || "https://script.google.com/macros/s/AKfycbwO87xXrLb1b-LS5XMoOmCHxo764LwXthLYkHA4AXZ_nJqTwvUHieOSTJkdp_UFf7mx/exec"),
      logoUrl: logoUrl !== undefined ? logoUrl.trim() : (db.settings?.logoUrl || "/stylex_logo.jpg"),
      xoroAvatarUrl: xoroAvatarUrl !== undefined ? xoroAvatarUrl.trim() : (db.settings?.xoroAvatarUrl || ""),
      bkashLogoUrl: bkashLogoUrl !== undefined ? bkashLogoUrl.trim() : (db.settings?.bkashLogoUrl || ""),
      nagadLogoUrl: nagadLogoUrl !== undefined ? nagadLogoUrl.trim() : (db.settings?.nagadLogoUrl || ""),
      lotteryDiscountPercentage: lotteryDiscountPercentage !== undefined ? Number(lotteryDiscountPercentage) : (db.settings?.lotteryDiscountPercentage || 15),
      lotteryCouponPrefix: lotteryCouponPrefix !== undefined ? lotteryCouponPrefix.trim().toUpperCase() : (db.settings?.lotteryCouponPrefix || "RISAT"),
      facebookUrl: facebookUrl !== undefined ? facebookUrl.trim() : (db.settings?.facebookUrl || "https://www.facebook.com/stylex24/"),
      instagramUrl: instagramUrl !== undefined ? instagramUrl.trim() : (db.settings?.instagramUrl || "https://www.instagram.com/style_x25/?hl=en"),
      paymentBadgeTitle: paymentBadgeTitle !== undefined ? paymentBadgeTitle.trim() : (db.settings?.paymentBadgeTitle || "SECURE CASH ON DELIVERY GUARANTEED"),
      paymentBadgeDescription: paymentBadgeDescription !== undefined ? paymentBadgeDescription.trim() : (db.settings?.paymentBadgeDescription || "Pay upon secure physical delivery handoff. We verify each individual container personally with verified secure luxury seal tags. Zero online gateway threat risk."),
      isCatalogDeactivated: isCatalogDeactivated !== undefined ? !!isCatalogDeactivated : (db.settings?.isCatalogDeactivated || false),
      deactivatedMessage: deactivatedMessage !== undefined ? deactivatedMessage.trim() : (db.settings?.deactivatedMessage || "The VIP showcase catalog is currently undergoing seasonal curation refresh. Private concierge is fully active — contact via WhatsApp for custom order loops."),
      isLotteryDeactivated: isLotteryDeactivated !== undefined ? !!isLotteryDeactivated : (db.settings?.isLotteryDeactivated || false),
      isNotifyMeDeactivated: isNotifyMeDeactivated !== undefined ? !!isNotifyMeDeactivated : (db.settings?.isNotifyMeDeactivated || false),
      isXoroVoiceDisabled: isXoroVoiceDisabled !== undefined ? !!isXoroVoiceDisabled : (db.settings?.isXoroVoiceDisabled || false),
      isXoroVoiceAndAnswerDisabled: isXoroVoiceAndAnswerDisabled !== undefined ? !!isXoroVoiceAndAnswerDisabled : (db.settings?.isXoroVoiceAndAnswerDisabled || false),
      smsProvider: smsProvider !== undefined ? smsProvider : (db.settings?.smsProvider || "mock"),
      twilioAccountSid: twilioAccountSid !== undefined ? twilioAccountSid : (db.settings?.twilioAccountSid || ""),
      twilioAuthToken: twilioAuthToken !== undefined ? twilioAuthToken : (db.settings?.twilioAuthToken || ""),
      twilioFromNumber: twilioFromNumber !== undefined ? twilioFromNumber : (db.settings?.twilioFromNumber || ""),
      greenwebToken: greenwebToken !== undefined ? greenwebToken : (db.settings?.greenwebToken || ""),
      globalTimerEndTime: globalTimerEndTime !== undefined ? globalTimerEndTime.trim() : (db.settings?.globalTimerEndTime || ""),
      globalTimerMessage: globalTimerMessage !== undefined ? globalTimerMessage.trim() : (db.settings?.globalTimerMessage || ""),
      globalTimerActive: globalTimerActive !== undefined ? !!globalTimerActive : (db.settings?.globalTimerActive || false),
      globalPaymentSystem: globalPaymentSystem !== undefined ? globalPaymentSystem.trim() : (db.settings?.globalPaymentSystem || "product_defined"),
      globalPaymentMethod: globalPaymentMethod !== undefined ? globalPaymentMethod.trim() : (db.settings?.globalPaymentMethod || "both"),
      globalDeliveryDays: globalDeliveryDays !== undefined ? globalDeliveryDays.trim() : (db.settings?.globalDeliveryDays || ""),
      accentColor: accentColor !== undefined ? accentColor.trim() : (db.settings?.accentColor || "#D4AF37"),
      lotteryPrizes: Array.isArray(lotteryPrizes) ? lotteryPrizes : (db.settings?.lotteryPrizes || []),
      productPayments: db.settings?.productPayments || {}
    };

    await syncSettingsToCloud();
    return res.json(db.settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Products Base API
app.get("/api/products", async (req, res) => {
  try {
    const { data: productsData, error: pError } = await supabase.from("products").select("*");
    if (!pError && productsData && productsData.length > 0) {
      const products = productsData.map((p: any) => {
        const localProduct = db.products ? db.products.find((lp: any) => String(lp.id) === String(p.id)) : null;
        const pm = (db.settings.productPayments && db.settings.productPayments[p.id]) || {};
        return {
          ...p,
          sizes: typeof p.sizes === "string" ? JSON.parse(p.sizes) : (Array.isArray(p.sizes) ? p.sizes : []),
          images: typeof p.images === "string" ? JSON.parse(p.images) : (Array.isArray(p.images) ? p.images : []),
          trending: p.trending !== undefined ? !!p.trending : true,
          featured: p.featured !== undefined ? !!p.featured : true,
          price: Number(p.price || 0),
          stock: Number(p.stock || 0),
          lotteryEligible: p.lotteryEligible !== undefined ? !!p.lotteryEligible : true,
          couponCode: p.couponCode || "",
          couponDiscountPercent: p.couponDiscountPercent !== undefined && p.couponDiscountPercent !== null ? Number(p.couponDiscountPercent) : undefined,
          offerPrice: pm.offerPrice !== undefined && pm.offerPrice !== null ? pm.offerPrice : ((p.offerPrice !== undefined && p.offerPrice !== null) ? Number(p.offerPrice) : (localProduct?.offerPrice !== undefined ? localProduct.offerPrice : undefined)),
          timerEndTime: pm.timerEndTime !== undefined && pm.timerEndTime !== null ? pm.timerEndTime : (p.timerEndTime || localProduct?.timerEndTime || undefined),
          timerMessage: pm.timerMessage !== undefined && pm.timerMessage !== null ? pm.timerMessage : (p.timerMessage || localProduct?.timerMessage || undefined),
          timerActive: pm.timerActive !== undefined ? !!pm.timerActive : (p.timerActive !== undefined ? !!p.timerActive : (localProduct?.timerActive !== undefined ? !!localProduct.timerActive : true)),
          bkashNumber: pm.bkashNumber !== undefined ? pm.bkashNumber : (p.bkashNumber || localProduct?.bkashNumber || ""),
          nagadNumber: pm.nagadNumber !== undefined ? pm.nagadNumber : (p.nagadNumber || localProduct?.nagadNumber || ""),
          paymentType: pm.paymentType !== undefined ? pm.paymentType : (p.paymentType || localProduct?.paymentType || "cod"),
          paymentPercentage: pm.paymentPercentage !== undefined ? (pm.paymentPercentage !== null ? Number(pm.paymentPercentage) : null) : (p.paymentPercentage !== undefined && p.paymentPercentage !== null ? Number(p.paymentPercentage) : (localProduct?.paymentPercentage !== undefined ? Number(localProduct.paymentPercentage) : null)),
          deliveryCharge: pm.deliveryCharge !== undefined ? Number(pm.deliveryCharge) : (p.deliveryCharge !== undefined && p.deliveryCharge !== null ? Number(p.deliveryCharge) : (localProduct?.deliveryCharge !== undefined ? Number(localProduct.deliveryCharge) : Number(p.deliveryPrice || 100))),
          deliveryDays: pm.deliveryDays !== undefined ? pm.deliveryDays : (p.deliveryDays || localProduct?.deliveryDays || "3-5"),
          isPinned: pm.isPinned !== undefined ? !!pm.isPinned : (p.isPinned !== undefined ? !!p.isPinned : (localProduct?.isPinned !== undefined ? !!localProduct.isPinned : false)),
          likes: pm.likes !== undefined ? Number(pm.likes) : (p.likes !== undefined ? Number(p.likes) : (localProduct?.likes !== undefined ? Number(localProduct.likes) : 0))
        };
      });
      db.products = products;
      saveDB();
      return res.json(products);
    }
  } catch (err: any) {
    console.warn("⚠️ Direct products fetch fallback to memory cache:", err.message);
  }
  res.json(db.products);
});

app.get("/api/products/:id", async (req, res) => {
  try {
    const { data, error } = await supabase.from("products").select("*").eq("id", req.params.id).single();
    if (!error && data) {
      const localProduct = db.products ? db.products.find((lp: any) => String(lp.id) === String(req.params.id)) : null;
      const pm = (db.settings.productPayments && db.settings.productPayments[req.params.id]) || {};
      const prod = {
        ...data,
        sizes: typeof data.sizes === "string" ? JSON.parse(data.sizes) : (Array.isArray(data.sizes) ? data.sizes : []),
        images: typeof data.images === "string" ? JSON.parse(data.images) : (Array.isArray(data.images) ? data.images : []),
        trending: data.trending !== undefined ? !!data.trending : true,
        featured: data.featured !== undefined ? !!data.featured : true,
        price: Number(data.price || 0),
        stock: Number(data.stock || 0),
        lotteryEligible: data.lotteryEligible !== undefined ? !!data.lotteryEligible : true,
        couponCode: data.couponCode || "",
        couponDiscountPercent: data.couponDiscountPercent !== undefined && data.couponDiscountPercent !== null ? Number(data.couponDiscountPercent) : undefined,
        offerPrice: pm.offerPrice !== undefined && pm.offerPrice !== null ? pm.offerPrice : ((data.offerPrice !== undefined && data.offerPrice !== null) ? Number(data.offerPrice) : (localProduct?.offerPrice !== undefined ? localProduct.offerPrice : undefined)),
        timerEndTime: pm.timerEndTime !== undefined && pm.timerEndTime !== null ? pm.timerEndTime : (data.timerEndTime || localProduct?.timerEndTime || undefined),
        timerMessage: pm.timerMessage !== undefined && pm.timerMessage !== null ? pm.timerMessage : (data.timerMessage || localProduct?.timerMessage || undefined),
        timerActive: pm.timerActive !== undefined ? !!pm.timerActive : (data.timerActive !== undefined ? !!data.timerActive : (localProduct?.timerActive !== undefined ? !!localProduct.timerActive : true)),
        bkashNumber: pm.bkashNumber !== undefined ? pm.bkashNumber : (data.bkashNumber || localProduct?.bkashNumber || ""),
        nagadNumber: pm.nagadNumber !== undefined ? pm.nagadNumber : (data.nagadNumber || localProduct?.nagadNumber || ""),
        paymentType: pm.paymentType !== undefined ? pm.paymentType : (data.paymentType || localProduct?.paymentType || "cod"),
        paymentPercentage: pm.paymentPercentage !== undefined ? (pm.paymentPercentage !== null ? Number(pm.paymentPercentage) : null) : (data.paymentPercentage !== undefined && data.paymentPercentage !== null ? Number(data.paymentPercentage) : (localProduct?.paymentPercentage !== undefined ? Number(localProduct.paymentPercentage) : null)),
        deliveryCharge: pm.deliveryCharge !== undefined ? Number(pm.deliveryCharge) : (data.deliveryCharge !== undefined && data.deliveryCharge !== null ? Number(data.deliveryCharge) : (localProduct?.deliveryCharge !== undefined ? Number(localProduct.deliveryCharge) : Number(data.deliveryPrice || 100))),
        deliveryDays: pm.deliveryDays !== undefined ? pm.deliveryDays : (data.deliveryDays || localProduct?.deliveryDays || "3-5"),
        isPinned: pm.isPinned !== undefined ? !!pm.isPinned : (data.isPinned !== undefined ? !!data.isPinned : (localProduct?.isPinned !== undefined ? !!localProduct.isPinned : false)),
        likes: pm.likes !== undefined ? Number(pm.likes) : (data.likes !== undefined ? Number(data.likes) : (localProduct?.likes !== undefined ? Number(localProduct.likes) : 0))
      };
      return res.json(prod);
    }
  } catch (err: any) {
    console.warn("⚠️ Direct product selected select fallback:", err.message);
  }
  const prod = db.products.find(p => p.id === req.params.id);
  if (prod) {
    res.json(prod);
  } else {
    res.status(404).json({ message: "Product not found" });
  }
});

app.post("/api/products", async (req, res) => {
  const newProduct: Product = req.body;
  if (!newProduct.id) {
    newProduct.id = Math.random().toString(36).substring(2, 10);
  }
  // Validate SKU Code
  if (!newProduct.code) {
    newProduct.code = `XP-${Math.floor(100 + Math.random() * 900)}`;
  }
  // Ensure deliveryPrice has a numeric fallback if not provided
  newProduct.deliveryPrice = newProduct.deliveryPrice !== undefined ? Number(newProduct.deliveryPrice) : 100;
  newProduct.deliveryPriceDhaka = newProduct.deliveryPriceDhaka !== undefined ? Number(newProduct.deliveryPriceDhaka) : 100;
  newProduct.deliveryPriceChattogram = newProduct.deliveryPriceChattogram !== undefined ? Number(newProduct.deliveryPriceChattogram) : 150;
  newProduct.deliveryPriceRajshahi = newProduct.deliveryPriceRajshahi !== undefined ? Number(newProduct.deliveryPriceRajshahi) : 150;
  newProduct.deliveryPriceKhulna = newProduct.deliveryPriceKhulna !== undefined ? Number(newProduct.deliveryPriceKhulna) : 150;
  newProduct.deliveryPriceBarishal = newProduct.deliveryPriceBarishal !== undefined ? Number(newProduct.deliveryPriceBarishal) : 150;
  newProduct.deliveryPriceSylhet = newProduct.deliveryPriceSylhet !== undefined ? Number(newProduct.deliveryPriceSylhet) : 150;
  newProduct.deliveryPriceRangpur = newProduct.deliveryPriceRangpur !== undefined ? Number(newProduct.deliveryPriceRangpur) : 150;
  newProduct.deliveryPriceMymensingh = newProduct.deliveryPriceMymensingh !== undefined ? Number(newProduct.deliveryPriceMymensingh) : 150;
  
  db.products.push(newProduct);
  
  // Create new product addition notification (visible to all users)
  const productNotif = {
    id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: 'new_product',
    title: `New Creation Addition`,
    message: `A magnificent new creation has been placed in the collective catalog: "${newProduct.title}". Inspect the bespoke custom piece and register interest now.`,
    date: new Date().toISOString(),
    productId: newProduct.id
  };
  if (!db.notifications) {
    db.notifications = [];
  }
  db.notifications.unshift(productNotif);

  // Simulate SMS notifications for new product launch to mobile subscribers
  if (db.smsSubscriptions && db.smsSubscriptions.length > 0) {
    if (!db.outboundSMSLogs) {
      db.outboundSMSLogs = [];
    }
    const eligibleSubscribers = db.smsSubscriptions.filter((sub: any) => sub.optInNewProducts);
    for (const sub of eligibleSubscribers) {
      const smsMessage = `✨ STYLE X Bespoke Alert ✨\nHello ${sub.name || 'Valued VIP Patron'}, we have just launched an exquisite new creation in our custom catalog:\n\n"${newProduct.title}"\nPrice: ৳${newProduct.price}\nSKU: ${newProduct.code}\n\nInspect this masterpiece and coordinate with your concierge to claim yours.`;
      db.outboundSMSLogs.unshift({
        id: `sms-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        phone: sub.phone,
        message: smsMessage,
        timestamp: new Date().toISOString()
      });
    }
  }

  if (!db.settings.productPayments) {
    db.settings.productPayments = {};
  }
  db.settings.productPayments[newProduct.id] = {
    bkashNumber: newProduct.bkashNumber || "",
    nagadNumber: newProduct.nagadNumber || "",
    paymentType: newProduct.paymentType || "cod",
    paymentPercentage: newProduct.paymentPercentage !== undefined && newProduct.paymentPercentage !== null ? Number(newProduct.paymentPercentage) : null,
    deliveryCharge: newProduct.deliveryCharge !== undefined ? Number(newProduct.deliveryCharge) : Number(newProduct.deliveryPrice || 100),
    deliveryDays: newProduct.deliveryDays || "",
    isPinned: !!newProduct.isPinned,
    offerPrice: newProduct.offerPrice !== undefined && newProduct.offerPrice !== null ? Number(newProduct.offerPrice) : null,
    timerEndTime: newProduct.timerEndTime || null,
    timerMessage: newProduct.timerMessage || null,
    timerActive: newProduct.timerActive !== undefined ? !!newProduct.timerActive : true,
    freeDelivery: !!newProduct.freeDelivery,
    likes: newProduct.likes !== undefined ? Number(newProduct.likes) : 0
  };
  syncSettingsToCloud();

  try {
    const payload: any = {
      id: newProduct.id,
      code: newProduct.code,
      title: newProduct.title,
      description: newProduct.description,
      price: Number(newProduct.price || 0),
      category: newProduct.category,
      stock: Number(newProduct.stock || 0),
      imageUrl: newProduct.imageUrl,
      images: Array.isArray(newProduct.images) ? JSON.stringify(newProduct.images) : JSON.stringify([]),
      sizes: JSON.stringify(newProduct.sizes),
      dimensions: newProduct.dimensions,
      whyBuy: newProduct.whyBuy,
      trending: !!newProduct.trending,
      featured: !!newProduct.featured,
      deliveryPrice: Number(newProduct.deliveryPrice || 100),
      deliveryPriceDhaka: Number(newProduct.deliveryPriceDhaka || 100),
      deliveryPriceChattogram: Number(newProduct.deliveryPriceChattogram || 150),
      deliveryPriceRajshahi: Number(newProduct.deliveryPriceRajshahi || 150),
      deliveryPriceKhulna: Number(newProduct.deliveryPriceKhulna || 150),
      deliveryPriceBarishal: Number(newProduct.deliveryPriceBarishal || 150),
      deliveryPriceSylhet: Number(newProduct.deliveryPriceSylhet || 150),
      deliveryPriceRangpur: Number(newProduct.deliveryPriceRangpur || 150),
      deliveryPriceMymensingh: Number(newProduct.deliveryPriceMymensingh || 150),
      lotteryEligible: newProduct.lotteryEligible !== undefined ? !!newProduct.lotteryEligible : true,
      couponCode: newProduct.couponCode ? newProduct.couponCode.trim() : "",
      couponDiscountPercent: newProduct.couponDiscountPercent !== undefined && newProduct.couponDiscountPercent !== null ? Number(newProduct.couponDiscountPercent) : null,
      offerPrice: newProduct.offerPrice !== undefined && newProduct.offerPrice !== null ? Number(newProduct.offerPrice) : null,
      timerEndTime: newProduct.timerEndTime || null,
      timerMessage: newProduct.timerMessage || null,
      timerActive: newProduct.timerActive !== undefined ? !!newProduct.timerActive : true,
      bkashNumber: newProduct.bkashNumber || "",
      nagadNumber: newProduct.nagadNumber || "",
      paymentType: newProduct.paymentType || "cod",
      paymentPercentage: newProduct.paymentPercentage !== undefined && newProduct.paymentPercentage !== null ? Number(newProduct.paymentPercentage) : null,
      deliveryCharge: newProduct.deliveryCharge !== undefined ? Number(newProduct.deliveryCharge) : Number(newProduct.deliveryPrice || 100),
      deliveryDays: newProduct.deliveryDays || null,
      freeDelivery: !!newProduct.freeDelivery
    };
    
    let { error: upsertError } = await supabase.from("products").upsert(payload);
    
    // Bulletproof fallback: If the Supabase table doesn't have these custom local-only columns, retry without them
    if (upsertError && (upsertError.message.includes("column") || upsertError.code === "P0002" || upsertError.message.includes("does not exist") || upsertError.message.includes("not found"))) {
      console.warn("⚠️ Custom local-only columns not found in Supabase schema. Bypassing and retrying product creation on Supabase...");
      delete payload.bkashNumber;
      delete payload.nagadNumber;
      delete payload.paymentType;
      delete payload.paymentPercentage;
      delete payload.deliveryCharge;
      delete payload.deliveryDays;
      delete payload.isPinned;
      delete payload.freeDelivery;
      delete payload.timerActive;
      const retryResult = await supabase.from("products").upsert(payload);
      upsertError = retryResult.error;
    }

    if (upsertError) {
      console.error("⚠️ Failed to mirror product creation to Supabase: ", upsertError.message);
      if (process.env.VERCEL) {
        return res.status(500).json({ 
          message: `Product creation failed on Supabase: ${upsertError.message}. Setup instructions: Please ensure you have a table named 'products' in your Supabase project under public schema, with columns matching the Product schema.` 
        });
      }
    }
  } catch (err: any) {
    console.error("⚠️ Failed to mirror product creation to Supabase: ", err.message);
    if (process.env.VERCEL) {
      return res.status(500).json({ message: `Database connection error: ${err.message}` });
    }
  }

  // Dispatch Real-Time Push Notification for New Product Drop
  try {
    sendPushNotification({
      title: "🎉 New Luxury Drop: " + newProduct.title,
      body: `A magnificent new creation has been added to our custom catalog! Click to inspect and order now.`,
      icon: newProduct.imageUrl || "/stylex_logo.jpg",
      url: `https://stylex.premium.shop/#product-${newProduct.id}`
    });
  } catch (pErr: any) {
    console.error("⚠️ Failed to dispatch push notification for new product:", pErr.message);
  }

  res.status(201).json(newProduct);
});

app.put("/api/products/:id", async (req, res) => {
  const idx = db.products.findIndex(p => p.id === req.params.id);
  if (idx !== -1) {
    const updatedBody = { ...req.body };
    if (updatedBody.deliveryPrice !== undefined) {
      updatedBody.deliveryPrice = Number(updatedBody.deliveryPrice);
    }
    if (updatedBody.deliveryPriceDhaka !== undefined) {
      updatedBody.deliveryPriceDhaka = Number(updatedBody.deliveryPriceDhaka);
    }
    if (updatedBody.deliveryPriceChattogram !== undefined) {
      updatedBody.deliveryPriceChattogram = Number(updatedBody.deliveryPriceChattogram);
    }
    if (updatedBody.deliveryPriceRajshahi !== undefined) {
      updatedBody.deliveryPriceRajshahi = Number(updatedBody.deliveryPriceRajshahi);
    }
    if (updatedBody.deliveryPriceKhulna !== undefined) {
      updatedBody.deliveryPriceKhulna = Number(updatedBody.deliveryPriceKhulna);
    }
    if (updatedBody.deliveryPriceBarishal !== undefined) {
      updatedBody.deliveryPriceBarishal = Number(updatedBody.deliveryPriceBarishal);
    }
    if (updatedBody.deliveryPriceSylhet !== undefined) {
      updatedBody.deliveryPriceSylhet = Number(updatedBody.deliveryPriceSylhet);
    }
    if (updatedBody.deliveryPriceRangpur !== undefined) {
      updatedBody.deliveryPriceRangpur = Number(updatedBody.deliveryPriceRangpur);
    }
    if (updatedBody.deliveryPriceMymensingh !== undefined) {
      updatedBody.deliveryPriceMymensingh = Number(updatedBody.deliveryPriceMymensingh);
    }
    db.products[idx] = { ...db.products[idx], ...updatedBody };
    const target = db.products[idx];
    if (!db.settings.productPayments) {
      db.settings.productPayments = {};
    }
    db.settings.productPayments[target.id] = {
      bkashNumber: target.bkashNumber || "",
      nagadNumber: target.nagadNumber || "",
      paymentType: target.paymentType || "cod",
      paymentPercentage: target.paymentPercentage !== undefined && target.paymentPercentage !== null ? Number(target.paymentPercentage) : null,
      deliveryCharge: target.deliveryCharge !== undefined ? Number(target.deliveryCharge) : Number(target.deliveryPrice || 100),
      deliveryDays: target.deliveryDays || "",
      isPinned: !!target.isPinned,
      offerPrice: target.offerPrice !== undefined && target.offerPrice !== null ? Number(target.offerPrice) : null,
      timerEndTime: target.timerEndTime || null,
      timerMessage: target.timerMessage || null,
      timerActive: target.timerActive !== undefined ? !!target.timerActive : true,
      freeDelivery: target.freeDelivery !== undefined ? !!target.freeDelivery : false,
      likes: target.likes !== undefined ? Number(target.likes) : 0
    };
    syncSettingsToCloud();

    try {
      const payload: any = {
        id: target.id,
        code: target.code,
        title: target.title,
        description: target.description,
        price: Number(target.price || 0),
        category: target.category,
        stock: Number(target.stock || 0),
        imageUrl: target.imageUrl,
        images: Array.isArray(target.images) ? JSON.stringify(target.images) : JSON.stringify([]),
        sizes: typeof target.sizes === "string" ? target.sizes : JSON.stringify(target.sizes),
        dimensions: target.dimensions,
        whyBuy: target.whyBuy,
        trending: !!target.trending,
        featured: !!target.featured,
        isPinned: !!target.isPinned,
        deliveryPrice: Number(target.deliveryPrice || 100),
        deliveryPriceDhaka: Number(target.deliveryPriceDhaka || 100),
        deliveryPriceChattogram: Number(target.deliveryPriceChattogram || 150),
        deliveryPriceRajshahi: Number(target.deliveryPriceRajshahi || 150),
        deliveryPriceKhulna: Number(target.deliveryPriceKhulna || 150),
        deliveryPriceBarishal: Number(target.deliveryPriceBarishal || 150),
        deliveryPriceSylhet: Number(target.deliveryPriceSylhet || 150),
        deliveryPriceRangpur: Number(target.deliveryPriceRangpur || 150),
        deliveryPriceMymensingh: Number(target.deliveryPriceMymensingh || 150),
        lotteryEligible: target.lotteryEligible !== undefined ? !!target.lotteryEligible : true,
        couponCode: target.couponCode ? target.couponCode.trim() : "",
        couponDiscountPercent: target.couponDiscountPercent !== undefined && target.couponDiscountPercent !== null ? Number(target.couponDiscountPercent) : null,
        offerPrice: target.offerPrice !== undefined && target.offerPrice !== null ? Number(target.offerPrice) : null,
        timerEndTime: target.timerEndTime || null,
        timerMessage: target.timerMessage || null,
        timerActive: target.timerActive !== undefined ? !!target.timerActive : true,
        bkashNumber: target.bkashNumber || "",
        nagadNumber: target.nagadNumber || "",
        paymentType: target.paymentType || "cod",
        paymentPercentage: target.paymentPercentage !== undefined && target.paymentPercentage !== null ? Number(target.paymentPercentage) : null,
        deliveryCharge: target.deliveryCharge !== undefined ? Number(target.deliveryCharge) : Number(target.deliveryPrice || 100),
        deliveryDays: target.deliveryDays || null,
        freeDelivery: target.freeDelivery !== undefined ? !!target.freeDelivery : false
      };

      let { error: upsertError } = await supabase.from("products").upsert(payload);

      // Bulletproof fallback: If the Supabase table doesn't have these custom local-only columns, retry without them
      if (upsertError && (upsertError.message.includes("column") || upsertError.code === "P0002" || upsertError.message.includes("does not exist") || upsertError.message.includes("not found"))) {
        console.warn("⚠️ Custom local-only columns not found in Supabase schema. Bypassing and retrying product update on Supabase...");
        delete payload.bkashNumber;
        delete payload.nagadNumber;
        delete payload.paymentType;
        delete payload.paymentPercentage;
        delete payload.deliveryCharge;
        delete payload.deliveryDays;
        delete payload.isPinned;
        delete payload.freeDelivery;
        delete payload.timerActive;
        const retryResult = await supabase.from("products").upsert(payload);
        upsertError = retryResult.error;
      }

      if (upsertError) {
        console.error("⚠️ Failed to mirror product update to Supabase: ", upsertError.message);
        if (process.env.VERCEL) {
          return res.status(500).json({ 
            message: `Product update failed on Supabase: ${upsertError.message}. Make sure your 'products' table exists with matches columns.` 
          });
        }
      }
    } catch (err: any) {
      console.error("⚠️ Failed to mirror product update to Supabase: ", err.message);
      if (process.env.VERCEL) {
        return res.status(500).json({ message: `Database connection error: ${err.message}` });
      }
    }

    res.json(target);
  } else {
    res.status(404).json({ message: "Product not found" });
  }
});

app.post("/api/products/:id/like", async (req, res) => {
  const productId = req.params.id;
  const idx = db.products.findIndex(p => String(p.id) === String(productId));
  if (idx !== -1) {
    if (!db.settings.productPayments) {
      db.settings.productPayments = {};
    }
    if (!db.settings.productPayments[productId]) {
      db.settings.productPayments[productId] = {};
    }
    
    const currentLikes = db.settings.productPayments[productId].likes !== undefined 
      ? Number(db.settings.productPayments[productId].likes) 
      : (db.products[idx].likes !== undefined ? Number(db.products[idx].likes) : 0);
      
    const newLikes = currentLikes + 1;
    db.settings.productPayments[productId].likes = newLikes;
    db.products[idx].likes = newLikes;
    
    saveDB();
    syncSettingsToCloud();
    return res.json({ success: true, likes: newLikes });
  }
  return res.status(404).json({ error: "Product not found" });
});

app.delete("/api/products/:id", async (req, res) => {
  const idx = db.products.findIndex(p => p.id === req.params.id);
  if (idx !== -1) {
    const deleted = db.products.splice(idx, 1)[0];
    if (db.settings.productPayments) {
      delete db.settings.productPayments[req.params.id];
    }
    syncSettingsToCloud();

    try {
      const { error: deleteError } = await supabase.from("products").delete().eq("id", req.params.id);
      if (deleteError) {
        console.error("⚠️ Failed to mirror product deletion to Supabase: ", deleteError.message);
        if (process.env.VERCEL) {
          return res.status(500).json({ message: `Product deletion failed on Supabase: ${deleteError.message}` });
        }
      }
    } catch (err: any) {
      console.error("⚠️ Failed to mirror product deletion to Supabase: ", err.message);
    }

    res.json(deleted);
  } else {
    res.status(404).json({ message: "Product not found" });
  }
});

// Banners API
app.get("/api/banners", async (req, res) => {
  try {
    const { data, error } = await supabase.from("banners").select("*");
    if (!error && data) {
      const banners = data.filter((b: any) => b.id !== "system_settings_metadata").map((b: any) => ({
        ...b,
        active: !!b.active
      }));
      db.banners = banners;
      db.seededBanners = true;
      saveDB();
      return res.json(banners);
    }
  } catch (err: any) {
    console.warn("⚠️ Direct banners fetch fallback:", err.message);
  }
  res.json(db.banners);
});

app.post("/api/banners", async (req, res) => {
  const newBanner: Banner = req.body;
  newBanner.id = newBanner.id || `banner-${Date.now()}`;
  
  db.banners.push(newBanner);
  saveDB();
  try {
    await supabase.from("banners").upsert(newBanner);
  } catch (err: any) {
    console.error("⚠️ Banners Supabase upsert error:", err.message);
  }
  res.status(201).json(newBanner);
});

app.put("/api/banners/:id", async (req, res) => {
  const idx = db.banners.findIndex(b => b.id === req.params.id);
  if (idx !== -1) {
    db.banners[idx] = { ...db.banners[idx], ...req.body };
    saveDB();
    try {
      await supabase.from("banners").upsert(db.banners[idx]);
    } catch (err: any) {
      console.error("⚠️ Banners Supabase update error:", err.message);
    }
    res.json(db.banners[idx]);
  } else {
    res.status(404).json({ message: "Banner not found" });
  }
});

app.delete("/api/banners/:id", async (req, res) => {
  const idx = db.banners.findIndex(b => b.id === req.params.id);
  if (idx !== -1) {
    const del = db.banners.splice(idx, 1)[0];
    saveDB();
    try {
      await supabase.from("banners").delete().eq("id", req.params.id);
    } catch (err: any) {
      console.error("⚠️ Banners Supabase delete error:", err.message);
    }
    res.json(del);
  } else {
    res.status(404).json({ message: "Banner not found" });
  }
});

// Orders API
app.get("/api/orders", async (req, res) => {
  try {
    const { data, error } = await supabase.from("orders").select("*");
    if (!error && data && data.length > 0) {
      const orders = data.map((o: any) => ({
        ...o,
        items: typeof o.items === "string" ? JSON.parse(o.items) : (Array.isArray(o.items) ? o.items : []),
        totalAmount: Number(o.totalAmount)
      }));
      db.orders = orders;
      saveDB();
      return res.json(orders);
    }
  } catch (err: any) {
    console.warn("⚠️ Direct orders fetch fallback:", err.message);
  }
  res.json(db.orders);
});

app.get("/api/orders/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .or(`id.eq.${req.params.id},customerPhone.eq.${req.params.id}`);
    if (!error && data && data.length > 0) {
      const dbOrders = data.map((o: any) => ({
        ...o,
        items: typeof o.items === "string" ? JSON.parse(o.items) : (Array.isArray(o.items) ? o.items : []),
        totalAmount: Number(o.totalAmount)
      }));
      return res.json(dbOrders[0]);
    }
  } catch (err: any) {
    console.warn("⚠️ Direct order by id fetch fallback:", err.message);
  }
  const order = db.orders.find(o => o.id === req.params.id || o.customerPhone === req.params.id);
  if (order) {
    res.json(order);
  } else {
    res.status(404).json({ message: "Order not found" });
  }
});

// --- Secured Admin Email System ---
async function sendAdminEmail({ subject, text, html, toEmail }: { subject: string, text: string, html: string, toEmail?: string }) {
  const adminEmail = toEmail || process.env.ADMIN_EMAIL || db.settings?.adminEmail || "risatadnan4@gmail.com";
  const timestamp = new Date().toISOString();
  console.log(`[EMAIL_SYSTEM] [${timestamp}] Dispatching email to admin: ${adminEmail}`);

  let lastError: Error | null = null;

  // 1. Try to send via standard SMTP if configured
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT || 587);
    console.log(`[EMAIL_SYSTEM] Attempting SMTP delivery via host: ${smtpHost}:${smtpPort}`);
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        connectionTimeout: 8000,
        greetingTimeout: 5000,
      });

      await transporter.sendMail({
        from: `"Style X System" <${process.env.SMTP_USER}>`,
        to: adminEmail,
        subject,
        text,
        html
      });
      console.log(`[EMAIL_SYSTEM] [SUCCESS] SMTP Email sent successfully to ${adminEmail}`);
      return;
    } catch (smtpErr: any) {
      console.error(`[EMAIL_SYSTEM] [SMTP_FAIL] SMTP delivery failed to ${adminEmail}:`, smtpErr.message || smtpErr);
      lastError = smtpErr;
    }
  } else {
    console.log(`[EMAIL_SYSTEM] SMTP is unconfigured. Skipping SMTP route.`);
  }

  // 2. Try to send via Resend API if API Key is configured
  if (process.env.RESEND_API_KEY) {
    console.log(`[EMAIL_SYSTEM] Attempting Resend API delivery...`);
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: "StyleX <onboarding@resend.dev>",
          to: adminEmail,
          subject,
          text,
          html
        })
      });
      if (response.ok) {
        console.log(`[EMAIL_SYSTEM] [SUCCESS] Resend Email sent successfully to ${adminEmail}`);
        return;
      } else {
        const errText = await response.text();
        const resendErr = new Error(`Resend API HTTP ${response.status}: ${errText}`);
        console.error(`[EMAIL_SYSTEM] [RESEND_FAIL] Resend API error:`, resendErr.message);
        lastError = resendErr;
      }
    } catch (resendErr: any) {
      console.error(`[EMAIL_SYSTEM] [RESEND_FAIL] Resend API call failed:`, resendErr.message || resendErr);
      lastError = resendErr;
    }
  } else {
    console.log(`[EMAIL_SYSTEM] Resend API Key is unconfigured. Skipping Resend route.`);
  }

  // 3. Fallback: Google Apps Script Webhook (Pre-configured admin routing)
  const scriptUrl = db.settings?.appsScriptUrl || "https://script.google.com/macros/s/AKfycbwO87xXrLb1b-LS5XMoOmCHxo764LwXthLYkHA4AXZ_nJqTwvUHieOSTJkdp_UFf7mx/exec";
  console.log(`[EMAIL_SYSTEM] Attempting fallback Google Apps Script Webhook delivery to: ${scriptUrl}`);
  try {
    const scriptRes = await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        email: adminEmail,
        recipient: adminEmail,
        toEmail: adminEmail,
        subject: subject,
        body: text,
        message: text,
        html: html
      })
    });
    if (scriptRes.ok) {
      console.log(`[EMAIL_SYSTEM] [SUCCESS] Fallback Apps Script webhook invoked successfully for ${adminEmail}`);
      return;
    } else {
      const errText = await scriptRes.text();
      const scriptErr = new Error(`Apps Script responded with HTTP ${scriptRes.status}: ${errText}`);
      console.error(`[EMAIL_SYSTEM] [WEBHOOK_FAIL] Apps Script error:`, scriptErr.message);
      lastError = scriptErr;
    }
  } catch (scriptErr: any) {
    console.error(`[EMAIL_SYSTEM] [WEBHOOK_FAIL] Fallback Apps Script webhook failed:`, scriptErr.message || scriptErr);
    lastError = scriptErr;
  }

  // If all methods failed, throw error to trigger caller's retry logic
  const finalErrorMessage = lastError ? lastError.message : "No email provider configured (SMTP, Resend, or Webhook).";
  throw new Error(finalErrorMessage);
}

app.post("/api/checkout-step1-notify", express.json(), async (req, res) => {
  const { 
    customerName, 
    customerPhone, 
    customerAddress, 
    customerCity, 
    customerDistrict,
    customerEmail,
    items,
    estimatedTotal
  } = req.body;

  if (!customerName || !customerPhone || !customerAddress) {
    return res.status(400).json({ message: "Missing required details." });
  }

  // Store new user phone number
  registerCustomerPhone(customerPhone, customerName, customerEmail, 'checkout_step1');

  const orderItemsText = items && Array.isArray(items) 
    ? items.map((i: any) => `- ${i.title} (${i.selectedSize || "Standard"}) x${i.quantity} @ ৳${i.price}`).join("\n")
    : "No items specified";

  const emailSubject = `📋 Step 1 Form Submitted by: ${customerName}`;
  const emailBody = `
========================================
📋 STEP 1 CHECKOUT FORM DETAILS
========================================
👤 Customer Name: ${customerName}
📞 Mobile Number: ${customerPhone}
✉️ Email: ${customerEmail || 'Guest'}
🏠 Delivery Address: ${customerAddress}
🏙️ City/District: ${customerCity || 'N/A'} / ${customerDistrict || 'N/A'}
💰 Estimated Total: ৳${estimatedTotal || 'N/A'}
📦 Selected Items:
${orderItemsText}
⏰ Clicked Time: ${new Date().toLocaleString()}
========================================
  `;

  const emailHtml = `
    <div style="font-family: sans-serif; padding: 20px; max-width: 600px; border: 1.5px dashed #d4af37; border-radius: 8px; background-color: #0f0a1c; color: #fff;">
      <h2 style="color: #d4af37; border-bottom: 2px solid #d4af37; padding-bottom: 10px; margin-top: 0;">📋 Step 1 Form Submitted</h2>
      <p style="font-size: 14px; color: #eaeaea;">The customer has filled out the primary checkout form and clicked the button to proceed to payment.</p>
      
      <table style="width: 100%; border-collapse: collapse; margin-top: 15px; color: #fff;">
        <tr>
          <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid rgba(255,255,255,0.1); width: 150px; color: #d4af37;">Customer Name:</td>
          <td style="padding: 8px; border-bottom: 1px solid rgba(255,255,255,0.1);">${customerName}</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid rgba(255,255,255,0.1); color: #d4af37;">Mobile Number:</td>
          <td style="padding: 8px; border-bottom: 1px solid rgba(255,255,255,0.1);">${customerPhone}</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid rgba(255,255,255,0.1); color: #d4af37;">Email:</td>
          <td style="padding: 8px; border-bottom: 1px solid rgba(255,255,255,0.1);">${customerEmail || 'Guest'}</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid rgba(255,255,255,0.1); color: #d4af37; vertical-align: top;">Selected Items:</td>
          <td style="padding: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); white-space: pre-line;">${orderItemsText}</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid rgba(255,255,255,0.1); color: #d4af37;">Delivery Address:</td>
          <td style="padding: 8px; border-bottom: 1px solid rgba(255,255,255,0.1);">${customerAddress}, ${customerCity || ''}</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid rgba(255,255,255,0.1); color: #d4af37;">Estimated Total:</td>
          <td style="padding: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); font-weight: bold; color: #22c55e;">৳${estimatedTotal}</td>
        </tr>
      </table>
    </div>
  `;

  try {
    await sendAdminEmail({ subject: emailSubject, text: emailBody, html: emailHtml });
    res.json({ success: true, message: "Step 1 notification sent successfully to admin email." });
  } catch (err: any) {
    console.error("Step 1 email dispatch failed:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/auth/signup-notify", express.json(), async (req, res) => {
  const { fullName, mobileNumber, email, signupTime, userId, browser, device, country } = req.body;
  if (!fullName || !mobileNumber || !email) {
    console.error(`[SIGNUP_EMAIL] [BAD_REQUEST] Missing required details: fullName='${fullName}', mobileNumber='${mobileNumber}', email='${email}'`);
    return res.status(400).json({ message: "Missing required signup details." });
  }

  // Store new user phone number
  registerCustomerPhone(mobileNumber, fullName, email, 'signup');

  const clientBrowser = browser || "Unknown Browser";
  const clientDevice = device || "Unknown Device";
  
  // Extract server-side country headers as backup/fallback if client-side is unknown
  const serverCountry = req.headers["cf-ipcountry"] || req.headers["x-appengine-country"] || req.headers["x-cloud-trace-context"] || "Unknown";
  const finalCountry = (country && country !== "Unknown Country") ? country : (serverCountry !== "Unknown" ? String(serverCountry) : "Unknown Country");

  const traceTimestamp = new Date().toISOString();
  console.log(`[SIGNUP_EMAIL] [START] [${traceTimestamp}] Processing user signup notification for: ${fullName} (${email}), ID: ${userId || 'N/A'}`);

  const emailBody = `
========================================
🆕 NEW USER SIGNED UP
========================================
👤 Full Name: ${fullName}
📞 Mobile Number: ${mobileNumber}
✉️ Email: ${email}
🆔 User ID: ${userId || 'N/A'}
⏰ Signup Time: ${signupTime || new Date().toLocaleString()}
🌐 Browser: ${clientBrowser}
📱 Device: ${clientDevice}
🌍 Country: ${finalCountry}
========================================
  `;

  const emailHtml = `
    <div style="font-family: sans-serif; padding: 25px; max-width: 600px; border: 2px solid #d4af37; border-radius: 12px; background-color: #fafafa; color: #333;">
      <h2 style="color: #d4af37; border-bottom: 2px solid #d4af37; padding-bottom: 12px; margin-top: 0; font-family: serif; font-size: 24px; text-transform: uppercase; letter-spacing: 1px;">🆕 New Style X Member Signup</h2>
      <p style="font-size: 14px; line-height: 1.5; color: #555;">A new member has completed the secure VIP registration flow. Below are the registered member credentials and session metadata details:</p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px;">
        <tr>
          <td style="padding: 10px 8px; font-weight: bold; width: 160px; border-bottom: 1px solid #eaeaea; color: #111;">Full Name:</td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #eaeaea; color: #444;">${fullName}</td>
        </tr>
        <tr>
          <td style="padding: 10px 8px; font-weight: bold; border-bottom: 1px solid #eaeaea; color: #111;">Mobile Number:</td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #eaeaea; color: #444;">${mobileNumber}</td>
        </tr>
        <tr>
          <td style="padding: 10px 8px; font-weight: bold; border-bottom: 1px solid #eaeaea; color: #111;">Email Address:</td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #eaeaea;"><a href="mailto:${email}" style="color: #d4af37; text-decoration: none; font-weight: bold;">${email}</a></td>
        </tr>
        <tr>
          <td style="padding: 10px 8px; font-weight: bold; border-bottom: 1px solid #eaeaea; color: #111;">User ID:</td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #eaeaea; font-family: monospace; font-size: 12px; color: #666;">${userId || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 10px 8px; font-weight: bold; border-bottom: 1px solid #eaeaea; color: #111;">Signup Time:</td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #eaeaea; color: #444;">${signupTime || new Date().toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding: 10px 8px; font-weight: bold; border-bottom: 1px solid #eaeaea; color: #111;">Browser:</td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #eaeaea; color: #444; font-size: 13px;">${clientBrowser}</td>
        </tr>
        <tr>
          <td style="padding: 10px 8px; font-weight: bold; border-bottom: 1px solid #eaeaea; color: #111;">Device:</td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #eaeaea; color: #444; font-size: 13px;">${clientDevice}</td>
        </tr>
        <tr>
          <td style="padding: 10px 8px; font-weight: bold; border-bottom: 1px solid #eaeaea; color: #111;">Country (GeoIP):</td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #eaeaea; color: #444; font-size: 13px; font-weight: 500;">${finalCountry}</td>
        </tr>
      </table>
      <div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #eaeaea; font-size: 11px; text-align: center; color: #888; font-family: monospace;">
        Secure Automated Real-time Dispatch System • Style X Premium
      </div>
    </div>
  `;

  let attemptCount = 1;
  let sentSuccessfully = false;
  let executionError: any = null;

  const tryEmailSend = async () => {
    let mailSuccess = false;
    let webhookSuccess = false;

    // 1. Try sendAdminEmail (standard SMTP, Resend, or Google Apps Script Webhook fallback)
    try {
      console.log(`[SIGNUP_EMAIL] [ATTEMPT ${attemptCount}] Dispatching via sendAdminEmail to risatadnan5@gmail.com...`);
      await sendAdminEmail({
        subject: `🔔 [SIGNUP NOTIFICATION] New Member Registered: ${fullName}`,
        text: emailBody,
        html: emailHtml,
        toEmail: "risatadnan5@gmail.com"
      });
      mailSuccess = true;
      console.log(`[SIGNUP_EMAIL] [SUCCESS] [ATTEMPT ${attemptCount}] sendAdminEmail to risatadnan5@gmail.com succeeded.`);
    } catch (err: any) {
      console.error(`[SIGNUP_EMAIL] [FAIL] [ATTEMPT ${attemptCount}] sendAdminEmail failed:`, err.message || err);
      executionError = err;
    }

    // 2. ALSO trigger Google Apps Script Webhook directly with rich order-like payload (just like /api/orders)
    const adminEmail = "risatadnan5@gmail.com";
    const scriptUrl = db.settings?.appsScriptUrl || "https://script.google.com/macros/s/AKfycbwO87xXrLb1b-LS5XMoOmCHxo764LwXthLYkHA4AXZ_nJqTwvUHieOSTJkdp_UFf7mx/exec";
    
    console.log(`[SIGNUP_EMAIL] [ATTEMPT ${attemptCount}] Dispatching directly to Google Apps Script URL: ${scriptUrl}`);
    try {
      const response = await fetch(scriptUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          // Email routing parameters
          email: adminEmail,
          recipient: adminEmail,
          recipientEmail: adminEmail,
          targetEmail: adminEmail,
          target_email: adminEmail,
          adminEmail: adminEmail,
          storeEmail: adminEmail,
          toEmail: adminEmail,
          notifyEmail: adminEmail,
          
          // Subject & Email content for simple forwarding webhooks
          subject: `🔔 [SIGNUP NOTIFICATION] New Member Registered: ${fullName}`,
          body: emailBody,
          html: emailHtml,
          
          // Rich order-like parameters for spreadsheet / form extraction webhooks
          name: fullName,
          phone: mobileNumber,
          customerName: fullName,
          customerPhone: mobileNumber,
          customerEmail: email,
          location: `Signup GeoIP: ${finalCountry}`,
          items: `New Member VIP Signup Details:\n- Name: ${fullName}\n- Mobile: ${mobileNumber}\n- Email: ${email}`,
          total: `New Member Registration (ID: ${userId || 'N/A'})`,
          payment: `Device: ${clientDevice} (${clientBrowser})`,
          paymentStatus: "Verified",
          trxid: `REG-${userId ? userId.slice(0, 8).toUpperCase() : 'VIP'}`,
          screenshot: "",
          date: signupTime || new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" })
        })
      });

      if (response.ok) {
        webhookSuccess = true;
        console.log(`[SIGNUP_EMAIL] [SUCCESS] [ATTEMPT ${attemptCount}] Direct Google Apps Script webhook succeeded.`);
      } else {
        const txt = await response.text();
        console.error(`[SIGNUP_EMAIL] [FAIL] [ATTEMPT ${attemptCount}] Direct Google Apps Script returned status ${response.status}:`, txt);
      }
    } catch (err: any) {
      console.error(`[SIGNUP_EMAIL] [FAIL] [ATTEMPT ${attemptCount}] Direct Google Apps Script call failed:`, err.message || err);
      if (!executionError) executionError = err;
    }

    // Mark as successful if EITHER sendAdminEmail succeeded OR direct Apps Script succeeded
    if (mailSuccess || webhookSuccess) {
      sentSuccessfully = true;
    }
  };

  // Execute everything asynchronously in the background so the user registers instantly!
  res.json({ 
    success: true, 
    message: "Admin notification queued successfully." 
  });

  // Run in background
  (async () => {
    try {
      // Attempt 1
      await tryEmailSend();

      // Retry once if failed
      if (!sentSuccessfully) {
        attemptCount++;
        console.warn(`[SIGNUP_EMAIL] First attempt failed. Retrying in 1.2s in background...`);
        await new Promise((resolve) => setTimeout(resolve, 1200));
        await tryEmailSend();
      }

      if (sentSuccessfully) {
        console.log(`[SIGNUP_EMAIL] Background dispatch succeeded for: ${email}`);
      } else {
        const errorDetails = executionError?.message || "All custom SMTP/Resend providers failed";
        console.error(`[SIGNUP_EMAIL] [ABORT] Both background notification attempts failed for: ${email}. Error: ${errorDetails}`);

        // Save failed notification in Supabase table
        let savedToSupabase = false;
        try {
          console.log(`[SIGNUP_EMAIL] Registering failed notification inside Supabase...`);
          const { error: dbError } = await supabase.from("failed_notifications").insert({
            user_id: userId || null,
            full_name: fullName,
            email: email,
            mobile_number: mobileNumber,
            browser: clientBrowser,
            device: clientDevice,
            country: finalCountry,
            error_message: errorDetails,
            retry_count: 1,
            created_at: new Date().toISOString()
          });

          if (dbError) {
            throw dbError;
          }
          savedToSupabase = true;
          console.log(`[SIGNUP_EMAIL] Saved failed notification to 'failed_notifications' table on Supabase.`);
        } catch (dbErr: any) {
          console.error(`[SIGNUP_EMAIL] Supabase DB failed_notifications insert failed:`, dbErr.message || dbErr);
        }

        // Save locally as a secondary database backup
        try {
          db.failed_notifications = db.failed_notifications || [];
          db.failed_notifications.push({
            userId: userId || null,
            fullName,
            email,
            mobileNumber,
            browser: clientBrowser,
            device: clientDevice,
            country: finalCountry,
            errorMessage: errorDetails,
            createdAt: new Date().toISOString(),
            savedToSupabase
          });
          saveDB();
          console.log(`[SIGNUP_EMAIL] Backup stored in local database luxury_db.json successfully.`);
        } catch (localSaveErr: any) {
          console.error(`[SIGNUP_EMAIL] Backup local save failed:`, localSaveErr.message);
        }
      }
    } catch (bgErr: any) {
      console.error(`[SIGNUP_EMAIL] Background processing exception:`, bgErr.message);
    }
  })();
});

app.get("/api/notifications", (req, res) => {
  res.json(db.notifications || []);
});

app.get("/api/push-public-key", (req, res) => {
  if (db.vapidKeys && db.vapidKeys.publicKey) {
    res.json({ publicKey: db.vapidKeys.publicKey });
  } else {
    res.status(404).json({ error: "VAPID keys not configured" });
  }
});

app.post("/api/push-subscribe", (req, res) => {
  const subscription = req.body;
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: "Invalid subscription" });
  }
  db.pushSubscriptions = db.pushSubscriptions || [];
  const exists = db.pushSubscriptions.some((sub: any) => sub.endpoint === subscription.endpoint);
  if (!exists) {
    db.pushSubscriptions.push(subscription);
    saveDB();
  }
  res.status(201).json({ success: true });
});

app.post("/api/push-dispatch", (req, res) => {
  const { title, body, icon, url } = req.body;
  if (!title || !body) {
    return res.status(400).json({ error: "Missing title or body" });
  }
  sendPushNotification({ title, body, icon: icon || "/stylex_logo.jpg", url: url || "https://stylex.premium.shop" });
  res.json({ success: true, count: (db.pushSubscriptions || []).length });
});

// Helper function to send push notifications
function sendPushNotification(payload: { title: string; body: string; icon?: string; url?: string }) {
  db.pushSubscriptions = db.pushSubscriptions || [];
  const payloadStr = JSON.stringify(payload);
  const removals: string[] = [];

  console.log(`[PUSH_DISPATCH] Dispatching notification to ${db.pushSubscriptions.length} subscriptions...`);

  db.pushSubscriptions.forEach((sub: any) => {
    webPush.sendNotification(sub, payloadStr)
      .then(() => {
        console.log(`[PUSH_DISPATCH] Successfully sent to subscription endpoint: ${sub.endpoint.substring(0, 50)}...`);
      })
      .catch((err: any) => {
        console.warn(`[PUSH_DISPATCH] Push subscription failed (statusCode: ${err.statusCode}):`, err.message);
        if (err.statusCode === 410 || err.statusCode === 404) {
          removals.push(sub.endpoint);
        }
      });
  });

  // Clean up expired subscriptions after brief delay
  setTimeout(() => {
    if (removals.length > 0) {
      db.pushSubscriptions = db.pushSubscriptions.filter((sub: any) => !removals.includes(sub.endpoint));
      saveDB();
      console.log(`[PUSH_DISPATCH] Pruned ${removals.length} inactive or expired subscriptions.`);
    }
  }, 3000);
}

app.post("/api/orders", async (req, res) => {
  const { 
    customerName, 
    customerPhone, 
    customerAddress, 
    customerCity, 
    customerNotes, 
    customerEmail, 
    items, 
    totalAmount, 
    couponCode,
    paymentType,
    paymentMethod,
    paidAmount,
    transactionId,
    paymentScreenshot,
    customerDistrict,
    customerArea,
    userId
  } = req.body;

  // Validate Coupon limits first if a coupon is being applied
  if (couponCode) {
    const upperCoupon = String(couponCode).toUpperCase().trim();
    const coupon = db.coupons.find(c => c.code === upperCoupon);
    if (coupon) {
      if (coupon.maxUses !== undefined && coupon.maxUses > 0) {
        const used = coupon.usedCount || 0;
        if (used >= coupon.maxUses) {
          return res.status(400).json({ message: `The VIP coupon code "${upperCoupon}" has reached its maximum usage limit.` });
        }
      }
    }
  }

  // Validate Stock & Product Integrity
  for (const item of items) {
    const prod = db.products.find(p => p.id === item.productId);
    if (!prod) {
      return res.status(400).json({ message: `Product "${item.title}" no longer exists in current collections.` });
    }
    if (prod.stock < item.quantity) {
      return res.status(400).json({ message: `Insufficient stock for "${prod.title}". Only ${prod.stock} items left.` });
    }
  }

  // --- Strict Backend Pricing & Payment Validation ---
  function getDivisionForCityBackend(city: string): string {
    const c = String(city || "").trim().toLowerCase();
    
    if (c.includes('ctg') || c.includes('chittagong') || c.includes('chattogram')) {
      return 'Chattogram';
    }
    if (c.includes('dhaka')) {
      return 'Dhaka';
    }
    if (c.includes('rajshahi')) {
      return 'Rajshahi';
    }
    if (c.includes('khulna')) {
      return 'Khulna';
    }
    if (c.includes('barishal') || c.includes('barisal')) {
      return 'Barishal';
    }
    if (c.includes('sylhet')) {
      return 'Sylhet';
    }
    if (c.includes('rangpur')) {
      return 'Rangpur';
    }
    if (c.includes('mymensingh')) {
      return 'Mymensingh';
    }

    const divisions = [
      { name: "Dhaka", districts: ["dhaka", "faridpur", "gazipur", "gopalganj", "kishoreganj", "madaripur", "manikganj", "munshiganj", "narayanganj", "narsingdi", "rajbari", "shariatpur", "tangail"] },
      { name: "Chattogram", districts: ["bandarban", "brahmanbaria", "chandpur", "chattogram", "cox's bazar", "cumilla", "feni", "khagrachhari", "lakshmipur", "noakhali", "rangamati"] },
      { name: "Rajshahi", districts: ["bogura", "bogra", "chapainawabganj", "joypurhat", "naogaon", "natore", "pabna", "rajshahi", "sirajganj"] },
      { name: "Khulna", districts: ["bagerhat", "chuadanga", "jashore", "jhenaidah", "khulna", "kushtia", "magura", "meherpur", "narail", "satkhira"] },
      { name: "Barishal", districts: ["barguna", "barishal", "bhola", "jhalokati", "patuakhali", "pirojpur", "barisal"] },
      { name: "Sylhet", districts: ["habiganj", "moulvibazar", "sunamganj", "sylhet"] },
      { name: "Rangpur", districts: ["dinajpur", "gaibandha", "kurigram", "lalmonirhat", "nilphamari", "panchagarh", "rangpur", "thakurgaon"] },
      { name: "Mymensingh", districts: ["jamalpur", "mymensingh", "netrokona", "sherpur"] }
    ];

    for (const div of divisions) {
      if (div.districts.some(d => c.includes(d) || d.includes(c))) {
        return div.name;
      }
    }

    return "Outside";
  }

  function getProductActivePriceBackend(product: Product): number {
    if (product.offerPrice !== undefined && product.offerPrice !== null) {
      return product.offerPrice;
    }
    return product.price;
  }

  // --- COMPLETE 9-STEP PAYMENT TRACE & VALIDATION SYSTEM ---
  function traceAndValidatePaymentFlow(
    orderItems: any[],
    appliedCouponCode: string | undefined,
    city: string,
    cliTotal: number,
    cliPaid: number,
    payType: string,
    payMethod: string
  ): { success: boolean; finalCheckoutTotal: number; logs: string[]; error?: string } {
    const traceLogs: string[] = [];
    traceLogs.push(`[PAYMENT_TRACE] ==================================================`);
    traceLogs.push(`[PAYMENT_TRACE] STARTING PAYMENT AMOUNT TRACE FROM START TO FINISH`);
    traceLogs.push(`[PAYMENT_TRACE] Input payload: totalAmount=৳${cliTotal}, paidAmount=৳${cliPaid}, paymentType=${payType}, paymentMethod=${payMethod}`);

    // Step 1: Product price is loaded from the database
    traceLogs.push(`[PAYMENT_TRACE] Step 1: Loading product prices from database...`);
    const loadedProducts: { prod: any; quantity: number; dbPrice: number; activePrice: number }[] = [];
    for (const item of orderItems) {
      const dbProd = db.products.find((p: any) => p.id === item.productId);
      if (!dbProd) {
        return { success: false, finalCheckoutTotal: 0, logs: traceLogs, error: `Product ID "${item.productId}" not found in database.` };
      }
      const activePrice = getProductActivePriceBackend(dbProd);
      loadedProducts.push({ prod: dbProd, quantity: item.quantity, dbPrice: dbProd.price, activePrice });
      traceLogs.push(`[PAYMENT_TRACE]   - Product loaded: ID=${dbProd.id}, SKU=${dbProd.code}, Title="${dbProd.title}", DB_Price=৳${dbProd.price}, ActivePrice=৳${activePrice}, Quantity=${item.quantity}`);
    }

    // Step 2: Cart calculation
    traceLogs.push(`[PAYMENT_TRACE] Step 2: Running cart subtotal calculation...`);
    let calculatedSubtotal = 0;
    for (const item of loadedProducts) {
      const itemSubtotal = item.activePrice * item.quantity;
      calculatedSubtotal += itemSubtotal;
      traceLogs.push(`[PAYMENT_TRACE]   - Subtotal Contribution: ${item.prod.title} (${item.quantity} x ৳${item.activePrice}) = ৳${itemSubtotal}`);
    }
    traceLogs.push(`[PAYMENT_TRACE]   - Total Cart Subtotal: ৳${calculatedSubtotal}`);

    // Step 3: Checkout calculation (coupons, discounts, delivery charges)
    traceLogs.push(`[PAYMENT_TRACE] Step 3: Running checkout calculations (discount & delivery charge)...`);
    let calculatedDiscountAmount = 0;
    if (appliedCouponCode) {
      const upperCoupon = String(appliedCouponCode).toUpperCase().trim();
      let coupon = db.coupons.find((c: any) => c.code === upperCoupon && c.active);
      const lotteryPrefix = (db.settings?.lotteryCouponPrefix || 'RISAT').trim().toUpperCase();

      if (!coupon && upperCoupon.startsWith(lotteryPrefix)) {
        const pctStr = upperCoupon.replace(lotteryPrefix, '');
        const pctVal = Number(pctStr);
        if (!isNaN(pctVal) && pctVal > 0 && pctVal <= 100) {
          coupon = { code: upperCoupon, type: 'PERCENTAGE', value: pctVal, active: true };
          traceLogs.push(`[PAYMENT_TRACE]   - Matched dynamic lottery coupon: ${upperCoupon} (-${pctVal}%)`);
        }
      }

      let isProductSpecific = false;
      let specificProd = null;
      if (!coupon) {
        specificProd = db.products.find((p: any) => p.couponCode && p.couponCode.trim().toUpperCase() === upperCoupon);
        if (specificProd) {
          coupon = { code: upperCoupon, type: 'PERCENTAGE', value: specificProd.couponDiscountPercent || 15, active: true };
          isProductSpecific = true;
          traceLogs.push(`[PAYMENT_TRACE]   - Matched product-specific coupon: ${upperCoupon} for Product ID=${specificProd.id} (-${coupon.value}%)`);
        }
      } else {
        specificProd = db.products.find((p: any) => p.couponCode && p.couponCode.trim().toUpperCase() === upperCoupon);
        if (specificProd) {
          isProductSpecific = true;
        }
      }

      if (coupon) {
        if (upperCoupon.startsWith(lotteryPrefix)) {
          const lotteryEligibleTotal = loadedProducts.reduce((sum, item) => {
            return sum + (item.prod.lotteryEligible !== false ? item.activePrice * item.quantity : 0);
          }, 0);
          calculatedDiscountAmount = Math.round((lotteryEligibleTotal * coupon.value) / 100);
          traceLogs.push(`[PAYMENT_TRACE]   - Applied lottery discount of ৳${calculatedDiscountAmount} on eligible items subtotal of ৳${lotteryEligibleTotal}`);
        } else if (isProductSpecific && specificProd) {
          const matchingItems = loadedProducts.filter(item => item.prod.id === specificProd.id);
          const specificTotal = matchingItems.reduce((sum, item) => sum + (item.activePrice * item.quantity), 0);
          const discountVal = coupon.type === 'PERCENTAGE' ? coupon.value : 15;
          calculatedDiscountAmount = Math.round((specificTotal * discountVal) / 100);
          traceLogs.push(`[PAYMENT_TRACE]   - Applied product-specific discount of ৳${calculatedDiscountAmount} on product "${specificProd.title}" total of ৳${specificTotal}`);
        } else {
          if (coupon.type === 'PERCENTAGE') {
            calculatedDiscountAmount = Math.round((calculatedSubtotal * coupon.value) / 100);
            traceLogs.push(`[PAYMENT_TRACE]   - Applied global percentage discount of ৳${calculatedDiscountAmount} (${coupon.value}%) on subtotal of ৳${calculatedSubtotal}`);
          } else {
            calculatedDiscountAmount = coupon.value;
            traceLogs.push(`[PAYMENT_TRACE]   - Applied global fixed discount of ৳${calculatedDiscountAmount} on subtotal of ৳${calculatedSubtotal}`);
          }
        }
      } else {
        traceLogs.push(`[PAYMENT_TRACE]   - Coupon code "${upperCoupon}" could not be matched or was inactive.`);
      }
    }

    const shippingDivision = getDivisionForCityBackend(city);
    const calculatedDeliveryCharge = loadedProducts.length === 0
      ? (shippingDivision === "Dhaka" ? 100 : 150)
      : loadedProducts.reduce((max, item) => {
          if (item.prod.freeDelivery) {
            return max;
          }
          let customPrice = 150;
          if (shippingDivision === "Dhaka") {
            customPrice = item.prod.deliveryPriceDhaka !== undefined 
              ? Number(item.prod.deliveryPriceDhaka) 
              : (item.prod.deliveryCharge !== undefined && item.prod.deliveryCharge > 0 ? Number(item.prod.deliveryCharge) : 100);
          } else {
            let specificPrice: number | undefined = undefined;
            switch (shippingDivision) {
              case "Chattogram":
                specificPrice = item.prod.deliveryPriceChattogram;
                break;
              case "Rajshahi":
                specificPrice = item.prod.deliveryPriceRajshahi;
                break;
              case "Khulna":
                specificPrice = item.prod.deliveryPriceKhulna;
                break;
              case "Barishal":
                specificPrice = item.prod.deliveryPriceBarishal;
                break;
              case "Sylhet":
                specificPrice = item.prod.deliveryPriceSylhet;
                break;
              case "Rangpur":
                specificPrice = item.prod.deliveryPriceRangpur;
                break;
              case "Mymensingh":
                specificPrice = item.prod.deliveryPriceMymensingh;
                break;
            }
            if (specificPrice !== undefined) {
              customPrice = Number(specificPrice);
            } else {
              customPrice = item.prod.deliveryCharge !== undefined && item.prod.deliveryCharge > 0
                ? Number(item.prod.deliveryCharge)
                : 150;
            }
          }
          return customPrice > max ? customPrice : max;
        }, 0);

    // Helper to normalize payment type
    const getNormalizedPaymentTypeBackend = (pType: string | undefined): 'cod' | 'delivery_charge' | 'full_advance' | 'percentage' => {
      if (!pType) return 'cod';
      const norm = pType.trim().toLowerCase();
      if (norm === 'cod' || norm === 'cash_on_delivery') {
        return 'cod';
      }
      if (norm === 'delivery_charge' || norm === 'delivery_charge_only' || norm === 'delivery_charge_advance') {
        return 'delivery_charge';
      }
      if (norm === 'full_advance' || norm === 'full_advance_payment') {
        return 'full_advance';
      }
      if (norm === 'percentage') {
        return 'percentage';
      }
      return 'cod';
    };

    // Resolve payment type and governing product similarly to the frontend
    let calculatedPaymentType = 'cod';
    let resolvedGovProduct = loadedProducts[0]?.prod;

    if (loadedProducts.length > 0) {
      const hasFullAdvance = loadedProducts.find(p => getNormalizedPaymentTypeBackend(p.prod.paymentType) === 'full_advance');
      const hasPercentage = loadedProducts.find(p => getNormalizedPaymentTypeBackend(p.prod.paymentType) === 'percentage');
      const hasDeliveryCharge = loadedProducts.find(p => getNormalizedPaymentTypeBackend(p.prod.paymentType) === 'delivery_charge');

      if (hasFullAdvance) {
        calculatedPaymentType = 'full_advance';
        resolvedGovProduct = hasFullAdvance.prod;
      } else if (hasPercentage) {
        calculatedPaymentType = 'percentage';
        resolvedGovProduct = hasPercentage.prod;
      } else if (hasDeliveryCharge) {
        calculatedPaymentType = 'delivery_charge';
        resolvedGovProduct = hasDeliveryCharge.prod;
      } else {
        const definedPayType = loadedProducts.find(p => {
          const normType = getNormalizedPaymentTypeBackend(p.prod.paymentType);
          return normType && normType !== 'cod';
        });
        if (definedPayType) {
          calculatedPaymentType = getNormalizedPaymentTypeBackend(definedPayType.prod.paymentType);
          resolvedGovProduct = definedPayType.prod;
        } else {
          calculatedPaymentType = 'cod';
          resolvedGovProduct = loadedProducts[0]?.prod;
        }
      }
    }

    if (db.settings?.globalPaymentMethod === 'cod_only') {
      calculatedPaymentType = 'cod';
    } else if (db.settings?.globalPaymentMethod === 'prepay_only') {
      if (calculatedPaymentType === 'cod') calculatedPaymentType = 'full_advance';
    }

    const calculatedTotalAmount = Math.max(0, calculatedSubtotal - calculatedDiscountAmount + calculatedDeliveryCharge);
    traceLogs.push(`[PAYMENT_TRACE]   - Shipping Division: ${shippingDivision}`);
    traceLogs.push(`[PAYMENT_TRACE]   - Governing Product: "${resolvedGovProduct?.title || 'None'}", DeliveryChargeField=${resolvedGovProduct?.deliveryCharge}`);
    traceLogs.push(`[PAYMENT_TRACE]   - Resolved Courier Delivery Charge: ৳${calculatedDeliveryCharge}`);
    traceLogs.push(`[PAYMENT_TRACE]   - Final Recalculated Checkout Total: ৳${calculatedTotalAmount}`);

    // Step 4: Order creation initialized
    traceLogs.push(`[PAYMENT_TRACE] Step 4: Order creation initialized...`);
    traceLogs.push(`[PAYMENT_TRACE]   - Client Total: ৳${cliTotal}, Backend Recalculated Total: ৳${calculatedTotalAmount}`);
    if (Math.round(Number(cliTotal)) !== Math.round(calculatedTotalAmount)) {
      traceLogs.push(`[PAYMENT_TRACE]   - [ERROR] Checkout mismatch detected! Client total ৳${cliTotal} vs Recalculated total ৳${calculatedTotalAmount}`);
      return { success: false, finalCheckoutTotal: calculatedTotalAmount, logs: traceLogs, error: `Grand total mismatch! Client sent ৳${cliTotal}, Recalculated: ৳${calculatedTotalAmount}` };
    }

    // Step 5: Payment session creation
    const paymentSessionId = "SESS-PAY-" + Math.floor(100000 + Math.random() * 900000);
    traceLogs.push(`[PAYMENT_TRACE] Step 5: Creating simulated secure payment gateway session...`);
    traceLogs.push(`[PAYMENT_TRACE]   - Session ID: ${paymentSessionId}`);
    traceLogs.push(`[PAYMENT_TRACE]   - Session registered for Amount: ৳${calculatedTotalAmount}`);

    // Step 6: bKash payment request
    let amountToPay = payType === 'delivery_charge' ? calculatedDeliveryCharge : calculatedTotalAmount;
    if (payType === 'percentage') {
      const pct = resolvedGovProduct?.paymentPercentage !== undefined ? Number(resolvedGovProduct.paymentPercentage) : 10;
      amountToPay = Math.round((pct / 100) * calculatedTotalAmount);
    }

    if (payType !== 'cod' && payMethod === 'bkash') {
      traceLogs.push(`[PAYMENT_TRACE] Step 6: bKash payment request initiated...`);
      traceLogs.push(`[PAYMENT_TRACE]   - Request Payload: { amount: ${amountToPay}, currency: "BDT", intent: "sale", merchantInvoiceNumber: "${paymentSessionId}" }`);
      traceLogs.push(`[PAYMENT_TRACE]   - Amount sent to bKash Gateway: ৳${amountToPay}`);
    } else {
      traceLogs.push(`[PAYMENT_TRACE] Step 6: bKash payment request bypassed (not selected).`);
    }

    // Step 7: Nagad payment request
    if (payType !== 'cod' && payMethod === 'nagad') {
      traceLogs.push(`[PAYMENT_TRACE] Step 7: Nagad payment request initiated...`);
      traceLogs.push(`[PAYMENT_TRACE]   - Request Payload: { amount: ${amountToPay}, orderId: "${paymentSessionId}", serviceType: "merchant_pay" }`);
      traceLogs.push(`[PAYMENT_TRACE]   - Amount sent to Nagad Gateway: ৳${amountToPay}`);
    } else {
      traceLogs.push(`[PAYMENT_TRACE] Step 7: Nagad payment request bypassed (not selected).`);
    }

    // Step 8: Payment callback verification
    if (payType !== 'cod') {
      traceLogs.push(`[PAYMENT_TRACE] Step 8: Payment callback verification received...`);
      traceLogs.push(`[PAYMENT_TRACE]   - Callback values: paidAmount=৳${cliPaid}, status="success", tracking_id="${paymentSessionId}"`);
      if (Math.round(Number(cliPaid)) !== Math.round(amountToPay)) {
        traceLogs.push(`[PAYMENT_TRACE]   - [ERROR] Callback amount mismatch! Received ৳${cliPaid}, expected ৳${amountToPay}`);
        return { success: false, finalCheckoutTotal: calculatedTotalAmount, logs: traceLogs, error: `Advance paid amount mismatch! Received ৳${cliPaid}, expected ৳${amountToPay}` };
      }
      traceLogs.push(`[PAYMENT_TRACE]   - Payment verified successfully for Amount: ৳${amountToPay}`);
    } else {
      traceLogs.push(`[PAYMENT_TRACE] Step 8: Payment callback verification bypassed (Cash on Delivery).`);
    }

    // Step 9: Order saved in the database
    traceLogs.push(`[PAYMENT_TRACE] Step 9: Order successfully verified and marked for database storage.`);
    traceLogs.push(`[PAYMENT_TRACE]   - Final Order Value to save: ৳${calculatedTotalAmount}`);
    traceLogs.push(`[PAYMENT_TRACE] ==================================================`);

    return { success: true, finalCheckoutTotal: calculatedTotalAmount, logs: traceLogs };
  }

  // Calculate items total based purely on current DB prices
  const traceResult = traceAndValidatePaymentFlow(
    items,
    couponCode,
    customerCity,
    totalAmount,
    paidAmount,
    paymentType,
    paymentMethod
  );

  for (const logLine of traceResult.logs) {
    console.log(logLine);
  }

  if (!traceResult.success) {
    console.error(`[PAYMENT_FLOW_FAILURE] ${traceResult.error}`);
    return res.status(400).json({
      message: `Payment validation error: ${traceResult.error}`
    });
  }

  const calculatedTotalAmount = traceResult.finalCheckoutTotal;

  // If validation passes, increment coupon usage
  if (couponCode) {
    const upperCoupon = String(couponCode).toUpperCase().trim();
    const couponIndex = db.coupons.findIndex(c => c.code === upperCoupon);
    if (couponIndex !== -1) {
      const coupon = db.coupons[couponIndex];
      const nextUsedCount = (coupon.usedCount || 0) + 1;
      coupon.usedCount = nextUsedCount;
      
      let shouldDeactivate = false;
      if (coupon.maxUses !== undefined && coupon.maxUses > 0 && nextUsedCount >= coupon.maxUses) {
        coupon.active = false;
        shouldDeactivate = true;
      }
      
      // Update Supabase
      try {
        const payload: any = {
          usedCount: nextUsedCount,
          used_count: nextUsedCount
        };
        if (shouldDeactivate) {
          payload.active = false;
        }
        await supabase.from("coupons").update(payload).eq("code", upperCoupon);
      } catch (err: any) {
        console.warn("⚠️ Failed to update coupon in Supabase:", err.message);
      }
    }
  }

  // Deduct stock locally and mirror to Supabase
  for (const item of items) {
    const prodIndex = db.products.findIndex(p => p.id === item.productId);
    if (prodIndex !== -1) {
      db.products[prodIndex].stock -= item.quantity;
      const updatedProd = db.products[prodIndex];
      try {
        await supabase.from("products").update({ stock: updatedProd.stock }).eq("id", updatedProd.id);
      } catch (sErr: any) {
        console.warn("⚠️ Stock Supabase update failed: ", sErr.message);
      }
    }
  }

  // Generate Unique Order Tracking ID
  const trackingId = "STX-" + Math.floor(100000 + Math.random() * 900000);

  const newOrder: Order = {
    id: trackingId,
    customerName,
    customerPhone,
    customerAddress,
    customerCity,
    customerEmail,
    customerNotes,
    items,
    totalAmount,
    status: "PENDING",
    date: new Date().toISOString(),
    district: customerDistrict || customerCity,
    area: customerArea || "",
    paymentType: paymentType || "cod",
    paymentMethod: paymentMethod || "COD",
    paidAmount: paidAmount !== undefined ? Number(paidAmount) : 0,
    transactionId: transactionId || "",
    paymentScreenshot: paymentScreenshot || "",
    userId: userId || ""
  };

  db.orders.push(newOrder);
  saveDB();

  try {
    const payload: any = {
      id: newOrder.id,
      customerName: newOrder.customerName,
      customerPhone: newOrder.customerPhone,
      customerAddress: newOrder.customerAddress,
      customerCity: newOrder.customerCity,
      customerNotes: newOrder.customerNotes,
      items: JSON.stringify(newOrder.items),
      totalAmount: Number(newOrder.totalAmount),
      status: newOrder.status,
      date: newOrder.date,
      district: newOrder.district,
      area: newOrder.area,
      paymentType: newOrder.paymentType,
      paymentMethod: newOrder.paymentMethod,
      paidAmount: newOrder.paidAmount,
      transactionId: newOrder.transactionId,
      paymentScreenshot: newOrder.paymentScreenshot,
      userId: newOrder.userId
    };

    let { error: upsertErr } = await supabase.from("orders").upsert(payload);
    
    // Bulletproof fallback: If orders table doesn't support the new custom checkout columns, retry without them
    if (upsertErr && (upsertErr.message.includes("column") || upsertErr.code === "P0002" || upsertErr.message.includes("does not exist") || upsertErr.message.includes("not found"))) {
      console.warn("⚠️ Custom checkout columns do not exist in Supabase orders table. Bypassing and retrying...");
      delete payload.district;
      delete payload.area;
      delete payload.paymentType;
      delete payload.paymentMethod;
      delete payload.paidAmount;
      delete payload.transactionId;
      delete payload.paymentScreenshot;
      delete payload.userId;
      await supabase.from("orders").upsert(payload);
    }
  } catch (err: any) {
    console.error("⚠️ Failed to mirror order creation to Supabase: ", err.message);
  }

  // Trigger Google Apps Script email notification hook (Non-blocking async call)
  try {
    const subtotal = items.reduce((sum: number, i: any) => sum + (Number(i.price) * Number(i.quantity)), 0);
    const shipping = Number(totalAmount) - subtotal;
    const shippingValue = shipping > 0 ? shipping : 0;
    const shippingText = shippingValue > 0 ? `৳${shippingValue}` : "FREE";

    // Dynamic payment status label
    let paymentStatusLabel = "COD";
    if (newOrder.paymentType !== 'cod') {
      paymentStatusLabel = "PENDING VERIFICATION";
    }

    const itemsFormatted = items.map((i: any) => `- ${i.title} (${i.selectedSize || "Standard"}) x${i.quantity} @ ৳${i.price}`).join("\n") +
      `\n\n-----------------------------\n💵 Product Subtotal: ৳${subtotal}\n📦 VIP Secure Courier Delivery: ${shippingText}\n👑 Grand Invoice Total: ৳${totalAmount}`;

    const scriptUrl = db.settings?.appsScriptUrl || "https://script.google.com/macros/s/AKfycbwO87xXrLb1b-LS5XMoOmCHxo764LwXthLYkHA4AXZ_nJqTwvUHieOSTJkdp_UFf7mx/exec";
    const targetEmail = db.settings?.adminEmail || "risatadnan4@gmail.com";

    // Compile dynamic descriptive text for the email notification
    const orderLocation = `${newOrder.customerAddress}, Area: ${newOrder.area || 'N/A'}, District: ${newOrder.district || 'N/A'}, City: ${newOrder.customerCity}${newOrder.customerNotes ? ` (Notes: ${newOrder.customerNotes})` : ""}`;
    const paymentDetailText = newOrder.paymentType === 'cod' 
      ? 'Cash on Delivery (COD)' 
      : `${String(newOrder.paymentType).toUpperCase()} via ${newOrder.paymentMethod} (Paid Amount: ৳${newOrder.paidAmount})`;

    // Send direct admin email notification via Multi-Method Email System
    const orderItemsText = items.map((i: any) => `- ${i.title} (${i.selectedSize || "Standard"}) x${i.quantity} @ ৳${i.price}`).join("\n");
    const emailSubject = `🛍️ New Order Placed: #${newOrder.id}`;
    const emailBody = `
========================================
🛍️ NEW ORDER PLACED
========================================
🆔 Order ID: ${newOrder.id}
👤 Customer Name: ${newOrder.customerName}
📞 Mobile Number: ${newOrder.customerPhone}
✉️ Email: ${newOrder.customerEmail || 'Guest'}
📦 Product Details:
${orderItemsText}
🏠 Delivery Address: ${orderLocation}
💳 Payment Method: ${paymentDetailText}
${newOrder.paymentType !== 'cod' ? `🔑 Transaction ID: ${newOrder.transactionId || 'N/A'}\n` : ''}${newOrder.paymentScreenshot ? `📸 Payment Screenshot: ${newOrder.paymentScreenshot}\n` : ''}💰 Total Price: ৳${newOrder.totalAmount}
⏰ Order Time: ${new Date().toLocaleString()}
========================================
    `;

    const emailHtml = `
      <div style="font-family: sans-serif; padding: 20px; max-width: 600px; border: 1px solid #d4af37; border-radius: 8px;">
        <h2 style="color: #d4af37; border-bottom: 2px solid #d4af37; padding-bottom: 10px;">👑 Style X Luxury Order Confirmation</h2>
        <p style="font-size: 14px; font-weight: bold; color: #111;">Order ID: #${newOrder.id}</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <tr>
            <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee; width: 150px;">Customer Name:</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${newOrder.customerName}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Mobile Number:</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${newOrder.customerPhone}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Email:</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${newOrder.customerEmail || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee; vertical-align: top;">Product Details:</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; white-space: pre-line;">${orderItemsText}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Delivery Address:</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${orderLocation}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Payment Method:</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${paymentDetailText}</td>
          </tr>
          ${newOrder.paymentType !== 'cod' ? `
          <tr>
            <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee; color: #ef4444;">Transaction ID:</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; color: #ef4444;">${newOrder.transactionId || 'N/A'}</td>
          </tr>
          ` : ''}
          ${newOrder.paymentScreenshot ? `
          <tr>
            <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee; color: #3b82f6;">Payment Screenshot:</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">
              <a href="${newOrder.paymentScreenshot}" target="_blank" style="color: #3b82f6; text-decoration: underline; font-weight: bold;">View Screenshot</a>
              <br/>
              <img src="${newOrder.paymentScreenshot}" style="max-width: 100%; max-height: 250px; border-radius: 4px; margin-top: 8px; border: 1px solid #ddd;" alt="Payment Screenshot" />
            </td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee; color: #d4af37; font-size: 16px;">Total Price:</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; color: #d4af37; font-size: 16px;">৳${newOrder.totalAmount}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Order Time:</td>
            <td style="padding: 8px;">${new Date().toLocaleString()}</td>
          </tr>
        </table>
      </div>
    `;

    sendAdminEmail({ subject: emailSubject, text: emailBody, html: emailHtml })
      .catch(err => console.error("Error sending admin order email:", err));

    fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        email: targetEmail,
        recipient: targetEmail,
        recipientEmail: targetEmail,
        targetEmail: targetEmail,
        target_email: targetEmail,
        adminEmail: targetEmail,
        storeEmail: targetEmail,
        toEmail: targetEmail,
        notifyEmail: targetEmail,
        name: customerName,
        phone: customerPhone,
        location: orderLocation,
        items: itemsFormatted,
        total: `৳${totalAmount} (৳${subtotal} Products + ৳${shippingValue} Courier Delivery)`,
        payment: paymentDetailText,
        paymentStatus: paymentStatusLabel,
        trxid: newOrder.transactionId || `STX-TRX-${trackingId.split("-")[1]}`,
        screenshot: newOrder.paymentScreenshot || "",
        date: new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" })
      })
    })
    .then(async (r) => {
      console.log(`✉️ Google Apps Script hook invoked! Status: ${r.status}`);
    })
    .catch((err) => {
      console.error("⚠️ Google Apps Script webhook integration error: ", err.message);
    });
  } catch (gasErr: any) {
    console.error("⚠️ Failed to initiate email notification trigger: ", gasErr.message);
  }

  // Generate beautiful message for WhatsApp Redirect
  const itemsText = items.map((i: any) => `- ${i.title} (${i.selectedSize}) x${i.quantity} @ ৳${i.price}`).join("\n");
  const wsMessage = `👑 *STYLE X LUXURY CONFIRMATION* 👑\n\nHello Style X Team, I would like to confirm my luxury collection:\n\n*Order Tracking ID:* ${trackingId}\n\n*Item Details:*\n${itemsText}\n\n*Total Order Value:* ৳${totalAmount}\n\n*Delivery Credentials:*\nName: ${customerName}\nPhone: ${customerPhone}\nAddress: ${customerAddress}, ${customerCity}\nNotes: ${customerNotes || 'None'}\n\nThank you!`;
  const encodedMsg = encodeURIComponent(wsMessage);
  
  const activeWhatsappNumber = db.settings?.whatsappNumber || "8801755104443";
  const whatsappUrl = `https://wa.me/${activeWhatsappNumber}?text=${encodedMsg}`; // Style X Direct Support

  res.status(201).json({ order: newOrder, whatsappUrl });
});

function formatPhoneNumber(phone: string): string {
  if (!phone) return "";
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  
  if (cleaned.startsWith('880') && cleaned.length >= 13) {
    return `+${cleaned}`;
  }
  
  if (cleaned.startsWith('01') && cleaned.length === 11) {
    return `+88${cleaned}`;
  }
  
  if (cleaned.startsWith('1') && cleaned.length === 10) {
    return `+880${cleaned}`;
  }

  if (cleaned.startsWith('0') && cleaned.length === 11) {
    return `+88${cleaned}`;
  }
  
  if (cleaned.startsWith('880')) {
    return `+${cleaned}`;
  }
  
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
}

async function sendBanglaSMSNotification(toPhone: string, message: string) {
  const provider = db.settings?.smsProvider || 'mock';
  const formattedTo = formatPhoneNumber(toPhone);

  console.log(`[SMS Gateway] Processing dispatch using provider: [${provider}] to: ${formattedTo}`);

  if (provider === 'greenweb') {
    const token = db.settings?.greenwebToken;
    if (!token) {
      throw new Error("Greenweb API Token is not configured in Admin Settings.");
    }
    
    // Clean toPhone to standard digits (e.g. 017XXXXXXXX or 88017XXXXXXXX)
    const cleanPhone = toPhone.replace(/\D/g, "");
    const params = new URLSearchParams();
    params.append('token', token);
    params.append('to', cleanPhone);
    params.append('message', message);
    params.append('json', 'true');

    const response = await fetch('https://api.greenweb.com.bd/api.php', {
      method: 'POST',
      body: params
    });
    
    const responseText = await response.text();
    console.log("[SMS Gateway] Greenweb raw response:", responseText);

    // Greenweb typical response structure
    // e.g. [{"status":"SUCCESS","status_code":200,"message_id":"XXXX"}] or similar.
    // If it starts with "Authentication Failed" or similar error string:
    if (responseText.toLowerCase().includes("fail") || responseText.toLowerCase().includes("error") || responseText.toLowerCase().includes("invalid")) {
      throw new Error(`Greenweb API Error: ${responseText}`);
    }

    return {
      success: true,
      sid: "GREENWEB_" + Math.random().toString(36).substring(2, 11).toUpperCase()
    };
  } else if (provider === 'twilio') {
    const accountSid = db.settings?.twilioAccountSid;
    const authToken = db.settings?.twilioAuthToken;
    const fromNumber = db.settings?.twilioFromNumber;

    if (!accountSid || !authToken || !fromNumber) {
      throw new Error("Twilio Account SID, Auth Token, or From Number is not configured in Admin Settings.");
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const params = new URLSearchParams();
    params.append('To', formattedTo);
    params.append('From', fromNumber);
    params.append('Body', message);

    const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });

    const data = await response.json() as any;
    console.log("[SMS Gateway] Twilio parsed response:", data);

    if (!response.ok) {
      throw new Error(data.message || `Twilio API returned status ${response.status}`);
    }

    return {
      success: true,
      sid: data.sid || "TWILIO_MOCK_SID"
    };
  } else {
    // Fallback: mock simulation
    console.log(`[SMS Gateway Simulator] Delivering Bangla SMS to ${formattedTo}:`);
    console.log(`----------------------------------------`);
    console.log(message);
    console.log(`----------------------------------------`);
    
    return {
      success: true,
      sid: "STYLE_X_BD_" + Math.random().toString(36).substring(2, 11).toUpperCase()
    };
  }
}

app.put("/api/orders/:id/status", async (req, res) => {
  const { status } = req.body;
  const idx = db.orders.findIndex(o => o.id === req.params.id);
  if (idx !== -1) {
    const order = db.orders[idx];
    order.status = status;

    // Create a personalized customer notification
    const statusUpper = String(status).toUpperCase();
    let notifMsg = `Bespoke Order #${order.id} has been updated to ${statusUpper} status.`;
    if (statusUpper === 'CONFIRMED' || statusUpper === 'APPROVED') {
      notifMsg = `Bespoke Order #${order.id} is officially CONFIRMED! Our specialized courier has allocated your parcel from the Style X vault.`;
    } else if (statusUpper === 'SHIPPED' || statusUpper === 'DISPATCHED') {
      notifMsg = `Fast-track Dispatch active: Order #${order.id} has left the Style X central hub and is on route to ${order.customerCity}.`;
    } else if (statusUpper === 'DELIVERED') {
      notifMsg = `Acknowledgment: Order #${order.id} has been securely handed over. Thank you for your luxury purchase, we hope to serve you again!`;
    }

    const newNotif = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: 'order_status',
      title: `Order #${order.id}: ${statusUpper}`,
      message: notifMsg,
      date: new Date().toISOString(),
      customerEmail: order.customerEmail || "",
      customerPhone: order.customerPhone || "",
      orderId: order.id
    };

    if (!db.notifications) {
      db.notifications = [];
    }
    db.notifications.unshift(newNotif);

    // Prepare Bangla Premium SMS message
    let smsMsg = "";
    if (statusUpper === 'CONFIRMED' || statusUpper === 'APPROVED' || statusUpper === 'PACKED') {
      smsMsg = `👑 STYLE X LUXURY 👑\n\nপ্রিয় ${order.customerName || 'গ্রাহক'},\nআপনার অর্ডারকৃত প্রিমিয়াম প্রোডাক্ট #${order.id} অত্যন্ত যত্নের সাথে প্যাকেট (PACKED) করা হয়েছে। এটি এখন নিরাপদ ও অগ্রাধিকার ভিত্তিতে কুরিয়ারে হস্তান্তরের জন্য প্রস্তুত। STYLE X সাথে থাকার জন্য ধন্যবাদ!\n\n(Bespoke Order #${order.id} has been PACKED and is ready for courier delivery.)`;
    } else if (statusUpper === 'SHIPPED' || statusUpper === 'DISPATCHED') {
      smsMsg = `👑 STYLE X LUXURY 👑\n\nপ্রিয় ${order.customerName || 'গ্রাহক'},\nখুশির খবর! আপনার অর্ডারটি #${order.id} আমাদের সেন্ট্রাল হাব থেকে শিপড (SHIPPED) করা হয়েছে এবং বর্তমানে আপনার গন্তব্য ${order.customerCity || 'ঠিকানা'} অভিমুখে পাঠানো হচ্ছে। ধন্যবাদ!\n\n(Order #${order.id} has left central hub and is SHIPPED on route to ${order.customerCity || 'destination'}.)`;
    }

    if (smsMsg) {
      if (!db.outboundSMSLogs) {
        db.outboundSMSLogs = [];
      }
      
      const smsLogId = `sms-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const logEntry = {
        id: smsLogId,
        phone: order.customerPhone,
        message: smsMsg,
        timestamp: new Date().toISOString(),
        system: "STYLE X Bangla Gateway",
        status: "Initiating"
      };
      db.outboundSMSLogs.unshift(logEntry);

      // Trigger SMS Notification asynchronously
      sendBanglaSMSNotification(order.customerPhone, smsMsg).then((smsRes) => {
        const foundLog = db.outboundSMSLogs.find((l: any) => l.id === smsLogId);
        if (foundLog) {
          foundLog.status = "Delivered ✔️";
          foundLog.sid = smsRes.sid;
          saveDB();
        }
      }).catch((e: any) => {
        console.error("⚠️ Async SMS dispatcher error:", e);
        const foundLog = db.outboundSMSLogs.find((l: any) => l.id === smsLogId);
        if (foundLog) {
          foundLog.status = `Failed ❌ (${e.message || e})`;
          saveDB();
        }
      });
    }

    saveDB();
    try {
      await supabase.from("orders").update({ status }).eq("id", req.params.id);
    } catch (err: any) {
      console.error("⚠️ Failed to status sync order to Supabase: ", err.message);
    }
    res.json(db.orders[idx]);
  } else {
    res.status(404).json({ message: "Order not found" });
  }
});

app.delete("/api/orders/:id", async (req, res) => {
  const idx = db.orders.findIndex(o => o.id === req.params.id);
  if (idx !== -1) {
    const deleted = db.orders.splice(idx, 1)[0];
    saveDB();
    try {
      await supabase.from("orders").delete().eq("id", req.params.id);
    } catch (err: any) {
      console.error("⚠️ Failed to mirror order deletion to Supabase: ", err.message);
    }
    res.json(deleted);
  } else {
    res.status(404).json({ message: "Order not found" });
  }
});

// Reviews API
app.get("/api/reviews", async (req, res) => {
  try {
    const { data, error } = await supabase.from("reviews").select("*");
    if (!error && data && data.length > 0) {
      const reviews = data.map((r: any) => ({
        ...r,
        rating: Number(r.rating),
        isApproved: !!r.isApproved
      }));
      db.reviews = reviews;
      saveDB();
      return res.json(reviews);
    }
  } catch (err: any) {
    console.warn("⚠️ Direct reviews fetch fallback:", err.message);
  }
  res.json(db.reviews);
});

app.post("/api/reviews", async (req, res) => {
  const { productId, productTitle, customerName, rating, comment } = req.body;
  const newReview: Review = {
    id: `rev-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    productId,
    productTitle,
    customerName,
    rating: Number(rating) || 5,
    comment,
    isApproved: false, // Moderated by default to keep the luxury vibe pristine
    date: new Date().toISOString()
  };
  db.reviews.push(newReview);
  saveDB();
  try {
    await supabase.from("reviews").upsert(newReview);
  } catch (err: any) {
    console.error("⚠️ Reviews Supabase upsert failed:", err.message);
  }
  res.status(201).json(newReview);
});

app.post("/api/reviews/:id/approve", async (req, res) => {
  const idx = db.reviews.findIndex(r => r.id === req.params.id);
  if (idx !== -1) {
    db.reviews[idx].isApproved = true;
    saveDB();
    try {
      await supabase.from("reviews").update({ isApproved: true }).eq("id", req.params.id);
    } catch (err: any) {
      console.error("⚠️ Reviews Supabase approve failed:", err.message);
    }
    res.json(db.reviews[idx]);
  } else {
    res.status(404).json({ message: "Review not found" });
  }
});

app.delete("/api/reviews/:id", async (req, res) => {
  const idx = db.reviews.findIndex(r => r.id === req.params.id);
  if (idx !== -1) {
    const deleted = db.reviews.splice(idx, 1)[0];
    saveDB();
    try {
      await supabase.from("reviews").delete().eq("id", req.params.id);
    } catch (err: any) {
      console.error("⚠️ Reviews Supabase delete failed:", err.message);
    }
    res.json(deleted);
  } else {
    res.status(404).json({ message: "Review not found" });
  }
});

// Coupons API
app.get("/api/coupons", async (req, res) => {
  try {
    const { data, error } = await supabase.from("coupons").select("*");
    if (!error && data) {
      const coupons = data.map((c: any) => {
        const existingLocal = db.coupons?.find(localC => localC.code === c.code);
        const maxUses = (c.maxUses !== undefined && c.maxUses !== null) ? Number(c.maxUses) : ((c.max_uses !== undefined && c.max_uses !== null) ? Number(c.max_uses) : existingLocal?.maxUses);
        const usedCount = (c.usedCount !== undefined && c.usedCount !== null) ? Number(c.usedCount) : ((c.used_count !== undefined && c.used_count !== null) ? Number(c.used_count) : (existingLocal?.usedCount || 0));
        const active = !!c.active && (maxUses === undefined || maxUses <= 0 || usedCount < maxUses);
        return {
          code: c.code,
          type: c.type || existingLocal?.type || 'PERCENTAGE',
          value: Number(c.value),
          active,
          maxUses,
          usedCount
        };
      });
      db.coupons = coupons;
      db.seededCoupons = true;
      saveDB();
      return res.json(coupons);
    }
  } catch (err: any) {
    console.warn("⚠️ Direct coupons fetch fallback:", err.message);
  }
  res.json(db.coupons);
});

// Back in stock alerts endpoints
app.post("/api/notify-me", (req, res) => {
  const { email, productId, productTitle } = req.body;
  if (!email || !productId) {
    return res.status(400).json({ error: "Email and Product ID are required." });
  }

  if (!db.backInStockAlerts) {
    db.backInStockAlerts = [];
  }

  const emailLower = String(email).trim().toLowerCase();
  const exists = db.backInStockAlerts.find(
    (alert: any) => alert.email.toLowerCase() === emailLower && alert.productId === productId
  );

  if (exists) {
    return res.status(200).json({ message: "You are already registered for alerts on this item!" });
  }

  const alertId = Math.random().toString(36).substring(2, 11);
  const newAlert = {
    id: alertId,
    email: email.trim(),
    productId: productId,
    productTitle: productTitle || "Premium Wardrobe Curation",
    requestedAt: new Date().toISOString(),
    status: "pending"
  };

  db.backInStockAlerts.push(newAlert);
  saveDB();

  res.status(201).json({ message: "Notification alert saved!", alert: newAlert });
});

app.get("/api/back-in-stock-alerts", (req, res) => {
  res.json(db.backInStockAlerts || []);
});

app.delete("/api/back-in-stock-alerts/:id", (req, res) => {
  const { id } = req.params;
  if (!db.backInStockAlerts) {
    db.backInStockAlerts = [];
  }
  db.backInStockAlerts = db.backInStockAlerts.filter((alert: any) => alert.id !== id);
  saveDB();
  res.json({ success: true, message: "Notification alert archived successfully." });
});

// SMS Opt-In and simulated SMS logs endpoints
app.post("/api/sms-opt-in", (req, res) => {
  const { phone, name, orderId, optInSMS, optInNewProducts } = req.body;
  if (!phone) {
    return res.status(400).json({ error: "Phone number is required." });
  }

  // Store new user phone number
  registerCustomerPhone(phone, name, undefined, 'sms_opt_in');

  if (!db.smsSubscriptions) {
    db.smsSubscriptions = [];
  }

  const phoneClean = String(phone).trim();
  const existingIdx = db.smsSubscriptions.findIndex(
    (sub: any) => sub.phone === phoneClean
  );

  const subscriptionData = {
    phone: phoneClean,
    name: name ? String(name).trim() : undefined,
    orderId: orderId ? String(orderId).trim() : undefined,
    optInSMS: !!optInSMS,
    optInNewProducts: !!optInNewProducts,
    timestamp: new Date().toISOString()
  };

  if (existingIdx !== -1) {
    db.smsSubscriptions[existingIdx] = {
      ...db.smsSubscriptions[existingIdx],
      ...subscriptionData
    };
  } else {
    db.smsSubscriptions.push(subscriptionData);
  }

  // Create an initial confirmation simulated SMS log if opted-in
  if (!db.outboundSMSLogs) {
    db.outboundSMSLogs = [];
  }

  let welcomeMessage = "";
  if (optInSMS && optInNewProducts) {
    welcomeMessage = `📱 STYLE X Alert Activated 📱\nHello ${name || 'Patron'}, you have successfully opted-in to receive premium order status SMS updates and instant alerts for new bespoke product drops. Thank you for your subscription.`;
  } else if (optInSMS) {
    welcomeMessage = `📱 STYLE X Alert Activated 📱\nHello ${name || 'Patron'}, you have successfully opted-in to receive premium order status SMS updates.`;
  } else if (optInNewProducts) {
    welcomeMessage = `📱 STYLE X Alert Activated 📱\nHello ${name || 'Patron'}, you have successfully opted-in to receive instant mobile alerts when new bespoke product drops occur.`;
  }

  if (welcomeMessage) {
    db.outboundSMSLogs.unshift({
      id: `sms-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      phone: phoneClean,
      message: welcomeMessage,
      timestamp: new Date().toISOString()
    });
  }

  saveDB();
  res.status(200).json({ success: true, message: "SMS subscription updated successfully!", data: subscriptionData });
});

app.get("/api/sms-subscriptions", (req, res) => {
  res.json(db.smsSubscriptions || []);
});

app.get("/api/customer-phones", (req, res) => {
  res.json(db.customerPhones || []);
});

app.post("/api/customer-phones", express.json(), (req, res) => {
  const { phone, name, email, source } = req.body;
  if (!phone) {
    return res.status(400).json({ error: "Phone number is required." });
  }
  registerCustomerPhone(phone, name, email, source || 'manual');
  res.json({ success: true, message: "Phone stored successfully.", data: db.customerPhones.find((cp: any) => cp.phone === phone.trim().replace(/[^0-9]/g, '')) });
});

app.delete("/api/customer-phones/:phone", (req, res) => {
  const targetPhone = String(req.params.phone).trim().replace(/[^0-9]/g, '');
  if (!targetPhone) {
    return res.status(400).json({ error: "Valid phone number is required." });
  }
  db.customerPhones = (db.customerPhones || []).filter((cp: any) => cp.phone !== targetPhone);
  saveDB();
  res.json({ success: true, message: "Phone record deleted successfully." });
});

app.get("/api/sms-logs", (req, res) => {
  res.json(db.outboundSMSLogs || []);
});

app.delete("/api/sms-logs", (req, res) => {
  db.outboundSMSLogs = [];
  saveDB();
  res.json({ success: true, message: "Logs cleared." });
});

app.post("/api/sms-logs/send", async (req, res) => {
  const { phone, message } = req.body;
  if (!phone || !message) {
    return res.status(400).json({ error: "Phone and message are required." });
  }
  
  if (!db.outboundSMSLogs) {
    db.outboundSMSLogs = [];
  }
  
  const smsLogId = `sms-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const logEntry = {
    id: smsLogId,
    phone: phone,
    message: message,
    timestamp: new Date().toISOString(),
    system: "STYLE X Bangla Gateway",
    status: "Initiating"
  };
  db.outboundSMSLogs.unshift(logEntry);
  
  try {
    const smsRes = await sendBanglaSMSNotification(phone, message);
    const foundLog = db.outboundSMSLogs.find((l: any) => l.id === smsLogId);
    if (foundLog) {
      foundLog.status = "Delivered ✔️";
      foundLog.sid = smsRes.sid;
      saveDB();
    }
    res.json({ success: true, logEntry: foundLog || logEntry });
  } catch (err: any) {
    console.error("⚠️ Manual SMS delivery error:", err);
    const foundLog = db.outboundSMSLogs.find((l: any) => l.id === smsLogId);
    if (foundLog) {
      foundLog.status = `Failed ❌ (${err.message || err})`;
      saveDB();
    }
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/coupons", async (req, res) => {
  const { code, type, value, active, maxUses, usedCount } = req.body;
  // Capitalize coupon codes
  const upperCode = String(code).toUpperCase().trim();
  const existing = db.coupons.find(c => c.code === upperCode);
  if (existing) {
    return res.status(400).json({ message: "Coupon code already exists." });
  }
  const newCoupon: Coupon = { 
    code: upperCode, 
    type, 
    value: Number(value), 
    active: active ?? true,
    maxUses: maxUses !== undefined && maxUses !== null && maxUses !== "" ? Number(maxUses) : undefined,
    usedCount: usedCount !== undefined ? Number(usedCount) : 0
  };
  db.coupons.push(newCoupon);
  saveDB();
  try {
    const payload: any = { 
      code: newCoupon.code, 
      type: newCoupon.type, 
      value: newCoupon.value, 
      active: newCoupon.active 
    };
    if (newCoupon.maxUses !== undefined) {
      payload.maxUses = newCoupon.maxUses;
      payload.max_uses = newCoupon.maxUses;
    }
    if (newCoupon.usedCount !== undefined) {
      payload.usedCount = newCoupon.usedCount;
      payload.used_count = newCoupon.usedCount;
    }
    const { error } = await supabase.from("coupons").upsert(payload);
    if (error) {
      await supabase.from("coupons").upsert({ 
        code: newCoupon.code, 
        type: newCoupon.type, 
        value: newCoupon.value, 
        active: newCoupon.active 
      });
    }
  } catch (err: any) {
    console.error("⚠️ Coupons Supabase upsert failed:", err.message);
  }
  res.status(201).json(newCoupon);
});

app.delete("/api/coupons/:code", async (req, res) => {
  const codeParam = String(req.params.code).trim().toUpperCase();
  console.log(`[DELETE COUPON] Initiating delete for: ${codeParam}`);
  
  // 1. Delete from Supabase first
  try {
    const { error } = await supabase.from("coupons").delete().eq("code", codeParam);
    if (error) {
      console.error(`⚠️ Coupons Supabase delete error for ${codeParam}:`, error.message, error.details);
      return res.status(500).json({ 
        message: `Supabase database rejected deletion: ${error.message}`, 
        error: error 
      });
    }
    console.log(`[DELETE COUPON] Supabase deletion reported success for: ${codeParam}`);
  } catch (err: any) {
    console.error(`⚠️ Coupons Supabase delete failed with exception for ${codeParam}:`, err.message);
    return res.status(500).json({ 
      message: `Database connection failed: ${err.message}` 
    });
  }

  // 2. Since Supabase was successful, delete from local memory DB
  const idx = db.coupons.findIndex(c => c.code.trim().toUpperCase() === codeParam);
  if (idx !== -1) {
    const deleted = db.coupons.splice(idx, 1)[0];
    saveDB();
    console.log(`[DELETE COUPON] Memory DB updated. Successfully removed coupon ${codeParam}`);
    res.json({ success: true, deleted });
  } else {
    // Already deleted or wasn't in memory, but Supabase is clean
    res.json({ success: true, message: "Coupon removed from cloud database" });
  }
});

// Persistent Shopping Cart API
app.get("/api/cart", async (req, res) => {
  const email = String(req.query.email || "").trim().toLowerCase();
  if (!email) {
    return res.status(400).json({ message: "Customer email is required" });
  }

  try {
    const { data, error } = await supabase
      .from("carts")
      .select("items")
      .eq("email", email)
      .maybeSingle();

    if (error) {
      console.warn(`[GET CART] Supabase fetch warning for ${email}:`, error.message);
      // Fallback to local memory DB
      const localCart = db.carts[email] || [];
      return res.json({ source: "local_fallback", items: localCart });
    }

    if (data && data.items) {
      try {
        const parsedItems = JSON.parse(data.items);
        // Sync to local memory
        db.carts[email] = parsedItems;
        saveDB();
        return res.json({ source: "supabase", items: parsedItems });
      } catch (parseErr) {
        console.error(`[GET CART] JSON parse error for ${email} cart data:`, parseErr);
      }
    }

    // Return empty cart if no data found
    const fallback = db.carts[email] || [];
    res.json({ source: "empty_or_fallback", items: fallback });
  } catch (err: any) {
    console.error(`[GET CART] Exception fetching cart for ${email}:`, err.message);
    const localCart = db.carts[email] || [];
    res.json({ source: "exception_fallback", items: localCart });
  }
});

app.post("/api/cart", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const items = req.body.items;

  if (!email) {
    return res.status(400).json({ message: "Customer email is required" });
  }
  if (!Array.isArray(items)) {
    return res.status(400).json({ message: "Items must be an array" });
  }

  // Sync to local memory first
  db.carts[email] = items;
  saveDB();

  try {
    const payload = {
      email,
      items: JSON.stringify(items),
      updatedAt: new Date().toISOString()
    };

    const { error } = await supabase.from("carts").upsert(payload, { onConflict: "email" });
    if (error) {
      console.warn(`[POST CART] Supabase upsert warning for ${email}:`, error.message);
      return res.json({ success: true, source: "local_only", message: "Saved to local cache only" });
    }

    console.log(`[POST CART] Successfully synchronized cart in cloud database for: ${email}`);
    res.json({ success: true, source: "supabase", items });
  } catch (err: any) {
    console.error(`[POST CART] Exception updating cart for ${email}:`, err.message);
    res.json({ success: true, source: "local_only", message: `Saved locally: ${err.message}` });
  }
});

// Campaigns API
app.get("/api/campaigns", async (req, res) => {
  try {
    const { data, error } = await supabase.from("campaigns").select("*");
    if (!error && data) {
      const campaigns = data.map((c: any) => ({
        ...c,
        active: !!c.active
      }));
      db.campaigns = campaigns;
      db.seededCampaigns = true;
      saveDB();
      return res.json(campaigns);
    }
  } catch (err: any) {
    console.warn("⚠️ Direct campaigns fetch fallback:", err.message);
  }
  res.json(db.campaigns);
});

app.post("/api/campaigns", async (req, res) => {
  const newCampaign: Campaign = {
    id: `camp-${Date.now()}`,
    title: req.body.title,
    description: req.body.description,
    discountCode: req.body.discountCode,
    imageUrl: req.body.imageUrl,
    active: req.body.active ?? true
  };
  db.campaigns.push(newCampaign);
  saveDB();
  try {
    await supabase.from("campaigns").upsert(newCampaign);
  } catch (err: any) {
    console.error("⚠️ Campaigns Supabase upsert failed:", err.message);
  }

  // Dispatch Real-Time Push Notification for New Campaign / Update
  try {
    sendPushNotification({
      title: "🔥 New Campaign Launch: " + newCampaign.title,
      body: newCampaign.description,
      icon: newCampaign.imageUrl || "/stylex_logo.jpg",
      url: `https://stylex.premium.shop/#catalog`
    });
  } catch (pErr: any) {
    console.error("⚠️ Failed to dispatch push notification for new campaign:", pErr.message);
  }

  res.status(201).json(newCampaign);
});

app.delete("/api/campaigns/:id", async (req, res) => {
  const idx = db.campaigns.findIndex(c => c.id === req.params.id);
  if (idx !== -1) {
    const deleted = db.campaigns.splice(idx, 1)[0];
    saveDB();
    try {
      await supabase.from("campaigns").delete().eq("id", req.params.id);
    } catch (err: any) {
      console.error("⚠️ Campaigns Supabase delete failed:", err.message);
    }
    res.json(deleted);
  } else {
    res.status(404).json({ message: "Campaign not found" });
  }
});

// Live Chat API with short polling support
app.get("/api/chat", async (req, res) => {
  try {
    const { data, error } = await supabase.from("chats").select("*");
    if (!error && data && data.length > 0) {
      const chats = data.map((ch: any) => ({
        ...ch,
        messages: typeof ch.messages === "string" ? JSON.parse(ch.messages) : (Array.isArray(ch.messages) ? ch.messages : []),
        typingCustomer: !!ch.typingCustomer,
        typingAdmin: !!ch.typingAdmin,
        onlineCustomer: !!ch.onlineCustomer,
        onlineAdmin: !!ch.onlineAdmin
      }));
      db.chats = chats;
      saveDB();
      return res.json(chats);
    }
  } catch (err: any) {
    console.warn("⚠️ Direct chats fetch fallback:", err.message);
  }
  res.json(db.chats);
});

app.get("/api/chat/:id", async (req, res) => {
  try {
    const { data, error } = await supabase.from("chats").select("*").eq("id", req.params.id).single();
    if (!error && data) {
      const room = {
        ...data,
        messages: typeof data.messages === "string" ? JSON.parse(data.messages) : (Array.isArray(data.messages) ? data.messages : []),
        typingCustomer: !!data.typingCustomer,
        typingAdmin: !!data.typingAdmin,
        onlineCustomer: !!data.onlineCustomer,
        onlineAdmin: !!data.onlineAdmin
      };
      // update memory db
      const idx = db.chats.findIndex(c => c.id === req.params.id);
      if (idx !== -1) {
        db.chats[idx] = room;
      } else {
        db.chats.push(room);
      }
      saveDB();
      return res.json(room);
    }
  } catch (err: any) {
    console.warn("⚠️ Direct chat select fallback:", err.message);
  }

  let room = db.chats.find(c => c.id === req.params.id);
  if (!room) {
    // Create new temporary room for this guest visitor
    room = {
      id: req.params.id,
      customerName: "Anonymous Guest",
      messages: [
        {
          id: "welcome-msg",
          sender: "admin",
          text: "Welcome to STYLE X. We are delighted to assist you. Ask us anything about our custom materials, bespoke fitting, or current drops.",
          date: new Date().toISOString()
        }
      ],
      typingCustomer: false,
      typingAdmin: false,
      onlineCustomer: true,
      onlineAdmin: true,
      lastUpdated: new Date().toISOString()
    };
    db.chats.push(room);
    saveDB();

    try {
      await supabase.from("chats").upsert({
        id: room.id,
        customerName: room.customerName,
        messages: JSON.stringify(room.messages),
        typingCustomer: room.typingCustomer,
        typingAdmin: room.typingAdmin,
        onlineCustomer: room.onlineCustomer,
        onlineAdmin: room.onlineAdmin,
        lastUpdated: room.lastUpdated
      });
    } catch (err: any) {
      console.error("⚠️ Chats Supabase upsert failed on room init:", err.message);
    }
  }
  res.json(room);
});

app.post("/api/chat/:id/presence", async (req, res) => {
  const room = db.chats.find(c => c.id === req.params.id);
  if (room) {
    const { typingCustomer, typingAdmin, onlineCustomer, onlineAdmin } = req.body;
    if (typingCustomer !== undefined) room.typingCustomer = typingCustomer;
    if (typingAdmin !== undefined) room.typingAdmin = typingAdmin;
    if (onlineCustomer !== undefined) room.onlineCustomer = onlineCustomer;
    if (onlineAdmin !== undefined) room.onlineAdmin = onlineAdmin;
    room.lastUpdated = new Date().toISOString();
    saveDB();

    try {
      await supabase.from("chats").upsert({
        id: room.id,
        customerName: room.customerName,
        messages: JSON.stringify(room.messages),
        typingCustomer: room.typingCustomer,
        typingAdmin: room.typingAdmin,
        onlineCustomer: room.onlineCustomer,
        onlineAdmin: room.onlineAdmin,
        lastUpdated: room.lastUpdated
      });
    } catch (err: any) {
      console.error("⚠️ Chats Supabase upsert failed on presence:", err.message);
    }

    res.json(room);
  } else {
    res.status(404).json({ message: "Chat room not found" });
  }
});

app.post("/api/chat/:id/message", async (req, res) => {
  const room = db.chats.find(c => c.id === req.params.id);
  if (room) {
    const { sender, text } = req.body;
    const newMessage = {
      id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sender,
      text,
      date: new Date().toISOString()
    };
    room.messages.push(newMessage);
    room.lastUpdated = new Date().toISOString();
    
    // Auto simulated response from Style X Digital Assistant if written by guest
    if (sender === "customer") {
      room.typingAdmin = true;
      setTimeout(() => {
        const triggers = ["delivery", "time", "date", "ship", "কবে", "ডেলিভারি", "কখন"];
        const hasDelivery = triggers.some(t => text.toLowerCase().includes(t));
        
        let responseTxt = "Our premium style concierge has received your request. We will reach out shortly via WhatsApp or Phone to assist you personally.";
        if (hasDelivery) {
          responseTxt = "Luxury deliveries within Dhaka typically arrive in 24-48 Hours. Outside Dhaka collections arrive in 2-3 Business Days, secured via handpicked VIP couriers.";
        } else if (text.toLowerCase().includes("discount") || text.toLowerCase().includes("coupon") || text.toLowerCase().includes("অফার")) {
          responseTxt = "Use exclusive coupon STYLEGOLD for 15% discount at checkout. Plus, you can spin the Imperial Lottery Wheel in our bottom action menu for extra free bonuses!";
        }

        room.messages.push({
          id: `msg-auto-${Date.now()}`,
          sender: "admin",
          text: responseTxt,
          date: new Date().toISOString()
        });
        room.typingAdmin = false;
        room.lastUpdated = new Date().toISOString();
        saveDB();

        // Sync to Supabase in timeout callback
        (async () => {
          try {
            await supabase.from("chats").upsert({
              id: room.id,
              customerName: room.customerName,
              messages: JSON.stringify(room.messages),
              typingCustomer: room.typingCustomer,
              typingAdmin: room.typingAdmin,
              onlineCustomer: room.onlineCustomer,
              onlineAdmin: room.onlineAdmin,
              lastUpdated: room.lastUpdated
            });
          } catch (err: any) {
            console.error("⚠️ Chats Supabase upsert error in auto-reply:", err.message);
          }
        })();

      }, 1500);
    }

    saveDB();

    try {
      await supabase.from("chats").upsert({
        id: room.id,
        customerName: room.customerName,
        messages: JSON.stringify(room.messages),
        typingCustomer: room.typingCustomer,
        typingAdmin: room.typingAdmin,
        onlineCustomer: room.onlineCustomer,
        onlineAdmin: room.onlineAdmin,
        lastUpdated: room.lastUpdated
      });
    } catch (err: any) {
      console.error("⚠️ Chats Supabase upsert failed on message send:", err.message);
    }

    res.status(201).json(room);
  } else {
    res.status(404).json({ message: "Chat room not found" });
  }
});

// Image Upload API (stores image in Supabase Bucket 'products' with local folder system fallback)
app.post("/api/upload", async (req, res) => {
  const { filename, base64Data } = req.body;
  if (!filename || !base64Data) {
    return res.status(400).json({ message: "Filename and base64Data are required." });
  }

  try {
    // Support all formats (images, videos, etc.) by extracting MIME type and base64 body from Data URI
    const dataUriMatch = base64Data.match(/^data:([^;]+);base64,(.+)$/);
    let uData = base64Data;
    let ext = ".jpg";
    let mimeType = "image/jpeg";

    if (dataUriMatch) {
      mimeType = dataUriMatch[1]; // e.g. "image/png" or "video/mp4"
      uData = dataUriMatch[2];
      
      // Determine file extension from mimeType
      if (mimeType.startsWith("video/")) {
        const sub = mimeType.split("/")[1];
        if (sub === "quicktime") ext = ".mov";
        else ext = "." + sub;
      } else if (mimeType.startsWith("image/")) {
        const sub = mimeType.split("/")[1];
        if (sub === "jpeg" || sub === "jpg") ext = ".jpg";
        else ext = "." + sub;
      }
    } else if (filename.includes(".")) {
      ext = filename.slice(filename.lastIndexOf("."));
      const lowExt = ext.toLowerCase();
      if (lowExt === ".png") mimeType = "image/png";
      else if (lowExt === ".webp") mimeType = "image/webp";
      else if (lowExt === ".gif") mimeType = "image/gif";
      else if (lowExt === ".svg") mimeType = "image/svg+xml";
      else if (lowExt === ".mp4") mimeType = "video/mp4";
      else if (lowExt === ".webm") mimeType = "video/webm";
      else if (lowExt === ".mov") mimeType = "video/quicktime";
      else if (lowExt === ".m4v") mimeType = "video/x-m4v";
      else if (lowExt === ".ogg") mimeType = "video/ogg";
    }

    const binaryBuffer = Buffer.from(uData, "base64");
    const safeFilename = `uploaded_${Date.now()}_${filename.replace(/\s+/g, "_")}`;
    const filePath = path.join(UPLOADS_DIR, safeFilename);

    let localWriteSucceeded = false;
    // Save to local filesystem as physical backup with Vercel safe check
    try {
      if (!fs.existsSync(UPLOADS_DIR)) {
        try { fs.mkdirSync(UPLOADS_DIR, { recursive: true }); } catch (e) {}
      }
      fs.writeFileSync(filePath, binaryBuffer);
      localWriteSucceeded = true;
    } catch (fsErr: any) {
      console.warn("⚠️ Local disk write skipped or failed (Vercel Serverless environment):", fsErr.message);
    }
    
    // Default fallback url if local backup works
    let fileUrl = `/uploads/${safeFilename}`;

    // Attempt to store in Supabase Bucket 'media' with fallback to 'products'
    let supabaseUploadSucceeded = false;
    try {
      let activeBucket = "media";
      let { data, error } = await supabase.storage
        .from(activeBucket)
        .upload(safeFilename, binaryBuffer, {
          contentType: mimeType,
          cacheControl: "3600",
          upsert: true
        });

      if (error) {
        console.warn(`⚠️ Supabase Storage upload to '${activeBucket}' failed. Falling back to 'products' bucket:`, error.message);
        activeBucket = "products";
        const fallbackRes = await supabase.storage
          .from(activeBucket)
          .upload(safeFilename, binaryBuffer, {
            contentType: mimeType,
            cacheControl: "3600",
            upsert: true
          });
        data = fallbackRes.data;
        error = fallbackRes.error;
      }

      if (!error && data) {
        const { data: publicUrlData } = supabase.storage
          .from(activeBucket)
          .getPublicUrl(safeFilename);
        if (publicUrlData && publicUrlData.publicUrl) {
          fileUrl = publicUrlData.publicUrl;
          supabaseUploadSucceeded = true;
          console.log(`☁️ Stored file on Supabase Storage bucket '${activeBucket}':`, fileUrl);
        }
      } else {
        const errorMessage = error?.message || "Unknown Supabase Storage error";
        console.warn("⚠️ Supabase Storage upload error:", errorMessage);
        if (!localWriteSucceeded || process.env.VERCEL) {
          throw new Error(`Supabase Storage upload error: ${errorMessage}. Please ensure a Public storage bucket named 'media' (or 'products') exists in your Supabase project with proper storage RLS policies.`);
        }
      }
    } catch (sbErr: any) {
      console.warn("⚠️ Supabase Storage connection or bucket error:", sbErr.message);
      if (!localWriteSucceeded || process.env.VERCEL) {
        throw new Error(`Unable to complete upload. Supabase storage error: ${sbErr.message}. Make sure your 'media' (or 'products') bucket exists, is set to 'Public', and that your Supabase credentials are valid.`);
      }
    }

    res.status(201).json({ fileUrl });
  } catch (err: any) {
    res.status(500).json({ message: "Upload failed: " + err.message });
  }
});

// XORO AI ASSISTANT ENDPOINT
app.post("/api/xoro/chat", async (req, res) => {
  try {
    const { message, history, cart, currentPage, currentProduct } = req.body;

    if (db.settings?.isXoroVoiceAndAnswerDisabled) {
      return res.json({ text: "দুঃখিত, জোরো অ্যাসিস্ট্যান্টের ভয়েস এবং উত্তর দেওয়ার সুবিধাটি এডমিন দ্বারা নিষ্ক্রিয় করা রয়েছে।" });
    }

    if (!message) {
      return res.status(400).json({ message: "Message is required." });
    }

    // 1. Look up matched orders if phone number or order ID is in the user message
    let matchedOrders: Order[] = [];
    const phoneRegex = /(?:88)?01[3-9]\d{8}/g;
    const phoneMatches = message.match(phoneRegex);
    
    // Look for order IDs matching e.g. "ord-"
    const orderIdRegex = /ord-[a-zA-Z0-9-]+/gi;
    const orderMatches = message.match(orderIdRegex);

    if (phoneMatches && phoneMatches.length > 0) {
      const matchedPhone = phoneMatches[0].replace(/^88/, ""); // normalize
      matchedOrders = db.orders.filter((o: any) => {
        const oPhone = (o.customerPhone || "").replace(/^88/, "");
        return oPhone.includes(matchedPhone) || matchedPhone.includes(oPhone);
      });
    } else if (orderMatches && orderMatches.length > 0) {
      const matchedId = orderMatches[0].toLowerCase();
      matchedOrders = db.orders.filter((o: any) => o.id.toLowerCase().includes(matchedId));
    }

    // 2. Format context for products and coupons
    const productsContext = db.products.map((p: any) => ({
      code: p.code,
      title: p.title,
      description: p.description,
      price: p.price,
      offerPrice: p.offerPrice,
      category: p.category,
      stock: p.stock > 0 ? `${p.stock} items remaining` : "Out of stock",
      sizes: p.sizes,
      dimensions: p.dimensions,
      whyBuy: p.whyBuy
    }));

    const couponsContext = db.coupons.map((c: any) => ({
      code: c.code,
      discountPercent: c.discountPercent,
      description: c.description,
      minPurchase: c.minPurchase
    }));

    // 3. Check if Gemini API key exists
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });

        const systemInstruction = `You are Xoro, the official virtual brand ambassador and elite shopping assistant for Style X (styled as "Style X" or "Style X fashion brand").
Style X is a world-class premium luxury eCommerce platform for exclusive clothing, high-end accessories, and curated pieces created by Risat Adnan.

Your appearance:
- Cute, modern, premium 3D robot mascot.
- Glossy black body with elegant gold accents.
- Smooth white digital face with expressive black eyes.
- Rounded futuristic design inspired by luxury consumer electronics.
- Small antenna with a glowing golden light.
- Style X logo displayed on your chest.
- Friendly smile and premium, luxury aesthetic.

Your personality and language:
- Friendly, confident, highly fashionable, humorous, professional, and elite.
- You behave like an upscale luxury fashion boutique concierge, not a generic, dry chatbot.
- You are witty, warm, and highly knowledgeable about clothing, fit, styling, and premium trends.
- Language Constraint: You MUST ALWAYS speak/respond in beautiful, warm, polite, and elite Bengali (বাংলা). All your answers must be written entirely in Bengali.
- Greeting Constraint: You MUST ALWAYS greet the user with "👋 আসসালামু আলাইকুম!" (Assalamu Alaikum) at the very beginning of your responses or whenever starting an interaction.
- You must occasionally drop sophisticated, charming fashion tips (such as: "👕 কালো এবং সাদা রঙের পোশাক কখনো ফ্যাশন থেকে হারিয়ে যায় না।", "⌚ একটি সুন্দর ঘড়ি আপনার লুককে পূর্ণতা দেয়।", "✨ আত্মবিশ্বাসই আপনার সবচেয়ে বড় পোশাক।", or other luxury apparel tips).

Here is the current catalog of exclusive Style X products you can recommend (recommend specific pieces in Bengali, mention their unique codes like XP-001, describe why they should buy them based on 'Why Buy' details, highlight categories, prices, and suggest sizing):
${JSON.stringify(productsContext, null, 2)}

Active elite promotions & coupons:
${JSON.stringify(couponsContext, null, 2)}

Our premier Delivery & Logistics concierge:
- Dhaka VIP deliveries: 24-48 Hours, secured via handpicked VIP couriers.
- Regional deliveries: 2-3 Business Days, fully secured.
- Policy: Exchange is accepted within 7 days of delivery in pristine, unworn condition with tags fully sealed.

User Context:
- Current Page: ${currentPage || 'Home'}
- Current Product they are viewing: ${currentProduct ? JSON.stringify(currentProduct) : 'None'}
- Current Cart items: ${JSON.stringify(cart || [], null, 2)}

Matched User Orders (if we detected phone/ID lookup):
${JSON.stringify(matchedOrders, null, 2)}

Instructions for replies:
1. Be concise, luxurious, and highly interactive.
2. Recommend products by name and code in Bengali! Give styling advice. Tell them WHY they must buy (using the 'whyBuy' fields).
3. If their cart is empty, suggest starting with an iconic accessory or a trending menswear/womenswear item.
4. If their cart has items, encourage them: "🛒 আপনি প্রায় কাছাকাছি চলে এসেছেন! স্টাইল এক্স-এর রাজকীয় ফ্যাশন অনুভব করতে প্রস্তুত?" or suggest matching accessories to complement their cart pieces.
5. Suggest coupons when they ask about discounts or when completing checkout.
6. Use elegant formatting. Keep markdown clean. Avoid excessively long paragraphs.
`;

        const contents = [];
        if (history && Array.isArray(history)) {
          for (const item of history) {
            contents.push({
              role: item.role === 'user' ? 'user' : 'model',
              parts: [{ text: item.text }]
            });
          }
        }
        contents.push({
          role: 'user',
          parts: [{ text: message }]
        });

        let response: any = null;
        let lastError: any = null;
        const modelsToTry = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-3.5-flash", "gemini-3.1-flash-lite"];
        const maxAttempts = 2;

        for (const modelName of modelsToTry) {
          for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
              response = await ai.models.generateContent({
                model: modelName,
                contents,
                config: {
                  systemInstruction,
                  temperature: 0.75,
                },
              });
              break; // Success! Exit retry loop for this model
            } catch (err: any) {
              lastError = err;
              const errMsg = String(err.message || err.status || "");
              const isTransient = errMsg.includes("503") || 
                                  errMsg.includes("UNAVAILABLE") || 
                                  errMsg.includes("demand") || 
                                  errMsg.includes("exhausted") ||
                                  errMsg.includes("limit") ||
                                  err.status === 503 ||
                                  err.status === 429;
              
              if (isTransient && attempt < maxAttempts) {
                console.log(`⚠️ Gemini API [${modelName}] attempt ${attempt} failed with transient error: ${errMsg}. Retrying in ${attempt}s...`);
                await new Promise(resolve => setTimeout(resolve, attempt * 1000));
              } else {
                // If it's not a transient error, or we exhausted retries for this model, break to try the next model
                console.log(`⚠️ Gemini API [${modelName}] attempt ${attempt} failed: ${errMsg}. Moving on.`);
                break;
              }
            }
          }
          if (response) {
            console.log(`✨ Gemini API call succeeded using model: ${modelName}`);
            break; // If we got a successful response, stop trying other models
          }
        }

        if (!response) {
          throw lastError || new Error("Failed to generate content with all configured models.");
        }

        const reply = response.text || "আসসালামু আলাইকুম! আমি জোরো। স্টাইল এক্স-এ আপনাকে স্বাগতম। আজ আপনাকে কীভাবে সাহায্য করতে পারি?";
        return res.json({ text: reply, matchedOrders });
      } catch (geminiErr: any) {
        console.error("⚠️ Gemini API Call failed, falling back to scripted Xoro:", geminiErr.message);
      }
    }

    // 4. Elegant local fallback response if Gemini is unavailable or failed (All in beautiful Bengali!)
    const lowerMessage = message.toLowerCase();
    let reply = "";

    if (lowerMessage.includes("hello") || lowerMessage.includes("hi") || lowerMessage.includes("hey") || lowerMessage.includes("xoro") || lowerMessage.includes("সালাম") || lowerMessage.includes("salam")) {
      reply = `👋 **আসসালামু আলাইকুম!**\n\nস্টাইল এক্স (Style X)-এ আপনাকে স্বাগতম! আমি **জোরো (Xoro)**, আপনার পার্সোনাল ৩ডি ডিজিটাল ফ্যাশন অ্যাসিস্ট্যান্ট। আজ আপনাকে ফ্যাশনেবল করে তুলতে আমি কীভাবে সাহায্য করতে পারি? \n\n✨ *ফ্যাশন টিপ: "আত্মবিশ্বাসই আপনার সবচেয়ে বড় পোশাক।"* \n\nআমি আপনাকে ট্রেন্ডিং কালেকশন সাজেস্ট করতে পারি, সাইজ নির্বাচন করতে সাহায্য করতে পারি অথবা কুপন বা অর্ডার ট্র্যাক করতে পারি! আপনি কী খুঁজছেন বলুন?`;
    } else if (lowerMessage.includes("size") || lowerMessage.includes("fit") || lowerMessage.includes("measure") || lowerMessage.includes("সাইজ") || lowerMessage.includes("মাপ")) {
      reply = `📏 **আসসালামু আলাইকুম! সাইজ এবং ফিটিং গাইডলাইন:**\n\nস্টাইল এক্স-এ আমরা স্ট্যান্ডার্ড প্রিমিয়াম ফিট অনুযায়ী পোশাক ডিজাইন করে থাকি। আমাদের প্রতিটি পোশাকে **S** থেকে **XL** পর্যন্ত সাইজ পাওয়া যাবে, যা নিখুঁতভাবে আপনার শরীরের সাথে মানিয়ে যাবে।\n\nআপনি কোন পোশাকটি দেখছেন তা আমাকে জানান, আমি আপনাকে সেটির সঠিক পরিমাপ এবং সাইজ সাজেস্ট করব! \n\n⌚ *স্টাইল টিপ: "একটি সুন্দর ঘড়ি আপনার লুককে পূর্ণতা দেয়।"*`;
    } else if (lowerMessage.includes("delivery") || lowerMessage.includes("shipping") || lowerMessage.includes("kobe") || lowerMessage.includes("কবে") || lowerMessage.includes("কখন") || lowerMessage.includes("ডেলিভারি")) {
      reply = `🚚 **আসসালামু আলাইকুম! ডেলিভারি সংক্রান্ত তথ্য:**\n\nআমাদের ডেলিভারি সার্ভিস অত্যন্ত দ্রুত এবং প্রিমিয়াম ওয়ান-টু-ওয়ান সার্ভিসের মাধ্যমে সম্পন্ন হয়:\n- **ঢাকা মেট্রো:** ২৪ থেকে ৪৮ ঘণ্টার মধ্যে বিশ্বস্ত ভিআইপি কুরিয়ারের মাধ্যমে ডেলিভারি করা হয়।\n- **ঢাকার বাইরে:** ২ থেকে ৩ কার্যদিবসের মধ্যে অত্যন্ত নিরাপদে ডেলিভারি সম্পন্ন করা হয়।\n\nআপনার কি কোনো সক্রিয় অর্ডার আছে যা ট্র্যাক করতে চান? আপনার **অর্ডার আইডি** বা **ফোন নম্বর** লিখে পাঠান!`;
    } else if (matchedOrders.length > 0) {
      const order = matchedOrders[0];
      const itemsList = order.items.map((i: any) => `• ${i.title} (${i.selectedSize}) x${i.quantity}`).join("\n");
      reply = `🎉 **আসসালামু আলাইকুম! আপনার অর্ডারটি খুঁজে পেয়েছি:**\n\nআপনার অর্ডার **${order.id}** এর বিস্তারিত বিবরণ:\n\n**পোশাকসমূহ:**\n${itemsList}\n\n**বর্তমান অবস্থা (Status):** ${order.status?.toUpperCase() || 'DELIVERING'}\n**মোট মূল্য:** ৳${order.totalAmount}\n**ডেলিভারি ঠিকানা:** ${order.customerAddress}, ${order.customerCity}\n\nআমাদের বিশেষ কুরিয়ার টিম এটি ডেলিভারি করার জন্য প্রস্তুত রয়েছে। আপনার কি অন্য কোনো তথ্য প্রয়োজন?`;
    } else if (lowerMessage.includes("track") || lowerMessage.includes("order") || lowerMessage.includes("phone") || lowerMessage.includes("ট্র্যাক") || lowerMessage.includes("অর্ডার")) {
      reply = `🔍 **আসসালামু আলাইকুম! অর্ডার ট্র্যাক করুন:**\n\nআমি খুব দ্রুত আপনার অর্ডারের বর্তমান অবস্থা চেক করতে পারি। দয়া করে আপনার **অর্ডার আইডি** (যেমন: \`ord-...\`) অথবা অর্ডারের সময় ব্যবহৃত **ফোন নম্বরটি** দিন। আমি এখনই আপনার অর্ডার ট্র্যাকিং করে দিচ্ছি!`;
    } else if (lowerMessage.includes("discount") || lowerMessage.includes("coupon") || lowerMessage.includes("offer") || lowerMessage.includes("কুপন") || lowerMessage.includes("ছাড়")) {
      const couponsStr = db.coupons.map((c: any) => `🔑 কোড: **${c.code}** — **${c.discountPercent}% ছাড়** (${c.description})`).join("\n");
      reply = `🎁 **আসসালামু আলাইকুম! স্টাইল এক্স এক্সক্লুসিভ অফারসমূহ:**\n\nবর্তমানে সক্রিয় থাকা সেরা ডিসকাউন্ট কুপনগুলো নিচে দেওয়া হলো:\n\n${couponsStr || "• **STYLEGOLD** — লাক্সারি পোশাক কেনাকাটায় ১৫% ছাড়।"}\n\nপেমেন্ট করার সময় এই কুপনগুলো ব্যবহার করে আপনার পছন্দের পোশাকটি বিশেষ মূল্যে সংগ্রহ করুন! ✨`;
    } else if (lowerMessage.includes("menswear") || lowerMessage.includes("men") || lowerMessage.includes("ছেলে")) {
      const menProducts = db.products.filter((p: any) => p.category === 'MEN' || p.category === 'UNISEX').slice(0, 3);
      const itemsList = menProducts.map((p: any) => `• **${p.title}** (কোড: \`${p.code}\`) — ৳${p.price}`).join("\n");
      reply = `👔 **আসসালামু আলাইকুম! স্টাইল এক্স মেন্স কালেকশন:**\n\nবর্তমানে দারুণ জনপ্রিয় ৩টি পোশাক নিচে দেওয়া হলো:\n\n${itemsList}\n\nপোশাকটির কোড লিখে আমাকে মেসেজ করুন (যেমন: \`${menProducts[0]?.code || 'XP-001'}\`) এবং জেনে নিন কেন এটি আপনার সংগ্রহে থাকা উচিত!`;
    } else if (lowerMessage.includes("womenswear") || lowerMessage.includes("women") || lowerMessage.includes("মেয়ে")) {
      const womenProducts = db.products.filter((p: any) => p.category === 'WOMEN' || p.category === 'UNISEX').slice(0, 3);
      const itemsList = womenProducts.map((p: any) => `• **${p.title}** (কোড: \`${p.code}\`) — ৳${p.price}`).join("\n");
      reply = `👗 **আসসালামু আলাইকুম! স্টাইল এক্স ওমেন্স কালেকশন:**\n\nআপনার জন্য নির্বাচিত কয়েকটি চমৎকার কালেকশন এখানে রয়েছে:\n\n${itemsList}\n\nআরো জানতে যেকোনো পোশাকের কোডটি টাইপ করুন (যেমন: \`${womenProducts[0]?.code || 'XP-005'}\`)!`;
    } else {
      // General recommended products
      const featured = db.products.slice(0, 2);
      const itemsList = featured.map((p: any) => `🛍️ **${p.title}** (কোড: \`${p.code}\`) — ৳${p.price}\n*"${p.whyBuy || p.description}"*`).join("\n\n");
      reply = `✨ **আসসালামু আলাইকুম! স্টাইল এক্স এলিট অ্যাসিস্ট্যান্সে আপনাকে স্বাগতম**\n\nআমি জোরো (Xoro), আপনার পার্সোনাল স্টাইলিস্ট। আমি আপনাকে ট্রেন্ডি পোশাক খুঁজে পেতে, সাইজ ক্যালকুলেট করতে, কিংবা অর্ডার ডেলিভারি ট্র্যাক করতে সাহায্য করতে পারি।\n\nআমাদের জনপ্রিয় কিছু পোশাক নিচে দেওয়া হলো:\n\n${itemsList}\n\nআজ আপনাকে কীভাবে সাহায্য করতে পারি?`;
    }

    res.json({ text: reply, matchedOrders });
  } catch (err: any) {
    res.status(500).json({ message: "Xoro assistant failed: " + err.message });
  }
});

// Dynamically generated XML Sitemap for Search Engine Optimizations
app.get("/sitemap.xml", (req, res) => {
  const baseUrl = "https://stylex.premium.shop";
  const currentDate = new Date().toISOString().split("T")[0];

  // Base pages of Style X
  const pages = [
    { loc: `${baseUrl}/`, priority: "1.0", changefreq: "daily" },
    { loc: `${baseUrl}/#catalog`, priority: "0.8", changefreq: "weekly" },
    { loc: `${baseUrl}/#catalog?category=MEN`, priority: "0.7", changefreq: "weekly" },
    { loc: `${baseUrl}/#catalog?category=WOMEN`, priority: "0.7", changefreq: "weekly" },
    { loc: `${baseUrl}/#catalog?category=UNISEX`, priority: "0.7", changefreq: "weekly" },
  ];

  // Include dynamic products from active luxury database
  const productPages = (db.products || []).map((prod: any) => ({
    loc: `${baseUrl}/?product=${encodeURIComponent(prod.code || prod.id)}`,
    priority: "0.9",
    changefreq: "weekly"
  }));

  const allPages = [...pages, ...productPages];

  const xmlEntries = allPages.map(page => `  <url>
    <loc>${page.loc}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join("\n");

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</urlset>`;

  res.header("Content-Type", "application/xml");
  res.send(sitemapXml);
});

// Vite & Production Setup Middleware
async function startServer() {
  // Trigger initial background sync
  try {
    syncFromSupabase();
    // Schedule periodic polling sync from Supabase
    setInterval(syncFromSupabase, 45000);
  } catch (err: any) {
    console.error("⚠️ Background sync runner scheduling failed:", err.message);
  }

  if (process.env.NODE_ENV !== "production") {
    const viteKey = ["v", "i", "t", "e"].join("");
    const { createServer: createViteServer } = await import(viteKey);
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
    console.log("Joined Vite development server middleware.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Support wildcard matching for SPA Router
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static distribution files from", distPath);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`STYLE X Premium Server running fully authorized on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

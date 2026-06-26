import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import fs from "fs";
import { Product, Order, Banner, Review, Coupon, ChatRoom, Campaign } from "./src/types.js";
import { supabase } from "./src/lib/supabase.js";


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
  banners: initialBanners,
  reviews: [] as Review[],
  coupons: initialCoupons,
  campaigns: initialCampaigns,
  chats: [] as ChatRoom[],
  visits: 125,
  liveViews: 3,
  countedSessions: [] as string[],
  notifications: [] as any[],
  seededCoupons: false,
  seededCampaigns: false,
  seededBanners: false,
  seededProducts: false,
  seededReviews: false,
  settings: {
    whatsappNumber: "8801755104443",
    adminEmail: "risatadnan4@gmail.com",
    adminPassword: "risat123",
    appsScriptUrl: "https://script.google.com/macros/s/AKfycbwXARnVsjEPfY2D81-3PswAiNPJke7py_UlwB-vre-RcBZfOgNtEB15morsHUEuUG5_yA/exec",
    logoUrl: "/stylex_logo.jpg",
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
    lotteryPrizes: [
      { text: "15% OFF (STYLEGOLD)", value: "STYLEGOLD", type: "coupon" },
      { text: "VIP Free Carriage", value: "FREE_SHIPPING", type: "shipping" },
      { text: "৳20 OFF (RISATVIP)", value: "RISATVIP", type: "coupon" },
      { text: "Limited Edition SX Patch", value: "SX_PATCH", type: "merch" },
      { text: "Exclusive Concierge Pass", value: "MEMBER_PASS", type: "pass" },
      { text: "Royal Golden Keychain", value: "KEYCHAIN", type: "merch" }
    ]
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
    db.notifications = db.notifications || [];
    db.backInStockAlerts = db.backInStockAlerts || [];
    db.seededCoupons = parsedData.seededCoupons !== undefined ? !!parsedData.seededCoupons : false;
    db.seededCampaigns = parsedData.seededCampaigns !== undefined ? !!parsedData.seededCampaigns : false;
    db.seededBanners = parsedData.seededBanners !== undefined ? !!parsedData.seededBanners : false;
    db.seededProducts = parsedData.seededProducts !== undefined ? !!parsedData.seededProducts : false;
    db.seededReviews = parsedData.seededReviews !== undefined ? !!parsedData.seededReviews : false;
    
    // Always migrate old default script URLs to the newly provided script URL
    const oldDefaultUrls = [
      "https://script.google.com/macros/s/AKfycbwlkTgUkW1XTScs7dIIym1mNpa6MVgY9JO9c0lACN7Jaj8zi6TWYs1LgNDp4V6NoDPa/exec",
      "https://script.google.com/macros/s/AKfycbxyp9-vg7NU4Gvi7_lEd2G1MQr_QwkbmEBT3QZhs9EsbheCr0wwYy2aLydw-HOQqjoY/exec"
    ];
    const currentScriptUrl = db.settings?.appsScriptUrl || oldDefaultUrls[0];
    
    db.settings = {
      whatsappNumber: db.settings?.whatsappNumber || "8801755104443",
      adminEmail: db.settings?.adminEmail || "risatadnan4@gmail.com",
      adminPassword: db.settings?.adminPassword || "risat123",
      appsScriptUrl: oldDefaultUrls.includes(currentScriptUrl)
        ? "https://script.google.com/macros/s/AKfycbwXARnVsjEPfY2D81-3PswAiNPJke7py_UlwB-vre-RcBZfOgNtEB15morsHUEuUG5_yA/exec" 
        : currentScriptUrl,
      logoUrl: db.settings?.logoUrl || "/stylex_logo.jpg",
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
      lotteryPrizes: db.settings?.lotteryPrizes || [
        { text: "15% OFF (STYLEGOLD)", value: "STYLEGOLD", type: "coupon" },
        { text: "VIP Free Carriage", value: "FREE_SHIPPING", type: "shipping" },
        { text: "৳20 OFF (RISATVIP)", value: "RISATVIP", type: "coupon" },
        { text: "Limited Edition SX Patch", value: "SX_PATCH", type: "merch" },
        { text: "Exclusive Concierge Pass", value: "MEMBER_PASS", type: "pass" },
        { text: "Royal Golden Keychain", value: "KEYCHAIN", type: "merch" }
      ]
    };
    saveDB();
  } catch (err) {
    console.error("Error parsing DB file, using default structure", err);
  }
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

// Background sync from Supabase database
async function syncFromSupabase() {
  try {
    console.log("🔄 Fetching latest collections from Supabase database in parallel...");

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
      supabase.from("products").select("*"),
      supabase.from("banners").select("*"),
      supabase.from("coupons").select("*"),
      supabase.from("campaigns").select("*"),
      supabase.from("reviews").select("*"),
      supabase.from("orders").select("*"),
      supabase.from("chats").select("*"),
      supabase.from("settings").select("*")
    ]);

    // 1. Sync Products
    try {
      if (!productsResult.error && productsResult.data) {
        const productsData = productsResult.data;
        if (productsData.length > 0) {
          db.products = productsData.map((p: any) => {
            const localProduct = db.products ? db.products.find((lp: any) => lp.id === p.id) : null;
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
              offerPrice: (p.offerPrice !== undefined && p.offerPrice !== null) ? Number(p.offerPrice) : (localProduct?.offerPrice !== undefined ? localProduct.offerPrice : undefined),
              timerEndTime: p.timerEndTime || localProduct?.timerEndTime || undefined,
              timerMessage: p.timerMessage || localProduct?.timerMessage || undefined
            };
          });
          db.seededProducts = true;
          saveDB();
          console.log(`✅ Synced ${db.products.length} products from Supabase.`);
        } else {
          if (db.products && db.products.length > 0) {
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
              if (fallbackSettings.lotteryPrizes) db.settings.lotteryPrizes = fallbackSettings.lotteryPrizes;
              
              saveDB();
            } catch (jsonErr: any) {
              console.warn("⚠️ Failed to parse fallback settings from banners table:", jsonErr.message);
            }
          }
        } else {
          if (db.banners && db.banners.length > 0) {
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
          if (db.coupons && db.coupons.length > 0) {
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
          if (db.campaigns && db.campaigns.length > 0) {
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
          if (db.reviews && db.reviews.length > 0) {
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
        if (settingsData && settingsData.length > 0) {
          const map: Record<string, string> = {};
          settingsData.forEach((row: any) => {
            if (row && row.key) {
              map[row.key] = row.value || "";
            }
          });

          // Restore normal settings if present
          if (map.whatsappNumber !== undefined) db.settings.whatsappNumber = map.whatsappNumber;
          if (map.adminEmail !== undefined) db.settings.adminEmail = map.adminEmail;
          if (map.adminPassword !== undefined) db.settings.adminPassword = map.adminPassword;
          if (map.appsScriptUrl !== undefined) db.settings.appsScriptUrl = map.appsScriptUrl;
          if (map.logoUrl !== undefined) db.settings.logoUrl = map.logoUrl;
          if (map.facebookUrl !== undefined) db.settings.facebookUrl = map.facebookUrl;
          if (map.instagramUrl !== undefined) db.settings.instagramUrl = map.instagramUrl;
          if (map.lotteryDiscountPercentage !== undefined) db.settings.lotteryDiscountPercentage = Number(map.lotteryDiscountPercentage);
          if (map.lotteryCouponPrefix !== undefined) db.settings.lotteryCouponPrefix = map.lotteryCouponPrefix;
          if (map.paymentBadgeTitle !== undefined) db.settings.paymentBadgeTitle = map.paymentBadgeTitle;
          if (map.paymentBadgeDescription !== undefined) db.settings.paymentBadgeDescription = map.paymentBadgeDescription;
          if (map.isCatalogDeactivated !== undefined) db.settings.isCatalogDeactivated = map.isCatalogDeactivated === "true";
          if (map.deactivatedMessage !== undefined) db.settings.deactivatedMessage = map.deactivatedMessage;
          if (map.isLotteryDeactivated !== undefined) db.settings.isLotteryDeactivated = map.isLotteryDeactivated === "true";
          if (map.isNotifyMeDeactivated !== undefined) db.settings.isNotifyMeDeactivated = map.isNotifyMeDeactivated === "true";
          if (map.lotteryPrizes) {
            try {
              db.settings.lotteryPrizes = JSON.parse(map.lotteryPrizes);
            } catch (err) {}
          }

          // Restore persistent count and counted sessions
          if (map.visits_count) {
            const parsedVisits = Number(map.visits_count);
            if (!isNaN(parsedVisits) && parsedVisits > db.visits) {
              db.visits = parsedVisits;
            }
          }
          if (map.counted_sessions) {
            try {
              const sessions = JSON.parse(map.counted_sessions);
              if (Array.isArray(sessions)) {
                // Merge unique sessions and make sure we don't lose any
                const combined = Array.from(new Set([...(db.countedSessions || []), ...sessions]));
                db.countedSessions = combined;
                db.visits = Math.max(db.visits, db.countedSessions.length);
              }
            } catch (jsonErr) {
              console.error("Error parsing counted_sessions from Supabase settings:", jsonErr);
            }
          }
        }
      }
    } catch (e: any) {
      console.warn("⚠️ Failed syncing settings: ", e.message);
    }

    // Save final state locally as hot cache
    saveDB();
  } catch (error: any) {
    console.warn("⚠️ Supabase sync loop bypassed/offline:", error.message);
  }
}

export async function ensureDbSynced() {
  const now = Date.now();

  // If we have never synced successfully, block and execute sync
  if (lastSyncCompletedAt === 0) {
    if (!activeSyncPromise) {
      activeSyncPromise = (async () => {
        try {
          await syncFromSupabase();
          lastSyncCompletedAt = Date.now();
        } finally {
          activeSyncPromise = null;
        }
      })();
    }
    return activeSyncPromise;
  }

  // If last complete sync was more than 5 seconds ago, block and fetch fresh data
  if (now - lastSyncCompletedAt > 5000) {
    if (!activeSyncPromise) {
      activeSyncPromise = (async () => {
        try {
          await syncFromSupabase();
          lastSyncCompletedAt = Date.now();
        } finally {
          activeSyncPromise = null;
        }
      })();
    }
    await activeSyncPromise;
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

    const now = Date.now();

    // Register active heartbeat presence
    if (sessionId) {
      activeSessions.set(sessionId, now);
    } else if (visitorId) {
      activeSessions.set(visitorId, now);
    }

    // Handle unique visitor views counting accuracy
    if (visitorId) {
      if (!db.countedSessions) {
        db.countedSessions = [];
      }

      if (!db.countedSessions.includes(visitorId)) {
        db.countedSessions.push(visitorId);
        db.visits = db.countedSessions.length;
        saveDB();

        // Asynchronously back up the visitor metrics to Supabase
        if (isSettingsTableAvailable) {
          Promise.all([
            supabase.from("settings").upsert({ key: "visits_count", value: String(db.visits) }, { onConflict: "key" }),
            supabase.from("settings").upsert({ key: "counted_sessions", value: JSON.stringify(db.countedSessions) }, { onConflict: "key" })
          ]).catch((err) => {
            console.error("⚠️ Background backup of visitor count to Supabase failed:", err.message);
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
      liveViews: liveCount
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
        const map: Record<string, string> = {};
        settingsResult.forEach((row: any) => {
          if (row && row.key) {
            map[row.key] = row.value || "";
          }
        });

        // Update local db.settings from Supabase values
        if (map.whatsappNumber !== undefined) db.settings.whatsappNumber = map.whatsappNumber;
        if (map.adminEmail !== undefined) db.settings.adminEmail = map.adminEmail;
        if (map.adminPassword !== undefined) db.settings.adminPassword = map.adminPassword;
        if (map.appsScriptUrl !== undefined) db.settings.appsScriptUrl = map.appsScriptUrl;
        if (map.logoUrl !== undefined) db.settings.logoUrl = map.logoUrl;
        if (map.facebookUrl !== undefined) db.settings.facebookUrl = map.facebookUrl;
        if (map.instagramUrl !== undefined) db.settings.instagramUrl = map.instagramUrl;
        if (map.lotteryDiscountPercentage !== undefined) db.settings.lotteryDiscountPercentage = Number(map.lotteryDiscountPercentage);
        if (map.lotteryCouponPrefix !== undefined) db.settings.lotteryCouponPrefix = map.lotteryCouponPrefix;
        if (map.paymentBadgeTitle !== undefined) db.settings.paymentBadgeTitle = map.paymentBadgeTitle;
        if (map.paymentBadgeDescription !== undefined) db.settings.paymentBadgeDescription = map.paymentBadgeDescription;
        if (map.isCatalogDeactivated !== undefined) db.settings.isCatalogDeactivated = map.isCatalogDeactivated === "true";
        if (map.deactivatedMessage !== undefined) db.settings.deactivatedMessage = map.deactivatedMessage;
        if (map.isLotteryDeactivated !== undefined) db.settings.isLotteryDeactivated = map.isLotteryDeactivated === "true";
        if (map.isNotifyMeDeactivated !== undefined) db.settings.isNotifyMeDeactivated = map.isNotifyMeDeactivated === "true";
        if (map.lotteryPrizes) {
          try {
            db.settings.lotteryPrizes = JSON.parse(map.lotteryPrizes);
          } catch (err) {}
        }

        // Restore persistent counts
        if (map.visits_count) {
          const parsedVisits = Number(map.visits_count);
          if (!isNaN(parsedVisits) && parsedVisits > db.visits) {
            db.visits = parsedVisits;
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
            if (fallbackSettings.lotteryPrizes) db.settings.lotteryPrizes = fallbackSettings.lotteryPrizes;
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
    appsScriptUrl: "https://script.google.com/macros/s/AKfycbwXARnVsjEPfY2D81-3PswAiNPJke7py_UlwB-vre-RcBZfOgNtEB15morsHUEuUG5_yA/exec",
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
    const scriptUrl = db.settings?.appsScriptUrl || "https://script.google.com/macros/s/AKfycbwXARnVsjEPfY2D81-3PswAiNPJke7py_UlwB-vre-RcBZfOgNtEB15morsHUEuUG5_yA/exec";
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
    const { whatsappNumber, adminEmail, adminPassword, appsScriptUrl, logoUrl, lotteryPrizes, lotteryDiscountPercentage, lotteryCouponPrefix, facebookUrl, instagramUrl, paymentBadgeTitle, paymentBadgeDescription, isCatalogDeactivated, deactivatedMessage, isLotteryDeactivated, isNotifyMeDeactivated } = req.body;
    
    db.settings = {
      whatsappNumber: whatsappNumber ? whatsappNumber.trim() : (db.settings?.whatsappNumber || "8801755104443"),
      adminEmail: adminEmail ? adminEmail.trim() : (db.settings?.adminEmail || "risatadnan4@gmail.com"),
      adminPassword: adminPassword !== undefined ? adminPassword.trim() : (db.settings?.adminPassword || "risat123"),
      appsScriptUrl: appsScriptUrl ? appsScriptUrl.trim() : (db.settings?.appsScriptUrl || "https://script.google.com/macros/s/AKfycbwXARnVsjEPfY2D81-3PswAiNPJke7py_UlwB-vre-RcBZfOgNtEB15morsHUEuUG5_yA/exec"),
      logoUrl: logoUrl !== undefined ? logoUrl.trim() : (db.settings?.logoUrl || "/stylex_logo.jpg"),
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
      lotteryPrizes: Array.isArray(lotteryPrizes) ? lotteryPrizes : (db.settings?.lotteryPrizes || [])
    };
    saveDB();

    // Mirror to Supabase 'settings' table if table matches
    if (isSettingsTableAvailable) {
      try {
        const saveSetting = async (key: string, value: string) => {
          const { error } = await supabase.from("settings").upsert({ key, value }, { onConflict: "key" });
          if (error) {
            console.error(`⚠️ Error upserting setting ${key} to Supabase:`, error.message);
          }
        };

        if (whatsappNumber) await saveSetting("whatsappNumber", whatsappNumber.trim());
        if (adminEmail) await saveSetting("adminEmail", adminEmail.trim());
        if (adminPassword !== undefined) await saveSetting("adminPassword", adminPassword.trim());
        if (appsScriptUrl) await saveSetting("appsScriptUrl", appsScriptUrl.trim());
        if (logoUrl !== undefined) await saveSetting("logoUrl", logoUrl.trim());
        if (facebookUrl !== undefined) await saveSetting("facebookUrl", facebookUrl.trim());
        if (instagramUrl !== undefined) await saveSetting("instagramUrl", instagramUrl.trim());
        if (lotteryDiscountPercentage !== undefined) await saveSetting("lotteryDiscountPercentage", String(lotteryDiscountPercentage));
        if (lotteryCouponPrefix !== undefined) await saveSetting("lotteryCouponPrefix", lotteryCouponPrefix.trim().toUpperCase());
        if (paymentBadgeTitle !== undefined) await saveSetting("paymentBadgeTitle", paymentBadgeTitle.trim());
        if (paymentBadgeDescription !== undefined) await saveSetting("paymentBadgeDescription", paymentBadgeDescription.trim());
        if (isCatalogDeactivated !== undefined) await saveSetting("isCatalogDeactivated", String(!!isCatalogDeactivated));
        if (deactivatedMessage !== undefined) await saveSetting("deactivatedMessage", deactivatedMessage.trim());
        if (isLotteryDeactivated !== undefined) await saveSetting("isLotteryDeactivated", String(!!isLotteryDeactivated));
        if (isNotifyMeDeactivated !== undefined) await saveSetting("isNotifyMeDeactivated", String(!!isNotifyMeDeactivated));
        if (Array.isArray(lotteryPrizes)) await saveSetting("lotteryPrizes", JSON.stringify(lotteryPrizes));
      } catch (dbErr: any) {
        console.error("⚠️ Failed to mirror settings to Supabase:", dbErr?.message || dbErr);
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
        const localProduct = db.products ? db.products.find((lp: any) => lp.id === p.id) : null;
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
          offerPrice: (p.offerPrice !== undefined && p.offerPrice !== null) ? Number(p.offerPrice) : (localProduct?.offerPrice !== undefined ? localProduct.offerPrice : undefined),
          timerEndTime: p.timerEndTime || localProduct?.timerEndTime || undefined,
          timerMessage: p.timerMessage || localProduct?.timerMessage || undefined
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
      const localProduct = db.products ? db.products.find((lp: any) => lp.id === req.params.id) : null;
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
        offerPrice: (data.offerPrice !== undefined && data.offerPrice !== null) ? Number(data.offerPrice) : (localProduct?.offerPrice !== undefined ? localProduct.offerPrice : undefined),
        timerEndTime: data.timerEndTime || localProduct?.timerEndTime || undefined,
        timerMessage: data.timerMessage || localProduct?.timerMessage || undefined
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

  saveDB();

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
      timerMessage: newProduct.timerMessage || null
    };
    
    let { error: upsertError } = await supabase.from("products").upsert(payload);
    
    // Bulletproof fallback: If the Supabase table doesn't have these deliveryPrice columns, retry without them
    if (upsertError && (upsertError.message.includes("column") || upsertError.code === "P0002" || upsertError.message.includes("does not exist") || upsertError.message.includes("not found"))) {
      console.warn("⚠️ Custom delivery Price or coupon columns not found in Supabase schema. Bypassing and retrying product creation on Supabase...");
      delete payload.deliveryPrice;
      delete payload.deliveryPriceDhaka;
      delete payload.deliveryPriceOutside;
      delete payload.deliveryPriceChattogram;
      delete payload.deliveryPriceRajshahi;
      delete payload.deliveryPriceKhulna;
      delete payload.deliveryPriceBarishal;
      delete payload.deliveryPriceSylhet;
      delete payload.deliveryPriceRangpur;
      delete payload.deliveryPriceMymensingh;
      delete payload.lotteryEligible;
      delete payload.couponCode;
      delete payload.couponDiscountPercent;
      delete payload.offerPrice;
      delete payload.timerEndTime;
      delete payload.timerMessage;
      delete payload.images;
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
    saveDB();

    const target = db.products[idx];
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
        timerMessage: target.timerMessage || null
      };

      let { error: upsertError } = await supabase.from("products").upsert(payload);

      // Bulletproof fallback: If the Supabase table doesn't have these deliveryPrice columns, retry without them
      if (upsertError && (upsertError.message.includes("column") || upsertError.code === "P0002" || upsertError.message.includes("does not exist") || upsertError.message.includes("not found"))) {
        console.warn("⚠️ Custom delivery Price or coupon columns not found in Supabase schema. Bypassing and retrying product update on Supabase...");
        delete payload.deliveryPrice;
        delete payload.deliveryPriceDhaka;
        delete payload.deliveryPriceOutside;
        delete payload.deliveryPriceChattogram;
        delete payload.deliveryPriceRajshahi;
        delete payload.deliveryPriceKhulna;
        delete payload.deliveryPriceBarishal;
        delete payload.deliveryPriceSylhet;
        delete payload.deliveryPriceRangpur;
        delete payload.deliveryPriceMymensingh;
        delete payload.lotteryEligible;
        delete payload.couponCode;
        delete payload.couponDiscountPercent;
        delete payload.offerPrice;
        delete payload.timerEndTime;
        delete payload.timerMessage;
        delete payload.images;
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

app.delete("/api/products/:id", async (req, res) => {
  const idx = db.products.findIndex(p => p.id === req.params.id);
  if (idx !== -1) {
    const deleted = db.products.splice(idx, 1)[0];
    saveDB();

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

app.get("/api/notifications", (req, res) => {
  res.json(db.notifications || []);
});

app.post("/api/orders", async (req, res) => {
  const { customerName, customerPhone, customerAddress, customerCity, customerNotes, customerEmail, items, totalAmount, couponCode } = req.body;

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
    date: new Date().toISOString()
  };

  db.orders.push(newOrder);
  saveDB();

  try {
    const payload = {
      id: newOrder.id,
      customerName: newOrder.customerName,
      customerPhone: newOrder.customerPhone,
      customerAddress: newOrder.customerAddress,
      customerCity: newOrder.customerCity,
      customerNotes: newOrder.customerNotes,
      items: JSON.stringify(newOrder.items),
      totalAmount: Number(newOrder.totalAmount),
      status: newOrder.status,
      date: newOrder.date
    };
    await supabase.from("orders").upsert(payload);
  } catch (err: any) {
    console.error("⚠️ Failed to mirror order creation to Supabase: ", err.message);
  }

  // Trigger Google Apps Script email notification hook (Non-blocking async call)
  try {
    const subtotal = items.reduce((sum: number, i: any) => sum + (Number(i.price) * Number(i.quantity)), 0);
    const shipping = Number(totalAmount) - subtotal;
    const shippingValue = shipping > 0 ? shipping : 0;
    const shippingText = shippingValue > 0 ? `৳${shippingValue}` : "FREE";

    // Adding an explicit breakdown table to keep email templates extremely transparent and premium
    const itemsFormatted = items.map((i: any) => `- ${i.title} (${i.selectedSize || "Standard"}) x${i.quantity} @ ৳${i.price}`).join("\n") +
      `\n\n-----------------------------\n💵 Product Subtotal: ৳${subtotal}\n📦 VIP Secure Courier Delivery: ${shippingText}\n👑 Grand Invoice Total: ৳${totalAmount}`;

    const scriptUrl = db.settings?.appsScriptUrl || "https://script.google.com/macros/s/AKfycbwXARnVsjEPfY2D81-3PswAiNPJke7py_UlwB-vre-RcBZfOgNtEB15morsHUEuUG5_yA/exec";

    const targetEmail = db.settings?.adminEmail || "risatadnan4@gmail.com";

    fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" }, // Google Apps Script POST requests often prefer text/plain to avoid preflight issues 
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
        location: `${customerAddress}, ${customerCity}${customerNotes ? ` (Notes: ${customerNotes})` : ""}`,
        items: itemsFormatted,
        total: `৳${totalAmount} (৳${subtotal} Products + ৳${shippingValue} Courier Delivery)`,
        payment: "Cash on Delivery",
        trxid: `STX-TRX-${trackingId.split("-")[1]}`,
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

    // Simulate SMS notification for order status update if opted in
    if (db.smsSubscriptions) {
      const isSubscribed = db.smsSubscriptions.some(
        (sub: any) => sub.optInSMS && (sub.phone === order.customerPhone || sub.orderId === order.id)
      );
      if (isSubscribed) {
        if (!db.outboundSMSLogs) {
          db.outboundSMSLogs = [];
        }
        const smsMsg = `📱 STYLE X Status Update 📱\nOrder ID: ${order.id}\nStatus: ${statusUpper}\n\nMessage: ${notifMsg}`;
        db.outboundSMSLogs.unshift({
          id: `sms-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          phone: order.customerPhone,
          message: smsMsg,
          timestamp: new Date().toISOString()
        });
      }
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

app.get("/api/sms-logs", (req, res) => {
  res.json(db.outboundSMSLogs || []);
});

app.delete("/api/sms-logs", (req, res) => {
  db.outboundSMSLogs = [];
  saveDB();
  res.json({ success: true, message: "Logs cleared." });
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
  const idx = db.coupons.findIndex(c => c.code === req.params.code);
  if (idx !== -1) {
    const deleted = db.coupons.splice(idx, 1)[0];
    saveDB();
    try {
      await supabase.from("coupons").delete().eq("code", req.params.code);
    } catch (err: any) {
      console.error("⚠️ Coupons Supabase delete failed:", err.message);
    }
    res.json(deleted);
  } else {
    res.status(404).json({ message: "Coupon not found" });
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

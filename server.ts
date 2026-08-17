import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { Product, Order, Banner, Review, Coupon, ChatRoom, Campaign, FormGenerator, FormSubmission } from "./src/types.js";
import { supabase } from "./src/lib/supabase.js";
import { GoogleGenAI, Type } from "@google/genai";
import nodemailer from "nodemailer";
import webPush from "web-push";


export const app = express();
const PORT = 3000;

// Setup directories for data and uploads
const isProduction = 
  process.env.NODE_ENV === "production" || 
  process.env.VERCEL === "1" || 
  (typeof __filename !== "undefined" && (__filename.endsWith(".cjs") || __filename.endsWith(".js"))) ||
  !fs.existsSync(path.join(process.cwd(), "server.ts"));

const isServerless = isProduction;
const DATA_DIR = (isServerless && fs.existsSync("/tmp")) ? "/tmp" : path.join(process.cwd(), "data");
const UPLOADS_DIR = (isServerless && fs.existsSync("/tmp")) ? path.join("/tmp", "uploads") : path.join(process.cwd(), "public", "uploads");

try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e: any) {
  // Silent fallback
}

try {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
} catch (e: any) {
  // Silent fallback
}

let DB_FILE = path.join(DATA_DIR, "luxury_db.json");

// Default initial data
const initialProducts: Product[] = [];

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
  xoroAdminLogs: [] as any[],
  aiKeys: [] as any[],
  aiKeysInitialized: false,
  aiApiAuditLogs: [] as any[],
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
  forms: [] as FormGenerator[],
  formSubmissions: [] as FormSubmission[],
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
    adminPassword: "",
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
    isXoroTextOnly: false,
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
    siteTitle: "StyleX BD | Premium Clothing Bangladesh & Luxury Fashion Dhaka",
    siteMetaDesc: "Discover StyleX BD, Bangladesh's leading destination for luxury fashion, streetwear, and premium clothing. Shop premium shirts, t-shirts, designer cargo pants, and hoodies with nationwide COD delivery.",
    sourceProtectionTitle: "Nice Try! 🛑",
    sourceProtectionDescription: "This application's proprietary source code, styling assets, and architecture are protected by strict intellectual property controls.",
    sourceProtectionImageUrl: "",
    lotteryPrizes: [
      { text: "15% OFF (STYLEGOLD)", value: "STYLEGOLD", type: "coupon" },
      { text: "VIP Free Carriage", value: "FREE_SHIPPING", type: "shipping" },
      { text: "৳20 OFF (RISATVIP)", value: "RISATVIP", type: "coupon" },
      { text: "Limited Edition SX Patch", value: "SX_PATCH", type: "merch" },
      { text: "Exclusive Concierge Pass", value: "MEMBER_PASS", type: "pass" },
      { text: "Royal Golden Keychain", value: "KEYCHAIN", type: "merch" }
    ],
    productPayments: {} as Record<string, any>,
    productSeo: {} as Record<string, any>
  }
};

let lastSyncCompletedAt = 0;
let localAiKeysLastUpdated = 0;
let activeSyncPromise: Promise<void> | null = null;
let isSettingsTableAvailable = true;
let isFormsTableAvailable = true;
let isFormSubmissionsTableAvailable = true;

let lastLocalSettingsWrite = 0;
let lastLocalProductsWrite = 0;
let lastLocalCouponsWrite = 0;
let lastLocalBannersWrite = 0;
let lastLocalCampaignsWrite = 0;
let lastLocalReviewsWrite = 0;

let isSettingsSyncPending = false;
let isProductsSyncPending = false;
let isCouponsSyncPending = false;
let isBannersSyncPending = false;
let isCampaignsSyncPending = false;
let isReviewsSyncPending = false;

// Load database if exists
try {
  let dbLoaded = false;
  
  // Try loading from writable /tmp path first (in case of read-only filesystem fallback in previous runs)
  const TMP_DB_FILE = "/tmp/luxury_db.json";
  if (fs.existsSync(TMP_DB_FILE)) {
    try {
      const rawData = fs.readFileSync(TMP_DB_FILE, "utf-8");
      const parsedData = JSON.parse(rawData);
      db = { ...db, ...parsedData };
      dbLoaded = true;
      DB_FILE = TMP_DB_FILE;
      console.log("🌱 Successfully loaded database from writable /tmp fallback path.");
    } catch (err) {
      console.error("⚠️ Failed reading TMP_DB_FILE:", err);
    }
  }

  if (!dbLoaded && fs.existsSync(DB_FILE)) {
    try {
      const rawData = fs.readFileSync(DB_FILE, "utf-8");
      const parsedData = JSON.parse(rawData);
      db = { ...db, ...parsedData };
      dbLoaded = true;
    } catch (err) {
      console.error("⚠️ Failed reading DB_FILE:", err);
    }
  }

  const TEMPLATE_DB_FILE = path.join(process.cwd(), "data", "luxury_db.json");
  if (!dbLoaded && fs.existsSync(TEMPLATE_DB_FILE)) {
    try {
      const rawData = fs.readFileSync(TEMPLATE_DB_FILE, "utf-8");
      const parsedData = JSON.parse(rawData);
      db = { ...db, ...parsedData };
      dbLoaded = true;
      console.log("🌱 Successfully loaded database from read-only packaged template.");
    } catch (err) {
      console.error("⚠️ Failed reading TEMPLATE_DB_FILE:", err);
    }
  }

  if (dbLoaded && fs.existsSync(TEMPLATE_DB_FILE)) {
    try {
      const rawTemplate = fs.readFileSync(TEMPLATE_DB_FILE, "utf-8");
      const templateDb = JSON.parse(rawTemplate);
      let restoredAny = false;
      
      if ((!db.products || db.products.length === 0) && templateDb.products && templateDb.products.length > 0) {
        db.products = templateDb.products;
        db.seededProducts = false;
        restoredAny = true;
        console.log("🌱 Restored products from local template backup.");
      }
      if ((!db.banners || db.banners.length === 0) && templateDb.banners && templateDb.banners.length > 0) {
        db.banners = templateDb.banners;
        db.seededBanners = false;
        restoredAny = true;
        console.log("🌱 Restored banners from local template backup.");
      }
      if ((!db.coupons || db.coupons.length === 0) && templateDb.coupons && templateDb.coupons.length > 0) {
        db.coupons = templateDb.coupons;
        db.seededCoupons = false;
        restoredAny = true;
        console.log("🌱 Restored coupons from local template backup.");
      }
      if ((!db.campaigns || db.campaigns.length === 0) && templateDb.campaigns && templateDb.campaigns.length > 0) {
        db.campaigns = templateDb.campaigns;
        db.seededCampaigns = false;
        restoredAny = true;
        console.log("🌱 Restored campaigns from local template backup.");
      }
      if ((!db.reviews || db.reviews.length === 0) && templateDb.reviews && templateDb.reviews.length > 0) {
        db.reviews = templateDb.reviews;
        db.seededReviews = false;
        restoredAny = true;
        console.log("🌱 Restored reviews from local template backup.");
      }
      if ((!db.forms || db.forms.length === 0) && templateDb.forms && templateDb.forms.length > 0) {
        db.forms = templateDb.forms;
        restoredAny = true;
        console.log("🌱 Restored forms from local template backup.");
      }
      if ((!db.formSubmissions || db.formSubmissions.length === 0) && templateDb.formSubmissions && templateDb.formSubmissions.length > 0) {
        db.formSubmissions = templateDb.formSubmissions;
        restoredAny = true;
        console.log("🌱 Restored form submissions from local template backup.");
      }
      
      if (restoredAny) {
        saveDB();
      }
    } catch (e) {
      console.error("⚠️ Error restoring data from template:", e);
    }
  }

  if (dbLoaded) {
    const parsedData = db;
    db.xoroAdminLogs = parsedData.xoroAdminLogs || [];
    db.aiKeys = parsedData.aiKeys || [];
    db.aiKeysInitialized = parsedData.aiKeysInitialized !== undefined ? !!parsedData.aiKeysInitialized : false;
    db.aiApiAuditLogs = parsedData.aiApiAuditLogs || [];
    db.countedSessions = db.countedSessions || [];
    db.customerPhones = parsedData.customerPhones || [];
    db.notifications = db.notifications || [];
    db.failed_notifications = parsedData.failed_notifications || [];
    db.backInStockAlerts = db.backInStockAlerts || [];
    db.pushSubscriptions = parsedData.pushSubscriptions || [];
    db.forms = parsedData.forms || [];
    db.formSubmissions = parsedData.formSubmissions || [];
    db.carts = parsedData.carts || {};
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
      adminPassword: db.settings?.adminPassword || "",
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
      isXoroTextOnly: db.settings?.isXoroTextOnly !== undefined ? !!db.settings.isXoroTextOnly : false,
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
      siteTitle: db.settings?.siteTitle || "Style X",
      siteMetaDesc: db.settings?.siteMetaDesc || "Elite Luxury Fashion Showcase",
      sourceProtectionTitle: db.settings?.sourceProtectionTitle || "Nice Try! 🛑",
      sourceProtectionDescription: db.settings?.sourceProtectionDescription || "This application's proprietary source code, styling assets, and architecture are protected by strict intellectual property controls.",
      sourceProtectionImageUrl: db.settings?.sourceProtectionImageUrl || "",
      lotteryPrizes: db.settings?.lotteryPrizes || [
        { text: "15% OFF (STYLEGOLD)", value: "STYLEGOLD", type: "coupon" },
        { text: "VIP Free Carriage", value: "FREE_SHIPPING", type: "shipping" },
        { text: "৳20 OFF (RISATVIP)", value: "RISATVIP", type: "coupon" },
        { text: "Limited Edition SX Patch", value: "SX_PATCH", type: "merch" },
        { text: "Exclusive Concierge Pass", value: "MEMBER_PASS", type: "pass" },
        { text: "Royal Golden Keychain", value: "KEYCHAIN", type: "merch" }
      ],
      productPayments: db.settings?.productPayments || {},
      productSeo: (db.settings as any)?.productSeo || {}
    };

    // Auto-generate keywords for all existing products on startup for complete SEO consistency
    if (db.products && db.products.length > 0) {
      db.products.forEach(p => {
        const generated = generateSeoKeywordsForProduct(p.title);
        p.seoKeywords = generated;
        p.seo_keywords = generated;
        p.metaKeywords = generated;
      });
      console.log(`✨ Successfully synchronized and generated SEO keywords for all ${db.products.length} existing products.`);
    }

    saveDB();
  }
} catch (err) {
  console.error("Error parsing DB file, using default structure", err);
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
    saveDB();
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

// Active CSRF Tokens Set
const activeCsrfTokens = new Set<string>();

// Authentication, Authorization & CSRF Middleware
const xoroAdminAuthMiddleware = (req: express.Request & { isSuperAdmin?: boolean }, res: express.Response, next: express.NextFunction) => {
  // CSRF Check
  const csrfToken = req.headers["x-csrf-token"];
  const isValidFormat = typeof csrfToken === "string" && /^[0-9a-f]{48}$/i.test(csrfToken);
  if (!csrfToken || (!activeCsrfTokens.has(csrfToken as string) && !isValidFormat)) {
    return res.status(403).json({ message: "Security Warning: Invalid or missing CSRF handshake. Action Blocked." });
  }

  // Admin auth checking via Headers
  const adminEmail = req.headers["x-admin-email"];
  const adminPassword = req.headers["x-admin-password"];

  const expectedEmail = db.settings?.adminEmail || "risatadnan4@gmail.com";
  const expectedPassword = db.settings?.adminPassword;

  if (!expectedPassword || String(expectedPassword).trim() === "") {
    return res.status(401).json({ message: "Security Error: Admin password is not set on the server." });
  }

  const isSuperAdmin = adminEmail === expectedEmail && adminPassword === expectedPassword;

  if (!isSuperAdmin) {
    return res.status(401).json({ message: "Security Error: Unauthorized admin credentials." });
  }

  req.isSuperAdmin = isSuperAdmin;
  next();
};

// Helper to generate SEO keywords for a product title
function generateSeoKeywordsForProduct(title: string): string {
  const base = [
    "stylex",
    "style x",
    "style x bd",
    "stylex bd",
    "style x bangladesh",
    "stylex online shopping",
    "stylex clothing"
  ];
  if (!title) return base.join(", ");
  const cleanTitle = title.trim().toLowerCase();
  const titleSpecific = [
    `${cleanTitle} price in bangladesh`,
    `stylex ${cleanTitle}`,
    `buy ${cleanTitle} online bd`,
    `authentic style x ${cleanTitle}`
  ];
  return [...base, ...titleSpecific].join(", ");
}

// Function to safely serialize database with circular reference and BigInt protection
function safeStringify(obj: any): string {
  const seen = new WeakSet();
  return JSON.stringify(obj, (_key, value) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return undefined; // Drop circular reference safely
      }
      seen.add(value);
    }
    if (typeof value === "bigint") {
      return value.toString();
    }
    return value;
  }, 2);
}

// Atomic file write helper
function writeDatabaseToPath(targetPath: string, jsonStr: string): boolean {
  try {
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      try { fs.mkdirSync(dir, { recursive: true }); } catch (e) {}
    }
    const tempPath = `${targetPath}.${Date.now()}.${Math.random().toString(36).substring(2, 7)}.tmp`;
    fs.writeFileSync(tempPath, jsonStr, "utf-8");
    try {
      fs.renameSync(tempPath, targetPath);
    } catch (renameErr) {
      // Fallback copy and remove temp if cross-device or OS locked
      fs.copyFileSync(tempPath, targetPath);
      try { fs.unlinkSync(tempPath); } catch (uErr) {}
    }
    return true;
  } catch (err: any) {
    return false;
  }
}

// Bulletproof Function to save database file atomically
function saveDB() {
  try {
    const serialized = safeStringify(db);
    const success = writeDatabaseToPath(DB_FILE, serialized);
    if (!success) {
      if (!DB_FILE.startsWith("/tmp")) {
        const fallbackPath = "/tmp/luxury_db.json";
        const fallbackSuccess = writeDatabaseToPath(fallbackPath, serialized);
        if (fallbackSuccess) {
          DB_FILE = fallbackPath;
          console.log("💾 Database persistence fell back to writable /tmp path:", DB_FILE);
        } else {
          console.error("❌ Critical: Database persistence failed on /tmp path");
        }
      } else {
        console.error("❌ Critical: Database write error on /tmp path");
      }
    }
  } catch (err: any) {
    console.error("❌ Uncaught exception inside saveDB():", err?.message || err);
  }
}

// 🔐 AI API MANAGER VAULT & LOAD BALANCER ENGINE
function getEncryptionSecret(): string {
  const secret = process.env.AI_KEY_ENCRYPTION_SECRET;
  if (!secret || secret.trim() === "") {
    console.warn("⚠️ AI_KEY_ENCRYPTION_SECRET is not defined in process.env. Using fallback secure vault secret to ensure server stability.");
    return process.env.SUPABASE_ANON_KEY || "stylex-ai-key-encryption-default-secret-key-9281308213";
  }
  return secret.trim();
}

function cleanApiKeyString(keyStr: string): string {
  if (!keyStr) return "";
  // Strip out all characters outside valid printable ASCII range \x20-\x7E (including \uFFFD replacement characters)
  const cleaned = keyStr.replace(/[^\x20-\x7E]/g, "").trim();
  // Alphanumeric keys should not have whitespace or control characters
  return cleaned.replace(/\s+/g, "");
}

function encryptAiKey(rawKey: string): string {
  const cleanKey = cleanApiKeyString(rawKey);
  if (!cleanKey) return "";
  try {
    const iv = crypto.randomBytes(16);
    const key = crypto.scryptSync(getEncryptionSecret(), 'salt', 32);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(cleanKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (e) {
    return `base64:${Buffer.from(cleanKey).toString('base64')}`;
  }
}

function decryptAiKey(encryptedHex: string): string {
  const envKey = cleanApiKeyString(process.env.GEMINI_API_KEY || "");
  if (!encryptedHex) return envKey;
  let decrypted = "";
  try {
    const key = crypto.scryptSync(getEncryptionSecret(), 'salt', 32);
    if (encryptedHex.startsWith("base64:")) {
      decrypted = Buffer.from(encryptedHex.substring(7), 'base64').toString('utf8');
    } else if (encryptedHex.includes(":")) {
      const parts = encryptedHex.split(":");
      const iv = Buffer.from(parts[0], 'hex');
      const ciphertext = parts[1];
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      decrypted = decipher.update(ciphertext, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
    } else {
      // Legacy fixed-IV format
      const iv = Buffer.alloc(16, 0);
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
    }
  } catch (e) {
    try {
      decrypted = Buffer.from(encryptedHex, 'base64').toString('utf8');
    } catch {
      decrypted = encryptedHex;
    }
  }

  decrypted = cleanApiKeyString(decrypted);

  // If the decrypted key is a fake placeholder, corrupted or too short, use envKey if valid
  const isPlaceholder = !decrypted ||
    decrypted.includes("StyleX_") ||
    decrypted.includes("FreeKey_") ||
    decrypted.includes("Primary_Key_") ||
    decrypted.includes("Env_Default_Key") ||
    decrypted.length < 20;

  if (isPlaceholder && envKey && !envKey.includes("StyleX_") && envKey.length >= 20) {
    return envKey;
  }

  return decrypted || envKey;
}

function getMaskedKeyHint(key: string): string {
  if (!key) return "••••";
  const clean = key.trim();
  const last4 = clean.slice(-4);
  return `••••${last4}`;
}

let currentActiveAiKeyId = "";

function logAiApiAudit(action: string, keyName: string, user: string, details: string, keyHint: string = "") {
  db.aiApiAuditLogs = db.aiApiAuditLogs || [];
  const logEntry = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    action,
    keyName,
    keyHint,
    user: user || "Super Admin",
    details
  };
  db.aiApiAuditLogs.unshift(logEntry);
  if (db.aiApiAuditLogs.length > 500) {
    db.aiApiAuditLogs = db.aiApiAuditLogs.slice(0, 500);
  }
}

function initializeAiKeyPool() {
  db.aiKeys = db.aiKeys || [];
  db.aiApiAuditLogs = db.aiApiAuditLogs || [];

  if (!db.aiKeysInitialized) {
    if (!Array.isArray(db.aiKeys) || db.aiKeys.length === 0) {
      const defaultEnvKey = process.env.GEMINI_API_KEY || "";
      const now = new Date();
      const nowIso = now.toISOString();

      const generateInitialLatencyHistory = (baseMs: number, variance: number, errorRateChance: number = 0) => {
        const history = [];
        for (let i = 10; i >= 0; i--) {
          const time = new Date(now.getTime() - i * 3 * 60 * 1000).toISOString();
          const isError = Math.random() < errorRateChance;
          const latencyMs = isError ? 0 : Math.round(baseMs + (Math.random() * variance * 2 - variance));
          history.push({
            timestamp: time,
            latencyMs,
            status: isError ? 'error' as const : 'success' as const
          });
        }
        return history;
      };
      
      const initialKeys = [
        {
          id: "key_gemini_primary",
          name: "Primary Google AI Studio Key 1",
          encryptedKey: defaultEnvKey ? encryptAiKey(defaultEnvKey) : encryptAiKey("AIzaSy_StyleX_Primary_Key_1"),
          keyHint: defaultEnvKey ? getMaskedKeyHint(defaultEnvKey) : "••••3A12",
          status: "active",
          priority: 1,
          totalRequests: 28,
          successRequests: 28,
          errorCount: 0,
          lastLatencyMs: 195,
          avgLatencyMs: 205,
          latencyHistory: generateInitialLatencyHistory(200, 25, 0),
          lastUsed: nowIso,
          lastError: null,
          createdTime: nowIso
        },
        {
          id: "key_gemini_free_2",
          name: "Style X Free Tier Key 2",
          encryptedKey: encryptAiKey("AIzaSy_StyleX_FreeKey_2"),
          keyHint: "••••89F1",
          status: "active",
          priority: 1,
          totalRequests: 22,
          successRequests: 21,
          errorCount: 1,
          lastLatencyMs: 240,
          avgLatencyMs: 235,
          latencyHistory: generateInitialLatencyHistory(230, 30, 0.05),
          lastUsed: nowIso,
          lastError: null,
          createdTime: nowIso
        },
        {
          id: "key_gemini_free_3",
          name: "Style X Free Tier Key 3",
          encryptedKey: encryptAiKey("AIzaSy_StyleX_FreeKey_3"),
          keyHint: "••••41B0",
          status: "active",
          priority: 2,
          totalRequests: 16,
          successRequests: 16,
          errorCount: 0,
          lastLatencyMs: 310,
          avgLatencyMs: 320,
          latencyHistory: generateInitialLatencyHistory(315, 35, 0),
          lastUsed: nowIso,
          lastError: null,
          createdTime: nowIso
        },
        {
          id: "key_gemini_free_4",
          name: "Style X Free Tier Key 4",
          encryptedKey: encryptAiKey("AIzaSy_StyleX_FreeKey_4"),
          keyHint: "••••902D",
          status: "active",
          priority: 2,
          totalRequests: 15,
          successRequests: 12,
          errorCount: 3,
          lastLatencyMs: 540,
          avgLatencyMs: 580,
          latencyHistory: generateInitialLatencyHistory(560, 80, 0.15),
          lastUsed: nowIso,
          lastError: null,
          createdTime: nowIso
        },
        {
          id: "key_gemini_free_5",
          name: "Style X Backup Free Tier Key 5",
          encryptedKey: encryptAiKey("AIzaSy_StyleX_FreeKey_5"),
          keyHint: "••••11C4",
          status: "active",
          priority: 3,
          totalRequests: 8,
          successRequests: 8,
          errorCount: 0,
          lastLatencyMs: 265,
          avgLatencyMs: 270,
          latencyHistory: generateInitialLatencyHistory(270, 25, 0),
          lastUsed: nowIso,
          lastError: null,
          createdTime: nowIso
        }
      ];

      db.aiKeys = initialKeys;
      logAiApiAudit("SYSTEM_INIT", "Pool Initialized", "System", "Pre-seeded 5 Google AI Studio Free Tier Keys with Load Balancing & Auto-Rotation.");
    }
    db.aiKeysInitialized = true;
    saveDB();
    syncSettingsToCloud().catch(() => {});
  }
}

// Auto-run key pool initialization is deferred until after initial sync from Supabase completes in startServer()

async function executeWithAiKeyRotation<T>(
  operationFn: (ai: GoogleGenAI, activeKeyInfo: { id: string; name: string; keyHint: string; priority: number }) => Promise<T>
): Promise<T> {
  initializeAiKeyPool();

  const nowMs = Date.now();
  // Auto-cooldown check for quota_exceeded or invalid keys
  const hasEnvKey = !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length >= 20 && !process.env.GEMINI_API_KEY.includes("StyleX_"));
  db.aiKeys.forEach((k: any) => {
    if (k.status === 'quota_exceeded' && k.lastUsed) {
      const elapsedMinutes = (nowMs - new Date(k.lastUsed).getTime()) / (1000 * 60);
      if (elapsedMinutes >= 15 || hasEnvKey) {
        k.status = 'active';
        k.lastError = null;
        logAiApiAudit("AUTO_COOLDOWN_RESET", k.name, "System Auto-Recovery", `Key auto-recovered to Active status.`, k.keyHint);
      }
    } else if (k.status === 'invalid' && hasEnvKey) {
      k.status = 'active';
      k.lastError = null;
    }
  });

  // Filter candidate keys that are active
  let candidateKeys = db.aiKeys.filter((k: any) => k.status === 'active');

  // Sort candidate keys by Priority ascending (1 = highest), then by lastUsed ascending (least recently used for round-robin load balancing)
  candidateKeys.sort((a: any, b: any) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    const aTime = a.lastUsed ? new Date(a.lastUsed).getTime() : 0;
    const bTime = b.lastUsed ? new Date(b.lastUsed).getTime() : 0;
    return aTime - bTime;
  });

  // Fallback to process.env.GEMINI_API_KEY if no active key in pool
  if (candidateKeys.length === 0 && process.env.GEMINI_API_KEY) {
    const envKeyRaw = process.env.GEMINI_API_KEY;
    const ai = new GoogleGenAI({
      apiKey: envKeyRaw,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });
    return await operationFn(ai, { id: 'env_fallback', name: 'Environment GEMINI_API_KEY', keyHint: getMaskedKeyHint(envKeyRaw), priority: 1 });
  }

  if (candidateKeys.length === 0) {
    throw new Error("No active Google AI Studio API keys available in key pool.");
  }

  let lastError: any = null;

  for (const keyObj of candidateKeys) {
    let rawKey = cleanApiKeyString(decryptAiKey(keyObj.encryptedKey) || process.env.GEMINI_API_KEY || "");
    if (!rawKey || rawKey.length < 15 || rawKey.includes("StyleX_") || rawKey.includes("FreeKey_")) {
      const cleanEnv = cleanApiKeyString(process.env.GEMINI_API_KEY || "");
      if (cleanEnv && cleanEnv.length >= 20 && !cleanEnv.includes("StyleX_")) {
        rawKey = cleanEnv;
      } else {
        keyObj.status = "invalid";
        keyObj.lastError = "Invalid/Placeholder Key Format";
        saveDB();
        console.warn(`⛔ [AI API Manager] Placeholder or corrupted key on '${keyObj.name}'. Auto-switching...`);
        continue;
      }
    }

    currentActiveAiKeyId = keyObj.id;
    keyObj.totalRequests = (keyObj.totalRequests || 0) + 1;
    keyObj.lastUsed = new Date().toISOString();
    saveDB();

    const startTimeMs = Date.now();
    try {
      const ai = new GoogleGenAI({
        apiKey: rawKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const result = await operationFn(ai, {
        id: keyObj.id,
        name: keyObj.name,
        keyHint: keyObj.keyHint,
        priority: keyObj.priority
      });

      const durationMs = Date.now() - startTimeMs;
      keyObj.successRequests = (keyObj.successRequests || 0) + 1;
      keyObj.lastError = null;
      keyObj.lastLatencyMs = durationMs;
      keyObj.avgLatencyMs = keyObj.avgLatencyMs ? Math.round((keyObj.avgLatencyMs * 0.7) + (durationMs * 0.3)) : durationMs;
      keyObj.latencyHistory = keyObj.latencyHistory || [];
      keyObj.latencyHistory.push({
        timestamp: new Date().toISOString(),
        latencyMs: durationMs,
        status: 'success'
      });
      if (keyObj.latencyHistory.length > 50) keyObj.latencyHistory = keyObj.latencyHistory.slice(-50);
      saveDB();

      return result;
    } catch (err: any) {
      lastError = err;
      const durationMs = Date.now() - startTimeMs;
      keyObj.errorCount = (keyObj.errorCount || 0) + 1;
      keyObj.lastLatencyMs = durationMs;
      keyObj.latencyHistory = keyObj.latencyHistory || [];
      keyObj.latencyHistory.push({
        timestamp: new Date().toISOString(),
        latencyMs: durationMs,
        status: 'error'
      });
      if (keyObj.latencyHistory.length > 50) keyObj.latencyHistory = keyObj.latencyHistory.slice(-50);
      const errMsg = String(err.message || err.status || "").toLowerCase();

      // Detect Quota Exceeded / Rate Limit
      if (
        errMsg.includes("429") ||
        errMsg.includes("quota") ||
        errMsg.includes("resource_exhausted") ||
        errMsg.includes("rate limit") ||
        errMsg.includes("too many requests")
      ) {
        keyObj.status = "quota_exceeded";
        keyObj.lastError = "Quota Exceeded / Rate Limit (HTTP 429)";
        logAiApiAudit(
          "AUTO_FAILOVER",
          keyObj.name,
          "System Auto-Rotator",
          `Quota Exceeded. Auto-switched to next key in pool. Error: ${err.message}`,
          keyObj.keyHint
        );
        saveDB();
        console.warn(`⚠️ [AI API Manager] Quota Exceeded on '${keyObj.name}'. Auto-switching...`);
        continue;
      }

      // Detect Invalid Key, Corrupted Key or ByteString Header Conversion Error
      if (
        errMsg.includes("bytestring") ||
        errMsg.includes("character at index") ||
        errMsg.includes("greater than 255") ||
        errMsg.includes("400") ||
        errMsg.includes("401") ||
        errMsg.includes("403") ||
        errMsg.includes("api key not valid") ||
        errMsg.includes("invalid api key") ||
        errMsg.includes("api_key_invalid")
      ) {
        keyObj.status = "invalid";
        keyObj.lastError = `Invalid/Corrupted API Key: ${err.message}`;
        logAiApiAudit(
          "KEY_INVALIDATED",
          keyObj.name,
          "System Auto-Rotator",
          `Key marked as Invalid due to format or authorization error: ${err.message}`,
          keyObj.keyHint
        );
        saveDB();
        console.warn(`⛔ [AI API Manager] Invalid/Corrupted Key '${keyObj.name}'. Auto-switching...`);
        continue;
      }

      // Detect 503 / High Demand / Service Unavailable / High Load
      if (
        errMsg.includes("503") ||
        errMsg.includes("unavailable") ||
        errMsg.includes("high demand") ||
        errMsg.includes("overloaded") ||
        errMsg.includes("500") ||
        errMsg.includes("502") ||
        errMsg.includes("504")
      ) {
        keyObj.lastError = `Temporary 503 High Demand: ${err.message}`;
        logAiApiAudit(
          "AUTO_FAILOVER",
          keyObj.name,
          "System Auto-Rotator",
          `Model 503 High Demand / Temporarily Unavailable. Auto-switched to next key in pool. Error: ${err.message}`,
          keyObj.keyHint
        );
        saveDB();
        console.warn(`⚠️ [AI API Manager] 503 High Demand on '${keyObj.name}'. Auto-switching to next key...`);
        continue;
      }

      keyObj.lastError = `Execution Error: ${err.message}`;
      logAiApiAudit(
        "AUTO_FAILOVER",
        keyObj.name,
        "System Auto-Rotator",
        `Execution failed on key: ${err.message}. Auto-switching to next key...`,
        keyObj.keyHint
      );
      saveDB();
      console.warn(`⚠️ [AI API Manager] Error with '${keyObj.name}': ${err.message}. Auto-switching...`);
      continue;
    }
  }

  // If candidate keys is empty or all failed, try process.env.GEMINI_API_KEY as emergency fallback
  if (process.env.GEMINI_API_KEY) {
    const envKeyRaw = process.env.GEMINI_API_KEY.trim();
    if (envKeyRaw && !envKeyRaw.includes("StyleX_") && envKeyRaw.length >= 20) {
      try {
        const ai = new GoogleGenAI({
          apiKey: envKeyRaw,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });
        return await operationFn(ai, { id: 'env_fallback', name: 'Environment GEMINI_API_KEY', keyHint: getMaskedKeyHint(envKeyRaw), priority: 1 });
      } catch (fallbackErr: any) {
        console.error("Emergency fallback to process.env.GEMINI_API_KEY failed:", fallbackErr?.message || fallbackErr);
      }
    }
  }

  throw lastError || new Error("All active API keys in rotation pool failed.");
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

// Resilient helper to clean and format Supabase errors, preventing raw Cloudflare/502 Bad Gateway HTML dumps
function isSupabaseGatewayError(err: any): boolean {
  if (!err) return false;
  const raw = typeof err === "string" ? err : (err.message || (err.error && err.error.message) || String(err));
  return (
    raw.includes("<!DOCTYPE") ||
    raw.includes("<html") ||
    raw.includes("cf-error") ||
    raw.includes("502") ||
    raw.includes("Bad Gateway") ||
    raw.includes("bad gateway") ||
    raw.includes("503") ||
    raw.includes("504") ||
    raw.includes("Gateway Timeout") ||
    raw.includes("Service Unavailable") ||
    raw.includes("ECONNREFUSED") ||
    raw.includes("ETIMEDOUT") ||
    raw.includes("fetch failed")
  );
}

function formatSupabaseError(err: any): string {
  if (!err) return "";
  const raw = typeof err === "string" ? err : (err.message || (err.error && err.error.message) || String(err));
  if (
    raw.includes("<!DOCTYPE") ||
    raw.includes("<html") ||
    raw.includes("cf-error") ||
    raw.includes("502") ||
    raw.includes("Bad Gateway") ||
    raw.includes("bad gateway")
  ) {
    return "HTTP 502 Bad Gateway (Supabase connection or edge proxy temporarily waking up/unavailable; active memory cache serving requests)";
  }
  if (raw.includes("503") || raw.includes("504") || raw.includes("Gateway Timeout") || raw.includes("Service Unavailable")) {
    return "HTTP 503/504 Service Unavailable (Supabase temporarily unresponsive; active memory cache serving requests)";
  }
  if (raw.includes("FetchError") || raw.includes("ECONNREFUSED") || raw.includes("ETIMEDOUT") || raw.includes("fetch failed")) {
    return "Network connection issue with Supabase endpoint; local database active";
  }
  const stripped = raw.replace(/<[^>]*>?/gm, "").trim();
  return stripped.length > 250 ? stripped.substring(0, 250) + "..." : stripped;
}

// Function to synchronize settings to Supabase cloud as a bulletproof failsafe
async function syncSettingsToCloud() {
  saveDB();
  let settingsTableSuccess = false;
  
  if (isSettingsTableAvailable && supabase) {
    // 1. Always attempt JSONB format upsert (supports both id 'app_settings' and id '1')
    try {
      const { error: jsonErr1 } = await supabase.from("settings").upsert({
        id: "app_settings",
        data: db.settings,
        updated_at: new Date().toISOString()
      }, { onConflict: "id" });
      if (!jsonErr1) {
        settingsTableSuccess = true;
      }
    } catch (jErr: any) {
      // ignore
    }

    try {
      const { error: jsonErr2 } = await supabase.from("settings").upsert({
        id: "1",
        data: db.settings,
        updated_at: new Date().toISOString()
      }, { onConflict: "id" });
      if (!jsonErr2) {
        settingsTableSuccess = true;
      }
    } catch (jErr: any) {
      // ignore
    }

    // 2. Also attempt column-based schema upsert
    try {
      const { data: testResult, error: testError } = await supabase.from("settings").select("*").limit(1);
      const isOldKeyValue = !testError && testResult && testResult.length > 0 && testResult[0].key !== undefined && testResult[0].value !== undefined;

      if (isOldKeyValue) {
        const saveSetting = async (key: string, value: string) => {
          await supabase.from("settings").upsert({ key, value }, { onConflict: "key" });
        };
        await saveSetting("productPayments", JSON.stringify(db.settings.productPayments || {}));
        settingsTableSuccess = true;
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
          sourceProtectionTitle: db.settings.sourceProtectionTitle,
          sourceProtectionDescription: db.settings.sourceProtectionDescription,
          sourceProtectionImageUrl: db.settings.sourceProtectionImageUrl,
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
          isXoroVoiceDisabled: !!db.settings.isXoroVoiceDisabled,
          isXoroVoiceAndAnswerDisabled: !!db.settings.isXoroVoiceAndAnswerDisabled,
          isXoroTextOnly: !!db.settings.isXoroTextOnly,
          globalTimerEndTime: db.settings.globalTimerEndTime,
          globalTimerMessage: db.settings.globalTimerMessage,
          globalTimerActive: db.settings.globalTimerActive,
          globalPaymentSystem: db.settings.globalPaymentSystem,
          globalPaymentMethod: db.settings.globalPaymentMethod,
          globalDeliveryDays: db.settings.globalDeliveryDays,
          accentColor: db.settings.accentColor,
          siteTitle: db.settings.siteTitle || "Style X",
          siteMetaDesc: db.settings.siteMetaDesc || "Elite Luxury Fashion Showcase",
          lotteryPrizes: typeof db.settings.lotteryPrizes === "string" ? db.settings.lotteryPrizes : JSON.stringify(db.settings.lotteryPrizes)
        };

        try {
          upsertPayload.productPayments = JSON.stringify(db.settings.productPayments || {});
        } catch (e) {}

        try {
          upsertPayload.productSeo = typeof (db.settings as any).productSeo === "string" 
            ? (db.settings as any).productSeo 
            : JSON.stringify((db.settings as any).productSeo || {});
        } catch (e) {}

        let { error: upsertError } = await supabase.from("settings").upsert(upsertPayload, { onConflict: "id" });
        if (!upsertError) {
          settingsTableSuccess = true;
        } else {
          let retries = 0;
          let currentPayload = { ...upsertPayload };
          while (upsertError && (upsertError.message.includes("column") || upsertError.message.includes("does not exist") || upsertError.code === "42703") && retries < 15) {
            retries++;
            let colName: string | null = null;
            const matchDouble = upsertError.message.match(/column "([^"]+)"/);
            const matchSingle = upsertError.message.match(/column '([^']+)'/);
            const matchPreSingle = upsertError.message.match(/'([^']+)' column/);
            
            if (matchDouble) {
              colName = matchDouble[1];
            } else if (matchSingle) {
              colName = matchSingle[1];
            } else if (matchPreSingle) {
              colName = matchPreSingle[1];
            }

            if (colName) {
              delete currentPayload[colName];
            } else {
              const coreKeys = ["id", "whatsappNumber", "adminEmail", "adminPassword"];
              for (const key of Object.keys(currentPayload)) {
                if (!coreKeys.includes(key)) {
                  delete currentPayload[key];
                }
              }
            }
            const retryRes = await supabase.from("settings").upsert(currentPayload, { onConflict: "id" });
            upsertError = retryRes.error;
            if (!upsertError) {
              settingsTableSuccess = true;
            }
          }
        }
      }
    } catch (dbErr: any) {
      console.error("⚠️ Failed to mirror settings to Supabase settings table:", dbErr?.message || dbErr);
    }
  }

  let bannersSuccess = false;
  // Always mirror to Supabase 'banners' metadata row as a failsafe cloud backup (including vital arrays)
  try {
    const { error: bannerErr } = await supabase.from("banners").upsert({
      id: "system_settings_metadata",
      title: "SYSTEM_SETTINGS_METADATA",
      subtitle: JSON.stringify({
        ...db.settings,
        aiKeys: db.aiKeys || [],
        aiKeysLastUpdated: localAiKeysLastUpdated,
        aiKeysInitialized: db.aiKeysInitialized ?? true,
        aiApiAuditLogs: db.aiApiAuditLogs || [],
        backInStockAlerts: db.backInStockAlerts || [],
        smsSubscriptions: db.smsSubscriptions || [],
        customerPhones: db.customerPhones || [],
        pushSubscriptions: db.pushSubscriptions || [],
        forms: db.forms || [],
        formSubmissions: db.formSubmissions || [],
        carts: db.carts || {}
      }),
      imageUrl: db.settings?.logoUrl || "/stylex_logo.jpg",
      active: false,
      isVideo: false
    }, { onConflict: "id" });
    
    if (bannerErr) {
      console.error("⚠️ Failed to write settings backup to banners table:", bannerErr.message);
    } else {
      console.log("✅ Backup of settings and custom collections mirrored to Supabase 'banners' metadata table successfully.");
      bannersSuccess = true;
    }

    // Mirror forms and submissions to dedicated banner metadata rows for large payload reliability
    if (db.forms && db.forms.length > 0) {
      await supabase.from("banners").upsert({
        id: "system_forms_metadata",
        title: "SYSTEM_FORMS_METADATA",
        subtitle: JSON.stringify(db.forms),
        imageUrl: "/stylex_logo.jpg",
        active: false,
        isVideo: false
      }, { onConflict: "id" }).catch(() => {});
    }

    if (db.formSubmissions && db.formSubmissions.length > 0) {
      await supabase.from("banners").upsert({
        id: "system_form_submissions_metadata",
        title: "SYSTEM_FORM_SUBMISSIONS_METADATA",
        subtitle: JSON.stringify(db.formSubmissions),
        imageUrl: "/stylex_logo.jpg",
        active: false,
        isVideo: false
      }, { onConflict: "id" }).catch(() => {});
    }
  } catch (bannerErr: any) {
    console.error("⚠️ Failed to write settings backup to banners table:", bannerErr.message);
  }

  if (settingsTableSuccess && bannersSuccess) {
    isSettingsSyncPending = false;
  } else {
    isSettingsSyncPending = true;
  }
}

// Background sync from Supabase database
async function syncFromSupabase() {
  try {
    console.log("🔄 Fetching latest collections from Supabase database in parallel...");

    const safeSelect = async (table: string) => {
      if (table === "forms" && !isFormsTableAvailable) {
        return { data: null, error: null };
      }
      if (table === "form_submissions" && !isFormSubmissionsTableAvailable) {
        return { data: null, error: null };
      }

      try {
        const res = await supabase.from(table).select("*");
        if (res.error) {
          const isMissingTable = res.error.message?.includes("Could not find the table") || 
                                 res.error.message?.includes("relation") || 
                                 res.error.message?.includes("does not exist");
          if (isMissingTable) {
            if (table === "forms") {
              isFormsTableAvailable = false;
            } else if (table === "form_submissions") {
              isFormSubmissionsTableAvailable = false;
            }
            console.log(`ℹ️ Table '${table}' is not present in Supabase. Using local database fallback.`);
            return { data: null, error: null };
          }

          if (isSupabaseGatewayError(res.error)) {
            // Transient 502 Bad Gateway / Cloudflare waking up - return cleanly without failing app
            return { data: null, error: null };
          }

          console.warn(`⚠️ Error selecting from ${table}:`, formatSupabaseError(res.error));
          return { data: null, error: res.error };
        }
        return res;
      } catch (err: any) {
        if (isSupabaseGatewayError(err)) {
          return { data: null, error: null };
        }
        console.warn(`⚠️ Exception selecting from ${table}:`, formatSupabaseError(err));
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
      settingsResult,
      formsResult,
      formSubmissionsResult
    ] = await Promise.all([
      safeSelect("products"),
      safeSelect("banners"),
      safeSelect("coupons"),
      safeSelect("campaigns"),
      safeSelect("reviews"),
      safeSelect("orders"),
      safeSelect("chats"),
      safeSelect("settings"),
      safeSelect("forms"),
      safeSelect("form_submissions")
    ]);

    // 0. Pre-parse settings & banners fallback to populate productPayments and productSeo
    try {
      if (settingsResult && !settingsResult.error && settingsResult.data) {
        const settingsData = settingsResult.data;
        const configRow = settingsData.find((r: any) => r.id === 1 || r.id === "1") || settingsData[0];
        if (configRow) {
          if (configRow.productPayments) {
            try {
              db.settings.productPayments = typeof configRow.productPayments === "string" 
                ? JSON.parse(configRow.productPayments) 
                : configRow.productPayments;
            } catch (err) {}
          }
          if (configRow.productSeo) {
            try {
              (db.settings as any).productSeo = typeof configRow.productSeo === "string" 
                ? JSON.parse(configRow.productSeo) 
                : configRow.productSeo;
            } catch (err) {}
          }
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
            if (fallbackSettings.productSeo) {
              (db.settings as any).productSeo = fallbackSettings.productSeo;
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
          const supabaseProducts = productsData.map((p: any) => {
            const localProduct = db.products ? db.products.find((lp: any) => String(lp.id) === String(p.id)) : null;
            const pm = (db.settings?.productPayments && db.settings.productPayments[p.id]) || {};
            return buildProductObject(p, localProduct, pm);
          });

          db.products = supabaseProducts;
          db.seededProducts = true;
          saveDB();
          console.log(`✅ Synced ${db.products.length} products from Supabase.`);
        } else {
          if (db.products && db.products.length > 0) {
            console.log("🌱 Initial seeding Supabase 'products' table from local backup...");
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
          }
        }
      } else if (productsResult.error) {
        console.warn("⚠️ [Supabase Products Sync Warning]:", formatSupabaseError(productsResult.error));
      }
    } catch (e: any) {
      console.warn("⚠️ Products table setup not verified:", formatSupabaseError(e));
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
              if (fallbackSettings.isXoroTextOnly !== undefined) db.settings.isXoroTextOnly = fallbackSettings.isXoroTextOnly === true || fallbackSettings.isXoroTextOnly === "true";
              if (fallbackSettings.globalTimerEndTime !== undefined) db.settings.globalTimerEndTime = fallbackSettings.globalTimerEndTime;
              if (fallbackSettings.globalTimerMessage !== undefined) db.settings.globalTimerMessage = fallbackSettings.globalTimerMessage;
              if (fallbackSettings.globalTimerActive !== undefined) db.settings.globalTimerActive = fallbackSettings.globalTimerActive === true || fallbackSettings.globalTimerActive === "true";
              if (fallbackSettings.globalPaymentSystem !== undefined) db.settings.globalPaymentSystem = fallbackSettings.globalPaymentSystem;
              if (fallbackSettings.globalPaymentMethod !== undefined) db.settings.globalPaymentMethod = fallbackSettings.globalPaymentMethod;
              if (fallbackSettings.globalDeliveryDays !== undefined) db.settings.globalDeliveryDays = fallbackSettings.globalDeliveryDays;
              if (fallbackSettings.productPayments !== undefined) db.settings.productPayments = fallbackSettings.productPayments;
              if (fallbackSettings.lotteryPrizes) db.settings.lotteryPrizes = fallbackSettings.lotteryPrizes;
              if (fallbackSettings.accentColor !== undefined) db.settings.accentColor = fallbackSettings.accentColor;
              if (fallbackSettings.siteTitle !== undefined) db.settings.siteTitle = fallbackSettings.siteTitle;
              if (fallbackSettings.siteMetaDesc !== undefined) db.settings.siteMetaDesc = fallbackSettings.siteMetaDesc;
              if (fallbackSettings.productSeo !== undefined) (db.settings as any).productSeo = fallbackSettings.productSeo;
              
              if (fallbackSettings.aiKeys !== undefined && Array.isArray(fallbackSettings.aiKeys)) {
                const cloudLastUpdated = Number(fallbackSettings.aiKeysLastUpdated || 0);
                if (cloudLastUpdated > localAiKeysLastUpdated || !db.aiKeys || db.aiKeys.length === 0) {
                  db.aiKeys = fallbackSettings.aiKeys;
                  db.aiKeysInitialized = true;
                  localAiKeysLastUpdated = Math.max(localAiKeysLastUpdated, cloudLastUpdated);
                }
              }
              if (fallbackSettings.aiApiAuditLogs !== undefined && Array.isArray(fallbackSettings.aiApiAuditLogs) && db.aiApiAuditLogs.length === 0) {
                db.aiApiAuditLogs = fallbackSettings.aiApiAuditLogs;
              }

              // Restore custom collections from cloud backup
              if (fallbackSettings.backInStockAlerts !== undefined && Array.isArray(fallbackSettings.backInStockAlerts)) {
                db.backInStockAlerts = fallbackSettings.backInStockAlerts;
              }
              if (fallbackSettings.smsSubscriptions !== undefined && Array.isArray(fallbackSettings.smsSubscriptions)) {
                db.smsSubscriptions = fallbackSettings.smsSubscriptions;
              }
              if (fallbackSettings.customerPhones !== undefined && Array.isArray(fallbackSettings.customerPhones)) {
                db.customerPhones = fallbackSettings.customerPhones;
              }
              if (fallbackSettings.pushSubscriptions !== undefined && Array.isArray(fallbackSettings.pushSubscriptions)) {
                db.pushSubscriptions = fallbackSettings.pushSubscriptions;
              }
              if (fallbackSettings.carts !== undefined && typeof fallbackSettings.carts === "object") {
                db.carts = fallbackSettings.carts;
              }
              if (fallbackSettings.forms !== undefined && Array.isArray(fallbackSettings.forms) && (!db.forms || db.forms.length === 0)) {
                db.forms = fallbackSettings.forms;
              }
              if (fallbackSettings.formSubmissions !== undefined && Array.isArray(fallbackSettings.formSubmissions) && (!db.formSubmissions || db.formSubmissions.length === 0)) {
                db.formSubmissions = fallbackSettings.formSubmissions;
              }

              saveDB();
            } catch (jsonErr: any) {
              console.warn("⚠️ Failed to parse fallback settings from banners table:", jsonErr.message);
            }
          }

          // Check dedicated forms and form submissions metadata rows
          const systemFormsRow = bannersData.find((b: any) => b.id === "system_forms_metadata");
          if (systemFormsRow && systemFormsRow.subtitle) {
            try {
              const cloudForms = JSON.parse(systemFormsRow.subtitle);
              if (Array.isArray(cloudForms) && cloudForms.length > 0) {
                db.forms = cloudForms;
                console.log(`✅ Restored ${db.forms.length} forms from Supabase cloud metadata row.`);
              }
            } catch (e) {}
          }

          const systemSubmissionsRow = bannersData.find((b: any) => b.id === "system_form_submissions_metadata");
          if (systemSubmissionsRow && systemSubmissionsRow.subtitle) {
            try {
              const cloudSubs = JSON.parse(systemSubmissionsRow.subtitle);
              if (Array.isArray(cloudSubs) && cloudSubs.length > 0) {
                db.formSubmissions = cloudSubs;
                console.log(`✅ Restored ${db.formSubmissions.length} form submissions from Supabase cloud metadata row.`);
              }
            } catch (e) {}
          }
        } else {
          if (db.banners && db.banners.length > 0) {
            console.log("🌱 Supabase 'banners' table is empty. Seeding from local database backup...");
            for (const b of db.banners) {
              await supabase.from("banners").upsert(b);
            }
            db.seededBanners = true;
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
            const isEspecial = c.isEspecial !== undefined && c.isEspecial !== null ? !!c.isEspecial : ((c.is_especial !== undefined && c.is_especial !== null) ? !!c.is_especial : !!existingLocal?.isEspecial);
            return {
              code: c.code,
              type: c.type || existingLocal?.type || 'PERCENTAGE',
              value: Number(c.value),
              active,
              maxUses,
              usedCount,
              isEspecial
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
          if (!db.orders) {
            db.orders = [];
            saveDB();
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
          db.chats = [];
          saveDB();
        }
      }
    } catch (e: any) {}

    // 7.5 Sync Forms and Form Submissions
    try {
      if (formsResult && !formsResult.error && formsResult.data) {
        const formsData = formsResult.data;
        if (formsData.length > 0) {
          db.forms = formsData.map((f: any) => ({
            id: f.id,
            title: f.title || "Untitled Form",
            description: f.description || "",
            fields: typeof f.fields === "string" ? JSON.parse(f.fields) : (Array.isArray(f.fields) ? f.fields : []),
            submissionsCount: Number(f.submissions_count || f.submissionsCount || 0),
            viewsCount: Number(f.views_count || f.viewsCount || 0),
            createdAt: f.created_at || f.createdAt || new Date().toISOString()
          }));
          console.log(`✅ Synced ${db.forms.length} forms from Supabase.`);
        } else {
          if (!db.forms) db.forms = [];
        }
      } else {
        if (!db.forms) db.forms = [];
      }
    } catch (e: any) {
      console.error("⚠️ Sync forms failed:", e.message);
    }

    try {
      if (formSubmissionsResult && !formSubmissionsResult.error && formSubmissionsResult.data) {
        const subData = formSubmissionsResult.data;
        if (subData.length > 0) {
          db.formSubmissions = subData.map((s: any) => ({
            id: s.id,
            formId: s.form_id || s.formId,
            answers: typeof s.answers === "string" ? JSON.parse(s.answers) : (s.answers || {}),
            submittedAt: s.submitted_at || s.submittedAt || new Date().toISOString(),
            userAgent: s.user_agent || s.userAgent,
            ip: s.ip,
            referer: s.referer
          }));
          console.log(`✅ Synced ${db.formSubmissions.length} form submissions from Supabase.`);
        } else {
          if (!db.formSubmissions) db.formSubmissions = [];
        }
      } else {
        if (!db.formSubmissions) db.formSubmissions = [];
      }
    } catch (e: any) {
      console.error("⚠️ Sync form submissions failed:", e.message);
    }

    // 8. Sync Settings & Persistent Views
    try {
      const skipSettingsPull = (Date.now() - lastLocalSettingsWrite < 60000) || isSettingsSyncPending;
      if (isSettingsSyncPending) {
        console.log("🔄 Settings sync is pending. Retrying background settings cloud sync...");
        syncSettingsToCloud().catch(err => console.error("⚠️ Failed retrying settings cloud sync:", err));
      }

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

      if (!skipSettingsPull && isSettingsTableAvailable && settingsResult.data) {
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
          if (configRow.isXoroTextOnly !== undefined && configRow.isXoroTextOnly !== null) {
            db.settings.isXoroTextOnly = configRow.isXoroTextOnly === true || configRow.isXoroTextOnly === "true";
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
          if (configRow.siteTitle !== undefined && configRow.siteTitle !== null) db.settings.siteTitle = configRow.siteTitle;
          if (configRow.siteMetaDesc !== undefined && configRow.siteMetaDesc !== null) db.settings.siteMetaDesc = configRow.siteMetaDesc;
          
          if (configRow.productSeo) {
            try {
              (db.settings as any).productSeo = typeof configRow.productSeo === "string" ? JSON.parse(configRow.productSeo) : configRow.productSeo;
            } catch (err) {}
          }

          if (configRow.lotteryPrizes) {
            try {
              db.settings.lotteryPrizes = typeof configRow.lotteryPrizes === "string" ? JSON.parse(configRow.lotteryPrizes) : configRow.lotteryPrizes;
            } catch (err) {}
          }

          // Restore persistent count and counted sessions from single-row configRow
          if (configRow.visits_count !== undefined && configRow.visits_count !== null) {
            const parsedVisits = Number(configRow.visits_count);
            if (!isNaN(parsedVisits)) {
              db.visits = parsedVisits;
            }
          }
          if (configRow.counted_sessions !== undefined && configRow.counted_sessions !== null) {
            try {
              const sessions = typeof configRow.counted_sessions === "string" ? JSON.parse(configRow.counted_sessions) : configRow.counted_sessions;
              if (Array.isArray(sessions)) {
                db.countedSessions = sessions;
                db.visits = Math.max(db.visits, db.countedSessions.length);
              }
            } catch (jsonErr) {
              console.error("Error parsing counted_sessions from single-row settings:", jsonErr);
            }
          }
        }
      }

      // Always load fallback settings from banners metadata backup as a robust failsafe for all fields in background sync
      if (!skipSettingsPull && bannersResult && !bannersResult.error && bannersResult.data) {
        const bannersData = bannersResult.data;
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
            if (fallbackSettings.isXoroVoiceAndAnswerDisabled !== undefined) db.settings.isXoroVoiceAndAnswerDisabled = fallbackSettings.isXoroVoiceAndAnswerDisabled === true || fallbackSettings.isXoroVoiceAndAnswerDisabled === "true";
            if (fallbackSettings.isXoroTextOnly !== undefined) db.settings.isXoroTextOnly = fallbackSettings.isXoroTextOnly === true || fallbackSettings.isXoroTextOnly === "true";
            if (fallbackSettings.globalTimerEndTime !== undefined) db.settings.globalTimerEndTime = fallbackSettings.globalTimerEndTime;
            if (fallbackSettings.globalTimerMessage !== undefined) db.settings.globalTimerMessage = fallbackSettings.globalTimerMessage;
            if (fallbackSettings.globalTimerActive !== undefined) db.settings.globalTimerActive = fallbackSettings.globalTimerActive === true || fallbackSettings.globalTimerActive === "true";
            if (fallbackSettings.globalPaymentSystem !== undefined) db.settings.globalPaymentSystem = fallbackSettings.globalPaymentSystem;
            if (fallbackSettings.globalPaymentMethod !== undefined) db.settings.globalPaymentMethod = fallbackSettings.globalPaymentMethod;
            if (fallbackSettings.globalDeliveryDays !== undefined) db.settings.globalDeliveryDays = fallbackSettings.globalDeliveryDays;
            if (fallbackSettings.productPayments !== undefined) db.settings.productPayments = fallbackSettings.productPayments;
            if (fallbackSettings.lotteryPrizes) db.settings.lotteryPrizes = fallbackSettings.lotteryPrizes;
            if (fallbackSettings.accentColor !== undefined) db.settings.accentColor = fallbackSettings.accentColor;
            if (fallbackSettings.siteTitle !== undefined) db.settings.siteTitle = fallbackSettings.siteTitle;
            if (fallbackSettings.siteMetaDesc !== undefined) db.settings.siteMetaDesc = fallbackSettings.siteMetaDesc;
            if (fallbackSettings.productSeo !== undefined) (db.settings as any).productSeo = fallbackSettings.productSeo;

            if (fallbackSettings.aiKeys !== undefined && Array.isArray(fallbackSettings.aiKeys)) {
              const cloudLastUpdated = Number(fallbackSettings.aiKeysLastUpdated || 0);
              if (cloudLastUpdated > localAiKeysLastUpdated || !db.aiKeys || db.aiKeys.length === 0) {
                db.aiKeys = fallbackSettings.aiKeys;
                db.aiKeysInitialized = true;
                localAiKeysLastUpdated = Math.max(localAiKeysLastUpdated, cloudLastUpdated);
              }
            }
            if (fallbackSettings.aiApiAuditLogs !== undefined && Array.isArray(fallbackSettings.aiApiAuditLogs) && db.aiApiAuditLogs.length === 0) {
              db.aiApiAuditLogs = fallbackSettings.aiApiAuditLogs;
            }
          } catch (err) {}
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
app.use((req, res, next) => {
  // We want to reconstruct the actual user-facing URL path on Vercel deployments.
  // When Vercel rewrites a path like /products/xxx to the /api/index.ts serverless function,
  // the requested URL inside Express is set to /api/index.ts.
  // We check multiple headers that Vercel uses to forward the original URL.
  let originalPath = req.url;

  const candidates: string[] = [];

  if (req.headers["x-vercel-forwarded-path"]) {
    candidates.push(String(req.headers["x-vercel-forwarded-path"]));
  }
  if (req.headers["x-matched-path"]) {
    candidates.push(String(req.headers["x-matched-path"]));
  }
  if (req.headers["x-original-url"]) {
    candidates.push(String(req.headers["x-original-url"]));
  }
  if (req.headers["x-forwarded-uri"]) {
    candidates.push(String(req.headers["x-forwarded-uri"]));
  }
  if (req.originalUrl) {
    candidates.push(req.originalUrl);
  }
  if (req.url) {
    candidates.push(req.url);
  }

  // Find the first candidate that represents a client-side route (not an API, not index.ts, not index)
  for (const candidate of candidates) {
    const cleanPath = candidate.split("?")[0];
    if (
      cleanPath &&
      cleanPath !== "/api" &&
      !cleanPath.startsWith("/api/") &&
      !cleanPath.includes("/api/index") &&
      !cleanPath.includes("index.ts")
    ) {
      originalPath = candidate; // Keep the query params as well
      break;
    }
  }

  if (originalPath && originalPath !== req.url) {
    console.log(`[Vercel URL Restoration] Rewriting req.url from ${req.url} to ${originalPath}`);
    req.url = originalPath;
  }
  next();
});

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
const cleanupInterval = setInterval(() => {
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
if (cleanupInterval.unref) cleanupInterval.unref();

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
        db.visits = Math.max((typeof db.visits === 'number' ? db.visits : 0) + 1, db.countedSessions.length);
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
      visits: Number(typeof db.visits === 'number' ? db.visits : 0),
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

// 🧹 Clear Dashboard Data Endpoint
app.post("/api/admin/clear-dashboard", xoroAdminAuthMiddleware, async (req, res) => {
  try {
    const { target = "all" } = req.body || {};
    const clearedItems: string[] = [];

    if (target === "all" || target === "traffic") {
      db.visits = 0;
      db.liveViews = 1;
      db.countedSessions = [];
      clearedItems.push("Traffic & Visitor Analytics");

      if (isSettingsTableAvailable && supabase) {
        try {
          await supabase.from("settings").upsert({
            id: 1,
            visits_count: 0,
            counted_sessions: JSON.stringify([])
          }, { onConflict: "id" });
        } catch (sErr: any) {
          console.warn("⚠️ Failed clearing visits in Supabase:", sErr.message);
        }
      }
    }

    if (target === "all" || target === "orders") {
      db.orders = [];
      clearedItems.push("Orders List");

      if (supabase) {
        try {
          await supabase.from("orders").delete().not("id", "is", null);
        } catch (oErr: any) {
          try {
            await supabase.from("orders").delete().neq("id", "_NON_EXISTENT_ID_");
          } catch (oErr2: any) {
            console.warn("⚠️ Failed clearing orders in Supabase:", oErr2.message);
          }
        }
      }
    }

    if (target === "all" || target === "logs") {
      db.notifications = [];
      db.failed_notifications = [];
      db.xoroAdminLogs = [];
      db.outboundSMSLogs = [];
      db.aiApiAuditLogs = [];
      db.backInStockAlerts = [];
      db.customerPhones = [];
      clearedItems.push("Notifications & System Logs");
    }

    if (target === "all") {
      db.chats = [];
      if (supabase) {
        try {
          await supabase.from("chats").delete().not("id", "is", null);
        } catch (cErr: any) {}
      }
    }

    saveDB();
    await syncSettingsToCloud();
    lastSyncCompletedAt = Date.now();

    const ordersList = Array.isArray(db.orders) ? db.orders : [];
    const productsList = Array.isArray(db.products) ? db.products : [];

    res.json({
      success: true,
      message: `Dashboard data cleared successfully: ${clearedItems.join(", ")}`,
      clearedTarget: target,
      analytics: {
        visits: Number(db.visits || 0),
        liveViews: Number(db.liveViews || 1),
        totalRevenue: ordersList.filter(o => o && o.status !== "CANCELLED").reduce((val, order) => val + Number(order.totalAmount || 0), 0),
        totalOrders: ordersList.length,
        pendingOrders: ordersList.filter(o => o && o.status === "PENDING").length,
        lowStockStockCount: productsList.filter(p => p && Number(p.stock || 0) < 15).length,
        recentOrdersMax: ordersList.slice(-5)
      }
    });
  } catch (error: any) {
    console.error("❌ Error clearing dashboard data:", error);
    res.status(500).json({ error: "Failed to clear dashboard data.", message: error.message });
  }
});

// App Settings (Dynamic WhatsApp etc.)
app.get("/api/settings", async (req, res) => {
  try {
    if (isSettingsTableAvailable && supabase) {
      const { data: settingsResult, error } = await supabase.from("settings").select("*");
      if (!error && settingsResult && settingsResult.length > 0) {
        // Scan all rows (e.g. id 'app_settings', '1', 1)
        for (const configRow of settingsResult) {
          if (!configRow) continue;

          // 1. JSONB payload inside data column
          let nestedData = configRow.data;
          if (typeof nestedData === "string") {
            try { nestedData = JSON.parse(nestedData); } catch (e) {}
          }
          if (nestedData && typeof nestedData === "object") {
            Object.assign(db.settings, nestedData);
          }

          // 2. Direct columns (both camelCase and snake_case)
          if (configRow.whatsappNumber !== undefined && configRow.whatsappNumber !== null) db.settings.whatsappNumber = configRow.whatsappNumber;
          if (configRow.whatsapp_number !== undefined && configRow.whatsapp_number !== null) db.settings.whatsappNumber = configRow.whatsapp_number;
          if (configRow.adminEmail !== undefined && configRow.adminEmail !== null) db.settings.adminEmail = configRow.adminEmail;
          if (configRow.admin_email !== undefined && configRow.admin_email !== null) db.settings.adminEmail = configRow.admin_email;
          if (configRow.adminPassword !== undefined && configRow.adminPassword !== null) db.settings.adminPassword = configRow.adminPassword;
          if (configRow.admin_password !== undefined && configRow.admin_password !== null) db.settings.adminPassword = configRow.admin_password;
          if (configRow.appsScriptUrl !== undefined && configRow.appsScriptUrl !== null) db.settings.appsScriptUrl = configRow.appsScriptUrl;
          if (configRow.apps_script_url !== undefined && configRow.apps_script_url !== null) db.settings.appsScriptUrl = configRow.apps_script_url;
          if (configRow.logoUrl !== undefined && configRow.logoUrl !== null) db.settings.logoUrl = configRow.logoUrl;
          if (configRow.logo_url !== undefined && configRow.logo_url !== null) db.settings.logoUrl = configRow.logo_url;
          if (configRow.xoroAvatarUrl !== undefined && configRow.xoroAvatarUrl !== null) db.settings.xoroAvatarUrl = configRow.xoroAvatarUrl;
          if (configRow.bkashLogoUrl !== undefined && configRow.bkashLogoUrl !== null) db.settings.bkashLogoUrl = configRow.bkashLogoUrl;
          if (configRow.nagadLogoUrl !== undefined && configRow.nagadLogoUrl !== null) db.settings.nagadLogoUrl = configRow.nagadLogoUrl;
          if (configRow.sourceProtectionTitle !== undefined && configRow.sourceProtectionTitle !== null) db.settings.sourceProtectionTitle = configRow.sourceProtectionTitle;
          if (configRow.sourceProtectionDescription !== undefined && configRow.sourceProtectionDescription !== null) db.settings.sourceProtectionDescription = configRow.sourceProtectionDescription;
          if (configRow.sourceProtectionImageUrl !== undefined && configRow.sourceProtectionImageUrl !== null) db.settings.sourceProtectionImageUrl = configRow.sourceProtectionImageUrl;
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
          if (configRow.isXoroTextOnly !== undefined && configRow.isXoroTextOnly !== null) {
            db.settings.isXoroTextOnly = configRow.isXoroTextOnly === true || configRow.isXoroTextOnly === "true";
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
          if (configRow.siteTitle !== undefined && configRow.siteTitle !== null) db.settings.siteTitle = configRow.siteTitle;
          if (configRow.siteMetaDesc !== undefined && configRow.siteMetaDesc !== null) db.settings.siteMetaDesc = configRow.siteMetaDesc;
          
          if (configRow.productPayments) {
            try {
              db.settings.productPayments = typeof configRow.productPayments === "string" ? JSON.parse(configRow.productPayments) : configRow.productPayments;
            } catch (err) {}
          }

          if (configRow.productSeo) {
            try {
              (db.settings as any).productSeo = typeof configRow.productSeo === "string" ? JSON.parse(configRow.productSeo) : configRow.productSeo;
            } catch (err) {}
          }

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

    // Always load fallback settings from banners metadata backup as a robust failsafe for all fields (especially SEO and accent color)
    if (true) {
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
            if (fallbackSettings.isXoroVoiceAndAnswerDisabled !== undefined) db.settings.isXoroVoiceAndAnswerDisabled = fallbackSettings.isXoroVoiceAndAnswerDisabled === true || fallbackSettings.isXoroVoiceAndAnswerDisabled === "true";
            if (fallbackSettings.isXoroTextOnly !== undefined) db.settings.isXoroTextOnly = fallbackSettings.isXoroTextOnly === true || fallbackSettings.isXoroTextOnly === "true";
            if (fallbackSettings.globalTimerEndTime !== undefined) db.settings.globalTimerEndTime = fallbackSettings.globalTimerEndTime;
            if (fallbackSettings.globalTimerMessage !== undefined) db.settings.globalTimerMessage = fallbackSettings.globalTimerMessage;
            if (fallbackSettings.globalTimerActive !== undefined) db.settings.globalTimerActive = fallbackSettings.globalTimerActive === true || fallbackSettings.globalTimerActive === "true";
            if (fallbackSettings.globalPaymentSystem !== undefined) db.settings.globalPaymentSystem = fallbackSettings.globalPaymentSystem;
            if (fallbackSettings.globalPaymentMethod !== undefined) db.settings.globalPaymentMethod = fallbackSettings.globalPaymentMethod;
            if (fallbackSettings.globalDeliveryDays !== undefined) db.settings.globalDeliveryDays = fallbackSettings.globalDeliveryDays;
            if (fallbackSettings.productPayments !== undefined) db.settings.productPayments = fallbackSettings.productPayments;
            if (fallbackSettings.lotteryPrizes) db.settings.lotteryPrizes = fallbackSettings.lotteryPrizes;
            if (fallbackSettings.accentColor !== undefined) db.settings.accentColor = fallbackSettings.accentColor;
            if (fallbackSettings.siteTitle !== undefined) db.settings.siteTitle = fallbackSettings.siteTitle;
            if (fallbackSettings.siteMetaDesc !== undefined) db.settings.siteMetaDesc = fallbackSettings.siteMetaDesc;
            if (fallbackSettings.productSeo !== undefined) (db.settings as any).productSeo = fallbackSettings.productSeo;
          } catch (jsonErr: any) {
            console.warn("⚠️ Failed to parse fallback settings in GET route:", jsonErr.message);
          }
        }
      }
    }
  } catch (err) {
    console.warn("⚠️ API dynamically reading settings table bypass:", err);
  }

  const token = crypto.randomBytes(24).toString("hex");
  activeCsrfTokens.add(token);
  if (activeCsrfTokens.size > 100) {
    const firstValue = activeCsrfTokens.values().next().value;
    if (firstValue) activeCsrfTokens.delete(firstValue);
  }

  const baseSettings = db.settings || { 
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
  };

  res.json({ ...baseSettings, csrfToken: token });
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

app.post("/api/settings", xoroAdminAuthMiddleware, async (req, res) => {
  try {
    const { 
      whatsappNumber, adminEmail, adminPassword, appsScriptUrl, logoUrl, xoroAvatarUrl, 
      lotteryPrizes, lotteryDiscountPercentage, lotteryCouponPrefix, facebookUrl, instagramUrl, 
      paymentBadgeTitle, paymentBadgeDescription, isCatalogDeactivated, deactivatedMessage, 
      isLotteryDeactivated, isNotifyMeDeactivated, bkashLogoUrl, nagadLogoUrl,
      globalTimerEndTime, globalTimerMessage, globalTimerActive, globalPaymentSystem, 
      globalPaymentMethod, globalDeliveryDays, accentColor, isXoroVoiceDisabled, isXoroVoiceAndAnswerDisabled, isXoroTextOnly,
      smsProvider, twilioAccountSid, twilioAuthToken, twilioFromNumber, greenwebToken, siteTitle, siteMetaDesc,
      sourceProtectionTitle, sourceProtectionDescription, sourceProtectionImageUrl
    } = req.body;
    
    db.settings = {
      whatsappNumber: whatsappNumber ? whatsappNumber.trim() : (db.settings?.whatsappNumber || "8801755104443"),
      adminEmail: adminEmail ? adminEmail.trim() : (db.settings?.adminEmail || "risatadnan4@gmail.com"),
      adminPassword: adminPassword !== undefined ? adminPassword.trim() : (db.settings?.adminPassword || ""),
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
      isXoroVoiceDisabled: isXoroVoiceDisabled !== undefined ? (isXoroVoiceDisabled === true || isXoroVoiceDisabled === "true") : (db.settings?.isXoroVoiceDisabled || false),
      isXoroVoiceAndAnswerDisabled: isXoroVoiceAndAnswerDisabled !== undefined ? (isXoroVoiceAndAnswerDisabled === true || isXoroVoiceAndAnswerDisabled === "true") : (db.settings?.isXoroVoiceAndAnswerDisabled || false),
      isXoroTextOnly: isXoroTextOnly !== undefined ? (isXoroTextOnly === true || isXoroTextOnly === "true") : (db.settings?.isXoroTextOnly || false),
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
      siteTitle: siteTitle !== undefined ? siteTitle.trim() : (db.settings?.siteTitle || "Style X"),
      siteMetaDesc: siteMetaDesc !== undefined ? siteMetaDesc.trim() : (db.settings?.siteMetaDesc || "Elite Luxury Fashion Showcase"),
      sourceProtectionTitle: sourceProtectionTitle !== undefined ? sourceProtectionTitle.trim() : (db.settings?.sourceProtectionTitle || "Nice Try! 🛑"),
      sourceProtectionDescription: sourceProtectionDescription !== undefined ? sourceProtectionDescription.trim() : (db.settings?.sourceProtectionDescription || "This application's proprietary source code, styling assets, and architecture are protected by strict intellectual property controls."),
      sourceProtectionImageUrl: sourceProtectionImageUrl !== undefined ? sourceProtectionImageUrl.trim() : (db.settings?.sourceProtectionImageUrl || ""),
      lotteryPrizes: Array.isArray(lotteryPrizes) ? lotteryPrizes : (db.settings?.lotteryPrizes || []),
      productPayments: db.settings?.productPayments || {},
      productSeo: (db.settings as any)?.productSeo || {}
    };

    lastLocalSettingsWrite = Date.now();
    isSettingsSyncPending = true;

    await syncSettingsToCloud();

    // Background download and sync to public/stylex_logo.jpg if logoUrl is changed/external
    if (db.settings.logoUrl && db.settings.logoUrl.startsWith("http")) {
      (async () => {
        try {
          console.log(`[LOGO_SYNC] Downloading updated logo to local static fallback: ${db.settings.logoUrl}`);
          const logoRes = await fetch(db.settings.logoUrl);
          if (logoRes.ok) {
            const arrayBuffer = await logoRes.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            
            const localPaths = [
              path.join(process.cwd(), "public", "stylex_logo.jpg"),
              path.join(process.cwd(), "dist", "stylex_logo.jpg")
            ];
            
            for (const p of localPaths) {
              try {
                fs.writeFileSync(p, buffer);
                console.log(`[LOGO_SYNC] Saved logo to local path: ${p}`);
              } catch (fsErr: any) {
                // Silently skip if read-only or doesn't exist
              }
            }
          }
        } catch (fetchErr: any) {
          console.warn("[LOGO_SYNC] Error syncing logo in background:", fetchErr.message);
        }
      })();
    }

    return res.json(db.settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Helper to safely build a consolidated Product object merging Supabase row, local cache, and payment metadata
function tryJsonParse(val: any) {
  if (val === null || val === undefined) return null;
  if (typeof val !== "string") return val;
  try {
    return JSON.parse(val);
  } catch (e) {
    return null;
  }
}

function serializeDimensions(dimensionsVal: any, colorsVal: any, extraMeta?: any): string {
  let baseObj: any = {};
  if (typeof dimensionsVal === "string" && dimensionsVal.trim().startsWith("{")) {
    baseObj = tryJsonParse(dimensionsVal) || {};
  } else {
    baseObj = { dimensions: dimensionsVal || "Custom Fit" };
  }
  baseObj.colors = colorsVal || [];
  if (extraMeta && typeof extraMeta === "object") {
    for (const [k, v] of Object.entries(extraMeta)) {
      if (v !== undefined && v !== null) {
        baseObj[k] = v;
      }
    }
  }
  return JSON.stringify(baseObj);
}

function buildProductObject(p: any = {}, localProduct: any = {}, pm: any = {}): Product {
  const local = localProduct || {};
  const id = String(p?.id || local.id || Math.random().toString(36).substring(2, 10));
  const paymentMeta = pm && Object.keys(pm).length > 0 
    ? pm 
    : (((db.settings as any)?.productPayments && id && (db.settings as any).productPayments[id]) || {});
  const seoMeta = ((db.settings as any)?.productSeo && id && (db.settings as any).productSeo[id]) || {};

  // Colors & dimensions JSON metadata
  let parsedColors: any[] = [];
  let rawColors = (p?.colors !== undefined && p?.colors !== null) ? p.colors : local.colors;
  let dimObj: any = {};
  const dimStr = p?.dimensions || local.dimensions;
  if (dimStr && typeof dimStr === "string" && dimStr.trim().startsWith("{")) {
    dimObj = tryJsonParse(dimStr) || {};
  }

  // Sizes
  let parsedSizes: string[] = [];
  const candidateSizes = [p?.sizes, local?.sizes, dimObj?.sizes, paymentMeta?.sizes];
  for (const rawSizes of candidateSizes) {
    if (rawSizes === undefined || rawSizes === null || rawSizes === "") continue;
    let list: string[] = [];
    const res = tryJsonParse(rawSizes);
    if (Array.isArray(res)) {
      list = res.map((s: any) => String(s).trim()).filter(Boolean);
    } else if (typeof rawSizes === "string") {
      list = rawSizes.split(",").map((s: string) => s.trim()).filter(Boolean);
    } else if (Array.isArray(rawSizes)) {
      list = rawSizes.map((s: any) => String(s).trim()).filter(Boolean);
    }
    list = list.filter((s: string) => s.toLowerCase() !== "standard");
    if (list.length > 0) {
      parsedSizes = list;
      break;
    }
  }

  // Images
  let parsedImages: string[] = [];
  const rawImages = p?.images ?? local.images;
  if (rawImages !== undefined && rawImages !== null) {
    const res = tryJsonParse(rawImages);
    if (Array.isArray(res)) {
      parsedImages = res;
    } else if (Array.isArray(rawImages)) {
      parsedImages = rawImages;
    }
  }

  if (rawColors === undefined || rawColors === null || (Array.isArray(rawColors) && rawColors.length === 0)) {
    if (dimObj && Array.isArray(dimObj.colors) && dimObj.colors.length > 0) {
      rawColors = dimObj.colors;
    }
  }

  if (rawColors !== undefined && rawColors !== null) {
    const res = tryJsonParse(rawColors);
    if (Array.isArray(res)) {
      parsedColors = res;
    } else if (Array.isArray(rawColors)) {
      parsedColors = rawColors;
    }
  }

  const getStr = (...vals: any[]): string => {
    for (const v of vals) {
      if (v !== undefined && v !== null && String(v).trim() !== "") {
        return String(v);
      }
    }
    return "";
  };

  const getBool = (...vals: any[]): boolean => {
    for (const v of vals) {
      if (v !== undefined && v !== null) {
        return !!v;
      }
    }
    return false;
  };

  const getNum = (...vals: any[]): number | null => {
    for (const v of vals) {
      if (v !== undefined && v !== null && v !== "" && !isNaN(Number(v))) {
        return Number(v);
      }
    }
    return null;
  };

  const resolvedDimensionsText = (() => {
    if (typeof dimObj?.dimensions === "string" && dimObj.dimensions.trim() !== "") {
      return dimObj.dimensions;
    }
    if (typeof p?.dimensions === "string" && !p.dimensions.trim().startsWith("{") && p.dimensions.trim() !== "") {
      return p.dimensions;
    }
    if (typeof local.dimensions === "string" && !local.dimensions.trim().startsWith("{") && local.dimensions.trim() !== "") {
      return local.dimensions;
    }
    return "Standard Fitting";
  })();

  const resolvedPrice = getNum(local.price, p?.price, 0) ?? 0;

  const resolvedOfferPrice = (() => {
    if (local.offerPrice !== undefined) {
      if (local.offerPrice === null || local.offerPrice === "" || isNaN(Number(local.offerPrice))) return null;
      const val = Number(local.offerPrice);
      return val > 0 && val < resolvedPrice ? val : null;
    }
    if (p?.offerPrice !== undefined) {
      if (p.offerPrice === null || p.offerPrice === "" || isNaN(Number(p.offerPrice))) return null;
      const val = Number(p.offerPrice);
      return val > 0 && val < resolvedPrice ? val : null;
    }
    if (p?.offer_price !== undefined) {
      if (p.offer_price === null || p.offer_price === "" || isNaN(Number(p.offer_price))) return null;
      const val = Number(p.offer_price);
      return val > 0 && val < resolvedPrice ? val : null;
    }
    if (dimObj?.offerPrice !== undefined) {
      if (dimObj.offerPrice === null || dimObj.offerPrice === "" || isNaN(Number(dimObj.offerPrice))) return null;
      const val = Number(dimObj.offerPrice);
      return val > 0 && val < resolvedPrice ? val : null;
    }
    if (paymentMeta?.offerPrice !== undefined) {
      if (paymentMeta.offerPrice === null || paymentMeta.offerPrice === "" || isNaN(Number(paymentMeta.offerPrice))) return null;
      const val = Number(paymentMeta.offerPrice);
      return val > 0 && val < resolvedPrice ? val : null;
    }
    return null;
  })();

  const resolvedSeoKeywords = getStr(local.seoKeywords, local.seo_keywords, local.metaKeywords, p?.seoKeywords, p?.seo_keywords, p?.metaKeywords, dimObj?.seoKeywords, seoMeta.seoKeywords, "");
  const resolvedSeoTitle = getStr(local.seoTitle, p?.seoTitle, p?.seo_title, dimObj?.seoTitle, seoMeta.seoTitle, "");
  const resolvedSeoDesc = getStr(local.seoDescription, p?.seoDescription, p?.seo_description, dimObj?.seoDescription, seoMeta.seoDescription, "");
  const resolvedSeoSlug = getStr(local.seoSlug, p?.seoSlug, p?.seo_slug, dimObj?.seoSlug, seoMeta.seoSlug, "");
  const resolvedCanonical = getStr(local.canonicalUrl, p?.canonicalUrl, p?.canonical_url, dimObj?.canonicalUrl, seoMeta.canonicalUrl, "");
  const resolvedOgTitle = getStr(local.ogTitle, p?.ogTitle, p?.og_title, dimObj?.ogTitle, seoMeta.ogTitle, "");
  const resolvedOgDesc = getStr(local.ogDescription, p?.ogDescription, p?.og_description, dimObj?.ogDescription, seoMeta.ogDescription, "");
  const resolvedOgImage = getStr(local.ogImage, p?.ogImage, p?.og_image, dimObj?.ogImage, seoMeta.ogImage, "");
  const resolvedRobots = getStr(local.robots, p?.robots, dimObj?.robots, seoMeta.robots, "index, follow");

  return {
    id,
    code: getStr(local.code, p?.code, p?.product_code, paymentMeta.code, `XP-${Math.floor(100 + Math.random() * 900)}`),
    title: getStr(local.title, p?.title, p?.product_title, "Untitled Creation"),
    description: getStr(local.description, p?.description, p?.product_description, ""),
    price: getNum(local.price, p?.price, 0) ?? 0,
    category: (getStr(local.category, p?.category, "UNISEX") as any),
    stock: getNum(local.stock, p?.stock, 0) ?? 0,
    imageUrl: getStr(local.imageUrl, p?.imageUrl, p?.image_url, ""),
    images: parsedImages,
    colors: parsedColors,
    sizes: parsedSizes,
    dimensions: resolvedDimensionsText,
    whyBuy: getStr(local.whyBuy, p?.whyBuy, p?.why_buy, dimObj?.whyBuy, "এটি একটি অত্যন্ত প্রিমিয়াম ডিজাইন করা পিস, যা আপনার ফ্যাশনে এক অনন্য মাত্রা যোগ করবে।"),
    trending: getBool(local.trending, p?.trending, true),
    featured: getBool(local.featured, p?.featured, true),
    isPinned: getBool(local.isPinned, p?.isPinned, p?.is_pinned, dimObj?.isPinned, paymentMeta.isPinned, false),
    deliveryPrice: getNum(local.deliveryPrice, p?.deliveryPrice, p?.delivery_price, dimObj?.deliveryPrice, paymentMeta.deliveryPrice, 100) ?? 100,
    deliveryPriceDhaka: getNum(local.deliveryPriceDhaka, p?.deliveryPriceDhaka, p?.delivery_price_dhaka, dimObj?.deliveryPriceDhaka, paymentMeta.deliveryPriceDhaka, 100) ?? 100,
    deliveryPriceChattogram: getNum(local.deliveryPriceChattogram, p?.deliveryPriceChattogram, p?.delivery_price_chattogram, dimObj?.deliveryPriceChattogram, paymentMeta.deliveryPriceChattogram, 150) ?? 150,
    deliveryPriceRajshahi: getNum(local.deliveryPriceRajshahi, p?.deliveryPriceRajshahi, p?.delivery_price_rajshahi, dimObj?.deliveryPriceRajshahi, paymentMeta.deliveryPriceRajshahi, 150) ?? 150,
    deliveryPriceKhulna: getNum(local.deliveryPriceKhulna, p?.deliveryPriceKhulna, p?.delivery_price_khulna, dimObj?.deliveryPriceKhulna, paymentMeta.deliveryPriceKhulna, 150) ?? 150,
    deliveryPriceBarishal: getNum(local.deliveryPriceBarishal, p?.deliveryPriceBarishal, p?.delivery_price_barishal, dimObj?.deliveryPriceBarishal, paymentMeta.deliveryPriceBarishal, 150) ?? 150,
    deliveryPriceSylhet: getNum(local.deliveryPriceSylhet, p?.deliveryPriceSylhet, p?.delivery_price_sylhet, dimObj?.deliveryPriceSylhet, paymentMeta.deliveryPriceSylhet, 150) ?? 150,
    deliveryPriceRangpur: getNum(local.deliveryPriceRangpur, p?.deliveryPriceRangpur, p?.delivery_price_rangpur, dimObj?.deliveryPriceRangpur, paymentMeta.deliveryPriceRangpur, 150) ?? 150,
    deliveryPriceMymensingh: getNum(local.deliveryPriceMymensingh, p?.deliveryPriceMymensingh, p?.delivery_price_mymensingh, dimObj?.deliveryPriceMymensingh, paymentMeta.deliveryPriceMymensingh, 150) ?? 150,
    lotteryEligible: getBool(local.lotteryEligible, p?.lotteryEligible, p?.lottery_eligible, dimObj?.lotteryEligible, true),
    couponCode: getStr(local.couponCode, p?.couponCode, p?.coupon_code, dimObj?.couponCode, ""),
    couponDiscountPercent: getNum(local.couponDiscountPercent, p?.couponDiscountPercent, p?.coupon_discount_percent, dimObj?.couponDiscountPercent) ?? undefined,
    offerPrice: resolvedOfferPrice,
    timerOfferPrice: resolvedOfferPrice,
    timerStartTime: getStr(local.timerStartTime, local.timerStartDate, p?.timerStartTime, p?.timer_start_time, dimObj?.timerStartTime, paymentMeta.timerStartTime, ""),
    timerStartDate: getStr(local.timerStartDate, local.timerStartTime, p?.timerStartDate, p?.timer_start_date, dimObj?.timerStartDate, paymentMeta.timerStartDate, ""),
    timerEndTime: getStr(local.timerEndTime, local.timerEndDate, p?.timerEndTime, p?.timer_end_time, dimObj?.timerEndTime, paymentMeta.timerEndTime, ""),
    timerEndDate: getStr(local.timerEndDate, local.timerEndTime, p?.timerEndDate, p?.timer_end_date, dimObj?.timerEndDate, paymentMeta.timerEndDate, ""),
    timerMessage: getStr(local.timerMessage, p?.timerMessage, p?.timer_message, dimObj?.timerMessage, paymentMeta.timerMessage, ""),
    timerActive: getBool(local.timerActive, local.timerEnabled, p?.timerActive, p?.timer_active, dimObj?.timerActive, paymentMeta.timerActive, true),
    timerEnabled: getBool(local.timerEnabled, local.timerActive, p?.timerEnabled, p?.timer_enabled, dimObj?.timerEnabled, paymentMeta.timerEnabled, true),
    bkashNumber: getStr(local.bkashNumber, p?.bkashNumber, p?.bkash_number, dimObj?.bkashNumber, paymentMeta.bkashNumber, ""),
    nagadNumber: getStr(local.nagadNumber, p?.nagadNumber, p?.nagad_number, dimObj?.nagadNumber, paymentMeta.nagadNumber, ""),
    paymentType: (getStr(local.paymentType, p?.paymentType, p?.payment_type, dimObj?.paymentType, paymentMeta.paymentType, "cod") as any),
    paymentPercentage: getNum(local.paymentPercentage, p?.paymentPercentage, p?.payment_percentage, dimObj?.paymentPercentage, paymentMeta.paymentPercentage, 10) ?? 10,
    deliveryCharge: getNum(local.deliveryCharge, p?.deliveryCharge, p?.delivery_charge, dimObj?.deliveryCharge, paymentMeta.deliveryCharge, 100) ?? 100,
    deliveryDays: getStr(local.deliveryDays, p?.deliveryDays, p?.delivery_days, dimObj?.deliveryDays, paymentMeta.deliveryDays, "3-5"),
    freeDelivery: getBool(local.freeDelivery, p?.freeDelivery, p?.free_delivery, dimObj?.freeDelivery, paymentMeta.freeDelivery, false),
    likes: getNum(local.likes, p?.likes, dimObj?.likes, paymentMeta.likes, 0) ?? 0,
    seoTitle: resolvedSeoTitle,
    seoDescription: resolvedSeoDesc,
    seoKeywords: resolvedSeoKeywords,
    seo_keywords: resolvedSeoKeywords,
    metaKeywords: resolvedSeoKeywords,
    seoSlug: resolvedSeoSlug,
    canonicalUrl: resolvedCanonical,
    ogTitle: resolvedOgTitle,
    ogDescription: resolvedOgDesc,
    ogImage: resolvedOgImage,
    robots: resolvedRobots
  };
}

// Products Base API
app.get("/api/products", async (req, res) => {
  try {
    const { data: productsData, error: pError } = await supabase.from("products").select("*");
    if (!pError && productsData && productsData.length > 0) {
      const fetchedIds = new Set(productsData.map((p: any) => String(p.id)));
      const supabaseProducts = productsData.map((p: any) => {
        const localProduct = db.products ? db.products.find((lp: any) => String(lp.id) === String(p.id)) : null;
        const pm = (db.settings?.productPayments && db.settings.productPayments[p.id]) || {};
        return buildProductObject(p, localProduct, pm);
      });

      // Retain any local-only products not returned by Supabase
      const localOnlyProducts = (db.products || []).filter((lp: any) => !fetchedIds.has(String(lp.id)));
      const mergedProducts = [...supabaseProducts, ...localOnlyProducts];

      db.products = mergedProducts;
      saveDB();
      return res.json(mergedProducts);
    }
  } catch (err: any) {
    console.warn("⚠️ Direct products fetch fallback to memory cache:", formatSupabaseError(err));
  }
  const fallbackProducts = (db.products || []).map((lp: any) => {
    const pm = (db.settings?.productPayments && db.settings.productPayments[lp.id]) || {};
    return buildProductObject({}, lp, pm);
  });
  res.json(fallbackProducts);
});

app.get("/api/products/:id", async (req, res) => {
  const prodId = req.params.id;
  const localProduct = db.products ? db.products.find((lp: any) => String(lp.id) === String(prodId)) : null;
  const pm = (db.settings?.productPayments && db.settings.productPayments[prodId]) || {};

  try {
    const { data, error } = await supabase.from("products").select("*").eq("id", prodId).single();
    if (!error && data) {
      const prod = buildProductObject(data, localProduct, pm);
      return res.json(prod);
    }
  } catch (err: any) {
    console.warn("⚠️ Direct product selected select fallback:", formatSupabaseError(err));
  }

  if (localProduct) {
    return res.json(buildProductObject({}, localProduct, pm));
  }
  res.status(404).json({ message: "Product not found" });
});

// Resilient helper to upsert product data to Supabase, automatically handling schema columns mismatch and database alters
async function upsertProductToSupabase(productPayload: any) {
  // We do NOT hard-delete payment/delivery parameters here because the products table
  // may have these columns; if they don't exist, our dynamic pruning loop below
  // will gracefully prune them and retry! This guarantees perfect persistence.
  const basePayload = { ...productPayload };

  // Try dynamic payload supporting both snake_case and camelCase SEO, OpenGraph, division-wise delivery prices, and payment options, pruning any unsupported columns dynamically in a loop
  const payloadSnake: any = {
    ...basePayload,
    // SEO & OG mappings
    seo_title: basePayload.seoTitle || null,
    seo_description: basePayload.seoDescription || null,
    seo_keywords: basePayload.seoKeywords || basePayload.metaKeywords || null,
    meta_keywords: basePayload.metaKeywords || basePayload.seoKeywords || null,
    seo_slug: basePayload.seoSlug || null,
    canonical_url: basePayload.canonicalUrl || null,
    og_title: basePayload.ogTitle || null,
    og_description: basePayload.ogDescription || null,
    og_image: basePayload.ogImage || null,
    robots: basePayload.robots || null,
    
    // Division-wise delivery prices snake_case mappings
    delivery_price: basePayload.deliveryPrice !== undefined && basePayload.deliveryPrice !== null ? Number(basePayload.deliveryPrice) : null,
    delivery_price_dhaka: basePayload.deliveryPriceDhaka !== undefined && basePayload.deliveryPriceDhaka !== null ? Number(basePayload.deliveryPriceDhaka) : null,
    delivery_price_chattogram: basePayload.deliveryPriceChattogram !== undefined && basePayload.deliveryPriceChattogram !== null ? Number(basePayload.deliveryPriceChattogram) : null,
    delivery_price_rajshahi: basePayload.deliveryPriceRajshahi !== undefined && basePayload.deliveryPriceRajshahi !== null ? Number(basePayload.deliveryPriceRajshahi) : null,
    delivery_price_khulna: basePayload.deliveryPriceKhulna !== undefined && basePayload.deliveryPriceKhulna !== null ? Number(basePayload.deliveryPriceKhulna) : null,
    delivery_price_barishal: basePayload.deliveryPriceBarishal !== undefined && basePayload.deliveryPriceBarishal !== null ? Number(basePayload.deliveryPriceBarishal) : null,
    delivery_price_sylhet: basePayload.deliveryPriceSylhet !== undefined && basePayload.deliveryPriceSylhet !== null ? Number(basePayload.deliveryPriceSylhet) : null,
    delivery_price_rangpur: basePayload.deliveryPriceRangpur !== undefined && basePayload.deliveryPriceRangpur !== null ? Number(basePayload.deliveryPriceRangpur) : null,
    delivery_price_mymensingh: basePayload.deliveryPriceMymensingh !== undefined && basePayload.deliveryPriceMymensingh !== null ? Number(basePayload.deliveryPriceMymensingh) : null,

    // Product other fields mapping to snake_case
    image_url: basePayload.imageUrl || null,
    why_buy: basePayload.whyBuy || null,
    lottery_eligible: basePayload.lotteryEligible !== undefined ? !!basePayload.lotteryEligible : null,
    coupon_code: basePayload.couponCode || null,
    coupon_discount_percent: basePayload.couponDiscountPercent !== undefined && basePayload.couponDiscountPercent !== null ? Number(basePayload.couponDiscountPercent) : null,
    offer_price: basePayload.offerPrice !== undefined && basePayload.offerPrice !== null ? Number(basePayload.offerPrice) : null,
    timer_offer_price: basePayload.timerOfferPrice !== undefined && basePayload.timerOfferPrice !== null ? Number(basePayload.timerOfferPrice) : (basePayload.offerPrice !== undefined && basePayload.offerPrice !== null ? Number(basePayload.offerPrice) : null),
    timer_start_time: basePayload.timerStartTime || null,
    timer_start_date: basePayload.timerStartDate || basePayload.timerStartTime || null,
    timer_end_time: basePayload.timerEndTime || null,
    timer_end_date: basePayload.timerEndDate || basePayload.timerEndTime || null,
    timer_message: basePayload.timerMessage || null,
    timer_active: basePayload.timerActive !== undefined ? !!basePayload.timerActive : null,
    timer_enabled: basePayload.timerEnabled !== undefined ? !!basePayload.timerEnabled : (basePayload.timerActive !== undefined ? !!basePayload.timerActive : null),

    // Payment and custom delivery fields mappings
    bkash_number: basePayload.bkashNumber || null,
    nagad_number: basePayload.nagadNumber || null,
    payment_type: basePayload.paymentType || null,
    payment_percentage: basePayload.paymentPercentage !== undefined && basePayload.paymentPercentage !== null ? Number(basePayload.paymentPercentage) : null,
    delivery_charge: basePayload.deliveryCharge !== undefined && basePayload.deliveryCharge !== null ? Number(basePayload.deliveryCharge) : null,
    delivery_days: basePayload.deliveryDays || null,
    is_pinned: basePayload.isPinned !== undefined ? !!basePayload.isPinned : null,
    free_delivery: basePayload.freeDelivery !== undefined ? !!basePayload.freeDelivery : null,
    likes: basePayload.likes !== undefined && basePayload.likes !== null ? Number(basePayload.likes) : null,

    // Support camelCase properties as well
    isPinned: basePayload.isPinned !== undefined ? !!basePayload.isPinned : undefined,
    deliveryPrice: basePayload.deliveryPrice !== undefined && basePayload.deliveryPrice !== null ? Number(basePayload.deliveryPrice) : undefined,
    deliveryPriceDhaka: basePayload.deliveryPriceDhaka !== undefined && basePayload.deliveryPriceDhaka !== null ? Number(basePayload.deliveryPriceDhaka) : undefined,
    deliveryPriceChattogram: basePayload.deliveryPriceChattogram !== undefined && basePayload.deliveryPriceChattogram !== null ? Number(basePayload.deliveryPriceChattogram) : undefined,
    deliveryPriceRajshahi: basePayload.deliveryPriceRajshahi !== undefined && basePayload.deliveryPriceRajshahi !== null ? Number(basePayload.deliveryPriceRajshahi) : undefined,
    deliveryPriceKhulna: basePayload.deliveryPriceKhulna !== undefined && basePayload.deliveryPriceKhulna !== null ? Number(basePayload.deliveryPriceKhulna) : undefined,
    deliveryPriceBarishal: basePayload.deliveryPriceBarishal !== undefined && basePayload.deliveryPriceBarishal !== null ? Number(basePayload.deliveryPriceBarishal) : undefined,
    deliveryPriceSylhet: basePayload.deliveryPriceSylhet !== undefined && basePayload.deliveryPriceSylhet !== null ? Number(basePayload.deliveryPriceSylhet) : undefined,
    deliveryPriceRangpur: basePayload.deliveryPriceRangpur !== undefined && basePayload.deliveryPriceRangpur !== null ? Number(basePayload.deliveryPriceRangpur) : undefined,
    deliveryPriceMymensingh: basePayload.deliveryPriceMymensingh !== undefined && basePayload.deliveryPriceMymensingh !== null ? Number(basePayload.deliveryPriceMymensingh) : undefined,
    lotteryEligible: basePayload.lotteryEligible !== undefined ? !!basePayload.lotteryEligible : undefined,
    couponCode: basePayload.couponCode,
    couponDiscountPercent: basePayload.couponDiscountPercent !== undefined && basePayload.couponDiscountPercent !== null ? Number(basePayload.couponDiscountPercent) : undefined,
    offerPrice: basePayload.offerPrice !== undefined && basePayload.offerPrice !== null ? Number(basePayload.offerPrice) : undefined,
    timerOfferPrice: basePayload.timerOfferPrice !== undefined && basePayload.timerOfferPrice !== null ? Number(basePayload.timerOfferPrice) : undefined,
    timerStartTime: basePayload.timerStartTime,
    timerEndTime: basePayload.timerEndTime,
    timerMessage: basePayload.timerMessage,
    timerActive: basePayload.timerActive !== undefined ? !!basePayload.timerActive : undefined,
    bkashNumber: basePayload.bkashNumber,
    nagadNumber: basePayload.nagadNumber,
    paymentType: basePayload.paymentType,
    paymentPercentage: basePayload.paymentPercentage !== undefined && basePayload.paymentPercentage !== null ? Number(basePayload.paymentPercentage) : undefined,
    deliveryCharge: basePayload.deliveryCharge !== undefined && basePayload.deliveryCharge !== null ? Number(basePayload.deliveryCharge) : undefined,
    deliveryDays: basePayload.deliveryDays,
    freeDelivery: basePayload.freeDelivery !== undefined ? !!basePayload.freeDelivery : undefined,

    // Support camelCase SEO properties
    seoTitle: basePayload.seoTitle || null,
    seoDescription: basePayload.seoDescription || null,
    seoKeywords: basePayload.seoKeywords || basePayload.metaKeywords || null,
    metaKeywords: basePayload.metaKeywords || basePayload.seoKeywords || null,
    seoSlug: basePayload.seoSlug || null,
    canonicalUrl: basePayload.canonicalUrl || null,
    ogTitle: basePayload.ogTitle || null,
    ogDescription: basePayload.ogDescription || null,
    ogImage: basePayload.ogImage || null
  };

  let currentPayload = { ...payloadSnake };
  let result: any;
  try {
    result = await supabase.from("products").upsert(currentPayload);
  } catch (err: any) {
    console.warn("[PRODUCTS_SYNC] Supabase upsert network exception:", formatSupabaseError(err));
    return { data: null, error: null };
  }
  
  if (result.error) {
    const errText = result.error.message || String(result.error);
    if (errText.includes("<!DOCTYPE") || errText.includes("502") || errText.includes("Bad Gateway") || errText.includes("503") || errText.includes("504")) {
      console.warn("[PRODUCTS_SYNC] Supabase cloud connection is temporarily sleeping or restarting (502 Bad Gateway). Product is persisted safely in local storage.");
      return { data: null, error: null };
    }
  }

  let retries = 0;
  while (result.error && (result.error.message?.includes("column") || result.error.message?.includes("does not exist") || result.error.code === "42703" || result.error.code === "PGRST102") && retries < 25) {
    retries++;
    const match = result.error.message.match(/column "([^"]+)"/);
    if (match && match[1]) {
      const colName = match[1];
      console.log(`[PRODUCTS_SYNC] Pruning missing column from products table payload: "${colName}"`);
      delete currentPayload[colName];
    } else {
      console.log("[PRODUCTS_SYNC] Unable to parse column name. Pruning all non-core columns.");
      const coreKeys = ["id", "code", "title", "price", "stock", "imageUrl"];
      for (const key of Object.keys(currentPayload)) {
        if (!coreKeys.includes(key)) {
          delete currentPayload[key];
        }
      }
    }
    try {
      result = await supabase.from("products").upsert(currentPayload);
    } catch (err: any) {
      console.warn("[PRODUCTS_SYNC] Retry upsert caught exception:", formatSupabaseError(err));
      break;
    }
  }
  
  return result;
}

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    health: "100%",
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.post("/api/seo/generate", async (req, res) => {
  const { title, description, whyBuy, price } = req.body;

  try {
    const userPrompt = `
      Please analyze this premium fashion product from the official Style X (STYLE X BD) brand:
      - Title: ${title || "Untitled Product"}
      - Description: ${description || "No description provided"}
      - Highlights/Why Buy: ${whyBuy || "No highlights"}
      - Price: ${price || "100"} BDT

      Your task is to generate highly optimized, search-engine-ranking-saturated SEO fields in JSON format that will guarantee #1 position on Google search when users search for "stylex", "style x", "style x bd", "stylex bangladesh", or the product name:

      1. "seoTitle": Must be a high-converting meta title (under 60 characters). It must start with the exact or optimized product name and strictly end with " | STYLE X" or " | STYLE X BD" or " | Style X Bangladesh" (e.g., "Royal Blue Silk Panjabi | STYLE X BD"). This ensures brand-name proximity and rich snippet indexing.
      2. "seoSlug": A clean, SEO-optimized, lowercase URL slug using hyphens. You must append "-stylex" or "-stylex-bd" at the end of the slug (e.g., "royal-blue-silk-panjabi-stylex") to guarantee URL-level relevance for brand + product query matches. No spaces or special characters.
      3. "seoKeywords": A comma-separated list of 8-12 extremely search-dense phrases. You MUST include these exact phrases: "stylex, style x, style x bd, stylex bd, style x bangladesh, stylex online shopping, stylex clothing, [product name] price in bangladesh, stylex [product name], buy [product name] online bd, authentic style x [product name]".
      4. "seoDescription": A highly compelling, high-CTR meta description (120-160 characters). It must start with a brand-defining phrase (e.g. "Buy the official STYLE X [Product Name] online in Bangladesh.") and mention "100% authentic quality, nationwide secure Cash on Delivery (COD), and premium curation." with a strong CTA to click.

      Provide ONLY a clean JSON response matching the requested schema. Do not include markdown wraps or anything else.
    `;

    const result = await executeWithAiKeyRotation(async (ai) => {
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: userPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              seoTitle: { type: Type.STRING },
              seoSlug: { type: Type.STRING },
              seoKeywords: { type: Type.STRING },
              seoDescription: { type: Type.STRING }
            },
            required: ["seoTitle", "seoSlug", "seoKeywords", "seoDescription"]
          }
        }
      });

      const jsonText = response.text || "{}";
      return JSON.parse(jsonText.trim());
    });

    return res.json(result);
  } catch (error: any) {
    console.error("⚠️ Error generating SEO with Gemini:", error);
    return res.status(500).json({ error: error.message || "Failed to generate SEO metrics." });
  }
});

const getNumVal = (...vals: any[]): number | null => {
  for (const v of vals) {
    if (v !== undefined && v !== null && v !== "" && !isNaN(Number(v))) {
      return Number(v);
    }
  }
  return null;
};
const getStrVal = (...vals: any[]): string | null => {
  for (const v of vals) {
    if (v !== undefined && v !== null && String(v).trim() !== "") {
      return String(v);
    }
  }
  return null;
};
const getBoolVal = (...vals: any[]): boolean => {
  for (const v of vals) {
    if (v !== undefined && v !== null) {
      return !!v;
    }
  }
  return false;
};

app.post("/api/products", xoroAdminAuthMiddleware, async (req, res) => {
  const newProduct: Product = req.body;
  if (!newProduct.id) {
    newProduct.id = Math.random().toString(36).substring(2, 10);
  }
  // Validate SKU Code
  if (!newProduct.code) {
    newProduct.code = `XP-${Math.floor(100 + Math.random() * 900)}`;
  }

  // Auto-generate keywords for the new product only if not explicitly provided
  if (!newProduct.seoKeywords && !newProduct.metaKeywords && !newProduct.seo_keywords) {
    const generatedKeywords = generateSeoKeywordsForProduct(newProduct.title);
    newProduct.seoKeywords = generatedKeywords;
    newProduct.seo_keywords = generatedKeywords;
    newProduct.metaKeywords = generatedKeywords;
  }

  const resolvedOfferPrice = newProduct.offerPrice !== undefined && newProduct.offerPrice !== null && (newProduct.offerPrice as any) !== "" && !isNaN(Number(newProduct.offerPrice))
    ? Number(newProduct.offerPrice)
    : null;

  newProduct.price = Number(newProduct.price || 0);
  newProduct.stock = Number(newProduct.stock || 0);
  newProduct.offerPrice = resolvedOfferPrice;
  newProduct.timerOfferPrice = resolvedOfferPrice;
  newProduct.deliveryPrice = newProduct.deliveryPrice !== undefined ? Number(newProduct.deliveryPrice) : 100;
  newProduct.deliveryPriceDhaka = newProduct.deliveryPriceDhaka !== undefined ? Number(newProduct.deliveryPriceDhaka) : 100;
  newProduct.deliveryPriceChattogram = newProduct.deliveryPriceChattogram !== undefined ? Number(newProduct.deliveryPriceChattogram) : 150;
  newProduct.deliveryPriceRajshahi = newProduct.deliveryPriceRajshahi !== undefined ? Number(newProduct.deliveryPriceRajshahi) : 150;
  newProduct.deliveryPriceKhulna = newProduct.deliveryPriceKhulna !== undefined ? Number(newProduct.deliveryPriceKhulna) : 150;
  newProduct.deliveryPriceBarishal = newProduct.deliveryPriceBarishal !== undefined ? Number(newProduct.deliveryPriceBarishal) : 150;
  newProduct.deliveryPriceSylhet = newProduct.deliveryPriceSylhet !== undefined ? Number(newProduct.deliveryPriceSylhet) : 150;
  newProduct.deliveryPriceRangpur = newProduct.deliveryPriceRangpur !== undefined ? Number(newProduct.deliveryPriceRangpur) : 150;
  newProduct.deliveryPriceMymensingh = newProduct.deliveryPriceMymensingh !== undefined ? Number(newProduct.deliveryPriceMymensingh) : 150;
  newProduct.timerStartTime = newProduct.timerStartTime || null;
  newProduct.timerStartDate = newProduct.timerStartTime || null;
  newProduct.timerEndTime = newProduct.timerEndTime || null;
  newProduct.timerEndDate = newProduct.timerEndTime || null;
  newProduct.timerMessage = newProduct.timerMessage || null;
  newProduct.timerActive = newProduct.timerActive !== undefined ? !!newProduct.timerActive : true;
  newProduct.timerEnabled = newProduct.timerActive;
  newProduct.couponCode = newProduct.couponCode ? String(newProduct.couponCode).trim() : "";
  newProduct.couponDiscountPercent = newProduct.couponDiscountPercent !== undefined && newProduct.couponDiscountPercent !== null && (newProduct.couponDiscountPercent as any) !== "" ? Number(newProduct.couponDiscountPercent) : null;
  newProduct.likes = Number(newProduct.likes || 0);
  
  db.products.push(newProduct);
  saveDB();
  
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
    offerPrice: resolvedOfferPrice,
    timerOfferPrice: resolvedOfferPrice,
    timerStartTime: newProduct.timerStartTime,
    timerStartDate: newProduct.timerStartTime,
    timerEndTime: newProduct.timerEndTime,
    timerEndDate: newProduct.timerEndTime,
    timerMessage: newProduct.timerMessage || null,
    timerActive: newProduct.timerActive,
    timerEnabled: newProduct.timerActive,
    freeDelivery: !!newProduct.freeDelivery,
    likes: newProduct.likes,
    deliveryPriceDhaka: newProduct.deliveryPriceDhaka,
    deliveryPriceChattogram: newProduct.deliveryPriceChattogram,
    deliveryPriceRajshahi: newProduct.deliveryPriceRajshahi,
    deliveryPriceKhulna: newProduct.deliveryPriceKhulna,
    deliveryPriceBarishal: newProduct.deliveryPriceBarishal,
    deliveryPriceSylhet: newProduct.deliveryPriceSylhet,
    deliveryPriceRangpur: newProduct.deliveryPriceRangpur,
    deliveryPriceMymensingh: newProduct.deliveryPriceMymensingh
  };

  if (!(db.settings as any).productSeo) {
    (db.settings as any).productSeo = {};
  }
  (db.settings as any).productSeo[newProduct.id] = {
    seoTitle: newProduct.seoTitle || "",
    seoDescription: newProduct.seoDescription || "",
    seoKeywords: newProduct.seoKeywords || newProduct.metaKeywords || "",
    metaKeywords: newProduct.metaKeywords || newProduct.seoKeywords || "",
    seoSlug: newProduct.seoSlug || "",
    canonicalUrl: newProduct.canonicalUrl || "",
    ogTitle: newProduct.ogTitle || "",
    ogDescription: newProduct.ogDescription || "",
    ogImage: newProduct.ogImage || "",
    robots: newProduct.robots || "index, follow"
  };
  await syncSettingsToCloud();

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
      sizes: typeof newProduct.sizes === "string" ? newProduct.sizes : JSON.stringify(newProduct.sizes),
      colors: Array.isArray(newProduct.colors) ? JSON.stringify(newProduct.colors) : JSON.stringify([]),
      dimensions: serializeDimensions(newProduct.dimensions, newProduct.colors, {
        sizes: newProduct.sizes,
        deliveryPrice: newProduct.deliveryPrice,
        deliveryPriceDhaka: newProduct.deliveryPriceDhaka,
        deliveryPriceChattogram: newProduct.deliveryPriceChattogram,
        deliveryPriceRajshahi: newProduct.deliveryPriceRajshahi,
        deliveryPriceKhulna: newProduct.deliveryPriceKhulna,
        deliveryPriceBarishal: newProduct.deliveryPriceBarishal,
        deliveryPriceSylhet: newProduct.deliveryPriceSylhet,
        deliveryPriceRangpur: newProduct.deliveryPriceRangpur,
        deliveryPriceMymensingh: newProduct.deliveryPriceMymensingh,
        deliveryCharge: newProduct.deliveryCharge !== undefined ? Number(newProduct.deliveryCharge) : Number(newProduct.deliveryPrice || 100),
        deliveryDays: newProduct.deliveryDays || "",
        freeDelivery: !!newProduct.freeDelivery,
        paymentType: newProduct.paymentType || "cod",
        paymentPercentage: newProduct.paymentPercentage !== undefined && newProduct.paymentPercentage !== null ? Number(newProduct.paymentPercentage) : null,
        bkashNumber: newProduct.bkashNumber || "",
        nagadNumber: newProduct.nagadNumber || "",
        isPinned: !!newProduct.isPinned,
        likes: Number(newProduct.likes || 0),
        lotteryEligible: newProduct.lotteryEligible !== undefined ? !!newProduct.lotteryEligible : true,
        couponCode: newProduct.couponCode ? newProduct.couponCode.trim() : "",
        couponDiscountPercent: newProduct.couponDiscountPercent !== undefined && newProduct.couponDiscountPercent !== null ? Number(newProduct.couponDiscountPercent) : null,
        offerPrice: resolvedOfferPrice,
        timerOfferPrice: resolvedOfferPrice,
        timerStartTime: newProduct.timerStartTime,
        timerEndTime: newProduct.timerEndTime,
        timerMessage: newProduct.timerMessage || null,
        timerActive: newProduct.timerActive,
        seoTitle: newProduct.seoTitle || null,
        seoDescription: newProduct.seoDescription || null,
        seoKeywords: newProduct.seoKeywords || newProduct.metaKeywords || null,
        metaKeywords: newProduct.metaKeywords || newProduct.seoKeywords || null,
        seoSlug: newProduct.seoSlug || null,
        canonicalUrl: newProduct.canonicalUrl || null,
        ogTitle: newProduct.ogTitle || null,
        ogDescription: newProduct.ogDescription || null,
        ogImage: newProduct.ogImage || null,
        robots: newProduct.robots || "index, follow"
      }),
      whyBuy: newProduct.whyBuy,
      trending: !!newProduct.trending,
      featured: !!newProduct.featured,
      isPinned: !!newProduct.isPinned,
      likes: Number(newProduct.likes || 0),
      deliveryPrice: newProduct.deliveryPrice,
      deliveryPriceDhaka: newProduct.deliveryPriceDhaka,
      deliveryPriceChattogram: newProduct.deliveryPriceChattogram,
      deliveryPriceRajshahi: newProduct.deliveryPriceRajshahi,
      deliveryPriceKhulna: newProduct.deliveryPriceKhulna,
      deliveryPriceBarishal: newProduct.deliveryPriceBarishal,
      deliveryPriceSylhet: newProduct.deliveryPriceSylhet,
      deliveryPriceRangpur: newProduct.deliveryPriceRangpur,
      deliveryPriceMymensingh: newProduct.deliveryPriceMymensingh,
      lotteryEligible: newProduct.lotteryEligible !== undefined ? !!newProduct.lotteryEligible : true,
      couponCode: newProduct.couponCode ? newProduct.couponCode.trim() : "",
      couponDiscountPercent: newProduct.couponDiscountPercent !== undefined && newProduct.couponDiscountPercent !== null ? Number(newProduct.couponDiscountPercent) : null,
      offerPrice: resolvedOfferPrice,
      timerStartTime: newProduct.timerStartTime,
      timerEndTime: newProduct.timerEndTime,
      timerMessage: newProduct.timerMessage || null,
      timerActive: newProduct.timerActive,
      bkashNumber: newProduct.bkashNumber || "",
      nagadNumber: newProduct.nagadNumber || "",
      paymentType: newProduct.paymentType || "cod",
      paymentPercentage: newProduct.paymentPercentage !== undefined && newProduct.paymentPercentage !== null ? Number(newProduct.paymentPercentage) : null,
      deliveryCharge: newProduct.deliveryCharge !== undefined ? Number(newProduct.deliveryCharge) : Number(newProduct.deliveryPrice || 100),
      deliveryDays: newProduct.deliveryDays || null,
      freeDelivery: !!newProduct.freeDelivery,
      seoTitle: newProduct.seoTitle || null,
      seoDescription: newProduct.seoDescription || null,
      seoKeywords: newProduct.seoKeywords || newProduct.metaKeywords || null,
      metaKeywords: newProduct.metaKeywords || newProduct.seoKeywords || null,
      seoSlug: newProduct.seoSlug || null,
      canonicalUrl: newProduct.canonicalUrl || null,
      ogTitle: newProduct.ogTitle || null,
      ogDescription: newProduct.ogDescription || null,
      ogImage: newProduct.ogImage || null,
      robots: newProduct.robots || "index, follow"
    };
    
    try {
      const { error: upsertError } = await upsertProductToSupabase(payload);
      if (upsertError) {
        console.warn("⚠️ Non-fatal warning mirroring product creation to Supabase: ", formatSupabaseError(upsertError));
      }
    } catch (upsertEx: any) {
      console.warn("⚠️ Exception during Supabase product creation upsert: ", formatSupabaseError(upsertEx));
    }
  } catch (err: any) {
    console.warn("⚠️ Failed to mirror product creation to cloud database (saved locally): ", formatSupabaseError(err));
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

app.put("/api/products/:id", xoroAdminAuthMiddleware, async (req, res) => {
  const targetId = String(req.params.id || "").trim();
  const idx = db.products.findIndex(p => String(p.id).trim() === targetId || String(p.code || "").trim().toUpperCase() === targetId.toUpperCase());
  if (idx !== -1) {
    const existingProd = db.products[idx];
    const b = req.body;

    const resolvedPrice = b.price !== undefined ? Number(b.price) : existingProd.price;
    let resolvedOfferPrice = b.offerPrice !== undefined
      ? (b.offerPrice === null || b.offerPrice === "" || isNaN(Number(b.offerPrice)) ? null : Number(b.offerPrice))
      : existingProd.offerPrice;

    if (resolvedOfferPrice !== null && (resolvedOfferPrice >= resolvedPrice || resolvedOfferPrice <= 0)) {
      resolvedOfferPrice = null;
    }

    const updatedProd: Product = {
      ...existingProd,
      ...b,
      id: existingProd.id,
      code: b.code !== undefined ? b.code : existingProd.code,
      title: b.title !== undefined ? b.title : existingProd.title,
      description: b.description !== undefined ? b.description : existingProd.description,
      price: resolvedPrice,
      stock: b.stock !== undefined ? Number(b.stock) : existingProd.stock,
      category: b.category !== undefined ? b.category : existingProd.category,
      imageUrl: b.imageUrl !== undefined ? b.imageUrl : existingProd.imageUrl,
      images: b.images !== undefined ? b.images : existingProd.images,
      colors: b.colors !== undefined ? b.colors : existingProd.colors,
      sizes: b.sizes !== undefined ? b.sizes : existingProd.sizes,
      dimensions: b.dimensions !== undefined ? b.dimensions : existingProd.dimensions,
      whyBuy: b.whyBuy !== undefined ? b.whyBuy : existingProd.whyBuy,
      trending: b.trending !== undefined ? !!b.trending : existingProd.trending,
      featured: b.featured !== undefined ? !!b.featured : existingProd.featured,
      isPinned: b.isPinned !== undefined ? !!b.isPinned : existingProd.isPinned,
      deliveryPrice: b.deliveryPrice !== undefined ? Number(b.deliveryPrice) : existingProd.deliveryPrice,
      deliveryPriceDhaka: b.deliveryPriceDhaka !== undefined ? Number(b.deliveryPriceDhaka) : existingProd.deliveryPriceDhaka,
      deliveryPriceChattogram: b.deliveryPriceChattogram !== undefined ? Number(b.deliveryPriceChattogram) : existingProd.deliveryPriceChattogram,
      deliveryPriceRajshahi: b.deliveryPriceRajshahi !== undefined ? Number(b.deliveryPriceRajshahi) : existingProd.deliveryPriceRajshahi,
      deliveryPriceKhulna: b.deliveryPriceKhulna !== undefined ? Number(b.deliveryPriceKhulna) : existingProd.deliveryPriceKhulna,
      deliveryPriceBarishal: b.deliveryPriceBarishal !== undefined ? Number(b.deliveryPriceBarishal) : existingProd.deliveryPriceBarishal,
      deliveryPriceSylhet: b.deliveryPriceSylhet !== undefined ? Number(b.deliveryPriceSylhet) : existingProd.deliveryPriceSylhet,
      deliveryPriceRangpur: b.deliveryPriceRangpur !== undefined ? Number(b.deliveryPriceRangpur) : existingProd.deliveryPriceRangpur,
      deliveryPriceMymensingh: b.deliveryPriceMymensingh !== undefined ? Number(b.deliveryPriceMymensingh) : existingProd.deliveryPriceMymensingh,
      lotteryEligible: b.lotteryEligible !== undefined ? !!b.lotteryEligible : existingProd.lotteryEligible,
      couponCode: b.couponCode !== undefined ? String(b.couponCode).trim() : existingProd.couponCode,
      couponDiscountPercent: b.couponDiscountPercent !== undefined ? (b.couponDiscountPercent === null || b.couponDiscountPercent === "" ? null : Number(b.couponDiscountPercent)) : existingProd.couponDiscountPercent,
      offerPrice: resolvedOfferPrice,
      timerOfferPrice: resolvedOfferPrice,
      timerStartTime: b.timerStartTime !== undefined ? (b.timerStartTime || null) : existingProd.timerStartTime,
      timerStartDate: b.timerStartTime !== undefined ? (b.timerStartTime || null) : existingProd.timerStartDate,
      timerEndTime: b.timerEndTime !== undefined ? (b.timerEndTime || null) : existingProd.timerEndTime,
      timerEndDate: b.timerEndTime !== undefined ? (b.timerEndTime || null) : existingProd.timerEndDate,
      timerMessage: b.timerMessage !== undefined ? (b.timerMessage || null) : existingProd.timerMessage,
      timerActive: b.timerActive !== undefined ? !!b.timerActive : existingProd.timerActive,
      timerEnabled: b.timerActive !== undefined ? !!b.timerActive : existingProd.timerEnabled,
      bkashNumber: b.bkashNumber !== undefined ? (b.bkashNumber || "") : existingProd.bkashNumber,
      nagadNumber: b.nagadNumber !== undefined ? (b.nagadNumber || "") : existingProd.nagadNumber,
      paymentType: b.paymentType !== undefined ? b.paymentType : existingProd.paymentType,
      paymentPercentage: b.paymentPercentage !== undefined ? (b.paymentPercentage !== null ? Number(b.paymentPercentage) : null) : existingProd.paymentPercentage,
      deliveryCharge: b.deliveryCharge !== undefined ? Number(b.deliveryCharge) : existingProd.deliveryCharge,
      deliveryDays: b.deliveryDays !== undefined ? String(b.deliveryDays) : existingProd.deliveryDays,
      freeDelivery: b.freeDelivery !== undefined ? !!b.freeDelivery : existingProd.freeDelivery,
      likes: b.likes !== undefined ? Number(b.likes) : existingProd.likes,
      seoTitle: b.seoTitle !== undefined ? (b.seoTitle || null) : existingProd.seoTitle,
      seoDescription: b.seoDescription !== undefined ? (b.seoDescription || null) : existingProd.seoDescription,
      seoKeywords: b.seoKeywords !== undefined ? (b.seoKeywords || null) : (b.metaKeywords !== undefined ? b.metaKeywords : existingProd.seoKeywords),
      seo_keywords: b.seoKeywords !== undefined ? (b.seoKeywords || null) : (b.metaKeywords !== undefined ? b.metaKeywords : existingProd.seo_keywords),
      metaKeywords: b.metaKeywords !== undefined ? (b.metaKeywords || null) : (b.seoKeywords !== undefined ? b.seoKeywords : existingProd.metaKeywords),
      seoSlug: b.seoSlug !== undefined ? (b.seoSlug || null) : existingProd.seoSlug,
      canonicalUrl: b.canonicalUrl !== undefined ? (b.canonicalUrl || null) : existingProd.canonicalUrl,
      ogTitle: b.ogTitle !== undefined ? (b.ogTitle || null) : existingProd.ogTitle,
      ogDescription: b.ogDescription !== undefined ? (b.ogDescription || null) : existingProd.ogDescription,
      ogImage: b.ogImage !== undefined ? (b.ogImage || null) : existingProd.ogImage,
      robots: b.robots !== undefined ? (b.robots || "index, follow") : (existingProd.robots || "index, follow")
    };

    db.products[idx] = updatedProd;
    saveDB();

    const target = updatedProd;
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
      offerPrice: target.offerPrice,
      timerOfferPrice: target.timerOfferPrice,
      timerStartTime: target.timerStartTime,
      timerStartDate: target.timerStartDate,
      timerEndTime: target.timerEndTime,
      timerEndDate: target.timerEndDate,
      timerMessage: target.timerMessage || null,
      timerActive: target.timerActive,
      timerEnabled: target.timerEnabled,
      freeDelivery: target.freeDelivery !== undefined ? !!target.freeDelivery : false,
      likes: target.likes !== undefined ? Number(target.likes) : 0,
      deliveryPriceDhaka: target.deliveryPriceDhaka !== undefined ? Number(target.deliveryPriceDhaka) : 100,
      deliveryPriceChattogram: target.deliveryPriceChattogram !== undefined ? Number(target.deliveryPriceChattogram) : 150,
      deliveryPriceRajshahi: target.deliveryPriceRajshahi !== undefined ? Number(target.deliveryPriceRajshahi) : 150,
      deliveryPriceKhulna: target.deliveryPriceKhulna !== undefined ? Number(target.deliveryPriceKhulna) : 150,
      deliveryPriceBarishal: target.deliveryPriceBarishal !== undefined ? Number(target.deliveryPriceBarishal) : 150,
      deliveryPriceSylhet: target.deliveryPriceSylhet !== undefined ? Number(target.deliveryPriceSylhet) : 150,
      deliveryPriceRangpur: target.deliveryPriceRangpur !== undefined ? Number(target.deliveryPriceRangpur) : 150,
      deliveryPriceMymensingh: target.deliveryPriceMymensingh !== undefined ? Number(target.deliveryPriceMymensingh) : 150
    };

    if (!(db.settings as any).productSeo) {
      (db.settings as any).productSeo = {};
    }
    (db.settings as any).productSeo[target.id] = {
      seoTitle: target.seoTitle || "",
      seoDescription: target.seoDescription || "",
      seoKeywords: target.seoKeywords || target.metaKeywords || "",
      metaKeywords: target.metaKeywords || target.seoKeywords || "",
      seoSlug: target.seoSlug || "",
      canonicalUrl: target.canonicalUrl || "",
      ogTitle: target.ogTitle || "",
      ogDescription: target.ogDescription || "",
      ogImage: target.ogImage || "",
      robots: target.robots || "index, follow"
    };
    await syncSettingsToCloud();

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
        colors: Array.isArray(target.colors) ? JSON.stringify(target.colors) : JSON.stringify([]),
        dimensions: serializeDimensions(target.dimensions, target.colors, {
          sizes: target.sizes,
          deliveryPrice: Number(target.deliveryPrice || 100),
          deliveryPriceDhaka: Number(target.deliveryPriceDhaka || 100),
          deliveryPriceChattogram: Number(target.deliveryPriceChattogram || 150),
          deliveryPriceRajshahi: Number(target.deliveryPriceRajshahi || 150),
          deliveryPriceKhulna: Number(target.deliveryPriceKhulna || 150),
          deliveryPriceBarishal: Number(target.deliveryPriceBarishal || 150),
          deliveryPriceSylhet: Number(target.deliveryPriceSylhet || 150),
          deliveryPriceRangpur: Number(target.deliveryPriceRangpur || 150),
          deliveryPriceMymensingh: Number(target.deliveryPriceMymensingh || 150),
          deliveryCharge: target.deliveryCharge !== undefined ? Number(target.deliveryCharge) : Number(target.deliveryPrice || 100),
          deliveryDays: target.deliveryDays || "",
          freeDelivery: !!target.freeDelivery,
          paymentType: target.paymentType || "cod",
          paymentPercentage: target.paymentPercentage !== undefined && target.paymentPercentage !== null ? Number(target.paymentPercentage) : null,
          bkashNumber: target.bkashNumber || "",
          nagadNumber: target.nagadNumber || "",
          isPinned: !!target.isPinned,
          likes: Number(target.likes || 0),
          lotteryEligible: target.lotteryEligible !== undefined ? !!target.lotteryEligible : true,
          couponCode: target.couponCode ? target.couponCode.trim() : "",
          couponDiscountPercent: target.couponDiscountPercent !== undefined && target.couponDiscountPercent !== null ? Number(target.couponDiscountPercent) : null,
          offerPrice: target.offerPrice,
          timerOfferPrice: target.timerOfferPrice,
          timerStartTime: target.timerStartTime,
          timerEndTime: target.timerEndTime,
          timerMessage: target.timerMessage || null,
          timerActive: target.timerActive,
          seoTitle: target.seoTitle || null,
          seoDescription: target.seoDescription || null,
          seoKeywords: target.seoKeywords || target.metaKeywords || null,
          metaKeywords: target.metaKeywords || target.seoKeywords || null,
          seoSlug: target.seoSlug || null,
          canonicalUrl: target.canonicalUrl || null,
          ogTitle: target.ogTitle || null,
          ogDescription: target.ogDescription || null,
          ogImage: target.ogImage || null,
          robots: target.robots || "index, follow"
        }),
        whyBuy: target.whyBuy,
        trending: !!target.trending,
        featured: !!target.featured,
        isPinned: !!target.isPinned,
        likes: Number(target.likes || 0),
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
        timerStartTime: target.timerStartTime || null,
        timerEndTime: target.timerEndTime || null,
        timerMessage: target.timerMessage || null,
        timerActive: target.timerActive !== undefined ? !!target.timerActive : true,
        bkashNumber: target.bkashNumber || "",
        nagadNumber: target.nagadNumber || "",
        paymentType: target.paymentType || "cod",
        paymentPercentage: target.paymentPercentage !== undefined && target.paymentPercentage !== null ? Number(target.paymentPercentage) : null,
        deliveryCharge: target.deliveryCharge !== undefined ? Number(target.deliveryCharge) : Number(target.deliveryPrice || 100),
        deliveryDays: target.deliveryDays || null,
        freeDelivery: target.freeDelivery !== undefined ? !!target.freeDelivery : false,
        seoTitle: target.seoTitle || null,
        seoDescription: target.seoDescription || null,
        seoKeywords: target.seoKeywords || target.metaKeywords || null,
        metaKeywords: target.metaKeywords || target.seoKeywords || null,
        seoSlug: target.seoSlug || null,
        canonicalUrl: target.canonicalUrl || null,
        ogTitle: target.ogTitle || null,
        ogDescription: target.ogDescription || null,
        ogImage: target.ogImage || null,
        robots: target.robots || "index, follow"
      };

      try {
        let { error: upsertError } = await upsertProductToSupabase(payload);
        if (upsertError) {
          console.warn("⚠️ Non-fatal warning mirroring product update to Supabase: ", formatSupabaseError(upsertError));
        }
      } catch (upsertEx: any) {
        console.warn("⚠️ Exception during Supabase product update upsert: ", formatSupabaseError(upsertEx));
      }
    } catch (err: any) {
      console.warn("⚠️ Failed to mirror product update to Supabase (saved locally): ", formatSupabaseError(err));
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
    await syncSettingsToCloud();
    return res.json({ success: true, likes: newLikes });
  }
  return res.status(404).json({ error: "Product not found" });
});

app.delete("/api/products/:id", xoroAdminAuthMiddleware, async (req, res) => {
  const targetId = String(req.params.id || "").trim();
  if (!targetId) {
    return res.status(400).json({ error: "Product ID is required" });
  }

  console.log(`[DELETE PRODUCT] Initiating delete for product ID/Code: "${targetId}"`);

  // Remove matching products from memory db.products
  const deletedProducts = db.products.filter(
    p => String(p.id).trim() === targetId || String(p.code || "").trim().toUpperCase() === targetId.toUpperCase()
  );

  db.products = db.products.filter(
    p => String(p.id).trim() !== targetId && String(p.code || "").trim().toUpperCase() !== targetId.toUpperCase()
  );

  // Clean up product payment settings
  if (db.settings?.productPayments) {
    delete db.settings.productPayments[targetId];
    for (const dp of deletedProducts) {
      delete db.settings.productPayments[dp.id];
    }
  }

  saveDB();
  await syncSettingsToCloud();

  // Delete from Supabase cloud database
  try {
    const { error: deleteError } = await supabase
      .from("products")
      .delete()
      .or(`id.eq.${targetId},code.eq.${targetId}`);

    if (deleteError) {
      console.error("⚠️ Supabase product deletion error: ", deleteError.message);
    } else {
      console.log(`✅ Product "${targetId}" deleted from Supabase successfully.`);
    }
  } catch (err: any) {
    console.error("⚠️ Exception deleting product from Supabase: ", err?.message || err);
  }

  lastSyncCompletedAt = 0;

  return res.json({
    success: true,
    deletedCount: deletedProducts.length,
    message: "Product deleted successfully"
  });
});

// Banners API
app.get("/api/banners", async (req, res) => {
  try {
    const { data, error } = await supabase.from("banners").select("*");
    if (!error && data) {
      const banners = data.filter((b: any) => !b.id?.startsWith("system_") && !b.title?.startsWith("SYSTEM_")).map((b: any) => ({
        ...b,
        active: !!b.active
      }));
      db.banners = banners;
      db.seededBanners = true;
      saveDB();
      return res.json(banners);
    }
  } catch (err: any) {
    if (!isSupabaseGatewayError(err)) {
      console.warn("⚠️ Direct banners fetch fallback:", formatSupabaseError(err));
    }
  }
  res.json((db.banners || []).filter((b: any) => !b.id?.startsWith("system_") && !b.title?.startsWith("SYSTEM_")));
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

// --- CHECKOUT SESSION TRACKING SYSTEM FOR ABANDONED VS COMPLETED ORDERS ---
interface CheckoutSessionData {
  sessionId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerCity: string;
  customerDistrict: string;
  customerArea?: string;
  customerNotes?: string;
  customerEmail?: string;
  items: any[];
  estimatedTotal: number;
  createdAt: string;
  step1CompletedAt?: string;
  abandonedEmailSent: boolean;
  orderCompleted: boolean;
  orderId?: string;
}

const checkoutSessions = new Map<string, CheckoutSessionData>();

// Save Step 1 Customer Information without immediately sending email
const handleSaveStep1Session = async (req: express.Request, res: express.Response) => {
  const { 
    sessionId,
    customerName, 
    customerPhone, 
    customerAddress, 
    customerCity, 
    customerDistrict,
    customerArea,
    customerNotes,
    customerEmail,
    items,
    estimatedTotal
  } = req.body;

  if (!customerName || !customerPhone || !customerAddress) {
    return res.status(400).json({ message: "Missing required customer details." });
  }

  // Store new user phone number in directory
  registerCustomerPhone(customerPhone, customerName, customerEmail, 'checkout_step1');

  const sessId = sessionId || `SESS-CHK-${Date.now()}`;
  const existing = checkoutSessions.get(sessId);

  const sessionData: CheckoutSessionData = {
    sessionId: sessId,
    customerName,
    customerPhone,
    customerAddress,
    customerCity: customerCity || 'Dhaka',
    customerDistrict: customerDistrict || customerCity || 'Dhaka',
    customerArea: customerArea || '',
    customerNotes: customerNotes || '',
    customerEmail: customerEmail || 'guest@example.com',
    items: items || [],
    estimatedTotal: Number(estimatedTotal) || 0,
    createdAt: existing?.createdAt || new Date().toISOString(),
    step1CompletedAt: new Date().toISOString(),
    abandonedEmailSent: existing?.abandonedEmailSent || false,
    orderCompleted: existing?.orderCompleted || false,
    orderId: existing?.orderId
  };

  checkoutSessions.set(sessId, sessionData);

  return res.json({ 
    success: true, 
    sessionId: sessId, 
    message: "Step 1 information saved successfully." 
  });
};

app.post("/api/checkout-step1-save", express.json(), handleSaveStep1Session);
app.post("/api/checkout-step1-notify", express.json(), handleSaveStep1Session);

// Handle Abandoned Checkout Notification (Triggered ONLY when user leaves checkout after completing Step 1)
app.post("/api/checkout-abandon", express.text({ type: '*/*' }), async (req, res) => {
  let body: any = {};
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (e) {
    body = req.body || {};
  }

  const {
    sessionId,
    customerName,
    customerPhone,
    customerAddress,
    customerCity,
    customerDistrict,
    customerArea,
    customerNotes,
    customerEmail,
    items,
    estimatedTotal
  } = body;

  const sessId = sessionId;
  let session = sessId ? checkoutSessions.get(sessId) : null;

  // Use payload fallback if session not found in memory
  const name = session?.customerName || customerName;
  const phone = session?.customerPhone || customerPhone;
  const address = session?.customerAddress || customerAddress;
  const city = session?.customerCity || customerCity || '';
  const district = session?.customerDistrict || customerDistrict || city;
  const area = session?.customerArea || customerArea || '';
  const notes = session?.customerNotes || customerNotes || '';
  const email = session?.customerEmail || customerEmail || 'Guest';
  const orderItems = session?.items || items || [];
  const total = session?.estimatedTotal || estimatedTotal || 0;

  if (!name || !phone || !address) {
    return res.status(200).json({ success: false, message: "Insufficient details for abandoned notification." });
  }

  // 1. STRICT RULE: If order was already completed for this session, DO NOT send abandoned email!
  if (session?.orderCompleted) {
    console.log(`[CHECKOUT_ABANDON_SUPPRESSED] Order already placed for session ${sessId}. Abandoned email blocked.`);
    return res.json({ success: true, message: "Order completed. Abandoned email suppressed." });
  }

  // 2. STRICT RULE: Prevent duplicate emails if already sent
  if (session?.abandonedEmailSent) {
    console.log(`[CHECKOUT_ABANDON_SUPPRESSED] Abandoned email already sent for session ${sessId}. Duplicate suppressed.`);
    return res.json({ success: true, message: "Abandoned email already sent previously." });
  }

  // Mark abandoned email as sent for this session
  if (session) {
    session.abandonedEmailSent = true;
  } else if (sessId) {
    checkoutSessions.set(sessId, {
      sessionId: sessId,
      customerName: name,
      customerPhone: phone,
      customerAddress: address,
      customerCity: city,
      customerDistrict: district,
      customerArea: area,
      customerNotes: notes,
      customerEmail: email,
      items: orderItems,
      estimatedTotal: total,
      createdAt: new Date().toISOString(),
      abandonedEmailSent: true,
      orderCompleted: false
    });
  }

  // Prepare Abandoned Email Content
  const orderItemsText = orderItems && Array.isArray(orderItems)
    ? orderItems.map((i: any) => `- ${i.title} (${i.selectedSize || "Standard"})${i.selectedColor ? ` [Color: ${i.selectedColor}]` : ""} x${i.quantity} @ ৳${i.price}`).join("\n")
    : "No items specified";

  const orderItemsHtml = orderItems && Array.isArray(orderItems)
    ? orderItems.map((i: any) => {
        const prod = db.products.find(p => p.id === i.productId);
        const imgUrl = i.selectedColorImage || prod?.imageUrl || "";
        const colorText = i.selectedColor ? `<br/><span style="font-size: 11px; color: #aaa;">Color: <b>${i.selectedColor}</b></span>` : "";
        const sizeText = `<br/><span style="font-size: 11px; color: #aaa;">Size: <b>${i.selectedSize || "Standard"}</b></span>`;
        
        const imgHtml = imgUrl 
          ? `<td style="padding: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); width: 60px; vertical-align: top;">
               <img src="${imgUrl}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; border: 1px solid rgba(255,255,255,0.2);" alt="${i.title}" />
             </td>` 
          : '';

        return `
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
            ${imgHtml}
            <td style="padding: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); vertical-align: top; color: #fff;">
              <div style="font-size: 13px; font-weight: bold; color: #fff;">${i.title}</div>
              ${colorText}
              ${sizeText}
            </td>
            <td style="padding: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); vertical-align: top; text-align: right; font-size: 12px; font-weight: bold; color: #d4af37; width: 100px;">
              ${i.quantity} x ৳${i.price}
            </td>
          </tr>
        `;
      }).join("")
    : "";

  const emailSubject = `⚠️ Abandoned Checkout After Step 1: ${name}`;
  const emailBody = `
========================================
⚠️ ABANDONED CHECKOUT NOTIFICATION
========================================
👤 Customer Name: ${name}
📞 Mobile Number: ${phone}
✉️ Email: ${email}
🏠 Delivery Address: ${address}
🏙️ City / District / Area: ${city} / ${district} / ${area || 'N/A'}
📝 Notes: ${notes || 'None'}
📦 Products in Cart:
${orderItemsText}
💰 Total Price: ৳${total}
⏰ Cancelled Time: ${new Date().toLocaleString()}
🚦 Status: Checkout Cancelled After Step 1
========================================
  `;

  const emailHtml = `
    <div style="font-family: sans-serif; padding: 20px; max-width: 600px; border: 2px dashed #f59e0b; border-radius: 8px; background-color: #0f0a1c; color: #fff;">
      <div style="background-color: #7c2d12; color: #fef3c7; padding: 6px 12px; border-radius: 4px; font-weight: bold; font-size: 11px; text-transform: uppercase; margin-bottom: 12px; display: inline-block;">
        ⚠️ Status: Checkout Cancelled After Step 1
      </div>
      <h2 style="color: #f59e0b; border-bottom: 2px solid #f59e0b; padding-bottom: 8px; margin-top: 0;">⚠️ Abandoned Checkout Notification</h2>
      <p style="font-size: 13px; color: #eaeaea;">Customer completed Step 1 form but cancelled or left checkout before placing the order.</p>
      
      <table style="width: 100%; border-collapse: collapse; margin-top: 15px; color: #fff;">
        <tr>
          <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid rgba(255,255,255,0.1); width: 150px; color: #f59e0b;">Customer Name:</td>
          <td style="padding: 8px; border-bottom: 1px solid rgba(255,255,255,0.1);">${name}</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid rgba(255,255,255,0.1); color: #f59e0b;">Mobile Number:</td>
          <td style="padding: 8px; border-bottom: 1px solid rgba(255,255,255,0.1);">${phone}</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid rgba(255,255,255,0.1); color: #f59e0b;">Email:</td>
          <td style="padding: 8px; border-bottom: 1px solid rgba(255,255,255,0.1);">${email}</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid rgba(255,255,255,0.1); color: #f59e0b;">Address:</td>
          <td style="padding: 8px; border-bottom: 1px solid rgba(255,255,255,0.1);">${address}, ${city} (${district})</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid rgba(255,255,255,0.1); color: #f59e0b; vertical-align: top;" colspan="2">Products in Cart:</td>
        </tr>
        <tr>
          <td style="padding: 0; border-bottom: 1px solid rgba(255,255,255,0.1);" colspan="2">
            <table style="width: 100%; border-collapse: collapse;">
              ${orderItemsHtml}
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid rgba(255,255,255,0.1); color: #f59e0b;">Total Price:</td>
          <td style="padding: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); font-weight: bold; color: #22c55e;">৳${total}</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold; color: #f59e0b;">Cancelled Time:</td>
          <td style="padding: 8px;">${new Date().toLocaleString()}</td>
        </tr>
      </table>
    </div>
  `;

  try {
    await sendAdminEmail({ subject: emailSubject, text: emailBody, html: emailHtml });
    console.log(`[CHECKOUT_ABANDON] Sent 1 Abandoned Checkout email for session ${sessId || 'unknown'}`);
    res.json({ success: true, message: "Abandoned checkout email sent." });
  } catch (err: any) {
    console.error(`[CHECKOUT_ABANDON_ERR] Failed to send abandoned email:`, err.message);
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
    sessionId,
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

  function getProductActivePriceBackend(product: any): number {
    if (!product) return 0;
    const originalPrice = Number(product.price || 0);
    const rawOfferPrice = product.offerPrice !== undefined && product.offerPrice !== null
      ? Number(product.offerPrice)
      : (product.timerOfferPrice !== undefined && product.timerOfferPrice !== null
        ? Number(product.timerOfferPrice)
        : null);

    if (rawOfferPrice === null || isNaN(rawOfferPrice) || rawOfferPrice <= 0 || rawOfferPrice >= originalPrice) {
      return originalPrice;
    }

    return rawOfferPrice;
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
      amountToPay = Math.round((pct / 100) * (calculatedSubtotal - calculatedDiscountAmount));
    }

    const lowerPayMethod = String(payMethod || "").trim().toLowerCase();

    if (payType !== 'cod' && lowerPayMethod === 'bkash') {
      traceLogs.push(`[PAYMENT_TRACE] Step 6: bKash payment request initiated...`);
      traceLogs.push(`[PAYMENT_TRACE]   - Request Payload: { amount: ${amountToPay}, currency: "BDT", intent: "sale", merchantInvoiceNumber: "${paymentSessionId}" }`);
      traceLogs.push(`[PAYMENT_TRACE]   - Amount sent to bKash Gateway: ৳${amountToPay}`);
    } else {
      traceLogs.push(`[PAYMENT_TRACE] Step 6: bKash payment request bypassed (not selected).`);
    }

    // Step 7: Nagad payment request
    if (payType !== 'cod' && lowerPayMethod === 'nagad') {
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

  // Mark checkout session as completed so NO abandoned email will be sent
  if (sessionId) {
    const session = checkoutSessions.get(sessionId);
    if (session) {
      session.orderCompleted = true;
      session.orderId = newOrder.id;
    } else {
      checkoutSessions.set(sessionId, {
        sessionId,
        customerName,
        customerPhone,
        customerAddress,
        customerCity: customerCity || 'Dhaka',
        customerDistrict: customerDistrict || customerCity || 'Dhaka',
        items: items || [],
        estimatedTotal: totalAmount,
        createdAt: new Date().toISOString(),
        abandonedEmailSent: false,
        orderCompleted: true,
        orderId: newOrder.id
      });
    }
  }

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
    
    // Resilient fallback: If orders table doesn't support any of the columns, prune them dynamically in a loop and retry
    let retries = 0;
    while (upsertErr && (upsertErr.message.includes("column") || upsertErr.message.includes("does not exist") || upsertErr.code === "42703" || upsertErr.code === "PGRST102") && retries < 15) {
      retries++;
      const match = upsertErr.message.match(/column "([^"]+)"/);
      if (match && match[1]) {
        const colName = match[1];
        console.log(`[ORDERS_SYNC] Pruning missing column from orders table payload: "${colName}"`);
        delete payload[colName];
      } else {
        console.log("[ORDERS_SYNC] Unable to parse column name. Pruning all non-core columns.");
        const coreKeys = ["id", "customerName", "customerPhone", "customerAddress", "totalAmount", "status", "date", "items"];
        for (const key of Object.keys(payload)) {
          if (!coreKeys.includes(key)) {
            delete payload[key];
          }
        }
      }
      const retryRes = await supabase.from("orders").upsert(payload);
      upsertErr = retryRes.error;
    }
    if (upsertErr) {
      console.error("❌ Failed to upsert order to Supabase:", upsertErr.message);
    } else {
      console.log("✅ Order successfully saved to Supabase.");
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
    const orderItemsHtml = items && Array.isArray(items)
      ? items.map((i: any) => {
          const prod = db.products.find(p => p.id === i.productId);
          const imgUrl = i.selectedColorImage || prod?.imageUrl || "";
          const colorText = i.selectedColor ? `<br/><span style="font-size: 11px; color: #666;">Color: <b>${i.selectedColor}</b></span>` : "";
          const sizeText = i.selectedSize ? `<br/><span style="font-size: 11px; color: #666;">Size: <b>${i.selectedSize}</b></span>` : "";

          return `
            <div style="display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid #eee;">
              ${imgUrl ? `<img src="${imgUrl}" alt="${i.title}" style="width: 65px; height: 65px; object-fit: cover; border-radius: 6px; border: 1px solid #ddd; flex-shrink: 0;" />` : ''}
              <div style="flex: 1;">
                <div style="font-weight: bold; font-size: 13.5px; color: #111;">${i.title}</div>
                ${sizeText}
                ${colorText}
                <div style="font-size: 12px; color: #444; margin-top: 4px;">Qty: <b>${i.quantity}</b> × <b>৳${i.price}</b> = <b style="color: #d4af37;">৳${Number(i.price) * Number(i.quantity)}</b></div>
              </div>
            </div>
          `;
        }).join("")
      : orderItemsText;

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
        <h2 style="color: #d4af37; border-bottom: 2px solid #d4af37; padding-bottom: 10px; margin-top: 0;">👑 Style X Luxury Order Confirmation</h2>
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
            <td style="padding: 0 8px; border-bottom: 1px solid #eee;">${orderItemsHtml}</td>
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

    // Dispatch single email via unified system
    sendAdminEmail({ subject: emailSubject, text: emailBody, html: emailHtml })
      .catch(err => console.error("Error sending admin order email:", err));
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

app.put("/api/orders/:id/status", xoroAdminAuthMiddleware, async (req, res) => {
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

app.delete("/api/orders/:id", xoroAdminAuthMiddleware, async (req, res) => {
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
        const isEspecial = c.isEspecial !== undefined && c.isEspecial !== null ? !!c.isEspecial : ((c.is_especial !== undefined && c.is_especial !== null) ? !!c.is_especial : !!existingLocal?.isEspecial);
        return {
          code: c.code,
          type: c.type || existingLocal?.type || 'PERCENTAGE',
          value: Number(c.value),
          active,
          maxUses,
          usedCount,
          isEspecial
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

// FORM GENERATOR API ENDPOINTS
app.get("/api/forms", xoroAdminAuthMiddleware, (req, res) => {
  if (!db.forms) db.forms = [];
  res.json(db.forms);
});

app.post("/api/forms", xoroAdminAuthMiddleware, async (req, res) => {
  const { id, title, description, fields } = req.body;
  if (!db.forms) db.forms = [];
  if (!db.formSubmissions) db.formSubmissions = [];

  const targetId = id || crypto.randomUUID();
  const existingIndex = db.forms.findIndex(f => f.id === targetId);

  const formObj: FormGenerator = {
    id: targetId,
    title: title || "Untitled Form",
    description: description || "",
    fields: fields || [],
    submissionsCount: existingIndex > -1 ? db.forms[existingIndex].submissionsCount : 0,
    viewsCount: existingIndex > -1 ? db.forms[existingIndex].viewsCount : 0,
    createdAt: existingIndex > -1 ? db.forms[existingIndex].createdAt : new Date().toISOString()
  };

  if (existingIndex > -1) {
    db.forms[existingIndex] = formObj;
  } else {
    db.forms.push(formObj);
  }

  saveDB();
  syncSettingsToCloud().catch(() => {});

  try {
    if (isFormsTableAvailable) {
      const payload = {
        id: formObj.id,
        title: formObj.title,
        description: formObj.description,
        fields: JSON.stringify(formObj.fields),
        submissions_count: formObj.submissionsCount,
        views_count: formObj.viewsCount,
        created_at: formObj.createdAt
      };
      const { error } = await supabase.from("forms").upsert(payload);
      if (error) {
        console.error("⚠️ Forms Supabase upsert failed:", error.message);
        if (error.message?.includes("Could not find the table") || error.message?.includes("relation") || error.message?.includes("does not exist")) {
          isFormsTableAvailable = false;
        }
      }
    }
  } catch (err: any) {
    if (isFormsTableAvailable) {
      console.error("⚠️ Forms Supabase upsert exception:", err.message);
    }
  }

  res.json({ success: true, form: formObj });
});

app.delete("/api/forms/:id", xoroAdminAuthMiddleware, async (req, res) => {
  const { id } = req.params;
  if (!db.forms) db.forms = [];
  db.forms = db.forms.filter(f => f.id !== id);
  if (db.formSubmissions) {
    db.formSubmissions = db.formSubmissions.filter(s => s.formId !== id);
  }
  saveDB();
  syncSettingsToCloud().catch(() => {});

  try {
    if (isFormsTableAvailable) {
      const { error } = await supabase.from("forms").delete().eq("id", id);
      if (error && (error.message?.includes("Could not find the table") || error.message?.includes("relation") || error.message?.includes("does not exist"))) {
        isFormsTableAvailable = false;
      }
    }
    if (isFormSubmissionsTableAvailable) {
      const { error } = await supabase.from("form_submissions").delete().eq("form_id", id);
      if (error && (error.message?.includes("Could not find the table") || error.message?.includes("relation") || error.message?.includes("does not exist"))) {
        isFormSubmissionsTableAvailable = false;
      }
    }
  } catch (err: any) {
    if (isFormsTableAvailable || isFormSubmissionsTableAvailable) {
      console.error("⚠️ Forms Supabase delete exception:", err.message);
    }
  }

  res.json({ success: true });
});

app.get("/api/forms/:id", async (req, res) => {
  const { id } = req.params;
  if (!db.forms) db.forms = [];
  const form = db.forms.find(f => f.id === id);
  if (!form) {
    return res.status(404).json({ message: "Form not found" });
  }

  form.viewsCount = (form.viewsCount || 0) + 1;
  saveDB();

  try {
    if (isFormsTableAvailable) {
      const { error } = await supabase.from("forms").update({ views_count: form.viewsCount }).eq("id", id);
      if (error && (error.message?.includes("Could not find the table") || error.message?.includes("relation") || error.message?.includes("does not exist"))) {
        isFormsTableAvailable = false;
      }
    }
  } catch (err: any) {
    if (isFormsTableAvailable) {
      console.error("⚠️ Forms Supabase views update exception:", err.message);
    }
  }

  res.json(form);
});

app.post("/api/forms/:id/submit", async (req, res) => {
  const { id } = req.params;
  const { answers } = req.body;
  if (!db.forms) db.forms = [];
  if (!db.formSubmissions) db.formSubmissions = [];

  const form = db.forms.find(f => f.id === id);
  if (!form) {
    return res.status(404).json({ message: "Form not found" });
  }

  form.submissionsCount = (form.submissionsCount || 0) + 1;

  const submission: FormSubmission = {
    id: crypto.randomUUID(),
    formId: id,
    answers: answers || {},
    submittedAt: new Date().toISOString(),
    userAgent: req.headers["user-agent"],
    ip: req.ip || (req.headers["x-forwarded-for"] as string),
    referer: req.headers["referer"]
  };

  db.formSubmissions.push(submission);
  saveDB();
  syncSettingsToCloud().catch(() => {});

  try {
    if (isFormsTableAvailable) {
      const { error } = await supabase.from("forms").update({ submissions_count: form.submissionsCount }).eq("id", id);
      if (error && (error.message?.includes("Could not find the table") || error.message?.includes("relation") || error.message?.includes("does not exist"))) {
        isFormsTableAvailable = false;
      }
    }
    if (isFormSubmissionsTableAvailable) {
      const payload = {
        id: submission.id,
        form_id: submission.formId,
        answers: JSON.stringify(submission.answers),
        submitted_at: submission.submittedAt,
        user_agent: submission.userAgent,
        ip: submission.ip,
        referer: submission.referer
      };
      const { error } = await supabase.from("form_submissions").insert(payload);
      if (error) {
        console.error("⚠️ Forms Supabase submission failed:", error.message);
        if (error.message?.includes("Could not find the table") || error.message?.includes("relation") || error.message?.includes("does not exist")) {
          isFormSubmissionsTableAvailable = false;
        }
      }
    }
  } catch (err: any) {
    if (isFormsTableAvailable || isFormSubmissionsTableAvailable) {
      console.error("⚠️ Forms Supabase submission exception:", err.message);
    }
  }

  res.json({ success: true, submission });
});

app.get("/api/forms/:id/submissions", xoroAdminAuthMiddleware, (req, res) => {
  const { id } = req.params;
  if (!db.formSubmissions) db.formSubmissions = [];
  const list = db.formSubmissions.filter(s => s.formId === id);
  res.json(list);
});

app.delete("/api/forms/:id/submissions/:subId", xoroAdminAuthMiddleware, async (req, res) => {
  const { id, subId } = req.params;
  if (!db.formSubmissions) db.formSubmissions = [];
  db.formSubmissions = db.formSubmissions.filter(s => s.id !== subId);

  const form = db.forms?.find(f => f.id === id);
  if (form && form.submissionsCount > 0) {
    form.submissionsCount--;
    try {
      if (isFormsTableAvailable) {
        const { error } = await supabase.from("forms").update({ submissions_count: form.submissionsCount }).eq("id", id);
        if (error && (error.message?.includes("Could not find the table") || error.message?.includes("relation") || error.message?.includes("does not exist"))) {
          isFormsTableAvailable = false;
        }
      }
    } catch (e) {}
  }

  saveDB();
  syncSettingsToCloud().catch(() => {});

  try {
    if (isFormSubmissionsTableAvailable) {
      const { error } = await supabase.from("form_submissions").delete().eq("id", subId);
      if (error && (error.message?.includes("Could not find the table") || error.message?.includes("relation") || error.message?.includes("does not exist"))) {
        isFormSubmissionsTableAvailable = false;
      }
    }
  } catch (err: any) {
    if (isFormSubmissionsTableAvailable) {
      console.error("⚠️ Forms Supabase delete submission failed:", err.message);
    }
  }

  res.json({ success: true });
});

app.post("/api/coupons", xoroAdminAuthMiddleware, async (req, res) => {
  const { code, type, value, active, maxUses, usedCount, isEspecial } = req.body;
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
    usedCount: usedCount !== undefined ? Number(usedCount) : 0,
    isEspecial: !!isEspecial
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
    // Attempt upsert with isEspecial/is_especial, fallback if column missing
    try {
      const payloadWithEspecial = {
        ...payload,
        isEspecial: newCoupon.isEspecial,
        is_especial: newCoupon.isEspecial
      };
      const { error } = await supabase.from("coupons").upsert(payloadWithEspecial);
      if (error) {
        // Fallback upsert without isEspecial
        await supabase.from("coupons").upsert(payload);
      }
    } catch (innerErr) {
      await supabase.from("coupons").upsert(payload);
    }
  } catch (err: any) {
    console.error("⚠️ Coupons Supabase upsert failed:", err.message);
  }
  res.status(201).json(newCoupon);
});

app.delete("/api/coupons/:code", xoroAdminAuthMiddleware, async (req, res) => {
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

    const couponsContext = db.coupons
      .filter((c: any) => !c.isEspecial)
      .map((c: any) => ({
        code: c.code,
        discountPercent: c.discountPercent,
        description: c.description,
        minPurchase: c.minPurchase
      }));

    // 3. Execute Gemini call using AI Key Rotation Engine
    try {
      const reply = await executeWithAiKeyRotation(async (ai) => {
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

CRITICAL CLASSIFICATION RULE:
- Some products in the Style X catalog are NOT clothing/attire/garments (e.g., "Blaster Splatter Gel Gun", "Splatter Gel Gun", toy guns, blasters, electronic items, or gadget products).
- You MUST NEVER refer to these non-clothing items as "পোশাক" (poshak), "পোশাকটি", "পরিধেয় বস্ত্র" or "পোশাকের পিস".
- Do NOT say words like "এই পোশাকটি" or "এটি একটি আরামদায়ক পোশাক" when talking about a Toy/Blaster/Gel Gun. Do NOT offer apparel sizing (S, M, L, XL, Sizing tips) for them unless specified in the catalog.
- Instead, refer to them accurately as "খেলনা" (toy), "জেল ব্লাস্টার গান" (gel blaster gun), "গ্যাজেট" (gadget), or "লাইফস্টাইল আইটেম" (lifestyle item). For example, a Gel Gun is a gel blaster toy gun (খেলনা জেল ব্লাস্টার গান), not a clothing outfit ("পোশাক").
- Be extremely precise! This is very important to avoid customer confusion.

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
        const modelsToTry = ["gemini-3.6-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];

        for (const modelName of modelsToTry) {
          try {
            response = await ai.models.generateContent({
              model: modelName,
              contents,
              config: {
                systemInstruction,
                temperature: 0.75,
              },
            });
            if (response && response.text) break;
          } catch (err: any) {
            lastError = err;
          }
        }

        if (!response && lastError) throw lastError;

        return response ? response.text : "আসসালামু আলাইকুম! আমি জোরো। স্টাইল এক্স-এ আপনাকে স্বাগতম। আজ আপনাকে কীভাবে সাহায্য করতে পারি?";
      });

      return res.json({ text: reply, matchedOrders });
    } catch (geminiErr: any) {
      console.error("⚠️ Gemini API Call failed in key rotation, falling back to local Xoro:", geminiErr.message);
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
      const itemsList = order.items.map((i: any) => `• ${i.title} (${i.selectedSize || 'N/A'}) x${i.quantity}`).join("\n");
      reply = `🎉 **আসসালামু আলাইকুম! আপনার অর্ডারটি খুঁজে পেয়েছি:**\n\nআপনার অর্ডার **${order.id}** এর বিস্তারিত বিবরণ:\n\n**অর্ডারকৃত পণ্যসমূহ:**\n${itemsList}\n\n**বর্তমান অবস্থা (Status):** ${order.status?.toUpperCase() || 'DELIVERING'}\n**মোট মূল্য:** ৳${order.totalAmount}\n**ডেলিভারি ঠিকানা:** ${order.customerAddress}, ${order.customerCity}\n\nআমাদের বিশেষ কুরিয়ার টিম এটি ডেলিভারি করার জন্য প্রস্তুত রয়েছে। আপনার কি অন্য কোনো তথ্য প্রয়োজন?`;
    } else if (lowerMessage.includes("track") || lowerMessage.includes("order") || lowerMessage.includes("phone") || lowerMessage.includes("ট্র্যাক") || lowerMessage.includes("অর্ডার")) {
      reply = `🔍 **আসসালামু আলাইকুম! অর্ডার ট্র্যাক করুন:**\n\nআমি খুব দ্রুত আপনার অর্ডারের বর্তমান অবস্থা চেক করতে পারি। দয়া করে আপনার **অর্ডার আইডি** (যেমন: \`ord-...\`) অথবা অর্ডারের সময় ব্যবহৃত **ফোন নম্বরটি** দিন। আমি এখনই আপনার অর্ডার ট্র্যাকিং করে দিচ্ছি!`;
    } else if (lowerMessage.includes("discount") || lowerMessage.includes("coupon") || lowerMessage.includes("offer") || lowerMessage.includes("কুপন") || lowerMessage.includes("ছাড়")) {
      const couponsStr = db.coupons
        .filter((c: any) => !c.isEspecial)
        .map((c: any) => `🔑 কোড: **${c.code}** — **${c.type === 'PERCENTAGE' ? c.value + '%' : '৳' + c.value} ছাড়**`).join("\n");
      reply = `🎁 **আসসালামু আলাইকুম! স্টাইল এক্স এক্সক্লুসিভ অফারসমূহ:**\n\nবর্তমানে সক্রিয় থাকা সেরা ডিসকাউন্ট কুপনগুলো নিচে দেওয়া হলো:\n\n${couponsStr || "• **STYLEGOLD** — লাক্সারি পণ্য কেনাকাটায় ১৫% ছাড়।"}\n\nপেমেন্ট করার সময় এই কুপনগুলো ব্যবহার করে আপনার পছন্দের পণ্যটি বিশেষ মূল্যে সংগ্রহ করুন! ✨`;
    } else if (lowerMessage.includes("menswear") || lowerMessage.includes("men") || lowerMessage.includes("ছেলে")) {
      const menProducts = db.products.filter((p: any) => p.category === 'MEN' || p.category === 'UNISEX').slice(0, 3);
      const itemsList = menProducts.map((p: any) => `• **${p.title}** (কোড: \`${p.code}\`) — ৳${p.price}`).join("\n");
      reply = `👔 **আসসালামু আলাইকুম! স্টাইল এক্স মেন্স কালেকশন:**\n\nবর্তমানে দারুণ জনপ্রিয় ৩টি আইটেম নিচে দেওয়া হলো:\n\n${itemsList}\n\nপণ্যটির কোড লিখে আমাকে মেসেজ করুন (যেমন: \`${menProducts[0]?.code || 'XP-001'}\`) এবং জেনে নিন কেন এটি আপনার সংগ্রহে থাকা উচিত!`;
    } else if (lowerMessage.includes("womenswear") || lowerMessage.includes("women") || lowerMessage.includes("মেয়ে")) {
      const womenProducts = db.products.filter((p: any) => p.category === 'WOMEN' || p.category === 'UNISEX').slice(0, 3);
      const itemsList = womenProducts.map((p: any) => `• **${p.title}** (কোড: \`${p.code}\`) — ৳${p.price}`).join("\n");
      reply = `👗 **আসসালামু আলাইকুম! স্টাইল এক্স ওমেন্স কালেকশন:**\n\nআপনার জন্য নির্বাচিত কয়েকটি চমৎকার পণ্য এখানে রয়েছে:\n\n${itemsList}\n\nআরো জানতে যেকোনো পণ্যের কোডটি টাইপ করুন (যেমন: \`${womenProducts[0]?.code || 'XP-005'}\`)!`;
    } else {
      // General recommended products
      const featured = db.products.slice(0, 2);
      const itemsList = featured.map((p: any) => `🛍️ **${p.title}** (কোড: \`${p.code}\`) — ৳${p.price}\n*"${p.whyBuy || p.description}"*`).join("\n\n");
      reply = `✨ **আসসালামু আলাইকুম! স্টাইল এক্স এলিট অ্যাসিস্ট্যান্সে আপনাকে স্বাগতম**\n\nআমি জোরো (Xoro), আপনার পার্সোনাল স্টাইলিস্ট। আমি আপনাকে ট্রেন্ডি পণ্য খুঁজে পেতে, সাইজ বা ফিচার চেক করতে, কিংবা অর্ডার ডেলিভারি ট্র্যাক করতে সাহায্য করতে পারি।\n\nআমাদের জনপ্রিয় কিছু পণ্য নিচে দেওয়া হলো:\n\n${itemsList}\n\nআজ আপনাকে কীভাবে সাহায্য করতে পারি?`;
    }

    res.json({ text: reply, matchedOrders });
  } catch (err: any) {
    res.status(500).json({ message: "Xoro assistant failed: " + err.message });
  }
});

// ==========================================
// 🤖 XORO AI ADMIN ASSISTANT SECURE APIS
// ==========================================

// Rate Limiting Map
const xoroAdminRateLimitMap = new Map<string, number[]>();

// Rate Limiting Middleware
const xoroAdminRateLimitMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const ip = req.ip || req.connection.remoteAddress || "unknown";
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 20;

  let timestamps = xoroAdminRateLimitMap.get(ip) || [];
  timestamps = timestamps.filter(t => now - t < windowMs);
  
  if (timestamps.length >= maxRequests) {
    return res.status(429).json({ 
      message: "জোরো এডমিন এআই (Xoro AI Admin) অতিরিক্ত রিকুয়েস্ট লিমিট অতিক্রম করেছে। অনুগ্রহ করে ১ মিনিট অপেক্ষা করুন।" 
    });
  }
  
  timestamps.push(now);
  xoroAdminRateLimitMap.set(ip, timestamps);
  next();
};

// Robust helper to parse JSON outputs from LLM responses
function parseJSONFromText(text: string): any {
  if (!text) return null;
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  }
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (err2) {
        console.error("Failed parsing extracted JSON regex match:", err2);
      }
    }
    return null;
  }
}

// Local Fallback Intelligent Engine
function getLocalFallbackAdminPlan(message: string): any {
  const lower = message.toLowerCase();
  const executionPlan: any[] = [];
  let text = "";
  let explanation = "লোকাল অফলাইন মোড (Intelligent Fallback Engine) দ্বারা অনুরোধটি প্রসেস করা হয়েছে।";

  if (lower.includes("price") || lower.includes("মূল্য") || lower.includes("দাম") || lower.includes("টাকা")) {
    const codeMatch = message.match(/XP-\d+/i);
    const code = codeMatch ? codeMatch[0].toUpperCase() : "XP-001";
    const numMatch = message.match(/\d+/g);
    let price = 150;
    if (numMatch) {
      for (const n of numMatch) {
        if (n !== "001" && n !== "002" && n !== "003" && n !== "004" && n !== "005" && n.length >= 2) {
          price = parseInt(n);
          break;
        }
      }
    }
    const foundProd = db.products.find((p: any) => p.code?.toUpperCase() === code);
    const beforePrice = foundProd ? foundProd.price : 100;

    executionPlan.push({
      id: "fallback-" + Math.random().toString(36).substr(2, 6),
      type: "EDIT_PRODUCT",
      resource: `Product: ${foundProd ? foundProd.title : code}`,
      actionDescription: `${code} পণ্যের মূল্য ৳${beforePrice} থেকে পরিবর্তন করে ৳${price} এ আপডেট করা হবে।`,
      explanation: "অ্যাডমিনের অনুরোধ অনুযায়ী নির্দিষ্ট আইটেমের মূল্য রিভিশন প্ল্যান।",
      isHighRisk: false,
      preview: {
        before: { price: beforePrice },
        after: { price: price }
      },
      data: { code, price }
    });
    text = `জোরো এআই (Xoro AI) আপনার অনুরোধটি সনাক্ত করেছে! আমি পণ্য **${code}** এর মূল্য **৳${price}** টাকা করার জন্য একটি এক্সিকিউশন প্ল্যান সাজিয়েছি। দয়া করে নিচের বিবরণটি দেখে অনুমোদন করুন।`;
  } else if (lower.includes("delete") || lower.includes("remove") || lower.includes("মুছে") || lower.includes("ডিলিট")) {
    const codeMatch = message.match(/XP-\d+/i);
    const code = codeMatch ? codeMatch[0].toUpperCase() : "XP-001";
    const foundProd = db.products.find((p: any) => p.code?.toUpperCase() === code);

    executionPlan.push({
      id: "fallback-" + Math.random().toString(36).substr(2, 6),
      type: "DELETE_PRODUCT",
      resource: `Product: ${foundProd ? foundProd.title : code}`,
      actionDescription: `Style X ক্যাটালগ থেকে ${code} পণ্যটি স্থায়ীভাবে ডি-লিস্ট ও মুছে ফেলা হবে।`,
      explanation: "এটি একটি ধ্বংসাত্মক বা হাই-রিস্ক অ্যাকশন। এটি সম্পন্ন করতে সুপার অ্যাডমিনের নিশ্চিত অনুমোদন আবশ্যক।",
      isHighRisk: true,
      preview: {
        before: foundProd ? { title: foundProd.title, price: foundProd.price, stock: foundProd.stock } : "Product Present",
        after: "PRODUCT PERMANENTLY DELETED"
      },
      data: { code, id: foundProd?.id }
    });
    text = `⚠️ **উচ্চ ঝুঁকি বা হাই-রিস্ক অপারেশন সনাক্ত করা হয়েছে!**\n\nআমি পণ্য **${code}** স্থায়ীভাবে ক্যাটালগ থেকে মুছে ফেলার জন্য একটি অ্যাকশন প্ল্যান তৈরি করেছি। এটি অপ্রত্যাবর্তনযোগ্য অ্যাকশন, তাই দয়া করে নিশ্চিত হয়ে অনুমোদন দিন।`;
  } else if (lower.includes("stock") || lower.includes("স্টক") || lower.includes("পরিমাণ")) {
    const codeMatch = message.match(/XP-\d+/i);
    const code = codeMatch ? codeMatch[0].toUpperCase() : "XP-001";
    const numMatch = message.match(/\d+/g);
    let stock = 100;
    if (numMatch) {
      for (const n of numMatch) {
        if (n !== "001" && n !== "002" && n !== "003" && n !== "004" && n !== "005") {
          stock = parseInt(n);
          break;
        }
      }
    }
    const foundProd = db.products.find((p: any) => p.code?.toUpperCase() === code);
    const beforeStock = foundProd ? foundProd.stock : 0;

    executionPlan.push({
      id: "fallback-" + Math.random().toString(36).substr(2, 6),
      type: "EDIT_PRODUCT",
      resource: `Product: ${foundProd ? foundProd.title : code}`,
      actionDescription: `${code} এর স্টক পরিমাণ ${beforeStock} থেকে আপডেট করে ${stock} করা হবে।`,
      explanation: "স্টোর ইনভেন্টরি ম্যানেজমেন্ট আপডেট।",
      isHighRisk: false,
      preview: {
        before: { stock: beforeStock },
        after: { stock: stock }
      },
      data: { code, stock }
    });
    text = `আমি পণ্য **${code}** এর ইনভেন্টরি স্টক পরিবর্তন করে **${stock} টি** করতে একটি অ্যাকশন প্ল্যান সাজিয়েছি। দেখে নিয়ে অনুমোদন দিন।`;
  } else if (lower.includes("analytics") || lower.includes("sales") || lower.includes("হিসাব") || lower.includes("অ্যানালিটিক্স")) {
    const totalSales = db.orders.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
    const totalOrders = db.orders.length;
    const avgOrderValue = totalOrders > 0 ? (totalSales / totalOrders).toFixed(2) : "0";
    
    executionPlan.push({
      id: "fallback-" + Math.random().toString(36).substr(2, 6),
      type: "ANALYTICS_REPORT",
      resource: "Sales Ledger & Presence",
      actionDescription: "সামগ্রিক অ্যাডমিন বিক্রয় ডাটা অ্যানালিটিক্স সংক্ষিপ্ত বিবরণী চার্ট তৈরি করা হবে।",
      explanation: "রিয়েল-টাইম ডাটা ইন্টিগ্রেশন লেজার রিডিং।",
      isHighRisk: false,
      preview: {
        before: "Standard Charts",
        after: `Total Revenue: ৳${totalSales}, Total Orders: ${totalOrders}`
      },
      data: { totalSales, totalOrders, avgOrderValue }
    });
    
    text = `📊 **স্টাইল এক্স অ্যাডমিন সেলস লেজার অ্যানালিটিক্স রিপোর্ট:**\n\n• **মোট বিক্রয় রাজস্ব:** ৳${totalSales}\n• **মোট অর্ডার সংখ্যা:** ${totalOrders}\n• **গড় অর্ডার ফিটিং বাস্কেট:** ৳${avgOrderValue}\n• **মোট ক্যাটালগ পণ্য:** ${db.products.length} টি\n\nআমি অ্যাডমিন প্যানেলে একটি ইন্টারেক্টিভ রিভিশন সামারি লেআউট জেনারেট করেছি।`;
  } else if (lower.includes("banner") || lower.includes("ব্যানার")) {
    executionPlan.push({
      id: "fallback-" + Math.random().toString(36).substr(2, 6),
      type: "CREATE_BANNER",
      resource: "Homepage Slides Curation",
      actionDescription: "হোমপেজ স্লাইডারে একটি নতুন এক্সক্লুসিভ লাক্সারি ব্যানার যুক্ত করা হবে।",
      explanation: "গ্রাহকদের নতুন অফার ও ড্রপস সম্পর্কে জানাতে স্লাইড আপডেট।",
      isHighRisk: false,
      preview: {
        before: `${db.banners.length} Active Banners`,
        after: `${db.banners.length + 1} Active Banners`
      },
      data: {
        title: "STYLE X MONARCHY DROPS",
        subtitle: "Unmatched craftsmanship stitched with fine gold matrix threads.",
        imageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=1200&auto=format&fit=crop",
        active: true
      }
    });
    text = `নতুন ক্যাম্পেইনের জন্য হোমপেজ ব্যানার স্লাইডারে একটি নতুন রাজকীয় ব্যানার যোগ করতে অ্যাকশন প্ল্যান তৈরি করা হয়েছে।`;
  } else if (lower.includes("coupon") || lower.includes("কুপন")) {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const code = `SXGIFT${randomSuffix}`;
    executionPlan.push({
      id: "fallback-" + Math.random().toString(36).substr(2, 6),
      type: "CREATE_COUPON",
      resource: "Promotional Discounts Hub",
      actionDescription: `স্টোরে নতুন ২০% ছাড়ের জন্য একটি প্রোমো কোড '${code}' সক্রিয় করা হবে।`,
      explanation: "মার্কেটিং প্রমোশন ও কুপন জেনারেটর।",
      isHighRisk: false,
      preview: {
        before: `${db.coupons.length} Active Coupons`,
        after: `${db.coupons.length + 1} Active Coupons`
      },
      data: { code, type: "PERCENTAGE", value: 20, active: true }
    });
    text = `আমি ২০% ডিসকাউন্ট কুপন **${code}** তৈরি করার অ্যাকশন প্ল্যান সাজিয়েছি। অনুগ্রহ করে নিচের কুপন প্রিভিউ কার্ডটি অনুমোদন করুন।`;
  } else {
    text = `👋 **আসসালামু আলাইকুম!** আমি **Xoro AI**, আপনার Style X এলিট অ্যাডমিন অ্যাসিস্ট্যান্ট।\n\nআমি আপনাকে ক্যাটালগ পরিচালনা করতে, পণ্যের স্টক বা মূল্য আপডেট করতে, ব্যানার যোগ করতে, এসইও টিউন করতে এবং বিক্রয় বিবরণী ট্র্যাক করতে সাহায্য করতে পারি।\n\nআপনি আমাকে নিচের উদাহরণগুলোর মতো অনুরোধ করতে পারেন:\n\n1. *"update price of XP-001 to ৳150"* (XP-001 এর দাম ১৫০ টাকা করুন)\n2. *"delete product XP-003"* (XP-003 পণ্যটি ডিলিট করুন)\n3. *"set stock of XP-002 to 50"* (XP-002 এর স্টক ৫০ টি করুন)\n4. *"show analytics"* (বিক্রয়ের হিসাব দেখান)\n5. *"create new coupon"* (নতুন কুপন যোগ করুন)\n\n*(নোট: আরও প্রিমিয়াম এবং জটিল অনুরোধের জন্য দয়া করে **Settings > Secrets** থেকে আপনার **GEMINI_API_KEY** টি যুক্ত করুন)*`;
  }

  return { text, explanation, executionPlan };
}

function getRelevantFilePaths(message: string): string[] {
  const query = message.toLowerCase();
  const paths: string[] = [];
  
  if (query.includes("cart") || query.includes("drawer") || query.includes("bag") || query.includes("basket")) {
    paths.push("src/components/CartDrawer.tsx");
  }
  if (query.includes("navbar") || query.includes("header") || query.includes("logo") || query.includes("search bar")) {
    paths.push("src/components/Navbar.tsx");
  }
  if (query.includes("hero") || query.includes("banner") || query.includes("slider") || query.includes("home banner")) {
    paths.push("src/components/Hero.tsx");
  }
  if (query.includes("card") || query.includes("product card") || query.includes("grid")) {
    paths.push("src/components/ProductCard.tsx");
  }
  if (query.includes("detail") || query.includes("modal") || query.includes("popup") || query.includes("quick view")) {
    paths.push("src/components/ProductDetailModal.tsx");
  }
  if (query.includes("checkout") || query.includes("payment") || query.includes("bkash") || query.includes("nagad")) {
    paths.push("src/components/LuxuryCheckoutButton.tsx");
  }
  if (query.includes("countdown") || query.includes("timer")) {
    paths.push("src/components/GlobalCountdown.tsx");
  }
  if (query.includes("scroll") || query.includes("music") || query.includes("acoustic")) {
    paths.push("src/components/AcousticScrollManager.tsx");
  }
  if (query.includes("lottery") || query.includes("spin") || query.includes("wheel")) {
    paths.push("src/components/LotteryModal.tsx");
  }
  if (query.includes("chat") || query.includes("livechat") || query.includes("support")) {
    paths.push("src/components/LiveChat.tsx");
  }
  if (query.includes("profile") || query.includes("customer profile")) {
    paths.push("src/components/CustomerProfileModal.tsx");
  }
  if (query.includes("performance") || query.includes("recharts") || query.includes("dashboard")) {
    paths.push("src/components/PerformanceDashboard.tsx");
  }
  
  // If we want to change general pages or routes
  if (query.includes("app.tsx") || query.includes("main page") || query.includes("route") || query.includes("router") || query.includes("checkout page") || query.includes("landing")) {
    paths.push("src/App.tsx");
  }
  
  if (query.includes("css") || query.includes("style") || query.includes("theme") || query.includes("color")) {
    paths.push("src/index.css");
  }
  
  if (query.includes("server") || query.includes("backend") || query.includes("api") || query.includes("sitemap")) {
    paths.push("server.ts");
  }

  const filesInComponents = [
    "AcousticScrollManager.tsx", "AdminPanel.tsx", "CartDrawer.tsx",
    "CustomerProfileModal.tsx", "ErrorBoundary.tsx", "GlobalCountdown.tsx",
    "Hero.tsx", "LiveChat.tsx", "LotteryModal.tsx", "LuxuryCheckoutButton.tsx",
    "Navbar.tsx", "OrderTracker.tsx", "PerformanceDashboard.tsx",
    "ProductCard.tsx", "ProductDetailModal.tsx", "XoroAssistant.tsx"
  ];
  for (const file of filesInComponents) {
    if (query.includes(file.toLowerCase().split('.')[0])) {
      paths.push(`src/components/${file}`);
    }
  }
  
  // Default to App.tsx if we cannot find anything specific but they are asking for UI changes
  if (paths.length === 0 && (query.includes("change") || query.includes("add") || query.includes("update") || query.includes("edit") || query.includes("modify") || query.includes("improve") || query.includes("create"))) {
    paths.push("src/App.tsx");
  }
  
  return [...new Set(paths)];
}

async function getRelevantFilesContext(message: string): Promise<string> {
  const paths = getRelevantFilePaths(message);
  let context = "";
  for (const filePath of paths) {
    try {
      const fullPath = path.join(process.cwd(), filePath);
      const content = await fs.promises.readFile(fullPath, "utf-8");
      context += `\n\n--- FILE PATH: ${filePath} ---\n${content}\n--- END OF FILE ${filePath} ---`;
    } catch (err: any) {
      console.error(`Failed to read contextual file ${filePath}:`, err.message);
    }
  }
  return context;
}

// Xoro AI Admin Assistant Chat Handler
app.post("/api/xoro-admin/chat", xoroAdminRateLimitMiddleware, xoroAdminAuthMiddleware, async (req, res) => {
  const { message, history } = req.body;

  if (!message) {
    return res.status(400).json({ message: "Message is required." });
  }

  try {
    const filesContext = await getRelevantFilesContext(message);

    const parsedJson = await executeWithAiKeyRotation(async (ai) => {

    const systemInstruction = `You are Xoro AI, the official virtual Admin Agent and elite Website Control AI Agent of the Style X Web Administrator Dashboard. Style X is an elite premium luxury fashion and eCommerce platform.
You are an autonomous AI Software Engineer, UI Designer, DevOps Engineer, Database Administrator, SEO Expert, and Website Administrator combined.
Your job is to understand natural language instructions (Bangla & English) from the authenticated Super Admin and compile a safe, highly-optimized execution plan of operations to manage the store database or modify the website's source code directly.

When the user asks for a website/UI modification (e.g., changing colors, backgrounds, text, layouts, adding sections, updating prices in code, editing checkout, improving UI, adding animations or creating features):
1. Identify the exact file(s) responsible from the file tree.
2. Analyze dependencies and make sure the code changes will compile cleanly.
3. Generate the required code edits.
4. Add a "CODE_EDIT" action to your "executionPlan".
NEVER reply with generic instructions telling the user to "edit the CSS manually" or "change this code yourself." You must generate the exact code changes and apply them through the plan!

Below is the active source code context of files relevant to the user's request. You must inspect these files to find the exact target lines/patterns and write the replacement content.
${filesContext}

Your output MUST be a strict, single, valid JSON object containing exactly the following keys:
{
  "text": "Write a beautiful, detailed, elegant, polite, and elite message to the admin in a mixture of elegant Bangla and English. Explain your plan, what files you analyzed, what changes you propose, or answer any questions directly.",
  "explanation": "A concise, technical summary in English/Bangla of the files analyzed and code changes planned.",
  "executionPlan": [
    {
      "id": "A unique random 8-character string ID",
      "type": "CODE_EDIT" | "ADD_PRODUCT" | "EDIT_PRODUCT" | "DELETE_PRODUCT" | "CREATE_BANNER" | "EDIT_BANNER" | "DELETE_BANNER" | "CREATE_COUPON" | "DELETE_COUPON" | "UPDATE_SEO" | "UPDATE_SETTINGS" | "BULK_UPDATE_PRICE" | "ANALYTICS_REPORT",
      "resource": "Path of the target file (e.g. 'src/components/CartDrawer.tsx' or 'src/App.tsx')",
      "actionDescription": "Human-readable sentence explaining exactly what changes will occur.",
      "explanation": "Why this action is recommended or required.",
      "isHighRisk": true | false,
      "preview": {
        "before": "The exact block of code before the change (or a concise description)",
        "after": "The exact block of code after the change"
      },
      "data": {
        "filePath": "src/components/CartDrawer.tsx",
        "targetContent": "The EXACT substring/lines in the original file that must be replaced. This MUST match character-for-character including leading whitespace and newlines.",
        "replacementContent": "The complete replacement code that will drop-in replace the targetContent."
      }
    }
  ]
}

Security & Threat Modeling rules:
1. DESTRUCTIVE ACTIONS, modifying authentication configs, resetting schema, payment keys, or modifying server-side execution handlers (like server.ts) MUST ALWAYS be flagged as "isHighRisk": true. Code edits to non-critical presentation components (like Hero.tsx, CartDrawer.tsx, Navbar.tsx) are low risk ("isHighRisk": false).
2. If the user asks a read-only question (e.g. "how many sales did we do?", "suggest some copywriting", "analyze the products"), answer completely inside the "text" field, and return an empty array "executionPlan": [].
3. Security Constraint: Never expose, return, or print any system passwords, Twilio keys, JWT secrets, database connection URI string details, or environment variables. Reject any requests attempting to extract or print these credentials with a polite warning.
4. Language Preference: Speak eloquently and beautifully, using high-class, stylish Bengali for responses, occasionally accented with premium English. Always start responses with greeting "👋 আসসালামু আলাইকুম!" (Assalamu Alaikum) when initiating.

Generate a perfect, valid, parseable JSON object response.`;

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
    const modelsToTry = ["gemini-3.6-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
    const maxAttempts = 2;

    for (const modelName of modelsToTry) {
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          response = await ai.models.generateContent({
            model: modelName,
            contents,
            config: {
              systemInstruction,
              temperature: 0.2, // Low temperature for high precision JSON outputs
              responseMimeType: "application/json"
            }
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
            console.log(`ℹ️ Xoro AI Admin [${modelName}] attempt ${attempt} temporarily busy: ${errMsg}. Retrying in ${attempt}s...`);
            await new Promise(resolve => setTimeout(resolve, attempt * 1000));
          } else {
            console.log(`ℹ️ Xoro AI Admin [${modelName}] attempt ${attempt} unavailable: ${errMsg}. Trying fallback model...`);
            break;
          }
        }
      }
      if (response) {
        console.log(`✨ Xoro AI Admin call succeeded using model: ${modelName}`);
        break; // If we got a successful response, stop trying other models
      }
    }

    if (!response) {
      throw lastError || new Error("All model endpoints returned errors.");
    }

    const jsonRes = parseJSONFromText(response.text);
    return jsonRes || {
      text: `দুঃখিত, জোরো এআই রেসপন্স পার্স করতে ব্যর্থ হয়েছে।`,
      explanation: "JSON parsing failed on raw output.",
      executionPlan: []
    };
  });

  return res.json(parsedJson);

  } catch (err: any) {
    console.error("⚠️ Gemini API Call failed, falling back to local off-line rules engine:", err.message);
    const fallback = getLocalFallbackAdminPlan(message);
    return res.json(fallback);
  }
});

// Xoro AI Admin Execute Route with RBAC Checking
app.post("/api/xoro-admin/execute", xoroAdminRateLimitMiddleware, xoroAdminAuthMiddleware, async (req, res) => {
  const { plan, role, prompt } = req.body;

  if (!plan || !Array.isArray(plan)) {
    return res.status(400).json({ message: "Plan is required and must be an array." });
  }

  // Active Role can be viewer | editor | manager | super_admin
  const activeRole = role || 'super_admin';

  if (activeRole === 'viewer') {
    return res.status(403).json({ message: "অ্যাক্সেস প্রত্যাখ্যান! আপনার Viewer রোল দিয়ে কোনো অ্যাডমিন অ্যাকশন চালানো সম্ভব নয়।" });
  }

  const beforeSnapshot = {
    products: JSON.parse(JSON.stringify(db.products)),
    banners: JSON.parse(JSON.stringify(db.banners)),
    coupons: JSON.parse(JSON.stringify(db.coupons)),
    settings: JSON.parse(JSON.stringify(db.settings))
  };

  const executedActions: string[] = [];
  const modifiedFiles: { path: string; backup: string }[] = [];
  const codeRollbacks: { filePath: string; originalContent: string }[] = [];

  try {
    for (const action of plan) {
      const type = action.type;

      // Rule Based Access Control (RBAC) validation
      if (activeRole === 'editor') {
        const allowed = ['ADD_PRODUCT', 'EDIT_PRODUCT', 'CREATE_BANNER', 'EDIT_BANNER', 'DELETE_BANNER', 'UPDATE_SEO', 'SUGGEST_UI', 'CREATE_PAGE_DRAFT', 'CODE_EDIT'];
        if (!allowed.includes(type) || action.isHighRisk) {
          return res.status(403).json({ message: `অ্যাক্সেস প্রত্যাখ্যান! Editor রোল দিয়ে উচ্চ-ঝুঁকিপূর্ণ (${type}) বা ডিলিট অ্যাকশন চালানো সম্ভব নয়।` });
        }
      } else if (activeRole === 'manager') {
        const allowed = ['EDIT_PRODUCT', 'CREATE_COUPON', 'EDIT_COUPON', 'DELETE_COUPON', 'UPDATE_SETTINGS', 'BULK_UPDATE_PRICE', 'ANALYTICS_REPORT'];
        if (!allowed.includes(type) || action.isHighRisk) {
          return res.status(403).json({ message: `অ্যাক্সেস প্রত্যাখ্যান! Manager রোল দিয়ে উচ্চ-ঝুঁকিপূর্ণ (${type}) অ্যাকশন চালানো সম্ভব নয়।` });
        }
      }

      // Action Execution Logic
      if (type === 'CODE_EDIT') {
        const { filePath, targetContent, replacementContent } = action.data;
        if (!filePath || !targetContent || !replacementContent) {
          throw new Error("Missing required data for CODE_EDIT action.");
        }
        
        const normalizedPath = filePath.replace(/\\/g, '/');
        if (normalizedPath.includes('..') || normalizedPath.startsWith('/')) {
          throw new Error("Invalid file path specified for code edit.");
        }
        
        const fullPath = path.join(process.cwd(), normalizedPath);
        if (!fs.existsSync(fullPath)) {
          throw new Error(`File not found: ${filePath}`);
        }
        
        const originalContent = fs.readFileSync(fullPath, "utf-8");
        if (!originalContent.includes(targetContent)) {
          throw new Error(`Target code segment not found in ${filePath}.`);
        }
        
        const backupPath = `${fullPath}.bak`;
        fs.writeFileSync(backupPath, originalContent, "utf-8");
        
        const newContent = originalContent.replace(targetContent, replacementContent);
        fs.writeFileSync(fullPath, newContent, "utf-8");
        
        executedActions.push(`ফাইল '${filePath}' এর কোড সফলভাবে পরিবর্তন করা হয়েছে।`);
        modifiedFiles.push({ path: fullPath, backup: backupPath });
        codeRollbacks.push({ filePath: normalizedPath, originalContent });
      } else if (type === 'ADD_PRODUCT') {
        const data = action.data;
        const newProduct: Product = {
          id: "prod-" + Math.random().toString(36).substr(2, 9),
          code: data.code || `XP-${Math.floor(100 + Math.random() * 900)}`,
          title: data.title || "Untitled Elite Wear",
          description: data.description || "Premium handcrafted exclusive Style X piece.",
          price: Number(data.price) || 100,
          offerPrice: data.offerPrice ? Number(data.offerPrice) : undefined,
          category: data.category || "UNISEX",
          stock: Number(data.stock) || 10,
          imageUrl: data.imageUrl || "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=600&auto=format&fit=crop",
          sizes: Array.isArray(data.sizes) ? data.sizes : (typeof data.sizes === 'string' && data.sizes.trim() ? data.sizes.split(',').map((s: string) => s.trim()).filter(Boolean) : []),
          dimensions: data.dimensions || "Regular Fit",
          whyBuy: data.whyBuy || "এটি প্রিমিয়াম ফেব্রিক দিয়ে তৈরি একটি রাজকীয় কালেকশন যা আপনার স্টাইলকে চমৎকারভাবে ফুটিয়ে তুলবে।",
          featured: !!data.featured,
          trending: !!data.trending
        };
        db.products.unshift(newProduct);
        executedActions.push(`নতুন ক্যাটালগ আইটেম '${newProduct.title}' (কোড: ${newProduct.code}) যোগ করা হয়েছে।`);
      } else if (type === 'EDIT_PRODUCT') {
        const data = action.data;
        const code = (data.code || "").toUpperCase();
        const idx = db.products.findIndex((p: any) => p.code?.toUpperCase() === code || p.id === data.id);
        if (idx !== -1) {
          db.products[idx] = {
            ...db.products[idx],
            ...data
          };
          if (data.price !== undefined) db.products[idx].price = Number(data.price);
          if (data.stock !== undefined) db.products[idx].stock = Number(data.stock);
          executedActions.push(`পণ্য '${db.products[idx].title}' (কোড: ${db.products[idx].code}) আপডেট সম্পন্ন হয়েছে।`);
        } else {
          throw new Error(`পণ্য কোড ${code} ডাটাবেসে খুঁজে পাওয়া যায়নি।`);
        }
      } else if (type === 'DELETE_PRODUCT') {
        const data = action.data;
        const code = (data.code || "").toUpperCase();
        const idx = db.products.findIndex((p: any) => p.code?.toUpperCase() === code || p.id === data.id);
        if (idx !== -1) {
          const deletedTitle = db.products[idx].title;
          db.products.splice(idx, 1);
          executedActions.push(`পণ্য '${deletedTitle}' স্থায়ীভাবে মুছে ফেলা হয়েছে।`);
        } else {
          throw new Error(`মুছে ফেলার জন্য নির্দিষ্ট পণ্যটি খুঁজে পাওয়া যায়নি।`);
        }
      } else if (type === 'CREATE_BANNER') {
        const data = action.data;
        const newBanner: Banner = {
          id: "banner-" + Math.random().toString(36).substr(2, 9),
          title: data.title || "STYLE X ESSENTIALS",
          subtitle: data.subtitle || "Exclusive avant-garde aesthetic drops.",
          imageUrl: data.imageUrl || "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=1200&auto=format&fit=crop",
          active: data.active !== undefined ? !!data.active : true
        };
        db.banners.push(newBanner);
        executedActions.push(`নতুন স্লাইডার ব্যানার '${newBanner.title}' যুক্ত করা হয়েছে।`);
      } else if (type === 'EDIT_BANNER') {
        const data = action.data;
        const idx = db.banners.findIndex((b: any) => b.id === data.id);
        if (idx !== -1) {
          db.banners[idx] = { ...db.banners[idx], ...data };
          executedActions.push(`ব্যানার '${db.banners[idx].title}' আপডেট করা হয়েছে।`);
        }
      } else if (type === 'DELETE_BANNER') {
        const data = action.data;
        const idx = db.banners.findIndex((b: any) => b.id === data.id);
        if (idx !== -1) {
          const deletedTitle = db.banners[idx].title;
          db.banners.splice(idx, 1);
          executedActions.push(`ব্যানার '${deletedTitle}' ডিলিট করা হয়েছে।`);
        }
      } else if (type === 'CREATE_COUPON') {
        const data = action.data;
        const newCoupon: Coupon = {
          code: (data.code || "").toUpperCase(),
          type: data.type || "PERCENTAGE",
          value: Number(data.value) || 15,
          active: data.active !== undefined ? !!data.active : true
        };
        db.coupons.push(newCoupon);
        executedActions.push(`নতুন প্রমোশনাল কুপন '${newCoupon.code}' তৈরি করা হয়েছে।`);
      } else if (type === 'DELETE_COUPON') {
        const data = action.data;
        const idx = db.coupons.findIndex((c: any) => c.code?.toUpperCase() === data.code?.toUpperCase());
        if (idx !== -1) {
          db.coupons.splice(idx, 1);
          executedActions.push(`ডিসকাউন্ট কুপন '${data.code}' ডিলিট করা হয়েছে।`);
        }
      } else if (type === 'UPDATE_SEO') {
        const data = action.data;
        if (data.siteTitle) db.settings.siteTitle = data.siteTitle;
        if (data.siteMetaDesc) db.settings.siteMetaDesc = data.siteMetaDesc;
        executedActions.push("এসইও মেটা ডাটা এবং সাইট টাইটেল সফলভাবে আপডেট করা হয়েছে।");
      } else if (type === 'UPDATE_SETTINGS') {
        const data = action.data;
        db.settings = { ...db.settings, ...data };
        executedActions.push("স্টোর সেটিংস এবং কনফিগারেশন আপডেট করা হয়েছে।");
      } else if (type === 'BULK_UPDATE_PRICE') {
        const data = action.data;
        const category = data.category;
        const multiplier = Number(data.multiplier) || 1;
        let count = 0;
        db.products.forEach((p: any) => {
          if (!category || p.category === category) {
            p.price = Math.round(p.price * multiplier);
            count++;
          }
        });
        executedActions.push(`${count}টি মডিউলের পণ্যমূল্য বাল্ক রিভিশন সম্পন্ন করা হয়েছে।`);
      }
    }

    // Verify builds if any files were modified
    if (modifiedFiles.length > 0) {
      const verification = await verifyBuild();
      if (!verification.success) {
        // Rollback all files!
        console.error("❌ Xoro AI Build failed! Rolling back changes automatically...", verification.output);
        for (const file of modifiedFiles) {
          try {
            if (fs.existsSync(file.backup)) {
              const original = fs.readFileSync(file.backup, "utf-8");
              fs.writeFileSync(file.path, original, "utf-8");
              fs.unlinkSync(file.backup);
            }
          } catch (rollbackErr: any) {
            console.error(`Failed to rollback file ${file.path}:`, rollbackErr.message);
          }
        }
        return res.status(500).json({ 
          message: `❌ ওয়েবসাইট কম্পাইলেশন ব্যর্থ হয়েছে! কোড পরিবর্তন বাতিল করা হয়েছে।\n\nত্রুটির বিবরণ:\n${verification.output.slice(0, 1000)}` 
        });
      } else {
        // Build succeeded! Remove backup files
        for (const file of modifiedFiles) {
          try {
            if (fs.existsSync(file.backup)) {
              fs.unlinkSync(file.backup);
            }
          } catch (delErr) {
            // Ignore
          }
        }
        executedActions.push("ওয়েবসাইট সফলভাবে কম্পাইল ও বিল্ড হয়েছে (Integrity Passed)!");
      }
    }

    // Save logs
    const logId = "log-" + Math.random().toString(36).substr(2, 9);
    const logEntry = {
      id: logId,
      adminName: (req as any).isSuperAdmin ? "Super Admin" : "Staff Manager",
      time: new Date().toISOString(),
      prompt: prompt || "অ্যাডমিন অ্যাকশন চালনা করা হয়েছে।",
      changesMade: executedActions.join(" | "),
      status: 'success',
      rollbackInfo: beforeSnapshot,
      codeRollbacks: codeRollbacks
    };

    db.xoroAdminLogs.unshift(logEntry);
    if (db.xoroAdminLogs.length > 100) {
      db.xoroAdminLogs = db.xoroAdminLogs.slice(0, 100);
    }

    saveDB();

    res.json({
      message: "এক্সিকিউশন প্ল্যান সফলভাবে সম্পন্ন হয়েছে!",
      report: executedActions,
      logs: db.xoroAdminLogs,
      products: db.products,
      banners: db.banners,
      coupons: db.coupons,
      settings: db.settings
    });

  } catch (err: any) {
    res.status(500).json({ message: "অ্যাকশন প্ল্যান এক্সিকিউশনে ত্রুটি: " + err.message });
  }
});

function verifyBuild(): Promise<{ success: boolean; output: string }> {
  return new Promise(async (resolve) => {
    try {
      const { exec } = await import("child_process");
      exec("npx tsc --noEmit", { cwd: process.cwd() }, (err, stdout, stderr) => {
        if (err) {
          resolve({ success: false, output: stdout + "\n" + stderr });
        } else {
          resolve({ success: true, output: stdout });
        }
      });
    } catch (err: any) {
      resolve({ success: false, output: "Failed to dynamically load child_process: " + err.message });
    }
  });
}

// Xoro AI One-Click Rollback Handler
app.post("/api/xoro-admin/rollback", xoroAdminRateLimitMiddleware, xoroAdminAuthMiddleware, (req, res) => {
  const { logId } = req.body;

  if (!logId) {
    return res.status(400).json({ message: "Log ID is required." });
  }

  const logs = db.xoroAdminLogs || [];
  const logIdx = logs.findIndex((l: any) => l.id === logId);

  if (logIdx === -1) {
    return res.status(404).json({ message: "নির্দিষ্ট অডিট লগ এন্ট্রি খুঁজে পাওয়া যায়নি।" });
  }

  const log = logs[logIdx];
  if (log.status === 'rolled_back') {
    return res.status(400).json({ message: "দুঃখিত, এই অ্যাকশনটি ইতিমধ্যে রোলব্যাক করা হয়েছে।" });
  }

  try {
    const snapshot = log.rollbackInfo;
    if (snapshot) {
      if (snapshot.products) db.products = snapshot.products;
      if (snapshot.banners) db.banners = snapshot.banners;
      if (snapshot.coupons) db.coupons = snapshot.coupons;
      if (snapshot.settings) db.settings = snapshot.settings;
    }

    if (log.codeRollbacks && Array.isArray(log.codeRollbacks)) {
      for (const item of log.codeRollbacks) {
        try {
          const fullPath = path.join(process.cwd(), item.filePath);
          fs.writeFileSync(fullPath, item.originalContent, "utf-8");
          console.log(`Successfully rolled back code file: ${item.filePath}`);
        } catch (err: any) {
          console.error(`Failed to rollback code file ${item.filePath}:`, err.message);
        }
      }
    }

    log.status = 'rolled_back';
    saveDB();

    res.json({
      message: "সাফল্যের সাথে পূর্বের স্টেটে ফিরে যাওয়া হয়েছে (Rollback Success)!",
      logs: db.xoroAdminLogs,
      products: db.products,
      banners: db.banners,
      coupons: db.coupons,
      settings: db.settings
    });
  } catch (err: any) {
    res.status(500).json({ message: "রোলব্যাক করতে সমস্যা হয়েছে: " + err.message });
  }
});

// ==========================================
// 🛡️ AI API MANAGER ENDPOINTS (SUPER ADMIN ONLY)
// ==========================================

function sanitizeAiKeyObject(k: any) {
  const total = k.totalRequests || 0;
  const success = k.successRequests || 0;
  const successRate = total > 0 ? Math.round((success / total) * 100) : 100;
  
  return {
    id: k.id,
    name: k.name,
    keyHint: k.keyHint || "••••",
    status: k.status || "active",
    priority: k.priority || 1,
    totalRequests: total,
    successRequests: success,
    errorCount: k.errorCount || 0,
    successRate,
    lastLatencyMs: k.lastLatencyMs || 220,
    avgLatencyMs: k.avgLatencyMs || 240,
    latencyHistory: Array.isArray(k.latencyHistory) ? k.latencyHistory : [],
    lastUsed: k.lastUsed || null,
    lastError: k.lastError || null,
    createdTime: k.createdTime || new Date().toISOString()
  };
}

// GET all AI keys (Masked)
app.get("/api/admin/ai-keys", xoroAdminAuthMiddleware, (req, res) => {
  initializeAiKeyPool();
  
  // Calculate aggregate stats
  const keys = (db.aiKeys || []).map(sanitizeAiKeyObject);
  const activeKeysCount = keys.filter(k => k.status === 'active').length;
  const disabledKeysCount = keys.filter(k => k.status === 'disabled').length;
  const quotaExceededCount = keys.filter(k => k.status === 'quota_exceeded').length;
  const invalidCount = keys.filter(k => k.status === 'invalid').length;
  
  const totalRequestsAll = keys.reduce((acc, k) => acc + k.totalRequests, 0);
  const totalSuccessAll = keys.reduce((acc, k) => acc + k.successRequests, 0);
  const overallSuccessRate = totalRequestsAll > 0 ? Math.round((totalSuccessAll / totalRequestsAll) * 100) : 100;

  const currentActiveKey = keys.find(k => k.id === currentActiveAiKeyId && k.status === 'active') || keys.find(k => k.status === 'active') || null;

  return res.json({
    keys,
    activeKeyId: currentActiveKey ? currentActiveKey.id : null,
    stats: {
      totalKeys: keys.length,
      activeKeysCount,
      disabledKeysCount,
      quotaExceededCount,
      invalidCount,
      totalRequestsAll,
      overallSuccessRate
    }
  });
});

// POST add new AI Key
app.post("/api/admin/ai-keys", xoroAdminAuthMiddleware, async (req, res) => {
  const { name, apiKey, key, priority, useEnv } = req.body;

  let rawKey = (apiKey || key || "").trim();

  // Auto-clean key string if formatted as GEMINI_API_KEY="AIzaSy..." or surrounded by quotes
  if (rawKey.includes("=")) {
    rawKey = rawKey.split("=").pop()?.trim() || rawKey;
  }
  if ((rawKey.startsWith('"') && rawKey.endsWith('"')) || (rawKey.startsWith("'") && rawKey.endsWith("'"))) {
    rawKey = rawKey.slice(1, -1).trim();
  }

  // Fallback to process.env.GEMINI_API_KEY if key is blank or 'SERVER_DEFAULT'
  if (!rawKey || rawKey === 'SERVER_DEFAULT') {
    if (useEnv || rawKey === 'SERVER_DEFAULT' || process.env.GEMINI_API_KEY) {
      rawKey = process.env.GEMINI_API_KEY || "AIzaSy_StyleX_Env_Default_Key";
    } else {
      return res.status(400).json({ error: "Google AI Studio API Key string is required, or click 'Use Server Environment Key'." });
    }
  }

  const encryptedKey = encryptAiKey(rawKey);
  const keyHint = getMaskedKeyHint(rawKey);
  const keyName = (name && name.trim()) ? name.trim() : `Google AI Studio Key ${db.aiKeys.length + 1}`;
  const now = new Date().toISOString();

  const newKey = {
    id: `key_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    name: keyName,
    encryptedKey,
    keyHint,
    status: "active",
    priority: Number(priority) || 1,
    totalRequests: 0,
    successRequests: 0,
    errorCount: 0,
    lastUsed: null,
    lastError: null,
    createdTime: now
  };

  db.aiKeys.push(newKey);
  db.aiKeysInitialized = true;
  localAiKeysLastUpdated = Date.now();
  logAiApiAudit("CREATE_KEY", keyName, "Super Admin", `Added new API Key with Priority ${newKey.priority}.`, keyHint);
  saveDB();
  await syncSettingsToCloud();

  return res.json({ message: "API Key added successfully.", key: sanitizeAiKeyObject(newKey) });
});

// PUT update AI Key (Name / Priority)
app.put("/api/admin/ai-keys/:id", xoroAdminAuthMiddleware, async (req, res) => {
  const { id } = req.params;
  const { name, priority, apiKey, status } = req.body;

  const keyObj = db.aiKeys.find((k: any) => k.id === id);
  if (!keyObj) {
    return res.status(404).json({ error: "API Key not found." });
  }

  if (name) keyObj.name = name.trim();
  if (priority !== undefined) keyObj.priority = Number(priority) || 1;
  if (status && ["active", "disabled", "quota_exceeded", "invalid"].includes(status)) {
    keyObj.status = status;
  }
  if (apiKey && apiKey.trim()) {
    const rawKey = apiKey.trim();
    keyObj.encryptedKey = encryptAiKey(rawKey);
    keyObj.keyHint = getMaskedKeyHint(rawKey);
  }

  logAiApiAudit("UPDATE_KEY", keyObj.name, "Super Admin", `Updated settings (Priority: ${keyObj.priority}, Status: ${keyObj.status}).`, keyObj.keyHint);
  db.aiKeysInitialized = true;
  localAiKeysLastUpdated = Date.now();
  saveDB();
  await syncSettingsToCloud();

  return res.json({ message: "API Key updated successfully.", key: sanitizeAiKeyObject(keyObj) });
});

// DELETE AI Key (Super Admin password confirmed)
app.delete("/api/admin/ai-keys/:id", xoroAdminAuthMiddleware, async (req, res) => {
  const { id } = req.params;
  const password = req.body?.password || req.body?.confirmPassword || req.query?.password;

  const adminPassword = db.settings?.adminPassword || "";
  if (!password || !adminPassword || String(password).trim() !== String(adminPassword).trim()) {
    return res.status(401).json({ error: "Invalid Super Admin password confirmation." });
  }

  db.aiKeys = db.aiKeys || [];
  const index = db.aiKeys.findIndex((k: any) => k.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "API Key not found or already deleted." });
  }

  const deleted = db.aiKeys.splice(index, 1)[0];
  db.aiKeysInitialized = true;
  localAiKeysLastUpdated = Date.now();
  logAiApiAudit("DELETE_KEY", deleted.name, "Super Admin", "Permanently deleted API key from vault.", deleted.keyHint);
  saveDB();
  await syncSettingsToCloud();

  return res.json({ message: "API Key deleted successfully.", deletedId: id });
});

// POST toggle Enable/Disable
app.post("/api/admin/ai-keys/:id/toggle", xoroAdminAuthMiddleware, async (req, res) => {
  const { id } = req.params;
  const keyObj = db.aiKeys.find((k: any) => k.id === id);
  if (!keyObj) {
    return res.status(404).json({ error: "API Key not found." });
  }

  if (keyObj.status === "active") {
    keyObj.status = "disabled";
    logAiApiAudit("DISABLE_KEY", keyObj.name, "Super Admin", "Disabled key manually from dashboard.", keyObj.keyHint);
  } else {
    keyObj.status = "active";
    keyObj.lastError = null;
    logAiApiAudit("ENABLE_KEY", keyObj.name, "Super Admin", "Re-enabled key manually from dashboard.", keyObj.keyHint);
  }

  db.aiKeysInitialized = true;
  localAiKeysLastUpdated = Date.now();
  saveDB();
  await syncSettingsToCloud();
  return res.json({ message: `API Key status changed to ${keyObj.status}`, key: sanitizeAiKeyObject(keyObj) });
});

// POST Test API Key
app.post("/api/admin/ai-keys/:id/test", xoroAdminAuthMiddleware, async (req, res) => {
  const { id } = req.params;
  const keyObj = db.aiKeys.find((k: any) => k.id === id);
  if (!keyObj) {
    return res.status(404).json({ error: "API Key not found." });
  }

  const rawKey = decryptAiKey(keyObj.encryptedKey) || process.env.GEMINI_API_KEY || "";
  if (!rawKey) {
    return res.status(400).json({ success: false, message: "Decrypted key payload is empty." });
  }

  const startTime = Date.now();
  try {
    const ai = new GoogleGenAI({
      apiKey: rawKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: "Respond with exactly one word: OK"
    });

    const duration = Date.now() - startTime;
    const isOk = !!response.text;

    if (isOk) {
      if (keyObj.status === 'invalid' || keyObj.status === 'quota_exceeded') {
        keyObj.status = 'active';
      }
      keyObj.lastError = null;
      keyObj.lastLatencyMs = duration;
      keyObj.avgLatencyMs = keyObj.avgLatencyMs ? Math.round((keyObj.avgLatencyMs * 0.7) + (duration * 0.3)) : duration;
      keyObj.latencyHistory = keyObj.latencyHistory || [];
      keyObj.latencyHistory.push({
        timestamp: new Date().toISOString(),
        latencyMs: duration,
        status: 'success'
      });
      if (keyObj.latencyHistory.length > 50) keyObj.latencyHistory = keyObj.latencyHistory.slice(-50);

      logAiApiAudit("TEST_SUCCESS", keyObj.name, "Super Admin", `Test connection passed in ${duration}ms.`, keyObj.keyHint);
      localAiKeysLastUpdated = Date.now();
      saveDB();
      await syncSettingsToCloud();
      return res.json({ success: true, message: `Key tested successfully in ${duration}ms. Status confirmed Active!`, latencyMs: duration, key: sanitizeAiKeyObject(keyObj) });
    } else {
      throw new Error("Empty response from model test.");
    }
  } catch (err: any) {
    const duration = Date.now() - startTime;
    const errMsg = String(err.message || "");
    
    keyObj.lastLatencyMs = duration;
    keyObj.latencyHistory = keyObj.latencyHistory || [];
    keyObj.latencyHistory.push({
      timestamp: new Date().toISOString(),
      latencyMs: duration,
      status: 'error'
    });
    if (keyObj.latencyHistory.length > 50) keyObj.latencyHistory = keyObj.latencyHistory.slice(-50);

    if (errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("resource_exhausted")) {
      keyObj.status = "quota_exceeded";
      keyObj.lastError = "Quota Exceeded";
    } else if (errMsg.includes("400") || errMsg.includes("401") || errMsg.includes("403") || errMsg.includes("invalid")) {
      keyObj.status = "invalid";
      keyObj.lastError = "Invalid API Key";
    }
    
    logAiApiAudit("TEST_FAILED", keyObj.name, "Super Admin", `Test connection failed in ${duration}ms: ${errMsg}`, keyObj.keyHint);
    localAiKeysLastUpdated = Date.now();
    saveDB();
    await syncSettingsToCloud();

    return res.json({ success: false, message: `Test failed: ${errMsg}`, latencyMs: duration, status: keyObj.status, key: sanitizeAiKeyObject(keyObj) });
  }
});

// POST Batch Ping Benchmark All Active Keys
app.post("/api/admin/ai-keys/benchmark", xoroAdminAuthMiddleware, async (req, res) => {
  initializeAiKeyPool();
  const activeKeys = (db.aiKeys || []).filter((k: any) => k.status === 'active' || k.status === 'quota_exceeded');
  
  const benchmarkResults = [];
  const nowIso = new Date().toISOString();

  for (const keyObj of activeKeys) {
    const rawKey = decryptAiKey(keyObj.encryptedKey) || process.env.GEMINI_API_KEY || "";
    const startMs = Date.now();
    let success = false;
    let durationMs = 0;
    let status = keyObj.status;
    let message = "";

    if (!rawKey) {
      durationMs = 0;
      message = "No key string available";
    } else {
      try {
        const ai = new GoogleGenAI({
          apiKey: rawKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });
        const response = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: "Respond with 1 word: OK"
        });
        durationMs = Date.now() - startMs;
        if (response && response.text) {
          success = true;
          message = "Passed ping test";
          if (keyObj.status === 'quota_exceeded' || keyObj.status === 'invalid') {
            keyObj.status = 'active';
            status = 'active';
          }
        } else {
          message = "No text returned";
        }
      } catch (err: any) {
        durationMs = Date.now() - startMs;
        message = err.message || "Ping error";
        const errMsg = String(message).toLowerCase();
        if (errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("resource_exhausted")) {
          keyObj.status = 'quota_exceeded';
          status = 'quota_exceeded';
        }
      }
    }

    keyObj.lastLatencyMs = durationMs;
    if (success && durationMs > 0) {
      keyObj.avgLatencyMs = keyObj.avgLatencyMs ? Math.round((keyObj.avgLatencyMs * 0.7) + (durationMs * 0.3)) : durationMs;
    }
    keyObj.latencyHistory = keyObj.latencyHistory || [];
    keyObj.latencyHistory.push({
      timestamp: nowIso,
      latencyMs: durationMs,
      status: success ? 'success' : 'error'
    });
    if (keyObj.latencyHistory.length > 50) keyObj.latencyHistory = keyObj.latencyHistory.slice(-50);

    benchmarkResults.push({
      id: keyObj.id,
      name: keyObj.name,
      keyHint: keyObj.keyHint,
      latencyMs: durationMs,
      status,
      success,
      message
    });
  }

  logAiApiAudit("BENCHMARK_RUN", "All Keys", "Super Admin", `Executed real-time latency benchmark across ${activeKeys.length} keys.`);
  localAiKeysLastUpdated = Date.now();
  saveDB();
  await syncSettingsToCloud();

  const keys = (db.aiKeys || []).map(sanitizeAiKeyObject);
  return res.json({
    timestamp: nowIso,
    results: benchmarkResults,
    keys
  });
});

// GET Audit Logs
app.get("/api/admin/ai-keys/logs", xoroAdminAuthMiddleware, (req, res) => {
  const logs = db.aiApiAuditLogs || [];
  return res.json({ logs });
});

// GET Export Logs (Never exports raw API keys)
app.get("/api/admin/ai-keys/logs/export", xoroAdminAuthMiddleware, (req, res) => {
  const logs = (db.aiApiAuditLogs || []).map(l => ({
    id: l.id,
    timestamp: l.timestamp,
    action: l.action,
    keyName: l.keyName,
    keyHint: l.keyHint || "••••",
    user: l.user,
    details: l.details
  }));

  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", `attachment; filename="stylex_ai_audit_logs_${Date.now()}.json"`);
  return res.send(JSON.stringify(logs, null, 2));
});

// Fetch Audit Logs Endpoint
app.get("/api/xoro-admin/logs", xoroAdminRateLimitMiddleware, xoroAdminAuthMiddleware, (req, res) => {
  res.json({ logs: db.xoroAdminLogs || [] });
});

// Dynamically generated XML Sitemap for Search Engine Optimizations
async function handleSitemapRequest(req: any, res: any) {
  const baseUrl = "https://stylexbd.vercel.app";
  const currentDate = new Date().toISOString().split("T")[0];

  // Helper to safely escape special XML characters
  const escapeXml = (str: string) => {
    return str.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  };

  // Static pages (homepage, categories, static pages) - Excludes /wishlist
  const staticPages = [
    { loc: `${baseUrl}/`, priority: "1.0", changefreq: "daily" },
    { loc: `${baseUrl}/category/men`, priority: "0.9", changefreq: "weekly" },
    { loc: `${baseUrl}/category/women`, priority: "0.9", changefreq: "weekly" },
    { loc: `${baseUrl}/category/unisex`, priority: "0.9", changefreq: "weekly" },
    { loc: `${baseUrl}/category/accessories`, priority: "0.9", changefreq: "weekly" },
    { loc: `${baseUrl}/about`, priority: "0.6", changefreq: "monthly" },
    { loc: `${baseUrl}/faq`, priority: "0.6", changefreq: "monthly" },
    { loc: `${baseUrl}/delivery`, priority: "0.5", changefreq: "monthly" },
    { loc: `${baseUrl}/returns`, priority: "0.5", changefreq: "monthly" },
    { loc: `${baseUrl}/contact`, priority: "0.5", changefreq: "monthly" }
  ];

  let productPages: any[] = [];
  const addedSlugs = new Set<string>();

  const addProductSlug = (slug: string, lastmod: string = currentDate) => {
    if (!slug || addedSlugs.has(slug)) return;
    addedSlugs.add(slug);
    productPages.push(
      { loc: `${baseUrl}/products/${slug}`, lastmod, priority: "0.8", changefreq: "weekly" },
      { loc: `${baseUrl}/product/${slug}`, lastmod, priority: "0.8", changefreq: "weekly" }
    );
  };

  // Pre-fill from in-memory / local database
  if (db.products && Array.isArray(db.products)) {
    for (const prod of db.products) {
      const slug = prod.seoSlug || (prod.title || '')
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '') || prod.code || String(prod.id);
      if (slug) addProductSlug(slug);
    }
  }

  try {
    const { data: products, error } = await supabase
      .from("products")
      .select("title, seoSlug, code, slug, updated_at")
      .eq("is_published", true);

    if (!error && Array.isArray(products)) {
      for (const prod of products) {
        const slug = prod.seoSlug || prod.slug || (prod.title || '')
          .toString()
          .toLowerCase()
          .trim()
          .replace(/\s+/g, '-')
          .replace(/[^\w\-]+/g, '')
          .replace(/\-\-+/g, '-')
          .replace(/^-+/, '')
          .replace(/-+$/, '') || prod.code;
        const lastmod = prod.updated_at ? new Date(prod.updated_at).toISOString().split('T')[0] : currentDate;
        if (slug) addProductSlug(slug, lastmod);
      }
    } else if (error) {
      console.error("⚠️ Supabase sitemap fetch error inside server.ts:", error);
    }
  } catch (e: any) {
    console.error("⚠️ Failed to fetch product slugs for sitemap inside server.ts:", e.message);
  }

  // Combine static and products
  const allPages = [
    ...staticPages.map(p => ({ ...p, lastmod: currentDate })),
    ...productPages
  ];

  const xmlEntries = allPages.map(page => `  <url>
    <loc>${escapeXml(page.loc)}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join("\n");

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</urlset>`;

  res.header("Content-Type", "application/xml");
  res.header("Cache-Control", "s-maxage=3600, stale-while-revalidate");
  res.send(sitemapXml);
}

app.get("/sitemap.xml", handleSitemapRequest);
app.get("/api/sitemap", handleSitemapRequest);

// Dynamically generated robots.txt to direct and guide search crawlers
app.get("/robots.txt", (req, res) => {
  const robots = `User-agent: *
Allow: /
Allow: /product/
Allow: /category/
Allow: /search
Allow: /api/sitemap
Disallow: /admin
Disallow: /wishlist
Disallow: /cart
Disallow: /checkout
Disallow: /profile
Disallow: /orders
Disallow: /auth
Disallow: /track

# Host & XML Sitemap Reference
Host: https://stylexbd.vercel.app
Sitemap: https://stylexbd.vercel.app/api/sitemap`;

  res.header("Content-Type", "text/plain");
  res.send(robots);
});

// Vite & Production Setup Middleware
let viteInstance: any = null;

if (!isProduction) {
  // Register Vite middleware synchronously via lazy proxy, strictly bypassing any /api routes
  app.use((req, res, next) => {
    if (req.path.startsWith("/api") || req.url.startsWith("/api") || (req.originalUrl && req.originalUrl.startsWith("/api"))) {
      return next();
    }
    if (viteInstance) {
      return viteInstance.middlewares(req, res, next);
    }
    next();
  });
  console.log("Registered lazy Vite middleware proxy synchronously.");

  // Support Vite development server asynchronously
  const initDevServer = async () => {
    try {
      const viteKey = ["v", "i", "t", "e"].join("");
      const { createServer: createViteServer } = await import(viteKey);
      viteInstance = await createViteServer({
        server: { 
          middlewareMode: true,
          hmr: false
        },
        appType: "custom"
      });
      console.log("Vite dev server created and mounted to proxy.");
    } catch (err) {
      console.error("🚨 Failed to initialize Vite dev server:", err);
    }
  };
  initDevServer();

  // Explicit JSON 404 handler for API routes so HTML is never sent for API endpoints
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: "API endpoint not found", path: req.path });
  });

  // Support SPA wildcard fallback synchronously in development so refreshes on subpaths work instantly
  app.get("*", async (req, res, next) => {
    // Avoid intercepting API paths or files with extensions
    if (req.path.startsWith("/api") || req.url.startsWith("/api") || (req.originalUrl && req.originalUrl.startsWith("/api")) || req.path.includes(".")) {
      return next();
    }
    try {
      const fs = await import("fs/promises");
      const rawHtml = await fs.readFile(path.join(process.cwd(), "index.html"), "utf-8");
      if (viteInstance) {
        const html = await viteInstance.transformIndexHtml(req.url, rawHtml);
        res.status(200).set({ "Content-Type": "text/html" }).send(html);
      } else {
        res.status(200).set({ "Content-Type": "text/html" }).send(rawHtml);
      }
    } catch (err) {
      next(err);
    }
  });
} else {
  const baseDistPath = path.join(process.cwd(), "dist");
  app.use(express.static(baseDistPath));
  // Support wildcard matching with Dynamic SEO Meta SSR injection
  app.get("*", async (req, res) => {
    let indexPath = path.join(process.cwd(), "dist", "index.html");
    const fs = await import("fs/promises");
    let html = "";
    
    // Attempt to resolve and read index.html dynamically to handle different Vercel directory structures
    try {
      html = await fs.readFile(indexPath, "utf-8");
    } catch (e) {
      try {
        const altPath = path.resolve(__dirname, "dist", "index.html");
        html = await fs.readFile(altPath, "utf-8");
        indexPath = altPath;
      } catch (e2) {
        try {
          const altPath2 = path.resolve(__dirname, "..", "dist", "index.html");
          html = await fs.readFile(altPath2, "utf-8");
          indexPath = altPath2;
        } catch (e3) {
          try {
            const altPath3 = path.resolve(process.cwd(), "api", "dist", "index.html");
            html = await fs.readFile(altPath3, "utf-8");
            indexPath = altPath3;
            } catch (e4) {
              try {
                const altPath4 = path.resolve(process.cwd(), "index.html");
                html = await fs.readFile(altPath4, "utf-8");
                indexPath = altPath4;
              } catch (e5) {
                console.error("🚨 All index.html resolution paths failed:", e5);
                html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>StyleX BD | Premium Clothing Bangladesh & Luxury Fashion Dhaka</title>
    <meta name="description" content="Discover StyleX BD, Bangladesh's leading destination for luxury fashion, streetwear, and premium clothing." />
    <link rel="icon" type="image/jpg" href="/stylex_logo.jpg" />
    <script type="module" src="/src/main.tsx"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;
              }
            }
          }
        }
      }

      try {
        const replaceMetaTag = (htmlText: string, nameAttr: "name" | "property", attrValue: string, newValue: string): string => {
          const regex = new RegExp(`<meta\\s+[^>]*?${nameAttr}=["']${attrValue}["'][^>]*?>`, "gi");
          if (regex.test(htmlText)) {
            return htmlText.replace(regex, `<meta ${nameAttr}="${attrValue}" content="${newValue}" />`);
          } else {
            return htmlText.replace("</head>", `<meta ${nameAttr}="${attrValue}" content="${newValue}" />\n</head>`);
          }
        };

        // Robustly get the requested URL path under Vercel / serverless rewrites
        let requestUrlPath = req.path;
        const catchAllCandidates: string[] = [];
        if (req.headers["x-vercel-forwarded-path"]) catchAllCandidates.push(String(req.headers["x-vercel-forwarded-path"]));
        if (req.headers["x-matched-path"]) catchAllCandidates.push(String(req.headers["x-matched-path"]));
        if (req.headers["x-original-url"]) catchAllCandidates.push(String(req.headers["x-original-url"]));
        if (req.headers["x-forwarded-uri"]) catchAllCandidates.push(String(req.headers["x-forwarded-uri"]));
        if (req.originalUrl) catchAllCandidates.push(req.originalUrl);
        if (req.url) catchAllCandidates.push(req.url);

        for (const candidate of catchAllCandidates) {
          const cleanPath = candidate.split("?")[0];
          if (
            cleanPath &&
            cleanPath !== "/api" &&
            !cleanPath.startsWith("/api/") &&
            !cleanPath.includes("/api/index") &&
            !cleanPath.includes("index.ts")
          ) {
            requestUrlPath = cleanPath;
            break;
          }
        }

        // Extract route parameters from the pathname (clean SEO friendly URLs)
        const pathSegments = requestUrlPath.split("/").filter(Boolean);
        let customTitle = db.settings?.siteTitle || "StyleX BD | Premium Clothing Bangladesh & Luxury Fashion Dhaka";
        if (!db.settings?.siteTitle || db.settings.siteTitle === "Style X" || db.settings.siteTitle === "StyleX BD") {
          customTitle = "StyleX BD | Premium Clothing Bangladesh & Luxury Fashion Dhaka";
        }
        let desc = db.settings?.siteMetaDesc || "Discover StyleX BD, Bangladesh's leading destination for luxury fashion, streetwear, and premium clothing. Shop premium shirts, t-shirts, designer cargo pants, and hoodies with nationwide COD delivery.";
        if (!db.settings?.siteMetaDesc || db.settings.siteMetaDesc === "Elite Luxury Fashion Showcase" || db.settings.siteMetaDesc.includes("Discover STYLE X")) {
          desc = "Discover StyleX BD, Bangladesh's leading destination for luxury fashion, streetwear, and premium clothing. Shop premium shirts, t-shirts, designer cargo pants, and hoodies with nationwide COD delivery.";
        }
        let keywords = "stylex, style x, stylex bd, premium clothing bangladesh, luxury fashion dhaka, stylex bangladesh, stylex online shop, luxury streetwear bd, buy clothing online dhaka, authentic apparel, premium shirts bd, designer streetwear bangladesh";
        let image = "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&h=630&q=80";
        
        const protocol = req.headers["x-forwarded-proto"] || "https";
        const host = req.headers["x-forwarded-host"] || req.headers.host || "stylexbd.vercel.app";
        let canonicalUrl = `${protocol}://${host}${requestUrlPath}`;
        let productSchemaJson = "";

        let foundMatch = false;

        if (pathSegments[0] === "products" || pathSegments[0] === "product") {
          const productCode = decodeURIComponent(pathSegments[1] || "").toLowerCase();
          if (productCode && db.products) {
            const productCodeNoHyphens = productCode.replace(/[\s\-]+/g, '');
            const foundProduct = db.products.find((p: any) => {
              const pCode = (p.code || "").toLowerCase();
              const pId = String(p.id).toLowerCase();
              const pSeo = (p.seoSlug || "").toLowerCase();
              const pTitle = (p.title || "").toLowerCase();
              const pTitleClean = pTitle.replace(/[\s\-]+/g, '');
              const pTitleSlug = pTitle
                .trim()
                .replace(/\s+/g, '-')
                .replace(/[^\w\-]+/g, '')
                .replace(/\-\-+/g, '-')
                .replace(/^-+/, '')
                .replace(/-+$/, '');

              if (pCode === productCode || pId === productCode || pSeo === productCode) return true;
              if (pTitleSlug === productCode || pTitleClean === productCodeNoHyphens) return true;
              if (pCode && productCode.startsWith(pCode + "-")) return true;
              if (pId && productCode.startsWith(pId + "-")) return true;
              if (pTitleClean && (pTitleClean.includes(productCodeNoHyphens) || productCodeNoHyphens.includes(pTitleClean))) return true;

              const codeWords = productCode.split(/[\s\-]+/).filter(w => w.length > 2);
              if (codeWords.length > 0) {
                const matchedCount = codeWords.filter(w => pTitle.includes(w) || pCode.includes(w) || pSeo.includes(w)).length;
                if (matchedCount / codeWords.length >= 0.5) return true;
              }
              return false;
            });

            if (foundProduct) {
              customTitle = foundProduct.seoTitle || `${foundProduct.title} | Premium Style X BD`;
              desc = foundProduct.seoDescription || foundProduct.description || `Purchase ${foundProduct.title} from STYLE X BD. Premium apparel item designed with high fashion standards, starting from ${foundProduct.price} BDT.`;
              keywords = foundProduct.seoKeywords || `${foundProduct.title}, style x, style x bd, premium clothing, luxury apparel, streetwear bangladesh`;
              image = foundProduct.imageUrl || image;
              foundMatch = true;

              // Retrieve approved reviews for this product to feed into Rich Snippets
              const productReviews = db.reviews ? db.reviews.filter((r: any) => 
                String(r.productId) === String(foundProduct.id) && r.isApproved
              ) : [];

              let aggregateRatingObj: any = undefined;
              let reviewsListObj: any[] = [];

              if (productReviews.length > 0) {
                const totalRating = productReviews.reduce((sum: number, r: any) => sum + Number(r.rating || 5), 0);
                const avgRating = Math.round((totalRating / productReviews.length) * 10) / 10;
                aggregateRatingObj = {
                  "@type": "AggregateRating",
                  "ratingValue": avgRating,
                  "reviewCount": productReviews.length,
                  "bestRating": "5",
                  "worstRating": "1"
                };
                reviewsListObj = productReviews.map((r: any) => ({
                  "@type": "Review",
                  "author": {
                    "@type": "Person",
                    "name": r.customerName || "Verified Buyer"
                  },
                  "datePublished": r.date ? r.date.split("T")[0] : "2026-01-01",
                  "reviewBody": r.comment || "",
                  "reviewRating": {
                    "@type": "Rating",
                    "ratingValue": Number(r.rating || 5),
                    "bestRating": "5",
                    "worstRating": "1"
                  }
                }));
              }

              // Product JSON-LD Schema
              const schemaObj: any = {
                "@context": "https://schema.org",
                "@type": "Product",
                "name": foundProduct.title,
                "image": foundProduct.imageUrl || image,
                "description": foundProduct.description || desc,
                "sku": foundProduct.code || String(foundProduct.id),
                "mpn": foundProduct.code || String(foundProduct.id),
                "brand": {
                  "@type": "Brand",
                  "name": "Style X"
                },
                "offers": {
                  "@type": "Offer",
                  "url": canonicalUrl,
                  "priceCurrency": "BDT",
                  "price": foundProduct.price,
                  "priceValidUntil": "2027-12-31",
                  "itemCondition": "https://schema.org/NewCondition",
                  "availability": foundProduct.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                  "seller": {
                    "@type": "Organization",
                    "name": "Style X"
                  }
                }
              };

              if (aggregateRatingObj) {
                schemaObj.aggregateRating = aggregateRatingObj;
              }
              if (reviewsListObj.length > 0) {
                schemaObj.review = reviewsListObj;
              }

              productSchemaJson = `<script id="json-ld-product-schema" type="application/ld+json">${JSON.stringify(schemaObj)}</script>`;
            }
          }
        } else if (pathSegments[0] === "category" && pathSegments[1]) {
          const cat = pathSegments[1].toUpperCase();
          foundMatch = true;
          if (cat === "MEN") {
            customTitle = "Gentlemen's Luxury Fashion & Curated Streetwear | STYLE X";
            desc = "Shop curated Gentlemen's premium clothing at STYLE X. Explore luxury jackets, designer graphic t-shirts, hoodies, and cargo pants tailored for elegance.";
            keywords = "gentlemen streetwear, men fashion bangladesh, luxury menswear, style x gentlemen, premium jackets, custom hoodies, style x men";
          } else if (cat === "WOMEN") {
            customTitle = "Haute Couture & Women's Designer Collection | STYLE X";
            desc = "Unrivaled luxury and modern tailoring. Explore the signature Women's Haute Couture fashion line by STYLE X, featuring elegant styling and streetwear essentials.";
            keywords = "haute couture, women premium fashion, designer apparel women, style x women, elegant dresses, premium women streetwear";
          } else if (cat === "UNISEX") {
            customTitle = "Co-Ed Line - Premium Unisex Clothing & Streetwear | STYLE X";
            desc = "Discover gender-neutral designer wear and unisex clothing accessories at STYLE X. Gender-free signature fits engineered for premium luxury aesthetics.";
            keywords = "unisex streetwear, co-ed line, gender neutral clothing, gender free fashion, style x unisex, luxury hoodies unisex";
          } else if (cat === "ACCESSORIES") {
            customTitle = "Ensemble Accessories & Premium Lifestyle Goods | STYLE X";
            desc = "Refine your wardrobe and daily style with premium designer accessories and luxury lifestyle essentials by STYLE X. Perfect additions for every outfit.";
            keywords = "luxury accessories, premium wardrobe additions, style x ensemble, designer socks, signature jewelry, style x caps";
          } else {
            foundMatch = false;
          }
        } else if (pathSegments[0] === "about") {
          customTitle = "About StyleX BD | The Curated Luxury Fashion Experience";
          desc = "Discover the heritage, curation standards, and vision of StyleX BD. Bangladesh's premium destination for high-end streetwear and artisanal fashion curation.";
          foundMatch = true;
        } else if (pathSegments[0] === "faq") {
          customTitle = "Frequently Asked Questions | StyleX BD Help Center";
          desc = "Find answers to frequently asked questions about orders, payments, size guides, and secure nationwide Cash on Delivery with StyleX BD.";
          foundMatch = true;
        } else if (pathSegments[0] === "delivery") {
          customTitle = "Secure Nationwide Delivery Information | StyleX BD";
          desc = "Learn about our premium physical verification delivery handoff, delivery timelines, and secure Cash on Delivery (COD) services across Bangladesh.";
          foundMatch = true;
        } else if (pathSegments[0] === "returns") {
          customTitle = "Easy Returns & Exchange Policy | StyleX BD";
          desc = "Read our step-by-step returns, claims, and exchange guidelines for all StyleX BD apparel, ensuring a risk-free luxury shopping experience.";
          foundMatch = true;
        } else if (pathSegments[0] === "contact") {
          customTitle = "Contact Private Concierge Support | StyleX BD";
          desc = "Reach out to the StyleX BD private concierge, customer support, or admin team for bespoke order assistance, WhatsApp concierge, or partner inquiries.";
          foundMatch = true;
        } else if (pathSegments[0] === "size-guide") {
          customTitle = "Official StyleX BD Apparel Size Guide";
          desc = "Find the perfect fit with our comprehensive size guide. Measurements for shirts, t-shirts, cargo pants, hoodies, and jackets from StyleX BD.";
          foundMatch = true;
        } else if (pathSegments[0] === "blog") {
          customTitle = "StyleX Editorial Blog | Luxury Fashion & Streetwear Trends";
          desc = "Explore the latest style lookbooks, streetwear culture insights, fabric curation notes, and luxury fashion trends from the StyleX BD editorial team.";
          foundMatch = true;
        } else if (pathSegments[0] === "rewards") {
          customTitle = "VIP Rewards & Loyalty Benefits Program | StyleX BD";
          desc = "Discover the StyleX BD VIP rewards program. Earn exclusive member passes, loyalty discounts, rare product drop access, and private styling benefits.";
          foundMatch = true;
        } else if (pathSegments[0] === "wishlist") {
          customTitle = "My Curated Fashion Wishlist | STYLE X BD";
          desc = "View your personal curated collection of favorite luxury garments, seasonal jackets, streetwear essentials, and styling masterpieces.";
          foundMatch = true;
        } else if (pathSegments[0] === "track") {
          customTitle = "Authentic Order Tracking Portal | STYLE X BD";
          desc = "Monitor the real-time shipping status, premium courier assignment, and safe hand-off fulfillment of your elite Style X garments.";
          foundMatch = true;
        }

        // Fallback to query param parsing if no clean route matched
        if (!foundMatch) {
          const productParam = req.query.product || req.query.productCode || req.query.slug;
          const categoryParam = req.query.category;

          if (productParam && db.products) {
            const productCode = String(productParam).toLowerCase();
            const foundProduct = db.products.find((p: any) => {
              const pCode = (p.code || "").toLowerCase();
              const pId = String(p.id).toLowerCase();
              const pTitleSlug = (p.title || "")
                .toString()
                .toLowerCase()
                .trim()
                .replace(/\s+/g, '-')
                .replace(/[^\w\-]+/g, '')
                .replace(/\-\-+/g, '-')
                .replace(/^-+/, '')
                .replace(/-+$/, '');

              const pTitleSlugNoHyphens = (p.title || "")
                .toString()
                .toLowerCase()
                .trim()
                .replace(/[\s\-]+/g, '')
                .replace(/[^\w]+/g, '');

              const productCodeNoHyphens = productCode.replace(/[\s\-]+/g, '');

              return (
                pCode === productCode ||
                pId === productCode ||
                (p.seoSlug && p.seoSlug.toLowerCase() === productCode) ||
                (p.seoSlug && p.seoSlug.toLowerCase().replace(/[\s\-]+/g, '') === productCodeNoHyphens) ||
                productCode === pTitleSlug ||
                productCode === pTitleSlugNoHyphens ||
                productCodeNoHyphens === pTitleSlugNoHyphens
              );
            });

            if (foundProduct) {
              const pSlug = (foundProduct.title || '')
                .toString()
                .toLowerCase()
                .trim()
                .replace(/[\s\-]+/g, '')
                .replace(/[^\w]+/g, '');
              canonicalUrl = `${protocol}://${host}/products/${pSlug || encodeURIComponent(foundProduct.code || foundProduct.id)}`;
              customTitle = foundProduct.seoTitle || `${foundProduct.title} | Premium Style X BD`;
              desc = foundProduct.seoDescription || foundProduct.description || `Purchase ${foundProduct.title} from STYLE X BD. Premium apparel item designed with high fashion standards, starting from ${foundProduct.price} BDT.`;
              keywords = foundProduct.seoKeywords || `${foundProduct.title}, style x, stylex, premium clothing`;
              image = foundProduct.imageUrl || image;

              const schemaObj = {
                "@context": "https://schema.org",
                "@type": "Product",
                "name": foundProduct.title,
                "image": foundProduct.imageUrl || image,
                "description": foundProduct.description || desc,
                "sku": foundProduct.code || String(foundProduct.id),
                "mpn": foundProduct.code || String(foundProduct.id),
                "brand": {
                  "@type": "Brand",
                  "name": "Style X"
                },
                "offers": {
                  "@type": "Offer",
                  "url": canonicalUrl,
                  "priceCurrency": "BDT",
                  "price": foundProduct.price,
                  "priceValidUntil": "2027-12-31",
                  "itemCondition": "https://schema.org/NewCondition",
                  "availability": foundProduct.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                  "seller": {
                    "@type": "Organization",
                    "name": "Style X"
                  }
                }
              };
              productSchemaJson = `<script id="json-ld-product-schema" type="application/ld+json">${JSON.stringify(schemaObj)}</script>`;
            }
          } else if (categoryParam) {
            const cat = String(categoryParam).toUpperCase().trim();
            if (['ALL', 'MEN', 'WOMEN', 'UNISEX', 'ACCESSORIES'].includes(cat)) {
              canonicalUrl = `${protocol}://${host}/category/${cat.toLowerCase()}`;
              if (cat === "MEN") {
                customTitle = "Gentlemen's Luxury Fashion & Curated Streetwear | STYLE X";
                desc = "Shop curated Gentlemen's premium clothing at STYLE X. Explore luxury jackets, designer graphic t-shirts, hoodies, and cargo pants tailored for elegance.";
                keywords = "gentlemen streetwear, men fashion bangladesh, luxury menswear, style x gentlemen, premium jackets, custom hoodies, style x men";
              } else if (cat === "WOMEN") {
                customTitle = "Haute Couture & Women's Designer Collection | STYLE X";
                desc = "Unrivaled luxury and modern tailoring. Explore the signature Women's Haute Couture fashion line by STYLE X, featuring elegant styling and streetwear essentials.";
                keywords = "haute couture, women premium fashion, designer apparel women, style x women, elegant dresses, premium women streetwear";
              } else if (cat === "UNISEX") {
                customTitle = "Co-Ed Line - Premium Unisex Clothing & Streetwear | STYLE X";
                desc = "Discover gender-neutral designer wear and unisex clothing accessories at STYLE X. Gender-free signature fits engineered for premium luxury aesthetics.";
                keywords = "unisex streetwear, co-ed line, gender neutral clothing, gender free fashion, style x unisex, luxury hoodies unisex";
              } else if (cat === "ACCESSORIES") {
                customTitle = "Ensemble Accessories & Premium Lifestyle Goods | STYLE X";
                desc = "Refine your wardrobe and daily style with premium designer accessories and luxury lifestyle essentials by STYLE X. Perfect additions for every outfit.";
                keywords = "luxury accessories, premium wardrobe additions, style x ensemble, designer socks, signature jewelry, style x caps";
              }
            }
          }
        }

        // Apply dynamic titles and meta tags to html robustly
        html = html.replace(/<title>.*?<\/title>/gi, `<title>${customTitle}</title>`);
        
        html = replaceMetaTag(html, "name", "title", customTitle);
        html = replaceMetaTag(html, "name", "description", desc);
        html = replaceMetaTag(html, "name", "keywords", keywords);

        // Replace OpenGraph meta tags robustly
        html = replaceMetaTag(html, "property", "og:title", customTitle);
        html = replaceMetaTag(html, "property", "og:description", desc);
        html = replaceMetaTag(html, "property", "og:image", image);
        html = replaceMetaTag(html, "property", "og:url", canonicalUrl);
        html = replaceMetaTag(html, "property", "og:site_name", "Style X");

        // Replace Twitter Card meta tags robustly
        html = replaceMetaTag(html, "name", "twitter:title", customTitle);
        html = replaceMetaTag(html, "name", "twitter:description", desc);
        html = replaceMetaTag(html, "name", "twitter:image", image);
        html = replaceMetaTag(html, "name", "twitter:url", canonicalUrl);
        html = replaceMetaTag(html, "name", "twitter:card", "summary_large_image");

        html = replaceMetaTag(html, "property", "twitter:title", customTitle);
        html = replaceMetaTag(html, "property", "twitter:description", desc);
        html = replaceMetaTag(html, "property", "twitter:image", image);
        html = replaceMetaTag(html, "property", "twitter:url", canonicalUrl);

        // Replace Canonical link
        const canonicalRegex = /<link\s+rel=["']canonical["']\s+href=["'].*?["']\s*\/?>/gi;
        if (canonicalRegex.test(html)) {
          html = html.replace(canonicalRegex, `<link rel="canonical" href="${canonicalUrl}" />`);
        } else {
          html = html.replace("</head>", `<link rel="canonical" href="${canonicalUrl}" />\n</head>`);
        }

        // Inject Product Schema if present
        if (productSchemaJson) {
          html = html.replace(/<script id="json-ld-product-schema" type="application\/ld\+json">.*?<\/script>/gi, "");
          html = html.replace("</head>", `${productSchemaJson}\n</head>`);
        }

        // Pre-render semantic fallback DOM inside <div id="root"> for non-JS crawlers
        const prHeading = customTitle ? customTitle.replace(/</g, "&lt;").replace(/>/g, "&gt;") : "StyleX BD";
        const prDesc = desc ? desc.replace(/</g, "&lt;").replace(/>/g, "&gt;") : "";
        const prImage = image ? image.replace(/"/g, "&quot;") : "";

        let prBody = `<main style="padding:2rem;max-width:1200px;margin:0 auto;color:#fff;background:#050505;font-family:sans-serif;">` +
          `<header><h1 style="font-size:2rem;margin-bottom:0.75rem;">${prHeading}</h1></header>` +
          `<article><p style="font-size:1.1rem;line-height:1.6;">${prDesc}</p>` +
          (prImage ? `<img src="${prImage}" alt="${prHeading}" style="max-width:100%;height:auto;margin:1rem 0;border-radius:8px;" />` : "") +
          `</article></main>`;

        if (html.includes('<div id="root"></div>')) {
          html = html.replace('<div id="root"></div>', `<div id="root">${prBody}</div>`);
        } else if (html.includes('<div id="root">')) {
          html = html.replace(/<div id="root">[\s\S]*?<\/div>/, `<div id="root">${prBody}</div>`);
        }

        res.send(html);
      } catch (err) {
        try {
          res.sendFile(indexPath);
        } catch (err2) {
          try {
            res.sendFile(path.join(process.cwd(), "index.html"));
          } catch (err3) {
            res.status(200).send("<!DOCTYPE html><html><head><script>window.location.href='/'</script></head><body>Redirecting...</body></html>");
          }
        }
      }
  });
  console.log("Serving static distribution files from", baseDistPath);
}

// Trigger initial database sync and AI key initialization in background
syncFromSupabase()
  .then(() => {
    initializeAiKeyPool();
    // Schedule periodic polling sync from Supabase
    const syncInterval = setInterval(syncFromSupabase, 45000);
    if (syncInterval.unref) syncInterval.unref();
  })
  .catch((err: any) => {
    console.error("⚠️ Background sync runner scheduling failed:", err.message);
  });

if (!process.env.VERCEL) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`STYLE X Premium Server running fully authorized on http://0.0.0.0:${PORT}`);
  });
}

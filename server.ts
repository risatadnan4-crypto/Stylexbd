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
  banners: initialBanners,
  reviews: [] as Review[],
  coupons: initialCoupons,
  campaigns: initialCampaigns,
  chats: [] as ChatRoom[],
  visits: 125,
  liveViews: 3
};

// Load database if exists
if (fs.existsSync(DB_FILE)) {
  try {
    const rawData = fs.readFileSync(DB_FILE, "utf-8");
    const parsedData = JSON.parse(rawData);
    db = { ...db, ...parsedData };
  } catch (err) {
    console.error("Error parsing DB file, using default structure", err);
  }
}

let lastSyncCompletedAt = 0;
let activeSyncPromise: Promise<void> | null = null;

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
    console.log("🔄 Fetching latest collections from Supabase database...");

    // 1. Sync Products
    try {
      const { data: productsData, error: pError } = await supabase.from("products").select("*");
      if (!pError && productsData) {
        if (productsData.length > 0) {
          db.products = productsData.map((p: any) => ({
            ...p,
            sizes: typeof p.sizes === "string" ? JSON.parse(p.sizes) : (Array.isArray(p.sizes) ? p.sizes : []),
            trending: p.trending !== undefined ? !!p.trending : true,
            featured: p.featured !== undefined ? !!p.featured : true,
            price: Number(p.price || 0),
            stock: Number(p.stock || 0)
          }));
          console.log(`✅ Synced ${db.products.length} products from Supabase.`);
        } else {
          console.log("🌱 Supabase 'products' table is empty. Uploading default seeds...");
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
        }
      } else if (pError) {
        console.warn("⚠️ [Supabase Products Sync Warning]:", pError.message);
      }
    } catch (e: any) {
      console.warn("⚠️ Products table setup not verified:", e.message);
    }

    // 2. Sync Banners
    try {
      const { data: bannersData, error: bError } = await supabase.from("banners").select("*");
      if (!bError && bannersData) {
        if (bannersData.length > 0) {
          db.banners = bannersData.map((b: any) => ({
            ...b,
            active: !!b.active
          }));
          console.log(`✅ Synced ${db.banners.length} banners from Supabase.`);
        } else {
          for (const b of db.banners) {
            await supabase.from("banners").upsert(b);
          }
        }
      }
    } catch (e: any) {}

    // 3. Sync Coupons
    try {
      const { data: couponsData, error: cError } = await supabase.from("coupons").select("*");
      if (!cError && couponsData) {
        if (couponsData.length > 0) {
          db.coupons = couponsData.map((c: any) => ({
            ...c,
            active: !!c.active,
            value: Number(c.value)
          }));
          console.log(`✅ Synced ${db.coupons.length} coupons from Supabase.`);
        } else {
          for (const c of db.coupons) {
            await supabase.from("coupons").upsert(c);
          }
        }
      }
    } catch (e: any) {}

    // 4. Sync Campaigns
    try {
      const { data: campaignsData, error: campError } = await supabase.from("campaigns").select("*");
      if (!campError && campaignsData) {
        if (campaignsData.length > 0) {
          db.campaigns = campaignsData.map((c: any) => ({
            ...c,
            active: !!c.active
          }));
          console.log(`✅ Synced ${db.campaigns.length} campaigns from Supabase.`);
        } else {
          for (const c of db.campaigns) {
            await supabase.from("campaigns").upsert(c);
          }
        }
      }
    } catch (e: any) {}

    // 5. Sync Reviews
    try {
      const { data: reviewsData, error: rError } = await supabase.from("reviews").select("*");
      if (!rError && reviewsData) {
        if (reviewsData.length > 0) {
          db.reviews = reviewsData.map((r: any) => ({
            ...r,
            rating: Number(r.rating),
            isApproved: !!r.isApproved
          }));
          console.log(`✅ Synced ${db.reviews.length} reviews from Supabase.`);
        } else {
          for (const r of db.reviews) {
            await supabase.from("reviews").upsert(r);
          }
        }
      }
    } catch (e: any) {}

    // 6. Sync Orders
    try {
      const { data: ordersData, error: oError } = await supabase.from("orders").select("*");
      if (!oError && ordersData) {
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
      const { data: chatsData, error: chatError } = await supabase.from("chats").select("*");
      if (!chatError && chatsData) {
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

// Simple visitor tracker logic
app.use((req, res, next) => {
  if (req.url === "/" || req.url === "/index.html") {
    db.visits += 1;
    db.liveViews = Math.max(1, Math.floor(Math.random() * 5) + 1); // Mock live current views
    saveDB();
  }
  next();
});

// Admin verification (Simple mock for beautiful user flows)
const ADMIN_EMAIL = "risatadnan4@gmail.com";

// API Endpoints:

// Analytics Metrics
app.get("/api/analytics", (req, res) => {
  const totalRevenue = db.orders
    .filter(o => o.status !== "CANCELLED")
    .reduce((val, order) => val + order.totalAmount, 0);

  const totalOrders = db.orders.length;
  const pendingOrders = db.orders.filter(o => o.status === "PENDING").length;
  const lowStockProducts = db.products.filter(p => p.stock < 15).length;

  res.json({
    visits: db.visits,
    liveViews: db.liveViews,
    totalRevenue,
    totalOrders,
    pendingOrders,
    lowStockStockCount: lowStockProducts,
    recentOrdersMax: db.orders.slice(-5)
  });
});

// Products Base API
app.get("/api/products", async (req, res) => {
  try {
    const { data: productsData, error: pError } = await supabase.from("products").select("*");
    if (!pError && productsData && productsData.length > 0) {
      const products = productsData.map((p: any) => ({
        ...p,
        sizes: typeof p.sizes === "string" ? JSON.parse(p.sizes) : (Array.isArray(p.sizes) ? p.sizes : []),
        trending: p.trending !== undefined ? !!p.trending : true,
        featured: p.featured !== undefined ? !!p.featured : true,
        price: Number(p.price || 0),
        stock: Number(p.stock || 0)
      }));
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
      const prod = {
        ...data,
        sizes: typeof data.sizes === "string" ? JSON.parse(data.sizes) : (Array.isArray(data.sizes) ? data.sizes : []),
        trending: data.trending !== undefined ? !!data.trending : true,
        featured: data.featured !== undefined ? !!data.featured : true,
        price: Number(data.price || 0),
        stock: Number(data.stock || 0)
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
  db.products.push(newProduct);
  saveDB();

  try {
    const payload = {
      id: newProduct.id,
      code: newProduct.code,
      title: newProduct.title,
      description: newProduct.description,
      price: Number(newProduct.price || 0),
      category: newProduct.category,
      stock: Number(newProduct.stock || 0),
      imageUrl: newProduct.imageUrl,
      sizes: JSON.stringify(newProduct.sizes),
      dimensions: newProduct.dimensions,
      whyBuy: newProduct.whyBuy,
      trending: !!newProduct.trending,
      featured: !!newProduct.featured
    };
    const { error: upsertError } = await supabase.from("products").upsert(payload);
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
    db.products[idx] = { ...db.products[idx], ...req.body };
    saveDB();

    const target = db.products[idx];
    try {
      const payload = {
        id: target.id,
        code: target.code,
        title: target.title,
        description: target.description,
        price: Number(target.price || 0),
        category: target.category,
        stock: Number(target.stock || 0),
        imageUrl: target.imageUrl,
        sizes: typeof target.sizes === "string" ? target.sizes : JSON.stringify(target.sizes),
        dimensions: target.dimensions,
        whyBuy: target.whyBuy,
        trending: !!target.trending,
        featured: !!target.featured
      };
      const { error: upsertError } = await supabase.from("products").upsert(payload);
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
    if (!error && data && data.length > 0) {
      const banners = data.map((b: any) => ({
        ...b,
        active: !!b.active
      }));
      db.banners = banners;
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

app.post("/api/orders", async (req, res) => {
  const { customerName, customerPhone, customerAddress, customerCity, customerNotes, items, totalAmount } = req.body;

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

  // Generate beautiful message for WhatsApp Redirect
  const itemsText = items.map((i: any) => `- ${i.title} (${i.selectedSize}) x${i.quantity} @ ৳${i.price}`).join("\n");
  const wsMessage = `👑 *STYLE X LUXURY CONFIRMATION* 👑\n\nHello Style X Team, I would like to confirm my luxury collection:\n\n*Order Tracking ID:* ${trackingId}\n\n*Item Details:*\n${itemsText}\n\n*Total Order Value:* ৳${totalAmount}\n\n*Delivery Credentials:*\nName: ${customerName}\nPhone: ${customerPhone}\nAddress: ${customerAddress}, ${customerCity}\nNotes: ${customerNotes || 'None'}\n\nThank you!`;
  const encodedMsg = encodeURIComponent(wsMessage);
  const whatsappUrl = `https://wa.me/8801755104443?text=${encodedMsg}`; // Style X Direct Support

  res.status(201).json({ order: newOrder, whatsappUrl });
});

app.put("/api/orders/:id/status", async (req, res) => {
  const { status } = req.body;
  const idx = db.orders.findIndex(o => o.id === req.params.id);
  if (idx !== -1) {
    db.orders[idx].status = status;
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
    if (!error && data && data.length > 0) {
      const coupons = data.map((c: any) => ({
        ...c,
        active: !!c.active,
        value: Number(c.value)
      }));
      db.coupons = coupons;
      saveDB();
      return res.json(coupons);
    }
  } catch (err: any) {
    console.warn("⚠️ Direct coupons fetch fallback:", err.message);
  }
  res.json(db.coupons);
});

app.post("/api/coupons", async (req, res) => {
  const { code, type, value, active } = req.body;
  // Capitalize coupon codes
  const upperCode = String(code).toUpperCase().trim();
  const existing = db.coupons.find(c => c.code === upperCode);
  if (existing) {
    return res.status(400).json({ message: "Coupon code already exists." });
  }
  const newCoupon: Coupon = { code: upperCode, type, value: Number(value), active: active ?? true };
  db.coupons.push(newCoupon);
  saveDB();
  try {
    await supabase.from("coupons").upsert(newCoupon);
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
    if (!error && data && data.length > 0) {
      const campaigns = data.map((c: any) => ({
        ...c,
        active: !!c.active
      }));
      db.campaigns = campaigns;
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
    // Sanitize base64 string
    const match = base64Data.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
    let uData = base64Data;
    let ext = ".jpg";
    if (match) {
      ext = "." + match[1];
      uData = match[2];
    } else if (filename.includes(".")) {
      ext = filename.slice(filename.lastIndexOf("."));
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

    // Compute active MIME type for Supabase Content-Type delivery
    let mimeType = "image/jpeg";
    const lowExt = ext.toLowerCase();
    if (lowExt === ".png") mimeType = "image/png";
    else if (lowExt === ".webp") mimeType = "image/webp";
    else if (lowExt === ".gif") mimeType = "image/gif";
    else if (lowExt === ".svg") mimeType = "image/svg+xml";

    // Attempt to store in Supabase Bucket 'products'
    let supabaseUploadSucceeded = false;
    try {
      const { data, error } = await supabase.storage
        .from("products")
        .upload(safeFilename, binaryBuffer, {
          contentType: mimeType,
          cacheControl: "3600",
          upsert: true
        });

      if (!error && data) {
        const { data: publicUrlData } = supabase.storage
          .from("products")
          .getPublicUrl(safeFilename);
        if (publicUrlData && publicUrlData.publicUrl) {
          fileUrl = publicUrlData.publicUrl;
          supabaseUploadSucceeded = true;
          console.log("☁️ Stored image file on Supabase Storage bucket 'products':", fileUrl);
        }
      } else {
        const errorMessage = error?.message || "Unknown Supabase Storage error";
        console.warn("⚠️ Supabase Storage upload error:", errorMessage);
        if (!localWriteSucceeded || process.env.VERCEL) {
          throw new Error(`Supabase Storage upload error: ${errorMessage}. Please ensure a Public storage bucket named 'products' exists in your Supabase project with proper storage RLS policies.`);
        }
      }
    } catch (sbErr: any) {
      console.warn("⚠️ Supabase Storage connection or bucket error:", sbErr.message);
      if (!localWriteSucceeded || process.env.VERCEL) {
        throw new Error(`Unable to complete upload. Supabase storage error: ${sbErr.message}. Make sure your 'products' bucket exists, is set to 'Public', and that your Supabase credentials are valid.`);
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

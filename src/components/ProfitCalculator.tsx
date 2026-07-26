import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calculator,
  TrendingUp,
  DollarSign,
  PieChart,
  BarChart3,
  Download,
  Copy,
  RotateCcw,
  Printer,
  Save,
  Search,
  Trash2,
  Check,
  Sparkles,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Package,
  Shirt,
  Truck,
  Box,
  Tag,
  Layers,
  ShieldCheck,
  TrendingDown,
  Percent,
  Plus,
  Minus,
  HelpCircle,
  Award,
  Zap,
  ArrowRight
} from 'lucide-react';

export interface CalculationHistoryItem {
  id: string;
  timestamp: string;
  productName: string;
  sellingPrice: number;
  costPerProduct: number;
  quantity: number;
  revenue: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;
  recommendedPrice: number;
  desiredProfitPct: number;
}

export default function ProfitCalculator() {
  // Input States
  const [productName, setProductName] = useState<string>('Style X Premium Oversized Tee');
  const [sellingPrice, setSellingPrice] = useState<number>(850);
  
  // Cost breakdown
  const [tshirtCost, setTshirtCost] = useState<number>(220);
  const [dtfCost, setDtfCost] = useState<number>(110);
  const [marketingCost, setMarketingCost] = useState<number>(70);
  const [transportCost, setTransportCost] = useState<number>(30);
  const [packagingCost, setPackagingCost] = useState<number>(20);
  const [otherCost, setOtherCost] = useState<number>(10);

  // Sales & Target
  const [quantity, setQuantity] = useState<number>(100);
  const [desiredProfitPct, setDesiredProfitPct] = useState<number>(30);

  // UI States
  const [copied, setCopied] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [history, setHistory] = useState<CalculationHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('stylex_admin_profit_calc_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Load auto-saved last calculation state on mount
  useEffect(() => {
    try {
      const lastCalc = localStorage.getItem('stylex_admin_profit_calc_last');
      if (lastCalc) {
        const parsed = JSON.parse(lastCalc);
        if (parsed.productName !== undefined) setProductName(parsed.productName);
        if (parsed.sellingPrice !== undefined) setSellingPrice(parsed.sellingPrice);
        if (parsed.tshirtCost !== undefined) setTshirtCost(parsed.tshirtCost);
        if (parsed.dtfCost !== undefined) setDtfCost(parsed.dtfCost);
        if (parsed.marketingCost !== undefined) setMarketingCost(parsed.marketingCost);
        if (parsed.transportCost !== undefined) setTransportCost(parsed.transportCost);
        if (parsed.packagingCost !== undefined) setPackagingCost(parsed.packagingCost);
        if (parsed.otherCost !== undefined) setOtherCost(parsed.otherCost);
        if (parsed.quantity !== undefined) setQuantity(parsed.quantity);
        if (parsed.desiredProfitPct !== undefined) setDesiredProfitPct(parsed.desiredProfitPct);
      }
    } catch (e) {
      console.error('Failed to load last profit calculator state:', e);
    }
  }, []);

  // Save current calculation to localStorage auto-save
  useEffect(() => {
    try {
      const stateToSave = {
        productName,
        sellingPrice,
        tshirtCost,
        dtfCost,
        marketingCost,
        transportCost,
        packagingCost,
        otherCost,
        quantity,
        desiredProfitPct,
      };
      localStorage.setItem('stylex_admin_profit_calc_last', JSON.stringify(stateToSave));
    } catch (e) {
      console.error('Failed to auto-save profit calculator state:', e);
    }
  }, [
    productName,
    sellingPrice,
    tshirtCost,
    dtfCost,
    marketingCost,
    transportCost,
    packagingCost,
    otherCost,
    quantity,
    desiredProfitPct,
  ]);

  // Persist history changes
  useEffect(() => {
    try {
      localStorage.setItem('stylex_admin_profit_calc_history', JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save calculation history:', e);
    }
  }, [history]);

  // Helper number parser
  const parsePositiveNum = (val: string): number => {
    const num = parseFloat(val);
    if (isNaN(num) || num < 0) return 0;
    return num;
  };

  // Calculations
  const calc = useMemo(() => {
    const costPerProduct = tshirtCost + dtfCost + marketingCost + transportCost + packagingCost + otherCost;
    const totalInvestment = costPerProduct * quantity;
    const revenue = sellingPrice * quantity;
    const profitPerProduct = sellingPrice - costPerProduct;
    const totalProfit = revenue - totalInvestment;
    const profitMargin = revenue > 0 ? (totalProfit / revenue) * 100 : 0;
    const breakEvenPrice = costPerProduct;
    const recommendedPrice = costPerProduct * (1 + (desiredProfitPct || 0) / 100);

    // Status logic
    let statusCategory: 'excellent' | 'good' | 'low' | 'loss' = 'excellent';
    let statusLabel = '🟢 চমৎকার লাভ (Excellent Profit)';
    let statusDesc = 'উচ্চ মার্জিন (≥ ৩০%)। ব্যবসার জন্য লাভজনক ক্যাম্পেইন।';

    if (profitMargin >= 30) {
      statusCategory = 'excellent';
      statusLabel = '🟢 চমৎকার লাভ (Excellent Profit)';
      statusDesc = 'উচ্চ মার্জিন (≥ ৩০%)। ব্যবসার জন্য চমৎকার ও লাভজনক।';
    } else if (profitMargin >= 15) {
      statusCategory = 'good';
      statusLabel = '🟡 ভালো লাভ (Good Profit)';
      statusDesc = 'সুন্দর মার্জিন (১৫% – ২৯%)। নিরাপদ ব্যবসা পরিচালনার জন্য উপযুক্ত।';
    } else if (profitMargin >= 5) {
      statusCategory = 'low';
      statusLabel = '🟠 কম লাভ (Low Profit)';
      statusDesc = 'স্বল্প মার্জিন (৫% – ১৪%)। অনাকাঙ্ক্ষিত খরচে ক্ষতি হতে পারে।';
    } else {
      statusCategory = 'loss';
      statusLabel = '🔴 লোকসান / ঝুঁকিপূর্ণ (Loss / High Risk)';
      statusDesc = 'ঝুঁকিপূর্ণ মার্জিন (< ৫% বা লস)। দাম বাড়ান অথবা খরচ কমান।';
    }

    // Cost Breakdown percentage
    const costsList = [
      { label: 'T-Shirt (টি-শার্ট)', value: tshirtCost, color: '#3B82F6' },
      { label: 'DTF Print (প্রিন্ট)', value: dtfCost, color: '#8B5CF6' },
      { label: 'Marketing (মার্কেটিং)', value: marketingCost, color: '#EC4899' },
      { label: 'Transport (পরিবহন)', value: transportCost, color: '#10B981' },
      { label: 'Packaging (প্যাকেজিং)', value: packagingCost, color: '#F59E0B' },
      { label: 'Other (অন্যান্য)', value: otherCost, color: '#6B7280' },
    ];

    return {
      costPerProduct,
      totalInvestment,
      revenue,
      profitPerProduct,
      totalProfit,
      profitMargin,
      breakEvenPrice,
      recommendedPrice,
      statusCategory,
      statusLabel,
      statusDesc,
      costsList,
    };
  }, [
    tshirtCost,
    dtfCost,
    marketingCost,
    transportCost,
    packagingCost,
    otherCost,
    sellingPrice,
    quantity,
    desiredProfitPct,
  ]);

  // Formatter BDT with commas
  const formatBDT = (amount: number): string => {
    if (isNaN(amount)) return '৳0';
    const rounded = Math.round(amount * 100) / 100;
    return '৳' + rounded.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  };

  // Reset to default
  const handleReset = () => {
    setProductName('');
    setSellingPrice(0);
    setTshirtCost(0);
    setDtfCost(0);
    setMarketingCost(0);
    setTransportCost(0);
    setPackagingCost(0);
    setOtherCost(0);
    setQuantity(1);
    setDesiredProfitPct(30);
  };

  // Preset loaders for quick easy calculations
  const handleLoadOversizedTee = () => {
    setProductName('Style X Oversized Drop Tee');
    setSellingPrice(850);
    setTshirtCost(220);
    setDtfCost(110);
    setMarketingCost(70);
    setTransportCost(30);
    setPackagingCost(20);
    setOtherCost(10);
    setQuantity(100);
    setDesiredProfitPct(30);
  };

  const handleLoadHoodie = () => {
    setProductName('Style X Heavyweight Hoodie');
    setSellingPrice(1850);
    setTshirtCost(650);
    setDtfCost(250);
    setMarketingCost(150);
    setTransportCost(50);
    setPackagingCost(40);
    setOtherCost(20);
    setQuantity(50);
    setDesiredProfitPct(35);
  };

  const handleLoadPolo = () => {
    setProductName('Style X Premium Polo');
    setSellingPrice(1150);
    setTshirtCost(380);
    setDtfCost(120);
    setMarketingCost(90);
    setTransportCost(35);
    setPackagingCost(25);
    setOtherCost(15);
    setQuantity(75);
    setDesiredProfitPct(30);
  };

  // Save to calculation history
  const handleSaveToHistory = () => {
    const newItem: CalculationHistoryItem = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      productName: productName.trim() || 'Unnamed Item',
      sellingPrice,
      costPerProduct: calc.costPerProduct,
      quantity,
      revenue: calc.revenue,
      totalCost: calc.totalInvestment,
      totalProfit: calc.totalProfit,
      profitMargin: calc.profitMargin,
      recommendedPrice: calc.recommendedPrice,
      desiredProfitPct,
    };

    setHistory((prev) => [newItem, ...prev.slice(0, 49)]);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleRestoreFromHistory = (item: CalculationHistoryItem) => {
    setProductName(item.productName);
    setSellingPrice(item.sellingPrice);
    setQuantity(item.quantity);
    setDesiredProfitPct(item.desiredProfitPct || 30);
  };

  const handleDeleteHistoryItem = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all calculation history?')) {
      setHistory([]);
    }
  };

  // Copy Summary text
  const handleCopySummary = () => {
    const summaryText = `📊 [STYLE X PROFIT CALCULATOR SUMMARY]
──────────────────────────────
পণ্যের নাম (Product): ${productName || 'N/A'}
বিক্রি পরিমাণ (Quantity): ${quantity} পিস
বিক্রি মূল্য (Selling Price): ${formatBDT(sellingPrice)}
──────────────────────────────
💸 খরচ হিসাব (Cost Breakdown):
  • টি-শার্ট খরচ (T-Shirt): ${formatBDT(tshirtCost)}
  • ডিটিএফ প্রিন্ট (DTF Print): ${formatBDT(dtfCost)}
  • মার্কেটিং (Marketing): ${formatBDT(marketingCost)}
  • পরিবহন (Transport): ${formatBDT(transportCost)}
  • প্যাকেজিং (Packaging): ${formatBDT(packagingCost)}
  • অন্যান্য (Other): ${formatBDT(otherCost)}
------------------------------
📦 মোট পিস প্রতি খরচ (Cost/Unit): ${formatBDT(calc.costPerProduct)}
📉 সর্বমোট বিনিয়োগ (Total Investment): ${formatBDT(calc.totalInvestment)}
📈 সম্ভাব্য মোট বিক্রি (Revenue): ${formatBDT(calc.revenue)}
💵 পিস প্রতি লাভ (Profit/Unit): ${formatBDT(calc.profitPerProduct)}
💰 সর্বমোট লাভ (Total Profit): ${formatBDT(calc.totalProfit)}
📊 লাভের পারসেন্ট (Profit Margin): ${calc.profitMargin.toFixed(2)}%
⚖ ব্রেক-ইভেন মূল্য (Break-even Price): ${formatBDT(calc.breakEvenPrice)}
🎯 কাঙ্ক্ষিত বিক্রি মূল্য (${desiredProfitPct}% profit): ${formatBDT(calc.recommendedPrice)}
🚦 স্ট্যাটাস (Status): ${calc.statusLabel}
──────────────────────────────`;

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Product Name',
      'Selling Price (BDT)',
      'T-Shirt Cost (BDT)',
      'DTF Cost (BDT)',
      'Marketing Cost (BDT)',
      'Transport Cost (BDT)',
      'Packaging Cost (BDT)',
      'Other Cost (BDT)',
      'Cost Per Unit (BDT)',
      'Quantity',
      'Total Investment (BDT)',
      'Total Revenue (BDT)',
      'Profit Per Unit (BDT)',
      'Total Profit (BDT)',
      'Profit Margin (%)',
      'Break-even Price (BDT)',
      'Recommended Price (BDT)',
      'Profit Status',
    ];

    const row = [
      `"${productName.replace(/"/g, '""')}"`,
      sellingPrice,
      tshirtCost,
      dtfCost,
      marketingCost,
      transportCost,
      packagingCost,
      otherCost,
      calc.costPerProduct,
      quantity,
      calc.totalInvestment,
      calc.revenue,
      calc.profitPerProduct,
      calc.totalProfit,
      calc.profitMargin.toFixed(2),
      calc.breakEvenPrice,
      calc.recommendedPrice.toFixed(2),
      `"${calc.statusLabel.replace(/"/g, '""')}"`,
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), row.join(',')].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `StyleX_Profit_${productName.replace(/[^a-zA-Z0-9]/g, '_') || 'Calculation'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print layout
  const handlePrint = () => {
    window.print();
  };

  // Filtered history
  const filteredHistory = history.filter((item) =>
    item.productName.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  return (
    <div className="space-y-6 animate-fade-in text-white print:p-0 print:bg-white print:text-black">
      {/* Top Header & Easy Quick Presets */}
      <div className="bg-[#15151D] border border-white/10 p-4 md:p-5 rounded-2xl shadow-xl print:hidden space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-luxury-gold/15 border border-luxury-gold/40 rounded-2xl text-luxury-gold shadow-[0_0_20px_rgba(212,175,55,0.25)]">
              <Calculator size={22} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-serif font-extrabold text-white tracking-wide flex items-center gap-2">
                STYLE X <span className="text-luxury-gold">প্রফিট ক্যালকুলেটর</span>
              </h1>
              <p className="text-xs font-mono text-zinc-300 mt-0.5">
                সহজে পিস প্রতি খরচ, বিক্রি মূল্য, লাভ ও লস এর হিসাব করুন (Easy Profit Calculator)
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSaveToHistory}
              className="px-3.5 py-2 bg-luxury-gold/15 hover:bg-luxury-gold/25 text-luxury-gold border border-luxury-gold/40 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(212,175,55,0.2)]"
            >
              {savedSuccess ? <Check size={14} className="text-emerald-400" /> : <Save size={14} />}
              {savedSuccess ? 'সংরক্ষিত!' : 'সেভ করুন (Save)'}
            </button>

            <button
              onClick={handleCopySummary}
              className="px-3.5 py-2 bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-mono font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              {copied ? 'কপি হয়েছে!' : 'কপি সামারি'}
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3 py-2 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Download size={14} />
              CSV এডিটর
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/10 rounded-xl text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Printer size={14} />
              প্রিন্ট
            </button>

            <button
              onClick={handleReset}
              className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/10 rounded-xl text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw size={14} />
              রিসেট
            </button>
          </div>
        </div>

        {/* Quick Example Presets bar */}
        <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <span className="text-zinc-400 font-bold flex items-center gap-1.5">
            <Zap size={14} className="text-amber-400 animate-pulse" />
            এক ক্লিকে ডেমো ডাটা বসান (Quick Presets):
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleLoadOversizedTee}
              className="px-2.5 py-1 bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 border border-purple-500/30 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
            >
              👕 Oversized Tee (৳850)
            </button>
            <button
              onClick={handleLoadHoodie}
              className="px-2.5 py-1 bg-blue-950/40 hover:bg-blue-900/60 text-blue-300 border border-blue-500/30 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
            >
              🧥 Heavy Hoodie (৳1850)
            </button>
            <button
              onClick={handleLoadPolo}
              className="px-2.5 py-1 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
            >
              👔 Polo Shirt (৳1150)
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Input Panel */}
        <div className="lg:col-span-5 bg-[#15151D] border border-white/10 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-5 print:border-black">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h2 className="text-xs sm:text-sm font-mono font-bold tracking-wider text-luxury-gold uppercase flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-luxury-gold text-black flex items-center justify-center font-extrabold text-[10px]">
                1
              </span>
              ইনপুট ঘরসমূহ (INPUT FIELDS)
            </h2>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30 font-bold">
              ⚡ অটো হিসাব
            </span>
          </div>

          {/* Product Name */}
          <div className="space-y-1">
            <label className="text-xs font-mono text-zinc-300 font-bold flex items-center justify-between">
              <span>পণ্যের নাম (Product Name)</span>
              <span className="text-[10px] text-zinc-500 font-normal">ঐচ্ছিক</span>
            </label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="যেমন: Style X Drop Tee"
              className="w-full bg-[#0E0E14] border border-white/15 focus:border-luxury-gold rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none transition-all shadow-inner font-sans"
            />
          </div>

          {/* Selling Price - Highlighted Box */}
          <div className="space-y-2 bg-gradient-to-r from-luxury-gold/[0.08] to-purple-900/10 p-3.5 rounded-2xl border border-luxury-gold/30">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-extrabold text-luxury-gold flex items-center gap-1">
                <DollarSign size={15} />
                বিক্রি মূল্য (Selling Price Per Product) *
              </label>
              <span className="text-[10px] font-mono text-luxury-gold/80 bg-black/40 px-2 py-0.5 rounded border border-luxury-gold/20">
                গ্রাহক দাম
              </span>
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-luxury-gold font-black text-base">
                ৳
              </span>
              <input
                type="number"
                min="0"
                step="any"
                value={sellingPrice === 0 ? '' : sellingPrice}
                onChange={(e) => setSellingPrice(parsePositiveNum(e.target.value))}
                placeholder="850"
                className="w-full bg-[#0E0E14] border border-luxury-gold/50 focus:border-luxury-gold rounded-xl pl-8 pr-20 py-2.5 text-base font-mono font-bold text-white focus:outline-none transition-all shadow-inner"
              />
              {/* Quick adjustment buttons */}
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSellingPrice((prev) => Math.max(0, prev - 50))}
                  className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white rounded font-mono text-xs font-bold transition-all cursor-pointer"
                  title="-50 Taka"
                >
                  -50
                </button>
                <button
                  type="button"
                  onClick={() => setSellingPrice((prev) => prev + 50)}
                  className="px-2 py-1 bg-luxury-gold text-black hover:brightness-110 rounded font-mono text-xs font-bold transition-all cursor-pointer"
                  title="+50 Taka"
                >
                  +50
                </button>
              </div>
            </div>
            <p className="text-[10px] font-mono text-zinc-400">প্রতি পিস কত টাকায় বিক্রি করবেন তা লিখুন</p>
          </div>

          {/* Cost Breakdown Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
              <span className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                <Box size={14} className="text-purple-400" />
                উৎপাদন খরচসমূহ (PRODUCT COST BREAKDOWN)
              </span>
              <span className="text-xs font-mono text-purple-300 font-bold bg-purple-950/70 px-2 py-0.5 rounded border border-purple-500/40">
                মোট খরচ: {formatBDT(calc.costPerProduct)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* T-Shirt Cost */}
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-zinc-300 font-medium flex items-center gap-1">
                  <Shirt size={12} className="text-blue-400" />
                  টি-শার্ট খরচ (৳)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={tshirtCost === 0 ? '' : tshirtCost}
                  onChange={(e) => setTshirtCost(parsePositiveNum(e.target.value))}
                  placeholder="220"
                  className="w-full bg-[#0E0E14] border border-white/15 focus:border-blue-400 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-white focus:outline-none transition-all"
                />
              </div>

              {/* DTF Print Cost */}
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-zinc-300 font-medium flex items-center gap-1">
                  <Sparkles size={12} className="text-purple-400" />
                  ডিটিএফ প্রিন্ট (৳)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={dtfCost === 0 ? '' : dtfCost}
                  onChange={(e) => setDtfCost(parsePositiveNum(e.target.value))}
                  placeholder="110"
                  className="w-full bg-[#0E0E14] border border-white/15 focus:border-purple-400 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-white focus:outline-none transition-all"
                />
              </div>

              {/* Marketing Cost */}
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-zinc-300 font-medium flex items-center gap-1">
                  <TrendingUp size={12} className="text-pink-400" />
                  মার্কেটিং/এডস (৳)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={marketingCost === 0 ? '' : marketingCost}
                  onChange={(e) => setMarketingCost(parsePositiveNum(e.target.value))}
                  placeholder="70"
                  className="w-full bg-[#0E0E14] border border-white/15 focus:border-pink-400 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-white focus:outline-none transition-all"
                />
              </div>

              {/* Transport Cost */}
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-zinc-300 font-medium flex items-center gap-1">
                  <Truck size={12} className="text-emerald-400" />
                  পরিবহন/কুরিয়ার (৳)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={transportCost === 0 ? '' : transportCost}
                  onChange={(e) => setTransportCost(parsePositiveNum(e.target.value))}
                  placeholder="30"
                  className="w-full bg-[#0E0E14] border border-white/15 focus:border-emerald-400 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-white focus:outline-none transition-all"
                />
              </div>

              {/* Packaging Cost */}
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-zinc-300 font-medium flex items-center gap-1">
                  <Package size={12} className="text-amber-400" />
                  প্যাকেজিং/বক্স (৳)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={packagingCost === 0 ? '' : packagingCost}
                  onChange={(e) => setPackagingCost(parsePositiveNum(e.target.value))}
                  placeholder="20"
                  className="w-full bg-[#0E0E14] border border-white/15 focus:border-amber-400 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-white focus:outline-none transition-all"
                />
              </div>

              {/* Other Cost */}
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-zinc-300 font-medium flex items-center gap-1">
                  <Tag size={12} className="text-zinc-400" />
                  অন্যান্য আনুষঙ্গিক (৳)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={otherCost === 0 ? '' : otherCost}
                  onChange={(e) => setOtherCost(parsePositiveNum(e.target.value))}
                  placeholder="10"
                  className="w-full bg-[#0E0E14] border border-white/15 focus:border-zinc-400 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-white focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Sales Quantity & Desired Profit Target */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="space-y-1 bg-white/[0.02] p-2.5 rounded-xl border border-white/10">
              <label className="text-xs font-mono text-zinc-300 font-bold flex items-center justify-between">
                <span>বিক্রি পরিমাণ (Quantity)</span>
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 10))}
                  className="w-7 h-8 bg-white/10 hover:bg-white/20 text-white rounded font-mono font-bold text-xs flex items-center justify-center shrink-0 cursor-pointer"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={quantity === 0 ? '' : quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  placeholder="100"
                  className="w-full bg-[#0E0E14] border border-white/15 focus:border-indigo-400 rounded-lg py-1.5 text-center text-xs font-mono font-bold text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => prev + 10)}
                  className="w-7 h-8 bg-white/10 hover:bg-white/20 text-white rounded font-mono font-bold text-xs flex items-center justify-center shrink-0 cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            <div className="space-y-1 bg-white/[0.02] p-2.5 rounded-xl border border-white/10">
              <label className="text-xs font-mono text-zinc-300 font-bold flex items-center justify-between">
                <span>প্রত্যাশিত লাভ % (Target %)</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={desiredProfitPct === 0 ? '' : desiredProfitPct}
                  onChange={(e) => setDesiredProfitPct(parsePositiveNum(e.target.value))}
                  placeholder="30"
                  className="w-full bg-[#0E0E14] border border-white/15 focus:border-indigo-400 rounded-lg px-3 py-1.5 pr-7 text-xs font-mono font-bold text-white focus:outline-none"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-zinc-400 text-xs font-bold">
                  %
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Results & Visual Cards */}
        <div className="lg:col-span-7 space-y-5">
          {/* Top Big At-a-Glance Summary Card */}
          <div className="bg-gradient-to-r from-luxury-gold/15 via-purple-900/20 to-indigo-900/20 border-2 border-luxury-gold/40 rounded-2xl p-4 sm:p-5 shadow-[0_0_30px_rgba(212,175,55,0.15)] relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-luxury-gold/20">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-luxury-gold font-bold block">
                  ⚡ এক নজরে হিসাব (RESULT SUMMARY)
                </span>
                <h3 className="text-lg sm:text-xl font-serif font-extrabold text-white mt-0.5">
                  {productName || 'Style X Item'} ({quantity} পিস)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full border ${
                  calc.statusCategory === 'excellent' ? 'bg-emerald-950 text-emerald-400 border-emerald-500/40' :
                  calc.statusCategory === 'good' ? 'bg-amber-950 text-amber-300 border-amber-500/40' :
                  calc.statusCategory === 'low' ? 'bg-orange-950 text-orange-300 border-orange-500/40' :
                  'bg-red-950 text-red-400 border-red-500/40'
                }`}>
                  {calc.statusLabel}
                </span>
              </div>
            </div>

            {/* Core Big Numbers */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
              <div className="bg-black/40 p-2.5 rounded-xl border border-white/10">
                <span className="text-[10px] font-mono text-zinc-400 block">সর্বমোট লাভ</span>
                <span className={`text-base sm:text-lg font-mono font-black ${calc.totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatBDT(calc.totalProfit)}
                </span>
              </div>

              <div className="bg-black/40 p-2.5 rounded-xl border border-white/10">
                <span className="text-[10px] font-mono text-zinc-400 block">পিস প্রতি লাভ</span>
                <span className={`text-base sm:text-lg font-mono font-black ${calc.profitPerProduct >= 0 ? 'text-pink-300' : 'text-red-400'}`}>
                  {formatBDT(calc.profitPerProduct)}
                </span>
              </div>

              <div className="bg-black/40 p-2.5 rounded-xl border border-white/10">
                <span className="text-[10px] font-mono text-zinc-400 block">সর্বমোট বিনিয়োগ</span>
                <span className="text-base sm:text-lg font-mono font-black text-blue-300">
                  {formatBDT(calc.totalInvestment)}
                </span>
              </div>

              <div className="bg-black/40 p-2.5 rounded-xl border border-white/10">
                <span className="text-[10px] font-mono text-zinc-400 block">প্রত্যাশিত দাম</span>
                <span className="text-base sm:text-lg font-mono font-black text-luxury-gold">
                  {formatBDT(calc.recommendedPrice)}
                </span>
              </div>
            </div>
          </div>

          {/* 9 Beautiful Output Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {/* 1. Cost Per Product */}
            <div className="bg-[#15151D] border border-white/10 p-3.5 rounded-2xl hover:border-purple-500/40 transition-all duration-300 shadow-lg">
              <div className="flex items-center justify-between text-zinc-400 mb-1">
                <span className="text-[10px] font-mono uppercase tracking-wider">📦 পিস প্রতি উৎপাদন খরচ</span>
                <Box size={14} className="text-purple-400" />
              </div>
              <p className="font-mono text-base md:text-lg font-black text-purple-300">
                {formatBDT(calc.costPerProduct)}
              </p>
              <span className="text-[9px] font-mono text-zinc-500 block mt-1">Cost Per Product</span>
            </div>

            {/* 2. Selling Price */}
            <div className="bg-[#15151D] border border-white/10 p-3.5 rounded-2xl hover:border-luxury-gold/40 transition-all duration-300 shadow-lg">
              <div className="flex items-center justify-between text-zinc-400 mb-1">
                <span className="text-[10px] font-mono uppercase tracking-wider">💰 নির্ধারিত বিক্রি মূল্য</span>
                <DollarSign size={14} className="text-luxury-gold" />
              </div>
              <p className="font-mono text-base md:text-lg font-black text-luxury-gold">
                {formatBDT(sellingPrice)}
              </p>
              <span className="text-[9px] font-mono text-zinc-500 block mt-1">Selling Price Per Product</span>
            </div>

            {/* 3. Total Investment */}
            <div className="bg-[#15151D] border border-white/10 p-3.5 rounded-2xl hover:border-blue-500/40 transition-all duration-300 shadow-lg">
              <div className="flex items-center justify-between text-zinc-400 mb-1">
                <span className="text-[10px] font-mono uppercase tracking-wider">📉 সর্বমোট বিনিয়োগ</span>
                <TrendingDown size={14} className="text-blue-400" />
              </div>
              <p className="font-mono text-base md:text-lg font-black text-blue-300">
                {formatBDT(calc.totalInvestment)}
              </p>
              <span className="text-[9px] font-mono text-zinc-500 block mt-1">Total Investment ({quantity} pcs)</span>
            </div>

            {/* 4. Estimated Revenue */}
            <div className="bg-[#15151D] border border-white/10 p-3.5 rounded-2xl hover:border-emerald-500/40 transition-all duration-300 shadow-lg">
              <div className="flex items-center justify-between text-zinc-400 mb-1">
                <span className="text-[10px] font-mono uppercase tracking-wider">📈 সম্ভাব্য সর্বমোট বিক্রি</span>
                <TrendingUp size={14} className="text-emerald-400" />
              </div>
              <p className="font-mono text-base md:text-lg font-black text-emerald-300">
                {formatBDT(calc.revenue)}
              </p>
              <span className="text-[9px] font-mono text-zinc-500 block mt-1">Estimated Revenue</span>
            </div>

            {/* 5. Profit Per Product */}
            <div className="bg-[#15151D] border border-white/10 p-3.5 rounded-2xl hover:border-pink-500/40 transition-all duration-300 shadow-lg">
              <div className="flex items-center justify-between text-zinc-400 mb-1">
                <span className="text-[10px] font-mono uppercase tracking-wider">💵 পিস প্রতি লাভ</span>
                <DollarSign size={14} className="text-pink-400" />
              </div>
              <p
                className={`font-mono text-base md:text-lg font-black ${
                  calc.profitPerProduct >= 0 ? 'text-pink-300' : 'text-red-400'
                }`}
              >
                {formatBDT(calc.profitPerProduct)}
              </p>
              <span className="text-[9px] font-mono text-zinc-500 block mt-1">Profit Per Product</span>
            </div>

            {/* 6. Total Profit */}
            <div className="bg-[#15151D] border border-white/10 p-3.5 rounded-2xl hover:border-emerald-400/40 transition-all duration-300 shadow-lg">
              <div className="flex items-center justify-between text-zinc-400 mb-1">
                <span className="text-[10px] font-mono uppercase tracking-wider">💸 সর্বমোট নিট লাভ</span>
                <Sparkles size={14} className="text-emerald-400" />
              </div>
              <p
                className={`font-mono text-base md:text-lg font-black ${
                  calc.totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {formatBDT(calc.totalProfit)}
              </p>
              <span className="text-[9px] font-mono text-zinc-500 block mt-1">Total Profit</span>
            </div>

            {/* 7. Profit Margin */}
            <div className="bg-[#15151D] border border-white/10 p-3.5 rounded-2xl hover:border-amber-500/40 transition-all duration-300 shadow-lg">
              <div className="flex items-center justify-between text-zinc-400 mb-1">
                <span className="text-[10px] font-mono uppercase tracking-wider">📊 লাভের পারসেন্ট</span>
                <Percent size={14} className="text-amber-400" />
              </div>
              <p
                className={`font-mono text-base md:text-lg font-black ${
                  calc.profitMargin >= 30
                    ? 'text-emerald-400'
                    : calc.profitMargin >= 15
                    ? 'text-amber-300'
                    : calc.profitMargin >= 5
                    ? 'text-orange-300'
                    : 'text-red-400'
                }`}
              >
                {calc.profitMargin.toFixed(2)}%
              </p>
              <span className="text-[9px] font-mono text-zinc-500 block mt-1">Profit Margin</span>
            </div>

            {/* 8. Break-even Selling Price */}
            <div className="bg-[#15151D] border border-white/10 p-3.5 rounded-2xl hover:border-indigo-500/40 transition-all duration-300 shadow-lg">
              <div className="flex items-center justify-between text-zinc-400 mb-1">
                <span className="text-[10px] font-mono uppercase tracking-wider">⚖ ব্রেক-ইভেন মূল দাম</span>
                <ShieldCheck size={14} className="text-indigo-400" />
              </div>
              <p className="font-mono text-base md:text-lg font-black text-indigo-300">
                {formatBDT(calc.breakEvenPrice)}
              </p>
              <span className="text-[9px] font-mono text-zinc-500 block mt-1">Break-even Selling Price</span>
            </div>

            {/* 9. Recommended Selling Price */}
            <div className="bg-[#15151D] border border-luxury-gold/40 p-3.5 rounded-2xl shadow-[0_0_15px_rgba(212,175,55,0.15)]">
              <div className="flex items-center justify-between text-luxury-gold mb-1">
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold">🎯 কাঙ্ক্ষিত বিক্রি মূল্য</span>
                <Tag size={14} className="text-luxury-gold" />
              </div>
              <p className="font-mono text-base md:text-lg font-black text-luxury-gold">
                {formatBDT(calc.recommendedPrice)}
              </p>
              <span className="text-[9px] font-mono text-zinc-300 block mt-1">Recommended ({desiredProfitPct}% profit)</span>
            </div>
          </div>

          {/* Live Animated Comparison Bars */}
          <div className="bg-[#15151D] border border-white/10 p-5 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                <BarChart3 size={15} className="text-luxury-gold" />
                ভিজ্যুয়াল চার্ট (REVENUE VS COST VS PROFIT)
              </h3>
              <span className="text-[10px] font-mono text-zinc-400">{quantity} পিস আইটেম</span>
            </div>

            {/* Visual Bar Comparison Chart */}
            <div className="space-y-3 pt-1">
              {/* Revenue Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                    মোট বিক্রি (Revenue)
                  </span>
                  <span className="text-white font-bold">{formatBDT(calc.revenue)}</span>
                </div>
                <div className="w-full bg-black/50 h-3 rounded-full overflow-hidden border border-white/10 p-0.5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 0.5 }}
                    className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-400 h-full rounded-full"
                  />
                </div>
              </div>

              {/* Total Investment Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-blue-400 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
                    সর্বমোট খরচ (Total Investment)
                  </span>
                  <span className="text-white font-bold">{formatBDT(calc.totalInvestment)}</span>
                </div>
                <div className="w-full bg-black/50 h-3 rounded-full overflow-hidden border border-white/10 p-0.5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: calc.revenue > 0 ? `${Math.min(100, (calc.totalInvestment / calc.revenue) * 100)}%` : '0%',
                    }}
                    transition={{ duration: 0.5 }}
                    className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-400 h-full rounded-full"
                  />
                </div>
              </div>

              {/* Total Profit Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span
                    className={`font-bold flex items-center gap-1 ${
                      calc.totalProfit >= 0 ? 'text-luxury-gold' : 'text-red-400'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full inline-block ${
                        calc.totalProfit >= 0 ? 'bg-luxury-gold' : 'bg-red-400'
                      }`}
                    />
                    সর্বমোট নিট লাভ (Total Profit)
                  </span>
                  <span className="text-white font-bold">{formatBDT(calc.totalProfit)}</span>
                </div>
                <div className="w-full bg-black/50 h-3 rounded-full overflow-hidden border border-white/10 p-0.5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width:
                        calc.revenue > 0 && calc.totalProfit > 0
                          ? `${Math.min(100, (calc.totalProfit / calc.revenue) * 100)}%`
                          : '0%',
                    }}
                    transition={{ duration: 0.5 }}
                    className={`h-full rounded-full ${
                      calc.totalProfit >= 0
                        ? 'bg-gradient-to-r from-amber-500 via-luxury-gold to-yellow-300'
                        : 'bg-red-500'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Cost Component Breakdown Stack Bar */}
            <div className="pt-3 border-t border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-zinc-300">
                <span className="flex items-center gap-1">
                  <PieChart size={13} className="text-purple-400" />
                  খরচের অনুপাত (Cost Ratio Breakdown)
                </span>
                <span>পিস প্রতি: {formatBDT(calc.costPerProduct)}</span>
              </div>

              {/* Stacked Percentage Bar */}
              <div className="w-full h-3 rounded-lg overflow-hidden flex bg-black/40 border border-white/10">
                {calc.costPerProduct > 0 ? (
                  calc.costsList.map((item, idx) => {
                    const pct = (item.value / calc.costPerProduct) * 100;
                    if (pct <= 0) return null;
                    return (
                      <div
                        key={idx}
                        style={{ width: `${pct}%`, backgroundColor: item.color }}
                        className="h-full transition-all duration-300 hover:brightness-125"
                        title={`${item.label}: ${formatBDT(item.value)} (${pct.toFixed(1)}%)`}
                      />
                    );
                  })
                ) : (
                  <div className="w-full h-full bg-zinc-800" />
                )}
              </div>

              {/* Legend Badges */}
              <div className="flex flex-wrap gap-2 text-[10px] font-mono pt-1">
                {calc.costsList.map((item, idx) => {
                  const pct = calc.costPerProduct > 0 ? (item.value / calc.costPerProduct) * 100 : 0;
                  return (
                    <div key={idx} className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-zinc-300">{item.label}:</span>
                      <span className="text-white font-bold">{formatBDT(item.value)} ({pct.toFixed(0)}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* History & Saved Calculations Section */}
      <div className="bg-[#15151D] border border-white/10 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4 print:hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-xs sm:text-sm font-mono font-bold text-luxury-gold uppercase tracking-wider flex items-center gap-2">
              <Save size={15} />
              পূর্ববর্তী সংরক্ষিত হিসাবসমূহ (SAVED LOGS - {history.length})
            </h3>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 md:w-64">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="নাম দিয়ে হিস্ট্রি খুঁজুন..."
                className="w-full bg-[#0E0E14] border border-white/10 focus:border-luxury-gold rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none transition-all font-mono"
              />
            </div>

            {history.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="px-3 py-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-500/30 rounded-xl text-xs font-mono transition-all flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Trash2 size={12} />
                মুছে ফেলুন
              </button>
            )}
          </div>
        </div>

        {/* History Table */}
        {filteredHistory.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 font-mono text-xs">
            {history.length === 0
              ? 'এখনো কোন হিস্ট্রি নেই। উপরে "সেভ করুন (Save)" বাটনে ক্লিক করে হিসাব সেভ করে রাখুন।'
              : 'খোঁজার সাথে কোন হিস্ট্রি রেকর্ড পাওয়া যায়নি।'}
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-white/10">
            <table className="w-full text-left font-mono text-xs whitespace-nowrap divide-y divide-white/10">
              <thead>
                <tr className="bg-white/[0.02] text-zinc-400">
                  <th className="py-2.5 px-3">তারিখ</th>
                  <th className="py-2.5 px-3">পণ্যের নাম</th>
                  <th className="py-2.5 px-3">বিক্রি মূল্য</th>
                  <th className="py-2.5 px-3">পিস প্রতি খরচ</th>
                  <th className="py-2.5 px-3">পরিমাণ</th>
                  <th className="py-2.5 px-3">সর্বমোট খরচ</th>
                  <th className="py-2.5 px-3">সর্বমোট বিক্রি</th>
                  <th className="py-2.5 px-3">মোট লাভ</th>
                  <th className="py-2.5 px-3">মার্জিন</th>
                  <th className="py-2.5 px-3 text-right">একশনে</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 px-3 text-zinc-500 text-[11px]">{item.timestamp}</td>
                    <td className="py-2.5 px-3 font-bold text-white max-w-[180px] truncate">
                      {item.productName}
                    </td>
                    <td className="py-2.5 px-3 text-luxury-gold font-bold">{formatBDT(item.sellingPrice)}</td>
                    <td className="py-2.5 px-3 text-purple-300">{formatBDT(item.costPerProduct)}</td>
                    <td className="py-2.5 px-3 text-zinc-300">{item.quantity} পিস</td>
                    <td className="py-2.5 px-3 text-blue-300">{formatBDT(item.totalCost)}</td>
                    <td className="py-2.5 px-3 text-emerald-300">{formatBDT(item.revenue)}</td>
                    <td
                      className={`py-2.5 px-3 font-bold ${
                        item.totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {formatBDT(item.totalProfit)}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          item.profitMargin >= 30
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                            : item.profitMargin >= 15
                            ? 'bg-amber-950 text-amber-300 border border-amber-500/30'
                            : item.profitMargin >= 5
                            ? 'bg-orange-950 text-orange-300 border border-orange-500/30'
                            : 'bg-red-950 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {item.profitMargin.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleRestoreFromHistory(item)}
                        className="px-2 py-1 bg-luxury-gold/15 hover:bg-luxury-gold/30 text-luxury-gold border border-luxury-gold/30 rounded text-[10px] font-bold transition-all cursor-pointer"
                        title="রিলোড করুন"
                      >
                        লোড করুন
                      </button>
                      <button
                        onClick={() => handleDeleteHistoryItem(item.id)}
                        className="p-1 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                        title="ডিলিট"
                      >
                        <Trash2 size={12} />
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
  );
}

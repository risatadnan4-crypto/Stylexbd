import React, { useState, useEffect } from 'react';
import { X, Trash2, ShieldCheck, ShoppingBag, Plus, Minus, Check, User, Phone, MapPin, Tag, ChevronDown, MessageSquare, ArrowLeft, ArrowRight } from 'lucide-react';
import { CartItem, Coupon, Customer } from '../types';
import { formatPrice, CITIES_LIST, getDivisionForCity } from '../utils';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQty: (idx: number, qty: number) => void;
  onRemoveItem: (idx: number) => void;
  activeCoupons: Coupon[];
  settings?: {
    whatsappNumber: string;
    paymentBadgeTitle?: string;
    paymentBadgeDescription?: string;
    lotteryDiscountPercentage?: number;
  };
  onCheckoutSuccess: (orderId: string, whatsappUrl: string) => void;
  initialShowCheckout?: boolean;
  customer?: Customer | null;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQty,
  onRemoveItem,
  activeCoupons,
  settings,
  onCheckoutSuccess,
  initialShowCheckout = false,
  customer
}: CartDrawerProps) {
  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  // Checkout Form State
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerCity, setCustomerCity] = useState('Dhaka');
  const [customerNotes, setCustomerNotes] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Auto pre-fill vip credentials
  useEffect(() => {
    if (customer && isOpen) {
      setCustomerName(customer.name);
      if (customer.phone) {
        setCustomerPhone(customer.phone);
      }
    }
  }, [customer, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setShowCheckoutForm(initialShowCheckout);
    }
  }, [isOpen, initialShowCheckout]);

  if (!isOpen) return null;

  // Compute values
  const itemsTotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === 'PERCENTAGE') {
      discountAmount = Math.round((itemsTotal * appliedCoupon.value) / 100);
    } else {
      discountAmount = appliedCoupon.value;
    }
  }

  // Delivery charge - calculated dynamically from custom product attributes resolved via 8-division mapping
  const shippingDivision = getDivisionForCity(customerCity);
  const deliveryCharge = cartItems.length === 0
    ? (shippingDivision === "Dhaka" ? 100 : 150)
    : cartItems.reduce((max, item) => {
        let customPrice = 150; // default for country/outside
        
        switch (shippingDivision) {
          case "Dhaka":
            customPrice = item.product.deliveryPriceDhaka !== undefined ? Number(item.product.deliveryPriceDhaka) : 100;
            break;
          case "Chattogram":
            customPrice = item.product.deliveryPriceChattogram !== undefined ? Number(item.product.deliveryPriceChattogram) : 150;
            break;
          case "Rajshahi":
            customPrice = item.product.deliveryPriceRajshahi !== undefined ? Number(item.product.deliveryPriceRajshahi) : 150;
            break;
          case "Khulna":
            customPrice = item.product.deliveryPriceKhulna !== undefined ? Number(item.product.deliveryPriceKhulna) : 150;
            break;
          case "Barishal":
            customPrice = item.product.deliveryPriceBarishal !== undefined ? Number(item.product.deliveryPriceBarishal) : 150;
            break;
          case "Sylhet":
            customPrice = item.product.deliveryPriceSylhet !== undefined ? Number(item.product.deliveryPriceSylhet) : 150;
            break;
          case "Rangpur":
            customPrice = item.product.deliveryPriceRangpur !== undefined ? Number(item.product.deliveryPriceRangpur) : 150;
            break;
          case "Mymensingh":
            customPrice = item.product.deliveryPriceMymensingh !== undefined ? Number(item.product.deliveryPriceMymensingh) : 150;
            break;
          default:
            customPrice = item.product.deliveryPriceDhaka !== undefined ? Number(item.product.deliveryPriceDhaka) : 150;
            break;
        }
        
        return customPrice > max ? customPrice : max;
      }, 0);
  const grandTotal = Math.max(0, itemsTotal - discountAmount + deliveryCharge);

  // Validate and Apply Coupon
  const handleApplyCoupon = (overrideCode?: string) => {
    setCouponError('');
    setCouponSuccess('');
    const targetCode = overrideCode !== undefined ? overrideCode : couponCode;
    const codeUpper = targetCode.trim().toUpperCase();
    if (!codeUpper) return;

    if (overrideCode !== undefined) {
      setCouponCode(codeUpper);
    }

    const matched = activeCoupons.find(c => c.code === codeUpper && c.active);
    if (matched) {
      setAppliedCoupon(matched);
      setCouponSuccess(`EXCLUSIVE CODE APPLIED (-${matched.type === 'PERCENTAGE' ? matched.value + '%' : '৳' + matched.value})`);
    } else {
      setCouponError('INVALID OR EXPIRED VIP CODE');
      setAppliedCoupon(null);
    }
  };

  // Submit Order Details
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (cartItems.length === 0) {
      setErrorMessage('YOUR SHOPPING BAG IS CURRENTLY EMPTY');
      return;
    }

    if (!customerName || !customerPhone || !customerAddress) {
      setErrorMessage('PLEASE PROVIDE ALL REQUIRED DELIVERIES FIELDS');
      return;
    }

    // Basic BD Phone validation: should contain numbers
    if (customerPhone.replace(/[^0-9]/g, '').length < 8) {
      setErrorMessage('PLEASE ENTER A VALID PHONE / MOBILE NUMBER');
      return;
    }

    setIsCheckingOut(true);

    try {
      const dbFormatItems = cartItems.map(item => ({
        productId: item.product.id,
        title: item.product.title,
        price: item.product.price,
        selectedSize: item.selectedSize,
        quantity: item.quantity
      }));

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerPhone,
          customerAddress,
          customerCity,
          customerNotes,
          customerEmail: customer?.email,
          items: dbFormatItems,
          totalAmount: grandTotal
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'ORDER CREATION FAILED');
      }

      // Success
      setAppliedCoupon(null);
      setCouponCode('');
      // Open Whatsapp link & show success
      onCheckoutSuccess(data.order.id, data.whatsappUrl);
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected database error occurred');
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 overflow-hidden flex transition-all duration-500 ease-in-out ${showCheckoutForm ? 'items-center justify-center p-3 sm:p-6' : 'justify-end'}`}>
      {/* Absolute dim backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-luxury-black/90 backdrop-blur-md transition-opacity duration-300"
      ></div>

      {/* Cart Drawer Panel */}
      <div className={`relative w-full bg-gradient-to-b from-[#0f0420] via-[#080211] to-[#040108] border flex flex-col shadow-2xl z-10 overflow-hidden transition-all duration-300 ${
        showCheckoutForm 
          ? 'max-w-2xl border-luxury-gold/30 rounded-2xl max-h-[92vh] md:max-h-[85vh] shadow-[0_0_60px_rgba(212,175,55,0.25)]' 
          : 'max-w-lg border-l border-luxury-gold/15 h-full'
      }`}>
        
        {/* Header Title */}
        <div className="flex items-center justify-between border-b border-white/5 p-5">
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} className="text-luxury-gold animate-pulse" />
            <h3 className="font-serif text-sm sm:text-base md:text-lg font-bold tracking-widest uppercase text-white">
              {showCheckoutForm ? "⚜️ SECURE DISPATCH CHECKOUT" : "Your Selection"}
            </h3>
            {!showCheckoutForm && (
              <span className="text-xs text-white/40 font-mono bg-luxury-charcoal/80 px-2 py-0.5 rounded">
                {cartItems.length}
              </span>
            )}
          </div>
          <button 
            onClick={onClose}
            className="text-white/60 hover:text-luxury-gold hover:rotate-90 hover:scale-110 active:scale-95 transition-all duration-300 p-1.5 rounded-full hover:bg-white/5 border border-transparent hover:border-luxury-gold/30 hover:shadow-[0_0_15px_rgba(212,175,55,0.25)] cursor-pointer"
            title="Close Drawer"
          >
            <X size={18} />
          </button>
        </div>

        {cartItems.length === 0 ? (
          /* Empty Bag */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 bg-luxury-charcoal border border-luxury-gold/20 rounded flex items-center justify-center text-luxury-gold mb-4">
              <ShoppingBag size={24} />
            </div>
            <h4 className="font-serif text-base text-white/80 uppercase tracking-widest mb-2">Shopping Bag is Empty</h4>
            <p className="text-xs text-white/40 max-w-xs mb-6 font-light">
              Explore our curated drops collection and add pieces to your personal styling archive.
            </p>
            <button 
              onClick={onClose}
              className="border border-luxury-gold text-luxury-gold hover:bg-luxury-gold hover:text-luxury-black font-display text-[10px] uppercase font-bold tracking-widest py-2 px-6 rounded transition-all"
            >
              Continue Exploring
            </button>
          </div>
        ) : !showCheckoutForm ? (
          /* Step 1: Cart Items Selection & Coupon Verification */
          <div className="flex-1 flex flex-col justify-between overflow-hidden">
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* List Selection items - Fully visible without nested scroll boundaries */}
              <div className="space-y-3">
                {cartItems.map((item, idx) => (
                  <div 
                    key={`${item.product.id}-${item.selectedSize}`} 
                    className="flex gap-3 bg-luxury-charcoal/30 border border-white/5 p-3 rounded hover:border-luxury-gold/20 transition-all animate-fade-in"
                  >
                    <img 
                      src={item.product.imageUrl} 
                      alt={item.product.title} 
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 object-cover rounded border border-white/10 flex-shrink-0"
                    />
                    
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-1">
                          <h4 className="font-serif text-[13px] text-white font-medium line-clamp-1">{item.product.title}</h4>
                          <span className="font-serif text-xs font-semibold text-luxury-gold">
                            {formatPrice(item.product.price * item.quantity)}
                          </span>
                        </div>
                        <div className="flex gap-2 text-[9px] text-white/40 font-mono mt-0.5">
                          <span>SIZE: {item.selectedSize}</span>
                          <span>•</span>
                          <span>{item.product.code}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        {/* Qty edit buttons */}
                        <div className="flex items-center bg-luxury-black border border-white/10 rounded overflow-hidden">
                          <button 
                            onClick={() => onUpdateQty(idx, item.quantity - 1)}
                            className="p-1 text-white hover:text-luxury-gold hover:bg-luxury-charcoal transition-colors cursor-pointer"
                          >
                            <Minus size={10} />
                          </button>
                          <span className="px-2.5 text-[10px] font-mono text-white font-bold">{item.quantity}</span>
                          <button 
                            onClick={() => onUpdateQty(idx, item.quantity + 1)}
                            className="p-1 text-white hover:text-luxury-gold hover:bg-luxury-charcoal transition-colors cursor-pointer"
                          >
                            <Plus size={10} />
                          </button>
                        </div>

                        {/* Remove trash */}
                        <button 
                          onClick={() => onRemoveItem(idx)}
                          className="text-white/40 hover:text-red-400 transition-colors p-1"
                          title="Remove piece"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                    </div>
                  </div>
                ))}
              </div>

              {/* VIP Coupon Redeemer - High Premium Input Card */}
              <div className="border-t border-white/[0.06] pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] uppercase font-mono tracking-[0.2em] text-[#d4af37] font-black flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] shadow-[0_0_8px_#d4af37]"></span>
                    VIP ACCREDITED CONCIERGE CODE
                  </label>
                  <span className="text-[8px] uppercase font-mono text-white/30 tracking-widest bg-white/[0.04] px-1.5 py-0.5 rounded">
                    PROMOTION SECURED
                  </span>
                </div>

                <div className="flex gap-2">
                  <div className="relative group flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/20 group-focus-within:text-[#ffd700] transition-colors duration-300">
                      <Tag size={13} strokeWidth={2.5} />
                    </div>
                    <input 
                      type="text" 
                      placeholder="ENTER VIP INVITATION CODE"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="w-full bg-black/40 text-white font-mono text-[11px] border border-white/10 hover:border-[#d4af37]/35 focus:border-[#d4af37] rounded-xl py-3.5 pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-[#d4af37]/30 transition-all duration-300 placeholder-white/25 uppercase tracking-[0.14em]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApplyCoupon()}
                    className="bg-gradient-to-r from-[#d4af37] to-[#aa8323] hover:from-[#ffd700] hover:to-[#d4af37] text-black font-display text-[10.5px] uppercase font-black tracking-widest px-6 rounded-xl transition-all duration-300 shadow-[0_4px_12px_rgba(212,175,55,0.15)] hover:shadow-[0_4px_20px_rgba(212,175,55,0.3)] transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                  >
                    Redeem
                  </button>
                </div>
                
                {/* Active available coupons list for clicking */}
                {activeCoupons && activeCoupons.filter(c => c.active).length > 0 && (
                  <div className="bg-[#0f0a17]/80 border border-[#d4af37]/20 p-4 rounded-xl space-y-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.4)] transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <span className="text-[9.5px] uppercase font-mono tracking-widest text-[#d4af37] font-extrabold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        SELECTABLE MEMBERSHIP PRIVILEGES
                      </span>
                      <span className="text-[8px] text-white/40 font-mono">TAP TO ACTIVATE</span>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-0.5">
                      {activeCoupons.filter(c => c.active).map(c => (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => handleApplyCoupon(c.code)}
                          className={`border rounded-xl px-3 py-2 text-[10.5px] font-mono tracking-wider flex items-center gap-2 transition-all duration-300 cursor-pointer ${
                            appliedCoupon?.code === c.code 
                              ? 'bg-emerald-500/10 border-emerald-400 text-emerald-400 font-extrabold shadow-[0_0_12px_rgba(16,185,129,0.25)] scale-[1.02]' 
                              : 'bg-white/[0.02] hover:bg-[#d4af37]/10 border-white/5 hover:border-[#d4af37]/40 text-[#d4af37] hover:text-[#ffd700] hover:scale-[1.01]'
                          }`}
                        >
                          <span className="font-sans font-black uppercase text-xs">🎟️ {c.code}</span>
                          <span className={`w-1 h-3 bg-white/10 ${appliedCoupon?.code === c.code ? 'bg-emerald-500/30' : ''}`}></span>
                          <span className={`${appliedCoupon?.code === c.code ? 'text-emerald-300 font-black' : 'text-white/55'} font-bold`}>
                            {c.type === 'PERCENTAGE' ? `-${c.value}% OFF` : `-৳${c.value}`}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {couponError && (
                  <p className="text-[9.5px] font-mono text-red-400 mt-1.5 pl-1 animate-pulse flex items-center gap-1">
                    <span>⚠️</span> {couponError}
                  </p>
                )}
                {couponSuccess && (
                  <p className="text-[10px] font-mono text-green-400 mt-1.5 flex items-center gap-1.5 bg-emerald-500/5 border border-emerald-500/20 px-3.5 py-2.5 rounded-xl animate-fade-in font-extrabold uppercase tracking-widest shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
                    <Check size={12} className="text-emerald-400" strokeWidth={3} /> {couponSuccess}
                  </p>
                )}
              </div>
            </div>

            {/* Step 1 Footer Action Board */}
            <div className="bg-[#0b0b0b] border-t border-white/5 p-5 space-y-4">
              <div className="space-y-2 font-display">
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>Subtotal Segment</span>
                  <span className="font-mono">{formatPrice(itemsTotal)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-xs text-green-400 font-semibold animate-fade-in">
                    <span>🎟️ VIP Discount Applied</span>
                    <span className="font-mono">-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-white font-black border-t border-white/5 pt-3">
                  <span className="uppercase tracking-[0.14em]">Items Total</span>
                  <span className="text-luxury-gold text-lg font-mono">{formatPrice(itemsTotal - discountAmount)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowCheckoutForm(true)}
                className="w-full bg-gradient-to-r from-[#d4af37] via-[#ffd700] to-[#fcf1cc] hover:brightness-110 text-black font-display font-black uppercase text-xs tracking-[0.22em] py-4 rounded-xl shadow-[0_5px_25px_rgba(212,175,55,0.25)] hover:shadow-[0_8px_35px_rgba(212,175,55,0.45)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center justify-center gap-2 group relative overflow-hidden luxury-reflection"
              >
                <span>PROCEED TO SECURE CHECKOUT</span>
                <ArrowRight size={14} className="text-black stroke-[2.5] group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        ) : (
          /* Step 2: The Secure Order Delivery Form */
          <div className="flex-1 flex flex-col justify-between overflow-hidden">
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              
              {/* Back navigation CTA */}
              <button 
                type="button"
                onClick={() => setShowCheckoutForm(false)}
                className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[#d4af37] hover:text-white transition-colors duration-200 cursor-pointer group mb-1"
              >
                <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
                <span>Return to Shopping Bag</span>
              </button>

              <form onSubmit={handleFormSubmit} className="space-y-4 animate-fade-in bg-gradient-to-b from-[#110524]/20 via-[#04120a]/10 to-[#1e1403]/15 p-4.5 rounded-2xl border border-white/[0.04] shadow-[0_10px_30px_rgba(9,3,18,0.5)]">
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <h4 className="font-serif text-[13.5px] text-white/95 uppercase tracking-wider flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#9a4dff] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#d4af37]"></span>
                    </span>
                    <span className="bg-gradient-to-r from-[#ffd700] via-[#cdaaff] to-[#10b981] bg-clip-text text-transparent font-black font-display tracking-widest text-[11px] sm:text-xs">
                      Delivery Credentials
                    </span>
                  </h4>
                  <span className="text-[8px] font-mono text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></span>
                    VIP SECURE DISPATCH
                  </span>
                </div>

                {/* Recipient Full Name */}
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-mono tracking-widest text-[#d4af37] font-bold flex items-center justify-between">
                    <span>Recipient Full Name</span>
                    <span className="text-white/40 font-normal text-[8px]">• REQUIRED</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-400/70 group-focus-within:text-[#d4af37] transition-colors duration-300">
                      <User size={14} />
                    </div>
                    <input 
                      type="text" 
                      required
                      placeholder="Enter recipient's complete name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-[#130724]/40 text-white font-sans text-xs border border-purple-500/20 hover:border-purple-500/40 focus:border-luxury-gold/90 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-600/25 transition-all duration-300 placeholder-white/20"
                    />
                    <div className="absolute top-0 right-0 py-3 pr-3.5 flex items-center pointer-events-none text-[8.5px] font-mono text-purple-400/20 group-focus-within:text-[#d4af37]/40 transition-colors">
                      FULL NAME
                    </div>
                  </div>
                </div>

                {/* Contact Mobile Number */}
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-mono tracking-widest text-[#10b981] font-bold flex items-center justify-between">
                    <span>Contact Mobile Number</span>
                    <span className="text-white/40 font-normal text-[8px]">• REQUIRED</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-500/70 group-focus-within:text-emerald-400 transition-colors duration-300">
                      <Phone size={14} />
                    </div>
                    <input 
                      type="tel" 
                      required
                      placeholder="e.g. +88017XXXXXXXX"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full bg-[#0a1811]/40 text-white font-sans text-xs border border-emerald-500/20 hover:border-emerald-500/40 focus:border-[#10b981]/90 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-600/25 transition-all duration-300 placeholder-white/20"
                    />
                    <div className="absolute top-0 right-0 py-3 pr-3.5 flex items-center pointer-events-none text-[8.5px] font-mono text-emerald-400/20 group-focus-within:text-[#10b981]/40 transition-colors">
                      TELEPHONE
                    </div>
                  </div>
                </div>

                {/* City Dropdown & Courier Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Shipping City select */}
                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-mono tracking-widest text-[#d4af37] font-bold flex items-center justify-between">
                      <span>Shipping City</span>
                      <span className="text-white/40 font-normal text-[8px]">• REQUIRED</span>
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-400/70 group-focus-within:text-[#d4af37] transition-colors duration-300">
                        <MapPin size={14} />
                      </div>
                      <select
                        value={customerCity}
                        onChange={(e) => setCustomerCity(e.target.value)}
                        className="w-full bg-[#130724]/55 text-white font-sans text-xs border border-purple-500/20 hover:border-purple-500/45 focus:border-[#d4af37]/90 rounded-xl py-3 pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-purple-600/25 transition-all duration-300 appearance-none cursor-pointer"
                      >
                        {CITIES_LIST.map(city => (
                          <option key={city} value={city} className="bg-[#0b0611] text-white font-sans">{city}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-white/40 group-focus-within:text-[#d4af37] transition-colors duration-300">
                        <ChevronDown size={14} />
                      </div>
                    </div>
                  </div>

                  {/* Handpicked Delivery Info Badge */}
                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-mono tracking-widest text-zinc-400 font-bold">
                      Delivery Courier Type
                    </label>
                    <div className="bg-gradient-to-r from-[#170a2b] via-[#041c0f] to-[#241a05] border border-[#d4af37]/25 text-[#ffd700] text-[10px] px-4 py-3 rounded-xl font-mono flex items-center justify-between shadow-[0_0_15px_rgba(154,77,255,0.08)] h-[42px] mt-0.5">
                      <span className="font-extrabold tracking-widest justify-self-center text-[10px]">VIP HANDPICKED</span>
                      <span className="text-[7.5px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-black tracking-widest">SECURE</span>
                    </div>
                  </div>
                </div>

                {/* Complete Address Textarea */}
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-mono tracking-widest text-[#d4af37] font-bold flex items-center justify-between">
                    <span>Complete Address</span>
                    <span className="text-white/40 font-normal text-[8px]">• REQUIRED</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute top-3.5 left-0 pl-3.5 flex items-start pointer-events-none text-purple-400/70 group-focus-within:text-[#d4af37] transition-colors duration-300">
                      <MapPin size={14} className="mt-0.5" />
                    </div>
                    <textarea 
                      required
                      placeholder="Provide apartment, floor, building details and street bounds"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      className="w-full bg-[#130724]/40 text-white font-sans text-xs border border-purple-500/20 hover:border-purple-500/40 focus:border-[#d4af37]/90 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-600/25 transition-all duration-300 placeholder-white/20 resize-none h-16"
                    />
                    <div className="absolute top-3 right-3 flex items-center pointer-events-none text-[8.5px] font-mono text-purple-400/20 group-focus-within:text-[#d4af37]/30 transition-colors">
                      LOCATOR
                    </div>
                  </div>
                </div>

                {/* Bespoke Optional Notes */}
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-mono tracking-widest text-zinc-400 font-bold flex items-center justify-between">
                    <span>Bespoke Notes</span>
                    <span className="text-zinc-500 font-normal text-[8px]">• OPTIONAL</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#d4af37]/60 group-focus-within:text-purple-400 transition-colors duration-300">
                      <MessageSquare size={14} className="scale-95" />
                    </div>
                    <input 
                      type="text" 
                      placeholder="E.g. Place inside the black parcel drop box"
                      value={customerNotes}
                      onChange={(e) => setCustomerNotes(e.target.value)}
                      className="w-full bg-[#1c1304]/30 text-white font-sans text-xs border border-white/10 hover:border-white/20 focus:border-purple-500/80 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-600/20 transition-all duration-300 placeholder-white/20"
                    />
                    <div className="absolute top-0 right-0 py-3 pr-3.5 flex items-center pointer-events-none text-[8.5px] font-mono text-white/15 group-focus-within:text-purple-400/40 transition-colors pointer-events-none">
                      MEMORANDUM
                    </div>
                  </div>
                </div>

                {/* VIP Coupon Redeemer - High Premium Input Card inside Step 2 Checkout */}
                <div className="bg-black/50 border border-white/[0.04] p-4 rounded-2xl space-y-3 shadow-inner">
                  <div className="flex items-center justify-between">
                    <label className="block text-[9.5px] uppercase font-mono tracking-[0.2em] text-[#d4af37] font-black flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] shadow-[0_0_8px_#d4af37] animate-pulse"></span>
                      VIP ACCREDITED CONCIERGE CODE
                    </label>
                    <span className="text-[7.5px] uppercase font-mono text-white/20 tracking-wider bg-white/[0.03] px-1.5 py-0.5 rounded">
                      STEP 2 CONCIERGE
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <div className="relative group flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/20 group-focus-within:text-[#ffd700] transition-colors duration-300">
                        <Tag size={12} strokeWidth={2.5} />
                      </div>
                      <input 
                        type="text" 
                        placeholder="ENTER COUPON CODE"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="w-full bg-[#0a0510] text-white font-mono text-[10px] border border-white/5 hover:border-[#d4af37]/35 focus:border-[#d4af37] rounded-xl py-2.5 pl-9 pr-3 focus:outline-none focus:ring-1 focus:ring-[#d4af37]/20 transition-all duration-300 placeholder-white/20 uppercase tracking-[0.14em]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleApplyCoupon()}
                      className="bg-gradient-to-r from-zinc-800 to-black hover:from-[#d4af37] hover:to-[#ffd700] hover:text-black text-[#d4af37] border border-[#d4af37]/30 hover:border-transparent font-display text-[9.5px] uppercase font-black tracking-widest px-4 rounded-xl transition-all duration-300 transform active:translate-y-0 cursor-pointer"
                    >
                      Redeem
                    </button>
                  </div>

                  {/* Active available coupons list in Step 2 */}
                  {activeCoupons && activeCoupons.filter(c => c.active).length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[8.5px] uppercase font-mono text-white/40 tracking-wider block font-bold">
                        Available VIP Privileges:
                      </span>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {activeCoupons.filter(c => c.active).map(c => (
                          <button
                            key={'step2-' + c.code}
                            type="button"
                            onClick={() => handleApplyCoupon(c.code)}
                            className={`border rounded-lg px-2 py-1 text-[9.5px] font-mono tracking-wider flex items-center gap-1.5 transition-all duration-300 cursor-pointer ${
                              appliedCoupon?.code === c.code 
                                ? 'bg-emerald-500/10 border-emerald-400 text-emerald-400 font-extrabold scale-[1.01]' 
                                : 'bg-white/[0.01] hover:bg-[#d4af37]/10 border-white/5 hover:border-[#d4af37]/30 text-[#d4af37] hover:text-[#ffd700]'
                            }`}
                          >
                            <span>🎫 {c.code}</span>
                            <span className="opacity-40">|</span>
                            <span className={`${appliedCoupon?.code === c.code ? 'text-emerald-300' : 'text-white/40'}`}>
                              {c.type === 'PERCENTAGE' ? `-${c.value}%` : `-৳${c.value}`}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {couponError && (
                    <p className="text-[9px] font-mono text-red-400 pl-1 animate-pulse flex items-center gap-1">
                      <span>⚠️</span> {couponError}
                    </p>
                  )}
                  {couponSuccess && (
                    <p className="text-[9px] font-mono text-green-400 flex items-center gap-1 bg-emerald-500/5 border border-emerald-500/10 px-2.5 py-1.5 rounded-lg animate-fade-in font-extrabold uppercase tracking-wider">
                      <Check size={10} className="text-emerald-400" strokeWidth={3} /> {couponSuccess}
                    </p>
                  )}
                </div>

                {/* Secure Cash On Delivery Card Badge with sweeping shine */}
                <div className="bg-gradient-to-r from-luxury-gold/5 to-[#160b24]/20 border border-luxury-gold/25 rounded-xl p-4 space-y-1 relative overflow-hidden group/card shadow-lg">
                  <div className="absolute -right-6 -bottom-6 text-luxury-gold/10 pointer-events-none group-hover/card:scale-110 transition-transform duration-500">
                    <ShieldCheck size={72} />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover/card:translate-x-full transition-transform duration-[1500ms] ease-out pointer-events-none"></div>

                  <div className="flex items-center gap-2.5 text-luxury-gold">
                    <ShieldCheck size={18} className="flex-shrink-0 animate-pulse text-luxury-gold" />
                    <p className="font-display font-black uppercase tracking-widest text-[11px] leading-tight break-words pr-4">
                      {settings?.paymentBadgeTitle || "SECURE CASH ON DELIVERY GUARANTEED"}
                    </p>
                  </div>
                  <p className="text-[10.5px] text-zinc-300 font-sans leading-relaxed pl-7 break-words whitespace-pre-wrap">
                    {settings?.paymentBadgeDescription || "Pay upon secure physical delivery handoff. We verify each individual container personally with verified secure luxury seal tags. Zero online gateway threat risk."}
                  </p>
                </div>

                {errorMessage && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-[11px] font-mono animate-pulse">
                    ⚠️ SYSTEM ALARM: {errorMessage}
                  </div>
                )}

                {/* Calculation Matrix and Checkout Core trigger */}
                <div className="border-t border-white/5 pt-4 space-y-2.5 font-display">
                  <div className="flex justify-between text-[11.5px] text-zinc-400">
                    <span>Subtotal Value</span>
                    <span className="font-mono">{formatPrice(itemsTotal)}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-[11.5px] text-green-400 font-semibold animate-fade-in">
                      <span className="flex items-center gap-1">🎟️ VIP Code ({appliedCoupon.code})</span>
                      <span className="font-mono">-{formatPrice(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[11.5px] text-zinc-400">
                    <span>VIP Handpicked delivery ({customerCity})</span>
                    <span className="font-mono">{formatPrice(deliveryCharge)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm text-white font-extrabold border-t border-white/10 pt-3.5 mb-4">
                    <span className="uppercase tracking-[0.14em]">Grand Invoice Total</span>
                    <span className="text-luxury-gold text-base font-mono">{formatPrice(grandTotal)}</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isCheckingOut}
                    className="running-glow-gold-filled w-full text-white font-display font-black uppercase text-xs tracking-[0.25em] py-4.5 rounded-xl shadow-[0_5px_25px_rgba(154,77,255,0.25)] hover:shadow-[0_8px_35px_rgba(154,77,255,0.55)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isCheckingOut ? (
                      <>
                        <span className="relative z-10 w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                        <span className="relative z-10">SECURELY CONFIRMING VIP ALLOTMENT...</span>
                      </>
                    ) : (
                      <span className="relative z-10">⚜️ CONFIRM OFFICIAL LUXURY ORDER</span>
                    )}
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}

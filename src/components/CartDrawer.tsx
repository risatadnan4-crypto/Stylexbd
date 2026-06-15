import React, { useState } from 'react';
import { X, Trash2, ShieldCheck, ShoppingBag, Plus, Minus, Check } from 'lucide-react';
import { CartItem, Coupon } from '../types';
import { formatPrice, CITIES_LIST } from '../utils';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQty: (idx: number, qty: number) => void;
  onRemoveItem: (idx: number) => void;
  activeCoupons: Coupon[];
  onCheckoutSuccess: (orderId: string, whatsappUrl: string) => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQty,
  onRemoveItem,
  activeCoupons,
  onCheckoutSuccess
}: CartDrawerProps) {
  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  // Checkout Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerCity, setCustomerCity] = useState('Dhaka');
  const [customerNotes, setCustomerNotes] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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

  // Delivery charge
  const deliveryCharge = customerCity === "Dhaka" ? 100 : 150;
  const grandTotal = Math.max(0, itemsTotal - discountAmount + deliveryCharge);

  // Validate and Apply Coupon
  const handleApplyCoupon = () => {
    setCouponError('');
    setCouponSuccess('');
    const codeUpper = couponCode.trim().toUpperCase();
    if (!codeUpper) return;

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
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Absolute dim backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-luxury-black/80 backdrop-blur-sm transition-opacity duration-300"
      ></div>

      {/* Cart Drawer Panel */}
      <div className="relative w-full max-w-lg bg-[#080808] border-l border-luxury-gold/15 h-full flex flex-col justify-between shadow-2xl z-10 p-5 overflow-y-auto">
        
        {/* Header Title */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} className="text-luxury-gold" />
            <h3 className="font-serif text-lg font-medium tracking-wide uppercase text-white">Your Selection</h3>
            <span className="text-xs text-white/40 font-mono bg-luxury-charcoal/80 px-2 py-0.5 rounded">
              {cartItems.length}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="text-white/60 hover:text-luxury-gold transition-colors p-1"
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
        ) : (
          /* Cart items & Order forms */
          <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-1">
            
            {/* List Selection items */}
            <div className="space-y-3 max-h-[35vh] overflow-y-auto pr-1">
              {cartItems.map((item, idx) => (
                <div 
                  key={`${item.product.id}-${item.selectedSize}`} 
                  className="flex gap-3 bg-luxury-charcoal/30 border border-white/5 p-3 rounded hover:border-luxury-gold/20 transition-all"
                >
                  <img 
                    src={item.product.imageUrl} 
                    alt={item.product.title} 
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 object-cover rounded border border-white/10"
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

            {/* VIP Coupon Redeemer */}
            <div className="border-t border-white/5 pt-4">
              <label className="block text-[9.5px] uppercase font-mono tracking-widest text-white/50 mb-1.5">
                Apply VIP Concierge Code
              </label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="E.G. STYLEGOLD"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="bg-luxury-charcoal text-white font-sans text-xs border border-white/10 rounded py-2 px-3 focus:outline-none focus:border-luxury-gold uppercase tracking-widest flex-1 placeholder-white/20"
                />
                <button
                  onClick={handleApplyCoupon}
                  className="bg-luxury-charcoal hover:bg-luxury-black border border-luxury-gold/30 hover:border-luxury-gold text-luxury-gold hover:text-white font-display text-[10px] uppercase font-semibold tracking-widest px-4 rounded transition-all"
                >
                  Apply
                </button>
              </div>
              {couponError && <p className="text-[9.5px] font-mono text-red-400 mt-1">{couponError}</p>}
              {couponSuccess && <p className="text-[9.5://] font-mono text-green-400 mt-1 flex items-center gap-1">
                <Check size={11} /> {couponSuccess}
              </p>}
            </div>

            {/* Checkout Delivery details form */}
            <form onSubmit={handleFormSubmit} className="border-t border-white/5 pt-4 space-y-3.5">
              <h4 className="font-serif text-sm text-white/90 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-luxury-gold rounded-full"></span>
                Delivery Credentials
              </h4>

              {/* Name */}
              <div>
                <label className="block text-[9.5px] uppercase font-mono tracking-widest text-white/50 mb-1">
                  Recipient Full Name <span className="text-luxury-gold">*</span>
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="Enter your name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-luxury-charcoal text-white font-sans text-xs border border-white/10 rounded py-2.5 px-3 focus:outline-none focus:border-luxury-gold placeholder-white/20"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-[9.5px] uppercase font-mono tracking-widest text-white/50 mb-1">
                  Contact Mobile Number <span className="text-luxury-gold">*</span>
                </label>
                <input 
                  type="tel" 
                  required
                  placeholder="e.g. +88017XXXXXXXX"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-luxury-charcoal text-white font-sans text-xs border border-white/10 rounded py-2.5 px-3 focus:outline-none focus:border-luxury-gold placeholder-white/20"
                />
              </div>

              {/* City Dropdown */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9.5px] uppercase font-mono tracking-widest text-white/50 mb-1">
                    Shipping City <span className="text-luxury-gold">*</span>
                  </label>
                  <select
                    value={customerCity}
                    onChange={(e) => setCustomerCity(e.target.value)}
                    className="w-full bg-luxury-charcoal text-white font-sans text-xs border border-white/10 rounded py-2.5 px-3 focus:outline-none focus:border-luxury-gold"
                  >
                    {CITIES_LIST.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[9.5px] uppercase font-mono tracking-widest text-white/50 mb-1">
                    Delivery Courier Type
                  </label>
                  <div className="w-full bg-luxury-black/80 border border-white/5 text-[10px] p-2.5 rounded font-mono text-white/60">
                    VIP HANDPICKED
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-[9.5px] uppercase font-mono tracking-widest text-white/50 mb-1">
                  Complete Address <span className="text-luxury-gold">*</span>
                </label>
                <textarea 
                  required
                  rows={2}
                  placeholder="Apartment, Street Name, Block No."
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full bg-luxury-charcoal text-white font-sans text-xs border border-white/10 rounded py-2 px-3 focus:outline-none focus:border-luxury-gold placeholder-white/20 resize-none"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[9.5px] uppercase font-mono tracking-widest text-white/50 mb-1">
                  Bespoke Notes (Optional)
                </label>
                <input 
                  type="text" 
                  placeholder="E.g. Call before delivery, morning hours"
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  className="w-full bg-luxury-charcoal text-white font-sans text-xs border border-white/10 rounded py-2.5 px-3 focus:outline-none focus:border-luxury-gold placeholder-white/20"
                />
              </div>

              {/* Secure Cash On Delivery Option badge strictly allowed */}
              <div className="bg-luxury-gold/[0.03] border border-luxury-gold/25 rounded p-3 text-xs flex items-start gap-2.5">
                <ShieldCheck size={16} className="text-luxury-gold flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-display font-bold uppercase tracking-wider text-luxury-gold text-[10.5px]">
                    SECURE CASH ON DELIVERY GUARANTEED
                  </p>
                  <p className="text-[10px] text-white/60 font-sans leading-relaxed mt-0.5">
                    Pay upon receipt of collection. We verify every package personally with VIP tracking numbers. No online gateway risks.
                  </p>
                </div>
              </div>

              {errorMessage && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-2.5 rounded text-[11px] font-mono">
                  {errorMessage}
                </div>
              )}

              {/* Bottom calculations & Checkout submission */}
              <div className="border-t border-white/5 pt-4 space-y-2 font-display">
                <div className="flex justify-between text-xs text-white/60">
                  <span>Subtotal Value</span>
                  <span>{formatPrice(itemsTotal)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-xs text-green-400">
                    <span>VIP Code Discount</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs text-white/60">
                  <span>VIP Handpicked Delivery ({customerCity})</span>
                  <span>{formatPrice(deliveryCharge)}</span>
                </div>
                
                <div className="flex justify-between text-sm text-white font-bold border-t border-white/5 pt-2 mb-4">
                  <span className="uppercase tracking-widest">Grand Total</span>
                  <span className="text-luxury-gold text-base">{formatPrice(grandTotal)}</span>
                </div>

                <button
                  type="submit"
                  disabled={isCheckingOut}
                  className="w-full bg-gradient-to-r from-luxury-gold-dark to-luxury-gold hover:brightness-110 text-luxury-black font-display font-extrabold uppercase text-xs tracking-[0.2em] py-3.5 rounded shadow-xl transition-all disabled:opacity-50 mt-2"
                >
                  {isCheckingOut ? "PROCESSING ARCHIFS..." : "CONFIRM LUXURY ORDER"}
                </button>
              </div>

            </form>
          </div>
        )}

      </div>
    </div>
  );
}

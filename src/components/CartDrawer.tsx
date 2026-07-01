import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, ShieldCheck, ShoppingBag, Plus, Minus, Check, User, Phone, MapPin, Tag, ChevronDown, MessageSquare, ArrowLeft, ArrowRight } from 'lucide-react';
import { CartItem, Coupon, Customer, Product } from '../types';
import { formatPrice, CITIES_LIST, getDivisionForCity } from '../utils';
import { getValidatedTotal, getProductActivePrice, getAdvancePaymentAmount } from '../utils/totalHelper';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQty: (idx: number, qty: number) => void;
  onRemoveItem: (idx: number) => void;
  onUpdateSize?: (idx: number, size: string) => void;
  activeCoupons: Coupon[];
  products?: Product[];
  settings?: {
    whatsappNumber: string;
    paymentBadgeTitle?: string;
    paymentBadgeDescription?: string;
    lotteryDiscountPercentage?: number;
    lotteryCouponPrefix?: string;
    bkashLogoUrl?: string;
    nagadLogoUrl?: string;
    globalTimerEndTime?: string;
    globalTimerMessage?: string;
    globalTimerActive?: boolean;
    globalPaymentSystem?: string;
    globalPaymentMethod?: string;
    globalDeliveryDays?: string;
  };
  onCheckoutSuccess: (orderId: string, whatsappUrl: string, paymentInfo?: string) => void;
  initialShowCheckout?: boolean;
  customer?: Customer | null;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQty,
  onRemoveItem,
  onUpdateSize,
  activeCoupons,
  products = [],
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
  const [showCheckoutForm, setShowCheckoutForm] = useState(initialShowCheckout);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerCity, setCustomerCity] = useState('Dhaka');
  const [customerDistrict, setCustomerDistrict] = useState('Dhaka');
  const [customerArea, setCustomerArea] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Payment integration state
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad'>(() => {
    return settings?.globalPaymentSystem === 'always_nagad' ? 'nagad' : 'bkash';
  });

  useEffect(() => {
    if (settings?.globalPaymentSystem === 'always_nagad') {
      setPaymentMethod('nagad');
    } else if (settings?.globalPaymentSystem === 'always_bkash') {
      setPaymentMethod('bkash');
    }
  }, [settings?.globalPaymentSystem]);

  const [transactionId, setTransactionId] = useState('');
  const [transactionError, setTransactionError] = useState('');
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [screenshotBase64, setScreenshotBase64] = useState<string | null>(null);
  const [usedTransactionIds, setUsedTransactionIds] = useState<string[]>(() => {
    try {
      return JSON.parse(sessionStorage.getItem('stylex_used_txids') || '[]');
    } catch {
      return [];
    }
  });

  const validateTransactionId = (txId: string) => {
    if (!txId) {
      return 'অনলাইন ভেরিফিকেশনের জন্য ট্রানজেকশন আইডি (TrxID) আবশ্যিক।';
    }
    const cleanId = txId.trim();
    if (cleanId.length < 8) {
      return 'ট্রানজেকশন আইডি অবশ্যই কমপক্ষে ৮ অক্ষরের হতে হবে।';
    }
    if (cleanId.length > 30) {
      return 'ট্রানজেকশন আইডি ৩০ অক্ষরের বেশি হতে পারবে না।';
    }
    const alphanumericRegex = /^[a-zA-Z0-9]+$/;
    if (!alphanumericRegex.test(cleanId)) {
      return 'ট্রানজেকশন আইডি শুধুমাত্র ইংরেজি অক্ষর এবং সংখ্যা হতে হবে (কোনো স্পেস বা বিশেষ চিহ্ন ছাড়া)।';
    }
    if (usedTransactionIds.includes(cleanId.toUpperCase())) {
      return 'এই ট্রানজেকশন আইডিটি এই সেশনে ইতিমধ্যেই ব্যবহার করা হয়েছে।';
    }
    return '';
  };

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
        setScreenshotBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

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
    setCustomerDistrict(customerCity);
  }, [customerCity]);

  useEffect(() => {
    if (isOpen) {
      setShowCheckoutForm(initialShowCheckout);
    }
  }, [isOpen, initialShowCheckout]);

  // Compute values
  const itemsTotal = cartItems.reduce((sum, item) => sum + (getProductActivePrice(item.product) * item.quantity), 0);
  
  let discountAmount = 0;
  let couponDetailsNote = "";
  const lotteryPrefix = (settings?.lotteryCouponPrefix || 'RISAT').trim().toUpperCase();

  if (appliedCoupon) {
    if (appliedCoupon.code.toUpperCase().startsWith(lotteryPrefix)) {
      // Lottery coupon - applies only to items where lotteryEligible is true
      const lotteryEligibleTotal = cartItems.reduce((sum, item) => {
        return sum + (item.product.lotteryEligible !== false ? getProductActivePrice(item.product) * item.quantity : 0);
      }, 0);
      discountAmount = Math.round((lotteryEligibleTotal * appliedCoupon.value) / 100);
      couponDetailsNote = `(-${appliedCoupon.value}% on eligible items)`;
    } else {
      // Find if we have a matching product-specific coupon active in the store
      const specificProd = products.find(p => p.couponCode && p.couponCode.trim().toUpperCase() === appliedCoupon.code.toUpperCase());
      if (specificProd) {
        const matchingCartItems = cartItems.filter(item => item.product.id === specificProd.id);
        const specificTotal = matchingCartItems.reduce((sum, item) => sum + (getProductActivePrice(item.product) * item.quantity), 0);
        const discountVal = appliedCoupon.type === 'PERCENTAGE' ? appliedCoupon.value : 15;
        discountAmount = Math.round((specificTotal * discountVal) / 100);
        couponDetailsNote = `(-${discountVal}% on ${specificProd.title})`;
      } else {
        // Global coupon
        if (appliedCoupon.type === 'PERCENTAGE') {
          discountAmount = Math.round((itemsTotal * appliedCoupon.value) / 100);
        } else {
          discountAmount = appliedCoupon.value;
        }
      }
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

  // Resolve governing product settings (prefer any product that requires advance payment)
  const governingProduct = cartItems.find(item => item.product.paymentType && item.product.paymentType !== 'cod')?.product || cartItems[0]?.product;
  
  // Apply Global Payment Method Overrides
  let paymentType = governingProduct?.paymentType || 'cod';
  if (settings?.globalPaymentMethod === 'cod_only') {
    paymentType = 'cod';
  } else if (settings?.globalPaymentMethod === 'prepay_only') {
    if (paymentType === 'cod') {
      paymentType = 'full_advance';
    }
  }

  const bkashNumber = governingProduct?.bkashNumber || '';
  const nagadNumber = governingProduct?.nagadNumber || '';
  
  const isDeliveryEnabled = governingProduct?.deliveryCharge !== undefined && governingProduct?.deliveryCharge !== null
    ? governingProduct.deliveryCharge > 0
    : true; // Default to enabled if not explicitly specified

  const resolvedDeliveryCharge = isDeliveryEnabled
    ? (governingProduct?.deliveryCharge !== undefined && governingProduct.deliveryCharge > 0
        ? governingProduct.deliveryCharge
        : deliveryCharge)
    : 0;

  const grandTotal = getValidatedTotal(cartItems, resolvedDeliveryCharge, discountAmount);
  const advancePaymentAmount = getAdvancePaymentAmount(paymentType, resolvedDeliveryCharge, grandTotal);

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

    let matched = activeCoupons.find(c => c.code === codeUpper && c.active);
    
    // Dynamic support for lottery codes (one-time lottery offer)
    if (!matched && codeUpper.startsWith(lotteryPrefix)) {
      if (localStorage.getItem('has_used_lottery_code') === 'true') {
        setCouponError('YOU HAVE ALREADY USED THIS ONE-TIME EXCLUSIVE LOTTERY VOUCHER');
        setAppliedCoupon(null);
        return;
      }
      
      const pctStr = codeUpper.replace(lotteryPrefix, '');
      const pctVal = Number(pctStr);
      if (!isNaN(pctVal) && pctVal > 0 && pctVal <= 100) {
        // Enforce that at least one product in the shopping bag is lottery-eligible
        const lotteryEligibleTotal = cartItems.reduce((sum, item) => {
          return sum + (item.product.lotteryEligible !== false ? getProductActivePrice(item.product) * item.quantity : 0);
        }, 0);

        if (lotteryEligibleTotal === 0) {
          setCouponError('NONE OF THE PRODUCTS IN YOUR SHOPPING BAG ARE ELIGIBLE FOR DISCOUNTS WITH THIS WHEEL CODE');
          setAppliedCoupon(null);
          return;
        }

        matched = {
          id: 'dynamic-lottery',
          code: codeUpper,
          type: 'PERCENTAGE',
          value: pctVal,
          active: true
        } as any;
      }
    }

    // Dynamic support for single product custom coupon code configurations
    if (!matched) {
      const matchProductCoupon = products.find(p => p.couponCode && p.couponCode.trim().toUpperCase() === codeUpper);
      if (matchProductCoupon) {
        const isInCart = cartItems.some(i => i.product.id === matchProductCoupon.id);
        if (!isInCart) {
          setCouponError(`THIS COUPON (${codeUpper}) CAN ONLY BE USED FOR "${matchProductCoupon.title.toUpperCase()}". ADD IT TO YOUR SHOPPING BAG FIRST!`);
          setAppliedCoupon(null);
          return;
        }

        matched = {
          id: `product-coupon-${matchProductCoupon.id}`,
          code: codeUpper,
          type: 'PERCENTAGE',
          value: matchProductCoupon.couponDiscountPercent || 15,
          active: true
        } as any;
      }
    }

    if (matched) {
      if (matched.maxUses !== undefined && matched.maxUses > 0) {
        const used = matched.usedCount || 0;
        if (used >= matched.maxUses) {
          setCouponError(`THIS VIP CODE HAS REACHED ITS MAXIMUM USAGE LIMIT (${matched.maxUses} USES)`);
          setAppliedCoupon(null);
          return;
        }
      }
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

    let resolvedPaidAmount = 0;
    if (paymentType !== 'cod') {
      const txError = validateTransactionId(transactionId);
      if (txError) {
        setErrorMessage(txError);
        return;
      }
      resolvedPaidAmount = advancePaymentAmount;
    }

    setIsCheckingOut(true);

    try {
      const dbFormatItems = cartItems.map(item => ({
        productId: item.product.id,
        title: item.product.title,
        price: getProductActivePrice(item.product),
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
          customerDistrict,
          customerArea,
          customerNotes,
          customerEmail: customer?.email,
          items: dbFormatItems,
          totalAmount: grandTotal,
          couponCode: appliedCoupon ? appliedCoupon.code : undefined,
          paymentType,
          paymentMethod: paymentType === 'cod' ? 'COD' : paymentMethod,
          paidAmount: resolvedPaidAmount,
          transactionId: paymentType === 'cod' ? '' : transactionId.trim().toUpperCase(),
          paymentScreenshot: screenshotBase64 || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'ORDER CREATION FAILED');
      }

      // Record transaction ID in session to prevent duplicates
      if (paymentType !== 'cod' && transactionId) {
        const txUpper = transactionId.trim().toUpperCase();
        const updatedTxIds = [...usedTransactionIds, txUpper];
        setUsedTransactionIds(updatedTxIds);
        try {
          sessionStorage.setItem('stylex_used_txids', JSON.stringify(updatedTxIds));
        } catch (storageErr) {
          console.warn('Session storage write error: ', storageErr);
        }
      }

      // Success
      if (appliedCoupon && appliedCoupon.code.toUpperCase().startsWith(lotteryPrefix)) {
        localStorage.setItem('has_used_lottery_code', 'true');
      }
      setAppliedCoupon(null);
      setCouponCode('');
      setTransactionId('');
      setScreenshotPreview(null);
      setScreenshotBase64(null);
      
      // Store guest checkout details in localStorage so notifications can match them for status updates
      try {
        const prevOrderIds = JSON.parse(localStorage.getItem('stylex_placed_order_ids') || '[]');
        if (!prevOrderIds.includes(data.order.id)) {
          prevOrderIds.push(data.order.id);
          localStorage.setItem('stylex_placed_order_ids', JSON.stringify(prevOrderIds));
        }
        if (customerPhone) {
          localStorage.setItem('stylex_guest_phone', customerPhone);
        }
        if (customer?.email) {
          localStorage.setItem('stylex_guest_email', customer.email);
        }
        // Instantly reload app notifications
        if (typeof (window as any).refreshAppNotifications === 'function') {
          (window as any).refreshAppNotifications();
        }
      } catch (err) {
        console.warn('Error saving guest order context: ', err);
      }

      // Open Whatsapp link & show success
      let paymentLabel = 'Cash on Delivery (COD)';
      if (paymentType !== 'cod') {
        paymentLabel = `${paymentType === 'delivery_charge' ? 'Delivery Charge Advance' : 'Full Advance Payment'} (${paymentMethod === 'bkash' ? 'bKash' : 'Nagad'})`;
      }
      onCheckoutSuccess(data.order.id, data.whatsappUrl, paymentLabel);
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected database error occurred');
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={`fixed inset-0 z-50 overflow-hidden flex transition-all duration-300 ease-in-out ${showCheckoutForm ? 'items-center justify-center p-3 sm:p-6' : 'justify-end'}`}>
          {/* Absolute dim backdrop */}
          <motion.div 
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-luxury-black/95 backdrop-blur-md cursor-pointer"
          ></motion.div>

          {/* Cart Drawer Panel */}
          <motion.div 
            key={showCheckoutForm ? 'checkout-form-panel' : 'cart-items-panel'}
            initial={showCheckoutForm ? { opacity: 0, scale: 0.95, y: 15 } : { x: '100%' }}
            animate={showCheckoutForm ? { opacity: 1, scale: 1, y: 0 } : { x: 0 }}
            exit={showCheckoutForm ? { opacity: 0, scale: 0.95, y: 15 } : { x: '100%' }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            className={`relative w-full bg-gradient-to-b from-[#0f0420] via-[#080211] to-[#040108] border flex flex-col shadow-2xl z-10 overflow-hidden ${
              showCheckoutForm 
                ? 'max-w-2xl border border-luxury-gold/30 rounded-2xl h-[92vh] max-h-[92vh] sm:h-[88vh] sm:max-h-[88vh] shadow-[0_0_60px_rgba(212,175,55,0.25)] mx-auto' 
                : 'max-w-lg border-l border-luxury-gold/15 h-full'
            }`}
          >
        
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
                          <div className="flex flex-col items-end">
                            <AnimatePresence mode="popLayout">
                              <motion.span 
                                key={getProductActivePrice(item.product) * item.quantity}
                                initial={{ opacity: 0, scale: 0.85, y: -4 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.85, y: 4 }}
                                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                                className="luxury-animated-price text-luxury-gold text-[13px] font-bold"
                              >
                                {formatPrice(getProductActivePrice(item.product) * item.quantity)}
                              </motion.span>
                            </AnimatePresence>
                            {getProductActivePrice(item.product) !== item.product.price && (
                              <span className="text-[9px] text-white/40 line-through">
                                {formatPrice(item.product.price * item.quantity)}
                              </span>
                            )}
                          </div>
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
                  <div>
                    <div className="flex justify-between text-xs text-green-400 font-semibold animate-fade-in">
                      <span>🎟️ VIP Discount Applied ({appliedCoupon.code})</span>
                      <span className="font-mono">-{formatPrice(discountAmount)}</span>
                    </div>
                    {couponDetailsNote && (
                      <div className="text-[10px] text-emerald-400/60 font-mono text-right italic mt-0.5">
                        {couponDetailsNote}
                      </div>
                    )}
                  </div>
                )}
                <div className="flex justify-between text-sm text-white font-black border-t border-white/5 pt-3">
                  <span className="uppercase tracking-[0.14em]">Items Total</span>
                  <span className="luxury-animated-price text-luxury-gold text-lg font-mono">{formatPrice(itemsTotal - discountAmount)}</span>
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
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 sm:space-y-6">
              
              {/* Back navigation CTA */}
              <button 
                type="button"
                onClick={() => setShowCheckoutForm(false)}
                className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[#d4af37] hover:text-white transition-colors duration-200 cursor-pointer group mb-1"
              >
                <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
                <span>Return to Shopping Bag</span>
              </button>

              <form onSubmit={handleFormSubmit} className="space-y-4 animate-fade-in bg-gradient-to-b from-[#110524]/20 via-[#04120a]/10 to-[#1e1403]/15 p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-white/[0.04] shadow-[0_10px_30px_rgba(9,3,18,0.5)]">
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <h4 className="font-serif text-[13px] text-white/95 font-bold flex items-center gap-1.5">
                    <span className="text-luxury-gold text-xs">📦</span>
                    <span className="font-display tracking-wider text-[11px] sm:text-xs text-luxury-gold uppercase">
                      Delivery Information (ডেলিভারি ঠিকানা)
                    </span>
                  </h4>
                </div>

                {/* Size Selection inside the Order Form */}
                <div className="bg-black/30 border border-white/5 p-3 sm:p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-white/90 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Selected Size (সাইজ সিলেক্ট করুন)
                    </label>
                  </div>

                  <div className="space-y-3">
                    {cartItems.map((item, idx) => (
                      <div key={`${item.product.id}-${idx}`} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0c0617]/50 border border-white/5 p-3 rounded-lg">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img 
                            src={item.product.imageUrl} 
                            alt={item.product.title} 
                            className="w-10 h-10 object-cover rounded-lg border border-white/10 flex-shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0">
                            <p className="text-xs text-white font-medium truncate">{item.product.title}</p>
                            <p className="text-[10px] text-zinc-400 font-mono mt-0.5">৳{getProductActivePrice(item.product)} x {item.quantity}</p>
                          </div>
                        </div>

                        {/* Size buttons to select */}
                        <div className="flex flex-wrap items-center gap-1">
                          {(item.product.sizes && item.product.sizes.length > 0 ? item.product.sizes : ['Standard', 'M', 'L', 'XL', 'XXL']).map((sz) => {
                            const isSelected = item.selectedSize === sz || (!item.selectedSize && sz === 'Standard');
                            return (
                              <button
                                key={sz}
                                type="button"
                                onClick={() => {
                                  if (onUpdateSize) {
                                    onUpdateSize(idx, sz);
                                  }
                                }}
                                className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-md border transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-[#d4af37] border-transparent text-black font-extrabold shadow-sm'
                                    : 'bg-zinc-900/60 border-white/10 text-zinc-300 hover:border-luxury-gold/50 hover:text-white'
                                }`}
                              >
                                {sz}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recipient Full Name */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-white/90">
                    Your Name / আপনার নাম <span className="text-red-400">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-luxury-gold transition-colors duration-300">
                      <User size={14} />
                    </div>
                    <input 
                      type="text" 
                      required
                      placeholder="আপনার নাম লিখুন"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-[#130724]/40 text-white font-sans text-xs border border-white/10 hover:border-white/20 focus:border-luxury-gold rounded-xl py-3 pl-10 pr-4 focus:outline-none transition-all duration-300 placeholder-white/25"
                    />
                  </div>
                </div>

                {/* Contact Mobile Number */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-white/90">
                    Mobile Number / মোবাইল নাম্বার <span className="text-red-400">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-luxury-gold transition-colors duration-300">
                      <Phone size={14} />
                    </div>
                    <input 
                      type="tel" 
                      required
                      placeholder="১১ ডিজিটের মোবাইল নাম্বার দিন"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full bg-[#0a1811]/40 text-white font-sans text-xs border border-white/10 hover:border-white/20 focus:border-luxury-gold rounded-xl py-3 pl-10 pr-4 focus:outline-none transition-all duration-300 placeholder-white/25"
                    />
                  </div>
                </div>

                {/* City select and Complete Address */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-white/90">
                      City/District / জেলা <span className="text-red-400">*</span>
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-luxury-gold transition-colors duration-300">
                        <MapPin size={14} />
                      </div>
                      <select
                        value={customerCity}
                        onChange={(e) => setCustomerCity(e.target.value)}
                        className="w-full bg-[#130724]/55 text-white font-sans text-xs border border-white/10 hover:border-white/20 focus:border-luxury-gold rounded-xl py-3 pl-10 pr-10 focus:outline-none appearance-none cursor-pointer"
                      >
                        {CITIES_LIST.map(city => (
                          <option key={city} value={city} className="bg-[#0b0611] text-white font-sans">{city}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-white/40">
                        <ChevronDown size={14} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-white/90">
                      Complete Address / সম্পূর্ণ ঠিকানা <span className="text-red-400">*</span>
                    </label>
                    <div className="relative group">
                      <div className="absolute top-3.5 left-0 pl-3.5 flex items-start pointer-events-none text-zinc-400 group-focus-within:text-luxury-gold transition-colors duration-300">
                        <MapPin size={14} className="mt-0.5" />
                      </div>
                      <textarea 
                        required
                        placeholder="আপনার থানা, গ্রাম, রোড এবং বাড়ির ঠিকানা লিখুন"
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                        className="w-full bg-[#130724]/40 text-white font-sans text-xs border border-white/10 hover:border-white/20 focus:border-luxury-gold rounded-xl py-3 pl-10 pr-4 focus:outline-none resize-none h-16 placeholder-white/25"
                      />
                    </div>
                  </div>
                </div>

                {/* Coupon Redeemer */}
                <div className="bg-black/30 border border-white/5 p-3.5 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-[#d4af37] flex items-center gap-1.5">
                      🎟️ Discount Coupon (কুপন কোড)
                    </label>
                  </div>

                  <div className="flex gap-2">
                    <div className="relative group flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/20">
                        <Tag size={12} />
                      </div>
                      <input 
                        type="text" 
                        placeholder="কুপন কোড লিখুন (যেমন: SAVE10)"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="w-full bg-[#0a0510] text-white text-xs border border-white/10 hover:border-[#d4af37]/35 focus:border-luxury-gold rounded-xl py-2 pl-9 pr-3 focus:outline-none placeholder-white/20 uppercase"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleApplyCoupon()}
                      className="bg-gradient-to-r from-zinc-800 to-black hover:from-[#d4af37] hover:to-[#ffd700] hover:text-black text-[#d4af37] border border-[#d4af37]/30 hover:border-transparent text-xs font-bold px-4 rounded-xl transition-all duration-300 cursor-pointer"
                    >
                      Apply
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

                {/* Dynamic Style X Premium Payment Engine */}
                {paymentType === 'cod' ? (
                  /* Cash on Delivery (COD) Option */
                  <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-3.5 space-y-1">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <ShieldCheck size={16} className="flex-shrink-0" />
                      <p className="text-xs font-bold uppercase tracking-wider">
                        Cash on Delivery (ক্যাশ অন ডেলিভারি)
                      </p>
                    </div>
                    <p className="text-[11px] text-zinc-300 leading-normal pl-6">
                      অর্ডারটি সফল করতে কোনো অগ্রিম টাকা লাগবে না। পণ্য হাতে পেয়ে সম্পূর্ণ টাকা পরিশোধ করবেন।
                    </p>
                  </div>
                ) : (
                  /* Online Verification required: Delivery Charge Only or Full Advance Payment */
                  <div className="bg-gradient-to-b from-[#1c0f30]/65 to-[#0b0414]/90 border border-luxury-gold/20 rounded-xl p-3.5 sm:p-5 space-y-3.5 sm:space-y-4 shadow-xl relative overflow-hidden">
                    <div className="absolute -right-6 -bottom-6 text-luxury-gold/5 pointer-events-none">
                      <ShieldCheck size={72} />
                    </div>
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[#d4af37]">⚜️</span>
                        <h4 className="font-serif text-[12px] text-white/90 uppercase tracking-widest font-bold">
                          {paymentType === 'delivery_charge' ? "ডেলিভারি চার্জ অগ্রিম পরিশোধ করুন" : "সম্পূর্ণ মূল্য অগ্রিম পরিশোধ করুন"}
                        </h4>
                      </div>
                      <span className="text-[8px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded uppercase tracking-wider font-extrabold animate-pulse">
                        অনলাইন ভেরিফিকেশন
                      </span>
                    </div>

                    <p className="text-[11px] text-zinc-300 leading-relaxed">
                      আপনার অর্ডারটি নিশ্চিত করতে অনুগ্রহ করে {paymentType === 'delivery_charge' ? 'ডেলিভারি চার্জ অগ্রিম' : 'সম্পূর্ণ মূল্য অগ্রিম'} বাবদ{' '}
                      <span className="text-[#ffd700] font-black font-mono text-xs">৳{advancePaymentAmount}</span> বিকাশ বা নগদে সেন্ড মানি করুন এবং নিচে ট্রানজেকশন আইডি দিন।
                    </p>

                    {/* bKash / Nagad Toggle segmented control */}
                    {settings?.globalPaymentSystem !== 'always_bkash' && settings?.globalPaymentSystem !== 'always_nagad' ? (
                      <div className="grid grid-cols-2 gap-2 bg-black/40 p-1 rounded-xl border border-white/5">
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentMethod('bkash');
                            setTransactionId('');
                            setTransactionError('');
                          }}
                          className={`py-2 rounded-lg text-xs font-mono tracking-widest uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
                            paymentMethod === 'bkash'
                              ? 'bg-[#e2136e]/15 text-[#e2136e] border border-[#e2136e]/40 font-black shadow-[0_0_15px_rgba(226,19,110,0.25)]'
                              : 'text-zinc-400 hover:text-white hover:bg-white/[0.02]'
                          }`}
                        >
                          {settings?.bkashLogoUrl ? (
                            <img 
                              src={settings.bkashLogoUrl} 
                              alt="bKash" 
                              className="h-5 w-5 rounded object-contain flex-shrink-0"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <svg 
                              viewBox="0 0 100 100" 
                              className="h-5 w-5 rounded-md shadow-sm flex-shrink-0" 
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <rect width="100" height="100" rx="20" fill="#e2136e" />
                              <g transform="translate(10, 10) scale(0.8)" fill="#ffffff">
                                <polygon points="50,15 42,28 58,28" />
                                <polygon points="50,32 38,55 50,75" opacity="0.9" />
                                <polygon points="50,32 62,55 50,75" />
                                <polygon points="34,34 15,50 38,50" opacity="0.8" />
                                <polygon points="66,34 85,50 62,50" opacity="0.95" />
                                <polygon points="50,78 45,90 55,90" />
                              </g>
                            </svg>
                          )}
                          <span>bKash (বিকাশ)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentMethod('nagad');
                            setTransactionId('');
                            setTransactionError('');
                          }}
                          className={`py-2 rounded-lg text-xs font-mono tracking-widest uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
                            paymentMethod === 'nagad'
                              ? 'bg-[#f45c24]/15 text-[#f45c24] border border-[#f45c24]/40 font-black shadow-[0_0_15px_rgba(244,92,36,0.25)]'
                              : 'text-zinc-400 hover:text-white hover:bg-white/[0.02]'
                          }`}
                        >
                          {settings?.nagadLogoUrl ? (
                            <img 
                              src={settings.nagadLogoUrl} 
                              alt="Nagad" 
                              className="h-5 w-5 rounded object-contain flex-shrink-0"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <svg 
                              viewBox="0 0 100 100" 
                              className="h-5 w-5 rounded-md shadow-sm flex-shrink-0" 
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <rect width="100" height="100" rx="20" fill="#f45c24" />
                              <g transform="translate(15, 15) scale(0.7)">
                                <path d="M20,60 C40,60 70,40 80,10 C60,40 30,50 20,60 Z" fill="#ffffff" />
                                <path d="M10,75 C30,75 60,55 70,25 C55,50 25,60 10,75 Z" fill="#a3e635" />
                                <path d="M35,45 C45,45 60,35 65,15 C55,30 45,35 35,45 Z" fill="#ffffff" opacity="0.8" />
                              </g>
                            </svg>
                          )}
                          <span>Nagad (নগদ)</span>
                        </button>
                      </div>
                    ) : (
                      /* Display active channel notice */
                      <div className="py-2.5 px-3.5 bg-luxury-gold/5 border border-luxury-gold/20 rounded-xl text-center">
                        <span className="text-[10px] font-mono text-luxury-gold uppercase tracking-widest font-bold">
                          ⚜️ Governing Payment Channel Active: {paymentMethod === 'bkash' ? 'bKash (বিকাশ) Only' : 'Nagad (নগদ) Only'}
                        </span>
                      </div>
                    )}

                    {/* Recipient Account Details with quick copy button */}
                    <div className="bg-black/60 border border-white/5 rounded-xl p-3.5 space-y-2 relative">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-zinc-400 font-bold">এই নাম্বারে টাকা পাঠান (Send Money):</span>
                        <span className="text-[9px] bg-white/5 text-white/60 px-2 py-0.5 rounded">পার্সোনাল অ্যাকাউন্ট</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-mono text-sm font-black text-white tracking-widest">
                          {paymentMethod === 'bkash' ? (bkashNumber || '01777223344') : (nagadNumber || '01999887766')}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const num = paymentMethod === 'bkash' ? (bkashNumber || '01777223344') : (nagadNumber || '01999887766');
                            navigator.clipboard.writeText(num);
                          }}
                          className="text-[10px] text-[#d4af37] hover:text-white hover:underline transition-all cursor-pointer bg-[#d4af37]/5 px-2.5 py-1 rounded border border-[#d4af37]/25"
                        >
                          নম্বর কপি করুন
                        </button>
                      </div>
                      <div className="flex justify-between items-center pt-1.5 border-t border-white/5 text-[11px]">
                        <span className="text-zinc-400">পরিশোধের পরিমাণ:</span>
                        <span className="text-luxury-gold font-mono font-black text-xs">
                          ৳{advancePaymentAmount}
                        </span>
                      </div>
                    </div>

                    {/* Transaction ID Input */}
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-white/95 flex items-center justify-between">
                        <span>Transaction ID (ট্রানজেকশন আইডি) <span className="text-red-400">*</span></span>
                      </label>
                      <div className="relative group">
                        <input
                          type="text"
                          required
                          value={transactionId}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\s+/g, ''); // strip spaces automatically
                            setTransactionId(val);
                            setTransactionError(validateTransactionId(val));
                          }}
                          placeholder="যেমন: A1B2C3D4E5"
                          className={`w-full bg-[#0a0511] text-white font-mono text-xs border rounded-xl py-3 px-4 focus:outline-none transition-all duration-300 placeholder-white/15 uppercase tracking-widest ${
                            transactionError
                              ? 'border-red-500/40 focus:border-red-500/80 focus:ring-1 focus:ring-red-500/20'
                              : 'border-white/10 hover:border-luxury-gold/30 focus:border-luxury-gold'
                          }`}
                        />
                        <div className="absolute top-0 right-0 py-3 pr-3.5 flex items-center pointer-events-none text-[8px] font-mono text-[#d4af37]/30 group-focus-within:text-luxury-gold">
                          ৮-৩০ ডিজিট
                        </div>
                      </div>
                      {transactionError && (
                        <p className="text-[10px] font-mono text-red-400 pl-1 mt-1 animate-pulse">
                          ⚠️ ভুল: {transactionError}
                        </p>
                      )}
                    </div>

                    {/* Screenshot Upload with live preview thumbnail */}
                    <div className="space-y-2">
                      <label className="block text-[11px] font-bold text-white/95 flex items-center justify-between">
                        <span>পেমেন্টের স্ক্রিনশট আপলোড করুন</span>
                        <span className="text-zinc-500 text-[9px]">• ঐচ্ছিক</span>
                      </label>
                      
                      {screenshotPreview ? (
                        <div className="relative bg-black/40 border border-white/10 p-3 rounded-xl flex items-center justify-between gap-3 animate-fade-in">
                          <div className="flex items-center gap-3">
                            <img
                              src={screenshotPreview}
                              alt="Payment proof screenshot"
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 object-cover rounded border border-white/10"
                            />
                            <div className="space-y-0.5">
                              <span className="text-[10px] text-white/80 block">স্ক্রিনশট আপলোড হয়েছে</span>
                              <span className="text-[9px] text-emerald-400 flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" /> সম্পূর্ণ
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setScreenshotPreview(null);
                              setScreenshotBase64(null);
                            }}
                            className="text-[10px] text-red-400 hover:text-red-300 transition-all cursor-pointer bg-red-500/5 hover:bg-red-500/10 px-2 py-1 rounded border border-red-500/20"
                          >
                            মুছে ফেলুন
                          </button>
                        </div>
                      ) : (
                        <label className="border border-dashed border-white/10 hover:border-[#d4af37]/30 bg-black/30 hover:bg-black/50 p-4 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleScreenshotChange}
                            className="hidden"
                          />
                          <span className="text-[11px] text-[#d4af37] font-bold mb-1">
                            স্ক্রিনশট বা প্রুফ ফাইল সিলেক্ট করুন
                          </span>
                          <span className="text-[9px] text-zinc-500">
                            JPG, PNG, WebP সর্বোচ্চ ৫ মেগাবাইট
                          </span>
                        </label>
                      )}
                    </div>

                    {/* Informative warning text if transaction validation fails */}
                    {(!transactionId || !!transactionError) && (
                      <div className="bg-amber-500/5 border border-amber-500/15 text-amber-400/90 text-[10.5px] px-3.5 py-3 rounded-xl leading-relaxed shadow-sm">
                        ⚜️ <span className="font-bold text-amber-300">দয়া করে পেমেন্ট সম্পূর্ণ করুন</span> এবং অর্ডার কনফার্ম করার পূর্বে সঠিক ট্রানজেকশন আইডি প্রবেশ করান।
                      </div>
                    )}
                  </div>
                )}

                {errorMessage && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-[11px] font-mono animate-pulse">
                    ⚠️ SYSTEM ALARM: {errorMessage}
                  </div>
                )}

                {/* Calculation Matrix and Checkout Core trigger */}
                <div className="border-t border-white/5 pt-4 space-y-2.5 font-display">
                  <div className="flex justify-between text-[11.5px] text-zinc-400">
                    <span>পণ্যের উপমোট মূল্য (Subtotal)</span>
                    <span className="font-mono">{formatPrice(itemsTotal)}</span>
                  </div>
                  {appliedCoupon && (
                    <div>
                      <div className="flex justify-between text-[11.5px] text-green-400 font-semibold animate-fade-in">
                        <span className="flex items-center gap-1">🎟️ কুপন ডিসকাউন্ট ({appliedCoupon.code})</span>
                        <span className="font-mono">-{formatPrice(discountAmount)}</span>
                      </div>
                      {couponDetailsNote && (
                        <div className="text-[9.5px] text-emerald-400/60 font-mono text-right italic mt-0.5">
                          {couponDetailsNote}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex justify-between text-[11.5px] text-zinc-400">
                    <span>ডেলিভারি চার্জ ({customerCity})</span>
                    <span className="font-mono">{formatPrice(resolvedDeliveryCharge)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm text-white font-extrabold border-t border-white/10 pt-3.5 mb-4">
                    <span className="uppercase tracking-[0.14em]">সর্বমোট মূল্য (Grand Total)</span>
                    <span className="luxury-animated-price text-luxury-gold text-base font-mono">{formatPrice(grandTotal)}</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isCheckingOut || (paymentType !== 'cod' && (!transactionId || !!validateTransactionId(transactionId)))}
                    className="running-glow-gold-filled w-full text-white font-display font-black uppercase text-xs tracking-[0.25em] py-4.5 rounded-xl shadow-[0_5px_25px_rgba(154,77,255,0.25)] hover:shadow-[0_8px_35px_rgba(154,77,255,0.55)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isCheckingOut ? (
                      <>
                        <span className="relative z-10 w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                        <span className="relative z-10">অর্ডার কনফার্ম করা হচ্ছে...</span>
                      </>
                    ) : (
                      <span className="relative z-10">⚜️ অর্ডার নিশ্চিত করুন (Confirm Order)</span>
                    )}
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

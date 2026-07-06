import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Trash2, ShieldCheck, ShoppingBag, Plus, Minus, Check, User, Phone, MapPin, 
  Tag, ChevronDown, ArrowLeft, ArrowRight, Sparkles, Clock, Award, Undo2, Lock, 
  Smartphone, Landmark, Copy, ExternalLink, MessageSquare 
} from 'lucide-react';
import { CartItem, Coupon, Customer, Product } from '../types';
import { formatPrice, CITIES_LIST, getDivisionForCity } from '../utils';
import { getValidatedTotal, getProductActivePrice, getAdvancePaymentAmount } from '../utils/totalHelper';
import LuxuryCheckoutButton from './LuxuryCheckoutButton';

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
  onCheckoutSuccess: (orderId: string, whatsappUrl: string, paymentInfo?: string, skipModal?: boolean) => void;
  initialShowCheckout?: boolean;
  customer?: Customer | null;
  isLoading?: boolean;
  onRequireLogin?: () => void;
}

// High performance inline Canvas Confetti component
function CanvasConfetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const container = canvas.parentElement;
    canvas.width = container?.clientWidth || 500;
    canvas.height = container?.clientHeight || 600;

    const colors = ['#d4af37', '#aa8323', '#c084fc', '#e9d5ff', '#9333ea', '#fcd34d', '#10b981'];
    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * -100 - 20,
      size: Math.random() * 6 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      speedX: (Math.random() - 0.5) * 3,
      speedY: Math.random() * 2.5 + 1.5,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 4,
    }));

    let animId: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let active = false;

      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX;
        p.rotation += p.rotationSpeed;

        if (p.y < canvas.height) {
          active = true;
        } else {
          // loop back top optionally for continuous elegance
          p.y = -20;
          p.x = Math.random() * canvas.width;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });

      if (active) {
        animId = requestAnimationFrame(draw);
      }
    };

    draw();
    return () => cancelAnimationFrame(animId);
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-10 w-full h-full" />;
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
  customer,
  isLoading = false,
  onRequireLogin
}: CartDrawerProps) {
  // Navigation & Step State: 'cart' (bag) | 'step1' (info form) | 'step2' (premium verification/checkout) | 'success' (success window)
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'step1' | 'step2' | 'success'>('cart');
  const [isTransitioningStep, setIsTransitioningStep] = useState(false);

  // Form Fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerCity, setCustomerCity] = useState('Dhaka');
  const [customerDistrict, setCustomerDistrict] = useState('Dhaka');

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [showCouponSuccessAnimation, setShowCouponSuccessAnimation] = useState(false);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bkash' | 'nagad'>('cod');
  const [transactionId, setTransactionId] = useState('');
  const [transactionError, setTransactionError] = useState('');
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [screenshotBase64, setScreenshotBase64] = useState<string | null>(null);
  const [usedTransactionIds, setUsedTransactionIds] = useState<string[]>([]);

  // Checkout submission states
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Placement data
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [placedWhatsAppUrl, setPlacedWhatsAppUrl] = useState('');
  const [placedPaymentLabel, setPlacedPaymentLabel] = useState('');
  const [placedDeliveryDate, setPlacedDeliveryDate] = useState('');

  // Ripple Click state
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const rippleCount = useRef(0);

  // Input Focus Refs
  const nameInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const citySelectRef = useRef<HTMLSelectElement>(null);
  const addressTextRef = useRef<HTMLTextAreaElement>(null);

  // Load saved progress from localStorage on mount
  useEffect(() => {
    try {
      const savedName = localStorage.getItem('stylex_checkout_name');
      const savedPhone = localStorage.getItem('stylex_checkout_phone');
      const savedAddress = localStorage.getItem('stylex_checkout_address');
      const savedCity = localStorage.getItem('stylex_checkout_city');
      const savedUsedTx = sessionStorage.getItem('stylex_used_txids');

      if (savedName) setCustomerName(savedName);
      if (savedPhone) setCustomerPhone(savedPhone);
      if (savedAddress) setCustomerAddress(savedAddress);
      if (savedCity) setCustomerCity(savedCity);
      if (savedUsedTx) setUsedTransactionIds(JSON.parse(savedUsedTx));
    } catch (e) {
      console.warn('Error reading storage progress: ', e);
    }
  }, []);

  // Save progress dynamically
  useEffect(() => { localStorage.setItem('stylex_checkout_name', customerName); }, [customerName]);
  useEffect(() => { localStorage.setItem('stylex_checkout_phone', customerPhone); }, [customerPhone]);
  useEffect(() => { localStorage.setItem('stylex_checkout_address', customerAddress); }, [customerAddress]);
  useEffect(() => { localStorage.setItem('stylex_checkout_city', customerCity); setCustomerDistrict(customerCity); }, [customerCity]);

  // Synchronize when customer logs in
  useEffect(() => {
    if (customer && isOpen) {
      setCustomerName(customer.name || '');
      if (customer.phone) setCustomerPhone(customer.phone);
    }
  }, [customer, isOpen]);

  // Sync step state when drawer opens
  useEffect(() => {
    if (isOpen) {
      setCheckoutStep(initialShowCheckout ? 'step1' : 'cart');
      setErrorMessage('');
    }
  }, [isOpen, initialShowCheckout]);

  // Auto-focus next field in Step 1
  useEffect(() => {
    if (isOpen && checkoutStep === 'step1') {
      const timer = setTimeout(() => {
        nameInputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [checkoutStep, isOpen]);

  // Pricing calculations
  const itemsTotal = cartItems.reduce((sum, item) => sum + (getProductActivePrice(item.product) * item.quantity), 0);
  let discountAmount = 0;
  let couponDetailsNote = "";
  const lotteryPrefix = (settings?.lotteryCouponPrefix || 'RISAT').trim().toUpperCase();

  if (appliedCoupon) {
    if (appliedCoupon.code.toUpperCase().startsWith(lotteryPrefix)) {
      const lotteryEligibleTotal = cartItems.reduce((sum, item) => {
        return sum + (item.product.lotteryEligible !== false ? getProductActivePrice(item.product) * item.quantity : 0);
      }, 0);
      discountAmount = Math.round((lotteryEligibleTotal * appliedCoupon.value) / 100);
      couponDetailsNote = `(-${appliedCoupon.value}% on eligible items)`;
    } else {
      const specificProd = products.find(p => p.couponCode && p.couponCode.trim().toUpperCase() === appliedCoupon.code.toUpperCase());
      if (specificProd) {
        const matchingCartItems = cartItems.filter(item => item.product.id === specificProd.id);
        const specificTotal = matchingCartItems.reduce((sum, item) => sum + (getProductActivePrice(item.product) * item.quantity), 0);
        const discountVal = appliedCoupon.type === 'PERCENTAGE' ? appliedCoupon.value : 15;
        discountAmount = Math.round((specificTotal * discountVal) / 100);
        couponDetailsNote = `(-${discountVal}% on ${specificProd.title})`;
      } else {
        if (appliedCoupon.type === 'PERCENTAGE') {
          discountAmount = Math.round((itemsTotal * appliedCoupon.value) / 100);
        } else {
          discountAmount = appliedCoupon.value;
        }
      }
    }
  }

  // Delivery Charge calculation based on Division mapping
  const shippingDivision = getDivisionForCity(customerCity);
  const deliveryCharge = cartItems.length === 0
    ? (shippingDivision === "Dhaka" ? 100 : 150)
    : cartItems.reduce((max, item) => {
        let customPrice = 150;
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

  const governingProduct = cartItems.find(item => item.product.paymentType && item.product.paymentType !== 'cod')?.product || cartItems[0]?.product;
  let paymentType = governingProduct?.paymentType || 'cod';
  if (settings?.globalPaymentMethod === 'cod_only') {
    paymentType = 'cod';
  } else if (settings?.globalPaymentMethod === 'prepay_only') {
    if (paymentType === 'cod') paymentType = 'full_advance';
  }

  const bkashNumber = governingProduct?.bkashNumber || '';
  const nagadNumber = governingProduct?.nagadNumber || '';

  const isDeliveryEnabled = governingProduct?.deliveryCharge !== undefined && governingProduct?.deliveryCharge !== null
    ? governingProduct.deliveryCharge > 0
    : true;

  const resolvedDeliveryCharge = isDeliveryEnabled
    ? (governingProduct?.deliveryCharge !== undefined && governingProduct.deliveryCharge > 0
        ? governingProduct.deliveryCharge
        : deliveryCharge)
    : 0;

  const grandTotal = getValidatedTotal(cartItems, resolvedDeliveryCharge, discountAmount);
  const advancePaymentAmount = getAdvancePaymentAmount(paymentType, resolvedDeliveryCharge, grandTotal);

  // Set initial payment method when paymentType overrides change
  useEffect(() => {
    if (paymentType === 'cod') {
      setPaymentMethod('cod');
    } else {
      setPaymentMethod(settings?.globalPaymentSystem === 'always_nagad' ? 'nagad' : 'bkash');
    }
  }, [paymentType, settings?.globalPaymentSystem]);

  // Date generators
  const getEstimatedDeliveryDate = () => {
    const today = new Date();
    const deliveryMin = new Date(today);
    deliveryMin.setDate(today.getDate() + (shippingDivision === 'Dhaka' ? 1 : 2));
    const deliveryMax = new Date(today);
    deliveryMax.setDate(today.getDate() + (shippingDivision === 'Dhaka' ? 2 : 4));

    const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    return `${deliveryMin.toLocaleDateString('en-US', options)} to ${deliveryMax.toLocaleDateString('en-US', options)}`;
  };

  // Real-time Validations
  const isNameValid = customerName.trim().length >= 3;
  const isPhoneValid = /^01[3-9]\d{8}$/.test(customerPhone.trim().replace(/[^0-9]/g, ''));
  const isAddressValid = customerAddress.trim().length >= 8;
  const isStep1Valid = isNameValid && isPhoneValid && isAddressValid;

  const validateTransactionId = (txId: string) => {
    if (!txId) return 'Transaction ID is required for verification.';
    const cleanId = txId.trim();
    if (cleanId.length < 8) return 'Must be at least 8 alphanumeric characters.';
    if (cleanId.length > 25) return 'Cannot exceed 25 characters.';
    if (!/^[a-zA-Z0-9]+$/.test(cleanId)) return 'Alphanumeric letters and numbers only.';
    if (usedTransactionIds.includes(cleanId.toUpperCase())) return 'This transaction ID has already been used.';
    return '';
  };

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
    if (!matched && codeUpper.startsWith(lotteryPrefix)) {
      if (localStorage.getItem('has_used_lottery_code') === 'true') {
        setCouponError('YOU HAVE ALREADY REDEEMED THIS EXCLUSIVE VOUCHER');
        setAppliedCoupon(null);
        return;
      }
      
      const pctStr = codeUpper.replace(lotteryPrefix, '');
      const pctVal = Number(pctStr);
      if (!isNaN(pctVal) && pctVal > 0 && pctVal <= 100) {
        const lotteryEligibleTotal = cartItems.reduce((sum, item) => {
          return sum + (item.product.lotteryEligible !== false ? getProductActivePrice(item.product) * item.quantity : 0);
        }, 0);

        if (lotteryEligibleTotal === 0) {
          setCouponError('NO ITEMS IN SHOPPING BAG ARE ELIGIBLE FOR DISCOUNTS WITH THIS CODE');
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

    if (matched) {
      setAppliedCoupon(matched);
      setCouponSuccess(`MEMBERSHIP VOUCHER VALIDATED: -${matched.type === 'PERCENTAGE' ? matched.value + '%' : '৳' + matched.value}`);
      setShowCouponSuccessAnimation(true);
      setTimeout(() => setShowCouponSuccessAnimation(false), 2500);
    } else {
      setCouponError('INVALID OR EXPIRED EXCLUSIVE CODE');
      setAppliedCoupon(null);
    }
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

  // Keyboard Navigation Helpers
  const handleKeyDown = (e: React.KeyboardEvent, nextRef: React.RefObject<any>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      nextRef.current?.focus();
    }
  };

  // Step 1 to Step 2 Transition
  const handleContinueToCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!isStep1Valid) {
      setErrorMessage('Please ensure all required customer fields are valid.');
      return;
    }
    setIsTransitioningStep(true);

    try {
      const formattedItems = cartItems.map(item => ({
        title: item.product.title,
        selectedSize: item.selectedSize,
        quantity: item.quantity,
        price: getProductActivePrice(item.product)
      }));

      // Fire off the Step 1 notification to the server so it dispatches the email
      fetch('/api/checkout-step1-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerPhone,
          customerAddress,
          customerCity,
          customerDistrict,
          customerEmail: customer?.email || 'guest@example.com',
          items: formattedItems,
          estimatedTotal: itemsTotal - discountAmount
        })
      }).catch(err => {
        console.warn('Silent warning: Step 1 notify failed to send:', err);
      });
    } catch (err) {
      console.warn('Silent warning: Error preparing Step 1 notification:', err);
    }

    setTimeout(() => {
      setIsTransitioningStep(false);
      setCheckoutStep('step2');
    }, 3800);
  };

  // Mouse absolute ripple builder
  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = rippleCount.current++;
    setRipples(prev => [...prev, { x, y, id }]);
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id));
    }, 600);
  };

  // Step 2 Submission (Final Place Order)
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (paymentMethod !== 'cod') {
      const txErr = validateTransactionId(transactionId);
      if (txErr) {
        setErrorMessage(txErr);
        return;
      }
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

      // Initiate both the API call and the checkout button's 3.6s driving animation delay in parallel
      const apiPromise = fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerPhone,
          customerAddress,
          customerCity,
          customerDistrict,
          customerArea: '',
          customerNotes: '',
          customerEmail: customer?.email,
          userId: customer?.id,
          items: dbFormatItems,
          totalAmount: grandTotal,
          couponCode: appliedCoupon ? appliedCoupon.code : undefined,
          paymentType,
          paymentMethod: paymentMethod === 'cod' ? 'COD' : paymentMethod.toUpperCase(),
          paidAmount: paymentMethod === 'cod' ? 0 : advancePaymentAmount,
          transactionId: paymentMethod === 'cod' ? '' : transactionId.trim().toUpperCase(),
          paymentScreenshot: screenshotBase64 || undefined
        })
      });

      const animationDelayPromise = new Promise(resolve => setTimeout(resolve, 3800));

      // Wait for both the API response to return and the delivery truck to complete its full road trip across the runway
      const [res] = await Promise.all([apiPromise, animationDelayPromise]);

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'COULD NOT REGISTER DISPATCH');
      }

      // Record transaction
      if (paymentMethod !== 'cod' && transactionId) {
        const updatedTxIds = [...usedTransactionIds, transactionId.trim().toUpperCase()];
        setUsedTransactionIds(updatedTxIds);
        try {
          sessionStorage.setItem('stylex_used_txids', JSON.stringify(updatedTxIds));
        } catch {}
      }

      // Clear local promo details
      if (appliedCoupon?.code.toUpperCase().startsWith(lotteryPrefix)) {
        localStorage.setItem('has_used_lottery_code', 'true');
      }

      setPlacedOrderId(data.order.id);
      setPlacedWhatsAppUrl(data.whatsappUrl);
      
      const pLabel = paymentMethod === 'cod' 
        ? 'Cash on Delivery (COD)' 
        : `${paymentType === 'delivery_charge' ? 'Delivery Charge Advance' : 'Full Advance'} (${paymentMethod.toUpperCase()})`;
      setPlacedPaymentLabel(pLabel);
      setPlacedDeliveryDate(getEstimatedDeliveryDate());

      // Save phone and tracking context
      try {
        const prevOrderIds = JSON.parse(localStorage.getItem('stylex_placed_order_ids') || '[]');
        if (!prevOrderIds.includes(data.order.id)) {
          prevOrderIds.push(data.order.id);
          localStorage.setItem('stylex_placed_order_ids', JSON.stringify(prevOrderIds));
        }
        localStorage.setItem('stylex_guest_phone', customerPhone);
      } catch {}

      // Open Success Step inside Drawer
      setCheckoutStep('success');

    } catch (err: any) {
      setErrorMessage(err.message || 'A database network anomaly occurred. Try again.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const finalizePurchase = (url?: string) => {
    // Call background success callbacks to trigger state reloading, but skip App.tsx's redundant popups
    onCheckoutSuccess(placedOrderId || 'N/A', url || placedWhatsAppUrl || '', placedPaymentLabel, true);
    setCheckoutStep('cart');
    onClose();
  };

  // Custom premium keyframe style tags
  const inlineStyles = (
    <style>{`
      @keyframes ripple-anim {
        0% { transform: scale(0.4); opacity: 1; }
        100% { transform: scale(8); opacity: 0; }
      }
      .btn-ripple {
        animation: ripple-anim 0.65s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
      }
      .luxury-glass-input {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.08);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .luxury-glass-input:focus {
        border-color: #d4af37;
        background: rgba(255, 255, 255, 0.04);
        box-shadow: 0 0 15px rgba(212, 175, 55, 0.15);
      }
      .luxury-purple-gold-btn {
        background: linear-gradient(135deg, #7b2cbf 0%, #aa8323 100%);
        box-shadow: 0 0 20px rgba(123, 44, 191, 0.3), 0 0 40px rgba(170, 131, 35, 0.15);
        transition: all 0.3s ease;
      }
      .luxury-purple-gold-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 0 25px rgba(123, 44, 191, 0.5), 0 0 50px rgba(170, 131, 35, 0.3);
      }
      .scrollbar-hidden::-webkit-scrollbar {
        display: none;
      }
      .scrollbar-hidden {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
    `}</style>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={`fixed inset-0 z-50 overflow-hidden flex transition-all duration-300 ease-in-out ${checkoutStep !== 'cart' ? 'items-center justify-center p-0 sm:p-6' : 'justify-end'}`}>
          {inlineStyles}
          {/* Dimmed glass background */}
          <motion.div 
            onClick={checkoutStep === 'success' ? undefined : onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/90 backdrop-blur-md cursor-pointer"
          />

          {/* Premium Drawer/Modal Panel */}
          <motion.div 
            key={checkoutStep}
            initial={checkoutStep !== 'cart' ? { opacity: 0, scale: 0.95, y: 15 } : { x: '100%' }}
            animate={checkoutStep !== 'cart' ? { opacity: 1, scale: 1, y: 0 } : { x: 0 }}
            exit={checkoutStep !== 'cart' ? { opacity: 0, scale: 0.95, y: 15 } : { x: '100%' }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={`relative w-full bg-[#05010a]/95 border flex flex-col shadow-2xl z-10 overflow-hidden ${
              checkoutStep !== 'cart'
                ? 'max-w-2xl border-purple-500/20 rounded-none sm:rounded-3xl h-full sm:h-[88vh] max-h-full sm:max-h-[88vh] shadow-[0_0_60px_rgba(123,44,191,0.25)] mx-auto' 
                : 'max-w-lg border-l border-white/5 h-full'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 p-4 sm:p-5 relative shrink-0">
              <div className="flex items-center gap-2">
                <ShoppingBag size={18} className="text-luxury-gold animate-pulse" />
                <h3 className="font-serif text-xs sm:text-sm font-black tracking-widest uppercase text-white">
                  {checkoutStep === 'cart' && "Your Selection"}
                  {checkoutStep === 'step1' && "⚜️ STEP 1: VIP INFORMATION"}
                  {checkoutStep === 'step2' && "⚜️ STEP 2: PREMIUM CHECKOUT"}
                  {checkoutStep === 'success' && "⚜️ ORDER COMPLETED SUCCESSFULLY"}
                </h3>
              </div>
              {checkoutStep !== 'success' && (
                <button 
                  onClick={onClose}
                  className="text-white/40 hover:text-luxury-gold hover:rotate-90 transition-all duration-300 p-1 rounded-full hover:bg-white/5 border border-transparent hover:border-white/10"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Step Progress Bar Indicator */}
            {checkoutStep !== 'cart' && checkoutStep !== 'success' && (
              <div className="px-6 pt-4 pb-2 bg-black/40 border-b border-white/5 flex items-center justify-between gap-2 text-[10px] font-mono tracking-wider shrink-0 select-none">
                <div className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${checkoutStep === 'step1' ? 'bg-[#d4af37] text-black font-black ring-2 ring-yellow-400/20' : 'bg-purple-900/40 text-purple-300'}`}>1</span>
                  <span className={checkoutStep === 'step1' ? 'text-white font-extrabold' : 'text-white/40'}>CONTACT INFO</span>
                </div>
                <div className="flex-1 h-[1px] bg-white/10 mx-2" />
                <div className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${checkoutStep === 'step2' ? 'bg-[#d4af37] text-black font-black ring-2 ring-yellow-400/20' : 'bg-purple-900/40 text-purple-300'}`}>2</span>
                  <span className={checkoutStep === 'step2' ? 'text-white font-extrabold' : 'text-white/40'}>PREMIUM SECURE</span>
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="relative w-16 h-16 flex items-center justify-center mb-4">
                  <div className="absolute inset-0 border-2 border-white/5 rounded-full" />
                  <div className="absolute inset-0 border-2 border-t-luxury-gold rounded-full animate-spin" />
                  <ShoppingBag size={20} className="text-luxury-gold animate-pulse" />
                </div>
                <h4 className="font-serif text-xs text-white/80 uppercase tracking-widest mb-1 font-bold">Synchronizing</h4>
                <p className="text-[10px] text-white/40 max-w-xs font-light">Retrieving bespoke catalog parameters...</p>
              </div>
            ) : cartItems.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 bg-white/[0.02] border border-white/10 rounded-2xl flex items-center justify-center text-luxury-gold mb-4">
                  <ShoppingBag size={24} />
                </div>
                <h4 className="font-serif text-sm text-white/80 uppercase tracking-widest mb-2 font-bold">Your bag is empty</h4>
                <p className="text-xs text-white/40 max-w-xs mb-6 font-light">Select from our exclusive collection and drops to register checkout.</p>
                <button 
                  onClick={onClose}
                  className="border border-luxury-gold text-luxury-gold hover:bg-luxury-gold hover:text-black font-mono text-[9px] uppercase font-bold tracking-widest py-2 px-6 rounded-xl transition-all"
                >
                  Continue Exploring
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden relative">

                {/* STEP 0: SHOPPING BAG REVIEW (DEFAULT) */}
                {checkoutStep === 'cart' && (
                  <div className="flex-1 flex flex-col justify-between overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/[0.04] via-purple-950/[0.06] to-[#05010a]">
                      <div className="space-y-3">
                        {cartItems.map((item, idx) => (
                          <div key={`${item.product.id}-${idx}`} className="flex gap-3 bg-white/[0.01] border border-white/5 p-3 rounded-2xl hover:border-luxury-gold/30 transition-all duration-300">
                            <img src={item.product.imageUrl} alt={item.product.title} className="w-16 h-16 object-cover rounded-xl border border-white/5 shrink-0" referrerPolicy="no-referrer" />
                            <div className="flex-1 flex flex-col justify-between min-w-0">
                              <div className="flex justify-between items-start gap-2">
                                <h4 className="font-serif text-[12px] text-white font-medium truncate">{item.product.title}</h4>
                                <span className="text-luxury-gold text-[12px] font-mono font-bold shrink-0">{formatPrice(getProductActivePrice(item.product) * item.quantity)}</span>
                              </div>
                              <p className="text-[9px] text-white/30 font-mono">SIZE: {item.selectedSize || 'STANDARD'}</p>
                              <div className="flex items-center justify-between mt-1.5">
                                <div className="flex items-center bg-black border border-white/10 rounded-lg overflow-hidden shrink-0">
                                  <button onClick={() => onUpdateQty(idx, item.quantity - 1)} className="p-1 text-white hover:text-luxury-gold hover:bg-white/5 transition-all"><Minus size={10} /></button>
                                  <span className="px-2.5 text-[10px] font-mono text-white font-bold">{item.quantity}</span>
                                  <button onClick={() => onUpdateQty(idx, item.quantity + 1)} className="p-1 text-white hover:text-luxury-gold hover:bg-white/5 transition-all"><Plus size={10} /></button>
                                </div>
                                <button onClick={() => onRemoveItem(idx)} className="text-white/30 hover:text-red-400 p-1 transition-all"><Trash2 size={12} /></button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Coupon Redemption in Cart view */}
                      <div className="border-t border-white/5 pt-5 space-y-3">
                        <label className="text-[10px] uppercase font-mono tracking-widest text-luxury-gold block font-black">Membership Invitation Code</label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="ENTER PROMO CODE"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                            className="flex-1 bg-black/40 text-white font-mono text-xs border border-white/10 rounded-xl py-2.5 px-3 focus:outline-none focus:border-luxury-gold placeholder-white/25 uppercase tracking-wider"
                          />
                          <button onClick={() => handleApplyCoupon()} className="bg-white/5 border border-white/10 hover:border-luxury-gold text-luxury-gold px-4 rounded-xl text-[10px] font-mono font-bold tracking-widest uppercase transition-all duration-300">REDEEM</button>
                        </div>
                        {couponError && <p className="text-[9px] font-mono text-red-400">⚠️ {couponError}</p>}
                        {couponSuccess && <p className="text-[9px] font-mono text-emerald-400 flex items-center gap-1">✓ {couponSuccess}</p>}
                      </div>
                    </div>

                    {/* Cart Footer */}
                    <div className="bg-black/60 border-t border-white/5 p-5 space-y-4 shrink-0">
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between text-zinc-400"><span>Segment Subtotal</span><span className="font-mono">{formatPrice(itemsTotal)}</span></div>
                        {appliedCoupon && (
                          <div className="flex justify-between text-emerald-400"><span>✓ Coupon Applied</span><span className="font-mono">-{formatPrice(discountAmount)}</span></div>
                        )}
                        <div className="flex justify-between text-white font-bold border-t border-white/5 pt-3.5">
                          <span className="tracking-wider">GRAND TOTAL</span>
                          <span className="text-luxury-gold font-mono text-sm font-black">{formatPrice(itemsTotal - discountAmount)}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          if (!customer) {
                            if (onRequireLogin) onRequireLogin();
                          } else {
                            setCheckoutStep('step1');
                          }
                        }}
                        className="w-full bg-gradient-to-r from-purple-800 to-amber-600 hover:brightness-110 text-white text-[10px] font-mono font-extrabold tracking-[0.2em] py-3.5 rounded-xl uppercase transition-all flex items-center justify-center gap-2 group shadow-xl"
                      >
                        PROCEED TO SECURE DISPATCH
                        <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 1: CUSTOMER INFORMATION FORM */}
                {checkoutStep === 'step1' && (
                  <form onSubmit={handleContinueToCheckout} className="flex-1 flex flex-col justify-between overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 scrollbar-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/[0.04] via-purple-950/[0.06] to-[#05010a]">
                      <div className="flex items-center gap-2 pb-1 border-b border-white/5 mb-1">
                        <User size={12} className="text-luxury-gold" />
                        <span className="text-[9px] font-mono tracking-widest text-luxury-gold uppercase font-bold">RECIPIENT CONTACT DETAIL RECORDS</span>
                      </div>

                      {/* Glassmorphism card of inputs */}
                      <div className="bg-[#0f0a1c] border border-white/15 rounded-2xl p-3 sm:p-4 space-y-3 shadow-xl">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Name Field */}
                          <div className="relative group">
                            <div className="absolute top-3.5 left-3 text-zinc-300 group-focus-within:text-luxury-gold transition-colors duration-300">
                              <User size={14} />
                            </div>
                            <input 
                              ref={nameInputRef}
                              type="text"
                              required
                              id="customer_name"
                              value={customerName}
                              onChange={(e) => setCustomerName(e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, phoneInputRef)}
                              placeholder=" "
                              className="peer block w-full rounded-xl border border-white/20 bg-black/60 pb-2 pt-5 pl-9 pr-9 text-xs text-white focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold/30 focus:outline-none transition-all duration-300 font-medium h-12"
                            />
                            <label htmlFor="customer_name" className="absolute left-9 top-1.5 text-[8.5px] text-zinc-400 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-xs peer-placeholder-shown:text-zinc-300 peer-placeholder-shown:font-medium peer-focus:top-1.5 peer-focus:text-[8.5px] peer-focus:text-luxury-gold uppercase font-mono tracking-wider pointer-events-none">
                              Full Name / আপনার নাম *
                            </label>
                            {customerName && (
                              <span className="absolute right-3 top-3.5">{isNameValid ? <Check size={12} className="text-emerald-400" /> : <X size={12} className="text-red-400" />}</span>
                            )}
                          </div>

                          {/* Mobile Number */}
                          <div className="relative group">
                            <div className="absolute top-3.5 left-3 text-zinc-300 group-focus-within:text-luxury-gold transition-colors duration-300">
                              <Phone size={14} />
                            </div>
                            <input 
                              ref={phoneInputRef}
                              type="tel"
                              required
                              id="customer_phone"
                              value={customerPhone}
                              onChange={(e) => setCustomerPhone(e.target.value.replace(/[^0-9]/g, ''))}
                              onKeyDown={(e) => handleKeyDown(e, citySelectRef)}
                              placeholder=" "
                              className="peer block w-full rounded-xl border border-white/20 bg-black/60 pb-2 pt-5 pl-9 pr-9 text-xs text-white focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold/30 focus:outline-none transition-all duration-300 font-mono font-medium h-12"
                            />
                            <label htmlFor="customer_phone" className="absolute left-9 top-1.5 text-[8.5px] text-zinc-400 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-xs peer-placeholder-shown:text-zinc-300 peer-placeholder-shown:font-medium peer-focus:top-1.5 peer-focus:text-[8.5px] peer-focus:text-luxury-gold uppercase font-mono tracking-wider pointer-events-none">
                              Mobile Number / মোবাইল নম্বর *
                            </label>
                            {customerPhone && (
                              <span className="absolute right-3 top-3.5">{isPhoneValid ? <Check size={12} className="text-emerald-400" /> : <span className="text-[8px] font-mono text-red-400 font-bold">11 digits</span>}</span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* City / District */}
                          <div className="relative group">
                            <div className="absolute top-3.5 left-3 text-zinc-300 group-focus-within:text-luxury-gold transition-colors duration-300">
                              <MapPin size={14} />
                            </div>
                            <select
                              ref={citySelectRef}
                              id="customer_city"
                              value={customerCity}
                              onChange={(e) => setCustomerCity(e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, addressTextRef)}
                              className="peer block w-full rounded-xl border border-white/20 bg-zinc-950 pb-2 pt-5 pl-9 pr-9 text-xs text-white focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold/30 focus:outline-none transition-all duration-300 appearance-none cursor-pointer font-medium h-12"
                            >
                              {CITIES_LIST.map(city => (
                                <option key={city} value={city} className="bg-[#0c0613] text-white">{city}</option>
                              ))}
                            </select>
                            <label htmlFor="customer_city" className="absolute left-9 top-1.5 text-[8.5px] text-[#d4af37] uppercase font-mono tracking-wider pointer-events-none font-bold">
                              City/District / জেলা *
                            </label>
                            <div className="absolute right-3 top-3.5 text-white/60 pointer-events-none"><ChevronDown size={12} /></div>
                          </div>

                          {/* Complete Address */}
                          <div className="relative group">
                            <div className="absolute top-3.5 left-3 text-zinc-300 group-focus-within:text-luxury-gold transition-colors duration-300">
                              <MapPin size={14} />
                            </div>
                            <textarea 
                              ref={addressTextRef}
                              required
                              id="customer_address"
                              value={customerAddress}
                              onChange={(e) => setCustomerAddress(e.target.value)}
                              placeholder=" "
                              className="peer block w-full rounded-xl border border-white/20 bg-black/60 pb-1 pt-5 pl-9 pr-9 text-xs text-white focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold/30 focus:outline-none transition-all duration-300 h-12 resize-none font-medium leading-normal scrollbar-hidden"
                            />
                            <label htmlFor="customer_address" className="absolute left-9 top-1.5 text-[8.5px] text-zinc-400 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-xs peer-placeholder-shown:text-zinc-300 peer-placeholder-shown:font-medium peer-focus:top-1.5 peer-focus:text-[8.5px] peer-focus:text-luxury-gold uppercase font-mono tracking-wider pointer-events-none">
                              Complete Address / সম্পূর্ণ ঠিকানা *
                            </label>
                            {customerAddress && (
                              <span className="absolute right-3 top-3.5">{isAddressValid ? <Check size={12} className="text-emerald-400" /> : <X size={12} className="text-red-400" />}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Quantity & Size adjuster inside Step 1 */}
                      <div className="bg-[#0f0a1c] border border-white/10 rounded-2xl p-3 sm:p-4 space-y-3 shadow-xl">
                        <div className="flex items-center gap-2 pb-1.5 border-b border-white/5">
                          <ShoppingBag size={11} className="text-luxury-gold animate-pulse" />
                          <span className="text-[9px] font-mono tracking-widest text-[#d4af37] block font-bold uppercase">SELECTED ITEMS & SIZES</span>
                        </div>
                        <div className="space-y-2">
                          {cartItems.map((item, idx) => {
                            const availableSizes = item.product.sizes && item.product.sizes.length > 0 
                              ? item.product.sizes 
                              : ['S', 'M', 'L', 'XL', 'XXL'];
                            
                            return (
                              <div key={idx} className="flex items-center gap-2.5 bg-black/40 p-2 rounded-xl border border-white/5 hover:border-white/10 transition-all duration-300">
                                {/* Product Photo */}
                                <div className="w-11 h-11 rounded-lg overflow-hidden border border-white/10 shrink-0 relative">
                                  <img 
                                    src={item.product.imageUrl} 
                                    alt={item.product.title} 
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover"
                                  />
                                </div>

                                {/* Item Info & Size preference inline */}
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                  <h4 className="text-[11px] font-bold text-white leading-tight truncate">{item.product.title}</h4>
                                  <div className="flex items-center gap-1.5 mt-1">
                                    <span className="text-[8px] font-mono text-zinc-400 uppercase tracking-wider">Size:</span>
                                    <div className="flex gap-0.5">
                                      {availableSizes.map((size) => (
                                        <button
                                          key={size}
                                          type="button"
                                          onClick={() => onUpdateSize && onUpdateSize(idx, size)}
                                          className={`h-4.5 px-1.5 rounded text-[8.5px] font-mono font-bold cursor-pointer transition-all ${
                                            item.selectedSize === size
                                              ? 'bg-[#d4af37] text-black font-black shadow-[0_0_8px_rgba(212,175,55,0.3)]'
                                              : 'bg-black/60 text-white/60 border border-white/5 hover:text-white'
                                          }`}
                                        >
                                          {size}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                {/* Quantity & Price Adjuster inline */}
                                <div className="flex flex-col items-end gap-1 shrink-0">
                                  <span className="text-[11px] font-mono font-bold text-[#d4af37]">
                                    {formatPrice(getProductActivePrice(item.product) * item.quantity)}
                                  </span>
                                  <div className="flex items-center bg-black/60 border border-white/10 rounded overflow-hidden h-4.5">
                                    <button 
                                      type="button" 
                                      onClick={() => onUpdateQty(idx, item.quantity - 1)} 
                                      className="px-1 text-white/60 hover:text-[#d4af37] transition-colors cursor-pointer"
                                    >
                                      <Minus size={7} />
                                    </button>
                                    <span className="px-1 text-[9px] font-mono font-bold text-white min-w-[12px] text-center">
                                      {item.quantity}
                                    </span>
                                    <button 
                                      type="button" 
                                      onClick={() => onUpdateQty(idx, item.quantity + 1)} 
                                      className="px-1 text-white/60 hover:text-[#d4af37] transition-colors cursor-pointer"
                                    >
                                      <Plus size={7} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {errorMessage && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-[10px] font-mono">
                          ⚠️ {errorMessage}
                        </div>
                      )}
                    </div>

                    {/* Step 1 Footer */}
                    <div className="bg-[#0b0413] border-t border-white/5 p-4 sm:p-5 flex flex-col gap-2.5 sm:gap-3 shrink-0">
                      <div className="flex justify-between items-center text-xs">
                        <button type="button" onClick={() => setCheckoutStep('cart')} className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-all text-[10px] uppercase font-mono">
                          <ArrowLeft size={13} /> Back to selection
                        </button>
                        <div className="text-right">
                          <span className="text-[10px] text-white/40 font-mono uppercase block">Estimated total</span>
                          <span className="text-[#d4af37] font-mono font-black text-sm">{formatPrice(itemsTotal - discountAmount)}</span>
                        </div>
                      </div>
                      <LuxuryCheckoutButton
                        isCheckingOut={isTransitioningStep}
                        disabled={isTransitioningStep}
                        label="CONTINUE TO PREMIUM SECURE CHECKOUT"
                      />
                    </div>
                  </form>
                )}

                {/* STEP 2: PREMIUM CHECKOUT */}
                {checkoutStep === 'step2' && (
                  <form onSubmit={handlePlaceOrder} className="flex-1 flex flex-col justify-between overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 sm:space-y-5 scrollbar-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/[0.04] via-purple-950/[0.06] to-[#05010a]">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                        
                        {/* Left column: Order items and Coupon box */}
                        <div className="md:col-span-6 space-y-4">
                          <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-4 space-y-3 shadow-md">
                            <span className="text-[10px] font-mono tracking-widest text-[#d4af37] block font-bold uppercase border-b border-white/5 pb-1.5">ITEMIZATION REPORT</span>
                            <div className="space-y-3">
                              {cartItems.map((item, idx) => (
                                <div key={idx} className="flex gap-2.5 items-center">
                                  <img src={item.product.imageUrl} className="w-12 h-12 object-cover rounded-lg border border-white/5 shrink-0" referrerPolicy="no-referrer" />
                                  <div className="flex-1 min-w-0">
                                    <h5 className="text-[11px] text-white font-medium truncate font-serif">{item.product.title}</h5>
                                    <p className="text-[9px] text-zinc-400 font-mono mt-0.5">
                                      Size: <span className="text-[#d4af37] font-bold">{item.selectedSize}</span> | Qty: <span className="text-white font-bold">{item.quantity}</span>
                                    </p>
                                    <p className="text-[9px] text-white/30 font-mono mt-0.5">Unit Price: ৳{getProductActivePrice(item.product)}</p>
                                  </div>
                                  <div className="text-right font-mono text-[11px] font-bold text-white">
                                    {formatPrice(getProductActivePrice(item.product) * item.quantity)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Coupon Box in Step 2 with success animation trigger */}
                          <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-4 space-y-2.5 shadow-md relative overflow-hidden">
                            {showCouponSuccessAnimation && (
                              <div className="absolute inset-0 bg-emerald-500/10 backdrop-blur-sm flex items-center justify-center animate-fade-in z-10 text-emerald-400 font-mono text-[10px] font-black uppercase tracking-wider">
                                <Sparkles size={16} className="mr-1 animate-pulse" /> COUPON APPLIED SECURELY!
                              </div>
                            )}
                            <span className="text-[10px] font-mono tracking-widest text-[#d4af37] block font-bold uppercase">PROMOTION CODES</span>
                            <div className="flex gap-2">
                              <input 
                                type="text" 
                                placeholder="ENTER COUPON CODE"
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value)}
                                className="flex-1 bg-black/40 text-white font-mono text-xs border border-white/10 rounded-xl py-2 px-3 focus:outline-none focus:border-luxury-gold placeholder-white/20 uppercase"
                              />
                              <button type="button" onClick={() => handleApplyCoupon()} className="bg-gradient-to-r from-zinc-800 to-black hover:from-[#d4af37] hover:to-[#ffd700] text-[#d4af37] hover:text-black text-[10px] font-mono font-bold px-4 rounded-xl transition-all">APPLY</button>
                            </div>
                            {couponError && <p className="text-[9px] font-mono text-red-400">⚠️ {couponError}</p>}
                            {couponSuccess && <p className="text-[9px] font-mono text-emerald-400">✓ {couponSuccess}</p>}
                          </div>

                          {/* Delivery Guidelines */}
                          <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-4 space-y-2.5 shadow-md">
                            <span className="text-[10px] font-mono tracking-widest text-[#d4af37] block font-bold uppercase">DELIVERY PROFILE</span>
                            <div className="space-y-1.5 text-[10.5px] leading-relaxed text-zinc-300">
                              <p className="flex items-center justify-between text-white border-b border-white/5 pb-1">
                                <span className="flex items-center gap-1.5"><Clock size={12} className="text-[#d4af37]" /> ETA Range:</span>
                                <span className="font-mono font-bold text-[#d4af37]">{placedDeliveryDate || getEstimatedDeliveryDate()}</span>
                              </p>
                              <p className="flex items-center justify-between border-b border-white/5 pb-1">
                                <span>Delivery Time:</span>
                                <span className="font-mono text-white">10:00 AM - 08:00 PM</span>
                              </p>
                              <p className="text-[9.5px] text-white/40 italic leading-snug">
                                * Our concierge logistics agent will call you prior to arrival. Kindly ensure your cellular network coverage is active.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Right column: Payments, Trust, and Placement */}
                        <div className="md:col-span-6 space-y-4">
                          
                          {/* Payment selector */}
                          <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-4 space-y-3 shadow-md">
                            <span className="text-[10px] font-mono tracking-widest text-[#d4af37] block font-bold uppercase">PAYMENT CHANNEL REGISTRY</span>
                            
                            <div className="grid grid-cols-2 gap-2">
                              {paymentType === 'cod' ? (
                                <button
                                  type="button"
                                  onClick={() => setPaymentMethod('cod')}
                                  className={`p-2.5 rounded-xl border transition-all text-left flex flex-col gap-1 cursor-pointer ${
                                    paymentMethod === 'cod'
                                      ? 'bg-emerald-500/10 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                                      : 'bg-black/40 border-white/10 opacity-60 hover:opacity-100'
                                  }`}
                                >
                                  <ShieldCheck size={16} className="text-emerald-400" />
                                  <span className="text-[10.5px] font-bold text-white">COD</span>
                                  <span className="text-[8.5px] text-zinc-400">Cash on Delivery</span>
                                </button>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => { setPaymentMethod('bkash'); setTransactionId(''); setTransactionError(''); }}
                                    className={`p-2.5 rounded-xl border transition-all text-left flex flex-col gap-2 cursor-pointer h-24 justify-between ${
                                      paymentMethod === 'bkash'
                                        ? 'bg-[#e2136e]/10 border-[#e2136e] shadow-[0_0_15px_rgba(226,19,110,0.15)] scale-[1.02]'
                                        : 'bg-black/40 border-white/10 opacity-60 hover:opacity-100'
                                    }`}
                                  >
                                    <div className="flex justify-between items-center w-full">
                                      <img 
                                        src={settings?.bkashLogoUrl || 'https://download.logo.wine/logo/BKash/BKash-Logo.wine.svg'} 
                                        alt="bKash" 
                                        referrerPolicy="no-referrer"
                                        className="h-6 w-auto max-w-[55px] object-contain rounded"
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                        }}
                                      />
                                      <Smartphone size={14} className="text-[#e2136e]" />
                                    </div>
                                    <div>
                                      <span className="text-[10.5px] font-bold text-white block">bKash (বিকাশ)</span>
                                      <span className="text-[8.5px] text-zinc-400 block">Send Money</span>
                                    </div>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => { setPaymentMethod('nagad'); setTransactionId(''); setTransactionError(''); }}
                                    className={`p-2.5 rounded-xl border transition-all text-left flex flex-col gap-2 cursor-pointer h-24 justify-between ${
                                      paymentMethod === 'nagad'
                                        ? 'bg-[#f45c24]/10 border-[#f45c24] shadow-[0_0_15px_rgba(244,92,36,0.15)] scale-[1.02]'
                                        : 'bg-black/40 border-white/10 opacity-60 hover:opacity-100'
                                    }`}
                                  >
                                    <div className="flex justify-between items-center w-full">
                                      <img 
                                        src={settings?.nagadLogoUrl || 'https://download.logo.wine/logo/Nagad/Nagad-Logo.wine.svg'} 
                                        alt="Nagad" 
                                        referrerPolicy="no-referrer"
                                        className="h-6 w-auto max-w-[55px] object-contain rounded"
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                        }}
                                      />
                                      <Landmark size={14} className="text-[#f45c24]" />
                                    </div>
                                    <div>
                                      <span className="text-[10.5px] font-bold text-white block">Nagad (নগদ)</span>
                                      <span className="text-[8.5px] text-zinc-400 block">Send Money</span>
                                    </div>
                                  </button>

                                 </>
                               )}
                             </div>
                            {paymentMethod === 'cod' && (
                              <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl text-[10.5px] text-emerald-400/90 leading-relaxed">
                                ✓ No advance required. Handover full billing of <strong className="text-white font-mono">{formatPrice(grandTotal)}</strong> to couriers during home dispatch.
                              </div>
                            )}

                            {paymentMethod !== 'cod' && (
                              <div className="bg-black/50 border border-white/5 rounded-xl p-3.5 space-y-3 animate-fade-in text-[10.5px]">
                                <div className="flex justify-between items-center text-zinc-400">
                                  <span>Transfer Type:</span>
                                  <span className="bg-white/5 text-white/70 px-2 py-0.5 rounded text-[8.5px] uppercase tracking-wider font-mono">Personal Account (Send Money)</span>
                                </div>
                                <div className="flex justify-between items-center bg-white/[0.02] p-2 rounded-lg border border-white/5">
                                  <div>
                                    <span className="text-[8px] text-zinc-500 block uppercase tracking-wider">RECIPIENT NUMBER</span>
                                    <span className="font-mono font-black text-white text-xs tracking-wider">
                                      {paymentMethod === 'bkash' && (bkashNumber || '01777223344')}
                                      {paymentMethod === 'nagad' && (nagadNumber || '01999887766')}
                                      
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const num = paymentMethod === 'bkash' ? (bkashNumber || '01777223344') : (nagadNumber || '01999887766');
                                      navigator.clipboard.writeText(num);
                                    }}
                                    className="text-[9px] text-luxury-gold border border-luxury-gold/30 hover:border-luxury-gold px-2.5 py-1 rounded-lg transition-all"
                                  >
                                    Copy Number
                                  </button>
                                </div>
                                <div className="flex justify-between items-center border-t border-white/5 pt-2">
                                  <span>REQUIRED AMOUNT:</span>
                                  <span className="text-luxury-gold font-mono font-black text-xs">৳{advancePaymentAmount}</span>
                                </div>

                                {/* Transaction ID Input */}
                                <div className="space-y-1">
                                  <label className="block text-[10px] font-mono uppercase text-white/70">Transaction ID *</label>
                                  <input 
                                    type="text"
                                    required
                                    placeholder="Enter TrxID"
                                    value={transactionId}
                                    onChange={(e) => {
                                      const val = e.target.value.replace(/\s+/g, '').toUpperCase();
                                      setTransactionId(val);
                                      setTransactionError(validateTransactionId(val));
                                    }}
                                    className={`w-full bg-[#0a0511] text-white font-mono text-xs border rounded-xl py-2.5 px-3 focus:outline-none placeholder-white/10 tracking-widest ${
                                      transactionError ? 'border-red-500/40 focus:border-red-500' : 'border-white/10 focus:border-luxury-gold'
                                    }`}
                                  />
                                  {transactionError && <p className="text-[9px] font-mono text-red-400 mt-1">⚠️ {transactionError}</p>}
                                </div>

                                {/* Payment Screenshot */}
                                <div className="space-y-1.5 pt-1">
                                  <label className="block text-[10px] font-mono uppercase text-white/50">Transfer Screenshot Proof (Optional)</label>
                                  {screenshotPreview ? (
                                    <div className="flex items-center justify-between bg-white/[0.01] border border-white/5 p-2 rounded-xl">
                                      <img src={screenshotPreview} className="w-10 h-10 object-cover rounded-md" />
                                      <button type="button" onClick={() => { setScreenshotPreview(null); setScreenshotBase64(null); }} className="text-[10px] text-red-400 hover:underline">Remove</button>
                                    </div>
                                  ) : (
                                    <label className="border border-dashed border-white/10 hover:border-luxury-gold/30 bg-black/40 p-3 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all">
                                      <input type="file" accept="image/*" onChange={handleScreenshotChange} className="hidden" />
                                      <span className="text-[10px] text-luxury-gold font-bold">Select Screenshot</span>
                                    </label>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Trust Badges */}
                          <div className="grid grid-cols-3 gap-2 text-center text-white/50 text-[9px]">
                            <div className="bg-white/[0.01] border border-white/5 p-2 rounded-xl flex flex-col items-center justify-center gap-1">
                              <ShieldCheck size={14} className="text-luxury-gold" />
                              <span className="font-bold text-white/70">SECURE BILLING</span>
                            </div>
                            <div className="bg-white/[0.01] border border-white/5 p-2 rounded-xl flex flex-col items-center justify-center gap-1">
                              <Award size={14} className="text-luxury-gold" />
                              <span className="font-bold text-white/70">100% ORIGINAL</span>
                            </div>
                            <div className="bg-white/[0.01] border border-white/5 p-2 rounded-xl flex flex-col items-center justify-center gap-1">
                              <Undo2 size={14} className="text-luxury-gold" />
                              <span className="font-bold text-white/70">7-DAY RETURN</span>
                            </div>
                          </div>
                        </div>

                      </div>

                      {errorMessage && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-[10px] font-mono">
                          ⚠️ SYSTEM ALERT: {errorMessage}
                        </div>
                      )}
                    </div>

                    {/* Step 2 Footer Checkout Calculation Box */}
                    <div className="bg-[#0b0413] border-t border-white/5 p-4 sm:p-5 space-y-2.5 sm:space-y-3 shrink-0">
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between text-zinc-400"><span>Segment Subtotal</span><span className="font-mono">{formatPrice(itemsTotal)}</span></div>
                        {appliedCoupon && (
                          <div className="flex justify-between text-emerald-400"><span>✓ Coupon Applied</span><span className="font-mono">-{formatPrice(discountAmount)}</span></div>
                        )}
                        <div className="flex justify-between text-zinc-400"><span>Concierge Logistics Delivery</span><span className="font-mono">{formatPrice(resolvedDeliveryCharge)}</span></div>
                        <div className="flex justify-between text-white font-extrabold border-t border-white/5 pt-2.5">
                          <span className="tracking-wider">BILLING GRAND TOTAL</span>
                          <span className="text-luxury-gold font-mono text-sm font-black">{formatPrice(grandTotal)}</span>
                        </div>
                      </div>

                      <div className="flex gap-3 items-center">
                        <button type="button" onClick={() => setCheckoutStep('step1')} className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-all text-[10px] uppercase font-mono py-3">
                          <ArrowLeft size={13} /> Back
                        </button>
                        
                        <div className="flex-1">
                          <LuxuryCheckoutButton
                            isCheckingOut={isCheckingOut}
                            disabled={isCheckingOut}
                            label="PLACE LUXURY ORDER"
                          />
                        </div>
                      </div>
                    </div>
                  </form>
                )}

                {/* STEP 3: SUCCESS / THANK YOU WINDOW */}
                {checkoutStep === 'success' && (
                  <div className="flex-1 flex flex-col justify-between overflow-hidden relative">
                    <CanvasConfetti />

                    <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center text-center space-y-6 scrollbar-hidden">
                      
                      {/* Scale bouncing checkmark */}
                      <motion.div 
                        initial={{ scale: 0.3, opacity: 0 }}
                        animate={{ scale: [1, 1.15, 1], opacity: 1 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-black border-4 border-emerald-400/20 shadow-[0_0_30px_rgba(16,185,129,0.3)] shrink-0"
                      >
                        <Check size={32} className="stroke-[3.5]" />
                      </motion.div>

                      <div className="space-y-2">
                        <h3 className="font-serif text-xl font-bold text-white tracking-wide">Aesthetic dispatch secured</h3>
                        <p className="text-[10px] text-luxury-gold font-mono uppercase tracking-[0.2em]">Thank you for your trust in Style X</p>
                      </div>

                      <p className="text-xs text-white/70 max-w-sm font-light leading-relaxed">
                        Your bespoke order request has been logged successfully inside the Style X VIP private registry. A concierge agent will finalize delivery tracking codes.
                      </p>

                      {/* Receipt Card */}
                      <div className="w-full max-w-sm bg-white/[0.01] border border-white/5 rounded-2xl p-4 text-left font-mono text-[11px] space-y-2.5 relative shadow-md">
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                          <span className="text-zinc-500">ORDER TRACKID:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-luxury-gold font-black select-all">{placedOrderId}</span>
                            <button
                              type="button"
                              onClick={() => {
                                if (placedOrderId) navigator.clipboard.writeText(placedOrderId);
                              }}
                              className="text-white/40 hover:text-white transition-all"
                              title="Copy ID"
                            >
                              <Copy size={11} />
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Estimated Dispatch:</span>
                          <span className="text-white font-bold">{placedDeliveryDate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Bespoke Address:</span>
                          <span className="text-white font-bold truncate max-w-[160px]">{customerAddress}</span>
                        </div>
                        <div className="flex justify-between border-t border-white/5 pt-2 text-[10px]">
                          <span className="text-zinc-500 uppercase">Billing Scheme:</span>
                          <span className="text-luxury-gold font-black uppercase">{placedPaymentLabel}</span>
                        </div>
                      </div>
                    </div>

                    {/* Step 3 Footer buttons */}
                    <div className="bg-[#0b0413] border-t border-white/5 p-5 space-y-3 shrink-0 z-20">
                      {placedWhatsAppUrl && (
                        <a
                          href={placedWhatsAppUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => finalizePurchase(placedWhatsAppUrl)}
                          className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-black text-xs tracking-widest uppercase py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_25px_rgba(16,185,129,0.3)]"
                        >
                          Verify via WhatsApp
                          <ExternalLink size={13} />
                        </a>
                      )}
                      
                      <button
                        type="button"
                        onClick={() => finalizePurchase()}
                        className="w-full bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 text-white font-mono text-[10px] tracking-widest uppercase py-3.5 rounded-xl transition-all"
                      >
                        Continue Shopping
                      </button>
                    </div>
                  </div>
                )}

              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
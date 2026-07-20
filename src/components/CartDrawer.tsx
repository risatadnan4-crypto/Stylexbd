import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Trash2, ShieldCheck, ShoppingBag, Plus, Minus, Check, User, Phone, MapPin, 
  Tag, ChevronDown, ChevronUp, ArrowLeft, ArrowRight, Sparkles, Clock, Award, Undo2, Lock, 
  Smartphone, Landmark, Copy, ExternalLink, MessageSquare, Eye, ZoomIn
} from 'lucide-react';
import { CartItem, Coupon, Customer, Product } from '../types';
import { formatPrice, CITIES_LIST, getDivisionForCity, ALL_DISTRICTS_LIST, DIVISIONS, DIVISION_MAPS } from '../utils';
import { getValidatedTotal, getProductActivePrice, getAdvancePaymentAmount } from '../utils/totalHelper';
import LuxuryCheckoutButton from './LuxuryCheckoutButton';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQty: (idx: number, qty: number) => void;
  onRemoveItem: (idx: number) => void;
  onUpdateSize?: (idx: number, size: string) => void;
  onUpdateColor?: (idx: number, color: string, colorImage?: string) => void;
  onUpdateColorImage?: (idx: number, imageUrl: string) => void;
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
  onUpdateColor,
  onUpdateColorImage,
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

  // District modal states
  const [showAllDistrictsModal, setShowAllDistrictsModal] = useState(false);
  const [districtSearchQuery, setDistrictSearchQuery] = useState('');
  const [isDistrictsExpanded, setIsDistrictsExpanded] = useState(false);

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

  // Premium Lightbox Zoom State
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);

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
  // Enrich cart items with latest product data from the master list to guarantee up-to-date prices, delivery fees, and payment settings!
  const enrichedCartItems = cartItems.map(item => {
    const freshProduct = products?.find(p => String(p.id).trim().toLowerCase() === String(item.product.id).trim().toLowerCase());
    if (freshProduct) {
      return {
        ...item,
        product: freshProduct
      };
    }
    return item;
  });

  const itemsTotal = enrichedCartItems.reduce((sum, item) => sum + (getProductActivePrice(item.product) * item.quantity), 0);
  let discountAmount = 0;
  let couponDetailsNote = "";
  const lotteryPrefix = (settings?.lotteryCouponPrefix || 'RISAT').trim().toUpperCase();

  if (appliedCoupon) {
    if (appliedCoupon.code.toUpperCase().startsWith(lotteryPrefix)) {
      const lotteryEligibleTotal = enrichedCartItems.reduce((sum, item) => {
        return sum + (item.product.lotteryEligible !== false ? getProductActivePrice(item.product) * item.quantity : 0);
      }, 0);
      discountAmount = Math.round((lotteryEligibleTotal * appliedCoupon.value) / 100);
      couponDetailsNote = `(-${appliedCoupon.value}% on eligible items)`;
    } else {
      const specificProd = products.find(p => p.couponCode && p.couponCode.trim().toUpperCase() === appliedCoupon.code.toUpperCase());
      if (specificProd) {
        const matchingCartItems = enrichedCartItems.filter(item => item.product.id === specificProd.id);
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
  const deliveryCharge = enrichedCartItems.length === 0
    ? (shippingDivision === "Dhaka" ? 100 : 150)
    : enrichedCartItems.reduce((max, item) => {
        if (item.product.freeDelivery) {
          return max;
        }
        let customPrice = 150;
        if (shippingDivision === "Dhaka") {
          customPrice = item.product.deliveryPriceDhaka !== undefined 
            ? Number(item.product.deliveryPriceDhaka) 
            : (item.product.deliveryCharge !== undefined && item.product.deliveryCharge > 0 ? Number(item.product.deliveryCharge) : 100);
        } else {
          let specificPrice: number | undefined = undefined;
          switch (shippingDivision) {
            case "Chattogram":
              specificPrice = item.product.deliveryPriceChattogram;
              break;
            case "Rajshahi":
              specificPrice = item.product.deliveryPriceRajshahi;
              break;
            case "Khulna":
              specificPrice = item.product.deliveryPriceKhulna;
              break;
            case "Barishal":
              specificPrice = item.product.deliveryPriceBarishal;
              break;
            case "Sylhet":
              specificPrice = item.product.deliveryPriceSylhet;
              break;
            case "Rangpur":
              specificPrice = item.product.deliveryPriceRangpur;
              break;
            case "Mymensingh":
              specificPrice = item.product.deliveryPriceMymensingh;
              break;
          }
          if (specificPrice !== undefined) {
            customPrice = Number(specificPrice);
          } else {
            customPrice = item.product.deliveryCharge !== undefined && item.product.deliveryCharge > 0
              ? Number(item.product.deliveryCharge)
              : 150;
          }
        }
        return customPrice > max ? customPrice : max;
      }, 0);

  // Helper to normalize the product's payment type
  const getNormalizedPaymentType = (pType: string | undefined): 'cod' | 'delivery_charge' | 'full_advance' | 'percentage' => {
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

  // Find the governing payment type and product from enrichedCartItems
  let paymentType: 'cod' | 'delivery_charge' | 'full_advance' | 'percentage' = 'cod';
  let governingProduct = enrichedCartItems[0]?.product;

  if (enrichedCartItems.length > 0) {
    const hasFullAdvance = enrichedCartItems.find(item => getNormalizedPaymentType(item.product.paymentType) === 'full_advance');
    const hasPercentage = enrichedCartItems.find(item => getNormalizedPaymentType(item.product.paymentType) === 'percentage');
    const hasDeliveryCharge = enrichedCartItems.find(item => getNormalizedPaymentType(item.product.paymentType) === 'delivery_charge');

    if (hasFullAdvance) {
      paymentType = 'full_advance';
      governingProduct = hasFullAdvance.product;
    } else if (hasPercentage) {
      paymentType = 'percentage';
      governingProduct = hasPercentage.product;
    } else if (hasDeliveryCharge) {
      paymentType = 'delivery_charge';
      governingProduct = hasDeliveryCharge.product;
    } else {
      const definedPayType = enrichedCartItems.find(item => {
        const normType = getNormalizedPaymentType(item.product.paymentType);
        return normType && normType !== 'cod';
      });
      if (definedPayType) {
        paymentType = getNormalizedPaymentType(definedPayType.product.paymentType);
        governingProduct = definedPayType.product;
      } else {
        paymentType = 'cod';
        governingProduct = enrichedCartItems[0]?.product;
      }
    }
  }

  if (settings?.globalPaymentMethod === 'cod_only') {
    paymentType = 'cod';
  } else if (settings?.globalPaymentMethod === 'prepay_only') {
    if (paymentType === 'cod') paymentType = 'full_advance';
  }

  const bkashNumber = governingProduct?.bkashNumber || '';
  const nagadNumber = governingProduct?.nagadNumber || '';

  const resolvedDeliveryCharge = deliveryCharge;

  const grandTotal = getValidatedTotal(enrichedCartItems, resolvedDeliveryCharge, discountAmount);

  // Deriving the active payment method robustly to prevent stuck COD states or UI mismatches
  const activePaymentMethod = paymentType === 'cod' 
    ? 'cod' 
    : (paymentMethod === 'cod' ? (settings?.globalPaymentSystem === 'always_nagad' ? 'nagad' : 'bkash') : paymentMethod);

  let advancePaymentAmount = 0;
  if (activePaymentMethod !== 'cod') {
    if (paymentType === 'full_advance') {
      advancePaymentAmount = grandTotal;
    } else if (paymentType === 'percentage') {
      const pct = governingProduct?.paymentPercentage !== undefined ? Number(governingProduct.paymentPercentage) : 10;
      advancePaymentAmount = Math.round((pct / 100) * (itemsTotal - discountAmount));
    } else if (paymentType === 'delivery_charge') {
      advancePaymentAmount = resolvedDeliveryCharge;
    }
  }

  // Set initial payment method when paymentType overrides change, with robust protection against stuck COD states
  useEffect(() => {
    if (paymentType === 'cod') {
      setPaymentMethod('cod');
    } else {
      if (paymentMethod === 'cod') {
        setPaymentMethod(settings?.globalPaymentSystem === 'always_nagad' ? 'nagad' : 'bkash');
      }
    }
  }, [paymentType, paymentMethod, settings?.globalPaymentSystem, checkoutStep]);

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
        const lotteryEligibleTotal = enrichedCartItems.reduce((sum, item) => {
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
      const formattedItems = enrichedCartItems.map(item => ({
        title: item.product.title,
        selectedSize: item.selectedSize,
        selectedColor: item.selectedColor,
        selectedColorImage: item.selectedColorImage,
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

    if (activePaymentMethod !== 'cod') {
      const txErr = validateTransactionId(transactionId);
      if (txErr) {
        setErrorMessage(txErr);
        return;
      }
    }

    setIsCheckingOut(true);

    try {
      const dbFormatItems = enrichedCartItems.map(item => ({
        productId: item.product.id,
        title: item.product.title,
        price: getProductActivePrice(item.product),
        selectedSize: item.selectedSize,
        selectedColor: item.selectedColor,
        selectedColorImage: item.selectedColorImage,
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
          paymentMethod: activePaymentMethod === 'cod' ? 'COD' : activePaymentMethod.toUpperCase(),
          paidAmount: activePaymentMethod === 'cod' ? 0 : advancePaymentAmount,
          transactionId: activePaymentMethod === 'cod' ? '' : transactionId.trim().toUpperCase(),
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
      if (activePaymentMethod !== 'cod' && transactionId) {
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
      
      const pLabel = activePaymentMethod === 'cod' 
        ? 'Cash on Delivery (COD)' 
        : `${paymentType === 'delivery_charge' ? 'Delivery Charge Advance' : paymentType === 'percentage' ? `${governingProduct?.paymentPercentage || 10}% Partial Advance` : 'Full Advance'} (${activePaymentMethod.toUpperCase()})`;
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
                ? 'max-w-[95vw] lg:max-w-[95vw] xl:max-w-[1200px] border-purple-500/20 rounded-none sm:rounded-3xl h-full sm:h-[95vh] lg:h-[95vh] max-h-full sm:max-h-[95vh] lg:max-h-[95vh] shadow-[0_0_60px_rgba(123,44,191,0.25)] mx-auto' 
                : 'max-w-lg border-l border-white/5 h-full'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-white/10 p-4 sm:py-3.5 sm:px-5 relative shrink-0 bg-[#0c0617]">
              <div className="flex items-center gap-2">
                <ShoppingBag size={18} className="text-luxury-gold animate-pulse drop-shadow-[0_0_6px_rgba(212,175,55,0.6)]" />
                <h3 className={`font-serif text-xs sm:text-[13px] font-black tracking-widest uppercase transition-all duration-300 ${
                  checkoutStep !== 'cart' && checkoutStep !== 'success'
                    ? 'bg-gradient-to-r from-luxury-gold via-white to-luxury-gold bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(212,175,55,0.45)] scale-105'
                    : 'text-white'
                }`}>
                  {checkoutStep === 'cart' && "Your Selection"}
                  {checkoutStep === 'step1' && "⚜️ STEP 1: VIP INFORMATION"}
                  {checkoutStep === 'step2' && "⚜️ STEP 2: PREMIUM CHECKOUT"}
                  {checkoutStep === 'success' && "⚜️ ORDER COMPLETED SUCCESSFULLY"}
                </h3>
              </div>
              {checkoutStep !== 'success' && (
                <button 
                  onClick={onClose}
                  className="text-white/50 hover:text-luxury-gold hover:rotate-90 transition-all duration-300 p-1 rounded-full hover:bg-white/10 border border-transparent hover:border-white/15"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Step Progress Bar Indicator */}
            {checkoutStep !== 'cart' && checkoutStep !== 'success' && (
              <div className="px-6 py-2.5 bg-[#120926] border-b-2 border-[#d4af37]/35 flex items-center justify-between gap-2 text-[10px] font-mono tracking-wider shrink-0 select-none shadow-md">
                <div className="flex items-center gap-2.5">
                  <span className={`w-5.5 h-5.5 rounded-full flex items-center justify-center text-[9.5px] font-black transition-all duration-300 ${checkoutStep === 'step1' ? 'bg-gradient-to-r from-[#d4af37] to-[#f3e5ab] text-black ring-4 ring-yellow-400/30' : 'bg-purple-900/50 text-purple-200 border border-purple-500/30'}`}>1</span>
                  <span className={`transition-colors duration-300 ${checkoutStep === 'step1' ? 'text-white font-black drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]' : 'text-white/35 font-semibold'}`}>CONTACT INFO</span>
                </div>
                <div className="flex-1 h-[2px] bg-gradient-to-r from-luxury-gold/50 to-purple-800/50 mx-2.5" />
                <div className="flex items-center gap-2.5">
                  <span className={`w-5.5 h-5.5 rounded-full flex items-center justify-center text-[9.5px] font-black transition-all duration-300 ${checkoutStep === 'step2' ? 'bg-gradient-to-r from-[#d4af37] to-[#f3e5ab] text-black ring-4 ring-yellow-400/30' : 'bg-purple-900/50 text-purple-200 border border-purple-500/30'}`}>2</span>
                  <span className={`transition-colors duration-300 ${checkoutStep === 'step2' ? 'text-white font-black drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]' : 'text-white/35 font-semibold'}`}>PREMIUM SECURE</span>
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
            ) : enrichedCartItems.length === 0 ? (
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
                         {enrichedCartItems.map((item, idx) => {
                           const itemDisplayImage = item.selectedColorImage || item.product.imageUrl;
                           return (
                             <div key={`${item.product.id}-${idx}`} className="flex gap-3 bg-white/[0.01] border border-white/5 p-3 rounded-2xl hover:border-luxury-gold/30 transition-all duration-300">
                               <div 
                                 onClick={() => setLightboxImage({ url: itemDisplayImage, title: item.product.title })}
                                 className="w-20 h-20 rounded-xl border border-white/10 shrink-0 relative overflow-hidden group/img cursor-zoom-in bg-black/40 shadow-inner"
                                 title="Click to view full image"
                               >
                                 <img 
                                   src={itemDisplayImage} 
                                   alt={item.product.title} 
                                   className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-115 group-hover/img:brightness-110" 
                                   referrerPolicy="no-referrer" 
                                 />
                                 <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                   <ZoomIn size={14} className="text-luxury-gold drop-shadow-[0_0_4px_rgba(212,175,55,0.8)]" />
                                 </div>
                               </div>
                               <div className="flex-1 flex flex-col justify-between min-w-0">
                                 <div className="flex justify-between items-start gap-2">
                                   <h4 className="font-serif text-[12px] text-white font-medium truncate">{item.product.title}</h4>
                                   <span className="text-luxury-gold text-[12px] font-mono font-bold shrink-0">{formatPrice(getProductActivePrice(item.product) * item.quantity)}</span>
                                 </div>
                                 <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                   <span className="text-[9px] bg-white/5 border border-white/5 text-white/40 px-1.5 py-0.5 rounded font-mono">SIZE: {item.selectedSize || 'STANDARD'}</span>
                                   {item.selectedColor && (
                                     <span className="text-[9px] bg-luxury-gold/10 border border-luxury-gold/20 text-luxury-gold px-1.5 py-0.5 rounded font-sans font-semibold flex items-center gap-1">
                                       <span className="w-1.5 h-1.5 rounded-full bg-luxury-gold inline-block animate-pulse"></span>
                                       COLOUR: {item.selectedColor}
                                     </span>
                                   )}
                                 </div>
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
                          );
                        })}
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
                            className="flex-1 bg-black/40 text-white font-mono text-xs border border-white/10 hover:border-white/20 rounded-xl py-2.5 px-3 focus:outline-none focus:border-luxury-gold focus:ring-4 focus:ring-luxury-gold/25 focus:shadow-[0_0_15px_rgba(212,175,55,0.25)] transition-all duration-300 placeholder-white/25 uppercase tracking-wider"
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
                    <div className="flex-1 overflow-y-auto p-2 sm:p-2.5 scrollbar-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/[0.04] via-purple-950/[0.06] to-[#05010a]">
                      <div className="w-full">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-3.5 items-start">
                        
                        {/* LEFT COLUMN: RECIPIENT INFORMATION */}
                        <div className="space-y-2 relative lg:col-span-8">
                          <div className="flex items-center justify-between pb-1 border-b border-luxury-gold/20">
                            <div className="flex items-center gap-1.5">
                              <User size={13} className="text-luxury-gold drop-shadow-[0_0_2px_rgba(212,175,55,0.4)]" />
                              <span className="text-[10px] font-mono tracking-widest text-luxury-gold uppercase font-bold bg-gradient-to-r from-luxury-gold to-white bg-clip-text text-transparent">
                                SECURE CHECKOUT FORM
                              </span>
                            </div>
                            {/* Static secure badge */}
                            <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-1 py-0.5 rounded text-[8px] font-mono font-bold text-emerald-400 uppercase tracking-wider select-none">
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 mr-0.5" />
                              SECURE SSL
                            </div>
                          </div>

                          {/* Elegant, glassmorphic card groups of inputs with premium styling */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 relative z-10">
                            {/* Glassmorphic Sub-card 1: Contact details */}
                            <motion.div 
                              initial={{ opacity: 0, y: 15 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.4, ease: "easeOut" }}
                              className="relative overflow-hidden bg-white/[0.01] backdrop-blur-xl border border-white/5 rounded-xl p-2.5 sm:p-3 lg:p-3.5 space-y-2 lg:space-y-2.5 shadow-lg group hover:border-luxury-gold/20 transition-all duration-300 h-full"
                            >
                              <div className="flex items-center gap-2 pb-1.5 border-b border-white/5">
                                <User size={12} className="text-luxury-gold drop-shadow-[0_0_6px_rgba(212,175,55,0.6)]" />
                                <span className="text-[9px] font-mono tracking-widest text-luxury-gold uppercase font-bold bg-gradient-to-r from-luxury-gold to-white bg-clip-text text-transparent drop-shadow-[0_0_4px_rgba(212,175,55,0.4)]">১. যোগাযোগের তথ্য (CONTACT CREDENTIALS)</span>
                              </div>

                              <div className="grid grid-cols-1 gap-3 relative z-10">
                                {/* Name Field */}
                                <div className="relative group/input">
                                  <div className={`absolute top-1/2 -translate-y-1/2 left-3 md:left-4 transition-all duration-300 ${
                                    customerName
                                      ? isNameValid
                                        ? 'text-emerald-400'
                                        : 'text-red-400/80'
                                      : 'text-zinc-400 group-focus-within/input:text-luxury-gold'
                                  }`}>
                                    <User className="w-3.5 h-3.5 md:w-4.5 md:h-4.5" />
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
                                    className={`peer block w-full rounded-xl border backdrop-blur-md pb-0.5 pt-3.5 md:pt-4.5 pl-9 pr-9 md:pl-12 md:pr-12 text-[12.5px] md:text-[14.5px] text-white transition-all duration-300 font-bold h-[42px] md:h-[52px] shadow-sm focus:outline-none ${
                                      customerName
                                        ? isNameValid
                                          ? 'border-emerald-500/40 bg-emerald-500/[0.03] focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/20 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                                          : 'border-red-500/30 bg-red-500/[0.01] focus:border-red-400 focus:ring-4 focus:ring-red-400/20 shadow-[0_0_15px_rgba(239,68,68,0.25)]'
                                        : 'border-white/10 bg-white/[0.03] hover:border-white/20 focus:border-luxury-gold focus:ring-4 focus:ring-luxury-gold/25 focus:shadow-[0_0_20px_rgba(212,175,55,0.3)]'
                                    }`}
                                  />
                                  <label 
                                    htmlFor="customer_name" 
                                    className={`absolute left-9 md:left-12 top-1 md:top-2 text-[8px] md:text-[9.5px] font-bold transition-all peer-placeholder-shown:top-[11px] md:peer-placeholder-shown:top-[15px] peer-placeholder-shown:text-xs md:peer-placeholder-shown:text-[14.5px] peer-placeholder-shown:text-zinc-400 peer-placeholder-shown:font-semibold peer-focus:top-1 md:peer-focus:top-2 peer-focus:text-[8px] md:peer-focus:text-[9.5px] uppercase font-mono tracking-[0.15em] pointer-events-none ${
                                      customerName
                                        ? isNameValid
                                          ? 'text-emerald-400/80 peer-focus:text-emerald-400 drop-shadow-[0_0_4px_rgba(52,211,153,0.5)]'
                                          : 'text-red-400/80 peer-focus:text-red-400 drop-shadow-[0_0_4px_rgba(248,113,113,0.5)]'
                                        : 'text-zinc-400 peer-focus:text-luxury-gold peer-focus:drop-shadow-[0_0_6px_rgba(212,175,55,0.7)]'
                                    }`}
                                  >
                                    আপনার সম্পূর্ণ নাম * (Full Name)
                                  </label>
                                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
                                    <AnimatePresence mode="wait">
                                      {customerName && (
                                        isNameValid ? (
                                          <motion.div
                                            key="name-valid"
                                            initial={{ scale: 0, rotate: -20, opacity: 0, filter: "drop-shadow(0 0 0px rgba(52,211,153,0))" }}
                                            animate={{ 
                                              scale: 1, 
                                              rotate: 0, 
                                              opacity: 1,
                                              filter: "drop-shadow(0 0 4px rgba(52,211,153,0.4))"
                                            }}
                                            exit={{ scale: 0, opacity: 0 }}
                                            transition={{ type: "spring", stiffness: 300, damping: 15 }}
                                            className="flex items-center justify-center"
                                          >
                                            <div className="bg-emerald-500/20 border border-emerald-400/30 p-0.5 rounded-full flex items-center justify-center">
                                              <Check size={8} className="text-emerald-400 stroke-[3px]" />
                                            </div>
                                          </motion.div>
                                        ) : (
                                          <motion.div
                                            key="name-invalid"
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0, opacity: 0 }}
                                            transition={{ duration: 0.15 }}
                                          >
                                            <X size={11} className="text-red-400/80" />
                                          </motion.div>
                                        )
                                      )}
                                    </AnimatePresence>
                                  </div>
                                </div>

                                {/* Mobile Number */}
                                <div className="relative group/input">
                                  <div className={`absolute top-1/2 -translate-y-1/2 left-3 md:left-4 transition-all duration-300 ${
                                    customerPhone
                                      ? isPhoneValid
                                        ? 'text-emerald-400'
                                        : 'text-red-400/80'
                                      : 'text-zinc-400 group-focus-within/input:text-luxury-gold'
                                  }`}>
                                    <Phone className="w-3.5 h-3.5 md:w-4.5 md:h-4.5" />
                                  </div>
                                  <input 
                                    ref={phoneInputRef}
                                    type="tel"
                                    required
                                    id="customer_phone"
                                    value={customerPhone}
                                    onChange={(e) => setCustomerPhone(e.target.value.replace(/[^0-9]/g, ''))}
                                    onKeyDown={(e) => handleKeyDown(e, addressTextRef)}
                                    placeholder=" "
                                    className={`peer block w-full rounded-xl border backdrop-blur-md pb-0.5 pt-3.5 md:pt-4.5 pl-9 pr-9 md:pl-12 md:pr-12 text-[12.5px] md:text-[14.5px] text-white transition-all duration-300 font-mono font-bold h-[42px] md:h-[52px] shadow-sm focus:outline-none ${
                                      customerPhone
                                        ? isPhoneValid
                                          ? 'border-emerald-500/40 bg-emerald-500/[0.03] focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/20 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                                          : 'border-red-500/30 bg-red-500/[0.01] focus:border-red-400 focus:ring-4 focus:ring-red-400/20 shadow-[0_0_15px_rgba(239,68,68,0.25)]'
                                        : 'border-white/10 bg-white/[0.03] hover:border-white/20 focus:border-luxury-gold focus:ring-4 focus:ring-luxury-gold/25 focus:shadow-[0_0_20px_rgba(212,175,55,0.3)]'
                                    }`}
                                  />
                                  <label 
                                    htmlFor="customer_phone" 
                                    className={`absolute left-9 md:left-12 top-1 md:top-2 text-[8px] md:text-[9.5px] font-bold transition-all peer-placeholder-shown:top-[11px] md:peer-placeholder-shown:top-[15px] peer-placeholder-shown:text-xs md:peer-placeholder-shown:text-[14.5px] peer-placeholder-shown:text-zinc-400 peer-placeholder-shown:font-semibold peer-focus:top-1 md:peer-focus:top-2 peer-focus:text-[8px] md:peer-focus:text-[9.5px] uppercase font-mono tracking-[0.15em] pointer-events-none ${
                                      customerPhone
                                        ? isPhoneValid
                                          ? 'text-emerald-400/80 peer-focus:text-emerald-400 drop-shadow-[0_0_4px_rgba(52,211,153,0.5)]'
                                          : 'text-red-400/80 peer-focus:text-red-400 drop-shadow-[0_0_4px_rgba(248,113,113,0.5)]'
                                        : 'text-zinc-300 peer-focus:text-luxury-gold peer-focus:drop-shadow-[0_0_6px_rgba(212,175,55,0.7)]'
                                    }`}
                                  >
                                    আপনার মোবাইল নম্বর * (Mobile Number)
                                  </label>
                                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
                                    <AnimatePresence mode="wait">
                                      {customerPhone && (
                                        isPhoneValid ? (
                                          <motion.div
                                            key="phone-valid"
                                            initial={{ scale: 0, rotate: -20, opacity: 0, filter: "drop-shadow(0 0 0px rgba(52,211,153,0))" }}
                                            animate={{ 
                                              scale: 1, 
                                              rotate: 0, 
                                              opacity: 1,
                                              filter: "drop-shadow(0 0 4px rgba(52,211,153,0.4))"
                                            }}
                                            exit={{ scale: 0, opacity: 0 }}
                                            transition={{ type: "spring", stiffness: 300, damping: 15 }}
                                            className="flex items-center justify-center"
                                          >
                                            <div className="bg-emerald-500/20 border border-emerald-400/30 p-0.5 rounded-full flex items-center justify-center">
                                              <Check size={8} className="text-emerald-400 stroke-[3px]" />
                                            </div>
                                          </motion.div>
                                        ) : (
                                          <motion.div
                                            key="phone-invalid"
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0, opacity: 0 }}
                                            transition={{ duration: 0.15 }}
                                          >
                                            <span className="text-[7px] font-mono text-red-400 font-black bg-red-500/10 border border-red-500/20 px-1 py-0.5 rounded tracking-wide uppercase">১১ ডিজিট</span>
                                          </motion.div>
                                        )
                                      )}
                                    </AnimatePresence>
                                  </div>
                                </div>

                                {/* Product Image Selection Option (Moved below contact credentials inputs) */}
                                {enrichedCartItems.some(item => [item.product.imageUrl, ...(item.product.images || [])].filter(Boolean).length > 1) && (
                                  <div className="mt-4 pt-3.5 border-t border-white/5 space-y-3 relative z-10">
                                    <span className="text-[10px] md:text-[11px] font-mono tracking-widest text-[#d4af37] font-extrabold uppercase block drop-shadow-[0_0_4px_rgba(212,175,55,0.4)]">
                                      ⚜️ পছন্দের প্রোডাক্ট কালার/ইমেজ সিলেক্ট করুন (Select Image)
                                    </span>
                                    <div className="space-y-3">
                                      {enrichedCartItems.map((item, idx) => {
                                        const productImagesList = [item.product.imageUrl, ...(item.product.images || [])].filter(Boolean);
                                        if (productImagesList.length > 1) {
                                          const itemDisplayImage = item.selectedColorImage || item.product.imageUrl;
                                          return (
                                            <div key={`image-select-${idx}`} className="p-2 sm:p-2.5 rounded-xl bg-black/30 border border-white/5 space-y-2">
                                              <span className="text-[10px] font-sans font-bold text-zinc-300 tracking-wide block truncate">
                                                {item.product.title}
                                              </span>
                                              <div className="flex gap-2 overflow-x-auto py-1 scrollbar-hidden">
                                                {productImagesList.map((imgUrl, imgIdx) => {
                                                  const isSelected = itemDisplayImage === imgUrl;
                                                  return (
                                                    <button
                                                      key={imgIdx}
                                                      type="button"
                                                      onClick={() => onUpdateColorImage && onUpdateColorImage(idx, imgUrl)}
                                                      className={`w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-xl overflow-hidden border transition-all cursor-pointer shrink-0 ${
                                                        isSelected
                                                          ? 'border-[#d4af37] ring-2 ring-[#d4af37]/40 shadow-[0_0_8px_rgba(212,175,55,0.5)] scale-105'
                                                          : 'border-white/10 hover:border-[#d4af37]/35'
                                                      }`}
                                                    >
                                                      <img 
                                                        src={imgUrl} 
                                                        alt={`Option ${imgIdx + 1}`} 
                                                        className="w-full h-full object-cover"
                                                        referrerPolicy="no-referrer"
                                                      />
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          );
                                        }
                                        return null;
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </motion.div>

                            {/* Glassmorphic Sub-card 2: Shipping Destination */}
                            <motion.div 
                              initial={{ opacity: 0, y: 15 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
                              className="relative overflow-hidden bg-white/[0.01] backdrop-blur-xl border border-white/5 rounded-xl p-2.5 sm:p-3 lg:p-3.5 space-y-2 lg:space-y-2.5 shadow-lg group hover:border-luxury-gold/20 transition-all duration-300 h-full"
                            >
                              <div className="flex items-center gap-2 pb-1.5 border-b border-white/5">
                                <MapPin size={12} className="text-luxury-gold drop-shadow-[0_0_6px_rgba(212,175,55,0.6)]" />
                                <span className="text-[9px] font-mono tracking-widest text-luxury-gold uppercase font-bold bg-gradient-to-r from-luxury-gold to-white bg-clip-text text-transparent drop-shadow-[0_0_4px_rgba(212,175,55,0.4)]">২. ডেলিভারি ঠিকানা (SHIPPING DESTINATION)</span>
                              </div>

                              <div className="space-y-3 relative z-10">
                                {/* Desktop Division/District Side-by-Side Dropdowns */}
                                <div className="hidden lg:grid grid-cols-2 gap-4">
                                  {/* Division Select */}
                                  <div className="relative group/input">
                                    <div className="absolute top-1/2 -translate-y-1/2 left-3 md:left-4 text-zinc-400 group-focus-within/input:text-luxury-gold transition-colors duration-300">
                                      <MapPin className="w-3.5 h-3.5 md:w-4.5 md:h-4.5" />
                                    </div>
                                    <select
                                      value={getDivisionForCity(customerCity)}
                                      onChange={(e) => {
                                        const selectedDiv = e.target.value;
                                        const districtsInDiv = DIVISION_MAPS[selectedDiv] || [];
                                        if (districtsInDiv.length > 0) {
                                          setCustomerCity(districtsInDiv[0]);
                                        }
                                      }}
                                      className="peer block w-full rounded-xl border border-white/10 bg-[#0d071a] hover:border-white/20 focus:border-luxury-gold focus:ring-4 focus:ring-luxury-gold/25 focus:shadow-[0_0_20px_rgba(212,175,55,0.3)] text-[12.5px] md:text-[14.5px] text-white font-bold h-[42px] md:h-[52px] pl-9 md:pl-12 pr-8 transition-all duration-300 appearance-none focus:outline-none cursor-pointer pt-2"
                                    >
                                      {Object.keys(DIVISION_MAPS).map((div) => (
                                        <option key={div} value={div} className="bg-[#0c0617] text-white">
                                          {div} বিভাগ (Division)
                                        </option>
                                      ))}
                                    </select>
                                    <label className="absolute left-9 md:left-12 top-1 md:top-2 text-[8px] md:text-[9.5px] font-bold text-luxury-gold uppercase font-mono tracking-[0.15em] pointer-events-none">
                                      বিভাগ * (Division)
                                    </label>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                                      <ChevronDown size={14} />
                                    </div>
                                  </div>

                                  {/* District Select */}
                                  <div className="relative group/input">
                                    <div className="absolute top-1/2 -translate-y-1/2 left-3 md:left-4 text-zinc-400 group-focus-within/input:text-luxury-gold transition-colors duration-300">
                                      <MapPin className="w-3.5 h-3.5 md:w-4.5 md:h-4.5" />
                                    </div>
                                    <select
                                      value={customerCity}
                                      onChange={(e) => {
                                        setCustomerCity(e.target.value);
                                      }}
                                      className="peer block w-full rounded-xl border border-white/10 bg-[#0d071a] hover:border-white/20 focus:border-luxury-gold focus:ring-4 focus:ring-luxury-gold/25 focus:shadow-[0_0_20px_rgba(212,175,55,0.3)] text-[12.5px] md:text-[14.5px] text-white font-bold h-[42px] md:h-[52px] pl-9 md:pl-12 pr-8 transition-all duration-300 appearance-none focus:outline-none cursor-pointer pt-2"
                                    >
                                      {(DIVISION_MAPS[getDivisionForCity(customerCity)] || ALL_DISTRICTS_LIST).map((district) => (
                                        <option key={district} value={district} className="bg-[#0c0617] text-white">
                                          {district}
                                        </option>
                                      ))}
                                    </select>
                                    <label className="absolute left-9 md:left-12 top-1 md:top-2 text-[8px] md:text-[9.5px] font-bold text-luxury-gold uppercase font-mono tracking-[0.15em] pointer-events-none">
                                      জেলা/শহর * (District/City)
                                    </label>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                                      <ChevronDown size={14} />
                                    </div>
                                  </div>
                                </div>

                                 {/* City / District (Mobile/Tablet Only) */}
                                 <div className="lg:hidden relative group/city bg-black/20 border border-white/5 hover:border-white/10 rounded-xl p-2.5 sm:p-3 flex flex-col justify-between shadow-inner transition-all duration-300">
                                   <span className="text-[9px] text-white uppercase font-mono tracking-[0.15em] font-extrabold mb-1.5 flex items-center gap-1.5 relative">
                                     <MapPin size={11} className="text-luxury-gold animate-pulse drop-shadow-[0_0_3px_rgba(212,175,55,0.8)]" />
                                     <span className="bg-gradient-to-r from-luxury-gold via-white to-luxury-gold bg-clip-text text-transparent font-black drop-shadow-[0_0_2px_rgba(212,175,55,0.4)]">
                                       জেলা/শহর * (City/District)
                                     </span>
                                   </span>
                                   
                                   {(() => {
                                     const displayedCities = [...CITIES_LIST];
                                     if (!CITIES_LIST.includes(customerCity)) {
                                       displayedCities.push(customerCity);
                                     }

                                     const defaultToShowCount = 3;
                                     let visibleCities = [...displayedCities];
                                     if (!isDistrictsExpanded) {
                                       const initialSelection = displayedCities.slice(0, defaultToShowCount);
                                       if (customerCity && !initialSelection.includes(customerCity)) {
                                         initialSelection.push(customerCity);
                                       }
                                       visibleCities = initialSelection;
                                     }

                                     return (
                                       <div className="flex flex-col gap-1">
                                         <div className="grid grid-cols-2 gap-2 mt-1">
                                           {visibleCities.map((city) => {
                                             const isSelected = customerCity === city;
                                             return (
                                               <div
                                                 key={city}
                                                 onClick={() => setCustomerCity(city)}
                                                 className={`relative py-1.5 px-2.5 rounded-lg text-[9px] font-mono uppercase tracking-wider cursor-pointer transition-all duration-300 flex items-center justify-between border ${
                                                   isSelected
                                                     ? 'bg-gradient-to-r from-luxury-gold/25 via-luxury-gold/15 to-luxury-gold/25 border-luxury-gold text-white font-black shadow-[0_0_12px_rgba(212,175,55,0.35),_inset_0_0_4px_rgba(212,175,55,0.15)]'
                                                     : 'bg-[#0a0614]/80 hover:bg-[#120a24]/90 border-white/5 hover:border-white/15 text-zinc-300 hover:text-white'
                                                 }`}
                                               >
                                                 <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                                   <div className={`w-2 h-2 rounded-full transition-all duration-300 shrink-0 ${
                                                     isSelected 
                                                       ? 'bg-luxury-gold shadow-[0_0_6px_rgba(212,175,55,1)] scale-110' 
                                                       : 'bg-zinc-700 border border-zinc-600'
                                                   }`} />
                                                   <span className="truncate ml-1 font-bold">{city}</span>
                                                 </div>

                                                 {city === 'Dhaka' && (
                                                   <button
                                                     type="button"
                                                     onClick={(e) => {
                                                       e.preventDefault();
                                                       e.stopPropagation();
                                                       setIsDistrictsExpanded(!isDistrictsExpanded);
                                                     }}
                                                     className="py-0.5 px-1 text-[7.5px] font-mono text-white bg-[#1a0833] border border-luxury-gold/40 hover:border-luxury-gold rounded flex items-center gap-0.5 cursor-pointer transition-all duration-300 uppercase font-bold shadow-[0_0_4px_rgba(212,175,55,0.15)] active:scale-95 ml-1 shrink-0 relative overflow-hidden z-10"
                                                     id="btn_dhaka_districts_toggle"
                                                   >
                                                     <div className="luxury-glow-shimmer" />
                                                     
                                                     {isDistrictsExpanded ? (
                                                       <>
                                                         <ChevronUp size={8} className="text-luxury-gold relative z-10" />
                                                         <span className="relative z-10 text-[7.5px]">কম দেখুন (Less)</span>
                                                       </>
                                                     ) : (
                                                       <>
                                                         <ChevronDown size={8} className="text-luxury-gold relative z-10 animate-bounce" />
                                                         <span className="relative z-10 text-[7.5px]">আরো দেখুন (More)</span>
                                                       </>
                                                     )}
                                                   </button>
                                                 )}
                                               </div>
                                             );
                                           })}

                                           {/* Other District button inside the grid */}
                                           <button
                                             type="button"
                                             onClick={(e) => {
                                               e.preventDefault();
                                               e.stopPropagation();
                                               setShowAllDistrictsModal(true);
                                             }}
                                             className="relative py-1.5 px-2.5 rounded-lg text-[9px] font-mono uppercase tracking-wider cursor-pointer transition-all duration-300 flex items-center justify-center gap-1 border bg-luxury-gold/10 hover:bg-luxury-gold/20 border-luxury-gold/30 hover:border-luxury-gold text-luxury-gold hover:text-white overflow-hidden font-bold"
                                             id="btn_show_other_districts"
                                           >
                                             <div className="absolute inset-0 bg-gradient-to-r from-luxury-gold/10 via-transparent to-luxury-gold/10 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                                             <Plus size={9} className="text-luxury-gold animate-pulse shrink-0 drop-shadow-[0_0_3px_rgba(212,175,55,0.8)]" />
                                             <span className="font-bold text-[8.5px] tracking-wide">অন্যান্য জেলা (Other)</span>
                                           </button>
                                         </div>
                                       </div>
                                     );
                                   })()}
                                 </div>

                                 {/* Complete Address */}
                                 <div className="relative group/input">
                                   <div className={`absolute top-3 left-3 md:left-4 transition-all duration-300 ${
                                     customerAddress
                                       ? isAddressValid
                                         ? 'text-emerald-400'
                                         : 'text-red-400/80'
                                       : 'text-zinc-400 group-focus-within/input:text-luxury-gold'
                                   }`}>
                                     <MapPin className="w-3.5 h-3.5 md:w-4.5 md:h-4.5" />
                                   </div>
                                   <textarea 
                                     ref={addressTextRef}
                                     required
                                     id="customer_address"
                                     value={customerAddress}
                                     onChange={(e) => setCustomerAddress(e.target.value)}
                                     placeholder=" "
                                     className={`peer block w-full rounded-xl border backdrop-blur-md pb-0.5 pt-3.5 md:pt-4.5 pl-9 pr-9 md:pl-12 md:pr-12 text-[12.5px] md:text-[14.5px] text-white transition-all duration-300 h-[44px] md:h-[56px] resize-none font-bold leading-normal scrollbar-hidden shadow-sm focus:outline-none ${
                                       customerAddress
                                         ? isAddressValid
                                           ? 'border-emerald-500/40 bg-emerald-500/[0.03] focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/20 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                                           : 'border-red-500/30 bg-red-500/[0.01] focus:border-red-400 focus:ring-4 focus:ring-red-400/20 shadow-[0_0_15px_rgba(239,68,68,0.25)]'
                                         : 'border-white/10 bg-white/[0.03] hover:border-white/20 focus:border-luxury-gold focus:ring-4 focus:ring-luxury-gold/25 focus:shadow-[0_0_20px_rgba(212,175,55,0.3)]'
                                     }`}
                                   />
                                   <label 
                                     htmlFor="customer_address" 
                                     className={`absolute left-9 md:left-12 top-1 md:top-2 text-[8px] md:text-[9.5px] font-bold transition-all peer-placeholder-shown:top-[12px] md:peer-placeholder-shown:top-[17px] peer-placeholder-shown:text-xs md:peer-placeholder-shown:text-[14.5px] peer-placeholder-shown:text-zinc-400 peer-placeholder-shown:font-semibold peer-focus:top-1 md:peer-focus:top-2 peer-focus:text-[8px] md:peer-focus:text-[9.5px] uppercase font-mono tracking-[0.15em] pointer-events-none ${
                                       customerAddress
                                         ? isAddressValid
                                           ? 'text-emerald-400/80 peer-focus:text-emerald-400 drop-shadow-[0_0_4px_rgba(52,211,153,0.5)]'
                                           : 'text-red-400/80 peer-focus:text-red-400 drop-shadow-[0_0_4px_rgba(248,113,113,0.5)]'
                                         : 'text-zinc-300 peer-focus:text-luxury-gold peer-focus:drop-shadow-[0_0_6px_rgba(212,175,55,0.7)]'
                                     }`}
                                   >
                                     সম্পূর্ণ ঠিকানা (গ্রাম/থানা/জেলা) * (Address)
                                   </label>
                                  <div className="absolute right-3 top-3 flex items-center justify-center">
                                    <AnimatePresence mode="wait">
                                      {customerAddress && (
                                        isAddressValid ? (
                                          <motion.div
                                            key="addr-valid"
                                            initial={{ scale: 0, rotate: -20, opacity: 0, filter: "drop-shadow(0 0 0px rgba(52,211,153,0))" }}
                                            animate={{ 
                                              scale: 1, 
                                              rotate: 0, 
                                              opacity: 1,
                                              filter: "drop-shadow(0 0 4px rgba(52,211,153,0.4))"
                                            }}
                                            exit={{ scale: 0, opacity: 0 }}
                                            transition={{ type: "spring", stiffness: 300, damping: 15 }}
                                            className="flex items-center justify-center"
                                          >
                                            <div className="bg-emerald-500/20 border border-emerald-400/30 p-0.5 rounded-full flex items-center justify-center">
                                              <Check size={9} className="text-emerald-400 stroke-[3px]" />
                                            </div>
                                          </motion.div>
                                        ) : (
                                          <motion.div
                                            key="addr-invalid"
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0, opacity: 0 }}
                                            transition={{ duration: 0.15 }}
                                          >
                                            <X size={12} className="text-red-400/80" />
                                          </motion.div>
                                        )
                                      )}
                                    </AnimatePresence>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          </div>
                        </div>

                        {/* RIGHT COLUMN: SELECTED ITEMS & SIZES */}
                        <div className="space-y-1.5 lg:col-span-4">
                          <div className="flex items-center gap-1.5 pb-0.5 border-b border-white/5">
                            <ShoppingBag size={12} className="text-luxury-gold animate-pulse drop-shadow-[0_0_3px_rgba(212,175,55,0.4)]" />
                            <span className="text-[9.5px] font-mono tracking-wider text-[#d4af37] block font-bold uppercase">SELECTED ITEMS & SIZES</span>
                          </div>
                          
                          <div className="space-y-1.5 bg-[#0f0a1c] border border-white/10 rounded-xl p-1.5 sm:p-2.5 md:p-3.5 shadow-xl max-h-[160px] sm:max-h-[200px] md:max-h-[250px] lg:max-h-[350px] xl:max-h-[420px] overflow-y-auto scrollbar-hidden">
                            {enrichedCartItems.map((item, idx) => {
                              const availableSizes = item.product.sizes && item.product.sizes.length > 0 
                                ? item.product.sizes 
                                : ['S', 'M', 'L', 'XL', 'XXL'];
                              
                               const itemDisplayImage = item.selectedColorImage || item.product.imageUrl;
                              return (
                                <div key={idx} className="flex items-center gap-3.5 bg-black/40 p-2 sm:p-2.5 md:p-3 rounded-xl border border-white/5 hover:border-white/10 transition-all duration-300">
                                  {/* Product Photo - Consistent luxury size, perfectly fit */}
                                  <div 
                                    onClick={() => setLightboxImage({ url: itemDisplayImage, title: item.product.title })}
                                    className="w-20 h-20 rounded-xl overflow-hidden border border-white/10 shrink-0 relative cursor-zoom-in group/img bg-black/40 shadow-inner"
                                    title="Click to view full image"
                                  >
                                    <img 
                                      src={itemDisplayImage} 
                                      alt={item.product.title} 
                                      referrerPolicy="no-referrer"
                                      className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-115 group-hover/img:brightness-110"
                                    />
                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                      <ZoomIn size={14} className="text-luxury-gold drop-shadow-[0_0_4px_rgba(212,175,55,0.8)]" />
                                    </div>
                                  </div>

                                  {/* Item Info & Size preference inline */}
                                  <div className="flex-1 min-w-0 flex flex-col justify-center space-y-1.5">
                                    <h4 className="text-[11px] sm:text-[12px] md:text-[13px] lg:text-[14px] font-bold text-white leading-tight truncate">{item.product.title}</h4>
                                    
                                    {/* Color selector inline in Order Form */}
                                    {item.product.colors && item.product.colors.length > 0 && (
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[8.5px] md:text-[9px] font-mono text-zinc-400 uppercase tracking-wider shrink-0">Color:</span>
                                        <div className="flex flex-wrap gap-1">
                                          {item.product.colors.map((colorObj) => {
                                            const isSelected = item.selectedColor === colorObj.name;
                                            return (
                                              <button
                                                key={colorObj.name}
                                                type="button"
                                                onClick={() => onUpdateColor && onUpdateColor(idx, colorObj.name, colorObj.imageUrl)}
                                                className={`h-5 md:h-5.5 px-1.5 sm:px-2 rounded-md text-[8.5px] md:text-[9px] font-sans font-bold cursor-pointer transition-all flex items-center gap-1 shrink-0 ${
                                                  isSelected
                                                    ? 'bg-[#d4af37] text-black font-black shadow-[0_0_4px_rgba(212,175,55,0.3)]'
                                                    : 'bg-black/40 text-white/50 border border-white/5 hover:text-white'
                                                }`}
                                              >
                                                {colorObj.hex && (
                                                  <span 
                                                    className="w-1.5 h-1.5 rounded-full border border-white/20 shrink-0" 
                                                    style={{ backgroundColor: colorObj.hex }}
                                                  />
                                                )}
                                                <span>{colorObj.name}</span>
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}

                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[8.5px] md:text-[9px] font-mono text-zinc-400 uppercase tracking-wider shrink-0">Size:</span>
                                      <div className="flex gap-1 flex-wrap">
                                        {availableSizes.map((size) => (
                                          <button
                                            key={size}
                                            type="button"
                                            onClick={() => onUpdateSize && onUpdateSize(idx, size)}
                                            className={`h-5 md:h-5.5 px-1.5 sm:px-2 rounded-md text-[9px] md:text-[9.5px] font-mono font-bold cursor-pointer transition-all ${
                                              item.selectedSize === size
                                                ? 'bg-[#d4af37] text-black font-black shadow-[0_0_6px_rgba(212,175,55,0.3)]'
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
                                  <div className="flex flex-col items-end gap-1.5 shrink-0 pr-1">
                                    <span className="text-[11.5px] sm:text-[12.5px] md:text-[13.5px] font-mono font-bold text-[#d4af37]">
                                      {formatPrice(getProductActivePrice(item.product) * item.quantity)}
                                    </span>
                                    <div className="flex items-center bg-black/60 border border-white/10 rounded-md overflow-hidden h-5 md:h-5.5">
                                      <button 
                                        type="button" 
                                        onClick={() => onUpdateQty(idx, item.quantity - 1)} 
                                        className="px-1 text-white/60 hover:text-[#d4af37] transition-colors cursor-pointer"
                                      >
                                        <Minus size={8} />
                                      </button>
                                      <span className="px-1.5 text-[10px] md:text-[11px] font-mono font-bold text-white min-w-[12px] text-center">
                                        {item.quantity}
                                      </span>
                                      <button 
                                        type="button" 
                                        onClick={() => onUpdateQty(idx, item.quantity + 1)} 
                                        className="px-1 text-white/60 hover:text-[#d4af37] transition-colors cursor-pointer"
                                      >
                                        <Plus size={8} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                      </div>
                    </div>

                      {errorMessage && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-2 rounded-xl text-[9px] font-mono mt-1.5">
                          ⚠️ {errorMessage}
                        </div>
                      )}
                    </div>

                    {/* Step 1 Footer */}
                    <div className="bg-[#0b0413] border-t border-white/5 p-2 sm:p-2.5 flex flex-col gap-1.5 sm:gap-2 shrink-0">
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
                        vesselType="CART"
                      />
                    </div>
                  </form>
                )}

                {/* STEP 2: PREMIUM CHECKOUT */}
                {checkoutStep === 'step2' && (
                  <form onSubmit={handlePlaceOrder} className="flex-1 flex flex-col justify-between overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-3 sm:p-3.5 space-y-3 scrollbar-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/[0.04] via-purple-950/[0.06] to-[#05010a]">
                      <div className="w-full">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
                        
                        {/* Left column: Payments */}
                        <div className="md:col-span-6 space-y-3">
                           {/* Payment selector */}
                           {/* Payment selector */}
                          <div className="bg-gradient-to-b from-[#130d22]/95 to-[#080511]/98 border border-luxury-gold/25 rounded-xl p-3 sm:p-3.5 space-y-3 shadow-lg">
                            <span className="text-[8.5px] font-mono tracking-[0.15em] text-[#d4af37] block font-bold uppercase">PAYMENT CHANNEL REGISTRY</span>
                            
                            <div className="grid grid-cols-2 gap-2">
                              {paymentType === 'cod' ? (
                                <button
                                  type="button"
                                  onClick={() => setPaymentMethod('cod')}
                                  className={`p-2 rounded-xl border transition-all text-left flex flex-col gap-1 cursor-pointer ${
                                    activePaymentMethod === 'cod'
                                      ? 'bg-gradient-to-br from-emerald-500/25 via-emerald-500/15 to-emerald-500/25 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.35),_inset_0_0_6px_rgba(16,185,129,0.15)] scale-[1.01] font-black'
                                      : 'bg-black/30 border-white/10 opacity-70 hover:opacity-100 hover:border-white/20'
                                  }`}
                                >
                                  <ShieldCheck size={13} className="text-emerald-400" />
                                  <span className="text-[9.5px] font-bold text-white">COD</span>
                                  <span className="text-[7.5px] text-zinc-400">Cash on Delivery</span>
                                </button>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => { setPaymentMethod('bkash'); setTransactionId(''); setTransactionError(''); }}
                                    className={`p-2 rounded-xl border transition-all text-left flex flex-col gap-1 cursor-pointer h-[58px] justify-between ${
                                      activePaymentMethod === 'bkash'
                                        ? 'bg-[#e2136e]/20 border-[#e2136e] shadow-[0_0_12px_rgba(226,19,110,0.35),_inset_0_0_6px_rgba(226,19,110,0.15)] scale-[1.01] font-black'
                                        : 'bg-black/30 border-white/10 opacity-70 hover:opacity-100 hover:border-white/20'
                                    }`}
                                  >
                                    <div className="flex justify-between items-center w-full">
                                      <img 
                                        src={settings?.bkashLogoUrl || 'https://download.logo.wine/logo/BKash/BKash-Logo.wine.svg'} 
                                        alt="bKash" 
                                        referrerPolicy="no-referrer"
                                        className="h-4 w-auto max-w-[36px] object-contain rounded"
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                        }}
                                      />
                                      <Smartphone size={11} className="text-[#e2136e]" />
                                    </div>
                                    <div>
                                      <span className="text-[9px] font-bold text-white block leading-none">bKash</span>
                                      <span className="text-[7.5px] text-zinc-400 block mt-0.5 leading-none">Send Money</span>
                                    </div>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => { setPaymentMethod('nagad'); setTransactionId(''); setTransactionError(''); }}
                                    className={`p-2 rounded-xl border transition-all text-left flex flex-col gap-1 cursor-pointer h-[58px] justify-between ${
                                      activePaymentMethod === 'nagad'
                                        ? 'bg-[#f45c24]/20 border-[#f45c24] shadow-[0_0_12px_rgba(244,92,36,0.35),_inset_0_0_6px_rgba(244,92,36,0.15)] scale-[1.01] font-black'
                                        : 'bg-black/30 border-white/10 opacity-70 hover:opacity-100 hover:border-white/20'
                                    }`}
                                  >
                                    <div className="flex justify-between items-center w-full">
                                      <img 
                                        src={settings?.nagadLogoUrl || 'https://download.logo.wine/logo/Nagad/Nagad-Logo.wine.svg'} 
                                        alt="Nagad" 
                                        referrerPolicy="no-referrer"
                                        className="h-4 w-auto max-w-[36px] object-contain rounded"
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                        }}
                                      />
                                      <Landmark size={11} className="text-[#f45c24]" />
                                    </div>
                                    <div>
                                      <span className="text-[9px] font-bold text-white block leading-none">Nagad</span>
                                      <span className="text-[7.5px] text-zinc-400 block mt-0.5 leading-none">Send Money</span>
                                    </div>
                                  </button>

                                </>
                              )}
                            </div>
                            {activePaymentMethod === 'cod' && (
                              <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl text-[10px] text-emerald-400/90 leading-relaxed">
                                ✓ No advance required. Handover full billing of <strong className="text-white font-mono">{formatPrice(grandTotal)}</strong> to couriers during home dispatch.
                              </div>
                            )}
                            {activePaymentMethod !== 'cod' && (
                              <div className="bg-black/50 border border-white/5 rounded-xl p-2.5 space-y-2.5 animate-fade-in text-[10px]">
                                <div className="flex justify-between items-center text-zinc-400">
                                  <span>Transfer Type:</span>
                                  <span className="bg-white/5 text-white/70 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider font-mono">Personal (Send Money)</span>
                                </div>
                                <div className="flex justify-between items-center bg-gradient-to-r from-luxury-gold/10 via-black/40 to-luxury-gold/10 p-2.5 rounded-xl border border-luxury-gold/30 shadow-md">
                                  <div>
                                    <span className="text-[7.5px] text-luxury-gold font-mono font-bold block uppercase tracking-wider">RECIPIENT NUMBER</span>
                                    <span className="font-mono font-black text-white text-[12.5px] tracking-widest block drop-shadow-[0_0_4px_rgba(212,175,55,0.3)]">
                                      {activePaymentMethod === 'bkash' && (bkashNumber || '01777223344')}
                                      {activePaymentMethod === 'nagad' && (nagadNumber || '01999887766')}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const num = activePaymentMethod === 'bkash' ? (bkashNumber || '01777223344') : (nagadNumber || '01999887766');
                                      navigator.clipboard.writeText(num);
                                    }}
                                    className="text-[8.5px] bg-luxury-gold hover:bg-white text-black px-3 py-1.5 rounded-lg transition-all duration-300 font-extrabold border-0 cursor-pointer"
                                  >
                                    Copy Number
                                  </button>
                                </div>
                                <div className="flex justify-between items-center border-t border-white/5 pt-1.5 text-zinc-300">
                                  <span>REQUIRED AMOUNT:</span>
                                  <span className="text-luxury-gold font-mono font-black text-xs">৳{advancePaymentAmount}</span>
                                </div>

                                {/* Transaction ID Input */}
                                <div className="space-y-1 relative">
                                  <label className={`block text-[8px] font-mono uppercase tracking-[0.15em] transition-colors duration-300 ${
                                    transactionId
                                      ? !transactionError
                                        ? 'text-emerald-400'
                                        : 'text-red-400'
                                      : 'text-white/70'
                                  }`}>Transaction ID *</label>
                                  <div className="relative">
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
                                      className={`w-full text-white font-mono text-[12px] font-bold border rounded-lg py-1.5 px-2.5 focus:outline-none placeholder-white/40 tracking-widest h-[34px] transition-all duration-300 ${
                                        transactionId
                                          ? !transactionError
                                            ? 'bg-emerald-500/[0.12] border-emerald-400 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-400/20 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                                            : 'bg-red-500/[0.08] border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-400/20 shadow-[0_0_12px_rgba(239,68,68,0.3)]'
                                          : 'bg-[#15102a]/95 border-luxury-gold/40 hover:border-luxury-gold focus:border-luxury-gold focus:ring-2 focus:ring-luxury-gold/20 focus:shadow-[0_0_15px_rgba(212,175,55,0.25)]'
                                      }`}
                                    />
                                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center">
                                      <AnimatePresence mode="wait">
                                        {transactionId && (
                                          !transactionError ? (
                                            <motion.div
                                              key="tx-valid"
                                              initial={{ scale: 0, rotate: -20, opacity: 0, filter: "drop-shadow(0 0 0px rgba(52,211,153,0))" }}
                                              animate={{ 
                                                scale: 1, 
                                                rotate: 0, 
                                                opacity: 1,
                                                filter: "drop-shadow(0 0 4px rgba(52,211,153,0.4))"
                                              }}
                                              exit={{ scale: 0, opacity: 0 }}
                                              transition={{ type: "spring", stiffness: 300, damping: 15 }}
                                              className="flex items-center justify-center"
                                            >
                                              <div className="bg-emerald-500/20 border border-emerald-400/30 p-1 rounded-full flex items-center justify-center">
                                                <Check size={10} className="text-emerald-400 stroke-[3px]" />
                                              </div>
                                            </motion.div>
                                          ) : (
                                            <motion.div
                                              key="tx-invalid"
                                              initial={{ scale: 0, opacity: 0 }}
                                              animate={{ scale: 1, opacity: 1 }}
                                              exit={{ scale: 0, opacity: 0 }}
                                              transition={{ duration: 0.15 }}
                                            >
                                              <X size={10} className="text-red-400/80" />
                                            </motion.div>
                                          )
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  </div>
                                  {transactionError && <p className="text-[8.5px] font-mono text-red-400 mt-0.5">⚠️ {transactionError}</p>}
                                </div>

                                {/* Payment Screenshot */}
                                 <div className="space-y-1">
                                  <label className="block text-[8px] font-mono uppercase tracking-[0.12em] text-white/40">Transfer Screenshot Proof (Optional)</label>
                                  {screenshotPreview ? (
                                    <div className="flex items-center justify-between bg-white/[0.01] border border-white/5 p-1 rounded-lg">
                                      <img src={screenshotPreview} className="w-7 h-7 object-cover rounded" />
                                      <button type="button" onClick={() => { setScreenshotPreview(null); setScreenshotBase64(null); }} className="text-[8px] text-red-400 hover:underline border-0 bg-transparent cursor-pointer">Remove</button>
                                    </div>
                                  ) : (
                                    <label className="border border-dashed border-luxury-gold/30 hover:border-luxury-gold bg-luxury-gold/[0.03] hover:bg-luxury-gold/[0.08] p-2.5 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300">
                                      <input type="file" accept="image/*" onChange={handleScreenshotChange} className="hidden" />
                                      <div className="flex items-center gap-1.5">
                                        <svg className="w-3 h-3 text-luxury-gold" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                                        </svg>
                                        <span className="text-[8.5px] text-luxury-gold font-bold uppercase tracking-wider">Upload Screenshot Proof</span>
                                      </div>
                                    </label>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                        </div>

                        {/* Right column: Order items, Coupon box, Delivery Guidelines and Trust badges */}
                        <div className="md:col-span-6 space-y-2.5">
                          
                          {/* Itemization Report */}
                          <div className="bg-gradient-to-b from-[#130d22]/95 to-[#080511]/98 border border-white/10 rounded-xl p-3 space-y-2.5 shadow-lg">
                            <span className="text-[8.5px] font-mono tracking-[0.15em] text-[#d4af37] block font-bold uppercase border-b border-white/5 pb-1">ITEMIZATION REPORT</span>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[120px] lg:max-h-[135px] overflow-y-auto scrollbar-hidden pr-1">
                              {enrichedCartItems.map((item, idx) => {
                                const itemDisplayImage = item.selectedColorImage || item.product.imageUrl;
                                return (
                                  <div key={idx} className="flex flex-row gap-3 items-center bg-[#090514]/60 p-2.5 rounded-xl border border-white/5 hover:border-[#d4af37]/30 transition-all duration-300">
                                    {/* Product Photo - Consistent luxury size, perfectly fit */}
                                    <div 
                                      onClick={() => setLightboxImage({ url: itemDisplayImage, title: item.product.title })}
                                      className="w-20 h-20 rounded-xl overflow-hidden border border-white/10 shrink-0 relative cursor-zoom-in group/img bg-black/40 shadow-inner"
                                      title="Click to view full image"
                                    >
                                      <img 
                                        src={itemDisplayImage} 
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-115 group-hover/img:brightness-110" 
                                        referrerPolicy="no-referrer" 
                                      />
                                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                        <ZoomIn size={14} className="text-luxury-gold drop-shadow-[0_0_4px_rgba(212,175,55,0.8)]" />
                                      </div>
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                      <h5 className="text-[11px] sm:text-[11.5px] text-white font-bold truncate font-serif leading-tight">{item.product.title}</h5>
                                      <p className="text-[9px] text-zinc-400 font-mono mt-1">
                                        Size: <span className="text-[#d4af37] font-bold">{item.selectedSize}</span> {item.selectedColor && <>| Color: <span className="text-[#d4af37] font-bold">{item.selectedColor}</span></>} | Qty: <span className="text-white font-bold">{item.quantity}</span>
                                      </p>
                                      <p className="text-[9px] text-white/30 font-mono mt-0.5">Unit Price: ৳{getProductActivePrice(item.product)}</p>
                                    </div>
                                  
                                  {/* Right-aligned clean price layout */}
                                  <div className="text-right font-mono shrink-0 pr-1 pl-2">
                                    <span className="text-xs font-black text-[#d4af37] block">
                                      {formatPrice(getProductActivePrice(item.product) * item.quantity)}
                                    </span>
                                  </div>
                                </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Coupon Box in Step 2 with success animation trigger */}
                          <div className="bg-gradient-to-b from-[#130d22]/95 to-[#080511]/98 border border-white/10 rounded-xl p-3 space-y-2 shadow-lg relative overflow-hidden">
                            {showCouponSuccessAnimation && (
                              <div className="absolute inset-0 bg-emerald-500/10 backdrop-blur-sm flex items-center justify-center animate-fade-in z-10 text-emerald-400 font-mono text-[8px] font-black uppercase tracking-wider">
                                <Sparkles size={12} className="mr-1 animate-pulse" /> COUPON SECURED!
                              </div>
                            )}
                            <span className="text-[8.5px] font-mono tracking-[0.15em] text-[#d4af37] block font-bold uppercase">PROMOTION CODES</span>
                            <div className="flex gap-2">
                              <input 
                                type="text" 
                                placeholder="ENTER COUPON CODE"
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value)}
                                className="flex-1 bg-black/40 text-white font-mono text-xs border border-white/10 hover:border-white/20 rounded-lg py-1.5 px-2.5 focus:outline-none focus:border-luxury-gold focus:ring-2 focus:ring-luxury-gold/20 transition-all duration-300 placeholder-white/20 uppercase h-[32px] tracking-wider"
                              />
                              <button type="button" onClick={() => handleApplyCoupon()} className="bg-gradient-to-r from-zinc-800 to-black hover:from-[#d4af37] hover:to-[#ffd700] text-[#d4af37] hover:text-black text-[9px] font-mono font-bold px-3 rounded-lg transition-all h-[32px] tracking-widest border border-luxury-gold/20 cursor-pointer">APPLY</button>
                            </div>
                            {couponError && <p className="text-[8px] font-mono text-red-400">⚠️ {couponError}</p>}
                            {couponSuccess && <p className="text-[8px] font-mono text-emerald-400">✓ {couponSuccess}</p>}
                          </div>

                          {/* Side-by-Side Delivery Profile & Trust Badges */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {/* Delivery Guidelines */}
                            <div className="bg-gradient-to-b from-[#130d22]/95 to-[#080511]/98 border border-white/10 rounded-xl p-2.5 space-y-1.5 shadow-lg flex flex-col justify-between">
                              <span className="text-[8px] font-mono tracking-[0.15em] text-[#d4af37] block font-bold uppercase">DELIVERY PROFILE</span>
                              <div className="space-y-1 text-[9px] leading-normal text-zinc-300 flex-1 flex flex-col justify-center">
                                <p className="flex items-center justify-between text-white border-b border-white/5 pb-0.5">
                                  <span className="flex items-center gap-1"><Clock size={9} className="text-[#d4af37]" /> ETA Range:</span>
                                  <span className="font-mono font-bold text-[#d4af37]">{placedDeliveryDate || getEstimatedDeliveryDate()}</span>
                                </p>
                                <p className="flex items-center justify-between border-b border-white/5 pb-0.5 mt-0.5">
                                  <span>Delivery Time:</span>
                                  <span className="font-mono text-white">10 AM - 8 PM</span>
                                </p>
                                <p className="text-[7.5px] text-white/30 italic leading-snug mt-1">
                                  * Our concierge agent will call prior to arrival.
                                </p>
                              </div>
                            </div>

                            {/* Trust Badges */}
                            <div className="grid grid-cols-3 gap-1 text-center text-white/50 text-[7.5px] items-stretch">
                              <div className="bg-white/[0.01] border border-white/5 p-1 rounded-xl flex flex-col items-center justify-center gap-1">
                                <ShieldCheck size={11} className="text-luxury-gold shrink-0" />
                                <span className="font-bold text-white/70 leading-none">SECURE<br/>BILLING</span>
                              </div>
                              <div className="bg-white/[0.01] border border-white/5 p-1 rounded-xl flex flex-col items-center justify-center gap-1">
                                <Award size={11} className="text-luxury-gold shrink-0" />
                                <span className="font-bold text-white/70 leading-none">100%<br/>ORIGINAL</span>
                              </div>
                              <div className="bg-white/[0.01] border border-white/5 p-1 rounded-xl flex flex-col items-center justify-center gap-1">
                                <Undo2 size={11} className="text-luxury-gold shrink-0" />
                                <span className="font-bold text-white/70 leading-none">7-DAY<br/>RETURN</span>
                              </div>
                            </div>
                          </div>

                        </div>

                      </div>
                    </div>

                      {errorMessage && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-2 rounded-xl text-[9.5px] font-mono">
                          ⚠️ SYSTEM ALERT: {errorMessage}
                        </div>
                      )}
                    </div>

                    {/* Step 2 Footer Checkout Calculation Box */}
                    <div className="bg-[#0b0413] border-t border-white/5 p-2 sm:p-2.5 lg:p-3 shrink-0 flex flex-col gap-1.5 sm:gap-2">
                      {/* Top Row: Back button on left, totals summaries on right */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="flex items-center">
                          <button type="button" onClick={() => setCheckoutStep('step1')} className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-all text-[10px] uppercase font-mono py-0.5 cursor-pointer">
                            <ArrowLeft size={13} /> Back to info
                          </button>
                        </div>
                        
                        {/* Summary Totals */}
                        <div className="flex flex-col items-end gap-1.5 text-[10.5px] text-zinc-400">
                          <div className="flex flex-wrap gap-x-3 gap-y-1 sm:justify-end">
                            <div className="flex gap-1">
                              <span>Subtotal:</span>
                              <span className="font-mono text-white">{formatPrice(itemsTotal)}</span>
                            </div>
                            {appliedCoupon && (
                              <div className="flex gap-1">
                                <span>Coupon:</span>
                                <span className="text-emerald-400 font-bold font-mono">-{formatPrice(discountAmount)}</span>
                              </div>
                            )}
                            <div className="flex gap-1">
                              <span>Delivery:</span>
                              <span className="font-mono text-white">{formatPrice(resolvedDeliveryCharge)}</span>
                            </div>
                            <div className="flex gap-1 text-white font-extrabold border-l border-white/10 pl-3">
                              <span className="tracking-wider uppercase text-[8.5px] text-zinc-400 font-bold">Grand Total:</span>
                              <span className="text-luxury-gold font-mono font-black">{formatPrice(grandTotal)}</span>
                            </div>
                          </div>

                          {/* Payment Breakdown */}
                          <div className="flex flex-wrap gap-x-3 gap-y-1 justify-end text-[9.5px] text-zinc-500 border-t border-white/[0.04] pt-1.5 w-full sm:w-auto">
                            <div className="flex gap-1.5 items-center">
                              <span className="text-zinc-500 uppercase tracking-wider text-[8px]">Advance Required:</span>
                              <span className="font-mono font-bold text-white bg-white/5 px-1.5 py-0.5 rounded text-[10px]">৳{advancePaymentAmount}</span>
                            </div>
                            <div className="flex gap-1.5 items-center border-l border-white/10 pl-3">
                              <span className="text-zinc-500 uppercase tracking-wider text-[8px]">Due on Delivery:</span>
                              <span className="font-mono font-bold text-luxury-gold bg-luxury-gold/5 px-1.5 py-0.5 rounded text-[10px]">৳{grandTotal - advancePaymentAmount}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Row: The checkout button, beautifully spanning full width */}
                      <div className="w-full">
                        <LuxuryCheckoutButton
                          isCheckingOut={isCheckingOut}
                          disabled={isCheckingOut}
                          label="PLACE LUXURY ORDER"
                          vesselType={initialShowCheckout ? "CAR" : "CART"}
                        />
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

          {/* Elegant Product Image Lightbox Modal */}
          <AnimatePresence>
            {lightboxImage && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[1000] flex flex-col items-center justify-center p-4 sm:p-6 bg-black/95 backdrop-blur-md"
              >
                {/* Backdrop Click to Close */}
                <div 
                  className="absolute inset-0 cursor-pointer" 
                  onClick={() => setLightboxImage(null)}
                />

                {/* Lightbox Panel */}
                <motion.div
                  initial={{ scale: 0.9, y: 15, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0.9, y: 15, opacity: 0 }}
                  transition={{ type: "spring", damping: 25, stiffness: 220 }}
                  className="relative max-w-lg w-full bg-gradient-to-b from-[#120822] to-[#04010a] border-2 border-luxury-gold/50 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(212,175,55,0.3)] z-10 p-4 flex flex-col items-center gap-3.5"
                >
                  {/* Close button top right */}
                  <button
                    type="button"
                    onClick={() => setLightboxImage(null)}
                    className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 border border-white/10 hover:border-luxury-gold hover:text-luxury-gold transition-all duration-300 z-20 cursor-pointer"
                  >
                    <X size={16} />
                  </button>

                  {/* Header info */}
                  <div className="w-full text-center border-b border-white/15 pb-2">
                    <span className="text-[8px] font-mono tracking-[0.25em] text-[#d4af37] uppercase font-bold">bespoke preview</span>
                    <h3 className="font-serif text-[13px] font-bold text-white tracking-wide truncate mt-0.5">{lightboxImage.title}</h3>
                  </div>

                  {/* Enlarged Image container with subtle inner shadow & border */}
                  <div className="relative w-full aspect-square max-h-[60vh] rounded-xl overflow-hidden border border-white/10 bg-black/30 flex items-center justify-center">
                    <img
                      src={lightboxImage.url}
                      alt={lightboxImage.title}
                      referrerPolicy="no-referrer"
                      className="max-w-full max-h-full object-contain selection:bg-transparent"
                    />
                  </div>

                  {/* Instructions Footer */}
                  <div className="text-center w-full">
                    <button
                      type="button"
                      onClick={() => setLightboxImage(null)}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-luxury-gold to-[#f3e5ab] text-black font-mono text-[9px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(212,175,55,0.2)] cursor-pointer"
                    >
                      Close Preview
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* All Districts Search Modal */}
          <AnimatePresence>
            {showAllDistrictsModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
              >
                {/* Backdrop Click to Close */}
                <div 
                  className="absolute inset-0 cursor-pointer" 
                  onClick={() => {
                    setShowAllDistrictsModal(false);
                    setDistrictSearchQuery('');
                  }}
                />

                {/* Modal Box */}
                <motion.div
                  initial={{ scale: 0.95, y: 20, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0.95, y: 20, opacity: 0 }}
                  transition={{ type: "spring", duration: 0.4 }}
                  className="relative bg-[#090312] border border-luxury-gold/40 rounded-2xl p-4 w-full max-w-sm max-h-[75vh] flex flex-col shadow-[0_0_50px_rgba(212,175,55,0.25)] z-10 overflow-hidden"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
                    <div>
                      <h3 className="text-[11px] font-mono font-bold uppercase tracking-widest text-luxury-gold">
                        Select District
                      </h3>
                      <p className="text-[8px] font-mono text-zinc-500 uppercase mt-0.5">
                        64 Districts of Bangladesh
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAllDistrictsModal(false);
                        setDistrictSearchQuery('');
                      }}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {/* Search Bar */}
                  <div className="relative mb-3">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                      <MapPin size={12} className="text-luxury-gold" />
                    </span>
                    <input
                      type="text"
                      placeholder="Search District..."
                      value={districtSearchQuery}
                      onChange={(e) => setDistrictSearchQuery(e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-zinc-500 focus:border-luxury-gold focus:outline-none focus:ring-1 focus:ring-luxury-gold/20 transition-all font-mono"
                      autoFocus
                    />
                    {districtSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setDistrictSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-[10px] font-mono"
                      >
                        CLEAR
                      </button>
                    )}
                  </div>

                  {/* Scrollable List */}
                  <div className="flex-1 overflow-y-auto pr-1 space-y-1 scrollbar-thin max-h-[45vh]">
                    {(() => {
                      const filtered = ALL_DISTRICTS_LIST.filter(d => 
                        d.toLowerCase().includes(districtSearchQuery.toLowerCase())
                      );
                      
                      if (filtered.length === 0) {
                        return (
                          <div className="text-center py-6 text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                            No Districts Found
                          </div>
                        );
                      }

                      return (
                        <div className="grid grid-cols-2 gap-1.5">
                          {filtered.map((district) => {
                            const isSelected = customerCity === district;
                            return (
                              <button
                                key={district}
                                type="button"
                                onClick={() => {
                                  setCustomerCity(district);
                                  setShowAllDistrictsModal(false);
                                  setDistrictSearchQuery('');
                                }}
                                className={`w-full text-left py-2 px-2.5 rounded-xl text-[10px] font-mono uppercase tracking-wide transition-all cursor-pointer flex items-center justify-between border ${
                                  isSelected
                                    ? 'bg-luxury-gold/15 border-luxury-gold text-luxury-gold font-bold shadow-[0_0_10px_rgba(212,175,55,0.15)]'
                                    : 'bg-white/[0.02] hover:bg-white/[0.06] border-white/5 hover:border-white/10 text-zinc-300'
                                }`}
                              >
                                <span className="truncate">{district}</span>
                                {isSelected && <Check size={10} className="shrink-0 text-luxury-gold" />}
                              </button>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
}
import { CartItem, Product } from '../types';

function cleanNumber(val: any): number {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return val;
  const cleaned = String(val).replace(/[৳,$\s]/g, '');
  const num = Number(cleaned);
  return isNaN(num) ? 0 : num;
}

export function getProductPriceDetails(product?: Product | null) {
  if (!product) {
    return {
      currentPrice: 0,
      originalPrice: 0,
      hasActiveOffer: false,
      discountPercent: 0,
      timerExpired: false,
      timerActive: false,
    };
  }

  const originalPrice = cleanNumber(product.price);
  
  // Support both timerOfferPrice and offerPrice
  const timerOfferVal = product.timerOfferPrice !== undefined && product.timerOfferPrice !== null && String(product.timerOfferPrice).trim() !== ''
    ? product.timerOfferPrice
    : (product.offerPrice !== undefined && product.offerPrice !== null && String(product.offerPrice).trim() !== ''
      ? product.offerPrice
      : null);

  const rawOfferPrice = timerOfferVal !== null ? cleanNumber(timerOfferVal) : null;
  const hasValidOfferPrice = rawOfferPrice !== null && rawOfferPrice > 0 && rawOfferPrice < originalPrice;

  // Support both timerActive and timerEnabled
  const hasExplicitTimerFlag = product.timerActive !== undefined || product.timerEnabled !== undefined;
  const isTimerActive = product.timerActive !== false && String(product.timerActive) !== 'false' &&
                        product.timerEnabled !== false && String(product.timerEnabled) !== 'false';

  let timerExpired = false;
  let hasTimerConfig = false;

  // Support both timerEndTime and timerEndDate
  const endTimeVal = product.timerEndTime || product.timerEndDate;
  const startTimeVal = product.timerStartTime || product.timerStartDate;

  if (endTimeVal) {
    const rawStr = String(endTimeVal).trim();
    if (rawStr) {
      hasTimerConfig = true;
      let endMs = NaN;
      if (/^\d{12,}$/.test(rawStr)) {
        endMs = Number(rawStr);
      } else if (/^\d{4}[-/]\d{2}[-/]\d{2}$/.test(rawStr)) {
        endMs = new Date(rawStr.replace(/\//g, '-') + 'T23:59:59').getTime();
      } else {
        endMs = new Date(rawStr.replace(' ', 'T')).getTime();
        if (isNaN(endMs)) endMs = new Date(rawStr).getTime();
      }

      if (!isNaN(endMs) && Date.now() >= endMs) {
        timerExpired = true;
      }
    }
  }

  // Check if start time is in the future
  let isPendingStart = false;
  if (startTimeVal) {
    const rawStartStr = String(startTimeVal).trim();
    if (rawStartStr) {
      let startMs = NaN;
      if (/^\d{12,}$/.test(rawStartStr)) {
        startMs = Number(rawStartStr);
      } else {
        startMs = new Date(rawStartStr.replace(' ', 'T')).getTime();
        if (isNaN(startMs)) startMs = new Date(rawStartStr).getTime();
      }
      if (!isNaN(startMs) && Date.now() < startMs) {
        isPendingStart = true;
      }
    }
  }

  // Offer is active only if valid offer price exists AND:
  // 1) If it's a timer/flash-sale offer: timer must be active, not expired, and started
  // 2) If it's a regular permanent discount (no timer date configured): only active if not explicitly turned off
  let hasActiveOffer = false;
  if (hasValidOfferPrice) {
    if (hasTimerConfig) {
      hasActiveOffer = isTimerActive && !timerExpired && !isPendingStart;
    } else if (hasExplicitTimerFlag && !isTimerActive) {
      hasActiveOffer = false;
    } else {
      hasActiveOffer = true;
    }
  }

  const currentPrice = (hasActiveOffer && rawOfferPrice !== null && rawOfferPrice > 0 && rawOfferPrice < originalPrice) 
    ? rawOfferPrice 
    : originalPrice;
  const discountPercent = hasActiveOffer && originalPrice > 0 && currentPrice < originalPrice
    ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
    : 0;

  return {
    currentPrice: currentPrice > 0 ? currentPrice : originalPrice,
    originalPrice,
    hasActiveOffer: hasActiveOffer && currentPrice < originalPrice,
    discountPercent,
    timerExpired: hasTimerConfig ? timerExpired : false,
    timerActive: isTimerActive && hasTimerConfig && !timerExpired,
  };
}

export function getProductActivePrice(product?: Product | null): number {
  return getProductPriceDetails(product).currentPrice;
}

export function getValidatedTotal(
  cartItems: CartItem[],
  deliveryCharge: number,
  discountAmount: number = 0
): number {
  const itemsTotal = (cartItems || []).reduce((sum, item) => sum + (getProductActivePrice(item?.product) * (item?.quantity || 1)), 0);
  return Math.max(0, itemsTotal - discountAmount + deliveryCharge);
}

export function getAdvancePaymentAmount(
  paymentType: string,
  deliveryCharge: number,
  grandTotal: number,
  paymentPercentage?: number
): number {
  if (paymentType === 'delivery_charge') {
    return deliveryCharge;
  }
  if (paymentType === 'full_advance') {
    return grandTotal;
  }
  if (paymentType === 'percentage') {
    const pct = paymentPercentage !== undefined ? paymentPercentage : 10;
    return Math.round((pct / 100) * grandTotal);
  }
  return 0;
}

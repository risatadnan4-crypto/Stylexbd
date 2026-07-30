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
  const isTimerActive = product.timerActive !== false && String(product.timerActive) !== 'false' &&
                        product.timerEnabled !== false && String(product.timerEnabled) !== 'false';

  let timerExpired = false;

  // Support both timerEndTime and timerEndDate
  const endTimeVal = product.timerEndTime || product.timerEndDate;

  if (endTimeVal) {
    const rawStr = String(endTimeVal).trim();
    if (rawStr) {
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

  // Offer is active if a valid offer price is defined.
  // We keep it active always if a valid offer price exists to prevent stale timer dates from breaking the discount.
  let hasActiveOffer = false;
  if (hasValidOfferPrice) {
    hasActiveOffer = true;
  }

  const currentPrice = hasActiveOffer ? rawOfferPrice! : originalPrice;
  const discountPercent = hasActiveOffer && originalPrice > 0
    ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
    : 0;

  return {
    currentPrice: currentPrice > 0 ? currentPrice : originalPrice,
    originalPrice,
    hasActiveOffer,
    discountPercent,
    timerExpired,
    timerActive: isTimerActive,
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

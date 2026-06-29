import { CartItem, Product } from '../types';

export function getProductActivePrice(product: Product): number {
  if (product.offerPrice !== undefined && product.offerPrice !== null) {
    if (product.timerEndTime) {
      const end = new Date(product.timerEndTime).getTime();
      const now = new Date().getTime();
      if (end <= now) {
        return product.price; // Timer expired, revert to regular price
      }
    }
    return product.offerPrice; // Active offer
  }
  return product.price;
}

export function getValidatedTotal(
  cartItems: CartItem[],
  deliveryCharge: number,
  discountAmount: number = 0
): number {
  const itemsTotal = cartItems.reduce((sum, item) => sum + (getProductActivePrice(item.product) * item.quantity), 0);
  return Math.max(0, itemsTotal - discountAmount + deliveryCharge);
}

export function getAdvancePaymentAmount(
  paymentType: string,
  deliveryCharge: number,
  grandTotal: number
): number {
  if (paymentType === 'delivery_charge') {
    return deliveryCharge;
  }
  if (paymentType === 'full_advance') {
    return grandTotal;
  }
  return 0;
}

import { CartItem, Product } from '../types';

export function getProductActivePrice(product: Product): number {
  if (product.offerPrice !== undefined && product.offerPrice !== null) {
    return product.offerPrice; // Active offer forever
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

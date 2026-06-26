export interface Product {
  id: string;
  code: string; // e.g. XP-001
  title: string;
  description: string;
  price: number;
  category: 'MEN' | 'WOMEN' | 'UNISEX' | 'ACCESSORIES';
  stock: number;
  imageUrl: string;
  images?: string[]; // Support for multiple images
  sizes: string[]; // e.g. ['S', 'XS', 'M', 'L']
  dimensions: string; // e.g. 'Standard Fitting'
  whyBuy: string; // Explaining why they should buy this piece in "আপনি কেন কিনবেন?"
  trending?: boolean;
  featured?: boolean;
  deliveryPrice?: number;
  deliveryPriceDhaka?: number;
  deliveryPriceChattogram?: number;
  deliveryPriceRajshahi?: number;
  deliveryPriceKhulna?: number;
  deliveryPriceBarishal?: number;
  deliveryPriceSylhet?: number;
  deliveryPriceRangpur?: number;
  deliveryPriceMymensingh?: number;
  lotteryEligible?: boolean;
  couponCode?: string;
  couponDiscountPercent?: number;
  offerPrice?: number;
  timerEndTime?: string;
  timerMessage?: string;
}

export interface CartItem {
  product: Product;
  selectedSize: string;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  title: string;
  price: number;
  selectedSize: string;
  quantity: number;
}

export interface Order {
  id: string; // Unique order tracking ID
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerCity: string;
  customerEmail?: string;
  customerNotes?: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  date: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  isVideo?: boolean;
  active: boolean;
}

export interface Review {
  id: string;
  productId: string;
  productTitle: string;
  customerName: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  date: string;
}

export interface Coupon {
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  active: boolean;
  maxUses?: number;
  usedCount?: number;
}

export interface ChatMessage {
  id: string;
  sender: 'customer' | 'admin';
  text: string;
  date: string;
}

export interface ChatRoom {
  id: string;
  customerName: string;
  customerEmail?: string;
  messages: ChatMessage[];
  typingCustomer?: boolean;
  typingAdmin?: boolean;
  onlineCustomer?: boolean;
  onlineAdmin?: boolean;
  lastUpdated: string;
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  discountCode?: string;
  imageUrl?: string;
  active: boolean;
}

export interface AnalyticsStats {
  visits: number;
  liveViews: number;
}

export interface Customer {
  name: string;
  email: string;
  phone?: string;
  password?: string;
}

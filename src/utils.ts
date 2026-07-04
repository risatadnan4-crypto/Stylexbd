// Style X Client-Side Utilities

export function formatPrice(amount: number): string {
  return `৳${amount}`;
}

export function generateQrUrl(productId: string): string {
  // Generates real QR pointing to the product on the development/public host URL
  const currentHost = window.location.origin;
  return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(currentHost + "/?product=" + productId)}`;
}

export function generateOrderQrUrl(orderId: string): string {
  const currentHost = window.location.origin;
  return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(currentHost + "/?track=" + orderId)}`;
}

export function composeWhatsAppLink(phone: string, message: string): string {
  return `https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(message)}`;
}

export const CITIES_LIST = [
  "Dhaka",
  "Chattogram",
  "Rajshahi",
  "Khulna",
  "Barishal",
  "Sylhet",
  "Rangpur"
];

export const DIVISIONS = [
  { key: 'Dhaka', name: 'Dhaka Division' },
  { key: 'Chattogram', name: 'Chattogram Division' },
  { key: 'Rajshahi', name: 'Rajshahi Division' },
  { key: 'Khulna', name: 'Khulna Division' },
  { key: 'Barishal', name: 'Barishal Division' },
  { key: 'Sylhet', name: 'Sylhet Division' },
  { key: 'Rangpur', name: 'Rangpur Division' }
];

export function getDivisionForCity(city: string): string {
  const c = city.trim();
  
  if (c === "Dhaka") return "Dhaka";
  if (c === "Chattogram") return "Chattogram";
  if (c === "Rajshahi") return "Rajshahi";
  if (c === "Khulna") return "Khulna";
  if (c === "Barishal") return "Barishal";
  if (c === "Sylhet") return "Sylhet";
  if (c === "Rangpur") return "Rangpur";
  
  return "Outside"; // default fallback
}


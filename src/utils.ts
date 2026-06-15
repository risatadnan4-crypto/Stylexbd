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
  "Sylhet",
  "Rajshahi",
  "Khulna",
  "Barishal",
  "Rangpur",
  "Mymensingh",
  "Bogra",
  "Cumilla",
  "Narayanganj"
];

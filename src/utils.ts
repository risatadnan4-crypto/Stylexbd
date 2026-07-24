// Style X Client-Side Utilities

export function validateUrl(urlStr?: string | null): boolean {
  if (!urlStr || !urlStr.trim()) return true;
  try {
    const parsed = new URL(urlStr.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export const isValidUrl = validateUrl;

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

export const ALL_DISTRICTS_LIST = [
  "Bagerhat", "Bandarban", "Barguna", "Barishal", "Bhola", "Bogura", "Brahmanbaria", 
  "Chandpur", "Chattogram", "Chuadanga", "Cox's Bazar", "Cumilla", "Dhaka", "Dinajpur", 
  "Faridpur", "Feni", "Gaibandha", "Gazipur", "Gopalganj", "Habiganj", "Jamalpur", 
  "Jashore", "Jhalokati", "Jhenaidah", "Joypurhat", "Khagrachhari", "Khulna", "Kishoreganj", 
  "Kurigram", "Kushtia", "Lakshmipur", "Lalmonirhat", "Madaripur", "Magura", "Manikganj", 
  "Meherpur", "Moulvibazar", "Munshiganj", "Mymensingh", "Naogaon", "Narail", "Narayanganj", 
  "Narsingdi", "Natore", "Netrokona", "Nilphamari", "Noakhali", "Pabna", "Panchagarh", 
  "Patuakhali", "Pirojpur", "Rajbari", "Rajshahi", "Rangamati", "Rangpur", "Satkhira", 
  "Shariatpur", "Sherpur", "Sirajganj", "Sunamganj", "Sylhet", "Tangail", "Thakurgaon"
];

export const DIVISION_MAPS: Record<string, string[]> = {
  "Dhaka": ["Dhaka", "Gazipur", "Gopalganj", "Kishoreganj", "Madaripur", "Manikganj", "Munshiganj", "Narayanganj", "Narsingdi", "Rajbari", "Shariatpur", "Faridpur", "Tangail"],
  "Chattogram": ["Chattogram", "Cox's Bazar", "Bandarban", "Khagrachhari", "Rangamati", "Noakhali", "Feni", "Lakshmipur", "Cumilla", "Chandpur", "Brahmanbaria"],
  "Rajshahi": ["Rajshahi", "Bogura", "Joypurhat", "Naogaon", "Natore", "Chapainawabganj", "Pabna", "Sirajganj"],
  "Khulna": ["Khulna", "Bagerhat", "Satkhira", "Jashore", "Narail", "Magura", "Jhenaidah", "Kushtia", "Chuadanga", "Meherpur"],
  "Barishal": ["Barishal", "Jhalokati", "Pirojpur", "Bhola", "Patuakhali", "Barguna"],
  "Sylhet": ["Sylhet", "Moulvibazar", "Habiganj", "Sunamganj"],
  "Rangpur": ["Rangpur", "Gaibandha", "Kurigram", "Lalmonirhat", "Nilphamari", "Panchagarh", "Thakurgaon", "Dinajpur"],
  "Mymensingh": ["Mymensingh", "Jamalpur", "Sherpur", "Netrokona"]
};

export function getDivisionForCity(city: string): string {
  const c = city.trim().toLowerCase();
  
  if (c.includes('ctg') || c.includes('chittagong') || c.includes('chattogram')) {
    return 'Chattogram';
  }
  if (c.includes('dhaka')) {
    return 'Dhaka';
  }
  if (c.includes('rajshahi')) {
    return 'Rajshahi';
  }
  if (c.includes('khulna')) {
    return 'Khulna';
  }
  if (c.includes('barishal') || c.includes('barisal')) {
    return 'Barishal';
  }
  if (c.includes('sylhet')) {
    return 'Sylhet';
  }
  if (c.includes('rangpur')) {
    return 'Rangpur';
  }
  if (c.includes('mymensingh')) {
    return 'Mymensingh';
  }

  // Direct matches
  const pascalMatch = ["Dhaka", "Chattogram", "Rajshahi", "Khulna", "Barishal", "Sylhet", "Rangpur", "Mymensingh"].find(
    (div) => c.includes(div.toLowerCase())
  );
  if (pascalMatch) {
    return pascalMatch;
  }

  // Map search
  for (const [division, districts] of Object.entries(DIVISION_MAPS)) {
    if (districts.some(d => {
      const dl = d.toLowerCase();
      return c.includes(dl) || dl.includes(c);
    })) {
      return division;
    }
  }
  
  return "Outside"; // default fallback
}


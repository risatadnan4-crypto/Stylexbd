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
  "Bagerhat",
  "Bandarban",
  "Barguna",
  "Barishal",
  "Bhola",
  "Bogura",
  "Brahmanbaria",
  "Chandpur",
  "Chapainawabganj",
  "Chattogram",
  "Chuadanga",
  "Cox's Bazar",
  "Cumilla",
  "Dinajpur",
  "Faridpur",
  "Feni",
  "Gaibandha",
  "Gazipur",
  "Gopalganj",
  "Habiganj",
  "Jamalpur",
  "Jashore",
  "Jhalokati",
  "Jhenaidah",
  "Joypurhat",
  "Khagrachhari",
  "Khulna",
  "Kishoreganj",
  "Kurigram",
  "Kushtia",
  "Lakshmipur",
  "Lalmonirhat",
  "Madaripur",
  "Magura",
  "Manikganj",
  "Meherpur",
  "Moulvibazar",
  "Munshiganj",
  "Mymensingh",
  "Naogaon",
  "Narail",
  "Narayanganj",
  "Narsingdi",
  "Natore",
  "Netrokona",
  "Nilphamari",
  "Noakhali",
  "Pabna",
  "Panchagarh",
  "Patuakhali",
  "Pirojpur",
  "Rajbari",
  "Rajshahi",
  "Rangamati",
  "Rangpur",
  "Satkhira",
  "Shariatpur",
  "Sherpur",
  "Sirajganj",
  "Sunamganj",
  "Sylhet",
  "Tangail",
  "Thakurgaon"
];

export const DIVISIONS = [
  { key: 'Dhaka', name: 'Dhaka Division' },
  { key: 'Chattogram', name: 'Chattogram Division' },
  { key: 'Rajshahi', name: 'Rajshahi Division' },
  { key: 'Khulna', name: 'Khulna Division' },
  { key: 'Barishal', name: 'Barishal Division' },
  { key: 'Sylhet', name: 'Sylhet Division' },
  { key: 'Rangpur', name: 'Rangpur Division' },
  { key: 'Mymensingh', name: 'Mymensingh Division' }
];

export function getDivisionForCity(city: string): string {
  const c = city.trim();
  
  // Dhaka Division
  if (["Dhaka", "Faridpur", "Gazipur", "Gopalganj", "Kishoreganj", "Madaripur", "Manikganj", "Munshiganj", "Narayanganj", "Narsingdi", "Rajbari", "Shariatpur", "Tangail"].includes(c)) {
    return "Dhaka";
  }
  // Chattogram Division
  if (["Bandarban", "Brahmanbaria", "Chandpur", "Chattogram", "Cox's Bazar", "Cumilla", "Feni", "Khagrachhari", "Lakshmipur", "Noakhali", "Rangamati"].includes(c)) {
    return "Chattogram";
  }
  // Rajshahi Division
  if (["Bogura", "Bogra", "Chapainawabganj", "Joypurhat", "Naogaon", "Natore", "Pabna", "Rajshahi", "Sirajganj"].includes(c)) {
    return "Rajshahi";
  }
  // Khulna Division
  if (["Bagerhat", "Chuadanga", "Jashore", "Jhenaidah", "Khulna", "Kushtia", "Magura", "Meherpur", "Narail", "Satkhira"].includes(c)) {
    return "Khulna";
  }
  // Barishal Division
  if (["Barguna", "Barishal", "Bhola", "Jhalokati", "Patuakhali", "Pirojpur"].includes(c)) {
    return "Barishal";
  }
  // Sylhet Division
  if (["Habiganj", "Moulvibazar", "Sunamganj", "Sylhet"].includes(c)) {
    return "Sylhet";
  }
  // Rangpur Division
  if (["Dinajpur", "Gaibandha", "Kurigram", "Lalmonirhat", "Nilphamari", "Panchagarh", "Rangpur", "Thakurgaon"].includes(c)) {
    return "Rangpur";
  }
  // Mymensingh Division
  if (["Jamalpur", "Mymensingh", "Netrokona", "Sherpur"].includes(c)) {
    return "Mymensingh";
  }
  
  return "Outside"; // default fallback
}


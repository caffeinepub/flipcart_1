import { ExternalBlob } from "../backend";
import type { Category, Product } from "../backend.d";

export const STATIC_CATEGORIES: Category[] = [
  {
    id: "grocery",
    name: "Grocery",
    description: "Fresh produce, daily essentials and beverages",
  },
  {
    id: "fashion",
    name: "Fashion",
    description: "Clothing, footwear and accessories",
  },
  {
    id: "appliance",
    name: "Appliance",
    description: "Home appliances, kitchen and laundry",
  },
  {
    id: "mobile",
    name: "Mobile",
    description: "Smartphones, accessories and recharges",
  },
  {
    id: "electronics",
    name: "Electronics",
    description: "Laptops, TVs, cameras and gadgets",
  },
  {
    id: "smart-gadgets",
    name: "Smart Gadgets",
    description: "Smartwatches, earbuds, IoT devices",
  },
  {
    id: "home",
    name: "Home",
    description: "Home decor, furnishings and kitchenware",
  },
  {
    id: "beauty-baby",
    name: "Beauty & Baby Care",
    description: "Skincare, makeup, baby products and care",
  },
  {
    id: "food-healthcare",
    name: "Food & Healthcare",
    description: "Health foods, medicines and wellness",
  },
  {
    id: "sports-fitness",
    name: "Sports & Fitness",
    description: "Sports gear, gym equipment and activewear",
  },
  {
    id: "auto-accessories",
    name: "Auto Accessories",
    description: "Car and bike accessories and spare parts",
  },
  {
    id: "furniture",
    name: "Furniture",
    description: "Sofas, beds, tables and storage",
  },
  {
    id: "bike-scooter",
    name: "Bike & Scooter",
    description: "Cycles, scooters, e-bikes and accessories",
  },
  {
    id: "travel",
    name: "Travel",
    description: "Luggage, travel gear and holiday essentials",
  },
  {
    id: "books-media",
    name: "Books & Media",
    description: "Books, music, movies and stationery",
  },
  {
    id: "gift-card",
    name: "Gift Card",
    description: "Gift cards and vouchers for any occasion",
  },
  {
    id: "sell-old-device",
    name: "Sell / Exchange Old Device",
    description: "Sell or exchange your old phones and gadgets",
  },
  {
    id: "home-service",
    name: "Home Service",
    description: "Plumbing, cleaning, repairs and more at home",
  },
];

export const STATIC_PRODUCTS: Product[] = [
  {
    id: "static-1",
    name: "Samsung Galaxy S24 Ultra",
    description:
      '6.8" QHD+ Dynamic AMOLED display, 200MP camera, Snapdragon 8 Gen 3, 5000mAh battery with AI-powered features. The ultimate Android flagship.',
    price: 134999n,
    discountedPrice: 119999n,
    category: "electronics",
    stockQuantity: 45n,
    rating: 4.7,
    reviewCount: 2847n,
    images: [],
  },
  {
    id: "static-2",
    name: "Sony WH-1000XM5 Headphones",
    description:
      "Industry-leading noise cancellation, 30-hour battery life, crystal clear call quality, and premium sound with LDAC support.",
    price: 34990n,
    discountedPrice: 26990n,
    category: "electronics",
    stockQuantity: 120n,
    rating: 4.8,
    reviewCount: 4521n,
    images: [],
  },
  {
    id: "static-3",
    name: "Men's Premium Polo T-Shirt",
    description:
      "100% organic cotton, classic fit polo shirt. Available in 12 colors. Perfect for casual and semi-formal occasions.",
    price: 1499n,
    discountedPrice: 899n,
    category: "fashion",
    stockQuantity: 500n,
    rating: 4.3,
    reviewCount: 1204n,
    images: [],
  },
  {
    id: "static-4",
    name: "Scandinavian Coffee Table",
    description:
      "Solid teak wood construction with natural oil finish. Minimalist design with lower shelf for storage. 120x60x45cm.",
    price: 18999n,
    discountedPrice: 13999n,
    category: "furniture",
    stockQuantity: 30n,
    rating: 4.6,
    reviewCount: 387n,
    images: [],
  },
  {
    id: "static-5",
    name: "Nike Air Zoom Pegasus 40",
    description:
      "Responsive cushioning, breathable mesh upper, durable outsole. Ideal for everyday running and training.",
    price: 10795n,
    discountedPrice: 8599n,
    category: "sports-fitness",
    stockQuantity: 200n,
    rating: 4.5,
    reviewCount: 3012n,
    images: [],
  },
  {
    id: "static-6",
    name: "Apple MacBook Air M3",
    description:
      '15.3" Liquid Retina display, M3 chip, 8GB RAM, 256GB SSD, 18-hour battery. Ultra-thin and light.',
    price: 134900n,
    discountedPrice: 124900n,
    category: "electronics",
    stockQuantity: 60n,
    rating: 4.9,
    reviewCount: 1876n,
    images: [],
  },
  {
    id: "static-7",
    name: "Women's Floral Kurti",
    description:
      "Beautiful block-print floral pattern, 100% cotton, regular fit. Perfect for casual daily wear.",
    price: 1299n,
    discountedPrice: 799n,
    category: "fashion",
    stockQuantity: 350n,
    rating: 4.2,
    reviewCount: 892n,
    images: [],
  },
  {
    id: "static-8",
    name: "Yoga Mat Premium 6mm",
    description:
      "Non-slip TPE material, 183x61cm, eco-friendly, includes carry strap. Perfect grip for all yoga styles.",
    price: 2499n,
    discountedPrice: 1599n,
    category: "sports-fitness",
    stockQuantity: 180n,
    rating: 4.4,
    reviewCount: 672n,
    images: [],
  },
];

export const CATEGORY_ICONS: Record<string, string> = {
  grocery: "🛒",
  fashion: "👗",
  appliance: "🏠",
  mobile: "📱",
  electronics: "💻",
  "smart-gadgets": "⌚",
  home: "🛋️",
  "beauty-baby": "💄",
  "food-healthcare": "💊",
  "sports-fitness": "⚽",
  "auto-accessories": "🚗",
  furniture: "🪑",
  "bike-scooter": "🛵",
  travel: "✈️",
  "books-media": "📚",
  "gift-card": "🎁",
  "sell-old-device": "♻️",
  "home-service": "🔧",
};

export const PRODUCT_IMAGES: Record<string, string> = {
  "static-1": "/assets/generated/product-phone.dim_400x400.jpg",
  "static-2": "/assets/generated/product-headphones.dim_400x400.jpg",
  "static-3": "/assets/generated/product-shirt.dim_400x400.jpg",
  "static-4": "/assets/generated/product-table.dim_400x400.jpg",
  "static-5": "/assets/generated/product-shoes.dim_400x400.jpg",
  "static-6": "/assets/generated/product-phone.dim_400x400.jpg",
  "static-7": "/assets/generated/product-shirt.dim_400x400.jpg",
  "static-8": "/assets/generated/product-shoes.dim_400x400.jpg",
};

export function getProductImage(product: Product): string {
  // If product has uploaded images, use ExternalBlob to get a URL
  if (
    product.images &&
    product.images.length > 0 &&
    product.images[0].length > 0
  ) {
    return ExternalBlob.fromBytes(
      product.images[0] as Uint8Array<ArrayBuffer>,
    ).getDirectURL();
  }
  if (PRODUCT_IMAGES[product.id]) return PRODUCT_IMAGES[product.id];
  // Generate a deterministic picsum seed from product id
  const seed = product.id
    .split("")
    .reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return `https://picsum.photos/seed/${seed}/400/400`;
}

export function formatPrice(price: bigint): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(price));
}

export function getDiscountPercentage(
  price: bigint,
  discountedPrice: bigint,
): number {
  if (price === 0n) return 0;
  return Math.round(
    ((Number(price) - Number(discountedPrice)) / Number(price)) * 100,
  );
}

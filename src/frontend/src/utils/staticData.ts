import type { Category, Product } from "../backend.d";

export const STATIC_CATEGORIES: Category[] = [
  {
    id: "electronics",
    name: "Electronics",
    description: "Smartphones, laptops, gadgets and more",
  },
  {
    id: "fashion",
    name: "Fashion",
    description: "Clothing, footwear and accessories",
  },
  {
    id: "home-furniture",
    name: "Home & Furniture",
    description: "Furniture, decor and appliances",
  },
  {
    id: "sports",
    name: "Sports & Outdoors",
    description: "Sports gear, fitness equipment",
  },
  {
    id: "books",
    name: "Books",
    description: "Fiction, non-fiction, academic and more",
  },
  {
    id: "beauty",
    name: "Beauty & Health",
    description: "Skincare, makeup, wellness",
  },
  {
    id: "groceries",
    name: "Groceries",
    description: "Fresh produce, snacks and beverages",
  },
  {
    id: "toys",
    name: "Toys & Games",
    description: "Toys, board games and learning kits",
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
    category: "home-furniture",
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
    category: "sports",
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
    category: "sports",
    stockQuantity: 180n,
    rating: 4.4,
    reviewCount: 672n,
    images: [],
  },
];

export const CATEGORY_ICONS: Record<string, string> = {
  electronics: "📱",
  fashion: "👗",
  "home-furniture": "🛋️",
  sports: "⚽",
  books: "📚",
  beauty: "💄",
  groceries: "🛒",
  toys: "🎮",
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

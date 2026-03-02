import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Review {
    userId: Principal;
    comment: string;
    rating: bigint;
}
export interface Product {
    id: string;
    stockQuantity: bigint;
    name: string;
    description: string;
    category: string;
    rating: number;
    price: bigint;
    reviewCount: bigint;
    discountedPrice: bigint;
    images: Array<Uint8Array>;
}
export interface Category {
    id: string;
    name: string;
    description: string;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export type Time = bigint;
export interface Order {
    id: string;
    status: OrderStatus;
    userId: Principal;
    createdAt: Time;
    statusHistory: Array<StatusHistory>;
    items: Array<CartItem>;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface StatusHistory {
    status: OrderStatus;
    timestamp: Time;
}
export interface UserEntry {
    principal: Principal;
    role: string;
    profile?: UserProfile;
}
export interface ShoppingItem {
    productName: string;
    currency: string;
    quantity: bigint;
    priceInCents: bigint;
    productDescription: string;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export type StripeSessionStatus = {
    __kind__: "completed";
    completed: {
        userPrincipal?: string;
        response: string;
    };
} | {
    __kind__: "failed";
    failed: {
        error: string;
    };
};
export interface StripeConfiguration {
    allowedCountries: Array<string>;
    secretKey: string;
}
export interface CartItem {
    productId: string;
    quantity: bigint;
    price: bigint;
}
export interface UserProfile {
    name: string;
    email: string;
    address: string;
    phone: string;
}
export enum OrderStatus {
    Delivered = "Delivered",
    Confirmed = "Confirmed",
    Cancelled = "Cancelled",
    Processing = "Processing",
    Shipped = "Shipped",
    OutForDelivery = "OutForDelivery",
    Pending = "Pending"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addReview(productId: string, rating: bigint, comment: string): Promise<void>;
    addToCart(productId: string, quantity: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createCategory(category: Category): Promise<void>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    createProduct(product: Product): Promise<void>;
    deleteCategory(categoryId: string): Promise<void>;
    deleteProduct(productId: string): Promise<void>;
    getAllOrders(): Promise<Array<Order>>;
    getAllProducts(): Promise<Array<Product>>;
    getAllUsers(): Promise<Array<UserEntry>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCart(): Promise<Array<CartItem>>;
    getCartTotal(): Promise<bigint>;
    getCategories(): Promise<Array<Category>>;
    getOrder(orderId: string): Promise<Order | null>;
    getOrdersForUser(userId: Principal): Promise<Array<Order>>;
    getProduct(productId: string): Promise<Product | null>;
    getProductsByCategory(category: string): Promise<Array<Product>>;
    getReviewsForProduct(productId: string): Promise<Array<Review>>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    initializeFirstAdmin(pin: string): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    placeOrder(): Promise<string>;
    removeFromCart(productId: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    setUserRole(targetUser: Principal, newRole: string): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateCartItemQuantity(productId: string, quantity: bigint): Promise<void>;
    updateCategory(category: Category): Promise<void>;
    updateOrderStatus(orderId: string, newStatus: OrderStatus): Promise<void>;
    updateProduct(product: Product): Promise<void>;
}

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Loader2,
  MapPin,
  Package,
  Shield,
  Smartphone,
  Tag,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { ShoppingItem } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCreateCheckoutSession,
  useGetAllProducts,
  useGetCallerUserProfile,
  useGetCart,
  useGetCartTotal,
  useGetStripeSessionStatus,
  usePlaceOrder,
} from "../hooks/useQueries";
import {
  STATIC_PRODUCTS,
  formatPrice,
  getProductImage,
} from "../utils/staticData";

type PaymentMethod = "skypay" | "googlepay" | "card";

// Coupon codes
const VALID_COUPONS: Record<
  string,
  { type: "percent" | "flat"; value: number; label: string }
> = {
  SAVE10: { type: "percent", value: 10, label: "10% off" },
  WELCOME20: { type: "percent", value: 20, label: "20% off" },
  FLAT50: { type: "flat", value: 50, label: "₹50 flat off" },
  SHOPEXPO15: { type: "percent", value: 15, label: "15% off" },
};

// Address book helpers
const ADDRESS_BOOK_KEY = "shopexpo_addresses";

interface SavedAddress {
  id: string;
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
}

function getSavedAddresses(): SavedAddress[] {
  try {
    const stored = localStorage.getItem(ADDRESS_BOOK_KEY);
    return stored ? (JSON.parse(stored) as SavedAddress[]) : [];
  } catch {
    return [];
  }
}

// Google Pay SVG Logo
function GooglePayLogo({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size * 0.4}
      viewBox="0 0 41 17"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Google Pay"
    >
      <title>Google Pay</title>
      <path
        d="M19.526 2.635v4.083h2.518c.6 0 1.096-.202 1.488-.605.403-.402.605-.882.605-1.437 0-.544-.202-1.018-.605-1.422-.392-.413-.888-.619-1.488-.619h-2.518zm0 5.52v4.736h-1.504V1.198h3.99c1.013 0 1.873.337 2.582 1.012.72.675 1.08 1.497 1.08 2.466 0 .991-.36 1.819-1.08 2.482-.697.665-1.559.997-2.583.997h-2.485zM27.194 10.693c0 .392.166.718.499.979.332.26.73.391 1.19.391.643 0 1.228-.238 1.752-.713.525-.476.787-1.034.787-1.675-.496-.39-1.187-.585-2.072-.585-.645 0-1.182.156-1.614.468-.432.313-.542.714-.542 1.135zm1.812-5.533c1.126 0 2.015.302 2.666.904.652.604.978 1.431.978 2.482v5.013h-1.435v-1.128h-.065c-.631.928-1.472 1.392-2.521 1.392-.895 0-1.643-.265-2.245-.796-.601-.53-.902-1.193-.902-1.986 0-.838.317-1.506.952-2.002.634-.497 1.479-.745 2.535-.745.902 0 1.646.165 2.232.496v-.348c0-.531-.21-.982-.63-1.353-.42-.372-.914-.557-1.483-.557-.854 0-1.53.36-2.027 1.08l-1.321-.832c.724-1.04 1.802-1.62 3.266-1.62zM40.986 5.425l-5.02 11.553h-1.55l1.862-4.031-3.3-7.522h1.634l2.387 5.764h.032l2.322-5.764z"
        fill="#3C4043"
      />
      <path
        d="M13.448 7.134c0-.463-.04-.92-.116-1.366H6.967v2.588h3.634a3.11 3.11 0 01-1.344 2.042v1.68h2.169c1.27-1.17 2.022-2.9 2.022-4.944z"
        fill="#4285F4"
      />
      <path
        d="M6.967 13.63c1.814 0 3.34-.595 4.459-1.552l-2.169-1.681c-.603.406-1.38.647-2.29.647-1.754 0-3.244-1.184-3.776-2.773H.957v1.731a6.733 6.733 0 006.01 3.629z"
        fill="#34A853"
      />
      <path
        d="M3.191 8.27a4.03 4.03 0 010-2.57V3.97H.957A6.733 6.733 0 000 6.985c0 1.09.26 2.12.957 3.016l2.234-1.731z"
        fill="#FBBC04"
      />
      <path
        d="M6.967 2.927a3.647 3.647 0 012.575 1.007l1.918-1.918A6.465 6.465 0 006.967.24 6.733 6.733 0 00.957 3.87l2.234 1.73c.532-1.59 2.022-2.772 3.776-2.772z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function CheckoutPage() {
  const search = useSearch({ from: "/checkout" });
  const sessionId = (search as { session_id?: string }).session_id;

  const { identity, login } = useInternetIdentity();
  const { data: cartItems, isLoading: cartLoading } = useGetCart();
  const { data: cartTotal } = useGetCartTotal();
  const { data: backendProducts } = useGetAllProducts();
  const { data: userProfile } = useGetCallerUserProfile();
  const createCheckout = useCreateCheckoutSession();
  const placeOrder = usePlaceOrder();

  const { data: stripeStatus } = useGetStripeSessionStatus(sessionId ?? "");

  const allProducts =
    backendProducts && backendProducts.length > 0
      ? backendProducts
      : STATIC_PRODUCTS;

  const [address, setAddress] = useState({
    name: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("googlepay");
  const [upiId, setUpiId] = useState("");
  const [skyPayOrderId, setSkyPayOrderId] = useState<string | null>(null);
  const [googlePayOrderId, setGooglePayOrderId] = useState<string | null>(null);

  // Coupon state
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    type: "percent" | "flat";
    value: number;
    label: string;
    saving: bigint;
  } | null>(null);

  // Address book
  const [savedAddresses] = useState<SavedAddress[]>(() => getSavedAddresses());

  // Pre-fill from userProfile when it loads
  useEffect(() => {
    if (userProfile) {
      setAddress((prev) => ({
        ...prev,
        name: prev.name || userProfile.name || "",
        phone: prev.phone || userProfile.phone || "",
        street: prev.street || userProfile.address || "",
      }));
    }
  }, [userProfile]);

  // Handle post-Stripe redirect
  if (sessionId && stripeStatus) {
    if (stripeStatus.__kind__ === "completed") {
      return <PaymentSuccessView sessionId={sessionId} />;
    }
    if (stripeStatus.__kind__ === "failed") {
      return (
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="font-display font-bold text-xl mb-2">
              Payment Failed
            </h2>
            <p className="text-muted-foreground mb-6">
              {stripeStatus.failed.error ||
                "Something went wrong with your payment."}
            </p>
            <Button
              asChild
              className="bg-brand-orange hover:bg-orange-600 text-white"
            >
              <Link to="/cart">Back to Cart</Link>
            </Button>
          </div>
        </div>
      );
    }
  }

  // Sky Pay success screen
  if (skyPayOrderId) {
    return <SkyPaySuccessView orderId={skyPayOrderId} />;
  }

  // Google Pay success screen
  if (googlePayOrderId) {
    return <GooglePaySuccessView orderId={googlePayOrderId} />;
  }

  if (!identity) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Shield className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
        <h2 className="font-display font-bold text-xl mb-2">Login Required</h2>
        <p className="text-muted-foreground mb-6">
          Please login to proceed with checkout
        </p>
        <Button
          className="bg-brand-orange hover:bg-orange-600 text-white"
          onClick={login}
        >
          Login to Continue
        </Button>
      </div>
    );
  }

  if (cartLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground mb-4">Your cart is empty</p>
        <Button
          asChild
          className="bg-brand-orange hover:bg-orange-600 text-white"
        >
          <Link to="/products" search={{}}>
            Shop Now
          </Link>
        </Button>
      </div>
    );
  }

  const validateAddress = () => {
    if (
      !address.name ||
      !address.phone ||
      !address.street ||
      !address.city ||
      !address.pincode
    ) {
      toast.error("Please fill in all address fields");
      return false;
    }
    return true;
  };

  const handleCheckout = async () => {
    if (!validateAddress()) return;

    setIsProcessing(true);
    try {
      const items: ShoppingItem[] = cartItems.map((item) => {
        const product = allProducts.find((p) => p.id === item.productId);
        return {
          productName: product?.name ?? "Product",
          productDescription: product?.description?.slice(0, 100) ?? "",
          currency: "inr",
          quantity: item.quantity,
          priceInCents: item.price * 100n,
        };
      });

      const successUrl = `${window.location.origin}/checkout?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${window.location.origin}/cart`;

      const checkoutUrl = await createCheckout.mutateAsync({
        items,
        successUrl,
        cancelUrl,
      });
      window.location.href = checkoutUrl;
    } catch {
      toast.error("Failed to create checkout session. Please try again.");
      setIsProcessing(false);
    }
  };

  const handleSkyPay = async () => {
    if (!validateAddress()) return;
    if (!upiId.trim()) {
      toast.error("Please enter your UPI ID");
      return;
    }
    if (!upiId.includes("@")) {
      toast.error("Please enter a valid UPI ID (e.g. name@skypay)");
      return;
    }

    setIsProcessing(true);
    try {
      const id = await placeOrder.mutateAsync();
      setSkyPayOrderId(id);
    } catch {
      toast.error("Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGooglePay = async () => {
    if (!validateAddress()) return;

    setIsProcessing(true);
    // Simulate Google Pay processing
    await new Promise((resolve) => setTimeout(resolve, 2000));
    try {
      const id = await placeOrder.mutateAsync();
      setGooglePayOrderId(id);
    } catch {
      toast.error("Google Pay payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const subtotal = cartTotal ?? 0n;
  const deliveryCharge = subtotal > 499n ? 0n : 49n;
  const total = subtotal + deliveryCharge;

  const handleApplyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    const coupon = VALID_COUPONS[code];
    if (!coupon) {
      toast.error(
        "Invalid coupon code. Try SAVE10, WELCOME20, FLAT50, or SHOPEXPO15",
      );
      return;
    }
    const subtotalNum = Number(total);
    const saving =
      coupon.type === "percent"
        ? BigInt(Math.floor((subtotalNum * coupon.value) / 100))
        : BigInt(coupon.value);
    setAppliedCoupon({ code, ...coupon, saving });
    toast.success(`Coupon applied! You save ${formatPrice(saving)}`);
    setCouponInput("");
  };

  const discount = appliedCoupon?.saving ?? 0n;
  const finalTotal = total > discount ? total - discount : 0n;

  const _isDigitalPayment =
    paymentMethod === "googlepay" || paymentMethod === "skypay";

  return (
    <main className="container mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/cart">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <h1 className="font-display font-bold text-2xl">Checkout</h1>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left: Address */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-border p-6">
            <h2 className="font-display font-bold text-lg mb-5 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-brand-orange" />
              Delivery Address
            </h2>

            {/* Saved Addresses selector */}
            {savedAddresses.length > 0 && (
              <div className="mb-5">
                <p className="text-sm font-medium mb-2 text-muted-foreground">
                  Use saved address:
                </p>
                <div className="flex flex-wrap gap-2">
                  {savedAddresses.map((addr) => (
                    <button
                      type="button"
                      key={addr.id}
                      onClick={() =>
                        setAddress({
                          name: addr.name,
                          phone: addr.phone,
                          street: addr.street,
                          city: addr.city,
                          state: addr.state,
                          pincode: addr.pincode,
                        })
                      }
                      className="text-xs border border-border rounded-lg px-3 py-2 bg-muted hover:border-brand-orange hover:bg-brand-orange/5 transition-colors text-left"
                      data-ocid="checkout.saved_address.button"
                    >
                      <span className="font-medium">{addr.name}</span>
                      <br />
                      <span className="text-muted-foreground">
                        {addr.city}, {addr.pincode}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={address.name}
                  onChange={(e) =>
                    setAddress({ ...address, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={address.phone}
                  onChange={(e) =>
                    setAddress({ ...address, phone: e.target.value })
                  }
                />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="street">Street Address *</Label>
                <Input
                  id="street"
                  placeholder="House/Flat No, Street Name, Area"
                  value={address.street}
                  onChange={(e) =>
                    setAddress({ ...address, street: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  placeholder="Mumbai"
                  value={address.city}
                  onChange={(e) =>
                    setAddress({ ...address, city: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  placeholder="Maharashtra"
                  value={address.state}
                  onChange={(e) =>
                    setAddress({ ...address, state: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pincode">Pincode *</Label>
                <Input
                  id="pincode"
                  placeholder="400001"
                  maxLength={6}
                  value={address.pincode}
                  onChange={(e) =>
                    setAddress({ ...address, pincode: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* Order items */}
          <div className="bg-white rounded-2xl border border-border p-6">
            <h2 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-brand-orange" />
              Order Items ({cartItems.length})
            </h2>
            <div className="space-y-3">
              {cartItems.map((item) => {
                const product = allProducts.find(
                  (p) => p.id === item.productId,
                );
                if (!product) return null;
                return (
                  <div key={item.productId} className="flex items-center gap-3">
                    <img
                      src={getProductImage(product)}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded-lg border border-border"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">
                        {product.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Qty: {Number(item.quantity)}
                      </p>
                    </div>
                    <span className="text-sm font-bold flex-shrink-0">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Summary */}
        <div>
          <div className="bg-white rounded-2xl border border-border p-5 sticky top-20">
            <h2 className="font-display font-bold text-lg mb-4">
              Price Details
            </h2>

            {/* Coupon input */}
            {!appliedCoupon ? (
              <div className="mb-4">
                <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5" /> Apply Coupon
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter code (e.g. SAVE10)"
                    value={couponInput}
                    onChange={(e) =>
                      setCouponInput(e.target.value.toUpperCase())
                    }
                    className="text-sm h-9 uppercase"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleApplyCoupon();
                    }}
                    data-ocid="checkout.coupon_input"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 px-3 border-brand-orange text-brand-orange hover:bg-brand-orange hover:text-white text-xs font-bold"
                    onClick={handleApplyCoupon}
                    data-ocid="checkout.coupon.submit_button"
                  >
                    Apply
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mb-4 bg-green-50 border border-green-200 rounded-lg px-3 py-2 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-green-700">
                    {appliedCoupon.code} applied!
                  </p>
                  <p className="text-xs text-green-600">
                    You save {formatPrice(appliedCoupon.saving)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAppliedCoupon(null)}
                  className="text-green-600 hover:text-green-800"
                  data-ocid="checkout.coupon.delete_button"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">MRP Total</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivery</span>
                <span className={deliveryCharge === 0n ? "text-green-600" : ""}>
                  {deliveryCharge === 0n ? "FREE" : formatPrice(deliveryCharge)}
                </span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-sm text-green-600 font-medium">
                  <span>Coupon ({appliedCoupon.code})</span>
                  <span>−{formatPrice(appliedCoupon.saving)}</span>
                </div>
              )}
            </div>
            <Separator className="mb-4" />
            <div className="flex justify-between mb-5">
              <span className="font-bold">Total Amount</span>
              <div className="text-right">
                {appliedCoupon && (
                  <p className="text-xs text-muted-foreground line-through">
                    {formatPrice(total)}
                  </p>
                )}
                <span className="font-display font-bold text-xl">
                  {formatPrice(finalTotal)}
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="mb-4">
              <p className="text-sm font-semibold text-foreground mb-3">
                Choose Payment Method
              </p>

              {/* Digital Payments Section */}
              <div className="mb-3">
                <p className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wide">
                  Digital Payments
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {/* Google Pay option */}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setPaymentMethod("googlepay")}
                    className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                      paymentMethod === "googlepay"
                        ? "border-blue-500 bg-blue-50 shadow-sm"
                        : "border-border bg-background hover:border-blue-300 hover:bg-blue-50/50"
                    }`}
                    aria-pressed={paymentMethod === "googlepay"}
                    aria-label="Pay with Google Pay"
                    data-ocid="checkout.googlepay.toggle"
                  >
                    {paymentMethod === "googlepay" && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500" />
                    )}
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white border border-gray-200 shadow-sm">
                      <GooglePayLogo size={28} />
                    </div>
                    <span
                      className={`text-xs font-bold tracking-wide ${
                        paymentMethod === "googlepay"
                          ? "text-blue-600"
                          : "text-muted-foreground"
                      }`}
                    >
                      G PAY
                    </span>
                  </motion.button>

                  {/* Sky Pay option */}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setPaymentMethod("skypay")}
                    className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                      paymentMethod === "skypay"
                        ? "border-sky-500 bg-sky-50 shadow-sm"
                        : "border-border bg-background hover:border-sky-300 hover:bg-sky-50/50"
                    }`}
                    aria-pressed={paymentMethod === "skypay"}
                    aria-label="Pay with Sky Pay"
                    data-ocid="checkout.skypay.toggle"
                  >
                    {paymentMethod === "skypay" && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-sky-500" />
                    )}
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sky-500 shadow-sm">
                      <Smartphone className="w-4 h-4 text-white" />
                    </div>
                    <span
                      className={`text-xs font-bold tracking-wide ${
                        paymentMethod === "skypay"
                          ? "text-sky-600"
                          : "text-muted-foreground"
                      }`}
                    >
                      SKY PAY
                    </span>
                  </motion.button>
                </div>
              </div>

              {/* Card Payments Section */}
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wide">
                  Card Payment
                </p>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setPaymentMethod("card")}
                  className={`w-full relative flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                    paymentMethod === "card"
                      ? "border-brand-orange bg-orange-50 shadow-sm"
                      : "border-border bg-background hover:border-orange-300 hover:bg-orange-50/50"
                  }`}
                  aria-pressed={paymentMethod === "card"}
                  aria-label="Pay by Card"
                  data-ocid="checkout.card.toggle"
                >
                  {paymentMethod === "card" && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-orange" />
                  )}
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-orange shadow-sm">
                    <CreditCard className="w-4 h-4 text-white" />
                  </div>
                  <span
                    className={`text-xs font-bold tracking-wide ${
                      paymentMethod === "card"
                        ? "text-brand-orange"
                        : "text-muted-foreground"
                    }`}
                  >
                    DEBIT / CREDIT CARD
                  </span>
                </motion.button>
              </div>
            </div>

            {/* Sky Pay UPI Input */}
            {paymentMethod === "skypay" && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="mb-4"
              >
                <Label
                  htmlFor="upi-id"
                  className="text-xs font-semibold text-sky-700 mb-1.5 block"
                >
                  UPI ID
                </Label>
                <Input
                  id="upi-id"
                  placeholder="Enter UPI ID (e.g. name@skypay)"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="border-sky-200 focus-visible:ring-sky-400 text-sm"
                  autoComplete="off"
                  data-ocid="checkout.upi_id.input"
                />
              </motion.div>
            )}

            {/* Google Pay info */}
            {paymentMethod === "googlepay" && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="mb-4 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2"
              >
                <p className="text-xs text-blue-700 font-medium">
                  You will be redirected to Google Pay to complete your payment
                  securely.
                </p>
              </motion.div>
            )}

            {/* Pay Button */}
            {paymentMethod === "googlepay" ? (
              <Button
                className="w-full bg-[#1a73e8] hover:bg-[#1557b0] text-white font-bold h-12 text-base gap-2 transition-colors"
                onClick={() => void handleGooglePay()}
                disabled={isProcessing || placeOrder.isPending}
                data-ocid="checkout.googlepay.primary_button"
              >
                {isProcessing || placeOrder.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Processing...
                  </>
                ) : (
                  <span className="flex items-center gap-2">
                    <GooglePayLogo size={28} />
                    <span>Pay with Google Pay</span>
                  </span>
                )}
              </Button>
            ) : paymentMethod === "skypay" ? (
              <Button
                className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold h-12 text-base gap-2 transition-colors"
                onClick={() => void handleSkyPay()}
                disabled={isProcessing || placeOrder.isPending}
                data-ocid="checkout.skypay.primary_button"
              >
                {isProcessing || placeOrder.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <Smartphone className="w-5 h-5" /> Pay with Sky Pay
                  </>
                )}
              </Button>
            ) : (
              <Button
                className="w-full bg-brand-orange hover:bg-orange-600 text-white font-bold h-12 text-base gap-2"
                onClick={() => void handleCheckout()}
                disabled={isProcessing || createCheckout.isPending}
                data-ocid="checkout.card.primary_button"
              >
                {isProcessing || createCheckout.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" /> Pay via Card
                  </>
                )}
              </Button>
            )}

            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Shield className="w-3 h-3" />
              {paymentMethod === "googlepay"
                ? "Secure payment by Google Pay"
                : paymentMethod === "skypay"
                  ? "Secure payment by Sky Pay"
                  : "Secure payment by Stripe"}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function GooglePaySuccessView({ orderId }: { orderId: string }) {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-20 text-center">
      <div className="max-w-md mx-auto">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          <CheckCircle2 className="w-20 h-20 text-green-600 mx-auto mb-4" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 font-bold text-sm px-3 py-1.5 rounded-full mb-4">
            <GooglePayLogo size={24} />
            Google Pay
          </div>
          <h2 className="font-display font-bold text-2xl mb-2">
            Payment Successful via Google Pay!
          </h2>
          <p className="text-muted-foreground mb-2">Your Order ID:</p>
          <p className="font-mono font-bold text-brand-navy text-sm bg-muted px-3 py-1.5 rounded-lg inline-block mb-6">
            {orderId}
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              className="bg-[#1a73e8] hover:bg-[#1557b0] text-white"
              onClick={() =>
                void navigate({ to: "/order/$orderId", params: { orderId } })
              }
            >
              Track Order
            </Button>
            <Button variant="outline" asChild>
              <Link to="/products" search={{}}>
                Continue Shopping
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function SkyPaySuccessView({ orderId }: { orderId: string }) {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-20 text-center">
      <div className="max-w-md mx-auto">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          <CheckCircle2 className="w-20 h-20 text-green-600 mx-auto mb-4" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="inline-flex items-center gap-2 bg-sky-100 text-sky-700 font-bold text-sm px-3 py-1.5 rounded-full mb-4">
            <Smartphone className="w-4 h-4" />
            Sky Pay
          </div>
          <h2 className="font-display font-bold text-2xl mb-2">
            Payment Successful via Sky Pay!
          </h2>
          <p className="text-muted-foreground mb-2">Your Order ID:</p>
          <p className="font-mono font-bold text-brand-navy text-sm bg-muted px-3 py-1.5 rounded-lg inline-block mb-6">
            {orderId}
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              className="bg-sky-500 hover:bg-sky-600 text-white"
              onClick={() =>
                void navigate({ to: "/order/$orderId", params: { orderId } })
              }
            >
              Track Order
            </Button>
            <Button variant="outline" asChild>
              <Link to="/products" search={{}}>
                Continue Shopping
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function PaymentSuccessView({ sessionId: _sessionId }: { sessionId: string }) {
  const navigate = useNavigate();
  const placeOrder = usePlaceOrder();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);

  const handlePlaceOrder = async () => {
    setPlacing(true);
    try {
      const id = await placeOrder.mutateAsync();
      setOrderId(id);
    } catch {
      toast.error("Failed to place order. Please contact support.");
    } finally {
      setPlacing(false);
    }
  };

  if (orderId) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-md mx-auto">
          <CheckCircle2 className="w-20 h-20 text-green-600 mx-auto mb-4" />
          <h2 className="font-display font-bold text-2xl mb-2">
            Order Placed Successfully!
          </h2>
          <p className="text-muted-foreground mb-2">Your Order ID:</p>
          <p className="font-mono font-bold text-brand-navy text-sm bg-muted px-3 py-1.5 rounded-lg inline-block mb-6">
            {orderId}
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              className="bg-brand-orange hover:bg-orange-600 text-white"
              onClick={() =>
                void navigate({ to: "/order/$orderId", params: { orderId } })
              }
            >
              Track Order
            </Button>
            <Button variant="outline" asChild>
              <Link to="/products" search={{}}>
                Continue Shopping
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-20 text-center">
      <div className="max-w-md mx-auto">
        <CheckCircle2 className="w-20 h-20 text-green-600 mx-auto mb-4" />
        <h2 className="font-display font-bold text-2xl mb-2">
          Payment Successful!
        </h2>
        <p className="text-muted-foreground mb-6">
          Your payment was processed. Click below to confirm your order.
        </p>
        <Button
          className="bg-brand-orange hover:bg-orange-600 text-white font-bold h-12 gap-2 px-8"
          onClick={() => void handlePlaceOrder()}
          disabled={placing}
        >
          {placing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Package className="w-4 h-4" />
          )}
          {placing ? "Placing Order..." : "Confirm Order"}
        </Button>
      </div>
    </div>
  );
}

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
} from "lucide-react";
import { useState } from "react";
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

export function CheckoutPage() {
  const search = useSearch({ from: "/checkout" });
  const sessionId = (search as { session_id?: string }).session_id;

  const { identity, login } = useInternetIdentity();
  const { data: cartItems, isLoading: cartLoading } = useGetCart();
  const { data: cartTotal } = useGetCartTotal();
  const { data: backendProducts } = useGetAllProducts();
  const { data: userProfile } = useGetCallerUserProfile();
  const createCheckout = useCreateCheckoutSession();
  const _placeOrder = usePlaceOrder();

  const { data: stripeStatus } = useGetStripeSessionStatus(sessionId ?? "");

  const allProducts =
    backendProducts && backendProducts.length > 0
      ? backendProducts
      : STATIC_PRODUCTS;

  const [address, setAddress] = useState({
    name: userProfile?.name ?? "",
    phone: userProfile?.phone ?? "",
    street: userProfile?.address ?? "",
    city: "",
    state: "",
    pincode: "",
  });

  const [isProcessing, setIsProcessing] = useState(false);

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

  const handleCheckout = async () => {
    if (
      !address.name ||
      !address.phone ||
      !address.street ||
      !address.city ||
      !address.pincode
    ) {
      toast.error("Please fill in all address fields");
      return;
    }

    setIsProcessing(true);
    try {
      const items: ShoppingItem[] = cartItems.map((item) => {
        const product = allProducts.find((p) => p.id === item.productId);
        return {
          productName: product?.name ?? "Product",
          productDescription: product?.description?.slice(0, 100) ?? "",
          currency: "inr",
          quantity: item.quantity,
          priceInCents: item.price * 100n, // Convert rupees to paise
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

  const subtotal = cartTotal ?? 0n;
  const deliveryCharge = subtotal > 499n ? 0n : 49n;
  const total = subtotal + deliveryCharge;

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
            </div>
            <Separator className="mb-4" />
            <div className="flex justify-between mb-5">
              <span className="font-bold">Total Amount</span>
              <span className="font-display font-bold text-xl">
                {formatPrice(total)}
              </span>
            </div>

            <Button
              className="w-full bg-brand-orange hover:bg-orange-600 text-white font-bold h-12 text-base gap-2"
              onClick={() => void handleCheckout()}
              disabled={isProcessing || createCheckout.isPending}
            >
              {isProcessing || createCheckout.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" /> Pay {formatPrice(total)}
                </>
              )}
            </Button>

            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Shield className="w-3 h-3" />
              Secure payment by Stripe
            </div>
          </div>
        </div>
      </div>
    </main>
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

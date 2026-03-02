import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Loader2,
  Minus,
  Package,
  Plus,
  ShoppingCart,
  Tag,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import type { CartItem, Product } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetAllProducts,
  useGetCart,
  useGetCartTotal,
  useRemoveFromCart,
  useUpdateCartItemQuantity,
} from "../hooks/useQueries";
import {
  STATIC_PRODUCTS,
  formatPrice,
  getProductImage,
} from "../utils/staticData";

export function CartPage() {
  const navigate = useNavigate();
  const { identity, login } = useInternetIdentity();
  const { data: cartItems, isLoading: cartLoading } = useGetCart();
  const { data: cartTotal } = useGetCartTotal();
  const { data: backendProducts } = useGetAllProducts();
  const removeFromCart = useRemoveFromCart();
  const updateQuantity = useUpdateCartItemQuantity();

  const allProducts =
    backendProducts && backendProducts.length > 0
      ? backendProducts
      : STATIC_PRODUCTS;

  const getProduct = (productId: string): Product | undefined => {
    return allProducts.find((p) => p.id === productId);
  };

  const handleRemove = async (productId: string) => {
    try {
      await removeFromCart.mutateAsync(productId);
      toast.success("Item removed from cart");
    } catch {
      toast.error("Failed to remove item");
    }
  };

  const handleUpdateQuantity = async (productId: string, newQty: number) => {
    if (newQty < 1) {
      await handleRemove(productId);
      return;
    }
    try {
      await updateQuantity.mutateAsync({ productId, quantity: BigInt(newQty) });
    } catch {
      toast.error("Failed to update quantity");
    }
  };

  if (!identity) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
        <h2 className="font-display font-bold text-xl mb-2">
          Your cart is empty
        </h2>
        <p className="text-muted-foreground text-sm mb-6">
          Login to view your cart and start shopping
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
        <h1 className="font-display font-bold text-2xl mb-6">Shopping Cart</h1>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  const isEmpty = !cartItems || cartItems.length === 0;

  if (isEmpty) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-sm mx-auto">
          <ShoppingCart className="w-20 h-20 mx-auto text-muted-foreground mb-4 opacity-30" />
          <h2 className="font-display font-bold text-xl mb-2">
            Your cart is empty
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            Looks like you haven't added anything yet. Start shopping!
          </p>
          <Button
            className="bg-brand-orange hover:bg-orange-600 text-white gap-2"
            asChild
          >
            <Link to="/products" search={{}}>
              Continue Shopping <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const subtotal = cartTotal ?? 0n;
  const deliveryCharge = subtotal > 499n ? 0n : 49n;
  const total = subtotal + deliveryCharge;

  return (
    <main className="container mx-auto px-4 py-6">
      <h1 className="font-display font-bold text-2xl mb-6 flex items-center gap-2">
        <ShoppingCart className="w-6 h-6 text-brand-orange" />
        Shopping Cart
        <Badge variant="secondary" className="ml-2">
          {cartItems.length} item{cartItems.length !== 1 ? "s" : ""}
        </Badge>
      </h1>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Cart items */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-2xl border border-border overflow-hidden">
            <AnimatePresence>
              {cartItems.map((item: CartItem, i: number) => {
                const product = getProduct(item.productId);
                if (!product) return null;
                const imageUrl = getProductImage(product);

                return (
                  <motion.div
                    key={item.productId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20, height: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    {i > 0 && <Separator />}
                    <div className="p-4 flex gap-4">
                      {/* Image */}
                      <Link
                        to="/product/$productId"
                        params={{ productId: product.id }}
                        className="flex-shrink-0"
                      >
                        <img
                          src={imageUrl}
                          alt={product.name}
                          className="w-20 h-20 object-cover rounded-lg border border-border"
                        />
                      </Link>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <Link
                          to="/product/$productId"
                          params={{ productId: product.id }}
                          className="font-medium text-sm text-foreground hover:text-brand-orange line-clamp-2 leading-snug"
                        >
                          {product.name}
                        </Link>
                        <p className="text-muted-foreground text-xs mt-0.5 capitalize">
                          {product.category}
                        </p>

                        <div className="flex items-center justify-between mt-2">
                          {/* Price */}
                          <div className="flex items-baseline gap-2">
                            <span className="font-bold text-base text-foreground">
                              {formatPrice(item.price)}
                            </span>
                            {item.price < product.price && (
                              <span className="text-muted-foreground text-xs line-through">
                                {formatPrice(product.price)}
                              </span>
                            )}
                          </div>

                          {/* Quantity controls */}
                          <div className="flex items-center gap-2">
                            <div className="flex items-center border border-border rounded-lg overflow-hidden">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-none"
                                onClick={() =>
                                  void handleUpdateQuantity(
                                    item.productId,
                                    Number(item.quantity) - 1,
                                  )
                                }
                                disabled={updateQuantity.isPending}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="w-8 text-center text-sm font-bold">
                                {Number(item.quantity)}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-none"
                                onClick={() =>
                                  void handleUpdateQuantity(
                                    item.productId,
                                    Number(item.quantity) + 1,
                                  )
                                }
                                disabled={updateQuantity.isPending}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => void handleRemove(item.productId)}
                              disabled={removeFromCart.isPending}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>

                        {/* Line total */}
                        <p className="text-xs text-muted-foreground mt-1">
                          Subtotal:{" "}
                          <span className="font-semibold text-foreground">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Order Summary */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-border p-5 sticky top-20">
            <h2 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5 text-brand-orange" />
              Order Summary
            </h2>
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Subtotal ({cartItems.length} items)
                </span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivery Charges</span>
                <span
                  className={
                    deliveryCharge === 0n
                      ? "text-green-600 font-medium"
                      : "font-medium"
                  }
                >
                  {deliveryCharge === 0n ? "FREE" : formatPrice(deliveryCharge)}
                </span>
              </div>
              {deliveryCharge === 0n && (
                <p className="text-green-600 text-xs bg-green-50 p-2 rounded-lg">
                  🎉 You're saving on delivery!
                </p>
              )}
            </div>
            <Separator className="mb-4" />
            <div className="flex justify-between mb-5">
              <span className="font-bold text-base">Total Amount</span>
              <span className="font-display font-bold text-xl text-foreground">
                {formatPrice(total)}
              </span>
            </div>
            <Button
              className="w-full bg-brand-orange hover:bg-orange-600 text-white font-bold h-12 text-base gap-2"
              onClick={() => void navigate({ to: "/checkout", search: {} })}
            >
              Proceed to Checkout
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Link
              to="/products"
              search={{}}
              className="block text-center text-sm text-brand-orange hover:underline mt-3"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

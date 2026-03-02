import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  Box,
  CheckCircle2,
  Clock,
  MapPin,
  Package,
  Truck,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { OrderStatus } from "../backend.d";
import type { StatusHistory } from "../backend.d";
import { useGetAllProducts, useGetOrder } from "../hooks/useQueries";
import {
  STATIC_PRODUCTS,
  formatPrice,
  getProductImage,
} from "../utils/staticData";

const STATUS_STEPS = [
  { status: OrderStatus.Pending, label: "Order Placed", icon: Package },
  { status: OrderStatus.Confirmed, label: "Confirmed", icon: CheckCircle2 },
  { status: OrderStatus.Processing, label: "Processing", icon: Clock },
  { status: OrderStatus.Shipped, label: "Shipped", icon: Truck },
  {
    status: OrderStatus.OutForDelivery,
    label: "Out for Delivery",
    icon: MapPin,
  },
  { status: OrderStatus.Delivered, label: "Delivered", icon: CheckCircle2 },
];

function getStatusIndex(status: OrderStatus): number {
  if (status === OrderStatus.Cancelled) return -1;
  return STATUS_STEPS.findIndex((s) => s.status === status);
}

export function OrderDetailPage() {
  const { orderId } = useParams({ from: "/order/$orderId" });
  const { data: order, isLoading } = useGetOrder(orderId);
  const { data: backendProducts } = useGetAllProducts();

  const allProducts =
    backendProducts && backendProducts.length > 0
      ? backendProducts
      : STATIC_PRODUCTS;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-24 rounded-xl mb-4" />
        <Skeleton className="h-48 rounded-xl mb-4" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
        <h2 className="font-display font-bold text-xl mb-2">Order not found</h2>
        <Button
          asChild
          className="bg-brand-orange hover:bg-orange-600 text-white"
        >
          <Link to="/orders">My Orders</Link>
        </Button>
      </div>
    );
  }

  const currentStatusIndex = getStatusIndex(order.status);
  const isCancelled = order.status === OrderStatus.Cancelled;
  const orderTotal = order.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0n,
  );

  return (
    <main className="container mx-auto px-4 py-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/orders">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="font-display font-bold text-xl">Order Details</h1>
          <p className="text-muted-foreground text-xs font-mono">#{orderId}</p>
        </div>
        <Badge
          className={`ml-auto font-semibold ${
            isCancelled
              ? "bg-red-100 text-red-700"
              : order.status === OrderStatus.Delivered
                ? "bg-green-100 text-green-700"
                : "bg-blue-100 text-blue-700"
          }`}
          variant="outline"
        >
          {order.status}
        </Badge>
      </div>

      {/* Order tracking timeline */}
      {!isCancelled ? (
        <div className="bg-white rounded-2xl border border-border p-6 mb-6">
          <h2 className="font-display font-bold text-lg mb-6 flex items-center gap-2">
            <Truck className="w-5 h-5 text-brand-orange" />
            Order Tracking
          </h2>
          <div className="relative">
            {/* Progress line */}
            <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-border" />
            <div
              className="absolute left-5 top-6 w-0.5 bg-brand-orange transition-all duration-700"
              style={{
                height: `${Math.max(0, (currentStatusIndex / (STATUS_STEPS.length - 1)) * 100)}%`,
              }}
            />
            <div className="space-y-4">
              {STATUS_STEPS.map((step, i) => {
                const isCompleted = i <= currentStatusIndex;
                const isCurrent = i === currentStatusIndex;
                const historyEntry = order.statusHistory.find(
                  (h: StatusHistory) => h.status === step.status,
                );

                return (
                  <motion.div
                    key={step.status}
                    className="flex items-start gap-4 relative"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 transition-colors ${
                        isCompleted
                          ? isCurrent
                            ? "bg-brand-orange text-white shadow-lg shadow-orange-200"
                            : "bg-green-600 text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <step.icon className="w-4 h-4" />
                    </div>
                    <div className="pt-2">
                      <p
                        className={`font-semibold text-sm ${
                          isCompleted
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {step.label}
                        {isCurrent && (
                          <Badge className="ml-2 bg-brand-orange text-white border-0 text-xs">
                            Current
                          </Badge>
                        )}
                      </p>
                      {historyEntry && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(
                            Number(historyEntry.timestamp) / 1000000,
                          ).toLocaleString("en-IN")}
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6 flex items-center gap-4">
          <XCircle className="w-10 h-10 text-red-600 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-red-800">Order Cancelled</h3>
            <p className="text-red-600 text-sm">
              This order has been cancelled.
            </p>
          </div>
        </div>
      )}

      {/* Order items */}
      <div className="bg-white rounded-2xl border border-border p-6 mb-6">
        <h2 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
          <Box className="w-5 h-5 text-brand-orange" />
          Items Ordered
        </h2>
        <div className="space-y-4">
          {order.items.map((item) => {
            const product = allProducts.find((p) => p.id === item.productId);
            return (
              <div key={item.productId} className="flex items-center gap-4">
                {product ? (
                  <img
                    src={getProductImage(product)}
                    alt={product?.name}
                    className="w-14 h-14 object-cover rounded-lg border border-border"
                  />
                ) : (
                  <div className="w-14 h-14 bg-muted rounded-lg flex items-center justify-center">
                    <Package className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm line-clamp-1">
                    {product?.name ?? item.productId}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Qty: {Number(item.quantity)} × {formatPrice(item.price)}
                  </p>
                </div>
                <span className="font-bold text-sm">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            );
          })}
        </div>
        <Separator className="my-4" />
        <div className="flex justify-between font-bold">
          <span>Total</span>
          <span className="font-display text-lg">
            {formatPrice(orderTotal)}
          </span>
        </div>
      </div>

      {/* Order info */}
      <div className="bg-white rounded-2xl border border-border p-6">
        <h2 className="font-display font-bold text-lg mb-4">
          Order Information
        </h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Order ID</p>
            <p className="font-mono font-medium text-xs mt-0.5">{order.id}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Placed On</p>
            <p className="font-medium mt-0.5">
              {new Date(Number(order.createdAt) / 1000000).toLocaleDateString(
                "en-IN",
                {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                },
              )}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Items</p>
            <p className="font-medium mt-0.5">{order.items.length}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Status</p>
            <p className="font-medium mt-0.5">{order.status}</p>
          </div>
        </div>
      </div>
    </main>
  );
}

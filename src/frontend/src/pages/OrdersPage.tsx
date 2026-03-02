import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  Package,
  Truck,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { OrderStatus } from "../backend.d";
import type { Order } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetAllOrders } from "../hooks/useQueries";
import { formatPrice } from "../utils/staticData";

function getStatusColor(status: OrderStatus): string {
  switch (status) {
    case OrderStatus.Delivered:
      return "bg-green-100 text-green-700 border-green-200";
    case OrderStatus.Cancelled:
      return "bg-red-100 text-red-700 border-red-200";
    case OrderStatus.Shipped:
    case OrderStatus.OutForDelivery:
      return "bg-blue-100 text-blue-700 border-blue-200";
    case OrderStatus.Processing:
    case OrderStatus.Confirmed:
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

function getStatusIcon(status: OrderStatus) {
  switch (status) {
    case OrderStatus.Delivered:
      return <CheckCircle2 className="w-4 h-4" />;
    case OrderStatus.Cancelled:
      return <XCircle className="w-4 h-4" />;
    case OrderStatus.Shipped:
    case OrderStatus.OutForDelivery:
      return <Truck className="w-4 h-4" />;
    default:
      return <Clock className="w-4 h-4" />;
  }
}

export function OrdersPage() {
  const { identity, login } = useInternetIdentity();
  const { data: orders, isLoading } = useGetAllOrders();

  if (!identity) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
        <h2 className="font-display font-bold text-xl mb-2">
          Login to view orders
        </h2>
        <p className="text-muted-foreground mb-6">
          Track and manage your orders after logging in
        </p>
        <Button
          className="bg-brand-orange hover:bg-orange-600 text-white"
          onClick={login}
        >
          Login
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <h1 className="font-display font-bold text-2xl mb-6">My Orders</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const userOrders =
    orders?.filter(
      (o) =>
        identity && o.userId.toString() === identity.getPrincipal().toString(),
    ) ??
    orders ??
    [];

  if (!userOrders || userOrders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-sm mx-auto">
          <Package className="w-20 h-20 mx-auto text-muted-foreground mb-4 opacity-30" />
          <h2 className="font-display font-bold text-xl mb-2">No orders yet</h2>
          <p className="text-muted-foreground text-sm mb-6">
            You haven't placed any orders. Start shopping!
          </p>
          <Button
            className="bg-brand-orange hover:bg-orange-600 text-white"
            asChild
          >
            <Link to="/products" search={{}}>
              Shop Now
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-6">
      <h1 className="font-display font-bold text-2xl mb-6 flex items-center gap-2">
        <Package className="w-6 h-6 text-brand-orange" />
        My Orders
      </h1>

      <div className="space-y-4">
        {userOrders.map((order: Order, i: number) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link to="/order/$orderId" params={{ orderId: order.id }}>
              <div className="bg-white rounded-xl border border-border p-4 hover:border-brand-orange hover:shadow-md transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-xs text-muted-foreground font-mono">
                        #{order.id.slice(0, 16)}...
                      </span>
                      <Badge
                        className={`text-xs font-semibold border gap-1 ${getStatusColor(order.status)}`}
                        variant="outline"
                      >
                        {getStatusIcon(order.status)}
                        {order.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {order.items.length} item
                      {order.items.length !== 1 ? "s" : ""}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Placed on{" "}
                      {new Date(
                        Number(order.createdAt) / 1000000,
                      ).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="font-display font-bold text-base text-foreground">
                        {formatPrice(
                          order.items.reduce(
                            (sum, item) => sum + item.price * item.quantity,
                            0n,
                          ),
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </main>
  );
}

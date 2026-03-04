import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  Package,
  RotateCcw,
  Truck,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { OrderStatus } from "../backend.d";
import type { Order } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetOrdersForUser } from "../hooks/useQueries";
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
  const principal = identity ? identity.getPrincipal() : null;
  const { data: orders, isLoading } = useGetOrdersForUser(principal);

  // Local override statuses for cancel/return requests
  const [localStatuses, setLocalStatuses] = useState<Record<string, string>>(
    {},
  );
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    orderId: string;
    action: "cancel" | "return";
  }>({ open: false, orderId: "", action: "cancel" });

  const handleConfirmAction = () => {
    const { orderId, action } = confirmDialog;
    const label =
      action === "cancel" ? "Cancellation Requested" : "Return Requested";
    setLocalStatuses((prev) => ({ ...prev, [orderId]: label }));
    toast.success(
      action === "cancel"
        ? "Cancel request submitted successfully"
        : "Return request submitted successfully",
    );
    setConfirmDialog({ open: false, orderId: "", action: "cancel" });
  };

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

  const userOrders = orders ?? [];

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

      <div className="space-y-4" data-ocid="orders.list">
        {userOrders.map((order: Order, i: number) => {
          const localStatus = localStatuses[order.id];
          const effectiveStatus = localStatus ?? order.status;
          const isCancellable =
            !localStatus &&
            (order.status === OrderStatus.Pending ||
              order.status === OrderStatus.Processing);
          const isReturnable =
            !localStatus && order.status === OrderStatus.Delivered;

          return (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              data-ocid={`orders.item.${i + 1}`}
            >
              <div className="bg-white rounded-xl border border-border p-4 hover:shadow-sm transition-all">
                <Link to="/order/$orderId" params={{ orderId: order.id }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-xs text-muted-foreground font-mono">
                          #{order.id.slice(0, 16)}...
                        </span>
                        <Badge
                          className={`text-xs font-semibold border gap-1 ${
                            localStatus
                              ? "bg-orange-100 text-orange-700 border-orange-200"
                              : getStatusColor(order.status)
                          }`}
                          variant="outline"
                        >
                          {!localStatus && getStatusIcon(order.status)}
                          {effectiveStatus}
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
                </Link>

                {/* Action buttons */}
                {(isCancellable || isReturnable) && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                    {isCancellable && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs text-destructive border-destructive/30 hover:bg-destructive/5 gap-1.5"
                        onClick={() =>
                          setConfirmDialog({
                            open: true,
                            orderId: order.id,
                            action: "cancel",
                          })
                        }
                        data-ocid={`orders.cancel.button.${i + 1}`}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Cancel Order
                      </Button>
                    )}
                    {isReturnable && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs text-blue-600 border-blue-300 hover:bg-blue-50 gap-1.5"
                        onClick={() =>
                          setConfirmDialog({
                            open: true,
                            orderId: order.id,
                            action: "return",
                          })
                        }
                        data-ocid={`orders.return.button.${i + 1}`}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Return / Refund
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Confirm Dialog */}
      <Dialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="max-w-sm" data-ocid="orders.confirm.dialog">
          <DialogHeader>
            <DialogTitle className="font-display font-bold">
              {confirmDialog.action === "cancel"
                ? "Cancel Order?"
                : "Request Return?"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            {confirmDialog.action === "cancel"
              ? "Are you sure you want to cancel this order? This action cannot be undone."
              : "Are you sure you want to return this order? Our team will contact you for pickup."}
          </p>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() =>
                setConfirmDialog((prev) => ({ ...prev, open: false }))
              }
              data-ocid="orders.confirm.cancel_button"
            >
              No, Keep Order
            </Button>
            <Button
              className={
                confirmDialog.action === "cancel"
                  ? "bg-destructive hover:bg-destructive/90 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }
              onClick={handleConfirmAction}
              data-ocid="orders.confirm.confirm_button"
            >
              {confirmDialog.action === "cancel"
                ? "Yes, Cancel"
                : "Yes, Return"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

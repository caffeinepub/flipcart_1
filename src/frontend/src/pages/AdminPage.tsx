import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  BarChart3,
  Delete,
  Edit3,
  Loader2,
  Lock,
  Package,
  Plus,
  Save,
  Shield,
  ShoppingBag,
  Tag,
  Trash2,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Category, Order, Product, UserEntry } from "../backend.d";
import { OrderStatus } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCreateCategory,
  useCreateProduct,
  useDeleteCategory,
  useDeleteProduct,
  useGetAllOrders,
  useGetAllProducts,
  useGetAllUsers,
  useGetCategories,
  useInitializeFirstAdmin,
  useIsCallerAdmin,
  useSetUserRole,
  useUpdateCategory,
  useUpdateOrderStatus,
  useUpdateProduct,
} from "../hooks/useQueries";
import { STATIC_CATEGORIES, formatPrice } from "../utils/staticData";

const EMPTY_PRODUCT: Product = {
  id: "",
  name: "",
  description: "",
  price: 0n,
  discountedPrice: 0n,
  category: "",
  stockQuantity: 0n,
  rating: 0,
  reviewCount: 0n,
  images: [],
};

const EMPTY_CATEGORY: Category = {
  id: "",
  name: "",
  description: "",
};

// Hardcoded 4-digit admin PIN (can be changed and stored in localStorage)
const DEFAULT_PIN = "0078";
const PIN_STORAGE_KEY = "admin_custom_pin";
const PIN_SESSION_KEY = "admin_pin_verified";
// Backend internal PIN — do not change without updating backend
const BACKEND_SETUP_PIN = "1234";

function getAdminPin(): string {
  return localStorage.getItem(PIN_STORAGE_KEY) || DEFAULT_PIN;
}

function setAdminPin(pin: string): void {
  localStorage.setItem(PIN_STORAGE_KEY, pin);
}

function AdminPinLock({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleDigit = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const newPin = pin.split("");
    newPin[index] = value;
    const joined = newPin.join("").slice(0, 4);
    setPin(joined);
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
    if (joined.length === 4) {
      setTimeout(() => checkPin(joined), 100);
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      setPin((prev) => prev.slice(0, index - 1));
    }
  };

  const checkPin = (enteredPin: string) => {
    if (enteredPin === getAdminPin()) {
      sessionStorage.setItem(PIN_SESSION_KEY, "true");
      onUnlock();
    } else {
      setShake(true);
      setPin("");
      inputRefs.current[0]?.focus();
      setTimeout(() => setShake(false), 600);
      toast.error("Galat PIN! Dobara try karein.");
    }
  };

  // Migrate old PIN "1234" to default "0078"
  useEffect(() => {
    const stored = localStorage.getItem(PIN_STORAGE_KEY);
    if (stored === "1234") {
      localStorage.removeItem(PIN_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  return (
    <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center">
      <motion.div
        className="bg-white border border-border rounded-2xl shadow-lg p-8 w-full max-w-sm text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="w-16 h-16 rounded-full bg-brand-orange/10 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-brand-orange" />
        </div>
        <h2 className="font-display font-bold text-xl mb-1">Admin PIN</h2>
        <p className="text-muted-foreground text-sm mb-6">
          4-digit PIN enter karein Admin Dashboard kholne ke liye
        </p>

        <motion.div
          className="flex justify-center gap-3 mb-6"
          animate={shake ? { x: [-8, 8, -8, 8, -4, 4, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          {[0, 1, 2, 3].map((i) => (
            <input
              key={i}
              ref={(el) => {
                inputRefs.current[i] = el;
              }}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={pin[i] || ""}
              onChange={(e) => handleDigit(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-14 h-14 text-center text-2xl font-bold border-2 rounded-xl outline-none focus:border-brand-orange transition-colors bg-muted/30"
            />
          ))}
        </motion.div>

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-2 max-w-[220px] mx-auto mb-6">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map(
            (key) => (
              <button
                type="button"
                key={key}
                onClick={() => {
                  if (key === "") return;
                  if (key === "⌫") {
                    const newPin = pin.slice(0, -1);
                    setPin(newPin);
                    const focusIdx = Math.max(0, newPin.length);
                    inputRefs.current[focusIdx]?.focus();
                  } else if (pin.length < 4) {
                    const newPin = pin + key;
                    setPin(newPin);
                    if (newPin.length < 4) {
                      inputRefs.current[newPin.length]?.focus();
                    }
                    if (newPin.length === 4) {
                      setTimeout(() => checkPin(newPin), 100);
                    }
                  }
                }}
                className={`h-12 rounded-xl font-semibold text-lg transition-all ${
                  key === ""
                    ? "invisible"
                    : key === "⌫"
                      ? "bg-muted hover:bg-muted/80 text-muted-foreground"
                      : "bg-muted hover:bg-brand-orange hover:text-white active:scale-95"
                }`}
              >
                {key}
              </button>
            ),
          )}
        </div>

        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-brand-orange underline underline-offset-2 transition-colors"
          onClick={() => {
            if (
              confirm(
                "PIN reset karein? Iske baad default PIN '0078' use karna hoga.",
              )
            ) {
              localStorage.removeItem(PIN_STORAGE_KEY);
              sessionStorage.removeItem(PIN_SESSION_KEY);
              toast.success(
                "PIN reset ho gaya! Ab default PIN '0078' use karein.",
              );
              setPin("");
              setTimeout(() => inputRefs.current[0]?.focus(), 100);
            }
          }}
        >
          PIN bhool gaye? Reset karein
        </button>
      </motion.div>
    </div>
  );
}

export function AdminPage() {
  const { identity, login } = useInternetIdentity();
  const { data: isAdmin, isLoading: adminLoading } = useIsCallerAdmin();
  const { data: products, isLoading: productsLoading } = useGetAllProducts();
  const { data: categories, isLoading: categoriesLoading } = useGetCategories();
  const { data: orders, isLoading: ordersLoading } = useGetAllOrders();
  const { data: users, isLoading: usersLoading } = useGetAllUsers();
  const queryClient = useQueryClient();
  const initializeFirstAdmin = useInitializeFirstAdmin();
  const setUserRole = useSetUserRole();

  const [pinVerified, setPinVerified] = useState(
    () => sessionStorage.getItem(PIN_SESSION_KEY) === "true",
  );

  // Migrate old PIN "1234" to default "0078"
  useEffect(() => {
    const stored = localStorage.getItem(PIN_STORAGE_KEY);
    if (stored === "1234") {
      localStorage.removeItem(PIN_STORAGE_KEY);
    }
  }, []);

  // Change PIN dialog state
  const [changePinOpen, setChangePinOpen] = useState(false);
  const [currentPinInput, setCurrentPinInput] = useState("");
  const [newPinInput, setNewPinInput] = useState("");
  const [confirmPinInput, setConfirmPinInput] = useState("");
  const [changePinStep, setChangePinStep] = useState<"verify" | "new">(
    "verify",
  );

  // Claim admin PIN state
  const [claimPin, setClaimPin] = useState("");
  const [claimShake, setClaimShake] = useState(false);
  const claimInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const updateOrderStatus = useUpdateOrderStatus();

  const [productDialog, setProductDialog] = useState<{
    open: boolean;
    product: Product | null;
  }>({
    open: false,
    product: null,
  });
  const [categoryDialog, setCategoryDialog] = useState<{
    open: boolean;
    category: Category | null;
  }>({
    open: false,
    category: null,
  });
  const [productForm, setProductForm] = useState<Product>(EMPTY_PRODUCT);
  const [categoryForm, setCategoryForm] = useState<Category>(EMPTY_CATEGORY);

  if (!identity) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Shield className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
        <h2 className="font-display font-bold text-xl mb-2">
          Admin Access Required
        </h2>
        <Button
          className="bg-brand-orange hover:bg-orange-600 text-white"
          onClick={login}
        >
          Login
        </Button>
      </div>
    );
  }

  if (adminLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!isAdmin) {
    const handleClaimDigit = (index: number, value: string) => {
      if (!/^\d?$/.test(value)) return;
      const newPin = claimPin.split("");
      newPin[index] = value;
      const joined = newPin.join("").slice(0, 4);
      setClaimPin(joined);
      if (value && index < 3) {
        claimInputRefs.current[index + 1]?.focus();
      }
      if (joined.length === 4) {
        setTimeout(() => handleClaimPin(joined), 100);
      }
    };

    const handleClaimKeyDown = (
      index: number,
      e: React.KeyboardEvent<HTMLInputElement>,
    ) => {
      if (e.key === "Backspace" && !claimPin[index] && index > 0) {
        claimInputRefs.current[index - 1]?.focus();
        setClaimPin((prev) => prev.slice(0, index - 1));
      }
    };

    const handleClaimPin = async (enteredPin: string) => {
      if (enteredPin !== getAdminPin()) {
        setClaimShake(true);
        setClaimPin("");
        claimInputRefs.current[0]?.focus();
        setTimeout(() => setClaimShake(false), 600);
        toast.error("Galat PIN! Dobara try karein.");
        return;
      }

      try {
        // First try to initialize as first admin
        await initializeFirstAdmin.mutateAsync(BACKEND_SETUP_PIN);
        // Success — invalidate and refetch
        await queryClient.invalidateQueries({ queryKey: ["isAdmin"] });
        await queryClient.refetchQueries({ queryKey: ["isAdmin"] });
        toast.success("Admin access mil gaya! Dashboard khul raha hai...");
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);

        if (
          message.includes("already") ||
          message.includes("initialized") ||
          message.includes("Admin already")
        ) {
          // Admin already set — this user might already be admin, force refresh
          toast.info("Check kar raha hoon...");
          await queryClient.invalidateQueries({ queryKey: ["isAdmin"] });
          await queryClient.refetchQueries({ queryKey: ["isAdmin"] });
          // Check if the refetch returned true
          const isAdminNow = queryClient.getQueryData<boolean>(["isAdmin"]);
          if (isAdminNow) {
            toast.success("Admin access confirm hua!");
          } else {
            setClaimPin("");
            claimInputRefs.current[0]?.focus();
            toast.error(
              "Pehla admin already set ho gaya hai. Existing admin se access request karein.",
            );
          }
        } else if (message.includes("anonymous")) {
          toast.error("Pehle login karein, phir admin access lein.");
        } else {
          // Unknown error — still try refreshing admin status
          await queryClient.invalidateQueries({ queryKey: ["isAdmin"] });
          await queryClient.refetchQueries({ queryKey: ["isAdmin"] });
          const isAdminNow = queryClient.getQueryData<boolean>(["isAdmin"]);
          if (isAdminNow) {
            toast.success("Admin access confirm hua!");
          } else {
            setClaimPin("");
            claimInputRefs.current[0]?.focus();
            toast.error(`Admin access nahi mila: ${message.slice(0, 80)}`);
          }
        }
      }
    };

    return (
      <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center">
        <motion.div
          className="bg-white border border-border rounded-2xl shadow-lg p-8 w-full max-w-sm text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 rounded-full bg-brand-orange/10 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-brand-orange" />
          </div>
          <h2 className="font-display font-bold text-xl mb-1">Admin Setup</h2>
          <p className="text-muted-foreground text-sm mb-8">
            Pehli baar admin access lene ke liye PIN enter karein. Agar admin
            pehle se hai, toh unse contact karein.
          </p>

          <motion.div
            className="flex justify-center gap-3 mb-6"
            animate={claimShake ? { x: [-8, 8, -8, 8, -4, 4, 0] } : {}}
            transition={{ duration: 0.4 }}
          >
            {[0, 1, 2, 3].map((i) => (
              <input
                key={i}
                ref={(el) => {
                  claimInputRefs.current[i] = el;
                }}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={claimPin[i] || ""}
                onChange={(e) => handleClaimDigit(i, e.target.value)}
                onKeyDown={(e) => handleClaimKeyDown(i, e)}
                className="w-14 h-14 text-center text-2xl font-bold border-2 rounded-xl outline-none focus:border-brand-orange transition-colors bg-muted/30"
                disabled={initializeFirstAdmin.isPending}
              />
            ))}
          </motion.div>

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-2 max-w-[220px] mx-auto mb-6">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map(
              (key) => (
                <button
                  type="button"
                  key={key}
                  disabled={initializeFirstAdmin.isPending}
                  onClick={() => {
                    if (key === "") return;
                    if (key === "⌫") {
                      const newPin = claimPin.slice(0, -1);
                      setClaimPin(newPin);
                      const focusIdx = Math.max(0, newPin.length);
                      claimInputRefs.current[focusIdx]?.focus();
                    } else if (claimPin.length < 4) {
                      const newPin = claimPin + key;
                      setClaimPin(newPin);
                      if (newPin.length < 4) {
                        claimInputRefs.current[newPin.length]?.focus();
                      }
                      if (newPin.length === 4) {
                        setTimeout(() => void handleClaimPin(newPin), 100);
                      }
                    }
                  }}
                  className={`h-12 rounded-xl font-semibold text-lg transition-all ${
                    key === ""
                      ? "invisible"
                      : key === "⌫"
                        ? "bg-muted hover:bg-muted/80 text-muted-foreground"
                        : "bg-muted hover:bg-brand-orange hover:text-white active:scale-95"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {key}
                </button>
              ),
            )}
          </div>

          {initializeFirstAdmin.isPending && (
            <div className="flex items-center justify-center gap-2 text-brand-orange text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Admin access de raha hoon...
            </div>
          )}

          <button
            type="button"
            className="text-sm text-brand-orange underline underline-offset-2 mt-3 block"
            onClick={async () => {
              await queryClient.invalidateQueries({ queryKey: ["isAdmin"] });
              await queryClient.refetchQueries({ queryKey: ["isAdmin"] });
              toast.info("Admin status check ho raha hai...");
            }}
          >
            Pehle se admin hain? Yahan click karein
          </button>

          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-brand-orange underline underline-offset-2 transition-colors mt-2 block"
            onClick={() => {
              if (
                confirm(
                  "PIN reset karein? Iske baad default PIN '0078' use karna hoga.",
                )
              ) {
                localStorage.removeItem(PIN_STORAGE_KEY);
                toast.success(
                  "PIN reset ho gaya! Ab default PIN '0078' use karein.",
                );
                setClaimPin("");
                setTimeout(() => claimInputRefs.current[0]?.focus(), 100);
              }
            }}
          >
            PIN bhool gaye? Reset karein
          </button>

          <Button
            asChild
            variant="ghost"
            className="mt-2 text-muted-foreground text-sm"
          >
            <Link to="/">Wapas Home</Link>
          </Button>
        </motion.div>
      </div>
    );
  }

  // PIN verification
  if (!pinVerified) {
    return <AdminPinLock onUnlock={() => setPinVerified(true)} />;
  }

  // Stats
  const pendingOrders =
    orders?.filter((o) => o.status === OrderStatus.Pending).length ?? 0;

  const openProductDialog = (product: Product | null) => {
    setProductForm(product ?? { ...EMPTY_PRODUCT, id: crypto.randomUUID() });
    setProductDialog({ open: true, product });
  };

  const openCategoryDialog = (category: Category | null) => {
    setCategoryForm(category ?? { ...EMPTY_CATEGORY, id: crypto.randomUUID() });
    setCategoryDialog({ open: true, category });
  };

  const handleSaveProduct = async () => {
    if (!productForm.name || !productForm.category) {
      toast.error("Please fill in required fields");
      return;
    }
    try {
      if (productDialog.product) {
        await updateProduct.mutateAsync(productForm);
        toast.success("Product updated!");
      } else {
        await createProduct.mutateAsync(productForm);
        toast.success("Product created!");
      }
      setProductDialog({ open: false, product: null });
    } catch {
      toast.error("Failed to save product");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    try {
      await deleteProduct.mutateAsync(id);
      toast.success("Product deleted");
    } catch {
      toast.error("Failed to delete product");
    }
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.name) {
      toast.error("Category name is required");
      return;
    }
    try {
      if (categoryDialog.category) {
        await updateCategory.mutateAsync(categoryForm);
        toast.success("Category updated!");
      } else {
        await createCategory.mutateAsync(categoryForm);
        toast.success("Category created!");
      }
      setCategoryDialog({ open: false, category: null });
    } catch {
      toast.error("Failed to save category");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    try {
      await deleteCategory.mutateAsync(id);
      toast.success("Category deleted");
    } catch {
      toast.error("Failed to delete category");
    }
  };

  const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await updateOrderStatus.mutateAsync({ orderId, newStatus: status });
      toast.success("Order status updated!");
    } catch {
      toast.error("Failed to update status");
    }
  };

  return (
    <main className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl flex items-center gap-2">
            <Shield className="w-6 h-6 text-brand-orange" />
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage products, categories, and orders
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2 text-sm"
          onClick={() => {
            setCurrentPinInput("");
            setNewPinInput("");
            setConfirmPinInput("");
            setChangePinStep("verify");
            setChangePinOpen(true);
          }}
        >
          <Lock className="w-4 h-4" />
          PIN Reset
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          {
            label: "Total Products",
            value: products?.length ?? 0,
            icon: Package,
            color: "text-blue-600 bg-blue-50",
          },
          {
            label: "Categories",
            value: (categories?.length ?? 0) || STATIC_CATEGORIES.length,
            icon: Tag,
            color: "text-purple-600 bg-purple-50",
          },
          {
            label: "Total Orders",
            value: orders?.length ?? 0,
            icon: ShoppingBag,
            color: "text-green-600 bg-green-50",
          },
          {
            label: "Pending Orders",
            value: pendingOrders,
            icon: TrendingUp,
            color: "text-orange-600 bg-orange-50",
          },
          {
            label: "Total Users",
            value: users?.length ?? 0,
            icon: Users,
            color: "text-teal-600 bg-teal-50",
          },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-border p-4"
          >
            <div
              className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center mb-3`}
            >
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="font-display font-bold text-2xl">{stat.value}</p>
            <p className="text-muted-foreground text-xs mt-0.5">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Main tabs */}
      <Tabs defaultValue="products">
        <TabsList className="mb-6">
          <TabsTrigger value="products">
            <Package className="w-4 h-4 mr-2" /> Products
          </TabsTrigger>
          <TabsTrigger value="categories">
            <Tag className="w-4 h-4 mr-2" /> Categories
          </TabsTrigger>
          <TabsTrigger value="orders">
            <ShoppingBag className="w-4 h-4 mr-2" /> Orders
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="w-4 h-4 mr-2" /> Users
          </TabsTrigger>
        </TabsList>

        {/* Products tab */}
        <TabsContent value="products">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-lg">Products</h2>
            <Button
              className="bg-brand-orange hover:bg-orange-600 text-white gap-2"
              onClick={() => openProductDialog(null)}
            >
              <Plus className="w-4 h-4" /> Add Product
            </Button>
          </div>

          {productsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : !products || products.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-border">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-30" />
              <p className="text-muted-foreground text-sm mb-4">
                No products yet
              </p>
              <Button
                className="bg-brand-orange hover:bg-orange-600 text-white gap-2"
                onClick={() => openProductDialog(null)}
              >
                <Plus className="w-4 h-4" /> Create First Product
              </Button>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                      Product
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">
                      Category
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                      Price
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden sm:table-cell">
                      Stock
                    </th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <p className="font-medium line-clamp-1">
                          {product.name}
                        </p>
                        <p className="text-muted-foreground text-xs font-mono mt-0.5">
                          {product.id.slice(0, 8)}...
                        </p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <Badge variant="secondary" className="capitalize">
                          {product.category}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        {formatPrice(product.discountedPrice)}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <Badge
                          className={
                            Number(product.stockQuantity) > 0
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }
                          variant="outline"
                        >
                          {Number(product.stockQuantity)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openProductDialog(product)}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => void handleDeleteProduct(product.id)}
                            disabled={deleteProduct.isPending}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* Categories tab */}
        <TabsContent value="categories">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-lg">Categories</h2>
            <Button
              className="bg-brand-orange hover:bg-orange-600 text-white gap-2"
              onClick={() => openCategoryDialog(null)}
            >
              <Plus className="w-4 h-4" /> Add Category
            </Button>
          </div>

          {categoriesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(categories && categories.length > 0
                ? categories
                : STATIC_CATEGORIES
              ).map((cat) => (
                <div
                  key={cat.id}
                  className="bg-white rounded-xl border border-border p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-base">{cat.name}</h3>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openCategoryDialog(cat)}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => void handleDeleteCategory(cat.id)}
                        disabled={deleteCategory.isPending}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm line-clamp-2">
                    {cat.description}
                  </p>
                  <p className="text-xs font-mono text-muted-foreground mt-2">
                    {cat.id}
                  </p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Orders tab */}
        <TabsContent value="orders">
          <h2 className="font-display font-semibold text-lg mb-4">
            All Orders
          </h2>
          {ordersLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : !orders || orders.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-border">
              <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-30" />
              <p className="text-muted-foreground text-sm">No orders yet</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                      Order ID
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">
                      Items
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                      Total
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                      Status
                    </th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">
                      Update Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orders.map((order: Order) => (
                    <tr key={order.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <Link
                          to="/order/$orderId"
                          params={{ orderId: order.id }}
                          className="font-mono text-xs text-brand-orange hover:underline"
                        >
                          #{order.id.slice(0, 12)}...
                        </Link>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(
                            Number(order.createdAt) / 1000000,
                          ).toLocaleDateString("en-IN")}
                        </p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                        {order.items.length} item
                        {order.items.length !== 1 ? "s" : ""}
                      </td>
                      <td className="px-4 py-3 font-bold">
                        {formatPrice(
                          order.items.reduce(
                            (s, i) => s + i.price * i.quantity,
                            0n,
                          ),
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={
                            order.status === OrderStatus.Delivered
                              ? "bg-green-100 text-green-700"
                              : order.status === OrderStatus.Cancelled
                                ? "bg-red-100 text-red-700"
                                : "bg-blue-100 text-blue-700"
                          }
                        >
                          {order.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <Select
                            value={order.status}
                            onValueChange={(v) =>
                              void handleUpdateStatus(
                                order.id,
                                v as OrderStatus,
                              )
                            }
                          >
                            <SelectTrigger className="w-36 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.values(OrderStatus).map((s) => (
                                <SelectItem
                                  key={s}
                                  value={s}
                                  className="text-xs"
                                >
                                  {s}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* Users tab */}
        <TabsContent value="users">
          <h2 className="font-display font-semibold text-lg mb-4">
            User Management
          </h2>
          {usersLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : !users || users.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-border">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-30" />
              <p className="text-muted-foreground text-sm">No users found</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                      User (Principal)
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">
                      Name
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">
                      Email
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">
                      Phone
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                      Role
                    </th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((entry: UserEntry) => {
                    const principalStr = entry.principal.toString();
                    const isSelf =
                      identity?.getPrincipal().toString() === principalStr;
                    const isEntryAdmin = entry.role === "admin";
                    const isRolePending =
                      setUserRole.isPending &&
                      setUserRole.variables?.targetUser.toString() ===
                        principalStr;
                    return (
                      <tr key={principalStr} className="hover:bg-muted/50">
                        <td className="px-4 py-3">
                          <p className="font-mono text-xs text-muted-foreground">
                            {principalStr.slice(0, 16)}...
                          </p>
                          {isSelf && (
                            <span className="text-[10px] font-semibold text-brand-orange">
                              (You)
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <p className="font-medium">
                            {entry.profile?.name || (
                              <span className="text-muted-foreground italic">
                                —
                              </span>
                            )}
                          </p>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
                          {entry.profile?.email || "—"}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
                          {entry.profile?.phone || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className={
                              isEntryAdmin
                                ? "bg-orange-100 text-orange-700 border-orange-200"
                                : "bg-muted text-muted-foreground border-border"
                            }
                          >
                            {entry.role}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end">
                            {isSelf ? (
                              <span className="text-xs text-muted-foreground italic px-2">
                                Cannot change own role
                              </span>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className={
                                  isEntryAdmin
                                    ? "text-xs h-7 border-red-200 text-red-600 hover:bg-red-50"
                                    : "text-xs h-7 border-teal-200 text-teal-700 hover:bg-teal-50"
                                }
                                disabled={isRolePending}
                                onClick={async () => {
                                  const newRole = isEntryAdmin
                                    ? "user"
                                    : "admin";
                                  try {
                                    await setUserRole.mutateAsync({
                                      targetUser: entry.principal,
                                      newRole,
                                    });
                                    toast.success(
                                      `${entry.profile?.name || principalStr.slice(0, 8)} ab ${newRole} hai`,
                                    );
                                  } catch {
                                    toast.error("Role update nahi hua");
                                  }
                                }}
                              >
                                {isRolePending ? (
                                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                ) : null}
                                {isEntryAdmin ? "Remove Admin" : "Make Admin"}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Product Dialog */}
      <Dialog
        open={productDialog.open}
        onOpenChange={(open) =>
          setProductDialog({ open, product: productDialog.product })
        }
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display font-bold">
              {productDialog.product ? "Edit Product" : "Add New Product"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Product Name *</Label>
              <Input
                value={productForm.name}
                onChange={(e) =>
                  setProductForm({ ...productForm, name: e.target.value })
                }
                placeholder="e.g. Samsung Galaxy S24"
              />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Description *</Label>
              <Textarea
                value={productForm.description}
                onChange={(e) =>
                  setProductForm({
                    ...productForm,
                    description: e.target.value,
                  })
                }
                rows={3}
                placeholder="Product description..."
                className="resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Category *</Label>
              <Select
                value={productForm.category}
                onValueChange={(v) =>
                  setProductForm({ ...productForm, category: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {(categories && categories.length > 0
                    ? categories
                    : STATIC_CATEGORIES
                  ).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Stock Quantity *</Label>
              <Input
                type="number"
                min="0"
                value={Number(productForm.stockQuantity)}
                onChange={(e) =>
                  setProductForm({
                    ...productForm,
                    stockQuantity: BigInt(e.target.value || "0"),
                  })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>MRP (₹) *</Label>
              <Input
                type="number"
                min="0"
                value={Number(productForm.price)}
                onChange={(e) =>
                  setProductForm({
                    ...productForm,
                    price: BigInt(e.target.value || "0"),
                  })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Sale Price (₹) *</Label>
              <Input
                type="number"
                min="0"
                value={Number(productForm.discountedPrice)}
                onChange={(e) =>
                  setProductForm({
                    ...productForm,
                    discountedPrice: BigInt(e.target.value || "0"),
                  })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Rating (0-5)</Label>
              <Input
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={productForm.rating}
                onChange={(e) =>
                  setProductForm({
                    ...productForm,
                    rating: Number.parseFloat(e.target.value || "0"),
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setProductDialog({ open: false, product: null })}
            >
              Cancel
            </Button>
            <Button
              className="bg-brand-orange hover:bg-orange-600 text-white gap-2"
              onClick={() => void handleSaveProduct()}
              disabled={createProduct.isPending || updateProduct.isPending}
            >
              {createProduct.isPending || updateProduct.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change PIN Dialog */}
      <Dialog open={changePinOpen} onOpenChange={setChangePinOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display font-bold flex items-center gap-2">
              <Lock className="w-5 h-5 text-brand-orange" />
              Admin PIN Reset
            </DialogTitle>
          </DialogHeader>
          {changePinStep === "verify" ? (
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">
                Pehle apna current PIN enter karein verify karne ke liye.
              </p>
              <div className="space-y-1.5">
                <Label>Current PIN</Label>
                <Input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="••••"
                  value={currentPinInput}
                  onChange={(e) =>
                    setCurrentPinInput(
                      e.target.value.replace(/\D/g, "").slice(0, 4),
                    )
                  }
                  className="text-center text-xl tracking-widest"
                />
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setChangePinOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-brand-orange hover:bg-orange-600 text-white"
                  onClick={() => {
                    if (currentPinInput === getAdminPin()) {
                      setChangePinStep("new");
                    } else {
                      toast.error("Galat PIN! Dobara try karein.");
                      setCurrentPinInput("");
                    }
                  }}
                  disabled={currentPinInput.length !== 4}
                >
                  Verify
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">
                Naya 4-digit PIN set karein.
              </p>
              <div className="space-y-1.5">
                <Label>New PIN</Label>
                <Input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="••••"
                  value={newPinInput}
                  onChange={(e) =>
                    setNewPinInput(
                      e.target.value.replace(/\D/g, "").slice(0, 4),
                    )
                  }
                  className="text-center text-xl tracking-widest"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Confirm New PIN</Label>
                <Input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="••••"
                  value={confirmPinInput}
                  onChange={(e) =>
                    setConfirmPinInput(
                      e.target.value.replace(/\D/g, "").slice(0, 4),
                    )
                  }
                  className="text-center text-xl tracking-widest"
                />
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setChangePinStep("verify")}
                >
                  Back
                </Button>
                <Button
                  className="bg-brand-orange hover:bg-orange-600 text-white"
                  onClick={() => {
                    if (newPinInput.length !== 4) {
                      toast.error("PIN exactly 4 digits ka hona chahiye.");
                      return;
                    }
                    if (newPinInput !== confirmPinInput) {
                      toast.error("Dono PINs match nahi karte!");
                      setConfirmPinInput("");
                      return;
                    }
                    setAdminPin(newPinInput);
                    sessionStorage.removeItem(PIN_SESSION_KEY);
                    toast.success(
                      "PIN successfully badal gaya! Next time naya PIN use karein.",
                    );
                    setChangePinOpen(false);
                  }}
                  disabled={
                    newPinInput.length !== 4 || confirmPinInput.length !== 4
                  }
                >
                  Save New PIN
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog
        open={categoryDialog.open}
        onOpenChange={(open) =>
          setCategoryDialog({ open, category: categoryDialog.category })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display font-bold">
              {categoryDialog.category ? "Edit Category" : "Add New Category"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label>Category Name *</Label>
              <Input
                value={categoryForm.name}
                onChange={(e) =>
                  setCategoryForm({ ...categoryForm, name: e.target.value })
                }
                placeholder="e.g. Electronics"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={categoryForm.description}
                onChange={(e) =>
                  setCategoryForm({
                    ...categoryForm,
                    description: e.target.value,
                  })
                }
                rows={2}
                placeholder="Category description..."
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCategoryDialog({ open: false, category: null })}
            >
              Cancel
            </Button>
            <Button
              className="bg-brand-orange hover:bg-orange-600 text-white gap-2"
              onClick={() => void handleSaveCategory()}
              disabled={createCategory.isPending || updateCategory.isPending}
            >
              {createCategory.isPending || updateCategory.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

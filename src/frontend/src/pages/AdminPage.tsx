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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  BarChart3,
  Edit3,
  Eye,
  EyeOff,
  Image,
  ImagePlus,
  Loader2,
  Lock,
  Megaphone,
  Package,
  Plus,
  Save,
  Shield,
  ShoppingBag,
  Tag,
  Trash2,
  TrendingUp,
  Upload,
  Users,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
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

// Banner types
const BANNERS_STORAGE_KEY = "shopexpo_banners";

interface Banner {
  id: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  color: string;
  imageUrl?: string;
  active: boolean;
  position: "hero" | "category" | "promo";
}

const BANNER_COLOR_OPTIONS = [
  { value: "from-brand-navy via-blue-900 to-indigo-900", label: "Navy Blue" },
  {
    value: "from-orange-900 via-orange-800 to-amber-900",
    label: "Deep Orange",
  },
  {
    value: "from-emerald-900 via-teal-900 to-cyan-900",
    label: "Emerald Green",
  },
  {
    value: "from-purple-900 via-violet-900 to-indigo-900",
    label: "Royal Purple",
  },
  { value: "from-red-900 via-rose-900 to-pink-900", label: "Crimson Red" },
  { value: "from-gray-900 via-slate-800 to-zinc-900", label: "Charcoal" },
];

const EMPTY_BANNER: Omit<Banner, "id"> = {
  title: "",
  subtitle: "",
  buttonText: "Shop Now",
  buttonLink: "/products",
  color: BANNER_COLOR_OPTIONS[0].value,
  imageUrl: "",
  active: true,
  position: "hero",
};

function getBannersFromStorage(): Banner[] {
  try {
    const stored = localStorage.getItem(BANNERS_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as Banner[];
    // Migrate old banners: set defaults for new fields
    return parsed.map((b) => ({
      ...b,
      active: b.active !== undefined ? b.active : true,
      position: b.position !== undefined ? b.position : ("hero" as const),
      imageUrl: b.imageUrl !== undefined ? b.imageUrl : "",
    }));
  } catch {
    return [];
  }
}

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
  const {
    data: products,
    isLoading: productsLoading,
    isError: productsError,
  } = useGetAllProducts();
  const { data: categories, isLoading: categoriesLoading } = useGetCategories();
  const {
    data: orders,
    isLoading: ordersLoading,
    isError: ordersError,
  } = useGetAllOrders();
  const {
    data: users,
    isLoading: usersLoading,
    isError: usersError,
  } = useGetAllUsers();
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
  // Image preview URLs for newly selected files (object URLs) and existing images (ExternalBlob URLs)
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);

  // Banner state
  const [banners, setBanners] = useState<Banner[]>(() =>
    getBannersFromStorage(),
  );
  const [bannerDialog, setBannerDialog] = useState<{
    open: boolean;
    banner: Banner | null;
  }>({ open: false, banner: null });
  const [bannerForm, setBannerForm] =
    useState<Omit<Banner, "id">>(EMPTY_BANNER);

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
        // Try to initialize as first admin (returns true if caller is/becomes admin)
        const result =
          await initializeFirstAdmin.mutateAsync(BACKEND_SETUP_PIN);
        // result === true means caller is now admin
        if (result) {
          toast.success("Admin access mil gaya! Dashboard khul raha hai...");
          await new Promise((resolve) => setTimeout(resolve, 1200));
          await queryClient.invalidateQueries({ queryKey: ["isAdmin"] });
          await queryClient.refetchQueries({ queryKey: ["isAdmin"] });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);

        if (
          message.includes("already") ||
          message.includes("initialized") ||
          message.includes("Admin already")
        ) {
          // Admin already initialized — check if this user is already admin
          toast.info("Admin status check ho raha hai...");
          await queryClient.invalidateQueries({ queryKey: ["isAdmin"] });
          await queryClient.refetchQueries({ queryKey: ["isAdmin"] });
          // Wait for refetch to settle
          await new Promise((resolve) => setTimeout(resolve, 1500));
          const isAdminNow = queryClient.getQueryData<boolean>(["isAdmin"]);
          if (isAdminNow) {
            toast.success("Admin access confirm hua!");
          } else {
            setClaimPin("");
            claimInputRefs.current[0]?.focus();
            toast.info(
              "Neeche 'Pehle se admin hain?' button click karein ya existing admin se access request karein.",
            );
          }
        } else if (message.includes("anonymous")) {
          toast.error("Pehle login karein, phir admin access lein.");
        } else {
          // Unknown error — still try refreshing admin status
          await queryClient.invalidateQueries({ queryKey: ["isAdmin"] });
          await queryClient.refetchQueries({ queryKey: ["isAdmin"] });
          await new Promise((resolve) => setTimeout(resolve, 1500));
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
            Admin PIN{" "}
            <span className="font-mono font-semibold text-brand-orange">
              0078
            </span>{" "}
            enter karein. Agar pehla admin ho to yahi PIN use hoga.
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
              toast.info("Admin status check ho raha hai...");
              await new Promise((resolve) => setTimeout(resolve, 800));
              await queryClient.invalidateQueries({ queryKey: ["isAdmin"] });
              await queryClient.refetchQueries({ queryKey: ["isAdmin"] });
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
  const activeBanners = banners.filter((b) => b.active !== false).length;

  const openProductDialog = (product: Product | null) => {
    const form = product ?? { ...EMPTY_PRODUCT, id: crypto.randomUUID() };
    setProductForm(form);
    // Build preview URLs for existing product images
    if (product?.images && product.images.length > 0) {
      const previews = product.images
        .filter((img) => img.length > 0)
        .map((img) =>
          ExternalBlob.fromBytes(img as Uint8Array<ArrayBuffer>).getDirectURL(),
        );
      setImagePreviewUrls(previews);
    } else {
      setImagePreviewUrls([]);
    }
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
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
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
          {
            label: "Active Banners",
            value: activeBanners,
            icon: Megaphone,
            color: "text-pink-600 bg-pink-50",
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
        <TabsList className="mb-6 flex-wrap h-auto">
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
          <TabsTrigger value="analytics">
            <BarChart3 className="w-4 h-4 mr-2" /> Analytics
          </TabsTrigger>
          <TabsTrigger value="banners">
            <Image className="w-4 h-4 mr-2" /> Banners
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
          ) : productsError ? (
            <div
              data-ocid="products.error_state"
              className="text-center py-16 bg-white rounded-xl border border-red-200"
            >
              <Package className="w-12 h-12 mx-auto text-red-400 mb-3 opacity-50" />
              <p className="text-red-600 text-sm font-medium mb-1">
                Products load nahi ho sake
              </p>
              <p className="text-muted-foreground text-xs">
                Page refresh karein ya thodi der baad try karein
              </p>
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
                  {(products ?? []).map((product) => (
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
          ) : ordersError ? (
            <div
              data-ocid="orders.error_state"
              className="text-center py-16 bg-white rounded-xl border border-red-200"
            >
              <ShoppingBag className="w-12 h-12 mx-auto text-red-400 mb-3 opacity-50" />
              <p className="text-red-600 text-sm font-medium mb-1">
                Orders load nahi ho sake
              </p>
              <p className="text-muted-foreground text-xs">
                Page refresh karein ya thodi der baad try karein
              </p>
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
                  {(orders ?? []).map((order: Order) => (
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
          ) : usersError ? (
            <div
              data-ocid="users.error_state"
              className="text-center py-16 bg-white rounded-xl border border-red-200"
            >
              <Users className="w-12 h-12 mx-auto text-red-400 mb-3 opacity-50" />
              <p className="text-red-600 text-sm font-medium mb-1">
                Users load nahi ho sake
              </p>
              <p className="text-muted-foreground text-xs">
                Page refresh karein ya thodi der baad try karein
              </p>
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
                  {(users ?? []).map((entry: UserEntry) => {
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
        {/* Analytics tab */}
        <TabsContent value="analytics">
          <h2 className="font-display font-semibold text-lg mb-6">
            Sales Analytics
          </h2>
          {ordersLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))}
            </div>
          ) : (
            <>
              {/* KPI cards */}
              {(() => {
                const allOrders = orders ?? [];
                const totalRevenue = allOrders.reduce(
                  (sum, o) =>
                    sum +
                    o.items.reduce((s, i) => s + i.price * i.quantity, 0n),
                  0n,
                );
                const avgOrderValue =
                  allOrders.length > 0
                    ? totalRevenue / BigInt(allOrders.length)
                    : 0n;

                const statusCounts = {
                  Pending: 0,
                  Processing: 0,
                  Shipped: 0,
                  Delivered: 0,
                  Cancelled: 0,
                };
                for (const o of allOrders) {
                  const s = o.status as string;
                  if (s in statusCounts) {
                    statusCounts[s as keyof typeof statusCounts]++;
                  }
                }

                // Top 5 products by order count
                const productCounts: Record<string, number> = {};
                for (const o of allOrders) {
                  for (const item of o.items) {
                    productCounts[item.productId] =
                      (productCounts[item.productId] ?? 0) +
                      Number(item.quantity);
                  }
                }
                const topProducts = Object.entries(productCounts)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([productId, count]) => ({
                    productId,
                    count,
                    name:
                      products?.find((p) => p.id === productId)?.name ??
                      `${productId.slice(0, 12)}...`,
                  }));

                return (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                      {[
                        {
                          label: "Total Revenue",
                          value: formatPrice(totalRevenue),
                          icon: TrendingUp,
                          color: "text-green-600 bg-green-50",
                        },
                        {
                          label: "Total Orders",
                          value: allOrders.length,
                          icon: ShoppingBag,
                          color: "text-blue-600 bg-blue-50",
                        },
                        {
                          label: "Avg Order Value",
                          value: formatPrice(avgOrderValue),
                          icon: BarChart3,
                          color: "text-purple-600 bg-purple-50",
                        },
                      ].map((stat) => (
                        <div
                          key={stat.label}
                          className="bg-white rounded-xl border border-border p-5"
                        >
                          <div
                            className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center mb-3`}
                          >
                            <stat.icon className="w-5 h-5" />
                          </div>
                          <p className="font-display font-bold text-xl">
                            {stat.value}
                          </p>
                          <p className="text-muted-foreground text-xs mt-0.5">
                            {stat.label}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Orders by status */}
                      <div className="bg-white rounded-xl border border-border p-5">
                        <h3 className="font-display font-semibold text-base mb-4">
                          Orders by Status
                        </h3>
                        <div className="space-y-3">
                          {Object.entries(statusCounts).map(
                            ([status, count]) => {
                              const colors: Record<string, string> = {
                                Pending: "bg-gray-100 text-gray-700",
                                Processing: "bg-yellow-100 text-yellow-700",
                                Shipped: "bg-blue-100 text-blue-700",
                                Delivered: "bg-green-100 text-green-700",
                                Cancelled: "bg-red-100 text-red-700",
                              };
                              return (
                                <div
                                  key={status}
                                  className="flex items-center justify-between"
                                >
                                  <span
                                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${colors[status] ?? "bg-muted text-muted-foreground"}`}
                                  >
                                    {status}
                                  </span>
                                  <span className="font-bold text-sm">
                                    {count}
                                  </span>
                                </div>
                              );
                            },
                          )}
                        </div>
                      </div>

                      {/* Top products */}
                      <div className="bg-white rounded-xl border border-border p-5">
                        <h3 className="font-display font-semibold text-base mb-4">
                          Top 5 Products
                        </h3>
                        {topProducts.length === 0 ? (
                          <p className="text-muted-foreground text-sm">
                            No order data yet
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {topProducts.map((p, i) => (
                              <div
                                key={p.productId}
                                className="flex items-center gap-3"
                              >
                                <span className="w-6 h-6 rounded-full bg-brand-orange text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                                  {i + 1}
                                </span>
                                <span className="flex-1 text-sm line-clamp-1">
                                  {p.name}
                                </span>
                                <span className="text-xs font-bold text-muted-foreground">
                                  {p.count} sold
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                );
              })()}
            </>
          )}
        </TabsContent>

        {/* Banners tab */}
        <TabsContent value="banners">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display font-semibold text-lg">
                Banner / Ads Management
              </h2>
              <p className="text-muted-foreground text-xs mt-0.5">
                Homepage hero banners, category banners, aur promotional strips
                manage karein
              </p>
            </div>
            <Button
              data-ocid="banners.add_button"
              className="bg-brand-orange hover:bg-orange-600 text-white gap-2"
              onClick={() => {
                setBannerForm({ ...EMPTY_BANNER });
                setBannerDialog({ open: true, banner: null });
              }}
            >
              <Plus className="w-4 h-4" /> Add Banner
            </Button>
          </div>

          {banners.length === 0 ? (
            <div
              data-ocid="banners.empty_state"
              className="text-center py-16 bg-white rounded-xl border border-border"
            >
              <Megaphone className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-30" />
              <p className="text-muted-foreground text-sm mb-4">
                No banners yet. Add a banner to customize the homepage hero.
              </p>
              <Button
                className="bg-brand-orange hover:bg-orange-600 text-white gap-2"
                onClick={() => {
                  setBannerForm({ ...EMPTY_BANNER });
                  setBannerDialog({ open: true, banner: null });
                }}
              >
                <Plus className="w-4 h-4" /> Create First Banner
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {banners.map((banner, idx) => {
                const positionColors: Record<string, string> = {
                  hero: "bg-blue-100 text-blue-700",
                  category: "bg-purple-100 text-purple-700",
                  promo: "bg-amber-100 text-amber-700",
                };
                const positionLabels: Record<string, string> = {
                  hero: "Hero Carousel",
                  category: "Category Banner",
                  promo: "Promotional Strip",
                };
                return (
                  <div
                    key={banner.id}
                    data-ocid={`banners.item.${idx + 1}`}
                    className="bg-white rounded-xl border border-border overflow-hidden flex items-stretch"
                  >
                    {/* Left thumbnail */}
                    <div className="w-20 md:w-28 flex-shrink-0 relative">
                      {banner.imageUrl ? (
                        <img
                          src={banner.imageUrl}
                          alt={banner.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className={`w-full h-full bg-gradient-to-br ${banner.color} min-h-[72px]`}
                        />
                      )}
                    </div>

                    {/* Info middle */}
                    <div className="flex-1 min-w-0 px-4 py-3 flex flex-col justify-center gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-display font-bold text-sm line-clamp-1">
                          {banner.title || "Untitled"}
                        </p>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${positionColors[banner.position] ?? "bg-muted text-muted-foreground"}`}
                        >
                          {positionLabels[banner.position] ?? banner.position}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${banner.active !== false ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                        >
                          {banner.active !== false ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-xs line-clamp-1">
                        {banner.subtitle}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        <span className="font-medium">{banner.buttonText}</span>{" "}
                        → {banner.buttonLink}
                      </p>
                    </div>

                    {/* Actions right */}
                    <div className="flex items-center gap-1 px-3 flex-shrink-0">
                      {/* Quick toggle active */}
                      <Button
                        size="icon"
                        variant="ghost"
                        data-ocid={`banners.toggle.${idx + 1}`}
                        className={`h-8 w-8 ${banner.active !== false ? "text-green-600 hover:text-green-700 hover:bg-green-50" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"}`}
                        title={
                          banner.active !== false
                            ? "Deactivate banner"
                            : "Activate banner"
                        }
                        onClick={() => {
                          const updated = banners.map((b) =>
                            b.id === banner.id
                              ? {
                                  ...b,
                                  active: b.active === false,
                                }
                              : b,
                          );
                          setBanners(updated);
                          localStorage.setItem(
                            BANNERS_STORAGE_KEY,
                            JSON.stringify(updated),
                          );
                          window.dispatchEvent(new Event("storage"));
                          toast.success(
                            banner.active !== false
                              ? "Banner deactivated"
                              : "Banner activated",
                          );
                        }}
                      >
                        {banner.active !== false ? (
                          <Eye className="w-3.5 h-3.5" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        data-ocid={`banners.edit_button.${idx + 1}`}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setBannerForm({
                            title: banner.title,
                            subtitle: banner.subtitle,
                            buttonText: banner.buttonText,
                            buttonLink: banner.buttonLink,
                            color: banner.color,
                            imageUrl: banner.imageUrl ?? "",
                            active: banner.active !== false,
                            position: banner.position ?? "hero",
                          });
                          setBannerDialog({ open: true, banner });
                        }}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        data-ocid={`banners.delete_button.${idx + 1}`}
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-red-50"
                        onClick={() => {
                          if (!confirm("Delete this banner?")) return;
                          const updated = banners.filter(
                            (b) => b.id !== banner.id,
                          );
                          setBanners(updated);
                          localStorage.setItem(
                            BANNERS_STORAGE_KEY,
                            JSON.stringify(updated),
                          );
                          window.dispatchEvent(new Event("storage"));
                          toast.success("Banner deleted");
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Banner Dialog */}
      <Dialog
        open={bannerDialog.open}
        onOpenChange={(open) =>
          setBannerDialog({ open, banner: bannerDialog.banner })
        }
      >
        <DialogContent
          className="max-w-lg max-h-[90vh] overflow-y-auto"
          data-ocid="banners.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display font-bold">
              {bannerDialog.banner ? "Edit Banner" : "Add New Banner"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Live Preview */}
            <div
              className={`bg-gradient-to-r ${bannerForm.color} rounded-xl p-4 text-white relative overflow-hidden min-h-[80px]`}
            >
              {bannerForm.imageUrl && (
                <img
                  src={bannerForm.imageUrl}
                  alt="preview"
                  className="absolute inset-0 w-full h-full object-cover opacity-30"
                />
              )}
              <div className="relative z-10">
                <p className="font-display font-bold text-base">
                  {bannerForm.title || "Banner Title"}
                </p>
                <p className="text-white/70 text-sm">
                  {bannerForm.subtitle || "Banner subtitle goes here"}
                </p>
                <span className="inline-block mt-2 bg-brand-orange text-white text-xs font-semibold px-3 py-1 rounded-full">
                  {bannerForm.buttonText || "Shop Now"}
                </span>
              </div>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <ImagePlus className="w-4 h-4 text-brand-orange" />
                Banner Image
                <span className="text-xs text-muted-foreground font-normal ml-1">
                  (optional — JPG, PNG, WebP)
                </span>
              </Label>
              {bannerForm.imageUrl ? (
                <div className="relative rounded-xl overflow-hidden border-2 border-border h-28">
                  <img
                    src={bannerForm.imageUrl}
                    alt="Banner preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setBannerForm({ ...bannerForm, imageUrl: "" })
                    }
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label
                  data-ocid="banners.upload_button"
                  className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-brand-orange hover:bg-brand-orange/5 transition-all group"
                >
                  <Upload className="w-5 h-5 text-muted-foreground group-hover:text-brand-orange mb-1 transition-colors" />
                  <span className="text-sm text-muted-foreground group-hover:text-brand-orange transition-colors font-medium">
                    Click to upload image
                  </span>
                  <span className="text-xs text-muted-foreground mt-0.5">
                    Used as background overlay
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        const result = ev.target?.result as string;
                        setBannerForm({ ...bannerForm, imageUrl: result });
                      };
                      reader.readAsDataURL(file);
                      e.target.value = "";
                    }}
                  />
                </label>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input
                data-ocid="banners.input"
                value={bannerForm.title}
                onChange={(e) =>
                  setBannerForm({ ...bannerForm, title: e.target.value })
                }
                placeholder="e.g. Massive Sale on Electronics"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Subtitle</Label>
              <Input
                value={bannerForm.subtitle}
                onChange={(e) =>
                  setBannerForm({ ...bannerForm, subtitle: e.target.value })
                }
                placeholder="e.g. Up to 60% off on top brands"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Button Text</Label>
                <Input
                  value={bannerForm.buttonText}
                  onChange={(e) =>
                    setBannerForm({ ...bannerForm, buttonText: e.target.value })
                  }
                  placeholder="Shop Now"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Button Link</Label>
                <Input
                  value={bannerForm.buttonLink}
                  onChange={(e) =>
                    setBannerForm({ ...bannerForm, buttonLink: e.target.value })
                  }
                  placeholder="/products"
                />
              </div>
            </div>

            {/* Position selector */}
            <div className="space-y-1.5">
              <Label>Placement / Position</Label>
              <Select
                value={bannerForm.position}
                onValueChange={(v) =>
                  setBannerForm({
                    ...bannerForm,
                    position: v as Banner["position"],
                  })
                }
              >
                <SelectTrigger data-ocid="banners.select">
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hero">Hero Carousel</SelectItem>
                  <SelectItem value="category">Category Banner</SelectItem>
                  <SelectItem value="promo">Promotional Strip</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Active / Inactive toggle */}
            <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3 bg-muted/30">
              <div>
                <p className="font-medium text-sm">Active on Homepage</p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  Inactive banners won't show on homepage
                </p>
              </div>
              <Switch
                data-ocid="banners.switch"
                checked={bannerForm.active !== false}
                onCheckedChange={(checked) =>
                  setBannerForm({ ...bannerForm, active: checked })
                }
              />
            </div>

            {/* Background Color Gradient */}
            <div className="space-y-1.5">
              <Label>Background Gradient (fallback when no image)</Label>
              <div className="flex flex-wrap gap-2">
                {BANNER_COLOR_OPTIONS.map((opt) => (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() =>
                      setBannerForm({ ...bannerForm, color: opt.value })
                    }
                    className={`bg-gradient-to-r ${opt.value} text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                      bannerForm.color === opt.value
                        ? "ring-2 ring-brand-orange ring-offset-1"
                        : "opacity-70 hover:opacity-100"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              data-ocid="banners.cancel_button"
              variant="outline"
              onClick={() => setBannerDialog({ open: false, banner: null })}
            >
              Cancel
            </Button>
            <Button
              data-ocid="banners.save_button"
              className="bg-brand-orange hover:bg-orange-600 text-white gap-2"
              onClick={() => {
                if (!bannerForm.title) {
                  toast.error("Banner title is required");
                  return;
                }
                if (bannerDialog.banner) {
                  const updated = banners.map((b) =>
                    b.id === bannerDialog.banner!.id
                      ? { ...bannerForm, id: bannerDialog.banner!.id }
                      : b,
                  );
                  setBanners(updated);
                  localStorage.setItem(
                    BANNERS_STORAGE_KEY,
                    JSON.stringify(updated),
                  );
                  window.dispatchEvent(new Event("storage"));
                  toast.success("Banner updated!");
                } else {
                  const newBanner: Banner = {
                    ...bannerForm,
                    id: crypto.randomUUID(),
                  };
                  const updated = [...banners, newBanner];
                  setBanners(updated);
                  localStorage.setItem(
                    BANNERS_STORAGE_KEY,
                    JSON.stringify(updated),
                  );
                  window.dispatchEvent(new Event("storage"));
                  toast.success("Banner created!");
                }
                setBannerDialog({ open: false, banner: null });
              }}
            >
              <Save className="w-4 h-4" />
              Save Banner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

            {/* Image Upload Section */}
            <div className="sm:col-span-2 space-y-3">
              <Label className="flex items-center gap-1.5">
                <ImagePlus className="w-4 h-4 text-brand-orange" />
                Product Images
                <span className="text-xs text-muted-foreground font-normal ml-1">
                  (max 3 images — JPG, PNG, WebP)
                </span>
              </Label>

              {/* Image previews */}
              {imagePreviewUrls.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {imagePreviewUrls.map((url, idx) => (
                    <div
                      key={url}
                      className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-border group"
                    >
                      <img
                        src={url}
                        alt={`Product view ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newImages = productForm.images.filter(
                            (_, i) => i !== idx,
                          );
                          setProductForm({ ...productForm, images: newImages });
                          setImagePreviewUrls((prev) =>
                            prev.filter((_, i) => i !== idx),
                          );
                        }}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div className="absolute bottom-1 left-1 text-[10px] bg-black/50 text-white px-1 rounded">
                        {idx + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload button */}
              {imagePreviewUrls.length < 3 && (
                <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-brand-orange hover:bg-brand-orange/5 transition-all group">
                  <Upload className="w-6 h-6 text-muted-foreground group-hover:text-brand-orange mb-1.5 transition-colors" />
                  <span className="text-sm text-muted-foreground group-hover:text-brand-orange transition-colors font-medium">
                    Click to upload images
                  </span>
                  <span className="text-xs text-muted-foreground mt-0.5">
                    {3 - imagePreviewUrls.length} more image
                    {3 - imagePreviewUrls.length !== 1 ? "s" : ""} allowed
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={async (e) => {
                      const files = Array.from(e.target.files ?? []);
                      if (!files.length) return;
                      const remaining = 3 - imagePreviewUrls.length;
                      const toProcess = files.slice(0, remaining);

                      const results = await Promise.all(
                        toProcess.map(async (file) => {
                          const arrayBuffer = await file.arrayBuffer();
                          const uint8 = new Uint8Array(arrayBuffer);
                          const previewUrl = URL.createObjectURL(file);
                          return { uint8, previewUrl };
                        }),
                      );

                      setProductForm((prev) => ({
                        ...prev,
                        images: [
                          ...prev.images,
                          ...results.map((r) => r.uint8),
                        ],
                      }));
                      setImagePreviewUrls((prev) => [
                        ...prev,
                        ...results.map((r) => r.previewUrl),
                      ]);
                      // Reset the input so same file can be re-selected
                      e.target.value = "";
                    }}
                  />
                </label>
              )}
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

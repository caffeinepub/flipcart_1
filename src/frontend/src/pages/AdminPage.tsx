import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  CloudUpload,
  Edit3,
  Eye,
  EyeOff,
  Image,
  ImagePlus,
  Loader2,
  Lock,
  Megaphone,
  Menu,
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
import { useCallback, useEffect, useRef, useState } from "react";
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

// ─── Constants ──────────────────────────────────────────────────────────────

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

const DEFAULT_PIN = "0078";
const PIN_STORAGE_KEY = "admin_custom_pin";
const PIN_SESSION_KEY = "admin_pin_verified";
const BACKEND_SETUP_PIN = "0078";
const ROWS_PER_PAGE = 10;

function getAdminPin(): string {
  return localStorage.getItem(PIN_STORAGE_KEY) || DEFAULT_PIN;
}

function setAdminPin(pin: string): void {
  localStorage.setItem(PIN_STORAGE_KEY, pin);
}

// ─── Data Table Hook ─────────────────────────────────────────────────────────

function useDataTable<T extends Record<string, unknown>>(
  data: T[],
  searchKeys: (keyof T)[],
) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const filtered = data.filter((row) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return searchKeys.some((k) =>
      String(row[k] ?? "")
        .toLowerCase()
        .includes(q),
    );
  });

  const sorted = sortKey
    ? [...filtered].sort((a, b) => {
        const av = String(a[sortKey] ?? "");
        const bv = String(b[sortKey] ?? "");
        const cmp = av.localeCompare(bv, undefined, { numeric: true });
        return sortDir === "asc" ? cmp : -cmp;
      })
    : filtered;

  const totalPages = Math.max(1, Math.ceil(sorted.length / ROWS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pageData = sorted.slice(
    (safePage - 1) * ROWS_PER_PAGE,
    safePage * ROWS_PER_PAGE,
  );

  const toggleSort = (key: keyof T) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  };

  const toggleSelect = (idx: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const allSelected =
    pageData.length > 0 &&
    pageData.every((_, i) => selected.has((safePage - 1) * ROWS_PER_PAGE + i));

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      const pageIndices = pageData.map(
        (_, i) => (safePage - 1) * ROWS_PER_PAGE + i,
      );
      if (allSelected) {
        for (const i of pageIndices) next.delete(i);
      } else {
        for (const i of pageIndices) next.add(i);
      }
      return next;
    });
  };

  return {
    search,
    setSearch,
    sortKey,
    sortDir,
    toggleSort,
    page: safePage,
    setPage,
    totalPages,
    pageData,
    selected,
    toggleSelect,
    allSelected,
    toggleAll,
    totalFiltered: filtered.length,
  };
}

// ─── Sidebar Nav Config ───────────────────────────────────────────────────────

type Section =
  | "products"
  | "categories"
  | "orders"
  | "users"
  | "analytics"
  | "banners"
  | "pinreset";

const NAV_ITEMS: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: "products", label: "Products", icon: Package },
  { id: "categories", label: "Categories", icon: Tag },
  { id: "orders", label: "Orders", icon: ShoppingBag },
  { id: "users", label: "Users", icon: Users },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "banners", label: "Banners", icon: Image },
  { id: "pinreset", label: "PIN Reset", icon: Lock },
];

// ─── AdminPinLock ─────────────────────────────────────────────────────────────

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
    if (value && index < 3) inputRefs.current[index + 1]?.focus();
    if (joined.length === 4) setTimeout(() => checkPin(joined), 100);
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

  useEffect(() => {
    const stored = localStorage.getItem(PIN_STORAGE_KEY);
    if (stored === "1234") localStorage.removeItem(PIN_STORAGE_KEY);
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
          4-digit PIN enter karein
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

// ─── Sidebar Component ────────────────────────────────────────────────────────

function AdminSidebar({
  active,
  onSelect,
  onClose,
}: {
  active: Section;
  onSelect: (s: Section) => void;
  onClose?: () => void;
}) {
  return (
    <nav className="flex flex-col h-full" data-ocid="admin.panel">
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-brand-orange flex items-center justify-center flex-shrink-0">
          <Shield className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="font-display font-bold text-sm leading-tight">Admin</p>
          <p className="text-[11px] text-muted-foreground">
            ShopExpo Dashboard
          </p>
        </div>
      </div>
      <div className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              type="button"
              data-ocid={`admin.${item.id}.tab`}
              onClick={() => {
                onSelect(item.id);
                onClose?.();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-brand-orange text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </button>
          );
        })}
      </div>
      <div className="px-4 py-4 border-t border-border">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground gap-2"
        >
          <Link to="/">← Back to Shop</Link>
        </Button>
      </div>
    </nav>
  );
}

// ─── Sort Header Helper ───────────────────────────────────────────────────────

function SortTh({
  children,
  active,
  dir,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  active: boolean;
  dir: "asc" | "desc";
  onClick: () => void;
  className?: string;
}) {
  return (
    <TableHead
      className={`cursor-pointer select-none hover:bg-muted/70 transition-colors ${className}`}
      onClick={onClick}
    >
      <span className="flex items-center gap-1">
        {children}
        {active ? (
          <span className="text-brand-orange text-xs">
            {dir === "asc" ? "↑" : "↓"}
          </span>
        ) : (
          <span className="text-muted-foreground/40 text-xs">↕</span>
        )}
      </span>
    </TableHead>
  );
}

// ─── Pagination Component ─────────────────────────────────────────────────────

function TablePagination({
  page,
  totalPages,
  total,
  pageSize,
  onPrev,
  onNext,
  scope,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPrev: () => void;
  onNext: () => void;
  scope: string;
}) {
  const from = Math.min((page - 1) * pageSize + 1, total);
  const to = Math.min(page * pageSize, total);
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
      <span className="text-xs text-muted-foreground">
        {total === 0 ? "0 results" : `${from}–${to} of ${total}`}
      </span>
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0"
          disabled={page <= 1}
          onClick={onPrev}
          data-ocid={`${scope}.pagination_prev`}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-xs font-medium px-2">
          {page} / {totalPages}
        </span>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0"
          disabled={page >= totalPages}
          onClick={onNext}
          data-ocid={`${scope}.pagination_next`}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── DragDrop Image Upload ────────────────────────────────────────────────────

function DragDropImageUpload({
  imagePreviewUrls,
  onAddImages,
  onRemoveImage,
}: {
  imagePreviewUrls: string[];
  onAddImages: (files: File[]) => Promise<void>;
  onRemoveImage: (idx: number) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const files = Array.from(e.dataTransfer.files).filter((f) =>
        ["image/jpeg", "image/png", "image/webp"].includes(f.type),
      );
      if (files.length === 0) {
        toast.error("Only JPG, PNG, WebP images supported");
        return;
      }
      await onAddImages(files);
    },
    [onAddImages],
  );

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (files.length > 0) await onAddImages(files);
      e.target.value = "";
    },
    [onAddImages],
  );

  return (
    <div className="space-y-3">
      {/* Previews */}
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
                data-ocid={`product.delete_button.${idx + 1}`}
                onClick={() => onRemoveImage(idx)}
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

      {/* Dropzone */}
      {imagePreviewUrls.length < 3 && (
        <button
          type="button"
          data-ocid="product.dropzone"
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => void handleDrop(e)}
          onClick={() => inputRef.current?.click()}
          className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
            dragging
              ? "border-brand-orange bg-brand-orange/10 scale-[1.01]"
              : "border-border hover:border-brand-orange hover:bg-brand-orange/5"
          }`}
        >
          <CloudUpload
            className={`w-8 h-8 mb-1.5 transition-colors ${dragging ? "text-brand-orange" : "text-muted-foreground"}`}
          />
          <span
            className={`text-sm font-medium transition-colors ${dragging ? "text-brand-orange" : "text-muted-foreground"}`}
          >
            {dragging ? "Drop images here!" : "Drag & drop or click to upload"}
          </span>
          <span className="text-xs text-muted-foreground mt-0.5">
            {3 - imagePreviewUrls.length} more image
            {3 - imagePreviewUrls.length !== 1 ? "s" : ""} allowed · JPG, PNG,
            WebP
          </span>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => void handleFileChange(e)}
          />
        </button>
      )}
    </div>
  );
}

// ─── Main AdminPage ───────────────────────────────────────────────────────────

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
  const [activeSection, setActiveSection] = useState<Section>("products");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Change PIN dialog
  const [changePinOpen, setChangePinOpen] = useState(false);
  const [currentPinInput, setCurrentPinInput] = useState("");
  const [newPinInput, setNewPinInput] = useState("");
  const [confirmPinInput, setConfirmPinInput] = useState("");
  const [changePinStep, setChangePinStep] = useState<"verify" | "new">(
    "verify",
  );

  // Claim admin
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
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);

  const [banners, setBanners] = useState<Banner[]>(() =>
    getBannersFromStorage(),
  );
  const [bannerDialog, setBannerDialog] = useState<{
    open: boolean;
    banner: Banner | null;
  }>({
    open: false,
    banner: null,
  });
  const [bannerForm, setBannerForm] =
    useState<Omit<Banner, "id">>(EMPTY_BANNER);

  useEffect(() => {
    const stored = localStorage.getItem(PIN_STORAGE_KEY);
    if (stored === "1234") localStorage.removeItem(PIN_STORAGE_KEY);
  }, []);

  // ── Data tables ──────────────────────────────────────────────────────────
  type ProductRow = {
    id: string;
    name: string;
    category: string;
    price: string;
    stock: string;
    _raw: Product;
  };
  type OrderRow = {
    id: string;
    date: string;
    items: string;
    total: string;
    status: string;
    _raw: Order;
  };
  type UserRow = {
    principal: string;
    name: string;
    email: string;
    role: string;
    _raw: UserEntry;
  };

  const productRows: ProductRow[] = (products ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    price: formatPrice(p.discountedPrice),
    stock: String(p.stockQuantity),
    _raw: p,
  }));

  const orderRows: OrderRow[] = (orders ?? []).map((o) => ({
    id: o.id,
    date: new Date(Number(o.createdAt) / 1000000).toLocaleDateString("en-IN"),
    items: String(o.items.length),
    total: formatPrice(o.items.reduce((s, i) => s + i.price * i.quantity, 0n)),
    status: o.status,
    _raw: o,
  }));

  const userRows: UserRow[] = (users ?? []).map((u) => ({
    principal: u.principal.toString(),
    name: u.profile?.name ?? "",
    email: u.profile?.email ?? "",
    role: u.role,
    _raw: u,
  }));

  const prodTable = useDataTable(productRows, ["name", "category", "price"]);
  const orderTable = useDataTable(orderRows, ["id", "status", "total"]);
  const userTable = useDataTable(userRows, [
    "name",
    "email",
    "principal",
    "role",
  ]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const openProductDialog = (product: Product | null) => {
    const form = product ?? { ...EMPTY_PRODUCT, id: crypto.randomUUID() };
    setProductForm(form);
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

  const handleAddImages = async (files: File[]) => {
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
      images: [...prev.images, ...results.map((r) => r.uint8)],
    }));
    setImagePreviewUrls((prev) => [
      ...prev,
      ...results.map((r) => r.previewUrl),
    ]);
  };

  const handleRemoveImage = (idx: number) => {
    setProductForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== idx),
    }));
    setImagePreviewUrls((prev) => prev.filter((_, i) => i !== idx));
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

  // ── Auth Guards ───────────────────────────────────────────────────────────

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
      if (value && index < 3) claimInputRefs.current[index + 1]?.focus();
      if (joined.length === 4)
        setTimeout(() => void handleClaimPin(joined), 100);
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
        const result =
          await initializeFirstAdmin.mutateAsync(BACKEND_SETUP_PIN);
        if (result === true) {
          toast.success("Admin access mil gaya!");
          await queryClient.invalidateQueries({ queryKey: ["isAdmin"] });
          await queryClient.refetchQueries({ queryKey: ["isAdmin"] });
        } else {
          toast.error(
            "Admin pehle se set hai. Existing admin se contact karein.",
          );
          setClaimPin("");
          claimInputRefs.current[0]?.focus();
          await queryClient.invalidateQueries({ queryKey: ["isAdmin"] });
          await queryClient.refetchQueries({ queryKey: ["isAdmin"] });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (message.includes("anonymous")) {
          toast.error("Pehle login karein, phir admin access lein.");
        } else {
          toast.error(`Admin access error: ${message.slice(0, 80)}`);
          setClaimPin("");
          claimInputRefs.current[0]?.focus();
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
            enter karein.
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
                      claimInputRefs.current[
                        Math.max(0, newPin.length)
                      ]?.focus();
                    } else if (claimPin.length < 4) {
                      const newPin = claimPin + key;
                      setClaimPin(newPin);
                      if (newPin.length < 4)
                        claimInputRefs.current[newPin.length]?.focus();
                      if (newPin.length === 4)
                        setTimeout(() => void handleClaimPin(newPin), 100);
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
              toast.info("Admin status verify ho raha hai...");
              await queryClient.invalidateQueries({ queryKey: ["isAdmin"] });
              await queryClient.refetchQueries({ queryKey: ["isAdmin"] });
            }}
          >
            Pehle se admin hain? Yahan click karein
          </button>
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-brand-orange underline underline-offset-2 mt-2 block"
            onClick={() => {
              if (confirm("PIN reset karein? Default PIN '0078' use hoga.")) {
                localStorage.removeItem(PIN_STORAGE_KEY);
                toast.success("PIN reset ho gaya!");
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

  if (!pinVerified) {
    return <AdminPinLock onUnlock={() => setPinVerified(true)} />;
  }

  // ── Dashboard stats ───────────────────────────────────────────────────────
  const pendingOrders =
    orders?.filter((o) => o.status === OrderStatus.Pending).length ?? 0;
  const activeBanners = banners.filter((b) => b.active !== false).length;
  const currentNavLabel =
    NAV_ITEMS.find((n) => n.id === activeSection)?.label ?? "Dashboard";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-56 flex-col border-r border-border bg-card sticky top-16 self-start h-[calc(100vh-4rem)] overflow-y-auto">
        <AdminSidebar active={activeSection} onSelect={setActiveSection} />
      </aside>

      {/* Content */}
      <main className="flex-1 min-w-0 px-4 md:px-6 py-5">
        {/* Mobile top bar */}
        <div className="flex items-center gap-3 mb-4 md:hidden">
          <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 flex-shrink-0"
                data-ocid="admin.menu.button"
              >
                <Menu className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-56">
              <AdminSidebar
                active={activeSection}
                onSelect={setActiveSection}
                onClose={() => setMobileSidebarOpen(false)}
              />
            </SheetContent>
          </Sheet>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/admin" className="text-muted-foreground">
                    Admin
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{currentNavLabel}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Desktop breadcrumb */}
        <div className="hidden md:flex items-center justify-between mb-5">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/" className="text-muted-foreground">
                    ShopExpo
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/admin" className="text-muted-foreground">
                    Admin
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{currentNavLabel}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {[
            {
              label: "Products",
              value: products?.length ?? 0,
              icon: Package,
              color: "text-blue-600 bg-blue-50",
              section: "products" as Section,
            },
            {
              label: "Categories",
              value: (categories?.length ?? 0) || STATIC_CATEGORIES.length,
              icon: Tag,
              color: "text-purple-600 bg-purple-50",
              section: "categories" as Section,
            },
            {
              label: "Orders",
              value: orders?.length ?? 0,
              icon: ShoppingBag,
              color: "text-green-600 bg-green-50",
              section: "orders" as Section,
            },
            {
              label: "Pending",
              value: pendingOrders,
              icon: TrendingUp,
              color: "text-orange-600 bg-orange-50",
              section: "orders" as Section,
            },
            {
              label: "Users",
              value: users?.length ?? 0,
              icon: Users,
              color: "text-teal-600 bg-teal-50",
              section: "users" as Section,
            },
            {
              label: "Banners",
              value: activeBanners,
              icon: Megaphone,
              color: "text-pink-600 bg-pink-50",
              section: "banners" as Section,
            },
          ].map((stat) => (
            <motion.button
              type="button"
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setActiveSection(stat.section)}
              className="bg-white rounded-xl border border-border p-3 text-left hover:border-brand-orange/40 transition-colors"
            >
              <div
                className={`w-8 h-8 rounded-lg ${stat.color} flex items-center justify-center mb-2`}
              >
                <stat.icon className="w-4 h-4" />
              </div>
              <p className="font-display font-bold text-xl">{stat.value}</p>
              <p className="text-muted-foreground text-xs">{stat.label}</p>
            </motion.button>
          ))}
        </div>

        {/* ── Products Section ─────────────────────────────────────────── */}
        {activeSection === "products" && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-lg">Products</h2>
              <Button
                data-ocid="products.primary_button"
                className="bg-brand-orange hover:bg-orange-600 text-white gap-2"
                onClick={() => openProductDialog(null)}
              >
                <Plus className="w-4 h-4" /> Add Product
              </Button>
            </div>

            {productsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 rounded-xl" />
                ))}
              </div>
            ) : productsError ? (
              <div
                data-ocid="products.error_state"
                className="text-center py-16 bg-white rounded-xl border border-red-200"
              >
                <Package className="w-12 h-12 mx-auto text-red-400 mb-3 opacity-50" />
                <p className="text-red-600 text-sm font-medium">
                  Products load nahi ho sake
                </p>
              </div>
            ) : !products || products.length === 0 ? (
              <div
                data-ocid="products.empty_state"
                className="text-center py-16 bg-white rounded-xl border border-border"
              >
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
                <div className="px-4 py-3 border-b border-border">
                  <Input
                    data-ocid="products.search_input"
                    placeholder="Search products..."
                    value={prodTable.search}
                    onChange={(e) => {
                      prodTable.setSearch(e.target.value);
                      prodTable.setPage(1);
                    }}
                    className="max-w-sm h-8 text-sm"
                  />
                </div>
                <div className="overflow-x-auto">
                  <Table data-ocid="products.table">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">
                          <Checkbox
                            data-ocid="products.checkbox"
                            checked={prodTable.allSelected}
                            onCheckedChange={prodTable.toggleAll}
                          />
                        </TableHead>
                        <SortTh
                          active={prodTable.sortKey === "name"}
                          dir={prodTable.sortDir}
                          onClick={() => prodTable.toggleSort("name")}
                        >
                          Product
                        </SortTh>
                        <SortTh
                          active={prodTable.sortKey === "category"}
                          dir={prodTable.sortDir}
                          onClick={() => prodTable.toggleSort("category")}
                          className="hidden md:table-cell"
                        >
                          Category
                        </SortTh>
                        <SortTh
                          active={prodTable.sortKey === "price"}
                          dir={prodTable.sortDir}
                          onClick={() => prodTable.toggleSort("price")}
                        >
                          Price
                        </SortTh>
                        <SortTh
                          active={prodTable.sortKey === "stock"}
                          dir={prodTable.sortDir}
                          onClick={() => prodTable.toggleSort("stock")}
                          className="hidden sm:table-cell"
                        >
                          Stock
                        </SortTh>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {prodTable.pageData.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center py-8 text-muted-foreground text-sm"
                          >
                            No matching products
                          </TableCell>
                        </TableRow>
                      ) : (
                        prodTable.pageData.map((row, i) => {
                          const globalIdx =
                            (prodTable.page - 1) * ROWS_PER_PAGE + i;
                          return (
                            <TableRow
                              key={row.id}
                              data-ocid={`products.row.${i + 1}`}
                              className={
                                prodTable.selected.has(globalIdx)
                                  ? "bg-brand-orange/5"
                                  : ""
                              }
                            >
                              <TableCell>
                                <Checkbox
                                  data-ocid={`products.checkbox.${i + 1}`}
                                  checked={prodTable.selected.has(globalIdx)}
                                  onCheckedChange={() =>
                                    prodTable.toggleSelect(globalIdx)
                                  }
                                />
                              </TableCell>
                              <TableCell className="font-medium max-w-[200px]">
                                <p className="line-clamp-1">{row.name}</p>
                              </TableCell>
                              <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                                {row.category}
                              </TableCell>
                              <TableCell className="font-semibold text-brand-orange text-sm">
                                {row.price}
                              </TableCell>
                              <TableCell className="hidden sm:table-cell text-sm">
                                {row.stock}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7"
                                    data-ocid={`products.edit_button.${i + 1}`}
                                    onClick={() => openProductDialog(row._raw)}
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-destructive hover:text-destructive"
                                    data-ocid={`products.delete_button.${i + 1}`}
                                    onClick={() =>
                                      void handleDeleteProduct(row.id)
                                    }
                                    disabled={deleteProduct.isPending}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
                <TablePagination
                  page={prodTable.page}
                  totalPages={prodTable.totalPages}
                  total={prodTable.totalFiltered}
                  pageSize={ROWS_PER_PAGE}
                  onPrev={() => prodTable.setPage((p) => p - 1)}
                  onNext={() => prodTable.setPage((p) => p + 1)}
                  scope="products"
                />
              </div>
            )}
          </section>
        )}

        {/* ── Categories Section ───────────────────────────────────────── */}
        {activeSection === "categories" && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-lg">Categories</h2>
              <Button
                data-ocid="categories.primary_button"
                className="bg-brand-orange hover:bg-orange-600 text-white gap-2"
                onClick={() => openCategoryDialog(null)}
              >
                <Plus className="w-4 h-4" /> Add Category
              </Button>
            </div>
            {categoriesLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(categories && categories.length > 0
                  ? categories
                  : STATIC_CATEGORIES
                ).map((cat, i) => (
                  <div
                    key={cat.id}
                    data-ocid={`categories.item.${i + 1}`}
                    className="bg-white rounded-xl border border-border p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-base">{cat.name}</h3>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          data-ocid={`categories.edit_button.${i + 1}`}
                          onClick={() => openCategoryDialog(cat)}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          data-ocid={`categories.delete_button.${i + 1}`}
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
          </section>
        )}

        {/* ── Orders Section ───────────────────────────────────────────── */}
        {activeSection === "orders" && (
          <section>
            <h2 className="font-display font-semibold text-lg mb-4">
              All Orders
            </h2>
            {ordersLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 rounded-xl" />
                ))}
              </div>
            ) : ordersError ? (
              <div
                data-ocid="orders.error_state"
                className="text-center py-16 bg-white rounded-xl border border-red-200"
              >
                <ShoppingBag className="w-12 h-12 mx-auto text-red-400 mb-3 opacity-50" />
                <p className="text-red-600 text-sm font-medium">
                  Orders load nahi ho sake
                </p>
              </div>
            ) : !orders || orders.length === 0 ? (
              <div
                data-ocid="orders.empty_state"
                className="text-center py-16 bg-white rounded-xl border border-border"
              >
                <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-30" />
                <p className="text-muted-foreground text-sm">No orders yet</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-border overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <Input
                    data-ocid="orders.search_input"
                    placeholder="Search orders..."
                    value={orderTable.search}
                    onChange={(e) => {
                      orderTable.setSearch(e.target.value);
                      orderTable.setPage(1);
                    }}
                    className="max-w-sm h-8 text-sm"
                  />
                </div>
                <div className="overflow-x-auto">
                  <Table data-ocid="orders.table">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">
                          <Checkbox
                            data-ocid="orders.checkbox"
                            checked={orderTable.allSelected}
                            onCheckedChange={orderTable.toggleAll}
                          />
                        </TableHead>
                        <SortTh
                          active={orderTable.sortKey === "id"}
                          dir={orderTable.sortDir}
                          onClick={() => orderTable.toggleSort("id")}
                        >
                          Order ID
                        </SortTh>
                        <SortTh
                          active={orderTable.sortKey === "date"}
                          dir={orderTable.sortDir}
                          onClick={() => orderTable.toggleSort("date")}
                          className="hidden md:table-cell"
                        >
                          Date
                        </SortTh>
                        <SortTh
                          active={orderTable.sortKey === "items"}
                          dir={orderTable.sortDir}
                          onClick={() => orderTable.toggleSort("items")}
                          className="hidden md:table-cell"
                        >
                          Items
                        </SortTh>
                        <SortTh
                          active={orderTable.sortKey === "total"}
                          dir={orderTable.sortDir}
                          onClick={() => orderTable.toggleSort("total")}
                        >
                          Total
                        </SortTh>
                        <SortTh
                          active={orderTable.sortKey === "status"}
                          dir={orderTable.sortDir}
                          onClick={() => orderTable.toggleSort("status")}
                        >
                          Status
                        </SortTh>
                        <TableHead className="text-right">Update</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderTable.pageData.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="text-center py-8 text-muted-foreground text-sm"
                          >
                            No matching orders
                          </TableCell>
                        </TableRow>
                      ) : (
                        orderTable.pageData.map((row, i) => {
                          const globalIdx =
                            (orderTable.page - 1) * ROWS_PER_PAGE + i;
                          return (
                            <TableRow
                              key={row.id}
                              data-ocid={`orders.row.${i + 1}`}
                              className={
                                orderTable.selected.has(globalIdx)
                                  ? "bg-brand-orange/5"
                                  : ""
                              }
                            >
                              <TableCell>
                                <Checkbox
                                  data-ocid={`orders.checkbox.${i + 1}`}
                                  checked={orderTable.selected.has(globalIdx)}
                                  onCheckedChange={() =>
                                    orderTable.toggleSelect(globalIdx)
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <Link
                                  to="/order/$orderId"
                                  params={{ orderId: row.id }}
                                  className="font-mono text-xs text-brand-orange hover:underline"
                                >
                                  #{row.id.slice(0, 12)}...
                                </Link>
                              </TableCell>
                              <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                                {row.date}
                              </TableCell>
                              <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                                {row.items} item
                                {Number(row.items) !== 1 ? "s" : ""}
                              </TableCell>
                              <TableCell className="font-bold text-sm">
                                {row.total}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={
                                    row.status === OrderStatus.Delivered
                                      ? "bg-green-100 text-green-700"
                                      : row.status === OrderStatus.Cancelled
                                        ? "bg-red-100 text-red-700"
                                        : "bg-blue-100 text-blue-700"
                                  }
                                >
                                  {row.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Select
                                  value={row.status}
                                  onValueChange={(v) =>
                                    void handleUpdateStatus(
                                      row.id,
                                      v as OrderStatus,
                                    )
                                  }
                                >
                                  <SelectTrigger
                                    data-ocid={`orders.select.${i + 1}`}
                                    className="w-32 h-7 text-xs"
                                  >
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
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
                <TablePagination
                  page={orderTable.page}
                  totalPages={orderTable.totalPages}
                  total={orderTable.totalFiltered}
                  pageSize={ROWS_PER_PAGE}
                  onPrev={() => orderTable.setPage((p) => p - 1)}
                  onNext={() => orderTable.setPage((p) => p + 1)}
                  scope="orders"
                />
              </div>
            )}
          </section>
        )}

        {/* ── Users Section ────────────────────────────────────────────── */}
        {activeSection === "users" && (
          <section>
            <h2 className="font-display font-semibold text-lg mb-4">
              User Management
            </h2>
            {usersLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-14 rounded-xl" />
                ))}
              </div>
            ) : usersError ? (
              <div
                data-ocid="users.error_state"
                className="text-center py-16 bg-white rounded-xl border border-red-200"
              >
                <Users className="w-12 h-12 mx-auto text-red-400 mb-3 opacity-50" />
                <p className="text-red-600 text-sm font-medium">
                  Users load nahi ho sake
                </p>
              </div>
            ) : !users || users.length === 0 ? (
              <div
                data-ocid="users.empty_state"
                className="text-center py-16 bg-white rounded-xl border border-border"
              >
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-30" />
                <p className="text-muted-foreground text-sm">
                  No registered users yet
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Users will appear after they create a profile
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-border overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <Input
                    data-ocid="users.search_input"
                    placeholder="Search users..."
                    value={userTable.search}
                    onChange={(e) => {
                      userTable.setSearch(e.target.value);
                      userTable.setPage(1);
                    }}
                    className="max-w-sm h-8 text-sm"
                  />
                </div>
                <div className="overflow-x-auto">
                  <Table data-ocid="users.table">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">
                          <Checkbox
                            data-ocid="users.checkbox"
                            checked={userTable.allSelected}
                            onCheckedChange={userTable.toggleAll}
                          />
                        </TableHead>
                        <SortTh
                          active={userTable.sortKey === "principal"}
                          dir={userTable.sortDir}
                          onClick={() => userTable.toggleSort("principal")}
                        >
                          Principal
                        </SortTh>
                        <SortTh
                          active={userTable.sortKey === "name"}
                          dir={userTable.sortDir}
                          onClick={() => userTable.toggleSort("name")}
                          className="hidden md:table-cell"
                        >
                          Name
                        </SortTh>
                        <SortTh
                          active={userTable.sortKey === "email"}
                          dir={userTable.sortDir}
                          onClick={() => userTable.toggleSort("email")}
                          className="hidden lg:table-cell"
                        >
                          Email
                        </SortTh>
                        <SortTh
                          active={userTable.sortKey === "role"}
                          dir={userTable.sortDir}
                          onClick={() => userTable.toggleSort("role")}
                        >
                          Role
                        </SortTh>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userTable.pageData.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center py-8 text-muted-foreground text-sm"
                          >
                            No matching users
                          </TableCell>
                        </TableRow>
                      ) : (
                        userTable.pageData.map((row, i) => {
                          const globalIdx =
                            (userTable.page - 1) * ROWS_PER_PAGE + i;
                          const isSelf =
                            identity?.getPrincipal().toString() ===
                            row.principal;
                          const isEntryAdmin = row.role === "admin";
                          const isRolePending =
                            setUserRole.isPending &&
                            setUserRole.variables?.targetUser.toString() ===
                              row.principal;
                          return (
                            <TableRow
                              key={row.principal}
                              data-ocid={`users.row.${i + 1}`}
                              className={
                                userTable.selected.has(globalIdx)
                                  ? "bg-brand-orange/5"
                                  : ""
                              }
                            >
                              <TableCell>
                                <Checkbox
                                  data-ocid={`users.checkbox.${i + 1}`}
                                  checked={userTable.selected.has(globalIdx)}
                                  onCheckedChange={() =>
                                    userTable.toggleSelect(globalIdx)
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <p className="font-mono text-xs text-muted-foreground">
                                  {row.principal.slice(0, 16)}...
                                </p>
                                {isSelf && (
                                  <span className="text-[10px] font-semibold text-brand-orange">
                                    (You)
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                <p className="font-medium text-sm">
                                  {row.name || (
                                    <span className="text-muted-foreground italic">
                                      —
                                    </span>
                                  )}
                                </p>
                              </TableCell>
                              <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                                {row.email || "—"}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={
                                    isEntryAdmin
                                      ? "bg-orange-100 text-orange-700 border-orange-200"
                                      : "bg-muted text-muted-foreground border-border"
                                  }
                                >
                                  {row.role}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                {isSelf ? (
                                  <span className="text-xs text-muted-foreground italic px-2">
                                    Own account
                                  </span>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    data-ocid={`users.${isEntryAdmin ? "delete" : "edit"}_button.${i + 1}`}
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
                                          targetUser: row._raw.principal,
                                          newRole,
                                        });
                                        toast.success(
                                          `Role updated to ${newRole}`,
                                        );
                                      } catch {
                                        toast.error("Role update nahi hua");
                                      }
                                    }}
                                  >
                                    {isRolePending ? (
                                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                    ) : null}
                                    {isEntryAdmin
                                      ? "Remove Admin"
                                      : "Make Admin"}
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
                <TablePagination
                  page={userTable.page}
                  totalPages={userTable.totalPages}
                  total={userTable.totalFiltered}
                  pageSize={ROWS_PER_PAGE}
                  onPrev={() => userTable.setPage((p) => p - 1)}
                  onNext={() => userTable.setPage((p) => p + 1)}
                  scope="users"
                />
              </div>
            )}
          </section>
        )}

        {/* ── Analytics Section ────────────────────────────────────────── */}
        {activeSection === "analytics" && (
          <section>
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
              (() => {
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
                  if (s in statusCounts)
                    statusCounts[s as keyof typeof statusCounts]++;
                }
                const productCounts: Record<string, number> = {};
                for (const o of allOrders)
                  for (const item of o.items) {
                    productCounts[item.productId] =
                      (productCounts[item.productId] ?? 0) +
                      Number(item.quantity);
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
              })()
            )}
          </section>
        )}

        {/* ── Banners Section ──────────────────────────────────────────── */}
        {activeSection === "banners" && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display font-semibold text-lg">
                  Banner / Ads Management
                </h2>
                <p className="text-muted-foreground text-xs mt-0.5">
                  Homepage hero banners aur promotional strips manage karein
                </p>
              </div>
              <Button
                data-ocid="banners.primary_button"
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
                  No banners yet.
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
                      </div>
                      <div className="flex items-center gap-1 px-3 flex-shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          data-ocid={`banners.toggle.${idx + 1}`}
                          className={`h-8 w-8 ${banner.active !== false ? "text-green-600" : "text-gray-400"}`}
                          onClick={() => {
                            const updated = banners.map((b) =>
                              b.id === banner.id
                                ? { ...b, active: b.active === false }
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
          </section>
        )}

        {/* ── PIN Reset Section ────────────────────────────────────────── */}
        {activeSection === "pinreset" && (
          <section>
            <h2 className="font-display font-semibold text-lg mb-4">
              PIN Reset
            </h2>
            <div className="bg-white rounded-xl border border-border p-6 max-w-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-brand-orange/10 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-brand-orange" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Change Admin PIN</p>
                  <p className="text-muted-foreground text-xs">
                    Update your 4-digit admin PIN
                  </p>
                </div>
              </div>
              <Button
                data-ocid="pinreset.primary_button"
                className="bg-brand-orange hover:bg-orange-600 text-white gap-2 w-full"
                onClick={() => {
                  setCurrentPinInput("");
                  setNewPinInput("");
                  setConfirmPinInput("");
                  setChangePinStep("verify");
                  setChangePinOpen(true);
                }}
              >
                <Lock className="w-4 h-4" /> Change PIN
              </Button>
            </div>
          </section>
        )}
      </main>

      {/* ── Banner Dialog ──────────────────────────────────────────────── */}
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
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <ImagePlus className="w-4 h-4 text-brand-orange" />
                Banner Image
                <span className="text-xs text-muted-foreground font-normal ml-1">
                  (optional)
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
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) =>
                        setBannerForm({
                          ...bannerForm,
                          imageUrl: ev.target?.result as string,
                        });
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
            <div className="space-y-1.5">
              <Label>Placement</Label>
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
            <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3 bg-muted/30">
              <div>
                <p className="font-medium text-sm">Active on Homepage</p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  Inactive banners won't show
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
            <div className="space-y-1.5">
              <Label>Background Gradient</Label>
              <div className="flex flex-wrap gap-2">
                {BANNER_COLOR_OPTIONS.map((opt) => (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() =>
                      setBannerForm({ ...bannerForm, color: opt.value })
                    }
                    className={`bg-gradient-to-r ${opt.value} text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${bannerForm.color === opt.value ? "ring-2 ring-brand-orange ring-offset-1" : "opacity-70 hover:opacity-100"}`}
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
                  const updated = [
                    ...banners,
                    { ...bannerForm, id: crypto.randomUUID() },
                  ];
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
              <Save className="w-4 h-4" /> Save Banner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Product Dialog ─────────────────────────────────────────────── */}
      <Dialog
        open={productDialog.open}
        onOpenChange={(open) =>
          setProductDialog({ open, product: productDialog.product })
        }
      >
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          data-ocid="products.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display font-bold">
              {productDialog.product ? "Edit Product" : "Add New Product"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Product Name *</Label>
              <Input
                data-ocid="products.input"
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
                data-ocid="products.textarea"
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
                <SelectTrigger data-ocid="products.select">
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
            <div className="sm:col-span-2 space-y-3">
              <Label className="flex items-center gap-1.5">
                <ImagePlus className="w-4 h-4 text-brand-orange" />
                Product Images
                <span className="text-xs text-muted-foreground font-normal ml-1">
                  (max 3 — JPG, PNG, WebP)
                </span>
              </Label>
              <DragDropImageUpload
                imagePreviewUrls={imagePreviewUrls}
                onAddImages={handleAddImages}
                onRemoveImage={handleRemoveImage}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              data-ocid="products.cancel_button"
              variant="outline"
              onClick={() => setProductDialog({ open: false, product: null })}
            >
              Cancel
            </Button>
            <Button
              data-ocid="products.save_button"
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

      {/* ── Category Dialog ────────────────────────────────────────────── */}
      <Dialog
        open={categoryDialog.open}
        onOpenChange={(open) =>
          setCategoryDialog({ open, category: categoryDialog.category })
        }
      >
        <DialogContent className="max-w-md" data-ocid="categories.dialog">
          <DialogHeader>
            <DialogTitle className="font-display font-bold">
              {categoryDialog.category ? "Edit Category" : "Add New Category"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label>Category Name *</Label>
              <Input
                data-ocid="categories.input"
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
                data-ocid="categories.textarea"
                value={categoryForm.description}
                onChange={(e) =>
                  setCategoryForm({
                    ...categoryForm,
                    description: e.target.value,
                  })
                }
                rows={3}
                placeholder="Category description..."
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              data-ocid="categories.cancel_button"
              variant="outline"
              onClick={() => setCategoryDialog({ open: false, category: null })}
            >
              Cancel
            </Button>
            <Button
              data-ocid="categories.save_button"
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

      {/* ── Change PIN Dialog ──────────────────────────────────────────── */}
      <Dialog open={changePinOpen} onOpenChange={setChangePinOpen}>
        <DialogContent className="max-w-sm" data-ocid="pinreset.dialog">
          <DialogHeader>
            <DialogTitle className="font-display font-bold flex items-center gap-2">
              <Lock className="w-5 h-5 text-brand-orange" /> Admin PIN Reset
            </DialogTitle>
          </DialogHeader>
          {changePinStep === "verify" ? (
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">
                Pehle apna current PIN enter karein.
              </p>
              <div className="space-y-1.5">
                <Label>Current PIN</Label>
                <Input
                  data-ocid="pinreset.input"
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
                  data-ocid="pinreset.cancel_button"
                  variant="outline"
                  onClick={() => setChangePinOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  data-ocid="pinreset.confirm_button"
                  className="bg-brand-orange hover:bg-orange-600 text-white"
                  onClick={() => {
                    if (currentPinInput === getAdminPin()) {
                      setChangePinStep("new");
                    } else {
                      toast.error("Galat PIN!");
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
                  data-ocid="pinreset.cancel_button"
                  variant="outline"
                  onClick={() => setChangePinOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  data-ocid="pinreset.save_button"
                  className="bg-brand-orange hover:bg-orange-600 text-white"
                  onClick={() => {
                    if (newPinInput.length !== 4) {
                      toast.error("PIN must be 4 digits");
                      return;
                    }
                    if (newPinInput !== confirmPinInput) {
                      toast.error("PINs don't match!");
                      return;
                    }
                    setAdminPin(newPinInput);
                    sessionStorage.removeItem(PIN_SESSION_KEY);
                    toast.success(`PIN changed! New PIN: ${newPinInput}`);
                    setChangePinOpen(false);
                    setPinVerified(false);
                  }}
                  disabled={
                    newPinInput.length !== 4 || confirmPinInput.length !== 4
                  }
                >
                  Save PIN
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

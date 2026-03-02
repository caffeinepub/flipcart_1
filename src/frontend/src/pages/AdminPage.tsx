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
import { Link } from "@tanstack/react-router";
import {
  BarChart3,
  Edit3,
  Loader2,
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
import { useState } from "react";
import { toast } from "sonner";
import type { Category, Order, Product } from "../backend.d";
import { OrderStatus } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCreateCategory,
  useCreateProduct,
  useDeleteCategory,
  useDeleteProduct,
  useGetAllOrders,
  useGetAllProducts,
  useGetCategories,
  useIsCallerAdmin,
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

export function AdminPage() {
  const { identity, login } = useInternetIdentity();
  const { data: isAdmin, isLoading: adminLoading } = useIsCallerAdmin();
  const { data: products, isLoading: productsLoading } = useGetAllProducts();
  const { data: categories, isLoading: categoriesLoading } = useGetCategories();
  const { data: orders, isLoading: ordersLoading } = useGetAllOrders();

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
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Shield className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
        <h2 className="font-display font-bold text-xl mb-2">Access Denied</h2>
        <p className="text-muted-foreground mb-6">
          You don't have admin privileges.
        </p>
        <Button asChild>
          <Link to="/">Go Home</Link>
        </Button>
      </div>
    );
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
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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

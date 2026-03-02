import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearch } from "@tanstack/react-router";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { ProductCard } from "../components/product/ProductCard";
import { useGetAllProducts } from "../hooks/useQueries";
import {
  CATEGORY_ICONS,
  STATIC_CATEGORIES,
  STATIC_PRODUCTS,
  getDiscountPercentage,
} from "../utils/staticData";

type SortOption =
  | "default"
  | "price-asc"
  | "price-desc"
  | "rating"
  | "discount";

export function ProductsPage() {
  const search = useSearch({ from: "/products" });
  const [localSearch, setLocalSearch] = useState(
    (search as { q?: string }).q ?? "",
  );
  const [selectedCategory, setSelectedCategory] = useState(
    (search as { category?: string }).category ?? "",
  );
  const [sort, setSort] = useState<SortOption>(
    ((search as { sort?: string }).sort as SortOption) ?? "default",
  );

  const { data: backendProducts, isLoading } = useGetAllProducts();
  const allProducts =
    backendProducts && backendProducts.length > 0
      ? backendProducts
      : STATIC_PRODUCTS;

  const filteredProducts = useMemo(() => {
    let result = [...allProducts];

    // Filter by search
    if (localSearch.trim()) {
      const q = localSearch.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q),
      );
    }

    // Filter by category
    if (selectedCategory) {
      result = result.filter((p) => p.category === selectedCategory);
    }

    // Sort
    switch (sort) {
      case "price-asc":
        result.sort(
          (a, b) => Number(a.discountedPrice) - Number(b.discountedPrice),
        );
        break;
      case "price-desc":
        result.sort(
          (a, b) => Number(b.discountedPrice) - Number(a.discountedPrice),
        );
        break;
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "discount":
        result.sort(
          (a, b) =>
            getDiscountPercentage(b.price, b.discountedPrice) -
            getDiscountPercentage(a.price, a.discountedPrice),
        );
        break;
    }

    return result;
  }, [allProducts, localSearch, selectedCategory, sort]);

  return (
    <main className="container mx-auto px-4 py-6">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-foreground mb-1">
          {selectedCategory
            ? (STATIC_CATEGORIES.find((c) => c.id === selectedCategory)?.name ??
              "Products")
            : "All Products"}
        </h1>
        <p className="text-muted-foreground text-sm">
          {filteredProducts.length} product
          {filteredProducts.length !== 1 ? "s" : ""} found
        </p>
      </div>

      {/* Filters bar */}
      <div className="bg-white rounded-xl border border-border p-4 mb-6 flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search products..."
            className="pl-9 h-9"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
          />
        </div>

        {/* Category filter */}
        <Select
          value={selectedCategory || "all"}
          onValueChange={(v) => setSelectedCategory(v === "all" ? "" : v)}
        >
          <SelectTrigger className="w-full sm:w-44 h-9">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {STATIC_CATEGORIES.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {CATEGORY_ICONS[cat.id]} {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
          <SelectTrigger className="w-full sm:w-44 h-9">
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Relevance</SelectItem>
            <SelectItem value="price-asc">Price: Low to High</SelectItem>
            <SelectItem value="price-desc">Price: High to Low</SelectItem>
            <SelectItem value="rating">Best Rating</SelectItem>
            <SelectItem value="discount">Best Discount</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Active filters */}
      {(selectedCategory || localSearch) && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {selectedCategory && (
            <Badge
              variant="secondary"
              className="gap-1 cursor-pointer"
              onClick={() => setSelectedCategory("")}
            >
              {STATIC_CATEGORIES.find((c) => c.id === selectedCategory)?.name}
              <X className="w-3 h-3" />
            </Badge>
          )}
          {localSearch && (
            <Badge
              variant="secondary"
              className="gap-1 cursor-pointer"
              onClick={() => setLocalSearch("")}
            >
              "{localSearch}"
              <X className="w-3 h-3" />
            </Badge>
          )}
        </div>
      )}

      {/* Products grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }, (_, i) => `skeleton-${i}`).map((id) => (
            <div
              key={id}
              className="bg-white rounded-xl border border-border overflow-hidden"
            >
              <Skeleton className="aspect-square" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-5 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="font-display font-bold text-xl text-foreground mb-2">
            No products found
          </h3>
          <p className="text-muted-foreground text-sm mb-4">
            Try adjusting your search or filters.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setLocalSearch("");
              setSelectedCategory("");
              setSort("default");
            }}
          >
            Clear all filters
          </Button>
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {filteredProducts.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </main>
  );
}

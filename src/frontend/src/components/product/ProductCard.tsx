import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import type { Product } from "../../backend.d";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import { useAddToCart } from "../../hooks/useQueries";
import { useWishlist } from "../../hooks/useWishlist";
import {
  formatPrice,
  getDiscountPercentage,
  getProductImage,
} from "../../utils/staticData";

interface ProductCardProps {
  product: Product;
  compact?: boolean;
}

export function ProductCard({ product, compact = false }: ProductCardProps) {
  const { identity, login } = useInternetIdentity();
  const addToCart = useAddToCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const wishlisted = isWishlisted(product.id);
  const discountPct = getDiscountPercentage(
    product.price,
    product.discountedPrice,
  );
  const isDiscounted = product.discountedPrice < product.price;
  const imageUrl = getProductImage(product);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!identity) {
      toast.error("Please login to add items to cart");
      login();
      return;
    }
    try {
      await addToCart.mutateAsync({ productId: product.id, quantity: 1n });
      toast.success(`${product.name} added to cart!`);
    } catch {
      toast.error("Failed to add to cart");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="bg-card rounded-xl border border-border shadow-product hover:shadow-product-hover transition-shadow duration-300 overflow-hidden group"
    >
      <Link to="/product/$productId" params={{ productId: product.id }}>
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          {discountPct >= 10 && (
            <Badge className="absolute top-2 left-2 bg-green-600 text-white text-xs font-bold border-0 rounded-md">
              {discountPct}% OFF
            </Badge>
          )}
          {product.stockQuantity === 0n && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white font-bold text-sm bg-black/60 px-3 py-1 rounded-full">
                Out of Stock
              </span>
            </div>
          )}
          {/* Wishlist heart */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleWishlist(product.id);
              toast.success(
                wishlisted ? "Removed from wishlist" : "Added to wishlist!",
              );
            }}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            data-ocid="product.wishlist.toggle"
          >
            <Heart
              className={`w-3.5 h-3.5 transition-colors ${
                wishlisted
                  ? "fill-red-500 text-red-500"
                  : "text-muted-foreground"
              }`}
            />
          </button>
        </div>

        {/* Content */}
        <div className={`p-3 ${compact ? "p-2" : "p-3"}`}>
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium mb-1">
            {product.category}
          </p>
          <h3 className="font-medium text-foreground text-sm line-clamp-2 mb-2 leading-snug">
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1.5 mb-2">
            <div className="flex items-center gap-0.5 bg-green-600 text-white text-xs font-bold px-1.5 py-0.5 rounded">
              <span>{product.rating.toFixed(1)}</span>
              <Star className="w-2.5 h-2.5 fill-white" />
            </div>
            <span className="text-muted-foreground text-xs">
              ({Number(product.reviewCount).toLocaleString("en-IN")})
            </span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="font-display font-bold text-base text-foreground">
              {formatPrice(
                isDiscounted ? product.discountedPrice : product.price,
              )}
            </span>
            {isDiscounted && (
              <span className="text-muted-foreground text-xs line-through">
                {formatPrice(product.price)}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Add to cart button */}
      {!compact && (
        <div className="px-3 pb-3">
          <Button
            className="w-full bg-brand-orange hover:bg-orange-600 text-white font-semibold h-8 text-sm gap-2"
            onClick={handleAddToCart}
            disabled={product.stockQuantity === 0n || addToCart.isPending}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            {addToCart.isPending ? "Adding..." : "Add to Cart"}
          </Button>
        </div>
      )}
    </motion.div>
  );
}

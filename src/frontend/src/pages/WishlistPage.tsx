import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useAddToCart, useGetAllProducts } from "../hooks/useQueries";
import { useWishlist } from "../hooks/useWishlist";
import {
  STATIC_PRODUCTS,
  formatPrice,
  getProductImage,
} from "../utils/staticData";

export function WishlistPage() {
  const { wishlistIds, toggleWishlist } = useWishlist();
  const { data: backendProducts } = useGetAllProducts();
  const { identity, login } = useInternetIdentity();
  const addToCart = useAddToCart();

  const allProducts =
    backendProducts && backendProducts.length > 0
      ? backendProducts
      : STATIC_PRODUCTS;

  const wishlistProducts = allProducts.filter((p) =>
    wishlistIds.includes(p.id),
  );

  const handleAddToCart = async (productId: string, productName: string) => {
    if (!identity) {
      toast.error("Please login to add items to cart");
      login();
      return;
    }
    try {
      await addToCart.mutateAsync({ productId, quantity: 1n });
      toast.success(`${productName} added to cart!`);
    } catch {
      toast.error("Failed to add to cart");
    }
  };

  const handleRemove = (productId: string, productName: string) => {
    toggleWishlist(productId);
    toast.success(`${productName} removed from wishlist`);
  };

  return (
    <main className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
          <Heart className="w-5 h-5 text-red-500 fill-red-500" />
        </div>
        <div>
          <h1 className="font-display font-bold text-2xl">My Wishlist</h1>
          <p className="text-muted-foreground text-sm">
            {wishlistProducts.length}{" "}
            {wishlistProducts.length === 1 ? "item" : "items"} saved
          </p>
        </div>
      </div>

      {wishlistProducts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
          data-ocid="wishlist.empty_state"
        >
          <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <Heart className="w-10 h-10 text-red-200" />
          </div>
          <h2 className="font-display font-bold text-xl mb-2">
            Your wishlist is empty
          </h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
            Save items you love by clicking the heart icon on any product
          </p>
          <Button
            className="bg-brand-orange hover:bg-orange-600 text-white"
            asChild
          >
            <Link to="/products" search={{}}>
              Start Shopping
            </Link>
          </Button>
        </motion.div>
      ) : (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          data-ocid="wishlist.list"
        >
          {wishlistProducts.map((product, i) => {
            const isDiscounted = product.discountedPrice < product.price;
            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="bg-white rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow"
                data-ocid={`wishlist.item.${i + 1}`}
              >
                <Link
                  to="/product/$productId"
                  params={{ productId: product.id }}
                >
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    <img
                      src={getProductImage(product)}
                      alt={product.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                </Link>
                <div className="p-4">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium mb-1">
                    {product.category}
                  </p>
                  <Link
                    to="/product/$productId"
                    params={{ productId: product.id }}
                  >
                    <h3 className="font-medium text-sm line-clamp-2 mb-2 hover:text-brand-orange transition-colors">
                      {product.name}
                    </h3>
                  </Link>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="font-display font-bold text-base">
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
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-brand-orange hover:bg-orange-600 text-white font-semibold h-9 text-sm gap-1.5"
                      onClick={() =>
                        void handleAddToCart(product.id, product.name)
                      }
                      disabled={
                        product.stockQuantity === 0n || addToCart.isPending
                      }
                      data-ocid={`wishlist.cart.button.${i + 1}`}
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      Add to Cart
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
                      onClick={() => handleRemove(product.id, product.name)}
                      data-ocid={`wishlist.delete_button.${i + 1}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </main>
  );
}

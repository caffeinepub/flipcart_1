import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import {
  ChevronRight,
  Heart,
  Loader2,
  MessageSquare,
  Minus,
  Package,
  Plus,
  Share2,
  Shield,
  ShoppingCart,
  Star,
  Truck,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import type { Product } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAddReview,
  useAddToCart,
  useGetProduct,
  useGetReviewsForProduct,
} from "../hooks/useQueries";
import {
  STATIC_PRODUCTS,
  formatPrice,
  getDiscountPercentage,
  getProductImage,
} from "../utils/staticData";

export function ProductDetailPage() {
  const { productId } = useParams({ from: "/product/$productId" });
  const navigate = useNavigate();
  const { identity, login } = useInternetIdentity();
  const { data: backendProduct, isLoading } = useGetProduct(productId);
  const { data: reviews } = useGetReviewsForProduct(productId);
  const addToCart = useAddToCart();
  const addReview = useAddReview();

  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  // Find product: first try backend, then static data
  const product: Product | null =
    backendProduct ?? STATIC_PRODUCTS.find((p) => p.id === productId) ?? null;

  const imageUrl = product ? getProductImage(product) : "";
  // Build image gallery: use actual uploaded images if present, else show the fallback image
  const images = useMemo(() => {
    if (product?.images && product.images.length > 0) {
      const realImages = product.images
        .filter((img) => img.length > 0)
        .map((img) =>
          ExternalBlob.fromBytes(img as Uint8Array<ArrayBuffer>).getDirectURL(),
        );
      if (realImages.length > 0) return realImages;
    }
    return [imageUrl];
  }, [product, imageUrl]);

  const discountPct = product
    ? getDiscountPercentage(product.price, product.discountedPrice)
    : 0;
  const isDiscounted = product
    ? product.discountedPrice < product.price
    : false;

  const handleAddToCart = async () => {
    if (!identity) {
      toast.error("Please login to add items to cart");
      login();
      return;
    }
    if (!product) return;
    try {
      await addToCart.mutateAsync({
        productId: product.id,
        quantity: BigInt(quantity),
      });
      toast.success("Added to cart!");
    } catch {
      toast.error("Failed to add to cart");
    }
  };

  const handleBuyNow = async () => {
    if (!identity) {
      toast.error("Please login first");
      login();
      return;
    }
    if (!product) return;
    await addToCart.mutateAsync({
      productId: product.id,
      quantity: BigInt(quantity),
    });
    void navigate({ to: "/cart" });
  };

  const handleSubmitReview = async () => {
    if (!identity) {
      toast.error("Please login to write a review");
      login();
      return;
    }
    if (!product || !reviewComment.trim()) return;
    try {
      await addReview.mutateAsync({
        productId: product.id,
        rating: BigInt(reviewRating),
        comment: reviewComment,
      });
      toast.success("Review submitted!");
      setReviewComment("");
      setReviewRating(5);
    } catch {
      toast.error("Failed to submit review");
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="grid md:grid-cols-2 gap-8">
          <Skeleton className="aspect-square rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="font-display font-bold text-xl mb-2">
          Product not found
        </h2>
        <Button asChild>
          <Link to="/products" search={{}}>
            Browse Products
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
        <Link to="/" className="hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="w-3 h-3" />
        <Link to="/products" search={{}} className="hover:text-foreground">
          Products
        </Link>
        <ChevronRight className="w-3 h-3" />
        <Link
          to="/products"
          search={{ category: product.category }}
          className="hover:text-foreground capitalize"
        >
          {product.category}
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground font-medium line-clamp-1 max-w-xs">
          {product.name}
        </span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Image gallery */}
        <div className="space-y-3">
          <div className="aspect-square rounded-2xl overflow-hidden bg-muted border border-border">
            <motion.img
              key={selectedImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              src={images[Math.min(selectedImage, images.length - 1)]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {images.map((img, imgIndex) => (
                <button
                  type="button"
                  key={img}
                  onClick={() => setSelectedImage(imgIndex)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === imgIndex
                      ? "border-brand-orange"
                      : "border-border hover:border-muted-foreground"
                  }`}
                >
                  <img
                    src={img}
                    alt={`View ${imgIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div>
          <p className="text-muted-foreground text-sm uppercase tracking-wider mb-2 font-medium">
            {product.category}
          </p>
          <h1 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-3 leading-tight">
            {product.name}
          </h1>

          {/* Rating */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-1.5 bg-green-600 text-white text-sm font-bold px-2.5 py-1 rounded-lg">
              <span>{product.rating.toFixed(1)}</span>
              <Star className="w-3.5 h-3.5 fill-white" />
            </div>
            <span className="text-muted-foreground text-sm">
              {Number(product.reviewCount).toLocaleString("en-IN")} ratings
            </span>
            <Separator orientation="vertical" className="h-4" />
            <span className="text-sm text-green-600 font-medium">
              {product.stockQuantity > 0n
                ? `${Number(product.stockQuantity)} in stock`
                : "Out of Stock"}
            </span>
          </div>

          {/* Price */}
          <div className="bg-muted rounded-xl p-4 mb-6">
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="font-display font-bold text-3xl text-foreground">
                {formatPrice(
                  isDiscounted ? product.discountedPrice : product.price,
                )}
              </span>
              {isDiscounted && (
                <>
                  <span className="text-muted-foreground text-lg line-through">
                    {formatPrice(product.price)}
                  </span>
                  <Badge className="bg-green-600 text-white border-0 font-bold">
                    {discountPct}% OFF
                  </Badge>
                </>
              )}
            </div>
            {isDiscounted && (
              <p className="text-green-600 text-sm mt-1 font-medium">
                You save {formatPrice(product.price - product.discountedPrice)}
              </p>
            )}
          </div>

          {/* Quantity */}
          <div className="flex items-center gap-4 mb-5">
            <span className="text-sm font-medium">Quantity:</span>
            <div className="flex items-center border border-border rounded-lg overflow-hidden">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-none"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus className="w-3.5 h-3.5" />
              </Button>
              <span className="w-10 text-center text-sm font-bold">
                {quantity}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-none"
                onClick={() =>
                  setQuantity(
                    Math.min(Number(product.stockQuantity), quantity + 1),
                  )
                }
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex gap-3 mb-6">
            <Button
              className="flex-1 bg-brand-orange hover:bg-orange-600 text-white font-bold h-12 gap-2 text-base"
              onClick={handleAddToCart}
              disabled={product.stockQuantity === 0n || addToCart.isPending}
            >
              {addToCart.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShoppingCart className="w-5 h-5" />
              )}
              Add to Cart
            </Button>
            <Button
              className="flex-1 bg-brand-navy hover:bg-blue-950 text-white font-bold h-12 gap-2 text-base"
              onClick={() => void handleBuyNow()}
              disabled={product.stockQuantity === 0n}
            >
              <Zap className="w-5 h-5" />
              Buy Now
            </Button>
          </div>

          {/* Delivery info */}
          <div className="space-y-3 mb-6">
            {[
              { icon: Truck, text: "Free delivery on orders above ₹499" },
              { icon: Shield, text: "Secure payment, 100% safe" },
              { icon: Package, text: "Easy 30-day returns" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3 text-sm">
                <item.icon className="w-4 h-4 text-brand-orange" />
                <span className="text-muted-foreground">{item.text}</span>
              </div>
            ))}
          </div>

          {/* Share / Wishlist */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Heart className="w-4 h-4" /> Wishlist
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => {
                const shareData = {
                  title: product.name,
                  text: `Check out ${product.name} for ${formatPrice(isDiscounted ? product.discountedPrice : product.price)}!`,
                  url: window.location.href,
                };
                if (navigator.share) {
                  void navigator.share(shareData);
                } else {
                  void navigator.clipboard
                    .writeText(window.location.href)
                    .then(() => {
                      toast.success("Link copied to clipboard!");
                    });
                }
              }}
            >
              <Share2 className="w-4 h-4" /> Share
            </Button>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white rounded-2xl border border-border p-6 mb-8">
        <h2 className="font-display font-bold text-xl mb-4">
          Product Description
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          {product.description}
        </p>
      </div>

      {/* Reviews */}
      <div className="bg-white rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-bold text-xl flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-brand-orange" />
            Customer Reviews
          </h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{reviews?.length ?? 0} reviews</span>
          </div>
        </div>

        {/* Review list */}
        {reviews && reviews.length > 0 ? (
          <div className="space-y-4 mb-8">
            {reviews.map((review) => (
              <div
                key={review.userId.toString()}
                className="border-b border-border pb-4 last:border-0"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-1 bg-green-600 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                    {Number(review.rating)}{" "}
                    <Star className="w-2.5 h-2.5 fill-white" />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {review.userId.toString().slice(0, 10)}...
                  </span>
                </div>
                <p className="text-sm text-foreground">{review.comment}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground mb-8">
            <Star className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No reviews yet. Be the first to review!</p>
          </div>
        )}

        {/* Add review form */}
        <div className="border-t border-border pt-6">
          <h3 className="font-semibold text-base mb-4">Write a Review</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium mb-2">Your Rating</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setReviewRating(star)}
                    className="text-2xl"
                  >
                    <Star
                      className={`w-6 h-6 transition-colors ${
                        star <= reviewRating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <Textarea
              placeholder="Share your experience with this product..."
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <Button
              onClick={() => void handleSubmitReview()}
              disabled={!reviewComment.trim() || addReview.isPending}
              className="bg-brand-navy hover:bg-blue-950 text-white"
            >
              {addReview.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Submit Review
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}

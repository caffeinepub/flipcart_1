import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  ChevronRight,
  Clock,
  LayoutDashboard,
  RotateCcw,
  Shield,
  Star,
  TrendingUp,
  Truck,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { ProductCard } from "../components/product/ProductCard";
import { useGetAllProducts, useIsCallerAdmin } from "../hooks/useQueries";
import {
  CATEGORY_ICONS,
  STATIC_CATEGORIES,
  STATIC_PRODUCTS,
  formatPrice,
  getDiscountPercentage,
  getProductImage,
} from "../utils/staticData";

const HERO_SLIDES = [
  {
    title: "Massive Sale on Electronics",
    subtitle: "Up to 60% off on smartphones, laptops & more",
    badge: "Limited Time Deal",
    cta: "Shop Electronics",
    ctaLink: "/products?category=electronics",
    color: "from-brand-navy via-blue-900 to-indigo-900",
  },
  {
    title: "Fashion for Every Occasion",
    subtitle: "New arrivals in men's & women's fashion — starting ₹299",
    badge: "New Collection",
    cta: "Explore Fashion",
    ctaLink: "/products?category=fashion",
    color: "from-orange-900 via-orange-800 to-amber-900",
  },
  {
    title: "Transform Your Home",
    subtitle: "Premium furniture & decor with free delivery",
    badge: "Free Delivery",
    cta: "Shop Home",
    ctaLink: "/products?category=home-furniture",
    color: "from-emerald-900 via-teal-900 to-cyan-900",
  },
];

export function HomePage() {
  const navigate = useNavigate();
  const { data: backendProducts } = useGetAllProducts();
  const { data: isAdmin } = useIsCallerAdmin();
  const [heroIndex, setHeroIndex] = useState(0);

  // Use backend products if available, fall back to static
  const products =
    backendProducts && backendProducts.length > 0
      ? backendProducts
      : STATIC_PRODUCTS;

  const featuredProducts = products.slice(0, 8);
  const dealsProducts = products
    .filter((p) => getDiscountPercentage(p.price, p.discountedPrice) >= 10)
    .slice(0, 6);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main>
      {/* Hero Banner */}
      <section className="relative overflow-hidden">
        <div
          className={`bg-gradient-to-r ${HERO_SLIDES[heroIndex].color} text-white min-h-[280px] md:min-h-[380px] flex items-center transition-all duration-700`}
        >
          {/* Background image overlay */}
          <div className="absolute inset-0 opacity-15">
            <img
              src="/assets/generated/hero-banner.dim_1200x450.jpg"
              alt=""
              className="w-full h-full object-cover"
            />
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-xl">
              <motion.div
                key={heroIndex}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Badge className="bg-brand-orange text-white border-0 mb-4 font-semibold">
                  <Zap className="w-3 h-3 mr-1" />
                  {HERO_SLIDES[heroIndex].badge}
                </Badge>
                <h1 className="font-display font-bold text-3xl md:text-5xl leading-tight mb-3">
                  {HERO_SLIDES[heroIndex].title}
                </h1>
                <p className="text-white/80 text-base md:text-lg mb-6">
                  {HERO_SLIDES[heroIndex].subtitle}
                </p>
                <Button
                  className="bg-brand-orange hover:bg-orange-500 text-white font-semibold px-6 h-11 gap-2"
                  onClick={() =>
                    void navigate({
                      to: "/products",
                      search: {
                        category:
                          HERO_SLIDES[heroIndex].ctaLink
                            .split("category=")[1]
                            ?.split("&")[0] ?? undefined,
                      },
                    })
                  }
                >
                  {HERO_SLIDES[heroIndex].cta}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </motion.div>
            </div>
          </div>

          {/* Slide indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {HERO_SLIDES.map((slide, i) => (
              <button
                type="button"
                key={slide.title}
                onClick={() => setHeroIndex(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === heroIndex ? "bg-white w-6" : "bg-white/40"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Admin Quick Access Banner — sirf admin users ko dikhega */}
      {isAdmin && (
        <section className="bg-gradient-to-r from-brand-navy to-blue-900 border-b border-blue-800">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-white/80 text-sm">
              <LayoutDashboard className="w-4 h-4 text-brand-orange flex-shrink-0" />
              <span>
                Admin hain? Products, orders aur categories manage karein
              </span>
            </div>
            <Button
              asChild
              size="sm"
              className="bg-brand-orange hover:bg-orange-500 text-white font-semibold gap-2 flex-shrink-0"
            >
              <Link to="/admin">
                <LayoutDashboard className="w-4 h-4" />
                Admin Dashboard
              </Link>
            </Button>
          </div>
        </section>
      )}

      {/* Trust Signals */}
      <section className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                icon: Truck,
                label: "Free Delivery",
                sub: "On orders above ₹499",
              },
              {
                icon: RotateCcw,
                label: "Easy Returns",
                sub: "30-day return policy",
              },
              {
                icon: Shield,
                label: "Secure Payment",
                sub: "100% safe checkout",
              },
              {
                icon: Clock,
                label: "24/7 Support",
                sub: "Always here to help",
              },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-brand-orange-light flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-4 h-4 text-brand-orange" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">
                    {item.label}
                  </p>
                  <p className="text-muted-foreground text-xs">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Category Grid */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-xl md:text-2xl text-foreground">
            Shop by Category
          </h2>
          <Link
            to="/products"
            search={{}}
            className="text-brand-orange text-sm font-medium hover:underline flex items-center gap-1"
          >
            All Categories <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-3">
          {STATIC_CATEGORIES.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                key={cat.id}
                to="/products"
                search={{ category: cat.id }}
                className="flex flex-col items-center gap-2 p-2 md:p-3 rounded-xl bg-white border border-border hover:border-brand-orange hover:shadow-md transition-all group"
              >
                <span className="text-2xl md:text-3xl">
                  {CATEGORY_ICONS[cat.id]}
                </span>
                <span className="text-xs font-medium text-center text-foreground group-hover:text-brand-orange transition-colors leading-tight">
                  {cat.name}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Deals of the Day */}
      {dealsProducts.length > 0 && (
        <section className="bg-gradient-to-r from-orange-50 to-amber-50 py-8">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-brand-orange rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-xl text-foreground">
                    Deals of the Day
                  </h2>
                  <p className="text-muted-foreground text-xs">
                    Limited time offers — don't miss out!
                  </p>
                </div>
              </div>
              <Link
                to="/products"
                search={{ sort: "discount" }}
                className="text-brand-orange text-sm font-medium hover:underline flex items-center gap-1"
              >
                See All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {dealsProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-navy rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <h2 className="font-display font-bold text-xl text-foreground">
              Trending Products
            </h2>
          </div>
          <Link
            to="/products"
            search={{}}
            className="text-brand-orange text-sm font-medium hover:underline flex items-center gap-1"
          >
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Banner CTA */}
      <section className="container mx-auto px-4 pb-8">
        <div className="bg-gradient-to-r from-brand-navy to-blue-900 rounded-2xl p-8 md:p-12 text-white relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10">
            <div className="w-full h-full bg-white/30 rounded-l-full" />
          </div>
          <div className="relative z-10 max-w-md">
            <Badge className="bg-brand-orange text-white border-0 mb-3">
              <Star className="w-3 h-3 mr-1" /> New Arrivals
            </Badge>
            <h2 className="font-display font-bold text-2xl md:text-3xl mb-3">
              Discover the Latest Collections
            </h2>
            <p className="text-white/70 mb-6 text-sm">
              Fresh styles, trending gadgets, and home essentials — all in one
              place.
            </p>
            <Button
              className="bg-brand-orange hover:bg-orange-500 text-white font-semibold gap-2"
              asChild
            >
              <Link to="/products" search={{}}>
                Explore Now <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}

import { Link } from "@tanstack/react-router";
import { Package } from "lucide-react";
import { SiFacebook, SiInstagram, SiX, SiYoutube } from "react-icons/si";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-brand-navy text-white mt-12">
      {/* Main footer content */}
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-brand-orange rounded-md flex items-center justify-center">
                <Package className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-lg">ShopExpo</span>
            </div>
            <p className="text-white/60 text-sm leading-relaxed">
              India's trusted e-commerce platform for electronics, fashion, home
              & more.
            </p>
            <div className="flex gap-3 mt-4">
              <button
                type="button"
                className="text-white/60 hover:text-brand-orange transition-colors"
              >
                <SiFacebook className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="text-white/60 hover:text-brand-orange transition-colors"
              >
                <SiX className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="text-white/60 hover:text-brand-orange transition-colors"
              >
                <SiInstagram className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="text-white/60 hover:text-brand-orange transition-colors"
              >
                <SiYoutube className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-display font-semibold text-sm uppercase tracking-wider text-white/80 mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2">
              {[
                { label: "Home", to: "/" as const },
                { label: "My Orders", to: "/orders" as const },
                { label: "My Account", to: "/account" as const },
                { label: "Cart", to: "/cart" as const },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    className="text-white/60 hover:text-white text-sm transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  to="/products"
                  search={{}}
                  className="text-white/60 hover:text-white text-sm transition-colors"
                >
                  Products
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-display font-semibold text-sm uppercase tracking-wider text-white/80 mb-4">
              Categories
            </h3>
            <ul className="space-y-2">
              {[
                { label: "Electronics", category: "electronics" },
                { label: "Fashion", category: "fashion" },
                { label: "Home & Furniture", category: "home-furniture" },
                { label: "Sports", category: "sports" },
                { label: "Books", category: "books" },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    to="/products"
                    search={{ category: item.category }}
                    className="text-white/60 hover:text-white text-sm transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-display font-semibold text-sm uppercase tracking-wider text-white/80 mb-4">
              Customer Support
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/faq"
                  className="text-white/60 hover:text-white text-sm transition-colors"
                >
                  FAQ / Help Center
                </Link>
              </li>
              <li>
                <Link
                  to="/orders"
                  className="text-white/60 hover:text-white text-sm transition-colors"
                >
                  Track Order
                </Link>
              </li>
              <li>
                <span className="text-white/60 hover:text-white text-sm transition-colors cursor-pointer">
                  Return Policy
                </span>
              </li>
              <li>
                <span className="text-white/60 hover:text-white text-sm transition-colors cursor-pointer">
                  Payment Options
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-white/50 text-sm">
            © {currentYear} ShopExpo. All rights reserved.
          </p>
          <div className="flex gap-4 text-white/50 text-xs">
            <Link to="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
            <Link to="/faq" className="hover:text-white transition-colors">
              FAQ
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

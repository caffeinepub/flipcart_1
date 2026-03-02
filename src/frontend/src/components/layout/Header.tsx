import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  ChevronDown,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Search,
  Settings,
  ShoppingCart,
  User,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import { useGetCart } from "../../hooks/useQueries";
import { useIsCallerAdmin } from "../../hooks/useQueries";

export function Header() {
  const navigate = useNavigate();
  const { identity, login, clear, isLoggingIn, isInitializing } =
    useInternetIdentity();
  const { data: cart } = useGetCart();
  const { data: isAdmin } = useIsCallerAdmin();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const cartCount = cart?.length ?? 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      void navigate({
        to: "/products",
        search: { q: searchQuery, category: undefined, sort: undefined },
      });
    }
  };

  const isLoggedIn = !!identity;

  return (
    <header className="sticky top-0 z-50 shadow-nav">
      {/* Top bar */}
      <div className="bg-brand-navy text-white">
        <div className="container mx-auto">
          <div className="flex items-center gap-4 py-2.5 px-4">
            {/* Logo */}
            <Link to="/" className="flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-brand-orange rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <span className="font-display font-bold text-xl text-white tracking-tight">
                  ShopEasy
                </span>
              </div>
            </Link>

            {/* Search bar */}
            <form
              onSubmit={handleSearch}
              className="flex-1 max-w-2xl hidden sm:flex"
            >
              <div className="flex w-full">
                <Input
                  type="search"
                  placeholder="Search for products, brands and more"
                  className="rounded-r-none border-0 bg-white text-foreground focus-visible:ring-0 h-10 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button
                  type="submit"
                  className="rounded-l-none bg-brand-orange hover:bg-orange-600 h-10 px-4 border-0"
                >
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </form>

            {/* Right actions */}
            <div className="flex items-center gap-1 ml-auto sm:ml-0">
              {/* Account */}
              {isLoggedIn ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="text-white hover:bg-white/10 gap-1.5 h-10 px-3"
                    >
                      <User className="w-4 h-4" />
                      <span className="hidden md:inline text-sm font-medium">
                        Account
                      </span>
                      <ChevronDown className="w-3 h-3 hidden md:inline" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuItem asChild>
                      <Link to="/account">
                        <User className="w-4 h-4 mr-2" />
                        My Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/orders">
                        <Package className="w-4 h-4 mr-2" />
                        My Orders
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/wishlist">
                        <Heart className="w-4 h-4 mr-2" />
                        Wishlist
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to="/admin">
                            <Settings className="w-4 h-4 mr-2" />
                            Admin Dashboard
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={clear}
                      className="text-destructive focus:text-destructive"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  variant="ghost"
                  className="text-white hover:bg-white/10 gap-1.5 h-10 px-3"
                  onClick={login}
                  disabled={isLoggingIn || isInitializing}
                >
                  <User className="w-4 h-4" />
                  <span className="hidden md:inline text-sm font-medium">
                    {isLoggingIn ? "Logging in..." : "Login"}
                  </span>
                </Button>
              )}

              {/* Admin Dashboard button */}
              {isLoggedIn && isAdmin && (
                <Button
                  className="bg-brand-orange hover:bg-orange-600 text-white gap-1.5 h-10 px-3 font-semibold shadow-sm"
                  asChild
                >
                  <Link to="/admin">
                    <LayoutDashboard className="w-4 h-4" />
                    <span className="hidden md:inline text-sm">Admin</span>
                  </Link>
                </Button>
              )}

              {/* Cart */}
              <Button
                variant="ghost"
                className="text-white hover:bg-white/10 gap-1.5 h-10 px-3 relative"
                asChild
              >
                <Link to="/cart">
                  <div className="relative">
                    <ShoppingCart className="w-5 h-5" />
                    {cartCount > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center bg-brand-orange text-white text-[10px] font-bold rounded-full border-0">
                        {cartCount > 9 ? "9+" : cartCount}
                      </Badge>
                    )}
                  </div>
                  <span className="hidden md:inline text-sm font-medium">
                    Cart
                  </span>
                </Link>
              </Button>

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                className="text-white hover:bg-white/10 sm:hidden h-10 w-10 p-0"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile search */}
          <div className="sm:hidden px-4 pb-2.5">
            <form onSubmit={handleSearch} className="flex">
              <Input
                type="search"
                placeholder="Search products..."
                className="rounded-r-none border-0 bg-white text-foreground focus-visible:ring-0 h-9 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button
                type="submit"
                className="rounded-l-none bg-brand-orange hover:bg-orange-600 h-9 px-3 border-0"
              >
                <Search className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Category nav bar */}
      <div className="bg-white border-b hidden md:block">
        <div className="container mx-auto px-4">
          <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-1.5">
            {[
              { label: "Electronics", search: { category: "electronics" } },
              { label: "Fashion", search: { category: "fashion" } },
              {
                label: "Home & Furniture",
                search: { category: "home-furniture" },
              },
              { label: "Sports", search: { category: "sports" } },
              { label: "Books", search: { category: "books" } },
              { label: "Beauty", search: { category: "beauty" } },
              { label: "Deals", search: { sort: "discount" } },
            ].map((item) => (
              <Link
                key={item.label}
                to="/products"
                search={item.search}
                className="flex-shrink-0 px-3 py-1.5 text-sm font-medium text-foreground hover:text-brand-orange transition-colors rounded-md hover:bg-brand-orange-light"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="sm:hidden bg-white border-b shadow-lg"
          >
            <nav className="container mx-auto px-4 py-3 flex flex-col gap-2">
              {[
                { label: "Electronics", search: { category: "electronics" } },
                { label: "Fashion", search: { category: "fashion" } },
                {
                  label: "Home & Furniture",
                  search: { category: "home-furniture" },
                },
                { label: "Sports", search: { category: "sports" } },
                { label: "Deals of the Day", search: { sort: "discount" } },
              ].map((item) => (
                <Link
                  key={item.label}
                  to="/products"
                  search={item.search}
                  className="py-2 px-3 text-sm font-medium hover:bg-muted rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              {isLoggedIn && isAdmin && (
                <>
                  <div className="border-t my-1" />
                  <Link
                    to="/admin"
                    className="py-2 px-3 text-sm font-semibold text-brand-orange hover:bg-orange-50 rounded-md flex items-center gap-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Admin Dashboard
                  </Link>
                </>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

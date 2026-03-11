import { useGetCart } from "@/hooks/useQueries";
import { Link, useRouterState } from "@tanstack/react-router";
import { Grid3X3, Home, Package, ShoppingCart, User } from "lucide-react";

const tabs = [
  { path: "/", label: "Home", icon: Home, ocid: "bottomnav.home.link" },
  {
    path: "/products",
    label: "Categories",
    icon: Grid3X3,
    ocid: "bottomnav.categories.link",
  },
  {
    path: "/cart",
    label: "Cart",
    icon: ShoppingCart,
    ocid: "bottomnav.cart.link",
  },
  {
    path: "/orders",
    label: "Orders",
    icon: Package,
    ocid: "bottomnav.orders.link",
  },
  {
    path: "/account",
    label: "Account",
    icon: User,
    ocid: "bottomnav.account.link",
  },
];

export function BottomNav() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { data: cartItems } = useGetCart();
  const cartCount = cartItems?.length ?? 0;

  return (
    <nav
      className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border shadow-[0_-2px_12px_rgba(0,0,0,0.08)]"
      style={{ height: "56px" }}
      data-ocid="bottomnav.panel"
    >
      <div className="flex items-stretch h-full">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            tab.path === "/"
              ? currentPath === "/"
              : currentPath.startsWith(tab.path);

          return (
            <Link
              key={tab.path}
              to={tab.path}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-colors"
              data-ocid={tab.ocid}
            >
              <span className="relative">
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.2 : 1.7}
                  className={
                    isActive ? "text-brand-orange" : "text-muted-foreground"
                  }
                />
                {tab.path === "/cart" && cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 bg-brand-orange text-white text-[9px] font-bold rounded-full flex items-center justify-center px-[3px] leading-none">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </span>
              <span
                className={`text-[10px] font-medium leading-none ${
                  isActive ? "text-brand-orange" : "text-muted-foreground"
                }`}
              >
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[2px] rounded-b-full bg-brand-orange" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

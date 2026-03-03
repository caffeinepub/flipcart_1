import { useCallback, useEffect, useState } from "react";

const WISHLIST_KEY = "shopexpo_wishlist";

function getWishlistFromStorage(): string[] {
  try {
    const stored = localStorage.getItem(WISHLIST_KEY);
    return stored ? (JSON.parse(stored) as string[]) : [];
  } catch {
    return [];
  }
}

export function useWishlist() {
  const [wishlistIds, setWishlistIds] = useState<string[]>(() =>
    getWishlistFromStorage(),
  );

  // Keep state in sync with localStorage across tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === WISHLIST_KEY) {
        setWishlistIds(getWishlistFromStorage());
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const toggleWishlist = useCallback((productId: string) => {
    setWishlistIds((prev) => {
      const next = prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId];
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isWishlisted = useCallback(
    (productId: string) => wishlistIds.includes(productId),
    [wishlistIds],
  );

  return { wishlistIds, toggleWishlist, isWishlisted };
}

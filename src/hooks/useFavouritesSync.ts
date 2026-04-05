"use client";

import { useEffect, useState } from "react";
import { FAVOURITES_CHANGED_EVENT } from "@/lib/favourites";

/**
 * Re-renders the host when favourites change (API sync / My Favorites remove, etc.)
 * so isFieldFavourite() is re-evaluated for heart UI.
 */
export function useFavouritesSync(): void {
  const [, setTick] = useState(0);
  useEffect(() => {
    const bump = () => setTick((n) => n + 1);
    window.addEventListener(FAVOURITES_CHANGED_EVENT, bump);
    return () => {
      window.removeEventListener(FAVOURITES_CHANGED_EVENT, bump);
    };
  }, []);
}

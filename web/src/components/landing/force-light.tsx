"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Forces light theme while on the landing page.
 *  The app (Navbar) re-applies the saved preference on mount. */
export function ForceLight() {
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, [pathname]);

  return null;
}

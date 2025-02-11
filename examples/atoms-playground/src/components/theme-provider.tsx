"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export function ThemeProvider() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const isLight = searchParams.get("theme") === "light";
    if (isLight) {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }
  }, [searchParams]);

  return null;
}

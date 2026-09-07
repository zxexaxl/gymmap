"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { sendGa4PageView } from "@/lib/analytics/ga4";

export function Ga4PageView() {
  const pathname = usePathname();
  const lastTrackedPathname = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || lastTrackedPathname.current === pathname) {
      return;
    }

    lastTrackedPathname.current = pathname;
    sendGa4PageView(pathname);
  }, [pathname]);

  return null;
}

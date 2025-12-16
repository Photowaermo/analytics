"use client";

import { useParams, useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { AnalyticsMode, validModes, pagesByMode } from "@/lib/mode-context";

export default function ModeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();

  const modeParam = params.mode as string;
  const isValidMode = validModes.includes(modeParam as AnalyticsMode);

  // Extract the page name from pathname (e.g., /ads/funnel -> funnel)
  const pathParts = pathname.split("/").filter(Boolean);
  const currentPage = pathParts.length > 1 ? pathParts[1] : "";

  // Redirect if invalid mode
  useEffect(() => {
    if (!isValidMode) {
      router.replace("/all");
    }
  }, [isValidMode, router]);

  // Redirect if page not available in mode
  useEffect(() => {
    if (isValidMode) {
      const mode = modeParam as AnalyticsMode;
      const validPages = pagesByMode[mode];
      if (!validPages.includes(currentPage)) {
        router.replace(`/${mode}`);
      }
    }
  }, [isValidMode, modeParam, currentPage, router]);

  if (!isValidMode) {
    return null;
  }

  return <>{children}</>;
}

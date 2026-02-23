"use client";

import { useView } from "@/lib/view-context";
import { SellerPage } from "@/components/seller/seller-page";

export function ViewContainer({ children }: { children: React.ReactNode }) {
  const { view } = useView();

  return (
    <main className="p-4 lg:p-6">
      {view === "seller" ? <SellerPage /> : children}
    </main>
  );
}

"use client";

import { useView } from "@/lib/view-context";
import { SellerPage } from "@/components/seller/seller-page";
import { UncontactedPage } from "@/components/seller/uncontacted-page";
import { DuplicatesPage } from "@/components/seller/duplicates-page";
import { StalePage } from "@/components/seller/stale-page";
import { ResponseTimesPage } from "@/components/seller/response-times-page";
import { KanbanChangesPage } from "@/components/seller/kanban-changes-page";
import { KamMismatchesPage } from "@/components/seller/kam-mismatches-page";

export function ViewContainer({ children }: { children: React.ReactNode }) {
  const { view, sellerPage } = useView();

  if (view === "seller") {
    return (
      <main className="p-4 lg:p-6">
        {sellerPage === "uncontacted" ? <UncontactedPage /> :
         sellerPage === "duplicates" ? <DuplicatesPage /> :
         sellerPage === "stale" ? <StalePage /> :
         sellerPage === "response-times" ? <ResponseTimesPage /> :
         sellerPage === "kanban-changes" ? <KanbanChangesPage /> :
         sellerPage === "kam-mismatches" ? <KamMismatchesPage /> :
         <SellerPage />}
      </main>
    );
  }

  return <main className="p-4 lg:p-6">{children}</main>;
}

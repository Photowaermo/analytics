"use client";

import { useView } from "@/lib/view-context";
import { cn } from "@/lib/utils";
import { BarChart3, UserCheck } from "lucide-react";

export function ViewToggle() {
  const { view, setView } = useView();
  const isSeller = view === "seller";

  return (
    <div
      className={cn(
        "relative flex items-center rounded-full p-0.5 transition-colors duration-500 w-full",
        isSeller ? "bg-indigo-500/20" : "bg-gray-200/70"
      )}
    >
      <button
        onClick={() => setView("analytics")}
        className={cn(
          "relative z-10 flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-300 flex-1",
          !isSeller
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-400 hover:text-gray-300"
        )}
      >
        <BarChart3 className="h-3.5 w-3.5" />
        Analytics
      </button>
      <button
        onClick={() => setView("seller")}
        className={cn(
          "relative z-10 flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-300 flex-1",
          isSeller
            ? "bg-indigo-500 text-white shadow-sm"
            : "text-gray-400 hover:text-gray-600"
        )}
      >
        <UserCheck className="h-3.5 w-3.5" />
        Seller
      </button>
    </div>
  );
}

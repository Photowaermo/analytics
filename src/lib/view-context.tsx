"use client";

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";

export type AppView = "analytics" | "seller";
export type SellerSubPage = "performance" | "uncontacted" | "duplicates" | "stale" | "response-times" | "kanban-changes" | "kam-mismatches";

interface ViewContextType {
  view: AppView;
  setView: (view: AppView) => void;
  toggleView: () => void;
  sellerPage: SellerSubPage;
  setSellerPage: (page: SellerSubPage) => void;
}

const ViewContext = createContext<ViewContextType | undefined>(undefined);

function getInitialView(): AppView {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("app-view");
    if (stored === "seller" || stored === "analytics") return stored;
  }
  return "analytics";
}

export function ViewProvider({ children }: { children: ReactNode }) {
  const [view, setViewState] = useState<AppView>(getInitialView);
  const [sellerPage, setSellerPageState] = useState<SellerSubPage>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("seller-page");
      if (["performance", "uncontacted", "duplicates", "stale", "response-times", "kanban-changes", "kam-mismatches"].includes(stored!)) return stored as SellerSubPage;
    }
    return "performance";
  });
  const prevView = useRef<AppView>(view);

  const setView = (v: AppView) => {
    localStorage.setItem("app-view", v);
    setViewState(v);
  };

  const setSellerPage = (page: SellerSubPage) => {
    localStorage.setItem("seller-page", page);
    setSellerPageState(page);
  };

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    if (view === "seller") {
      html.setAttribute("data-view", "seller");
      body.classList.remove("was-seller");
    } else {
      html.removeAttribute("data-view");
      // Add exit animation class if we're coming from seller
      if (prevView.current === "seller") {
        body.classList.add("was-seller");
        const timer = setTimeout(() => body.classList.remove("was-seller"), 800);
        return () => clearTimeout(timer);
      }
    }

    prevView.current = view;
  }, [view]);

  const toggleView = () => {
    const next = view === "analytics" ? "seller" : "analytics";
    setView(next);
  };

  return (
    <ViewContext.Provider value={{ view, setView, toggleView, sellerPage, setSellerPage }}>
      {children}
    </ViewContext.Provider>
  );
}

export function useView() {
  const context = useContext(ViewContext);
  if (!context) {
    throw new Error("useView must be used within ViewProvider");
  }
  return context;
}

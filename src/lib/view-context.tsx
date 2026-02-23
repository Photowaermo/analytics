"use client";

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";

export type AppView = "analytics" | "seller";

interface ViewContextType {
  view: AppView;
  setView: (view: AppView) => void;
  toggleView: () => void;
}

const ViewContext = createContext<ViewContextType | undefined>(undefined);

export function ViewProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<AppView>("analytics");
  const prevView = useRef<AppView>("analytics");

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
    setView((prev) => (prev === "analytics" ? "seller" : "analytics"));
  };

  return (
    <ViewContext.Provider value={{ view, setView, toggleView }}>
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

"use client";

import { createContext, useContext, ReactNode } from "react";

/**
 * Legacy-Shim: Die Seller-Sicht ist nach seller.photowaermo.de umgezogen.
 * Dieser Provider behält die useView-API für Bestandskomponenten, liefert
 * aber dauerhaft "analytics" — kein Toggle, kein Seller-Subpage-State.
 */
const ViewContext = createContext<{ view: "analytics" }>({ view: "analytics" });

export function ViewProvider({ children }: { children: ReactNode }) {
  return (
    <ViewContext.Provider value={{ view: "analytics" }}>
      {children}
    </ViewContext.Provider>
  );
}

export function useView() {
  return useContext(ViewContext);
}

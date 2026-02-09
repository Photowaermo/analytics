"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export type ProductFilter = "all" | "pv" | "heatpump" | "kombi" | "unknown";

interface ProductContextType {
    product: ProductFilter;
    setProduct: (product: ProductFilter) => void;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const productConfig: Record<ProductFilter, { label: string; description: string }> = {
    all: {
        label: "Alle Produkte",
        description: "Alle Leads anzeigen",
    },
    pv: {
        label: "PV / Solar",
        description: "Nur Photovoltaik",
    },
    heatpump: {
        label: "Wärmepumpe",
        description: "Nur Wärmepumpen",
    },
    kombi: {
        label: "Kombi",
        description: "PV + Wärmepumpe",
    },
    unknown: {
        label: "Nicht kategorisiert",
        description: "Ohne Produktzuordnung",
    },
};

interface ProductProviderProps {
    children: ReactNode;
}

export function ProductProvider({ children }: ProductProviderProps) {
    const [product, setProduct] = useState<ProductFilter>("all");

    return (
        <ProductContext.Provider value={{ product, setProduct }}>
            {children}
        </ProductContext.Provider>
    );
}

export function useProduct() {
    const context = useContext(ProductContext);
    if (!context) {
        throw new Error("useProduct must be used within a ProductProvider");
    }
    return context;
}

// Helper to get API param value (null for "all")
export function getProductParam(product: ProductFilter): string | null {
    return product === "all" ? null : product;
}

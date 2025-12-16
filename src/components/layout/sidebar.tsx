"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Filter,
  Route,
  Target,
  DollarSign,
  Activity,
  Settings,
  Menu,
  X,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMode, AnalyticsMode } from "@/lib/mode-context";

// Navigation items per mode (relative paths within mode)
const navItemsByMode: Record<AnalyticsMode, { path: string; label: string; icon: typeof LayoutDashboard }[]> = {
  all: [
    { path: "", label: "Übersicht", icon: LayoutDashboard },
    { path: "leads", label: "Neueste Leads", icon: Users },
  ],
  ads: [
    { path: "", label: "Übersicht", icon: LayoutDashboard },
    { path: "funnel", label: "Website-Funnel", icon: Filter },
    { path: "journeys", label: "Lead-Verlauf", icon: Route },
    { path: "attribution", label: "Attribution", icon: Target },
    { path: "costs", label: "Kosten & ROAS", icon: DollarSign },
  ],
  purchased: [
    { path: "", label: "Übersicht", icon: LayoutDashboard },
  ],
  organic: [
    { path: "", label: "Übersicht", icon: LayoutDashboard },
    { path: "funnel", label: "Website-Funnel", icon: Filter },
    { path: "journeys", label: "Lead-Verlauf", icon: Route },
  ],
};

// Shared navigation items (always visible, absolute paths)
const sharedNavItems = [
  { href: "/health", label: "Systemstatus", icon: Activity },
  { href: "/settings", label: "Einstellungen", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { mode } = useMode();

  const modeNavItems = navItemsByMode[mode];

  // Build full href for mode items
  const getFullHref = (path: string) => `/${mode}${path ? `/${path}` : ""}`;

  // Check if a mode item is active
  const isModeItemActive = (path: string) => {
    const fullHref = getFullHref(path);
    return pathname === fullHref;
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-white shadow-md border border-gray-200"
        aria-label="Menü öffnen"
      >
        <Menu className="h-5 w-5 text-gray-600" />
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-64 border-r border-gray-200 bg-white transition-transform duration-200 ease-in-out",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-6">
          <div className="flex items-center">
            <Image src="/Logo.png" alt="Logo" width={32} height={32} className="h-8 w-auto" />
            <span className="ml-3 text-lg font-semibold text-gray-900">Analytics</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-1 rounded hover:bg-gray-100"
            aria-label="Menü schließen"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <nav className="flex flex-col h-[calc(100vh-4rem)]">
          {/* Mode-specific navigation */}
          <div className="space-y-1 p-4 flex-1">
            {modeNavItems.map((item) => {
              const href = getFullHref(item.path);
              const isActive = isModeItemActive(item.path);
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  href={href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Shared navigation (bottom) */}
          <div className="border-t border-gray-200 p-4 space-y-1">
            {sharedNavItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </aside>
    </>
  );
}

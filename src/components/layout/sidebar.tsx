"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMode, AnalyticsMode } from "@/lib/mode-context";

// Navigation items per mode
const navItemsByMode: Record<AnalyticsMode, { href: string; label: string; icon: typeof LayoutDashboard }[]> = {
  all: [
    { href: "/", label: "Übersicht", icon: LayoutDashboard },
  ],
  ads: [
    { href: "/", label: "Übersicht", icon: LayoutDashboard },
    { href: "/funnel", label: "Website-Funnel", icon: Filter },
    { href: "/journeys", label: "Lead-Verlauf", icon: Route },
    { href: "/attribution", label: "Attribution", icon: Target },
    { href: "/costs", label: "Kosten & ROAS", icon: DollarSign },
  ],
  purchased: [
    { href: "/", label: "Übersicht", icon: LayoutDashboard },
  ],
  organic: [
    { href: "/", label: "Übersicht", icon: LayoutDashboard },
    { href: "/funnel", label: "Website-Funnel", icon: Filter },
    { href: "/journeys", label: "Lead-Verlauf", icon: Route },
  ],
};

// Shared navigation items (always visible)
const sharedNavItems = [
  { href: "/health", label: "Systemstatus", icon: Activity },
  { href: "/settings", label: "Einstellungen", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const { mode } = useMode();

  const modeNavItems = navItemsByMode[mode];

  // Redirect to "/" if current path is not available in current mode
  useEffect(() => {
    const allValidPaths = [
      ...modeNavItems.map(item => item.href),
      ...sharedNavItems.map(item => item.href),
    ];
    if (!allValidPaths.includes(pathname)) {
      router.replace("/");
    }
  }, [pathname, mode, modeNavItems, router]);

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

"use client";

import { useRouter } from "next/navigation";
import { Megaphone, ShoppingCart, Globe, Layers } from "lucide-react";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { useMode, modeConfig, AnalyticsMode } from "@/lib/mode-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

const modeIcons: Record<AnalyticsMode, typeof Megaphone> = {
  all: Layers,
  ads: Megaphone,
  purchased: ShoppingCart,
  organic: Globe,
};

export function Header() {
  const router = useRouter();
  const { mode, setMode } = useMode();
  const Icon = modeIcons[mode];

  const handleModeChange = (newMode: AnalyticsMode) => {
    setMode(newMode);
    // Navigate to the first page (Übersicht) when changing modes
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
      {/* Spacer for mobile menu button */}
      <div className="w-10 lg:w-0" />

      {/* Mode Selector */}
      <div className="flex items-center gap-3">
        <Select value={mode} onValueChange={(v) => handleModeChange(v as AnalyticsMode)}>
          <SelectTrigger className="w-[240px] h-11 bg-white border-gray-300 shadow-sm">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-primary shrink-0" />
              <span className="font-medium">{modeConfig[mode].label}</span>
            </div>
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="all" className="py-3">
              <div className="flex items-center gap-3">
                <Layers className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <div className="font-medium">{modeConfig.all.label}</div>
                  <div className="text-xs text-gray-500">{modeConfig.all.description}</div>
                </div>
              </div>
            </SelectItem>
            <SelectItem value="ads" className="py-3">
              <div className="flex items-center gap-3">
                <Megaphone className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <div className="font-medium">{modeConfig.ads.label}</div>
                  <div className="text-xs text-gray-500">{modeConfig.ads.description}</div>
                </div>
              </div>
            </SelectItem>
            <SelectItem value="purchased" className="py-3">
              <div className="flex items-center gap-3">
                <ShoppingCart className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <div className="font-medium">{modeConfig.purchased.label}</div>
                  <div className="text-xs text-gray-500">{modeConfig.purchased.description}</div>
                </div>
              </div>
            </SelectItem>
            <SelectItem value="organic" className="py-3">
              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <div className="font-medium">{modeConfig.organic.label}</div>
                  <div className="text-xs text-gray-500">{modeConfig.organic.description}</div>
                </div>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DateRangePicker />
    </header>
  );
}

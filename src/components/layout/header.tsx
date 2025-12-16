"use client";

import { Megaphone, ShoppingCart, Globe, Layers, Check, ChevronDown } from "lucide-react";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { useMode, modeConfig, AnalyticsMode } from "@/lib/mode-context";
import { usePlatform, platformConfig, ALL_PLATFORMS } from "@/lib/platform-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const modeIcons: Record<AnalyticsMode, typeof Megaphone> = {
  all: Layers,
  ads: Megaphone,
  purchased: ShoppingCart,
  organic: Globe,
};

export function Header() {
  const { mode, setMode } = useMode();
  const { selectedPlatforms, togglePlatform, selectAll } = usePlatform();
  const Icon = modeIcons[mode];

  // Check if all platforms are selected
  const allSelected = selectedPlatforms.length === ALL_PLATFORMS.length;
  const noneSelected = selectedPlatforms.length === 0;

  const platformLabel = allSelected
    ? "Alle Plattformen"
    : noneSelected
      ? "Keine Plattform"
      : selectedPlatforms.length === 1
        ? platformConfig[selectedPlatforms[0]].label
        : `${selectedPlatforms.length} Plattformen`;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
      {/* Spacer for mobile menu button */}
      <div className="w-10 lg:w-0" />

      {/* Mode Selector + Platform Filter */}
      <div className="flex items-center gap-3">
        <Select value={mode} onValueChange={(v) => setMode(v as AnalyticsMode)}>
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

        {/* Platform Filter - only visible in ads mode */}
        {mode === "ads" && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-11 px-4 bg-white border-gray-300 shadow-sm justify-between min-w-[180px]"
              >
                <span className="font-medium">{platformLabel}</span>
                <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[220px] p-2 bg-white" align="start">
              {/* Select All option */}
              <button
                onClick={selectAll}
                className={cn(
                  "flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm hover:bg-gray-100 transition-colors",
                  allSelected && "bg-gray-50"
                )}
              >
                <div className={cn(
                  "h-4 w-4 rounded border flex items-center justify-center",
                  allSelected ? "bg-primary border-primary" : "border-gray-300"
                )}>
                  {allSelected && <Check className="h-3 w-3 text-white" />}
                </div>
                <span className="font-medium">Alle Plattformen</span>
              </button>

              <div className="h-px bg-gray-200 my-2" />

              {/* Individual platforms */}
              {ALL_PLATFORMS.map((platform) => {
                const isSelected = selectedPlatforms.includes(platform);
                const config = platformConfig[platform];
                return (
                  <button
                    key={platform}
                    onClick={() => togglePlatform(platform)}
                    className={cn(
                      "flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm hover:bg-gray-100 transition-colors",
                      isSelected && "bg-gray-50"
                    )}
                  >
                    <div className={cn(
                      "h-4 w-4 rounded border flex items-center justify-center",
                      isSelected ? "bg-primary border-primary" : "border-gray-300"
                    )}>
                      {isSelected && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <span>{config.label}</span>
                  </button>
                );
              })}
            </PopoverContent>
          </Popover>
        )}
      </div>

      <DateRangePicker />
    </header>
  );
}

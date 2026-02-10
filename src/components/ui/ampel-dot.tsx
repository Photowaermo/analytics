"use client";

import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AmpelResult } from "@/lib/ampel";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

interface AmpelDotProps {
  result: AmpelResult;
  showLabel?: boolean;
}

export function AmpelDot({ result, showLabel = false }: AmpelDotProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1.5" type="button">
          <span
            className={cn(
              "h-3 w-3 rounded-full inline-block shrink-0",
              result.color,
              result.status === "kill" && "animate-pulse"
            )}
          />
          {showLabel && (
            <span className="text-xs font-medium text-gray-700">
              {result.label}
            </span>
          )}
          {result.impossibleCpcWarning && (
            <AlertTriangle className="h-3 w-3 text-orange-500" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 bg-white p-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span
              className={cn("h-3 w-3 rounded-full inline-block", result.color)}
            />
            <span className="font-medium text-sm">{result.label}</span>
          </div>
          <p className="text-sm text-gray-600">{result.recommendation}</p>
          {result.budgetSuggestion && (
            <p className="text-xs text-gray-500 border-t pt-2">
              {result.budgetSuggestion}
            </p>
          )}
          {result.impossibleCpcWarning && (
            <p className="text-xs text-orange-600 flex items-center gap-1 border-t pt-2">
              <AlertTriangle className="h-3 w-3" />
              CPC zu hoch für Ziel-CPL
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

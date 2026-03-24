"use client";

import { useState, useCallback } from "react";

export function usePersistedState<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  const [state, setState] = useState<T>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(key);
      if (stored !== null) {
        try { return JSON.parse(stored); } catch { return defaultValue; }
      }
    }
    return defaultValue;
  });

  const setPersistedState = useCallback((value: T) => {
    localStorage.setItem(key, JSON.stringify(value));
    setState(value);
  }, [key]);

  return [state, setPersistedState];
}

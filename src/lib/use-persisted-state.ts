"use client";

import { useState, useCallback, useEffect } from "react";

export function usePersistedState<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  const [state, setState] = useState<T>(defaultValue);

  // Load from localStorage after hydration
  useEffect(() => {
    const stored = localStorage.getItem(key);
    if (stored !== null) {
      try { setState(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, [key]);

  const setPersistedState = useCallback((value: T) => {
    localStorage.setItem(key, JSON.stringify(value));
    setState(value);
  }, [key]);

  return [state, setPersistedState];
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function AuthPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lockoutRemainingMs, setLockoutRemainingMs] = useState(0);

  // Countdown timer for lockout
  useEffect(() => {
    if (lockoutRemainingMs <= 0) return;

    const interval = setInterval(() => {
      setLockoutRemainingMs((prev) => {
        const newValue = prev - 1000;
        if (newValue <= 0) {
          setError("");
          return 0;
        }
        return newValue;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [lockoutRemainingMs]);

  const formatRemainingTime = (ms: number): string => {
    const minutes = Math.floor(ms / 1000 / 60);
    const seconds = Math.floor((ms / 1000) % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (lockoutRemainingMs > 0) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success) {
        router.push("/");
        router.refresh();
      } else {
        setError(data.error || "Authentifizierung fehlgeschlagen");
        if (data.lockoutRemainingMs) {
          setLockoutRemainingMs(data.lockoutRemainingMs);
        }
      }
    } catch {
      setError("Verbindungsfehler. Bitte versuche es erneut.");
    } finally {
      setIsLoading(false);
      setPassword("");
    }
  };

  const isLocked = lockoutRemainingMs > 0;

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-sm px-4">
        <div className="rounded-xl border border-gray-200 bg-white shadow-lg p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Analytics Dashboard
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Bitte Passwort eingeben
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="password"
                placeholder="Passwort"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading || isLocked}
                className={cn(
                  "w-full",
                  error && !isLocked && "border-red-500 focus-visible:border-red-500"
                )}
                autoFocus
              />
            </div>

            {error && (
              <div
                className={cn(
                  "text-sm p-3 rounded-lg",
                  isLocked
                    ? "bg-yellow-50 text-yellow-800 border border-yellow-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                )}
              >
                {isLocked ? (
                  <div className="flex items-center justify-between">
                    <span>{error}</span>
                    <span className="font-mono font-medium">
                      {formatRemainingTime(lockoutRemainingMs)}
                    </span>
                  </div>
                ) : (
                  error
                )}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-accent hover:bg-accent/90 text-white"
              disabled={isLoading || isLocked || !password}
            >
              {isLoading ? "Wird geprüft..." : isLocked ? "Gesperrt" : "Anmelden"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

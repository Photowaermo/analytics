"use client";

export function ViewContainer({ children }: { children: React.ReactNode }) {
  return <main className="p-4 lg:p-6">{children}</main>;
}

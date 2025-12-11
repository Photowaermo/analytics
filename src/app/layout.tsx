import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Analytics Dashboard",
  description: "Solar lead generation analytics dashboard for marketing team and management",
  keywords: ["analytics", "dashboard", "solar", "leads", "ROAS", "marketing"],
  authors: [{ name: "Photowaermo" }],
  openGraph: {
    title: "Analytics Dashboard",
    description: "Solar lead generation analytics dashboard",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="flex min-h-screen bg-surface">
            <Sidebar />
            <div className="flex-1 lg:ml-64">
              <Header />
              <main className="p-4 lg:p-6">{children}</main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}

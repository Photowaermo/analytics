import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ViewContainer } from "@/components/layout/view-container";
import { getSessionRole } from "@/lib/auth";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Analytics Dashboard",
  description: "Solar-Leadgenerierung Analytics Dashboard für Marketing-Team und Management",
  keywords: ["analytics", "dashboard", "solar", "leads", "ROAS", "marketing"],
  authors: [{ name: "Photowaermo" }],
  openGraph: {
    title: "Analytics Dashboard",
    description: "Solar-Leadgenerierung Analytics Dashboard",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Der Schnellanruf-Zugang hat ein eigenes Passwort und sieht nur seinen
  // Bereich. Navigation und Kopfzeile (Modus-, Zeitraum- und Produktfilter)
  // gehören zur Analytics-Auswertung und wären dort nur irreführend — die
  // Middleware würde jeden Klick ohnehin zurückwerfen.
  const nurSchnellanruf = (await getSessionRole()) === "speed_dial";

  return (
    <html lang="de">
      <body className={inter.className}>
        <Providers>
          {nurSchnellanruf ? (
            <div className="min-h-screen bg-surface">{children}</div>
          ) : (
            <div className="flex min-h-screen bg-surface">
              <Sidebar />
              <div className="flex-1 lg:ml-64">
                <Header />
                <ViewContainer>{children}</ViewContainer>
              </div>
            </div>
          )}
        </Providers>
      </body>
    </html>
  );
}

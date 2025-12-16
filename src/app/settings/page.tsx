"use client";

import { useState, useEffect } from "react";
import { Save, Loader2 } from "lucide-react";
import { useSettings, useUpdateSettings } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Available ad platforms with their UTM sources
const AD_PLATFORMS = [
  { id: "meta", label: "Meta (Facebook/Instagram)", utmSources: ["facebook", "fb", "instagram", "ig", "meta"] },
  { id: "google", label: "Google Ads", utmSources: ["google", "gclid", "adwords"] },
  { id: "tiktok", label: "TikTok Ads", utmSources: ["tiktok", "tt"] },
  { id: "linkedin", label: "LinkedIn Ads", utmSources: ["linkedin", "li"] },
  { id: "pinterest", label: "Pinterest Ads", utmSources: ["pinterest", "pin"] },
  { id: "twitter", label: "Twitter/X Ads", utmSources: ["twitter", "x", "tw"] },
];

export default function SettingsPage() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [adPlatforms, setAdPlatforms] = useState<Record<string, boolean>>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (settings?.provider_prices) {
      const stringPrices: Record<string, string> = {};
      Object.entries(settings.provider_prices).forEach(([key, value]) => {
        stringPrices[key] = value.toString();
      });
      setPrices(stringPrices);
    }
    if (settings?.active_ad_platforms) {
      setAdPlatforms(settings.active_ad_platforms);
    } else {
      // Default: only Meta is active
      setAdPlatforms({ meta: true });
    }
  }, [settings]);

  const handlePriceChange = (provider: string, value: string) => {
    setPrices((prev) => ({ ...prev, [provider]: value }));
    setHasChanges(true);
  };

  const handlePlatformToggle = (platformId: string, enabled: boolean) => {
    setAdPlatforms((prev) => ({ ...prev, [platformId]: enabled }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    const numericPrices: Record<string, number> = {};
    Object.entries(prices).forEach(([key, value]) => {
      numericPrices[key] = parseFloat(value) || 0;
    });

    await updateSettings.mutateAsync({
      provider_prices: numericPrices,
      active_ad_platforms: adPlatforms,
    });
    setHasChanges(false);
  };

  const handleAddProvider = () => {
    const newProvider = prompt("Anbieter-Name eingeben:");
    if (newProvider && !prices[newProvider.toLowerCase()]) {
      setPrices((prev) => ({ ...prev, [newProvider.toLowerCase()]: "0" }));
      setHasChanges(true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Einstellungen</h1>
        <Button onClick={handleSave} disabled={!hasChanges || updateSettings.isPending}>
          {updateSettings.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Änderungen speichern
        </Button>
      </div>

      {/* Active Ad Platforms */}
      <Card>
        <CardHeader>
          <CardTitle>Aktive Werbeplattformen</CardTitle>
          <CardDescription>
            Diese Einstellung steuert, ob Website-Besuche mit entsprechenden UTM-Parametern als bezahlter Traffic (Werbeanzeigen) oder als organischer Traffic gezählt werden. Lead Forms von Werbeplattformen werden immer als Werbeanzeigen gezählt.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {AD_PLATFORMS.map((platform) => (
              <div key={platform.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex-1">
                  <label htmlFor={`platform-${platform.id}`} className="text-sm font-medium text-gray-900 cursor-pointer">
                    {platform.label}
                  </label>
                  <p className="text-xs text-gray-500 mt-0.5">
                    UTM: {platform.utmSources.join(", ")}
                  </p>
                </div>
                <Switch
                  id={`platform-${platform.id}`}
                  checked={adPlatforms[platform.id] || false}
                  onCheckedChange={(checked) => handlePlatformToggle(platform.id, checked)}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Provider Prices */}
      <Card>
        <CardHeader>
          <CardTitle>Anbieter-Preise</CardTitle>
          <CardDescription>
            Legen Sie die Kosten pro Lead für jeden Anbieter fest. Diese Werte werden zur Berechnung anbieterspezifischer Metriken verwendet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-gray-500">Einstellungen werden geladen...</div>
          ) : (
            <div className="space-y-4">
              {Object.entries(prices).map(([provider, price]) => (
                <div key={provider} className="flex items-center gap-4">
                  <label className="w-32 text-sm font-medium text-gray-700 capitalize">
                    {provider}
                  </label>
                  <div className="relative flex-1 max-w-xs">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      €
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={price}
                      onChange={(e) => handlePriceChange(provider, e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <span className="text-sm text-gray-500">pro Lead</span>
                </div>
              ))}

              <Button variant="outline" onClick={handleAddProvider} className="mt-4">
                + Anbieter hinzufügen
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Success Message */}
      {updateSettings.isSuccess && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4">
          <p className="text-sm text-green-800">Einstellungen erfolgreich gespeichert!</p>
        </div>
      )}

      {/* Error Message */}
      {updateSettings.isError && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-800">Einstellungen konnten nicht gespeichert werden. Bitte versuchen Sie es erneut.</p>
        </div>
      )}

      {/* Info */}
      <Card>
        <CardHeader>
          <CardTitle>API-Konfiguration</CardTitle>
          <CardDescription>
            API-Endpunkt und Authentifizierung werden auf Server-Ebene konfiguriert.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">API-Basis-URL</span>
              <code className="text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                https://leads.photowaermo.de/analytics
              </code>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Authentifizierung</span>
              <span className="text-gray-700">Öffentlich</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

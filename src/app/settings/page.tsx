"use client";

import { useState, useEffect } from "react";
import { Save, Loader2 } from "lucide-react";
import { useSettings, useUpdateSettings } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (settings?.provider_prices) {
      const stringPrices: Record<string, string> = {};
      Object.entries(settings.provider_prices).forEach(([key, value]) => {
        stringPrices[key] = value.toString();
      });
      setPrices(stringPrices);
    }
  }, [settings]);

  const handlePriceChange = (provider: string, value: string) => {
    setPrices((prev) => ({ ...prev, [provider]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    const numericPrices: Record<string, number> = {};
    Object.entries(prices).forEach(([key, value]) => {
      numericPrices[key] = parseFloat(value) || 0;
    });

    await updateSettings.mutateAsync({ provider_prices: numericPrices });
    setHasChanges(false);
  };

  const handleAddProvider = () => {
    const newProvider = prompt("Enter provider name:");
    if (newProvider && !prices[newProvider.toLowerCase()]) {
      setPrices((prev) => ({ ...prev, [newProvider.toLowerCase()]: "0" }));
      setHasChanges(true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <Button onClick={handleSave} disabled={!hasChanges || updateSettings.isPending}>
          {updateSettings.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>

      {/* Provider Prices */}
      <Card>
        <CardHeader>
          <CardTitle>Provider Prices</CardTitle>
          <CardDescription>
            Set the cost per lead for each provider. These values are used to calculate provider-specific metrics.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-gray-500">Loading settings...</div>
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
                  <span className="text-sm text-gray-500">per lead</span>
                </div>
              ))}

              <Button variant="outline" onClick={handleAddProvider} className="mt-4">
                + Add Provider
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Success Message */}
      {updateSettings.isSuccess && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4">
          <p className="text-sm text-green-800">Settings saved successfully!</p>
        </div>
      )}

      {/* Error Message */}
      {updateSettings.isError && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-800">Failed to save settings. Please try again.</p>
        </div>
      )}

      {/* Info */}
      <Card>
        <CardHeader>
          <CardTitle>API Configuration</CardTitle>
          <CardDescription>
            API endpoint and authentication are configured at the server level.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">API Base URL</span>
              <code className="text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                https://leads.photowaermo.de/analytics
              </code>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Authentication</span>
              <span className="text-gray-700">Basic Auth (Gateway)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

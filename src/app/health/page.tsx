"use client";

import { CheckCircle, XCircle, Database, Server, RefreshCw } from "lucide-react";
import { useHealth } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queries";

export default function HealthPage() {
  const { data: health, isLoading, isError, dataUpdatedAt } = useHealth();
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.health });
  };

  const isHealthy = health?.status === "healthy";
  const isDbConnected = health?.db === "connected";

  const formatLastUpdated = () => {
    if (!dataUpdatedAt) return "Never";
    return new Date(dataUpdatedAt).toLocaleTimeString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">System Health</h1>
        <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Overall Status */}
      <div className="rounded-xl border border-gray-200/50 bg-white/70 p-8 backdrop-blur-sm shadow-sm">
        <div className="flex items-center justify-center">
          {isLoading ? (
            <div className="text-center">
              <RefreshCw className="h-16 w-16 text-gray-400 animate-spin mx-auto" />
              <p className="mt-4 text-gray-500">Checking system status...</p>
            </div>
          ) : isError ? (
            <div className="text-center">
              <XCircle className="h-16 w-16 text-red-500 mx-auto" />
              <p className="mt-4 text-xl font-semibold text-red-600">System Unreachable</p>
              <p className="mt-2 text-gray-500">Unable to connect to the API</p>
            </div>
          ) : isHealthy ? (
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <p className="mt-4 text-xl font-semibold text-green-600">All Systems Operational</p>
              <p className="mt-2 text-gray-500">Last checked: {formatLastUpdated()}</p>
            </div>
          ) : (
            <div className="text-center">
              <XCircle className="h-16 w-16 text-yellow-500 mx-auto" />
              <p className="mt-4 text-xl font-semibold text-yellow-600">Degraded Performance</p>
              <p className="mt-2 text-gray-500">Some services may be affected</p>
            </div>
          )}
        </div>
      </div>

      {/* Service Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* API Status */}
        <div className="rounded-xl border border-gray-200/50 bg-white/70 p-6 backdrop-blur-sm shadow-sm">
          <div className="flex items-center gap-4">
            <div className={`rounded-lg p-3 ${isHealthy ? "bg-green-100" : "bg-red-100"}`}>
              <Server className={`h-6 w-6 ${isHealthy ? "text-green-600" : "text-red-600"}`} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">API Server</h3>
              <p className={`text-sm ${isHealthy ? "text-green-600" : "text-red-600"}`}>
                {isLoading ? "Checking..." : isHealthy ? "Operational" : "Down"}
              </p>
            </div>
            <div className="ml-auto">
              {isHealthy ? (
                <CheckCircle className="h-6 w-6 text-green-500" />
              ) : (
                <XCircle className="h-6 w-6 text-red-500" />
              )}
            </div>
          </div>
        </div>

        {/* Database Status */}
        <div className="rounded-xl border border-gray-200/50 bg-white/70 p-6 backdrop-blur-sm shadow-sm">
          <div className="flex items-center gap-4">
            <div className={`rounded-lg p-3 ${isDbConnected ? "bg-green-100" : "bg-red-100"}`}>
              <Database className={`h-6 w-6 ${isDbConnected ? "text-green-600" : "text-red-600"}`} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Database</h3>
              <p className={`text-sm ${isDbConnected ? "text-green-600" : "text-red-600"}`}>
                {isLoading ? "Checking..." : isDbConnected ? "Connected" : "Disconnected"}
              </p>
            </div>
            <div className="ml-auto">
              {isDbConnected ? (
                <CheckCircle className="h-6 w-6 text-green-500" />
              ) : (
                <XCircle className="h-6 w-6 text-red-500" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
        <p className="text-sm text-blue-800">
          Health checks run automatically every 30 seconds. Click refresh to check manually.
        </p>
      </div>
    </div>
  );
}

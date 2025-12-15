"use client";

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { formatNumber } from "@/lib/utils";

interface BarChartProps {
  data: { name: string; value: number; fullName?: string }[];
  title: string;
  color?: string;
  horizontal?: boolean;
}

const COLORS = ["#A1BF4F", "#7BCDA5", "#3A9E90", "#6B8E23", "#2F4F4F"];

// Custom tooltip to show full name
function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; fullName?: string; value: number } }> }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
        <p className="font-medium text-gray-900 mb-1">{data.fullName || data.name}</p>
        <p className="text-sm text-gray-600">{formatNumber(data.value)} Leads</p>
      </div>
    );
  }
  return null;
}

export function BarChartCard({ data, title, color = "#A1BF4F", horizontal = false }: BarChartProps) {
  if (horizontal) {
    return (
      <div className="rounded-xl border border-gray-200/50 bg-white/70 p-6 backdrop-blur-sm shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">{title}</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 150, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
              <XAxis type="number" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11 }}
                stroke="#9ca3af"
                width={145}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200/50 bg-white/70 p-6 backdrop-blur-sm shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">{title}</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9ca3af" />
            <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]}>
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function BarChartSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200/50 bg-white/70 p-6 backdrop-blur-sm shadow-sm animate-pulse">
      <div className="h-6 w-48 bg-gray-200 rounded mb-4" />
      <div className="h-80 bg-gray-100 rounded" />
    </div>
  );
}

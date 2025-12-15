"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";

interface TrendChartProps {
  data: { date: string; leads: number; sales: number }[];
}

export function TrendChart({ data }: TrendChartProps) {
  const formattedData = data.map((item) => ({
    ...item,
    dateLabel: format(parseISO(item.date), "d. MMM", { locale: de }),
    Leads: item.leads,
    Verkäufe: item.sales,
  }));

  return (
    <div className="rounded-xl border border-gray-200/50 bg-white/70 p-6 backdrop-blur-sm shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">Leads vs. Verkäufe Trend</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={formattedData} margin={{ top: 5, right: 60, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="dateLabel" tick={{ fontSize: 12 }} stroke="#9ca3af" />
            {/* Left Y-axis for Leads */}
            <YAxis
              yAxisId="leads"
              orientation="left"
              tick={{ fontSize: 12 }}
              stroke="#A1BF4F"
              label={{ value: "Leads", angle: -90, position: "insideLeft", fill: "#A1BF4F", fontSize: 12 }}
            />
            {/* Right Y-axis for Sales */}
            <YAxis
              yAxisId="sales"
              orientation="right"
              tick={{ fontSize: 12 }}
              stroke="#3A9E90"
              label={{ value: "Verkäufe", angle: 90, position: "insideRight", fill: "#3A9E90", fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              }}
            />
            <Legend />
            <Line
              yAxisId="leads"
              type="monotone"
              dataKey="Leads"
              stroke="#A1BF4F"
              strokeWidth={2}
              dot={{ fill: "#A1BF4F", strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
            <Line
              yAxisId="sales"
              type="monotone"
              dataKey="Verkäufe"
              stroke="#3A9E90"
              strokeWidth={2}
              dot={{ fill: "#3A9E90", strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function TrendChartSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200/50 bg-white/70 p-6 backdrop-blur-sm shadow-sm animate-pulse">
      <div className="h-6 w-48 bg-gray-200 rounded mb-4" />
      <div className="h-80 bg-gray-100 rounded" />
    </div>
  );
}

"use client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area } from "recharts";

interface HashRateDataPoint {
  time: string;
  hashRate: number;
}

export default function HashRateChart({ hashRateData }: { hashRateData: HashRateDataPoint[] }) {
  return (
    <div className="w-full bg-black/[.15] dark:bg-white/[.06] p-6 rounded-lg shadow-md border border-white/[.1]">
      <h2 className="text-lg font-medium text-gray-400 mb-3 text-center font-[family-name:var(--font-geist-mono)]">
        Hash Rate Over Time (TH/s)
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={hashRateData}>
          {/* Background Grid */}
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} stroke="gray" />
          
          {/* Axes */}
          <XAxis dataKey="time" stroke="gray" fontSize={12} />
          <YAxis stroke="gray" fontSize={12} />

          {/* Tooltip */}
          <Tooltip
            contentStyle={{
              backgroundColor: "#111",
              color: "#fff",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            cursor={{ stroke: "#666", strokeOpacity: 0.2 }}
          />

          {/* Gradient Definition */}
          <defs>
            <linearGradient id="hashRateGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="10%" stopColor="#fff" stopOpacity={0.8} />
              <stop offset="90%" stopColor="#666" stopOpacity={0.0} />
            </linearGradient>
          </defs>

          {/* Smooth Filled Area */}
          <Area
            type="monotone"
            dataKey="hashRate"
            stroke="none"
            fill="url(#hashRateGradient)"
            fillOpacity={0.3}
            animationDuration={1000}
          />

          {/* The White Line */}
          <Line
            type="monotone"
            dataKey="hashRate"
            stroke="#fff"
            strokeWidth={1.8}
            dot={false}
            animationDuration={800}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

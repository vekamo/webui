"use client";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface MarketShareData {
  name: string;
  value: number;
}

const COLORS = ["#ffffff", "#666"]; // example

export default function MarketShareChart({ marketShareData }: { marketShareData: MarketShareData[] }) {
  return (
    <div className="bg-black/[.15] p-6 rounded-xl shadow-lg border border-white/[.1] text-center">
      <h2 className="text-lg font-medium text-gray-400 mb-4 tracking-wide font-[family-name:var(--font-geist-mono)]">
        Pool Market Share
      </h2>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie data={marketShareData} dataKey="value" cx="50%" cy="50%" outerRadius={80} innerRadius={50} paddingAngle={4}>
            {marketShareData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="transition-transform hover:scale-105 duration-300" />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#191919",
              color: "#fff",
              borderRadius: "8px",
              fontSize: "12px",
              border: "1px solid rgba(255, 255, 255, 0.2)",
            }}
            cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

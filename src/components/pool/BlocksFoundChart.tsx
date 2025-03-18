"use client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer} from "recharts";

interface BlocksFoundPoint {
  time: string;         // e.g. "13:05"
  blocksFound: number;  // e.g. 1
}

export default function BlocksFoundChart({ data }: { data: BlocksFoundPoint[] }) {
  return (
    <div className="w-full bg-black/[.15] p-6 rounded-lg shadow-md border border-white/[.1]">
      <h2 className="text-sm font-medium text-gray-400 mb-3 text-center font-[family-name:var(--font-geist-mono)]">
        Blocks Found Over Time
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="blocksFoundGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#fff" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#666" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} stroke="gray" />
          <XAxis dataKey="time" stroke="gray" fontSize={12} />
          <YAxis stroke="gray" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#111",
              color: "#fff",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            cursor={{ stroke: "#666", strokeOpacity: 0.2 }}
          />
          <Area
            type="monotone"
            dataKey="blocksFound"
            stroke="#fff"
            fill="url(#blocksFoundGradient)"
            fillOpacity={0.3}
            strokeWidth={1.8}
            dot={false}
            animationDuration={800}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

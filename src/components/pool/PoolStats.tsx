"use client";

interface PoolStatsData {
  activeMiners: number;
  poolHashRate: string;
  blocksFound: number;
  // etc.
}

export default function PoolStats({ data }: { data: PoolStatsData | null }) {
  if (!data) {
    return <p className="text-gray-400">No pool stats available.</p>;
  }

  return (
    <div className="w-full bg-black/[.15] p-6 rounded-lg shadow-md border border-white/[.1]">
      <h2 className="text-lg font-medium text-gray-400 mb-3">Pool Statistics</h2>
      <ul className="text-sm text-gray-300 space-y-2">
        <li>Active Miners: {data.activeMiners}</li>
        <li>Pool Hash Rate: {data.poolHashRate}</li>
        <li>Blocks Found: {data.blocksFound}</li>
        {/* ... */}
      </ul>
    </div>
  );
}

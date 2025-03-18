"use client";

import Link from "next/link";

interface LastBlock {
  timestamp: string; // e.g. "5 mins ago"
  height: number;    // e.g. 2784778
  hash: string;      // e.g. "00000abcd1234..."
  miner: string;     // e.g. "MWC Pool"
  reward: string;    // e.g. "0.05 MWC"
}

export default function LastBlocksTable({ lastBlocks }: { lastBlocks: LastBlock[] }) {
  return (
    <div className="w-full max-w-5xl bg-black/[.15] p-6 rounded-lg shadow-md border border-white/[.1]">
      <h2 className="text-lg font-medium text-gray-400 mb-4 text-left">Last Blocks Found</h2>
      <table className="w-full text-left text-sm text-gray-300">
        <thead>
          <tr className="border-b border-white/[.1] text-gray-500 text-xs uppercase tracking-wide">
            <th className="py-2 px-4">Time</th>
            <th className="py-2 px-4">Block Height</th>
            <th className="py-2 px-4">Block Hash</th>
            <th className="py-2 px-4">Miner</th>
            <th className="py-2 px-4">Reward</th>
          </tr>
        </thead>
        <tbody>
          {lastBlocks.map((block, index) => (
            <tr key={index} className="border-b border-white/[.05] hover:bg-white/[.05] transition">
              <td className="py-2 px-4 text-blue-400">{block.timestamp}</td>
              <td className="py-2 px-4">
                <Link href={`#`} className="hover:underline">
                  {block.height}
                </Link>
              </td>
              <td className="py-2 px-4 text-gray-400">{block.hash}</td>
              <td className="py-2 px-4">{block.miner}</td>
              <td className="py-2 px-4 text-green-400">{block.reward}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

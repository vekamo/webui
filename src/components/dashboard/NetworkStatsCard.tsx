"use client";
import React from "react";

interface PoolStat {
  title: string;
  value: string;
}

/**
 * A card that matches the style of MinerStatsCard:
 *   - Title row
 *   - 1 big stat section
 *   - 2-col grid for other stats
 *   - same dark gradient, border, fonts, text sizing
 */
export default function NetworkStatsCard({
  stats,
}: {
  stats: PoolStat[];
}) {
  // Optional: pick the first item as the "big stat" & show the rest in grid
  // If you prefer them all in the grid, remove the "big stat" block
  const [firstStat, ...otherStats] = stats;

  return (
    <div
      className="
        h-full flex flex-col
        rounded-lg shadow-md
        bg-gradient-to-r from-[#182026] to-[#0f1215]
        border border-[#2A2D34]
        p-6 sm:p-8
        gap-4
        font-[family-name:var(--font-geist-mono)]
      "
    >
      {/* Title row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h2 className="text-2xl font-extrabold text-white">
          Network Stats
        </h2>
      </div>

      {/* Big stat (like "Current Graph Rate" in MinerStatsCard) */}
      {firstStat && (
        <div>
          <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">
            {firstStat.title}
          </p>
          <p className="text-3xl font-semibold text-white">
            {firstStat.value}
          </p>
        </div>
      )}

      {/* Grid of the rest (like the smaller stats in MinerStatsCard) */}
      <div className="grid grid-cols-2 gap-y-4 gap-x-4 mt-2 text-sm text-gray-300">
        {otherStats.map((stat, i) => (
          <div key={i}>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              {stat.title}
            </p>
            <p className="font-semibold text-white">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

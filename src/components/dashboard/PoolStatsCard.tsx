"use client";
import React from "react";

interface PoolStat {
  title: string;
  value: string;
}

/**
 * PoolStatsCard
 *   - Matches style of NetworkStatsCard
 *   - Renders first item as a "big stat"
 *   - Remaining items in a 3-column grid
 */
export default function PoolStatsCard({ stats }: { stats: PoolStat[] }) {
  // Split first stat from the rest
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
          Pool Stats
        </h2>
      </div>

      {/* "Big stat" if we have at least one */}
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

      {/* The rest in a 3-col grid */}
      <div className="grid grid-cols-3 gap-y-4 gap-x-4 mt-2 text-sm text-gray-300">
        {otherStats.map((stat, i) => (
          <div key={i}>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              {stat.title}
            </p>
            <p className="font-semibold text-white">
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

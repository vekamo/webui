"use client";
import React, { useEffect, useState } from "react";

interface PoolStat {
  title: string;
  value: string; // For "Time Ago", this should initially be a timestamp like "2025-03-28T12:34:56Z"
}

/**
 * A card that matches the style of MinerStatsCard:
 *   - Title row
 *   - 1 big stat section
 *   - 2-col grid for other stats
 *   - same dark gradient, border, fonts, text sizing
 */
export default function NetworkStatsCard({ stats }: { stats: PoolStat[] }) {
  // If there's a "Time Ago" stat, we'll update it every second.
  const [timeAgo, setTimeAgo] = useState<string>("");

  // Find the stat with title "Time Ago" (if any).
  const timeAgoStat = stats.find((stat) => stat.title === "Time Ago");

  useEffect(() => {
    if (!timeAgoStat) return; // If no "Time Ago" stat, do nothing.

    // Parse the original "Time Ago" stat's value as a Date.
    const blockTime = new Date(timeAgoStat.value);

    function updateTime() {
      const now = new Date();
      let diffInSeconds = Math.floor((now.getTime() - blockTime.getTime()*1000) / 1000);

      // If the block time is in the future, clamp to 0.
      if (diffInSeconds < 0) {
        diffInSeconds = 0;
      }

      const minutes = Math.floor(diffInSeconds / 60);
      const seconds = diffInSeconds % 60;

      // Update our local state, which we'll inject into the displayed stats below.
      setTimeAgo(`${minutes} min ${seconds} sec ago`);
    }

    // Update once immediately, then every second.
    updateTime();
    const id = setInterval(updateTime, 1000);
    return () => clearInterval(id);
  }, [timeAgoStat]);

  // Replace the stat's value with our continuously-updated timeAgo (if it's the "Time Ago" stat).
  const processedStats: PoolStat[] = stats.map((stat) => {
    if (stat.title === "Time Ago" && timeAgoStat) {
      return { ...stat, value: timeAgo };
    }
    return stat;
  });

  // Optionally pick the first item as the "big stat" and the rest in a grid.
  const [firstStat, ...otherStats] = processedStats;

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

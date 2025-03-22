"use client";

import { nanoMWCToMWC } from "@/utils/utils";
import React from "react";

/** The props for each stat */
export interface MinerStatsProps {
  currentGraphRate: string;               // e.g. "C31: 5.30 gps"
  chainHeight: number;                    // e.g. 2787921
  lastNetworkBlock: string;               // e.g. "169 sec ago"
  miner240BlockAvg: string;               // e.g. "C31: 4.96 gps"
  miner1440BlockAvg: string;              // e.g. "C31: 2.08 gps"
  estimatedShareLast: string;             // e.g. "n/a"
  estimatedShareNext: any;             // e.g. "0.0000 MWC"
  estimatedDailyEarnings: string; 
  currentBalance: number,
  immatureBalance: number,        // e.g. "0.0355 MWC"
}

/**
 * A card that matches the style of your BalanceInfo snippet:
 *   - big "hashrate" line, 
 *   - 2-col grid for other stats,
 *   - same dark gradient background, border, and font styles.
 */
export default function MinerStatsCard({
  currentGraphRate,
  chainHeight,
  lastNetworkBlock,
  miner240BlockAvg,
  miner1440BlockAvg,
  estimatedShareLast,
  estimatedShareNext,
  estimatedDailyEarnings,
  currentBalance,
  immatureBalance,
}: MinerStatsProps) {
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
          Miner Stats
        </h2>
      </div>

      {/* Big "Current Graph Rate" - like "Available Amount" in Balance */}
      <div>
        <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">
          Current Graph Rate
        </p>
        <p className="text-3xl font-semibold text-white">{currentGraphRate}</p>
      </div>

      {/* Stats grid (the rest) */}
      <div className="grid grid-cols-2 gap-y-4 gap-x-4 mt-2 text-sm text-gray-300">
        {/* Estimated Share of Last Pool Block 
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            Est Share Last Pool Block
          </p>
          <p className="font-semibold text-white">
            {estimatedShareLast}
          </p>
        </div>
        */}

        {/* Miner 240-Block Average */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            Miner 240-Block Avg
          </p>
          <p className="font-semibold text-white">
            {miner240BlockAvg} GPS
          </p>
        </div>

        {/* Miner 1440-Block Average */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            Miner 1440-Block Avg
          </p>
          <p className="font-semibold text-white">
            {miner1440BlockAvg} GPS
          </p>
        </div>

        

        {/* Estimated Share of Next Pool Block */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            Est Share Next Pool Block
          </p>
          <p className="font-semibold text-white">
            {nanoMWCToMWC(estimatedShareNext)} MWC
          </p>
        </div>

        {/* Estimated Average Daily Earnings */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            Est Daily Earnings
          </p>
          <p className="font-semibold text-white">
            {estimatedDailyEarnings} MWC
          </p>
        </div>


        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            Last Height
          </p>
          <p className="font-semibold text-white">
            {chainHeight.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}

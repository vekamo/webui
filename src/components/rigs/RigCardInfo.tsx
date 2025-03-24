"use client";

import React from "react";

/**
 * RigInfoCardProps:
 *  - rigNames: array of all rig names (["rigA", "rigB", ...])
 *  - selectedRig: the rig name currently selected in the dropdown
 *  - onRigChange: callback to update which rig is selected
 *
 * Additional optional fields for ephemeral stats:
 *  - currentGraphRate
 *  - chainHeight
 *  - rig240BlockAvg
 *  - rig1440BlockAvg
 *  - dailyEarnings
 */
interface RigInfoCardProps {
  rigNames: string[];
  selectedRig: string;
  onRigChange: (rigName: string) => void;

  // Optional ephemeral stats to display
  currentGraphRate?: string;   // e.g. "5.30 gps"
  chainHeight?: number;        // e.g. 2787921
  rig240BlockAvg?: string;     // e.g. "4.96 gps"
  rig1440BlockAvg?: string;    // e.g. "2.08 gps"
  dailyEarnings?: string;
  sumShares?: any      // e.g. "0.045 MWC"
}
export default function RigInfoCard({
  rigNames,
  selectedRig,
  onRigChange,
  currentGraphRate = "0",
  chainHeight = 0,
  rig240BlockAvg = "0",
  rig1440BlockAvg = "0",
  dailyEarnings = "0",
  sumShares
}: RigInfoCardProps) {


  let acceptPercent = String((sumShares.accepted/sumShares.total*100).toFixed(2)) + " %"
  let stalePercent = String((sumShares.stale/sumShares.total*100).toFixed(2)) + " %"
  let rejectPercent = String((sumShares.rejected/sumShares.total*100).toFixed(2)) + " %"
  return (
    <div
      className="
        h-full flex flex-col
        rounded-lg shadow-md
        bg-gradient-to-r from-[#182026] to-[#0f1215]
        border border-[#2A2D34]
        p-6 sm:p-8
        gap-6
        font-[family-name:var(--font-geist-mono)]
      "
    >
      {/* Header row => Title + Dropdown */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <h2 className="text-2xl font-extrabold text-white">Rig Info</h2>

        <div className="flex items-center gap-4">
          <select
            id="rigSelect"
            value={selectedRig}
            onChange={(e) => onRigChange(e.target.value)}
            className="
              bg-gray-800 text-gray-200 text-sm
              py-2 px-4
              rounded-md
              border border-gray-600
              focus:outline-none focus:ring-1 focus:ring-blue-500
              hover:bg-gray-700 transition ease-in-out duration-200
            "
          >
            {rigNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Body - Grid Layout */}
      <div className="grid grid-cols-2 sm:grid-cols-2 gap-6 text-sm text-gray-300">
        {/* Current Graph Rate */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            Current Graph Rate
          </p>
          <p className="text-lg font-semibold text-white">{currentGraphRate} GPS</p>
        </div>

        {/* 240-Block Avg */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
           Graph 240-Block Avg 
          </p>
          <p className="text-lg font-semibold text-white">{rig240BlockAvg} GPS</p>
        </div>

        {/* 1440-Block Avg */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            Graph 1440-Block Avg
          </p>
          <p className="text-lg font-semibold text-white">{rig1440BlockAvg} GPS</p>
        </div>

        {/* Daily Earnings */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            Est Daily Earnings
          </p>
          <p className="text-lg font-semibold text-white">{dailyEarnings} MWC</p>
        </div>

        {/* Chain Height */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            Last Height
          </p>
          <p className="text-lg font-semibold text-white">{chainHeight.toLocaleString()}</p>
        </div>

        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            Shares 1440-Block Accepted
          </p>
          <div className="flex items-center gap-2">
            <p className="text-lg font-semibold text-white">{sumShares.accepted}</p>
            | 
            <p className="text-xs text-gray-200">
              {acceptPercent}
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            Shares 1440-Block Stale
          </p>
          <div className="flex items-center gap-2">
            <p className="text-lg font-semibold text-white">{sumShares.stale}</p>
            | 
            <p className="text-xs text-gray-200">
              {stalePercent}
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            Shares 1440-Block Rejected
          </p>
          <div className="flex items-center gap-2">
            <p className="text-lg font-semibold text-white">{sumShares.rejected}</p>
            | 
            <p className="text-xs text-gray-200">
              {rejectPercent}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

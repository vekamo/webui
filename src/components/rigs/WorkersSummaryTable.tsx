"use client";

import React from "react";

interface WorkersSummaryTableProps {
  /**
   * The raw data keyed by block height => {
   *   [height]: {
   *     rigA: { worker1: { "31": {...} }, ... },
   *     rigB: { ... },
   *     timestamp?: number
   *   }
   */
  rigDataMiner: Record<number, any>;

  /**
   * A dictionary of rigName => rig-level GPS
   * from RigsContent (if you want to display it).
   */
  rigGpsMap: Record<string, number>;

  /** Number of recent blocks to look at for share stats. Defaults to 10. */
  lastN?: number;
}

/** The maximum range we look back to find *all* worker IDs. Defaults to 1000. */
const LONG_RANGE = 1000;

export default function WorkersSummaryTable({
  rigDataMiner,
  rigGpsMap,
  lastN = 10,
}: WorkersSummaryTableProps) {
  // ------------------------------
  // 1) Convert heights to a sorted array (descending)
  // ------------------------------
  const allHeightsDesc = Object.keys(rigDataMiner)
    .map((h) => parseInt(h, 10))
    .sort((a, b) => b - a);

  // If there's no data, bail
  if (!allHeightsDesc.length) {
    return (
      <div className="text-gray-400">No rigDataMiner found.</div>
    );
  }

  // ------------------------------
  // 2) The "long" pass => last 1000 blocks to find *all* workers
  // ------------------------------
  const longHeights = allHeightsDesc.slice(0, LONG_RANGE);
  // We'll store a set of {rigName, workerId} from the last 1000 blocks
  const allWorkersSet = new Set<string>();

  for (const height of longHeights) {
    const blockData = rigDataMiner[height];
    if (!blockData) continue;
    for (const rigName of Object.keys(blockData)) {
      if (rigName === "timestamp") continue;
      const rigWorkers = blockData[rigName];
      for (const workerId of Object.keys(rigWorkers)) {
        // e.g. "rigA||worker1"
        allWorkersSet.add(`${rigName}||${workerId}`);
      }
    }
  }

  // ------------------------------
  // 3) The "short" pass => last N blocks to compute share stats
  // ------------------------------
  const shortHeights = allHeightsDesc.slice(0, lastN);

  // We'll accumulate share stats in a map keyed by rigName+workerId
  type WorkerStats = {
    totalAccepted: number;
    totalRejected: number;
    totalStale: number;
  };
  const workerStatsMap = new Map<string, WorkerStats>();

  for (const height of shortHeights) {
    const blockData = rigDataMiner[height];
    if (!blockData) continue;
    for (const rigName of Object.keys(blockData)) {
      if (rigName === "timestamp") continue;
      const rigWorkers = blockData[rigName];
      for (const workerId of Object.keys(rigWorkers)) {
        const algo31 = rigWorkers[workerId]["31"];
        if (!algo31) continue;

        const mapKey = `${rigName}||${workerId}`;
        if (!workerStatsMap.has(mapKey)) {
          workerStatsMap.set(mapKey, {
            totalAccepted: 0,
            totalRejected: 0,
            totalStale: 0,
          });
        }

        const s = workerStatsMap.get(mapKey)!;
        s.totalAccepted += algo31.accepted || 0;
        s.totalRejected += algo31.rejected || 0;
        s.totalStale += algo31.stale || 0;
      }
    }
  }

  // ------------------------------
  // 4) Flatten into a final array for rendering
  // ------------------------------
  interface TableRow {
    rigName: string;
    workerId: string;
    accepted: number;
    rejected: number;
    stale: number;
    isActive: boolean; // accepted > 0
    gps: number;       // rig-level from rigGpsMap
  }

  const tableRows: TableRow[] = [];

  for (const combinedKey of allWorkersSet) {
    const [rigName, workerId] = combinedKey.split("||");
    const stats = workerStatsMap.get(combinedKey);
    const accepted = stats?.totalAccepted || 0;
    const rejected = stats?.totalRejected || 0;
    const stale = stats?.totalStale || 0;
    const isActive = accepted > 0;

    // rig-level GPS from rigGpsMap
    const rigGps = rigGpsMap[rigName] || 0;

    tableRows.push({
      rigName,
      workerId,
      accepted,
      rejected,
      stale,
      isActive,
      gps: rigGps,
    });
  }

  // Sort by rigName ascending, then workerId ascending
  tableRows.sort((a, b) => {
    if (a.rigName !== b.rigName) {
      return a.rigName.localeCompare(b.rigName);
    }
    return a.workerId.localeCompare(b.workerId);
  });

  // ------------------------------
  // 5) Render
  // ------------------------------
  return (
    <div
      className="
        w-full
        rounded-lg shadow-md
        bg-gradient-to-r from-[#182026] to-[#0f1215]
        border border-[#2A2D34]
        p-6 sm:p-8
        flex flex-col gap-4
        font-[family-name:var(--font-geist-mono)]
      "
    >
      <h2 className="text-xl sm:text-2xl font-extrabold text-white">
        Workers Summary
      </h2>
      <p className="text-sm text-gray-400">
        Shows all workers seen in the last {LONG_RANGE} blocks,
        plus stats from the most recent {lastN} blocks.
      </p>

      {tableRows.length === 0 ? (
        <p className="text-gray-400">No workers found at all.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-gray-300">
            <thead className="bg-[#1b1e23] text-gray-400">
              <tr>
                <th className="py-3 px-4 uppercase">Rig</th>
                <th className="py-3 px-4 uppercase">Worker</th>
                <th className="py-3 px-4 uppercase text-right">GPS</th>
                <th className="py-3 px-4 uppercase text-right">Accepted</th>
                <th className="py-3 px-4 uppercase text-right">Rejected</th>
                <th className="py-3 px-4 uppercase text-right">Stale</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, idx) => {
                const lightClass = row.isActive
                  ? "inline-block w-2 h-2 rounded-full bg-green-400"
                  : "inline-block w-2 h-2 rounded-full bg-red-500";

                return (
                  <tr
                    key={`${row.rigName}-${row.workerId}-${idx}`}
                    className="border-b border-[#2A2D34] hover:bg-[#23262c]"
                  >
                    {/* Leftmost: red/green circle + rig name */}
                    <td className="py-2 px-4">
                      <div className="flex items-center gap-2">
                        <span className={lightClass} />
                        <span>{row.rigName}</span>
                      </div>
                    </td>
                    <td className="py-2 px-4">{row.workerId}</td>
                    <td className="py-2 px-4 text-right">
                      {row.gps.toFixed(2)}
                    </td>
                    <td className="py-2 px-4 text-right">{row.accepted}</td>
                    <td className="py-2 px-4 text-right">{row.rejected}</td>
                    <td className="py-2 px-4 text-right">{row.stale}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

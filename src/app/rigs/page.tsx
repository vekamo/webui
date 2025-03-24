"use client";

import React, { useState, useEffect } from "react";
import { useDataContext } from "@/app/context/DataContext";

// Hooks or context
import { BLOCK_RANGE } from "@/constants/constants";
import {
  calculateDailyEarningFromGpsRange,
  getLastNBlocksAvgC31Gps,
} from "@/utils/utils";

// Shared components
import MinerStatsCard from "@/components/miners/MinerInfo";
import MinerHashRateChart from "@/components/miners/MinerHashRateChart";
import MinerSharesChart from "@/components/miners/MinerSharesChart";
import RecentBlocksTable from "@/components/miners/RecentBlock";
import WorkersSummaryTable from "@/components/rigs/WorkersSummaryTable";
import RigInfoCard from "@/components/rigs/RigCardInfo";

// Types + transform
import { transformRigData, sumShares } from "@/utils/transformRigData";
import {
  BlocksByHeight,
  MinerBlockHashrate,
  MinerBlockShare,
  NetworkBlock,
} from "@/types/types";

/** Build a dictionary of { height => { timestamp, ... } } from the network. */
function buildBlocksByHeight(networkHistorical: NetworkBlock[]): BlocksByHeight {
  const blocks: BlocksByHeight = {};
  for (const b of networkHistorical) {
    blocks[b.height] = {
      timestamp: b.timestamp,
      difficulty: b.difficulty,
      secondary_scaling: b.secondary_scaling,
    };
  }
  return blocks;
}

export default function RigsPage() {
  const {
    isLoading,
    error,
    rigHistorical,
    networkHistorical,
    latestBlock,
    immatureBalance,
    poolHistorical,
    recentPoolBlocks,
    nextBlockReward,
  } = useDataContext();

  // Which rig we have selected
  const [selectedRig, setSelectedRig] = useState<string>("default");

  // Data structures for ephemeral info
  const [ephemeralMap, setEphemeralMap] = useState<Record<string, any>>({});
  const [rigNames, setRigNames] = useState<string[]>([]);
  const [rigGpsMap, setRigGpsMap] = useState<Record<string, number>>({});

  useEffect(() => {
    // Build network info in a usable format
    const blocksByHeight = buildBlocksByHeight(networkHistorical);
    // Transform rig data to multiRigData => { rigName: [blockStats, ...], ... }
    const multiRigData = transformRigData(rigHistorical, blocksByHeight);

    // Current chain height
    const chainHeight = latestBlock?.height || 0;

    const newEphemeralMap: Record<string, any> = {};
    const newRigGpsMap: Record<string, number> = {};

    // Populate ephemeralMap for each rig
    for (const [rigName, rigBlocks] of Object.entries(multiRigData)) {
      // If this rig has no block stats, skip
      if (!rigBlocks.length) continue;

      let dynamicLastGraphRateStr = "0";
      let dynamic240AvgStr = "0";
      let dynamic1440AvgStr = "0";
      let dynamicDailyEarnings = "0";

      // Example calculations
      const sumSharesVal = sumShares(rigBlocks);
      const lastGpsValue = getLastNBlocksAvgC31Gps(rigBlocks, 10);
      dynamicLastGraphRateStr = `${lastGpsValue.toFixed(2)}`;
      newRigGpsMap[rigName] = lastGpsValue;

      const avg240 = getLastNBlocksAvgC31Gps(rigBlocks, 48);
      dynamic240AvgStr = avg240.toFixed(2);

      const avg1440 = getLastNBlocksAvgC31Gps(rigBlocks, 288);
      dynamic1440AvgStr = avg1440.toFixed(2);

      if (chainHeight && networkHistorical.length > 0) {
        // Daily earnings estimate
        const daily = calculateDailyEarningFromGpsRange(
          networkHistorical,
          rigBlocks,
          chainHeight - BLOCK_RANGE,
          chainHeight
        );
        dynamicDailyEarnings = String(daily);
      }

      // Prepare chart data
      const chartDataHash = rigBlocks.map((rb) => ({
        id: rb.id,
        timestamp: rb.timestamp,
        height: rb.height,
        valid_shares: rb.valid_shares,
        invalid_shares: rb.invalid_shares,
        stale_shares: rb.stale_shares,
        gps: rb.gps,
      }));

      const chartDataShares = rigBlocks.map((rb) => ({
        timestamp: rb.timestamp,
        height: rb.height,
        valid_shares: rb.valid_shares,
        invalid_shares: rb.invalid_shares,
        stale_shares: rb.stale_shares,
        name: rigName,
      }));

      newEphemeralMap[rigName] = {
        dynamicLastGraphRateStr,
        dynamic240AvgStr,
        dynamic1440AvgStr,
        dynamicDailyEarnings,
        chartDataHash,
        chartDataShares,
        lastHeight: rigBlocks[rigBlocks.length - 1].height,
        sumSharesVal,
      };
    }

    // Once built, store them to state
    setEphemeralMap(newEphemeralMap);
    // Also store rigNames in sorted order
    const newRigNames = Object.keys(newEphemeralMap).sort();
    setRigNames(newRigNames);
    setRigGpsMap(newRigGpsMap);
  }, [rigHistorical, networkHistorical, latestBlock]);

  useEffect(() => {
    // If we're still 'default' but we have actual rig names, pick the first
    if (rigNames.length > 0 && selectedRig === "default") {
      setSelectedRig(rigNames[0]);
    }
  }, [rigNames, selectedRig]);

  // ---- RENDER ----
  return (
    <div className="min-h-screen bg-black text-white font-[family-name:var(--font-geist-mono)]">
      {/* HEADER */}
      <header className="w-full px-6 py-6 bg-black">
        <h1 className="text-5xl font-extrabold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent tracking-tight">
          Rigs
        </h1>
        <p className="text-gray-400 text-md mt-1">
          Real-time overview of <strong>multiple</strong> mining rigs.
        </p>
      </header>

      <hr className="w-full h-px border-0 bg-gradient-to-r from-transparent via-gray-700 to-transparent my-0" />

      <main className="min-h-[calc(100vh-5rem)] px-8 sm:px-16 pb-16">
        {/* 1. If we have an error, show it. */}
        {error ? (
          <div className="flex flex-col items-center justify-center mt-10 text-red-500">
            {error}
          </div>
        ) : /* 2. If loading or we have no rigs, show a spinner. */
        isLoading || !rigNames.length ? (
          <div className="flex items-center justify-center h-[calc(100vh-5rem)]">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-white" />
              <p className="text-gray-400">Loading data...</p>
            </div>
          </div>
        ) : (
          /* 3. Otherwise, we have loaded content. Let's guard for ephemeralMap. */
          (() => {
            const selectedRigData = ephemeralMap[selectedRig];

            // If the user picked a rig that doesn't exist in ephemeralMap:
            if (!selectedRigData) {
              return (
                <div className="px-6 pt-8">
                  <h2 className="text-2xl font-bold mb-2">No data for rig: {selectedRig}</h2>
                  <p className="text-gray-400">
                    Please choose a different rig or check again later.
                  </p>
                </div>
              );
            }

            // We do have data for selectedRig, so render the normal UI
            return (
              <div className="mt-10 w-full max-w-7xl mx-auto flex flex-col gap-8">
                <WorkersSummaryTable
                  rigDataMiner={rigHistorical}
                  rigGpsMap={rigGpsMap}
                  lastN={10}
                />

                <section className="bg-gray-1000 rounded">
                  <div className="flex flex-col md:flex-row gap-8">
                    <div className="md:w-1/3">
                      <RigInfoCard
                        rigNames={rigNames}
                        selectedRig={selectedRig}
                        onRigChange={(newRig) => setSelectedRig(newRig)}
                        currentGraphRate={selectedRigData.dynamicLastGraphRateStr}
                        chainHeight={latestBlock?.height || 0}
                        rig240BlockAvg={selectedRigData.dynamic240AvgStr}
                        rig1440BlockAvg={selectedRigData.dynamic1440AvgStr}
                        dailyEarnings={selectedRigData.dynamicDailyEarnings}
                        sumShares={selectedRigData.sumSharesVal}
                      />
                    </div>

                    <div className="md:w-2/3 -8">
                      <MinerHashRateChart minerData={selectedRigData.chartDataHash} />
                    </div>
                  </div>

                  <div className="gap-8 mt-6">
                    <MinerSharesChart minerData={selectedRigData.chartDataShares} />
                  </div>

                  {/* Example: If you want to show a recent blocks table
                  <div className="mt-6">
                    <RecentBlocksTable
                      range={40}
                      recentBlocks={recentPoolBlocks}
                      lastHeight={selectedRigData.lastHeight}
                      networkData={networkHistorical}
                      mwcPoolData={poolHistorical}
                      minerShareData={selectedRigData.chartDataShares}
                    />
                  </div>
                  */}
                </section>
              </div>
            );
          })()
        )}
      </main>
    </div>
  );
}

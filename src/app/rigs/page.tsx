"use client";

import React, { useState, useEffect } from "react";
import { useDataContext } from "@/app/context/DataContext";

// Hooks or context
import { BLOCK_RANGE } from "@/constants/constants";
import {
  calculateDailyEarningFromGpsRange,
  getLastNBlocksAvgC31Gps
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
import { BlocksByHeight, MinerBlockHashrate, MinerBlockShare, NetworkBlock } from "@/types/types";

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

  const [selectedRig, setSelectedRig] = useState<string>("default");

  // Calculate rig names and map once all data is available
  const [ephemeralMap, setEphemeralMap] = useState<Record<string, any>>({});
  const [rigNames, setRigNames] = useState<string[]>([]);
  const [rigGpsMap, setRigGpsMap] = useState<Record<string, number>>({});

  useEffect(() => {
    const blocksByHeight = buildBlocksByHeight(networkHistorical);
    const multiRigData = transformRigData(rigHistorical, blocksByHeight);

    const chainHeight = latestBlock?.height || 0;

    const newEphemeralMap: Record<string, any> = {};
    const newRigGpsMap: Record<string, number> = {};

    // Process all rigs
    for (const [rigName, rigBlocks] of Object.entries(multiRigData)) {
      if (!rigBlocks.length) continue;
      let dynamicLastGraphRateStr = "0";
      let dynamic240AvgStr = "0";
      let dynamic1440AvgStr = "0";
      let dynamicDailyEarnings = "0";

      const sumSharesVal = sumShares(rigBlocks);
      const lastGpsValue = getLastNBlocksAvgC31Gps(rigBlocks, 10);
      dynamicLastGraphRateStr = `${lastGpsValue.toFixed(2)}`;
      newRigGpsMap[rigName] = lastGpsValue;

      const avg240 = getLastNBlocksAvgC31Gps(rigBlocks, 48);
      dynamic240AvgStr = avg240.toFixed(2);

      const avg1440 = getLastNBlocksAvgC31Gps(rigBlocks, 288);
      dynamic1440AvgStr = avg1440.toFixed(2);

      console.log('rigBlocks', rigBlocks)
      if (chainHeight && networkHistorical.length > 0) {
        const daily = calculateDailyEarningFromGpsRange(
          networkHistorical,
          rigBlocks,
          chainHeight - BLOCK_RANGE,
          chainHeight
        );
        dynamicDailyEarnings = String(daily);
      }
      
      const chartDataHash = rigBlocks.map((rb) => ({
        id: rb.id,
        timestamp: rb.timestamp,
        height: rb.height,
        valid_shares: rb.valid_shares,
        invalid_shares: rb.invalid_shares,
        stale_shares: rb.stale_shares,
        gps: rb.gps,
        // plus any optional fields or defaults
        user_id: 0,
        dirty: 0,
        total_valid_shares: 0,
        total_invalid_shares: 0,
        total_stale_shares: 0,
        mwc_stats_id: null,
        pool_stats_id: null,
        worker_stats_id: 0
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

    setEphemeralMap(newEphemeralMap);
    setRigNames(Object.keys(newEphemeralMap).sort());
    setRigGpsMap(newRigGpsMap);
  }, [rigHistorical, networkHistorical, latestBlock]);

  useEffect(() => {
    // Set selectedRig to the first available rig if it is still "default"
    if (rigNames.length > 0 && selectedRig === "default") {
      setSelectedRig(rigNames[0]);
    }
  }, [rigNames, selectedRig]);

  return (
    <div className="min-h-screen bg-black text-white font-[family-name:var(--font-geist-mono)]">
      {/* HEADER (always visible) */}
      <header className="w-full px-6 py-6 bg-black">
        <h1 className="text-5xl font-extrabold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent tracking-tight">
          Rigs
        </h1>
        <p className="text-gray-400 text-md mt-1">
          Real-time overview of <strong>multiple</strong> mining rigs.
        </p>
      </header>

      <hr className="w-full h-px border-0 bg-gradient-to-r from-transparent via-gray-700 to-transparent my-0" />

      {/* MAIN AREA */}
      <main className="min-h-[calc(100vh-5rem)] px-8 sm:px-16 pb-16">
        {error ? (
          <div className="flex flex-col items-center justify-center mt-10 text-red-500">
            {error}
          </div>
        ) : isLoading || !rigNames.length ? (
          // LOADING SPINNER
          <div className="flex items-center justify-center h-[calc(100vh-5rem)]">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-white" />
              <p className="text-gray-400">Loading data...</p>
            </div>
          </div>
        ) : (
          // LOADED CONTENT
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
                    currentGraphRate={
                      ephemeralMap[selectedRig].dynamicLastGraphRateStr
                    }
                    chainHeight={latestBlock?.height || 0}
                    rig240BlockAvg={
                      ephemeralMap[selectedRig].dynamic240AvgStr
                    }
                    rig1440BlockAvg={
                      ephemeralMap[selectedRig].dynamic1440AvgStr
                    }
                    dailyEarnings={
                      ephemeralMap[selectedRig].dynamicDailyEarnings
                    }
                    sumShares={ephemeralMap[selectedRig].sumSharesVal}
                  />
                </div>
                <div className="md:w-2/3 -8">
                  <MinerHashRateChart
                    minerData={ephemeralMap[selectedRig].chartDataHash}
                  />
                </div>
              </div>

              <div className="gap-8 mt-6">
                <MinerSharesChart
                  minerData={ephemeralMap[selectedRig].chartDataShares}
                />
              </div>

             {/* <div className="mt-6">
                <RecentBlocksTable
                  range={40}
                  recentBlocks={recentPoolBlocks}
                  lastHeight={ephemeralMap[selectedRig].lastHeight}
                  networkData={networkHistorical}
                  mwcPoolData={poolHistorical}
                  minerShareData={ephemeralMap[selectedRig].chartDataShares}
                />
              </div>*/}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

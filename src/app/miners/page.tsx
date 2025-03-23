"use client";

import { useDataContext } from "@/app/context/DataContext";
import getC31AvgForHeightRange, {
  calculateDailyEarningFromGpsRange,
  getLastNBlocksAvgC31Gps,
} from "@/utils/utils";
import { BLOCK_RANGE } from "@/constants/constants";

// Components
import MinerStatsCard from "@/components/miners/MinerInfo";
import MinerHashRateChart from "@/components/miners/MinerHashRateChart";
import MinerSharesChart from "@/components/miners/MinerSharesChart";
import RecentBlocksTable from "@/components/miners/RecentBlock";

export default function MinersPage() {
  const {
    isLoading,
    error,
    minerHistorical,
    nextBlockReward,
    latestBlock,
    immatureBalance,
    networkHistorical,
    poolHistorical,
    recentPoolBlocks,
  } = useDataContext();

  return (

    <div className="min-h-screen bg-black text-white font-[family-name:var(--font-geist-mono)]">
    {/* HEADER */}
    <header className="w-full px-6 py-6 bg-black">
      <h1 className="text-5xl font-extrabold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent tracking-tight">
      Miners
      </h1>
      <p className="text-gray-400 text-md mt-1">
      Real-time overview of your mining performance.
      </p>
    </header>

      <hr
        className="
          w-full h-px border-0
          bg-gradient-to-r
          from-transparent via-gray-700 to-transparent
          my-0
        "
      />

      {/* MAIN CONTENT */}
      <main className="min-h-[calc(100vh-5rem)] px-8 sm:px-16 pb-16">
        {error ? (
          <div className="flex flex-col items-center justify-center mt-10 text-red-500">
            {error}
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center h-[calc(100vh-5rem)]">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-white" />
              <p className="text-gray-400">Loading miner data...</p>
            </div>
          </div>
        ) : (
          <div className="mt-10 w-full max-w-7xl mx-auto flex flex-col gap-8">
            <MinersContent
              minerHistorical={minerHistorical}
              nextBlockReward={nextBlockReward}
              latestBlock={latestBlock}
              immatureBalance={immatureBalance}
              networkHistorical={networkHistorical}
              poolHistorical={poolHistorical}
              recentBlocks={recentPoolBlocks}
            />
          </div>
        )}
      </main>
    </div>
  );
}

/** Subcomponent that does all the final transformation + rendering. */
function MinersContent({
  minerHistorical,
  nextBlockReward,
  latestBlock,
  immatureBalance,
  networkHistorical,
  poolHistorical,
  recentBlocks,
}: {
  minerHistorical: any[];
  nextBlockReward: any;
  latestBlock: any;
  immatureBalance: number;
  networkHistorical: any[];
  poolHistorical: any[];
  recentBlocks: any[];
}) {
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // 1) Pre-calc ephemeral stats
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  let dynamicLastGraphRateStr = "0 gps";
  let dynamic240AvgStr = "0";
  let dynamic1440AvgStr = "0";
  let dynamicDailyEarnings = "0";
  let lastHeight = 0;

  if (minerHistorical.length) {
    // (a) "Last 10 blocks" average
    const avgGps20 = getLastNBlocksAvgC31Gps(minerHistorical, 20)
    dynamicLastGraphRateStr = `${avgGps20.toFixed(2)} gps`;

    // (b) 240-block avg
    const lastBlock = minerHistorical[minerHistorical.length - 1];
    lastHeight = lastBlock.height;
    const fromHeight240 = lastHeight - 240;
    const avg240 = getC31AvgForHeightRange(
      minerHistorical,
      fromHeight240,
      lastHeight
    );
    dynamic240AvgStr = avg240.toFixed(2);

    // (c) 1440-block avg
    const fromHeight1440 = lastHeight - 1440;
    const avg1440 = getC31AvgForHeightRange(
      minerHistorical,
      fromHeight1440,
      lastHeight
    );
    dynamic1440AvgStr = avg1440.toFixed(2);
  }

  // Daily earnings
  if (
    latestBlock?.height &&
    networkHistorical.length > 0 &&
    minerHistorical.length > 0
  ) {
    const daily = calculateDailyEarningFromGpsRange(
      networkHistorical,
      minerHistorical,
      latestBlock.height - BLOCK_RANGE,
      latestBlock.height
    );
    dynamicDailyEarnings = String(daily);
  }

  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // 2) Render final layout
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  return (
    <>
      {/* TOP ROW => MinerStatsCard + HashRate Chart */}
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/3">
          <MinerStatsCard
            currentGraphRate={dynamicLastGraphRateStr}
            chainHeight={latestBlock?.height}
            lastNetworkBlock="n/a"
            miner240BlockAvg={dynamic240AvgStr}
            miner1440BlockAvg={dynamic1440AvgStr}
            estimatedShareLast="n/a"
            estimatedShareNext={nextBlockReward}
            estimatedDailyEarnings={dynamicDailyEarnings}
            currentBalance={immatureBalance}
            immatureBalance={immatureBalance}
          />
        </div>
        <div className="md:w-2/3">
          <MinerHashRateChart minerData={minerHistorical} />
        </div>
      </div>

      {/* Shares Chart */}
      <MinerSharesChart minerData={minerHistorical} />

      {/* Recently Found Blocks */}
      <div>
        <RecentBlocksTable
          range={40}
          recentBlocks={recentBlocks}
          lastHeight={lastHeight}
          networkData={networkHistorical}
          mwcPoolData={poolHistorical}
          minerShareData={minerHistorical}
        />
      </div>
    </>
  );
}

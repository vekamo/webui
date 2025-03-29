"use client";

import { useDataContext } from "@/app/context/DataContext";
import NetworkStatsCard from "@/components/dashboard/NetworkStatsCard";
import PoolStatsCard from "@/components/dashboard/PoolStatsCard";
import RecentBlockCard from "@/components/dashboard/RecentBlockCard";
import PoolNetworkHashRateChart from "@/components/dashboard/PoolHashRateChart";

interface PoolStat {
  title: string;
  value: string;
}
interface BlockSummary {
  height: number;
  timestamp: string;
  reward: string;
  hash: string;
  difficulty: number;
  state: string;
}
interface HashRatePoint {
  timestamp: number;
  hashRate: number;
  height: number;
  difficulty?: number;
}

interface LastBlock {
  height: number;
  timestamp: string;
  reward: string;
  hash?: string;
  state?: string;
  difficulty?: number;
}

export default function DashboardPage() {
  const {
    isLoading,
    error,
    networkHistorical,
    latestBlock,
    lastBlockMined,
    poolHistorical,
    recentPoolBlocks,
    blocksMined
  } = useDataContext();

  return (
    <div className="min-h-screen bg-black text-white font-[family-name:var(--font-geist-mono)]">
      {/* HEADER */}
      <header className="w-full px-6 py-6 bg-black">
        <h1 className="text-5xl font-extrabold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent tracking-tight">
          Dashboard
        </h1>
        <p className="text-gray-400 text-md mt-1">
          Monitor network health, pool performance, and miner statistics in real-time.
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

      <main className="min-h-[calc(100vh-5rem)] px-8 sm:px-16 pb-16">
        {error ? (
          // Error => center it if you wish
          <div className="flex flex-col items-center justify-center mt-10 text-red-500">
            {error}
          </div>
        ) : isLoading ? (
          // Loading => place spinner in the absolute middle of the main area
          <div className="flex items-center justify-center h-[calc(100vh-5rem)]">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-white" />
              <p className="text-gray-400">Loading data...</p>
            </div>
          </div>
        ) : (
          // Wrap content in consistent spacing container
          <div className="mt-10 w-full max-w-7xl mx-auto flex flex-col gap-8">
            <DashboardContent
              networkHistorical={networkHistorical}
              latestBlock={latestBlock}
              poolHistorical={poolHistorical}
              recentBlocks={recentPoolBlocks}
              latestPoolBlockMined= {lastBlockMined}
              blockMined ={blocksMined}
            />
          </div>
        )}
      </main>
    </div>
  );
}

function DashboardContent({
  networkHistorical,
  latestBlock,
  poolHistorical,
  recentBlocks,
  latestPoolBlockMined,
  blockMined
}: {
  networkHistorical: any[];
  latestBlock: any;
  poolHistorical: any[];
  recentBlocks: any[];
  latestPoolBlockMined: any[];
  blockMined: any[]
}) {
  // A) Transform network data => chart, stats
  let networkHashRateData: HashRatePoint[] = [];
  let networkGraphRate = "N/A";
  if (networkHistorical.length) {
    networkHashRateData = networkHistorical.map((block) => {
      let c31Gps = 0;
      if (block.gps && block.gps[1]?.gps) {
        c31Gps = block.gps[1].gps;
      }
      return {
        timestamp: block.timestamp || 0,
        hashRate: c31Gps,
        height: block.height,
        difficulty: block.difficulty,
      };
    });
    const lastNetBlock = networkHistorical[networkHistorical.length - 1];
    if (lastNetBlock?.gps?.[1]?.gps) {
      networkGraphRate = `${lastNetBlock.gps[1].gps.toLocaleString()} gps`;
    }
  }
  const realNetworkStats: PoolStat[] = [
    {
      title: "Chain Height",
      value: latestBlock?.height
        ? latestBlock.height.toLocaleString()
        : "N/A",
    },
    {
      title: "Network Graph Rate",
      value: networkGraphRate,
    },
    {
      title: "Reward",
      value: "0.05 MWC",
    },
    {
      title: "Time Ago",
      value: latestBlock?.timestamp,
    },
  ];

  // B) Transform pool data => chart, stats
  let poolHashRateData: HashRatePoint[] = [];
  let realPoolStats: PoolStat[] = [];
  if (poolHistorical.length) {
    poolHashRateData = poolHistorical.map((block) => {
      let c31Gps = 0;
      if (Array.isArray(block.gps)) {
        const c31Entry = block.gps.find((g: any) => g.edge_bits === 31);
        if (c31Entry) c31Gps = c31Entry.gps;
      }
      return {
        timestamp: block.timestamp ?? 0,
        hashRate: c31Gps,
        height: block.height,
        difficulty: block.difficulty,
      };
    });
    const latestPool = poolHistorical[poolHistorical.length - 1];
    let poolGraphRate = "N/A";
    if (latestPool?.gps?.[0]?.gps) {
      poolGraphRate = latestPool.gps[0].gps.toLocaleString();
    }
    const activeMiners = latestPool?.active_miners || 0;
    const blocksFound = latestPool?.total_blocks_found?.toLocaleString() || "N/A";

    let sumC31 = 0;
    let countC31 = 0;
    poolHistorical.forEach((b) => {
      const c31Entry = b.gps?.find((g: any) => g.edge_bits === 31);
      if (c31Entry) {
        sumC31 += c31Entry.gps;
        countC31++;
      }
    });
    const averageC31 = countC31 > 0 ? (sumC31 / countC31) : 0;

    
    const avgMinersGps = (averageC31/activeMiners).toFixed(2)
    
    let latestPoolBlock = "N/A";
    if (recentBlocks?.length) {
      latestPoolBlock = recentBlocks[0].height.toLocaleString()
    }
    realPoolStats = [
      { title: "Latest Pool Block", value: latestPoolBlock },
      { title: "Pool Graph Rate", value: poolGraphRate + ' GPS' },
      { title: "Active Miners", value: activeMiners },
      { title: "Blocks Found", value: blocksFound },
      { title: "Avg c31 Rate", value: averageC31.toLocaleString() + ' GPS'},
      { title: "Avg Miner Rate", value: avgMinersGps.toLocaleString() + ' GPS'},
    ];
  }

  // C) Build data for “Recently Found Blocks”
  let lastBlocks: LastBlock[] = [];
  if (recentBlocks?.length) {
    lastBlocks = recentBlocks.map((b) => ({
      height: b.height,
      timestamp: b.timestamp
        ? new Date(b.timestamp * 1000).toLocaleString()
        : "n/a",
      reward: "0.05 MWC",
      hash: b.hash || "n/a",
      difficulty: b.difficulty,
      state: b.state,
    }));
  }

  // D) Return final layout
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
        <NetworkStatsCard stats={realNetworkStats} />
        <PoolStatsCard stats={realPoolStats} />
      </div>

      <PoolNetworkHashRateChart
        poolData={poolHashRateData}
        networkData={networkHashRateData}
        blockMined= {blockMined}
        smooth
        windowSize={5}
      />

      <RecentBlockCard blocks={lastBlocks} />
    </>
  );
}

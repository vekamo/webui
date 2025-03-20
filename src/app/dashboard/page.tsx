"use client";

import { useEffect, useRef, useState } from "react";
import { useNetworkData } from "@/app/hooks/useNetworkData";
import { useMWCPool } from "@/app/hooks/useMWCPool";
import NetworkStatsCard from "@/components/dashboard/NetworkStatsCard";
import PoolStatsCard from "@/components/dashboard/PoolStatsCard";
import RecentBlockCard from "@/components/dashboard/RecentBlockCard";
import PoolNetworkHashRateChart from "@/components/dashboard/PoolHashRateChart";

// ~~~~~~~~~~~~~~~~~~~~~~~~ INTERFACES ~~~~~~~~~~~~~~~~~~~~~~~~

// The original PoolBlock interface:
interface PoolBlock {
  height: number;
  hash?: string;
  timestamp?: number;
  edge_bits?: number;
  share_counts?: any;
  gps?: any,
  active_miners?: any;
  total_blocks_found?: any;
  state?: any;
  difficulty?: any;
}
interface LastBlock {
  height: number;
  timestamp: string;
  reward: string;
  hash?: string;
  state?: string;
  difficulty?: number;
}

interface PoolStat {
  title: string;
  value: string;
}

// We'll define a minimal shape for the chart
interface HashRatePoint {
  timestamp: number;  // in UNIX seconds
  hashRate: number;   // e.g. c31 GPS
  height: number;
  difficulty?: number;
}

// ~~~~~~~~~~~~~~~~~~~~~~~~ MAIN COMPONENT ~~~~~~~~~~~~~~~~~~~~~~~~

export default function PoolPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const {
    // from useNetworkData
    networkHistorical,
    latestBlock,
    fetchNetworkData,
    getLatestBlock,
    fetchNetworkRecentBlocks,
  } = useNetworkData();

  const {
    // from useMWCPool
    poolHistorical,
    recentBlocks,
    fetchMWCPoolData,
    fetchMWCPoolRecentBlocks,
  } = useMWCPool();

  const [poolHashRateData, setPoolHashRateData] = useState<HashRatePoint[]>([]);
  const [networkHashRateData, setNetworkHashRateData] = useState<HashRatePoint[]>([]);

  const [lastBlocks, setLastBlocks] = useState<LastBlock[]>([]);
  const [realNetworkStats, setRealNetworkStats] = useState<PoolStat[]>([]);
  const [realPoolStats, setRealPoolStats] = useState<PoolStat[]>([]);

  const [networkGraphRate, setNetworkGraphRate] = useState("N/A");
  const previousBlockHeightRef = useRef<number>(0);

  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // 1) Initial load (once)
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const blockData = await getLatestBlock();
        const { height = 0 } = blockData || {};

        if (height > 0) {
          await fetchNetworkData(height);
          await fetchMWCPoolData(height);

          const minedBlockAlgos = { c31: [0, height] };
          await fetchMWCPoolRecentBlocks(height, minedBlockAlgos);
          await fetchNetworkRecentBlocks(height, 10);

          previousBlockHeightRef.current = height;
        }
      } catch (err: any) {
        if (mounted) {
          console.error("Error on initial load:", err);
          setError(err.message);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // 2) Background poll every 5s
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const newBlock = await getLatestBlock();
        if (!newBlock || !newBlock.height) return;

        const oldHeight = previousBlockHeightRef.current;
        const currHeight = newBlock.height;

        if (currHeight > oldHeight) {
          await fetchNetworkData(currHeight);
          await fetchMWCPoolData(currHeight);

          const minedBlockAlgos = { c31: [0, currHeight] };
          await fetchMWCPoolRecentBlocks(currHeight, minedBlockAlgos);
          await fetchNetworkRecentBlocks(currHeight, 20);

          previousBlockHeightRef.current = currHeight;
        }
      } catch (err) {
        console.error("Background poll error:", err);
      }
    }, 5000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // 3) Compute networkGraphRate
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  useEffect(() => {
    if (!networkHistorical.length) return;
    const lastNetBlock = networkHistorical[networkHistorical.length - 1];
    let c31Rate = "N/A";

    // For example, if the c31 entry is at index 1
    if (lastNetBlock?.gps && lastNetBlock.gps[1]?.gps) {
      c31Rate = lastNetBlock.gps[1].gps.toLocaleString() + " gps";
    }
    setNetworkGraphRate(c31Rate);
  }, [networkHistorical]);

  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // 4) Build chart data (POOL + NETWORK) + partial pool stats
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  useEffect(() => {
    // 4A) Transform POOL data into an array of { timestamp, hashRate }
    if (poolHistorical.length) {
      const hashData = poolHistorical.map((block) => {
        let c31Gps = 0;
        if (Array.isArray(block.gps)) {
          const c31Entry = block.gps.find((g: any) => g.edge_bits === 31);
          if (c31Entry) c31Gps = c31Entry.gps;
        }
        return {
          timestamp: block.timestamp || 0, // default to 0 if undefined
          hashRate: c31Gps,
          height: block.height,

        };
      });
      setPoolHashRateData(hashData);
    }

    // 4B) Transform NETWORK data into an array of { timestamp, hashRate }
    if (networkHistorical.length) {
      const netHashData = networkHistorical.map((block) => {
        let c31Gps = 0;
        // If c31 is at index 1 in gps array, or you can .find(...) similarly
        if (block.gps && block.gps[1]?.gps) {
          c31Gps = block.gps[1].gps;
        }
        return {
          timestamp: block.timestamp || 0,
          hashRate: c31Gps,
          height: block.height,
          difficulty: block.difficulty
        };
      });
      setNetworkHashRateData(netHashData);
    }

    // 4C) Also do partial pool stats
    if (poolHistorical.length) {
      const latestPool = poolHistorical[poolHistorical.length - 1];
      let poolGraphRate = "N/A";
      if (latestPool?.gps?.[0]?.gps) {
        poolGraphRate = latestPool.gps[0].gps.toLocaleString() + " gps";
      }
      const activeMiners = latestPool?.active_miners?.toString() || "N/A";
      const blocksFound = latestPool?.total_blocks_found?.toLocaleString() || "N/A";

      let sumC31 = 0;
      let countC31 = 0;
      poolHistorical.forEach((b) => {
        const c31Entry = b.gps?.find((g) => g.edge_bits === 31);
        if (c31Entry) {
          sumC31 += c31Entry.gps;
          countC31++;
        }
      });
      const averageC31 =
        countC31 > 0 ? (sumC31 / countC31).toFixed(2) + " gps" : "N/A";

      // 4D) Build "Network Stats"
      const newNetworkStats: PoolStat[] = [
        {
          title: "Chain Height",
          value: latestBlock.height
            ? latestBlock.height.toLocaleString()
            : "N/A",
        },
        { title: "Network Graph Rate", value: networkGraphRate },
        { title: "Reward", value: "0.05 MWC" },
      ];

      // 4E) Build "Pool Stats"
      const oldPoolStats = [...realPoolStats];
      const existingLatestPoolBlock = oldPoolStats.find(
        (s) => s.title === "Latest Pool Block"
      );

      const newPoolStats: PoolStat[] = [
        {
          title: "Latest Pool Block",
          value: existingLatestPoolBlock?.value ?? "N/A",
        },
        { title: "Pool Graph Rate", value: poolGraphRate },
        { title: "Active Miners", value: activeMiners },
        { title: "Blocks Found", value: blocksFound },
        { title: "Avg c31 Rate", value: averageC31 },
        { title: "Avg Miner Rate", value: averageC31 },
      ];

      setRealNetworkStats((prev) => {
        if (JSON.stringify(prev) === JSON.stringify(newNetworkStats))
          return prev;
        return newNetworkStats;
      });

      setRealPoolStats((prev) => {
        if (JSON.stringify(prev) === JSON.stringify(newPoolStats)) return prev;
        return newPoolStats;
      });
    }
  }, [
    poolHistorical,
    networkHistorical,
    networkGraphRate,
    latestBlock.height,
    realPoolStats,
  ]);

  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // 5) Build table from recentBlocks
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  useEffect(() => {
    if (!recentBlocks.length) return;
    const blocksArr = recentBlocks.map((b) => ({
      height: b.height,
      timestamp: b.timestamp
        ? new Date(b.timestamp * 1000).toLocaleString()
        : "n/a",
      reward: "0.05 MWC",
      hash: b.hash || "n/a",
      difficulty: b.difficulty,
      state: b.state
    }));
    setLastBlocks(blocksArr);
  }, [recentBlocks]);

  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // 6) Insert the real "Latest Pool Block" into stats
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  useEffect(() => {
    if (!recentBlocks.length) return;
    const newest = recentBlocks[0];
    const blockNum = newest.height?.toLocaleString() || "N/A";

    setRealPoolStats((prev) => {
      if (!prev.length) return prev;
      const idx = prev.findIndex((s) => s.title === "Latest Pool Block");
      if (idx === -1) return prev;

      if (prev[idx].value !== blockNum) {
        const updated = [...prev];
        updated[idx] = { title: "Latest Pool Block", value: blockNum };
        return updated;
      }
      return prev;
    });
  }, [recentBlocks, realPoolStats]);

  // --------------------------------------------------------------------------
  // Layout
  // --------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-black text-white font-[family-name:var(--font-geist-mono)]">
      {/* Header */}
      <header className="w-full px-6 py-6 bg-black border-b border-white/[.1]">
        <h1 className="text-5xl font-extrabold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent tracking-tight">
          Dashboard
        </h1>
        <p className="text-gray-400 text-md mt-1">
          Monitor network health, pool performance, and miner statistics in real-time.
        </p>
      </header>

      {/* Main Content */}
      <main className="flex flex-col items-center justify-center min-h-[calc(100vh-5rem)] px-8 sm:px-16 pb-16">
        {error ? (
          <p className="text-red-500 mt-10">{error}</p>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center mt-20">
            <div className="text-white animate-spin rounded-full h-12 w-12 border-b-4 border-white mb-6" />
            <p className="text-gray-400">Loading data...</p>
          </div>
        ) : (
          <div className="w-full max-w-7xl flex flex-col gap-10 mt-10">
            {/* Row #1 => Network + Pool Stats side-by-side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              {/* Card: Network Stats */}
              <NetworkStatsCard stats={realNetworkStats} />

              {/* Card: Pool Stats */}
              <PoolStatsCard stats={realPoolStats} />
            </div>

            {/* Chart with TWO lines: pool vs network */}
            <PoolNetworkHashRateChart
              poolData={poolHashRateData}
              networkData={networkHashRateData}
              smooth={true}
              windowSize={5}
            />

            {/* Card: Recently Found Blocks */}
            <RecentBlockCard blocks={lastBlocks} />
          </div>
        )}
      </main>
    </div>
  );
}
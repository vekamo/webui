"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useMWCPool } from "@/app/hooks/useMWCPool"; // The custom hook with old merging logic

import LastBlocksTable from "@/components/pool/LastBlocksTable";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

/**
 * Example shape for the hash rate data chart
 */
interface HashRatePoint {
  time: string;
  hashRate: number;
}

/**
 * Example shape for the last blocks table
 */
interface LastBlock {
  height: number;
  timestamp: string; 
  reward: string;     // or any additional fields
}

export default function PoolPage() {
  // If your API requires a token (e.g. for auth)
  const token = Cookies.get("token");

  // Basic loading/error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // The custom hook states & methods
  const {
    poolHistorical,         // from fetchMWCPoolData
    recentBlocks,           // from fetchMWCPoolRecentBlocks
    fetchMWCPoolData,
    fetchMWCPoolRecentBlocks,
  } = useMWCPool();

  // We'll store the final arrays for chart & table
  const [hashRateData, setHashRateData] = useState<HashRatePoint[]>([]);
  const [lastBlocks, setLastBlocks] = useState<LastBlock[]>([]);

  // Example "latestBlockHeight" for the merging logic
  const latestBlockHeight = 2784778;

  // On mount, fetch 2 sets of data: "poolData" & "recentBlocks"
  useEffect(() => {

    async function loadData() {
      try {
        setIsLoading(true);
        // 1) Hash Rate data from "fetchMWCPoolData"
        await fetchMWCPoolData(latestBlockHeight);

        // 2) Last blocks from "fetchMWCPoolRecentBlocks"
        // If you have "minedBlockAlgos"
        const minedBlockAlgos = { c31: [2784775, 2784776] }; // example
        await fetchMWCPoolRecentBlocks(latestBlockHeight, minedBlockAlgos);

        setIsLoading(false);
      } catch (err: any) {
        console.error(err);
        setError(err.message);
        setIsLoading(false);
      }
    }

    loadData();
  }, [token]);

  // Whenever "poolHistorical" changes, transform it → hashRateData
  useEffect(() => {
    const transformed = poolHistorical.map((block) => {
      const timeStr = block.timestamp
        ? new Date(block.timestamp * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : "n/a";

      let c31Gps = 0;
      if (block.gps && Array.isArray(block.gps)) {
        const c31Entry = block.gps.find((g: any) => g.edge_bits === 31);
        c31Gps = c31Entry ? c31Entry.gps : 0;
      }
      return { time: timeStr, hashRate: c31Gps };
    });
    setHashRateData(transformed);
  }, [poolHistorical]);

  // Whenever "recentBlocks" changes, transform → lastBlocks table shape
  useEffect(() => {
    // Suppose each block is {height, timestamp, edge_bits}, we add "reward"
    const transformed = recentBlocks.map((b) => ({
      height: b.height,
      timestamp: b.timestamp
        ? new Date(b.timestamp * 1000).toLocaleString()
        : "n/a",
      reward: "0.05 MWC", // or compute if your data has it
    }));
    setLastBlocks(transformed);
  }, [recentBlocks]);

  // Example 3-column stats in the middle
  const poolStats = [
    { title: "Graph Rate", value: "10,377 gps" },
    { title: "Chain Height", value: "2,784,781" },
    { title: "Block Found", value: "183 sec ago" },
    { title: "Difficulty", value: "129,740,234" },
    { title: "Reward", value: "0.05 MWC / block" },
    { title: "Miner Avg", value: "N/A" },
  ];

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen px-8 sm:px-16 pb-16 gap-12 sm:gap-16 font-[family-name:var(--font-geist-sans)] bg-black text-white">
      <main className="flex flex-col gap-6 row-start-2 items-center w-full max-w-4xl">
        
        {/* Title */}
        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          Mine MWC Efficiently.
        </h1>
        <p className="mt-3 text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Track real-time mining stats, pool performance, hash rates, and rewards.
        </p>

        {/* Loading & Error */}
        {isLoading ? (
          <p className="text-gray-500">Loading pool data...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <>
            {/* 1) Hash Rate Chart */}
            <div className="w-full bg-black/[.15] dark:bg-white/[.06] p-6 rounded-lg shadow-md border border-white/[.1]">
              <h2 className="text-sm font-medium text-gray-400 mb-3 text-center font-[family-name:var(--font-geist-mono)]">
                Hash Rate Over Time (TH/s)
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={hashRateData}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} stroke="gray" />
                  <XAxis dataKey="time" stroke="gray" fontSize={12} />
                  <YAxis stroke="gray" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#111",
                      color: "#fff",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Line type="monotone" dataKey="hashRate" stroke="#fff" strokeWidth={1.2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* 2) Three-Column Stats */}
            <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full max-w-4xl text-sm text-center font-[family-name:var(--font-geist-mono)]">
              {poolStats.map((stat, index) => (
                <li
                  key={index}
                  className="p-3 border border-white/[.1] bg-black/[.15] dark:bg-white/[.06] rounded-lg shadow-md text-white tracking-[-.01em] transition-transform hover:scale-105"
                >
                  <h2 className="text-xs text-gray-400">{stat.title}</h2>
                  <p className="text-lg font-bold mt-1 text-white">{stat.value}</p>
                </li>
              ))}
            </ol>

            {/* 3) Last Blocks Table */}
            <div className="w-full">
              {/* We'll place your LastBlocksTable here */}
              {/* E.g. if it expects lastBlocks: LastBlock[] */}
              <LastBlocksTable lastBlocks={lastBlocks} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

"use client";
import { useState } from "react";
import { API_URL_V2 } from "@/constants/constants"; // Adjust to your config
import { BLOCK_RANGE } from "@/constants/constants"; // Adjust path if needed

// Example types – adapt to your real API
interface PoolBlock {
  height: number;
  timestamp?: number;
  edge_bits?: number;
  share_counts?: any;
  gps?: any,
}

// For the "poolBlocksMined" logic
interface BlocksMinedData {
  c31: number[];
  orphaned: number[];
  c31BlocksWithTimestamps: Record<number, { height: number; timestamp: number }>;
}

export function useMWCPool() {
  // State replicating "mwcPoolData.historical"
  const [poolHistorical, setPoolHistorical] = useState<PoolBlock[]>([]);
  // "mwcPoolData.poolBlocksMined" & "poolBlocksOrphaned"
  const [blocksMined, setBlocksMined] = useState<BlocksMinedData>({
    c31: [],
    orphaned: [],
    c31BlocksWithTimestamps: {},
  });
  // "mwcPoolData.sharesSubmitted"
  const [sharesSubmitted, setSharesSubmitted] = useState<PoolBlock[]>([]);
  // "MWC_POOL_LAST_BLOCK_MINED"
  const [lastBlockMined, setLastBlockMined] = useState<number | null>(null);
  // "MWC_POOL_RECENT_BLOCKS"
  const [recentBlocks, setRecentBlocks] = useState<PoolBlock[]>([]);

  // 1) fetchMWCPoolData
  async function fetchMWCPoolData(latestBlockHeight: number) {
    try {
      if (!latestBlockHeight) return;
      const prevData = poolHistorical;
      let prevMax = latestBlockHeight - BLOCK_RANGE;
      prevData.forEach((b) => {
        if (b.height > prevMax) prevMax = b.height;
      });
      const diff = latestBlockHeight - prevMax;
      const url = `${API_URL_V2}pool/stats/${latestBlockHeight},${diff}/gps,height,total_blocks_found,active_miners,timestamp,edge_bits`;
      const resp = await fetch(url);
      if (!resp.ok) return;
      const newData = await resp.json();
      const formatted = newData.map((block: any) => ({
        ...block,
        share_counts: JSON.parse(block.share_counts),
      }));
      const merged = [...prevData, ...formatted];
      const numberToRemove = merged.length > BLOCK_RANGE ? merged.length - BLOCK_RANGE : 0;
      const sliced = merged.slice(numberToRemove);
      setPoolHistorical(sliced);
    } catch (e) {
      console.log("Error in fetchMWCPoolData:", e);
    }
  }

  // 2) fetchMWCPoolLastBlock
  async function fetchMWCPoolLastBlock() {
    try {
      const url = `${API_URL_V2}pool/block`;
      const resp = await fetch(url);
      if (!resp.ok) return;
      const data = await resp.json();
      setLastBlockMined(data.timestamp);
    } catch (e) {
      console.log("Error in fetchMWCPoolLastBlock:", e);
    }
  }

  // 3) fetchMWCPoolRecentBlocks
  async function fetchMWCPoolRecentBlocks(latestBlockHeight: number, minedBlockAlgos: { c31: number[] }) {
    try {
      if (!latestBlockHeight) return;
      const url = `${API_URL_V2}pool/blocks/${latestBlockHeight},20`;
      const resp = await fetch(url);
      if (!resp.ok) return;
      const data = await resp.json();
      const withEdgeBits = data.map((block: any) => {
        let edge_bits = 31;
        if (minedBlockAlgos?.c31?.includes(block.height)) {
          edge_bits = 31;
        }
        return { ...block, edge_bits };
      });
      setRecentBlocks(withEdgeBits);
    } catch (e) {
      console.log("Error in fetchMWCPoolRecentBlocks:", e);
    }
  }

  // 4) fetchMWCPoolSharesSubmitted
  async function fetchMWCPoolSharesSubmitted(latestBlockHeight: number) {
    try {
      if (!latestBlockHeight) return;
      const prev = sharesSubmitted;
      let prevMax = latestBlockHeight - BLOCK_RANGE;
      prev.forEach((b) => {
        if (b.height > prevMax) prevMax = b.height;
      });
      const diff = latestBlockHeight - prevMax;
      const url = `${API_URL_V2}pool/stats/${latestBlockHeight},${diff}/shares_processed,total_shares_processed,active_miners,height`;
      const resp = await fetch(url);
      if (!resp.ok) return;
      const newData = await resp.json();
      const merged = [...prev, ...newData];
      const numberToRemove = merged.length > BLOCK_RANGE ? merged.length - BLOCK_RANGE : 0;
      const sliced = merged.slice(numberToRemove);
      setSharesSubmitted(sliced);
    } catch (e) {
      console.log("Error in fetchMWCPoolSharesSubmitted:", e);
    }
  }

  // 5) fetchMWCPoolBlocksMined
  async function fetchMWCPoolBlocksMined(latestBlockHeight: number, minedBlockAlgos: { c31: number[] }) {
    try {
      if (!latestBlockHeight) return;
      const prev = {
        c31: blocksMined.c31,
        orphaned: blocksMined.orphaned,
        c31BlocksWithTimestamps: blocksMined.c31BlocksWithTimestamps,
      };
      let combinedMax = Math.max(Math.max(...prev.c31), Math.max(...prev.orphaned));
      combinedMax = isFinite(combinedMax) ? combinedMax : 0;
      const diff = combinedMax ? latestBlockHeight - combinedMax : BLOCK_RANGE;
      const url = `${API_URL_V2}pool/blocks/${latestBlockHeight},${diff}`;
      const resp = await fetch(url);
      if (!resp.ok) return;
      const data = await resp.json();

      const c31Found: number[] = [];
      const c31Timestamps: Record<number, { height: number; timestamp: number }> = {};
      const orphaned: number[] = [];

      data.forEach((block: any) => {
        if (block.state === "new") {
          if (minedBlockAlgos.c31.includes(block.height)) {
            c31Found.push(block.height);
            c31Timestamps[block.height] = { height: block.height, timestamp: block.timestamp };
          }
        } else if (block.state === "orphan") {
          orphaned.push(block.height);
        }
      });

      const updatedC31 = [...prev.c31, ...c31Found];
      const updatedOrphan = [...prev.orphaned, ...orphaned];
      const updatedTimestamps = { ...prev.c31BlocksWithTimestamps, ...c31Timestamps };

      // Filter out old blocks
      const c31Filtered = updatedC31.filter((h) => h > latestBlockHeight - BLOCK_RANGE);
      const orphansFiltered = updatedOrphan.filter((h) => h > latestBlockHeight - BLOCK_RANGE);

      setBlocksMined({
        c31: c31Filtered,
        orphaned: orphansFiltered,
        c31BlocksWithTimestamps: updatedTimestamps,
      });
    } catch (e) {
      console.log("fetchMWCPoolBlocksMined error:", e);
    }
  }

  return {
    // States
    poolHistorical,
    blocksMined,
    sharesSubmitted,
    lastBlockMined,
    recentBlocks,

    // Methods
    fetchMWCPoolData,
    fetchMWCPoolLastBlock,
    fetchMWCPoolRecentBlocks,
    fetchMWCPoolSharesSubmitted,
    fetchMWCPoolBlocksMined,
  };
}

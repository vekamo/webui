"use client";
import { useState } from "react";

import { API_URL_V2, BLOCK_RANGE } from "@/constants/constants";

interface NetworkBlock {
  height: number;
  timestamp?: number;
  gps?: any;
  difficulty?: number;
  secondary_scaling?: number;
}

interface BlocksByHeight {
  [height: number]: {
    timestamp: number;
    difficulty: number;
    secondary_scaling: number;
  };
}

interface NetworkState {
  historical: NetworkBlock[];
  blocksByHeight: BlocksByHeight;
}

interface NetworkRecentBlock {
  height: number;
  timestamp: number;
}

interface MinedBlockAlgos {
  c31: number[];
}

export function useNetworkData() {
  const [networkHistorical, setNetworkHistorical] = useState<NetworkBlock[]>([]);
  const [blocksByHeight, setBlocksByHeight] = useState<BlocksByHeight>({});
  const [latestBlock, setLatestBlock] = useState<{ height: number; [key: string]: any }>({ height: 0 });
  const [networkRecentBlocks, setNetworkRecentBlocks] = useState<NetworkRecentBlock[]>([]);
  const [minedBlockAlgos, setMinedBlockAlgos] = useState<MinedBlockAlgos>({ c31: [] });

  //
  // 1) getLatestBlock → Return the fetched JSON so the caller can use it immediately
  //
  async function getLatestBlock() {
    try {
      const url = `${API_URL_V2}mwc/block`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("getLatestBlock request failed.");

      let data = await response.json();
      if (!data) data = { height: 0 };

      setLatestBlock(data);
      return data; // <-- Return the object so we can `await getLatestBlock()`
    } catch (e) {
      console.log("Error in getLatestBlock:", e);
      return { height: 0 }; // fallback
    }
  }

  //
  // 2) fetchNetworkData
  //
  async function fetchNetworkData(latestBlockHeight: number) {
    try {
      if (latestBlockHeight === 0) return;

      const prevData = networkHistorical;
      const prevBlocks = { ...blocksByHeight };

      // find previousMaxBlockHeight
      let previousMaxBlockHeight = latestBlockHeight - BLOCK_RANGE;
      prevData.forEach((block) => {
        if (block.height > previousMaxBlockHeight) {
          previousMaxBlockHeight = block.height;
        }
      });

      const blockDifference = latestBlockHeight - previousMaxBlockHeight;
      const url = `${API_URL_V2}mwc/stats/${latestBlockHeight},${blockDifference}/gps,height,difficulty,timestamp,secondary_scaling`;
      const response = await fetch(url);
      if (!response.ok) return;

      const newNetworkData: NetworkBlock[] = await response.json();

      // remove old blocks in blocksByHeight
      for (const hStr in prevBlocks) {
        const hNum = parseInt(hStr, 10);
        if (hNum < latestBlockHeight - 1440 - 240) {
          delete prevBlocks[hStr];
        }
      }
      // update blocksByHeight with new data
      newNetworkData.forEach((block) => {
        prevBlocks[block.height] = {
          timestamp: block.timestamp || 0,
          difficulty: block.difficulty || 0,
          secondary_scaling: block.secondary_scaling || 0,
        };
      });

      // merge new data with old
      const concatenated = [...prevData, ...newNetworkData];
      const numberToRemove = concatenated.length > BLOCK_RANGE ? concatenated.length - BLOCK_RANGE : 0;
      const newHistoricalData = concatenated.slice(numberToRemove);

      setNetworkHistorical(newHistoricalData);
      setBlocksByHeight(prevBlocks);
    } catch (e) {
      console.log("Error in fetchNetworkData:", e);
    }
  }

  //
  // 3) fetchNetworkRecentBlocks
  //
  async function fetchNetworkRecentBlocks(endBlock: number | null = null, range: number = 20) {
    try {
      const lbHeight = endBlock || latestBlock.height || 0;
      if (lbHeight === 0) return;

      const url = `${API_URL_V2}mwc/blocks/${lbHeight},${range}`;
      const response = await fetch(url);
      if (!response.ok) return;

      const data = await response.json();
      setNetworkRecentBlocks(data);
    } catch (e) {
      console.log("Error in fetchNetworkRecentBlocks:", e);
    }
  }

  //
  // 4) getMinedBlocksAlgos
  //
  async function getMinedBlocksAlgos() {
    try {
      const lbHeight = latestBlock.height || 0;
      if (lbHeight === 0) return;

      const prevAlgos = { ...minedBlockAlgos };
      let previousMaxBlockHeight = lbHeight - BLOCK_RANGE;
      const combinedMax = Math.max(...prevAlgos.c31);
      if (combinedMax > previousMaxBlockHeight) {
        previousMaxBlockHeight = combinedMax;
      }
      const blockDifference = lbHeight - previousMaxBlockHeight;

      const url = `${API_URL_V2}mwc/blocks/${lbHeight},${blockDifference}/height,edge_bits`;
      const resp = await fetch(url);
      if (!resp.ok) return;

      const minedBlockAlgosData = await resp.json();
      const newBlockAlgos = { c31: [] as number[] };

      // fill newBlockAlgos from data
      minedBlockAlgosData.forEach((block: any) => {
        if (block.edge_bits === 31) {
          newBlockAlgos.c31.push(block.height);
        }
      });

      const updated = {
        c31: [...prevAlgos.c31, ...newBlockAlgos.c31],
      };
      // filter out old
      const filteredC31 = updated.c31.filter((h) => h > lbHeight - BLOCK_RANGE);

      setMinedBlockAlgos({ c31: filteredC31 });
    } catch (e) {
      console.log("Error in getMinedBlocksAlgos:", e);
    }
  }

  return {
    // states
    networkHistorical,
    blocksByHeight,
    latestBlock,
    networkRecentBlocks,
    minedBlockAlgos,

    // methods
    getLatestBlock,
    fetchNetworkData,
    fetchNetworkRecentBlocks,
    getMinedBlocksAlgos,
  };
}

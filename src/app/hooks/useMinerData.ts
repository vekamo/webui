"use client";

import { useState } from "react";
import { API_URL, API_URL_V2, BLOCK_RANGE } from "@/constants/constants";
import { basicAuth, basicAuthLegacy } from "@/utils/utils";

interface MinerBlock {
  height: number;
  [key: string]: any; // for fields like gps, shares, etc.
}

interface RigGpsData {
  c31: any[]; // adapt as needed
}

interface RigShareData {
  [blockKey: string]: any;
}

interface MinerShareData {
  [blockKey: string]: any; // e.g. { c31ValidShares: 42, ... }
}

interface MinerPaymentData {
  [key: string]: any;
}

/** If you want to store the array of latest payments, define an interface or keep it flexible. */
interface LatestMinerPaymentData {
  [key: string]: any;
}

/**
 * A hook that replicates the old Redux-based fetch logic 
 * and stores everything in local state.
 */
export function useMinerData() {
  // 1) States
  const [minerHistorical, setMinerHistorical] = useState<MinerBlock[]>([]);
  const [rigGpsData, setRigGpsData] = useState<RigGpsData>({ c31: [] });
  const [rigShareData, setRigShareData] = useState<RigShareData>({});
  const [rigWorkers, setRigWorkers] = useState<string[]>([]);
  const [minerShareData, setMinerShareData] = useState<MinerShareData>({});
  const [minerPaymentData, setMinerPaymentData] = useState<MinerPaymentData>({});
  const [totalSharesSubmitted, setTotalSharesSubmitted] = useState<number>(0);
  // NEW: store an array/object for the “latest” payments
  const [latestMinerPayments, setLatestMinerPayments] = useState<LatestMinerPaymentData>({});
  // NEW: store the immature balance
  const [immatureBalance, setImmatureBalance] = useState<number>(0);

  // ------------------------------------------------------------------
  // fetchMinerData => local "minerHistorical"
  // ------------------------------------------------------------------
  async function fetchMinerDataHook(id: string, token: string, latestBlockHeight: number) {
    try {
      if (!latestBlockHeight) return;

      let prevMaxBlockHeight = latestBlockHeight - BLOCK_RANGE;
      minerHistorical.forEach((block) => {
        if (block.height > prevMaxBlockHeight) {
          prevMaxBlockHeight = block.height;
        }
      });
      const blockDifference = latestBlockHeight - prevMaxBlockHeight;
      const url = `${API_URL_V2}worker/stats/${id}/${latestBlockHeight},${blockDifference}/gps,height,valid_shares,timestamp,invalid_shares,stale_shares,edge_bits`;
      const basicAuthString = basicAuth(token);

      const resp = await fetch(url, {
        headers: { Authorization: basicAuthString },
      });
      if (!resp.ok) return;

      const newMinerData = await resp.json();
      const merged = [...minerHistorical, ...newMinerData];
      const numberToRemove = merged.length > BLOCK_RANGE ? merged.length - BLOCK_RANGE : 0;
      const sliced = merged.slice(numberToRemove);
      setMinerHistorical(sliced);
    } catch (e) {
      console.log("fetchMinerDataHook error:", e);
    }
  }

  // ------------------------------------------------------------------
  // fetchRigData => local "rigGpsData", "rigShareData", "rigWorkers"
  // ------------------------------------------------------------------
  async function fetchRigDataHook(
    id: string,
    token: string,
    blocksByHeight: Record<string | number, any>,
    latestBlockHeight: number
  ) {
    try {
      if (!latestBlockHeight) return;

      let prevMaxBlockHeight = latestBlockHeight - BLOCK_RANGE;
      rigGpsData.c31.forEach((block: any) => {
        if (block.height > prevMaxBlockHeight) {
          prevMaxBlockHeight = block.height;
        }
      });

      const basicAuthString = basicAuth(token);
      const url = `${API_URL_V2}worker/rigs/${id}/${latestBlockHeight},${BLOCK_RANGE}`;
      const resp = await fetch(url, {
        headers: { Authorization: basicAuthString },
      });
      if (!resp.ok) return;

      const newRigData = await resp.json();

      const formattedNewRigGpsData: RigGpsData = { c31: [] };
      const updatedRigShareData = { ...rigShareData };
      const updatedRigWorkers = [...rigWorkers];

      let previousBlockData = { c31: {} };

      for (const blockHeightKey in newRigData) {
        const blockHeight = parseInt(blockHeightKey, 10);
        if (!blocksByHeight[blockHeight - 5]) continue;

        const previousPeriodTimestamp = blocksByHeight[blockHeight - 5].timestamp;
        const periodDuration = blocksByHeight[blockHeight].timestamp - previousPeriodTimestamp;

        const blockShareData: any = {
          height: blockHeight,
          Total: { c31ValidShares: 0 },
        };

        const blockTemplate = {
          height: blockHeight,
          timestamp: blocksByHeight[blockHeight].timestamp,
          difficulty: blocksByHeight[blockHeight].difficulty,
          secondary_scaling: blocksByHeight[blockHeight].secondary_scaling,
        };

        const block = { c31: { ...blockTemplate, Total: 0 } };

        // rigs
        for (const rig in newRigData[blockHeightKey]) {
          // workers
          for (const worker in newRigData[blockHeightKey][rig]) {
            const rigWorkerKey = `${rig}-${worker}`;
            blockShareData[rigWorkerKey] = { c31ValidShares: 0 };
            if (!updatedRigWorkers.includes(rigWorkerKey)) {
              updatedRigWorkers.push(rigWorkerKey);
            }

            for (const algo in newRigData[blockHeightKey][rig][worker]) {
              const numberShares = newRigData[blockHeightKey][rig][worker][algo].accepted;
              blockShareData[rigWorkerKey][`c${algo}ValidShares`] = numberShares;
              blockShareData["Total"][`c${algo}ValidShares`] += numberShares;

              const previousBlockGps = (previousBlockData as any)[`c${algo}`]?.[rigWorkerKey];
              const currentPeriodGps = (numberShares * 42) / periodDuration;

              if (!previousBlockGps) {
                block[`c${algo}`] = block[`c${algo}`] || {};
                block[`c${algo}`][rigWorkerKey] = currentPeriodGps;
                block[`c${algo}`]["Total"] =
                  (block[`c${algo}`]["Total"] || 0) + currentPeriodGps;
              } else {
                const smoothed = (currentPeriodGps + previousBlockGps) / 2;
                block[`c${algo}`] = block[`c${algo}`] || {};
                block[`c${algo}`][rigWorkerKey] = smoothed;
                block[`c${algo}`]["Total"] =
                  (block[`c${algo}`]["Total"] || 0) + smoothed;
              }
            }
          }
        }

        formattedNewRigGpsData.c31.push(block.c31);
        previousBlockData = { c31: block.c31 };
        updatedRigShareData[`block_${blockHeight}`] = blockShareData;
      }

      setRigGpsData((old) => {
        const mergedC31 = [...old.c31, ...formattedNewRigGpsData.c31];
        return { c31: mergedC31 };
      });
      setRigShareData(updatedRigShareData);
      setRigWorkers(updatedRigWorkers);
    } catch (e) {
      console.log("fetchRigDataHook error:", e);
    }
  }

  // ------------------------------------------------------------------
  // fetchMinerShareData => local "minerShareData"
  // ------------------------------------------------------------------
  async function fetchMinerShareDataHook(id: string, token: string, latestBlockHeight: number) {
    try {
      if (!latestBlockHeight) return;
      let prevMax = latestBlockHeight - BLOCK_RANGE;

      Object.keys(minerShareData).forEach((key) => {
        const blockHeight = parseInt(key.replace("block_", ""), 10);
        if (blockHeight > prevMax) {
          prevMax = blockHeight;
        }
      });

      const blockDiff = latestBlockHeight - prevMax;
      const url = `${API_URL_V2}worker/shares/${id}/${latestBlockHeight},${blockDiff}`;
      const resp = await fetch(url, {
        headers: { Authorization: basicAuth(token) },
      });
      if (!resp.ok) return;

      const data = await resp.json();
      const updated = { ...minerShareData };

      data.forEach((shareData: any) => {
        const blockKey = `block_${shareData.height}`;
        if (!updated[blockKey]) {
          updated[blockKey] = { height: shareData.height };
        }
        updated[blockKey][`c${shareData.edge_bits}ValidShares`] = shareData.valid;
      });
      setMinerShareData(updated);
    } catch (e) {
      console.log("fetchMinerShareDataHook error:", e);
    }
  }

  // ------------------------------------------------------------------
  // fetchMinerTotalValidShares => local "totalSharesSubmitted"
  // ------------------------------------------------------------------
  async function fetchMinerTotalValidSharesHook(id: string, token: string) {
    try {
      const url = `${API_URL_V2}worker/stat/${id}/total_valid_shares`;
      const resp = await fetch(url, {
        headers: { Authorization: basicAuth(token) },
      });
      if (!resp.ok) return;

      const data = await resp.json();
      setTotalSharesSubmitted(data.total_valid_shares);
    } catch (e) {
      console.log("Error in fetchMinerTotalValidSharesHook:", e);
    }
  }

  // ------------------------------------------------------------------
  // fetchMinerPaymentData => local "minerPaymentData"
  // ------------------------------------------------------------------
  async function fetchMinerPaymentDataHook(id: string, legacyToken: string) {
    try {
      const url = `${API_URL}worker/utxo/${id}`;
      console.log("url is:", url);
      const resp = await fetch(url, {
        headers: { authorization: basicAuthLegacy(legacyToken) },
      });
      if (!resp.ok) return;

      const data = await resp.json();
      if (data) {
        setMinerPaymentData(data);
      }
    } catch (e) {
      console.log("fetchMinerPaymentDataHook error:", e);
    }
  }

  // ------------------------------------------------------------------
  // NEW: fetchLatestMinerPayments => local "latestMinerPayments"
  // ------------------------------------------------------------------
  async function fetchLatestMinerPaymentsHook(id: string, token: string) {
    try {
      // For example: /worker/payments/:id/200 
      // (the '200' is how many you want to fetch)
      const url = `${API_URL_V2}worker/payments/${id}/200`;
      const resp = await fetch(url, {
        headers: { Authorization: basicAuth(token) },
      });
      if (!resp.ok) {
        return;
      }
      const data = await resp.json();
      setLatestMinerPayments(data);
    } catch (e) {
      console.log("fetchLatestMinerPaymentsHook error:", e);
    }
  }

  // ------------------------------------------------------------------
  //  NEW: fetchMinerImmatureBalance => local "immatureBalance"
  // ------------------------------------------------------------------
  async function fetchMinerImmatureBalanceHook(id: string, legacyToken: string) {
    try {
      const url = `${API_URL}worker/estimate/payment/${id}`;
      const resp = await fetch(url, {
        headers: { authorization: basicAuthLegacy(legacyToken) },
      });
      if (!resp.ok) return;

      const data = await resp.json();
      if (isNaN(data.immature)) return;
      setImmatureBalance(data.immature);
    } catch (e) {
      console.log("fetchMinerImmatureBalance error: ", e);
    }
  }

  // ------------------------------------------------------------------
  // Return states + methods
  // ------------------------------------------------------------------
  return {
    // states
    minerHistorical,
    rigGpsData,
    rigShareData,
    rigWorkers,
    minerShareData,
    minerPaymentData,
    totalSharesSubmitted,
    latestMinerPayments,
    immatureBalance, // <--- new state for immature balance

    // methods
    fetchMinerData: fetchMinerDataHook,
    fetchRigData: fetchRigDataHook,
    fetchMinerShareData: fetchMinerShareDataHook,
    fetchMinerTotalValidShares: fetchMinerTotalValidSharesHook,
    fetchMinerPaymentData: fetchMinerPaymentDataHook,
    fetchLatestMinerPayments: fetchLatestMinerPaymentsHook,
    fetchMinerImmatureBalance: fetchMinerImmatureBalanceHook, // <--- new method
  };
}

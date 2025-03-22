"use client";

import { useState } from "react";
import { API_URL, API_URL_V2, BLOCK_RANGE } from "@/constants/constants";
import { basicAuth, basicAuthLegacy } from "@/utils/utils";

interface MinerBlock {
  id: number;
  timestamp: number;
  height: number;
  valid_shares: number;
  invalid_shares: number;
  stale_shares: number;
  total_valid_shares: number;
  total_invalid_shares: number;
  total_stale_shares: number;
  dirty: number;
  user_id: number;
  gps: Array<{
    edge_bits: number;
    gps: number;
  }>;
  mwc_stats_id: number | null;
  pool_stats_id: number | null;
  worker_stats_id: number;
}

interface RigGpsData {
  c31: any[]; // adapt as needed
}

interface RigShareData {
  [blockKey: string]: any;
}

interface MinerShareData {
  [blockKey: string]: any;
}

interface MinerPaymentData {
  [key: string]: any;
}

interface LatestMinerPaymentData {
  [key: string]: any;
}

export function useMinerData() {
  // ------------------------------------------------------------------
  // 1) States
  // ------------------------------------------------------------------
  const [minerHistorical, setMinerHistorical] = useState<MinerBlock[]>([]);
  const [rigGpsData, setRigGpsData] = useState<RigGpsData>({ c31: [] });
  const [rigShareData, setRigShareData] = useState<RigShareData>({});
  const [rigWorkers, setRigWorkers] = useState<string[]>([]);
  const [minerShareData, setMinerShareData] = useState<MinerShareData>({});
  const [minerPaymentData, setMinerPaymentData] = useState<MinerPaymentData>({});
  const [totalSharesSubmitted, setTotalSharesSubmitted] = useState<number>(0);

  const [latestMinerPayments, setLatestMinerPayments] = useState<LatestMinerPaymentData>({});
  const [immatureBalance, setImmatureBalance] = useState<number>(0);

  // Additional new states for “next block reward” and “latest block reward”
  const [nextBlockReward, setNextBlockReward] = useState<number | null>(null);
  const [latestBlockReward, setLatestBlockReward] = useState<number | null>(null);

  // ------------------------------------------------------------------
  // 2) Additional local states for fetching/finalizing TX slate
  // ------------------------------------------------------------------
  const [isTxSlateLoading, setIsTxSlateLoading] = useState(false);
  const [minerPaymentTxSlate, setMinerPaymentTxSlate] = useState<string | null>(null);
  const [manualPaymentError, setManualPaymentError] = useState<any>(null);

  const [isPaymentSettingProcessing, setIsPaymentSettingProcessing] = useState(false);
  const [manualPaymentSubmission, setManualPaymentSubmission] = useState<any>(null);

  // ------------------------------------------------------------------
  // 3) Methods
  // ------------------------------------------------------------------

  // --------------- fetchMinerData ---------------
  async function fetchMinerDataHook(
    id: string,
    token: string,
    latestBlockHeight: number
  ) {
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

  // --------------- fetchRigData ---------------
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
        // We assume we skip if the block is not in `blocksByHeight` or too early
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

              const blockTyped = block as Record<string, any>;

              if (!previousBlockGps) {
                blockTyped[`c${algo}`] = blockTyped[`c${algo}`] || {};
                blockTyped[`c${algo}`][rigWorkerKey] = currentPeriodGps;
                blockTyped[`c${algo}`]["Total"] =
                  (blockTyped[`c${algo}`]["Total"] || 0) + currentPeriodGps;
              } else {
                const smoothed = (currentPeriodGps + previousBlockGps) / 2;
                blockTyped[`c${algo}`] = blockTyped[`c${algo}`] || {};
                blockTyped[`c${algo}`][rigWorkerKey] = smoothed;
                blockTyped[`c${algo}`]["Total"] =
                  (blockTyped[`c${algo}`]["Total"] || 0) + smoothed;
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

  // --------------- fetchMinerShareData ---------------
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

  // --------------- fetchMinerTotalValidShares ---------------
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

  // --------------- fetchMinerPaymentData ---------------
  async function fetchMinerPaymentDataHook(id: string, legacyToken: string) {
    try {
      const url = `${API_URL}worker/utxo/${id}`;
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

  // --------------- fetchLatestMinerPayments ---------------
  async function fetchLatestMinerPaymentsHook(id: string, token: string) {
    try {
      const url = `${API_URL_V2}worker/payments/${id}/200`;
      const resp = await fetch(url, {
        headers: { Authorization: basicAuth(token) },
      });
      if (!resp.ok) return;

      const data = await resp.json();
      setLatestMinerPayments(data);
    } catch (e) {
      console.log("fetchLatestMinerPaymentsHook error:", e);
    }
  }

  // --------------- fetchMinerImmatureBalance ---------------
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

  // --------------- fetchMinerNextBlockReward ---------------
  async function fetchMinerNextBlockRewardHook(id: string, legacyToken: string) {
    try {
      const url = `${API_URL}worker/estimate/payment/${id}/next`;
      const resp = await fetch(url, {
        headers: {
          authorization: basicAuthLegacy(legacyToken),
        },
      });
      if (!resp.ok) return;

      const data = await resp.json();
      if (isNaN(data.next)) return;
      setNextBlockReward(data.next);
    } catch (e) {
      console.log("fetchMinerNextBlockRewardHook error: ", e);
    }
  }

  // --------------- fetchMinerLatestBlockReward ---------------
  async function fetchMinerLatestBlockRewardHook(
    id: string,
    legacyToken: string,
    latestPoolBlock: number
  ) {
    try {
      if (!Number.isFinite(latestPoolBlock)) return;

      const url = `${API_URL}worker/estimate/payment/${id}/${latestPoolBlock}`;
      const resp = await fetch(url, {
        headers: {
          authorization: basicAuthLegacy(legacyToken),
        },
      });
      if (!resp.ok) return;

      const data = await resp.json();
      const reward = data[latestPoolBlock];
      if (isNaN(reward)) return;

      setLatestBlockReward(reward);
    } catch (e) {
      console.log("fetchMinerLatestBlockReward error: ", e);
    }
  }

  function stripWrappingQuotes(str: string) {
    if (str.startsWith('"') && str.endsWith('"')) {
      return str.slice(1, -1);
    }
    return str;
  }

  // --------------- fetchMinerPaymentTxSlate ---------------
  async function fetchMinerPaymentTxSlateHook(id: string, legacyToken: string, address: string) {
    setIsTxSlateLoading(true);
    setManualPaymentError(null);

    try {
      const url = `${API_URL}pool/payment/get_tx_slate/${id}/${address}`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          authorization: basicAuthLegacy(legacyToken),
        },
      });
      if (!resp.ok) {
        const errorMessageObject = await resp.json();
        setManualPaymentError(errorMessageObject);
      } else {
        const data = await resp.json();
        const cleanedSlatepack = stripWrappingQuotes(data);
        setMinerPaymentTxSlate(cleanedSlatepack);
      }
    } catch (e) {
      console.log("fetchMinerPaymentTxSlateHook Error:", e);
      setManualPaymentError(e);
    } finally {
      setIsTxSlateLoading(false);
    }
  }

  // --------------- finalizeTxSlate ---------------
  async function finalizeTxSlateHook(id: string, legacyToken: string, slate: any) {
    setIsPaymentSettingProcessing(true);
    setManualPaymentError(null);

    try {
      const url = `${API_URL}pool/payment/submit_tx_slate/${id}`;
      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: basicAuthLegacy(legacyToken),
        },
        body: JSON.stringify({ slate }),
      };

      const resp = await fetch(url, options);
      if (!resp.ok) {
        const errorMessageObject = await resp.json();
        setManualPaymentError(errorMessageObject);
      } else {
        setManualPaymentSubmission(await resp.json());
      }
    } catch (error) {
      console.error("finalizeTxSlateHook Error:", error);
      setManualPaymentError(error);
    } finally {
      setIsPaymentSettingProcessing(false);
    }
  }

  // ------------------------------------------------------------------
  // 4) Reset method for clearing all the above states (useful on logout)
  // ------------------------------------------------------------------
  function resetMinerData() {
    setMinerHistorical([]);
    setRigGpsData({ c31: [] });
    setRigShareData({});
    setRigWorkers([]);
    setMinerShareData({});
    setMinerPaymentData({});
    setTotalSharesSubmitted(0);
    setLatestMinerPayments({});
    setImmatureBalance(0);
    setNextBlockReward(null);
    setLatestBlockReward(null);

    // TX slate states
    setIsTxSlateLoading(false);
    setMinerPaymentTxSlate(null);
    setManualPaymentError(null);
    setIsPaymentSettingProcessing(false);
    setManualPaymentSubmission(null);
  }

  // ------------------------------------------------------------------
  // 5) Return all states + methods (including resetMinerData)
  // ------------------------------------------------------------------
  return {
    // States
    minerHistorical,
    rigGpsData,
    rigShareData,
    rigWorkers,
    minerShareData,
    minerPaymentData,
    totalSharesSubmitted,
    latestMinerPayments,
    immatureBalance,
    nextBlockReward,
    latestBlockReward,

    isTxSlateLoading,
    minerPaymentTxSlate,
    manualPaymentError,
    isPaymentSettingProcessing,
    manualPaymentSubmission,

    // Fetch methods
    fetchMinerData: fetchMinerDataHook,
    fetchRigData: fetchRigDataHook,
    fetchMinerShareData: fetchMinerShareDataHook,
    fetchMinerTotalValidShares: fetchMinerTotalValidSharesHook,
    fetchMinerPaymentData: fetchMinerPaymentDataHook,
    fetchLatestMinerPayments: fetchLatestMinerPaymentsHook,
    fetchMinerImmatureBalance: fetchMinerImmatureBalanceHook,
    fetchMinerNextBlockReward: fetchMinerNextBlockRewardHook,
    fetchMinerLatestBlockReward: fetchMinerLatestBlockRewardHook,

    fetchMinerPaymentTxSlate: fetchMinerPaymentTxSlateHook,
    finalizeTxSlate: finalizeTxSlateHook,

    // Reset method
    resetMinerData,
  };
}

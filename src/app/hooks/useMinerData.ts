"use client";

import { useState } from "react";
import { API_URL, API_URL_V2, BLOCK_RANGE } from "@/constants/constants";
import { basicAuth, basicAuthLegacy } from "@/utils/utils";
import { LatestMinerPaymentData, MinerBlock, MinerPaymentData, MinerShareData, RigDataMiner } from "@/types/types";



export function useMinerData() {
  // ------------------------------------------------------------------
  // 1) States
  // ------------------------------------------------------------------
  const [minerHistorical, setMinerHistorical] = useState<MinerBlock[]>([]);
  const [rigHistorical, setRigHistorical] = useState<RigDataMiner>({});
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
  
  async function fetchRigDataHook(
    minerId: string,
    token: string,
    blockRange: number,
    latestBlockHeight: number
  ) {
    try {
      if (!latestBlockHeight) return;
  
      // 1) Build request URL
      const authHeader = basicAuth(token);
      const url = `${API_URL_V2}worker/rigs/${minerId}/${latestBlockHeight},${blockRange}`;
      const resp = await fetch(url, { headers: { Authorization: authHeader } });
      if (!resp.ok) return;
  
      // 2) Parse JSON into RigDataMiner
      const newRigData = (await resp.json()) as RigDataMiner;
  
      // 3) Convert existing state (rigHistorical) to an array of { height, data }
      //    so we can merge and deduplicate easily.
      const oldEntries = Object.entries(rigHistorical).map(([heightStr, data]) => ({
        height: parseInt(heightStr, 10),
        data,
      }));
  
      // Convert newRigData into the same array form
      const newEntries = Object.entries(newRigData).map(([heightStr, data]) => ({
        height: parseInt(heightStr, 10),
        data,
      }));
  
      // 4) Merge into a single array
      const merged = [...oldEntries, ...newEntries];
  
      // 5) Use a Map keyed by `height` to remove any duplicates
      const blockMap = new Map<number, typeof merged[0]>();
      for (const entry of merged) {
        blockMap.set(entry.height, entry);
      }
  
      // 6) Convert the Map back to an array and sort by height (ascending)
      let unique = Array.from(blockMap.values());
      unique.sort((a, b) => a.height - b.height);
  
      // 7) Keep only the last `blockRange` entries
      const numToRemove = unique.length - blockRange;
      if (numToRemove > 0) {
        unique = unique.slice(numToRemove);
      }
  
      // 8) Convert back to an object keyed by height
      const finalObj: RigDataMiner = {};
      for (const item of unique) {
        finalObj[item.height] = item.data;
      }
      // 9) Update state
      setRigHistorical(finalObj);
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
  async function fetchMinerPaymentTxSlateHook(id: string, legacyToken: string, token:string, address: string) {
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
      refreshPayout(id, legacyToken, token)
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

  // --------------- refreshPayout ---------------
  async function refreshPayout(minerId: string, legacyToken: string, token: string) {
    try {
      await Promise.all([
        fetchMinerPaymentDataHook(minerId, legacyToken),
        fetchLatestMinerPaymentsHook(minerId, token),
        fetchMinerImmatureBalanceHook(minerId, legacyToken),
      ]);
      console.log("Payout data successfully refreshed.");
    } catch (error) {
      console.error("Error refreshing payout:", error);
    }
  }


  // ------------------------------------------------------------------
  // 4) Reset method for clearing all the above states (useful on logout)
  // ------------------------------------------------------------------
  function resetMinerData() {
    setMinerHistorical([]);
    setMinerShareData({});
    setMinerPaymentData({});
    setTotalSharesSubmitted(0);
    setLatestMinerPayments({});
    setImmatureBalance(0);
    setNextBlockReward(null);
    setLatestBlockReward(null);
    setRigHistorical({})
    

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
    rigHistorical,

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

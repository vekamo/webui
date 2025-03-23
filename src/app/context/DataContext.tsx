"use client"; // Because we use React hooks in a Next.js 13 App Router

import React, { createContext, useContext, useState, useEffect } from "react";
import Cookies from "js-cookie";
import { useAuthContext } from "./AuthContext";

// Public data hooks
import { useNetworkData } from "@/app/hooks/useNetworkData";
import { useMWCPool } from "@/app/hooks/useMWCPool";

// Private data hook
import { useMinerData } from "@/app/hooks/useMinerData";
import { BLOCK_RANGE } from "@/constants/constants";

interface DataContextType {
  isLoading: boolean;
  error: string;
  isLoggedIn: boolean;

  // Public data
  networkHistorical: any[];
  latestBlock: any;
  poolHistorical: any[];
  recentPoolBlocks: any[];
  lastBlockMined: any;

  // Private data
  minerHistorical: any[];
  nextBlockReward: any;
  latestBlockReward: any;
  minerPaymentData: any;
  latestMinerPayments: any;
  immatureBalance: number;
  rigHistorical: any;

  // Manual refresh
  refetchAllData: () => void;
}


// Create React Context
const DataContext = createContext<DataContextType>({} as DataContextType);

export function DataProvider({ children }: { children: React.ReactNode }) {
  // Pull in isLoggedIn + handleLogout from AuthContext
  const { isLoggedIn, handleLogout } = useAuthContext();

  // Only true on the first load => shows spinner
  const [isLoading, setIsLoading] = useState(true);
  const [didInitialLoad, setDidInitialLoad] = useState(false);

  // Error state
  const [error, setError] = useState("");

  // ----- Public data hooks -----
  const {
    networkHistorical,
    latestBlock,
    fetchNetworkData,
    getLatestBlock,
    fetchNetworkRecentBlocks,
  } = useNetworkData();

  const {
    poolHistorical,
    recentPoolBlocks,
    lastBlockMined,
    fetchMWCPoolData,
    fetchMWCPoolLastBlock,
    fetchMWCPoolRecentBlocks,
  } = useMWCPool();

  // ----- Private data hook -----
  const {
    minerHistorical,
    nextBlockReward,
    latestBlockReward,
    minerPaymentData,
    latestMinerPayments,
    immatureBalance,
    rigHistorical,
    fetchMinerData,
    fetchMinerShareData,
    fetchMinerTotalValidShares,
    fetchRigData,
    fetchMinerNextBlockReward,
    fetchMinerLatestBlockReward,
    fetchMinerPaymentData,
    fetchLatestMinerPayments,
    fetchMinerImmatureBalance,
    resetMinerData,
  } = useMinerData();

  /**
   * 1) A stable, top-level function to fetch data:
   *    - Always fetch public data
   *    - If isLoggedIn => fetch private data
   */
  async function fetchAllData(showSpinner: boolean) {
    try {
      if (showSpinner) {
        setIsLoading(true);
        setError("");
      }

      // 1) Always fetch public data
      const blockData = await getLatestBlock();
      const height = blockData?.height ?? 0;

      await fetchNetworkData(height);
      await fetchNetworkRecentBlocks(height, 20);
      await fetchMWCPoolLastBlock();
      await fetchMWCPoolData(height);
      await fetchMWCPoolRecentBlocks(height, { c31: [0, height] });

      // 2) Private data if logged in
      if (isLoggedIn) {
        const minerId = Cookies.get("id");
        const token = Cookies.get("token");
        const legacyToken = Cookies.get("legacyToken");

        if (!minerId || !token || !legacyToken) {
          console.warn("[DataProvider] Missing cookies => skip private fetch.");
        } else {
          await fetchMinerData(minerId, token, height);
          await fetchMinerShareData(minerId, token, height);

          await fetchMinerNextBlockReward(minerId, legacyToken);
          await fetchMinerLatestBlockReward(minerId, legacyToken, height);
          await fetchMinerPaymentData(minerId, legacyToken);
          await fetchLatestMinerPayments(minerId, token);
          await fetchMinerImmatureBalance(minerId, legacyToken);
          await fetchRigData(minerId, token, BLOCK_RANGE, height);
          //await fetchMinerTotalValidShares(minerId, token);
        }
      } else {
        // If we’re not logged in, optionally reset the data here
        // resetMinerData();
      }
    } catch (err: any) {
      console.error("[DataProvider] fetchAllData error =>", err);
      setError(err.message || "Failed to fetch data.");
    } finally {
      if (showSpinner) {
        setIsLoading(false);
        setDidInitialLoad(true);
      }
    }
  }

  /**
   * 2) On mount => fetch once with spinner
   */
  useEffect(() => {
    console.log("[DataProvider] MOUNT => fetchAllData(true)");
    fetchAllData(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * 3) Poll every 25 seconds => silent refresh
   *    => But first check if 'expiration' cookie is expired
   */
  useEffect(() => {
    console.log("[DataProvider] Setting up 25s poll");
    const intervalId = setInterval(() => {
      const expiration = Cookies.get("expiration");
      if (expiration) {
        // Convert "expiration" to a number (UNIX timestamp in seconds)
        const expirationTS = parseInt(expiration, 10);
        const now = Math.floor(Date.now() / 1000);

        // If current time > expiration => auto logout
        if (now > expirationTS) {
          console.warn("[DataProvider] Expiration cookie is expired => auto logout");
          handleLogout();
          return; // Don't fetch data if we just logged out
        }
      }

      // Otherwise, do the normal data fetch
      console.log("[DataProvider] poll => fetchAllData(false)");
      fetchAllData(false);
    }, 25000);

    return () => {
      console.log("[DataProvider] Clearing 25s poll");
      clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * 4) If isLoggedIn changes AFTER the initial load => re-fetch once
   *    This covers both logging in and logging out
   */
  useEffect(() => {
    if (didInitialLoad) {
      console.log("[DataProvider] isLoggedIn changed => fetchAllData(false)");
      fetchAllData(false);

      // If user just logged out => reset private data
      if (!isLoggedIn) {
        console.log("[DataProvider] Resetting private data on logout");
        resetMinerData();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, didInitialLoad]);

  /**
   * Manual refresh function (e.g. a button "Refresh")
   */
  function refetchAllData() {
    fetchAllData(false);
  }

  // Provide data to consumers
  const contextValue: DataContextType = {
    isLoading,
    error,
    isLoggedIn,

    // Public data
    networkHistorical,
    latestBlock,
    poolHistorical,
    recentPoolBlocks,
    lastBlockMined,

    // Private data
    minerHistorical,
    nextBlockReward,
    latestBlockReward,
    minerPaymentData,
    latestMinerPayments,
    immatureBalance,
    rigHistorical,

    // Manual refresh
    refetchAllData,
  };

  console.log("[DataProvider] Rendered => isLoggedIn:", isLoggedIn);

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
}

// A hook for consuming our data context
export function useDataContext() {
  return useContext(DataContext);
}

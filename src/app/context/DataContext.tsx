"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import Cookies from "js-cookie";
import { useAuthContext } from "./AuthContext";
import { useNetworkData } from "@/app/hooks/useNetworkData";
import { useMWCPool } from "@/app/hooks/useMWCPool";
import { useMinerData } from "@/app/hooks/useMinerData";
import { BLOCK_RANGE } from "@/constants/constants";

// ---------------------------
// Interface
// ---------------------------
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
  blocksMined: any;

  // Private data
  minerHistorical: any[];
  nextBlockReward: any;
  latestBlockReward: any;
  minerPaymentData: any;
  latestMinerPayments: any;
  immatureBalance: number;
  rigHistorical: any;

  // Ephemeral data
  ephemeralMap: Record<string, any>;
  setEphemeralMap: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  selectedRig: string;
  setSelectedRig: React.Dispatch<React.SetStateAction<string>>;
  rigNames: string[];
  setRigNames: React.Dispatch<React.SetStateAction<string[]>>;
  rigGpsMap: Record<string, number>;
  setRigGpsMap: React.Dispatch<React.SetStateAction<Record<string, number>>>;

  // Manual refresh
  refetchAllData: () => void;
  refreshPayout: () => void;
}

const DataContext = createContext<DataContextType>({} as DataContextType);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, handleLogout } = useAuthContext();
  // Basic loading / error states
  const [isLoading, setIsLoading] = useState(true);
  const [didInitialLoad, setDidInitialLoad] = useState(false);
  const [error, setError] = useState("");

  // Keep track of the previous login state
  const [prevIsLoggedIn, setPrevIsLoggedIn] = useState(isLoggedIn);

  // Local ephemeral data
  const [ephemeralMap, setEphemeralMap] = useState<Record<string, any>>({});
  const [selectedRig, setSelectedRig] = useState<string>("default");
  const [rigNames, setRigNames] = useState<string[]>([]);
  const [rigGpsMap, setRigGpsMap] = useState<Record<string, number>>({});

  // Hooks for public data
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
    blocksMined,
    fetchMWCPoolData,
    fetchMWCPoolLastBlock,
    fetchMWCPoolRecentBlocks,
    fetchMWCPoolBlocksMined,
  } = useMWCPool();

  // Hooks for private data
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
    fetchRigData,
    fetchMinerNextBlockReward,
    fetchMinerLatestBlockReward,
    fetchMinerPaymentData,
    fetchLatestMinerPayments,
    fetchMinerImmatureBalance,
    resetMinerData,
  } = useMinerData();

  // OPTIONAL: track if a fetch is in progress (to avoid concurrency)
  const fetchInProgressRef = useRef(false);
  const isLoggedInRef = useRef(isLoggedIn);

  /**
   * Our main fetch function. We now accept `currentIsLoggedIn` as a parameter
   * so this function won't rely on possibly stale closures.
   */
  async function fetchAllData(showSpinner: boolean) {
    // If you want to avoid concurrency, you can do:
    if (fetchInProgressRef.current) {
      console.log("[DataProvider] fetchAllData => Already fetching; skip.");
      return;
    }
    fetchInProgressRef.current = true;

    try {
      if (showSpinner) {
        setIsLoading(true);
        setError("");
      }

      // Always fetch public data
      const blockData = await getLatestBlock();
      const height = blockData?.height ?? 0;

      await fetchNetworkData(height);
      await fetchNetworkRecentBlocks(height, 20);

      await fetchMWCPoolLastBlock();
      await fetchMWCPoolData(height);
      await fetchMWCPoolRecentBlocks(height, { c31: [0, height] });
      await fetchMWCPoolBlocksMined(height, { c31: [0, height] });

      // If logged in (based on the param, NOT the closure)
      if (isLoggedInRef) {
        const minerId = Cookies.get("id");
        const token = Cookies.get("token");
        const legacyToken = Cookies.get("legacyToken");
        if (minerId && token && legacyToken) {
          await fetchMinerData(minerId, token, height);
          await fetchMinerShareData(minerId, token, height);
          await fetchMinerNextBlockReward(minerId, legacyToken);
          await fetchMinerLatestBlockReward(minerId, legacyToken, height);
          await fetchMinerPaymentData(minerId, legacyToken);
          await fetchLatestMinerPayments(minerId, token);
          await fetchMinerImmatureBalance(minerId, legacyToken);
          await fetchRigData(minerId, token, BLOCK_RANGE, height);
        } else {
          console.warn("[DataProvider] Missing cookies => skip private fetch.");
        }
      }
    } catch (err: any) {
      console.error("[DataProvider] fetchAllData error =>", err);
      setError(err.message || "Failed to fetch data.");
    } finally {
      fetchInProgressRef.current = false;
      if (showSpinner) {
        setIsLoading(false);
        setDidInitialLoad(true);
      }
    }
  }

  /**
   * On mount, do an immediate fetch with spinner, then poll every 25s without spinner
   */
  useEffect(() => {
    fetchAllData(true);
    
    const pollInterval = setInterval(() => {
      const expiration = Cookies.get("expiration");
      if (expiration) {
        const expirationTS = parseInt(expiration, 10);
        const now = Math.floor(Date.now() / 1000);
        if (now > expirationTS) {
          console.warn("[DataProvider] Expiration cookie is expired => auto logout");
          handleLogout();
          return;
        }
      }
      fetchAllData(false);
    }, 25000);

    return () => clearInterval(pollInterval);
  }, [handleLogout]);

  useEffect(() => {
    if (didInitialLoad) {
      // Logged *in* -> *out*
      if (!isLoggedIn && prevIsLoggedIn) {
        console.log("[DataProvider] user just logged out => reset data");
        resetMinerData();
        setEphemeralMap({});
        setSelectedRig("default");
        setRigNames([]);
        setRigGpsMap({});
        // If you want to fetch just the public data again:
        fetchAllData(true);
      }
      // Logged *out* -> *in*
      else if (isLoggedIn && !prevIsLoggedIn) {
        console.log("[DataProvider] user just logged in => fetchAllData(true)");
        fetchAllData(true);
      }
    }
    setPrevIsLoggedIn(isLoggedIn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, didInitialLoad]);

  function refetchAllData() {
    // If you want a spinner on manual refresh, pass true
    fetchAllData(false);
  }

  async function refreshPayout() {
    try {
      if (isLoggedIn) {
        const minerId = Cookies.get("id");
        const token = Cookies.get("token");
        const legacyToken = Cookies.get("legacyToken");
        if (!minerId || !token || !legacyToken) {
          console.warn("[DataProvider] Missing cookies => cannot refresh payout.");
          return;
        }
        await fetchMinerPaymentData(minerId, legacyToken);
        await fetchLatestMinerPayments(minerId, token);
        await fetchMinerImmatureBalance(minerId, legacyToken);
      } else {
        console.warn("[DataProvider] Not logged in => cannot refresh payout.");
      }
    } catch (err: any) {
      console.error("[DataProvider] refreshPayout error =>", err);
      setError(err.message || "Failed to refresh payout data.");
    }
  }

  // Build the context value
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
    blocksMined,

    // Private data
    minerHistorical,
    nextBlockReward,
    latestBlockReward,
    minerPaymentData,
    latestMinerPayments,
    immatureBalance,
    rigHistorical,

    // Ephemeral data
    ephemeralMap,
    setEphemeralMap,
    selectedRig,
    setSelectedRig,
    rigNames,
    setRigNames,
    rigGpsMap,
    setRigGpsMap,

    // Manual refresh
    refetchAllData,
    refreshPayout,
  };

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
}

// A hook to consume our data context
export function useDataContext() {
  return useContext(DataContext);
}

"use client"; // Next.js App Router with React hooks

import React, { createContext, useContext, useState, useEffect } from "react";
import Cookies from "js-cookie";
import { useAuthContext } from "./AuthContext";

// Public data hooks
import { useNetworkData } from "@/app/hooks/useNetworkData";
import { useMWCPool } from "@/app/hooks/useMWCPool";

// Private data hook
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

  

  // Whether to show a global spinner
  //showSpinner: boolean;

  // Manual refresh
  refetchAllData: () => void;
  refreshPayout: () => void;
}

// ---------------------------
// Context creation
// ---------------------------
const DataContext = createContext<DataContextType>({} as DataContextType);

export function DataProvider({ children }: { children: React.ReactNode }) {
  // Pull in isLoggedIn + handleLogout from AuthContext
  const { isLoggedIn, handleLogout } = useAuthContext();

  // This controls a global spinner
  //const [showSpinner, setShowSpinner] = useState(true);

  // This can also be used to show/hide other loading states
  const [isLoading, setIsLoading] = useState(true);
  const [didInitialLoad, setDidInitialLoad] = useState(false);

  // Track previous login state so we know if user has just logged in
  const [prevIsLoggedIn, setPrevIsLoggedIn] = useState(isLoggedIn);

  // Ephemeral / local state
  const [ephemeralMap, setEphemeralMap] = useState<Record<string, any>>({});
  const [selectedRig, setSelectedRig] = useState<string>("default");
  const [rigNames, setRigNames] = useState<string[]>([]);
  const [rigGpsMap, setRigGpsMap] = useState<Record<string, number>>({});

  // Error state
  const [error, setError] = useState("");

  // Public data hooks
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

  // Private data hook
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
    // fetchMinerTotalValidShares,
    fetchRigData,
    fetchMinerNextBlockReward,
    fetchMinerLatestBlockReward,
    fetchMinerPaymentData,
    fetchLatestMinerPayments,
    fetchMinerImmatureBalance,
    resetMinerData,
  } = useMinerData();

  // ---------------------------
  // 1) Core fetch function
  // ---------------------------
  async function fetchAllData(showSpinner: boolean) {
    try {
      // If this fetch should show the spinner, turn it on
      if (showSpinner) {
        //setShowSpinner(true);
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

      // Private data if logged in
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
        }
      } else {
        // If we’re not logged in, optionally reset data
        // resetMinerData();
      }
    } catch (err: any) {
      console.error("[DataProvider] fetchAllData error =>", err);
      setError(err.message || "Failed to fetch data.");
    } finally {
      // If we turned the spinner on at the start, turn it off now
      if (showSpinner) {
        console.log('yolo')
        //setShowSpinner(false);
        setIsLoading(false);
        setDidInitialLoad(true);
      }
    }
  }

  // ---------------------------
  // 2) On mount, do an immediate fetch with a spinner, then poll
  // ---------------------------
  useEffect(() => {
    fetchAllData(true);
    console.log("[DataProvider] MOUNT => fetchAllData(true)");

    // (B) Then set up the poll interval for every 25s (no spinner)
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
      console.log("[DataProvider] poll => fetchAllData(false)");
      fetchAllData(false);
    }, 25000);

    // Cleanup
    return () => {
      console.log("[DataProvider] Clearing poll interval");
      clearInterval(pollInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleLogout]);

  // ---------------------------
  // 3) Watch for isLoggedIn changes AFTER the initial load
  // ---------------------------
  useEffect(() => {
    if (didInitialLoad) {
      // not logged in -> logged in => show spinner + fetch
      if (isLoggedIn && !prevIsLoggedIn) {
        console.log("[DataProvider] user just logged in => fetchAllData(true)");
        fetchAllData(true);
      }
      // logged in -> logged out => reset data
      else if (!isLoggedIn && prevIsLoggedIn) {
        console.log("[DataProvider] user just logged out => reset data");
        // optional: show spinner here or skip
        fetchAllData(true);
        resetMinerData();
        setEphemeralMap({});
        setSelectedRig("default");
        setRigNames([]);
        setRigGpsMap({});
      }
    }
    setPrevIsLoggedIn(isLoggedIn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, didInitialLoad]);

  // ---------------------------
  // 4) Manual refresh function
  // ---------------------------
  function refetchAllData() {
    // if you want a spinner on manual refresh, pass true
    fetchAllData(false);
  }


  async function refreshPayout() {
    try {
      if (isLoggedIn) {
        const minerId = Cookies.get("id");
        const token = Cookies.get("token");
        const legacyToken = Cookies.get("legacyToken");
  
        // Safety checks
        if (!minerId || !token || !legacyToken) {
          console.warn("[DataProvider] Missing cookies => cannot refresh payout.");
          return;
        }
  
        // Call the payout-related fetches
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
  

  // ---------------------------
  // 5) Build the context value
  // ---------------------------
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

    // Spinner
    //showSpinner,

    // Manual refresh
    refetchAllData,
    refreshPayout,
  };

  // Optional: log each render
  const currentTime = new Date().toLocaleString();
  console.log(`[DataProvider] ${currentTime} Rendered => isLoggedIn:`, isLoggedIn);
  console.log(`[DataProvider] ${currentTime} Rendered => isLoading:`, isLoading);

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

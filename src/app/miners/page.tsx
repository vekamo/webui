"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

import { useAuthContext } from "@/app/context/AuthContext";
import { useMinerData } from "@/app/hooks/useMinerData";
import { useNetworkData } from "@/app/hooks/useNetworkData";

// If you have a chart or other components, you can import them, e.g.:
// import MinerHashRateChart from "@/components/miner/MinerHashRateChart";

export default function MinersPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuthContext();

  // States for loading/error
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Hooks: your custom miner data
  const {
    minerHistorical,
    minerShareData,
    totalSharesSubmitted,
    rigGpsData,
    fetchMinerData,
    fetchMinerShareData,
    fetchMinerTotalValidShares,
  } = useMinerData();

  // e.g. if you have a getLatestBlock method
  const { getLatestBlock } = useNetworkData();

  useEffect(() => {
    // 1) If user not logged in => push /login
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    // 2) Gather needed cookies
    const minerId = Cookies.get("id");
    const legacyToken = Cookies.get("legacyToken");
    const token = Cookies.get("token");

    if (!minerId || !legacyToken || !token) {
      setError("Missing auth data in cookies.");
      return;
    }

    let intervalId: NodeJS.Timeout | null = null;

    /**
     * loadMinerData
     *  - silent = false => show spinner
     *  - silent = true  => skip spinner (background polling)
     */
    async function loadMinerData(silent = false) {
      try {
        if (!silent) setIsLoading(true);
        setError("");

        // For example, you might want the latest block
        const latestBlock = await getLatestBlock();
        const height = latestBlock?.height ?? 0;
        if (height <= 0) {
          throw new Error("Could not fetch latest block height");
        }

        // Then fetch your miner data
        await fetchMinerData(minerId, token, height);
        await fetchMinerShareData(minerId, token, height);
        await fetchMinerTotalValidShares(minerId, token);
      } catch (err: any) {
        console.error("[loadMinerData error]", err);
        setError(err.message || "Failed to fetch miner data");
      } finally {
        if (!silent) setIsLoading(false);
      }
    }

    // 3) Initial load (non-silent => spinner)
    loadMinerData(false);

    // 4) Continuous poll every 5 seconds
    intervalId = setInterval(() => {
      loadMinerData(true); // silent => no spinner
    }, 5000);

    // 5) Cleanup
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [
    isLoggedIn,
    router,
    getLatestBlock,
    fetchMinerData,
    fetchMinerShareData,
    fetchMinerTotalValidShares,
  ]);

  // Classes for centering if loading
  const mainClasses = isLoading ? "flex flex-col items-center justify-center" : "";

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="w-full px-6 py-6 bg-black border-b border-white/[.1]">
        <h1 className="text-5xl font-extrabold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent tracking-tight">
          Miner
        </h1>
        <p className="text-gray-400 text-md mt-1">
          View your real-time mining data, performance stats, and rewards.
        </p>
      </header>

      <main className={`min-h-[calc(100vh-5rem)] px-8 sm:px-16 pb-16 ${mainClasses}`}>
        {error ? (
          <div className="text-red-500 mt-10">{error}</div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center">
            <div className="text-white animate-spin rounded-full h-12 w-12 border-b-4 border-white mb-6" />
            <p className="text-gray-400">Loading miner data...</p>
          </div>
        ) : (
          <div className="mt-10">
            {/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                e.g. If you wanted to insert a chart here:
                <MinerHashRateChart minerData={minerHistorical} />
               ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */}

            {/* Historical Table */}
            <div className="overflow-x-auto">
              <h2 className="text-xl font-bold mb-2 text-gray-200">
                Miner Historical (Blocks)
              </h2>
              <table className="min-w-full text-left text-sm text-gray-300 border border-white/[.1] rounded-lg">
                <thead>
                  <tr className="bg-black/[.15] text-gray-500 uppercase tracking-wide">
                    <th className="py-2 px-4 border border-white/[.1]">Height</th>
                    <th className="py-2 px-4 border border-white/[.1]">
                      Timestamp
                    </th>
                    <th className="py-2 px-4 border border-white/[.1]">Valid</th>
                    <th className="py-2 px-4 border border-white/[.1]">
                      Invalid
                    </th>
                    <th className="py-2 px-4 border border-white/[.1]">Stale</th>
                  </tr>
                </thead>
                <tbody>
                  {minerHistorical.map((block, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-white/[.05] transition-colors"
                    >
                      <td className="py-2 px-4 border border-white/[.1]">
                        {block.height}
                      </td>
                      <td className="py-2 px-4 border border-white/[.1]">
                        {block.timestamp}
                      </td>
                      <td className="py-2 px-4 border border-white/[.1]">
                        {block.valid_shares}
                      </td>
                      <td className="py-2 px-4 border border-white/[.1]">
                        {block.invalid_shares}
                      </td>
                      <td className="py-2 px-4 border border-white/[.1]">
                        {block.stale_shares}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Share Data */}
            <div className="mt-8">
              <h2 className="text-xl font-bold text-gray-200">
                Miner Share Data
              </h2>
              <pre className="bg-white/5 text-gray-300 p-3 rounded mt-2 text-sm">
                {JSON.stringify(minerShareData, null, 2)}
              </pre>
            </div>

            {/* Total Shares */}
            <div className="mt-8">
              <h2 className="text-xl font-bold text-gray-200">
                Total Shares Submitted
              </h2>
              <p className="text-gray-300 mt-1">
                {totalSharesSubmitted.toLocaleString()}
              </p>
            </div>

            {/* Rig GPS */}
            <div className="mt-8">
              <h2 className="text-xl font-bold text-gray-200">Rig GPS Data</h2>
              <pre className="bg-white/5 text-gray-300 p-3 rounded mt-2 text-sm">
                {JSON.stringify(rigGpsData, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

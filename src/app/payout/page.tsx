"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

import { useAuthContext } from "@/app/context/AuthContext";
import { useMinerData } from "@/app/hooks/useMinerData";
import BalanceInfo, { BalanceDetails } from "@/components/payout/balanceUsers";
import PayoutSetupCard from "@/components/payout/payoutCard";
import LatestPaymentsTable, { LatestPaymentItem } from "@/components/payout/latestPaymentCard";

export default function PayoutPage() {
  const {
    minerPaymentData,
    fetchMinerPaymentData,
    latestMinerPayments,
    fetchLatestMinerPayments,
  } = useMinerData();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const { isLoggedIn } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    const minerId = Cookies.get("id");
    const legacyToken = Cookies.get("legacyToken");
    const token = Cookies.get("token");

    if (!minerId || !legacyToken || !token) {
      setError("Missing auth data in cookies.");
      return;
    }

    let intervalId: NodeJS.Timeout | null = null;

    async function loadPayoutData(silent = false) {
      try {
        if (!silent) setIsLoading(true);
        setError("");

        await fetchMinerPaymentData(minerId, legacyToken);
        await fetchLatestMinerPayments(minerId, token);
      } catch (err: any) {
        console.error("loadPayoutData error:", err);
        setError(err.message || "Failed to fetch payout data.");
      } finally {
        if (!silent) setIsLoading(false);
      }
    }

    loadPayoutData(false);

    intervalId = setInterval(() => {
      loadPayoutData(true);
    }, 5000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isLoggedIn, router]);

  const mainClasses = isLoading ? "flex flex-col items-center justify-center" : "";

  // Convert minerPaymentData to array
  let payoutArray: BalanceDetails[] = [];
  if (Array.isArray(minerPaymentData)) {
    payoutArray = minerPaymentData;
  } else if (minerPaymentData) {
    payoutArray = [minerPaymentData as BalanceDetails];
  }

  // Convert latestMinerPayments to array
  let latestPaymentsArray: LatestPaymentItem[] = [];
  if (Array.isArray(latestMinerPayments)) {
    latestPaymentsArray = latestMinerPayments as LatestPaymentItem[];
  } else if (latestMinerPayments) {
    latestPaymentsArray = [latestMinerPayments as LatestPaymentItem];
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="w-full px-6 py-6 bg-black border-b border-white/[.1]">
        <h1 className="text-5xl font-extrabold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent tracking-tight">
          Payouts
        </h1>
        <p className="text-gray-400 text-md mt-1">
          View and monitor your miner payout details in real-time.
        </p>
      </header>

      <main className={`min-h-[calc(100vh-5rem)] px-8 sm:px-16 pb-16 ${mainClasses}`}>
        {error ? (
          <div className="text-red-500 mt-10">{error}</div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center">
            <div className="text-white animate-spin rounded-full h-12 w-12 border-b-4 border-white mb-6" />
            <p className="text-gray-400">Loading payout data...</p>
          </div>
        ) : payoutArray.length > 0 ? (
          <>
            {/* 
              1) A row with 2 columns:
                 Left => BalanceInfo
                 Right => PayoutSetupCard
              
              "items-stretch" ensures columns match in height,
              and we wrap each card with "h-full flex flex-col."
            */}
            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              {/* Left Column */}
              <div className="md:col-span-1 h-full flex flex-col">
                {payoutArray.map((payout, idx) => (
                  <div key={idx} className="h-full flex flex-col">
                    <BalanceInfo payout={payout} />
                  </div>
                ))}
              </div>

              {/* Right Column */}
              <div className="md:col-span-2 h-full flex flex-col">
                <PayoutSetupCard />
              </div>
            </div>

            {/* 2) Full-width row for the "latest" payments table */}
            <div className="mt-10">
              {latestPaymentsArray.length > 0 ? (
                <LatestPaymentsTable payments={latestPaymentsArray} />
              ) : (
                <p className="text-gray-400">No latest payments yet.</p>
              )}
            </div>
          </>
        ) : (
          <p className="text-gray-400 mt-10">No payout data found.</p>
        )}
      </main>
    </div>
  );
}

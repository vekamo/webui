"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useDataContext } from "@/app/context/DataContext";

import BalanceInfo, { BalanceDetails } from "@/components/payout/balanceUsers";
import PayoutSetupCard from "@/components/payout/payoutCard";
import LatestPaymentsTable, { LatestPaymentItem } from "@/components/payout/latestPaymentCard";

export default function PayoutPage() {
  const router = useRouter();

  const {
    isLoading,
    error,
    // other data from context
    minerPaymentData,
    latestMinerPayments,
    immatureBalance,
  } = useDataContext();

  // Local states
  const [payoutAddress, setPayoutAddress] = useState("");
  const [slateResponse, setSlateResponse] = useState("");
  const [resumeSlate, setResumeSlate] = useState("");
  const [isResumeMode, setIsResumeMode] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white font-[family-name:var(--font-geist-mono)]">
      {/* HEADER */}
      <header className="w-full px-6 py-6 bg-black border-b border-white/[.1]">
        <h1 className="text-5xl font-extrabold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent tracking-tight">
          Payouts
        </h1>
        <p className="text-gray-400 text-md mt-1">
          View and monitor your miner payout details in real-time.
        </p>
      </header>

      {/* MAIN => same approach as your Dashboard */}
      <main className="min-h-[calc(100vh-5rem)] px-8 sm:px-16 pb-16">
        {error ? (
          // Centered error
          <div className="flex flex-col items-center justify-center mt-10 text-red-500">
            {error}
          </div>
        ) : isLoading ? (
          // Centered loading spinner
          <div className="flex items-center justify-center h-[calc(100vh-5rem)]">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-white" />
              <p className="text-gray-400">Loading data...</p>
            </div>
          </div>
        ) : (
          // Wrap in consistent spacing container
          <div className="mt-10 w-full max-w-7xl mx-auto flex flex-col gap-8">
            {/* TOP ROW => Left (Balance), Right (PayoutSetup) */}
            <div className="flex flex-col md:flex-row gap-8">
              <div className="md:w-1/3">
                {(() => {
                  // Transform data to arrays if needed
                  let payoutArray: BalanceDetails[] = [];
                  if (Array.isArray(minerPaymentData)) {
                    payoutArray = minerPaymentData;
                  } else if (minerPaymentData) {
                    payoutArray = [minerPaymentData];
                  }
                  return payoutArray.map((payout, idx) => (
                    <BalanceInfo
                      key={idx}
                      payout={payout}
                      immatureBalance={immatureBalance}
                    />
                  ));
                })()}
              </div>

              <div className="md:w-2/3">
                <PayoutSetupCard
                  payoutAddress={payoutAddress}
                  setPayoutAddress={setPayoutAddress}
                  slateResponse={slateResponse}
                  setSlateResponse={setSlateResponse}
                  resumeSlate={resumeSlate}
                  isResumeMode={isResumeMode}
                  setIsResumeMode={setIsResumeMode}
                />
              </div>
            </div>

            {/* SECOND ROW => LatestPaymentsTable */}
            <div>
              {(() => {
                let latestPaymentsArray: LatestPaymentItem[] = [];
                if (Array.isArray(latestMinerPayments)) {
                  latestPaymentsArray = latestMinerPayments;
                } else if (latestMinerPayments) {
                  latestPaymentsArray = [latestMinerPayments];
                }

                // If user clicks “Resume” in a payment row
                function handleResumeTx(address: string, txData: string) {
                  setPayoutAddress(address);
                  setResumeSlate(txData);
                  setIsResumeMode(true);
                }

                return latestPaymentsArray.length > 0 ? (
                  <LatestPaymentsTable
                    payments={latestPaymentsArray}
                    onResumeTx={handleResumeTx}
                  />
                ) : (
                  <p className="text-gray-400">No latest payments yet.</p>
                );
              })()}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

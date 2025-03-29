"use client";
import React from "react";
import Cookies from "js-cookie";

export interface BalanceDetails {
  id: number;
  address: string | null;
  method: string | null;
  locked: boolean;
  amount: number;
  failure_count: number;
  last_try: number;
  last_success: number;
  total_amount: number;
  user_id: number;
  min_payout: number;
  enable_auto_payout: boolean;
}

/** 
 * Format timestamps to local datetime
 */
function formatTimestamp(epochSeconds?: number): string {
  if (!epochSeconds) return "N/A";
  return new Date(epochSeconds * 1000).toLocaleString();
}

/** 
 * Format amounts with 9 decimals 
 * (1 MWC = 1e9 atomic)
 */
function formatAmount(raw: number): string {
  const safeValue = raw ?? 0;
  const mwcValue = safeValue / 1e9;
  return mwcValue.toFixed(9) + " MWC";
}

export default function BalanceInfo({
  payout,
  immatureBalance = 0,
}: {
  payout: BalanceDetails;
  immatureBalance?: number;
}) {
  const {
    id,
    locked,
    amount,
    failure_count,
    last_try,
    last_success,
    total_amount,
    user_id,
    min_payout,
  } = payout;

  const username = Cookies.get("username") || "User";
  // Format amounts
  const currentAmtStr = formatAmount(amount);
  const totalAmtStr = formatAmount(total_amount);
  const immatureStr = formatAmount(immatureBalance);

  // “INACTIVE” (red) / “ACTIVE” (blue) or whichever states you want
  const lockedColor = locked ? "text-red-400" : "text-blue-400";

  return (
    <div
      className="
        h-full flex flex-col
        rounded-lg shadow-md
        bg-gradient-to-r from-[#182026] to-[#0f1215]
        border border-[#2A2D34]
        p-6 sm:p-8
        gap-4
        font-[family-name:var(--font-geist-mono)]
      "
    >
      {/* Title row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h2 className="text-2xl font-extrabold text-white">Balance</h2>
          <p className={`text-sm text-gray-300 uppercase text-gray-200"`}>{username}</p>
        </div>
        
      </div>

      {/* Available amount */}
      <div>
        <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">
          Available Amount
        </p>
        <p className="text-3xl font-semibold text-white">{currentAmtStr}</p>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-y-4 gap-x-4 mt-2 text-sm text-gray-300">
        {/* Immature (yellow) */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            Immature
          </p>
          <p className="font-semibold text-yellow-400">{immatureStr}</p>
        </div>

        {/* Failure count */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            Failure Count
          </p>
          <p className="font-semibold">{failure_count}</p>
        </div>

        {/* Last Try */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            Last Try
          </p>
          <p className="font-semibold">{formatTimestamp(last_try)}</p>
        </div>

        {/* Last Success */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            Last Success
          </p>
          <p className="font-semibold">{formatTimestamp(last_success)}</p>
        </div>

        {/* Total Amount */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            Total Amount
          </p>
          <p className="font-semibold">{totalAmtStr}</p>
        </div>

        {/* Min Payout */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            Min Payout
          </p>
          <p className="font-semibold">0.2 MWC</p>
        </div>
      </div>
    </div>
  );
}

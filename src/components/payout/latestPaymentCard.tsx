"use client";
import React, { useState } from "react";
import {
  ClipboardDocumentIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

/** Convert atomic => MWC, 9 decimals */
function formatToMWC(value: number): string {
  const mwcValue = value / 1e9;
  return mwcValue.toFixed(9);
}

/** Shorten strings if over 15 chars */
function shortenIfLong(str?: string): string {
  if (!str) return "N/A";
  if (str.length <= 15) return str;
  return str.slice(0, 5) + "..." + str.slice(-5);
}

export interface LatestPaymentItem {
  id: number;
  timestamp: string;
  height: number;
  uuid?: string;   // if your endpoint has it
  address: string;
  amount: number;  // atomic
  method: string;
  fee: number;     // atomic
  failure_count: number;
  invoked_by: string;
  state: string;
  tx_data: string;
  user_id: number;
}

function getStateTextClass(stateValue: string) {
  switch (stateValue.toLowerCase()) {
    case "confirmed":
      return "text-green-400";
    case "expired":
      return "text-red-400";
    default:
      return "text-gray-300";
  }
}

export default function LatestPaymentsTable({ payments }: {
  payments: LatestPaymentItem[];
}) {
  if (!payments || payments.length === 0) return null;

  const [justCopiedAddrRowId, setJustCopiedAddrRowId] = useState<number | null>(null);
  const [justCopiedUuidRowId, setJustCopiedUuidRowId] = useState<number | null>(null);

  async function handleCopyAddress(rowId: number, fullAddr: string) {
    try {
      await navigator.clipboard.writeText(fullAddr);
      setJustCopiedAddrRowId(rowId);
      setTimeout(() => setJustCopiedAddrRowId(null), 3000);
    } catch (err) {
      console.error("Copy address failed:", err);
    }
  }

  async function handleCopyUuid(rowId: number, fullUuid: string) {
    try {
      await navigator.clipboard.writeText(fullUuid);
      setJustCopiedUuidRowId(rowId);
      setTimeout(() => setJustCopiedUuidRowId(null), 3000);
    } catch (err) {
      console.error("Copy UUID failed:", err);
    }
  }

  return (
    <div
      className="
        w-full          /* No max-w- or mx-auto here */
        mt-8
        rounded-lg
        shadow-md
        bg-gradient-to-r from-[#182026] to-[#0f1215]
        border border-[#2A2D34]
        p-6 sm:p-8
        flex flex-col gap-4
        font-[family-name:var(--font-geist-mono)]
      "
    >
      <h2 className="text-xl tracking-tight mb-4 text-white">
        Latest Payments
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left text-gray-300">
          <thead className="bg-[#1b1e23] text-gray-400">
            <tr>
              <th className="py-3 px-4 uppercase">ID</th>
              <th className="py-3 px-4 uppercase">Timestamp</th>
              <th className="py-3 px-4 uppercase">Height</th>
              <th className="py-3 px-4 uppercase">UUID</th>
              <th className="py-3 px-4 uppercase">Address</th>
              <th className="py-3 px-4 uppercase">Amount (MWC)</th>
              <th className="py-3 px-4 uppercase">Method</th>
              <th className="py-3 px-4 uppercase">Fee (MWC)</th>
              <th className="py-3 px-4 uppercase">State</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => {
              const dateStr = new Date(p.timestamp).toLocaleString();
              const stateClass = getStateTextClass(p.state);
              const amountStr = formatToMWC(p.amount);
              const feeStr = formatToMWC(p.fee);

              const shortUuid = shortenIfLong(p.uuid || "N/A");
              const shortAddr = shortenIfLong(p.address);

              const isAddrCopied = justCopiedAddrRowId === p.id;
              const isUuidCopied = justCopiedUuidRowId === p.id;

              return (
                <tr
                  key={p.id}
                  className="border-b border-[#2A2D34] hover:bg-[#23262c] transition-colors"
                >
                  <td className="py-2 px-4">{p.id}</td>
                  <td className="py-2 px-4">{dateStr}</td>
                  <td className="py-2 px-4">{p.height}</td>

                  <td className="py-2 px-4">
                    <div className="flex items-center gap-2">
                      <span>{shortUuid}</span>
                      {p.uuid && p.uuid.length > 0 && (
                        <button
                          onClick={() => handleCopyUuid(p.id, p.uuid!)}
                          className="text-gray-400 hover:text-blue-500 transition-colors"
                          title="Copy full UUID"
                        >
                          {isUuidCopied ? (
                            <CheckCircleIcon className="w-4 h-4 text-green-400" />
                          ) : (
                            <ClipboardDocumentIcon className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </td>

                  <td className="py-2 px-4">
                    <div className="flex items-center gap-2">
                      <span>{shortAddr}</span>
                      {p.address && p.address.length > 0 && (
                        <button
                          onClick={() => handleCopyAddress(p.id, p.address)}
                          className="text-gray-400 hover:text-blue-500 transition-colors"
                          title="Copy full address"
                        >
                          {isAddrCopied ? (
                            <CheckCircleIcon className="w-4 h-4 text-green-400" />
                          ) : (
                            <ClipboardDocumentIcon className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </td>

                  <td className="py-2 px-4">{amountStr}</td>
                  <td className="py-2 px-4">{p.method}</td>
                  <td className="py-2 px-4">{feeStr}</td>
                  <td className={`py-2 px-4 ${stateClass}`}>
                    {p.state}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

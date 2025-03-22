"use client";
import React, { useState } from "react";
import {
  ClipboardDocumentIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

/** The shape of each payment item. */
export interface LatestPaymentItem {
  id: number;
  timestamp: string;
  height: number;
  address: string;
  amount: number; // atomic => for conversion
  method: string;
  fee: number; // atomic => for conversion
  state: string; // e.g. "sent" => show Resume
  tx_data: string;
  slate_id?: string; // partial slatepack
  // ... add additional fields if needed
}

interface LatestPaymentsTableProps {
  payments: LatestPaymentItem[];
  onResumeTx?: (address: string, txData: string) => void; // optional callback
}

/** Shorten a string longer than 15 chars, e.g. "abcdefg12345hijklmnop" => "abcde...klmnop" */
function shortenIfLong(str?: string): string {
  if (!str) return "N/A";
  if (str.length <= 15) return str;
  return str.slice(0, 5) + "..." + str.slice(-5);
}

/** Convert atomic amounts (1e9) to MWC with 9 decimals. */
function formatToMWC(value: number): string {
  return (value / 1e9).toFixed(9);
}

/** Map payment state to a text color class. */
function getStateTextClass(stateValue?: string): string {
  if (!stateValue) {
    return "text-gray-300";
  }
  switch (stateValue.toLowerCase()) {
    case "confirmed":
      return "text-green-400";
    case "expired":
      return "text-gray-400";
    case "sent":
      return "text-yellow-400";
    case "posted":
      return "text-blue-400";
    case "canceled":
      return "text-red-400";
    default:
      return "text-gray-300";
  }
}

/** LatestPaymentsTable component */
export default function LatestPaymentsTable({
  payments,
  onResumeTx,
}: LatestPaymentsTableProps) {
  const [justCopiedAddrRowId, setJustCopiedAddrRowId] = useState<number | null>(null);
  const [justCopiedUuidRowId, setJustCopiedUuidRowId] = useState<number | null>(null);

  // If no payments, show nothing
  if (!payments || payments.length === 0) return null;

  async function handleCopyAddress(rowId: number, fullAddr: string) {
    try {
      await navigator.clipboard.writeText(fullAddr);
      setJustCopiedAddrRowId(rowId);
      setTimeout(() => setJustCopiedAddrRowId(null), 3000);
    } catch (err) {
      console.error("Copy address failed:", err);
    }
  }

  async function handleCopyUuid(rowId: number, uuid: string) {
    try {
      await navigator.clipboard.writeText(uuid);
      setJustCopiedUuidRowId(rowId);
      setTimeout(() => setJustCopiedUuidRowId(null), 3000);
    } catch (err) {
      console.error("Copy UUID failed:", err);
    }
  }

  return (
    <div
      className="
        w-full mt-8
        rounded-lg shadow-md
        bg-gradient-to-r from-[#182026] to-[#0f1215]
        border border-[#2A2D34]
        p-6 sm:p-8
        flex flex-col gap-4
        font-[family-name:var(--font-geist-mono)]
      "
    >
      <h2 className="text-xl sm:text-2xl font-extrabold text-white">
        Latest Payments
      </h2>
      <p className="text-sm text-gray-400">
        The most recent payments and their statuses.
      </p>

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
              <th className="py-3 px-4 uppercase">Actions</th>
            </tr>
          </thead>

          <tbody>
            {payments.map((p, index) => {
              // Use p.id if it's guaranteed unique; otherwise fallback to index
              const rowKey = p.id != null ? p.id : `row-${index}`;
              const dateStr = new Date(p.timestamp).toLocaleString();
              const stateClass = getStateTextClass(p.state);
              const amountStr = formatToMWC(p.amount);
              const feeStr = formatToMWC(p.fee);

              // Shorten text for display
              const shortUuid = shortenIfLong(p.slate_id);
              const shortAddress = shortenIfLong(p.address);

              return (
                <tr
                  key={rowKey}
                  className="border-b border-[#2A2D34] hover:bg-[#23262c]"
                >
                  {/* ID */}
                  <td className="py-2 px-4">{p.id}</td>

                  {/* Timestamp */}
                  <td className="py-2 px-4">{dateStr}</td>

                  {/* Height */}
                  <td className="py-2 px-4">{p.height}</td>

                  {/* UUID */}
                  <td className="py-2 px-4">
                    {p.slate_id ? (
                      <div className="flex items-center gap-2">
                        <span>{shortUuid}</span>
                        <button
                          onClick={() => handleCopyUuid(p.id, p.slate_id!)}
                          className="text-gray-400 hover:text-blue-500"
                          title="Copy Slate ID"
                        >
                          {justCopiedUuidRowId === p.id ? (
                            <CheckCircleIcon className="w-4 h-4 text-green-400" />
                          ) : (
                            <ClipboardDocumentIcon className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    ) : (
                      "N/A"
                    )}
                  </td>

                  {/* Address */}
                  <td className="py-2 px-4">
                    <div className="flex items-center gap-2">
                      <span>{shortAddress}</span>
                      {p.address && p.address.length > 0 && (
                        <button
                          onClick={() => handleCopyAddress(p.id, p.address)}
                          className="text-gray-400 hover:text-blue-500"
                          title="Copy Address"
                        >
                          {justCopiedAddrRowId === p.id ? (
                            <CheckCircleIcon className="w-4 h-4 text-green-400" />
                          ) : (
                            <ClipboardDocumentIcon className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Amount */}
                  <td className="py-2 px-4">{amountStr}</td>

                  {/* Method */}
                  <td className="py-2 px-4">{p.method}</td>

                  {/* Fee */}
                  <td className="py-2 px-4">{feeStr}</td>

                  {/* State */}
                  <td className={`py-2 px-4 ${stateClass}`}>{p.state}</td>

                  {/* Actions */}
                  <td className="py-2 px-4">
                    {p.state === "sent" && onResumeTx && (
                      <button
                        onClick={() => onResumeTx(p.address, p.tx_data)}
                        className="text-blue-400 hover:text-blue-600"
                      >
                        Resume
                      </button>
                    )}
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

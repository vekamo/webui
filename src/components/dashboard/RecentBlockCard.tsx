"use client";
import React, { useState } from "react";
import {
  ClipboardDocumentIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

/***************************************************
 *  COMPONENT: RecentBlocksCard
 *  - Renders a heading, some description,
 *    and a table of recently found blocks,
 *    styled similarly to the LatestPaymentTable.
 ***************************************************/

interface LastBlock {
  height: number;
  timestamp: string;
  reward: string;
  hash?: string;
  state?: string;
  difficulty?: number;
}

/** If the string is over 15 chars, shorten with ellipses. */
function shortenIfLong(str?: string): string {
  if (!str) return "N/A";
  if (str.length <= 15) return str;
  return str.slice(0, 5) + "..." + str.slice(-5);
}

/** 
 * Returns a Tailwind color class for the block's "state":
 * - "new" => text-green-400
 * - otherwise => text-yellow-400
 */
function getStateColorClass(state?: string) {
  if (!state) return "text-gray-300";
  return state.toLowerCase() === "new" ? "text-green-400" : "text-yellow-400";
}

export default function RecentBlocksCard({ blocks }: { blocks: LastBlock[] }) {
  // Track which block hash was just copied (store the height of that block)
  const [copiedHashHeight, setCopiedHashHeight] = useState<number | null>(null);

  async function handleCopyHash(blockHeight: number, blockHash: string) {
    try {
      await navigator.clipboard.writeText(blockHash);
      setCopiedHashHeight(blockHeight);
      // Clear the “just copied” state after 3 seconds
      setTimeout(() => setCopiedHashHeight(null), 3000);
    } catch (err) {
      console.error("Copy hash failed:", err);
    }
  }

  if (!blocks || blocks.length === 0) {
    return null; // or display a placeholder / "No blocks found" message
  }

  return (
    <div
      className="
        rounded-lg shadow-md
        bg-gradient-to-r from-[#182026] to-[#0f1215]
        border border-[#2A2D34]
        p-6 sm:p-8
        flex flex-col gap-4
        font-[family-name:var(--font-geist-mono)]
      "
    >
      <h2 className="text-xl sm:text-2xl font-extrabold text-white">
        Recently Found Blocks
      </h2>
      <p className="text-sm text-gray-400">
        The most recent MWC blocks found by our pool.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left text-gray-300">
          <thead className="bg-[#1b1e23] text-gray-400">
            <tr>
              <th className="py-3 px-4 uppercase">Height</th>
              <th className="py-3 px-4 uppercase">Difficulty</th>
              <th className="py-3 px-4 uppercase">Timestamp</th>
              <th className="py-3 px-4 uppercase">Reward</th>
              <th className="py-3 px-4 uppercase">Hash</th>
              <th className="py-3 px-4 uppercase">Status</th>
            </tr>
          </thead>

          <tbody>
            {blocks.map((block) => {
              const shortHash = shortenIfLong(block.hash);
              const justCopied = copiedHashHeight === block.height;
              const statusColorClass = getStateColorClass(block.state);

              return (
                <tr
                  key={block.height}
                  className="border-b border-[#2A2D34] hover:bg-[#23262c] transition-colors"
                >
                  {/* Height */}
                  <td className="py-2 px-4">{block.height}</td>
                  
                  {/* Timestamp */}
                  <td className="py-2 px-4">{block.timestamp}</td>

                  {/* Reward */}
                  <td className="py-2 px-4">{block.reward}</td>

                  {/* Hash + copy button */}
                  <td className="py-2 px-4">
                    {block.hash && block.hash.length > 0 ? (
                      <div className="flex items-center gap-2">
                        <span>{shortHash}</span>
                        <button
                          onClick={() => handleCopyHash(block.height, block.hash!)}
                          className="text-gray-400 hover:text-blue-500 transition-colors"
                          title="Copy full block hash"
                        >
                          {justCopied ? (
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

                  {/* Status => green if new, yellow if otherwise */}
                  <td className={`py-2 px-4 ${statusColorClass}`}>
                    {block.state ?? "N/A"}
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

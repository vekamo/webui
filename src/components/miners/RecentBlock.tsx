"use client";

import React, { useState } from "react";
import {
  ClipboardDocumentIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

import { COINS_PER_BLOCK, RATIO_POOL_FEE } from "@/constants/constants";
import { calculateCreditFromStat } from "@/utils/utils";

// For text + table styling
const C31_COLOR = "#14b8a6";

function secondsToHms(totalSec: number) {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = Math.floor(totalSec % 60);
  return `${h}h ${m}m ${s}s`;
}

/** If the string is over 15 chars, shorten with ellipses. */
function shortenIfLong(str?: string): string {
  if (!str) return "N/A";
  if (str.length <= 15) return str;
  return str.slice(0, 5) + "..." + str.slice(-5);
}

// A quick check: if we have 240 blocks in compiled data
function has240Blocks(obj: any) {
  return Object.keys(obj).length === 240;
}

// Summation logic
function calculateBlockReward(
  compiledBlockShareData: { [key: string]: any }
): { poolCredit: number; userCredit: number; userReward: number } | null {
  if (!has240Blocks(compiledBlockShareData)) return null;

  let aggregatedPoolCredit = 0;
  let aggregatedUserCredit = 0;

  for (const key in compiledBlockShareData) {
    const blockStat = compiledBlockShareData[key];
    if (!blockStat) continue;

    const { pool, miner } = calculateCreditFromStat(blockStat);
    aggregatedPoolCredit += pool;
    aggregatedUserCredit += miner;
  }
  if (aggregatedPoolCredit === 0) return null;

  const portion = aggregatedUserCredit / aggregatedPoolCredit;
  const userReward = COINS_PER_BLOCK * portion;
  return { userReward, poolCredit: aggregatedPoolCredit, userCredit: aggregatedUserCredit };
}

// Decide if block is old enough to form a complete 240-block window
function isBlockMature(blockHeight: number, lastHeight: number) {
  return blockHeight < lastHeight && blockHeight > lastHeight - 240;
}

interface MinerBlock {
  height: number;
  hash?: string;
  timestamp?: number; // for "Found" (ago)
  difficulty?: number;
  edge_bits?: number;
  actual_difficulty?: number;
  total_difficulty?: number;
}

interface Props {
  recentBlocks: MinerBlock[];
  range: number;
  lastHeight: number;
  networkData: any[];
  mwcPoolData: any[];
  minerShareData: any[];
}

export default function RecentBlocksTable({
  recentBlocks,
  range,
  lastHeight,
  networkData,
  mwcPoolData,
  minerShareData,
}: Props) {
  // For copy-to-clipboard feedback
  const [copiedHashHeight, setCopiedHashHeight] = useState<number | null>(null);

  async function handleCopyHash(blockHeight: number, blockHash: string) {
    try {
      await navigator.clipboard.writeText(blockHash);
      setCopiedHashHeight(blockHeight);
      // Clear after 3s
      setTimeout(() => setCopiedHashHeight(null), 3000);
    } catch (err) {
      console.error("Copy hash failed:", err);
    }
  }

  const sortedBlocks = JSON.parse(JSON.stringify(recentBlocks));
  sortedBlocks.sort((a:MinerBlock, b: MinerBlock) => a.height - b.height);

  const rows: React.ReactNode[] = [];

  for (let i = 1; i <= range && i <= sortedBlocks.length - 1; i++) {
    const block = sortedBlocks[sortedBlocks.length - i];

    // time ago
    const currentTimestamp = Date.now() / 1000; // in seconds
    const foundSecAgo = currentTimestamp - (block.timestamp || 0);
    const foundAgoStr = secondsToHms(foundSecAgo);

    let minerC31ValidShares: string | number = "n/a";
    let poolC31ValidShares: string | number = "n/a";
    let minerCredit: string | number = "n/a";
    let poolCredit: string | number = "n/a";
    let minerPortion = "n/a";
    let userRewardStr = "n/a";

    if (isBlockMature(block.height, lastHeight)) {
      // build compiled data ...
      const compiled: any = {};
      let c31MinerTotal = 0;

      // gather user shares
      networkData.forEach((b) => {
        if (b.height > block.height || b.height <= block.height - 240) return;
        // find a corresponding share object
        const blockShareObj = minerShareData.find((d: any) => d.height === b.height);
        let valid_shares = 0;
        if (blockShareObj) {
          valid_shares = blockShareObj.valid_shares || 0;
        }
        c31MinerTotal += valid_shares;
        compiled[b.height] = { minerC31: valid_shares };
      });
      // gather pool shares
      let c31PoolTotal = 0;
      mwcPoolData.forEach((b) => {
        if (compiled[b.height]) {
          const poolShares = b.share_counts?.C31?.valid ?? 0;
          compiled[b.height].poolC31 = poolShares;
          c31PoolTotal += poolShares;
        }
      });

      const rewardData = calculateBlockReward(compiled);
      if (rewardData) {
        minerC31ValidShares = c31MinerTotal;
        poolC31ValidShares = c31PoolTotal;
        minerCredit = rewardData.userCredit;
        poolCredit = rewardData.poolCredit;
        if (rewardData.poolCredit > 0) {
          const ratio = (rewardData.userCredit / rewardData.poolCredit) * 100 * RATIO_POOL_FEE;
          minerPortion = `${ratio.toFixed(3)}%`;
        }
        const userReward = rewardData.userReward * RATIO_POOL_FEE;
        userRewardStr = userReward.toFixed(9);
      }
    }

    const shortHash = shortenIfLong(block.hash);
    const justCopied = copiedHashHeight === block.height;

    const difficulty = block.actual_difficulty || block.total_difficulty || block.difficulty || 0;

    rows.push(
      <tr
        key={block.height}
        className="border-b border-[#2A2D34] hover:bg-[#23262c] transition-colors"
      >
        <td className="py-2 px-4">{block.height}</td>
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
        <td className="py-2 px-4">{`${foundAgoStr} ago`}</td>
        <td className="py-2 px-4">{difficulty.toLocaleString()}</td>
        <td className="py-2 px-4">{minerC31ValidShares}</td>
        <td className="py-2 px-4">{poolC31ValidShares}</td>
        <td className="py-2 px-4">{minerCredit}</td>
        <td className="py-2 px-4">{poolCredit}</td>
        <td className="py-2 px-4">{minerPortion}</td>
        <td className="py-2 px-4 text-right">{userRewardStr}</td>
      </tr>
    );
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
      <p className="text-sm text-gray-400">The most recent MWC blocks found by our pool.</p>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left text-gray-300">
          <thead className="bg-[#1b1e23] text-gray-400">
            <tr>
              <th className="py-3 px-4 uppercase">Height</th>
              <th className="py-3 px-4 uppercase">Hash</th>
              <th className="py-3 px-4 uppercase">Found</th>
              <th className="py-3 px-4 uppercase">Difficulty</th>
              <th className="py-3 px-4 uppercase">Miner C31</th>
              <th className="py-3 px-4 uppercase">Pool C31</th>
              <th className="py-3 px-4 uppercase">Miner Credit</th>
              <th className="py-3 px-4 uppercase">Pool Credit</th>
              <th className="py-3 px-4 uppercase">Portion</th>
              <th className="py-3 px-4 uppercase">User Reward</th>
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </table>
      </div>
    </div>
  );
}

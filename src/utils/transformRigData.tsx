// src/utils/transformRigData.ts
import { BlocksByHeight, GpsEntry, RigBlocks, RigBlockData } from "@/types/types";

/**
 * transformRigData:
 *  1) Finds block heights that exist in rigDataMiner and blocksByHeight
 *  2) For each rig, sums "31" shares to compute c31Gps
 *  3) Returns multiRig: { [rigName]: RigBlock[] }
 */
export function transformRigData(
  rigDataMiner: Record<number, any>,
  blocksByHeight: BlocksByHeight
): Record<string, RigBlockData[]> {
  // 1) Intersection of heights
  const minerHeights = Object.keys(rigDataMiner).map((h) => parseInt(h, 10));
  const commonHeights = minerHeights.filter((h) => blocksByHeight[h] != null);
  commonHeights.sort((a, b) => a - b);

  // 2) Collect rig names
  const rigNamesSet = new Set<string>();
  for (const heightStr of Object.keys(rigDataMiner)) {
    const rigsAtHeight = rigDataMiner[parseInt(heightStr, 10)];
    for (const rigName of Object.keys(rigsAtHeight)) {
      rigNamesSet.add(rigName);
    }
  }
  const allRigNames = Array.from(rigNamesSet);

  // 3) Output structure
  const multiRig: Record<string, RigBlockData[]> = {};

  // 4) For each block (except first), compute c31Gps from previous block's timestamp
  for (let i = 1; i < commonHeights.length; i++) {
    const height = commonHeights[i];
    const prevHeight = commonHeights[i - 1];

    const currentBlock = blocksByHeight[height];
    const previousBlock = blocksByHeight[prevHeight];
    if (!currentBlock || !previousBlock) continue;
    if (
      typeof currentBlock.timestamp !== "number" ||
      typeof previousBlock.timestamp !== "number"
    ) {
      continue;
    }

    const periodDuration = currentBlock.timestamp - previousBlock.timestamp;
    if (periodDuration <= 0) continue;

    // For each rig
    for (const rigName of allRigNames) {
      const rigBlockData = rigDataMiner[height]?.[rigName] || {};

      let totalValid = 0;
      let totalRejected = 0;
      let totalStale = 0;

      for (const workerId of Object.keys(rigBlockData)) {
        const workerAlgos = rigBlockData[workerId];
        if (workerAlgos["31"]) {
          totalValid += workerAlgos["31"].accepted || 0;
          totalRejected += workerAlgos["31"].rejected || 0;
          totalStale += workerAlgos["31"].stale || 0;
        }
      }

      // c31Gps = shares * 42 / timeDelta
      const c31Gps = (totalValid * 42) / periodDuration;
      const gpsEntry: GpsEntry = { gps: c31Gps, edge_bits: 31 };

      const blockData: RigBlockData = {
        id: 0,
        timestamp: currentBlock.timestamp,
        height,
        valid_shares: totalValid,
        invalid_shares: totalRejected,
        stale_shares: totalStale,
        gps: [gpsEntry],
      };

      if (!multiRig[rigName]) {
        multiRig[rigName] = [];
      }
      multiRig[rigName].push(blockData);
    }
  }

  return multiRig;
}



export function sumShares(rigBlockData: Record<string, any>): { accepted: number, rejected: number, stale: number, total: number } {
  let totalValid = 0;
  let totalRejected = 0;
  let totalStale = 0;
  let total = 0;
  //console.log(rigBlockData)
  // Iterate over each worker's algorithms (e.g., workerId => { algos })
  for (const block of Object.keys(rigBlockData)) {
    const workerAlgos = rigBlockData[block];
    totalValid += workerAlgos.valid_shares || 0;
    totalRejected += workerAlgos.invalid_shares || 0;
    totalStale += workerAlgos.stale_shares || 0;
  }
  total = totalValid + totalRejected + totalStale
  return { accepted: totalValid, rejected: totalRejected, stale: totalStale, total: total };
}

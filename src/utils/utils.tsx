import { COINS_PER_BLOCK } from "@/constants/constants";
import { sha3_256 } from "js-sha3";
import { decode as base32Decode } from "hi-base32";
import { BlockData } from "@/types/types";

export const ellipsizeString = (input: string, length: number) => {
  const inputLength = input.length;
  const halfway = length / 2;
  const firstHalf = input.slice(0, halfway);
  const secondHalf = input.slice(inputLength - halfway, inputLength);
  const output = `${firstHalf}...${secondHalf}`;
  return output;
};


export const getTimeMeasurement = (inMinutes: number): string => {
  switch (true) {
    case inMinutes < 1:
      return "seconds";
    case inMinutes < 60:
      return "minutes";
    case inMinutes < 1440:
      return "hours";
    case inMinutes <= 84960:
      return "days";
    default:
      return "";
  }
};

export const getTimeWithMeasurement = (
  inMinutes: number
): { measurement: string; value: number } => {
  const measurement = getTimeMeasurement(inMinutes);

  // Add index signature so TS allows measurements[measurement].
  const measurements: { [key: string]: (minutes: number) => number } = {
    seconds(minutes: number) {
      const val = Math.round(minutes * 60);
      return val;
    },
    minutes(minutes: number) {
      return minutes;
    },
    hours(minutes: number) {
      return minutes / 60;
    },
    days(minutes: number) {
      return minutes / (24 * 60);
    },
  };

  const strategy = measurements[measurement];
  if (!strategy) {
    console.error(`No strategy for measurement: ${measurement}`);
    return { measurement: "", value: Infinity };
  }
  return {
    measurement,
    value: strategy(inMinutes),
  };
};

export const getTimeInMinutes = (params: {
  measurement: string;
  value: number;
}): number => {
  const { measurement, value } = params;

  // Add index signature so TS allows measurementStrategies[measurement].
  const measurementStrategies: { [key: string]: (v: number) => number } = {
    seconds(v: number) {
      return Math.round((v / 60) * 100) / 100;
    },
    minutes(v: number) {
      return v;
    },
    hours(v: number) {
      return v * 60;
    },
    days(v: number) {
      return v * 24 * 60;
    },
  };

  const strategy = measurementStrategies[measurement];
  if (!strategy) {
    console.error(`No strategy for measurement: ${measurement}`);
    return Infinity;
  }
  return strategy(value);
};

export function secondsToHms(d: number) {
  d = Number(d);
  const h = Math.floor(d / 3600);
  const m = Math.floor((d % 3600) / 60);
  const s = Math.floor(d % 3600 % 60);
  let sDisplay = "";
  const hDisplay = h > 0 ? h + "h " : "";
  const mDisplay = m > 0 ? m + "m " : "";
  if (h === 0) {
    sDisplay = s > 0 ? s + "s " : "";
  }
  return hDisplay + mDisplay + sDisplay;
}

export const nanoMWCToMWC = (nanoMWC: number) => {
  return nanoMWC / 1000000000;
};

export const MWCToNanoMWC = (nanoMWC: number) => {
  return nanoMWC * 1000000000;
};

export const calculateBlockReward = (
  compiledBlockShareData: { [key: string]: object }
): { poolCredit: number; userCredit: number; userReward: number } | null => {
  let aggregatedPoolCredit = 0;
  let aggregatedUserCredit = 0;
  const compiledShareDataKeys = Object.keys(compiledBlockShareData);
  if (compiledShareDataKeys.length !== 240) {
    return null;
  }
  compiledShareDataKeys.forEach((key) => {
    if (!compiledBlockShareData[key]) {
      console.log("compiledShareData issue on: ", key);
    }
    const blockShareCredits = calculateCreditFromStat(compiledBlockShareData[key]);
    aggregatedPoolCredit += blockShareCredits.pool;
    aggregatedUserCredit += blockShareCredits.miner;
  });

  if (aggregatedPoolCredit === 0) return null;
  const portion = aggregatedUserCredit / aggregatedPoolCredit;
  const userReward = COINS_PER_BLOCK * portion;
  return {
    userReward,
    poolCredit: aggregatedPoolCredit,
    userCredit: aggregatedUserCredit,
  };
};

export const calculateCreditFromStat = (
  block: any
): { miner: number; pool: number } => {
  if (!block) return { miner: 0, pool: 0 }; // needs fixing
  const weight = Math.pow(2, 1 + 31 - 24) * 31;

  const minerC31Credit = block.minerC31 ? block.minerC31 * weight : 0;
  const poolC31Credit = block.poolC31 ? block.poolC31 * weight : 0;

  const miner = minerC31Credit;
  const pool = poolC31Credit;
  if (isNaN(miner) || isNaN(pool)) {
    console.log("missing data");
  }
  return {
    miner,
    pool,
  };
};

/**
 * 1) `minerData` is now Record<string, any[]> so you can do `minerData["c31"]`.
 */



/**
 * If 'minerData' is { c31: BlockData[] }, we handle it one way;
 * If 'minerData' is BlockData[], we handle it the other way.
 */
export const calculateDailyEarningFromGps = (
  networkData: BlockData[],
  minerData: Record<string, BlockData[]> | BlockData[],
  latestHeight: number,
  selectedRigWorker?: string
): number => {
  const minerTotalGps: Record<string, number> = { c31: 0 };
  let networkTotalC31Gps = 0;

  // Short-circuit if no data
  if (
    (Array.isArray(minerData) && minerData.length === 0) ||
    (!Array.isArray(minerData) && Object.keys(minerData).length === 0)
  ) {
    return 0;
  }

  // Check for selectedRigWorker => we assume a record shape
  if (selectedRigWorker) {
    const algos = [31];
    algos.forEach((algo) => {
      const algoKey = `c${algo}`; // e.g. "c31"
      // If NOT an array => we treat it as a record with "c31" key
      if (!Array.isArray(minerData) && minerData[algoKey]) {
        minerData[algoKey].forEach((block) => {
          // Filter out blocks out of range
          if (
            block.height > latestHeight - 5 ||
            block.height < latestHeight - 245
          ) {
            return;
          }
          // Summation for the selected rig worker
          minerTotalGps[algoKey] += block[selectedRigWorker] ?? 0;
        });
      }
    });
  } else {
    // No rig worker => 'minerData' could be an array or record
    if (Array.isArray(minerData)) {
      // (Case 1) It's an array of blocks
      minerData.forEach((block) => {
        if (
          block.height > latestHeight - 5 ||
          block.height < latestHeight - 245
        ) {
          return;
        }
        block.gps?.forEach((algo) => {
          if (algo.edge_bits === 31) {
            minerTotalGps.c31 += algo.gps;
          }
        });
      });
    } else {
      // (Case 2) It's a record like { c31: BlockData[] }
      if (minerData.c31) {
        minerData.c31.forEach((block) => {
          if (
            block.height > latestHeight - 5 ||
            block.height < latestHeight - 245
          ) {
            return;
          }
          block.gps?.forEach((algo) => {
            if (algo.edge_bits === 31) {
              minerTotalGps.c31 += algo.gps;
            }
          });
        });
      }
    }
  }

  // Now gather c31 from networkData
  networkData.forEach((block) => {
    if (block.height > latestHeight - 5 || block.height < latestHeight - 245) {
      return;
    }
    block.gps?.forEach((algo) => {
      if (algo.edge_bits === 31) {
        networkTotalC31Gps += algo.gps;
      }
    });
  });

  // Compute average over 240 blocks
  const minerAverageC31 = minerTotalGps.c31 / 240;
  const networkAverageC31 = networkTotalC31Gps / 240;
  const weight = Math.pow(2, 1 + 31 - 24) * 31;

  const minerC31Credit = minerAverageC31 * weight;
  const networkC31Credit = networkAverageC31 * weight;
  if (networkC31Credit === 0) return 0;

  // Final daily earning
  const result =
    (minerC31Credit / networkC31Credit) * COINS_PER_BLOCK * 60 * 24;
  return parseFloat(result.toFixed(9));
};


export const basicAuth = (token: string) => {
  const auth = "Basic " + token;
  return auth;
};

export const basicAuthLegacy = (token: string) => {
  const auth = "Basic " + Buffer.from(token + ":random").toString("base64");
  return auth;
};

export const getRandomColor = () => {
  const red = 50 + Math.floor(Math.random() * 205);
  const green = 50 + Math.floor(Math.random() * 205);
  const blue = 50 + Math.floor(Math.random() * 205);
  const output = `rgb(${red}, ${green}, ${blue})`;
  return output;
};

export const randomColors = [
  /* your color array, omitted for brevity */
];

/**
 * getC31AvgForHeightRange:
 * If invalid or no c31, returns 0. Otherwise returns average c31 GPS for [fromHeight..toHeight].
 */
export default function getC31AvgForHeightRange(
  blocks: any[],
  fromHeight: number,
  toHeight: number
): number {
  if (toHeight < fromHeight) return 0;
  const relevant = blocks.filter(
    (b) => b.height >= fromHeight && b.height <= toHeight
  );

  let sum = 0;
  for (const block of relevant) {
    const c31Entry = block.gps?.find((g: any) => g.edge_bits === 31);
    if (c31Entry?.gps) {
      sum += c31Entry.gps;
    }
  }

  const blockCount = toHeight - fromHeight + 1;
  if (blockCount <= 0) return 0;
  return sum / blockCount;
}

/**
 * 2) If you're also using `minerData` in a range function, define it similarly.
 */
export function getMinerBlockRewardData(
  height: number,
  networkData: any[],
  mwcPoolData: any[],
  minerShareData: any,
  selectedRigWorker?: string
): Record<string, any> | null {
  const compiledShareData: any = {};
  let cumulativeMinerC31Shares = 0;

  // 1) gather user c31 shares from networkData blocks
  networkData.forEach((block) => {
    if (block.height > height || block.height <= height - 240) return;

    const blockData = minerShareData[`block_${block.height}`];
    let minerShareBlockData: any;
    if (blockData) {
      minerShareBlockData = selectedRigWorker ? blockData[selectedRigWorker] : blockData;
    }

    let c31Shares = 0;
    if (minerShareBlockData) {
      c31Shares = minerShareBlockData.c31ValidShares ?? 0;
      cumulativeMinerC31Shares += c31Shares;
    }

    compiledShareData[`block_${block.height}`] = {
      height: block.height,
      secondary_scaling: block.secondary_scaling,
      minerC31: c31Shares,
    };
  });

  // 2) gather pool c31 shares from mwcPoolData
  let cumulativePoolC31Shares = 0;
  mwcPoolData.forEach((block) => {
    const key = `block_${block.height}`;
    if (compiledShareData[key]) {
      const c31 = block.share_counts?.C31;
      const poolShares = c31 ? c31.valid : 0;
      compiledShareData[key].poolC31 = poolShares;
      cumulativePoolC31Shares += poolShares;
    }
  });

  // 3) remove out-of-range blocks from compiledShareData
  for (const key in compiledShareData) {
    const blockHeight = parseInt(key.replace("block_", ""));
    if (blockHeight > height || blockHeight <= height - 240) {
      delete compiledShareData[key];
    }
  }

  // 4) call "calculateBlockReward"
  const calculatedBlockRewardData = calculateBlockReward(compiledShareData);
  if (!calculatedBlockRewardData) return null;

  return {
    ...calculatedBlockRewardData,
    cumulativeMinerC31Shares,
    cumulativePoolC31Shares,
  };
}

/**
 * 3) Similarly, if your `minerData` is "c31: array" style, change its type:
 */
export function calculateDailyEarningFromGpsRange(
  networkData: BlockData[],
  minerData: Record<string, BlockData[]> | BlockData[],
  fromHeight: number,
  toHeight: number,
  selectedRigWorker?: string
): number {
  // Quick checks
  if (
    (Array.isArray(minerData) && minerData.length === 0) ||
    (!Array.isArray(minerData) && Object.keys(minerData).length === 0) ||
    networkData.length === 0
  ) {
    return 0;
  }

  if (toHeight < fromHeight) return 0;

  let minerTotalC31Gps = 0;
  let networkTotalC31Gps = 0;

  // 1) Sum up c31 from minerData in the height range
  if (selectedRigWorker) {
    // If there's a chosen rig worker, we assume `minerData` is a record
    const algoKey = "c31";
    if (!Array.isArray(minerData) && minerData[algoKey]) {
      // Filter relevant blocks
      const relevantMinerBlocks = minerData[algoKey].filter(
        (block) => block.height >= fromHeight && block.height <= toHeight
      );
      relevantMinerBlocks.forEach((block) => {
        // Add this worker’s share
        minerTotalC31Gps += block[selectedRigWorker] || 0;
      });
    }
  } else {
    // If no worker => we might have a plain array or a record
    if (Array.isArray(minerData)) {
      // (Case A) `minerData` is an array
      const relevantMinerBlocks = minerData.filter(
        (block) => block.height >= fromHeight && block.height <= toHeight
      );
      relevantMinerBlocks.forEach((block) => {
        block.gps?.forEach((algo) => {
          if (algo.edge_bits === 31) {
            minerTotalC31Gps += algo.gps;
          }
        });
      });
    } else {
      // (Case B) `minerData` is a record, e.g. { c31: [...] }
      if (minerData["c31"]) {
        const relevantMinerBlocks = minerData["c31"].filter(
          (block) => block.height >= fromHeight && block.height <= toHeight
        );
        relevantMinerBlocks.forEach((block) => {
          block.gps?.forEach((algo) => {
            if (algo.edge_bits === 31) {
              minerTotalC31Gps += algo.gps;
            }
          });
        });
      }
    }
  }

  // 2) Sum up c31 from networkData in [fromHeight..toHeight]
  const relevantNetworkBlocks = networkData.filter(
    (block) => block.height >= fromHeight && block.height <= toHeight
  );
  relevantNetworkBlocks.forEach((block) => {
    block.gps?.forEach((algo) => {
      if (algo.edge_bits === 31) {
        networkTotalC31Gps += algo.gps;
      }
    });
  });

  // 3) Compute average c31 gps for that range
  const blockCount = toHeight - fromHeight + 1;
  if (blockCount <= 0) return 0;

  const minerAvgC31 = minerTotalC31Gps / blockCount;
  const networkAvgC31 = networkTotalC31Gps / blockCount;

  const weight = Math.pow(2, 1 + 31 - 24) * 31;
  const minerC31Credit = minerAvgC31 * weight;
  const networkC31Credit = networkAvgC31 * weight;
  if (networkC31Credit === 0) return 0;

  const rawResult =
    (minerC31Credit / networkC31Credit) * COINS_PER_BLOCK * 60 * 24;
  return parseFloat(rawResult.toFixed(9));
}





function base32DecodeToBytes(input: string): Uint8Array {
  // Tells hi-base32 to return an array of numbers
  const result = base32Decode(input, true);

  // Now we check at runtime
  if (typeof result === "string") {
    // If it's unexpectedly a string, throw or handle it
    throw new Error("Base32 decoding returned a string, expected an array.");
  }

  // If it’s an array, wrap in Uint8Array
  return new Uint8Array(result);
}

/**
 * Logs + returns true if:
 *  - pubKeyBase32 has length 56
 *  - Characters match [a-z2-7] (case-insensitive)
 *  - Base32 decode => 35 bytes
 */
export function isBasicTorPubKey(pubKeyBase32: string): boolean {
  console.log("[TorCheck] Input:", pubKeyBase32);

  // 1) Must be 56 chars, all in [a-z2-7]
  console.log("[TorCheck] Checking length + [a-z2-7]...");
  if (pubKeyBase32.length !== 56) {
    console.log("[TorCheck] Fail => length != 56. Actual:", pubKeyBase32.length);
    return false;
  }
  if (!/^[a-z2-7]+$/i.test(pubKeyBase32)) {
    console.log("[TorCheck] Fail => invalid chars (only [a-z2-7] allowed)");
    return false;
  }
  console.log("[TorCheck] Pass => length=56 + valid chars");

  // 2) Base32 decode => must produce 35 bytes
  console.log("[TorCheck] Decoding base32...");
  try {
    // asBytes=true => should return a number[]
    const result = base32Decode(pubKeyBase32.toUpperCase(), true);

    console.log("[TorCheck] Decoded array length:", result.length);

    if (result.length !== 35) {
      console.log("[TorCheck] Fail => length != 35. Actual:", result.length);
      return false;
    }
    console.log("[TorCheck] Pass => decode => 35 bytes");
  } catch (err) {
    console.log("[TorCheck] Fail => base32 decode threw error:", err);
    return false;
  }

  // If we get here, it means all checks passed
  console.log("[TorCheck] All checks passed => returning true");
  return true;
}



export function getLastNBlocksAvgC31Gps(rigBlocks: any[], n: number): number {
  const sliceStart = Math.max(0, rigBlocks.length - n);
  const lastN = rigBlocks.slice(sliceStart);

  let sumGps = 0;
  let count = 0;

  for (const block of lastN) {
    // c31 entry => block.gps might be array with { edge_bits: 31, gps: number }
    const c31Entry = block.gps?.find((g: any) => g.edge_bits === 31);
    if (c31Entry) {
      sumGps += c31Entry.gps;
      count++;
    }
  }

  return count > 0 ? sumGps / count : 0;
}
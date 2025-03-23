export interface MinerBlockShare {
  timestamp: number; 
  name: any;   // in seconds
  height: number;
  valid_shares: number;
  invalid_shares: number; // or "reject" shares
  stale_shares: number;
}

export interface RigInfoCardProps {
  rigNames: string[];
  selectedRig: string;
  onRigChange: (rigName: string) => void;

  // Optional ephemeral stats to display
  currentGraphRate?: string;   // e.g. "5.30 gps"
  chainHeight?: number;        // e.g. 2787921
  rig240BlockAvg?: string;     // e.g. "4.96 gps"
  rig1440BlockAvg?: string;    // e.g. "2.08 gps"
  dailyEarnings?: string;      // e.g. "0.045 MWC"
}


export interface GpsEntry {
  gps: number;
  edge_bits: number;
}

export interface MinerBlockHashrate {
  id: number;
  timestamp: number;
  height: number;
  gps: GpsEntry[];
}


export interface BlockData {
  height: number;
  timestamp?: number;
  shares?: number;
  gps?: GpsEntry[];
  [key: string]: any; // e.g. worker fields
}



export interface BlocksByHeight {
  [height: number]: {
    timestamp?: number;
    difficulty?: number;
    secondary_scaling?: number;
  };
}


export interface MinerBlock {
  id: number;
  timestamp: number;
  height: number;
  valid_shares: number;
  invalid_shares: number;
  stale_shares: number;
  total_valid_shares: number;
  total_invalid_shares: number;
  total_stale_shares: number;
  dirty: number;
  user_id: number;
  gps: Array<{
    edge_bits: number;
    gps: number;
  }>;
  mwc_stats_id: number | null;
  pool_stats_id: number | null;
  worker_stats_id: number;
}

export interface RigGpsData {
  c31: any[]; // adapt as needed
}

export interface RigShareData {
  [blockKey: string]: any;
}

export interface MinerShareData {
  [blockKey: string]: any;
}

export interface MinerPaymentData {
  [key: string]: any;
}

export interface LatestMinerPaymentData {
  [key: string]: any;
}
export interface BlockInfo {
  timestamp: number;
  difficulty: number;
  secondary_scaling: number;
}


export interface RigData {
  [rig: string]: WorkerData;
}


// Example shape for local rigGpsData:
export interface RigGpsDataEntry {
  height: number;
  timestamp: number;
  difficulty: number;
  secondary_scaling: number;
  Total: number;
  [workerKey: string]: number | string; // c31 or c32, etc.
}

/**
 * Statistics for a given algo (e.g., accepted, rejected, etc.).
 */
export interface AlgoStats {
  accepted: number;
  agent?: string;
  difficulty?: number;
  rejected?: number;
  stale?: number;
}



// Example types – adapt to your real API
export interface PoolBlock {
  height: number;
  hash?: string;
  timestamp?: number;
  edge_bits?: number;
  share_counts?: any;
  gps?: any,
  active_miners?: any;
  total_blocks_found?: any;
  state?: any;
  difficulty?: any;
}

// For the "poolBlocksMined" logic
export interface BlocksMinedData {
  c31: number[];
  orphaned: number[];
  c31BlocksWithTimestamps: Record<number, { height: number; timestamp: number }>;
}


export interface NetworkBlock {
  height: number;
  timestamp?: number;
  gps?: any;
  difficulty?: number;
  secondary_scaling?: number;
}


export interface NetworkState {
  historical: NetworkBlock[];
  blocksByHeight: BlocksByHeight;
}

export interface NetworkRecentBlock {
  height: number;
  timestamp: number;
}

export interface MinedBlockAlgos {
  c31: number[];
}


export type MinerPoolCreditStat = {
  height: number;
  minerC31: number;
  poolC31: number;
  secondary_scaling: number;
};


// Basic GPS shape
export interface GpsEntry {
  gps: number;
  edge_bits: number;
}


export interface RigDataMiner {
  [blockHeight: number]: {
    [rigName: string]: {
      [workerId: string]: {
        [algo: string]: {
          accepted?: number;
          rejected?: number;
        };
      };
    };
  };
}


// A RigBlock maps rig names to their data at a given block height
export interface RigBlocks {
  [rigName: string]: RigBlockData[];
}

// The flattened shape you want to produce for each block's data
export interface RigBlockData {
  id: number;
  timestamp: number;
  height: number;
  valid_shares: number;
  invalid_shares: number;
  stale_shares: number;
  gps: GpsEntry[];
}

// Basic GPS shape for the data
export interface GpsEntry {
  gps: number;
  edge_bits: number;
}

// The worker data could still be deeply nested, but it's now cleaner to manage
export interface WorkerData {
  [workerId: string]: WorkerAlgoData;
}

export interface WorkerAlgoData {
  accepted: number;
  stale: number;
  rejected: number;
}


/** Color palette for human sprites */
export interface HumanPalette {
  skin: string;
  hair: string;
  shirt: string;
  pants: string;
  shoes: string;
}

/** Color palette for robot sprites */
export interface RobotPalette {
  body: string;
  accent: string;
  eye: string;
  dark: string;
  highlight: string;
}

/** A character walking across the crosswalk */
export interface Walker {
  x: number;
  y: number;
  speed: number;
  direction: 1 | -1;
  paletteIndex: number;
  animFrame: number;
  animTimer: number;
  spriteFrames: HTMLCanvasElement[];
  lane: number;
}

/** Overall stats from x402scan API */
export interface OverallStats {
  total_transactions: number;
  total_amount: number;
  unique_buyers: number;
  unique_sellers: number;
  latest_block_timestamp: string;
}

/** A facilitator entry from x402scan API */
export interface Facilitator {
  facilitator_id: string;
  tx_count: number;
  total_amount: number;
  latest_block_timestamp: string;
  unique_buyers: number;
  unique_sellers: number;
  chains: string[];
  facilitator: {
    id: string;
    name: string;
    image: string;
    docsUrl: string;
    color: string;
  };
}

/** Facilitators list response */
export interface FacilitatorsResponse {
  items: Facilitator[];
  total_count: number;
}

/** Application state */
export interface AppState {
  humanPerSecond: number;
  robotPerSecond: number;
  totalX402Transactions: number;
  totalX402Volume: number;
  uniqueBuyers: number;
  uniqueSellers: number;
  lastUpdated: Date | null;
  isLoading: boolean;
  error: string | null;
}

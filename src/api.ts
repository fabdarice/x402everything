import type { OverallStats, FacilitatorsResponse } from './types';

// Both dev (Vite proxy) and production (Vercel rewrites) proxy /api/trpc → x402scan.com
const X402_API_BASE = '/api/trpc';

/** Human payments baseline: ~2.5 billion/day */
export const HUMAN_PAYMENTS_PER_DAY = 2_500_000_000;
export const HUMAN_PAYMENTS_PER_SECOND = HUMAN_PAYMENTS_PER_DAY / 86400;
const SECONDS_PER_DAY = 86400;

/**
 * Fetch overall stats from x402scan (last 24h)
 */
export async function fetchOverallStats(timeframe = 1): Promise<OverallStats> {
  const input = encodeURIComponent(JSON.stringify({ json: { timeframe } }));
  const url = `${X402_API_BASE}/public.stats.overall?input=${input}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`x402scan API error: ${response.status}`);
  }

  const data = await response.json();
  const result = data?.result?.data?.json;
  if (!result || typeof result.total_transactions !== 'number') {
    throw new Error('Unexpected API response shape from x402scan stats');
  }
  return result;
}

/**
 * Fetch facilitator list from x402scan (last 24h)
 */
export async function fetchFacilitators(timeframe = 1): Promise<FacilitatorsResponse> {
  const input = encodeURIComponent(JSON.stringify({
    json: {
      pagination: { page_size: 10 },
      sorting: { id: 'tx_count', desc: true },
      timeframe,
    },
  }));
  const url = `${X402_API_BASE}/public.facilitators.list?input=${input}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`x402scan API error: ${response.status}`);
  }

  const data = await response.json();
  const result = data?.result?.data?.json;
  if (!result || !Array.isArray(result.items)) {
    throw new Error('Unexpected API response shape from x402scan facilitators');
  }
  return result;
}

/**
 * Convert daily transaction count to per-second rate
 */
export function toPerSecond(dailyCount: number): number {
  return dailyCount / SECONDS_PER_DAY;
}

/**
 * Format USDC amount from smallest units (6 decimals) to dollars
 */
export function formatUSDC(rawAmount: number): string {
  const dollars = rawAmount / 1_000_000;
  if (dollars >= 1_000_000) return `$${(dollars / 1_000_000).toFixed(2)}M`;
  if (dollars >= 1_000) return `$${(dollars / 1_000).toFixed(1)}K`;
  return `$${dollars.toFixed(2)}`;
}

/**
 * Format a large number with commas
 */
export function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return Math.round(n).toLocaleString('en-US');
  if (n >= 1) return Math.round(n).toString();
  return n.toFixed(2);
}

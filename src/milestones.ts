/**
 * Historical x402 transaction milestones
 * Update this file to track progress over time
 */

export interface Milestone {
  date: string;        // YYYY-MM format
  label: string;       // Display label
  avgDailyTx: number;  // Average daily transactions at that time
}

export const milestones: Milestone[] = [
  {
    date: '2025-05',
    label: 'May 2025 (Launch)',
    avgDailyTx: 20,
  },
  {
    date: '2025-08',
    label: 'Aug 2025 (6 months ago)',
    avgDailyTx: 500,
  },
  // Add new milestones here as x402 grows
  // {
  //   date: '2026-02',
  //   label: 'Feb 2026',
  //   avgDailyTx: 84000,
  // },
];

/**
 * Calculate growth multiplier between two values
 */
export function calculateGrowth(from: number, to: number): number {
  if (from <= 0) return 0;
  return to / from;
}

/**
 * Format growth as a string (e.g., "4,200x")
 */
export function formatGrowth(multiplier: number): string {
  if (multiplier >= 1000) {
    return `${(multiplier / 1000).toFixed(1)}K x`;
  }
  if (multiplier >= 10) {
    return `${Math.round(multiplier).toLocaleString()}x`;
  }
  return `${multiplier.toFixed(1)}x`;
}

import { CrosswalkRenderer } from './crosswalk';
import {
  fetchOverallStats,
  toPerSecond,
  formatUSDC,
  formatNumber,
  HUMAN_PAYMENTS_PER_SECOND,
} from './api';
// Growth section hidden for now - uncomment to re-enable
// import { milestones, calculateGrowth, formatGrowth } from './milestones';
import type { AppState } from './types';
import './style.css';

// --- State ---
const state: AppState = {
  humanPerSecond: HUMAN_PAYMENTS_PER_SECOND,
  robotPerSecond: 0,
  totalX402Transactions: 0,
  totalX402Volume: 0,
  uniqueBuyers: 0,
  uniqueSellers: 0,
  lastUpdated: null,
  isLoading: true,
  error: null,
};

// --- DOM references ---
const $ = (id: string) => document.getElementById(id)!;

let humanCrosswalk: CrosswalkRenderer;
let robotCrosswalk: CrosswalkRenderer;

// --- Animated counter state ---
const counterState = {
  humanCounter: 0,
  robotCounter: 0,
  lastCounterTime: 0,
};

// --- Format per-second for display ---
function formatPerSecond(n: number, round = false): string {
  if (n >= 10000) return `~${formatNumber(n)}`;
  if (n >= 1) return round ? Math.round(n).toString() : n.toFixed(1);
  return n.toFixed(2);
}

// --- Update DOM with current state ---
function updateDOM(): void {
  // Per-second rates
  $('human-rate').textContent = `${formatPerSecond(state.humanPerSecond, true)} payments/sec`;
  $('robot-rate').textContent = `${formatPerSecond(state.robotPerSecond)} payments/sec`;

  // Stats bar
  $('stat-transactions').textContent = formatNumber(state.totalX402Transactions);
  $('stat-volume').textContent = formatUSDC(state.totalX402Volume);
  $('stat-buyers').textContent = Math.floor(state.uniqueBuyers).toLocaleString();
  $('stat-sellers').textContent = Math.floor(state.uniqueSellers).toLocaleString();



  // Ratio
  if (state.robotPerSecond > 0) {
    const ratio = Math.round(state.humanPerSecond / state.robotPerSecond);
    $('ratio-number').textContent = ratio.toLocaleString('en-US');
  } else if (!state.isLoading) {
    $('ratio-number').textContent = 'N/A (no x402 data yet)';
  }

  // Loading overlay: use fade-out class so the opacity transition works,
  // then fully hide after the transition completes
  const overlay = $('loading-overlay');
  if (!state.isLoading && !overlay.classList.contains('fade-out')) {
    overlay.classList.add('fade-out');
    overlay.addEventListener('transitionend', () => {
      overlay.classList.add('hidden');
    }, { once: true });
  }
  const errorEl = $('error-banner');
  if (state.error) {
    errorEl.textContent = state.error;
    errorEl.classList.remove('hidden');
  } else {
    errorEl.classList.add('hidden');
  }
}

// --- Animated live counters ---
function updateCounters(timestamp: number): void {
  if (!counterState.lastCounterTime) counterState.lastCounterTime = timestamp;
  const dt = (timestamp - counterState.lastCounterTime) / 1000;
  counterState.lastCounterTime = timestamp;

  counterState.humanCounter += state.humanPerSecond * dt;
  counterState.robotCounter += state.robotPerSecond * dt;

  $('human-counter').textContent = Math.floor(counterState.humanCounter).toLocaleString('en-US');
  $('robot-counter').textContent = Math.floor(counterState.robotCounter).toLocaleString('en-US');

  requestAnimationFrame(updateCounters);
}

// --- Fetch data from x402scan ---
async function fetchData(): Promise<void> {
  try {
    const stats = await fetchOverallStats();

    state.totalX402Transactions = stats.total_transactions;
    state.totalX402Volume = stats.total_amount;
    state.uniqueBuyers = stats.unique_buyers;
    state.uniqueSellers = stats.unique_sellers;
    state.robotPerSecond = toPerSecond(stats.total_transactions);
    state.lastUpdated = new Date();
    state.isLoading = false;
    state.error = null;

    // Update crosswalk renderer
    if (robotCrosswalk) {
      robotCrosswalk.setPerSecond(state.robotPerSecond);
    }

    updateDOM();
  } catch (err) {
    console.error('Failed to fetch x402 data:', err);
    state.error = 'Failed to fetch live data. Retrying...';
    state.isLoading = false;
    updateDOM();
  }
}

// --- Build HTML ---
function buildPage(): void {
  document.body.innerHTML = `
    <div id="app">
      <header>
        <h1>x402<span class="accent">Everything</span></h1>
        <p class="tagline">Autonomous agents deserve autonomous payments</p>
      </header>

      <div id="error-banner" class="hidden"></div>
      <div id="loading-overlay">
        <div class="loader"></div>
        <p>Fetching live x402 data...</p>
      </div>

      <div class="crosswalk-container">
        <div class="lane" id="human-lane">
          <div class="lane-header">
            <span class="lane-icon">&#x1F6B6;</span>
            <span class="lane-title">Human Payments</span>
          </div>
          <div class="canvas-wrapper">
            <canvas id="human-canvas"></canvas>
          </div>
          <div class="lane-stats">
            <div class="rate-display" id="human-rate">Loading...</div>
            <div class="counter-label">Payments since you opened this page</div>
            <div class="live-counter" id="human-counter">0</div>
          </div>
        </div>

        <div class="lane" id="robot-lane">
          <div class="lane-header">
            <span class="lane-icon">&#x1F916;</span>
            <span class="lane-title">Agentic Payments</span>
          </div>
          <div class="canvas-wrapper">
            <canvas id="robot-canvas"></canvas>
          </div>
          <div class="lane-stats">
            <div class="rate-display robot-glow" id="robot-rate">Loading...</div>
            <div class="counter-label">Payments since you opened this page</div>
            <div class="live-counter robot-glow" id="robot-counter">0</div>
          </div>
        </div>
      </div>

      <div class="stats-bar">
        <div class="stat-item">
          <div class="stat-value" id="stat-transactions">—</div>
          <div class="stat-label">x402 Txs (24h)</div>
        </div>
        <div class="stat-item">
          <div class="stat-value" id="stat-volume">—</div>
          <div class="stat-label">Volume (24h)</div>
        </div>
        <div class="stat-item-group">
          <div class="stat-item">
            <div class="stat-value" id="stat-buyers">—</div>
            <div class="stat-label">Buyers</div>
          </div>
          <div class="stat-item">
            <div class="stat-value" id="stat-sellers">—</div>
            <div class="stat-label">Sellers</div>
          </div>
        </div>
      </div>

      <div class="ratio-bar">
        <p>For every <strong class="robot-glow">1 agentic payment</strong>, there are approximately
        <strong class="human-highlight" id="ratio-number">—</strong> human payments</p>
      </div>

      <footer>
        <p class="built-by">
          Data from <a href="https://www.x402scan.com" target="_blank" rel="noopener">x402scan.com</a> | 
          Powered by the <a href="https://www.x402.org" target="_blank" rel="noopener">x402 protocol</a> | 
          Built by <a href="https://x.com/fabdarice" target="_blank" rel="noopener">fabda</a>
        </p>
      </footer>
    </div>
  `;
}

// --- Initialize ---
async function init(): Promise<void> {
  buildPage();

  // Create crosswalk renderers
  humanCrosswalk = new CrosswalkRenderer({
    canvas: document.getElementById('human-canvas') as HTMLCanvasElement,
    type: 'human',
    perSecond: state.humanPerSecond,
  });

  robotCrosswalk = new CrosswalkRenderer({
    canvas: document.getElementById('robot-canvas') as HTMLCanvasElement,
    type: 'robot',
    perSecond: 0.5, // Start with a low rate until data loads
  });

  // Start animations
  humanCrosswalk.start();
  robotCrosswalk.start();

  // Start live counters
  requestAnimationFrame(updateCounters);

  // Fetch data immediately
  await fetchData();

  // Poll every 5 minutes
  setInterval(() => fetchData(), 5 * 60 * 1000);
}

// Go!
init();

import type { Walker } from './types';
import { createSpriteSheet, HUMAN_PALETTES, ROBOT_PALETTES, SPRITE_WIDTH, SPRITE_HEIGHT } from './sprites';

// Tiny sprites for humans (1x scale = 16x24 px), cute baby robots (2x = 32x48)
const HUMAN_SCALE = 1;
const ROBOT_SCALE = 2;
const HUMAN_CHAR_W = SPRITE_WIDTH * HUMAN_SCALE;  // 16px
const HUMAN_CHAR_H = SPRITE_HEIGHT * HUMAN_SCALE; // 24px
const ROBOT_CHAR_W = SPRITE_WIDTH * ROBOT_SCALE;  // 32px
const ROBOT_CHAR_H = SPRITE_HEIGHT * ROBOT_SCALE; // 48px
const ANIM_FRAME_MS = 150;

// Crosswalk visual constants
const ROAD_COLOR = '#0D1117';
const STRIPE_COLOR = '#FFFFFF';
const STRIPE_GLOW = 'rgba(255, 255, 255, 0.15)';
const SIDEWALK_COLOR = '#1A1F2B';
const SIDEWALK_EDGE = '#2D3548';
const LANE_DIVIDER = '#2A2A3A';

// How many stripes on the zebra crossing
const STRIPE_COUNT = 6;
const STRIPE_HEIGHT = 4;
const STRIPE_GAP = 8;

interface CrosswalkConfig {
  canvas: HTMLCanvasElement;
  type: 'human' | 'robot';
  perSecond: number;
}

export class CrosswalkRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private type: 'human' | 'robot';
  private walkers: Walker[] = [];
  private perSecond: number;
  private spawnAccumulator = 0;
  private lastTime = 0;
  private animationId = 0;
  private spriteCache: Map<string, HTMLCanvasElement[]> = new Map();
  private scale: number;
  private charW: number;
  private charH: number;

  // Layout zones (computed on resize)
  private topSidewalkEnd = 0;
  private crosswalkStart = 0;
  private crosswalkEnd = 0;
  private bottomSidewalkStart = 0;

  constructor(config: CrosswalkConfig) {
    this.canvas = config.canvas;
    this.ctx = this.canvas.getContext('2d')!;
    this.type = config.type;
    this.perSecond = config.perSecond;
    
    // Different scales for humans vs robots
    this.scale = this.type === 'human' ? HUMAN_SCALE : ROBOT_SCALE;
    this.charW = this.type === 'human' ? HUMAN_CHAR_W : ROBOT_CHAR_W;
    this.charH = this.type === 'human' ? HUMAN_CHAR_H : ROBOT_CHAR_H;

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  /** Update the per-second rate (called when new API data arrives) */
  setPerSecond(rate: number): void {
    this.perSecond = rate;
  }

  /** Resize canvas to match container */
  resize(): void {
    const rect = this.canvas.parentElement!.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Recompute layout
    const h = rect.height;
    this.topSidewalkEnd = h * 0.08;
    this.crosswalkStart = h * 0.10;
    this.crosswalkEnd = h * 0.90;
    this.bottomSidewalkStart = h * 0.92;
  }

  /** Get or create cached sprite sheet */
  private getSprites(paletteIndex: number): HTMLCanvasElement[] {
    const key = `${this.type}-${paletteIndex}`;
    if (!this.spriteCache.has(key)) {
      this.spriteCache.set(key, createSpriteSheet(this.type, paletteIndex, this.scale));
    }
    return this.spriteCache.get(key)!;
  }

  /** Spawn a new walker at a random Y position within the crosswalk */
  private spawnWalker(startX?: number): void {
    const paletteCount = this.type === 'human' ? HUMAN_PALETTES.length : ROBOT_PALETTES.length;
    const paletteIndex = Math.floor(Math.random() * paletteCount);
    const direction: 1 | -1 = 1; // All go left to right
    
    // Random Y position within the crosswalk area
    const yRange = this.crosswalkEnd - this.crosswalkStart - this.charH;
    const y = this.crosswalkStart + Math.random() * yRange;
    
    // Humans move slower to pack more densely on screen
    const baseSpeed = this.type === 'human' ? 30 : 40;
    const speed = baseSpeed + Math.random() * 20;

    // If startX provided, use it (for pre-population), otherwise start off-screen left
    const x = startX !== undefined ? startX : -this.charW;

    const walker: Walker = {
      x,
      y,
      speed,
      direction,
      paletteIndex,
      animFrame: Math.floor(Math.random() * 3), // Random starting frame
      animTimer: Math.random() * ANIM_FRAME_MS,
      spriteFrames: this.getSprites(paletteIndex),
      lane: 0,
    };

    this.walkers.push(walker);
  }

  /** Pre-populate the screen with walkers already spread across (for humans only) */
  private prePopulate(): void {
    if (this.type !== 'human') return;
    
    const w = this.canvas.width / (window.devicePixelRatio || 1);
    // Fill the entire screen width with walkers at random X positions
    // Spawn enough to densely pack the screen
    const density = 3000; // Number of walkers to pre-spawn
    for (let i = 0; i < density; i++) {
      const x = Math.random() * (w + this.charW) - this.charW;
      this.spawnWalker(x);
    }
  }

  /** Draw the road, sidewalks, and zebra stripes */
  private drawBackground(): void {
    const w = this.canvas.width / (window.devicePixelRatio || 1);
    const h = this.canvas.height / (window.devicePixelRatio || 1);
    const ctx = this.ctx;

    // Road
    ctx.fillStyle = ROAD_COLOR;
    ctx.fillRect(0, 0, w, h);

    // Top sidewalk
    ctx.fillStyle = SIDEWALK_COLOR;
    ctx.fillRect(0, 0, w, this.topSidewalkEnd);
    ctx.fillStyle = SIDEWALK_EDGE;
    ctx.fillRect(0, this.topSidewalkEnd - 2, w, 3);

    // Bottom sidewalk
    ctx.fillStyle = SIDEWALK_COLOR;
    ctx.fillRect(0, this.bottomSidewalkStart, w, h - this.bottomSidewalkStart);
    ctx.fillStyle = SIDEWALK_EDGE;
    ctx.fillRect(0, this.bottomSidewalkStart, w, 3);

    // Zebra crossing stripes (horizontal bands across the road)
    const crosswalkH = this.crosswalkEnd - this.crosswalkStart;
    const totalStripeH = STRIPE_COUNT * STRIPE_HEIGHT + (STRIPE_COUNT - 1) * STRIPE_GAP;
    const startY = this.crosswalkStart + (crosswalkH - totalStripeH) / 2;

    for (let i = 0; i < STRIPE_COUNT; i++) {
      const sy = startY + i * (STRIPE_HEIGHT + STRIPE_GAP);

      // Glow effect
      ctx.fillStyle = STRIPE_GLOW;
      ctx.fillRect(0, sy - 2, w, STRIPE_HEIGHT + 4);

      // Stripe
      ctx.fillStyle = STRIPE_COLOR;
      ctx.globalAlpha = 0.2;
      ctx.fillRect(0, sy, w, STRIPE_HEIGHT);
      ctx.globalAlpha = 1;
    }

    // Subtle lane divider lines on road edges
    ctx.fillStyle = LANE_DIVIDER;
    ctx.fillRect(0, this.crosswalkStart - 1, w, 1);
    ctx.fillRect(0, this.crosswalkEnd, w, 1);
  }

  /** Main animation frame */
  private update(timestamp: number): void {
    if (!this.lastTime) this.lastTime = timestamp;
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;

    const w = this.canvas.width / (window.devicePixelRatio || 1);

    // --- Spawn logic ---
    // Humans: FLOOD the screen - keep it completely packed at all times
    // Robots: sparse, ~1 per second
    let effectiveSpawnRate: number;
    let maxWalkers: number;
    
    if (this.type === 'human') {
      // Spawn as fast as possible to keep screen PACKED
      // With tiny 16px wide sprites, we need ~1000+ on screen to fill it
      // Spawn rate of 1000/sec ensures constant flooding
      effectiveSpawnRate = 1000;
      maxWalkers = 4000; // Allow tons of tiny humans
    } else {
      // Robots: spawn at actual rate (~1/sec), each one visible and notable
      effectiveSpawnRate = Math.max(this.perSecond, 0.5);
      maxWalkers = 20;
    }

    this.spawnAccumulator += dt * effectiveSpawnRate;
    while (this.spawnAccumulator >= 1 && this.walkers.length < maxWalkers) {
      this.spawnWalker();
      this.spawnAccumulator -= 1;
    }
    if (this.walkers.length >= maxWalkers) {
      this.spawnAccumulator = 0;
    }

    // --- Update walkers ---
    for (const walker of this.walkers) {
      walker.x += walker.speed * walker.direction * dt;
      walker.animTimer += dt * 1000;
      if (walker.animTimer >= ANIM_FRAME_MS) {
        walker.animTimer -= ANIM_FRAME_MS;
        walker.animFrame = (walker.animFrame + 1) % 3;
      }
    }

    // Remove off-screen walkers
    this.walkers = this.walkers.filter(
      (walker) => walker.x < w + this.charW * 2
    );

    // --- Draw ---
    this.drawBackground();

    // Sort walkers by Y for depth ordering
    this.walkers.sort((a, b) => a.y - b.y);

    for (const walker of this.walkers) {
      const frameIdx = walker.animFrame * 2 + (walker.direction === -1 ? 1 : 0);
      const sprite = walker.spriteFrames[frameIdx];
      if (sprite) {
        this.ctx.drawImage(sprite, walker.x, walker.y, this.charW, this.charH);
      }
    }

    this.animationId = requestAnimationFrame((t) => this.update(t));
  }

  /** Start the animation loop */
  start(): void {
    this.lastTime = 0;
    this.prePopulate(); // Fill screen with walkers immediately (humans only)
    this.animationId = requestAnimationFrame((t) => this.update(t));
  }

  /** Stop the animation loop */
  stop(): void {
    cancelAnimationFrame(this.animationId);
  }
}

import type { HumanPalette, RobotPalette } from './types';

/** Color palettes for human character variety */
export const HUMAN_PALETTES: HumanPalette[] = [
  { skin: '#FFD5B8', hair: '#4A3728', shirt: '#3B82F6', pants: '#1E3A5F', shoes: '#2D2D2D' },
  { skin: '#C68642', hair: '#1A1A1A', shirt: '#EF4444', pants: '#374151', shoes: '#1A1A1A' },
  { skin: '#FFDBAC', hair: '#D4A574', shirt: '#10B981', pants: '#1F2937', shoes: '#4A3728' },
  { skin: '#8D5524', hair: '#1A1A1A', shirt: '#F59E0B', pants: '#1E293B', shoes: '#2D2D2D' },
  { skin: '#FFE0BD', hair: '#8B4513', shirt: '#8B5CF6', pants: '#334155', shoes: '#1A1A1A' },
  { skin: '#F1C27D', hair: '#2C1810', shirt: '#EC4899', pants: '#1E293B', shoes: '#3D2B1F' },
  { skin: '#FFCD94', hair: '#654321', shirt: '#06B6D4', pants: '#374151', shoes: '#2D2D2D' },
  { skin: '#E0AC69', hair: '#1A1A1A', shirt: '#F97316', pants: '#1F2937', shoes: '#1A1A1A' },
];

/** Color palettes for robot characters */
export const ROBOT_PALETTES: RobotPalette[] = [
  { body: '#A8B8C8', accent: '#00FF88', eye: '#00FF88', dark: '#6B7B8B', highlight: '#C8D8E8' },
  { body: '#B0C4DE', accent: '#00BFFF', eye: '#00BFFF', dark: '#708090', highlight: '#D6E8F0' },
  { body: '#A0A0B0', accent: '#FF6B00', eye: '#FF6B00', dark: '#606070', highlight: '#C0C0D0' },
  { body: '#90A8C0', accent: '#FFD700', eye: '#FFD700', dark: '#5A7090', highlight: '#B0C8E0' },
];

const SPRITE_W = 16;
const SPRITE_H = 24;

type PixelGrid = (string | null)[][];

function createGrid(): PixelGrid {
  return Array.from({ length: SPRITE_H }, () => Array<string | null>(SPRITE_W).fill(null));
}

function set(grid: PixelGrid, x: number, y: number, color: string): void {
  if (x >= 0 && x < SPRITE_W && y >= 0 && y < SPRITE_H) {
    grid[y][x] = color;
  }
}

function fillRow(grid: PixelGrid, y: number, x1: number, x2: number, color: string): void {
  for (let x = x1; x <= x2; x++) set(grid, x, y, color);
}

/** Generate a human sprite for a given animation frame (0=stand, 1=step left, 2=step right) */
function generateHumanFrame(palette: HumanPalette, frame: number): PixelGrid {
  const { skin, hair, shirt, pants, shoes } = palette;
  const g = createGrid();

  // Hair top
  fillRow(g, 0, 5, 10, hair);
  fillRow(g, 1, 4, 11, hair);

  // Head with hair side
  for (let x = 4; x <= 11; x++) set(g, x, 2, x <= 5 ? hair : skin);
  for (let x = 4; x <= 11; x++) set(g, x, 3, x <= 4 ? hair : skin);
  set(g, 7, 3, '#1A1A1A'); // left eye
  set(g, 9, 3, '#1A1A1A'); // right eye
  fillRow(g, 4, 5, 10, skin);
  fillRow(g, 5, 6, 9, skin);

  // Neck
  set(g, 7, 6, skin);
  set(g, 8, 6, skin);

  // Torso (shirt)
  for (let y = 7; y <= 13; y++) {
    const half = y <= 8 ? 2 : 3;
    fillRow(g, y, 6 - half + 2, 9 + half - 2, shirt);
  }

  // Arms (swing based on frame)
  if (frame === 0) {
    for (let y = 8; y <= 13; y++) { set(g, 4, y, skin); set(g, 11, y, skin); }
  } else if (frame === 1) {
    // Left forward, right back
    set(g, 4, 7, skin); set(g, 3, 8, skin); set(g, 3, 9, skin); set(g, 4, 10, skin);
    set(g, 11, 9, skin); set(g, 12, 10, skin); set(g, 12, 11, skin); set(g, 11, 12, skin);
  } else {
    // Right forward, left back
    set(g, 11, 7, skin); set(g, 12, 8, skin); set(g, 12, 9, skin); set(g, 11, 10, skin);
    set(g, 4, 9, skin); set(g, 3, 10, skin); set(g, 3, 11, skin); set(g, 4, 12, skin);
  }

  // Pants
  for (let y = 14; y <= 18; y++) {
    if (frame === 0 || y <= 16) {
      fillRow(g, y, 5, 10, pants);
    } else if (frame === 1) {
      const offset = 18 - y;
      set(g, 4 + offset, y, pants); set(g, 5 + offset, y, pants);
      set(g, 10 - offset, y, pants); set(g, 11 - offset, y, pants);
    } else {
      const offset = 18 - y;
      set(g, 10 - offset, y, pants); set(g, 11 - offset, y, pants);
      set(g, 4 + offset, y, pants); set(g, 5 + offset, y, pants);
    }
  }

  // Shoes
  if (frame === 0) {
    fillRow(g, 19, 5, 7, shoes); fillRow(g, 20, 5, 7, shoes);
    fillRow(g, 19, 8, 10, shoes); fillRow(g, 20, 8, 10, shoes);
  } else if (frame === 1) {
    fillRow(g, 19, 3, 6, shoes); fillRow(g, 20, 3, 6, shoes);
    fillRow(g, 19, 9, 12, shoes); fillRow(g, 20, 9, 12, shoes);
  } else {
    fillRow(g, 19, 9, 12, shoes); fillRow(g, 20, 9, 12, shoes);
    fillRow(g, 19, 3, 6, shoes); fillRow(g, 20, 3, 6, shoes);
  }

  return g;
}

/** Generate a CUTE BABY ROBOT sprite - big round head, big eyes, tiny body */
function generateRobotFrame(palette: RobotPalette, frame: number): PixelGrid {
  const { body, accent, eye, dark, highlight } = palette;
  const g = createGrid();

  // Antenna with cute bobble
  set(g, 7, 0, accent); set(g, 8, 0, accent);
  set(g, 7, 1, accent); set(g, 8, 1, accent);
  set(g, 7, 2, dark); set(g, 8, 2, dark);

  // BIG ROUND HEAD (rows 3-11) - baby proportions!
  // Top of head curve
  fillRow(g, 3, 5, 10, highlight);
  fillRow(g, 4, 3, 12, highlight);
  // Head sides
  for (let y = 5; y <= 9; y++) {
    set(g, 2, y, dark);
    set(g, 3, y, body);
    fillRow(g, y, 4, 11, body);
    set(g, 12, y, body);
    set(g, 13, y, dark);
  }
  // Bottom of head curve
  fillRow(g, 10, 3, 12, body);
  set(g, 2, 10, dark); set(g, 13, 10, dark);
  fillRow(g, 11, 4, 11, dark);

  // BIG CUTE EYES (larger, rounder)
  // Left eye
  set(g, 4, 6, dark); set(g, 5, 6, eye); set(g, 6, 6, eye); set(g, 7, 6, dark);
  set(g, 4, 7, eye); set(g, 5, 7, '#FFFFFF'); set(g, 6, 7, eye); set(g, 7, 7, eye);
  set(g, 4, 8, dark); set(g, 5, 8, eye); set(g, 6, 8, eye); set(g, 7, 8, dark);
  // Right eye
  set(g, 8, 6, dark); set(g, 9, 6, eye); set(g, 10, 6, eye); set(g, 11, 6, dark);
  set(g, 8, 7, eye); set(g, 9, 7, eye); set(g, 10, 7, '#FFFFFF'); set(g, 11, 7, eye);
  set(g, 8, 8, dark); set(g, 9, 8, eye); set(g, 10, 8, eye); set(g, 11, 8, dark);

  // Cute little smile
  set(g, 6, 9, dark); set(g, 7, 10, dark); set(g, 8, 10, dark); set(g, 9, 9, dark);

  // Rosy cheeks
  set(g, 3, 8, '#FF9999'); set(g, 12, 8, '#FF9999');

  // TINY BODY (rows 12-16) - baby proportions!
  fillRow(g, 12, 6, 9, body);
  for (let y = 13; y <= 16; y++) {
    set(g, 5, y, dark);
    fillRow(g, y, 6, 9, body);
    set(g, 10, y, dark);
  }
  // Belly button / power core
  set(g, 7, 14, accent); set(g, 8, 14, accent);

  // STUBBY ARMS
  if (frame === 0) {
    set(g, 4, 13, body); set(g, 4, 14, body); set(g, 4, 15, highlight);
    set(g, 11, 13, body); set(g, 11, 14, body); set(g, 11, 15, highlight);
  } else if (frame === 1) {
    set(g, 3, 12, body); set(g, 3, 13, body); set(g, 4, 14, highlight);
    set(g, 11, 14, body); set(g, 12, 15, body); set(g, 12, 16, highlight);
  } else {
    set(g, 11, 12, body); set(g, 12, 13, body); set(g, 12, 14, highlight);
    set(g, 4, 14, body); set(g, 3, 15, body); set(g, 3, 16, highlight);
  }

  // STUBBY LEGS
  if (frame === 0) {
    fillRow(g, 17, 5, 6, body); fillRow(g, 17, 9, 10, body);
    fillRow(g, 18, 5, 6, body); fillRow(g, 18, 9, 10, body);
    fillRow(g, 19, 4, 6, dark); fillRow(g, 19, 9, 11, dark);
  } else if (frame === 1) {
    fillRow(g, 17, 4, 5, body); fillRow(g, 17, 10, 11, body);
    fillRow(g, 18, 3, 5, body); fillRow(g, 18, 10, 12, body);
    fillRow(g, 19, 2, 5, dark); fillRow(g, 19, 10, 13, dark);
  } else {
    fillRow(g, 17, 10, 11, body); fillRow(g, 17, 4, 5, body);
    fillRow(g, 18, 10, 12, body); fillRow(g, 18, 3, 5, body);
    fillRow(g, 19, 10, 13, dark); fillRow(g, 19, 2, 5, dark);
  }

  // Foot glow
  if (frame === 1) { set(g, 3, 20, accent); set(g, 4, 20, accent); }
  if (frame === 2) { set(g, 11, 20, accent); set(g, 12, 20, accent); }

  return g;
}

/** Render a pixel grid onto a canvas context */
function renderPixelGrid(
  ctx: CanvasRenderingContext2D,
  grid: PixelGrid,
  offsetX: number,
  offsetY: number,
  scale: number,
  flipX: boolean,
): void {
  for (let py = 0; py < grid.length; py++) {
    for (let px = 0; px < grid[py].length; px++) {
      const color = grid[py][px];
      if (color) {
        ctx.fillStyle = color;
        const drawX = flipX
          ? offsetX + (SPRITE_W - 1 - px) * scale
          : offsetX + px * scale;
        ctx.fillRect(drawX, offsetY + py * scale, scale, scale);
      }
    }
  }
}

/**
 * Pre-render a full sprite sheet: 3 frames x 2 directions = 6 canvases
 * Index: [frame0-right, frame0-left, frame1-right, frame1-left, frame2-right, frame2-left]
 */
export function createSpriteSheet(
  type: 'human' | 'robot',
  paletteIndex: number,
  scale: number,
): HTMLCanvasElement[] {
  const palettes = type === 'human' ? HUMAN_PALETTES : ROBOT_PALETTES;
  const palette = palettes[paletteIndex % palettes.length];
  const generator = type === 'human' ? generateHumanFrame : generateRobotFrame;
  const frames: HTMLCanvasElement[] = [];

  for (let frame = 0; frame < 3; frame++) {
    const grid = generator(palette as HumanPalette & RobotPalette, frame);

    // Right-facing
    const rightCanvas = document.createElement('canvas');
    rightCanvas.width = SPRITE_W * scale;
    rightCanvas.height = SPRITE_H * scale;
    const rightCtx = rightCanvas.getContext('2d')!;
    renderPixelGrid(rightCtx, grid, 0, 0, scale, false);
    frames.push(rightCanvas);

    // Left-facing (flipped)
    const leftCanvas = document.createElement('canvas');
    leftCanvas.width = SPRITE_W * scale;
    leftCanvas.height = SPRITE_H * scale;
    const leftCtx = leftCanvas.getContext('2d')!;
    renderPixelGrid(leftCtx, grid, 0, 0, scale, true);
    frames.push(leftCanvas);
  }

  return frames;
}

export const SPRITE_WIDTH = SPRITE_W;
export const SPRITE_HEIGHT = SPRITE_H;

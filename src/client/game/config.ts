export const GAME_CONFIG = {
  // Canvas dimensions
  WIDTH: 600,
  HEIGHT: 800,

  // Lane configuration
  LANES: 3,
  LANE_WIDTH: 100,
  LANE_Y_BOTTOM: 700,
  LANE_Y_TOP: 220,
  VANISHING_POINT_X: 300,

  // Player
  PLAYER_Y: 650,
  PLAYER_WIDTH: 38,
  PLAYER_HEIGHT: 60,
  LANE_SWITCH_SPEED: 0.25,

  // Speed settings - SLOW start, gradual ramp
  INITIAL_SPEED: 2.8,
  MAX_SPEED: 7,
  SPEED_INCREASE_RATE: 0.02,

  // Spawning
  INITIAL_SPAWN_INTERVAL: 1.4,
  MIN_SPAWN_INTERVAL: 0.55,
  COIN_SPAWN_INTERVAL: 0.8,

  // Scoring
  SCORE_PER_SECOND: 8,
  COIN_SCORE: 5,

  // Jump / Slide
  JUMP_DURATION: 0.5,
  SLIDE_DURATION: 0.55,

  // Road animation
  ROAD_LINE_COUNT: 8,
  ROAD_LINE_SPEED_MULT: 100,

  // Combo system
  COMBO_THRESHOLD: 5,
  MAX_MULTIPLIER: 5,

  // Colors - Lush Crystal Cavern: vibrant underground world
  COLORS: {
    // Background - deep teal/emerald cave sky
    BG_TOP: [15, 25, 40] as [number, number, number],
    BG_MID: [20, 35, 50] as [number, number, number],
    BG_BOTTOM: [25, 45, 55] as [number, number, number],

    // Track - dark stone with green tint
    TRACK_TOP: [30, 40, 38] as [number, number, number],
    TRACK_BOTTOM: [45, 55, 50] as [number, number, number],

    // Walls - emerald stone with depth
    WALL_DARK: [20, 40, 35] as [number, number, number],
    WALL_MID: [30, 55, 45] as [number, number, number],
    WALL_LIGHT: [40, 70, 55] as [number, number, number],
    WALL_ACCENT: [60, 180, 120] as [number, number, number],

    // Lane lines - bright cyan (high contrast against dark)
    LANE_LINE: [80, 220, 200] as [number, number, number],

    // Player - vibrant and eye-catching
    PLAYER_BODY: [50, 200, 220] as [number, number, number],
    PLAYER_HEAD: [230, 185, 155] as [number, number, number],
    PLAYER_HAIR: [255, 120, 40] as [number, number, number],
    PLAYER_LEGS: [40, 100, 180] as [number, number, number],
    PLAYER_EYES: [20, 20, 20] as [number, number, number],

    // Coins - BRIGHT saturated gold (maximum visibility)
    COIN: [255, 200, 0] as [number, number, number],
    COIN_DARK: [200, 150, 0] as [number, number, number],
    COIN_SHINE: [255, 255, 180] as [number, number, number],

    // Obstacles - three warm-glow hues by required action
    OBSTACLE_STONE: [220, 50, 60] as [number, number, number],      // RED = jump over (stone wall)
    OBSTACLE_STONE_DARK: [160, 30, 40] as [number, number, number],
    OBSTACLE_STONE_GLOW: [255, 80, 80] as [number, number, number],
    OBSTACLE_BEAM: [255, 170, 40] as [number, number, number],       // AMBER = slide under (low beam)
    OBSTACLE_BEAM_DARK: [180, 110, 20] as [number, number, number],
    OBSTACLE_BEAM_GLOW: [255, 200, 80] as [number, number, number],
    OBSTACLE_PILLAR: [200, 50, 180] as [number, number, number],     // MAGENTA = dodge sideways (pillar)
    OBSTACLE_PILLAR_GLOW: [255, 100, 220] as [number, number, number],
    OBSTACLE_STRIPE: [255, 200, 50] as [number, number, number],
    OBSTACLE_STRIPE_DARK: [200, 50, 180] as [number, number, number],

    // Torch/lighting
    TORCH_FLAME: [255, 160, 40] as [number, number, number],
    TORCH_GLOW: [255, 200, 80] as [number, number, number],
    TORCH_STICK: [120, 80, 40] as [number, number, number],

    // Crystal accents (scattered in walls)
    CRYSTAL_BLUE: [100, 180, 255] as [number, number, number],
    CRYSTAL_PURPLE: [160, 100, 255] as [number, number, number],
    CRYSTAL_GREEN: [80, 255, 160] as [number, number, number],

    // Particles / Effects
    PARTICLE_DUST: [80, 200, 160] as [number, number, number],
    PARTICLE_GOLD: [255, 220, 80] as [number, number, number],
    PARTICLE_STONE: [100, 90, 80] as [number, number, number],

    // Speed lines
    SPEED_LINE: [150, 220, 255] as [number, number, number],

    // UI - clean and bold
    TEXT_WHITE: [255, 255, 255] as [number, number, number],
    TEXT_GOLD: [255, 210, 0] as [number, number, number],
    COMBO_TEXT: [80, 255, 180] as [number, number, number],
    BUTTON_GREEN: [50, 200, 100] as [number, number, number],
    BUTTON_GREEN_DARK: [35, 150, 70] as [number, number, number],

    // === Polish tokens (added) ===
    // HUD chip backgrounds
    CHIP_BG: [0, 0, 0] as [number, number, number],
    // Player drop shadow / silhouettes
    SHADOW: [0, 0, 0] as [number, number, number],
    // Outline color (player + heart points)
    OUTLINE: [10, 12, 18] as [number, number, number],
    // Distant horizon silhouette band
    SILHOUETTE: [10, 18, 12] as [number, number, number],
    // Heart (lives)
    HEART: [220, 50, 60] as [number, number, number],
    // Coin star + ring effect
    COIN_STAR: [255, 255, 180] as [number, number, number],
    COIN_RING: [255, 220, 80] as [number, number, number],
    // Confetti palette (NEW BEST)
    CONFETTI: [
      [255, 220, 80],
      [100, 180, 255],
      [160, 100, 255],
      [80, 255, 160],
      [80, 255, 180],
      [255, 120, 40],
    ] as [number, number, number][],
  }
}

// Lane X positions at the bottom of the screen (player level)
export function getLaneX(lane: number): number {
  const centerX = GAME_CONFIG.VANISHING_POINT_X
  const offset = (lane - 1) * GAME_CONFIG.LANE_WIDTH
  return centerX + offset
}

// Get the scale factor for a given Y position (for pseudo-3D)
export function getDepthScale(y: number): number {
  const range = GAME_CONFIG.LANE_Y_BOTTOM - GAME_CONFIG.LANE_Y_TOP
  const progress = Math.max(0, (y - GAME_CONFIG.LANE_Y_TOP) / range)
  return 0.15 + progress * 0.85
}

// Get lane X position at a given depth
export function getLaneXAtDepth(lane: number, y: number): number {
  const scale = getDepthScale(y)
  const centerX = GAME_CONFIG.VANISHING_POINT_X
  const offset = (lane - 1) * GAME_CONFIG.LANE_WIDTH * scale
  return centerX + offset
}

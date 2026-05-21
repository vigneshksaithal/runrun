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

  // Colors - Clean Blocky: warm earth/stone tunnel
  COLORS: {
    // Background - warm dark browns
    BG_TOP: [20, 16, 12] as [number, number, number],
    BG_MID: [30, 24, 18] as [number, number, number],
    BG_BOTTOM: [40, 32, 24] as [number, number, number],

    // Track - dark stone floor
    TRACK_TOP: [35, 28, 20] as [number, number, number],
    TRACK_BOTTOM: [50, 40, 30] as [number, number, number],

    // Walls - dark stone brown
    WALL_DARK: [25, 20, 15] as [number, number, number],
    WALL_LIGHT: [55, 44, 33] as [number, number, number],

    // Lane/road lines - warm cream/tan
    LANE_LINE: [180, 160, 120] as [number, number, number],
    LANE_GLOW: [140, 120, 90] as [number, number, number],

    // Player - blocky character
    PLAYER_BODY: [60, 180, 170] as [number, number, number],
    PLAYER_HEAD: [220, 180, 150] as [number, number, number],
    PLAYER_HAIR: [100, 70, 40] as [number, number, number],
    PLAYER_LEGS: [40, 60, 100] as [number, number, number],
    PLAYER_EYES: [20, 20, 20] as [number, number, number],

    // Coins - bright gold
    COIN: [255, 200, 40] as [number, number, number],
    COIN_DARK: [200, 150, 20] as [number, number, number],
    COIN_SHINE: [255, 255, 220] as [number, number, number],

    // Obstacles - stone/danger
    OBSTACLE_STONE: [120, 110, 100] as [number, number, number],
    OBSTACLE_STONE_DARK: [80, 72, 65] as [number, number, number],
    OBSTACLE_BEAM: [100, 80, 60] as [number, number, number],
    OBSTACLE_BEAM_DARK: [70, 55, 40] as [number, number, number],
    OBSTACLE_PILLAR: [180, 50, 50] as [number, number, number],
    OBSTACLE_STRIPE: [220, 180, 0] as [number, number, number],
    OBSTACLE_STRIPE_DARK: [30, 30, 30] as [number, number, number],

    // Torch/ambient
    TORCH_FLAME: [255, 160, 40] as [number, number, number],
    TORCH_GLOW: [255, 120, 20] as [number, number, number],

    // Particles
    PARTICLE_DUST: [140, 110, 70] as [number, number, number],
    PARTICLE_GOLD: [255, 200, 60] as [number, number, number],
    PARTICLE_STONE: [100, 90, 80] as [number, number, number],

    // Speed lines
    SPEED_LINE: [180, 160, 120] as [number, number, number],

    // UI
    TEXT_WHITE: [255, 255, 255] as [number, number, number],
    TEXT_GOLD: [255, 210, 40] as [number, number, number],
    COMBO_TEXT: [255, 180, 60] as [number, number, number],
    BUTTON_GREEN: [60, 180, 80] as [number, number, number],
    BUTTON_GREEN_DARK: [40, 140, 60] as [number, number, number],
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

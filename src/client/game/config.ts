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
  PLAYER_WIDTH: 45,
  PLAYER_HEIGHT: 65,
  LANE_SWITCH_SPEED: 0.3, // Very snappy

  // Speed settings
  INITIAL_SPEED: 4.5,
  MAX_SPEED: 11,
  SPEED_INCREASE_RATE: 0.04,

  // Spawning
  INITIAL_SPAWN_INTERVAL: 1.2,
  MIN_SPAWN_INTERVAL: 0.5,
  COIN_SPAWN_INTERVAL: 0.6,

  // Scoring
  SCORE_PER_SECOND: 10,
  COIN_SCORE: 5,

  // Jump / Slide
  JUMP_DURATION: 0.45,
  SLIDE_DURATION: 0.55,

  // Road animation
  ROAD_LINE_COUNT: 12,
  ROAD_LINE_SPEED_MULT: 150,

  // Combo system
  COMBO_THRESHOLD: 5,
  MAX_MULTIPLIER: 5,

  // Colors - Bright vibrant palette
  COLORS: {
    // Background - bright sky
    SKY_TOP: [100, 180, 255] as [number, number, number],
    SKY_MID: [130, 200, 255] as [number, number, number],
    SKY_BOTTOM: [160, 220, 255] as [number, number, number],

    // Track
    TRACK: [80, 90, 80] as [number, number, number],
    TRACK_LIGHT: [100, 110, 100] as [number, number, number],
    LANE_LINE: [255, 255, 255] as [number, number, number],

    // Side walls - colorful
    WALL_LEFT: [50, 180, 140] as [number, number, number],
    WALL_RIGHT: [50, 180, 140] as [number, number, number],

    // Player
    PLAYER_BODY: [0, 200, 180] as [number, number, number],
    PLAYER_HAIR: [240, 130, 40] as [number, number, number],
    PLAYER_HEAD: [255, 220, 180] as [number, number, number],
    PLAYER_LEGS: [60, 60, 120] as [number, number, number],

    // Coins - bright gold
    COIN: [255, 200, 0] as [number, number, number],
    COIN_DARK: [220, 170, 0] as [number, number, number],
    COIN_SHINE: [255, 255, 200] as [number, number, number],

    // Obstacles - clearly dangerous
    BARRIER_RED: [220, 50, 40] as [number, number, number],
    BARRIER_DARK: [160, 30, 25] as [number, number, number],
    WARNING_YELLOW: [255, 220, 0] as [number, number, number],
    WARNING_BLACK: [30, 30, 30] as [number, number, number],
    BEAM_GRAY: [80, 80, 90] as [number, number, number],
    BEAM_DARK: [50, 50, 60] as [number, number, number],
    PILLAR_RED: [200, 40, 40] as [number, number, number],

    // Effects
    PARTICLE_GOLD: [255, 230, 100] as [number, number, number],
    SPARKLE: [255, 255, 255] as [number, number, number],

    // UI
    TEXT_WHITE: [255, 255, 255] as [number, number, number],
    TEXT_GOLD: [255, 215, 0] as [number, number, number],
    TEXT_SHADOW: [0, 0, 0] as [number, number, number],
    BUTTON_GREEN: [76, 200, 80] as [number, number, number],
    COMBO_TEXT: [255, 100, 50] as [number, number, number],
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

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

  // Colors - Premium Neon Depths palette
  COLORS: {
    // Background - deep navy/purple gradient
    BG_TOP: [12, 8, 30] as [number, number, number],
    BG_MID: [18, 14, 45] as [number, number, number],
    BG_BOTTOM: [25, 20, 55] as [number, number, number],

    // Track - dark with subtle purple
    TRACK_TOP: [20, 16, 40] as [number, number, number],
    TRACK_BOTTOM: [35, 28, 60] as [number, number, number],

    // Walls - dark purple with depth
    WALL_DARK: [15, 10, 35] as [number, number, number],
    WALL_LIGHT: [30, 22, 55] as [number, number, number],

    // Lane lines - NEON CYAN glow
    LANE_LINE: [0, 255, 220] as [number, number, number],
    LANE_GLOW: [0, 200, 180] as [number, number, number],

    // Player - vibrant teal with glow
    PLAYER_BODY: [0, 220, 200] as [number, number, number],
    PLAYER_HEAD: [230, 190, 160] as [number, number, number],
    PLAYER_HAIR: [255, 140, 50] as [number, number, number],
    PLAYER_LEGS: [0, 160, 150] as [number, number, number],
    PLAYER_GLOW: [0, 255, 220] as [number, number, number],

    // Coins - BRIGHT GOLD with warm glow
    COIN: [255, 210, 0] as [number, number, number],
    COIN_GLOW: [255, 180, 0] as [number, number, number],
    COIN_SHINE: [255, 255, 200] as [number, number, number],

    // Obstacles - HOT MAGENTA/RED
    OBSTACLE_MAIN: [255, 40, 80] as [number, number, number],
    OBSTACLE_DARK: [180, 20, 50] as [number, number, number],
    OBSTACLE_GLOW: [255, 60, 100] as [number, number, number],
    OBSTACLE_STRIPE: [255, 200, 0] as [number, number, number],
    OBSTACLE_STRIPE_DARK: [30, 10, 20] as [number, number, number],
    OBSTACLE_BEAM: [60, 20, 50] as [number, number, number],
    OBSTACLE_BEAM_DARK: [40, 10, 35] as [number, number, number],

    // Effects
    PARTICLE_CYAN: [0, 255, 220] as [number, number, number],
    PARTICLE_GOLD: [255, 220, 80] as [number, number, number],
    PARTICLE_PINK: [255, 80, 150] as [number, number, number],
    SPEED_LINE: [100, 200, 255] as [number, number, number],

    // UI
    TEXT_WHITE: [255, 255, 255] as [number, number, number],
    TEXT_GOLD: [255, 210, 0] as [number, number, number],
    TEXT_CYAN: [0, 255, 220] as [number, number, number],
    COMBO_TEXT: [255, 100, 180] as [number, number, number],
    BUTTON_GREEN: [0, 220, 120] as [number, number, number],
    BUTTON_GLOW: [0, 180, 100] as [number, number, number],
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

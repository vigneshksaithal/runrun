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
  LANE_SWITCH_SPEED: 0.2,

  // Speed settings
  INITIAL_SPEED: 3,
  MAX_SPEED: 8,
  SPEED_INCREASE_RATE: 0.02,

  // Spawning
  INITIAL_SPAWN_INTERVAL: 1.3,
  MIN_SPAWN_INTERVAL: 0.5,
  COIN_SPAWN_INTERVAL: 0.7,

  // Scoring
  SCORE_PER_SECOND: 10,
  COIN_SCORE: 5,

  // Jump / Slide
  JUMP_DURATION: 0.5,
  SLIDE_DURATION: 0.5,

  // Road animation
  ROAD_LINE_COUNT: 10,
  ROAD_LINE_SPEED_MULT: 100,

  // Combo system
  COMBO_THRESHOLD: 5,
  MAX_MULTIPLIER: 5,

  // Modern Subway Surfers-inspired colors - clean and vibrant
  COLORS: {
    // Sky - bright daytime blue gradient
    SKY_TOP: [135, 206, 250] as [number, number, number],
    SKY_BOTTOM: [200, 230, 255] as [number, number, number],

    // Ground/Track - warm orange-tan like subway surfers
    GROUND: [230, 180, 140] as [number, number, number],
    GROUND_DARK: [200, 150, 110] as [number, number, number],
    TRACK: [180, 140, 100] as [number, number, number],

    // Rails - metallic gray
    RAIL: [120, 125, 130] as [number, number, number],
    RAIL_SHINE: [180, 185, 190] as [number, number, number],

    // Lane markers
    LANE_LINE: [255, 255, 255] as [number, number, number],

    // Player - bright blue outfit (Jake style)
    PLAYER_SHIRT: [50, 150, 250] as [number, number, number],
    PLAYER_SHIRT_DARK: [30, 120, 200] as [number, number, number],
    PLAYER_PANTS: [60, 60, 80] as [number, number, number],
    PLAYER_SKIN: [255, 200, 160] as [number, number, number],
    PLAYER_HAIR: [80, 50, 30] as [number, number, number],
    PLAYER_SHOES: [255, 80, 80] as [number, number, number],

    // Coins - shiny gold
    COIN: [255, 215, 0] as [number, number, number],
    COIN_SHINE: [255, 250, 150] as [number, number, number],
    COIN_SHADOW: [200, 160, 0] as [number, number, number],

    // Obstacles - train cars (colorful)
    TRAIN_BLUE: [60, 140, 200] as [number, number, number],
    TRAIN_BLUE_DARK: [40, 100, 160] as [number, number, number],
    TRAIN_RED: [220, 80, 80] as [number, number, number],
    TRAIN_RED_DARK: [180, 50, 50] as [number, number, number],
    TRAIN_YELLOW: [250, 200, 50] as [number, number, number],
    TRAIN_WINDOW: [200, 230, 255] as [number, number, number],

    // Barriers
    BARRIER: [255, 200, 0] as [number, number, number],
    BARRIER_STRIPE: [40, 40, 40] as [number, number, number],

    // Effects
    DUST: [220, 200, 180] as [number, number, number],
    SPARK: [255, 255, 200] as [number, number, number],
    SPEED_LINE: [255, 255, 255] as [number, number, number],

    // UI
    TEXT_WHITE: [255, 255, 255] as [number, number, number],
    TEXT_GOLD: [255, 215, 0] as [number, number, number],
    TEXT_SHADOW: [0, 0, 0] as [number, number, number],
    COMBO: [100, 255, 150] as [number, number, number],
    BUTTON: [80, 200, 120] as [number, number, number],
    BUTTON_DARK: [60, 160, 90] as [number, number, number],
    HEART: [255, 80, 100] as [number, number, number],
    PANEL: [0, 0, 0] as [number, number, number],
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

// Get track width at depth
export function getTrackWidthAtDepth(y: number): number {
  const scale = getDepthScale(y)
  return GAME_CONFIG.LANE_WIDTH * 3 * scale
}

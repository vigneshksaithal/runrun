export const GAME_CONFIG = {
  // Canvas dimensions
  WIDTH: 600,
  HEIGHT: 800,

  // Lane configuration
  LANES: 3,
  LANE_WIDTH: 110,
  LANE_Y_BOTTOM: 720,
  LANE_Y_TOP: 180,
  VANISHING_POINT_X: 300,

  // Player
  PLAYER_Y: 660,
  PLAYER_WIDTH: 44,
  PLAYER_HEIGHT: 70,
  LANE_SWITCH_SPEED: 0.18,

  // Speed settings
  INITIAL_SPEED: 3.2,
  MAX_SPEED: 8.5,
  SPEED_INCREASE_RATE: 0.025,

  // Spawning
  INITIAL_SPAWN_INTERVAL: 1.3,
  MIN_SPAWN_INTERVAL: 0.5,
  COIN_SPAWN_INTERVAL: 0.7,

  // Scoring
  SCORE_PER_SECOND: 10,
  COIN_SCORE: 5,

  // Jump / Slide
  JUMP_DURATION: 0.55,
  SLIDE_DURATION: 0.5,

  // Road animation
  ROAD_LINE_COUNT: 12,
  ROAD_LINE_SPEED_MULT: 110,

  // Combo system
  COMBO_THRESHOLD: 5,
  MAX_MULTIPLIER: 5,

  // Subway Surfers-inspired Color Palette - Vibrant and Polished
  COLORS: {
    // Sky gradient - warm sunset vibes
    SKY_TOP: [135, 206, 250] as [number, number, number],      // Light sky blue
    SKY_MID: [255, 183, 130] as [number, number, number],      // Warm peach
    SKY_BOTTOM: [255, 140, 90] as [number, number, number],    // Sunset orange

    // City buildings - background silhouettes
    BUILDING_FAR: [80, 90, 110] as [number, number, number],
    BUILDING_MID: [60, 70, 90] as [number, number, number],
    BUILDING_NEAR: [45, 55, 75] as [number, number, number],
    BUILDING_ACCENT: [255, 220, 100] as [number, number, number], // Lit windows

    // Track/railway
    TRACK_MAIN: [85, 75, 70] as [number, number, number],      // Gravel
    TRACK_RAIL: [140, 140, 150] as [number, number, number],   // Steel rails
    TRACK_SLEEPER: [90, 60, 40] as [number, number, number],   // Wood sleepers
    TRACK_GRAVEL: [110, 100, 95] as [number, number, number],

    // Ground/platform
    GROUND_MAIN: [70, 65, 60] as [number, number, number],
    GROUND_EDGE: [55, 50, 45] as [number, number, number],
    PLATFORM: [180, 170, 160] as [number, number, number],

    // Lane markings
    LANE_LINE: [255, 255, 255] as [number, number, number],
    LANE_GLOW: [255, 255, 200] as [number, number, number],

    // Player - Jake-inspired vibrant character
    PLAYER_SKIN: [255, 205, 170] as [number, number, number],
    PLAYER_HAIR: [60, 40, 30] as [number, number, number],
    PLAYER_HOODIE: [65, 150, 235] as [number, number, number], // Bright blue hoodie
    PLAYER_HOODIE_DARK: [45, 120, 200] as [number, number, number],
    PLAYER_PANTS: [50, 55, 65] as [number, number, number],    // Dark jeans
    PLAYER_SHOES: [255, 90, 60] as [number, number, number],   // Red sneakers
    PLAYER_SHOES_SOLE: [240, 240, 235] as [number, number, number],

    // Coins - Shiny gold
    COIN_GOLD: [255, 215, 0] as [number, number, number],
    COIN_LIGHT: [255, 245, 150] as [number, number, number],
    COIN_DARK: [200, 160, 0] as [number, number, number],
    COIN_SHINE: [255, 255, 255] as [number, number, number],
    COIN_GLOW: [255, 230, 100] as [number, number, number],

    // Obstacles - Trains and barriers
    TRAIN_BODY: [70, 130, 180] as [number, number, number],    // Blue train
    TRAIN_BODY_DARK: [50, 100, 150] as [number, number, number],
    TRAIN_ACCENT: [255, 200, 50] as [number, number, number],  // Yellow stripe
    TRAIN_WINDOW: [180, 220, 255] as [number, number, number],
    TRAIN_RED: [220, 60, 60] as [number, number, number],      // Red train variant
    TRAIN_RED_DARK: [180, 40, 40] as [number, number, number],
    TRAIN_GREEN: [60, 180, 100] as [number, number, number],   // Green train variant
    TRAIN_GREEN_DARK: [40, 140, 70] as [number, number, number],

    BARRIER_YELLOW: [255, 200, 0] as [number, number, number],
    BARRIER_BLACK: [30, 30, 30] as [number, number, number],
    BARRIER_ORANGE: [255, 140, 0] as [number, number, number],

    // Effects
    DUST: [200, 180, 160] as [number, number, number],
    SPARK: [255, 255, 200] as [number, number, number],
    TRAIL_BLUE: [100, 180, 255] as [number, number, number],
    SPEED_LINE: [255, 255, 255] as [number, number, number],

    // Particles
    PARTICLE_GOLD: [255, 220, 80] as [number, number, number],
    PARTICLE_BLUE: [100, 200, 255] as [number, number, number],
    PARTICLE_WHITE: [255, 255, 255] as [number, number, number],

    // UI - Clean and modern
    TEXT_WHITE: [255, 255, 255] as [number, number, number],
    TEXT_GOLD: [255, 215, 0] as [number, number, number],
    TEXT_SHADOW: [0, 0, 0] as [number, number, number],
    COMBO_GREEN: [100, 255, 150] as [number, number, number],
    BUTTON_PLAY: [100, 200, 80] as [number, number, number],
    BUTTON_PLAY_DARK: [70, 160, 55] as [number, number, number],
    BUTTON_RETRY: [255, 100, 80] as [number, number, number],
    BUTTON_RETRY_DARK: [200, 70, 55] as [number, number, number],
    UI_PANEL: [0, 0, 0] as [number, number, number],
    HEART_RED: [255, 70, 80] as [number, number, number],
    HEART_PINK: [255, 150, 160] as [number, number, number],
  }
}

// Lane X positions at the bottom of the screen (player level)
export function getLaneX(lane: number): number {
  const centerX = GAME_CONFIG.VANISHING_POINT_X
  const offset = (lane - 1) * GAME_CONFIG.LANE_WIDTH
  return centerX + offset
}

// Get the scale factor for a given Y position (for pseudo-3D perspective)
export function getDepthScale(y: number): number {
  const range = GAME_CONFIG.LANE_Y_BOTTOM - GAME_CONFIG.LANE_Y_TOP
  const progress = Math.max(0, (y - GAME_CONFIG.LANE_Y_TOP) / range)
  // More dramatic perspective scaling for 3D feel
  return 0.12 + progress * 0.88
}

// Get lane X position at a given depth with perspective
export function getLaneXAtDepth(lane: number, y: number): number {
  const scale = getDepthScale(y)
  const centerX = GAME_CONFIG.VANISHING_POINT_X
  const offset = (lane - 1) * GAME_CONFIG.LANE_WIDTH * scale
  return centerX + offset
}

// Get track width at a given depth
export function getTrackWidthAtDepth(y: number): number {
  const scale = getDepthScale(y)
  return (GAME_CONFIG.LANE_WIDTH * 3 + 60) * scale
}

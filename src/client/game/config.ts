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

  // Horizon (where sky meets ground)
  HORIZON_Y: 220,

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

  // Track animation
  TIE_COUNT: 12,
  ROAD_LINE_SPEED_MULT: 100,

  // Side props (poles / palms) whooshing past
  SIDE_PROP_COUNT: 5,

  // Combo system
  COMBO_THRESHOLD: 5,
  MAX_MULTIPLIER: 5,

  // Colors - Subway Surfers: bright sunny railway
  COLORS: {
    // === SKY ===
    SKY_TOP: [64, 170, 250] as [number, number, number],      // vivid blue
    SKY_MID: [120, 200, 252] as [number, number, number],
    SKY_LOW: [196, 234, 252] as [number, number, number],     // pale near horizon
    SUN: [255, 240, 170] as [number, number, number],
    SUN_CORE: [255, 252, 230] as [number, number, number],
    CLOUD: [255, 255, 255] as [number, number, number],
    CLOUD_SHADE: [222, 238, 250] as [number, number, number],

    // === DISTANT SCENERY ===
    HILL: [120, 205, 130] as [number, number, number],
    HILL_DARK: [86, 175, 104] as [number, number, number],
    PALM_TRUNK: [120, 84, 52] as [number, number, number],
    PALM_LEAF: [56, 170, 80] as [number, number, number],
    PALM_LEAF_DARK: [40, 138, 64] as [number, number, number],

    // === GRASS EMBANKMENT (sides) ===
    GRASS: [104, 196, 88] as [number, number, number],
    GRASS_DARK: [78, 165, 70] as [number, number, number],
    GRASS_LIGHT: [140, 214, 110] as [number, number, number],

    // === RAILWAY TRACK BED ===
    GROUND_FAR: [176, 148, 116] as [number, number, number],   // sunlit gravel far
    GROUND_NEAR: [138, 110, 80] as [number, number, number],   // darker brown near
    GROUND_EDGE: [150, 124, 92] as [number, number, number],

    // Sleepers / ties (wooden)
    TIE: [122, 86, 56] as [number, number, number],
    TIE_DARK: [92, 62, 40] as [number, number, number],
    TIE_LIGHT: [150, 108, 70] as [number, number, number],

    // Steel rails
    RAIL: [176, 182, 192] as [number, number, number],
    RAIL_DARK: [108, 114, 126] as [number, number, number],
    RAIL_SHINE: [228, 232, 240] as [number, number, number],

    // Poles / overhead structures
    POLE: [120, 126, 138] as [number, number, number],
    POLE_DARK: [86, 92, 104] as [number, number, number],
    POLE_LAMP: [255, 226, 120] as [number, number, number],
    WIRE: [60, 66, 78] as [number, number, number],

    // === PLAYER (Jake-style runner) ===
    CAP: [228, 56, 56] as [number, number, number],            // red cap
    CAP_DARK: [184, 38, 38] as [number, number, number],
    SKIN: [244, 200, 162] as [number, number, number],
    SKIN_DARK: [212, 166, 128] as [number, number, number],
    HOODIE: [248, 248, 250] as [number, number, number],       // white hoodie
    HOODIE_SHADE: [212, 218, 230] as [number, number, number],
    HOODIE_ACCENT: [255, 176, 40] as [number, number, number], // graffiti splash
    HOODIE_ACCENT2: [70, 180, 240] as [number, number, number],
    JEANS: [66, 108, 178] as [number, number, number],
    JEANS_DARK: [46, 80, 140] as [number, number, number],
    SHOE: [250, 226, 64] as [number, number, number],          // yellow sneakers
    SHOE_DARK: [60, 60, 66] as [number, number, number],
    EYE: [30, 30, 36] as [number, number, number],
    BACKPACK: [70, 190, 170] as [number, number, number],
    BACKPACK_DARK: [44, 150, 134] as [number, number, number],

    // === COINS (gold) ===
    COIN: [255, 198, 36] as [number, number, number],
    COIN_DARK: [214, 150, 18] as [number, number, number],
    COIN_LIGHT: [255, 226, 110] as [number, number, number],
    COIN_SHINE: [255, 255, 235] as [number, number, number],

    // === TRAIN (dodge obstacle) ===
    TRAIN: [70, 132, 214] as [number, number, number],
    TRAIN_DARK: [44, 96, 168] as [number, number, number],
    TRAIN_LIGHT: [122, 184, 240] as [number, number, number],
    TRAIN_WINDOW: [188, 228, 248] as [number, number, number],
    TRAIN_ROOF: [222, 228, 234] as [number, number, number],
    TRAIN_TRIM: [232, 74, 70] as [number, number, number],
    TRAIN_LIGHT_GLOW: [255, 244, 180] as [number, number, number],

    // === JUMP BARRIER ===
    BARRIER: [240, 244, 248] as [number, number, number],
    BARRIER_STRIPE: [232, 74, 70] as [number, number, number],
    BARRIER_LEG: [90, 96, 108] as [number, number, number],
    BARRIER_GLOW: [255, 120, 110] as [number, number, number],

    // === SLIDE GATE (overhead sign) ===
    GATE_POST: [110, 116, 128] as [number, number, number],
    GATE_SIGN: [248, 178, 44] as [number, number, number],
    GATE_SIGN_DARK: [206, 138, 24] as [number, number, number],
    GATE_GLOW: [255, 210, 90] as [number, number, number],

    // === EFFECTS ===
    DUST: [210, 188, 150] as [number, number, number],
    GOLD_SPARK: [255, 224, 96] as [number, number, number],
    DEBRIS: [120, 100, 80] as [number, number, number],
    SPEED_LINE: [255, 255, 255] as [number, number, number],

    // === UI ===
    TEXT_WHITE: [255, 255, 255] as [number, number, number],
    TEXT_DARK: [40, 48, 60] as [number, number, number],
    TEXT_GOLD: [255, 206, 50] as [number, number, number],
    COMBO_TEXT: [255, 120, 40] as [number, number, number],
    PANEL: [44, 62, 92] as [number, number, number],
    PANEL_LIGHT: [70, 96, 138] as [number, number, number],
    BUTTON_GREEN: [86, 200, 84] as [number, number, number],
    BUTTON_GREEN_DARK: [58, 162, 60] as [number, number, number],
    HEART: [232, 74, 86] as [number, number, number],
    HEART_DARK: [188, 48, 60] as [number, number, number],
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

// Get screen X for an arbitrary horizontal offset (measured at scale 1) at a given depth
export function getXAtDepth(offset: number, y: number): number {
  return GAME_CONFIG.VANISHING_POINT_X + offset * getDepthScale(y)
}

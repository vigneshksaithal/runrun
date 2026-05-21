export const GAME_CONFIG = {
  // Canvas dimensions (will be stretched to fit)
  WIDTH: 400,
  HEIGHT: 700,

  // Lane configuration
  LANES: 3,
  LANE_WIDTH: 80,
  LANE_Y_BOTTOM: 620, // Where objects are at full size (near player)
  LANE_Y_TOP: 200, // Vanishing point Y
  VANISHING_POINT_X: 200, // Center of screen

  // Player
  PLAYER_Y: 580,
  PLAYER_WIDTH: 36,
  PLAYER_HEIGHT: 56,
  LANE_SWITCH_SPEED: 0.15, // Lerp factor

  // Speed settings
  INITIAL_SPEED: 3.5,
  MAX_SPEED: 9,
  SPEED_INCREASE_RATE: 0.03, // Per second

  // Spawning
  INITIAL_SPAWN_INTERVAL: 1.2, // Seconds between obstacle spawns
  MIN_SPAWN_INTERVAL: 0.5,
  COLLECTIBLE_CHANCE: 0.35, // Chance to spawn collectible instead of obstacle

  // Scoring
  SCORE_PER_SECOND: 10,
  GOLD_INGOT_SCORE: 10,
  NEAR_MISS_BONUS: 5,
  NEAR_MISS_DISTANCE: 20,

  // Jump / Slide
  JUMP_DURATION: 0.5,
  SLIDE_DURATION: 0.6,

  // Colors - Overworld biome
  COLORS: {
    SKY_TOP: [135, 206, 235] as [number, number, number],
    SKY_BOTTOM: [76, 153, 0] as [number, number, number],
    GROUND: [101, 67, 33] as [number, number, number],
    TRACK: [80, 80, 80] as [number, number, number],
    LANE_LINE: [180, 180, 180] as [number, number, number],
    TUNNEL_WALL: [64, 64, 64] as [number, number, number],
    TUNNEL_CEILING: [48, 48, 48] as [number, number, number],

    // Player (Steve)
    PLAYER_HEAD: [196, 164, 132] as [number, number, number],
    PLAYER_BODY: [0, 170, 170] as [number, number, number],
    PLAYER_LEGS: [60, 60, 120] as [number, number, number],
    PLAYER_HAIR: [60, 30, 0] as [number, number, number],

    // Obstacles
    STONE: [128, 128, 128] as [number, number, number],
    STONE_DARK: [96, 96, 96] as [number, number, number],
    COBWEB: [220, 220, 240] as [number, number, number],
    COBWEB_STRAND: [180, 180, 200] as [number, number, number],
    TNT_RED: [200, 50, 50] as [number, number, number],
    TNT_DARK: [140, 30, 30] as [number, number, number],
    TNT_LABEL: [255, 255, 255] as [number, number, number],

    // Collectibles
    GOLD: [255, 215, 0] as [number, number, number],
    GOLD_DARK: [200, 165, 0] as [number, number, number],
    DIAMOND: [80, 220, 255] as [number, number, number],

    // Effects
    PARTICLE_GOLD: [255, 230, 100] as [number, number, number],
    SPEED_LINE: [255, 255, 255] as [number, number, number],
    NEAR_MISS: [0, 255, 200] as [number, number, number],

    // UI
    TEXT_WHITE: [255, 255, 255] as [number, number, number],
    TEXT_GOLD: [255, 215, 0] as [number, number, number],
    TEXT_SHADOW: [0, 0, 0] as [number, number, number],
    BUTTON_GREEN: [76, 175, 80] as [number, number, number],
    BUTTON_HOVER: [56, 142, 60] as [number, number, number],
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
  const progress = (y - GAME_CONFIG.LANE_Y_TOP) / range
  return 0.1 + progress * 0.9
}

// Get lane X position at a given depth
export function getLaneXAtDepth(lane: number, y: number): number {
  const scale = getDepthScale(y)
  const centerX = GAME_CONFIG.VANISHING_POINT_X
  const offset = (lane - 1) * GAME_CONFIG.LANE_WIDTH * scale
  return centerX + offset
}

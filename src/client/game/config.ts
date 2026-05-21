export const GAME_CONFIG = {
  // Canvas dimensions - wider for Reddit full-width posts
  WIDTH: 600,
  HEIGHT: 800,

  // Lane configuration
  LANES: 3,
  LANE_WIDTH: 100,
  LANE_Y_BOTTOM: 700, // Where objects are at full size (near player)
  LANE_Y_TOP: 220, // Vanishing point Y
  VANISHING_POINT_X: 300, // Center of screen

  // Player
  PLAYER_Y: 650,
  PLAYER_WIDTH: 40,
  PLAYER_HEIGHT: 60,
  LANE_SWITCH_SPEED: 0.25, // Faster lerp for snappier feel

  // Speed settings
  INITIAL_SPEED: 4.0,
  MAX_SPEED: 10,
  SPEED_INCREASE_RATE: 0.035, // Per second

  // Spawning
  INITIAL_SPAWN_INTERVAL: 1.0, // Seconds between obstacle spawns
  MIN_SPAWN_INTERVAL: 0.45,
  COLLECTIBLE_CHANCE: 0.35,

  // Scoring
  SCORE_PER_SECOND: 12,
  GOLD_INGOT_SCORE: 10,
  NEAR_MISS_BONUS: 5,
  NEAR_MISS_DISTANCE: 25,

  // Jump / Slide
  JUMP_DURATION: 0.45,
  SLIDE_DURATION: 0.55,

  // Road animation
  ROAD_LINE_COUNT: 12,
  ROAD_LINE_SPEED_MULT: 150,

  // Combo system
  COMBO_THRESHOLD: 3,  // golds per multiplier level
  MAX_MULTIPLIER: 4,

  // Power-ups
  POWER_UP_CHANCE: 0.10,
  SHIELD_DURATION: -1,  // until hit
  MAGNET_DURATION: 5,
  DOUBLE_SCORE_DURATION: 8,

  // Biome
  BIOME_DISTANCE: 500,

  // Colors - Dark mine tunnel Minecraft palette
  COLORS: {
    // Background
    SKY_TOP: [20, 18, 35] as [number, number, number],
    SKY_MID: [30, 28, 50] as [number, number, number],
    SKY_BOTTOM: [40, 35, 60] as [number, number, number],
    GROUND: [55, 50, 45] as [number, number, number],
    TRACK: [70, 65, 60] as [number, number, number],
    TRACK_DARK: [50, 45, 40] as [number, number, number],
    LANE_LINE: [140, 130, 120] as [number, number, number],
    TUNNEL_WALL: [45, 38, 32] as [number, number, number],
    TUNNEL_WALL_LIGHT: [65, 55, 45] as [number, number, number],
    TUNNEL_CEILING: [35, 30, 28] as [number, number, number],

    // Player (Steve)
    PLAYER_HEAD: [200, 168, 136] as [number, number, number],
    PLAYER_BODY: [0, 180, 180] as [number, number, number],
    PLAYER_LEGS: [55, 55, 110] as [number, number, number],
    PLAYER_HAIR: [70, 40, 10] as [number, number, number],

    // Obstacles
    STONE: [130, 130, 130] as [number, number, number],
    STONE_DARK: [90, 90, 90] as [number, number, number],
    STONE_LIGHT: [155, 155, 155] as [number, number, number],
    COBWEB: [225, 225, 240] as [number, number, number],
    COBWEB_STRAND: [185, 185, 205] as [number, number, number],
    TNT_RED: [210, 50, 40] as [number, number, number],
    TNT_DARK: [150, 30, 25] as [number, number, number],
    TNT_LABEL: [255, 255, 255] as [number, number, number],

    // Collectibles
    GOLD: [255, 215, 0] as [number, number, number],
    GOLD_DARK: [200, 165, 0] as [number, number, number],
    GOLD_SHINE: [255, 240, 150] as [number, number, number],
    DIAMOND: [80, 220, 255] as [number, number, number],

    // Effects
    PARTICLE_GOLD: [255, 230, 100] as [number, number, number],
    SPEED_LINE: [200, 200, 200] as [number, number, number],
    NEAR_MISS: [0, 255, 180] as [number, number, number],

    // Torch
    TORCH_FLAME: [255, 160, 30] as [number, number, number],
    TORCH_GLOW: [255, 200, 60] as [number, number, number],
    TORCH_STICK: [110, 75, 35] as [number, number, number],

    // UI
    TEXT_WHITE: [255, 255, 255] as [number, number, number],
    TEXT_GOLD: [255, 215, 0] as [number, number, number],
    TEXT_SHADOW: [0, 0, 0] as [number, number, number],
    BUTTON_GREEN: [76, 175, 80] as [number, number, number],
    BUTTON_HOVER: [56, 142, 60] as [number, number, number],

    // Power-ups
    SHIELD_BLUE: [80, 160, 255] as [number, number, number],
    MAGNET_PURPLE: [180, 80, 255] as [number, number, number],
    DOUBLE_ORANGE: [255, 160, 40] as [number, number, number],

    // Biomes
    NETHER_RED: [180, 40, 20] as [number, number, number],
    NETHER_ORANGE: [255, 130, 30] as [number, number, number],
    END_PURPLE: [100, 20, 160] as [number, number, number],
    END_BLACK: [15, 5, 25] as [number, number, number],
    CAVE_BLUE: [40, 50, 100] as [number, number, number],
    CAVE_CRYSTAL: [140, 200, 255] as [number, number, number],

    // Combo
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

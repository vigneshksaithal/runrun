import { GAME_CONFIG } from '../config'

export type ObstacleType = 'stone_wall' | 'cobweb' | 'tnt'
export type SpawnableType = ObstacleType | 'gold'

export interface SpawnEvent {
  type: SpawnableType
  lane: number
}

// Pre-designed wave patterns
const WAVE_PATTERNS: SpawnEvent[][] = [
  // Single obstacle in center
  [{ type: 'stone_wall', lane: 1 }],
  // Single TNT on side
  [{ type: 'tnt', lane: 0 }],
  [{ type: 'tnt', lane: 2 }],
  // Cobweb center
  [{ type: 'cobweb', lane: 1 }],
  // Gold run
  [{ type: 'gold', lane: 0 }],
  [{ type: 'gold', lane: 1 }],
  [{ type: 'gold', lane: 2 }],
  // Two obstacles blocking two lanes
  [{ type: 'stone_wall', lane: 0 }, { type: 'stone_wall', lane: 1 }],
  [{ type: 'stone_wall', lane: 1 }, { type: 'stone_wall', lane: 2 }],
  [{ type: 'tnt', lane: 0 }, { type: 'tnt', lane: 2 }],
  // Cobweb + obstacle
  [{ type: 'cobweb', lane: 1 }, { type: 'tnt', lane: 0 }],
  [{ type: 'cobweb', lane: 0 }, { type: 'stone_wall', lane: 2 }],
  // Gold with obstacles
  [{ type: 'gold', lane: 1 }, { type: 'tnt', lane: 0 }, { type: 'tnt', lane: 2 }],
  [{ type: 'gold', lane: 0 }, { type: 'stone_wall', lane: 1 }],
  [{ type: 'gold', lane: 2 }, { type: 'cobweb', lane: 1 }],
]

// Easy patterns for the first 10 seconds
const EASY_PATTERNS: SpawnEvent[][] = [
  [{ type: 'gold', lane: 1 }],
  [{ type: 'gold', lane: 0 }],
  [{ type: 'gold', lane: 2 }],
  [{ type: 'stone_wall', lane: 1 }],
  [{ type: 'tnt', lane: 0 }],
  [{ type: 'cobweb', lane: 1 }],
]

export function createSpawnerSystem() {
  let timer = 0
  let spawnInterval = GAME_CONFIG.INITIAL_SPAWN_INTERVAL
  let gameTime = 0

  return {
    update(dt: number, _speed: number): SpawnEvent[] {
      gameTime += dt
      timer += dt

      // Decrease spawn interval as game progresses
      spawnInterval = Math.max(
        GAME_CONFIG.MIN_SPAWN_INTERVAL,
        GAME_CONFIG.INITIAL_SPAWN_INTERVAL - (gameTime * 0.008)
      )

      if (timer >= spawnInterval) {
        timer = 0
        return getNextPattern(gameTime)
      }

      return []
    },

    reset() {
      timer = 0
      spawnInterval = GAME_CONFIG.INITIAL_SPAWN_INTERVAL
      gameTime = 0
    }
  }
}

function getNextPattern(gameTime: number): SpawnEvent[] {
  // Use easy patterns for first 8 seconds
  if (gameTime < 8) {
    const idx = Math.floor(Math.random() * EASY_PATTERNS.length)
    return EASY_PATTERNS[idx] ?? EASY_PATTERNS[0]!
  }

  // After that, use full pattern set with some randomization
  const idx = Math.floor(Math.random() * WAVE_PATTERNS.length)
  return WAVE_PATTERNS[idx] ?? WAVE_PATTERNS[0]!
}

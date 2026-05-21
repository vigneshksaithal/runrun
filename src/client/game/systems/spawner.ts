import { GAME_CONFIG } from '../config'

export type ObstacleType = 'stone_wall' | 'cobweb' | 'tnt'
export type SpawnableType = ObstacleType | 'gold' | 'power_up'

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
  // Multi-gold rows
  [{ type: 'gold', lane: 0 }, { type: 'gold', lane: 1 }, { type: 'gold', lane: 2 }],
  [{ type: 'gold', lane: 1 }, { type: 'stone_wall', lane: 0 }, { type: 'stone_wall', lane: 2 }],
  // Mixed challenge
  [{ type: 'cobweb', lane: 0 }, { type: 'tnt', lane: 1 }, { type: 'gold', lane: 2 }],
  [{ type: 'stone_wall', lane: 0 }, { type: 'cobweb', lane: 2 }],
]

// Rush patterns (after 1000 blocks): 3 obstacles in quick succession with gold reward
const RUSH_PATTERNS: SpawnEvent[][] = [
  [{ type: 'stone_wall', lane: 0 }, { type: 'stone_wall', lane: 1 }],
  [{ type: 'tnt', lane: 1 }, { type: 'tnt', lane: 2 }],
  [{ type: 'cobweb', lane: 0 }, { type: 'cobweb', lane: 1 }],
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
  let powerUpTimer = 0
  let rushState: 'idle' | 'active' = 'idle'
  let rushCount = 0

  return {
    update(dt: number, _speed: number, score: number): SpawnEvent[] {
      gameTime += dt
      timer += dt
      powerUpTimer += dt

      // Decrease spawn interval as game progresses
      spawnInterval = Math.max(
        GAME_CONFIG.MIN_SPAWN_INTERVAL,
        GAME_CONFIG.INITIAL_SPAWN_INTERVAL - (gameTime * 0.008)
      )

      const events: SpawnEvent[] = []

      // Power-up spawn check (separate timer, every ~3 seconds check)
      if (powerUpTimer > 3.0) {
        powerUpTimer = 0
        if (Math.random() < GAME_CONFIG.POWER_UP_CHANCE) {
          const lane = Math.floor(Math.random() * 3)
          events.push({ type: 'power_up', lane })
        }
      }

      if (timer >= spawnInterval) {
        timer = 0

        // Rush pattern logic after 1000 blocks
        if (score >= 1000 && rushState === 'idle' && Math.random() < 0.15) {
          rushState = 'active'
          rushCount = 0
        }

        if (rushState === 'active') {
          rushCount++
          const rushPattern = RUSH_PATTERNS[Math.floor(Math.random() * RUSH_PATTERNS.length)]
          if (rushPattern) {
            events.push(...rushPattern)
          }
          if (rushCount >= 3) {
            // After rush, reward with gold
            events.push({ type: 'gold', lane: 0 }, { type: 'gold', lane: 1 }, { type: 'gold', lane: 2 })
            rushState = 'idle'
            rushCount = 0
          }
        } else {
          const pattern = getNextPattern(gameTime)
          events.push(...pattern)
        }
      }

      return events
    },

    reset() {
      timer = 0
      spawnInterval = GAME_CONFIG.INITIAL_SPAWN_INTERVAL
      gameTime = 0
      powerUpTimer = 0
      rushState = 'idle'
      rushCount = 0
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

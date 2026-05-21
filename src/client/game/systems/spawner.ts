import { GAME_CONFIG } from '../config'

export type ObstacleType = 'barrier' | 'low_beam' | 'pillar'
export type SpawnableType = ObstacleType | 'coin'

export interface SpawnEvent {
  type: SpawnableType
  lane: number
}

// Coin patterns (lines of 3)
const COIN_LINE_PATTERNS: SpawnEvent[][] = [
  [{ type: 'coin', lane: 0 }],
  [{ type: 'coin', lane: 1 }],
  [{ type: 'coin', lane: 2 }],
  [{ type: 'coin', lane: 0 }, { type: 'coin', lane: 1 }, { type: 'coin', lane: 2 }],
]

// Obstacle patterns
const OBSTACLE_PATTERNS: SpawnEvent[][] = [
  // Single obstacles
  [{ type: 'barrier', lane: 1 }],
  [{ type: 'barrier', lane: 0 }],
  [{ type: 'barrier', lane: 2 }],
  [{ type: 'low_beam', lane: 1 }],
  [{ type: 'low_beam', lane: 0 }],
  [{ type: 'low_beam', lane: 2 }],
  [{ type: 'pillar', lane: 0 }],
  [{ type: 'pillar', lane: 2 }],
  // Two obstacles blocking two lanes
  [{ type: 'barrier', lane: 0 }, { type: 'barrier', lane: 1 }],
  [{ type: 'barrier', lane: 1 }, { type: 'barrier', lane: 2 }],
  [{ type: 'pillar', lane: 0 }, { type: 'pillar', lane: 2 }],
  // Obstacle + coin reward
  [{ type: 'barrier', lane: 0 }, { type: 'coin', lane: 2 }],
  [{ type: 'barrier', lane: 2 }, { type: 'coin', lane: 0 }],
  [{ type: 'low_beam', lane: 1 }, { type: 'coin', lane: 0 }],
  [{ type: 'pillar', lane: 0 }, { type: 'coin', lane: 1 }],
]

export function createSpawnerSystem() {
  let obstacleTimer = 0
  let coinTimer = 0
  let gameTime = 0
  let coinLineCount = 0
  let coinLineLane = 1

  return {
    update(dt: number, speed: number, _score: number): SpawnEvent[] {
      gameTime += dt
      obstacleTimer += dt
      coinTimer += dt

      const events: SpawnEvent[] = []

      // Calculate dynamic intervals
      const obstacleInterval = Math.max(
        GAME_CONFIG.MIN_SPAWN_INTERVAL,
        GAME_CONFIG.INITIAL_SPAWN_INTERVAL - (gameTime * 0.01)
      )
      const coinInterval = Math.max(0.6, 1.0 - (speed * 0.03))

      // Coin spawning (frequent)
      if (coinTimer >= coinInterval) {
        coinTimer = 0

        // If we're in a coin line, continue it
        if (coinLineCount > 0) {
          events.push({ type: 'coin', lane: coinLineLane })
          coinLineCount--
        } else {
          // Start a new coin pattern
          if (Math.random() < 0.4) {
            // Start a line of 3 coins in one lane
            coinLineLane = Math.floor(Math.random() * 3)
            coinLineCount = 2 // will spawn 2 more after this one
            events.push({ type: 'coin', lane: coinLineLane })
          } else {
            // Single coin or row
            const pattern = COIN_LINE_PATTERNS[Math.floor(Math.random() * COIN_LINE_PATTERNS.length)]
            if (pattern) {
              events.push(...pattern)
            }
          }
        }
      }

      // Obstacle spawning (first 5 seconds: only coins)
      if (gameTime > 5 && obstacleTimer >= obstacleInterval) {
        obstacleTimer = 0
        const pattern = OBSTACLE_PATTERNS[Math.floor(Math.random() * OBSTACLE_PATTERNS.length)]
        if (pattern) {
          events.push(...pattern)
        }
      }

      return events
    },

    reset() {
      obstacleTimer = 0
      coinTimer = 0
      gameTime = 0
      coinLineCount = 0
      coinLineLane = 1
    }
  }
}

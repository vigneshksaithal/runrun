import type { KAPLAYCtx } from 'kaplay'
import { GAME_CONFIG } from '../config'
import { createCoin } from '../objects/collectible'
import { createObstacle, type ObstacleType } from '../objects/obstacle'

type SpawnType = 'coin' | 'train_blue' | 'train_red' | 'barrier' | 'low_barrier'

export function createSpawnerSystem(k: KAPLAYCtx) {
  let spawnTimer = 0
  let coinTimer = 0
  let gameTime = 0
  let currentSpawnInterval = GAME_CONFIG.INITIAL_SPAWN_INTERVAL
  let lastObstacleLane = -1

  function getRandomLane(): number {
    return Math.floor(k.rand(0, 3))
  }

  function getObstacleLane(): number {
    let lane = getRandomLane()
    // Avoid same lane twice in a row (unless no choice)
    let attempts = 0
    while (lane === lastObstacleLane && attempts < 3) {
      lane = getRandomLane()
      attempts++
    }
    lastObstacleLane = lane
    return lane
  }

  function getSpawnType(): SpawnType {
    // First 5 seconds: only coins to let player get used to controls
    if (gameTime < 5) return 'coin'

    // Next few seconds: introduce barriers first (easier obstacles)
    if (gameTime < 10) {
      const roll = k.rand(0, 1)
      if (roll < 0.4) return 'coin'
      if (roll < 0.7) return 'barrier'
      return 'low_barrier'
    }

    // After 10s: full variety
    const roll = k.rand(0, 1)
    if (roll < 0.3) return 'coin'
    if (roll < 0.5) return 'train_blue'
    if (roll < 0.65) return 'train_red'
    if (roll < 0.82) return 'barrier'
    return 'low_barrier'
  }

  function spawnCoinLine(lane: number, count: number) {
    // Spawn a line of coins at slight delays
    for (let i = 0; i < count; i++) {
      k.wait(i * 0.25, () => {
        createCoin(k, lane)
      })
    }
  }

  function spawnCoinArc(centerLane: number) {
    // Spawn coins in an arc pattern across lanes
    const lanes = [0, 1, 2]
    for (let i = 0; i < lanes.length; i++) {
      k.wait(i * 0.15, () => {
        createCoin(k, lanes[i])
      })
    }
  }

  return {
    update(dt: number, speed: number) {
      gameTime += dt

      // Update spawn interval based on time (gets tighter)
      currentSpawnInterval = Math.max(
        GAME_CONFIG.MIN_SPAWN_INTERVAL,
        GAME_CONFIG.INITIAL_SPAWN_INTERVAL - gameTime * 0.012
      )

      // Main spawn timer
      spawnTimer += dt
      if (spawnTimer >= currentSpawnInterval) {
        spawnTimer = 0

        const type = getSpawnType()
        const lane = type === 'coin' ? getRandomLane() : getObstacleLane()

        if (type === 'coin') {
          // Various coin patterns
          const patternRoll = k.rand(0, 1)
          if (patternRoll < 0.3) {
            // Single coin
            createCoin(k, lane)
          } else if (patternRoll < 0.6) {
            // Line of 2-4 coins
            const lineCount = Math.floor(k.rand(2, 5))
            spawnCoinLine(lane, lineCount)
          } else if (patternRoll < 0.8) {
            // Arc across lanes
            spawnCoinArc(lane)
          } else {
            // Double coins in adjacent lanes
            createCoin(k, lane)
            const adjacentLane = lane === 0 ? 1 : (lane === 2 ? 1 : k.rand(0, 1) < 0.5 ? 0 : 2)
            k.wait(0.1, () => createCoin(k, adjacentLane))
          }
        } else {
          createObstacle(k, lane, type as ObstacleType)
        }
      }

      // Extra coin spawning between obstacles for more collection opportunities
      coinTimer += dt
      if (coinTimer >= GAME_CONFIG.COIN_SPAWN_INTERVAL && gameTime > 3) {
        coinTimer = 0
        if (k.rand(0, 1) < 0.45) {
          createCoin(k, getRandomLane())
        }
      }
    },

    reset() {
      spawnTimer = 0
      coinTimer = 0
      gameTime = 0
      currentSpawnInterval = GAME_CONFIG.INITIAL_SPAWN_INTERVAL
      lastObstacleLane = -1
    },
  }
}

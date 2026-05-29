import type { KAPLAYCtx } from 'kaplay'
import { GAME_CONFIG } from '../config'
import { createCoin } from '../objects/collectible'
import { createObstacle, type ObstacleType } from '../objects/obstacle'

type SpawnType = 'coin' | 'train' | 'jump_barrier' | 'slide_gate'

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
    // First 6 seconds: only coins
    if (gameTime < 6) return 'coin'

    const roll = k.rand(0, 1)
    if (roll < 0.35) return 'coin'
    if (roll < 0.62) return 'train'        // dodge
    if (roll < 0.82) return 'jump_barrier' // jump
    return 'slide_gate'                    // slide
  }

  function spawnCoinLine(lane: number, count: number) {
    // Spawn a line of coins at slight delays
    for (let i = 0; i < count; i++) {
      k.wait(i * 0.3, () => {
        createCoin(k, lane)
      })
    }
  }

  return {
    update(dt: number, _speed: number) {
      gameTime += dt

      // Update spawn interval based on time (gets tighter)
      currentSpawnInterval = Math.max(
        GAME_CONFIG.MIN_SPAWN_INTERVAL,
        GAME_CONFIG.INITIAL_SPAWN_INTERVAL - gameTime * 0.01
      )

      // Main spawn timer
      spawnTimer += dt
      if (spawnTimer >= currentSpawnInterval) {
        spawnTimer = 0

        const type = getSpawnType()
        const lane = type === 'coin' ? getRandomLane() : getObstacleLane()

        if (type === 'coin') {
          // Sometimes spawn a line of 2-3 coins
          const lineCount = k.rand(0, 1) < 0.4 ? Math.floor(k.rand(2, 4)) : 1
          if (lineCount > 1) {
            spawnCoinLine(lane, lineCount)
          } else {
            createCoin(k, lane)
          }
        } else {
          createObstacle(k, lane, type as ObstacleType)
        }
      }

      // Extra coin spawning between obstacles
      coinTimer += dt
      if (coinTimer >= GAME_CONFIG.COIN_SPAWN_INTERVAL && gameTime > 2) {
        coinTimer = 0
        if (k.rand(0, 1) < 0.5) {
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

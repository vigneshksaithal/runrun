import type { KAPLAYCtx } from 'kaplay'
import { GAME_CONFIG } from '../config'
import { createCoin } from '../objects/collectible'
import { createObstacle, type ObstacleType } from '../objects/obstacle'

export function createSpawnerSystem(k: KAPLAYCtx) {
  let spawnTimer = 0
  let coinTimer = 0
  let gameTime = 0
  let currentSpawnInterval = GAME_CONFIG.INITIAL_SPAWN_INTERVAL
  let lastLane = -1

  function getRandomLane(): number {
    return Math.floor(k.rand(0, 3))
  }

  function getDifferentLane(): number {
    let lane = getRandomLane()
    let attempts = 0
    while (lane === lastLane && attempts < 3) {
      lane = getRandomLane()
      attempts++
    }
    lastLane = lane
    return lane
  }

  return {
    update(dt: number, speed: number) {
      gameTime += dt

      currentSpawnInterval = Math.max(
        GAME_CONFIG.MIN_SPAWN_INTERVAL,
        GAME_CONFIG.INITIAL_SPAWN_INTERVAL - gameTime * 0.01
      )

      // Main spawner
      spawnTimer += dt
      if (spawnTimer >= currentSpawnInterval) {
        spawnTimer = 0

        // Early game: more coins
        if (gameTime < 5) {
          createCoin(k, getRandomLane())
        } else {
          const roll = k.rand(0, 1)
          if (roll < 0.35) {
            // Coin
            createCoin(k, getRandomLane())
          } else if (roll < 0.65) {
            // Train (jump over)
            createObstacle(k, getDifferentLane(), 'train')
          } else if (roll < 0.85) {
            // Barrier (jump over)
            createObstacle(k, getDifferentLane(), 'barrier')
          } else {
            // Low barrier (slide under)
            createObstacle(k, getDifferentLane(), 'low_barrier')
          }
        }
      }

      // Extra coins
      coinTimer += dt
      if (coinTimer >= GAME_CONFIG.COIN_SPAWN_INTERVAL && gameTime > 3) {
        coinTimer = 0
        if (k.rand(0, 1) < 0.4) {
          createCoin(k, getRandomLane())
        }
      }
    },

    reset() {
      spawnTimer = 0
      coinTimer = 0
      gameTime = 0
      currentSpawnInterval = GAME_CONFIG.INITIAL_SPAWN_INTERVAL
      lastLane = -1
    },
  }
}

import { GAME_CONFIG, getLaneX } from '../config'

export function createLaneSystem() {
  let currentLane = 1 // 0=left, 1=center, 2=right
  let targetX = getLaneX(currentLane)
  let currentX = targetX

  return {
    getCurrentLane(): number {
      return currentLane
    },

    getCurrentX(): number {
      return currentX
    },

    moveLeft(): boolean {
      if (currentLane > 0) {
        currentLane--
        targetX = getLaneX(currentLane)
        return true
      }
      return false
    },

    moveRight(): boolean {
      if (currentLane < GAME_CONFIG.LANES - 1) {
        currentLane++
        targetX = getLaneX(currentLane)
        return true
      }
      return false
    },

    update() {
      // Smooth lerp to target lane
      currentX += (targetX - currentX) * GAME_CONFIG.LANE_SWITCH_SPEED
    },

    reset() {
      currentLane = 1
      targetX = getLaneX(1)
      currentX = targetX
    }
  }
}

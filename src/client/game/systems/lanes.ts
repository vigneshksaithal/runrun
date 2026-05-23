import { GAME_CONFIG, getLaneX } from '../config'

export function createLaneSystem() {
  let currentLane = 1 // 0=left, 1=center, 2=right
  let targetX = getLaneX(currentLane)
  let currentX = targetX
  let tiltAngle = 0
  let isMoving = false

  const TILT_MAX = 15 // degrees
  const TILT_DECAY = 8 // speed of tilt return to 0

  return {
    getCurrentLane(): number {
      return currentLane
    },

    getCurrentX(): number {
      return currentX
    },

    getTilt(): number {
      return tiltAngle
    },

    isLaneChanging(): boolean {
      return isMoving
    },

    moveLeft(): boolean {
      if (currentLane > 0) {
        currentLane--
        targetX = getLaneX(currentLane)
        tiltAngle = -TILT_MAX
        isMoving = true
        return true
      }
      return false
    },

    moveRight(): boolean {
      if (currentLane < GAME_CONFIG.LANES - 1) {
        currentLane++
        targetX = getLaneX(currentLane)
        tiltAngle = TILT_MAX
        isMoving = true
        return true
      }
      return false
    },

    update(dt: number) {
      // Smooth lerp to target lane
      const diff = targetX - currentX
      currentX += diff * GAME_CONFIG.LANE_SWITCH_SPEED

      // Snap when very close
      if (Math.abs(diff) < 0.5) {
        currentX = targetX
        isMoving = false
      }

      // Decay tilt back to 0
      if (Math.abs(tiltAngle) > 0.5) {
        tiltAngle -= tiltAngle * TILT_DECAY * dt
      } else {
        tiltAngle = 0
      }
    },

    reset() {
      currentLane = 1
      targetX = getLaneX(1)
      currentX = targetX
      tiltAngle = 0
      isMoving = false
    }
  }
}

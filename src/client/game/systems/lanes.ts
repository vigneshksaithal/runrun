import { GAME_CONFIG, getLaneX } from '../config'

export function createLaneSystem() {
  let currentLane = 1
  let targetX = getLaneX(currentLane)
  let currentX = targetX
  let tiltAngle = 0

  const TILT_MAX = 12
  const TILT_DECAY = 8
  const MOVE_SPEED = 14

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
      return Math.abs(currentX - targetX) > 2
    },

    moveLeft(): boolean {
      if (currentLane > 0) {
        currentLane--
        targetX = getLaneX(currentLane)
        tiltAngle = -TILT_MAX
        return true
      }
      return false
    },

    moveRight(): boolean {
      if (currentLane < GAME_CONFIG.LANES - 1) {
        currentLane++
        targetX = getLaneX(currentLane)
        tiltAngle = TILT_MAX
        return true
      }
      return false
    },

    update(dt: number) {
      const clampedDt = Math.min(dt, 0.05)

      // Smooth movement
      const diff = targetX - currentX
      const lerp = 1 - Math.exp(-MOVE_SPEED * clampedDt)
      currentX += diff * lerp

      // Snap when close
      if (Math.abs(diff) < 1) {
        currentX = targetX
      }

      // Tilt decay
      if (Math.abs(tiltAngle) > 0.5) {
        tiltAngle *= Math.exp(-TILT_DECAY * clampedDt)
      } else {
        tiltAngle = 0
      }
    },

    reset() {
      currentLane = 1
      targetX = getLaneX(1)
      currentX = targetX
      tiltAngle = 0
    }
  }
}

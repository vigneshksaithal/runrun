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
      // Clamp dt to prevent physics explosions on tab switch/lag spikes
      const clampedDt = Math.min(dt, 0.05)
      
      // Smooth lerp to target lane using proper exponential smoothing
      // Formula: current = current + (target - current) * (1 - e^(-speed * dt))
      const lerpFactor = 1 - Math.exp(-12 * clampedDt)
      const diff = targetX - currentX
      currentX += diff * lerpFactor

      // Snap when very close
      if (Math.abs(diff) < 0.5) {
        currentX = targetX
        isMoving = false
      }

      // Decay tilt back to 0 using exponential decay
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
      isMoving = false
    }
  }
}

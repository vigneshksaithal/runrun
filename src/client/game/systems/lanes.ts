import { GAME_CONFIG, getLaneX } from '../config'

export function createLaneSystem() {
  let currentLane = 1 // 0=left, 1=center, 2=right
  let targetX = getLaneX(currentLane)
  let currentX = targetX
  let tiltAngle = 0
  let isMoving = false
  let lastMoveDirection: 'left' | 'right' | null = null

  const TILT_MAX = 15 // degrees
  const TILT_DECAY = 10 // speed of tilt return to 0

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

    getLastMoveDirection(): 'left' | 'right' | null {
      return lastMoveDirection
    },

    moveLeft(): boolean {
      if (currentLane > 0) {
        currentLane--
        targetX = getLaneX(currentLane)
        tiltAngle = -TILT_MAX
        isMoving = true
        lastMoveDirection = 'left'
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
        lastMoveDirection = 'right'
        return true
      }
      return false
    },

    update(dt: number) {
      // Clamp dt to prevent physics explosions on tab switch/lag spikes
      const clampedDt = Math.min(dt, 0.05)
      
      // Snappier lerp (18 instead of 12 for faster lane switching)
      const lerpFactor = 1 - Math.exp(-18 * clampedDt)
      const diff = targetX - currentX
      currentX += diff * lerpFactor

      // Snap when very close
      if (Math.abs(diff) < 0.5) {
        currentX = targetX
        isMoving = false
        lastMoveDirection = null
      }

      // Decay tilt back to 0 using exponential decay (faster decay)
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
      lastMoveDirection = null
    }
  }
}

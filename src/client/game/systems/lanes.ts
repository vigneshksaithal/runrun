import { GAME_CONFIG, getLaneX } from '../config'

export function createLaneSystem() {
  let currentLane = 1 // 0=left, 1=center, 2=right
  let targetX = getLaneX(currentLane)
  let currentX = targetX
  let tiltAngle = 0
  let isMoving = false
  let velocity = 0

  const TILT_MAX = 18 // degrees (more dramatic tilt)
  const TILT_DECAY = 10 // speed of tilt return
  const MOVE_SPEED = 16 // smoother, faster lane switching
  const SNAP_THRESHOLD = 1.5

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
        velocity = -Math.abs(targetX - currentX) * 0.3 // Add velocity boost
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
        velocity = Math.abs(targetX - currentX) * 0.3 // Add velocity boost
        return true
      }
      return false
    },

    update(dt: number) {
      // Clamp dt to prevent issues on tab switch/lag
      const clampedDt = Math.min(dt, 0.05)

      // Smooth exponential interpolation for fluid movement
      const lerpFactor = 1 - Math.exp(-MOVE_SPEED * clampedDt)
      const diff = targetX - currentX
      
      // Apply velocity for snappier feel
      velocity *= 0.92 // Decay velocity
      currentX += diff * lerpFactor + velocity * clampedDt

      // Snap when very close
      if (Math.abs(diff) < SNAP_THRESHOLD) {
        currentX = targetX
        isMoving = false
        velocity = 0
      }

      // Smooth tilt decay
      if (Math.abs(tiltAngle) > 0.3) {
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
      velocity = 0
    }
  }
}

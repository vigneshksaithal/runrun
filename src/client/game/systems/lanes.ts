import { GAME_CONFIG, getLaneX } from '../config'

type LaneState = 'idle' | 'anticipating' | 'moving'

export function createLaneSystem() {
  let currentLane = 1 // 0=left, 1=center, 2=right
  let pendingLane = 1
  let targetX = getLaneX(currentLane)
  let currentX = targetX
  let tiltAngle = 0
  let isMoving = false
  let state: LaneState = 'idle'
  let anticipationTimer = 0

  const TILT_MAX = 15 // degrees
  const TILT_DECAY = 8 // speed of tilt return to 0
  const ANTICIPATION_DURATION = 0.05 // 50ms visual anticipation before movement

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
      return isMoving || state === 'anticipating'
    },

    moveLeft(): boolean {
      if (currentLane > 0 && state === 'idle') {
        state = 'anticipating'
        anticipationTimer = 0
        // Partial tilt to telegraph upcoming movement
        tiltAngle = -TILT_MAX * 0.6
        pendingLane = currentLane - 1
        return true
      }
      return false
    },

    moveRight(): boolean {
      if (currentLane < GAME_CONFIG.LANES - 1 && state === 'idle') {
        state = 'anticipating'
        anticipationTimer = 0
        tiltAngle = TILT_MAX * 0.6
        pendingLane = currentLane + 1
        return true
      }
      return false
    },

    update(dt: number) {
      // Anticipation phase: hold visual tilt, then commit movement
      if (state === 'anticipating') {
        anticipationTimer += dt
        if (anticipationTimer >= ANTICIPATION_DURATION) {
          // Commit to movement
          const direction = pendingLane > currentLane ? 1 : -1
          currentLane = pendingLane
          targetX = getLaneX(currentLane)
          tiltAngle = TILT_MAX * direction
          isMoving = true
          state = 'moving'
        }
        return
      }

      // Smooth lerp to target lane
      const diff = targetX - currentX
      currentX += diff * GAME_CONFIG.LANE_SWITCH_SPEED

      // Snap when very close
      if (Math.abs(diff) < 0.5) {
        currentX = targetX
        isMoving = false
        if (state === 'moving') state = 'idle'
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
      pendingLane = 1
      targetX = getLaneX(1)
      currentX = targetX
      tiltAngle = 0
      isMoving = false
      state = 'idle'
      anticipationTimer = 0
    }
  }
}

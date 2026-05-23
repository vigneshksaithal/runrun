import type { KAPLAYCtx } from 'kaplay'

export type GameInput = 'left' | 'right' | 'jump' | 'slide' | null

interface TouchState {
  startX: number
  startY: number
  startTime: number
}

const SWIPE_THRESHOLD = 25
const SWIPE_TIME_LIMIT = 350
// Vertical swipes shorter than this don't count as a jump/slide gesture; that
// way slow vertical drags pass through as page scrolls and only quick flicks
// are interpreted as game input.
const VERTICAL_SWIPE_MIN_VELOCITY = 0.6 // px/ms

export function createInputSystem(k: KAPLAYCtx) {
  let pendingInput: GameInput = null
  let touchState: TouchState | null = null

  // Keyboard input
  k.onKeyPress('left', () => { pendingInput = 'left' })
  k.onKeyPress('right', () => { pendingInput = 'right' })
  k.onKeyPress('up', () => { pendingInput = 'jump' })
  k.onKeyPress('down', () => { pendingInput = 'slide' })
  k.onKeyPress('a', () => { pendingInput = 'left' })
  k.onKeyPress('d', () => { pendingInput = 'right' })
  k.onKeyPress('w', () => { pendingInput = 'jump' })
  k.onKeyPress('s', () => { pendingInput = 'slide' })
  k.onKeyPress('space', () => { pendingInput = 'jump' })

  // Touch/mouse input via swipe detection
  k.onMousePress(() => {
    const pos = k.mousePos()
    touchState = { startX: pos.x, startY: pos.y, startTime: Date.now() }
  })

  k.onMouseRelease(() => {
    if (!touchState) return

    const pos = k.mousePos()
    const dx = pos.x - touchState.startX
    const dy = pos.y - touchState.startY
    const dt = Date.now() - touchState.startTime

    if (dt > SWIPE_TIME_LIMIT) {
      touchState = null
      return
    }

    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)

    if (absDx > SWIPE_THRESHOLD || absDy > SWIPE_THRESHOLD) {
      if (absDx > absDy) {
        pendingInput = dx > 0 ? 'right' : 'left'
      } else {
        // Only count quick vertical flicks as jump/slide so that slow
        // vertical drags can scroll the Reddit page through the iframe.
        const velocity = absDy / Math.max(dt, 1)
        if (velocity >= VERTICAL_SWIPE_MIN_VELOCITY) {
          pendingInput = dy < 0 ? 'jump' : 'slide'
        }
      }
    }

    touchState = null
  })

  // Direct touch events (Kaplay forwards these)
  k.onTouchStart((pos) => {
    touchState = { startX: pos.x, startY: pos.y, startTime: Date.now() }
  })

  k.onTouchEnd((pos) => {
    if (!touchState) return

    const dx = pos.x - touchState.startX
    const dy = pos.y - touchState.startY
    const dt = Date.now() - touchState.startTime

    if (dt > SWIPE_TIME_LIMIT) {
      touchState = null
      return
    }

    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)

    if (absDx > SWIPE_THRESHOLD || absDy > SWIPE_THRESHOLD) {
      if (absDx > absDy) {
        pendingInput = dx > 0 ? 'right' : 'left'
      } else {
        const velocity = absDy / Math.max(dt, 1)
        if (velocity >= VERTICAL_SWIPE_MIN_VELOCITY) {
          pendingInput = dy < 0 ? 'jump' : 'slide'
        }
      }
    }

    touchState = null
  })

  return {
    consume(): GameInput {
      const input = pendingInput
      pendingInput = null
      return input
    },
    peek(): GameInput {
      return pendingInput
    }
  }
}

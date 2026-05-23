import type { KAPLAYCtx } from 'kaplay'

export type GameInput = 'left' | 'right' | 'jump' | 'slide' | null

interface TouchState {
  startX: number
  startY: number
  startTime: number
}

const SWIPE_THRESHOLD = 25
const SWIPE_TIME_LIMIT = 350

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
        pendingInput = dy < 0 ? 'jump' : 'slide'
      }
    }

    touchState = null
  })

  // Also support direct touch events via native listeners (passive: true so
  // vertical scrolling is never blocked on the parent Reddit page).
  // We only claim horizontal swipes and upward/downward flicks as game input.
  window.addEventListener('touchstart', (e: TouchEvent) => {
    if (e.touches.length !== 1) return
    const t = e.touches[0]
    touchState = { startX: t.clientX, startY: t.clientY, startTime: Date.now() }
  }, { passive: true })

  window.addEventListener('touchend', (e: TouchEvent) => {
    if (!touchState) return
    const t = e.changedTouches[0]
    if (!t) { touchState = null; return }

    const dx = t.clientX - touchState.startX
    const dy = t.clientY - touchState.startY
    const elapsed = Date.now() - touchState.startTime

    touchState = null

    if (elapsed > SWIPE_TIME_LIMIT) return

    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)

    if (absDx > SWIPE_THRESHOLD || absDy > SWIPE_THRESHOLD) {
      if (absDx > absDy) {
        // Horizontal swipe → lane change
        pendingInput = dx > 0 ? 'right' : 'left'
      } else {
        // Vertical swipe → jump / slide
        pendingInput = dy < 0 ? 'jump' : 'slide'
      }
    }
  }, { passive: true })

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

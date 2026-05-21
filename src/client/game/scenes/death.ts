import type { KAPLAYCtx } from 'kaplay'
import { GAME_CONFIG } from '../config'

const C = GAME_CONFIG.COLORS

export function createDeathScene(k: KAPLAYCtx) {
  k.scene('death', (params: { score?: number; coins?: number; isNewHigh?: boolean }) => {
    const score = params?.score ?? 0
    const coins = params?.coins ?? 0
    const isNewHigh = params?.isNewHigh ?? false

    // Dark overlay
    k.add([
      k.rect(GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT),
      k.pos(0, 0),
      k.color(10, 8, 6),
      k.opacity(0.9),
      k.z(0),
    ])

    // Score
    k.add([
      k.text('GAME OVER', { size: 36 }),
      k.pos(GAME_CONFIG.WIDTH / 2, 280),
      k.anchor('center'),
      k.color(...C.TEXT_WHITE),
      k.z(10),
    ])

    k.add([
      k.text(`Score: ${score}`, { size: 28 }),
      k.pos(GAME_CONFIG.WIDTH / 2, 340),
      k.anchor('center'),
      k.color(...C.TEXT_GOLD),
      k.scale(1),
      k.z(10),
    ])

    if (isNewHigh) {
      k.add([
        k.text('NEW BEST!', { size: 22 }),
        k.pos(GAME_CONFIG.WIDTH / 2, 380),
        k.anchor('center'),
        k.color(...C.COMBO_TEXT),
        k.z(10),
      ])
    }

    k.add([
      k.text(`Coins: ${coins}`, { size: 20 }),
      k.pos(GAME_CONFIG.WIDTH / 2, 420),
      k.anchor('center'),
      k.color(...C.TEXT_GOLD),
      k.z(10),
    ])

    // TAP TO PLAY
    const tapText = k.add([
      k.text('TAP TO PLAY', { size: 24 }),
      k.pos(GAME_CONFIG.WIDTH / 2, 520),
      k.anchor('center'),
      k.color(...C.TEXT_WHITE),
      k.opacity(1),
      k.scale(1),
      k.z(10),
    ])

    let tapPulse = 0
    tapText.onUpdate(() => {
      tapPulse += k.dt() * 3
      tapText.opacity = 0.5 + Math.sin(tapPulse) * 0.5
    })

    // Restart on input
    let canRestart = true
    k.onKeyPress(() => {
      if (canRestart) {
        canRestart = false
        k.go('game')
      }
    })
    k.onMousePress(() => {
      if (canRestart) {
        canRestart = false
        k.go('game')
      }
    })
    k.onTouchStart(() => {
      if (canRestart) {
        canRestart = false
        k.go('game')
      }
    })

    // Auto-restart after 2s
    k.wait(2.0, () => {
      if (canRestart) {
        canRestart = false
        k.go('game')
      }
    })
  })
}

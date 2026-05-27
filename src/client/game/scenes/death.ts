import type { KAPLAYCtx } from 'kaplay'
import { GAME_CONFIG } from '../config'

const C = GAME_CONFIG.COLORS

export interface DeathPayload {
  score: number
  coins: number
  isNewHigh: boolean
  playerX: number
  playerY: number
}

export function createDeathScene(k: KAPLAYCtx) {
  k.scene('death', (params: DeathPayload) => {
    const score = params?.score ?? 0
    const coins = params?.coins ?? 0
    const isNewHigh = params?.isNewHigh ?? false


    // === DARK OVERLAY (slides in from top) ===
    const overlay = k.add([
      k.rect(GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT),
      k.pos(0, -GAME_CONFIG.HEIGHT),
      k.color(10, 16, 14),
      k.opacity(0.9),
      k.z(260),
    ])
    k.tween(
      -GAME_CONFIG.HEIGHT,
      0,
      0.35,
      (v: number) => { if (overlay.exists()) overlay.pos.y = v },
      k.easings.easeOutCubic,
    )

    // === SCORE DISPLAY (appears after overlay lands) ===
    k.wait(0.4, () => {
      // GAME OVER title with slam-in
      const title = k.add([
        k.text('GAME OVER', { size: 40 }),
        k.pos(GAME_CONFIG.WIDTH / 2, 220),
        k.anchor('center'),
        k.color(...C.TEXT_WHITE),
        k.scale(2.2),
        k.opacity(0),
        k.z(270),
      ])
      k.tween(2.2, 1, 0.2, (v: number) => { if (title.exists()) title.scaleTo(v) }, k.easings.easeOutQuad)
      k.tween(0, 1, 0.15, (v: number) => { if (title.exists()) title.opacity = v })

      // Title glow shadow
      k.add([
        k.text('GAME OVER', { size: 40 }),
        k.pos(GAME_CONFIG.WIDTH / 2 + 2, 222),
        k.anchor('center'),
        k.color(...C.CRYSTAL_GREEN),
        k.opacity(0.3),
        k.z(269),
      ])


      // Score counter (grows from 0 to final)
      const scoreLabel = k.add([
        k.text('0', { size: 48 }),
        k.pos(GAME_CONFIG.WIDTH / 2, 310),
        k.anchor('center'),
        k.color(...C.TEXT_GOLD),
        k.scale(1),
        k.z(270),
      ])
      // Score shadow
      k.add([
        k.text('0', { size: 48 }),
        k.pos(GAME_CONFIG.WIDTH / 2 + 2, 312),
        k.anchor('center'),
        k.color(0, 0, 0),
        k.opacity(0.4),
        k.z(269),
        'deathScoreShadow',
      ])
      let displayedScore = 0
      const scoreSpeed = Math.max(score / 0.6, 50)
      scoreLabel.onUpdate(() => {
        if (displayedScore < score) {
          displayedScore = Math.min(score, displayedScore + scoreSpeed * k.dt())
          const s = String(Math.floor(displayedScore))
          scoreLabel.text = s
          const shadows = k.get('deathScoreShadow')
          for (const sh of shadows) { if (sh.exists()) sh.text = s }
        }
      })

      // NEW BEST badge
      if (isNewHigh) {
        k.wait(0.5, () => {
          const badge = k.add([
            k.text('NEW BEST!', { size: 24 }),
            k.pos(GAME_CONFIG.WIDTH / 2, 370),
            k.anchor('center'),
            k.color(...C.COMBO_TEXT),
            k.scale(1.8),
            k.opacity(0),
            k.z(270),
          ])
          k.tween(1.8, 1, 0.2, (v: number) => { if (badge.exists()) badge.scaleTo(v) }, k.easings.easeOutQuad)
          k.tween(0, 1, 0.15, (v: number) => { if (badge.exists()) badge.opacity = v })
          // Sparkle particles
          for (let i = 0; i < 6; i++) {
            k.add([
              k.rect(4, 4, { radius: 2 }),
              k.pos(GAME_CONFIG.WIDTH / 2 + k.rand(-50, 50), 370),
              k.anchor('center'),
              k.color(...C.PARTICLE_GOLD),
              k.opacity(0.8),
              k.lifespan(0.4, { fade: 0.3 }),
              k.move(k.rand(0, 360), k.rand(50, 100)),
              k.z(271),
            ])
          }
        })
      }


      // Coins display
      k.add([
        k.rect(14, 14, { radius: 7 }),
        k.pos(GAME_CONFIG.WIDTH / 2 - 50, 420),
        k.anchor('center'),
        k.color(...C.COIN),
        k.z(270),
      ])
      k.add([
        k.text(`${coins}`, { size: 22 }),
        k.pos(GAME_CONFIG.WIDTH / 2 - 25, 420),
        k.anchor('left'),
        k.color(...C.TEXT_GOLD),
        k.z(270),
      ])

      // === RETRY BUTTON (pulsing) ===
      const retryBtn = k.add([
        k.rect(180, 56, { radius: 8 }),
        k.pos(GAME_CONFIG.WIDTH / 2, 520),
        k.anchor('center'),
        k.color(...C.BUTTON_GREEN),
        k.scale(1),
        k.z(270),
      ])
      retryBtn.add([
        k.rect(180, 18, { radius: 6 }),
        k.color(...C.BUTTON_GREEN_DARK),
        k.anchor('bot'),
        k.pos(0, 28),
      ])
      retryBtn.add([
        k.text('TAP TO RETRY', { size: 22 }),
        k.color(...C.TEXT_WHITE),
        k.anchor('center'),
        k.pos(0, -4),
      ])

      // Pulse animation
      let pulseT = 0
      retryBtn.onUpdate(() => {
        pulseT += k.dt() * 3.5
        const s = 1 + Math.sin(pulseT) * 0.05
        retryBtn.scaleTo(s)
      })

      // Restart with fade-to-black
      let canRestart = true
      const restart = () => {
        if (!canRestart) return
        canRestart = false
        const fadeOut = k.add([
          k.rect(GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT),
          k.pos(0, 0),
          k.color(0, 0, 0),
          k.opacity(0),
          k.z(300),
        ])
        k.tween(0, 1, 0.12, (v: number) => { if (fadeOut.exists()) fadeOut.opacity = v }, k.easings.easeOutQuad)
        k.wait(0.14, () => { k.go('game') })
      }
      k.onKeyPress(restart)
      k.onMousePress(restart)
      k.onTouchStart(restart)

      // Auto-restart after 3.5s
      k.wait(3.5, () => { if (canRestart) restart() })
    })
  })
}

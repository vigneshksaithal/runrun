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
    const px = params?.playerX ?? GAME_CONFIG.VANISHING_POINT_X
    const py = params?.playerY ?? GAME_CONFIG.PLAYER_Y

    // === DEATH VFX (plays on scene entry) ===

    // Screen shake on entry
    k.shake(12)

    // Red flash overlay (fades out quickly)
    const flash = k.add([
      k.rect(GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT),
      k.pos(0, 0),
      k.color(220, 40, 40),
      k.opacity(0.5),
      k.z(300),
    ])
    k.tween(
      0.5,
      0,
      0.25,
      (v: number) => { if (flash.exists()) flash.opacity = v },
      k.easings.easeOutQuad,
    )
    k.wait(0.3, () => { if (flash.exists()) flash.destroy() })

    // Voxel chunk explosion from player position - reduced to 6 particles using built-in move()
    const chunkColors: [number, number, number][] = [
      C.PLAYER_BODY, C.PLAYER_HEAD, C.PLAYER_HAIR,
      C.PLAYER_LEGS, C.PLAYER_BODY, C.PLAYER_HEAD,
    ]
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * 360
      const color = chunkColors[i]!
      k.add([
        k.rect(k.rand(8, 14), k.rand(8, 14)),
        k.pos(px, py - 30),
        k.anchor('center'),
        k.color(color[0], color[1], color[2]),
        k.opacity(1),
        k.z(250),
        k.lifespan(0.5, { fade: 0.35 }),
        k.move(angle, k.rand(150, 280)),
      ])
    }

    // === DARK OVERLAY (slides in from top) ===
    const overlay = k.add([
      k.rect(GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT),
      k.pos(0, -GAME_CONFIG.HEIGHT),
      k.color(10, 16, 14),
      k.opacity(0.88),
      k.z(260),
    ])
    k.tween(
      -GAME_CONFIG.HEIGHT,
      0,
      0.4,
      (v: number) => { if (overlay.exists()) overlay.pos.y = v },
      k.easings.easeOutCubic,
    )

    // === SCORE DISPLAY (appears after overlay lands) ===
    k.wait(0.45, () => {
      // GAME OVER title with slam-in
      const title = k.add([
        k.text('GAME OVER', { size: 38 }),
        k.pos(GAME_CONFIG.WIDTH / 2, 240),
        k.anchor('center'),
        k.color(...C.TEXT_WHITE),
        k.scale(2),
        k.opacity(0),
        k.z(270),
      ])
      k.tween(2, 1, 0.2, (v: number) => { if (title.exists()) title.scaleTo(v) }, k.easings.easeOutQuad)
      k.tween(0, 1, 0.15, (v: number) => { if (title.exists()) title.opacity = v })

      // Score counter (grows from 0 to final)
      const scoreLabel = k.add([
        k.text('0', { size: 44 }),
        k.pos(GAME_CONFIG.WIDTH / 2, 320),
        k.anchor('center'),
        k.color(...C.TEXT_GOLD),
        k.scale(1),
        k.z(270),
      ])
      let displayedScore = 0
      const scoreSpeed = Math.max(score / 0.6, 50)
      scoreLabel.onUpdate(() => {
        if (displayedScore < score) {
          displayedScore = Math.min(score, displayedScore + scoreSpeed * k.dt())
          scoreLabel.text = String(Math.floor(displayedScore))
        }
      })

      // NEW BEST badge
      if (isNewHigh) {
        k.wait(0.5, () => {
          const badge = k.add([
            k.text('NEW BEST!', { size: 24 }),
            k.pos(GAME_CONFIG.WIDTH / 2, 375),
            k.anchor('center'),
            k.color(...C.COMBO_TEXT),
            k.scale(1.8),
            k.opacity(0),
            k.z(270),
          ])
          k.tween(1.8, 1, 0.2, (v: number) => { if (badge.exists()) badge.scaleTo(v) }, k.easings.easeOutQuad)
          k.tween(0, 1, 0.15, (v: number) => { if (badge.exists()) badge.opacity = v })

          // Confetti rain (gated on isNewHigh) — 8 colorful rects falling with
          // horizontal drift, fired 0.3s after the badge so it lands as a
          // celebration cue rather than competing with the badge entrance.
          k.wait(0.3, () => {
            const palette = C.CONFETTI
            for (let i = 0; i < 8; i++) {
              const color = palette[i % palette.length]!
              const startX = k.rand(60, GAME_CONFIG.WIDTH - 60)
              const drift = k.rand(-40, 40)
              const fallSpeed = k.rand(80, 160)
              const w = k.rand(6, 10)
              const h = k.rand(8, 12)
              const piece = k.add([
                k.rect(w, h),
                k.pos(startX, 200),
                k.anchor('center'),
                k.color(color[0], color[1], color[2]),
                k.opacity(1),
                k.rotate(k.rand(0, 360)),
                k.lifespan(2.5, { fade: 1.0 }),
                k.z(271),
                { spin: k.rand(-180, 180), driftAmt: drift, fall: fallSpeed, t: 0 },
              ])
              piece.onUpdate(() => {
                if (!piece.exists()) return
                const dt = k.dt()
                piece.t += dt
                piece.pos.y += piece.fall * dt
                piece.pos.x += piece.driftAmt * dt
                piece.angle += piece.spin * dt
              })
            }
          })
        })
      }

      // Coins display (round coin icon to match in-game)
      k.add([
        k.circle(8),
        k.pos(GAME_CONFIG.WIDTH / 2 - 50, 420),
        k.anchor('center'),
        k.color(...C.COIN),
        k.z(270),
      ])
      k.add([
        k.circle(3),
        k.pos(GAME_CONFIG.WIDTH / 2 - 50, 420),
        k.anchor('center'),
        k.color(...C.COIN_STAR),
        k.z(271),
      ])
      k.add([
        k.text(`${coins}`, { size: 22 }),
        k.pos(GAME_CONFIG.WIDTH / 2 - 35, 420),
        k.anchor('left'),
        k.color(...C.TEXT_GOLD),
        k.z(270),
      ])

      // === RETRY BUTTON (pulsing) ===
      const retryBtn = k.add([
        k.rect(180, 56, { radius: 6 }),
        k.pos(GAME_CONFIG.WIDTH / 2, 530),
        k.anchor('center'),
        k.color(...C.BUTTON_GREEN),
        k.scale(1),
        k.z(270),
      ])
      retryBtn.add([
        k.rect(180, 18, { radius: 4 }),
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

      // Restart on input
      let canRestart = true
      const restart = () => {
        if (canRestart) {
          canRestart = false
          k.go('game')
        }
      }
      k.onKeyPress(restart)
      k.onMousePress(restart)
      k.onTouchStart(restart)

      // Auto-restart after 3s
      k.wait(3.0, () => {
        if (canRestart) {
          canRestart = false
          k.go('game')
        }
      })
    })
  })
}

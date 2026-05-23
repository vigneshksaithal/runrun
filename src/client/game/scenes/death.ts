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

    // Voxel chunk explosion from player position
    const chunkColors: [number, number, number][] = [
      C.PLAYER_BODY, C.PLAYER_HEAD, C.PLAYER_HAIR,
      C.PLAYER_LEGS, C.PLAYER_BODY, C.PLAYER_HEAD,
      C.PLAYER_HAIR, C.PLAYER_LEGS, C.PLAYER_BODY, C.PLAYER_HEAD,
    ]
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2
      const speed = k.rand(120, 320)
      const size = k.rand(8, 16)
      const color = chunkColors[i % chunkColors.length]!
      const chunk = k.add([
        k.rect(size, size),
        k.pos(px, py - 30),
        k.anchor('center'),
        k.color(color[0], color[1], color[2]),
        k.opacity(1),
        k.scale(1),
        k.z(250),
        k.move(k.Vec2.fromAngle(k.rad2deg(angle)), speed),
        { vy: k.rand(-300, -100) as number, spin: k.rand(-400, 400) as number },
      ])
      // Gravity + spin
      chunk.onUpdate(() => {
        if (!chunk.exists()) return
        chunk.vy += 800 * k.dt()
        chunk.pos.y += chunk.vy * k.dt()
        chunk.angle += chunk.spin * k.dt()
        chunk.opacity -= k.dt() * 1.2
        if (chunk.opacity <= 0) chunk.destroy()
      })
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
        })
      }

      // Coins display
      k.add([
        k.rect(14, 12),
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

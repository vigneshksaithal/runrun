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
    k.shake(12)

    // Red flash overlay (fades out quickly)
    const flash = k.add([
      k.rect(GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT),
      k.pos(0, 0),
      k.color(220, 40, 40),
      k.opacity(0.5),
      k.z(300),
    ])
    k.tween(0.5, 0, 0.25, (v: number) => { if (flash.exists()) flash.opacity = v }, k.easings.easeOutQuad)
    k.wait(0.3, () => { if (flash.exists()) flash.destroy() })

    // Chunk explosion from player position (player colors)
    const chunkColors: [number, number, number][] = [
      C.HOODIE, C.CAP, C.JEANS,
      C.SHOE, C.BACKPACK, C.HOODIE,
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

    // === DARK PANEL (slides in from top) ===
    const overlay = k.add([
      k.rect(GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT),
      k.pos(0, -GAME_CONFIG.HEIGHT),
      k.color(...C.PANEL),
      k.opacity(0.9),
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
      const title = k.add([
        k.text('GAME OVER', { size: 40 }),
        k.pos(GAME_CONFIG.WIDTH / 2, 240),
        k.anchor('center'),
        k.color(...C.TEXT_WHITE),
        k.scale(2),
        k.opacity(0),
        k.z(270),
      ])
      k.tween(2, 1, 0.2, (v: number) => { if (title.exists()) title.scaleTo(v) }, k.easings.easeOutQuad)
      k.tween(0, 1, 0.15, (v: number) => { if (title.exists()) title.opacity = v })

      const scoreLabel = k.add([
        k.text('0', { size: 46 }),
        k.pos(GAME_CONFIG.WIDTH / 2, 320),
        k.anchor('center'),
        k.color(...C.TEXT_GOLD),
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
        k.circle(10),
        k.pos(GAME_CONFIG.WIDTH / 2 - 50, 422),
        k.anchor('center'),
        k.color(...C.COIN),
        k.outline(2, k.rgb(...C.COIN_DARK)),
        k.z(270),
      ])
      k.add([
        k.text(`${coins}`, { size: 22 }),
        k.pos(GAME_CONFIG.WIDTH / 2 - 28, 420),
        k.anchor('left'),
        k.color(...C.TEXT_GOLD),
        k.z(270),
      ])

      // === RETRY BUTTON (pulsing) ===
      const retryBtn = k.add([
        k.rect(190, 58, { radius: 12 }),
        k.pos(GAME_CONFIG.WIDTH / 2, 530),
        k.anchor('center'),
        k.color(...C.BUTTON_GREEN),
        k.scale(1),
        k.z(270),
      ])
      retryBtn.add([k.rect(190, 18, { radius: 8 }), k.color(...C.BUTTON_GREEN_DARK), k.anchor('bot'), k.pos(0, 29)])
      retryBtn.add([k.text('TAP TO RETRY', { size: 22 }), k.color(...C.TEXT_WHITE), k.anchor('center'), k.pos(0, -4)])

      let pulseT = 0
      retryBtn.onUpdate(() => {
        pulseT += k.dt() * 3.5
        retryBtn.scaleTo(1 + Math.sin(pulseT) * 0.05)
      })

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

      k.wait(3.0, () => {
        if (canRestart) {
          canRestart = false
          k.go('game')
        }
      })
    })
  })
}

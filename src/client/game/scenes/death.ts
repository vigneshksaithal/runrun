import type { KAPLAYCtx } from 'kaplay'
import { GAME_CONFIG } from '../config'
import { createDeathParticles } from '../objects/player'

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

    // === DEATH VFX ===

    // Screen shake
    k.shake(15)

    // Red flash overlay
    const flash = k.add([
      k.rect(GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT),
      k.pos(0, 0),
      k.color(255, 40, 40),
      k.opacity(0.5),
      k.z(300),
    ])
    k.tween(
      0.5,
      0,
      0.3,
      (v: number) => { if (flash.exists()) flash.opacity = v },
      k.easings.easeOutQuad,
    )
    k.wait(0.35, () => { if (flash.exists()) flash.destroy() })

    // Player explosion particles
    createDeathParticles(k, px, py)

    // === BACKGROUND (blurred game state illusion) ===
    // Sky colors
    k.add([
      k.rect(GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT * 0.4),
      k.pos(0, 0),
      k.color(...C.SKY_TOP),
      k.z(0),
    ])
    k.add([
      k.rect(GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT * 0.3),
      k.pos(0, GAME_CONFIG.HEIGHT * 0.35),
      k.color(...C.SKY_MID),
      k.z(0),
    ])
    k.add([
      k.rect(GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT * 0.4),
      k.pos(0, GAME_CONFIG.HEIGHT * 0.6),
      k.color(...C.SKY_BOTTOM),
      k.z(0),
    ])

    // Track
    k.add([
      k.rect(GAME_CONFIG.WIDTH, 300),
      k.pos(0, 500),
      k.color(...C.TRACK_MAIN),
      k.z(1),
    ])

    // === DARK OVERLAY (slides in) ===
    const overlay = k.add([
      k.rect(GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT),
      k.pos(0, -GAME_CONFIG.HEIGHT),
      k.color(0, 0, 0),
      k.opacity(0.85),
      k.z(260),
    ])
    k.tween(
      -GAME_CONFIG.HEIGHT,
      0,
      0.45,
      (v: number) => { if (overlay.exists()) overlay.pos.y = v },
      k.easings.easeOutCubic,
    )

    // === SCORE DISPLAY (appears after overlay) ===
    k.wait(0.5, () => {
      // GAME OVER title with slam animation
      const titleShadow = k.add([
        k.text('GAME OVER', { size: 44 }),
        k.pos(GAME_CONFIG.WIDTH / 2 + 3, 203),
        k.anchor('center'),
        k.color(...C.TEXT_SHADOW),
        k.scale(2.5),
        k.opacity(0),
        k.z(270),
      ])

      const title = k.add([
        k.text('GAME OVER', { size: 44 }),
        k.pos(GAME_CONFIG.WIDTH / 2, 200),
        k.anchor('center'),
        k.color(...C.TEXT_WHITE),
        k.scale(2.5),
        k.opacity(0),
        k.z(271),
      ])

      // Slam in animation
      k.tween(2.5, 1, 0.25, (v: number) => {
        if (title.exists()) title.scaleTo(v)
        if (titleShadow.exists()) titleShadow.scaleTo(v)
      }, k.easings.easeOutBack)
      k.tween(0, 1, 0.2, (v: number) => {
        if (title.exists()) title.opacity = v
        if (titleShadow.exists()) titleShadow.opacity = v * 0.4
      })

      // Score panel background
      k.add([
        k.rect(220, 120),
        k.pos(GAME_CONFIG.WIDTH / 2, 330),
        k.anchor('center'),
        k.color(0, 0, 0),
        k.opacity(0.5),
        k.z(270),
      ])

      // "SCORE" label
      k.add([
        k.text('SCORE', { size: 18 }),
        k.pos(GAME_CONFIG.WIDTH / 2, 285),
        k.anchor('center'),
        k.color(...C.TEXT_WHITE),
        k.opacity(0.7),
        k.z(271),
      ])

      // Score counter (animates from 0 to final)
      const scoreLabel = k.add([
        k.text('0', { size: 52 }),
        k.pos(GAME_CONFIG.WIDTH / 2, 335),
        k.anchor('center'),
        k.color(...C.TEXT_GOLD),
        k.scale(1),
        k.z(271),
      ])

      let displayedScore = 0
      const scoreSpeed = Math.max(score / 0.7, 80)
      scoreLabel.onUpdate(() => {
        if (displayedScore < score) {
          displayedScore = Math.min(score, displayedScore + scoreSpeed * k.dt())
          scoreLabel.text = String(Math.floor(displayedScore))
        }
      })

      // Score pop when finished counting
      k.wait(0.75, () => {
        k.tween(1, 1.15, 0.1, (v: number) => {
          if (scoreLabel.exists()) scoreLabel.scaleTo(v)
        }, k.easings.easeOutQuad).then(() => {
          k.tween(1.15, 1, 0.1, (v: number) => {
            if (scoreLabel.exists()) scoreLabel.scaleTo(v)
          }, k.easings.easeOutQuad)
        })
      })

      // NEW BEST badge
      if (isNewHigh) {
        k.wait(0.6, () => {
          const badge = k.add([
            k.text('NEW BEST!', { size: 26 }),
            k.pos(GAME_CONFIG.WIDTH / 2, 400),
            k.anchor('center'),
            k.color(...C.COMBO_GREEN),
            k.scale(2),
            k.opacity(0),
            k.z(272),
          ])

          k.tween(2, 1, 0.25, (v: number) => { if (badge.exists()) badge.scaleTo(v) }, k.easings.easeOutBack)
          k.tween(0, 1, 0.2, (v: number) => { if (badge.exists()) badge.opacity = v })

          // Sparkle particles
          for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * 360
            k.wait(0.1 + i * 0.03, () => {
              k.add([
                k.rect(6, 6),
                k.pos(GAME_CONFIG.WIDTH / 2, 400),
                k.anchor('center'),
                k.color(...C.PARTICLE_GOLD),
                k.opacity(1),
                k.lifespan(0.4, { fade: 0.3 }),
                k.move(angle, k.rand(80, 150)),
                k.z(273),
              ])
            })
          }
        })
      }

      // Coins collected
      k.add([
        k.rect(100, 40),
        k.pos(GAME_CONFIG.WIDTH / 2, 460),
        k.anchor('center'),
        k.color(0, 0, 0),
        k.opacity(0.4),
        k.z(270),
      ])

      // Coin icon
      k.add([
        k.rect(22, 22),
        k.pos(GAME_CONFIG.WIDTH / 2 - 35, 460),
        k.anchor('center'),
        k.color(...C.COIN_GOLD),
        k.z(271),
      ])
      k.add([
        k.rect(16, 16),
        k.pos(GAME_CONFIG.WIDTH / 2 - 35, 460),
        k.anchor('center'),
        k.color(...C.COIN_DARK),
        k.opacity(0.4),
        k.z(271),
      ])

      k.add([
        k.text(`${coins}`, { size: 26 }),
        k.pos(GAME_CONFIG.WIDTH / 2 + 5, 460),
        k.anchor('center'),
        k.color(...C.TEXT_GOLD),
        k.z(271),
      ])

      // === RETRY BUTTON ===
      const retryBtn = k.add([
        k.rect(200, 64, { radius: 8 }),
        k.pos(GAME_CONFIG.WIDTH / 2, 560),
        k.anchor('center'),
        k.color(...C.BUTTON_PLAY),
        k.scale(1),
        k.z(272),
      ])

      // Button 3D bottom
      retryBtn.add([
        k.rect(200, 20, { radius: 6 }),
        k.color(...C.BUTTON_PLAY_DARK),
        k.anchor('bot'),
        k.pos(0, 32),
      ])

      // Button text
      retryBtn.add([
        k.text('TAP TO RETRY', { size: 24 }),
        k.color(...C.TEXT_WHITE),
        k.anchor('center'),
        k.pos(0, -5),
      ])

      // Button pulse
      let pulseT = 0
      retryBtn.onUpdate(() => {
        pulseT += k.dt() * 4
        const s = 1 + Math.sin(pulseT) * 0.05
        retryBtn.scaleTo(s)
      })

      // Hint text
      k.add([
        k.text('or wait 3 seconds...', { size: 12 }),
        k.pos(GAME_CONFIG.WIDTH / 2, 610),
        k.anchor('center'),
        k.color(...C.TEXT_WHITE),
        k.opacity(0.5),
        k.z(270),
      ])

      // === RESTART LOGIC ===
      let canRestart = true
      const restart = () => {
        if (canRestart) {
          canRestart = false
          // Fade out transition
          const fadeOut = k.add([
            k.rect(GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT),
            k.pos(0, 0),
            k.color(0, 0, 0),
            k.opacity(0),
            k.z(400),
          ])
          k.tween(0, 1, 0.25, (v: number) => {
            if (fadeOut.exists()) fadeOut.opacity = v
          }, k.easings.easeInQuad).then(() => {
            k.go('game')
          })
        }
      }

      k.onKeyPress(restart)
      k.onMousePress(restart)
      k.onTouchStart(restart)

      // Auto-restart after 3s
      k.wait(3.0, () => {
        if (canRestart) restart()
      })
    })

    // === FLOATING PARTICLES (ambience) ===
    for (let i = 0; i < 6; i++) {
      const p = k.add([
        k.rect(k.rand(4, 8), k.rand(4, 8)),
        k.pos(k.rand(50, 550), k.rand(100, 700)),
        k.anchor('center'),
        k.color(...C.PARTICLE_WHITE),
        k.opacity(k.rand(0.1, 0.25)),
        k.z(265),
      ])

      const startY = p.pos.y
      let t = k.rand(0, Math.PI * 2)
      p.onUpdate(() => {
        t += k.dt() * 0.8
        p.pos.y = startY + Math.sin(t) * 30
        p.pos.x += k.dt() * k.rand(-3, 3)
      })
    }
  })
}

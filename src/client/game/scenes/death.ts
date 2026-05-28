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

    // Effects
    k.shake(12)
    createDeathParticles(k, px, py)

    // Background
    k.add([
      k.rect(GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT * 0.5),
      k.pos(0, 0),
      k.color(...C.SKY_TOP),
      k.z(0),
    ])
    k.add([
      k.rect(GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT * 0.5),
      k.pos(0, GAME_CONFIG.HEIGHT * 0.5),
      k.color(...C.SKY_BOTTOM),
      k.z(0),
    ])
    k.add([
      k.rect(GAME_CONFIG.WIDTH, 300),
      k.pos(0, 500),
      k.color(...C.GROUND),
      k.z(1),
    ])

    // Dark overlay
    const overlay = k.add([
      k.rect(GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT),
      k.pos(0, 0),
      k.color(0, 0, 0),
      k.opacity(0),
      k.z(250),
    ])

    k.tween(0, 0.8, 0.4, (v) => {
      if (overlay.exists()) overlay.opacity = v
    })

    // UI appears after overlay
    k.wait(0.4, () => {
      // Game Over title
      const title = k.add([
        k.text('GAME OVER', { size: 42 }),
        k.pos(GAME_CONFIG.WIDTH / 2, 180),
        k.anchor('center'),
        k.color(...C.TEXT_WHITE),
        k.scale(2),
        k.opacity(0),
        k.z(260),
      ])

      k.tween(2, 1, 0.2, (v) => {
        if (title.exists()) {
          title.scale.x = v
          title.scale.y = v
        }
      }, k.easings.easeOutBack)

      k.tween(0, 1, 0.2, (v) => {
        if (title.exists()) title.opacity = v
      })

      // Score panel
      k.add([
        k.rect(200, 100),
        k.pos(GAME_CONFIG.WIDTH / 2, 310),
        k.anchor('center'),
        k.color(0, 0, 0),
        k.opacity(0.5),
        k.z(260),
      ])

      k.add([
        k.text('SCORE', { size: 16 }),
        k.pos(GAME_CONFIG.WIDTH / 2, 275),
        k.anchor('center'),
        k.color(...C.TEXT_WHITE),
        k.opacity(0.7),
        k.z(261),
      ])

      const scoreLabel = k.add([
        k.text('0', { size: 48 }),
        k.pos(GAME_CONFIG.WIDTH / 2, 320),
        k.anchor('center'),
        k.color(...C.TEXT_GOLD),
        k.z(261),
      ])

      // Animate score counting
      let displayed = 0
      const speed = Math.max(score / 0.6, 100)
      scoreLabel.onUpdate(() => {
        if (displayed < score) {
          displayed = Math.min(score, displayed + speed * k.dt())
          scoreLabel.text = String(Math.floor(displayed))
        }
      })

      // New best badge
      if (isNewHigh) {
        k.wait(0.5, () => {
          const badge = k.add([
            k.text('NEW BEST!', { size: 24 }),
            k.pos(GAME_CONFIG.WIDTH / 2, 380),
            k.anchor('center'),
            k.color(...C.COMBO),
            k.scale(1.5),
            k.opacity(0),
            k.z(262),
          ])

          k.tween(1.5, 1, 0.2, (v) => {
            if (badge.exists()) {
              badge.scale.x = v
              badge.scale.y = v
            }
          }, k.easings.easeOutBack)

          k.tween(0, 1, 0.2, (v) => {
            if (badge.exists()) badge.opacity = v
          })
        })
      }

      // Coins collected
      k.add([
        k.rect(90, 36),
        k.pos(GAME_CONFIG.WIDTH / 2, 440),
        k.anchor('center'),
        k.color(0, 0, 0),
        k.opacity(0.4),
        k.z(260),
      ])

      k.add([
        k.ellipse(12, 12),
        k.pos(GAME_CONFIG.WIDTH / 2 - 30, 440),
        k.anchor('center'),
        k.color(...C.COIN),
        k.z(261),
      ])

      k.add([
        k.text(`${coins}`, { size: 24 }),
        k.pos(GAME_CONFIG.WIDTH / 2 + 5, 440),
        k.anchor('center'),
        k.color(...C.TEXT_GOLD),
        k.z(261),
      ])

      // Retry button
      const btn = k.add([
        k.rect(180, 55),
        k.pos(GAME_CONFIG.WIDTH / 2, 530),
        k.anchor('center'),
        k.color(...C.BUTTON),
        k.z(262),
      ])

      btn.add([
        k.rect(180, 16),
        k.color(...C.BUTTON_DARK),
        k.anchor('bot'),
        k.pos(0, 27),
      ])

      btn.add([
        k.text('TAP TO RETRY', { size: 22 }),
        k.color(...C.TEXT_WHITE),
        k.anchor('center'),
        k.pos(0, -3),
      ])

      let pulse = 0
      btn.onUpdate(() => {
        pulse += k.dt() * 4
        btn.scale.x = btn.scale.y = 1 + Math.sin(pulse) * 0.04
      })

      // Restart
      let canRestart = true
      const restart = () => {
        if (!canRestart) return
        canRestart = false

        const fade = k.add([
          k.rect(GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT),
          k.pos(0, 0),
          k.color(0, 0, 0),
          k.opacity(0),
          k.z(300),
        ])

        k.tween(0, 1, 0.2, (v) => {
          if (fade.exists()) fade.opacity = v
        }).then(() => {
          k.go('game')
        })
      }

      k.onKeyPress(restart)
      k.onMousePress(restart)
      k.onTouchStart(restart)

      // Auto restart
      k.wait(3, () => {
        if (canRestart) restart()
      })
    })
  })
}

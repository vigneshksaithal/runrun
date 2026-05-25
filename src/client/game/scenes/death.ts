import type { KAPLAYCtx } from 'kaplay'
import { GAME_CONFIG } from '../config'
import { shareScore } from '../systems/challenge'

const C = GAME_CONFIG.COLORS

export interface DeathPayload {
  score: number
  coins: number
  isNewHigh: boolean
  playerX: number
  playerY: number
  clutchCount?: number
  challengeScore?: number | null
  challengeBeaten?: boolean
}

export function createDeathScene(k: KAPLAYCtx) {
  k.scene('death', (params: DeathPayload) => {
    const score = params?.score ?? 0
    const coins = params?.coins ?? 0
    const isNewHigh = params?.isNewHigh ?? false
    const px = params?.playerX ?? GAME_CONFIG.VANISHING_POINT_X
    const py = params?.playerY ?? GAME_CONFIG.PLAYER_Y
    const clutchCount = params?.clutchCount ?? 0
    const challengeScore = params?.challengeScore ?? null
    const challengeBeaten = params?.challengeBeaten ?? false

    // === DEATH VFX (plays on scene entry) ===

    // Screen shake on entry - more dramatic
    k.shake(18)

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

    // Voxel chunk explosion from player position - 16 chunks, staggered
    const chunkColors: [number, number, number][] = [
      C.PLAYER_BODY, C.PLAYER_HEAD, C.PLAYER_HAIR,
      C.PLAYER_LEGS, C.PLAYER_BODY, C.PLAYER_HEAD,
      C.PLAYER_HAIR, C.PLAYER_LEGS, C.PLAYER_BODY, C.PLAYER_HEAD,
      C.PLAYER_HAIR, C.PLAYER_LEGS, C.PLAYER_BODY, C.PLAYER_HEAD,
      C.PLAYER_HAIR, C.PLAYER_LEGS,
    ]
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2 + k.rand(-0.2, 0.2)
      const speed = k.rand(150, 380)
      const size = k.rand(10, 20)
      const color = chunkColors[i % chunkColors.length]!
      // Stagger for dramatic ripple effect
      k.wait(i * 0.012, () => {
        const chunk = k.add([
          k.rect(size, size),
          k.pos(px, py - 30),
          k.anchor('center'),
          k.color(color[0], color[1], color[2]),
          k.opacity(1),
          k.scale(1),
          k.z(250),
          k.move(k.Vec2.fromAngle(k.rad2deg(angle)), speed),
          { vy: k.rand(-350, -120) as number, spin: k.rand(-450, 450) as number },
        ])
        // Gravity + spin
        chunk.onUpdate(() => {
          if (!chunk.exists()) return
          chunk.vy += 900 * k.dt()
          chunk.pos.y += chunk.vy * k.dt()
          chunk.angle += chunk.spin * k.dt()
          chunk.opacity -= k.dt() * 1.4
          if (chunk.opacity <= 0) chunk.destroy()
        })
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

      // Clutch saves badge (only if any)
      if (clutchCount > 0) {
        k.add([
          k.text(`${clutchCount} CLUTCH${clutchCount > 1 ? 'ES' : ''}!`, { size: 16 }),
          k.pos(GAME_CONFIG.WIDTH / 2, 452),
          k.anchor('center'),
          k.color(255, 200, 60),
          k.z(270),
        ])
      }

      // Challenge result badge
      if (challengeScore !== null) {
        const label = challengeBeaten
          ? `BEAT ${challengeScore}!`
          : `Target ${challengeScore} — try again`
        const color: [number, number, number] = challengeBeaten
          ? [80, 255, 180]
          : [255, 140, 140]
        k.add([
          k.text(label, { size: 16 }),
          k.pos(GAME_CONFIG.WIDTH / 2, 478),
          k.anchor('center'),
          k.color(...color),
          k.z(270),
        ])
      }

      // === RETRY BUTTON (pulsing) ===
      const retryBtn = k.add([
        k.rect(180, 56, { radius: 6 }),
        k.pos(GAME_CONFIG.WIDTH / 2, 510),
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

      // === SHARE BUTTON (drives K-factor) ===
      const shareBtn = k.add([
        k.rect(180, 46, { radius: 6 }),
        k.pos(GAME_CONFIG.WIDTH / 2, 605),
        k.anchor('center'),
        k.color(70, 140, 220),
        k.scale(1),
        k.z(270),
        'shareBtn',
      ])
      shareBtn.add([
        k.rect(180, 14, { radius: 4 }),
        k.color(50, 100, 180),
        k.anchor('bot'),
        k.pos(0, 23),
      ])
      shareBtn.add([
        k.text('SHARE SCORE', { size: 18 }),
        k.color(...C.TEXT_WHITE),
        k.anchor('center'),
        k.pos(0, -3),
      ])

      // Toast helper
      const showToast = (msg: string) => {
        const toast = k.add([
          k.rect(260, 40, { radius: 8 }),
          k.pos(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT - 70),
          k.anchor('center'),
          k.color(30, 30, 30),
          k.opacity(0.92),
          k.z(310),
        ])
        toast.add([
          k.text(msg, { size: 16 }),
          k.color(...C.TEXT_WHITE),
          k.anchor('center'),
          k.pos(0, 0),
        ])
        k.wait(2.0, () => {
          if (toast.exists()) {
            k.tween(0.92, 0, 0.3, (v: number) => { if (toast.exists()) toast.opacity = v })
            k.wait(0.3, () => { if (toast.exists()) toast.destroy() })
          }
        })
      }

      // Share click handler — async w/ fallback
      let shareInFlight = false
      const handleShare = async () => {
        if (shareInFlight) return
        shareInFlight = true
        try {
          const result = await shareScore(score, coins)
          if (result === 'shared') showToast('Shared!')
          else if (result === 'copied') showToast('Link copied to clipboard!')
          else showToast('Could not share — screenshot to share!')
        } finally {
          shareInFlight = false
        }
      }
      shareBtn.onClick(handleShare)

      // Restart on input — but ignore taps that hit the share button area
      let canRestart = true
      const restart = () => {
        if (!canRestart) return
        // Skip auto-restart if user is hovering the share button area
        canRestart = false
        k.go('game')
      }
      // Restart on key/keyboard only (so taps on share button don't restart)
      k.onKeyPress(restart)

      // Tap-anywhere-to-restart, but exclude share button rectangle
      const isInShareButton = (x: number, y: number) => {
        const dx = Math.abs(x - shareBtn.pos.x)
        const dy = Math.abs(y - shareBtn.pos.y)
        return dx < 100 && dy < 30
      }

      k.onMousePress(() => {
        const m = k.mousePos()
        if (!isInShareButton(m.x, m.y)) restart()
      })
      k.onTouchStart((pos: { x: number; y: number }) => {
        if (!isInShareButton(pos.x, pos.y)) restart()
      })

      // Auto-restart after 5s (extended from 3s to give time to share)
      k.wait(5.0, () => {
        if (canRestart) {
          canRestart = false
          k.go('game')
        }
      })
    })
  })
}

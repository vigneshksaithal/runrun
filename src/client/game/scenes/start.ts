import type { KAPLAYCtx } from 'kaplay'
import { GAME_CONFIG } from '../config'
import { parseChallengeFromUrl } from '../systems/challenge'

const C = GAME_CONFIG.COLORS

export function createStartScene(k: KAPLAYCtx) {
  k.scene('start', () => {
    // Dark blue-green → emerald gradient background (matching game)
    k.add([
      k.rect(GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT / 3),
      k.pos(0, 0),
      k.color(...C.BG_TOP),
      k.z(0),
    ])
    k.add([
      k.rect(GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT / 3),
      k.pos(0, GAME_CONFIG.HEIGHT / 3),
      k.color(...C.BG_MID),
      k.z(0),
    ])
    k.add([
      k.rect(GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT / 3),
      k.pos(0, (GAME_CONFIG.HEIGHT * 2) / 3),
      k.color(...C.BG_BOTTOM),
      k.z(0),
    ])

    // Title glow shadow (green-tinted)
    k.add([
      k.text('RUNRUN', { size: 48 }),
      k.pos(GAME_CONFIG.WIDTH / 2 + 2, 182),
      k.anchor('center'),
      k.color(...C.CRYSTAL_GREEN),
      k.opacity(0.4),
      k.scale(1),
      k.z(9),
    ])

    // Title
    k.add([
      k.text('RUNRUN', { size: 48 }),
      k.pos(GAME_CONFIG.WIDTH / 2, 180),
      k.anchor('center'),
      k.color(...C.TEXT_WHITE),
      k.scale(1),
      k.z(10),
    ])

    // Subtitle - bright teal
    k.add([
      k.text('How far can you run?', { size: 18 }),
      k.pos(GAME_CONFIG.WIDTH / 2, 230),
      k.anchor('center'),
      k.color(80, 220, 200),
      k.z(10),
    ])

    // === CHALLENGE BANNER (if user arrived via ?challenge=N URL) ===
    const challengeScore = parseChallengeFromUrl()
    if (challengeScore !== null) {
      // Glow background
      const glow = k.add([
        k.rect(320, 60, { radius: 10 }),
        k.pos(GAME_CONFIG.WIDTH / 2, 110),
        k.anchor('center'),
        k.color(255, 80, 80),
        k.opacity(0.25),
        k.z(9),
      ])
      // Pulsing glow opacity
      let glowT = 0
      glow.onUpdate(() => {
        glowT += k.dt() * 3
        glow.opacity = 0.18 + Math.abs(Math.sin(glowT)) * 0.18
      })
      // "CHALLENGE" small label
      k.add([
        k.text('CHALLENGE', { size: 14 }),
        k.pos(GAME_CONFIG.WIDTH / 2, 92),
        k.anchor('center'),
        k.color(255, 200, 200),
        k.z(10),
      ])
      // The score to beat
      k.add([
        k.text(`Beat ${challengeScore}!`, { size: 26 }),
        k.pos(GAME_CONFIG.WIDTH / 2, 120),
        k.anchor('center'),
        k.color(255, 120, 120),
        k.z(10),
      ])
    }

    // Bouncing player preview
    const preview = k.add([
      k.pos(GAME_CONFIG.WIDTH / 2, 380),
      k.anchor('center'),
      k.scale(1),
      k.z(10),
    ])

    // Player body preview
    preview.add([
      k.rect(30, 16),
      k.color(...C.PLAYER_LEGS),
      k.anchor('bot'),
      k.pos(0, 20),
    ])
    preview.add([
      k.rect(38, 30),
      k.color(...C.PLAYER_BODY),
      k.anchor('bot'),
      k.pos(0, 4),
    ])
    preview.add([
      k.rect(34, 26),
      k.color(...C.PLAYER_HEAD),
      k.anchor('bot'),
      k.pos(0, -26),
    ])
    preview.add([
      k.rect(34, 8),
      k.color(...C.PLAYER_HAIR),
      k.anchor('bot'),
      k.pos(0, -52),
    ])

    // Bounce animation
    let bounceTime = 0
    preview.onUpdate(() => {
      bounceTime += k.dt() * 3
      preview.pos.y = 380 + Math.sin(bounceTime) * 8
    })

    // PLAY button - bright green
    const btn = k.add([
      k.rect(160, 54, { radius: 6 }),
      k.pos(GAME_CONFIG.WIDTH / 2, 520),
      k.anchor('center'),
      k.color(...C.BUTTON_GREEN),
      k.scale(1),
      k.z(10),
    ])

    // Button darker bottom
    btn.add([
      k.rect(160, 18, { radius: 4 }),
      k.color(...C.BUTTON_GREEN_DARK),
      k.anchor('bot'),
      k.pos(0, 27),
    ])

    // Button text
    btn.add([
      k.text('PLAY', { size: 26 }),
      k.color(...C.TEXT_WHITE),
      k.anchor('center'),
      k.pos(0, -4),
    ])

    // Button pulse
    let pulseTime = 0
    btn.onUpdate(() => {
      pulseTime += k.dt() * 2
      const s = 1 + Math.sin(pulseTime) * 0.03
      btn.scaleTo(s)
    })

    // High score
    let highScore = 0
    try {
      const saved = localStorage.getItem('runrun_highscore')
      highScore = saved ? parseInt(saved, 10) : 0
    } catch { /* */ }

    if (highScore > 0) {
      k.add([
        k.text(`Best: ${highScore}`, { size: 20 }),
        k.pos(GAME_CONFIG.WIDTH / 2, 590),
        k.anchor('center'),
        k.color(...C.TEXT_GOLD),
        k.z(10),
      ])
    }

    // Controls hint - teal tinted
    k.add([
      k.text('Swipe or Arrow Keys', { size: 14 }),
      k.pos(GAME_CONFIG.WIDTH / 2, 700),
      k.anchor('center'),
      k.color(80, 180, 160),
      k.z(10),
    ])

    // Floating particles: mix gold + cyan + green (6 particles)
    const particleColors: [number, number, number][] = [
      C.PARTICLE_GOLD,
      C.PARTICLE_GOLD,
      [80, 220, 200],
      [80, 220, 200],
      C.CRYSTAL_GREEN,
      C.CRYSTAL_GREEN,
    ]
    for (let i = 0; i < 6; i++) {
      const p = k.add([
        k.rect(k.rand(3, 5), k.rand(3, 5)),
        k.pos(k.rand(50, 550), k.rand(100, 750)),
        k.anchor('center'),
        k.color(...particleColors[i]),
        k.opacity(k.rand(0.15, 0.35)),
        k.z(5),
      ])

      const startY = p.pos.y
      const speed = k.rand(0.4, 0.8)
      const amplitude = k.rand(20, 40)
      let t = k.rand(0, Math.PI * 2)

      p.onUpdate(() => {
        t += k.dt() * speed
        p.pos.y = startY + Math.sin(t) * amplitude
        p.pos.x += k.dt() * k.rand(-5, 5)
        // Wrap
        if (p.pos.y < 50) p.pos.y = 750
        if (p.pos.y > 760) p.pos.y = 60
      })
    }

    // Start game on any input — pass challenge score if present
    const startGame = () => k.go('game', { challengeScore })
    k.onKeyPress(startGame)
    k.onMousePress(startGame)
    k.onTouchStart(startGame)
  })
}

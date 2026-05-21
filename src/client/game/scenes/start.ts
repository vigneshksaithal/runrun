import type { KAPLAYCtx } from 'kaplay'
import { GAME_CONFIG } from '../config'

const { COLORS } = GAME_CONFIG

export function createStartScene(k: KAPLAYCtx) {
  k.scene('start', () => {
    const W = GAME_CONFIG.WIDTH
    const H = GAME_CONFIG.HEIGHT

    // Background - bright sky gradient (sky blue → teal)
    for (let i = 0; i < 15; i++) {
      const t = i / 15
      const r = 80 + t * 20
      const g = 170 + t * 30
      const b = 255 - t * 30
      k.add([
        k.rect(W, Math.ceil(H / 15) + 1),
        k.pos(0, i * (H / 15)),
        k.color(r, g, b),
        k.z(0),
      ])
    }

    // Floating sparkle particles in background
    for (let i = 0; i < 15; i++) {
      const sparkle = k.add([
        k.rect(k.rand(2, 5), k.rand(2, 5)),
        k.pos(k.rand(30, W - 30), k.rand(60, H - 60)),
        k.color(255, 255, 255),
        k.opacity(k.rand(0.1, 0.35)),
        k.anchor('center'),
        k.z(2),
      ])
      const vx = k.rand(-4, 4)
      const vy = k.rand(-6, -2)
      sparkle.onUpdate(() => {
        sparkle.pos.x += vx * k.dt()
        sparkle.pos.y += vy * k.dt()
        if (sparkle.pos.y < 40) sparkle.pos.y = H - 60
        if (sparkle.pos.x < 20) sparkle.pos.x = W - 30
        if (sparkle.pos.x > W - 20) sparkle.pos.x = 30
        sparkle.opacity = 0.1 + Math.sin(k.time() * 2 + i * 0.5) * 0.2
      })
    }

    // Animated background track lines (moving slowly - alive feel)
    for (let i = 0; i < 10; i++) {
      const line = k.add([
        k.rect(3, 40 + Math.random() * 50),
        k.pos(W / 2 + (i - 5) * 40, 100 + i * 60),
        k.color(255, 255, 255),
        k.opacity(0.12),
        k.anchor('center'),
        k.z(1),
      ])
      line.onUpdate(() => {
        line.pos.y += k.dt() * 60
        if (line.pos.y > H + 50) line.pos.y = -50
        line.opacity = 0.06 + Math.sin(k.time() * 1.5 + i) * 0.06
      })
    }

    // Title "BLOCKDASH" - big bold white with shadow
    k.add([
      k.text('BLOCKDASH', { size: 58 }),
      k.pos(W / 2 + 3, 133),
      k.anchor('center'),
      k.color(0, 0, 0),
      k.opacity(0.4),
      k.z(9),
    ])
    const title = k.add([
      k.text('BLOCKDASH', { size: 58 }),
      k.pos(W / 2, 130),
      k.anchor('center'),
      k.color(...COLORS.TEXT_WHITE),
      k.z(10),
    ])
    title.onUpdate(() => {
      title.scaleTo(1 + Math.sin(k.time() * 1.5) * 0.02)
    })

    // Subtitle
    k.add([
      k.text('How far can you dash?', { size: 16 }),
      k.pos(W / 2, 175),
      k.anchor('center'),
      k.color(220, 240, 255),
      k.opacity(0.8),
      k.z(10),
    ])

    // Subtle glow behind player
    const playerGlow = k.add([
      k.rect(90, 110, { radius: 45 }),
      k.pos(W / 2 - 45, 280),
      k.color(0, 200, 180),
      k.opacity(0.08),
      k.z(15),
    ])
    playerGlow.onUpdate(() => {
      playerGlow.opacity = 0.05 + Math.sin(k.time() * 2) * 0.04
    })

    // Player character (bouncing, larger)
    const playerGroup = k.add([
      k.pos(W / 2, 340),
      k.anchor('center'),
      k.scale(2.0),
      k.z(20),
    ])
    // Body (teal)
    playerGroup.add([k.rect(40, 32), k.pos(-20, -16), k.color(...COLORS.PLAYER_BODY)])
    // Head
    playerGroup.add([k.rect(36, 26), k.pos(-18, -42), k.color(...COLORS.PLAYER_HEAD)])
    // Hair (orange)
    playerGroup.add([k.rect(36, 9), k.pos(-18, -42), k.color(...COLORS.PLAYER_HAIR)])
    // Eyes
    playerGroup.add([k.rect(5, 5), k.pos(-9, -32), k.color(30, 30, 30)])
    playerGroup.add([k.rect(5, 5), k.pos(4, -32), k.color(30, 30, 30)])
    // Legs
    playerGroup.add([k.rect(14, 18), k.pos(-16, 16), k.color(...COLORS.PLAYER_LEGS)])
    playerGroup.add([k.rect(14, 18), k.pos(2, 16), k.color(...COLORS.PLAYER_LEGS)])

    // Bounce animation
    playerGroup.onUpdate(() => {
      playerGroup.pos.y = 340 + Math.sin(k.time() * 2.5) * 8
    })

    // Track lines behind player
    k.add([k.rect(3, 160), k.pos(W / 2 - 85, 390), k.color(255, 255, 255), k.opacity(0.15), k.z(5)])
    k.add([k.rect(3, 160), k.pos(W / 2 + 85, 390), k.color(255, 255, 255), k.opacity(0.15), k.z(5)])

    // High score display
    const highScore = getHighScore()
    if (highScore > 0) {
      k.add([
        k.text(`Best: ${highScore}`, { size: 20 }),
        k.pos(W / 2, 460),
        k.anchor('center'),
        k.color(...COLORS.TEXT_GOLD),
        k.z(10),
      ])
    }

    // Big green "PLAY" button
    const btnY = 530
    const btn = k.add([
      k.rect(200, 60, { radius: 10 }),
      k.pos(W / 2, btnY),
      k.anchor('center'),
      k.color(...COLORS.BUTTON_GREEN),
      k.scale(1),
      k.z(10),
    ])
    k.add([
      k.text('PLAY', { size: 28 }),
      k.pos(W / 2, btnY),
      k.anchor('center'),
      k.color(...COLORS.TEXT_WHITE),
      k.z(11),
    ])
    btn.onUpdate(() => {
      btn.scaleTo(1 + Math.sin(k.time() * 3) * 0.04)
    })

    // Controls hint
    k.add([
      k.text('Swipe or Arrow Keys', { size: 14 }),
      k.pos(W / 2, 600),
      k.anchor('center'),
      k.color(220, 240, 255),
      k.opacity(0.6),
      k.z(10),
    ])
    k.add([
      k.text('< > Move  |  Up: Jump  |  Down: Slide', { size: 12 }),
      k.pos(W / 2, 625),
      k.anchor('center'),
      k.color(200, 220, 240),
      k.opacity(0.4),
      k.z(10),
    ])

    // Start game on any input
    k.onKeyPress(() => k.go('game'))
    k.onTouchStart(() => k.go('game'))
    k.onClick(() => k.go('game'))
  })
}

function getHighScore(): number {
  try { return parseInt(localStorage.getItem('blockdash_highscore') || '0', 10) }
  catch { return 0 }
}

import type { KAPLAYCtx } from 'kaplay'
import { GAME_CONFIG } from '../config'

const { COLORS } = GAME_CONFIG

export function createStartScene(k: KAPLAYCtx) {
  k.scene('start', () => {
    const W = GAME_CONFIG.WIDTH
    const H = GAME_CONFIG.HEIGHT

    // Background - dark gradient (deep indigo → rich purple)
    for (let i = 0; i < 15; i++) {
      const t = i / 15
      const r = 12 + t * 13
      const g = 8 + t * 12
      const b = 30 + t * 25
      k.add([
        k.rect(W, Math.ceil(H / 15) + 1),
        k.pos(0, i * (H / 15)),
        k.color(r, g, b),
        k.z(0),
      ])
    }

    // Floating neon particles (cyan and gold)
    for (let i = 0; i < 18; i++) {
      const isCyan = i % 3 !== 2
      const color: [number, number, number] = isCyan ? COLORS.PARTICLE_CYAN : COLORS.PARTICLE_GOLD
      const sparkle = k.add([
        k.rect(k.rand(2, 5), k.rand(2, 5)),
        k.pos(k.rand(30, W - 30), k.rand(60, H - 60)),
        k.color(...color),
        k.opacity(k.rand(0.05, 0.25)),
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
        sparkle.opacity = 0.05 + Math.sin(k.time() * 2 + i * 0.5) * 0.15
      })
    }

    // Animated background track lines (neon cyan, slowly moving)
    for (let i = 0; i < 10; i++) {
      const line = k.add([
        k.rect(3, 40 + Math.random() * 50),
        k.pos(W / 2 + (i - 5) * 40, 100 + i * 60),
        k.color(...COLORS.LANE_LINE),
        k.opacity(0.06),
        k.anchor('center'),
        k.z(1),
      ])
      line.onUpdate(() => {
        line.pos.y += k.dt() * 60
        if (line.pos.y > H + 50) line.pos.y = -50
        line.opacity = 0.03 + Math.sin(k.time() * 1.5 + i) * 0.04
      })
    }


    // Cyan glow behind title (larger semi-transparent text offset)
    k.add([
      k.text('BLOCKDASH', { size: 62 }),
      k.pos(W / 2, 130),
      k.anchor('center'),
      k.color(...COLORS.LANE_LINE),
      k.opacity(0.12),
      k.z(9),
    ])

    // Title "BLOCKDASH" - white with glow
    const title = k.add([
      k.text('BLOCKDASH', { size: 58 }),
      k.pos(W / 2, 130),
      k.anchor('center'),
      k.color(...COLORS.TEXT_WHITE),
      k.scale(1),
      k.z(10),
    ])
    title.onUpdate(() => {
      title.scaleTo(1 + Math.sin(k.time() * 1.5) * 0.02)
    })

    // Subtitle - soft cyan
    k.add([
      k.text('How far can you dash?', { size: 16 }),
      k.pos(W / 2, 175),
      k.anchor('center'),
      k.color(...COLORS.TEXT_CYAN),
      k.opacity(0.7),
      k.z(10),
    ])

    // Large soft glow rect behind player
    const playerGlow = k.add([
      k.rect(100, 120, { radius: 50 }),
      k.pos(W / 2 - 50, 270),
      k.color(...COLORS.PLAYER_GLOW),
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


    // Track lines behind player (neon cyan)
    k.add([k.rect(3, 160), k.pos(W / 2 - 85, 390), k.color(...COLORS.LANE_LINE), k.opacity(0.1), k.z(5)])
    k.add([k.rect(3, 160), k.pos(W / 2 + 85, 390), k.color(...COLORS.LANE_LINE), k.opacity(0.1), k.z(5)])

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

    // Button glow halo behind
    const btnY = 530
    const btnGlow = k.add([
      k.rect(220, 72, { radius: 14 }),
      k.pos(W / 2, btnY),
      k.anchor('center'),
      k.color(...COLORS.BUTTON_GLOW),
      k.opacity(0.15),
      k.z(9),
    ])
    btnGlow.onUpdate(() => {
      btnGlow.opacity = 0.1 + Math.sin(k.time() * 3) * 0.06
    })

    // Big green "PLAY" button
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

    // Controls hint (subtle cyan)
    k.add([
      k.text('Swipe or Arrow Keys', { size: 14 }),
      k.pos(W / 2, 600),
      k.anchor('center'),
      k.color(...COLORS.TEXT_CYAN),
      k.opacity(0.5),
      k.z(10),
    ])
    k.add([
      k.text('< > Move  |  Up: Jump  |  Down: Slide', { size: 12 }),
      k.pos(W / 2, 625),
      k.anchor('center'),
      k.color(140, 120, 180),
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

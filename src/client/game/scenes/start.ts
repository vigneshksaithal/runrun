import type { KAPLAYCtx } from 'kaplay'
import { GAME_CONFIG } from '../config'

const { COLORS } = GAME_CONFIG

export function createStartScene(k: KAPLAYCtx) {
  k.scene('start', () => {
    const W = GAME_CONFIG.WIDTH
    const H = GAME_CONFIG.HEIGHT

    // Background - dark mine tunnel
    k.add([
      k.rect(W, H),
      k.pos(0, 0),
      k.color(30, 30, 50),
      k.z(0),
    ])

    // Animated background track lines (moving slowly)
    for (let i = 0; i < 8; i++) {
      const line = k.add([
        k.rect(2, 60),
        k.pos(W / 2 + (i - 4) * 30, 100 + i * 70),
        k.color(...COLORS.LANE_LINE),
        k.opacity(0.2),
        k.anchor('center'),
        k.z(1),
      ])
      line.onUpdate(() => {
        line.pos.y += k.dt() * 40
        if (line.pos.y > H) line.pos.y = 50
        line.opacity = 0.1 + Math.sin(k.time() + i) * 0.1
      })
    }

    // Title "MINERUN" drawn with blocky rectangles
    drawBlockyTitle(k, W / 2, 120)

    // Subtitle
    k.add([
      k.text('Minecraft x Subway Surfers', { size: 14 }),
      k.pos(W / 2, 180),
      k.anchor('center'),
      k.color(...COLORS.LANE_LINE),
      k.z(10),
    ])

    // Idle player character (bobbing)
    const playerGroup = k.add([
      k.pos(W / 2, 320),
      k.anchor('center'),
      k.z(20),
    ])

    // Player body
    playerGroup.add([
      k.rect(36, 28),
      k.pos(-18, -14),
      k.color(...COLORS.PLAYER_BODY),
    ])
    // Player head
    playerGroup.add([
      k.rect(32, 24),
      k.pos(-16, -38),
      k.color(...COLORS.PLAYER_HEAD),
    ])
    // Player hair
    playerGroup.add([
      k.rect(32, 6),
      k.pos(-16, -38),
      k.color(...COLORS.PLAYER_HAIR),
    ])
    // Eyes
    playerGroup.add([k.rect(4, 4), k.pos(-8, -28), k.color(0, 0, 0)])
    playerGroup.add([k.rect(4, 4), k.pos(4, -28), k.color(0, 0, 0)])
    // Legs
    playerGroup.add([
      k.rect(28, 16),
      k.pos(-14, 14),
      k.color(...COLORS.PLAYER_LEGS),
    ])

    // Idle bob animation
    playerGroup.onUpdate(() => {
      playerGroup.pos.y = 320 + Math.sin(k.time() * 2) * 5
    })

    // Track preview behind player (simple perspective lines)
    k.add([
      k.rect(4, 200),
      k.pos(W / 2 - 60, 340),
      k.color(...COLORS.LANE_LINE),
      k.opacity(0.3),
      k.z(5),
    ])
    k.add([
      k.rect(4, 200),
      k.pos(W / 2 + 60, 340),
      k.color(...COLORS.LANE_LINE),
      k.opacity(0.3),
      k.z(5),
    ])

    // High score display
    const highScore = getHighScore()
    if (highScore > 0) {
      k.add([
        k.text(`Best: ${highScore} blocks`, { size: 16 }),
        k.pos(W / 2, 400),
        k.anchor('center'),
        k.color(...COLORS.TEXT_GOLD),
        k.z(10),
      ])
    }

    // "TAP TO PLAY" button
    const btnY = 480
    const btn = k.add([
      k.rect(180, 50, { radius: 6 }),
      k.pos(W / 2, btnY),
      k.anchor('center'),
      k.color(...COLORS.BUTTON_GREEN),
      k.scale(1),
      k.z(10),
    ])

    k.add([
      k.text('TAP TO PLAY', { size: 20 }),
      k.pos(W / 2, btnY),
      k.anchor('center'),
      k.color(...COLORS.TEXT_WHITE),
      k.z(11),
    ])

    // Button pulse animation
    btn.onUpdate(() => {
      const pulse = 1 + Math.sin(k.time() * 3) * 0.03
      btn.scaleTo(pulse)
    })

    // Controls hint
    k.add([
      k.text('Swipe or Arrow Keys', { size: 12 }),
      k.pos(W / 2, 540),
      k.anchor('center'),
      k.color(...COLORS.LANE_LINE),
      k.opacity(0.7),
      k.z(10),
    ])

    k.add([
      k.text('< > Move  |  Up: Jump  |  Down: Slide', { size: 11 }),
      k.pos(W / 2, 560),
      k.anchor('center'),
      k.color(...COLORS.LANE_LINE),
      k.opacity(0.5),
      k.z(10),
    ])

    // Decorative pickaxe (simple geometric)
    drawPickaxe(k, W / 2 - 80, 260)
    drawPickaxe(k, W / 2 + 80, 260)

    // Start game on any input
    k.onKeyPress(() => k.go('game'))
    k.onTouchStart(() => k.go('game'))
    k.onClick(() => k.go('game'))
  })
}

function drawBlockyTitle(k: KAPLAYCtx, cx: number, cy: number) {
  // Draw "MINERUN" as large blocky text
  const title = k.add([
    k.text('MINERUN', { size: 48 }),
    k.pos(cx, cy),
    k.anchor('center'),
    k.color(...COLORS.TEXT_WHITE),
    k.z(10),
  ])

  // Glow effect behind title
  k.add([
    k.text('MINERUN', { size: 48 }),
    k.pos(cx + 2, cy + 2),
    k.anchor('center'),
    k.color(...COLORS.TEXT_SHADOW),
    k.opacity(0.5),
    k.z(9),
  ])

  // Animated color shift
  title.onUpdate(() => {
    const t = k.time()
    const r = 200 + Math.sin(t) * 55
    const g = 200 + Math.sin(t + 2) * 55
    const b = 100
    title.color.r = r
    title.color.g = g
    title.color.b = b
  })
}

function drawPickaxe(k: KAPLAYCtx, x: number, y: number) {
  // Handle (brown rectangle)
  k.add([
    k.rect(4, 30),
    k.pos(x, y),
    k.anchor('center'),
    k.color(139, 90, 43),
    k.rotate(45),
    k.z(8),
  ])
  // Head (gray rectangle)
  k.add([
    k.rect(20, 8),
    k.pos(x - 8, y - 12),
    k.anchor('center'),
    k.color(160, 160, 170),
    k.rotate(45),
    k.z(9),
  ])
}

function getHighScore(): number {
  try {
    return parseInt(localStorage.getItem('minerun_highscore') || '0', 10)
  } catch {
    return 0
  }
}

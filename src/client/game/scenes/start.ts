import type { KAPLAYCtx } from 'kaplay'
import { GAME_CONFIG } from '../config'

const { COLORS } = GAME_CONFIG

export function createStartScene(k: KAPLAYCtx) {
  k.scene('start', () => {
    const W = GAME_CONFIG.WIDTH
    const H = GAME_CONFIG.HEIGHT

    // Background - dark mine tunnel gradient
    for (let i = 0; i < 15; i++) {
      const t = i / 15
      k.add([
        k.rect(W, Math.ceil(H / 15) + 1),
        k.pos(0, i * (H / 15)),
        k.color(18 + t * 15, 16 + t * 12, 30 + t * 20),
        k.z(0),
      ])
    }


    // Animated background track lines (moving slowly - gives "alive" feel)
    for (let i = 0; i < 12; i++) {
      const line = k.add([
        k.rect(2 + Math.random() * 2, 40 + Math.random() * 60),
        k.pos(W / 2 + (i - 6) * 35 + Math.random() * 10, 100 + i * 55),
        k.color(...COLORS.LANE_LINE),
        k.opacity(0.12),
        k.anchor('center'),
        k.z(1),
      ])
      line.onUpdate(() => {
        line.pos.y += k.dt() * 50
        if (line.pos.y > H + 50) line.pos.y = -50
        line.opacity = 0.06 + Math.sin(k.time() * 1.5 + i) * 0.06
      })
    }

    // Title "MINERUN" - large with glow
    // Shadow
    k.add([
      k.text('MINERUN', { size: 56 }),
      k.pos(W / 2 + 3, 133),
      k.anchor('center'),
      k.color(0, 0, 0),
      k.opacity(0.5),
      k.z(9),
    ])
    // Main title
    const title = k.add([
      k.text('MINERUN', { size: 56 }),
      k.pos(W / 2, 130),
      k.anchor('center'),
      k.color(...COLORS.TEXT_WHITE),
      k.z(10),
    ])
    title.onUpdate(() => {
      const t = k.time()
      title.color.r = 200 + Math.sin(t * 0.8) * 55
      title.color.g = 200 + Math.sin(t * 0.8 + 2) * 55
      title.color.b = 120 + Math.sin(t * 0.8 + 4) * 40
    })


    // Subtitle
    k.add([
      k.text('Minecraft x Subway Surfers', { size: 15 }),
      k.pos(W / 2, 175),
      k.anchor('center'),
      k.color(...COLORS.LANE_LINE),
      k.opacity(0.7),
      k.z(10),
    ])

    // Idle player character (bobbing) - larger for start screen
    const playerGroup = k.add([
      k.pos(W / 2, 340),
      k.anchor('center'),
      k.scale(1.8),
      k.z(20),
    ])
    // Body
    playerGroup.add([k.rect(36, 28), k.pos(-18, -14), k.color(...COLORS.PLAYER_BODY)])
    // Head
    playerGroup.add([k.rect(32, 24), k.pos(-16, -38), k.color(...COLORS.PLAYER_HEAD)])
    // Hair
    playerGroup.add([k.rect(32, 6), k.pos(-16, -38), k.color(...COLORS.PLAYER_HAIR)])
    // Eyes
    playerGroup.add([k.rect(4, 4), k.pos(-8, -28), k.color(0, 0, 0)])
    playerGroup.add([k.rect(4, 4), k.pos(4, -28), k.color(0, 0, 0)])
    // Legs
    playerGroup.add([k.rect(28, 16), k.pos(-14, 14), k.color(...COLORS.PLAYER_LEGS)])

    // Idle bob animation
    playerGroup.onUpdate(() => {
      playerGroup.pos.y = 340 + Math.sin(k.time() * 2.5) * 6
    })

    // Track lines behind player
    k.add([k.rect(4, 180), k.pos(W / 2 - 80, 380), k.color(...COLORS.LANE_LINE), k.opacity(0.2), k.z(5)])
    k.add([k.rect(4, 180), k.pos(W / 2 + 80, 380), k.color(...COLORS.LANE_LINE), k.opacity(0.2), k.z(5)])


    // High score display
    const highScore = getHighScore()
    if (highScore > 0) {
      k.add([
        k.text(`Best: ${highScore} blocks`, { size: 18 }),
        k.pos(W / 2, 460),
        k.anchor('center'),
        k.color(...COLORS.TEXT_GOLD),
        k.z(10),
      ])
    }

    // "TAP TO PLAY" button
    const btnY = 540
    const btn = k.add([
      k.rect(220, 58, { radius: 6 }),
      k.pos(W / 2, btnY),
      k.anchor('center'),
      k.color(...COLORS.BUTTON_GREEN),
      k.scale(1),
      k.z(10),
    ])
    k.add([
      k.text('TAP TO PLAY', { size: 24 }),
      k.pos(W / 2, btnY),
      k.anchor('center'),
      k.color(...COLORS.TEXT_WHITE),
      k.z(11),
    ])
    btn.onUpdate(() => {
      btn.scaleTo(1 + Math.sin(k.time() * 3) * 0.03)
    })

    // Controls hint
    k.add([
      k.text('Swipe or Arrow Keys', { size: 13 }),
      k.pos(W / 2, 610),
      k.anchor('center'),
      k.color(...COLORS.LANE_LINE),
      k.opacity(0.6),
      k.z(10),
    ])
    k.add([
      k.text('< > Move  |  Up: Jump  |  Down: Slide', { size: 12 }),
      k.pos(W / 2, 635),
      k.anchor('center'),
      k.color(...COLORS.LANE_LINE),
      k.opacity(0.4),
      k.z(10),
    ])

    // Decorative pickaxes
    drawPickaxe(k, W / 2 - 100, 270)
    drawPickaxe(k, W / 2 + 100, 270)

    // Start game on any input
    k.onKeyPress(() => k.go('game'))
    k.onTouchStart(() => k.go('game'))
    k.onClick(() => k.go('game'))
  })
}

function drawPickaxe(k: KAPLAYCtx, x: number, y: number) {
  k.add([k.rect(4, 30), k.pos(x, y), k.anchor('center'), k.color(139, 90, 43), k.rotate(45), k.z(8)])
  k.add([k.rect(20, 8), k.pos(x - 8, y - 12), k.anchor('center'), k.color(160, 160, 170), k.rotate(45), k.z(9)])
}

function getHighScore(): number {
  try { return parseInt(localStorage.getItem('minerun_highscore') || '0', 10) }
  catch { return 0 }
}

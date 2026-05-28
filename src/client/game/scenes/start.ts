import type { KAPLAYCtx } from 'kaplay'
import { GAME_CONFIG } from '../config'

const C = GAME_CONFIG.COLORS

export function createStartScene(k: KAPLAYCtx) {
  k.scene('start', () => {
    // === SKY GRADIENT BACKGROUND ===
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

    // === CITY SILHOUETTE ===
    for (let i = 0; i < 10; i++) {
      const bw = k.rand(40, 80)
      const bh = k.rand(80, 180)
      k.add([
        k.rect(bw, bh),
        k.pos(i * 70 - 30, 500 - bh),
        k.anchor('topleft'),
        k.color(...C.BUILDING_FAR),
        k.opacity(0.6),
        k.z(1),
      ])
    }

    // === SUN ===
    k.add([
      k.rect(80, 80),
      k.pos(480, 120),
      k.anchor('center'),
      k.color(255, 230, 180),
      k.opacity(0.8),
      k.z(1),
    ])
    k.add([
      k.rect(100, 100),
      k.pos(480, 120),
      k.anchor('center'),
      k.color(255, 200, 130),
      k.opacity(0.3),
      k.z(0),
    ])

    // === TRACK/GROUND ===
    k.add([
      k.rect(GAME_CONFIG.WIDTH, 350),
      k.pos(0, 500),
      k.color(...C.TRACK_MAIN),
      k.z(2),
    ])

    // Rails
    k.add([
      k.rect(GAME_CONFIG.WIDTH, 6),
      k.pos(0, 520),
      k.color(...C.TRACK_RAIL),
      k.opacity(0.5),
      k.z(3),
    ])
    k.add([
      k.rect(GAME_CONFIG.WIDTH, 6),
      k.pos(0, 560),
      k.color(...C.TRACK_RAIL),
      k.opacity(0.5),
      k.z(3),
    ])

    // === TITLE with shadow ===
    k.add([
      k.text('RUNRUN', { size: 56 }),
      k.pos(GAME_CONFIG.WIDTH / 2 + 3, 153),
      k.anchor('center'),
      k.color(...C.TEXT_SHADOW),
      k.opacity(0.4),
      k.z(10),
    ])

    const title = k.add([
      k.text('RUNRUN', { size: 56 }),
      k.pos(GAME_CONFIG.WIDTH / 2, 150),
      k.anchor('center'),
      k.color(...C.TEXT_WHITE),
      k.z(11),
    ])

    // Title pulse animation
    let titlePulse = 0
    title.onUpdate(() => {
      titlePulse += k.dt() * 2
      const s = 1 + Math.sin(titlePulse) * 0.03
      title.scaleTo(s)
    })

    // Subtitle
    k.add([
      k.text('Endless Runner', { size: 20 }),
      k.pos(GAME_CONFIG.WIDTH / 2, 200),
      k.anchor('center'),
      k.color(...C.SKY_TOP),
      k.opacity(0.9),
      k.z(10),
    ])

    // === PLAYER PREVIEW (bouncing) ===
    const preview = k.add([
      k.pos(GAME_CONFIG.WIDTH / 2, 390),
      k.anchor('center'),
      k.scale(1.3),
      k.z(20),
    ])

    // Shadow
    preview.add([
      k.rect(50, 10),
      k.color(0, 0, 0),
      k.anchor('center'),
      k.pos(0, 50),
      k.opacity(0.3),
    ])

    // Legs
    preview.add([
      k.rect(12, 22),
      k.color(...C.PLAYER_PANTS),
      k.anchor('top'),
      k.pos(-8, 24),
    ])
    preview.add([
      k.rect(12, 22),
      k.color(...C.PLAYER_PANTS),
      k.anchor('top'),
      k.pos(8, 24),
    ])

    // Shoes
    preview.add([
      k.rect(16, 8),
      k.color(...C.PLAYER_SHOES),
      k.anchor('top'),
      k.pos(-8, 44),
    ])
    preview.add([
      k.rect(16, 8),
      k.color(...C.PLAYER_SHOES),
      k.anchor('top'),
      k.pos(8, 44),
    ])

    // Body (hoodie)
    preview.add([
      k.rect(40, 36),
      k.color(...C.PLAYER_HOODIE),
      k.anchor('bot'),
      k.pos(0, 28),
    ])

    // Arms
    preview.add([
      k.rect(10, 24),
      k.color(...C.PLAYER_HOODIE),
      k.anchor('top'),
      k.pos(-22, -4),
    ])
    preview.add([
      k.rect(10, 24),
      k.color(...C.PLAYER_HOODIE),
      k.anchor('top'),
      k.pos(22, -4),
    ])

    // Hands
    preview.add([
      k.rect(10, 10),
      k.color(...C.PLAYER_SKIN),
      k.anchor('top'),
      k.pos(-22, 18),
    ])
    preview.add([
      k.rect(10, 10),
      k.color(...C.PLAYER_SKIN),
      k.anchor('top'),
      k.pos(22, 18),
    ])

    // Head
    const head = preview.add([
      k.rect(32, 30),
      k.color(...C.PLAYER_SKIN),
      k.anchor('bot'),
      k.pos(0, -8),
    ])

    // Hair
    head.add([
      k.rect(34, 14),
      k.color(...C.PLAYER_HAIR),
      k.anchor('bot'),
      k.pos(0, -28),
    ])

    // Eyes
    head.add([
      k.rect(6, 7),
      k.color(255, 255, 255),
      k.anchor('center'),
      k.pos(-8, -12),
    ])
    head.add([
      k.rect(4, 5),
      k.color(40, 30, 20),
      k.anchor('center'),
      k.pos(-7, -11),
    ])
    head.add([
      k.rect(6, 7),
      k.color(255, 255, 255),
      k.anchor('center'),
      k.pos(8, -12),
    ])
    head.add([
      k.rect(4, 5),
      k.color(40, 30, 20),
      k.anchor('center'),
      k.pos(9, -11),
    ])

    // Smile
    head.add([
      k.rect(10, 3),
      k.color(180, 100, 80),
      k.anchor('center'),
      k.pos(0, -4),
    ])

    // Bounce animation
    let bounceTime = 0
    preview.onUpdate(() => {
      bounceTime += k.dt() * 4
      preview.pos.y = 390 + Math.sin(bounceTime) * 12
    })

    // === PLAY BUTTON ===
    const btn = k.add([
      k.rect(180, 60, { radius: 8 }),
      k.pos(GAME_CONFIG.WIDTH / 2, 540),
      k.anchor('center'),
      k.color(...C.BUTTON_PLAY),
      k.scale(1),
      k.z(20),
    ])

    // Button 3D effect (bottom)
    btn.add([
      k.rect(180, 20, { radius: 6 }),
      k.color(...C.BUTTON_PLAY_DARK),
      k.anchor('bot'),
      k.pos(0, 30),
    ])

    // Button text
    btn.add([
      k.text('PLAY', { size: 28 }),
      k.color(...C.TEXT_WHITE),
      k.anchor('center'),
      k.pos(0, -5),
    ])

    // Play icon (triangle)
    btn.add([
      k.rect(12, 18),
      k.color(...C.TEXT_WHITE),
      k.anchor('center'),
      k.pos(-50, -5),
      k.opacity(0.9),
    ])

    // Button pulse
    let btnPulse = 0
    btn.onUpdate(() => {
      btnPulse += k.dt() * 3
      const s = 1 + Math.sin(btnPulse) * 0.04
      btn.scaleTo(s)
    })

    // === HIGH SCORE ===
    let highScore = 0
    try {
      const saved = localStorage.getItem('runrun_highscore')
      highScore = saved ? parseInt(saved, 10) : 0
    } catch { /* */ }

    if (highScore > 0) {
      // High score background
      k.add([
        k.rect(160, 40),
        k.pos(GAME_CONFIG.WIDTH / 2, 620),
        k.anchor('center'),
        k.color(0, 0, 0),
        k.opacity(0.4),
        k.z(15),
      ])

      // Trophy icon
      k.add([
        k.rect(16, 20),
        k.pos(GAME_CONFIG.WIDTH / 2 - 55, 620),
        k.anchor('center'),
        k.color(...C.TEXT_GOLD),
        k.z(16),
      ])

      k.add([
        k.text(`${highScore}`, { size: 24 }),
        k.pos(GAME_CONFIG.WIDTH / 2 + 10, 620),
        k.anchor('center'),
        k.color(...C.TEXT_GOLD),
        k.z(16),
      ])
    }

    // === CONTROLS HINT ===
    k.add([
      k.text('Swipe or Arrow Keys to Move', { size: 14 }),
      k.pos(GAME_CONFIG.WIDTH / 2, 720),
      k.anchor('center'),
      k.color(...C.TEXT_WHITE),
      k.opacity(0.7),
      k.z(10),
    ])

    // === FLOATING COINS (decoration) ===
    for (let i = 0; i < 5; i++) {
      const coin = k.add([
        k.rect(20, 20),
        k.pos(k.rand(80, 520), k.rand(280, 450)),
        k.anchor('center'),
        k.color(...C.COIN_GOLD),
        k.opacity(0.7),
        k.z(5),
      ])
      coin.add([
        k.rect(14, 14),
        k.color(...C.COIN_DARK),
        k.anchor('center'),
        k.opacity(0.4),
      ])

      const baseY = coin.pos.y
      let floatTime = k.rand(0, Math.PI * 2)
      coin.onUpdate(() => {
        floatTime += k.dt() * 2
        coin.pos.y = baseY + Math.sin(floatTime) * 10
        coin.opacity = 0.5 + Math.sin(floatTime * 2) * 0.2
      })
    }

    // === START GAME ===
    k.onKeyPress(() => k.go('game'))
    k.onMousePress(() => k.go('game'))
    k.onTouchStart(() => k.go('game'))
  })
}

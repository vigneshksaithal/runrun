import type { KAPLAYCtx } from 'kaplay'
import { GAME_CONFIG } from '../config'

const C = GAME_CONFIG.COLORS

export function createStartScene(k: KAPLAYCtx) {
  k.scene('start', () => {
    // Bright sky gradient
    k.add([k.rect(GAME_CONFIG.WIDTH, 300), k.pos(0, 0), k.color(...C.SKY_TOP), k.z(0)])
    k.add([k.rect(GAME_CONFIG.WIDTH, 200), k.pos(0, 300), k.color(...C.SKY_MID), k.z(0)])
    k.add([k.rect(GAME_CONFIG.WIDTH, 300), k.pos(0, 500), k.color(...C.GRASS), k.z(0)])
    k.add([k.rect(GAME_CONFIG.WIDTH, 60), k.pos(0, 480), k.color(...C.SKY_LOW), k.opacity(0.8), k.z(0)])

    // Sun
    k.add([k.circle(60), k.pos(500, 120), k.anchor('center'), k.color(...C.SUN), k.opacity(0.3), k.z(1)])
    k.add([k.circle(40), k.pos(500, 120), k.anchor('center'), k.color(...C.SUN_CORE), k.z(1)])

    // A bit of railway track at the bottom
    k.add([k.rect(220, 300), k.pos(GAME_CONFIG.WIDTH / 2, 500), k.anchor('top'), k.color(...C.GROUND_NEAR), k.z(2)])
    for (const rx of [-70, -24, 24, 70]) {
      k.add([k.rect(6, 300), k.pos(GAME_CONFIG.WIDTH / 2 + rx, 500), k.anchor('top'), k.color(...C.RAIL_DARK), k.z(3)])
    }
    for (let i = 0; i < 7; i++) {
      k.add([k.rect(180, 8), k.pos(GAME_CONFIG.WIDTH / 2, 520 + i * 40), k.anchor('center'), k.color(...C.TIE), k.z(2)])
    }

    // Title shadow + title
    k.add([
      k.text('RUNRUN', { size: 56 }),
      k.pos(GAME_CONFIG.WIDTH / 2 + 3, 153),
      k.anchor('center'),
      k.color(...C.TEXT_DARK),
      k.opacity(0.35),
      k.z(9),
    ])
    k.add([
      k.text('RUNRUN', { size: 56 }),
      k.pos(GAME_CONFIG.WIDTH / 2, 150),
      k.anchor('center'),
      k.color(...C.TEXT_WHITE),
      k.z(10),
    ])
    k.add([
      k.text('How far can you run?', { size: 18 }),
      k.pos(GAME_CONFIG.WIDTH / 2, 200),
      k.anchor('center'),
      k.color(...C.TEXT_WHITE),
      k.z(10),
    ])

    // Bouncing runner preview (simplified Jake)
    const preview = k.add([k.pos(GAME_CONFIG.WIDTH / 2, 400), k.anchor('center'), k.z(10)])
    preview.add([k.rect(14, 22), k.color(...C.JEANS), k.anchor('bot'), k.pos(-9, 24)])
    preview.add([k.rect(14, 22), k.color(...C.JEANS_DARK), k.anchor('bot'), k.pos(9, 24)])
    preview.add([k.rect(17, 9, { radius: 3 }), k.color(...C.SHOE), k.anchor('bot'), k.pos(-9, 26)])
    preview.add([k.rect(17, 9, { radius: 3 }), k.color(...C.SHOE), k.anchor('bot'), k.pos(9, 26)])
    preview.add([k.rect(24, 22, { radius: 5 }), k.color(...C.BACKPACK), k.anchor('bot'), k.pos(0, -2)])
    preview.add([k.rect(36, 34, { radius: 6 }), k.color(...C.HOODIE), k.anchor('bot'), k.pos(0, 2)])
    preview.add([k.rect(12, 34, { radius: 6 }), k.color(...C.HOODIE_SHADE), k.anchor('bot'), k.pos(11, 2)])
    preview.add([k.rect(24, 22, { radius: 6 }), k.color(...C.SKIN), k.anchor('bot'), k.pos(0, -28)])
    preview.add([k.rect(26, 14, { radius: [7, 7, 0, 0] }), k.color(...C.CAP), k.anchor('bot'), k.pos(0, -50)])
    preview.add([k.rect(26, 5), k.color(...C.CAP_DARK), k.anchor('bot'), k.pos(0, -50)])

    let bounceTime = 0
    preview.onUpdate(() => {
      bounceTime += k.dt() * 3
      preview.pos.y = 400 + Math.sin(bounceTime) * 8
    })

    // PLAY button
    const btn = k.add([
      k.rect(170, 58, { radius: 12 }),
      k.pos(GAME_CONFIG.WIDTH / 2, 540),
      k.anchor('center'),
      k.color(...C.BUTTON_GREEN),
      k.scale(1),
      k.z(10),
    ])
    btn.add([k.rect(170, 18, { radius: 8 }), k.color(...C.BUTTON_GREEN_DARK), k.anchor('bot'), k.pos(0, 29)])
    btn.add([k.text('PLAY', { size: 28 }), k.color(...C.TEXT_WHITE), k.anchor('center'), k.pos(0, -4)])

    let pulseTime = 0
    btn.onUpdate(() => {
      pulseTime += k.dt() * 2
      btn.scaleTo(1 + Math.sin(pulseTime) * 0.03)
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
        k.pos(GAME_CONFIG.WIDTH / 2, 620),
        k.anchor('center'),
        k.color(...C.TEXT_GOLD),
        k.z(10),
      ])
    }

    k.add([
      k.text('Swipe or Arrow Keys', { size: 14 }),
      k.pos(GAME_CONFIG.WIDTH / 2, 720),
      k.anchor('center'),
      k.color(...C.TEXT_WHITE),
      k.opacity(0.85),
      k.z(10),
    ])

    // Floating gold coins
    for (let i = 0; i < 6; i++) {
      const p = k.add([
        k.circle(k.rand(4, 7)),
        k.pos(k.rand(50, 550), k.rand(120, 460)),
        k.anchor('center'),
        k.color(...C.COIN),
        k.outline(2, k.rgb(...C.COIN_DARK)),
        k.opacity(0.85),
        k.z(5),
      ])
      const startY = p.pos.y
      const speed = k.rand(0.4, 0.8)
      const amplitude = k.rand(20, 40)
      let t = k.rand(0, Math.PI * 2)
      p.onUpdate(() => {
        t += k.dt() * speed
        p.pos.y = startY + Math.sin(t) * amplitude
      })
    }

    k.onKeyPress(() => k.go('game'))
    k.onMousePress(() => k.go('game'))
    k.onTouchStart(() => k.go('game'))
  })
}

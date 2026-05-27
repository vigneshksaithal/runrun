import type { KAPLAYCtx } from 'kaplay'
import { GAME_CONFIG } from '../config'

const C = GAME_CONFIG.COLORS

export function createStartScene(k: KAPLAYCtx) {
  k.scene('start', () => {
    // Background gradient
    k.add([k.rect(GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT / 3), k.pos(0, 0), k.color(...C.BG_TOP), k.z(0)])
    k.add([k.rect(GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT / 3), k.pos(0, GAME_CONFIG.HEIGHT / 3), k.color(...C.BG_MID), k.z(0)])
    k.add([k.rect(GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT / 3), k.pos(0, (GAME_CONFIG.HEIGHT * 2) / 3), k.color(...C.BG_BOTTOM), k.z(0)])


    // Title glow shadow
    k.add([
      k.text('RUNRUN', { size: 52 }),
      k.pos(GAME_CONFIG.WIDTH / 2 + 2, 182),
      k.anchor('center'),
      k.color(...C.CRYSTAL_GREEN),
      k.opacity(0.4),
      k.scale(1),
      k.z(9),
    ])

    // Title
    const title = k.add([
      k.text('RUNRUN', { size: 52 }),
      k.pos(GAME_CONFIG.WIDTH / 2, 180),
      k.anchor('center'),
      k.color(...C.TEXT_WHITE),
      k.scale(1),
      k.z(10),
    ])
    // Title idle pulse
    let titleTime = 0
    title.onUpdate(() => {
      titleTime += k.dt() * 2
      title.scaleTo(1 + Math.sin(titleTime) * 0.02)
    })

    // Subtitle
    k.add([
      k.text('How far can you run?', { size: 18 }),
      k.pos(GAME_CONFIG.WIDTH / 2, 235),
      k.anchor('center'),
      k.color(80, 220, 200),
      k.z(10),
    ])

    // Bouncing player preview (enhanced)
    const preview = k.add([
      k.pos(GAME_CONFIG.WIDTH / 2, 380),
      k.anchor('center'),
      k.scale(1.2),
      k.z(10),
    ])
    // Shadow under preview
    preview.add([k.rect(36, 6, { radius: 3 }), k.color(0, 0, 0), k.anchor('center'), k.pos(0, 32), k.opacity(0.2)])
    // Shoes
    preview.add([k.rect(12, 6, { radius: 2 }), k.color(...C.PLAYER_SHOES), k.anchor('bot'), k.pos(-8, 22)])
    preview.add([k.rect(12, 6, { radius: 2 }), k.color(...C.PLAYER_SHOES), k.anchor('bot'), k.pos(8, 22)])
    // Legs
    preview.add([k.rect(30, 16), k.color(...C.PLAYER_LEGS), k.anchor('bot'), k.pos(0, 18)])
    // Belt
    preview.add([k.rect(38, 4), k.color(...C.PLAYER_BELT), k.anchor('bot'), k.pos(0, 2)])
    // Body
    preview.add([k.rect(38, 28), k.color(...C.PLAYER_BODY), k.anchor('bot'), k.pos(0, -2)])
    // Arms
    preview.add([k.rect(6, 18, { radius: 3 }), k.color(...C.PLAYER_HEAD), k.anchor('top'), k.pos(-22, -26)])
    preview.add([k.rect(6, 18, { radius: 3 }), k.color(...C.PLAYER_HEAD), k.anchor('top'), k.pos(22, -26)])
    // Head
    preview.add([k.rect(34, 26, { radius: 4 }), k.color(...C.PLAYER_HEAD), k.anchor('bot'), k.pos(0, -30)])
    // Hair
    preview.add([k.rect(36, 10, { radius: 4 }), k.color(...C.PLAYER_HAIR), k.anchor('bot'), k.pos(0, -56)])
    // Eyes
    preview.add([k.rect(8, 8, { radius: 4 }), k.color(255, 255, 255), k.anchor('center'), k.pos(-8, -44)])
    preview.add([k.rect(8, 8, { radius: 4 }), k.color(255, 255, 255), k.anchor('center'), k.pos(8, -44)])
    preview.add([k.rect(5, 5, { radius: 2 }), k.color(...C.PLAYER_EYES), k.anchor('center'), k.pos(-8, -43)])
    preview.add([k.rect(5, 5, { radius: 2 }), k.color(...C.PLAYER_EYES), k.anchor('center'), k.pos(8, -43)])

    // Bounce animation
    let bounceTime = 0
    preview.onUpdate(() => {
      bounceTime += k.dt() * 3
      preview.pos.y = 380 + Math.sin(bounceTime) * 8
    })


    // PLAY button
    const btn = k.add([
      k.rect(160, 54, { radius: 8 }),
      k.pos(GAME_CONFIG.WIDTH / 2, 530),
      k.anchor('center'),
      k.color(...C.BUTTON_GREEN),
      k.scale(1),
      k.z(10),
    ])
    btn.add([k.rect(160, 18, { radius: 6 }), k.color(...C.BUTTON_GREEN_DARK), k.anchor('bot'), k.pos(0, 27)])
    btn.add([k.text('PLAY', { size: 26 }), k.color(...C.TEXT_WHITE), k.anchor('center'), k.pos(0, -4)])

    let pulseTime = 0
    btn.onUpdate(() => {
      pulseTime += k.dt() * 2.5
      btn.scaleTo(1 + Math.sin(pulseTime) * 0.04)
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
        k.pos(GAME_CONFIG.WIDTH / 2, 600),
        k.anchor('center'),
        k.color(...C.TEXT_GOLD),
        k.z(10),
      ])
    }

    // Controls hint
    k.add([
      k.text('Swipe or Arrow Keys', { size: 14 }),
      k.pos(GAME_CONFIG.WIDTH / 2, 710),
      k.anchor('center'),
      k.color(80, 180, 160),
      k.z(10),
    ])

    // Floating particles (gold + cyan + green)
    const particleColors: [number, number, number][] = [
      C.PARTICLE_GOLD, C.PARTICLE_GOLD, [80, 220, 200], [80, 220, 200], C.CRYSTAL_GREEN, C.CRYSTAL_GREEN,
    ]
    for (let i = 0; i < 6; i++) {
      const p = k.add([
        k.rect(k.rand(3, 6), k.rand(3, 6), { radius: 2 }),
        k.pos(k.rand(50, 550), k.rand(100, 750)),
        k.anchor('center'),
        k.color(...particleColors[i]!),
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
        if (p.pos.y < 50) p.pos.y = 750
        if (p.pos.y > 760) p.pos.y = 60
      })
    }

    // Start game on any input
    k.onKeyPress(() => k.go('game'))
    k.onMousePress(() => k.go('game'))
    k.onTouchStart(() => k.go('game'))
  })
}

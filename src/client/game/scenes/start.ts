import type { KAPLAYCtx } from 'kaplay'
import { GAME_CONFIG } from '../config'

const C = GAME_CONFIG.COLORS

export function createStartScene(k: KAPLAYCtx) {
  k.scene('start', () => {
    // Sky
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

    // Ground
    k.add([
      k.rect(GAME_CONFIG.WIDTH, 300),
      k.pos(0, 500),
      k.color(...C.GROUND),
      k.z(1),
    ])

    // Title shadow
    k.add([
      k.text('RUNRUN', { size: 52 }),
      k.pos(GAME_CONFIG.WIDTH / 2 + 3, 153),
      k.anchor('center'),
      k.color(...C.TEXT_SHADOW),
      k.opacity(0.4),
      k.z(10),
    ])

    // Title
    const title = k.add([
      k.text('RUNRUN', { size: 52 }),
      k.pos(GAME_CONFIG.WIDTH / 2, 150),
      k.anchor('center'),
      k.color(...C.TEXT_WHITE),
      k.z(11),
    ])

    let titleBob = 0
    title.onUpdate(() => {
      titleBob += k.dt() * 2
      title.scale.x = title.scale.y = 1 + Math.sin(titleBob) * 0.03
    })

    // Subtitle
    k.add([
      k.text('Endless Runner', { size: 18 }),
      k.pos(GAME_CONFIG.WIDTH / 2, 195),
      k.anchor('center'),
      k.color(...C.SKY_TOP),
      k.z(10),
    ])

    // Simple player preview
    const preview = k.add([
      k.pos(GAME_CONFIG.WIDTH / 2, 380),
      k.anchor('center'),
      k.scale(1.5),
      k.z(20),
    ])

    preview.add([
      k.rect(30, 25),
      k.color(...C.PLAYER_PANTS),
      k.anchor('bot'),
    ])
    preview.add([
      k.rect(36, 32),
      k.color(...C.PLAYER_SHIRT),
      k.anchor('bot'),
      k.pos(0, -24),
    ])
    preview.add([
      k.rect(28, 24),
      k.color(...C.PLAYER_SKIN),
      k.anchor('bot'),
      k.pos(0, -56),
    ])
    preview.add([
      k.rect(30, 10),
      k.color(...C.PLAYER_HAIR),
      k.anchor('bot'),
      k.pos(0, -80),
    ])

    let bounce = 0
    preview.onUpdate(() => {
      bounce += k.dt() * 4
      preview.pos.y = 380 + Math.sin(bounce) * 10
    })

    // Play button
    const btn = k.add([
      k.rect(160, 55),
      k.pos(GAME_CONFIG.WIDTH / 2, 520),
      k.anchor('center'),
      k.color(...C.BUTTON),
      k.z(20),
    ])

    btn.add([
      k.rect(160, 16),
      k.color(...C.BUTTON_DARK),
      k.anchor('bot'),
      k.pos(0, 27),
    ])

    btn.add([
      k.text('PLAY', { size: 26 }),
      k.color(...C.TEXT_WHITE),
      k.anchor('center'),
      k.pos(0, -3),
    ])

    let btnPulse = 0
    btn.onUpdate(() => {
      btnPulse += k.dt() * 3
      btn.scale.x = btn.scale.y = 1 + Math.sin(btnPulse) * 0.04
    })

    // High score
    let highScore = 0
    try {
      const saved = localStorage.getItem('runrun_highscore')
      highScore = saved ? parseInt(saved, 10) : 0
    } catch { /* */ }

    if (highScore > 0) {
      k.add([
        k.rect(140, 36),
        k.pos(GAME_CONFIG.WIDTH / 2, 600),
        k.anchor('center'),
        k.color(0, 0, 0),
        k.opacity(0.4),
        k.z(15),
      ])
      k.add([
        k.text(`Best: ${highScore}`, { size: 20 }),
        k.pos(GAME_CONFIG.WIDTH / 2, 600),
        k.anchor('center'),
        k.color(...C.TEXT_GOLD),
        k.z(16),
      ])
    }

    // Controls hint
    k.add([
      k.text('Swipe or Arrow Keys', { size: 14 }),
      k.pos(GAME_CONFIG.WIDTH / 2, 700),
      k.anchor('center'),
      k.color(...C.TEXT_WHITE),
      k.opacity(0.6),
      k.z(10),
    ])

    // Start game
    k.onKeyPress(() => k.go('game'))
    k.onMousePress(() => k.go('game'))
    k.onTouchStart(() => k.go('game'))
  })
}

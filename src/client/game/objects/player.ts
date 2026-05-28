import type { KAPLAYCtx, GameObj } from 'kaplay'
import { GAME_CONFIG } from '../config'

const C = GAME_CONFIG.COLORS

export function createPlayer(k: KAPLAYCtx): GameObj {
  const player = k.add([
    k.pos(GAME_CONFIG.VANISHING_POINT_X, GAME_CONFIG.PLAYER_Y),
    k.anchor('bot'),
    k.z(100),
    k.scale(1),
    k.opacity(1),
    'player',
  ])

  // Shadow
  player.add([
    k.ellipse(20, 8),
    k.color(0, 0, 0),
    k.anchor('center'),
    k.pos(0, 2),
    k.opacity(0.3),
  ])

  // Legs
  player.add([
    k.rect(12, 20),
    k.color(...C.PLAYER_PANTS),
    k.anchor('bot'),
    k.pos(-7, 0),
  ])
  player.add([
    k.rect(12, 20),
    k.color(...C.PLAYER_PANTS),
    k.anchor('bot'),
    k.pos(7, 0),
  ])

  // Shoes
  player.add([
    k.rect(14, 6),
    k.color(...C.PLAYER_SHOES),
    k.anchor('bot'),
    k.pos(-7, 2),
  ])
  player.add([
    k.rect(14, 6),
    k.color(...C.PLAYER_SHOES),
    k.anchor('bot'),
    k.pos(7, 2),
  ])

  // Body
  player.add([
    k.rect(32, 28),
    k.color(...C.PLAYER_SHIRT),
    k.anchor('bot'),
    k.pos(0, -18),
  ])
  // Body shading
  player.add([
    k.rect(8, 26),
    k.color(...C.PLAYER_SHIRT_DARK),
    k.anchor('botleft'),
    k.pos(-16, -19),
  ])

  // Arms
  player.add([
    k.rect(8, 22),
    k.color(...C.PLAYER_SHIRT),
    k.anchor('top'),
    k.pos(-18, -44),
  ])
  player.add([
    k.rect(8, 22),
    k.color(...C.PLAYER_SHIRT),
    k.anchor('top'),
    k.pos(18, -44),
  ])

  // Hands
  player.add([
    k.rect(8, 8),
    k.color(...C.PLAYER_SKIN),
    k.anchor('top'),
    k.pos(-18, -24),
  ])
  player.add([
    k.rect(8, 8),
    k.color(...C.PLAYER_SKIN),
    k.anchor('top'),
    k.pos(18, -24),
  ])

  // Head
  const head = player.add([
    k.rect(26, 24),
    k.color(...C.PLAYER_SKIN),
    k.anchor('bot'),
    k.pos(0, -46),
  ])

  // Hair
  head.add([
    k.rect(28, 10),
    k.color(...C.PLAYER_HAIR),
    k.anchor('bot'),
    k.pos(0, -24),
  ])

  // Eyes
  head.add([
    k.rect(4, 4),
    k.color(40, 40, 40),
    k.anchor('center'),
    k.pos(-6, -10),
  ])
  head.add([
    k.rect(4, 4),
    k.color(40, 40, 40),
    k.anchor('center'),
    k.pos(6, -10),
  ])

  // Animation
  let runTime = 0

  player.onUpdate(() => {
    if (!player.exists()) return
    runTime += k.dt() * 8
    head.pos.y = -46 + Math.sin(runTime) * 1.5
  })

  return player
}

export function jumpPlayer(k: KAPLAYCtx, player: GameObj): boolean {
  if (!player.exists()) return false

  const jumpDur = GAME_CONFIG.JUMP_DURATION
  const startY = player.pos.y
  const jumpHeight = 70

  // Jump arc
  k.tween(
    0,
    1,
    jumpDur,
    (t) => {
      if (player.exists()) {
        const arc = Math.sin(t * Math.PI)
        player.pos.y = startY - jumpHeight * arc

        // Squash/stretch
        if (t < 0.2) {
          player.scale.x = 1 + t * 0.5
          player.scale.y = 1 - t * 0.3
        } else if (t > 0.8) {
          const land = (t - 0.8) / 0.2
          player.scale.x = 1.1 - land * 0.1
          player.scale.y = 0.94 + land * 0.06
        } else {
          player.scale.x = 0.9
          player.scale.y = 1.1
        }
      }
    },
    k.easings.linear,
  ).then(() => {
    if (player.exists()) {
      player.scale.x = 1
      player.scale.y = 1
    }
  })

  return true
}

export function slidePlayer(k: KAPLAYCtx, player: GameObj): boolean {
  if (!player.exists()) return false

  const slideDur = GAME_CONFIG.SLIDE_DURATION

  k.tween(
    0,
    1,
    slideDur,
    (t) => {
      if (player.exists()) {
        if (t < 0.2) {
          player.scale.x = 1 + t * 2
          player.scale.y = 1 - t * 2.5
        } else if (t > 0.8) {
          const up = (t - 0.8) / 0.2
          player.scale.x = 1.4 - up * 0.4
          player.scale.y = 0.5 + up * 0.5
        } else {
          player.scale.x = 1.4
          player.scale.y = 0.5
        }
      }
    },
    k.easings.linear,
  ).then(() => {
    if (player.exists()) {
      player.scale.x = 1
      player.scale.y = 1
    }
  })

  return true
}

export function createDeathParticles(k: KAPLAYCtx, x: number, y: number) {
  const colors: [number, number, number][] = [
    C.PLAYER_SHIRT,
    C.PLAYER_SKIN,
    C.PLAYER_PANTS,
    C.PLAYER_SHOES,
  ]

  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * 360
    const color = colors[i % colors.length]!

    k.add([
      k.rect(k.rand(8, 14), k.rand(8, 14)),
      k.pos(x, y - 35),
      k.anchor('center'),
      k.color(color[0], color[1], color[2]),
      k.opacity(1),
      k.lifespan(0.5, { fade: 0.3 }),
      k.move(angle, k.rand(150, 300)),
      k.z(200),
    ])
  }
}

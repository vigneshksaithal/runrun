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

  // Legs (bottom)
  player.add([
    k.rect(30, 16),
    k.color(...C.PLAYER_LEGS),
    k.anchor('bot'),
    k.pos(0, 0),
  ])

  // Body (teal)
  player.add([
    k.rect(38, 30),
    k.color(...C.PLAYER_BODY),
    k.anchor('bot'),
    k.pos(0, -16),
  ])

  // Head (skin)
  const head = player.add([
    k.rect(34, 26),
    k.color(...C.PLAYER_HEAD),
    k.anchor('bot'),
    k.pos(0, -46),
  ])

  // Hair (brown) on top of head
  head.add([
    k.rect(34, 8),
    k.color(...C.PLAYER_HAIR),
    k.anchor('bot'),
    k.pos(0, -26),
  ])

  // Left eye
  head.add([
    k.rect(5, 5),
    k.color(...C.PLAYER_EYES),
    k.anchor('center'),
    k.pos(-8, -10),
  ])

  // Right eye
  head.add([
    k.rect(5, 5),
    k.color(...C.PLAYER_EYES),
    k.anchor('center'),
    k.pos(8, -10),
  ])

  // Running animation state
  let runTime = 0
  let isJumping = false
  let isSliding = false

  player.onUpdate(() => {
    if (!player.exists()) return
    if (isJumping || isSliding) return
    runTime += k.dt() * 6
    // Simple head bob
    head.pos.y = -46 + Math.sin(runTime) * 2
  })

  // Trail particles
  let trailTimer = 0
  player.onUpdate(() => {
    if (!player.exists()) return
    trailTimer += k.dt()
    if (trailTimer >= 0.15) {
      trailTimer = 0
      const trail = k.add([
        k.rect(6, 6),
        k.pos(player.pos.x + k.rand(-8, 8), player.pos.y - 4),
        k.anchor('center'),
        k.color(...C.PARTICLE_DUST),
        k.opacity(0.5),
        k.scale(1),
        k.lifespan(0.3, { fade: 0.2 }),
        k.z(50),
      ])
      void trail
    }
  })

  return player
}

export function jumpPlayer(k: KAPLAYCtx, player: GameObj): boolean {
  if (!player.exists()) return false

  const jumpDur = GAME_CONFIG.JUMP_DURATION

  // Squash before jump
  k.tween(
    k.vec2(1, 1),
    k.vec2(0.8, 1.3),
    jumpDur * 0.2,
    (v) => { if (player.exists()) player.scaleTo(v) },
    k.easings.easeOutQuad,
  ).then(() => {
    if (!player.exists()) return
    // Stretch up
    k.tween(
      k.vec2(0.8, 1.3),
      k.vec2(1.1, 0.9),
      jumpDur * 0.5,
      (v) => { if (player.exists()) player.scaleTo(v) },
      k.easings.easeOutQuad,
    ).then(() => {
      if (!player.exists()) return
      // Return to normal
      k.tween(
        k.vec2(1.1, 0.9),
        k.vec2(1, 1),
        jumpDur * 0.3,
        (v) => { if (player.exists()) player.scaleTo(v) },
        k.easings.easeOutBounce,
      )
    })
  })

  return true
}

export function slidePlayer(k: KAPLAYCtx, player: GameObj): boolean {
  if (!player.exists()) return false

  const slideDur = GAME_CONFIG.SLIDE_DURATION

  // Flatten for slide
  k.tween(
    k.vec2(1, 1),
    k.vec2(1.4, 0.5),
    slideDur * 0.2,
    (v) => { if (player.exists()) player.scaleTo(v) },
    k.easings.easeOutQuad,
  ).then(() => {
    if (!player.exists()) return
    // Hold flat
    k.wait(slideDur * 0.5, () => {
      if (!player.exists()) return
      // Return to normal
      k.tween(
        k.vec2(1.4, 0.5),
        k.vec2(1, 1),
        slideDur * 0.3,
        (v) => { if (player.exists()) player.scaleTo(v) },
        k.easings.easeOutQuad,
      )
    })
  })

  return true
}

export function createDeathParticles(k: KAPLAYCtx, x: number, y: number) {
  const colors: [number, number, number][] = [
    C.PLAYER_BODY,
    C.PLAYER_HEAD,
    C.PLAYER_HAIR,
    C.PLAYER_LEGS,
    C.PLAYER_BODY,
    C.PLAYER_HEAD,
  ]

  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2
    const speed = k.rand(150, 350)
    const color = colors[i % colors.length]
    const size = k.rand(6, 14)

    const p = k.add([
      k.rect(size, size),
      k.pos(x, y - 30),
      k.anchor('center'),
      k.color(...color),
      k.opacity(1),
      k.scale(1),
      k.lifespan(0.4, { fade: 0.3 }),
      k.move(k.Vec2.fromAngle(k.rad2deg(angle)), speed),
      k.z(200),
    ])
    void p
  }
}

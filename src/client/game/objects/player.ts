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

  // Ground shadow
  player.add([
    k.rect(40, 8, { radius: 4 }),
    k.color(0, 0, 0),
    k.anchor('center'),
    k.pos(0, 4),
    k.opacity(0.25),
    'playerShadow',
  ])

  // Left shoe (red sneaker)
  const leftShoe = player.add([
    k.rect(12, 6, { radius: 2 }),
    k.color(...C.PLAYER_SHOES),
    k.anchor('bot'),
    k.pos(-8, 0),
  ])

  // Right shoe (red sneaker)
  const rightShoe = player.add([
    k.rect(12, 6, { radius: 2 }),
    k.color(...C.PLAYER_SHOES),
    k.anchor('bot'),
    k.pos(8, 0),
  ])

  // Legs (bottom)
  player.add([
    k.rect(30, 16),
    k.color(...C.PLAYER_LEGS),
    k.anchor('bot'),
    k.pos(0, -4),
  ])

  // Belt
  player.add([
    k.rect(38, 4),
    k.color(...C.PLAYER_BELT),
    k.anchor('bot'),
    k.pos(0, -20),
  ])

  // Body (teal)
  player.add([
    k.rect(38, 28),
    k.color(...C.PLAYER_BODY),
    k.anchor('bot'),
    k.pos(0, -24),
  ])

  // Left arm
  const leftArm = player.add([
    k.rect(6, 20, { radius: 3 }),
    k.color(...C.PLAYER_HEAD),
    k.anchor('top'),
    k.pos(-22, -48),
  ])

  // Right arm
  const rightArm = player.add([
    k.rect(6, 20, { radius: 3 }),
    k.color(...C.PLAYER_HEAD),
    k.anchor('top'),
    k.pos(22, -48),
  ])

  // Head (skin)
  const head = player.add([
    k.rect(34, 26, { radius: 4 }),
    k.color(...C.PLAYER_HEAD),
    k.anchor('bot'),
    k.pos(0, -52),
  ])

  // Hair (orange) on top of head
  head.add([
    k.rect(36, 10, { radius: 4 }),
    k.color(...C.PLAYER_HAIR),
    k.anchor('bot'),
    k.pos(0, -26),
  ])

  // Left eye white
  head.add([
    k.rect(8, 8, { radius: 4 }),
    k.color(...C.PLAYER_EYE_WHITE),
    k.anchor('center'),
    k.pos(-8, -12),
  ])

  // Right eye white
  head.add([
    k.rect(8, 8, { radius: 4 }),
    k.color(...C.PLAYER_EYE_WHITE),
    k.anchor('center'),
    k.pos(8, -12),
  ])

  // Left eye pupil
  head.add([
    k.rect(5, 5, { radius: 2 }),
    k.color(...C.PLAYER_EYES),
    k.anchor('center'),
    k.pos(-8, -11),
  ])

  // Right eye pupil
  head.add([
    k.rect(5, 5, { radius: 2 }),
    k.color(...C.PLAYER_EYES),
    k.anchor('center'),
    k.pos(8, -11),
  ])

  // Running animation state
  let runTime = 0
  let trailTimer = 0

  // Single unified update handler for all player updates
  player.onUpdate(() => {
    if (!player.exists()) return
    
    const dt = k.dt()
    runTime += dt * 8
    
    // Head bob animation
    head.pos.y = -52 + Math.sin(runTime * 0.75) * 2

    // Arm swing (opposite phases)
    leftArm.pos.y = -48 + Math.sin(runTime) * 4
    rightArm.pos.y = -48 + Math.sin(runTime + Math.PI) * 4

    // Shoe alternate (running feet)
    leftShoe.pos.y = Math.sin(runTime) * 2
    rightShoe.pos.y = Math.sin(runTime + Math.PI) * 2
    
    // Trail particles (reduced frequency: 0.2s)
    trailTimer += dt
    if (trailTimer >= 0.2) {
      trailTimer = 0
      k.add([
        k.rect(6, 6, { radius: 3 }),
        k.pos(player.pos.x + k.rand(-8, 8), player.pos.y - 4),
        k.anchor('center'),
        k.color(...C.PARTICLE_DUST),
        k.opacity(0.5),
        k.lifespan(0.25, { fade: 0.15 }),
        k.z(50),
      ])
    }
  })

  return player
}

export function jumpPlayer(k: KAPLAYCtx, player: GameObj): boolean {
  if (!player.exists()) return false

  const jumpDur = GAME_CONFIG.JUMP_DURATION

  // Jump dust particles (2 from feet)
  for (let i = 0; i < 2; i++) {
    k.add([
      k.rect(6, 4, { radius: 2 }),
      k.pos(player.pos.x + k.rand(-10, 10), player.pos.y),
      k.anchor('center'),
      k.color(...C.PARTICLE_DUST),
      k.opacity(0.6),
      k.lifespan(0.2, { fade: 0.15 }),
      k.move(270 + k.rand(-30, 30), 100),
      k.z(50),
    ])
  }

  // Shrink shadow during jump
  const shadow = player.children?.find((c: any) => c.is?.('playerShadow'))
  if (shadow) {
    k.tween(1, 0.5, jumpDur * 0.5, (v: number) => { if (shadow.exists()) shadow.scale = k.vec2(v, 1) }, k.easings.easeOutQuad)
    k.wait(jumpDur * 0.5, () => {
      k.tween(0.5, 1, jumpDur * 0.5, (v: number) => { if (shadow.exists()) shadow.scale = k.vec2(v, 1) }, k.easings.easeOutBounce)
    })
  }

  // Squash before jump
  k.tween(
    k.vec2(1, 1),
    k.vec2(0.8, 1.3),
    jumpDur * 0.2,
    (v: any) => { if (player.exists()) player.scaleTo(v) },
    k.easings.easeOutQuad,
  ).then(() => {
    if (!player.exists()) return
    // Stretch up
    k.tween(
      k.vec2(0.8, 1.3),
      k.vec2(1.1, 0.9),
      jumpDur * 0.5,
      (v: any) => { if (player.exists()) player.scaleTo(v) },
      k.easings.easeOutQuad,
    ).then(() => {
      if (!player.exists()) return
      // Return to normal
      k.tween(
        k.vec2(1.1, 0.9),
        k.vec2(1, 1),
        jumpDur * 0.3,
        (v: any) => { if (player.exists()) player.scaleTo(v) },
        k.easings.easeOutBounce,
      )
    })
  })

  return true
}

export function slidePlayer(k: KAPLAYCtx, player: GameObj): boolean {
  if (!player.exists()) return false

  const slideDur = GAME_CONFIG.SLIDE_DURATION

  // Speed streak on slide
  k.add([
    k.rect(20, 2),
    k.pos(player.pos.x, player.pos.y - 20),
    k.anchor('center'),
    k.color(...C.SPEED_LINE),
    k.opacity(0.4),
    k.lifespan(0.15, { fade: 0.12 }),
    k.z(95),
  ])

  // Expand shadow during slide
  const shadow = player.children?.find((c: any) => c.is?.('playerShadow'))
  if (shadow) {
    k.tween(1, 1.4, slideDur * 0.2, (v: number) => { if (shadow.exists()) shadow.scale = k.vec2(v, 1) }, k.easings.easeOutQuad)
    k.wait(slideDur * 0.7, () => {
      k.tween(1.4, 1, slideDur * 0.3, (v: number) => { if (shadow.exists()) shadow.scale = k.vec2(v, 1) }, k.easings.easeOutQuad)
    })
  }

  // Flatten for slide
  k.tween(
    k.vec2(1, 1),
    k.vec2(1.4, 0.5),
    slideDur * 0.2,
    (v: any) => { if (player.exists()) player.scaleTo(v) },
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
        (v: any) => { if (player.exists()) player.scaleTo(v) },
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
    C.PLAYER_SHOES,
  ]

  // 10 particles for dramatic death
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * 360
    const color = colors[i % colors.length]!

    k.add([
      k.rect(k.rand(6, 14), k.rand(6, 14), { radius: 2 }),
      k.pos(x, y - 30),
      k.anchor('center'),
      k.color(color[0], color[1], color[2]),
      k.opacity(1),
      k.lifespan(0.45, { fade: 0.3 }),
      k.move(angle, k.rand(150, 320)),
      k.z(200),
    ])
  }
}

export function createLaneSwitchDust(k: KAPLAYCtx, x: number, y: number, direction: 'left' | 'right') {
  const angle = direction === 'left' ? 45 : 315
  for (let i = 0; i < 2; i++) {
    k.add([
      k.rect(5, 5, { radius: 2 }),
      k.pos(x + k.rand(-5, 5), y - 2),
      k.anchor('center'),
      k.color(...C.PARTICLE_DUST),
      k.opacity(0.5),
      k.lifespan(0.2, { fade: 0.15 }),
      k.move(angle + k.rand(-20, 20), 120),
      k.z(50),
    ])
  }
}

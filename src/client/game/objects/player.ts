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

  // Shadow under player (oval shape simulated with rect)
  player.add([
    k.rect(50, 12),
    k.color(0, 0, 0),
    k.anchor('center'),
    k.pos(0, -2),
    k.opacity(0.3),
  ])

  // === LEGS with running animation ===
  // Left leg
  const leftLeg = player.add([
    k.rect(12, 22),
    k.color(...C.PLAYER_PANTS),
    k.anchor('top'),
    k.pos(-8, -2),
  ])
  // Left shoe
  const leftShoe = leftLeg.add([
    k.rect(16, 8),
    k.color(...C.PLAYER_SHOES),
    k.anchor('topleft'),
    k.pos(-4, 20),
  ])
  leftShoe.add([
    k.rect(16, 3),
    k.color(...C.PLAYER_SHOES_SOLE),
    k.anchor('topleft'),
    k.pos(0, 5),
  ])

  // Right leg
  const rightLeg = player.add([
    k.rect(12, 22),
    k.color(...C.PLAYER_PANTS),
    k.anchor('top'),
    k.pos(8, -2),
  ])
  // Right shoe
  const rightShoe = rightLeg.add([
    k.rect(16, 8),
    k.color(...C.PLAYER_SHOES),
    k.anchor('topleft'),
    k.pos(-4, 20),
  ])
  rightShoe.add([
    k.rect(16, 3),
    k.color(...C.PLAYER_SHOES_SOLE),
    k.anchor('topleft'),
    k.pos(0, 5),
  ])

  // === BODY - Hoodie ===
  // Body base (hoodie)
  const body = player.add([
    k.rect(40, 36),
    k.color(...C.PLAYER_HOODIE),
    k.anchor('bot'),
    k.pos(0, -22),
  ])

  // Hoodie side shading (left)
  body.add([
    k.rect(8, 34),
    k.color(...C.PLAYER_HOODIE_DARK),
    k.anchor('topleft'),
    k.pos(-20, 1),
  ])

  // Hoodie collar / front detail
  body.add([
    k.rect(16, 8),
    k.color(...C.PLAYER_HOODIE_DARK),
    k.anchor('top'),
    k.pos(0, 2),
  ])

  // Hoodie pocket
  body.add([
    k.rect(24, 10),
    k.color(...C.PLAYER_HOODIE_DARK),
    k.anchor('center'),
    k.pos(0, -12),
    k.opacity(0.5),
  ])

  // === ARMS ===
  // Left arm
  const leftArm = player.add([
    k.rect(10, 28),
    k.color(...C.PLAYER_HOODIE),
    k.anchor('top'),
    k.pos(-22, -54),
  ])
  // Left hand
  leftArm.add([
    k.rect(10, 10),
    k.color(...C.PLAYER_SKIN),
    k.anchor('top'),
    k.pos(0, 26),
  ])

  // Right arm
  const rightArm = player.add([
    k.rect(10, 28),
    k.color(...C.PLAYER_HOODIE),
    k.anchor('top'),
    k.pos(22, -54),
  ])
  // Right hand
  rightArm.add([
    k.rect(10, 10),
    k.color(...C.PLAYER_SKIN),
    k.anchor('top'),
    k.pos(0, 26),
  ])

  // === HEAD ===
  const head = player.add([
    k.rect(32, 30),
    k.color(...C.PLAYER_SKIN),
    k.anchor('bot'),
    k.pos(0, -58),
  ])

  // Hair
  head.add([
    k.rect(34, 14),
    k.color(...C.PLAYER_HAIR),
    k.anchor('bot'),
    k.pos(0, -28),
  ])

  // Hair side tuft left
  head.add([
    k.rect(6, 8),
    k.color(...C.PLAYER_HAIR),
    k.anchor('center'),
    k.pos(-14, -22),
  ])

  // Hair side tuft right
  head.add([
    k.rect(6, 8),
    k.color(...C.PLAYER_HAIR),
    k.anchor('center'),
    k.pos(14, -22),
  ])

  // Left eye
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

  // Right eye
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

  // Mouth (small smile)
  head.add([
    k.rect(8, 2),
    k.color(180, 100, 80),
    k.anchor('center'),
    k.pos(0, -4),
  ])

  // Ear left
  head.add([
    k.rect(4, 8),
    k.color(...C.PLAYER_SKIN),
    k.anchor('center'),
    k.pos(-17, -14),
  ])

  // Ear right
  head.add([
    k.rect(4, 8),
    k.color(...C.PLAYER_SKIN),
    k.anchor('center'),
    k.pos(17, -14),
  ])

  // Animation state
  let runTime = 0
  let trailTimer = 0

  player.onUpdate(() => {
    if (!player.exists()) return

    const dt = k.dt()
    runTime += dt * 12

    // Running leg animation - smooth sine wave
    const legSwing = Math.sin(runTime) * 8
    leftLeg.pos.y = -2 + legSwing
    rightLeg.pos.y = -2 - legSwing

    // Arm swing (opposite to legs)
    const armSwing = Math.sin(runTime) * 6
    leftArm.pos.y = -54 - armSwing
    rightArm.pos.y = -54 + armSwing

    // Subtle body bob
    const bodyBob = Math.abs(Math.sin(runTime * 2)) * 2
    body.pos.y = -22 - bodyBob
    head.pos.y = -58 - bodyBob

    // Trail particles (dust effect)
    trailTimer += dt
    if (trailTimer >= 0.12) {
      trailTimer = 0
      // Dust puff from feet
      k.add([
        k.rect(k.rand(6, 10), k.rand(4, 8)),
        k.pos(player.pos.x + k.rand(-12, 12), player.pos.y - 4),
        k.anchor('center'),
        k.color(...C.DUST),
        k.opacity(0.5),
        k.lifespan(0.3, { fade: 0.2 }),
        k.move(k.Vec2.UP, k.rand(20, 40)),
        k.z(50),
      ])
    }
  })

  return player
}

export function jumpPlayer(k: KAPLAYCtx, player: GameObj): boolean {
  if (!player.exists()) return false

  const jumpDur = GAME_CONFIG.JUMP_DURATION
  const jumpHeight = 80

  // Jump dust burst
  for (let i = 0; i < 6; i++) {
    k.add([
      k.rect(k.rand(8, 14), k.rand(6, 10)),
      k.pos(player.pos.x + k.rand(-20, 20), player.pos.y - 5),
      k.anchor('center'),
      k.color(...C.DUST),
      k.opacity(0.7),
      k.lifespan(0.35, { fade: 0.25 }),
      k.move(k.rand(200, 340), k.rand(60, 120)),
      k.z(50),
    ])
  }

  // Anticipation squash
  k.tween(
    k.vec2(1, 1),
    k.vec2(1.15, 0.8),
    jumpDur * 0.12,
    (v) => { if (player.exists()) player.scaleTo(v) },
    k.easings.easeOutQuad,
  ).then(() => {
    if (!player.exists()) return

    // Launch stretch
    k.tween(
      k.vec2(1.15, 0.8),
      k.vec2(0.85, 1.2),
      jumpDur * 0.15,
      (v) => { if (player.exists()) player.scaleTo(v) },
      k.easings.easeOutQuad,
    )

    // Move up
    const startY = player.pos.y
    k.tween(
      0,
      1,
      jumpDur * 0.45,
      (t) => {
        if (player.exists()) {
          // Parabolic jump arc
          const arc = Math.sin(t * Math.PI)
          player.pos.y = startY - (jumpHeight * arc)
        }
      },
      k.easings.linear,
    ).then(() => {
      if (!player.exists()) return
      // Landing squash
      k.tween(
        k.vec2(0.85, 1.2),
        k.vec2(1.2, 0.85),
        jumpDur * 0.12,
        (v) => { if (player.exists()) player.scaleTo(v) },
        k.easings.easeOutQuad,
      ).then(() => {
        if (!player.exists()) return
        // Landing dust
        for (let i = 0; i < 4; i++) {
          k.add([
            k.rect(k.rand(6, 12), k.rand(5, 9)),
            k.pos(player.pos.x + k.rand(-15, 15), player.pos.y - 3),
            k.anchor('center'),
            k.color(...C.DUST),
            k.opacity(0.6),
            k.lifespan(0.25, { fade: 0.18 }),
            k.move(k.rand(160, 380), k.rand(50, 90)),
            k.z(50),
          ])
        }
        // Return to normal
        k.tween(
          k.vec2(1.2, 0.85),
          k.vec2(1, 1),
          jumpDur * 0.16,
          (v) => { if (player.exists()) player.scaleTo(v) },
          k.easings.easeOutBounce,
        )
      })
    })
  })

  return true
}

export function slidePlayer(k: KAPLAYCtx, player: GameObj): boolean {
  if (!player.exists()) return false

  const slideDur = GAME_CONFIG.SLIDE_DURATION

  // Slide spark effect
  for (let i = 0; i < 3; i++) {
    k.wait(i * 0.08, () => {
      k.add([
        k.rect(k.rand(4, 8), k.rand(3, 6)),
        k.pos(player.pos.x + k.rand(-15, 15), player.pos.y - 8),
        k.anchor('center'),
        k.color(...C.SPARK),
        k.opacity(0.9),
        k.lifespan(0.2, { fade: 0.15 }),
        k.move(k.rand(180, 360), k.rand(80, 140)),
        k.z(50),
      ])
    })
  }

  // Flatten for slide
  k.tween(
    k.vec2(1, 1),
    k.vec2(1.5, 0.45),
    slideDur * 0.15,
    (v) => { if (player.exists()) player.scaleTo(v) },
    k.easings.easeOutQuad,
  ).then(() => {
    if (!player.exists()) return
    // Hold flat
    k.wait(slideDur * 0.55, () => {
      if (!player.exists()) return
      // Return to normal with bounce
      k.tween(
        k.vec2(1.5, 0.45),
        k.vec2(0.9, 1.1),
        slideDur * 0.15,
        (v) => { if (player.exists()) player.scaleTo(v) },
        k.easings.easeOutQuad,
      ).then(() => {
        if (!player.exists()) return
        k.tween(
          k.vec2(0.9, 1.1),
          k.vec2(1, 1),
          slideDur * 0.15,
          (v) => { if (player.exists()) player.scaleTo(v) },
          k.easings.easeOutQuad,
        )
      })
    })
  })

  return true
}

export function createDeathParticles(k: KAPLAYCtx, x: number, y: number) {
  const colors: [number, number, number][] = [
    C.PLAYER_HOODIE,
    C.PLAYER_SKIN,
    C.PLAYER_HAIR,
    C.PLAYER_PANTS,
    C.PLAYER_SHOES,
  ]

  // Explosion of character parts
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * 360
    const color = colors[i % colors.length]!

    k.add([
      k.rect(k.rand(8, 16), k.rand(8, 16)),
      k.pos(x, y - 40),
      k.anchor('center'),
      k.color(color[0], color[1], color[2]),
      k.opacity(1),
      k.lifespan(0.6, { fade: 0.4 }),
      k.move(angle, k.rand(200, 400)),
      k.z(200),
    ])
  }

  // Star burst effect
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * 360
    k.add([
      k.rect(4, 4),
      k.pos(x, y - 40),
      k.anchor('center'),
      k.color(...C.SPARK),
      k.opacity(1),
      k.lifespan(0.4, { fade: 0.3 }),
      k.move(angle, k.rand(150, 250)),
      k.z(210),
    ])
  }
}

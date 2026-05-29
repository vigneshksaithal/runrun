import type { KAPLAYCtx, GameObj } from 'kaplay'
import { GAME_CONFIG } from '../config'

const C = GAME_CONFIG.COLORS

/**
 * Builds a Subway-Surfers-style runner (red cap, white hoodie, blue jeans,
 * yellow sneakers, teal backpack) seen from behind. Returns the root object;
 * legs / arms / head are animated for a convincing running cycle.
 */
export function createPlayer(k: KAPLAYCtx): GameObj {
  const player = k.add([
    k.pos(GAME_CONFIG.VANISHING_POINT_X, GAME_CONFIG.PLAYER_Y),
    k.anchor('bot'),
    k.z(100),
    k.scale(1),
    k.opacity(1),
    'player',
  ])

  // --- LEGS + SHOES (kept on the ground; animated individually) ---
  const leftLeg = player.add([k.rect(14, 24), k.anchor('bot'), k.pos(-9, 0), k.color(...C.JEANS_DARK)])
  const rightLeg = player.add([k.rect(14, 24), k.anchor('bot'), k.pos(9, 0), k.color(...C.JEANS)])
  const leftShoe = player.add([k.rect(17, 9, { radius: 3 }), k.anchor('bot'), k.pos(-9, 1), k.color(...C.SHOE)])
  const rightShoe = player.add([k.rect(17, 9, { radius: 3 }), k.anchor('bot'), k.pos(9, 1), k.color(...C.SHOE)])
  leftShoe.add([k.rect(17, 3), k.anchor('bot'), k.pos(0, 0), k.color(...C.SHOE_DARK)])
  rightShoe.add([k.rect(17, 3), k.anchor('bot'), k.pos(0, 0), k.color(...C.SHOE_DARK)])

  // --- UPPER BODY RIG (bobs up/down while running) ---
  const rig = player.add([k.pos(0, 0)])

  // Backpack (behind the torso)
  rig.add([k.rect(30, 30, { radius: 6 }), k.anchor('bot'), k.pos(0, -26), k.color(...C.BACKPACK_DARK)])
  rig.add([k.rect(24, 22, { radius: 5 }), k.anchor('bot'), k.pos(0, -30), k.color(...C.BACKPACK)])

  // Arms (swing)
  const leftArm = rig.add([k.rect(9, 26, { radius: 4 }), k.anchor('top'), k.pos(-19, -52), k.color(...C.HOODIE_SHADE)])
  const rightArm = rig.add([k.rect(9, 26, { radius: 4 }), k.anchor('top'), k.pos(19, -52), k.color(...C.HOODIE)])

  // Torso (white hoodie) with shading + graffiti accents
  rig.add([k.rect(36, 34, { radius: 6 }), k.anchor('bot'), k.pos(0, -24), k.color(...C.HOODIE)])
  rig.add([k.rect(12, 34, { radius: 6 }), k.anchor('bot'), k.pos(11, -24), k.color(...C.HOODIE_SHADE)])
  rig.add([k.rect(10, 8, { radius: 2 }), k.anchor('center'), k.pos(-7, -40), k.color(...C.HOODIE_ACCENT)])
  rig.add([k.rect(7, 6, { radius: 2 }), k.anchor('center'), k.pos(6, -32), k.color(...C.HOODIE_ACCENT2)])
  // Hood resting on the back of the neck
  rig.add([k.rect(22, 10, { radius: 4 }), k.anchor('bot'), k.pos(0, -52), k.color(...C.HOODIE_SHADE)])

  // Head (back of head)
  const head = rig.add([k.pos(0, -54), k.anchor('bot')])
  head.add([k.rect(24, 22, { radius: 6 }), k.anchor('bot'), k.pos(0, 0), k.color(...C.SKIN)])
  head.add([k.rect(24, 8), k.anchor('bot'), k.pos(0, 0), k.color(...C.SKIN_DARK), k.opacity(0.4)])
  // Red cap (dome + back strap + button)
  head.add([k.rect(26, 14, { radius: [7, 7, 0, 0] }), k.anchor('bot'), k.pos(0, -22), k.color(...C.CAP)])
  head.add([k.rect(26, 5), k.anchor('bot'), k.pos(0, -22), k.color(...C.CAP_DARK)])
  head.add([k.rect(8, 4), k.anchor('center'), k.pos(0, -28), k.color(...C.CAP_DARK)]) // adjuster strap
  head.add([k.circle(3), k.anchor('center'), k.pos(0, -35), k.color(...C.CAP_DARK)]) // top button

  // --- RUN ANIMATION ---
  let runTime = 0
  let trailTimer = 0
  const shoeBaseY = 1
  const armBaseY = -52

  player.onUpdate(() => {
    if (!player.exists()) return
    const dt = k.dt()
    runTime += dt * 11

    // Upper body bob
    rig.pos.y = Math.abs(Math.sin(runTime)) * -3

    // Head bob (counter)
    head.pos.y = -54 - Math.abs(Math.sin(runTime + 0.4)) * 1.5

    // Leg / shoe stride
    const lLift = Math.max(0, Math.sin(runTime))
    const rLift = Math.max(0, Math.sin(runTime + Math.PI))
    leftShoe.pos.y = shoeBaseY - lLift * 9
    rightShoe.pos.y = shoeBaseY - rLift * 9
    leftShoe.pos.x = -9 + lLift * 4
    rightShoe.pos.x = 9 + rLift * 4
    leftLeg.height = 24 - lLift * 6
    rightLeg.height = 24 - rLift * 6

    // Arm swing
    leftArm.pos.y = armBaseY + Math.sin(runTime) * 4
    rightArm.pos.y = armBaseY - Math.sin(runTime) * 4

    // Dust kicked up by the feet
    trailTimer += dt
    if (trailTimer >= 0.18) {
      trailTimer = 0
      k.add([
        k.circle(k.rand(2, 4)),
        k.pos(player.pos.x + k.rand(-10, 10), player.pos.y - 2),
        k.anchor('center'),
        k.color(...C.DUST),
        k.opacity(0.55),
        k.lifespan(0.3, { fade: 0.2 }),
        k.z(50),
      ])
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
    C.HOODIE,
    C.CAP,
    C.JEANS,
    C.SHOE,
  ]

  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * 360
    const color = colors[i % colors.length]!

    k.add([
      k.rect(k.rand(6, 12), k.rand(6, 12)),
      k.pos(x, y - 30),
      k.anchor('center'),
      k.color(color[0], color[1], color[2]),
      k.opacity(1),
      k.lifespan(0.35, { fade: 0.25 }),
      k.move(angle, k.rand(150, 300)),
      k.z(200),
    ])
  }
}

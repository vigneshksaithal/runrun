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

  // Drop shadow under feet (squashed circle = ellipse).
  // Anchored to player so it lane-tilts with him; the squash is hand-tuned
  // so it stays visually consistent through the existing jump/slide tweens.
  player.add([
    k.circle(16),
    k.color(...C.SHADOW),
    k.opacity(0.35),
    k.anchor('center'),
    k.scale(k.vec2(1, 0.32)),
    k.pos(0, -2),
    k.z(-1), // behind body inside the player parent
  ])

  // Legs (bottom)
  player.add([
    k.rect(30, 16),
    k.color(...C.PLAYER_LEGS),
    k.outline(2, k.rgb(C.OUTLINE[0], C.OUTLINE[1], C.OUTLINE[2])),
    k.anchor('bot'),
    k.pos(0, 0),
  ])

  // Body (teal)
  player.add([
    k.rect(38, 30),
    k.color(...C.PLAYER_BODY),
    k.outline(2, k.rgb(C.OUTLINE[0], C.OUTLINE[1], C.OUTLINE[2])),
    k.anchor('bot'),
    k.pos(0, -16),
  ])

  // Head (skin) — outlined for silhouette pop against busy backgrounds
  const head = player.add([
    k.rect(34, 26),
    k.color(...C.PLAYER_HEAD),
    k.outline(2, k.rgb(C.OUTLINE[0], C.OUTLINE[1], C.OUTLINE[2])),
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
  const eyeL = head.add([
    k.rect(5, 5),
    k.color(...C.PLAYER_EYES),
    k.anchor('center'),
    k.scale(1),
    k.pos(-8, -10),
  ])

  // Right eye
  const eyeR = head.add([
    k.rect(5, 5),
    k.color(...C.PLAYER_EYES),
    k.anchor('center'),
    k.scale(1),
    k.pos(8, -10),
  ])

  // Running animation state
  let runTime = 0
  let trailTimer = 0
  let blinkTimer = 0
  let blinkPhase = 0 // 0 = open, 1 = closing, 2 = opening

  // Single unified update handler for all player updates
  player.onUpdate(() => {
    if (!player.exists()) return

    const dt = k.dt()

    // Head bob animation
    runTime += dt * 6
    head.pos.y = -46 + Math.sin(runTime) * 2

    // Eye blink ~ every 4s, full blink in ~0.12s
    blinkTimer += dt
    if (blinkPhase === 0 && blinkTimer >= 4.0) {
      blinkPhase = 1
      blinkTimer = 0
    }
    if (blinkPhase === 1) {
      // closing 0.06s
      const t = Math.min(1, blinkTimer / 0.06)
      const sy = 1 - t * 0.9 // down to 0.1
      eyeL.scale = k.vec2(1, sy)
      eyeR.scale = k.vec2(1, sy)
      if (t >= 1) { blinkPhase = 2; blinkTimer = 0 }
    } else if (blinkPhase === 2) {
      // opening 0.06s
      const t = Math.min(1, blinkTimer / 0.06)
      const sy = 0.1 + t * 0.9
      eyeL.scale = k.vec2(1, sy)
      eyeR.scale = k.vec2(1, sy)
      if (t >= 1) { blinkPhase = 0; blinkTimer = 0 }
    }

    // Trail particles (reduced frequency: 0.2s instead of 0.15s)
    trailTimer += dt
    if (trailTimer >= 0.2) {
      trailTimer = 0
      k.add([
        k.rect(6, 6),
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
  ]

  // Reduced to 8 particles (down from 12) using built-in move()
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

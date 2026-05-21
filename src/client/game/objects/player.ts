import type { KAPLAYCtx } from 'kaplay'
import { GAME_CONFIG } from '../config'

const { COLORS } = GAME_CONFIG

export type PlayerState = 'running' | 'jumping' | 'sliding'

export function createPlayer(k: KAPLAYCtx, x: number) {
  const playerState = { current: 'running' as PlayerState }
  let trailTimer = 0

  const player = k.add([
    k.pos(x, GAME_CONFIG.PLAYER_Y),
    k.anchor('bot'),
    k.scale(1),
    k.z(100),
    'player',
  ])

  // Body (teal)
  const body = player.add([
    k.rect(GAME_CONFIG.PLAYER_WIDTH, 35),
    k.pos(-GAME_CONFIG.PLAYER_WIDTH / 2, -35),
    k.color(...COLORS.PLAYER_BODY),
    k.z(1),
  ])

  // Head (skin tone)
  const head = player.add([
    k.rect(GAME_CONFIG.PLAYER_WIDTH - 6, 28),
    k.pos(-(GAME_CONFIG.PLAYER_WIDTH - 6) / 2, -63),
    k.color(...COLORS.PLAYER_HEAD),
    k.z(2),
  ])

  // Hair (orange top)
  player.add([
    k.rect(GAME_CONFIG.PLAYER_WIDTH - 6, 10),
    k.pos(-(GAME_CONFIG.PLAYER_WIDTH - 6) / 2, -63),
    k.color(...COLORS.PLAYER_HAIR),
    k.z(3),
  ])

  // Eyes
  player.add([k.rect(5, 5), k.pos(-10, -50), k.color(30, 30, 30), k.z(3)])
  player.add([k.rect(5, 5), k.pos(5, -50), k.color(30, 30, 30), k.z(3)])

  // Legs (alternating for run animation)
  const leftLeg = player.add([
    k.rect(16, 20),
    k.pos(-GAME_CONFIG.PLAYER_WIDTH / 2 + 4, -20),
    k.color(...COLORS.PLAYER_LEGS),
    k.z(0),
  ])

  const rightLeg = player.add([
    k.rect(16, 20),
    k.pos(GAME_CONFIG.PLAYER_WIDTH / 2 - 20, -20),
    k.color(...COLORS.PLAYER_LEGS),
    k.z(0),
  ])

  // Arms
  const leftArm = player.add([
    k.rect(8, 22),
    k.pos(-GAME_CONFIG.PLAYER_WIDTH / 2 - 8, -33),
    k.color(...COLORS.PLAYER_BODY),
    k.z(1),
  ])

  const rightArm = player.add([
    k.rect(8, 22),
    k.pos(GAME_CONFIG.PLAYER_WIDTH / 2, -33),
    k.color(...COLORS.PLAYER_BODY),
    k.z(1),
  ])

  // Running animation
  let bobTime = 0
  const bobAction = player.onUpdate(() => {
    if (playerState.current === 'running') {
      bobTime += k.dt() * 12
      const bob = Math.sin(bobTime) * 2.5
      head.pos.y = -63 + bob
      body.pos.y = -35 + bob * 0.4

      // Leg alternation (running feel)
      const legSwing = Math.sin(bobTime) * 5
      leftLeg.pos.y = -20 + legSwing
      rightLeg.pos.y = -20 - legSwing

      // Arm swing
      const armSwing = Math.sin(bobTime) * 6
      leftArm.pos.y = -33 + armSwing
      rightArm.pos.y = -33 - armSwing
    }

    // Bright trail while running
    trailTimer += k.dt()
    if (playerState.current === 'running' && trailTimer > 0.1) {
      trailTimer = 0
      k.add([
        k.rect(k.rand(3, 6), k.rand(3, 6)),
        k.pos(player.pos.x + k.rand(-10, 10), player.pos.y - k.rand(2, 8)),
        k.color(200, 240, 255),
        k.opacity(0.4),
        k.anchor('center'),
        k.lifespan(0.25, { fade: 0.15 }),
        k.z(90),
      ])
    }
  })

  function jump() {
    if (playerState.current !== 'running') return
    if (!player.exists()) return
    playerState.current = 'jumping'

    // Squash before jump
    player.scaleTo(1.1, 0.8)

    k.tween(
      player.pos.y,
      GAME_CONFIG.PLAYER_Y - 95,
      GAME_CONFIG.JUMP_DURATION * 0.4,
      (val: number) => { if (player.exists()) player.pos.y = val },
      k.easings.easeOutQuad
    ).then(() => {
      if (!player.exists()) return
      return k.tween(
        player.pos.y,
        GAME_CONFIG.PLAYER_Y,
        GAME_CONFIG.JUMP_DURATION * 0.6,
        (val: number) => { if (player.exists()) player.pos.y = val },
        k.easings.easeInQuad
      )
    }).then(() => {
      if (!player.exists()) return
      playerState.current = 'running'
      // Stretch on landing (guarded)
      if (player.exists()) player.scaleTo(0.9, 1.1)
      k.tween(1.1, 1, 0.12, (val: number) => { if (player.exists()) player.scaleTo(1, val) }, k.easings.easeOutQuad)

      // Landing sparkle
      for (let i = 0; i < 4; i++) {
        k.add([
          k.rect(4, 4),
          k.pos(player.pos.x + k.rand(-20, 20), GAME_CONFIG.PLAYER_Y),
          k.color(200, 230, 255),
          k.opacity(0.8),
          k.anchor('center'),
          k.move(k.Vec2.fromAngle(k.rand(-180, 0)), k.rand(40, 80)),
          k.lifespan(0.25, { fade: 0.15 }),
          k.z(90),
        ])
      }
    })

    k.tween(0.8, 1, GAME_CONFIG.JUMP_DURATION * 0.3, (val: number) => { if (player.exists()) player.scaleTo(val, 2 - val) }, k.easings.easeOutQuad)
  }

  function slide() {
    if (playerState.current !== 'running') return
    if (!player.exists()) return
    playerState.current = 'sliding'

    player.scaleTo(1.3, 0.4)
    player.pos.y = GAME_CONFIG.PLAYER_Y + 12

    k.wait(GAME_CONFIG.SLIDE_DURATION, () => {
      if (!player.exists()) return
      playerState.current = 'running'
      k.tween(0.4, 1, 0.15, (val: number) => { if (player.exists()) player.scaleTo(1 + (1.3 - 1) * (1 - val), val) }, k.easings.easeOutBack)
      player.pos.y = GAME_CONFIG.PLAYER_Y
    })
  }

  function setX(newX: number) {
    player.pos.x = newX
  }

  function destroy() {
    bobAction.cancel()
    player.destroy()
  }

  return { obj: player, state: playerState, jump, slide, setX, destroy }
}

export function createDeathParticles(k: KAPLAYCtx, x: number, y: number) {
  const colors: Array<[number, number, number]> = [
    COLORS.PLAYER_BODY,
    COLORS.PLAYER_HEAD,
    COLORS.PLAYER_LEGS,
    COLORS.PLAYER_HAIR,
    [255, 100, 100],
  ]

  for (let i = 0; i < 20; i++) {
    const color = colors[Math.floor(Math.random() * colors.length)]!
    const size = k.rand(5, 14)
    k.add([
      k.rect(size, size),
      k.pos(x, y - 30),
      k.color(...color),
      k.opacity(1),
      k.anchor('center'),
      k.move(k.Vec2.fromAngle(k.rand(0, 360)), k.rand(100, 300)),
      k.lifespan(0.8, { fade: 0.4 }),
      k.rotate(k.rand(0, 360)),
      k.z(200),
    ])
  }
}

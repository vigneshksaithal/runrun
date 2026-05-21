import type { KAPLAYCtx } from 'kaplay'
import { GAME_CONFIG } from '../config'

const { COLORS } = GAME_CONFIG

export type PlayerState = 'running' | 'jumping' | 'sliding'

export function createPlayer(k: KAPLAYCtx, x: number) {
  const playerState = { current: 'running' as PlayerState }

  // Create player as a compound shape container
  const player = k.add([
    k.pos(x, GAME_CONFIG.PLAYER_Y),
    k.anchor('bot'),
    k.scale(1),
    k.z(100),
    'player',
  ])

  // Body (teal shirt)
  const body = player.add([
    k.rect(GAME_CONFIG.PLAYER_WIDTH, 28),
    k.pos(-GAME_CONFIG.PLAYER_WIDTH / 2, -28),
    k.color(...COLORS.PLAYER_BODY),
    k.z(1),
  ])

  // Head (skin tone)
  const head = player.add([
    k.rect(GAME_CONFIG.PLAYER_WIDTH - 4, 24),
    k.pos(-(GAME_CONFIG.PLAYER_WIDTH - 4) / 2, -52),
    k.color(...COLORS.PLAYER_HEAD),
    k.z(2),
  ])

  // Hair (brown top)
  player.add([
    k.rect(GAME_CONFIG.PLAYER_WIDTH - 4, 6),
    k.pos(-(GAME_CONFIG.PLAYER_WIDTH - 4) / 2, -52),
    k.color(...COLORS.PLAYER_HAIR),
    k.z(3),
  ])

  // Eyes (simple black squares)
  player.add([
    k.rect(4, 4),
    k.pos(-8, -42),
    k.color(0, 0, 0),
    k.z(3),
  ])
  player.add([
    k.rect(4, 4),
    k.pos(4, -42),
    k.color(0, 0, 0),
    k.z(3),
  ])

  // Legs (dark blue)
  player.add([
    k.rect(GAME_CONFIG.PLAYER_WIDTH - 8, 16),
    k.pos(-(GAME_CONFIG.PLAYER_WIDTH - 8) / 2, -16),
    k.color(...COLORS.PLAYER_LEGS),
    k.z(0),
  ])

  // Idle bob animation
  let bobTime = 0
  const bobAction = player.onUpdate(() => {
    if (playerState.current === 'running') {
      bobTime += k.dt() * 8
      const bob = Math.sin(bobTime) * 2
      head.pos.y = -52 + bob
      body.pos.y = -28 + bob * 0.5
    }
  })

  function jump() {
    if (playerState.current !== 'running') return
    playerState.current = 'jumping'

    // Squash before jump
    player.scaleTo(1.1, 0.8)

    // Jump animation
    k.tween(
      player.pos.y,
      GAME_CONFIG.PLAYER_Y - 80,
      GAME_CONFIG.JUMP_DURATION * 0.4,
      (val: number) => { player.pos.y = val },
      k.easings.easeOutQuad
    ).then(() => {
      return k.tween(
        player.pos.y,
        GAME_CONFIG.PLAYER_Y,
        GAME_CONFIG.JUMP_DURATION * 0.6,
        (val: number) => { player.pos.y = val },
        k.easings.easeInQuad
      )
    }).then(() => {
      playerState.current = 'running'
      // Landing stretch
      player.scaleTo(0.9, 1.1)
      k.tween(
        1.1,
        1,
        0.1,
        (val: number) => { player.scaleTo(1, val) },
        k.easings.easeOutQuad
      )

      // Dust particles
      for (let i = 0; i < 4; i++) {
        k.add([
          k.rect(4, 4),
          k.pos(player.pos.x + k.rand(-20, 20), GAME_CONFIG.PLAYER_Y),
          k.color(150, 130, 100),
          k.opacity(0.7),
          k.anchor('center'),
          k.move(k.Vec2.fromAngle(k.rand(-180, 0)), k.rand(30, 80)),
          k.lifespan(0.3, { fade: 0.2 }),
          k.z(90),
        ])
      }
    })

    // Stretch during jump
    k.tween(
      0.8,
      1,
      GAME_CONFIG.JUMP_DURATION * 0.3,
      (val: number) => { player.scaleTo(val, 2 - val) },
      k.easings.easeOutQuad
    )
  }

  function slide() {
    if (playerState.current !== 'running') return
    playerState.current = 'sliding'

    // Flatten the player
    player.scaleTo(1.3, 0.4)
    player.pos.y = GAME_CONFIG.PLAYER_Y + 10

    k.wait(GAME_CONFIG.SLIDE_DURATION, () => {
      playerState.current = 'running'
      k.tween(
        0.4,
        1,
        0.15,
        (val: number) => { player.scaleTo(1 + (1.3 - 1) * (1 - val), val) },
        k.easings.easeOutBack
      )
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
  const colors: Array<[number, number, number]> = [COLORS.PLAYER_BODY, COLORS.PLAYER_HEAD, COLORS.PLAYER_LEGS, COLORS.PLAYER_HAIR]

  for (let i = 0; i < 20; i++) {
    const color = colors[Math.floor(Math.random() * colors.length)]!
    const size = k.rand(4, 12)
    k.add([
      k.rect(size, size),
      k.pos(x, y - 30),
      k.color(...color),
      k.anchor('center'),
      k.move(k.Vec2.fromAngle(k.rand(0, 360)), k.rand(80, 250)),
      k.lifespan(0.8, { fade: 0.4 }),
      k.rotate(k.rand(0, 360)),
      k.z(200),
    ])
  }
}

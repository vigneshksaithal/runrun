import type { KAPLAYCtx, GameObj } from 'kaplay'
import { GAME_CONFIG, getLaneXAtDepth, getDepthScale } from '../config'

const C = GAME_CONFIG.COLORS

export function createCoin(k: KAPLAYCtx, lane: number): GameObj {
  const startY = GAME_CONFIG.LANE_Y_TOP
  const startX = getLaneXAtDepth(lane, startY)
  const startScale = getDepthScale(startY)

  const coin = k.add([
    k.pos(startX, startY),
    k.anchor('center'),
    k.scale(startScale),
    k.opacity(1),
    k.z(80),
    'coin',
    { lane, baseY: startY, bobTime: 0 },
  ])

  // Main gold body (ingot shape)
  coin.add([
    k.rect(22, 16),
    k.color(...C.COIN),
    k.anchor('center'),
    k.pos(0, 0),
  ])

  // Darker gold bottom (depth)
  coin.add([
    k.rect(22, 6),
    k.color(...C.COIN_DARK),
    k.anchor('center'),
    k.pos(0, 5),
  ])

  // White shine square
  coin.add([
    k.rect(4, 4),
    k.color(...C.COIN_SHINE),
    k.anchor('center'),
    k.pos(-6, -4),
  ])

  return coin
}

export function updateCoin(k: KAPLAYCtx, coin: GameObj, speed: number, dt: number): boolean {
  if (!coin.exists()) return false

  // Move toward player
  const moveSpeed = speed * GAME_CONFIG.ROAD_LINE_SPEED_MULT * dt
  coin.baseY += moveSpeed

  // Bob animation (±6px)
  coin.bobTime += dt * 4
  const bobOffset = Math.sin(coin.bobTime) * 6

  // Update position and scale based on depth
  const scale = getDepthScale(coin.baseY)
  const x = getLaneXAtDepth(coin.lane, coin.baseY)

  coin.pos.x = x
  coin.pos.y = coin.baseY + bobOffset
  coin.scaleTo(scale)

  // Remove if past bottom
  return coin.baseY > GAME_CONFIG.LANE_Y_BOTTOM + 50
}

export function createCoinCollectEffect(k: KAPLAYCtx, x: number, y: number, multiplier: number = 1) {
  // Reduced to 4 particles (down from 6) using built-in move() instead of manual updates
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * 360
    k.add([
      k.rect(6, 6),
      k.pos(x, y),
      k.anchor('center'),
      k.color(...C.PARTICLE_GOLD),
      k.opacity(0.9),
      k.lifespan(0.25, { fade: 0.15 }),
      k.move(angle, k.rand(80, 150)),
      k.z(150),
    ])
  }

  // "+N" text - simplified animation using built-in move()
  const pointValue = GAME_CONFIG.COIN_SCORE * multiplier
  k.add([
    k.text(`+${pointValue}`, { size: 18 }),
    k.pos(x, y - 10),
    k.anchor('center'),
    k.color(...C.TEXT_GOLD),
    k.opacity(1),
    k.lifespan(0.35, { fade: 0.2 }),
    k.move(k.Vec2.UP, 80),
    k.z(160),
  ])
}

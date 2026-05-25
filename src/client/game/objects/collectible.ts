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

  // Main gold body (ingot shape) - SCALED 1.6x
  coin.add([
    k.rect(35, 26),
    k.color(...C.COIN),
    k.anchor('center'),
    k.pos(0, 0),
  ])

  // Darker gold bottom (depth) - SCALED
  coin.add([
    k.rect(35, 10),
    k.color(...C.COIN_DARK),
    k.anchor('center'),
    k.pos(0, 8),
  ])

  // White shine square - SCALED
  coin.add([
    k.rect(6, 6),
    k.color(...C.COIN_SHINE),
    k.anchor('center'),
    k.pos(-10, -6),
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
  // 6 stepped voxel chunks (no smooth tween - stepped positions)
  const angles = [0, 60, 120, 180, 240, 300]
  for (let i = 0; i < 6; i++) {
    const angle = angles[i]! * (Math.PI / 180)
    const speed = k.rand(100, 200)
    const size = k.rand(5, 9)

    k.add([
      k.rect(size, size),
      k.pos(x, y),
      k.anchor('center'),
      k.color(...C.PARTICLE_GOLD),
      k.opacity(1),
      k.scale(1),
      k.lifespan(0.3, { fade: 0.2 }),
      k.move(k.Vec2.fromAngle(k.rad2deg(angle)), speed),
      k.z(150),
    ])
  }

  // "+N" text with multiplier-aware value (3-step rise)
  const pointValue = GAME_CONFIG.COIN_SCORE * multiplier
  const txt = k.add([
    k.text(`+${pointValue}`, { size: 20 }),
    k.pos(x, y - 10),
    k.anchor('center'),
    k.color(...C.TEXT_GOLD),
    k.opacity(1),
    k.scale(1.4),
    k.lifespan(0.45, { fade: 0.3 }),
    k.z(160),
  ])

  // Stepped rise: 3 discrete y positions instead of smooth tween
  const startY = txt.pos.y
  k.wait(0.1, () => { if (txt.exists()) txt.pos.y = startY - 12 })
  k.wait(0.2, () => { if (txt.exists()) { txt.pos.y = startY - 24; txt.scale = k.vec2(1) } })
  k.wait(0.3, () => { if (txt.exists()) txt.pos.y = startY - 36 })
}

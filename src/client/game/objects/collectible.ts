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

export function createCoinCollectEffect(k: KAPLAYCtx, x: number, y: number) {
  // 8 gold particles burst
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2
    const speed = k.rand(80, 180)

    k.add([
      k.rect(k.rand(4, 7), k.rand(4, 7)),
      k.pos(x, y),
      k.anchor('center'),
      k.color(...C.PARTICLE_GOLD),
      k.opacity(1),
      k.scale(1),
      k.lifespan(0.35, { fade: 0.25 }),
      k.move(k.Vec2.fromAngle(k.rad2deg(angle)), speed),
      k.z(150),
    ])
  }

  // "+5" text flies up
  const txt = k.add([
    k.text('+5', { size: 18 }),
    k.pos(x, y - 10),
    k.anchor('center'),
    k.color(...C.TEXT_GOLD),
    k.opacity(1),
    k.scale(1),
    k.lifespan(0.4, { fade: 0.3 }),
    k.z(160),
  ])

  k.tween(
    txt.pos.y,
    txt.pos.y - 30,
    0.4,
    (v) => { if (txt.exists()) txt.pos.y = v },
    k.easings.easeOutQuad,
  )
}

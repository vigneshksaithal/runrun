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
    { lane, baseY: startY, bobTime: k.rand(0, Math.PI * 2) },
  ])

  // Round gold coin: dark rim, gold body, lighter inner disc, shine
  coin.add([k.circle(13), k.anchor('center'), k.pos(0, 0), k.color(...C.COIN), k.outline(3, k.rgb(...C.COIN_DARK))])
  coin.add([k.circle(8.5), k.anchor('center'), k.pos(0, 0), k.color(...C.COIN_LIGHT)])
  coin.add([k.circle(4), k.anchor('center'), k.pos(0, 0), k.color(...C.COIN)])
  // Shine highlight
  coin.add([k.circle(2.6), k.anchor('center'), k.pos(-4.5, -4.5), k.color(...C.COIN_SHINE)])

  return coin
}

export function updateCoin(_k: KAPLAYCtx, coin: GameObj, speed: number, dt: number): boolean {
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
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * 360
    k.add([
      k.circle(k.rand(3, 5)),
      k.pos(x, y),
      k.anchor('center'),
      k.color(...C.GOLD_SPARK),
      k.opacity(0.95),
      k.lifespan(0.25, { fade: 0.15 }),
      k.move(angle, k.rand(80, 150)),
      k.z(150),
    ])
  }

  // "+N" text floating up
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

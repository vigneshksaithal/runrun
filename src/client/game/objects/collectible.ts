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
    k.opacity(0),
    k.z(80),
    'coin',
    { lane, baseY: startY, spinTime: k.rand(0, Math.PI * 2) },
  ])

  // Main coin body
  coin.add([
    k.circle(14),
    k.color(...C.COIN),
    k.anchor('center'),
  ])

  // Inner ring
  coin.add([
    k.circle(10),
    k.color(...C.COIN_SHADOW),
    k.anchor('center'),
    k.opacity(0.4),
  ])

  // Shine
  coin.add([
    k.circle(4),
    k.color(...C.COIN_SHINE),
    k.anchor('center'),
    k.pos(-4, -4),
  ])

  return coin
}

export function updateCoin(k: KAPLAYCtx, coin: GameObj, speed: number, dt: number): boolean {
  if (!coin.exists()) return false

  const moveSpeed = speed * GAME_CONFIG.ROAD_LINE_SPEED_MULT * dt
  coin.baseY += moveSpeed

  // Spin animation
  coin.spinTime += dt * 6
  const spinScale = 0.5 + Math.abs(Math.cos(coin.spinTime)) * 0.5

  const depthScale = getDepthScale(coin.baseY)
  const x = getLaneXAtDepth(coin.lane, coin.baseY)

  coin.pos.x = x
  coin.pos.y = coin.baseY - 15 // Float above ground
  coin.scale.x = depthScale * spinScale
  coin.scale.y = depthScale

  // Fade in
  const fadeStart = GAME_CONFIG.LANE_Y_TOP
  const fadeEnd = fadeStart + 60
  if (coin.baseY < fadeEnd) {
    coin.opacity = Math.max(0, (coin.baseY - fadeStart) / (fadeEnd - fadeStart))
  } else {
    coin.opacity = 1
  }

  return coin.baseY > GAME_CONFIG.LANE_Y_BOTTOM + 40
}

export function createCoinCollectEffect(k: KAPLAYCtx, x: number, y: number, multiplier: number = 1) {
  // Gold particles
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * 360
    k.add([
      k.rect(6, 6),
      k.pos(x, y),
      k.anchor('center'),
      k.color(...C.COIN),
      k.opacity(1),
      k.lifespan(0.3, { fade: 0.2 }),
      k.move(angle, k.rand(80, 150)),
      k.z(150),
    ])
  }

  // Score popup
  const points = GAME_CONFIG.COIN_SCORE * multiplier
  const popup = k.add([
    k.text(`+${points}`, { size: 20 }),
    k.pos(x, y - 10),
    k.anchor('center'),
    k.color(...C.TEXT_GOLD),
    k.opacity(1),
    k.z(160),
  ])

  k.tween(y - 10, y - 50, 0.4, (v) => {
    if (popup.exists()) popup.pos.y = v
  }, k.easings.easeOutQuad)

  k.tween(1, 0, 0.4, (v) => {
    if (popup.exists()) popup.opacity = v
  }, k.easings.easeOutQuad).then(() => {
    if (popup.exists()) popup.destroy()
  })
}

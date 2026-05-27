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
    { lane, baseY: startY, bobTime: k.rand(0, Math.PI * 2), spinTime: 0 },
  ])

  // Outer glow (pulsing)
  coin.add([
    k.rect(28, 28, { radius: 14 }),
    k.color(...C.COIN_GLOW),
    k.anchor('center'),
    k.pos(0, 0),
    k.opacity(0.25),
    'coinGlow',
  ])

  // Main body (circular)
  coin.add([
    k.rect(20, 20, { radius: 10 }),
    k.color(...C.COIN),
    k.anchor('center'),
    k.pos(0, 0),
  ])

  // Inner ring
  coin.add([
    k.rect(14, 14, { radius: 7 }),
    k.color(...C.COIN_DARK),
    k.anchor('center'),
    k.pos(0, 0),
  ])

  // Cross emblem - vertical
  coin.add([
    k.rect(2, 8),
    k.color(...C.COIN_SHINE),
    k.anchor('center'),
    k.pos(0, 0),
  ])

  // Cross emblem - horizontal
  coin.add([
    k.rect(8, 2),
    k.color(...C.COIN_SHINE),
    k.anchor('center'),
    k.pos(0, 0),
  ])

  // Shine highlight
  coin.add([
    k.rect(4, 4, { radius: 2 }),
    k.color(...C.COIN_SHINE),
    k.anchor('center'),
    k.pos(-4, -4),
    k.opacity(0.8),
  ])

  return coin
}

export function updateCoin(k: KAPLAYCtx, coin: GameObj, speed: number, dt: number): boolean {
  if (!coin.exists()) return false

  // Move toward player
  const moveSpeed = speed * GAME_CONFIG.ROAD_LINE_SPEED_MULT * dt
  coin.baseY += moveSpeed

  // Bob animation (±4px) + spin (X-scale squash for rotation illusion)
  coin.bobTime += dt * 4
  coin.spinTime += dt * 3
  const bobOffset = Math.sin(coin.bobTime) * 4

  // Rotation effect: squash X scale to simulate spinning
  const spinFactor = 0.3 + 0.7 * Math.abs(Math.cos(coin.spinTime))

  // Glow pulse
  const glowChild = coin.children?.[0]
  if (glowChild) {
    glowChild.opacity = 0.2 + Math.sin(coin.bobTime * 1.5) * 0.1
  }

  // Update position and scale based on depth
  const scale = getDepthScale(coin.baseY)
  const x = getLaneXAtDepth(coin.lane, coin.baseY)

  coin.pos.x = x
  coin.pos.y = coin.baseY + bobOffset
  coin.scale = k.vec2(scale * spinFactor, scale)

  // Remove if past bottom
  return coin.baseY > GAME_CONFIG.LANE_Y_BOTTOM + 50
}

export function createCoinCollectEffect(k: KAPLAYCtx, x: number, y: number, multiplier: number = 1, chainCount: number = 0) {
  // Gold flash ring (expanding circle)
  const ring = k.add([
    k.rect(10, 10, { radius: 5 }),
    k.pos(x, y),
    k.anchor('center'),
    k.color(...C.COIN_GLOW),
    k.opacity(1),
    k.scale(1),
    k.z(150),
  ])
  k.tween(1, 3, 0.25, (v: number) => { if (ring.exists()) ring.scaleTo(v) }, k.easings.easeOutQuad)
  k.tween(1, 0, 0.25, (v: number) => { if (ring.exists()) ring.opacity = v }, k.easings.easeOutQuad)
  k.wait(0.26, () => { if (ring.exists()) ring.destroy() })

  // Burst particles (5 base + chain bonus, max 8)
  const particleCount = Math.min(5 + chainCount, 8)
  for (let i = 0; i < particleCount; i++) {
    const angle = (i / particleCount) * 360 + k.rand(-15, 15)
    k.add([
      k.rect(5, 5, { radius: 2 }),
      k.pos(x, y),
      k.anchor('center'),
      k.color(...C.PARTICLE_GOLD),
      k.opacity(0.9),
      k.lifespan(0.25, { fade: 0.15 }),
      k.move(angle, k.rand(100, 180)),
      k.z(150),
    ])
  }

  // "+N" text with pop-in scale
  const pointValue = GAME_CONFIG.COIN_SCORE * multiplier
  const scorePopup = k.add([
    k.text(`+${pointValue}`, { size: 20 }),
    k.pos(x, y - 12),
    k.anchor('center'),
    k.color(...C.TEXT_GOLD),
    k.opacity(1),
    k.scale(1.3),
    k.lifespan(0.35, { fade: 0.2 }),
    k.move(k.Vec2.UP, 80),
    k.z(160),
  ])
  k.tween(1.3, 1, 0.1, (v: number) => { if (scorePopup.exists()) scorePopup.scaleTo(v) }, k.easings.easeOutQuad)

  // White "ping" flash (brief)
  k.add([
    k.rect(6, 6, { radius: 3 }),
    k.pos(x, y),
    k.anchor('center'),
    k.color(255, 255, 255),
    k.opacity(0.7),
    k.scale(1),
    k.lifespan(0.12, { fade: 0.1 }),
    k.z(155),
  ])
}

import type { KAPLAYCtx, GameObj } from 'kaplay'
import { GAME_CONFIG, getLaneXAtDepth, getDepthScale } from '../config'

const { COLORS } = GAME_CONFIG

export interface Collectible {
  obj: GameObj
  lane: number
  y: number
  collected: boolean
}

export function createCollectible(
  k: KAPLAYCtx,
  lane: number
): Collectible {
  const startY = GAME_CONFIG.LANE_Y_TOP - 20
  const startX = getLaneXAtDepth(lane, startY)
  const scale = getDepthScale(startY)

  const obj = k.add([
    k.pos(startX, startY),
    k.anchor('center'),
    k.scale(scale),
    k.z(60),
    k.opacity(0.3),
    'collectible',
    { lane, collected: false },
  ])

  // Gold ingot shape
  // Main gold block
  obj.add([
    k.rect(20, 14),
    k.pos(-10, -7),
    k.color(...COLORS.GOLD),
  ])
  // Top highlight
  obj.add([
    k.rect(14, 4),
    k.pos(-7, -11),
    k.color(...COLORS.GOLD),
  ])
  // Dark shadow
  obj.add([
    k.rect(20, 4),
    k.pos(-10, 3),
    k.color(...COLORS.GOLD_DARK),
  ])
  // Shine
  obj.add([
    k.rect(4, 4),
    k.pos(-6, -8),
    k.color(255, 255, 230),
    k.opacity(0.8),
  ])

  return {
    obj,
    lane,
    y: startY,
    collected: false,
  }
}

export function updateCollectible(
  k: KAPLAYCtx,
  collectible: Collectible,
  speed: number,
  dt: number
): boolean {
  collectible.y += speed * dt * 120

  const scale = getDepthScale(collectible.y)
  const x = getLaneXAtDepth(collectible.lane, collectible.y)

  collectible.obj.pos.x = x
  collectible.obj.pos.y = collectible.y
  collectible.obj.scaleTo(scale)

  // Fade in
  const progress = (collectible.y - GAME_CONFIG.LANE_Y_TOP) / (GAME_CONFIG.LANE_Y_BOTTOM - GAME_CONFIG.LANE_Y_TOP)
  collectible.obj.opacity = Math.min(1, 0.3 + progress * 0.7)

  // Floating/bob animation
  collectible.obj.pos.y += Math.sin(k.time() * 5) * 3

  // Return true if past screen
  return collectible.y > GAME_CONFIG.LANE_Y_BOTTOM + 60
}

export function createCollectParticles(k: KAPLAYCtx, x: number, y: number) {
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * 360
    k.add([
      k.rect(5, 5),
      k.pos(x, y),
      k.color(...COLORS.PARTICLE_GOLD),
      k.anchor('center'),
      k.move(k.Vec2.fromAngle(angle), k.rand(60, 120)),
      k.lifespan(0.4, { fade: 0.2 }),
      k.rotate(k.rand(0, 45)),
      k.z(160),
    ])
  }

  // Plus score text effect
  k.add([
    k.text('+' + GAME_CONFIG.GOLD_INGOT_SCORE, { size: 16 }),
    k.pos(x, y - 10),
    k.anchor('center'),
    k.color(...COLORS.TEXT_GOLD),
    k.move(k.UP, 60),
    k.lifespan(0.6, { fade: 0.3 }),
    k.z(170),
  ])
}

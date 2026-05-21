import type { KAPLAYCtx, GameObj } from 'kaplay'
import { GAME_CONFIG, getLaneXAtDepth, getDepthScale } from '../config'

const { COLORS } = GAME_CONFIG

export interface Collectible {
  obj: GameObj
  lane: number
  y: number
  collected: boolean
}

export function createCollectible(k: KAPLAYCtx, lane: number): Collectible {
  const startY = GAME_CONFIG.LANE_Y_TOP - 30
  const startX = getLaneXAtDepth(lane, startY)
  const scale = getDepthScale(startY)

  const obj = k.add([
    k.pos(startX, startY),
    k.anchor('center'),
    k.scale(scale),
    k.z(60),
    k.opacity(0),
    'collectible',
  ])

  // Gold ingot shape
  obj.add([k.rect(22, 16), k.pos(-11, -8), k.color(...COLORS.GOLD)])
  obj.add([k.rect(16, 5), k.pos(-8, -13), k.color(...COLORS.GOLD)])
  obj.add([k.rect(22, 5), k.pos(-11, 4), k.color(...COLORS.GOLD_DARK)])
  // Shine
  obj.add([k.rect(5, 5), k.pos(-7, -10), k.color(...COLORS.GOLD_SHINE), k.opacity(0.8)])

  return { obj, lane, y: startY, collected: false }
}


export function updateCollectible(k: KAPLAYCtx, collectible: Collectible, speed: number, dt: number): boolean {
  collectible.y += speed * dt * GAME_CONFIG.ROAD_LINE_SPEED_MULT

  const scale = getDepthScale(collectible.y)
  const x = getLaneXAtDepth(collectible.lane, collectible.y)

  collectible.obj.pos.x = x
  collectible.obj.pos.y = collectible.y + Math.sin(k.time() * 5) * 4
  collectible.obj.scaleTo(scale)

  // Fade in
  const progress = (collectible.y - GAME_CONFIG.LANE_Y_TOP) / (GAME_CONFIG.LANE_Y_BOTTOM - GAME_CONFIG.LANE_Y_TOP)
  collectible.obj.opacity = Math.min(1, progress * 1.3)

  return collectible.y > GAME_CONFIG.LANE_Y_BOTTOM + 80
}

export function createCollectParticles(k: KAPLAYCtx, x: number, y: number) {
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * 360
    k.add([
      k.rect(5, 5),
      k.pos(x, y),
      k.color(...COLORS.PARTICLE_GOLD),
      k.anchor('center'),
      k.move(k.Vec2.fromAngle(angle), k.rand(70, 140)),
      k.lifespan(0.45, { fade: 0.25 }),
      k.rotate(k.rand(0, 45)),
      k.z(160),
    ])
  }

  // Plus score text
  k.add([
    k.text('+' + GAME_CONFIG.GOLD_INGOT_SCORE, { size: 18 }),
    k.pos(x, y - 15),
    k.anchor('center'),
    k.color(...COLORS.TEXT_GOLD),
    k.move(k.UP, 70),
    k.lifespan(0.6, { fade: 0.3 }),
    k.z(170),
  ])
}

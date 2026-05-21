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

  // GLOW HALO - larger semi-transparent gold rect that pulses
  const halo = obj.add([
    k.rect(30, 30, { radius: 15 }),
    k.pos(-15, -15),
    k.color(...COLORS.COIN_GLOW),
    k.opacity(0.25),
    k.z(-1),
  ])
  halo.onUpdate(() => {
    halo.opacity = 0.2 + Math.sin(k.time() * 4) * 0.15
  })

  // Bright gold coin (circle-ish via rounded rect)
  obj.add([k.rect(20, 20, { radius: 10 }), k.pos(-10, -10), k.color(...COLORS.COIN)])
  // Inner ring
  obj.add([k.rect(14, 14, { radius: 7 }), k.pos(-7, -7), k.color(...COLORS.COIN_GLOW)])
  // Center fill
  obj.add([k.rect(10, 10, { radius: 5 }), k.pos(-5, -5), k.color(...COLORS.COIN)])


  // Shine sparkle (white highlight that pulses - more visible)
  const shine = obj.add([
    k.rect(7, 7, { radius: 3 }),
    k.pos(-9, -9),
    k.color(...COLORS.COIN_SHINE),
    k.opacity(0.9),
  ])
  shine.onUpdate(() => {
    shine.opacity = 0.6 + Math.sin(k.time() * 6) * 0.4
  })

  return { obj, lane, y: startY, collected: false }
}

export function updateCollectible(k: KAPLAYCtx, collectible: Collectible, speed: number, dt: number): boolean {
  collectible.y += speed * dt * GAME_CONFIG.ROAD_LINE_SPEED_MULT

  const scale = getDepthScale(collectible.y)
  const x = getLaneXAtDepth(collectible.lane, collectible.y)

  collectible.obj.pos.x = x
  // Pronounced floating bob
  collectible.obj.pos.y = collectible.y + Math.sin(k.time() * 5) * 6
  collectible.obj.scaleTo(scale)

  // Fade in
  const progress = (collectible.y - GAME_CONFIG.LANE_Y_TOP) / (GAME_CONFIG.LANE_Y_BOTTOM - GAME_CONFIG.LANE_Y_TOP)
  collectible.obj.opacity = Math.min(1, progress * 1.5)

  return collectible.y > GAME_CONFIG.LANE_Y_BOTTOM + 80
}

export function createCollectParticles(k: KAPLAYCtx, x: number, y: number) {
  // Burst of gold particles (more spread)
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * 360
    k.add([
      k.rect(5, 5, { radius: 2 }),
      k.pos(x, y),
      k.color(...COLORS.PARTICLE_GOLD),
      k.opacity(1),
      k.anchor('center'),
      k.move(k.Vec2.fromAngle(angle), k.rand(100, 180)),
      k.lifespan(0.4, { fade: 0.2 }),
      k.rotate(k.rand(0, 45)),
      k.z(160),
    ])
  }

  // "+5" text flying up (gold)
  k.add([
    k.text('+' + GAME_CONFIG.COIN_SCORE, { size: 18 }),
    k.pos(x, y - 15),
    k.anchor('center'),
    k.color(...COLORS.TEXT_GOLD),
    k.opacity(1),
    k.move(k.UP, 80),
    k.lifespan(0.6, { fade: 0.3 }),
    k.z(170),
  ])
}

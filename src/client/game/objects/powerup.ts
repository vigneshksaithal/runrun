import type { KAPLAYCtx, GameObj } from 'kaplay'
import { GAME_CONFIG, getLaneXAtDepth, getDepthScale } from '../config'

const { COLORS } = GAME_CONFIG

export type PowerUpType = 'shield' | 'magnet' | 'double_score'

export interface PowerUp {
  obj: GameObj
  lane: number
  y: number
  type: PowerUpType
  collected: boolean
}

function getPowerUpColor(type: PowerUpType): [number, number, number] {
  switch (type) {
    case 'shield': return COLORS.SHIELD_BLUE
    case 'magnet': return COLORS.MAGNET_PURPLE
    case 'double_score': return COLORS.DOUBLE_ORANGE
  }
}

export function createPowerUp(k: KAPLAYCtx, lane: number, type: PowerUpType): PowerUp {
  const startY = GAME_CONFIG.LANE_Y_TOP - 30
  const startX = getLaneXAtDepth(lane, startY)
  const scale = getDepthScale(startY)
  const color = getPowerUpColor(type)

  const obj = k.add([
    k.pos(startX, startY),
    k.anchor('center'),
    k.scale(scale),
    k.z(65),
    k.opacity(0),
    k.rotate(45),
    'powerup',
  ])

  // Diamond shape (rotated square)
  obj.add([k.rect(24, 24), k.pos(-12, -12), k.color(...color)])
  // Inner shine
  obj.add([k.rect(12, 12), k.pos(-6, -6), k.color(255, 255, 255), k.opacity(0.4)])
  // Outer glow
  obj.add([k.rect(30, 30), k.pos(-15, -15), k.color(...color), k.opacity(0.3)])

  return { obj, lane, y: startY, type, collected: false }
}

export function updatePowerUp(k: KAPLAYCtx, powerUp: PowerUp, speed: number, dt: number): boolean {
  powerUp.y += speed * dt * GAME_CONFIG.ROAD_LINE_SPEED_MULT

  const scale = getDepthScale(powerUp.y)
  const x = getLaneXAtDepth(powerUp.lane, powerUp.y)

  powerUp.obj.pos.x = x
  powerUp.obj.pos.y = powerUp.y + Math.sin(k.time() * 4) * 5
  powerUp.obj.scaleTo(scale)

  // Fade in
  const progress = (powerUp.y - GAME_CONFIG.LANE_Y_TOP) / (GAME_CONFIG.LANE_Y_BOTTOM - GAME_CONFIG.LANE_Y_TOP)
  powerUp.obj.opacity = Math.min(1, progress * 1.3)

  // Spin effect
  powerUp.obj.angle = 45 + Math.sin(k.time() * 3) * 15

  return powerUp.y > GAME_CONFIG.LANE_Y_BOTTOM + 80
}

export function createPowerUpCollectParticles(k: KAPLAYCtx, x: number, y: number, type: PowerUpType) {
  const color = getPowerUpColor(type)
  for (let i = 0; i < 14; i++) {
    const angle = (i / 14) * 360
    k.add([
      k.rect(6, 6),
      k.pos(x, y),
      k.color(...color),
      k.opacity(1),
      k.anchor('center'),
      k.move(k.Vec2.fromAngle(angle), k.rand(80, 160)),
      k.lifespan(0.5, { fade: 0.3 }),
      k.rotate(k.rand(0, 45)),
      k.z(160),
    ])
  }
}

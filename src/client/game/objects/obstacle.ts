import type { KAPLAYCtx, GameObj } from 'kaplay'
import { GAME_CONFIG, getLaneXAtDepth, getDepthScale } from '../config'
import type { ObstacleType } from '../systems/spawner'

const { COLORS } = GAME_CONFIG

export interface Obstacle {
  obj: GameObj
  type: ObstacleType
  lane: number
  y: number
  passed: boolean
}

export function createObstacle(k: KAPLAYCtx, type: ObstacleType, lane: number): Obstacle {
  const startY = GAME_CONFIG.LANE_Y_TOP - 30
  const startX = getLaneXAtDepth(lane, startY)
  const scale = getDepthScale(startY)

  const obj = k.add([
    k.pos(startX, startY),
    k.anchor('center'),
    k.scale(scale),
    k.z(50),
    k.opacity(0),
    'obstacle',
  ])

  // GLOW OUTLINE - slightly larger semi-transparent magenta rect behind
  const glowOutline = obj.add([
    k.rect(70, 58),
    k.pos(-35, -29),
    k.color(...COLORS.OBSTACLE_GLOW),
    k.opacity(0.1),
    k.z(-1),
  ])
  // Store glow reference for proximity scaling
  ;(obj as any)._glow = glowOutline

  drawObstacle(k, obj, type)

  return { obj, type, lane, y: startY, passed: false }
}


function drawObstacle(_k: KAPLAYCtx, parent: GameObj, type: ObstacleType) {
  switch (type) {
    case 'barrier': drawBarrier(parent); break
    case 'low_beam': drawLowBeam(parent); break
    case 'pillar': drawPillar(parent); break
  }
}

function drawBarrier(parent: GameObj) {
  const k = parent.k
  // Main magenta block - jump over
  parent.add([k.rect(60, 50), k.pos(-30, -25), k.color(...COLORS.OBSTACLE_MAIN)])
  // Dark outline
  parent.add([k.rect(64, 54), k.pos(-32, -27), k.color(...COLORS.OBSTACLE_DARK), k.z(-1)])
  // Warning stripes (yellow/dark)
  parent.add([k.rect(60, 8), k.pos(-30, -25), k.color(...COLORS.OBSTACLE_STRIPE)])
  parent.add([k.rect(12, 8), k.pos(-18, -25), k.color(...COLORS.OBSTACLE_STRIPE_DARK)])
  parent.add([k.rect(12, 8), k.pos(6, -25), k.color(...COLORS.OBSTACLE_STRIPE_DARK)])
  // Top edge highlight
  parent.add([k.rect(60, 4), k.pos(-30, 21), k.color(...COLORS.OBSTACLE_DARK)])
}

function drawLowBeam(parent: GameObj) {
  const k = parent.k
  // Low dark beam - slide under
  parent.add([k.rect(66, 20), k.pos(-33, -38), k.color(...COLORS.OBSTACLE_BEAM)])
  // Dark outline
  parent.add([k.rect(70, 24), k.pos(-35, -40), k.color(...COLORS.OBSTACLE_BEAM_DARK), k.z(-1)])
  // Caution marks (yellow)
  parent.add([k.rect(8, 16), k.pos(-28, -36), k.color(...COLORS.OBSTACLE_STRIPE)])
  parent.add([k.rect(8, 16), k.pos(20, -36), k.color(...COLORS.OBSTACLE_STRIPE)])
  // Support posts
  parent.add([k.rect(6, 30), k.pos(-30, -18), k.color(...COLORS.OBSTACLE_BEAM_DARK)])
  parent.add([k.rect(6, 30), k.pos(24, -18), k.color(...COLORS.OBSTACLE_BEAM_DARK)])
}

function drawPillar(parent: GameObj) {
  const k = parent.k
  // Tall magenta column - switch lanes
  parent.add([k.rect(40, 70), k.pos(-20, -35), k.color(...COLORS.OBSTACLE_MAIN)])
  // Dark outline
  parent.add([k.rect(44, 74), k.pos(-22, -37), k.color(...COLORS.OBSTACLE_DARK), k.z(-1)])
  // Warning stripe at top and bottom
  parent.add([k.rect(40, 8), k.pos(-20, -35), k.color(...COLORS.OBSTACLE_STRIPE)])
  parent.add([k.rect(8, 8), k.pos(-12, -35), k.color(...COLORS.OBSTACLE_STRIPE_DARK)])
  parent.add([k.rect(8, 8), k.pos(4, -35), k.color(...COLORS.OBSTACLE_STRIPE_DARK)])
  parent.add([k.rect(40, 8), k.pos(-20, 27), k.color(...COLORS.OBSTACLE_STRIPE)])
  parent.add([k.rect(8, 8), k.pos(-12, 27), k.color(...COLORS.OBSTACLE_STRIPE_DARK)])
  parent.add([k.rect(8, 8), k.pos(4, 27), k.color(...COLORS.OBSTACLE_STRIPE_DARK)])
}


export function updateObstacle(k: KAPLAYCtx, obstacle: Obstacle, speed: number, dt: number): boolean {
  obstacle.y += speed * dt * GAME_CONFIG.ROAD_LINE_SPEED_MULT

  const scale = getDepthScale(obstacle.y)
  const x = getLaneXAtDepth(obstacle.lane, obstacle.y)

  obstacle.obj.pos.x = x
  obstacle.obj.pos.y = obstacle.y
  obstacle.obj.scaleTo(scale)

  // Fade in smoothly as it approaches
  const progress = (obstacle.y - GAME_CONFIG.LANE_Y_TOP) / (GAME_CONFIG.LANE_Y_BOTTOM - GAME_CONFIG.LANE_Y_TOP)
  obstacle.obj.opacity = Math.min(1, progress * 1.5)

  // Glow opacity increases as obstacle gets closer (scarier)
  const glow = (obstacle.obj as any)._glow
  if (glow) {
    glow.opacity = 0.05 + progress * 0.25
  }

  // Subtle wobble when close (danger warning)
  if (progress > 0.8) {
    obstacle.obj.angle = Math.sin(k.time() * 16) * (progress - 0.8) * 5
  }

  return obstacle.y > GAME_CONFIG.LANE_Y_BOTTOM + 80
}

export function createObstacleDestroyParticles(k: KAPLAYCtx, x: number, y: number, _type: ObstacleType) {
  for (let i = 0; i < 12; i++) {
    k.add([
      k.rect(k.rand(5, 12), k.rand(5, 12)),
      k.pos(x, y),
      k.color(...COLORS.OBSTACLE_MAIN),
      k.opacity(1),
      k.anchor('center'),
      k.move(k.Vec2.fromAngle(k.rand(0, 360)), k.rand(80, 220)),
      k.lifespan(0.5, { fade: 0.25 }),
      k.z(150),
    ])
  }
}

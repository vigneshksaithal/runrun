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

  drawObstacle(k, obj, type)

  return { obj, type, lane, y: startY, passed: false }
}


function drawObstacle(k: KAPLAYCtx, parent: GameObj, type: ObstacleType) {
  switch (type) {
    case 'stone_wall': drawStoneWall(k, parent); break
    case 'cobweb': drawCobweb(k, parent); break
    case 'tnt': drawTNT(k, parent); break
  }
}

function drawStoneWall(k: KAPLAYCtx, parent: GameObj) {
  // Main stone block
  parent.add([k.rect(56, 56), k.pos(-28, -28), k.color(...COLORS.STONE)])
  // Brick pattern
  parent.add([k.rect(56, 3), k.pos(-28, -6), k.color(...COLORS.STONE_DARK)])
  parent.add([k.rect(56, 3), k.pos(-28, 16), k.color(...COLORS.STONE_DARK)])
  parent.add([k.rect(3, 56), k.pos(0, -28), k.color(...COLORS.STONE_DARK)])
  parent.add([k.rect(3, 28), k.pos(-14, -28), k.color(...COLORS.STONE_DARK), k.opacity(0.5)])
  // Light highlight
  parent.add([k.rect(56, 4), k.pos(-28, -28), k.color(...COLORS.STONE_LIGHT), k.opacity(0.3)])
}

function drawCobweb(k: KAPLAYCtx, parent: GameObj) {
  // Ceiling bar
  parent.add([k.rect(66, 12), k.pos(-33, -34), k.color(...COLORS.COBWEB_STRAND)])
  // Main web body
  parent.add([k.rect(56, 38), k.pos(-28, -22), k.color(...COLORS.COBWEB), k.opacity(0.7)])
  // Web strands
  for (let i = 0; i < 6; i++) {
    parent.add([
      k.rect(2, 26 + Math.random() * 12),
      k.pos(-24 + i * 10, -22),
      k.color(...COLORS.COBWEB_STRAND),
      k.opacity(0.5),
    ])
  }
}

function drawTNT(k: KAPLAYCtx, parent: GameObj) {
  // Main TNT block
  parent.add([k.rect(50, 50), k.pos(-25, -25), k.color(...COLORS.TNT_RED)])
  // Dark bands
  parent.add([k.rect(50, 9), k.pos(-25, -25), k.color(...COLORS.TNT_DARK)])
  parent.add([k.rect(50, 9), k.pos(-25, 16), k.color(...COLORS.TNT_DARK)])
  // Center label
  parent.add([k.rect(34, 16), k.pos(-17, -8), k.color(...COLORS.TNT_LABEL)])
  // "TNT" letters
  parent.add([k.rect(9, 3), k.pos(-14, -6), k.color(...COLORS.TNT_RED)])
  parent.add([k.rect(3, 11), k.pos(-12, -3), k.color(...COLORS.TNT_RED)])
  parent.add([k.rect(3, 11), k.pos(-5, -6), k.color(...COLORS.TNT_RED)])
  parent.add([k.rect(3, 11), k.pos(1, -6), k.color(...COLORS.TNT_RED)])
  parent.add([k.rect(9, 3), k.pos(5, -6), k.color(...COLORS.TNT_RED)])
  parent.add([k.rect(3, 11), k.pos(7, -3), k.color(...COLORS.TNT_RED)])
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
  obstacle.obj.opacity = Math.min(1, progress * 1.3)

  // Subtle wobble when close
  if (progress > 0.75) {
    obstacle.obj.angle = Math.sin(k.time() * 14) * (progress - 0.75) * 4
  }

  return obstacle.y > GAME_CONFIG.LANE_Y_BOTTOM + 80
}

export function createObstacleDestroyParticles(k: KAPLAYCtx, x: number, y: number, type: ObstacleType) {
  const color = type === 'tnt' ? COLORS.TNT_RED : type === 'stone_wall' ? COLORS.STONE : COLORS.COBWEB

  for (let i = 0; i < 12; i++) {
    k.add([
      k.rect(k.rand(4, 10), k.rand(4, 10)),
      k.pos(x, y),
      k.color(...color),
      k.anchor('center'),
      k.move(k.Vec2.fromAngle(k.rand(0, 360)), k.rand(60, 200)),
      k.lifespan(0.5, { fade: 0.25 }),
      k.z(150),
    ])
  }
}

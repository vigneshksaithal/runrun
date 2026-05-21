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

export function createObstacle(
  k: KAPLAYCtx,
  type: ObstacleType,
  lane: number
): Obstacle {
  const startY = GAME_CONFIG.LANE_Y_TOP - 20
  const startX = getLaneXAtDepth(lane, startY)
  const scale = getDepthScale(startY)

  const obj = k.add([
    k.pos(startX, startY),
    k.anchor('center'),
    k.scale(scale),
    k.z(50),
    k.opacity(0.3),
    'obstacle',
    { obstacleType: type, lane, passed: false },
  ])

  // Draw the obstacle based on type
  drawObstacle(k, obj, type)

  return {
    obj,
    type,
    lane,
    y: startY,
    passed: false,
  }
}

function drawObstacle(k: KAPLAYCtx, parent: GameObj, type: ObstacleType) {
  switch (type) {
    case 'stone_wall':
      drawStoneWall(k, parent)
      break
    case 'cobweb':
      drawCobweb(k, parent)
      break
    case 'tnt':
      drawTNT(k, parent)
      break
  }
}

function drawStoneWall(k: KAPLAYCtx, parent: GameObj) {
  // Main stone block
  parent.add([
    k.rect(50, 50),
    k.pos(-25, -25),
    k.color(...COLORS.STONE),
  ])
  // Darker detail lines (brick pattern)
  parent.add([
    k.rect(50, 3),
    k.pos(-25, -5),
    k.color(...COLORS.STONE_DARK),
  ])
  parent.add([
    k.rect(50, 3),
    k.pos(-25, 15),
    k.color(...COLORS.STONE_DARK),
  ])
  parent.add([
    k.rect(3, 50),
    k.pos(0, -25),
    k.color(...COLORS.STONE_DARK),
  ])
  // Indicator: up arrow hint
  parent.add([
    k.rect(10, 16),
    k.pos(-5, -22),
    k.color(255, 255, 100),
    k.opacity(0.5),
  ])
}

function drawCobweb(k: KAPLAYCtx, parent: GameObj) {
  // Ceiling bar
  parent.add([
    k.rect(60, 10),
    k.pos(-30, -30),
    k.color(...COLORS.COBWEB_STRAND),
  ])
  // Main web body (hanging strands)
  parent.add([
    k.rect(50, 35),
    k.pos(-25, -20),
    k.color(...COLORS.COBWEB),
    k.opacity(0.7),
  ])
  // Web strands
  for (let i = 0; i < 5; i++) {
    parent.add([
      k.rect(2, 25 + Math.random() * 10),
      k.pos(-20 + i * 10, -20),
      k.color(...COLORS.COBWEB_STRAND),
      k.opacity(0.5),
    ])
  }
  // Indicator: down arrow hint
  parent.add([
    k.rect(10, 16),
    k.pos(-5, 10),
    k.color(255, 255, 100),
    k.opacity(0.5),
  ])
}

function drawTNT(k: KAPLAYCtx, parent: GameObj) {
  // Main TNT block
  parent.add([
    k.rect(44, 44),
    k.pos(-22, -22),
    k.color(...COLORS.TNT_RED),
  ])
  // Dark top band
  parent.add([
    k.rect(44, 8),
    k.pos(-22, -22),
    k.color(...COLORS.TNT_DARK),
  ])
  // Dark bottom band
  parent.add([
    k.rect(44, 8),
    k.pos(-22, 14),
    k.color(...COLORS.TNT_DARK),
  ])
  // Center label area
  parent.add([
    k.rect(30, 14),
    k.pos(-15, -7),
    k.color(...COLORS.TNT_LABEL),
  ])
  // "TNT" text using small blocks
  // T
  parent.add([k.rect(8, 3), k.pos(-13, -5), k.color(...COLORS.TNT_RED)])
  parent.add([k.rect(3, 10), k.pos(-11, -2), k.color(...COLORS.TNT_RED)])
  // N
  parent.add([k.rect(3, 10), k.pos(-5, -5), k.color(...COLORS.TNT_RED)])
  parent.add([k.rect(3, 10), k.pos(1, -5), k.color(...COLORS.TNT_RED)])
  // T
  parent.add([k.rect(8, 3), k.pos(5, -5), k.color(...COLORS.TNT_RED)])
  parent.add([k.rect(3, 10), k.pos(7, -2), k.color(...COLORS.TNT_RED)])
}

export function updateObstacle(
  k: KAPLAYCtx,
  obstacle: Obstacle,
  speed: number,
  dt: number
): boolean {
  obstacle.y += speed * dt * 120

  const scale = getDepthScale(obstacle.y)
  const x = getLaneXAtDepth(obstacle.lane, obstacle.y)

  obstacle.obj.pos.x = x
  obstacle.obj.pos.y = obstacle.y
  obstacle.obj.scaleTo(scale)

  // Fade in as it approaches
  const progress = (obstacle.y - GAME_CONFIG.LANE_Y_TOP) / (GAME_CONFIG.LANE_Y_BOTTOM - GAME_CONFIG.LANE_Y_TOP)
  obstacle.obj.opacity = Math.min(1, 0.3 + progress * 0.7)

  // Add subtle wobble as it gets close
  if (progress > 0.7) {
    obstacle.obj.angle = Math.sin(k.time() * 15) * (progress - 0.7) * 3
  }

  // Return true if past the screen
  return obstacle.y > GAME_CONFIG.LANE_Y_BOTTOM + 60
}

export function createObstacleDestroyParticles(k: KAPLAYCtx, x: number, y: number, type: ObstacleType) {
  const color = type === 'tnt' ? COLORS.TNT_RED :
                type === 'stone_wall' ? COLORS.STONE :
                COLORS.COBWEB

  for (let i = 0; i < 8; i++) {
    k.add([
      k.rect(k.rand(3, 8), k.rand(3, 8)),
      k.pos(x, y),
      k.color(...color),
      k.anchor('center'),
      k.move(k.Vec2.fromAngle(k.rand(0, 360)), k.rand(50, 150)),
      k.lifespan(0.4, { fade: 0.2 }),
      k.z(150),
    ])
  }
}

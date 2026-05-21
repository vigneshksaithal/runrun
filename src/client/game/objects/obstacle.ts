import type { KAPLAYCtx, GameObj } from 'kaplay'
import { GAME_CONFIG, getLaneXAtDepth, getDepthScale } from '../config'

const C = GAME_CONFIG.COLORS

export type ObstacleType = 'stone_wall' | 'low_beam' | 'pillar'

export function createObstacle(k: KAPLAYCtx, lane: number, type: ObstacleType): GameObj {
  const startY = GAME_CONFIG.LANE_Y_TOP
  const startX = getLaneXAtDepth(lane, startY)
  const startScale = getDepthScale(startY)

  const obstacle = k.add([
    k.pos(startX, startY),
    k.anchor('bot'),
    k.scale(startScale),
    k.opacity(1),
    k.z(80),
    'obstacle',
    { lane, baseY: startY, obstacleType: type },
  ])

  if (type === 'stone_wall') {
    createStoneWall(k, obstacle)
  } else if (type === 'low_beam') {
    createLowBeam(k, obstacle)
  } else if (type === 'pillar') {
    createPillar(k, obstacle)
  }

  return obstacle
}

function createStoneWall(k: KAPLAYCtx, parent: GameObj) {
  // Main gray block (60x55)
  parent.add([
    k.rect(60, 55),
    k.color(...C.OBSTACLE_STONE),
    k.anchor('bot'),
    k.pos(0, 0),
  ])

  // Horizontal brick line 1
  parent.add([
    k.rect(56, 3),
    k.color(...C.OBSTACLE_STONE_DARK),
    k.anchor('bot'),
    k.pos(0, -20),
  ])

  // Horizontal brick line 2
  parent.add([
    k.rect(56, 3),
    k.color(...C.OBSTACLE_STONE_DARK),
    k.anchor('bot'),
    k.pos(0, -38),
  ])

  // Vertical line
  parent.add([
    k.rect(3, 50),
    k.color(...C.OBSTACLE_STONE_DARK),
    k.anchor('bot'),
    k.pos(10, -3),
  ])
}

function createLowBeam(k: KAPLAYCtx, parent: GameObj) {
  // Wide bar at top (70x14)
  parent.add([
    k.rect(70, 14),
    k.color(...C.OBSTACLE_BEAM),
    k.anchor('bot'),
    k.pos(0, -44),
  ])

  // Hanging strand 1
  parent.add([
    k.rect(3, 12),
    k.color(...C.OBSTACLE_BEAM_DARK),
    k.anchor('top'),
    k.pos(-15, -44),
  ])

  // Hanging strand 2
  parent.add([
    k.rect(3, 10),
    k.color(...C.OBSTACLE_BEAM_DARK),
    k.anchor('top'),
    k.pos(12, -44),
  ])
}

function createPillar(k: KAPLAYCtx, parent: GameObj) {
  // Tall red block (44x55)
  parent.add([
    k.rect(44, 55),
    k.color(...C.OBSTACLE_PILLAR),
    k.anchor('bot'),
    k.pos(0, 0),
  ])

  // Yellow/black warning stripe (44x10)
  parent.add([
    k.rect(44, 10),
    k.color(...C.OBSTACLE_STRIPE),
    k.anchor('bot'),
    k.pos(0, -22),
  ])

  // Dark stripe overlay
  parent.add([
    k.rect(10, 10),
    k.color(...C.OBSTACLE_STRIPE_DARK),
    k.anchor('bot'),
    k.pos(-12, -22),
  ])
}

export function updateObstacle(k: KAPLAYCtx, obstacle: GameObj, speed: number, dt: number): boolean {
  if (!obstacle.exists()) return false

  // Move toward player using ROAD_LINE_SPEED_MULT (100)
  const moveSpeed = speed * GAME_CONFIG.ROAD_LINE_SPEED_MULT * dt
  obstacle.baseY += moveSpeed

  // Update position and scale based on depth
  const scale = getDepthScale(obstacle.baseY)
  const x = getLaneXAtDepth(obstacle.lane, obstacle.baseY)

  obstacle.pos.x = x
  obstacle.pos.y = obstacle.baseY
  obstacle.scaleTo(scale)

  // Remove if past bottom
  return obstacle.baseY > GAME_CONFIG.LANE_Y_BOTTOM + 80
}

export function createObstacleDestroyEffect(k: KAPLAYCtx, x: number, y: number) {
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2
    const speed = k.rand(60, 150)

    k.add([
      k.rect(k.rand(5, 10), k.rand(5, 10)),
      k.pos(x, y - 20),
      k.anchor('center'),
      k.color(...C.PARTICLE_STONE),
      k.opacity(1),
      k.scale(1),
      k.lifespan(0.35, { fade: 0.25 }),
      k.move(k.Vec2.fromAngle(k.rad2deg(angle)), speed),
      k.z(150),
    ])
  }
}

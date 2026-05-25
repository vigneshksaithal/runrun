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
  // Glow halo (red) - reduced opacity
  parent.add([
    k.rect(102, 95),
    k.color(...C.OBSTACLE_STONE_GLOW),
    k.anchor('bot'),
    k.pos(0, 6),
    k.opacity(0.12),
  ])
  // Main block (90x83) - SCALED 1.5x
  parent.add([
    k.rect(90, 83),
    k.color(...C.OBSTACLE_STONE),
    k.anchor('bot'),
    k.pos(0, 0),
  ])

  // Horizontal brick line 1
  parent.add([
    k.rect(84, 5),
    k.color(...C.OBSTACLE_STONE_DARK),
    k.anchor('bot'),
    k.pos(0, -30),
  ])

  // Horizontal brick line 2
  parent.add([
    k.rect(84, 5),
    k.color(...C.OBSTACLE_STONE_DARK),
    k.anchor('bot'),
    k.pos(0, -57),
  ])

  // Vertical line
  parent.add([
    k.rect(5, 75),
    k.color(...C.OBSTACLE_STONE_DARK),
    k.anchor('bot'),
    k.pos(15, -5),
  ])
}

function createLowBeam(k: KAPLAYCtx, parent: GameObj) {
  // Glow halo (amber) - reduced opacity
  parent.add([
    k.rect(117, 33),
    k.color(...C.OBSTACLE_BEAM_GLOW),
    k.anchor('bot'),
    k.pos(0, -57),
    k.opacity(0.12),
  ])
  // Wide bar at top (105x21) - SCALED 1.5x
  parent.add([
    k.rect(105, 21),
    k.color(...C.OBSTACLE_BEAM),
    k.anchor('bot'),
    k.pos(0, -66),
  ])

  // Hanging strand 1
  parent.add([
    k.rect(5, 18),
    k.color(...C.OBSTACLE_BEAM_DARK),
    k.anchor('top'),
    k.pos(-23, -66),
  ])

  // Hanging strand 2
  parent.add([
    k.rect(5, 15),
    k.color(...C.OBSTACLE_BEAM_DARK),
    k.anchor('top'),
    k.pos(18, -66),
  ])
}

function createPillar(k: KAPLAYCtx, parent: GameObj) {
  // Glow halo (magenta) - reduced opacity
  parent.add([
    k.rect(78, 95),
    k.color(...C.OBSTACLE_PILLAR_GLOW),
    k.anchor('bot'),
    k.pos(0, 6),
    k.opacity(0.12),
  ])
  // Tall block (66x83) - SCALED 1.5x
  parent.add([
    k.rect(66, 83),
    k.color(...C.OBSTACLE_PILLAR),
    k.anchor('bot'),
    k.pos(0, 0),
  ])

  // Yellow/black warning stripe (66x15)
  parent.add([
    k.rect(66, 15),
    k.color(...C.OBSTACLE_STRIPE),
    k.anchor('bot'),
    k.pos(0, -33),
  ])

  // Dark stripe overlay
  parent.add([
    k.rect(15, 15),
    k.color(...C.OBSTACLE_STRIPE_DARK),
    k.anchor('bot'),
    k.pos(-18, -33),
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

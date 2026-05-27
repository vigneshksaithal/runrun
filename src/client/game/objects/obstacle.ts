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
    { lane, baseY: startY, obstacleType: type, halo: null as GameObj | null },
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

// Chevron pointing up: a 3-vertex triangle pointing upward.
// Returned points are centered on (0,0) with the given size.
function chevronUpPts(k: KAPLAYCtx, size: number) {
  const h = size
  return [
    k.vec2(0, -h * 0.55),       // top
    k.vec2(h * 0.6, h * 0.45),   // bottom-right
    k.vec2(-h * 0.6, h * 0.45),  // bottom-left
  ]
}

function chevronDownPts(k: KAPLAYCtx, size: number) {
  const h = size
  return [
    k.vec2(-h * 0.6, -h * 0.45),
    k.vec2(h * 0.6, -h * 0.45),
    k.vec2(0, h * 0.55),
  ]
}

// Dual horizontal arrow: 8-vertex polygon spanning width with notches at both ends.
function dualArrowPts(k: KAPLAYCtx, w: number, h: number) {
  const tip = w / 2
  const shaftX = w / 2 - h * 0.5
  const tH = h * 0.45      // tip half-height
  const sH = h * 0.18      // shaft half-height
  return [
    k.vec2(-tip, 0),         // left tip
    k.vec2(-shaftX, -tH),    // left top of arrowhead
    k.vec2(-shaftX, -sH),    // left top of shaft
    k.vec2(shaftX, -sH),     // right top of shaft
    k.vec2(shaftX, -tH),     // right top of arrowhead
    k.vec2(tip, 0),          // right tip
    k.vec2(shaftX, tH),      // right bottom of arrowhead
    k.vec2(shaftX, sH),      // right bottom of shaft
    k.vec2(-shaftX, sH),     // left bottom of shaft
    k.vec2(-shaftX, tH),     // left bottom of arrowhead
  ]
}

function createStoneWall(k: KAPLAYCtx, parent: GameObj) {
  // Glow halo (red) - tagged so game scene can pulse the active-lane one
  const halo = parent.add([
    k.rect(68, 63),
    k.color(...C.OBSTACLE_STONE_GLOW),
    k.anchor('bot'),
    k.pos(0, 4),
    k.opacity(0.2),
    'obstacleHalo',
  ])
  parent.halo = halo

  // Main block (60x55)
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

  // Verb icon: chevron pointing UP = "JUMP". Sits above the block.
  parent.add([
    k.polygon(chevronUpPts(k, 18)),
    k.color(255, 255, 255),
    k.opacity(0.92),
    k.anchor('bot'),
    k.pos(0, -64),
  ])
}

function createLowBeam(k: KAPLAYCtx, parent: GameObj) {
  // Glow halo (amber)
  const halo = parent.add([
    k.rect(78, 22),
    k.color(...C.OBSTACLE_BEAM_GLOW),
    k.anchor('bot'),
    k.pos(0, -38),
    k.opacity(0.2),
    'obstacleHalo',
  ])
  parent.halo = halo

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

  // Verb icon: chevron pointing DOWN = "SLIDE". Sits ABOVE the beam so it's
  // not occluded by player or other obstacles in front.
  parent.add([
    k.polygon(chevronDownPts(k, 18)),
    k.color(255, 255, 255),
    k.opacity(0.92),
    k.anchor('bot'),
    k.pos(0, -68),
  ])
}

function createPillar(k: KAPLAYCtx, parent: GameObj) {
  // Glow halo (magenta)
  const halo = parent.add([
    k.rect(52, 63),
    k.color(...C.OBSTACLE_PILLAR_GLOW),
    k.anchor('bot'),
    k.pos(0, 4),
    k.opacity(0.2),
    'obstacleHalo',
  ])
  parent.halo = halo

  // Tall block (44x55)
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

  // Verb icon: dual horizontal arrow = "DODGE SIDEWAYS"
  parent.add([
    k.polygon(dualArrowPts(k, 22, 12)),
    k.color(255, 255, 255),
    k.opacity(0.92),
    k.anchor('center'),
    k.pos(0, -64),
  ])
}

export function updateObstacle(_k: KAPLAYCtx, obstacle: GameObj, speed: number, dt: number): boolean {
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
  // Reduced to 5 particles (down from 8) using built-in move()
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * 360
    k.add([
      k.rect(k.rand(5, 9), k.rand(5, 9)),
      k.pos(x, y - 20),
      k.anchor('center'),
      k.color(C.PARTICLE_STONE[0], C.PARTICLE_STONE[1], C.PARTICLE_STONE[2]),
      k.opacity(0.9),
      k.lifespan(0.3, { fade: 0.2 }),
      k.move(angle, k.rand(60, 120)),
      k.z(150),
    ])
  }
}

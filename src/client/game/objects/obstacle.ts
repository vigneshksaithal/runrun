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
    { lane, baseY: startY, obstacleType: type, nearMissChecked: false, glowTime: 0 },
  ])

  if (type === 'stone_wall') {
    createStoneWall(k, obstacle)
  } else if (type === 'low_beam') {
    createLowBeam(k, obstacle)
  } else if (type === 'pillar') {
    createPillar(k, obstacle)
  }

  // Ground shadow for all obstacles
  obstacle.add([
    k.rect(50, 4, { radius: 2 }),
    k.color(0, 0, 0),
    k.anchor('center'),
    k.pos(0, 2),
    k.opacity(0.2),
    'obsShadow',
  ])

  return obstacle
}

function createStoneWall(k: KAPLAYCtx, parent: GameObj) {
  // Glow halo (red) - animated
  parent.add([
    k.rect(68, 63, { radius: 4 }),
    k.color(...C.OBSTACLE_STONE_GLOW),
    k.anchor('bot'),
    k.pos(0, 4),
    k.opacity(0.2),
    'obsGlow',
  ])
  // Main block (60x55)
  parent.add([
    k.rect(60, 55, { radius: 3 }),
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

  // Top danger stripe
  parent.add([
    k.rect(60, 5, { radius: 2 }),
    k.color(255, 80, 80),
    k.anchor('bot'),
    k.pos(0, -55),
    k.opacity(0.7),
  ])
}

function createLowBeam(k: KAPLAYCtx, parent: GameObj) {
  // Glow halo (amber) - animated
  parent.add([
    k.rect(78, 22, { radius: 4 }),
    k.color(...C.OBSTACLE_BEAM_GLOW),
    k.anchor('bot'),
    k.pos(0, -38),
    k.opacity(0.2),
    'obsGlow',
  ])
  // Wide bar at top (70x14)
  parent.add([
    k.rect(70, 14, { radius: 3 }),
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

  // Warning light (small pulsing dot)
  parent.add([
    k.rect(6, 6, { radius: 3 }),
    k.color(255, 255, 100),
    k.anchor('center'),
    k.pos(0, -51),
    k.opacity(0.8),
    'warningLight',
  ])
}

function createPillar(k: KAPLAYCtx, parent: GameObj) {
  // Glow halo (magenta) - animated
  parent.add([
    k.rect(52, 63, { radius: 4 }),
    k.color(...C.OBSTACLE_PILLAR_GLOW),
    k.anchor('bot'),
    k.pos(0, 4),
    k.opacity(0.2),
    'obsGlow',
  ])
  // Tall block (44x55)
  parent.add([
    k.rect(44, 55, { radius: 3 }),
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

  // Top cap
  parent.add([
    k.rect(48, 6, { radius: 3 }),
    k.color(...C.OBSTACLE_PILLAR_GLOW),
    k.anchor('bot'),
    k.pos(0, -55),
    k.opacity(0.5),
  ])
}

export function updateObstacle(_k: KAPLAYCtx, obstacle: GameObj, speed: number, dt: number): boolean {
  if (!obstacle.exists()) return false

  // Move toward player using ROAD_LINE_SPEED_MULT (100)
  const moveSpeed = speed * GAME_CONFIG.ROAD_LINE_SPEED_MULT * dt
  obstacle.baseY += moveSpeed

  // Track glow time for pulsing animation
  obstacle.glowTime += dt

  // Update position and scale based on depth
  const scale = getDepthScale(obstacle.baseY)
  const x = getLaneXAtDepth(obstacle.lane, obstacle.baseY)

  obstacle.pos.x = x
  obstacle.pos.y = obstacle.baseY
  obstacle.scaleTo(scale)

  // Animate glow intensity based on distance to player
  const range = GAME_CONFIG.LANE_Y_BOTTOM - GAME_CONFIG.LANE_Y_TOP
  const progress = (obstacle.baseY - GAME_CONFIG.LANE_Y_TOP) / range

  // Find and animate the glow child
  for (const child of obstacle.children || []) {
    if (child.is?.('obsGlow')) {
      if (progress > 0.8) {
        // Very close - fast intense pulse
        child.opacity = 0.25 + Math.sin(obstacle.glowTime * 6 * Math.PI * 2) * 0.2
      } else if (progress > 0.6) {
        // Getting close - moderate pulse
        child.opacity = 0.2 + Math.sin(obstacle.glowTime * 4 * Math.PI * 2) * 0.12
      } else {
        child.opacity = 0.2
      }
    }
    // Warning light blink
    if (child.is?.('warningLight')) {
      child.opacity = 0.4 + Math.sin(obstacle.glowTime * 8) * 0.4
    }
  }

  // Remove if past bottom
  return obstacle.baseY > GAME_CONFIG.LANE_Y_BOTTOM + 80
}

export function createObstacleDestroyEffect(k: KAPLAYCtx, x: number, y: number) {
  // 6 particles with rounded shapes
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * 360
    k.add([
      k.rect(k.rand(5, 10), k.rand(5, 10), { radius: 2 }),
      k.pos(x, y - 20),
      k.anchor('center'),
      k.color(C.PARTICLE_STONE[0], C.PARTICLE_STONE[1], C.PARTICLE_STONE[2]),
      k.opacity(0.9),
      k.lifespan(0.3, { fade: 0.2 }),
      k.move(angle, k.rand(80, 140)),
      k.z(150),
    ])
  }
}

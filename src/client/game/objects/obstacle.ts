import type { KAPLAYCtx, GameObj } from 'kaplay'
import { GAME_CONFIG, getLaneXAtDepth, getDepthScale } from '../config'

const C = GAME_CONFIG.COLORS

export type ObstacleType = 'train' | 'barrier' | 'low_barrier'

export function createObstacle(k: KAPLAYCtx, lane: number, type: ObstacleType): GameObj {
  const startY = GAME_CONFIG.LANE_Y_TOP
  const startX = getLaneXAtDepth(lane, startY)
  const startScale = getDepthScale(startY)

  const obstacle = k.add([
    k.pos(startX, startY),
    k.anchor('bot'),
    k.scale(startScale),
    k.opacity(0),
    k.z(80),
    'obstacle',
    { lane, baseY: startY, obstacleType: type },
  ])

  if (type === 'train') {
    createTrain(k, obstacle)
  } else if (type === 'barrier') {
    createBarrier(k, obstacle)
  } else {
    createLowBarrier(k, obstacle)
  }

  return obstacle
}

function createTrain(k: KAPLAYCtx, parent: GameObj) {
  // Pick random train color
  const isBlue = k.rand(0, 1) > 0.5
  const mainColor = isBlue ? C.TRAIN_BLUE : C.TRAIN_RED
  const darkColor = isBlue ? C.TRAIN_BLUE_DARK : C.TRAIN_RED_DARK

  // Main body
  parent.add([
    k.rect(60, 70),
    k.color(...mainColor),
    k.anchor('bot'),
    k.pos(0, 0),
  ])

  // Dark side shading
  parent.add([
    k.rect(12, 68),
    k.color(...darkColor),
    k.anchor('botleft'),
    k.pos(-30, -1),
  ])

  // Yellow stripe
  parent.add([
    k.rect(60, 8),
    k.color(...C.TRAIN_YELLOW),
    k.anchor('bot'),
    k.pos(0, -25),
  ])

  // Windows
  for (let i = -1; i <= 1; i++) {
    parent.add([
      k.rect(14, 16),
      k.color(...C.TRAIN_WINDOW),
      k.anchor('center'),
      k.pos(i * 18, -50),
    ])
  }

  // Roof
  parent.add([
    k.rect(56, 6),
    k.color(...darkColor),
    k.anchor('bot'),
    k.pos(0, -68),
  ])
}

function createBarrier(k: KAPLAYCtx, parent: GameObj) {
  // Main barrier body
  parent.add([
    k.rect(50, 50),
    k.color(...C.BARRIER),
    k.anchor('bot'),
    k.pos(0, 0),
  ])

  // Warning stripes
  for (let i = 0; i < 4; i++) {
    parent.add([
      k.rect(46, 6),
      k.color(...C.BARRIER_STRIPE),
      k.anchor('center'),
      k.pos(0, -10 - i * 12),
    ])
  }
}

function createLowBarrier(k: KAPLAYCtx, parent: GameObj) {
  // Poles
  parent.add([
    k.rect(6, 50),
    k.color(100, 100, 110),
    k.anchor('bot'),
    k.pos(-25, 0),
  ])
  parent.add([
    k.rect(6, 50),
    k.color(100, 100, 110),
    k.anchor('bot'),
    k.pos(25, 0),
  ])

  // Horizontal bar (at slide height)
  parent.add([
    k.rect(56, 10),
    k.color(...C.BARRIER),
    k.anchor('bot'),
    k.pos(0, -38),
  ])

  // Warning stripes on bar
  for (let i = 0; i < 4; i++) {
    parent.add([
      k.rect(8, 8),
      k.color(...C.BARRIER_STRIPE),
      k.anchor('center'),
      k.pos(-20 + i * 13, -43),
    ])
  }
}

export function updateObstacle(k: KAPLAYCtx, obstacle: GameObj, speed: number, dt: number): boolean {
  if (!obstacle.exists()) return false

  const moveSpeed = speed * GAME_CONFIG.ROAD_LINE_SPEED_MULT * dt
  obstacle.baseY += moveSpeed

  const scale = getDepthScale(obstacle.baseY)
  const x = getLaneXAtDepth(obstacle.lane, obstacle.baseY)

  obstacle.pos.x = x
  obstacle.pos.y = obstacle.baseY
  obstacle.scale.x = scale
  obstacle.scale.y = scale

  // Fade in
  const fadeStart = GAME_CONFIG.LANE_Y_TOP
  const fadeEnd = fadeStart + 80
  if (obstacle.baseY < fadeEnd) {
    obstacle.opacity = Math.max(0, (obstacle.baseY - fadeStart) / (fadeEnd - fadeStart))
  } else {
    obstacle.opacity = 1
  }

  return obstacle.baseY > GAME_CONFIG.LANE_Y_BOTTOM + 80
}

import type { KAPLAYCtx, GameObj } from 'kaplay'
import { GAME_CONFIG, getLaneXAtDepth, getDepthScale } from '../config'

const C = GAME_CONFIG.COLORS

export type ObstacleType = 'train_blue' | 'train_red' | 'barrier' | 'low_barrier'

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

  if (type === 'train_blue') {
    createTrain(k, obstacle, 'blue')
  } else if (type === 'train_red') {
    createTrain(k, obstacle, 'red')
  } else if (type === 'barrier') {
    createBarrier(k, obstacle)
  } else if (type === 'low_barrier') {
    createLowBarrier(k, obstacle)
  }

  return obstacle
}

function createTrain(k: KAPLAYCtx, parent: GameObj, color: 'blue' | 'red' | 'green') {
  const bodyColor = color === 'blue' ? C.TRAIN_BODY :
                    color === 'red' ? C.TRAIN_RED : C.TRAIN_GREEN
  const darkColor = color === 'blue' ? C.TRAIN_BODY_DARK :
                    color === 'red' ? C.TRAIN_RED_DARK : C.TRAIN_GREEN_DARK

  // Shadow
  parent.add([
    k.rect(80, 10),
    k.color(0, 0, 0),
    k.anchor('center'),
    k.pos(0, 3),
    k.opacity(0.25),
  ])

  // Main body
  parent.add([
    k.rect(70, 65),
    k.color(...bodyColor),
    k.anchor('bot'),
    k.pos(0, 0),
  ])

  // Left side shading (3D depth)
  parent.add([
    k.rect(10, 63),
    k.color(...darkColor),
    k.anchor('botleft'),
    k.pos(-35, -1),
  ])

  // Top rounded edge simulation
  parent.add([
    k.rect(66, 8),
    k.color(...bodyColor),
    k.anchor('bot'),
    k.pos(0, -63),
  ])

  // Roof detail
  parent.add([
    k.rect(58, 4),
    k.color(...darkColor),
    k.anchor('bot'),
    k.pos(0, -68),
  ])

  // Yellow stripe
  parent.add([
    k.rect(70, 8),
    k.color(...C.TRAIN_ACCENT),
    k.anchor('bot'),
    k.pos(0, -22),
  ])

  // Windows row
  const windowY = -42
  for (let i = -1; i <= 1; i++) {
    parent.add([
      k.rect(16, 14),
      k.color(...C.TRAIN_WINDOW),
      k.anchor('center'),
      k.pos(i * 20, windowY),
    ])
    // Window frame
    parent.add([
      k.rect(18, 2),
      k.color(...darkColor),
      k.anchor('center'),
      k.pos(i * 20, windowY - 8),
    ])
  }

  // Door lines
  parent.add([
    k.rect(2, 50),
    k.color(...darkColor),
    k.anchor('bot'),
    k.pos(-12, -4),
    k.opacity(0.5),
  ])
  parent.add([
    k.rect(2, 50),
    k.color(...darkColor),
    k.anchor('bot'),
    k.pos(12, -4),
    k.opacity(0.5),
  ])

  // Bottom wheels area
  parent.add([
    k.rect(68, 6),
    k.color(40, 40, 45),
    k.anchor('bot'),
    k.pos(0, 4),
  ])

  // Wheels
  for (let i = -1; i <= 1; i += 2) {
    parent.add([
      k.rect(12, 10),
      k.color(50, 50, 55),
      k.anchor('center'),
      k.pos(i * 22, 6),
    ])
  }

  // Front light (if head of train)
  parent.add([
    k.rect(8, 6),
    k.color(255, 250, 200),
    k.anchor('center'),
    k.pos(0, -8),
    k.opacity(0.9),
  ])
}

function createBarrier(k: KAPLAYCtx, parent: GameObj) {
  // Shadow
  parent.add([
    k.rect(60, 8),
    k.color(0, 0, 0),
    k.anchor('center'),
    k.pos(0, 3),
    k.opacity(0.25),
  ])

  // Barrier base (concrete)
  parent.add([
    k.rect(55, 55),
    k.color(180, 175, 170),
    k.anchor('bot'),
    k.pos(0, 0),
  ])

  // Concrete shading
  parent.add([
    k.rect(10, 53),
    k.color(150, 145, 140),
    k.anchor('botleft'),
    k.pos(-27, -1),
  ])

  // Top cap
  parent.add([
    k.rect(58, 6),
    k.color(160, 155, 150),
    k.anchor('bot'),
    k.pos(0, -53),
  ])

  // Warning stripes (diagonal effect with horizontal bands)
  for (let i = 0; i < 4; i++) {
    parent.add([
      k.rect(50, 6),
      k.color(...(i % 2 === 0 ? C.BARRIER_YELLOW : C.BARRIER_BLACK)),
      k.anchor('center'),
      k.pos(0, -15 - i * 10),
    ])
  }

  // Reflective strips
  parent.add([
    k.rect(6, 6),
    k.color(255, 100, 100),
    k.anchor('center'),
    k.pos(-20, -50),
    k.opacity(0.9),
  ])
  parent.add([
    k.rect(6, 6),
    k.color(255, 100, 100),
    k.anchor('center'),
    k.pos(20, -50),
    k.opacity(0.9),
  ])
}

function createLowBarrier(k: KAPLAYCtx, parent: GameObj) {
  // Shadow
  parent.add([
    k.rect(75, 6),
    k.color(0, 0, 0),
    k.anchor('center'),
    k.pos(0, 3),
    k.opacity(0.2),
  ])

  // Support poles
  parent.add([
    k.rect(8, 55),
    k.color(100, 100, 105),
    k.anchor('bot'),
    k.pos(-28, 0),
  ])
  parent.add([
    k.rect(8, 55),
    k.color(100, 100, 105),
    k.anchor('bot'),
    k.pos(28, 0),
  ])

  // Pole caps
  parent.add([
    k.rect(12, 8),
    k.color(80, 80, 85),
    k.anchor('bot'),
    k.pos(-28, -53),
  ])
  parent.add([
    k.rect(12, 8),
    k.color(80, 80, 85),
    k.anchor('bot'),
    k.pos(28, -53),
  ])

  // Main horizontal bar (at slide height)
  parent.add([
    k.rect(70, 14),
    k.color(...C.BARRIER_ORANGE),
    k.anchor('bot'),
    k.pos(0, -42),
  ])

  // Bar highlight
  parent.add([
    k.rect(68, 4),
    k.color(255, 180, 80),
    k.anchor('bot'),
    k.pos(0, -52),
  ])

  // Bar shadow
  parent.add([
    k.rect(68, 3),
    k.color(200, 100, 0),
    k.anchor('bot'),
    k.pos(0, -42),
  ])

  // Warning tape pattern
  for (let i = 0; i < 5; i++) {
    parent.add([
      k.rect(10, 12),
      k.color(...C.BARRIER_BLACK),
      k.anchor('center'),
      k.pos(-28 + i * 14, -48),
      k.opacity(0.8),
    ])
  }

  // Reflective dots on poles
  parent.add([
    k.rect(4, 4),
    k.color(255, 255, 200),
    k.anchor('center'),
    k.pos(-28, -30),
    k.opacity(0.8),
  ])
  parent.add([
    k.rect(4, 4),
    k.color(255, 255, 200),
    k.anchor('center'),
    k.pos(28, -30),
    k.opacity(0.8),
  ])
}

export function updateObstacle(k: KAPLAYCtx, obstacle: GameObj, speed: number, dt: number): boolean {
  if (!obstacle.exists()) return false

  // Move toward player
  const moveSpeed = speed * GAME_CONFIG.ROAD_LINE_SPEED_MULT * dt
  obstacle.baseY += moveSpeed

  // Update position and scale based on depth
  const scale = getDepthScale(obstacle.baseY)
  const x = getLaneXAtDepth(obstacle.lane, obstacle.baseY)

  obstacle.pos.x = x
  obstacle.pos.y = obstacle.baseY
  obstacle.scaleTo(scale)

  // Fade in smoothly from distance
  if (obstacle.baseY < GAME_CONFIG.LANE_Y_TOP + 80) {
    const fadeProgress = (obstacle.baseY - GAME_CONFIG.LANE_Y_TOP) / 80
    obstacle.opacity = Math.max(0, fadeProgress)
  } else {
    obstacle.opacity = 1
  }

  // Remove if past bottom
  return obstacle.baseY > GAME_CONFIG.LANE_Y_BOTTOM + 100
}

export function createObstacleDestroyEffect(k: KAPLAYCtx, x: number, y: number) {
  // Metal debris
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * 360
    k.add([
      k.rect(k.rand(6, 12), k.rand(6, 12)),
      k.pos(x, y - 25),
      k.anchor('center'),
      k.color(k.rand(80, 140), k.rand(80, 140), k.rand(90, 150)),
      k.opacity(0.9),
      k.lifespan(0.4, { fade: 0.3 }),
      k.move(angle, k.rand(80, 180)),
      k.z(150),
    ])
  }

  // Sparks
  for (let i = 0; i < 6; i++) {
    k.add([
      k.rect(3, 3),
      k.pos(x + k.rand(-20, 20), y - k.rand(10, 40)),
      k.anchor('center'),
      k.color(...C.SPARK),
      k.opacity(1),
      k.lifespan(0.25, { fade: 0.2 }),
      k.move(k.rand(0, 360), k.rand(100, 200)),
      k.z(160),
    ])
  }
}

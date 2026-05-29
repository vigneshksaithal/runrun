import type { KAPLAYCtx, GameObj } from 'kaplay'
import { GAME_CONFIG, getLaneXAtDepth, getDepthScale } from '../config'

const C = GAME_CONFIG.COLORS

// train     -> must DODGE to another lane
// jump_barrier -> must JUMP over
// slide_gate   -> must SLIDE under
export type ObstacleType = 'train' | 'jump_barrier' | 'slide_gate'

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

  if (type === 'train') {
    createTrain(k, obstacle)
  } else if (type === 'jump_barrier') {
    createJumpBarrier(k, obstacle)
  } else if (type === 'slide_gate') {
    createSlideGate(k, obstacle)
  }

  return obstacle
}

// A blue subway train car (seen from behind). Fills a lane - dodge it.
function createTrain(k: KAPLAYCtx, parent: GameObj) {
  // Main body
  parent.add([k.rect(86, 94, { radius: [12, 12, 2, 2] }), k.anchor('bot'), k.pos(0, 0), k.color(...C.TRAIN)])
  // Side shading for volume
  parent.add([k.rect(22, 94, { radius: [0, 12, 2, 0] }), k.anchor('bot'), k.pos(32, 0), k.color(...C.TRAIN_DARK)])
  parent.add([k.rect(10, 94), k.anchor('bot'), k.pos(-38, 0), k.color(...C.TRAIN_LIGHT)])
  // Roof
  parent.add([k.rect(92, 12, { radius: 5 }), k.anchor('bot'), k.pos(0, -94), k.color(...C.TRAIN_ROOF)])
  // Rear window
  parent.add([k.rect(64, 26, { radius: 6 }), k.anchor('bot'), k.pos(0, -62), k.color(...C.TRAIN_WINDOW)])
  parent.add([k.rect(4, 26), k.anchor('bot'), k.pos(0, -62), k.color(...C.TRAIN)]) // window divider
  // Red trim stripe
  parent.add([k.rect(86, 9), k.anchor('bot'), k.pos(0, -30), k.color(...C.TRAIN_TRIM)])
  // Door seam
  parent.add([k.rect(3, 28), k.anchor('bot'), k.pos(-20, -2), k.color(...C.TRAIN_DARK)])
  parent.add([k.rect(3, 28), k.anchor('bot'), k.pos(20, -2), k.color(...C.TRAIN_DARK)])
  // Tail lights
  parent.add([k.rect(13, 9, { radius: 2 }), k.anchor('bot'), k.pos(-28, -12), k.color(...C.TRAIN_LIGHT_GLOW)])
  parent.add([k.rect(13, 9, { radius: 2 }), k.anchor('bot'), k.pos(28, -12), k.color(...C.TRAIN_LIGHT_GLOW)])
}

// A low red/white barrier - jump over it.
function createJumpBarrier(k: KAPLAYCtx, parent: GameObj) {
  // Glow halo
  parent.add([k.rect(88, 40), k.color(...C.BARRIER_GLOW), k.anchor('bot'), k.pos(0, 3), k.opacity(0.18)])
  // Legs
  parent.add([k.rect(7, 30), k.color(...C.BARRIER_LEG), k.anchor('bot'), k.pos(-32, 0)])
  parent.add([k.rect(7, 30), k.color(...C.BARRIER_LEG), k.anchor('bot'), k.pos(32, 0)])
  // Board
  parent.add([k.rect(84, 24, { radius: 4 }), k.color(...C.BARRIER), k.anchor('bot'), k.pos(0, -14)])
  // Red warning stripes
  for (const sx of [-28, -4, 20]) {
    parent.add([k.rect(11, 20), k.color(...C.BARRIER_STRIPE), k.anchor('bot'), k.pos(sx, -16)])
  }
  // Top rail
  parent.add([k.rect(84, 6, { radius: 3 }), k.color(...C.BARRIER_STRIPE), k.anchor('bot'), k.pos(0, -32)])
}

// An overhead gantry sign - slide under it.
function createSlideGate(k: KAPLAYCtx, parent: GameObj) {
  // Posts
  parent.add([k.rect(8, 72), k.color(...C.GATE_POST), k.anchor('bot'), k.pos(-37, 0)])
  parent.add([k.rect(8, 72), k.color(...C.GATE_POST), k.anchor('bot'), k.pos(37, 0)])
  // Glow halo behind sign
  parent.add([k.rect(96, 30), k.color(...C.GATE_GLOW), k.anchor('bot'), k.pos(0, -60), k.opacity(0.18)])
  // Sign board (hangs high so the player slides beneath)
  parent.add([k.rect(90, 26, { radius: 4 }), k.color(...C.GATE_SIGN), k.anchor('bot'), k.pos(0, -62)])
  parent.add([k.rect(90, 7), k.color(...C.GATE_SIGN_DARK), k.anchor('bot'), k.pos(0, -62)])
  parent.add([k.rect(90, 5), k.color(...C.GATE_SIGN_DARK), k.anchor('bot'), k.pos(0, -88)])
  // Downward chevrons hinting "slide under"
  parent.add([k.rect(10, 6), k.color(...C.GATE_SIGN_DARK), k.anchor('center'), k.pos(-16, -75)])
  parent.add([k.rect(10, 6), k.color(...C.GATE_SIGN_DARK), k.anchor('center'), k.pos(16, -75)])
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
  return obstacle.baseY > GAME_CONFIG.LANE_Y_BOTTOM + 120
}

export function createObstacleDestroyEffect(k: KAPLAYCtx, x: number, y: number) {
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * 360
    k.add([
      k.rect(k.rand(5, 9), k.rand(5, 9)),
      k.pos(x, y - 20),
      k.anchor('center'),
      k.color(C.DEBRIS[0], C.DEBRIS[1], C.DEBRIS[2]),
      k.opacity(0.9),
      k.lifespan(0.3, { fade: 0.2 }),
      k.move(angle, k.rand(60, 120)),
      k.z(150),
    ])
  }
}

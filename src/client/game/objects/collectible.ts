import type { KAPLAYCtx, GameObj } from 'kaplay'
import { GAME_CONFIG, getLaneXAtDepth, getDepthScale } from '../config'

const C = GAME_CONFIG.COLORS

// Build a 5-pointed star polygon centered on (0,0) with given outer/inner radius.
// Top point straight up so the star always reads as a star.
function makeStarPts(k: KAPLAYCtx, outerR: number, innerR: number) {
  const pts = []
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outerR : innerR
    // start at -90deg (top) so first vertex is the upper point
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    pts.push(k.vec2(Math.cos(a) * r, Math.sin(a) * r))
  }
  return pts
}

export function createCoin(k: KAPLAYCtx, lane: number): GameObj {
  const startY = GAME_CONFIG.LANE_Y_TOP
  const startX = getLaneXAtDepth(lane, startY)
  const startScale = getDepthScale(startY)

  // Phase offset so a flock of coins doesn't pulse in unison
  const phase = k.rand(0, Math.PI * 2)

  const coin = k.add([
    k.pos(startX, startY),
    k.anchor('center'),
    k.scale(startScale),
    k.opacity(1),
    k.z(80),
    'coin',
    { lane, baseY: startY, bobTime: 0, spinTime: phase },
  ])

  // Outer face (round body). We mutate its color and X-scale every frame
  // to fake a Y-axis spin (Subway Surfers style).
  const face = coin.add([
    k.circle(14),
    k.color(...C.COIN),
    k.anchor('center'),
    k.scale(1),
    k.pos(0, 0),
  ])

  // Inner darker rim circle for depth
  coin.add([
    k.circle(11),
    k.color(...C.COIN_DARK),
    k.opacity(0.55),
    k.anchor('center'),
    k.pos(0, 0),
  ])

  // 5-point star imprint (the "stamped star" you see on Subway Surfers coins).
  // Same fake-spin scaleX is applied to it via parent face's scale below.
  const star = coin.add([
    k.polygon(makeStarPts(k, 7, 3)),
    k.color(...C.COIN_STAR),
    k.anchor('center'),
    k.scale(1),
    k.pos(0, 0),
  ])

  // Tiny shine highlight on the upper-left
  coin.add([
    k.circle(2.5),
    k.color(255, 255, 255),
    k.opacity(0.9),
    k.anchor('center'),
    k.pos(-4, -4),
  ])

  // Per-frame fake-3D spin: squash X-scale via |cos(t)| and color-swap on the
  // back side of the spin so the coin reads as rotating around its vertical axis.
  coin.onUpdate(() => {
    if (!coin.exists()) return
    const dt = k.dt()
    coin.spinTime += dt * 5 // ~rad/s
    const c = Math.cos(coin.spinTime)
    // squashFactor 0.25..1: never collapses to 0 so it stays readable
    const sx = 0.25 + Math.abs(c) * 0.75
    face.scaleTo(k.vec2(sx, 1))
    star.scaleTo(k.vec2(sx, 1))
    // Color tilt: front face = bright gold, back face = darker gold
    const isFront = c >= 0
    if (isFront) {
      face.color = k.rgb(C.COIN[0], C.COIN[1], C.COIN[2])
    } else {
      face.color = k.rgb(C.COIN_DARK[0], C.COIN_DARK[1], C.COIN_DARK[2])
    }
  })

  return coin
}

export function updateCoin(_k: KAPLAYCtx, coin: GameObj, speed: number, dt: number): boolean {
  if (!coin.exists()) return false

  // Move toward player
  const moveSpeed = speed * GAME_CONFIG.ROAD_LINE_SPEED_MULT * dt
  coin.baseY += moveSpeed

  // Bob animation (±6px)
  coin.bobTime += dt * 4
  const bobOffset = Math.sin(coin.bobTime) * 6

  // Update position and scale based on depth
  const scale = getDepthScale(coin.baseY)
  const x = getLaneXAtDepth(coin.lane, coin.baseY)

  coin.pos.x = x
  coin.pos.y = coin.baseY + bobOffset
  coin.scaleTo(scale)

  // Remove if past bottom
  return coin.baseY > GAME_CONFIG.LANE_Y_BOTTOM + 50
}

export function createCoinCollectEffect(k: KAPLAYCtx, x: number, y: number, multiplier: number = 1) {
  // Expanding gold ring (the "ping" outline)
  const ring = k.add([
    k.circle(8),
    k.pos(x, y),
    k.anchor('center'),
    k.color(...C.COIN_RING),
    k.opacity(0.7),
    k.scale(1),
    k.z(150),
  ])
  k.tween(1, 3.4, 0.28, (v: number) => { if (ring.exists()) ring.scaleTo(v) }, k.easings.easeOutQuad)
  k.tween(0.7, 0, 0.28, (v: number) => { if (ring.exists()) ring.opacity = v })
  k.wait(0.3, () => { if (ring.exists()) ring.destroy() })

  // 4 sparkle particles (kept from existing budget)
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * 360 + k.rand(-15, 15)
    k.add([
      k.rect(5, 5),
      k.pos(x, y),
      k.anchor('center'),
      k.color(...C.PARTICLE_GOLD),
      k.opacity(0.9),
      k.lifespan(0.25, { fade: 0.15 }),
      k.move(angle, k.rand(80, 150)),
      k.z(151),
    ])
  }

  // "+N" text - simplified animation using built-in move()
  const pointValue = GAME_CONFIG.COIN_SCORE * multiplier
  k.add([
    k.text(`+${pointValue}`, { size: 18 }),
    k.pos(x, y - 10),
    k.anchor('center'),
    k.color(...C.TEXT_GOLD),
    k.opacity(1),
    k.lifespan(0.35, { fade: 0.2 }),
    k.move(k.Vec2.UP, 80),
    k.z(160),
  ])
}

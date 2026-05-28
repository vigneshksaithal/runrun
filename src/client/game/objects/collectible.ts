import type { KAPLAYCtx, GameObj } from 'kaplay'
import { GAME_CONFIG, getLaneXAtDepth, getDepthScale } from '../config'

const C = GAME_CONFIG.COLORS

export function createCoin(k: KAPLAYCtx, lane: number): GameObj {
  const startY = GAME_CONFIG.LANE_Y_TOP
  const startX = getLaneXAtDepth(lane, startY)
  const startScale = getDepthScale(startY)

  const coin = k.add([
    k.pos(startX, startY),
    k.anchor('center'),
    k.scale(startScale),
    k.opacity(1),
    k.z(80),
    'coin',
    { lane, baseY: startY, bobTime: k.rand(0, Math.PI * 2), spinTime: k.rand(0, Math.PI * 2) },
  ])

  // Glow effect behind coin
  const glow = coin.add([
    k.rect(32, 32),
    k.color(...C.COIN_GLOW),
    k.anchor('center'),
    k.pos(0, 0),
    k.opacity(0.25),
  ])

  // Outer ring
  coin.add([
    k.rect(26, 26),
    k.color(...C.COIN_DARK),
    k.anchor('center'),
    k.pos(0, 0),
  ])

  // Main gold body
  const mainBody = coin.add([
    k.rect(22, 22),
    k.color(...C.COIN_GOLD),
    k.anchor('center'),
    k.pos(0, 0),
  ])

  // Inner circle (darker)
  mainBody.add([
    k.rect(16, 16),
    k.color(...C.COIN_DARK),
    k.anchor('center'),
    k.pos(0, 0),
    k.opacity(0.3),
  ])

  // Dollar sign or star symbol
  mainBody.add([
    k.rect(4, 12),
    k.color(...C.COIN_LIGHT),
    k.anchor('center'),
    k.pos(0, 0),
    k.opacity(0.8),
  ])
  mainBody.add([
    k.rect(10, 4),
    k.color(...C.COIN_LIGHT),
    k.anchor('center'),
    k.pos(0, -3),
    k.opacity(0.8),
  ])
  mainBody.add([
    k.rect(10, 4),
    k.color(...C.COIN_LIGHT),
    k.anchor('center'),
    k.pos(0, 3),
    k.opacity(0.8),
  ])

  // Shine highlight (top-left)
  const shine = coin.add([
    k.rect(6, 6),
    k.color(...C.COIN_SHINE),
    k.anchor('center'),
    k.pos(-6, -6),
    k.opacity(0.9),
  ])

  // Store references for animation
  coin.glowRef = glow
  coin.shineRef = shine
  coin.mainRef = mainBody

  return coin
}

export function updateCoin(k: KAPLAYCtx, coin: GameObj, speed: number, dt: number): boolean {
  if (!coin.exists()) return false

  // Move toward player
  const moveSpeed = speed * GAME_CONFIG.ROAD_LINE_SPEED_MULT * dt
  coin.baseY += moveSpeed

  // Bob animation (floating up and down)
  coin.bobTime += dt * 5
  const bobOffset = Math.sin(coin.bobTime) * 8

  // Spin animation (simulate 3D rotation with scale)
  coin.spinTime += dt * 6
  const spinScale = 0.5 + Math.abs(Math.cos(coin.spinTime)) * 0.5

  // Update position and scale based on depth
  const depthScale = getDepthScale(coin.baseY)
  const x = getLaneXAtDepth(coin.lane, coin.baseY)

  coin.pos.x = x
  coin.pos.y = coin.baseY + bobOffset - 20 // Float above ground
  coin.scaleTo(depthScale * spinScale, depthScale)

  // Pulsing glow
  if (coin.glowRef && coin.glowRef.exists()) {
    coin.glowRef.opacity = 0.2 + Math.sin(coin.bobTime * 2) * 0.1
    coin.glowRef.width = 32 + Math.sin(coin.bobTime * 2) * 4
    coin.glowRef.height = 32 + Math.sin(coin.bobTime * 2) * 4
  }

  // Moving shine effect
  if (coin.shineRef && coin.shineRef.exists()) {
    const shineOffset = Math.sin(coin.spinTime) * 4
    coin.shineRef.pos.x = -6 + shineOffset
    coin.shineRef.opacity = 0.6 + Math.abs(Math.cos(coin.spinTime)) * 0.4
  }

  // Fade in smoothly from distance
  if (coin.baseY < GAME_CONFIG.LANE_Y_TOP + 60) {
    const fadeProgress = (coin.baseY - GAME_CONFIG.LANE_Y_TOP) / 60
    coin.opacity = Math.max(0, fadeProgress)
  } else {
    coin.opacity = 1
  }

  // Remove if past bottom
  return coin.baseY > GAME_CONFIG.LANE_Y_BOTTOM + 50
}

export function createCoinCollectEffect(k: KAPLAYCtx, x: number, y: number, multiplier: number = 1) {
  // Golden particle burst
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * 360
    k.add([
      k.rect(k.rand(6, 10), k.rand(6, 10)),
      k.pos(x, y),
      k.anchor('center'),
      k.color(...C.PARTICLE_GOLD),
      k.opacity(1),
      k.lifespan(0.35, { fade: 0.25 }),
      k.move(angle, k.rand(100, 200)),
      k.z(150),
    ])
  }

  // Sparkle stars
  for (let i = 0; i < 5; i++) {
    const delay = i * 0.03
    k.wait(delay, () => {
      k.add([
        k.rect(4, 4),
        k.pos(x + k.rand(-25, 25), y + k.rand(-25, 25)),
        k.anchor('center'),
        k.color(...C.COIN_SHINE),
        k.opacity(1),
        k.lifespan(0.25, { fade: 0.2 }),
        k.z(160),
      ])
    })
  }

  // Ring expand effect
  const ring = k.add([
    k.rect(20, 20),
    k.pos(x, y),
    k.anchor('center'),
    k.color(...C.COIN_GOLD),
    k.opacity(0.6),
    k.z(140),
  ])

  k.tween(
    { scale: 1, opacity: 0.6 },
    { scale: 3, opacity: 0 },
    0.3,
    (v) => {
      if (ring.exists()) {
        ring.scaleTo(v.scale)
        ring.opacity = v.opacity
      }
    },
    k.easings.easeOutQuad,
  ).then(() => {
    if (ring.exists()) ring.destroy()
  })

  // Score popup text
  const pointValue = GAME_CONFIG.COIN_SCORE * multiplier
  const scoreText = k.add([
    k.text(`+${pointValue}`, { size: 22 }),
    k.pos(x, y - 15),
    k.anchor('center'),
    k.color(...C.TEXT_GOLD),
    k.opacity(1),
    k.scale(0.5),
    k.z(170),
  ])

  // Pop in animation
  k.tween(
    0.5,
    1.2,
    0.12,
    (v) => { if (scoreText.exists()) scoreText.scaleTo(v) },
    k.easings.easeOutBack,
  ).then(() => {
    k.tween(
      1.2,
      1,
      0.1,
      (v) => { if (scoreText.exists()) scoreText.scaleTo(v) },
      k.easings.easeOutQuad,
    )
  })

  // Float up and fade
  k.tween(
    y - 15,
    y - 60,
    0.5,
    (v) => { if (scoreText.exists()) scoreText.pos.y = v },
    k.easings.easeOutQuad,
  )

  k.wait(0.3, () => {
    k.tween(
      1,
      0,
      0.2,
      (v) => { if (scoreText.exists()) scoreText.opacity = v },
      k.easings.easeOutQuad,
    ).then(() => {
      if (scoreText.exists()) scoreText.destroy()
    })
  })

  // Multiplier bonus text (if > 1)
  if (multiplier > 1) {
    const multText = k.add([
      k.text(`x${multiplier}`, { size: 16 }),
      k.pos(x + 25, y - 25),
      k.anchor('center'),
      k.color(...C.COMBO_GREEN),
      k.opacity(1),
      k.scale(1),
      k.z(171),
    ])

    k.tween(
      { y: y - 25, opacity: 1 },
      { y: y - 55, opacity: 0 },
      0.4,
      (v) => {
        if (multText.exists()) {
          multText.pos.y = v.y
          multText.opacity = v.opacity
        }
      },
      k.easings.easeOutQuad,
    ).then(() => {
      if (multText.exists()) multText.destroy()
    })
  }
}

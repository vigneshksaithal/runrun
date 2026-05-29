import type { KAPLAYCtx, GameObj } from 'kaplay'
import { GAME_CONFIG, getDepthScale, getXAtDepth } from '../config'

const C = GAME_CONFIG.COLORS
const W = GAME_CONFIG.WIDTH
const H = GAME_CONFIG.HEIGHT
const HORIZON = GAME_CONFIG.HORIZON_Y

// y range used for the moving track elements (extends past the bottom toward the camera)
const TRACK_Y_NEAR = 824
const TRACK_HALF = 136 // half-width (at scale 1) of the full 3-lane track bed

// Steel rail offsets at scale 1 -> two rails per lane (lanes centered at -100, 0, 100)
const RAIL_OFFSETS = [-128, -72, -28, 28, 72, 128]

/**
 * Builds the entire Subway-Surfers-style world: bright sky, sun, clouds, distant
 * hills, grass embankments, a 3-lane railway track with steel rails, animated
 * wooden sleepers, and side poles/palms that whoosh past to convey speed.
 *
 * Returns an `update(dt, speed)` to drive the moving elements from the game loop.
 */
export function createScenery(k: KAPLAYCtx) {
  // Helper: a perspective trapezoid (full track width) between two y levels.
  const trapezoid = (half: number, yTop: number, yBottom: number) => [
    k.vec2(getXAtDepth(-half, yTop), yTop),
    k.vec2(getXAtDepth(half, yTop), yTop),
    k.vec2(getXAtDepth(half, yBottom), yBottom),
    k.vec2(getXAtDepth(-half, yBottom), yBottom),
  ]

  // ===================================================================
  // SKY
  // ===================================================================
  k.add([k.rect(W, HORIZON * 0.5), k.pos(0, 0), k.color(...C.SKY_TOP), k.z(0)])
  k.add([k.rect(W, HORIZON * 0.5), k.pos(0, HORIZON * 0.5), k.color(...C.SKY_MID), k.z(0)])
  // A pale haze band right at the horizon
  k.add([k.rect(W, 70), k.pos(0, HORIZON - 50), k.color(...C.SKY_LOW), k.opacity(0.9), k.z(0)])

  // ===================================================================
  // SUN (top-right, with soft glow)
  // ===================================================================
  const sunX = 486
  const sunY = 104
  k.add([k.circle(74), k.pos(sunX, sunY), k.anchor('center'), k.color(...C.SUN), k.opacity(0.18), k.z(1)])
  k.add([k.circle(56), k.pos(sunX, sunY), k.anchor('center'), k.color(...C.SUN), k.opacity(0.28), k.z(1)])
  k.add([k.circle(40), k.pos(sunX, sunY), k.anchor('center'), k.color(...C.SUN_CORE), k.opacity(0.95), k.z(1)])
  k.add([k.circle(30), k.pos(sunX, sunY), k.anchor('center'), k.color(...C.SUN_CORE), k.z(1)])

  // ===================================================================
  // CLOUDS (slow horizontal drift)
  // ===================================================================
  const clouds: { obj: GameObj; speed: number }[] = []
  const cloudData = [
    { x: 120, y: 70, s: 1.0 },
    { x: 320, y: 130, s: 0.8 },
    { x: 540, y: 60, s: 1.15 },
  ]
  for (const cd of cloudData) {
    const cloud = k.add([k.pos(cd.x, cd.y), k.anchor('center'), k.scale(cd.s), k.z(2)])
    cloud.add([k.circle(20), k.anchor('center'), k.pos(-22, 4), k.color(...C.CLOUD_SHADE)])
    cloud.add([k.circle(26), k.anchor('center'), k.pos(0, 6), k.color(...C.CLOUD_SHADE)])
    cloud.add([k.circle(20), k.anchor('center'), k.pos(22, 4), k.color(...C.CLOUD_SHADE)])
    cloud.add([k.circle(18), k.anchor('center'), k.pos(-20, 0), k.color(...C.CLOUD)])
    cloud.add([k.circle(24), k.anchor('center'), k.pos(2, 0), k.color(...C.CLOUD)])
    cloud.add([k.circle(17), k.anchor('center'), k.pos(22, 1), k.color(...C.CLOUD)])
    clouds.push({ obj: cloud, speed: k.rand(6, 12) })
  }

  // ===================================================================
  // GRASS FIELD (everything below the horizon, behind the track)
  // ===================================================================
  k.add([k.rect(W, H - HORIZON), k.pos(0, HORIZON), k.color(...C.GRASS), k.z(3)])
  // Lighter sunlit band far + darker band near for depth
  k.add([k.rect(W, 90), k.pos(0, HORIZON), k.color(...C.GRASS_LIGHT), k.opacity(0.6), k.z(3)])
  k.add([k.rect(W, 150), k.pos(0, H - 150), k.color(...C.GRASS_DARK), k.opacity(0.5), k.z(3)])

  // ===================================================================
  // DISTANT HILLS + PALM SILHOUETTES along the horizon
  // ===================================================================
  const hillSpots = [60, 180, 420, 560]
  for (let i = 0; i < hillSpots.length; i++) {
    const hx = hillSpots[i]!
    k.add([k.circle(k.rand(46, 66)), k.pos(hx, HORIZON + 12), k.anchor('center'), k.color(...(i % 2 ? C.HILL_DARK : C.HILL)), k.z(3)])
  }
  // Far palm silhouettes
  for (const px of [100, 500]) {
    const palm = k.add([k.pos(px, HORIZON + 6), k.anchor('bot'), k.scale(0.7), k.z(3)])
    palm.add([k.rect(6, 40), k.anchor('bot'), k.pos(0, 0), k.color(...C.PALM_TRUNK)])
    palm.add([k.circle(16), k.anchor('center'), k.pos(0, -42), k.color(...C.PALM_LEAF_DARK)])
    palm.add([k.circle(13), k.anchor('center'), k.pos(-10, -38), k.color(...C.PALM_LEAF)])
    palm.add([k.circle(13), k.anchor('center'), k.pos(10, -38), k.color(...C.PALM_LEAF)])
  }

  // ===================================================================
  // RAILWAY TRACK BED (brown gravel trapezoid)
  // ===================================================================
  k.add([k.polygon(trapezoid(TRACK_HALF + 8, HORIZON, TRACK_Y_NEAR)), k.pos(0, 0), k.color(...C.GROUND_EDGE), k.z(4)])
  k.add([k.polygon(trapezoid(TRACK_HALF, HORIZON, TRACK_Y_NEAR)), k.pos(0, 0), k.color(...C.GROUND_NEAR), k.z(4)])
  // Sunlit far portion of the bed
  k.add([k.polygon(trapezoid(TRACK_HALF, HORIZON, 470)), k.pos(0, 0), k.color(...C.GROUND_FAR), k.opacity(0.55), k.z(4)])

  // ===================================================================
  // MOVING SLEEPERS (wooden ties) - recycle from far to near
  // ===================================================================
  const ties: GameObj[] = []
  for (let i = 0; i < GAME_CONFIG.TIE_COUNT; i++) {
    const baseProgress = i / GAME_CONFIG.TIE_COUNT
    const tie = k.add([
      k.rect(40, 8),
      k.pos(W / 2, HORIZON),
      k.anchor('center'),
      k.color(...C.TIE),
      k.outline(2, k.rgb(...C.TIE_DARK)),
      k.opacity(1),
      k.z(5),
      { baseProgress },
    ])
    ties.push(tie)
  }
  let tieOffset = 0

  // ===================================================================
  // STEEL RAILS (static converging lines, two per lane)
  // ===================================================================
  for (const off of RAIL_OFFSETS) {
    const railPts = [
      k.vec2(getXAtDepth(off - 3, HORIZON), HORIZON),
      k.vec2(getXAtDepth(off + 3, HORIZON), HORIZON),
      k.vec2(getXAtDepth(off + 3, TRACK_Y_NEAR), TRACK_Y_NEAR),
      k.vec2(getXAtDepth(off - 3, TRACK_Y_NEAR), TRACK_Y_NEAR),
    ]
    k.add([k.polygon(railPts), k.pos(0, 0), k.color(...C.RAIL_DARK), k.z(6)])
    const shinePts = [
      k.vec2(getXAtDepth(off - 1.2, HORIZON), HORIZON),
      k.vec2(getXAtDepth(off + 1.2, HORIZON), HORIZON),
      k.vec2(getXAtDepth(off + 1.2, TRACK_Y_NEAR), TRACK_Y_NEAR),
      k.vec2(getXAtDepth(off - 1.2, TRACK_Y_NEAR), TRACK_Y_NEAR),
    ]
    k.add([k.polygon(shinePts), k.pos(0, 0), k.color(...C.RAIL_SHINE), k.opacity(0.85), k.z(7)])
  }

  // ===================================================================
  // SIDE PROPS (poles + palms) - whoosh past for speed sensation
  // ===================================================================
  const SIDE_OFFSET = 178 // just outside the track edge
  const props: { obj: GameObj; baseProgress: number; side: number }[] = []
  for (let s = 0; s < 2; s++) {
    const side = s === 0 ? -1 : 1
    for (let i = 0; i < GAME_CONFIG.SIDE_PROP_COUNT; i++) {
      const baseProgress = (i + (s === 0 ? 0 : 0.5)) / GAME_CONFIG.SIDE_PROP_COUNT
      const isPole = (i + s) % 2 === 0
      const prop = k.add([k.pos(W / 2, HORIZON), k.anchor('bot'), k.scale(0.2), k.opacity(1), k.z(8)])
      if (isPole) buildPole(k, prop, side)
      else buildPalm(k, prop)
      props.push({ obj: prop, baseProgress, side })
    }
  }
  let propOffset = 0

  return {
    update(dt: number, speed: number) {
      const motion = dt * speed * 0.28

      // --- Sleepers ---
      tieOffset = (tieOffset + motion) % 1
      for (const tie of ties) {
        if (!tie.exists()) continue
        const progress = (tie.baseProgress + tieOffset) % 1
        const y = HORIZON + progress * (TRACK_Y_NEAR - HORIZON)
        const scale = getDepthScale(y)
        tie.pos.y = y
        tie.width = TRACK_HALF * 2 * scale
        tie.height = Math.max(3, 18 * scale)
        tie.opacity = Math.min(1, 0.25 + progress * 1.5)
      }

      // --- Side props ---
      propOffset = (propOffset + motion) % 1
      for (const p of props) {
        if (!p.obj.exists()) continue
        const progress = (p.baseProgress + propOffset) % 1
        const y = HORIZON + progress * (TRACK_Y_NEAR - HORIZON)
        const scale = getDepthScale(y)
        p.obj.pos.x = getXAtDepth(p.side * SIDE_OFFSET, y)
        p.obj.pos.y = y
        p.obj.scaleTo(scale * 1.05)
        p.obj.opacity = Math.min(1, 0.2 + progress * 1.6)
      }

      // --- Clouds drift ---
      for (const c of clouds) {
        if (!c.obj.exists()) continue
        c.obj.pos.x += c.speed * dt
        if (c.obj.pos.x > W + 70) c.obj.pos.x = -70
      }
    },
  }
}

// A signal / power pole drawn in local coordinates (parent anchored at the ground).
function buildPole(k: KAPLAYCtx, parent: GameObj, side: number) {
  parent.add([k.rect(13, 12), k.anchor('bot'), k.pos(0, 2), k.color(...C.POLE_DARK)]) // base
  parent.add([k.rect(8, 156), k.anchor('bot'), k.pos(0, 0), k.color(...C.POLE)]) // post
  parent.add([k.rect(5, 156), k.anchor('bot'), k.pos(-3, 0), k.color(...C.POLE_DARK)]) // shade
  parent.add([k.rect(48, 8), k.anchor('center'), k.pos(0, -132), k.color(...C.POLE_DARK)]) // crossarm
  parent.add([k.rect(40, 5), k.anchor('center'), k.pos(0, -150), k.color(...C.POLE_DARK)]) // upper crossarm
  // insulators
  parent.add([k.rect(6, 7), k.anchor('center'), k.pos(-18, -136), k.color(...C.RAIL)])
  parent.add([k.rect(6, 7), k.anchor('center'), k.pos(18, -136), k.color(...C.RAIL)])
  // a lamp head leaning over the track
  parent.add([k.rect(20, 6), k.anchor('center'), k.pos(-side * 12, -158), k.color(...C.POLE_DARK)])
  parent.add([k.rect(12, 10), k.anchor('center'), k.pos(-side * 22, -158), k.color(...C.POLE_LAMP)])
}

// A coconut palm drawn in local coordinates (parent anchored at the ground).
function buildPalm(k: KAPLAYCtx, parent: GameObj) {
  parent.add([k.rect(12, 108), k.anchor('bot'), k.pos(0, 0), k.color(...C.PALM_TRUNK)]) // trunk
  parent.add([k.rect(5, 108), k.anchor('bot'), k.pos(3, 0), k.color(...C.PALM_LEAF_DARK), k.opacity(0.35)]) // trunk shade
  // canopy (overlapping fronds)
  parent.add([k.circle(24), k.anchor('center'), k.pos(0, -120), k.color(...C.PALM_LEAF_DARK)])
  parent.add([k.circle(20), k.anchor('center'), k.pos(-20, -108), k.color(...C.PALM_LEAF)])
  parent.add([k.circle(20), k.anchor('center'), k.pos(20, -108), k.color(...C.PALM_LEAF)])
  parent.add([k.circle(19), k.anchor('center'), k.pos(0, -132), k.color(...C.PALM_LEAF)])
  parent.add([k.circle(15), k.anchor('center'), k.pos(0, -112), k.color(...C.PALM_LEAF_DARK)])
  // coconuts
  parent.add([k.circle(4), k.anchor('center'), k.pos(-6, -104), k.color(...C.PALM_TRUNK)])
  parent.add([k.circle(4), k.anchor('center'), k.pos(7, -104), k.color(...C.PALM_TRUNK)])
}

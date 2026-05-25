# RunRun Visual Overhaul - Technical Specification

> **Document Version:** 1.0
> **Based On:** 5-Agent Debate Consensus (10 rounds)
> **Target:** Production-ready pixel art game with Subway Surfers-level polish

---

## Table of Contents
1. [Config Changes](#1-config-changes)
2. [Collectible Changes](#2-collectible-changes)
3. [Obstacle Changes](#3-obstacle-changes)
4. [Lane System Changes](#4-lane-system-changes)
5. [Game Scene Changes](#5-game-scene-changes)
6. [Death Scene Changes](#6-death-scene-changes)
7. [Scoring System Changes](#7-scoring-system-changes)
8. [Start Scene Changes](#8-start-scene-changes)
9. [New: Clutch System](#9-new-clutch-system)
10. [New: Share System](#10-new-share-system)

---

## 1. Config Changes

**File:** `src/client/game/config.ts`

### 1.1 Lane Configuration


```typescript
// BEFORE
LANE_WIDTH: 100,
ROAD_LINE_COUNT: 8,

// AFTER
LANE_WIDTH: 110,        // Accommodate larger objects
ROAD_LINE_COUNT: 4,     // Reduce visual noise
```

### 1.2 Color Palette Updates

```typescript
// BEFORE → AFTER

COLORS: {
  // Lane lines - REDUCE BRIGHTNESS
  LANE_LINE: [80, 220, 200],      // → [65, 160, 150]
  
  // Coin shine - WARMER
  COIN_SHINE: [255, 255, 180],    // → [255, 245, 200]
  
  // Speed lines - SOFTER
  SPEED_LINE: [150, 220, 255],    // → [120, 180, 220]
  
  // Ambient particles - DIMMER
  PARTICLE_DUST: [80, 200, 160],  // → [60, 150, 120]
  
  // ALL OTHER COLORS UNCHANGED - especially obstacle base colors
}
```

### 1.3 Depth Scale Enhancement

```typescript
// BEFORE
export function getDepthScale(y: number): number {
  const range = GAME_CONFIG.LANE_Y_BOTTOM - GAME_CONFIG.LANE_Y_TOP
  const progress = Math.max(0, (y - GAME_CONFIG.LANE_Y_TOP) / range)
  return 0.15 + progress * 0.85  // Range: 0.15 to 1.0
}

// AFTER
export function getDepthScale(y: number): number {
  const range = GAME_CONFIG.LANE_Y_BOTTOM - GAME_CONFIG.LANE_Y_TOP
  const progress = Math.max(0, (y - GAME_CONFIG.LANE_Y_TOP) / range)
  return 0.1 + progress * 1.1    // Range: 0.1 to 1.2 (more dramatic)
}
```

---

## 2. Collectible Changes

**File:** `src/client/game/objects/collectible.ts`

### 2.1 Scale Up Coin (1.6x)


```typescript
// BEFORE - createCoin()
// Main gold body (ingot shape)
coin.add([
  k.rect(22, 16),  // Small
  k.color(...C.COIN),
  k.anchor('center'),
  k.pos(0, 0),
])

// AFTER - createCoin()
// Main gold body (ingot shape) - SCALED 1.6x
coin.add([
  k.rect(35, 26),  // 22*1.6=35.2, 16*1.6=25.6
  k.color(...C.COIN),
  k.anchor('center'),
  k.pos(0, 0),
])

// Darker gold bottom - SCALED
coin.add([
  k.rect(35, 10),  // Was: 22, 6
  k.color(...C.COIN_DARK),
  k.anchor('center'),
  k.pos(0, 8),     // Adjusted position
])

// White shine square - SCALED
coin.add([
  k.rect(6, 6),    // Was: 4, 4
  k.color(...C.COIN_SHINE),
  k.anchor('center'),
  k.pos(-10, -6),  // Adjusted position
])
```

### 2.2 Particle Lifespan Cap

```typescript
// In createCoinCollectEffect() - ensure lifespan ≤ 0.4s
k.add([
  k.rect(size, size),
  // ...
  k.lifespan(0.3, { fade: 0.2 }),  // OK - under 0.4s cap
  // ...
])
```

---

## 3. Obstacle Changes

**File:** `src/client/game/objects/obstacle.ts`

### 3.1 Scale Up Stone Wall (1.5x)


```typescript
// BEFORE - createStoneWall()
function createStoneWall(k: KAPLAYCtx, parent: GameObj) {
  // Glow halo
  parent.add([
    k.rect(68, 63),
    k.opacity(0.2),
    // ...
  ])
  // Main block
  parent.add([
    k.rect(60, 55),
    // ...
  ])
}

// AFTER - createStoneWall() - SCALED 1.5x + reduced glow opacity
function createStoneWall(k: KAPLAYCtx, parent: GameObj) {
  // Glow halo - REDUCED OPACITY
  parent.add([
    k.rect(102, 95),     // 68*1.5=102, 63*1.5=95
    k.color(...C.OBSTACLE_STONE_GLOW),
    k.anchor('bot'),
    k.pos(0, 6),         // Adjusted
    k.opacity(0.12),     // Was: 0.2
  ])
  // Main block - SCALED
  parent.add([
    k.rect(90, 83),      // 60*1.5=90, 55*1.5=83
    k.color(...C.OBSTACLE_STONE),
    k.anchor('bot'),
    k.pos(0, 0),
  ])
  // Brick lines - SCALED
  parent.add([
    k.rect(84, 5),       // 56*1.5=84, 3*1.5=5
    k.color(...C.OBSTACLE_STONE_DARK),
    k.anchor('bot'),
    k.pos(0, -30),       // 20*1.5=30
  ])
  parent.add([
    k.rect(84, 5),
    k.color(...C.OBSTACLE_STONE_DARK),
    k.anchor('bot'),
    k.pos(0, -57),       // 38*1.5=57
  ])
  // Vertical line - SCALED
  parent.add([
    k.rect(5, 75),       // 3*1.5=5, 50*1.5=75
    k.color(...C.OBSTACLE_STONE_DARK),
    k.anchor('bot'),
    k.pos(15, -5),       // 10*1.5=15, 3*1.5=5
  ])
}
```

### 3.2 Scale Up Low Beam (1.5x)

```typescript
// AFTER - createLowBeam() - SCALED 1.5x
function createLowBeam(k: KAPLAYCtx, parent: GameObj) {
  // Glow halo - REDUCED OPACITY
  parent.add([
    k.rect(117, 33),     // 78*1.5=117, 22*1.5=33
    k.color(...C.OBSTACLE_BEAM_GLOW),
    k.anchor('bot'),
    k.pos(0, -57),       // 38*1.5=57
    k.opacity(0.12),     // Was: 0.2
  ])
  // Wide bar at top - SCALED
  parent.add([
    k.rect(105, 21),     // 70*1.5=105, 14*1.5=21
    k.color(...C.OBSTACLE_BEAM),
    k.anchor('bot'),
    k.pos(0, -66),       // 44*1.5=66
  ])
  // Hanging strands - SCALED
  parent.add([
    k.rect(5, 18),       // 3*1.5=5, 12*1.5=18
    k.color(...C.OBSTACLE_BEAM_DARK),
    k.anchor('top'),
    k.pos(-23, -66),     // 15*1.5=23
  ])
  parent.add([
    k.rect(5, 15),       // 3*1.5=5, 10*1.5=15
    k.color(...C.OBSTACLE_BEAM_DARK),
    k.anchor('top'),
    k.pos(18, -66),      // 12*1.5=18
  ])
}
```

### 3.3 Scale Up Pillar (1.5x)


```typescript
// AFTER - createPillar() - SCALED 1.5x
function createPillar(k: KAPLAYCtx, parent: GameObj) {
  // Glow halo - REDUCED OPACITY
  parent.add([
    k.rect(78, 95),      // 52*1.5=78, 63*1.5=95
    k.color(...C.OBSTACLE_PILLAR_GLOW),
    k.anchor('bot'),
    k.pos(0, 6),
    k.opacity(0.12),     // Was: 0.2
  ])
  // Tall block - SCALED
  parent.add([
    k.rect(66, 83),      // 44*1.5=66, 55*1.5=83
    k.color(...C.OBSTACLE_PILLAR),
    k.anchor('bot'),
    k.pos(0, 0),
  ])
  // Warning stripe - SCALED
  parent.add([
    k.rect(66, 15),      // 44*1.5=66, 10*1.5=15
    k.color(...C.OBSTACLE_STRIPE),
    k.anchor('bot'),
    k.pos(0, -33),       // 22*1.5=33
  ])
  // Dark stripe overlay - SCALED
  parent.add([
    k.rect(15, 15),      // 10*1.5=15
    k.color(...C.OBSTACLE_STRIPE_DARK),
    k.anchor('bot'),
    k.pos(-18, -33),     // 12*1.5=18
  ])
}
```

---

## 4. Lane System Changes

**File:** `src/client/game/systems/lanes.ts`

### 4.1 Add Anticipation State Machine

```typescript
import { GAME_CONFIG, getLaneX } from '../config'

type LaneState = 'idle' | 'anticipating' | 'moving' | 'settling'

export function createLaneSystem() {
  let currentLane = 1
  let pendingLane = 1                    // NEW
  let targetX = getLaneX(currentLane)
  let currentX = targetX
  let tiltAngle = 0
  let isMoving = false
  let state: LaneState = 'idle'          // NEW
  let anticipationTimer = 0               // NEW

  const TILT_MAX = 15
  const TILT_DECAY = 8
  const ANTICIPATION_DURATION = 0.05     // NEW: 50ms

  return {
    getCurrentLane(): number {
      return currentLane
    },

    getCurrentX(): number {
      return currentX
    },

    getTilt(): number {
      return tiltAngle
    },

    isLaneChanging(): boolean {
      return isMoving || state === 'anticipating'
    },

    moveLeft(): boolean {
      if (currentLane > 0 && state === 'idle') {
        state = 'anticipating'
        anticipationTimer = 0
        tiltAngle = -TILT_MAX * 0.6      // Partial tilt for anticipation
        pendingLane = currentLane - 1
        return true
      }
      return false
    },

    moveRight(): boolean {
      if (currentLane < GAME_CONFIG.LANES - 1 && state === 'idle') {
        state = 'anticipating'
        anticipationTimer = 0
        tiltAngle = TILT_MAX * 0.6       // Partial tilt for anticipation
        pendingLane = currentLane + 1
        return true
      }
      return false
    },


    update(dt: number) {
      // Handle anticipation phase
      if (state === 'anticipating') {
        anticipationTimer += dt
        if (anticipationTimer >= ANTICIPATION_DURATION) {
          // Transition to moving
          state = 'moving'
          currentLane = pendingLane
          targetX = getLaneX(currentLane)
          tiltAngle = pendingLane > currentLane ? TILT_MAX : -TILT_MAX
          isMoving = true
        }
        return  // Don't move position during anticipation
      }

      // Smooth lerp to target lane
      const diff = targetX - currentX
      currentX += diff * GAME_CONFIG.LANE_SWITCH_SPEED

      // Snap when very close
      if (Math.abs(diff) < 0.5) {
        currentX = targetX
        isMoving = false
        if (state === 'moving') {
          state = 'settling'
          // Quick settle, then idle
          setTimeout(() => { state = 'idle' }, 50)
        }
      }

      // Decay tilt back to 0
      if (Math.abs(tiltAngle) > 0.5) {
        tiltAngle -= tiltAngle * TILT_DECAY * dt
      } else {
        tiltAngle = 0
      }
    },

    reset() {
      currentLane = 1
      pendingLane = 1
      targetX = getLaneX(1)
      currentX = targetX
      tiltAngle = 0
      isMoving = false
      state = 'idle'
      anticipationTimer = 0
    }
  }
}
```

---

## 5. Game Scene Changes

**File:** `src/client/game/scenes/game.ts`

### 5.1 Reduce Lane Lines + Lower Opacity

```typescript
// BEFORE - Road lines creation
for (let i = 0; i < GAME_CONFIG.ROAD_LINE_COUNT; i++) {
  // ...
  const line = k.add([
    k.rect(lineWidth, 2),
    // ...
    k.opacity(0.3 + progress * 0.3),  // Max 0.6
    // ...
  ])
}

// AFTER - With reduced count (now 4) and dimmer opacity
for (let i = 0; i < GAME_CONFIG.ROAD_LINE_COUNT; i++) {
  // ...
  const line = k.add([
    k.rect(lineWidth, 2),
    // ...
    k.opacity(0.2 + progress * 0.25),  // Max 0.45 (reduced)
    // ...
  ])
}
```

### 5.2 Add Clutch Detection (see Section 9)

---

## 6. Death Scene Changes

**File:** `src/client/game/scenes/death.ts`


### 6.1 Enhanced Death Explosion

```typescript
// In death scene, after player position is captured:

// ENHANCED VOXEL EXPLOSION - More particles, varied sizes, staggered
const chunkColors: [number, number, number][] = [
  C.PLAYER_BODY, C.PLAYER_HEAD, C.PLAYER_HAIR,
  C.PLAYER_LEGS, C.PLAYER_BODY, C.PLAYER_HEAD,
  C.PLAYER_HAIR, C.PLAYER_LEGS, C.PLAYER_BODY, C.PLAYER_HEAD,
  C.PLAYER_BODY, C.PLAYER_HEAD, C.PLAYER_HAIR,  // Added more
  C.PLAYER_LEGS, C.PLAYER_BODY, C.PLAYER_HEAD,  // Total: 16
]

for (let i = 0; i < 16; i++) {  // Was: 10
  const angle = (i / 16) * Math.PI * 2 + k.rand(-0.2, 0.2)  // Add randomness
  const speed = k.rand(150, 380)   // Increased range
  const size = k.rand(10, 20)      // Larger sizes
  const color = chunkColors[i % chunkColors.length]!
  
  // STAGGER particle spawns for dramatic effect
  k.wait(i * 0.012, () => {
    const chunk = k.add([
      k.rect(size, size),
      k.pos(px, py - 30),
      k.anchor('center'),
      k.color(color[0], color[1], color[2]),
      k.opacity(1),
      k.scale(1),
      k.z(250),
      k.move(k.Vec2.fromAngle(k.rad2deg(angle)), speed),
      { vy: k.rand(-350, -120) as number, spin: k.rand(-450, 450) as number },
    ])
    // Gravity + spin
    chunk.onUpdate(() => {
      if (!chunk.exists()) return
      chunk.vy += 900 * k.dt()  // Increased gravity
      chunk.pos.y += chunk.vy * k.dt()
      chunk.angle += chunk.spin * k.dt()
      chunk.opacity -= k.dt() * 1.4  // Faster fade
      if (chunk.opacity <= 0) chunk.destroy()
    })
  })
}

// INCREASED SCREEN SHAKE
k.shake(15)  // Was: 12
```

### 6.2 Add Share Button (see Section 10)

### 6.3 Show Clutch Count

```typescript
// After coins display, add clutch count if any
const clutchCount = params?.clutchCount ?? 0
if (clutchCount > 0) {
  k.add([
    k.text(`Clutch Saves: ${clutchCount}`, { size: 18 }),
    k.pos(GAME_CONFIG.WIDTH / 2, 450),
    k.anchor('center'),
    k.color(255, 200, 50),
    k.z(270),
  ])
}
```

---

## 7. Scoring System Changes

**File:** `src/client/game/systems/scoring.ts`

### 7.1 Add Clutch Tracking

```typescript
export function createScoringSystem() {
  let score = 0
  let coinsCollected = 0
  let comboCount = 0
  let multiplier = 1
  let lives = 3
  let highScore = loadHighScore()
  let clutchCount = 0           // NEW

  // ... existing functions ...

  return {
    // ... existing methods ...

    getClutchCount(): number {     // NEW
      return clutchCount
    },

    addClutchBonus(points: number) {  // NEW
      score += points
      clutchCount++
    },

    reset() {
      score = 0
      coinsCollected = 0
      comboCount = 0
      multiplier = 1
      lives = 3
      clutchCount = 0           // NEW
    },
  }
}
```


---

## 8. Start Scene Changes

**File:** `src/client/game/scenes/start.ts`

### 8.1 Parse Challenge URL Parameter

```typescript
// Add at top of file
function parseChallenge(): number | null {
  try {
    const params = new URLSearchParams(window.location.search)
    const challenge = params.get('challenge')
    return challenge ? parseInt(challenge, 10) : null
  } catch {
    return null
  }
}

// In start scene creation
k.scene('start', () => {
  const challengeScore = parseChallenge()
  
  // ... existing background code ...

  // NEW: Challenge banner if present
  if (challengeScore && challengeScore > 0) {
    // Challenge glow background
    k.add([
      k.rect(280, 50, { radius: 8 }),
      k.pos(GAME_CONFIG.WIDTH / 2, 130),
      k.anchor('center'),
      k.color(255, 80, 80),
      k.opacity(0.3),
      k.z(9),
    ])
    
    // Challenge text
    k.add([
      k.text(`BEAT ${challengeScore}!`, { size: 26 }),
      k.pos(GAME_CONFIG.WIDTH / 2, 130),
      k.anchor('center'),
      k.color(255, 100, 100),
      k.z(10),
    ])
    
    // Pulsing animation
    let pulseT = 0
    k.onUpdate(() => {
      pulseT += k.dt() * 4
      // Could animate the challenge banner
    })
  }

  // ... rest of existing start scene code ...
  
  // Pass challenge score to game scene
  k.onKeyPress(() => k.go('game', { challengeScore }))
  k.onMousePress(() => k.go('game', { challengeScore }))
  k.onTouchStart(() => k.go('game', { challengeScore }))
})
```

---

## 9. New: Clutch System

**File:** `src/client/game/scenes/game.ts`

### 9.1 State Tracking

```typescript
// Add to game scene variables
let lastActionTime = 0
let lastActionType: 'jump' | 'slide' | null = null
let lastClutchTime = -5000  // Start with cooldown passed

// Update action handlers to track timing
if (action === 'jump' && !isJumping) {
  isJumping = true
  lastActionTime = performance.now()  // Track action time
  lastActionType = 'jump'
  jumpPlayer(k, player)
  k.wait(GAME_CONFIG.JUMP_DURATION, () => { isJumping = false })
} else if (action === 'slide' && !isSliding) {
  isSliding = true
  lastActionTime = performance.now()  // Track action time
  lastActionType = 'slide'
  slidePlayer(k, player)
  k.wait(GAME_CONFIG.SLIDE_DURATION, () => { isSliding = false })
}
```

### 9.2 Clutch Detection in Collision Loop

```typescript
// In obstacle collision check, BEFORE the hit check:
for (const obs of obstacles) {
  // ... existing update code ...
  
  if (!obs.exists() || !player.exists()) continue
  if (obs.lane !== lanes.getCurrentLane()) continue

  const dy = Math.abs(obs.baseY - GAME_CONFIG.PLAYER_Y)
  
  // CLUTCH DETECTION - check before collision skip
  const CLUTCH_ZONE_MIN = 35
  const CLUTCH_ZONE_MAX = 55
  const CLUTCH_TIMING_WINDOW = 200  // ms
  const CLUTCH_COOLDOWN = 5000      // ms
  
  if (dy >= CLUTCH_ZONE_MIN && dy <= CLUTCH_ZONE_MAX) {
    const now = performance.now()
    const timeSinceAction = now - lastActionTime
    const cooldownPassed = (now - lastClutchTime) > CLUTCH_COOLDOWN
    
    const type = obs.obstacleType as string
    const correctAction = (
      (type === 'stone_wall' && lastActionType === 'jump' && isJumping) ||
      (type === 'low_beam' && lastActionType === 'slide' && isSliding)
    )
    
    if (correctAction && timeSinceAction < CLUTCH_TIMING_WINDOW && cooldownPassed) {
      // CLUTCH!
      lastClutchTime = now
      scoring.addClutchBonus(50)
      createClutchEffect(k, player.pos.x, player.pos.y)
    }
  }

  // ... rest of existing collision check ...
}
```


### 9.3 Clutch Effect Function

```typescript
// Add to game.ts or separate effects file
function createClutchEffect(k: KAPLAYCtx, x: number, y: number) {
  // "+CLUTCH" floating text
  const txt = k.add([
    k.text('CLUTCH!', { size: 20 }),
    k.pos(x, y - 70),
    k.anchor('center'),
    k.color(255, 200, 50),
    k.opacity(1),
    k.scale(1.3),
    k.z(200),
  ])
  
  // Animate text rising and fading
  k.tween(
    txt.pos.y,
    txt.pos.y - 40,
    0.5,
    (v) => { if (txt.exists()) txt.pos.y = v },
    k.easings.easeOutQuad,
  )
  k.tween(
    1,
    0,
    0.5,
    (v) => { if (txt.exists()) txt.opacity = v },
    k.easings.easeInQuad,
  )
  k.wait(0.5, () => { if (txt.exists()) txt.destroy() })
  
  // Brief screen edge gold flash
  const flash = k.add([
    k.rect(GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT),
    k.pos(0, 0),
    k.color(255, 200, 50),
    k.opacity(0.15),
    k.z(250),
  ])
  k.tween(
    0.15,
    0,
    0.12,
    (v) => { if (flash.exists()) flash.opacity = v },
    k.easings.easeOutQuad,
  )
  k.wait(0.12, () => { if (flash.exists()) flash.destroy() })
  
  // Small screen shake
  k.shake(3)
}
```

---

## 10. New: Share System

**File:** `src/client/game/scenes/death.ts`

### 10.1 Share Button Implementation

```typescript
// Add after retry button creation (inside the k.wait(0.45, ...) block)

// SHARE BUTTON - appears after retry button
k.wait(0.2, () => {  // Slight delay after retry
  const shareBtn = k.add([
    k.rect(160, 46, { radius: 6 }),
    k.pos(GAME_CONFIG.WIDTH / 2, 600),
    k.anchor('center'),
    k.color(70, 140, 220),
    k.scale(1),
    k.z(270),
  ])
  
  // Button darker bottom
  shareBtn.add([
    k.rect(160, 15, { radius: 4 }),
    k.color(50, 100, 180),
    k.anchor('bot'),
    k.pos(0, 23),
  ])
  
  // Button text
  shareBtn.add([
    k.text('SHARE SCORE', { size: 18 }),
    k.color(...C.TEXT_WHITE),
    k.anchor('center'),
    k.pos(0, -3),
  ])
  
  // Click handler
  shareBtn.onClick(() => handleShare(k, score, coins))
})
```

### 10.2 Share Handler Function

```typescript
// Add to death.ts
async function handleShare(k: KAPLAYCtx, score: number, coins: number) {
  const shareText = `I scored ${score} points in RunRun! Can you beat me? `
  const baseUrl = window.location.origin + window.location.pathname
  const shareUrl = `${baseUrl}?challenge=${score}`
  
  try {
    // Try native share API first (works on mobile)
    if (navigator.share) {
      await navigator.share({
        title: 'RunRun Score',
        text: shareText,
        url: shareUrl,
      })
      showToast(k, 'Shared!')
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`)
      showToast(k, 'Copied to clipboard!')
    }
  } catch (e) {
    // Ultimate fallback
    console.log('Share failed:', e)
    showToast(k, 'Copy failed')
  }
}

// Toast notification
function showToast(k: KAPLAYCtx, message: string) {
  const toast = k.add([
    k.rect(200, 40, { radius: 8 }),
    k.pos(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT - 60),
    k.anchor('center'),
    k.color(40, 40, 40),
    k.opacity(0.9),
    k.z(300),
  ])
  toast.add([
    k.text(message, { size: 16 }),
    k.color(255, 255, 255),
    k.anchor('center'),
    k.pos(0, 0),
  ])
  
  // Fade out after 2 seconds
  k.wait(2, () => {
    k.tween(0.9, 0, 0.3, (v) => { 
      if (toast.exists()) toast.opacity = v 
    })
    k.wait(0.3, () => { if (toast.exists()) toast.destroy() })
  })
}
```


### 10.3 Update DeathPayload Interface

```typescript
// death.ts - Update interface
export interface DeathPayload {
  score: number
  coins: number
  isNewHigh: boolean
  playerX: number
  playerY: number
  clutchCount: number      // NEW
  challengeScore?: number  // NEW - if came from challenge URL
}
```

---

## Summary: Files to Modify

| File | Changes |
|------|---------|
| `config.ts` | Colors, lane width, road line count, depth scale |
| `collectible.ts` | Coin size (1.6x) |
| `obstacle.ts` | All obstacle sizes (1.5x), glow opacity (0.12) |
| `lanes.ts` | Anticipation state machine |
| `game.ts` | Lane line opacity, clutch detection |
| `death.ts` | Enhanced explosion, share button, clutch count |
| `scoring.ts` | Clutch tracking |
| `start.ts` | Challenge URL parsing |
| `player.ts` | Particle lifespan audit |

---

## Testing Checklist

### Visual Tests
- [ ] Lane lines are dimmer and fewer (4 instead of 8)
- [ ] Coins are visibly larger and more readable
- [ ] Obstacles are larger but don't overlap between lanes
- [ ] Death explosion has more particles and feels more impactful
- [ ] Eye strain is reduced after 5+ minute sessions

### Functional Tests
- [ ] Lane change has visible anticipation tilt before movement
- [ ] Share button appears on death screen
- [ ] Navigator.share works on mobile (or clipboard fallback)
- [ ] Challenge URL param shows "BEAT X!" on start screen
- [ ] Clutch detection triggers on close calls (35-55px zone)
- [ ] Clutch has 5-second cooldown between triggers
- [ ] Clutch count shows on death screen

### Performance Tests
- [ ] Maintains 60fps on desktop
- [ ] Maintains 30fps+ on 2019 mobile device
- [ ] No particle accumulation over long sessions
- [ ] Object count stays under 50 at all times

---

*Technical specification complete. Ready for implementation.*

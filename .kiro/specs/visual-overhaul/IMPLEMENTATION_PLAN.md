# RunRun Visual Overhaul - Implementation Plan

> **Goal:** Transform RunRun from a "prototype" to a "production-ready" polished pixel art endless runner with Subway Surfers-level juice and viral K-factor mechanics.

## Executive Summary

Based on the 5-agent debate (Product Manager, Engineering Lead, Customer Success, Marketing Manager, Game Designer), we have consensus on **10 prioritized visual improvements** that address:

1. **Eye Strain** - #1 user complaint (bright cyan lane lines)
2. **"Prototype Feel"** - Small objects, lacking juice, no wow moments
3. **Repetitiveness** - Same visuals every run, no progression feedback
4. **Virality Gap** - No share mechanics, no K-factor driver

**Total Estimated Effort:** 12-15 hours
**Expected Impact:** Transform perception from "prototype" to "polished game"

---

## Priority Implementation Order

### PHASE 1: Quick Wins (2-3 hours)
*Config changes and immediate visual improvements*

| # | Change | File(s) | Effort | Impact |
|---|--------|---------|--------|--------|
| 1 | Color Palette Refinement | `config.ts` | 30 min | High - fixes eye strain |
| 2 | Scale Coins (1.6x) & Obstacles (1.5x) | `config.ts`, `collectible.ts`, `obstacle.ts` | 15 min | High - improves readability |
| 3 | Reduce Lane Lines (8→4) + Dim Opacity | `config.ts`, `game.ts` | 10 min | High - reduces visual noise |
| 8 | Glow/Halo Opacity Reduction | `config.ts` | 15 min | Medium - reduces fatigue |
| 9 | Particle Lifespan Cap (0.4s) | `collectible.ts`, `player.ts`, `obstacle.ts` | 20 min | Medium - performance guard |

### PHASE 2: Core Juice (3-4 hours)
*Game feel improvements*

| # | Change | File(s) | Effort | Impact |
|---|--------|---------|--------|--------|
| 5 | Lane Change Anticipation (50ms Tilt) | `lanes.ts`, `game.ts` | 1-2 hr | High - makes game "feel good" |
| 10 | Death Screen Explosion Enhancement | `death.ts`, `player.ts` | 1 hr | Medium - shareable moment |

### PHASE 3: Viral Mechanics (4-5 hours)
*K-factor and engagement drivers*

| # | Change | File(s) | Effort | Impact |
|---|--------|---------|--------|--------|
| 4 | Share Button on Death Screen | `death.ts`, `main.ts` | 2 hr | Critical - K-factor driver |
| 6 | Challenge URL Deep Links | `main.ts`, `start.ts` | 2-3 hr | High - competitive engagement |

### PHASE 4: Advanced Features (3-4 hours)
*Engagement and retention*

| # | Change | File(s) | Effort | Impact |
|---|--------|---------|--------|--------|
| 7 | Near-Miss "CLUTCH" System | `game.ts`, `scoring.ts` | 3 hr | Medium-High - dopamine hits |

---

## Detailed Specifications

### Priority 1: Color Palette Refinement

**Problem:** Bright cyan lane lines `[80, 220, 200]` cause eye strain after extended play.

**Solution:** Muted, warmer color palette

```typescript
// config.ts - COLORS object changes

// BEFORE → AFTER

// Lane lines: Too bright → Muted teal
LANE_LINE: [80, 220, 200] → [65, 160, 150]

// Coin shine: Harsh white → Warmer gold
COIN_SHINE: [255, 255, 180] → [255, 245, 200]

// Speed lines: Too prominent → Softer
SPEED_LINE: [150, 220, 255] → [120, 180, 220]

// Ambient particles: Too bright → Dimmer
PARTICLE_DUST: [80, 200, 160] → [60, 150, 120]
```

**Unchanged (intentionally):**
- Obstacle base colors (RED/AMBER/MAGENTA) - safety readability
- Coin gold `[255, 200, 0]` - needs to pop for rewards
- Background gradient - Crystal Cavern aesthetic identity
- Player colors - avatar distinctiveness

---

### Priority 2: Scale Up Coins & Obstacles

**Problem:** Objects too small (coins 22x16, barely visible at spawn depth)

**Solution:** Differential scaling for visual hierarchy

```typescript
// collectible.ts - createCoin()
// BEFORE: 22x16 rect
// AFTER: 35x26 rect (1.6x scale)

coin.add([
  k.rect(35, 26),  // Was: 22, 16
  k.color(...C.COIN),
  k.anchor('center'),
  k.pos(0, 0),
])

// Darker gold bottom (depth) - also scaled
coin.add([
  k.rect(35, 10),  // Was: 22, 6
  k.color(...C.COIN_DARK),
  ...
])

// Shine square - scaled proportionally
coin.add([
  k.rect(6, 6),  // Was: 4, 4
  k.color(...C.COIN_SHINE),
  ...
])
```

```typescript
// obstacle.ts - Scale multipliers

// Stone Wall: 60x55 → 90x83 (1.5x)
// Low Beam: 70x14 → 105x21 (1.5x)
// Pillar: 44x55 → 66x83 (1.5x)
```

**Also modify `config.ts`:**
```typescript
// Increase lane width for larger objects
LANE_WIDTH: 100 → 110

// Enhanced depth scale range for more dramatic approach
// getDepthScale() modification:
// BEFORE: return 0.15 + progress * 0.85
// AFTER:  return 0.1 + progress * 1.1  // Range: 0.1 to 1.2
```

---

### Priority 3: Reduce Lane Lines

**Problem:** 8 animated lines create strobing/eye strain

**Solution:** Reduce to 4 lines with lower opacity

```typescript
// config.ts
ROAD_LINE_COUNT: 8 → 4

// game.ts - Lane line creation
// Change opacity formula:
// BEFORE: k.opacity(0.3 + progress * 0.3)
// AFTER:  k.opacity(0.2 + progress * 0.25)  // Max 0.45 instead of 0.6
```

---

### Priority 4: Share Button on Death Screen

**Problem:** No K-factor driver, deaths aren't shareable moments

**Solution:** Native share with clipboard fallback

```typescript
// death.ts - Add share functionality

// Share button (appears after retry button)
k.wait(0.6, () => {
  const shareBtn = k.add([
    k.rect(180, 48, { radius: 6 }),
    k.pos(GAME_CONFIG.WIDTH / 2, 590),
    k.anchor('center'),
    k.color(80, 180, 255),  // Blue share color
    k.scale(1),
    k.z(270),
  ])
  
  shareBtn.add([
    k.text('SHARE SCORE', { size: 18 }),
    k.color(...C.TEXT_WHITE),
    k.anchor('center'),
    k.pos(0, -2),
  ])
  
  // Share on click
  shareBtn.onClick(async () => {
    const shareText = `I scored ${score} in RunRun! Can you beat me?`
    const shareUrl = `${window.location.href}?challenge=${score}`
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'RunRun Score',
          text: shareText,
          url: shareUrl,
        })
      } else {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`)
        // Show "Copied!" toast
        showCopiedToast(k)
      }
    } catch (e) {
      // Fallback: just show the URL
      console.log('Share failed:', e)
    }
  })
})
```

---

### Priority 5: Lane Change Anticipation

**Problem:** Lane changes feel "twitchy" - no visual telegraphing

**Solution:** 50ms visual tilt BEFORE position starts moving

```typescript
// lanes.ts - Add anticipation state machine

type LaneState = 'idle' | 'anticipating' | 'moving' | 'settling'

export function createLaneSystem() {
  let state: LaneState = 'idle'
  let anticipationTimer = 0
  const ANTICIPATION_DURATION = 0.05  // 50ms
  
  // ... existing variables ...

  return {
    moveLeft(): boolean {
      if (currentLane > 0 && state === 'idle') {
        state = 'anticipating'
        anticipationTimer = 0
        // Set tilt immediately for anticipation
        tiltAngle = -TILT_MAX * 0.6  // Partial tilt
        pendingLane = currentLane - 1
        return true
      }
      return false
    },

    update(dt: number) {
      if (state === 'anticipating') {
        anticipationTimer += dt
        if (anticipationTimer >= ANTICIPATION_DURATION) {
          // Now actually start moving
          state = 'moving'
          currentLane = pendingLane
          targetX = getLaneX(currentLane)
          tiltAngle = (pendingLane < currentLane) ? TILT_MAX : -TILT_MAX
        }
        return  // Don't move position yet
      }
      
      // ... rest of existing update logic ...
    },
    
    // ... rest of methods ...
  }
}
```

---

### Priority 6: Challenge URL Deep Links

**Problem:** No competitive engagement mechanism

**Solution:** URL params that show "beat this score" challenge

```typescript
// main.ts or start.ts - Parse challenge param on load

function parseChallenge(): number | null {
  const params = new URLSearchParams(window.location.search)
  const challenge = params.get('challenge')
  return challenge ? parseInt(challenge, 10) : null
}

// In start scene:
const challengeScore = parseChallenge()

if (challengeScore) {
  // Show challenge banner
  k.add([
    k.text(`BEAT ${challengeScore}!`, { size: 24 }),
    k.pos(GAME_CONFIG.WIDTH / 2, 140),
    k.anchor('center'),
    k.color(255, 100, 100),
    k.z(10),
  ])
  
  // Pulsing animation
  // Store challengeScore in game state for death screen comparison
}

// In death scene - compare to challenge
if (challengeScore && score > challengeScore) {
  // VICTORY! Show celebration
  k.add([
    k.text('YOU WON!', { size: 32 }),
    k.color(80, 255, 120),
    // ... celebration effects
  ])
}
```

---

### Priority 7: Near-Miss "CLUTCH" System

**Problem:** Skill expression goes unrewarded

**Solution:** Detect close calls, reward with feedback

```typescript
// game.ts - Add clutch detection

let lastActionTime = 0
let lastActionType: 'jump' | 'slide' | null = null
let lastClutchTime = -5000

// In action handlers:
if (action === 'jump' && !isJumping) {
  lastActionTime = Date.now()
  lastActionType = 'jump'
  // ... rest of jump logic
}

// In obstacle collision check (where we normally check for hit):
const dy = Math.abs(obs.baseY - GAME_CONFIG.PLAYER_Y)

// Check for clutch BEFORE checking for collision skip
if (dy <= 55 && dy >= 35) {  // Clutch zone
  const timeSinceAction = Date.now() - lastActionTime
  const clutchCooldownPassed = (Date.now() - lastClutchTime) > 5000
  
  if (timeSinceAction < 200 && clutchCooldownPassed) {
    // CLUTCH!
    lastClutchTime = Date.now()
    scoring.addClutchBonus(50)
    createClutchEffect(k, player.pos.x, player.pos.y)
  }
}

// Clutch effect function
function createClutchEffect(k: KAPLAYCtx, x: number, y: number) {
  // "+CLUTCH" text
  const txt = k.add([
    k.text('CLUTCH!', { size: 18 }),
    k.pos(x, y - 60),
    k.anchor('center'),
    k.color(255, 200, 50),
    k.opacity(1),
    k.lifespan(0.6, { fade: 0.3 }),
    k.z(200),
  ])
  
  // Brief screen edge flash
  const flash = k.add([
    k.rect(GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT),
    k.pos(0, 0),
    k.color(255, 200, 50),
    k.opacity(0.15),
    k.z(250),
    k.lifespan(0.1, { fade: 0.08 }),
  ])
}
```

---

### Priority 8: Glow Opacity Reduction

**Problem:** Obstacle glow halos create visual competition

**Solution:** Reduce glow opacity from 0.2 to 0.12

```typescript
// obstacle.ts - All glow halos

// Stone wall glow
parent.add([
  k.rect(68, 63),
  k.color(...C.OBSTACLE_STONE_GLOW),
  k.anchor('bot'),
  k.pos(0, 4),
  k.opacity(0.12),  // Was: 0.2
])

// Same change for BEAM_GLOW and PILLAR_GLOW
```

---

### Priority 9: Particle Lifespan Cap

**Problem:** Long-lived particles can accumulate and hurt performance

**Solution:** Cap all particles at 0.4s max lifespan

```typescript
// Audit all lifespan() calls and cap at 0.4

// collectible.ts
k.lifespan(0.3, { fade: 0.2 })  // OK - already under 0.4

// player.ts - trail particles
k.lifespan(0.3, { fade: 0.2 })  // OK

// death effects
k.lifespan(0.4, { fade: 0.3 })  // Cap at 0.4 (was 0.45 in some places)
```

---

### Priority 10: Death Screen Explosion Enhancement

**Problem:** Death feels anticlimactic, not shareable

**Solution:** More particles, varied sizes, dramatic timing

```typescript
// player.ts - createDeathParticles()

export function createDeathParticles(k: KAPLAYCtx, x: number, y: number) {
  // Increase from 12 to 16 particles
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2 + k.rand(-0.2, 0.2)  // Add randomness
    const speed = k.rand(180, 400)  // Increased speed range
    const color = colors[i % colors.length]
    const size = k.rand(8, 18)  // Larger size range
    
    // Stagger particle spawns for more dramatic effect
    k.wait(i * 0.015, () => {
      const p = k.add([
        k.rect(size, size),
        k.pos(x, y - 30),
        k.anchor('center'),
        k.color(...color),
        k.opacity(1),
        k.scale(1),
        k.lifespan(0.4, { fade: 0.3 }),
        k.move(k.Vec2.fromAngle(k.rad2deg(angle)), speed),
        k.z(200),
      ])
      void p
    })
  }
  
  // Add screen shake
  k.shake(15)  // Increased from 12
}
```

---

## Implementation Checklist

### Phase 1: Quick Wins
- [ ] Update `LANE_LINE` color in config.ts
- [ ] Update `COIN_SHINE`, `SPEED_LINE`, `PARTICLE_DUST` colors
- [ ] Scale coin dimensions in collectible.ts
- [ ] Scale obstacle dimensions in obstacle.ts
- [ ] Update `LANE_WIDTH` to 110
- [ ] Modify `getDepthScale()` for enhanced range
- [ ] Reduce `ROAD_LINE_COUNT` to 4
- [ ] Lower lane line opacity formula
- [ ] Reduce glow opacities to 0.12
- [ ] Audit and cap particle lifespans

### Phase 2: Core Juice
- [ ] Add state machine to lanes.ts for anticipation
- [ ] Implement anticipation tilt timing
- [ ] Enhance death particles (count, size, stagger)
- [ ] Increase death screen shake

### Phase 3: Viral Mechanics
- [ ] Add share button to death screen
- [ ] Implement navigator.share with fallback
- [ ] Add "Copied!" toast notification
- [ ] Parse challenge URL param
- [ ] Show challenge banner on start screen
- [ ] Compare score to challenge on death

### Phase 4: Advanced Features
- [ ] Track lastActionTime and lastActionType
- [ ] Implement clutch detection in collision loop
- [ ] Add clutch effect (text + flash)
- [ ] Add clutch bonus to scoring system
- [ ] Show clutch count on death screen

---

## Success Metrics

| Metric | Current | Target | How to Measure |
|--------|---------|--------|----------------|
| "Prototype" perception | Common complaint | Zero mentions | User feedback |
| Eye strain complaints | #1 issue | Minimal | User feedback |
| Runs per session | ~3 | ~6+ | Analytics (if available) |
| Share actions per death | 0% | 5%+ | Track share button clicks |
| Challenge URL opens | N/A | 10%+ of shares | URL param detection |

---

## Risk Mitigation

1. **Performance degradation**: Test on low-end mobile before shipping
2. **Share API compatibility**: Clipboard fallback always available
3. **Clutch false positives**: Tune 35-55px range based on playtest data
4. **Color readability**: Keep obstacle base colors untouched

---

*Document created from 10-round 5-agent debate consensus*
*Estimated total effort: 12-15 hours*

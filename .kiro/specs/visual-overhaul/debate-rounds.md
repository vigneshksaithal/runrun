# RunRun Visual Overhaul: 5-Agent Debate

## Participants
- **MAYA** - Product Manager (FTUE, engagement hooks, K-factor)
- **JORDAN** - Customer Success (accessibility, user complaints, QoL)
- **CASEY** - Marketing Manager (virality, shareability, brand identity)
- **RILEY** - Game Designer (juice, feel, game design principles)
- **ALEX** - Engineering Lead (performance, maintainability, technical constraints)

---

## ROUND 1: Lane Lines vs Eye Strain

**Topic:** Jordan flagged eye strain from cyan lane lines (80, 220, 200) after extended play. Current config shows `ROAD_LINE_COUNT: 8`. How do we balance visual clarity with comfort?

---

**JORDAN:** I've been tracking user feedback patterns, and the bright cyan lane lines at `rgb(80, 220, 200)` are causing legitimate eye strain complaints. Eight animated lines rushing toward you creates a strobing effect. We need to reduce to **5 lines maximum** and drop the saturation by 25-30%. Users are closing the game after 3-4 runs not because they're frustrated with difficulty—they're getting headaches.

**ALEX:** I actually agree with reducing line count, but for different reasons. Each lane line is a draw call that updates position every frame. Dropping from 8 to **4 lines** saves ~100 calculations per second. However, I'd push back on the saturation change. We already have contrast issues with the dark track colors `TRACK_TOP: [30, 40, 38]`. If we desaturate the cyan too much, we lose the visual "rails" that guide new players.

**RILEY:** Hold on—you're both solving the wrong problem. The issue isn't the color or count, it's the *animation speed*. The current `ROAD_LINE_SPEED_MULT: 100` creates that strobing effect at high speeds. I propose we **cap the line animation speed** separately from gameplay speed. Let the player move at 7.0 speed, but the lane lines never exceed a visual speed equivalent of 4.5. This maintains the sensation of going fast without the retinal assault.

**MAYA:** Riley's onto something, but we need to be careful. The lane lines are our primary speed feedback mechanism. If a player can't *feel* the speed increase, they won't get that adrenaline rush that keeps them playing. Can we compromise? **4 lines**, slight saturation reduction to `rgb(70, 190, 180)`, but keep the speed correlation until `MAX_SPEED * 0.7`—then it plateaus visually while gameplay continues accelerating.

**JORDAN:** I can accept that compromise, but I want to add **spacing variation**. Currently all 8 lines are evenly distributed. If we use 4 lines with slightly irregular spacing, it breaks the strobing pattern that causes eye strain. Think railroad tracks viewed from a moving train—the irregularity is easier on the eyes than metronomic precision.

**ALEX:** Irregular spacing adds complexity to the `lanes.ts` rendering loop, but it's doable. I can implement a `LANE_LINE_OFFSETS: [0, 0.9, 1.8, 2.9]` array instead of calculated even distribution. Minimal performance hit.

**Resolution:**
1. Reduce lane lines from 8 to **4**
2. Adjust color from `rgb(80, 220, 200)` to `rgb(70, 190, 180)` (subtle desaturation)
3. Implement **speed-capped animation** that plateaus at 70% of max gameplay speed
4. Add **irregular spacing** via offset array to break strobing pattern
5. Alex to implement unified in `config.ts` as new `LANE_LINE_CONFIG` object

---

## ROUND 2: Coin/Obstacle Size + Scaling

**Topic:** Multiple agents flagged that game objects are too small. Jordan wants 30-40% scale increase. Alex recommends 1.6-1.8x multipliers. How do we scale without breaking collision clarity?

---

**ALEX:** Looking at the current code, coins are `22x16` pixels with a depth scale range of `0.15 to 1.0`. At spawn point (`LANE_Y_TOP: 220`), coins are barely 4 pixels wide. Even at player level they're only 22px. I'm proposing a **1.6x base multiplier** across all game objects, which would make coins `35x26` and stone walls `96x88`. This stays within our 50-object performance budget.

**JORDAN:** 1.6x isn't enough. I've watched new players squint at the screen. Mobile users especially are missing coins entirely—not because of skill, but because they literally can't see them in time. I'm pushing for **1.8x minimum on coins**, with obstacles staying at 1.6x. Coins should be the most visible objects because they're the reward.

**RILEY:** I disagree with uniform scaling. This is a classic game design trap. Making everything bigger doesn't improve readability—it just makes everything equally cluttered. We need **visual hierarchy through differential scaling**:
- Coins: 1.8x (reward = most visible)
- Obstacles: 1.5x (threat = noticeable but not overwhelming)
- Player: 1.4x (you should always know where YOU are)
- Lane lines: 1.0x (environmental, should recede)

**MAYA:** Riley's hierarchy makes sense from a psychology standpoint. The Hooked Model requires variable rewards to be *salient*. If coins and obstacles are the same visual weight, we lose the dopamine spike from coin collection. But I want to add something: **scaling should increase with combo**. At 3x combo, coins should pulse 10% larger. At 5x, they should be 15% larger with added glow. This reinforces the reward escalation.

**CASEY:** From a marketing perspective, bigger objects = better screenshots = better shares. But I'm concerned about the "Crystal Cavern" brand identity. Right now the aesthetic is "tight, claustrophobic cave running." If we scale everything up 1.8x, it might feel more like "cartoon obstacle course." Can we add **depth-enhanced scaling**? Objects feel bigger when they're close but small and mysterious in the distance. Amplify the scale range from `0.15-1.0` to `0.1-1.2` so objects feel like they're rushing at you.

**ALEX:** Casey's depth enhancement is actually elegant. Instead of changing base sizes (which affects collision boxes), we modify `getDepthScale()` to use a more aggressive curve:
```
return 0.1 + progress * 1.1  // New range: 0.1 to 1.2
```
This gives us the visual "rush" effect without touching hitboxes. Combined with Riley's differential multipliers, we get:
- Far coins: 0.1 * 1.8 = 0.18 scale
- Near coins: 1.2 * 1.8 = 2.16 scale (dramatic!)
- Far obstacles: 0.1 * 1.5 = 0.15 scale
- Near obstacles: 1.2 * 1.5 = 1.8 scale

**RILEY:** I love it, but we need **anticipation scaling**. Objects shouldn't just linearly scale. Add a subtle "pop" at the 70% depth mark where objects scale 5% larger than the linear curve predicts, then settle to normal. This is the anticipation principle—you telegraph "something's coming" before it arrives.

**JORDAN:** One concern: if coins are 2.16x scale at player level, we risk **overlap with adjacent lane objects**. Current `LANE_WIDTH: 100` might not accommodate two 35px coins side by side with a 96px obstacle between them. Can we verify the math?

**ALEX:** Good catch. At maximum scale (2.16x) and base coin width (22px), that's 47.5px per coin. Two coins in adjacent lanes need 95px gap. Lane width is 100px. We're safe with 5px margin. But if we want obstacles in adjacent lanes simultaneously, we'd need to reduce obstacle base width or increase lane width. I vote for **expanding lane width to 110px** which also helps mobile tap targets.

**Resolution:**
1. Implement **differential base multipliers**: Coins 1.8x, Obstacles 1.5x, Player 1.4x
2. Modify `getDepthScale()` for **enhanced depth range**: 0.1 to 1.2
3. Add **anticipation pop** at 70% depth (5% scale spike)
4. Increase `LANE_WIDTH` from 100 to **110px** for safety margin
5. Maya's combo-scaling deferred to "stretch goal" due to complexity

---

## ROUND 3: Death Screen Priority

**Topic:** Three competing visions for death screen: Casey wants viral "freeze-frame spectacular death," Riley wants juicy chromatic aberration + slow-mo, Maya wants share-trigger optimization. Current implementation has basic chunk explosion + score counter.

---

**CASEY:** The death screen is our single biggest viral opportunity. Right now it's functional but forgettable. I want a **"Spectacular Death" freeze-frame** system: capture the exact moment of collision, apply a dramatic filter (vignette, slight desaturation except the obstacle that killed you), and hold for 0.8 seconds before transitioning. This gives users a *screenshot moment* they'll naturally want to share. "Look how close I was!"

**RILEY:** Freeze-frame is interesting but it kills game feel. Death should be **cathartic**, not documentary. I want:
1. **Slow-motion** (0.3x time scale) starting 0.2s before impact when collision is inevitable
2. **Chromatic aberration** splitting RGB channels by 3-5px during slow-mo
3. **Camera trauma**: zoom in 5%, shake, then zoom out to 0.95x as player explodes
4. **Hitstop**: 50ms complete freeze at moment of contact

This creates the "ooooh" moment that freeze-frame tries to manufacture, but it feels *earned*.

**MAYA:** Both approaches miss the core insight: death screens should **trigger sharing behavior**, not just look cool. The psychological trigger isn't the death itself—it's the context. My priority order:
1. If `isNewHigh: true` → BIG celebration, share prompt
2. If near personal best (within 10%) → "So close!" with comparison
3. If current score > friend's score → social proof callout
4. Default → quick restart with minimal friction

The visual treatment should adapt to these triggers, not be uniform.

**JORDAN:** I need to push back on all three of you. We're overcomplicating the death screen when our **basic restart friction is the real problem**. Current code has a 3-second auto-restart timer. Users are tapping frantically after a death and getting no response for 0.45 seconds (the `k.wait` before UI appears). 

My priority:
1. **Instant tap-to-restart** (responsive within 0.1s of death)
2. Score visible immediately, not after animation
3. Fancy effects only if user DOESN'T tap for 1+ seconds

**ALEX:** I can reconcile this technically. Here's my proposal:

**Immediate (0-100ms):**
- Register restart intent (tap sets `pendingRestart = true`)
- Begin Riley's slow-mo + hitstop (visual only, doesn't block input)

**Deferred (100-500ms):**
- If `pendingRestart`, skip to game immediately
- Otherwise, play Casey's freeze-frame moment
- Overlay fades in with Maya's context-aware messaging

**Long hold (500ms+):**
- Full juice sequence plays out
- Share buttons appear for high-score moments

This way impatient players get instant restart, casual players see the cool death, and achievement moments get celebrated.

**CASEY:** I can work with that, but the freeze-frame is non-negotiable for the share moment. Can we guarantee that even in fast-restart mode, we **capture and store** the freeze-frame data? Users might want to share *after* their next run: "Died at 2,847 last run, just beat it!"

**RILEY:** Storing frame data is expensive. How about we store **death metadata** instead: position, obstacle type, proximity to edge, score, combo level. Then we can *reconstruct* a death scene stylistically for the share card without actually freezing the live frame.

**MAYA:** Death metadata also enables **"ghost deaths"** on the track—show where other players died as faint markers. This is proven K-factor boosting in games like Dark Souls. But that's scope creep for this discussion.

**ALEX:** Metadata storage is lightweight—maybe 50 bytes per death. I can add it to the score submission payload:
```typescript
interface DeathPayload {
  score: number
  coins: number
  isNewHigh: boolean
  playerX: number
  playerY: number
  obstacleType: ObstacleType  // NEW
  deathLane: number           // NEW
  comboAtDeath: number        // NEW
  nearMissCount: number       // NEW (for Casey's CLUTCH system)
}
```

**Resolution:**
1. **Three-tier death system** based on player input timing:
   - Instant restart (tap <500ms): minimal animation, capture metadata
   - Normal death (tap 500ms-2s): freeze-frame + context message
   - Achievement death (isNewHigh): full celebration sequence
2. Store **death metadata** for reconstructed share cards
3. Reduce UI appearance delay from 450ms to **200ms**
4. Riley's juice (slow-mo, chromatic aberration) plays *underneath* restart readiness
5. Casey's freeze-frame triggers only for non-rushed deaths

---

## ROUND 4: Performance Budget

**Topic:** Alex set a constraint of 50 active game objects. Riley wants screen shake, particles, chromatic aberration. How much juice is too much?

---

**ALEX:** Let me be crystal clear on constraints. We're targeting:
- 60 FPS on mid-range mobile (2019 phones)
- Canvas 2D rendering (no WebGL)
- Max 50 game objects with `onUpdate()` callbacks
- Tween/animation limit of ~20 concurrent

Current game at peak (high speed, obstacles + coins in all lanes): 8 lane lines + 6 obstacles + 4 coins + 1 player + 10 particles = **29 objects**. We have headroom, but not infinite.

**RILEY:** That 21-object headroom is exactly where juice lives! My priority list:
1. **Screen shake** (0 objects, just camera offset) - FREE
2. **Speed lines** (4-6 objects, pooled) - 6 objects max
3. **Dust particles on lane switch** (3 per switch, pooled) - 3 objects
4. **Coin magnet trail** (0 objects, shader-like draw) - FREE
5. **Chromatic aberration** (post-process, no objects) - FREE*

The asterisk on chromatic aberration: it requires redrawing the frame 3x with offset. That's expensive. I'd limit it to death sequence only.

**MAYA:** I want to protect objects for **UI juice** that Riley hasn't mentioned:
- Combo counter animations (scale, shake)
- Score pop-ups on coin collect
- Milestone celebrations ("1000!", "2000!")
- Near-miss "CLUTCH" text

These are critical for the Hooked Model feedback loops. Can we reserve 8 objects for UI particles?

**ALEX:** UI elements can share the pool. Score pop-ups are already in the code at 1 object per coin collect, lifespan 0.45s. At max coin density that's ~4 concurrent. Milestone text is rare (every 1000 points = ~2 minutes). I'll allocate:
- **Lane lines**: 4 (down from 8)
- **Obstacles**: 6 max
- **Coins**: 6 max
- **Player**: 1
- **Particles (pooled)**: 12 (reusable)
- **UI text/effects**: 6
- **Reserved/headroom**: 15

**Total: 50 objects**, but particles and UI share pools so effective concurrent max is ~35.

**JORDAN:** What about players on older devices? My concern is the 10% of users on 2017-era phones who represent high-retention casual gamers (they play during commutes, in waiting rooms). Can we implement **quality tiers**?
- High: All juice, 60 FPS target
- Medium: Reduced particles, 45 FPS acceptable
- Low: No screen shake, no chromatic, 30 FPS minimum

**CASEY:** Quality tiers hurt brand consistency. A "Low" quality player sees a different game than their friend on "High." When they share screenshots, the mismatch is jarring. I'd prefer we design for the **lowest common denominator** and make it look *intentionally* crisp rather than compromised.

**RILEY:** Casey's right that inconsistency is bad, but Jordan's right that we need fallbacks. Counter-proposal: **graceful degradation**, not tiers. The game auto-detects frame drops and reduces juice in this order:
1. First: Reduce particle count (12 → 6 → 3)
2. Second: Disable dust kicks on lane switch
3. Third: Disable screen shake (replace with vignette pulse)
4. Fourth: Reduce lane lines (4 → 2)
5. Never: Don't reduce object size or collision feedback

This way, every player gets the same *game*, just with environmental effects scaled to their device.

**ALEX:** Graceful degradation is implementable. I'll add a `performanceMonitor` that tracks rolling 30-frame average. If we drop below 50 FPS, trigger degradation level 1. Below 40 FPS, level 2. Etc. Recovery happens after 5 seconds of sustained good performance.

**MAYA:** One concern: degradation shouldn't affect **reward feedback**. The coin collect effect must always play. It's the dopamine trigger. Can we mark certain effects as "protected"?

**ALEX:** Yes. I'll categorize effects as:
- **Protected**: Coin collect burst, score popup, combo indicator, death explosion
- **Degradable**: Dust particles, speed lines, screen shake intensity, ambient particles
- **Cuttable**: Chromatic aberration (death only anyway), extra lane lines

**Resolution:**
1. **Object budget allocation**: 4 lane lines, 6 obstacles, 6 coins, 1 player, 12 particles (pooled), 6 UI, 15 headroom
2. **Graceful degradation** system with 4 levels based on FPS monitoring
3. **Protected effects**: coin burst, score popup, death explosion, combo indicator
4. **Degradable effects**: dust, speed lines, shake intensity
5. **No quality tiers**—single codebase with auto-adaptation
6. Chromatic aberration **death-only** to avoid performance hit during gameplay

---

## ROUND 5: Variety vs Scope

**Topic:** Jordan wants "visual zones" every 1000 points. Casey wants milestone celebrations. Riley wants anticipation/follow-through on player actions. How much variety can we ship vs. defer?

---

**JORDAN:** My core ask is breaking visual monotony. Players see the same crystal cavern for 5, 10, 20 minutes. By 2000 points, it's background noise. I want **visual zones**:
- 0-999: Base crystal cavern (current)
- 1000-1999: Deeper cave (darker, more purple)
- 2000-2999: Lava proximity (warm color shift)
- 3000+: Crystal heart (rainbow accents)

This isn't new gameplay—just palette swaps + maybe accent changes.

**RILEY:** Palette swaps are actually significant work. Every color in the config would need zone variants. That's 30+ colors × 4 zones = 120 color definitions. And the transitions need to feel smooth. I'd rather invest that effort in **moment-to-moment juice** that players feel every second:
- Squash/stretch on player
- Anticipation wind-up on jump
- Follow-through recovery frames
- Impact hitstop on coin collect

These improve the *feel* of 100% of gameplay, not just the look of crossing arbitrary thresholds.

**CASEY:** Both are valid, but for viral potential, **milestones beat constant polish**. Players share moments, not smoothness. My prioritized milestone moments:
1. **First death** (you tried!)
2. **500 points** (getting the hang of it)
3. **Personal best** (your best yet!)
4. **5x combo** (ON FIRE! — Riley's "wow moment")
5. **1000+ score** (veteran status)

Each of these gets a 0.5s celebration with distinct visual flair. This is 5 special moments vs. Jordan's 4 continuous zones.

**MAYA:** I need to reality-check scope here. We're in visual *overhaul*, not visual *rebuild*. What can we ship in one sprint vs. what's future roadmap?

**Sprint-able (2 weeks):**
- Riley's squash/stretch (config values, no new art)
- Casey's milestone popups (text + scale + color)
- 5x combo celebration (particle burst + sound hook)
- Jordan's FIRST zone transition only (base → deeper at 1000)

**Roadmap (future):**
- Full 4-zone system
- Anticipation/follow-through animations (need sprite frames)
- "CLUTCH" near-miss system (needs proximity detection rewrite)

**ALEX:** Maya's scope split is realistic from an engineering standpoint. Here's what I can commit to technically:

**Definitely shipping:**
1. `squashFactor` and `stretchFactor` on player object
2. `MilestoneSystem` with event hooks for score thresholds
3. Single zone transition (palette lerp over 2 seconds at 1000 points)
4. Screen shake framework (intensity parameter, used by combo + death)

**Stretch if time:**
5. 5x combo particle burst
6. Anticipation on jump (0.05s windup)

**Won't ship this sprint:**
- Multiple zones beyond 1000
- Chromatic aberration (performance risk)
- CLUTCH near-miss detection

**JORDAN:** I can accept one zone transition if it's **meaningful**. The 1000-point threshold should feel like entering a new area, not just a color shift. Can we add:
- Brief screen flash (not shake)
- "DEEPER..." text fades in
- Lane line color shifts
- One-time particle burst (crystals shattering from walls)

That's 4 elements that together make it feel like an event.

**RILEY:** I'll add juice to Jordan's zone moment:
- 0.3s slow-motion as you cross 1000
- Camera pushes forward slightly (zoom to 1.02x)
- All current obstacles/coins get brief "pulse" glow
- Then resume at normal speed with new palette

This is the anticipation/payoff principle applied to progression, not just actions.

**CASEY:** If we're only doing one zone, it needs to be **shareable**. Can we capture a screenshot at the zone transition? "I reached the Deep Cave! 1,247 points" with the new palette visible. This is our organic social moment.

**ALEX:** Screenshot capture is possible using `canvas.toDataURL()`, but it's a blocking operation (~50ms). I'd capture on the NEXT frame after transition completes, not during. User won't notice the delay.

**MAYA:** Final scope consensus needed. Here's my proposed **MVP for visual overhaul**:

**P0 (Must ship):**
1. Lane line reduction (8 → 4) + color adjustment
2. Size scaling (coins 1.8x, obstacles 1.5x, player 1.4x)
3. Depth scale enhancement (0.1 → 1.2 range)
4. Death screen three-tier system (fast restart / normal / celebration)
5. Screen shake framework
6. Squash/stretch on player lane change

**P1 (Should ship):**
7. 1000-point zone transition (single)
8. Milestone popups (500, 1000, PB, 5x combo)
9. Coin collect "pop" effect enhancement

**P2 (Stretch):**
10. Jump anticipation windup
11. Near-miss particle burst
12. Zone transition screenshot capture

**RILEY:** I want squash/stretch moved to P0. It's the single highest-impact juice improvement and it's just math—no new assets.

**JORDAN:** And I want to ensure milestone popups (P1 #8) include accessibility considerations: high contrast text, not just gold-on-gold.

**ALEX:** Both accepted. Squash/stretch is trivial—I'll add `squash: number` and `stretch: number` to player state and apply to scale transform. Milestone text will use `TEXT_WHITE` with `TEXT_GOLD` outline for contrast.

**Resolution:**
1. **P0 scope confirmed**: Lane lines, scaling, depth, death screen, shake, squash/stretch
2. **P1 scope confirmed**: Zone transition at 1000, milestone popups with accessibility
3. **P2/Deferred**: Additional zones, CLUTCH system, chromatic aberration
4. **Zone transition specification**: slow-mo + zoom + "DEEPER..." text + palette lerp + particle burst + screenshot capture (P2)
5. **5x combo** gets dedicated celebration (particle burst, scale pulse on counter)
6. Jordan's "not prototype" test: if after overhaul a new user calls it prototype, we reassess

---

## Final Consensus Summary

### Unanimously Agreed:
- Reduce lane lines from 8 to 4
- Differential scaling (coins > obstacles > player)
- Three-tier death screen with instant-restart option
- Graceful degradation over quality tiers
- Protect reward feedback (coin effects are sacred)
- One zone transition at 1000 points for MVP

### Agreed with Compromise:
- Lane line color adjustment (subtle, not dramatic)
- Size increases via depth scale curve, not base dimensions
- Death metadata storage instead of frame capture
- Single sprint scope with clear P0/P1/P2 priorities

### Tabled for Future:
- Full 4-zone visual system
- CLUTCH near-miss mechanics
- Chromatic aberration effects
- Ghost death markers (social)
- Deep anticipation/follow-through animation

### Open Questions for Implementation:
1. Exact easing curves for squash/stretch
2. Zone transition palette values (needs art direction)
3. Screenshot capture UX (automatic vs. manual share)
4. Performance monitoring thresholds (exact FPS values)

---

*Debate concluded. Implementation spec to follow.*

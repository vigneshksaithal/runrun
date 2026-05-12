---
name: engagement-loops
description: Design habit-forming game loops using the Hooked Model (Trigger → Action → Variable Reward → Investment). Covers core/meta/social loops, session design, onboarding, and feed-first UX. Read FIRST before building any new game feature, mechanic, or screen.
---

# Engagement Loop Design

> This is the foundational engagement skill. Read this BEFORE any other engagement skill. Every feature you build must serve at least one loop described here.

## The Hooked Model — Applied to Reddit Games

Every feature must complete at least one cycle of: **Trigger → Action → Variable Reward → Investment**

```
┌─────────────────────────────────────────┐
│              TRIGGER                     │
│  (Reddit feed, notification, streak)    │
└──────────────────┬──────────────────────┘
                   ▼
┌─────────────────────────────────────────┐
│              ACTION                      │
│  (Tap to play, one-touch mechanic)      │
└──────────────────┬──────────────────────┘
                   ▼
┌─────────────────────────────────────────┐
│         VARIABLE REWARD                  │
│  (Score, loot, rank change, surprise)   │
└──────────────────┬──────────────────────┘
                   ▼
┌─────────────────────────────────────────┐
│           INVESTMENT                     │
│  (Share score, build streak, customize) │
└──────────────────┬──────────────────────┘
                   │
                   └──────► Back to TRIGGER
```

### 1. Triggers — What brings the player in?

| Trigger type | Reddit/Devvit mechanism | When to use |
|---|---|---|
| **External — Feed** | Daily post appears in subscribed feed | Daily content, new challenges |
| **External — Notification** | Push notification (beta) | Streak about to break, challenge received |
| **External — Social** | Friend's score comment, flair visible | Competition, social proof |
| **Internal — FOMO** | "Today's challenge expires in 3h" | Limited-time events |
| **Internal — Curiosity** | "Can I beat yesterday's score?" | Progression, personal bests |
| **Internal — Boredom** | Quick, snackable game in feed | Idle moments, feed scrolling |

**Implementation rule**: Every feature must have at least one external trigger that brings players back without them thinking about it.

### 2. Action — What does the player do?

The action must be **dead simple**. Reduce friction to near-zero.

| Principle | Implementation |
|---|---|
| **Zero-tap start** | Game loads playable in the feed (inline mode) |
| **One-touch mechanic** | Core gameplay uses tap/swipe, no complex controls |
| **No login wall** | `context.userId` is automatic — never ask users to "sign in" |
| **Instant feedback** | Every tap produces visible, satisfying response within 100ms |
| **Session < 2 min** | Core loop completes in under 2 minutes |

### 3. Variable Reward — What surprise keeps them engaged?

Rewards MUST be variable. Predictable rewards lose power. Use at least two of these three reward types:

| Reward type | What it satisfies | Reddit game examples |
|---|---|---|
| **Tribe** (social) | Belonging, status | Leaderboard rank, flair upgrade, "Player of the Week" |
| **Hunt** (resource) | Achievement, collection | Loot drops, daily bonus, streak rewards, unlockables |
| **Self** (mastery) | Competence, growth | New personal best, harder difficulty unlocked, skill rating |

**Variable reward patterns:**

```typescript
// Near-miss design — show what they ALMOST got
// "You were 2 points away from Gold rank!"
// "One more correct answer would have been a new record!"

// Random loot table — never give the same reward twice in a row
const LOOT_TABLE = [
  { item: 'common_badge', weight: 60 },
  { item: 'rare_badge', weight: 25 },
  { item: 'epic_badge', weight: 10 },
  { item: 'legendary_badge', weight: 5 },
] as const
```

### 4. Investment — What makes them come back?

Investment = stored value that makes leaving costly. The more a player invests, the harder it is to quit.

| Investment type | Devvit implementation | Retention effect |
|---|---|---|
| **Streak** | Redis counter, daily check-in | Loss aversion — "Don't break my 30-day streak" |
| **Profile/Flair** | Reddit flair auto-updated | Identity — "I'm a Diamond player" |
| **Content creation** | UGC posts submitted as user | Ownership — "My puzzle got 200 plays" |
| **Social connections** | Challenge friends, community | Obligation — "My community needs me" |
| **Progression** | XP, level, unlocked content | Sunk cost — "I've earned too much to stop" |

---

## Three-Loop Architecture

Design every game with three nested loops:

### Core Loop (seconds — the moment-to-moment gameplay)
```
Play → Score → Feedback → Play Again
```
- Completes in 10-120 seconds
- Must feel satisfying even on first play
- Example: Tap to guess → see result → try again

### Meta Loop (days — the progression wrapper)
```
Complete daily challenge → Earn XP → Level up → Unlock new content → New daily challenge
```
- Spans days to weeks
- Gives meaning to repeated core loops
- Example: Daily puzzle → streak counter → league promotion

### Social Loop (ongoing — the community flywheel)
```
Play → Share result → Friend sees → Friend plays → Competes → Shares
```
- Spans the entire player community
- Each player's action recruits/retains others
- Example: Score comment → friend sees in feed → clicks to play → posts their score

---

## Session Design — "One More Round"

### The Zeigarnik Effect
Players remember incomplete tasks more than completed ones. Always leave something unfinished:
- "You're 50 XP from leveling up"
- "3 more wins for weekly mission"
- "Your friend just beat your score"

### Optimal session structure
```
1. Quick win (first 30 seconds — guaranteed positive outcome)
2. Escalating challenge (next 60 seconds — difficulty ramps)
3. Near-miss moment (player almost achieves something big)
4. Cliffhanger (session ends with unfinished business)
5. Investment prompt (share score, check streak, see what's next)
```

### Anti-patterns — NEVER do these
- ❌ Force players to wait (timers that block gameplay)
- ❌ Punish failure harshly (losing all progress)
- ❌ Gate core gameplay behind social actions (Reddit policy violation)
- ❌ Show ads or interruptions mid-gameplay
- ❌ Require reading instructions before playing

---

## Onboarding — The First 30 Seconds

### The 3-Second Rule

When a player sees your game in their feed, they make a snap decision:
1. **Second 1**: "What is this?" — Visual must be immediately clear
2. **Second 2**: "Is this for me?" — Must look fun/interesting
3. **Second 3**: "What do I do?" — Action must be obvious

If any of these fail, they scroll past.

### Feed Preview Design (Inline Mode)

The inline post preview is your storefront. It must sell the game without the player clicking anything.

| ✅ Show in inline mode | ❌ Never show in inline mode |
|---|---|
| The game board/state (visual) | Loading spinner |
| A single "Play" button | Login prompt |
| Today's challenge number | Instructions or rules |
| Player count ("1,247 playing") | Empty state |
| Visual preview of gameplay | Settings or menus |

### Inline preview component pattern

```svelte
<script lang="ts">
  import { requestExpandedMode, getWebViewMode } from '@devvit/web/client'

  let mode = $state(getWebViewMode())

  const handlePlay = async (event: MouseEvent): Promise<void> => {
    try {
      await requestExpandedMode(event, 'default')
    } catch (e) {
      console.error('Failed to expand:', e)
    }
  }
</script>

{#if mode === 'inline'}
  <div class="h-full w-full overflow-hidden flex flex-col items-center justify-center bg-gray-900">
    <!-- Visual preview of the game -->
    <div class="mb-4"><!-- Game preview graphic --></div>
    <button onclick={handlePlay} class="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl text-lg">
      ▶ Play Now
    </button>
    <p class="mt-3 text-sm text-gray-400">{playerCount.toLocaleString()} playing today</p>
  </div>
{:else}
  <GameView />
{/if}
```

### Zero-Instruction Design

The best games teach through play, not text.

| Principle | How to implement |
|---|---|
| **Show, don't tell** | Animate the first move as a demo |
| **Constrain choices** | First interaction has only 1-2 options |
| **Immediate feedback** | Every tap produces visible response |
| **Fail safely** | First attempt can't result in game over |
| **Progressive disclosure** | Reveal complexity gradually over sessions |

### First Win Design (Non-Negotiable)

The first session MUST end with a positive outcome:
- First challenge is trivially solvable
- "First Game!" achievement unlocks immediately
- "Day 1 streak started! 🔥" message
- Player immediately appears on leaderboard
- "+25 XP — Welcome!" reward

```typescript
const FIRST_SESSION_REWARDS = [
  { trigger: 'game_started', message: '🎮 Welcome! +10 XP', xp: 10 },
  { trigger: 'first_action', message: '👆 Nice move! +5 XP', xp: 5 },
  { trigger: 'game_completed', message: '🎉 First game complete! +25 XP', xp: 25 },
  { trigger: 'streak_started', message: '🔥 Day 1 streak started!', xp: 10 },
] as const
```

### Return Visit Segmentation

| Segment | Behavior |
|---|---|
| **New player** (0 games) | Guided first game, easy difficulty, reward cascade |
| **Returning player** (1+ games, <7 days gap) | "Welcome back! 🔥 Day N streak", today's challenge, missions |
| **Lapsed player** (7+ days gap) | "We missed you!", easy re-entry, "Start a new streak", bonus XP |

```typescript
const getPlayerSegment = async (userId: string): Promise<'new' | 'returning' | 'lapsed'> => {
  const totalGames = await redis.hGet(`user:${userId}:profile`, 'totalGamesPlayed')
  if (totalGames === undefined || totalGames === '0') return 'new'

  const lastPlayed = await redis.hGet(`user:${userId}:profile`, 'lastPlayedAt')
  if (lastPlayed) {
    const daysSince = Math.floor((Date.now() - new Date(lastPlayed).getTime()) / 86400000)
    if (daysSince >= 7) return 'lapsed'
  }
  return 'returning'
}
```

---

## Engagement Audit Questions

Before shipping ANY feature, answer these:

1. **Trigger**: What brings the player to this feature? Is there an external trigger?
2. **Action**: Can a player engage in under 3 seconds? Is friction minimized?
3. **Variable Reward**: Is the outcome unpredictable enough to maintain curiosity?
4. **Investment**: Does this feature increase the player's stored value?
5. **Loop closure**: Does this feature connect back to a trigger for the next session?
6. **Social amplification**: Can this feature generate content visible to non-players?

## Checklist before finishing
- [ ] Feature serves at least one engagement loop (Trigger → Action → Reward → Investment)
- [ ] Core loop completes in under 2 minutes
- [ ] At least one external trigger exists (feed post, notification, social)
- [ ] Rewards are variable, not predictable
- [ ] Player investment increases with each session
- [ ] "One more round" pull exists (Zeigarnik effect)
- [ ] No gameplay gated behind social actions (Reddit policy)
- [ ] Near-miss moments designed into the experience
- [ ] Session ends with unfinished business (cliffhanger)
- [ ] Inline preview shows game visual + CTA (no loading/instructions)
- [ ] Game playable within 3 seconds of first tap
- [ ] First session guarantees a positive outcome
- [ ] Feature connects to at least one other loop (meta or social)

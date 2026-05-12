---
name: viral-mechanics
description: Design features that spread organically through Reddit. Covers UGC content flywheels, score sharing, challenge systems, and feed-first design. Read when building any social, sharing, or community feature.
---

# Viral Mechanics

> Every feature should ask: "Does this create content that non-players will see?" If not, find a way to make it visible.

## The Viral Equation

```
Virality = Visibility × Shareability × Convertibility
```

- **Visibility**: How many non-players see game content? (feed posts, comments, flair)
- **Shareability**: How easy is it to share? (one-tap, auto-generated, looks good)
- **Convertibility**: How likely is a viewer to become a player? (curiosity gap, low friction)

---

## Reddit-Native Viral Channels

Reddit is uniquely powerful for organic virality because game content lives IN the social feed, not behind an app store link.

| Channel | Mechanism | Viral power |
|---|---|---|
| **Subreddit feed** | Daily posts appear for subscribers | High — zero-click discovery |
| **Home feed** | Subscribed subreddit content surfaces | High — passive exposure |
| **Comments** | Score sharing, reactions, discussions | Medium — social proof |
| **User flair** | Visible across ALL of Reddit | Medium — curiosity trigger |
| **Cross-posts** | Content shared to other subreddits | High — new audience |
| **r/all / r/popular** | High-engagement posts surface | Very high — massive reach |
| **UGC posts** | Player-created content as new posts | Very high — content flywheel |

---

## Content Flywheel Design

The most viral Devvit games create a self-sustaining content cycle where player actions generate new content that attracts new players.

```
Player plays game
       ↓
Player creates content (score, challenge, creation)
       ↓
Content becomes a Reddit post (visible in feed)
       ↓
Non-player sees post, gets curious
       ↓
Non-player clicks to play
       ↓
New player creates content...
```

### Flywheel patterns

**Pattern A: Player-Created Challenges**
```
Player completes level → "Create a challenge for others" →
Challenge becomes new post → Others attempt it →
Best attempts get upvoted → Creator gets credit
```

**Pattern B: Score Sharing as Content**
```
Player finishes game → "Share your result" →
Emoji/visual result posted as comment →
Others see it, want to compete →
Click through to play
```

**Pattern C: UGC Creation**
```
Player creates something (drawing, puzzle, level) →
Creation submitted as new post (runAs: 'USER') →
Community votes/plays/rates →
Best creations featured
```

### UGC Implementation (Devvit-specific)

```typescript
// Server: Submit player-created content as a new post
import { reddit, context } from '@devvit/web/server'
import type { JsonObject } from '@devvit/web/shared'

const submitPlayerChallenge = async (challengeData: JsonObject): Promise<string> => {
  const post = await reddit.submitCustomPost({
    runAs: 'USER',
    userGeneratedContent: {
      text: `Challenge created by a player`, // Required for safety review
    },
    subredditName: context.subredditName!,
    title: `Can you beat this? 🎯`,
    entry: 'default',
    postData: challengeData,
  })
  return post.id
}
```

**Requirements for UGC posts:**
- `runAs: 'USER'` — post attributed to the player
- `userGeneratedContent.text` — required for Reddit safety review
- `permissions.reddit.asUser` in devvit.json — includes `SUBMIT_POST`
- Explicit user consent before posting (button, not automatic)
- Content moderation system for quality control

---

## Score Sharing Patterns

### The Wordle Effect
Wordle's emoji grid was genius because it was:
1. **Spoiler-free** — shows effort, not the answer
2. **Visually distinctive** — stands out in text
3. **Comparable** — others can see how they stack up
4. **Copy-pasteable** — works everywhere

Design your share format to be:
- Visual (emojis, symbols, ASCII art)
- Compact (fits in a comment)
- Intriguing to non-players
- Comparable between players

```typescript
// Example: Generate a shareable result string
const generateShareText = (score: number, maxScore: number, attempts: number): string => {
  const percentage = Math.round((score / maxScore) * 100)
  const stars = '⭐'.repeat(Math.min(Math.floor(percentage / 20), 5))
  const empty = '☆'.repeat(5 - Math.min(Math.floor(percentage / 20), 5))
  return `🎮 Daily Challenge #${getDayNumber()}\n${stars}${empty} ${score}/${maxScore}\nAttempts: ${attempts}\n\nPlay now ▶️`
}
```

### Comment sharing (Reddit-compliant)

```typescript
// Score comments MUST:
// 1. Be triggered by explicit user action (button click)
// 2. Be submitted as the user (runAs: 'USER')
// 3. Reply to a stickied comment (not top-level, unless custom message added)
// 4. Not be required for gameplay progression

const shareScore = async (postId: string, scoreText: string): Promise<void> => {
  // Find the stickied score thread comment
  const stickyCommentId = await redis.get(`post:${postId}:scoreThread`)
  if (!stickyCommentId) return

  await reddit.submitComment({
    postId,
    parentId: stickyCommentId, // Reply to sticky, not top-level
    text: scoreText,
    runAs: 'USER',
  })
}
```

---

## Challenge System Design

Challenges are the highest-virality mechanic because they create social obligation.

### Direct challenges
```
Player A completes game → "Challenge a friend" →
New post created: "u/PlayerA challenges you! Can you beat 850?" →
Anyone can attempt → Results compared →
Winner gets bragging rights + flair
```

### Community challenges
```
Daily challenge posted automatically (scheduler) →
All players compete on same puzzle →
Leaderboard updates in realtime →
Top players highlighted in comments →
Next day: new challenge, fresh leaderboard
```

### Challenge Redis schema
```typescript
// challenge:{challengeId}
{
  creatorId: 't2_abc',
  creatorScore: '850',
  postId: 't3_xyz',
  createdAt: '2025-01-15T10:00:00Z',
  expiresAt: '2025-01-16T10:00:00Z',
  type: 'beat-my-score', // or 'daily', 'weekly', 'custom'
}

// challenge:{challengeId}:attempts — sorted set
// member: userId, score: playerScore
```

---

## Feed-First Design

Your game competes with every other post in the Reddit feed. The inline preview must win attention in < 1 second.

### Inline post optimization
| Element | Guideline |
|---|---|
| **Post title** | Action-oriented, creates curiosity gap: "Can you solve today's puzzle? 🧩" |
| **Inline preview** | Show the game state, not a loading screen |
| **Visual contrast** | Bold colors, clear focal point, stands out from text posts |
| **Call to action** | Single, obvious "Play" or "Try it" button |
| **Social proof** | "1,247 players today" or "u/TopPlayer scored 950" |

### Post title formulas that drive clicks
```
"Daily Challenge #{number} — {difficulty} 🎯"
"Can you beat {score}? 🏆"
"{number} players attempted today's puzzle. Only {percent}% solved it."
"New: {feature_name} is live! 🎮"
"u/{username} just set a new record: {score} 🔥"
```

---

## Subscribe & Re-engagement

### Subscribe prompt (non-gating, post-achievement)
```svelte
<!-- Show AFTER a positive moment, never before or during gameplay -->
{#if showSubscribePrompt && !hasSubscribed}
  <div class="mt-4 text-center">
    <p class="text-sm text-gray-400">Want daily challenges in your feed?</p>
    <button onclick={handleSubscribe} class="mt-2 px-4 py-2 bg-blue-600 rounded-lg">
      Join r/{subredditName}
    </button>
    <button onclick={dismissSubscribe} class="mt-2 ml-2 text-sm text-gray-500">
      Maybe later
    </button>
  </div>
{/if}
```

**Rules (Reddit policy):**
- ❌ Never gate gameplay behind subscribing
- ❌ Never auto-subscribe
- ❌ Never merge subscribe with gameplay actions
- ✅ Show after a positive moment (win, achievement, new high score)
- ✅ Make it clearly optional with a dismiss option
- ✅ Explain the benefit ("daily challenges in your feed")

---

## Viral Metrics to Track

```typescript
// Redis keys for viral tracking
// viral:daily:{date}:shares — count of score shares
// viral:daily:{date}:challenges — count of challenges created
// viral:daily:{date}:ugc — count of UGC posts
// viral:daily:{date}:newPlayers — count of first-time players
// viral:daily:{date}:fromFeed — count of players from feed (vs direct)
```

## Checklist before finishing
- [ ] Feature creates content visible to non-players (feed, comments, flair)
- [ ] Share action is one-tap with auto-generated visual content
- [ ] Share format is spoiler-free, compact, and intriguing
- [ ] UGC posts use `runAs: 'USER'` with `userGeneratedContent`
- [ ] Score sharing replies to stickied comment (not top-level)
- [ ] All social actions are explicit, manual, and clearly labeled
- [ ] No gameplay gated behind social actions
- [ ] Subscribe prompt shown after positive moments only
- [ ] Post titles create curiosity gap
- [ ] Inline preview is visually compelling in feed
- [ ] Challenge system creates social obligation loop
- [ ] Content flywheel is self-sustaining (players create content that attracts players)

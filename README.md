# MineRun

A Minecraft-themed Subway Surfers-style endless runner game built for the Reddit/Devvit platform using KaplayJS.

## What it does

MineRun is a 3-lane endless runner where you control a blocky Steve-like character running through a mine tunnel. Dodge obstacles by switching lanes, jumping over stone walls, and sliding under cobwebs. Collect gold ingots to boost your score.

Everything is rendered with geometric shapes (rectangles and squares) — no external assets — creating a distinctive Minecraft meets Subway Surfers visual style with pseudo-3D perspective.

## How to play

1. A moderator creates a MineRun post via the subreddit menu
2. Tap/click the post to start playing
3. Controls:
   - **Mobile**: Swipe left/right (lanes), swipe up (jump), swipe down (slide)
   - **Desktop**: Arrow keys or WASD

## Features

- 3-lane pseudo-3D endless runner with vanishing point perspective
- Minecraft-themed visual design using only colored rectangles
- 3 obstacle types: Stone Wall (jump), Cobweb (slide), TNT (switch lanes)
- Gold ingot collectibles with particle effects
- Progressive difficulty (speed increases over time)
- Near-miss detection with bonus points
- Screen shake, speed lines, and particle effects for visual juice
- Score sharing via clipboard
- Server-side leaderboard via Redis
- Touch + keyboard controls

## Architecture

```
src/
├── client/
│   ├── index.html           # Canvas entry point
│   ├── main.ts              # KaplayJS initialization
│   └── game/
│       ├── config.ts        # Game constants & colors
│       ├── scenes/
│       │   ├── start.ts     # Start screen
│       │   ├── game.ts      # Main gameplay
│       │   └── death.ts     # Game over screen
│       ├── objects/
│       │   ├── player.ts    # Player character
│       │   ├── obstacle.ts  # Obstacle factory
│       │   └── collectible.ts # Gold ingots
│       └── systems/
│           ├── input.ts     # Touch + keyboard
│           ├── lanes.ts     # Lane management
│           ├── scoring.ts   # Score tracking
│           └── spawner.ts   # Obstacle/collectible spawning
├── server/
│   ├── index.ts             # Hono API routes
│   └── post.ts              # Post creation
└── shared/
    └── tsconfig.json
```

## Development

```bash
bun install
bun run build      # Production build
bun run test       # Run tests
bun run dev        # Dev server + playtest
```

## Tech Stack

- **Game Engine**: KaplayJS (2D game library)
- **Platform**: Reddit Devvit (custom post webview)
- **Server**: Hono.js
- **Build**: Vite
- **Storage**: Redis (via Devvit)

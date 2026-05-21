# BlockDash

**Minecraft × Subway Surfers** — An endless runner game built with KaplayJS using pure geometric shapes.

![BlockDash](https://img.shields.io/badge/Built%20With-KaplayJS-green)

## Play

```bash
bun install
bun run dev
```

Then open `http://localhost:5173` in your browser.

## Controls

| Action | Keyboard | Mobile |
|--------|----------|--------|
| Move Left | `A` / `←` | Swipe Left |
| Move Right | `D` / `→` | Swipe Right |
| Jump | `W` / `↑` / `Space` | Swipe Up |
| Slide | `S` / `↓` | Swipe Down |

## Features

- **3-lane endless runner** with increasing difficulty
- **Minecraft visual style** — everything is rectangles, no curves, blocky characters
- **3 progressive zones**: Stone Mines → Nether Path → Creeper Forest
- **Smart difficulty**: Speed caps at 125%, challenge comes from pattern complexity
- **Scoring system**: Distance + Gems + Near-miss bonuses + Combo multipliers
- **Power-ups**: Shield (absorb 1 hit) & Magnet (auto-collect gems)
- **5 unlockable skins** earned through cumulative play distance
- **Particle effects**: Explosions, landing dust, collection sparkles
- **Screen shake & flash effects** for impactful game feel
- **Touch & keyboard support**
- **LocalStorage persistence** for high scores and unlocks

## Architecture

Built entirely with KaplayJS geometric primitives — no sprites, no images, no external assets.

```
src/
├── main.js        # Game scenes (menu, game, gameover, skins)
├── constants.js   # Colors, zones, skins, game tuning values
├── state.js       # Game state management & persistence
└── utils.js       # Helper functions (lerp, lane positions, RNG)
```

## Tech Stack

- **KaplayJS** — Game engine (installed via npm/bun)
- **Vite** — Build tool & dev server
- **Pure JavaScript** — No framework dependencies

## Design Philosophy

Designed through a 10-round multi-agent debate between 5 personas (Product Manager, Engineering Lead, Customer Success, Marketing Manager, Game Designer). Key decisions:

- Speed caps at 125% — difficulty comes from obstacle patterns, not twitch reflexes
- 3-frame lane changes for instant-feel controls  
- "No curves" rule — everything is `rect()` for that authentic block aesthetic
- Near-miss bonus system rewards risky play
- Progressive zone system with distinct color palettes

import type { KAPLAYCtx } from 'kaplay'
import { GAME_CONFIG } from '../config'
import { createInputSystem } from '../systems/input'
import { createLaneSystem } from '../systems/lanes'
import { createScoringSystem } from '../systems/scoring'
import { createSpawnerSystem } from '../systems/spawner'
import { createPlayer, createDeathParticles } from '../objects/player'
import { createObstacle, updateObstacle, createObstacleDestroyParticles, type Obstacle } from '../objects/obstacle'
import { createCollectible, updateCollectible, createCollectParticles, type Collectible } from '../objects/collectible'

const { COLORS } = GAME_CONFIG

export function createGameScene(k: KAPLAYCtx) {
  k.scene('game', () => {
    const W = GAME_CONFIG.WIDTH
    const H = GAME_CONFIG.HEIGHT

    // Systems
    const input = createInputSystem(k)
    const lanes = createLaneSystem()
    const scoring = createScoringSystem()
    const spawner = createSpawnerSystem()

    // Game state
    let gameSpeed = GAME_CONFIG.INITIAL_SPEED
    let gameTime = 0
    let alive = true
    const obstacles: Obstacle[] = []
    const collectibles: Collectible[] = []

    // Draw bright track background
    drawTrackBackground(k)

    // Create animated road markings
    const roadLines = createAnimatedRoadLines(k)

    // Ambient sparkle particles (white, floating)
    interface SparkleObj { pos: { x: number; y: number }; opacity: number; destroy(): void }
    const sparkles: Array<{ obj: SparkleObj; vx: number; vy: number }> = []
    for (let i = 0; i < 12; i++) {
      const obj = k.add([
        k.rect(k.rand(2, 4), k.rand(2, 4)),
        k.pos(k.rand(40, W - 40), k.rand(220, H - 100)),
        k.color(255, 255, 255),
        k.opacity(k.rand(0.1, 0.3)),
        k.anchor('center'),
        k.z(95),
      ]) as unknown as SparkleObj
      sparkles.push({ obj, vx: k.rand(-5, 5), vy: k.rand(-8, -2) })
    }

    // Create player
    const player = createPlayer(k, lanes.getCurrentX())

    // HUD - Score (top center, large)
    const scoreText = k.add([
      k.text('0', { size: 36 }),
      k.pos(W / 2, 35),
      k.anchor('center'),
      k.color(...COLORS.TEXT_WHITE),
      k.scale(1),
      k.z(200),
      k.fixed(),
    ])

    // Coin count (top left with icon)
    const coinIcon = k.add([
      k.rect(16, 16, { radius: 8 }),
      k.pos(30, 35),
      k.anchor('center'),
      k.color(...COLORS.COIN),
      k.z(200),
      k.fixed(),
    ])
    void coinIcon

    const coinCountText = k.add([
      k.text('0', { size: 20 }),
      k.pos(52, 35),
      k.anchor('left'),
      k.color(...COLORS.TEXT_GOLD),
      k.z(200),
      k.fixed(),
    ])

    // Multiplier text (only visible when > 1x)
    const multiplierText = k.add([
      k.text('', { size: 22 }),
      k.pos(W / 2, 70),
      k.anchor('center'),
      k.color(...COLORS.COMBO_TEXT),
      k.opacity(0),
      k.z(200),
      k.fixed(),
    ])

    // Main game loop
    k.onUpdate(() => {
      if (!alive) return

      const dt = k.dt()
      gameTime += dt

      // Increase speed over time
      gameSpeed = Math.min(
        GAME_CONFIG.MAX_SPEED,
        GAME_CONFIG.INITIAL_SPEED + gameTime * GAME_CONFIG.SPEED_INCREASE_RATE
      )

      // Process input
      const action = input.consume()
      if (action === 'left') {
        lanes.moveLeft()
      } else if (action === 'right') {
        lanes.moveRight()
      } else if (action === 'jump') {
        player.jump()
      } else if (action === 'slide') {
        player.slide()
      }

      // Update lane position
      lanes.update()
      player.setX(lanes.getCurrentX())

      // Update animated road lines
      updateRoadLines(roadLines, gameSpeed, dt)

      // Update scoring
      scoring.update(dt, gameSpeed)
      const state = scoring.getState()
      scoreText.text = Math.floor(state.score).toString()
      coinCountText.text = state.coinsCollected.toString()

      // Multiplier HUD
      if (state.multiplier > 1) {
        multiplierText.text = `${state.multiplier}x`
        multiplierText.opacity = 0.9
      } else {
        multiplierText.opacity = 0
      }

      // Score milestone pop
      if (state.score > 0 && Math.floor(state.score) % 100 === 0 && Math.floor(state.score - gameSpeed * dt * GAME_CONFIG.SCORE_PER_SECOND) % 100 !== 0) {
        scoreText.scaleTo(1.5)
        k.tween(1.5, 1, 0.3, (v: number) => scoreText.scaleTo(v), k.easings.easeOutBack)
      }

      // Spawn items
      const spawnEvents = spawner.update(dt, gameSpeed, state.score)
      for (const event of spawnEvents) {
        if (event.type === 'coin') {
          collectibles.push(createCollectible(k, event.lane))
        } else {
          obstacles.push(createObstacle(k, event.type, event.lane))
        }
      }

      // Update obstacles
      for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i]
        if (!obs) continue

        const pastScreen = updateObstacle(k, obs, gameSpeed, dt)

        if (pastScreen) {
          obs.obj.destroy()
          obstacles.splice(i, 1)
          continue
        }

        // Collision detection
        if (!obs.passed && obs.y > GAME_CONFIG.PLAYER_Y - 45 && obs.y < GAME_CONFIG.PLAYER_Y + 15) {
          if (obs.lane === lanes.getCurrentLane()) {
            const canDodge = checkDodge(obs.type, player.state.current)

            if (!canDodge) {
              die()
              return
            }
          }
          obs.passed = true
        }
      }

      // Update collectibles
      for (let i = collectibles.length - 1; i >= 0; i--) {
        const col = collectibles[i]
        if (!col) continue

        const pastScreen = updateCollectible(k, col, gameSpeed, dt)

        if (pastScreen) {
          col.obj.destroy()
          collectibles.splice(i, 1)
          continue
        }

        // Collection detection
        if (!col.collected && col.y > GAME_CONFIG.PLAYER_Y - 40 && col.y < GAME_CONFIG.PLAYER_Y + 15) {
          if (col.lane === lanes.getCurrentLane()) {
            col.collected = true
            scoring.addCoin()
            createCollectParticles(k, col.obj.pos.x, col.obj.pos.y)
            col.obj.destroy()
            collectibles.splice(i, 1)
          }
        }
      }

      // Update ambient sparkles
      for (const sparkle of sparkles) {
        sparkle.obj.pos.x += sparkle.vx * dt
        sparkle.obj.pos.y += sparkle.vy * dt
        if (sparkle.obj.pos.y < 200) {
          sparkle.obj.pos.y = H - 100
          sparkle.obj.pos.x = k.rand(40, W - 40)
        }
        if (sparkle.obj.pos.x < 20 || sparkle.obj.pos.x > W - 20) {
          sparkle.vx = -sparkle.vx
        }
        sparkle.obj.opacity = 0.1 + Math.sin(k.time() * 2.5 + sparkle.obj.pos.x * 0.01) * 0.15
      }

      // Speed lines at high speed
      if (gameSpeed > 7) {
        if (Math.random() < 0.3) {
          spawnSpeedLine(k, W, H)
        }
      }
    })

    function checkDodge(obstacleType: string, playerState: string): boolean {
      if (obstacleType === 'barrier' && playerState === 'jumping') return true
      if (obstacleType === 'low_beam' && playerState === 'sliding') return true
      return false
    }

    function die() {
      alive = false

      // Screen shake
      k.shake(12)

      // Death particles
      createDeathParticles(k, player.obj.pos.x, player.obj.pos.y)

      // Hide player
      player.obj.hidden = true

      // Flash screen red briefly (0.3s)
      const flash = k.add([
        k.rect(W, H),
        k.pos(0, 0),
        k.color(255, 30, 30),
        k.opacity(0.4),
        k.z(300),
        k.fixed(),
      ])
      k.tween(0.4, 0, 0.3, (v: number) => { flash.opacity = v })

      // Check high score
      const finalScore = scoring.getFinalScore()
      const isHighScore = scoring.checkHighScore()
      const finalState = scoring.getState()

      // Submit score (non-blocking)
      submitScore(finalScore)

      // Show score overlay after brief flash
      k.wait(0.3, () => {
        // Dark overlay
        const overlay = k.add([
          k.rect(W, H),
          k.pos(0, 0),
          k.color(0, 0, 0),
          k.opacity(0.6),
          k.z(310),
          k.fixed(),
        ])
        void overlay

        // Big score number
        const bigScore = k.add([
          k.text(finalScore.toString(), { size: 72 }),
          k.pos(W / 2, H / 2 - 60),
          k.anchor('center'),
          k.color(...COLORS.TEXT_WHITE),
          k.scale(0),
          k.z(320),
          k.fixed(),
        ])
        k.tween(0, 1, 0.3, (v: number) => bigScore.scaleTo(v), k.easings.easeOutBack)

        // "points" label
        k.add([
          k.text('points', { size: 20 }),
          k.pos(W / 2, H / 2 - 10),
          k.anchor('center'),
          k.color(200, 200, 200),
          k.z(320),
          k.fixed(),
        ])

        // Coins collected
        k.add([
          k.text(`Coins: ${finalState.coinsCollected}`, { size: 18 }),
          k.pos(W / 2, H / 2 + 25),
          k.anchor('center'),
          k.color(...COLORS.TEXT_GOLD),
          k.z(320),
          k.fixed(),
        ])

        // New high score badge
        if (isHighScore) {
          k.add([
            k.text('NEW BEST!', { size: 22 }),
            k.pos(W / 2, H / 2 + 60),
            k.anchor('center'),
            k.color(255, 220, 50),
            k.z(320),
            k.fixed(),
          ])
        }

        // "TAP TO RESTART" text
        const tapText = k.add([
          k.text('TAP TO RESTART', { size: 20 }),
          k.pos(W / 2, H / 2 + 110),
          k.anchor('center'),
          k.color(...COLORS.TEXT_WHITE),
          k.opacity(1),
          k.z(320),
          k.fixed(),
        ])
        tapText.onUpdate(() => {
          tapText.opacity = 0.5 + Math.sin(k.time() * 4) * 0.5
        })

        // Allow tap to restart immediately
        let canRestart = true

        k.onKeyPress(() => { if (canRestart) { canRestart = false; k.go('game') } })
        k.onClick(() => { if (canRestart) { canRestart = false; k.go('game') } })
        k.onTouchStart(() => { if (canRestart) { canRestart = false; k.go('game') } })

        // Auto restart after 1.5s
        k.wait(1.5, () => {
          if (canRestart) {
            canRestart = false
            k.go('game')
          }
        })
      })
    }
  })
}

// Road line objects for animation
interface RoadLine {
  obj: ReturnType<KAPLAYCtx['add']> & { pos: { x: number; y: number }; width: number; height: number; opacity: number }
  baseY: number
  lane: number
}

function createAnimatedRoadLines(k: KAPLAYCtx): RoadLine[] {
  const lines: RoadLine[] = []
  const VP_Y = GAME_CONFIG.LANE_Y_TOP
  const BOTTOM = GAME_CONFIG.LANE_Y_BOTTOM
  const range = BOTTOM - VP_Y
  const COUNT = GAME_CONFIG.ROAD_LINE_COUNT

  for (let i = 0; i < COUNT; i++) {
    const t = i / COUNT

    // Center dashed lines (2 lane dividers)
    for (let laneDiv = 0; laneDiv < 2; laneDiv++) {
      const scale = 0.15 + t * 0.85
      const laneOffset = (laneDiv - 0.5) * GAME_CONFIG.LANE_WIDTH * scale
      const x = GAME_CONFIG.VANISHING_POINT_X + laneOffset
      const y = VP_Y + range * t
      const lineWidth = 2 + t * 4
      const lineHeight = 4 + t * 18

      const obj = k.add([
        k.rect(lineWidth, lineHeight),
        k.pos(x, y),
        k.anchor('center'),
        k.color(...COLORS.LANE_LINE),
        k.opacity(0.3 + t * 0.4),
        k.z(5),
      ])

      lines.push({ obj, baseY: t, lane: laneDiv })
    }
  }

  return lines
}

function updateRoadLines(lines: RoadLine[], speed: number, dt: number) {
  const VP_Y = GAME_CONFIG.LANE_Y_TOP
  const BOTTOM = GAME_CONFIG.LANE_Y_BOTTOM
  const range = BOTTOM - VP_Y

  for (const line of lines) {
    line.baseY += speed * dt * 0.8

    if (line.baseY > 1) {
      line.baseY -= 1
    }

    const t = line.baseY
    const y = VP_Y + range * t
    const scale = 0.15 + t * 0.85
    const laneOffset = (line.lane - 0.5) * GAME_CONFIG.LANE_WIDTH * scale
    const x = GAME_CONFIG.VANISHING_POINT_X + laneOffset
    const lineWidth = 2 + t * 4
    const lineHeight = 4 + t * 18

    line.obj.pos.x = x
    line.obj.pos.y = y
    line.obj.width = lineWidth
    line.obj.height = lineHeight
    line.obj.opacity = 0.3 + t * 0.4
  }
}

function drawTrackBackground(k: KAPLAYCtx) {
  const W = GAME_CONFIG.WIDTH
  const H = GAME_CONFIG.HEIGHT
  const VP_Y = GAME_CONFIG.LANE_Y_TOP - 40

  // Bright sky gradient (light blue top → medium blue bottom)
  const skySegments = 12
  for (let i = 0; i < skySegments; i++) {
    const t = i / skySegments
    const r = 80 + t * 40
    const g = 160 + t * 40
    const b = 255
    k.add([
      k.rect(W, Math.ceil(VP_Y / skySegments) + 1),
      k.pos(0, i * (VP_Y / skySegments)),
      k.color(r, g, b),
      k.z(0),
    ])
  }

  // Track area - dark green-gray ground
  const trackRange = H - VP_Y
  const trackSegments = 16
  for (let i = 0; i < trackSegments; i++) {
    const t = i / trackSegments
    const r = 60 + t * 30
    const g = 70 + t * 30
    const b = 60 + t * 25
    k.add([
      k.rect(W, Math.ceil(trackRange / trackSegments) + 1),
      k.pos(0, VP_Y + i * (trackRange / trackSegments)),
      k.color(r, g, b),
      k.z(0),
    ])
  }

  // Side walls (left) - teal/green with perspective
  const wallSegments = 16
  for (let i = 0; i < wallSegments; i++) {
    const t = i / wallSegments
    const y = VP_Y + trackRange * t
    const width = 12 + t * 60
    const segH = Math.ceil(trackRange / wallSegments) + 1

    k.add([
      k.rect(width, segH),
      k.pos(0, y),
      k.color(30 + t * 30, 140 + t * 40, 120 + t * 20),
      k.z(2),
    ])

    // Color stripe accents
    if (i % 4 === 0 && t > 0.2) {
      k.add([
        k.rect(width * 0.6, 3),
        k.pos(2, y + segH / 2),
        k.color(0, 220, 180),
        k.opacity(0.4),
        k.z(3),
      ])
    }
  }

  // Side walls (right) - mirror
  for (let i = 0; i < wallSegments; i++) {
    const t = i / wallSegments
    const y = VP_Y + trackRange * t
    const width = 12 + t * 60
    const segH = Math.ceil(trackRange / wallSegments) + 1

    k.add([
      k.rect(width, segH),
      k.pos(W - width, y),
      k.color(30 + t * 30, 140 + t * 40, 120 + t * 20),
      k.z(2),
    ])

    if (i % 4 === 0 && t > 0.2) {
      k.add([
        k.rect(width * 0.6, 3),
        k.pos(W - width + 2, y + segH / 2),
        k.color(0, 220, 180),
        k.opacity(0.4),
        k.z(3),
      ])
    }
  }

  // Colored lane markers at bottom (visible colored strips)
  k.add([k.rect(4, 200), k.pos(200, 520), k.color(0, 200, 150), k.opacity(0.3), k.z(4)])
  k.add([k.rect(4, 200), k.pos(400, 520), k.color(0, 200, 150), k.opacity(0.3), k.z(4)])
}

function spawnSpeedLine(k: KAPLAYCtx, W: number, H: number) {
  const side = Math.random() > 0.5 ? 0 : 1
  const x = side === 0 ? k.rand(15, 70) : k.rand(W - 70, W - 15)
  k.add([
    k.rect(2, k.rand(40, 90)),
    k.pos(x, k.rand(300, H - 100)),
    k.color(200, 230, 255),
    k.opacity(0.2),
    k.anchor('center'),
    k.move(k.DOWN, k.rand(300, 500)),
    k.lifespan(0.3, { fade: 0.2 }),
    k.z(90),
  ])
}

async function submitScore(score: number) {
  try {
    await fetch('/api/submit-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score }),
    })
  } catch {
    // Silent fail
  }
}

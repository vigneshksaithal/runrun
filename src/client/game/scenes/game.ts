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

    // Draw the persistent background/track
    drawTrackBackground(k)

    // Create player
    const player = createPlayer(k, lanes.getCurrentX())

    // HUD
    const scoreText = k.add([
      k.text('0', { size: 24 }),
      k.pos(W / 2, 30),
      k.anchor('center'),
      k.color(...COLORS.TEXT_WHITE),
      k.scale(1),
      k.z(200),
      k.fixed(),
    ])

    // Score label
    k.add([
      k.text('blocks', { size: 11 }),
      k.pos(W / 2, 50),
      k.anchor('center'),
      k.color(...COLORS.LANE_LINE),
      k.opacity(0.6),
      k.z(200),
      k.fixed(),
    ])

    // Speed lines container (spawned at high speed)
    let speedLineTimer = 0

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

      // Update scoring
      scoring.update(dt, gameSpeed)
      scoreText.text = Math.floor(scoring.getState().score).toString()

      // Score milestone effects
      const score = scoring.getState().score
      if (score > 0 && Math.floor(score) % 100 === 0 && Math.floor(score - gameSpeed * dt * GAME_CONFIG.SCORE_PER_SECOND) % 100 !== 0) {
        // Milestone hit!
        scoreText.scaleTo(1.5)
        k.tween(1.5, 1, 0.3, (v: number) => scoreText.scaleTo(v), k.easings.easeOutBack)
      }

      // Spawn obstacles/collectibles
      const spawnEvents = spawner.update(dt, gameSpeed)
      for (const event of spawnEvents) {
        if (event.type === 'gold') {
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
        if (!obs.passed && obs.y > GAME_CONFIG.PLAYER_Y - 40 && obs.y < GAME_CONFIG.PLAYER_Y + 10) {
          if (obs.lane === lanes.getCurrentLane()) {
            // Check if player can dodge
            const canDodge = checkDodge(obs.type, player.state.current)

            if (!canDodge) {
              // DEATH
              die(obs)
              return
            }
          }

          // Near miss detection
          if (!obs.passed && Math.abs(obs.lane - lanes.getCurrentLane()) <= 1 && obs.lane !== lanes.getCurrentLane()) {
            const distance = Math.abs(obs.y - GAME_CONFIG.PLAYER_Y)
            if (distance < GAME_CONFIG.NEAR_MISS_DISTANCE) {
              scoring.addNearMiss()
              showNearMiss(k, player.obj.pos.x, player.obj.pos.y - 60)
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
        if (!col.collected && col.y > GAME_CONFIG.PLAYER_Y - 35 && col.y < GAME_CONFIG.PLAYER_Y + 10) {
          if (col.lane === lanes.getCurrentLane()) {
            col.collected = true
            scoring.addGold()
            createCollectParticles(k, col.obj.pos.x, col.obj.pos.y)
            col.obj.destroy()
            collectibles.splice(i, 1)
          }
        }
      }

      // Speed lines at high speed
      if (gameSpeed > 6) {
        speedLineTimer += dt
        if (speedLineTimer > 0.05) {
          speedLineTimer = 0
          spawnSpeedLine(k, W, H)
        }
      }
    })

    function checkDodge(obstacleType: string, playerState: string): boolean {
      if (obstacleType === 'stone_wall' && playerState === 'jumping') return true
      if (obstacleType === 'cobweb' && playerState === 'sliding') return true
      // TNT can only be dodged by switching lanes (already handled by lane check)
      return false
    }

    function die(hitObstacle: Obstacle) {
      alive = false

      // Screen shake
      k.shake(12)

      // Death particles
      createDeathParticles(k, player.obj.pos.x, player.obj.pos.y)
      createObstacleDestroyParticles(k, hitObstacle.obj.pos.x, hitObstacle.obj.pos.y, hitObstacle.type)

      // Flash screen red
      const flash = k.add([
        k.rect(W, H),
        k.pos(0, 0),
        k.color(255, 0, 0),
        k.opacity(0.3),
        k.z(300),
        k.fixed(),
      ])
      k.tween(0.3, 0, 0.3, (v: number) => { flash.opacity = v })

      // Hide player
      player.obj.hidden = true

      // Transition to death screen
      const finalScore = scoring.getFinalScore()
      const isHighScore = scoring.checkHighScore()
      const state = scoring.getState()

      k.wait(0.8, () => {
        k.go('death', {
          score: finalScore,
          highScore: state.highScore,
          isNewHighScore: isHighScore,
          goldsCollected: state.goldsCollected,
          nearMisses: state.nearMisses,
        })
      })
    }
  })
}

function drawTrackBackground(k: KAPLAYCtx) {
  const W = GAME_CONFIG.WIDTH
  const H = GAME_CONFIG.HEIGHT
  const VP_X = GAME_CONFIG.VANISHING_POINT_X
  const VP_Y = GAME_CONFIG.LANE_Y_TOP - 30

  // Sky gradient (stacked rects)
  for (let i = 0; i < 10; i++) {
    const t = i / 10
    const r = 30 + t * 20
    const g = 30 + t * 40
    const b = 50 + t * 30
    k.add([
      k.rect(W, VP_Y / 10),
      k.pos(0, i * (VP_Y / 10)),
      k.color(r, g, b),
      k.z(0),
    ])
  }

  // Ground/track area
  k.add([
    k.rect(W, H - VP_Y),
    k.pos(0, VP_Y),
    k.color(...COLORS.TRACK),
    k.z(0),
  ])

  // Perspective track lines (converging to vanishing point)
  const laneOffsets = [-1, 0, 1, 2]
  for (const offset of laneOffsets) {
    // Draw converging lane line from VP to bottom
    const topX = VP_X + offset * 5
    const botX = VP_X + (offset - 0.5) * GAME_CONFIG.LANE_WIDTH

    // Use multiple small rects to simulate a line from top to bottom
    for (let i = 0; i < 20; i++) {
      const t = i / 20
      const x = topX + (botX - topX) * t
      const y = VP_Y + (H - VP_Y) * t
      const width = 1 + t * 2
      k.add([
        k.rect(width, (H - VP_Y) / 20 + 2),
        k.pos(x, y),
        k.color(...COLORS.LANE_LINE),
        k.opacity(0.2 + t * 0.3),
        k.z(1),
      ])
    }
  }

  // Tunnel walls (left and right borders)
  // Left wall
  for (let i = 0; i < 15; i++) {
    const t = i / 15
    const y = VP_Y + (H - VP_Y) * t
    const width = 10 + t * 40
    k.add([
      k.rect(width, (H - VP_Y) / 15 + 2),
      k.pos(0, y),
      k.color(40 + t * 20, 35 + t * 15, 30 + t * 10),
      k.z(2),
    ])
  }
  // Right wall
  for (let i = 0; i < 15; i++) {
    const t = i / 15
    const y = VP_Y + (H - VP_Y) * t
    const width = 10 + t * 40
    k.add([
      k.rect(width, (H - VP_Y) / 15 + 2),
      k.pos(W - width, y),
      k.color(40 + t * 20, 35 + t * 15, 30 + t * 10),
      k.z(2),
    ])
  }

  // Ceiling rocks/details at vanishing point area
  for (let i = 0; i < 5; i++) {
    k.add([
      k.rect(30 + Math.random() * 40, 8 + Math.random() * 12),
      k.pos(VP_X - 80 + i * 35, VP_Y - 10 + Math.random() * 20),
      k.color(50, 45, 40),
      k.opacity(0.5),
      k.z(3),
    ])
  }

  // Torch/light effects on walls
  drawTorch(k, 40, 300)
  drawTorch(k, W - 40, 300)
  drawTorch(k, 30, 450)
  drawTorch(k, W - 30, 450)
}

function drawTorch(k: KAPLAYCtx, x: number, y: number) {
  // Stick
  k.add([
    k.rect(4, 16),
    k.pos(x - 2, y),
    k.color(100, 70, 30),
    k.z(4),
  ])
  // Flame (animated)
  const flame = k.add([
    k.rect(8, 10),
    k.pos(x - 4, y - 10),
    k.color(255, 150, 0),
    k.opacity(0.8),
    k.z(5),
  ])
  flame.onUpdate(() => {
    flame.opacity = 0.6 + Math.sin(k.time() * 8 + x) * 0.3
    flame.pos.y = y - 10 + Math.sin(k.time() * 6 + x) * 2
  })
  // Glow
  k.add([
    k.rect(20, 20),
    k.pos(x - 10, y - 15),
    k.color(255, 200, 50),
    k.opacity(0.1),
    k.z(3),
  ])
}

function spawnSpeedLine(k: KAPLAYCtx, W: number, H: number) {
  const side = Math.random() > 0.5 ? 0 : 1
  const x = side === 0 ? k.rand(10, 60) : k.rand(W - 60, W - 10)
  k.add([
    k.rect(2, k.rand(30, 80)),
    k.pos(x, k.rand(200, H - 100)),
    k.color(...COLORS.SPEED_LINE),
    k.opacity(0.2),
    k.anchor('center'),
    k.move(k.DOWN, k.rand(200, 400)),
    k.lifespan(0.4, { fade: 0.2 }),
    k.z(90),
  ])
}

function showNearMiss(k: KAPLAYCtx, x: number, y: number) {
  // Near miss text
  k.add([
    k.text('CLOSE!', { size: 14 }),
    k.pos(x, y),
    k.anchor('center'),
    k.color(...COLORS.NEAR_MISS),
    k.move(k.UP, 40),
    k.lifespan(0.5, { fade: 0.3 }),
    k.z(180),
  ])

  // Subtle shake
  k.shake(2)
}

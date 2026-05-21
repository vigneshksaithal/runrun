import type { KAPLAYCtx } from 'kaplay'
import { GAME_CONFIG } from '../config'
import { createInputSystem } from '../systems/input'
import { createLaneSystem } from '../systems/lanes'
import { createScoringSystem } from '../systems/scoring'
import { createSpawnerSystem } from '../systems/spawner'
import { getBiome, getBiomeIndex, getBiomeName } from '../systems/biome'
import { createPlayer, createDeathParticles } from '../objects/player'
import { createObstacle, updateObstacle, createObstacleDestroyParticles, type Obstacle } from '../objects/obstacle'
import { createCollectible, updateCollectible, createCollectParticles, type Collectible } from '../objects/collectible'
import { createPowerUp, updatePowerUp, createPowerUpCollectParticles, type PowerUp, type PowerUpType } from '../objects/powerup'

const { COLORS } = GAME_CONFIG

interface ActivePowerUp {
  type: PowerUpType
  timeLeft: number
}

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
    const powerUps: PowerUp[] = []
    const activePowerUps: ActivePowerUp[] = []
    let lastBiomeIndex = 0

    // Draw the persistent background/track
    drawTrackBackground(k)


    // Biome overlay tint (used to color-shift the scene)
    const biomeOverlay = k.add([
      k.rect(W, H),
      k.pos(0, 0),
      k.color(0, 0, 0),
      k.opacity(0),
      k.z(1),
    ])

    // Create animated road markings (the key to "running" feel!)
    const roadLines = createAnimatedRoadLines(k)

    // Ambient dust particles (always present ~15)
    interface DustObj { pos: { x: number; y: number }; opacity: number; destroy(): void }
    const dustParticles: Array<{ obj: DustObj; vx: number; vy: number }> = []
    for (let i = 0; i < 15; i++) {
      const obj = k.add([
        k.rect(k.rand(2, 4), k.rand(2, 4)),
        k.pos(k.rand(40, W - 40), k.rand(220, H - 100)),
        k.color(160, 150, 140),
        k.opacity(k.rand(0.1, 0.3)),
        k.anchor('center'),
        k.z(95),
      ]) as unknown as DustObj
      dustParticles.push({ obj, vx: k.rand(-8, 8), vy: k.rand(-12, -3) })
    }

    // Create player
    const player = createPlayer(k, lanes.getCurrentX())


    // HUD - Score
    const scoreText = k.add([
      k.text('0', { size: 32 }),
      k.pos(W / 2, 35),
      k.anchor('center'),
      k.color(...COLORS.TEXT_WHITE),
      k.scale(1),
      k.z(200),
      k.fixed(),
    ])

    // Score label
    k.add([
      k.text('blocks', { size: 13 }),
      k.pos(W / 2, 60),
      k.anchor('center'),
      k.color(...COLORS.LANE_LINE),
      k.opacity(0.6),
      k.z(200),
      k.fixed(),
    ])

    // Multiplier text (only visible when > 1x)
    const multiplierText = k.add([
      k.text('', { size: 20 }),
      k.pos(W / 2, 82),
      k.anchor('center'),
      k.color(...COLORS.COMBO_TEXT),
      k.opacity(0),
      k.z(200),
      k.fixed(),
    ])

    // Power-up indicator area (top right)
    const powerUpIndicators: Array<ReturnType<KAPLAYCtx['add']>> = []

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

      // Update animated road lines
      updateRoadLines(roadLines, gameSpeed, dt)

      // Update scoring
      scoring.update(dt, gameSpeed)
      const currentScore = scoring.getState().score
      scoreText.text = Math.floor(currentScore).toString()

      // Multiplier HUD
      const state = scoring.getState()
      if (state.multiplier > 1) {
        multiplierText.text = `${state.multiplier}x COMBO`
        multiplierText.opacity = 0.9
      } else {
        multiplierText.opacity = 0
      }


      // Biome system - update overlay tint
      const biomeIdx = getBiomeIndex(currentScore)
      if (biomeIdx !== lastBiomeIndex) {
        // Biome transition flash
        const flash = k.add([
          k.rect(W, H),
          k.pos(0, 0),
          k.color(255, 255, 255),
          k.opacity(0.4),
          k.z(250),
        ])
        k.tween(0.4, 0, 0.6, (v: number) => { flash.opacity = v })
        k.wait(0.7, () => { flash.destroy() })
        lastBiomeIndex = biomeIdx
      }

      // Apply biome tint
      const biome = getBiome(currentScore)
      biomeOverlay.color.r = biome.wallColor[0]
      biomeOverlay.color.g = biome.wallColor[1]
      biomeOverlay.color.b = biome.wallColor[2]
      biomeOverlay.opacity = biomeIdx === 0 ? 0 : 0.12

      // Update active power-ups
      for (let i = activePowerUps.length - 1; i >= 0; i--) {
        const ap = activePowerUps[i]!
        if (ap.timeLeft > 0) {
          ap.timeLeft -= dt
          if (ap.timeLeft <= 0) {
            activePowerUps.splice(i, 1)
            updatePowerUpHUD()
            if (ap.type === 'shield') {
              player.setShield(false)
            }
          }
        }
      }

      // Score milestone effects
      if (currentScore > 0 && Math.floor(currentScore) % 100 === 0 && Math.floor(currentScore - gameSpeed * dt * GAME_CONFIG.SCORE_PER_SECOND) % 100 !== 0) {
        scoreText.scaleTo(1.6)
        k.tween(1.6, 1, 0.3, (v: number) => scoreText.scaleTo(v), k.easings.easeOutBack)
      }


      // Spawn obstacles/collectibles/powerups
      const spawnEvents = spawner.update(dt, gameSpeed, currentScore)
      for (const event of spawnEvents) {
        if (event.type === 'gold') {
          collectibles.push(createCollectible(k, event.lane))
        } else if (event.type === 'power_up') {
          const types: PowerUpType[] = ['shield', 'magnet', 'double_score']
          const pType = types[Math.floor(Math.random() * types.length)]!
          powerUps.push(createPowerUp(k, event.lane, pType))
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
              // Check shield
              if (hasPowerUp('shield')) {
                removePowerUp('shield')
                player.setShield(false)
                createObstacleDestroyParticles(k, obs.obj.pos.x, obs.obj.pos.y, obs.type)
                obs.obj.destroy()
                obstacles.splice(i, 1)
                k.shake(5)
                scoring.resetCombo()
                continue
              }
              die(obs)
              return
            }
          }

          // Near miss detection
          if (!obs.passed && Math.abs(obs.lane - lanes.getCurrentLane()) <= 1 && obs.lane !== lanes.getCurrentLane()) {
            const distance = Math.abs(obs.y - GAME_CONFIG.PLAYER_Y)
            if (distance < GAME_CONFIG.NEAR_MISS_DISTANCE) {
              scoring.addNearMiss()
              showNearMiss(k, player.obj.pos.x, player.obj.pos.y - 70)
            }
          }

          obs.passed = true
        }
      }


      // Update collectibles
      const magnetActive = hasPowerUp('magnet')
      for (let i = collectibles.length - 1; i >= 0; i--) {
        const col = collectibles[i]
        if (!col) continue

        const pastScreen = updateCollectible(k, col, gameSpeed, dt)

        if (pastScreen) {
          col.obj.destroy()
          collectibles.splice(i, 1)
          continue
        }

        // Collection detection (normal or magnet)
        if (!col.collected && col.y > GAME_CONFIG.PLAYER_Y - 40 && col.y < GAME_CONFIG.PLAYER_Y + 15) {
          const inLane = col.lane === lanes.getCurrentLane()
          const adjacentLane = magnetActive && Math.abs(col.lane - lanes.getCurrentLane()) === 1

          if (inLane || adjacentLane) {
            col.collected = true
            const doubleActive = hasPowerUp('double_score')
            scoring.addGold(doubleActive)
            createCollectParticles(k, col.obj.pos.x, col.obj.pos.y)
            col.obj.destroy()
            collectibles.splice(i, 1)
          }
        }
      }

      // Update power-ups
      for (let i = powerUps.length - 1; i >= 0; i--) {
        const pu = powerUps[i]
        if (!pu) continue

        const pastScreen = updatePowerUp(k, pu, gameSpeed, dt)

        if (pastScreen) {
          pu.obj.destroy()
          powerUps.splice(i, 1)
          continue
        }

        // Collection detection
        if (!pu.collected && pu.y > GAME_CONFIG.PLAYER_Y - 40 && pu.y < GAME_CONFIG.PLAYER_Y + 15) {
          if (pu.lane === lanes.getCurrentLane()) {
            pu.collected = true
            collectPowerUp(pu.type)
            createPowerUpCollectParticles(k, pu.obj.pos.x, pu.obj.pos.y, pu.type)
            pu.obj.destroy()
            powerUps.splice(i, 1)
          }
        }
      }


      // Update ambient dust particles
      for (const dust of dustParticles) {
        dust.obj.pos.x += dust.vx * dt
        dust.obj.pos.y += dust.vy * dt
        if (dust.obj.pos.y < 200) {
          dust.obj.pos.y = H - 100
          dust.obj.pos.x = k.rand(40, W - 40)
        }
        if (dust.obj.pos.x < 20 || dust.obj.pos.x > W - 20) {
          dust.vx = -dust.vx
        }
        dust.obj.opacity = 0.1 + Math.sin(k.time() * 2 + dust.obj.pos.x * 0.01) * 0.1
      }

      // Speed sparks at high speed
      if (gameSpeed > 7) {
        speedLineTimer += dt
        if (speedLineTimer > 0.03) {
          speedLineTimer = 0
          spawnSpeedLine(k, W, H)
          // Track edge sparks
          const side = Math.random() > 0.5
          const sparkX = side ? k.rand(W - 90, W - 50) : k.rand(50, 90)
          k.add([
            k.rect(3, 3),
            k.pos(sparkX, k.rand(500, 680)),
            k.color(255, 220, 100),
            k.opacity(0.8),
            k.anchor('center'),
            k.move(k.DOWN, k.rand(200, 400)),
            k.lifespan(0.2, { fade: 0.1 }),
            k.z(92),
          ])
        }
      } else if (gameSpeed > 5.5) {
        speedLineTimer += dt
        if (speedLineTimer > 0.04) {
          speedLineTimer = 0
          spawnSpeedLine(k, W, H)
        }
      }

      // Nether ember particles
      if (biomeIdx === 2) {
        if (Math.random() < 0.15) {
          k.add([
            k.rect(k.rand(2, 5), k.rand(2, 5)),
            k.pos(k.rand(50, W - 50), k.rand(250, H - 100)),
            k.color(255, k.rand(60, 140), 20),
            k.opacity(0.7),
            k.anchor('center'),
            k.move(k.Vec2.fromAngle(k.rand(-100, -80)), k.rand(30, 70)),
            k.lifespan(0.8, { fade: 0.4 }),
            k.z(93),
          ])
        }
      }
    })


    function hasPowerUp(type: PowerUpType): boolean {
      return activePowerUps.some(p => p.type === type)
    }

    function removePowerUp(type: PowerUpType) {
      const idx = activePowerUps.findIndex(p => p.type === type)
      if (idx >= 0) {
        activePowerUps.splice(idx, 1)
        updatePowerUpHUD()
      }
    }

    function collectPowerUp(type: PowerUpType) {
      // Remove existing of same type
      const existingIdx = activePowerUps.findIndex(p => p.type === type)
      if (existingIdx >= 0) {
        activePowerUps.splice(existingIdx, 1)
      }

      let duration: number
      switch (type) {
        case 'shield':
          duration = 9999 // Until hit
          player.setShield(true)
          break
        case 'magnet':
          duration = GAME_CONFIG.MAGNET_DURATION
          break
        case 'double_score':
          duration = GAME_CONFIG.DOUBLE_SCORE_DURATION
          break
      }
      activePowerUps.push({ type, timeLeft: duration })
      updatePowerUpHUD()
    }

    function updatePowerUpHUD() {
      // Remove old indicators
      for (const ind of powerUpIndicators) {
        ind.destroy()
      }
      powerUpIndicators.length = 0

      // Create new indicators
      for (let i = 0; i < activePowerUps.length; i++) {
        const ap = activePowerUps[i]!
        let color: [number, number, number]
        let label: string
        switch (ap.type) {
          case 'shield': color = COLORS.SHIELD_BLUE; label = 'S'; break
          case 'magnet': color = COLORS.MAGNET_PURPLE; label = 'M'; break
          case 'double_score': color = COLORS.DOUBLE_ORANGE; label = '2x'; break
        }
        const indicator = k.add([
          k.rect(28, 28, { radius: 4 }),
          k.pos(W - 40 - i * 34, 30),
          k.anchor('center'),
          k.color(...color),
          k.opacity(0.85),
          k.z(200),
          k.fixed(),
        ])
        k.add([
          k.text(label, { size: 12 }),
          k.pos(W - 40 - i * 34, 30),
          k.anchor('center'),
          k.color(...COLORS.TEXT_WHITE),
          k.z(201),
          k.fixed(),
        ])
        powerUpIndicators.push(indicator)
      }
    }


    function checkDodge(obstacleType: string, playerState: string): boolean {
      if (obstacleType === 'stone_wall' && playerState === 'jumping') return true
      if (obstacleType === 'cobweb' && playerState === 'sliding') return true
      return false
    }

    function die(hitObstacle: Obstacle) {
      alive = false

      // Screen shake
      k.shake(15)

      // Death particles
      createDeathParticles(k, player.obj.pos.x, player.obj.pos.y)
      createObstacleDestroyParticles(k, hitObstacle.obj.pos.x, hitObstacle.obj.pos.y, hitObstacle.type)

      // Flash screen red
      const flash = k.add([
        k.rect(W, H),
        k.pos(0, 0),
        k.color(255, 20, 20),
        k.opacity(0.35),
        k.z(300),
        k.fixed(),
      ])
      k.tween(0.35, 0, 0.5, (v: number) => { flash.opacity = v })

      // Hide player
      player.obj.hidden = true

      // Transition to death screen with safe data
      const finalScore = scoring.getFinalScore()
      const isHighScore = scoring.checkHighScore()
      const finalState = scoring.getState()

      k.wait(0.9, () => {
        k.go('death', {
          score: finalScore,
          highScore: finalState.highScore,
          isNewHighScore: isHighScore,
          goldsCollected: finalState.goldsCollected,
          nearMisses: finalState.nearMisses,
          maxCombo: finalState.maxCombo,
          biomeReached: getBiomeName(finalScore),
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
    const y = VP_Y + range * t

    // Center dashed lines (3 lane dividers at 2 positions)
    for (let laneDiv = 0; laneDiv < 2; laneDiv++) {
      const scale = 0.15 + t * 0.85
      const laneOffset = (laneDiv - 0.5) * GAME_CONFIG.LANE_WIDTH * scale
      const x = GAME_CONFIG.VANISHING_POINT_X + laneOffset
      const lineWidth = 2 + t * 4
      const lineHeight = 4 + t * 16

      const obj = k.add([
        k.rect(lineWidth, lineHeight),
        k.pos(x, y),
        k.anchor('center'),
        k.color(...COLORS.LANE_LINE),
        k.opacity(0.15 + t * 0.4),
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
    // Move line forward (toward player)
    line.baseY += speed * dt * 0.8

    // Wrap around
    if (line.baseY > 1) {
      line.baseY -= 1
    }

    const t = line.baseY
    const y = VP_Y + range * t
    const scale = 0.15 + t * 0.85
    const laneOffset = (line.lane - 0.5) * GAME_CONFIG.LANE_WIDTH * scale
    const x = GAME_CONFIG.VANISHING_POINT_X + laneOffset
    const lineWidth = 2 + t * 4
    const lineHeight = 4 + t * 16

    line.obj.pos.x = x
    line.obj.pos.y = y
    line.obj.width = lineWidth
    line.obj.height = lineHeight
    line.obj.opacity = 0.15 + t * 0.4
  }
}


function drawTrackBackground(k: KAPLAYCtx) {
  const W = GAME_CONFIG.WIDTH
  const H = GAME_CONFIG.HEIGHT
  const VP_X = GAME_CONFIG.VANISHING_POINT_X
  const VP_Y = GAME_CONFIG.LANE_Y_TOP - 40

  // Dark sky/ceiling gradient (stacked rects)
  const skySegments = 12
  for (let i = 0; i < skySegments; i++) {
    const t = i / skySegments
    const r = 20 + t * 25
    const g = 18 + t * 20
    const b = 35 + t * 30
    k.add([
      k.rect(W, Math.ceil(VP_Y / skySegments) + 1),
      k.pos(0, i * (VP_Y / skySegments)),
      k.color(r, g, b),
      k.z(0),
    ])
  }

  // Ground/track area - gradient from dark to lighter
  const trackSegments = 20
  const trackRange = H - VP_Y
  for (let i = 0; i < trackSegments; i++) {
    const t = i / trackSegments
    const r = 50 + t * 25
    const g = 45 + t * 22
    const b = 40 + t * 18
    k.add([
      k.rect(W, Math.ceil(trackRange / trackSegments) + 1),
      k.pos(0, VP_Y + i * (trackRange / trackSegments)),
      k.color(r, g, b),
      k.z(0),
    ])
  }

  // Tunnel walls (left) - with brick/stone pattern
  const wallSegments = 20
  for (let i = 0; i < wallSegments; i++) {
    const t = i / wallSegments
    const y = VP_Y + trackRange * t
    const width = 15 + t * 70
    const segH = Math.ceil(trackRange / wallSegments) + 1

    // Main wall
    k.add([
      k.rect(width, segH),
      k.pos(0, y),
      k.color(40 + t * 25, 34 + t * 20, 28 + t * 15),
      k.z(2),
    ])

    // Brick detail lines
    if (i % 3 === 0 && t > 0.2) {
      k.add([
        k.rect(width * 0.8, 2),
        k.pos(2, y + segH / 2),
        k.color(30, 25, 20),
        k.opacity(0.4),
        k.z(3),
      ])
    }
  }


  // Tunnel walls (right) - mirror
  for (let i = 0; i < wallSegments; i++) {
    const t = i / wallSegments
    const y = VP_Y + trackRange * t
    const width = 15 + t * 70
    const segH = Math.ceil(trackRange / wallSegments) + 1

    k.add([
      k.rect(width, segH),
      k.pos(W - width, y),
      k.color(40 + t * 25, 34 + t * 20, 28 + t * 15),
      k.z(2),
    ])

    if (i % 3 === 0 && t > 0.2) {
      k.add([
        k.rect(width * 0.8, 2),
        k.pos(W - width + 2, y + segH / 2),
        k.color(30, 25, 20),
        k.opacity(0.4),
        k.z(3),
      ])
    }
  }

  // Ceiling stalactites/rocks at vanishing point area
  for (let i = 0; i < 8; i++) {
    const x = VP_X - 120 + i * 32 + Math.random() * 10
    const w = 20 + Math.random() * 35
    const h = 8 + Math.random() * 18
    k.add([
      k.rect(w, h),
      k.pos(x, VP_Y - 5 + Math.random() * 25),
      k.color(35 + Math.random() * 15, 30 + Math.random() * 10, 28),
      k.opacity(0.6),
      k.z(3),
    ])
  }

  // Torch/light effects on walls (animated glow)
  drawTorch(k, 55, 360)
  drawTorch(k, W - 55, 360)
  drawTorch(k, 35, 530)
  drawTorch(k, W - 35, 530)
  drawTorch(k, 70, 680)
  drawTorch(k, W - 70, 680)

  // Subtle ore deposits in walls (colored squares)
  drawOreDeposit(k, 20, 400, [80, 80, 80], 3) // Coal
  drawOreDeposit(k, W - 30, 450, [180, 140, 80], 2) // Iron
  drawOreDeposit(k, 40, 580, [80, 200, 80], 2) // Emerald
  drawOreDeposit(k, W - 50, 620, [100, 180, 255], 2) // Diamond
}


function drawTorch(k: KAPLAYCtx, x: number, y: number) {
  // Larger glow (background)
  const glow = k.add([
    k.rect(30, 30),
    k.pos(x - 15, y - 20),
    k.color(...COLORS.TORCH_GLOW),
    k.opacity(0.06),
    k.anchor('topleft'),
    k.z(3),
  ])
  glow.onUpdate(() => {
    glow.opacity = 0.04 + Math.sin(k.time() * 6 + x * 0.1) * 0.03
  })

  // Stick
  k.add([
    k.rect(5, 18),
    k.pos(x - 2, y),
    k.color(...COLORS.TORCH_STICK),
    k.z(4),
  ])

  // Flame (animated)
  const flame = k.add([
    k.rect(10, 12),
    k.pos(x - 5, y - 12),
    k.color(...COLORS.TORCH_FLAME),
    k.opacity(0.9),
    k.z(5),
  ])
  flame.onUpdate(() => {
    flame.opacity = 0.7 + Math.sin(k.time() * 10 + x) * 0.25
    flame.pos.y = y - 12 + Math.sin(k.time() * 7 + x) * 2
    flame.pos.x = x - 5 + Math.sin(k.time() * 5 + x * 0.5) * 1
  })

  // Flame tip (smaller, brighter)
  const tip = k.add([
    k.rect(6, 7),
    k.pos(x - 3, y - 18),
    k.color(255, 220, 100),
    k.opacity(0.7),
    k.z(6),
  ])
  tip.onUpdate(() => {
    tip.opacity = 0.5 + Math.sin(k.time() * 12 + x + 1) * 0.3
    tip.pos.y = y - 18 + Math.sin(k.time() * 9 + x) * 2
  })
}

function drawOreDeposit(k: KAPLAYCtx, x: number, y: number, color: [number, number, number], count: number) {
  for (let i = 0; i < count; i++) {
    k.add([
      k.rect(4, 4),
      k.pos(x + (i % 2) * 6, y + Math.floor(i / 2) * 6),
      k.color(...color),
      k.opacity(0.5),
      k.z(3),
    ])
  }
}

function spawnSpeedLine(k: KAPLAYCtx, W: number, H: number) {
  const side = Math.random() > 0.5 ? 0 : 1
  const x = side === 0 ? k.rand(15, 80) : k.rand(W - 80, W - 15)
  k.add([
    k.rect(2, k.rand(40, 100)),
    k.pos(x, k.rand(250, H - 100)),
    k.color(...COLORS.SPEED_LINE),
    k.opacity(0.15),
    k.anchor('center'),
    k.move(k.DOWN, k.rand(300, 500)),
    k.lifespan(0.35, { fade: 0.2 }),
    k.z(90),
  ])
}

function showNearMiss(k: KAPLAYCtx, x: number, y: number) {
  k.add([
    k.text('CLOSE!', { size: 16 }),
    k.pos(x, y),
    k.anchor('center'),
    k.color(...COLORS.NEAR_MISS),
    k.opacity(1),
    k.move(k.UP, 50),
    k.lifespan(0.5, { fade: 0.3 }),
    k.z(180),
  ])
  k.shake(3)
}

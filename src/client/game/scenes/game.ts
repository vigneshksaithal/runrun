import type { KAPLAYCtx, GameObj } from 'kaplay'
import { GAME_CONFIG, getDepthScale } from '../config'
import { createPlayer, jumpPlayer, slidePlayer } from '../objects/player'
import type { DeathPayload } from './death'
import { updateCoin, createCoinCollectEffect } from '../objects/collectible'
import { updateObstacle } from '../objects/obstacle'
import { createInputSystem } from '../systems/input'
import { createLaneSystem } from '../systems/lanes'
import { createScoringSystem } from '../systems/scoring'
import { createSpawnerSystem } from '../systems/spawner'

const C = GAME_CONFIG.COLORS

export function createGameScene(k: KAPLAYCtx) {
  k.scene('game', () => {
    let gameSpeed = GAME_CONFIG.INITIAL_SPEED
    let isJumping = false
    let isSliding = false
    let isDead = false
    let ghostTimer = 0

    // Systems
    const input = createInputSystem(k)
    const lanes = createLaneSystem()
    const scoring = createScoringSystem()
    const spawner = createSpawnerSystem(k)

    // === BACKGROUND ===
    // Sky/ceiling gradient: dark blue-green → emerald
    k.add([
      k.rect(GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT / 3),
      k.pos(0, 0),
      k.color(...C.BG_TOP),
      k.z(0),
    ])
    k.add([
      k.rect(GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT / 3),
      k.pos(0, GAME_CONFIG.HEIGHT / 3),
      k.color(...C.BG_MID),
      k.z(0),
    ])
    k.add([
      k.rect(GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT / 3),
      k.pos(0, (GAME_CONFIG.HEIGHT * 2) / 3),
      k.color(...C.BG_BOTTOM),
      k.z(0),
    ])

    // Track/floor area - dark stone with green tint
    k.add([
      k.rect(GAME_CONFIG.WIDTH - 160, GAME_CONFIG.HEIGHT),
      k.pos(80, 0),
      k.color(...C.TRACK_TOP),
      k.z(1),
    ])

    // Left wall
    k.add([
      k.rect(80, GAME_CONFIG.HEIGHT),
      k.pos(0, 0),
      k.color(...C.WALL_DARK),
      k.z(1),
    ])
    // Right wall
    k.add([
      k.rect(80, GAME_CONFIG.HEIGHT),
      k.pos(GAME_CONFIG.WIDTH - 80, 0),
      k.color(...C.WALL_DARK),
      k.z(1),
    ])
    // Left wall mid layer
    k.add([
      k.rect(20, GAME_CONFIG.HEIGHT),
      k.pos(60, 0),
      k.color(...C.WALL_MID),
      k.z(2),
    ])
    // Right wall mid layer
    k.add([
      k.rect(20, GAME_CONFIG.HEIGHT),
      k.pos(GAME_CONFIG.WIDTH - 80, 0),
      k.color(...C.WALL_MID),
      k.z(2),
    ])
    // Left wall highlight edge
    k.add([
      k.rect(6, GAME_CONFIG.HEIGHT),
      k.pos(78, 0),
      k.color(...C.WALL_LIGHT),
      k.z(2),
    ])
    // Right wall highlight edge
    k.add([
      k.rect(6, GAME_CONFIG.HEIGHT),
      k.pos(GAME_CONFIG.WIDTH - 84, 0),
      k.color(...C.WALL_LIGHT),
      k.z(2),
    ])

    // Bright green moss accent strips on walls
    k.add([
      k.rect(4, GAME_CONFIG.HEIGHT),
      k.pos(76, 0),
      k.color(...C.WALL_ACCENT),
      k.opacity(0.7),
      k.z(3),
    ])
    k.add([
      k.rect(4, GAME_CONFIG.HEIGHT),
      k.pos(GAME_CONFIG.WIDTH - 80, 0),
      k.color(...C.WALL_ACCENT),
      k.opacity(0.7),
      k.z(3),
    ])

    // Crystal formations on walls (blue, purple, green)
    // Left wall crystals
    k.add([
      k.rect(10, 22),
      k.pos(30, 260),
      k.anchor('center'),
      k.color(...C.CRYSTAL_BLUE),
      k.opacity(0.85),
      k.z(3),
    ])
    k.add([
      k.rect(8, 18),
      k.pos(50, 480),
      k.anchor('center'),
      k.color(...C.CRYSTAL_PURPLE),
      k.opacity(0.8),
      k.z(3),
    ])
    // Right wall crystals
    k.add([
      k.rect(10, 20),
      k.pos(GAME_CONFIG.WIDTH - 35, 350),
      k.anchor('center'),
      k.color(...C.CRYSTAL_GREEN),
      k.opacity(0.85),
      k.z(3),
    ])
    k.add([
      k.rect(8, 16),
      k.pos(GAME_CONFIG.WIDTH - 50, 600),
      k.anchor('center'),
      k.color(...C.CRYSTAL_BLUE),
      k.opacity(0.75),
      k.z(3),
    ])

    // Distant sky peek at vanishing point area
    k.add([
      k.rect(40, 20),
      k.pos(GAME_CONFIG.VANISHING_POINT_X, GAME_CONFIG.LANE_Y_TOP - 30),
      k.anchor('center'),
      k.color(80, 220, 200),
      k.opacity(0.3),
      k.z(2),
    ])

    // === ROAD LINES ===
    const roadLines: GameObj[] = []
    for (let i = 0; i < GAME_CONFIG.ROAD_LINE_COUNT; i++) {
      const progress = i / GAME_CONFIG.ROAD_LINE_COUNT
      const y = GAME_CONFIG.LANE_Y_TOP + progress * (GAME_CONFIG.LANE_Y_BOTTOM - GAME_CONFIG.LANE_Y_TOP)
      const scale = getDepthScale(y)
      const lineWidth = 300 * scale
      const centerX = GAME_CONFIG.VANISHING_POINT_X

      const line = k.add([
        k.rect(lineWidth, 2),
        k.pos(centerX, y),
        k.anchor('center'),
        k.color(...C.LANE_LINE),
        k.opacity(0.3 + progress * 0.3),
        k.z(3),
        { baseProgress: progress },
      ])
      roadLines.push(line)
    }

    // Update road lines animation
    let roadLineOffset = 0

    // === AMBIENT DUST PARTICLES (max 6) ===
    for (let i = 0; i < 6; i++) {
      const dust = k.add([
        k.rect(k.rand(2, 4), k.rand(2, 4)),
        k.pos(k.rand(100, 500), k.rand(250, 700)),
        k.anchor('center'),
        k.color(...C.PARTICLE_DUST),
        k.opacity(k.rand(0.1, 0.25)),
        k.z(4),
      ])

      const baseX = dust.pos.x
      let driftTime = k.rand(0, 10)

      dust.onUpdate(() => {
        driftTime += k.dt() * 0.5
        dust.pos.x = baseX + Math.sin(driftTime) * 15
        dust.pos.y += k.dt() * 10
        if (dust.pos.y > 720) {
          dust.pos.y = 250
          dust.pos.x = k.rand(100, 500)
        }
      })
    }

    // === PLAYER ===
    const player = createPlayer(k)

    // === HUD ===
    const scoreText = k.add([
      k.text('0', { size: 28 }),
      k.pos(GAME_CONFIG.WIDTH / 2, 30),
      k.anchor('center'),
      k.color(...C.TEXT_WHITE),
      k.z(200),
    ])

    const coinText = k.add([
      k.text('0', { size: 20 }),
      k.pos(30, 30),
      k.anchor('left'),
      k.color(...C.TEXT_GOLD),
      k.z(200),
    ])

    // Coin icon next to text
    k.add([
      k.rect(12, 10),
      k.pos(16, 30),
      k.anchor('center'),
      k.color(...C.COIN),
      k.z(200),
    ])

    // Heart icons (3 lives) - top right
    const hearts: GameObj[] = []
    for (let i = 0; i < 3; i++) {
      const heart = k.add([
        k.rect(14, 14),
        k.pos(GAME_CONFIG.WIDTH - 24 - i * 22, 30),
        k.anchor('center'),
        k.color(220, 50, 60),
        k.opacity(1),
        k.z(200),
      ])
      // Small notch to make it look heart-like
      heart.add([
        k.rect(6, 6),
        k.pos(0, 4),
        k.anchor('center'),
        k.color(220, 50, 60),
      ])
      hearts.push(heart)
    }

    let comboText: GameObj | null = null

    // === SPEED LINES (only above speed 8) ===
    let speedLineCount = 0

    // === GAME LOOP ===
    k.onUpdate(() => {
      if (isDead) return

      // Clamp dt to prevent physics explosions on lag spikes/tab switches
      const rawDt = k.dt()
      const dt = Math.min(rawDt, 0.05)

      // Increase speed
      gameSpeed = Math.min(gameSpeed + GAME_CONFIG.SPEED_INCREASE_RATE * dt, GAME_CONFIG.MAX_SPEED)

      // Process input
      const action = input.consume()
      if (action === 'left') lanes.moveLeft()
      else if (action === 'right') lanes.moveRight()
      else if (action === 'jump' && !isJumping) {
        isJumping = true
        jumpPlayer(k, player)
        k.wait(GAME_CONFIG.JUMP_DURATION, () => { isJumping = false })
      } else if (action === 'slide' && !isSliding) {
        isSliding = true
        slidePlayer(k, player)
        k.wait(GAME_CONFIG.SLIDE_DURATION, () => { isSliding = false })
      }

      // Update lane position
      lanes.update(dt)
      if (player.exists()) {
        player.pos.x = lanes.getCurrentX()
        // Apply tilt rotation
        player.angle = lanes.getTilt()

        // Ghost trail during lane change (reduced frequency)
        if (lanes.isLaneChanging()) {
          ghostTimer += dt
          if (ghostTimer >= 0.06) {
            ghostTimer = 0
            k.add([
              k.rect(38, 60),
              k.pos(player.pos.x, player.pos.y - 30),
              k.anchor('center'),
              k.color(C.PLAYER_BODY[0], C.PLAYER_BODY[1], C.PLAYER_BODY[2]),
              k.opacity(0.3),
              k.rotate(player.angle),
              k.z(90),
              k.lifespan(0.12, { fade: 0.1 }),
            ])
          }
        } else {
          ghostTimer = 0
        }
      }

      // Update scoring
      scoring.addDistance(dt)
      scoreText.text = String(scoring.getScore())
      coinText.text = String(scoring.getCoins())

      // Combo display
      const mult = scoring.getMultiplier()
      if (mult > 1) {
        if (!comboText) {
          comboText = k.add([
            k.text(`x${mult}`, { size: 22 }),
            k.pos(GAME_CONFIG.WIDTH / 2, 60),
            k.anchor('center'),
            k.color(...C.COMBO_TEXT),
            k.z(200),
          ])
        } else {
          comboText.text = `x${mult}`
        }
      } else if (comboText && comboText.exists()) {
        comboText.destroy()
        comboText = null
      }

      // Update spawner
      spawner.update(dt, gameSpeed)

      // Road line animation
      roadLineOffset += dt * gameSpeed * 0.3
      if (roadLineOffset > 1) roadLineOffset -= 1
      for (const line of roadLines) {
        if (!line.exists()) continue
        let progress = (line.baseProgress + roadLineOffset) % 1
        const y = GAME_CONFIG.LANE_Y_TOP + progress * (GAME_CONFIG.LANE_Y_BOTTOM - GAME_CONFIG.LANE_Y_TOP)
        const scale = getDepthScale(y)
        line.pos.y = y
        line.width = 300 * scale
        line.opacity = 0.2 + progress * 0.4
      }

      // Speed lines (only above speed 8) - simplified without tracking array
      if (gameSpeed > 8 && speedLineCount < 4 && k.rand(0, 1) < 0.08) {
        speedLineCount++
        const sl = k.add([
          k.rect(2, k.rand(30, 60)),
          k.pos(k.rand(100, 500), -20),
          k.anchor('center'),
          k.color(...C.SPEED_LINE),
          k.opacity(0.3),
          k.lifespan(0.35, { fade: 0.25 }),
          k.move(k.Vec2.DOWN, 800),
          k.z(5),
        ])
        sl.onDestroy(() => { speedLineCount-- })
      }

      // Update coins - get once, iterate with early exits
      const coins = k.get('coin')
      const playerX = player.exists() ? player.pos.x : 0
      const playerY = player.exists() ? player.pos.y : 0
      const playerExists = player.exists()
      
      for (const coin of coins) {
        if (!coin.exists()) continue
        
        const pastBottom = updateCoin(k, coin, gameSpeed, dt)
        if (pastBottom) {
          coin.destroy()
          scoring.breakCombo()
          continue
        }

        // Collision check with player (only if player exists and coin is near player Y)
        if (!playerExists) continue
        const dy = Math.abs(coin.pos.y - playerY)
        if (dy > 60) continue // Early exit if not close enough vertically
        
        const dx = Math.abs(coin.pos.x - playerX)
        if (dx < 35 && dy < 45) {
          createCoinCollectEffect(k, coin.pos.x, coin.pos.y, scoring.getMultiplier())
          coin.destroy()
          scoring.addCoin()
        }
      }

      // Update obstacles - get once, iterate with early exits
      const obstacles = k.get('obstacle')
      const currentLane = lanes.getCurrentLane()
      
      for (const obs of obstacles) {
        if (!obs.exists()) continue
        
        const pastBottom = updateObstacle(k, obs, gameSpeed, dt)
        if (pastBottom) {
          obs.destroy()
          continue
        }

        // Early exit: skip collision check if not in player's lane
        if (obs.lane !== currentLane) continue
        if (!playerExists) continue

        const obsY = Math.abs(obs.baseY - GAME_CONFIG.PLAYER_Y)
        if (obsY > 40) continue

        // Check obstacle type vs player action
        const type = obs.obstacleType as string
        if (type === 'stone_wall' && isJumping) continue
        if (type === 'low_beam' && isSliding) continue

        // COLLISION - HIT
        handleHit(obs)
        break
      }
    })

    // === HIT HANDLER (loses a life, or dies) ===
    function handleHit(obs: GameObj) {
      if (isDead) return

      const stillAlive = scoring.loseLife()

      // Update heart display
      const currentLives = scoring.getLives()
      for (let i = 0; i < hearts.length; i++) {
        const heart = hearts[i]
        if (heart && heart.exists()) {
          heart.opacity = i < currentLives ? 1 : 0.2
        }
      }

      // Destroy the obstacle that hit us
      if (obs.exists()) obs.destroy()

      if (stillAlive) {
        // Flash red briefly + shake (hit feedback)
        k.shake(5)
        const hitFlash = k.add([
          k.rect(GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT),
          k.pos(0, 0),
          k.color(220, 40, 40),
          k.opacity(0.3),
          k.z(250),
        ])
        k.wait(0.15, () => { if (hitFlash.exists()) hitFlash.destroy() })

        // Brief invulnerability
        isDead = true
        if (player.exists()) {
          // Blink player
          let blinkCount = 0
          const blinkInterval = setInterval(() => {
            if (player.exists()) {
              player.opacity = player.opacity < 0.5 ? 1 : 0.3
            }
            blinkCount++
            if (blinkCount >= 8) {
              clearInterval(blinkInterval)
              if (player.exists()) player.opacity = 1
              isDead = false
            }
          }, 80)
        }
      } else {
        // Final death
        isDead = true
        const finalScore = scoring.finalize()
        const px = player.exists() ? player.pos.x : GAME_CONFIG.VANISHING_POINT_X
        const py = player.exists() ? player.pos.y : GAME_CONFIG.PLAYER_Y

        if (player.exists()) {
          player.destroy()
        }

        const payload: DeathPayload = {
          score: finalScore,
          coins: scoring.getCoins(),
          isNewHigh: scoring.isNewHighScore(),
          playerX: px,
          playerY: py,
        }

        k.go('death', payload)
      }
    }
  })
}

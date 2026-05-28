import type { KAPLAYCtx, GameObj } from 'kaplay'
import { GAME_CONFIG, getDepthScale, getTrackWidthAtDepth, getLaneXAtDepth } from '../config'
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

    // === SKY GRADIENT BACKGROUND ===
    // Top (light blue sky)
    k.add([
      k.rect(GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT * 0.35),
      k.pos(0, 0),
      k.color(...C.SKY_TOP),
      k.z(0),
    ])
    // Middle (warm peach)
    k.add([
      k.rect(GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT * 0.25),
      k.pos(0, GAME_CONFIG.HEIGHT * 0.3),
      k.color(...C.SKY_MID),
      k.z(0),
    ])
    // Bottom horizon (sunset orange)
    k.add([
      k.rect(GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT * 0.5),
      k.pos(0, GAME_CONFIG.HEIGHT * 0.5),
      k.color(...C.SKY_BOTTOM),
      k.z(0),
    ])

    // === CITY SKYLINE (Parallax layers) ===
    // Far buildings (darkest, smallest)
    const farBuildings: GameObj[] = []
    for (let i = 0; i < 12; i++) {
      const bw = k.rand(25, 50)
      const bh = k.rand(40, 90)
      const building = k.add([
        k.rect(bw, bh),
        k.pos(i * 55 - 30, GAME_CONFIG.LANE_Y_TOP - bh + 40),
        k.anchor('bot'),
        k.color(...C.BUILDING_FAR),
        k.opacity(0.7),
        k.z(1),
      ])
      // Random lit windows
      if (k.rand(0, 1) > 0.5) {
        building.add([
          k.rect(4, 5),
          k.color(...C.BUILDING_ACCENT),
          k.pos(k.rand(4, bw - 8), -k.rand(10, bh - 10)),
          k.opacity(0.8),
        ])
      }
      farBuildings.push(building)
    }

    // Mid buildings
    const midBuildings: GameObj[] = []
    for (let i = 0; i < 8; i++) {
      const bw = k.rand(35, 70)
      const bh = k.rand(50, 100)
      const building = k.add([
        k.rect(bw, bh),
        k.pos(i * 85 - 20, GAME_CONFIG.LANE_Y_TOP - bh + 60),
        k.anchor('bot'),
        k.color(...C.BUILDING_MID),
        k.opacity(0.8),
        k.z(2),
      ])
      // Windows
      for (let w = 0; w < 3; w++) {
        if (k.rand(0, 1) > 0.4) {
          building.add([
            k.rect(5, 6),
            k.color(...C.BUILDING_ACCENT),
            k.pos(8 + w * 12, -k.rand(15, bh - 15)),
            k.opacity(k.rand(0.5, 0.9)),
          ])
        }
      }
      midBuildings.push(building)
    }

    // === SUN/MOON ===
    k.add([
      k.rect(50, 50),
      k.pos(480, 80),
      k.anchor('center'),
      k.color(255, 240, 200),
      k.opacity(0.9),
      k.z(1),
    ])
    // Sun glow
    k.add([
      k.rect(70, 70),
      k.pos(480, 80),
      k.anchor('center'),
      k.color(255, 220, 150),
      k.opacity(0.3),
      k.z(0),
    ])

    // === TRACK/RAILWAY ===
    // Track bed (gravel area)
    const trackLines: GameObj[] = []
    for (let i = 0; i < 16; i++) {
      const progress = i / 16
      const y = GAME_CONFIG.LANE_Y_TOP + progress * (GAME_CONFIG.LANE_Y_BOTTOM - GAME_CONFIG.LANE_Y_TOP)
      const width = getTrackWidthAtDepth(y)

      const trackLine = k.add([
        k.rect(width, 4 + progress * 12),
        k.pos(GAME_CONFIG.VANISHING_POINT_X, y),
        k.anchor('center'),
        k.color(...C.TRACK_MAIN),
        k.z(3),
        { baseProgress: progress },
      ])
      trackLines.push(trackLine)
    }

    // Side walls/fences (perspective)
    // Left fence posts
    for (let i = 0; i < 8; i++) {
      const progress = i / 8
      const y = GAME_CONFIG.LANE_Y_TOP + progress * (GAME_CONFIG.LANE_Y_BOTTOM - GAME_CONFIG.LANE_Y_TOP)
      const scale = getDepthScale(y)
      const x = getLaneXAtDepth(-1, y) - 50 * scale

      k.add([
        k.rect(8 * scale, 60 * scale),
        k.pos(x, y),
        k.anchor('bot'),
        k.color(80, 70, 65),
        k.opacity(0.5 + progress * 0.3),
        k.z(4),
      ])
    }

    // Right fence posts
    for (let i = 0; i < 8; i++) {
      const progress = i / 8
      const y = GAME_CONFIG.LANE_Y_TOP + progress * (GAME_CONFIG.LANE_Y_BOTTOM - GAME_CONFIG.LANE_Y_TOP)
      const scale = getDepthScale(y)
      const x = getLaneXAtDepth(3, y) + 50 * scale

      k.add([
        k.rect(8 * scale, 60 * scale),
        k.pos(x, y),
        k.anchor('bot'),
        k.color(80, 70, 65),
        k.opacity(0.5 + progress * 0.3),
        k.z(4),
      ])
    }

    // === RAILS (metal tracks) ===
    const rails: GameObj[] = []
    for (let i = 0; i < 12; i++) {
      const progress = i / 12
      const y = GAME_CONFIG.LANE_Y_TOP + progress * (GAME_CONFIG.LANE_Y_BOTTOM - GAME_CONFIG.LANE_Y_TOP)
      const scale = getDepthScale(y)

      // Left rail
      const leftRail = k.add([
        k.rect(60 * scale, 3),
        k.pos(getLaneXAtDepth(0, y) - 35 * scale, y),
        k.anchor('center'),
        k.color(...C.TRACK_RAIL),
        k.opacity(0.4 + progress * 0.4),
        k.z(5),
        { baseProgress: progress, side: 'left' },
      ])
      rails.push(leftRail)

      // Right rail
      const rightRail = k.add([
        k.rect(60 * scale, 3),
        k.pos(getLaneXAtDepth(2, y) + 35 * scale, y),
        k.anchor('center'),
        k.color(...C.TRACK_RAIL),
        k.opacity(0.4 + progress * 0.4),
        k.z(5),
        { baseProgress: progress, side: 'right' },
      ])
      rails.push(rightRail)
    }

    // === LANE DIVIDERS (white dashed lines) ===
    const laneDividers: GameObj[] = []
    for (let i = 0; i < 10; i++) {
      const progress = i / 10
      const y = GAME_CONFIG.LANE_Y_TOP + progress * (GAME_CONFIG.LANE_Y_BOTTOM - GAME_CONFIG.LANE_Y_TOP)
      const scale = getDepthScale(y)

      // Left lane divider
      const leftDiv = k.add([
        k.rect(40 * scale, 4),
        k.pos(getLaneXAtDepth(0.5, y), y),
        k.anchor('center'),
        k.color(...C.LANE_LINE),
        k.opacity(0.3 + progress * 0.4),
        k.z(6),
        { baseProgress: progress },
      ])
      laneDividers.push(leftDiv)

      // Right lane divider
      const rightDiv = k.add([
        k.rect(40 * scale, 4),
        k.pos(getLaneXAtDepth(1.5, y), y),
        k.anchor('center'),
        k.color(...C.LANE_LINE),
        k.opacity(0.3 + progress * 0.4),
        k.z(6),
        { baseProgress: progress },
      ])
      laneDividers.push(rightDiv)
    }

    // === SLEEPERS (railroad ties) ===
    const sleepers: GameObj[] = []
    for (let i = 0; i < 14; i++) {
      const progress = i / 14
      const y = GAME_CONFIG.LANE_Y_TOP + progress * (GAME_CONFIG.LANE_Y_BOTTOM - GAME_CONFIG.LANE_Y_TOP)
      const width = getTrackWidthAtDepth(y) * 0.9

      const sleeper = k.add([
        k.rect(width, 6 + progress * 4),
        k.pos(GAME_CONFIG.VANISHING_POINT_X, y),
        k.anchor('center'),
        k.color(...C.TRACK_SLEEPER),
        k.opacity(0.3 + progress * 0.5),
        k.z(4),
        { baseProgress: progress },
      ])
      sleepers.push(sleeper)
    }

    // Animation offset for track movement
    let trackOffset = 0

    // === AMBIENT PARTICLES (dust, leaves) ===
    for (let i = 0; i < 8; i++) {
      const particle = k.add([
        k.rect(k.rand(3, 6), k.rand(3, 6)),
        k.pos(k.rand(50, 550), k.rand(200, 700)),
        k.anchor('center'),
        k.color(...C.DUST),
        k.opacity(k.rand(0.15, 0.3)),
        k.z(7),
      ])

      const baseX = particle.pos.x
      let driftTime = k.rand(0, 10)

      particle.onUpdate(() => {
        driftTime += k.dt() * 0.8
        particle.pos.x = baseX + Math.sin(driftTime) * 20
        particle.pos.y += k.dt() * 15
        if (particle.pos.y > 750) {
          particle.pos.y = 200
          particle.pos.x = k.rand(50, 550)
        }
      })
    }

    // === PLAYER ===
    const player = createPlayer(k)

    // === HUD ===
    // Score background panel
    k.add([
      k.rect(140, 44),
      k.pos(GAME_CONFIG.WIDTH / 2, 32),
      k.anchor('center'),
      k.color(...C.UI_PANEL),
      k.opacity(0.5),
      k.z(200),
    ])

    // Score text shadow
    k.add([
      k.text('0', { size: 30 }),
      k.pos(GAME_CONFIG.WIDTH / 2 + 2, 34),
      k.anchor('center'),
      k.color(...C.TEXT_SHADOW),
      k.opacity(0.5),
      k.z(200),
    ])

    const scoreText = k.add([
      k.text('0', { size: 30 }),
      k.pos(GAME_CONFIG.WIDTH / 2, 32),
      k.anchor('center'),
      k.color(...C.TEXT_WHITE),
      k.z(201),
    ])

    // Coin display (top left)
    // Coin icon background
    k.add([
      k.rect(80, 36),
      k.pos(50, 32),
      k.anchor('center'),
      k.color(...C.UI_PANEL),
      k.opacity(0.5),
      k.z(200),
    ])

    // Coin icon
    k.add([
      k.rect(18, 18),
      k.pos(22, 32),
      k.anchor('center'),
      k.color(...C.COIN_GOLD),
      k.z(201),
    ])
    k.add([
      k.rect(14, 14),
      k.pos(22, 32),
      k.anchor('center'),
      k.color(...C.COIN_DARK),
      k.opacity(0.4),
      k.z(201),
    ])

    const coinText = k.add([
      k.text('0', { size: 22 }),
      k.pos(42, 32),
      k.anchor('left'),
      k.color(...C.TEXT_GOLD),
      k.z(201),
    ])

    // Hearts (lives) - top right
    const hearts: GameObj[] = []
    const heartBg = k.add([
      k.rect(90, 36),
      k.pos(GAME_CONFIG.WIDTH - 55, 32),
      k.anchor('center'),
      k.color(...C.UI_PANEL),
      k.opacity(0.5),
      k.z(200),
    ])

    for (let i = 0; i < 3; i++) {
      const heart = k.add([
        k.rect(20, 18),
        k.pos(GAME_CONFIG.WIDTH - 28 - i * 26, 32),
        k.anchor('center'),
        k.color(...C.HEART_RED),
        k.opacity(1),
        k.z(201),
      ])
      // Heart shape (top bumps)
      heart.add([
        k.rect(8, 8),
        k.pos(-5, -8),
        k.anchor('center'),
        k.color(...C.HEART_RED),
      ])
      heart.add([
        k.rect(8, 8),
        k.pos(5, -8),
        k.anchor('center'),
        k.color(...C.HEART_RED),
      ])
      // Highlight
      heart.add([
        k.rect(4, 4),
        k.pos(-4, -4),
        k.anchor('center'),
        k.color(...C.HEART_PINK),
        k.opacity(0.7),
      ])
      hearts.push(heart)
    }

    let comboText: GameObj | null = null

    // === SPEED LINES (at higher speeds) ===
    let speedLineCount = 0

    // === GAME LOOP ===
    k.onUpdate(() => {
      if (isDead) return

      const rawDt = k.dt()
      const dt = Math.min(rawDt, 0.05)

      // Increase speed over time
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
        player.angle = lanes.getTilt()

        // Ghost trail during lane change
        if (lanes.isLaneChanging()) {
          ghostTimer += dt
          if (ghostTimer >= 0.05) {
            ghostTimer = 0
            k.add([
              k.rect(40, 70),
              k.pos(player.pos.x, player.pos.y - 35),
              k.anchor('center'),
              k.color(...C.TRAIL_BLUE),
              k.opacity(0.25),
              k.rotate(player.angle),
              k.z(90),
              k.lifespan(0.1, { fade: 0.08 }),
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
            k.text(`x${mult}`, { size: 24 }),
            k.pos(GAME_CONFIG.WIDTH / 2, 65),
            k.anchor('center'),
            k.color(...C.COMBO_GREEN),
            k.z(201),
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

      // === TRACK ANIMATION ===
      trackOffset += dt * gameSpeed * 0.08
      if (trackOffset > 1) trackOffset -= 1

      // Update sleepers (moving toward player)
      for (const sleeper of sleepers) {
        if (!sleeper.exists()) continue
        let progress = (sleeper.baseProgress + trackOffset) % 1
        const y = GAME_CONFIG.LANE_Y_TOP + progress * (GAME_CONFIG.LANE_Y_BOTTOM - GAME_CONFIG.LANE_Y_TOP)
        const width = getTrackWidthAtDepth(y) * 0.9
        sleeper.pos.y = y
        sleeper.width = width
        sleeper.opacity = 0.3 + progress * 0.5
      }

      // Update lane dividers
      for (const div of laneDividers) {
        if (!div.exists()) continue
        let progress = (div.baseProgress + trackOffset) % 1
        const y = GAME_CONFIG.LANE_Y_TOP + progress * (GAME_CONFIG.LANE_Y_BOTTOM - GAME_CONFIG.LANE_Y_TOP)
        const scale = getDepthScale(y)
        div.pos.y = y
        div.width = 40 * scale
        div.opacity = 0.3 + progress * 0.4
      }

      // Parallax building movement (subtle)
      const parallaxSpeed = gameSpeed * dt * 0.5
      for (const building of farBuildings) {
        if (!building.exists()) continue
        building.pos.x -= parallaxSpeed * 0.3
        if (building.pos.x < -60) building.pos.x = GAME_CONFIG.WIDTH + 30
      }
      for (const building of midBuildings) {
        if (!building.exists()) continue
        building.pos.x -= parallaxSpeed * 0.5
        if (building.pos.x < -80) building.pos.x = GAME_CONFIG.WIDTH + 50
      }

      // Speed lines (only above speed 6)
      if (gameSpeed > 6 && speedLineCount < 6 && k.rand(0, 1) < 0.1) {
        speedLineCount++
        const sl = k.add([
          k.rect(2, k.rand(40, 80)),
          k.pos(k.rand(80, 520), -30),
          k.anchor('center'),
          k.color(...C.SPEED_LINE),
          k.opacity(0.25),
          k.lifespan(0.3, { fade: 0.2 }),
          k.move(k.Vec2.DOWN, 900),
          k.z(8),
        ])
        sl.onDestroy(() => { speedLineCount-- })
      }

      // === UPDATE COINS ===
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

        if (!playerExists) continue
        const dy = Math.abs(coin.pos.y - playerY)
        if (dy > 70) continue

        const dx = Math.abs(coin.pos.x - playerX)
        if (dx < 40 && dy < 50) {
          createCoinCollectEffect(k, coin.pos.x, coin.pos.y, scoring.getMultiplier())
          coin.destroy()
          scoring.addCoin()
        }
      }

      // === UPDATE OBSTACLES ===
      const obstacles = k.get('obstacle')
      const currentLane = lanes.getCurrentLane()

      for (const obs of obstacles) {
        if (!obs.exists()) continue

        const pastBottom = updateObstacle(k, obs, gameSpeed, dt)
        if (pastBottom) {
          obs.destroy()
          continue
        }

        if (obs.lane !== currentLane) continue
        if (!playerExists) continue

        const obsY = Math.abs(obs.baseY - GAME_CONFIG.PLAYER_Y)
        if (obsY > 45) continue

        // Check obstacle type vs player action
        const type = obs.obstacleType as string
        // Trains and barriers: must jump over
        if ((type === 'train_blue' || type === 'train_red' || type === 'barrier') && isJumping) continue
        // Low barriers: must slide under
        if (type === 'low_barrier' && isSliding) continue

        // COLLISION - HIT
        handleHit(obs)
        break
      }
    })

    // === HIT HANDLER ===
    function handleHit(obs: GameObj) {
      if (isDead) return

      const stillAlive = scoring.loseLife()

      // Update heart display
      const currentLives = scoring.getLives()
      for (let i = 0; i < hearts.length; i++) {
        const heart = hearts[i]
        if (heart && heart.exists()) {
          heart.opacity = i < currentLives ? 1 : 0.25
        }
      }

      if (obs.exists()) obs.destroy()

      if (stillAlive) {
        // Hit feedback
        k.shake(8)
        const hitFlash = k.add([
          k.rect(GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT),
          k.pos(0, 0),
          k.color(255, 50, 50),
          k.opacity(0.35),
          k.z(250),
        ])
        k.tween(
          0.35,
          0,
          0.2,
          (v) => { if (hitFlash.exists()) hitFlash.opacity = v },
          k.easings.easeOutQuad
        ).then(() => { if (hitFlash.exists()) hitFlash.destroy() })

        // Brief invulnerability with blinking
        isDead = true
        if (player.exists()) {
          let blinkCount = 0
          const blinkInterval = setInterval(() => {
            if (player.exists()) {
              player.opacity = player.opacity < 0.5 ? 1 : 0.3
            }
            blinkCount++
            if (blinkCount >= 10) {
              clearInterval(blinkInterval)
              if (player.exists()) player.opacity = 1
              isDead = false
            }
          }, 70)
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

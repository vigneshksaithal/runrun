import type { KAPLAYCtx, GameObj } from 'kaplay'
import { GAME_CONFIG } from '../config'
import { createPlayer, jumpPlayer, slidePlayer } from '../objects/player'
import type { DeathPayload } from './death'
import { updateCoin, createCoinCollectEffect } from '../objects/collectible'
import { updateObstacle } from '../objects/obstacle'
import { createInputSystem } from '../systems/input'
import { createLaneSystem } from '../systems/lanes'
import { createScoringSystem } from '../systems/scoring'
import { createSpawnerSystem } from '../systems/spawner'
import { createScenery } from '../systems/scenery'

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

    // === WORLD (sky, sun, clouds, hills, railway track, rails, sleepers, side props) ===
    const scenery = createScenery(k)

    // === PLAYER ===
    const player = createPlayer(k)

    // ============================================================
    // HUD (Subway-Surfers style)
    // ============================================================
    // Pause button (top-left)
    const pauseBtn = k.add([
      k.rect(40, 40, { radius: 10 }),
      k.pos(28, 22),
      k.color(...C.PANEL),
      k.opacity(0.82),
      k.z(200),
    ])
    pauseBtn.add([k.rect(6, 18, { radius: 2 }), k.anchor('center'), k.pos(14, 20), k.color(...C.TEXT_WHITE)])
    pauseBtn.add([k.rect(6, 18, { radius: 2 }), k.anchor('center'), k.pos(26, 20), k.color(...C.TEXT_WHITE)])

    // Score (top-center, zero-padded, with a soft shadow for readability)
    const scoreShadow = k.add([
      k.text('000000', { size: 34 }),
      k.pos(GAME_CONFIG.WIDTH / 2 + 2, 30),
      k.anchor('center'),
      k.color(...C.TEXT_DARK),
      k.opacity(0.45),
      k.z(200),
    ])
    const scoreText = k.add([
      k.text('000000', { size: 34 }),
      k.pos(GAME_CONFIG.WIDTH / 2, 28),
      k.anchor('center'),
      k.color(...C.TEXT_WHITE),
      k.z(201),
    ])

    // Coin counter (top-right)
    k.add([
      k.circle(10),
      k.pos(GAME_CONFIG.WIDTH - 92, 32),
      k.anchor('center'),
      k.color(...C.COIN),
      k.outline(2, k.rgb(...C.COIN_DARK)),
      k.z(201),
    ])
    const coinText = k.add([
      k.text('0', { size: 24 }),
      k.pos(GAME_CONFIG.WIDTH - 78, 32),
      k.anchor('left'),
      k.color(...C.TEXT_WHITE),
      k.z(201),
    ])

    // High score panel (top-right, under coins)
    k.add([
      k.text('BEST', { size: 12 }),
      k.pos(GAME_CONFIG.WIDTH - 20, 58),
      k.anchor('right'),
      k.color(...C.SKY_LOW),
      k.z(201),
    ])
    k.add([
      k.text(String(scoring.getHighScore()), { size: 18 }),
      k.pos(GAME_CONFIG.WIDTH - 20, 76),
      k.anchor('right'),
      k.color(...C.TEXT_GOLD),
      k.z(201),
    ])

    // Lives (hearts, top-left under pause)
    const hearts: GameObj[][] = []
    for (let i = 0; i < 3; i++) {
      const hx = 30 + i * 24
      const hy = 80
      const parts: GameObj[] = []
      parts.push(k.add([k.circle(5), k.pos(hx - 4, hy - 2), k.anchor('center'), k.color(...C.HEART), k.opacity(1), k.z(201)]))
      parts.push(k.add([k.circle(5), k.pos(hx + 4, hy - 2), k.anchor('center'), k.color(...C.HEART), k.opacity(1), k.z(201)]))
      parts.push(k.add([
        k.polygon([k.vec2(-8, -1), k.vec2(8, -1), k.vec2(0, 9)]),
        k.pos(hx, hy), k.color(...C.HEART), k.opacity(1), k.z(201),
      ]))
      hearts.push(parts)
    }

    let comboText: GameObj | null = null

    // ============================================================
    // GAME LOOP
    // ============================================================
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

        // Ghost trail during lane change
        if (lanes.isLaneChanging()) {
          ghostTimer += dt
          if (ghostTimer >= 0.06) {
            ghostTimer = 0
            k.add([
              k.rect(36, 60, { radius: 6 }),
              k.pos(player.pos.x, player.pos.y - 30),
              k.anchor('center'),
              k.color(...C.HOODIE),
              k.opacity(0.25),
              k.rotate(player.angle),
              k.z(90),
              k.lifespan(0.12, { fade: 0.1 }),
            ])
          }
        } else {
          ghostTimer = 0
        }
      }

      // Update scoring + HUD
      scoring.addDistance(dt)
      const scoreStr = String(scoring.getScore()).padStart(6, '0')
      scoreText.text = scoreStr
      scoreShadow.text = scoreStr
      coinText.text = String(scoring.getCoins())

      // Combo display
      const mult = scoring.getMultiplier()
      if (mult > 1) {
        if (!comboText) {
          comboText = k.add([
            k.text(`x${mult}`, { size: 26 }),
            k.pos(GAME_CONFIG.WIDTH / 2, 64),
            k.anchor('center'),
            k.color(...C.COMBO_TEXT),
            k.z(201),
          ])
        } else {
          comboText.text = `x${mult}`
        }
      } else if (comboText && comboText.exists()) {
        comboText.destroy()
        comboText = null
      }

      // Update spawner + world motion
      spawner.update(dt, gameSpeed)
      scenery.update(dt, gameSpeed)

      // Update coins
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
        if (dy > 60) continue

        const dx = Math.abs(coin.pos.x - playerX)
        if (dx < 35 && dy < 45) {
          createCoinCollectEffect(k, coin.pos.x, coin.pos.y, scoring.getMultiplier())
          coin.destroy()
          scoring.addCoin()
        }
      }

      // Update obstacles
      const obstacles = k.get('obstacle')
      const currentLane = lanes.getCurrentLane()

      for (const obs of obstacles) {
        if (!obs.exists()) continue

        const pastBottom = updateObstacle(k, obs, gameSpeed, dt)
        if (pastBottom) {
          obs.destroy()
          continue
        }

        // Skip collision check if not in player's lane
        if (obs.lane !== currentLane) continue
        if (!playerExists) continue

        const obsY = Math.abs(obs.baseY - GAME_CONFIG.PLAYER_Y)
        if (obsY > 40) continue

        // Check obstacle type vs player action
        const type = obs.obstacleType as string
        if (type === 'jump_barrier' && isJumping) continue
        if (type === 'slide_gate' && isSliding) continue
        // 'train' must be dodged by switching lanes

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
        const parts = hearts[i]
        if (!parts) continue
        const op = i < currentLives ? 1 : 0.18
        for (const part of parts) {
          if (part.exists()) part.opacity = op
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

        // Brief invulnerability with blink
        isDead = true
        if (player.exists()) {
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
        const isNewHigh = scoring.isNewHighScore()
        const finalScore = scoring.finalize()
        const px = player.exists() ? player.pos.x : GAME_CONFIG.VANISHING_POINT_X
        const py = player.exists() ? player.pos.y : GAME_CONFIG.PLAYER_Y

        if (player.exists()) {
          player.destroy()
        }

        const payload: DeathPayload = {
          score: finalScore,
          coins: scoring.getCoins(),
          isNewHigh,
          playerX: px,
          playerY: py,
        }

        k.go('death', payload)
      }
    }
  })
}

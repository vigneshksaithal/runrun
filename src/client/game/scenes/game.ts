import type { KAPLAYCtx, GameObj } from 'kaplay'
import { GAME_CONFIG, getDepthScale, getLaneXAtDepth, getTrackWidthAtDepth } from '../config'
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

    // Systems
    const input = createInputSystem(k)
    const lanes = createLaneSystem()
    const scoring = createScoringSystem()
    const spawner = createSpawnerSystem(k)

    // === BACKGROUND - Sky ===
    k.add([
      k.rect(GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT * 0.4),
      k.pos(0, 0),
      k.color(...C.SKY_TOP),
      k.z(0),
    ])
    k.add([
      k.rect(GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT * 0.6),
      k.pos(0, GAME_CONFIG.HEIGHT * 0.4),
      k.color(...C.SKY_BOTTOM),
      k.z(0),
    ])

    // === GROUND ===
    k.add([
      k.rect(GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT - GAME_CONFIG.LANE_Y_TOP + 50),
      k.pos(0, GAME_CONFIG.LANE_Y_TOP - 50),
      k.color(...C.GROUND),
      k.z(1),
    ])

    // === TRACK (3D perspective trapezoid simulated with lines) ===
    // Draw track segments from far to near
    for (let i = 0; i < 20; i++) {
      const progress = i / 20
      const y = GAME_CONFIG.LANE_Y_TOP + progress * (GAME_CONFIG.LANE_Y_BOTTOM - GAME_CONFIG.LANE_Y_TOP)
      const width = getTrackWidthAtDepth(y)

      k.add([
        k.rect(width + 20, 4 + progress * 8),
        k.pos(GAME_CONFIG.VANISHING_POINT_X, y),
        k.anchor('center'),
        k.color(...C.TRACK),
        k.opacity(0.4 + progress * 0.4),
        k.z(2),
      ])
    }

    // === RAILS ===
    for (let i = 0; i < 15; i++) {
      const progress = i / 15
      const y = GAME_CONFIG.LANE_Y_TOP + progress * (GAME_CONFIG.LANE_Y_BOTTOM - GAME_CONFIG.LANE_Y_TOP)
      const scale = getDepthScale(y)

      // Left rail
      k.add([
        k.rect(50 * scale, 3),
        k.pos(getLaneXAtDepth(0, y) - 40 * scale, y),
        k.anchor('center'),
        k.color(...C.RAIL),
        k.opacity(0.3 + progress * 0.5),
        k.z(3),
      ])

      // Right rail
      k.add([
        k.rect(50 * scale, 3),
        k.pos(getLaneXAtDepth(2, y) + 40 * scale, y),
        k.anchor('center'),
        k.color(...C.RAIL),
        k.opacity(0.3 + progress * 0.5),
        k.z(3),
      ])
    }

    // === LANE DIVIDERS (animated) ===
    const laneLines: GameObj[] = []
    for (let i = 0; i < GAME_CONFIG.ROAD_LINE_COUNT; i++) {
      const progress = i / GAME_CONFIG.ROAD_LINE_COUNT
      const y = GAME_CONFIG.LANE_Y_TOP + progress * (GAME_CONFIG.LANE_Y_BOTTOM - GAME_CONFIG.LANE_Y_TOP)
      const scale = getDepthScale(y)

      // Left lane line
      const leftLine = k.add([
        k.rect(30 * scale, 3),
        k.pos(getLaneXAtDepth(0.5, y), y),
        k.anchor('center'),
        k.color(...C.LANE_LINE),
        k.opacity(0.2 + progress * 0.4),
        k.z(4),
        { baseProgress: progress },
      ])
      laneLines.push(leftLine)

      // Right lane line
      const rightLine = k.add([
        k.rect(30 * scale, 3),
        k.pos(getLaneXAtDepth(1.5, y), y),
        k.anchor('center'),
        k.color(...C.LANE_LINE),
        k.opacity(0.2 + progress * 0.4),
        k.z(4),
        { baseProgress: progress },
      ])
      laneLines.push(rightLine)
    }

    let lineOffset = 0

    // === PLAYER ===
    const player = createPlayer(k)

    // === HUD ===
    // Score panel
    k.add([
      k.rect(130, 40),
      k.pos(GAME_CONFIG.WIDTH / 2, 30),
      k.anchor('center'),
      k.color(...C.PANEL),
      k.opacity(0.5),
      k.z(200),
    ])

    const scoreText = k.add([
      k.text('0', { size: 28 }),
      k.pos(GAME_CONFIG.WIDTH / 2, 30),
      k.anchor('center'),
      k.color(...C.TEXT_WHITE),
      k.z(201),
    ])

    // Coin display
    k.add([
      k.rect(70, 32),
      k.pos(45, 30),
      k.anchor('center'),
      k.color(...C.PANEL),
      k.opacity(0.5),
      k.z(200),
    ])

    k.add([
      k.circle(10),
      k.pos(22, 30),
      k.anchor('center'),
      k.color(...C.COIN),
      k.z(201),
    ])

    const coinText = k.add([
      k.text('0', { size: 20 }),
      k.pos(40, 30),
      k.anchor('left'),
      k.color(...C.TEXT_GOLD),
      k.z(201),
    ])

    // Hearts
    const hearts: GameObj[] = []
    k.add([
      k.rect(80, 32),
      k.pos(GAME_CONFIG.WIDTH - 50, 30),
      k.anchor('center'),
      k.color(...C.PANEL),
      k.opacity(0.5),
      k.z(200),
    ])

    for (let i = 0; i < 3; i++) {
      const heart = k.add([
        k.rect(18, 16),
        k.pos(GAME_CONFIG.WIDTH - 25 - i * 22, 30),
        k.anchor('center'),
        k.color(...C.HEART),
        k.z(201),
      ])
      hearts.push(heart)
    }

    let comboText: GameObj | null = null

    // === GAME LOOP ===
    k.onUpdate(() => {
      if (isDead) return

      const dt = Math.min(k.dt(), 0.05)

      // Speed up
      gameSpeed = Math.min(gameSpeed + GAME_CONFIG.SPEED_INCREASE_RATE * dt, GAME_CONFIG.MAX_SPEED)

      // Input
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
      }

      // Update scoring
      scoring.addDistance(dt)
      scoreText.text = String(scoring.getScore())
      coinText.text = String(scoring.getCoins())

      // Combo
      const mult = scoring.getMultiplier()
      if (mult > 1) {
        if (!comboText) {
          comboText = k.add([
            k.text(`x${mult}`, { size: 22 }),
            k.pos(GAME_CONFIG.WIDTH / 2, 60),
            k.anchor('center'),
            k.color(...C.COMBO),
            k.z(201),
          ])
        } else {
          comboText.text = `x${mult}`
        }
      } else if (comboText?.exists()) {
        comboText.destroy()
        comboText = null
      }

      // Spawner
      spawner.update(dt, gameSpeed)

      // Animate lane lines
      lineOffset += dt * gameSpeed * 0.08
      if (lineOffset > 1) lineOffset -= 1

      for (const line of laneLines) {
        if (!line.exists()) continue
        const progress = (line.baseProgress + lineOffset) % 1
        const y = GAME_CONFIG.LANE_Y_TOP + progress * (GAME_CONFIG.LANE_Y_BOTTOM - GAME_CONFIG.LANE_Y_TOP)
        const scale = getDepthScale(y)
        line.pos.y = y
        line.width = 30 * scale
        line.opacity = 0.2 + progress * 0.4
      }

      // Update coins
      const coins = k.get('coin')
      for (const coin of coins) {
        if (!coin.exists()) continue

        if (updateCoin(k, coin, gameSpeed, dt)) {
          coin.destroy()
          scoring.breakCombo()
          continue
        }

        if (!player.exists()) continue
        const dx = Math.abs(coin.pos.x - player.pos.x)
        const dy = Math.abs(coin.pos.y - player.pos.y)
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

        if (updateObstacle(k, obs, gameSpeed, dt)) {
          obs.destroy()
          continue
        }

        if (obs.lane !== currentLane) continue
        if (!player.exists()) continue

        const obsY = Math.abs(obs.baseY - GAME_CONFIG.PLAYER_Y)
        if (obsY > 40) continue

        // Check collision based on obstacle type
        const type = obs.obstacleType as string
        if ((type === 'train' || type === 'barrier') && isJumping) continue
        if (type === 'low_barrier' && isSliding) continue

        // HIT
        handleHit(obs)
        break
      }
    })

    function handleHit(obs: GameObj) {
      if (isDead) return

      const stillAlive = scoring.loseLife()

      // Update hearts
      const lives = scoring.getLives()
      for (let i = 0; i < hearts.length; i++) {
        if (hearts[i]?.exists()) {
          hearts[i].opacity = i < lives ? 1 : 0.2
        }
      }

      if (obs.exists()) obs.destroy()

      if (stillAlive) {
        k.shake(6)

        // Flash
        const flash = k.add([
          k.rect(GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT),
          k.pos(0, 0),
          k.color(255, 50, 50),
          k.opacity(0.3),
          k.z(250),
        ])
        k.tween(0.3, 0, 0.2, (v) => {
          if (flash.exists()) flash.opacity = v
        }).then(() => {
          if (flash.exists()) flash.destroy()
        })

        // Brief invulnerability
        isDead = true
        let blinks = 0
        const interval = setInterval(() => {
          if (player.exists()) {
            player.opacity = player.opacity < 0.5 ? 1 : 0.3
          }
          blinks++
          if (blinks >= 8) {
            clearInterval(interval)
            if (player.exists()) player.opacity = 1
            isDead = false
          }
        }, 80)
      } else {
        // Game over
        isDead = true
        const finalScore = scoring.finalize()

        const payload: DeathPayload = {
          score: finalScore,
          coins: scoring.getCoins(),
          isNewHigh: scoring.isNewHighScore(),
          playerX: player.exists() ? player.pos.x : GAME_CONFIG.VANISHING_POINT_X,
          playerY: player.exists() ? player.pos.y : GAME_CONFIG.PLAYER_Y,
        }

        if (player.exists()) player.destroy()
        k.go('death', payload)
      }
    }
  })
}

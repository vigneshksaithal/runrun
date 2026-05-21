import type { KAPLAYCtx, GameObj } from 'kaplay'
import { GAME_CONFIG, getLaneXAtDepth, getDepthScale } from '../config'
import { createPlayer, jumpPlayer, slidePlayer, createDeathParticles } from '../objects/player'
import { createCoin, updateCoin, createCoinCollectEffect } from '../objects/collectible'
import { createObstacle, updateObstacle, type ObstacleType } from '../objects/obstacle'
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

    // Torch lights (2 per side = 4 total) - bigger flames
    function addTorch(x: number, y: number) {
      // Torch stick
      k.add([
        k.rect(4, 20),
        k.pos(x, y + 14),
        k.anchor('center'),
        k.color(...C.TORCH_STICK),
        k.z(3),
      ])
      // Flame rect (bigger)
      k.add([
        k.rect(10, 16),
        k.pos(x, y),
        k.anchor('center'),
        k.color(...C.TORCH_FLAME),
        k.opacity(0.9),
        k.z(3),
      ])
      // Glow rect (bigger)
      k.add([
        k.rect(28, 28),
        k.pos(x, y),
        k.anchor('center'),
        k.color(...C.TORCH_GLOW),
        k.opacity(0.18),
        k.z(2),
      ])
    }
    addTorch(55, 300)
    addTorch(55, 550)
    addTorch(GAME_CONFIG.WIDTH - 55, 300)
    addTorch(GAME_CONFIG.WIDTH - 55, 550)

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

    let comboText: GameObj | null = null

    // === SPEED LINES (only above speed 8) ===
    const speedLines: GameObj[] = []

    // === GAME LOOP ===
    k.onUpdate(() => {
      if (isDead) return

      const dt = k.dt()

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
      lanes.update()
      if (player.exists()) {
        player.pos.x = lanes.getCurrentX()
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

      // Speed lines (only above speed 8)
      if (gameSpeed > 8) {
        if (speedLines.length < 4 && k.rand(0, 1) < 0.1) {
          const sl = k.add([
            k.rect(2, k.rand(30, 60)),
            k.pos(k.rand(100, 500), -20),
            k.anchor('center'),
            k.color(...C.SPEED_LINE),
            k.opacity(0.3),
            k.scale(1),
            k.lifespan(0.4, { fade: 0.3 }),
            k.z(5),
          ])
          speedLines.push(sl)
          sl.onUpdate(() => {
            sl.pos.y += 800 * dt
          })
          sl.onDestroy(() => {
            const idx = speedLines.indexOf(sl)
            if (idx >= 0) speedLines.splice(idx, 1)
          })
        }
      }

      // Update coins
      const coins = k.get('coin')
      for (const coin of coins) {
        const pastBottom = updateCoin(k, coin, gameSpeed, dt)
        if (pastBottom && coin.exists()) {
          coin.destroy()
          scoring.breakCombo()
          continue
        }

        // Collision check with player
        if (!coin.exists() || !player.exists()) continue
        const dx = Math.abs(coin.pos.x - player.pos.x)
        const dy = Math.abs(coin.pos.y - player.pos.y)
        if (dx < 35 && dy < 45) {
          createCoinCollectEffect(k, coin.pos.x, coin.pos.y)
          coin.destroy()
          scoring.addCoin()
        }
      }

      // Update obstacles
      const obstacles = k.get('obstacle')
      for (const obs of obstacles) {
        const pastBottom = updateObstacle(k, obs, gameSpeed, dt)
        if (pastBottom && obs.exists()) {
          obs.destroy()
          continue
        }

        // Collision check
        if (!obs.exists() || !player.exists()) continue
        if (obs.lane !== lanes.getCurrentLane()) continue

        const dy = Math.abs(obs.baseY - GAME_CONFIG.PLAYER_Y)
        if (dy > 40) continue

        // Check obstacle type vs player action
        const type = obs.obstacleType as string
        if (type === 'stone_wall' && isJumping) continue
        if (type === 'low_beam' && isSliding) continue
        // Pillar: must switch lanes (already checked lane above)

        // COLLISION - DEATH
        handleDeath(obs)
        break
      }
    })

    // === DEATH HANDLER (inline) ===
    function handleDeath(_obs: GameObj) {
      if (isDead) return
      isDead = true

      const finalScore = scoring.finalize()
      const px = player.pos.x
      const py = player.pos.y

      // 1. Explode player into particles
      if (player.exists()) {
        player.destroy()
      }
      createDeathParticles(k, px, py)

      // 2. Screen shake
      k.shake(8)

      // 3. Red flash (0.2s)
      const flash = k.add([
        k.rect(GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT),
        k.pos(0, 0),
        k.color(200, 30, 30),
        k.opacity(0.4),
        k.z(250),
      ])
      k.wait(0.2, () => {
        if (flash.exists()) flash.destroy()
      })

      // 4. Dark overlay with score (0.3s delay)
      k.wait(0.3, () => {
        const overlay = k.add([
          k.rect(GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT),
          k.pos(0, 0),
          k.color(12, 20, 18),
          k.opacity(0.8),
          k.z(260),
        ])
        void overlay

        // Score display
        k.add([
          k.text('GAME OVER', { size: 36 }),
          k.pos(GAME_CONFIG.WIDTH / 2, 280),
          k.anchor('center'),
          k.color(...C.TEXT_WHITE),
          k.z(270),
        ])

        k.add([
          k.text(`Score: ${finalScore}`, { size: 28 }),
          k.pos(GAME_CONFIG.WIDTH / 2, 340),
          k.anchor('center'),
          k.color(...C.TEXT_GOLD),
          k.z(270),
        ])

        if (scoring.isNewHighScore()) {
          k.add([
            k.text('NEW BEST!', { size: 22 }),
            k.pos(GAME_CONFIG.WIDTH / 2, 380),
            k.anchor('center'),
            k.color(...C.COMBO_TEXT),
            k.z(270),
          ])
        }

        k.add([
          k.text(`Coins: ${scoring.getCoins()}`, { size: 20 }),
          k.pos(GAME_CONFIG.WIDTH / 2, 420),
          k.anchor('center'),
          k.color(...C.TEXT_GOLD),
          k.z(270),
        ])

        // 5. TAP TO PLAY pulsing text
        const tapText = k.add([
          k.text('TAP TO PLAY', { size: 24 }),
          k.pos(GAME_CONFIG.WIDTH / 2, 520),
          k.anchor('center'),
          k.color(...C.TEXT_WHITE),
          k.opacity(1),
          k.scale(1),
          k.z(270),
        ])

        let tapPulse = 0
        tapText.onUpdate(() => {
          tapPulse += k.dt() * 3
          tapText.opacity = 0.5 + Math.sin(tapPulse) * 0.5
        })

        // 6. Allow tap to restart
        let canRestart = true
        k.onKeyPress(() => {
          if (canRestart) {
            canRestart = false
            k.go('game')
          }
        })
        k.onMousePress(() => {
          if (canRestart) {
            canRestart = false
            k.go('game')
          }
        })
        k.onTouchStart(() => {
          if (canRestart) {
            canRestart = false
            k.go('game')
          }
        })

        // 7. Auto-restart after 2.0 seconds
        k.wait(2.0, () => {
          if (canRestart) {
            canRestart = false
            k.go('game')
          }
        })
      })
    }
  })
}

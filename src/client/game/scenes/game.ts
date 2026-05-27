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

// Heart icon: 2 small circles forming the lobes + a downward triangle for the
// point. Built as 3 separate children of a parent so we can dim the whole heart
// when a life is lost (parent.opacity controls all children).
function makeHeart(k: KAPLAYCtx, x: number, y: number): GameObj {
  const parent = k.add([
    k.pos(x, y),
    k.anchor('center'),
    k.opacity(1),
    k.z(200),
  ])
  // Left lobe
  parent.add([
    k.circle(5),
    k.color(...C.HEART),
    k.anchor('center'),
    k.pos(-3.5, -2),
  ])
  // Right lobe
  parent.add([
    k.circle(5),
    k.color(...C.HEART),
    k.anchor('center'),
    k.pos(3.5, -2),
  ])
  // Bottom point (downward triangle)
  parent.add([
    k.polygon([
      k.vec2(-7, 0),
      k.vec2(7, 0),
      k.vec2(0, 8),
    ]),
    k.color(...C.HEART),
    k.anchor('center'),
    k.pos(0, 0),
  ])
  return parent
}

// Star icon used as the multiplier badge marker.
function starPts(k: KAPLAYCtx, outerR: number, innerR: number) {
  const pts = []
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outerR : innerR
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    pts.push(k.vec2(Math.cos(a) * r, Math.sin(a) * r))
  }
  return pts
}

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

    // === Distant horizon silhouette band (1 polygon, gives the cavern a "horizon")
    k.add([
      k.polygon([
        k.vec2(80, 0),
        k.vec2(GAME_CONFIG.WIDTH - 80, 0),
        k.vec2(GAME_CONFIG.WIDTH - 130, 14),
        k.vec2(GAME_CONFIG.WIDTH / 2 + 50, 6),
        k.vec2(GAME_CONFIG.WIDTH / 2 + 20, 18),
        k.vec2(GAME_CONFIG.WIDTH / 2 - 20, 8),
        k.vec2(GAME_CONFIG.WIDTH / 2 - 50, 20),
        k.vec2(130, 10),
      ]),
      k.pos(0, GAME_CONFIG.LANE_Y_TOP - 8),
      k.color(...C.SILHOUETTE),
      k.opacity(0.7),
      k.z(2),
    ])

    // === Sun glow at the vanishing point (replaces old "distant sky peek" rect)
    const sun = k.add([
      k.circle(28),
      k.pos(GAME_CONFIG.VANISHING_POINT_X, GAME_CONFIG.LANE_Y_TOP - 10),
      k.anchor('center'),
      k.color(...C.TORCH_GLOW),
      k.opacity(0.35),
      k.z(2),
    ])
    // Inner brighter core
    k.add([
      k.circle(16),
      k.pos(GAME_CONFIG.VANISHING_POINT_X, GAME_CONFIG.LANE_Y_TOP - 10),
      k.anchor('center'),
      k.color(255, 235, 160),
      k.opacity(0.55),
      k.z(2),
    ])
    // Subtle sun pulse so the horizon feels alive
    let sunT = 0
    sun.onUpdate(() => {
      sunT += k.dt() * 1.4
      sun.opacity = 0.32 + Math.sin(sunT) * 0.06
    })

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
        // Slightly dimmer than before so coins/obstacles dominate
        k.opacity(0.15 + progress * 0.25),
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

    // Score chip (centered top, behind score text)
    k.add([
      k.rect(140, 38, { radius: 10 }),
      k.pos(GAME_CONFIG.WIDTH / 2, 28),
      k.anchor('center'),
      k.color(...C.CHIP_BG),
      k.opacity(0.42),
      k.outline(2, k.rgb(255, 255, 255), 0.18),
      k.z(199),
    ])
    const scoreText = k.add([
      k.text('0', { size: 26 }),
      k.pos(GAME_CONFIG.WIDTH / 2, 28),
      k.anchor('center'),
      k.color(...C.TEXT_WHITE),
      k.z(200),
    ])

    // Coin chip (top-left, behind icon + count)
    k.add([
      k.rect(96, 32, { radius: 8 }),
      k.pos(58, 28),
      k.anchor('center'),
      k.color(...C.CHIP_BG),
      k.opacity(0.42),
      k.outline(2, k.rgb(255, 255, 255), 0.18),
      k.z(199),
    ])
    // Round coin icon next to text (consistent with new round coins)
    k.add([
      k.circle(8),
      k.pos(26, 28),
      k.anchor('center'),
      k.color(...C.COIN),
      k.z(200),
    ])
    k.add([
      k.circle(3),
      k.pos(26, 28),
      k.anchor('center'),
      k.color(...C.COIN_STAR),
      k.z(201),
    ])
    const coinText = k.add([
      k.text('0', { size: 18 }),
      k.pos(44, 28),
      k.anchor('left'),
      k.color(...C.TEXT_GOLD),
      k.z(200),
    ])

    // Heart icons (3 lives) - top right, real heart polygon shape
    const hearts: GameObj[] = []
    for (let i = 0; i < 3; i++) {
      const heart = makeHeart(k, GAME_CONFIG.WIDTH - 24 - i * 24, 28)
      hearts.push(heart)
    }

    // Combo badge state — built lazily when multiplier > 1
    let comboBadge: GameObj | null = null
    let comboText: GameObj | null = null
    let comboStar: GameObj | null = null
    let lastShownMult = 1

    function showComboBadge(mult: number) {
      if (comboBadge) return
      comboBadge = k.add([
        k.rect(76, 30, { radius: 8 }),
        k.pos(GAME_CONFIG.WIDTH / 2, 66),
        k.anchor('center'),
        k.color(...C.CHIP_BG),
        k.opacity(0.5),
        k.scale(1),
        k.outline(2, k.rgb(C.COMBO_TEXT[0], C.COMBO_TEXT[1], C.COMBO_TEXT[2]), 0.85),
        k.z(199),
      ])
      comboStar = k.add([
        k.polygon(starPts(k, 7, 3)),
        k.pos(GAME_CONFIG.WIDTH / 2 - 22, 66),
        k.anchor('center'),
        k.color(...C.COIN),
        k.z(200),
      ])
      comboText = k.add([
        k.text(`x${mult}`, { size: 20 }),
        k.pos(GAME_CONFIG.WIDTH / 2 + 8, 66),
        k.anchor('center'),
        k.color(...C.COMBO_TEXT),
        k.scale(1),
        k.z(200),
      ])
    }

    function destroyComboBadge() {
      if (comboBadge && comboBadge.exists()) comboBadge.destroy()
      if (comboStar && comboStar.exists()) comboStar.destroy()
      if (comboText && comboText.exists()) comboText.destroy()
      comboBadge = null
      comboStar = null
      comboText = null
    }

    // === COMBO LEVEL-UP VFX (gold ring + brief flash, only on increment)
    function comboLevelUpVFX() {
      // Expanding ring at top center near combo badge
      const ring = k.add([
        k.circle(8),
        k.pos(GAME_CONFIG.WIDTH / 2, 66),
        k.anchor('center'),
        k.color(...C.COIN_RING),
        k.opacity(0.85),
        k.scale(1),
        k.z(240),
      ])
      k.tween(1, 6, 0.32, (v: number) => { if (ring.exists()) ring.scaleTo(v) }, k.easings.easeOutQuad)
      k.tween(0.85, 0, 0.32, (v: number) => { if (ring.exists()) ring.opacity = v })
      k.wait(0.34, () => { if (ring.exists()) ring.destroy() })

      // Brief gold tint flash
      const flash = k.add([
        k.rect(GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT),
        k.pos(0, 0),
        k.color(...C.COIN_RING),
        k.opacity(0.15),
        k.lifespan(0.1, { fade: 0.08 }),
        k.z(241),
      ])
      void flash

      // Pop the badge
      if (comboBadge && comboBadge.exists()) {
        k.tween(1.4, 1, 0.18, (v: number) => { if (comboBadge && comboBadge.exists()) comboBadge.scaleTo(v) }, k.easings.easeOutBack)
      }
      if (comboText && comboText.exists()) {
        k.tween(1.4, 1, 0.18, (v: number) => { if (comboText && comboText.exists()) comboText.scaleTo(v) }, k.easings.easeOutBack)
      }
    }

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

      // Combo display + level-up VFX (only on increment)
      const mult = scoring.getMultiplier()
      if (mult > 1) {
        if (!comboBadge) {
          showComboBadge(mult)
        } else if (comboText && comboText.exists()) {
          comboText.text = `x${mult}`
        }
        if (mult > lastShownMult) {
          comboLevelUpVFX()
        }
      } else if (comboBadge) {
        destroyComboBadge()
      }
      lastShownMult = mult

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
        line.opacity = 0.12 + progress * 0.32
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
      const haloPulseAlpha = 0.225 + Math.sin(k.time() * 4.2) * 0.075

      for (const obs of obstacles) {
        if (!obs.exists()) continue

        const pastBottom = updateObstacle(k, obs, gameSpeed, dt)
        if (pastBottom) {
          obs.destroy()
          continue
        }

        // Active-lane halo pulse: only the obstacle in the player's current lane glows.
        // All other halos sit at the static 0.20 set by createObstacle.
        if (obs.halo && obs.halo.exists()) {
          if (obs.lane === currentLane) {
            obs.halo.opacity = haloPulseAlpha
          } else if (obs.halo.opacity !== 0.2) {
            obs.halo.opacity = 0.2
          }
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

import type { KAPLAYCtx, GameObj } from 'kaplay'
import { GAME_CONFIG, getDepthScale } from '../config'
import { createPlayer, jumpPlayer, slidePlayer, createLaneSwitchDust } from '../objects/player'
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
    let gameTime = 0

    // Slow-mo death system
    let slowMoTimer = 0
    let slowMoFactor = 1
    let deathPayload: DeathPayload | null = null

    // Near-miss system
    let nearMissCooldown = 0

    // Coin chain tracking
    let lastCoinTime = 0
    let coinChainCount = 0


    // Milestone tracking
    let lastMilestone = 0
    let newHighShown = false

    // Speed tier vignette
    let vignetteActive = false
    let vignetteRects: GameObj[] = []

    // Camera nudge
    let roadLineNudge = 0

    // Systems
    const input = createInputSystem(k)
    const lanes = createLaneSystem()
    const scoring = createScoringSystem()
    const spawner = createSpawnerSystem(k)

    // Combo badge reference
    let comboBadge: GameObj | null = null
    let comboBadgeText: GameObj | null = null
    let lastMultiplier = 1

    // === BACKGROUND ===
    k.add([k.rect(GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT / 3), k.pos(0, 0), k.color(...C.BG_TOP), k.z(0)])
    k.add([k.rect(GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT / 3), k.pos(0, GAME_CONFIG.HEIGHT / 3), k.color(...C.BG_MID), k.z(0)])
    k.add([k.rect(GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT / 3), k.pos(0, (GAME_CONFIG.HEIGHT * 2) / 3), k.color(...C.BG_BOTTOM), k.z(0)])


    // Track/floor area
    k.add([k.rect(GAME_CONFIG.WIDTH - 160, GAME_CONFIG.HEIGHT), k.pos(80, 0), k.color(...C.TRACK_TOP), k.z(1)])

    // Volumetric light beam (subtle)
    k.add([
      k.rect(80, 400),
      k.pos(GAME_CONFIG.VANISHING_POINT_X, 0),
      k.anchor('top'),
      k.color(80, 220, 200),
      k.opacity(0.03),
      k.z(1),
    ])

    // Walls
    k.add([k.rect(80, GAME_CONFIG.HEIGHT), k.pos(0, 0), k.color(...C.WALL_DARK), k.z(1)])
    k.add([k.rect(80, GAME_CONFIG.HEIGHT), k.pos(GAME_CONFIG.WIDTH - 80, 0), k.color(...C.WALL_DARK), k.z(1)])
    k.add([k.rect(20, GAME_CONFIG.HEIGHT), k.pos(60, 0), k.color(...C.WALL_MID), k.z(2)])
    k.add([k.rect(20, GAME_CONFIG.HEIGHT), k.pos(GAME_CONFIG.WIDTH - 80, 0), k.color(...C.WALL_MID), k.z(2)])
    k.add([k.rect(6, GAME_CONFIG.HEIGHT), k.pos(78, 0), k.color(...C.WALL_LIGHT), k.z(2)])
    k.add([k.rect(6, GAME_CONFIG.HEIGHT), k.pos(GAME_CONFIG.WIDTH - 84, 0), k.color(...C.WALL_LIGHT), k.z(2)])

    // Moss accent strips
    k.add([k.rect(4, GAME_CONFIG.HEIGHT), k.pos(76, 0), k.color(...C.WALL_ACCENT), k.opacity(0.7), k.z(3)])
    k.add([k.rect(4, GAME_CONFIG.HEIGHT), k.pos(GAME_CONFIG.WIDTH - 80, 0), k.color(...C.WALL_ACCENT), k.opacity(0.7), k.z(3)])


    // Crystal formations on walls
    k.add([k.rect(10, 22), k.pos(30, 260), k.anchor('center'), k.color(...C.CRYSTAL_BLUE), k.opacity(0.85), k.z(3)])
    k.add([k.rect(8, 18), k.pos(50, 480), k.anchor('center'), k.color(...C.CRYSTAL_PURPLE), k.opacity(0.8), k.z(3)])
    k.add([k.rect(10, 20), k.pos(GAME_CONFIG.WIDTH - 35, 350), k.anchor('center'), k.color(...C.CRYSTAL_GREEN), k.opacity(0.85), k.z(3)])
    k.add([k.rect(8, 16), k.pos(GAME_CONFIG.WIDTH - 50, 600), k.anchor('center'), k.color(...C.CRYSTAL_BLUE), k.opacity(0.75), k.z(3)])

    // Distant sky peek
    k.add([k.rect(40, 20), k.pos(GAME_CONFIG.VANISHING_POINT_X, GAME_CONFIG.LANE_Y_TOP - 30), k.anchor('center'), k.color(80, 220, 200), k.opacity(0.3), k.z(2)])

    // === TORCHES (wall-mounted, flickering) ===
    const torches: GameObj[] = []
    const torchPositions = [
      { x: 45, y: 380 },
      { x: GAME_CONFIG.WIDTH - 45, y: 380 },
      { x: 45, y: 600 },
      { x: GAME_CONFIG.WIDTH - 45, y: 600 },
    ]
    for (const tp of torchPositions) {
      // Stick
      k.add([k.rect(4, 16), k.pos(tp.x, tp.y + 10), k.anchor('center'), k.color(...C.TORCH_STICK), k.z(3)])
      // Glow
      const glow = k.add([k.rect(22, 22, { radius: 11 }), k.pos(tp.x, tp.y - 4), k.anchor('center'), k.color(...C.TORCH_GLOW), k.opacity(0.15), k.z(3)])
      // Flame
      const flame = k.add([k.rect(8, 12, { radius: 4 }), k.pos(tp.x, tp.y), k.anchor('center'), k.color(...C.TORCH_FLAME), k.opacity(0.85), k.z(4)])
      torches.push(glow, flame)
    }


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
    let roadLineOffset = 0

    // === AMBIENT DUST PARTICLES (6) ===
    for (let i = 0; i < 6; i++) {
      const dust = k.add([
        k.rect(k.rand(2, 4), k.rand(2, 4), { radius: 2 }),
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
        if (dust.pos.y > 720) { dust.pos.y = 250; dust.pos.x = k.rand(100, 500) }
      })
    }


    // === PLAYER ===
    const player = createPlayer(k)

    // === HUD ===
    // Score shadow
    k.add([k.text('0', { size: 28 }), k.pos(GAME_CONFIG.WIDTH / 2 + 2, 32), k.anchor('center'), k.color(0, 0, 0), k.opacity(0.4), k.z(199), 'scoreShadow'])
    const scoreText = k.add([k.text('0', { size: 28 }), k.pos(GAME_CONFIG.WIDTH / 2, 30), k.anchor('center'), k.color(...C.TEXT_WHITE), k.z(200), 'scoreText'])

    // Coin icon (circular gold)
    const coinIcon = k.add([k.rect(14, 14, { radius: 7 }), k.pos(16, 30), k.anchor('center'), k.color(...C.COIN), k.z(200)])
    const coinText = k.add([k.text('0', { size: 20 }), k.pos(30, 30), k.anchor('left'), k.color(...C.TEXT_GOLD), k.z(200)])

    // Heart icons (3 lives) - top right with pulse
    const hearts: GameObj[] = []
    for (let i = 0; i < 3; i++) {
      const heart = k.add([
        k.rect(14, 14, { radius: 4 }),
        k.pos(GAME_CONFIG.WIDTH - 24 - i * 22, 30),
        k.anchor('center'),
        k.color(220, 50, 60),
        k.opacity(1),
        k.z(200),
        { pulseOffset: i * 0.3 },
      ])
      heart.add([k.rect(6, 6, { radius: 3 }), k.pos(0, 4), k.anchor('center'), k.color(220, 50, 60)])
      hearts.push(heart)
    }

    // === GAME LOOP ===
    k.onUpdate(() => {
      if (isDead && slowMoTimer <= 0) return

      const rawDt = k.dt()
      const clampedRawDt = Math.min(rawDt, 0.05)
      gameTime += clampedRawDt


      // Slow-motion handling
      if (slowMoTimer > 0) {
        slowMoTimer -= clampedRawDt
        if (slowMoTimer <= 0) {
          // Time's up - go to death
          if (deathPayload) k.go('death', deathPayload)
          return
        }
      }
      const dt = clampedRawDt * slowMoFactor

      // Near-miss cooldown
      if (nearMissCooldown > 0) nearMissCooldown -= dt

      // Increase speed
      gameSpeed = Math.min(gameSpeed + GAME_CONFIG.SPEED_INCREASE_RATE * dt, GAME_CONFIG.MAX_SPEED)

      // Process input
      const action = input.consume()
      if (action === 'left') {
        if (lanes.moveLeft()) {
          createLaneSwitchDust(k, player.pos.x, player.pos.y, 'left')
        }
      } else if (action === 'right') {
        if (lanes.moveRight()) {
          createLaneSwitchDust(k, player.pos.x, player.pos.y, 'right')
        }
      } else if (action === 'jump' && !isJumping) {
        isJumping = true
        jumpPlayer(k, player)
        roadLineNudge = 3
        k.wait(GAME_CONFIG.JUMP_DURATION, () => { isJumping = false })
      } else if (action === 'slide' && !isSliding) {
        isSliding = true
        slidePlayer(k, player)
        roadLineNudge = -2
        k.wait(GAME_CONFIG.SLIDE_DURATION, () => { isSliding = false })
      }


      // Update lane position
      lanes.update(dt)
      if (player.exists()) {
        // Camera micro-sway
        const sway = Math.sin(gameTime * 1.9) * 0.5
        player.pos.x = lanes.getCurrentX() + sway
        player.angle = lanes.getTilt()

        // Ghost trail during lane change
        if (lanes.isLaneChanging()) {
          ghostTimer += dt
          if (ghostTimer >= 0.04) {
            ghostTimer = 0
            k.add([
              k.rect(38, 60, { radius: 4 }),
              k.pos(player.pos.x, player.pos.y - 30),
              k.anchor('center'),
              k.color(C.PLAYER_BODY[0], C.PLAYER_BODY[1], C.PLAYER_BODY[2]),
              k.opacity(0.3),
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
      const currentScore = scoring.getScore()
      scoreText.text = String(currentScore)
      // Update shadow text
      const scoreShadows = k.get('scoreShadow')
      for (const ss of scoreShadows) { if (ss.exists()) ss.text = String(currentScore) }
      coinText.text = String(scoring.getCoins())


      // === COMBO BADGE ===
      const mult = scoring.getMultiplier()
      if (mult > 1 && mult !== lastMultiplier) {
        // Multiplier changed (increased)
        if (!comboBadge) {
          // Create badge
          comboBadge = k.add([
            k.rect(60, 28, { radius: 6 }),
            k.pos(GAME_CONFIG.WIDTH / 2, 64),
            k.anchor('center'),
            k.color(...C.COMBO_BADGE_BG),
            k.opacity(0.85),
            k.scale(1.8),
            k.z(200),
          ])
          // Border behind
          comboBadge.add([
            k.rect(62, 30, { radius: 7 }),
            k.color(...C.COMBO_BADGE_BORDER),
            k.anchor('center'),
            k.pos(0, 0),
            k.opacity(0.6),
          ])
          comboBadgeText = comboBadge.add([
            k.text(`x${mult}`, { size: 20 }),
            k.color(...C.COMBO_TEXT),
            k.anchor('center'),
            k.pos(0, 0),
          ])
          k.tween(1.8, 1, 0.15, (v: number) => { if (comboBadge?.exists()) comboBadge.scaleTo(v) }, k.easings.easeOutQuad)
        } else if (comboBadge.exists()) {
          // Update text
          if (comboBadgeText) comboBadgeText.text = `x${mult}`
          // Flash effect
          comboBadge.scaleTo(1.3)
          k.tween(1.3, 1, 0.12, (v: number) => { if (comboBadge?.exists()) comboBadge.scaleTo(v) }, k.easings.easeOutQuad)
          // Burst particles from badge
          for (let i = 0; i < 4; i++) {
            k.add([
              k.rect(4, 4, { radius: 2 }),
              k.pos(GAME_CONFIG.WIDTH / 2 + k.rand(-20, 20), 64),
              k.anchor('center'),
              k.color(...C.PARTICLE_GOLD),
              k.opacity(0.8),
              k.lifespan(0.3, { fade: 0.2 }),
              k.move(k.rand(0, 360), 80),
              k.z(201),
            ])
          }
        }
        lastMultiplier = mult
      } else if (mult <= 1 && comboBadge && comboBadge.exists()) {
        // Combo broken - shatter badge
        const bx = comboBadge.pos.x
        const by = comboBadge.pos.y
        comboBadge.destroy()
        comboBadge = null
        comboBadgeText = null
        lastMultiplier = 1
        for (let i = 0; i < 3; i++) {
          k.add([
            k.rect(8, 8, { radius: 2 }),
            k.pos(bx, by),
            k.anchor('center'),
            k.color(...C.COMBO_BADGE_BORDER),
            k.opacity(0.7),
            k.lifespan(0.3, { fade: 0.2 }),
            k.move(k.rand(0, 360), k.rand(60, 120)),
            k.z(201),
          ])
        }
      }
      // Badge idle pulse
      if (comboBadge && comboBadge.exists() && slowMoFactor === 1) {
        const pulseAmp = mult >= 5 ? 0.06 : 0.04
        const ps = 1 + Math.sin(gameTime * 5) * pulseAmp
        comboBadge.scaleTo(ps)
      }


      // === MILESTONE CELEBRATIONS ===
      const milestoneCheck = Math.floor(currentScore / GAME_CONFIG.MILESTONE_SMALL) * GAME_CONFIG.MILESTONE_SMALL
      if (milestoneCheck > lastMilestone && milestoneCheck > 0) {
        lastMilestone = milestoneCheck
        triggerMilestone(milestoneCheck)
      }

      // New high score notification (during gameplay)
      if (!newHighShown && scoring.isNewHighScore() && currentScore > 0) {
        newHighShown = true
        const nhr = k.add([
          k.text('NEW RECORD!', { size: 22 }),
          k.pos(GAME_CONFIG.WIDTH / 2, 95),
          k.anchor('center'),
          k.color(...C.COMBO_TEXT),
          k.opacity(1),
          k.scale(1.4),
          k.lifespan(2.5, { fade: 0.5 }),
          k.z(210),
        ])
        k.tween(1.4, 1, 0.2, (v: number) => { if (nhr.exists()) nhr.scaleTo(v) }, k.easings.easeOutQuad)
        for (let i = 0; i < 6; i++) {
          k.add([
            k.rect(4, 4, { radius: 2 }),
            k.pos(GAME_CONFIG.WIDTH / 2 + k.rand(-40, 40), 95),
            k.anchor('center'),
            k.color(...C.PARTICLE_GOLD),
            k.opacity(0.8),
            k.lifespan(0.4, { fade: 0.3 }),
            k.move(k.rand(0, 360), k.rand(60, 120)),
            k.z(211),
          ])
        }
      }


      // Update spawner
      spawner.update(dt, gameSpeed)

      // Road line animation + camera nudge
      if (roadLineNudge !== 0) {
        roadLineNudge *= Math.exp(-8 * dt) // decay nudge
        if (Math.abs(roadLineNudge) < 0.1) roadLineNudge = 0
      }
      roadLineOffset += dt * gameSpeed * 0.3
      if (roadLineOffset > 1) roadLineOffset -= 1
      for (const line of roadLines) {
        if (!line.exists()) continue
        let progress = (line.baseProgress + roadLineOffset) % 1
        const y = GAME_CONFIG.LANE_Y_TOP + progress * (GAME_CONFIG.LANE_Y_BOTTOM - GAME_CONFIG.LANE_Y_TOP)
        const scale = getDepthScale(y)
        line.pos.y = y + roadLineNudge
        line.width = 300 * scale
        line.opacity = 0.2 + progress * 0.4
      }

      // === SPEED TIER VISUALS ===
      let speedLineMax = 0
      let speedLineSpawnRate = 0
      let speedLineSpeed = 600
      let speedLineColor = C.SPEED_LINE
      let speedLineLen: [number, number] = [25, 40]

      if (gameSpeed >= 6.5) {
        speedLineMax = 6; speedLineSpawnRate = 0.12; speedLineSpeed = 1000
        speedLineColor = C.SPEED_LINE_FAST; speedLineLen = [40, 70]
        if (!vignetteActive) {
          vignetteActive = true
          vignetteRects.push(k.add([k.rect(40, GAME_CONFIG.HEIGHT), k.pos(0, 0), k.color(...C.VIGNETTE_DARK), k.opacity(0.15), k.z(190)]))
          vignetteRects.push(k.add([k.rect(40, GAME_CONFIG.HEIGHT), k.pos(GAME_CONFIG.WIDTH - 40, 0), k.color(...C.VIGNETTE_DARK), k.opacity(0.15), k.z(190)]))
          vignetteRects.push(k.add([k.rect(GAME_CONFIG.WIDTH, 30), k.pos(0, 0), k.color(...C.VIGNETTE_DARK), k.opacity(0.1), k.z(190)]))
          vignetteRects.push(k.add([k.rect(GAME_CONFIG.WIDTH, 30), k.pos(0, GAME_CONFIG.HEIGHT - 30), k.color(...C.VIGNETTE_DARK), k.opacity(0.1), k.z(190)]))
        }
      } else if (gameSpeed >= 5.5) {
        speedLineMax = 4; speedLineSpawnRate = 0.06; speedLineSpeed = 800; speedLineLen = [35, 55]
        destroyVignette()
      } else if (gameSpeed >= 4.0) {
        speedLineMax = 2; speedLineSpawnRate = 0.03; speedLineSpeed = 600; speedLineLen = [25, 40]
        destroyVignette()
      } else {
        destroyVignette()
      }


      // Spawn speed lines
      const activeSpeedLines = k.get('speedLine')
      if (speedLineMax > 0 && activeSpeedLines.length < speedLineMax && k.rand(0, 1) < speedLineSpawnRate) {
        k.add([
          k.rect(2, k.rand(speedLineLen[0], speedLineLen[1])),
          k.pos(k.rand(100, 500), -20),
          k.anchor('center'),
          k.color(speedLineColor[0], speedLineColor[1], speedLineColor[2]),
          k.opacity(0.3),
          k.lifespan(0.35, { fade: 0.25 }),
          k.move(k.Vec2.DOWN, speedLineSpeed),
          k.z(5),
          'speedLine',
        ])
      }

      // === TORCH FLICKER ===
      for (let i = 0; i < torches.length; i++) {
        const t = torches[i]
        if (!t || !t.exists()) continue
        if (i % 2 === 0) {
          // Glow
          t.opacity = 0.12 + Math.sin(gameTime * 8 + i) * 0.06 + Math.sin(gameTime * 13 + i * 2) * 0.04
        } else {
          // Flame
          t.opacity = 0.7 + Math.sin(gameTime * 8 + i) * 0.15 + Math.sin(gameTime * 13 + i) * 0.1
        }
      }

      // Heart pulse
      for (const heart of hearts) {
        if (!heart.exists()) continue
        const hp = 1 + Math.sin(gameTime * 3.14 + (heart.pulseOffset || 0)) * 0.05
        heart.scaleTo(hp)
      }


      // === UPDATE COINS ===
      const coins = k.get('coin')
      const playerX = player.exists() ? player.pos.x : 0
      const playerY = player.exists() ? player.pos.y : 0
      const playerExists = player.exists()

      for (const coin of coins) {
        if (!coin.exists()) continue
        const pastBottom = updateCoin(k, coin, gameSpeed, dt)
        if (pastBottom) { coin.destroy(); scoring.breakCombo(); continue }
        if (!playerExists) continue
        const dy = Math.abs(coin.pos.y - playerY)
        if (dy > 60) continue
        const dx = Math.abs(coin.pos.x - playerX)
        if (dx < 35 && dy < 45) {
          // Chain tracking
          const now = gameTime
          if (now - lastCoinTime < 0.8) { coinChainCount++ } else { coinChainCount = 0 }
          lastCoinTime = now

          createCoinCollectEffect(k, coin.pos.x, coin.pos.y, scoring.getMultiplier(), coinChainCount)
          coin.destroy()
          scoring.addCoin()

          // HUD coin icon bounce
          k.tween(1.25, 1, 0.12, (v: number) => { if (coinIcon.exists()) coinIcon.scaleTo(v) }, k.easings.easeOutQuad)
          coinIcon.scaleTo(1.25)

          // Camera nudge on collect
          roadLineNudge = -1.5
        }
      }


      // === UPDATE OBSTACLES ===
      const obstacles = k.get('obstacle')
      const currentLane = lanes.getCurrentLane()

      for (const obs of obstacles) {
        if (!obs.exists()) continue
        const pastBottom = updateObstacle(k, obs, gameSpeed, dt)
        if (pastBottom) {
          // Near-miss check on passing
          if (!obs.nearMissChecked && obs.lane === currentLane && nearMissCooldown <= 0) {
            triggerNearMiss()
            obs.nearMissChecked = true
          }
          obs.destroy()
          continue
        }

        // Near-miss detection: obstacle just passed player in same lane
        if (!obs.nearMissChecked && obs.lane === currentLane && obs.baseY > GAME_CONFIG.PLAYER_Y + 20 && nearMissCooldown <= 0) {
          triggerNearMiss()
          obs.nearMissChecked = true
        }

        // Collision check
        if (obs.lane !== currentLane) continue
        if (!playerExists) continue
        const obsY = Math.abs(obs.baseY - GAME_CONFIG.PLAYER_Y)
        if (obsY > 40) continue
        const type = obs.obstacleType as string
        if (type === 'stone_wall' && isJumping) continue
        if (type === 'low_beam' && isSliding) continue

        // COLLISION - HIT
        handleHit(obs)
        break
      }
    })


    // === NEAR-MISS HANDLER ===
    function triggerNearMiss() {
      nearMissCooldown = GAME_CONFIG.NEAR_MISS_COOLDOWN
      scoring.addNearMiss()

      // "CLOSE!" text popup
      const px = player.exists() ? player.pos.x : GAME_CONFIG.VANISHING_POINT_X
      const py = player.exists() ? player.pos.y : GAME_CONFIG.PLAYER_Y
      const closeText = k.add([
        k.text('CLOSE!', { size: 16 }),
        k.pos(px, py - 70),
        k.anchor('center'),
        k.color(...C.NEAR_MISS_TEXT),
        k.opacity(1),
        k.scale(0),
        k.lifespan(0.5, { fade: 0.3 }),
        k.move(k.Vec2.UP, 40),
        k.z(160),
      ])
      k.tween(0, 1.3, 0.08, (v: number) => { if (closeText.exists()) closeText.scaleTo(v) }, k.easings.easeOutQuad)
      k.wait(0.08, () => { k.tween(1.3, 1, 0.1, (v: number) => { if (closeText.exists()) closeText.scaleTo(v) }, k.easings.easeOutQuad) })

      // Star burst (4 particles)
      for (let i = 0; i < 4; i++) {
        k.add([
          k.rect(4, 4, { radius: 2 }),
          k.pos(px, py - 30),
          k.anchor('center'),
          k.color(...C.PARTICLE_GOLD),
          k.opacity(0.8),
          k.lifespan(0.2, { fade: 0.15 }),
          k.move(i * 90, 100),
          k.z(155),
        ])
      }

      // Brief flash
      k.add([
        k.rect(GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT),
        k.pos(0, 0),
        k.color(255, 255, 255),
        k.opacity(0.06),
        k.lifespan(0.08, { fade: 0.06 }),
        k.z(250),
      ])
    }


    // === MILESTONE HANDLER ===
    function triggerMilestone(score: number) {
      let text = 'NICE!'
      let size = 24
      let color = C.MILESTONE_TEXT
      let confettiCount = 6
      let startScale = 1.4

      if (score % GAME_CONFIG.MILESTONE_LARGE === 0) {
        text = 'LEGENDARY!'
        size = 32
        color = C.TEXT_GOLD
        confettiCount = 12
        startScale = 2.0
      } else if (score % GAME_CONFIG.MILESTONE_MED === 0) {
        text = 'AMAZING!'
        size = 28
        color = C.COMBO_TEXT
        confettiCount = 10
        startScale = 1.6
        // Brief flash
        k.add([k.rect(GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT), k.pos(0, 0), k.color(255, 255, 255), k.opacity(0.08), k.lifespan(0.1, { fade: 0.08 }), k.z(250)])
      }

      // Milestone text
      const mt = k.add([
        k.text(text, { size }),
        k.pos(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2 - 50),
        k.anchor('center'),
        k.color(color[0], color[1], color[2]),
        k.opacity(1),
        k.scale(startScale),
        k.lifespan(0.8, { fade: 0.3 }),
        k.z(220),
      ])
      k.tween(startScale, 1, 0.2, (v: number) => { if (mt.exists()) mt.scaleTo(v) }, k.easings.easeOutQuad)

      // Confetti
      const confettiColors = [C.CONFETTI_RED, C.CONFETTI_YELLOW, C.CONFETTI_GREEN, C.CONFETTI_BLUE, C.CONFETTI_PURPLE]
      for (let i = 0; i < confettiCount; i++) {
        const cc = confettiColors[i % confettiColors.length]!
        k.add([
          k.rect(k.rand(4, 8), k.rand(8, 14)),
          k.pos(GAME_CONFIG.WIDTH / 2 + k.rand(-100, 100), GAME_CONFIG.HEIGHT / 2 - 50),
          k.anchor('center'),
          k.color(cc[0], cc[1], cc[2]),
          k.opacity(0.9),
          k.rotate(k.rand(0, 360)),
          k.lifespan(0.5, { fade: 0.3 }),
          k.move(k.rand(0, 360), k.rand(80, 160)),
          k.z(215),
        ])
      }
    }


    // === VIGNETTE CLEANUP ===
    function destroyVignette() {
      if (vignetteActive) {
        vignetteActive = false
        for (const vr of vignetteRects) { if (vr.exists()) vr.destroy() }
        vignetteRects = []
      }
    }

    // === HIT HANDLER ===
    function handleHit(obs: GameObj) {
      if (isDead) return

      const stillAlive = scoring.loseLife()

      // Update heart display
      const currentLives = scoring.getLives()
      for (let i = 0; i < hearts.length; i++) {
        const heart = hearts[i]
        if (heart && heart.exists()) {
          if (i >= currentLives && heart.opacity > 0.3) {
            // Flash white then fade
            heart.color = k.Color.fromArray([255, 255, 255])
            k.wait(0.1, () => {
              if (heart.exists()) {
                heart.color = k.Color.fromArray([220, 50, 60])
                heart.opacity = 0.2
              }
            })
          }
        }
      }

      // Destroy the obstacle
      if (obs.exists()) obs.destroy()

      if (stillAlive) {
        // Hit feedback - flash + shake
        k.shake(6)
        const hitFlash = k.add([
          k.rect(GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT),
          k.pos(0, 0),
          k.color(220, 40, 40),
          k.opacity(0.3),
          k.z(250),
        ])
        k.wait(0.15, () => { if (hitFlash.exists()) hitFlash.destroy() })

        // Invulnerability blink
        isDead = true
        if (player.exists()) {
          let blinkCount = 0
          const blinkInterval = setInterval(() => {
            if (player.exists()) { player.opacity = player.opacity < 0.5 ? 1 : 0.3 }
            blinkCount++
            if (blinkCount >= 8) {
              clearInterval(blinkInterval)
              if (player.exists()) player.opacity = 1
              isDead = false
            }
          }, 80)
        }
      } else {
        // Final death - SLOW MOTION
        isDead = true
        slowMoTimer = 0.35
        slowMoFactor = 0.25

        const finalScore = scoring.finalize()
        const px = player.exists() ? player.pos.x : GAME_CONFIG.VANISHING_POINT_X
        const py = player.exists() ? player.pos.y : GAME_CONFIG.PLAYER_Y

        // Red tint overlay during slow-mo
        k.add([
          k.rect(GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT),
          k.pos(0, 0),
          k.color(220, 40, 40),
          k.opacity(0.3),
          k.lifespan(0.4, { fade: 0.2 }),
          k.z(250),
        ])

        k.shake(15)

        if (player.exists()) player.destroy()

        // Death particles
        const colors: [number, number, number][] = [C.PLAYER_BODY, C.PLAYER_HEAD, C.PLAYER_HAIR, C.PLAYER_LEGS, C.PLAYER_SHOES]
        for (let i = 0; i < 10; i++) {
          k.add([
            k.rect(k.rand(6, 14), k.rand(6, 14), { radius: 2 }),
            k.pos(px, py - 30),
            k.anchor('center'),
            k.color(...colors[i % colors.length]!),
            k.opacity(1),
            k.lifespan(0.5, { fade: 0.35 }),
            k.move((i / 10) * 360, k.rand(100, 280)),
            k.z(200),
          ])
        }

        deathPayload = {
          score: finalScore,
          coins: scoring.getCoins(),
          isNewHigh: scoring.isNewHighScore(),
          playerX: px,
          playerY: py,
        }
      }
    }
  })
}

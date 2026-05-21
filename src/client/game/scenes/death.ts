import type { KAPLAYCtx } from 'kaplay'
import { GAME_CONFIG } from '../config'

const { COLORS } = GAME_CONFIG

interface DeathData {
  score: number
  highScore: number
  isNewHighScore: boolean
  goldsCollected: number
  nearMisses: number
}

export function createDeathScene(k: KAPLAYCtx) {
  k.scene('death', (data: DeathData) => {
    const W = GAME_CONFIG.WIDTH
    const H = GAME_CONFIG.HEIGHT
    const { score, highScore, isNewHighScore, goldsCollected, nearMisses } = data

    // Dark overlay background
    k.add([
      k.rect(W, H),
      k.pos(0, 0),
      k.color(20, 15, 30),
      k.z(0),
    ])

    // Animated particles in background
    for (let i = 0; i < 15; i++) {
      const particle = k.add([
        k.rect(4, 4),
        k.pos(k.rand(0, W), k.rand(0, H)),
        k.color(100, 80, 60),
        k.opacity(0.3),
        k.anchor('center'),
        k.z(1),
      ])
      particle.onUpdate(() => {
        particle.pos.y -= k.dt() * 20
        if (particle.pos.y < 0) particle.pos.y = H
        particle.opacity = 0.1 + Math.sin(k.time() + i) * 0.15
      })
    }

    // "Game Over" title styled as Minecraft achievement
    k.add([
      k.rect(280, 40, { radius: 4 }),
      k.pos(W / 2, 80),
      k.anchor('center'),
      k.color(40, 40, 60),
      k.z(10),
    ])
    k.add([
      k.rect(276, 36, { radius: 3 }),
      k.pos(W / 2, 80),
      k.anchor('center'),
      k.color(60, 50, 80),
      k.z(11),
    ])
    k.add([
      k.text('Game Over!', { size: 22 }),
      k.pos(W / 2, 80),
      k.anchor('center'),
      k.color(...COLORS.TEXT_WHITE),
      k.z(12),
    ])

    // Score display (large, animated)
    const scoreDisplay = k.add([
      k.text(score.toString(), { size: 56 }),
      k.pos(W / 2, 170),
      k.anchor('center'),
      k.color(...COLORS.TEXT_WHITE),
      k.scale(0),
      k.z(12),
    ])

    // Animate score popping in
    k.tween(0, 1, 0.4, (v: number) => scoreDisplay.scaleTo(v), k.easings.easeOutBack)

    k.add([
      k.text('blocks', { size: 16 }),
      k.pos(W / 2, 205),
      k.anchor('center'),
      k.color(...COLORS.LANE_LINE),
      k.z(12),
    ])

    // New high score badge
    if (isNewHighScore) {
      const badge = k.add([
        k.rect(160, 28, { radius: 14 }),
        k.pos(W / 2, 240),
        k.anchor('center'),
        k.color(...COLORS.TEXT_GOLD),
        k.scale(1),
        k.z(11),
      ])
      k.add([
        k.text('NEW BEST!', { size: 14 }),
        k.pos(W / 2, 240),
        k.anchor('center'),
        k.color(40, 30, 0),
        k.z(12),
      ])
      badge.onUpdate(() => {
        badge.scaleTo(1 + Math.sin(k.time() * 4) * 0.05)
      })
    } else {
      k.add([
        k.text(`Best: ${highScore}`, { size: 16 }),
        k.pos(W / 2, 240),
        k.anchor('center'),
        k.color(...COLORS.LANE_LINE),
        k.z(12),
      ])
    }

    // Stats section
    const statsY = 290

    // Gold collected
    k.add([
      k.rect(16, 12),
      k.pos(W / 2 - 80, statsY),
      k.anchor('center'),
      k.color(...COLORS.GOLD),
      k.z(11),
    ])
    k.add([
      k.text(`x${goldsCollected}`, { size: 16 }),
      k.pos(W / 2 - 55, statsY),
      k.anchor('left'),
      k.color(...COLORS.TEXT_GOLD),
      k.z(12),
    ])

    // Near misses
    k.add([
      k.text(`Near misses: ${nearMisses}`, { size: 14 }),
      k.pos(W / 2, statsY + 35),
      k.anchor('center'),
      k.color(...COLORS.NEAR_MISS),
      k.opacity(0.8),
      k.z(12),
    ])

    // Achievement-style message
    const achievement = getAchievement(score, goldsCollected, nearMisses)
    k.add([
      k.rect(260, 50, { radius: 6 }),
      k.pos(W / 2, 380),
      k.anchor('center'),
      k.color(50, 40, 70),
      k.z(10),
    ])
    k.add([
      k.text(achievement.title, { size: 12 }),
      k.pos(W / 2, 370),
      k.anchor('center'),
      k.color(...COLORS.TEXT_GOLD),
      k.z(12),
    ])
    k.add([
      k.text(achievement.desc, { size: 11 }),
      k.pos(W / 2, 390),
      k.anchor('center'),
      k.color(...COLORS.LANE_LINE),
      k.z(12),
    ])

    // Share text (for copying)
    const shareText = `\u26cf\ufe0f MineRun: ${score} blocks | \ud83d\udc8e x${goldsCollected} | Can you beat me?`

    // Share button
    k.add([
      k.rect(140, 36, { radius: 4 }),
      k.pos(W / 2, 440),
      k.anchor('center'),
      k.color(80, 80, 180),
      k.z(10),
    ])
    k.add([
      k.text('Copy Score', { size: 14 }),
      k.pos(W / 2, 440),
      k.anchor('center'),
      k.color(...COLORS.TEXT_WHITE),
      k.z(12),
    ])

    // Play Again button
    const playBtn = k.add([
      k.rect(180, 50, { radius: 6 }),
      k.pos(W / 2, 520),
      k.anchor('center'),
      k.color(...COLORS.BUTTON_GREEN),
      k.scale(1),
      k.z(10),
    ])
    k.add([
      k.text('PLAY AGAIN', { size: 20 }),
      k.pos(W / 2, 520),
      k.anchor('center'),
      k.color(...COLORS.TEXT_WHITE),
      k.z(12),
    ])

    // Button pulse
    playBtn.onUpdate(() => {
      const pulse = 1 + Math.sin(k.time() * 3) * 0.03
      playBtn.scaleTo(pulse)
    })

    // Delay before accepting input (prevent accidental restart)
    let canRestart = false
    k.wait(0.5, () => { canRestart = true })

    // Handle interactions
    k.onClick(() => {
      if (!canRestart) return
      // Check if clicking share button area
      const mousePos = k.mousePos()
      if (mousePos.x > W / 2 - 70 && mousePos.x < W / 2 + 70 &&
          mousePos.y > 440 - 18 && mousePos.y < 440 + 18) {
        copyToClipboard(shareText)
        return
      }
      // Otherwise restart
      k.go('game')
    })

    k.onKeyPress(() => {
      if (canRestart) k.go('game')
    })

    k.onTouchStart(() => {
      if (canRestart) k.go('game')
    })

    // Submit score to server (non-blocking)
    submitScore(score)
  })
}

function getAchievement(score: number, golds: number, nearMisses: number): { title: string; desc: string } {
  if (score >= 1000) return { title: 'Achievement Unlocked!', desc: 'Diamond Miner - 1000+ blocks!' }
  if (score >= 500) return { title: 'Achievement Unlocked!', desc: 'Gold Rush - 500+ blocks!' }
  if (nearMisses >= 5) return { title: 'Achievement Unlocked!', desc: 'Daredevil - 5+ near misses!' }
  if (golds >= 10) return { title: 'Achievement Unlocked!', desc: 'Treasure Hunter - 10+ gold!' }
  if (score >= 200) return { title: 'Achievement Unlocked!', desc: 'Miner in Training - 200+ blocks!' }
  return { title: 'Keep Mining!', desc: `Ran ${score} blocks into the tunnel` }
}

function copyToClipboard(text: string) {
  try {
    navigator.clipboard.writeText(text).catch(() => {
      fallbackCopy(text)
    })
  } catch {
    fallbackCopy(text)
  }
}

function fallbackCopy(text: string) {
  const textarea = document.createElement('textarea')
  textarea.value = text
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
}

async function submitScore(score: number) {
  try {
    await fetch('/api/submit-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score }),
    })
  } catch {
    // Silent fail - don't disrupt the death screen experience
  }
}

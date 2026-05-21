import type { KAPLAYCtx } from 'kaplay'
import { GAME_CONFIG } from '../config'

const { COLORS } = GAME_CONFIG

interface DeathData {
  score: number
  highScore: number
  isNewHighScore: boolean
  goldsCollected: number
  nearMisses: number
  maxCombo: number
  biomeReached: string
}

export function createDeathScene(k: KAPLAYCtx) {
  k.scene('death', (rawData?: DeathData) => {
    const W = GAME_CONFIG.WIDTH
    const H = GAME_CONFIG.HEIGHT

    // Safe defaults if data is missing
    const data: DeathData = {
      score: rawData?.score ?? 0,
      highScore: rawData?.highScore ?? 0,
      isNewHighScore: rawData?.isNewHighScore ?? false,
      goldsCollected: rawData?.goldsCollected ?? 0,
      nearMisses: rawData?.nearMisses ?? 0,
      maxCombo: rawData?.maxCombo ?? 0,
      biomeReached: rawData?.biomeReached ?? 'Overworld Mine',
    }

    const { score, highScore, isNewHighScore, goldsCollected, nearMisses, maxCombo, biomeReached } = data

    // Dark overlay background
    k.add([k.rect(W, H), k.pos(0, 0), k.color(18, 14, 28), k.z(0)])


    // Animated particles in background
    for (let i = 0; i < 20; i++) {
      const particle = k.add([
        k.rect(3 + Math.random() * 4, 3 + Math.random() * 4),
        k.pos(k.rand(0, W), k.rand(0, H)),
        k.color(100, 80, 60),
        k.opacity(0.25),
        k.anchor('center'),
        k.z(1),
      ])
      particle.onUpdate(() => {
        particle.pos.y -= k.dt() * (15 + i * 2)
        if (particle.pos.y < 0) particle.pos.y = H
        particle.opacity = 0.1 + Math.sin(k.time() * 2 + i) * 0.12
      })
    }

    // Animated spinning pickaxe near title
    const pickaxeGroup = k.add([
      k.pos(W / 2 - 160, 100),
      k.anchor('center'),
      k.rotate(0),
      k.z(12),
    ])
    pickaxeGroup.add([k.rect(4, 28), k.pos(-2, -14), k.color(139, 90, 43)])
    pickaxeGroup.add([k.rect(18, 7), k.pos(-12, -14), k.color(160, 160, 170)])
    pickaxeGroup.onUpdate(() => {
      pickaxeGroup.angle = Math.sin(k.time() * 2) * 25
    })

    // "Game Over" title - Minecraft achievement style
    k.add([
      k.rect(300, 48, { radius: 4 }),
      k.pos(W / 2, 100),
      k.anchor('center'),
      k.color(35, 30, 50),
      k.z(10),
    ])
    k.add([
      k.rect(296, 44, { radius: 3 }),
      k.pos(W / 2, 100),
      k.anchor('center'),
      k.color(55, 45, 75),
      k.z(11),
    ])
    k.add([
      k.text('Game Over!', { size: 26 }),
      k.pos(W / 2, 100),
      k.anchor('center'),
      k.color(...COLORS.TEXT_WHITE),
      k.z(12),
    ])


    // Score display (large, animated pop-in)
    const scoreDisplay = k.add([
      k.text(score.toString(), { size: 64 }),
      k.pos(W / 2, 190),
      k.anchor('center'),
      k.color(...COLORS.TEXT_WHITE),
      k.scale(0),
      k.z(12),
    ])
    k.tween(0, 1, 0.5, (v: number) => scoreDisplay.scaleTo(v), k.easings.easeOutBack)

    k.add([
      k.text('blocks', { size: 18 }),
      k.pos(W / 2, 230),
      k.anchor('center'),
      k.color(...COLORS.LANE_LINE),
      k.z(12),
    ])

    // New high score badge
    if (isNewHighScore) {
      const badge = k.add([
        k.rect(180, 32, { radius: 16 }),
        k.pos(W / 2, 265),
        k.anchor('center'),
        k.color(...COLORS.TEXT_GOLD),
        k.scale(1),
        k.z(11),
      ])
      k.add([
        k.text('NEW BEST!', { size: 16 }),
        k.pos(W / 2, 265),
        k.anchor('center'),
        k.color(30, 20, 0),
        k.z(12),
      ])
      badge.onUpdate(() => {
        badge.scaleTo(1 + Math.sin(k.time() * 4) * 0.04)
      })
    } else {
      k.add([
        k.text(`Best: ${highScore}`, { size: 18 }),
        k.pos(W / 2, 265),
        k.anchor('center'),
        k.color(...COLORS.LANE_LINE),
        k.z(12),
      ])
    }


    // Stats section with more breathing room
    const statsY = 310

    // Gold collected
    k.add([
      k.rect(18, 14),
      k.pos(W / 2 - 90, statsY),
      k.anchor('center'),
      k.color(...COLORS.GOLD),
      k.z(11),
    ])
    k.add([
      k.text(`x${goldsCollected}`, { size: 18 }),
      k.pos(W / 2 - 65, statsY),
      k.anchor('left'),
      k.color(...COLORS.TEXT_GOLD),
      k.z(12),
    ])

    // Near misses
    k.add([
      k.text(`Near misses: ${nearMisses}`, { size: 15 }),
      k.pos(W / 2, statsY + 35),
      k.anchor('center'),
      k.color(...COLORS.NEAR_MISS),
      k.opacity(0.8),
      k.z(12),
    ])

    // Max combo
    if (maxCombo > 0) {
      k.add([
        k.text(`Max Combo: ${maxCombo}`, { size: 15 }),
        k.pos(W / 2, statsY + 65),
        k.anchor('center'),
        k.color(...COLORS.COMBO_TEXT),
        k.opacity(0.9),
        k.z(12),
      ])
    }

    // Biome reached
    k.add([
      k.text(`Reached: ${biomeReached}`, { size: 14 }),
      k.pos(W / 2, statsY + 95),
      k.anchor('center'),
      k.color(180, 150, 220),
      k.opacity(0.8),
      k.z(12),
    ])


    // Achievement-style message
    const achievement = getAchievement(score, goldsCollected, nearMisses)
    k.add([
      k.rect(300, 56, { radius: 6 }),
      k.pos(W / 2, 470),
      k.anchor('center'),
      k.color(45, 35, 65),
      k.z(10),
    ])
    k.add([
      k.text(achievement.title, { size: 13 }),
      k.pos(W / 2, 458),
      k.anchor('center'),
      k.color(...COLORS.TEXT_GOLD),
      k.z(12),
    ])
    k.add([
      k.text(achievement.desc, { size: 12 }),
      k.pos(W / 2, 480),
      k.anchor('center'),
      k.color(...COLORS.LANE_LINE),
      k.z(12),
    ])

    // Play Again button
    const playBtn = k.add([
      k.rect(220, 56, { radius: 6 }),
      k.pos(W / 2, 560),
      k.anchor('center'),
      k.color(...COLORS.BUTTON_GREEN),
      k.scale(1),
      k.z(10),
    ])
    k.add([
      k.text('PLAY AGAIN', { size: 22 }),
      k.pos(W / 2, 560),
      k.anchor('center'),
      k.color(...COLORS.TEXT_WHITE),
      k.z(12),
    ])

    // Button pulse
    playBtn.onUpdate(() => {
      const pulse = 1 + Math.sin(k.time() * 3) * 0.03
      playBtn.scaleTo(pulse)
    })

    // Share button (smaller)
    k.add([
      k.rect(160, 40, { radius: 4 }),
      k.pos(W / 2, 640),
      k.anchor('center'),
      k.color(70, 70, 160),
      k.z(10),
    ])
    k.add([
      k.text('Copy Score', { size: 15 }),
      k.pos(W / 2, 640),
      k.anchor('center'),
      k.color(...COLORS.TEXT_WHITE),
      k.z(12),
    ])


    // Delay before accepting input
    let canRestart = false
    k.wait(0.6, () => { canRestart = true })

    const shareText = `\u26cf\ufe0f MineRun: ${score} blocks | \ud83d\udc8e x${goldsCollected} | Can you beat me?`

    // Handle interactions
    k.onClick(() => {
      if (!canRestart) return
      const mousePos = k.mousePos()
      // Share button area
      if (mousePos.x > W / 2 - 80 && mousePos.x < W / 2 + 80 &&
          mousePos.y > 620 && mousePos.y < 660) {
        copyToClipboard(shareText)
        return
      }
      k.go('game')
    })

    k.onKeyPress(() => { if (canRestart) k.go('game') })
    k.onTouchStart(() => { if (canRestart) k.go('game') })

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
    navigator.clipboard.writeText(text).catch(() => { fallbackCopy(text) })
  } catch { fallbackCopy(text) }
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
    // Silent fail
  }
}

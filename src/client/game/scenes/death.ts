import type { KAPLAYCtx } from 'kaplay'
import { GAME_CONFIG } from '../config'

const { COLORS } = GAME_CONFIG

interface DeathData {
  score: number
  highScore: number
  isNewHighScore: boolean
}

export function createDeathScene(k: KAPLAYCtx) {
  k.scene('death', (rawData?: DeathData) => {
    const W = GAME_CONFIG.WIDTH
    const H = GAME_CONFIG.HEIGHT

    // Safe defaults
    const data: DeathData = {
      score: rawData?.score ?? 0,
      highScore: rawData?.highScore ?? 0,
      isNewHighScore: rawData?.isNewHighScore ?? false,
    }

    const { score, highScore, isNewHighScore } = data

    // Dark purple overlay background
    k.add([k.rect(W, H), k.pos(0, 0), k.color(12, 8, 30), k.z(0)])

    // Subtle glow behind score
    k.add([
      k.rect(200, 100, { radius: 50 }),
      k.pos(W / 2, H / 2 - 60),
      k.anchor('center'),
      k.color(...COLORS.TEXT_CYAN),
      k.opacity(0.05),
      k.z(10),
    ])

    // Big score number
    const scoreDisplay = k.add([
      k.text(score.toString(), { size: 72 }),
      k.pos(W / 2, H / 2 - 60),
      k.anchor('center'),
      k.color(...COLORS.TEXT_WHITE),
      k.scale(0),
      k.z(12),
    ])
    k.tween(0, 1, 0.4, (v: number) => {
      if (scoreDisplay.exists()) scoreDisplay.scaleTo(v)
    }, k.easings.easeOutBack)

    k.add([
      k.text('points', { size: 20 }),
      k.pos(W / 2, H / 2 - 10),
      k.anchor('center'),
      k.color(140, 120, 180),
      k.z(12),
    ])

    // High score display
    if (isNewHighScore) {
      k.add([
        k.text('NEW BEST!', { size: 22 }),
        k.pos(W / 2, H / 2 + 30),
        k.anchor('center'),
        k.color(...COLORS.TEXT_GOLD),
        k.z(12),
      ])
    } else {
      k.add([
        k.text(`Best: ${highScore}`, { size: 18 }),
        k.pos(W / 2, H / 2 + 30),
        k.anchor('center'),
        k.color(140, 120, 180),
        k.z(12),
      ])
    }

    // TAP TO PLAY button (cyan)
    const tapText = k.add([
      k.text('TAP TO PLAY', { size: 24 }),
      k.pos(W / 2, H / 2 + 100),
      k.anchor('center'),
      k.color(...COLORS.TEXT_CYAN),
      k.opacity(1),
      k.z(12),
    ])
    tapText.onUpdate(() => {
      tapText.opacity = 0.5 + Math.sin(k.time() * 4) * 0.5
    })

    // Delay before accepting input
    let canRestart = false
    k.wait(0.4, () => { canRestart = true })

    k.onClick(() => { if (canRestart) k.go('game') })
    k.onKeyPress(() => { if (canRestart) k.go('game') })
    k.onTouchStart(() => { if (canRestart) k.go('game') })
  })
}

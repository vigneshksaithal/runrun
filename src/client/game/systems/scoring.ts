import { GAME_CONFIG } from '../config'

const STORAGE_KEY = 'runrun_highscore'

export function createScoringSystem() {
  let score = 0
  let coinsCollected = 0
  let comboCount = 0
  let multiplier = 1
  let highScore = loadHighScore()

  function loadHighScore(): number {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? parseInt(saved, 10) : 0
    } catch {
      return 0
    }
  }

  function saveHighScore() {
    try {
      localStorage.setItem(STORAGE_KEY, String(highScore))
    } catch {
      // localStorage may not be available
    }
  }

  return {
    getScore(): number {
      return Math.floor(score)
    },

    getCoins(): number {
      return coinsCollected
    },

    getMultiplier(): number {
      return multiplier
    },

    getHighScore(): number {
      return highScore
    },

    isNewHighScore(): boolean {
      return Math.floor(score) > highScore
    },

    addDistance(dt: number) {
      score += GAME_CONFIG.SCORE_PER_SECOND * dt * multiplier
    },

    addCoin() {
      coinsCollected++
      score += GAME_CONFIG.COIN_SCORE * multiplier
      comboCount++

      if (comboCount >= GAME_CONFIG.COMBO_THRESHOLD) {
        multiplier = Math.min(multiplier + 1, GAME_CONFIG.MAX_MULTIPLIER)
        comboCount = 0
      }
    },

    breakCombo() {
      comboCount = 0
      multiplier = 1
    },

    finalize() {
      const finalScore = Math.floor(score)
      if (finalScore > highScore) {
        highScore = finalScore
        saveHighScore()
      }
      return finalScore
    },

    reset() {
      score = 0
      coinsCollected = 0
      comboCount = 0
      multiplier = 1
    },
  }
}

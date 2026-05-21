import { GAME_CONFIG } from '../config'

export interface ScoreState {
  score: number
  highScore: number
  distance: number
  coinsCollected: number
  combo: number
  multiplier: number
}

export function createScoringSystem() {
  const state: ScoreState = {
    score: 0,
    highScore: getLocalHighScore(),
    distance: 0,
    coinsCollected: 0,
    combo: 0,
    multiplier: 1,
  }

  return {
    getState(): ScoreState {
      return { ...state }
    },

    update(dt: number, speed: number) {
      const distanceGained = speed * dt * GAME_CONFIG.SCORE_PER_SECOND
      state.distance += distanceGained
      state.score = Math.floor(state.distance)
    },

    addCoin() {
      state.coinsCollected++
      state.combo++
      // Every 5 coins = +1x multiplier (max 5x)
      state.multiplier = Math.min(
        GAME_CONFIG.MAX_MULTIPLIER,
        1 + Math.floor(state.combo / GAME_CONFIG.COMBO_THRESHOLD)
      )
      const coinScore = GAME_CONFIG.COIN_SCORE * state.multiplier
      state.score += coinScore
    },

    resetCombo() {
      state.combo = 0
      state.multiplier = 1
    },

    getFinalScore(): number {
      return state.score
    },

    checkHighScore(): boolean {
      if (state.score > state.highScore) {
        state.highScore = state.score
        setLocalHighScore(state.score)
        return true
      }
      return false
    },

    reset() {
      state.score = 0
      state.distance = 0
      state.coinsCollected = 0
      state.combo = 0
      state.multiplier = 1
      state.highScore = getLocalHighScore()
    }
  }
}

function getLocalHighScore(): number {
  try {
    return parseInt(localStorage.getItem('blockdash_highscore') || '0', 10)
  } catch {
    return 0
  }
}

function setLocalHighScore(score: number) {
  try {
    localStorage.setItem('blockdash_highscore', score.toString())
  } catch {
    // Ignore storage errors
  }
}

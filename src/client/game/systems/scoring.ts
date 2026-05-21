import { GAME_CONFIG } from '../config'

export interface ScoreState {
  score: number
  highScore: number
  distance: number
  goldsCollected: number
  nearMisses: number
}

export function createScoringSystem() {
  const state: ScoreState = {
    score: 0,
    highScore: getLocalHighScore(),
    distance: 0,
    goldsCollected: 0,
    nearMisses: 0,
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

    addGold() {
      state.goldsCollected++
      state.score += GAME_CONFIG.GOLD_INGOT_SCORE
    },

    addNearMiss() {
      state.nearMisses++
      state.score += GAME_CONFIG.NEAR_MISS_BONUS
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
      state.goldsCollected = 0
      state.nearMisses = 0
      state.highScore = getLocalHighScore()
    }
  }
}

function getLocalHighScore(): number {
  try {
    return parseInt(localStorage.getItem('minerun_highscore') || '0', 10)
  } catch {
    return 0
  }
}

function setLocalHighScore(score: number) {
  try {
    localStorage.setItem('minerun_highscore', score.toString())
  } catch {
    // Ignore storage errors in sandboxed environments
  }
}

export interface ScoreEntry {
  rank: number
  username: string
  score: number
}

export interface LeaderboardResponse {
  leaderboard: ScoreEntry[]
}

export interface SubmitScoreRequest {
  score: number
}

export interface SubmitScoreResponse {
  status: 'ok' | 'error'
  score?: number
  message?: string
}

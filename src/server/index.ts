import {
  context,
  createServer,
  getServerPort,
  redis
} from '@devvit/web/server'
import { serve } from '@hono/node-server'
import type { Context } from 'hono'
import { Hono } from 'hono'

import { createPost } from './post'

const HTTP_STATUS_BAD_REQUEST = 400
const LEADERBOARD_KEY = 'blockdash:leaderboard'
const MAX_LEADERBOARD_SIZE = 50

export const app = new Hono()

const createPostHandler = async (c: Context): Promise<Response> => {
  try {
    const post = await createPost()

    return c.json({
      navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.id}`
    })
  } catch (error) {
    const errorMessage = error instanceof Error
      ? error.message
      : 'Failed to create post'
    return c.json(
      {
        status: 'error',
        message: errorMessage
      },
      HTTP_STATUS_BAD_REQUEST
    )
  }
}

app.post('/internal/on-app-install', createPostHandler)
app.post('/internal/menu/post-create', createPostHandler)

// Score submission endpoint
app.post('/api/submit-score', async (c: Context): Promise<Response> => {
  try {
    const body = await c.req.json()
    const score = body.score

    if (typeof score !== 'number' || score < 0 || score > 100000) {
      return c.json({ status: 'error', message: 'Invalid score' }, HTTP_STATUS_BAD_REQUEST)
    }

    const username = context.userId || 'anonymous'

    // Add score to Redis sorted set (higher is better)
    await redis.zAdd(LEADERBOARD_KEY, { member: `${username}:${Date.now()}`, score })

    // Trim to keep only top scores
    const count = await redis.zCard(LEADERBOARD_KEY)
    if (count > MAX_LEADERBOARD_SIZE) {
      await redis.zRemRangeByRank(LEADERBOARD_KEY, 0, count - MAX_LEADERBOARD_SIZE - 1)
    }

    return c.json({ status: 'ok', score })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to submit score'
    return c.json({ status: 'error', message: errorMessage }, HTTP_STATUS_BAD_REQUEST)
  }
})

// Leaderboard endpoint
app.get('/api/leaderboard', async (c: Context): Promise<Response> => {
  try {
    // Get top 10 scores (highest first)
    const entries = await redis.zRange(LEADERBOARD_KEY, 0, 9, { by: 'score', reverse: true })

    const leaderboard = entries.map((entry: { member: string; score: number }, index: number) => {
      const parts = entry.member.split(':')
      const username = parts[0] || 'anonymous'
      return {
        rank: index + 1,
        username,
        score: entry.score,
      }
    })

    return c.json({ leaderboard })
  } catch (error) {
    return c.json({ leaderboard: [] })
  }
})

// Start the Devvit-wrapped server so context (reddit, redis, etc.) is available
serve({ fetch: app.fetch, port: getServerPort(), createServer })

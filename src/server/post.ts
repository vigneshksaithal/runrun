import { context, reddit } from '@devvit/web/server'

export const createPost = async () => {
  const { subredditName } = context
  if (!subredditName) {
    throw new Error('subredditName is required')
  }

  return await reddit.submitCustomPost({
    subredditName,
    title: 'RunRun - How far can you run? \ud83c\udfc3\ud83d\udca8',
    entry: 'default'
  })
}

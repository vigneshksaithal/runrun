import { context, reddit } from '@devvit/web/server'

export const createPost = async () => {
  const { subredditName } = context
  if (!subredditName) {
    throw new Error('subredditName is required')
  }

  return await reddit.submitCustomPost({
    subredditName,
    title: 'MineRun - Can you beat the high score? \u26cf\ufe0f\ud83c\udfc3',
    entry: 'default'
  })
}

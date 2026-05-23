// Preview screen - opens game in expanded mode when clicked
import { requestExpandedMode } from '@devvit/web/client'

// Load high score and total coins from localStorage
function loadStats(): void {
  const highScoreEl = document.getElementById('highScore')
  const totalCoinsEl = document.getElementById('totalCoins')

  try {
    const highScore = localStorage.getItem('runrun_highscore') ?? '0'
    const totalCoins = localStorage.getItem('runrun_total_coins') ?? '0'

    if (highScoreEl) highScoreEl.textContent = highScore
    if (totalCoinsEl) totalCoinsEl.textContent = totalCoins
  } catch {
    // localStorage not available, keep defaults
  }
}

// Request expanded mode to launch the game
async function launchGame(event: MouseEvent): Promise<void> {
  event.preventDefault()
  event.stopPropagation()

  try {
    // Use Devvit's official client API to request expanded mode with the 'game' entrypoint
    await requestExpandedMode(event, 'game')
  } catch (e) {
    console.error('Failed to expand:', e)
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadStats()

  // Add click handlers
  const preview = document.getElementById('preview')
  const playBtn = document.getElementById('playBtn')

  if (playBtn) {
    playBtn.addEventListener('click', launchGame as EventListener)
  }

  if (preview) {
    preview.addEventListener('click', launchGame as EventListener)
  }
})

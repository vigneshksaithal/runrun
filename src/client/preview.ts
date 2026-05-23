// Preview screen - opens game in expanded mode when clicked

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
function launchGame(event: Event): void {
  event.preventDefault()
  event.stopPropagation()

  // Devvit webview API to switch to expanded mode with the 'game' entrypoint
  if (typeof window !== 'undefined' && 'parent' in window) {
    window.parent.postMessage(
      {
        type: 'devvit-message',
        data: {
          type: 'webview:requestExpandedMode',
          entrypoint: 'game'
        }
      },
      '*'
    )
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadStats()

  // Add click handlers
  const preview = document.getElementById('preview')
  const playBtn = document.getElementById('playBtn')

  if (playBtn) {
    playBtn.addEventListener('click', launchGame)
  }

  if (preview) {
    preview.addEventListener('click', launchGame)
  }
})

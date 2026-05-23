import kaplay from 'kaplay'
import { GAME_CONFIG } from './game/config'
import { createStartScene } from './game/scenes/start'
import { createGameScene } from './game/scenes/game'
import { createDeathScene } from './game/scenes/death'

// Hide splash overlay. Defined here (in an external module) because Devvit's
// Content-Security-Policy forbids inline <script> tags.
function hideSplash(): void {
  const splash = document.getElementById('splash')
  if (!splash) return
  splash.classList.add('hide')
  setTimeout(() => splash.remove(), 400)
}

// Hard safety timeout — the splash must never block the user, even if Kaplay
// fails to initialise for some reason.
const splashTimeout = window.setTimeout(hideSplash, 2500)

// Initialize KaplayJS
const k = kaplay({
  width: GAME_CONFIG.WIDTH,
  height: GAME_CONFIG.HEIGHT,
  background: [15, 25, 40],
  stretch: true,
  letterbox: false,
  crisp: true,
  touchToMouse: true,
})

// Register scenes
createStartScene(k)
createGameScene(k)
createDeathScene(k)

// Start with the start screen
k.go('start')

// Once Kaplay's first scene has rendered a frame, fade the splash. Double
// requestAnimationFrame guarantees at least one paint has occurred.
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    clearTimeout(splashTimeout)
    hideSplash()
  })
})

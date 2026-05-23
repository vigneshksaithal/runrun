import kaplay from 'kaplay'
import { GAME_CONFIG } from './game/config'
import { createStartScene } from './game/scenes/start'
import { createGameScene } from './game/scenes/game'
import { createDeathScene } from './game/scenes/death'

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

// Tell the splash overlay it's safe to fade out — the canvas is up and the
// first scene has rendered its first frame.
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    window.dispatchEvent(new CustomEvent('runrun:ready'))
  })
})

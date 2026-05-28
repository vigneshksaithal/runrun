import kaplay from 'kaplay'
import { GAME_CONFIG } from './game/config'
import { createStartScene } from './game/scenes/start'
import { createGameScene } from './game/scenes/game'
import { createDeathScene } from './game/scenes/death'

// Initialize KaplayJS with smooth rendering settings
const k = kaplay({
  width: GAME_CONFIG.WIDTH,
  height: GAME_CONFIG.HEIGHT,
  background: [135, 206, 250], // Light sky blue
  stretch: true,
  letterbox: true,
  crisp: false, // Disable crisp for smoother, anti-aliased graphics
  touchToMouse: true,
})

// Register scenes
createStartScene(k)
createGameScene(k)
createDeathScene(k)

// Start with game scene directly (or 'start' for menu)
k.go('game')

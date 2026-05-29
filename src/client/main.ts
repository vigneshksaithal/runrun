import kaplay from 'kaplay'
import { GAME_CONFIG } from './game/config'
import { createStartScene } from './game/scenes/start'
import { createGameScene } from './game/scenes/game'
import { createDeathScene } from './game/scenes/death'

// Initialize KaplayJS
const k = kaplay({
  width: GAME_CONFIG.WIDTH,
  height: GAME_CONFIG.HEIGHT,
  background: [64, 170, 250],
  stretch: true,
  letterbox: false,
  crisp: true,
  touchToMouse: true,
})

// Register scenes
createStartScene(k)
createGameScene(k)
createDeathScene(k)

// Start directly with the game (preview screen is now separate)
k.go('game')

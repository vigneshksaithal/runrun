import kaplay from 'kaplay'
import { GAME_CONFIG } from './game/config'
import { createStartScene } from './game/scenes/start'
import { createGameScene } from './game/scenes/game'
import { createDeathScene } from './game/scenes/death'

// Initialize KaplayJS - let it create canvas on body naturally
const k = kaplay({
  width: GAME_CONFIG.WIDTH,
  height: GAME_CONFIG.HEIGHT,
  background: [18, 18, 32],
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

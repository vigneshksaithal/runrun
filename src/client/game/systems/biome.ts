import { GAME_CONFIG } from '../config'

export interface BiomeColors {
  wallColor: [number, number, number]
  trackColor: [number, number, number]
  ceilingColor: [number, number, number]
  accentColor: [number, number, number]
  particleColor: [number, number, number]
  name: string
}

const BIOMES: BiomeColors[] = [
  {
    // Overworld Mine (brown/gray) - blocks 0-499
    name: 'Overworld Mine',
    wallColor: [45, 38, 32],
    trackColor: [70, 65, 60],
    ceilingColor: [35, 30, 28],
    accentColor: [140, 130, 120],
    particleColor: [130, 110, 90],
  },
  {
    // Deep Cave (purple/dark blue, crystal formations) - blocks 500-999
    name: 'Deep Cave',
    wallColor: [GAME_CONFIG.COLORS.CAVE_BLUE[0], GAME_CONFIG.COLORS.CAVE_BLUE[1], GAME_CONFIG.COLORS.CAVE_BLUE[2]],
    trackColor: [50, 55, 80],
    ceilingColor: [25, 30, 60],
    accentColor: [GAME_CONFIG.COLORS.CAVE_CRYSTAL[0], GAME_CONFIG.COLORS.CAVE_CRYSTAL[1], GAME_CONFIG.COLORS.CAVE_CRYSTAL[2]],
    particleColor: [100, 150, 220],
  },
  {
    // Nether (red/orange/black, lava glow) - blocks 1000-1499
    name: 'The Nether',
    wallColor: [GAME_CONFIG.COLORS.NETHER_RED[0], GAME_CONFIG.COLORS.NETHER_RED[1], GAME_CONFIG.COLORS.NETHER_RED[2]],
    trackColor: [80, 35, 20],
    ceilingColor: [40, 15, 10],
    accentColor: [GAME_CONFIG.COLORS.NETHER_ORANGE[0], GAME_CONFIG.COLORS.NETHER_ORANGE[1], GAME_CONFIG.COLORS.NETHER_ORANGE[2]],
    particleColor: [255, 100, 20],
  },
  {
    // The End (dark purple/black, enderman eyes) - blocks 1500-1999
    name: 'The End',
    wallColor: [GAME_CONFIG.COLORS.END_PURPLE[0], GAME_CONFIG.COLORS.END_PURPLE[1], GAME_CONFIG.COLORS.END_PURPLE[2]],
    trackColor: [30, 15, 50],
    ceilingColor: [GAME_CONFIG.COLORS.END_BLACK[0], GAME_CONFIG.COLORS.END_BLACK[1], GAME_CONFIG.COLORS.END_BLACK[2]],
    accentColor: [180, 80, 255],
    particleColor: [160, 50, 220],
  },
]

export function getBiomeIndex(score: number): number {
  const cycleLength = GAME_CONFIG.BIOME_DISTANCE * BIOMES.length
  const positionInCycle = score % cycleLength
  return Math.floor(positionInCycle / GAME_CONFIG.BIOME_DISTANCE)
}

export function getBiome(score: number): BiomeColors {
  const index = getBiomeIndex(score)
  return BIOMES[index] ?? BIOMES[0]!
}

export function getBiomeName(score: number): string {
  return getBiome(score).name
}

export function getTotalBiomeCount(): number {
  return BIOMES.length
}

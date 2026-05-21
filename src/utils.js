import { ROAD_TOP_WIDTH, ROAD_BOTTOM_WIDTH, LANE_WIDTH, SPEED_INCREMENT, SPEED_CAP } from "./constants.js";

// Lerp helper
export function lerp(a, b, t) {
    return a + (b - a) * Math.max(0, Math.min(1, t));
}

// Get lane X position at a given depth (0=horizon, 1=player level)
export function getLaneX(lane, depth) {
    const centerX = 400;
    const spread = lerp(40, LANE_WIDTH * 1.3, depth);
    return centerX + (lane - 1) * spread;
}

// Get current zone based on distance
export function getCurrentZone(dist) {
    if (dist < 500) return 1;
    if (dist < 1500) return 2;
    return 3;
}

// Speed multiplier based on distance
export function getSpeedMultiplier(dist) {
    const mult = 1.0 + Math.floor(dist / 300) * SPEED_INCREMENT;
    return Math.min(mult, SPEED_CAP);
}

// Seeded RNG for deterministic obstacle generation
export function seededRandom(seed) {
    let s = seed;
    return function () {
        s = (s * 1664525 + 1013904223) & 0xFFFFFFFF;
        return (s >>> 0) / 0xFFFFFFFF;
    };
}

// Get road width at a given depth
export function getRoadWidth(depth) {
    return lerp(ROAD_TOP_WIDTH, ROAD_BOTTOM_WIDTH, depth);
}

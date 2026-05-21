// Game state management
export const gameState = {
    distance: 0,
    gems: 0,
    combo: 0,
    comboMultiplier: 1,
    speed: 1.0,
    zone: 1,
    lane: 1,
    isJumping: false,
    isSliding: false,
    isDead: false,
    hasShield: false,
    hasMagnet: false,
    magnetTimer: 0,
    bestDistance: 0,
    totalDistance: 0,
    totalGems: 0,
    unlockedSkins: ["steve"],
    activeSkin: "steve",
    nearMisses: 0,
};

export function resetGameState() {
    gameState.distance = 0;
    gameState.gems = 0;
    gameState.combo = 0;
    gameState.comboMultiplier = 1;
    gameState.speed = 1.0;
    gameState.zone = 1;
    gameState.lane = 1;
    gameState.isJumping = false;
    gameState.isSliding = false;
    gameState.isDead = false;
    gameState.hasShield = false;
    gameState.hasMagnet = false;
    gameState.magnetTimer = 0;
    gameState.nearMisses = 0;
}

export function loadSave() {
    try {
        const data = JSON.parse(localStorage.getItem("blockdash_save") || "{}");
        gameState.bestDistance = data.bestDistance || 0;
        gameState.totalDistance = data.totalDistance || 0;
        gameState.totalGems = data.totalGems || 0;
        gameState.unlockedSkins = data.unlockedSkins || ["steve"];
        gameState.activeSkin = data.activeSkin || "steve";
    } catch (e) { /* ignore */ }
}

export function savePersist() {
    try {
        localStorage.setItem("blockdash_save", JSON.stringify({
            bestDistance: gameState.bestDistance,
            totalDistance: gameState.totalDistance,
            totalGems: gameState.totalGems,
            unlockedSkins: gameState.unlockedSkins,
            activeSkin: gameState.activeSkin,
        }));
    } catch (e) { /* ignore */ }
}

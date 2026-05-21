// ==================== CONSTANTS ====================
export const LANE_COUNT = 3;
export const LANE_WIDTH = 100;
export const PLAYER_Y = 480;
export const HORIZON_Y = 180;
export const ROAD_TOP_WIDTH = 160;
export const ROAD_BOTTOM_WIDTH = 500;
export const BASE_SPEED = 4;
export const SPEED_INCREMENT = 0.03;
export const SPEED_CAP = 1.25;
export const SPAWN_INTERVAL_BASE = 1.2;
export const GEM_SPAWN_INTERVAL = 0.8;

// Color palettes for zones
export const ZONES = {
    1: { name: "Stone Mines", bg: [40, 44, 52], road: [70, 70, 80], accent: [120, 120, 140], line: [90, 90, 110] },
    2: { name: "Nether Path", bg: [60, 20, 20], road: [100, 40, 30], accent: [200, 100, 30], line: [140, 60, 30] },
    3: { name: "Creeper Forest", bg: [20, 50, 20], road: [40, 80, 40], accent: [80, 200, 80], line: [60, 120, 60] },
};

// Minecraft-style color palette
export const COLORS = {
    stone: [120, 120, 120],
    darkStone: [80, 80, 80],
    dirt: [134, 96, 67],
    grass: [90, 160, 60],
    wood: [160, 120, 60],
    lava: [220, 80, 20],
    gold: [255, 215, 0],
    diamond: [80, 220, 255],
    emerald: [50, 220, 100],
    iron: [200, 200, 200],
    obsidian: [30, 20, 40],
    redstone: [200, 30, 30],
    white: [255, 255, 255],
    black: [20, 20, 20],
};

// Character skins
export const SKINS = {
    steve: { head: [200, 160, 120], body: [50, 130, 200], legs: [60, 60, 150], name: "Steve" },
    diamond: { head: [80, 220, 255], body: [40, 180, 220], legs: [30, 140, 180], name: "Diamond" },
    nether: { head: [200, 60, 40], body: [120, 30, 30], legs: [80, 20, 20], name: "Nether" },
    emerald: { head: [50, 220, 100], body: [30, 160, 70], legs: [20, 120, 50], name: "Emerald" },
    ender: { head: [40, 20, 60], body: [80, 40, 120], legs: [60, 30, 90], name: "Ender" },
};

export const SKIN_UNLOCK_REQS = { steve: 0, diamond: 1000, nether: 5000, emerald: 10000, ender: 25000 };

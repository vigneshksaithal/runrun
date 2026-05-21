import kaplay from "kaplay";
import { ZONES, SKINS, SKIN_UNLOCK_REQS, HORIZON_Y, PLAYER_Y, ROAD_TOP_WIDTH, ROAD_BOTTOM_WIDTH, BASE_SPEED, SPAWN_INTERVAL_BASE, GEM_SPAWN_INTERVAL } from "./constants.js";
import { gameState, resetGameState, loadSave, savePersist } from "./state.js";
import { lerp, getLaneX, getCurrentZone, getSpeedMultiplier, seededRandom, getRoadWidth } from "./utils.js";

// Initialize KaplayJS
const k = kaplay({
    width: 800,
    height: 600,
    background: [26, 26, 46],
    letterbox: true,
    stretch: true,
    crisp: true,
    global: false,
});


// ==================== MENU SCENE ====================
k.scene("menu", () => {
    loadSave();

    // Background blocks pattern (decorative)
    for (let i = 0; i < 40; i++) {
        const bx = k.rand(0, 800);
        const by = k.rand(0, 600);
        const bs = k.rand(15, 55);
        k.add([
            k.rect(bs, bs),
            k.pos(bx, by),
            k.color(k.rand(30, 60), k.rand(30, 60), k.rand(40, 80)),
            k.opacity(0.25),
            k.anchor("center"),
            k.rotate(k.rand(0, 45)),
        ]);
    }

    // Title shadow
    k.add([
        k.text("BLOCKDASH", { size: 74 }),
        k.pos(404, 124),
        k.anchor("center"),
        k.color(0, 0, 0),
        k.opacity(0.5),
    ]);
    // Title
    k.add([
        k.text("BLOCKDASH", { size: 74 }),
        k.pos(400, 120),
        k.anchor("center"),
        k.color(255, 215, 0),
    ]);
    // Subtitle
    k.add([
        k.text("Minecraft x Subway Surfers", { size: 18 }),
        k.pos(400, 170),
        k.anchor("center"),
        k.color(170, 170, 200),
    ]);


    // Preview character on menu
    const skin = SKINS[gameState.activeSkin];
    const px = 400, py = 320;
    // Shadow under character
    k.add([k.rect(50, 10), k.pos(px, py + 50), k.anchor("center"), k.color(0, 0, 0), k.opacity(0.3)]);
    // Head
    k.add([k.rect(36, 36), k.pos(px, py - 55), k.anchor("center"), k.color(...skin.head)]);
    k.add([k.rect(10, 36), k.pos(px + 13, py - 55), k.anchor("center"), k.color(0, 0, 0), k.opacity(0.15)]);
    // Eyes
    k.add([k.rect(7, 7), k.pos(px - 9, py - 58), k.anchor("center"), k.color(255, 255, 255)]);
    k.add([k.rect(7, 7), k.pos(px + 9, py - 58), k.anchor("center"), k.color(255, 255, 255)]);
    k.add([k.rect(4, 4), k.pos(px - 9, py - 57), k.anchor("center"), k.color(20, 20, 20)]);
    k.add([k.rect(4, 4), k.pos(px + 9, py - 57), k.anchor("center"), k.color(20, 20, 20)]);
    // Body
    k.add([k.rect(30, 38), k.pos(px, py - 16), k.anchor("center"), k.color(...skin.body)]);
    k.add([k.rect(8, 38), k.pos(px + 11, py - 16), k.anchor("center"), k.color(0, 0, 0), k.opacity(0.12)]);
    // Arms
    k.add([k.rect(9, 34), k.pos(px - 22, py - 16), k.anchor("center"), k.color(...skin.body)]);
    k.add([k.rect(9, 34), k.pos(px + 22, py - 16), k.anchor("center"), k.color(...skin.body)]);
    // Legs
    k.add([k.rect(12, 28), k.pos(px - 8, py + 18), k.anchor("center"), k.color(...skin.legs)]);
    k.add([k.rect(12, 28), k.pos(px + 8, py + 18), k.anchor("center"), k.color(...skin.legs)]);


    // Play button
    k.add([k.rect(228, 64), k.pos(400, 440), k.anchor("center"), k.color(30, 100, 30)]);
    k.add([k.rect(220, 58), k.pos(400, 440), k.anchor("center"), k.color(50, 180, 50), k.area(), "playBtn"]);
    k.add([k.text("PLAY", { size: 30 }), k.pos(400, 440), k.anchor("center"), k.color(255, 255, 255)]);

    // Stats
    if (gameState.bestDistance > 0) {
        k.add([k.text(`Best: ${Math.floor(gameState.bestDistance)}m`, { size: 18 }), k.pos(400, 500), k.anchor("center"), k.color(200, 200, 200)]);
    }
    k.add([k.text(`Total Gems: ${gameState.totalGems}`, { size: 15 }), k.pos(400, 528), k.anchor("center"), k.color(50, 220, 100)]);
    k.add([k.text("Tap/Click or SPACE to play  |  [S] Skins", { size: 13 }), k.pos(400, 570), k.anchor("center"), k.color(100, 100, 130)]);

    // Controls hint
    k.add([k.text("A/D or Arrows: Move  |  W/Space: Jump  |  S: Slide", { size: 12 }), k.pos(400, 590), k.anchor("center"), k.color(80, 80, 110)]);

    k.onClick("playBtn", () => k.go("game"));
    k.onKeyPress("space", () => k.go("game"));
    k.onKeyPress("enter", () => k.go("game"));
    // Touch anywhere also starts
    k.onClick(() => k.go("game"));
});


// ==================== GAME SCENE ====================
k.scene("game", () => {
    loadSave();
    resetGameState();

    let targetLane = 1;
    let playerVisualX = getLaneX(1, 1);
    let jumpProgress = -1; // -1 = not jumping, 0..1 = jump arc
    let slideProgress = -1; // -1 = not sliding, 0..1 = slide
    let spawnTimer = 0;
    let gemSpawnTimer = 0;
    let shakeTimer = 0;
    let shakeIntensity = 0;
    let flashTimer = 0;
    let flashColor = [255, 215, 0];
    let zoneAnnounceTimer = 0;
    let zoneAnnounceName = "";
    let lastZone = 1;
    let comboDisplayTimer = 0;
    let nearMissTimer = 0;
    let rng = seededRandom(Date.now());
    let roadAnimOffset = 0;
    let obstacles = [];
    let gems = [];
    let particles = [];
    let isGameOver = false;

    // Touch tracking for swipe
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;


    // ===== BACKGROUND =====
    const bgObj = k.add([k.rect(800, 600), k.pos(0, 0), k.color(...ZONES[1].bg), k.z(-100)]);

    // Decorative background blocks
    const bgBlocks = [];
    for (let i = 0; i < 25; i++) {
        const b = k.add([
            k.rect(k.rand(15, 45), k.rand(15, 45)),
            k.pos(k.rand(0, 800), k.rand(0, HORIZON_Y - 10)),
            k.color(k.rand(40, 80), k.rand(40, 80), k.rand(50, 100)),
            k.opacity(0.3),
            k.z(-90),
        ]);
        bgBlocks.push(b);
    }

    // Mountains/buildings silhouette at horizon
    for (let i = 0; i < 12; i++) {
        const mx = i * 70 + k.rand(-10, 10);
        const mh = k.rand(30, 80);
        k.add([
            k.rect(k.rand(40, 70), mh),
            k.pos(mx, HORIZON_Y - mh),
            k.color(k.rand(25, 45), k.rand(25, 45), k.rand(35, 55)),
            k.opacity(0.6),
            k.z(-85),
        ]);
    }

    // Horizon line
    k.add([k.rect(800, 2), k.pos(0, HORIZON_Y), k.color(100, 100, 130), k.z(-50)]);


    // ===== ROAD (pseudo-3D) =====
    // Road surface - drawn as horizontal slices for perspective
    const roadSlices = [];
    for (let i = 0; i < 50; i++) {
        const t = i / 49;
        const y = lerp(HORIZON_Y, 590, t);
        const w = getRoadWidth(t);
        const slice = k.add([
            k.rect(w, 9),
            k.pos(400 - w / 2, y),
            k.color(...ZONES[1].road),
            k.opacity(0.85 + t * 0.15),
            k.z(-40),
        ]);
        roadSlices.push({ obj: slice, t });
    }

    // Road edge blocks (decorative side walls)
    const sideBlocks = [];
    for (let i = 0; i < 20; i++) {
        const t = i / 19;
        const y = lerp(HORIZON_Y + 5, 580, t);
        const w = getRoadWidth(t);
        const size = lerp(4, 16, t);
        // Left side
        const lb = k.add([
            k.rect(size, size),
            k.pos(400 - w / 2 - size / 2, y),
            k.color(100, 100, 110),
            k.opacity(t * 0.6),
            k.z(-35),
        ]);
        // Right side
        const rb = k.add([
            k.rect(size, size),
            k.pos(400 + w / 2 + size / 2, y),
            k.color(100, 100, 110),
            k.opacity(t * 0.6),
            k.z(-35),
        ]);
        sideBlocks.push({ l: lb, r: rb, t });
    }


    // Lane dividers (animated dashes)
    const dividers = [];
    for (let i = 0; i < 35; i++) {
        const t = (i / 34);
        const y = lerp(HORIZON_Y + 5, 575, t);
        const roadW = getRoadWidth(t);
        const laneW = roadW / 3;
        const cx = 400;
        const dashH = lerp(2, 10, t);
        const dashW = lerp(1, 3, t);
        for (let ln = 0; ln < 2; ln++) {
            const lx = cx - roadW / 2 + laneW * (ln + 1);
            const d = k.add([
                k.rect(dashW, dashH),
                k.pos(lx, y),
                k.anchor("center"),
                k.color(200, 200, 220),
                k.opacity(t * 0.35),
                k.z(-30),
            ]);
            dividers.push({ obj: d, baseY: y, t, lane: ln });
        }
    }


    // ===== PLAYER =====
    const skin = SKINS[gameState.activeSkin];
    const player = k.add([k.pos(getLaneX(1, 1), PLAYER_Y), k.z(50), k.opacity(1), "player"]);
    
    // Player body parts (all relative coords, moved with player)
    function drawPlayer() {
        // We'll just update player position - parts are drawn in onDraw
    }

    // ===== SPAWN OBSTACLE =====
    function spawnObstacle() {
        const zone = gameState.zone;
        const lane = Math.floor(rng() * 3); // 0, 1, 2
        let type = "block";
        
        const r = rng();
        if (zone >= 2 && r > 0.6) type = "tall";
        if (zone >= 2 && r > 0.8) type = "low";
        if (zone >= 3 && r > 0.7) type = "double";
        if (zone >= 3 && r > 0.9) type = "boom";

        // For double blocks, pick adjacent lanes
        let lanes = [lane];
        if (type === "double") {
            if (lane === 0) lanes = [0, 1];
            else if (lane === 2) lanes = [1, 2];
            else lanes = rng() > 0.5 ? [0, 1] : [1, 2];
        }

        obstacles.push({
            lanes: lanes,
            type: type,
            depth: 0.0, // starts at horizon
            active: true,
            scored: false,
        });
    }


    // ===== SPAWN GEM =====
    function spawnGem() {
        const lane = Math.floor(rng() * 3);
        const isRare = rng() > 0.92;
        const isPowerShield = !isRare && rng() > 0.96;
        const isPowerMagnet = !isRare && !isPowerShield && rng() > 0.97;

        let type = "gem";
        if (isRare) type = "rare";
        if (isPowerShield) type = "shield";
        if (isPowerMagnet) type = "magnet";

        gems.push({
            lane: lane,
            depth: 0.0,
            type: type,
            active: true,
            collected: false,
        });
    }

    // ===== SPAWN PARTICLES =====
    function spawnParticles(x, y, col, count, spread, life) {
        for (let i = 0; i < count; i++) {
            particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * spread,
                vy: (Math.random() - 0.8) * spread,
                size: Math.random() * 6 + 2,
                color: col,
                life: life,
                maxLife: life,
            });
        }
    }


    // ===== INPUT HANDLING =====
    function moveLeft() {
        if (isGameOver) return;
        if (targetLane > 0) {
            targetLane--;
            gameState.lane = targetLane;
        }
    }
    function moveRight() {
        if (isGameOver) return;
        if (targetLane < 2) {
            targetLane++;
            gameState.lane = targetLane;
        }
    }
    function doJump() {
        if (isGameOver) return;
        if (jumpProgress < 0 && slideProgress < 0) {
            jumpProgress = 0;
            gameState.isJumping = true;
        }
    }
    function doSlide() {
        if (isGameOver) return;
        if (jumpProgress < 0 && slideProgress < 0) {
            slideProgress = 0;
            gameState.isSliding = true;
        }
    }

    // Keyboard input
    k.onKeyPress("a", moveLeft);
    k.onKeyPress("left", moveLeft);
    k.onKeyPress("d", moveRight);
    k.onKeyPress("right", moveRight);
    k.onKeyPress("w", doJump);
    k.onKeyPress("up", doJump);
    k.onKeyPress("space", doJump);
    k.onKeyPress("s", doSlide);
    k.onKeyPress("down", doSlide);


    // Touch/swipe input
    k.onTouchStart((pos) => {
        touchStartX = pos.x;
        touchStartY = pos.y;
        touchStartTime = k.time();
    });
    k.onTouchEnd((pos) => {
        const dx = pos.x - touchStartX;
        const dy = pos.y - touchStartY;
        const dt = k.time() - touchStartTime;
        if (dt > 0.5) return; // too slow

        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        const threshold = 30;

        if (absDx > absDy && absDx > threshold) {
            if (dx < 0) moveLeft();
            else moveRight();
        } else if (absDy > absDx && absDy > threshold) {
            if (dy < 0) doJump();
            else doSlide();
        }
    });


    // ===== COLLISION DETECTION =====
    function checkCollisions() {
        const playerLane = gameState.lane;
        const playerDepth = 0.85; // player is at this depth level

        for (let obs of obstacles) {
            if (!obs.active) continue;
            if (obs.depth < playerDepth - 0.06 || obs.depth > playerDepth + 0.06) continue;

            // Near-miss detection (slightly wider check)
            const isInLane = obs.lanes.includes(playerLane);
            const isNearLane = obs.lanes.some(l => Math.abs(l - playerLane) === 1);

            if (isInLane) {
                // Check if jumping over or sliding under
                if (obs.type === "low" && gameState.isSliding) continue;
                if ((obs.type === "block" || obs.type === "boom" || obs.type === "double") && gameState.isJumping) continue;

                // HIT!
                if (gameState.hasShield) {
                    gameState.hasShield = false;
                    obs.active = false;
                    spawnParticles(playerVisualX, PLAYER_Y - 30, [255, 215, 0], 12, 8, 0.5);
                    shakeTimer = 0.15;
                    shakeIntensity = 3;
                } else {
                    triggerDeath();
                }
                return;
            }

            // Near miss bonus
            if (isNearLane && !obs.scored && obs.depth > playerDepth - 0.03) {
                obs.scored = true;
                gameState.nearMisses++;
                gameState.distance += 25;
                nearMissTimer = 0.8;
                flashTimer = 0.2;
                flashColor = [255, 200, 50];
                spawnParticles(playerVisualX, PLAYER_Y - 20, [255, 220, 50], 6, 4, 0.3);
            }
        }
    }


    // ===== GEM COLLECTION =====
    function checkGemCollection() {
        const playerLane = gameState.lane;
        const playerDepth = 0.85;

        for (let gem of gems) {
            if (!gem.active || gem.collected) continue;
            
            // Magnet: attract from any lane
            const magnetRange = gameState.hasMagnet ? 2 : 0;
            const laneMatch = Math.abs(gem.lane - playerLane) <= magnetRange;
            const depthMatch = gem.depth > playerDepth - 0.08 && gem.depth < playerDepth + 0.08;

            if (laneMatch && depthMatch) {
                gem.collected = true;
                gem.active = false;

                if (gem.type === "gem") {
                    gameState.gems += (1 * gameState.comboMultiplier);
                    gameState.distance += 10 * gameState.comboMultiplier;
                    gameState.combo++;
                    if (gameState.combo >= 10) gameState.comboMultiplier = Math.min(4, 1 + Math.floor(gameState.combo / 5));
                    comboDisplayTimer = 1.0;
                    spawnParticles(getLaneX(gem.lane, playerDepth), PLAYER_Y - 20, [50, 220, 100], 4, 3, 0.3);
                } else if (gem.type === "rare") {
                    gameState.gems += (5 * gameState.comboMultiplier);
                    gameState.distance += 50 * gameState.comboMultiplier;
                    gameState.combo += 3;
                    gameState.comboMultiplier = Math.min(4, 1 + Math.floor(gameState.combo / 5));
                    comboDisplayTimer = 1.5;
                    spawnParticles(getLaneX(gem.lane, playerDepth), PLAYER_Y - 20, [80, 220, 255], 8, 5, 0.4);
                    flashTimer = 0.3;
                    flashColor = [80, 220, 255];
                } else if (gem.type === "shield") {
                    gameState.hasShield = true;
                    spawnParticles(getLaneX(gem.lane, playerDepth), PLAYER_Y - 20, [255, 215, 0], 10, 6, 0.5);
                    flashTimer = 0.2;
                    flashColor = [255, 215, 0];
                } else if (gem.type === "magnet") {
                    gameState.hasMagnet = true;
                    gameState.magnetTimer = 5.0;
                    spawnParticles(getLaneX(gem.lane, playerDepth), PLAYER_Y - 20, [180, 50, 255], 10, 6, 0.5);
                    flashTimer = 0.3;
                    flashColor = [180, 50, 255];
                }
            }
        }
    }


    // ===== DEATH =====
    function triggerDeath() {
        if (isGameOver) return;
        isGameOver = true;
        gameState.isDead = true;
        shakeTimer = 0.5;
        shakeIntensity = 8;

        // Death particles (character explodes into blocks)
        spawnParticles(playerVisualX, PLAYER_Y - 30, skin.head, 6, 10, 1.0);
        spawnParticles(playerVisualX, PLAYER_Y - 10, skin.body, 8, 8, 1.0);
        spawnParticles(playerVisualX, PLAYER_Y + 10, skin.legs, 4, 6, 0.8);

        // Save scores
        const finalDist = Math.floor(gameState.distance);
        if (finalDist > gameState.bestDistance) {
            gameState.bestDistance = finalDist;
        }
        gameState.totalDistance += finalDist;
        gameState.totalGems += gameState.gems;

        // Check skin unlocks
        const skinKeys = Object.keys(SKIN_UNLOCK_REQS);
        for (const sk of skinKeys) {
            if (!gameState.unlockedSkins.includes(sk) && gameState.totalDistance >= SKIN_UNLOCK_REQS[sk]) {
                gameState.unlockedSkins.push(sk);
            }
        }
        savePersist();

        // Delay before game over screen
        setTimeout(() => {
            k.go("gameover", { distance: finalDist, gems: gameState.gems, nearMisses: gameState.nearMisses });
        }, 1200);
    }


    // ===== MAIN UPDATE LOOP =====
    k.onUpdate(() => {
        if (isGameOver) {
            // Still update particles during death
            updateParticles(k.dt());
            return;
        }

        const dt = k.dt();
        const speed = getSpeedMultiplier(gameState.distance);
        gameState.speed = speed;
        const moveSpeed = BASE_SPEED * speed;

        // Update distance
        gameState.distance += moveSpeed * dt * 20;

        // Zone detection
        const newZone = getCurrentZone(gameState.distance);
        if (newZone !== lastZone) {
            lastZone = newZone;
            gameState.zone = newZone;
            zoneAnnounceName = ZONES[newZone].name;
            zoneAnnounceTimer = 2.5;
            flashTimer = 0.5;
            flashColor = ZONES[newZone].accent;
            // Update road colors
            roadSlices.forEach(s => {
                s.obj.color = k.rgb(...ZONES[newZone].road);
            });
            bgObj.color = k.rgb(...ZONES[newZone].bg);
            sideBlocks.forEach(s => {
                s.l.color = k.rgb(...ZONES[newZone].line);
                s.r.color = k.rgb(...ZONES[newZone].line);
            });
        }

        // Player lane movement (smooth)
        const targetX = getLaneX(targetLane, 1);
        playerVisualX = lerp(playerVisualX, targetX, 0.3);
        player.pos.x = playerVisualX;


        // Jump update
        if (jumpProgress >= 0) {
            jumpProgress += dt / 0.7; // 0.7s total jump
            if (jumpProgress >= 1) {
                jumpProgress = -1;
                gameState.isJumping = false;
                // Landing particles
                spawnParticles(playerVisualX, PLAYER_Y + 10, [120, 120, 140], 4, 3, 0.2);
            }
        }

        // Slide update
        if (slideProgress >= 0) {
            slideProgress += dt / 0.5; // 0.5s slide
            if (slideProgress >= 1) {
                slideProgress = -1;
                gameState.isSliding = false;
            }
        }

        // Magnet timer
        if (gameState.hasMagnet) {
            gameState.magnetTimer -= dt;
            if (gameState.magnetTimer <= 0) {
                gameState.hasMagnet = false;
            }
        }

        // Combo decay
        if (comboDisplayTimer > 0) {
            comboDisplayTimer -= dt;
        } else if (gameState.combo > 0) {
            // Reset combo after not collecting for a while
            gameState.combo = 0;
            gameState.comboMultiplier = 1;
        }

        // Road animation (dashes moving toward player)
        roadAnimOffset += moveSpeed * dt * 0.05;
        if (roadAnimOffset > 1) roadAnimOffset -= 1;


        // Spawn obstacles
        spawnTimer += dt;
        const spawnInterval = SPAWN_INTERVAL_BASE / speed;
        if (spawnTimer >= spawnInterval) {
            spawnTimer = 0;
            spawnObstacle();
            // Sometimes spawn double for difficulty
            if (gameState.zone >= 2 && rng() > 0.7) {
                spawnObstacle();
            }
        }

        // Spawn gems
        gemSpawnTimer += dt;
        if (gemSpawnTimer >= GEM_SPAWN_INTERVAL / speed) {
            gemSpawnTimer = 0;
            spawnGem();
            // Gem lines
            if (rng() > 0.6) spawnGem();
            if (rng() > 0.8) spawnGem();
        }

        // Update obstacles
        for (let obs of obstacles) {
            if (!obs.active) continue;
            obs.depth += moveSpeed * dt * 0.012;
            if (obs.depth > 1.1) obs.active = false;
        }
        obstacles = obstacles.filter(o => o.active);

        // Update gems
        for (let gem of gems) {
            if (!gem.active) continue;
            gem.depth += moveSpeed * dt * 0.012;
            if (gem.depth > 1.1) {
                gem.active = false;
                // Missed gem in lane - could break combo
            }
        }
        gems = gems.filter(g => g.active);

        // Check collisions
        checkCollisions();
        checkGemCollection();

        // Update timers
        if (shakeTimer > 0) shakeTimer -= dt;
        if (flashTimer > 0) flashTimer -= dt;
        if (zoneAnnounceTimer > 0) zoneAnnounceTimer -= dt;
        if (nearMissTimer > 0) nearMissTimer -= dt;

        // Update particles
        updateParticles(dt);
    });


    function updateParticles(dt) {
        for (let p of particles) {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 12 * dt; // gravity
            p.life -= dt;
        }
        particles = particles.filter(p => p.life > 0);
    }


    // ===== CUSTOM DRAW (all game objects rendered here for pseudo-3D) =====
    k.onDraw(() => {
        // Screen shake offset
        let shakeX = 0, shakeY = 0;
        if (shakeTimer > 0) {
            shakeX = (Math.random() - 0.5) * shakeIntensity * 2;
            shakeY = (Math.random() - 0.5) * shakeIntensity * 2;
        }

        // Draw obstacles (sorted by depth for proper layering)
        const sortedObs = [...obstacles].sort((a, b) => a.depth - b.depth);
        for (const obs of sortedObs) {
            const depth = obs.depth;
            const scale = lerp(0.3, 1.0, depth);
            const y = lerp(HORIZON_Y + 10, PLAYER_Y + 30, depth) + shakeY;

            for (const lane of obs.lanes) {
                const x = getLaneX(lane, depth) + shakeX;
                const w = 40 * scale;
                const h = obs.type === "tall" ? 70 * scale : (obs.type === "low" ? 20 * scale : 45 * scale);
                const yOff = obs.type === "low" ? -35 * scale : 0;

                // Obstacle body
                let col = ZONES[gameState.zone].line;
                if (obs.type === "boom") col = [50, 180, 50];
                else if (obs.type === "tall") col = [140, 80, 40];

                k.drawRect({
                    pos: k.vec2(x, y - h + yOff),
                    width: w,
                    height: h,
                    anchor: "center",
                    color: k.rgb(...col),
                });
                // Shadow/depth edge
                k.drawRect({
                    pos: k.vec2(x + w * 0.15, y - h + yOff),
                    width: w * 0.35,
                    height: h,
                    anchor: "center",
                    color: k.rgb(0, 0, 0),
                    opacity: 0.2,
                });


                // Grid lines on obstacle (minecraft texture feel)
                const gridSize = w / 3;
                for (let gx = 0; gx < 3; gx++) {
                    k.drawRect({
                        pos: k.vec2(x - w/2 + gx * gridSize, y - h + yOff - h/2),
                        width: 1,
                        height: h,
                        color: k.rgb(0, 0, 0),
                        opacity: 0.15,
                    });
                }
                for (let gy = 0; gy < 3; gy++) {
                    k.drawRect({
                        pos: k.vec2(x - w/2, y - h + yOff - h/2 + gy * (h/3)),
                        width: w,
                        height: 1,
                        color: k.rgb(0, 0, 0),
                        opacity: 0.15,
                    });
                }

                // Boom block face
                if (obs.type === "boom") {
                    const faceS = w * 0.2;
                    k.drawRect({ pos: k.vec2(x - faceS, y - h + yOff - faceS * 0.3), width: faceS * 0.5, height: faceS * 0.5, anchor: "center", color: k.rgb(20, 20, 20) });
                    k.drawRect({ pos: k.vec2(x + faceS, y - h + yOff - faceS * 0.3), width: faceS * 0.5, height: faceS * 0.5, anchor: "center", color: k.rgb(20, 20, 20) });
                    k.drawRect({ pos: k.vec2(x, y - h + yOff + faceS * 0.4), width: faceS * 1.2, height: faceS * 0.4, anchor: "center", color: k.rgb(20, 20, 20) });
                }

                // Top face for 3D look
                k.drawRect({
                    pos: k.vec2(x, y - h - h/2 + yOff),
                    width: w * 0.9,
                    height: w * 0.3 * scale,
                    anchor: "center",
                    color: k.rgb(col[0] + 30, col[1] + 30, col[2] + 30),
                });
            }
        }


        // Draw gems
        for (const gem of gems) {
            const depth = gem.depth;
            const scale = lerp(0.3, 1.0, depth);
            const y = lerp(HORIZON_Y + 10, PLAYER_Y + 30, depth) + shakeY;
            const x = getLaneX(gem.lane, depth) + shakeX;
            const size = 14 * scale;

            let col = [50, 220, 100]; // green gem
            if (gem.type === "rare") col = [80, 220, 255];
            if (gem.type === "shield") col = [255, 215, 0];
            if (gem.type === "magnet") col = [180, 50, 255];

            // Gem shape - rotated square (diamond shape)
            const time = k.time();
            const rot = Math.sin(time * 3 + depth * 10) * 15 + 45;
            const pulse = gem.type === "rare" ? (1 + Math.sin(time * 5) * 0.2) : 1;

            k.drawRect({
                pos: k.vec2(x, y - 30 * scale),
                width: size * pulse,
                height: size * pulse,
                anchor: "center",
                color: k.rgb(...col),
                angle: rot,
            });
            // Inner highlight
            k.drawRect({
                pos: k.vec2(x - size * 0.15, y - 30 * scale - size * 0.15),
                width: size * 0.4 * pulse,
                height: size * 0.4 * pulse,
                anchor: "center",
                color: k.rgb(255, 255, 255),
                opacity: 0.4,
                angle: rot,
            });

            // Glow for power-ups
            if (gem.type === "shield" || gem.type === "magnet") {
                k.drawRect({
                    pos: k.vec2(x, y - 30 * scale),
                    width: size * 2,
                    height: size * 2,
                    anchor: "center",
                    color: k.rgb(...col),
                    opacity: 0.15 + Math.sin(time * 4) * 0.1,
                    angle: rot + 45,
                });
            }
        }


        // Draw player character
        if (!isGameOver) {
            const px = playerVisualX + shakeX;
            let py = PLAYER_Y + shakeY;
            let scaleY = 1;
            let armAngle = Math.sin(k.time() * 12) * 15; // running animation

            // Jump arc
            if (jumpProgress >= 0) {
                const arc = Math.sin(jumpProgress * Math.PI);
                py -= arc * 80;
                armAngle = -30; // arms up during jump
            }
            // Slide squish
            if (slideProgress >= 0) {
                scaleY = 0.5;
                py += 20;
                armAngle = 0;
            }

            // Shadow
            k.drawRect({
                pos: k.vec2(px, PLAYER_Y + 15),
                width: 36,
                height: 8,
                anchor: "center",
                color: k.rgb(0, 0, 0),
                opacity: 0.3,
            });

            // Shield glow
            if (gameState.hasShield) {
                k.drawRect({
                    pos: k.vec2(px, py - 25 * scaleY),
                    width: 50,
                    height: 70 * scaleY,
                    anchor: "center",
                    color: k.rgb(255, 215, 0),
                    opacity: 0.2 + Math.sin(k.time() * 6) * 0.1,
                });
            }

            // Legs
            const legSwing = Math.sin(k.time() * 14) * 3;
            k.drawRect({
                pos: k.vec2(px - 6, py + legSwing),
                width: 9 , height: 20 * scaleY,
                anchor: "center", color: k.rgb(...skin.legs),
            });
            k.drawRect({
                pos: k.vec2(px + 6, py - legSwing),
                width: 9, height: 20 * scaleY,
                anchor: "center", color: k.rgb(...skin.legs),
            });


            // Body
            k.drawRect({
                pos: k.vec2(px, py - 22 * scaleY),
                width: 22, height: 28 * scaleY,
                anchor: "center", color: k.rgb(...skin.body),
            });
            // Body shadow
            k.drawRect({
                pos: k.vec2(px + 6, py - 22 * scaleY),
                width: 6, height: 28 * scaleY,
                anchor: "center", color: k.rgb(0, 0, 0), opacity: 0.15,
            });

            // Arms (animated swing)
            k.drawRect({
                pos: k.vec2(px - 15, py - 22 * scaleY + Math.sin(k.time() * 12 + 1) * 4),
                width: 7, height: 24 * scaleY,
                anchor: "center", color: k.rgb(...skin.body),
            });
            k.drawRect({
                pos: k.vec2(px + 15, py - 22 * scaleY + Math.sin(k.time() * 12 + 3) * 4),
                width: 7, height: 24 * scaleY,
                anchor: "center", color: k.rgb(...skin.body),
            });

            // Head
            k.drawRect({
                pos: k.vec2(px, py - 48 * scaleY),
                width: 24, height: 24 * scaleY,
                anchor: "center", color: k.rgb(...skin.head),
            });
            // Head shadow
            k.drawRect({
                pos: k.vec2(px + 7, py - 48 * scaleY),
                width: 6, height: 24 * scaleY,
                anchor: "center", color: k.rgb(0, 0, 0), opacity: 0.15,
            });
            // Eyes
            k.drawRect({ pos: k.vec2(px - 5, py - 50 * scaleY), width: 5, height: 5, anchor: "center", color: k.rgb(255, 255, 255) });
            k.drawRect({ pos: k.vec2(px + 5, py - 50 * scaleY), width: 5, height: 5, anchor: "center", color: k.rgb(255, 255, 255) });
            k.drawRect({ pos: k.vec2(px - 5, py - 49 * scaleY), width: 3, height: 3, anchor: "center", color: k.rgb(20, 20, 20) });
            k.drawRect({ pos: k.vec2(px + 5, py - 49 * scaleY), width: 3, height: 3, anchor: "center", color: k.rgb(20, 20, 20) });
        }


        // Draw particles
        for (const p of particles) {
            const alpha = p.life / p.maxLife;
            k.drawRect({
                pos: k.vec2(p.x + shakeX, p.y + shakeY),
                width: p.size * alpha,
                height: p.size * alpha,
                anchor: "center",
                color: k.rgb(...p.color),
                opacity: alpha,
                angle: (1 - alpha) * 90,
            });
        }

        // Screen flash effect
        if (flashTimer > 0) {
            k.drawRect({
                pos: k.vec2(0, 0),
                width: 800,
                height: 600,
                color: k.rgb(...flashColor),
                opacity: flashTimer * 0.3,
            });
        }


        // ===== HUD =====
        // Distance
        k.drawText({
            text: `${Math.floor(gameState.distance)}m`,
            pos: k.vec2(400, 30),
            size: 32,
            anchor: "center",
            color: k.rgb(255, 255, 255),
        });
        // Speed indicator
        k.drawText({
            text: `x${gameState.speed.toFixed(2)}`,
            pos: k.vec2(400, 55),
            size: 14,
            anchor: "center",
            color: k.rgb(180, 180, 200),
        });

        // Gems counter (top-left)
        k.drawRect({ pos: k.vec2(20, 18), width: 16, height: 16, anchor: "center", color: k.rgb(50, 220, 100), angle: 45 });
        k.drawText({
            text: `${gameState.gems}`,
            pos: k.vec2(42, 18),
            size: 18,
            anchor: "left",
            color: k.rgb(50, 220, 100),
        });

        // Combo display
        if (gameState.comboMultiplier > 1 && comboDisplayTimer > 0) {
            const comboCol = gameState.comboMultiplier >= 4 ? [255, 215, 0] : 
                            gameState.comboMultiplier >= 3 ? [255, 200, 50] : [255, 255, 255];
            k.drawText({
                text: `x${gameState.comboMultiplier} COMBO`,
                pos: k.vec2(400, 80),
                size: 20 + gameState.comboMultiplier * 2,
                anchor: "center",
                color: k.rgb(...comboCol),
                opacity: Math.min(1, comboDisplayTimer),
            });
        }


        // Near miss text
        if (nearMissTimer > 0) {
            k.drawText({
                text: "CLOSE CALL! +25",
                pos: k.vec2(400, 110),
                size: 16,
                anchor: "center",
                color: k.rgb(255, 220, 50),
                opacity: nearMissTimer,
            });
        }

        // Zone announcement
        if (zoneAnnounceTimer > 0) {
            const zCol = ZONES[gameState.zone].accent;
            k.drawRect({
                pos: k.vec2(400, 300),
                width: 300,
                height: 50,
                anchor: "center",
                color: k.rgb(0, 0, 0),
                opacity: Math.min(0.7, zoneAnnounceTimer * 0.4),
            });
            k.drawText({
                text: `ZONE: ${zoneAnnounceName}`,
                pos: k.vec2(400, 300),
                size: 24,
                anchor: "center",
                color: k.rgb(...zCol),
                opacity: Math.min(1, zoneAnnounceTimer * 0.6),
            });
        }

        // Shield indicator
        if (gameState.hasShield) {
            k.drawRect({ pos: k.vec2(770, 30), width: 20, height: 20, anchor: "center", color: k.rgb(255, 215, 0) });
            k.drawText({ text: "S", pos: k.vec2(770, 30), size: 12, anchor: "center", color: k.rgb(0, 0, 0) });
        }

        // Magnet indicator
        if (gameState.hasMagnet) {
            k.drawRect({ pos: k.vec2(740, 30), width: 20, height: 20, anchor: "center", color: k.rgb(180, 50, 255) });
            k.drawText({ text: "M", pos: k.vec2(740, 30), size: 12, anchor: "center", color: k.rgb(255, 255, 255) });
        }

        // Best distance marker
        if (gameState.bestDistance > 0) {
            k.drawText({
                text: `Best: ${Math.floor(gameState.bestDistance)}m`,
                pos: k.vec2(700, 580),
                size: 12,
                anchor: "center",
                color: k.rgb(150, 150, 170),
            });
        }
    });
});


// ==================== GAME OVER SCENE ====================
k.scene("gameover", ({ distance, gems, nearMisses }) => {
    loadSave();

    // Dark overlay background
    k.add([k.rect(800, 600), k.pos(0, 0), k.color(15, 15, 25), k.opacity(0.95)]);

    // Decorative death particles (static)
    for (let i = 0; i < 30; i++) {
        k.add([
            k.rect(k.rand(8, 25), k.rand(8, 25)),
            k.pos(k.rand(0, 800), k.rand(0, 600)),
            k.color(k.rand(40, 80), k.rand(20, 50), k.rand(20, 40)),
            k.opacity(0.3),
            k.anchor("center"),
            k.rotate(k.rand(0, 90)),
        ]);
    }

    // Tombstone block
    k.add([k.rect(124, 164), k.pos(400, 220), k.anchor("center"), k.color(60, 60, 70)]);
    k.add([k.rect(120, 160), k.pos(400, 220), k.anchor("center"), k.color(80, 80, 90)]);
    // Cross on tombstone
    k.add([k.rect(8, 60), k.pos(400, 200), k.anchor("center"), k.color(50, 50, 60)]);
    k.add([k.rect(40, 8), k.pos(400, 185), k.anchor("center"), k.color(50, 50, 60)]);

    // "YOU FELL" text
    k.add([
        k.text("YOU FELL!", { size: 42 }),
        k.pos(400, 330),
        k.anchor("center"),
        k.color(220, 60, 60),
    ]);


    // Stats
    k.add([k.text(`Distance: ${distance}m`, { size: 24 }), k.pos(400, 380), k.anchor("center"), k.color(255, 255, 255)]);
    k.add([k.text(`Gems: ${gems}`, { size: 18 }), k.pos(400, 415), k.anchor("center"), k.color(50, 220, 100)]);
    k.add([k.text(`Close Calls: ${nearMisses}`, { size: 16 }), k.pos(400, 445), k.anchor("center"), k.color(255, 200, 50)]);

    // Best comparison
    const isNewBest = distance >= gameState.bestDistance;
    if (isNewBest) {
        k.add([k.text("NEW BEST!", { size: 20 }), k.pos(400, 475), k.anchor("center"), k.color(255, 215, 0)]);
    } else {
        k.add([k.text(`Best: ${gameState.bestDistance}m`, { size: 16 }), k.pos(400, 475), k.anchor("center"), k.color(150, 150, 170)]);
    }

    // Retry button
    k.add([k.rect(204, 54), k.pos(400, 535), k.anchor("center"), k.color(30, 100, 30)]);
    k.add([k.rect(200, 50), k.pos(400, 535), k.anchor("center"), k.color(50, 180, 50), k.area(), "retryBtn"]);
    k.add([k.text("RETRY", { size: 26 }), k.pos(400, 535), k.anchor("center"), k.color(255, 255, 255)]);

    // Menu button
    k.add([k.text("[M] Menu  |  [S] Skins", { size: 13 }), k.pos(400, 575), k.anchor("center"), k.color(100, 100, 130)]);

    k.onClick("retryBtn", () => k.go("game"));
    k.onClick(() => k.go("game"));
    k.onKeyPress("space", () => k.go("game"));
    k.onKeyPress("enter", () => k.go("game"));
    k.onKeyPress("r", () => k.go("game"));
    k.onKeyPress("m", () => k.go("menu"));
    k.onKeyPress("s", () => k.go("skins"));
    k.onKeyPress("escape", () => k.go("menu"));
});


// ==================== SKINS SCENE ====================
k.scene("skins", () => {
    loadSave();

    k.add([k.rect(800, 600), k.pos(0, 0), k.color(20, 20, 35)]);

    k.add([
        k.text("CHARACTER SKINS", { size: 34 }),
        k.pos(400, 45),
        k.anchor("center"),
        k.color(255, 215, 0),
    ]);

    k.add([
        k.text(`Total Distance: ${gameState.totalDistance}m`, { size: 14 }),
        k.pos(400, 75),
        k.anchor("center"),
        k.color(150, 150, 170),
    ]);

    const skinKeys = Object.keys(SKINS);
    skinKeys.forEach((key, i) => {
        const s = SKINS[key];
        const x = 100 + i * 140;
        const y = 260;
        const unlocked = gameState.unlockedSkins.includes(key);
        const isActive = gameState.activeSkin === key;

        // Card background
        const bgCol = isActive ? [50, 70, 50] : (unlocked ? [40, 44, 55] : [25, 25, 35]);
        k.add([k.rect(115, 200), k.pos(x, y), k.anchor("center"), k.color(...bgCol), k.area(), `skin_${key}`]);
        if (isActive) {
            k.add([k.rect(119, 204), k.pos(x, y), k.anchor("center"), k.color(255, 215, 0), k.z(-1)]);
        }


        const op = unlocked ? 1.0 : 0.35;
        // Mini character
        k.add([k.rect(20, 20), k.pos(x, y - 50), k.anchor("center"), k.color(...s.head), k.opacity(op)]);
        k.add([k.rect(18, 24), k.pos(x, y - 22), k.anchor("center"), k.color(...s.body), k.opacity(op)]);
        k.add([k.rect(6, 18), k.pos(x - 5, y + 2), k.anchor("center"), k.color(...s.legs), k.opacity(op)]);
        k.add([k.rect(6, 18), k.pos(x + 5, y + 2), k.anchor("center"), k.color(...s.legs), k.opacity(op)]);
        // Eyes
        k.add([k.rect(4, 4), k.pos(x - 4, y - 52), k.anchor("center"), k.color(255, 255, 255), k.opacity(op)]);
        k.add([k.rect(4, 4), k.pos(x + 4, y - 52), k.anchor("center"), k.color(255, 255, 255), k.opacity(op)]);

        // Name
        k.add([k.text(s.name, { size: 13 }), k.pos(x, y + 55), k.anchor("center"), k.color(200, 200, 220), k.opacity(op)]);

        if (!unlocked) {
            k.add([k.text("LOCKED", { size: 11 }), k.pos(x, y + 72), k.anchor("center"), k.color(200, 80, 80)]);
            k.add([k.text(`${SKIN_UNLOCK_REQS[key]}m total`, { size: 10 }), k.pos(x, y + 86), k.anchor("center"), k.color(150, 100, 100)]);
        } else if (isActive) {
            k.add([k.text("ACTIVE", { size: 11 }), k.pos(x, y + 72), k.anchor("center"), k.color(50, 220, 100)]);
        } else {
            k.add([k.text("Click to use", { size: 10 }), k.pos(x, y + 72), k.anchor("center"), k.color(150, 150, 180)]);
        }

        if (unlocked && !isActive) {
            k.onClick(`skin_${key}`, () => {
                gameState.activeSkin = key;
                savePersist();
                k.go("skins");
            });
        }
    });

    k.add([k.text("Press SPACE or ESC for Menu", { size: 15 }), k.pos(400, 440), k.anchor("center"), k.color(120, 120, 150)]);

    k.onKeyPress("space", () => k.go("menu"));
    k.onKeyPress("escape", () => k.go("menu"));
    k.onKeyPress("enter", () => k.go("menu"));
});

// Start the game!
k.go("menu");

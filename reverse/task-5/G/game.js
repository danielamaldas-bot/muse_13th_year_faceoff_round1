```js
/**
 * Lumen Veil — main game loop, entities, rendering, input.
 *
 * Performance note (mobile):
 * Canvas `shadowBlur` is re-computed by the rasterizer for every shape it is
 * applied to, and it is extremely slow on phone GPUs/CPUs. The original draw
 * code set a shadow on every moth, every dewdrop, the player and the open gate
 * — plus it rebuilt the background radial gradient and the four meadow rings
 * every single frame. That is what made play choppy once several glowing things
 * were on screen at the same time.
 *
 * The fix keeps every visual exactly as it was, but renders each glowing thing
 * once into a small offscreen sprite (the glow baked in) and then just blits
 * those sprites. Animated glows/flaps are quantized into a handful of cached
 * frames. The static background (gradient + rings) is baked once as well.
 * Source-over compositing is associative, so drawing a cached group looks the
 * same as drawing its shapes straight onto the canvas.
 */
(function () {
  "use strict";

  const canvas = document.getElementById("game");
  // The background fill covers the whole canvas every frame, so we can opt out
  // of an alpha channel and save a compositing pass on mobile browsers.
  const ctx = canvas.getContext("2d", { alpha: false });
  const dialogueEl = document.getElementById("dialogue");
  const hudDew = document.getElementById("hud-dew");
  const hudLives = document.getElementById("hud-lives");
  const overlayEl = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlay-title");
  const overlayBody = document.getElementById("overlay-body");

  canvas.width = CONFIG.canvas.width;
  canvas.height = CONFIG.canvas.height;

  // --- Input ---
  const keys = Object.create(null);
  window.addEventListener("keydown", (e) => {
    keys[e.code] = true;
    if (e.code === "KeyR") {
      e.preventDefault();
      restart();
    }
    if (
      (state.phase === "title" || state.phase === "intro") &&
      (e.code === "Space" || e.code === "Enter")
    ) {
      e.preventDefault();
      beginPlay();
    }
  });
  window.addEventListener("keyup", (e) => {
    keys[e.code] = false;
  });

  // --- Helpers ---
  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }
  function dist(ax, ay, bx, by) {
    const dx = ax - bx;
    const dy = ay - by;
    return Math.hypot(dx, dy);
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function pick(arr) {
    return arr[(Math.random() * arr.length) | 0];
  }

  // --- State ---
  let state;
  let lastTs = 0;
  let rafId = 0;

  function makeParticles() {
    const list = [];
    for (let i = 0; i < CONFIG.world.particleCount; i++) {
      list.push({
        x: rand(0, CONFIG.canvas.width),
        y: rand(0, CONFIG.canvas.height),
        r: rand(0.6, 2.2),
        speed: rand(8, 28),
        alpha: rand(0.15, 0.55),
        phase: rand(0, Math.PI * 2),
      });
    }
    return list;
  }

  function spawnPickups(count) {
    const list = [];
    const m = CONFIG.world.margin + 40;
    for (let i = 0; i < count; i++) {
      let x;
      let y;
      let tries = 0;
      do {
        x = rand(m, CONFIG.canvas.width - m);
        y = rand(m + 40, CONFIG.canvas.height - m - 40);
        tries++;
      } while (
        tries < 40 &&
        (dist(x, y, CONFIG.player.startX, CONFIG.player.startY) < 80 ||
          dist(x, y, CONFIG.gate.x, CONFIG.gate.y) < 90)
      );
      list.push({
        x,
        y,
        taken: false,
        phase: rand(0, Math.PI * 2),
      });
    }
    return list;
  }

  function spawnEnemies(count) {
    const list = [];
    for (let i = 0; i < count; i++) {
      const side = i % 4;
      let x;
      let y;
      if (side === 0) {
        x = rand(60, CONFIG.canvas.width - 60);
        y = 70;
      } else if (side === 1) {
        x = CONFIG.canvas.width - 50;
        y = rand(80, CONFIG.canvas.height - 80);
      } else if (side === 2) {
        x = rand(60, CONFIG.canvas.width - 60);
        y = CONFIG.canvas.height - 50;
      } else {
        x = 50;
        y = rand(80, CONFIG.canvas.height - 80);
      }
      list.push({
        x,
        y,
        vx: 0,
        vy: 0,
        phase: rand(0, Math.PI * 2),
        speedMul: rand(0.85, 1.2),
      });
    }
    return list;
  }

  function freshState() {
    return {
      phase: "title", // title | intro | play | win | lose
      introIndex: 0,
      introTimer: 0,
      player: {
        x: CONFIG.player.startX,
        y: CONFIG.player.startY,
        invuln: 0,
        flash: 0,
      },
      lives: 3,
      dew: 0,
      pickups: spawnPickups(CONFIG.pickup.count),
      enemies: spawnEnemies(CONFIG.enemy.count),
      particles: makeParticles(),
      gateOpen: false,
      time: 0,
      dialogueCooldown: 0,
    };
  }

  function setDialogue(text) {
    dialogueEl.textContent = text;
    state.dialogueCooldown = 2.5;
  }

  function updateHud() {
    hudDew.textContent =
      "Dew " + state.dew + " / " + CONFIG.pickup.neededToOpenGate;
    hudLives.textContent = "Light " + "●".repeat(state.lives) + "○".repeat(3 - state.lives);
  }

  function showOverlay(title, bodyLines, showPrompt) {
    overlayEl.classList.remove("hidden");
    overlayTitle.textContent = title;
    overlayBody.innerHTML = bodyLines
      .map((l) => "<p>" + l + "</p>")
      .join("");
    if (showPrompt) {
      overlayBody.innerHTML +=
        '<p class="prompt">Press Space / Enter to begin · R anytime to restart</p>';
    }
  }

  function hideOverlay() {
    overlayEl.classList.add("hidden");
  }

  function restart() {
    state = freshState();
    updateHud();
    setDialogue(STORY.tagline);
    showOverlay(STORY.title, STORY.intro, true);
  }

  function beginPlay() {
    if (state.phase === "title" || state.phase === "intro") {
      state.phase = "play";
      hideOverlay();
      setDialogue(STORY.intro[STORY.intro.length - 1]);
    }
  }

  // --- Update ---
  function updatePlayer(dt) {
    const p = state.player;
    let dx = 0;
    let dy = 0;
    if (keys.KeyA || keys.ArrowLeft) dx -= 1;
    if (keys.KeyD || keys.ArrowRight) dx += 1;
    if (keys.KeyW || keys.ArrowUp) dy -= 1;
    if (keys.KeyS || keys.ArrowDown) dy += 1;
    if (dx || dy) {
      const len = Math.hypot(dx, dy) || 1;
      p.x += (dx / len) * CONFIG.player.speed * dt;
      p.y += (dy / len) * CONFIG.player.speed * dt;
    }
    const m = CONFIG.world.margin;
    p.x = clamp(p.x, m, CONFIG.canvas.width - m);
    p.y = clamp(p.y, m, CONFIG.canvas.height - m);
    if (p.invuln > 0) p.invuln -= dt * 1000;
    if (p.flash > 0) p.flash -= dt * 1000;
  }

  function updateEnemies(dt) {
    const p = state.player;
    for (const e of state.enemies) {
      e.phase += dt * CONFIG.enemy.wobbleHz * Math.PI * 2;
      const dx = p.x - e.x;
      const dy = p.y - e.y;
      const d = Math.hypot(dx, dy) || 1;
      const speed = CONFIG.enemy.speed * e.speedMul * CONFIG.enemy.chaseAccel;
      e.vx = (dx / d) * speed;
      e.vy = (dy / d) * speed;
      const wx = Math.cos(e.phase) * CONFIG.enemy.wobbleAmp;
      const wy = Math.sin(e.phase * 0.7) * CONFIG.enemy.wobbleAmp * 0.6;
      e.x += (e.vx + wx * 0.35) * dt;
      e.y += (e.vy + wy * 0.35) * dt;
      const m = CONFIG.world.margin - 4;
      e.x = clamp(e.x, m, CONFIG.canvas.width - m);
      e.y = clamp(e.y, m, CONFIG.canvas.height - m);

      if (
        state.phase === "play" &&
        p.invuln <= 0 &&
        dist(e.x, e.y, p.x, p.y) < CONFIG.enemy.radius + CONFIG.player.radius - 2
      ) {
        hitPlayer();
      }
    }
  }

  function hitPlayer() {
    state.lives -= 1;
    state.player.invuln = CONFIG.player.invulnMs;
    state.player.flash = CONFIG.timing.hitFlashMs;
    updateHud();
    setDialogue(pick(STORY.hitLines));
    if (state.lives <= 0) {
      state.phase = "lose";
      showOverlay("Light Out", STORY.lose, false);
      setDialogue(STORY.lose[0]);
    }
  }

  function updatePickups(dt) {
    const p = state.player;
    for (const u of state.pickups) {
      if (u.taken) continue;
      u.phase += dt * CONFIG.pickup.bobHz * Math.PI * 2;
      if (dist(u.x, u.y, p.x, p.y) < CONFIG.pickup.radius + CONFIG.player.radius) {
        u.taken = true;
        state.dew += 1;
        updateHud();
        setDialogue(pick(STORY.pickupLines));
        if (
          !state.gateOpen &&
          state.dew >= CONFIG.pickup.neededToOpenGate
        ) {
          state.gateOpen = true;
          setDialogue(STORY.gateOpens);
        }
      }
    }
  }

  function updateGate() {
    if (!state.gateOpen || state.phase !== "play") return;
    const p = state.player;
    const g = CONFIG.gate;
    if (
      Math.abs(p.x - g.x) < g.width * 0.55 &&
      Math.abs(p.y - g.y) < g.height + CONFIG.player.radius
    ) {
      state.phase = "win";
      showOverlay("Moon Gate", STORY.win, false);
      setDialogue(STORY.win[0]);
    }
  }

  function updateParticles(dt) {
    for (const pt of state.particles) {
      pt.phase += dt;
      pt.y -= pt.speed * dt;
      pt.x += Math.sin(pt.phase * 1.3) * 6 * dt;
      if (pt.y < -4) {
        pt.y = CONFIG.canvas.height + 4;
        pt.x = rand(0, CONFIG.canvas.width);
      }
    }
  }

  function update(dt) {
    state.time += dt;
    if (state.dialogueCooldown > 0) state.dialogueCooldown -= dt;
    if (state.phase === "play") {
      updatePlayer(dt);
      updateEnemies(dt);
      updatePickups(dt);
      updateGate();
    } else if (state.phase === "title" || state.phase === "win" || state.phase === "lose") {
      // enemies still drift for ambience on overlays
      updateEnemies(dt * 0.35);
    }
    updateParticles(dt);
  }

  // --- Offscreen sprite cache -------------------------------------------------
  // Glows are baked once per quantized animation step instead of being blurred
  // live every frame. Steps are fine enough that the pulsing looks identical.
  const GLOW_STEPS = 16; // pulse levels for dewdrops / player / open gate
  const FLAP_STEPS = 16; // wing-flap levels for moths
  const FLAP_AMP = 0.35; // matches Math.sin(e.phase * 2) * 0.35

  // sprite half-extent = shape extent + max shadow blur + a little padding
  const PICKUP_SPRITE_SIZE = Math.ceil(CONFIG.pickup.radius + 22 + 6) * 2;
  const PLAYER_SPRITE_SIZE = Math.ceil(CONFIG.player.radius + 32 + 8) * 2;
  const ENEMY_SPRITE_SIZE = Math.ceil(21 + 14 + 8) * 2;
  const GATE_SPRITE_SIZE = 160;

  function makeSprite(size, drawFn) {
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const g = c.getContext("2d");
    g.translate(size / 2, size / 2);
    drawFn(g);
    return c;
  }

  function stepIndex(t, steps) {
    return clamp(Math.round(t * (steps - 1)), 0, steps - 1);
  }

  function stepValue(i, steps) {
    return steps > 1 ? i / (steps - 1) : 0;
  }

  function blit(sprite, x, y) {
    const h = sprite.width / 2;
    ctx.drawImage(sprite, x - h, y - h);
  }

  // Background: static radial gradient + meadow rings, baked once.
  let bgSprite = null;
  function getBackgroundSprite() {
    if (bgSprite) return bgSprite;
    const c = document.createElement("canvas");
    c.width = CONFIG.canvas.width;
    c.height = CONFIG.canvas.height;
    const g = c.getContext("2d");
    const grad = g.createRadialGradient(
      CONFIG.canvas.width * 0.5,
      CONFIG.canvas.height * 0.35,
      40,
      CONFIG.canvas.width * 0.5,
      CONFIG.canvas.height * 0.5,
      420
    );
    grad.addColorStop(0, CONFIG.colors.bgGlow);
    grad.addColorStop(1, CONFIG.colors.bg);
    g.fillStyle = grad;
    g.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);

    // soft meadow rings
    g.strokeStyle = "rgba(90,120,160,0.12)";
    g.lineWidth = 1;
    for (let i = 1; i <= 4; i++) {
      g.beginPath();
      g.ellipse(
        CONFIG.canvas.width / 2,
        CONFIG.canvas.height * 0.55,
        90 * i,
        48 * i,
        0,
        0,
        Math.PI * 2
      );
      g.stroke();
    }
    bgSprite = c;
    return bgSprite;
  }

  const pickupSprites = [];
  function getPickupSprite(i) {
    let s = pickupSprites[i];
    if (s) return s;
    const glow = 0.1 + 0.9 * stepValue(i, GLOW_STEPS); // glow ∈ [0.1, 1.0]
    s = makeSprite(PICKUP_SPRITE_SIZE, (g) => {
      g.shadowColor = CONFIG.colors.pickup;
      g.shadowBlur = 12 + glow * 10;
      g.fillStyle = CONFIG.colors.pickup;
      g.beginPath();
      g.arc(0, 0, CONFIG.pickup.radius, 0, Math.PI * 2);
      g.fill();
      g.shadowBlur = 0;
      g.fillStyle = CONFIG.colors.pickupCore;
      g.beginPath();
      g.arc(-2, -2, CONFIG.pickup.radius * 0.4, 0, Math.PI * 2);
      g.fill();
    });
    pickupSprites[i] = s;
    return s;
  }

  const playerSprites = [[], []]; // [normal, flash]
  function getPlayerSprite(i, flash) {
    const bucket = playerSprites[flash ? 1 : 0];
    let s = bucket[i];
    if (s) return s;
    const pulse = 0.4 + 0.6 * stepValue(i, GLOW_STEPS); // pulse ∈ [0.4, 1.0]
    s = makeSprite(PLAYER_SPRITE_SIZE, (g) => {
      g.shadowColor = CONFIG.colors.player;
      g.shadowBlur = 20 + pulse * 12;
      g.fillStyle = flash ? CONFIG.colors.danger : CONFIG.colors.player;
      g.beginPath();
      g.arc(0, 0, CONFIG.player.radius, 0, Math.PI * 2);
      g.fill();
      g.shadowBlur = 0;
      g.fillStyle = CONFIG.colors.playerCore;
      g.beginPath();
      g.arc(-2, -3, CONFIG.player.radius * 0.35, 0, Math.PI * 2);
      g.fill();
      // soft trail spark
      g.globalAlpha = 0.35;
      g.fillStyle = CONFIG.colors.player;
      g.beginPath();
      g.arc(0, 8, 3, 0, Math.PI * 2);
      g.fill();
      g.globalAlpha = 1;
    });
    bucket[i] = s;
    return s;
  }

  const enemySprites = [];
  function getEnemySprite(i) {
    let s = enemySprites[i];
    if (s) return s;
    const flap = -FLAP_AMP + 2 * FLAP_AMP * stepValue(i, FLAP_STEPS);
    s = makeSprite(ENEMY_SPRITE_SIZE, (g) => {
      g.shadowColor = CONFIG.colors.enemy;
      g.shadowBlur = 14;
      // wings
      g.fillStyle = "rgba(122,76,255,0.55)";
      g.beginPath();
      g.ellipse(-10, -2, 11, 6 + flap * 4, -0.5 + flap, 0, Math.PI * 2);
      g.ellipse(10, -2, 11, 6 + flap * 4, 0.5 - flap, 0, Math.PI * 2);
      g.fill();
      // body
      g.fillStyle = CONFIG.colors.enemy;
      g.beginPath();
      g.ellipse(0, 0, CONFIG.enemy.radius * 0.7, CONFIG.enemy.radius, 0, 0, Math.PI * 2);
      g.fill();
      g.shadowBlur = 0;
      g.fillStyle = CONFIG.colors.enemyEye;
      g.beginPath();
      g.arc(-3, -3, 2.2, 0, Math.PI * 2);
      g.arc(3, -3, 2.2, 0, Math.PI * 2);
      g.fill();
    });
    enemySprites[i] = s;
    return s;
  }

  const gateOpenSprites = [];
  let gateClosedSprite = null;
  function getGateSprite(open, i) {
    const g = CONFIG.gate;
    if (!open) {
      if (gateClosedSprite) return gateClosedSprite;
      gateClosedSprite = makeSprite(GATE_SPRITE_SIZE, (c) => {
        c.beginPath();
        c.moveTo(-g.width / 2, g.height);
        c.quadraticCurveTo(0, -g.height * 2.2, g.width / 2, g.height);
        c.strokeStyle = CONFIG.colors.gateClosed;
        c.lineWidth = 4;
        c.shadowBlur = 0;
        c.stroke();
        c.fillStyle = "rgba(40,48,70,0.55)";
        c.fillRect(-18, -6, 36, 10);
        c.fillStyle = CONFIG.colors.hud;
        c.font = "10px system-ui,sans-serif";
        c.textAlign = "center";
        c.fillText("LOCKED", 0, 2);
      });
      return gateClosedSprite;
    }
    let s = gateOpenSprites[i];
    if (s) return s;
    const pulse = stepValue(i, GLOW_STEPS);
    s = makeSprite(GATE_SPRITE_SIZE, (c) => {
      c.beginPath();
      c.moveTo(-g.width / 2, g.height);
      c.quadraticCurveTo(0, -g.height * 2.2, g.width / 2, g.height);
      c.strokeStyle = CONFIG.colors.gateOpen;
      c.lineWidth = 4;
      c.shadowColor = CONFIG.colors.gateOpen;
      c.shadowBlur = 18 + pulse * 10;
      c.stroke();
      c.shadowBlur = 0;
      const lg = c.createLinearGradient(0, -g.height * 1.5, 0, g.height);
      lg.addColorStop(0, "rgba(154,212,255," + (0.15 + pulse * 0.2) + ")");
      lg.addColorStop(1, "rgba(154,212,255,0)");
      c.fillStyle = lg;
      c.beginPath();
      c.moveTo(-g.width / 2 + 6, g.height);
      c.quadraticCurveTo(0, -g.height * 2, g.width / 2 - 6, g.height);
      c.closePath();
      c.fill();
    });
    gateOpenSprites[i] = s;
    return s;
  }

  // Build every cached frame up front so no hitch happens mid-run.
  function warmCaches() {
    getBackgroundSprite();
    getGateSprite(false, 0);
    for (let i = 0; i < GLOW_STEPS; i++) {
      getPickupSprite(i);
      getPlayerSprite(i, false);
      getPlayerSprite(i, true);
      getGateSprite(true, i);
    }
    for (let i = 0; i < FLAP_STEPS; i++) getEnemySprite(i);
  }

  // --- Draw ---
  function drawBackground() {
    ctx.drawImage(getBackgroundSprite(), 0, 0);

    ctx.fillStyle = "#b8d0ff";
    for (const pt of state.particles) {
      ctx.globalAlpha = pt.alpha;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawGate() {
    const g = CONFIG.gate;
    if (state.gateOpen) {
      const pulse = 0.5 + 0.5 * Math.sin(state.time * 3);
      blit(getGateSprite(true, stepIndex(pulse, GLOW_STEPS)), g.x, g.y);
    } else {
      blit(getGateSprite(false, 0), g.x, g.y);
    }
  }

  function drawPickups() {
    const glowRatio = CONFIG.pickup.glowPulseHz / CONFIG.pickup.bobHz;
    for (const u of state.pickups) {
      if (u.taken) continue;
      const bob = Math.sin(u.phase) * CONFIG.pickup.bobAmp;
      const glow = 0.55 + 0.45 * Math.sin(u.phase * glowRatio);
      blit(
        getPickupSprite(stepIndex((glow - 0.1) / 0.9, GLOW_STEPS)),
        u.x,
        u.y + bob
      );
    }
  }

  function drawEnemies() {
    for (const e of state.enemies) {
      const flap = Math.sin(e.phase * 2) * FLAP_AMP;
      blit(
        getEnemySprite(stepIndex((flap + FLAP_AMP) / (2 * FLAP_AMP), FLAP_STEPS)),
        e.x,
        e.y
      );
    }
  }

  function drawPlayer() {
    const p = state.player;
    const blink = p.invuln > 0 && Math.floor(state.time * 16) % 2 === 0;
    if (blink) return;
    const pulse = 0.7 + 0.3 * Math.sin(state.time * 5);
    blit(
      getPlayerSprite(stepIndex((pulse - 0.4) / 0.6, GLOW_STEPS), p.flash > 0),
      p.x,
      p.y
    );
  }

  function draw() {
    drawBackground();
    drawGate();
    drawPickups();
    drawEnemies();
    drawPlayer();
  }

  // --- Loop ---
  function frame(ts) {
    if (!lastTs) lastTs = ts;
    let dt = (ts - lastTs) / 1000;
    lastTs = ts;
    // clamp huge pauses (tab switch)
    if (dt > 0.05) dt = 0.05;
    update(dt);
    draw();
    rafId = requestAnimationFrame(frame);
  }

  // boot
  state = freshState();
  warmCaches();
  updateHud();
  setDialogue(STORY.tagline);
  showOverlay(STORY.title, STORY.intro, true);
  rafId = requestAnimationFrame(frame);

  // expose tiny debug hook for smoke tests
  window.__LUMEN_VEIL__ = {
    getPhase: () => state.phase,
    restart,
    beginPlay,
  };
})();
```
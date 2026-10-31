/**
 * Lumen Veil — main game loop, entities, rendering, input.
 */
(function () {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const dialogueEl = document.getElementById("dialogue");
  const hudDew = document.getElementById("hud-dew");
  const hudLives = document.getElementById("hud-lives");
  const overlayEl = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlay-title");
  const overlayBody = document.getElementById("overlay-body");

  canvas.width = CONFIG.canvas.width;
  canvas.height = CONFIG.canvas.height;

  // --- Cached rendering assets ---
  // Per-frame shadowBlur and gradient creation are the main cause of
  // choppy play on phones. Bake the static background and the glowing
  // sprites once, up front, then blit them with drawImage each frame.
  // Every visible element (glows included) is still drawn, unchanged.
  function makeCanvas(w, h) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  }

  const backgroundCanvas = (function () {
    const c = makeCanvas(CONFIG.canvas.width, CONFIG.canvas.height);
    const b = c.getContext("2d");
    const g = b.createRadialGradient(
      CONFIG.canvas.width * 0.5,
      CONFIG.canvas.height * 0.35,
      40,
      CONFIG.canvas.width * 0.5,
      CONFIG.canvas.height * 0.5,
      420
    );
    g.addColorStop(0, CONFIG.colors.bgGlow);
    g.addColorStop(1, CONFIG.colors.bg);
    b.fillStyle = g;
    b.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);
    b.strokeStyle = "rgba(90,120,160,0.12)";
    b.lineWidth = 1;
    for (let i = 1; i <= 4; i++) {
      b.beginPath();
      b.ellipse(
        CONFIG.canvas.width / 2,
        CONFIG.canvas.height * 0.55,
        90 * i,
        48 * i,
        0,
        0,
        Math.PI * 2
      );
      b.stroke();
    }
    return c;
  })();

  // Gate interior fill, created once (its pulse is applied via alpha).
  const gateFillGradient = (function () {
    const lg = ctx.createLinearGradient(0, -CONFIG.gate.height * 1.5, 0, CONFIG.gate.height);
    lg.addColorStop(0, "rgba(154,212,255,0.35)");
    lg.addColorStop(1, "rgba(154,212,255,0)");
    return lg;
  })();

  const pickupSprite = (function () {
    const s = 72;
    const c = makeCanvas(s, s);
    const b = c.getContext("2d");
    b.translate(s / 2, s / 2);
    b.shadowColor = CONFIG.colors.pickup;
    b.shadowBlur = 22;
    b.fillStyle = CONFIG.colors.pickup;
    b.beginPath();
    b.arc(0, 0, CONFIG.pickup.radius, 0, Math.PI * 2);
    b.fill();
    b.shadowBlur = 0;
    b.fillStyle = CONFIG.colors.pickupCore;
    b.beginPath();
    b.arc(-2, -2, CONFIG.pickup.radius * 0.4, 0, Math.PI * 2);
    b.fill();
    return c;
  })();

  const enemyBodySprite = (function () {
    const w = 56;
    const h = 64;
    const c = makeCanvas(w, h);
    const b = c.getContext("2d");
    b.translate(w / 2, h / 2);
    b.shadowColor = CONFIG.colors.enemy;
    b.shadowBlur = 14;
    b.fillStyle = CONFIG.colors.enemy;
    b.beginPath();
    b.ellipse(0, 0, CONFIG.enemy.radius * 0.7, CONFIG.enemy.radius, 0, 0, Math.PI * 2);
    b.fill();
    return c;
  })();

  function makePlayerSprite(bodyColor) {
    const s = 96;
    const c = makeCanvas(s, s);
    const b = c.getContext("2d");
    b.translate(s / 2, s / 2);
    b.shadowColor = CONFIG.colors.player;
    b.shadowBlur = 32;
    b.fillStyle = bodyColor;
    b.beginPath();
    b.arc(0, 0, CONFIG.player.radius, 0, Math.PI * 2);
    b.fill();
    b.shadowBlur = 0;
    b.fillStyle = CONFIG.colors.playerCore;
    b.beginPath();
    b.arc(-2, -3, CONFIG.player.radius * 0.35, 0, Math.PI * 2);
    b.fill();
    b.globalAlpha = 0.35;
    b.fillStyle = CONFIG.colors.player;
    b.beginPath();
    b.arc(0, 8, 3, 0, Math.PI * 2);
    b.fill();
    return c;
  }
  const playerSprite = makePlayerSprite(CONFIG.colors.player);
  const playerFlashSprite = makePlayerSprite(CONFIG.colors.danger);

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

  // --- Draw ---
  function drawBackground() {
    ctx.drawImage(backgroundCanvas, 0, 0);

    for (const pt of state.particles) {
      ctx.globalAlpha = pt.alpha;
      ctx.fillStyle = "#b8d0ff";
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawGate() {
    const g = CONFIG.gate;
    const open = state.gateOpen;
    const pulse = 0.5 + 0.5 * Math.sin(state.time * 3);
    ctx.save();
    ctx.translate(g.x, g.y);
    if (open) {
      // wide, faint stroke stands in for the old shadowBlur glow
      ctx.beginPath();
      ctx.moveTo(-g.width / 2, g.height);
      ctx.quadraticCurveTo(0, -g.height * 2.2, g.width / 2, g.height);
      ctx.strokeStyle = "rgba(154,212,255," + (0.12 + pulse * 0.1) + ")";
      ctx.lineWidth = 12 + pulse * 6;
      ctx.stroke();
    }
    // arch
    ctx.beginPath();
    ctx.moveTo(-g.width / 2, g.height);
    ctx.quadraticCurveTo(0, -g.height * 2.2, g.width / 2, g.height);
    ctx.strokeStyle = open ? CONFIG.colors.gateOpen : CONFIG.colors.gateClosed;
    ctx.lineWidth = 4;
    ctx.stroke();
    if (open) {
      ctx.globalAlpha = (0.15 + pulse * 0.2) / 0.35;
      ctx.fillStyle = gateFillGradient;
      ctx.beginPath();
      ctx.moveTo(-g.width / 2 + 6, g.height);
      ctx.quadraticCurveTo(0, -g.height * 2, g.width / 2 - 6, g.height);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = "rgba(40,48,70,0.55)";
      ctx.fillRect(-18, -6, 36, 10);
      ctx.fillStyle = CONFIG.colors.hud;
      ctx.font = "10px system-ui,sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("LOCKED", 0, 2);
    }
    ctx.restore();
  }

  function drawPickups() {
    for (const u of state.pickups) {
      if (u.taken) continue;
      const bob = Math.sin(u.phase) * CONFIG.pickup.bobAmp;
      const glow = 0.55 + 0.45 * Math.sin(u.phase * (CONFIG.pickup.glowPulseHz / CONFIG.pickup.bobHz));
      const s = 0.92 + glow * 0.16;
      const size = pickupSprite.width * s;
      ctx.drawImage(pickupSprite, u.x - size / 2, u.y + bob - size / 2, size, size);
    }
  }

  function drawEnemies() {
    for (const e of state.enemies) {
      ctx.save();
      ctx.translate(e.x, e.y);
      const flap = Math.sin(e.phase * 2) * 0.35;
      // wings
      ctx.fillStyle = "rgba(122,76,255,0.55)";
      ctx.beginPath();
      ctx.ellipse(-10, -2, 11, 6 + flap * 4, -0.5 + flap, 0, Math.PI * 2);
      ctx.ellipse(10, -2, 11, 6 + flap * 4, 0.5 - flap, 0, Math.PI * 2);
      ctx.fill();
      // body (glow baked into the sprite)
      ctx.drawImage(
        enemyBodySprite,
        -enemyBodySprite.width / 2,
        -enemyBodySprite.height / 2,
        enemyBodySprite.width,
        enemyBodySprite.height
      );
      ctx.fillStyle = CONFIG.colors.enemyEye;
      ctx.beginPath();
      ctx.arc(-3, -3, 2.2, 0, Math.PI * 2);
      ctx.arc(3, -3, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawPlayer() {
    const p = state.player;
    const blink = p.invuln > 0 && Math.floor(state.time * 16) % 2 === 0;
    if (blink) return;
    const pulse = 0.7 + 0.3 * Math.sin(state.time * 5);
    const sprite = p.flash > 0 ? playerFlashSprite : playerSprite;
    const size = sprite.width * (0.94 + pulse * 0.12);
    ctx.drawImage(sprite, p.x - size / 2, p.y - size / 2, size, size);
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

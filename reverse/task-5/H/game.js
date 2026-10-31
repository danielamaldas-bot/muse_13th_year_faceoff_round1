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

  // --- Static background cache (gradient + meadow rings) ---
  const bgCanvas = document.createElement("canvas");
  bgCanvas.width = CONFIG.canvas.width;
  bgCanvas.height = CONFIG.canvas.height;
  const bgCtx = bgCanvas.getContext("2d");
  (function drawStaticBackground() {
    const g = bgCtx.createRadialGradient(
      CONFIG.canvas.width * 0.5,
      CONFIG.canvas.height * 0.35,
      40,
      CONFIG.canvas.width * 0.5,
      CONFIG.canvas.height * 0.5,
      420
    );
    g.addColorStop(0, CONFIG.colors.bgGlow);
    g.addColorStop(1, CONFIG.colors.bg);
    bgCtx.fillStyle = g;
    bgCtx.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);

    bgCtx.strokeStyle = "rgba(90,120,160,0.12)";
    bgCtx.lineWidth = 1;
    for (let i = 1; i <= 4; i++) {
      bgCtx.beginPath();
      bgCtx.ellipse(
        CONFIG.canvas.width / 2,
        CONFIG.canvas.height * 0.55,
        90 * i,
        48 * i,
        0,
        0,
        Math.PI * 2
      );
      bgCtx.stroke();
    }
  })();

  // --- Static closed gate cache ---
  const gateClosedCanvas = document.createElement("canvas");
  const gateW = CONFIG.gate.width;
  const gateH = CONFIG.gate.height;
  gateClosedCanvas.width = gateW + 40;
  gateClosedCanvas.height = gateH * 4 + 40;
  const gateClosedCtx = gateClosedCanvas.getContext("2d");
  (function drawStaticGateClosed() {
    const cx = gateClosedCanvas.width / 2;
    const cy = gateClosedCanvas.height / 2;
    gateClosedCtx.translate(cx, cy);
    // arch
    gateClosedCtx.beginPath();
    gateClosedCtx.moveTo(-gateW / 2, gateH);
    gateClosedCtx.quadraticCurveTo(0, -gateH * 2.2, gateW / 2, gateH);
    gateClosedCtx.strokeStyle = CONFIG.colors.gateClosed;
    gateClosedCtx.lineWidth = 4;
    gateClosedCtx.shadowColor = "transparent";
    gateClosedCtx.shadowBlur = 0;
    gateClosedCtx.stroke();
    // lock plate
    gateClosedCtx.fillStyle = "rgba(40,48,70,0.55)";
    gateClosedCtx.fillRect(-18, -6, 36, 10);
    gateClosedCtx.fillStyle = CONFIG.colors.hud;
    gateClosedCtx.font = "10px system-ui,sans-serif";
    gateClosedCtx.textAlign = "center";
    gateClosedCtx.fillText("LOCKED", 0, 2);
  })();

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
    // Draw cached static background (gradient + rings)
    ctx.drawImage(bgCanvas, 0, 0);

    // Particles (dynamic)
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
    if (!open) {
      // Draw cached closed gate
      ctx.drawImage(
        gateClosedCanvas,
        g.x - gateClosedCanvas.width / 2,
        g.y - gateClosedCanvas.height / 2
      );
      return;
    }
    // Open gate (animated) — unchanged
    const pulse = 0.5 + 0.5 * Math.sin(state.time * 3);
    ctx.save();
    ctx.translate(g.x, g.y);
    // arch
    ctx.beginPath();
    ctx.moveTo(-g.width / 2, g.height);
    ctx.quadraticCurveTo(0, -g.height * 2.2, g.width / 2, g.height);
    ctx.strokeStyle = CONFIG.colors.gateOpen;
    ctx.lineWidth = 4;
    ctx.shadowColor = CONFIG.colors.gateOpen;
    ctx.shadowBlur = 18 + pulse * 10;
    ctx.stroke();
    // inner glow
    const lg = ctx.createLinearGradient(0, -g.height * 1.5, 0, g.height);
    lg.addColorStop(0, "rgba(154,212,255," + (0.15 + pulse * 0.2) + ")");
    lg.addColorStop(1, "rgba(154,212,255,0)");
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.moveTo(-g.width / 2 + 6, g.height);
    ctx.quadraticCurveTo(0, -g.height * 2, g.width / 2 - 6, g.height);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawPickups() {
    for (const u of state.pickups) {
      if (u.taken) continue;
      const bob = Math.sin(u.phase) * CONFIG.pickup.bobAmp;
      const glow = 0.55 + 0.45 * Math.sin(u.phase * (CONFIG.pickup.glowPulseHz / CONFIG.pickup.bobHz));
      ctx.save();
      ctx.translate(u.x, u.y + bob);
      ctx.shadowColor = CONFIG.colors.pickup;
      ctx.shadowBlur = 12 + glow * 10;
      ctx.fillStyle = CONFIG.colors.pickup;
      ctx.beginPath();
      ctx.arc(0, 0, CONFIG.pickup.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = CONFIG.colors.pickupCore;
      ctx.beginPath();
      ctx.arc(-2, -2, CONFIG.pickup.radius * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawEnemies() {
    for (const e of state.enemies) {
      ctx.save();
      ctx.translate(e.x, e.y);
      const flap = Math.sin(e.phase * 2) * 0.35;
      ctx.shadowColor = CONFIG.colors.enemy;
      ctx.shadowBlur = 14;
      // wings
      ctx.fillStyle = "rgba(122,76,255,0.55)";
      ctx.beginPath();
      ctx.ellipse(-10, -2, 11, 6 + flap * 4, -0.5 + flap, 0, Math.PI * 2);
      ctx.ellipse(10, -2, 11, 6 + flap * 4, 0.5 - flap, 0, Math.PI * 2);
      ctx.fill();
      // body
      ctx.fillStyle = CONFIG.colors.enemy;
      ctx.beginPath();
      ctx.ellipse(0, 0, CONFIG.enemy.radius * 0.7, CONFIG.enemy.radius, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
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
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.shadowColor = CONFIG.colors.player;
    ctx.shadowBlur = 20 + pulse * 12;
    ctx.fillStyle =
      p.flash > 0 ? CONFIG.colors.danger : CONFIG.colors.player;
    ctx.beginPath();
    ctx.arc(0, 0, CONFIG.player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = CONFIG.colors.playerCore;
    ctx.beginPath();
    ctx.arc(-2, -3, CONFIG.player.radius * 0.35, 0, Math.PI * 2);
    ctx.fill();
    // soft trail spark
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = CONFIG.colors.player;
    ctx.beginPath();
    ctx.arc(0, 8, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
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
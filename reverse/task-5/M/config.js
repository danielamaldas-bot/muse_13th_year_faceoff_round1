/**
 * Lumen Veil — tunable game constants.
 * Keep gameplay numbers here so later edits stay localized.
 */
const CONFIG = {
  canvas: {
    width: 800,
    height: 520,
  },

  player: {
    radius: 12,
    speed: 210,
    invulnMs: 900,
    startX: 400,
    startY: 420,
  },

  enemy: {
    radius: 14,
    speed: 95,
    count: 4,
    chaseAccel: 1.15,
    wobbleAmp: 28,
    wobbleHz: 1.6,
  },

  pickup: {
    radius: 8,
    count: 8,
    neededToOpenGate: 6,
    bobAmp: 4,
    bobHz: 2.2,
    glowPulseHz: 1.8,
  },

  gate: {
    width: 56,
    height: 18,
    x: 400,
    y: 48,
  },

  world: {
    particleCount: 36,
    particleCountMobile: 18, // Reduced particle count for mobile
  },

  timing: {
    targetFps: 60,
    hitFlashMs: 180,
    winPauseMs: 400,
  },

  colors: {
    bg: "#0b1020",
    bgGlow: "#152038",
    player: "#ffe9a8",
    playerCore: "#fff7d6",
    enemy: "#7a4cff",
    enemyEye: "#ff6bcb",
    pickup: "#5cffc8",
    pickupCore: "#d8fff2",
    gateClosed: "#3a4560",
    gateOpen: "#9ad4ff",
    hud: "#c9d4ef",
    danger: "#ff6b8a",
  },
};

// Detect mobile device to adjust performance settings
CONFIG.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
if (CONFIG.isMobile) {
  CONFIG.world.particleCount = CONFIG.world.particleCountMobile;
}

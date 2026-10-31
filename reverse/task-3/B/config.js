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

  elderMoth: {
    radius: 22,
    speed: 48,
    y: 82,
    patrolHalfWidth: 120,
    flapHz: 2.2,
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
    margin: 28,
    particleCount: 36,
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
    elderMoth: "#3a1f5e",
    elderMothEye: "#ffd966",
    pickup: "#5cffc8",
    pickupCore: "#d8fff2",
    gateClosed: "#3a4560",
    gateOpen: "#9ad4ff",
    hud: "#c9d4ef",
    danger: "#ff6b8a",
  },
};

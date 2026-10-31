// =====================================================================
//  THE THIRTEENTH YEAR - TUNING
//  Every number here can be changed on github.com: open this file, click
//  the pencil icon, change a number, then "Commit changes". The site
//  updates about a minute later. Keep the commas and brackets as they are.
//  Speeds are in pixels per second (the screen is 320 pixels wide and one
//  floor tile is 16 pixels). Times are in seconds.
// =====================================================================
'use strict';
const TUNING = {
  // ---------- Vel: moving ----------
  run: 104,          // walking/running speed
  devaRun: 128,      // running speed while in Deva (golden) form
  accG: 2400,        // how fast Vel speeds up / stops on the ground (higher = snappier)
  accA: 1500,        // how much Vel can steer while in the air
  grav: 980,         // gravity (higher = falls faster, shorter jumps)
  maxFall: 420,      // fastest falling speed

  // ---------- Vel: jumping ----------
  jump: 318,         // first jump strength (higher = jumps higher)
  djump: 280,        // second (double) jump strength - the spin jump
  coyote: 0.10,      // grace time to still jump just after running off a ledge
  buffer: 0.12,      // a jump pressed this early before landing still counts
  actBuf: 0.15,      // same idea for sword and bow presses

  // ---------- Weapons ----------
  arrowSpd: 270,     // arrow speed
  shootCD: 0.26,     // wait between arrows
  devaShootCD: 0.15, // wait between arrows in Deva form
  strikeCD: 0.30,    // wait between sword swings
  dmg:   { staff: 1, sword: 2, great: 3 },   // damage per hit (great = Deva sword)
  reach: { staff: 28, sword: 36, great: 46 }, // how far each swing reaches
  quiver0: 12,       // arrows at the start of each life
  quiverMax: 24,     // most arrows Vel can carry
  pack: 6,           // arrows in one quiver pickup

  // ---------- Vel: health ----------
  hearts: 5,         // hearts (hit points) per life
  lives: 3,          // lives (REST) at the start
  inv: 1.3,          // invincible time after being hit
  heartsLostPerHit: 1, // hearts lost when an enemy, rock or venom hits Vel

  // ---------- Power-up ----------
  deva: 30,          // how long Deva (golden) form lasts

  // ---------- Enemies ----------
  enemies: {
    boar:   { hp: 3, walkSpeed: 28, chargeSpeed: 150 }, // tusked boar (Yaksha in the art)
    bird:   { hp: 1, diveSpeed: 160 },                  // diving bird
    cobra:  { hp: 2, spitSpeed: 130 },                  // spitting cobra
    imp:    { hp: 1, hopSpeed: 70 },                    // hopping imp
    vetala: { hp: 2, walkSpeed: 34 },                   // hanging ghoul that drops down
  },

  // ---------- Boss ----------
  bossHP: 26,        // Vaka's health

  // ---------- Sound ----------
  musicVolume: 0.2,  // music loudness, 0 (silent) to 1 (full). Was 0.55; lowered so SFX read clearly.
  sfxVolume: 1.0,    // sound-effect loudness, 0 to 1. Was 0.5.
  // ---------- Animation ----------
  anim: {
    apexVy: 120,     // jump: vertical speed below this shows the "apex" pose
    bossRig: true,   // true = Vaka moves limb by limb; false = old still picture
    bossWalk: 22,    // Vaka's slow stalking speed between attacks (pixels/sec)
  },
  // ---------- Dog ----------
  dog: {
    barkGap: 3,          // min seconds between barks when an enemy is near
    idleBarkRate: 0.08,  // chance per second of a random bark with no enemy near
    attackRange: 95,     // how close (pixels) an enemy must be before the dog leaps
    attackRate: 2.5,     // chance per second to leap when in range and ready
    attackCooldown: 3,   // min seconds between leaps
  },
};
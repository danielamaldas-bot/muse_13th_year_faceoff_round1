/**
 * Lumen Veil — story / dialogue text.
 * Separate from gameplay logic so narrative tweaks are easy.
 */
const STORY = {
  title: "Lumen Veil",
  tagline: "Carry the dew. Open the moon gate. Escape the moths.",

  intro: [
    "Grove Keeper: Little Ember… the veil grows thin tonight.",
    "Grove Keeper: Six dewdrops will wake the Moon Gate.",
    "Grove Keeper: One golden drop waits at the meadow's heart — it mends your light.",
    "Grove Keeper: Mind the Shadow Moths — they drink light.",
  ],

  pickupLines: [
    "A droplet sings as it joins your glow.",
    "The meadow brightens, just a little.",
    "Another spark for the veil.",
    "The Gate hums faintly…",
    "Almost enough… keep moving.",
  ],

  goldenPickup: "The golden dewdrop mends your flame — one Light returns!",
  goldenPickupFull:
    "The golden dewdrop joins your glow; your light was already whole.",

  gateOpens: "Grove Keeper: The Gate opens! Swim to the light!",

  hitLines: [
    "Your flame flickers…",
    "A moth snatches a scrap of light!",
    "Hold steady, Ember!",
  ],

  win: [
    "You slip through the Moon Gate.",
    "Grove Keeper: Well done. The meadow sleeps again… for now.",
    "Victory — press R to return.",
  ],

  lose: [
    "Your light goes out among the moths.",
    "Grove Keeper: Rest… then try again.",
    "Defeat — press R to restart.",
  ],

  hudHints: {
    move: "WASD / Arrow keys to move",
    goal: "Collect dewdrops, then reach the Moon Gate",
    restart: "R to restart",
  },
};

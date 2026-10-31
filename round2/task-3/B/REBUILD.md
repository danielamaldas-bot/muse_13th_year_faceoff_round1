# The Thirteenth Year: Rebuild Specification (Stage 1)

This document lets another AI builder (for example Muse) or a developer rebuild **The Thirteenth Year, Stage 1** from scratch and match the current game closely. Everything here was read from the code in `thepodemail-lgtm/thirteenth-year` (commit `5ca53ca` and earlier) and from the music repo `thepodemail-lgtm/thirteenth-year-music`. Where the code and the docs disagree, the code wins, and the disagreement is noted.

- **Play:** https://thepodemail-lgtm.github.io/thirteenth-year/
- **Code:** https://github.com/thepodemail-lgtm/thirteenth-year
- **Music:** https://github.com/thepodemail-lgtm/thirteenth-year-music

---

## 1. Vision and locked design rules

The game is an NES-style 2D action platformer: a side-scroller with a sword, a bow, a double-jump spin attack, a dog companion and a boss. The rules below come from `SAVING-TOKENS.md` §8 ("Locked game rules"), the README and comments in the code. Treat them as fixed.

| Rule | Source |
|---|---|
| NES / Famicom look: 320×180 internal canvas, 16 px tiles, 4-colour shaded ramps, Bayer dithering, dark `#0d0710` outlines | engine.js, sprites.js |
| Reference: **Matendoji** (Famicom), preferred over the US *Crystal Palace* release | SAVING-TOKENS §8 |
| Art quality and detail target: **Batman: Return of the Joker** (NES) | SAVING-TOKENS §8 |
| Inspiration: **Strider**, **Rocket Knight Adventures**, **Ogre Battle** | SAVING-TOKENS §8 |
| Character style: cartoony and loose, "SFA-inspired" (Street Fighter Alpha), with squash and stretch | engine.js comment `/* v3: cartoon (SFA-inspired) sprites + squash/stretch */` |
| **No scanlines.** Backgrounds are light and recede, and sprites pop. Background images are pre-hazed (lightened and desaturated). A 10% light wash (`rgba(220,230,210,0.10)`) goes over the parallax. | SAVING-TOKENS §8, art.js comment, drawWorld0 |
| **Never rip NES art or music.** All art is procedural or Daniel's own, and the music is original. | SAVING-TOKENS §8 |
| Story first: narrator toasts at checkpoints, an opening line, and an ending card with a moral ("LESSON: PATIENCE") | engine.js, ui.js |
| Fairness: "Every death should feel like your own fault." Telegraphed attacks (red `!` before a boar charge or Vaka charge), falls cost one heart and never a life, checkpoints, short invincibility | SAVING-TOKENS §3, player.js |
| Enemies come from Indian mythology (Yaksha, Vetala, Rakshasa, cobra, imps) | SAVING-TOKENS §8, code |
| Vel uses a **sword, never a staff**. The beam fires only at full health. The second jump is a spinning sword attack. | SAVING-TOKENS §8, player.js |
| Deva mode switches the music, like Mario's star | SAVING-TOKENS §8, engine.js `music(want)` |
| $0 budget. Free tools first, and flag any cost before spending. | SAVING-TOKENS §8 |

> "Mad City fairness" (from the brief) appears nowhere in the repo by that name. The fairness rule above is the repo's own wording.

## 2. Story and characters

- **Setting:** *Year One: The Temple Road.* A prince is exiled for twelve years of forest (Mahabharata-flavoured; Arjuna is named in the game-over text). Title: "THE THIRTEENTH YEAR", subtitle "YEAR ONE - THE TEMPLE ROAD".
- **Vel (Kathirvelan):** the exiled prince and hero. He has a bow, a sword and a loyal dog. Red scarf (gold in Deva form), brown skin, black hair.
- **Sanjaya:** the narrator. His lines appear as toasts at checkpoints and on the end cards.
- **The Dog:** grey/white companion. Follows Vel, barks when enemies are near (and sometimes at nothing), and occasionally leaps to bite an enemy for 1 damage.
- **Vaka:** "armored rakshasa of the temple", the Stage 1 boss.
- **Open decision (Daniel's):** a Hunter/Shiva duel or Vaka as the Stage 1 boss. The code currently ships **Vaka**.

Exact story text, which must be reproduced verbatim:

- Start toast: `Year One. Exiled, Vel sets out on the temple road with a bow, a sword and a loyal dog.` (3.6 s)
- Checkpoint col 96: `Sanjaya: "The road is long. He walks it anyway."`
- Checkpoint col 200: `Sanjaya: "Among the ruins, the old gods still keep their lamps."`
- Checkpoint col 330: `Sanjaya: "Twelve years of forest. This is only the first."`
- Checkpoint col 396 (any other): `Sanjaya: "The deep forest is listening. Something waits."` (all 3.6 s)
- Boss intro: `Vaka, armored rakshasa of the temple, blocks the way!` (3.2 s)
- Boss half health: `A Deva orb falls from the canopy!` (2.5 s)
- Respawn during the boss: `Vel rises again. Patience.`
- Pit fall: `A fall costs a heart - never a life.`
- Out of arrows: `Quiver empty - Vel draws his sword.`
- Orb pickup: `Deva light! Great sword and endless arrows for 30 seconds.`; when it ends: `The Deva light fades.`
- Quiver pickup: `+6 arrows`
- Win card: `YEAR ONE COMPLETE` / `Vaka falls, and the temple road breathes again.` / blank / `Sanjaya: "A prince with nothing still` / `protects others. Patience is not waiting -` / `it is staying true while the years pass."` / blank / `LESSON: PATIENCE` (gold) / `SCORE n`
- Lose card: `THE FOREST IS PATIENT` / `Sanjaya: "Even Arjuna earned his weapons` / `through patience. Rise, and walk again."` / blank / `LESSON: PATIENCE` / `SCORE n`

## 3. File architecture and load order

Vanilla JS, one global scope, `'use strict'`, no modules, no build step. **Load order matters**, because later files monkey-patch earlier functions.

```
index.html          page shell, CSS, toolbar, settings menu, touch pads, fullscreen, MP3 music hook
js/tuning.js        const TUNING = {...}  (every tweakable number)
js/engine.js        canvas, helpers, state, physics, update0/update, drawWorld0/drawWorld, render, loop
js/audio.js         WebAudio chiptune sequencer, SFX synth, remote MP3 (REM) with chiptune fallback
js/sprites.js       Spr pixel builder, palette P, all procedural sprites, sprite cache SC
js/input.js         keyboard map, K (held), KP (pressed this frame), BUF (action buffer), press()
js/stage1.js        map (424×12), checkpoints, entity list, procedural backgrounds/tiles (bakeBG), patchInit
js/player.js        startLife, strike, beam, spin, hurt, pit fall, death, pickups, dog AI
js/enemies.js       spawn, edge test, hurtFoe
js/boss.js          Vaka: startBoss, updBoss, hurtBoss
js/ui.js            outlined text renderer, title, HUD, toasts, win/lose cards, setOpt
js/art.js           loads assets/art/*.png + frames.json, swaps procedural art per asset (fallback kept)
js/anim.js          tweened frames, Vaka 12-part skeletal rig, dog frames, SFX remix (animInit)
js/main.js          bootGame(hooks) → builds everything and returns the control API
assets/art/         vel.png dog.png boar.png hawk.png vaka.png vaka_parts.png title.png far.png ruins.png arena.png tiles.png frames.json
assets/art/src/     original JPGs: vel_strip, dog_strip, boar_hawk, boss_hall, jungle_far, keyart, ruins
assets/art/tools/   build.py, sprites.py, bg.py, anim.py (Python + Pillow/numpy/OpenCV)
README.md, SAVING-TOKENS.md
```

Boot (`bootGame(h)` in main.js): `Object.assign(hooks,h)` → `buildMap()` → `patchInit()` → `bakeBG()` → `initImgs()` → `bakeTitle()` → start `requestAnimationFrame(frame)` → `hooks.onMute(S.mute)` → `loadArt()` (async; it rebakes BG and the title when the images arrive) → `animInit()`. It returns `{press, pressStart, setOpt, pauseSet, opts, togglePause, toggleMute, restart, stop}`. index.html stores this as `window.__game`.

The monkey-patch chain: art.js wraps `getHero, heroSprite0, dogSprite, boarSprite, birdSprite, vakaSprite, bakeBG, bakeTitle` and keeps the originals as `_name` for fallback. anim.js then re-wraps `velKey, getHero, dogSprite, boarSprite, birdSprite`, adds `dogFrame` and `vakaRig`, and replaces the SFX `sword, beam, spin, thunk, athit`. stage1.js `patchInit` adds SFX `spin, beam, bite` (later overridden by anim.js for spin and beam) and `IMG.sword`.

## 4. Game loop, states, resolution and scaling

- **Internal resolution:** `VW=320, VH=180` (16:9). `T=16` px tiles, `ROWS=12` (level height `LH=192`). The world is drawn with a vertical offset of `CAMY-12` = −26 px. A 32 px HUD strip covers the bottom (`y0=VH-32`).
- The canvas uses `image-rendering:pixelated` and `ctx.imageSmoothingEnabled=false`, and CSS scales it to the layout size (§13).
- **Loop:** `frame(now)`: `dt=min(0.05,(now-last)/1000)`. If the state isn't `pause`, run `update(dt)`. Then `render()`, then rAF again.
- **States:** `title`, `play`, `pause`, `win`, `over`.
  - `title` → `pressStart()` → `start()`: audio init/resume, `sfx('sel')`, `newGame()`, state `play`, `music('stage',0.8)`, start toast.
  - `win`/`over` → `pressStart()` after `tt>1.2` → `title` (music stops).
  - `pause(on)` works only from play/pause. It suspends or resumes the AudioContext and the MP3 and calls `hooks.onPause`. Unpausing plays `blip`.
  - Auto-pause: on `visibilitychange`, if the document is hidden and the state is play, pause.
- **newGame:** `G={score:0,lives:3,check:3}`, only checkpoint col 3 lit, `startLife(true)`.
- **startLife(first):** spawns Vel at `x=check*16+4`, `y=surf(check)*16-24`, hp=5, inv = 0 on the first life and 1.5 s otherwise, arrows = `max(12, carried arrows)`. Camera `max(0,x-120)`. The dog appears at x−20. Entities respawn from `ENT0` except pickups already taken (`G.taken` Set). Boss reset, `G.resup=7`, `music('stage')`.
- **Persistence:** `localStorage['tty-stage1']` holds `S={mute,size,rotate,touch,inv,inf}`.
- **update(dt)** wraps `update0`. First it applies unlimited arrows and the action buffers, then runs `update0`, then the spin, beams, imp/vetala/cobra-bob AI, and finally `music(want)`, where want = `deva` if Deva is active, `boss` if the boss is on, otherwise `stage`.

## 5. Tuning values (js/tuning.js, complete)

Units: px/s and seconds.

| Key | Value | Meaning |
|---|---|---|
| run | 104 | run speed |
| devaRun | 128 | run speed in Deva form |
| accG | 2400 | ground acceleration/deceleration |
| accA | 1500 | air control |
| grav | 980 | gravity |
| maxFall | 420 | terminal fall speed |
| jump | 318 | first jump (×1.06 in Deva) |
| djump | 280 | double (spin) jump |
| coyote | 0.10 | ledge grace |
| buffer | 0.12 | jump buffer |
| actBuf | 0.15 | sword/bow press buffer |
| arrowSpd | 270 | arrow speed (×1.2 in Deva) |
| shootCD | 0.26 | bow cooldown |
| devaShootCD | 0.15 | bow cooldown in Deva |
| strikeCD | 0.30 | sword cooldown |
| dmg | staff 1, sword 2, great 3 | melee damage (staff is unused: `weapon()` returns only sword/great) |
| reach | staff 28, sword 36, great 46 | melee reach px |
| quiver0 | 12 | arrows per life (minimum) |
| quiverMax | 24 | arrow cap |
| pack | 6 | arrows per quiver pickup |
| hearts | 5 | HP per life |
| lives | 3 | lives (HUD shows REST = lives−1) |
| inv | 1.3 | invincibility after a hit |
| heartsLostPerHit | 1 | damage taken per hit |
| deva | 30 | Deva duration |
| enemies.boar | hp 3, walkSpeed 28, chargeSpeed 150 | |
| enemies.bird | hp 1, diveSpeed 160 | |
| enemies.cobra | hp 2, spitSpeed 130 | |
| enemies.imp | hp 1, hopSpeed 70 | |
| enemies.vetala | hp 2, walkSpeed 34 | |
| bossHP | 40 | Vaka HP |
| musicVolume | 0.2 | MP3 volume (was 0.55) |
| sfxVolume | 1.0 | SFX bus gain (was 0.5) |
| anim.apexVy | 120 | \|vy\| below this shows the apex pose |
| anim.bossRig | true | skeletal Vaka on/off |
| anim.bossWalk | 30 | Vaka stalking speed |
| dog.barkGap | 3 | min s between enemy barks (+0–2 s random) |
| dog.idleBarkRate | 0.08 | random bark chance per s |
| dog.attackRange | 95 | leap range px |
| dog.attackRate | 2.5 | leap chance per s while in range |
| dog.attackCooldown | 3 | min s between leaps (+0–2 s random) |

Hard-coded numbers elsewhere are listed in the sections below.

## 6. Player (Vel)

- **Hitbox:** 10×22 (12×28 in Deva; the y position is adjusted so the feet stay put). Faces ±1.
- **Horizontal:** with input, `vx += dir*acc*dt`, clamped to ±speed. Without input, decelerate by `acc*dt` toward 0. acc = accG on the ground and accA in the air. While `hurtT>0` (0.25 s after a hit), input is ignored.
- **Jump:** a press sets the buffer to 0.12. Coyote resets to 0.10 on the ground and counts down in the air. With the buffer active:
  - Down + jump on a one-way platform (tile 2): drop through (y+3).
  - If coyote > 0: `vy=-318` (×1.06 Deva), jumps=1, SFX `jump`.
  - Else if jumps < 2: `vy=-280`, jumps=2, SFX `djump`, 8 dust particles `#f2e8c0`. This **starts the spin attack**.
  - Variable height: if jump isn't held and `vy<-120`, add extra gravity `grav*dt*1.4`.
- **Physics (`moveBody`):** X then Y, tile collision. Tile 1 (top) and 3 (fill) are solid. Tile 2 is a one-way platform, landable only if the previous bottom row was above it and the body isn't dropping. Enemies use `oneway=false` (they still land on tile 2 when falling; the oneway flag only gates tile 2).
- **Bounds:** x clamped to [8, LW−8]. During the boss, x is clamped to [404·16+8, 423·16−8].
- **Sword (`doStrike`):** cooldown 0.30, pose alternates `strike0`/`strike1` (0.2 s). Hitbox centred `p.x+face*reach/2`, width = reach (36, or 46 in Deva), from y−4 with height h+8. Damage 2 (3 Deva). It also destroys rocks (+10 score) and venom. White arc slash drawn at radius reach×0.75 (gold in Deva). SFX `sword`.
- **Sword beam:** fired with every strike **only when hp ≥ 5 (full health)**. Projectile from `x+face*16` at `vx=face*250`, life 0.8, hitbox 14×12, damage 2. Stops on walls and cancels venom. Crescent shape, `#7fd4ff` (gold in Deva). SFX `beam`. The HUD hint reads `FULL HP: SWORD BEAM` / `heal for sword beam`.
- **Double-jump spin attack:** on the transition to jumps=2, set `spin=0.5` s and increment `G.spinId`. The angle advances `face*22` rad/s, and the spin ends on landing. Circle radius 28 (34 Deva), melee damage. Each enemy and the boss is hit at most once per spin (`spinId`). It destroys rocks and venom. Drawn as the jump body rotating, with the sword icon and a 4 px arc trail. The normal hero sprite is replaced by BLANK during the spin.
- **Bow:** a press with cd ≤ 0 and arrows > 0 (or Deva) shoots an arrow from `x+face*10, y+8`. Life 1.2 s, hitbox 12×4, damage 1 (2 Deva). Pose `shoot` 0.18 s. SFX `bow`. With no arrows, the bow press does a sword strike instead and toasts once. An arrow hitting a wall makes a `thunk` with a dust burst. Hitting an enemy plays `athit`. Arrows also destroy rocks.
- **Action buffer:** a sword/bow press sets `BUF=0.15`. While the buffer is >0 and the cooldown is ready, the press fires.
- **Damage:** `hurtPlayer`: if invincible (inv>0, or the INVINCIBILITY setting) nothing happens. Otherwise hp −1, inv 1.3, hurtT 0.25, knockback `vx=dir*140, vy=-180`, pose `hurt` 0.3 s, SFX `hurt`, shake 4, red flash 0.4, and the dog switches to `rush`. While invincible, Vel blinks at 20 Hz.
- **Pit fall** (y > LH+20): hp −1 (refunded under the invincibility option), then respawn on the nearest column (up to 20 back) where that column and both neighbours have ground. inv 1.5, toast.
- **Death:** `dead=true, deadT=1.6, vy=-240`, SFX `lose`, music stops. Afterwards lives −1 and carried arrows are kept. If lives ≤ 0 the state becomes `over`, otherwise `startLife(false)` at the last checkpoint.
- **Pickups:** mango +50 (`pick`). Heart +1 hp, capped at 5, +50 (`heart`). Quiver +6 arrows, capped at 24 (`ammo`). Orb sets Deva 30 s (`devaOn`, flash 0.8).
- **Deva mode:** golden form, run 128, jump ×1.06, unlimited arrows (cooldown 0.15, speed ×1.2, damage 2), great sword (damage 3, reach 46). Hero sprite scaled ×1.25 with a gold tint (art path; the procedural path scales the 48×44 frame to 60×55). Pulsing pale-gold ellipse aura and gold/white sparkles. **Music switches to the Deva chiptune** while it lasts. When it ends: `devaOff` SFX and a toast.
- **Scoring:** boar 150, cobra 120, other enemies 100, mango/heart 50, rock 10, each boss hit 20, boss kill 5000.

## 7. The Dog

State in `G.dog`: hitbox 14×14, `state` = follow / rush / atk.
- **Follow** target is `p.x - p.face*22` (rush: `-p.face*12`). `vx = clamp(dx*4, ±170)`, stopping within 6 px. Jumps (`vy=-320`) when it hits a wall, or when Vel is >30 px away and more than 20 px above it.
- **Foe detection:** the first live enemy (not hanging) within 100 px horizontally and 60 px vertically.
- **Barks:** with an enemy near and the bark timer ≤ 0, bark and wait 3 + 0–2 s. With nothing near, there's a random chance `0.08/s` while grounded (then 5–9 s wait). The bark shows `!` and 3 yellow sound arcs for 0.6 s. SFX `bark` (two sawtooth yips with noise).
- **Attack:** enemy within 95 px, ready (cooldown 3 + 0–2 s), grounded, at a random 2.5/s chance. Leaps with `vx=face*190, vy=-210` for up to 0.7 s. The first overlap does `hurtFoe(1)` with SFX `bite`.
- Teleports next to Vel (with a dust burst) if it's more than 0.6×VW away or has fallen, but only while Vel is grounded.
- Frames: `leap` (attacking or airborne with \|vy\|>60), `bark`, 6-frame run (`ap += |vx|/9` per s), and sit breathing (`sit0/sit1` at 1.6 Hz).

## 8. Enemies

Each enemy is spawned at `x=c*16+8` and starts facing −1. An enemy only updates within 0.9×VW of the player (birds and the batch-2 foes within VW). Touching any live enemy hurts Vel. `hurtFoe`: flash 0.12, white burst. On death: `dying=0.5`, hops up, SFX `edie`, score, gold burst. Otherwise SFX `ehit`, and a boar is knocked back 4 px.

| Type | Hitbox | Behaviour |
|---|---|---|
| **Boar** (tusked boar; "Yaksha" in the art) | 22×24 | `idle`: walks at 28, turns at random (0.5/s), at walls or at ledges. If the player is within 130 px horizontally and 40 px vertically → `tell` for 0.55 s (stops, red tint, flashing red `!`) → `charge` at 150 for up to 1.4 s (dust) → `rest` for 0.9 s when the timer runs out, it hits a wall or reaches a ledge. Has gravity and falls into pits. |
| **Bird** (hawk) | 16×10 | Hovers at `y=30+(c*13)%30` with sine drift. When the player is within 90 px and not more than 40 px past it, and the cooldown is ready: `dive` straight at the player at 160. Pulls out below the player's feet or near the ground → `rise` (vy −90, vx face×60) → idle with a 1.6 s cooldown. |
| **Cobra** | 14×22 | Stationary, bobs ±3. Within 160 px it spits venom every 2.2 s (initial delay 1+(c%5)·0.3): `vx=clamp((px-ex)*0.9, ±130)`, `vy=-170`, venom gravity 420, life 3, 6×6. Spit pose for 0.3 s, SFX `spit`. Venom bursts green `#62b81a` on walls. |
| **Imp** | 12×14 | Gravity. When grounded, friction ×0.8. Within 170 px, hops toward the player: `vy=-190–250`, `vx=face*(70+0–30)`, then waits 0.7–1.2 s. |
| **Vetala** (hanging ghoul) | 12×22 | `hang` at `y=34+(c*7)%14` on a brown rope line, swaying. When the player is within 44 px it drops (SFX `spit`). On landing: dust and `thud`, then `walk` toward the player at 34. |

Pickups (12×12, bobbing): mango, heart, quiver, orb (orb has a pulsing glow and 4-frame animation). Taking one is permanent for the run.

## 9. Boss: Vaka (js/boss.js + rig in anim.js)

- **Trigger:** when `p.x > 407*16` and the boss isn't already on or done. Lock the arena: player x ∈ [404·16+8, 423·16−8]. A stone gate pillar is drawn at col 404, and the camera eases to `404*16` (rate 4/s). Vaka spawns at col 419, size 52×96, hp 40, facing −1. State `intro` for 2.2 s, `roar`, shake 8, toast. Music switches to `boss`.
- **States:**
  - `idle`: faces the player and walks at 30 if more than 70 px away. When the timer expires, 55% `tell` (roar; 0.85 s, or 0.65 s in phase 2) and 45% `wind` (0.7 s, or 0.55 s in phase 2). After intro, idle starts at 1 s.
  - `tell` → `charge`: speed 220 (260 in phase 2) for up to 2 s with dust. On reaching the arena edge (x<405·16+20 or >422·16−20) or timing out → `stun` for 1.4 s, shake 7, `thud`, and **3 rocks (4 in phase 2) fall** from the sky at random x between col 406 and 422, spaced 30 px vertically, gravity 520. A shadow marks their landing spot while y<20.
  - `wind` → throw **1 rock (3 in phase 2, spread 30 px)** aimed to land at the player in 0.9 s (`vy=-200`, gravity 360) → `throw` 0.4 s → idle (1.3 s; 0.9 s in phase 2).
  - `stun` → idle (1 s; 0.6 s in phase 2). Three yellow stars circle the head.
  - Contact damage everywhere except intro/stun, with a hitbox inset 10 px from the top.
- **Phase 2** at hp ≤ 20: `roar`, and a Deva orb drops at col 419 (or 409 if the player is at col ≥ 414) on row 4, with a toast.
- **Quiver resupply:** while arrows < 6 and Deva is off, every 7 s a quiver spawns at col 418 or 409 (row 5).
- **Damage:** ignored in intro. Each hit gives +20 score, flash, SFX `bhit`. At hp ≤ 0 → `die` for 2.4 s (random gold/red bursts, shake 10, `bdie`, +5000), then state `win`, music stops, SFX `win`.
- **12-part rig** (`vakaRig`, when `TUNING.anim.bossRig` is true and `vaka_parts.png` + `frames.json.vakaRig` exist): parts `legL, legR, torso, loin, head, jaw, upperL, foreL, handL, upperR, foreR, handR`, cut from the 83×106 Vaka idle frame. Each part has `r` (source rect in vaka_parts.png), `o` (offset in the 83×106 space) and `p` (pivot). It's drawn on a 160×150 canvas, centred, bottom-aligned. Hierarchy: legs (with lift) → torso (lean, translated by rx and bob) → loin; head → jaw; upperL → foreL → handL; same for the right arm. Pose per state (degrees):
  - walk: legs ±15 (±24 when charging) with phase `x/10` (`x/7` when charging), arms swing ±10, bob.
  - idle: breathing `sin(t*2.2)`, the jaw opens slightly.
  - tell/intro: head shakes, jaw 24, arms raised (uL 70, fL −55, hL −20, mirrored on the right), tremble.
  - charge: lean 16, arms back, head 10, jaw 12.
  - wind: right arm winds up to −155 as the timer runs.
  - throw: ease-out cubic release.
  - stun: wobble, head droops 20.
  - die: lean −10 with wobble, head 28, jaw 22.
  - hit flash: recoil, and the whole rig is drawn white.
  - Tints: tell red `#ff2010` 0.25, stun blue `#a0a0ff` 0.2.
- Fallback without the rig: a still `vaka.png` idle frame with a bob and tints (tell red, throw gold, stun blue). Without art at all, the procedural `vakaSprite` frames `i0/i1/tell/r0-3/throw/stun`.

## 10. Stage 1 layout (js/stage1.js)

Map `COLS=424` × `ROWS=12`. Tile codes: 0 empty, 1 ground top, 2 one-way red beam platform, 3 solid fill. Column 0 and column 423 are full-height walls. Ground segments `[from, to, height in tiles]` (gaps between them are pits):

```
[0,40,2] [40,60,3] [60,74,2] [78,96,2] [96,112,3] [117,130,4] [130,150,3] [154,180,2] [180,200,3]
[200,230,2] [235,250,3] [255,275,2] [275,300,4] [304,330,2] [330,360,3] [365,404,2] [404,424,2]
```
Pits: 74–77, 112–116, 150–153, 230–234, 250–254, 300–303, 360–364.

One-way platforms `plat(col,row,width)`: (27,7,6) (45,6,4) (73,7,6) (86,6,5) (111,7,7) (122,5,4) (140,6,5) (149,7,6) (165,6,4) (186,5,5) (213,6,5) (229,7,7) (240,5,4) (249,7,7) (262,6,4) (284,4,4) (299,7,6) (318,6,5) (342,5,4) (359,7,7) (375,6,4) (386,5,4) (409,7,3) (417,7,3).

- **Checkpoints (lamps):** cols 3 (lit at start), 96, 200, 330, 396. Lighting one plays `check`, a burst and the Sanjaya toast. Lamps flicker with particles.
- **Ground enemies:** cols `[20,52,66,100,134,160,190,206,240,268,290,312,340,370,388]`. `patchInit` reassigns them in a repeating sequence `boar, imp, cobra, vetala, imp, boar`, which gives: 20 boar, 52 imp, 66 cobra, 100 vetala, 134 imp, 160 boar, 190 boar, 206 imp, 240 cobra, 268 vetala, 290 imp, 312 boar, 340 boar, 370 imp, 388 cobra.
- **Birds:** cols 36, 58, 90, 125, 145, 172, 196, 222, 258, 280, 322, 350, 380.
- **Food:** cols 24, 47, 62, 88, 113, 124, 142, 167, 188, 215, 242, 263, 286, 320, 344, 377. Every 4th one (index%4==3) is a heart and the rest are mangos. Row 4 for odd indices, row 5 for even.
- **Quivers:** cols 44, 108, 176, 226, 272, 334, 392 (row 5). **Deva orbs:** cols 128 and 286 (row 3).
- **Boss arena:** cols 404–423, gate at 404, trigger past col 407, platforms at (409,7,3) and (417,7,3).
- **Decor** (seeded rng(7), every 3–8 columns from col 6 to 399): komainu guardian statue, lit lamp, stone face block, hanging lantern post, small shrine. All of it is baked into the level canvas.

**Backgrounds** (back to front): `sky` (blue gradient `#1c64d8→#3c9cf0→#8cd0ff`, Bayer-quantised, 5 clouds) → `far` (parallax 0.12; reddish rock ridge with carved faces, or `far.png`) → `ruin` (0.3, y+6; fades in for cam 1800–3300; or `ruins.png`) → `mid` (0.5, y+10; saffron temple halls with red pillars, gold trim and lanterns; replaced by an empty 1×1 when `ruins.png` loads) → arena (`arena.png`, 0.15, fades in over 200 px before the boss gate) → light shafts (0.6, alpha 0.8) → wash → level → sprites → foreground: `near` red pillars (1.35) and `fringe` roof edge with lanterns (1.2) at alpha 0.9. Procedural tiles: grey stone brick with dark mortar and a light top lip. Platforms: red beam with a gold stripe. Art tiles come from `tiles.png` (`top` / `fill` index lists).

## 11. Camera

`target = p.x - 130 + p.face*20`. Each frame `cam += (target-cam)*min(1,dt*5)`, clamped to [0, LW−VW]. In the boss fight it eases to `404*16` at rate 4. No vertical scrolling: the level is 192 px tall and drawn at y offset −26. Screen shake is a random ±shake/2 px offset that decays at 20/s. Flash is a full-screen overlay (red, or pale gold in Deva), alpha ≤ 0.5, decaying at 3/s.

## 12. HUD and UI (js/ui.js)

- **Text:** every string is rendered to a cached canvas in bold monospace (or serif for titles), alpha-thresholded to hard pixels, with a 1 px `#0d0710` outline and optional vertical colour ramps.
- **HUD:** a 32 px bar at the bottom in dark red `#3a0408` / red `#c8161e` with a gold top line, and komainu statues at both ends.
  - Health: 10 half-heart pips (5×3 px, ice blue `#bff4ff`, empty `#3a2a40`) at x=30.
  - `REST nn` (lives−1).
  - 7-digit score with a gold ramp.
  - Arrow icon and count (`∞` in Deva or with unlimited arrows; pinkish at 0).
  - Sword icon and `SWORD` / `GREAT` (gold).
  - `INV` when invincibility is on.
  - Right panel at x=174: during the boss, `VAKA` and a 16-pip orange HP bar. In Deva, `DEVA LIGHT` and a gold timer bar 112 px wide. Otherwise `YEAR ONE` and the beam hint.
- **Toasts:** one at a time at the top, word-wrapped at 46 chars, dark translucent box with a gold left edge, fading in and out.
- **Title:** key art (`title.png` with top/bottom dark gradients, or a procedural scene with Vel, the dog and Vaka). Gold-ramp serif `THE THIRTEENTH YEAR` at 18 px, subtitle, blinking `PRESS START`, `tap START to begin` / `Enter / Space to begin`, sound indicator.
- **Pause:** dark overlay, `PAUSED`, hint text.
- **End cards:** see §2. The card is bordered gold `#d8b24a`.
- **Settings menu** (HTML overlay, pauses the game): `INVINCIBILITY` (enemies, rocks and falls cost no hearts) and `UNLIMITED ARROWS` (arrows kept at max). Both are persisted.
- **Toolbar:** START, II PAUSE / ▶ RESUME, SOUND: ON/OFF, RESTART, ⚙ SETTINGS. Page palette: bg `#120a12`, panels `#2a1a2a`, gold `#d8b24a`, red `#c8161e`.

## 13. Controls

**Keyboard** (`e.code`): Left `ArrowLeft/KeyA`, Right `ArrowRight/KeyD`, Up `ArrowUp/KeyW` (Up also jumps), Down `ArrowDown/KeyS`, Jump `Space`, Bow `KeyX/KeyK`, Sword `KeyZ/KeyJ`. `KeyM` mutes, `KeyP/Escape` pauses. On title/win/over screens, Enter/Space/X/Z presses start. Arrow keys and Space call `preventDefault`, and key repeat is ignored. `K` holds the button state; `KP` is the pressed-this-frame flag, cleared at the end of `update0`.

**Touch** (index.html):
- **Layout:** in landscape, the left pad zone, the canvas and the right button zone sit side by side. Side width is `clamp(W*0.2, 110, 220)`. Canvas width is `min(W-2*side-2*gap, 960, (vh-50)*16/9)` at 16:9. In portrait (vh > 1.05·vw), the canvas is full width with both pads below it.
- **D-pad:** a circle at 92% of min(side, height) with ◀▶▲▼ markers. Input is **angle based**: dead zone radius 11% of min(w,h). Right if the angle is in (−67.5°, 67.5°), left if > 112.5° or < −112.5°, up if in (−157.5°, −22.5°), down if in (22.5°, 157.5°). The overlaps give diagonals.
- **Buttons:** SWORD at (0.30, 0.30), BOW at (0.28, 0.74), JUMP at (0.72, 0.55), as fractions of the zone. A touch anywhere in the zone presses the **nearest button**.
- **Multi-touch:** each `pointerId` is tracked in a Map with `setPointerCapture`, and move events re-evaluate. The union of all pointers is diffed against the held set to send press/release. Released on pointerup, pointercancel and lostpointercapture. The context menu is blocked, and the page uses `touch-action:none` and `overscroll-behavior:none`.
- **Fullscreen:** the opening overlay offers `▶ PLAY FULLSCREEN`, which calls `requestFullscreen({navigationUI:'hide'})` (webkit fallback), then `screen.orientation.lock('landscape')`, relayout, then pressStart. Alternatively "play in this window instead". Layout reruns on resize, orientationchange, visualViewport resize and fullscreenchange (and after 120/600 ms).
- **Coyote / buffers:** coyote 0.10 s, jump buffer 0.12 s, action buffer 0.15 s.
- **Auto-pause** on tab hide.

## 14. Audio (js/audio.js, anim.js, index.html)

- **Graph:** `AudioContext` → master gain (0 when muted) → destination. The `sfx` bus has gain `TUNING.sfxVolume` (1.0). The `mus` bus is used for chiptune (faded to 0.9). It's created on the first user gesture (`audioInit`).
- **Music via MP3:** index.html passes `hooks.music(k)` with two looping `Audio` elements at volume `TUNING.musicVolume` = **0.20** (SFX run at 1.0):
  - stage: `https://cdn.jsdelivr.net/gh/thepodemail-lgtm/thirteenth-year-music@main/stage1-v2.mp3`
  - boss: `https://cdn.jsdelivr.net/gh/thepodemail-lgtm/thirteenth-year-music@main/last-stand-at-the-spire.mp3`
  - The stage track resumes where it left off and the boss track restarts at 0. Mute and pause follow.
  - For `deva` the hook returns false, so the **chiptune Deva theme** plays (the MP3 pauses). This is the star-style music switch.
- **Fallback:** `REM` in audio.js (used when no `hooks.music` is given) plays the same URLs and calls `remFail()` → chiptune on an `error` event, a rejected `play()`, or `readyState<2` after 12 s.
- **Chiptune sequencer:** look-ahead scheduler every 30 ms with a 0.15 s horizon. Notes are MIDI numbers.
  - stage: 132 BPM eighths, square lead vol 0.07, 64-step melody in D; triangle bass vol 0.16; kick/hat pattern `[1,0,2,0…]`; a quiet triangle accent every 4 steps.
  - boss: 156 BPM, sawtooth lead 0.05, A minor/phrygian.
  - deva: 200 BPM, bright square arpeggios (C–E–G…), lead vol 0.06.
  - Kick: sine 150→40 Hz over 0.12 s. Hat: highpass 6 kHz white noise, 0.05 s.
- **SFX** are all synthesized: `tone(type,f0,f1,dur,vol,delay)` with an exponential pitch ramp and decay, and `noise(dur,vol,fc,q,delay,f1)` with band-passed white noise and a filter sweep.
  - jump: square 260→520. djump: square 400→900 plus triangle 800→1400.
  - **Majestic/"princely" sword** (anim.js): noise 7.5→11 kHz plus noise 2.6→7 kHz whoosh, sine bell tones 2093 Hz and 2637 Hz, triangle 3136 Hz, sine 4186 Hz, plus a triangle "shimmer" chord on 523 Hz × {1, 1.26, 1.5, 2}.
  - beam: the sword sound plus a noise sweep and a triangle chord 784/988/1175/1568 plus sine 262.
  - spin: noise 1.2→5.2 kHz, high noise, sine 1568, shimmer on 392, sine 196.
  - **Arrow impact `thunk`:** sine 190→65 (vol 0.45), short 1.4 kHz noise click, square 120→60, triangle 430→390. `athit` = thunk plus a low 700 Hz noise.
  - bow: noise 3k→800 plus triangle 700→240.
  - Others: ehit, edie, hurt, pick, heart (523/659/784 arpeggio), ammo, check (392/523/659/784), bark, bite, roar (sawtooth 140→50 for 1.1 s plus noise), bhit, bdie (6 stacked falling bursts), devaOn (523…1318 arpeggio plus sparkle), devaOff, win, lose, blip, sel, rock, spit, thud.
- Mute: `M` key or the button. The setting is stored, and both the MP3s and the master bus follow it.

## 15. Art pipeline

- **Procedural base (sprites.js):** the `Spr` class is a Uint32 pixel buffer with `p, g, pick(ramp, light, x, y)` (Bayer-dithered 4-step ramp), `ell`, `cap` (capsule limb), `rect`, `line`, `poly` and `outline()` (dark outline). Light comes from the top-left. Palettes `P` include skin, hair, saf(fron), wht, gold, wood, steel, blade2, dog, red, boar, snake, hood and more. Sprites are cached in `SC` by key via `spr(key, fn)`. `whiteOf` makes the hit-flash white silhouette. Every sprite is drawn bottom-centred with `drawS` (flip, squash SQX/SQY, white, fade).
- **Hand-drawn pack (art.js):** Daniel's drawings (`assets/art/src/*.jpg`) are cut out from a white background and packed into PNG sheets by `tools/build.py`, `sprites.py` and `bg.py`. They're scaled with **nearest-neighbour** (Pillow `Image.NEAREST`). `frames.json` maps `sheet → key → [x,y,w,h]`:
  - vel: idle, run1, run2, jump, draw, aim, strike, strikeD, hurt, rn0–rn7, rise, apex, fall, land
  - dog: stand, run1, run2, bark, sit, r0–r5, sitb, leap
  - boar: stand, charge, w0–w3, c0–c3
  - hawk: up, down, f0–f3, dv
  - vaka: idle
  - tiles: `{top:[indices], fill:[indices]}`
  - vakaRig: `{order:[12 names], parts:{name:{r:[x,y,w,h], o:[x,y], p:[px,py]}}}`
  - Frames are placed bottom-centred on minimum canvases (Vel 48×44, dog 30×22, boar 44×30, hawk 36×30, Vaka 100×108).
  - Every file loads independently. If one fails, that piece keeps its procedural drawing. If `frames.json` fails, all the sheet-based swaps are dropped. Hitboxes never change.
- **In-between frames (`tools/anim.py`):** generated from the base frames with Pillow, numpy and OpenCV. A *shear* (rows below a split line shifted by k px, with an optional bob) and a nearest-neighbour *scale* produce:
  - Vel: 8 run frames from run1/run2, shear pattern `[0,-2,-4,-2]` and bob `[0,-1,-1,0]`; rise (scale 0.94×1.07), apex, fall, land squash (1.12×0.86).
  - Dog: 6 run frames, sitb, leap (= bark).
  - Boar: 4 walk and 4 gallop frames.
  - Hawk: 4 flap frames (vertical wing squash 0.55 and 0.3), dv.
  - The new frames are appended to the right of each sheet, and frames.json is rewritten.
  - The Vaka idle (83×106) is cut into 11 polygon parts plus a torso. Holes behind the joints are back-filled with a darkened median torso colour plus noise. The mouth behind the jaw is filled dark `(50,12,14)`. Leg tops are extended 5 px darker. Output: `vaka_parts.png` and `frames.json.vakaRig`.
  - Note: the script writes back into the sheets, so run it once on a clean checkout of the base sheets.
- **Runtime animation:** the run frame is `(anim*2.1|0)%8`, where `anim += dt*(|vx|/60+1)`. Jump pose: rise / apex / fall chosen by `vy` against ±120. Land pose while the landing squash is above 0.3. Idle is 4 frames. Hero squash: landing (sy 0.8, sx 1.18, decaying), stretch while rising, breathing at idle. Enemies wobble with a sine squash, and charging enemies get 1.12×0.92.

## 16. Hosting

- GitHub Pages serves the repo root of `main` (no build step). An edit on github.com republishes in about a minute.
- Music streams from jsDelivr (`cdn.jsdelivr.net/gh/<user>/<repo>@main/<file>`). New tracks get **new file names** so phones don't play a cached copy. The music repo also has `victory-at-the-peak.mp3`, which the README still lists but the code no longer uses (the stage track is now `stage1-v2.mp3`).
- `tuning.js` is designed for non-programmers to edit on github.com.

## 17. Known limits and open items

- Vel's arms don't swing while running with the art pack: the 8 run frames are shears of only two drawn poses (the procedural fallback does swing its arms).
- Vaka's rig joints can look patchy, because the back-fill behind the limbs is an approximation.
- The sounds haven't been tested by ear on a real device.
- The index.html music hook has no load-failure fallback for stage/boss. The chiptune fallback for those (REM) only runs if `hooks.music` isn't supplied. Deva always uses chiptune.
- `dmg.staff` / `reach.staff` and the `staff` SFX are leftovers; Vel never uses a staff.
- The README describes the art in places using older keys (run1/run2 etc.), and the music line names `victory-at-the-peak.mp3`.
- The Stage 1 boss choice is still open: a Hunter/Shiva duel or Vaka.

## 18. Rebuild order

1. **Shell:** index.html with the CSS, toolbar, 320×180 pixelated canvas, side zones and settings menu, plus the script tags in the exact order in §3.
2. **tuning.js:** copy §5 verbatim.
3. **engine core:** constants, `C()` colour → ABGR uint32, `rng` (mulberry32-style), `clamp`, `mk`, `paint`, `BAYER`. State `G` and the loop with the dt cap of 0.05. `moveBody` tile collision, `ov` AABB.
4. **stage1.js:** `buildMap` with the segments, platforms, checkpoints and entities from §10. `tileAt/solid/gnd/surf`. A simple coloured-tile render first.
5. **input.js:** keyboard map, K/KP/BUF.
6. **Player movement:** acceleration, coyote, buffer, variable jump, double jump, drop-through, camera (§11). Tune until it feels right.
7. **Combat:** sword strike plus arc, the full-health beam, the spin attack, the bow and arrows, the action buffer.
8. **Enemies:** spawn, AI for boar, bird, cobra/venom, imp and vetala, `hurtFoe`, then patchInit's enemy reassignment.
9. **Health:** hurt, inv blink, pit fall, death, lives, checkpoints, pickups, Deva mode.
10. **Dog AI** (§7).
11. **Boss** (§9): arena lock, state machine, rocks, phase 2, orb, resupply, win.
12. **Procedural sprites** (`Spr`, palettes) and backgrounds/parallax (§10, §15). Squash and stretch.
13. **UI:** pixel text, HUD, toasts, title, pause, end cards, settings.
14. **Audio:** WebAudio bus, SFX synths (with the anim.js overrides), chiptune songs, MP3 hook with the jsDelivr URLs, the Deva switch, mute/pause.
15. **Touch controls:** layout, angle D-pad, nearest-button, multi-touch, fullscreen + landscape lock, auto-pause.
16. **Art pack:** `frames.json` loader, per-asset swap with fallback, then the anim.py in-betweens, then the Vaka rig.
17. Deploy to GitHub Pages and verify on a phone.

## 19. Acceptance checklist

- [ ] Opens on a fullscreen prompt, then the title. The canvas is 320×180 and stays crisp (no smoothing) at any size, with no scanlines.
- [ ] Run 104 px/s. Jump and double jump heights match (318/280, gravity 980). Releasing jump early cuts the jump short. Coyote and buffer both work.
- [ ] The double jump spins with a sword arc and damages each enemy once.
- [ ] The sword alternates poses and reaches 36 px (46 in Deva). The beam fires **only at 5/5 hearts**.
- [ ] Bow: 12 arrows at the start, cap 24, +6 per quiver. Empty bow → sword plus toast. Arrows thunk on walls.
- [ ] Hits cost 1 heart, give 1.3 s blink and knockback. Pits cost a heart, not a life. 3 lives, 4 checkpoints plus the start, with Sanjaya toasts.
- [ ] The Deva orb gives 30 s of gold form: faster, great sword, endless arrows, **Deva music**, timer bar.
- [ ] Enemy roster and positions match §10. Boars telegraph with a red `!` before charging. Birds dive, cobras spit arcs, imps hop, vetalas drop.
- [ ] The dog follows, barks (with `!` and arcs) near enemies and sometimes at random, and occasionally leaps and bites.
- [ ] The boss arena locks at col 404, Vaka has 40 HP, charge → stun + falling rocks, wind → thrown rocks. At half HP: phase 2 (faster, more rocks) plus an orb. Quivers drop when you're low.
- [ ] Vaka animates limb by limb (12 parts) and flashes white when hit.
- [ ] The win card shows the moral "LESSON: PATIENCE". Game over shows the Arjuna line.
- [ ] Music: stage MP3 at volume 0.20, boss MP3 in the arena, chiptune Deva theme. SFX are clearly louder (bus 1.0). The sword sound is a bright, bell-like whoosh.
- [ ] Touch: the D-pad allows diagonals by angle, any touch on the right pad hits the nearest button, two thumbs work at once, and the page doesn't scroll or zoom. Landscape lock in fullscreen. The game pauses on tab switch.
- [ ] Settings: invincibility and unlimited arrows both persist across reloads. Mute persists.
- [ ] Missing art files fall back to the procedural sprites without errors.

# Lumen Veil

A small, self-contained browser game: you are **Ember**, a light spirit in a moonlit meadow. Collect glowing **dewdrops**, dodge chasing **Shadow Moths**, slip past the **Elder Moth**, and when the **Moon Gate** opens, swim through it to escape.

## How to play

1. Open `index.html` in a modern browser (no server or build step required).
2. Press **Space** or **Enter** on the title screen to begin.
3. Move with **WASD** or **arrow keys**.
4. Collect **6 dewdrops** (of 8 on the field). The Moon Gate at the top unlocks.
5. Reach the open Moon Gate to win.
6. Touching a Shadow Moth costs one Light (you have 3). Lose all Light and the run ends.
7. The **Elder Moth** guards the Moon Gate: larger, darker, gold-eyed, and about half a Shadow Moth's speed. It never chases — it only drifts left and right across the gate — but touching it also costs one Light.
8. Press **R** at any time to restart.

**Goal:** open the Moon Gate and escape before your light is gone.

## Files

| File | Role |
|------|------|
| `index.html` | Page shell, canvas, HUD, dialogue panel, overlay |
| `style.css` | Layout and visual chrome |
| `config.js` | Tunable numbers (speeds, counts, sizes, colors) |
| `story.js` | Title, dialogue, win/lose copy |
| `game.js` | Input, entities, update/draw loop |
| `README.md` | This file |

## Design notes for later edits

- Gameplay constants live in `CONFIG` (`config.js`).
- Shadow Moth tuning is under `CONFIG.enemy`; the single Elder Moth guardian is under `CONFIG.elder` (size, speed, patrol width, hover height).
- Narrative / UI strings live in `STORY` (`story.js`).
- The main loop is `frame → update → draw` in `game.js`.
- Phases: `title` → `play` → `win` | `lose` (restart with R).

No external libraries, CDNs, or build tools. Plain HTML + CSS + JavaScript only.
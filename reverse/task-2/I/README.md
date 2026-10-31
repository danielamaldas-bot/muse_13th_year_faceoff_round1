# Lumen Veil

A small, self-contained browser game: you are **Ember**, a light spirit in a moonlit meadow. Collect glowing **dewdrops**, dodge chasing **Shadow Moths**, and when the **Moon Gate** opens, swim through it to escape.

## How to play

1. Open `index.html` in a modern browser (no server or build step required).
2. Press **Space** or **Enter** on the title screen to begin.
3. Move with **WASD** or **arrow keys**.
4. Collect **6 dewdrops** (of 8 normal ones on the field, plus 1 golden one). The Moon Gate at the top unlocks.
5. Reach the open Moon Gate to win.
6. Touching a Shadow Moth costs one Light (you have 3). Lose all Light and the run ends.
7. Press **R** at any time to restart.

**Goal:** open the Moon Gate and escape before your light is gone.

## Dewdrops

- **Normal dewdrops** (8, teal): each one counts as **1 Dew** toward the Moon Gate. No Light.
- **Golden dewdrop** (1, gold): spawns near the **center of the meadow** at the start of every run.
  It counts as **1 Dew** *and* restores **1 Light** (never above the maximum of 3).
  If Ember is already at full Light, it still counts as 1 Dew.

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

- Gameplay constants live in `CONFIG` (`config.js`); the golden dewdrop has its own `CONFIG.golden` block and `CONFIG.player.maxLives` caps Light.
- Narrative / UI strings live in `STORY` (`story.js`).
- The main loop is `frame → update → draw` in `game.js`.
- Phases: `title` → `play` → `win` | `lose` (restart with R).

No external libraries, CDNs, or build tools. Plain HTML + CSS + JavaScript only.

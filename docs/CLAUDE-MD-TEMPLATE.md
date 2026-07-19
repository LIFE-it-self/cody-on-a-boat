# Template — copy this as `CLAUDE.md` in your project root in Session 1

This file is read by Claude Code at the start of every session. It is the project's persistent memory. Keep it accurate. Update it at the end of every session.

The block below — between the `===` lines — is the actual content to copy into `CLAUDE.md`. Everything outside that block is instructions to you, the human, and should not be in the file.

```
==========================================================================
# Cody On A Boat — CLAUDE.md

## What this is
A browser-based pixel-art mini-RPG built in Phaser 3. Player is Captain Chowder John. Goal: get Cody off the boat by completing minigames and a 4-step ritual (pipe → dinner → shower → nap) in the correct order. Failure or wrong order = Cody becomes a hurricane and sinks Florida. Fail cutscene shows Cody on a coral throne as Aquaman.

This is an inside joke for the developer's friend group. It is not a commercial product. Tone is absurd, nothing takes itself seriously. 15–30 minute playthrough.

## Tech stack (decided, do not change)
- Phaser 3.80.x
- Vite (bundler + dev server)
- Vanilla JavaScript (no TypeScript)
- No Tiled (rooms are JS arrays in src/data/rooms.js)
- No Grid Engine plugin (custom 4-direction movement in src/objects/Player.js)
- No localStorage (state lives in game.registry)
- Free (CC0 / CC-BY) assets only

## Commands
- `npm run dev` — start dev server, opens at http://localhost:5173
- `npm run build` — production build to dist/
- `npm run preview` — preview production build locally
- `npm run deploy` — push dist/ to gh-pages branch (deploys to GitHub Pages)

## Architecture
- All minigames extend `src/scenes/minigames/BaseMinigame.js`
- Add new minigames as one new scene file plus one entry in `src/data/levels.js`
- Game state lives on Phaser's `game.registry` via `src/systems/GameStateManager.js`
- Cross-scene events go through `src/systems/EventBus.js`
- Ritual order is enforced by `src/systems/SequenceGuard.js`
- HUD is a parallel scene (`HUDScene`), not embedded in gameplay scenes
- Dialog is a parallel scene (`DialogScene`), not modal blocking

## Key patterns
- Minigame lifecycle: TITLE_CARD → INSTRUCTION → PLAY → EVALUATE → WIN/LOSE (handled by BaseMinigame)
- Scene transitions: `this.scene.start('SceneKey', { data })`
- Cross-scene data: `this.registry.get('key')` / `this.registry.set('key', value)`
- Ritual steps: scenes that extend BaseMinigame and set `isRitual: true` in their level config

## Failure threshold
- 5 failed minigames = hurricane fail cutscene
- Wrong-order ritual attempt = immediate hurricane fail cutscene

## Resolution
- Internal: 256×224 (SNES standard)
- pixelArt: true, roundPixels: true
- Tile size: 16×16
- Character sprites: 16×16 (or 16×24 for taller)

## Art strategy
- Sessions 1–7: placeholder rectangles, circles, Phaser graphics primitives only
- Session 8: real sprites are dropped in to replace placeholders
- One Cody variant for v1 (CodySelectScene exists as a stub but is disabled)

## Required reading at the start of every session
- This file (CLAUDE.md)
- docs/GAME-DESIGN.md (game design source of truth)
- docs/PHASE_LOG.md (what's been built so far, in what order)

## What NOT to do
- Do NOT use TypeScript
- Do NOT add npm dependencies unless explicitly approved
- Do NOT modify src/scenes/minigames/BaseMinigame.js from a minigame file
- Do NOT use localStorage (use game.registry)
- Do NOT build a character creator (one Cody for v1)
- Do NOT use copyrighted music or art
- Do NOT introduce Tiled, Grid Engine, or any plugin/tool not already in package.json
- Do NOT skip git hooks with --no-verify
- Do NOT add type hints, docstrings, or refactors to code that wasn't part of the current session's goal
- Do NOT mark a task complete if anything is broken — keep it in_progress and ask the user

## Current phase
[Updated at the end of every session. Initial value: "Session 1 complete. Project scaffolded, deployed to GitHub Pages. Next: Session 2 — overworld + rooms."]

## Sprite/asset placeholder conventions (Sessions 1–7)
- Player (Captain) = blue 16×16 rectangle
- Cody = green 16×16 rectangle
- Werewolf Cody = gray 16×16 rectangle with red eye dots
- Aquaman Cody = teal 16×16 rectangle with yellow trident dot
- Mermaids = pink 16×16 rectangles
- K-fish (gold) = yellow K shape from two rectangles
- K-fish (red) = red K shape from two rectangles
- Pipe = brown 8×4 rectangle
- Coke can = red 8×12 rectangle
- Door / interact zone = invisible Phaser zone with a small visible icon overlay (yellow ! mark)
==========================================================================
```

---

## How to copy this in Session 1

Claude Code will do this for you in Session 1. The instructions are in `01-SESSION-1-SCAFFOLD.md`. You don't need to manually copy this file — it's a reference for the session.

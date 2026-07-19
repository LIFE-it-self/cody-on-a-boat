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
- All minigames extend `src/scenes/minigames/BaseMinigame.js`. **Never modify `BaseMinigame.js` from inside a minigame file** — it is the contract. Subclasses override `setupGame()` and call `this.win()` / `this.lose()`.
- Add new minigames as one new scene file plus one entry in `src/data/levels.js`
- Rooms are JS arrays in `src/data/rooms.js`. Each room has a layout (2D array), doors (with target room + spawn coords), an optional `triggers` array (tile-based minigame launch points), and a default playerSpawn. Add new rooms by adding entries here, no other code changes needed for the room data itself.
- Trigger zones live in `rooms.js` as a `triggers` array on each room (`{ x, y, levelId }`). `OverworldScene` checks for trigger overlap after every move and calls `startMinigameForLevel`. Ritual levels are double-gated there: the step must be the next in ritual order (checked first, so probing a far-ahead ritual names the expected next step) AND the act's minigame must be in `completedMinigames` (`Objective.actMinigameDone`) — otherwise the trigger SOFT-BLOCKS with a `ritual-blocked-*` dialog (no failure, no hurricane) and `softBlockedAt` keeps the tile inert until the player steps off it. Marker language: yellow `!` = safe minigame, pulsing red `!` = ready ritual step, gray `?` = ritual that would refuse. `SequenceGuard.assertCanStartRitual` still runs last as a safety net but never fires in normal play.
- Once a minigame is in `completedMinigames`, its trigger is dormant — no `!` marker, the player walks right over it. To re-test a minigame, manually clear it from the registry via the dev console.
- Game state lives on Phaser's `game.registry` via `src/systems/GameStateManager.js`. Always write through `set()` (not in-place mutation) so `changedata-*` events fire for HUD subscribers.
- Failure threshold lives in `src/systems/GameStateManager.js` as `FAILURE_THRESHOLD` (currently 5).
- Cross-scene events go through `src/systems/EventBus.js` (a shared Phaser `EventEmitter` singleton). Notable events: `'dialog-complete'`, `'hurricane-fail'`, `'victory'`.
- Ritual order + act gates are enforced in `OverworldScene.startMinigameForLevel` (soft-block dialogs); `src/systems/SequenceGuard.js` remains as a last-line safety net.
- `src/systems/Objective.js` derives "what should the player do next" (act minigame first, then that act's ritual step) from the registry. Consumed by HUDScene (live `Objective:` line via `changedata-ritualProgress`/`completedMinigames`/`talkedToCody` subscriptions), and by OverworldScene (Cody's `cody-next-<levelId>` state-aware hints, ritual gating, trigger markers).
- HUD is a parallel scene (`HUDScene`), launched (not started) from `OverworldScene` and guarded by `scene.isActive` so it persists across `scene.restart()` (door transitions).
- Dialog is a parallel scene (`DialogScene`), launched (not started). Overworld uses a `dialogActive` flag rather than `scene.pause()` to gate input while dialog is open.
- Scene render order is the order of the `scene:` array in `src/index.js`. `HUDScene` MUST stay LAST so it draws on top of every gameplay scene.
- `CutsceneScene` (`src/scenes/CutsceneScene.js`) is a data-driven scene with two modes: `'fail'` (screen shake → Cody spin → hurricane → Aquaman throne → RETRY button) and `'victory'` (fade-in beach + scrolling credits). Both modes end in `returnToMenu()`, which calls `stopMusic()` then `GameStateManager.reset(game)` to zero the registry and bounces back to `MainMenuScene`. Tracks all `delayedCall` handles in `this.timers` and removes them in `shutdown()` so early `returnToMenu()` doesn't leak callbacks. Fail mode plays `bgm-fail` + `sfx-hurricane`; victory mode plays `bgm-victory`. Both modes use real sprites/images when loaded (cutscene-hurricane, cutscene-aquaman, cody) with Phaser graphics fallbacks.
- `CutsceneRouter` (`src/systems/CutsceneRouter.js`) owns the module-scoped global listeners for `'hurricane-fail'` and `'victory'`. Registered ONCE from `src/index.js` after `new Phaser.Game()` via `registerCutsceneRouter(__game)`. On either event, it stops every active/paused scene except `CutsceneScene` and starts `CutsceneScene` with the appropriate `mode`. The handoff is deferred by a `Promise.resolve().then(...)` microtask so scene state isn't mutated inside a Phaser event callback (the synchronous path from `BaseMinigame.win() → markRitualStep() → EventBus.emit()` historically caused "Cannot read property 'sys' of undefined" crashes). Uses `routerRegistered` + `routing` flags to survive Vite HMR and same-frame double-emits.
- `HUDScene` is display-only as of Session 7 — it subscribes to `changedata-failureCount` to update the counter and nothing else. The Session 3 placeholder hurricane banner was removed; `CutsceneRouter` + `CutsceneScene` handle the fail flow end-to-end.
- Arcade Physics is enabled globally in `src/index.js` (`physics: { default: 'arcade', arcade: { gravity: { y: 0 } } }`). Only `ScubaDiveGame` currently uses physics (player circle + K-fish containers + overlap callbacks). Other scenes ignore physics at near-zero cost.
- Wrong-order ritual attempts SOFT-BLOCK (assessment session change): stepping on an out-of-order or un-gated ritual trigger opens an in-character "The Ritual resists" dialog and nothing else. The old instant-`'hurricane-fail'` path survives only as the SequenceGuard safety net, unreachable in normal play.
- `src/index.js` sets `render.preserveDrawingBuffer: true` and `fps.forceSetTimeOut: true` so headless preview screenshots capture live WebGL state and Phaser's clock keeps advancing when the tab isn't focused. `window.__game` is exposed as a dev hook for inspection from the preview eval tool. All three are no-ops for normal play.
- Asset preloading is centralized in `src/scenes/BootScene.js`. All sprites, tilesets, cutscene images, BGM, and SFX are loaded there with `this.load.on('loaderror', ...)` so a missing file logs a warning instead of crashing. Every scene that creates characters/tiles uses `if (this.textures.exists(key)) { sprite } else { rectangle }` — the game is fully playable with zero assets loaded.
- Music is managed by `src/systems/MusicManager.js` — exports `playMusic(scene, key, volume)`, `stopMusic(scene)`, and `registerMusicKeepAlive(game)` (called once from `src/index.js`). Tracks current BGM via `game.registry` (`currentMusicKey`, `currentMusicInstance`, `currentMusicVolume`) so room transitions don't restart the overworld theme. Handles browser autoplay lock via a single pending-track `unlocked` listener. The keep-alive resumes the WebAudio context on any gesture/visibility gain (iOS suspends it on lock/calls/app-switch and doesn't reliably resume) and a 4s watchdog resumes a stuck-paused track or rebuilds a dead one — the BGM must always keep looping.
- `src/objects/GenericNPC.js` is a reusable NPC class taking `(scene, tileX, tileY, dialogId, textureKey, fallbackColor)`. Same `isAdjacentTo()` check as Cody/Mermaid. Uses sprite if textureKey loaded, rectangle with fallbackColor otherwise. Shows "!" marker.
- Game is mobile-first. All interactive elements respond to `pointerdown`. Touch buttons are 32x32 (d-pads) or 44x36 (action buttons) in the 256x224 canvas, scaling to ~96px+ physical on phones. On-screen touch buttons render ONLY when `this.sys.game.device.input.touch` is true — desktop gets a small stroked key-hint line instead (`ARROWS move · Z/ENTER talk`, etc.) so buttons never crowd the map where a keyboard exists. Button fill alpha is 0.2 (hit area unaffected by alpha).
- Phaser scale mode: `FIT` with `CENTER_BOTH`. Letterbox bars appear in portrait. There is deliberately NO rotate-to-landscape hint: the canvas is nearly square (256x224), so portrait width-fit is already the best a phone can do — rotating just adds browser chrome (removed in the playtest-notes session; PWA manifest orientation is `any`, not `landscape`, for the same reason).
- PWA: manual manifest (`public/manifest.webmanifest`) + service worker (`public/sw.js`). Friends can install the gh-pages URL via "Add to Home Screen". Service worker uses cache-first strategy for offline play. Bump `CACHE_VERSION` in `sw.js` to force re-cache on deploy.

## Reusable UI Components
Plain JS classes (not Phaser scenes) that wrap a few `scene.add.*` objects. Constructed inside a minigame's `setupGame()` and destroyed automatically when the scene shuts down.

- `src/ui/RhythmBar.js` — note-and-hit-zone rhythm tap UI. Notes spawn from the right and travel toward a green hit zone on the left; `hit()` returns true if the nearest pending note is inside ±150ms. Used by `CokeDrinkGame` and `LullabyGame`. Note: `NOTE_TRAVEL_MS = 1500` is a module-level constant — not configurable per-instance.
- `src/ui/PowerMeter.js` — fillable bar with decay. `add(delta)` bumps the value (negative deltas are clamped to 0), `decay(deltaMs)` drains it (call from `update(time, delta)`), `value` is a plain property (not a getter — would conflict with internal assignments). Supports horizontal (default) and vertical orientation. The fill is green when ≥50% of max, yellow 25–50%, red <25% — so if you want the bar to read "green = good" for something that GROWS toward danger, invert the semantics (store the inverse and call `add(-delta)` on penalty). `MermaidNap` does exactly this: it tracks "sleep level" starting at 100 and subtracts 25 per missed shush, so the bar visually reads "green = asleep (good) → red = awake (lose)". Used by `PipeSmoke` (horizontal, grow-to-win), `MotorboatGame` (vertical, grow-to-win), and `MermaidNap` (horizontal, inverted semantics).

## Key patterns
- Minigame lifecycle: TITLE_CARD → INSTRUCTION → PLAY → EVALUATE → WIN/LOSE (handled by BaseMinigame)
- Scene transitions: `this.scene.start('SceneKey', { data })`
- Cross-scene data: `this.registry.get('key')` / `this.registry.set('key', value)`
- Ritual steps: scenes that extend BaseMinigame and set `isRitual: true` in their level config

## Failure threshold
- 5 failed minigames = hurricane fail cutscene
- Wrong-order ritual attempt = SOFT-BLOCK dialog ("The Ritual resists"), no penalty. The instant-hurricane rule was retired in the assessment session — identical-looking triggers plus fully open rooms made it an unfair full-run wipe.

## Resolution
- Internal: 256×224 (SNES standard)
- pixelArt: true, roundPixels: true
- Tile size: 16×16
- Character sprites: 16×16 (or 16×24 for taller)

## Art strategy
- Sessions 1–7: placeholder rectangles, circles, Phaser graphics primitives only
- Session 8: real sprites replace placeholders; every creation site checks `textures.exists(key)` and falls back to the original rectangle if the asset is missing
- One Cody variant for v1 (CodySelectScene exists as a stub but is disabled)

## Asset inventory (Session 8+)
All assets live under `public/assets/`. BootScene preloads everything; missing files log a warning and fall back to rectangles.

**Sprites** (`sprites/`): captain.png (16x16), cody.png (16x16), cody-werewolf.png, cody-aquaman.png (loaded, currently unused), mermaid-1.png, mermaid-2.png, k-fish-gold.png, k-fish-red.png, bridge-parrot.png, cabin-ghost.png, bartender.png. All on disk. (cody, cody-werewolf, bridge-parrot, bartender came from the Claude Design pack; captain, mermaids, k-fish, cabin-ghost are the Session 8 originals.)
**Tilesets** (`tilesets/`): generic floor/wall/door.png plus per-room variants `<roomId>_{floor,wall,door}.png` for main-deck/bar/galley/bridge/cabin-corridor — `renderRoomTiles()` prefers the per-room key. The per-room tiles are the Claude Design pack (each room visually distinct now). boat-tileset.png is an unused source image (never loaded).
**Cutscenes** (`cutscenes/`): hurricane.png, aquaman.png, victory.png (1152x896, drawn full-screen). All on disk.
**Backgrounds** (`backgrounds/`): bg-coke-drink.png, bg-lullaby.png, bg-pipe-smoke.png (Session 8 originals) plus bg-scuba-dive, bg-dinner-service, bg-motorboat, bg-mermaid-shower, bg-mermaid-nap, and title.png (Claude Design pack) — all 256x224, all on disk. The sprite/bg exists-check fallbacks remain in every scene as a safety net.
**BGM** (`audio/`): bgm-overworld.mp3, bgm-minigame.mp3, bgm-underwater.mp3, bgm-victory.mp3, bgm-fail.mp3 — mono ~80kbps.
**SFX** (`audio/`): sfx-howl.mp3, sfx-splash.mp3, sfx-puff.mp3, sfx-ding.mp3, sfx-buzz.mp3, sfx-hurricane.mp3 — mono ~96kbps (converted from the original WAVs in the Session 10 audio pass). All audio is MP3 (not OGG) for iOS Safari compatibility on the mobile-first target. Total audio payload ~7MB (was ~21MB).

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
**Assessment session complete (post-Session 9).** Full-game assessment ran, then its P0/P1 recommendations were implemented: (1) wrong-order rituals now soft-block with in-character dialogs instead of instant hurricane; ritual triggers render distinctly (red pulsing `!` / gray `?`); (2) the GAME-DESIGN §2 act gate is enforced (act minigame required before its ritual step); (3) live HUD objective + state-aware Cody/galley hints via `src/systems/Objective.js`; (4) de-mash tuning (PipeSmoke puff cooldown, Motorboat SPACE weakest, rhythm games dock a hit on mistimed taps, MermaidNap needs 3/4 shushes + ends when the last noise resolves, MermaidShower visuals derive from the scoring greenZone); (5) MusicManager pending-track fix for the mobile double-BGM unlock race; (6) deploys stamp a unique CACHE_VERSION into dist/sw.js (`scripts/stamp-sw-version.mjs` in predeploy); (7) art hooks pre-wired for the Claude Design asset drop. **The Claude Design art pack has now landed** — 23 PNGs dropped into public/assets: the Cody trio (cody 16x16, cody-werewolf, bartender ghost, bridge-parrot), all 15 per-room tiles (each room now visually distinct: red-checker bar, navy bridge, burgundy cabin, blue-tile galley, plank deck), 5 minigame backgrounds, title.png, and cutscenes/victory.png. HUD text got a black stroke so it stays legible over the now-varied wall art. Verified in-browser: all 5 rooms, scuba background, victory cutscene, zero console load errors. Next: Session 10 — compress audio (~21MB, WAV→OGG), production build, itch.io upload, single HTML file, QR code.

## Sprite fallback conventions
Every character/tile creation uses `if (this.textures.exists(key)) { sprite } else { rectangle }`. Color flashes use `if (obj.setTint) { obj.setTint(color) } else { obj.setFillStyle(color) }` — Sprites have `setTint`, Rectangles have `setFillStyle`. Fallback colors: Player=blue, Cody=green, Mermaids=pink (`0xff69b4`), K-fish gold=yellow, K-fish red=red, Pipe=brown, Coke=red, GenericNPCs=per-instance fallbackColor param.

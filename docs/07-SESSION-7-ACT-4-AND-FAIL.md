# Cody On A Boat — Session 7: Act 4 + Fail State + Victory

> **For the human (you):** This is Session 7 of 10. The biggest single session in the build — by the end of it, **the entire game is playable end-to-end**. Open a fresh Claude Code chat in your `cody-on-a-boat` directory. Copy everything below the `---` line.

---

You are helping me build **Cody On A Boat**. This is **Session 7 of 10** — the most important session. By the end, the game is functionally complete: a player can play through the full pipe → dinner → shower → nap ritual and either win the game or trigger the hurricane fail cutscene. After this session, the remaining work is art, audio, polish, and shipping.

I am not a software engineer — be explicit, ask permission, never delete things without confirming.

## Goal of this session

By the end of this session:
- **LullabyGame** is built. Rhythm-tap to a mermaid lullaby. Reuses RhythmBar. 8 notes, hit 6 to win.
- **MermaidNap** ritual is built. 4 random noise events over 20s. Player taps quickly to shush each. Miss too many → lose. Win = "Cody fell asleep".
- **CutsceneScene** is built. Data-driven: handles three modes:
  - `mode: 'fail'` — screen shake → Cody spin → hurricane → Florida sinks → Aquaman throne → "CODY RULES THE DEEP" → retry button
  - `mode: 'victory'` — black fade → "Cody woke up on the shore." → simple credits scroll → MainMenu
  - (`mode: 'intro'` is a stub for future, don't build)
- **Two placeholder cutscene illustrations** dropped into `public/assets/cutscenes/`: `hurricane.png` and `aquaman.png`. Both are placeholder solid-color PNGs at this stage (256×224 each, drawn with any image tool or generated programmatically with a Node script). Real art swap in Session 8.
- The hurricane placeholder text from Session 3 is **removed**. The real CutsceneScene replaces it.
- Wire-up: `EventBus.on('hurricane-fail', ...)` → `scene.start('CutsceneScene', { mode: 'fail', ... })`. `EventBus.on('victory', ...)` → same with `mode: 'victory'`.
- **Full game playable**: pipe → dinner → shower → nap → victory cutscene. **AND** Full failure path: lose 5 minigames OR do steps out of order → hurricane cutscene.

## Where we are

Sessions 1–6 complete:
- Acts 1, 2, 3 playable.
- 6 of 8 minigames + rituals built.
- Sequence guard works.
- Hurricane fail is currently a placeholder text in HUDScene (we'll replace this).

## Required reading

1. `CLAUDE.md`
2. `docs/GAME-DESIGN.md` — sections 5 (fail cutscene), 6 (victory cutscene), 2 (Act 4 row)
3. `docs/PHASE_LOG.md`
4. `src/scenes/HUDScene.js` (we're removing the placeholder hurricane code from here)
5. `src/scenes/minigames/CokeDrinkGame.js` (your reference for RhythmBar usage in the Lullaby)
6. `src/scenes/minigames/PipeSmoke.js` (your reference for ritual step structure)

## Hard constraints

- **DO NOT modify `BaseMinigame.js`.**
- **DO NOT add npm packages.**
- The placeholder cutscene PNGs are real PNGs in `public/assets/cutscenes/`, NOT base64 strings or generated graphics. Phaser loads them via `this.load.image()`. Two files: `hurricane.png` and `aquaman.png`. They can be solid colors with text written on them — see Task 2.
- The CutsceneScene must reset game state on retry/return-to-menu so the player can play again.
- Lullaby reuses `RhythmBar` from `src/ui/`.

## Tasks for this session

### Task 1: Sanity check + clean state

```bash
git status
git pull
npm run dev
```

Confirm Acts 1–3 still work. Reach `ritualProgress = [1, 2, 3]`. Kill the dev server.

### Task 2: Create placeholder cutscene PNGs

We need two real PNG files for the cutscene art (placeholders for now, real art in Session 8).

Easiest path: ask me to **drop two placeholder PNGs** into `public/assets/cutscenes/`, OR generate them with a tiny Node script. Suggested script (have Claude Code write and run this):

```javascript
// scripts/make-placeholder-cutscenes.mjs
import { createCanvas } from 'canvas';
import fs from 'fs';

function placeholder(filename, color, text) {
  const canvas = createCanvas(256, 224);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 256, 224);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(text, 128, 112);
  fs.writeFileSync(filename, canvas.toBuffer('image/png'));
}

placeholder('public/assets/cutscenes/hurricane.png', '#1a4a6a', 'FLORIDA SINKS');
placeholder('public/assets/cutscenes/aquaman.png',   '#0a2a4a', 'CODY RULES THE DEEP');
```

PROBLEM: this requires installing the `canvas` npm package, which violates "no new npm packages." So **don't go this route.** Instead:

**Recommended:** Tell me (the human) to manually create two 256×224 PNG files using any image tool (even macOS Preview or an online tool like photopea.com). Each is a flat color with one line of text. Save them as `public/assets/cutscenes/hurricane.png` and `public/assets/cutscenes/aquaman.png`. Confirm they exist before continuing.

OR (alternative if I, the human, can't make them right now): write the cutscene to use **Phaser graphics primitives** (a colored rectangle + a Phaser Text object) instead of loaded images. This is uglier but works. Use this fallback if the human can't quickly make the PNGs.

**Document which path you chose** in PHASE_LOG.md so we know what to swap out in Session 8.

### Task 3: BootScene asset preload

Modify `src/scenes/BootScene.js` to preload the cutscene images (if you went the PNG route):

```javascript
preload() {
  this.load.image('cutscene-hurricane', 'assets/cutscenes/hurricane.png');
  this.load.image('cutscene-aquaman', 'assets/cutscenes/aquaman.png');
}
```

If you went the Phaser-graphics fallback, skip this.

### Task 4: LullabyGame

Create `src/scenes/minigames/LullabyGame.js`. Extends BaseMinigame. **Reuses `RhythmBar` from `src/ui/`.**

Behavior:
1. Setup: Cody (green rect) lying on a "bed" (gray rectangle). 2 mermaids (pink rects) on either side, gently bouncing.
2. RhythmBar at the bottom of the screen.
3. Schedule 8 notes at 800ms intervals (slower than CokeDrink — this is a lullaby, gentler tempo).
4. Player taps SPACE / pointerdown to hit. Each hit makes Cody close his eyes a little (tint darker green / scale down slightly).
5. Win at 6/8 hits → Cody is "asleep enough" → win.
6. Lose at < 6/8 → Cody won't sleep → lose.
7. Level config:

```javascript
'lullaby': {
  id: 'lullaby',
  sceneKey: 'LullabyGame',
  instruction: 'SING!',
  location: 'Cabin',
  isRitual: false,
  act: 4,
  config: { beats: 8, requiredHits: 6, noteTravelMs: 1800 },
},
```

### Task 5: MermaidNap ritual

Create `src/scenes/minigames/MermaidNap.js`. Extends BaseMinigame. RITUAL STEP 4.

Behavior:
1. Sequence guard: `assertCanStartRitual(this.game, 4)` — must come after [1,2,3].
2. Setup: dark blue background (it's nighttime). Cody (green rect) lying down with closed-eye dots. 2 mermaids beside him, sleeping (z particles?).
3. Schedule 4 random "noise" events at random times within a 20s window. Each noise:
   - Pick a random source: 'seagull', 'wave', 'mermaid-giggle', 'creak'.
   - Spawn a label "SEAGULL!" / "WAVE!" / etc. at the top of the screen.
   - Start a 2-second "shush window".
   - Player must tap or press SPACE within the 2-second window. Success = noise vanishes peacefully. Failure = Cody's "wakefulness" meter +25.
4. Wakefulness meter: starts at 0, max 100. If it reaches 100, lose ("Cody woke up").
5. After all 4 noises and 20s: if still asleep (wakefulness < 100), win.
6. Win = "Cody fell asleep" → BaseMinigame.win() → because `isRitual: true`, this calls `markRitualStep(4)` → fires the `'victory'` event on EventBus.
7. Level config:

```javascript
'mermaid-nap': {
  id: 'mermaid-nap',
  sceneKey: 'MermaidNap',
  instruction: 'NAP!',
  location: 'Mermaid Grotto',
  isRitual: true,
  ritualStep: 4,
  act: 4,
  config: { numNoises: 4, totalDurationMs: 20000, shushWindowMs: 2000, wakeOnMiss: 25 },
},
```

### Task 6: Add Cabin / Nap location triggers

We need places to trigger Lullaby and Nap. Options:
- Bridge already has Motorboat + Shower from Session 6. Adding 2 more triggers makes it crowded.
- **Recommendation:** add the 5th room, **Cabin Corridor**, if you didn't already in Session 6. Connect it via a door from Main Deck. Put both Lullaby and Nap triggers there.

Update `src/data/rooms.js`:
- Add `cabin-corridor` room.
- Add a door from Main Deck to Cabin Corridor (and back).
- Add triggers in Cabin Corridor for `lullaby` and `mermaid-nap`.

### Task 7: CutsceneScene

Create `src/scenes/CutsceneScene.js`.

```javascript
import Phaser from 'phaser';
import { GameStateManager } from '../systems/GameStateManager.js';

export class CutsceneScene extends Phaser.Scene {
  constructor() { super('CutsceneScene'); }

  init(data) {
    this.mode = data.mode || 'fail';
    this.context = data; // {reason, etc.}
  }

  create() {
    if (this.mode === 'fail') this.playFailCutscene();
    else if (this.mode === 'victory') this.playVictoryCutscene();
  }

  playFailCutscene() {
    // Step 1: black background, screen shake
    this.cameras.main.setBackgroundColor(0x000000);
    this.cameras.main.shake(1000, 0.02);
    // Step 2: spawn a "Cody" rectangle that spins and grows into a hurricane
    const cody = this.add.rectangle(128, 112, 16, 16, 0x40c040);
    this.tweens.add({
      targets: cody,
      angle: 720,
      scaleX: 6,
      scaleY: 6,
      duration: 1500,
      onComplete: () => {
        cody.destroy();
        this.showHurricaneImage();
      },
    });
    // Particle wind effect during the spin
    // (simple: spawn 20 small white circles tweening outward, fade out)
  }

  showHurricaneImage() {
    // If the PNG was loaded:
    const img = this.add.image(128, 112, 'cutscene-hurricane');
    // (or fallback: this.add.rectangle(128,112,256,224,0x1a4a6a) + this.add.text(...))
    this.time.delayedCall(2500, () => {
      img.destroy();
      this.showAquamanImage();
    });
  }

  showAquamanImage() {
    const img = this.add.image(128, 112, 'cutscene-aquaman');
    const text = this.add.text(128, 200, 'CODY RULES THE DEEP. FLORIDA IS NO MORE.', {
      fontSize: '8px', color: '#ffffff', align: 'center', wordWrap: { width: 240 },
    }).setOrigin(0.5);
    // After 3s, show retry button
    this.time.delayedCall(3000, () => {
      const retry = this.add.text(128, 220, '[ RETRY ]', { fontSize: '12px', color: '#ffff00' })
        .setOrigin(0.5).setInteractive({ useHandCursor: true });
      retry.on('pointerdown', () => this.returnToMenu());
      this.input.keyboard.once('keydown-SPACE', () => this.returnToMenu());
      this.input.keyboard.once('keydown-ENTER', () => this.returnToMenu());
    });
  }

  playVictoryCutscene() {
    this.cameras.main.setBackgroundColor(0x000000);
    this.cameras.main.fadeIn(1000, 0, 0, 0);
    const beach = this.add.rectangle(128, 180, 256, 80, 0xefdfa0); // sand
    const sky = this.add.rectangle(128, 60, 256, 120, 0x88c0f0); // sky
    const cody = this.add.rectangle(128, 150, 16, 16, 0x40c040);
    this.add.text(128, 30, 'CODY GOT OFF THE BOAT.', { fontSize: '12px', color: '#ffffff' }).setOrigin(0.5);
    // Credits scroll: simple text moving up
    const credits = this.add.text(128, 240, 'A game for friends.\nThanks for playing.\n\n— Captain Chowder John', {
      fontSize: '8px', color: '#ffffff', align: 'center',
    }).setOrigin(0.5);
    this.tweens.add({ targets: credits, y: -40, duration: 12000, ease: 'Linear', onComplete: () => this.returnToMenu() });
    // Skippable
    this.input.once('pointerdown', () => this.returnToMenu());
    this.input.keyboard.once('keydown-SPACE', () => this.returnToMenu());
  }

  returnToMenu() {
    GameStateManager.reset(this.game);
    // Stop any other running scenes (HUD, OverworldScene, etc.)
    ['OverworldScene', 'HUDScene', 'DialogScene', 'TransitionScene'].forEach(k => {
      if (this.scene.isActive(k)) this.scene.stop(k);
    });
    this.scene.start('MainMenuScene');
  }
}
```

(That's a sketch. Adjust as needed. The key points are: 3-stage fail flow, 2-stage victory flow, retry returns to menu and resets state.)

### Task 8: Wire up the EventBus listeners

In `src/index.js` (or a small `src/systems/CutsceneRouter.js`), set up:

```javascript
import { EventBus } from './systems/EventBus.js';
EventBus.on('hurricane-fail', (data) => {
  // Get the active game instance — Phaser game is created in this file, so it's in scope
  game.scene.getScenes(true).forEach(s => game.scene.stop(s.scene.key));
  game.scene.start('CutsceneScene', { mode: 'fail', context: data });
});
EventBus.on('victory', (data) => {
  game.scene.getScenes(true).forEach(s => game.scene.stop(s.scene.key));
  game.scene.start('CutsceneScene', { mode: 'victory', context: data });
});
```

(Adjust to actual scene-management API if needed.)

**Remove** the placeholder hurricane code in HUDScene from Session 3. The real CutsceneScene replaces it.

### Task 9: Register CutsceneScene + new minigames

Add `LullabyGame`, `MermaidNap`, `CutsceneScene` to the scene list in `src/index.js`.

### Task 10: Full game playtest — both endings

**Win ending:**
1. Fresh game.
2. Cody intro dialog.
3. Bar → CokeDrink → win.
4. Main Deck → Pipe → win. `[1]`
5. Galley → Scuba → win.
6. Galley → Dinner → win. `[1, 2]`
7. Bridge → Motorboat → win.
8. Bridge → Shower → win. `[1, 2, 3]`
9. Cabin Corridor → Lullaby → win.
10. Cabin Corridor → Nap → win. `[1, 2, 3, 4]`
11. Victory cutscene plays. Returns to MainMenu.

**Fail-by-failures ending:**
1. Fresh game.
2. Intentionally lose CokeDrink 5 times in a row.
3. After the 5th loss, hurricane cutscene plays.

**Fail-by-order ending:**
1. Fresh game.
2. Walk to Cabin Corridor. Step on Nap trigger.
3. Sequence guard fires. Hurricane cutscene plays.

All three endings must work for the session to be complete.

## Verification

- [ ] LullabyGame plays correctly with RhythmBar reused.
- [ ] MermaidNap plays correctly with random noise events and shush mechanic.
- [ ] Completing Nap triggers `'victory'` event.
- [ ] Fresh game → full ritual order → victory cutscene → MainMenu.
- [ ] Lose 5 minigames → fail cutscene → MainMenu.
- [ ] Wrong-order ritual attempt → fail cutscene → MainMenu.
- [ ] Retry button on fail cutscene works.
- [ ] Game state resets after every cutscene return.
- [ ] Placeholder cutscene PNGs (or fallback graphics) display correctly.
- [ ] No console errors during the full happy path.
- [ ] Session 3's placeholder hurricane text is REMOVED from HUDScene.

## Before ending the session

### 1. Update `CLAUDE.md`

In Architecture:

```
- CutsceneScene is data-driven by `mode` ('fail' | 'victory'). Both modes end with returnToMenu() which resets all state.
- The hurricane fail and victory triggers are wired in src/index.js (or src/systems/CutsceneRouter.js) — they listen to EventBus events emitted by GameStateManager.
- Placeholder cutscene PNGs live in public/assets/cutscenes/. Real art swap in Session 8.
```

In Current phase:

```
Session 7 complete. THE GAME IS PLAYABLE END-TO-END. All 4 acts complete (8 interactive sequences total). Real fail and victory cutscenes work. Three endings tested: win, lose-by-failures, lose-by-wrong-order. Next: Session 8 — replace all placeholder art with real sprites and add audio.
```

### 2. Update `docs/PHASE_LOG.md`

Big day — add a Session 7 row and a longer notes block summarizing the game state.

### 3. Commit and push

```bash
git add .
git commit -m "Session 7: Act 4 + cutscenes — game is playable end-to-end"
git push
```

### 4. Tell me

"Session 7 complete. **THE GAME IS PLAYABLE END-TO-END WITH PLACEHOLDER ART.** Open `docs/08-SESSION-8-ART-AND-AUDIO.md` when you're ready for the art and audio pass."

## Troubleshooting

**`EventBus` listeners fire multiple times.**
You're registering them in scene `create()` without cleaning up in `shutdown()`. For global ones in `src/index.js`, register exactly once at module load — never inside scene callbacks.

**The fail cutscene plays but the OverworldScene is still visible underneath.**
The active scenes weren't stopped before starting the cutscene. Either iterate and stop them all OR use `this.scene.start('CutsceneScene')` from inside whichever scene was the source — single-scene start replaces the calling scene.

**Victory event fires but cutscene doesn't appear.**
The `'victory'` event listener might be inside a scene that got destroyed. Move the listener to `src/index.js` so it always lives.

**Cutscene PNG isn't loading.**
Verify the path: from the dev server's perspective, `public/assets/cutscenes/hurricane.png` is served at `/assets/cutscenes/hurricane.png`. The Phaser load call is `this.load.image('cutscene-hurricane', 'assets/cutscenes/hurricane.png')` (no leading slash, relative to the public folder).

**Retry button doesn't reset failure counter.**
`GameStateManager.reset(game)` must zero out `failureCount` AND `ritualProgress` AND `completedMinigames`. Verify all three are reset.

**Cabin Corridor door doesn't appear.**
Check the door definition in `rooms.js` for both directions: Main Deck must have a door to cabin-corridor with the correct target spawn coords, AND cabin-corridor must have a door back. Common mistake: only adding one direction.

## What's next

**Session 8 — Art + Audio Pass.** No new mechanics. Replace every colored rectangle and circle with a real pixel sprite. Drop in the real hurricane and Aquaman illustrations. Source CC0 background music and sound effects. Add NPC dialog hints scattered throughout the boat that point at the ritual order. By the end of Session 8 the game should look and sound like a real game, not a programmer art demo.

---

**End of Session 7 instructions. Start with Task 1.**

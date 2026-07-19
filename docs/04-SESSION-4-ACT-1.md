# Cody On A Boat — Session 4: Act 1 (Werewolf Howl + Pipe Ritual)

> **For the human (you):** This is Session 4 of 10. Open a fresh Claude Code chat in your `cody-on-a-boat` directory. Copy everything below the `---` line and paste as your first message.

---

You are helping me build **Cody On A Boat**. This is **Session 4 of 10**. I am not a software engineer — be explicit, ask before running commands or making bulk changes.

## Goal of this session

By the end of this session:
- **CokeDrinkGame** is built. Cody drinks a Coke, his sprite swaps to "werewolf form" (gray rectangle), the moon rises, and 8 howl-prompts march across a rhythm bar. The player taps in the hit window. 6 of 8 hits = win, fewer = lose.
- **PipeSmoke** ritual step is built. Tap to puff. A power meter ticks down between taps. Chain 5 puffs without letting it hit zero. Sequence-guarded as ritual step 1.
- Reusable UI components **`RhythmBar`** and **`PowerMeter`** exist in `src/ui/` and are imported by both Cokeand Pipe.
- The **Bar room** has a Coke trigger zone. The **Main Deck** has a Pipe trigger zone.
- Walking onto the Coke trigger starts CokeDrinkGame. Walking onto the Pipe trigger starts PipeSmoke (only after CokeDrink is complete; otherwise NPC dialog hints "you need to do something first").
- **Act 1 is fully playable** end-to-end with placeholder art.

## Where we are

Sessions 1–3 are complete. We have:
- Project scaffold + GitHub Pages deploy.
- 4 boat rooms with player movement.
- Dialog system, HUD, BaseMinigame, GameStateManager, SequenceGuard, EventBus, PlaceholderGame, all wired into the overworld.

## Required reading

1. `CLAUDE.md`
2. `docs/GAME-DESIGN.md` — section 2 "Acts and content" (Act 1 row), section 7 (architecture)
3. `docs/PHASE_LOG.md`
4. `src/scenes/minigames/BaseMinigame.js` — understand the lifecycle before extending it
5. `src/data/levels.js` and `src/data/rooms.js` — understand how to add entries
6. `src/scenes/OverworldScene.js` — understand how trigger zones launch minigames

## Hard constraints

- **DO NOT modify `BaseMinigame.js`.** If a minigame needs something the base doesn't provide, build it inside the minigame file.
- **DO NOT add npm packages.**
- The `PlaceholderGame` from Session 3 stays in the codebase — don't delete it. It's our fallback test scene.
- Use `RhythmBar` and `PowerMeter` as **reusable components in `src/ui/`** because they will be reused in Sessions 5–7.
- Sequence-guard the Pipe ritual via `SequenceGuard.assertCanStartRitual(this.game, 1)` BEFORE starting the scene.
- Mobile input first. Every tap target must work with `pointerdown` AND a keyboard fallback.

## Tasks for this session

### Task 1: Sanity check

```bash
git status
git pull
npm run dev
```

Confirm Session 3 still works: walk to Cody, talk, see PlaceholderGame, win and lose. Kill the dev server.

### Task 2: Create reusable UI components

#### `src/ui/RhythmBar.js`

A class (not a Phaser scene — a wrapper around Phaser objects you add to a scene).

```javascript
export class RhythmBar {
  constructor(scene, x, y, width, height) { ... }
  // Schedule a "note" to appear at time tMs (relative to start), at lane laneIndex (0..3 etc).
  addNote(tMs, lane = 0) { ... }
  start() { ... }  // begins playback / animation
  // Player calls hit() when they tap during play. Returns true if a note was in the hit window.
  hit() { ... }
  destroy() { ... }
}
```

Implementation: a horizontal bar drawn with `scene.add.graphics()`. A vertical "hit zone" line on the left. Notes are small rectangles that tween from the right edge to the left edge over a fixed travel time (e.g., 1500ms). When a note crosses the hit zone, the player has a window of ±150ms to tap. Use the scene's clock (`scene.time.now`) for timing — don't use `Date.now()` because Phaser pauses with the scene.

For the visual: hit zone is a green vertical bar, notes are red squares 8×8, the travel area is the rest of the bar in dark gray. Hit successful = brief white flash on that note, miss = note turns dark red.

#### `src/ui/PowerMeter.js`

```javascript
export class PowerMeter {
  constructor(scene, x, y, width, height, opts = {}) { ... }
  // Adjust the current value by delta (clamped to 0..max)
  add(delta) { ... }
  // Per-frame decay: call this from the scene's update() with deltaMs
  decay(deltaMs) { ... }
  get value() { ... }
  destroy() { ... }
}
```

Visual: a vertical or horizontal bar (configurable via `opts.orientation`). A green fill for the current value, with a red zone at the bottom (e.g., 0–25% of max). Above the red zone is yellow, top is bright green. Default max is 100, default decay rate is configurable in opts.

Both files live in `src/ui/`. Both export named classes.

### Task 3: CokeDrinkGame

Create `src/scenes/minigames/CokeDrinkGame.js`. Extends BaseMinigame.

Behavior:
1. `setupGame()` runs after the title card transition.
2. Phase A (drink, ~1s): show Cody (green rect) center, a Coke can (red rect) above his head. Brief animation: can tilts down, Cody flashes white, Coke disappears.
3. Phase B (transformation, ~1s): Cody's rectangle tints from green → gray. Two small red rectangles appear on top of him (eyes). A white circle (the moon) rises from the bottom of the screen to the top-right.
4. Phase C (rhythm play, ~6s): a `RhythmBar` instance appears at the bottom of the screen. 8 notes are scheduled at 750ms intervals. The first note arrives at the hit zone at ~1000ms. Player taps anywhere on the screen (or presses SPACE) to call `rhythmBar.hit()`.
5. Visual feedback: each successful hit flashes the moon white and increments a hit counter shown in the top-right. Each miss flashes Cody red.
6. After the 8th note has either been hit or passed, run `evaluate()`:
   - hits >= 6 → call `this.win()`
   - hits < 6 → call `this.lose()`

Read the level config from `this.levelConfig.config` and use defaults: `beats: 8, requiredHits: 6, noteTravelMs: 1500`.

**Add to `src/data/levels.js`:**

```javascript
'coke-drink': {
  id: 'coke-drink',
  sceneKey: 'CokeDrinkGame',
  instruction: 'DRINK!',
  location: 'Ship Bar',
  isRitual: false,
  act: 1,
  config: { beats: 8, requiredHits: 6, noteTravelMs: 1500 },
},
```

### Task 4: PipeSmoke ritual

Create `src/scenes/minigames/PipeSmoke.js`. Extends BaseMinigame. This is RITUAL STEP 1.

Behavior:
1. Before `setupGame()` runs, the OverworldScene must call `SequenceGuard.assertCanStartRitual(this.game, 1)`. If it returns false, the scene start is aborted (the hurricane fail event is already emitted).
2. `setupGame()`: show Cody (green rect) holding the pipe (a small brown rect at his mouth). Show a `PowerMeter` labeled "PIPE LIT" with current value 100, max 100, decay rate 25 per second (so it drains in 4 seconds if untouched).
3. Player taps screen / presses SPACE to "puff": power meter `+30`, a small white circle (smoke ring) spawns at Cody's mouth and rises and fades. Increment a "puffsThisSession" counter shown in the top-right ("Puffs: 0/5").
4. In `update()`, call `powerMeter.decay(deltaMs)`.
5. If `powerMeter.value <= 0`, lose: `this.lose()`.
6. If puffs >= 5, win: `this.win()`. (This is the ritual step, so `markRitualStep(1)` is called by BaseMinigame.win() because of `isRitual: true`.)

**Add to `src/data/levels.js`:**

```javascript
'pipe-smoke': {
  id: 'pipe-smoke',
  sceneKey: 'PipeSmoke',
  instruction: 'PUFF!',
  location: 'Main Deck',
  isRitual: true,
  ritualStep: 1,
  act: 1,
  config: { puffsRequired: 5, puffPower: 30, decayPerSec: 25 },
},
```

### Task 5: Trigger zones in rooms.js

Open `src/data/rooms.js`. Add a new field to room objects: `triggers`. Each trigger is an object like:

```javascript
{ x: 8, y: 7, levelId: 'coke-drink' }
```

Add to room `bar`: a trigger at some interior tile for `coke-drink`.
Add to room `main-deck`: a trigger at some interior tile for `pipe-smoke`.

Visual: in OverworldScene, when rendering a room, also draw a yellow `!` text at each trigger tile. Save the trigger list on `this.triggers`.

### Task 6: OverworldScene trigger handling

In `OverworldScene.handleMove()` (or in a post-move check), after a successful tile move check:

```javascript
const trigger = this.triggers.find(t => t.x === this.player.tileX && t.y === this.player.tileY);
if (trigger) {
  this.startMinigameForLevel(trigger.levelId);
}
```

Implement `startMinigameForLevel(levelId)`:

```javascript
const level = LEVELS[levelId];
if (!level) return;
// If it's a ritual step, sequence-guard first
if (level.isRitual) {
  if (!assertCanStartRitual(this.game, level.ritualStep)) {
    // Hurricane fail event already emitted; the global handler will play the fail flow
    return;
  }
}
this.scene.start('TransitionScene', {
  instruction: level.instruction,
  location: level.location,
  nextSceneKey: level.sceneKey,
  nextSceneData: {
    levelConfig: level,
    returnSceneKey: 'OverworldScene',
    returnSceneData: { roomId: this.currentRoom.id, spawnX: this.player.tileX, spawnY: this.player.tileY - 1 }, // spawn back one tile away
  },
});
```

The "spawn back one tile" trick prevents the player from immediately stepping back onto the trigger after winning.

### Task 7: Update Cody dialog (hint about ritual order)

In `src/data/dialogs.js`, add a new dialog the user can re-read after Session 1's intro:

```javascript
'cody-hint-1': {
  speaker: 'Cody',
  lines: [
    'I keep thinking about the ritual.',
    'Pipe first. Always pipe first.',
    'You will know when it is time.',
  ],
},
```

In OverworldScene, after the user has talked to Cody once (track this on the registry: `talkedToCody: true`), subsequent interactions show `cody-hint-1` instead of `cody-intro`.

### Task 8: Register new scenes

Add `CokeDrinkGame` and `PipeSmoke` to the scene list in `src/index.js`. Keep `PlaceholderGame` registered too.

### Task 9: Manual playtest

1. Start the game. Walk to Cody. Talk. (No more direct minigame trigger from dialog — dialog is just narrative now.)
2. Walk to the Bar (through the door). Step onto the Coke trigger (yellow `!`). The title card "DRINK!" / "Ship Bar" appears. CokeDrinkGame starts.
3. Tap in rhythm. Hit at least 6 of 8 notes → "WIN!" → return to Bar.
4. Walk back to Main Deck. Step onto the Pipe trigger. Title card "PUFF!" / "Main Deck". PipeSmoke starts.
5. Tap to puff 5 times before the meter empties → win → return to Main Deck. `ritualProgress` is now `[1]` (verify in browser console: `game.registry.get('ritualProgress')`).
6. Try to step on the Pipe trigger again. The level no longer triggers (because it's already been completed — add a check for `completedMinigames.includes(levelId)` in `startMinigameForLevel`).
7. Lose CokeDrinkGame intentionally a few times. Verify failure counter increments. Verify after 5 total failures the placeholder hurricane appears.

## Verification

- [ ] CokeDrinkGame is reachable via the Bar trigger and plays end-to-end.
- [ ] Hitting 6+ of 8 notes wins; fewer loses.
- [ ] PipeSmoke is reachable via the Main Deck trigger.
- [ ] Pipe needs 5 puffs before the meter drains, and tapping refills the meter.
- [ ] Pipe sequence-guards: if you somehow trigger it before doing the Coke (you can't right now because we removed the dialog→minigame jump, but if you re-add the trigger to a room you haven't visited, the guard should activate). Test this by putting a temporary "pipe-smoke" trigger somewhere unreachable and ensure the guard wouldn't be a problem normally — the more important guard test comes in Session 5 when ritual step 2 exists.
- [ ] Completing a minigame marks it complete; re-stepping on the trigger doesn't re-launch.
- [ ] Failure counter still increments correctly.
- [ ] Hurricane placeholder still triggers at 5 failures.
- [ ] `RhythmBar` and `PowerMeter` are imported only from `src/ui/` (no inline duplicates in the minigame files).
- [ ] No console errors.

## Before ending the session

### 1. Update `CLAUDE.md`

Add a section "## Reusable UI Components" with:

```
- src/ui/RhythmBar.js — note-and-hit-zone rhythm tap UI. Used by CokeDrinkGame; will be reused by LullabyGame.
- src/ui/PowerMeter.js — fillable bar with decay. Used by PipeSmoke; will be reused by MotorboatGame.
```

In Architecture, add:

```
- Trigger zones live in rooms.js as a `triggers` array on each room. OverworldScene checks for trigger overlap after every move. Sequence-guarded levels use SequenceGuard.assertCanStartRitual before launching.
- Once a minigame is in completedMinigames, its trigger is dormant. To re-test a minigame, manually clear it from registry via the dev console.
```

In Current phase:

```
Session 4 complete. Act 1 playable: CokeDrink (werewolf rhythm) and PipeSmoke (ritual step 1) work end-to-end with placeholder visuals. RhythmBar and PowerMeter UI components ready for reuse. Next: Session 5 — Act 2 (ScubaDive K-fish + Dinner Service ritual).
```

### 2. Update `docs/PHASE_LOG.md`

Add a Session 4 row and a notes block.

### 3. Commit and push (with my OK)

```bash
git add .
git commit -m "Session 4: Act 1 — CokeDrink + PipeSmoke + RhythmBar + PowerMeter"
git push
```

### 4. Confirm complete

"Session 4 complete. Open `docs/05-SESSION-5-ACT-2.md` when you're ready."

## Troubleshooting

**RhythmBar notes don't move smoothly.**
You probably moved them in `update()` with a delta calculation. Use `scene.tweens.add({ targets: noteRect, x: hitZoneX, duration: noteTravelMs, ease: 'Linear' })` instead — Phaser tweens are smoother.

**Player can keep tapping during PipeSmoke after winning.**
Set `this.state = 'WIN'` early in your win path so further tap handlers ignore.

**Sequence guard blocks a ritual step that should be allowed.**
`expectedStep = ritualProgress.length + 1`. So if `ritualProgress = []`, expected = 1, only step 1 allowed. Verify the SequenceGuard logic matches this.

**Hurricane placeholder fires immediately on first failure.**
You're checking `>=` somewhere instead of `===`, or `FAILURE_THRESHOLD` is set to 1. Confirm the constant.

**Triggers fire while walking through them, then lock the player out.**
Add the "spawn one tile away" trick when returning from a minigame, OR mark the level complete inside `markMinigameComplete` before returning.

## What's next

**Session 5 — Act 2.** ScubaDiveGame (top-down underwater swimming, collect 10 golden K-shaped fish, avoid red ones) and DinnerService (3 courses, pick the absurd Michelin option each time) with sequence guard for ritual step 2. We'll also test that the sequence guard correctly blocks attempts to skip ahead.

---

**End of Session 4 instructions. Start with Task 1.**

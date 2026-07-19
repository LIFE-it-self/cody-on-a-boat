# Cody On A Boat — Session 3: Dialog + Minigame Shell

> **For the human (you):** This is Session 3 of 10. Open a fresh Claude Code chat in your `cody-on-a-boat` directory. Copy everything below the `---` line and paste as your first message.

---

You are helping me build **Cody On A Boat**, a browser-based pixel-art mini-RPG in Phaser 3. This is **Session 3 of 10**. I am not a software engineer — be explicit, ask permission before running commands or making changes.

## Goal of this session

By the end of this session:
- A **Cody NPC** (green rectangle) stands on Main Deck. Walking next to him and pressing a button starts a dialog.
- A **DialogScene** runs as a parallel scene with typewriter text, advances on tap/keypress.
- A **HUDScene** runs as a parallel scene showing the failure counter and the current objective text.
- A **BaseMinigame** abstract scene exists with the lifecycle TITLE_CARD → INSTRUCTION → PLAY → EVALUATE → WIN/LOSE.
- A **PlaceholderGame** extends BaseMinigame with a "press space to win" body, used to test the loop.
- A **GameStateManager** tracks `ritualProgress`, `failureCount`, `completedMinigames` on the Phaser game registry.
- A **SequenceGuard** can validate ritual order (currently just a stub — used in Session 4).
- An **EventBus** lets scenes talk to each other.
- The full loop **works**: walk to Cody → press talk → dialog → finish → minigame title card → minigame → win → return to overworld → failure counter still 0 → repeat. Lose on purpose 5 times → temporary "HURRICANE!" placeholder text appears (real cutscene comes in Session 7).

## Where we are

Sessions 1 and 2 are complete. The repo has:
- Working Phaser 3 + Vite project, deployed to GitHub Pages.
- Boot, MainMenu, Overworld scenes.
- 4 boat rooms with player movement, doors, and touch buttons.

## Required reading

1. `CLAUDE.md`
2. `docs/GAME-DESIGN.md` (especially sections 7 "Tech stack and architecture" and 8 "Resolution")
3. `docs/PHASE_LOG.md`

## Hard constraints

- **No new npm packages.**
- **`BaseMinigame.js` is sacred** — once written this session, no minigame file modifies it. Future sessions only EXTEND it.
- **HUD and Dialog are parallel scenes**, not embedded objects in OverworldScene. Use `this.scene.launch('HUDScene')` and `this.scene.launch('DialogScene', { ...data })`.
- **All state goes through GameStateManager**, never directly into class fields that are scene-specific.
- **Failure threshold is 5**, not 3.
- **Mobile-first input.** Every input handler also responds to touch.

## Tasks for this session

Pause and ask before running terminal commands. Show diffs before bulk file changes.

### Task 1: Sanity check

```bash
git status
git pull
npm run dev
```

Confirm Session 2's overworld still works. Walk through all 4 rooms. Once confirmed, kill the dev server.

### Task 2: Create the systems folder

#### `src/systems/EventBus.js`

A tiny module that exports a single shared `Phaser.Events.EventEmitter`. Other modules import it and call `EventBus.emit('eventName', data)` and `EventBus.on('eventName', handler)`. Used for cross-scene events that don't fit cleanly into scene start/stop data flow.

```javascript
import Phaser from 'phaser';
export const EventBus = new Phaser.Events.EventEmitter();
```

#### `src/systems/GameStateManager.js`

A class with static methods that read/write the Phaser registry. The registry is a key/value store on `game.registry` that all scenes share.

Required methods:
- `init(game)` — called once from `BootScene.create()`. Sets default values on the registry: `ritualProgress: []`, `failureCount: 0`, `completedMinigames: []`, `selectedCodyVariant: 'default'`, `currentAct: 1`.
- `getState(game)` — returns an object with all current state.
- `markMinigameComplete(game, levelId)` — pushes to `completedMinigames`.
- `recordFailure(game)` — increments `failureCount`. Returns the new count. If new count >= 5, emits `'hurricane-fail'` on EventBus.
- `markRitualStep(game, stepNumber)` — pushes to `ritualProgress`. If `ritualProgress.length === 4`, emits `'victory'` on EventBus.
- `reset(game)` — resets all values back to defaults.

The constant `5` for failure threshold should be a named constant in the file: `export const FAILURE_THRESHOLD = 5;`.

#### `src/systems/SequenceGuard.js`

```javascript
import { EventBus } from './EventBus.js';
import { GameStateManager } from './GameStateManager.js';

// Returns true if the player is allowed to start the given ritual step.
// If not, immediately emits 'hurricane-fail' and returns false.
export function assertCanStartRitual(game, stepNumber) {
  const state = GameStateManager.getState(game);
  // Ritual steps must be done in order 1,2,3,4. The expected next step is ritualProgress.length + 1.
  const expectedStep = state.ritualProgress.length + 1;
  if (stepNumber !== expectedStep) {
    EventBus.emit('hurricane-fail', { reason: 'wrong-ritual-order', attempted: stepNumber, expected: expectedStep });
    return false;
  }
  return true;
}
```

### Task 3: BootScene init

Modify `src/scenes/BootScene.js` so that in its `create()` method, BEFORE transitioning to MainMenuScene, it calls `GameStateManager.init(this.game)`. This guarantees the registry has the right defaults from the very beginning.

### Task 4: HUDScene

Create `src/scenes/HUDScene.js`:

- Key: `'HUDScene'`. Runs in parallel with OverworldScene and minigame scenes.
- In `create()`:
  - Top-left: text showing `"Failures: 0/5"`. Updates whenever `failureCount` changes (subscribe to EventBus or to `this.registry.events.on('changedata-failureCount', ...)`).
  - Top-right: text showing `"Objective: Find Cody"` (will be dynamic later).
  - Both texts use a simple Phaser default font, 8px size, color 0xffffff.
- In `update()` or via registry events, refresh whenever state changes.

The HUD should NOT consume input — it only displays. It runs at depth 1000 (top of everything).

### Task 5: DialogScene

Create `src/scenes/DialogScene.js`:

- Key: `'DialogScene'`. Launched as parallel scene from OverworldScene when the player interacts with an NPC.
- Receives data on init: `{ lines: string[] }` — an array of dialog lines to show one at a time.
- In `create()`:
  - Draw a translucent black rectangle across the bottom of the screen (a dialog box, ~64px tall).
  - Add a Phaser text inside it, starting empty.
  - Use a typewriter effect: every ~30ms, append one character of the current line until the full line is shown.
  - Once the full line is shown, wait for `pointerdown` or any key press to advance to the next line.
  - When the last line is finished and the user advances, emit `'dialog-complete'` on EventBus and call `this.scene.stop()`.
- The DialogScene should be on top of OverworldScene (depth 500).

### Task 6: TransitionScene

Create `src/scenes/TransitionScene.js`:

- Key: `'TransitionScene'`. Used to show the title card before each minigame.
- Receives data on init: `{ instruction: string, location: string, nextSceneKey: string, nextSceneData?: object }`.
- In `create()`:
  - Black background.
  - Center: large text with the instruction word ("DRINK!", "PUFF!", "DIVE!").
  - Below: smaller text with the location ("Ship Bar", "Main Deck").
  - After 2 seconds (`this.time.delayedCall(2000, ...)`), `this.scene.start(nextSceneKey, nextSceneData)`.
- Pass-through: pressing space or tapping skips the wait and transitions immediately.

### Task 7: BaseMinigame

Create `src/scenes/minigames/BaseMinigame.js`. This is the abstract base class that every real minigame extends.

Important: write this carefully. **It will not be modified again** in any future session. Every minigame must work by extending it.

The class should:

```javascript
import Phaser from 'phaser';
import { GameStateManager } from '../../systems/GameStateManager.js';
import { EventBus } from '../../systems/EventBus.js';

export class BaseMinigame extends Phaser.Scene {
  constructor(key) {
    super(key);
    this.state = 'IDLE';  // IDLE → PLAY → EVALUATE → WIN/LOSE
  }

  // Subclasses must override these:
  setupGame() { /* called when state becomes PLAY. Subclass creates sprites, listens to input, etc. */ }
  evaluate() { /* called by subclass when the game ends. Subclass calls this.win() or this.lose(). */ }

  // Standard lifecycle helpers (do not override):
  init(data) {
    this.levelConfig = data.levelConfig || {};  // from levels.js
    this.returnSceneKey = data.returnSceneKey || 'OverworldScene';
    this.returnSceneData = data.returnSceneData || {};
  }

  create() {
    // Background
    this.cameras.main.setBackgroundColor(0x000020);

    // Hand off to the play state immediately (transition + title card already happened in TransitionScene)
    this.state = 'PLAY';
    this.setupGame();
  }

  win() {
    if (this.state === 'WIN' || this.state === 'LOSE') return;
    this.state = 'WIN';
    GameStateManager.markMinigameComplete(this.game, this.levelConfig.id);
    if (this.levelConfig.isRitual) {
      GameStateManager.markRitualStep(this.game, this.levelConfig.ritualStep);
    }
    // Brief "WIN!" overlay then return
    this.showResultOverlay('WIN!', 0x40c040, () => {
      this.scene.start(this.returnSceneKey, this.returnSceneData);
    });
  }

  lose() {
    if (this.state === 'WIN' || this.state === 'LOSE') return;
    this.state = 'LOSE';
    const newCount = GameStateManager.recordFailure(this.game);
    this.showResultOverlay('LOSE', 0xc04040, () => {
      // If recordFailure already triggered hurricane via EventBus, the listener handles it
      // Otherwise, return to overworld
      this.scene.start(this.returnSceneKey, this.returnSceneData);
    });
  }

  showResultOverlay(text, color, onComplete) {
    const overlay = this.add.rectangle(128, 112, 256, 224, 0x000000, 0.6).setDepth(900);
    const label = this.add.text(128, 112, text, { fontSize: '24px', color: '#ffffff' }).setOrigin(0.5).setDepth(901);
    this.time.delayedCall(1200, () => { overlay.destroy(); label.destroy(); onComplete(); });
  }
}
```

This file is the contract. Subclasses fill in `setupGame()` and call `this.win()` / `this.lose()` from inside.

### Task 8: PlaceholderGame

Create `src/scenes/minigames/PlaceholderGame.js`. Extends BaseMinigame.

```javascript
import { BaseMinigame } from './BaseMinigame.js';

export class PlaceholderGame extends BaseMinigame {
  constructor() { super('PlaceholderGame'); }
  setupGame() {
    this.add.text(128, 80, 'Placeholder', { fontSize: '16px', color: '#ffffff' }).setOrigin(0.5);
    this.add.text(128, 110, 'Press SPACE = win', { fontSize: '10px', color: '#88ff88' }).setOrigin(0.5);
    this.add.text(128, 130, 'Press X = lose', { fontSize: '10px', color: '#ff8888' }).setOrigin(0.5);
    // Tap support: top half of screen = win, bottom half = lose
    this.input.on('pointerdown', (p) => { p.y < 112 ? this.win() : this.lose(); });
    this.input.keyboard.on('keydown-SPACE', () => this.win());
    this.input.keyboard.on('keydown-X', () => this.lose());
  }
}
```

### Task 9: Levels registry

Create `src/data/levels.js`:

```javascript
export const LEVELS = {
  'placeholder': {
    id: 'placeholder',
    sceneKey: 'PlaceholderGame',
    instruction: 'TEST!',
    location: 'Anywhere',
    isRitual: false,
    act: 0,
    config: {},
  },
  // More entries added in Sessions 4–7
};
```

Export it. Future sessions add entries here without touching anything else.

### Task 10: Dialogs registry

Create `src/data/dialogs.js`:

```javascript
export const DIALOGS = {
  'cody-intro': {
    speaker: 'Cody',
    lines: [
      'Captain. We need to talk.',
      'I cannot leave this boat.',
      'There is a ritual. Pipe. Dinner. Shower. Nap.',
      'Help me. In that order.',
    ],
  },
  // More dialogs added later
};
```

### Task 11: Cody NPC object

Create `src/objects/Cody.js`. A simple NPC class that places a green 16×16 rectangle at given tile coords, exposes its tile position, and has an `interact()` method that the scene can call.

```javascript
import { TILE_SIZE, COLORS } from '../constants.js';

export class Cody {
  constructor(scene, tileX, tileY, dialogId) {
    this.scene = scene;
    this.tileX = tileX;
    this.tileY = tileY;
    this.dialogId = dialogId;
    this.sprite = scene.add.rectangle(
      tileX * TILE_SIZE + TILE_SIZE / 2,
      tileY * TILE_SIZE + TILE_SIZE / 2,
      TILE_SIZE, TILE_SIZE, COLORS.CODY
    );
    this.sprite.setDepth(9);
    // "!" marker above his head, to signal interactable
    this.marker = scene.add.text(
      tileX * TILE_SIZE + TILE_SIZE / 2,
      tileY * TILE_SIZE - 4,
      '!',
      { fontSize: '10px', color: '#ffff00' }
    ).setOrigin(0.5).setDepth(11);
  }

  isAdjacentTo(playerTileX, playerTileY) {
    const dx = Math.abs(this.tileX - playerTileX);
    const dy = Math.abs(this.tileY - playerTileY);
    return (dx + dy) === 1;
  }
}
```

### Task 12: Wire everything into OverworldScene

Open `src/scenes/OverworldScene.js`. Add:

1. **HUD launch:** in `create()`, if HUDScene isn't already running, `this.scene.launch('HUDScene')`.
2. **Cody NPC** in Main Deck only: when `roomId === 'main-deck'`, instantiate a Cody at (e.g.) tile (8, 6) with `dialogId: 'cody-intro'`. Store him in `this.npcs = [cody]`.
3. **Interact key:** Listen for `keydown-Z` and `keydown-ENTER` plus a touch button labeled "TALK" added near the existing direction buttons. When pressed, check if any NPC `isAdjacentTo(player.tileX, player.tileY)`. If yes, look up the dialog from `DIALOGS[npc.dialogId]` and `this.scene.launch('DialogScene', { lines: dialog.lines })`. Pause this scene during dialog if you want, or just let it run (the player can keep walking but the dialog overlay stays — your call, document the choice).
4. **After dialog completes:** Listen on EventBus for `'dialog-complete'`. The first time it fires while talking to Cody, transition to the placeholder minigame: `this.scene.start('TransitionScene', { instruction: 'TEST!', location: 'Test Room', nextSceneKey: 'PlaceholderGame', nextSceneData: { levelConfig: LEVELS.placeholder, returnSceneKey: 'OverworldScene', returnSceneData: { roomId: 'main-deck', spawnX: 8, spawnY: 7 } } })`. Make sure to **unsubscribe** the event listener so it doesn't fire on future dialogs.

### Task 13: Hurricane fail listener

In `src/index.js` (or a small new file `src/systems/FailHandler.js` imported from index.js), set up a global listener:

```javascript
import { EventBus } from './systems/EventBus.js';
EventBus.on('hurricane-fail', (data) => {
  console.log('Hurricane fail:', data);
  // For now, just log. Real cutscene comes in Session 7.
  // Display a temporary alert text in HUDScene? Or just rely on the console for now.
  // Recommendation: have HUDScene listen too and display "HURRICANE!" centered for 2 seconds, then reset state and return to MainMenu.
});
```

Have HUDScene subscribe to `'hurricane-fail'` and display a centered red "HURRICANE! (placeholder)" text for 2s, then `GameStateManager.reset(this.game)` and `this.scene.start('MainMenuScene')` (also stop OverworldScene). This is the temporary scaffolding for the real fail cutscene.

### Task 14: Register all the new scenes

Open `src/index.js` and add the new scenes to the Phaser config:

```javascript
import { BootScene } from './scenes/BootScene.js';
import { MainMenuScene } from './scenes/MainMenuScene.js';
import { OverworldScene } from './scenes/OverworldScene.js';
import { HUDScene } from './scenes/HUDScene.js';
import { DialogScene } from './scenes/DialogScene.js';
import { TransitionScene } from './scenes/TransitionScene.js';
import { PlaceholderGame } from './scenes/minigames/PlaceholderGame.js';
// scene: [BootScene, MainMenuScene, OverworldScene, HUDScene, DialogScene, TransitionScene, PlaceholderGame]
```

## Verification

**All** of these must be true:

- [ ] Boot → MainMenu still works.
- [ ] Start → Main Deck. Cody (green square with `!`) is visible.
- [ ] Walk next to Cody. Press Z or Enter (or the new TALK touch button) → dialog box appears at the bottom.
- [ ] Dialog text types out one character at a time. Tap or press a key to advance lines.
- [ ] After the last dialog line, the screen transitions to a black title card showing "TEST!" / "Test Room".
- [ ] After 2s (or skip with space), PlaceholderGame loads.
- [ ] Press SPACE → "WIN!" overlay → return to Main Deck. Failures still 0.
- [ ] Repeat: walk to Cody → talk → minigame → press X → "LOSE" overlay → return to Main Deck. Failures = 1.
- [ ] Lose 5 times total. After the 5th loss, the HUD flashes "HURRICANE! (placeholder)" red text and after 2s the game returns to MainMenuScene with state reset (failures back to 0 if you start over).
- [ ] HUDScene shows "Failures: N/5" updating in real-time.
- [ ] No console errors at any point.
- [ ] Touch input still works in Chrome mobile emulation: direction buttons, TALK button, tap-to-advance dialog, tap top/bottom in PlaceholderGame.

If any check fails, fix before ending the session.

## Before ending the session

### 1. Update `CLAUDE.md`

In Architecture, add:

```
- BaseMinigame.js is the contract for all minigames. NEVER modify it from a minigame file. Subclasses override setupGame() and call this.win() / this.lose().
- Failure threshold lives in GameStateManager.js as FAILURE_THRESHOLD (currently 5).
- Hurricane fail is currently a placeholder in HUDScene. Real cutscene comes in Session 7.
- DialogScene and HUDScene are PARALLEL scenes (launched, not started). They run on top of gameplay scenes.
```

In Current phase:

```
Session 3 complete. Dialog system, HUD, BaseMinigame, GameStateManager, SequenceGuard, EventBus, PlaceholderGame all wired. Full overworld → dialog → minigame → result loop works. Hurricane fail is placeholder text. Next: Session 4 — Act 1 real content (CokeDrink werewolf rhythm + Pipe Smoke ritual).
```

### 2. Update `docs/PHASE_LOG.md`

```
| 3 | YYYY-MM-DD | Dialog + Minigame Shell | ✓ Complete | (deviations) | (open issues) |
```

Notes section: list every file you created with a one-line purpose.

### 3. Commit and push

```bash
git add .
git commit -m "Session 3: dialog system, minigame shell, placeholder loop"
git push
```

Wait for my OK before committing.

### 4. Confirm we're done

Tell me: "Session 3 complete. Open `docs/04-SESSION-4-ACT-1.md` when you're ready."

## Troubleshooting

**`this.scene.launch('HUDScene')` launches HUD multiple times when changing rooms.**
Check `this.scene.isActive('HUDScene')` before launching, or only launch once from MainMenuScene's Start handler.

**Dialog text shows all at once instead of typewriter.**
The typewriter timer (`this.time.addEvent` with delay 30) probably wasn't created. Check that `setupTypewriter` runs in `create()`.

**`hurricane-fail` listener fires multiple times.**
EventBus listeners persist across scene restarts. Always `EventBus.off('hurricane-fail', handler)` in `shutdown()` if added in a scene.

**Clicking the TALK button also triggers dialog advance immediately.**
The pointerdown event from the button bubbles to the new DialogScene. Add a 1-frame delay with `this.time.delayedCall(50, () => ...)` or stop event propagation.

**Player can keep walking during dialog and trigger another dialog.**
If you chose to keep OverworldScene active during dialog, set a flag `this.dialogActive = true` and check it before allowing interact, or pause OverworldScene with `this.scene.pause()` when launching DialogScene and resume on `'dialog-complete'`.

## What's next

**Session 4 — Act 1: Werewolf Howl + Pipe Ritual.** We'll build the first real minigame (CokeDrink — Cody drinks a Coke, becomes a werewolf, the player taps in rhythm to howl) and the first ritual step (PipeSmoke — chain 5 puffs without letting it go out). We'll create reusable RhythmBar and PowerMeter UI components since they'll be used by other minigames too.

---

**End of Session 3 instructions. Start with Task 1.**

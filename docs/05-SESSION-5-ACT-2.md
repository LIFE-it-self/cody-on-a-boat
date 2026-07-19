# Cody On A Boat — Session 5: Act 2 (K-Fish Scuba + Dinner Ritual)

> **For the human (you):** This is Session 5 of 10. Open a fresh Claude Code chat in your `cody-on-a-boat` directory. Copy everything below the `---` line and paste as your first message.

---

You are helping me build **Cody On A Boat**. This is **Session 5 of 10**. I am not a software engineer — be explicit, ask permission for commands and bulk changes.

## Goal of this session

By the end of this session:
- **ScubaDiveGame** is built. Cody (a green circle here, since he's swimming) navigates an underwater scene from a top-down view. Golden K-shaped fish spawn and drift. Player swims into them to collect (target: 10 in 30s). Red K-shaped fish are obstacles — touching one costs a "lives" point (3 lives → lose).
- **DinnerService** ritual is built. 3 courses. Each course shows 3 buttons with absurd menu options. Pick the most Michelin-worthy (= the most absurd-sounding). 3/3 correct = win.
- **Galley room** has trigger zones for both ScubaDive and DinnerService. Dinner is sequence-guarded as ritual step 2 (must come after pipe).
- **Sequence guard tested**: trying to step on the Dinner trigger before completing ScubaDive AND PipeSmoke should still trigger the hurricane (or be blocked sensibly).
- **Act 2 fully playable** end-to-end.

## Where we are

Sessions 1–4 are complete. We have:
- Working overworld with 4 rooms.
- Dialog, HUD, BaseMinigame, GameStateManager, SequenceGuard, EventBus.
- Act 1 playable: CokeDrink (werewolf rhythm) → PipeSmoke (ritual 1).
- RhythmBar and PowerMeter components in `src/ui/`.

## Required reading

1. `CLAUDE.md`
2. `docs/GAME-DESIGN.md` — sections 2 (Acts content row 2), 7 (architecture)
3. `docs/PHASE_LOG.md`
4. `src/scenes/minigames/CokeDrinkGame.js` and `PipeSmoke.js` — these are your reference for how a minigame is structured
5. `src/data/levels.js`, `src/data/rooms.js` — see how Session 4 added entries
6. `src/scenes/minigames/BaseMinigame.js` — DO NOT MODIFY, just understand

## Hard constraints

- **DO NOT modify `BaseMinigame.js`.**
- **DO NOT add npm packages.**
- ScubaDive must use **Arcade Physics** for collision detection (player vs fish). Phaser's Arcade Physics is built-in; just enable it in the scene.
- K-fish are drawn programmatically with `Phaser.Graphics` (two thin rectangles forming the letter K). NO sprite assets this session — real art comes in Session 8.
- Dinner Service has no time limit; it's pure menu-picking.
- The sequence guard MUST block dinner if pipe isn't done.

## Tasks for this session

### Task 1: Sanity check

```bash
git status
git pull
npm run dev
```

Verify Act 1 still works. Walk to Bar, do CokeDrink, walk to Main Deck, do PipeSmoke, confirm `ritualProgress = [1]` in the browser console (`game.registry.get('ritualProgress')`). Kill the dev server.

### Task 2: ScubaDiveGame

Create `src/scenes/minigames/ScubaDiveGame.js`. Extends BaseMinigame.

Behavior:

1. **Scene setup:** Top-down view. Background is a deep blue rectangle filling the screen. Add 3–4 procedural "kelp" sprites (green vertical rectangles that gently sway via tween).
2. **Enable physics:** in the constructor or `setupGame()`, ensure the scene uses Arcade Physics. (If the scene class extends `Phaser.Scene` via BaseMinigame, you can call `this.physics.world.setBounds(0, 0, 256, 224)` in setupGame to confirm physics is on. If physics isn't auto-enabled per-scene, add `physics: { default: 'arcade' }` to `src/index.js` Phaser config — that's a one-time global change.)
3. **Player (Cody):** A green 16×16 circle (Phaser graphic) at the center. Add as a physics body. Movement: arrow keys / WASD AND a virtual joystick (or 4 direction buttons) for touch. Speed: 60 px/sec. Constrain to scene bounds.
4. **K-fish spawning:** Every ~600ms, spawn one fish. 70% chance gold, 30% chance red. Each fish is a `Phaser.GameObjects.Container` containing two rectangles forming a K shape (vertical bar on the left, two diagonal bars on the right). Gold fish are yellow `0xffd040`, red fish are `0xff4040`. Each fish drifts horizontally across the screen (random vertical position, random direction left or right) at 30–60 px/sec. Add as physics bodies.
5. **Collisions:**
   - Player overlap with gold K-fish → fish destroyed, hit counter +1, brief yellow flash on player.
   - Player overlap with red K-fish → fish destroyed, lives -1, brief red flash on player, screen shake (`this.cameras.main.shake(150, 0.005)`).
6. **HUD overlay (within scene, not the global HUDScene):** Top-left "Fish: 0/10". Top-right "Lives: 3". Center-bottom: a 30s countdown timer.
7. **Win condition:** hit counter reaches the level config target (10) → `this.win()`.
8. **Lose conditions:**
   - Lives reach 0 → `this.lose()`.
   - Timer reaches 0 and hit counter < target → `this.lose()`.
9. **Level config:**

```javascript
'scuba-dive': {
  id: 'scuba-dive',
  sceneKey: 'ScubaDiveGame',
  instruction: 'DIVE!',
  location: 'Galley Hatch',
  isRitual: false,
  act: 2,
  config: { targetFish: 10, lives: 3, durationMs: 30000, fishSpawnIntervalMs: 600 },
},
```

Add to `src/data/levels.js`.

### Task 3: DinnerService ritual

Create `src/scenes/minigames/DinnerService.js`. Extends BaseMinigame. RITUAL STEP 2.

Behavior:

1. **Sequence guard:** triggered from OverworldScene's `startMinigameForLevel`, `assertCanStartRitual(this.game, 2)` is called. If pipe (step 1) isn't done, it returns false and emits hurricane fail.
2. **Setup:** Black screen. Top-center: course label "Course 1 of 3: APPETIZER".
3. **3 buttons** below the course label, each showing one of 3 menu options (texts). The player taps/clicks one. The game evaluates:
   - One option is the absurd Michelin choice (correct). Examples: "Deconstructed Ocean Foam with Truffle Mist".
   - Two are wrong (mundane or ridiculous in the wrong way): "Fish Sticks", "A Shoe".
4. Correct → green flash, "+1 STAR" text rises, course advances.
5. Wrong → red flash, "WRONG", course advances anyway (BUT a wrong-answer counter increases).
6. After 3 courses:
   - All correct → `this.win()`
   - 1+ wrong → `this.lose()`
7. **Menu data:** define inside the minigame file (or in `src/data/dinner-menu.js` if you prefer):

```javascript
const COURSES = [
  {
    label: 'Course 1 of 3: APPETIZER',
    options: [
      { text: 'Deconstructed Ocean Foam with Truffle Mist', correct: true },
      { text: 'Fish Sticks', correct: false },
      { text: 'A Single Shoe', correct: false },
    ],
  },
  {
    label: 'Course 2 of 3: ENTREE',
    options: [
      { text: 'Atlantic Lobster on a Cloud of Caviar Smoke', correct: true },
      { text: 'Hot Pocket', correct: false },
      { text: 'Boat Wood', correct: false },
    ],
  },
  {
    label: 'Course 3 of 3: DESSERT',
    options: [
      { text: 'Liquid Nitrogen Sea Urchin Sorbet', correct: true },
      { text: 'A Banana, Unpeeled', correct: false },
      { text: 'Toothpaste', correct: false },
    ],
  },
];
```

**Important:** randomize the order of the 3 options each course so the correct one isn't always first.

8. **Level config:**

```javascript
'dinner-service': {
  id: 'dinner-service',
  sceneKey: 'DinnerService',
  instruction: 'EAT!',
  location: 'Galley',
  isRitual: true,
  ritualStep: 2,
  act: 2,
  config: {},
},
```

Add to `src/data/levels.js`.

### Task 4: Galley triggers

Open `src/data/rooms.js`. The `galley` room currently has no triggers. Add two:

```javascript
triggers: [
  { x: 4, y: 4, levelId: 'scuba-dive' },
  { x: 12, y: 4, levelId: 'dinner-service' },
],
```

Pick coordinates that make sense for the room layout — both should be inside walkable floor tiles. Visualize them with the yellow `!` markers from Session 4.

### Task 5: Sequence guard regression test

This is critical. We need to verify that:
1. If you walk into the dinner trigger BEFORE completing the pipe ritual, the hurricane fail fires.
2. After completing pipe (ritual step 1), walking into dinner should be allowed (pending scuba dive completion which is NOT a ritual step but is the gating minigame for dinner — that's a UX choice; for now allow dinner without scuba, and just have an NPC say "you should dive first" — keep the scope tight).

Manual test:
- Start a fresh game (or call `GameStateManager.reset(this.game)` from the dev console).
- Walk straight to the Galley.
- Step on the Dinner trigger.
- Expected: hurricane fail placeholder fires immediately.

### Task 6: NPC hint dialog (optional but recommended)

Add a mermaid NPC to the Galley with dialog hinting at the order. In `dialogs.js`:

```javascript
'galley-mermaid': {
  speaker: 'Galley Mermaid',
  lines: [
    'You smell like smoke. Good.',
    'Now eat. The dinner is ready.',
    'But first, the K-fish. Cody needs the K-fish.',
  ],
},
```

In `Cody.js`-style, create a `Mermaid.js` object class or just extend Cody to take a color parameter so you can place a pink-rectangle mermaid at a Galley tile with `dialogId: 'galley-mermaid'`.

In OverworldScene's NPC instantiation, when `roomId === 'galley'`, add this NPC.

### Task 7: Register new scenes

Add `ScubaDiveGame` and `DinnerService` to `src/index.js` scene list.

### Task 8: Playtest

Full Act 1 + Act 2 run:

1. Start game. Walk to Cody on Main Deck → talk → narrative dialog only.
2. Walk to Bar → step on Coke trigger → CokeDrinkGame → win.
3. Walk back to Main Deck → Pipe trigger → PipeSmoke → win. `ritualProgress = [1]`.
4. Walk to Galley. Step on Scuba trigger → ScubaDiveGame → win.
5. Step on Dinner trigger → DinnerService → pick correct options → win. `ritualProgress = [1, 2]`.
6. Reset game (or use dev tools), this time walk straight to Galley and step on Dinner first → hurricane.

## Verification

- [ ] ScubaDiveGame plays correctly: arrow keys/WASD/touch move the player, K-fish spawn and drift, collisions register, win at 10 fish, lose at 0 lives or 0 timer.
- [ ] DinnerService shows 3 courses, each with 3 options, randomized order, correct = star, wrong = wrong.
- [ ] Winning DinnerService advances `ritualProgress` to `[1, 2]`.
- [ ] Trying to do dinner before pipe (e.g., on a fresh game state) triggers the hurricane fail.
- [ ] All Act 1 minigames still work.
- [ ] No console errors.
- [ ] Mobile touch input works for both new minigames (joystick or direction buttons for scuba; tap menu buttons for dinner).

## Before ending the session

### 1. Update `CLAUDE.md`

Add a note to "Architecture" or "Key patterns":

```
- Arcade Physics is enabled globally in src/index.js. ScubaDiveGame uses physics bodies for player and fish, with overlap callbacks.
- Sequence guard fires hurricane fail on wrong-order ritual triggers. Tested in Session 5.
```

In Current phase:

```
Session 5 complete. Act 2 playable: ScubaDive (K-fish collection) and DinnerService (Michelin choice ritual step 2). Sequence guard verified blocking dinner before pipe. Next: Session 6 — Act 3 (Motorboat + Mermaid Shower).
```

### 2. Update `docs/PHASE_LOG.md`

Add a Session 5 row and notes.

### 3. Commit and push

```bash
git add .
git commit -m "Session 5: Act 2 — ScubaDive + DinnerService"
git push
```

### 4. Confirm

"Session 5 complete. Open `docs/06-SESSION-6-ACT-3.md` when ready."

## Troubleshooting

**Physics overlap callbacks don't fire.**
You need `this.physics.add.overlap(player, goldFish, callback, null, this)`. Make sure both are physics bodies (`this.physics.add.existing(obj)` if needed).

**K-fish look like blobs, not Ks.**
Try larger components: vertical rect 2×12 px on the left, two diagonal lines (use `Phaser.Geom.Line` or short rectangles rotated) on the right. Container the whole thing so it moves as one. If still unclear, place a label "K" above each fish for now.

**ScubaDiveGame is too easy/hard.**
Tune `fishSpawnIntervalMs`, `targetFish`, and `lives` in the level config in `levels.js`. No code changes needed.

**DinnerService randomization shows the same order every time.**
Use `Phaser.Utils.Array.Shuffle(courseOptions)` — it's a built-in helper.

**The mermaid NPC interact zone overlaps with a trigger zone.**
Place them on different tiles. Each tile can have at most one interact target.

## What's next

**Session 6 — Act 3 (Motorboat + Mermaid Shower).** The Motorboat is the rapid-tap peak energy minigame. The Shower is a slider-keep-in-the-zone ritual step. Both reuse PowerMeter from Session 4.

---

**End of Session 5 instructions. Start with Task 1.**

# Cody On A Boat — Session 6: Act 3 (Motorboat + Mermaid Shower)

> **For the human (you):** This is Session 6 of 10. Open a fresh Claude Code chat in your `cody-on-a-boat` directory. Copy everything below the `---` line and paste as your first message.

---

You are helping me build **Cody On A Boat**. This is **Session 6 of 10**. I am not a software engineer — be explicit, ask permission, no surprises.

## Goal of this session

By the end of this session:
- **MotorboatGame** is built. Cody's face is shoved into a dashboard, mermaid rectangles bounce, the player rapidly alternates two buttons (or rapid-taps one) to keep a power meter above the red zone for 20 seconds. This is the peak-energy minigame.
- **MermaidShower** ritual is built. A temperature slider needs to stay in the green zone for 15 seconds while random "splash" events nudge it left or right.
- **Bridge room** (or Cabin Corridor — pick the more sensible spot) has triggers for both.
- Both reuse the **PowerMeter** component from Session 4 — no duplication.
- **Act 3 fully playable** end-to-end. Doing the full Act 1 → Act 2 → Act 3 flow takes ~10 minutes.

## Where we are

Sessions 1–5 complete:
- Overworld with 4 rooms.
- Dialog, HUD, BaseMinigame, sequence guard.
- Act 1: CokeDrink, PipeSmoke (ritual 1).
- Act 2: ScubaDive, DinnerService (ritual 2).
- Reusable RhythmBar and PowerMeter components.

## Required reading

1. `CLAUDE.md`
2. `docs/GAME-DESIGN.md` — sections 2 (Act 3 row), 5 (fail cutscene), 7 (architecture)
3. `docs/PHASE_LOG.md`
4. `src/scenes/minigames/PipeSmoke.js` — your reference for using PowerMeter
5. `src/ui/PowerMeter.js` — see what the API supports (you may need to add a method, but try to use what's there first)

## Hard constraints

- **DO NOT modify `BaseMinigame.js`.**
- **DO NOT add npm packages.**
- **REUSE PowerMeter from `src/ui/`** in both new minigames. If PowerMeter is missing a feature you need, add the method to PowerMeter — don't duplicate the logic in the minigame.
- Sequence-guard MermaidShower as ritual step 3.
- Mobile-first input. The Motorboat must work with two-finger tapping on a phone screen.

## Tasks for this session

### Task 1: Sanity check

```bash
git status
git pull
npm run dev
```

Verify Act 1 + Act 2 still work end-to-end. Reach `ritualProgress = [1, 2]`. Kill the dev server.

### Task 2: MotorboatGame

Create `src/scenes/minigames/MotorboatGame.js`. Extends BaseMinigame.

Behavior:

1. **Scene setup:**
   - Background: blue gradient (use two rectangles or a tinted Phaser graphic) representing sea + sky.
   - Center: a horizontal rectangle representing the boat's dashboard. Cody's face = a green rectangle pressed against it from behind.
   - 2 mermaid rectangles (pink) on top of the dashboard, slightly bouncing via a vertical sine tween.
   - Wake spray particles behind the boat using a `Phaser.GameObjects.Particles.ParticleEmitter` (small white circles bursting backward at increasing rate as power increases).
2. **PowerMeter:** vertical orientation, on the right side of the screen. Max 100, current starts at 60. Decay rate is **fast** (e.g., 50/sec) — the player can't stop tapping.
3. **Tap logic:**
   - Desktop: SPACE adds +12 to the meter. Pressing alternating Q and W also each add +8 (making "rapid alternating" the optimal pattern).
   - Mobile: two large on-screen buttons labeled "L" and "R" (left and right). Tapping each adds +8. Tapping the same one twice in a row adds only +4 (penalty for non-alternation). Tapping a single SPACE-equivalent center button adds +6.
4. **Update loop:** decay PowerMeter every frame. Update mermaid bounce frequency proportional to current power. Update particle emit rate proportional to current power.
5. **Win condition:** survive 20 seconds of play time without the meter hitting 0. Use a countdown timer in the top-right.
6. **Lose condition:** meter reaches 0 → boat stalls visually (mermaids stop bouncing, particles stop, screen tints darker) and `this.lose()` after a 1s pause.
7. **Level config:**

```javascript
'motorboat': {
  id: 'motorboat',
  sceneKey: 'MotorboatGame',
  instruction: 'BLOW!',
  location: 'Open Sea',
  isRitual: false,
  act: 3,
  config: { durationMs: 20000, decayPerSec: 50, tapPower: 12, alternateBonus: 4 },
},
```

Add to `src/data/levels.js`.

### Task 3: MermaidShower ritual

Create `src/scenes/minigames/MermaidShower.js`. Extends BaseMinigame. RITUAL STEP 3.

Behavior:

1. **Sequence guard:** triggered via `assertCanStartRitual(this.game, 3)`. Should fail if `ritualProgress.length < 2`.
2. **Setup:**
   - Top-center: a horizontal "temperature" bar drawn with `Phaser.Graphics`. The bar is 200px wide. A "current temperature" indicator (a small triangle or vertical line) starts at the center.
   - The bar has 5 zones: cold-blue (0–20%), cool-cyan (20–35%), green (35–65%), warm-orange (65–85%), hot-red (85–100%).
   - Below the bar: Cody (green rect) standing under a shower (white rectangle "showerhead" with falling white particles). 2 mermaid rectangles bouncing on either side.
3. **Player input:**
   - Hold LEFT (or tap left button on mobile) → temperature decreases at 25 units/sec.
   - Hold RIGHT (or tap/hold right button on mobile) → temperature increases at 25 units/sec.
4. **Mermaid splashes:** every 1.2s, randomly nudge the temperature by ±15 (a "splash"). Visual: the splashing mermaid jumps and a blue particle burst appears.
5. **Goal:** keep temperature in the green zone (35–65) for a cumulative 10 seconds. Use a "in zone seconds" counter. If currently in green, the counter ticks up. If not, it doesn't decrease, just pauses. Win at 10s in green.
6. **Total time limit:** 25 seconds. If you haven't hit 10 in-green seconds by then, lose.
7. **Visual feedback:** Cody changes tint based on temperature: blue when cold, green when right, red when hot. The shower particles change color similarly.
8. **Level config:**

```javascript
'mermaid-shower': {
  id: 'mermaid-shower',
  sceneKey: 'MermaidShower',
  instruction: 'WASH!',
  location: 'Mermaid Grotto',
  isRitual: true,
  ritualStep: 3,
  act: 3,
  config: { greenZone: [35, 65], targetSecondsInZone: 10, totalDurationMs: 25000, splashIntervalMs: 1200 },
},
```

Add to `src/data/levels.js`.

### Task 4: Decide where the triggers live

The boat already has 4 rooms: Main Deck, Bar, Galley, Bridge. We need triggers for `motorboat` and `mermaid-shower`.

**Recommendation:**
- `motorboat` → Bridge room (the captain's bridge has the boat controls, makes thematic sense). Add it as a trigger.
- `mermaid-shower` → also Bridge OR add a 5th room "Cabin Corridor" with the shower in it.

For minimum effort, put both triggers in the **Bridge** room with two trigger tiles. That keeps the room count at 4.

If you want the 5th room, it's straightforward: add a `cabin-corridor` entry to `ROOMS`, add a door to it from Main Deck, place the shower trigger inside. Document the choice.

Update `src/data/rooms.js` accordingly.

### Task 5: Add a wake particle helper (if needed)

If Phaser's particle API confuses Claude Code or the build, the alternative is to spawn small white circles via `this.add.circle` on a timer and tween them backward. Either works. Particles are nicer but tweened circles are simpler — pick whichever you can complete confidently.

### Task 6: Register new scenes

Add `MotorboatGame` and `MermaidShower` to the scene list in `src/index.js`.

### Task 7: Playtest

Full Act 1 + Act 2 + Act 3 run:

1. Fresh game. Walk to Cody on deck → talk.
2. Bar → CokeDrink → win.
3. Main Deck → Pipe → win. `[1]`
4. Galley → Scuba → win.
5. Galley → Dinner → win. `[1, 2]`
6. Bridge → Motorboat → win.
7. Bridge → Shower → win. `[1, 2, 3]`

Sequence guard tests:
- Reset game. Walk straight to Bridge. Step on Shower. Hurricane fails.
- Reset. Do pipe. Walk to Bridge. Step on Shower. Hurricane fails (because dinner not done).
- Do pipe + dinner. Step on Shower. Allowed.

## Verification

- [ ] MotorboatGame plays for 20s, requires sustained tapping, both desktop (SPACE / Q+W) and mobile (L/R buttons) work.
- [ ] PowerMeter decay feels right — fast enough that the player must tap, not so fast it feels impossible.
- [ ] MermaidShower temperature slider responds to LEFT/RIGHT input AND on-screen buttons.
- [ ] Splashes nudge the temperature randomly and visibly.
- [ ] Winning shower advances `ritualProgress` to `[1, 2, 3]`.
- [ ] Sequence guard correctly blocks shower when ritual order is wrong.
- [ ] All previous Acts still work.
- [ ] PowerMeter is imported from `src/ui/`, not duplicated.
- [ ] No console errors.

## Before ending the session

### 1. Update `CLAUDE.md`

In Current phase:

```
Session 6 complete. Act 3 playable: MotorboatGame (rapid-tap power meter) + MermaidShower (temperature slider ritual step 3). Game is now 75% complete. Next: Session 7 — Act 4 (Lullaby + Mermaid Nap) AND the real cutscene scenes (hurricane fail + victory).
```

If you added a 5th room, add a note in Architecture about it.

### 2. Update `docs/PHASE_LOG.md`

Add Session 6 row + notes.

### 3. Commit and push

```bash
git add .
git commit -m "Session 6: Act 3 — MotorboatGame + MermaidShower"
git push
```

### 4. Confirm

"Session 6 complete. Open `docs/07-SESSION-7-ACT-4-AND-FAIL.md` when ready."

## Troubleshooting

**MotorboatGame is impossibly hard.**
Tune `decayPerSec` lower (try 35) or `tapPower` higher (try 16). Test until a normal player can win with effort but lose with neglect.

**MotorboatGame is impossibly easy.**
Opposite. `decayPerSec` 60+, smaller `tapPower`.

**MermaidShower temperature jitters too violently.**
Reduce splash magnitude from ±15 to ±10. Reduce splash frequency.

**Player input drift in MermaidShower (held key feels delayed).**
Use `this.input.keyboard.isDown(Phaser.Input.Keyboard.KeyCodes.LEFT)` polled in `update()` rather than keydown events for held-key behavior.

**PowerMeter is hard to import (file not found / circular import).**
Verify the path: `import { PowerMeter } from '../../ui/PowerMeter.js'` from inside `src/scenes/minigames/`.

**Bridge room is too small for two triggers.**
Add a 5th room. Or expand the bridge layout from 16×14 (the standard) — but if you change room dimensions, ensure constants and rendering still work.

## What's next

**Session 7 — Act 4 + the real cutscenes.** Lullaby (rhythm tap, reuses RhythmBar), MermaidNap (tap-to-shush 4 noises), CutsceneScene (hurricane fail with screen shake + Florida sinking + Aquaman throne, AND victory shore arrival), and the wire-up of the FAILURE_THRESHOLD === 5 trigger and ritual-complete victory trigger to use the real CutsceneScene instead of the placeholder text.

---

**End of Session 6 instructions. Start with Task 1.**

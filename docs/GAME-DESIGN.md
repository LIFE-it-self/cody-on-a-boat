# Cody On A Boat — Game Design (Source of Truth)

This is the condensed design document. Every Claude Code session reads this. If anything in a session file contradicts this document, **this document wins**.

---

## 1. The pitch

You are **Cody**, stuck on the boat. **Captain Chowder John** is the stationary advisor on the main deck who guides you. *(Swapped in the playtest-notes-2 session — originally the player was the Captain.)* The only way off is a four-step ritual that must be done in order:

1. **Smoke a pipe** — which burns only **VYOOSFRUMTHA CRYHOLE**, a substance won from **the horse at the bar** by answering its riddle
2. **Eat a Michelin-starred dinner**
3. **Shower with mermaids**
4. **Nap with mermaids**

Between ritual steps, Cody (and the player) complete minigames. Doing the ritual out of order, or failing 5 minigames in total, causes Cody to transform into a hurricane and sink Florida. The bad ending is an illustrated cutscene of Cody on a coral throne ruling the former Floridians (now mermaids) at the bottom of the sea.

**Tone:** absurd inside-joke comedy. Nothing takes itself seriously.
**Audience:** the developer's friend group.
**Platform:** browser (desktop + mobile).
**Playtime:** 15–30 minutes per playthrough.

---

## 2. Acts and content

The game has four acts. Each act has one minigame followed by one ritual step.

| Act | Minigame | Ritual Step |
|-----|----------|-------------|
| 1 | **CokeDrink** — Cody drinks a Coke and turns into a werewolf, then repeats howl patterns back Simon-style (a 2-note pattern twice, then a 4-note pattern once; 3 mistakes lose). | **Pipe Smoke** — Tap steadily to puff (the pipe needs a beat between puffs). Chain 5 puffs without letting it go out. **Also requires VYOOSFRUMTHA CRYHOLE** (see side-gate below). |
| 2 | **ScubaDive** — Top-down underwater swim. Collect golden K-shaped fish before time runs out. Avoid red K-fish. | **Dinner Service** — 3 courses, each with 3 menu options. Pick the absurd Michelin-worthy one each time. |
| 3 | **Motorboat** — Cody shoves his face into the dashboard and blows, whipping between the two mermaids. Alternate Q/W (or tap L/R) to keep a power meter above empty. | **Mermaid Shower** — Slide a temperature knob. Mermaids randomly nudge it. Accumulate enough time in the green zone. |
| 4 | **Counting Sheep** — Tap to hop a sheep from cloud to cloud; count 3 sheep. On winning, the sheep reveal themselves to have been HORSES all along. | **Mermaid Nap** — Cody falls asleep. Tap to shush 4 noises (seagull, foghorn, wave, parrot); missing 2 wakes him. |

**Side-gate:** the **Horse Riddle** (bar). The horse guards VYOOSFRUMTHA CRYHOLE, the only fuel the ritual pipe burns. Answer its simple riddle to obtain it; the pipe soft-blocks until you have. A wrong answer counts as a normal minigame failure and the riddle can be retried.

*(Exact counts, timers, and thresholds live in `src/data/levels.js` — that file is the tuning source of truth; this table describes the mechanics.)*

**Total:** 4 minigames + 4 ritual steps = 8 interactive sequences. (Originally 8 minigames in the playbook, trimmed by 3 weak/overlapping ones for focus and feasibility.)

### Sequence enforcement

The ritual steps must be done in order: **Pipe → Dinner → Shower → Nap**. If the player steps on a ritual trigger out of order (e.g., walks up to the shower before completing dinner), the ritual **soft-blocks**: an in-character dialog ("The ritual resists. Dinner comes second.") explains the next move, with no failure and no penalty. *(Changed in the assessment session — the original instant-hurricane rule punished innocent exploration: every room is open from the start and a fatal trigger looked identical to a safe one.)* Ritual triggers are visually distinct in the overworld: a pulsing red `!` marks the ready ritual step, a gray `?` marks rituals that would refuse to start, and a yellow `!` marks safe minigames. The order is also communicated through NPC dialog, Cody's state-aware hints, and the live HUD objective — **not** a tutorial popup.

### Minigames must precede their ritual step in the same act

Each act's minigame is the gate for that act's ritual step. You can't smoke the pipe until you've completed the Coke/Werewolf rhythm game. You can't eat dinner until you've completed the Scuba dive. Etc. This is enforced in `OverworldScene.startMinigameForLevel` via `Objective.actMinigameDone` — an un-gated ritual soft-blocks with a hint dialog pointing at the missing minigame.

---

## 3. Failure model

- A **failure counter** starts at 0.
- Each minigame loss adds +1.
- Ritual steps cannot be "lost" the same way — they either complete or, if abandoned, can be retried. (Tuning detail.)
- At **failureCount === 5**, the hurricane fail cutscene plays. (Higher than the playbook's 3 because this is a casual game for friends; we want it forgiving.)
- A wrong-order ritual attempt **soft-blocks** with an in-character dialog — no fail, no reset. The hurricane-by-failure-count path is the only fail state in normal play. (Changed in the assessment session; the instant-fail joke read as unfair in practice because the fail wipes the whole run.)

---

## 4. Boat overworld

The boat has **4–6 rooms** connected by doors. Captain Chowder John walks around with 4-direction tile-snapped movement (no diagonals). The player explores, talks to NPCs (mermaids, ghost crew, a parrot, etc.), and walks into trigger zones to start minigames or ritual steps.

Rooms (minimum viable list):

1. **Main Deck** — pipe lives here, ritual step 1
2. **Bar** — Coke is served here, minigame 1
3. **Galley** — dinner is served here, ritual step 2; scuba hatch is also here, minigame 2
4. **Bridge** — motorboat / shower
5. **Cabin Corridor** (optional) — bedrooms / nap step
6. **Engine Room** (optional) — flavor only or location of one minigame

For the first build, **only build the rooms that are actually used by content**. Don't build six rooms then realize you only need four.

---

## 5. Fail-state cutscene (the hurricane)

When triggered, the cutscene goes:

1. Screen shakes violently for 1 second.
2. Cody sprite spins, accelerating, with particle wind effects, transforming into a hurricane spiral.
3. Fade to a static illustration of Florida being hit by a hurricane and sinking.
4. Cross-fade to a static illustration of Cody as Aquaman on a coral throne, surrounded by mermaid citizens.
5. Text overlay: **"CODY RULES THE DEEP. FLORIDA IS NO MORE."**
6. **Retry** button. On retry → reset state, return to MainMenuScene.

The two illustrations don't need to be pixel art. They can be drawn or generated separately and dropped in as PNGs.

---

## 6. Victory cutscene

When all four ritual steps are completed in order:

1. Cody falls asleep peacefully (tail end of the Nap ritual).
2. Fade to black, peaceful music.
3. "When Cody woke up, he was on shore." Cody sprite stands on a beach (any beach background, even a placeholder).
4. **"CODY GOT OFF THE BOAT."**
5. Credits scroll (names of friends, fake credits, whatever you want).
6. Returns to MainMenuScene.

---

## 7. Tech stack and architecture

**Decided up-front, do not change without strong reason:**

- **Phaser 3.80.x** — game engine. Stable, lots of training data, scene system fits the minigame architecture.
- **Vite** — bundler / dev server.
- **Vanilla JavaScript** — no TypeScript. Reduces complexity for the non-engineer building this.
- **No Tiled.** Rooms are JS arrays in `src/data/rooms.js`. Easier than installing and learning a separate desktop tool.
- **No Grid Engine plugin.** 4-direction tile-snapped movement is ~40 lines of vanilla Phaser in `src/objects/Player.js`.
- **No localStorage.** State lives in `game.registry` (Phaser's built-in cross-scene store).
- **CC0 or CC-BY assets only.** Kenney, Anokolisa, OpenGameArt, Freesound. Optional: PixelLab/Piskel for character sprites.

### Minigame lifecycle

Every minigame and ritual step extends `BaseMinigame` and follows the same state machine:

```
TITLE_CARD (2s) → INSTRUCTION (1s) → PLAY (variable) → EVALUATE → WIN/LOSE
```

- **TITLE_CARD** displays the location name and a one-word verb instruction ("DRINK!", "DIVE!", "BLOW!", "PUFF!").
- **INSTRUCTION** shows a brief animated hint (placeholder text in early sessions).
- **PLAY** is the actual gameplay.
- **EVALUATE** checks the win/lose condition.
- **WIN** advances story state.
- **LOSE** increments failure counter; if counter == 5, jumps to fail cutscene.

### State management

A singleton `GameStateManager` lives on `game.registry`. Tracks:

- `currentAct` (1–4)
- `ritualProgress` — array, e.g., `[1, 2]` means pipe and dinner done, shower and nap remain
- `failureCount` (0–5)
- `completedMinigames[]`
- `selectedCodyVariant` (always `"default"` for v1)

`SequenceGuard.assertCanStartRitual(ritualStep)` checks `ritualProgress` before any ritual step activates. Wrong order → throws an event that triggers the fail cutscene.

### Level registry

`src/data/levels.js` exports an array of level definitions:

```javascript
export const LEVELS = [
  { id: 'coke-drink',    act: 1, sceneKey: 'CokeDrinkGame',  instruction: 'DRINK!', location: 'Ship Bar',   isRitual: false, config: { beats: 8, requiredHits: 6 } },
  { id: 'pipe-smoke',    act: 1, sceneKey: 'PipeSmoke',      instruction: 'PUFF!',  location: 'Main Deck',  isRitual: true, ritualStep: 1, config: { puffsRequired: 5 } },
  // ... etc
];
```

Adding a level = new entry here + new scene file. No changes to `BaseMinigame` or `OverworldScene`.

---

## 8. Resolution and rendering

- Internal resolution: **256×224** (SNES standard).
- Phaser scale mode: `Phaser.Scale.FIT` with integer scaling where possible.
- `pixelArt: true` (no texture smoothing).
- `roundPixels: true` (no sub-pixel shimmer).
- CSS: `image-rendering: pixelated` on canvas.
- Tile size: **16×16**.
- Character sprites: **16×16** (or 16×24 for taller).

---

## 9. Art strategy

**Sessions 1–7:** all visual elements are placeholder rectangles, circles, and Phaser-graphics primitives. Player = blue rect. Cody = green rect. Mermaid = pink rect. K-fish = two rectangles forming a K. Hurricane = spinning gray rect with particles. **The mechanics must work with placeholder art.**

**Session 8 (Art + Audio Pass):** all placeholders are replaced with real sprites. Sources:

| Asset | Source |
|---|---|
| Captain Chowder John, Cody (1 variant) | PixelLab (paid) or Piskel (free hand-draw) |
| Werewolf Cody, Aquaman Cody | PixelLab or Piskel edits of base Cody |
| Mermaids | PixelLab or Piskel |
| K-fish | Hand-draw 16×16 in Piskel |
| Boat tileset | Anokolisa 16×16 RPG pack (itch.io, free) repurposed |
| UI elements | Kenney Pixel UI Pack (kenney.nl, CC0) |
| Hurricane + Aquaman illustrations | Hand-draw or larger AI image gen, doesn't need to be pixel art |
| Music | OpenGameArt CC0/CC-BY tracks (overworld, minigame, underwater, victory, fail) |
| SFX | Kenney sound packs (CC0): howl, splash, puff, ding, buzz, hurricane wind |

**Hard rule:** never use copyrighted music or assets. Always check the license.

---

## 10. Distribution

The game ships in **three formats** (built in Session 10):

1. **GitHub Pages** — `https://YOUR-USERNAME.github.io/cody-on-a-boat/`. Free, persistent URL. Main share link.
2. **itch.io** — uploaded as an HTML5 game. Has a nicer landing page and a comments section.
3. **Single HTML file** — `cody-on-a-boat.html`, all assets inlined. Can be emailed, AirDropped, or sent in Discord. Works offline.

A QR code pointing to the GitHub Pages URL is generated for easy phone sharing.

Optional: PWA manifest + service worker so friends can "Add to Home Screen" on their phones (Session 9).

---

## 11. What NOT to do

A short list of hard rules that should never be broken without an explicit override from the user:

- **No TypeScript.** Vanilla JS only.
- **No Tiled, no Grid Engine.** Programmatic rooms and custom movement.
- **No npm packages added** beyond what's already in `package.json`, unless explicitly approved.
- **No localStorage.** Use `game.registry`.
- **Never modify `BaseMinigame.js`** from a minigame file. Only the central session that introduced it can refactor it.
- **No premature character creator.** One Cody for v1.
- **No copyrighted assets.** CC0 / CC-BY only.
- **No generic "improvement" passes.** Don't add type hints, docstrings, or refactors to code that wasn't part of the current session's goal.
- **No `--no-verify` git flags** unless explicitly approved.

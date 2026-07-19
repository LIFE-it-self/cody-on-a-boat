# Cody On A Boat — Design System

A single-doc design system for **Cody On A Boat**, a browser-based pixel-art mini-RPG built in Phaser 3. This document describes the aesthetic identity and component vocabulary of the game as it exists today (post-Session 8, art-and-audio pass complete). Upload this file into Claude Design as context, and use it when designing new characters, rooms, minigames, UI, or cutscenes for the project.

The structure runs **identity → system → application → principles**. The early sections tell you *what the game is*; the middle sections give you the *palette and components* to work with; the later sections show you *how features are composed* and *which principles guide new work*.

---

## 1. Product & premise

You play **Captain Chowder John**. Your friend **Cody** is stuck on the boat, and the only way off is a four-step ritual that must be done in order:

1. **Smoke a pipe**
2. **Eat a Michelin-starred dinner**
3. **Shower with mermaids**
4. **Nap with mermaids**

Between ritual steps, minigames keep Cody occupied — drinking a Coke (which turns him into a werewolf), scuba-diving for K-shaped fish, motorboating the dashboard, tapping along to a mermaid lullaby. Doing the ritual out of order, or failing five minigames in total, triggers the bad ending: Cody transforms into a hurricane and sinks Florida, ending on a coral throne as Aquaman. The good ending is mundane by contrast — **"Cody got off the boat."** The game is an inside joke for a friend group, 15–30 minutes per playthrough, playable on desktop and mobile browsers.

---

## 2. Tone & voice

Cody On A Boat is **absurdist deadpan**. The premise is ridiculous on every axis — the ritual, the fail state, the character names — and the game commits to it fully. Nothing is winked at, nothing is explained. The humor is in the specificity and the refusal to acknowledge how weird any of it is.

Concrete anchors:

- **Imperative all-caps labels** inside every minigame: `TAP TO PUFF`, `TAP IN RHYTHM`, `TAP/ALTERNATE!`, `TAP LULLABY`, `TAP THE MOST MICHELIN CHOICE`, `SHUSH THE NOISES`. Always short, always directive.
- **Win / Lose overlays** use the same register: just `WIN!` or `LOSE` at 24px monospace on a translucent color field.
- **Dialog is terse and typed one character at a time** (30 ms per char). NPCs drop the ritual order as mystical fragments: *"Pipe first. Always pipe first."* No paragraphs, no exposition.
- **HUD is factual and small**: `Failures: N/5` at the top-left, `Objective: Find Cody` at the top-right, 8px monospace white.
- **Cutscene text is flat and declarative**: `HURRICANE`, `FLORIDA SINKS`, `CODY RULES THE DEEP`, `FLORIDA IS NO MORE.`, `CODY GOT OFF THE BOAT.`

Avoid long-form writing, metacommentary, winking jokes, emoji, or anything that lets the player off the hook about how strange the premise is.

---

## 3. Visual language

### Canvas, grid, and rendering

- **Internal resolution**: 256 × 224 pixels (SNES-era). Scaled up with `pixelArt: true` and `roundPixels: true` — never anti-aliased, never sub-pixel.
- **Tile grid**: 16 × 16 px. A room is 16 × 14 tiles. Character sprites are 16 × 16 (or 16 × 24 if taller).
- **Flat fills, 1 px strokes**. No gradients, no drop shadows, no inner glows, no soft edges.
- **Depth-layered rectangles** are the primitive of choice — UI, widgets, and fallback characters are all composed from flat `Phaser.GameObjects.Rectangle` primitives with explicit `setDepth()` stacking.

### Palette (canonical)

Hex values are `0xRRGGBB` Phaser numbers; CSS equivalents are identical in RGB.

| Role | Hex | Notes |
|---|---|---|
| **Overworld background (navy)** | `0x0a0e27` | `COLORS.BG` in `src/constants.js` — the boat's outer backdrop. |
| **Minigame background** | `0x000020` | Nearly black, slight blue cast. Set by `BaseMinigame.create()`. |
| **Cutscene background** | `0x000000` | Pure black. |
| **Floor** | `0x4a3a2a` | Warm brown wood. Rectangle fallback for `tile-floor`. |
| **Wall** | `0x222222` | Dark gray. Rectangle fallback for `tile-wall`. |
| **Door** | `0xc8a050` | Gold-brown. Rectangle fallback for `tile-door`. |
| **Player (Captain)** | `0x4080ff` | Bright blue. |
| **Cody** | `0x40c040` | Green. Same hex used for werewolf and Aquaman fallbacks. |
| **Mermaids** | `0xff69b4` | Hot pink. |
| **K-fish gold** | yellow | Goal fish in ScubaDive. |
| **K-fish red** | red | Hazard fish in ScubaDive. |
| **Interact marker `!`** | `#ffff00` | 10 px monospace, floats above NPCs and trigger tiles. |
| **RhythmBar bg** | `0x222222` stroke `0x444444` | Dark gray lane. |
| **RhythmBar hit-zone line** | `0x40c040` | Thin 4 px bright-green vertical. |
| **RhythmBar hit-window cue** | `0x40c040` @ 0.2 alpha | Translucent green timing window. |
| **RhythmBar note (pending)** | `0xff0000` | 8 × 8 red square. |
| **RhythmBar note (hit)** | `0xffffff` → `0x88ff88` | White flash, then pale green after 100 ms. |
| **RhythmBar note (missed)** | `0x660000` | Dark red. |
| **PowerMeter ≥ 50%** | `0x40c040` | Green (safe). |
| **PowerMeter 25–50%** | `0xc0c040` | Yellow (warning). |
| **PowerMeter < 25%** | `0xc04040` | Red (danger). |
| **PowerMeter border** | `0xffffff` | 1 px white, transparent interior. |
| **Win overlay** | `0x40c040` @ 0.6 alpha | Green wash, `WIN!` at 24 px mono white. |
| **Lose overlay** | `0xc04040` @ 0.6 alpha | Red wash, `LOSE` at 24 px mono white. |
| **Cutscene fail backdrop** | `0x203040` | Dark blue-gray. |
| **Cutscene fail hurricane** | `0x606060` | Gray spinning circle, 80 px radius. |
| **Cutscene Aquaman throne** | `0x40a0a0` + `0xffff80` stroke | Cyan with pale-yellow trim. |
| **Cutscene victory sky** | `0x60a0ff` | Soft blue. |
| **Cutscene victory sun** | `0xfff080` | Pale yellow, 20 px radius circle. |
| **Cutscene victory sand** | `0xf0d080` | Warm tan. |

### Signature convention: rectangle fallback

Every sprite and tile creation checks for a loaded texture and falls back to a flat colored rectangle when the texture is missing:

```js
if (this.textures.exists('cody')) {
  this.cody = this.add.sprite(x, y, 'cody').setDisplaySize(16, 16);
} else {
  this.cody = this.add.rectangle(x, y, 16, 16, 0x40c040);
}
```

This is **load-bearing**: the game is fully playable with zero art assets loaded. Real sprites are additive polish, never a hard dependency. The canonical fallback color for every character matches the palette above (Player = blue, Cody = green, Mermaid = pink, etc.). Color flashes use `setTint` on sprites and `setFillStyle` on rectangles — both paths are always wired up.

---

## 4. Character & environment roster

### Characters

| Name | Color | Silhouette | Sprite |
|---|---|---|---|
| **Captain Chowder John** | `0x4080ff` | Chubby pirate captain, white beard, blue coat, navy hat | `sprites/captain.png` |
| **Cody (normal)** | `0x40c040` | Bearded friendly man, brown hair, t-shirt | `sprites/cody.png` |
| **Cody (werewolf)** | `0x40c040` | Gray fur, glowing red eyes, fangs | `sprites/cody-werewolf.png` |
| **Cody (Aquaman)** | `0x40c040` | Golden trident, scale armor, crown | `sprites/cody-aquaman.png` |
| **Mermaid 1 / 2** | `0xff69b4` | Pink hair, green tail, two variants | `sprites/mermaid-1.png`, `sprites/mermaid-2.png` |
| **K-fish gold** | yellow | Fish-shaped, unmistakable letter **K**, golden | `sprites/k-fish-gold.png` |
| **K-fish red** | red | Same shape, red — hazard | `sprites/k-fish-red.png` |
| **Bartender NPC** | `0x8080c0` | Generic blue-violet rectangle fallback | (no sprite yet) |
| **Ghost NPC** | `0x606080` | Slate-gray rectangle fallback | (no sprite yet) |
| **Parrot NPC** | `0x40c040` | Green rectangle fallback | (no sprite yet) |

All characters occupy a single 16 × 16 tile. Faces and details read at that size only with strong silhouettes and high-contrast color blocks — no gradient shading, no fine line work.

### Rooms

The boat has **5 rooms** connected by doors. Each room carries its own tileset triad (`floor`, `wall`, `door`) at `public/assets/tilesets/{room}_floor.png` / `_wall.png` / `_door.png`, plus a generic fallback set at `floor.png` / `wall.png` / `door.png`.

| Room | Role |
|---|---|
| **Main Deck** | Central hub. Three doors out (Bar, Galley/Bridge, Cabin Corridor). Pipe lives here — ritual step 1. |
| **Bar** | Coke is served here — minigame 1 (CokeDrink). Bartender NPC. |
| **Galley** | Dinner service (ritual step 2) + scuba hatch (minigame 2). |
| **Bridge** | Motorboat (minigame 3) + Mermaid Shower (ritual step 3). |
| **Cabin Corridor** | Lullaby (minigame 4) + Mermaid Nap (ritual step 4, final). |

Rooms share the palette and tile shapes; differentiation is by floor tone and door placement, not by new color families.

---

## 5. UI widget library

Cody On A Boat uses **two reusable plain-JS widgets** (not Phaser scenes) plus a small set of shared primitives. New minigames should reach for these widgets before inventing new ones.

### RhythmBar (`src/ui/RhythmBar.js`)

A horizontal note-and-hit-zone rhythm lane.

- **Layout**: dark-gray lane (`0x222222` fill, `0x444444` stroke). Hit zone is a thin 4 px green vertical line (`0x40c040`) a few pixels in from the left edge. A translucent green hit-window cue (`0x40c040` @ 0.2 alpha) sits on top of the hit zone.
- **Notes**: 8 × 8 red squares (`0xff0000`) spawn at the right and tween left across the lane over exactly **1500 ms**.
- **Hit window**: ± **150 ms** around the moment a note crosses the hit zone. Tapping inside the window flashes the note white (`0xffffff`), then pale green (`0x88ff88`) after 100 ms. Missed notes turn dark red (`0x660000`).
- **Used by**: CokeDrinkGame, LullabyGame.

### PowerMeter (`src/ui/PowerMeter.js`)

A fillable bar with color-thresholded fill and configurable decay.

- **Layout**: 1 px white border, transparent interior, colored fill growing from one side (left for horizontal, bottom for vertical).
- **Color thresholds**: green (`0x40c040`) when ≥ 50% full, yellow (`0xc0c040`) between 25–50%, red (`0xc04040`) under 25%.
- **API**: `add(delta)` bumps the value up, `decay(deltaMs)` drains it over time (called from `update(time, delta)`). `value` is a plain property.
- **Inverted semantics pattern**: MermaidNap flips the reading — it starts the bar at 100 ("asleep = good = green") and subtracts on each miss, so the bar visually reads "green safe → red wake-up = lose" even though the underlying meter is depleting.
- **Used by**: PipeSmoke (horizontal, grow-to-win), MotorboatGame (vertical, grow-to-win), MermaidNap (horizontal, inverted).

### Shared primitives

- **Dialog box**: bottom-aligned 256 × 64 rectangle at `(128, 192)`, `0x000000` @ 0.75 alpha, depth 500. Text at `(8, 168)`, 8 px monospace white, 240 px word-wrap. Typewriter at 30 ms per character; tap fast-forwards to the full line, the next tap advances.
- **HUD** (`HUDScene`): failure counter at `(4, 4)` top-left; objective text at `(252, 4)` top-right, right-aligned. Both 8 px monospace white.
- **Touch controls** (mobile): d-pad buttons 32 × 32 px, action buttons 44 × 28 px, semi-transparent white (`0xffffff` @ ~0.3 alpha) with 1 px white stroke.
- **Win / Lose overlay**: 256 × 224 colored rectangle at 0.6 alpha, 24 px monospace white centered label, destroyed after 1200 ms.
- **Interact `!` marker**: 10 px monospace `#ffff00`, floating above trigger tiles and NPCs the player can engage. Disappears once a minigame is completed.

### Animation vocabulary

| Motion | Duration | Easing |
|---|---|---|
| Player walk (per tile) | 150 ms | Linear |
| Room fade-in | 300 ms | default |
| TransitionScene title card | ~2000 ms | linger then skip |
| Dialog typewriter | 30 ms per character | |
| Win / Lose overlay hold | 1200 ms | |
| Fail-cutscene screen shake | 1000 ms @ 0.01 intensity | |
| Fail-cutscene Cody spin | 1500 ms, rotate 720°, scale × 6 | Quad.In |
| Fail-cutscene beats | Hurricane @ 1500 ms, Aquaman @ 4000 ms, Retry @ 7000 ms | |
| Victory fade-in | 1000 ms | |
| Victory credits scroll | 12 000 ms | Linear |

---

## 6. Audio language

Playback: BGM at ~0.4 volume, SFX at ~0.7 volume, held until the first user gesture unlocks the browser autoplay policy (`MusicManager.js`).

### Background music — mood descriptors

| Track | Mood | Plays during |
|---|---|---|
| `bgm-overworld` | Calm, exploratory, slightly silly | Main menu and boat exploration |
| `bgm-minigame` | Urgent, playful, mid-tempo | Every minigame and ritual step |
| `bgm-underwater` | Atmospheric, muffled, dreamy | Reserved slot for scuba sequences |
| `bgm-fail` | Dramatic, ominous, spooky | Fail cutscene |
| `bgm-victory` | Peaceful, resolved, warm | Victory cutscene |

### Sound effects

| SFX | Role |
|---|---|
| `sfx-howl` | Cody's werewolf howl (CokeDrink rhythm beat, MermaidNap noise) |
| `sfx-splash` | Water (MermaidShower nudges, ScubaDive events) |
| `sfx-puff` | Pipe inhale feedback (PipeSmoke tap) |
| `sfx-ding` | Generic success tick |
| `sfx-buzz` | Generic warning / shush feedback |
| `sfx-hurricane` | Cutscene wind whoosh (fail mode) |

Pick sounds by mood, not filename. When introducing a new interaction, map it to the closest existing SFX before adding a new one.

---

## 7. Features ↔ aesthetics map

The composition pattern: each interactive sequence binds a **room + UI widget + BGM + hero palette**. Use this table as the template when designing new content.

| # | Sequence | Ritual? | Room | Widget | BGM | Hero palette |
|---|---|---|---|---|---|---|
| 1 | CokeDrink | no | Bar | RhythmBar | bgm-minigame | Cody green `0x40c040`, Coke red |
| 2 | PipeSmoke | yes — step 1 | Main Deck | PowerMeter (H, grow-to-win) | bgm-minigame | Pipe brown, puff white |
| 3 | ScubaDive | no | Galley hatch | Arcade physics + touch d-pad | bgm-minigame (underwater slot reserved) | K-fish gold, K-fish red |
| 4 | DinnerService | yes — step 2 | Galley | Button choices, no timer | bgm-minigame | Neutral palette |
| 5 | Motorboat | no | Bridge | PowerMeter (V, grow-to-win) + L/R buttons | bgm-minigame | Meter greens + warnings |
| 6 | MermaidShower | yes — step 3 | Bridge | Temperature slider with hold-direction buttons | bgm-minigame | Blue→cyan→green→orange→red zone gradient |
| 7 | Lullaby | no | Cabin Corridor | RhythmBar | bgm-minigame | Mermaid pink |
| 8 | MermaidNap | yes — step 4 | Cabin Corridor | PowerMeter (H, inverted) | bgm-minigame | Cody green + noise colors |

### Cutscene arcs

- **Fail**: screen shake → Cody sprite spins 720° while scaling × 6 → hurricane overlay (`0x203040` + rotating gray `0x606060` circle) with `HURRICANE` / `FLORIDA SINKS` text → black wipe → Aquaman throne (`0x40a0a0` with `0xffff80` trim) with `CODY RULES THE DEEP` / `FLORIDA IS NO MORE.` → `RETRY` button. 7 s total, then SPACE / ENTER / tap returns to menu.
- **Victory**: fade in on beach (sky `0x60a0ff` + sun `0xfff080` + sand `0xf0d080` + Cody sprite) → credits scroll bottom-to-top over 12 s, ending on `CODY GOT OFF THE BOAT.` → auto-return to menu. Input skip armed after a 400 ms grace delay.

### Sequence enforcement

The ritual must be completed in order: **Pipe → Dinner → Shower → Nap**. Triggering a ritual step out of sequence fires the fail cutscene immediately, with no warning. The order is communicated only through NPC dialog hints and environmental cues — not a tutorial popup, not an inventory, not a checklist. Failing any five minigames cumulatively also triggers the fail cutscene (`FAILURE_THRESHOLD = 5`).

---

## 8. Extension patterns

### Designing a new character

- Start from a 16 × 16 silhouette with one dominant color from the character palette.
- Pick a fallback rectangle color that reads at-a-glance against `0x0a0e27` navy (overworld) and `0x000020` minigame background.
- Keep detail coarse — eyes and hats are readable, individual hairs are not.
- If the character is an NPC, give them a one-to-three-line dialog block in the terse-mystical register and a `!` marker while the player hasn't engaged them.

### Designing a new room

- Stay on the 16 × 14 tile grid. Use the room's own `floor/wall/door` triad if it has one, or the generic triad otherwise.
- Place doors to adjoining rooms at tile positions that match the target room's spawn point.
- Decorate sparsely — rectangles, sprites, and maybe one or two set-piece objects. The room's identity comes from its floor tone and its inhabitants, not from visual density.
- Place trigger tiles for any minigame or ritual step inside the room.

### Designing a new minigame

- Reach for RhythmBar or PowerMeter before inventing a new widget. Only build a custom mechanic if neither fits (ScubaDive and MermaidShower are the only two currently in that category).
- Write an all-caps imperative instruction string (`TAP TO ...`, `SHUSH THE ...`).
- Pick a hero color for the core object from the existing palette and use the win/lose overlay colors unchanged.
- Play `bgm-minigame` and pick one existing SFX per gameplay event.
- Err on the forgiving side: generous hit windows, slow decay, no instant-fail states. The game's difficulty target is "casual mobile playthrough in 15–30 min."

### Designing a new cutscene

- Build from flat rectangles, circles, triangles, and text — Phaser graphics primitives — with optional PNG sprites layered on top when available.
- Use the existing cutscene beat timings (1.5 s, 4 s, 7 s, 12 s) unless you have a reason to deviate.
- Text is all-caps declarative, 10–16 px monospace, centered. Color-code by mood: white for neutral, red-tint for alarm, pale-yellow for triumphant trim.

---

## 9. Principles

- **Flat pixel over rendered detail.** SNES-era silhouettes, not modern illustration. If a sprite needs anti-aliasing to read, redesign the silhouette instead.
- **Zero-asset playability.** Every visual element must degrade to a flat colored rectangle. Art is additive polish, never a hard dependency.
- **Absurdist deadpan.** Commit to the premise. No winking, no meta-jokes, no tutorial-voice explanations of why any of this is happening.
- **Reach for existing widgets.** RhythmBar and PowerMeter compose most interactions. New widgets are rare and should earn their place.
- **Mobile-first ergonomics.** 32 × 32 d-pad, 44 × 28 action buttons, pointer-driven everything. The 256 × 224 canvas scales down to portrait phones — design for thumb reach.
- **Forgiving difficulty.** This is a 15–30 minute inside joke for a friend group, not a skill test. Wide hit windows, slow decay, five-failure budget.
- **Free and referenceable.** All source art and audio is CC0 or CC-BY only. When recommending references, stay inside that license bubble.

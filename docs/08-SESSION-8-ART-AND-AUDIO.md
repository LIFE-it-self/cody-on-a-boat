# Cody On A Boat — Session 8: Art + Audio Pass

> **For the human (you):** This is Session 8 of 10. **Pre-work for this session:** before opening Claude Code, do the asset gathering listed in the "Pre-session asset gathering" block below. It will take 30–60 minutes and you don't need Claude Code for it. Then open a fresh Claude Code chat in your `cody-on-a-boat` directory and paste everything below the `---` line.

---

## Pre-session asset gathering (do this BEFORE the Claude Code chat)

You need a small pile of free art and audio. Don't make Claude Code wait while you go hunting — gather these into a temporary folder on your desktop first, then we'll drop them into the project together.

**Where to put them while gathering:** make a folder on your Desktop named `cody-on-a-boat-assets-incoming`. Put everything in there.

### Sprites
- **Captain Chowder John (16×16):** generate 1 sprite at [pixellab.ai](https://pixellab.ai) (paid, ~$5/mo subscription) with a prompt like "16x16 pixel art of a chubby pirate captain with a big white beard, blue coat, navy hat, top-down view, 4-direction walk cycle". OR draw it yourself in [Piskel](https://www.piskelapp.com/) (free, browser).
- **Cody (16×16):** same approach. Prompt: "16x16 pixel art of a friendly bearded man with brown hair, t-shirt, top-down view". One sprite is enough.
- **Cody werewolf (16×16):** same approach. Prompt: "16x16 pixel art werewolf, gray fur, glowing red eyes, fangs".
- **Cody Aquaman (16×16):** "16x16 pixel art man with golden trident, scale armor, crown, top-down view".
- **Mermaids (16×16, 2 variants):** "16x16 pixel art mermaid, pink hair, green tail, top-down view".
- **K-fish (16×16):** draw in Piskel. Make it literally fish-shaped but with an obvious K. Two versions: gold and red.

### Tilesets
- **Boat interior tileset:** download [Anokolisa's 16×16 RPG asset pack](https://anokolisa.itch.io/) (free or pay-what-you-want). Use the dungeon/cave tiles with a recolored palette OR find a free nautical tileset on itch.io.
- **UI elements:** download the [Kenney Pixel UI Pack](https://kenney.nl/assets/ui-pack-pixel) (CC0).

### Cutscene illustrations
- **Hurricane / Florida sinking:** generate or draw a single 256×224 (or larger, will be scaled) image. Doesn't need to be pixel art — can be any style. You can use any image generator (OpenAI Image, Midjourney, etc.) or draw it.
- **Cody as Aquaman on coral throne:** same — single illustration.

Save them as `hurricane.png` and `aquaman.png`.

### Audio
- **5 background music tracks (CC0/CC-BY):**
  - Overworld (calm boat music)
  - Minigame (urgent / playful)
  - Underwater (atmospheric)
  - Victory (peaceful)
  - Fail (dramatic / spooky)
  Source: [OpenGameArt](https://opengameart.org/) — filter by CC0 license. Save them as MP3 or OGG, ~30 seconds each looped is fine.
- **6 sound effects (CC0):**
  - Howl, Splash, Puff, Ding (success), Buzz (fail), Hurricane wind
  Source: [Kenney Audio](https://kenney.nl/assets/category:Audio) (CC0). Save as WAV or OGG.

### Checklist before opening Claude Code

You should have:
- [ ] `~/Desktop/cody-on-a-boat-assets-incoming/sprites/` with: captain.png, cody.png, cody-werewolf.png, cody-aquaman.png, mermaid-1.png, mermaid-2.png, k-fish-gold.png, k-fish-red.png
- [ ] `~/Desktop/cody-on-a-boat-assets-incoming/tilesets/` with: boat-tileset.png (or several PNGs)
- [ ] `~/Desktop/cody-on-a-boat-assets-incoming/cutscenes/` with: hurricane.png, aquaman.png
- [ ] `~/Desktop/cody-on-a-boat-assets-incoming/audio/` with: bgm-overworld.mp3, bgm-minigame.mp3, bgm-underwater.mp3, bgm-victory.mp3, bgm-fail.mp3, sfx-howl.wav, sfx-splash.wav, sfx-puff.wav, sfx-ding.wav, sfx-buzz.wav, sfx-hurricane.wav

If you can't get all of these, do what you can. The session will adapt — anything missing stays as a placeholder.

---

You are helping me build **Cody On A Boat**. This is **Session 8 of 10**. The game is functionally complete after Session 7. This session is the **art and audio pass**: replace placeholder rectangles with real sprites, drop in real cutscene illustrations, add background music and sound effects, and add NPC hint dialog scattered through the boat. **No new mechanics in this session.**

I am not a software engineer — be explicit, ask permission for file operations and bulk changes.

## Goal of this session

By the end of this session:
- All player/NPC sprites are real pixel art (or as much as I had time to gather).
- The boat tileset replaces the colored floor/wall rectangles.
- The K-fish is a proper sprite (gold + red variants).
- The hurricane and Aquaman cutscene illustrations are loaded and displayed.
- Background music plays in each scene context (overworld, minigame, underwater, victory, fail).
- Sound effects fire on minigame events (puff, hit, splash, etc.).
- 4–5 NPCs scattered across rooms have dialog hinting at the ritual order.
- The game looks and sounds shippable.

## Where we are

Sessions 1–7 complete. The game is **functionally finished** with placeholder art:
- All 8 interactive sequences (4 minigames + 4 ritual steps) work.
- Win and fail cutscenes work.
- 5 boat rooms connected by doors.
- Sequence guard prevents wrong-order ritual attempts.
- HUD, dialog system, full state management.

## Required reading

1. `CLAUDE.md`
2. `docs/GAME-DESIGN.md` — section 9 "Art strategy"
3. `docs/PHASE_LOG.md` — what's in the project right now
4. Skim `src/scenes/` to see where the placeholders are — every `add.rectangle`, `add.circle`, and `add.graphics` call is a candidate for replacement

## Hard constraints

- **No new npm packages** (Phaser already handles audio).
- **No mechanic changes.** If something feels mechanically off, write a TODO in PHASE_LOG.md but do not "fix" it this session.
- **Only use CC0 / CC-BY assets.** If something doesn't have a clear license, do not use it.
- **Preserve placeholder paths as fallbacks.** If a sprite fails to load, the game shouldn't crash — it should fall back to the colored rectangle. Do this with a try/catch in the loader OR by checking texture existence in the scene.
- **All assets go in `public/assets/`** — Vite serves this folder at the root.

## Tasks for this session

### Task 1: Sanity check + asset transfer

```bash
git status
git pull
```

Then ask me to confirm the assets are in `~/Desktop/cody-on-a-boat-assets-incoming/`. List the contents. Then **walk me through copying the files into the project's `public/assets/` folders** with explicit `cp` commands. Don't copy in bulk — copy a few at a time and verify after each.

Final destination structure:

```
public/assets/
├── sprites/
│   ├── captain.png
│   ├── cody.png
│   ├── cody-werewolf.png
│   ├── cody-aquaman.png
│   ├── mermaid-1.png
│   ├── mermaid-2.png
│   ├── k-fish-gold.png
│   └── k-fish-red.png
├── tilesets/
│   ├── floor.png
│   ├── wall.png
│   └── door.png       (or one tileset PNG with all)
├── cutscenes/
│   ├── hurricane.png
│   └── aquaman.png
├── ui/
│   └── (Kenney UI files I want to use)
└── audio/
    ├── bgm-overworld.mp3
    ├── bgm-minigame.mp3
    ├── bgm-underwater.mp3
    ├── bgm-victory.mp3
    ├── bgm-fail.mp3
    ├── sfx-howl.wav
    ├── sfx-splash.wav
    ├── sfx-puff.wav
    ├── sfx-ding.wav
    ├── sfx-buzz.wav
    └── sfx-hurricane.wav
```

If something is missing, note it and proceed. The fallback for missing files is the placeholder we already have.

### Task 2: Update BootScene to preload everything

Open `src/scenes/BootScene.js`. Add `this.load.image('captain', 'assets/sprites/captain.png')` etc. for every sprite, tileset, and cutscene we have. Add `this.load.audio('bgm-overworld', 'assets/audio/bgm-overworld.mp3')` etc. for every audio file.

For each file, **wrap in a check**: only load if you can verify the file exists, OR add an error handler that logs a warning and skips. The goal is "missing asset doesn't crash the game."

In `create()`, after the load completes, transition to MainMenuScene as before.

### Task 3: Replace placeholder sprites in OverworldScene

Open `src/scenes/OverworldScene.js`. The room is currently rendered with `add.rectangle` per tile. Replace with:

```javascript
const tex = (tileVal === 1) ? 'wall' : (tileVal === 2) ? 'door' : 'floor';
this.add.image(x, y, tex).setOrigin(0);
```

If the texture isn't loaded (asset missing), fall back to the rectangle. Keep the depth values the same.

The Player sprite in `src/objects/Player.js`: replace the rectangle with a sprite if the `'captain'` texture is loaded:

```javascript
if (scene.textures.exists('captain')) {
  this.sprite = scene.add.sprite(x, y, 'captain');
} else {
  this.sprite = scene.add.rectangle(x, y, TILE_SIZE, TILE_SIZE, COLORS.PLAYER);
}
```

Same pattern for Cody NPC and Mermaid NPC objects.

### Task 4: Replace sprites in minigames

Open each minigame file and find the placeholder rectangles. Replace with sprites where appropriate:

- **CokeDrinkGame.js**: Cody → cody sprite. Werewolf form → cody-werewolf sprite. Moon → could stay as a circle or load a moon sprite if you have one.
- **PipeSmoke.js**: Cody → cody sprite. Pipe → small custom sprite or stay as rectangle (it's tiny).
- **ScubaDiveGame.js**: Cody → cody sprite (no swap needed since the player is just Cody underwater). K-fish → k-fish-gold and k-fish-red sprites. Replace the programmatic Container/Graphics with `this.physics.add.sprite(x, y, 'k-fish-gold')`.
- **DinnerService.js**: Mostly text, no sprite changes needed. Optionally add a small Cody at the bottom.
- **MotorboatGame.js**: Cody → cody sprite (face pressed against dashboard). Mermaids → mermaid-1 and mermaid-2 sprites.
- **MermaidShower.js**: Cody → cody sprite. Mermaids → mermaid sprites.
- **LullabyGame.js**: Cody → cody sprite. Mermaids → mermaid sprites.
- **MermaidNap.js**: Cody → cody sprite (sleeping). Mermaids → mermaid sprites.
- **CutsceneScene.js**: Replace the placeholder rectangle in the fail flow with the loaded `cutscene-hurricane` and `cutscene-aquaman` images. Replace the placeholder rectangles in the victory flow with a beach scene (use whatever you have or hand-draw a quick sky/sand if needed).

For each replacement, fall back gracefully if the texture is missing.

### Task 5: Add background music

In each scene's `create()`, start the appropriate background music:

```javascript
// MainMenuScene
this.music = this.sound.add('bgm-overworld', { loop: true, volume: 0.5 });
this.music.play();

// In shutdown / scene change:
this.events.on('shutdown', () => this.music?.stop());
```

Music routing:
- **MainMenuScene** → bgm-overworld
- **OverworldScene** → bgm-overworld (don't restart if already playing — track via registry)
- **CokeDrinkGame, PipeSmoke** → bgm-minigame
- **ScubaDiveGame** → bgm-underwater
- **DinnerService, MotorboatGame, MermaidShower, LullabyGame, MermaidNap** → bgm-minigame
- **CutsceneScene mode='victory'** → bgm-victory
- **CutsceneScene mode='fail'** → bgm-fail

**Important:** when transitioning between scenes that share the same music track, don't restart it. Use `game.registry.get('currentMusicKey')` to track what's playing and only switch if different.

### Task 6: Add sound effects

Sprinkle SFX in the right places:

- **CokeDrinkGame**: `sfx-howl` on each successful hit.
- **PipeSmoke**: `sfx-puff` on each tap.
- **ScubaDiveGame**: `sfx-splash` on each gold fish collected. `sfx-buzz` on red fish hit.
- **DinnerService**: `sfx-ding` on correct, `sfx-buzz` on wrong.
- **MotorboatGame**: `sfx-splash` on tap (low volume to avoid overload).
- **MermaidShower**: `sfx-splash` on each splash event.
- **LullabyGame**: `sfx-ding` on each successful hit.
- **MermaidNap**: `sfx-ding` on each successful shush, `sfx-buzz` on each missed shush.
- **CutsceneScene fail**: `sfx-hurricane` once at the start.

Volume normalization: SFX at 0.7, BGM at 0.4. Tune as needed.

### Task 7: Environmental hint dialog

Add NPC dialog hints scattered through the rooms. The goal: a player who reads the hints can figure out the ritual order without ever being told directly.

Edit `src/data/dialogs.js` to add:

```javascript
'bar-bartender': {
  speaker: 'Ghost Bartender',
  lines: [
    'Coke first, captain. Always Coke first.',
    'The pipe wants its smoke after the howl.',
  ],
},
'galley-mermaid-2': {
  speaker: 'Cooking Mermaid',
  lines: [
    'Smell that pipe smoke? Good.',
    'Now find the K-fish before you eat. They are slippery.',
  ],
},
'bridge-parrot': {
  speaker: 'Parrot',
  lines: [
    'BLOW THE BOAT. *squawk* SHOWER.',
    'WET CODY. THEN SLEEPY CODY. *squawk*',
  ],
},
'cabin-ghost': {
  speaker: 'Cabin Ghost',
  lines: [
    'The lullaby first. Then the nap.',
    'Cody must be tired before he can sleep.',
  ],
},
```

Place corresponding NPCs (using the existing Cody-style NPC class with different color rectangles or a sprite if you have one) in the right rooms. Update the room data in `rooms.js` if needed.

### Task 8: Final playthrough

Do a complete playthrough with sound on:
1. Main Menu plays music.
2. All minigames play their respective music and SFX.
3. All sprites render correctly (or fall back to rectangles cleanly if missing).
4. Cutscenes look like cutscenes, not programmer art.
5. Hint dialog points at the ritual order.
6. Victory cutscene plays the right music.
7. Fail cutscene plays the right music.

## Verification

- [ ] Game boots and shows real art (or graceful fallbacks for any missing assets).
- [ ] Music plays in MainMenu and continues into OverworldScene without restarting.
- [ ] Music switches in minigames and back in overworld.
- [ ] All sound effects fire on the right events.
- [ ] Hurricane and Aquaman cutscenes show the real images.
- [ ] Victory cutscene has a beach scene (real or quick-drawn).
- [ ] At least 3 hint NPCs exist and can be talked to.
- [ ] Full playthrough on desktop completes without errors.
- [ ] No regressions: all sequence guards, win/lose conditions, retry/reset still work.
- [ ] `git status` shows only new asset files and modified scene files.

## Before ending the session

### 1. Update `CLAUDE.md`

In Architecture:

```
- Asset preload happens in BootScene. All textures and audio are keyed by string and looked up in scene create() methods.
- Music is single-instance, tracked via `game.registry.get('currentMusicKey')`. Only switch if scene needs a different track.
- Missing-asset fallbacks: every sprite creation checks `scene.textures.exists(key)` and falls back to the original placeholder shape.
```

In Current phase:

```
Session 8 complete. Art and audio pass done. Game looks and sounds shippable. Real cutscene illustrations in place. NPC hints scattered. Next: Session 9 — mobile polish, cross-browser, PWA.
```

In a new section "Asset inventory":

```
## Asset inventory (loaded by BootScene)
Sprites: captain, cody, cody-werewolf, cody-aquaman, mermaid-1, mermaid-2, k-fish-gold, k-fish-red
Tiles: floor, wall, door
Cutscenes: cutscene-hurricane, cutscene-aquaman
BGM: bgm-overworld, bgm-minigame, bgm-underwater, bgm-victory, bgm-fail
SFX: sfx-howl, sfx-splash, sfx-puff, sfx-ding, sfx-buzz, sfx-hurricane
(Note any that are still missing as TODO)
```

### 2. Update `docs/PHASE_LOG.md`

Add a Session 8 row. In the notes block, list any assets that are still placeholder + why (couldn't find one, ran out of time, etc.).

### 3. Commit and push

```bash
git add .
git commit -m "Session 8: art + audio pass — real sprites, music, SFX, hint dialog"
git push
npm run deploy  # re-deploy to gh-pages so we can sanity check the deployed version
```

### 4. Confirm

"Session 8 complete. Game looks and sounds like a real game. Open `docs/09-SESSION-9-MOBILE-POLISH.md` when you're ready."

## Troubleshooting

**Phaser fails to load an image with a CORS error.**
You're not loading from a remote URL — paths are relative to `public/`. The image isn't where you think. Check `public/assets/sprites/captain.png` exists.

**Music doesn't play in Safari/Chrome on first scene.**
Browsers block autoplay until user interaction. Music starts on the FIRST user click — typically the "Start" button on MainMenuScene. Move music start to the Start handler if needed.

**Music restarts every time you change rooms.**
You're calling `this.sound.add` in each scene's create(). Use the registry to share the music object, OR call `this.sound.get(key)?.play()` and check if it's already playing.

**Sprite is the wrong size after replacing the rectangle.**
The new sprite might not be 16×16. Use `sprite.setDisplaySize(16, 16)` to force the size, OR resize the source PNG to 16×16.

**SFX overlap loudly when tapping rapidly in MotorboatGame.**
Set a cooldown: only play sfx-splash if 80ms have passed since the last play. `if (this.time.now - this.lastSplashTime > 80) { this.sound.play('sfx-splash'); this.lastSplashTime = this.time.now; }`

**Hurricane cutscene image is stretched / wrong aspect ratio.**
The PNG isn't 256×224. Either resize the source, or use `setDisplaySize(256, 224)` on the image.

**Some assets missing — what now?**
That's fine. Note them in PHASE_LOG.md as TODO. The fallback rectangles still work. We can swap them in a future minor session.

## What's next

**Session 9 — Mobile + Cross-Browser Polish.** Test on a real phone. Fix any touch issues. Add a PWA manifest so friends can "Add to Home Screen". Test on Safari and Firefox. Difficulty tuning. After Session 9, the game is ready to ship.

---

**End of Session 8 instructions. Start with Task 1.**

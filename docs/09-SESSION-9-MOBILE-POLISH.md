# Cody On A Boat — Session 9: Mobile + Cross-Browser Polish

> **For the human (you):** This is Session 9 of 10. **Pre-session prep:** before opening Claude Code, make sure you have your phone handy AND know how to find your computer's local IP address (so the phone can connect to the dev server). Open a fresh Claude Code chat in your `cody-on-a-boat` directory and paste everything below the `---` line.

---

You are helping me build **Cody On A Boat**. This is **Session 9 of 10**. The game is functionally complete and visually polished after Session 8. This session is about making it **work well on a phone** and **across browsers**, plus a PWA manifest for "Add to Home Screen", plus difficulty tuning.

I am not a software engineer — be explicit, ask permission, no surprises.

## Goal of this session

By the end of this session:
- The game runs smoothly on my actual phone (real device, not just emulator) connected via local network to the dev server.
- Touch input is comfortable for every minigame — no thumb-cramping rapid-tap, no impossible hit windows.
- The game scales correctly in both portrait and landscape on a phone.
- The deployed gh-pages URL works in Chrome, Safari, and Firefox without errors.
- A **PWA manifest** (`manifest.webmanifest`) and a **service worker** are added so friends can "Add to Home Screen" on their phones and the game runs offline after first load.
- All minigame difficulty values have been playtested and tuned (config in `src/data/levels.js` and `src/constants.js`).
- The game is **ready to ship** after Session 10.

## Where we are

Sessions 1–8 complete:
- Functionally complete game with real art and audio.
- Deployed to GitHub Pages (Sessions 1 + 8).
- Tested on desktop Chrome.

## Required reading

1. `CLAUDE.md`
2. `docs/GAME-DESIGN.md` — section 8 (resolution / scaling)
3. `docs/PHASE_LOG.md`

## Hard constraints

- **No new mechanics.** If a minigame feels broken on mobile, tune it or simplify the input — don't redesign it.
- **One new dependency allowed**, and only if needed: `vite-plugin-pwa` for the service worker. Approve with me first before installing.
- **No regressions on desktop.** Every fix that helps mobile must continue to work on desktop.
- **All tuning lives in config**, not hardcoded in scene logic. If a number is hardcoded somewhere and you're tuning it, lift it to `levels.js` or `constants.js` first.

## Tasks for this session

### Task 1: Sanity check + setup phone testing

```bash
git status
git pull
npm run dev -- --host
```

The `--host` flag makes Vite listen on all network interfaces, not just localhost. Vite will print two URLs: a `Local:` and a `Network:` one. The Network URL is what you'll use from your phone.

**Help me find my computer's local IP** if Vite doesn't print one. On macOS: `ipconfig getifaddr en0` (Wi-Fi) or `ipconfig getifaddr en1`.

Then have me:
1. Open the Network URL on my phone's browser (e.g., `http://192.168.1.42:5173/`).
2. Confirm the game loads.
3. Try playing the first minigame on the phone.

If anything is broken or unplayable, document it as a TODO and we'll address each one.

### Task 2: Touch input audit

Go through each minigame and confirm touch input works comfortably:

- **OverworldScene direction buttons:** are they big enough to hit reliably with a thumb? Are they positioned so my thumb isn't in the way of seeing the player? Goal: 32×32 minimum, in a comfortable bottom-corner cluster.
- **CokeDrinkGame rhythm tap:** the entire screen should be a tap target. Confirm.
- **PipeSmoke puff:** entire screen is a tap target.
- **ScubaDiveGame movement:** the joystick or direction buttons must work without the player accidentally tapping a fish overlay. Test for accidental misfires.
- **DinnerService menu buttons:** big enough to read on a phone. The text needs to fit. If "Deconstructed Ocean Foam with Truffle Mist" is longer than the button, wrap it or shorten.
- **MotorboatGame:** the rapid-tap buttons (L/R) must be large and far apart. On a phone, both thumbs need to reach without conflict. Make them ~48×48 each, in opposite bottom corners.
- **MermaidShower:** left/right buttons need to be hold-able comfortably. Same as Motorboat — corner placement.
- **LullabyGame:** entire screen tap target.
- **MermaidNap:** entire screen tap target.

For each issue, fix in the relevant scene file. Common fixes:
- Increase button size via `.setDisplaySize(48, 48)` or by re-creating the rectangle larger.
- Reposition with explicit coordinates relative to the 256×224 canvas.
- Add padding from screen edges (don't put buttons against the edge — phone case bumps the edge).

### Task 3: Responsive scaling

The Phaser config uses `Phaser.Scale.FIT`, which preserves aspect ratio by adding letterbox bars. On a tall phone in portrait, this means the game is centered with big black bars on top/bottom. That's fine.

Things to verify:
- [ ] Portrait mode: game centered, scaled to fit width, sharp pixels.
- [ ] Landscape mode: game centered, scaled to fit height, sharp pixels.
- [ ] Rotating the phone: the game re-fits without crashing or going blank.
- [ ] On iOS Safari: no weird "click to enter fullscreen" behavior unless we explicitly want it.

If portrait mode looks bad (way too zoomed out), add a "rotate to landscape" hint overlay that appears only when `window.innerHeight > window.innerWidth`. A simple full-screen overlay with text "Rotate to landscape for the best experience". Dismissible by tap.

### Task 4: Cross-browser test

Open the **deployed gh-pages URL** in:
1. Chrome (desktop)
2. Safari (desktop)
3. Firefox (desktop)
4. Safari (iPhone, if you have one)
5. Chrome (Android, if you have one)

For each, play through one full minigame. Note any issues. Common Safari issues:
- **Audio doesn't play until first user interaction.** The "Start" button should kick off the music — if it doesn't, the music key isn't being played from inside an event handler. Move the first `this.sound.play()` call into the Start button's `pointerdown` handler.
- **`<canvas>` rendering looks blurry.** Confirm `image-rendering: pixelated` made it into the CSS in `index.html`.
- **`ogg`-only audio doesn't load.** Safari prefers MP3. Convert any `.ogg` BGM to `.mp3`.

Fix issues as you find them.

### Task 5: Difficulty tuning

This is the most subjective task. Have me playtest each minigame and rate it:
- ⓪ Too easy — won on first try, no effort
- ① Just right — won with effort, lost at least once
- ② Too hard — couldn't win after multiple tries
- ③ Broken — input feels wrong / impossible to win

For each that scores ⓪ or ②, tune the corresponding config value in `src/data/levels.js`:

- **CokeDrink**: tune `requiredHits` (lower = easier) or `noteTravelMs` (higher = easier).
- **PipeSmoke**: tune `puffsRequired` or `decayPerSec`.
- **ScubaDive**: tune `targetFish`, `lives`, or `fishSpawnIntervalMs`.
- **DinnerService**: hard to tune — it's binary. Reduce courses from 3 to 2 if it's too hard.
- **Motorboat**: tune `decayPerSec`, `tapPower`. This is the most likely to need adjustment because rapid-tapping varies by player.
- **MermaidShower**: tune `targetSecondsInZone`, `splashIntervalMs`, splash magnitude, `greenZone` width.
- **Lullaby**: same as CokeDrink.
- **MermaidNap**: tune `numNoises`, `wakeOnMiss`, `shushWindowMs`.

**Iterate**: tune, retest, tune. Don't over-tune in one pass. The game is for friends, so err on the side of forgiving — failing should require negligence, not bad luck.

### Task 6: Add PWA support (optional but recommended)

PWA = Progressive Web App. With a manifest and service worker, the game can be "installed" to a phone home screen, gets an app icon, and loads even offline.

Easiest path: install `vite-plugin-pwa`:

```bash
npm install --save-dev vite-plugin-pwa
```

(Ask my permission first.)

Then update `vite.config.js`:

```javascript
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['assets/**/*'],
      manifest: {
        name: 'Cody On A Boat',
        short_name: 'CodyBoat',
        description: 'Get Cody off the boat.',
        theme_color: '#0a0e27',
        background_color: '#0a0e27',
        display: 'standalone',
        orientation: 'any',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
});
```

Provide two icon PNGs at `public/icons/icon-192.png` and `icon-512.png`. They can be a simple "GB" logo on a colored background — generate or hand-draw.

After deploying, visit the gh-pages URL on a phone. In Safari (iOS), tap the share button → "Add to Home Screen". In Chrome (Android), it should prompt automatically. The game now has an app icon.

### Task 7: Final mobile playthrough

Play the entire game on the phone, start to finish, **out loud, narrating any frustration**. Have Claude Code keep notes in PHASE_LOG.md as we go. Anything that frustrates me is a tuning candidate (or a real bug).

Make every fix small and committed separately.

## Verification

- [ ] Game playable end-to-end on a real phone (not just emulator).
- [ ] All touch buttons easy to hit with a thumb.
- [ ] Portrait + landscape both work; rotation doesn't break anything.
- [ ] Game works in Safari, Chrome, Firefox on desktop.
- [ ] Music plays after first interaction in all browsers.
- [ ] PWA manifest installed (if you completed Task 6).
- [ ] Difficulty tuning passes — every minigame feels fair.
- [ ] Deploy to gh-pages with `npm run deploy` and confirm the live URL works.

## Before ending the session

### 1. Update `CLAUDE.md`

In Architecture:

```
- Game is mobile-first. All interactive elements respond to pointerdown.
- Phaser scale mode: FIT, with letterbox bars in portrait.
- PWA: yes (vite-plugin-pwa). Manifest in vite.config.js. Friends can install the gh-pages URL via "Add to Home Screen".
```

In Current phase:

```
Session 9 complete. Mobile testing done, touch tuned, cross-browser verified, PWA installed. Game is ready to ship. Next: Session 10 — production build, itch.io upload, single HTML file, QR code.
```

### 2. Update `docs/PHASE_LOG.md`

Add a Session 9 row. In notes, list every tuning change made and any bugs fixed.

### 3. Commit and deploy

```bash
git add .
git commit -m "Session 9: mobile polish, PWA, difficulty tuning"
git push
npm run deploy
```

### 4. Confirm

"Session 9 complete. Game is ready to ship. Open `docs/10-SESSION-10-SHIP.md` when you're ready."

## Troubleshooting

**`npm run dev -- --host` doesn't print a Network URL.**
Check that you're on Wi-Fi (not VPN). Try `ipconfig getifaddr en0` to find the IP manually, then visit `http://YOUR-IP:5173/` from the phone.

**Phone can't connect to the dev server.**
Both devices must be on the same Wi-Fi network. Check your firewall — macOS may block incoming connections on port 5173. System Settings → Network → Firewall → allow node.

**iOS Safari shows a "tap to play" overlay you didn't add.**
Audio context is suspended. Click anywhere first. If it persists, wrap your audio start in a click handler.

**The game scrolls / overflows on the phone.**
Add `body { overflow: hidden; touch-action: none; }` to the CSS in `index.html`. This prevents pull-to-refresh and accidental scroll.

**PWA doesn't install.**
Verify `manifest.webmanifest` is being served by checking the deployed URL + `/manifest.webmanifest`. Verify the icons exist. Verify the site is HTTPS (gh-pages is HTTPS by default).

**Difficulty tuning is endless.**
Set a deadline (15 minutes) and stop. Anything still imperfect goes into PHASE_LOG.md as a "future tune" note.

## What's next

**Session 10 — Final Build + Distribution.** Production build, re-deploy, upload to itch.io as an HTML5 game, generate a single inlined HTML file for direct sharing, generate a QR code, final end-to-end test, and DONE.

---

**End of Session 9 instructions. Start with Task 1.**

# Cody On A Boat — Session 10: Final Build + Distribution (SHIP IT)

> **For the human (you):** This is Session 10 of 10 — the final session. By the end, the game is shipped in three distribution formats and you can text the link to friends. Open a fresh Claude Code chat in your `cody-on-a-boat` directory and paste everything below the `---` line.

---

You are helping me build **Cody On A Boat**. This is **Session 10 of 10** — the final session. The game is feature-complete and polished. This session is about **shipping**: a clean production build, three distribution formats (GitHub Pages, itch.io, single HTML file), a QR code for easy sharing, and a final playthrough to confirm it all works.

I am not a software engineer — be explicit, ask permission, especially before pushing or publishing anything externally.

## Goal of this session

By the end of this session:
- A clean production build at `dist/`, under 5 MB total (target <2 MB).
- The game is **deployed to GitHub Pages** at the latest version.
- The game is **uploaded to itch.io** with a project page.
- A **single HTML file** (`cody-on-a-boat.html`) exists at the repo root, fully self-contained, double-clickable to play offline.
- A **QR code image** (`qrcode.png`) at the repo root pointing at the gh-pages URL.
- A **README.md** at the repo root with the URLs and a one-paragraph description.
- A successful end-to-end playthrough on the deployed URL from a phone.
- The game is **shippable**. You can text the link to a friend and they can play.

## Where we are

Sessions 1–9 complete:
- Game is functionally and visually complete.
- Mobile-tested, cross-browser-tested, difficulty-tuned.
- PWA-installable.

## Required reading

1. `CLAUDE.md`
2. `docs/GAME-DESIGN.md` — section 10 (Distribution)
3. `docs/PHASE_LOG.md`

## Hard constraints

- **No mechanic changes.** This session is shipping. If something is broken, fix it minimally.
- **Two new dev dependencies allowed** (with my approval):
  - `vite-plugin-singlefile` — for the inlined HTML build.
  - A QR code generator package OR a one-off Node script using a CLI tool. Either is fine.
- **Don't push anything external (itch.io upload, README to GitHub) without my OK.**

## Tasks for this session

### Task 1: Sanity check

```bash
git status
git pull
npm run dev
```

Quick playthrough of one minigame to confirm the build still works. Kill the dev server.

### Task 2: Production build + verify size

```bash
npm run build
```

Vite will output to `dist/`. After build, check the size:

```bash
du -sh dist
ls -lh dist/assets
```

Target: under 2 MB total. If it's much larger, the audio files are probably too big. Either compress them (use `ffmpeg -i input.mp3 -b:a 96k output.mp3` to re-encode at lower bitrate) or accept the larger size if it's still under 5 MB.

### Task 3: Re-deploy to GitHub Pages

```bash
npm run deploy
```

Visit `https://YOUR-USERNAME.github.io/cody-on-a-boat/` in Chrome and play one minigame. Confirm everything works on the deployed version. If anything's broken, debug from the browser console.

### Task 4: Single HTML file build

Install `vite-plugin-singlefile` (with my approval):

```bash
npm install --save-dev vite-plugin-singlefile
```

Create a second Vite config at `vite.config.singlefile.js`:

```javascript
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  base: './',
  plugins: [viteSingleFile()],
  build: {
    outDir: 'dist-singlefile',
    assetsInlineLimit: 100000000, // inline everything
    cssCodeSplit: false,
    rollupOptions: {
      output: { inlineDynamicImports: true },
    },
  },
});
```

Add a script to `package.json`:

```json
"build:singlefile": "vite build --config vite.config.singlefile.js"
```

Run it:

```bash
npm run build:singlefile
```

This produces `dist-singlefile/index.html` with everything inlined (JS, CSS, audio as base64).

**Test it:** copy the file to the repo root as `cody-on-a-boat.html`:

```bash
cp dist-singlefile/index.html ./cody-on-a-boat.html
```

Then double-click `cody-on-a-boat.html` in Finder. It should open in a browser and play the game **without any internet connection** (you can verify by toggling Wi-Fi off).

If the file is huge (>10 MB), the inlined audio is the culprit. Two options:
- Compress the audio further before building.
- Skip the single-HTML format and document that the game requires the gh-pages URL.

Add `dist-singlefile/` to `.gitignore`. Keep `cody-on-a-boat.html` tracked (it's the artifact).

### Task 5: itch.io upload

This step is **manual on my side** — Claude Code can't upload to itch.io for me. Walk me through it:

1. Tell me to go to [itch.io](https://itch.io) and sign up if I don't have an account.
2. Click "Upload new project" (or whatever the current label is).
3. Title: `Cody On A Boat`
4. Project URL slug: `cody-on-a-boat`
5. Tagline: `Get Cody off the boat.`
6. Classification: `Games`
7. Kind of project: `HTML` (so it can be embedded)
8. Pricing: `No payments`
9. **Upload:** zip up the `dist/` folder:
   ```bash
   cd dist && zip -r ../cody-on-a-boat-web.zip . && cd ..
   ```
   Upload `cody-on-a-boat-web.zip`. Mark it as "This file will be played in the browser".
10. Embed options: width 768, height 672 (3× our 256×224 internal resolution).
11. Description: write a 1-sentence description with absurdist tone.
12. Visibility: `Public` (or `Restricted` while you test).
13. Save & view page.
14. Test playing in the embed. If it works, share the URL with me.

### Task 6: QR code generation

Generate a QR code pointing at the gh-pages URL.

Easiest path: use a CLI tool that doesn't require npm:

```bash
# Option 1: use the qrencode binary (install via Homebrew)
brew install qrencode
qrencode -o qrcode.png -s 10 'https://YOUR-USERNAME.github.io/cody-on-a-boat/'
```

Or use an online QR generator (https://www.qr-code-generator.com/) and download the image as `qrcode.png`. Place it at the repo root.

Verify by opening `qrcode.png` in Preview, then scanning it with my phone's camera. It should open the game URL.

### Task 7: README.md

Replace the auto-generated README.md with a real one. Keep it short:

```markdown
# Cody On A Boat

A browser-based pixel mini-RPG. You're Captain Chowder John. Get Cody off the boat by guiding him through a four-step ritual. Get the order wrong and Cody becomes a hurricane that sinks Florida.

## Play

- **Web:** https://YOUR-USERNAME.github.io/cody-on-a-boat/
- **itch.io:** https://YOUR-USERNAME.itch.io/cody-on-a-boat
- **Single HTML:** download `cody-on-a-boat.html`, double-click. Works offline.
- **Phone:** scan the QR code below.

![QR code](qrcode.png)

## Built with

Phaser 3 + Vite + vanilla JavaScript. Free CC0 / CC-BY assets. Built with [Claude Code](https://claude.ai/code) over 10 sessions.

A game for friends. Not a commercial product.
```

(Drop the QR code image reference if you didn't generate one.)

### Task 8: Final commit + push

```bash
git add README.md cody-on-a-boat.html qrcode.png
git status
```

Show me what's about to be committed. Wait for my approval.

```bash
git commit -m "Session 10: ship — README, single HTML, QR code"
git push
npm run deploy  # final deploy with the latest README/changes
```

### Task 9: Final end-to-end playtest on the live URL

This is the moment of truth.

1. Open the gh-pages URL on my phone.
2. Play the entire game start-to-finish.
3. Verify the victory cutscene plays.
4. Reset and lose intentionally to verify the hurricane cutscene plays.
5. If both endings work, **the game is shipped.**

### Task 10: Final celebration update

Update `CLAUDE.md`:

```
## Status
SHIPPED 🚢

## Distribution channels
- gh-pages: https://YOUR-USERNAME.github.io/cody-on-a-boat/
- itch.io: https://YOUR-USERNAME.itch.io/cody-on-a-boat
- Single HTML: cody-on-a-boat.html (in repo root)
- QR: qrcode.png (in repo root)
```

Update `docs/PHASE_LOG.md`:

```
| 10 | YYYY-MM-DD | Ship | ✓ Complete | (notes) | None |
```

Notes section:

```
### Session 10 — Shipped
The game is live. Final URLs above. Ten sessions, one playable game, zero TypeScript. Friends notified.
```

### Final commit

```bash
git add CLAUDE.md docs/PHASE_LOG.md
git commit -m "Session 10: SHIPPED"
git push
```

## Verification

- [ ] Production build under 5 MB.
- [ ] gh-pages deploy works on desktop AND phone.
- [ ] itch.io upload works (or you skipped it intentionally).
- [ ] `cody-on-a-boat.html` works offline (toggle airplane mode to verify).
- [ ] QR code scans to the gh-pages URL.
- [ ] README.md is in the repo root with all the links.
- [ ] Final playthrough on a phone: pipe → dinner → shower → nap → victory cutscene.
- [ ] Final fail playthrough: lose 5 minigames OR wrong order → hurricane cutscene.
- [ ] CLAUDE.md says SHIPPED.
- [ ] PHASE_LOG.md has Session 10 row.
- [ ] You've sent the link to at least one friend and they've opened it.

## Troubleshooting

**`npm run build` fails with module errors.**
Run `rm -rf node_modules && npm install` then try again. Sometimes dependency cache rot.

**The single HTML file is 50 MB.**
Audio is the problem. Re-encode each MP3 at a lower bitrate (96k or 64k). `ffmpeg -i bgm-overworld.mp3 -b:a 64k bgm-overworld-low.mp3`. Or skip the single-HTML format and document that the game requires online access.

**gh-pages deploy fails with "Cannot push to a branch that does not exist".**
First time setup needed: `git checkout --orphan gh-pages && git push origin gh-pages && git checkout main`. Then try `npm run deploy` again.

**itch.io game doesn't load in the embed.**
The embed needs the index.html to be at the ROOT of the zip, not inside a `dist/` subfolder. Re-zip from inside `dist/`: `cd dist && zip -r ../cody-on-a-boat-web.zip . && cd ..`. The leading `.` is important.

**QR code scans to the wrong URL.**
You probably typed the URL wrong when generating it. Regenerate with the exact URL.

**Game works on gh-pages but not on the single HTML file.**
Check that the audio loaded correctly when inlined. Open the file's source — search for `data:audio/mp3` to confirm audio was inlined as base64. If not, the inline limit was too low — increase `assetsInlineLimit` in vite.config.singlefile.js.

**A friend says the game doesn't work for them.**
First questions: which browser, which device. Common: their browser blocks autoplay (need to tap once first), or they're on a corporate network blocking gh-pages (try the single HTML file or itch.io).

## What's next

**Nothing.** The game is shipped. Take a break. Tell your friends. Next thing might be:

- A tiny update session if friends find a bug.
- A "Choose Your Cody" expansion if you still want it (the scaffold is in `CodySelectScene` — re-enable + add 2–3 new sprites).
- A new minigame (re-add the cut Kitchen Prep, Navigation, or Nap Setup if you want more content).
- Anything else. The architecture is simple enough that you can extend it without re-reading all 10 session files.

Or just leave it as it is. It's a finished thing. Most projects never get this far.

---

**End of Session 10 instructions. Start with Task 1.**

🎉 _When you finish: open `docs/PHASE_LOG.md`, look at the 10 rows, then go play your game._

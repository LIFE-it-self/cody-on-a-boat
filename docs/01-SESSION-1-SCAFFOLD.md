# Cody On A Boat — Session 1: Scaffold + Deploy

> **For the human (you):** This is Session 1 of 10. Before starting, make sure you finished the **Pre-Session-1 setup** in `00-OVERVIEW.md` (Node installed, GitHub repo cloned, Claude Code installed). Then:
>
> 1. Open Terminal, run `cd ~/code/cody-on-a-boat`, then `claude` to start a Claude Code session in your project folder.
> 2. Copy **everything below the next `---` line** (Cmd+A inside this file then Cmd+C usually works, or just select from the line "You are helping me build Cody On A Boat" down to the end of file).
> 3. Paste it into the Claude Code chat as your first message and send.
> 4. Follow along, approving Claude Code's commands and edits. Read what's happening so you understand the project as it grows.

---

You are helping me build **Cody On A Boat**, a browser-based pixel-art mini-RPG in Phaser 3. This is **Session 1 of 10**. I am not a software engineer — please be explicit about every step, explain what each command and file does, and ask my permission before doing anything that touches my system, makes a commit, or pushes to GitHub.

The complete game design lives in `docs/GAME-DESIGN.md` (which doesn't exist yet — I'll be creating it in this session). The premise: player is Captain Chowder John, mission is to get Cody off the boat by completing a 4-step ritual (pipe → dinner → shower → nap) plus minigames in between. Failure or wrong order = Cody becomes a hurricane and sinks Florida. Tone is absurd inside-joke comedy. Distribution is browser-based, free, shared with friends.

## Goal of this session

By the end of this session:
- A Phaser 3 + Vite project exists in this directory.
- It has a Boot scene (loads assets, shows a progress bar) and a Main Menu scene (title + Start button).
- Running `npm run dev` opens a working game in the browser.
- The same project is **deployed to GitHub Pages** and accessible at a public URL.
- `CLAUDE.md`, `docs/GAME-DESIGN.md`, and `docs/PHASE_LOG.md` exist and are filled in.

We deploy in Session 1 (not Session 10 like the original playbook proposed) so that we discover any deployment problems before we have a real game on the line.

## Where we are right now

This is the very first session. The project directory is currently empty except for:
- A `.git` folder (the repo was cloned from GitHub).
- A `README.md` (created by GitHub when the repo was made).
- The `docs/` folder containing this file and the other session/template files (`00-OVERVIEW.md`, `GAME-DESIGN.md`, `CLAUDE-MD-TEMPLATE.md`, `PHASE-LOG-TEMPLATE.md`, all 10 session files).

Please confirm by running `ls -la` and `git status`. If anything is unexpected (like leftover files), pause and ask me before continuing.

## Tech stack (do not deviate)

- **Phaser 3.80.x** (game engine)
- **Vite** (dev server + bundler)
- **Vanilla JavaScript** (NO TypeScript — this is non-negotiable for this project)
- **gh-pages** npm package (used to deploy to GitHub Pages from the command line)
- No Tiled, no Grid Engine plugin, no other plugins

## Tasks for this session

Do these tasks in order. Pause and ask me before running each terminal command. Show me what's about to happen and wait for my OK.

### Task 1: Verify environment

Run these checks first and report the output to me:

```bash
node --version
npm --version
git --version
git status
ls -la
```

I expect Node v20+ and npm v10+. If they're missing or wrong, stop and tell me — do not try to install them yourself.

### Task 2: Scaffold the Phaser project

I want to use the official Phaser + Vite template. Run:

```bash
npm create @phaserjs/game@latest -- --template phaser-vite
```

When the wizard asks for a project name, **use a `.` (dot) to create it in the current directory** if the tool allows. If it requires a folder name, use `tmp-scaffold` and we'll move the files up afterward.

If the official wizard isn't available or fails, fall back to creating it manually:

1. `npm init -y` to create a package.json
2. `npm install phaser`
3. `npm install --save-dev vite`
4. Create the file structure described in Task 3

Either way, the result should be a project where `npm run dev` boots a Phaser 3 game in the browser.

### Task 3: Create the project structure

The final structure for this session should look like this:

```
cody-on-a-boat/
├── .git/
├── .gitignore               # ignore node_modules, dist, .DS_Store
├── README.md                # already exists (from GitHub)
├── CLAUDE.md                # NEW — copy content from docs/CLAUDE-MD-TEMPLATE.md
├── package.json
├── vite.config.js
├── index.html
├── public/
│   └── (empty for now — assets land here in Session 2+)
├── src/
│   ├── index.js             # Phaser game config + scene registration
│   ├── scenes/
│   │   ├── BootScene.js     # preload + loading bar + jump to MainMenu
│   │   └── MainMenuScene.js # title + Start button (Start currently does nothing)
│   └── (more folders added in later sessions)
└── docs/
    ├── 00-OVERVIEW.md       # already exists
    ├── GAME-DESIGN.md       # already exists (do NOT overwrite, only the project's CLAUDE.md will be created)
    ├── CLAUDE-MD-TEMPLATE.md # already exists
    ├── PHASE-LOG-TEMPLATE.md # already exists
    ├── PHASE_LOG.md         # NEW — copy content from PHASE-LOG-TEMPLATE.md
    └── (10 session files, already exist)
```

Notes:
- The `docs/` folder is already populated with reference files. You only need to **create** `CLAUDE.md` (in the project root) and `docs/PHASE_LOG.md`.
- For the contents of `CLAUDE.md`, open `docs/CLAUDE-MD-TEMPLATE.md` and copy the block between the `===` lines. Do NOT include the surrounding instructions.
- For the contents of `docs/PHASE_LOG.md`, open `docs/PHASE-LOG-TEMPLATE.md` and do the same.

### Task 4: Configure the Phaser game

Create or modify `src/index.js` to contain a Phaser game config:

- Internal resolution: **256×224**
- Pixel art mode: `pixelArt: true`
- `roundPixels: true`
- Scale mode: `Phaser.Scale.FIT`, autoCenter: `Phaser.Scale.CENTER_BOTH`
- Background color: dark navy (`#0a0e27`) — placeholder
- Renderer: `Phaser.AUTO`
- Scenes registered in this order: `BootScene`, `MainMenuScene`
- The active scene at startup is `BootScene`

Modify `index.html` so that:
- `<title>` is `Cody On A Boat`
- The body has a single canvas container `<div id="game-container"></div>` (Phaser will mount the canvas inside it)
- A `<style>` block sets `body { margin: 0; background: #000; display: flex; align-items: center; justify-content: center; min-height: 100vh; } canvas { image-rendering: pixelated; image-rendering: crisp-edges; }`
- The `<script type="module" src="/src/index.js"></script>` is in the body

### Task 5: BootScene

Create `src/scenes/BootScene.js`:

- It's a Phaser Scene with key `'BootScene'`.
- In `preload()`, load any tiny placeholder asset (a 1×1 pixel PNG generated as a data URI is fine, OR skip preloading entirely and just transition to the next scene).
- Show a simple loading bar drawn with `this.add.graphics()` — even if there's nothing to load, the user should see "Loading..." for ~500ms so the transition feels intentional.
- In `create()`, after a 500ms `this.time.delayedCall`, call `this.scene.start('MainMenuScene')`.

### Task 6: MainMenuScene

Create `src/scenes/MainMenuScene.js`:

- Key: `'MainMenuScene'`.
- In `create()`, draw:
  - A title: `"CODY ON A BOAT"` in pixel-art-style text (use Phaser's bitmap text fallback or `add.text` with a sensible default font, large size).
  - A subtitle: `"Get Cody off the boat."`
  - A "Start" button — for now this is just a `Phaser.GameObjects.Text` with a rectangle background that does NOTHING when clicked except print to the console: `console.log('Start clicked — gameplay coming in Session 2')`. We'll wire it up later.
- The button should respond to BOTH `pointerdown` (click and touch) AND the `Enter` key. **Mobile-first input from day one** — add `setInteractive()` and a keyboard handler.

### Task 7: Test locally

Run `npm run dev`. It should print a localhost URL (probably `http://localhost:5173`). Open it in Chrome and confirm:

- The canvas appears centered, scaled up from 256×224 with crisp pixels (no blur).
- The loading bar shows briefly.
- The Main Menu appears with "CODY ON A BOAT", subtitle, and a clickable "Start" button.
- Clicking Start logs the message in the browser's developer console (Cmd+Option+I, Console tab).

If anything is wrong, pause and tell me — don't try to "improve" things.

### Task 8: Configure for GitHub Pages deployment

GitHub Pages serves the site at `https://USERNAME.github.io/cody-on-a-boat/`. The `/cody-on-a-boat/` part means Vite needs to know about the base path, otherwise asset URLs will be wrong.

1. Open `vite.config.js` (create it if missing). Set:
   ```javascript
   import { defineConfig } from 'vite';
   export default defineConfig({
     base: './',  // relative paths, works for both gh-pages and itch.io
     build: {
       assetsInlineLimit: 0,  // never inline images
     }
   });
   ```
2. Install the gh-pages package as a dev dependency:
   ```bash
   npm install --save-dev gh-pages
   ```
3. Add scripts to `package.json`:
   ```json
   "scripts": {
     "dev": "vite",
     "build": "vite build",
     "preview": "vite preview",
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```
   (Keep any existing scripts, just add the new ones.)

### Task 9: Initial commit and first deploy

1. Make sure `.gitignore` includes:
   ```
   node_modules/
   dist/
   .DS_Store
   *.log
   .vscode/
   ```
2. Stage everything: `git add .`
3. Show me `git status` so I can confirm what's about to be committed.
4. Commit: `git commit -m "Session 1: project scaffold + main menu"` — **wait for my OK before running this**.
5. Push to main: `git push` — **wait for my OK**.
6. Build and deploy: `npm run deploy` — **wait for my OK**. This builds the project and pushes the `dist/` folder to a `gh-pages` branch on GitHub.
7. Tell me to go to my GitHub repo, click **Settings → Pages**, and confirm that the source is set to "Deploy from a branch" and the branch is `gh-pages` (root). If it's not configured, walk me through it.
8. Wait ~1 minute, then tell me to visit `https://YOUR-USERNAME.github.io/cody-on-a-boat/` in a browser.

## Verification

Before we can call this session complete, **all** of these must be true:

- [ ] `npm run dev` shows the Main Menu in Chrome at `localhost:5173` with "CODY ON A BOAT" centered.
- [ ] The pixel rendering is crisp (no blur). Resize the window — the game should scale with integer multiples and stay sharp.
- [ ] Clicking the Start button logs `"Start clicked — gameplay coming in Session 2"` to the browser console.
- [ ] Pressing Enter on the menu logs the same thing.
- [ ] `git status` shows a clean working tree.
- [ ] `git log --oneline` shows the Session 1 commit.
- [ ] The gh-pages branch exists on GitHub (`git branch -a` shows `remotes/origin/gh-pages`).
- [ ] `https://YOUR-USERNAME.github.io/cody-on-a-boat/` loads in Chrome and shows the same Main Menu I see locally.
- [ ] `CLAUDE.md` exists in the project root and contains the content from the template.
- [ ] `docs/PHASE_LOG.md` exists.

If any of these fail, we are NOT done. Diagnose the failure together and fix it before moving on.

## Before ending the session

### 1. Update `CLAUDE.md`

In the `## Current phase` section, replace the placeholder with:

```
Session 1 complete. Phaser 3 + Vite project scaffolded. Boot and MainMenu scenes work. Deployed to https://YOUR-USERNAME.github.io/cody-on-a-boat/. Next: Session 2 — overworld with 4 boat rooms and player movement.
```

### 2. Update `docs/PHASE_LOG.md`

Add this row to the table:

```
| 1 | YYYY-MM-DD | Scaffold + Deploy | ✓ Complete | (none) | (none) |
```

Replace `YYYY-MM-DD` with today's date. Replace `(none)` in the deviations column with anything that surprised us. Replace open issues with anything we noted but skipped.

In the `### Session 1` notes section, write 2–3 sentences summarizing what was built and the public URL.

### 3. Final commit and push

```bash
git add CLAUDE.md docs/PHASE_LOG.md
git commit -m "Session 1: update CLAUDE.md and PHASE_LOG.md"
git push
```

Wait for my OK before running the commit and push.

### 4. Confirm we're done

Tell me: "Session 1 complete. Open `docs/02-SESSION-2-OVERWORLD.md` when you're ready for Session 2."

## Troubleshooting

**`npm create @phaserjs/game@latest` doesn't exist or fails.**
Fall back to manual scaffolding: `npm init -y`, `npm install phaser`, `npm install --save-dev vite`, then create `index.html`, `vite.config.js`, and the `src/` files by hand. The result should be the same — Phaser game in the browser via `npm run dev`.

**`npm run dev` fails with "command not found: vite".**
Run `npm install` first to make sure dependencies are downloaded. Then try again.

**The browser shows a blank white page.**
Open the browser dev console (Cmd+Option+I in Chrome). The error is almost always there. Common causes: wrong path to `src/index.js` in `index.html`, missing scene file, typo in scene key.

**`npm run deploy` fails with a permissions error.**
You probably haven't pushed your `main` branch yet. Run `git push -u origin main` first. Then try `npm run deploy` again.

**GitHub Pages URL shows a 404.**
Wait 2–3 minutes — first deploy can be slow. Then check Settings → Pages and confirm the branch is `gh-pages`. If still 404, try visiting `https://YOUR-USERNAME.github.io/cody-on-a-boat/index.html` directly.

**Pixels are blurry on the deployed site but crisp locally.**
Verify the `image-rendering: pixelated` CSS made it into `index.html`, and verify `vite.config.js` has `base: './'`.

## What's next

**Session 2 — Overworld + Rooms.** We'll build Captain Chowder John as a moveable sprite (a blue rectangle for now), define 4 boat rooms as JS arrays of tile IDs, render them with Phaser, and let the player walk between rooms through doors. Mobile touch controls included from the start.

---

**End of Session 1 instructions. Start with Task 1: verify the environment.**

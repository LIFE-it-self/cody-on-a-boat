# Cody On A Boat — Build Overview

**Read this file first.** It explains what Cody On A Boat is, what these documents are, and how to use them.

---

## What Cody On A Boat is

Cody On A Boat is a browser-based pixel-art mini-RPG. You play as **Captain Chowder John**. Your job: get **Cody** off the boat by guiding him through a four-step ritual — **smoke a pipe → eat a Michelin-starred dinner → shower with mermaids → nap with mermaids** — in that exact order. Between ritual steps you complete short minigames (drink-a-coke werewolf rhythm, K-fish scuba dive, motorboat face-blowing, mermaid lullaby). Get the order wrong or fail too many minigames and Cody transforms into a hurricane that sinks Florida; the credits roll over Cody on a coral throne ruling the new merfolk citizens of the deep.

It is an absurd inside joke for the developer's friend group. It is **not** a commercial product. It runs in a browser on desktop and phone, gets shared as a link or a single HTML file, and a full playthrough takes 15–30 minutes.

---

## What this `docs/` folder is

This is the **build manual**. The game does not exist yet. You will build it across **10 sessions of Claude Code**, each session a separate chat that picks up where the last left off. Every session has its own Markdown file in this folder. You will paste each session file into a fresh Claude Code chat as your first message, and Claude Code will follow the instructions to build the next slice of the game.

```
docs/
├── 00-OVERVIEW.md                  ← you are here
├── GAME-DESIGN.md                  ← reference doc, the source of truth for what the game does
├── CLAUDE-MD-TEMPLATE.md           ← starter content for the project's CLAUDE.md (copied in Session 1)
├── PHASE-LOG-TEMPLATE.md           ← starter content for PHASE_LOG.md (copied in Session 1)
├── 01-SESSION-1-SCAFFOLD.md        ← Session 1 (start here when you're ready to build)
├── 02-SESSION-2-OVERWORLD.md
├── 03-SESSION-3-MINIGAME-SHELL.md
├── 04-SESSION-4-ACT-1.md
├── 05-SESSION-5-ACT-2.md
├── 06-SESSION-6-ACT-3.md
├── 07-SESSION-7-ACT-4-AND-FAIL.md
├── 08-SESSION-8-ART-AND-AUDIO.md
├── 09-SESSION-9-MOBILE-POLISH.md
└── 10-SESSION-10-SHIP.md
```

---

## How to use the session files

For each session:

1. **Open the next session file** (start with `01-SESSION-1-SCAFFOLD.md`).
2. **Open Claude Code** in your `cody-on-a-boat` project directory (`cd ~/code/cody-on-a-boat && claude` in a terminal).
3. **Copy the entire session file** (Cmd+A, Cmd+C).
4. **Paste it into Claude Code** as your first message in the new chat.
5. Claude Code will read the instructions and walk you through every step — running terminal commands, creating files, asking your permission for changes.
6. **Follow along.** When Claude Code asks "should I run this command?" or "should I make this change?", say yes unless something seems wrong. Read what's happening so you understand the project as it grows.
7. When the session finishes, **verify the result** using the verification checklist at the end of the file.
8. **Commit and push** the changes (Claude Code will tell you the exact commands).
9. **Close that chat** and move to the next session file.

Each session is meant to be small enough to fit in one Claude Code chat without filling up the context window. If a session feels stuck or way over scope, stop, ask in the chat what the blocker is, and consider starting a fresh chat with a more specific ask.

---

## Pre-Session-1 setup (do these things before starting Session 1)

You need three things installed and one online account.

### 1. Install Node.js (the JavaScript runtime)

Open Terminal (the Mac app, in `Applications/Utilities/`). Paste this and press enter:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```

This installs **nvm** (Node Version Manager). Close and reopen the Terminal. Then run:

```bash
nvm install 20
nvm use 20
node --version
```

You should see something like `v20.x.x`. If you do, Node is installed.

### 2. Install VS Code (the code editor)

Download from [code.visualstudio.com](https://code.visualstudio.com/) and drag to Applications.

### 3. Install Google Chrome (the browser you'll test in)

Download from [google.com/chrome](https://www.google.com/chrome/) if you don't already have it.

### 4. Create a GitHub account and an empty repository

- Sign up at [github.com](https://github.com) if you don't have an account.
- Click **New repository** (the green button on the home page after signing in).
- Name it `cody-on-a-boat`.
- Make it **Public** (required for the free version of GitHub Pages hosting).
- Check the box that says **Add a README file**.
- Click **Create repository**.
- On the new repo's page, click the green **<> Code** button → copy the HTTPS URL (looks like `https://github.com/yourname/cody-on-a-boat.git`).

### 5. Clone the empty repo to your computer

In Terminal:

```bash
mkdir -p ~/code
cd ~/code
git clone https://github.com/YOUR-USERNAME/cody-on-a-boat.git
cd cody-on-a-boat
```

Replace `YOUR-USERNAME` with your actual GitHub username.

### 6. Install Claude Code

Follow the Claude Code installation instructions for your OS. Once installed, you can start a session inside the project with:

```bash
cd ~/code/cody-on-a-boat
claude
```

You're now ready for Session 1.

---

## Glossary (for non-engineers)

- **Phaser** — the game engine we use. Like Unity or Godot but for web/JavaScript. It handles drawing sprites, playing sounds, detecting input, etc.
- **Vite** — a tool that lets you run the game in your browser while you're developing it, and also bundles all the files into a final shippable package when you're done.
- **Scene** — Phaser's word for a "screen." The main menu is a scene. The overworld is a scene. Each minigame is a scene. Scenes can run in parallel (the HUD is a scene that runs on top of the game).
- **Sprite** — a 2D image, usually a small character or object. Cody is a sprite.
- **Tilemap / tile** — the boat rooms are made of small (16×16 pixel) square images called tiles, arranged in a grid. We define them as JS arrays of tile IDs.
- **`pixelArt: true`** — a Phaser config setting that turns off image smoothing so pixel art stays crisp instead of getting blurry when scaled up.
- **gh-pages / GitHub Pages** — GitHub's free static website hosting. We push the built game to a special branch and GitHub serves it as a website.
- **itch.io** — a free site for indie game distribution. We'll upload there too.
- **CC0 / CC-BY** — free licenses for assets. CC0 = public domain, do anything. CC-BY = free but credit the author.
- **`npm`** — the package manager that comes with Node. It downloads JavaScript libraries (like Phaser) from the internet.
- **dev server** — when you run `npm run dev`, Vite starts a local web server (usually at `localhost:5173`) so you can test the game in your browser while you work.
- **build** — when you run `npm run build`, Vite produces a `dist/` folder containing the final, optimized files you'd ship to users.

---

## Conventions used in the session files

- `bash` code blocks contain terminal commands. Paste them into your terminal one at a time unless told otherwise.
- File paths look like `src/scenes/MainMenuScene.js`. They are relative to your `cody-on-a-boat` project root.
- "**You**" means the human (you reading this). "**Claude Code**" means the AI assistant in the chat. The session files are addressed to Claude Code — Claude Code will translate to actions and ask you for input when needed.
- Checklists like `- [ ] thing` are things you, the human, need to verify with your eyes (open the browser, click X, see Y).

---

## Recovery protocol (what to do if a session goes wrong)

Things will sometimes break. Here's how to handle it:

### "Claude Code is going in circles or making things worse"

1. Stop the session. Tell Claude Code "stop, let's not go further in this direction."
2. In a terminal: `git status` to see what's been changed.
3. If the changes are bad and not committed: `git restore .` (this throws away all uncommitted changes).
4. If you committed the bad changes: `git log --oneline` to see commits, then `git revert <commit-hash>` to undo a specific commit.
5. Start a fresh Claude Code chat. Paste the same session file again. Add a note at the top: "Last attempt got stuck on X. Please try a simpler approach to that step."

### "The dev server (`npm run dev`) won't start"

1. Make sure you're in the `cody-on-a-boat` directory: `pwd` should end in `cody-on-a-boat`.
2. Try `npm install` to make sure all libraries are downloaded.
3. Read the error message — usually it tells you which file has a syntax error.
4. Paste the error into Claude Code and ask for help.

### "I lost track of where I am"

1. Open `docs/PHASE_LOG.md` in your project. The last filled-in row tells you which session is done.
2. The next session is the next file in the `docs/` folder.

### "I don't understand what Claude Code is asking me"

Just ask. "What does that mean?" "Can you explain in simpler terms?" "Should I be worried about this?" Claude Code will not be offended and the answers help you learn.

---

## Success metric

You know you've succeeded when:

- You can open the game URL on your phone.
- You play through pipe → dinner → shower → nap, with the minigames in between.
- The credits roll: "Cody got off the boat."
- You text the URL to a friend and they play it.

Now open `01-SESSION-1-SCAFFOLD.md` when you're ready to start building.

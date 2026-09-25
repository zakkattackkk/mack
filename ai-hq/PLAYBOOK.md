# Phone Ops Playbook

You (Zak) live on your phone ~90% of the time.  
**Phone = commander. Mac mini = builder with browser. GitHub = shared memory.**

Tailscale is already set up. Use it so Claude Code on the Mac mini keeps full authority (Chrome, screenshots, site previews) even when you are on your phone.

---

## Machine roles

| Machine | Tailscale name (fill in) | Role |
|---|---|---|
| **Mac mini** | `_your-mini_` | Always-on HQ. Primary Claude Code. Browser + screenshots. |
| **Windows (i9 / 4080)** | `_your-windows_` | Heavy / GPU / Windows-only jobs. On demand. |
| **Laptop** | `_your-laptop_` | Travel. Prefer SSH into mini; or work local + push to GitHub. |
| **Phone** | Tailscale app | Commander only. SSH in — do not build websites on the phone. |

Fill in the Tailscale machine names once, then never guess.

---

## How you talk to Claude Code from your phone

You are **not** typing into a separate “phone Claude” that somehow sees the Mac.

You are opening a **terminal on the Mac mini over Tailscale**, then running Claude Code there.

### One-time phone setup

1. Install a SSH app: **Termius**, **Blink**, or **Prompt**.
2. Add host:
   - Host = Mac mini Tailscale name or `100.x.x.x` IP
   - User = your Mac username
   - Auth = key (preferred) or password
3. Confirm Tailscale is connected on the phone before you SSH.

### Every session (phone → mini)

1. Open Tailscale (phone) → connected.
2. Open Termius (or Blink) → SSH into **Mac mini**.
3. In that terminal you are *on the mini*. Run Claude Code the same way you do at the desk.
4. First message to Claude Code (copy/paste):

```text
Read ai-hq/MISSION.md, ai-hq/BACKLOG.md, and ai-hq/HANDOFF.md.
Continue from HANDOFF. Keep BACKLOG checkboxes honest.
When you preview the site, save screenshots under ai-hq/previews/ and commit + push.
```

5. When done, say:

```text
Update BACKLOG checkboxes, rewrite HANDOFF.md (max ~10 lines), append TODAY.md, commit and push.
```

That push is how phone-you, laptop-you, Windows-you, and Cursor CEO all see the same world.

---

## Screenshots you can see on your phone

Claude Code on the mini **can** open Chrome and take previews. Your phone Claude session cannot — so we put the pictures in GitHub.

### Rule for Claude Code (Mac mini)

After any visual check:

1. Save PNG under `ai-hq/previews/`  
   Name: `YYYY-MM-DD-short-description.png`
2. Commit + push.
3. Tell you the GitHub path or permalink.

### How you view them on the phone

- GitHub app or safari → this repo → `ai-hq/previews/`
- Or ask Claude Code: “push the preview and give me the GitHub link”

Same for Windows/laptop — they pull and see the same folder.

---

## Getting a Grok audit (or any phone download) to the Mac mini

**The Mac mini cannot see your phone’s Downloads folder.**  
Don’t say “look at what I just downloaded on my phone” — it has no path to that file.

Move the file into **GitHub** (or another shared place the mini already has). Preferred path = this repo’s inbox.

### Best path (recommended): phone → GitHub → mini

1. On phone, finish Grok audit → download / copy text.
2. Put it in the repo as:
   - `ai-hq/inbox/YYYY-MM-DD-grok-audit.md` (paste text), **or**
   - upload the file into `ai-hq/inbox/` via GitHub mobile (Add file → Upload).
3. Commit on GitHub (mobile can do this in the browser/app).
4. On Mac mini Claude Code (via Tailscale SSH), say:

```text
Pull latest. Read ai-hq/inbox/YYYY-MM-DD-grok-audit.md.
Pull the items I care about into BACKLOG.md as checkboxes.
Then start on the ones marked priority.
```

Optional: after processing, move the file to `ai-hq/audits/` and clear inbox.

### Other paths that also work

| Method | When to use |
|---|---|
| **Paste into the SSH/Claude chat** | Short audits. Paste the text in Termius while Claude Code is running on the mini. |
| **iCloud / Dropbox / Drive** synced to mini | Fine if that folder is already on the Mac; then give Claude the Mac path. |
| **AirDrop** (if you have an Apple device nearby) | Quick, but not your default — you’re usually phone-only. |
| **Email to yourself** | Works; Claude on mini opens Mail or you save attachment into `ai-hq/inbox/`. |

**Default habit:** everything important lands in `ai-hq/inbox/` on GitHub so mini, Windows, laptop, and Cursor all see it.

---

## “Do I type commands in Tailscale?”

Tailscale only **connects** the phone to the computers.  
You don’t “enter work into Tailscale.”

You:

1. Tailscale = VPN tunnel (on)
2. SSH app = door into Mac mini
3. Claude Code on mini = where you type “build this / check that / read the audit”

Same as sitting at the mini’s keyboard — just from your phone.

---

## Website workflow (phone-first)

1. **Mission** — one active goal in `MISSION.md` (what “done” looks like).
2. **Grok audit** (optional) → save to `ai-hq/inbox/` → promote picks into `BACKLOG.md`.
3. **Build on mini** via SSH → Claude Code edits site, opens Chrome, screenshots to `previews/`, pushes.
4. **You on phone** — open GitHub previews + HANDOFF; approve next steps.
5. **Rabbit-hole guard** — if Claude goes deep on one bug, you say: “Stop. Re-read MISSION and BACKLOG. What’s the next unchecked parent task?”

---

## When to use the Windows box

SSH into Windows (same Tailscale pattern) when you need:

- GPU / heavy local tools
- Windows-only browsers or software
- Something the mini shouldn’t burn CPU on

Still update `ai-hq/` on GitHub so the mini and phone stay aligned.

---

## Cursor CEO (this agent)

I read the same `ai-hq/` files in this repo.

Ask me:

- “Where are we?” → I read HANDOFF + BACKLOG + TODAY
- “Plan tomorrow” → I propose the next 3 moves from MISSION
- “Watch this audit” → I help turn inbox → BACKLOG checkboxes

I do not replace Mac mini Claude Code for Chrome previews on your LAN — I pair with it through GitHub.

---

## Quick cheat sheet

| I want to… | Do this |
|---|---|
| Build / preview site from phone | Tailscale → SSH Mac mini → Claude Code |
| See a screenshot on phone | Claude saves + pushes `ai-hq/previews/…` → open in GitHub |
| Give Claude a Grok audit | Upload/paste to `ai-hq/inbox/` on GitHub → tell mini to pull + read |
| Know what’s done | Read `BACKLOG.md` + `HANDOFF.md` |
| Start tomorrow | Read `HANDOFF.md`, then MISSION |

---

## Fill-in once

- Mac mini Tailscale name/IP:  
- Mac username:  
- Windows Tailscale name/IP:  
- Windows username:  
- GitHub repo URL:  
- Preferred SSH app on phone:  
